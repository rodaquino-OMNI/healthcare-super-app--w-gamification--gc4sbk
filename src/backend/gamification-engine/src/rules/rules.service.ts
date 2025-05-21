import { Injectable, NotFoundException } from '@nestjs/common'; // @nestjs/common ^10.3.0
import { InjectRepository } from '@nestjs/typeorm'; // @nestjs/typeorm 10.0.0
import { Repository } from 'typeorm'; // typeorm 0.3.17
import { Rule } from './entities/rule.entity';
import { AchievementsService } from '../achievements/achievements.service';
import { ProfilesService } from '../profiles/profiles.service';
import { QuestsService } from '../quests/quests.service';
import { RewardsService } from '../rewards/rewards.service';
import { Service } from '@app/shared/interfaces/service.interface';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { TelemetryService } from '@app/shared/telemetry/telemetry.service';
import { CircuitBreakerService } from '@app/shared/resilience/circuit-breaker.service';
import { RetryService } from '@app/shared/resilience/retry.service';
import { ProcessEventDto } from '../events/dto/process-event.dto';
import { VM } from 'vm2'; // vm2 3.9.15+ - Note: Consider migrating to isolated-vm for better security

// Import interfaces from @austa/interfaces package
import { 
  GamificationEvent, 
  EventType,
  JourneyType
} from '@austa/interfaces/gamification/events';
import { 
  Rule as RuleInterface, 
  RuleAction, 
  RuleActionType, 
  RuleCondition, 
  RuleContext,
  RuleEvaluationResult
} from '@austa/interfaces/gamification/rules';

/**
 * Service for managing and evaluating gamification rules.
 * 
 * This service is responsible for:
 * - Retrieving and managing rule definitions
 * - Evaluating rules against events from all journeys
 * - Executing rule actions when conditions are met
 * - Providing secure sandboxed execution of rule conditions
 */
@Injectable()
export class RulesService implements Service {
  /**
   * Injects the Rule repository and other services.
   */
  constructor(
    @InjectRepository(Rule)
    private readonly ruleRepository: Repository<Rule>,
    private readonly achievementsService: AchievementsService,
    private readonly profilesService: ProfilesService,
    private readonly questsService: QuestsService,
    private readonly rewardsService: RewardsService,
    private readonly logger: LoggerService,
    private readonly kafkaService: KafkaService,
    private readonly telemetryService: TelemetryService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly retryService: RetryService
  ) {}

  /**
   * Retrieves all rules.
   * @returns A promise that resolves to an array of rules.
   */
  async findAll(): Promise<Rule[]> {
    try {
      const startTime = Date.now();
      const rules = await this.ruleRepository.find();
      
      // Record telemetry for the operation
      this.telemetryService.recordDuration('rules.findAll', Date.now() - startTime);
      this.telemetryService.incrementCounter('rules.findAll.count');
      
      return rules;
    } catch (error) {
      this.logger.error('Failed to retrieve rules', { error: error.stack }, 'RulesService');
      this.telemetryService.incrementCounter('rules.findAll.error');
      
      throw new AppException(
        'Failed to retrieve rules',
        ErrorType.TECHNICAL,
        'GAME_013',
        {},
        error
      );
    }
  }

  /**
   * Retrieves a single rule by its ID.
   * @param id The rule ID to find
   * @returns A promise that resolves to a single rule.
   */
  async findOne(id: string): Promise<Rule> {
    try {
      const startTime = Date.now();
      const rule = await this.ruleRepository.findOneBy({ id });
      
      // Record telemetry for the operation
      this.telemetryService.recordDuration('rules.findOne', Date.now() - startTime);
      
      if (!rule) {
        this.telemetryService.incrementCounter('rules.findOne.notFound');
        throw new NotFoundException(`Rule with ID ${id} not found`);
      }
      
      return rule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to retrieve rule with ID ${id}`, { error: error.stack }, 'RulesService');
      this.telemetryService.incrementCounter('rules.findOne.error');
      
      throw new AppException(
        `Failed to retrieve rule with ID ${id}`,
        ErrorType.TECHNICAL,
        'GAME_014',
        { id },
        error
      );
    }
  }

  /**
   * Processes an event against all applicable rules.
   * 
   * @param event The event to process
   * @returns A promise that resolves when all rules have been processed
   */
  /**
   * Processes an event against all applicable rules.
   * 
   * @param event The event to process
   * @returns A promise that resolves when all rules have been processed
   */
  async processEvent(event: GamificationEvent): Promise<void> {
    const startTime = Date.now();
    const eventType = event.type;
    const userId = event.userId;
    const journey = event.journey;
    
    try {
      // Record telemetry for the event processing
      this.telemetryService.incrementCounter(`rules.processEvent.${eventType}`);
      this.telemetryService.incrementCounter(`rules.processEvent.journey.${journey || 'unknown'}`);
      
      // Log the event being processed
      this.logger.info(`Processing event ${eventType} for user ${userId}`, {
        userId,
        journey,
        eventType,
        eventData: JSON.stringify(event.data).substring(0, 200) // Truncate for logging
      }, 'RulesService');
      
      // Find all rules that apply to this event type
      const rules = await this.ruleRepository.find({
        where: { event: eventType }
      });
      
      this.logger.debug(`Found ${rules.length} rules for event ${eventType}`, {
        userId,
        journey,
        eventType,
        ruleCount: rules.length
      }, 'RulesService');
      
      // If no rules found, log and return early
      if (rules.length === 0) {
        this.telemetryService.incrementCounter('rules.processEvent.noRulesFound');
        return;
      }
      
      // Get user profile for rule evaluation
      const userProfile = await this.profilesService.findByUserId(userId);
      
      if (!userProfile) {
        this.logger.warn(`User profile not found for user ${userId}`, {
          userId,
          eventType
        }, 'RulesService');
        
        this.telemetryService.incrementCounter('rules.processEvent.userProfileNotFound');
        
        // Create a basic profile if not found to allow rule processing
        // This ensures events are still processed even if the profile doesn't exist yet
        const tempProfile = {
          userId,
          xp: 0,
          level: 1,
          createdAt: new Date()
        };
        
        // Process each rule with the temporary profile
        for (const rule of rules) {
          await this.processRule(rule, event, tempProfile);
        }
      } else {
        // Process each rule with the actual user profile
        for (const rule of rules) {
          await this.processRule(rule, event, userProfile);
        }
      }
      
      // Record the total duration of event processing
      this.telemetryService.recordDuration('rules.processEvent.totalDuration', Date.now() - startTime);
      
      // Log successful completion
      this.logger.debug(`Completed processing event ${eventType} for user ${userId}`, {
        userId,
        eventType,
        duration: Date.now() - startTime
      }, 'RulesService');
    } catch (error) {
      // Record telemetry for the error
      this.telemetryService.incrementCounter('rules.processEvent.error');
      
      // Log the error with detailed context
      this.logger.error(`Error processing event: ${error.message}`, { 
        error: error.stack,
        eventType,
        userId,
        journey
      }, 'RulesService');
      
      // Emit an error event for monitoring
      await this.kafkaService.emit('errors', {
        type: 'RULE_PROCESSING_ERROR',
        userId,
        data: {
          eventType,
          journey,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }).catch(emitError => {
        this.logger.error(`Failed to emit error event: ${emitError.message}`, {
          originalError: error.message
        }, 'RulesService');
      });
      
      // Throw a standardized exception
      throw new AppException(
        `Error processing event: ${error.message}`,
        ErrorType.TECHNICAL,
        'GAME_015',
        { eventType, userId, journey },
        error
      );
    }
  }

  /**
   * Processes a single rule against an event and user profile.
   * 
   * @param rule The rule to process
   * @param event The event data
   * @param userProfile The user's profile data
   * @returns A promise that resolves when the rule has been processed
   */
  private async processRule(rule: Rule, event: GamificationEvent, userProfile: any): Promise<void> {
    const ruleId = rule.id;
    const startTime = Date.now();
    
    try {
      // Use circuit breaker pattern to prevent cascading failures
      const result = await this.circuitBreakerService.execute(
        `rule-${ruleId}`,
        async () => {
          // Use retry pattern for transient failures
          return await this.retryService.execute(
            async () => {
              // Evaluate the rule condition
              const conditionMet = this.evaluateRule(rule, event, userProfile);
              
              if (conditionMet) {
                this.logger.debug(`Rule ${ruleId} condition met for user ${event.userId}`, {
                  ruleId,
                  userId: event.userId,
                  eventType: event.type
                }, 'RulesService');
                
                this.telemetryService.incrementCounter('rules.evaluation.conditionMet');
                
                // Execute rule actions
                await this.executeRuleActions(rule, event, userProfile);
              } else {
                this.telemetryService.incrementCounter('rules.evaluation.conditionNotMet');
              }
              
              return conditionMet;
            },
            {
              maxRetries: 3,
              retryDelay: 100,
              exponentialBackoff: true,
              retryCondition: (error) => {
                // Only retry on specific error types
                return error instanceof Error && 
                       !(error instanceof NotFoundException) &&
                       !error.message.includes('syntax');
              }
            }
          );
        },
        {
          failureThreshold: 5,
          resetTimeout: 30000,
          fallback: () => {
            this.logger.warn(`Circuit breaker open for rule ${ruleId}`, {
              ruleId,
              userId: event.userId
            }, 'RulesService');
            
            this.telemetryService.incrementCounter('rules.circuitBreaker.open');
            return false;
          }
        }
      );
      
      this.telemetryService.recordDuration('rules.processRule.duration', Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Error processing rule ${ruleId}: ${error.message}`, {
        error: error.stack,
        ruleId,
        userId: event.userId,
        eventType: event.type
      }, 'RulesService');
      
      this.telemetryService.incrementCounter('rules.processRule.error');
      
      // Don't throw here to prevent one rule failure from stopping other rules
      // Just log the error and continue
    }
  }

  /**
   * Evaluates a rule condition against an event and user profile.
   * Uses vm2 for secure sandboxed execution of rule conditions.
   * 
   * @param rule The rule to evaluate
   * @param event The event data
   * @param userProfile The user's profile data
   * @returns True if the rule condition is met, false otherwise
   */
  /**
   * Evaluates a rule condition against an event and user profile.
   * Uses vm2 for secure sandboxed execution of rule conditions.
   * 
   * @param rule The rule to evaluate
   * @param event The event data
   * @param userProfile The user's profile data
   * @returns True if the rule condition is met, false otherwise
   */
  private evaluateRule(rule: Rule, event: GamificationEvent, userProfile: any): boolean {
    const startTime = Date.now();
    
    try {
      // Create the rule context
      const ruleContext: RuleContext = {
        event,
        userProfile,
        journey: event.journey as JourneyType
      };
      
      // Create a secure sandbox for rule evaluation
      const sandbox = new VM({
        timeout: 500, // 500ms timeout to prevent long-running rules
        sandbox: {
          event,
          userProfile,
          context: ruleContext,
          console: {
            log: (...args: any[]) => this.logger.debug(args.join(' '), {}, 'RuleEvaluation')
          }
        },
        eval: false, // Disable eval for security
        wasm: false, // Disable WebAssembly for security
      });
      
      // Prepare the condition code with proper error handling
      const conditionCode = `
        (function() {
          try {
            // Execute the rule condition with the provided context
            return ${rule.condition};
          } catch (error) {
            // Log the error in the sandbox
            console.log('Error in rule condition: ' + error.message);
            return false;
          }
        })();
      `;
      
      // Execute the condition in the sandbox
      const result = sandbox.run(conditionCode);
      
      // Record telemetry
      this.telemetryService.recordDuration('rules.evaluateRule.duration', Date.now() - startTime);
      this.telemetryService.incrementCounter(`rules.evaluateRule.${result ? 'success' : 'failure'}`);
      
      // Log the result for debugging
      this.logger.debug(`Rule ${rule.id} evaluation result: ${result}`, {
        ruleId: rule.id,
        eventType: event.type,
        userId: event.userId,
        result
      }, 'RulesService');
      
      return !!result;
    } catch (error) {
      this.logger.error(`Error evaluating rule ${rule.id}: ${error.message}`, {
        error: error.stack,
        ruleId: rule.id,
        condition: rule.condition,
        eventType: event.type,
        userId: event.userId
      }, 'RulesService');
      
      this.telemetryService.incrementCounter('rules.evaluateRule.error');
      return false; // Fail closed on errors
    }
  }

  /**
   * Executes the actions defined in a rule.
   * 
   * @param rule The rule containing actions to execute
   * @param event The event that triggered the rule
   * @param userProfile The user's profile data
   */
  private async executeRuleActions(rule: Rule, event: GamificationEvent, userProfile: any): Promise<void> {
    try {
      const actions = JSON.parse(rule.actions);
      
      for (const action of actions) {
        await this.executeAction(action, event, userProfile, rule.id);
      }
    } catch (error) {
      this.logger.error(`Error executing actions for rule ${rule.id}: ${error.message}`, {
        error: error.stack,
        ruleId: rule.id,
        userId: event.userId
      }, 'RulesService');
      
      this.telemetryService.incrementCounter('rules.executeRuleActions.error');
    }
  }

  /**
   * Executes a single rule action.
   * 
   * @param action The action to execute
   * @param event The event that triggered the rule
   * @param userProfile The user's profile data
   * @param ruleId The ID of the rule being executed
   */
  /**
   * Executes a single rule action.
   * 
   * @param action The action to execute
   * @param event The event that triggered the rule
   * @param userProfile The user's profile data
   * @param ruleId The ID of the rule being executed
   */
  private async executeAction(action: RuleAction, event: GamificationEvent, userProfile: any, ruleId: string): Promise<void> {
    const startTime = Date.now();
    const actionType = action.type;
    const userId = event.userId;
    const eventType = event.type;
    const journey = event.journey;
    
    try {
      // Create metadata for tracking the action source
      const metadata = {
        source: 'rule',
        ruleId,
        eventType,
        journey,
        timestamp: new Date().toISOString()
      };
      
      // Log the action being executed
      this.logger.debug(`Executing action ${actionType} for rule ${ruleId}`, {
        ruleId,
        actionType,
        userId,
        eventType,
        journey
      }, 'RulesService');
      
      switch (actionType) {
        case RuleActionType.AWARD_XP:
          // Award XP to the user
          await this.profilesService.addXp(userId, action.value, metadata);
          
          // Record telemetry
          this.telemetryService.incrementCounter('rules.action.awardXp');
          this.telemetryService.recordValue('rules.action.awardXp.value', action.value);
          break;
          
        case RuleActionType.PROGRESS_ACHIEVEMENT:
          // Progress an achievement for the user
          await this.achievementsService.progressAchievement(
            userId,
            action.achievementId,
            action.value || 1,
            metadata
          );
          
          // Record telemetry
          this.telemetryService.incrementCounter('rules.action.progressAchievement');
          this.telemetryService.recordValue('rules.action.progressAchievement.value', action.value || 1);
          break;
          
        case RuleActionType.PROGRESS_QUEST:
          // Progress a quest for the user
          await this.questsService.progressQuest(
            userId,
            action.questId,
            action.value || 1,
            metadata
          );
          
          // Record telemetry
          this.telemetryService.incrementCounter('rules.action.progressQuest');
          this.telemetryService.recordValue('rules.action.progressQuest.value', action.value || 1);
          break;
          
        case RuleActionType.GRANT_REWARD:
          // Grant a reward to the user
          await this.rewardsService.grantReward(
            userId,
            action.rewardId,
            metadata
          );
          
          // Record telemetry
          this.telemetryService.incrementCounter('rules.action.grantReward');
          break;
          
        case RuleActionType.SEND_NOTIFICATION:
          // Send a notification about the rule being triggered
          // This is handled by the Kafka service to decouple notification sending
          await this.kafkaService.emit('notifications', {
            type: 'RULE_TRIGGERED',
            userId,
            data: {
              ruleId,
              eventType,
              journey,
              message: action.message || 'Rule triggered',
              metadata
            }
          });
          
          // Record telemetry
          this.telemetryService.incrementCounter('rules.action.sendNotification');
          break;
          
        default:
          this.logger.warn(`Unknown action type: ${actionType}`, {
            ruleId,
            actionType,
            userId
          }, 'RulesService');
          
          this.telemetryService.incrementCounter('rules.action.unknownType');
      }
      
      // Record the duration of the action execution
      this.telemetryService.recordDuration('rules.executeAction.duration', Date.now() - startTime);
    } catch (error) {
      // Log the error with detailed context
      this.logger.error(`Error executing action ${actionType} for rule ${ruleId}: ${error.message}`, {
        error: error.stack,
        ruleId,
        actionType,
        userId,
        eventType,
        journey
      }, 'RulesService');
      
      // Record telemetry for the error
      this.telemetryService.incrementCounter(`rules.action.${actionType}.error`);
      
      // Emit an event for the error to be handled by monitoring systems
      this.kafkaService.emit('errors', {
        type: 'RULE_ACTION_ERROR',
        userId,
        data: {
          ruleId,
          actionType,
          eventType,
          journey,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }).catch(emitError => {
        this.logger.error(`Failed to emit error event: ${emitError.message}`, {
          originalError: error.message
        }, 'RulesService');
      });
    }
  }
}
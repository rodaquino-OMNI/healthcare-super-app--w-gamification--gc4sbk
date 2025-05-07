import { Injectable, NotFoundException } from '@nestjs/common'; // @nestjs/common ^10.3.0
import { InjectRepository } from '@nestjs/typeorm'; // @nestjs/typeorm 10.0.0
import { Repository } from 'typeorm'; // typeorm 0.3.20
import { VM } from 'vm2'; // vm2 ^3.9.19
import { CircuitBreaker } from '@app/shared/utils/circuit-breaker';
import { retry } from '@app/shared/utils/retry';
import { Rule } from './entities/rule.entity';
import { AchievementsService } from '../achievements/achievements.service';
import { ProfilesService } from '../profiles/profiles.service';
import { QuestsService } from '../quests/quests.service';
import { RewardsService } from '../rewards/rewards.service';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { TelemetryService } from '@app/shared/telemetry/telemetry.service';
import { GamificationEvent, RuleEvaluationResult } from '@austa/interfaces/gamification';
import { ProcessEventDto } from '../events/dto/process-event.dto';

/**
 * Service for managing and evaluating gamification rules.
 * Handles rule retrieval, evaluation, and execution across all journeys.
 */
@Injectable()
export class RulesService {
  private readonly ruleEvaluationBreaker: CircuitBreaker;

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
    private readonly telemetryService: TelemetryService
  ) {
    // Initialize circuit breaker for rule evaluation
    this.ruleEvaluationBreaker = new CircuitBreaker({
      name: 'rule-evaluation',
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      fallback: () => ({ success: false, error: 'Circuit open' }),
    });
  }

  /**
   * Retrieves all rules.
   * @returns A promise that resolves to an array of rules.
   */
  async findAll(): Promise<Rule[]> {
    try {
      return await this.ruleRepository.find();
    } catch (error) {
      this.logger.error('Failed to retrieve rules', error.stack, 'RulesService');
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
      const rule = await this.ruleRepository.findOneBy({ id });
      
      if (!rule) {
        throw new NotFoundException(`Rule with ID ${id} not found`);
      }
      
      return rule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to retrieve rule with ID ${id}`, error.stack, 'RulesService');
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
   * Evaluates a rule against a given event and user profile using a secure sandbox.
   * @param rule The rule to evaluate
   * @param event The event data (type-safe GamificationEvent)
   * @param userProfile The user's profile data
   * @returns A promise that resolves to a RuleEvaluationResult
   */
  async evaluateRule(
    rule: Rule, 
    event: GamificationEvent, 
    userProfile: any
  ): Promise<RuleEvaluationResult> {
    const startTime = Date.now();
    const ruleId = rule.id;
    
    // Start telemetry span for rule evaluation
    const span = this.telemetryService.startSpan('rule.evaluate', {
      ruleId,
      eventType: event.type,
      userId: event.userId,
      journey: event.journey
    });

    try {
      // Use circuit breaker pattern to prevent cascading failures
      return await this.ruleEvaluationBreaker.execute(async () => {
        // Use retry mechanism with exponential backoff for transient failures
        return await retry(
          async () => {
            // Create a secure sandbox using vm2
            const vm = new VM({
              timeout: 1000, // 1 second timeout for rule evaluation
              sandbox: {
                event,
                userProfile,
              },
              eval: false, // Disable eval
              wasm: false, // Disable WebAssembly
            });

            // Evaluate the rule condition in the sandbox
            const conditionMet = vm.run(`(function() { return ${rule.condition}; })()`);

            // Record telemetry metrics
            this.telemetryService.recordMetric('rule.evaluation.duration', Date.now() - startTime, {
              ruleId,
              eventType: event.type,
              result: conditionMet ? 'satisfied' : 'not_satisfied',
            });

            // If condition is met, parse and return the actions to be executed
            if (conditionMet) {
              const actions = JSON.parse(rule.actions);
              return { 
                success: true, 
                conditionMet: true, 
                actions,
                ruleId: rule.id
              };
            }

            return { 
              success: true, 
              conditionMet: false,
              actions: [],
              ruleId: rule.id
            };
          },
          {
            retries: 3,
            minDelay: 100,
            maxDelay: 1000,
            factor: 2,
            onRetry: (error, attempt) => {
              this.logger.warn(
                `Retry attempt ${attempt} for rule ${ruleId} evaluation: ${error.message}`,
                'RulesService'
              );
              this.telemetryService.recordMetric('rule.evaluation.retry', 1, {
                ruleId,
                attempt,
                error: error.message,
              });
            },
          }
        );
      });
    } catch (error) {
      // Record error in telemetry
      this.telemetryService.recordError('rule.evaluation.error', error, {
        ruleId,
        eventType: event.type,
      });

      this.logger.error(
        `Error evaluating rule ${ruleId}: ${error.message}`,
        error.stack,
        'RulesService'
      );

      return { 
        success: false, 
        error: error.message,
        ruleId: rule.id
      };
    } finally {
      // End telemetry span
      span.end();
    }
  }

  /**
   * Processes an event against all applicable rules.
   * @param eventDto The event data transfer object
   * @returns A promise that resolves when all rules have been processed
   */
  async processEvent(eventDto: ProcessEventDto): Promise<void> {
    const span = this.telemetryService.startSpan('rules.processEvent', {
      eventType: eventDto.type,
      userId: eventDto.userId,
      journey: eventDto.journey
    });

    try {
      // Convert DTO to type-safe GamificationEvent
      const event: GamificationEvent = {
        type: eventDto.type,
        userId: eventDto.userId,
        data: eventDto.data,
        journey: eventDto.journey,
        timestamp: new Date().toISOString()
      };

      // Get user profile
      const userProfile = await this.profilesService.findOne(event.userId);
      if (!userProfile) {
        throw new NotFoundException(`User profile with ID ${event.userId} not found`);
      }

      // Find all rules that match this event type
      const rules = await this.ruleRepository.findBy({ event: event.type });
      this.logger.debug(
        `Found ${rules.length} rules for event type ${event.type}`,
        'RulesService'
      );

      // Record metric for rules found
      this.telemetryService.recordMetric('rules.matched', rules.length, {
        eventType: event.type,
        journey: event.journey || 'unknown'
      });

      // Evaluate each rule
      const evaluationResults = await Promise.all(
        rules.map(rule => this.evaluateRule(rule, event, userProfile))
      );

      // Process actions for rules where conditions were met
      const actionsToExecute = evaluationResults
        .filter(result => result.success && result.conditionMet)
        .flatMap(result => result.actions.map(action => ({ ...action, ruleId: result.ruleId })));

      // Record metric for actions to execute
      this.telemetryService.recordMetric('rules.actions.count', actionsToExecute.length, {
        eventType: event.type,
        journey: event.journey || 'unknown'
      });

      // Execute actions
      for (const action of actionsToExecute) {
        await this.executeAction(action, event, userProfile);
      }
    } catch (error) {
      this.logger.error(
        `Error processing event ${eventDto.type}: ${error.message}`,
        error.stack,
        'RulesService'
      );

      // Record error in telemetry
      this.telemetryService.recordError('rules.processEvent.error', error, {
        eventType: eventDto.type,
        userId: eventDto.userId,
      });

      throw new AppException(
        `Failed to process event ${eventDto.type}`,
        ErrorType.TECHNICAL,
        'GAME_015',
        { eventType: eventDto.type },
        error
      );
    } finally {
      // End telemetry span
      span.end();
    }
  }

  /**
   * Executes a single action based on its type.
   * @param action The action to execute
   * @param event The original event that triggered the rule
   * @param userProfile The user's profile
   */
  private async executeAction(action: any, event: GamificationEvent, userProfile: any): Promise<void> {
    const actionSpan = this.telemetryService.startSpan('rules.executeAction', {
      actionType: action.type,
      ruleId: action.ruleId,
      userId: event.userId
    });

    try {
      switch (action.type) {
        case 'AWARD_XP':
          await this.profilesService.addXp(event.userId, action.value);
          break;

        case 'PROGRESS_ACHIEVEMENT':
          await this.achievementsService.progressAchievement(
            event.userId,
            action.achievementId,
            action.value || 1
          );
          break;

        case 'PROGRESS_QUEST':
          await this.questsService.progressQuest(
            event.userId,
            action.questId,
            action.value || 1
          );
          break;

        case 'GRANT_REWARD':
          await this.rewardsService.grantReward(
            event.userId,
            action.rewardId
          );
          break;

        default:
          this.logger.warn(
            `Unknown action type: ${action.type}`,
            'RulesService'
          );
      }

      // Record successful action execution
      this.telemetryService.recordMetric('rules.action.executed', 1, {
        actionType: action.type,
        ruleId: action.ruleId,
        journey: event.journey || 'unknown'
      });
    } catch (error) {
      this.logger.error(
        `Error executing action ${action.type}: ${error.message}`,
        error.stack,
        'RulesService'
      );

      // Record error in telemetry
      this.telemetryService.recordError('rules.action.error', error, {
        actionType: action.type,
        ruleId: action.ruleId,
        userId: event.userId,
      });

      throw new AppException(
        `Failed to execute action ${action.type}`,
        ErrorType.TECHNICAL,
        'GAME_016',
        { actionType: action.type },
        error
      );
    } finally {
      // End action span
      actionSpan.end();
    }
  }
}
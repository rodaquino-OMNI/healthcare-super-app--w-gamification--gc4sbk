import { Injectable, OnModuleInit } from '@nestjs/common';
import { AchievementsService } from '@app/gamification/achievements/achievements.service';
import { ProfilesService } from '@app/gamification/profiles/profiles.service';
import { RulesService } from '@app/gamification/rules/rules.service';
import { RewardsService } from '@app/gamification/rewards/rewards.service';
import { QuestsService } from '@app/gamification/quests/quests.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { CircuitBreakerService } from '@app/shared/circuit-breaker/circuit-breaker.service';
import { RetryService } from '@app/shared/retry/retry.service';

// Import standardized interfaces from @austa/interfaces
import { 
  GamificationEvent, 
  EventType, 
  EventPayload,
  EventProcessingResult,
  EventErrorType
} from '@austa/interfaces/gamification';

// Import error handling utilities
import { 
  EventProcessingError, 
  RetryableError, 
  NonRetryableError 
} from '@app/errors/journey/gamification';

/**
 * Service responsible for processing gamification events from all journeys in the AUSTA SuperApp.
 * It receives events, evaluates rules, and updates user profiles with points and achievements.
 * Acts as the central hub for the gamification engine with enhanced error handling and retry mechanisms.
 */
@Injectable()
export class EventsService implements OnModuleInit {
  private readonly RETRY_OPTIONS = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    backoffFactor: 2,
  };

  private readonly DLQ_TOPIC = 'gamification-events-dlq';
  private readonly EVENT_TOPIC = 'gamification-events';
  
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly profilesService: ProfilesService,
    private readonly rulesService: RulesService,
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly rewardsService: RewardsService,
    private readonly questsService: QuestsService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly retryService: RetryService
  ) {}

  /**
   * Initialize Kafka consumers and configure error handling on module initialization
   */
  async onModuleInit() {
    this.logger.log('Initializing EventsService with enhanced error handling', {
      context: 'EventsService',
      component: 'initialization'
    });
    
    // Configure Kafka consumer with DLQ and retry strategies
    await this.kafkaService.configureConsumer({
      topic: this.EVENT_TOPIC,
      groupId: 'gamification-engine',
      deadLetterQueue: this.DLQ_TOPIC,
      retryStrategy: {
        retries: this.RETRY_OPTIONS.maxRetries,
        initialBackoffMs: this.RETRY_OPTIONS.initialDelayMs,
        maxBackoffMs: this.RETRY_OPTIONS.maxDelayMs,
        backoffFactor: this.RETRY_OPTIONS.backoffFactor
      },
      handler: this.handleEvent.bind(this)
    });
  }

  /**
   * Kafka message handler that processes incoming events
   * @param message The Kafka message containing a gamification event
   */
  private async handleEvent(message: any) {
    const startTime = Date.now();
    const correlationId = message.headers?.correlationId || `event-${Date.now()}`;
    
    try {
      const event = message.value as GamificationEvent;
      
      this.logger.log('Processing gamification event', {
        eventType: event.type,
        userId: event.userId,
        journey: event.journey,
        correlationId,
        context: 'EventsService'
      });
      
      const result = await this.processEvent(event, correlationId);
      
      const processingTime = Date.now() - startTime;
      this.logger.log('Event processing completed successfully', {
        eventType: event.type,
        userId: event.userId,
        journey: event.journey,
        processingTimeMs: processingTime,
        pointsAwarded: result.points,
        correlationId,
        context: 'EventsService'
      });
      
      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('Failed to process event', {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        correlationId,
        context: 'EventsService',
        isRetryable: error instanceof RetryableError
      });
      
      // Determine if the error is retryable
      if (error instanceof RetryableError) {
        throw error; // Let Kafka retry mechanism handle it
      } else if (error instanceof NonRetryableError) {
        // Send to DLQ immediately without retrying
        await this.sendToDLQ(message, error, correlationId);
        return { success: false, error: error.message };
      } else {
        // For unexpected errors, treat as non-retryable
        const wrappedError = new NonRetryableError(
          'Unexpected error during event processing',
          { cause: error, correlationId }
        );
        await this.sendToDLQ(message, wrappedError, correlationId);
        return { success: false, error: wrappedError.message };
      }
    }
  }

  /**
   * Sends failed events to the Dead Letter Queue with error context
   * @param message The original Kafka message
   * @param error The error that caused the failure
   * @param correlationId Correlation ID for tracing
   */
  private async sendToDLQ(message: any, error: Error, correlationId: string) {
    try {
      await this.kafkaService.produce(this.DLQ_TOPIC, {
        originalMessage: message.value,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        metadata: {
          correlationId,
          originalTopic: this.EVENT_TOPIC,
          failedAt: new Date().toISOString(),
          retryCount: message.headers?.retryCount || 0
        }
      });
      
      this.logger.log('Event sent to DLQ', {
        topic: this.DLQ_TOPIC,
        correlationId,
        errorType: error.name,
        context: 'EventsService'
      });
    } catch (dlqError) {
      this.logger.error('Failed to send event to DLQ', {
        error: dlqError.message,
        originalError: error.message,
        correlationId,
        context: 'EventsService'
      });
    }
  }

  /**
   * Processes a given event by evaluating rules and updating the user's profile.
   * This is the main entry point for handling all gamification events across all journeys.
   * Implements retry mechanisms and circuit breaker patterns for resilience.
   * 
   * @param event The event to process containing type, userId, data, and optional journey
   * @param correlationId Correlation ID for tracing and logging
   * @returns A promise that resolves with the result of the event processing
   */
  async processEvent(event: GamificationEvent, correlationId?: string): Promise<EventProcessingResult> {
    const traceId = correlationId || `event-${Date.now()}`;
    
    this.logger.log('Processing event', {
      eventType: event.type,
      userId: event.userId,
      journey: event.journey,
      correlationId: traceId,
      context: 'EventsService.processEvent'
    });
    
    try {
      // Get the user's game profile with circuit breaker pattern
      let gameProfile = await this.circuitBreaker.execute(
        'profilesService.findById',
        () => this.retryService.execute(
          () => this.profilesService.findById(event.userId),
          this.RETRY_OPTIONS
        )
      ).catch(async (error) => {
        // If profile doesn't exist, create it
        if (error.name === 'EntityNotFoundError') {
          this.logger.log('Creating new game profile', {
            userId: event.userId,
            correlationId: traceId,
            context: 'EventsService.processEvent'
          });
          
          return this.circuitBreaker.execute(
            'profilesService.create',
            () => this.retryService.execute(
              () => this.profilesService.create(event.userId),
              this.RETRY_OPTIONS
            )
          );
        }
        throw new RetryableError('Failed to retrieve or create user profile', {
          cause: error,
          userId: event.userId,
          correlationId: traceId
        });
      });
      
      // Evaluate rules against this event
      const rules = await this.circuitBreaker.execute(
        'rulesService.findAll',
        () => this.retryService.execute(
          () => this.rulesService.findAll(),
          this.RETRY_OPTIONS
        )
      );
      
      const matchingRules = rules.filter(rule => rule.event === event.type);
      
      if (matchingRules.length === 0) {
        this.logger.log('No rules matched event', {
          eventType: event.type,
          userId: event.userId,
          correlationId: traceId,
          context: 'EventsService.processEvent'
        });
        
        return { 
          success: true, 
          points: 0, 
          message: 'No rules matched this event',
          achievements: [],
          quests: []
        };
      }
      
      let totalPoints = 0;
      const achievementUpdates = [];
      const questUpdates = [];
      
      // Process each matching rule
      for (const rule of matchingRules) {
        const ruleSatisfied = await this.circuitBreaker.execute(
          'rulesService.evaluateRule',
          () => this.rulesService.evaluateRule(event, gameProfile)
        );
        
        if (ruleSatisfied) {
          try {
            // Parse and process rule actions
            const actions = typeof rule.actions === 'string' 
              ? JSON.parse(rule.actions) 
              : rule.actions;
            
            for (const action of actions) {
              switch (action.type) {
                case 'AWARD_XP':
                  totalPoints += Number(action.value);
                  break;
                  
                case 'PROGRESS_ACHIEVEMENT':
                  achievementUpdates.push({
                    id: action.achievementId,
                    progress: action.value
                  });
                  break;
                  
                case 'PROGRESS_QUEST':
                  questUpdates.push({
                    id: action.questId,
                    progress: action.value
                  });
                  break;
                  
                default:
                  this.logger.warn('Unknown action type', {
                    actionType: action.type,
                    ruleId: rule.id,
                    correlationId: traceId,
                    context: 'EventsService.processEvent'
                  });
              }
            }
          } catch (error) {
            this.logger.error('Failed to process rule actions', {
              error: error.message,
              ruleId: rule.id,
              correlationId: traceId,
              context: 'EventsService.processEvent'
            });
            
            throw new RetryableError('Failed to process rule actions', {
              cause: error,
              ruleId: rule.id,
              correlationId: traceId
            });
          }
        }
      }
      
      // Update user's profile if points were earned
      if (totalPoints > 0) {
        const updatedProfile = await this.circuitBreaker.execute(
          'profilesService.update',
          () => this.retryService.execute(
            () => this.profilesService.update(event.userId, {
              xp: gameProfile.xp + totalPoints
            }),
            this.RETRY_OPTIONS
          )
        );
        
        this.logger.log('User earned XP', {
          userId: event.userId,
          xpEarned: totalPoints,
          newTotal: updatedProfile.xp,
          correlationId: traceId,
          context: 'EventsService.processEvent'
        });
        
        // Publish event for XP earned
        await this.circuitBreaker.execute(
          'kafkaService.produce',
          () => this.kafkaService.produce(this.EVENT_TOPIC, {
            type: EventType.XP_EARNED,
            userId: event.userId,
            data: {
              amount: totalPoints,
              sourceEvent: event.type,
              journey: event.journey
            },
            journey: event.journey,
            version: '1.0',
            timestamp: new Date().toISOString(),
            correlationId: traceId
          })
        );
        
        // Check for level up
        if (updatedProfile.level > gameProfile.level) {
          this.logger.log('User leveled up', {
            userId: event.userId,
            oldLevel: gameProfile.level,
            newLevel: updatedProfile.level,
            correlationId: traceId,
            context: 'EventsService.processEvent'
          });
          
          // Publish level up event
          await this.circuitBreaker.execute(
            'kafkaService.produce',
            () => this.kafkaService.produce(this.EVENT_TOPIC, {
              type: EventType.LEVEL_UP,
              userId: event.userId,
              data: {
                oldLevel: gameProfile.level,
                newLevel: updatedProfile.level
              },
              journey: event.journey,
              version: '1.0',
              timestamp: new Date().toISOString(),
              correlationId: traceId
            })
          );
        }
        
        // Process achievement updates
        if (achievementUpdates.length > 0) {
          await this.processAchievementUpdates(event.userId, achievementUpdates, traceId);
        }
        
        // Process quest updates
        if (questUpdates.length > 0) {
          await this.processQuestUpdates(event.userId, questUpdates, traceId);
        }
        
        return {
          success: true,
          points: totalPoints,
          profile: updatedProfile,
          achievements: achievementUpdates,
          quests: questUpdates
        };
      }
      
      this.logger.log('Event processed with no point changes', {
        userId: event.userId,
        eventType: event.type,
        correlationId: traceId,
        context: 'EventsService.processEvent'
      });
      
      return {
        success: true,
        points: 0,
        message: 'Event processed but no points earned',
        achievements: achievementUpdates,
        quests: questUpdates
      };
    } catch (error) {
      this.logger.error('Failed to process event', {
        error: error.message,
        stack: error.stack,
        userId: event.userId,
        eventType: event.type,
        correlationId: traceId,
        context: 'EventsService.processEvent'
      });
      
      // Classify and wrap the error for proper handling
      if (error instanceof RetryableError || error instanceof NonRetryableError) {
        throw error;
      }
      
      // Determine if error is retryable based on type
      const isRetryable = this.isRetryableError(error);
      
      if (isRetryable) {
        throw new RetryableError('Retryable error during event processing', {
          cause: error,
          userId: event.userId,
          eventType: event.type,
          correlationId: traceId
        });
      } else {
        throw new NonRetryableError('Non-retryable error during event processing', {
          cause: error,
          userId: event.userId,
          eventType: event.type,
          correlationId: traceId
        });
      }
    }
  }

  /**
   * Process achievement updates for a user
   * @param userId User ID
   * @param achievements Achievement updates to process
   * @param correlationId Correlation ID for tracing
   */
  private async processAchievementUpdates(userId: string, achievements: any[], correlationId: string) {
    for (const achievement of achievements) {
      try {
        await this.circuitBreaker.execute(
          'achievementsService.updateProgress',
          () => this.retryService.execute(
            () => this.achievementsService.updateProgress(userId, achievement.id, achievement.progress),
            this.RETRY_OPTIONS
          )
        );
        
        this.logger.log('Updated achievement progress', {
          userId,
          achievementId: achievement.id,
          progress: achievement.progress,
          correlationId,
          context: 'EventsService.processAchievementUpdates'
        });
      } catch (error) {
        this.logger.error('Failed to update achievement progress', {
          error: error.message,
          userId,
          achievementId: achievement.id,
          correlationId,
          context: 'EventsService.processAchievementUpdates'
        });
        
        // Continue processing other achievements even if one fails
      }
    }
  }

  /**
   * Process quest updates for a user
   * @param userId User ID
   * @param quests Quest updates to process
   * @param correlationId Correlation ID for tracing
   */
  private async processQuestUpdates(userId: string, quests: any[], correlationId: string) {
    for (const quest of quests) {
      try {
        await this.circuitBreaker.execute(
          'questsService.updateProgress',
          () => this.retryService.execute(
            () => this.questsService.updateProgress(userId, quest.id, quest.progress),
            this.RETRY_OPTIONS
          )
        );
        
        this.logger.log('Updated quest progress', {
          userId,
          questId: quest.id,
          progress: quest.progress,
          correlationId,
          context: 'EventsService.processQuestUpdates'
        });
      } catch (error) {
        this.logger.error('Failed to update quest progress', {
          error: error.message,
          userId,
          questId: quest.id,
          correlationId,
          context: 'EventsService.processQuestUpdates'
        });
        
        // Continue processing other quests even if one fails
      }
    }
  }

  /**
   * Determines if an error is retryable based on its type and properties
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryableError(error: any): boolean {
    // Network errors are typically retryable
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ECONNRESET' ||
        error.name === 'TimeoutError') {
      return true;
    }
    
    // Database connection errors are typically retryable
    if (error.name === 'PrismaClientInitializationError' ||
        error.name === 'PrismaClientRustPanicError') {
      return true;
    }
    
    // Kafka-specific errors that are retryable
    if (error.name === 'KafkaJSConnectionError' ||
        error.name === 'KafkaJSRequestTimeoutError') {
      return true;
    }
    
    // HTTP 5xx errors are typically retryable
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    // Default to non-retryable for safety
    return false;
  }
}
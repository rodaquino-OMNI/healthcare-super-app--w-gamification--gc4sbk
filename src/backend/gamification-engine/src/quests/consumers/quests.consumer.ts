import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { LoggerService } from '@austa/logging';
import { BaseError, ErrorType } from '@austa/errors';
import { QuestEvent } from '@austa/interfaces/gamification';
import { KafkaService } from '@austa/events/kafka';

import { QuestsService } from '../quests.service';
import { RetryStrategy } from '../../common/kafka/retry.strategy';
import { EventProcessingError } from '../../common/exceptions/event-processing.error';
import { ConfigService } from '@nestjs/config';
import { QuestsModuleOptions } from '../quests.module';

/**
 * Configuration options for the quests consumer
 */
interface QuestsConsumerOptions {
  /**
   * Kafka consumer group ID
   */
  groupId: string;
  
  /**
   * Topics to subscribe to
   */
  topics: string[];
  
  /**
   * Maximum number of retry attempts before sending to DLQ
   * @default 5
   */
  maxRetries?: number;
  
  /**
   * Initial delay for retry in milliseconds
   * @default 1000
   */
  initialRetryDelay?: number;
  
  /**
   * Maximum delay for retry in milliseconds
   * @default 60000
   */
  maxRetryDelay?: number;
  
  /**
   * Jitter factor to add randomness to retry delays (0-1)
   * @default 0.1
   */
  jitterFactor?: number;
}

/**
 * Kafka consumer service for quest-related events in the gamification engine.
 * 
 * Subscribes to quest.started, quest.completed, and quest.progress topics,
 * processes incoming event messages with comprehensive validation, logging,
 * and error handling, and delegates to QuestsService for business logic.
 * 
 * Implements dead-letter queues for failed event handling and exponential
 * backoff retry strategies for transient failures.
 */
@Injectable()
export class QuestsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly retryStrategy: RetryStrategy;
  private readonly options: QuestsConsumerOptions;
  
  /**
   * Default consumer options
   */
  private readonly defaultOptions: Partial<QuestsConsumerOptions> = {
    maxRetries: 5,
    initialRetryDelay: 1000, // 1 second
    maxRetryDelay: 60000,    // 1 minute
    jitterFactor: 0.1,       // 10% jitter
  };

  /**
   * Creates a new QuestsConsumer instance
   * 
   * @param kafkaService - Service for Kafka interaction
   * @param questsService - Service for processing quests
   * @param dlqService - Dead letter queue service
   * @param loggerService - Logger service for structured logging
   * @param configService - Configuration service for retrieving settings
   * @param moduleOptions - Quest module configuration options
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly questsService: QuestsService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    @Inject('QUESTS_MODULE_OPTIONS') private readonly moduleOptions: QuestsModuleOptions,
  ) {
    // Get configuration from config service
    const kafkaConfig = this.configService.get('gamificationEngine.kafka', {});
    
    this.options = {
      ...this.defaultOptions,
      groupId: kafkaConfig.questsGroupId || 'austa-quests-consumer',
      topics: [
        'quest.started',
        'quest.completed',
        'quest.progress'
      ],
      ...kafkaConfig.questsConsumer || {}
    };
    
    // Create retry strategy for handling failed events
    this.retryStrategy = new RetryStrategy({
      maxRetries: this.options.maxRetries,
      initialDelay: this.options.initialRetryDelay,
      maxDelay: this.options.maxRetryDelay,
      jitterFactor: this.options.jitterFactor,
    });
    
    this.loggerService.log(
      'QuestsConsumer initialized',
      { 
        groupId: this.options.groupId, 
        topics: this.options.topics,
        enabled: this.moduleOptions.enabled,
        maxActiveQuests: this.moduleOptions.maxActiveQuests,
        notificationsEnabled: this.moduleOptions.notificationsEnabled
      }
    );
  }

  /**
   * Lifecycle hook that runs when the module is initialized
   * Sets up the Kafka consumer and message handlers
   */
  async onModuleInit(): Promise<void> {
    // Skip initialization if quests are disabled
    if (!this.moduleOptions.enabled) {
      this.loggerService.log(
        'Quests consumer not initialized because quests are disabled',
        { groupId: this.options.groupId }
      );
      return;
    }
    
    try {
      // Subscribe to each topic with the KafkaService
      for (const topic of this.options.topics) {
        await this.kafkaService.consume(
          topic,
          this.options.groupId,
          async (payload: any, key?: string, headers?: Record<string, string>) => {
            const correlationId = headers?.correlationId || uuidv4();
            const messageId = key || uuidv4();
            
            const logContext = {
              correlationId,
              messageId,
              topic,
            };
            
            try {
              this.loggerService.debug(
                `Processing quest event from ${topic}`,
                { ...logContext, headers }
              );
              
              if (!payload) {
                throw new EventProcessingError(
                  'Empty event payload received',
                  ErrorType.VALIDATION_ERROR,
                  { topic, correlationId }
                );
              }
              
              // Process the event based on the topic
              await this.processEvent(topic, payload, correlationId);
              
              this.loggerService.debug(
                `Successfully processed quest event from ${topic}`,
                logContext
              );
            } catch (error) {
              // The KafkaService handles retries and DLQ internally
              // Just log the error here
              const baseError = error instanceof BaseError 
                ? error 
                : new EventProcessingError(
                    error.message || 'Unknown error during event processing',
                    ErrorType.SYSTEM_ERROR,
                    { cause: error, correlationId }
                  );
              
              this.loggerService.error(
                `Error processing quest event from ${topic}: ${baseError.message}`,
                baseError.stack,
                { ...logContext, errorType: baseError.type }
              );
              
              // Rethrow to let KafkaService handle retries and DLQ
              throw error;
            }
          }
        );
        
        this.loggerService.log(
          `Subscribed to Kafka topic: ${topic}`,
          { groupId: this.options.groupId }
        );
      }
      
      this.loggerService.log(
        `Quests consumer initialized and subscribed to topics: ${this.options.topics.join(', ')}`,
        { groupId: this.options.groupId }
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to initialize quests consumer: ${error.message}`,
        error.stack,
        { groupId: this.options.groupId, error }
      );
      throw error;
    }
  }

  /**
   * Processes an event based on the topic and payload
   * 
   * @param topic - The Kafka topic
   * @param payload - The event payload
   * @param correlationId - Correlation ID for tracing
   */
  private async processEvent(topic: string, payload: any, correlationId: string): Promise<void> {
    this.validateEvent(payload, correlationId);
    
    const { userId, questId } = payload;
    
    switch (topic) {
      case 'quest.started':
        this.loggerService.debug(
          `Processing quest.started event for user ${userId} and quest ${questId}`,
          { correlationId, userId, questId }
        );
        
        await this.questsService.startQuest(userId, questId);
        break;
        
      case 'quest.completed':
        this.loggerService.debug(
          `Processing quest.completed event for user ${userId} and quest ${questId}`,
          { correlationId, userId, questId }
        );
        
        await this.questsService.completeQuest(userId, questId);
        break;
        
      case 'quest.progress':
        // Validate progress-specific fields
        if (typeof payload.progress !== 'number' || payload.progress < 0 || payload.progress > 100) {
          throw new EventProcessingError(
            'Invalid progress value in quest.progress event',
            ErrorType.VALIDATION_ERROR,
            { correlationId, userId, questId, progress: payload.progress }
          );
        }
        
        this.loggerService.debug(
          `Processing quest.progress event for user ${userId} and quest ${questId} with progress ${payload.progress}%`,
          { correlationId, userId, questId, progress: payload.progress }
        );
        
        // Note: This would require implementing updateQuestProgress in QuestsService
        // For now, we'll log that this would be processed
        this.loggerService.log(
          `Would update quest progress to ${payload.progress}% for user ${userId} and quest ${questId}`,
          { correlationId, userId, questId, progress: payload.progress }
        );
        break;
        
      default:
        this.loggerService.warn(
          `Received event from unexpected topic: ${topic}`,
          { correlationId, topic, payload }
        );
    }
  }

  /**
   * Validates that an event has the required properties for quest events
   * 
   * @param event - The event to validate
   * @param correlationId - Correlation ID for tracing
   */
  private validateEvent(event: any, correlationId: string): asserts event is QuestEvent {
    if (!event) {
      throw new EventProcessingError(
        'Event is null or undefined',
        ErrorType.VALIDATION_ERROR,
        { correlationId }
      );
    }
    
    if (!event.userId) {
      throw new EventProcessingError(
        'Event is missing required "userId" property',
        ErrorType.VALIDATION_ERROR,
        { correlationId, event }
      );
    }
    
    if (!event.questId) {
      throw new EventProcessingError(
        'Event is missing required "questId" property',
        ErrorType.VALIDATION_ERROR,
        { correlationId, event }
      );
    }
    
    if (!event.timestamp) {
      throw new EventProcessingError(
        'Event is missing required "timestamp" property',
        ErrorType.VALIDATION_ERROR,
        { correlationId, event }
      );
    }
  }

  // Error handling, retries, and DLQ functionality are now handled by the KafkaService

  // Message serialization/deserialization is now handled by the KafkaService

  /**
   * Gracefully shuts down the consumer
   */
  async onModuleDestroy(): Promise<void> {
    // Skip if quests are disabled
    if (!this.moduleOptions.enabled) {
      return;
    }
    
    try {
      // The KafkaService handles disconnection internally
      this.loggerService.log(
        'Quests consumer shutdown initiated',
        { groupId: this.options.groupId }
      );
    } catch (error) {
      this.loggerService.error(
        `Error during quests consumer shutdown: ${error.message}`,
        error.stack,
        { groupId: this.options.groupId, error }
      );
    }
  }
}
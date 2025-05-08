import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { QuestsService } from '../quests.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { DlqService } from '../../common/kafka/dlq.service';
import { MetricsService } from '../../common/metrics/metrics.service';
import { EventErrorCategory } from '../../common/enums/event-error-category.enum';
import { RetryStatus } from '../../common/enums/retry-status.enum';

// Import interfaces from @austa/interfaces package for type-safe event processing
import { Quest, UserQuest } from '@austa/interfaces/gamification/quests';
import { 
  GamificationEvent, 
  QuestEventType, 
  JourneyType 
} from '@austa/interfaces/gamification/events';

/**
 * Configuration options for the quests consumer
 */
interface QuestsConsumerOptions {
  /** The Kafka topic to consume events from */
  topic: string;
  /** The consumer group ID for this consumer */
  groupId: string;
  /** The maximum number of retry attempts for failed events */
  maxRetries?: number;
  /** The initial delay in milliseconds for the exponential backoff strategy */
  initialRetryDelay?: number;
  /** The maximum delay in milliseconds for the exponential backoff strategy */
  maxRetryDelay?: number;
  /** Whether to add jitter to the retry delay to prevent thundering herd */
  useJitter?: boolean;
}

/**
 * Interface for quest event payloads
 * These interfaces match the standardized event schemas defined in @austa/interfaces
 */
interface QuestStartedPayload {
  userId: string;
  questId: string;
  timestamp: string;
  journey?: JourneyType; // Optional journey context for cross-journey tracking
  metadata?: Record<string, any>; // Optional additional data
}

/**
 * Interface for quest completed event payloads
 */
interface QuestCompletedPayload {
  userId: string;
  questId: string;
  xpAwarded: number;
  timestamp: string;
  journey?: JourneyType; // Optional journey context for cross-journey tracking
  metadata?: Record<string, any>; // Optional additional data
}

/**
 * Interface for quest progress event payloads
 */
interface QuestProgressPayload {
  userId: string;
  questId: string;
  progress: number;
  timestamp: string;
  journey?: JourneyType; // Optional journey context for cross-journey tracking
  metadata?: Record<string, any>; // Optional additional data
}

/**
 * Union type for all quest event payloads
 */
type QuestEventPayload = QuestStartedPayload | QuestCompletedPayload | QuestProgressPayload;

/**
 * Response interface for quest event processing
 */
interface QuestEventResponse {
  success: boolean;
  userQuest?: UserQuest;
  error?: string;
  errorCategory?: EventErrorCategory;
  retryStatus?: RetryStatus;
}

/**
 * Kafka consumer service for quest-related events.
 * Subscribes to quest.started, quest.completed, and quest.progress topics,
 * processes incoming events, and delegates to QuestsService for business logic.
 * 
 * Features:
 * - Type-safe event processing using @austa/interfaces
 * - Comprehensive validation and error handling
 * - Dead-letter queue (DLQ) for failed events
 * - Exponential backoff retry strategy with configurable parameters
 * - Detailed logging with correlation IDs for traceability
 * - Metrics collection for monitoring and alerting
 * 
 * This consumer is a critical component of the gamification engine's event-driven
 * architecture, enabling quest progress tracking across all journeys (Health, Care, Plan).
 */
@Injectable()
export class QuestsConsumer implements OnModuleInit {
  private readonly logger = new Logger(QuestsConsumer.name);
  private readonly options: Required<QuestsConsumerOptions>;
  
  /**
   * Creates a new instance of the QuestsConsumer
   * 
   * @param kafkaService - Service for interacting with Kafka
   * @param loggerService - Service for structured logging
   * @param tracingService - Service for distributed tracing
   * @param configService - Service for accessing configuration
   * @param questsService - Service for managing quests
   * @param profilesService - Service for managing user profiles
   * @param dlqService - Service for managing the dead letter queue
   * @param metricsService - Service for recording metrics
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
    private readonly configService: ConfigService,
    private readonly questsService: QuestsService,
    private readonly profilesService: ProfilesService,
    private readonly dlqService: DlqService,
    private readonly metricsService: MetricsService,
  ) {
    // Set default options from config or use defaults
    this.options = {
      topic: this.configService.get<string>('kafka.topics.quests', 'quests'),
      groupId: this.configService.get<string>('kafka.groupIds.quests', 'quests-consumer-group'),
      maxRetries: this.configService.get<number>('kafka.retry.maxRetries', 3),
      initialRetryDelay: this.configService.get<number>('kafka.retry.initialDelay', 1000),
      maxRetryDelay: this.configService.get<number>('kafka.retry.maxDelay', 30000),
      useJitter: this.configService.get<boolean>('kafka.retry.useJitter', true),
    };
  }

  /**
   * Lifecycle hook that is called once the module has been initialized.
   * Sets up Kafka consumers for quest-related topics.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing QuestsConsumer');
    
    try {
      // Get quest-related topics from configuration or use defaults
      const questTopics = [
        this.configService.get<string>('kafka.topics.questStarted', 'quest.started'),
        this.configService.get<string>('kafka.topics.questCompleted', 'quest.completed'),
        this.configService.get<string>('kafka.topics.questProgress', 'quest.progress')
      ];
      
      // Subscribe to all quest-related topics
      for (const topic of questTopics) {
        await this.kafkaService.consume(
          topic,
          this.options.groupId,
          this.processMessage.bind(this)
        );
        this.logger.log(`Subscribed to ${topic} topic`);
        
        // Record metric for consumer initialization
        this.metricsService.incrementCounter('quest_consumer_subscriptions', {
          topic,
          groupId: this.options.groupId
        });
      }
      
      this.logger.log(
        `QuestsConsumer initialized successfully with group ID ${this.options.groupId}`,
        { topics: questTopics }
      );
    } catch (error) {
      this.logger.error('Failed to initialize QuestsConsumer', error.stack);
      
      // Record metric for initialization failure
      this.metricsService.incrementCounter('quest_consumer_initialization_failures');
      
      // Re-throw to prevent the application from starting with a broken consumer
      throw error;
    }
  }

  /**
   * Processes a message received from Kafka.
   * Validates the message, creates a trace context, and delegates to the appropriate handler.
   * 
   * @param message - The message received from Kafka
   * @param key - Optional message key
   * @param headers - Optional message headers
   */
  private async processMessage(
    message: any,
    key?: string,
    headers?: Record<string, string>
  ): Promise<void> {
    // Generate a correlation ID for tracking this message through the system
    const correlationId = headers?.correlationId || this.tracingService.generateCorrelationId();
    
    // Create a logger context with the correlation ID
    const contextLogger = this.loggerService.createContextLogger({
      correlationId,
      consumer: QuestsConsumer.name,
    });
    
    // Start metrics tracking
    const processingTimer = this.metricsService.startTimer(
      'quest_event_processing_duration',
      { topic: key || 'unknown' }
    );
    
    try {
      // Validate the message
      if (!this.isValidMessage(message)) {
        contextLogger.warn('Received invalid message format', { message });
        this.metricsService.incrementCounter('quest_invalid_messages', {
          topic: key || 'unknown',
        });
        return;
      }
      
      const event = message as GamificationEvent<QuestEventPayload>;
      
      // Create a trace span for this event processing
      const span = this.tracingService.createSpan(
        'process_quest_event',
        { correlationId, eventType: event.type, userId: event.userId }
      );
      
      contextLogger.log(`Processing quest event: ${event.type} for user ${event.userId}`);
      
      // Process the event with retry logic
      const result = await this.processEventWithRetry(event, 0, correlationId, contextLogger);
      
      // Record metrics based on the result
      if (result.success) {
        this.metricsService.incrementCounter('quest_events_processed', {
          topic: key || 'unknown',
          eventType: event.type,
          success: 'true',
        });
        
        contextLogger.log(
          `Successfully processed quest event: ${event.type} for user ${event.userId}`,
          { userQuest: result.userQuest }
        );
      } else {
        this.metricsService.incrementCounter('quest_events_processed', {
          topic: key || 'unknown',
          eventType: event.type,
          success: 'false',
          errorCategory: result.errorCategory,
        });
        
        contextLogger.error(
          `Failed to process quest event after all retries: ${event.type} for user ${event.userId}`,
          { error: result.error }
        );
      }
      
      // End the trace span
      span.end();
    } catch (error) {
      // This catch block handles unexpected errors in the processing logic itself
      contextLogger.error('Unhandled error in quest event processing', {
        error: error.message,
        stack: error.stack,
      });
      
      this.metricsService.incrementCounter('quest_processing_errors', {
        topic: key || 'unknown',
        errorType: 'unhandled',
      });
    } finally {
      // Stop the metrics timer
      processingTimer.end();
    }
  }

  /**
   * Processes an event with retry logic using exponential backoff.
   * 
   * @param event - The event to process
   * @param attempt - The current retry attempt (0-based)
   * @param correlationId - The correlation ID for tracing
   * @param logger - The context logger
   * @returns A promise that resolves to the event processing result
   */
  private async processEventWithRetry(
    event: GamificationEvent<QuestEventPayload>,
    attempt: number,
    correlationId: string,
    logger: LoggerService
  ): Promise<QuestEventResponse> {
    try {
      // Attempt to process the event
      const result = await this.processEvent(event);
      return result;
    } catch (error) {
      // Classify the error to determine if it's retryable
      const errorCategory = this.classifyError(error);
      const retryStatus = this.shouldRetry(errorCategory, attempt);
      
      // Log the error with context
      logger.error(
        `Error processing quest event (attempt ${attempt + 1}/${this.options.maxRetries + 1})`,
        {
          eventType: event.type,
          userId: event.userId,
          errorMessage: error.message,
          errorCategory,
          retryStatus,
          correlationId,
        }
      );
      
      // Record metrics for the error
      this.metricsService.incrementCounter('quest_processing_errors', {
        eventType: event.type,
        errorCategory,
        retryStatus,
      });
      
      // If we should retry, calculate the delay and try again
      if (retryStatus === RetryStatus.RETRY) {
        const delayMs = this.calculateRetryDelay(attempt);
        
        logger.log(
          `Retrying quest event processing after ${delayMs}ms (attempt ${attempt + 1}/${this.options.maxRetries})`,
          { eventType: event.type, userId: event.userId, correlationId }
        );
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Recursive call to retry
        return this.processEventWithRetry(event, attempt + 1, correlationId, logger);
      }
      
      // If we shouldn't retry, send to DLQ and return error response
      if (retryStatus === RetryStatus.DEAD_LETTER) {
        await this.sendToDlq(event, error, attempt, correlationId);
      }
      
      // Return error response
      return {
        success: false,
        error: error.message,
        errorCategory,
        retryStatus,
      };
    }
  }

  /**
   * Processes a quest event based on its type.
   * 
   * @param event - The event to process
   * @returns A promise that resolves to the event processing result
   */
  private async processEvent(
    event: GamificationEvent<QuestEventPayload>
  ): Promise<QuestEventResponse> {
    // Validate that this is a quest-related event
    if (!this.isQuestEvent(event.type)) {
      return {
        success: false,
        error: `Unsupported event type: ${event.type}`,
        errorCategory: EventErrorCategory.VALIDATION,
        retryStatus: RetryStatus.DEAD_LETTER,
      };
    }
    
    // Process the event based on its type
    switch (event.type) {
      case QuestEventType.QUEST_STARTED:
        return this.processQuestStarted(event as GamificationEvent<QuestStartedPayload>);
        
      case QuestEventType.QUEST_COMPLETED:
        return this.processQuestCompleted(event as GamificationEvent<QuestCompletedPayload>);
        
      case QuestEventType.QUEST_PROGRESS:
        return this.processQuestProgress(event as GamificationEvent<QuestProgressPayload>);
        
      default:
        return {
          success: false,
          error: `Unhandled quest event type: ${event.type}`,
          errorCategory: EventErrorCategory.VALIDATION,
          retryStatus: RetryStatus.DEAD_LETTER,
        };
    }
  }

  /**
   * Processes a quest.started event.
   * 
   * @param event - The quest.started event
   * @returns A promise that resolves to the event processing result
   */
  private async processQuestStarted(
    event: GamificationEvent<QuestStartedPayload>
  ): Promise<QuestEventResponse> {
    const { userId, questId } = event.data;
    
    try {
      // Call the QuestsService to start the quest
      const userQuest = await this.questsService.startQuest(userId, questId);
      
      return {
        success: true,
        userQuest,
      };
    } catch (error) {
      // Let the retry mechanism handle the error
      throw error;
    }
  }

  /**
   * Processes a quest.completed event.
   * 
   * @param event - The quest.completed event
   * @returns A promise that resolves to the event processing result
   */
  private async processQuestCompleted(
    event: GamificationEvent<QuestCompletedPayload>
  ): Promise<QuestEventResponse> {
    const { userId, questId } = event.data;
    
    try {
      // Call the QuestsService to complete the quest
      const userQuest = await this.questsService.completeQuest(userId, questId);
      
      return {
        success: true,
        userQuest,
      };
    } catch (error) {
      // Let the retry mechanism handle the error
      throw error;
    }
  }

  /**
   * Processes a quest.progress event.
   * 
   * @param event - The quest.progress event
   * @returns A promise that resolves to the event processing result
   */
  private async processQuestProgress(
    event: GamificationEvent<QuestProgressPayload>
  ): Promise<QuestEventResponse> {
    const { userId, questId, progress } = event.data;
    
    try {
      // Call the QuestsService to update quest progress
      // Note: This method needs to be implemented in the QuestsService
      // Implementation should update the progress field of the UserQuest entity
      // and handle any business logic related to progress updates
      const userQuest = await this.questsService.updateQuestProgress(userId, questId, progress);
      
      // Log the progress update
      this.logger.log(
        `Updated quest progress for user ${userId}, quest ${questId}: ${progress}%`,
        { userQuest }
      );
      
      // If progress is 100%, automatically complete the quest
      if (progress >= 100 && !userQuest.completed) {
        this.logger.log(
          `Quest ${questId} reached 100% progress for user ${userId}, triggering completion`,
          { userQuest }
        );
        
        return this.processQuestCompleted({
          ...event,
          type: QuestEventType.QUEST_COMPLETED,
          data: {
            userId,
            questId,
            xpAwarded: userQuest.quest.xpReward,
            timestamp: new Date().toISOString(),
          },
        });
      }
      
      return {
        success: true,
        userQuest,
      };
    } catch (error) {
      // Let the retry mechanism handle the error
      this.logger.error(
        `Failed to update quest progress for user ${userId}, quest ${questId}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Sends a failed event to the Dead Letter Queue (DLQ).
   * 
   * @param event - The event that failed processing
   * @param error - The error that occurred
   * @param attempts - The number of processing attempts made
   * @param correlationId - The correlation ID for tracing
   */
  private async sendToDlq(
    event: GamificationEvent<QuestEventPayload>,
    error: Error,
    attempts: number,
    correlationId: string
  ): Promise<void> {
    try {
      await this.dlqService.addToDlq({
        topic: event.type,
        partition: 0, // This would come from the Kafka message in a real implementation
        offset: 0, // This would come from the Kafka message in a real implementation
        event,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        attempts,
        correlationId,
        timestamp: new Date(),
      });
      
      this.logger.log(
        `Quest event sent to DLQ: ${event.type} for user ${event.userId}`,
        { correlationId }
      );
      
      this.metricsService.incrementCounter('quest_events_dlq', {
        eventType: event.type,
      });
    } catch (dlqError) {
      // If sending to DLQ fails, log the error but don't throw
      this.logger.error(
        `Failed to send quest event to DLQ: ${event.type} for user ${event.userId}`,
        {
          originalError: error.message,
          dlqError: dlqError.message,
          correlationId,
        }
      );
      
      this.metricsService.incrementCounter('quest_dlq_errors', {
        eventType: event.type,
      });
    }
  }

  /**
   * Calculates the delay for the next retry attempt using exponential backoff.
   * 
   * @param attempt - The current retry attempt (0-based)
   * @returns The delay in milliseconds
   */
  private calculateRetryDelay(attempt: number): number {
    // Calculate exponential backoff: initialDelay * 2^attempt
    const exponentialDelay = this.options.initialRetryDelay * Math.pow(2, attempt);
    
    // Cap the delay at the maximum configured value
    const cappedDelay = Math.min(exponentialDelay, this.options.maxRetryDelay);
    
    // Add jitter if configured to do so (prevents thundering herd problem)
    if (this.options.useJitter) {
      // Add random jitter of up to 25% of the delay
      const jitterFactor = 0.75 + (Math.random() * 0.5); // Random value between 0.75 and 1.25
      return Math.floor(cappedDelay * jitterFactor);
    }
    
    return cappedDelay;
  }

  /**
   * Determines if an event should be retried based on the error category and attempt count.
   * 
   * @param errorCategory - The category of the error
   * @param attempt - The current retry attempt (0-based)
   * @returns The retry status indicating what action to take
   */
  private shouldRetry(errorCategory: EventErrorCategory, attempt: number): RetryStatus {
    // If we've exceeded the maximum retry attempts, send to DLQ
    if (attempt >= this.options.maxRetries) {
      return RetryStatus.DEAD_LETTER;
    }
    
    // Determine if the error is retryable based on its category
    switch (errorCategory) {
      case EventErrorCategory.TRANSIENT:
      case EventErrorCategory.EXTERNAL_DEPENDENCY:
        // Transient errors and external dependency errors are retryable
        return RetryStatus.RETRY;
        
      case EventErrorCategory.VALIDATION:
      case EventErrorCategory.BUSINESS_RULE:
        // Validation errors and business rule violations are not retryable
        return RetryStatus.DEAD_LETTER;
        
      case EventErrorCategory.SYSTEM:
        // System errors might be retryable, but we should be cautious
        // For now, we'll retry system errors
        return RetryStatus.RETRY;
        
      default:
        // For unknown error categories, err on the side of caution and don't retry
        return RetryStatus.DEAD_LETTER;
    }
  }

  /**
   * Classifies an error into a specific category to determine retry behavior.
   * 
   * @param error - The error to classify
   * @returns The error category
   */
  private classifyError(error: Error): EventErrorCategory {
    // Check for known error types based on error name or properties
    if (error.name === 'ValidationError' || error.name === 'BadRequestException') {
      return EventErrorCategory.VALIDATION;
    }
    
    if (error.name === 'BusinessRuleViolationError') {
      return EventErrorCategory.BUSINESS_RULE;
    }
    
    if (error.name === 'TimeoutError' || error.name === 'ConnectionError') {
      return EventErrorCategory.TRANSIENT;
    }
    
    if (error.name === 'ExternalServiceError' || error.name === 'IntegrationError') {
      return EventErrorCategory.EXTERNAL_DEPENDENCY;
    }
    
    if (error.name === 'NotFoundException') {
      // Not found errors are typically validation errors (e.g., quest not found)
      return EventErrorCategory.VALIDATION;
    }
    
    // If the error has a specific category property, use that
    if ('category' in error && typeof error['category'] === 'string') {
      const category = error['category'];
      
      switch (category) {
        case 'validation':
          return EventErrorCategory.VALIDATION;
        case 'business':
          return EventErrorCategory.BUSINESS_RULE;
        case 'transient':
          return EventErrorCategory.TRANSIENT;
        case 'external':
          return EventErrorCategory.EXTERNAL_DEPENDENCY;
        case 'system':
          return EventErrorCategory.SYSTEM;
      }
    }
    
    // Default to system error if we can't determine a more specific category
    return EventErrorCategory.SYSTEM;
  }

  /**
   * Validates that a message has the required structure to be processed.
   * 
   * @param message - The message to validate
   * @returns True if the message is valid, false otherwise
   */
  private isValidMessage(message: any): boolean {
    return (
      message &&
      typeof message === 'object' &&
      'type' in message &&
      typeof message.type === 'string' &&
      'userId' in message &&
      typeof message.userId === 'string' &&
      'data' in message &&
      typeof message.data === 'object'
    );
  }

  /**
   * Checks if an event type is a quest-related event.
   * 
   * @param eventType - The event type to check
   * @returns True if the event is quest-related, false otherwise
   */
  private isQuestEvent(eventType: string): boolean {
    return [
      QuestEventType.QUEST_STARTED,
      QuestEventType.QUEST_COMPLETED,
      QuestEventType.QUEST_PROGRESS,
    ].includes(eventType as QuestEventType);
  }
}
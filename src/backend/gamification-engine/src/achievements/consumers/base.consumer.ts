import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { AchievementsService } from '../achievements.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { RulesService } from '../../rules/rules.service';
import { IBaseEvent, IEventPayload, IEventResponse } from '../../events/interfaces';
import { EventErrorCategory } from '../../common/enums/event-error-category.enum';
import { RetryStatus } from '../../common/enums/retry-status.enum';
import { DlqService } from '../../common/kafka/dlq.service';
import { MetricsService } from '../../common/metrics/metrics.service';

/**
 * Configuration options for the base consumer
 */
export interface BaseConsumerOptions {
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
 * Abstract base class for all achievement event consumers in the gamification engine.
 * Provides common functionality for event processing, error handling, retries, and DLQ.
 */
@Injectable()
export abstract class BaseConsumer implements OnModuleInit {
  protected readonly logger: Logger;
  protected readonly options: Required<BaseConsumerOptions>;
  
  /**
   * Creates a new instance of the BaseConsumer
   * 
   * @param kafkaService - Service for interacting with Kafka
   * @param loggerService - Service for structured logging
   * @param tracingService - Service for distributed tracing
   * @param configService - Service for accessing configuration
   * @param achievementsService - Service for managing achievements
   * @param profilesService - Service for managing user profiles
   * @param rulesService - Service for evaluating achievement rules
   * @param dlqService - Service for managing the dead letter queue
   * @param metricsService - Service for recording metrics
   * @param consumerOptions - Configuration options for this consumer
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly loggerService: LoggerService,
    protected readonly tracingService: TracingService,
    protected readonly configService: ConfigService,
    protected readonly achievementsService: AchievementsService,
    protected readonly profilesService: ProfilesService,
    protected readonly rulesService: RulesService,
    protected readonly dlqService: DlqService,
    protected readonly metricsService: MetricsService,
    protected readonly consumerOptions: BaseConsumerOptions,
  ) {
    this.logger = new Logger(this.constructor.name);
    
    // Set default options
    this.options = {
      topic: consumerOptions.topic,
      groupId: consumerOptions.groupId,
      maxRetries: consumerOptions.maxRetries ?? 3,
      initialRetryDelay: consumerOptions.initialRetryDelay ?? 1000,
      maxRetryDelay: consumerOptions.maxRetryDelay ?? 30000,
      useJitter: consumerOptions.useJitter ?? true,
    };
  }

  /**
   * Lifecycle hook that is called once the module has been initialized.
   * Sets up the Kafka consumer and subscribes to the configured topic.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log(
      `Initializing consumer for topic ${this.options.topic} with group ${this.options.groupId}`
    );
    
    try {
      await this.kafkaService.consume(
        this.options.topic,
        this.options.groupId,
        this.processMessage.bind(this)
      );
      
      this.logger.log(`Successfully subscribed to topic ${this.options.topic}`);
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to topic ${this.options.topic}`,
        error.stack
      );
      // Re-throw to prevent the application from starting with a broken consumer
      throw error;
    }
  }

  /**
   * Processes a message received from Kafka.
   * Validates the message, creates a trace context, and delegates to the appropriate handler.
   * 
   * @param message - The message received from Kafka
   */
  protected async processMessage(message: any): Promise<void> {
    // Generate a correlation ID for tracking this message through the system
    const correlationId = this.tracingService.generateCorrelationId();
    
    // Create a logger context with the correlation ID
    const contextLogger = this.loggerService.createContextLogger({
      correlationId,
      topic: this.options.topic,
      consumer: this.constructor.name,
    });
    
    // Start metrics tracking
    const processingTimer = this.metricsService.startTimer(
      'achievement_event_processing_duration',
      { topic: this.options.topic }
    );
    
    try {
      // Validate the message
      if (!this.isValidMessage(message)) {
        contextLogger.warn('Received invalid message format', { message });
        this.metricsService.incrementCounter('achievement_invalid_messages', {
          topic: this.options.topic,
        });
        return;
      }
      
      const event = message as IBaseEvent;
      
      // Create a trace span for this event processing
      const span = this.tracingService.createSpan(
        'process_achievement_event',
        { correlationId, eventType: event.type, userId: event.userId }
      );
      
      contextLogger.log(`Processing event: ${event.type} for user ${event.userId}`);
      
      // Process the event with retry logic
      const result = await this.processEventWithRetry(event, 0, correlationId, contextLogger);
      
      // Record metrics based on the result
      if (result.success) {
        this.metricsService.incrementCounter('achievement_events_processed', {
          topic: this.options.topic,
          eventType: event.type,
          success: 'true',
        });
        
        contextLogger.log(
          `Successfully processed event: ${event.type} for user ${event.userId}`,
          { points: result.points, achievements: result.achievements }
        );
      } else {
        this.metricsService.incrementCounter('achievement_events_processed', {
          topic: this.options.topic,
          eventType: event.type,
          success: 'false',
          errorCategory: result.errorCategory,
        });
        
        contextLogger.error(
          `Failed to process event after all retries: ${event.type} for user ${event.userId}`,
          { error: result.error }
        );
      }
      
      // End the trace span
      span.end();
    } catch (error) {
      // This catch block handles unexpected errors in the processing logic itself
      contextLogger.error('Unhandled error in event processing', {
        error: error.message,
        stack: error.stack,
      });
      
      this.metricsService.incrementCounter('achievement_processing_errors', {
        topic: this.options.topic,
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
  protected async processEventWithRetry(
    event: IBaseEvent,
    attempt: number,
    correlationId: string,
    logger: LoggerService
  ): Promise<IEventResponse> {
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
        `Error processing event (attempt ${attempt + 1}/${this.options.maxRetries + 1})`,
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
      this.metricsService.incrementCounter('achievement_processing_errors', {
        topic: this.options.topic,
        eventType: event.type,
        errorCategory,
        retryStatus,
      });
      
      // If we should retry, calculate the delay and try again
      if (retryStatus === RetryStatus.RETRY) {
        const delayMs = this.calculateRetryDelay(attempt);
        
        logger.log(
          `Retrying event processing after ${delayMs}ms (attempt ${attempt + 1}/${this.options.maxRetries})`,
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
   * Sends a failed event to the Dead Letter Queue (DLQ).
   * 
   * @param event - The event that failed processing
   * @param error - The error that occurred
   * @param attempts - The number of processing attempts made
   * @param correlationId - The correlation ID for tracing
   */
  protected async sendToDlq(
    event: IBaseEvent,
    error: Error,
    attempts: number,
    correlationId: string
  ): Promise<void> {
    try {
      await this.dlqService.addToDlq({
        topic: this.options.topic,
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
        `Event sent to DLQ: ${event.type} for user ${event.userId}`,
        { correlationId }
      );
      
      this.metricsService.incrementCounter('achievement_events_dlq', {
        topic: this.options.topic,
        eventType: event.type,
      });
    } catch (dlqError) {
      // If sending to DLQ fails, log the error but don't throw
      this.logger.error(
        `Failed to send event to DLQ: ${event.type} for user ${event.userId}`,
        {
          originalError: error.message,
          dlqError: dlqError.message,
          correlationId,
        }
      );
      
      this.metricsService.incrementCounter('achievement_dlq_errors', {
        topic: this.options.topic,
      });
    }
  }

  /**
   * Calculates the delay for the next retry attempt using exponential backoff.
   * 
   * @param attempt - The current retry attempt (0-based)
   * @returns The delay in milliseconds
   */
  protected calculateRetryDelay(attempt: number): number {
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
  protected shouldRetry(errorCategory: EventErrorCategory, attempt: number): RetryStatus {
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
  protected classifyError(error: Error): EventErrorCategory {
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
  protected isValidMessage(message: any): boolean {
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
   * Abstract method that must be implemented by journey-specific consumers.
   * Processes an event and returns a response indicating success or failure.
   * 
   * @param event - The event to process
   * @returns A promise that resolves to the event processing result
   */
  protected abstract processEvent(event: IBaseEvent): Promise<IEventResponse>;

  /**
   * Abstract method that must be implemented by journey-specific consumers.
   * Validates that an event is supported by this consumer.
   * 
   * @param event - The event to validate
   * @returns True if the event is supported, false otherwise
   */
  protected abstract isSupportedEvent(event: IBaseEvent): boolean;

  /**
   * Abstract method that must be implemented by journey-specific consumers.
   * Maps an event to the appropriate payload type based on the event type.
   * 
   * @param event - The event to map
   * @returns The typed event payload
   */
  protected abstract mapEventToPayload<T extends IEventPayload>(event: IBaseEvent): T;
}
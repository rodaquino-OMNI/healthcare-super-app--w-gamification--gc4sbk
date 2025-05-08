import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@austa/events/kafka';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { JourneyType } from '@austa/interfaces/common/dto';
import { RewardsService } from '../rewards.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { RulesService } from '../../rules/rules.service';
import { EventErrorCategory } from '../../common/enums/event-error-category.enum';
import { RetryStatus } from '../../common/enums/retry-status.enum';
import { DlqService } from '../../common/kafka/dlq.service';
import { MetricsService } from '../../common/metrics/metrics.service';
import { 
  IRewardEvent, 
  validateRewardEvent, 
  RewardEventType,
  RewardGrantedPayload,
  HealthRewardTriggeredPayload,
  CareRewardTriggeredPayload,
  PlanRewardTriggeredPayload,
  isHealthRewardTriggeredPayload,
  isCareRewardTriggeredPayload,
  isPlanRewardTriggeredPayload
} from './reward-events.types';

/**
 * Configuration options for the base reward consumer
 */
export interface BaseRewardConsumerOptions {
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
 * Response interface for reward event processing
 */
export interface RewardEventResponse {
  /** Whether the event was processed successfully */
  success: boolean;
  /** The error message if processing failed */
  error?: string;
  /** The error category if processing failed */
  errorCategory?: EventErrorCategory;
  /** The retry status if processing failed */
  retryStatus?: RetryStatus;
  /** The rewards granted as a result of processing the event */
  rewards?: string[];
  /** The XP points granted as a result of processing the event */
  xpGranted?: number;
}

/**
 * Abstract base class for all reward event consumers in the gamification engine.
 * Provides common functionality for event processing, error handling, retries, and DLQ.
 */
@Injectable()
export abstract class BaseConsumer implements OnModuleInit {
  protected readonly logger: Logger;
  protected readonly options: Required<BaseRewardConsumerOptions>;
  
  /**
   * Creates a new instance of the BaseConsumer
   * 
   * @param kafkaService - Service for interacting with Kafka
   * @param loggerService - Service for structured logging
   * @param tracingService - Service for distributed tracing
   * @param configService - Service for accessing configuration
   * @param rewardsService - Service for managing rewards
   * @param profilesService - Service for managing user profiles
   * @param rulesService - Service for evaluating reward rules
   * @param dlqService - Service for managing the dead letter queue
   * @param metricsService - Service for recording metrics
   * @param consumerOptions - Configuration options for this consumer
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly loggerService: LoggerService,
    protected readonly tracingService: TracingService,
    protected readonly configService: ConfigService,
    protected readonly rewardsService: RewardsService,
    protected readonly profilesService: ProfilesService,
    protected readonly rulesService: RulesService,
    protected readonly dlqService: DlqService,
    protected readonly metricsService: MetricsService,
    protected readonly consumerOptions: BaseRewardConsumerOptions,
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
      `Initializing reward consumer for topic ${this.options.topic} with group ${this.options.groupId}`
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
      'reward_event_processing_duration',
      { topic: this.options.topic }
    );
    
    try {
      // Validate the message
      if (!this.isValidMessage(message)) {
        contextLogger.warn('Received invalid message format', { message });
        this.metricsService.incrementCounter('reward_invalid_messages', {
          topic: this.options.topic,
        });
        return;
      }
      
      const event = message as IRewardEvent;
      
      // Create a trace span for this event processing
      const span = this.tracingService.createSpan(
        'process_reward_event',
        { correlationId, eventType: event.type, userId: event.userId }
      );
      
      // Log the event for audit purposes
      await this.auditRewardEvent(event, correlationId);
      
      contextLogger.log(`Processing reward event: ${event.type} for user ${event.userId}`);
      
      // Process the event with retry logic
      const result = await this.processEventWithRetry(event, 0, correlationId, contextLogger);
      
      // Record metrics based on the result
      if (result.success) {
        this.metricsService.incrementCounter('reward_events_processed', {
          topic: this.options.topic,
          eventType: event.type,
          success: 'true',
        });
        
        contextLogger.log(
          `Successfully processed reward event: ${event.type} for user ${event.userId}`,
          { rewards: result.rewards, xpGranted: result.xpGranted }
        );
        
        // Log the successful processing for audit purposes
        await this.auditRewardEventProcessing(event, result, correlationId);
      } else {
        this.metricsService.incrementCounter('reward_events_processed', {
          topic: this.options.topic,
          eventType: event.type,
          success: 'false',
          errorCategory: result.errorCategory,
        });
        
        contextLogger.error(
          `Failed to process reward event after all retries: ${event.type} for user ${event.userId}`,
          { error: result.error }
        );
        
        // Log the failed processing for audit purposes
        await this.auditRewardEventProcessing(event, result, correlationId);
      }
      
      // End the trace span
      span.end();
    } catch (error) {
      // This catch block handles unexpected errors in the processing logic itself
      contextLogger.error('Unhandled error in reward event processing', {
        error: error.message,
        stack: error.stack,
      });
      
      this.metricsService.incrementCounter('reward_processing_errors', {
        topic: this.options.topic,
        errorType: 'unhandled',
      });
    } finally {
      // Stop the metrics timer
      processingTimer.end();
    }
  }
  
  /**
   * Logs a reward event for audit purposes.
   * 
   * @param event - The reward event to log
   * @param correlationId - The correlation ID for tracing
   */
  protected async auditRewardEvent(
    event: IRewardEvent,
    correlationId: string
  ): Promise<void> {
    try {
      // In a real implementation, this would write to a database or audit log service
      // For now, we'll just log it with the structured logger
      this.loggerService.log('AUDIT: Reward event received', {
        eventId: event.eventId,
        eventType: event.type,
        userId: event.userId,
        journey: event.journey,
        timestamp: event.timestamp,
        source: event.source,
        correlationId,
        // Don't log the full payload for privacy/security reasons
        payloadType: typeof event.payload
      });
      
      // Record metrics for audit logging
      this.metricsService.incrementCounter('reward_events_audited', {
        eventType: event.type,
        journey: event.journey
      });
    } catch (error) {
      // If audit logging fails, log the error but don't throw
      this.logger.error('Failed to audit reward event', {
        error: error.message,
        eventId: event.eventId,
        correlationId
      });
    }
  }
  
  /**
   * Logs the result of processing a reward event for audit purposes.
   * 
   * @param event - The reward event that was processed
   * @param result - The result of processing the event
   * @param correlationId - The correlation ID for tracing
   */
  protected async auditRewardEventProcessing(
    event: IRewardEvent,
    result: RewardEventResponse,
    correlationId: string
  ): Promise<void> {
    try {
      // In a real implementation, this would write to a database or audit log service
      // For now, we'll just log it with the structured logger
      this.loggerService.log('AUDIT: Reward event processing result', {
        eventId: event.eventId,
        eventType: event.type,
        userId: event.userId,
        journey: event.journey,
        success: result.success,
        error: result.error,
        errorCategory: result.errorCategory,
        retryStatus: result.retryStatus,
        rewards: result.rewards,
        xpGranted: result.xpGranted,
        correlationId,
        timestamp: new Date().toISOString()
      });
      
      // Record metrics for audit logging
      this.metricsService.incrementCounter('reward_processing_audited', {
        eventType: event.type,
        journey: event.journey,
        success: result.success ? 'true' : 'false'
      });
    } catch (error) {
      // If audit logging fails, log the error but don't throw
      this.logger.error('Failed to audit reward event processing', {
        error: error.message,
        eventId: event.eventId,
        correlationId
      });
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
    event: IRewardEvent,
    attempt: number,
    correlationId: string,
    logger: LoggerService
  ): Promise<RewardEventResponse> {
    try {
      // Add correlation ID to the event metadata for tracing
      if (!event.metadata) {
        event.metadata = {};
      }
      event.metadata.correlationId = correlationId;
      event.metadata.processingAttempt = attempt + 1;
      
      // Create a child span for this specific attempt
      const attemptSpan = this.tracingService.createSpan(
        `process_reward_event_attempt_${attempt + 1}`,
        { 
          correlationId, 
          eventType: event.type, 
          userId: event.userId,
          attempt: attempt + 1,
          maxAttempts: this.options.maxRetries + 1
        }
      );
      
      try {
        // Attempt to process the event
        const result = await this.processEvent(event);
        attemptSpan.end();
        return result;
      } catch (processingError) {
        // Add error details to the span
        attemptSpan.setAttributes({
          error: true,
          'error.message': processingError.message,
          'error.type': processingError.name
        });
        attemptSpan.end();
        throw processingError;
      }
    } catch (error) {
      // Classify the error to determine if it's retryable
      const errorCategory = this.classifyError(error);
      const retryStatus = this.shouldRetry(errorCategory, attempt);
      
      // Log the error with context
      logger.error(
        `Error processing reward event (attempt ${attempt + 1}/${this.options.maxRetries + 1})`,
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
      this.metricsService.incrementCounter('reward_processing_errors', {
        topic: this.options.topic,
        eventType: event.type,
        errorCategory,
        retryStatus,
      });
      
      // If we should retry, calculate the delay and try again
      if (retryStatus === RetryStatus.RETRY) {
        const delayMs = this.calculateRetryDelay(attempt);
        
        logger.log(
          `Retrying reward event processing after ${delayMs}ms (attempt ${attempt + 1}/${this.options.maxRetries})`,
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
    event: IRewardEvent,
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
        `Reward event sent to DLQ: ${event.type} for user ${event.userId}`,
        { correlationId }
      );
      
      this.metricsService.incrementCounter('reward_events_dlq', {
        topic: this.options.topic,
        eventType: event.type,
      });
    } catch (dlqError) {
      // If sending to DLQ fails, log the error but don't throw
      this.logger.error(
        `Failed to send reward event to DLQ: ${event.type} for user ${event.userId}`,
        {
          originalError: error.message,
          dlqError: dlqError.message,
          correlationId,
        }
      );
      
      this.metricsService.incrementCounter('reward_dlq_errors', {
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
    
    // Check for specific error messages that indicate error categories
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return EventErrorCategory.TRANSIENT;
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return EventErrorCategory.VALIDATION;
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('not allowed')) {
      return EventErrorCategory.BUSINESS_RULE;
    }
    
    if (errorMessage.includes('service unavailable') || errorMessage.includes('external service')) {
      return EventErrorCategory.EXTERNAL_DEPENDENCY;
    }
    
    // Default to system error if we can't determine a more specific category
    return EventErrorCategory.SYSTEM;
  }
  
  /**
   * Helper method to process journey-specific reward events.
   * This provides a common implementation that can be used by journey-specific consumers.
   * 
   * @param event - The reward event to process
   * @param journeyType - The journey type this event belongs to
   * @returns A promise that resolves to the event processing result
   */
  protected async processJourneyRewardEvent(
    event: IRewardEvent,
    journeyType: JourneyType
  ): Promise<RewardEventResponse> {
    // Verify the event belongs to the expected journey
    if (event.journey !== journeyType) {
      return {
        success: false,
        error: `Event journey ${event.journey} does not match expected journey ${journeyType}`,
        errorCategory: EventErrorCategory.VALIDATION,
        retryStatus: RetryStatus.DEAD_LETTER
      };
    }
    
    // Create a span for this journey-specific processing
    const span = this.tracingService.createSpan(`process_${journeyType.toLowerCase()}_reward_event`, {
      userId: event.userId,
      eventType: event.type,
      correlationId: event.metadata?.correlationId as string
    });
    
    try {
      // Check if the user is eligible for rewards based on rules
      const isEligible = await this.checkRewardEligibility(event);
      
      if (!isEligible) {
        this.logger.log(`User ${event.userId} not eligible for rewards from event ${event.type}`);
        span.setAttribute('eligible', false);
        span.end();
        
        return {
          success: true,
          rewards: [],
          xpGranted: 0
        };
      }
      
      // User is eligible, grant the rewards
      const { rewardIds, xpGranted } = await this.grantRewards(event);
      
      // Record the results in the span
      span.setAttributes({
        eligible: true,
        rewardCount: rewardIds.length,
        xpGranted
      });
      span.end();
      
      return {
        success: true,
        rewards: rewardIds,
        xpGranted
      };
    } catch (error) {
      // Add error details to the span
      span.setAttributes({
        error: true,
        'error.message': error.message,
        'error.type': error.name
      });
      span.end();
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }

  /**
   * Validates that a message has the required structure to be processed as a reward event.
   * 
   * @param message - The message to validate
   * @returns True if the message is valid, false otherwise
   */
  protected isValidMessage(message: any): boolean {
    try {
      // First check basic structure before attempting full validation
      if (
        !message ||
        typeof message !== 'object' ||
        !message.eventId ||
        !message.type ||
        !message.userId ||
        !message.journey ||
        !message.payload
      ) {
        this.logger.warn('Message missing required reward event fields', { 
          receivedFields: Object.keys(message || {}).join(', ') 
        });
        return false;
      }
      
      // Check if this consumer supports this event type
      if (!this.isSupportedEvent(message as IRewardEvent)) {
        this.logger.debug('Event type not supported by this consumer', { 
          eventType: message.type,
          consumer: this.constructor.name 
        });
        return false;
      }
      
      // Perform full schema validation
      return validateRewardEvent(message as IRewardEvent);
    } catch (error) {
      this.logger.warn('Invalid reward event format', { error: error.message });
      return false;
    }
  }

  /**
   * Abstract method that must be implemented by journey-specific consumers.
   * Processes a reward event and returns a response indicating success or failure.
   * 
   * @param event - The reward event to process
   * @returns A promise that resolves to the event processing result
   */
  protected abstract processEvent(event: IRewardEvent): Promise<RewardEventResponse>;

  /**
   * Abstract method that must be implemented by journey-specific consumers.
   * Validates that a reward event is supported by this consumer.
   * 
   * @param event - The reward event to validate
   * @returns True if the event is supported, false otherwise
   */
  protected abstract isSupportedEvent(event: IRewardEvent): boolean;

  /**
   * Abstract method that must be implemented by journey-specific consumers.
   * Extracts the journey-specific context from a reward event.
   * 
   * @param event - The reward event to extract context from
   * @returns The journey-specific context object
   */
  protected abstract extractJourneyContext(event: IRewardEvent): Record<string, unknown>;
  
  /**
   * Grants rewards to a user based on the event data.
   * This is a helper method that can be used by journey-specific implementations.
   * 
   * @param event - The reward event containing reward information
   * @param context - Additional context for the reward granting
   * @returns A promise that resolves to the granted rewards and XP
   */
  protected async grantRewards(
    event: IRewardEvent,
    context?: Record<string, unknown>
  ): Promise<{ rewardIds: string[]; xpGranted: number }> {
    const { userId, journey } = event;
    
    // Create a span for reward granting
    const span = this.tracingService.createSpan('grant_rewards', {
      userId,
      journey,
      eventType: event.type,
      correlationId: event.metadata?.correlationId as string
    });
    
    try {
      // Extract reward information from the event
      // This will vary based on the event type, so we use a type guard approach
      let rewardIds: string[] = [];
      let xpGranted = 0;
      
      // Handle different event payload types
      if ('rewardId' in event.payload && typeof event.payload.rewardId === 'string') {
        // Single reward case
        const rewardId = event.payload.rewardId;
        
        // Grant the reward to the user
        const grantResult = await this.rewardsService.grantRewardToUser({
          userId,
          rewardId,
          source: event.source,
          sourceEvent: event.type,
          journey,
          context: {
            ...this.extractJourneyContext(event),
            ...context
          }
        });
        
        rewardIds = [rewardId];
        xpGranted = grantResult.xpGranted || 0;
      } else if ('rewards' in event.payload && Array.isArray(event.payload.rewards)) {
        // Multiple rewards case
        const rewards = event.payload.rewards;
        
        // Grant each reward to the user
        const grantPromises = rewards.map(reward => 
          this.rewardsService.grantRewardToUser({
            userId,
            rewardId: typeof reward === 'string' ? reward : reward.id,
            source: event.source,
            sourceEvent: event.type,
            journey,
            context: {
              ...this.extractJourneyContext(event),
              ...context
            }
          })
        );
        
        // Wait for all rewards to be granted
        const results = await Promise.all(grantPromises);
        
        // Collect the results
        rewardIds = rewards.map(r => typeof r === 'string' ? r : r.id);
        xpGranted = results.reduce((total, result) => total + (result.xpGranted || 0), 0);
      } else if ('xpValue' in event.payload && typeof event.payload.xpValue === 'number') {
        // XP-only case (no specific reward)
        const xpValue = event.payload.xpValue;
        
        // Update the user's XP
        await this.profilesService.addXp(userId, xpValue, {
          source: event.source,
          sourceEvent: event.type,
          journey,
          context: {
            ...this.extractJourneyContext(event),
            ...context
          }
        });
        
        xpGranted = xpValue;
      }
      
      // Record metrics for granted rewards
      this.metricsService.incrementCounter('rewards_granted', {
        journey,
        eventType: event.type,
        rewardCount: rewardIds.length.toString()
      });
      
      // Record metrics for XP granted
      if (xpGranted > 0) {
        this.metricsService.recordValue('xp_granted', xpGranted, {
          journey,
          eventType: event.type
        });
      }
      
      // End the span
      span.end();
      
      return { rewardIds, xpGranted };
    } catch (error) {
      // Add error details to the span
      span.setAttributes({
        error: true,
        'error.message': error.message,
        'error.type': error.name
      });
      span.end();
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
  
  /**
   * Checks if a user is eligible for a reward based on rules.
   * This is a helper method that can be used by journey-specific implementations.
   * 
   * @param event - The reward event to check eligibility for
   * @returns A promise that resolves to true if the user is eligible, false otherwise
   */
  protected async checkRewardEligibility(
    event: IRewardEvent
  ): Promise<boolean> {
    const { userId, journey, type } = event;
    
    // Create a span for eligibility checking
    const span = this.tracingService.createSpan('check_reward_eligibility', {
      userId,
      journey,
      eventType: type,
      correlationId: event.metadata?.correlationId as string
    });
    
    try {
      // Extract reward ID if available
      let rewardId: string | undefined;
      if ('rewardId' in event.payload && typeof event.payload.rewardId === 'string') {
        rewardId = event.payload.rewardId;
      }
      
      // Create the rule context from the event
      const ruleContext = {
        userId,
        journey,
        eventType: type,
        rewardId,
        eventData: event.payload,
        journeyContext: this.extractJourneyContext(event)
      };
      
      // Evaluate the rules for this event
      const isEligible = await this.rulesService.evaluateRules(ruleContext);
      
      // Record the result in the span
      span.setAttribute('eligible', isEligible);
      span.end();
      
      return isEligible;
    } catch (error) {
      // Add error details to the span
      span.setAttributes({
        error: true,
        'error.message': error.message,
        'error.type': error.name
      });
      span.end();
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
}
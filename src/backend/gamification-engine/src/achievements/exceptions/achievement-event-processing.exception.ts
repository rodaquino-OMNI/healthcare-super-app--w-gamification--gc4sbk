import { HttpStatus } from '@nestjs/common';
import { SystemException } from '../../common/exceptions/system.exception';
import { TransientException } from '../../common/exceptions/transient.exception';

/**
 * Processing stages for achievement events
 */
export enum AchievementEventProcessingStage {
  VALIDATION = 'validation',
  DESERIALIZATION = 'deserialization',
  TRANSFORMATION = 'transformation',
  RULE_EVALUATION = 'rule_evaluation',
  PERSISTENCE = 'persistence',
  NOTIFICATION = 'notification',
  UNKNOWN = 'unknown',
}

/**
 * Interface for achievement event processing error context
 */
export interface AchievementEventProcessingErrorContext {
  /** Unique identifier of the event being processed */
  eventId: string;
  /** Type of the event being processed */
  eventType: string;
  /** Journey that originated the event (health, care, plan) */
  journeyType: string;
  /** Processing stage where the error occurred */
  processingStage: AchievementEventProcessingStage;
  /** User ID associated with the event, if available */
  userId?: string;
  /** Achievement ID associated with the event, if available */
  achievementId?: string;
  /** Raw event payload for debugging purposes */
  rawEvent: Record<string, any>;
  /** Current retry count */
  retryCount: number;
  /** Maximum number of retries allowed */
  maxRetries: number;
  /** Time of the first attempt in ISO format */
  firstAttemptTime: string;
  /** Backoff delay in milliseconds for the next retry */
  backoffDelay: number;
  /** Whether the event should be sent to the dead letter queue */
  sendToDlq: boolean;
  /** Additional metadata for debugging */
  metadata?: Record<string, any>;
}

/**
 * Exception thrown when an achievement event fails during processing.
 * This exception is used to handle system or transient errors that occur
 * during the processing of achievement events from Kafka.
 * 
 * It supports retry mechanisms with exponential backoff and dead letter queue
 * routing when retries are exhausted.
 */
export class AchievementEventProcessingException extends SystemException implements TransientException {
  /** Error context specific to achievement event processing */
  private readonly processingErrorContext: AchievementEventProcessingErrorContext;

  /**
   * Creates a new instance of AchievementEventProcessingException
   * 
   * @param message - Human-readable error message
   * @param cause - Original error that caused this exception
   * @param context - Achievement event processing context
   */
  constructor(
    message: string,
    cause: Error,
    context: AchievementEventProcessingErrorContext,
  ) {
    super(
      message,
      cause,
      {
        errorCode: 'ACH-EVENT-PROCESSING-ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        isOperational: true, // This is an operational error that can potentially be recovered from
      },
    );

    this.processingErrorContext = context;
    this.name = 'AchievementEventProcessingException';
  }

  /**
   * Gets the event ID associated with this error
   */
  public getEventId(): string {
    return this.processingErrorContext.eventId;
  }

  /**
   * Gets the event type associated with this error
   */
  public getEventType(): string {
    return this.processingErrorContext.eventType;
  }

  /**
   * Gets the journey type that originated the event
   */
  public getJourneyType(): string {
    return this.processingErrorContext.journeyType;
  }

  /**
   * Gets the processing stage where the error occurred
   */
  public getProcessingStage(): AchievementEventProcessingStage {
    return this.processingErrorContext.processingStage;
  }

  /**
   * Gets the user ID associated with this error, if available
   */
  public getUserId(): string | undefined {
    return this.processingErrorContext.userId;
  }

  /**
   * Gets the achievement ID associated with this error, if available
   */
  public getAchievementId(): string | undefined {
    return this.processingErrorContext.achievementId;
  }

  /**
   * Gets the raw event payload for debugging purposes
   */
  public getRawEvent(): Record<string, any> {
    return this.processingErrorContext.rawEvent;
  }

  /**
   * Gets the current retry count
   */
  public getRetryCount(): number {
    return this.processingErrorContext.retryCount;
  }

  /**
   * Gets the maximum number of retries allowed
   */
  public getMaxRetries(): number {
    return this.processingErrorContext.maxRetries;
  }

  /**
   * Gets the time of the first attempt
   */
  public getFirstAttemptTime(): string {
    return this.processingErrorContext.firstAttemptTime;
  }

  /**
   * Checks if the error is retryable based on retry count and max retries
   */
  public isRetryable(): boolean {
    return this.processingErrorContext.retryCount < this.processingErrorContext.maxRetries;
  }

  /**
   * Gets the backoff delay in milliseconds for the next retry
   */
  public getBackoffDelay(): number {
    return this.processingErrorContext.backoffDelay;
  }

  /**
   * Checks if the event should be sent to the dead letter queue
   */
  public shouldSendToDlq(): boolean {
    return this.processingErrorContext.sendToDlq || 
           this.processingErrorContext.retryCount >= this.processingErrorContext.maxRetries;
  }

  /**
   * Gets the complete error context for logging and debugging
   */
  public getErrorContext(): AchievementEventProcessingErrorContext {
    return this.processingErrorContext;
  }

  /**
   * Creates a new instance with an incremented retry count
   * 
   * @param backoffDelay - The backoff delay to use for the next retry
   * @returns A new instance with updated retry information
   */
  public incrementRetry(backoffDelay: number): AchievementEventProcessingException {
    const updatedContext = {
      ...this.processingErrorContext,
      retryCount: this.processingErrorContext.retryCount + 1,
      backoffDelay,
      sendToDlq: this.processingErrorContext.retryCount + 1 >= this.processingErrorContext.maxRetries,
    };

    return new AchievementEventProcessingException(
      this.message,
      this.cause as Error,
      updatedContext,
    );
  }

  /**
   * Serializes the exception for logging and monitoring
   * 
   * @returns A serialized representation of the exception
   */
  public serialize(): Record<string, any> {
    return {
      ...super.serialize(),
      eventId: this.processingErrorContext.eventId,
      eventType: this.processingErrorContext.eventType,
      journeyType: this.processingErrorContext.journeyType,
      processingStage: this.processingErrorContext.processingStage,
      userId: this.processingErrorContext.userId,
      achievementId: this.processingErrorContext.achievementId,
      retryCount: this.processingErrorContext.retryCount,
      maxRetries: this.processingErrorContext.maxRetries,
      firstAttemptTime: this.processingErrorContext.firstAttemptTime,
      backoffDelay: this.processingErrorContext.backoffDelay,
      sendToDlq: this.shouldSendToDlq(),
      isRetryable: this.isRetryable(),
    };
  }
}
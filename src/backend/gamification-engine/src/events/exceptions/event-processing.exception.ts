import { HttpStatus } from '@nestjs/common';
import { BaseEventException, BaseEventExceptionMetadata } from './base-event.exception';

/**
 * Metadata interface for event processing exceptions
 */
export interface EventProcessingExceptionMetadata extends BaseEventExceptionMetadata {
  /**
   * Processing stage where the error occurred
   */
  processingStage?: string;

  /**
   * Correlation ID for tracing the error across services
   */
  correlationId?: string;

  /**
   * Original event type that was being processed
   */
  eventType?: string;

  /**
   * User ID associated with the event
   */
  userId?: string;

  /**
   * Journey associated with the event
   */
  journey?: string;

  /**
   * Root cause of the error
   */
  cause?: Error | unknown;
}

/**
 * Exception thrown when an error occurs during the internal processing of a valid event.
 * 
 * This exception is used for system errors that occur after event validation but before
 * the completion of event processing. These errors represent internal failures rather than
 * client errors, and typically require system administrator attention.
 * 
 * Examples include:
 * - Rule evaluation errors
 * - Achievement processing failures
 * - Database transaction issues
 * - Point calculation errors
 * - Reward distribution failures
 */
export class EventProcessingException extends BaseEventException {
  /**
   * Processing stage where the error occurred
   */
  private processingStage: string;

  /**
   * Correlation ID for tracing the error across services
   */
  private correlationId: string;

  /**
   * Original event type that was being processed
   */
  private eventType: string;

  /**
   * User ID associated with the event
   */
  private userId: string;

  /**
   * Journey associated with the event
   */
  private journey: string;

  /**
   * Root cause of the error
   */
  private cause: Error | unknown;

  /**
   * Creates a new EventProcessingException
   * 
   * @param message Error message
   * @param metadata Additional metadata for the exception
   */
  constructor(message: string, metadata: EventProcessingExceptionMetadata = {}) {
    // Set default metadata for system errors
    const enhancedMetadata: EventProcessingExceptionMetadata = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorType: 'SYSTEM',
      errorCode: 'EVENT_PROCESSING_ERROR',
      ...metadata,
    };

    // Call parent constructor
    super(message, enhancedMetadata);

    // Set exception properties
    this.processingStage = metadata.processingStage || 'unknown';
    this.correlationId = metadata.correlationId || this.generateCorrelationId();
    this.eventType = metadata.eventType || 'unknown';
    this.userId = metadata.userId || 'unknown';
    this.journey = metadata.journey || 'unknown';
    this.cause = metadata.cause;

    // Set name explicitly for better error identification
    this.name = 'EventProcessingException';

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, EventProcessingException.prototype);

    // Capture stack trace if cause is an Error
    if (this.cause instanceof Error && !this.cause.stack) {
      Error.captureStackTrace(this.cause, this.constructor);
    }
  }

  /**
   * Get the processing stage where the error occurred
   */
  public getProcessingStage(): string {
    return this.processingStage;
  }

  /**
   * Get the correlation ID for tracing the error across services
   */
  public getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Get the original event type that was being processed
   */
  public getEventType(): string {
    return this.eventType;
  }

  /**
   * Get the user ID associated with the event
   */
  public getUserId(): string {
    return this.userId;
  }

  /**
   * Get the journey associated with the event
   */
  public getJourney(): string {
    return this.journey;
  }

  /**
   * Get the root cause of the error
   */
  public getCause(): Error | unknown {
    return this.cause;
  }

  /**
   * Generate a correlation ID if one was not provided
   * @private
   */
  private generateCorrelationId(): string {
    return `event-error-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Serialize the exception for logging and monitoring
   * @override
   */
  public toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    return {
      ...baseJson,
      processingStage: this.processingStage,
      correlationId: this.correlationId,
      eventType: this.eventType,
      userId: this.userId,
      journey: this.journey,
      cause: this.cause instanceof Error ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack,
      } : this.cause,
    };
  }

  /**
   * Create an EventProcessingException from a rule evaluation error
   * 
   * @param message Error message
   * @param eventType The type of event being processed
   * @param userId The user ID associated with the event
   * @param cause The original error that caused the rule evaluation failure
   * @param metadata Additional metadata
   */
  public static fromRuleEvaluationError(
    message: string,
    eventType: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<EventProcessingExceptionMetadata> = {},
  ): EventProcessingException {
    return new EventProcessingException(message, {
      processingStage: 'rule-evaluation',
      eventType,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create an EventProcessingException from an achievement processing error
   * 
   * @param message Error message
   * @param eventType The type of event being processed
   * @param userId The user ID associated with the event
   * @param cause The original error that caused the achievement processing failure
   * @param metadata Additional metadata
   */
  public static fromAchievementProcessingError(
    message: string,
    eventType: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<EventProcessingExceptionMetadata> = {},
  ): EventProcessingException {
    return new EventProcessingException(message, {
      processingStage: 'achievement-processing',
      eventType,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create an EventProcessingException from a database transaction error
   * 
   * @param message Error message
   * @param eventType The type of event being processed
   * @param userId The user ID associated with the event
   * @param cause The original error that caused the database transaction failure
   * @param metadata Additional metadata
   */
  public static fromDatabaseError(
    message: string,
    eventType: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<EventProcessingExceptionMetadata> = {},
  ): EventProcessingException {
    return new EventProcessingException(message, {
      processingStage: 'database-transaction',
      eventType,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create an EventProcessingException from a point calculation error
   * 
   * @param message Error message
   * @param eventType The type of event being processed
   * @param userId The user ID associated with the event
   * @param cause The original error that caused the point calculation failure
   * @param metadata Additional metadata
   */
  public static fromPointCalculationError(
    message: string,
    eventType: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<EventProcessingExceptionMetadata> = {},
  ): EventProcessingException {
    return new EventProcessingException(message, {
      processingStage: 'point-calculation',
      eventType,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create an EventProcessingException from a reward distribution error
   * 
   * @param message Error message
   * @param eventType The type of event being processed
   * @param userId The user ID associated with the event
   * @param cause The original error that caused the reward distribution failure
   * @param metadata Additional metadata
   */
  public static fromRewardDistributionError(
    message: string,
    eventType: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<EventProcessingExceptionMetadata> = {},
  ): EventProcessingException {
    return new EventProcessingException(message, {
      processingStage: 'reward-distribution',
      eventType,
      userId,
      cause,
      ...metadata,
    });
  }
}
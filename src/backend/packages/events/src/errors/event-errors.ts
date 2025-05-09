/**
 * @file event-errors.ts
 * @description Defines specialized error classes for event processing with journey-specific categorization.
 * Extends the base error classes from @austa/errors with event-specific context like event type, event ID,
 * source service, and processing stage. These error types enable precise error handling in the event
 * processing pipeline and support automatic retry classification based on error type.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with consistent processing
 * - Create journey-specific error classification system
 * - Implement robust error handling across services
 * - Support retry mechanisms with error categorization
 */

import { AppException, ErrorType } from '@austa/errors';
import { EventTypeId } from '../interfaces/event-type.interface';
import { JourneyType } from '@austa/interfaces/common';

/**
 * Enum representing different stages of event processing where errors can occur.
 */
export enum EventProcessingStage {
  /** Validation stage - event data is being validated against schema */
  VALIDATION = 'validation',
  
  /** Processing stage - event is being processed by business logic */
  PROCESSING = 'processing',
  
  /** Delivery stage - event is being delivered to consumers */
  DELIVERY = 'delivery',
  
  /** Persistence stage - event is being saved to storage */
  PERSISTENCE = 'persistence',
  
  /** Schema stage - event schema is being validated or transformed */
  SCHEMA = 'schema',
  
  /** Retry stage - event is being retried after a failure */
  RETRY = 'retry'
}

/**
 * Interface for event error context that provides additional information about the event
 * that caused the error.
 */
export interface IEventErrorContext {
  /** The ID of the event that caused the error */
  eventId?: string;
  
  /** The type of the event that caused the error */
  eventType?: EventTypeId;
  
  /** The journey associated with the event */
  journey?: JourneyType;
  
  /** The source service that produced the event */
  sourceService?: string;
  
  /** The stage of event processing where the error occurred */
  processingStage?: EventProcessingStage;
  
  /** Whether the error is retryable */
  retryable?: boolean;
  
  /** The number of retry attempts made so far */
  retryAttempts?: number;
  
  /** The maximum number of retry attempts allowed */
  maxRetryAttempts?: number;
  
  /** Additional context-specific details */
  details?: Record<string, any>;
}

/**
 * Base class for all event-related errors in the AUSTA SuperApp.
 * Extends AppException with event-specific context.
 */
export class EventError extends AppException {
  /** The event error context */
  public readonly eventContext: IEventErrorContext;

  /**
   * Creates a new EventError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(message, type, code, details, cause);
    this.eventContext = eventContext;
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventError.prototype);
  }

  /**
   * Returns a JSON representation of the exception including event context.
   * Used for consistent error responses across the application.
   * 
   * @returns JSON object with standardized error structure
   */
  override toJSON(): Record<string, any> {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        details: this.details,
        eventContext: this.eventContext
      }
    };
  }

  /**
   * Determines if the error is retryable based on the event context.
   * 
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(): boolean {
    return this.eventContext.retryable ?? false;
  }

  /**
   * Gets the retry attempts made so far.
   * 
   * @returns The number of retry attempts made so far
   */
  getRetryAttempts(): number {
    return this.eventContext.retryAttempts ?? 0;
  }

  /**
   * Gets the maximum number of retry attempts allowed.
   * 
   * @returns The maximum number of retry attempts allowed
   */
  getMaxRetryAttempts(): number {
    return this.eventContext.maxRetryAttempts ?? 0;
  }

  /**
   * Checks if the error has exceeded the maximum number of retry attempts.
   * 
   * @returns True if the error has exceeded the maximum number of retry attempts
   */
  hasExceededMaxRetries(): boolean {
    return this.getRetryAttempts() >= this.getMaxRetryAttempts();
  }

  /**
   * Creates a new instance of the error with an incremented retry count.
   * 
   * @returns A new instance of the error with an incremented retry count
   */
  withIncrementedRetryCount(): EventError {
    const newContext = {
      ...this.eventContext,
      retryAttempts: (this.eventContext.retryAttempts ?? 0) + 1
    };

    return new (this.constructor as any)(
      this.message,
      this.type,
      this.code,
      newContext,
      this.details,
      this.cause
    );
  }
}

/**
 * Error class for event validation failures.
 * Used when an event fails validation checks before processing.
 */
export class EventValidationError extends EventError {
  /**
   * Creates a new EventValidationError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      code,
      { ...eventContext, processingStage: EventProcessingStage.VALIDATION, retryable: false },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventValidationError.prototype);
  }
}

/**
 * Error class for event schema-related failures.
 * Used when an event has schema incompatibilities or version mismatches.
 */
export class EventSchemaError extends EventError {
  /**
   * Creates a new EventSchemaError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      code,
      { ...eventContext, processingStage: EventProcessingStage.SCHEMA, retryable: false },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventSchemaError.prototype);
  }
}

/**
 * Error class for event processing failures.
 * Used when an event fails during business logic processing.
 */
export class EventProcessingError extends EventError {
  /**
   * Creates a new EventProcessingError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      code,
      { ...eventContext, processingStage: EventProcessingStage.PROCESSING, retryable: true },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventProcessingError.prototype);
  }
}

/**
 * Error class for event delivery failures.
 * Used when an event fails to be delivered to consumers.
 */
export class EventDeliveryError extends EventError {
  /**
   * Creates a new EventDeliveryError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      code,
      { ...eventContext, processingStage: EventProcessingStage.DELIVERY, retryable: true },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventDeliveryError.prototype);
  }
}

/**
 * Error class for event persistence failures.
 * Used when an event fails to be saved to storage.
 */
export class EventPersistenceError extends EventError {
  /**
   * Creates a new EventPersistenceError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      { ...eventContext, processingStage: EventProcessingStage.PERSISTENCE, retryable: true },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventPersistenceError.prototype);
  }
}

/**
 * Error class for retryable event failures.
 * Used when an event failure can be retried.
 */
export class EventRetryableError extends EventError {
  /**
   * Creates a new EventRetryableError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      { ...eventContext, processingStage: EventProcessingStage.RETRY, retryable: true },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventRetryableError.prototype);
  }
}

/**
 * Error class for non-retryable event failures.
 * Used when an event failure cannot be retried.
 */
export class EventNonRetryableError extends EventError {
  /**
   * Creates a new EventNonRetryableError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      { ...eventContext, processingStage: EventProcessingStage.RETRY, retryable: false },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventNonRetryableError.prototype);
  }
}

/**
 * Error class for health journey event failures.
 * Used for errors specific to health journey events.
 */
export class HealthEventError extends EventError {
  /**
   * Creates a new HealthEventError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      type,
      code,
      { ...eventContext, journey: 'health' },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HealthEventError.prototype);
  }
}

/**
 * Error class for care journey event failures.
 * Used for errors specific to care journey events.
 */
export class CareEventError extends EventError {
  /**
   * Creates a new CareEventError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      type,
      code,
      { ...eventContext, journey: 'care' },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CareEventError.prototype);
  }
}

/**
 * Error class for plan journey event failures.
 * Used for errors specific to plan journey events.
 */
export class PlanEventError extends EventError {
  /**
   * Creates a new PlanEventError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    eventContext: IEventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      type,
      code,
      { ...eventContext, journey: 'plan' },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PlanEventError.prototype);
  }
}

/**
 * Utility function to determine if an error is an EventError.
 * 
 * @param error - The error to check
 * @returns True if the error is an EventError
 */
export function isEventError(error: Error): error is EventError {
  return error instanceof EventError;
}

/**
 * Utility function to determine if an error is retryable.
 * 
 * @param error - The error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (isEventError(error)) {
    return error.isRetryable();
  }
  
  // Default behavior for non-EventError errors
  // Technical and External errors are generally retryable
  if (error instanceof AppException) {
    return error.type === ErrorType.TECHNICAL || error.type === ErrorType.EXTERNAL;
  }
  
  // For unknown errors, default to retryable
  return true;
}

/**
 * Utility function to determine if an error has exceeded the maximum number of retry attempts.
 * 
 * @param error - The error to check
 * @param defaultMaxRetries - The default maximum number of retries if not specified in the error
 * @returns True if the error has exceeded the maximum number of retry attempts
 */
export function hasExceededMaxRetries(error: Error, defaultMaxRetries = 3): boolean {
  if (isEventError(error)) {
    return error.hasExceededMaxRetries();
  }
  
  // For non-EventError errors, use the default max retries
  return false;
}

/**
 * Utility function to create a new error with an incremented retry count.
 * 
 * @param error - The error to increment the retry count for
 * @returns A new error with an incremented retry count
 */
export function incrementRetryCount(error: Error): Error {
  if (isEventError(error)) {
    return error.withIncrementedRetryCount();
  }
  
  // For non-EventError errors, return the original error
  return error;
}

/**
 * Utility function to create an event error from a generic error.
 * 
 * @param error - The error to convert
 * @param eventContext - The event context to add to the error
 * @param defaultCode - The default error code to use if not specified
 * @returns An EventError instance
 */
export function createEventErrorFromError(
  error: Error,
  eventContext: IEventErrorContext,
  defaultCode = 'EVENT_PROCESSING_ERROR'
): EventError {
  if (isEventError(error)) {
    return error;
  }
  
  if (error instanceof AppException) {
    return new EventError(
      error.message,
      error.type,
      error.code,
      eventContext,
      error.details,
      error
    );
  }
  
  // For unknown errors, create a generic EventError
  return new EventError(
    error.message || 'An unknown error occurred during event processing',
    ErrorType.TECHNICAL,
    defaultCode,
    eventContext,
    undefined,
    error
  );
}

/**
 * Utility function to create a journey-specific event error.
 * 
 * @param error - The error to convert
 * @param journey - The journey to associate with the error
 * @param eventContext - The event context to add to the error
 * @param defaultCode - The default error code to use if not specified
 * @returns A journey-specific EventError instance
 */
export function createJourneyEventError(
  error: Error,
  journey: JourneyType,
  eventContext: IEventErrorContext,
  defaultCode = 'EVENT_PROCESSING_ERROR'
): EventError {
  const baseError = isEventError(error) ? error : createEventErrorFromError(error, eventContext, defaultCode);
  
  switch (journey) {
    case 'health':
      return new HealthEventError(
        baseError.message,
        baseError.type,
        baseError.code,
        { ...baseError.eventContext, ...eventContext },
        baseError.details,
        baseError.cause
      );
    case 'care':
      return new CareEventError(
        baseError.message,
        baseError.type,
        baseError.code,
        { ...baseError.eventContext, ...eventContext },
        baseError.details,
        baseError.cause
      );
    case 'plan':
      return new PlanEventError(
        baseError.message,
        baseError.type,
        baseError.code,
        { ...baseError.eventContext, ...eventContext },
        baseError.details,
        baseError.cause
      );
    default:
      return baseError;
  }
}

/**
 * Error codes for event processing errors.
 */
export enum EventErrorCode {
  // Validation errors
  INVALID_EVENT_SCHEMA = 'INVALID_EVENT_SCHEMA',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_EVENT_TYPE = 'INVALID_EVENT_TYPE',
  INVALID_EVENT_VERSION = 'INVALID_EVENT_VERSION',
  INVALID_EVENT_PAYLOAD = 'INVALID_EVENT_PAYLOAD',
  
  // Processing errors
  EVENT_PROCESSING_FAILED = 'EVENT_PROCESSING_FAILED',
  EVENT_HANDLER_NOT_FOUND = 'EVENT_HANDLER_NOT_FOUND',
  EVENT_RULE_EVALUATION_FAILED = 'EVENT_RULE_EVALUATION_FAILED',
  EVENT_TRANSFORMATION_FAILED = 'EVENT_TRANSFORMATION_FAILED',
  
  // Delivery errors
  EVENT_DELIVERY_FAILED = 'EVENT_DELIVERY_FAILED',
  KAFKA_PRODUCER_ERROR = 'KAFKA_PRODUCER_ERROR',
  KAFKA_CONSUMER_ERROR = 'KAFKA_CONSUMER_ERROR',
  
  // Persistence errors
  EVENT_PERSISTENCE_FAILED = 'EVENT_PERSISTENCE_FAILED',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  
  // Retry errors
  MAX_RETRY_ATTEMPTS_EXCEEDED = 'MAX_RETRY_ATTEMPTS_EXCEEDED',
  RETRY_STRATEGY_FAILED = 'RETRY_STRATEGY_FAILED',
  
  // Journey-specific errors
  HEALTH_EVENT_PROCESSING_ERROR = 'HEALTH_EVENT_PROCESSING_ERROR',
  CARE_EVENT_PROCESSING_ERROR = 'CARE_EVENT_PROCESSING_ERROR',
  PLAN_EVENT_PROCESSING_ERROR = 'PLAN_EVENT_PROCESSING_ERROR',
  
  // System errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR'
}
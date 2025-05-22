import { AppException, ErrorType } from '@austa/errors';
import { IBaseEvent } from '../interfaces/base-event.interface';

/**
 * Enum representing different stages of event processing where errors can occur.
 * Used to provide more context about where in the event lifecycle an error happened.
 */
export enum EventProcessingStage {
  /**
   * Error occurred during initial validation of the event structure or data
   */
  VALIDATION = 'validation',
  
  /**
   * Error occurred during deserialization of the event from its transport format
   */
  DESERIALIZATION = 'deserialization',
  
  /**
   * Error occurred during the actual processing of the event business logic
   */
  PROCESSING = 'processing',
  
  /**
   * Error occurred when publishing/forwarding the event to another system
   */
  PUBLISHING = 'publishing',
  
  /**
   * Error occurred during persistence of the event or its effects
   */
  PERSISTENCE = 'persistence'
}

/**
 * Enum representing different categories of event errors for retry classification.
 * Used to determine if and how an event should be retried when processing fails.
 */
export enum EventErrorCategory {
  /**
   * Transient errors that are likely to succeed if retried (network issues, temporary unavailability)
   */
  TRANSIENT = 'transient',
  
  /**
   * Permanent errors that will never succeed regardless of retries (invalid data, schema mismatch)
   */
  PERMANENT = 'permanent',
  
  /**
   * Errors that might succeed if retried after some delay (rate limiting, resource contention)
   */
  RETRIABLE = 'retriable',
  
  /**
   * Errors that require manual intervention to resolve (configuration issues, missing dependencies)
   */
  MANUAL = 'manual'
}

/**
 * Interface for additional context information about the event that caused the error.
 * Provides structured metadata for debugging, monitoring, and error handling.
 */
export interface EventErrorContext {
  /**
   * The unique identifier of the event that caused the error
   */
  eventId?: string;
  
  /**
   * The type of event that caused the error
   */
  eventType?: string;
  
  /**
   * The source service or component that produced the event
   */
  eventSource?: string;
  
  /**
   * The stage of event processing where the error occurred
   */
  processingStage?: EventProcessingStage;
  
  /**
   * The journey (health, care, plan) associated with the event
   */
  journey?: string;
  
  /**
   * The user ID associated with the event, if applicable
   */
  userId?: string;
  
  /**
   * The number of times this event has been retried, if applicable
   */
  retryCount?: number;
  
  /**
   * Additional metadata relevant to the error
   */
  metadata?: Record<string, any>;
}

/**
 * Base class for all event-related exceptions in the AUSTA SuperApp.
 * Extends the core AppException with event-specific context and retry classification.
 */
export class EventException extends AppException {
  /**
   * The category of the error for retry classification
   */
  public readonly category: EventErrorCategory;
  
  /**
   * Detailed context about the event that caused the error
   */
  public readonly eventContext: EventErrorContext;
  
  /**
   * Creates a new EventException instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization (e.g., "EVENT_001")
   * @param category - Category of the error for retry classification
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    category: EventErrorCategory,
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(message, type, code, details, cause);
    this.category = category;
    this.eventContext = eventContext;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventException.prototype);
  }

  /**
   * Creates an EventException from an existing event and error.
   * Utility method to simplify creating event exceptions with proper context.
   * 
   * @param event - The event that was being processed when the error occurred
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param stage - The stage of event processing where the error occurred
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new EventException instance with context from the event
   */
  static fromEvent(
    event: IBaseEvent,
    message: string,
    type: ErrorType,
    code: string,
    category: EventErrorCategory,
    stage: EventProcessingStage,
    details?: any,
    cause?: Error
  ): EventException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      processingStage: stage,
      journey: event.journey,
      userId: event.userId,
      metadata: event.metadata
    };
    
    return new EventException(message, type, code, category, context, details, cause);
  }

  /**
   * Returns a JSON representation of the exception including event context.
   * Extends the base AppException toJSON method with event-specific information.
   * 
   * @returns JSON object with standardized error structure including event context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        category: this.category,
        eventContext: this.eventContext
      }
    };
  }

  /**
   * Determines if this error should be retried based on its category.
   * 
   * @returns True if the error is retriable, false otherwise
   */
  isRetriable(): boolean {
    return this.category === EventErrorCategory.TRANSIENT || 
           this.category === EventErrorCategory.RETRIABLE;
  }
}

/**
 * Exception thrown when an event fails validation.
 * These errors are typically permanent and should not be retried.
 */
export class EventValidationException extends EventException {
  /**
   * Creates a new EventValidationException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Validation details including failed constraints
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'EVENT_VALIDATION_ERROR',
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      code,
      EventErrorCategory.PERMANENT,
      {
        ...eventContext,
        processingStage: EventProcessingStage.VALIDATION
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventValidationException.prototype);
  }

  /**
   * Creates an EventValidationException from an existing event.
   * 
   * @param event - The event that failed validation
   * @param message - Human-readable error message
   * @param details - Validation details including failed constraints
   * @param cause - Original error that caused this exception, if any
   * @returns A new EventValidationException instance
   */
  static fromEvent(
    event: IBaseEvent,
    message: string,
    details?: any,
    cause?: Error
  ): EventValidationException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      journey: event.journey,
      userId: event.userId,
      metadata: event.metadata
    };
    
    return new EventValidationException(message, 'EVENT_VALIDATION_ERROR', context, details, cause);
  }
}

/**
 * Exception thrown when an event cannot be deserialized from its transport format.
 * These errors are typically permanent and should not be retried.
 */
export class EventDeserializationException extends EventException {
  /**
   * Creates a new EventDeserializationException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Deserialization details including parsing errors
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'EVENT_DESERIALIZATION_ERROR',
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      EventErrorCategory.PERMANENT,
      {
        ...eventContext,
        processingStage: EventProcessingStage.DESERIALIZATION
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventDeserializationException.prototype);
  }

  /**
   * Creates an EventDeserializationException with partial event context.
   * Used when the event couldn't be fully deserialized but some metadata is available.
   * 
   * @param partialContext - Any available context about the event
   * @param message - Human-readable error message
   * @param details - Deserialization details including parsing errors
   * @param cause - Original error that caused this exception, if any
   * @returns A new EventDeserializationException instance
   */
  static withPartialContext(
    partialContext: Partial<EventErrorContext>,
    message: string,
    details?: any,
    cause?: Error
  ): EventDeserializationException {
    return new EventDeserializationException(
      message,
      'EVENT_DESERIALIZATION_ERROR',
      partialContext as EventErrorContext,
      details,
      cause
    );
  }
}

/**
 * Exception thrown when an event schema version is incompatible.
 * These errors are permanent and should not be retried without schema migration.
 */
export class EventSchemaVersionException extends EventException {
  /**
   * Creates a new EventSchemaVersionException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Version details including expected and actual versions
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'EVENT_SCHEMA_VERSION_ERROR',
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      EventErrorCategory.PERMANENT,
      {
        ...eventContext,
        processingStage: EventProcessingStage.VALIDATION
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventSchemaVersionException.prototype);
  }

  /**
   * Creates an EventSchemaVersionException from an existing event.
   * 
   * @param event - The event with incompatible schema version
   * @param expectedVersion - The expected schema version
   * @param actualVersion - The actual schema version found in the event
   * @param cause - Original error that caused this exception, if any
   * @returns A new EventSchemaVersionException instance
   */
  static fromEvent(
    event: IBaseEvent,
    expectedVersion: string,
    actualVersion: string,
    cause?: Error
  ): EventSchemaVersionException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      journey: event.journey,
      userId: event.userId,
      metadata: event.metadata
    };
    
    const details = {
      expectedVersion,
      actualVersion,
      migrationRequired: true
    };
    
    return new EventSchemaVersionException(
      `Event schema version mismatch. Expected ${expectedVersion}, got ${actualVersion}.`,
      'EVENT_SCHEMA_VERSION_ERROR',
      context,
      details,
      cause
    );
  }
}

/**
 * Exception thrown when an event processing fails due to a transient issue.
 * These errors are typically retriable after a delay.
 */
export class EventProcessingException extends EventException {
  /**
   * Creates a new EventProcessingException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Processing details including failure point
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'EVENT_PROCESSING_ERROR',
    category: EventErrorCategory = EventErrorCategory.RETRIABLE,
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      category,
      {
        ...eventContext,
        processingStage: EventProcessingStage.PROCESSING
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventProcessingException.prototype);
  }

  /**
   * Creates an EventProcessingException from an existing event.
   * 
   * @param event - The event that failed processing
   * @param message - Human-readable error message
   * @param category - Category of the error for retry classification
   * @param details - Processing details including failure point
   * @param cause - Original error that caused this exception, if any
   * @returns A new EventProcessingException instance
   */
  static fromEvent(
    event: IBaseEvent,
    message: string,
    category: EventErrorCategory = EventErrorCategory.RETRIABLE,
    details?: any,
    cause?: Error
  ): EventProcessingException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      journey: event.journey,
      userId: event.userId,
      retryCount: event.metadata?.retryCount || 0,
      metadata: event.metadata
    };
    
    return new EventProcessingException(message, 'EVENT_PROCESSING_ERROR', category, context, details, cause);
  }
}

/**
 * Exception thrown when an event cannot be published to its destination.
 * These errors are typically transient and should be retried.
 */
export class EventPublishingException extends EventException {
  /**
   * Creates a new EventPublishingException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Publishing details including destination and error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'EVENT_PUBLISHING_ERROR',
    category: EventErrorCategory = EventErrorCategory.TRANSIENT,
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      code,
      category,
      {
        ...eventContext,
        processingStage: EventProcessingStage.PUBLISHING
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventPublishingException.prototype);
  }

  /**
   * Creates an EventPublishingException from an existing event.
   * 
   * @param event - The event that failed to publish
   * @param destination - The destination where publishing failed (e.g., Kafka topic)
   * @param message - Human-readable error message
   * @param category - Category of the error for retry classification
   * @param cause - Original error that caused this exception, if any
   * @returns A new EventPublishingException instance
   */
  static fromEvent(
    event: IBaseEvent,
    destination: string,
    message: string,
    category: EventErrorCategory = EventErrorCategory.TRANSIENT,
    cause?: Error
  ): EventPublishingException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      journey: event.journey,
      userId: event.userId,
      metadata: event.metadata
    };
    
    const details = {
      destination,
      timestamp: new Date().toISOString()
    };
    
    return new EventPublishingException(
      message || `Failed to publish event to ${destination}`,
      'EVENT_PUBLISHING_ERROR',
      category,
      context,
      details,
      cause
    );
  }
}

/**
 * Exception thrown when an event cannot be persisted to storage.
 * These errors can be transient (database connection issues) or permanent (constraint violations).
 */
export class EventPersistenceException extends EventException {
  /**
   * Creates a new EventPersistenceException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Persistence details including storage target and error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'EVENT_PERSISTENCE_ERROR',
    category: EventErrorCategory = EventErrorCategory.TRANSIENT,
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      category,
      {
        ...eventContext,
        processingStage: EventProcessingStage.PERSISTENCE
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventPersistenceException.prototype);
  }

  /**
   * Creates an EventPersistenceException from an existing event.
   * 
   * @param event - The event that failed to persist
   * @param storageTarget - The storage target where persistence failed (e.g., database table)
   * @param message - Human-readable error message
   * @param category - Category of the error for retry classification
   * @param cause - Original error that caused this exception, if any
   * @returns A new EventPersistenceException instance
   */
  static fromEvent(
    event: IBaseEvent,
    storageTarget: string,
    message: string,
    category: EventErrorCategory = EventErrorCategory.TRANSIENT,
    cause?: Error
  ): EventPersistenceException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      journey: event.journey,
      userId: event.userId,
      metadata: event.metadata
    };
    
    const details = {
      storageTarget,
      timestamp: new Date().toISOString()
    };
    
    return new EventPersistenceException(
      message || `Failed to persist event to ${storageTarget}`,
      'EVENT_PERSISTENCE_ERROR',
      category,
      context,
      details,
      cause
    );
  }

  /**
   * Determines if this persistence error is due to a constraint violation.
   * Constraint violations are typically permanent errors that should not be retried.
   * 
   * @returns True if the error is a constraint violation, false otherwise
   */
  isConstraintViolation(): boolean {
    // Check for common database constraint violation error patterns
    const cause = this.cause?.toString().toLowerCase() || '';
    return cause.includes('constraint') || 
           cause.includes('duplicate') || 
           cause.includes('unique') ||
           cause.includes('foreign key');
  }
}

/**
 * Exception thrown when an event handler is not found for an event type.
 * These errors are permanent and should not be retried without configuration changes.
 */
export class EventHandlerNotFoundException extends EventException {
  /**
   * Creates a new EventHandlerNotFoundException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'EVENT_HANDLER_NOT_FOUND',
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      EventErrorCategory.MANUAL,
      {
        ...eventContext,
        processingStage: EventProcessingStage.PROCESSING
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventHandlerNotFoundException.prototype);
  }

  /**
   * Creates an EventHandlerNotFoundException from an existing event.
   * 
   * @param event - The event for which no handler was found
   * @param cause - Original error that caused this exception, if any
   * @returns A new EventHandlerNotFoundException instance
   */
  static fromEvent(
    event: IBaseEvent,
    cause?: Error
  ): EventHandlerNotFoundException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      journey: event.journey,
      userId: event.userId,
      metadata: event.metadata
    };
    
    return new EventHandlerNotFoundException(
      `No handler found for event type: ${event.type}`,
      'EVENT_HANDLER_NOT_FOUND',
      context,
      { availableHandlers: 'Check registered event handlers in the service' },
      cause
    );
  }
}

/**
 * Exception thrown when an event exceeds the maximum retry count.
 * These errors are moved to the dead letter queue for manual intervention.
 */
export class EventMaxRetriesExceededException extends EventException {
  /**
   * Creates a new EventMaxRetriesExceededException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'EVENT_MAX_RETRIES_EXCEEDED',
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      EventErrorCategory.MANUAL,
      eventContext,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventMaxRetriesExceededException.prototype);
  }

  /**
   * Creates an EventMaxRetriesExceededException from an existing event.
   * 
   * @param event - The event that exceeded maximum retries
   * @param maxRetries - The maximum number of retries allowed
   * @param lastError - The last error that occurred during processing
   * @returns A new EventMaxRetriesExceededException instance
   */
  static fromEvent(
    event: IBaseEvent,
    maxRetries: number,
    lastError?: Error
  ): EventMaxRetriesExceededException {
    const retryCount = event.metadata?.retryCount || 0;
    
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      journey: event.journey,
      userId: event.userId,
      retryCount,
      processingStage: EventProcessingStage.PROCESSING,
      metadata: event.metadata
    };
    
    const details = {
      maxRetries,
      retryCount,
      lastErrorMessage: lastError?.message,
      lastErrorStack: lastError?.stack,
      movedToDLQ: true
    };
    
    return new EventMaxRetriesExceededException(
      `Maximum retry count (${maxRetries}) exceeded for event ${event.eventId}`,
      'EVENT_MAX_RETRIES_EXCEEDED',
      context,
      details,
      lastError
    );
  }
}

/**
 * Journey-specific exception for Health journey events.
 * Provides specialized error handling for health-related events.
 */
export class HealthEventException extends EventException {
  /**
   * Creates a new HealthEventException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'HEALTH_EVENT_ERROR',
    category: EventErrorCategory = EventErrorCategory.RETRIABLE,
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      code,
      category,
      {
        ...eventContext,
        journey: 'health'
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HealthEventException.prototype);
  }

  /**
   * Creates a HealthEventException from an existing event.
   * 
   * @param event - The health journey event that caused the error
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   * @returns A new HealthEventException instance
   */
  static fromEvent(
    event: IBaseEvent,
    message: string,
    code: string = 'HEALTH_EVENT_ERROR',
    category: EventErrorCategory = EventErrorCategory.RETRIABLE,
    details?: any,
    cause?: Error
  ): HealthEventException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      processingStage: EventProcessingStage.PROCESSING,
      userId: event.userId,
      metadata: event.metadata
    };
    
    return new HealthEventException(message, code, category, context, details, cause);
  }
}

/**
 * Journey-specific exception for Care journey events.
 * Provides specialized error handling for care-related events.
 */
export class CareEventException extends EventException {
  /**
   * Creates a new CareEventException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'CARE_EVENT_ERROR',
    category: EventErrorCategory = EventErrorCategory.RETRIABLE,
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      code,
      category,
      {
        ...eventContext,
        journey: 'care'
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CareEventException.prototype);
  }

  /**
   * Creates a CareEventException from an existing event.
   * 
   * @param event - The care journey event that caused the error
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   * @returns A new CareEventException instance
   */
  static fromEvent(
    event: IBaseEvent,
    message: string,
    code: string = 'CARE_EVENT_ERROR',
    category: EventErrorCategory = EventErrorCategory.RETRIABLE,
    details?: any,
    cause?: Error
  ): CareEventException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      processingStage: EventProcessingStage.PROCESSING,
      userId: event.userId,
      metadata: event.metadata
    };
    
    return new CareEventException(message, code, category, context, details, cause);
  }
}

/**
 * Journey-specific exception for Plan journey events.
 * Provides specialized error handling for plan-related events.
 */
export class PlanEventException extends EventException {
  /**
   * Creates a new PlanEventException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param eventContext - Additional context about the event that caused the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string = 'PLAN_EVENT_ERROR',
    category: EventErrorCategory = EventErrorCategory.RETRIABLE,
    eventContext: EventErrorContext,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      code,
      category,
      {
        ...eventContext,
        journey: 'plan'
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PlanEventException.prototype);
  }

  /**
   * Creates a PlanEventException from an existing event.
   * 
   * @param event - The plan journey event that caused the error
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param category - Category of the error for retry classification
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   * @returns A new PlanEventException instance
   */
  static fromEvent(
    event: IBaseEvent,
    message: string,
    code: string = 'PLAN_EVENT_ERROR',
    category: EventErrorCategory = EventErrorCategory.RETRIABLE,
    details?: any,
    cause?: Error
  ): PlanEventException {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      processingStage: EventProcessingStage.PROCESSING,
      userId: event.userId,
      metadata: event.metadata
    };
    
    return new PlanEventException(message, code, category, context, details, cause);
  }
}
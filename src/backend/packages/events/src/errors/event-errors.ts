/**
 * @file event-errors.ts
 * @description Specialized error classes for event processing with journey-specific categorization.
 * Extends the base error classes from @austa/errors with event-specific context like event type,
 * event ID, source service, and processing stage. These error types enable precise error handling
 * in the event processing pipeline and support automatic retry classification based on error type.
 */

import { BaseError, ErrorType } from '@austa/errors/base';
import { ExternalApiError, ExternalDependencyUnavailableError } from '@austa/errors/categories/external.errors';
import { DatabaseError, DataProcessingError, TimeoutError } from '@austa/errors/categories/technical.errors';
import { SchemaValidationError } from '@austa/errors/categories/validation.errors';

/**
 * Enum representing different stages of event processing.
 * Used to provide context about where in the event lifecycle an error occurred.
 */
export enum EventProcessingStage {
  VALIDATION = 'validation',
  DESERIALIZATION = 'deserialization',
  ROUTING = 'routing',
  PROCESSING = 'processing',
  PERSISTENCE = 'persistence',
  RESPONSE = 'response'
}

/**
 * Interface for event error context that provides additional information
 * about the event that caused the error.
 */
export interface EventErrorContext {
  /** Unique identifier of the event */
  eventId?: string;
  /** Type of the event */
  eventType?: string;
  /** Source service or component that produced the event */
  eventSource?: string;
  /** Processing stage where the error occurred */
  processingStage?: EventProcessingStage;
  /** Additional context-specific details */
  details?: Record<string, any>;
}

/**
 * Base class for all event-related errors.
 * Extends the BaseError class with event-specific context.
 */
export class EventError extends BaseError {
  /**
   * Creates a new EventError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization
   * @param context - Event-specific context information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    public readonly context: EventErrorContext = {},
    cause?: Error
  ) {
    super(message, type, code, context, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventError.prototype);
  }

  /**
   * Returns a JSON representation of the exception with event context.
   * Overrides the base toJSON method to include event-specific context.
   * 
   * @returns JSON object with standardized error structure and event context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        eventContext: {
          eventId: this.context.eventId,
          eventType: this.context.eventType,
          eventSource: this.context.eventSource,
          processingStage: this.context.processingStage
        }
      }
    };
  }

  /**
   * Determines if this error should trigger an automatic retry.
   * 
   * @returns True if the error is considered retriable, false otherwise
   */
  isRetriable(): boolean {
    // By default, technical and external errors are retriable,
    // while validation and business errors are not
    return this.type === ErrorType.TECHNICAL || this.type === ErrorType.EXTERNAL;
  }

  /**
   * Creates a standardized event error message with context.
   * 
   * @param baseMessage - The base error message
   * @param context - Event context information
   * @returns Formatted error message with context
   */
  static createMessage(baseMessage: string, context: EventErrorContext): string {
    const contextParts: string[] = [];
    
    if (context.eventId) {
      contextParts.push(`Event ID: ${context.eventId}`);
    }
    
    if (context.eventType) {
      contextParts.push(`Event Type: ${context.eventType}`);
    }
    
    if (context.eventSource) {
      contextParts.push(`Source: ${context.eventSource}`);
    }
    
    if (context.processingStage) {
      contextParts.push(`Stage: ${context.processingStage}`);
    }
    
    if (contextParts.length === 0) {
      return baseMessage;
    }
    
    return `${baseMessage} [${contextParts.join(', ')}]`;
  }
}

/**
 * Error thrown when an event fails validation.
 */
export class EventValidationError extends EventError {
  constructor(
    message: string,
    context: EventErrorContext = {},
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      ErrorType.VALIDATION,
      'EVENT_VALIDATION_ERROR',
      context,
      cause
    );
  }

  isRetriable(): boolean {
    // Validation errors are never retriable
    return false;
  }
}

/**
 * Error thrown when an event schema is invalid or incompatible.
 */
export class EventSchemaError extends SchemaValidationError {
  constructor(
    message: string,
    public readonly context: EventErrorContext = {},
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      'EVENT_SCHEMA_ERROR',
      context,
      cause
    );
  }

  isRetriable(): boolean {
    // Schema errors are never retriable
    return false;
  }
}

/**
 * Error thrown when an event cannot be deserialized from its transport format.
 */
export class EventDeserializationError extends EventError {
  constructor(
    message: string,
    context: EventErrorContext = {},
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      ErrorType.TECHNICAL,
      'EVENT_DESERIALIZATION_ERROR',
      {
        ...context,
        processingStage: EventProcessingStage.DESERIALIZATION
      },
      cause
    );
  }

  isRetriable(): boolean {
    // Deserialization errors are generally not retriable
    // unless they're caused by a transient issue
    return this.cause instanceof TimeoutError || this.cause instanceof ExternalDependencyUnavailableError;
  }
}

/**
 * Error thrown when an event cannot be routed to an appropriate handler.
 */
export class EventRoutingError extends EventError {
  constructor(
    message: string,
    context: EventErrorContext = {},
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      ErrorType.TECHNICAL,
      'EVENT_ROUTING_ERROR',
      {
        ...context,
        processingStage: EventProcessingStage.ROUTING
      },
      cause
    );
  }
}

/**
 * Error thrown when an event processing fails due to business logic errors.
 */
export class EventProcessingError extends EventError {
  constructor(
    message: string,
    context: EventErrorContext = {},
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      ErrorType.BUSINESS,
      'EVENT_PROCESSING_ERROR',
      {
        ...context,
        processingStage: EventProcessingStage.PROCESSING
      },
      cause
    );
  }

  isRetriable(): boolean {
    // Business logic errors are generally not retriable
    return false;
  }
}

/**
 * Error thrown when an event cannot be persisted to the database.
 */
export class EventPersistenceError extends EventError {
  constructor(
    message: string,
    context: EventErrorContext = {},
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      ErrorType.TECHNICAL,
      'EVENT_PERSISTENCE_ERROR',
      {
        ...context,
        processingStage: EventProcessingStage.PERSISTENCE
      },
      cause
    );
  }

  isRetriable(): boolean {
    // Database errors are often retriable
    return true;
  }
}

/**
 * Error thrown when an external event source or destination is unavailable.
 */
export class EventExternalSystemError extends ExternalApiError {
  constructor(
    message: string,
    public readonly context: EventErrorContext = {},
    statusCode?: number,
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      'EVENT_EXTERNAL_SYSTEM_ERROR',
      statusCode,
      context,
      cause
    );
  }

  isRetriable(): boolean {
    // External system errors are often retriable, especially for
    // certain status codes (5xx) or specific error types
    if (this.statusCode) {
      // 5xx errors are server errors and generally retriable
      return this.statusCode >= 500 && this.statusCode < 600;
    }
    return true;
  }
}

/**
 * Error thrown when an event processing times out.
 */
export class EventTimeoutError extends TimeoutError {
  constructor(
    message: string,
    public readonly context: EventErrorContext = {},
    timeoutMs?: number,
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      'EVENT_TIMEOUT_ERROR',
      timeoutMs,
      context,
      cause
    );
  }

  isRetriable(): boolean {
    // Timeout errors are generally retriable
    return true;
  }
}

/**
 * Error thrown when an event cannot be processed due to a database error.
 */
export class EventDatabaseError extends DatabaseError {
  constructor(
    message: string,
    public readonly context: EventErrorContext = {},
    operation?: string,
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      'EVENT_DATABASE_ERROR',
      operation,
      context,
      cause
    );
  }

  isRetriable(): boolean {
    // Database errors are often retriable, especially for connection issues
    return true;
  }
}

/**
 * Error thrown when an event processing fails due to data processing issues.
 */
export class EventDataProcessingError extends DataProcessingError {
  constructor(
    message: string,
    public readonly context: EventErrorContext = {},
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      'EVENT_DATA_PROCESSING_ERROR',
      context,
      cause
    );
  }
}

/**
 * Error thrown when an event version is incompatible with the current system.
 */
export class EventVersionError extends EventError {
  constructor(
    message: string,
    context: EventErrorContext = {},
    public readonly actualVersion: string,
    public readonly expectedVersion: string,
    cause?: Error
  ) {
    super(
      EventError.createMessage(
        `${message} (Expected: ${expectedVersion}, Actual: ${actualVersion})`,
        context
      ),
      ErrorType.TECHNICAL,
      'EVENT_VERSION_ERROR',
      context,
      cause
    );
  }

  isRetriable(): boolean {
    // Version errors are generally not retriable without code changes
    return false;
  }
}

/**
 * Error thrown when a duplicate event is detected.
 */
export class DuplicateEventError extends EventError {
  constructor(
    message: string,
    context: EventErrorContext = {},
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      ErrorType.BUSINESS,
      'DUPLICATE_EVENT_ERROR',
      context,
      cause
    );
  }

  isRetriable(): boolean {
    // Duplicate events are never retriable
    return false;
  }
}

/**
 * Error thrown when an event cannot be processed due to rate limiting.
 */
export class EventRateLimitError extends EventError {
  constructor(
    message: string,
    context: EventErrorContext = {},
    public readonly retryAfterMs?: number,
    cause?: Error
  ) {
    super(
      EventError.createMessage(message, context),
      ErrorType.TECHNICAL,
      'EVENT_RATE_LIMIT_ERROR',
      context,
      cause
    );
  }

  isRetriable(): boolean {
    // Rate limit errors are retriable after a delay
    return true;
  }

  /**
   * Gets the recommended retry delay in milliseconds.
   * 
   * @returns The delay in milliseconds before retrying, or a default value if not specified
   */
  getRetryDelayMs(): number {
    return this.retryAfterMs || 5000; // Default to 5 seconds if not specified
  }
}

/**
 * Namespace for Health journey-specific event errors.
 * Contains specialized error classes for health-related events including metrics,
 * goals, and device synchronization events.
 */
export namespace HealthEventErrors {
  /**
   * Error thrown when a health metric event fails processing.
   */
  export class MetricEventError extends EventError {
    constructor(
      message: string,
      context: EventErrorContext = {},
      cause?: Error
    ) {
      super(
        EventError.createMessage(message, context),
        ErrorType.BUSINESS,
        'HEALTH_METRIC_EVENT_ERROR',
        context,
        cause
      );
    }
  }

  /**
   * Error thrown when a health goal event fails processing.
   */
  export class GoalEventError extends EventError {
    constructor(
      message: string,
      context: EventErrorContext = {},
      cause?: Error
    ) {
      super(
        EventError.createMessage(message, context),
        ErrorType.BUSINESS,
        'HEALTH_GOAL_EVENT_ERROR',
        context,
        cause
      );
    }
  }

  /**
   * Error thrown when a device synchronization event fails processing.
   */
  export class DeviceSyncEventError extends EventError {
    constructor(
      message: string,
      context: EventErrorContext = {},
      cause?: Error
    ) {
      super(
        EventError.createMessage(message, context),
        ErrorType.TECHNICAL,
        'HEALTH_DEVICE_SYNC_EVENT_ERROR',
        context,
        cause
      );
    }

    isRetriable(): boolean {
      // Device sync errors are often retriable
      return true;
    }
  }
}

/**
 * Namespace for Care journey-specific event errors.
 * Contains specialized error classes for care-related events including appointments,
 * medications, and telemedicine sessions.
 */
export namespace CareEventErrors {
  /**
   * Error thrown when an appointment event fails processing.
   */
  export class AppointmentEventError extends EventError {
    constructor(
      message: string,
      context: EventErrorContext = {},
      cause?: Error
    ) {
      super(
        EventError.createMessage(message, context),
        ErrorType.BUSINESS,
        'CARE_APPOINTMENT_EVENT_ERROR',
        context,
        cause
      );
    }
  }

  /**
   * Error thrown when a medication event fails processing.
   */
  export class MedicationEventError extends EventError {
    constructor(
      message: string,
      context: EventErrorContext = {},
      cause?: Error
    ) {
      super(
        EventError.createMessage(message, context),
        ErrorType.BUSINESS,
        'CARE_MEDICATION_EVENT_ERROR',
        context,
        cause
      );
    }
  }

  /**
   * Error thrown when a telemedicine event fails processing.
   */
  export class TelemedicineEventError extends EventError {
    constructor(
      message: string,
      context: EventErrorContext = {},
      cause?: Error
    ) {
      super(
        EventError.createMessage(message, context),
        ErrorType.TECHNICAL,
        'CARE_TELEMEDICINE_EVENT_ERROR',
        context,
        cause
      );
    }

    isRetriable(): boolean {
      // Telemedicine errors may be retriable depending on the cause
      return this.cause instanceof TimeoutError || 
             this.cause instanceof ExternalDependencyUnavailableError;
    }
  }
}

/**
 * Namespace for Plan journey-specific event errors.
 * Contains specialized error classes for plan-related events including claims,
 * benefits, and coverage events.
 */
export namespace PlanEventErrors {
  /**
   * Error thrown when a claim event fails processing.
   */
  export class ClaimEventError extends EventError {
    constructor(
      message: string,
      context: EventErrorContext = {},
      cause?: Error
    ) {
      super(
        EventError.createMessage(message, context),
        ErrorType.BUSINESS,
        'PLAN_CLAIM_EVENT_ERROR',
        context,
        cause
      );
    }
  }

  /**
   * Error thrown when a benefit event fails processing.
   */
  export class BenefitEventError extends EventError {
    constructor(
      message: string,
      context: EventErrorContext = {},
      cause?: Error
    ) {
      super(
        EventError.createMessage(message, context),
        ErrorType.BUSINESS,
        'PLAN_BENEFIT_EVENT_ERROR',
        context,
        cause
      );
    }
  }

  /**
   * Error thrown when a coverage event fails processing.
   */
  export class CoverageEventError extends EventError {
    constructor(
      message: string,
      context: EventErrorContext = {},
      cause?: Error
    ) {
      super(
        EventError.createMessage(message, context),
        ErrorType.BUSINESS,
        'PLAN_COVERAGE_EVENT_ERROR',
        context,
        cause
      );
    }
  }
}
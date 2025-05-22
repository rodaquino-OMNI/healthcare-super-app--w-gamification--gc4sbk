import { AppException, ErrorType } from '@austa/errors';

/**
 * Base class for all event processing errors
 */
export class EventProcessingError extends AppException {
  constructor(
    message: string,
    code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message, ErrorType.TECHNICAL, code);
    this.name = 'EventProcessingError';
  }
}

/**
 * Error thrown when event validation fails
 */
export class EventValidationError extends EventProcessingError {
  constructor(
    message: string,
    validationErrors: Record<string, any>,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_VALIDATION_ERROR',
      { validationErrors, ...eventDetails }
    );
    this.name = 'EventValidationError';
  }
}

/**
 * Error thrown when event schema is invalid or incompatible
 */
export class EventSchemaError extends EventProcessingError {
  constructor(
    message: string,
    schemaErrors: Record<string, any>,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_SCHEMA_ERROR',
      { schemaErrors, ...eventDetails }
    );
    this.name = 'EventSchemaError';
  }
}

/**
 * Error thrown when event processing times out
 */
export class EventTimeoutError extends EventProcessingError {
  constructor(
    message: string,
    timeoutMs: number,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_TIMEOUT_ERROR',
      { timeoutMs, ...eventDetails }
    );
    this.name = 'EventTimeoutError';
  }
}

/**
 * Error thrown when event processing is rejected due to rate limiting
 */
export class EventRateLimitError extends EventProcessingError {
  constructor(
    message: string,
    rateLimitInfo: Record<string, any>,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_RATE_LIMIT_ERROR',
      { rateLimitInfo, ...eventDetails }
    );
    this.name = 'EventRateLimitError';
  }
}

/**
 * Error thrown when event processing fails due to dependency issues
 */
export class EventDependencyError extends EventProcessingError {
  constructor(
    message: string,
    dependencyName: string,
    originalError: Error,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_DEPENDENCY_ERROR',
      { 
        dependencyName, 
        originalError: {
          message: originalError.message,
          name: originalError.name,
          stack: originalError.stack
        },
        ...eventDetails 
      }
    );
    this.name = 'EventDependencyError';
  }
}

/**
 * Error thrown when event processing fails due to authorization issues
 */
export class EventAuthorizationError extends EventProcessingError {
  constructor(
    message: string,
    authDetails: Record<string, any>,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_AUTHORIZATION_ERROR',
      { authDetails, ...eventDetails }
    );
    this.name = 'EventAuthorizationError';
  }
}

/**
 * Error thrown when event processing fails due to business rule violations
 */
export class EventBusinessError extends EventProcessingError {
  constructor(
    message: string,
    businessRule: string,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_BUSINESS_ERROR',
      { businessRule, ...eventDetails }
    );
    this.name = 'EventBusinessError';
  }
}

/**
 * Error thrown when event processing fails due to database issues
 */
export class EventDatabaseError extends EventProcessingError {
  constructor(
    message: string,
    databaseOperation: string,
    originalError: Error,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_DATABASE_ERROR',
      { 
        databaseOperation, 
        originalError: {
          message: originalError.message,
          name: originalError.name,
          stack: originalError.stack
        },
        ...eventDetails 
      }
    );
    this.name = 'EventDatabaseError';
  }
}

/**
 * Error thrown when event processing fails due to serialization/deserialization issues
 */
export class EventSerializationError extends EventProcessingError {
  constructor(
    message: string,
    serializationDetails: Record<string, any>,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_SERIALIZATION_ERROR',
      { serializationDetails, ...eventDetails }
    );
    this.name = 'EventSerializationError';
  }
}

/**
 * Error thrown when event processing fails due to version incompatibility
 */
export class EventVersionError extends EventProcessingError {
  constructor(
    message: string,
    versionDetails: {
      expectedVersion: string;
      actualVersion: string;
    },
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_VERSION_ERROR',
      { versionDetails, ...eventDetails }
    );
    this.name = 'EventVersionError';
  }
}

/**
 * Error thrown when event processing fails due to circuit breaker being open
 */
export class EventCircuitBreakerError extends EventProcessingError {
  constructor(
    message: string,
    circuitBreakerDetails: Record<string, any>,
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_CIRCUIT_BREAKER_ERROR',
      { circuitBreakerDetails, ...eventDetails }
    );
    this.name = 'EventCircuitBreakerError';
  }
}

/**
 * Error thrown when event processing fails due to retry exhaustion
 */
export class EventRetryExhaustedError extends EventProcessingError {
  constructor(
    message: string,
    retryDetails: {
      attempts: number;
      maxRetries: number;
      originalError: {
        message: string;
        name: string;
        stack?: string;
      };
    },
    eventDetails?: Record<string, any>
  ) {
    super(
      message,
      'EVENT_RETRY_EXHAUSTED_ERROR',
      { retryDetails, ...eventDetails }
    );
    this.name = 'EventRetryExhaustedError';
  }
}
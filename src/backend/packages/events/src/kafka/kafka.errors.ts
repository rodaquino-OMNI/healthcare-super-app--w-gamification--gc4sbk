/**
 * Custom error classes for Kafka operations.
 * These errors provide structured information about Kafka-related failures
 * and integrate with the global error handling framework.
 */

import { KafkaErrorCode } from './kafka.constants';

/**
 * Base class for all Kafka-related errors.
 */
export class KafkaError extends Error {
  readonly code: string;
  readonly context: Record<string, any>;
  readonly originalError?: Error;

  constructor(
    message: string,
    code: string,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a structured representation of the error for logging.
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    };
  }
}

/**
 * Error thrown when Kafka connection fails.
 */
export class KafkaConnectionError extends KafkaError {
  constructor(
    message: string,
    code: string = KafkaErrorCode.CONNECTION_ERROR,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, code, context, originalError);
  }
}

/**
 * Error thrown when Kafka producer operations fail.
 */
export class KafkaProducerError extends KafkaError {
  constructor(
    message: string,
    code: string = KafkaErrorCode.PRODUCER_ERROR,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, code, context, originalError);
  }
}

/**
 * Error thrown when Kafka consumer operations fail.
 */
export class KafkaConsumerError extends KafkaError {
  constructor(
    message: string,
    code: string = KafkaErrorCode.CONSUMER_ERROR,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, code, context, originalError);
  }
}

/**
 * Error thrown when message serialization or deserialization fails.
 */
export class KafkaSerializationError extends KafkaError {
  constructor(
    message: string,
    code: string = KafkaErrorCode.SERIALIZATION_ERROR,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, code, context, originalError);
  }
}

/**
 * Error thrown when event validation fails.
 */
export class EventValidationError extends KafkaError {
  constructor(
    message: string,
    code: string = KafkaErrorCode.VALIDATION_ERROR,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, code, context, originalError);
  }
}

/**
 * Error thrown when a dead letter queue operation fails.
 */
export class DeadLetterQueueError extends KafkaError {
  constructor(
    message: string,
    code: string = KafkaErrorCode.DLQ_ERROR,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, code, context, originalError);
  }
}

/**
 * Error thrown when a retry operation fails.
 */
export class RetryError extends KafkaError {
  constructor(
    message: string,
    code: string = KafkaErrorCode.RETRY_ERROR,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, code, context, originalError);
  }
}

/**
 * Error thrown when a schema validation fails.
 */
export class SchemaValidationError extends KafkaError {
  constructor(
    message: string,
    code: string = KafkaErrorCode.SCHEMA_VALIDATION_ERROR,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, code, context, originalError);
  }
}

/**
 * Error thrown when a batch operation fails.
 */
export class BatchOperationError extends KafkaError {
  constructor(
    message: string,
    code: string = KafkaErrorCode.BATCH_OPERATION_ERROR,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, code, context, originalError);
  }
}
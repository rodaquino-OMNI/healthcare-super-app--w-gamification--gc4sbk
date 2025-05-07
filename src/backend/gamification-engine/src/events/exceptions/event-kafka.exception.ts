import { ExternalDependencyException } from '@app/errors/categories';
import { CircuitBreakerOptions } from '@app/errors/circuit-breaker';
import { ErrorCode, ErrorType } from '@app/errors/error-types';
import { RetryOptions } from '@app/errors/retry';
import { KafkaErrorCode } from '@app/events/constants';
import { KafkaMessage } from 'kafkajs';

/**
 * Structured metadata for Kafka-related errors
 */
export interface KafkaErrorMetadata {
  /**
   * The Kafka topic associated with the error
   */
  topic?: string;
  
  /**
   * The Kafka partition associated with the error
   */
  partition?: number;
  
  /**
   * The Kafka message that caused the error, if available
   */
  message?: KafkaMessage;
  
  /**
   * The Kafka error code from the broker, if available
   */
  kafkaErrorCode?: KafkaErrorCode;
  
  /**
   * The Kafka broker response, if available
   */
  brokerResponse?: Record<string, any>;
  
  /**
   * The Kafka client ID associated with the error
   */
  clientId?: string;
  
  /**
   * The Kafka group ID associated with the error (for consumer errors)
   */
  groupId?: string;
  
  /**
   * Additional context about the Kafka operation that failed
   */
  context?: Record<string, any>;
}

/**
 * Exception for Kafka-related errors in the event processing pipeline.
 * 
 * This exception is used to classify external dependency errors related to Kafka
 * operations, including producer/consumer connection issues, message serialization
 * failures, and topic configuration problems.
 * 
 * It integrates with the circuit breaker pattern to prevent cascading failures
 * when Kafka is experiencing issues, and supports retry policies for transient errors.
 */
export class EventKafkaException extends ExternalDependencyException {
  /**
   * Default retry options for Kafka operations
   */
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffFactor: 2,
    jitterFactor: 0.2,
  };

  /**
   * Default circuit breaker options for Kafka operations
   */
  private static readonly DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    halfOpenMaxCalls: 3,
    monitorIntervalMs: 5000,
  };

  /**
   * The Kafka-specific error metadata
   */
  public readonly kafkaMetadata: KafkaErrorMetadata;

  /**
   * Creates a new EventKafkaException
   * 
   * @param message The error message
   * @param metadata The Kafka-specific error metadata
   * @param cause The original error that caused this exception
   * @param retryOptions Custom retry options for this specific error
   * @param circuitBreakerOptions Custom circuit breaker options for this specific error
   */
  constructor(
    message: string,
    metadata: KafkaErrorMetadata,
    cause?: Error,
    retryOptions?: Partial<RetryOptions>,
    circuitBreakerOptions?: Partial<CircuitBreakerOptions>,
  ) {
    super(
      message,
      {
        errorType: ErrorType.EXTERNAL,
        errorCode: ErrorCode.EXTERNAL_KAFKA_ERROR,
        cause,
        metadata: {
          service: 'kafka',
          isRetryable: EventKafkaException.isRetryableError(metadata),
          ...metadata,
        },
        retryOptions: {
          ...EventKafkaException.DEFAULT_RETRY_OPTIONS,
          ...retryOptions,
        },
        circuitBreakerOptions: {
          ...EventKafkaException.DEFAULT_CIRCUIT_BREAKER_OPTIONS,
          ...circuitBreakerOptions,
        },
      },
    );

    this.kafkaMetadata = metadata;
  }

  /**
   * Determines if a Kafka error is retryable based on its error code and context
   * 
   * @param metadata The Kafka error metadata
   * @returns True if the error is retryable, false otherwise
   */
  private static isRetryableError(metadata: KafkaErrorMetadata): boolean {
    // If no Kafka error code is available, default to retryable
    if (!metadata.kafkaErrorCode) {
      return true;
    }

    // These Kafka error codes are considered retryable
    const retryableErrorCodes = [
      KafkaErrorCode.NETWORK_EXCEPTION,
      KafkaErrorCode.LEADER_NOT_AVAILABLE,
      KafkaErrorCode.NOT_LEADER_FOR_PARTITION,
      KafkaErrorCode.REQUEST_TIMED_OUT,
      KafkaErrorCode.BROKER_NOT_AVAILABLE,
      KafkaErrorCode.GROUP_LOAD_IN_PROGRESS,
      KafkaErrorCode.GROUP_COORDINATOR_NOT_AVAILABLE,
      KafkaErrorCode.NOT_COORDINATOR_FOR_GROUP,
      KafkaErrorCode.INVALID_FETCH_SIZE,
      KafkaErrorCode.CORRUPT_MESSAGE,
    ];

    return retryableErrorCodes.includes(metadata.kafkaErrorCode);
  }

  /**
   * Creates an exception for Kafka producer errors
   * 
   * @param topic The Kafka topic
   * @param error The original error
   * @param clientId The Kafka client ID
   * @param context Additional context
   * @returns A new EventKafkaException
   */
  public static fromProducerError(
    topic: string,
    error: Error,
    clientId?: string,
    context?: Record<string, any>,
  ): EventKafkaException {
    return new EventKafkaException(
      `Failed to produce message to Kafka topic '${topic}': ${error.message}`,
      {
        topic,
        clientId,
        context,
        kafkaErrorCode: EventKafkaException.extractKafkaErrorCode(error),
      },
      error,
    );
  }

  /**
   * Creates an exception for Kafka consumer errors
   * 
   * @param topic The Kafka topic
   * @param groupId The consumer group ID
   * @param error The original error
   * @param clientId The Kafka client ID
   * @param context Additional context
   * @returns A new EventKafkaException
   */
  public static fromConsumerError(
    topic: string,
    groupId: string,
    error: Error,
    clientId?: string,
    context?: Record<string, any>,
  ): EventKafkaException {
    return new EventKafkaException(
      `Failed to consume message from Kafka topic '${topic}' with group '${groupId}': ${error.message}`,
      {
        topic,
        groupId,
        clientId,
        context,
        kafkaErrorCode: EventKafkaException.extractKafkaErrorCode(error),
      },
      error,
    );
  }

  /**
   * Creates an exception for Kafka message processing errors
   * 
   * @param topic The Kafka topic
   * @param message The Kafka message
   * @param error The original error
   * @param groupId The consumer group ID
   * @param clientId The Kafka client ID
   * @param context Additional context
   * @returns A new EventKafkaException
   */
  public static fromMessageProcessingError(
    topic: string,
    message: KafkaMessage,
    error: Error,
    groupId?: string,
    clientId?: string,
    context?: Record<string, any>,
  ): EventKafkaException {
    return new EventKafkaException(
      `Failed to process message from Kafka topic '${topic}': ${error.message}`,
      {
        topic,
        message,
        groupId,
        clientId,
        context,
        kafkaErrorCode: EventKafkaException.extractKafkaErrorCode(error),
      },
      error,
    );
  }

  /**
   * Creates an exception for Kafka connection errors
   * 
   * @param error The original error
   * @param clientId The Kafka client ID
   * @param context Additional context
   * @returns A new EventKafkaException
   */
  public static fromConnectionError(
    error: Error,
    clientId?: string,
    context?: Record<string, any>,
  ): EventKafkaException {
    return new EventKafkaException(
      `Failed to connect to Kafka: ${error.message}`,
      {
        clientId,
        context,
        kafkaErrorCode: EventKafkaException.extractKafkaErrorCode(error),
      },
      error,
      // Connection errors should have more aggressive retry options
      {
        maxRetries: 5,
        initialDelayMs: 500,
        maxDelayMs: 10000,
      },
      // And more sensitive circuit breaker options
      {
        failureThreshold: 3,
        resetTimeoutMs: 60000,
      },
    );
  }

  /**
   * Attempts to extract a Kafka error code from an error object
   * 
   * @param error The error to extract from
   * @returns The Kafka error code, if found
   */
  private static extractKafkaErrorCode(error: Error): KafkaErrorCode | undefined {
    // Try to extract error code from kafkajs error
    const kafkaError = error as any;
    if (kafkaError.code && typeof kafkaError.code === 'string') {
      return kafkaError.code as KafkaErrorCode;
    }

    // Try to extract from error message
    const errorCodeMatch = error.message.match(/\bERROR_CODE:([A-Z_]+)\b/);
    if (errorCodeMatch && errorCodeMatch[1]) {
      return errorCodeMatch[1] as KafkaErrorCode;
    }

    return undefined;
  }
}
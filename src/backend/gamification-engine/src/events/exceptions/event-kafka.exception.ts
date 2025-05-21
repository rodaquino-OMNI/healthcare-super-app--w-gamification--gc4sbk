import { HttpStatus } from '@nestjs/common';
import { ExternalDependencyError } from '@austa/errors';

/**
 * Error codes specific to Kafka operations
 */
export enum KafkaErrorCode {
  CONNECTION_ERROR = 'KAFKA_CONNECTION_ERROR',
  PRODUCER_ERROR = 'KAFKA_PRODUCER_ERROR',
  CONSUMER_ERROR = 'KAFKA_CONSUMER_ERROR',
  SERIALIZATION_ERROR = 'KAFKA_SERIALIZATION_ERROR',
  TOPIC_ERROR = 'KAFKA_TOPIC_ERROR',
  AUTHENTICATION_ERROR = 'KAFKA_AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'KAFKA_AUTHORIZATION_ERROR',
  BROKER_ERROR = 'KAFKA_BROKER_ERROR',
  UNKNOWN_ERROR = 'KAFKA_UNKNOWN_ERROR',
}

/**
 * Interface for Kafka error metadata
 */
export interface KafkaErrorMetadata {
  /** The Kafka broker response code if available */
  brokerResponseCode?: number;
  /** The Kafka topic involved in the error */
  topic?: string;
  /** The Kafka partition involved in the error */
  partition?: number;
  /** The Kafka consumer group involved in the error */
  consumerGroup?: string;
  /** The Kafka client ID involved in the error */
  clientId?: string;
  /** The Kafka broker(s) involved in the error */
  brokers?: string[];
  /** Whether the error is retryable */
  isRetryable?: boolean;
  /** The number of retry attempts made */
  retryAttempts?: number;
  /** The maximum number of retry attempts allowed */
  maxRetryAttempts?: number;
  /** The circuit breaker state */
  circuitBreakerState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  /** The time to wait before retrying in milliseconds */
  retryAfterMs?: number;
}

/**
 * Exception for Kafka-related errors in the event processing pipeline.
 * 
 * This exception is thrown when there are issues with Kafka connections,
 * message production/consumption, or topic management. It provides context
 * for circuit breaker implementations and retry strategies.
 */
export class EventKafkaException extends ExternalDependencyError {
  /**
   * Creates a new EventKafkaException
   * 
   * @param message - Human-readable error message
   * @param code - Specific Kafka error code
   * @param metadata - Additional context about the Kafka error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: KafkaErrorCode = KafkaErrorCode.UNKNOWN_ERROR,
    metadata: KafkaErrorMetadata = {},
    cause?: Error,
  ) {
    super(
      message,
      code,
      {
        ...metadata,
        // Default to retryable unless explicitly set to false
        isRetryable: metadata.isRetryable !== false,
        // Track retry attempts
        retryAttempts: metadata.retryAttempts || 0,
        // Default max retry attempts
        maxRetryAttempts: metadata.maxRetryAttempts || 3,
      },
      cause,
    );
  }

  /**
   * Creates an exception for Kafka connection errors
   * 
   * @param message - Error message
   * @param brokers - List of Kafka brokers that failed to connect
   * @param cause - Original error
   * @returns EventKafkaException
   */
  static connectionError(message: string, brokers?: string[], cause?: Error): EventKafkaException {
    return new EventKafkaException(
      message || 'Failed to connect to Kafka brokers',
      KafkaErrorCode.CONNECTION_ERROR,
      { brokers, isRetryable: true },
      cause,
    );
  }

  /**
   * Creates an exception for Kafka producer errors
   * 
   * @param message - Error message
   * @param topic - Kafka topic
   * @param cause - Original error
   * @returns EventKafkaException
   */
  static producerError(message: string, topic?: string, cause?: Error): EventKafkaException {
    return new EventKafkaException(
      message || 'Failed to produce message to Kafka',
      KafkaErrorCode.PRODUCER_ERROR,
      { topic, isRetryable: true },
      cause,
    );
  }

  /**
   * Creates an exception for Kafka consumer errors
   * 
   * @param message - Error message
   * @param topic - Kafka topic
   * @param consumerGroup - Kafka consumer group
   * @param cause - Original error
   * @returns EventKafkaException
   */
  static consumerError(
    message: string,
    topic?: string,
    consumerGroup?: string,
    cause?: Error,
  ): EventKafkaException {
    return new EventKafkaException(
      message || 'Failed to consume message from Kafka',
      KafkaErrorCode.CONSUMER_ERROR,
      { topic, consumerGroup, isRetryable: true },
      cause,
    );
  }

  /**
   * Creates an exception for Kafka message serialization errors
   * 
   * @param message - Error message
   * @param topic - Kafka topic
   * @param cause - Original error
   * @returns EventKafkaException
   */
  static serializationError(message: string, topic?: string, cause?: Error): EventKafkaException {
    return new EventKafkaException(
      message || 'Failed to serialize/deserialize Kafka message',
      KafkaErrorCode.SERIALIZATION_ERROR,
      { topic, isRetryable: false }, // Serialization errors are not retryable
      cause,
    );
  }

  /**
   * Creates an exception for Kafka topic errors
   * 
   * @param message - Error message
   * @param topic - Kafka topic
   * @param cause - Original error
   * @returns EventKafkaException
   */
  static topicError(message: string, topic?: string, cause?: Error): EventKafkaException {
    return new EventKafkaException(
      message || 'Kafka topic error',
      KafkaErrorCode.TOPIC_ERROR,
      { topic, isRetryable: false }, // Topic configuration errors are not retryable
      cause,
    );
  }

  /**
   * Creates an exception for Kafka authentication errors
   * 
   * @param message - Error message
   * @param brokers - List of Kafka brokers
   * @param cause - Original error
   * @returns EventKafkaException
   */
  static authenticationError(message: string, brokers?: string[], cause?: Error): EventKafkaException {
    return new EventKafkaException(
      message || 'Kafka authentication error',
      KafkaErrorCode.AUTHENTICATION_ERROR,
      { brokers, isRetryable: false }, // Auth errors are not retryable without config changes
      cause,
    );
  }

  /**
   * Creates an exception for Kafka authorization errors
   * 
   * @param message - Error message
   * @param topic - Kafka topic
   * @param cause - Original error
   * @returns EventKafkaException
   */
  static authorizationError(message: string, topic?: string, cause?: Error): EventKafkaException {
    return new EventKafkaException(
      message || 'Kafka authorization error',
      KafkaErrorCode.AUTHORIZATION_ERROR,
      { topic, isRetryable: false }, // Authorization errors are not retryable without config changes
      cause,
    );
  }

  /**
   * Creates an exception for Kafka broker errors
   * 
   * @param message - Error message
   * @param brokerResponseCode - Kafka broker response code
   * @param brokers - List of Kafka brokers
   * @param cause - Original error
   * @returns EventKafkaException
   */
  static brokerError(
    message: string,
    brokerResponseCode?: number,
    brokers?: string[],
    cause?: Error,
  ): EventKafkaException {
    // Determine if the error is retryable based on the broker response code
    // Some broker errors are transient and can be retried
    const isRetryable = brokerResponseCode ? isRetryableBrokerError(brokerResponseCode) : true;
    
    return new EventKafkaException(
      message || 'Kafka broker error',
      KafkaErrorCode.BROKER_ERROR,
      { brokerResponseCode, brokers, isRetryable },
      cause,
    );
  }

  /**
   * Increments the retry attempt count and updates retry metadata
   * 
   * @param retryAfterMs - Time to wait before retrying in milliseconds
   * @returns This exception instance with updated metadata
   */
  incrementRetryAttempt(retryAfterMs?: number): this {
    const metadata = this.getMetadata() as KafkaErrorMetadata;
    const retryAttempts = (metadata.retryAttempts || 0) + 1;
    const maxRetryAttempts = metadata.maxRetryAttempts || 3;
    
    // Update metadata
    this.updateMetadata({
      ...metadata,
      retryAttempts,
      retryAfterMs,
      // If we've exceeded max retries, mark as non-retryable
      isRetryable: retryAttempts < maxRetryAttempts,
    });
    
    return this;
  }

  /**
   * Updates the circuit breaker state in the error metadata
   * 
   * @param state - New circuit breaker state
   * @returns This exception instance with updated metadata
   */
  updateCircuitBreakerState(state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): this {
    const metadata = this.getMetadata() as KafkaErrorMetadata;
    
    this.updateMetadata({
      ...metadata,
      circuitBreakerState: state,
      // If circuit breaker is open, mark as non-retryable
      isRetryable: state !== 'OPEN' && (metadata.isRetryable !== false),
    });
    
    return this;
  }

  /**
   * Checks if this error is retryable
   * 
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(): boolean {
    const metadata = this.getMetadata() as KafkaErrorMetadata;
    return metadata.isRetryable === true;
  }

  /**
   * Gets the number of retry attempts made
   * 
   * @returns Number of retry attempts
   */
  getRetryAttempts(): number {
    const metadata = this.getMetadata() as KafkaErrorMetadata;
    return metadata.retryAttempts || 0;
  }

  /**
   * Gets the maximum number of retry attempts allowed
   * 
   * @returns Maximum number of retry attempts
   */
  getMaxRetryAttempts(): number {
    const metadata = this.getMetadata() as KafkaErrorMetadata;
    return metadata.maxRetryAttempts || 3;
  }

  /**
   * Gets the time to wait before retrying
   * 
   * @returns Time to wait in milliseconds, or undefined if not set
   */
  getRetryAfterMs(): number | undefined {
    const metadata = this.getMetadata() as KafkaErrorMetadata;
    return metadata.retryAfterMs;
  }

  /**
   * Gets the circuit breaker state
   * 
   * @returns Circuit breaker state, or undefined if not set
   */
  getCircuitBreakerState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' | undefined {
    const metadata = this.getMetadata() as KafkaErrorMetadata;
    return metadata.circuitBreakerState;
  }
}

/**
 * Determines if a Kafka broker error code represents a retryable error
 * 
 * @param code - Kafka broker error code
 * @returns True if the error is retryable, false otherwise
 */
function isRetryableBrokerError(code: number): boolean {
  // Based on Kafka error codes: https://kafka.apache.org/protocol.html#protocol_error_codes
  const retryableCodes = [
    // NOT_LEADER_FOR_PARTITION
    3,
    // LEADER_NOT_AVAILABLE
    5,
    // REQUEST_TIMED_OUT
    7,
    // BROKER_NOT_AVAILABLE
    8,
    // REPLICA_NOT_AVAILABLE
    9,
    // GROUP_COORDINATOR_NOT_AVAILABLE
    15,
    // NOT_COORDINATOR_FOR_GROUP
    16,
    // NOT_ENOUGH_REPLICAS
    19,
    // NOT_ENOUGH_REPLICAS_AFTER_APPEND
    20,
    // NETWORK_EXCEPTION
    56,
    // COORDINATOR_LOAD_IN_PROGRESS
    14,
    // COORDINATOR_NOT_AVAILABLE
    15,
    // KAFKA_STORAGE_ERROR
    56,
    // THROTTLING_QUOTA_EXCEEDED
    59,
  ];
  
  return retryableCodes.includes(code);
}
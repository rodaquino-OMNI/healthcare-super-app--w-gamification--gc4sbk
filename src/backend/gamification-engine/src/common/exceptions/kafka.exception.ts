import { Injectable } from '@nestjs/common';
import { ExternalDependencyException } from './external-dependency.exception';
import { TransientException } from './transient.exception';
import { ErrorType } from './error-types.enum';

/**
 * Error codes from Kafka protocol
 * @see https://kafka.apache.org/protocol.html#protocol_error_codes
 */
enum KafkaErrorCode {
  // Standard Kafka error codes
  UNKNOWN_SERVER_ERROR = -1,
  NONE = 0,
  OFFSET_OUT_OF_RANGE = 1,
  CORRUPT_MESSAGE = 2,
  UNKNOWN_TOPIC_OR_PARTITION = 3,
  INVALID_MESSAGE_SIZE = 4,
  LEADER_NOT_AVAILABLE = 5,
  NOT_LEADER_FOR_PARTITION = 6,
  REQUEST_TIMED_OUT = 7,
  BROKER_NOT_AVAILABLE = 8,
  REPLICA_NOT_AVAILABLE = 9,
  MESSAGE_TOO_LARGE = 10,
  STALE_CONTROLLER_EPOCH = 11,
  OFFSET_METADATA_TOO_LARGE = 12,
  NETWORK_EXCEPTION = 13,
  COORDINATOR_LOAD_IN_PROGRESS = 14,
  COORDINATOR_NOT_AVAILABLE = 15,
  NOT_COORDINATOR = 16,
  INVALID_TOPIC_EXCEPTION = 17,
  RECORD_LIST_TOO_LARGE = 18,
  NOT_ENOUGH_REPLICAS = 19,
  NOT_ENOUGH_REPLICAS_AFTER_APPEND = 20,
  INVALID_REQUIRED_ACKS = 21,
  ILLEGAL_GENERATION = 22,
  INCONSISTENT_GROUP_PROTOCOL = 23,
  INVALID_GROUP_ID = 24,
  UNKNOWN_MEMBER_ID = 25,
  INVALID_SESSION_TIMEOUT = 26,
  REBALANCE_IN_PROGRESS = 27,
  INVALID_COMMIT_OFFSET_SIZE = 28,
  TOPIC_AUTHORIZATION_FAILED = 29,
  GROUP_AUTHORIZATION_FAILED = 30,
  CLUSTER_AUTHORIZATION_FAILED = 31,
  INVALID_TIMESTAMP = 32,
  UNSUPPORTED_SASL_MECHANISM = 33,
  ILLEGAL_SASL_STATE = 34,
  UNSUPPORTED_VERSION = 35,
  TOPIC_ALREADY_EXISTS = 36,
  INVALID_PARTITIONS = 37,
  INVALID_REPLICATION_FACTOR = 38,
  INVALID_REPLICA_ASSIGNMENT = 39,
  INVALID_CONFIG = 40,
  NOT_CONTROLLER = 41,
  INVALID_REQUEST = 42,
  UNSUPPORTED_FOR_MESSAGE_FORMAT = 43,
  POLICY_VIOLATION = 44,
  OUT_OF_ORDER_SEQUENCE_NUMBER = 45,
  DUPLICATE_SEQUENCE_NUMBER = 46,
  INVALID_PRODUCER_EPOCH = 47,
  INVALID_TXN_STATE = 48,
  INVALID_PRODUCER_ID_MAPPING = 49,
  INVALID_TRANSACTION_TIMEOUT = 50,
  CONCURRENT_TRANSACTIONS = 51,
  TRANSACTION_COORDINATOR_FENCED = 52,
  TRANSACTIONAL_ID_AUTHORIZATION_FAILED = 53,
  SECURITY_DISABLED = 54,
  OPERATION_NOT_ATTEMPTED = 55,
  KAFKA_STORAGE_ERROR = 56,
  LOG_DIR_NOT_FOUND = 57,
  SASL_AUTHENTICATION_FAILED = 58,
  UNKNOWN_PRODUCER_ID = 59,
  REASSIGNMENT_IN_PROGRESS = 60,
  DELEGATION_TOKEN_AUTH_DISABLED = 61,
  DELEGATION_TOKEN_NOT_FOUND = 62,
  DELEGATION_TOKEN_OWNER_MISMATCH = 63,
  DELEGATION_TOKEN_REQUEST_NOT_ALLOWED = 64,
  DELEGATION_TOKEN_AUTHORIZATION_FAILED = 65,
  DELEGATION_TOKEN_EXPIRED = 66,
  INVALID_PRINCIPAL_TYPE = 67,
  NON_EMPTY_GROUP = 68,
  GROUP_ID_NOT_FOUND = 69,
  FETCH_SESSION_ID_NOT_FOUND = 70,
  INVALID_FETCH_SESSION_EPOCH = 71,
  LISTENER_NOT_FOUND = 72,
  TOPIC_DELETION_DISABLED = 73,
  FENCED_LEADER_EPOCH = 74,
  UNKNOWN_LEADER_EPOCH = 75,
  UNSUPPORTED_COMPRESSION_TYPE = 76,
  STALE_BROKER_EPOCH = 77,
  OFFSET_NOT_AVAILABLE = 78,
  MEMBER_ID_REQUIRED = 79,
  PREFERRED_LEADER_NOT_AVAILABLE = 80,
  GROUP_MAX_SIZE_REACHED = 81,
  FENCED_INSTANCE_ID = 82,
  ELIGIBLE_LEADERS_NOT_AVAILABLE = 83,
  ELECTION_NOT_NEEDED = 84,
  NO_REASSIGNMENT_IN_PROGRESS = 85,
  GROUP_SUBSCRIBED_TO_TOPIC = 86,
  INVALID_RECORD = 87,
  UNSTABLE_OFFSET_COMMIT = 88,
  
  // Client-side error codes (not from Kafka protocol)
  CONNECTION_ERROR = 10000,
  SERIALIZATION_ERROR = 10001,
  AUTHENTICATION_ERROR = 10002,
  SCHEMA_REGISTRY_ERROR = 10003,
  MESSAGE_PROCESSING_ERROR = 10004,
  DEAD_LETTER_QUEUE_ERROR = 10005,
}

/**
 * Maps Kafka error codes to retriable status
 */
const RETRIABLE_KAFKA_ERRORS = new Set([
  KafkaErrorCode.UNKNOWN_SERVER_ERROR,
  KafkaErrorCode.LEADER_NOT_AVAILABLE,
  KafkaErrorCode.NOT_LEADER_FOR_PARTITION,
  KafkaErrorCode.REQUEST_TIMED_OUT,
  KafkaErrorCode.BROKER_NOT_AVAILABLE,
  KafkaErrorCode.REPLICA_NOT_AVAILABLE,
  KafkaErrorCode.NETWORK_EXCEPTION,
  KafkaErrorCode.COORDINATOR_LOAD_IN_PROGRESS,
  KafkaErrorCode.COORDINATOR_NOT_AVAILABLE,
  KafkaErrorCode.NOT_ENOUGH_REPLICAS,
  KafkaErrorCode.NOT_ENOUGH_REPLICAS_AFTER_APPEND,
  KafkaErrorCode.NOT_CONTROLLER,
  KafkaErrorCode.KAFKA_STORAGE_ERROR,
  KafkaErrorCode.UNSTABLE_OFFSET_COMMIT,
  KafkaErrorCode.CONNECTION_ERROR,
]);

/**
 * Maps Kafka error codes to fatal status (non-retriable and should trigger circuit breaker)
 */
const FATAL_KAFKA_ERRORS = new Set([
  KafkaErrorCode.CORRUPT_MESSAGE,
  KafkaErrorCode.MESSAGE_TOO_LARGE,
  KafkaErrorCode.RECORD_LIST_TOO_LARGE,
  KafkaErrorCode.INVALID_REQUIRED_ACKS,
  KafkaErrorCode.UNSUPPORTED_VERSION,
  KafkaErrorCode.TOPIC_AUTHORIZATION_FAILED,
  KafkaErrorCode.GROUP_AUTHORIZATION_FAILED,
  KafkaErrorCode.CLUSTER_AUTHORIZATION_FAILED,
  KafkaErrorCode.INVALID_PRODUCER_EPOCH,
  KafkaErrorCode.INVALID_TXN_STATE,
  KafkaErrorCode.TRANSACTIONAL_ID_AUTHORIZATION_FAILED,
  KafkaErrorCode.SECURITY_DISABLED,
  KafkaErrorCode.SASL_AUTHENTICATION_FAILED,
  KafkaErrorCode.AUTHENTICATION_ERROR,
  KafkaErrorCode.SCHEMA_REGISTRY_ERROR,
]);

/**
 * Interface for Kafka error metadata
 */
export interface KafkaErrorMetadata {
  topic?: string;
  partition?: number;
  offset?: number;
  key?: string;
  correlationId?: string;
  consumerGroup?: string;
  messageId?: string;
  retryCount?: number;
  originalError?: Error;
  errorCode?: number;
  broker?: string;
}

/**
 * Specialized exception for Kafka-related errors
 * Handles producer/consumer issues, message serialization failures, topic management problems,
 * and other Kafka-specific errors with appropriate retry and circuit breaker integration.
 */
@Injectable()
export class KafkaException extends ExternalDependencyException {
  /**
   * Kafka-specific error metadata
   */
  private readonly kafkaMetadata: KafkaErrorMetadata;

  /**
   * Creates a new KafkaException instance
   * 
   * @param message Error message
   * @param errorCode Kafka error code
   * @param metadata Additional error metadata
   */
  constructor(
    message: string,
    private readonly errorCode: KafkaErrorCode,
    metadata?: KafkaErrorMetadata,
  ) {
    super(
      message,
      'KafkaException',
      ErrorType.EXTERNAL,
      {
        errorCode,
        retriable: RETRIABLE_KAFKA_ERRORS.has(errorCode),
        fatal: FATAL_KAFKA_ERRORS.has(errorCode),
        ...metadata,
      }
    );

    this.kafkaMetadata = metadata || {};
  }

  /**
   * Checks if the error is retriable
   * @returns true if the error is retriable, false otherwise
   */
  public isRetriable(): boolean {
    return RETRIABLE_KAFKA_ERRORS.has(this.errorCode);
  }

  /**
   * Checks if the error is fatal and should trigger circuit breaker
   * @returns true if the error is fatal, false otherwise
   */
  public isFatal(): boolean {
    return FATAL_KAFKA_ERRORS.has(this.errorCode);
  }

  /**
   * Converts this exception to a TransientException for retry handling
   * @param retryCount Current retry count
   * @param maxRetries Maximum number of retries
   * @returns TransientException instance
   */
  public toTransientException(retryCount: number, maxRetries: number): TransientException {
    if (!this.isRetriable()) {
      throw new Error('Cannot convert non-retriable KafkaException to TransientException');
    }

    return new TransientException(
      this.message,
      retryCount,
      maxRetries,
      {
        ...this.kafkaMetadata,
        originalError: this,
        errorCode: this.errorCode,
      }
    );
  }

  /**
   * Creates a KafkaException for producer errors
   * @param message Error message
   * @param errorCode Kafka error code
   * @param metadata Additional error metadata
   * @returns KafkaException instance
   */
  public static fromProducerError(
    message: string,
    errorCode: KafkaErrorCode,
    metadata?: KafkaErrorMetadata
  ): KafkaException {
    return new KafkaException(
      `Kafka producer error: ${message}`,
      errorCode,
      metadata
    );
  }

  /**
   * Creates a KafkaException for consumer errors
   * @param message Error message
   * @param errorCode Kafka error code
   * @param metadata Additional error metadata
   * @returns KafkaException instance
   */
  public static fromConsumerError(
    message: string,
    errorCode: KafkaErrorCode,
    metadata?: KafkaErrorMetadata
  ): KafkaException {
    return new KafkaException(
      `Kafka consumer error: ${message}`,
      errorCode,
      metadata
    );
  }

  /**
   * Creates a KafkaException for message serialization errors
   * @param message Error message
   * @param metadata Additional error metadata
   * @returns KafkaException instance
   */
  public static fromSerializationError(
    message: string,
    metadata?: KafkaErrorMetadata
  ): KafkaException {
    return new KafkaException(
      `Kafka serialization error: ${message}`,
      KafkaErrorCode.SERIALIZATION_ERROR,
      metadata
    );
  }

  /**
   * Creates a KafkaException for message processing errors
   * @param message Error message
   * @param metadata Additional error metadata
   * @returns KafkaException instance
   */
  public static fromProcessingError(
    message: string,
    metadata?: KafkaErrorMetadata
  ): KafkaException {
    return new KafkaException(
      `Kafka message processing error: ${message}`,
      KafkaErrorCode.MESSAGE_PROCESSING_ERROR,
      metadata
    );
  }

  /**
   * Creates a KafkaException for dead letter queue errors
   * @param message Error message
   * @param metadata Additional error metadata
   * @returns KafkaException instance
   */
  public static fromDeadLetterQueueError(
    message: string,
    metadata?: KafkaErrorMetadata
  ): KafkaException {
    return new KafkaException(
      `Kafka dead letter queue error: ${message}`,
      KafkaErrorCode.DEAD_LETTER_QUEUE_ERROR,
      metadata
    );
  }

  /**
   * Creates a KafkaException from a native Kafka.js error
   * @param error Original Kafka.js error
   * @param metadata Additional error metadata
   * @returns KafkaException instance
   */
  public static fromKafkaJsError(
    error: Error & { code?: string; broker?: string; retryCount?: number },
    metadata?: KafkaErrorMetadata
  ): KafkaException {
    // Map Kafka.js error codes to our internal error codes
    let errorCode = KafkaErrorCode.UNKNOWN_SERVER_ERROR;
    
    // Extract error code from Kafka.js error if available
    if (error.code) {
      switch (error.code) {
        case 'UNKNOWN_TOPIC_OR_PARTITION':
          errorCode = KafkaErrorCode.UNKNOWN_TOPIC_OR_PARTITION;
          break;
        case 'LEADER_NOT_AVAILABLE':
          errorCode = KafkaErrorCode.LEADER_NOT_AVAILABLE;
          break;
        case 'REQUEST_TIMED_OUT':
          errorCode = KafkaErrorCode.REQUEST_TIMED_OUT;
          break;
        case 'NETWORK_EXCEPTION':
          errorCode = KafkaErrorCode.NETWORK_EXCEPTION;
          break;
        case 'INVALID_MESSAGE':
          errorCode = KafkaErrorCode.CORRUPT_MESSAGE;
          break;
        case 'INVALID_TOPIC_EXCEPTION':
          errorCode = KafkaErrorCode.INVALID_TOPIC_EXCEPTION;
          break;
        case 'OFFSET_OUT_OF_RANGE':
          errorCode = KafkaErrorCode.OFFSET_OUT_OF_RANGE;
          break;
        case 'GROUP_AUTHORIZATION_FAILED':
          errorCode = KafkaErrorCode.GROUP_AUTHORIZATION_FAILED;
          break;
        case 'TOPIC_AUTHORIZATION_FAILED':
          errorCode = KafkaErrorCode.TOPIC_AUTHORIZATION_FAILED;
          break;
        case 'SASL_AUTHENTICATION_FAILED':
          errorCode = KafkaErrorCode.SASL_AUTHENTICATION_FAILED;
          break;
        default:
          errorCode = KafkaErrorCode.UNKNOWN_SERVER_ERROR;
      }
    }

    return new KafkaException(
      error.message,
      errorCode,
      {
        ...metadata,
        broker: error.broker,
        retryCount: error.retryCount,
        originalError: error,
      }
    );
  }
}
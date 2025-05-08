import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType } from '@austa/errors';
import { ExternalDependencyException } from './external-dependency.exception';

/**
 * Enum representing different types of Kafka errors
 */
export enum KafkaErrorType {
  /** Connection issues with Kafka brokers */
  CONNECTION = 'CONNECTION',
  /** Authentication or authorization failures */
  AUTHENTICATION = 'AUTHENTICATION',
  /** Message serialization or deserialization errors */
  SERIALIZATION = 'SERIALIZATION',
  /** Topic-related errors (not found, no permissions, etc.) */
  TOPIC = 'TOPIC',
  /** Producer-specific errors */
  PRODUCER = 'PRODUCER',
  /** Consumer-specific errors */
  CONSUMER = 'CONSUMER',
  /** Message validation failures */
  VALIDATION = 'VALIDATION',
  /** Schema registry errors */
  SCHEMA = 'SCHEMA',
  /** Broker-specific errors */
  BROKER = 'BROKER',
  /** Unknown or unclassified errors */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interface for Kafka error options
 */
export interface KafkaErrorOptions {
  /** Original error that caused this exception */
  cause?: Error;
  /** Kafka error code if available */
  kafkaErrorCode?: string;
  /** Type of Kafka error */
  kafkaErrorType?: KafkaErrorType;
  /** Topic related to the error */
  topic?: string;
  /** Consumer group ID if applicable */
  groupId?: string;
  /** Message key if applicable */
  messageKey?: string;
  /** Message value if applicable (sanitized) */
  messageValue?: any;
  /** Number of retry attempts made */
  retryAttempts?: number;
  /** Maximum retry attempts allowed */
  maxRetryAttempts?: number;
  /** Whether the message should be sent to DLQ */
  sendToDlq?: boolean;
  /** Additional error details */
  details?: Record<string, any>;
  /** Custom error code */
  code?: string;
}

/**
 * Specialized exception for Kafka-related errors.
 * 
 * Handles producer/consumer issues, message serialization failures,
 * topic management problems, and other Kafka-specific errors with
 * appropriate retry and circuit breaker integration.
 */
export class KafkaException extends ExternalDependencyException {
  /** Type of Kafka error */
  readonly kafkaErrorType: KafkaErrorType;
  
  /** Kafka error code if available */
  readonly kafkaErrorCode?: string;
  
  /** Topic related to the error */
  readonly topic?: string;
  
  /** Consumer group ID if applicable */
  readonly groupId?: string;
  
  /** Message key if applicable */
  readonly messageKey?: string;
  
  /** Number of retry attempts made */
  readonly retryAttempts?: number;
  
  /** Maximum retry attempts allowed */
  readonly maxRetryAttempts?: number;
  
  /** Whether the message should be sent to DLQ */
  readonly sendToDlq: boolean;
  
  /**
   * Creates a new KafkaException
   * 
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: KafkaErrorOptions = {}) {
    super(message, {
      code: options.code || 'GAMIFICATION_KAFKA_ERROR',
      cause: options.cause,
      details: {
        ...options.details,
        kafkaErrorType: options.kafkaErrorType || KafkaErrorType.UNKNOWN,
        kafkaErrorCode: options.kafkaErrorCode,
        topic: options.topic,
        groupId: options.groupId,
        messageKey: options.messageKey,
        retryAttempts: options.retryAttempts,
        maxRetryAttempts: options.maxRetryAttempts,
        sendToDlq: options.sendToDlq
      },
      dependencyName: 'Kafka',
      dependencyType: 'messaging',
      fallbackOptions: {
        hasFallback: false
      }
    });

    this.kafkaErrorType = options.kafkaErrorType || KafkaErrorType.UNKNOWN;
    this.kafkaErrorCode = options.kafkaErrorCode;
    this.topic = options.topic;
    this.groupId = options.groupId;
    this.messageKey = options.messageKey;
    this.retryAttempts = options.retryAttempts;
    this.maxRetryAttempts = options.maxRetryAttempts;
    this.sendToDlq = options.sendToDlq ?? this.shouldSendToDlq();
  }

  /**
   * Determines if the error is retryable based on the error type and code
   * 
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(): boolean {
    // Connection errors are generally retryable
    if (this.kafkaErrorType === KafkaErrorType.CONNECTION) {
      return true;
    }

    // Broker errors are generally retryable
    if (this.kafkaErrorType === KafkaErrorType.BROKER) {
      return true;
    }

    // Producer errors may be retryable depending on the specific error
    if (this.kafkaErrorType === KafkaErrorType.PRODUCER) {
      // Check specific Kafka error codes that are retryable
      const retryableProducerCodes = [
        'NETWORK_EXCEPTION',
        'LEADER_NOT_AVAILABLE',
        'NOT_LEADER_FOR_PARTITION',
        'REQUEST_TIMED_OUT',
        'BROKER_NOT_AVAILABLE',
        'GROUP_LOAD_IN_PROGRESS',
        'GROUP_COORDINATOR_NOT_AVAILABLE',
      ];
      
      return this.kafkaErrorCode ? retryableProducerCodes.includes(this.kafkaErrorCode) : false;
    }

    // Consumer errors may be retryable depending on the specific error
    if (this.kafkaErrorType === KafkaErrorType.CONSUMER) {
      // Check specific Kafka error codes that are retryable
      const retryableConsumerCodes = [
        'OFFSET_OUT_OF_RANGE',
        'UNKNOWN_TOPIC_OR_PARTITION',
        'GROUP_LOAD_IN_PROGRESS',
        'COORDINATOR_NOT_AVAILABLE',
        'NOT_COORDINATOR',
        'INVALID_TOPIC_EXCEPTION',
        'RECORD_LIST_TOO_LARGE',
        'NOT_ENOUGH_REPLICAS',
        'NOT_ENOUGH_REPLICAS_AFTER_APPEND',
        'NETWORK_EXCEPTION',
        'COORDINATOR_LOAD_IN_PROGRESS',
        'CONSUMER_COORDINATOR_NOT_AVAILABLE',
      ];
      
      return this.kafkaErrorCode ? retryableConsumerCodes.includes(this.kafkaErrorCode) : false;
    }

    // Topic errors may be retryable in some cases
    if (this.kafkaErrorType === KafkaErrorType.TOPIC) {
      const retryableTopicCodes = [
        'UNKNOWN_TOPIC_OR_PARTITION',
        'LEADER_NOT_AVAILABLE',
        'REQUEST_TIMED_OUT',
      ];
      
      return this.kafkaErrorCode ? retryableTopicCodes.includes(this.kafkaErrorCode) : false;
    }

    // By default, other error types are not retryable
    return false;
  }

  /**
   * Determines if the message should be sent to the Dead Letter Queue
   * 
   * @returns True if the message should be sent to DLQ, false otherwise
   */
  shouldSendToDlq(): boolean {
    // If retry attempts have been exhausted, send to DLQ
    if (this.retryAttempts !== undefined && 
        this.maxRetryAttempts !== undefined && 
        this.retryAttempts >= this.maxRetryAttempts) {
      return true;
    }

    // Non-retryable errors should go to DLQ
    if (!this.isRetryable()) {
      return true;
    }

    // Validation errors should always go to DLQ
    if (this.kafkaErrorType === KafkaErrorType.VALIDATION) {
      return true;
    }

    // Serialization errors should always go to DLQ
    if (this.kafkaErrorType === KafkaErrorType.SERIALIZATION) {
      return true;
    }

    // Authentication errors should not go to DLQ as they require manual intervention
    if (this.kafkaErrorType === KafkaErrorType.AUTHENTICATION) {
      return false;
    }

    // By default, don't send to DLQ
    return false;
  }

  /**
   * Calculates the retry delay in milliseconds using exponential backoff with jitter
   * 
   * @param baseDelayMs Base delay in milliseconds (default: 1000)
   * @param maxDelayMs Maximum delay in milliseconds (default: 30000)
   * @returns Delay in milliseconds before the next retry
   */
  calculateRetryDelay(baseDelayMs = 1000, maxDelayMs = 30000): number {
    if (this.retryAttempts === undefined) {
      return baseDelayMs;
    }

    // Calculate exponential backoff: baseDelay * 2^retryAttempt
    const exponentialDelay = baseDelayMs * Math.pow(2, this.retryAttempts);
    
    // Apply a random jitter of up to 25% to prevent thundering herd problem
    const jitter = Math.random() * 0.25 * exponentialDelay;
    
    // Apply the jitter (randomly add or subtract)
    const delayWithJitter = Math.random() > 0.5 
      ? exponentialDelay + jitter 
      : Math.max(baseDelayMs, exponentialDelay - jitter);
    
    // Ensure we don't exceed the maximum delay
    return Math.min(delayWithJitter, maxDelayMs);
  }

  /**
   * Creates a KafkaException for connection errors
   * 
   * @param message Error message
   * @param options Additional options
   * @returns KafkaException instance
   */
  static connectionError(message: string, options: Omit<KafkaErrorOptions, 'kafkaErrorType'> = {}): KafkaException {
    return new KafkaException(message, {
      ...options,
      kafkaErrorType: KafkaErrorType.CONNECTION,
      code: options.code || 'GAMIFICATION_KAFKA_CONNECTION_ERROR'
    });
  }

  /**
   * Creates a KafkaException for authentication errors
   * 
   * @param message Error message
   * @param options Additional options
   * @returns KafkaException instance
   */
  static authenticationError(message: string, options: Omit<KafkaErrorOptions, 'kafkaErrorType'> = {}): KafkaException {
    return new KafkaException(message, {
      ...options,
      kafkaErrorType: KafkaErrorType.AUTHENTICATION,
      code: options.code || 'GAMIFICATION_KAFKA_AUTHENTICATION_ERROR'
    });
  }

  /**
   * Creates a KafkaException for serialization errors
   * 
   * @param message Error message
   * @param options Additional options
   * @returns KafkaException instance
   */
  static serializationError(message: string, options: Omit<KafkaErrorOptions, 'kafkaErrorType'> = {}): KafkaException {
    return new KafkaException(message, {
      ...options,
      kafkaErrorType: KafkaErrorType.SERIALIZATION,
      code: options.code || 'GAMIFICATION_KAFKA_SERIALIZATION_ERROR',
      sendToDlq: true // Serialization errors should always go to DLQ
    });
  }

  /**
   * Creates a KafkaException for topic errors
   * 
   * @param message Error message
   * @param options Additional options
   * @returns KafkaException instance
   */
  static topicError(message: string, options: Omit<KafkaErrorOptions, 'kafkaErrorType'> = {}): KafkaException {
    return new KafkaException(message, {
      ...options,
      kafkaErrorType: KafkaErrorType.TOPIC,
      code: options.code || 'GAMIFICATION_KAFKA_TOPIC_ERROR'
    });
  }

  /**
   * Creates a KafkaException for producer errors
   * 
   * @param message Error message
   * @param options Additional options
   * @returns KafkaException instance
   */
  static producerError(message: string, options: Omit<KafkaErrorOptions, 'kafkaErrorType'> = {}): KafkaException {
    return new KafkaException(message, {
      ...options,
      kafkaErrorType: KafkaErrorType.PRODUCER,
      code: options.code || 'GAMIFICATION_KAFKA_PRODUCER_ERROR'
    });
  }

  /**
   * Creates a KafkaException for consumer errors
   * 
   * @param message Error message
   * @param options Additional options
   * @returns KafkaException instance
   */
  static consumerError(message: string, options: Omit<KafkaErrorOptions, 'kafkaErrorType'> = {}): KafkaException {
    return new KafkaException(message, {
      ...options,
      kafkaErrorType: KafkaErrorType.CONSUMER,
      code: options.code || 'GAMIFICATION_KAFKA_CONSUMER_ERROR'
    });
  }

  /**
   * Creates a KafkaException for validation errors
   * 
   * @param message Error message
   * @param options Additional options
   * @returns KafkaException instance
   */
  static validationError(message: string, options: Omit<KafkaErrorOptions, 'kafkaErrorType'> = {}): KafkaException {
    return new KafkaException(message, {
      ...options,
      kafkaErrorType: KafkaErrorType.VALIDATION,
      code: options.code || 'GAMIFICATION_KAFKA_VALIDATION_ERROR',
      sendToDlq: true // Validation errors should always go to DLQ
    });
  }

  /**
   * Creates a KafkaException for schema registry errors
   * 
   * @param message Error message
   * @param options Additional options
   * @returns KafkaException instance
   */
  static schemaError(message: string, options: Omit<KafkaErrorOptions, 'kafkaErrorType'> = {}): KafkaException {
    return new KafkaException(message, {
      ...options,
      kafkaErrorType: KafkaErrorType.SCHEMA,
      code: options.code || 'GAMIFICATION_KAFKA_SCHEMA_ERROR'
    });
  }

  /**
   * Creates a KafkaException from a native Kafka error
   * 
   * @param error Original Kafka error
   * @param context Additional context
   * @returns KafkaException instance
   */
  static fromKafkaError(error: Error, context: {
    topic?: string;
    groupId?: string;
    messageKey?: string;
    messageValue?: any;
    retryAttempts?: number;
    maxRetryAttempts?: number;
  } = {}): KafkaException {
    // Extract Kafka error code if available
    const kafkaErrorCode = (error as any).code || (error as any).type;
    
    // Determine error type based on the error code or message
    let kafkaErrorType = KafkaErrorType.UNKNOWN;
    let errorMessage = error.message;
    let code = 'GAMIFICATION_KAFKA_ERROR';
    
    // Connection errors
    if (
      kafkaErrorCode === 'ECONNREFUSED' ||
      kafkaErrorCode === 'CONNECTION_ERROR' ||
      error.message.includes('connect ECONNREFUSED') ||
      error.message.includes('Connection error')
    ) {
      kafkaErrorType = KafkaErrorType.CONNECTION;
      code = 'GAMIFICATION_KAFKA_CONNECTION_ERROR';
    }
    // Authentication errors
    else if (
      kafkaErrorCode === 'SASL_AUTHENTICATION_FAILED' ||
      error.message.includes('Authentication failed') ||
      error.message.includes('SASL Authentication failed')
    ) {
      kafkaErrorType = KafkaErrorType.AUTHENTICATION;
      code = 'GAMIFICATION_KAFKA_AUTHENTICATION_ERROR';
    }
    // Topic errors
    else if (
      kafkaErrorCode === 'UNKNOWN_TOPIC_OR_PARTITION' ||
      kafkaErrorCode === 'TOPIC_AUTHORIZATION_FAILED' ||
      error.message.includes('Unknown topic') ||
      error.message.includes('Topic authorization failed')
    ) {
      kafkaErrorType = KafkaErrorType.TOPIC;
      code = 'GAMIFICATION_KAFKA_TOPIC_ERROR';
    }
    // Producer errors
    else if (
      kafkaErrorCode === 'PRODUCER_NOT_READY' ||
      kafkaErrorCode === 'MESSAGE_TOO_LARGE' ||
      error.message.includes('Producer not ready') ||
      error.message.includes('Message size too large')
    ) {
      kafkaErrorType = KafkaErrorType.PRODUCER;
      code = 'GAMIFICATION_KAFKA_PRODUCER_ERROR';
    }
    // Consumer errors
    else if (
      kafkaErrorCode === 'OFFSET_OUT_OF_RANGE' ||
      kafkaErrorCode === 'GROUP_COORDINATOR_NOT_AVAILABLE' ||
      error.message.includes('Offset out of range') ||
      error.message.includes('Group coordinator not available')
    ) {
      kafkaErrorType = KafkaErrorType.CONSUMER;
      code = 'GAMIFICATION_KAFKA_CONSUMER_ERROR';
    }
    // Serialization errors
    else if (
      error.message.includes('Failed to decode') ||
      error.message.includes('Failed to encode') ||
      error.message.includes('Invalid JSON')
    ) {
      kafkaErrorType = KafkaErrorType.SERIALIZATION;
      code = 'GAMIFICATION_KAFKA_SERIALIZATION_ERROR';
    }
    
    return new KafkaException(errorMessage, {
      cause: error,
      kafkaErrorType,
      kafkaErrorCode,
      topic: context.topic,
      groupId: context.groupId,
      messageKey: context.messageKey,
      messageValue: context.messageValue,
      retryAttempts: context.retryAttempts,
      maxRetryAttempts: context.maxRetryAttempts,
      code
    });
  }
}

// Export the KafkaException as the default export
export default KafkaException;
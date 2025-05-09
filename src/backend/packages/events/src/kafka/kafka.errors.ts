/**
 * @file kafka.errors.ts
 * @description Custom error classes and handling utilities for Kafka operations.
 * Provides error categorization, retry policies, and circuit breaker implementations.
 */

import { BaseError, ErrorType } from '@austa/errors';
import { KafkaMessage } from 'kafkajs';

/**
 * Kafka error categories for more granular error handling
 */
export enum KafkaErrorCategory {
  // Connection errors
  CONNECTION = 'CONNECTION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  
  // Producer errors
  PRODUCER = 'PRODUCER',
  MESSAGE_PRODUCTION = 'MESSAGE_PRODUCTION',
  
  // Consumer errors
  CONSUMER = 'CONSUMER',
  MESSAGE_CONSUMPTION = 'MESSAGE_CONSUMPTION',
  SUBSCRIPTION = 'SUBSCRIPTION',
  
  // Message errors
  SERIALIZATION = 'SERIALIZATION',
  DESERIALIZATION = 'DESERIALIZATION',
  VALIDATION = 'VALIDATION',
  
  // Broker errors
  BROKER = 'BROKER',
  TOPIC = 'TOPIC',
  PARTITION = 'PARTITION',
  
  // Other
  UNKNOWN = 'UNKNOWN',
}

/**
 * Classification of Kafka errors for retry decisions
 */
export enum KafkaErrorType {
  // Errors that are likely to be resolved with a retry
  TRANSIENT = 'TRANSIENT',
  
  // Errors that will not be resolved with a retry
  PERMANENT = 'PERMANENT',
  
  // Errors that might be resolved with a retry after some time
  RETRIABLE_AFTER_WAIT = 'RETRIABLE_AFTER_WAIT',
}

/**
 * Context information for Kafka errors
 */
export interface KafkaErrorContext {
  topic?: string;
  partition?: number;
  offset?: string;
  key?: string;
  messageId?: string;
  correlationId?: string;
  consumerGroup?: string;
  broker?: string;
  retryCount?: number;
  originalError?: Error;
  kafkaMessage?: KafkaMessage;
  [key: string]: any; // Additional context
}

/**
 * Base class for all Kafka-related errors
 */
export class KafkaError extends BaseError {
  public readonly category: KafkaErrorCategory;
  public readonly errorType: KafkaErrorType;
  public readonly kafkaContext: KafkaErrorContext;
  
  constructor(
    message: string,
    category: KafkaErrorCategory = KafkaErrorCategory.UNKNOWN,
    errorType: KafkaErrorType = KafkaErrorType.PERMANENT,
    context: KafkaErrorContext = {},
    cause?: Error,
  ) {
    // All Kafka errors are considered external dependency errors
    super(message, ErrorType.EXTERNAL, { cause });
    
    this.category = category;
    this.errorType = errorType;
    this.kafkaContext = context;
    
    // Enhance the error name with the category
    this.name = `Kafka${category}Error`;
    
    // Add kafka context to the error metadata
    this.addMetadata('kafka', {
      category,
      errorType,
      ...context,
    });
  }
  
  /**
   * Determines if the error is retriable based on its type
   */
  public isRetriable(): boolean {
    return this.errorType === KafkaErrorType.TRANSIENT || 
           this.errorType === KafkaErrorType.RETRIABLE_AFTER_WAIT;
  }
  
  /**
   * Gets the recommended wait time before retrying
   * @param attempt Current retry attempt (1-based)
   * @param baseMs Base milliseconds for exponential backoff
   * @param maxMs Maximum milliseconds to wait
   */
  public getRetryDelayMs(attempt: number = 1, baseMs: number = 100, maxMs: number = 30000): number {
    if (!this.isRetriable()) {
      return -1; // Not retriable
    }
    
    if (this.errorType === KafkaErrorType.RETRIABLE_AFTER_WAIT) {
      // Calculate exponential backoff with jitter
      const exponentialDelay = Math.min(
        maxMs,
        baseMs * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5)
      );
      
      return Math.floor(exponentialDelay);
    }
    
    if (this.errorType === KafkaErrorType.TRANSIENT) {
      // Shorter delays for transient errors
      return Math.min(maxMs, baseMs * attempt);
    }
    
    return -1; // Not retriable
  }
}

// ===== Connection Errors =====

/**
 * Error thrown when unable to connect to Kafka brokers
 */
export class KafkaConnectionError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Failed to connect to Kafka brokers',
      KafkaErrorCategory.CONNECTION,
      KafkaErrorType.RETRIABLE_AFTER_WAIT,
      context,
      cause
    );
  }
}

/**
 * Error thrown when authentication with Kafka brokers fails
 */
export class KafkaAuthenticationError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Failed to authenticate with Kafka brokers',
      KafkaErrorCategory.AUTHENTICATION,
      KafkaErrorType.PERMANENT, // Authentication errors are typically not retriable
      context,
      cause
    );
  }
}

/**
 * Error thrown when authorization for a Kafka operation fails
 */
export class KafkaAuthorizationError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Not authorized to perform the requested Kafka operation',
      KafkaErrorCategory.AUTHORIZATION,
      KafkaErrorType.PERMANENT, // Authorization errors are typically not retriable
      context,
      cause
    );
  }
}

// ===== Producer Errors =====

/**
 * Error thrown when a message cannot be produced to Kafka
 */
export class KafkaProducerError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Failed to produce message to Kafka',
      KafkaErrorCategory.PRODUCER,
      KafkaErrorType.RETRIABLE_AFTER_WAIT,
      context,
      cause
    );
  }
}

/**
 * Error thrown when message production fails due to broker issues
 */
export class KafkaBrokerError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Kafka broker error occurred',
      KafkaErrorCategory.BROKER,
      KafkaErrorType.RETRIABLE_AFTER_WAIT,
      context,
      cause
    );
  }
}

/**
 * Error thrown when a topic does not exist or is not accessible
 */
export class KafkaTopicError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Topic does not exist or is not accessible',
      KafkaErrorCategory.TOPIC,
      KafkaErrorType.PERMANENT, // Topic errors are typically configuration issues
      context,
      cause
    );
  }
}

// ===== Consumer Errors =====

/**
 * Error thrown when a consumer fails to subscribe to a topic
 */
export class KafkaSubscriptionError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Failed to subscribe to Kafka topic',
      KafkaErrorCategory.SUBSCRIPTION,
      KafkaErrorType.RETRIABLE_AFTER_WAIT,
      context,
      cause
    );
  }
}

/**
 * Error thrown when message consumption fails
 */
export class KafkaConsumerError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Error during Kafka message consumption',
      KafkaErrorCategory.CONSUMER,
      KafkaErrorType.TRANSIENT, // Most consumer errors are transient
      context,
      cause
    );
  }
}

/**
 * Error thrown when message processing fails
 */
export class KafkaProcessingError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Failed to process Kafka message',
      KafkaErrorCategory.MESSAGE_CONSUMPTION,
      KafkaErrorType.TRANSIENT, // Processing errors might be resolved with a retry
      context,
      cause
    );
  }
}

// ===== Message Errors =====

/**
 * Error thrown when message serialization fails
 */
export class KafkaSerializationError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Failed to serialize message for Kafka',
      KafkaErrorCategory.SERIALIZATION,
      KafkaErrorType.PERMANENT, // Serialization errors are typically not retriable
      context,
      cause
    );
  }
}

/**
 * Error thrown when message deserialization fails
 */
export class KafkaDeserializationError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Failed to deserialize message from Kafka',
      KafkaErrorCategory.DESERIALIZATION,
      KafkaErrorType.PERMANENT, // Deserialization errors are typically not retriable
      context,
      cause
    );
  }
}

/**
 * Error thrown when message validation fails
 */
export class KafkaValidationError extends KafkaError {
  constructor(message: string, context: KafkaErrorContext = {}, cause?: Error) {
    super(
      message || 'Message validation failed',
      KafkaErrorCategory.VALIDATION,
      KafkaErrorType.PERMANENT, // Validation errors are typically not retriable
      context,
      cause
    );
  }
}

// ===== Retry Utilities =====

/**
 * Configuration for retry policies
 */
export interface RetryPolicyConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableErrors?: KafkaErrorCategory[];
}

/**
 * Default retry policy configuration
 */
export const DEFAULT_RETRY_POLICY: RetryPolicyConfig = {
  maxRetries: 5,
  initialDelayMs: 100,
  maxDelayMs: 30000,
  backoffFactor: 2,
  retryableErrors: [
    KafkaErrorCategory.CONNECTION,
    KafkaErrorCategory.BROKER,
    KafkaErrorCategory.PRODUCER,
    KafkaErrorCategory.CONSUMER,
    KafkaErrorCategory.SUBSCRIPTION,
    KafkaErrorCategory.MESSAGE_CONSUMPTION,
  ],
};

/**
 * Determines if an error should be retried based on the retry policy
 * @param error The Kafka error
 * @param retryCount Current retry count
 * @param config Retry policy configuration
 */
export function shouldRetry(
  error: Error,
  retryCount: number,
  config: RetryPolicyConfig = DEFAULT_RETRY_POLICY
): boolean {
  // Check if max retries exceeded
  if (retryCount >= config.maxRetries) {
    return false;
  }
  
  // If it's a KafkaError, use its built-in retriability check
  if (error instanceof KafkaError) {
    // Check if the error category is in the retryable categories list
    if (config.retryableErrors && 
        !config.retryableErrors.includes(error.category)) {
      return false;
    }
    
    return error.isRetriable();
  }
  
  // For non-KafkaErrors, assume they're retriable if within retry count
  return true;
}

/**
 * Calculates the delay before the next retry attempt
 * @param error The Kafka error
 * @param retryCount Current retry count (1-based)
 * @param config Retry policy configuration
 */
export function calculateRetryDelay(
  error: Error,
  retryCount: number,
  config: RetryPolicyConfig = DEFAULT_RETRY_POLICY
): number {
  // If it's a KafkaError, use its built-in delay calculation
  if (error instanceof KafkaError) {
    return error.getRetryDelayMs(
      retryCount,
      config.initialDelayMs,
      config.maxDelayMs
    );
  }
  
  // For non-KafkaErrors, use exponential backoff with jitter
  const exponentialDelay = Math.min(
    config.maxDelayMs,
    config.initialDelayMs * Math.pow(config.backoffFactor, retryCount - 1) * (0.5 + Math.random() * 0.5)
  );
  
  return Math.floor(exponentialDelay);
}

// ===== Circuit Breaker =====

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, requests pass through
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if the circuit can be closed again
}

/**
 * Configuration for the circuit breaker
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  resetTimeoutMs: number;        // Time in ms before trying half-open state
  successThreshold: number;      // Number of successes in half-open to close
  monitorIntervalMs: number;     // Interval to check circuit state
  timeWindowMs: number;          // Rolling window for failure counting
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  successThreshold: 2,
  monitorIntervalMs: 5000,
  timeWindowMs: 60000,
};

/**
 * Simple implementation of the Circuit Breaker pattern for Kafka operations
 */
export class KafkaCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private lastStateChange: number = Date.now();
  private readonly config: CircuitBreakerConfig;
  private readonly name: string;
  
  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }
  
  /**
   * Records a successful operation
   */
  public recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
    
    // Reset failures in closed state
    if (this.state === CircuitState.CLOSED) {
      this.failures = 0;
    }
  }
  
  /**
   * Records a failed operation
   * @param error The error that occurred
   */
  public recordFailure(error: Error): void {
    this.lastFailureTime = Date.now();
    
    // In half-open state, any failure trips back to open
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
      return;
    }
    
    if (this.state === CircuitState.CLOSED) {
      this.failures++;
      
      if (this.failures >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }
  
  /**
   * Checks if the circuit is allowing operations
   */
  public isAllowed(): boolean {
    this.checkStateTransition();
    return this.state !== CircuitState.OPEN;
  }
  
  /**
   * Gets the current state of the circuit
   */
  public getState(): CircuitState {
    this.checkStateTransition();
    return this.state;
  }
  
  /**
   * Resets the circuit breaker to closed state
   */
  public reset(): void {
    this.transitionTo(CircuitState.CLOSED);
  }
  
  /**
   * Transitions the circuit to a new state
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.lastStateChange = Date.now();
      
      // Reset counters on state change
      if (newState === CircuitState.CLOSED) {
        this.failures = 0;
      } else if (newState === CircuitState.HALF_OPEN) {
        this.successes = 0;
      }
      
      // Log state change
      console.log(`[KafkaCircuitBreaker:${this.name}] State changed to ${newState}`);
    }
  }
  
  /**
   * Checks if the circuit should transition based on timing
   */
  private checkStateTransition(): void {
    const now = Date.now();
    
    // Check if we should move from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      const timeInOpen = now - this.lastStateChange;
      if (timeInOpen >= this.config.resetTimeoutMs) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }
    
    // Clean up old failures outside the time window
    if (this.state === CircuitState.CLOSED) {
      const timeWindow = now - this.config.timeWindowMs;
      if (this.lastFailureTime < timeWindow) {
        this.failures = 0;
      }
    }
  }
}

// ===== Dead Letter Queue Utilities =====

/**
 * Interface for dead letter queue message
 */
export interface DeadLetterQueueMessage {
  originalMessage: KafkaMessage;
  error: {
    message: string;
    name: string;
    stack?: string;
    category?: string;
    errorType?: string;
    context?: Record<string, any>;
  };
  metadata: {
    topic: string;
    timestamp: number;
    retryCount: number;
    lastRetryTimestamp?: number;
    consumerGroup?: string;
    correlationId?: string;
    [key: string]: any;
  };
}

/**
 * Creates a dead letter queue message from a Kafka error and message
 * @param error The error that occurred
 * @param message The original Kafka message
 * @param topic The topic the message was consumed from
 * @param retryCount The number of retry attempts made
 * @param metadata Additional metadata to include
 */
export function createDeadLetterQueueMessage(
  error: Error,
  message: KafkaMessage,
  topic: string,
  retryCount: number,
  metadata: Record<string, any> = {}
): DeadLetterQueueMessage {
  const errorInfo: DeadLetterQueueMessage['error'] = {
    message: error.message,
    name: error.name,
    stack: error.stack,
  };
  
  // Add Kafka-specific error information if available
  if (error instanceof KafkaError) {
    errorInfo.category = error.category;
    errorInfo.errorType = error.errorType;
    errorInfo.context = error.kafkaContext;
  }
  
  // Extract correlation ID from headers if available
  let correlationId: string | undefined;
  if (message.headers) {
    const correlationHeader = message.headers['correlation-id'];
    if (correlationHeader) {
      correlationId = correlationHeader.toString();
    }
  }
  
  return {
    originalMessage: message,
    error: errorInfo,
    metadata: {
      topic,
      timestamp: Date.now(),
      retryCount,
      correlationId,
      ...metadata,
    },
  };
}

/**
 * Helper to determine if an error is a Kafka error
 * @param error The error to check
 */
export function isKafkaError(error: Error): error is KafkaError {
  return error instanceof KafkaError;
}

/**
 * Helper to categorize a generic error as a specific Kafka error
 * @param error The original error
 * @param context Additional context for the error
 */
export function categorizeKafkaError(error: Error, context: KafkaErrorContext = {}): KafkaError {
  // If it's already a KafkaError, just return it
  if (isKafkaError(error)) {
    return error;
  }
  
  // Check error message patterns to categorize
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('connect') || errorMessage.includes('connection')) {
    return new KafkaConnectionError(error.message, context, error);
  }
  
  if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
    return new KafkaAuthenticationError(error.message, context, error);
  }
  
  if (errorMessage.includes('authorization') || errorMessage.includes('permission') || 
      errorMessage.includes('access')) {
    return new KafkaAuthorizationError(error.message, context, error);
  }
  
  if (errorMessage.includes('topic')) {
    return new KafkaTopicError(error.message, context, error);
  }
  
  if (errorMessage.includes('broker')) {
    return new KafkaBrokerError(error.message, context, error);
  }
  
  if (errorMessage.includes('producer') || errorMessage.includes('produce')) {
    return new KafkaProducerError(error.message, context, error);
  }
  
  if (errorMessage.includes('consumer') || errorMessage.includes('consume')) {
    return new KafkaConsumerError(error.message, context, error);
  }
  
  if (errorMessage.includes('subscribe') || errorMessage.includes('subscription')) {
    return new KafkaSubscriptionError(error.message, context, error);
  }
  
  if (errorMessage.includes('serialize')) {
    return new KafkaSerializationError(error.message, context, error);
  }
  
  if (errorMessage.includes('deserialize')) {
    return new KafkaDeserializationError(error.message, context, error);
  }
  
  if (errorMessage.includes('validate') || errorMessage.includes('validation') || 
      errorMessage.includes('schema')) {
    return new KafkaValidationError(error.message, context, error);
  }
  
  // Default to a generic Kafka error
  return new KafkaError(
    error.message,
    KafkaErrorCategory.UNKNOWN,
    KafkaErrorType.PERMANENT,
    context,
    error
  );
}
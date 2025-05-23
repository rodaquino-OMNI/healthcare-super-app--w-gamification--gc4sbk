import { BaseError, ErrorType, ErrorCategory, ErrorContext } from '@austa/errors';
import { KafkaMessage } from 'kafkajs';

/**
 * Enum representing different types of Kafka errors
 */
export enum KafkaErrorType {
  // Connection errors
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  BROKER_UNAVAILABLE = 'BROKER_UNAVAILABLE',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  
  // Producer errors
  PRODUCER_ERROR = 'PRODUCER_ERROR',
  MESSAGE_SERIALIZATION_ERROR = 'MESSAGE_SERIALIZATION_ERROR',
  TOPIC_AUTHORIZATION_ERROR = 'TOPIC_AUTHORIZATION_ERROR',
  TOPIC_NOT_FOUND = 'TOPIC_NOT_FOUND',
  
  // Consumer errors
  CONSUMER_ERROR = 'CONSUMER_ERROR',
  MESSAGE_DESERIALIZATION_ERROR = 'MESSAGE_DESERIALIZATION_ERROR',
  OFFSET_OUT_OF_RANGE = 'OFFSET_OUT_OF_RANGE',
  GROUP_AUTHORIZATION_ERROR = 'GROUP_AUTHORIZATION_ERROR',
  REBALANCE_ERROR = 'REBALANCE_ERROR',
  
  // Admin errors
  ADMIN_ERROR = 'ADMIN_ERROR',
  CLUSTER_AUTHORIZATION_ERROR = 'CLUSTER_AUTHORIZATION_ERROR',
  
  // Generic errors
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface for Kafka error context
 */
export interface KafkaErrorContext extends ErrorContext {
  topic?: string;
  partition?: number;
  offset?: string;
  groupId?: string;
  clientId?: string;
  correlationId?: string;
  retryCount?: number;
  originalMessage?: KafkaMessage;
  broker?: string;
}

/**
 * Map of Kafka error types to their retryability status
 */
export const RETRYABLE_KAFKA_ERRORS = new Set([
  KafkaErrorType.CONNECTION_ERROR,
  KafkaErrorType.BROKER_UNAVAILABLE,
  KafkaErrorType.TIMEOUT_ERROR,
  KafkaErrorType.OFFSET_OUT_OF_RANGE,
  KafkaErrorType.REBALANCE_ERROR,
]);

/**
 * Map of Kafka error types to their error categories
 */
export const KAFKA_ERROR_CATEGORY_MAP: Record<KafkaErrorType, ErrorCategory> = {
  [KafkaErrorType.CONNECTION_ERROR]: ErrorCategory.TRANSIENT,
  [KafkaErrorType.BROKER_UNAVAILABLE]: ErrorCategory.TRANSIENT,
  [KafkaErrorType.AUTHENTICATION_ERROR]: ErrorCategory.SYSTEM,
  [KafkaErrorType.AUTHORIZATION_ERROR]: ErrorCategory.SYSTEM,
  
  [KafkaErrorType.PRODUCER_ERROR]: ErrorCategory.SYSTEM,
  [KafkaErrorType.MESSAGE_SERIALIZATION_ERROR]: ErrorCategory.CLIENT,
  [KafkaErrorType.TOPIC_AUTHORIZATION_ERROR]: ErrorCategory.SYSTEM,
  [KafkaErrorType.TOPIC_NOT_FOUND]: ErrorCategory.SYSTEM,
  
  [KafkaErrorType.CONSUMER_ERROR]: ErrorCategory.SYSTEM,
  [KafkaErrorType.MESSAGE_DESERIALIZATION_ERROR]: ErrorCategory.CLIENT,
  [KafkaErrorType.OFFSET_OUT_OF_RANGE]: ErrorCategory.TRANSIENT,
  [KafkaErrorType.GROUP_AUTHORIZATION_ERROR]: ErrorCategory.SYSTEM,
  [KafkaErrorType.REBALANCE_ERROR]: ErrorCategory.TRANSIENT,
  
  [KafkaErrorType.ADMIN_ERROR]: ErrorCategory.SYSTEM,
  [KafkaErrorType.CLUSTER_AUTHORIZATION_ERROR]: ErrorCategory.SYSTEM,
  
  [KafkaErrorType.TIMEOUT_ERROR]: ErrorCategory.TRANSIENT,
  [KafkaErrorType.UNKNOWN_ERROR]: ErrorCategory.SYSTEM,
};

/**
 * Base class for all Kafka errors
 */
export class KafkaError extends BaseError {
  constructor(
    message: string,
    readonly kafkaErrorType: KafkaErrorType,
    context?: KafkaErrorContext,
    cause?: Error
  ) {
    super(
      message,
      {
        errorType: ErrorType.EXTERNAL,
        errorCategory: KAFKA_ERROR_CATEGORY_MAP[kafkaErrorType] || ErrorCategory.SYSTEM,
        context: {
          kafkaErrorType,
          ...context,
        },
      },
      cause
    );
    
    // Ensure the name of the error is set correctly for logging and debugging
    this.name = this.constructor.name;
  }

  /**
   * Determines if this error is retryable
   */
  isRetryable(): boolean {
    return RETRYABLE_KAFKA_ERRORS.has(this.kafkaErrorType);
  }

  /**
   * Gets the retry delay in milliseconds based on the retry count
   * Implements exponential backoff with jitter
   */
  getRetryDelay(retryCount: number = 1): number {
    if (!this.isRetryable()) {
      return 0;
    }

    // Base delay of 100ms with exponential backoff and max of 30 seconds
    const baseDelay = 100;
    const maxDelay = 30000;
    
    // Calculate exponential backoff: baseDelay * 2^retryCount
    let delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    
    // Add jitter (±20%) to prevent thundering herd problem
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    delay = Math.max(baseDelay, delay + jitter);
    
    return Math.floor(delay);
  }

  /**
   * Creates a DLQ entry object for this error
   */
  toDlqEntry(messageKey?: string, messageValue?: any): Record<string, any> {
    return {
      errorType: this.kafkaErrorType,
      errorCategory: this.getErrorCategory(),
      errorMessage: this.message,
      stackTrace: this.stack,
      context: this.context,
      timestamp: new Date().toISOString(),
      messageKey,
      messageValue: typeof messageValue === 'object' ? JSON.stringify(messageValue) : String(messageValue),
    };
  }

  /**
   * Gets the error category
   */
  getErrorCategory(): ErrorCategory {
    return KAFKA_ERROR_CATEGORY_MAP[this.kafkaErrorType] || ErrorCategory.SYSTEM;
  }
}

/**
 * Connection-related Kafka errors
 */
export class KafkaConnectionError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.CONNECTION_ERROR, context, cause);
  }
}

export class KafkaBrokerUnavailableError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.BROKER_UNAVAILABLE, context, cause);
  }
}

export class KafkaAuthenticationError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.AUTHENTICATION_ERROR, context, cause);
  }
}

export class KafkaAuthorizationError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.AUTHORIZATION_ERROR, context, cause);
  }
}

/**
 * Producer-related Kafka errors
 */
export class KafkaProducerError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.PRODUCER_ERROR, context, cause);
  }
}

export class KafkaMessageSerializationError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.MESSAGE_SERIALIZATION_ERROR, context, cause);
  }
}

export class KafkaTopicAuthorizationError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.TOPIC_AUTHORIZATION_ERROR, context, cause);
  }
}

export class KafkaTopicNotFoundError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.TOPIC_NOT_FOUND, context, cause);
  }
}

/**
 * Consumer-related Kafka errors
 */
export class KafkaConsumerError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.CONSUMER_ERROR, context, cause);
  }
}

export class KafkaMessageDeserializationError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.MESSAGE_DESERIALIZATION_ERROR, context, cause);
  }
}

export class KafkaOffsetOutOfRangeError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.OFFSET_OUT_OF_RANGE, context, cause);
  }
}

export class KafkaGroupAuthorizationError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.GROUP_AUTHORIZATION_ERROR, context, cause);
  }
}

export class KafkaRebalanceError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.REBALANCE_ERROR, context, cause);
  }
}

/**
 * Admin-related Kafka errors
 */
export class KafkaAdminError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.ADMIN_ERROR, context, cause);
  }
}

export class KafkaClusterAuthorizationError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.CLUSTER_AUTHORIZATION_ERROR, context, cause);
  }
}

/**
 * Generic Kafka errors
 */
export class KafkaTimeoutError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.TIMEOUT_ERROR, context, cause);
  }
}

export class KafkaUnknownError extends KafkaError {
  constructor(message: string, context?: KafkaErrorContext, cause?: Error) {
    super(message, KafkaErrorType.UNKNOWN_ERROR, context, cause);
  }
}

/**
 * Circuit breaker implementation for Kafka operations
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, requests pass through
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back online
}

export interface CircuitBreakerOptions {
  failureThreshold: number;      // Number of failures before opening circuit
  resetTimeout: number;          // Time in ms before attempting reset (half-open)
  successThreshold: number;      // Number of successes in half-open before closing
  timeout?: number;              // Optional timeout for operations
  monitorInterval?: number;      // Interval to check circuit state
}

export class KafkaCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private resetTimer: NodeJS.Timeout | null = null;
  private readonly options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      successThreshold: 2,
      timeout: 10000,      // 10 seconds
      monitorInterval: 5000, // 5 seconds
      ...options
    };

    // Start monitoring circuit state
    if (this.options.monitorInterval) {
      setInterval(() => this.monitorCircuitState(), this.options.monitorInterval);
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.halfOpenCircuit();
      } else {
        throw new KafkaError(
          'Circuit breaker is open, fast failing request',
          KafkaErrorType.CONNECTION_ERROR,
          { circuitState: this.state }
        );
      }
    }

    try {
      // Execute with optional timeout
      const result = await this.executeWithTimeout(fn);
      
      // Record success
      this.onSuccess();
      return result;
    } catch (error) {
      // Record failure
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.timeout) {
      return fn();
    }

    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new KafkaTimeoutError(
            `Operation timed out after ${this.options.timeout}ms`,
            { timeout: this.options.timeout }
          ));
        }, this.options.timeout);
      })
    ]);
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.closeCircuit();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count after successful operation
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      // If we fail during half-open, immediately open the circuit again
      this.openCircuit();
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.options.failureThreshold) {
        this.openCircuit();
      }
    }
  }

  /**
   * Open the circuit
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = Date.now();
    
    // Schedule reset to half-open
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    this.resetTimer = setTimeout(
      () => this.halfOpenCircuit(),
      this.options.resetTimeout
    );
  }

  /**
   * Set circuit to half-open state
   */
  private halfOpenCircuit(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
  }

  /**
   * Close the circuit
   */
  private closeCircuit(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Monitor circuit state and log/emit metrics
   */
  private monitorCircuitState(): void {
    // This would typically integrate with a metrics system
    // For now, we'll just return the current state
    const metrics = {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime > 0 ? new Date(this.lastFailureTime).toISOString() : null,
      timeSinceLastFailure: this.lastFailureTime > 0 ? Date.now() - this.lastFailureTime : null,
    };
    
    // In a real implementation, this would send metrics to a monitoring system
    // console.log('Circuit Breaker Metrics:', metrics);
    return metrics;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    this.closeCircuit();
  }
}

/**
 * Factory function to create appropriate Kafka error based on error code or message
 */
export function createKafkaError(
  error: Error | string,
  context?: KafkaErrorContext
): KafkaError {
  const message = typeof error === 'string' ? error : error.message;
  const cause = typeof error === 'string' ? undefined : error;
  
  // Check for specific error patterns in the message
  if (typeof message === 'string') {
    // Connection errors
    if (message.includes('connect ECONNREFUSED') || message.includes('Connection error')) {
      return new KafkaConnectionError(message, context, cause);
    }
    if (message.includes('Broker not available') || message.includes('Could not find leader')) {
      return new KafkaBrokerUnavailableError(message, context, cause);
    }
    if (message.includes('SASL Authentication failed') || message.includes('authentication failed')) {
      return new KafkaAuthenticationError(message, context, cause);
    }
    if (message.includes('not authorized')) {
      return new KafkaAuthorizationError(message, context, cause);
    }
    
    // Producer errors
    if (message.includes('Failed to produce message') || message.includes('Producer Network Error')) {
      return new KafkaProducerError(message, context, cause);
    }
    if (message.includes('Invalid message format') || message.includes('Error serializing message')) {
      return new KafkaMessageSerializationError(message, context, cause);
    }
    if (message.includes('Topic authorization failed')) {
      return new KafkaTopicAuthorizationError(message, context, cause);
    }
    if (message.includes('This server does not host this topic-partition')) {
      return new KafkaTopicNotFoundError(message, context, cause);
    }
    
    // Consumer errors
    if (message.includes('Consumer error') || message.includes('Failed to consume message')) {
      return new KafkaConsumerError(message, context, cause);
    }
    if (message.includes('Error deserializing message') || message.includes('Invalid message format')) {
      return new KafkaMessageDeserializationError(message, context, cause);
    }
    if (message.includes('Offset out of range')) {
      return new KafkaOffsetOutOfRangeError(message, context, cause);
    }
    if (message.includes('Group authorization failed')) {
      return new KafkaGroupAuthorizationError(message, context, cause);
    }
    if (message.includes('Rebalance') || message.includes('Member has been removed from the group')) {
      return new KafkaRebalanceError(message, context, cause);
    }
    
    // Admin errors
    if (message.includes('Admin operation failed')) {
      return new KafkaAdminError(message, context, cause);
    }
    if (message.includes('Cluster authorization failed')) {
      return new KafkaClusterAuthorizationError(message, context, cause);
    }
    
    // Generic errors
    if (message.includes('Request timed out') || message.includes('Timed out')) {
      return new KafkaTimeoutError(message, context, cause);
    }
  }
  
  // Default to unknown error if no specific pattern matches
  return new KafkaUnknownError(
    typeof message === 'string' ? message : 'Unknown Kafka error',
    context,
    cause
  );
}

/**
 * Helper function to determine if a Kafka error is retryable
 */
export function isRetryableKafkaError(error: Error | KafkaError): boolean {
  if (error instanceof KafkaError) {
    return error.isRetryable();
  }
  
  // For non-KafkaError instances, create a KafkaError and check
  const kafkaError = createKafkaError(error);
  return kafkaError.isRetryable();
}

/**
 * Helper function to get retry delay for a Kafka error
 */
export function getKafkaErrorRetryDelay(error: Error | KafkaError, retryCount: number = 1): number {
  if (error instanceof KafkaError) {
    return error.getRetryDelay(retryCount);
  }
  
  // For non-KafkaError instances, create a KafkaError and get delay
  const kafkaError = createKafkaError(error);
  return kafkaError.getRetryDelay(retryCount);
}

/**
 * Helper function to create a DLQ entry from a Kafka error
 */
export function createKafkaDlqEntry(
  error: Error | KafkaError,
  messageKey?: string,
  messageValue?: any,
  context?: KafkaErrorContext
): Record<string, any> {
  if (error instanceof KafkaError) {
    return error.toDlqEntry(messageKey, messageValue);
  }
  
  // For non-KafkaError instances, create a KafkaError and get DLQ entry
  const kafkaError = createKafkaError(error, context);
  return kafkaError.toDlqEntry(messageKey, messageValue);
}
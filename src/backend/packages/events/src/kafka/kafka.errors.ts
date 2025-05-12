/**
 * @file kafka.errors.ts
 * @description Defines custom error classes and handling utilities for Kafka operations,
 * including error categorization, retry policies, and circuit breaker implementations.
 */

import { 
  BaseError, 
  ErrorType, 
  ExternalApiError, 
  ExternalDependencyUnavailableError,
  TechnicalError,
  TimeoutError
} from '@austa/errors';
import { KafkaMessage } from 'kafkajs';

/**
 * Enum representing the different states of a circuit breaker
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back online
}

/**
 * Enum representing the different types of Kafka errors
 */
export enum KafkaErrorType {
  // Producer errors
  PRODUCER_INITIALIZATION = 'PRODUCER_INITIALIZATION',
  PRODUCER_DISCONNECTED = 'PRODUCER_DISCONNECTED',
  MESSAGE_SERIALIZATION = 'MESSAGE_SERIALIZATION',
  TOPIC_AUTHORIZATION = 'TOPIC_AUTHORIZATION',
  TOPIC_METADATA = 'TOPIC_METADATA',
  MESSAGE_PRODUCTION = 'MESSAGE_PRODUCTION',
  
  // Consumer errors
  CONSUMER_INITIALIZATION = 'CONSUMER_INITIALIZATION',
  CONSUMER_DISCONNECTED = 'CONSUMER_DISCONNECTED',
  MESSAGE_DESERIALIZATION = 'MESSAGE_DESERIALIZATION',
  SUBSCRIPTION = 'SUBSCRIPTION',
  OFFSET_COMMIT = 'OFFSET_COMMIT',
  GROUP_AUTHORIZATION = 'GROUP_AUTHORIZATION',
  CONSUMER_GROUP = 'CONSUMER_GROUP',
  MESSAGE_CONSUMPTION = 'MESSAGE_CONSUMPTION',
  
  // Admin errors
  ADMIN_INITIALIZATION = 'ADMIN_INITIALIZATION',
  ADMIN_OPERATION = 'ADMIN_OPERATION',
  
  // General errors
  CONNECTION = 'CONNECTION',
  AUTHENTICATION = 'AUTHENTICATION',
  BROKER_UNAVAILABLE = 'BROKER_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interface for Kafka error details
 */
export interface KafkaErrorDetails {
  topic?: string;
  partition?: number;
  offset?: string;
  consumerGroup?: string;
  messageKey?: string;
  correlationId?: string;
  retryCount?: number;
  originalError?: Error;
  kafkaMessage?: KafkaMessage;
}

/**
 * Base class for all Kafka-related errors
 */
export class KafkaError extends BaseError {
  public readonly kafkaErrorType: KafkaErrorType;
  public readonly details: KafkaErrorDetails;
  public readonly retryable: boolean;

  constructor(
    message: string,
    kafkaErrorType: KafkaErrorType,
    details: KafkaErrorDetails = {},
    retryable = false,
    errorType = ErrorType.TECHNICAL,
    cause?: Error
  ) {
    super(message, errorType, cause);
    this.kafkaErrorType = kafkaErrorType;
    this.details = details;
    this.retryable = retryable;
    
    // Add additional context for better error tracking
    if (details.topic) {
      this.addContext('topic', details.topic);
    }
    
    if (details.partition !== undefined) {
      this.addContext('partition', details.partition.toString());
    }
    
    if (details.consumerGroup) {
      this.addContext('consumerGroup', details.consumerGroup);
    }
    
    if (details.correlationId) {
      this.addContext('correlationId', details.correlationId);
    }
    
    if (details.retryCount !== undefined) {
      this.addContext('retryCount', details.retryCount.toString());
    }
  }

  /**
   * Determines if the error is retryable based on its type and context
   * @returns boolean indicating if the error can be retried
   */
  public isRetryable(): boolean {
    return this.retryable;
  }

  /**
   * Creates a copy of the error with updated retry count
   * @param retryCount The new retry count
   * @returns A new KafkaError instance with updated retry count
   */
  public withRetryCount(retryCount: number): KafkaError {
    return new KafkaError(
      this.message,
      this.kafkaErrorType,
      { ...this.details, retryCount },
      this.retryable,
      this.errorType,
      this.cause as Error
    );
  }
}

/**
 * Error thrown when there's an issue with Kafka producer initialization
 */
export class KafkaProducerInitializationError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Failed to initialize Kafka producer',
      KafkaErrorType.PRODUCER_INITIALIZATION,
      details,
      false, // Not retryable, requires intervention
      ErrorType.TECHNICAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an issue with Kafka consumer initialization
 */
export class KafkaConsumerInitializationError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Failed to initialize Kafka consumer',
      KafkaErrorType.CONSUMER_INITIALIZATION,
      details,
      false, // Not retryable, requires intervention
      ErrorType.TECHNICAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an issue with Kafka message production
 */
export class KafkaProducerError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Failed to produce Kafka message',
      KafkaErrorType.MESSAGE_PRODUCTION,
      details,
      true, // Retryable in most cases
      ErrorType.TECHNICAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an issue with Kafka message consumption
 */
export class KafkaConsumerError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Failed to consume Kafka message',
      KafkaErrorType.MESSAGE_CONSUMPTION,
      details,
      true, // Retryable in most cases
      ErrorType.TECHNICAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an issue with Kafka message serialization
 */
export class KafkaSerializationError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Failed to serialize Kafka message',
      KafkaErrorType.MESSAGE_SERIALIZATION,
      details,
      false, // Not retryable, message format issue
      ErrorType.TECHNICAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an issue with Kafka message deserialization
 */
export class KafkaDeserializationError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Failed to deserialize Kafka message',
      KafkaErrorType.MESSAGE_DESERIALIZATION,
      details,
      false, // Not retryable, message format issue
      ErrorType.TECHNICAL,
      cause
    );
  }
}

/**
 * Error thrown when there's a connection issue with Kafka brokers
 */
export class KafkaConnectionError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Failed to connect to Kafka broker',
      KafkaErrorType.CONNECTION,
      details,
      true, // Retryable, connection might recover
      ErrorType.EXTERNAL,
      cause
    );
  }
}

/**
 * Error thrown when Kafka broker is unavailable
 */
export class KafkaBrokerUnavailableError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Kafka broker unavailable',
      KafkaErrorType.BROKER_UNAVAILABLE,
      details,
      true, // Retryable, broker might recover
      ErrorType.EXTERNAL,
      cause
    );
  }
}

/**
 * Error thrown when there's a timeout in Kafka operations
 */
export class KafkaTimeoutError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Kafka operation timed out',
      KafkaErrorType.TIMEOUT,
      details,
      true, // Retryable, might succeed on retry
      ErrorType.EXTERNAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an authentication issue with Kafka
 */
export class KafkaAuthenticationError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Kafka authentication failed',
      KafkaErrorType.AUTHENTICATION,
      details,
      false, // Not retryable, requires credential fix
      ErrorType.EXTERNAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an authorization issue with Kafka topics
 */
export class KafkaTopicAuthorizationError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Not authorized to access Kafka topic',
      KafkaErrorType.TOPIC_AUTHORIZATION,
      details,
      false, // Not retryable, requires permission fix
      ErrorType.EXTERNAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an authorization issue with Kafka consumer groups
 */
export class KafkaGroupAuthorizationError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Not authorized to access Kafka consumer group',
      KafkaErrorType.GROUP_AUTHORIZATION,
      details,
      false, // Not retryable, requires permission fix
      ErrorType.EXTERNAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an issue with Kafka consumer group
 */
export class KafkaConsumerGroupError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Kafka consumer group error',
      KafkaErrorType.CONSUMER_GROUP,
      details,
      true, // Retryable, group coordination might recover
      ErrorType.TECHNICAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an issue with Kafka offset commit
 */
export class KafkaOffsetCommitError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Failed to commit Kafka offset',
      KafkaErrorType.OFFSET_COMMIT,
      details,
      true, // Retryable, commit might succeed on retry
      ErrorType.TECHNICAL,
      cause
    );
  }
}

/**
 * Error thrown when there's an unknown Kafka error
 */
export class KafkaUnknownError extends KafkaError {
  constructor(message: string, details: KafkaErrorDetails = {}, cause?: Error) {
    super(
      message || 'Unknown Kafka error',
      KafkaErrorType.UNKNOWN,
      details,
      false, // Not retryable by default for unknown errors
      ErrorType.TECHNICAL,
      cause
    );
  }
}

/**
 * Utility to categorize Kafka errors from kafkajs library errors
 * @param error The original error from kafkajs
 * @param details Additional details about the Kafka operation
 * @returns A properly categorized KafkaError instance
 */
export function categorizeKafkaError(error: Error, details: KafkaErrorDetails = {}): KafkaError {
  // Extract error type from kafkajs error if available
  const kafkaJsType = (error as any).type;
  const kafkaJsCode = (error as any).code;
  
  // Handle known kafkajs error types
  if (kafkaJsType) {
    switch (kafkaJsType) {
      case 'UNKNOWN':
        return new KafkaUnknownError(error.message, details, error);
      
      case 'NETWORK':
        return new KafkaConnectionError(error.message, details, error);
      
      case 'AUTHENTICATION':
        return new KafkaAuthenticationError(error.message, details, error);
      
      case 'TOPIC_AUTHORIZATION':
        return new KafkaTopicAuthorizationError(error.message, details, error);
      
      case 'GROUP_AUTHORIZATION':
        return new KafkaGroupAuthorizationError(error.message, details, error);
      
      case 'OFFSET_FETCH':
      case 'OFFSET_COMMIT':
        return new KafkaOffsetCommitError(error.message, details, error);
      
      case 'REQUEST_TIMEOUT':
        return new KafkaTimeoutError(error.message, details, error);
    }
  }
  
  // Handle based on error message patterns
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('timeout')) {
    return new KafkaTimeoutError(error.message, details, error);
  }
  
  if (errorMessage.includes('connection') || errorMessage.includes('network')) {
    return new KafkaConnectionError(error.message, details, error);
  }
  
  if (errorMessage.includes('serialization') || errorMessage.includes('serialize')) {
    return new KafkaSerializationError(error.message, details, error);
  }
  
  if (errorMessage.includes('deserialization') || errorMessage.includes('deserialize')) {
    return new KafkaDeserializationError(error.message, details, error);
  }
  
  if (errorMessage.includes('producer')) {
    return new KafkaProducerError(error.message, details, error);
  }
  
  if (errorMessage.includes('consumer')) {
    return new KafkaConsumerError(error.message, details, error);
  }
  
  // Default to unknown error
  return new KafkaUnknownError(error.message, details, error);
}

/**
 * Interface for circuit breaker options
 */
export interface CircuitBreakerOptions {
  failureThreshold: number;       // Number of failures before opening circuit
  successThreshold: number;       // Number of successes in half-open state to close circuit
  resetTimeout: number;           // Time in ms to wait before attempting reset (half-open)
  monitorInterval?: number;       // Interval in ms to check circuit state
  timeout?: number;               // Timeout in ms for operations
  volumeThreshold?: number;       // Minimum number of requests before tripping circuit
  errorPercentageThreshold?: number; // Error percentage to trip circuit
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState) => void;
  onSuccess?: (duration: number) => void;
  onFailure?: (error: Error, duration: number) => void;
}

/**
 * Implementation of the Circuit Breaker pattern for Kafka operations
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private totalCount: number = 0;
  private failurePercentage: number = 0;
  private readonly options: CircuitBreakerOptions;
  private resetTimer: NodeJS.Timeout | null = null;
  private monitorTimer: NodeJS.Timeout | null = null;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: 5,
      successThreshold: 2,
      resetTimeout: 30000, // 30 seconds
      monitorInterval: 60000, // 1 minute
      timeout: 10000, // 10 seconds
      volumeThreshold: 10,
      errorPercentageThreshold: 50,
      ...options
    };
    
    // Start monitoring if interval is provided
    if (this.options.monitorInterval) {
      this.startMonitoring();
    }
  }

  /**
   * Executes a function with circuit breaker protection
   * @param fn The function to execute
   * @returns The result of the function
   * @throws Error if circuit is open or function fails
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      // Check if it's time to try again
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        return this.attemptReset(fn);
      }
      
      throw new ExternalDependencyUnavailableError(
        'Circuit breaker is open, service unavailable',
        { service: 'Kafka', lastFailure: new Date(this.lastFailureTime).toISOString() }
      );
    }
    
    // Execute with timeout
    const startTime = Date.now();
    try {
      const result = await this.executeWithTimeout(fn);
      this.recordSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordFailure(error as Error, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Gets the current state of the circuit breaker
   * @returns The current circuit breaker state
   */
  public getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Gets the current failure count
   * @returns The number of consecutive failures
   */
  public getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Gets the current failure percentage
   * @returns The percentage of failed requests
   */
  public getFailurePercentage(): number {
    return this.failurePercentage;
  }

  /**
   * Manually resets the circuit breaker to closed state
   */
  public reset(): void {
    this.changeState(CircuitBreakerState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.totalCount = 0;
    this.failurePercentage = 0;
    this.lastFailureTime = 0;
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Manually opens the circuit breaker
   */
  public open(): void {
    this.changeState(CircuitBreakerState.OPEN);
    this.lastFailureTime = Date.now();
    this.scheduleReset();
  }

  /**
   * Stops all timers and monitoring
   */
  public dispose(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  /**
   * Executes a function with a timeout
   * @param fn The function to execute
   * @returns The result of the function
   * @throws TimeoutError if the function takes too long
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.timeout) {
      return fn();
    }
    
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(
          `Operation timed out after ${this.options.timeout}ms`,
          { timeout: this.options.timeout }
        ));
      }, this.options.timeout);
      
      fn()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Records a successful operation
   * @param duration The duration of the operation in ms
   */
  private recordSuccess(duration: number): void {
    this.totalCount++;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        this.changeState(CircuitBreakerState.CLOSED);
      }
    } else {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
    
    // Update failure percentage
    this.updateFailurePercentage();
    
    // Notify success if callback provided
    if (this.options.onSuccess) {
      this.options.onSuccess(duration);
    }
  }

  /**
   * Records a failed operation
   * @param error The error that occurred
   * @param duration The duration of the operation in ms
   */
  private recordFailure(error: Error, duration: number): void {
    this.failureCount++;
    this.totalCount++;
    this.lastFailureTime = Date.now();
    
    // Update failure percentage
    this.updateFailurePercentage();
    
    // Check if circuit should trip
    if (this.shouldTrip()) {
      this.changeState(CircuitBreakerState.OPEN);
      this.scheduleReset();
    }
    
    // Notify failure if callback provided
    if (this.options.onFailure) {
      this.options.onFailure(error, duration);
    }
  }

  /**
   * Determines if the circuit should trip based on failure count and percentage
   * @returns True if the circuit should trip, false otherwise
   */
  private shouldTrip(): boolean {
    // Don't trip if already open or half-open
    if (this.state !== CircuitBreakerState.CLOSED) {
      return false;
    }
    
    // Check absolute failure count
    if (this.failureCount >= this.options.failureThreshold) {
      return true;
    }
    
    // Check failure percentage if volume threshold is met
    if (
      this.options.volumeThreshold &&
      this.options.errorPercentageThreshold &&
      this.totalCount >= this.options.volumeThreshold &&
      this.failurePercentage >= this.options.errorPercentageThreshold
    ) {
      return true;
    }
    
    return false;
  }

  /**
   * Updates the failure percentage based on current counts
   */
  private updateFailurePercentage(): void {
    if (this.totalCount === 0) {
      this.failurePercentage = 0;
    } else {
      this.failurePercentage = (this.failureCount / this.totalCount) * 100;
    }
  }

  /**
   * Attempts to reset the circuit by moving to half-open state and executing a test function
   * @param fn The function to test
   * @returns The result of the function if successful
   */
  private async attemptReset<T>(fn: () => Promise<T>): Promise<T> {
    this.changeState(CircuitBreakerState.HALF_OPEN);
    
    const startTime = Date.now();
    try {
      const result = await this.executeWithTimeout(fn);
      this.recordSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordFailure(error as Error, Date.now() - startTime);
      this.changeState(CircuitBreakerState.OPEN);
      this.scheduleReset();
      throw error;
    }
  }

  /**
   * Schedules a reset attempt after the reset timeout
   */
  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    this.resetTimer = setTimeout(() => {
      // Only move to half-open if still open
      if (this.state === CircuitBreakerState.OPEN) {
        this.changeState(CircuitBreakerState.HALF_OPEN);
      }
    }, this.options.resetTimeout);
  }

  /**
   * Changes the circuit breaker state and notifies listeners
   * @param newState The new state to change to
   */
  private changeState(newState: CircuitBreakerState): void {
    if (this.state === newState) {
      return;
    }
    
    const oldState = this.state;
    this.state = newState;
    
    // Reset counters on state change
    if (newState === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === CircuitBreakerState.HALF_OPEN) {
      this.successCount = 0;
    }
    
    // Notify state change if callback provided
    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState);
    }
  }

  /**
   * Starts monitoring the circuit breaker state
   */
  private startMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }
    
    this.monitorTimer = setInterval(() => {
      // Reset statistics periodically to avoid stale data
      if (this.state === CircuitBreakerState.CLOSED) {
        // Only reset counters if in closed state and no recent failures
        const timeSinceLastFailure = this.lastFailureTime ? Date.now() - this.lastFailureTime : Infinity;
        if (timeSinceLastFailure > this.options.resetTimeout * 2) {
          this.totalCount = 0;
          this.failurePercentage = 0;
        }
      }
    }, this.options.monitorInterval);
  }
}

/**
 * Interface for retry policy options
 */
export interface RetryPolicyOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryableErrors?: KafkaErrorType[];
}

/**
 * Implementation of retry policy with exponential backoff for Kafka operations
 */
export class KafkaRetryPolicy {
  private readonly options: Required<RetryPolicyOptions>;

  constructor(options: RetryPolicyOptions) {
    this.options = {
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 10000,
      backoffFactor: 2,
      jitter: true,
      retryableErrors: [
        KafkaErrorType.CONNECTION,
        KafkaErrorType.BROKER_UNAVAILABLE,
        KafkaErrorType.TIMEOUT,
        KafkaErrorType.MESSAGE_PRODUCTION,
        KafkaErrorType.MESSAGE_CONSUMPTION,
        KafkaErrorType.CONSUMER_GROUP,
        KafkaErrorType.OFFSET_COMMIT
      ],
      ...options
    };
  }

  /**
   * Determines if an error is retryable based on the policy
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  public isRetryable(error: Error): boolean {
    if (error instanceof KafkaError) {
      // Check if error is explicitly marked as retryable
      if (error.retryable) {
        return true;
      }
      
      // Check if error type is in retryable errors list
      return this.options.retryableErrors.includes(error.kafkaErrorType);
    }
    
    // For non-Kafka errors, check if it's a network or timeout error
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset')
    );
  }

  /**
   * Calculates the delay for a retry attempt
   * @param attempt The current retry attempt (0-based)
   * @returns The delay in milliseconds
   */
  public getRetryDelay(attempt: number): number {
    if (attempt < 0) {
      return 0;
    }
    
    // Calculate exponential backoff
    const exponentialDelay = this.options.initialDelay * Math.pow(this.options.backoffFactor, attempt);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, this.options.maxDelay);
    
    // Apply jitter if enabled (prevents thundering herd problem)
    if (this.options.jitter) {
      // Add random jitter between 0% and 25% of the delay
      const jitterAmount = cappedDelay * 0.25;
      return cappedDelay - (Math.random() * jitterAmount);
    }
    
    return cappedDelay;
  }

  /**
   * Gets the maximum number of retries
   * @returns The maximum number of retries
   */
  public getMaxRetries(): number {
    return this.options.maxRetries;
  }

  /**
   * Executes a function with retry logic
   * @param fn The function to execute
   * @returns The result of the function
   * @throws The last error if all retries fail
   */
  public async execute<T>(fn: (attempt: number) => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await fn(attempt);
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry
        if (
          attempt < this.options.maxRetries && 
          this.isRetryable(lastError)
        ) {
          // Calculate delay for next attempt
          const delay = this.getRetryDelay(attempt);
          
          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // No more retries or not retryable
        break;
      }
    }
    
    // If we get here, all retries failed
    throw lastError;
  }
}

/**
 * Interface for dead letter queue options
 */
export interface DeadLetterQueueOptions {
  topic: string;
  maxRetries?: number;
  headerPrefix?: string;
}

/**
 * Utility for handling dead letter queue operations
 */
export class DeadLetterQueue {
  private readonly options: Required<DeadLetterQueueOptions>;

  constructor(options: DeadLetterQueueOptions) {
    this.options = {
      maxRetries: 3,
      headerPrefix: 'dlq-',
      ...options
    };
  }

  /**
   * Gets the dead letter queue topic
   * @returns The DLQ topic name
   */
  public getTopic(): string {
    return this.options.topic;
  }

  /**
   * Prepares a message for the dead letter queue
   * @param message The original Kafka message
   * @param error The error that caused the message to be sent to DLQ
   * @param retryCount The number of retries attempted
   * @returns The prepared message for DLQ
   */
  public prepareMessage(message: KafkaMessage, error: Error, retryCount: number): KafkaMessage {
    // Create headers if they don't exist
    const headers = message.headers || {};
    
    // Add DLQ-specific headers
    const dlqHeaders = {
      ...headers,
      [`${this.options.headerPrefix}original-topic`]: Buffer.from(message.topic || ''),
      [`${this.options.headerPrefix}error-message`]: Buffer.from(error.message),
      [`${this.options.headerPrefix}error-type`]: Buffer.from(error instanceof KafkaError ? error.kafkaErrorType : 'UNKNOWN'),
      [`${this.options.headerPrefix}retry-count`]: Buffer.from(retryCount.toString()),
      [`${this.options.headerPrefix}timestamp`]: Buffer.from(Date.now().toString())
    };
    
    // If error is a KafkaError, add more context
    if (error instanceof KafkaError && error.details) {
      if (error.details.consumerGroup) {
        dlqHeaders[`${this.options.headerPrefix}consumer-group`] = Buffer.from(error.details.consumerGroup);
      }
      
      if (error.details.correlationId) {
        dlqHeaders[`${this.options.headerPrefix}correlation-id`] = Buffer.from(error.details.correlationId);
      }
    }
    
    // Return the prepared message
    return {
      ...message,
      headers: dlqHeaders
    };
  }

  /**
   * Determines if a message should be sent to the dead letter queue
   * @param error The error that occurred
   * @param retryCount The number of retries attempted
   * @returns True if the message should be sent to DLQ, false otherwise
   */
  public shouldSendToDLQ(error: Error, retryCount: number): boolean {
    // Always send to DLQ if max retries exceeded
    if (retryCount >= this.options.maxRetries) {
      return true;
    }
    
    // For KafkaError, check if it's retryable
    if (error instanceof KafkaError) {
      return !error.isRetryable();
    }
    
    // For other errors, default to sending to DLQ
    return true;
  }

  /**
   * Extracts original message details from a DLQ message
   * @param message The DLQ message
   * @returns The extracted original message details
   */
  public extractOriginalDetails(message: KafkaMessage): {
    originalTopic?: string;
    errorMessage?: string;
    errorType?: string;
    retryCount?: number;
    timestamp?: number;
    consumerGroup?: string;
    correlationId?: string;
  } {
    const headers = message.headers || {};
    const result: ReturnType<typeof this.extractOriginalDetails> = {};
    
    // Extract headers
    if (headers[`${this.options.headerPrefix}original-topic`]) {
      result.originalTopic = headers[`${this.options.headerPrefix}original-topic`].toString();
    }
    
    if (headers[`${this.options.headerPrefix}error-message`]) {
      result.errorMessage = headers[`${this.options.headerPrefix}error-message`].toString();
    }
    
    if (headers[`${this.options.headerPrefix}error-type`]) {
      result.errorType = headers[`${this.options.headerPrefix}error-type`].toString();
    }
    
    if (headers[`${this.options.headerPrefix}retry-count`]) {
      result.retryCount = parseInt(headers[`${this.options.headerPrefix}retry-count`].toString(), 10);
    }
    
    if (headers[`${this.options.headerPrefix}timestamp`]) {
      result.timestamp = parseInt(headers[`${this.options.headerPrefix}timestamp`].toString(), 10);
    }
    
    if (headers[`${this.options.headerPrefix}consumer-group`]) {
      result.consumerGroup = headers[`${this.options.headerPrefix}consumer-group`].toString();
    }
    
    if (headers[`${this.options.headerPrefix}correlation-id`]) {
      result.correlationId = headers[`${this.options.headerPrefix}correlation-id`].toString();
    }
    
    return result;
  }
}

/**
 * Factory function to create a Kafka error from a native Error
 * @param error The original error
 * @param details Additional details about the Kafka operation
 * @returns A properly typed KafkaError instance
 */
export function createKafkaError(error: Error, details: KafkaErrorDetails = {}): KafkaError {
  if (error instanceof KafkaError) {
    return error;
  }
  
  return categorizeKafkaError(error, details);
}

/**
 * Utility to determine if an error is a Kafka-related error
 * @param error The error to check
 * @returns True if the error is Kafka-related, false otherwise
 */
export function isKafkaError(error: Error): error is KafkaError {
  return error instanceof KafkaError;
}

/**
 * Utility to determine if a Kafka error is retryable
 * @param error The error to check
 * @returns True if the error is retryable, false otherwise
 */
export function isRetryableKafkaError(error: Error): boolean {
  if (error instanceof KafkaError) {
    return error.isRetryable();
  }
  
  // For non-Kafka errors, check if it's a network or timeout error
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('network') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('econnreset')
  );
}
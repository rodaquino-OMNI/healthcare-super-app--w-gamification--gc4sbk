/**
 * Retry strategies for Kafka operations.
 * 
 * This module provides various retry strategies for handling Kafka operation failures,
 * including exponential backoff with jitter, fixed backoff, and error-specific retry policies.
 * It integrates with the Kafka error handling system to provide reliable message delivery
 * and processing even under adverse conditions.
 */

import { KafkaErrorCode, DEFAULT_RETRY_CONFIG } from './kafka.constants';
import { KafkaError, RetryError } from './kafka.errors';

/**
 * Enum defining the available retry strategy types.
 */
export enum RetryStrategyType {
  EXPONENTIAL = 'EXPONENTIAL',
  FIXED = 'FIXED',
}

/**
 * Interface for retry strategy configuration.
 */
export interface RetryStrategyConfig {
  type: RetryStrategyType;
  initialRetryTime: number;
  maxRetries: number;
  factor?: number; // Required for EXPONENTIAL strategy
  maxRetryTime?: number; // Optional cap for retry time
  errorFilter?: (error: Error) => boolean; // Optional filter for error-specific strategies
}

/**
 * Interface defining the retry strategy contract.
 */
export interface RetryStrategy {
  /**
   * Gets the next retry time in milliseconds and increments the retry counter.
   * @returns The next retry time in milliseconds.
   * @throws RetryError if no more retries are available.
   */
  getNextRetryTime(): number;
  
  /**
   * Checks if there are any retries left.
   * @returns True if there are retries left, false otherwise.
   */
  hasRetriesLeft(): boolean;
  
  /**
   * Gets the current retry count.
   * @returns The current retry count.
   */
  getRetryCount(): number;
  
  /**
   * Resets the retry counter.
   */
  reset(): void;
  
  /**
   * Checks if this strategy is applicable for the given error.
   * @param error The error to check.
   * @returns True if this strategy is applicable, false otherwise.
   */
  isApplicable(error: Error): boolean;
}

/**
 * Calculates the backoff time for a retry attempt with jitter.
 * 
 * @param initialRetryTime The initial retry time in milliseconds.
 * @param retryAttempt The current retry attempt (0-based).
 * @param factor The exponential factor to apply.
 * @param maxRetryTime The maximum retry time in milliseconds.
 * @returns The calculated backoff time in milliseconds.
 */
export function calculateBackoff(
  initialRetryTime: number,
  retryAttempt: number,
  factor: number,
  maxRetryTime: number
): number {
  // Calculate base backoff time using exponential formula
  const baseBackoff = initialRetryTime * Math.pow(factor, retryAttempt);
  
  // Cap at maxRetryTime
  const cappedBackoff = Math.min(baseBackoff, maxRetryTime);
  
  // Apply jitter to prevent retry storms (±20%)
  const jitterFactor = 0.8 + (Math.random() * 0.4); // Range: 0.8-1.2
  
  // Return the final backoff time with jitter
  return Math.floor(cappedBackoff * jitterFactor);
}

/**
 * Implementation of exponential backoff retry strategy.
 */
class ExponentialBackoffStrategy implements RetryStrategy {
  private retryCount = 0;
  private readonly config: Required<RetryStrategyConfig>;
  
  constructor(config: RetryStrategyConfig) {
    // Ensure required properties are present
    if (config.factor === undefined) {
      throw new Error('factor is required for EXPONENTIAL strategy');
    }
    
    this.config = {
      ...config,
      maxRetryTime: config.maxRetryTime ?? DEFAULT_RETRY_CONFIG.maxRetryTime,
      errorFilter: config.errorFilter ?? (() => true),
    };
  }
  
  getNextRetryTime(): number {
    if (!this.hasRetriesLeft()) {
      throw new RetryError(
        `Maximum retry attempts (${this.config.maxRetries}) exceeded`,
        KafkaErrorCode.RETRY_ERROR,
        { retryCount: this.retryCount, maxRetries: this.config.maxRetries }
      );
    }
    
    const backoff = calculateBackoff(
      this.config.initialRetryTime,
      this.retryCount,
      this.config.factor,
      this.config.maxRetryTime
    );
    
    this.retryCount++;
    return backoff;
  }
  
  hasRetriesLeft(): boolean {
    return this.retryCount < this.config.maxRetries;
  }
  
  getRetryCount(): number {
    return this.retryCount;
  }
  
  reset(): void {
    this.retryCount = 0;
  }
  
  isApplicable(error: Error): boolean {
    return this.config.errorFilter(error);
  }
}

/**
 * Implementation of fixed backoff retry strategy.
 */
class FixedBackoffStrategy implements RetryStrategy {
  private retryCount = 0;
  private readonly config: Required<RetryStrategyConfig>;
  
  constructor(config: RetryStrategyConfig) {
    this.config = {
      ...config,
      factor: 1, // Not used for fixed strategy, but required by interface
      maxRetryTime: config.initialRetryTime, // Not used for fixed strategy
      errorFilter: config.errorFilter ?? (() => true),
    };
  }
  
  getNextRetryTime(): number {
    if (!this.hasRetriesLeft()) {
      throw new RetryError(
        `Maximum retry attempts (${this.config.maxRetries}) exceeded`,
        KafkaErrorCode.RETRY_ERROR,
        { retryCount: this.retryCount, maxRetries: this.config.maxRetries }
      );
    }
    
    // Apply jitter to prevent retry storms (±20%)
    const jitterFactor = 0.8 + (Math.random() * 0.4); // Range: 0.8-1.2
    const backoff = Math.floor(this.config.initialRetryTime * jitterFactor);
    
    this.retryCount++;
    return backoff;
  }
  
  hasRetriesLeft(): boolean {
    return this.retryCount < this.config.maxRetries;
  }
  
  getRetryCount(): number {
    return this.retryCount;
  }
  
  reset(): void {
    this.retryCount = 0;
  }
  
  isApplicable(error: Error): boolean {
    return this.config.errorFilter(error);
  }
}

/**
 * Factory function to create a retry strategy based on the provided configuration.
 * 
 * @param config The retry strategy configuration.
 * @returns A retry strategy instance.
 * @throws Error if the strategy type is unknown.
 */
export function createRetryStrategy(config: RetryStrategyConfig): RetryStrategy {
  switch (config.type) {
    case RetryStrategyType.EXPONENTIAL:
      return new ExponentialBackoffStrategy(config);
    case RetryStrategyType.FIXED:
      return new FixedBackoffStrategy(config);
    default:
      throw new Error(`Unknown retry strategy type: ${config.type}`);
  }
}

/**
 * Determines if an error should be retried based on its type and a custom classifier.
 * 
 * @param error The error to check.
 * @param customClassifier Optional custom function to classify errors as retriable or not.
 * @returns True if the error should be retried, false otherwise.
 */
export function shouldRetry(
  error: Error,
  customClassifier?: (error: Error) => boolean
): boolean {
  // If a custom classifier is provided, use it
  if (customClassifier) {
    return customClassifier(error);
  }
  
  // Default classification for KafkaError instances
  if (error instanceof KafkaError) {
    // List of error codes that are considered retriable
    const retriableErrorCodes = [
      KafkaErrorCode.CONNECTION_ERROR,
      KafkaErrorCode.PRODUCER_CONNECTION_ERROR,
      KafkaErrorCode.CONSUMER_CONNECTION_ERROR,
      KafkaErrorCode.PRODUCER_ERROR,
      KafkaErrorCode.CONSUMER_ERROR,
      KafkaErrorCode.TOPIC_CREATION_ERROR,
      KafkaErrorCode.MESSAGE_DELIVERY_ERROR,
      KafkaErrorCode.SUBSCRIPTION_ERROR,
      KafkaErrorCode.OFFSET_COMMIT_ERROR,
      KafkaErrorCode.GROUP_JOIN_ERROR,
    ];
    
    return retriableErrorCodes.includes(error.code as KafkaErrorCode);
  }
  
  // For non-KafkaError instances, default to not retrying
  return false;
}

/**
 * Enriches a message with retry metadata for sending to a dead letter queue.
 * 
 * @param message The original message.
 * @param error The error that caused the message to be sent to DLQ.
 * @param retryCount The number of retries attempted.
 * @param originalTopic The original topic the message was intended for.
 * @returns The enriched message with DLQ metadata.
 */
export function enrichDlqMessage(
  message: any,
  error: Error,
  retryCount: number,
  originalTopic: string
): any {
  // Create a copy of the message to avoid modifying the original
  const enrichedMessage = { ...message };
  
  // Initialize headers if not present
  enrichedMessage.headers = enrichedMessage.headers || {};
  
  // Add retry metadata as headers
  enrichedMessage.headers['x-retry-count'] = Buffer.from(String(retryCount));
  enrichedMessage.headers['x-original-topic'] = Buffer.from(originalTopic);
  enrichedMessage.headers['x-error-type'] = Buffer.from(error.name);
  enrichedMessage.headers['x-timestamp'] = Buffer.from(String(Date.now()));
  
  // Add error details if it's a KafkaError
  if (error instanceof KafkaError) {
    enrichedMessage.headers['x-error-code'] = Buffer.from(error.code);
    
    // Add error context as JSON if available
    if (error.context && Object.keys(error.context).length > 0) {
      enrichedMessage.headers['x-error-context'] = Buffer.from(
        JSON.stringify(error.context)
      );
    }
  }
  
  return enrichedMessage;
}

/**
 * Creates a retry handler function that manages retries for Kafka operations.
 * 
 * @param operation The async operation to retry.
 * @param strategy The retry strategy to use.
 * @param onRetry Optional callback to execute before each retry.
 * @returns A function that executes the operation with retries.
 */
export function createRetryHandler<T>(
  operation: () => Promise<T>,
  strategy: RetryStrategy,
  onRetry?: (error: Error, retryCount: number, delayMs: number) => void
): () => Promise<T> {
  return async function executeWithRetry(): Promise<T> {
    // Reset the strategy to ensure we start fresh
    strategy.reset();
    
    while (true) {
      try {
        // Attempt the operation
        return await operation();
      } catch (error) {
        // Check if we should retry this error
        if (!(error instanceof Error) || !shouldRetry(error) || !strategy.isApplicable(error) || !strategy.hasRetriesLeft()) {
          // If not retriable or no retries left, rethrow
          throw error;
        }
        
        // Calculate the next retry delay
        const delayMs = strategy.getNextRetryTime();
        
        // Execute the onRetry callback if provided
        if (onRetry) {
          onRetry(error, strategy.getRetryCount(), delayMs);
        }
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  };
}
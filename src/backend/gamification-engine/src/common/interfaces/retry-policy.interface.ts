/**
 * @file retry-policy.interface.ts
 * @description Defines interfaces for configurable retry policies used in the event processing system.
 * Includes interfaces for exponential backoff, maximum retry limits, and retry strategy configuration.
 * This file standardizes retry behavior across the gamification engine, improving reliability and
 * resilience of event processing.
 */

import { KafkaError, KafkaErrorType, RetryInfo } from '../kafka/kafka.types';

/**
 * Interface for retry policy configuration
 * Defines the behavior of retry attempts for failed operations
 */
export interface IRetryPolicy {
  /** Maximum number of retry attempts before giving up */
  maxAttempts: number;
  
  /** Initial delay in milliseconds before the first retry */
  initialDelayMs: number;
  
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  
  /** Backoff strategy to use for calculating delays between retries */
  backoffStrategy: IBackoffStrategy;
  
  /** Types of errors that should be retried */
  retriableErrorTypes?: KafkaErrorType[];
  
  /** Dead letter queue configuration for messages that exhaust retry attempts */
  dlqConfig?: IDLQConfig;
  
  /**
   * Determines if an error should be retried based on the error type and retry information
   * @param error The error that occurred
   * @param retryInfo Current retry information
   * @returns Whether the operation should be retried
   */
  shouldRetry(error: KafkaError, retryInfo: RetryInfo): boolean;
  
  /**
   * Calculates the delay before the next retry attempt
   * @param retryInfo Current retry information
   * @returns Delay in milliseconds before the next retry
   */
  calculateDelay(retryInfo: RetryInfo): number;
}

/**
 * Interface for backoff strategy configuration
 * Defines how the delay between retry attempts increases over time
 */
export interface IBackoffStrategy {
  /**
   * Calculates the delay before the next retry attempt
   * @param attemptCount Current attempt count (starting from 1)
   * @param initialDelayMs Initial delay in milliseconds
   * @param maxDelayMs Maximum delay in milliseconds
   * @returns Delay in milliseconds before the next retry
   */
  calculateDelay(attemptCount: number, initialDelayMs: number, maxDelayMs: number): number;
  
  /**
   * Name of the backoff strategy for identification
   */
  readonly name: BackoffStrategyType;
}

/**
 * Interface for dead letter queue configuration
 * Defines how messages that exhaust retry attempts are handled
 */
export interface IDLQConfig {
  /** Whether to enable the dead letter queue */
  enabled: boolean;
  
  /** Topic name for the dead letter queue */
  topic: string;
  
  /** Whether to include the original message in the DLQ message */
  includeOriginalMessage: boolean;
  
  /** Whether to include error details in the DLQ message */
  includeErrorDetails: boolean;
  
  /** Additional headers to include in the DLQ message */
  additionalHeaders?: Record<string, string>;
  
  /**
   * Custom function to transform the message before sending to DLQ
   * @param message Original message that failed processing
   * @param error Error that caused the failure
   * @param retryInfo Retry information
   * @returns Transformed message for the DLQ
   */
  transformMessage?: <T>(message: T, error: KafkaError, retryInfo: RetryInfo) => any;
}

/**
 * Types of backoff strategies
 */
export enum BackoffStrategyType {
  /** Fixed delay between retries */
  FIXED = 'FIXED',
  
  /** Linear increase in delay between retries */
  LINEAR = 'LINEAR',
  
  /** Exponential increase in delay between retries */
  EXPONENTIAL = 'EXPONENTIAL',
  
  /** Exponential increase with random jitter */
  EXPONENTIAL_WITH_JITTER = 'EXPONENTIAL_WITH_JITTER',
  
  /** Custom backoff strategy */
  CUSTOM = 'CUSTOM'
}

/**
 * Result of a retry decision
 */
export interface IRetryDecision {
  /** Whether to retry the operation */
  shouldRetry: boolean;
  
  /** Delay in milliseconds before the next retry */
  delayMs: number;
  
  /** Updated retry information */
  retryInfo: RetryInfo;
  
  /** Reason for the decision */
  reason: string;
}

/**
 * Interface for retry metrics
 * Provides statistics about retry operations
 */
export interface IRetryMetrics {
  /** Total number of retry attempts */
  totalRetryAttempts: number;
  
  /** Number of successful retries */
  successfulRetries: number;
  
  /** Number of failed retries */
  failedRetries: number;
  
  /** Average delay between retries in milliseconds */
  averageDelayMs: number;
  
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number;
  
  /** Total retry duration in milliseconds */
  totalRetryDurationMs: number;
  
  /** Success rate (0-1) */
  successRate: number;
  
  /** Retry attempts by error type */
  attemptsByErrorType: Record<KafkaErrorType, number>;
  
  /** Successful retries by error type */
  successesByErrorType: Record<KafkaErrorType, number>;
}

/**
 * Interface for retry strategy factory
 * Creates retry strategies for different scenarios
 */
export interface IRetryStrategyFactory {
  /**
   * Creates a retry strategy for a specific event type
   * @param eventType Type of event
   * @param options Configuration options
   * @returns Retry strategy function
   */
  forEventType(eventType: string, options?: Partial<IRetryPolicy>): (error: KafkaError, retryInfo?: RetryInfo) => IRetryDecision;
  
  /**
   * Creates a retry strategy for a specific error type
   * @param errorType Type of error
   * @param options Configuration options
   * @returns Retry strategy function
   */
  forErrorType(errorType: KafkaErrorType, options?: Partial<IRetryPolicy>): (error: KafkaError, retryInfo?: RetryInfo) => IRetryDecision;
  
  /**
   * Default retry strategy
   */
  default: (error: KafkaError, retryInfo?: RetryInfo) => IRetryDecision;
}

/**
 * Interface for exponential backoff strategy
 * Implements exponential increase in delay between retries
 */
export interface IExponentialBackoffStrategy extends IBackoffStrategy {
  /** Factor by which delay increases with each attempt */
  backoffFactor: number;
  
  /** Name of the strategy */
  readonly name: BackoffStrategyType.EXPONENTIAL;
}

/**
 * Interface for exponential backoff with jitter strategy
 * Implements exponential increase with random jitter to prevent thundering herd problems
 */
export interface IExponentialBackoffWithJitterStrategy extends IExponentialBackoffStrategy {
  /** Minimum jitter factor (0-1) */
  minJitterFactor: number;
  
  /** Maximum jitter factor (0-1) */
  maxJitterFactor: number;
  
  /** Name of the strategy */
  readonly name: BackoffStrategyType.EXPONENTIAL_WITH_JITTER;
}

/**
 * Interface for fixed backoff strategy
 * Implements fixed delay between retries
 */
export interface IFixedBackoffStrategy extends IBackoffStrategy {
  /** Name of the strategy */
  readonly name: BackoffStrategyType.FIXED;
}

/**
 * Interface for linear backoff strategy
 * Implements linear increase in delay between retries
 */
export interface ILinearBackoffStrategy extends IBackoffStrategy {
  /** Factor by which delay increases with each attempt */
  incrementFactor: number;
  
  /** Name of the strategy */
  readonly name: BackoffStrategyType.LINEAR;
}

/**
 * Interface for retry context
 * Provides context for retry operations
 */
export interface IRetryContext {
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  
  /** User ID associated with the operation */
  userId?: string;
  
  /** Journey type (health, care, plan) */
  journeyType?: string;
  
  /** Operation being retried */
  operation: string;
  
  /** Additional context data */
  metadata?: Record<string, any>;
}

/**
 * Interface for retry handler
 * Handles retry operations for a specific context
 */
export interface IRetryHandler<T = any, R = any> {
  /**
   * Executes an operation with retry logic
   * @param operation Function to execute
   * @param context Retry context
   * @returns Result of the operation
   * @throws Error if all retry attempts fail
   */
  executeWithRetry(operation: () => Promise<R>, context: IRetryContext): Promise<R>;
  
  /**
   * Handles an error that occurred during an operation
   * @param error Error that occurred
   * @param context Retry context
   * @param retryInfo Current retry information
   * @returns Retry decision
   */
  handleError(error: KafkaError, context: IRetryContext, retryInfo: RetryInfo): Promise<IRetryDecision>;
  
  /**
   * Gets the retry policy for a specific context
   * @param context Retry context
   * @returns Retry policy
   */
  getRetryPolicy(context: IRetryContext): IRetryPolicy;
  
  /**
   * Gets the retry metrics
   * @returns Current retry metrics
   */
  getMetrics(): IRetryMetrics;
}

/**
 * Default retry policy configuration
 */
export const DEFAULT_RETRY_POLICY: IRetryPolicy = {
  maxAttempts: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 1 minute
  backoffStrategy: {
    name: BackoffStrategyType.EXPONENTIAL_WITH_JITTER,
    calculateDelay: (attemptCount, initialDelayMs, maxDelayMs) => {
      // Exponential backoff with jitter: initialDelay * 2^(attemptCount-1) * (0.5 + random(0, 0.5))
      const exponentialDelay = initialDelayMs * Math.pow(2, attemptCount - 1);
      const jitter = 0.5 + Math.random() * 0.5;
      const delay = exponentialDelay * jitter;
      
      // Cap at maximum delay
      return Math.min(delay, maxDelayMs);
    }
  },
  retriableErrorTypes: [
    KafkaErrorType.RETRIABLE,
    KafkaErrorType.CONNECTION,
    KafkaErrorType.PROCESSING
  ],
  dlqConfig: {
    enabled: true,
    topic: 'dlq',
    includeOriginalMessage: true,
    includeErrorDetails: true
  },
  shouldRetry: (error, retryInfo) => {
    // Don't retry if the error is not retriable
    if (!error.retriable) {
      return false;
    }
    
    // Don't retry if we've reached the maximum number of attempts
    if (retryInfo.attemptCount >= retryInfo.maxAttempts) {
      return false;
    }
    
    return true;
  },
  calculateDelay: (retryInfo) => {
    const attemptCount = retryInfo.attemptCount + 1;
    return DEFAULT_RETRY_POLICY.backoffStrategy.calculateDelay(
      attemptCount,
      DEFAULT_RETRY_POLICY.initialDelayMs,
      DEFAULT_RETRY_POLICY.maxDelayMs
    );
  }
};

/**
 * Journey-specific retry policies
 */
export const JOURNEY_RETRY_POLICIES: Record<string, Partial<IRetryPolicy>> = {
  health: {
    // Health journey might need more aggressive retries for critical health data
    maxAttempts: 7,
    initialDelayMs: 500 // Start retries faster
  },
  care: {
    // Care journey might need moderate retries
    maxAttempts: 5,
    initialDelayMs: 1000
  },
  plan: {
    // Plan journey can be more conservative with retries
    maxAttempts: 3,
    initialDelayMs: 2000
  }
};
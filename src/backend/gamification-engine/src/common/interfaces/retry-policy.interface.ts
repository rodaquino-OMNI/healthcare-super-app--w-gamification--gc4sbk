/**
 * @file retry-policy.interface.ts
 * @description Defines interfaces for configurable retry policies used in the event processing system.
 * Includes interfaces for exponential backoff, maximum retry limits, and retry strategy configuration.
 * This file standardizes retry behavior across the gamification engine, improving reliability and
 * resilience of event processing.
 */

/**
 * Represents the current state of a retry attempt
 */
export interface IRetryAttempt {
  /** The number of times the operation has been attempted */
  attemptNumber: number;
  
  /** The original error that caused the retry */
  error: Error;
  
  /** Timestamp when the first attempt was made */
  firstAttemptTimestamp: number;
  
  /** Timestamp when the last attempt was made */
  lastAttemptTimestamp: number;
  
  /** The context data associated with the retry attempt */
  context?: Record<string, any>;
}

/**
 * Defines the configuration for a dead letter queue (DLQ)
 */
export interface IDLQConfig {
  /** Whether to enable the dead letter queue */
  enabled: boolean;
  
  /** The topic name for the dead letter queue */
  topic: string;
  
  /** Optional partition key for the DLQ message */
  partitionKey?: string;
  
  /** Whether to include the original message payload in the DLQ message */
  includeOriginalMessage: boolean;
  
  /** Additional headers to include in the DLQ message */
  additionalHeaders?: Record<string, string>;
}

/**
 * Defines the strategy for calculating backoff delays between retry attempts
 */
export interface IBackoffStrategy {
  /**
   * Calculates the delay in milliseconds before the next retry attempt
   * @param attempt The current retry attempt information
   * @returns The delay in milliseconds before the next retry attempt
   */
  calculateDelay(attempt: IRetryAttempt): number;
  
  /**
   * Gets the maximum delay this strategy will produce
   * @returns The maximum delay in milliseconds
   */
  getMaxDelay(): number;
}

/**
 * Configuration for exponential backoff strategy
 */
export interface IExponentialBackoffConfig {
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  
  /** Exponential factor to multiply the delay by on each attempt */
  factor: number;
  
  /** Whether to add jitter (randomness) to the delay to prevent thundering herd problems */
  jitter: boolean;
  
  /** Maximum jitter percentage (0-1) to apply to the delay */
  jitterFactor?: number;
}

/**
 * Defines a predicate function that determines if a retry should be attempted
 */
export type RetryPredicate = (error: Error, attempt: IRetryAttempt) => boolean | Promise<boolean>;

/**
 * Defines a function that is called before each retry attempt
 */
export type OnRetryCallback = (attempt: IRetryAttempt) => void | Promise<void>;

/**
 * Defines a function that is called when all retry attempts have been exhausted
 */
export type OnRetryExhaustedCallback = (attempt: IRetryAttempt) => void | Promise<void>;

/**
 * Main interface for configurable retry policies
 */
export interface IRetryPolicy {
  /**
   * The maximum number of retry attempts
   */
  maxAttempts: number;
  
  /**
   * The backoff strategy to use for calculating delays between retry attempts
   */
  backoffStrategy: IBackoffStrategy;
  
  /**
   * A predicate function that determines if a retry should be attempted for a given error
   */
  retryPredicate: RetryPredicate;
  
  /**
   * Configuration for the dead letter queue where messages are sent after all retry attempts are exhausted
   */
  dlqConfig?: IDLQConfig;
  
  /**
   * Callback function that is called before each retry attempt
   */
  onRetry?: OnRetryCallback;
  
  /**
   * Callback function that is called when all retry attempts have been exhausted
   */
  onRetryExhausted?: OnRetryExhaustedCallback;
  
  /**
   * Whether to track and include retry attempt metadata in messages
   */
  includeMetadata?: boolean;
}

/**
 * Utility type for retry attempt tracking
 */
export interface IRetryMetadata {
  /** The number of times the operation has been attempted */
  attemptCount: number;
  
  /** Timestamp when the first attempt was made */
  firstAttemptAt: number;
  
  /** Timestamp when the last attempt was made */
  lastAttemptAt: number;
  
  /** The delay that was applied before this attempt */
  lastDelayMs?: number;
  
  /** Error information from the last failed attempt */
  lastError?: {
    /** Error message */
    message: string;
    
    /** Error name/type */
    name: string;
    
    /** Error stack trace (if available) */
    stack?: string;
    
    /** Error code (if available) */
    code?: string;
  };
}

/**
 * Configuration for creating a retry policy
 */
export interface IRetryPolicyConfig {
  /** The maximum number of retry attempts */
  maxAttempts?: number;
  
  /** Configuration for exponential backoff */
  backoff?: IExponentialBackoffConfig;
  
  /** Configuration for the dead letter queue */
  dlq?: IDLQConfig;
  
  /** Whether to retry on all errors (true) or only on specific errors defined by retryableErrors */
  retryOnAllErrors?: boolean;
  
  /** List of error types that should trigger a retry */
  retryableErrors?: string[];
  
  /** Whether to track and include retry attempt metadata */
  includeMetadata?: boolean;
  
  /** Callback function that is called before each retry attempt */
  onRetry?: OnRetryCallback;
  
  /** Callback function that is called when all retry attempts have been exhausted */
  onRetryExhausted?: OnRetryExhaustedCallback;
}

/**
 * Result of a retry operation
 */
export interface IRetryResult<T> {
  /** Whether the operation was successful */
  success: boolean;
  
  /** The result of the operation (if successful) */
  result?: T;
  
  /** The error that caused the operation to fail (if unsuccessful) */
  error?: Error;
  
  /** Metadata about the retry attempts */
  metadata: IRetryMetadata;
}
import { Injectable } from '@nestjs/common';

/**
 * @file retry-policies.ts
 * @description Implements configurable retry policies for event processing failures, including
 * exponential backoff, constant interval, and custom strategies. Each policy determines retry
 * behavior based on error type, event context, and failure count.
 */

/**
 * Enum representing different types of errors that can occur during event processing.
 * Used to determine appropriate retry strategies.
 */
export enum EventErrorType {
  /** Temporary issues that are likely to be resolved by retrying */
  TRANSIENT = 'TRANSIENT',
  /** Issues with the client request that won't be resolved by retrying */
  CLIENT = 'CLIENT',
  /** Internal system issues that may require intervention */
  SYSTEM = 'SYSTEM',
  /** Issues with external dependencies or services */
  EXTERNAL = 'EXTERNAL',
  /** Issues with database operations */
  DATABASE = 'DATABASE',
  /** Issues with event processing logic */
  PROCESSING = 'PROCESSING',
  /** Issues with event validation */
  VALIDATION = 'VALIDATION',
  /** Issues with event schema */
  SCHEMA = 'SCHEMA',
  /** Network-related issues */
  NETWORK = 'NETWORK',
  /** Unknown or unclassified errors */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Metadata for each error type to guide retry behavior and error handling.
 */
export interface ErrorTypeMetadata {
  /** Whether this error type should be automatically retried */
  isRetryable: boolean;
  /** Maximum number of retry attempts recommended for this error type */
  recommendedMaxRetries: number;
  /** Whether to use exponential backoff for retries */
  useExponentialBackoff: boolean;
  /** Whether to apply circuit breaker pattern */
  applyCircuitBreaker: boolean;
  /** Description of the error type */
  description: string;
}

/**
 * Metadata for each error type to guide retry behavior and error handling.
 */
export const ERROR_TYPE_METADATA: Record<EventErrorType, ErrorTypeMetadata> = {
  [EventErrorType.TRANSIENT]: {
    isRetryable: true,
    recommendedMaxRetries: 5,
    useExponentialBackoff: true,
    applyCircuitBreaker: false,
    description: 'Temporary error that may resolve with retry'
  },
  [EventErrorType.CLIENT]: {
    isRetryable: false,
    recommendedMaxRetries: 0,
    useExponentialBackoff: false,
    applyCircuitBreaker: false,
    description: 'Client-side error that will not resolve with retry'
  },
  [EventErrorType.SYSTEM]: {
    isRetryable: true,
    recommendedMaxRetries: 3,
    useExponentialBackoff: true,
    applyCircuitBreaker: true,
    description: 'Internal system error that may require intervention'
  },
  [EventErrorType.EXTERNAL]: {
    isRetryable: true,
    recommendedMaxRetries: 4,
    useExponentialBackoff: true,
    applyCircuitBreaker: true,
    description: 'External dependency error that may resolve with retry or require fallback'
  },
  [EventErrorType.DATABASE]: {
    isRetryable: true,
    recommendedMaxRetries: 3,
    useExponentialBackoff: true,
    applyCircuitBreaker: true,
    description: 'Database error that may resolve with retry'
  },
  [EventErrorType.PROCESSING]: {
    isRetryable: true,
    recommendedMaxRetries: 2,
    useExponentialBackoff: true,
    applyCircuitBreaker: false,
    description: 'Event processing error that may resolve with retry'
  },
  [EventErrorType.VALIDATION]: {
    isRetryable: false,
    recommendedMaxRetries: 0,
    useExponentialBackoff: false,
    applyCircuitBreaker: false,
    description: 'Event validation error that will not resolve with retry'
  },
  [EventErrorType.SCHEMA]: {
    isRetryable: false,
    recommendedMaxRetries: 0,
    useExponentialBackoff: false,
    applyCircuitBreaker: false,
    description: 'Event schema error that will not resolve with retry'
  },
  [EventErrorType.NETWORK]: {
    isRetryable: true,
    recommendedMaxRetries: 5,
    useExponentialBackoff: true,
    applyCircuitBreaker: true,
    description: 'Network error that may resolve with retry'
  },
  [EventErrorType.UNKNOWN]: {
    isRetryable: true,
    recommendedMaxRetries: 3,
    useExponentialBackoff: true,
    applyCircuitBreaker: false,
    description: 'Unknown error that may resolve with retry'
  }
};

/**
 * Helper function to determine if an error should be retried based on its type.
 * 
 * @param errorType The type of error to check
 * @returns True if the error type is retryable, false otherwise
 */
export function isRetryableErrorType(errorType: EventErrorType): boolean {
  return ERROR_TYPE_METADATA[errorType].isRetryable;
}

/**
 * Helper function to get the recommended maximum number of retry attempts for an error type.
 * 
 * @param errorType The type of error to check
 * @returns The recommended maximum number of retry attempts
 */
export function getRecommendedMaxRetries(errorType: EventErrorType): number {
  return ERROR_TYPE_METADATA[errorType].recommendedMaxRetries;
}

/**
 * Enum representing the current status of a retry operation.
 */
export enum RetryStatus {
  /** The operation is scheduled for retry */
  PENDING = 'PENDING',
  /** The operation is currently being retried */
  IN_PROGRESS = 'IN_PROGRESS',
  /** The operation was successfully retried */
  SUCCEEDED = 'SUCCEEDED',
  /** The operation failed but will be retried */
  FAILED = 'FAILED',
  /** The operation failed and has exhausted all retry attempts */
  EXHAUSTED = 'EXHAUSTED'
}

/**
 * Base interface for retry options that are common across all retry policies.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts before giving up and potentially
   * moving the operation to a dead-letter queue.
   */
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry attempt.
   */
  initialDelay: number;

  /**
   * Maximum delay in milliseconds between retry attempts.
   * This caps the delay for exponential backoff strategies to prevent
   * excessively long waits.
   */
  maxDelay?: number;

  /**
   * Whether to add random jitter to the delay to prevent thundering herd problems.
   * When multiple operations fail at the same time, jitter helps distribute
   * retry attempts over time.
   */
  jitter?: boolean;

  /**
   * The amount of jitter to apply, as a factor of the calculated delay.
   * For example, a value of 0.2 means the actual delay will be between
   * 80% and 120% of the calculated delay.
   */
  jitterFactor?: number;

  /**
   * Timeout in milliseconds for the operation before it's considered failed.
   * This is used to determine when a request should be aborted and retried.
   */
  timeout?: number;

  /**
   * List of error types that should be retried.
   * If not specified, all retryable errors will be considered.
   */
  retryableErrors?: EventErrorType[];

  /**
   * List of error types that should not be retried.
   * These errors will immediately fail the operation without retry.
   */
  nonRetryableErrors?: EventErrorType[];

  /**
   * Journey-specific configuration to apply different retry
   * strategies based on the journey context (health, care, plan).
   */
  journeySpecific?: {
    [journey: string]: Partial<RetryOptions>;
  };
}

/**
 * Options specific to the fixed interval retry policy.
 * This policy uses the same delay between each retry attempt.
 */
export interface FixedIntervalRetryOptions extends RetryOptions {
  /**
   * The fixed delay in milliseconds between retry attempts.
   * This overrides the initialDelay for all attempts after the first.
   * 
   * Note: If not specified, initialDelay will be used as the fixed delay.
   */
  delay?: number;
}

/**
 * Options specific to the exponential backoff retry policy.
 * This policy increases the delay exponentially between retry attempts.
 */
export interface ExponentialBackoffRetryOptions extends RetryOptions {
  /**
   * The base multiplier for the exponential calculation.
   * The delay is calculated as: initialDelay * (backoffFactor ^ attemptNumber)
   * Default is 2, which doubles the delay with each attempt.
   */
  backoffFactor: number;

  /**
   * Whether to use full jitter, which randomizes the entire delay value
   * rather than just adding a small random factor.
   * Full jitter is more effective at preventing thundering herd problems
   * but results in less predictable retry timing.
   */
  useFullJitter?: boolean;
}

/**
 * Interface for error information captured during a failed operation.
 * This provides structured error data for analysis and retry decision-making.
 */
export interface RetryableOperationError {
  /** Error message */
  message: string;
  
  /** Error code or name */
  code?: string;
  
  /** Stack trace if available */
  stack?: string;
  
  /** Classification of the error type */
  type: EventErrorType;
  
  /** Whether this error is considered retryable */
  isRetryable: boolean;
  
  /** Timestamp when the error occurred */
  timestamp: Date;
  
  /** Additional error context */
  context?: Record<string, any>;
  
  /** The underlying error object if available */
  originalError?: Error;
}

/**
 * Interface for metadata about a retryable operation.
 * This information is used to make decisions about retry behavior.
 */
export interface RetryableOperationMetadata {
  /** Unique identifier for the operation */
  operationId: string;
  
  /** Type of operation (e.g., 'process-event', 'send-notification', etc.) */
  operationType: string;
  
  /** Event type being processed */
  eventType?: string;
  
  /** User ID associated with the operation */
  userId?: string;
  
  /** Journey context (e.g., 'health', 'care', 'plan') */
  journeyContext?: string;
  
  /** Priority level of the operation */
  priority?: 'high' | 'medium' | 'low';
  
  /** Maximum number of retry attempts for this operation */
  maxRetries?: number;
  
  /** Current retry attempt number (0 for first attempt) */
  currentAttempt: number;
  
  /** Timestamp when the operation was first attempted */
  firstAttemptAt: Date;
  
  /** Timestamp when the operation was last attempted */
  lastAttemptAt?: Date;
  
  /** Timestamp when the next retry should be attempted */
  nextAttemptAt?: Date;
  
  /** Current status of the retry operation */
  status: RetryStatus;
  
  /** Additional context information for the operation */
  context?: Record<string, any>;
}

/**
 * Interface defining the contract for retry policies.
 * 
 * Retry policies determine when and how to retry failed operations based on
 * configurable strategies such as fixed delay or exponential backoff.
 */
export interface RetryPolicy {
  /**
   * Gets the unique name of this retry policy for identification and logging.
   * 
   * @returns The name of the retry policy
   */
  getName(): string;

  /**
   * Calculates the timestamp for the next retry attempt based on the current
   * attempt number and policy configuration.
   * 
   * @param currentAttempt - The current retry attempt number (0-based, where 0 is the initial attempt)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns Date object representing when the next retry should be attempted
   */
  calculateNextRetryTime(
    currentAttempt: number,
    options: RetryOptions,
    metadata?: RetryableOperationMetadata
  ): Date;

  /**
   * Determines whether a retry should be attempted based on the error information,
   * current attempt count, and retry options.
   * 
   * @param error - Information about the error that occurred
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(
    error: RetryableOperationError | Error,
    currentAttempt: number,
    options: RetryOptions,
    metadata?: RetryableOperationMetadata
  ): boolean;

  /**
   * Determines if this policy is applicable for the given error type.
   * This allows for error-specific policy selection in composite policies.
   * 
   * @param errorType - The type of error to check
   * @param context - Additional context that might influence applicability
   * @returns True if this policy should handle the given error type, false otherwise
   */
  isApplicableForErrorType(
    errorType: EventErrorType,
    context?: Record<string, any>
  ): boolean;

  /**
   * Calculates the delay in milliseconds until the next retry attempt.
   * 
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateDelayMs(
    currentAttempt: number,
    options: RetryOptions,
    metadata?: RetryableOperationMetadata
  ): number;
}

/**
 * Implementation of a retry policy with a constant time interval between retry attempts.
 * This policy applies the same delay duration for each retry regardless of the attempt count.
 */
export class FixedIntervalPolicy implements RetryPolicy {
  private readonly DEFAULT_OPTIONS: FixedIntervalRetryOptions = {
    maxRetries: 3,
    initialDelay: 5000, // 5 seconds
    jitter: true,
    jitterFactor: 0.2 // 20% jitter
  };

  /**
   * Gets the name of this retry policy.
   * 
   * @returns The policy name
   */
  getName(): string {
    return 'fixed-interval';
  }

  /**
   * Calculates the timestamp for the next retry attempt.
   * 
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns Date object representing when the next retry should be attempted
   */
  calculateNextRetryTime(
    currentAttempt: number,
    options: Partial<FixedIntervalRetryOptions> = {},
    metadata?: RetryableOperationMetadata
  ): Date {
    const delayMs = this.calculateDelayMs(currentAttempt, options, metadata);
    return new Date(Date.now() + delayMs);
  }

  /**
   * Calculates the delay in milliseconds until the next retry attempt.
   * 
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateDelayMs(
    currentAttempt: number,
    options: Partial<FixedIntervalRetryOptions> = {},
    metadata?: RetryableOperationMetadata
  ): number {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Use the specified delay or fall back to initialDelay
    let delay = mergedOptions.delay || mergedOptions.initialDelay;
    
    // Apply journey-specific configuration if available
    if (metadata?.journeyContext && mergedOptions.journeySpecific?.[metadata.journeyContext]) {
      const journeyOptions = mergedOptions.journeySpecific[metadata.journeyContext];
      delay = journeyOptions.delay || journeyOptions.initialDelay || delay;
    }
    
    // Apply jitter if enabled
    if (mergedOptions.jitter) {
      const jitterFactor = mergedOptions.jitterFactor || 0.2; // Default to 20% jitter
      const jitterRange = delay * jitterFactor;
      // Random value between -jitterRange and +jitterRange
      const jitterAmount = (Math.random() * 2 - 1) * jitterRange;
      delay = Math.max(1, delay + jitterAmount);
    }
    
    return Math.round(delay);
  }

  /**
   * Determines whether a retry should be attempted.
   * 
   * @param error - Information about the error that occurred
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(
    error: RetryableOperationError | Error,
    currentAttempt: number,
    options: Partial<FixedIntervalRetryOptions> = {},
    metadata?: RetryableOperationMetadata
  ): boolean {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Apply journey-specific configuration if available
    if (metadata?.journeyContext && mergedOptions.journeySpecific?.[metadata.journeyContext]) {
      const journeyOptions = mergedOptions.journeySpecific[metadata.journeyContext];
      if (journeyOptions.maxRetries !== undefined) {
        mergedOptions.maxRetries = journeyOptions.maxRetries;
      }
    }
    
    // Check if maximum retry attempts have been reached
    if (currentAttempt >= mergedOptions.maxRetries) {
      return false;
    }

    // If we have a RetryableOperationError, use its isRetryable property
    if ('isRetryable' in error && 'type' in error) {
      const typedError = error as RetryableOperationError;
      
      // Check if error type is in the non-retryable list
      if (mergedOptions.nonRetryableErrors?.includes(typedError.type)) {
        return false;
      }
      
      // Check if error type is in the retryable list (if specified)
      if (mergedOptions.retryableErrors && !mergedOptions.retryableErrors.includes(typedError.type)) {
        return false;
      }
      
      return typedError.isRetryable;
    }
    
    // For regular Error objects, classify and check if retryable
    const errorType = classifyError(error);
    
    // Check if error type is in the non-retryable list
    if (mergedOptions.nonRetryableErrors?.includes(errorType)) {
      return false;
    }
    
    // Check if error type is in the retryable list (if specified)
    if (mergedOptions.retryableErrors && !mergedOptions.retryableErrors.includes(errorType)) {
      return false;
    }
    
    return isRetryableErrorType(errorType);
  }

  /**
   * Determines if this policy is applicable for the given error type.
   * 
   * @param errorType - The type of error to check
   * @param context - Additional context that might influence applicability
   * @returns True if this policy should handle the given error type, false otherwise
   */
  isApplicableForErrorType(
    errorType: EventErrorType,
    context?: Record<string, any>
  ): boolean {
    // Fixed interval is good for rate limiting and predictable retries
    return [
      EventErrorType.EXTERNAL,
      EventErrorType.PROCESSING
    ].includes(errorType);
  }
}

/**
 * Implementation of a retry policy with exponentially increasing delays between retry attempts.
 * This policy calculates delays that grow exponentially with each successive retry.
 */
export class ExponentialBackoffPolicy implements RetryPolicy {
  private readonly DEFAULT_OPTIONS: ExponentialBackoffRetryOptions = {
    maxRetries: 5,
    initialDelay: 1000, // 1 second
    maxDelay: 60000,    // 1 minute
    backoffFactor: 2,   // Double the delay each time
    jitter: true,
    jitterFactor: 0.2,  // 20% jitter
    useFullJitter: false
  };

  /**
   * Gets the name of this retry policy.
   * 
   * @returns The policy name
   */
  getName(): string {
    return 'exponential-backoff';
  }

  /**
   * Calculates the timestamp for the next retry attempt.
   * 
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns Date object representing when the next retry should be attempted
   */
  calculateNextRetryTime(
    currentAttempt: number,
    options: Partial<ExponentialBackoffRetryOptions> = {},
    metadata?: RetryableOperationMetadata
  ): Date {
    const delayMs = this.calculateDelayMs(currentAttempt, options, metadata);
    return new Date(Date.now() + delayMs);
  }

  /**
   * Calculates the delay in milliseconds until the next retry attempt.
   * 
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateDelayMs(
    currentAttempt: number,
    options: Partial<ExponentialBackoffRetryOptions> = {},
    metadata?: RetryableOperationMetadata
  ): number {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Apply journey-specific configuration if available
    if (metadata?.journeyContext && mergedOptions.journeySpecific?.[metadata.journeyContext]) {
      const journeyOptions = mergedOptions.journeySpecific[metadata.journeyContext];
      Object.assign(mergedOptions, journeyOptions);
    }
    
    // Calculate exponential delay: initialDelay * (backoffFactor ^ currentAttempt)
    let delay = mergedOptions.initialDelay * Math.pow(
      mergedOptions.backoffFactor,
      currentAttempt
    );
    
    // Apply maximum delay cap
    if (mergedOptions.maxDelay) {
      delay = Math.min(delay, mergedOptions.maxDelay);
    }
    
    // Apply full jitter if enabled (completely randomizes the delay between 0 and calculated delay)
    if (mergedOptions.jitter && mergedOptions.useFullJitter) {
      delay = Math.random() * delay;
    }
    // Apply regular jitter if enabled (adds or subtracts a percentage of the delay)
    else if (mergedOptions.jitter) {
      const jitterFactor = mergedOptions.jitterFactor || 0.2; // Default to 20% jitter
      const jitterRange = delay * jitterFactor;
      // Random value between -jitterRange and +jitterRange
      const jitterAmount = (Math.random() * 2 - 1) * jitterRange;
      delay = Math.max(mergedOptions.initialDelay * 0.5, delay + jitterAmount);
    }
    
    return Math.round(delay);
  }

  /**
   * Determines whether a retry should be attempted.
   * 
   * @param error - Information about the error that occurred
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(
    error: RetryableOperationError | Error,
    currentAttempt: number,
    options: Partial<ExponentialBackoffRetryOptions> = {},
    metadata?: RetryableOperationMetadata
  ): boolean {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Apply journey-specific configuration if available
    if (metadata?.journeyContext && mergedOptions.journeySpecific?.[metadata.journeyContext]) {
      const journeyOptions = mergedOptions.journeySpecific[metadata.journeyContext];
      if (journeyOptions.maxRetries !== undefined) {
        mergedOptions.maxRetries = journeyOptions.maxRetries;
      }
      if (journeyOptions.retryableErrors) {
        mergedOptions.retryableErrors = journeyOptions.retryableErrors;
      }
      if (journeyOptions.nonRetryableErrors) {
        mergedOptions.nonRetryableErrors = journeyOptions.nonRetryableErrors;
      }
    }
    
    // Check if maximum retry attempts have been reached
    if (currentAttempt >= mergedOptions.maxRetries) {
      return false;
    }

    // If we have a RetryableOperationError, use its isRetryable property
    if ('isRetryable' in error && 'type' in error) {
      const typedError = error as RetryableOperationError;
      
      // Check if error type is in the non-retryable list
      if (mergedOptions.nonRetryableErrors?.includes(typedError.type)) {
        return false;
      }
      
      // Check if error type is in the retryable list (if specified)
      if (mergedOptions.retryableErrors && !mergedOptions.retryableErrors.includes(typedError.type)) {
        return false;
      }
      
      return typedError.isRetryable;
    }
    
    // For regular Error objects, classify and check if retryable
    const errorType = classifyError(error);
    
    // Check if error type is in the non-retryable list
    if (mergedOptions.nonRetryableErrors?.includes(errorType)) {
      return false;
    }
    
    // Check if error type is in the retryable list (if specified)
    if (mergedOptions.retryableErrors && !mergedOptions.retryableErrors.includes(errorType)) {
      return false;
    }
    
    return isRetryableErrorType(errorType);
  }

  /**
   * Determines if this policy is applicable for the given error type.
   * 
   * @param errorType - The type of error to check
   * @param context - Additional context that might influence applicability
   * @returns True if this policy should handle the given error type, false otherwise
   */
  isApplicableForErrorType(
    errorType: EventErrorType,
    context?: Record<string, any>
  ): boolean {
    // Exponential backoff is good for transient errors and network issues
    return [
      EventErrorType.TRANSIENT,
      EventErrorType.NETWORK,
      EventErrorType.DATABASE,
      EventErrorType.SYSTEM,
      EventErrorType.UNKNOWN
    ].includes(errorType);
  }
}

/**
 * A composite retry policy that can combine multiple retry policies and select
 * between them based on error types or other conditions.
 */
export class CompositePolicy implements RetryPolicy {
  private policies: Map<EventErrorType, RetryPolicy> = new Map();
  private defaultPolicy: RetryPolicy;

  /**
   * Creates an instance of CompositePolicy.
   * 
   * @param defaultPolicy - The default policy to use when no specific policy matches
   */
  constructor(defaultPolicy?: RetryPolicy) {
    this.defaultPolicy = defaultPolicy || new ExponentialBackoffPolicy();
  }

  /**
   * Gets the name of this retry policy.
   * 
   * @returns The policy name
   */
  getName(): string {
    return 'composite';
  }

  /**
   * Adds a policy for a specific error type.
   * 
   * @param errorType - The error type this policy should handle
   * @param policy - The policy to use for this error type
   * @returns This CompositePolicy instance for method chaining
   */
  addPolicy(errorType: EventErrorType, policy: RetryPolicy): CompositePolicy {
    this.policies.set(errorType, policy);
    return this;
  }

  /**
   * Sets the default policy to use when no specific policy matches.
   * 
   * @param policy - The default policy
   * @returns This CompositePolicy instance for method chaining
   */
  setDefaultPolicy(policy: RetryPolicy): CompositePolicy {
    this.defaultPolicy = policy;
    return this;
  }

  /**
   * Gets the appropriate policy for the given error.
   * 
   * @param error - The error to get a policy for
   * @returns The appropriate retry policy
   * @private
   */
  private getPolicyForError(error: RetryableOperationError | Error): RetryPolicy {
    // If we have a RetryableOperationError, use its type
    if ('type' in error) {
      const typedError = error as RetryableOperationError;
      const policy = this.policies.get(typedError.type);
      if (policy) {
        return policy;
      }
    }
    
    // For regular Error objects, classify and find matching policy
    const errorType = classifyError(error);
    const policy = this.policies.get(errorType);
    
    return policy || this.defaultPolicy;
  }

  /**
   * Calculates the timestamp for the next retry attempt.
   * 
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns Date object representing when the next retry should be attempted
   */
  calculateNextRetryTime(
    currentAttempt: number,
    options: RetryOptions,
    metadata?: RetryableOperationMetadata
  ): Date {
    // Use the default policy for calculating retry time
    // This is a simplification - in a real implementation, we might want to
    // use the policy for the most recent error
    return this.defaultPolicy.calculateNextRetryTime(currentAttempt, options, metadata);
  }

  /**
   * Calculates the delay in milliseconds until the next retry attempt.
   * 
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateDelayMs(
    currentAttempt: number,
    options: RetryOptions,
    metadata?: RetryableOperationMetadata
  ): number {
    // Use the default policy for calculating delay
    return this.defaultPolicy.calculateDelayMs(currentAttempt, options, metadata);
  }

  /**
   * Determines whether a retry should be attempted.
   * 
   * @param error - Information about the error that occurred
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(
    error: RetryableOperationError | Error,
    currentAttempt: number,
    options: RetryOptions,
    metadata?: RetryableOperationMetadata
  ): boolean {
    const policy = this.getPolicyForError(error);
    return policy.shouldRetry(error, currentAttempt, options, metadata);
  }

  /**
   * Determines if this policy is applicable for the given error type.
   * 
   * @param errorType - The type of error to check
   * @param context - Additional context that might influence applicability
   * @returns True if this policy should handle the given error type, false otherwise
   */
  isApplicableForErrorType(
    errorType: EventErrorType,
    context?: Record<string, any>
  ): boolean {
    // Composite policy can handle any error type
    return true;
  }
}

/**
 * Factory functions for creating retry policies for different scenarios.
 */
export class RetryPolicyFactory {
  /**
   * Creates a default retry policy for general use.
   * 
   * @returns A default retry policy
   */
  static createDefaultPolicy(): RetryPolicy {
    return new ExponentialBackoffPolicy();
  }

  /**
   * Creates a retry policy optimized for network operations.
   * 
   * @returns A retry policy for network operations
   */
  static createNetworkPolicy(): RetryPolicy {
    return new ExponentialBackoffPolicy();
  }

  /**
   * Creates a retry policy optimized for database operations.
   * 
   * @returns A retry policy for database operations
   */
  static createDatabasePolicy(): RetryPolicy {
    const policy = new ExponentialBackoffPolicy();
    return policy;
  }

  /**
   * Creates a retry policy optimized for event processing operations.
   * 
   * @returns A retry policy for event processing
   */
  static createEventProcessingPolicy(): RetryPolicy {
    return new ExponentialBackoffPolicy();
  }

  /**
   * Creates a retry policy for a specific journey.
   * 
   * @param journey - The journey context (health, care, plan)
   * @returns A retry policy optimized for the specified journey
   */
  static createJourneyPolicy(journey: string): RetryPolicy {
    const composite = new CompositePolicy();
    
    // Add journey-specific policies
    switch (journey) {
      case 'health':
        // Health journey might have more retries for device synchronization
        composite.addPolicy(EventErrorType.NETWORK, new ExponentialBackoffPolicy())
                .addPolicy(EventErrorType.EXTERNAL, new FixedIntervalPolicy());
        break;
      case 'care':
        // Care journey might need careful handling of appointment booking
        composite.addPolicy(EventErrorType.DATABASE, new ExponentialBackoffPolicy())
                .addPolicy(EventErrorType.PROCESSING, new FixedIntervalPolicy());
        break;
      case 'plan':
        // Plan journey might need special handling for claim submissions
        composite.addPolicy(EventErrorType.EXTERNAL, new ExponentialBackoffPolicy())
                .addPolicy(EventErrorType.PROCESSING, new FixedIntervalPolicy());
        break;
      default:
        // Default to exponential backoff for unknown journeys
        return new ExponentialBackoffPolicy();
    }
    
    return composite;
  }

  /**
   * Creates a comprehensive retry policy that handles all error types appropriately.
   * 
   * @returns A comprehensive retry policy
   */
  static createComprehensivePolicy(): RetryPolicy {
    const composite = new CompositePolicy(new ExponentialBackoffPolicy());
    
    // Add specific policies for different error types
    composite.addPolicy(EventErrorType.NETWORK, new ExponentialBackoffPolicy())
             .addPolicy(EventErrorType.DATABASE, new ExponentialBackoffPolicy())
             .addPolicy(EventErrorType.EXTERNAL, new ExponentialBackoffPolicy())
             .addPolicy(EventErrorType.PROCESSING, new FixedIntervalPolicy())
             .addPolicy(EventErrorType.TRANSIENT, new ExponentialBackoffPolicy());
    
    return composite;
  }
}

/**
 * Default retry options for different event types.
 */
export const DEFAULT_RETRY_OPTIONS: Record<string, RetryOptions> = {
  'default': {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 60000,    // 1 minute
    jitter: true,
    jitterFactor: 0.2
  },
  'network': {
    maxRetries: 5,
    initialDelay: 1000, // 1 second
    maxDelay: 60000,    // 1 minute
    jitter: true,
    jitterFactor: 0.2,
    retryableErrors: [
      EventErrorType.NETWORK,
      EventErrorType.TRANSIENT,
      EventErrorType.EXTERNAL
    ]
  },
  'database': {
    maxRetries: 3,
    initialDelay: 500,  // 500 ms
    maxDelay: 10000,    // 10 seconds
    jitter: true,
    jitterFactor: 0.1,
    retryableErrors: [
      EventErrorType.DATABASE,
      EventErrorType.TRANSIENT
    ]
  },
  'processing': {
    maxRetries: 2,
    initialDelay: 2000, // 2 seconds
    maxDelay: 30000,    // 30 seconds
    jitter: true,
    jitterFactor: 0.2,
    retryableErrors: [
      EventErrorType.PROCESSING,
      EventErrorType.TRANSIENT,
      EventErrorType.SYSTEM
    ]
  },
  'health-journey': {
    maxRetries: 4,
    initialDelay: 1000, // 1 second
    maxDelay: 60000,    // 1 minute
    jitter: true,
    jitterFactor: 0.2,
    journeySpecific: {
      'health': {
        maxRetries: 5,
        initialDelay: 2000 // 2 seconds
      }
    }
  },
  'care-journey': {
    maxRetries: 3,
    initialDelay: 2000, // 2 seconds
    maxDelay: 45000,    // 45 seconds
    jitter: true,
    jitterFactor: 0.2,
    journeySpecific: {
      'care': {
        maxRetries: 4,
        initialDelay: 3000 // 3 seconds
      }
    }
  },
  'plan-journey': {
    maxRetries: 3,
    initialDelay: 3000, // 3 seconds
    maxDelay: 90000,    // 90 seconds
    jitter: true,
    jitterFactor: 0.2,
    journeySpecific: {
      'plan': {
        maxRetries: 4,
        initialDelay: 5000 // 5 seconds
      }
    }
  }
};

/**
 * Classifies an error to determine its type for retry decision making.
 * 
 * @param error - The error to classify
 * @returns The classified error type
 */
export function classifyError(error: Error): EventErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  // Check for network-related errors
  if (
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('econnrefused') ||
    message.includes('ehostunreach') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    name.includes('network') ||
    name.includes('timeout')
  ) {
    return EventErrorType.NETWORK;
  }

  // Check for database-related errors
  if (
    message.includes('database') ||
    message.includes('db') ||
    message.includes('sql') ||
    message.includes('query') ||
    message.includes('transaction') ||
    message.includes('deadlock') ||
    message.includes('lock') ||
    message.includes('constraint') ||
    name.includes('database') ||
    name.includes('sql') ||
    name.includes('query')
  ) {
    return EventErrorType.DATABASE;
  }

  // Check for validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('not valid') ||
    message.includes('schema') ||
    name.includes('validation') ||
    name.includes('invalid')
  ) {
    return EventErrorType.VALIDATION;
  }

  // Check for schema errors
  if (
    message.includes('schema') ||
    message.includes('type') ||
    message.includes('required field') ||
    name.includes('schema') ||
    name.includes('type')
  ) {
    return EventErrorType.SCHEMA;
  }

  // Check for processing errors
  if (
    message.includes('processing') ||
    message.includes('failed to process') ||
    message.includes('error processing') ||
    name.includes('processing')
  ) {
    return EventErrorType.PROCESSING;
  }

  // Check for external service errors
  if (
    message.includes('external') ||
    message.includes('third-party') ||
    message.includes('provider') ||
    message.includes('gateway') ||
    message.includes('service unavailable') ||
    message.includes('503') ||
    name.includes('external') ||
    name.includes('service')
  ) {
    return EventErrorType.EXTERNAL;
  }

  // Check for client errors
  if (
    message.includes('client') ||
    message.includes('user') ||
    message.includes('input') ||
    message.includes('parameter') ||
    message.includes('400') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('404') ||
    name.includes('client') ||
    name.includes('user')
  ) {
    return EventErrorType.CLIENT;
  }

  // Check for system errors
  if (
    message.includes('system') ||
    message.includes('internal') ||
    message.includes('server') ||
    message.includes('500') ||
    name.includes('system') ||
    name.includes('internal')
  ) {
    return EventErrorType.SYSTEM;
  }

  // Check for transient errors
  if (
    message.includes('transient') ||
    message.includes('temporary') ||
    message.includes('retry') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429') ||
    name.includes('transient') ||
    name.includes('temporary')
  ) {
    return EventErrorType.TRANSIENT;
  }

  // Default to unknown if no specific classification matches
  return EventErrorType.UNKNOWN;
}

/**
 * Creates a RetryableOperationError from a standard Error object.
 * 
 * @param error - The error to convert
 * @param context - Additional context for the error
 * @returns A RetryableOperationError
 */
export function createRetryableOperationError(
  error: Error,
  context?: Record<string, any>
): RetryableOperationError {
  const errorType = classifyError(error);
  
  return {
    message: error.message,
    code: error.name,
    stack: error.stack,
    type: errorType,
    isRetryable: isRetryableErrorType(errorType),
    timestamp: new Date(),
    context,
    originalError: error
  };
}

/**
 * Utility function to apply retry logic to an async function.
 * 
 * @param fn - The function to retry
 * @param options - Retry options
 * @param policy - The retry policy to use
 * @param metadata - Metadata about the operation
 * @returns A promise that resolves with the function result or rejects after all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS.default,
  policy: RetryPolicy = new ExponentialBackoffPolicy(),
  metadata?: Partial<RetryableOperationMetadata>
): Promise<T> {
  let attempt = 0;
  let lastError: Error;
  
  // Initialize metadata if not provided
  const fullMetadata: RetryableOperationMetadata = {
    operationId: metadata?.operationId || `retry-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    operationType: metadata?.operationType || 'unknown',
    currentAttempt: 0,
    firstAttemptAt: new Date(),
    status: RetryStatus.PENDING,
    ...metadata
  } as RetryableOperationMetadata;
  
  while (true) {
    try {
      // Update metadata for this attempt
      fullMetadata.currentAttempt = attempt;
      fullMetadata.lastAttemptAt = new Date();
      fullMetadata.status = RetryStatus.IN_PROGRESS;
      
      // Execute the function
      const result = await fn();
      
      // Update metadata for success
      fullMetadata.status = RetryStatus.SUCCEEDED;
      
      return result;
    } catch (error) {
      // Cast to Error type
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Convert to RetryableOperationError
      const retryableError = createRetryableOperationError(lastError, fullMetadata.context);
      
      // Update metadata for failure
      fullMetadata.status = RetryStatus.FAILED;
      
      // Check if we should retry
      if (attempt < options.maxRetries && policy.shouldRetry(retryableError, attempt, options, fullMetadata)) {
        // Calculate delay for next retry
        const delayMs = policy.calculateDelayMs(attempt, options, fullMetadata);
        
        // Update metadata for pending retry
        fullMetadata.nextAttemptAt = new Date(Date.now() + delayMs);
        fullMetadata.status = RetryStatus.PENDING;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Increment attempt counter
        attempt++;
      } else {
        // Update metadata for exhausted retries
        fullMetadata.status = RetryStatus.EXHAUSTED;
        
        // No more retries, rethrow the error
        throw lastError;
      }
    }
  }
}
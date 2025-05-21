/**
 * @file retry.strategy.ts
 * @description Implements configurable retry strategies for Kafka consumers, including
 * exponential backoff with jitter. Provides a robust mechanism for retrying failed
 * message processing with increasing delays between attempts, preventing system
 * overload during recovery.
 */

import { Injectable, Logger } from '@nestjs/common';
import { RetryInfo, KafkaError, KafkaErrorType } from './kafka.types';

/**
 * Configuration options for retry strategies
 */
export interface RetryStrategyOptions {
  /** Initial delay in milliseconds before the first retry */
  initialDelayMs: number;
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Backoff factor for exponential strategies */
  backoffFactor?: number;
  /** Whether to add jitter to retry delays */
  useJitter?: boolean;
  /** Minimum jitter factor (0-1) */
  minJitterFactor?: number;
  /** Maximum jitter factor (0-1) */
  maxJitterFactor?: number;
  /** Specific error types that should be retried */
  retriableErrorTypes?: KafkaErrorType[];
}

/**
 * Default retry strategy options
 */
export const DEFAULT_RETRY_OPTIONS: RetryStrategyOptions = {
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 1 minute
  maxAttempts: 5,
  backoffFactor: 2,
  useJitter: true,
  minJitterFactor: 0.5,
  maxJitterFactor: 1.0,
  retriableErrorTypes: [
    KafkaErrorType.RETRIABLE,
    KafkaErrorType.CONNECTION,
    KafkaErrorType.PROCESSING
  ]
};

/**
 * Retry strategy type
 */
export enum RetryStrategyType {
  /** Fixed delay between retries */
  FIXED = 'FIXED',
  /** Linear increase in delay between retries */
  LINEAR = 'LINEAR',
  /** Exponential increase in delay between retries */
  EXPONENTIAL = 'EXPONENTIAL',
  /** Exponential increase with random jitter */
  EXPONENTIAL_WITH_JITTER = 'EXPONENTIAL_WITH_JITTER',
  /** Custom retry strategy */
  CUSTOM = 'CUSTOM'
}

/**
 * Result of a retry decision
 */
export interface RetryDecision {
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
 * Performance metrics for retry operations
 */
export interface RetryMetrics {
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
 * Service that provides retry strategies for Kafka operations
 */
@Injectable()
export class RetryStrategyService {
  private readonly logger = new Logger(RetryStrategyService.name);
  private readonly metrics: RetryMetrics = {
    totalRetryAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageDelayMs: 0,
    maxDelayMs: 0,
    totalRetryDurationMs: 0,
    successRate: 0,
    attemptsByErrorType: {} as Record<KafkaErrorType, number>,
    successesByErrorType: {} as Record<KafkaErrorType, number>
  };

  constructor() {
    // Initialize metrics for all error types
    Object.values(KafkaErrorType).forEach(type => {
      this.metrics.attemptsByErrorType[type] = 0;
      this.metrics.successesByErrorType[type] = 0;
    });
  }

  /**
   * Creates a new retry strategy
   * @param type Type of retry strategy
   * @param options Configuration options
   * @returns Retry strategy function
   */
  createStrategy(
    type: RetryStrategyType = RetryStrategyType.EXPONENTIAL_WITH_JITTER,
    options: Partial<RetryStrategyOptions> = {}
  ): (error: KafkaError, retryInfo?: RetryInfo) => RetryDecision {
    // Merge options with defaults
    const config: RetryStrategyOptions = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options
    };

    // Create the appropriate strategy based on type
    switch (type) {
      case RetryStrategyType.FIXED:
        return this.createFixedStrategy(config);
      case RetryStrategyType.LINEAR:
        return this.createLinearStrategy(config);
      case RetryStrategyType.EXPONENTIAL:
        return this.createExponentialStrategy(config);
      case RetryStrategyType.EXPONENTIAL_WITH_JITTER:
        return this.createExponentialWithJitterStrategy(config);
      case RetryStrategyType.CUSTOM:
        throw new Error('Custom retry strategy requires a custom implementation');
      default:
        return this.createExponentialWithJitterStrategy(config);
    }
  }

  /**
   * Creates a fixed delay retry strategy
   * @param options Configuration options
   * @returns Retry strategy function
   */
  private createFixedStrategy(
    options: RetryStrategyOptions
  ): (error: KafkaError, retryInfo?: RetryInfo) => RetryDecision {
    return (error: KafkaError, retryInfo?: RetryInfo) => {
      return this.makeRetryDecision(
        error,
        retryInfo,
        options,
        (attemptCount) => options.initialDelayMs
      );
    };
  }

  /**
   * Creates a linear delay retry strategy
   * @param options Configuration options
   * @returns Retry strategy function
   */
  private createLinearStrategy(
    options: RetryStrategyOptions
  ): (error: KafkaError, retryInfo?: RetryInfo) => RetryDecision {
    return (error: KafkaError, retryInfo?: RetryInfo) => {
      return this.makeRetryDecision(
        error,
        retryInfo,
        options,
        (attemptCount) => {
          // Linear increase: initialDelay * attemptCount
          const delay = options.initialDelayMs * attemptCount;
          return Math.min(delay, options.maxDelayMs);
        }
      );
    };
  }

  /**
   * Creates an exponential delay retry strategy
   * @param options Configuration options
   * @returns Retry strategy function
   */
  private createExponentialStrategy(
    options: RetryStrategyOptions
  ): (error: KafkaError, retryInfo?: RetryInfo) => RetryDecision {
    return (error: KafkaError, retryInfo?: RetryInfo) => {
      return this.makeRetryDecision(
        error,
        retryInfo,
        options,
        (attemptCount) => {
          // Exponential backoff: initialDelay * (backoffFactor ^ (attemptCount - 1))
          const backoffFactor = options.backoffFactor || 2;
          const delay = options.initialDelayMs * Math.pow(backoffFactor, attemptCount - 1);
          return Math.min(delay, options.maxDelayMs);
        }
      );
    };
  }

  /**
   * Creates an exponential delay with jitter retry strategy
   * @param options Configuration options
   * @returns Retry strategy function
   */
  private createExponentialWithJitterStrategy(
    options: RetryStrategyOptions
  ): (error: KafkaError, retryInfo?: RetryInfo) => RetryDecision {
    return (error: KafkaError, retryInfo?: RetryInfo) => {
      return this.makeRetryDecision(
        error,
        retryInfo,
        options,
        (attemptCount) => {
          // Exponential backoff: initialDelay * (backoffFactor ^ (attemptCount - 1))
          const backoffFactor = options.backoffFactor || 2;
          const exponentialDelay = options.initialDelayMs * Math.pow(backoffFactor, attemptCount - 1);
          
          // Apply jitter if enabled
          if (options.useJitter) {
            const minJitter = options.minJitterFactor || 0.5;
            const maxJitter = options.maxJitterFactor || 1.0;
            const jitterRange = maxJitter - minJitter;
            const jitterFactor = minJitter + (Math.random() * jitterRange);
            
            // Apply jitter factor to the exponential delay
            const delayWithJitter = exponentialDelay * jitterFactor;
            return Math.min(delayWithJitter, options.maxDelayMs);
          }
          
          return Math.min(exponentialDelay, options.maxDelayMs);
        }
      );
    };
  }

  /**
   * Makes a retry decision based on the error, retry information, and delay calculation
   * @param error Error that occurred
   * @param retryInfo Current retry information
   * @param options Retry strategy options
   * @param calculateDelay Function to calculate the delay for the next retry
   * @returns Retry decision
   */
  private makeRetryDecision(
    error: KafkaError,
    retryInfo: RetryInfo | undefined,
    options: RetryStrategyOptions,
    calculateDelay: (attemptCount: number) => number
  ): RetryDecision {
    // If the error is not retriable, don't retry
    if (!error.retriable) {
      return {
        shouldRetry: false,
        delayMs: 0,
        retryInfo: this.createRetryInfo(options.maxAttempts),
        reason: 'Error is not retriable'
      };
    }

    // If the error type is not in the list of retriable error types, don't retry
    if (
      options.retriableErrorTypes &&
      !options.retriableErrorTypes.includes(error.type)
    ) {
      return {
        shouldRetry: false,
        delayMs: 0,
        retryInfo: this.createRetryInfo(options.maxAttempts),
        reason: `Error type ${error.type} is not configured for retry`
      };
    }

    // If there's no retry info, create a new one
    const currentRetryInfo = retryInfo || this.createRetryInfo(options.maxAttempts);

    // If we've reached the maximum number of attempts, don't retry
    if (currentRetryInfo.attemptCount >= currentRetryInfo.maxAttempts) {
      return {
        shouldRetry: false,
        delayMs: 0,
        retryInfo: currentRetryInfo,
        reason: `Maximum retry attempts (${currentRetryInfo.maxAttempts}) reached`
      };
    }

    // Calculate the delay for the next retry
    const nextAttemptCount = currentRetryInfo.attemptCount + 1;
    const delayMs = calculateDelay(nextAttemptCount);

    // Update retry information
    const nextRetryInfo: RetryInfo = {
      attemptCount: nextAttemptCount,
      maxAttempts: currentRetryInfo.maxAttempts,
      firstAttemptTimestamp: currentRetryInfo.firstAttemptTimestamp,
      lastAttemptTimestamp: new Date().toISOString(),
      nextRetryDelayMs: delayMs,
      lastError: {
        message: error.message,
        code: error.code
      }
    };

    // Update metrics
    this.updateMetrics(error, delayMs);

    // Log the retry decision
    this.logger.debug(
      `Retry decision: Will retry after ${delayMs}ms (attempt ${nextAttemptCount}/${nextRetryInfo.maxAttempts})`,
      {
        errorType: error.type,
        errorCode: error.code,
        attemptCount: nextAttemptCount,
        maxAttempts: nextRetryInfo.maxAttempts,
        delayMs
      }
    );

    return {
      shouldRetry: true,
      delayMs,
      retryInfo: nextRetryInfo,
      reason: `Will retry after ${delayMs}ms (attempt ${nextAttemptCount}/${nextRetryInfo.maxAttempts})`
    };
  }

  /**
   * Creates a new retry information object
   * @param maxAttempts Maximum number of retry attempts
   * @returns New retry information
   */
  createRetryInfo(maxAttempts: number): RetryInfo {
    const now = new Date().toISOString();
    return {
      attemptCount: 0,
      maxAttempts,
      firstAttemptTimestamp: now,
      lastAttemptTimestamp: now,
      nextRetryDelayMs: 0
    };
  }

  /**
   * Updates metrics for retry operations
   * @param error Error that occurred
   * @param delayMs Delay for the next retry
   */
  private updateMetrics(error: KafkaError, delayMs: number): void {
    this.metrics.totalRetryAttempts++;
    this.metrics.totalRetryDurationMs += delayMs;
    this.metrics.averageDelayMs = this.metrics.totalRetryDurationMs / this.metrics.totalRetryAttempts;
    this.metrics.maxDelayMs = Math.max(this.metrics.maxDelayMs, delayMs);
    
    // Update error type metrics
    if (!this.metrics.attemptsByErrorType[error.type]) {
      this.metrics.attemptsByErrorType[error.type] = 0;
    }
    this.metrics.attemptsByErrorType[error.type]++;
  }

  /**
   * Records a successful retry
   * @param error Error that was retried
   */
  recordSuccessfulRetry(error: KafkaError): void {
    this.metrics.successfulRetries++;
    this.metrics.successRate = this.metrics.successfulRetries / this.metrics.totalRetryAttempts;
    
    // Update error type metrics
    if (!this.metrics.successesByErrorType[error.type]) {
      this.metrics.successesByErrorType[error.type] = 0;
    }
    this.metrics.successesByErrorType[error.type]++;
  }

  /**
   * Records a failed retry
   * @param error Error that was retried
   */
  recordFailedRetry(error: KafkaError): void {
    this.metrics.failedRetries++;
    this.metrics.successRate = this.metrics.successfulRetries / this.metrics.totalRetryAttempts;
  }

  /**
   * Gets the current retry metrics
   * @returns Current retry metrics
   */
  getMetrics(): RetryMetrics {
    return { ...this.metrics };
  }

  /**
   * Resets the retry metrics
   */
  resetMetrics(): void {
    this.metrics.totalRetryAttempts = 0;
    this.metrics.successfulRetries = 0;
    this.metrics.failedRetries = 0;
    this.metrics.averageDelayMs = 0;
    this.metrics.maxDelayMs = 0;
    this.metrics.totalRetryDurationMs = 0;
    this.metrics.successRate = 0;
    
    // Reset error type metrics
    Object.values(KafkaErrorType).forEach(type => {
      this.metrics.attemptsByErrorType[type] = 0;
      this.metrics.successesByErrorType[type] = 0;
    });
  }

  /**
   * Calculates exponential backoff with jitter
   * @param attemptCount Current attempt count (starting from 1)
   * @param baseDelayMs Base delay in milliseconds
   * @param maxDelayMs Maximum delay in milliseconds
   * @param backoffFactor Factor by which delay increases with each attempt
   * @param minJitterFactor Minimum jitter factor (0-1)
   * @param maxJitterFactor Maximum jitter factor (0-1)
   * @returns Delay in milliseconds before the next retry
   */
  static calculateExponentialBackoffWithJitter(
    attemptCount: number,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 60000,
    backoffFactor: number = 2,
    minJitterFactor: number = 0.5,
    maxJitterFactor: number = 1.0
  ): number {
    // Exponential backoff: baseDelay * (backoffFactor ^ (attemptCount - 1))
    const exponentialDelay = baseDelayMs * Math.pow(backoffFactor, attemptCount - 1);
    
    // Apply jitter: random factor between minJitter and maxJitter
    const jitterRange = maxJitterFactor - minJitterFactor;
    const jitterFactor = minJitterFactor + (Math.random() * jitterRange);
    const delayWithJitter = exponentialDelay * jitterFactor;
    
    // Cap at maximum delay
    return Math.min(delayWithJitter, maxDelayMs);
  }

  /**
   * Waits for the specified delay
   * @param delayMs Delay in milliseconds
   * @returns Promise that resolves after the delay
   */
  static async wait(delayMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  /**
   * Creates a retry strategy factory for a specific journey
   * @param journey Journey name
   * @param options Default options for the journey
   * @returns Retry strategy factory for the journey
   */
  createJourneyStrategyFactory(
    journey: 'health' | 'care' | 'plan',
    options: Partial<RetryStrategyOptions> = {}
  ): {
    forEventType: (eventType: string, typeOptions?: Partial<RetryStrategyOptions>) => (error: KafkaError, retryInfo?: RetryInfo) => RetryDecision;
    forErrorType: (errorType: KafkaErrorType, typeOptions?: Partial<RetryStrategyOptions>) => (error: KafkaError, retryInfo?: RetryInfo) => RetryDecision;
    default: (error: KafkaError, retryInfo?: RetryInfo) => RetryDecision;
  } {
    // Journey-specific default options
    const journeyOptions: Partial<RetryStrategyOptions> = {
      ...options
    };
    
    // Customize options based on journey
    switch (journey) {
      case 'health':
        // Health journey might need more aggressive retries for critical health data
        journeyOptions.maxAttempts = options.maxAttempts || 7;
        journeyOptions.initialDelayMs = options.initialDelayMs || 500; // Start retries faster
        break;
      case 'care':
        // Care journey might need moderate retries
        journeyOptions.maxAttempts = options.maxAttempts || 5;
        journeyOptions.initialDelayMs = options.initialDelayMs || 1000;
        break;
      case 'plan':
        // Plan journey can be more conservative with retries
        journeyOptions.maxAttempts = options.maxAttempts || 3;
        journeyOptions.initialDelayMs = options.initialDelayMs || 2000;
        break;
    }
    
    // Create the default strategy for this journey
    const defaultStrategy = this.createStrategy(
      RetryStrategyType.EXPONENTIAL_WITH_JITTER,
      journeyOptions
    );
    
    return {
      // Create a strategy for a specific event type
      forEventType: (eventType: string, typeOptions: Partial<RetryStrategyOptions> = {}) => {
        return this.createStrategy(
          RetryStrategyType.EXPONENTIAL_WITH_JITTER,
          { ...journeyOptions, ...typeOptions }
        );
      },
      
      // Create a strategy for a specific error type
      forErrorType: (errorType: KafkaErrorType, typeOptions: Partial<RetryStrategyOptions> = {}) => {
        return this.createStrategy(
          RetryStrategyType.EXPONENTIAL_WITH_JITTER,
          { 
            ...journeyOptions, 
            ...typeOptions,
            retriableErrorTypes: [errorType]
          }
        );
      },
      
      // Default strategy for this journey
      default: defaultStrategy
    };
  }
}
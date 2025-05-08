/**
 * @file retry.util.ts
 * @description Provides configurable retry strategies with exponential backoff for handling transient failures
 * in event processing and external service calls. Critical for ensuring resilience and fault tolerance in the
 * gamification engine when processing cross-journey events.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement retry mechanisms with exponential backoff
 * - Create dead letter queues for failed events
 * - Implement event routing to appropriate handlers
 * - Enhance error handling with centralized retry policies
 */

import { Injectable } from '@nestjs/common';
import { ErrorCategory, ErrorType } from '../exceptions/error-types.enum';
import { GamificationLogger, GamificationContextType } from './logging.util';
import {
  RetryPolicyType,
  OperationCategory,
  RETRY_CONFIG,
  MAX_RETRY_ATTEMPTS,
  INITIAL_RETRY_DELAY_MS,
  MAX_RETRY_DELAY_MS,
  BACKOFF_FACTORS,
  JITTER_FACTORS,
  DLQ_CONFIG,
  DLQ_PROCESSING_DELAYS_MS,
  KAFKA_CONSUMER_RETRY,
} from '../constants/retry-policies';
import { ERROR_RETRYABLE_MAP } from '../constants/error-codes';
import { IBaseEvent } from '../interfaces/base-event.interface';

/**
 * Interface for retry options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  
  /** Initial delay in milliseconds before first retry */
  initialDelayMs?: number;
  
  /** Maximum delay in milliseconds between retries */
  maxDelayMs?: number;
  
  /** Retry policy type (fixed, linear, exponential) */
  policyType?: RetryPolicyType;
  
  /** Backoff factor for exponential retry strategy */
  backoffFactor?: number;
  
  /** Jitter factor to add randomness to retry delays (0-1) */
  jitterFactor?: number;
  
  /** Operation category for predefined retry policies */
  operationCategory?: OperationCategory;
  
  /** Custom function to determine if an error is retryable */
  isRetryable?: (error: Error) => boolean;
  
  /** Custom function to execute before each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void | Promise<void>;
  
  /** Custom function to execute when all retries are exhausted */
  onExhausted?: (error: Error, attempts: number) => void | Promise<void>;
  
  /** Whether to use dead letter queue for persistently failing operations */
  useDlq?: boolean;
  
  /** Dead letter queue topic suffix */
  dlqTopicSuffix?: string;
  
  /** Context data for logging */
  context?: Record<string, any>;
}

/**
 * Interface for retry result
 */
export interface RetryResult<T> {
  /** Whether the operation was successful */
  success: boolean;
  
  /** Result of the operation if successful */
  result?: T;
  
  /** Error if the operation failed */
  error?: Error;
  
  /** Number of retry attempts made */
  attempts: number;
  
  /** Whether the operation was sent to a dead letter queue */
  sentToDlq: boolean;
}

/**
 * Interface for retry metadata
 */
export interface RetryMetadata {
  /** Operation being retried */
  operation: string;
  
  /** Current retry attempt */
  attempt: number;
  
  /** Maximum number of retry attempts */
  maxAttempts: number;
  
  /** Delay before the next retry in milliseconds */
  delayMs: number;
  
  /** Timestamp of the retry attempt */
  timestamp: Date;
  
  /** Error that triggered the retry */
  error: Error;
  
  /** Whether the operation was sent to a dead letter queue */
  sentToDlq: boolean;
}

/**
 * Interface for dead letter queue entry
 */
export interface DlqEntry<T> {
  /** Original payload that failed processing */
  payload: T;
  
  /** Error that caused the failure */
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  
  /** Number of processing attempts made */
  attempts: number;
  
  /** Timestamp when the entry was added to the DLQ */
  timestamp: Date;
  
  /** Original topic or operation name */
  source: string;
  
  /** Metadata for the failed operation */
  metadata?: Record<string, any>;
}

/**
 * Utility service that provides retry functionality with configurable strategies
 */
@Injectable()
export class RetryService {
  constructor(private readonly logger: GamificationLogger) {}

  /**
   * Calculates the delay for the next retry attempt based on the retry policy
   * @param attempt Current attempt number (0-based)
   * @param options Retry options
   * @returns Delay in milliseconds
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    const {
      initialDelayMs = RETRY_CONFIG.DEFAULT_INITIAL_DELAY_MS,
      maxDelayMs = RETRY_CONFIG.DEFAULT_MAX_DELAY_MS,
      policyType = RetryPolicyType.EXPONENTIAL,
      backoffFactor = RETRY_CONFIG.DEFAULT_BACKOFF_FACTOR,
      jitterFactor = RETRY_CONFIG.DEFAULT_JITTER_FACTOR,
    } = options;

    let delay: number;

    switch (policyType) {
      case RetryPolicyType.FIXED:
        delay = initialDelayMs;
        break;
      
      case RetryPolicyType.LINEAR:
        delay = initialDelayMs + (attempt * RETRY_CONFIG.DEFAULT_LINEAR_INCREMENT_MS);
        break;
      
      case RetryPolicyType.EXPONENTIAL:
      default:
        delay = initialDelayMs * Math.pow(backoffFactor, attempt);
        break;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, maxDelayMs);

    // Apply jitter to prevent thundering herd problem
    if (jitterFactor > 0) {
      const jitterRange = delay * jitterFactor;
      delay = delay - (jitterRange / 2) + (Math.random() * jitterRange);
    }

    return Math.floor(delay);
  }

  /**
   * Determines if an error is retryable based on its type or category
   * @param error The error to check
   * @param options Retry options
   * @returns Whether the error is retryable
   */
  private isRetryableError(error: Error, options: RetryOptions): boolean {
    // Use custom function if provided
    if (options.isRetryable) {
      return options.isRetryable(error);
    }

    // Check if error has a code that's mapped in ERROR_RETRYABLE_MAP
    const errorWithCode = error as any;
    if (errorWithCode.code && ERROR_RETRYABLE_MAP[errorWithCode.code]) {
      return ERROR_RETRYABLE_MAP[errorWithCode.code];
    }

    // Check if error has a type property that indicates it's retryable
    if (errorWithCode.type) {
      // Check if it's a transient error
      if (errorWithCode.category === ErrorCategory.TRANSIENT) {
        return true;
      }

      // Check specific error types that are retryable
      const retryableErrorTypes = [
        ErrorType.NETWORK_ERROR,
        ErrorType.CONNECTION_RESET,
        ErrorType.CONNECTION_TIMEOUT,
        ErrorType.SERVICE_OVERLOADED,
        ErrorType.RATE_LIMITED,
        ErrorType.TEMPORARY_OUTAGE,
        ErrorType.DATABASE_CONNECTION_INTERRUPTED,
        ErrorType.DATABASE_FAILOVER_IN_PROGRESS,
        ErrorType.DATABASE_THROTTLED,
        ErrorType.KAFKA_TEMPORARY_ERROR,
        ErrorType.KAFKA_REBALANCING,
        ErrorType.KAFKA_BROKER_UNAVAILABLE,
        ErrorType.CACHE_TEMPORARY_ERROR,
        ErrorType.CACHE_REBALANCING,
        ErrorType.TOO_MANY_REQUESTS,
        ErrorType.SERVICE_UNAVAILABLE,
        ErrorType.GATEWAY_TIMEOUT,
      ];

      return retryableErrorTypes.includes(errorWithCode.type);
    }

    // Default behavior based on error name
    const retryableErrorNames = [
      'NetworkError',
      'ConnectionError',
      'TimeoutError',
      'ServiceUnavailableError',
      'ThrottlingError',
      'RateLimitError',
      'TemporaryError',
      'TransientError',
      'KafkaError',
      'BrokerError',
      'ConnectionRefusedError',
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'ENOTFOUND',
    ];

    return retryableErrorNames.some(name => error.name.includes(name) || error.message.includes(name));
  }

  /**
   * Creates a promise that resolves after the specified delay
   * @param ms Delay in milliseconds
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sends a failed operation to the dead letter queue
   * @param payload Original payload that failed processing
   * @param error Error that caused the failure
   * @param attempts Number of processing attempts made
   * @param source Original topic or operation name
   * @param metadata Additional metadata
   * @returns Promise that resolves when the entry is added to the DLQ
   */
  private async sendToDlq<T>(payload: T, error: Error, attempts: number, source: string, metadata?: Record<string, any>): Promise<void> {
    // Create DLQ entry
    const dlqEntry: DlqEntry<T> = {
      payload,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      attempts,
      timestamp: new Date(),
      source,
      metadata,
    };

    // In a real implementation, this would send the entry to a Kafka DLQ topic or other persistent storage
    // For now, we'll just log it
    if (payload && (payload as any).id) {
      const event = payload as unknown as IBaseEvent;
      this.logger.logDeadLetterQueueEvent(
        `Operation ${source} failed after ${attempts} attempts and was sent to DLQ`,
        event,
        error,
        { dlqEntry, ...metadata }
      );
    } else {
      this.logger.logRetryAttempt(
        `Operation ${source} failed after ${attempts} attempts and was sent to DLQ`,
        source,
        attempts,
        attempts,
        error,
        { 
          contextType: GamificationContextType.EVENT,
          dlqEntry,
          sentToDlq: true,
          ...metadata 
        }
      );
    }

    // TODO: Implement actual DLQ publishing logic when Kafka integration is available
    // This would typically involve publishing to a DLQ topic with the dlqEntry as the payload
  }

  /**
   * Executes an operation with retry logic
   * @param operation Function to execute with retry logic
   * @param options Retry options
   * @returns Promise that resolves with the retry result
   */
  public async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    // Resolve retry options with defaults based on operation category
    const operationCategory = options.operationCategory || OperationCategory.EVENT_PROCESSING;
    const maxRetries = options.maxRetries || MAX_RETRY_ATTEMPTS[operationCategory] || RETRY_CONFIG.DEFAULT_MAX_RETRIES;
    const initialDelayMs = options.initialDelayMs || INITIAL_RETRY_DELAY_MS[operationCategory] || RETRY_CONFIG.DEFAULT_INITIAL_DELAY_MS;
    const maxDelayMs = options.maxDelayMs || MAX_RETRY_DELAY_MS[operationCategory] || RETRY_CONFIG.DEFAULT_MAX_DELAY_MS;
    const backoffFactor = options.backoffFactor || BACKOFF_FACTORS[operationCategory] || RETRY_CONFIG.DEFAULT_BACKOFF_FACTOR;
    const jitterFactor = options.jitterFactor || JITTER_FACTORS[operationCategory] || RETRY_CONFIG.DEFAULT_JITTER_FACTOR;
    const policyType = options.policyType || RetryPolicyType.EXPONENTIAL;
    const useDlq = options.useDlq !== undefined ? options.useDlq : true;
    const dlqTopicSuffix = options.dlqTopicSuffix || DLQ_CONFIG.DEFAULT_TOPIC_SUFFIX;
    const context = options.context || {};
    const operationName = context.operationName || 'unknown';

    // Initialize result
    const result: RetryResult<T> = {
      success: false,
      attempts: 0,
      sentToDlq: false,
    };

    // Execute operation with retries
    let attempt = 0;
    let lastError: Error;

    while (attempt <= maxRetries) {
      try {
        // Execute operation
        const operationResult = await operation();
        
        // Operation succeeded
        result.success = true;
        result.result = operationResult;
        result.attempts = attempt;
        return result;
      } catch (error) {
        // Increment attempt counter
        attempt++;
        lastError = error as Error;
        result.attempts = attempt;

        // Check if we've exhausted all retry attempts
        if (attempt > maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(lastError, options)) {
          break;
        }

        // Calculate delay for next retry
        const delayMs = this.calculateDelay(attempt - 1, {
          initialDelayMs,
          maxDelayMs,
          policyType,
          backoffFactor,
          jitterFactor,
        });

        // Create retry metadata
        const retryMetadata: RetryMetadata = {
          operation: operationName,
          attempt,
          maxAttempts: maxRetries,
          delayMs,
          timestamp: new Date(),
          error: lastError,
          sentToDlq: false,
        };

        // Execute onRetry callback if provided
        if (options.onRetry) {
          await options.onRetry(lastError, attempt, delayMs);
        }

        // Log retry attempt
        this.logger.logRetryAttempt(
          `Retrying operation ${operationName} after failure`,
          operationName,
          attempt,
          maxRetries,
          lastError,
          { ...context, retryMetadata }
        );

        // Wait before next retry
        await this.delay(delayMs);
      }
    }

    // All retries exhausted or non-retryable error
    result.success = false;
    result.error = lastError;

    // Execute onExhausted callback if provided
    if (options.onExhausted) {
      await options.onExhausted(lastError, attempt);
    }

    // Send to DLQ if enabled
    if (useDlq && context.payload) {
      await this.sendToDlq(
        context.payload,
        lastError,
        attempt,
        operationName,
        { ...context, dlqTopicSuffix }
      );
      result.sentToDlq = true;
    }

    return result;
  }

  /**
   * Executes a Kafka event processing operation with retry logic
   * @param operation Function to execute with retry logic
   * @param event Event being processed
   * @param options Additional retry options
   * @returns Promise that resolves with the retry result
   */
  public async retryKafkaEventProcessing<T>(
    operation: () => Promise<T>,
    event: IBaseEvent,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    // Use Kafka-specific retry configuration
    const kafkaOptions: RetryOptions = {
      maxRetries: KAFKA_CONSUMER_RETRY.MAX_RETRIES,
      initialDelayMs: KAFKA_CONSUMER_RETRY.INITIAL_RETRY_DELAY_MS,
      maxDelayMs: KAFKA_CONSUMER_RETRY.MAX_RETRY_DELAY_MS,
      backoffFactor: KAFKA_CONSUMER_RETRY.BACKOFF_FACTOR,
      jitterFactor: KAFKA_CONSUMER_RETRY.JITTER_FACTOR,
      policyType: KAFKA_CONSUMER_RETRY.POLICY_TYPE,
      operationCategory: OperationCategory.EVENT_PROCESSING,
      useDlq: true,
      dlqTopicSuffix: KAFKA_CONSUMER_RETRY.DLQ_TOPIC_SUFFIX,
      context: {
        operationName: `process-event-${event.type}`,
        payload: event,
        eventType: event.type,
        userId: event.userId,
        journeyType: event.journeyType,
      },
      ...options,
    };

    return this.retry(operation, kafkaOptions);
  }

  /**
   * Creates a method decorator that adds retry logic to a class method
   * @param options Retry options
   * @returns Method decorator
   */
  public static withRetry(options: RetryOptions = {}) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const retryService = new RetryService(null); // Will be properly injected at runtime

      descriptor.value = async function(...args: any[]) {
        const operationName = options.context?.operationName || `${target.constructor.name}.${propertyKey}`;
        const contextWithOperation = { ...options.context, operationName };
        const retryOptions = { ...options, context: contextWithOperation };

        const result = await retryService.retry(
          () => originalMethod.apply(this, args),
          retryOptions
        );

        if (!result.success) {
          throw result.error;
        }

        return result.result;
      };

      return descriptor;
    };
  }

  /**
   * Creates a method decorator that adds Kafka event processing retry logic to a class method
   * @param options Additional retry options
   * @returns Method decorator
   */
  public static withKafkaRetry(options: Partial<RetryOptions> = {}) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const retryService = new RetryService(null); // Will be properly injected at runtime

      descriptor.value = async function(...args: any[]) {
        // Assume the first argument is the event
        const event = args[0] as IBaseEvent;
        if (!event || !event.type) {
          throw new Error('First argument must be an event with a type property');
        }

        const operationName = options.context?.operationName || `${target.constructor.name}.${propertyKey}`;
        const contextWithOperation = { 
          ...options.context, 
          operationName,
          payload: event,
          eventType: event.type,
          userId: event.userId,
          journeyType: event.journeyType,
        };
        const retryOptions = { ...options, context: contextWithOperation };

        const result = await retryService.retryKafkaEventProcessing(
          () => originalMethod.apply(this, args),
          event,
          retryOptions
        );

        if (!result.success) {
          throw result.error;
        }

        return result.result;
      };

      return descriptor;
    };
  }
}

/**
 * Executes an operation with retry logic
 * @param operation Function to execute with retry logic
 * @param options Retry options
 * @returns Promise that resolves with the operation result or rejects with an error
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retryService = new RetryService(null); // This is a simplified version for standalone usage
  const result = await retryService.retry(operation, options);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.result;
}

/**
 * Executes a Kafka event processing operation with retry logic
 * @param operation Function to execute with retry logic
 * @param event Event being processed
 * @param options Additional retry options
 * @returns Promise that resolves with the operation result or rejects with an error
 */
export async function withKafkaRetry<T>(
  operation: () => Promise<T>,
  event: IBaseEvent,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryService = new RetryService(null); // This is a simplified version for standalone usage
  const result = await retryService.retryKafkaEventProcessing(operation, event, options);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.result;
}
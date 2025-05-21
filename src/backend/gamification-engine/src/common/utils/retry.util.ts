/**
 * Retry Utility
 * 
 * Provides configurable retry strategies with exponential backoff for handling transient failures
 * in event processing and external service calls. Critical for ensuring resilience and fault tolerance
 * in the gamification engine when processing cross-journey events.
 */

import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// Import from constants
import {
  RetryPolicyType,
  ErrorCategory,
  OperationCategory,
  MAX_RETRY_ATTEMPTS,
  INITIAL_RETRY_DELAY_MS,
  MAX_RETRY_DELAY_MS,
  BACKOFF_FACTOR,
  JITTER_FACTOR,
  DEAD_LETTER_QUEUE,
} from '../constants/retry-policies';

// Import from utils
import { GamificationLogger } from './logging.util';
import { CircuitBreaker, CircuitBreakerOpenError } from './circuit-breaker.util';

/**
 * Interface for retry options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds before the first retry */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds between retries */
  maxDelayMs?: number;
  /** Backoff factor for exponential strategies */
  backoffFactor?: number;
  /** Whether to add jitter to retry delays to prevent thundering herd problem */
  useJitter?: boolean;
  /** Jitter factor (0-1) to add randomness to retry delays */
  jitterFactor?: number;
  /** Type of retry policy to use */
  retryPolicyType?: RetryPolicyType;
  /** Operation category for predefined retry settings */
  operationCategory?: OperationCategory;
  /** Whether to use circuit breaker pattern */
  useCircuitBreaker?: boolean;
  /** Circuit breaker options */
  circuitBreakerOptions?: {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    successThreshold?: number;
  };
  /** Whether to send to dead letter queue after all retries fail */
  useDlq?: boolean;
  /** Custom function to determine if an error is retriable */
  isRetriable?: (error: Error) => boolean;
  /** Custom function to execute before each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void | Promise<void>;
  /** Custom function to execute when all retries fail */
  onFail?: (error: Error, attempts: number) => void | Promise<void>;
  /** Custom function to execute when retry succeeds */
  onSuccess?: (result: any, attempts: number) => void | Promise<void>;
}

/**
 * Interface for retry context
 */
export interface RetryContext {
  /** Unique ID for this retry operation */
  retryId: string;
  /** Current attempt number (starting from 1) */
  attempt: number;
  /** Maximum number of attempts */
  maxAttempts: number;
  /** Start time of the first attempt */
  startTime: number;
  /** Last error that occurred */
  lastError?: Error;
  /** Whether the operation succeeded */
  succeeded?: boolean;
  /** Result of the operation if it succeeded */
  result?: any;
  /** Total time spent in retries (ms) */
  totalTimeMs?: number;
  /** Array of delays used for each retry */
  delays?: number[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  useJitter: true,
  jitterFactor: JITTER_FACTOR,
  retryPolicyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
  operationCategory: OperationCategory.EVENT_PROCESSING,
  useCircuitBreaker: false,
  useDlq: false,
};

/**
 * Utility service for retry operations
 */
@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(
    private readonly gamificationLogger: GamificationLogger,
    // Optional dependencies that can be injected when available
    @Optional() private readonly dlqService?: any,
    @Optional() @Inject('KAFKA_PRODUCER') private readonly kafkaProducer?: any
  ) {}

  /**
   * Executes a function with retry logic
   * 
   * @param fn Function to execute with retry logic
   * @param options Retry options
   * @returns Result of the function execution
   */
  async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    // Merge with default options
    const opts = this.getRetryOptions(options);
    
    // Create retry context
    const context: RetryContext = {
      retryId: uuidv4(),
      attempt: 0,
      maxAttempts: opts.maxAttempts!,
      startTime: Date.now(),
      delays: [],
      metadata: {},
    };

    // Get or create circuit breaker if enabled
    let circuitBreaker: CircuitBreaker | undefined;
    if (opts.useCircuitBreaker) {
      const breakerId = `retry-${opts.operationCategory}-${context.retryId}`;
      circuitBreaker = this.getCircuitBreaker(breakerId, opts);
    }

    // Execute with retry logic
    while (context.attempt < context.maxAttempts) {
      context.attempt++;
      
      try {
        // Execute through circuit breaker if enabled
        let result: T;
        if (circuitBreaker) {
          result = await circuitBreaker.execute(fn);
        } else {
          result = await fn();
        }

        // Success - log and return result
        context.succeeded = true;
        context.result = result;
        context.totalTimeMs = Date.now() - context.startTime;
        
        // Log success
        this.logRetrySuccess(context, opts);
        
        // Execute onSuccess callback if provided
        if (opts.onSuccess) {
          await opts.onSuccess(result, context.attempt);
        }
        
        return result;
      } catch (error) {
        context.lastError = error;
        
        // If circuit breaker is open, don't retry
        if (error instanceof CircuitBreakerOpenError) {
          this.logCircuitBreakerOpen(error, context, opts);
          break;
        }
        
        // Check if we should retry
        if (!this.shouldRetry(error, context, opts)) {
          break;
        }
        
        // Calculate delay for next retry
        const delay = this.calculateRetryDelay(context.attempt, opts);
        context.delays!.push(delay);
        
        // Log retry attempt
        this.logRetryAttempt(error, context, delay, opts);
        
        // Execute onRetry callback if provided
        if (opts.onRetry) {
          await opts.onRetry(error, context.attempt, delay);
        }
        
        // Wait before next retry
        await this.delay(delay);
      }
    }
    
    // All retries failed
    context.totalTimeMs = Date.now() - context.startTime;
    const error = context.lastError!;
    
    // Log failure
    this.logRetryFailure(error, context, opts);
    
    // Execute onFail callback if provided
    if (opts.onFail) {
      await opts.onFail(error, context.attempt);
    }
    
    // Send to DLQ if enabled
    if (opts.useDlq && DEAD_LETTER_QUEUE.ENABLED[opts.operationCategory!]) {
      await this.handleDeadLetterQueue(error, context, opts);
    }
    
    // Rethrow the last error
    throw error;
  }

  /**
   * Executes a function with retry logic and returns a fallback value if all retries fail
   * 
   * @param fn Function to execute with retry logic
   * @param fallbackFn Function to execute if all retries fail
   * @param options Retry options
   * @returns Result of the function execution or fallback
   */
  async retryWithFallback<T>(
    fn: () => Promise<T>,
    fallbackFn: (error: Error, context: RetryContext) => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    try {
      return await this.retry(fn, options);
    } catch (error) {
      // Create retry context for fallback
      const context: RetryContext = {
        retryId: uuidv4(),
        attempt: options.maxAttempts || DEFAULT_RETRY_OPTIONS.maxAttempts!,
        maxAttempts: options.maxAttempts || DEFAULT_RETRY_OPTIONS.maxAttempts!,
        startTime: Date.now(),
        lastError: error,
        succeeded: false,
        totalTimeMs: 0,
      };
      
      // Log fallback execution
      this.logger.warn(
        `All retries failed, executing fallback for operation ${options.operationCategory || 'unknown'}`,
        { error: error.message, retryId: context.retryId }
      );
      
      // Execute fallback
      return fallbackFn(error, context);
    }
  }

  /**
   * Specialized retry function for event processing
   * 
   * @param fn Function to execute with retry logic
   * @param eventMetadata Event metadata for logging and DLQ integration
   * @param options Retry options
   * @returns Result of the function execution
   */
  async retryEventProcessing<T>(
    fn: () => Promise<T>,
    eventMetadata: {
      eventId: string;
      eventType: string;
      userId?: string;
      correlationId?: string;
      journey?: string;
      // Optional Kafka message for DLQ integration
      eventMessage?: any;
      topic?: string;
      consumerGroup?: string;
    },
    options: RetryOptions = {}
  ): Promise<T> {
    // Set operation category to EVENT_PROCESSING if not specified
    const opts: RetryOptions = {
      ...options,
      operationCategory: options.operationCategory || OperationCategory.EVENT_PROCESSING,
      // Enable DLQ by default for event processing
      useDlq: options.useDlq !== undefined ? options.useDlq : true,
      // Add event metadata to retry context
      onRetry: async (error, attempt, delay) => {
        this.gamificationLogger.logEventProcessingError(
          `Retry attempt ${attempt} for event ${eventMetadata.eventType}`,
          error,
          {
            correlationId: eventMetadata.correlationId || uuidv4(),
            eventType: eventMetadata.eventType,
            source: 'retry-util',
            version: '1.0',
          },
          {
            eventId: eventMetadata.eventId,
            userId: eventMetadata.userId,
            journey: eventMetadata.journey,
            attempt,
            delay,
          }
        );
        
        // Call original onRetry if provided
        if (options.onRetry) {
          await options.onRetry(error, attempt, delay);
        }
      },
      // Add metadata for DLQ integration
      metadata: {
        ...options.metadata,
        eventId: eventMetadata.eventId,
        eventType: eventMetadata.eventType,
        userId: eventMetadata.userId,
        correlationId: eventMetadata.correlationId,
        journey: eventMetadata.journey,
        eventMessage: eventMetadata.eventMessage,
        topic: eventMetadata.topic,
        consumerGroup: eventMetadata.consumerGroup,
      },
    };
    
    return this.retry(fn, opts);
  }

  /**
   * Specialized retry function for database operations
   * 
   * @param fn Function to execute with retry logic
   * @param options Retry options
   * @returns Result of the function execution
   */
  async retryDatabaseOperation<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    // Set operation category to DATABASE if not specified
    const opts: RetryOptions = {
      ...options,
      operationCategory: options.operationCategory || OperationCategory.DATABASE,
      // Custom function to determine if a database error is retriable
      isRetriable: (error) => {
        // Retry on connection errors, deadlocks, and serialization failures
        const errorMessage = error.message.toLowerCase();
        return (
          errorMessage.includes('connection') ||
          errorMessage.includes('deadlock') ||
          errorMessage.includes('serialization') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('temporarily unavailable')
        );
      },
    };
    
    return this.retry(fn, opts);
  }

  /**
   * Specialized retry function for external API calls
   * 
   * @param fn Function to execute with retry logic
   * @param options Retry options
   * @returns Result of the function execution
   */
  async retryExternalApiCall<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    // Set operation category to EXTERNAL_API if not specified
    const opts: RetryOptions = {
      ...options,
      operationCategory: options.operationCategory || OperationCategory.EXTERNAL_API,
      // Enable circuit breaker by default for external API calls
      useCircuitBreaker: options.useCircuitBreaker !== undefined ? options.useCircuitBreaker : true,
      // Custom function to determine if an API error is retriable
      isRetriable: (error) => {
        // Retry on network errors, timeouts, and 5xx responses
        const errorMessage = error.message.toLowerCase();
        return (
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('econnrefused') ||
          errorMessage.includes('econnreset') ||
          errorMessage.includes('socket hang up') ||
          errorMessage.includes('500') ||
          errorMessage.includes('502') ||
          errorMessage.includes('503') ||
          errorMessage.includes('504')
        );
      },
    };
    
    return this.retry(fn, opts);
  }

  /**
   * Creates a retry decorator that can be applied to class methods
   * 
   * @param options Retry options
   * @returns Method decorator that applies retry logic
   */
  static withRetry(options: RetryOptions = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const retryService = new RetryService(new GamificationLogger(new Logger('RetryDecorator')));
      
      descriptor.value = async function (...args: any[]) {
        return retryService.retry(
          () => originalMethod.apply(this, args),
          {
            ...options,
            // Use method name as part of circuit breaker ID if not provided
            circuitBreakerOptions: {
              ...options.circuitBreakerOptions,
              name: options.circuitBreakerOptions?.name || `${target.constructor.name}.${propertyKey}`,
            },
          }
        );
      };
      
      return descriptor;
    };
  }

  /**
   * Creates a retry decorator with fallback that can be applied to class methods
   * 
   * @param options Retry options
   * @param fallbackFn Function that returns a fallback value when all retries fail
   * @returns Method decorator that applies retry logic with fallback
   */
  static withRetryAndFallback<T>(options: RetryOptions = {}, fallbackFn: (error: Error, context: RetryContext, ...args: any[]) => Promise<T> | T) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const retryService = new RetryService(new GamificationLogger(new Logger('RetryDecorator')));
      
      descriptor.value = async function (...args: any[]) {
        try {
          return await retryService.retry(
            () => originalMethod.apply(this, args),
            {
              ...options,
              // Use method name as part of circuit breaker ID if not provided
              circuitBreakerOptions: {
                ...options.circuitBreakerOptions,
                name: options.circuitBreakerOptions?.name || `${target.constructor.name}.${propertyKey}`,
              },
            }
          );
        } catch (error) {
          // Create retry context for fallback
          const context: RetryContext = {
            retryId: uuidv4(),
            attempt: options.maxAttempts || DEFAULT_RETRY_OPTIONS.maxAttempts!,
            maxAttempts: options.maxAttempts || DEFAULT_RETRY_OPTIONS.maxAttempts!,
            startTime: Date.now(),
            lastError: error,
            succeeded: false,
            totalTimeMs: 0,
          };
          
          // Execute fallback with original arguments
          return fallbackFn.apply(this, [error, context, ...args]);
        }
      };
      
      return descriptor;
    };
  }

  /**
   * Creates a retry decorator specifically for event processing
   * 
   * @param options Retry options
   * @returns Method decorator that applies retry logic for event processing
   */
  static withEventProcessingRetry(options: RetryOptions = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const retryService = new RetryService(new GamificationLogger(new Logger('RetryDecorator')));
      
      descriptor.value = async function (...args: any[]) {
        // Try to extract event metadata from the first argument
        const eventArg = args[0] || {};
        
        // Check if this is a Kafka message handler (common pattern in NestJS Kafka consumers)
        let eventMessage, topic, consumerGroup;
        
        // If the first argument has a 'value' property, it might be a Kafka message
        if (eventArg.value && (eventArg.topic || eventArg.partition !== undefined)) {
          eventMessage = eventArg;
          topic = eventArg.topic;
          
          // Try to extract consumer group from 'this' context if it's a Kafka consumer
          if (this.constructor && this.constructor.name.includes('Consumer')) {
            consumerGroup = this.consumerGroupId || this.groupId || this.constructor.name;
          }
        }
        
        // Extract event data either from the message value or directly from the argument
        const eventData = eventArg.value ? eventArg.value : eventArg;
        
        const eventMetadata = {
          eventId: eventData.eventId || eventData.id || uuidv4(),
          eventType: eventData.type || eventData.eventType || 'unknown',
          userId: eventData.userId || eventData.user_id,
          correlationId: eventData.correlationId || eventData.correlation_id,
          journey: eventData.journey || eventData.journeyType,
          // Add Kafka-specific metadata if available
          eventMessage,
          topic,
          consumerGroup,
        };
        
        return retryService.retryEventProcessing(
          () => originalMethod.apply(this, args),
          eventMetadata,
          {
            ...options,
            operationCategory: options.operationCategory || OperationCategory.EVENT_PROCESSING,
          }
        );
      };
      
      return descriptor;
    };
  }

  /**
   * Merges provided options with defaults and operation category-specific settings
   * 
   * @param options User-provided retry options
   * @returns Merged retry options
   */
  private getRetryOptions(options: RetryOptions): Required<RetryOptions> {
    // Start with default options
    const merged = { ...DEFAULT_RETRY_OPTIONS, ...options };
    
    // If operation category is provided, use its specific settings
    if (merged.operationCategory) {
      merged.maxAttempts = options.maxAttempts ?? MAX_RETRY_ATTEMPTS[merged.operationCategory];
      merged.initialDelayMs = options.initialDelayMs ?? INITIAL_RETRY_DELAY_MS[merged.operationCategory];
      merged.maxDelayMs = options.maxDelayMs ?? MAX_RETRY_DELAY_MS[merged.operationCategory];
      merged.backoffFactor = options.backoffFactor ?? BACKOFF_FACTOR[merged.operationCategory];
      merged.useDlq = options.useDlq ?? DEAD_LETTER_QUEUE.ENABLED[merged.operationCategory];
    }
    
    return merged as Required<RetryOptions>;
  }

  /**
   * Calculates the delay for the next retry attempt based on the retry policy
   * 
   * @param attempt Current attempt number (starting from 1)
   * @param options Retry options
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(attempt: number, options: Required<RetryOptions>): number {
    let delay: number;
    
    switch (options.retryPolicyType) {
      case RetryPolicyType.FIXED:
        delay = options.initialDelayMs;
        break;
        
      case RetryPolicyType.LINEAR:
        delay = options.initialDelayMs * attempt;
        break;
        
      case RetryPolicyType.EXPONENTIAL_BACKOFF:
      default:
        delay = options.initialDelayMs * Math.pow(options.backoffFactor, attempt - 1);
        break;
    }
    
    // Apply jitter if enabled
    if (options.useJitter && options.jitterFactor > 0) {
      const jitterRange = options.jitterFactor * delay;
      const jitterAmount = Math.random() * jitterRange - (jitterRange / 2);
      delay = Math.max(0, delay + jitterAmount);
    }
    
    // Cap at maximum delay
    return Math.min(delay, options.maxDelayMs);
  }

  /**
   * Determines if an error should be retried based on retry options and context
   * 
   * @param error Error that occurred
   * @param context Retry context
   * @param options Retry options
   * @returns Whether the error should be retried
   */
  private shouldRetry(error: Error, context: RetryContext, options: Required<RetryOptions>): boolean {
    // Don't retry if we've reached the maximum number of attempts
    if (context.attempt >= options.maxAttempts) {
      return false;
    }
    
    // Use custom isRetriable function if provided
    if (options.isRetriable) {
      return options.isRetriable(error);
    }
    
    // Default logic: retry on network errors, timeouts, and other transient issues
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('temporarily unavailable') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('socket hang up')
    );
  }

  /**
   * Gets or creates a circuit breaker for the given ID
   * 
   * @param id Circuit breaker ID
   * @param options Retry options
   * @returns Circuit breaker instance
   */
  private getCircuitBreaker(id: string, options: Required<RetryOptions>): CircuitBreaker {
    if (!this.circuitBreakers.has(id)) {
      const category = options.operationCategory;
      const circuitBreakerOptions = {
        name: options.circuitBreakerOptions?.name || id,
        failureThreshold: options.circuitBreakerOptions?.failureThreshold || 5,
        resetTimeout: options.circuitBreakerOptions?.resetTimeoutMs || 30000,
        successThreshold: options.circuitBreakerOptions?.successThreshold || 2,
      };
      
      this.circuitBreakers.set(id, new CircuitBreaker(circuitBreakerOptions));
    }
    
    return this.circuitBreakers.get(id)!;
  }

  /**
   * Handles sending failed operations to the dead letter queue
   * 
   * @param error Error that occurred
   * @param context Retry context
   * @param options Retry options
   */
  private async handleDeadLetterQueue(error: Error, context: RetryContext, options: Required<RetryOptions>): Promise<void> {
    // For event processing operations, we can integrate with the DLQ service
    if (options.operationCategory === OperationCategory.EVENT_PROCESSING && context.metadata?.eventMessage) {
      try {
        // Log the DLQ operation
        this.logger.warn(
          `Sending failed event to DLQ after ${context.attempt} attempts for ${options.operationCategory}`,
          {
            error: error.message,
            retryId: context.retryId,
            attempts: context.attempt,
            totalTimeMs: context.totalTimeMs,
            eventId: context.metadata.eventId,
            eventType: context.metadata.eventType,
          }
        );
        
        // If DLQ service is injected, use it
        if (this.dlqService && typeof this.dlqService.sendToDlq === 'function') {
          await this.dlqService.sendToDlq(
            context.metadata.eventMessage,
            error,
            context.metadata.topic || 'unknown-topic',
            context.metadata.consumerGroup || 'unknown-consumer-group',
            context.attempt
          );
        } 
        // If Kafka producer is available, try to send directly to DLQ topic
        else if (this.kafkaProducer && typeof this.kafkaProducer.send === 'function') {
          const dlqTopic = `${DEAD_LETTER_QUEUE.TOPIC_SUFFIX}.${context.metadata.topic || 'unknown-topic'}`;
          
          // Add DLQ headers to the original message
          const message = {
            ...context.metadata.eventMessage,
            headers: {
              ...context.metadata.eventMessage.headers,
              'dlq-error-type': Buffer.from(error.name),
              'dlq-error-message': Buffer.from(error.message.substring(0, 255)),
              'dlq-retry-count': Buffer.from(context.attempt.toString()),
              'dlq-original-topic': Buffer.from(context.metadata.topic || 'unknown-topic'),
              'dlq-timestamp': Buffer.from(Date.now().toString()),
              'dlq-correlation-id': Buffer.from(context.metadata.correlationId || context.retryId),
            },
          };
          
          await this.kafkaProducer.send({
            topic: dlqTopic,
            messages: [message],
          });
        } else {
          // No DLQ service or Kafka producer available, just log
          this.logger.warn(
            `No DLQ service or Kafka producer available to send failed event to DLQ`,
            {
              error: error.message,
              retryId: context.retryId,
              eventId: context.metadata.eventId,
              eventType: context.metadata.eventType,
            }
          );
        }
      } catch (dlqError) {
        // Log the error but don't throw - we don't want to mask the original error
        this.logger.error(
          `Failed to send to DLQ: ${dlqError.message}`,
          {
            originalError: error.message,
            dlqError: dlqError.message,
            retryId: context.retryId,
          }
        );
      }
    } else {
      // For other operation types, just log the failure
      this.logger.warn(
        `Operation failed after ${context.attempt} attempts for ${options.operationCategory}`,
        {
          error: error.message,
          retryId: context.retryId,
          attempts: context.attempt,
          totalTimeMs: context.totalTimeMs,
        }
      );
    }
  }

  /**
   * Logs a retry attempt
   * 
   * @param error Error that occurred
   * @param context Retry context
   * @param delay Delay before the next retry
   * @param options Retry options
   */
  private logRetryAttempt(error: Error, context: RetryContext, delay: number, options: Required<RetryOptions>): void {
    this.logger.warn(
      `Retry attempt ${context.attempt}/${context.maxAttempts} for ${options.operationCategory} operation, next attempt in ${delay}ms`,
      {
        error: error.message,
        retryId: context.retryId,
        attempt: context.attempt,
        maxAttempts: context.maxAttempts,
        delay,
        elapsedMs: Date.now() - context.startTime,
      }
    );
  }

  /**
   * Logs a successful retry
   * 
   * @param context Retry context
   * @param options Retry options
   */
  private logRetrySuccess(context: RetryContext, options: Required<RetryOptions>): void {
    if (context.attempt > 1) {
      this.logger.log(
        `Operation succeeded after ${context.attempt} attempts for ${options.operationCategory}`,
        {
          retryId: context.retryId,
          attempts: context.attempt,
          totalTimeMs: context.totalTimeMs,
        }
      );
    }
  }

  /**
   * Logs a retry failure
   * 
   * @param error Error that occurred
   * @param context Retry context
   * @param options Retry options
   */
  private logRetryFailure(error: Error, context: RetryContext, options: Required<RetryOptions>): void {
    this.logger.error(
      `Operation failed after ${context.attempt} attempts for ${options.operationCategory}`,
      {
        error: error.message,
        stack: error.stack,
        retryId: context.retryId,
        attempts: context.attempt,
        totalTimeMs: context.totalTimeMs,
      }
    );
  }

  /**
   * Logs a circuit breaker open error
   * 
   * @param error Circuit breaker open error
   * @param context Retry context
   * @param options Retry options
   */
  private logCircuitBreakerOpen(error: CircuitBreakerOpenError, context: RetryContext, options: Required<RetryOptions>): void {
    this.logger.warn(
      `Circuit breaker open for ${options.operationCategory} operation, fast failing`,
      {
        error: error.message,
        retryId: context.retryId,
        attempt: context.attempt,
      }
    );
  }

  /**
   * Creates a delay promise
   * 
   * @param ms Delay in milliseconds
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Utility function to retry an operation with exponential backoff
 * 
 * @param fn Function to execute with retry logic
 * @param options Retry options
 * @returns Result of the function execution
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retryService = new RetryService(new GamificationLogger(new Logger('RetryUtil')));
  return retryService.retry(fn, {
    retryPolicyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
    ...options,
  });
}

/**
 * Utility function to retry an event processing operation
 * 
 * @param fn Function to execute with retry logic
 * @param eventMetadata Event metadata for logging and DLQ integration
 * @param options Retry options
 * @returns Result of the function execution
 */
export async function retryEventProcessing<T>(
  fn: () => Promise<T>,
  eventMetadata: {
    eventId: string;
    eventType: string;
    userId?: string;
    correlationId?: string;
    journey?: string;
    // Optional Kafka message for DLQ integration
    eventMessage?: any;
    topic?: string;
    consumerGroup?: string;
  },
  options: RetryOptions = {}
): Promise<T> {
  const retryService = new RetryService(new GamificationLogger(new Logger('RetryUtil')));
  return retryService.retryEventProcessing(fn, eventMetadata, options);
}

/**
 * Utility function to retry a database operation
 * 
 * @param fn Function to execute with retry logic
 * @param options Retry options
 * @returns Result of the function execution
 */
export async function retryDatabaseOperation<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retryService = new RetryService(new GamificationLogger(new Logger('RetryUtil')));
  return retryService.retryDatabaseOperation(fn, options);
}

/**
 * Utility function to retry an external API call
 * 
 * @param fn Function to execute with retry logic
 * @param options Retry options
 * @returns Result of the function execution
 */
export async function retryExternalApiCall<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retryService = new RetryService(new GamificationLogger(new Logger('RetryUtil')));
  return retryService.retryExternalApiCall(fn, options);
}

/**
 * Decorator for retrying a method with exponential backoff
 * 
 * @param options Retry options
 * @returns Method decorator
 */
export function Retry(options: RetryOptions = {}) {
  return RetryService.withRetry(options);
}

/**
 * Decorator for retrying a method with fallback
 * 
 * @param fallbackFn Function that returns a fallback value when all retries fail
 * @param options Retry options
 * @returns Method decorator
 */
export function RetryWithFallback<T>(fallbackFn: (error: Error, context: RetryContext, ...args: any[]) => Promise<T> | T, options: RetryOptions = {}) {
  return RetryService.withRetryAndFallback(options, fallbackFn);
}

/**
 * Decorator for retrying an event processing method
 * 
 * @param options Retry options
 * @returns Method decorator
 */
export function RetryEventProcessing(options: RetryOptions = {}) {
  return RetryService.withEventProcessingRetry(options);
}

/**
 * Decorator for retrying a database operation method
 * 
 * @param options Retry options
 * @returns Method decorator
 */
export function RetryDatabaseOperation(options: RetryOptions = {}) {
  return RetryService.withRetry({
    operationCategory: OperationCategory.DATABASE,
    ...options,
    isRetriable: (error) => {
      // Retry on connection errors, deadlocks, and serialization failures
      const errorMessage = error.message.toLowerCase();
      return (
        errorMessage.includes('connection') ||
        errorMessage.includes('deadlock') ||
        errorMessage.includes('serialization') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('temporarily unavailable')
      );
    },
  });
}

/**
 * Decorator for retrying an external API call method
 * 
 * @param options Retry options
 * @returns Method decorator
 */
export function RetryExternalApiCall(options: RetryOptions = {}) {
  return RetryService.withRetry({
    operationCategory: OperationCategory.EXTERNAL_API,
    useCircuitBreaker: true,
    ...options,
    isRetriable: (error) => {
      // Retry on network errors, timeouts, and 5xx responses
      const errorMessage = error.message.toLowerCase();
      return (
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('500') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503') ||
        errorMessage.includes('504')
      );
    },
  });
}

/**
 * Determines if an error is retriable based on common patterns
 * 
 * @param error The error to check
 * @returns Whether the error is retriable
 */
export function isRetriableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  
  // Network and connection errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('socket hang up')
  ) {
    return true;
  }
  
  // Timeout errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out')
  ) {
    return true;
  }
  
  // Temporary unavailability
  if (
    errorMessage.includes('temporarily unavailable') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('try again')
  ) {
    return true;
  }
  
  // Database-specific errors
  if (
    errorMessage.includes('deadlock') ||
    errorMessage.includes('serialization') ||
    errorMessage.includes('lock wait timeout')
  ) {
    return true;
  }
  
  // HTTP 5xx errors
  if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504')
  ) {
    return true;
  }
  
  return false;
}
/**
 * Provides utilities for implementing resilient event processing with retry mechanisms.
 * This module includes functions for configuring retry policies, implementing exponential backoff,
 * and handling circuit breakers to prevent cascading failures.
 *
 * @module retry-utils
 */

import { Logger } from '@nestjs/common';
import { Span, SpanOptions } from '@austa/tracing';
import { CircuitBreakerOptions } from '@austa/errors/middleware/circuit-breaker.middleware';
import { KafkaProducer } from '../kafka/kafka.producer';
import { BaseEvent } from '../interfaces/base-event.interface';
import { KafkaEvent } from '../interfaces/kafka-event.interface';

/**
 * Enum representing the different retry strategies available.
 */
export enum RetryStrategy {
  /**
   * Exponential backoff with jitter - increases delay exponentially between retries
   * with a random jitter to prevent thundering herd problems.
   */
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  
  /**
   * Fixed interval - retries at a constant time interval.
   */
  FIXED_INTERVAL = 'fixed_interval',
  
  /**
   * Linear backoff - increases delay linearly between retries.
   */
  LINEAR_BACKOFF = 'linear_backoff',
}

/**
 * Enum representing the different journey types for journey-specific retry configurations.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  NOTIFICATION = 'notification',
}

/**
 * Interface defining the retry policy configuration.
 */
export interface RetryPolicyConfig {
  /**
   * Maximum number of retry attempts before giving up.
   */
  maxRetries: number;
  
  /**
   * Initial delay in milliseconds before the first retry.
   */
  initialDelayMs: number;
  
  /**
   * Maximum delay in milliseconds between retries.
   */
  maxDelayMs: number;
  
  /**
   * The retry strategy to use.
   */
  strategy: RetryStrategy;
  
  /**
   * Factor by which the delay increases with each retry (for exponential and linear backoff).
   */
  backoffFactor?: number;
  
  /**
   * Maximum jitter in milliseconds to add to the delay (to prevent thundering herd).
   */
  jitterMs?: number;
  
  /**
   * List of error types that should trigger a retry.
   */
  retryableErrors?: string[];
  
  /**
   * List of error types that should not trigger a retry.
   */
  nonRetryableErrors?: string[];
  
  /**
   * Dead letter queue topic name for failed events after all retries are exhausted.
   */
  deadLetterQueueTopic?: string;
  
  /**
   * Whether to enable circuit breaker for this retry policy.
   */
  enableCircuitBreaker?: boolean;
  
  /**
   * Circuit breaker configuration if enabled.
   */
  circuitBreakerOptions?: CircuitBreakerOptions;
}

/**
 * Interface for tracking retry attempts.
 */
export interface RetryContext {
  /**
   * Current retry attempt number (0-based).
   */
  attempt: number;
  
  /**
   * Timestamp when the first attempt was made.
   */
  firstAttemptTimestamp: number;
  
  /**
   * Timestamp when the last attempt was made.
   */
  lastAttemptTimestamp: number;
  
  /**
   * List of errors encountered during previous attempts.
   */
  errors: Error[];
  
  /**
   * The retry policy being used.
   */
  policy: RetryPolicyConfig;
  
  /**
   * Whether the circuit breaker is currently open.
   */
  circuitBreakerOpen?: boolean;
  
  /**
   * Trace context for distributed tracing.
   */
  traceContext?: Record<string, any>;
  
  /**
   * Journey type for journey-specific retry handling.
   */
  journeyType?: JourneyType;
}

/**
 * Interface for the result of a retry operation.
 */
export interface RetryResult<T> {
  /**
   * Whether the operation was successful.
   */
  success: boolean;
  
  /**
   * The result of the operation if successful.
   */
  result?: T;
  
  /**
   * The error if the operation failed.
   */
  error?: Error;
  
  /**
   * The retry context after the operation.
   */
  retryContext: RetryContext;
  
  /**
   * Whether the event was sent to the dead letter queue.
   */
  sentToDLQ?: boolean;
}

/**
 * Default retry policies for different journey types.
 */
export const DEFAULT_RETRY_POLICIES: Record<JourneyType, RetryPolicyConfig> = {
  [JourneyType.HEALTH]: {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 10000,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    backoffFactor: 2,
    jitterMs: 100,
    deadLetterQueueTopic: 'health-events-dlq',
    enableCircuitBreaker: true,
    circuitBreakerOptions: {
      failureThreshold: 5,
      resetTimeout: 30000,
      rollingCountWindow: 60000,
    },
  },
  [JourneyType.CARE]: {
    maxRetries: 3,
    initialDelayMs: 200,
    maxDelayMs: 5000,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    backoffFactor: 2,
    jitterMs: 50,
    deadLetterQueueTopic: 'care-events-dlq',
    enableCircuitBreaker: true,
    circuitBreakerOptions: {
      failureThreshold: 3,
      resetTimeout: 20000,
      rollingCountWindow: 30000,
    },
  },
  [JourneyType.PLAN]: {
    maxRetries: 7,
    initialDelayMs: 300,
    maxDelayMs: 15000,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    backoffFactor: 1.5,
    jitterMs: 150,
    deadLetterQueueTopic: 'plan-events-dlq',
    enableCircuitBreaker: true,
    circuitBreakerOptions: {
      failureThreshold: 5,
      resetTimeout: 60000,
      rollingCountWindow: 120000,
    },
  },
  [JourneyType.GAMIFICATION]: {
    maxRetries: 10,
    initialDelayMs: 50,
    maxDelayMs: 5000,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    backoffFactor: 2,
    jitterMs: 25,
    deadLetterQueueTopic: 'gamification-events-dlq',
    enableCircuitBreaker: false,
  },
  [JourneyType.NOTIFICATION]: {
    maxRetries: 15,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    backoffFactor: 2,
    jitterMs: 500,
    deadLetterQueueTopic: 'notification-events-dlq',
    enableCircuitBreaker: true,
    circuitBreakerOptions: {
      failureThreshold: 10,
      resetTimeout: 120000,
      rollingCountWindow: 300000,
    },
  },
};

// Circuit breaker state storage (in-memory for simplicity)
const circuitBreakerState: Record<string, {
  open: boolean;
  failureCount: number;
  lastFailureTime: number;
  resetTimeout: number;
}> = {};

/**
 * Creates a new retry context with default values.
 * 
 * @param policy - The retry policy to use
 * @param journeyType - Optional journey type for journey-specific handling
 * @returns A new retry context
 */
export function createRetryContext(policy: RetryPolicyConfig, journeyType?: JourneyType): RetryContext {
  const now = Date.now();
  return {
    attempt: 0,
    firstAttemptTimestamp: now,
    lastAttemptTimestamp: now,
    errors: [],
    policy,
    journeyType,
    circuitBreakerOpen: false,
    traceContext: {},
  };
}

/**
 * Gets the appropriate retry policy for a given journey type.
 * 
 * @param journeyType - The journey type
 * @param customPolicy - Optional custom policy to override defaults
 * @returns The retry policy to use
 */
export function getRetryPolicy(journeyType?: JourneyType, customPolicy?: Partial<RetryPolicyConfig>): RetryPolicyConfig {
  let basePolicy: RetryPolicyConfig;
  
  if (journeyType && journeyType in DEFAULT_RETRY_POLICIES) {
    basePolicy = DEFAULT_RETRY_POLICIES[journeyType];
  } else {
    // Default to gamification policy if no journey type specified
    basePolicy = DEFAULT_RETRY_POLICIES[JourneyType.GAMIFICATION];
  }
  
  if (customPolicy) {
    return { ...basePolicy, ...customPolicy };
  }
  
  return basePolicy;
}

/**
 * Calculates the delay for the next retry attempt based on the retry policy and context.
 * 
 * @param context - The current retry context
 * @returns The delay in milliseconds before the next retry
 */
export function calculateRetryDelay(context: RetryContext): number {
  const { attempt, policy } = context;
  const { initialDelayMs, maxDelayMs, strategy, backoffFactor = 2, jitterMs = 0 } = policy;
  
  let delay: number;
  
  switch (strategy) {
    case RetryStrategy.EXPONENTIAL_BACKOFF:
      delay = initialDelayMs * Math.pow(backoffFactor, attempt);
      break;
    case RetryStrategy.LINEAR_BACKOFF:
      delay = initialDelayMs + (initialDelayMs * backoffFactor * attempt);
      break;
    case RetryStrategy.FIXED_INTERVAL:
    default:
      delay = initialDelayMs;
      break;
  }
  
  // Apply maximum delay cap
  delay = Math.min(delay, maxDelayMs);
  
  // Add jitter if specified
  if (jitterMs > 0) {
    const jitter = Math.random() * jitterMs;
    delay += jitter;
  }
  
  return delay;
}

/**
 * Checks if an error is retryable based on the retry policy.
 * 
 * @param error - The error to check
 * @param policy - The retry policy
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: Error, policy: RetryPolicyConfig): boolean {
  // If retryableErrors is specified, only retry those specific errors
  if (policy.retryableErrors && policy.retryableErrors.length > 0) {
    return policy.retryableErrors.some(errorType => 
      error.name === errorType || error.constructor.name === errorType
    );
  }
  
  // If nonRetryableErrors is specified, don't retry those specific errors
  if (policy.nonRetryableErrors && policy.nonRetryableErrors.length > 0) {
    return !policy.nonRetryableErrors.some(errorType => 
      error.name === errorType || error.constructor.name === errorType
    );
  }
  
  // By default, retry all errors
  return true;
}

/**
 * Checks if the circuit breaker is open for a given service.
 * 
 * @param serviceName - The name of the service to check
 * @returns Whether the circuit breaker is open
 */
export function isCircuitBreakerOpen(serviceName: string): boolean {
  const state = circuitBreakerState[serviceName];
  if (!state || !state.open) {
    return false;
  }
  
  // Check if reset timeout has elapsed
  const now = Date.now();
  if (state.open && now - state.lastFailureTime > state.resetTimeout) {
    // Reset to half-open state
    state.open = false;
    return false;
  }
  
  return state.open;
}

/**
 * Records a failure for the circuit breaker.
 * 
 * @param serviceName - The name of the service
 * @param options - Circuit breaker options
 * @returns Whether the circuit breaker is now open
 */
export function recordCircuitBreakerFailure(
  serviceName: string, 
  options: CircuitBreakerOptions
): boolean {
  const now = Date.now();
  
  if (!circuitBreakerState[serviceName]) {
    circuitBreakerState[serviceName] = {
      open: false,
      failureCount: 0,
      lastFailureTime: now,
      resetTimeout: options.resetTimeout,
    };
  }
  
  const state = circuitBreakerState[serviceName];
  
  // Reset failure count if outside rolling window
  if (now - state.lastFailureTime > options.rollingCountWindow) {
    state.failureCount = 0;
  }
  
  state.failureCount += 1;
  state.lastFailureTime = now;
  
  // Open circuit if threshold is reached
  if (state.failureCount >= options.failureThreshold) {
    state.open = true;
  }
  
  return state.open;
}

/**
 * Records a success for the circuit breaker.
 * 
 * @param serviceName - The name of the service
 */
export function recordCircuitBreakerSuccess(serviceName: string): void {
  if (circuitBreakerState[serviceName]) {
    circuitBreakerState[serviceName].failureCount = 0;
    circuitBreakerState[serviceName].open = false;
  }
}

/**
 * Sends an event to the dead letter queue.
 * 
 * @param event - The event to send
 * @param error - The error that caused the failure
 * @param retryContext - The retry context
 * @param kafkaProducer - The Kafka producer to use
 * @param logger - Logger instance
 * @returns Promise resolving to whether the event was successfully sent to the DLQ
 */
export async function sendToDeadLetterQueue(
  event: BaseEvent | KafkaEvent,
  error: Error,
  retryContext: RetryContext,
  kafkaProducer: KafkaProducer,
  logger: Logger
): Promise<boolean> {
  try {
    const dlqTopic = retryContext.policy.deadLetterQueueTopic;
    if (!dlqTopic) {
      logger.error(
        `Failed to send event to DLQ: No DLQ topic configured for ${retryContext.journeyType || 'unknown'} journey`,
        { eventId: (event as BaseEvent).eventId || 'unknown', error: error.message }
      );
      return false;
    }
    
    // Create DLQ message with original event and error details
    const dlqMessage = {
      originalEvent: event,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      retryContext: {
        attempts: retryContext.attempt,
        firstAttempt: new Date(retryContext.firstAttemptTimestamp).toISOString(),
        lastAttempt: new Date(retryContext.lastAttemptTimestamp).toISOString(),
        journeyType: retryContext.journeyType,
      },
    };
    
    // Send to DLQ topic
    await kafkaProducer.produce({
      topic: dlqTopic,
      messages: [{
        key: (event as BaseEvent).eventId || 'unknown',
        value: JSON.stringify(dlqMessage),
        headers: {
          'x-retry-count': retryContext.attempt.toString(),
          'x-original-event-type': (event as BaseEvent).type || 'unknown',
          'x-failure-reason': error.message,
          'x-journey-type': retryContext.journeyType || 'unknown',
        },
      }],
    });
    
    logger.log(
      `Event sent to DLQ ${dlqTopic} after ${retryContext.attempt} failed attempts`,
      { eventId: (event as BaseEvent).eventId || 'unknown', journeyType: retryContext.journeyType }
    );
    
    return true;
  } catch (dlqError) {
    logger.error(
      `Failed to send event to DLQ: ${dlqError.message}`,
      { eventId: (event as BaseEvent).eventId || 'unknown', originalError: error.message }
    );
    return false;
  }
}

/**
 * Executes an operation with retry logic based on the provided retry policy.
 * 
 * @param operation - The async operation to execute
 * @param retryContext - The retry context
 * @param logger - Logger instance
 * @param kafkaProducer - Optional Kafka producer for DLQ integration
 * @param spanOptions - Optional span options for distributed tracing
 * @returns Promise resolving to the retry result
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retryContext: RetryContext,
  logger: Logger,
  kafkaProducer?: KafkaProducer,
  spanOptions?: SpanOptions
): Promise<RetryResult<T>> {
  const { policy, journeyType } = retryContext;
  const serviceName = journeyType || 'unknown-service';
  
  // Check circuit breaker if enabled
  if (policy.enableCircuitBreaker && policy.circuitBreakerOptions) {
    if (isCircuitBreakerOpen(serviceName)) {
      logger.warn(`Circuit breaker open for ${serviceName}, skipping operation`);
      return {
        success: false,
        error: new Error(`Circuit breaker open for ${serviceName}`),
        retryContext: {
          ...retryContext,
          circuitBreakerOpen: true,
        },
      };
    }
  }
  
  try {
    // Create span for this retry attempt if tracing is enabled
    let span: Span | undefined;
    if (spanOptions) {
      span = new Span({
        ...spanOptions,
        name: `${spanOptions.name || 'retry'}.attempt.${retryContext.attempt + 1}`,
        attributes: {
          ...spanOptions.attributes,
          'retry.attempt': retryContext.attempt + 1,
          'retry.max_attempts': policy.maxRetries,
          'retry.strategy': policy.strategy,
          'journey.type': journeyType,
        },
      });
    }
    
    try {
      // Execute the operation
      const result = await operation();
      
      // Record success for circuit breaker
      if (policy.enableCircuitBreaker) {
        recordCircuitBreakerSuccess(serviceName);
      }
      
      // End span if created
      if (span) {
        span.end();
      }
      
      return {
        success: true,
        result,
        retryContext: {
          ...retryContext,
          attempt: retryContext.attempt + 1,
          lastAttemptTimestamp: Date.now(),
        },
      };
    } catch (error) {
      // End span with error if created
      if (span) {
        span.setStatus({
          code: 'ERROR',
          message: error.message,
        });
        span.end();
      }
      
      // Update retry context
      const updatedContext: RetryContext = {
        ...retryContext,
        attempt: retryContext.attempt + 1,
        lastAttemptTimestamp: Date.now(),
        errors: [...retryContext.errors, error],
      };
      
      // Check if error is retryable
      if (!isRetryableError(error, policy)) {
        logger.warn(
          `Non-retryable error encountered: ${error.message}`,
          { attempt: updatedContext.attempt, journeyType }
        );
        
        // Send to DLQ if available
        let sentToDLQ = false;
        if (kafkaProducer && policy.deadLetterQueueTopic) {
          sentToDLQ = await sendToDeadLetterQueue(
            { type: 'unknown', eventId: 'unknown' } as BaseEvent, // This will be replaced in actual implementation
            error,
            updatedContext,
            kafkaProducer,
            logger
          );
        }
        
        return {
          success: false,
          error,
          retryContext: updatedContext,
          sentToDLQ,
        };
      }
      
      // Check if we've reached max retries
      if (updatedContext.attempt > policy.maxRetries) {
        logger.error(
          `Max retries (${policy.maxRetries}) exceeded: ${error.message}`,
          { attempts: updatedContext.attempt, journeyType }
        );
        
        // Record failure for circuit breaker
        let circuitBreakerOpen = false;
        if (policy.enableCircuitBreaker && policy.circuitBreakerOptions) {
          circuitBreakerOpen = recordCircuitBreakerFailure(serviceName, policy.circuitBreakerOptions);
          updatedContext.circuitBreakerOpen = circuitBreakerOpen;
          
          if (circuitBreakerOpen) {
            logger.warn(`Circuit breaker opened for ${serviceName} after repeated failures`);
          }
        }
        
        // Send to DLQ if available
        let sentToDLQ = false;
        if (kafkaProducer && policy.deadLetterQueueTopic) {
          sentToDLQ = await sendToDeadLetterQueue(
            { type: 'unknown', eventId: 'unknown' } as BaseEvent, // This will be replaced in actual implementation
            error,
            updatedContext,
            kafkaProducer,
            logger
          );
        }
        
        return {
          success: false,
          error,
          retryContext: updatedContext,
          sentToDLQ,
        };
      }
      
      // Calculate delay for next retry
      const delay = calculateRetryDelay(updatedContext);
      
      logger.log(
        `Retrying operation after ${delay}ms (attempt ${updatedContext.attempt} of ${policy.maxRetries})`,
        { error: error.message, journeyType }
      );
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Recursive retry
      return executeWithRetry(operation, updatedContext, logger, kafkaProducer, spanOptions);
    }
  } catch (unexpectedError) {
    // This catches errors in the retry mechanism itself
    logger.error(
      `Unexpected error in retry mechanism: ${unexpectedError.message}`,
      { journeyType }
    );
    
    return {
      success: false,
      error: unexpectedError,
      retryContext,
    };
  }
}

/**
 * Retries an event processing operation with the specified retry policy.
 * 
 * @param event - The event to process
 * @param processor - The function that processes the event
 * @param journeyType - Optional journey type for journey-specific handling
 * @param customPolicy - Optional custom retry policy
 * @param logger - Logger instance
 * @param kafkaProducer - Optional Kafka producer for DLQ integration
 * @param spanOptions - Optional span options for distributed tracing
 * @returns Promise resolving to the retry result
 */
export async function retryEventProcessing<T, E extends BaseEvent>(
  event: E,
  processor: (event: E) => Promise<T>,
  journeyType?: JourneyType,
  customPolicy?: Partial<RetryPolicyConfig>,
  logger?: Logger,
  kafkaProducer?: KafkaProducer,
  spanOptions?: SpanOptions
): Promise<RetryResult<T>> {
  // Use provided logger or create a default one
  const loggerInstance = logger || new Logger('RetryUtils');
  
  // Get appropriate retry policy
  const policy = getRetryPolicy(journeyType, customPolicy);
  
  // Create retry context
  const retryContext = createRetryContext(policy, journeyType);
  
  // Create span options if not provided
  const spanOpts = spanOptions || {
    name: `process.${event.type}`,
    attributes: {
      'event.id': event.eventId,
      'event.type': event.type,
      'journey.type': journeyType,
    },
  };
  
  // Execute with retry
  return executeWithRetry(
    () => processor(event),
    retryContext,
    loggerInstance,
    kafkaProducer,
    spanOpts
  );
}

/**
 * Creates a wrapper function that adds retry capabilities to any async function.
 * 
 * @param journeyType - Optional journey type for journey-specific handling
 * @param customPolicy - Optional custom retry policy
 * @param logger - Logger instance
 * @param kafkaProducer - Optional Kafka producer for DLQ integration
 * @returns A function that wraps the original function with retry capabilities
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  journeyType?: JourneyType,
  customPolicy?: Partial<RetryPolicyConfig>,
  logger?: Logger,
  kafkaProducer?: KafkaProducer
): (fn: T) => (...args: Parameters<T>) => Promise<RetryResult<Awaited<ReturnType<T>>>> {
  return (fn: T) => {
    return async (...args: Parameters<T>): Promise<RetryResult<Awaited<ReturnType<T>>>> => {
      // Use provided logger or create a default one
      const loggerInstance = logger || new Logger('RetryUtils');
      
      // Get appropriate retry policy
      const policy = getRetryPolicy(journeyType, customPolicy);
      
      // Create retry context
      const retryContext = createRetryContext(policy, journeyType);
      
      // Execute with retry
      return executeWithRetry(
        () => fn(...args),
        retryContext,
        loggerInstance,
        kafkaProducer
      );
    };
  };
}
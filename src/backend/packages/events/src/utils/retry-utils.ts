/**
 * Utility functions for implementing resilient event processing with retry mechanisms.
 * Provides configurable retry policies, exponential backoff, circuit breakers, and dead letter queue integration.
 * 
 * @module retry-utils
 */

import { Logger } from '@nestjs/common';
import { BaseEvent } from '../interfaces/base-event.interface';
import { RetryPolicy, RetryOptions, RetryResult } from '../errors/retry-policies';
import { EventError, EventProcessingError, EventValidationError } from '../errors/event-errors';
import { DLQService } from '../errors/dlq';
import { KafkaService } from '../kafka/kafka.service';
import { TracingService } from '@austa/tracing';
import { JourneyType } from '../interfaces/journey-events.interface';

/**
 * Default logger for retry operations
 */
const logger = new Logger('RetryUtils');

/**
 * Configuration for retry operations
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff factor for exponential backoff */
  backoffFactor: number;
  /** Whether to add jitter to retry delays */
  useJitter: boolean;
  /** Circuit breaker failure threshold */
  circuitBreakerThreshold: number;
  /** Circuit breaker reset timeout in milliseconds */
  circuitBreakerResetTimeoutMs: number;
}

/**
 * Journey-specific retry configurations
 */
export const JOURNEY_RETRY_CONFIGS: Record<JourneyType, RetryConfig> = {
  HEALTH: {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 10000,
    backoffFactor: 2,
    useJitter: true,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTimeoutMs: 30000,
  },
  CARE: {
    maxRetries: 3,
    initialDelayMs: 200,
    maxDelayMs: 5000,
    backoffFactor: 2,
    useJitter: true,
    circuitBreakerThreshold: 3,
    circuitBreakerResetTimeoutMs: 15000,
  },
  PLAN: {
    maxRetries: 7,
    initialDelayMs: 500,
    maxDelayMs: 30000,
    backoffFactor: 1.5,
    useJitter: true,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTimeoutMs: 60000,
  },
  GAMIFICATION: {
    maxRetries: 5,
    initialDelayMs: 200,
    maxDelayMs: 8000,
    backoffFactor: 2,
    useJitter: true,
    circuitBreakerThreshold: 10,
    circuitBreakerResetTimeoutMs: 30000,
  },
  NOTIFICATION: {
    maxRetries: 10,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    backoffFactor: 2,
    useJitter: true,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTimeoutMs: 60000,
  },
};

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 200,
  maxDelayMs: 10000,
  backoffFactor: 2,
  useJitter: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTimeoutMs: 30000,
};

/**
 * Circuit breaker state for different services/operations
 */
const circuitBreakers: Record<string, {
  failures: number;
  open: boolean;
  lastFailure: number;
  resetTimeout: number;
}> = {};

/**
 * Calculates the delay for the next retry attempt using exponential backoff
 * 
 * @param attempt Current retry attempt number (0-based)
 * @param config Retry configuration
 * @returns Delay in milliseconds for the next retry
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const { initialDelayMs, maxDelayMs, backoffFactor, useJitter } = config;
  
  // Calculate exponential backoff
  let delay = initialDelayMs * Math.pow(backoffFactor, attempt);
  
  // Apply jitter if enabled (helps prevent thundering herd problem)
  if (useJitter) {
    // Add random jitter between -25% and +25%
    const jitterFactor = 0.5 + Math.random();
    delay = delay * jitterFactor;
  }
  
  // Ensure delay doesn't exceed maximum
  return Math.min(delay, maxDelayMs);
}

/**
 * Checks if the circuit breaker is open for a specific operation
 * 
 * @param operationKey Unique identifier for the operation
 * @param config Retry configuration
 * @returns True if the circuit is open (requests should fail fast)
 */
export function isCircuitOpen(operationKey: string, config: RetryConfig): boolean {
  if (!circuitBreakers[operationKey]) {
    return false;
  }
  
  const breaker = circuitBreakers[operationKey];
  
  // If circuit is open, check if reset timeout has elapsed
  if (breaker.open) {
    const now = Date.now();
    if (now - breaker.lastFailure > breaker.resetTimeout) {
      // Reset circuit to half-open state
      breaker.open = false;
      breaker.failures = 0;
      logger.log(`Circuit breaker for ${operationKey} reset to closed state`);
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Records a failure for a specific operation and potentially opens the circuit
 * 
 * @param operationKey Unique identifier for the operation
 * @param config Retry configuration
 * @returns True if the circuit was opened as a result of this failure
 */
export function recordFailure(operationKey: string, config: RetryConfig): boolean {
  if (!circuitBreakers[operationKey]) {
    circuitBreakers[operationKey] = {
      failures: 0,
      open: false,
      lastFailure: 0,
      resetTimeout: config.circuitBreakerResetTimeoutMs,
    };
  }
  
  const breaker = circuitBreakers[operationKey];
  breaker.failures += 1;
  breaker.lastFailure = Date.now();
  
  // Check if threshold is reached
  if (breaker.failures >= config.circuitBreakerThreshold && !breaker.open) {
    breaker.open = true;
    logger.warn(`Circuit breaker for ${operationKey} opened after ${breaker.failures} failures`);
    return true;
  }
  
  return false;
}

/**
 * Records a success for a specific operation and resets the failure count
 * 
 * @param operationKey Unique identifier for the operation
 */
export function recordSuccess(operationKey: string): void {
  if (circuitBreakers[operationKey]) {
    circuitBreakers[operationKey].failures = 0;
    circuitBreakers[operationKey].open = false;
  }
}

/**
 * Determines if an error is retryable based on its type and context
 * 
 * @param error The error to check
 * @param attempt Current retry attempt number (0-based)
 * @param config Retry configuration
 * @returns True if the error should be retried
 */
export function isRetryableError(error: Error, attempt: number, config: RetryConfig): boolean {
  // Don't retry if we've reached the maximum attempts
  if (attempt >= config.maxRetries) {
    return false;
  }
  
  // Handle specific error types
  if (error instanceof EventValidationError) {
    // Validation errors are not retryable
    return false;
  }
  
  if (error instanceof EventProcessingError) {
    // Check if the processing error is marked as retryable
    return error.retryable;
  }
  
  if (error instanceof EventError) {
    // Other event errors are generally retryable
    return true;
  }
  
  // Network and system errors are generally retryable
  if (
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ECONNRESET') ||
    error.message.includes('ESOCKETTIMEDOUT') ||
    error.message.includes('socket hang up') ||
    error.message.includes('network error')
  ) {
    return true;
  }
  
  // Database transient errors
  if (
    error.message.includes('deadlock') ||
    error.message.includes('lock timeout') ||
    error.message.includes('too many connections') ||
    error.message.includes('connection pool')
  ) {
    return true;
  }
  
  // Default to not retrying unknown errors
  return false;
}

/**
 * Executes a function with retry logic using exponential backoff
 * 
 * @param operation Function to execute with retry logic
 * @param operationKey Unique identifier for the operation (for circuit breaker)
 * @param config Retry configuration
 * @param tracingService Optional tracing service for distributed tracing
 * @returns Promise resolving to the operation result
 * @throws The last error encountered if all retries fail
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationKey: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  tracingService?: TracingService,
): Promise<T> {
  let attempt = 0;
  let lastError: Error;
  
  // Create a span for the retry operation if tracing is available
  const span = tracingService?.startSpan(`retry:${operationKey}`);
  
  try {
    // Check if circuit breaker is open
    if (isCircuitOpen(operationKey, config)) {
      const error = new Error(`Circuit breaker open for ${operationKey}`);
      span?.setAttributes({
        'retry.circuit_breaker': 'open',
        'retry.operation': operationKey,
      });
      span?.recordException(error);
      throw error;
    }
    
    while (true) {
      try {
        // Set span attributes for current attempt
        span?.setAttributes({
          'retry.attempt': attempt,
          'retry.operation': operationKey,
        });
        
        // Execute the operation
        const result = await operation();
        
        // Record success for circuit breaker
        recordSuccess(operationKey);
        
        // Set success attribute on span
        span?.setAttributes({
          'retry.success': true,
          'retry.attempts_used': attempt,
        });
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Record the error in the span
        span?.recordException(error);
        span?.setAttributes({
          'retry.error': error.message,
          'retry.attempt': attempt,
        });
        
        // Check if we should retry
        if (!isRetryableError(error, attempt, config)) {
          // Record failure for circuit breaker
          recordFailure(operationKey, config);
          
          span?.setAttributes({
            'retry.retryable': false,
            'retry.circuit_breaker.failures': circuitBreakers[operationKey]?.failures || 0,
          });
          
          throw error;
        }
        
        // Calculate delay for next retry
        const delay = calculateBackoffDelay(attempt, config);
        
        logger.debug(
          `Retry attempt ${attempt + 1}/${config.maxRetries} for ${operationKey} after ${delay}ms: ${error.message}`,
        );
        
        span?.setAttributes({
          'retry.delay_ms': delay,
          'retry.next_attempt': attempt + 1,
          'retry.retryable': true,
        });
        
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        attempt += 1;
      }
    }
  } finally {
    span?.end();
  }
}

/**
 * Wraps an event processing function with retry logic and DLQ handling
 * 
 * @param processEvent Function that processes an event
 * @param event The event to process
 * @param journeyType The journey type for configuration selection
 * @param dlqService Dead letter queue service for handling failed events
 * @param kafkaService Kafka service for producing DLQ messages
 * @param tracingService Optional tracing service for distributed tracing
 * @param customLogger Optional custom logger
 * @returns Promise resolving to the processing result
 */
export async function processEventWithRetry<T extends BaseEvent, R>(
  processEvent: (event: T) => Promise<R>,
  event: T,
  journeyType: JourneyType,
  dlqService: DLQService,
  kafkaService: KafkaService,
  tracingService?: TracingService,
  customLogger?: Logger,
): Promise<R> {
  const log = customLogger || logger;
  const config = JOURNEY_RETRY_CONFIGS[journeyType] || DEFAULT_RETRY_CONFIG;
  const operationKey = `process_event:${journeyType}:${event.type}`;
  
  try {
    return await executeWithRetry(
      () => processEvent(event),
      operationKey,
      config,
      tracingService,
    );
  } catch (error) {
    log.error(
      `Failed to process ${journeyType} event ${event.type} after ${config.maxRetries} retries: ${error.message}`,
      error.stack,
    );
    
    // Send to dead letter queue
    try {
      await dlqService.sendToDLQ(event, error, journeyType, kafkaService);
      log.log(`Sent failed ${journeyType} event ${event.type} to DLQ`);
    } catch (dlqError) {
      log.error(
        `Failed to send ${journeyType} event ${event.type} to DLQ: ${dlqError.message}`,
        dlqError.stack,
      );
    }
    
    throw error;
  }
}

/**
 * Creates a retry policy based on journey type
 * 
 * @param journeyType The journey type for configuration selection
 * @param customOptions Optional custom retry options to override defaults
 * @returns A configured RetryPolicy instance
 */
export function createJourneyRetryPolicy(
  journeyType: JourneyType,
  customOptions?: Partial<RetryOptions>,
): RetryPolicy {
  const config = JOURNEY_RETRY_CONFIGS[journeyType] || DEFAULT_RETRY_CONFIG;
  
  // Convert config to RetryOptions
  const options: RetryOptions = {
    maxRetries: config.maxRetries,
    initialDelayMs: config.initialDelayMs,
    maxDelayMs: config.maxDelayMs,
    backoffFactor: config.backoffFactor,
    useJitter: config.useJitter,
    ...customOptions,
  };
  
  return new RetryPolicy(options);
}

/**
 * Decorator factory for adding retry logic to class methods
 * 
 * @param journeyType The journey type for configuration selection
 * @param operationKey Optional custom operation key (defaults to method name)
 * @param customConfig Optional custom retry configuration
 * @returns Method decorator that adds retry logic
 */
export function WithRetry(
  journeyType: JourneyType,
  operationKey?: string,
  customConfig?: Partial<RetryConfig>,
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodOperationKey = operationKey || `${target.constructor.name}.${propertyKey}`;
    const config = {
      ...JOURNEY_RETRY_CONFIGS[journeyType] || DEFAULT_RETRY_CONFIG,
      ...customConfig,
    };
    
    descriptor.value = async function (...args: any[]) {
      return executeWithRetry(
        () => originalMethod.apply(this, args),
        methodOperationKey,
        config,
        this.tracingService, // Assumes tracingService is available on the instance
      );
    };
    
    return descriptor;
  };
}

/**
 * Resets all circuit breakers (useful for testing)
 */
export function resetAllCircuitBreakers(): void {
  Object.keys(circuitBreakers).forEach(key => {
    circuitBreakers[key] = {
      failures: 0,
      open: false,
      lastFailure: 0,
      resetTimeout: DEFAULT_RETRY_CONFIG.circuitBreakerResetTimeoutMs,
    };
  });
  logger.log('All circuit breakers have been reset');
}

/**
 * Gets the current state of all circuit breakers (useful for monitoring)
 * 
 * @returns Record of circuit breaker states by operation key
 */
export function getCircuitBreakerStates(): Record<string, { open: boolean; failures: number; lastFailure: number }> {
  const states: Record<string, { open: boolean; failures: number; lastFailure: number }> = {};
  
  Object.keys(circuitBreakers).forEach(key => {
    const breaker = circuitBreakers[key];
    states[key] = {
      open: breaker.open,
      failures: breaker.failures,
      lastFailure: breaker.lastFailure,
    };
  });
  
  return states;
}
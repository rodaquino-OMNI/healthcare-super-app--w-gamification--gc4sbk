/**
 * @file retry-utils.ts
 * @description Provides utilities for implementing resilient event processing with retry mechanisms.
 * This module includes functions for configuring retry policies, implementing exponential backoff,
 * and handling circuit breakers to prevent cascading failures.
 */

import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { EventEmitter } from 'events';

// Import from internal packages
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IJourneyEvent } from '../interfaces/journey-events.interface';
import { EventResponse } from '../interfaces/event-response.interface';
import { EventErrorType } from '../errors/event-errors';
import { addEventToDeadLetterQueue } from '../errors/dlq';

// Import OpenTelemetry for distributed tracing
import * as opentelemetry from '@opentelemetry/api';
const tracer = opentelemetry.trace.getTracer('events:retry-utils');

/**
 * Retry policy configuration options
 */
export interface RetryPolicyOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff factor for exponential delay calculation */
  backoffFactor: number;
  /** Whether to add jitter to delay times to prevent thundering herd */
  useJitter: boolean;
  /** List of error types that should not be retried */
  nonRetryableErrors?: EventErrorType[];
  /** Function to determine if an error is retryable */
  isRetryableError?: (error: Error) => boolean;
  /** Whether to use circuit breaker pattern */
  useCircuitBreaker?: boolean;
  /** Circuit breaker failure threshold */
  circuitBreakerThreshold?: number;
  /** Circuit breaker reset timeout in milliseconds */
  circuitBreakerResetTimeoutMs?: number;
  /** Whether to send to dead letter queue after max retries */
  useDLQ?: boolean;
  /** Custom logger instance */
  logger?: Logger;
}

/**
 * Default retry policy options
 */
export const DEFAULT_RETRY_POLICY: RetryPolicyOptions = {
  maxRetries: 5,
  initialDelayMs: 100,
  maxDelayMs: 30000, // 30 seconds
  backoffFactor: 2,
  useJitter: true,
  nonRetryableErrors: [
    EventErrorType.VALIDATION_ERROR,
    EventErrorType.SCHEMA_ERROR,
    EventErrorType.AUTHORIZATION_ERROR
  ],
  isRetryableError: undefined,
  useCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTimeoutMs: 30000, // 30 seconds
  useDLQ: true,
  logger: new Logger('RetryUtils')
};

/**
 * Journey-specific retry policy configurations
 */
export const JOURNEY_RETRY_POLICIES: Record<string, Partial<RetryPolicyOptions>> = {
  health: {
    maxRetries: 3,
    initialDelayMs: 200,
    maxDelayMs: 10000, // 10 seconds
    // Health events are less critical and can use fewer retries
  },
  care: {
    maxRetries: 7,
    initialDelayMs: 100,
    maxDelayMs: 60000, // 60 seconds
    // Care events are critical and need more retries
  },
  plan: {
    maxRetries: 5,
    initialDelayMs: 200,
    maxDelayMs: 30000, // 30 seconds
    // Plan events have medium criticality
  },
  gamification: {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000, // 5 seconds
    // Gamification events are less critical
  },
  notification: {
    maxRetries: 10,
    initialDelayMs: 500,
    maxDelayMs: 3600000, // 1 hour
    // Notifications are very important and need many retries
  }
};

/**
 * Retry state for tracking retry attempts
 */
export interface RetryState {
  /** Current retry attempt number (0-based) */
  attempt: number;
  /** Timestamp of the first attempt */
  firstAttemptTime: number;
  /** Timestamp of the last attempt */
  lastAttemptTime: number;
  /** Delay until the next retry in milliseconds */
  nextDelayMs: number;
  /** Original error that caused the retry */
  originalError?: Error;
  /** List of all errors encountered during retry attempts */
  errors: Error[];
  /** Whether the circuit breaker is open */
  circuitOpen: boolean;
  /** Context data for the retry operation */
  context: Record<string, any>;
}

/**
 * Creates a new retry state
 */
export function createRetryState(): RetryState {
  const now = Date.now();
  return {
    attempt: 0,
    firstAttemptTime: now,
    lastAttemptTime: now,
    nextDelayMs: 0,
    errors: [],
    circuitOpen: false,
    context: {}
  };
}

/**
 * Circuit breaker implementation to prevent cascading failures
 */
export class CircuitBreaker extends EventEmitter {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private resetTimeout: NodeJS.Timeout | null = null;
  private readonly logger: Logger;

  /**
   * Creates a new circuit breaker
   * 
   * @param threshold Number of failures before opening the circuit
   * @param resetTimeoutMs Time in milliseconds before attempting to close the circuit
   * @param logger Optional logger instance
   */
  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeoutMs: number = 30000,
    logger?: Logger
  ) {
    super();
    this.logger = logger || new Logger('CircuitBreaker');
  }

  /**
   * Records a successful operation
   */
  public success(): void {
    if (this.state === 'HALF_OPEN') {
      this.close();
    }
    this.failures = 0;
  }

  /**
   * Records a failed operation
   */
  public failure(): void {
    this.failures++;
    
    if (this.state === 'CLOSED' && this.failures >= this.threshold) {
      this.open();
    }
  }

  /**
   * Checks if the circuit is allowing operations
   */
  public isAllowed(): boolean {
    return this.state !== 'OPEN';
  }

  /**
   * Gets the current state of the circuit
   */
  public getState(): string {
    return this.state;
  }

  /**
   * Opens the circuit
   */
  private open(): void {
    if (this.state !== 'OPEN') {
      this.state = 'OPEN';
      this.logger.warn(`Circuit breaker opened after ${this.failures} failures`);
      this.emit('open');

      this.resetTimeout = setTimeout(() => {
        this.halfOpen();
      }, this.resetTimeoutMs);
    }
  }

  /**
   * Sets the circuit to half-open state
   */
  private halfOpen(): void {
    this.state = 'HALF_OPEN';
    this.logger.log('Circuit breaker half-opened, allowing test request');
    this.emit('half-open');
  }

  /**
   * Closes the circuit
   */
  private close(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.logger.log('Circuit breaker closed, normal operation resumed');
    this.emit('close');

    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
  }

  /**
   * Resets the circuit breaker to closed state
   */
  public reset(): void {
    this.close();
  }
}

// Global circuit breakers for different journeys
const circuitBreakers: Record<string, CircuitBreaker> = {};

/**
 * Gets a circuit breaker for a specific journey
 * 
 * @param journey Journey identifier
 * @param options Circuit breaker options
 * @returns Circuit breaker instance
 */
export function getCircuitBreaker(
  journey: string,
  options: Pick<RetryPolicyOptions, 'circuitBreakerThreshold' | 'circuitBreakerResetTimeoutMs' | 'logger'> = {}
): CircuitBreaker {
  if (!circuitBreakers[journey]) {
    circuitBreakers[journey] = new CircuitBreaker(
      options.circuitBreakerThreshold || DEFAULT_RETRY_POLICY.circuitBreakerThreshold,
      options.circuitBreakerResetTimeoutMs || DEFAULT_RETRY_POLICY.circuitBreakerResetTimeoutMs,
      options.logger
    );
  }
  return circuitBreakers[journey];
}

/**
 * Calculates the next retry delay using exponential backoff with optional jitter
 * 
 * @param attempt Current retry attempt (0-based)
 * @param options Retry policy options
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, options: RetryPolicyOptions): number {
  // Calculate exponential backoff: initialDelay * (backoffFactor ^ attempt)
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffFactor, attempt);
  
  // Apply maximum delay cap
  const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs);
  
  // Apply jitter if enabled (adds or subtracts up to 20% of the delay)
  if (options.useJitter) {
    const jitterFactor = 0.2; // 20% jitter
    const jitterRange = cappedDelay * jitterFactor;
    const jitterAmount = Math.random() * jitterRange * 2 - jitterRange;
    return Math.max(0, Math.floor(cappedDelay + jitterAmount));
  }
  
  return Math.floor(cappedDelay);
}

/**
 * Determines if an error should be retried based on the retry policy
 * 
 * @param error Error to check
 * @param options Retry policy options
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: Error, options: RetryPolicyOptions): boolean {
  // If a custom function is provided, use it
  if (options.isRetryableError) {
    return options.isRetryableError(error);
  }
  
  // Check if the error is in the non-retryable list
  if (options.nonRetryableErrors && options.nonRetryableErrors.length > 0) {
    // Check if the error is an instance of a known error type
    if ('type' in error && typeof (error as any).type === 'string') {
      const errorType = (error as any).type as EventErrorType;
      return !options.nonRetryableErrors.includes(errorType);
    }
  }
  
  // By default, retry network and transient errors
  const isNetworkError = error.message.includes('ECONNREFUSED') || 
                         error.message.includes('ETIMEDOUT') ||
                         error.message.includes('ECONNRESET') ||
                         error.message.includes('ENOTFOUND');
                         
  const isTransientError = error.message.includes('timeout') ||
                           error.message.includes('temporarily unavailable') ||
                           error.message.includes('too many requests') ||
                           error.message.includes('rate limit') ||
                           error.message.includes('overloaded');
                           
  return isNetworkError || isTransientError;
}

/**
 * Creates a retry policy for a specific journey
 * 
 * @param journey Journey identifier (health, care, plan, etc.)
 * @param customOptions Custom retry policy options
 * @returns Configured retry policy options
 */
export function createRetryPolicy(
  journey?: string,
  customOptions: Partial<RetryPolicyOptions> = {}
): RetryPolicyOptions {
  // Start with default options
  const options = { ...DEFAULT_RETRY_POLICY };
  
  // Apply journey-specific options if available
  if (journey && JOURNEY_RETRY_POLICIES[journey]) {
    Object.assign(options, JOURNEY_RETRY_POLICIES[journey]);
  }
  
  // Apply custom options (highest priority)
  Object.assign(options, customOptions);
  
  return options;
}

/**
 * Executes a function with retry logic
 * 
 * @param fn Function to execute with retry logic
 * @param options Retry policy options
 * @returns Promise that resolves with the function result or rejects after max retries
 */
export async function withRetry<T>(
  fn: (state: RetryState) => Promise<T>,
  options: RetryPolicyOptions = DEFAULT_RETRY_POLICY
): Promise<T> {
  const state = createRetryState();
  const logger = options.logger || new Logger('RetryUtils');
  
  // Create a span for the retry operation
  return tracer.startActiveSpan('withRetry', async (span) => {
    try {
      // Set span attributes
      span.setAttribute('retry.max_attempts', options.maxRetries);
      span.setAttribute('retry.initial_delay_ms', options.initialDelayMs);
      span.setAttribute('retry.backoff_factor', options.backoffFactor);
      
      while (true) {
        try {
          // Check circuit breaker if enabled
          if (options.useCircuitBreaker && state.context.journey) {
            const circuitBreaker = getCircuitBreaker(state.context.journey, options);
            if (!circuitBreaker.isAllowed()) {
              const error = new Error(`Circuit breaker open for journey: ${state.context.journey}`);
              logger.warn(`Circuit breaker prevented retry: ${error.message}`);
              span.setAttribute('retry.circuit_breaker', 'open');
              span.recordException(error);
              throw error;
            }
          }
          
          // Execute the function
          const result = await fn(state);
          
          // Record success in circuit breaker if enabled
          if (options.useCircuitBreaker && state.context.journey) {
            const circuitBreaker = getCircuitBreaker(state.context.journey, options);
            circuitBreaker.success();
          }
          
          // Update span with success information
          span.setAttribute('retry.attempts', state.attempt);
          span.setAttribute('retry.success', true);
          
          return result;
        } catch (error) {
          // Store the original error if this is the first attempt
          if (state.attempt === 0) {
            state.originalError = error as Error;
          }
          
          // Add the error to the list of errors
          state.errors.push(error as Error);
          
          // Record failure in circuit breaker if enabled
          if (options.useCircuitBreaker && state.context.journey) {
            const circuitBreaker = getCircuitBreaker(state.context.journey, options);
            circuitBreaker.failure();
          }
          
          // Check if we've reached the maximum number of retries
          if (state.attempt >= options.maxRetries) {
            logger.error(
              `Max retries (${options.maxRetries}) reached for operation`,
              (error as Error).stack
            );
            
            // Update span with failure information
            span.setAttribute('retry.attempts', state.attempt);
            span.setAttribute('retry.success', false);
            span.setAttribute('retry.exhausted', true);
            span.recordException(error as Error);
            
            // Send to dead letter queue if enabled
            if (options.useDLQ && state.context.event) {
              try {
                await addEventToDeadLetterQueue(
                  state.context.event,
                  error as Error,
                  {
                    retryCount: state.attempt,
                    firstAttemptTime: new Date(state.firstAttemptTime).toISOString(),
                    lastAttemptTime: new Date(state.lastAttemptTime).toISOString(),
                    errors: state.errors.map(e => e.message)
                  }
                );
                logger.log(`Event sent to dead letter queue after ${state.attempt} failed attempts`);
              } catch (dlqError) {
                logger.error(
                  `Failed to send event to dead letter queue: ${(dlqError as Error).message}`,
                  (dlqError as Error).stack
                );
              }
            }
            
            throw error;
          }
          
          // Check if the error is retryable
          if (!isRetryableError(error as Error, options)) {
            logger.warn(
              `Non-retryable error encountered: ${(error as Error).message}`,
              (error as Error).stack
            );
            
            // Update span with failure information
            span.setAttribute('retry.attempts', state.attempt);
            span.setAttribute('retry.success', false);
            span.setAttribute('retry.non_retryable', true);
            span.recordException(error as Error);
            
            throw error;
          }
          
          // Calculate the next retry delay
          state.attempt++;
          state.lastAttemptTime = Date.now();
          state.nextDelayMs = calculateBackoffDelay(state.attempt, options);
          
          // Log the retry attempt
          logger.log(
            `Retry attempt ${state.attempt}/${options.maxRetries} after ${state.nextDelayMs}ms: ${(error as Error).message}`
          );
          
          // Update span with retry information
          span.setAttribute('retry.current_attempt', state.attempt);
          span.setAttribute('retry.next_delay_ms', state.nextDelayMs);
          span.addEvent('retry.attempt', { attempt: state.attempt, delay: state.nextDelayMs });
          
          // Wait for the calculated delay
          await new Promise(resolve => setTimeout(resolve, state.nextDelayMs));
        }
      }
    } finally {
      span.end();
    }
  });
}

/**
 * Processes an event with retry logic
 * 
 * @param event Event to process
 * @param processor Function that processes the event
 * @param options Retry policy options
 * @returns Promise that resolves with the processing result or rejects after max retries
 */
export async function processEventWithRetry<T extends IBaseEvent>(
  event: T,
  processor: (event: T) => Promise<EventResponse>,
  options?: Partial<RetryPolicyOptions>
): Promise<EventResponse> {
  // Determine the journey from the event
  const journey = (event as IJourneyEvent).journey || 'default';
  
  // Create a retry policy for the journey
  const retryPolicy = createRetryPolicy(journey, options);
  
  // Process the event with retry logic
  return withRetry(async (state) => {
    // Store the event and journey in the retry state context
    state.context.event = event;
    state.context.journey = journey;
    
    // Process the event
    return processor(event);
  }, retryPolicy);
}

/**
 * Generates a unique idempotency key for an event
 * 
 * @param event Event to generate an idempotency key for
 * @returns Idempotency key string
 */
export function generateIdempotencyKey(event: IBaseEvent): string {
  // Use the event ID if available
  if (event.eventId) {
    return `${event.eventId}`;
  }
  
  // Generate a random key if no event ID is available
  return randomBytes(16).toString('hex');
}

/**
 * Decorator for adding retry logic to a method
 * 
 * @param options Retry policy options
 * @returns Method decorator
 */
export function Retry(options?: Partial<RetryPolicyOptions>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Determine the journey from the first argument if it's an event
      let journey = 'default';
      if (args.length > 0 && args[0] && typeof args[0] === 'object') {
        const potentialEvent = args[0] as Partial<IJourneyEvent>;
        if (potentialEvent.journey) {
          journey = potentialEvent.journey;
        }
      }
      
      // Create a retry policy for the journey
      const retryPolicy = createRetryPolicy(journey, options);
      
      // Execute the method with retry logic
      return withRetry(async (state) => {
        // Store the journey in the retry state context
        state.context.journey = journey;
        
        // If the first argument is an event, store it in the retry state context
        if (args.length > 0 && args[0] && typeof args[0] === 'object') {
          const potentialEvent = args[0] as Partial<IBaseEvent>;
          if (potentialEvent.eventId || potentialEvent.type) {
            state.context.event = potentialEvent as IBaseEvent;
          }
        }
        
        // Execute the original method
        return originalMethod.apply(this, args);
      }, retryPolicy);
    };
    
    return descriptor;
  };
}
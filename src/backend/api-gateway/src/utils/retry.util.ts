/**
 * Retry Utility for API Gateway
 * 
 * Provides retry mechanism utilities for handling transient failures in service communications.
 * Implements configurable retry strategies with exponential backoff, circuit breaking, and timeout handling.
 * 
 * @module retry.util
 */

import { Injectable, Logger } from '@nestjs/common';
import { setTimeout } from 'timers/promises';

/**
 * Enum representing different types of retry strategies
 */
export enum RetryStrategy {
  /**
   * Exponential backoff with jitter for distributed systems
   */
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  
  /**
   * Fixed delay between retry attempts
   */
  FIXED_INTERVAL = 'fixed_interval',
  
  /**
   * Linear increase in delay between retry attempts
   */
  LINEAR_BACKOFF = 'linear_backoff',
}

/**
 * Enum representing different circuit breaker states
 */
export enum CircuitState {
  /**
   * Circuit is closed, requests are allowed through
   */
  CLOSED = 'closed',
  
  /**
   * Circuit is open, requests are blocked
   */
  OPEN = 'open',
  
  /**
   * Circuit is allowing a limited number of test requests through
   */
  HALF_OPEN = 'half_open',
}

/**
 * Interface for retry configuration options
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Initial delay in milliseconds
   */
  initialDelayMs: number;
  
  /**
   * Maximum delay in milliseconds
   */
  maxDelayMs: number;
  
  /**
   * Retry strategy to use
   */
  strategy: RetryStrategy;
  
  /**
   * Factor to multiply delay by for exponential backoff
   */
  backoffFactor?: number;
  
  /**
   * Jitter factor to add randomness to delay (0-1)
   */
  jitterFactor?: number;
  
  /**
   * Timeout in milliseconds for each attempt
   */
  timeoutMs?: number;
  
  /**
   * Whether to use circuit breaker pattern
   */
  useCircuitBreaker?: boolean;
  
  /**
   * Threshold of failures to open circuit
   */
  circuitBreakerThreshold?: number;
  
  /**
   * Reset timeout for circuit breaker in milliseconds
   */
  circuitBreakerResetTimeoutMs?: number;
  
  /**
   * Function to determine if an error is retryable
   */
  retryableErrorDetector?: (error: any) => boolean;
  
  /**
   * Journey identifier for logging context
   */
  journeyContext?: string;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
  backoffFactor: 2,
  jitterFactor: 0.2,
  timeoutMs: 10000,
  useCircuitBreaker: false,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTimeoutMs: 30000,
  retryableErrorDetector: (error: any) => {
    // Default implementation considers network errors and 5xx responses as retryable
    if (error?.name === 'NetworkError') return true;
    if (error?.response?.status >= 500 && error?.response?.status < 600) return true;
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
    return false;
  },
};

/**
 * Journey-specific retry configurations
 */
export const JOURNEY_RETRY_CONFIGS = {
  HEALTH: {
    ...DEFAULT_RETRY_OPTIONS,
    maxRetries: 4,
    initialDelayMs: 200,
    journeyContext: 'health',
  },
  CARE: {
    ...DEFAULT_RETRY_OPTIONS,
    maxRetries: 3,
    initialDelayMs: 150,
    journeyContext: 'care',
  },
  PLAN: {
    ...DEFAULT_RETRY_OPTIONS,
    maxRetries: 2,
    initialDelayMs: 100,
    journeyContext: 'plan',
  },
  GAMIFICATION: {
    ...DEFAULT_RETRY_OPTIONS,
    maxRetries: 5, // More retries for gamification to ensure events are processed
    initialDelayMs: 50,
    journeyContext: 'gamification',
  },
};

/**
 * Interface for circuit breaker state
 */
interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

/**
 * Circuit breaker implementation for handling persistent failures
 */
@Injectable()
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private circuits: Map<string, CircuitBreakerState> = new Map();

  /**
   * Get or create a circuit for a specific service
   * @param serviceKey Unique identifier for the service
   * @returns Circuit breaker state
   */
  private getCircuit(serviceKey: string): CircuitBreakerState {
    if (!this.circuits.has(serviceKey)) {
      this.circuits.set(serviceKey, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      });
    }
    return this.circuits.get(serviceKey)!;
  }

  /**
   * Check if a request can proceed based on circuit state
   * @param serviceKey Unique identifier for the service
   * @param options Circuit breaker options
   * @returns Whether the request can proceed
   */
  canRequest(serviceKey: string, options: RetryOptions): boolean {
    const circuit = this.getCircuit(serviceKey);
    const now = Date.now();

    switch (circuit.state) {
      case CircuitState.CLOSED:
        return true;
      case CircuitState.OPEN:
        if (now >= circuit.nextAttemptTime) {
          // Transition to half-open state
          circuit.state = CircuitState.HALF_OPEN;
          this.logger.log(`Circuit for ${serviceKey} transitioning to HALF_OPEN state`);
          return true;
        }
        return false;
      case CircuitState.HALF_OPEN:
        // In half-open state, allow only one request to test the service
        return true;
      default:
        return true;
    }
  }

  /**
   * Record a successful request
   * @param serviceKey Unique identifier for the service
   */
  recordSuccess(serviceKey: string): void {
    const circuit = this.getCircuit(serviceKey);
    if (circuit.state === CircuitState.HALF_OPEN) {
      // Reset the circuit on successful request in half-open state
      circuit.state = CircuitState.CLOSED;
      circuit.failureCount = 0;
      this.logger.log(`Circuit for ${serviceKey} closed after successful request`);
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failure count on successful request
      circuit.failureCount = 0;
    }
  }

  /**
   * Record a failed request
   * @param serviceKey Unique identifier for the service
   * @param options Circuit breaker options
   */
  recordFailure(serviceKey: string, options: RetryOptions): void {
    const circuit = this.getCircuit(serviceKey);
    const now = Date.now();
    circuit.failureCount++;
    circuit.lastFailureTime = now;

    const threshold = options.circuitBreakerThreshold || DEFAULT_RETRY_OPTIONS.circuitBreakerThreshold!;
    const resetTimeout = options.circuitBreakerResetTimeoutMs || DEFAULT_RETRY_OPTIONS.circuitBreakerResetTimeoutMs!;

    if (circuit.state === CircuitState.HALF_OPEN || (circuit.state === CircuitState.CLOSED && circuit.failureCount >= threshold)) {
      // Open the circuit
      circuit.state = CircuitState.OPEN;
      circuit.nextAttemptTime = now + resetTimeout;
      this.logger.warn(`Circuit for ${serviceKey} opened until ${new Date(circuit.nextAttemptTime).toISOString()}`);
    }
  }

  /**
   * Reset a circuit to closed state
   * @param serviceKey Unique identifier for the service
   */
  resetCircuit(serviceKey: string): void {
    this.circuits.set(serviceKey, {
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    });
    this.logger.log(`Circuit for ${serviceKey} manually reset to CLOSED state`);
  }

  /**
   * Get the current state of a circuit
   * @param serviceKey Unique identifier for the service
   * @returns Current circuit state
   */
  getState(serviceKey: string): CircuitBreakerState {
    return this.getCircuit(serviceKey);
  }
}

/**
 * Retry service for handling retries with various strategies
 */
@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private readonly circuitBreaker = new CircuitBreaker();

  /**
   * Calculate delay for next retry attempt based on strategy
   * @param attempt Current attempt number (0-based)
   * @param options Retry options
   * @returns Delay in milliseconds
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    const {
      initialDelayMs,
      maxDelayMs,
      strategy,
      backoffFactor = DEFAULT_RETRY_OPTIONS.backoffFactor!,
      jitterFactor = DEFAULT_RETRY_OPTIONS.jitterFactor!,
    } = options;

    let delay: number;

    switch (strategy) {
      case RetryStrategy.EXPONENTIAL_BACKOFF:
        // Exponential backoff: initialDelay * (backoffFactor ^ attempt)
        delay = initialDelayMs * Math.pow(backoffFactor, attempt);
        break;
      case RetryStrategy.LINEAR_BACKOFF:
        // Linear backoff: initialDelay * (attempt + 1)
        delay = initialDelayMs * (attempt + 1);
        break;
      case RetryStrategy.FIXED_INTERVAL:
      default:
        // Fixed interval: always use initialDelay
        delay = initialDelayMs;
        break;
    }

    // Apply maximum delay cap
    delay = Math.min(delay, maxDelayMs);

    // Apply jitter to prevent thundering herd problem
    if (jitterFactor > 0) {
      const jitterRange = delay * jitterFactor;
      delay = delay - (jitterRange / 2) + (Math.random() * jitterRange);
    }

    return Math.floor(delay);
  }

  /**
   * Execute a function with retry logic
   * @param fn Function to execute
   * @param options Retry options
   * @param serviceKey Unique identifier for the service (for circuit breaker)
   * @returns Promise with the function result
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    serviceKey?: string
  ): Promise<T> {
    // Merge with default options
    const retryOptions: RetryOptions = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options,
    };

    const {
      maxRetries,
      timeoutMs,
      useCircuitBreaker,
      retryableErrorDetector,
      journeyContext,
    } = retryOptions;

    // Use function name or provided service key for circuit breaker
    const circuitKey = serviceKey || fn.name || 'anonymous';

    // Check circuit breaker if enabled
    if (useCircuitBreaker && !this.circuitBreaker.canRequest(circuitKey, retryOptions)) {
      const errorMessage = `Circuit breaker open for ${circuitKey}`;
      this.logger.error(errorMessage, { journeyContext });
      throw new Error(errorMessage);
    }

    let lastError: any;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Execute the function with timeout if specified
        let result: T;
        if (timeoutMs) {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(timeoutMs).then(() => {
              reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            });
          });

          result = await Promise.race([fn(), timeoutPromise]);
        } else {
          result = await fn();
        }

        // Record success in circuit breaker if enabled
        if (useCircuitBreaker) {
          this.circuitBreaker.recordSuccess(circuitKey);
        }

        return result;
      } catch (error) {
        lastError = error;
        const isRetryable = retryableErrorDetector!(error);

        // Log the error
        this.logger.warn(
          `Attempt ${attempt + 1}/${maxRetries + 1} failed for ${circuitKey}: ${error.message}`,
          { error, attempt, isRetryable, journeyContext }
        );

        // Record failure in circuit breaker if enabled
        if (useCircuitBreaker) {
          this.circuitBreaker.recordFailure(circuitKey, retryOptions);
        }

        // If not retryable or last attempt, throw the error
        if (!isRetryable || attempt >= maxRetries) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, retryOptions);
        this.logger.debug(`Retrying in ${delay}ms`, { attempt, delay, journeyContext });

        // Wait before next attempt
        await setTimeout(delay);
        attempt++;
      }
    }

    // If we've exhausted all retries, throw the last error
    throw lastError;
  }

  /**
   * Get the circuit breaker instance
   * @returns Circuit breaker instance
   */
  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }
}

/**
 * Decorator for applying retry logic to class methods
 * @param options Retry options
 * @param serviceKeyFn Optional function to generate service key from method arguments
 * @returns Method decorator
 */
export function Retry(
  options: Partial<RetryOptions> = {},
  serviceKeyFn?: (...args: any[]) => string
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const retryService = new RetryService();

    descriptor.value = async function (...args: any[]) {
      const serviceKey = serviceKeyFn ? serviceKeyFn(...args) : `${target.constructor.name}.${String(propertyKey)}`;
      
      return retryService.executeWithRetry(
        () => originalMethod.apply(this, args),
        options,
        serviceKey
      );
    };

    return descriptor;
  };
}

/**
 * Utility function to create a retry policy for a specific journey
 * @param journey Journey identifier
 * @param overrides Optional overrides for the journey's retry policy
 * @returns Retry options for the journey
 */
export function createJourneyRetryPolicy(
  journey: keyof typeof JOURNEY_RETRY_CONFIGS,
  overrides: Partial<RetryOptions> = {}
): RetryOptions {
  return {
    ...JOURNEY_RETRY_CONFIGS[journey],
    ...overrides,
  };
}

/**
 * Utility function to determine if an error is retryable based on common patterns
 * @param error Error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are generally retryable
  if (error?.name === 'NetworkError') return true;
  
  // HTTP 5xx errors are generally retryable
  if (error?.response?.status >= 500 && error?.response?.status < 600) return true;
  
  // Common network-related errors
  if (error?.code === 'ECONNREFUSED' || 
      error?.code === 'ECONNRESET' || 
      error?.code === 'ETIMEDOUT' || 
      error?.code === 'EPIPE') return true;
  
  // Timeout errors
  if (error?.message?.includes('timeout') || 
      error?.message?.includes('timed out')) return true;
  
  // Rate limiting (can retry after backoff)
  if (error?.response?.status === 429) return true;
  
  // Check for specific error types from our error package
  if (error?.isTransient === true) return true;
  
  return false;
}

/**
 * Utility function to create a retry policy for HTTP requests
 * @param overrides Optional overrides for the HTTP retry policy
 * @returns Retry options for HTTP requests
 */
export function createHttpRetryPolicy(overrides: Partial<RetryOptions> = {}): RetryOptions {
  return {
    ...DEFAULT_RETRY_OPTIONS,
    maxRetries: 3,
    initialDelayMs: 200,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    retryableErrorDetector: isRetryableError,
    ...overrides,
  };
}

/**
 * Utility function to create a retry policy for database operations
 * @param overrides Optional overrides for the database retry policy
 * @returns Retry options for database operations
 */
export function createDatabaseRetryPolicy(overrides: Partial<RetryOptions> = {}): RetryOptions {
  return {
    ...DEFAULT_RETRY_OPTIONS,
    maxRetries: 2,
    initialDelayMs: 50,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    retryableErrorDetector: (error: any) => {
      // Database-specific retryable errors
      if (error?.code === 'P1001' || // Prisma: Can't reach database server
          error?.code === 'P1002' || // Prisma: Database connection timed out
          error?.code === 'P1008' || // Prisma: Operations timed out
          error?.code === 'P1017' || // Prisma: Server closed the connection
          error?.code === '40001' || // Postgres: Serialization failure
          error?.code === '40P01' || // Postgres: Deadlock detected
          error?.name === 'TransactionError') {
        return true;
      }
      return isRetryableError(error);
    },
    ...overrides,
  };
}

/**
 * Utility function to create a retry policy for external API calls
 * @param overrides Optional overrides for the external API retry policy
 * @returns Retry options for external API calls
 */
export function createExternalApiRetryPolicy(overrides: Partial<RetryOptions> = {}): RetryOptions {
  return {
    ...DEFAULT_RETRY_OPTIONS,
    maxRetries: 4,
    initialDelayMs: 300,
    maxDelayMs: 10000,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    jitterFactor: 0.3, // More jitter for external calls to prevent thundering herd
    useCircuitBreaker: true, // Enable circuit breaker for external APIs
    circuitBreakerThreshold: 5,
    circuitBreakerResetTimeoutMs: 60000, // 1 minute timeout for external APIs
    retryableErrorDetector: isRetryableError,
    ...overrides,
  };
}
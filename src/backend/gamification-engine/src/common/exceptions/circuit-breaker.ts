import { Logger } from '@nestjs/common';
import { ExternalDependencyException } from './external-dependency.exception';

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation, requests flow through
  OPEN = 'OPEN',           // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if service is back online
}

/**
 * Configuration options for circuit breaker
 */
export interface CircuitBreakerOptions {
  failureThreshold?: number;   // Number of failures before opening circuit
  resetTimeout?: number;       // Time in ms before trying half-open state
  halfOpenSuccessThreshold?: number; // Successes needed to close circuit
  timeout?: number;           // Request timeout in ms
  monitorInterval?: number;   // Health check interval in ms
  volumeThreshold?: number;   // Minimum requests before opening circuit
  errorThresholdPercentage?: number; // Percentage of failures to open circuit
}

/**
 * Default circuit breaker options
 */
const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  halfOpenSuccessThreshold: 2,
  timeout: 10000, // 10 seconds
  monitorInterval: 5000, // 5 seconds
  volumeThreshold: 10,
  errorThresholdPercentage: 50,
};

/**
 * Utility class that implements the circuit breaker pattern for external service calls.
 * Provides state management (closed, open, half-open), failure counting, and automatic
 * recovery to prevent cascading failures when external dependencies experience issues.
 */
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private readonly options: Required<CircuitBreakerOptions>;
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private totalRequests: number = 0;
  private failedRequests: number = 0;
  private readonly name: string;
  private monitorInterval?: NodeJS.Timeout;
  
  /**
   * Creates a new CircuitBreaker instance
   * 
   * @param name Identifier for this circuit breaker
   * @param options Configuration options
   */
  constructor(
    name: string,
    options: CircuitBreakerOptions = {},
  ) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Start health monitoring
    this.startMonitoring();
    
    this.logger.log(`Circuit breaker '${this.name}' initialized`, {
      options: this.options,
      state: this.state,
    });
  }
  
  /**
   * Executes a function with circuit breaker protection
   * 
   * @param fn Function to execute
   * @param fallback Optional fallback function to execute if circuit is open
   * @returns Promise resolving to the function result or fallback result
   * @throws CircuitBreakerOpenException if circuit is open and no fallback provided
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    this.totalRequests++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try half-open state
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.toHalfOpen();
      } else if (fallback) {
        this.logger.debug(`Circuit '${this.name}' open, using fallback`);
        return fallback();
      } else {
        this.logger.debug(`Circuit '${this.name}' open, fast failing`);
        throw new CircuitBreakerOpenException(
          `Circuit '${this.name}' is open`,
          this.options.resetTimeout - (Date.now() - this.lastFailureTime),
        );
      }
    }
    
    // If half-open, only allow limited requests through
    if (this.state === CircuitState.HALF_OPEN && this.successCount >= this.options.halfOpenSuccessThreshold) {
      if (fallback) {
        this.logger.debug(`Circuit '${this.name}' half-open with max test requests, using fallback`);
        return fallback();
      } else {
        throw new CircuitBreakerOpenException(
          `Circuit '${this.name}' is half-open and at capacity`,
          this.options.resetTimeout - (Date.now() - this.lastFailureTime),
        );
      }
    }
    
    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn, this.options.timeout);
      
      // Success handling
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure handling
      this.failedRequests++;
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      
      // Use fallback if provided
      if (fallback) {
        this.logger.debug(`Circuit '${this.name}' request failed, using fallback`, {
          error: error instanceof Error ? error.message : String(error),
        });
        return fallback();
      }
      
      // Re-throw the original error
      throw error;
    }
  }
  
  /**
   * Executes a function with a timeout
   * 
   * @param fn Function to execute
   * @param timeoutMs Timeout in milliseconds
   * @returns Promise resolving to the function result
   * @throws TimeoutError if the function takes too long
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      fn().then(
        (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      );
    });
  }
  
  /**
   * Handles successful operations
   */
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.halfOpenSuccessThreshold) {
        this.toClose();
      }
    }
  }
  
  /**
   * Handles failed operations
   * 
   * @param error The error that occurred
   */
  private onFailure(error: Error): void {
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.toOpen();
      return;
    }
    
    this.failureCount++;
    
    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.options.failureThreshold) {
        this.toOpen();
      } else if (
        this.totalRequests >= this.options.volumeThreshold &&
        (this.failedRequests / this.totalRequests) * 100 >= this.options.errorThresholdPercentage
      ) {
        this.toOpen();
      }
    }
    
    this.logger.warn(
      `Circuit '${this.name}' failure: ${error.message}`,
      {
        failureCount: this.failureCount,
        state: this.state,
        errorRate: this.totalRequests > 0 ? (this.failedRequests / this.totalRequests) * 100 : 0,
        error,
      },
    );
  }
  
  /**
   * Transitions the circuit to closed state
   */
  private toClose(): void {
    if (this.state !== CircuitState.CLOSED) {
      this.logger.log(`Circuit '${this.name}' state changed from ${this.state} to ${CircuitState.CLOSED}`);
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.successCount = 0;
      this.failedRequests = 0;
      this.totalRequests = 0;
    }
  }
  
  /**
   * Transitions the circuit to open state
   */
  private toOpen(): void {
    if (this.state !== CircuitState.OPEN) {
      this.logger.warn(`Circuit '${this.name}' state changed from ${this.state} to ${CircuitState.OPEN}`, {
        failureCount: this.failureCount,
        totalRequests: this.totalRequests,
        failedRequests: this.failedRequests,
        errorRate: this.totalRequests > 0 ? (this.failedRequests / this.totalRequests) * 100 : 0,
      });
      
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      this.lastFailureTime = Date.now();
    }
  }
  
  /**
   * Transitions the circuit to half-open state
   */
  private toHalfOpen(): void {
    if (this.state !== CircuitState.HALF_OPEN) {
      this.logger.log(`Circuit '${this.name}' state changed from ${this.state} to ${CircuitState.HALF_OPEN}`);
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
  }
  
  /**
   * Starts the health monitoring interval
   */
  private startMonitoring(): void {
    if (this.options.monitorInterval > 0) {
      this.monitorInterval = setInterval(() => {
        // Check if circuit should transition from open to half-open
        if (
          this.state === CircuitState.OPEN &&
          Date.now() - this.lastFailureTime >= this.options.resetTimeout
        ) {
          this.toHalfOpen();
        }
        
        // Reset counters periodically to avoid stale statistics
        if (this.state === CircuitState.CLOSED && this.totalRequests > 100) {
          this.totalRequests = 0;
          this.failedRequests = 0;
        }
      }, this.options.monitorInterval);
    }
  }
  
  /**
   * Stops the health monitoring interval
   */
  public stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
  }
  
  /**
   * Gets the current state of the circuit
   * 
   * @returns Current circuit state
   */
  public getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Gets statistics about the circuit
   * 
   * @returns Circuit statistics
   */
  public getStats(): Record<string, any> {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      failedRequests: this.failedRequests,
      errorRate: this.totalRequests > 0 ? (this.failedRequests / this.totalRequests) * 100 : 0,
      lastFailureTime: this.lastFailureTime > 0 ? new Date(this.lastFailureTime).toISOString() : null,
      timeUntilReset: this.state === CircuitState.OPEN
        ? Math.max(0, this.options.resetTimeout - (Date.now() - this.lastFailureTime))
        : 0,
    };
  }
  
  /**
   * Manually resets the circuit to closed state
   */
  public reset(): void {
    this.toClose();
  }
}

/**
 * Exception thrown when a circuit is open
 */
export class CircuitBreakerOpenException extends ExternalDependencyException {
  constructor(
    message: string,
    public readonly resetTimeoutRemaining: number,
  ) {
    super(message);
    this.addMetadata('resetTimeoutRemaining', resetTimeoutRemaining);
    this.addMetadata('retryAfter', Math.ceil(resetTimeoutRemaining / 1000));
  }
  
  /**
   * Gets client-safe metadata for responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    return {
      retryAfter: Math.ceil(this.resetTimeoutRemaining / 1000),
    };
  }
}

/**
 * Exception thrown when an operation times out
 */
export class TimeoutError extends ExternalDependencyException {
  constructor(message: string) {
    super(message);
  }
}
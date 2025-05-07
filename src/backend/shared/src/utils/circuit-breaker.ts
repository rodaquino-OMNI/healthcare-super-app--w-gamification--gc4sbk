import { LoggerService } from '../logging/logger.service';

/**
 * Configuration options for the CircuitBreaker.
 */
export interface CircuitBreakerOptions {
  /**
   * Name of the circuit breaker for identification in logs.
   */
  name: string;
  
  /**
   * Number of failures before the circuit breaker opens.
   */
  failureThreshold: number;
  
  /**
   * Time in milliseconds before the circuit breaker attempts to close again.
   */
  resetTimeout: number;
  
  /**
   * Optional fallback function to call when the circuit is open.
   */
  fallback?: (...args: any[]) => any;
  
  /**
   * Optional logger service for logging circuit breaker events.
   */
  logger?: LoggerService;
}

/**
 * Circuit breaker states.
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Implementation of the Circuit Breaker pattern.
 * Prevents cascading failures by failing fast when a service is unavailable.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private nextAttempt: number = Date.now();
  private readonly options: CircuitBreakerOptions;
  private readonly logger?: LoggerService;
  
  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options Configuration options for the circuit breaker
   */
  constructor(options: CircuitBreakerOptions) {
    this.options = {
      name: options.name,
      failureThreshold: options.failureThreshold || 3,
      resetTimeout: options.resetTimeout || 30000, // Default 30 seconds
      fallback: options.fallback,
      logger: options.logger
    };
    
    this.logger = options.logger;
  }
  
  /**
   * Executes the provided function with circuit breaker protection.
   * 
   * @param fn Function to execute
   * @param args Arguments to pass to the function
   * @returns Promise resolving to the function result
   */
  async execute<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.log('info', `Circuit is OPEN for ${this.options.name}, using fallback`);
        
        if (this.options.fallback) {
          return this.options.fallback(...args);
        }
        
        throw new Error(`Circuit is OPEN for ${this.options.name}`);
      }
      
      this.log('info', `Circuit is HALF_OPEN for ${this.options.name}, attempting reset`);
      this.state = CircuitState.HALF_OPEN;
    }
    
    try {
      const result = await fn(...args);
      
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }
  
  /**
   * Handles successful execution.
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    this.log('debug', `Circuit is CLOSED for ${this.options.name}`);
  }
  
  /**
   * Handles execution failure.
   * 
   * @param error The error that occurred
   */
  private onFailure(error: Error): void {
    this.failureCount++;
    
    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      this.log('warn', `Circuit is OPEN for ${this.options.name} until ${new Date(this.nextAttempt).toISOString()}`);
    }
  }
  
  /**
   * Logs a message if a logger is available.
   * 
   * @param level Log level
   * @param message Message to log
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    if (!this.logger) return;
    
    switch (level) {
      case 'debug':
        this.logger.debug(message, 'CircuitBreaker');
        break;
      case 'info':
        this.logger.log(message, 'CircuitBreaker');
        break;
      case 'warn':
        this.logger.warn(message, 'CircuitBreaker');
        break;
      case 'error':
        this.logger.error(message, null, 'CircuitBreaker');
        break;
    }
  }
  
  /**
   * Gets the current state of the circuit breaker.
   * 
   * @returns Current circuit state
   */
  getState(): string {
    return this.state;
  }
  
  /**
   * Gets the current failure count.
   * 
   * @returns Current failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }
  
  /**
   * Manually resets the circuit breaker to closed state.
   */
  reset(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    this.log('info', `Circuit manually reset to CLOSED for ${this.options.name}`);
  }
}
/**
 * Implementation of the Circuit Breaker pattern for preventing cascading failures
 * in event processing systems. This pattern helps maintain system stability by
 * temporarily stopping operations when a service is experiencing problems.
 */

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',   // Normal operation, requests allowed
  OPEN = 'OPEN',       // Failure threshold exceeded, requests blocked
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

/**
 * Configuration options for the circuit breaker
 */
export interface CircuitBreakerOptions {
  // Number of failures before opening the circuit
  failureThreshold: number;
  // Time in milliseconds before attempting to close the circuit
  resetTimeout: number;
  // Interval in milliseconds to check circuit state
  monitorInterval: number;
}

/**
 * Default circuit breaker options
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  monitorInterval: 5000 // 5 seconds
};

/**
 * Circuit breaker implementation for preventing cascading failures
 */
export class CircuitBreaker {
  private static instances: Map<string, CircuitBreaker> = new Map();
  
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private monitorIntervalId: NodeJS.Timeout | null = null;
  
  /**
   * Get a circuit breaker instance by key, creating it if it doesn't exist
   * @param key Unique identifier for the circuit breaker
   * @param options Configuration options
   */
  public static getInstance(key: string, options: CircuitBreakerOptions = DEFAULT_CIRCUIT_BREAKER_OPTIONS): CircuitBreaker {
    if (!CircuitBreaker.instances.has(key)) {
      CircuitBreaker.instances.set(key, new CircuitBreaker(options));
    }
    return CircuitBreaker.instances.get(key)!;
  }
  
  /**
   * Reset all circuit breaker instances
   */
  public static resetAll(): void {
    CircuitBreaker.instances.forEach(instance => instance.reset());
  }
  
  /**
   * Create a new circuit breaker
   * @param options Configuration options
   */
  private constructor(private options: CircuitBreakerOptions) {
    this.startMonitoring();
  }
  
  /**
   * Check if the circuit breaker allows operations
   */
  public isAllowed(): boolean {
    return this.state !== CircuitBreakerState.OPEN;
  }
  
  /**
   * Get the current state of the circuit breaker
   */
  public getState(): { state: CircuitBreakerState; failureCount: number; lastFailureTime: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
  
  /**
   * Record a successful operation
   */
  public recordSuccess(): void {
    this.lastSuccessTime = Date.now();
    
    // If in half-open state and operation succeeded, close the circuit
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
      this.failureCount = 0;
    }
  }
  
  /**
   * Record a failed operation
   */
  public recordFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;
    
    // If failure threshold is reached, open the circuit
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }
  
  /**
   * Reset the circuit breaker to closed state
   */
  public reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
  }
  
  /**
   * Start monitoring the circuit breaker state
   */
  private startMonitoring(): void {
    if (this.monitorIntervalId) {
      clearInterval(this.monitorIntervalId);
    }
    
    this.monitorIntervalId = setInterval(() => {
      // If circuit is open and reset timeout has passed, move to half-open
      if (
        this.state === CircuitBreakerState.OPEN &&
        Date.now() - this.lastFailureTime > this.options.resetTimeout
      ) {
        this.state = CircuitBreakerState.HALF_OPEN;
      }
    }, this.options.monitorInterval);
  }
  
  /**
   * Stop monitoring the circuit breaker state
   */
  public stopMonitoring(): void {
    if (this.monitorIntervalId) {
      clearInterval(this.monitorIntervalId);
      this.monitorIntervalId = null;
    }
  }
}
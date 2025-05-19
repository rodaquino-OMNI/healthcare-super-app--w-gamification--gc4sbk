/**
 * Implementation of the Circuit Breaker pattern for handling external service failures.
 * 
 * The Circuit Breaker pattern prevents an application from repeatedly trying to execute
 * an operation that's likely to fail, allowing it to continue without waiting for the
 * fault to be fixed or wasting resources while the fault is being fixed.
 */

/**
 * Configuration options for the CircuitBreaker
 */
export interface CircuitBreakerOptions {
  /**
   * Number of failures before the circuit opens
   * @default 5
   */
  failureThreshold: number;
  
  /**
   * Time in milliseconds before trying to close the circuit again
   * @default 30000 (30 seconds)
   */
  resetTimeout: number;
  
  /**
   * Callback function when the circuit opens
   */
  onOpen?: () => void;
  
  /**
   * Callback function when the circuit closes
   */
  onClose?: () => void;
  
  /**
   * Callback function when the circuit enters half-open state
   */
  onHalfOpen?: () => void;
}

/**
 * Circuit states
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Error thrown when the circuit is open
 */
export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Implementation of the Circuit Breaker pattern
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private nextAttempt: number = Date.now();
  private readonly options: CircuitBreakerOptions;
  
  /**
   * Creates a new CircuitBreaker instance
   * 
   * @param options - Configuration options for the circuit breaker
   */
  constructor(options: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30000,
      ...options
    };
  }
  
  /**
   * Executes a function with circuit breaker protection
   * 
   * @param fn - The function to execute
   * @returns The result of the function
   * @throws CircuitBreakerError if the circuit is open
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitBreakerError('Circuit is open');
      }
      
      this.halfOpen();
    }
    
    try {
      const result = await fn();
      this.success();
      return result;
    } catch (error) {
      this.failure();
      throw error;
    }
  }
  
  /**
   * Gets the current state of the circuit
   * 
   * @returns The current circuit state
   */
  public getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Resets the circuit breaker to closed state
   */
  public reset(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    if (this.options.onClose) {
      this.options.onClose();
    }
  }
  
  /**
   * Manually opens the circuit
   */
  public open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.resetTimeout;
    if (this.options.onOpen) {
      this.options.onOpen();
    }
  }
  
  /**
   * Handles a successful operation
   */
  private success(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      if (this.options.onClose) {
        this.options.onClose();
      }
    }
  }
  
  /**
   * Handles a failed operation
   */
  private failure(): void {
    this.failureCount++;
    
    if (this.state === CircuitState.HALF_OPEN || 
        this.failureCount >= this.options.failureThreshold) {
      this.open();
    }
  }
  
  /**
   * Sets the circuit to half-open state
   */
  private halfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    if (this.options.onHalfOpen) {
      this.options.onHalfOpen();
    }
  }
}
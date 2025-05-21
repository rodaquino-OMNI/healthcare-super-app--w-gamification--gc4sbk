import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Circuit is open, requests are blocked
  HALF_OPEN = 'HALF_OPEN', // Testing if service is back online
}

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds before trying to half-open the circuit */
  resetTimeout: number;
  /** Interval in milliseconds to check circuit state */
  monitorInterval?: number;
  /** Optional function to determine if a response is considered a failure */
  isFailure?: (error: any) => boolean;
  /** Optional function to log state changes and events */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  /** Optional function to log circuit breaker events */
  onEvent?: (event: string, data?: any) => void;
}

/**
 * Default circuit breaker options
 */
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  monitorInterval: 5000, // 5 seconds
  isFailure: (error) => true, // By default, any error is considered a failure
  onStateChange: () => {}, // No-op by default
  onEvent: () => {}, // No-op by default
};

/**
 * Circuit breaker error class
 */
export class CircuitBreakerError extends Error {
  constructor(message: string, public readonly state: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
    Object.setPrototypeOf(this, CircuitBreakerError.prototype);
  }
}

/**
 * Circuit breaker implementation for HTTP requests
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private nextAttempt: number = Date.now();
  private monitorIntervalId?: NodeJS.Timeout;
  private readonly options: CircuitBreakerOptions;

  /**
   * Creates a new CircuitBreaker instance
   * @param options Circuit breaker configuration options
   */
  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startMonitoring();
  }

  /**
   * Gets the current state of the circuit breaker
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Gets the current failure count
   */
  public getFailureCount(): number {
    return this.failures;
  }

  /**
   * Executes a function with circuit breaker protection
   * @param fn Function to execute
   * @returns Promise with the function result
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.options.onEvent?.('rejected', { state: this.state });
        throw new CircuitBreakerError('Circuit breaker is open', this.state);
      }
      
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Handles successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.CLOSED);
    }
    
    this.failures = 0;
    this.options.onEvent?.('success', { state: this.state });
  }

  /**
   * Handles execution failure
   * @param error The error that occurred
   */
  private onFailure(error: any): void {
    if (this.options.isFailure?.(error) !== false) {
      this.failures++;
      this.options.onEvent?.('failure', { state: this.state, failures: this.failures, error });

      if (this.state === CircuitState.CLOSED && this.failures >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      } else if (this.state === CircuitState.HALF_OPEN) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Transitions the circuit breaker to a new state
   * @param newState The new state to transition to
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;

    const previousState = this.state;
    this.state = newState;

    if (newState === CircuitState.OPEN) {
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    } else if (newState === CircuitState.CLOSED) {
      this.failures = 0;
    }

    this.options.onStateChange?.(previousState, newState);
    this.options.onEvent?.('state_change', { from: previousState, to: newState });
  }

  /**
   * Starts the monitoring interval to check circuit state
   */
  private startMonitoring(): void {
    if (this.options.monitorInterval && !this.monitorIntervalId) {
      this.monitorIntervalId = setInterval(() => {
        if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttempt) {
          this.transitionTo(CircuitState.HALF_OPEN);
        }
      }, this.options.monitorInterval);
    }
  }

  /**
   * Stops the monitoring interval
   */
  public stopMonitoring(): void {
    if (this.monitorIntervalId) {
      clearInterval(this.monitorIntervalId);
      this.monitorIntervalId = undefined;
    }
  }

  /**
   * Resets the circuit breaker to closed state
   */
  public reset(): void {
    this.failures = 0;
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Manually opens the circuit breaker
   * @param resetTimeoutMs Optional custom reset timeout
   */
  public forceOpen(resetTimeoutMs?: number): void {
    if (resetTimeoutMs) {
      this.nextAttempt = Date.now() + resetTimeoutMs;
    } else {
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
    this.transitionTo(CircuitState.OPEN);
  }
}

/**
 * Creates an Axios instance with circuit breaker protection
 * @param axiosConfig Axios request configuration
 * @param circuitBreakerOptions Circuit breaker configuration options
 * @returns Axios instance with circuit breaker protection
 */
export function createCircuitBreakerAxios(
  axiosConfig: AxiosRequestConfig = {},
  circuitBreakerOptions: Partial<CircuitBreakerOptions> = {}
): AxiosInstance {
  const instance = axios.create(axiosConfig);
  const circuitBreaker = new CircuitBreaker(circuitBreakerOptions);

  // Add request interceptor
  instance.interceptors.request.use(async (config) => {
    // Check circuit breaker state before making request
    await circuitBreaker.execute(() => Promise.resolve());
    return config;
  });

  // Wrap the instance's request methods to use the circuit breaker
  const originalRequest = instance.request;
  instance.request = async function<T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig): Promise<R> {
    return circuitBreaker.execute(() => originalRequest.call(instance, config));
  };

  return instance;
}

/**
 * Wraps an existing Axios instance with circuit breaker protection
 * @param instance Existing Axios instance
 * @param circuitBreakerOptions Circuit breaker configuration options
 * @returns The same Axios instance with circuit breaker protection
 */
export function wrapAxiosWithCircuitBreaker(
  instance: AxiosInstance,
  circuitBreakerOptions: Partial<CircuitBreakerOptions> = {}
): AxiosInstance {
  const circuitBreaker = new CircuitBreaker(circuitBreakerOptions);

  // Add request interceptor
  instance.interceptors.request.use(async (config) => {
    // Check circuit breaker state before making request
    await circuitBreaker.execute(() => Promise.resolve());
    return config;
  });

  // Wrap the instance's request methods to use the circuit breaker
  const originalRequest = instance.request;
  instance.request = async function<T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig): Promise<R> {
    return circuitBreaker.execute(() => originalRequest.call(instance, config));
  };

  return instance;
}

/**
 * Gets the circuit breaker state names
 */
export const CircuitStates = CircuitState;

export default {
  CircuitBreaker,
  createCircuitBreakerAxios,
  wrapAxiosWithCircuitBreaker,
  CircuitStates,
};
import { BaseError, ErrorType, JourneyContext } from '../base';
import { CircuitBreakerOptions, CircuitState, isCircuitBreakerOptions } from './types';

/**
 * Interface for circuit breaker state tracking.
 */
interface CircuitBreakerState {
  /** Current state of the circuit breaker */
  state: CircuitState;
  
  /** Timestamp when the circuit was opened */
  openedAt?: Date;
  
  /** Sliding window of recent call results (true = success, false = failure) */
  results: boolean[];
  
  /** Count of consecutive successes in half-open state */
  consecutiveSuccesses: number;
  
  /** Last time the circuit breaker state was updated */
  lastUpdated: Date;
}

/**
 * Registry to store circuit breaker states across the application.
 * This allows sharing circuit breaker state between different instances and methods.
 */
const circuitBreakerRegistry = new Map<string, CircuitBreakerState>();

/**
 * Error thrown when a circuit is open and rejects a call.
 */
export class CircuitOpenError extends BaseError {
  constructor(
    circuitId: string,
    method: string,
    openedAt: Date | undefined,
    context: Record<string, any> = {}
  ) {
    const openDuration = openedAt ? 
      `${Math.round((Date.now() - openedAt.getTime()) / 1000)}s ago` : 
      'recently';
    
    super(
      `Circuit '${circuitId}' is open (opened ${openDuration}) - ${method} call rejected`,
      ErrorType.UNAVAILABLE,
      'CIRCUIT_OPEN',
      {
        journey: context.journey || JourneyContext.SYSTEM,
        circuitId,
        openedAt: openedAt?.toISOString(),
        ...context
      },
      { method },
      'Wait for the circuit to close or implement a fallback strategy'
    );
  }
}

/**
 * Generates a unique circuit ID based on class and method name if not provided.
 * 
 * @param target - The class instance
 * @param propertyKey - The method name
 * @param id - Optional user-provided ID
 * @returns A unique circuit ID
 */
function getCircuitId(target: any, propertyKey: string, id?: string): string {
  if (id) return id;
  
  const className = target.constructor.name;
  return `${className}.${propertyKey}`;
}

/**
 * Initializes a new circuit breaker state.
 * 
 * @returns A new circuit breaker state object
 */
function initializeCircuitState(): CircuitBreakerState {
  return {
    state: CircuitState.CLOSED,
    results: [],
    consecutiveSuccesses: 0,
    lastUpdated: new Date()
  };
}

/**
 * Updates the circuit breaker state based on a call result.
 * 
 * @param circuitId - The circuit ID
 * @param success - Whether the call was successful
 * @param options - Circuit breaker configuration options
 */
function updateCircuitState(
  circuitId: string,
  success: boolean,
  options: CircuitBreakerOptions
): void {
  const state = circuitBreakerRegistry.get(circuitId) || initializeCircuitState();
  const now = new Date();
  
  // Update the sliding window of results
  state.results.push(success);
  if (state.results.length > (options.windowSize || 10)) {
    state.results.shift();
  }
  
  // Calculate failure rate
  const failures = state.results.filter(result => !result).length;
  const failureRate = failures / state.results.length;
  
  // Update state based on current state and result
  switch (state.state) {
    case CircuitState.CLOSED:
      if (failures >= (options.failureThreshold || 5)) {
        // Transition to OPEN state
        const oldState = state.state;
        state.state = CircuitState.OPEN;
        state.openedAt = now;
        state.consecutiveSuccesses = 0;
        
        // Notify state change if callback provided
        if (options.onStateChange) {
          options.onStateChange(
            oldState,
            state.state,
            `Failure threshold exceeded: ${failures} failures in last ${state.results.length} calls`
          );
        }
      }
      break;
      
    case CircuitState.OPEN:
      // Check if reset timeout has elapsed
      const resetTimeout = options.resetTimeout || 30000; // Default 30 seconds
      if (state.openedAt && (now.getTime() - state.openedAt.getTime() > resetTimeout)) {
        // Transition to HALF-OPEN state
        const oldState = state.state;
        state.state = CircuitState.HALF_OPEN;
        state.consecutiveSuccesses = 0;
        
        // Notify state change if callback provided
        if (options.onStateChange) {
          options.onStateChange(
            oldState,
            state.state,
            `Reset timeout elapsed after ${resetTimeout}ms`
          );
        }
      }
      break;
      
    case CircuitState.HALF_OPEN:
      if (success) {
        // Increment consecutive successes
        state.consecutiveSuccesses++;
        
        // Check if success threshold reached
        if (state.consecutiveSuccesses >= (options.successThreshold || 2)) {
          // Transition to CLOSED state
          const oldState = state.state;
          state.state = CircuitState.CLOSED;
          state.openedAt = undefined;
          state.results = []; // Reset results window
          
          // Add initial successes to the window
          for (let i = 0; i < state.consecutiveSuccesses; i++) {
            state.results.push(true);
          }
          
          // Notify state change if callback provided
          if (options.onStateChange) {
            options.onStateChange(
              oldState,
              state.state,
              `Success threshold reached: ${state.consecutiveSuccesses} consecutive successes`
            );
          }
        }
      } else {
        // Failed in half-open state, go back to open
        const oldState = state.state;
        state.state = CircuitState.OPEN;
        state.openedAt = now;
        state.consecutiveSuccesses = 0;
        
        // Notify state change if callback provided
        if (options.onStateChange) {
          options.onStateChange(
            oldState,
            state.state,
            'Failed call in half-open state'
          );
        }
      }
      break;
  }
  
  state.lastUpdated = now;
  circuitBreakerRegistry.set(circuitId, state);
}

/**
 * Determines if an error should count as a failure for the circuit breaker.
 * 
 * @param error - The error to check
 * @param options - Circuit breaker configuration options
 * @returns True if the error should count as a failure, false otherwise
 */
function isFailureError(error: Error, options: CircuitBreakerOptions): boolean {
  // If custom isFailure function is provided, use it
  if (options.isFailure) {
    return options.isFailure(error);
  }
  
  // If specific error types are provided, check against them
  if (options.failureErrors && options.failureErrors.length > 0) {
    if (error instanceof BaseError) {
      return options.failureErrors.includes(error.type);
    }
    return false;
  }
  
  // Default behavior: count all errors as failures
  return true;
}

/**
 * Gets the current state of a circuit breaker.
 * 
 * @param circuitId - The circuit ID
 * @returns The current circuit state or undefined if not found
 */
export function getCircuitBreakerState(circuitId: string): CircuitBreakerState | undefined {
  return circuitBreakerRegistry.get(circuitId);
}

/**
 * Resets a circuit breaker to its initial closed state.
 * Useful for testing or manual intervention.
 * 
 * @param circuitId - The circuit ID
 */
export function resetCircuitBreaker(circuitId: string): void {
  circuitBreakerRegistry.set(circuitId, initializeCircuitState());
}

/**
 * Manually opens a circuit breaker.
 * Useful for testing or manual intervention.
 * 
 * @param circuitId - The circuit ID
 */
export function openCircuitBreaker(circuitId: string): void {
  const state = circuitBreakerRegistry.get(circuitId) || initializeCircuitState();
  state.state = CircuitState.OPEN;
  state.openedAt = new Date();
  state.consecutiveSuccesses = 0;
  circuitBreakerRegistry.set(circuitId, state);
}

/**
 * Gets all circuit breaker states for monitoring and health checks.
 * 
 * @returns A map of circuit IDs to their current states
 */
export function getAllCircuitBreakerStates(): Map<string, CircuitBreakerState> {
  return new Map(circuitBreakerRegistry);
}

/**
 * Decorator that implements the Circuit Breaker pattern for a method.
 * Prevents repeated calls to failing dependencies by tracking failure rates
 * and automatically transitioning between closed, open, and half-open states.
 * 
 * @param options - Circuit breaker configuration options
 * @returns A method decorator
 * 
 * @example
 * ```typescript
 * class ExternalServiceClient {
 *   @CircuitBreaker({
 *     failureThreshold: 3,
 *     resetTimeout: 10000,
 *     onStateChange: (oldState, newState) => console.log(`Circuit changed from ${oldState} to ${newState}`)
 *   })
 *   async callExternalService(id: string): Promise<Response> {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export function CircuitBreaker(options: CircuitBreakerOptions = {}): MethodDecorator {
  // Validate options
  if (!isCircuitBreakerOptions(options)) {
    throw new Error('Invalid circuit breaker options');
  }
  
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const circuitId = getCircuitId(target, propertyKey.toString(), options.id);
    
    descriptor.value = async function(...args: any[]) {
      // Initialize circuit state if not exists
      if (!circuitBreakerRegistry.has(circuitId)) {
        circuitBreakerRegistry.set(circuitId, initializeCircuitState());
      }
      
      const circuitState = circuitBreakerRegistry.get(circuitId)!;
      
      // Check if circuit is open
      if (circuitState.state === CircuitState.OPEN) {
        // Throw circuit open error
        throw new CircuitOpenError(
          circuitId,
          propertyKey.toString(),
          circuitState.openedAt,
          { target: target.constructor.name }
        );
      }
      
      // Allow the call to proceed (circuit is closed or half-open)
      try {
        const result = await originalMethod.apply(this, args);
        
        // Update circuit state with success
        updateCircuitState(circuitId, true, options);
        
        return result;
      } catch (error) {
        // Check if this error counts as a failure
        const isFailure = isFailureError(error as Error, options);
        
        if (isFailure) {
          // Update circuit state with failure
          updateCircuitState(circuitId, false, options);
        }
        
        // Re-throw the original error
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator that implements the Circuit Breaker pattern with default options.
 * Shorthand for @CircuitBreaker() with default configuration.
 * 
 * @returns A method decorator
 * 
 * @example
 * ```typescript
 * class ExternalServiceClient {
 *   @WithCircuitBreaker
 *   async callExternalService(id: string): Promise<Response> {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export function WithCircuitBreaker(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
  return CircuitBreaker()(target, propertyKey, descriptor);
}

/**
 * Decorator that implements the Circuit Breaker pattern specifically for external service calls.
 * Preconfigured with settings optimized for external dependencies.
 * 
 * @param options - Additional circuit breaker options to override defaults
 * @returns A method decorator
 * 
 * @example
 * ```typescript
 * class PaymentGatewayClient {
 *   @ExternalServiceCircuitBreaker()
 *   async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export function ExternalServiceCircuitBreaker(options: Partial<CircuitBreakerOptions> = {}): MethodDecorator {
  // Default options optimized for external services
  const defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 3,
    windowSize: 10,
    successThreshold: 2,
    resetTimeout: 30000, // 30 seconds
    failureErrors: [
      ErrorType.EXTERNAL,
      ErrorType.TIMEOUT,
      ErrorType.UNAVAILABLE
    ]
  };
  
  // Merge with user options
  const mergedOptions: CircuitBreakerOptions = {
    ...defaultOptions,
    ...options
  };
  
  return CircuitBreaker(mergedOptions);
}

/**
 * Decorator that implements the Circuit Breaker pattern specifically for database operations.
 * Preconfigured with settings optimized for database interactions.
 * 
 * @param options - Additional circuit breaker options to override defaults
 * @returns A method decorator
 * 
 * @example
 * ```typescript
 * class UserRepository {
 *   @DatabaseCircuitBreaker()
 *   async findUserById(id: string): Promise<User> {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export function DatabaseCircuitBreaker(options: Partial<CircuitBreakerOptions> = {}): MethodDecorator {
  // Default options optimized for database operations
  const defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    windowSize: 20,
    successThreshold: 3,
    resetTimeout: 15000, // 15 seconds
    // Database errors are often transient and should be retried
    isFailure: (error: Error) => {
      // Don't count not found errors as circuit breaker failures
      if (error instanceof BaseError && error.type === ErrorType.NOT_FOUND) {
        return false;
      }
      return true;
    }
  };
  
  // Merge with user options
  const mergedOptions: CircuitBreakerOptions = {
    ...defaultOptions,
    ...options
  };
  
  return CircuitBreaker(mergedOptions);
}
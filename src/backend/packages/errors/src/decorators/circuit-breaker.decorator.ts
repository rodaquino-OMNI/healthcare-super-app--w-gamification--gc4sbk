/**
 * @file Circuit Breaker Decorator
 * 
 * Implements the Circuit Breaker pattern as a method decorator to prevent repeated calls to failing dependencies.
 * The decorator tracks failure rates and automatically transitions between closed (normal operation),
 * open (failing, rejecting calls), and half-open (testing recovery) states.
 * 
 * When the circuit is open, calls are immediately rejected without executing the underlying method,
 * preventing cascading failures and allowing systems to recover.
 * 
 * @example
 * ```typescript
 * // Basic usage with default settings
 * @CircuitBreaker()
 * async callExternalService(): Promise<Response> { ... }
 * 
 * // With custom configuration
 * @CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000,
 *   fallback: (error, ...args) => ({ status: 'degraded', data: cachedData })
 * })
 * async fetchUserData(userId: string): Promise<UserData> { ... }
 * 
 * // With state change notification
 * @CircuitBreaker({
 *   onStateChange: (oldState, newState) => {
 *     logger.warn(`Circuit state changed from ${oldState} to ${newState}`);
 *     metrics.recordCircuitStateChange(serviceName, oldState, newState);
 *   }
 * })
 * async processPayment(paymentData: PaymentData): Promise<PaymentResult> { ... }
 * ```
 */

import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { BaseError, ErrorType, JourneyType } from '../base';
import { CIRCUIT_BREAKER_CONFIG } from '../constants';
import { CircuitBreakerConfig, CircuitState } from './types';

/**
 * Interface for circuit breaker state tracking
 */
interface CircuitBreakerState {
  /** Current state of the circuit */
  state: CircuitState;
  
  /** Timestamp when the circuit was opened */
  openedAt: number | null;
  
  /** Count of consecutive failures in closed state */
  failureCount: number;
  
  /** Count of consecutive successes in half-open state */
  successCount: number;
  
  /** Timestamp of the first failure in the current window */
  failureWindowStart: number | null;
  
  /** Total number of requests processed */
  totalRequests: number;
  
  /** Total number of failed requests */
  totalFailures: number;
  
  /** Last error that occurred */
  lastError: Error | null;
  
  /** Timestamp of the last state change */
  lastStateChangeAt: number;
}

/**
 * Map to store circuit breaker state for each decorated method
 * Keys are generated based on class name and method name
 */
const circuitStates = new Map<string, CircuitBreakerState>();

/**
 * Generates a unique key for a class method to use in the circuit state map
 * 
 * @param target - The class prototype
 * @param propertyKey - The method name
 * @returns A unique string key
 */
function getCircuitKey(target: any, propertyKey: string | symbol): string {
  const className = target.constructor.name;
  return `${className}.${String(propertyKey)}`;
}

/**
 * Creates a new circuit breaker state with default values
 * 
 * @returns A new CircuitBreakerState object
 */
function createInitialState(): CircuitBreakerState {
  return {
    state: CircuitState.CLOSED,
    openedAt: null,
    failureCount: 0,
    successCount: 0,
    failureWindowStart: null,
    totalRequests: 0,
    totalFailures: 0,
    lastError: null,
    lastStateChangeAt: Date.now()
  };
}

/**
 * Changes the state of a circuit breaker and triggers the onStateChange callback if provided
 * 
 * @param circuitKey - The unique key for the circuit
 * @param newState - The new state to set
 * @param config - The circuit breaker configuration
 */
function changeState(
  circuitKey: string,
  newState: CircuitState,
  config: CircuitBreakerConfig
): void {
  const state = circuitStates.get(circuitKey)!;
  const oldState = state.state;
  
  // Only proceed if the state is actually changing
  if (oldState === newState) {
    return;
  }
  
  // Update the state
  state.state = newState;
  state.lastStateChangeAt = Date.now();
  
  // Reset counters based on new state
  if (newState === CircuitState.OPEN) {
    state.openedAt = Date.now();
    state.successCount = 0;
  } else if (newState === CircuitState.CLOSED) {
    state.failureCount = 0;
    state.failureWindowStart = null;
    state.openedAt = null;
  } else if (newState === CircuitState.HALF_OPEN) {
    state.successCount = 0;
  }
  
  // Record state change in current span if available
  const activeSpan = trace.getSpan(context.active());
  if (activeSpan) {
    activeSpan.setAttribute('circuit.state.change', `${oldState} -> ${newState}`);
    activeSpan.setAttribute('circuit.key', circuitKey);
  }
  
  // Notify state change if callback is provided
  if (config.onStateChange) {
    try {
      config.onStateChange(oldState, newState);
    } catch (error) {
      // Ignore errors in the callback to prevent affecting the main flow
      console.error('Error in circuit breaker onStateChange callback:', error);
    }
  }
}

/**
 * Creates a CircuitBreakerError when the circuit is open
 * 
 * @param config - The circuit breaker configuration
 * @param lastError - The last error that caused the circuit to open
 * @returns A BaseError instance
 */
function createCircuitBreakerError(
  config: CircuitBreakerConfig,
  lastError: Error | null
): BaseError {
  const message = config.message || 'Circuit breaker is open';
  const errorCode = config.errorCode || 'CIRCUIT_BREAKER_OPEN';
  
  return new BaseError(
    message,
    config.errorType || ErrorType.EXTERNAL,
    errorCode,
    {
      component: 'circuit-breaker',
      operation: 'execute',
      isTransient: true,
      retryStrategy: {
        maxAttempts: 3,
        baseDelayMs: 5000,
        useExponentialBackoff: true
      },
      metadata: {
        circuitState: CircuitState.OPEN,
        originalError: lastError ? {
          message: lastError.message,
          name: lastError.name
        } : null
      }
    },
    undefined,
    lastError || undefined
  );
}

/**
 * Decorator factory that creates a circuit breaker for a method
 * 
 * @param config - Configuration options for the circuit breaker
 * @returns A method decorator
 */
export function CircuitBreaker<T = any>(config: CircuitBreakerConfig<T> = {}): MethodDecorator {
  // Merge provided config with defaults
  const mergedConfig: CircuitBreakerConfig<T> = {
    failureThreshold: config.failureThreshold || CIRCUIT_BREAKER_CONFIG.DEFAULT.REQUEST_VOLUME_THRESHOLD,
    failureWindow: config.failureWindow || CIRCUIT_BREAKER_CONFIG.DEFAULT.ROLLING_WINDOW_MS,
    resetTimeout: config.resetTimeout || CIRCUIT_BREAKER_CONFIG.DEFAULT.RESET_TIMEOUT_MS,
    successThreshold: config.successThreshold || 2,
    isFailure: config.isFailure || (error => true),
    onStateChange: config.onStateChange,
    fallback: config.fallback,
    errorType: config.errorType || ErrorType.EXTERNAL,
    errorCode: config.errorCode,
    message: config.message,
    logError: config.logError !== undefined ? config.logError : true,
    includeStack: config.includeStack
  };

  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const circuitKey = getCircuitKey(target, propertyKey);
    
    // Initialize circuit state if not already present
    if (!circuitStates.has(circuitKey)) {
      circuitStates.set(circuitKey, createInitialState());
    }
    
    descriptor.value = async function(...args: any[]) {
      const circuitState = circuitStates.get(circuitKey)!;
      circuitState.totalRequests++;
      
      // Create a span for the circuit breaker operation
      const tracer = trace.getTracer('circuit-breaker');
      const span = tracer.startSpan(`circuit-breaker.${String(propertyKey)}`);
      span.setAttribute('circuit.key', circuitKey);
      span.setAttribute('circuit.state', circuitState.state);
      
      try {
        // Check if circuit is open
        if (circuitState.state === CircuitState.OPEN) {
          // Check if reset timeout has elapsed
          const now = Date.now();
          if (circuitState.openedAt && (now - circuitState.openedAt) >= mergedConfig.resetTimeout!) {
            // Transition to half-open state
            changeState(circuitKey, CircuitState.HALF_OPEN, mergedConfig);
            span.setAttribute('circuit.state.transition', 'OPEN -> HALF_OPEN');
          } else {
            // Circuit is still open, reject the call
            span.setAttribute('circuit.rejected', true);
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'Circuit is open' });
            span.end();
            
            // Use fallback if provided, otherwise throw error
            if (mergedConfig.fallback) {
              return mergedConfig.fallback(
                createCircuitBreakerError(mergedConfig, circuitState.lastError),
                ...args
              );
            }
            
            throw createCircuitBreakerError(mergedConfig, circuitState.lastError);
          }
        }
        
        // Execute the original method
        const result = await originalMethod.apply(this, args);
        
        // Handle success
        if (circuitState.state === CircuitState.HALF_OPEN) {
          // Increment success counter in half-open state
          circuitState.successCount++;
          
          // Check if success threshold is reached
          if (circuitState.successCount >= mergedConfig.successThreshold!) {
            // Transition back to closed state
            changeState(circuitKey, CircuitState.CLOSED, mergedConfig);
            span.setAttribute('circuit.state.transition', 'HALF_OPEN -> CLOSED');
          }
        } else if (circuitState.state === CircuitState.CLOSED) {
          // Reset failure count on success in closed state
          circuitState.failureCount = 0;
          circuitState.failureWindowStart = null;
        }
        
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      } catch (error) {
        // Check if this error counts as a failure
        const isFailure = mergedConfig.isFailure!(error as Error);
        
        if (isFailure) {
          circuitState.totalFailures++;
          circuitState.lastError = error as Error;
          
          // Record error in span
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message
          });
          
          // Handle failure based on current state
          if (circuitState.state === CircuitState.CLOSED) {
            // Initialize failure window if not already set
            if (!circuitState.failureWindowStart) {
              circuitState.failureWindowStart = Date.now();
            }
            
            // Check if we're still within the failure window
            const now = Date.now();
            if ((now - circuitState.failureWindowStart) > mergedConfig.failureWindow!) {
              // Window has elapsed, reset failure count and window
              circuitState.failureCount = 1;
              circuitState.failureWindowStart = now;
            } else {
              // Increment failure count within window
              circuitState.failureCount++;
              
              // Check if failure threshold is reached
              if (circuitState.failureCount >= mergedConfig.failureThreshold!) {
                // Transition to open state
                changeState(circuitKey, CircuitState.OPEN, mergedConfig);
                span.setAttribute('circuit.state.transition', 'CLOSED -> OPEN');
              }
            }
          } else if (circuitState.state === CircuitState.HALF_OPEN) {
            // Any failure in half-open state opens the circuit again
            changeState(circuitKey, CircuitState.OPEN, mergedConfig);
            span.setAttribute('circuit.state.transition', 'HALF_OPEN -> OPEN');
          }
        }
        
        span.end();
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator factory that creates a circuit breaker for a method with journey-specific context
 * 
 * @param journey - The journey type for context
 * @param config - Configuration options for the circuit breaker
 * @returns A method decorator
 */
export function JourneyCircuitBreaker<T = any>(
  journey: JourneyType,
  config: CircuitBreakerConfig<T> = {}
): MethodDecorator {
  // Add journey context to the configuration
  const journeyConfig: CircuitBreakerConfig<T> = {
    ...config,
    errorCode: config.errorCode || `${journey.toUpperCase()}_CIRCUIT_BREAKER_OPEN`
  };
  
  return CircuitBreaker(journeyConfig);
}

/**
 * Gets the current state of a circuit breaker for monitoring and health checks
 * 
 * @param target - The class instance or prototype
 * @param methodName - The method name
 * @returns The current circuit state or null if not found
 */
export function getCircuitBreakerState(
  target: any,
  methodName: string
): { state: CircuitState; metrics: Omit<CircuitBreakerState, 'lastError'> } | null {
  const circuitKey = getCircuitKey(
    target.prototype || Object.getPrototypeOf(target),
    methodName
  );
  
  const state = circuitStates.get(circuitKey);
  if (!state) {
    return null;
  }
  
  // Return a copy without the lastError to avoid exposing sensitive information
  const { lastError, ...metrics } = state;
  return {
    state: state.state,
    metrics
  };
}

/**
 * Resets a circuit breaker to its initial closed state
 * Useful for testing and manual intervention
 * 
 * @param target - The class instance or prototype
 * @param methodName - The method name
 * @returns true if the circuit was found and reset, false otherwise
 */
export function resetCircuitBreaker(target: any, methodName: string): boolean {
  const circuitKey = getCircuitKey(
    target.prototype || Object.getPrototypeOf(target),
    methodName
  );
  
  if (!circuitStates.has(circuitKey)) {
    return false;
  }
  
  circuitStates.set(circuitKey, createInitialState());
  return true;
}

/**
 * Gets all circuit breaker states for system-wide monitoring
 * 
 * @returns A map of all circuit breaker states
 */
export function getAllCircuitBreakerStates(): Map<string, { state: CircuitState; metrics: Omit<CircuitBreakerState, 'lastError'> }> {
  const result = new Map<string, { state: CircuitState; metrics: Omit<CircuitBreakerState, 'lastError'> }>();
  
  for (const [key, state] of circuitStates.entries()) {
    const { lastError, ...metrics } = state;
    result.set(key, {
      state: state.state,
      metrics
    });
  }
  
  return result;
}

/**
 * This module is part of the AUSTA SuperApp error handling framework.
 * It implements the Circuit Breaker pattern as described in the technical specification:
 * 
 * "Circuit breaker pattern for failing dependencies" - Section 5.4.3 Error Handling Patterns
 * 
 * The implementation provides:
 * - Automatic state transitions between closed, open, and half-open states
 * - Configurable failure thresholds and windows
 * - Integration with OpenTelemetry for monitoring and tracing
 * - Fallback mechanisms for graceful degradation
 * - Health reporting capabilities for system monitoring
 */
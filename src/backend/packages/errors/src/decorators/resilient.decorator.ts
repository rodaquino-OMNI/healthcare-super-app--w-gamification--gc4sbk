/**
 * @file Resilient decorator implementation
 * 
 * This file implements a composite decorator that combines multiple resilience patterns
 * (retry, circuit breaker, fallback) into a single decorator with a fluent configuration API.
 * 
 * The Resilient decorator provides a comprehensive solution for making method calls
 * resilient against various failure modes, with intelligent interaction between patterns
 * and correct ordering of resilience mechanisms for optimal performance.
 * 
 * @example
 * ```typescript
 * // Basic usage with default settings
 * @Resilient()
 * async fetchUserData(userId: string): Promise<UserData> {
 *   // Method implementation that might fail
 * }
 * 
 * // Advanced usage with fluent configuration API
 * @Resilient()
 *   .withRetry({ maxAttempts: 3, backoffFactor: 2 })
 *   .withCircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 })
 *   .withFallback(error => getDefaultUserData())
 * async fetchExternalData(dataId: string): Promise<ExternalData> {
 *   // Method implementation that might fail
 * }
 * ```
 */

import { RetryConfig, CircuitBreakerConfig, FallbackConfig, BaseErrorConfig, CircuitState } from './types';
import { ErrorType } from '../../categories/error-types';
import { Logger } from '@nestjs/common';

/**
 * Configuration for the Resilient decorator
 * Combines retry, circuit breaker, and fallback configurations
 */
export class ResilientConfig<T = any> implements BaseErrorConfig {
  private readonly logger = new Logger('ResilientDecorator');
  
  // Base error configuration
  message?: string;
  errorType?: ErrorType;
  errorCode?: string;
  logError: boolean = true;
  includeStack?: boolean;
  
  // Retry configuration
  private retryEnabled: boolean = false;
  private retryConfig: RetryConfig<T> = {
    maxAttempts: 3,
    delay: 1000,
    backoffFactor: 2,
    maxDelay: 30000
  };
  
  // Circuit breaker configuration
  private circuitBreakerEnabled: boolean = false;
  private circuitBreakerConfig: CircuitBreakerConfig<T> = {
    failureThreshold: 5,
    failureWindow: 60000,
    resetTimeout: 30000,
    successThreshold: 2
  };
  
  // Fallback configuration
  private fallbackEnabled: boolean = false;
  private fallbackConfig: FallbackConfig<T> = {
    handler: null,
    logOriginalError: true
  };
  
  // Circuit state (shared across all instances for the same method)
  private static circuitStates = new Map<string, {
    state: CircuitState,
    failures: number,
    lastFailureTime: number,
    openTime: number,
    successCount: number
  }>();
  
  /**
   * Creates a new ResilientConfig instance
   * @param config - Base configuration options
   */
  constructor(config: Partial<BaseErrorConfig> = {}) {
    Object.assign(this, config);
  }
  
  /**
   * Configures retry behavior
   * @param config - Retry configuration options
   * @returns This instance for method chaining
   */
  withRetry(config: Partial<RetryConfig<T>> = {}): ResilientConfig<T> {
    this.retryEnabled = true;
    this.retryConfig = { ...this.retryConfig, ...config };
    return this;
  }
  
  /**
   * Configures circuit breaker behavior
   * @param config - Circuit breaker configuration options
   * @returns This instance for method chaining
   */
  withCircuitBreaker(config: Partial<CircuitBreakerConfig<T>> = {}): ResilientConfig<T> {
    this.circuitBreakerEnabled = true;
    this.circuitBreakerConfig = { ...this.circuitBreakerConfig, ...config };
    return this;
  }
  
  /**
   * Configures fallback behavior
   * @param handlerOrConfig - Fallback handler function or configuration
   * @returns This instance for method chaining
   */
  withFallback(
    handlerOrConfig: ((error: Error, ...args: any[]) => T | Promise<T>) | Partial<FallbackConfig<T>>
  ): ResilientConfig<T> {
    this.fallbackEnabled = true;
    
    if (typeof handlerOrConfig === 'function') {
      this.fallbackConfig = { ...this.fallbackConfig, handler: handlerOrConfig };
    } else {
      this.fallbackConfig = { ...this.fallbackConfig, ...handlerOrConfig };
    }
    
    return this;
  }
  
  /**
   * Checks if retry is enabled
   * @returns True if retry is enabled, false otherwise
   */
  isRetryEnabled(): boolean {
    return this.retryEnabled;
  }
  
  /**
   * Gets the retry configuration
   * @returns Retry configuration
   */
  getRetryConfig(): RetryConfig<T> {
    return this.retryConfig;
  }
  
  /**
   * Checks if circuit breaker is enabled
   * @returns True if circuit breaker is enabled, false otherwise
   */
  isCircuitBreakerEnabled(): boolean {
    return this.circuitBreakerEnabled;
  }
  
  /**
   * Gets the circuit breaker configuration
   * @returns Circuit breaker configuration
   */
  getCircuitBreakerConfig(): CircuitBreakerConfig<T> {
    return this.circuitBreakerConfig;
  }
  
  /**
   * Checks if fallback is enabled
   * @returns True if fallback is enabled, false otherwise
   */
  isFallbackEnabled(): boolean {
    return this.fallbackEnabled;
  }
  
  /**
   * Gets the fallback configuration
   * @returns Fallback configuration
   */
  getFallbackConfig(): FallbackConfig<T> {
    return this.fallbackConfig;
  }
  
  /**
   * Gets the circuit state for a specific method
   * @param methodKey - Unique key identifying the method
   * @returns Circuit state object
   */
  getCircuitState(methodKey: string) {
    if (!ResilientConfig.circuitStates.has(methodKey)) {
      ResilientConfig.circuitStates.set(methodKey, {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailureTime: 0,
        openTime: 0,
        successCount: 0
      });
    }
    
    return ResilientConfig.circuitStates.get(methodKey);
  }
  
  /**
   * Updates the circuit state for a specific method
   * @param methodKey - Unique key identifying the method
   * @param updater - Function to update the circuit state
   */
  updateCircuitState(methodKey: string, updater: (state: any) => void) {
    const state = this.getCircuitState(methodKey);
    updater(state);
  }
  
  /**
   * Changes the circuit state and logs the transition
   * @param methodKey - Unique key identifying the method
   * @param newState - New circuit state
   */
  changeCircuitState(methodKey: string, newState: CircuitState) {
    const state = this.getCircuitState(methodKey);
    const oldState = state.state;
    
    if (oldState !== newState) {
      state.state = newState;
      
      if (newState === CircuitState.OPEN) {
        state.openTime = Date.now();
        state.successCount = 0;
      }
      
      this.logger.log(`Circuit state changed from ${oldState} to ${newState} for ${methodKey}`);
      
      if (this.circuitBreakerConfig.onStateChange) {
        try {
          this.circuitBreakerConfig.onStateChange(oldState, newState);
        } catch (error) {
          this.logger.error(`Error in onStateChange callback: ${error.message}`, error.stack);
        }
      }
    }
  }
}

/**
 * Creates a unique key for a method to track circuit state
 * @param target - Class instance or constructor
 * @param propertyKey - Method name
 * @returns Unique method key
 */
function getMethodKey(target: any, propertyKey: string | symbol): string {
  const className = target.constructor?.name || 'unknown';
  return `${className}.${String(propertyKey)}`;
}

/**
 * Calculates the delay for a retry attempt with exponential backoff
 * @param attempt - Current attempt number (starting from 1)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateBackoff(attempt: number, config: RetryConfig): number {
  const { delay, backoffFactor, maxDelay } = config;
  const backoff = delay * Math.pow(backoffFactor || 2, attempt - 1);
  const jitter = Math.random() * 0.2 * backoff; // Add up to 20% jitter
  return Math.min(backoff + jitter, maxDelay || 30000);
}

/**
 * Decorator factory for the Resilient decorator
 * @param configOrBuilder - Configuration object or builder function
 * @returns Method decorator
 */
export function Resilient<T = any>(
  configOrBuilder: Partial<BaseErrorConfig> | ((config: ResilientConfig<T>) => ResilientConfig<T>) = {}
): MethodDecorator & ResilientConfig<T> {
  // Create the configuration object
  const config = new ResilientConfig<T>(typeof configOrBuilder === 'object' ? configOrBuilder : {});
  
  // Apply builder function if provided
  if (typeof configOrBuilder === 'function') {
    configOrBuilder(config);
  }
  
  // Create the decorator function
  const decorator: MethodDecorator = (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const methodKey = getMethodKey(target, propertyKey);
    const logger = new Logger(`${target.constructor.name}.${String(propertyKey)}`);
    
    descriptor.value = async function(...args: any[]) {
      // Circuit breaker check (if enabled)
      if (config.isCircuitBreakerEnabled()) {
        const circuitState = config.getCircuitState(methodKey);
        const circuitConfig = config.getCircuitBreakerConfig();
        
        // Check if circuit is open
        if (circuitState.state === CircuitState.OPEN) {
          const now = Date.now();
          const resetTimeout = circuitConfig.resetTimeout || 30000;
          
          // Check if it's time to transition to half-open
          if (now - circuitState.openTime >= resetTimeout) {
            config.changeCircuitState(methodKey, CircuitState.HALF_OPEN);
            logger.log(`Circuit transitioned to HALF_OPEN for ${methodKey}`);
          } else {
            // Circuit is still open, use fallback or throw error
            const error = new Error(`Circuit is OPEN for ${methodKey}`);
            
            if (circuitConfig.fallback) {
              logger.debug(`Using circuit breaker fallback for ${methodKey}`);
              return circuitConfig.fallback(error, ...args);
            }
            
            if (config.isFallbackEnabled()) {
              const fallbackConfig = config.getFallbackConfig();
              
              if (fallbackConfig.handler) {
                logger.debug(`Using general fallback for ${methodKey} (circuit open)`);
                return fallbackConfig.handler(error, ...args);
              }
            }
            
            throw error;
          }
        }
      }
      
      // Retry logic (if enabled)
      if (config.isRetryEnabled()) {
        const retryConfig = config.getRetryConfig();
        const maxAttempts = retryConfig.maxAttempts || 3;
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            // Execute the original method
            const result = await originalMethod.apply(this, args);
            
            // Update circuit breaker on success (if enabled)
            if (config.isCircuitBreakerEnabled()) {
              const circuitState = config.getCircuitState(methodKey);
              
              if (circuitState.state === CircuitState.HALF_OPEN) {
                const circuitConfig = config.getCircuitBreakerConfig();
                const successThreshold = circuitConfig.successThreshold || 2;
                
                config.updateCircuitState(methodKey, (state) => {
                  state.successCount += 1;
                });
                
                if (circuitState.successCount >= successThreshold) {
                  config.changeCircuitState(methodKey, CircuitState.CLOSED);
                  config.updateCircuitState(methodKey, (state) => {
                    state.failures = 0;
                  });
                }
              } else if (circuitState.state === CircuitState.CLOSED) {
                // Reset failure count on success in closed state
                const now = Date.now();
                const circuitConfig = config.getCircuitBreakerConfig();
                const failureWindow = circuitConfig.failureWindow || 60000;
                
                // Only reset failures if they're old
                if (circuitState.failures > 0 && now - circuitState.lastFailureTime > failureWindow) {
                  config.updateCircuitState(methodKey, (state) => {
                    state.failures = 0;
                  });
                }
              }
            }
            
            return result;
          } catch (error) {
            lastError = error;
            
            // Check if we should retry this error
            const shouldRetry = !retryConfig.retryCondition || retryConfig.retryCondition(error);
            
            if (!shouldRetry) {
              logger.debug(`Not retrying error: ${error.message}`);
              break;
            }
            
            // Update circuit breaker on failure (if enabled)
            if (config.isCircuitBreakerEnabled()) {
              const circuitState = config.getCircuitState(methodKey);
              const circuitConfig = config.getCircuitBreakerConfig();
              
              // Check if this error counts as a failure for the circuit breaker
              const isFailure = !circuitConfig.isFailure || circuitConfig.isFailure(error);
              
              if (isFailure) {
                const now = Date.now();
                
                if (circuitState.state === CircuitState.CLOSED) {
                  const failureThreshold = circuitConfig.failureThreshold || 5;
                  const failureWindow = circuitConfig.failureWindow || 60000;
                  
                  // Only count failures within the window
                  if (circuitState.failures === 0 || now - circuitState.lastFailureTime <= failureWindow) {
                    config.updateCircuitState(methodKey, (state) => {
                      state.failures += 1;
                      state.lastFailureTime = now;
                    });
                    
                    if (circuitState.failures >= failureThreshold) {
                      config.changeCircuitState(methodKey, CircuitState.OPEN);
                    }
                  } else {
                    // Reset failures if outside window
                    config.updateCircuitState(methodKey, (state) => {
                      state.failures = 1;
                      state.lastFailureTime = now;
                    });
                  }
                } else if (circuitState.state === CircuitState.HALF_OPEN) {
                  // Any failure in half-open state opens the circuit again
                  config.changeCircuitState(methodKey, CircuitState.OPEN);
                }
              }
            }
            
            // Last attempt - don't delay, just break
            if (attempt === maxAttempts) {
              logger.debug(`Max retry attempts (${maxAttempts}) reached for ${methodKey}`);
              
              if (retryConfig.onMaxAttemptsReached) {
                retryConfig.onMaxAttemptsReached(error, maxAttempts);
              }
              
              break;
            }
            
            // Calculate backoff delay
            const delay = calculateBackoff(attempt, retryConfig);
            
            if (retryConfig.onRetry) {
              retryConfig.onRetry(error, attempt);
            }
            
            logger.debug(`Retry attempt ${attempt}/${maxAttempts} for ${methodKey} after ${delay}ms delay`);
            
            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        // All retries failed, use fallback or throw
        if (retryConfig.fallback) {
          logger.debug(`Using retry fallback for ${methodKey}`);
          return retryConfig.fallback(lastError, ...args);
        }
        
        if (config.isFallbackEnabled()) {
          const fallbackConfig = config.getFallbackConfig();
          
          if (fallbackConfig.handler) {
            if (fallbackConfig.logOriginalError) {
              logger.error(`Error in ${methodKey}, using fallback:`, lastError);
            }
            
            logger.debug(`Using general fallback for ${methodKey} (after retries)`);
            return fallbackConfig.handler(lastError, ...args);
          }
        }
        
        throw lastError;
      } else {
        // No retry, just execute with circuit breaker and fallback
        try {
          // Execute the original method
          const result = await originalMethod.apply(this, args);
          
          // Update circuit breaker on success (if enabled)
          if (config.isCircuitBreakerEnabled()) {
            const circuitState = config.getCircuitState(methodKey);
            
            if (circuitState.state === CircuitState.HALF_OPEN) {
              const circuitConfig = config.getCircuitBreakerConfig();
              const successThreshold = circuitConfig.successThreshold || 2;
              
              config.updateCircuitState(methodKey, (state) => {
                state.successCount += 1;
              });
              
              if (circuitState.successCount >= successThreshold) {
                config.changeCircuitState(methodKey, CircuitState.CLOSED);
                config.updateCircuitState(methodKey, (state) => {
                  state.failures = 0;
                });
              }
            }
          }
          
          return result;
        } catch (error) {
          // Update circuit breaker on failure (if enabled)
          if (config.isCircuitBreakerEnabled()) {
            const circuitState = config.getCircuitState(methodKey);
            const circuitConfig = config.getCircuitBreakerConfig();
            
            // Check if this error counts as a failure for the circuit breaker
            const isFailure = !circuitConfig.isFailure || circuitConfig.isFailure(error);
            
            if (isFailure) {
              const now = Date.now();
              
              if (circuitState.state === CircuitState.CLOSED) {
                const failureThreshold = circuitConfig.failureThreshold || 5;
                const failureWindow = circuitConfig.failureWindow || 60000;
                
                // Only count failures within the window
                if (circuitState.failures === 0 || now - circuitState.lastFailureTime <= failureWindow) {
                  config.updateCircuitState(methodKey, (state) => {
                    state.failures += 1;
                    state.lastFailureTime = now;
                  });
                  
                  if (circuitState.failures >= failureThreshold) {
                    config.changeCircuitState(methodKey, CircuitState.OPEN);
                  }
                } else {
                  // Reset failures if outside window
                  config.updateCircuitState(methodKey, (state) => {
                    state.failures = 1;
                    state.lastFailureTime = now;
                  });
                }
              } else if (circuitState.state === CircuitState.HALF_OPEN) {
                // Any failure in half-open state opens the circuit again
                config.changeCircuitState(methodKey, CircuitState.OPEN);
              }
            }
            
            // Use circuit breaker fallback if available
            if (circuitConfig.fallback) {
              logger.debug(`Using circuit breaker fallback for ${methodKey}`);
              return circuitConfig.fallback(error, ...args);
            }
          }
          
          // Use general fallback if available
          if (config.isFallbackEnabled()) {
            const fallbackConfig = config.getFallbackConfig();
            
            if (fallbackConfig.handler) {
              if (fallbackConfig.logOriginalError) {
                logger.error(`Error in ${methodKey}, using fallback:`, error);
              }
              
              logger.debug(`Using general fallback for ${methodKey}`);
              return fallbackConfig.handler(error, ...args);
            }
          }
          
          throw error;
        }
      }
    };
    
    return descriptor;
  };
  
  // Add fluent API methods to the decorator function
  Object.defineProperties(decorator, {
    withRetry: {
      value: config.withRetry.bind(config),
      writable: false
    },
    withCircuitBreaker: {
      value: config.withCircuitBreaker.bind(config),
      writable: false
    },
    withFallback: {
      value: config.withFallback.bind(config),
      writable: false
    }
  });
  
  return decorator as MethodDecorator & ResilientConfig<T>;
}

/**
 * This module is part of the AUSTA SuperApp error handling framework.
 * It provides a comprehensive resilience decorator that combines multiple error handling patterns
 * into a single, configurable decorator with a fluent API.
 * 
 * The Resilient decorator implements the error handling patterns described in the technical specification:
 * - Retry with exponential backoff for transient errors
 * - Circuit breaker pattern for failing dependencies
 * - Fallback to cached data or default behavior
 * 
 * These patterns ensure consistent error handling across all journeys (Health, Care, Plan)
 * and provide a robust foundation for building reliable services.
 */
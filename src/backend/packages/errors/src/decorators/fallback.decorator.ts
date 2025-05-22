/**
 * @file Fallback Strategy Decorators
 * 
 * This module provides decorators for implementing fallback strategies when method calls fail.
 * These decorators ensure services can continue operating in degraded mode when dependencies fail,
 * rather than propagating errors to users.
 * 
 * The module exports three main decorators:
 * - WithFallback: For specifying a fallback function to execute on failure
 * - CachedFallback: For returning cached results when available
 * - DefaultFallback: For returning a default value
 */

import { Logger } from '@nestjs/common';
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { BaseError, ErrorType } from '../base';
import { FallbackConfig, CacheConfig } from './types';

// Simple in-memory cache for CachedFallback decorator
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

// Global cache store for CachedFallback decorator
const cacheStore = new Map<string, CacheEntry<any>>();

/**
 * Logger instance for fallback decorators
 */
const logger = new Logger('FallbackDecorator');

/**
 * Interface for CachedFallback decorator configuration
 * Extends the base FallbackConfig with cache-specific options
 */
export interface CachedFallbackConfig<T = any> extends Omit<FallbackConfig<T>, 'handler'> {
  /**
   * Time-to-live for cached items in milliseconds
   * @default 300000 (5 minutes)
   */
  ttl?: number;
  
  /**
   * Function to generate a cache key from function arguments
   * If not provided, a default implementation using JSON.stringify will be used
   * @param args - Original function arguments
   * @returns Cache key string
   */
  keyGenerator?: (...args: any[]) => string;
  
  /**
   * Default value to return if no cached value is available
   * If not provided and no cached value is available, the original error will be thrown
   */
  defaultValue?: T;
  
  /**
   * Whether to update the cache when a successful result is returned
   * @default true
   */
  updateCacheOnSuccess?: boolean;
}

/**
 * Interface for DefaultFallback decorator configuration
 * Simplifies the base FallbackConfig by replacing the handler with a static value
 */
export interface DefaultFallbackConfig<T = any> extends Omit<FallbackConfig<T>, 'handler'> {
  /**
   * Default value to return when an error occurs
   */
  defaultValue: T;
}

/**
 * Generates a default cache key from function arguments
 * @param target - Class instance or constructor function
 * @param propertyKey - Method name
 * @param args - Method arguments
 * @returns Cache key string
 */
function generateDefaultCacheKey(target: any, propertyKey: string | symbol, args: any[]): string {
  try {
    // Create a key based on class name, method name, and stringified arguments
    const className = target.constructor?.name || 'unknown';
    const methodName = String(propertyKey);
    const argsString = JSON.stringify(args, (_, value) => {
      // Handle circular references and functions
      if (typeof value === 'function') return '[Function]';
      if (typeof value === 'object' && value !== null) {
        try {
          JSON.stringify(value);
          return value;
        } catch {
          return '[Circular]';
        }
      }
      return value;
    });
    
    return `${className}:${methodName}:${argsString}`;
  } catch (error) {
    // If JSON.stringify fails, use a simpler key
    logger.warn(`Failed to generate cache key: ${error.message}. Using fallback key.`);
    return `${target.constructor?.name || 'unknown'}:${String(propertyKey)}:${args.length}`;
  }
}

/**
 * Records metrics for fallback execution
 * @param success - Whether the fallback was successful
 * @param target - Class instance or constructor function
 * @param propertyKey - Method name
 * @param error - Original error that triggered the fallback
 */
function recordFallbackMetrics(success: boolean, target: any, propertyKey: string | symbol, error: Error): void {
  const className = target.constructor?.name || 'unknown';
  const methodName = String(propertyKey);
  const errorType = error instanceof BaseError ? error.type : 'unknown';
  
  // Record in current span if available
  const activeSpan = trace.getSpan(context.active());
  if (activeSpan) {
    activeSpan.setAttribute('fallback.executed', true);
    activeSpan.setAttribute('fallback.success', success);
    activeSpan.setAttribute('fallback.method', `${className}.${methodName}`);
    activeSpan.setAttribute('fallback.error_type', errorType);
    
    if (!success) {
      activeSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: `Fallback failed: ${error.message}`
      });
    }
  }
  
  // Log fallback execution
  if (success) {
    logger.debug(
      `Fallback executed successfully for ${className}.${methodName}. ` +
      `Original error: [${errorType}] ${error.message}`
    );
  } else {
    logger.error(
      `Fallback failed for ${className}.${methodName}. ` +
      `Original error: [${errorType}] ${error.message}`
    );
  }
  
  // Here you would also record metrics to your metrics system (e.g., Prometheus)
  // This is a placeholder for where you would integrate with your metrics system
  // metricsRegistry.increment('fallback.executed', { class: className, method: methodName, success, errorType });
}

/**
 * Decorator that provides a fallback mechanism when a method call fails.
 * The fallback handler receives the original error and method arguments,
 * and should return a value compatible with the method's return type.
 * 
 * @param config - Configuration for the fallback behavior
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @WithFallback({
 *   handler: (error, userId) => ({ id: userId, name: 'Unknown', isDefault: true }),
 *   condition: (error) => error instanceof ExternalServiceError,
 *   logOriginalError: true
 * })
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation that might fail
 *   return this.userService.fetchProfile(userId);
 * }
 * ```
 */
export function WithFallback<T = any>(config: FallbackConfig<T>): MethodDecorator {
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      try {
        // Call the original method
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Check if the fallback should be used for this error
        if (config.condition && !config.condition(error)) {
          throw error;
        }
        
        // Log the original error if configured to do so
        if (config.logOriginalError !== false) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorType = error instanceof BaseError ? error.type : 'unknown';
          logger.warn(
            `Error in ${target.constructor?.name || 'unknown'}.${String(propertyKey)}: ` +
            `[${errorType}] ${errorMessage}. Executing fallback.`
          );
        }
        
        try {
          // Execute the fallback handler
          const fallbackResult = await config.handler(error, ...args);
          
          // Record metrics for successful fallback
          recordFallbackMetrics(true, target, propertyKey, error);
          
          return fallbackResult;
        } catch (fallbackError) {
          // Record metrics for failed fallback
          recordFallbackMetrics(false, target, propertyKey, error);
          
          // Create a more informative error
          const enhancedError = new BaseError(
            `Fallback for ${String(propertyKey)} failed: ${fallbackError.message}`,
            config.errorType || ErrorType.TECHNICAL,
            config.errorCode || 'FALLBACK_ERROR',
            {
              component: target.constructor?.name,
              operation: String(propertyKey),
              metadata: {
                originalError: error instanceof Error ? {
                  message: error.message,
                  name: error.name,
                  stack: error.stack
                } : String(error)
              }
            },
            {
              fallbackError: fallbackError instanceof Error ? {
                message: fallbackError.message,
                name: fallbackError.name,
                stack: fallbackError.stack
              } : String(fallbackError)
            },
            error instanceof Error ? error : undefined
          );
          
          throw enhancedError;
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator that provides a cached fallback mechanism when a method call fails.
 * It will return cached results when available, and optionally update the cache
 * with successful results.
 * 
 * @param config - Configuration for the cached fallback behavior
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @CachedFallback({
 *   ttl: 600000, // 10 minutes
 *   defaultValue: { rates: [], timestamp: 0, isDefault: true },
 *   updateCacheOnSuccess: true
 * })
 * async getExchangeRates(): Promise<ExchangeRates> {
 *   // Method implementation that might fail
 *   return this.exchangeService.fetchLatestRates();
 * }
 * ```
 */
export function CachedFallback<T = any>(config: CachedFallbackConfig<T>): MethodDecorator {
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const ttl = config.ttl || 300000; // Default to 5 minutes
    const updateCacheOnSuccess = config.updateCacheOnSuccess !== false;
    
    descriptor.value = async function(...args: any[]) {
      // Generate cache key
      const keyGenerator = config.keyGenerator || 
        ((args) => generateDefaultCacheKey(this, propertyKey, args));
      const cacheKey = keyGenerator.apply(this, args);
      
      try {
        // Call the original method
        const result = await originalMethod.apply(this, args);
        
        // Update cache if configured to do so
        if (updateCacheOnSuccess) {
          cacheStore.set(cacheKey, {
            value: result,
            timestamp: Date.now(),
            ttl
          });
        }
        
        return result;
      } catch (error) {
        // Check if the fallback should be used for this error
        if (config.condition && !config.condition(error)) {
          throw error;
        }
        
        // Log the original error
        if (config.logOriginalError !== false) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorType = error instanceof BaseError ? error.type : 'unknown';
          logger.warn(
            `Error in ${target.constructor?.name || 'unknown'}.${String(propertyKey)}: ` +
            `[${errorType}] ${errorMessage}. Checking cache for fallback.`
          );
        }
        
        // Check if we have a cached value
        const cachedEntry = cacheStore.get(cacheKey);
        if (cachedEntry && Date.now() - cachedEntry.timestamp < cachedEntry.ttl) {
          // We have a valid cached value
          logger.debug(
            `Using cached value for ${target.constructor?.name || 'unknown'}.${String(propertyKey)}. ` +
            `Cache age: ${(Date.now() - cachedEntry.timestamp) / 1000}s`
          );
          
          // Record metrics for successful fallback
          recordFallbackMetrics(true, target, propertyKey, error);
          
          return cachedEntry.value;
        }
        
        // No valid cached value, check if we have a default value
        if ('defaultValue' in config) {
          logger.debug(
            `No valid cache found for ${target.constructor?.name || 'unknown'}.${String(propertyKey)}. ` +
            `Using default value.`
          );
          
          // Record metrics for successful fallback
          recordFallbackMetrics(true, target, propertyKey, error);
          
          return config.defaultValue;
        }
        
        // No fallback available, rethrow the original error
        logger.error(
          `No valid cache or default value for ${target.constructor?.name || 'unknown'}.${String(propertyKey)}. ` +
          `Propagating original error.`
        );
        
        // Record metrics for failed fallback
        recordFallbackMetrics(false, target, propertyKey, error);
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator that provides a simple default value fallback when a method call fails.
 * It will return the specified default value when an error occurs.
 * 
 * @param config - Configuration for the default fallback behavior
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @DefaultFallback({
 *   defaultValue: [],
 *   condition: (error) => error instanceof NetworkError
 * })
 * async getRecommendations(userId: string): Promise<Recommendation[]> {
 *   // Method implementation that might fail
 *   return this.recommendationService.fetchForUser(userId);
 * }
 * ```
 */
export function DefaultFallback<T = any>(config: DefaultFallbackConfig<T>): MethodDecorator {
  // Convert DefaultFallbackConfig to FallbackConfig
  const fallbackConfig: FallbackConfig<T> = {
    ...config,
    handler: (error, ...args) => config.defaultValue
  };
  
  // Reuse the WithFallback decorator
  return WithFallback(fallbackConfig);
}

/**
 * Utility function to clear the cache for a specific key or all keys
 * @param key - Optional cache key to clear. If not provided, all cache entries will be cleared.
 */
export function clearFallbackCache(key?: string): void {
  if (key) {
    cacheStore.delete(key);
    logger.debug(`Cleared fallback cache for key: ${key}`);
  } else {
    cacheStore.clear();
    logger.debug('Cleared all fallback cache entries');
  }
}

/**
 * Utility function to get the current size of the fallback cache
 * @returns Number of entries in the cache
 */
export function getFallbackCacheSize(): number {
  return cacheStore.size;
}

/**
 * Utility function to check if a key exists in the fallback cache
 * @param key - Cache key to check
 * @returns True if the key exists and is not expired, false otherwise
 */
export function hasFallbackCacheKey(key: string): boolean {
  const entry = cacheStore.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * This module is part of the AUSTA SuperApp error handling framework.
 * It provides decorators for implementing fallback strategies when method calls fail.
 * 
 * The decorators implement the fallback pattern described in the technical specification:
 * - Fallback to cached data when appropriate
 * - Graceful degradation of features
 * - Enhanced error handling with fallback strategies
 * 
 * These decorators ensure services can continue operating in degraded mode when
 * dependencies fail, rather than propagating errors to users.
 */
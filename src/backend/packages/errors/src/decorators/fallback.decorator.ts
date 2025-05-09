import { BaseError, ErrorType, JourneyContext } from '../base';
import { ErrorRecoveryStrategy } from '../types';
import {
  FallbackOptions,
  CachedFallbackOptions,
  DefaultFallbackOptions,
  isFallbackOptions,
  isCachedFallbackOptions,
  isDefaultFallbackOptions
} from './types';

// Import optional dependencies - these will be injected if available
let logger: any;
let tracer: any;

// Try to import the logger and tracer services
try {
  // Using dynamic imports to avoid hard dependencies
  import('@austa/logging').then(logging => {
    logger = logging.getLogger('fallback-decorator');
  }).catch(() => {
    // Logger not available, will use console fallback
  });
  
  import('@austa/tracing').then(tracing => {
    tracer = tracing.getTracer('fallback-decorator');
  }).catch(() => {
    // Tracer not available, will skip tracing
  });
} catch (e) {
  // Module not found, will use fallbacks
}

/**
 * Cache storage for CachedFallback decorator.
 * Maps method + args hash to cached result and expiration time.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory cache for CachedFallback decorator.
 * This could be replaced with a more sophisticated caching solution if needed.
 */
const fallbackCache = new Map<string, CacheEntry<any>>();

/**
 * Metrics for tracking fallback executions.
 * These could be integrated with a proper metrics system in production.
 */
const fallbackMetrics = {
  totalFallbacks: 0,
  successfulFallbacks: 0,
  failedFallbacks: 0,
  byErrorType: new Map<string, number>(),
  byJourney: new Map<string, number>(),
  
  /**
   * Records a fallback execution.
   * 
   * @param success - Whether the fallback was successful
   * @param errorType - The type of error that triggered the fallback
   * @param journey - The journey context in which the fallback occurred
   */
  recordFallback(success: boolean, errorType?: string, journey?: string): void {
    this.totalFallbacks++;
    
    if (success) {
      this.successfulFallbacks++;
    } else {
      this.failedFallbacks++;
    }
    
    if (errorType) {
      const current = this.byErrorType.get(errorType) || 0;
      this.byErrorType.set(errorType, current + 1);
    }
    
    if (journey) {
      const current = this.byJourney.get(journey) || 0;
      this.byJourney.set(journey, current + 1);
    }
  },
  
  /**
   * Gets the current metrics.
   * 
   * @returns Object containing all metrics
   */
  getMetrics(): Record<string, any> {
    return {
      totalFallbacks: this.totalFallbacks,
      successfulFallbacks: this.successfulFallbacks,
      failedFallbacks: this.failedFallbacks,
      byErrorType: Object.fromEntries(this.byErrorType),
      byJourney: Object.fromEntries(this.byJourney)
    };
  }
};

/**
 * Utility function to generate a cache key from method arguments.
 * 
 * @param target - The class instance
 * @param methodName - The method name
 * @param args - The method arguments
 * @returns A string cache key
 */
function generateCacheKey(target: any, methodName: string, args: any[]): string {
  const targetName = target.constructor?.name || 'unknown';
  const argsHash = JSON.stringify(args);
  return `${targetName}:${methodName}:${argsHash}`;
}

/**
 * Determines if a fallback should be used for a given error based on configuration.
 * 
 * @param error - The error to check
 * @param fallbackErrors - Array of error types that should trigger fallback
 * @param shouldFallback - Custom function to determine if fallback should be used
 * @returns True if fallback should be used, false otherwise
 */
function shouldUseFallback(
  error: Error,
  fallbackErrors?: ErrorType[],
  shouldFallback?: (error: Error) => boolean
): boolean {
  // If custom function is provided, use it
  if (shouldFallback) {
    return shouldFallback(error);
  }
  
  // If no error types specified, fallback for all errors
  if (!fallbackErrors || fallbackErrors.length === 0) {
    return true;
  }
  
  // Check if error type matches any in the fallbackErrors array
  if (error instanceof BaseError) {
    return fallbackErrors.includes(error.type);
  }
  
  // For non-BaseError errors, default to true
  return true;
}

/**
 * Extracts journey context from an error if available.
 * 
 * @param error - The error to extract context from
 * @returns The journey context or undefined
 */
function getJourneyFromError(error: Error): string | undefined {
  if (error instanceof BaseError && error.context.journey) {
    return error.context.journey;
  }
  return undefined;
}

/**
 * Decorator that applies a fallback function when a method call fails.
 * This is useful for handling transient errors or external service failures
 * by providing an alternative implementation.
 * 
 * @param options - Configuration options for the fallback
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * class UserService {
 *   // Basic usage with fallback function
 *   @WithFallback({
 *     fallbackFn: (error, userId) => ({ id: userId, name: 'Unknown User', isPlaceholder: true }),
 *     fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 *   })
 *   async getUserById(userId: string): Promise<User> {
 *     // Implementation that might fail
 *   }
 *   
 *   // Using with custom error filtering
 *   @WithFallback({
 *     fallbackFn: (error, productId) => ({
 *       id: productId,
 *       name: 'Temporary Product',
 *       price: 0,
 *       isAvailable: false
 *     }),
 *     shouldFallback: (error) => {
 *       // Only use fallback for database connection errors
 *       return error.message.includes('database connection');
 *     }
 *   })
 *   async getProductDetails(productId: string): Promise<Product> {
 *     // Implementation that might fail
 *   }
 *   
 *   // Using with journey-specific error handling
 *   @WithFallback({
 *     fallbackFn: async (error, appointmentId) => {
 *       // Log the fallback usage for monitoring
 *       await this.metricsService.incrementCounter('appointment_fallback_used');
 *       
 *       // Return a placeholder appointment
 *       return {
 *         id: appointmentId,
 *         status: 'unknown',
 *         message: 'Appointment information temporarily unavailable',
 *         canReschedule: false
 *       };
 *     },
 *     fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
 *   })
 *   async getAppointmentDetails(appointmentId: string): Promise<Appointment> {
 *     // Implementation that might fail when the care service is unavailable
 *   }
 * }
 * ```
 */
export function WithFallback<T, A extends any[]>(
  options: FallbackOptions<T, A>
): MethodDecorator {
  // Validate options
  if (!isFallbackOptions<T, A>(options)) {
    throw new Error('Invalid options provided to WithFallback decorator');
  }
  
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: A) {
      try {
        // Attempt to call the original method
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Determine if we should use the fallback for this error
        if (shouldUseFallback(error as Error, options.fallbackErrors, options.shouldFallback)) {
          try {
            // Get journey context for metrics
            const journey = getJourneyFromError(error as Error);
            
            // Log fallback execution
            if (logger) {
              logger.warn(
                `Executing fallback for ${String(propertyKey)}`,
                {
                  method: String(propertyKey),
                  error: (error as Error).message,
                  errorType: (error as BaseError)?.type,
                  journey,
                  fallbackType: 'function'
                }
              );
            } else {
              console.log(`[Fallback] Executing fallback for ${String(propertyKey)} due to error: ${(error as Error).message}`);
            }
            
            // Create span for fallback execution if tracing is available
            const fallbackSpan = tracer?.startSpan?.(`fallback.${String(propertyKey)}`);
            try {
              // Execute fallback function
              const result = await options.fallbackFn.call(this, error, ...args);
              
              // Record metrics
              fallbackMetrics.recordFallback(true, (error as BaseError)?.type, journey);
              
              // Mark span as successful
              fallbackSpan?.setStatus?.({ code: 0 }); // 0 = OK in OpenTelemetry
              fallbackSpan?.end?.();
              
              return result;
            } catch (fallbackError) {
              // Mark span as failed
              fallbackSpan?.setStatus?.({ code: 1, message: (fallbackError as Error).message }); // 1 = ERROR in OpenTelemetry
              fallbackSpan?.end?.();
              throw fallbackError;
            }
            
            return result;
          } catch (fallbackError) {
            // Fallback function itself failed
            if (logger) {
              logger.error(
                `Fallback for ${String(propertyKey)} failed`,
                {
                  method: String(propertyKey),
                  originalError: (error as Error).message,
                  originalErrorType: (error as BaseError)?.type,
                  fallbackError: (fallbackError as Error).message,
                  journey: getJourneyFromError(error as Error),
                  fallbackType: 'function'
                }
              );
            } else {
              console.error(`[Fallback] Fallback for ${String(propertyKey)} failed: ${(fallbackError as Error).message}`);
            }
            
            // Record metrics
            fallbackMetrics.recordFallback(false, (error as BaseError)?.type, getJourneyFromError(error as Error));
            
            // Re-throw the original error
            throw error;
          }
        } else {
          // Error doesn't match fallback criteria, re-throw
          throw error;
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator that returns cached results when a method call fails.
 * Results are cached with a configurable time-to-live (TTL).
 * This is particularly useful for methods that fetch data from external services
 * where stale data is better than no data during outages.
 * 
 * @param options - Configuration options for the cached fallback
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * class WeatherService {
 *   // Basic usage with TTL and default value
 *   @CachedFallback({
 *     ttl: 300000, // 5 minutes
 *     defaultValue: { temperature: 'Unknown', conditions: 'Unknown' },
 *     fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 *   })
 *   async getWeatherForLocation(latitude: number, longitude: number): Promise<WeatherData> {
 *     // Implementation that might fail
 *   }
 *   
 *   // Using with custom cache key generation
 *   @CachedFallback({
 *     ttl: 600000, // 10 minutes
 *     cacheKeyFn: (userId, date) => `health_metrics_${userId}_${date.toISOString().split('T')[0]}`,
 *     fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 *   })
 *   async getHealthMetricsForDate(userId: string, date: Date): Promise<HealthMetrics> {
 *     // Implementation that might fail
 *   }
 *   
 *   // Using with selective error handling
 *   @CachedFallback({
 *     ttl: 1800000, // 30 minutes
 *     defaultValue: [],
 *     shouldFallback: (error) => {
 *       // Only use cached data for specific error conditions
 *       if (error instanceof BaseError) {
 *         return error.type === ErrorType.EXTERNAL || 
 *                error.type === ErrorType.TIMEOUT ||
 *                (error.type === ErrorType.TECHNICAL && error.code.startsWith('DB_'));
 *       }
 *       return false;
 *     }
 *   })
 *   async getRecommendedArticles(userId: string): Promise<Article[]> {
 *     // Implementation that might fail
 *   }
 * }
 * ```
 */
export function CachedFallback<T>(
  options: CachedFallbackOptions<T>
): MethodDecorator {
  // Validate options
  if (!isCachedFallbackOptions<T>(options)) {
    throw new Error('Invalid options provided to CachedFallback decorator');
  }
  
  // Set default TTL if not provided
  const ttl = options.ttl ?? 60000; // Default: 1 minute
  
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      // Generate cache key
      const cacheKey = options.cacheKeyFn 
        ? options.cacheKeyFn(...args)
        : generateCacheKey(this, String(propertyKey), args);
      
      try {
        // Attempt to call the original method
        const result = await originalMethod.apply(this, args);
        
        // Cache the successful result
        fallbackCache.set(cacheKey, {
          value: result,
          expiresAt: Date.now() + ttl
        });
        
        return result;
      } catch (error) {
        // Determine if we should use the fallback for this error
        if (shouldUseFallback(error as Error, options.fallbackErrors, options.shouldFallback)) {
          // Get journey context for metrics
          const journey = getJourneyFromError(error as Error);
          
          // Check if we have a cached result
          const cachedEntry = fallbackCache.get(cacheKey);
          
          // Create span for fallback execution if tracing is available
          const fallbackSpan = tracer?.startSpan?.(`cached-fallback.${String(propertyKey)}`);
          
          try {
            if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
              // Log cache hit
              if (logger) {
                logger.warn(
                  `Using cached result for ${String(propertyKey)}`,
                  {
                    method: String(propertyKey),
                    error: (error as Error).message,
                    errorType: (error as BaseError)?.type,
                    journey,
                    fallbackType: 'cached',
                    cacheAge: Math.floor((Date.now() - (cachedEntry.expiresAt - ttl)) / 1000) + 's',
                    cacheExpiry: new Date(cachedEntry.expiresAt).toISOString()
                  }
                );
              } else {
                console.log(`[CachedFallback] Using cached result for ${String(propertyKey)} due to error: ${(error as Error).message}`);
              }
              
              // Record metrics
              fallbackMetrics.recordFallback(true, (error as BaseError)?.type, journey);
              
              // Mark span as successful with cache hit
              fallbackSpan?.setAttribute?.('fallback.cache.hit', true);
              fallbackSpan?.setStatus?.({ code: 0 });
              fallbackSpan?.end?.();
              
              return cachedEntry.value;
            } else if (options.defaultValue !== undefined) {
              // Log using default value
              if (logger) {
                logger.warn(
                  `Using default value for ${String(propertyKey)}`,
                  {
                    method: String(propertyKey),
                    error: (error as Error).message,
                    errorType: (error as BaseError)?.type,
                    journey,
                    fallbackType: 'cached',
                    usingDefault: true
                  }
                );
              } else {
                console.log(`[CachedFallback] Using default value for ${String(propertyKey)} due to error: ${(error as Error).message}`);
              }
              
              // Record metrics
              fallbackMetrics.recordFallback(true, (error as BaseError)?.type, journey);
              
              // Mark span as successful with default value
              fallbackSpan?.setAttribute?.('fallback.cache.hit', false);
              fallbackSpan?.setAttribute?.('fallback.default.used', true);
              fallbackSpan?.setStatus?.({ code: 0 });
              fallbackSpan?.end?.();
              
              return options.defaultValue;
            }
            
            // No cached result or default value
            fallbackSpan?.setAttribute?.('fallback.cache.hit', false);
            fallbackSpan?.setAttribute?.('fallback.default.used', false);
            fallbackSpan?.setStatus?.({ code: 1, message: 'No cached data or default value available' });
            fallbackSpan?.end?.();
          } catch (fallbackError) {
            // Fallback mechanism itself failed
            if (logger) {
              logger.error(
                `Cached fallback for ${String(propertyKey)} failed`,
                {
                  method: String(propertyKey),
                  originalError: (error as Error).message,
                  fallbackError: (fallbackError as Error).message,
                  journey,
                  fallbackType: 'cached'
                }
              );
            }
            
            // Mark span as failed
            fallbackSpan?.setStatus?.({ code: 1, message: (fallbackError as Error).message });
            fallbackSpan?.end?.();
          }
          
          // No cached result or default value, record failed fallback
          fallbackMetrics.recordFallback(false, (error as BaseError)?.type, journey);
        }
        
        // Re-throw the original error
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator that returns a default value when a method call fails.
 * This is the simplest fallback strategy, useful when a static default value
 * is acceptable during failures.
 * 
 * @param options - Configuration options for the default fallback
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * class ProductService {
 *   // Basic usage with empty array default
 *   @DefaultFallback({
 *     defaultValue: [],
 *     fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 *   })
 *   async getRecommendedProducts(userId: string): Promise<Product[]> {
 *     // Implementation that might fail
 *   }
 *   
 *   // Using with journey-specific error types
 *   @DefaultFallback({
 *     defaultValue: { available: false, message: 'Service temporarily unavailable' },
 *     fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
 *   })
 *   async checkAppointmentAvailability(providerId: string, date: Date): Promise<AvailabilityResponse> {
 *     // Implementation that might fail when the care service is unavailable
 *   }
 *   
 *   // Using with custom error filtering
 *   @DefaultFallback({
 *     defaultValue: 0,
 *     shouldFallback: (error) => {
 *       // Only use default value for specific error conditions
 *       if (error instanceof BaseError) {
 *         // For plan journey errors related to coverage determination
 *         if (error.context.journey === JourneyContext.PLAN && 
 *             error.code.startsWith('COVERAGE_')) {
 *           return true;
 *         }
 *         // For timeout errors
 *         if (error.type === ErrorType.TIMEOUT) {
 *           return true;
 *         }
 *       }
 *       return false;
 *     }
 *   })
 *   async calculateCoveragePercentage(procedureCode: string, planId: string): Promise<number> {
 *     // Implementation that might fail
 *   }
 * }
 * ```
 */
export function DefaultFallback<T>(
  options: DefaultFallbackOptions<T>
): MethodDecorator {
  // Validate options
  if (!isDefaultFallbackOptions<T>(options)) {
    throw new Error('Invalid options provided to DefaultFallback decorator');
  }
  
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      try {
        // Attempt to call the original method
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Determine if we should use the fallback for this error
        if (shouldUseFallback(error as Error, options.fallbackErrors, options.shouldFallback)) {
          // Get journey context for metrics
          const journey = getJourneyFromError(error as Error);
          
          // Create span for fallback execution if tracing is available
          const fallbackSpan = tracer?.startSpan?.(`default-fallback.${String(propertyKey)}`);
          
          try {
            // Log using default value
            if (logger) {
              logger.warn(
                `Using default value for ${String(propertyKey)}`,
                {
                  method: String(propertyKey),
                  error: (error as Error).message,
                  errorType: (error as BaseError)?.type,
                  journey,
                  fallbackType: 'default'
                }
              );
            } else {
              console.log(`[DefaultFallback] Using default value for ${String(propertyKey)} due to error: ${(error as Error).message}`);
            }
            
            // Record metrics
            fallbackMetrics.recordFallback(true, (error as BaseError)?.type, journey);
            
            // Mark span as successful
            fallbackSpan?.setStatus?.({ code: 0 });
            fallbackSpan?.end?.();
            
            return options.defaultValue;
          } catch (fallbackError) {
            // This should rarely happen since we're just returning a static value
            if (logger) {
              logger.error(
                `Default fallback for ${String(propertyKey)} failed`,
                {
                  method: String(propertyKey),
                  originalError: (error as Error).message,
                  fallbackError: (fallbackError as Error).message,
                  journey,
                  fallbackType: 'default'
                }
              );
            }
            
            // Mark span as failed
            fallbackSpan?.setStatus?.({ code: 1, message: (fallbackError as Error).message });
            fallbackSpan?.end?.();
            
            // Re-throw the original error
            throw error;
          }
        } else {
          // Error doesn't match fallback criteria, re-throw
          throw error;
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * Utility function to clear the fallback cache.
 * Useful for testing or when cache needs to be explicitly invalidated.
 */
export function clearFallbackCache(): void {
  fallbackCache.clear();
}

/**
 * Utility function to get current fallback metrics.
 * Useful for monitoring and debugging.
 * 
 * @returns Object containing fallback metrics
 */
export function getFallbackMetrics(): Record<string, any> {
  return fallbackMetrics.getMetrics();
}

/**
 * Utility function to check if a cached result exists for a method call.
 * 
 * @param target - The class instance
 * @param methodName - The method name
 * @param args - The method arguments
 * @returns True if a valid cached result exists, false otherwise
 */
export function hasCachedResult(target: any, methodName: string, args: any[]): boolean {
  const cacheKey = generateCacheKey(target, methodName, args);
  const cachedEntry = fallbackCache.get(cacheKey);
  return !!(cachedEntry && cachedEntry.expiresAt > Date.now());
}

/**
 * Utility function to manually cache a result for a method call.
 * Useful for preloading cache or updating cache outside normal flow.
 * 
 * @param target - The class instance
 * @param methodName - The method name
 * @param args - The method arguments
 * @param value - The value to cache
 * @param ttl - Time-to-live in milliseconds (default: 60000 = 1 minute)
 */
export function setCachedResult<T>(target: any, methodName: string, args: any[], value: T, ttl: number = 60000): void {
  const cacheKey = generateCacheKey(target, methodName, args);
  fallbackCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttl
  });
}

/**
 * Utility function to manually invalidate a cached result for a method call.
 * 
 * @param target - The class instance
 * @param methodName - The method name
 * @param args - The method arguments
 */
export function invalidateCachedResult(target: any, methodName: string, args: any[]): void {
  const cacheKey = generateCacheKey(target, methodName, args);
  fallbackCache.delete(cacheKey);
}

/**
 * Utility function to register a custom fallback strategy.
 * This allows extending the fallback system with custom strategies.
 * 
 * @param strategyName - Unique name for the strategy
 * @param strategyImplementation - Function implementing the strategy
 */
export function registerFallbackStrategy(
  strategyName: string,
  strategyImplementation: (error: Error, target: any, propertyKey: string | symbol, args: any[]) => any
): void {
  // This is a placeholder for future extensibility
  // In a real implementation, this would register the strategy in a registry
  console.log(`Strategy ${strategyName} registered (placeholder implementation)`);
}

/**
 * Creates a fallback function that wraps the original method with a fallback strategy.
 * This is useful when you need to apply fallback logic programmatically rather than
 * using decorators, such as in functional components or utility functions.
 * 
 * @param originalFn - The original function to wrap
 * @param options - Configuration options for the fallback
 * @returns A wrapped function with fallback logic
 * 
 * @example
 * ```typescript
 * // Basic usage with a user service function
 * const getUserWithFallback = createFallbackFunction(
 *   getUserById,
 *   {
 *     fallbackFn: (error, userId) => ({ id: userId, name: 'Unknown User', isPlaceholder: true }),
 *     fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 *   }
 * );
 * 
 * // Using in a React component
 * function UserProfile({ userId }) {
 *   const fetchUserData = React.useCallback(async (id) => {
 *     return await api.getUserById(id);
 *   }, []);
 *   
 *   const fetchUserWithFallback = createFallbackFunction(
 *     fetchUserData,
 *     {
 *       fallbackFn: (error, id) => ({
 *         id,
 *         name: 'Guest User',
 *         avatar: '/default-avatar.png',
 *         isPlaceholder: true
 *       }),
 *       fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.NOT_FOUND]
 *     }
 *   );
 *   
 *   // Rest of component...
 * }
 * 
 * // Using with async/await in utility functions
 * async function processHealthData(userId) {
 *   const fetchMetrics = async (id) => await healthService.getMetrics(id);
 *   
 *   const fetchMetricsWithFallback = createFallbackFunction(
 *     fetchMetrics,
 *     {
 *       fallbackFn: async (error, id) => {
 *         // Try to get from local cache first
 *         const cachedMetrics = await localCache.getHealthMetrics(id);
 *         if (cachedMetrics) {
 *           return cachedMetrics;
 *         }
 *         // Return empty metrics as last resort
 *         return { steps: 0, heartRate: [], sleep: [], lastUpdated: null };
 *       },
 *       shouldFallback: (error) => error instanceof BaseError && 
 *                               (error.type === ErrorType.EXTERNAL || 
 *                                error.type === ErrorType.TIMEOUT)
 *     }
 *   );
 *   
 *   const metrics = await fetchMetricsWithFallback(userId);
 *   // Process metrics...
 * }
 * ```
 */
export function createFallbackFunction<T, A extends any[]>(
  originalFn: (...args: A) => Promise<T>,
  options: FallbackOptions<T, A>
): (...args: A) => Promise<T> {
  // Validate options
  if (!isFallbackOptions<T, A>(options)) {
    throw new Error('Invalid options provided to createFallbackFunction');
  }
  
  return async function(...args: A): Promise<T> {
    try {
      // Attempt to call the original function
      return await originalFn(...args);
    } catch (error) {
      // Determine if we should use the fallback for this error
      if (shouldUseFallback(error as Error, options.fallbackErrors, options.shouldFallback)) {
        try {
          // Get journey context for metrics
          const journey = getJourneyFromError(error as Error);
          
          // Log fallback execution
          if (logger) {
            logger.warn(
              'Executing fallback for function',
              {
                error: (error as Error).message,
                errorType: (error as BaseError)?.type,
                journey,
                fallbackType: 'function'
              }
            );
          } else {
            console.log(`[Fallback] Executing fallback for function due to error: ${(error as Error).message}`);
          }
          
          // Create span for fallback execution if tracing is available
          const fallbackSpan = tracer?.startSpan?.('fallback.function');
          
          try {
            // Execute fallback function
            const result = await options.fallbackFn(error as Error, ...args);
            
            // Record metrics
            fallbackMetrics.recordFallback(true, (error as BaseError)?.type, journey);
            
            // Mark span as successful
            fallbackSpan?.setStatus?.({ code: 0 });
            fallbackSpan?.end?.();
            
            return result;
          } catch (fallbackError) {
            // Mark span as failed
            fallbackSpan?.setStatus?.({ code: 1, message: (fallbackError as Error).message });
            fallbackSpan?.end?.();
            throw fallbackError;
          }
        } catch (fallbackError) {
          // Fallback function itself failed
          if (logger) {
            logger.error(
              'Fallback for function failed',
              {
                originalError: (error as Error).message,
                originalErrorType: (error as BaseError)?.type,
                fallbackError: (fallbackError as Error).message,
                journey: getJourneyFromError(error as Error),
                fallbackType: 'function'
              }
            );
          } else {
            console.error(`[Fallback] Fallback for function failed: ${(fallbackError as Error).message}`);
          }
          
          // Record metrics
          fallbackMetrics.recordFallback(false, (error as BaseError)?.type, getJourneyFromError(error as Error));
          
          // Re-throw the original error
          throw error;
        }
      } else {
        // Error doesn't match fallback criteria, re-throw
        throw error;
      }
    }
  };
}

/**
 * Utility function to create a resilient method with fallback capabilities.
 * This is a higher-level utility that combines multiple fallback strategies,
 * trying each one in order until one succeeds or all fail.
 * 
 * @param strategies - Array of fallback strategies to try in order
 * @param fallbackErrors - Types of errors that should trigger the fallback strategies
 * @param shouldFallback - Custom function to determine if fallback should be used
 * @returns A method decorator that applies the specified resilience patterns
 * 
 * @example
 * ```typescript
 * class HealthService {
 *   // Using multiple fallback strategies in order of preference
 *   @createResilientFallback(
 *     [
 *       // First try to use cached data
 *       { 
 *         type: 'cached', 
 *         ttl: 3600000 // 1 hour 
 *       },
 *       // Then try to fetch from secondary source
 *       { 
 *         type: 'function', 
 *         fallbackFn: async (error, userId) => {
 *           try {
 *             // Try to get from backup service
 *             return await this.backupHealthService.getHealthSummary(userId);
 *           } catch (e) {
 *             // If backup fails, re-throw to try next strategy
 *             throw e;
 *           }
 *         }
 *       },
 *       // Finally, use a default value as last resort
 *       { 
 *         type: 'default', 
 *         value: { 
 *           steps: 0, 
 *           heartRate: { average: 0, min: 0, max: 0 },
 *           sleep: { duration: 0, quality: 'unknown' },
 *           lastUpdated: null,
 *           isPlaceholder: true
 *         } 
 *       }
 *     ],
 *     [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
 *   )
 *   async getHealthSummary(userId: string): Promise<HealthSummary> {
 *     // Implementation that fetches from primary health data source
 *     // This might fail due to external service issues
 *     return await this.primaryHealthService.getHealthSummary(userId);
 *   }
 *   
 *   // Using with custom error filtering
 *   @createResilientFallback(
 *     [
 *       { 
 *         type: 'cached', 
 *         ttl: 300000, // 5 minutes
 *         defaultValue: [] 
 *       },
 *       { 
 *         type: 'default', 
 *         value: [] 
 *       }
 *     ],
 *     undefined, // Not using fallbackErrors array
 *     (error) => {
 *       // Custom logic to determine if fallback should be used
 *       if (error instanceof BaseError) {
 *         // Use fallback for external errors in the health journey
 *         if (error.context.journey === JourneyContext.HEALTH && 
 *             (error.type === ErrorType.EXTERNAL || error.type === ErrorType.TIMEOUT)) {
 *           return true;
 *         }
 *         // Use fallback for specific error codes
 *         if (error.code.startsWith('DEVICE_CONNECTION_')) {
 *           return true;
 *         }
 *       }
 *       return false;
 *     }
 *   )
 *   async getRecentWorkouts(userId: string): Promise<Workout[]> {
 *     // Implementation that might fail
 *     return await this.workoutService.getRecentWorkouts(userId);
 *   }
 * }
 * ```
 */
export function createResilientFallback<T>(
  strategies: Array<
    | { type: 'function'; fallbackFn: (error: Error, ...args: any[]) => T | Promise<T> }
    | { type: 'cached'; ttl?: number; defaultValue?: T }
    | { type: 'default'; value: T }
  >,
  fallbackErrors?: ErrorType[],
  shouldFallback?: (error: Error) => boolean
): MethodDecorator {
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      try {
        // Attempt to call the original method
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Determine if we should use the fallback for this error
        if (shouldUseFallback(error as Error, fallbackErrors, shouldFallback)) {
          // Get journey context for metrics
          const journey = getJourneyFromError(error as Error);
          
          // Create span for resilient fallback execution if tracing is available
          const fallbackSpan = tracer?.startSpan?.(`resilient-fallback.${String(propertyKey)}`);
          fallbackSpan?.setAttribute?.('error.type', (error as BaseError)?.type || 'unknown');
          fallbackSpan?.setAttribute?.('error.message', (error as Error).message);
          fallbackSpan?.setAttribute?.('journey', journey || 'unknown');
          
          if (logger) {
            logger.warn(
              `Attempting resilient fallback for ${String(propertyKey)}`,
              {
                method: String(propertyKey),
                error: (error as Error).message,
                errorType: (error as BaseError)?.type,
                journey,
                strategies: strategies.map(s => s.type).join(',')
              }
            );
          }
          
          // Try each fallback strategy in order
          for (let i = 0; i < strategies.length; i++) {
            const strategy = strategies[i];
            const strategySpan = tracer?.startSpan?.(`resilient-fallback.strategy.${strategy.type}`);
            strategySpan?.setAttribute?.('strategy.type', strategy.type);
            strategySpan?.setAttribute?.('strategy.index', i);
            
            try {
              if (strategy.type === 'function') {
                // Log fallback execution
                if (logger) {
                  logger.info(
                    `Executing function fallback for ${String(propertyKey)}`,
                    {
                      method: String(propertyKey),
                      strategyType: 'function',
                      strategyIndex: i
                    }
                  );
                } else {
                  console.log(`[ResilientFallback] Executing function fallback for ${String(propertyKey)}`);
                }
                
                // Execute fallback function
                const result = await strategy.fallbackFn.call(this, error, ...args);
                
                // Record metrics
                fallbackMetrics.recordFallback(true, (error as BaseError)?.type, journey);
                
                // Mark spans as successful
                strategySpan?.setStatus?.({ code: 0 });
                strategySpan?.end?.();
                fallbackSpan?.setAttribute?.('successful.strategy', 'function');
                fallbackSpan?.setAttribute?.('successful.index', i);
                fallbackSpan?.setStatus?.({ code: 0 });
                fallbackSpan?.end?.();
                
                return result;
              } else if (strategy.type === 'cached') {
                // Generate cache key
                const cacheKey = generateCacheKey(this, String(propertyKey), args);
                strategySpan?.setAttribute?.('cache.key', cacheKey);
                
                // Check if we have a cached result
                const cachedEntry = fallbackCache.get(cacheKey);
                const ttl = strategy.ttl ?? 60000; // Default: 1 minute
                
                if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
                  // Log cache hit
                  if (logger) {
                    logger.info(
                      `Using cached result for ${String(propertyKey)}`,
                      {
                        method: String(propertyKey),
                        strategyType: 'cached',
                        strategyIndex: i,
                        cacheAge: Math.floor((Date.now() - (cachedEntry.expiresAt - ttl)) / 1000) + 's',
                        cacheExpiry: new Date(cachedEntry.expiresAt).toISOString()
                      }
                    );
                  } else {
                    console.log(`[ResilientFallback] Using cached result for ${String(propertyKey)}`);
                  }
                  
                  // Record metrics
                  fallbackMetrics.recordFallback(true, (error as BaseError)?.type, journey);
                  
                  // Mark spans as successful with cache hit
                  strategySpan?.setAttribute?.('cache.hit', true);
                  strategySpan?.setStatus?.({ code: 0 });
                  strategySpan?.end?.();
                  fallbackSpan?.setAttribute?.('successful.strategy', 'cached');
                  fallbackSpan?.setAttribute?.('successful.index', i);
                  fallbackSpan?.setAttribute?.('cache.hit', true);
                  fallbackSpan?.setStatus?.({ code: 0 });
                  fallbackSpan?.end?.();
                  
                  return cachedEntry.value;
                } else if (strategy.defaultValue !== undefined) {
                  // Log using default value
                  if (logger) {
                    logger.info(
                      `Using cached strategy default value for ${String(propertyKey)}`,
                      {
                        method: String(propertyKey),
                        strategyType: 'cached',
                        strategyIndex: i,
                        usingDefault: true
                      }
                    );
                  } else {
                    console.log(`[ResilientFallback] Using cached strategy default value for ${String(propertyKey)}`);
                  }
                  
                  // Record metrics
                  fallbackMetrics.recordFallback(true, (error as BaseError)?.type, journey);
                  
                  // Mark spans as successful with default value
                  strategySpan?.setAttribute?.('cache.hit', false);
                  strategySpan?.setAttribute?.('default.used', true);
                  strategySpan?.setStatus?.({ code: 0 });
                  strategySpan?.end?.();
                  fallbackSpan?.setAttribute?.('successful.strategy', 'cached');
                  fallbackSpan?.setAttribute?.('successful.index', i);
                  fallbackSpan?.setAttribute?.('cache.hit', false);
                  fallbackSpan?.setAttribute?.('default.used', true);
                  fallbackSpan?.setStatus?.({ code: 0 });
                  fallbackSpan?.end?.();
                  
                  return strategy.defaultValue;
                }
                
                // No cached result or default value
                strategySpan?.setAttribute?.('cache.hit', false);
                strategySpan?.setAttribute?.('default.used', false);
                strategySpan?.setStatus?.({ code: 1, message: 'No cached data or default value available' });
                strategySpan?.end?.();
              } else if (strategy.type === 'default') {
                // Log using default value
                if (logger) {
                  logger.info(
                    `Using default value for ${String(propertyKey)}`,
                    {
                      method: String(propertyKey),
                      strategyType: 'default',
                      strategyIndex: i
                    }
                  );
                } else {
                  console.log(`[ResilientFallback] Using default value for ${String(propertyKey)}`);
                }
                
                // Record metrics
                fallbackMetrics.recordFallback(true, (error as BaseError)?.type, journey);
                
                // Mark spans as successful
                strategySpan?.setStatus?.({ code: 0 });
                strategySpan?.end?.();
                fallbackSpan?.setAttribute?.('successful.strategy', 'default');
                fallbackSpan?.setAttribute?.('successful.index', i);
                fallbackSpan?.setStatus?.({ code: 0 });
                fallbackSpan?.end?.();
                
                return strategy.value;
              }
            } catch (strategyError) {
              // Strategy failed, try the next one
              if (logger) {
                logger.warn(
                  `Strategy ${strategy.type} failed for ${String(propertyKey)}`,
                  {
                    method: String(propertyKey),
                    strategyType: strategy.type,
                    strategyIndex: i,
                    error: (strategyError as Error).message
                  }
                );
              } else {
                console.warn(`[ResilientFallback] Strategy ${strategy.type} failed for ${String(propertyKey)}: ${(strategyError as Error).message}`);
              }
              
              // Mark strategy span as failed
              strategySpan?.setStatus?.({ code: 1, message: (strategyError as Error).message });
              strategySpan?.end?.();
              
              continue;
            }
          }
          
          // All strategies failed
          if (logger) {
            logger.error(
              `All fallback strategies failed for ${String(propertyKey)}`,
              {
                method: String(propertyKey),
                error: (error as Error).message,
                errorType: (error as BaseError)?.type,
                journey,
                strategies: strategies.map(s => s.type).join(',')
              }
            );
          }
          
          // Record failed fallback
          fallbackMetrics.recordFallback(false, (error as BaseError)?.type, journey);
          
          // Mark fallback span as failed
          fallbackSpan?.setStatus?.({ code: 1, message: 'All fallback strategies failed' });
          fallbackSpan?.end?.();
          
          // All strategies failed, record failed fallback
          fallbackMetrics.recordFallback(false, (error as BaseError)?.type, journey);
        }
        
        // Re-throw the original error
        throw error;
      }
    };
    
    return descriptor;
  };
}
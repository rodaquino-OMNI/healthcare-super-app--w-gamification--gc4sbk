import { ErrorType } from '../../../shared/src/exceptions/exceptions.types';

/**
 * Interface for fallback strategy implementations.
 * Fallback strategies provide alternative behavior when primary operations fail.
 */
export interface FallbackStrategy<T> {
  /**
   * Execute the fallback strategy to provide an alternative result.
   * @param error - The error that triggered the fallback
   * @param context - Optional context information that might help the fallback strategy
   * @returns The fallback result
   */
  execute(error: Error, context?: Record<string, any>): Promise<T>;

  /**
   * Determines if this fallback strategy can handle the given error.
   * @param error - The error to check
   * @returns True if this strategy can handle the error, false otherwise
   */
  canHandle(error: Error): boolean;
}

/**
 * Options for configuring the withFallback function.
 */
export interface WithFallbackOptions {
  /**
   * Context information to pass to fallback strategies.
   */
  context?: Record<string, any>;

  /**
   * Whether to log the error before executing fallback strategies.
   * @default true
   */
  logError?: boolean;

  /**
   * Custom error filter function to determine if a fallback should be attempted.
   * @param error - The error to check
   * @returns True if fallback should be attempted, false to rethrow the error
   */
  errorFilter?: (error: Error) => boolean;

  /**
   * Optional function to transform the error before it's passed to fallback strategies.
   * @param error - The original error
   * @returns Transformed error
   */
  errorTransformer?: (error: Error) => Error;
}

/**
 * Configuration options for the CacheableFallback class.
 */
export interface CacheableFallbackOptions<T> {
  /**
   * Time-to-live in milliseconds for the cached data.
   * @default 300000 (5 minutes)
   */
  ttl?: number;

  /**
   * Function to determine if a specific error should trigger this fallback.
   * @param error - The error to check
   * @returns True if this fallback should be used, false otherwise
   */
  errorMatcher?: (error: Error) => boolean;

  /**
   * Optional function to transform the cached data before returning it.
   * @param cachedData - The data retrieved from cache
   * @param error - The error that triggered the fallback
   * @returns Transformed data
   */
  dataTransformer?: (cachedData: T, error: Error) => T;

  /**
   * Optional function to get a cache key from the context.
   * If not provided, a default key will be generated.
   * @param context - The context object passed to the fallback
   * @returns Cache key string
   */
  getCacheKey?: (context: Record<string, any>) => string;
}

/**
 * Configuration options for the DefaultValueFallback class.
 */
export interface DefaultValueFallbackOptions {
  /**
   * Function to determine if a specific error should trigger this fallback.
   * @param error - The error to check
   * @returns True if this fallback should be used, false otherwise
   */
  errorMatcher?: (error: Error) => boolean;

  /**
   * Optional function to transform the default value based on the error and context.
   * @param defaultValue - The configured default value
   * @param error - The error that triggered the fallback
   * @param context - The context object passed to the fallback
   * @returns Transformed default value
   */
  valueTransformer?: <T>(defaultValue: T, error: Error, context?: Record<string, any>) => T;
}

/**
 * Configuration options for the FallbackChain class.
 */
export interface FallbackChainOptions {
  /**
   * Whether to stop at the first successful fallback or try all fallbacks.
   * @default true
   */
  stopOnSuccess?: boolean;

  /**
   * Whether to collect and combine results from all fallbacks.
   * Only applicable when stopOnSuccess is false.
   * @default false
   */
  combineResults?: boolean;

  /**
   * Function to combine results from multiple fallbacks.
   * Only used when combineResults is true.
   * @param results - Array of results from fallbacks that succeeded
   * @returns Combined result
   */
  resultCombiner?: <T>(results: T[]) => T;
}

/**
 * Executes a primary operation with fallback strategies if it fails.
 * This function provides graceful degradation by allowing alternative
 * behaviors when the primary operation encounters an error.
 *
 * @param primaryOperation - The main operation to execute
 * @param fallbackStrategies - One or more fallback strategies to try if the primary operation fails
 * @param options - Configuration options for fallback behavior
 * @returns Result from either the primary operation or a fallback strategy
 * @throws Error if the primary operation fails and no fallback strategy can handle the error
 *
 * @example
 * // Basic usage with a default value fallback
 * const result = await withFallback(
 *   () => fetchUserData(userId),
 *   new DefaultValueFallback({ defaultValue: { name: 'Guest', permissions: [] } })
 * );
 *
 * @example
 * // Using multiple fallbacks with options
 * const result = await withFallback(
 *   () => fetchLatestHealthMetrics(userId),
 *   [
 *     new CacheableFallback(cacheService, { ttl: 60000 }),
 *     new DefaultValueFallback({ defaultValue: [] })
 *   ],
 *   { 
 *     context: { userId, journeyId: 'health' },
 *     errorFilter: (err) => err instanceof NetworkError
 *   }
 * );
 */
export async function withFallback<T>(
  primaryOperation: () => Promise<T>,
  fallbackStrategies: FallbackStrategy<T> | FallbackStrategy<T>[],
  options: WithFallbackOptions = {}
): Promise<T> {
  const {
    context = {},
    logError = true,
    errorFilter = () => true,
    errorTransformer = (err) => err
  } = options;

  try {
    // Attempt the primary operation
    return await primaryOperation();
  } catch (error) {
    // Ensure error is an Error object
    const err = error instanceof Error ? error : new Error(String(error));

    // Log the error if configured to do so
    if (logError) {
      console.error('[withFallback] Primary operation failed:', err);
    }

    // Check if we should attempt fallback for this error
    if (!errorFilter(err)) {
      throw err;
    }

    // Transform the error if a transformer is provided
    const transformedError = errorTransformer(err);

    // Convert single fallback to array for consistent handling
    const fallbacks = Array.isArray(fallbackStrategies)
      ? fallbackStrategies
      : [fallbackStrategies];

    // Try each fallback strategy in order
    for (const fallback of fallbacks) {
      if (fallback.canHandle(transformedError)) {
        try {
          return await fallback.execute(transformedError, context);
        } catch (fallbackError) {
          // Log fallback failure but continue to next fallback
          console.error('[withFallback] Fallback strategy failed:', fallbackError);
        }
      }
    }

    // If we get here, all fallbacks failed or none could handle the error
    throw transformedError;
  }
}

/**
 * A fallback strategy that returns cached data when the primary operation fails.
 * This is useful for maintaining functionality during temporary outages or
 * performance degradation by serving slightly stale data instead of failing.
 */
export class CacheableFallback<T> implements FallbackStrategy<T> {
  private readonly ttl: number;
  private readonly errorMatcher: (error: Error) => boolean;
  private readonly dataTransformer?: (cachedData: T, error: Error) => T;
  private readonly getCacheKey: (context: Record<string, any>) => string;

  /**
   * Creates a new CacheableFallback instance.
   *
   * @param cacheService - The cache service to use for retrieving cached data
   * @param options - Configuration options
   */
  constructor(
    private readonly cacheService: {
      get: (key: string) => Promise<T | null>;
      set?: (key: string, value: T, ttl?: number) => Promise<void>;
    },
    options: CacheableFallbackOptions<T> = {}
  ) {
    this.ttl = options.ttl ?? 300000; // Default: 5 minutes
    this.errorMatcher = options.errorMatcher ?? (() => true);
    this.dataTransformer = options.dataTransformer;
    this.getCacheKey = options.getCacheKey ?? this.defaultGetCacheKey;
  }

  /**
   * Determines if this fallback can handle the given error.
   *
   * @param error - The error to check
   * @returns True if this fallback can handle the error, false otherwise
   */
  canHandle(error: Error): boolean {
    return this.errorMatcher(error);
  }

  /**
   * Executes the fallback strategy by retrieving data from cache.
   *
   * @param error - The error that triggered the fallback
   * @param context - Context information that might help determine the cache key
   * @returns Cached data if available, otherwise throws the original error
   * @throws The original error if no cached data is available
   */
  async execute(error: Error, context: Record<string, any> = {}): Promise<T> {
    const cacheKey = this.getCacheKey(context);
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData === null) {
      throw new Error(`No cached data available for key: ${cacheKey}`);
    }

    // Apply data transformation if configured
    return this.dataTransformer ? this.dataTransformer(cachedData, error) : cachedData;
  }

  /**
   * Default function to generate a cache key from context.
   * Override this by providing a getCacheKey function in options.
   *
   * @param context - The context object
   * @returns A cache key string
   */
  private defaultGetCacheKey(context: Record<string, any>): string {
    // Create a key based on available context properties
    const keyParts = [];

    if (context.userId) keyParts.push(`user:${context.userId}`);
    if (context.journeyId) keyParts.push(`journey:${context.journeyId}`);
    if (context.resourceId) keyParts.push(`resource:${context.resourceId}`);
    if (context.operation) keyParts.push(`op:${context.operation}`);

    // If no specific context is available, use a generic key
    if (keyParts.length === 0) {
      return 'fallback:generic';
    }

    return `fallback:${keyParts.join(':')}`;
  }

  /**
   * Updates the cache with new data.
   * This can be called after a successful retry to ensure the cache has fresh data.
   *
   * @param data - The data to cache
   * @param context - Context information to determine the cache key
   * @param customTtl - Optional custom TTL for this specific update
   * @returns Promise that resolves when the cache is updated
   */
  async updateCache(data: T, context: Record<string, any> = {}, customTtl?: number): Promise<void> {
    if (!this.cacheService.set) {
      console.warn('[CacheableFallback] Cache service does not support writing to cache');
      return;
    }

    const cacheKey = this.getCacheKey(context);
    await this.cacheService.set(cacheKey, data, customTtl ?? this.ttl);
  }
}

/**
 * A fallback strategy that returns a default value when the primary operation fails.
 * This is useful for non-critical operations where a reasonable default can be provided.
 */
export class DefaultValueFallback<T> implements FallbackStrategy<T> {
  private readonly errorMatcher: (error: Error) => boolean;
  private readonly valueTransformer?: (defaultValue: T, error: Error, context?: Record<string, any>) => T;

  /**
   * Creates a new DefaultValueFallback instance.
   *
   * @param defaultValue - The default value to return when fallback is triggered
   * @param options - Configuration options
   */
  constructor(
    private readonly defaultValue: T,
    options: DefaultValueFallbackOptions = {}
  ) {
    this.errorMatcher = options.errorMatcher ?? (() => true);
    this.valueTransformer = options.valueTransformer;
  }

  /**
   * Determines if this fallback can handle the given error.
   *
   * @param error - The error to check
   * @returns True if this fallback can handle the error, false otherwise
   */
  canHandle(error: Error): boolean {
    return this.errorMatcher(error);
  }

  /**
   * Executes the fallback strategy by returning the default value.
   *
   * @param error - The error that triggered the fallback
   * @param context - Optional context information
   * @returns The default value, possibly transformed
   */
  async execute(error: Error, context?: Record<string, any>): Promise<T> {
    // Apply value transformation if configured
    return this.valueTransformer
      ? this.valueTransformer(this.defaultValue, error, context)
      : this.defaultValue;
  }
}

/**
 * A fallback strategy that chains multiple fallback strategies together.
 * Strategies are tried in order until one succeeds or all fail.
 */
export class FallbackChain<T> implements FallbackStrategy<T> {
  private readonly stopOnSuccess: boolean;
  private readonly combineResults: boolean;
  private readonly resultCombiner?: (results: T[]) => T;

  /**
   * Creates a new FallbackChain instance.
   *
   * @param fallbackStrategies - Array of fallback strategies to try in order
   * @param options - Configuration options
   */
  constructor(
    private readonly fallbackStrategies: FallbackStrategy<T>[],
    options: FallbackChainOptions = {}
  ) {
    this.stopOnSuccess = options.stopOnSuccess ?? true;
    this.combineResults = options.combineResults ?? false;
    this.resultCombiner = options.resultCombiner;

    // Validate configuration
    if (this.combineResults && !this.resultCombiner) {
      throw new Error('resultCombiner must be provided when combineResults is true');
    }
  }

  /**
   * Determines if this fallback chain can handle the given error.
   * A chain can handle an error if at least one of its strategies can handle it.
   *
   * @param error - The error to check
   * @returns True if at least one strategy in the chain can handle the error
   */
  canHandle(error: Error): boolean {
    return this.fallbackStrategies.some(strategy => strategy.canHandle(error));
  }

  /**
   * Executes the fallback chain by trying each strategy in order.
   *
   * @param error - The error that triggered the fallback
   * @param context - Optional context information
   * @returns Result from a successful fallback strategy or combined results
   * @throws Error if all fallback strategies fail
   */
  async execute(error: Error, context?: Record<string, any>): Promise<T> {
    const errors: Error[] = [];
    const results: T[] = [];

    for (const strategy of this.fallbackStrategies) {
      if (strategy.canHandle(error)) {
        try {
          const result = await strategy.execute(error, context);
          
          // Store the result
          results.push(result);
          
          // If configured to stop on first success, return immediately
          if (this.stopOnSuccess) {
            return result;
          }
        } catch (fallbackError) {
          // Store the error and continue to the next strategy
          errors.push(fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)));
        }
      }
    }

    // If we're combining results and have at least one result, combine them
    if (this.combineResults && results.length > 0 && this.resultCombiner) {
      return this.resultCombiner(results);
    }

    // If we have at least one result, return the last successful one
    if (results.length > 0) {
      return results[results.length - 1];
    }

    // If all strategies failed, throw an error with details
    throw new Error(
      `All fallback strategies failed: ${errors.map(e => e.message).join(', ')}`
    );
  }
}

/**
 * Journey-specific fallback strategies for the Health journey.
 * These strategies are tailored to the specific needs of health-related features.
 */
export namespace HealthJourneyFallbacks {
  /**
   * Creates a fallback strategy for health metrics data.
   * Returns the most recent metrics with a clear indication they might be stale.
   *
   * @param cacheService - The cache service to use
   * @param options - Additional configuration options
   * @returns A configured CacheableFallback instance
   */
  export function createMetricsFallback<T>(
    cacheService: { get: (key: string) => Promise<T | null>; set?: (key: string, value: T, ttl?: number) => Promise<void> },
    options: Partial<CacheableFallbackOptions<T>> = {}
  ): CacheableFallback<T> {
    return new CacheableFallback(cacheService, {
      ttl: 86400000, // 24 hours for health metrics
      errorMatcher: (error) => {
        // Match external errors or network timeouts
        return error.name === 'ExternalSystemError' || error.message.includes('timeout');
      },
      dataTransformer: (data: any, error) => {
        // Add a flag to indicate the data is from cache
        if (Array.isArray(data)) {
          return data.map(item => ({ ...item, fromCache: true })) as unknown as T;
        } else if (typeof data === 'object' && data !== null) {
          return { ...data, fromCache: true } as unknown as T;
        }
        return data;
      },
      getCacheKey: (context) => {
        return `health:metrics:${context.userId}:${context.metricType || 'all'}`;
      },
      ...options
    });
  }

  /**
   * Creates a fallback strategy for health goals data.
   * Returns simplified goal information when the primary source is unavailable.
   *
   * @param defaultGoals - Default goals to use as fallback
   * @returns A configured DefaultValueFallback instance
   */
  export function createGoalsFallback<T>(
    defaultGoals: T
  ): DefaultValueFallback<T> {
    return new DefaultValueFallback(defaultGoals, {
      errorMatcher: (error) => {
        // Match database errors or external service errors
        return error.name === 'DatabaseError' || error.name === 'ExternalSystemError';
      }
    });
  }
}

/**
 * Journey-specific fallback strategies for the Care journey.
 * These strategies are tailored to the specific needs of care-related features.
 */
export namespace CareJourneyFallbacks {
  /**
   * Creates a fallback strategy for appointment data.
   * Returns cached appointments with status indicators when the booking system is unavailable.
   *
   * @param cacheService - The cache service to use
   * @param options - Additional configuration options
   * @returns A configured CacheableFallback instance
   */
  export function createAppointmentsFallback<T>(
    cacheService: { get: (key: string) => Promise<T | null>; set?: (key: string, value: T, ttl?: number) => Promise<void> },
    options: Partial<CacheableFallbackOptions<T>> = {}
  ): CacheableFallback<T> {
    return new CacheableFallback(cacheService, {
      ttl: 3600000, // 1 hour for appointments
      errorMatcher: (error) => {
        // Match booking system errors
        return error.name === 'BookingSystemError' || error.message.includes('appointment');
      },
      dataTransformer: (data: any, error) => {
        // Add a warning flag to appointments
        if (Array.isArray(data)) {
          return data.map(appointment => ({
            ...appointment,
            statusWarning: 'Booking system temporarily unavailable. Please verify appointment details by phone.'
          })) as unknown as T;
        }
        return data;
      },
      getCacheKey: (context) => {
        return `care:appointments:${context.userId}:${context.timeframe || 'upcoming'}`;
      },
      ...options
    });
  }

  /**
   * Creates a fallback strategy for provider information.
   * Returns basic provider information when detailed data is unavailable.
   *
   * @param defaultProviderInfo - Default provider information to use as fallback
   * @returns A configured DefaultValueFallback instance
   */
  export function createProviderInfoFallback<T>(
    defaultProviderInfo: T
  ): DefaultValueFallback<T> {
    return new DefaultValueFallback(defaultProviderInfo, {
      errorMatcher: (error) => {
        // Match provider directory errors
        return error.name === 'ProviderDirectoryError' || error.message.includes('provider');
      }
    });
  }
}

/**
 * Journey-specific fallback strategies for the Plan journey.
 * These strategies are tailored to the specific needs of insurance plan-related features.
 */
export namespace PlanJourneyFallbacks {
  /**
   * Creates a fallback strategy for benefits information.
   * Returns cached benefits data when the insurance system is unavailable.
   *
   * @param cacheService - The cache service to use
   * @param options - Additional configuration options
   * @returns A configured CacheableFallback instance
   */
  export function createBenefitsFallback<T>(
    cacheService: { get: (key: string) => Promise<T | null>; set?: (key: string, value: T, ttl?: number) => Promise<void> },
    options: Partial<CacheableFallbackOptions<T>> = {}
  ): CacheableFallback<T> {
    return new CacheableFallback(cacheService, {
      ttl: 86400000, // 24 hours for benefits info
      errorMatcher: (error) => {
        // Match insurance system errors
        return error.name === 'InsuranceSystemError' || error.message.includes('benefits');
      },
      dataTransformer: (data: any, error) => {
        // Add disclaimer to benefits data
        if (typeof data === 'object' && data !== null) {
          return {
            ...data,
            disclaimer: 'This information may not reflect recent changes. Please contact customer service for verification.'
          } as unknown as T;
        }
        return data;
      },
      getCacheKey: (context) => {
        return `plan:benefits:${context.userId}:${context.planId || 'current'}`;
      },
      ...options
    });
  }

  /**
   * Creates a fallback strategy for claim status information.
   * Returns a simplified claim status when detailed tracking is unavailable.
   *
   * @param defaultClaimStatus - Default claim status to use as fallback
   * @returns A configured DefaultValueFallback instance
   */
  export function createClaimStatusFallback<T>(
    defaultClaimStatus: T
  ): DefaultValueFallback<T> {
    return new DefaultValueFallback(defaultClaimStatus, {
      errorMatcher: (error) => {
        // Match claim processing system errors
        return error.name === 'ClaimSystemError' || error.message.includes('claim');
      }
    });
  }
}
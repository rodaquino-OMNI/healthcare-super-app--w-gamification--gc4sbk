import { ErrorType, AppException } from '../../../shared/src/exceptions/exceptions.types';

/**
 * Options for configuring fallback behavior.
 * Provides a comprehensive set of configuration options for customizing
 * how fallback strategies are applied when operations fail.
 */
export interface FallbackOptions<T> {
  /** Default value to return if operation fails */
  defaultValue?: T;
  
  /** Time-to-live in milliseconds for cached fallback data */
  cacheTtl?: number;
  
  /** Whether to retry the operation before falling back */
  retry?: boolean;
  
  /** Maximum number of retry attempts */
  maxRetries?: number;
  
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  
  /** Error types that should trigger the fallback */
  errorTypes?: ErrorType[];
  
  /** Custom fallback function to execute */
  fallbackFn?: () => Promise<T>;
  
  /** Journey context for journey-specific fallbacks */
  journeyContext?: 'health' | 'care' | 'plan';
}

/**
 * Default fallback options applied when specific options are not provided.
 * These defaults provide a reasonable starting point for fallback behavior
 * that can be overridden as needed for specific use cases.
 */
const DEFAULT_FALLBACK_OPTIONS: Partial<FallbackOptions<any>> = {
  retry: false,
  maxRetries: 3,
  retryDelay: 300,
  errorTypes: [ErrorType.EXTERNAL, ErrorType.TECHNICAL],
  cacheTtl: 5 * 60 * 1000, // 5 minutes
};

/**
 * Executes an operation with fallback strategies if it fails.
 * This is the primary utility for implementing graceful degradation
 * when operations fail, allowing the application to continue functioning
 * with reduced capabilities.
 * 
 * @param operation - The primary operation to execute
 * @param options - Configuration options for fallback behavior
 * @returns The result of the operation or fallback
 * 
 * @example
 * // With default value fallback
 * const result = await withFallback(
 *   () => fetchUserProfile(userId),
 *   { defaultValue: { name: 'Guest User', isGuest: true } }
 * );
 * 
 * @example
 * // With cached fallback for health journey
 * const result = await withFallback(
 *   () => fetchLatestHealthMetrics(userId),
 *   { 
 *     cacheTtl: 30 * 60 * 1000, // 30 minutes
 *     journeyContext: 'health'
 *   }
 * );
 * 
 * @example
 * // With custom fallback function and retry
 * const result = await withFallback(
 *   () => fetchProviderAvailability(providerId),
 *   {
 *     retry: true,
 *     maxRetries: 2,
 *     fallbackFn: async () => {
 *       // Try an alternative API or data source
 *       return await fetchProviderAvailabilityFromSecondarySource(providerId);
 *     },
 *     journeyContext: 'care'
 *   }
 * );
 */
export async function withFallback<T>(
  operation: () => Promise<T>,
  options: FallbackOptions<T> = {}
): Promise<T> {
  // Merge with default options
  const mergedOptions: FallbackOptions<T> = {
    ...DEFAULT_FALLBACK_OPTIONS,
    ...options,
  };
  
  try {
    // Attempt the primary operation
    if (mergedOptions.retry) {
      return await withRetry(operation, mergedOptions.maxRetries!, mergedOptions.retryDelay!);
    } else {
      return await operation();
    }
  } catch (error) {
    // Check if this error type should trigger fallback
    if (shouldTriggerFallback(error, mergedOptions.errorTypes!)) {
      // Execute fallback strategy
      return await executeFallbackStrategy(error, mergedOptions);
    }
    
    // Re-throw error if it shouldn't trigger fallback
    throw error;
  }
}

/**
 * Determines if an error should trigger the fallback strategy based on its type
 * and characteristics. This allows for selective fallback behavior depending
 * on the nature of the error.
 */
function shouldTriggerFallback(error: any, errorTypes: ErrorType[]): boolean {
  // If error has a type property matching our ErrorType enum
  if (error.type && errorTypes.includes(error.type)) {
    return true;
  }
  
  // For standard errors without type, assume technical error
  if (errorTypes.includes(ErrorType.TECHNICAL)) {
    return true;
  }
  
  // For network or external service errors
  if (
    errorTypes.includes(ErrorType.EXTERNAL) &&
    (error.code === 'ECONNREFUSED' || 
     error.code === 'ETIMEDOUT' || 
     error.message?.includes('timeout') ||
     error.message?.includes('network'))
  ) {
    return true;
  }
  
  return false;
}

/**
 * Executes the appropriate fallback strategy based on options.
 * This function implements the core logic for selecting and executing
 * the most appropriate fallback strategy based on the provided options
 * and context.
 */
async function executeFallbackStrategy<T>(error: any, options: FallbackOptions<T>): Promise<T> {
  // If a custom fallback function is provided, use it
  if (options.fallbackFn) {
    return await options.fallbackFn();
  }
  
  // If journey context is provided, use journey-specific fallback
  if (options.journeyContext) {
    return await executeJourneyFallback(options.journeyContext, options);
  }
  
  // If a default value is provided, use it
  if ('defaultValue' in options) {
    return options.defaultValue as T;
  }
  
  // If no fallback strategy is available, re-throw the error
  throw error;
}

/**
 * Executes a journey-specific fallback strategy based on the journey context.
 * Each journey (health, care, plan) has its own specialized fallback behavior
 * optimized for the specific data and operations of that journey.
 */
async function executeJourneyFallback<T>(
  journeyContext: 'health' | 'care' | 'plan',
  options: FallbackOptions<T>
): Promise<T> {
  switch (journeyContext) {
    case 'health':
      return await executeHealthJourneyFallback(options);
    case 'care':
      return await executeCareJourneyFallback(options);
    case 'plan':
      return await executePlanJourneyFallback(options);
    default:
      // If no journey-specific fallback is available, use default value
      if ('defaultValue' in options) {
        return options.defaultValue as T;
      }
      throw new Error(`No fallback strategy available for journey: ${journeyContext}`);
  }
}

/**
 * Health journey specific fallback strategy
 */
async function executeHealthJourneyFallback<T>(options: FallbackOptions<T>): Promise<T> {
  // Health journey specific fallback logic
  // Prioritizes cached data for health metrics and device connections
  
  // Check for cached data in localStorage or IndexedDB for web clients
  // or AsyncStorage for mobile clients if available
  try {
    // This would be implemented with actual storage access in a real implementation
    const cachedData = await getCachedHealthData();
    if (cachedData) {
      return cachedData as unknown as T;
    }
  } catch (cacheError) {
    // Cache retrieval failed, continue to next fallback option
  }
  
  // Return simplified or default health data if provided
  if ('defaultValue' in options) {
    return options.defaultValue as T;
  }
  
  // If no fallback data is available, throw a specific error
  throw new AppException(
    'Unable to retrieve health data and no fallback available',
    ErrorType.TECHNICAL,
    'HEALTH_FALLBACK_001',
    { journeyContext: 'health' }
  );
}

/**
 * Mock function to simulate retrieving cached health data
 * In a real implementation, this would access actual storage
 */
async function getCachedHealthData(): Promise<any | null> {
  // This is a placeholder - in a real implementation, this would
  // access localStorage, AsyncStorage, or another caching mechanism
  return null;
}

/**
 * Care journey specific fallback strategy
 */
async function executeCareJourneyFallback<T>(options: FallbackOptions<T>): Promise<T> {
  // Care journey specific fallback logic
  // Prioritizes cached data for appointments, providers, and medications
  
  // For appointment data, we can show cached appointments even if we can't fetch new ones
  try {
    // This would be implemented with actual storage access in a real implementation
    const cachedData = await getCachedCareData();
    if (cachedData) {
      return cachedData as unknown as T;
    }
  } catch (cacheError) {
    // Cache retrieval failed, continue to next fallback option
  }
  
  // For telemedicine, we might need to show offline mode or reschedule options
  // This would be implemented based on the specific operation that failed
  
  // Return default care journey data if provided
  if ('defaultValue' in options) {
    return options.defaultValue as T;
  }
  
  // If no fallback data is available, throw a specific error
  throw new AppException(
    'Unable to retrieve care data and no fallback available',
    ErrorType.TECHNICAL,
    'CARE_FALLBACK_001',
    { journeyContext: 'care' }
  );
}

/**
 * Mock function to simulate retrieving cached care data
 * In a real implementation, this would access actual storage
 */
async function getCachedCareData(): Promise<any | null> {
  // This is a placeholder - in a real implementation, this would
  // access localStorage, AsyncStorage, or another caching mechanism
  return null;
}

/**
 * Plan journey specific fallback strategy
 */
async function executePlanJourneyFallback<T>(options: FallbackOptions<T>): Promise<T> {
  // Plan journey specific fallback logic
  // Prioritizes cached data for insurance plans, benefits, and claims
  
  // For plan data, we can show cached information even if we can't fetch updates
  try {
    // This would be implemented with actual storage access in a real implementation
    const cachedData = await getCachedPlanData();
    if (cachedData) {
      return cachedData as unknown as T;
    }
  } catch (cacheError) {
    // Cache retrieval failed, continue to next fallback option
  }
  
  // For claims processing, we might need to queue operations for later submission
  // This would be implemented based on the specific operation that failed
  
  // Return default plan journey data if provided
  if ('defaultValue' in options) {
    return options.defaultValue as T;
  }
  
  // If no fallback data is available, throw a specific error
  throw new AppException(
    'Unable to retrieve plan data and no fallback available',
    ErrorType.TECHNICAL,
    'PLAN_FALLBACK_001',
    { journeyContext: 'plan' }
  );
}

/**
 * Mock function to simulate retrieving cached plan data
 * In a real implementation, this would access actual storage
 */
async function getCachedPlanData(): Promise<any | null> {
  // This is a placeholder - in a real implementation, this would
  // access localStorage, AsyncStorage, or another caching mechanism
  return null;
}

/**
 * Executes an operation with retry logic using exponential backoff.
 * This provides resilience against transient failures by automatically
 * retrying failed operations with increasing delays between attempts.
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  delay: number
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // If this is the last attempt, don't delay
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const backoffDelay = delay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError;
}

/**
 * Class for implementing cacheable fallback strategies.
 * Provides a mechanism for storing and retrieving cached data
 * when primary operations fail, with configurable time-to-live.
 */
export class CacheableFallback<T> {
  private cache: Map<string, { value: T; timestamp: number }> = new Map();
  
  /**
   * Creates a new CacheableFallback instance
   * 
   * @param defaultTtl - Default time-to-live for cached items in milliseconds
   */
  constructor(private defaultTtl: number = 5 * 60 * 1000) {}
  
  /**
   * Executes an operation with caching fallback
   * 
   * @param key - Unique key for the operation (used for cache lookup)
   * @param operation - The primary operation to execute
   * @param options - Fallback options
   * @returns The result of the operation or cached value
   * 
   * @example
   * const cacheFallback = new CacheableFallback<UserProfile>();
   * 
   * const userProfile = await cacheFallback.execute(
   *   `user-${userId}`,
   *   () => fetchUserProfile(userId),
   *   { cacheTtl: 10 * 60 * 1000 } // 10 minutes
   * );
   */
  async execute(
    key: string,
    operation: () => Promise<T>,
    options: FallbackOptions<T> = {}
  ): Promise<T> {
    const ttl = options.cacheTtl || this.defaultTtl;
    
    try {
      // Try to execute the primary operation
      const result = await withFallback(operation, options);
      
      // Cache the successful result
      this.cache.set(key, {
        value: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      // Check if we have a valid cached value
      const cachedItem = this.cache.get(key);
      
      if (cachedItem && Date.now() - cachedItem.timestamp < ttl) {
        // Return cached value if it's still valid
        return cachedItem.value;
      }
      
      // No valid cache, re-throw the error
      throw error;
    }
  }
  
  /**
   * Manually sets a cached value
   * 
   * @param key - Cache key
   * @param value - Value to cache
   */
  setCache(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clears a specific cached item
   * 
   * @param key - Cache key to clear
   */
  clearCache(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clears all cached items
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}

/**
 * Creates a chain of fallback strategies to try in sequence.
 * Implements priority-based fallback chains where multiple strategies
 * are attempted in order until one succeeds.
 */
export class FallbackChain<T> {
  private strategies: Array<() => Promise<T>> = [];
  
  /**
   * Adds a fallback strategy to the chain
   * 
   * @param strategy - Fallback strategy function
   * @returns The FallbackChain instance for chaining
   * 
   * @example
   * const result = await new FallbackChain<UserData>()
   *   .add(() => fetchFromPrimaryDatabase())
   *   .add(() => fetchFromSecondaryDatabase())
   *   .add(() => fetchFromCache())
   *   .add(() => getDefaultUserData())
   *   .execute();
   */
  add(strategy: () => Promise<T>): FallbackChain<T> {
    this.strategies.push(strategy);
    return this;
  }
  
  /**
   * Executes the fallback chain, trying each strategy in sequence
   * until one succeeds or all fail
   * 
   * @returns The result of the first successful strategy
   * @throws The last error if all strategies fail
   */
  async execute(): Promise<T> {
    if (this.strategies.length === 0) {
      throw new Error('No fallback strategies defined in chain');
    }
    
    let lastError: any;
    
    for (const strategy of this.strategies) {
      try {
        return await strategy();
      } catch (error) {
        lastError = error;
        // Continue to the next strategy
      }
    }
    
    // If we get here, all strategies failed
    throw lastError || new Error('All fallback strategies failed');
  }
}

/**
 * Creates a fallback function that returns a default value.
 * This is a utility for creating simple fallback strategies
 * that return predefined values when operations fail.
 * 
 * @param defaultValue - The default value to return
 * @returns A function that returns the default value
 * 
 * @example
 * const userProfileFallback = createDefaultValueFallback({
 *   name: 'Guest User',
 *   email: 'guest@example.com',
 *   isGuest: true
 * });
 * 
 * // Use in withFallback
 * const profile = await withFallback(
 *   () => fetchUserProfile(userId),
 *   { fallbackFn: userProfileFallback }
 * );
 * 
 * @example
 * // Use in a fallback chain
 * const result = await new FallbackChain<UserData>()
 *   .add(() => fetchFromPrimaryDatabase())
 *   .add(() => fetchFromSecondaryDatabase())
 *   .add(createDefaultValueFallback(DEFAULT_USER_DATA))
 *   .execute();
 */
export function createDefaultValueFallback<T>(defaultValue: T): () => Promise<T> {
  return async () => defaultValue;
}
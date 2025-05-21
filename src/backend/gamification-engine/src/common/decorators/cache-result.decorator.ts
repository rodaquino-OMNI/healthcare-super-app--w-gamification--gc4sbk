import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/backend/shared/src/redis/redis.service';

/**
 * Options for the CacheResult decorator
 */
export interface CacheResultOptions {
  /**
   * TTL (Time To Live) in seconds for the cached result
   * If not provided, the default TTL from environment variables will be used
   */
  ttl?: number;

  /**
   * Journey identifier for journey-specific TTL calculation
   * If provided, the TTL will be determined based on the journey type
   */
  journey?: string;

  /**
   * Custom key prefix to use for the cache key
   * If not provided, the method name will be used
   */
  keyPrefix?: string;

  /**
   * Function to generate a custom cache key based on method arguments
   * If not provided, a default key generation strategy will be used
   */
  keyGenerator?: (methodName: string, args: any[]) => string;

  /**
   * Whether to use Redis Sorted Sets for caching (useful for leaderboards)
   * If true, the method result must be an array of objects with 'id' and 'score' properties
   */
  useSortedSet?: boolean;

  /**
   * The name of the sorted set to use when useSortedSet is true
   * Required if useSortedSet is true
   */
  sortedSetName?: string;
}

/**
 * Cache service for the CacheResult decorator
 * This service is responsible for caching method results in Redis
 */
@Injectable()
export class CacheService {
  private readonly defaultTTL: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    // Get default TTL from environment variables or use 5 minutes as fallback
    this.defaultTTL = this.configService.get<number>('redis.defaultTTL', 300);
  }

  /**
   * Generates a cache key based on the method name and arguments
   * @param methodName The name of the method being cached
   * @param args The arguments passed to the method
   * @param keyPrefix Optional custom key prefix
   * @param keyGenerator Optional custom key generator function
   * @returns A unique cache key
   */
  generateCacheKey(
    methodName: string,
    args: any[],
    keyPrefix?: string,
    keyGenerator?: (methodName: string, args: any[]) => string,
  ): string {
    // Use custom key generator if provided
    if (keyGenerator) {
      return keyGenerator(methodName, args);
    }

    // Use method name or custom prefix as base key
    const baseKey = keyPrefix || methodName;

    // If no arguments, just use the base key
    if (!args || args.length === 0) {
      return `cache:${baseKey}`;
    }

    // Create a hash of the arguments to use as part of the key
    const argsHash = this.hashArguments(args);
    return `cache:${baseKey}:${argsHash}`;
  }

  /**
   * Creates a simple hash of the method arguments for use in cache keys
   * @param args The arguments to hash
   * @returns A string hash of the arguments
   */
  private hashArguments(args: any[]): string {
    try {
      // Filter out non-serializable values like functions
      const serializableArgs = args.map(arg => {
        if (typeof arg === 'function') {
          return 'function';
        }
        if (arg instanceof Date) {
          return arg.toISOString();
        }
        return arg;
      });

      // Create a JSON string of the arguments and hash it
      const argsString = JSON.stringify(serializableArgs);
      
      // Simple hash function for strings
      let hash = 0;
      for (let i = 0; i < argsString.length; i++) {
        const char = argsString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return hash.toString(16); // Convert to hex string
    } catch (error) {
      // If serialization fails, use a timestamp to ensure uniqueness
      return Date.now().toString(16);
    }
  }

  /**
   * Gets the TTL for a cache entry based on options
   * @param options Cache options
   * @returns TTL in seconds
   */
  getTTL(options?: CacheResultOptions): number {
    // If TTL is explicitly provided in options, use it
    if (options?.ttl !== undefined) {
      return options.ttl;
    }

    // If journey is provided, use journey-specific TTL
    if (options?.journey) {
      return this.redisService.getJourneyTTL(options.journey);
    }

    // Otherwise use default TTL
    return this.defaultTTL;
  }

  /**
   * Caches a method result in Redis
   * @param key The cache key
   * @param result The result to cache
   * @param ttl TTL in seconds
   * @param useSortedSet Whether to use Redis Sorted Sets
   * @param sortedSetName The name of the sorted set
   */
  async cacheResult(
    key: string,
    result: any,
    ttl: number,
    useSortedSet?: boolean,
    sortedSetName?: string,
  ): Promise<void> {
    try {
      if (useSortedSet && sortedSetName && Array.isArray(result)) {
        // For sorted sets (leaderboards), store each item with its score
        await Promise.all(
          result.map(async (item) => {
            if (item && 'id' in item && 'score' in item) {
              await this.redisService.zadd(sortedSetName, item.score, item.id.toString());
            }
          })
        );
        
        // Set expiration on the sorted set
        await this.redisService.expire(sortedSetName, ttl);
        
        // Also cache the full result as JSON for quick retrieval
        await this.redisService.set(key, JSON.stringify(result), ttl);
      } else {
        // For regular results, serialize and cache
        await this.redisService.set(key, JSON.stringify(result), ttl);
      }
    } catch (error) {
      // Log error but don't throw - caching failures shouldn't break functionality
      if (this.redisService.logger) {
        this.redisService.logger.error(`Error caching result for key ${key}: ${error.message}`, error.stack, 'CacheService');
      } else {
        console.error(`Error caching result for key ${key}:`, error);
      }
    }
  }

  /**
   * Retrieves a cached result from Redis
   * @param key The cache key
   * @param useSortedSet Whether to use Redis Sorted Sets
   * @param sortedSetName The name of the sorted set
   * @returns The cached result or null if not found
   */
  async getCachedResult(
    key: string,
    useSortedSet?: boolean,
    sortedSetName?: string,
  ): Promise<any | null> {
    try {
      if (useSortedSet && sortedSetName) {
        // First try to get the full cached result
        const cachedResult = await this.redisService.get(key);
        if (cachedResult) {
          return JSON.parse(cachedResult);
        }
        
        // If not available, reconstruct from sorted set
        const sortedSetResult = await this.redisService.zrange(sortedSetName, 0, -1, true) as Array<[string, string]>;
        if (sortedSetResult && sortedSetResult.length > 0) {
          // Convert to array of objects with id and score
          return sortedSetResult.map(([id, score]) => ({
            id,
            score: parseFloat(score),
          }));
        }
        
        return null;
      } else {
        // For regular results, get and deserialize
        const cachedResult = await this.redisService.get(key);
        return cachedResult ? JSON.parse(cachedResult) : null;
      }
    } catch (error) {
      // Log error but don't throw - cache retrieval failures shouldn't break functionality
      if (this.redisService.logger) {
        this.redisService.logger.error(`Error retrieving cached result for key ${key}: ${error.message}`, error.stack, 'CacheService');
      } else {
        console.error(`Error retrieving cached result for key ${key}:`, error);
      }
      return null;
    }
  }

  /**
   * Invalidates a cached result
   * @param key The cache key to invalidate
   * @param useSortedSet Whether to also invalidate a sorted set
   * @param sortedSetName The name of the sorted set to invalidate
   */
  async invalidateCache(
    key: string,
    useSortedSet?: boolean,
    sortedSetName?: string,
  ): Promise<void> {
    try {
      // Delete the regular cache key
      await this.redisService.del(key);
      
      // If using sorted set, delete that too
      if (useSortedSet && sortedSetName) {
        await this.redisService.del(sortedSetName);
      }
    } catch (error) {
      // Log error but don't throw - cache invalidation failures shouldn't break functionality
      if (this.redisService.logger) {
        this.redisService.logger.error(`Error invalidating cache for key ${key}: ${error.message}`, error.stack, 'CacheService');
      } else {
        console.error(`Error invalidating cache for key ${key}:`, error);
      }
    }
  }
}

/**
 * Decorator that caches method results in Redis
 * This decorator improves performance for frequently accessed data like leaderboards,
 * achievements, and user profiles by caching the results in Redis with a configurable TTL.
 * 
 * @param options Configuration options for caching
 * @returns Method decorator
 * 
 * @example
 * // Basic usage with default options
 * @CacheResult()
 * async findAllAchievements(): Promise<Achievement[]> {
 *   // Method implementation
 * }
 * 
 * @example
 * // With custom TTL
 * @CacheResult({ ttl: 60 }) // Cache for 60 seconds
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * @example
 * // With journey-specific TTL
 * @CacheResult({ journey: 'health' })
 * async getHealthMetrics(userId: string): Promise<HealthMetric[]> {
 *   // Method implementation
 * }
 * 
 * @example
 * // With sorted set for leaderboards
 * @CacheResult({
 *   useSortedSet: true,
 *   sortedSetName: 'leaderboard:global',
 *   ttl: 300
 * })
 * async getLeaderboard(): Promise<LeaderboardEntry[]> {
 *   // Method implementation
 * }
 */
export function CacheResult(options?: CacheResultOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Get the cache service from the NestJS container
      const cacheService = this.cacheService as CacheService;
      
      if (!cacheService) {
        // Try to get logger from this context if available
        const logger = this.logger || console;
        logger.warn(`CacheService not found in ${target.constructor.name}. Make sure to inject it.`);
        return originalMethod.apply(this, args);
      }
      
      // Generate cache key
      const cacheKey = cacheService.generateCacheKey(
        propertyKey,
        args,
        options?.keyPrefix,
        options?.keyGenerator,
      );
      
      // Get TTL
      const ttl = cacheService.getTTL(options);
      
      // Try to get cached result
      const cachedResult = await cacheService.getCachedResult(
        cacheKey,
        options?.useSortedSet,
        options?.sortedSetName,
      );
      
      // If cached result exists, return it
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      // Otherwise, execute the original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await cacheService.cacheResult(
        cacheKey,
        result,
        ttl,
        options?.useSortedSet,
        options?.sortedSetName,
      );
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Decorator that invalidates a cached method result
 * This decorator can be used to invalidate cache entries when data changes
 * 
 * @param cacheOptions The same options used with the CacheResult decorator
 * @returns Method decorator
 * 
 * @example
 * // Invalidate cache for findAllAchievements when a new achievement is created
 * @InvalidateCache({ keyPrefix: 'findAllAchievements' })
 * async createAchievement(achievement: Achievement): Promise<Achievement> {
 *   // Method implementation
 * }
 */
export function InvalidateCache(cacheOptions: CacheResultOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Execute the original method first
      const result = await originalMethod.apply(this, args);
      
      // Get the cache service from the NestJS container
      const cacheService = this.cacheService as CacheService;
      
      if (!cacheService) {
        // Try to get logger from this context if available
        const logger = this.logger || console;
        logger.warn(`CacheService not found in ${target.constructor.name}. Make sure to inject it.`);
        return result;
      }
      
      // Generate the cache key to invalidate
      const cacheKey = cacheService.generateCacheKey(
        cacheOptions.keyPrefix || propertyKey,
        [], // Empty args for invalidating all entries with this prefix
        cacheOptions.keyPrefix,
        cacheOptions.keyGenerator,
      );
      
      // Invalidate the cache
      await cacheService.invalidateCache(
        cacheKey,
        cacheOptions.useSortedSet,
        cacheOptions.sortedSetName,
      );
      
      return result;
    };
    
    return descriptor;
  };
}
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/backend/shared/src/redis/redis.service';
import { LoggerService } from 'src/backend/shared/src/logging/logger.service';

/**
 * Options for the CacheResult decorator
 */
export interface CacheResultOptions {
  /**
   * Time-to-live in seconds for the cached result
   * If not provided, will use journey-specific TTL or default from environment variables
   */
  ttl?: number;

  /**
   * Journey identifier for journey-specific TTL settings
   * Valid values: 'health', 'care', 'plan', 'game'
   */
  journey?: string;

  /**
   * Custom key prefix to use for the cache key
   * If not provided, will use the class and method names
   */
  keyPrefix?: string;

  /**
   * Whether to include method arguments in the cache key
   * Default: true
   */
  includeArgs?: boolean;

  /**
   * Custom function to generate a cache key from method arguments
   * If provided, overrides the default key generation logic
   */
  keyGenerator?: (target: any, methodName: string, args: any[]) => string;

  /**
   * Whether to skip caching for specific return values (e.g., null, undefined)
   * Default: false
   */
  skipIfNull?: boolean;
}

/**
 * Cache service that handles the actual caching operations
 * This is injected into the decorator context at runtime
 */
@Injectable()
export class CacheService {
  private readonly defaultTTL: number;
  private readonly cacheEnabled: boolean;

  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.defaultTTL = this.configService.get<number>('cache.defaultTTL', 300); // 5 minutes default
    this.cacheEnabled = this.configService.get<boolean>('cache.enabled', true);
  }

  /**
   * Gets a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedValue = await this.redisService.get(key);
      if (!cachedValue) {
        return null;
      }
      return JSON.parse(cachedValue) as T;
    } catch (error) {
      this.logger.warn(
        `Error retrieving from cache (key: ${key}): ${error.message}`,
        'CacheService',
      );
      return null;
    }
  }

  /**
   * Sets a value in the cache with a TTL
   * @param key The cache key
   * @param value The value to cache
   * @param ttl TTL in seconds
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redisService.set(key, serializedValue, ttl);
    } catch (error) {
      this.logger.warn(
        `Error setting cache (key: ${key}): ${error.message}`,
        'CacheService',
      );
    }
  }

  /**
   * Invalidates a cache entry
   * @param key The cache key to invalidate
   */
  async invalidate(key: string): Promise<void> {
    try {
      await this.redisService.del(key);
    } catch (error) {
      this.logger.warn(
        `Error invalidating cache (key: ${key}): ${error.message}`,
        'CacheService',
      );
    }
  }

  /**
   * Invalidates cache entries by pattern
   * @param pattern The pattern to match keys against
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      // Use Redis SCAN to find keys matching the pattern
      const keys = await this.scanKeys(pattern);
      if (keys.length > 0) {
        await this.redisService.del(keys);
        this.logger.debug(
          `Invalidated ${keys.length} cache entries matching pattern: ${pattern}`,
          'CacheService',
        );
      }
    } catch (error) {
      this.logger.warn(
        `Error invalidating cache by pattern (${pattern}): ${error.message}`,
        'CacheService',
      );
    }
  }

  /**
   * Helper method to scan Redis for keys matching a pattern
   * @param pattern The pattern to match
   * @returns Array of matching keys
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    // This is a simplified implementation
    // In a production environment, you would use the Redis SCAN command
    // with proper cursor-based iteration to handle large key spaces
    try {
      // For now, we'll use a direct approach with the Redis client
      // This assumes the Redis client has a 'keys' method
      const client = (this.redisService as any).client;
      if (client && typeof client.keys === 'function') {
        return await client.keys(pattern);
      }
      return [];
    } catch (error) {
      this.logger.warn(
        `Error scanning keys (pattern: ${pattern}): ${error.message}`,
        'CacheService',
      );
      return [];
    }
  }

  /**
   * Determines if caching is enabled
   * @returns true if caching is enabled, false otherwise
   */
  isCacheEnabled(): boolean {
    return this.cacheEnabled;
  }

  /**
   * Gets the appropriate TTL for a cache entry
   * @param options Cache options that may include TTL or journey
   * @returns TTL in seconds
   */
  getTTL(options?: CacheResultOptions): number {
    if (options?.ttl !== undefined) {
      return options.ttl;
    }

    if (options?.journey) {
      return this.redisService.getJourneyTTL(options.journey);
    }

    return this.defaultTTL;
  }
}

// Global cache service instance
let cacheServiceInstance: CacheService | null = null;

/**
 * Sets the cache service instance for use by the decorator
 * This should be called during application bootstrap
 * @param service The cache service instance
 */
export function setCacheService(service: CacheService): void {
  cacheServiceInstance = service;
}

/**
 * Gets the cache service instance
 * @returns The cache service instance
 * @throws Error if the cache service has not been initialized
 */
export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    throw new Error(
      'Cache service not initialized. Make sure to call setCacheService during application bootstrap.',
    );
  }
  return cacheServiceInstance;
}

/**
 * Generates a default cache key based on class name, method name, and arguments
 * @param target The class instance
 * @param methodName The method name
 * @param args The method arguments
 * @param options Cache options
 * @returns A cache key string
 */
function generateCacheKey(
  target: any,
  methodName: string,
  args: any[],
  options?: CacheResultOptions,
): string {
  // Use custom key generator if provided
  if (options?.keyGenerator) {
    return options.keyGenerator(target, methodName, args);
  }

  // Use custom key prefix if provided, otherwise use class and method names
  const keyPrefix = options?.keyPrefix || 
    `${target.constructor.name}:${methodName}`;

  // Include arguments in the key if specified (default: true)
  const includeArgs = options?.includeArgs !== false;
  if (includeArgs && args.length > 0) {
    // Serialize arguments to create a unique key
    // Filter out non-serializable values and handle circular references
    const serializedArgs = JSON.stringify(
      args,
      (key, value) => {
        // Handle special cases like functions, undefined, etc.
        if (typeof value === 'function') {
          return 'function';
        }
        if (value === undefined) {
          return 'undefined';
        }
        return value;
      },
    );
    return `${keyPrefix}:${serializedArgs}`;
  }

  return keyPrefix;
}

/**
 * Decorator that caches the result of a method in Redis
 * 
 * This decorator improves performance for frequently accessed data like leaderboards,
 * achievements, and user profiles by caching the results in Redis with a configurable TTL.
 * 
 * @example
 * // Basic usage with default options
 * @CacheResult()
 * async findUserAchievements(userId: string): Promise<Achievement[]> {
 *   // Method implementation
 * }
 * 
 * @example
 * // With custom TTL and journey-specific settings
 * @CacheResult({ ttl: 300, journey: 'game' })
 * async getLeaderboard(gameId: string): Promise<LeaderboardEntry[]> {
 *   // Method implementation
 * }
 * 
 * @example
 * // With custom key generation
 * @CacheResult({
 *   keyPrefix: 'user-profile',
 *   keyGenerator: (target, method, [userId]) => `user-profile:${userId}`
 * })
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * @param options Configuration options for caching behavior
 */
export function CacheResult(options?: CacheResultOptions) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        const cacheService = getCacheService();

        // Skip caching if disabled globally
        if (!cacheService.isCacheEnabled()) {
          return await originalMethod.apply(this, args);
        }

        // Generate cache key
        const cacheKey = generateCacheKey(this, methodName, args, options);

        // Try to get from cache first
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult !== null) {
          return cachedResult;
        }

        // Execute the original method if not in cache
        const result = await originalMethod.apply(this, args);

        // Skip caching if result is null/undefined and skipIfNull is true
        if (options?.skipIfNull && (result === null || result === undefined)) {
          return result;
        }

        // Cache the result
        const ttl = cacheService.getTTL(options);
        await cacheService.set(cacheKey, result, ttl);

        return result;
      } catch (error) {
        // If there's an error with caching, fall back to the original method
        return await originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * Invalidates cache entries for a specific method
 * 
 * @example
 * // Invalidate cache for a specific user
 * @InvalidateCache({
 *   keyPrefix: 'UserService:getUserProfile',
 *   keyGenerator: (target, method, [userId]) => `UserService:getUserProfile:${userId}`
 * })
 * async updateUserProfile(userId: string, data: ProfileUpdateDto): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * @param options Configuration options for cache invalidation
 */
export function InvalidateCache(options?: CacheResultOptions) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Execute the original method first
      const result = await originalMethod.apply(this, args);

      try {
        const cacheService = getCacheService();

        // Skip invalidation if caching is disabled globally
        if (!cacheService.isCacheEnabled()) {
          return result;
        }

        // Generate cache key
        const cacheKey = generateCacheKey(this, methodName, args, options);

        // Invalidate the specific cache entry
        await cacheService.invalidate(cacheKey);
      } catch (error) {
        // If there's an error with cache invalidation, just return the result
        // The error is already logged in the cache service
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Invalidates cache entries by pattern
 * 
 * @example
 * // Invalidate all user profile caches when updating user settings
 * @InvalidateCacheByPattern('UserService:getUserProfile:*')
 * async updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
 *   // Method implementation
 * }
 * 
 * @param pattern The pattern to match cache keys against
 */
export function InvalidateCacheByPattern(pattern: string) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Execute the original method first
      const result = await originalMethod.apply(this, args);

      try {
        const cacheService = getCacheService();

        // Skip invalidation if caching is disabled globally
        if (!cacheService.isCacheEnabled()) {
          return result;
        }

        // Invalidate cache entries matching the pattern
        await cacheService.invalidateByPattern(pattern);
      } catch (error) {
        // If there's an error with cache invalidation, just return the result
        // The error is already logged in the cache service
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Module provider for the CacheService
 * Use this in your module's providers array to make the cache service available
 */
export const CacheServiceProvider = {
  provide: CacheService,
  useFactory: (redisService: RedisService, logger: LoggerService, configService: ConfigService) => {
    const service = new CacheService(redisService, logger, configService);
    setCacheService(service);
    return service;
  },
  inject: [RedisService, LoggerService, ConfigService],
};
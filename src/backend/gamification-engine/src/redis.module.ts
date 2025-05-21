import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { createClient } from 'redis';
import { RedisClientType, RedisClientOptions } from '@redis/client';

/**
 * Redis client token for dependency injection
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Redis options token for dependency injection
 */
export const REDIS_OPTIONS = 'REDIS_OPTIONS';

/**
 * Redis connection options interface
 */
export interface RedisModuleOptions {
  /**
   * Redis connection URL
   * @example 'redis://localhost:6379'
   */
  url?: string;
  
  /**
   * Redis host
   * @default 'localhost'
   */
  host?: string;
  
  /**
   * Redis port
   * @default 6379
   */
  port?: number;
  
  /**
   * Redis password
   */
  password?: string;
  
  /**
   * Redis database index
   * @default 0
   */
  db?: number;
  
  /**
   * Key prefix for all Redis keys
   */
  keyPrefix?: string;
  
  /**
   * Connection timeout in milliseconds
   * @default 10000
   */
  connectTimeout?: number;
  
  /**
   * Command timeout in milliseconds
   * @default 5000
   */
  commandTimeout?: number;
  
  /**
   * Maximum number of connections in the pool
   * @default 10
   */
  maxConnections?: number;
  
  /**
   * Enable automatic reconnection
   * @default true
   */
  enableAutoPipelining?: boolean;
  
  /**
   * Enable TLS/SSL
   * @default false
   */
  tls?: boolean;
  
  /**
   * Journey-specific TTL values in seconds
   */
  journeyTtl?: {
    health?: number;
    care?: number;
    plan?: number;
    default?: number;
  };
}

/**
 * Redis service for managing Redis client connections and operations
 */
export class RedisService {
  constructor(private readonly redisClient: RedisClientType) {}

  /**
   * Get the Redis client instance
   */
  getClient(): RedisClientType {
    return this.redisClient;
  }

  /**
   * Get a value from Redis
   * @param key - Redis key
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      console.error(`Error getting key ${key} from Redis:`, error);
      return null;
    }
  }

  /**
   * Set a value in Redis
   * @param key - Redis key
   * @param value - Value to store
   * @param ttl - Time to live in seconds (optional)
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.redisClient.set(key, value, { EX: ttl });
      } else {
        await this.redisClient.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Error setting key ${key} in Redis:`, error);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   * @param key - Redis key
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Error deleting key ${key} from Redis:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param key - Redis key
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking if key ${key} exists in Redis:`, error);
      return false;
    }
  }

  /**
   * Add a member to a sorted set with a score
   * @param key - Redis key
   * @param score - Score value
   * @param member - Member value
   */
  async zadd(key: string, score: number, member: string): Promise<boolean> {
    try {
      await this.redisClient.zAdd(key, { score, value: member });
      return true;
    } catch (error) {
      console.error(`Error adding to sorted set ${key} in Redis:`, error);
      return false;
    }
  }

  /**
   * Get members from a sorted set by score range
   * @param key - Redis key
   * @param min - Minimum score
   * @param max - Maximum score
   * @param options - Additional options
   */
  async zrange(key: string, min: number, max: number, options?: { LIMIT?: { offset: number, count: number }, REV?: boolean }): Promise<string[]> {
    try {
      return await this.redisClient.zRange(key, min, max, options);
    } catch (error) {
      console.error(`Error getting range from sorted set ${key} in Redis:`, error);
      return [];
    }
  }

  /**
   * Get members with scores from a sorted set by score range
   * @param key - Redis key
   * @param min - Minimum score
   * @param max - Maximum score
   * @param options - Additional options
   */
  async zrangeWithScores(key: string, min: number, max: number, options?: { LIMIT?: { offset: number, count: number }, REV?: boolean }): Promise<Array<{ value: string, score: number }>> {
    try {
      return await this.redisClient.zRangeWithScores(key, min, max, options);
    } catch (error) {
      console.error(`Error getting range with scores from sorted set ${key} in Redis:`, error);
      return [];
    }
  }

  /**
   * Get the rank of a member in a sorted set
   * @param key - Redis key
   * @param member - Member value
   */
  async zrank(key: string, member: string): Promise<number | null> {
    try {
      return await this.redisClient.zRank(key, member);
    } catch (error) {
      console.error(`Error getting rank from sorted set ${key} in Redis:`, error);
      return null;
    }
  }

  /**
   * Get the score of a member in a sorted set
   * @param key - Redis key
   * @param member - Member value
   */
  async zscore(key: string, member: string): Promise<number | null> {
    try {
      const score = await this.redisClient.zScore(key, member);
      return score;
    } catch (error) {
      console.error(`Error getting score from sorted set ${key} in Redis:`, error);
      return null;
    }
  }

  /**
   * Get the number of members in a sorted set
   * @param key - Redis key
   */
  async zcard(key: string): Promise<number> {
    try {
      return await this.redisClient.zCard(key);
    } catch (error) {
      console.error(`Error getting card from sorted set ${key} in Redis:`, error);
      return 0;
    }
  }

  /**
   * Get journey-specific TTL value
   * @param journey - Journey type ('health', 'care', 'plan')
   * @param options - Redis module options
   */
  getJourneyTTL(journey: string, options: RedisModuleOptions): number {
    const defaultTtl = options.journeyTtl?.default || 3600; // 1 hour default
    
    switch (journey) {
      case 'health':
        return options.journeyTtl?.health || defaultTtl;
      case 'care':
        return options.journeyTtl?.care || defaultTtl;
      case 'plan':
        return options.journeyTtl?.plan || defaultTtl;
      default:
        return defaultTtl;
    }
  }

  /**
   * Check Redis connection health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.redisClient.ping();
      return pong === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

/**
 * Redis health service for monitoring Redis connection
 */
export class RedisHealthService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Check Redis connection health
   */
  async check(): Promise<{ status: string; details?: string }> {
    try {
      const isHealthy = await this.redisService.healthCheck();
      if (isHealthy) {
        return { status: 'up' };
      } else {
        return { status: 'down', details: 'Redis connection failed' };
      }
    } catch (error) {
      return { status: 'down', details: error.message };
    }
  }
}

/**
 * Redis module for NestJS applications
 */
@Global()
@Module({})
export class RedisModule {
  /**
   * Register Redis module with options
   * @param options - Redis module options
   */
  static register(options: RedisModuleOptions): DynamicModule {
    const redisOptionsProvider: Provider = {
      provide: REDIS_OPTIONS,
      useValue: options,
    };

    const redisClientProvider: Provider = {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        const clientOptions: RedisClientOptions = {
          url: options.url,
          socket: {
            host: options.host || 'localhost',
            port: options.port || 6379,
            connectTimeout: options.connectTimeout || 10000,
            tls: options.tls ? {} : undefined,
          },
          password: options.password,
          database: options.db || 0,
          commandsQueueMaxLength: options.maxConnections || 10,
          disableOfflineQueue: false,
          readonly: false,
          legacyMode: false,
          pingInterval: 5000, // Ping every 5 seconds to keep connection alive
          autoResendUnfulfilledCommands: true,
          enableAutoPipelining: options.enableAutoPipelining ?? true,
        };

        if (options.keyPrefix) {
          clientOptions.keyPrefix = options.keyPrefix;
        }

        const client = createClient(clientOptions);

        // Set up event handlers for connection management
        client.on('error', (err) => {
          console.error('Redis client error:', err);
        });

        client.on('reconnecting', () => {
          console.log('Redis client reconnecting...');
        });

        client.on('ready', () => {
          console.log('Redis client ready');
        });

        client.on('connect', () => {
          console.log('Redis client connected');
        });

        client.on('end', () => {
          console.log('Redis client connection closed');
        });

        // Connect to Redis
        await client.connect();

        return client;
      },
    };

    const redisServiceProvider: Provider = {
      provide: RedisService,
      useFactory: (redisClient: RedisClientType) => {
        return new RedisService(redisClient);
      },
      inject: [REDIS_CLIENT],
    };

    const redisHealthServiceProvider: Provider = {
      provide: RedisHealthService,
      useFactory: (redisService: RedisService) => {
        return new RedisHealthService(redisService);
      },
      inject: [RedisService],
    };

    return {
      module: RedisModule,
      providers: [
        redisOptionsProvider,
        redisClientProvider,
        redisServiceProvider,
        redisHealthServiceProvider,
      ],
      exports: [REDIS_CLIENT, RedisService, RedisHealthService],
    };
  }

  /**
   * Register Redis module asynchronously with factory
   * @param options - Async module options
   */
  static registerAsync(options: {
    useFactory: (...args: any[]) => Promise<RedisModuleOptions> | RedisModuleOptions;
    inject?: any[];
  }): DynamicModule {
    const redisOptionsProvider: Provider = {
      provide: REDIS_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const redisClientProvider: Provider = {
      provide: REDIS_CLIENT,
      useFactory: async (redisOptions: RedisModuleOptions) => {
        const clientOptions: RedisClientOptions = {
          url: redisOptions.url,
          socket: {
            host: redisOptions.host || 'localhost',
            port: redisOptions.port || 6379,
            connectTimeout: redisOptions.connectTimeout || 10000,
            tls: redisOptions.tls ? {} : undefined,
          },
          password: redisOptions.password,
          database: redisOptions.db || 0,
          commandsQueueMaxLength: redisOptions.maxConnections || 10,
          disableOfflineQueue: false,
          readonly: false,
          legacyMode: false,
          pingInterval: 5000, // Ping every 5 seconds to keep connection alive
          autoResendUnfulfilledCommands: true,
          enableAutoPipelining: redisOptions.enableAutoPipelining ?? true,
        };

        if (redisOptions.keyPrefix) {
          clientOptions.keyPrefix = redisOptions.keyPrefix;
        }

        const client = createClient(clientOptions);

        // Set up event handlers for connection management
        client.on('error', (err) => {
          console.error('Redis client error:', err);
        });

        client.on('reconnecting', () => {
          console.log('Redis client reconnecting...');
        });

        client.on('ready', () => {
          console.log('Redis client ready');
        });

        client.on('connect', () => {
          console.log('Redis client connected');
        });

        client.on('end', () => {
          console.log('Redis client connection closed');
        });

        // Connect to Redis
        await client.connect();

        return client;
      },
      inject: [REDIS_OPTIONS],
    };

    const redisServiceProvider: Provider = {
      provide: RedisService,
      useFactory: (redisClient: RedisClientType) => {
        return new RedisService(redisClient);
      },
      inject: [REDIS_CLIENT],
    };

    const redisHealthServiceProvider: Provider = {
      provide: RedisHealthService,
      useFactory: (redisService: RedisService) => {
        return new RedisHealthService(redisService);
      },
      inject: [RedisService],
    };

    return {
      module: RedisModule,
      providers: [
        redisOptionsProvider,
        redisClientProvider,
        redisServiceProvider,
        redisHealthServiceProvider,
      ],
      exports: [REDIS_CLIENT, RedisService, RedisHealthService],
    };
  }
}
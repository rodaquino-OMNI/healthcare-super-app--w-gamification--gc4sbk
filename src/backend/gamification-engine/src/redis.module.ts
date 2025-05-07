import { Module, DynamicModule, Provider, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { TerminusModule, HealthCheckService, HealthIndicatorFunction } from '@nestjs/terminus';
import { LoggerService } from './common/utils/logging.util';

/**
 * Redis client factory token for dependency injection
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Redis health check factory token for dependency injection
 */
export const REDIS_HEALTH = 'REDIS_HEALTH';

/**
 * Journey-specific TTL values in seconds
 */
export enum JourneyTTL {
  HEALTH = 300, // 5 minutes
  CARE = 600,   // 10 minutes
  PLAN = 900,   // 15 minutes
  DEFAULT = 1800 // 30 minutes
}

/**
 * Redis connection options interface
 */
export interface RedisModuleOptions {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  db?: number;
  connectionPoolSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableHealthCheck?: boolean;
}

/**
 * Redis service that provides enhanced Redis client functionality
 * with journey-specific caching strategies, Sorted Sets for leaderboards,
 * and comprehensive error handling.
 */
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new LoggerService(RedisService.name);
  private client: RedisClientType;
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts: number;
  private readonly retryDelay: number;

  constructor(
    private readonly client: RedisClientType,
    private readonly options: RedisModuleOptions,
  ) {
    this.maxConnectionAttempts = options.retryAttempts || 5;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Connect to Redis when the module initializes
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing Redis connection...');
      await this.connect();
      this.logger.log('Redis connection established successfully');
    } catch (error) {
      this.logger.error('Failed to establish Redis connection during initialization', error);
      // Don't throw here to allow the application to start even if Redis is temporarily unavailable
      // The connection will be retried on the first Redis operation
    }
  }

  /**
   * Disconnect from Redis when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.isConnected) {
        this.logger.log('Closing Redis connection...');
        await this.client.quit();
        this.isConnected = false;
        this.logger.log('Redis connection closed successfully');
      }
    } catch (error) {
      this.logger.error('Error closing Redis connection', error);
    }
  }

  /**
   * Connect to Redis with retry logic
   */
  private async connect(): Promise<void> {
    this.connectionAttempts = 0;
    
    while (this.connectionAttempts < this.maxConnectionAttempts) {
      try {
        this.connectionAttempts++;
        await this.client.connect();
        this.isConnected = true;
        return;
      } catch (error) {
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          this.logger.error(`Failed to connect to Redis after ${this.maxConnectionAttempts} attempts`, error);
          throw error;
        }
        
        this.logger.warn(`Redis connection attempt ${this.connectionAttempts} failed, retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  /**
   * Ensure Redis connection is established before performing operations
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  /**
   * Get a value from Redis
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  async get(key: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error retrieving key ${key} from Redis`, error);
      throw error;
    }
  }

  /**
   * Set a value in Redis with optional expiration
   * @param key The key to set
   * @param value The value to store
   * @param ttl Time-to-live in seconds (optional)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
      if (ttl) {
        await this.client.set(key, value, { EX: ttl });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   * @param key The key to delete
   * @returns Number of keys removed
   */
  async del(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from Redis`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param key The key to check
   * @returns True if the key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Get TTL for a key in Redis
   * @param key The key to check
   * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Get journey-specific TTL value
   * @param journey The journey identifier
   * @returns TTL in seconds
   */
  getJourneyTTL(journey: string): number {
    switch (journey.toLowerCase()) {
      case 'health':
        return JourneyTTL.HEALTH;
      case 'care':
        return JourneyTTL.CARE;
      case 'plan':
        return JourneyTTL.PLAN;
      default:
        return JourneyTTL.DEFAULT;
    }
  }

  /**
   * Add a member to a sorted set with a score
   * @param key The sorted set key
   * @param score The score for the member
   * @param member The member to add
   * @returns 1 if added as a new member, 0 if updated
   */
  async zAdd(key: string, score: number, member: string): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.client.zAdd(key, { score, value: member });
    } catch (error) {
      this.logger.error(`Error adding member to sorted set ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Get members from a sorted set by score range (highest to lowest)
   * @param key The sorted set key
   * @param min Minimum score (inclusive)
   * @param max Maximum score (inclusive)
   * @param limit Maximum number of members to return
   * @returns Array of members
   */
  async zRevRangeByScore(
    key: string,
    min: number,
    max: number,
    limit?: number,
  ): Promise<string[]> {
    try {
      await this.ensureConnection();
      const options: any = { REV: true };
      
      if (limit) {
        options.LIMIT = { offset: 0, count: limit };
      }
      
      return await this.client.zRangeByScore(key, min, max, options);
    } catch (error) {
      this.logger.error(`Error retrieving members from sorted set ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Get members with scores from a sorted set by rank (highest to lowest)
   * @param key The sorted set key
   * @param start Start rank (inclusive, 0-based)
   * @param stop End rank (inclusive, 0-based)
   * @returns Array of [member, score] tuples
   */
  async zRevRangeWithScores(
    key: string,
    start: number,
    stop: number,
  ): Promise<[string, number][]> {
    try {
      await this.ensureConnection();
      const result = await this.client.zRangeWithScores(key, start, stop, { REV: true });
      return result.map(item => [item.value, item.score]);
    } catch (error) {
      this.logger.error(`Error retrieving members with scores from sorted set ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Get the rank of a member in a sorted set (highest to lowest)
   * @param key The sorted set key
   * @param member The member to get rank for
   * @returns Rank (0-based) or null if member doesn't exist
   */
  async zRevRank(key: string, member: string): Promise<number | null> {
    try {
      await this.ensureConnection();
      return await this.client.zRank(key, member, { REV: true });
    } catch (error) {
      this.logger.error(`Error getting rank for member in sorted set ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Get the score of a member in a sorted set
   * @param key The sorted set key
   * @param member The member to get score for
   * @returns Score or null if member doesn't exist
   */
  async zScore(key: string, member: string): Promise<number | null> {
    try {
      await this.ensureConnection();
      return await this.client.zScore(key, member);
    } catch (error) {
      this.logger.error(`Error getting score for member in sorted set ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Get the number of members in a sorted set
   * @param key The sorted set key
   * @returns Number of members
   */
  async zCard(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.client.zCard(key);
    } catch (error) {
      this.logger.error(`Error getting cardinality of sorted set ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Remove members from a sorted set
   * @param key The sorted set key
   * @param members The members to remove
   * @returns Number of members removed
   */
  async zRem(key: string, ...members: string[]): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.client.zRem(key, members);
    } catch (error) {
      this.logger.error(`Error removing members from sorted set ${key} in Redis`, error);
      throw error;
    }
  }

  /**
   * Perform a health check on the Redis connection
   * @returns True if Redis is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return false;
    }
  }
}

/**
 * Redis health indicator for NestJS Terminus health checks
 */
export const createRedisHealthIndicator = (
  redisService: RedisService,
): HealthIndicatorFunction => {
  return async () => {
    const isHealthy = await redisService.healthCheck();
    
    const result = {
      redis: {
        status: isHealthy ? 'up' : 'down',
      },
    };
    
    if (!isHealthy) {
      throw new Error('Redis health check failed');
    }
    
    return result;
  };
};

/**
 * Redis module that provides Redis client and health check functionality
 */
@Module({
  imports: [ConfigModule, TerminusModule],
})
export class RedisModule {
  /**
   * Register the Redis module with options
   * @param options Redis connection options
   * @returns Dynamic module
   */
  static register(options: RedisModuleOptions): DynamicModule {
    const redisClientProvider: Provider = {
      provide: REDIS_CLIENT,
      useFactory: async (): Promise<RedisClientType> => {
        const clientOptions: RedisClientOptions = {
          url: options.url,
          socket: {
            host: options.host,
            port: options.port,
            reconnectStrategy: (retries: number) => {
              // Exponential backoff with max delay of 10 seconds
              const delay = Math.min(Math.pow(2, retries) * 100, 10000);
              return delay;
            },
          },
          username: options.username,
          password: options.password,
          database: options.db,
        };

        return createClient(clientOptions);
      },
    };

    const redisServiceProvider: Provider = {
      provide: RedisService,
      useFactory: (client: RedisClientType) => {
        return new RedisService(client, options);
      },
      inject: [REDIS_CLIENT],
    };

    const providers: Provider[] = [redisClientProvider, redisServiceProvider];

    // Add health check provider if enabled
    if (options.enableHealthCheck) {
      const redisHealthProvider: Provider = {
        provide: REDIS_HEALTH,
        useFactory: (redisService: RedisService, healthCheckService: HealthCheckService) => {
          const indicator = createRedisHealthIndicator(redisService);
          healthCheckService.registerIndicator('redis', indicator);
          return indicator;
        },
        inject: [RedisService, HealthCheckService],
      };
      
      providers.push(redisHealthProvider);
    }

    return {
      module: RedisModule,
      providers,
      exports: [RedisService, REDIS_CLIENT],
      global: true,
    };
  }

  /**
   * Register the Redis module with options from ConfigService
   * @returns Dynamic module
   */
  static registerAsync(): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: REDIS_CLIENT,
          useFactory: async (configService: ConfigService): Promise<RedisClientType> => {
            const clientOptions: RedisClientOptions = {
              url: configService.get<string>('redis.url'),
              socket: {
                host: configService.get<string>('redis.host', 'localhost'),
                port: configService.get<number>('redis.port', 6379),
                reconnectStrategy: (retries: number) => {
                  const maxRetries = configService.get<number>('redis.retryAttempts', 5);
                  if (retries >= maxRetries) {
                    return new Error('Redis connection retry limit exceeded');
                  }
                  // Exponential backoff with max delay of 10 seconds
                  const delay = Math.min(Math.pow(2, retries) * 100, 10000);
                  return delay;
                },
              },
              username: configService.get<string>('redis.username'),
              password: configService.get<string>('redis.password'),
              database: configService.get<number>('redis.db', 0),
            };

            return createClient(clientOptions);
          },
          inject: [ConfigService],
        },
        {
          provide: RedisService,
          useFactory: (client: RedisClientType, configService: ConfigService) => {
            const options: RedisModuleOptions = {
              retryAttempts: configService.get<number>('redis.retryAttempts', 5),
              retryDelay: configService.get<number>('redis.retryDelay', 1000),
              enableHealthCheck: configService.get<boolean>('redis.enableHealthCheck', true),
            };
            return new RedisService(client, options);
          },
          inject: [REDIS_CLIENT, ConfigService],
        },
        {
          provide: REDIS_HEALTH,
          useFactory: (redisService: RedisService, healthCheckService: HealthCheckService, configService: ConfigService) => {
            if (configService.get<boolean>('redis.enableHealthCheck', true)) {
              const indicator = createRedisHealthIndicator(redisService);
              healthCheckService.registerIndicator('redis', indicator);
              return indicator;
            }
            return null;
          },
          inject: [RedisService, HealthCheckService, ConfigService],
        },
      ],
      exports: [RedisService, REDIS_CLIENT],
      global: true,
    };
  }
}
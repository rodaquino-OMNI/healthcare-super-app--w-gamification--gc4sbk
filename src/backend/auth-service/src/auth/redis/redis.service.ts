import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TechnicalError } from '@austa/errors/categories';
import Redis from 'ioredis';

/**
 * Service that provides Redis client functionality for the auth service.
 * Handles connection management, basic Redis operations, and error handling.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Initializes the Redis connection when the module is created
   */
  async onModuleInit(): Promise<void> {
    try {
      this.client = new Redis({
        host: this.configService.get<string>('redis.host', 'localhost'),
        port: this.configService.get<number>('redis.port', 6379),
        password: this.configService.get<string>('redis.password', ''),
        db: this.configService.get<number>('redis.db', 0),
        keyPrefix: this.configService.get<string>('redis.keyPrefix', 'austa:auth:'),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      // Set up event handlers
      this.client.on('error', (error) => {
        this.logger.error(
          `Redis connection error: ${error.message}`,
          {
            context: 'RedisService',
            error,
          }
        );
      });

      this.client.on('connect', () => {
        this.logger.info(
          'Redis connection established',
          { context: 'RedisService' }
        );
      });

      this.logger.debug(
        'Redis service initialized',
        { context: 'RedisService' }
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis connection: ${error.message}`,
        {
          context: 'RedisService',
          error,
        }
      );
      throw new TechnicalError('Failed to initialize Redis connection', { cause: error });
    }
  }

  /**
   * Closes the Redis connection when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.debug(
        'Redis connection closed',
        { context: 'RedisService' }
      );
    }
  }

  /**
   * Gets a value from Redis by key
   * @param key The Redis key
   * @returns The value or null if not found
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(
        `Redis get operation failed for key ${key}: ${error.message}`,
        {
          context: 'RedisService',
          key,
          error,
        }
      );
      throw new TechnicalError('Redis operation failed', { cause: error });
    }
  }

  /**
   * Sets a value in Redis
   * @param key The Redis key
   * @param value The value to set
   * @param expireSeconds Optional expiration time in seconds
   */
  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    try {
      if (expireSeconds) {
        await this.client.set(key, value, 'EX', expireSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(
        `Redis set operation failed for key ${key}: ${error.message}`,
        {
          context: 'RedisService',
          key,
          error,
        }
      );
      throw new TechnicalError('Redis operation failed', { cause: error });
    }
  }

  /**
   * Deletes a key from Redis
   * @param key The Redis key to delete
   * @returns Number of keys removed (0 or 1)
   */
  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(
        `Redis del operation failed for key ${key}: ${error.message}`,
        {
          context: 'RedisService',
          key,
          error,
        }
      );
      throw new TechnicalError('Redis operation failed', { cause: error });
    }
  }

  /**
   * Increments a numeric value in Redis
   * @param key The Redis key
   * @returns The new value after increment
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(
        `Redis incr operation failed for key ${key}: ${error.message}`,
        {
          context: 'RedisService',
          key,
          error,
        }
      );
      throw new TechnicalError('Redis operation failed', { cause: error });
    }
  }

  /**
   * Sets the expiration time for a key
   * @param key The Redis key
   * @param seconds Expiration time in seconds
   * @returns 1 if the timeout was set, 0 if key does not exist
   */
  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(
        `Redis expire operation failed for key ${key}: ${error.message}`,
        {
          context: 'RedisService',
          key,
          seconds,
          error,
        }
      );
      throw new TechnicalError('Redis operation failed', { cause: error });
    }
  }

  /**
   * Checks if a key exists in Redis
   * @param key The Redis key
   * @returns True if the key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Redis exists operation failed for key ${key}: ${error.message}`,
        {
          context: 'RedisService',
          key,
          error,
        }
      );
      throw new TechnicalError('Redis operation failed', { cause: error });
    }
  }

  /**
   * Gets the Redis client instance for advanced operations
   * @returns The Redis client instance
   */
  getClient(): Redis {
    return this.client;
  }
}
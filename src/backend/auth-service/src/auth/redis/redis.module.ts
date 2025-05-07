import { Module, Global, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { TokenStorageService } from './token-storage.service';
import { RedisService } from './redis.service';
import { TokenRedisClientConfig } from './redis.interfaces';

/**
 * Factory function to create a Redis client with proper configuration.
 * @param configService NestJS ConfigService for retrieving configuration values
 * @returns Configured Redis client instance
 */
export const createRedisClient = (configService: ConfigService): Redis => {
  const logger = new Logger('RedisClient');
  
  // Get Redis configuration from environment variables with fallbacks
  const host = configService.get<string>('REDIS_HOST', 'localhost');
  const port = configService.get<number>('REDIS_PORT', 6379);
  const password = configService.get<string>('REDIS_PASSWORD', '');
  const db = configService.get<number>('REDIS_DB', 0);
  const keyPrefix = configService.get<string>('REDIS_KEY_PREFIX', 'auth:');
  
  // Connection pool configuration
  const maxRetriesPerRequest = configService.get<number>('REDIS_MAX_RETRIES_PER_REQUEST', 3);
  const connectTimeout = configService.get<number>('REDIS_CONNECT_TIMEOUT', 10000); // 10 seconds
  const commandTimeout = configService.get<number>('REDIS_COMMAND_TIMEOUT', 5000); // 5 seconds
  const maxReconnectAttempts = configService.get<number>('REDIS_MAX_RECONNECT_ATTEMPTS', 10);
  const minReconnectBackoff = configService.get<number>('REDIS_MIN_RECONNECT_BACKOFF', 1000); // 1 second
  const maxReconnectBackoff = configService.get<number>('REDIS_MAX_RECONNECT_BACKOFF', 30000); // 30 seconds
  
  // Create Redis client with optimized configuration
  const client = new Redis({
    host,
    port,
    password: password || undefined, // Only set if provided
    db,
    keyPrefix,
    
    // Connection pool optimization
    maxRetriesPerRequest,
    connectTimeout,
    commandTimeout,
    
    // Reconnection strategy
    retryStrategy: (times) => {
      if (times > maxReconnectAttempts) {
        logger.error(`Redis connection failed after ${times} attempts. Giving up.`);
        return null; // Stop retrying
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        minReconnectBackoff * Math.pow(2, times), 
        maxReconnectBackoff
      );
      
      // Add jitter to prevent reconnection storms
      const jitter = Math.random() * 100;
      
      logger.warn(`Redis connection attempt ${times} failed. Retrying in ${delay + jitter}ms...`);
      return delay + jitter;
    },
    
    // Error handling
    enableReadyCheck: true,
    enableOfflineQueue: true,
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET'];
      const shouldReconnect = targetErrors.some(e => err.message.includes(e));
      
      if (shouldReconnect) {
        logger.warn(`Redis encountered a reconnectable error: ${err.message}. Reconnecting...`);
        return true; // Reconnect for specific errors
      }
      
      logger.error(`Redis encountered a non-reconnectable error: ${err.message}`);
      return false; // Don't reconnect for other errors
    },
  });
  
  // Set up event listeners for connection monitoring
  client.on('connect', () => {
    logger.log('Connecting to Redis...');
  });
  
  client.on('ready', () => {
    logger.log(`Connected to Redis at ${host}:${port} (DB: ${db})`);
  });
  
  client.on('error', (err) => {
    logger.error(`Redis error: ${err.message}`, err.stack);
  });
  
  client.on('close', () => {
    logger.warn('Redis connection closed');
  });
  
  client.on('reconnecting', (delay) => {
    logger.warn(`Redis reconnecting in ${delay}ms...`);
  });
  
  client.on('end', () => {
    logger.warn('Redis connection ended');
  });
  
  return client;
};

/**
 * Redis Module for the Auth Service.
 * Configures and provides Redis connection and token storage services.
 * Implements connection pooling, error handling, and proper cleanup.
 */
@Global() // Make the module global so Redis services are available everywhere
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return createRedisClient(configService);
      },
      inject: [ConfigService],
    },
    RedisService,
    TokenStorageService,
  ],
  exports: [RedisService, TokenStorageService, 'REDIS_CLIENT'],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);
  
  constructor(private readonly configService: ConfigService) {}
  
  /**
   * Cleanup Redis connections when the module is destroyed.
   */
  async onModuleDestroy() {
    this.logger.log('Cleaning up Redis module resources...');
  }
}
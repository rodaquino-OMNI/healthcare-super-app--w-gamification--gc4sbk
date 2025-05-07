import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';

// Use standardized TypeScript path aliases for consistent imports
import { LoggerModule } from '@app/shared/logging/logger.module';
import { LoggerService } from '@app/shared/logging/logger.service';

// Import Redis services
import { TokenStorageService } from './token-storage.service';
import { RedisClient } from './redis.interfaces';

/**
 * Module for Redis-related services and providers.
 */
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService, logger: LoggerService) => {
        logger.setContext('RedisModule');
        
        const host = configService.get('redis.host') || 'localhost';
        const port = configService.get('redis.port') || 6379;
        const password = configService.get('redis.password');
        const db = configService.get('redis.db') || 0;
        
        logger.debug(`Connecting to Redis at ${host}:${port} (DB: ${db})`);
        
        const client = new Redis({
          host,
          port,
          password,
          db,
          // Connection pooling configuration
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            logger.debug(`Redis connection retry attempt ${times} with delay ${delay}ms`);
            return delay;
          },
          // Error handling
          reconnectOnError: (err) => {
            logger.error(`Redis connection error: ${err.message}`, err.stack);
            // Only reconnect on specific errors
            const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNREFUSED'];
            return targetErrors.some(e => err.message.includes(e));
          },
        });
        
        // Handle connection events
        client.on('connect', () => {
          logger.info('Redis client connected');
        });
        
        client.on('error', (err) => {
          logger.error(`Redis client error: ${err.message}`, err.stack);
        });
        
        client.on('close', () => {
          logger.warn('Redis client connection closed');
        });
        
        return client as unknown as RedisClient;
      },
      inject: [ConfigService, LoggerService],
    },
    TokenStorageService,
  ],
  exports: [TokenStorageService],
})
export class RedisModule {
  /**
   * Creates a dynamic module for Redis with custom configuration.
   * @param options - Redis configuration options
   * @returns Dynamic module configuration
   */
  static forRoot(options?: { url?: string }): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: 'REDIS_OPTIONS',
          useValue: options,
        },
      ],
    };
  }
}
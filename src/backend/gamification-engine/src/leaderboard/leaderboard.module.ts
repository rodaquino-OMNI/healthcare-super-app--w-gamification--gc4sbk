import { Module } from '@nestjs/common'; // 10.3.0
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@austa/database/redis';

// Import services and controllers with standardized path aliases
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { ProfilesModule } from '@app/gamification-engine/profiles/profiles.module';

// Import shared modules from @austa packages
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';
import { ErrorsModule } from '@austa/errors';

/**
 * Module for handling leaderboard functionality in the gamification engine.
 * Provides services for calculating and retrieving leaderboard data based on
 * user achievements and XP across different journeys.
 *
 * Features:
 * - Redis Sorted Sets integration for efficient leaderboard storage and retrieval
 * - Journey-specific leaderboards (Health, Care, Plan)
 * - Global cross-journey leaderboard
 * - Real-time score updates with atomic operations
 * - Fallback mechanisms for service resilience
 * - Circuit breaker pattern for Redis operations
 * - Configurable caching with journey-specific TTLs
 * - Batch processing for performance optimization
 *
 * @module LeaderboardModule
 * @requires NestJS 10.3.0
 * @requires RedisModule from @austa/database/redis
 * @requires ProfilesModule for user data access
 * @requires LoggerModule for structured logging
 * @requires TracingModule for distributed tracing
 * @requires ErrorsModule for standardized error handling
 */
@Module({
  imports: [
    // Import Redis module for Sorted Sets integration with leaderboard caching
    RedisModule.forFeature({
      connectionName: 'leaderboard',
      onModuleInit: true,
      healthCheck: true,
    }),
    
    // Import Profiles module for user data and XP calculations
    ProfilesModule,
    
    // Import ConfigModule for leaderboard configuration settings
    ConfigModule.forFeature(() => ({
      gamification: {
        leaderboard: {
          maxEntries: 100,
          ttl: 3600, // 1 hour default cache TTL
          batchSize: 50,
          health: { ttl: 1800 }, // 30 minutes for health journey
          care: { ttl: 1800 },   // 30 minutes for care journey
          plan: { ttl: 3600 },   // 1 hour for plan journey
          global: { ttl: 7200 },  // 2 hours for global leaderboard
        },
      },
    })),
    
    // Import LoggerModule for structured logging with context
    LoggerModule.forFeature({
      context: 'LeaderboardModule',
      persistLogs: true,
    }),
    
    // Import TracingModule for distributed tracing of leaderboard operations
    TracingModule,
    
    // Import ErrorsModule for standardized error handling
    ErrorsModule.forFeature({
      context: 'leaderboard',
      retryableOperations: ['redis', 'database'],
    }),
  ],
  controllers: [LeaderboardController],
  providers: [
    LeaderboardService,
    // Provide factory for circuit breaker configuration
    {
      provide: 'LEADERBOARD_CIRCUIT_BREAKER_CONFIG',
      useValue: {
        name: 'leaderboard-redis',
        failureThreshold: 3,
        resetTimeout: 30000, // 30 seconds
        maxRetries: 3,
        retryDelay: 1000, // 1 second
      },
    },
  ],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
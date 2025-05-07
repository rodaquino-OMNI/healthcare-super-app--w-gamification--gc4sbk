import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import shared utilities and services from @austa packages
import { ConnectionManager } from '@austa/database/connection';
import { TransactionManager } from '@austa/database/transactions';
import { RetryPolicyService } from '@austa/errors/retry';
import { CircuitBreakerService } from '@austa/errors/circuit-breaker';
import { EventSchemaValidator } from '@austa/events/validation';
import { DeadLetterQueueService } from '@austa/events/dlq';

/**
 * Common module that provides cross-cutting concerns for the Gamification Engine.
 * 
 * This module centralizes shared services and utilities that are used across
 * multiple feature modules, ensuring consistent initialization and configuration.
 * 
 * Key responsibilities:
 * - Database connection and transaction management
 * - Error handling and retry policies
 * - Event schema validation and dead letter queue handling
 * - Feature flag management
 */
@Module({
  imports: [ConfigModule],
  providers: [
    // Database services
    ConnectionManager,
    TransactionManager,
    
    // Error handling services
    RetryPolicyService,
    CircuitBreakerService,
    
    // Event processing services
    EventSchemaValidator,
    DeadLetterQueueService,
    
    // Feature flag provider
    {
      provide: 'FEATURE_FLAGS',
      useFactory: (configService: ConfigService) => ({
        enableLeaderboards: configService.get('gamificationEngine.features.enableLeaderboards', true),
        enableQuests: configService.get('gamificationEngine.features.enableQuests', true),
        enableRewards: configService.get('gamificationEngine.features.enableRewards', true),
        enableAchievementNotifications: configService.get(
          'gamificationEngine.features.enableAchievementNotifications', 
          true
        ),
        enableJourneySpecificRules: configService.get(
          'gamificationEngine.features.enableJourneySpecificRules', 
          true
        ),
        enableAntiCheatProtection: configService.get(
          'gamificationEngine.features.enableAntiCheatProtection', 
          true
        ),
        enableEventBatching: configService.get('gamificationEngine.features.enableEventBatching', false),
        enableCaching: configService.get('gamificationEngine.features.enableCaching', true),
      }),
      inject: [ConfigService],
    },
  ],
  exports: [
    // Export all providers for use in other modules
    ConnectionManager,
    TransactionManager,
    RetryPolicyService,
    CircuitBreakerService,
    EventSchemaValidator,
    DeadLetterQueueService,
    'FEATURE_FLAGS',
  ],
})
export class CommonModule {}
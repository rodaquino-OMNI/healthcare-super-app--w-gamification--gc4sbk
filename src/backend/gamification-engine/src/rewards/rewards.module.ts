import { Module } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { QuestsModule } from '../quests/quests.module';
import { DatabaseModule } from '../common/database/database.module';
import { KafkaModule } from '../common/kafka/kafka.module';
import { LoggerModule } from '@backend/packages/logging';
import { TracingModule } from '@backend/packages/tracing';
import { ConsumersModule } from './consumers/consumers.module';
import { ErrorsModule } from '@backend/packages/errors';

/**
 * Configures the RewardsModule, making the RewardsService and related components
 * available for dependency injection.
 * 
 * This module is responsible for managing rewards, which are granted to users
 * based on their achievements and actions across all journeys. It integrates with
 * the ProfilesService for user data and uses Prisma for database connectivity.
 * 
 * Key features:
 * - Migrated from TypeORM to Prisma for improved database connectivity and transaction management
 * - Integrated with standardized event schema for cross-journey reward distribution
 * - Configured Kafka consumers to handle reward-related events from all journeys
 * - Implemented proper error handling with retry mechanisms for failed operations
 */
@Module({
  imports: [
    // Core database module with PrismaService for improved connectivity
    DatabaseModule,
    
    // Event processing with standardized schemas
    KafkaModule,
    ConsumersModule,
    
    // Cross-cutting concerns
    LoggerModule,
    TracingModule,
    ErrorsModule,
    
    // Feature modules
    ProfilesModule,
    AchievementsModule,
    QuestsModule,
  ],
  providers: [
    RewardsService,
    // Additional providers for reward-related functionality
  ],
  controllers: [RewardsController],
  exports: [RewardsService],
})
export class RewardsModule {}
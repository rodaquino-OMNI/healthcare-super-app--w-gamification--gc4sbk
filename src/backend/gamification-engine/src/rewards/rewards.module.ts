import { Module } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { DatabaseModule } from '../common/database/database.module';
import { LoggerModule } from '@app/logging';
import { KafkaModule } from '../common/kafka/kafka.module';
import { HealthJourneyConsumer } from './consumers/health-journey.consumer';
import { CareJourneyConsumer } from './consumers/care-journey.consumer';
import { PlanJourneyConsumer } from './consumers/plan-journey.consumer';
import { ConsumersModule } from './consumers/consumers.module';

/**
 * Configures the RewardsModule, making the RewardsService and related components
 * available for dependency injection. This module is responsible for managing
 * gamification rewards, which are granted to users based on their achievements
 * and actions across all journeys (Health, Care, Plan).
 *
 * The module integrates with Prisma for database operations, Kafka for event
 * processing, and includes journey-specific consumers for reward distribution.
 */
@Module({
  imports: [
    // Database access with Prisma for improved connection pooling and transaction management
    DatabaseModule,
    
    // Required for accessing user profiles when granting rewards
    ProfilesModule,
    
    // Structured logging with correlation IDs for better observability
    LoggerModule,
    
    // Event streaming for cross-journey reward distribution
    KafkaModule,
    
    // Register all journey-specific consumers
    ConsumersModule,
  ],
  controllers: [RewardsController],
  providers: [
    RewardsService,
    // Journey-specific consumers for processing reward events
    HealthJourneyConsumer,
    CareJourneyConsumer,
    PlanJourneyConsumer,
  ],
  exports: [RewardsService],
})
export class RewardsModule {}
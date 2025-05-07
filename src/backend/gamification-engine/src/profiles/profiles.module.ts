import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';
import { PrismaModule } from '@app/shared/database/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
// Import standardized interfaces from @austa/interfaces package
import { GameProfile, JourneyType } from '@austa/interfaces/gamification';

/**
 * Module for managing user game profiles.
 * 
 * This module provides services for creating, retrieving, and updating
 * user game profiles across all journeys (Health, Care, Plan).
 * It integrates with:
 * - Kafka for event streaming and cross-service communication
 * - Redis for caching profile data with journey-specific TTLs
 * - OpenTelemetry for distributed tracing and observability
 * - @austa/interfaces for standardized data models
 *
 * The module supports cross-journey achievement tracking by providing
 * a consistent profile service that can be used by other modules like
 * achievements, rules, and quests.
 *
 * @example
 * // In another module
 * @Module({
 *   imports: [ProfilesModule],
 *   providers: [SomeService],
 * })
 * export class SomeModule {}
 *
 * // In a service
 * @Injectable()
 * export class SomeService {
 *   constructor(private readonly profilesService: ProfilesService) {}
 *
 *   async doSomething(userId: string): Promise<void> {
 *     const profile = await this.profilesService.findById(userId);
 *     // Use profile data
 *   }
 * }
 */
@Module({
  imports: [
    // Infrastructure modules
    KafkaModule,
    LoggerModule,
    RedisModule,
    TracingModule,
    PrismaModule,
    // Cache configuration with journey-specific TTLs
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('gamificationEngine.profiles.cacheTtl', 60000), // Default 1 minute
        max: configService.get('gamificationEngine.profiles.cacheMax', 100), // Default 100 items
      }),
    }),
  ],
  controllers: [ProfilesController],
  providers: [
    ProfilesService,
    // Provide journey-specific profile optimizations
    {
      provide: 'JOURNEY_PROFILE_SETTINGS',
      useFactory: (configService: ConfigService) => ({
        health: {
          cacheTtl: configService.get('gamificationEngine.profiles.health.cacheTtl', 30000), // 30 seconds
          includeAchievements: true,
          includeQuests: true,
          includeRewards: false,
        },
        care: {
          cacheTtl: configService.get('gamificationEngine.profiles.care.cacheTtl', 60000), // 1 minute
          includeAchievements: true,
          includeQuests: true,
          includeRewards: true,
        },
        plan: {
          cacheTtl: configService.get('gamificationEngine.profiles.plan.cacheTtl', 120000), // 2 minutes
          includeAchievements: true,
          includeQuests: false,
          includeRewards: true,
        },
      }),
      inject: [ConfigService],
    },
    // Provider for cross-journey achievement tracking
    {
      provide: 'CROSS_JOURNEY_ACHIEVEMENT_TRACKER',
      useFactory: (configService: ConfigService, kafkaService: KafkaService) => ({
        enabled: configService.get('gamificationEngine.crossJourneyAchievements.enabled', true),
        publishEvents: configService.get('gamificationEngine.crossJourneyAchievements.publishEvents', true),
        topic: configService.get('gamificationEngine.crossJourneyAchievements.topic', 'cross-journey-achievements'),
        // Function to track achievements across journeys
        trackAchievement: async (userId: string, achievementId: string, journeyType: JourneyType) => {
          if (!configService.get('gamificationEngine.crossJourneyAchievements.enabled', true)) {
            return;
          }
          
          // Publish event to Kafka if enabled
          if (configService.get('gamificationEngine.crossJourneyAchievements.publishEvents', true)) {
            await kafkaService.emit({
              topic: configService.get('gamificationEngine.crossJourneyAchievements.topic', 'cross-journey-achievements'),
              messages: [{
                key: userId,
                value: JSON.stringify({
                  userId,
                  achievementId,
                  journeyType,
                  timestamp: new Date().toISOString(),
                }),
              }],
            });
          }
        },
      }),
      inject: [ConfigService, KafkaService],
    },
  ],
  exports: [ProfilesService],
})
export class ProfilesModule {}
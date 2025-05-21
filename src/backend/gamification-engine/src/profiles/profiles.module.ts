import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';
import { PrismaModule } from '@app/shared/database/prisma.module';

/**
 * Module for managing user game profiles in the gamification engine.
 * Provides services for creating, retrieving, and updating user profiles
 * with integration for cross-journey achievement tracking.
 */
@Module({
  imports: [
    // Import shared infrastructure modules
    KafkaModule.register({
      clientId: 'gamification-profiles-service',
      groupId: 'profiles-consumer-group',
    }),
    LoggerModule,
    RedisModule.register({
      keyPrefix: 'gamification:profiles:',
      ttl: 3600, // 1 hour cache by default
    }),
    TracingModule.forRoot({
      serviceName: 'gamification-profiles',
    }),
    PrismaModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService], // Export for use by other modules like achievements and rules
})
export class ProfilesModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { Rule } from './entities/rule.entity';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { ExceptionsModule } from '@app/shared/exceptions/exceptions.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { QuestsModule } from '../quests/quests.module';

/**
 * Configures the RulesModule, making the RulesService available for dependency injection.
 * This module is responsible for managing gamification rules, which determine how points
 * and achievements are awarded based on user actions across all journeys.
 *
 * The module integrates with:
 * - ProfilesModule: For accessing and updating user profiles when rules are triggered
 * - AchievementsModule: For unlocking achievements based on rule conditions
 * - QuestsModule: For progressing quests when relevant rules are triggered
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Rule]), 
    KafkaModule, 
    LoggerModule, 
    ExceptionsModule,
    RedisModule,
    ConfigModule,
    ProfilesModule,
    AchievementsModule,
    QuestsModule
  ],
  providers: [RulesService],
  controllers: [RulesController],
  exports: [RulesService],
})
export class RulesModule {}
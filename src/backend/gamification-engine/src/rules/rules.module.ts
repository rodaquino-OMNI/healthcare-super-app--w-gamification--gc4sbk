import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { Rule } from './entities/rule.entity';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { ExceptionsModule } from '@app/shared/exceptions/exceptions.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { QuestsModule } from '../quests/quests.module';
import { RewardsModule } from '../rewards/rewards.module';

/**
 * Configures the RulesModule, making the RulesService available for dependency injection.
 * This module is responsible for managing gamification rules, which determine how points
 * and achievements are awarded based on user actions across all journeys.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Rule]), 
    KafkaModule, 
    LoggerModule, 
    ExceptionsModule,
    ProfilesModule,
    AchievementsModule,
    QuestsModule,
    RewardsModule
  ],
  providers: [RulesService],
  controllers: [RulesController],
  exports: [RulesService],
})
export class RulesModule {}
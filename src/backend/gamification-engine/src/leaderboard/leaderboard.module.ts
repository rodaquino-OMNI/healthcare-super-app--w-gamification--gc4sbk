import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { ProfilesModule } from '@app/profiles/profiles.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { LoggingModule } from '@app/logging';
import { TracingModule } from '@app/tracing';

/**
 * Module for leaderboard functionality
 * Provides controllers and services for retrieving leaderboard data
 */
@Module({
  imports: [
    ProfilesModule,
    RedisModule,
    LoggingModule,
    TracingModule
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService]
})
export class LeaderboardModule {}
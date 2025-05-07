import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { ProfilesModule } from '../profiles/profiles.module';

/**
 * Module for the leaderboard functionality in the gamification engine.
 * Provides controllers and services for retrieving and managing leaderboard data.
 */
@Module({
  imports: [ProfilesModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
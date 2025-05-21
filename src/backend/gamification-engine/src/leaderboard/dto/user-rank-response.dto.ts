import { ApiProperty } from '@nestjs/swagger';
import { LeaderboardEntryDto } from './leaderboard-response.dto';

/**
 * DTO for user rank response
 */
export class UserRankResponseDto {
  /**
   * Current user's rank information
   */
  @ApiProperty({
    description: "Current user's rank information",
    type: LeaderboardEntryDto,
  })
  currentUser: LeaderboardEntryDto;

  /**
   * Users ranked above the current user
   */
  @ApiProperty({
    description: 'Users ranked above the current user',
    type: [LeaderboardEntryDto],
  })
  usersAbove: LeaderboardEntryDto[];

  /**
   * Users ranked below the current user
   */
  @ApiProperty({
    description: 'Users ranked below the current user',
    type: [LeaderboardEntryDto],
  })
  usersBelow: LeaderboardEntryDto[];

  /**
   * Total number of users on the leaderboard
   * @example 1000
   */
  @ApiProperty({
    description: 'Total number of users on the leaderboard',
    example: 1000,
  })
  totalUsers: number;

  /**
   * Percentile of the current user (0-100)
   * @example 95.5
   */
  @ApiProperty({
    description: 'Percentile of the current user (0-100)',
    example: 95.5,
  })
  percentile: number;
}
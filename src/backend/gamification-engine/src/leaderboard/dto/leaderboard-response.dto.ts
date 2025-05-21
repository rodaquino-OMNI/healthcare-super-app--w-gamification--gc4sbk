import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for a single leaderboard entry
 */
export class LeaderboardEntryDto {
  /**
   * User's rank on the leaderboard
   * @example 1
   */
  @ApiProperty({
    description: "User's rank on the leaderboard",
    example: 1,
  })
  rank: number;

  /**
   * User ID
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  /**
   * User's display name
   * @example "JohnDoe"
   */
  @ApiProperty({
    description: "User's display name",
    example: 'JohnDoe',
  })
  displayName: string;

  /**
   * User's current level
   * @example 42
   */
  @ApiProperty({
    description: "User's current level",
    example: 42,
  })
  level: number;

  /**
   * User's experience points
   * @example 12500
   */
  @ApiProperty({
    description: "User's experience points",
    example: 12500,
  })
  xp: number;

  /**
   * Number of achievements earned
   * @example 15
   */
  @ApiProperty({
    description: 'Number of achievements earned',
    example: 15,
  })
  achievements: number;

  /**
   * Optional avatar URL
   * @example "https://example.com/avatar.jpg"
   */
  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatarUrl?: string;
}

/**
 * DTO for leaderboard response
 */
export class LeaderboardResponseDto {
  /**
   * List of leaderboard entries
   */
  @ApiProperty({
    description: 'List of leaderboard entries',
    type: [LeaderboardEntryDto],
  })
  entries: LeaderboardEntryDto[];

  /**
   * Total number of items in the leaderboard
   * @example 1000
   */
  @ApiProperty({
    description: 'Total number of items in the leaderboard',
    example: 1000,
  })
  totalItems: number;
}
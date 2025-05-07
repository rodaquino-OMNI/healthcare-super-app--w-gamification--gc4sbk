import { IsNotEmpty, IsString, IsEnum, IsOptional, IsInt, Min, Max, IsDate, IsBoolean, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { JOURNEY_IDS } from 'src/backend/shared/src/constants/journey.constants';

/**
 * Enum for leaderboard timeframe options
 */
export enum LeaderboardTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

/**
 * DTO for pagination parameters in leaderboard requests
 */
export class LeaderboardPaginationDto {
  /**
   * The page number to retrieve (1-based indexing)
   * @example 1
   */
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  /**
   * The number of items per page
   * @example 10
   */
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 10;
}

/**
 * DTO for timeframe parameters in leaderboard requests
 */
export class LeaderboardTimeframeDto {
  /**
   * The timeframe for the leaderboard data
   * @example 'weekly'
   */
  @IsEnum(LeaderboardTimeframe)
  @IsOptional()
  timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME;

  /**
   * Optional start date for custom timeframe
   */
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  /**
   * Optional end date for custom timeframe
   */
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}

/**
 * DTO for filtering options in leaderboard requests
 */
export class LeaderboardFilterDto {
  /**
   * Filter by specific achievement ID
   */
  @IsString()
  @IsOptional()
  achievementId?: string;

  /**
   * Filter by specific quest ID
   */
  @IsString()
  @IsOptional()
  questId?: string;

  /**
   * Include only friends of the requesting user
   */
  @IsBoolean()
  @IsOptional()
  friendsOnly?: boolean;
}

/**
 * DTO for retrieving leaderboard data
 * Combines journey selection, timeframe, pagination, and filtering
 */
export class GetLeaderboardDto {
  /**
   * The journey to get leaderboard data for
   * @example 'health'
   */
  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(JOURNEY_IDS))
  journey: string;

  /**
   * Timeframe parameters for the leaderboard
   */
  @ValidateNested()
  @Type(() => LeaderboardTimeframeDto)
  @IsOptional()
  timeframe?: LeaderboardTimeframeDto;

  /**
   * Pagination parameters for the leaderboard
   */
  @ValidateNested()
  @Type(() => LeaderboardPaginationDto)
  @IsOptional()
  pagination?: LeaderboardPaginationDto;

  /**
   * Filter parameters for the leaderboard
   */
  @ValidateNested()
  @Type(() => LeaderboardFilterDto)
  @IsOptional()
  filters?: LeaderboardFilterDto;
}

/**
 * DTO for leaderboard response data
 */
export class LeaderboardEntryDto {
  /**
   * The rank position of the user in the leaderboard
   * @example 1
   */
  rank: number;

  /**
   * The ID of the user
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  userId: string;

  /**
   * The user's current level
   * @example 5
   */
  level: number;

  /**
   * The user's experience points
   * @example 1250
   */
  xp: number;

  /**
   * The number of achievements the user has earned
   * @example 8
   */
  achievements: number;
}

/**
 * DTO for the complete leaderboard response
 */
export class LeaderboardResponseDto {
  /**
   * The journey this leaderboard is for
   * @example 'health'
   */
  journey: string;

  /**
   * The timeframe this leaderboard represents
   * @example 'weekly'
   */
  timeframe: LeaderboardTimeframe;

  /**
   * The total number of users in the complete leaderboard
   * @example 150
   */
  total: number;

  /**
   * The current page number
   * @example 1
   */
  page: number;

  /**
   * The number of items per page
   * @example 10
   */
  limit: number;

  /**
   * The leaderboard entries for the current page
   */
  entries: LeaderboardEntryDto[];

  /**
   * The timestamp when this leaderboard was generated
   */
  generatedAt: Date;
}
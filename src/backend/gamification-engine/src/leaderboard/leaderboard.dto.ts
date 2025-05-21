import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Enum representing the time period for leaderboard data
 */
export enum LeaderboardTimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all-time',
}

/**
 * Base DTO for pagination parameters
 */
export class PaginationDto {
  @ApiProperty({
    description: 'Page number (1-based indexing)',
    type: Number,
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    type: Number,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 10;
}

/**
 * DTO for retrieving global leaderboard data
 */
export class GetLeaderboardDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter leaderboard by journey type',
    enum: JourneyType,
    example: JourneyType.HEALTH,
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journeyType?: JourneyType;

  @ApiPropertyOptional({
    description: 'Time period for leaderboard data',
    enum: LeaderboardTimePeriod,
    default: LeaderboardTimePeriod.ALL_TIME,
    example: LeaderboardTimePeriod.WEEKLY,
  })
  @IsEnum(LeaderboardTimePeriod)
  @IsOptional()
  timePeriod: LeaderboardTimePeriod = LeaderboardTimePeriod.ALL_TIME;
}

/**
 * DTO for retrieving user-specific leaderboard ranking
 */
export class GetUserRankingDto {
  @ApiProperty({
    description: 'User ID to retrieve ranking for',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Filter ranking by journey type',
    enum: JourneyType,
    example: JourneyType.HEALTH,
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journeyType?: JourneyType;

  @ApiPropertyOptional({
    description: 'Time period for ranking data',
    enum: LeaderboardTimePeriod,
    default: LeaderboardTimePeriod.ALL_TIME,
    example: LeaderboardTimePeriod.WEEKLY,
  })
  @IsEnum(LeaderboardTimePeriod)
  @IsOptional()
  timePeriod: LeaderboardTimePeriod = LeaderboardTimePeriod.ALL_TIME;
}

/**
 * DTO for retrieving leaderboard data for a specific journey
 */
export class GetJourneyLeaderboardDto extends PaginationDto {
  @ApiProperty({
    description: 'Journey type to retrieve leaderboard for',
    enum: JourneyType,
    example: JourneyType.HEALTH,
  })
  @IsEnum(JourneyType)
  @IsNotEmpty()
  journeyType: JourneyType;

  @ApiPropertyOptional({
    description: 'Time period for leaderboard data',
    enum: LeaderboardTimePeriod,
    default: LeaderboardTimePeriod.ALL_TIME,
    example: LeaderboardTimePeriod.WEEKLY,
  })
  @IsEnum(LeaderboardTimePeriod)
  @IsOptional()
  timePeriod: LeaderboardTimePeriod = LeaderboardTimePeriod.ALL_TIME;
}

/**
 * DTO for retrieving leaderboard data around a specific user
 */
export class GetLeaderboardAroundUserDto extends PaginationDto {
  @ApiProperty({
    description: 'User ID to center the leaderboard around',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Filter leaderboard by journey type',
    enum: JourneyType,
    example: JourneyType.HEALTH,
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journeyType?: JourneyType;

  @ApiPropertyOptional({
    description: 'Time period for leaderboard data',
    enum: LeaderboardTimePeriod,
    default: LeaderboardTimePeriod.ALL_TIME,
    example: LeaderboardTimePeriod.WEEKLY,
  })
  @IsEnum(LeaderboardTimePeriod)
  @IsOptional()
  timePeriod: LeaderboardTimePeriod = LeaderboardTimePeriod.ALL_TIME;

  @ApiProperty({
    description: 'Number of entries to retrieve above the user',
    type: Number,
    default: 5,
    minimum: 0,
    maximum: 50,
  })
  @IsInt()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  above: number = 5;

  @ApiProperty({
    description: 'Number of entries to retrieve below the user',
    type: Number,
    default: 5,
    minimum: 0,
    maximum: 50,
  })
  @IsInt()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  below: number = 5;
}

/**
 * DTO for retrieving leaderboard data for a specific achievement
 */
export class GetAchievementLeaderboardDto extends PaginationDto {
  @ApiProperty({
    description: 'Achievement ID to retrieve leaderboard for',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  achievementId: string;

  @ApiPropertyOptional({
    description: 'Time period for leaderboard data',
    enum: LeaderboardTimePeriod,
    default: LeaderboardTimePeriod.ALL_TIME,
    example: LeaderboardTimePeriod.WEEKLY,
  })
  @IsEnum(LeaderboardTimePeriod)
  @IsOptional()
  timePeriod: LeaderboardTimePeriod = LeaderboardTimePeriod.ALL_TIME;
}

/**
 * DTO for retrieving leaderboard data for friends of a user
 */
export class GetFriendsLeaderboardDto extends PaginationDto {
  @ApiProperty({
    description: 'User ID to retrieve friends leaderboard for',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Filter leaderboard by journey type',
    enum: JourneyType,
    example: JourneyType.HEALTH,
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journeyType?: JourneyType;

  @ApiPropertyOptional({
    description: 'Time period for leaderboard data',
    enum: LeaderboardTimePeriod,
    default: LeaderboardTimePeriod.ALL_TIME,
    example: LeaderboardTimePeriod.WEEKLY,
  })
  @IsEnum(LeaderboardTimePeriod)
  @IsOptional()
  timePeriod: LeaderboardTimePeriod = LeaderboardTimePeriod.ALL_TIME;
}

/**
 * DTO for retrieving multiple leaderboards in a single request
 */
export class GetMultipleLeaderboardsDto {
  @ApiProperty({
    description: 'Global leaderboard parameters',
    type: GetLeaderboardDto,
  })
  @ValidateNested()
  @Type(() => GetLeaderboardDto)
  global: GetLeaderboardDto;

  @ApiProperty({
    description: 'Journey-specific leaderboard parameters',
    type: GetJourneyLeaderboardDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => GetJourneyLeaderboardDto)
  journeys: GetJourneyLeaderboardDto[];

  @ApiPropertyOptional({
    description: 'User-specific ranking parameters',
    type: GetUserRankingDto,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => GetUserRankingDto)
  userRanking?: GetUserRankingDto;
}

/**
 * DTO for retrieving leaderboard data for a specific quest
 */
export class GetQuestLeaderboardDto extends PaginationDto {
  @ApiProperty({
    description: 'Quest ID to retrieve leaderboard for',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  questId: string;

  @ApiPropertyOptional({
    description: 'Time period for leaderboard data',
    enum: LeaderboardTimePeriod,
    default: LeaderboardTimePeriod.ALL_TIME,
    example: LeaderboardTimePeriod.WEEKLY,
  })
  @IsEnum(LeaderboardTimePeriod)
  @IsOptional()
  timePeriod: LeaderboardTimePeriod = LeaderboardTimePeriod.ALL_TIME;
}
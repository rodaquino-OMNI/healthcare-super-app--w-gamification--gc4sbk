import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import from local DTOs
import { FilterDto } from './filter.dto';
import { SortDto, MultiSortDto } from './sort.dto';

// Import from @austa/interfaces package
import { JourneyType } from '@austa/interfaces/common';

/**
 * Enum for supported pagination strategies
 */
export enum PaginationStrategy {
  PAGE_BASED = 'page-based',
  CURSOR_BASED = 'cursor-based',
}

/**
 * Base DTO for API query parameters used across all endpoints in the gamification engine.
 * Combines pagination, filtering, and sorting into a single DTO to simplify controller
 * implementations and ensure consistent parameter handling in all list operations.
 */
export class ApiQueryDto {
  /**
   * Current page number (1-based indexing)
   * @example 1
   */
  @ApiProperty({
    description: 'Page number (1-based indexing)',
    default: 1,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  /**
   * Number of items per page
   * @example 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  /**
   * Cursor for cursor-based pagination
   * @example "eyJpZCI6IjEyMzQ1Njc4OTAifQ=="
   */
  @ApiPropertyOptional({
    description: 'Cursor for cursor-based pagination',
    type: String,
  })
  @IsString()
  @IsOptional()
  cursor?: string;

  /**
   * Pagination strategy to use (page-based or cursor-based)
   * @example "page-based"
   */
  @ApiPropertyOptional({
    description: 'Pagination strategy to use',
    enum: PaginationStrategy,
    default: PaginationStrategy.PAGE_BASED,
  })
  @IsEnum(PaginationStrategy)
  @IsOptional()
  paginationStrategy?: PaginationStrategy = PaginationStrategy.PAGE_BASED;

  /**
   * Filter criteria for the query
   * @example { "status": "ACTIVE" }
   */
  @ApiPropertyOptional({
    description: 'Filter criteria for the query',
    type: Object,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => FilterDto)
  @IsOptional()
  filter?: FilterDto;

  /**
   * Sorting criteria for the query
   * @example { "field": "createdAt", "direction": "DESC" }
   */
  @ApiPropertyOptional({
    description: 'Sorting criteria for the query',
    type: Object,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => SortDto)
  @IsOptional()
  sort?: SortDto;

  /**
   * Multiple sorting criteria for the query
   * @example [{ "field": "createdAt", "direction": "DESC" }, { "field": "name", "direction": "ASC" }]
   */
  @ApiPropertyOptional({
    description: 'Multiple sorting criteria for the query',
    type: Object,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => MultiSortDto)
  @IsOptional()
  multiSort?: MultiSortDto;

  /**
   * Journey type for journey-specific filtering
   * @example "health"
   */
  @ApiPropertyOptional({
    description: 'Journey type for journey-specific filtering',
    enum: JourneyType,
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journeyType?: JourneyType;

  /**
   * Whether to include soft-deleted items
   * @example false
   */
  @ApiPropertyOptional({
    description: 'Whether to include soft-deleted items',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  includeDeleted?: boolean = false;

  /**
   * Whether to include related entities
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include related entities',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  includeRelations?: boolean = false;
}

/**
 * Extended API query DTO for achievements
 * Adds achievement-specific query parameters
 */
export class AchievementQueryDto extends ApiQueryDto {
  /**
   * Whether to include user progress for the authenticated user
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include user progress for the authenticated user',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  includeUserProgress?: boolean = false;

  /**
   * Whether to include only unlocked achievements
   * @example false
   */
  @ApiPropertyOptional({
    description: 'Whether to include only unlocked achievements',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  unlockedOnly?: boolean = false;
}

/**
 * Extended API query DTO for quests
 * Adds quest-specific query parameters
 */
export class QuestQueryDto extends ApiQueryDto {
  /**
   * Whether to include only active quests
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include only active quests',
    default: true,
    type: Boolean,
  })
  @IsOptional()
  activeOnly?: boolean = true;

  /**
   * Whether to include user progress for the authenticated user
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include user progress for the authenticated user',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  includeUserProgress?: boolean = false;
}

/**
 * Extended API query DTO for rewards
 * Adds reward-specific query parameters
 */
export class RewardQueryDto extends ApiQueryDto {
  /**
   * Whether to include only available rewards
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include only available rewards',
    default: true,
    type: Boolean,
  })
  @IsOptional()
  availableOnly?: boolean = true;

  /**
   * Whether to include user rewards for the authenticated user
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include user rewards for the authenticated user',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  includeUserRewards?: boolean = false;
}

/**
 * Extended API query DTO for leaderboards
 * Adds leaderboard-specific query parameters
 */
export class LeaderboardQueryDto extends ApiQueryDto {
  /**
   * Number of top users to include
   * @example 10
   */
  @ApiPropertyOptional({
    description: 'Number of top users to include',
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  topUsers?: number = 10;

  /**
   * Whether to include the authenticated user in the results
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include the authenticated user in the results',
    default: true,
    type: Boolean,
  })
  @IsOptional()
  includeCurrentUser?: boolean = true;

  /**
   * Number of users to include around the authenticated user
   * @example 5
   */
  @ApiPropertyOptional({
    description: 'Number of users to include around the authenticated user',
    default: 5,
    minimum: 0,
    maximum: 10,
    type: Number,
  })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  surroundingUsers?: number = 5;
}

/**
 * Extended API query DTO for rules
 * Adds rule-specific query parameters
 */
export class RuleQueryDto extends ApiQueryDto {
  /**
   * Whether to include only active rules
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include only active rules',
    default: true,
    type: Boolean,
  })
  @IsOptional()
  activeOnly?: boolean = true;

  /**
   * Whether to include rule conditions
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include rule conditions',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  includeConditions?: boolean = false;

  /**
   * Whether to include rule actions
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Whether to include rule actions',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  includeActions?: boolean = false;
}

/**
 * Extended API query DTO for events
 * Adds event-specific query parameters
 */
export class EventQueryDto extends ApiQueryDto {
  /**
   * Start date for event filtering
   * @example "2023-01-01T00:00:00Z"
   */
  @ApiPropertyOptional({
    description: 'Start date for event filtering',
    type: String,
    format: 'date-time',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  /**
   * End date for event filtering
   * @example "2023-12-31T23:59:59Z"
   */
  @ApiPropertyOptional({
    description: 'End date for event filtering',
    type: String,
    format: 'date-time',
  })
  @IsString()
  @IsOptional()
  endDate?: string;

  /**
   * Whether to include processed events
   * @example false
   */
  @ApiPropertyOptional({
    description: 'Whether to include processed events',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  includeProcessed?: boolean = false;
}
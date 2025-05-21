/**
 * Provides standardized sorting DTOs for the gamification engine.
 * These DTOs ensure consistent ordering of results in list operations
 * across all modules and services.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Defines the possible sort directions for query results.
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Base DTO for sorting operations on a single field.
 * Provides validation for field name and direction.
 */
export class SortDto {
  @ApiProperty({
    description: 'Field name to sort by',
    example: 'createdAt',
  })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({
    description: 'Sort direction (ascending or descending)',
    enum: SortDirection,
    example: SortDirection.DESC,
    default: SortDirection.DESC,
  })
  @IsEnum(SortDirection)
  @IsOptional()
  direction: SortDirection = SortDirection.DESC;

  /**
   * Converts the SortDto to a format compatible with repository queries
   * @returns Record with field name as key and direction as value
   */
  toOrderByClause(): Record<string, string> {
    return { [this.field]: this.direction };
  }
}

/**
 * DTO for sorting by multiple fields with priority order.
 * The first sort option in the array has the highest priority.
 */
export class MultiSortDto {
  @ApiProperty({
    description: 'Array of sort options with priority order (first has highest priority)',
    type: [SortDto],
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => SortDto)
  sortBy: SortDto[];

  /**
   * Converts the MultiSortDto to a format compatible with repository queries
   * @returns Record with field names as keys and directions as values
   */
  toOrderByClause(): Record<string, string> {
    if (!this.sortBy || this.sortBy.length === 0) {
      return {};
    }

    return this.sortBy.reduce((acc, sort) => {
      return { ...acc, ...sort.toOrderByClause() };
    }, {});
  }
}

/**
 * Common sort fields used across gamification entities
 */
export enum CommonSortField {
  ID = 'id',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  TITLE = 'title',
  POINTS = 'points',
  LEVEL = 'level',
  PROGRESS = 'progress',
  STATUS = 'status',
}

/**
 * DTO for sorting by common entity fields with validation
 * against the CommonSortField enum.
 */
export class CommonSortDto extends SortDto {
  @ApiProperty({
    description: 'Common field name to sort by',
    enum: CommonSortField,
    example: CommonSortField.CREATED_AT,
  })
  @IsIn(Object.values(CommonSortField))
  @IsNotEmpty()
  field: CommonSortField;
}

/**
 * Achievement-specific sort fields
 */
export enum AchievementSortField {
  DIFFICULTY = 'difficulty',
  COMPLETION_COUNT = 'completionCount',
  UNLOCK_DATE = 'unlockDate',
}

/**
 * DTO for sorting achievements with validation
 * against achievement-specific fields.
 */
export class AchievementSortDto extends SortDto {
  @ApiProperty({
    description: 'Achievement field to sort by',
    enum: { ...CommonSortField, ...AchievementSortField },
    example: AchievementSortField.DIFFICULTY,
  })
  @IsIn([...Object.values(CommonSortField), ...Object.values(AchievementSortField)])
  @IsNotEmpty()
  field: CommonSortField | AchievementSortField;
}

/**
 * Quest-specific sort fields
 */
export enum QuestSortField {
  DEADLINE = 'deadline',
  REWARD_POINTS = 'rewardPoints',
  DIFFICULTY = 'difficulty',
}

/**
 * DTO for sorting quests with validation
 * against quest-specific fields.
 */
export class QuestSortDto extends SortDto {
  @ApiProperty({
    description: 'Quest field to sort by',
    enum: { ...CommonSortField, ...QuestSortField },
    example: QuestSortField.DEADLINE,
  })
  @IsIn([...Object.values(CommonSortField), ...Object.values(QuestSortField)])
  @IsNotEmpty()
  field: CommonSortField | QuestSortField;
}

/**
 * Reward-specific sort fields
 */
export enum RewardSortField {
  COST = 'cost',
  AVAILABILITY = 'availability',
  REDEMPTION_COUNT = 'redemptionCount',
}

/**
 * DTO for sorting rewards with validation
 * against reward-specific fields.
 */
export class RewardSortDto extends SortDto {
  @ApiProperty({
    description: 'Reward field to sort by',
    enum: { ...CommonSortField, ...RewardSortField },
    example: RewardSortField.COST,
  })
  @IsIn([...Object.values(CommonSortField), ...Object.values(RewardSortField)])
  @IsNotEmpty()
  field: CommonSortField | RewardSortField;
}

/**
 * Profile-specific sort fields
 */
export enum ProfileSortField {
  XP = 'xp',
  LEVEL = 'level',
  ACHIEVEMENT_COUNT = 'achievementCount',
  QUEST_COMPLETION_RATE = 'questCompletionRate',
}

/**
 * DTO for sorting profiles with validation
 * against profile-specific fields.
 */
export class ProfileSortDto extends SortDto {
  @ApiProperty({
    description: 'Profile field to sort by',
    enum: { ...CommonSortField, ...ProfileSortField },
    example: ProfileSortField.XP,
  })
  @IsIn([...Object.values(CommonSortField), ...Object.values(ProfileSortField)])
  @IsNotEmpty()
  field: CommonSortField | ProfileSortField;
}

/**
 * Event-specific sort fields
 */
export enum EventSortField {
  TIMESTAMP = 'timestamp',
  EVENT_TYPE = 'eventType',
  SOURCE = 'source',
  JOURNEY = 'journey',
}

/**
 * DTO for sorting events with validation
 * against event-specific fields.
 */
export class EventSortDto extends SortDto {
  @ApiProperty({
    description: 'Event field to sort by',
    enum: { ...CommonSortField, ...EventSortField },
    example: EventSortField.TIMESTAMP,
  })
  @IsIn([...Object.values(CommonSortField), ...Object.values(EventSortField)])
  @IsNotEmpty()
  field: CommonSortField | EventSortField;
}
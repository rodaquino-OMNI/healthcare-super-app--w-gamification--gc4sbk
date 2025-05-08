import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import from @austa/interfaces package
import { JourneyType, SortDirection } from '@austa/interfaces/common';

/**
 * DTO for sorting by a single field
 */
export class SortDto {
  /**
   * Field name to sort by
   * @example "createdAt"
   */
  @ApiProperty({
    description: 'Field name to sort by',
    type: String,
    example: 'createdAt',
  })
  @IsString()
  @IsNotEmpty()
  field: string;

  /**
   * Sort direction (ascending or descending)
   * @example "DESC"
   */
  @ApiProperty({
    description: 'Sort direction',
    enum: SortDirection,
    default: SortDirection.DESC,
    example: SortDirection.DESC,
  })
  @IsEnum(SortDirection)
  @IsOptional()
  direction: SortDirection = SortDirection.DESC;

  /**
   * Optional journey type for journey-specific sorting
   * @example "health"
   */
  @ApiPropertyOptional({
    description: 'Journey type for journey-specific sorting',
    enum: JourneyType,
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journeyType?: JourneyType;
}

/**
 * DTO for sorting by multiple fields
 */
export class MultiSortDto {
  /**
   * Array of sort criteria
   * @example [{"field":"createdAt","direction":"DESC"},{"field":"name","direction":"ASC"}]
   */
  @ApiProperty({
    description: 'Array of sort criteria',
    type: [SortDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortDto)
  criteria: SortDto[];
}

/**
 * Common sort fields for entities
 */
export enum CommonSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  TITLE = 'title',
  DESCRIPTION = 'description',
  STATUS = 'status',
  PRIORITY = 'priority',
  POINTS = 'points',
  LEVEL = 'level',
  PROGRESS = 'progress',
}

/**
 * Achievement-specific sort fields
 */
export enum AchievementSortField {
  DIFFICULTY = 'difficulty',
  UNLOCK_DATE = 'unlockDate',
  COMPLETION_COUNT = 'completionCount',
  BADGE_TIER = 'badgeTier',
}

/**
 * Quest-specific sort fields
 */
export enum QuestSortField {
  START_DATE = 'startDate',
  END_DATE = 'endDate',
  COMPLETION_RATE = 'completionRate',
  REWARD_VALUE = 'rewardValue',
}

/**
 * Reward-specific sort fields
 */
export enum RewardSortField {
  COST = 'cost',
  AVAILABILITY = 'availability',
  REDEMPTION_COUNT = 'redemptionCount',
  EXPIRY_DATE = 'expiryDate',
}

/**
 * Profile-specific sort fields
 */
export enum ProfileSortField {
  TOTAL_POINTS = 'totalPoints',
  ACHIEVEMENT_COUNT = 'achievementCount',
  QUEST_COMPLETION = 'questCompletion',
  LAST_ACTIVE = 'lastActive',
  JOIN_DATE = 'joinDate',
}

/**
 * Event-specific sort fields
 */
export enum EventSortField {
  TIMESTAMP = 'timestamp',
  EVENT_TYPE = 'eventType',
  SOURCE = 'source',
  PROCESSING_STATUS = 'processingStatus',
  RETRY_COUNT = 'retryCount',
}

/**
 * Creates a SortDto instance with the specified field and direction
 * @param field Field to sort by
 * @param direction Sort direction
 * @returns SortDto instance
 */
export function createSort(field: string, direction: SortDirection = SortDirection.DESC): SortDto {
  const sort = new SortDto();
  sort.field = field;
  sort.direction = direction;
  return sort;
}

/**
 * Creates a MultiSortDto instance with the specified sort criteria
 * @param criteria Array of sort criteria
 * @returns MultiSortDto instance
 */
export function createMultiSort(criteria: SortDto[]): MultiSortDto {
  const multiSort = new MultiSortDto();
  multiSort.criteria = criteria;
  return multiSort;
}

/**
 * Creates a SortDto for a common field
 * @param field Common field to sort by
 * @param direction Sort direction
 * @returns SortDto instance
 */
export function createCommonSort(field: CommonSortField, direction: SortDirection = SortDirection.DESC): SortDto {
  return createSort(field, direction);
}

/**
 * Creates a default sort by createdAt in descending order (newest first)
 * @returns SortDto instance
 */
export function createDefaultSort(): SortDto {
  return createSort(CommonSortField.CREATED_AT, SortDirection.DESC);
}
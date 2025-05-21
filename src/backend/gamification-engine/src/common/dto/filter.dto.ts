/**
 * @file filter.dto.ts
 * @description Defines flexible filtering DTOs that allow consistent filtering of entities across the gamification engine.
 * Supports complex filter conditions with various operators (equals, contains, greater than, etc.),
 * enabling precise data retrieval for achievements, quests, rewards, and other entities.
 * 
 * @example
 * // Basic filter usage
 * const filter = new FilterDto();
 * filter.condition = createFilterCondition('points', FilterOperator.GREATER_THAN, 100);
 * 
 * @example
 * // Complex filter with AND/OR logic
 * const complexFilter = createOrFilter([
 *   createAndFilter([
 *     createFilterCondition('status', FilterOperator.EQUALS, 'active'),
 *     createFilterCondition('points', FilterOperator.GREATER_THAN, 50)
 *   ]),
 *   createAndFilter([
 *     createFilterCondition('isSpecial', FilterOperator.IS_TRUE),
 *     createFilterCondition('points', FilterOperator.GREATER_THAN, 10)
 *   ])
 * ]);
 */

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { JourneyType } from '@austa/interfaces';

/**
 * Enum defining all available filter operators for entity filtering
 * Used to create flexible query conditions across the gamification engine
 * 
 * @example
 * // Using equals operator
 * const filter = createFilterCondition('status', FilterOperator.EQUALS, 'active');
 * 
 * @example
 * // Using numeric comparison
 * const pointsFilter = createFilterCondition('points', FilterOperator.GREATER_THAN, 100);
 */
export enum FilterOperator {
  // Equality operators
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  
  // Numeric comparison operators
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  
  // String operators
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  
  // Array operators
  IN = 'in',
  NOT_IN = 'notIn',
  
  // Null checking operators
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
  
  // Boolean operators
  IS_TRUE = 'isTrue',
  IS_FALSE = 'isFalse',
  
  // Date operators
  BEFORE = 'before',
  AFTER = 'after',
  BETWEEN = 'between',
}

/**
 * Base filter condition DTO for a single field
 * Provides the structure for filtering on a specific field with an operator and value
 */
export class FilterConditionDto {
  @IsString()
  @IsNotEmpty()
  field: string;

  @IsEnum(FilterOperator)
  @IsNotEmpty()
  operator: FilterOperator;

  @IsOptional()
  value?: any;
}

/**
 * DTO for filtering by date fields with specialized date operators
 */
export class DateFilterDto extends FilterConditionDto {
  @IsEnum(FilterOperator)
  @IsNotEmpty()
  operator: FilterOperator.BEFORE | FilterOperator.AFTER | FilterOperator.BETWEEN | FilterOperator.EQUALS;

  @IsDate()
  @IsOptional()
  value?: Date;

  @IsDate()
  @IsOptional()
  secondValue?: Date; // Used for BETWEEN operator
}

/**
 * DTO for filtering by status fields with specialized status operators
 */
export class StatusFilterDto extends FilterConditionDto {
  @IsEnum(FilterOperator)
  @IsNotEmpty()
  operator: FilterOperator.EQUALS | FilterOperator.NOT_EQUALS | FilterOperator.IN | FilterOperator.NOT_IN;

  @IsString()
  @IsOptional()
  value?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  values?: string[];
}

/**
 * Enum defining logical operators for combining multiple filter conditions
 */
export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
}

/**
 * DTO for combining multiple filter conditions with a logical operator
 */
export class CompositeFilterDto {
  @IsEnum(LogicalOperator)
  @IsNotEmpty()
  operator: LogicalOperator;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterDto)
  filters: FilterDto[];
}

/**
 * Main filter DTO that can represent either a single condition or a composite filter
 * This allows for complex nested filtering with AND/OR conditions
 * 
 * The FilterDto is the primary class used for filtering entities in the gamification engine.
 * It supports both simple conditions and complex nested logic with AND/OR operators.
 * 
 * @example
 * // Simple filter
 * const filter = new FilterDto();
 * filter.condition = createFilterCondition('status', FilterOperator.EQUALS, 'active');
 * 
 * @example
 * // Filter with journey type
 * const healthJourneyFilter = new FilterDto();
 * healthJourneyFilter.journeyType = JourneyType.HEALTH;
 * healthJourneyFilter.condition = createFilterCondition('points', FilterOperator.GREATER_THAN, 50);
 */
export class FilterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterConditionDto)
  condition?: FilterConditionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompositeFilterDto)
  composite?: CompositeFilterDto;

  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;

  @IsOptional()
  @IsEnum(JourneyType)
  journeyType?: JourneyType;
}

/**
 * Enum for achievement status values
 */
export enum AchievementStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

/**
 * DTO for filtering achievements by specific achievement properties
 */
export class AchievementFilterDto extends FilterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  createdAt?: DateFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  updatedAt?: DateFilterDto;

  @IsOptional()
  @IsEnum(AchievementStatus)
  status?: AchievementStatus;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsString()
  userId?: string;
  
  @IsOptional()
  @IsBoolean()
  isJourneySpecific?: boolean;
}

/**
 * Enum for quest status values
 */
export enum QuestStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
}

/**
 * DTO for filtering quests by specific quest properties
 */
export class QuestFilterDto extends FilterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  createdAt?: DateFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  updatedAt?: DateFilterDto;

  @IsOptional()
  @IsEnum(QuestStatus)
  status?: QuestStatus;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  requiredSteps?: number;

  @IsOptional()
  @IsString()
  userId?: string;
  
  @IsOptional()
  @IsDate()
  expiresAt?: Date;
  
  @IsOptional()
  @IsBoolean()
  isJourneySpecific?: boolean;
}

/**
 * Enum for reward status values
 */
export enum RewardStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPLETED = 'depleted',
  ARCHIVED = 'archived',
}

/**
 * Enum for reward types
 */
export enum RewardType {
  VIRTUAL = 'virtual',
  PHYSICAL = 'physical',
  DISCOUNT = 'discount',
  SERVICE = 'service',
}

/**
 * DTO for filtering rewards by specific reward properties
 */
export class RewardFilterDto extends FilterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  createdAt?: DateFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  updatedAt?: DateFilterDto;

  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsEnum(RewardType)
  type?: RewardType;
  
  @IsOptional()
  @IsNumber()
  quantity?: number;
  
  @IsOptional()
  @IsBoolean()
  isJourneySpecific?: boolean;
}

/**
 * Enum for common event types in the gamification engine
 */
export enum EventType {
  // Health journey events
  HEALTH_GOAL_ACHIEVED = 'health.goal.achieved',
  HEALTH_METRIC_RECORDED = 'health.metric.recorded',
  HEALTH_DEVICE_CONNECTED = 'health.device.connected',
  
  // Care journey events
  CARE_APPOINTMENT_BOOKED = 'care.appointment.booked',
  CARE_APPOINTMENT_COMPLETED = 'care.appointment.completed',
  CARE_MEDICATION_TAKEN = 'care.medication.taken',
  
  // Plan journey events
  PLAN_BENEFIT_USED = 'plan.benefit.used',
  PLAN_CLAIM_SUBMITTED = 'plan.claim.submitted',
  PLAN_COVERAGE_REVIEWED = 'plan.coverage.reviewed',
  
  // Cross-journey events
  USER_PROFILE_COMPLETED = 'user.profile.completed',
  USER_LOGGED_IN = 'user.logged.in',
  USER_REFERRED_FRIEND = 'user.referred.friend',
}

/**
 * DTO for filtering events by specific event properties
 */
export class EventFilterDto extends FilterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  timestamp?: DateFilterDto;

  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
  
  @IsOptional()
  @IsBoolean()
  processed?: boolean;
  
  @IsOptional()
  @IsString()
  correlationId?: string;
}

/**
 * Factory function to create a filter condition
 * @param field The field to filter on
 * @param operator The operator to use
 * @param value The value to compare against
 * @returns A FilterConditionDto instance
 */
export function createFilterCondition(
  field: string,
  operator: FilterOperator,
  value?: any,
): FilterConditionDto {
  const condition = new FilterConditionDto();
  condition.field = field;
  condition.operator = operator;
  condition.value = value;
  return condition;
}

/**
 * Factory function to create a date filter condition
 * @param field The date field to filter on
 * @param operator The date operator to use
 * @param value The date value to compare against
 * @param secondValue The second date value for BETWEEN operator
 * @returns A DateFilterDto instance
 */
export function createDateFilter(
  field: string,
  operator: FilterOperator.BEFORE | FilterOperator.AFTER | FilterOperator.BETWEEN | FilterOperator.EQUALS,
  value: Date,
  secondValue?: Date,
): DateFilterDto {
  const filter = new DateFilterDto();
  filter.field = field;
  filter.operator = operator;
  filter.value = value;
  
  if (operator === FilterOperator.BETWEEN && secondValue) {
    filter.secondValue = secondValue;
  }
  
  return filter;
}

/**
 * Factory function to create a composite filter with AND logic
 * @param filters The filters to combine with AND logic
 * @returns A FilterDto instance with a composite filter
 */
export function createAndFilter(filters: FilterDto[]): FilterDto {
  const filter = new FilterDto();
  const composite = new CompositeFilterDto();
  composite.operator = LogicalOperator.AND;
  composite.filters = filters;
  filter.composite = composite;
  return filter;
}

/**
 * Factory function to create a composite filter with OR logic
 * @param filters The filters to combine with OR logic
 * @returns A FilterDto instance with a composite filter
 */
export function createOrFilter(filters: FilterDto[]): FilterDto {
  const filter = new FilterDto();
  const composite = new CompositeFilterDto();
  composite.operator = LogicalOperator.OR;
  composite.filters = filters;
  filter.composite = composite;
  return filter;
}

/**
 * Factory function to create a journey-specific filter
 * @param journeyType The journey type to filter by
 * @param baseFilter Optional base filter to extend with journey type
 * @returns A FilterDto instance with journey type specified
 */
export function createJourneyFilter(
  journeyType: JourneyType,
  baseFilter?: FilterDto,
): FilterDto {
  const filter = baseFilter || new FilterDto();
  filter.journeyType = journeyType;
  return filter;
}

/**
 * Factory function to create a filter for active entities
 * @param entityType The type of entity to create a status filter for
 * @returns A FilterDto instance with active status filter
 */
export function createActiveStatusFilter(entityType: 'achievement' | 'quest' | 'reward'): FilterDto {
  const filter = new FilterDto();
  const condition = new FilterConditionDto();
  condition.field = 'status';
  condition.operator = FilterOperator.EQUALS;
  
  switch (entityType) {
    case 'achievement':
      condition.value = AchievementStatus.ACTIVE;
      break;
    case 'quest':
      condition.value = QuestStatus.ACTIVE;
      break;
    case 'reward':
      condition.value = RewardStatus.ACTIVE;
      break;
  }
  
  filter.condition = condition;
  return filter;
}
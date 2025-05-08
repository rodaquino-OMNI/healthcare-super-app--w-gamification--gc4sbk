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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import from @austa/interfaces package
import { JourneyType } from '@austa/interfaces/common';

/**
 * Enum for filter operators used in filter conditions
 */
export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
  BETWEEN = 'BETWEEN',
  NOT_BETWEEN = 'NOT_BETWEEN',
}

/**
 * Base filter condition DTO for a single field
 */
export class FilterConditionDto<T = any> {
  /**
   * Operator to use for filtering
   * @example "EQUALS"
   */
  @ApiProperty({
    description: 'Operator to use for filtering',
    enum: FilterOperator,
    example: FilterOperator.EQUALS,
  })
  @IsEnum(FilterOperator)
  operator: FilterOperator;

  /**
   * Value to filter by
   * @example "ACTIVE"
   */
  @ApiProperty({
    description: 'Value to filter by',
    example: 'ACTIVE',
  })
  @IsNotEmpty()
  value: T;

  /**
   * Optional journey type for journey-specific filtering
   * @example "health"
   */
  @ApiPropertyOptional({
    description: 'Journey type for journey-specific filtering',
    enum: JourneyType,
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journeyType?: JourneyType;
}

/**
 * String filter condition DTO
 */
export class StringFilterConditionDto extends FilterConditionDto<string> {
  /**
   * Value to filter by
   * @example "ACTIVE"
   */
  @ApiProperty({
    description: 'String value to filter by',
    type: String,
    example: 'ACTIVE',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}

/**
 * Number filter condition DTO
 */
export class NumberFilterConditionDto extends FilterConditionDto<number> {
  /**
   * Value to filter by
   * @example 100
   */
  @ApiProperty({
    description: 'Numeric value to filter by',
    type: Number,
    example: 100,
  })
  @IsNumber()
  value: number;
}

/**
 * Boolean filter condition DTO
 */
export class BooleanFilterConditionDto extends FilterConditionDto<boolean> {
  /**
   * Value to filter by
   * @example true
   */
  @ApiProperty({
    description: 'Boolean value to filter by',
    type: Boolean,
    example: true,
  })
  @IsBoolean()
  value: boolean;
}

/**
 * Date filter condition DTO
 */
export class DateFilterConditionDto extends FilterConditionDto<Date> {
  /**
   * Value to filter by
   * @example "2023-01-01T00:00:00Z"
   */
  @ApiProperty({
    description: 'Date value to filter by',
    type: Date,
    example: '2023-01-01T00:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  value: Date;
}

/**
 * Array filter condition DTO
 */
export class ArrayFilterConditionDto<T = any> extends FilterConditionDto<T[]> {
  /**
   * Array of values to filter by
   * @example ["ACTIVE", "PENDING"]
   */
  @ApiProperty({
    description: 'Array of values to filter by',
    isArray: true,
    example: ['ACTIVE', 'PENDING'],
  })
  @IsArray()
  value: T[];
}

/**
 * Main filter DTO that combines multiple filter conditions
 */
export class FilterDto {
  /**
   * Field-based filter conditions
   * @example { "status": { "operator": "EQUALS", "value": "ACTIVE" } }
   */
  @ApiPropertyOptional({
    description: 'Field-based filter conditions',
    type: Object,
    example: { status: { operator: FilterOperator.EQUALS, value: 'ACTIVE' } },
  })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, FilterConditionDto>;

  /**
   * AND conditions (all must match)
   * @example [{ "status": { "operator": "EQUALS", "value": "ACTIVE" } }]
   */
  @ApiPropertyOptional({
    description: 'AND conditions (all must match)',
    type: [Object],
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterDto)
  AND?: FilterDto[];

  /**
   * OR conditions (at least one must match)
   * @example [{ "status": { "operator": "EQUALS", "value": "ACTIVE" } }]
   */
  @ApiPropertyOptional({
    description: 'OR conditions (at least one must match)',
    type: [Object],
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterDto)
  OR?: FilterDto[];

  /**
   * NOT conditions (none must match)
   * @example { "status": { "operator": "EQUALS", "value": "DELETED" } }
   */
  @ApiPropertyOptional({
    description: 'NOT conditions (none must match)',
    type: Object,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDto)
  NOT?: FilterDto;

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
}

/**
 * Achievement-specific filter DTO
 */
export class AchievementFilterDto extends FilterDto {
  /**
   * Filter by difficulty level
   * @example { "operator": "LESS_THAN_OR_EQUAL", "value": 3 }
   */
  @ApiPropertyOptional({
    description: 'Filter by difficulty level',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  difficulty?: NumberFilterConditionDto;

  /**
   * Filter by badge tier
   * @example { "operator": "EQUALS", "value": "GOLD" }
   */
  @ApiPropertyOptional({
    description: 'Filter by badge tier',
    type: StringFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => StringFilterConditionDto)
  @IsOptional()
  badgeTier?: StringFilterConditionDto;

  /**
   * Filter by points awarded
   * @example { "operator": "GREATER_THAN", "value": 100 }
   */
  @ApiPropertyOptional({
    description: 'Filter by points awarded',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  points?: NumberFilterConditionDto;

  /**
   * Filter by secret achievements
   * @example { "operator": "EQUALS", "value": true }
   */
  @ApiPropertyOptional({
    description: 'Filter by secret achievements',
    type: BooleanFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => BooleanFilterConditionDto)
  @IsOptional()
  isSecret?: BooleanFilterConditionDto;
}

/**
 * Quest-specific filter DTO
 */
export class QuestFilterDto extends FilterDto {
  /**
   * Filter by start date
   * @example { "operator": "GREATER_THAN_OR_EQUAL", "value": "2023-01-01T00:00:00Z" }
   */
  @ApiPropertyOptional({
    description: 'Filter by start date',
    type: DateFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => DateFilterConditionDto)
  @IsOptional()
  startDate?: DateFilterConditionDto;

  /**
   * Filter by end date
   * @example { "operator": "LESS_THAN_OR_EQUAL", "value": "2023-12-31T23:59:59Z" }
   */
  @ApiPropertyOptional({
    description: 'Filter by end date',
    type: DateFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => DateFilterConditionDto)
  @IsOptional()
  endDate?: DateFilterConditionDto;

  /**
   * Filter by duration in days
   * @example { "operator": "LESS_THAN_OR_EQUAL", "value": 7 }
   */
  @ApiPropertyOptional({
    description: 'Filter by duration in days',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  durationDays?: NumberFilterConditionDto;

  /**
   * Filter by required points
   * @example { "operator": "GREATER_THAN", "value": 100 }
   */
  @ApiPropertyOptional({
    description: 'Filter by required points',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  requiredPoints?: NumberFilterConditionDto;
}

/**
 * Reward-specific filter DTO
 */
export class RewardFilterDto extends FilterDto {
  /**
   * Filter by cost
   * @example { "operator": "LESS_THAN_OR_EQUAL", "value": 500 }
   */
  @ApiPropertyOptional({
    description: 'Filter by cost',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  cost?: NumberFilterConditionDto;

  /**
   * Filter by availability
   * @example { "operator": "EQUALS", "value": true }
   */
  @ApiPropertyOptional({
    description: 'Filter by availability',
    type: BooleanFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => BooleanFilterConditionDto)
  @IsOptional()
  isAvailable?: BooleanFilterConditionDto;

  /**
   * Filter by expiry date
   * @example { "operator": "GREATER_THAN", "value": "2023-12-31T23:59:59Z" }
   */
  @ApiPropertyOptional({
    description: 'Filter by expiry date',
    type: DateFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => DateFilterConditionDto)
  @IsOptional()
  expiryDate?: DateFilterConditionDto;

  /**
   * Filter by limited quantity
   * @example { "operator": "LESS_THAN", "value": 100 }
   */
  @ApiPropertyOptional({
    description: 'Filter by limited quantity',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  quantity?: NumberFilterConditionDto;
}

/**
 * Event-specific filter DTO
 */
export class EventFilterDto extends FilterDto {
  /**
   * Filter by event type
   * @example { "operator": "EQUALS", "value": "HEALTH_METRIC_RECORDED" }
   */
  @ApiPropertyOptional({
    description: 'Filter by event type',
    type: StringFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => StringFilterConditionDto)
  @IsOptional()
  eventType?: StringFilterConditionDto;

  /**
   * Filter by timestamp
   * @example { "operator": "GREATER_THAN", "value": "2023-01-01T00:00:00Z" }
   */
  @ApiPropertyOptional({
    description: 'Filter by timestamp',
    type: DateFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => DateFilterConditionDto)
  @IsOptional()
  timestamp?: DateFilterConditionDto;

  /**
   * Filter by processing status
   * @example { "operator": "EQUALS", "value": "PROCESSED" }
   */
  @ApiPropertyOptional({
    description: 'Filter by processing status',
    type: StringFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => StringFilterConditionDto)
  @IsOptional()
  processingStatus?: StringFilterConditionDto;

  /**
   * Filter by retry count
   * @example { "operator": "GREATER_THAN", "value": 0 }
   */
  @ApiPropertyOptional({
    description: 'Filter by retry count',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  retryCount?: NumberFilterConditionDto;
}

/**
 * Rule-specific filter DTO
 */
export class RuleFilterDto extends FilterDto {
  /**
   * Filter by rule type
   * @example { "operator": "EQUALS", "value": "ACHIEVEMENT" }
   */
  @ApiPropertyOptional({
    description: 'Filter by rule type',
    type: StringFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => StringFilterConditionDto)
  @IsOptional()
  ruleType?: StringFilterConditionDto;

  /**
   * Filter by priority
   * @example { "operator": "LESS_THAN", "value": 10 }
   */
  @ApiPropertyOptional({
    description: 'Filter by priority',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  priority?: NumberFilterConditionDto;

  /**
   * Filter by active status
   * @example { "operator": "EQUALS", "value": true }
   */
  @ApiPropertyOptional({
    description: 'Filter by active status',
    type: BooleanFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => BooleanFilterConditionDto)
  @IsOptional()
  isActive?: BooleanFilterConditionDto;
}

/**
 * Profile-specific filter DTO
 */
export class ProfileFilterDto extends FilterDto {
  /**
   * Filter by level
   * @example { "operator": "GREATER_THAN_OR_EQUAL", "value": 10 }
   */
  @ApiPropertyOptional({
    description: 'Filter by level',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  level?: NumberFilterConditionDto;

  /**
   * Filter by total points
   * @example { "operator": "GREATER_THAN", "value": 1000 }
   */
  @ApiPropertyOptional({
    description: 'Filter by total points',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  totalPoints?: NumberFilterConditionDto;

  /**
   * Filter by achievement count
   * @example { "operator": "GREATER_THAN", "value": 5 }
   */
  @ApiPropertyOptional({
    description: 'Filter by achievement count',
    type: NumberFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => NumberFilterConditionDto)
  @IsOptional()
  achievementCount?: NumberFilterConditionDto;

  /**
   * Filter by last active date
   * @example { "operator": "GREATER_THAN", "value": "2023-01-01T00:00:00Z" }
   */
  @ApiPropertyOptional({
    description: 'Filter by last active date',
    type: DateFilterConditionDto,
  })
  @ValidateNested()
  @Type(() => DateFilterConditionDto)
  @IsOptional()
  lastActiveAt?: DateFilterConditionDto;
}

/**
 * Helper functions for creating filter conditions
 */

/**
 * Creates a string filter condition
 * @param operator Filter operator
 * @param value String value to filter by
 * @returns StringFilterConditionDto
 */
export function createStringFilter(
  operator: FilterOperator,
  value: string,
  journeyType?: JourneyType,
): StringFilterConditionDto {
  const filter = new StringFilterConditionDto();
  filter.operator = operator;
  filter.value = value;
  if (journeyType) {
    filter.journeyType = journeyType;
  }
  return filter;
}

/**
 * Creates a number filter condition
 * @param operator Filter operator
 * @param value Numeric value to filter by
 * @returns NumberFilterConditionDto
 */
export function createNumberFilter(
  operator: FilterOperator,
  value: number,
  journeyType?: JourneyType,
): NumberFilterConditionDto {
  const filter = new NumberFilterConditionDto();
  filter.operator = operator;
  filter.value = value;
  if (journeyType) {
    filter.journeyType = journeyType;
  }
  return filter;
}

/**
 * Creates a boolean filter condition
 * @param operator Filter operator
 * @param value Boolean value to filter by
 * @returns BooleanFilterConditionDto
 */
export function createBooleanFilter(
  operator: FilterOperator,
  value: boolean,
  journeyType?: JourneyType,
): BooleanFilterConditionDto {
  const filter = new BooleanFilterConditionDto();
  filter.operator = operator;
  filter.value = value;
  if (journeyType) {
    filter.journeyType = journeyType;
  }
  return filter;
}

/**
 * Creates a date filter condition
 * @param operator Filter operator
 * @param value Date value to filter by
 * @returns DateFilterConditionDto
 */
export function createDateFilter(
  operator: FilterOperator,
  value: Date,
  journeyType?: JourneyType,
): DateFilterConditionDto {
  const filter = new DateFilterConditionDto();
  filter.operator = operator;
  filter.value = value;
  if (journeyType) {
    filter.journeyType = journeyType;
  }
  return filter;
}

/**
 * Creates an array filter condition
 * @param operator Filter operator
 * @param value Array of values to filter by
 * @returns ArrayFilterConditionDto
 */
export function createArrayFilter<T>(
  operator: FilterOperator,
  value: T[],
  journeyType?: JourneyType,
): ArrayFilterConditionDto<T> {
  const filter = new ArrayFilterConditionDto<T>();
  filter.operator = operator;
  filter.value = value;
  if (journeyType) {
    filter.journeyType = journeyType;
  }
  return filter;
}

/**
 * Creates a filter with a single condition
 * @param field Field name
 * @param condition Filter condition
 * @returns FilterDto
 */
export function createFilter<T>(
  field: string,
  condition: FilterConditionDto<T>,
  journeyType?: JourneyType,
): FilterDto {
  const filter = new FilterDto();
  filter.conditions = { [field]: condition };
  if (journeyType) {
    filter.journeyType = journeyType;
  }
  return filter;
}

/**
 * Creates a filter with multiple conditions (AND logic)
 * @param conditions Object with field names as keys and filter conditions as values
 * @returns FilterDto
 */
export function createFilterWithConditions(
  conditions: Record<string, FilterConditionDto>,
  journeyType?: JourneyType,
): FilterDto {
  const filter = new FilterDto();
  filter.conditions = conditions;
  if (journeyType) {
    filter.journeyType = journeyType;
  }
  return filter;
}

/**
 * Creates a compound filter with AND logic
 * @param filters Array of filters to combine with AND logic
 * @returns FilterDto
 */
export function createAndFilter(filters: FilterDto[], journeyType?: JourneyType): FilterDto {
  const filter = new FilterDto();
  filter.AND = filters;
  if (journeyType) {
    filter.journeyType = journeyType;
  }
  return filter;
}

/**
 * Creates a compound filter with OR logic
 * @param filters Array of filters to combine with OR logic
 * @returns FilterDto
 */
export function createOrFilter(filters: FilterDto[], journeyType?: JourneyType): FilterDto {
  const filter = new FilterDto();
  filter.OR = filters;
  if (journeyType) {
    filter.journeyType = journeyType;
  }
  return filter;
}

/**
 * Creates a negated filter
 * @param filter Filter to negate
 * @returns FilterDto
 */
export function createNotFilter(filter: FilterDto, journeyType?: JourneyType): FilterDto {
  const notFilter = new FilterDto();
  notFilter.NOT = filter;
  if (journeyType) {
    notFilter.journeyType = journeyType;
  }
  return notFilter;
}
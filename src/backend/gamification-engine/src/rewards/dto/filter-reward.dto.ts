import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { JourneyType, RewardCategory } from '@austa/interfaces/gamification/rewards';

/**
 * Range filter for numeric values
 * Used for filtering rewards by XP value ranges
 */
export class NumericRangeFilter {
  /**
   * Minimum value in the range
   */
  @IsNumber()
  @IsOptional()
  @Min(0)
  min?: number;

  /**
   * Maximum value in the range
   */
  @IsNumber()
  @IsOptional()
  @Max(10000)
  max?: number;
}

/**
 * Date range filter for filtering by date fields
 * Used for filtering rewards by availability period
 */
export class DateRangeFilter {
  /**
   * Start date for the range
   */
  @IsOptional()
  from?: Date;

  /**
   * End date for the range
   */
  @IsOptional()
  to?: Date;
}

/**
 * FilterRewardDto - Extends the shared FilterDto to provide reward-specific
 * filtering capabilities for the rewards API.
 * 
 * This DTO enables standardized filtering, sorting, and pagination for reward queries
 * while adding reward-specific filter properties like journeyFilter, titleSearch, and xpRanges.
 */
export class FilterRewardDto implements FilterDto {
  /**
   * Conditions for filtering records
   */
  @IsOptional()
  where?: Record<string, any>;
  
  /**
   * Sorting criteria for the results
   */
  @IsOptional()
  orderBy?: Record<string, 'asc' | 'desc'>;
  
  /**
   * Related entities to include in the results
   */
  @IsOptional()
  include?: Record<string, boolean | Record<string, any>>;
  
  /**
   * Fields to include in the results
   */
  @IsOptional()
  select?: Record<string, boolean>;
  
  /**
   * Journey context for the filter (health, care, plan, global)
   * Allows for journey-specific handling of common queries
   */
  @IsOptional()
  @IsString()
  journey?: string;

  /**
   * Filter rewards by specific journey types
   * Can be an array of journey types to include rewards from multiple journeys
   */
  @IsOptional()
  @IsArray()
  @IsEnum(JourneyType, { each: true })
  journeyFilter?: JourneyType[];

  /**
   * Case-insensitive search for reward titles
   * Will match any part of the title string
   */
  @IsOptional()
  @IsString()
  titleSearch?: string;

  /**
   * Filter rewards by XP value ranges
   * Allows filtering for rewards within specific XP ranges
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => NumericRangeFilter)
  xpRange?: NumericRangeFilter;

  /**
   * Filter rewards by category
   * Can be an array of categories to include multiple types of rewards
   */
  @IsOptional()
  @IsArray()
  @IsEnum(RewardCategory, { each: true })
  categoryFilter?: RewardCategory[];

  /**
   * Filter rewards by active status
   * When true, returns only active rewards
   * When false, returns only inactive rewards
   * When undefined, returns all rewards
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /**
   * Filter rewards by availability period
   * Allows filtering for rewards available within a specific date range
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeFilter)
  availabilityPeriod?: DateRangeFilter;
}
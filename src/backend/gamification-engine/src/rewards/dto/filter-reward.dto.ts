import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FilterDto } from '@austa/interfaces/common/dto';
import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Range filter for numeric values
 * Allows filtering by minimum and maximum values
 */
export class RangeFilter {
  /**
   * Minimum value for the range (inclusive)
   */
  @IsOptional()
  min?: number;

  /**
   * Maximum value for the range (inclusive)
   */
  @IsOptional()
  max?: number;
}

/**
 * Filter DTO for Reward entities
 * Extends the shared FilterDto to provide reward-specific filtering options
 * Used for standardized filtering, sorting, and pagination in reward queries
 */
export class FilterRewardDto extends FilterDto {
  /**
   * Filter rewards by journey context
   * Can be 'health', 'care', 'plan', or 'global'
   */
  @IsOptional()
  @IsEnum(JourneyType, {
    message: 'Journey filter must be one of: health, care, plan, or global'
  })
  journeyFilter?: JourneyType;

  /**
   * Case-insensitive search for reward titles
   * Will match any part of the title string
   */
  @IsOptional()
  @IsString()
  titleSearch?: string;

  /**
   * Filter rewards by XP value ranges
   * Allows filtering for rewards with XP values within specified min/max range
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RangeFilter)
  xpRanges?: RangeFilter;
}
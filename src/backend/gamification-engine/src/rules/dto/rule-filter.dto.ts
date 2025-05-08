import { FilterDto } from '@app/shared';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum representing the different journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  ALL = 'all'
}

/**
 * Data Transfer Object for filtering gamification rules
 * Extends the shared FilterDto with rule-specific filter criteria
 */
export class RuleFilterDto extends FilterDto {
  /**
   * Filter rules by the type of event they listen for
   * Examples: "STEPS_RECORDED", "APPOINTMENT_COMPLETED", "CLAIM_SUBMITTED"
   */
  @ApiProperty({
    description: 'Filter rules by event type',
    required: false,
    example: 'STEPS_RECORDED'
  })
  @IsString()
  @IsOptional()
  eventType?: string;

  /**
   * Filter rules by the journey they belong to
   * This enables cross-journey rule management
   */
  @ApiProperty({
    description: 'Filter rules by journey',
    required: false,
    enum: JourneyType,
    example: JourneyType.HEALTH
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journey?: JourneyType;

  /**
   * Filter rules by their enabled/disabled status
   * Useful for rule management interfaces
   */
  @ApiProperty({
    description: 'Filter rules by enabled status',
    required: false,
    example: true
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
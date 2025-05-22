import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from './event-types.enum';

/**
 * DTO for benefit utilization events in the Plan journey.
 * 
 * This DTO validates and structures events related to insurance benefit usage,
 * including benefit utilization, redemption, and status changes. It enables
 * gamification of benefit-related activities and supports benefit notifications.
 */
export class BenefitEventDto {
  /**
   * Type of the event, must be a valid benefit-related event type
   */
  @IsEnum(EventType, {
    message: 'Event type must be a valid benefit-related event type',
  })
  @IsNotEmpty()
  type: EventType;

  /**
   * ID of the user who utilized the benefit
   */
  @IsUUID('4', {
    message: 'User ID must be a valid UUID',
  })
  @IsNotEmpty()
  userId: string;

  /**
   * Benefit utilization data
   */
  @IsObject()
  @ValidateNested()
  @Type(() => BenefitEventPayloadDto)
  data: BenefitEventPayloadDto;
}

/**
 * DTO for benefit event payload data.
 * 
 * This class validates the specific data structure for benefit events,
 * ensuring all required fields are present and properly formatted.
 */
export class BenefitEventPayloadDto {
  /**
   * Unique identifier of the benefit that was utilized
   */
  @IsUUID('4', {
    message: 'Benefit ID must be a valid UUID',
  })
  @IsNotEmpty()
  benefitId: string;

  /**
   * Reference to the associated insurance plan
   */
  @IsUUID('4', {
    message: 'Plan ID must be a valid UUID',
  })
  @IsNotEmpty()
  planId: string;

  /**
   * The category or type of benefit (e.g., "Dental", "Vision", "Prescription")
   */
  @IsString()
  @IsNotEmpty()
  benefitType: string;

  /**
   * Value of the benefit that was utilized
   * This could be a monetary amount, a count, or other measure depending on benefit type
   */
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Min(0)
  @IsOptional()
  value?: number;

  /**
   * The currency or unit of the value (if applicable)
   */
  @IsString()
  @IsOptional()
  unit?: string;

  /**
   * Detailed description of how the benefit was utilized
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Location where the benefit was utilized (if applicable)
   */
  @IsString()
  @IsOptional()
  location?: string;

  /**
   * Provider who delivered the service (if applicable)
   */
  @IsString()
  @IsOptional()
  provider?: string;

  /**
   * Whether this is the first time this benefit has been utilized
   */
  @IsOptional()
  isFirstUtilization?: boolean;

  /**
   * Current usage count or amount for this benefit (for tracking limits)
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentUsageCount?: number;

  /**
   * Maximum allowed usage for this benefit (if applicable)
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxUsageLimit?: number;

  /**
   * Percentage of the benefit limit that has been used
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  usagePercentage?: number;

  /**
   * Whether the benefit has been fully utilized (reached its limit)
   */
  @IsOptional()
  isFullyUtilized?: boolean;

  /**
   * Additional metadata or context for the benefit utilization
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Specialized DTO for benefit redemption events.
 * 
 * This extends the base benefit event payload with additional fields
 * specific to benefit redemption scenarios.
 */
export class BenefitRedemptionPayloadDto extends BenefitEventPayloadDto {
  /**
   * Unique identifier for the redemption transaction
   */
  @IsUUID('4', {
    message: 'Redemption ID must be a valid UUID',
  })
  @IsNotEmpty()
  redemptionId: string;

  /**
   * Points or currency used for redemption
   */
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  pointsUsed: number;

  /**
   * Status of the redemption (e.g., "Pending", "Completed", "Failed")
   */
  @IsString()
  @IsNotEmpty()
  redemptionStatus: string;

  /**
   * Date when the benefit will be available after redemption
   */
  @IsString()
  @IsOptional()
  availableFrom?: string;

  /**
   * Date when the redeemed benefit expires
   */
  @IsString()
  @IsOptional()
  availableTo?: string;
}

/**
 * Specialized DTO for benefit status change events.
 * 
 * This extends the base benefit event payload with additional fields
 * specific to benefit status changes.
 */
export class BenefitStatusChangePayloadDto extends BenefitEventPayloadDto {
  /**
   * Previous status of the benefit
   */
  @IsString()
  @IsNotEmpty()
  previousStatus: string;

  /**
   * New status of the benefit
   */
  @IsString()
  @IsNotEmpty()
  newStatus: string;

  /**
   * Reason for the status change
   */
  @IsString()
  @IsOptional()
  reason?: string;

  /**
   * User who initiated the status change (if different from the benefit owner)
   */
  @IsUUID('4', {
    message: 'Initiator ID must be a valid UUID',
  })
  @IsOptional()
  initiatedBy?: string;
}

/**
 * Factory function to create a benefit utilization event.
 * 
 * This helper function simplifies the creation of properly structured
 * benefit utilization events for the gamification engine.
 * 
 * @param userId The ID of the user who utilized the benefit
 * @param benefitId The ID of the utilized benefit
 * @param planId The ID of the associated insurance plan
 * @param benefitType The type of benefit
 * @param value The value of the benefit utilization
 * @param additionalData Additional data for the event
 * @returns A properly structured benefit utilization event
 */
export function createBenefitUtilizedEvent(
  userId: string,
  benefitId: string,
  planId: string,
  benefitType: string,
  value?: number,
  additionalData?: Partial<BenefitEventPayloadDto>
): BenefitEventDto {
  return {
    type: EventType.BENEFIT_UTILIZED,
    userId,
    data: {
      benefitId,
      planId,
      benefitType,
      value,
      ...additionalData,
    },
  };
}

/**
 * Factory function to create a benefit redemption event.
 * 
 * This helper function simplifies the creation of properly structured
 * benefit redemption events for the gamification engine.
 * 
 * @param userId The ID of the user who redeemed the benefit
 * @param benefitId The ID of the redeemed benefit
 * @param planId The ID of the associated insurance plan
 * @param redemptionId The ID of the redemption transaction
 * @param pointsUsed The points used for redemption
 * @param redemptionStatus The status of the redemption
 * @param additionalData Additional data for the event
 * @returns A properly structured benefit redemption event
 */
export function createBenefitRedemptionEvent(
  userId: string,
  benefitId: string,
  planId: string,
  redemptionId: string,
  pointsUsed: number,
  redemptionStatus: string,
  additionalData?: Partial<BenefitRedemptionPayloadDto>
): BenefitEventDto {
  return {
    type: EventType.REWARD_REDEEMED,
    userId,
    data: {
      benefitId,
      planId,
      benefitType: 'Redemption',
      redemptionId,
      pointsUsed,
      redemptionStatus,
      ...additionalData,
    },
  };
}
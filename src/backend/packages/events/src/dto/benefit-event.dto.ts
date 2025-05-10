/**
 * @file benefit-event.dto.ts
 * @description Specialized DTO for benefit events in the Plan journey.
 * 
 * This file defines the data transfer objects used to validate and structure
 * benefit events (utilization, redemption, status changes) from the Plan journey.
 * These DTOs ensure proper structure for benefit usage data, including benefit type,
 * utilization details, and redemption information. They enable gamification of
 * benefit utilization and support benefit-related notifications.
 */

import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/**
 * Enum representing the different types of benefit events
 * that can occur within the Plan journey.
 * 
 * These event types are used by the gamification engine to process
 * benefit-related activities and award achievements/points.
 */
export enum BenefitEventType {
  /** Triggered when a user utilizes a benefit */
  UTILIZATION = 'benefit.utilization',
  /** Triggered when a user redeems a benefit for a reward */
  REDEMPTION = 'benefit.redemption',
  /** Triggered when a benefit's status changes */
  STATUS_CHANGE = 'benefit.status_change',
}

/**
 * Enum representing the different categories of benefits
 * available in the Plan journey.
 * 
 * These categories are used for organizing benefits and for
 * gamification rules that may apply to specific benefit categories.
 */
export enum BenefitCategory {
  /** Health-related benefits like preventive care or screenings */
  HEALTH = 'health',
  /** Wellness benefits like gym memberships or mental health services */
  WELLNESS = 'wellness',
  /** Financial benefits like tax advantages or savings programs */
  FINANCIAL = 'financial',
  /** Insurance-specific benefits like coverage options */
  INSURANCE = 'insurance',
  /** Lifestyle benefits like discounts or special offers */
  LIFESTYLE = 'lifestyle',
  /** Educational benefits like courses or training programs */
  EDUCATION = 'education',
}

/**
 * Enum representing the different status values a benefit can have.
 * 
 * These statuses track the lifecycle of a benefit from availability
 * through utilization and redemption.
 */
export enum BenefitStatus {
  /** Benefit is available for use */
  AVAILABLE = 'available',
  /** Benefit has been utilized by the user */
  UTILIZED = 'utilized',
  /** Benefit has expired and is no longer available */
  EXPIRED = 'expired',
  /** Benefit is in a pending state awaiting approval or activation */
  PENDING = 'pending',
  /** Benefit has been redeemed for a reward */
  REDEEMED = 'redeemed',
}

/**
 * DTO for benefit value information, including amount and currency.
 * 
 * This is used to represent monetary values associated with benefits,
 * such as discounts, reimbursements, or reward values.
 */
export class BenefitValueDto {
  /**
   * The numeric amount of the benefit value
   * Must be a positive number
   */
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must be a number with at most 2 decimal places' })
  @IsPositive({ message: 'Amount must be a positive number' })
  amount: number;

  /**
   * The currency code in ISO 4217 format (e.g., USD, BRL, EUR)
   * Must be a 3-character string
   */
  @IsString({ message: 'Currency must be a string' })
  @IsNotEmpty({ message: 'Currency is required' })
  @MaxLength(3, { message: 'Currency must be a 3-character ISO code' })
  currency: string;
}

/**
 * Base DTO for all benefit events, containing common properties.
 * 
 * This serves as the foundation for all benefit-specific event DTOs,
 * providing the shared properties that all benefit events must have.
 */
export class BaseBenefitEventDto {
  /**
   * Unique identifier for the benefit
   */
  @IsUUID(4, { message: 'Benefit ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Benefit ID is required' })
  benefitId: string;

  /**
   * Human-readable name of the benefit
   */
  @IsString({ message: 'Benefit name must be a string' })
  @IsNotEmpty({ message: 'Benefit name is required' })
  @MaxLength(100, { message: 'Benefit name cannot exceed 100 characters' })
  benefitName: string;

  /**
   * Category of the benefit
   */
  @IsEnum(BenefitCategory, { message: 'Invalid benefit category' })
  category: BenefitCategory;

  /**
   * Monetary value of the benefit, if applicable
   */
  @IsOptional()
  @ValidateNested({ message: 'Invalid benefit value format' })
  @Type(() => BenefitValueDto)
  value?: BenefitValueDto;

  /**
   * Detailed description of the benefit
   */
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  /**
   * Date when the benefit expires, if applicable
   */
  @IsOptional()
  @IsISO8601({}, { message: 'Expiration date must be a valid ISO 8601 date string' })
  expirationDate?: string;
}

/**
 * DTO for benefit utilization events, tracking when a user utilizes a benefit.
 * 
 * This event is triggered when a user makes use of a benefit provided by their plan.
 * It tracks utilization counts and remaining utilizations for benefits with usage limits.
 */
export class BenefitUtilizationEventDto extends BaseBenefitEventDto {
  /**
   * Number of times the benefit has been utilized in this event
   * Usually 1, but can be more for bulk utilizations
   */
  @IsNumber({}, { message: 'Utilization count must be a number' })
  @Min(1, { message: 'Utilization count must be at least 1' })
  utilizationCount: number;

  /**
   * Number of utilizations remaining after this event
   * Required if the benefit has a usage limit
   */
  @IsOptional()
  @IsNumber({}, { message: 'Remaining utilizations must be a number' })
  @Min(0, { message: 'Remaining utilizations cannot be negative' })
  remainingUtilizations?: number;

  /**
   * Maximum number of times the benefit can be utilized
   * Optional for unlimited benefits
   */
  @IsOptional()
  @IsNumber({}, { message: 'Maximum utilizations must be a number' })
  @Min(1, { message: 'Maximum utilizations must be at least 1' })
  maxUtilizations?: number;

  /**
   * Date and time when the utilization occurred
   */
  @IsISO8601({}, { message: 'Utilization date must be a valid ISO 8601 date string' })
  utilizationDate: string;

  /**
   * Additional details about the utilization
   * Can include service provider, location, or other context
   */
  @IsOptional()
  @IsObject({ message: 'Utilization details must be an object' })
  utilizationDetails?: Record<string, any>;
}

/**
 * DTO for benefit redemption events, tracking when a user redeems a benefit.
 * 
 * This event is triggered when a user exchanges or redeems a benefit for a reward
 * or service. It tracks the value redeemed and redemption details.
 */
export class BenefitRedemptionEventDto extends BaseBenefitEventDto {
  /**
   * Monetary value that was redeemed
   */
  @IsNotEmpty({ message: 'Redeemed value is required' })
  @ValidateNested({ message: 'Invalid redeemed value format' })
  @Type(() => BenefitValueDto)
  redeemedValue: BenefitValueDto;

  /**
   * Unique code associated with the redemption, if applicable
   */
  @IsOptional()
  @IsString({ message: 'Redemption code must be a string' })
  @MaxLength(100, { message: 'Redemption code cannot exceed 100 characters' })
  redemptionCode?: string;

  /**
   * Date and time when the redemption occurred
   */
  @IsISO8601({}, { message: 'Redemption date must be a valid ISO 8601 date string' })
  redemptionDate: string;

  /**
   * Additional details about the redemption
   * Can include reward information, delivery details, etc.
   */
  @IsOptional()
  @IsObject({ message: 'Redemption details must be an object' })
  redemptionDetails?: Record<string, any>;
}

/**
 * DTO for benefit status change events, tracking when a benefit's status changes.
 * 
 * This event is triggered when a benefit transitions from one status to another,
 * such as from AVAILABLE to UTILIZED or from UTILIZED to REDEEMED.
 */
export class BenefitStatusChangeEventDto extends BaseBenefitEventDto {
  /**
   * Status of the benefit before the change
   */
  @IsEnum(BenefitStatus, { message: 'Invalid previous status' })
  previousStatus: BenefitStatus;

  /**
   * Status of the benefit after the change
   */
  @IsEnum(BenefitStatus, { message: 'Invalid new status' })
  newStatus: BenefitStatus;

  /**
   * Date and time when the status change occurred
   */
  @IsISO8601({}, { message: 'Status change date must be a valid ISO 8601 date string' })
  statusChangeDate: string;

  /**
   * Reason for the status change
   */
  @IsOptional()
  @IsString({ message: 'Status change reason must be a string' })
  @MaxLength(500, { message: 'Status change reason cannot exceed 500 characters' })
  statusChangeReason?: string;

  /**
   * Validates that the status transition is valid
   * For example, a benefit cannot go from EXPIRED back to AVAILABLE
   */
  @ValidateIf((o) => o.previousStatus !== undefined && o.newStatus !== undefined)
  validateStatusTransition() {
    // Invalid transitions
    const invalidTransitions = {
      [BenefitStatus.EXPIRED]: [BenefitStatus.AVAILABLE, BenefitStatus.PENDING],
      [BenefitStatus.REDEEMED]: [BenefitStatus.AVAILABLE, BenefitStatus.PENDING, BenefitStatus.UTILIZED],
    };

    if (
      invalidTransitions[this.previousStatus] &&
      invalidTransitions[this.previousStatus].includes(this.newStatus)
    ) {
      return false;
    }

    return true;
  }
}

/**
 * Main DTO for benefit events in the Plan journey.
 * This DTO specializes in validating and structuring benefit events
 * (benefit utilization, redemption, status changes).
 * 
 * It ensures proper structure for benefit usage data, including benefit type,
 * utilization details, and redemption information. It enables gamification
 * of benefit utilization and supports benefit-related notifications.
 */
export class BenefitEventDto {
  /**
   * Type of benefit event
   */
  @IsEnum(BenefitEventType, { message: 'Invalid benefit event type' })
  eventType: BenefitEventType;

  /**
   * ID of the user who performed the benefit action
   */
  @IsUUID(4, { message: 'User ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  /**
   * ID of the plan associated with the benefit
   */
  @IsUUID(4, { message: 'Plan ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Plan ID is required' })
  planId: string;

  /**
   * Timestamp when the event occurred
   */
  @IsISO8601({}, { message: 'Timestamp must be a valid ISO 8601 date string' })
  timestamp: string;

  /**
   * Event payload containing the specific benefit event details
   * The type of payload depends on the eventType
   */
  @ValidateNested({ message: 'Invalid payload format' })
  @Type(() => BaseBenefitEventDto, {
    discriminator: {
      property: 'eventType',
      subTypes: [
        { value: BenefitUtilizationEventDto, name: BenefitEventType.UTILIZATION },
        { value: BenefitRedemptionEventDto, name: BenefitEventType.REDEMPTION },
        { value: BenefitStatusChangeEventDto, name: BenefitEventType.STATUS_CHANGE },
      ],
    },
  })
  payload: BenefitUtilizationEventDto | BenefitRedemptionEventDto | BenefitStatusChangeEventDto;

  /**
   * Additional metadata for the event
   * Can include source system, correlation IDs, or other context
   */
  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  metadata?: Record<string, any>;

  /**
   * Validates that the payload type matches the event type
   */
  @ValidateIf((o) => o.eventType !== undefined && o.payload !== undefined)
  validatePayloadType() {
    switch (this.eventType) {
      case BenefitEventType.UTILIZATION:
        return this.payload instanceof BenefitUtilizationEventDto;
      case BenefitEventType.REDEMPTION:
        return this.payload instanceof BenefitRedemptionEventDto;
      case BenefitEventType.STATUS_CHANGE:
        return this.payload instanceof BenefitStatusChangeEventDto;
      default:
        return false;
    }
  }
}
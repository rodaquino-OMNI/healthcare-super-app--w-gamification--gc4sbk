import { Type } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsPositive,
  IsInt,
  Min,
  Max,
  ValidateNested,
  IsISO8601,
  IsObject,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsNotEmpty,
} from 'class-validator';

/**
 * Enum defining the types of benefit events that can be processed
 * by the gamification engine from the Plan journey.
 */
export enum BenefitEventType {
  BENEFIT_UTILIZED = 'benefit.utilized',
  BENEFIT_REDEEMED = 'benefit.redeemed',
  BENEFIT_STATUS_CHANGED = 'benefit.status_changed',
}

/**
 * Enum defining the possible categories of benefits in the Plan journey.
 * Used for categorizing benefits for reporting and gamification purposes.
 */
export enum BenefitCategory {
  MEDICAL = 'medical',
  DENTAL = 'dental',
  VISION = 'vision',
  WELLNESS = 'wellness',
  PHARMACY = 'pharmacy',
  MENTAL_HEALTH = 'mental_health',
  PREVENTIVE = 'preventive',
  SPECIALTY = 'specialty',
  EMERGENCY = 'emergency',
  OTHER = 'other',
}

/**
 * Enum defining the possible status values for a benefit.
 * Used for tracking the lifecycle of benefits in the Plan journey.
 */
export enum BenefitStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

/**
 * DTO for benefit utilization event data.
 * Used when a user utilizes a benefit from their insurance plan.
 * Captures detailed information about the benefit usage including
 * amounts, coverage details, and remaining utilization data.
 */
export class BenefitUtilizationDto {
  @IsDefined()
  @IsUUID(4, { message: 'Benefit ID must be a valid UUID v4' })
  benefitId: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty({ message: 'Benefit name cannot be empty' })
  benefitName: string;

  @IsDefined()
  @IsEnum(BenefitCategory, { message: 'Invalid benefit category' })
  category: BenefitCategory;

  @IsDefined()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Utilization amount must be a valid number' })
  @IsPositive({ message: 'Utilization amount must be positive' })
  utilizationAmount: number;

  @IsDefined()
  @IsString()
  @IsNotEmpty({ message: 'Currency cannot be empty' })
  currency: string;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Coverage percentage must be a valid number' })
  @Min(0, { message: 'Coverage percentage must be at least 0' })
  @Max(100, { message: 'Coverage percentage cannot exceed 100' })
  @IsOptional()
  coveragePercentage?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Out of pocket amount must be a valid number' })
  @IsPositive({ message: 'Out of pocket amount must be positive' })
  @IsOptional()
  outOfPocketAmount?: number;

  @IsDefined()
  @IsISO8601({}, { message: 'Utilization date must be a valid ISO 8601 date string' })
  utilizationDate: string;

  @IsString()
  @IsOptional()
  providerName?: string;

  @IsUUID(4, { message: 'Provider ID must be a valid UUID v4' })
  @IsOptional()
  providerId?: string;

  @IsInt({ message: 'Remaining utilizations must be an integer' })
  @Min(0, { message: 'Remaining utilizations cannot be negative' })
  @IsOptional()
  remainingUtilizations?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Remaining coverage must be a valid number' })
  @Min(0, { message: 'Remaining coverage cannot be negative' })
  @IsOptional()
  remainingCoverage?: number;

  @IsBoolean({ message: 'isPreventive must be a boolean value' })
  @IsOptional()
  isPreventive?: boolean;
}

/**
 * DTO for benefit redemption event data.
 * Used when a user redeems a reward or special benefit.
 * Captures information about the redemption process including
 * redemption codes, values, and expiration details.
 */
export class BenefitRedemptionDto {
  @IsDefined()
  @IsUUID(4, { message: 'Benefit ID must be a valid UUID v4' })
  benefitId: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty({ message: 'Benefit name cannot be empty' })
  benefitName: string;

  @IsDefined()
  @IsEnum(BenefitCategory, { message: 'Invalid benefit category' })
  category: BenefitCategory;

  @IsDefined()
  @IsString()
  @IsNotEmpty({ message: 'Redemption code cannot be empty' })
  redemptionCode: string;

  @IsDefined()
  @IsISO8601({}, { message: 'Redemption date must be a valid ISO 8601 date string' })
  redemptionDate: string;

  @IsDefined()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Redemption value must be a valid number' })
  @IsPositive({ message: 'Redemption value must be positive' })
  redemptionValue: number;

  @IsDefined()
  @IsString()
  @IsNotEmpty({ message: 'Currency cannot be empty' })
  currency: string;

  @IsBoolean({ message: 'isOneTime must be a boolean value' })
  @IsOptional()
  isOneTime?: boolean;

  @IsISO8601({}, { message: 'Expiration date must be a valid ISO 8601 date string' })
  @IsOptional()
  expirationDate?: string;

  @IsObject({ message: 'Redemption details must be an object' })
  @IsOptional()
  redemptionDetails?: Record<string, any>;
}

/**
 * DTO for benefit status change event data.
 * Used when a benefit's status changes (e.g., activated, expired).
 * Tracks the lifecycle of benefits with previous and new status values,
 * along with reasons and effective dates for the changes.
 */
export class BenefitStatusChangeDto {
  @IsDefined()
  @IsUUID(4, { message: 'Benefit ID must be a valid UUID v4' })
  benefitId: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty({ message: 'Benefit name cannot be empty' })
  benefitName: string;

  @IsDefined()
  @IsEnum(BenefitCategory, { message: 'Invalid benefit category' })
  category: BenefitCategory;

  @IsDefined()
  @IsEnum(BenefitStatus, { message: 'Invalid previous status' })
  previousStatus: BenefitStatus;

  @IsDefined()
  @IsEnum(BenefitStatus, { message: 'Invalid new status' })
  newStatus: BenefitStatus;

  @IsDefined()
  @IsISO8601({}, { message: 'Status change date must be a valid ISO 8601 date string' })
  statusChangeDate: string;

  @IsString()
  @IsOptional()
  statusChangeReason?: string;

  @IsISO8601({}, { message: 'Effective date must be a valid ISO 8601 date string' })
  @IsOptional()
  effectiveDate?: string;

  @IsISO8601({}, { message: 'Expiration date must be a valid ISO 8601 date string' })
  @IsOptional()
  expirationDate?: string;
}

/**
 * Base DTO for all benefit events.
 * Contains common properties and validation rules for benefit events
 * including plan and member identification information.
 */
export class BaseBenefitEventDto {
  @IsDefined()
  @IsUUID(4, { message: 'Plan ID must be a valid UUID v4' })
  planId: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty({ message: 'Plan name cannot be empty' })
  planName: string;

  @IsDefined()
  @IsUUID(4, { message: 'Member ID must be a valid UUID v4' })
  memberId: string;

  @IsString()
  @IsOptional()
  memberName?: string;

  @IsString()
  @IsOptional()
  memberNumber?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];
}

/**
 * DTO for benefit utilization events.
 * Used when a user utilizes a benefit from their insurance plan.
 * Extends the base benefit event with utilization-specific data.
 */
export class BenefitUtilizedEventDto extends BaseBenefitEventDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => BenefitUtilizationDto)
  utilization: BenefitUtilizationDto;
}

/**
 * DTO for benefit redemption events.
 * Used when a user redeems a reward or special benefit.
 * Extends the base benefit event with redemption-specific data.
 */
export class BenefitRedeemedEventDto extends BaseBenefitEventDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => BenefitRedemptionDto)
  redemption: BenefitRedemptionDto;
}

/**
 * DTO for benefit status change events.
 * Used when a benefit's status changes (e.g., activated, expired).
 * Extends the base benefit event with status change-specific data.
 */
export class BenefitStatusChangedEventDto extends BaseBenefitEventDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => BenefitStatusChangeDto)
  statusChange: BenefitStatusChangeDto;
}

/**
 * Main DTO for benefit events.
 * Provides a unified interface for all benefit-related events in the Plan journey.
 * Supports benefit utilization, redemption, and status change events with
 * dynamic type discrimination based on the event type.
 * 
 * This DTO is used by the gamification engine to process benefit-related events
 * and award appropriate achievements, points, and rewards based on benefit usage patterns.
 */
export class BenefitEventDto {
  @IsDefined()
  @IsEnum(BenefitEventType, { message: 'Invalid benefit event type' })
  eventType: BenefitEventType;

  @IsDefined()
  @ValidateNested()
  @Type((options) => {
    if (options?.object?.eventType === BenefitEventType.BENEFIT_UTILIZED) {
      return BenefitUtilizedEventDto;
    } else if (options?.object?.eventType === BenefitEventType.BENEFIT_REDEEMED) {
      return BenefitRedeemedEventDto;
    } else if (options?.object?.eventType === BenefitEventType.BENEFIT_STATUS_CHANGED) {
      return BenefitStatusChangedEventDto;
    }
    return BaseBenefitEventDto;
  })
  data: BenefitUtilizedEventDto | BenefitRedeemedEventDto | BenefitStatusChangedEventDto;
}
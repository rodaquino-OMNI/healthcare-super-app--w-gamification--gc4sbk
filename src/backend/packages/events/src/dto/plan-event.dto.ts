import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsNumber, IsEnum, IsBoolean, IsDate, IsISO8601, ValidateNested, Min, Max, IsArray, ArrayMinSize, ArrayMaxSize, IsPositive, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum for plan event types in the AUSTA SuperApp.
 * These event types are specific to the Plan journey and are used
 * for gamification and notification purposes.
 */
export enum PlanEventType {
  // Claim related events
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  CLAIM_UPDATED = 'CLAIM_UPDATED',
  CLAIM_DOCUMENT_UPLOADED = 'CLAIM_DOCUMENT_UPLOADED',
  
  // Benefit related events
  BENEFIT_UTILIZED = 'BENEFIT_UTILIZED',
  BENEFIT_REDEEMED = 'BENEFIT_REDEEMED',
  BENEFIT_EXPIRED = 'BENEFIT_EXPIRED',
  
  // Plan selection/comparison events
  PLAN_VIEWED = 'PLAN_VIEWED',
  PLAN_COMPARED = 'PLAN_COMPARED',
  PLAN_SELECTED = 'PLAN_SELECTED',
  PLAN_CHANGED = 'PLAN_CHANGED',
  
  // Reward related events
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  REWARD_EARNED = 'REWARD_EARNED'
}

/**
 * Enum for claim types in the AUSTA SuperApp.
 */
export enum ClaimType {
  MEDICAL = 'MEDICAL',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  PHARMACY = 'PHARMACY',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  PHYSICAL_THERAPY = 'PHYSICAL_THERAPY',
  OTHER = 'OTHER'
}

/**
 * Enum for benefit types in the AUSTA SuperApp.
 */
export enum BenefitType {
  PREVENTIVE_CARE = 'PREVENTIVE_CARE',
  SPECIALIST_VISIT = 'SPECIALIST_VISIT',
  EMERGENCY = 'EMERGENCY',
  HOSPITALIZATION = 'HOSPITALIZATION',
  PRESCRIPTION = 'PRESCRIPTION',
  WELLNESS = 'WELLNESS',
  TELEMEDICINE = 'TELEMEDICINE',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  OTHER = 'OTHER'
}

/**
 * Enum for currency types in the AUSTA SuperApp.
 */
export enum CurrencyType {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR'
}

/**
 * Base DTO for all plan journey events in the AUSTA SuperApp.
 * This class extends the ProcessEventDto with plan-specific properties.
 */
export class PlanEventDto {
  /**
   * The type of the plan event.
   * Must be one of the predefined plan event types.
   */
  @IsNotEmpty()
  @IsEnum(PlanEventType, {
    message: 'Event type must be a valid plan event type'
  })
  type: PlanEventType;

  /**
   * The ID of the user associated with the event.
   * This must be a valid UUID and identify a registered user in the system.
   */
  @IsNotEmpty()
  @IsUUID(4, {
    message: 'User ID must be a valid UUID v4'
  })
  userId: string;

  /**
   * The journey associated with the event.
   * For plan events, this should always be 'plan'.
   */
  @IsNotEmpty()
  @IsString()
  journey: string = 'plan';

  /**
   * The timestamp when the event occurred.
   * Must be a valid ISO 8601 date string.
   */
  @IsNotEmpty()
  @IsISO8601()
  timestamp: string;

  /**
   * The data associated with the event.
   * This contains plan-specific details about the event.
   */
  @IsNotEmpty()
  @IsObject()
  data: object;
}

/**
 * DTO for claim submission events in the AUSTA SuperApp.
 * This class provides validation for claim submission data.
 */
export class ClaimSubmissionEventDto extends PlanEventDto {
  /**
   * Override the type property to ensure it's always CLAIM_SUBMITTED.
   */
  @IsNotEmpty()
  @IsEnum(PlanEventType, {
    message: 'Event type must be CLAIM_SUBMITTED'
  })
  type: PlanEventType.CLAIM_SUBMITTED;

  /**
   * The data associated with the claim submission event.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ClaimSubmissionData)
  data: ClaimSubmissionData;
}

/**
 * Data structure for claim submission events.
 */
export class ClaimSubmissionData {
  /**
   * The unique identifier for the claim.
   */
  @IsNotEmpty()
  @IsUUID(4, {
    message: 'Claim ID must be a valid UUID v4'
  })
  claimId: string;

  /**
   * The type of claim being submitted.
   */
  @IsNotEmpty()
  @IsEnum(ClaimType, {
    message: 'Claim type must be a valid claim type'
  })
  claimType: ClaimType;

  /**
   * The amount being claimed.
   */
  @IsNotEmpty()
  @IsPositive({
    message: 'Claim amount must be a positive number'
  })
  @IsDecimal({
    decimal_digits: '2',
    force_decimal: true
  }, {
    message: 'Claim amount must have exactly 2 decimal places'
  })
  amount: string;

  /**
   * The currency of the claim amount.
   */
  @IsNotEmpty()
  @IsEnum(CurrencyType, {
    message: 'Currency must be a valid currency type'
  })
  currency: CurrencyType;

  /**
   * The date of service for the claim.
   */
  @IsNotEmpty()
  @IsISO8601()
  serviceDate: string;

  /**
   * Optional description of the claim.
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Array of document IDs associated with the claim.
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10, {
    message: 'A maximum of 10 documents can be attached to a claim'
  })
  @IsUUID(4, {
    each: true,
    message: 'Each document ID must be a valid UUID v4'
  })
  documentIds?: string[];

  /**
   * The provider associated with the claim.
   */
  @IsOptional()
  @IsString()
  providerName?: string;

  /**
   * Whether the claim is being submitted for reimbursement.
   */
  @IsOptional()
  @IsBoolean()
  isReimbursement?: boolean;
}

/**
 * DTO for benefit utilization events in the AUSTA SuperApp.
 * This class provides validation for benefit utilization data.
 */
export class BenefitUtilizationEventDto extends PlanEventDto {
  /**
   * Override the type property to ensure it's always BENEFIT_UTILIZED.
   */
  @IsNotEmpty()
  @IsEnum(PlanEventType, {
    message: 'Event type must be BENEFIT_UTILIZED'
  })
  type: PlanEventType.BENEFIT_UTILIZED;

  /**
   * The data associated with the benefit utilization event.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => BenefitUtilizationData)
  data: BenefitUtilizationData;
}

/**
 * Data structure for benefit utilization events.
 */
export class BenefitUtilizationData {
  /**
   * The unique identifier for the benefit.
   */
  @IsNotEmpty()
  @IsUUID(4, {
    message: 'Benefit ID must be a valid UUID v4'
  })
  benefitId: string;

  /**
   * The type of benefit being utilized.
   */
  @IsNotEmpty()
  @IsEnum(BenefitType, {
    message: 'Benefit type must be a valid benefit type'
  })
  benefitType: BenefitType;

  /**
   * The date when the benefit was utilized.
   */
  @IsNotEmpty()
  @IsISO8601()
  utilizationDate: string;

  /**
   * The amount of the benefit utilized, if applicable.
   */
  @IsOptional()
  @IsPositive({
    message: 'Utilization amount must be a positive number'
  })
  @IsDecimal({
    decimal_digits: '2',
    force_decimal: true
  }, {
    message: 'Utilization amount must have exactly 2 decimal places'
  })
  amount?: string;

  /**
   * The currency of the benefit amount, if applicable.
   */
  @IsOptional()
  @IsEnum(CurrencyType, {
    message: 'Currency must be a valid currency type'
  })
  currency?: CurrencyType;

  /**
   * The provider associated with the benefit utilization, if applicable.
   */
  @IsOptional()
  @IsString()
  providerName?: string;

  /**
   * Optional description of the benefit utilization.
   */
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for plan selection/comparison events in the AUSTA SuperApp.
 * This class provides validation for plan selection and comparison data.
 */
export class PlanSelectionEventDto extends PlanEventDto {
  /**
   * Override the type property to ensure it's a valid plan selection event type.
   */
  @IsNotEmpty()
  @IsEnum(PlanEventType, {
    message: 'Event type must be a valid plan selection event type'
  })
  type: PlanEventType.PLAN_VIEWED | PlanEventType.PLAN_COMPARED | PlanEventType.PLAN_SELECTED | PlanEventType.PLAN_CHANGED;

  /**
   * The data associated with the plan selection event.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PlanSelectionData)
  data: PlanSelectionData;
}

/**
 * Data structure for plan selection events.
 */
export class PlanSelectionData {
  /**
   * The unique identifier for the plan.
   */
  @IsNotEmpty()
  @IsUUID(4, {
    message: 'Plan ID must be a valid UUID v4'
  })
  planId: string;

  /**
   * The name of the plan.
   */
  @IsNotEmpty()
  @IsString()
  planName: string;

  /**
   * The plan category or tier.
   */
  @IsOptional()
  @IsString()
  planCategory?: string;

  /**
   * For comparison events, the IDs of the plans being compared.
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5, {
    message: 'A maximum of 5 plans can be compared at once'
  })
  @IsUUID(4, {
    each: true,
    message: 'Each plan ID must be a valid UUID v4'
  })
  comparedPlanIds?: string[];

  /**
   * For plan change events, the ID of the previous plan.
   */
  @IsOptional()
  @IsUUID(4, {
    message: 'Previous plan ID must be a valid UUID v4'
  })
  previousPlanId?: string;

  /**
   * The monthly premium of the plan.
   */
  @IsOptional()
  @IsPositive({
    message: 'Monthly premium must be a positive number'
  })
  @IsDecimal({
    decimal_digits: '2',
    force_decimal: true
  }, {
    message: 'Monthly premium must have exactly 2 decimal places'
  })
  monthlyPremium?: string;

  /**
   * The currency of the monthly premium.
   */
  @IsOptional()
  @IsEnum(CurrencyType, {
    message: 'Currency must be a valid currency type'
  })
  currency?: CurrencyType;
}

/**
 * DTO for reward redemption events in the AUSTA SuperApp.
 * This class provides validation for reward redemption data.
 */
export class RewardRedemptionEventDto extends PlanEventDto {
  /**
   * Override the type property to ensure it's always REWARD_REDEEMED.
   */
  @IsNotEmpty()
  @IsEnum(PlanEventType, {
    message: 'Event type must be REWARD_REDEEMED'
  })
  type: PlanEventType.REWARD_REDEEMED;

  /**
   * The data associated with the reward redemption event.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RewardRedemptionData)
  data: RewardRedemptionData;
}

/**
 * Data structure for reward redemption events.
 */
export class RewardRedemptionData {
  /**
   * The unique identifier for the reward.
   */
  @IsNotEmpty()
  @IsUUID(4, {
    message: 'Reward ID must be a valid UUID v4'
  })
  rewardId: string;

  /**
   * The name of the reward.
   */
  @IsNotEmpty()
  @IsString()
  rewardName: string;

  /**
   * The category of the reward.
   */
  @IsOptional()
  @IsString()
  rewardCategory?: string;

  /**
   * The point value of the reward.
   */
  @IsNotEmpty()
  @IsNumber()
  @IsPositive({
    message: 'Point value must be a positive number'
  })
  pointValue: number;

  /**
   * The date when the reward was redeemed.
   */
  @IsNotEmpty()
  @IsISO8601()
  redemptionDate: string;

  /**
   * The expiration date of the reward, if applicable.
   */
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;

  /**
   * The redemption code for the reward, if applicable.
   */
  @IsOptional()
  @IsString()
  redemptionCode?: string;

  /**
   * Whether the reward has been used.
   */
  @IsOptional()
  @IsBoolean()
  isUsed?: boolean;
}
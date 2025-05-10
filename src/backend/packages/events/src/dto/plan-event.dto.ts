import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsNumber, IsEnum, IsBoolean, IsISO8601, IsPositive, Min, Max, ValidateNested, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Base DTO for all plan journey events in the AUSTA SuperApp.
 * This class extends the core ProcessEventDto with plan-specific validation.
 */
export class BasePlanEventDto {
  /**
   * The type of the event.
   * Examples: 
   * - 'CLAIM_SUBMITTED' - User submitted an insurance claim
   * - 'BENEFIT_UTILIZED' - User utilized a plan benefit
   * - 'PLAN_SELECTED' - User selected an insurance plan
   * - 'REWARD_REDEEMED' - User redeemed a reward
   */
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * The ID of the user associated with the event.
   * This must be a valid UUID and identify a registered user in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * The data associated with the event.
   * This contains plan journey-specific details about the event.
   */
  @IsNotEmpty()
  @IsObject()
  data: object;

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
}

/**
 * Enum representing the possible claim types in the Plan journey.
 */
export enum ClaimType {
  MEDICAL = 'medical',
  DENTAL = 'dental',
  VISION = 'vision',
  PHARMACY = 'pharmacy',
  WELLNESS = 'wellness',
  OTHER = 'other'
}

/**
 * Enum representing the possible claim statuses in the Plan journey.
 */
export enum ClaimStatus {
  SUBMITTED = 'submitted',
  VALIDATING = 'validating',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  UNDER_REVIEW = 'under_review',
  ADDITIONAL_INFO_REQUIRED = 'additional_info_required',
  APPROVED = 'approved',
  DENIED = 'denied',
  PAYMENT_PENDING = 'payment_pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * DTO for claim submission events in the Plan journey.
 * This event is triggered when a user submits a new insurance claim.
 */
export class ClaimSubmittedEventDto extends BasePlanEventDto {
  @ValidateNested()
  @Type(() => ClaimSubmittedEventData)
  declare data: ClaimSubmittedEventData;
}

/**
 * Data structure for claim submission events.
 */
export class ClaimSubmittedEventData {
  /**
   * The ID of the claim that was submitted.
   */
  @IsNotEmpty()
  @IsUUID()
  claimId: string;

  /**
   * The type of claim that was submitted.
   */
  @IsNotEmpty()
  @IsEnum(ClaimType)
  claimType: ClaimType;

  /**
   * The amount of the claim in the specified currency.
   */
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  /**
   * The currency of the claim amount (e.g., 'BRL', 'USD').
   */
  @IsNotEmpty()
  @IsString()
  currency: string;

  /**
   * The ID of the plan associated with the claim.
   */
  @IsNotEmpty()
  @IsUUID()
  planId: string;

  /**
   * The number of documents attached to the claim.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  documentCount: number;

  /**
   * Optional description or notes for the claim.
   */
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for claim status update events in the Plan journey.
 * This event is triggered when the status of a claim changes.
 */
export class ClaimStatusUpdatedEventDto extends BasePlanEventDto {
  @ValidateNested()
  @Type(() => ClaimStatusUpdatedEventData)
  declare data: ClaimStatusUpdatedEventData;
}

/**
 * Data structure for claim status update events.
 */
export class ClaimStatusUpdatedEventData {
  /**
   * The ID of the claim whose status was updated.
   */
  @IsNotEmpty()
  @IsUUID()
  claimId: string;

  /**
   * The previous status of the claim.
   */
  @IsNotEmpty()
  @IsEnum(ClaimStatus)
  previousStatus: ClaimStatus;

  /**
   * The new status of the claim.
   */
  @IsNotEmpty()
  @IsEnum(ClaimStatus)
  newStatus: ClaimStatus;

  /**
   * The timestamp when the status was updated.
   */
  @IsNotEmpty()
  @IsISO8601()
  updatedAt: string;

  /**
   * Optional reason for the status update.
   */
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Enum representing the possible benefit types in the Plan journey.
 */
export enum BenefitType {
  PREVENTIVE_CARE = 'preventive_care',
  SPECIALIST_VISIT = 'specialist_visit',
  HOSPITALIZATION = 'hospitalization',
  EMERGENCY = 'emergency',
  MATERNITY = 'maternity',
  MENTAL_HEALTH = 'mental_health',
  PHYSICAL_THERAPY = 'physical_therapy',
  PRESCRIPTION = 'prescription',
  DENTAL_CARE = 'dental_care',
  VISION_CARE = 'vision_care',
  WELLNESS_PROGRAM = 'wellness_program',
  TELEMEDICINE = 'telemedicine',
  OTHER = 'other'
}

/**
 * DTO for benefit utilization events in the Plan journey.
 * This event is triggered when a user utilizes a benefit from their plan.
 */
export class BenefitUtilizedEventDto extends BasePlanEventDto {
  @ValidateNested()
  @Type(() => BenefitUtilizedEventData)
  declare data: BenefitUtilizedEventData;
}

/**
 * Data structure for benefit utilization events.
 */
export class BenefitUtilizedEventData {
  /**
   * The ID of the benefit that was utilized.
   */
  @IsNotEmpty()
  @IsUUID()
  benefitId: string;

  /**
   * The type of benefit that was utilized.
   */
  @IsNotEmpty()
  @IsEnum(BenefitType)
  benefitType: BenefitType;

  /**
   * The ID of the plan associated with the benefit.
   */
  @IsNotEmpty()
  @IsUUID()
  planId: string;

  /**
   * The monetary value of the benefit utilized, if applicable.
   */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  value?: number;

  /**
   * The currency of the benefit value (e.g., 'BRL', 'USD').
   */
  @IsOptional()
  @IsString()
  currency?: string;

  /**
   * The location where the benefit was utilized, if applicable.
   */
  @IsOptional()
  @IsString()
  location?: string;

  /**
   * The provider who delivered the benefit, if applicable.
   */
  @IsOptional()
  @IsString()
  provider?: string;
}

/**
 * DTO for plan selection events in the Plan journey.
 * This event is triggered when a user selects or changes their insurance plan.
 */
export class PlanSelectedEventDto extends BasePlanEventDto {
  @ValidateNested()
  @Type(() => PlanSelectedEventData)
  declare data: PlanSelectedEventData;
}

/**
 * Data structure for plan selection events.
 */
export class PlanSelectedEventData {
  /**
   * The ID of the plan that was selected.
   */
  @IsNotEmpty()
  @IsUUID()
  planId: string;

  /**
   * The name of the plan that was selected.
   */
  @IsNotEmpty()
  @IsString()
  planName: string;

  /**
   * The ID of the previous plan, if the user was switching plans.
   */
  @IsOptional()
  @IsUUID()
  previousPlanId?: string;

  /**
   * The effective start date of the plan.
   */
  @IsNotEmpty()
  @IsISO8601()
  effectiveDate: string;

  /**
   * The monthly premium amount for the plan.
   */
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  premium: number;

  /**
   * The currency of the premium amount (e.g., 'BRL', 'USD').
   */
  @IsNotEmpty()
  @IsString()
  currency: string;

  /**
   * Whether this is the user's first plan selection.
   */
  @IsNotEmpty()
  @IsBoolean()
  isFirstPlan: boolean;
}

/**
 * DTO for plan comparison events in the Plan journey.
 * This event is triggered when a user compares multiple insurance plans.
 */
export class PlanComparedEventDto extends BasePlanEventDto {
  @ValidateNested()
  @Type(() => PlanComparedEventData)
  declare data: PlanComparedEventData;
}

/**
 * Data structure for plan comparison events.
 */
export class PlanComparedEventData {
  /**
   * The IDs of the plans that were compared.
   */
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsUUID(undefined, { each: true })
  planIds: string[];

  /**
   * The criteria used for comparison (e.g., 'price', 'coverage', 'benefits').
   */
  @IsArray()
  @IsString({ each: true })
  comparisonCriteria: string[];

  /**
   * The duration of the comparison session in seconds.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  /**
   * Whether the user selected a plan after comparison.
   */
  @IsOptional()
  @IsBoolean()
  resultedInSelection?: boolean;

  /**
   * The ID of the plan selected after comparison, if any.
   */
  @IsOptional()
  @IsUUID()
  selectedPlanId?: string;
}

/**
 * DTO for reward redemption events in the Plan journey.
 * This event is triggered when a user redeems a reward associated with their plan.
 */
export class RewardRedeemedEventDto extends BasePlanEventDto {
  @ValidateNested()
  @Type(() => RewardRedeemedEventData)
  declare data: RewardRedeemedEventData;
}

/**
 * Data structure for reward redemption events.
 */
export class RewardRedeemedEventData {
  /**
   * The ID of the reward that was redeemed.
   */
  @IsNotEmpty()
  @IsUUID()
  rewardId: string;

  /**
   * The name of the reward that was redeemed.
   */
  @IsNotEmpty()
  @IsString()
  rewardName: string;

  /**
   * The ID of the plan associated with the reward.
   */
  @IsNotEmpty()
  @IsUUID()
  planId: string;

  /**
   * The point cost of the reward.
   */
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  pointCost: number;

  /**
   * The monetary value of the reward, if applicable.
   */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  monetaryValue?: number;

  /**
   * The currency of the monetary value (e.g., 'BRL', 'USD').
   */
  @IsOptional()
  @IsString()
  currency?: string;

  /**
   * The redemption code or identifier, if applicable.
   */
  @IsOptional()
  @IsString()
  redemptionCode?: string;

  /**
   * The expiration date of the redeemed reward, if applicable.
   */
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;
}
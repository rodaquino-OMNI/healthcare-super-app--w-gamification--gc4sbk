import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsNumber, IsEnum, IsBoolean, IsISO8601, IsArray, ValidateNested, Min, Max, IsPositive, IsDecimal, Length, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from './base-event.dto';

/**
 * Enum for claim status values
 */
export enum ClaimStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING_INFORMATION = 'pending_information',
  PAID = 'paid',
  APPEALED = 'appealed'
}

/**
 * Enum for claim types
 */
export enum ClaimType {
  MEDICAL = 'medical',
  DENTAL = 'dental',
  VISION = 'vision',
  PHARMACY = 'pharmacy',
  MENTAL_HEALTH = 'mental_health',
  WELLNESS = 'wellness',
  OTHER = 'other'
}

/**
 * Enum for benefit types
 */
export enum BenefitType {
  PREVENTIVE_CARE = 'preventive_care',
  SPECIALIST_VISIT = 'specialist_visit',
  EMERGENCY = 'emergency',
  HOSPITALIZATION = 'hospitalization',
  PRESCRIPTION = 'prescription',
  DENTAL = 'dental',
  VISION = 'vision',
  MENTAL_HEALTH = 'mental_health',
  WELLNESS = 'wellness',
  TELEMEDICINE = 'telemedicine',
  OTHER = 'other'
}

/**
 * Enum for plan types
 */
export enum PlanType {
  HMO = 'hmo',
  PPO = 'ppo',
  EPO = 'epo',
  POS = 'pos',
  HDHP = 'hdhp',
  CATASTROPHIC = 'catastrophic'
}

/**
 * DTO for currency amount with validation
 */
export class CurrencyAmountDto {
  /**
   * The numeric amount
   * @example 150.75
   */
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })
  @IsPositive()
  amount: string;

  /**
   * The currency code (ISO 4217)
   * @example "BRL"
   */
  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  currency: string;
}

/**
 * DTO for document reference with validation
 */
export class DocumentReferenceDto {
  /**
   * The document ID
   * @example "doc_12345"
   */
  @IsNotEmpty()
  @IsString()
  id: string;

  /**
   * The document type
   * @example "receipt"
   */
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * The document URL (optional)
   * @example "https://storage.example.com/documents/receipt_12345.pdf"
   */
  @IsOptional()
  @IsString()
  url?: string;
}

/**
 * Base DTO for plan journey events
 */
export class PlanEventDto extends ProcessEventDto {
  /**
   * The journey identifier - always 'plan' for plan journey events
   */
  @IsNotEmpty()
  @IsString()
  journey: string = 'plan';
}

/**
 * DTO for claim submission events
 */
export class ClaimSubmissionEventDto extends PlanEventDto {
  /**
   * The data associated with the claim submission event
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => ClaimSubmissionDataDto)
  data: ClaimSubmissionDataDto;
}

/**
 * DTO for claim submission event data
 */
export class ClaimSubmissionDataDto {
  /**
   * The claim ID
   * @example "claim_12345"
   */
  @IsNotEmpty()
  @IsString()
  claimId: string;

  /**
   * The claim type
   * @example "medical"
   */
  @IsNotEmpty()
  @IsEnum(ClaimType)
  claimType: ClaimType;

  /**
   * The claim amount
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CurrencyAmountDto)
  amount: CurrencyAmountDto;

  /**
   * The service date
   * @example "2023-05-15T14:30:00Z"
   */
  @IsNotEmpty()
  @IsISO8601()
  serviceDate: string;

  /**
   * The provider ID
   * @example "provider_789"
   */
  @IsNotEmpty()
  @IsString()
  providerId: string;

  /**
   * The provider name
   * @example "Clínica São Paulo"
   */
  @IsNotEmpty()
  @IsString()
  providerName: string;

  /**
   * The claim description
   * @example "Annual physical examination"
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * The supporting documents
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentReferenceDto)
  documents?: DocumentReferenceDto[];
}

/**
 * DTO for claim status update events
 */
export class ClaimStatusUpdateEventDto extends PlanEventDto {
  /**
   * The data associated with the claim status update event
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => ClaimStatusUpdateDataDto)
  data: ClaimStatusUpdateDataDto;
}

/**
 * DTO for claim status update event data
 */
export class ClaimStatusUpdateDataDto {
  /**
   * The claim ID
   * @example "claim_12345"
   */
  @IsNotEmpty()
  @IsString()
  claimId: string;

  /**
   * The previous claim status
   * @example "submitted"
   */
  @IsNotEmpty()
  @IsEnum(ClaimStatus)
  previousStatus: ClaimStatus;

  /**
   * The new claim status
   * @example "approved"
   */
  @IsNotEmpty()
  @IsEnum(ClaimStatus)
  newStatus: ClaimStatus;

  /**
   * The status update timestamp
   * @example "2023-05-20T10:15:00Z"
   */
  @IsNotEmpty()
  @IsISO8601()
  updateTimestamp: string;

  /**
   * The status update reason
   * @example "All documentation verified"
   */
  @IsOptional()
  @IsString()
  reason?: string;

  /**
   * The approved amount (only for approved claims)
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => CurrencyAmountDto)
  approvedAmount?: CurrencyAmountDto;
}

/**
 * DTO for benefit utilization events
 */
export class BenefitUtilizationEventDto extends PlanEventDto {
  /**
   * The data associated with the benefit utilization event
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => BenefitUtilizationDataDto)
  data: BenefitUtilizationDataDto;
}

/**
 * DTO for benefit utilization event data
 */
export class BenefitUtilizationDataDto {
  /**
   * The benefit ID
   * @example "benefit_456"
   */
  @IsNotEmpty()
  @IsString()
  benefitId: string;

  /**
   * The benefit type
   * @example "preventive_care"
   */
  @IsNotEmpty()
  @IsEnum(BenefitType)
  benefitType: BenefitType;

  /**
   * The benefit name
   * @example "Annual Preventive Check-up"
   */
  @IsNotEmpty()
  @IsString()
  benefitName: string;

  /**
   * The utilization date
   * @example "2023-06-10T09:00:00Z"
   */
  @IsNotEmpty()
  @IsISO8601()
  utilizationDate: string;

  /**
   * The provider ID
   * @example "provider_789"
   */
  @IsOptional()
  @IsString()
  providerId?: string;

  /**
   * The provider name
   * @example "Clínica São Paulo"
   */
  @IsOptional()
  @IsString()
  providerName?: string;

  /**
   * The benefit value
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => CurrencyAmountDto)
  value?: CurrencyAmountDto;

  /**
   * Whether this is the first time utilizing this benefit
   * @example true
   */
  @IsOptional()
  @IsBoolean()
  isFirstUtilization?: boolean;

  /**
   * The remaining utilizations for this benefit (if applicable)
   * @example 2
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingUtilizations?: number;
}

/**
 * DTO for plan selection events
 */
export class PlanSelectionEventDto extends PlanEventDto {
  /**
   * The data associated with the plan selection event
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PlanSelectionDataDto)
  data: PlanSelectionDataDto;
}

/**
 * DTO for plan selection event data
 */
export class PlanSelectionDataDto {
  /**
   * The selected plan ID
   * @example "plan_789"
   */
  @IsNotEmpty()
  @IsString()
  planId: string;

  /**
   * The plan type
   * @example "ppo"
   */
  @IsNotEmpty()
  @IsEnum(PlanType)
  planType: PlanType;

  /**
   * The plan name
   * @example "AUSTA Premium Family Plan"
   */
  @IsNotEmpty()
  @IsString()
  planName: string;

  /**
   * The selection date
   * @example "2023-07-01T00:00:00Z"
   */
  @IsNotEmpty()
  @IsISO8601()
  selectionDate: string;

  /**
   * The effective date
   * @example "2023-08-01T00:00:00Z"
   */
  @IsNotEmpty()
  @IsISO8601()
  effectiveDate: string;

  /**
   * The previous plan ID (if switching plans)
   * @example "plan_456"
   */
  @IsOptional()
  @IsString()
  previousPlanId?: string;

  /**
   * The monthly premium amount
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CurrencyAmountDto)
  premium: CurrencyAmountDto;

  /**
   * The selected coverage level
   * @example "family"
   */
  @IsNotEmpty()
  @IsString()
  coverageLevel: string;

  /**
   * The number of dependents covered
   * @example 3
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  dependentCount?: number;
}

/**
 * DTO for plan comparison events
 */
export class PlanComparisonEventDto extends PlanEventDto {
  /**
   * The data associated with the plan comparison event
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PlanComparisonDataDto)
  data: PlanComparisonDataDto;
}

/**
 * DTO for plan comparison event data
 */
export class PlanComparisonDataDto {
  /**
   * The IDs of the compared plans
   * @example ["plan_123", "plan_456", "plan_789"]
   */
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  planIds: string[];

  /**
   * The comparison date
   * @example "2023-06-15T14:30:00Z"
   */
  @IsNotEmpty()
  @IsISO8601()
  comparisonDate: string;

  /**
   * The comparison criteria
   * @example ["premium", "deductible", "coverage"]
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  criteria?: string[];

  /**
   * The selected plan ID (if a plan was selected after comparison)
   * @example "plan_456"
   */
  @IsOptional()
  @IsString()
  selectedPlanId?: string;

  /**
   * The comparison session duration in seconds
   * @example 300
   */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  sessionDuration?: number;
}

/**
 * DTO for reward redemption events
 */
export class RewardRedemptionEventDto extends PlanEventDto {
  /**
   * The data associated with the reward redemption event
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => RewardRedemptionDataDto)
  data: RewardRedemptionDataDto;
}

/**
 * DTO for reward redemption event data
 */
export class RewardRedemptionDataDto {
  /**
   * The reward ID
   * @example "reward_123"
   */
  @IsNotEmpty()
  @IsString()
  rewardId: string;

  /**
   * The reward name
   * @example "Premium Plan Discount"
   */
  @IsNotEmpty()
  @IsString()
  rewardName: string;

  /**
   * The redemption date
   * @example "2023-07-15T10:00:00Z"
   */
  @IsNotEmpty()
  @IsISO8601()
  redemptionDate: string;

  /**
   * The points spent
   * @example 500
   */
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  pointsSpent: number;

  /**
   * The reward value
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => CurrencyAmountDto)
  value?: CurrencyAmountDto;

  /**
   * The reward category
   * @example "premium_discount"
   */
  @IsNotEmpty()
  @IsString()
  category: string;

  /**
   * The expiration date (if applicable)
   * @example "2023-10-15T23:59:59Z"
   */
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;

  /**
   * Whether the reward has been applied
   * @example true
   */
  @IsOptional()
  @IsBoolean()
  isApplied?: boolean;
}
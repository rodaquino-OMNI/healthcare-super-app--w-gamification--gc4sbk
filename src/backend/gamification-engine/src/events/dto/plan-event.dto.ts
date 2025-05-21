import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanEventType } from '../interfaces/journey-events.interface';
import { IClaim, IBenefit } from '@austa/interfaces/journey/plan';

/**
 * Data transfer object for Plan Journey specific events.
 * This DTO extends the base event structure with plan-specific properties and validation.
 * It handles events like CLAIM_SUBMITTED, BENEFIT_UTILIZED, and PLAN_SELECTED.
 */
export class PlanEventDto {
  /**
   * The type of the plan event.
   * Must be one of the predefined plan event types.
   * Examples:
   * - PLAN_CLAIM_SUBMITTED - User submitted an insurance claim
   * - PLAN_BENEFIT_UTILIZED - User utilized a plan benefit
   * - PLAN_PLAN_SELECTED - User selected an insurance plan
   */
  @IsNotEmpty()
  @IsEnum(PlanEventType)
  type: PlanEventType;

  /**
   * The ID of the user associated with the event.
   * This must be a valid UUID and identify a registered user in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * The journey associated with the event.
   * For plan events, this should always be 'plan'.
   */
  @IsNotEmpty()
  @IsString()
  journey: string = 'plan';

  /**
   * The data associated with the plan event.
   * This contains plan-specific details about the event.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PlanEventDataDto)
  data: PlanEventDataDto;
}

/**
 * Data transfer object for plan event data.
 * Contains specific properties for different plan event types.
 */
export class PlanEventDataDto {
  /**
   * Optional claim ID for claim-related events.
   * Required for PLAN_CLAIM_SUBMITTED, PLAN_CLAIM_APPROVED, PLAN_CLAIM_REJECTED events.
   * @example "claim_123456"
   */
  @IsOptional()
  @IsString()
  claimId?: string;

  /**
   * Optional claim object for PLAN_CLAIM_SUBMITTED events.
   * Contains detailed information about the submitted claim.
   */
  @IsOptional()
  @IsObject()
  claim?: IClaim;

  /**
   * Optional plan ID for plan-related events.
   * Required for PLAN_PLAN_SELECTED, PLAN_PLAN_RENEWED events.
   * @example "plan_123456"
   */
  @IsOptional()
  @IsString()
  planId?: string;

  /**
   * Optional plan name for plan-related events.
   * @example "Premium Health Plan"
   */
  @IsOptional()
  @IsString()
  planName?: string;

  /**
   * Optional benefit ID for benefit-related events.
   * Required for PLAN_BENEFIT_UTILIZED events.
   * @example "benefit_123456"
   */
  @IsOptional()
  @IsString()
  benefitId?: string;

  /**
   * Optional benefit object for PLAN_BENEFIT_UTILIZED events.
   * Contains detailed information about the utilized benefit.
   */
  @IsOptional()
  @IsObject()
  benefit?: IBenefit;

  /**
   * Optional amount for financial transactions.
   * Used in PLAN_CLAIM_SUBMITTED, PLAN_CLAIM_APPROVED, PLAN_BENEFIT_UTILIZED events.
   * @example 150.75
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  /**
   * Optional approved amount for PLAN_CLAIM_APPROVED events.
   * @example 145.50
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  /**
   * Optional document ID for document-related events.
   * Required for PLAN_DOCUMENT_UPLOADED events.
   * @example "document_123456"
   */
  @IsOptional()
  @IsString()
  documentId?: string;

  /**
   * Optional document type for PLAN_DOCUMENT_UPLOADED events.
   * @example "MEDICAL_RECEIPT", "LAB_REPORT"
   */
  @IsOptional()
  @IsString()
  documentType?: string;

  /**
   * Optional verification ID for PLAN_COVERAGE_VERIFIED events.
   * @example "verification_123456"
   */
  @IsOptional()
  @IsString()
  verificationId?: string;

  /**
   * Optional service type for PLAN_COVERAGE_VERIFIED events.
   * @example "DENTAL", "VISION", "SPECIALIST"
   */
  @IsOptional()
  @IsString()
  serviceType?: string;

  /**
   * Optional flag indicating if a service is covered.
   * Used in PLAN_COVERAGE_VERIFIED events.
   */
  @IsOptional()
  isCovered?: boolean;

  /**
   * Optional estimated coverage amount for PLAN_COVERAGE_VERIFIED events.
   * @example 500.00
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCoverage?: number;

  /**
   * Optional premium amount for PLAN_PLAN_SELECTED, PLAN_PLAN_RENEWED events.
   * @example 250.00
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  premium?: number;

  /**
   * Optional flag indicating if this is the first utilization of a benefit.
   * Used in PLAN_BENEFIT_UTILIZED events.
   */
  @IsOptional()
  isFirstUtilization?: boolean;

  /**
   * Optional flag indicating if a plan selection is an upgrade.
   * Used in PLAN_PLAN_SELECTED events.
   */
  @IsOptional()
  isUpgrade?: boolean;

  /**
   * Optional number of consecutive years a plan has been renewed.
   * Used in PLAN_PLAN_RENEWED events.
   * @example 3
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  consecutiveYears?: number;

  /**
   * Optional timestamp for when the event occurred.
   * @example "2023-04-15T14:32:17.000Z"
   */
  @IsOptional()
  @IsString()
  timestamp?: string;

  /**
   * Any additional properties specific to the event type.
   */
  [key: string]: any;
}

/**
 * Factory function to create a plan event DTO with default values.
 * @param type The type of plan event
 * @param userId The ID of the user associated with the event
 * @param data The data associated with the event
 * @returns A new PlanEventDto instance
 */
export function createPlanEvent(
  type: PlanEventType,
  userId: string,
  data: Partial<PlanEventDataDto>
): PlanEventDto {
  return {
    type,
    userId,
    journey: 'plan',
    data: {
      timestamp: new Date().toISOString(),
      ...data
    } as PlanEventDataDto
  };
}

/**
 * Validates if the provided data is appropriate for the given plan event type.
 * @param type The type of plan event
 * @param data The data to validate
 * @returns True if the data is valid for the event type, false otherwise
 */
export function validatePlanEventData(
  type: PlanEventType,
  data: Partial<PlanEventDataDto>
): boolean {
  switch (type) {
    case PlanEventType.CLAIM_SUBMITTED:
      return !!data.claimId || !!data.claim;
    case PlanEventType.CLAIM_APPROVED:
    case PlanEventType.CLAIM_REJECTED:
      return !!data.claimId;
    case PlanEventType.BENEFIT_UTILIZED:
      return !!data.benefitId || !!data.benefit;
    case PlanEventType.PLAN_SELECTED:
    case PlanEventType.PLAN_RENEWED:
      return !!data.planId;
    case PlanEventType.DOCUMENT_UPLOADED:
      return !!data.documentId && !!data.documentType;
    case PlanEventType.COVERAGE_VERIFIED:
      return !!data.verificationId && !!data.serviceType;
    default:
      return true;
  }
}
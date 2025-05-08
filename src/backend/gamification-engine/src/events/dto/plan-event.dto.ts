/**
 * @file plan-event.dto.ts
 * @description Data transfer object for Plan Journey specific events in the gamification engine.
 * This DTO extends the base event structure with plan-specific properties and validation rules.
 * It enables proper typing and validation for insurance and benefits-related gamification events.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with comprehensive event type definitions
 * - Support journey-specific event types (Plan Journey events)
 * - Develop validation mechanisms for all event types
 * - Integrate with @austa/interfaces package for consistent type definitions across the platform
 */

import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from './process-event.dto';
import { PlanEventType } from '../interfaces/event-type.interface';
import { IClaim, IBenefit, ClaimStatus } from '@austa/interfaces/journey/plan';

/**
 * Base DTO for all Plan Journey events
 * Extends ProcessEventDto with plan-specific validation
 */
export class PlanEventDto extends ProcessEventDto {
  /**
   * The type of the plan event.
   * Must be one of the predefined plan event types.
   * 
   * @example 'CLAIM_SUBMITTED', 'BENEFIT_UTILIZED', 'PLAN_SELECTED'
   */
  @IsNotEmpty()
  @IsEnum(PlanEventType, {
    message: 'Event type must be a valid Plan Journey event type',
  })
  type: PlanEventType;

  /**
   * The journey associated with the event.
   * For plan events, this must be 'plan'.
   */
  @IsNotEmpty()
  @IsString()
  @IsEnum(['plan'], {
    message: 'Journey must be "plan" for Plan Journey events',
  })
  journey: 'plan';

  /**
   * The data associated with the event.
   * This contains plan-specific details about the event.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PlanEventDataDto)
  data: PlanEventDataDto;

  /**
   * Validates that the event data contains the required properties based on the event type
   * @returns True if the event data is valid for the event type
   * @throws Error if the event data is invalid
   */
  validateEventData(): boolean {
    // Check for claim data in claim-related events
    if (requiresClaimData(this.type) && !this.data.claim) {
      throw new Error(`Event type ${this.type} requires claim data`);
    }

    // Check for benefit data in benefit-related events
    if (requiresBenefitData(this.type) && !this.data.benefit) {
      throw new Error(`Event type ${this.type} requires benefit data`);
    }

    // Check for plan data in plan-related events
    if (requiresPlanData(this.type) && !this.data.plan) {
      throw new Error(`Event type ${this.type} requires plan data`);
    }

    // Check for document data in document-related events
    if (requiresDocumentData(this.type) && !this.data.document) {
      throw new Error(`Event type ${this.type} requires document data`);
    }

    return true;
  }
}

/**
 * DTO for plan event data
 * Contains nested DTOs for different plan event types
 */
export class PlanEventDataDto {
  /**
   * Optional claim information for claim-related events
   * Required for CLAIM_SUBMITTED and CLAIM_APPROVED events
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ClaimDataDto)
  claim?: ClaimDataDto;

  /**
   * Optional benefit information for benefit-related events
   * Required for BENEFIT_UTILIZED events
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => BenefitDataDto)
  benefit?: BenefitDataDto;

  /**
   * Optional plan information for plan-related events
   * Required for PLAN_SELECTED and PLAN_COMPARED events
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanDataDto)
  plan?: PlanDataDto;

  /**
   * Optional document information for document-related events
   * Required for DOCUMENT_UPLOADED events
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDataDto)
  document?: DocumentDataDto;
  
  /**
   * Additional metadata for the event
   * This can include any additional information about the event
   */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
  
  /**
   * Validates that the required data is present based on the event type
   * @param eventType The type of the event
   * @returns True if the data is valid for the event type
   * @throws Error if the data is invalid
   */
  validateForEventType(eventType: PlanEventType): boolean {
    switch (eventType) {
      case PlanEventType.CLAIM_SUBMITTED:
      case PlanEventType.CLAIM_APPROVED:
      case PlanEventType.CLAIM_REJECTED:
        if (!this.claim) {
          throw new Error(`Event type ${eventType} requires claim data`);
        }
        if (eventType === PlanEventType.CLAIM_SUBMITTED && !this.claim.submittedAt) {
          throw new Error(`CLAIM_SUBMITTED event requires submittedAt timestamp`);
        }
        if (eventType === PlanEventType.CLAIM_APPROVED && !this.claim.approvedAt) {
          throw new Error(`CLAIM_APPROVED event requires approvedAt timestamp`);
        }
        break;
        
      case PlanEventType.BENEFIT_VIEWED:
      case PlanEventType.BENEFIT_UTILIZED:
        if (!this.benefit) {
          throw new Error(`Event type ${eventType} requires benefit data`);
        }
        if (eventType === PlanEventType.BENEFIT_UTILIZED && !this.benefit.utilizedAt) {
          throw new Error(`BENEFIT_UTILIZED event requires utilizedAt timestamp`);
        }
        break;
        
      case PlanEventType.PLAN_VIEWED:
      case PlanEventType.PLAN_COMPARED:
      case PlanEventType.PLAN_SELECTED:
        if (!this.plan) {
          throw new Error(`Event type ${eventType} requires plan data`);
        }
        if (eventType === PlanEventType.PLAN_SELECTED && !this.plan.selectedAt) {
          throw new Error(`PLAN_SELECTED event requires selectedAt timestamp`);
        }
        break;
        
      case PlanEventType.DOCUMENT_UPLOADED:
        if (!this.document) {
          throw new Error(`Event type ${eventType} requires document data`);
        }
        break;
        
      case PlanEventType.COVERAGE_CHECKED:
        // No specific data requirements for COVERAGE_CHECKED
        break;
        
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
    
    return true;
  }
}

/**
 * DTO for claim data in plan events
 */
export class ClaimDataDto implements Partial<IClaim> {
  /**
   * The ID of the claim
   */
  @IsNotEmpty()
  @IsString()
  id: string;

  /**
   * The status of the claim
   */
  @IsNotEmpty()
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  /**
   * The timestamp when the claim was submitted
   */
  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  /**
   * The timestamp when the claim was approved
   */
  @IsOptional()
  @IsDateString()
  approvedAt?: string;

  /**
   * The amount of the claim
   */
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  /**
   * The approved amount of the claim
   */
  @IsOptional()
  @IsNumber()
  approvedAmount?: number;

  /**
   * The type of the claim
   */
  @IsOptional()
  @IsString()
  claimType?: string;

  /**
   * Whether the claim has documents attached
   */
  @IsOptional()
  @IsBoolean()
  hasDocuments?: boolean;

  /**
   * Whether this is the first claim for the user
   */
  @IsOptional()
  @IsBoolean()
  isFirstClaim?: boolean;

  /**
   * The processing duration of the claim in days
   */
  @IsOptional()
  @IsNumber()
  processingDuration?: number;
}

/**
 * DTO for benefit data in plan events
 */
export class BenefitDataDto implements Partial<IBenefit> {
  /**
   * The ID of the benefit
   */
  @IsNotEmpty()
  @IsString()
  id: string;

  /**
   * The type of the benefit
   */
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * The action performed on the benefit
   */
  @IsNotEmpty()
  @IsEnum(['viewed', 'used', 'shared'])
  action: 'viewed' | 'used' | 'shared';

  /**
   * The timestamp when the benefit was utilized
   */
  @IsOptional()
  @IsDateString()
  utilizedAt?: string;

  /**
   * The savings amount from using the benefit
   */
  @IsOptional()
  @IsNumber()
  savingsAmount?: number;

  /**
   * Whether this is the first utilization of the benefit
   */
  @IsOptional()
  @IsBoolean()
  isFirstUtilization?: boolean;
}

/**
 * DTO for plan data in plan events
 */
export class PlanDataDto {
  /**
   * The ID of the plan
   */
  @IsNotEmpty()
  @IsString()
  id: string;

  /**
   * The action performed on the plan
   */
  @IsNotEmpty()
  @IsEnum(['viewed', 'compared', 'selected'])
  action: 'viewed' | 'compared' | 'selected';

  /**
   * The timestamp when the plan was selected
   */
  @IsOptional()
  @IsDateString()
  selectedAt?: string;

  /**
   * The type of the plan
   */
  @IsOptional()
  @IsString()
  planType?: string;

  /**
   * The coverage level of the plan
   */
  @IsOptional()
  @IsString()
  coverageLevel?: string;

  /**
   * The annual cost of the plan
   */
  @IsOptional()
  @IsNumber()
  annualCost?: number;

  /**
   * Whether this is a new enrollment
   */
  @IsOptional()
  @IsBoolean()
  isNewEnrollment?: boolean;
}

/**
 * DTO for document data in plan events
 */
export class DocumentDataDto {
  /**
   * The ID of the document
   */
  @IsNotEmpty()
  @IsString()
  id: string;

  /**
   * The type of the document
   */
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * The timestamp when the document was uploaded
   */
  @IsNotEmpty()
  @IsDateString()
  uploadedAt: string;

  /**
   * The size of the file in bytes
   */
  @IsNotEmpty()
  @IsNumber()
  fileSize: number;

  /**
   * The ID of the related claim
   */
  @IsOptional()
  @IsString()
  relatedClaimId?: string;
}

/**
 * Factory function to create a plan event DTO from raw data
 * @param type The plan event type
 * @param userId The user ID
 * @param data The event data
 * @returns A new PlanEventDto instance
 */
export function createPlanEventDto(type: PlanEventType, userId: string, data: any): PlanEventDto {
  const dto = new PlanEventDto();
  dto.type = type;
  dto.userId = userId;
  dto.journey = 'plan';
  dto.data = data;
  return dto;
}

/**
 * Converts a ProcessEventDto to a PlanEventDto if it's a valid plan event
 * @param processEventDto The ProcessEventDto to convert
 * @returns A PlanEventDto if the event is a valid plan event, null otherwise
 */
export function fromProcessEventDto(processEventDto: ProcessEventDto): PlanEventDto | null {
  // Check if this is a plan event
  if (
    processEventDto.journey !== 'plan' ||
    !Object.values(PlanEventType).includes(processEventDto.type as PlanEventType)
  ) {
    return null;
  }
  
  // Create a new PlanEventDto
  const planEventDto = new PlanEventDto();
  planEventDto.type = processEventDto.type as PlanEventType;
  planEventDto.userId = processEventDto.userId;
  planEventDto.journey = 'plan';
  planEventDto.data = processEventDto.data as PlanEventDataDto;
  
  // Validate the event data
  try {
    planEventDto.validateEventData();
    return planEventDto;
  } catch (error) {
    // If validation fails, return null
    console.error('Invalid plan event data:', error);
    return null;
  }
}

/**
 * Type guard to check if an event is a valid plan event
 * @param event The event to check
 * @returns True if the event is a valid plan event
 */
export function isPlanEvent(event: any): event is PlanEventDto {
  return (
    event &&
    Object.values(PlanEventType).includes(event.type) &&
    event.journey === 'plan' &&
    event.userId &&
    event.data
  );
}

/**
 * Determines if the event requires claim data validation
 * @param type The plan event type
 * @returns True if the event type requires claim data
 */
export function requiresClaimData(type: PlanEventType): boolean {
  return [
    PlanEventType.CLAIM_SUBMITTED,
    PlanEventType.CLAIM_APPROVED,
    PlanEventType.CLAIM_REJECTED
  ].includes(type);
}

/**
 * Determines if the event requires benefit data validation
 * @param type The plan event type
 * @returns True if the event type requires benefit data
 */
export function requiresBenefitData(type: PlanEventType): boolean {
  return [
    PlanEventType.BENEFIT_VIEWED,
    PlanEventType.BENEFIT_UTILIZED
  ].includes(type);
}

/**
 * Determines if the event requires plan data validation
 * @param type The plan event type
 * @returns True if the event type requires plan data
 */
export function requiresPlanData(type: PlanEventType): boolean {
  return [
    PlanEventType.PLAN_VIEWED,
    PlanEventType.PLAN_COMPARED,
    PlanEventType.PLAN_SELECTED
  ].includes(type);
}

/**
 * Determines if the event requires document data validation
 * @param type The plan event type
 * @returns True if the event type requires document data
 */
export function requiresDocumentData(type: PlanEventType): boolean {
  return [
    PlanEventType.DOCUMENT_UPLOADED
  ].includes(type);
}

/**
 * Converts a plan event to a standardized format for the gamification engine
 * @param event The plan event to convert
 * @returns A standardized event object for processing
 */
export function toStandardizedEvent(event: PlanEventDto): {
  type: string;
  userId: string;
  journey: string;
  data: Record<string, any>;
  timestamp: string;
} {
  return {
    type: event.type,
    userId: event.userId,
    journey: event.journey,
    data: event.data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculates the points to award for a plan event based on its type and data
 * @param event The plan event
 * @returns The number of points to award
 */
export function calculatePointsForPlanEvent(event: PlanEventDto): number {
  switch (event.type) {
    case PlanEventType.CLAIM_SUBMITTED:
      // Base points for submitting a claim
      let points = 10;
      
      // Bonus points for first claim
      if (event.data.claim?.isFirstClaim) {
        points += 5;
      }
      
      // Bonus points for including documents
      if (event.data.claim?.hasDocuments) {
        points += 3;
      }
      
      return points;
      
    case PlanEventType.CLAIM_APPROVED:
      // Points based on claim amount
      const amount = event.data.claim?.amount || 0;
      if (amount > 1000) {
        return 15;
      } else if (amount > 500) {
        return 10;
      } else {
        return 5;
      }
      
    case PlanEventType.BENEFIT_UTILIZED:
      // Base points for using a benefit
      return 8;
      
    case PlanEventType.PLAN_SELECTED:
      // Points for selecting a plan
      return 20;
      
    case PlanEventType.PLAN_COMPARED:
      // Points for comparing plans
      return 5;
      
    case PlanEventType.DOCUMENT_UPLOADED:
      // Points for uploading a document
      return 3;
      
    case PlanEventType.COVERAGE_CHECKED:
      // Points for checking coverage
      return 2;
      
    case PlanEventType.BENEFIT_VIEWED:
    case PlanEventType.PLAN_VIEWED:
    default:
      // Minimal points for viewing actions
      return 1;
  }
}

/**
 * Determines if a plan event should trigger an achievement
 * @param event The plan event
 * @returns True if the event should trigger an achievement check
 */
export function shouldTriggerAchievement(event: PlanEventDto): boolean {
  switch (event.type) {
    case PlanEventType.CLAIM_SUBMITTED:
      return true; // Always check for achievements on claim submission
      
    case PlanEventType.CLAIM_APPROVED:
      return true; // Always check for achievements on claim approval
      
    case PlanEventType.BENEFIT_UTILIZED:
      return true; // Always check for achievements on benefit utilization
      
    case PlanEventType.PLAN_SELECTED:
      return true; // Always check for achievements on plan selection
      
    case PlanEventType.DOCUMENT_UPLOADED:
      // Only check for achievements if it's related to a claim
      return !!event.data.document?.relatedClaimId;
      
    case PlanEventType.PLAN_COMPARED:
    case PlanEventType.COVERAGE_CHECKED:
    case PlanEventType.BENEFIT_VIEWED:
    case PlanEventType.PLAN_VIEWED:
    default:
      // Don't trigger achievement checks for these event types
      return false;
  }
}

/**
 * Gets the achievement types that should be checked for a plan event
 * @param event The plan event
 * @returns An array of achievement types to check
 */
export function getAchievementTypesToCheck(event: PlanEventDto): string[] {
  switch (event.type) {
    case PlanEventType.CLAIM_SUBMITTED:
      return ['FIRST_CLAIM', 'CLAIM_STREAK', 'CLAIM_MASTER'];
      
    case PlanEventType.CLAIM_APPROVED:
      return ['BIG_CLAIM', 'CLAIM_APPROVED_STREAK'];
      
    case PlanEventType.BENEFIT_UTILIZED:
      return ['BENEFIT_MASTER', 'SAVINGS_CHAMPION'];
      
    case PlanEventType.PLAN_SELECTED:
      return ['PLAN_OPTIMIZER'];
      
    case PlanEventType.DOCUMENT_UPLOADED:
      return ['DOCUMENTATION_EXPERT'];
      
    default:
      return [];
  }
}
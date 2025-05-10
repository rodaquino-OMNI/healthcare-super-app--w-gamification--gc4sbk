/**
 * @file claim-event.dto.ts
 * @description Specialized DTO for insurance claim events from the Plan journey.
 * Handles validation and structuring of claim submission, approval, rejection, and status update events.
 * Enables gamification of claim-related activities and claim status notifications.
 */

import {
  IsString,
  IsUUID,
  IsEnum,
  IsNumber,
  IsOptional,
  IsISO8601,
  IsPositive,
  IsObject,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsBoolean,
  Min,
  Max,
  Length,
  Matches,
  ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanEventType } from '../interfaces/journey-events.interface';
import { ClaimStatus } from '@austa/interfaces/journey/plan';

/**
 * Enum defining the types of claim events
 */
export enum ClaimEventType {
  SUBMITTED = PlanEventType.CLAIM_SUBMITTED,
  UPDATED = PlanEventType.CLAIM_UPDATED,
  APPROVED = PlanEventType.CLAIM_APPROVED,
  REJECTED = PlanEventType.CLAIM_REJECTED,
  DOCUMENT_ADDED = PlanEventType.CLAIM_DOCUMENT_ADDED
}

/**
 * Enum defining the types of claims
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
 * DTO for claim amount with currency information
 */
export class ClaimAmountDto {
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 2
  })
  @IsPositive()
  @Min(0.01)
  value: number;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be a valid 3-letter ISO currency code (e.g., USD, BRL)'
  })
  currency: string;
}

/**
 * DTO for claim document reference
 */
export class ClaimDocumentDto {
  @IsUUID(4)
  id: string;

  @IsString()
  @Length(1, 255)
  filename: string;

  @IsString()
  @Length(1, 100)
  contentType: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  size?: number;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;

  @IsISO8601()
  uploadedAt: string;
}

/**
 * Base DTO for all claim events
 */
export class ClaimEventDto {
  @IsUUID(4)
  claimId: string;

  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  planId: string;

  @IsEnum(ClaimType)
  claimType: ClaimType;

  @IsEnum(ClaimEventType)
  eventType: ClaimEventType;

  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  @IsOptional()
  @IsEnum(ClaimStatus)
  previousStatus?: ClaimStatus;

  @ValidateNested()
  @Type(() => ClaimAmountDto)
  amount: ClaimAmountDto;

  @IsISO8601()
  eventDate: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for claim submission events
 */
export class ClaimSubmittedEventDto extends ClaimEventDto {
  @IsEnum(ClaimEventType)
  eventType: ClaimEventType.SUBMITTED = ClaimEventType.SUBMITTED;

  @IsEnum(ClaimStatus)
  status: ClaimStatus = ClaimStatus.PENDING;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents: ClaimDocumentDto[];

  @IsString()
  @Length(10, 1000)
  description: string;
}

/**
 * DTO for claim approval events
 */
export class ClaimApprovedEventDto extends ClaimEventDto {
  @IsEnum(ClaimEventType)
  eventType: ClaimEventType.APPROVED = ClaimEventType.APPROVED;

  @IsEnum(ClaimStatus)
  status: ClaimStatus = ClaimStatus.APPROVED;

  @IsEnum(ClaimStatus)
  previousStatus: ClaimStatus;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  approvalNotes?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsISO8601()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;
}

/**
 * DTO for claim rejection events
 */
export class ClaimRejectedEventDto extends ClaimEventDto {
  @IsEnum(ClaimEventType)
  eventType: ClaimEventType.REJECTED = ClaimEventType.REJECTED;

  @IsEnum(ClaimStatus)
  status: ClaimStatus = ClaimStatus.REJECTED;

  @IsEnum(ClaimStatus)
  previousStatus: ClaimStatus;

  @IsString()
  @Length(10, 1000)
  rejectionReason: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsBoolean()
  canResubmit?: boolean;
}

/**
 * DTO for claim update events
 */
export class ClaimUpdatedEventDto extends ClaimEventDto {
  @IsEnum(ClaimEventType)
  eventType: ClaimEventType.UPDATED = ClaimEventType.UPDATED;

  @IsOptional()
  @IsEnum(ClaimStatus)
  previousStatus?: ClaimStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClaimAmountDto)
  previousAmount?: ClaimAmountDto;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  updateNotes?: string;
}

/**
 * DTO for document addition events
 */
export class ClaimDocumentAddedEventDto extends ClaimEventDto {
  @IsEnum(ClaimEventType)
  eventType: ClaimEventType.DOCUMENT_ADDED = ClaimEventType.DOCUMENT_ADDED;

  @ValidateNested()
  @Type(() => ClaimDocumentDto)
  document: ClaimDocumentDto;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  documentNotes?: string;
}

/**
 * Type guard to check if an event is a claim submission event
 * @param event The event to check
 * @returns True if the event is a claim submission event
 */
export function isClaimSubmittedEvent(event: ClaimEventDto): event is ClaimSubmittedEventDto {
  return event.eventType === ClaimEventType.SUBMITTED;
}

/**
 * Type guard to check if an event is a claim approval event
 * @param event The event to check
 * @returns True if the event is a claim approval event
 */
export function isClaimApprovedEvent(event: ClaimEventDto): event is ClaimApprovedEventDto {
  return event.eventType === ClaimEventType.APPROVED;
}

/**
 * Type guard to check if an event is a claim rejection event
 * @param event The event to check
 * @returns True if the event is a claim rejection event
 */
export function isClaimRejectedEvent(event: ClaimEventDto): event is ClaimRejectedEventDto {
  return event.eventType === ClaimEventType.REJECTED;
}

/**
 * Type guard to check if an event is a claim update event
 * @param event The event to check
 * @returns True if the event is a claim update event
 */
export function isClaimUpdatedEvent(event: ClaimEventDto): event is ClaimUpdatedEventDto {
  return event.eventType === ClaimEventType.UPDATED;
}

/**
 * Type guard to check if an event is a document addition event
 * @param event The event to check
 * @returns True if the event is a document addition event
 */
export function isClaimDocumentAddedEvent(event: ClaimEventDto): event is ClaimDocumentAddedEventDto {
  return event.eventType === ClaimEventType.DOCUMENT_ADDED;
}
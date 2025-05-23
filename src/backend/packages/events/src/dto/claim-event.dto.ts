/**
 * @file claim-event.dto.ts
 * @description Defines specialized DTOs for insurance claim events in the Plan journey.
 * 
 * This file provides Data Transfer Objects for validating and structuring claim-related
 * events such as claim submission, approval, rejection, and status updates. These DTOs
 * ensure proper validation of claim data before it's processed by the gamification engine
 * and notification service.
 */

import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsISO8601,
  IsArray,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimStatus, IClaimDocument } from '@austa/interfaces/journey/plan';
import { EventType } from '@austa/interfaces/gamification/events';

/**
 * Base DTO for all claim-related events.
 * 
 * This class provides common properties and validation rules for all claim events
 * in the Plan journey, ensuring consistent data structure and validation.
 */
export class ClaimEventDto {
  /**
   * Unique identifier for the claim
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsNotEmpty({ message: 'Claim ID is required' })
  @IsUUID('4', { message: 'Claim ID must be a valid UUID' })
  claimId: string;

  /**
   * Type of claim (e.g., 'medical_visit', 'procedure', 'medication', 'exam')
   * @example "medical_visit"
   */
  @IsNotEmpty({ message: 'Claim type is required' })
  @IsString({ message: 'Claim type must be a string' })
  @MaxLength(50, { message: 'Claim type cannot exceed 50 characters' })
  claimType: string;

  /**
   * Current status of the claim
   * @example "SUBMITTED"
   */
  @IsNotEmpty({ message: 'Claim status is required' })
  @IsEnum(ClaimStatus, { message: 'Claim status must be a valid ClaimStatus' })
  status: ClaimStatus;

  /**
   * ID of the plan this claim is associated with
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsNotEmpty({ message: 'Plan ID is required' })
  @IsUUID('4', { message: 'Plan ID must be a valid UUID' })
  planId: string;

  /**
   * Timestamp when the event occurred
   * @example "2023-01-01T12:00:00Z"
   */
  @IsNotEmpty({ message: 'Timestamp is required' })
  @IsISO8601({}, { message: 'Timestamp must be a valid ISO 8601 date string' })
  timestamp: string = new Date().toISOString();

  /**
   * Optional metadata for additional context
   */
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for claim amount information.
 * 
 * This class provides validation for monetary values associated with claims,
 * ensuring proper formatting and validation of currency information.
 */
export class ClaimAmountDto {
  /**
   * Claim amount in the local currency (BRL)
   * @example 150.75
   */
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be positive' })
  @Max(1000000, { message: 'Amount cannot exceed 1,000,000' })
  amount: number;

  /**
   * Currency code (ISO 4217)
   * @example "BRL"
   * @default "BRL"
   */
  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  @MaxLength(3, { message: 'Currency code must be 3 characters' })
  currency?: string = 'BRL';

  /**
   * Whether the amount is covered by insurance
   * @example true
   */
  @IsOptional()
  @IsBoolean({ message: 'Covered flag must be a boolean' })
  covered?: boolean;

  /**
   * Percentage of the amount covered by insurance
   * @example 80
   */
  @IsOptional()
  @IsNumber({}, { message: 'Coverage percentage must be a number' })
  @Min(0, { message: 'Coverage percentage must be at least 0' })
  @Max(100, { message: 'Coverage percentage cannot exceed 100' })
  coveragePercentage?: number;
}

/**
 * DTO for claim document information.
 * 
 * This class provides validation for documents associated with claims,
 * ensuring proper structure and validation of document references.
 */
export class ClaimDocumentDto implements Partial<IClaimDocument> {
  /**
   * Unique identifier for the document
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsNotEmpty({ message: 'Document ID is required' })
  @IsUUID('4', { message: 'Document ID must be a valid UUID' })
  id: string;

  /**
   * Type of document (e.g., 'receipt', 'prescription', 'medical_report')
   * @example "receipt"
   */
  @IsNotEmpty({ message: 'Document type is required' })
  @IsString({ message: 'Document type must be a string' })
  @MaxLength(50, { message: 'Document type cannot exceed 50 characters' })
  type: string;

  /**
   * URL or path to access the document
   * @example "https://storage.austa.com/documents/123e4567-e89b-12d3-a456-426614174000.pdf"
   */
  @IsOptional()
  @IsString({ message: 'URL must be a string' })
  url?: string;

  /**
   * Optional metadata for the document
   */
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for CLAIM_SUBMITTED events.
 * 
 * This class provides validation for claim submission events, ensuring that
 * all required information for a new claim is present and valid.
 */
export class ClaimSubmittedEventDto extends ClaimEventDto {
  /**
   * Type of event (always CLAIM_SUBMITTED for this DTO)
   */
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(EventType, { message: 'Event type must be CLAIM_SUBMITTED' })
  readonly eventType: EventType.CLAIM_SUBMITTED = EventType.CLAIM_SUBMITTED;

  /**
   * Claim amount information
   */
  @IsNotEmpty({ message: 'Amount information is required' })
  @ValidateNested()
  @Type(() => ClaimAmountDto)
  amount: ClaimAmountDto;

  /**
   * Documents associated with the claim
   */
  @IsOptional()
  @IsArray({ message: 'Documents must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  @ArrayMaxSize(10, { message: 'Cannot include more than 10 documents' })
  documents?: ClaimDocumentDto[];

  /**
   * Optional procedure code for medical claims
   * @example "A123.4"
   */
  @IsOptional()
  @IsString({ message: 'Procedure code must be a string' })
  @MaxLength(20, { message: 'Procedure code cannot exceed 20 characters' })
  procedureCode?: string;

  /**
   * Whether this is the user's first claim submission
   * Used for gamification rules related to first-time actions
   */
  @IsOptional()
  @IsBoolean({ message: 'First claim flag must be a boolean' })
  isFirstClaim?: boolean;
}

/**
 * DTO for CLAIM_APPROVED events.
 * 
 * This class provides validation for claim approval events, ensuring that
 * all required information for an approved claim is present and valid.
 */
export class ClaimApprovedEventDto extends ClaimEventDto {
  /**
   * Type of event (always CLAIM_APPROVED for this DTO)
   */
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(EventType, { message: 'Event type must be CLAIM_APPROVED' })
  readonly eventType: EventType.CLAIM_APPROVED = EventType.CLAIM_APPROVED;

  /**
   * Claim amount information
   */
  @IsNotEmpty({ message: 'Amount information is required' })
  @ValidateNested()
  @Type(() => ClaimAmountDto)
  amount: ClaimAmountDto;

  /**
   * Approved amount (may differ from requested amount)
   */
  @IsNotEmpty({ message: 'Approved amount is required' })
  @IsNumber({}, { message: 'Approved amount must be a number' })
  @IsPositive({ message: 'Approved amount must be positive' })
  approvedAmount: number;

  /**
   * Expected payment date
   * @example "2023-01-15T00:00:00Z"
   */
  @IsOptional()
  @IsISO8601({}, { message: 'Expected payment date must be a valid ISO 8601 date string' })
  expectedPaymentDate?: string;

  /**
   * Notes about the approval
   */
  @IsOptional()
  @IsString({ message: 'Approval notes must be a string' })
  @MaxLength(500, { message: 'Approval notes cannot exceed 500 characters' })
  approvalNotes?: string;
}

/**
 * DTO for CLAIM_DENIED events.
 * 
 * This class provides validation for claim denial events, ensuring that
 * all required information for a denied claim is present and valid.
 */
export class ClaimDeniedEventDto extends ClaimEventDto {
  /**
   * Type of event (always CLAIM_DENIED for this DTO)
   */
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(EventType, { message: 'Event type must be CLAIM_DENIED' })
  readonly eventType: EventType.CLAIM_DENIED = EventType.CLAIM_DENIED;

  /**
   * Claim amount information
   */
  @IsNotEmpty({ message: 'Amount information is required' })
  @ValidateNested()
  @Type(() => ClaimAmountDto)
  amount: ClaimAmountDto;

  /**
   * Reason for denial
   * @example "Service not covered under current plan"
   */
  @IsNotEmpty({ message: 'Denial reason is required' })
  @IsString({ message: 'Denial reason must be a string' })
  @MaxLength(500, { message: 'Denial reason cannot exceed 500 characters' })
  denialReason: string;

  /**
   * Denial code
   * @example "NC001"
   */
  @IsOptional()
  @IsString({ message: 'Denial code must be a string' })
  @MaxLength(20, { message: 'Denial code cannot exceed 20 characters' })
  denialCode?: string;

  /**
   * Whether the claim can be appealed
   */
  @IsOptional()
  @IsBoolean({ message: 'Appealable flag must be a boolean' })
  appealable?: boolean;

  /**
   * Deadline for appeal if applicable
   * @example "2023-02-15T00:00:00Z"
   */
  @IsOptional()
  @IsISO8601({}, { message: 'Appeal deadline must be a valid ISO 8601 date string' })
  appealDeadline?: string;
}

/**
 * DTO for CLAIM_DOCUMENT_UPLOADED events.
 * 
 * This class provides validation for document upload events associated with claims,
 * ensuring proper structure and validation of document references.
 */
export class ClaimDocumentUploadedEventDto extends ClaimEventDto {
  /**
   * Type of event (always CLAIM_DOCUMENT_UPLOADED for this DTO)
   */
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(EventType, { message: 'Event type must be CLAIM_DOCUMENT_UPLOADED' })
  readonly eventType: EventType.CLAIM_DOCUMENT_UPLOADED = EventType.CLAIM_DOCUMENT_UPLOADED;

  /**
   * Documents uploaded for the claim
   */
  @IsNotEmpty({ message: 'Documents are required' })
  @IsArray({ message: 'Documents must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  @ArrayMinSize(1, { message: 'At least one document is required' })
  @ArrayMaxSize(10, { message: 'Cannot include more than 10 documents' })
  documents: ClaimDocumentDto[];

  /**
   * Total number of documents now associated with the claim
   */
  @IsNotEmpty({ message: 'Document count is required' })
  @IsNumber({}, { message: 'Document count must be a number' })
  @Min(1, { message: 'Document count must be at least 1' })
  documentCount: number;

  /**
   * Whether this upload completes the required documentation
   */
  @IsOptional()
  @IsBoolean({ message: 'Documentation complete flag must be a boolean' })
  documentationComplete?: boolean;
}

/**
 * DTO for CLAIM_STATUS_UPDATED events.
 * 
 * This class provides validation for claim status update events, ensuring that
 * all required information for a status change is present and valid.
 */
export class ClaimStatusUpdatedEventDto extends ClaimEventDto {
  /**
   * Type of event (custom for status updates)
   */
  @IsNotEmpty({ message: 'Event type is required' })
  readonly eventType: string = 'CLAIM_STATUS_UPDATED';

  /**
   * Previous status of the claim
   */
  @IsNotEmpty({ message: 'Previous status is required' })
  @IsEnum(ClaimStatus, { message: 'Previous status must be a valid ClaimStatus' })
  previousStatus: ClaimStatus;

  /**
   * Reason for the status change
   */
  @IsOptional()
  @IsString({ message: 'Status change reason must be a string' })
  @MaxLength(500, { message: 'Status change reason cannot exceed 500 characters' })
  statusChangeReason?: string;

  /**
   * User who initiated the status change (if applicable)
   */
  @IsOptional()
  @IsUUID('4', { message: 'Changed by user ID must be a valid UUID' })
  changedByUserId?: string;

  /**
   * Whether this status change requires user action
   */
  @IsOptional()
  @IsBoolean({ message: 'Requires action flag must be a boolean' })
  requiresAction?: boolean;
}

/**
 * DTO for CLAIM_COMPLETED events.
 * 
 * This class provides validation for claim completion events, ensuring that
 * all required information for a completed claim is present and valid.
 */
export class ClaimCompletedEventDto extends ClaimEventDto {
  /**
   * Type of event (always CLAIM_COMPLETED for this DTO)
   */
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(EventType, { message: 'Event type must be CLAIM_COMPLETED' })
  readonly eventType: EventType.CLAIM_COMPLETED = EventType.CLAIM_COMPLETED;

  /**
   * Claim amount information
   */
  @IsNotEmpty({ message: 'Amount information is required' })
  @ValidateNested()
  @Type(() => ClaimAmountDto)
  amount: ClaimAmountDto;

  /**
   * Final approved amount
   */
  @IsNotEmpty({ message: 'Final amount is required' })
  @IsNumber({}, { message: 'Final amount must be a number' })
  @IsPositive({ message: 'Final amount must be positive' })
  finalAmount: number;

  /**
   * Payment reference number
   */
  @IsOptional()
  @IsString({ message: 'Payment reference must be a string' })
  @MaxLength(50, { message: 'Payment reference cannot exceed 50 characters' })
  paymentReference?: string;

  /**
   * Date when payment was processed
   */
  @IsOptional()
  @IsISO8601({}, { message: 'Payment date must be a valid ISO 8601 date string' })
  paymentDate?: string;

  /**
   * Total processing time in days
   */
  @IsOptional()
  @IsNumber({}, { message: 'Processing time must be a number' })
  @Min(0, { message: 'Processing time cannot be negative' })
  processingTimeDays?: number;
}
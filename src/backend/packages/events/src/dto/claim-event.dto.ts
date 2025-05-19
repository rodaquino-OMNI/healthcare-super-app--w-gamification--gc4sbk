import { IsNotEmpty, IsString, IsUUID, IsNumber, IsEnum, IsOptional, IsISO8601, IsArray, ValidateNested, Min, Max, IsIn, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum representing the possible status values for an insurance claim.
 * Used for type-safe status representation in claim events.
 */
export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  DENIED = 'DENIED',
  APPEALED = 'APPEALED',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID'
}

/**
 * Enum representing the possible types of insurance claims.
 * Used for categorizing claims in the Plan journey.
 */
export enum ClaimType {
  MEDICAL = 'MEDICAL',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  PHARMACY = 'PHARMACY',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  PREVENTIVE = 'PREVENTIVE',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER'
}

/**
 * Enum representing the possible currencies for claim amounts.
 */
export enum Currency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR'
}

/**
 * DTO for claim document references in claim events.
 * Represents supporting documentation attached to a claim.
 */
export class ClaimDocumentDto {
  /**
   * Unique identifier for the document.
   */
  @IsNotEmpty()
  @IsUUID()
  id: string;

  /**
   * Type of document (e.g., 'RECEIPT', 'MEDICAL_REPORT', 'PRESCRIPTION').
   */
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * Original filename of the document.
   */
  @IsNotEmpty()
  @IsString()
  filename: string;

  /**
   * MIME type of the document.
   */
  @IsNotEmpty()
  @IsString()
  mimeType: string;

  /**
   * Size of the document in bytes.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  size: number;

  /**
   * URL or path to access the document.
   */
  @IsOptional()
  @IsString()
  url?: string;

  /**
   * Timestamp when the document was uploaded.
   */
  @IsNotEmpty()
  @IsISO8601()
  uploadedAt: string;
}

/**
 * Base DTO for all claim-related events in the Plan journey.
 * Contains common properties for all claim events.
 */
export class ClaimEventDto {
  /**
   * Unique identifier for the claim.
   */
  @IsNotEmpty()
  @IsUUID()
  claimId: string;

  /**
   * Unique identifier for the user who owns the claim.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * Unique identifier for the plan associated with the claim.
   */
  @IsNotEmpty()
  @IsUUID()
  planId: string;

  /**
   * Type of the claim (medical, dental, vision, etc.).
   */
  @IsNotEmpty()
  @IsEnum(ClaimType)
  type: ClaimType;

  /**
   * Current status of the claim.
   */
  @IsNotEmpty()
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  /**
   * Previous status of the claim (for status change events).
   */
  @IsOptional()
  @IsEnum(ClaimStatus)
  previousStatus?: ClaimStatus;

  /**
   * Amount requested in the claim.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Max(1000000) // Reasonable maximum for claim amount
  amount: number;

  /**
   * Currency of the claim amount.
   */
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  /**
   * Optional procedure code for medical claims.
   */
  @IsOptional()
  @IsString()
  procedureCode?: string;

  /**
   * Optional diagnosis code for medical claims.
   */
  @IsOptional()
  @IsString()
  diagnosisCode?: string;

  /**
   * Name of the healthcare provider associated with the claim.
   */
  @IsOptional()
  @IsString()
  providerName?: string;

  /**
   * Date of service for the claim.
   */
  @IsOptional()
  @IsISO8601()
  serviceDate?: string;

  /**
   * Date when the claim was submitted.
   */
  @IsOptional()
  @IsISO8601()
  submittedAt?: string;

  /**
   * Date when the claim was processed.
   */
  @IsOptional()
  @IsISO8601()
  processedAt?: string;

  /**
   * Optional notes or comments about the claim.
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Supporting documents attached to the claim.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(10) // Reasonable limit for attached documents
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];
}

/**
 * DTO for claim submission events.
 * Used when a user submits a new claim or updates a draft claim.
 */
export class ClaimSubmissionEventDto extends ClaimEventDto {
  /**
   * The status must be SUBMITTED for submission events.
   */
  @IsNotEmpty()
  @IsIn([ClaimStatus.SUBMITTED])
  status: ClaimStatus;

  /**
   * Submission timestamp is required for submission events.
   */
  @IsNotEmpty()
  @IsISO8601()
  submittedAt: string;

  /**
   * At least one supporting document is required for claim submission.
   */
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Type(() => ClaimDocumentDto)
  documents: ClaimDocumentDto[];
}

/**
 * DTO for claim status update events.
 * Used when the status of a claim changes (e.g., approved, denied).
 */
export class ClaimStatusUpdateEventDto extends ClaimEventDto {
  /**
   * Previous status is required for status update events.
   */
  @IsNotEmpty()
  @IsEnum(ClaimStatus)
  previousStatus: ClaimStatus;

  /**
   * Reason for the status change.
   */
  @IsOptional()
  @IsString()
  statusChangeReason?: string;

  /**
   * Amount approved (may differ from requested amount).
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  /**
   * Date when the claim was processed.
   */
  @IsNotEmpty()
  @IsISO8601()
  processedAt: string;
}

/**
 * DTO for claim document addition events.
 * Used when documents are added to an existing claim.
 */
export class ClaimDocumentAddedEventDto extends ClaimEventDto {
  /**
   * New documents added to the claim.
   */
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Type(() => ClaimDocumentDto)
  newDocuments: ClaimDocumentDto[];
}

/**
 * DTO for claim payment events.
 * Used when a claim is paid out to the user.
 */
export class ClaimPaymentEventDto extends ClaimEventDto {
  /**
   * The status must be PAID for payment events.
   */
  @IsNotEmpty()
  @IsIn([ClaimStatus.PAID])
  status: ClaimStatus;

  /**
   * Amount paid to the user.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  paidAmount: number;

  /**
   * Date when the payment was processed.
   */
  @IsNotEmpty()
  @IsISO8601()
  paymentDate: string;

  /**
   * Payment reference or transaction ID.
   */
  @IsNotEmpty()
  @IsString()
  paymentReference: string;
}
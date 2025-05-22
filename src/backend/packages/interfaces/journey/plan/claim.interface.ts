/**
 * @file claim.interface.ts
 * @description Defines the IClaim interface and ClaimStatus enum for modeling insurance claim data
 * across the Plan Journey. This interface is used for type-safe claim schemas throughout the platform.
 */

/**
 * Standardized enum for all possible claim statuses in the system.
 * This provides type safety and consistency for claim status values across services.
 */
export enum ClaimStatus {
  /**
   * Claim has been created but not yet submitted for processing
   */
  DRAFT = 'DRAFT',

  /**
   * Claim has been submitted and is awaiting initial review
   */
  SUBMITTED = 'SUBMITTED',

  /**
   * Claim is currently being reviewed by insurance personnel
   */
  UNDER_REVIEW = 'UNDER_REVIEW',

  /**
   * Additional information is required from the user to continue processing
   */
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',

  /**
   * Claim has been approved for payment or reimbursement
   */
  APPROVED = 'APPROVED',

  /**
   * Claim has been denied based on initial review
   */
  DENIED = 'DENIED',

  /**
   * User has appealed a denied claim for reconsideration
   */
  APPEALED = 'APPEALED',

  /**
   * Claim has expired due to lack of response or time limits
   */
  EXPIRED = 'EXPIRED',

  /**
   * Payment or reimbursement for the claim is being processed
   */
  PROCESSING = 'PROCESSING',

  /**
   * Claim processing has been completed successfully
   */
  COMPLETED = 'COMPLETED',

  /**
   * Processing of the claim has failed
   */
  FAILED = 'FAILED',

  /**
   * Claim has been cancelled by the user or system
   */
  CANCELLED = 'CANCELLED',

  /**
   * Claim has been denied after appeal with no further recourse
   */
  FINAL_DENIAL = 'FINAL_DENIAL'
}

/**
 * Interface for document references associated with claims
 */
export interface IClaimDocument {
  /**
   * Unique identifier for the document
   */
  id: string;

  /**
   * Type of document (e.g., 'receipt', 'prescription', 'medical_report')
   */
  type: string;

  /**
   * URL or path to access the document
   */
  url: string;

  /**
   * Date when the document was uploaded
   */
  uploadedAt: Date;

  /**
   * Optional metadata for the document
   */
  metadata?: Record<string, any>;
}

/**
 * Interface representing an insurance claim in the Plan Journey.
 * This interface defines the structure for claim data across all services.
 */
export interface IClaim {
  /**
   * Unique identifier for the claim
   */
  id: string;

  /**
   * ID of the user who submitted the claim
   */
  userId: string;

  /**
   * ID of the plan this claim is associated with
   */
  planId: string;

  /**
   * Type of claim (e.g., 'medical_visit', 'procedure', 'medication', 'exam')
   */
  type: string;

  /**
   * Claim amount in the local currency (BRL)
   */
  amount: number;

  /**
   * Current status of the claim using the standardized ClaimStatus enum
   */
  status: ClaimStatus;

  /**
   * Optional procedure code for medical claims
   */
  procedureCode?: string | null;

  /**
   * Date when the claim was submitted
   */
  submittedAt: Date;

  /**
   * Date when the claim was last processed or updated
   */
  processedAt: Date;

  /**
   * Documents associated with this claim (e.g., receipts, prescriptions)
   */
  documents?: IClaimDocument[];
}

/**
 * Type for creating a new claim
 * Omits system-generated fields like id, submittedAt, and processedAt
 */
export type ICreateClaim = Omit<IClaim, 'id' | 'submittedAt' | 'processedAt' | 'documents'> & {
  /**
   * Optional array of document IDs to associate with the claim
   */
  documentIds?: string[];
};

/**
 * Type for updating an existing claim
 * Makes all fields optional except id
 */
export type IUpdateClaim = Partial<Omit<IClaim, 'id' | 'userId' | 'planId'>> & {
  /**
   * Optional array of document IDs to associate with the claim
   */
  documentIds?: string[];
};

/**
 * Interface for claim events published to the event system
 */
export interface IClaimEvent {
  /**
   * Type of claim event
   */
  eventType: 'CLAIM_SUBMITTED' | 'CLAIM_APPROVED' | 'CLAIM_DENIED' | 'CLAIM_COMPLETED';

  /**
   * ID of the user associated with the claim
   */
  userId: string;

  /**
   * ID of the claim
   */
  claimId: string;

  /**
   * Type of claim
   */
  claimType: string;

  /**
   * Amount of the claim
   */
  amount: number;

  /**
   * Timestamp when the event occurred
   */
  timestamp: string;
}
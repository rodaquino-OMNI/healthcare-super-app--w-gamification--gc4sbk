/**
 * @file claim.interface.ts
 * @description Defines the IClaim interface and ClaimStatus enum for modeling insurance claim data
 * across the Plan Journey. This interface is used for type-safe claim schemas throughout the platform.
 */

import { IDocument } from '../../common/document.interface';

/**
 * Enum representing all possible statuses for an insurance claim.
 * This provides standardized type-safe values for claim processing states.
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
   * Additional information is required from the claimant to continue processing
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
   * Claim has been appealed after initial denial
   */
  APPEALED = 'APPEALED',

  /**
   * Claim has expired due to lack of response or required information
   */
  EXPIRED = 'EXPIRED',

  /**
   * Claim payment is being processed
   */
  PROCESSING = 'PROCESSING',

  /**
   * Claim processing has been completed successfully
   */
  COMPLETED = 'COMPLETED',

  /**
   * Claim has been cancelled by the claimant or administrator
   */
  CANCELLED = 'CANCELLED',

  /**
   * Claim processing has failed due to technical or administrative issues
   */
  FAILED = 'FAILED',

  /**
   * Claim has been denied after appeal with no further recourse
   */
  FINAL_DENIAL = 'FINAL_DENIAL',

  /**
   * Claim has been rejected due to invalid information or policy restrictions
   */
  REJECTED = 'REJECTED'
}

/**
 * Interface representing an insurance claim in the Plan Journey.
 * This provides a standardized structure for claim data across all services.
 */
export interface IClaim {
  /**
   * Unique identifier for the claim (UUID)
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
   * Current status of the claim using the ClaimStatus enum for type safety
   */
  status: ClaimStatus | string;

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
  documents?: IDocument[];

  /**
   * Optional additional metadata for the claim
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for creating a new claim
 */
export interface ICreateClaimInput {
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
   * Optional procedure code for medical claims
   */
  procedureCode?: string;

  /**
   * Optional IDs of documents to associate with this claim
   */
  documentIds?: string[];

  /**
   * Optional additional metadata for the claim
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for updating an existing claim
 */
export interface IUpdateClaimInput {
  /**
   * Type of claim (e.g., 'medical_visit', 'procedure', 'medication', 'exam')
   */
  type?: string;

  /**
   * Claim amount in the local currency (BRL)
   */
  amount?: number;

  /**
   * Current status of the claim using the ClaimStatus enum for type safety
   */
  status?: ClaimStatus | string;

  /**
   * Optional procedure code for medical claims
   */
  procedureCode?: string | null;

  /**
   * Optional IDs of documents to associate with this claim
   */
  documentIds?: string[];

  /**
   * Optional additional metadata for the claim
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for claim events published to the event system
 */
export interface IClaimEvent {
  /**
   * Type of event (e.g., 'CLAIM_SUBMITTED', 'CLAIM_APPROVED')
   */
  eventType: string;

  /**
   * ID of the user who submitted the claim
   */
  userId: string;

  /**
   * ID of the claim this event is associated with
   */
  claimId: string;

  /**
   * Type of claim (e.g., 'medical_visit', 'procedure', 'medication', 'exam')
   */
  claimType: string;

  /**
   * Claim amount in the local currency (BRL)
   */
  amount: number;

  /**
   * ISO timestamp when the event occurred
   */
  timestamp: string;

  /**
   * Optional additional data related to the event
   */
  metadata?: Record<string, any>;
}
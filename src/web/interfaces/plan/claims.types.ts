/**
 * @file Plan Claim Types
 * @description Defines TypeScript interfaces for insurance claims within the Plan journey.
 * These interfaces establish the contract for claim data structures used throughout the Plan journey
 * in both web and mobile applications.
 */

import { Document } from '@austa/interfaces/plan/documents.types';

/**
 * Represents the possible statuses of an insurance claim.
 * 
 * Claims follow a specific lifecycle from submission to resolution:
 * - pending: Initial state after submission, awaiting review
 * - in_review: Currently being evaluated by insurance staff
 * - additional_info_required: More information needed from the claimant
 * - approved: Claim has been approved for payment
 * - partially_approved: Claim has been approved for partial payment
 * - denied: Claim has been rejected
 * - appealed: Claim denial is being contested by the claimant
 * - closed: Claim process is complete (terminal state)
 */
export type ClaimStatus = 
  | 'pending' 
  | 'in_review' 
  | 'additional_info_required' 
  | 'approved' 
  | 'partially_approved' 
  | 'denied' 
  | 'appealed' 
  | 'closed';

/**
 * Represents the possible types of insurance claims.
 * 
 * Different claim types may have different processing rules, documentation requirements,
 * and approval workflows within the insurance system.
 */
export type ClaimType = 
  | 'medical' 
  | 'dental' 
  | 'vision' 
  | 'prescription' 
  | 'other';

/**
 * Represents the reason for a claim denial.
 * Used when a claim has status 'denied'.
 */
export type ClaimDenialReason = 
  | 'not_covered' 
  | 'out_of_network' 
  | 'pre_existing_condition' 
  | 'insufficient_documentation' 
  | 'duplicate_claim' 
  | 'exceeds_coverage_limit' 
  | 'other';

/**
 * Represents an insurance claim.
 * 
 * Claims are submitted by users to request reimbursement for healthcare expenses.
 * Each claim has a unique identifier, is associated with a specific insurance plan,
 * has a type classification, a monetary amount, a current status in the claim lifecycle,
 * a submission timestamp, and may have supporting documents attached.
 * 
 * @see Document - Claims may have associated documents as supporting evidence
 */
export interface Claim {
  /** Unique identifier for the claim */
  id: string;
  
  /** Reference to the insurance plan this claim is filed under */
  planId: string;
  
  /** Classification of the claim (e.g., medical, dental, vision) */
  type: ClaimType;
  
  /** Monetary amount being claimed in the plan's currency */
  amount: number;
  
  /** Current status in the claim lifecycle */
  status: ClaimStatus;
  
  /** ISO 8601 timestamp when the claim was submitted */
  submittedAt: string;
  
  /** Supporting documents attached to the claim */
  documents: Document[];
  
  /** Optional reason for denial if status is 'denied' */
  denialReason?: ClaimDenialReason;
  
  /** Optional ISO 8601 timestamp when the claim status was last updated */
  statusUpdatedAt?: string;
  
  /** Optional ISO 8601 timestamp when the claim was processed (approved/denied) */
  processedAt?: string;
  
  /** Optional notes from the insurance provider regarding the claim */
  providerNotes?: string;
  
  /** Optional reference number from the healthcare provider */
  providerReferenceNumber?: string;
  
  /** Optional service date or date range for the claimed service */
  serviceDate?: string;
  
  /** Optional healthcare provider information */
  providerInfo?: {
    name: string;
    address?: string;
    npi?: string; // National Provider Identifier
  };
}

/**
 * Represents a request to submit a new claim.
 */
export interface ClaimSubmissionRequest {
  /** The insurance plan ID this claim is filed under */
  planId: string;
  
  /** Classification of the claim */
  type: ClaimType;
  
  /** Monetary amount being claimed */
  amount: number;
  
  /** Optional service date for the claimed service */
  serviceDate?: string;
  
  /** Optional healthcare provider information */
  providerInfo?: {
    name: string;
    address?: string;
    npi?: string;
  };
  
  /** Optional reference number from the healthcare provider */
  providerReferenceNumber?: string;
  
  /** Optional description of the claim */
  description?: string;
}

/**
 * Represents a response from the claim submission API.
 */
export interface ClaimSubmissionResponse {
  /** The created claim object */
  claim: Claim;
  
  /** Whether the submission was successful */
  success: boolean;
  
  /** Any error message if the submission failed */
  error?: string;
  
  /** Optional document upload tokens for attaching documents to the claim */
  documentUploadTokens?: string[];
}

/**
 * Represents a request to update a claim's status.
 * Used internally by the insurance provider.
 */
export interface ClaimStatusUpdateRequest {
  /** The new status to set */
  status: ClaimStatus;
  
  /** Optional reason for denial if status is being set to 'denied' */
  denialReason?: ClaimDenialReason;
  
  /** Optional notes from the insurance provider */
  providerNotes?: string;
}

/**
 * Represents the valid status transitions for a claim.
 * This helps enforce proper claim lifecycle progression.
 */
export const VALID_CLAIM_STATUS_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  'pending': ['in_review', 'approved', 'denied', 'closed'],
  'in_review': ['additional_info_required', 'approved', 'partially_approved', 'denied', 'closed'],
  'additional_info_required': ['in_review', 'approved', 'partially_approved', 'denied', 'closed'],
  'approved': ['closed'],
  'partially_approved': ['appealed', 'closed'],
  'denied': ['appealed', 'closed'],
  'appealed': ['approved', 'partially_approved', 'denied', 'closed'],
  'closed': []
};
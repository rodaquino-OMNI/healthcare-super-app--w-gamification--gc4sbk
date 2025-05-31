/**
 * @file Claim Types
 * @description Defines TypeScript interfaces for insurance claims within the Plan journey.
 * These interfaces establish the contract for claim data structures used throughout the Plan journey
 * in both web and mobile applications. They are used by claim submission forms, claim listing components,
 * and any features that display or process insurance claims data.
 */

import { Document } from './documents.types';

/**
 * Represents the status of an insurance claim.
 * 
 * Claims follow a specific lifecycle from submission to resolution:
 * - 'pending': Initial state after submission, awaiting review
 * - 'in_review': Claim is being actively reviewed by insurance staff
 * - 'approved': Claim has been approved for payment
 * - 'partially_approved': Claim has been approved for partial payment
 * - 'denied': Claim has been rejected
 * - 'additional_info_required': More information is needed from the user
 * - 'appealed': User has appealed a denied claim
 * 
 * @example
 * ```typescript
 * const claimStatus: ClaimStatus = 'pending';
 * ```
 */
export type ClaimStatus = 
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'partially_approved'
  | 'denied'
  | 'additional_info_required'
  | 'appealed';

/**
 * Represents the type of an insurance claim.
 * 
 * Different claim types may have different processing rules, required documentation,
 * and reimbursement rates based on the insurance plan.
 * 
 * @example
 * ```typescript
 * const claimType: ClaimType = 'medical';
 * ```
 */
export type ClaimType = 
  | 'medical'
  | 'dental'
  | 'vision'
  | 'prescription'
  | 'mental_health'
  | 'preventive_care'
  | 'emergency'
  | 'other';

/**
 * Represents the reason for a claim denial.
 * Used to provide specific feedback when a claim is denied.
 */
export type ClaimDenialReason =
  | 'not_covered'
  | 'out_of_network'
  | 'pre_existing_condition'
  | 'insufficient_documentation'
  | 'duplicate_claim'
  | 'exceeds_coverage_limit'
  | 'expired_coverage'
  | 'other';

/**
 * Represents an insurance claim.
 * 
 * Claims are submitted by users to request reimbursement for healthcare expenses.
 * Each claim includes details about the service, cost, supporting documentation,
 * and tracks its status through the approval process.
 * 
 * @example
 * ```typescript
 * const claim: Claim = {
 *   id: 'claim-123',
 *   planId: 'plan-456',
 *   type: 'medical',
 *   amount: 150.75,
 *   status: 'pending',
 *   submittedAt: new Date('2023-06-10T14:30:00Z'),
 *   documents: []
 * };
 * ```
 * 
 * @see Document - Claims typically include supporting documentation
 */
export interface Claim {
  /**
   * Unique identifier for the claim
   */
  id: string;
  
  /**
   * Reference to the insurance plan under which the claim is filed
   */
  planId: string;
  
  /**
   * Classification of the claim based on service type
   */
  type: ClaimType;
  
  /**
   * Total amount being claimed in the plan's currency
   */
  amount: number;
  
  /**
   * Current status of the claim in the processing lifecycle
   */
  status: ClaimStatus;
  
  /**
   * Timestamp when the claim was submitted
   * Stored as an ISO date string in the database but typed as Date for frontend usage
   */
  submittedAt: Date | string;
  
  /**
   * Supporting documentation attached to the claim
   */
  documents: Document[];
  
  /**
   * Service provider information (doctor, hospital, pharmacy, etc.)
   * Optional as it may not be available for all claim types
   */
  provider?: {
    name: string;
    id?: string;
    address?: string;
  };
  
  /**
   * Date when the service was provided
   * Optional as it may not be applicable for all claim types
   */
  serviceDate?: Date | string;
  
  /**
   * Brief description of the service or reason for the claim
   * Optional but recommended for clarity
   */
  description?: string;
  
  /**
   * Reason for denial if the claim status is 'denied'
   * Only present for denied claims
   */
  denialReason?: ClaimDenialReason;
  
  /**
   * Amount approved for reimbursement
   * Only present for approved or partially approved claims
   */
  approvedAmount?: number;
  
  /**
   * Date when the claim was processed
   * Only present for claims that have been reviewed
   */
  processedAt?: Date | string;
}

/**
 * Represents a claim submission request from the user.
 * Used when creating a new claim in the system.
 */
export interface ClaimSubmissionRequest {
  /**
   * Reference to the insurance plan under which the claim is filed
   */
  planId: string;
  
  /**
   * Classification of the claim based on service type
   */
  type: ClaimType;
  
  /**
   * Total amount being claimed in the plan's currency
   */
  amount: number;
  
  /**
   * Service provider information
   */
  provider?: {
    name: string;
    id?: string;
    address?: string;
  };
  
  /**
   * Date when the service was provided
   */
  serviceDate?: Date | string;
  
  /**
   * Brief description of the service or reason for the claim
   */
  description?: string;
  
  /**
   * IDs of documents already uploaded and associated with this claim
   */
  documentIds: string[];
}

/**
 * Represents a request to update the status of an existing claim.
 * Used by administrators or the system to progress claims through their lifecycle.
 */
export interface ClaimStatusUpdateRequest {
  /**
   * New status to apply to the claim
   */
  status: ClaimStatus;
  
  /**
   * Reason for denial if the new status is 'denied'
   */
  denialReason?: ClaimDenialReason;
  
  /**
   * Amount approved for reimbursement if the new status is 'approved' or 'partially_approved'
   */
  approvedAmount?: number;
  
  /**
   * Additional information or comments about the status update
   */
  notes?: string;
}
/**
 * @file Plan API Interfaces
 * @description Defines TypeScript interfaces for the Plan journey API, including request/response types
 * for insurance plans, claims, coverage, and benefits. These interfaces ensure type safety for all
 * Plan journey operations and maintain data integrity for insurance-related functionality.
 */

import { 
  Benefit, 
  Claim, 
  ClaimStatus, 
  ClaimType, 
  Coverage, 
  CoverageType, 
  Plan, 
  PlanType 
} from '../common';

/**
 * Document types that can be uploaded for claims
 */
export enum ClaimDocumentType {
  RECEIPT = 'receipt',
  INVOICE = 'invoice',
  MEDICAL_REPORT = 'medical_report',
  PRESCRIPTION = 'prescription',
  REFERRAL = 'referral',
  EXPLANATION_OF_BENEFITS = 'explanation_of_benefits',
  OTHER = 'other'
}

/**
 * Document upload metadata
 */
export interface DocumentUploadMetadata {
  type: ClaimDocumentType;
  description?: string;
  relatedDate?: string; // ISO date string
  tags?: string[];
}

/**
 * Document upload response
 */
export interface DocumentUploadResponse {
  id: string;
  type: ClaimDocumentType;
  filePath: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
}

/**
 * Base interface for paginated requests
 */
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Base interface for paginated responses
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// ==================== PLAN API INTERFACES ====================

/**
 * Request to fetch user's plans
 */
export interface GetUserPlansRequest extends PaginatedRequest {
  status?: 'active' | 'expired' | 'all';
  type?: PlanType;
}

/**
 * Response for user's plans
 */
export interface GetUserPlansResponse extends PaginatedResponse<Plan> {}

/**
 * Request to fetch a specific plan
 */
export interface GetPlanRequest {
  planId: string;
}

/**
 * Response for a specific plan
 */
export interface GetPlanResponse {
  plan: Plan;
}

/**
 * Request to update plan details
 * (Only certain fields can be updated by the user)
 */
export interface UpdatePlanRequest {
  planId: string;
  nickname?: string;
  notes?: string;
  contactPreferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}

/**
 * Response for plan update
 */
export interface UpdatePlanResponse {
  plan: Plan;
}

// ==================== COVERAGE API INTERFACES ====================

/**
 * Request to fetch coverages for a plan
 */
export interface GetCoveragesRequest extends PaginatedRequest {
  planId: string;
  type?: CoverageType;
}

/**
 * Response for coverages
 */
export interface GetCoveragesResponse extends PaginatedResponse<Coverage> {}

/**
 * Request to fetch a specific coverage
 */
export interface GetCoverageRequest {
  coverageId: string;
}

/**
 * Response for a specific coverage
 */
export interface GetCoverageResponse {
  coverage: Coverage;
}

// ==================== BENEFIT API INTERFACES ====================

/**
 * Request to fetch benefits for a plan
 */
export interface GetBenefitsRequest extends PaginatedRequest {
  planId: string;
  type?: string;
  used?: boolean; // Filter for used/unused benefits
}

/**
 * Response for benefits
 */
export interface GetBenefitsResponse extends PaginatedResponse<Benefit> {}

/**
 * Request to fetch a specific benefit
 */
export interface GetBenefitRequest {
  benefitId: string;
}

/**
 * Response for a specific benefit
 */
export interface GetBenefitResponse {
  benefit: Benefit;
}

/**
 * Request to update benefit usage
 */
export interface UpdateBenefitUsageRequest {
  benefitId: string;
  usage: string;
}

/**
 * Response for benefit usage update
 */
export interface UpdateBenefitUsageResponse {
  benefit: Benefit;
}

// ==================== CLAIM API INTERFACES ====================

/**
 * Request to fetch claims for a plan
 */
export interface GetClaimsRequest extends PaginatedRequest {
  planId: string;
  status?: ClaimStatus;
  type?: ClaimType;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * Response for claims
 */
export interface GetClaimsResponse extends PaginatedResponse<Claim> {}

/**
 * Request to fetch a specific claim
 */
export interface GetClaimRequest {
  claimId: string;
}

/**
 * Response for a specific claim
 */
export interface GetClaimResponse {
  claim: Claim;
}

/**
 * Request to create a new claim
 */
export interface CreateClaimRequest {
  planId: string;
  type: ClaimType;
  amount: number;
  serviceDate: string; // ISO date string
  providerName?: string;
  providerNPI?: string; // National Provider Identifier
  diagnosis?: string;
  notes?: string;
  documentIds?: string[]; // IDs of previously uploaded documents
}

/**
 * Response for claim creation
 */
export interface CreateClaimResponse {
  claim: Claim;
  nextSteps?: string[];
}

/**
 * Request to update an existing claim
 */
export interface UpdateClaimRequest {
  claimId: string;
  amount?: number;
  providerName?: string;
  providerNPI?: string;
  diagnosis?: string;
  notes?: string;
  documentIds?: string[];
}

/**
 * Response for claim update
 */
export interface UpdateClaimResponse {
  claim: Claim;
}

/**
 * Request to cancel a claim
 */
export interface CancelClaimRequest {
  claimId: string;
  reason: string;
}

/**
 * Response for claim cancellation
 */
export interface CancelClaimResponse {
  success: boolean;
  message: string;
}

/**
 * Request to add documents to a claim
 */
export interface AddClaimDocumentsRequest {
  claimId: string;
  documentIds: string[];
}

/**
 * Response for adding documents to a claim
 */
export interface AddClaimDocumentsResponse {
  claim: Claim;
}

/**
 * Request to remove a document from a claim
 */
export interface RemoveClaimDocumentRequest {
  claimId: string;
  documentId: string;
}

/**
 * Response for removing a document from a claim
 */
export interface RemoveClaimDocumentResponse {
  claim: Claim;
}

/**
 * Request to submit additional information for a claim
 */
export interface SubmitAdditionalClaimInfoRequest {
  claimId: string;
  information: string;
  documentIds?: string[];
}

/**
 * Response for submitting additional information
 */
export interface SubmitAdditionalClaimInfoResponse {
  claim: Claim;
  status: ClaimStatus;
}

/**
 * Request to get claim status history
 */
export interface GetClaimStatusHistoryRequest {
  claimId: string;
}

/**
 * Claim status history entry
 */
export interface ClaimStatusHistoryEntry {
  status: ClaimStatus;
  timestamp: string;
  notes?: string;
  updatedBy?: string;
}

/**
 * Response for claim status history
 */
export interface GetClaimStatusHistoryResponse {
  claimId: string;
  history: ClaimStatusHistoryEntry[];
}

/**
 * Request to get claim documents
 */
export interface GetClaimDocumentsRequest {
  claimId: string;
}

/**
 * Response for claim documents
 */
export interface GetClaimDocumentsResponse {
  claimId: string;
  documents: DocumentUploadResponse[];
}

// ==================== DOCUMENT API INTERFACES ====================

/**
 * Request to upload a document
 * Note: This is typically handled via multipart/form-data
 * and not directly as JSON
 */
export interface UploadDocumentRequest {
  file: File; // Browser File object
  metadata: DocumentUploadMetadata;
}

/**
 * Response for document upload
 */
export interface UploadDocumentResponse {
  document: DocumentUploadResponse;
}

/**
 * Request to get document details
 */
export interface GetDocumentRequest {
  documentId: string;
}

/**
 * Response for document details
 */
export interface GetDocumentResponse {
  document: DocumentUploadResponse;
}

/**
 * Request to update document metadata
 */
export interface UpdateDocumentMetadataRequest {
  documentId: string;
  metadata: Partial<DocumentUploadMetadata>;
}

/**
 * Response for document metadata update
 */
export interface UpdateDocumentMetadataResponse {
  document: DocumentUploadResponse;
}

/**
 * Request to delete a document
 */
export interface DeleteDocumentRequest {
  documentId: string;
}

/**
 * Response for document deletion
 */
export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}

// ==================== NOTIFICATION PREFERENCES INTERFACES ====================

/**
 * Plan journey notification types
 */
export enum PlanNotificationType {
  CLAIM_STATUS_CHANGE = 'claim_status_change',
  CLAIM_ADDITIONAL_INFO_REQUIRED = 'claim_additional_info_required',
  CLAIM_PAYMENT_PROCESSED = 'claim_payment_processed',
  PLAN_EXPIRATION_REMINDER = 'plan_expiration_reminder',
  BENEFIT_USAGE_REMINDER = 'benefit_usage_reminder'
}

/**
 * Request to update plan notification preferences
 */
export interface UpdatePlanNotificationPreferencesRequest {
  userId: string;
  preferences: {
    [key in PlanNotificationType]?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      inApp?: boolean;
    };
  };
}

/**
 * Response for plan notification preferences update
 */
export interface UpdatePlanNotificationPreferencesResponse {
  preferences: {
    [key in PlanNotificationType]: {
      email: boolean;
      sms: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}

/**
 * Request to get plan notification preferences
 */
export interface GetPlanNotificationPreferencesRequest {
  userId: string;
}

/**
 * Response for plan notification preferences
 */
export interface GetPlanNotificationPreferencesResponse {
  preferences: {
    [key in PlanNotificationType]: {
      email: boolean;
      sms: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}
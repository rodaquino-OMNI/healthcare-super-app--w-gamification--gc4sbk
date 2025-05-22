import { ErrorType } from '../../../../shared/src/exceptions/exceptions.types';

/**
 * Enum representing different error domains within the Plan journey.
 * Used to categorize exceptions for consistent error handling across Plan services.
 */
export enum PlanErrorDomain {
  /**
   * Errors related to insurance plans management
   */
  PLANS = 'plans',
  
  /**
   * Errors related to benefits management
   */
  BENEFITS = 'benefits',
  
  /**
   * Errors related to coverage determination
   */
  COVERAGE = 'coverage',
  
  /**
   * Errors related to claims processing
   */
  CLAIMS = 'claims',
  
  /**
   * Errors related to document management
   */
  DOCUMENTS = 'documents'
}

/**
 * Enum representing specific error types within the Plans domain.
 */
export enum PlanErrorType {
  /**
   * Plan not found in the system
   */
  PLAN_NOT_FOUND = 'plan_not_found',
  
  /**
   * Plan eligibility verification failed
   */
  ELIGIBILITY_VERIFICATION_FAILED = 'eligibility_verification_failed',
  
  /**
   * Plan comparison operation failed
   */
  PLAN_COMPARISON_FAILED = 'plan_comparison_failed',
  
  /**
   * Plan enrollment process failed
   */
  ENROLLMENT_FAILED = 'enrollment_failed',
  
  /**
   * Plan details retrieval failed
   */
  PLAN_DETAILS_RETRIEVAL_FAILED = 'plan_details_retrieval_failed',
  
  /**
   * Plan search operation failed
   */
  PLAN_SEARCH_FAILED = 'plan_search_failed'
}

/**
 * Enum representing specific error types within the Benefits domain.
 */
export enum BenefitErrorType {
  /**
   * Benefit not found in the system
   */
  BENEFIT_NOT_FOUND = 'benefit_not_found',
  
  /**
   * Benefit eligibility verification failed
   */
  BENEFIT_ELIGIBILITY_FAILED = 'benefit_eligibility_failed',
  
  /**
   * Benefit usage tracking failed
   */
  BENEFIT_USAGE_TRACKING_FAILED = 'benefit_usage_tracking_failed',
  
  /**
   * Benefit details retrieval failed
   */
  BENEFIT_DETAILS_FAILED = 'benefit_details_failed',
  
  /**
   * Benefit limit exceeded
   */
  BENEFIT_LIMIT_EXCEEDED = 'benefit_limit_exceeded'
}

/**
 * Enum representing specific error types within the Coverage domain.
 */
export enum CoverageErrorType {
  /**
   * Coverage verification failed
   */
  COVERAGE_VERIFICATION_FAILED = 'coverage_verification_failed',
  
  /**
   * Coverage determination failed
   */
  COVERAGE_DETERMINATION_FAILED = 'coverage_determination_failed',
  
  /**
   * Network provider verification failed
   */
  NETWORK_VERIFICATION_FAILED = 'network_verification_failed',
  
  /**
   * Prior authorization verification failed
   */
  PRIOR_AUTH_VERIFICATION_FAILED = 'prior_auth_verification_failed',
  
  /**
   * Coverage details retrieval failed
   */
  COVERAGE_DETAILS_FAILED = 'coverage_details_failed'
}

/**
 * Enum representing specific error types within the Claims domain.
 */
export enum ClaimErrorType {
  /**
   * Claim not found in the system
   */
  CLAIM_NOT_FOUND = 'claim_not_found',
  
  /**
   * Claim submission failed
   */
  CLAIM_SUBMISSION_FAILED = 'claim_submission_failed',
  
  /**
   * Claim status retrieval failed
   */
  CLAIM_STATUS_FAILED = 'claim_status_failed',
  
  /**
   * Claim documentation incomplete
   */
  CLAIM_DOCUMENTATION_INCOMPLETE = 'claim_documentation_incomplete',
  
  /**
   * Claim processing failed
   */
  CLAIM_PROCESSING_FAILED = 'claim_processing_failed',
  
  /**
   * Claim adjustment failed
   */
  CLAIM_ADJUSTMENT_FAILED = 'claim_adjustment_failed'
}

/**
 * Enum representing specific error types within the Documents domain.
 */
export enum DocumentErrorType {
  /**
   * Document not found in the system
   */
  DOCUMENT_NOT_FOUND = 'document_not_found',
  
  /**
   * Document upload failed
   */
  DOCUMENT_UPLOAD_FAILED = 'document_upload_failed',
  
  /**
   * Document download failed
   */
  DOCUMENT_DOWNLOAD_FAILED = 'document_download_failed',
  
  /**
   * Document validation failed
   */
  DOCUMENT_VALIDATION_FAILED = 'document_validation_failed',
  
  /**
   * Document processing failed
   */
  DOCUMENT_PROCESSING_FAILED = 'document_processing_failed',
  
  /**
   * Document storage failed
   */
  DOCUMENT_STORAGE_FAILED = 'document_storage_failed'
}

/**
 * Error code constants for Plan domain errors.
 * These constants provide standardized error codes for monitoring and troubleshooting.
 */
export const PLAN_ERROR_CODES = {
  // Plan domain error codes
  PLAN_NOT_FOUND: 'PLAN_PLANS_001',
  PLAN_ELIGIBILITY_VERIFICATION_FAILED: 'PLAN_PLANS_002',
  PLAN_COMPARISON_FAILED: 'PLAN_PLANS_003',
  PLAN_ENROLLMENT_FAILED: 'PLAN_PLANS_004',
  PLAN_DETAILS_RETRIEVAL_FAILED: 'PLAN_PLANS_005',
  PLAN_SEARCH_FAILED: 'PLAN_PLANS_006',
  
  // Benefit domain error codes
  BENEFIT_NOT_FOUND: 'PLAN_BENEFITS_001',
  BENEFIT_ELIGIBILITY_FAILED: 'PLAN_BENEFITS_002',
  BENEFIT_USAGE_TRACKING_FAILED: 'PLAN_BENEFITS_003',
  BENEFIT_DETAILS_FAILED: 'PLAN_BENEFITS_004',
  BENEFIT_LIMIT_EXCEEDED: 'PLAN_BENEFITS_005',
  
  // Coverage domain error codes
  COVERAGE_VERIFICATION_FAILED: 'PLAN_COVERAGE_001',
  COVERAGE_DETERMINATION_FAILED: 'PLAN_COVERAGE_002',
  NETWORK_VERIFICATION_FAILED: 'PLAN_COVERAGE_003',
  PRIOR_AUTH_VERIFICATION_FAILED: 'PLAN_COVERAGE_004',
  COVERAGE_DETAILS_FAILED: 'PLAN_COVERAGE_005',
  
  // Claims domain error codes
  CLAIM_NOT_FOUND: 'PLAN_CLAIMS_001',
  CLAIM_SUBMISSION_FAILED: 'PLAN_CLAIMS_002',
  CLAIM_STATUS_FAILED: 'PLAN_CLAIMS_003',
  CLAIM_DOCUMENTATION_INCOMPLETE: 'PLAN_CLAIMS_004',
  CLAIM_PROCESSING_FAILED: 'PLAN_CLAIMS_005',
  CLAIM_ADJUSTMENT_FAILED: 'PLAN_CLAIMS_006',
  
  // Documents domain error codes
  DOCUMENT_NOT_FOUND: 'PLAN_DOCUMENTS_001',
  DOCUMENT_UPLOAD_FAILED: 'PLAN_DOCUMENTS_002',
  DOCUMENT_DOWNLOAD_FAILED: 'PLAN_DOCUMENTS_003',
  DOCUMENT_VALIDATION_FAILED: 'PLAN_DOCUMENTS_004',
  DOCUMENT_PROCESSING_FAILED: 'PLAN_DOCUMENTS_005',
  DOCUMENT_STORAGE_FAILED: 'PLAN_DOCUMENTS_006'
} as const;

/**
 * Type representing all possible Plan error codes.
 */
export type PlanErrorCode = typeof PLAN_ERROR_CODES[keyof typeof PLAN_ERROR_CODES];

/**
 * Interface for Plan error context containing domain-specific information.
 */
export interface PlanErrorContext {
  /**
   * The specific domain within the Plan journey where the error occurred.
   */
  domain: PlanErrorDomain;
  
  /**
   * Additional context-specific data related to the error.
   */
  data?: Record<string, any>;
}

/**
 * Interface for Plan-specific error details.
 */
export interface PlanErrorDetails {
  /**
   * The error code identifying the specific error.
   */
  code: PlanErrorCode;
  
  /**
   * The error type from ErrorType enum.
   */
  type: ErrorType;
  
  /**
   * Human-readable error message.
   */
  message: string;
  
  /**
   * Additional context about the error.
   */
  context: PlanErrorContext;
}

/**
 * Interface for Plan domain error payload.
 */
export interface PlanErrorPayload {
  /**
   * Plan ID related to the error, if applicable.
   */
  planId?: string;
  
  /**
   * User ID related to the error, if applicable.
   */
  userId?: string;
  
  /**
   * Operation that was being performed when the error occurred.
   */
  operation?: string;
  
  /**
   * Additional data related to the error.
   */
  data?: Record<string, any>;
}

/**
 * Interface for Benefit domain error payload.
 */
export interface BenefitErrorPayload {
  /**
   * Benefit ID related to the error, if applicable.
   */
  benefitId?: string;
  
  /**
   * Plan ID related to the error, if applicable.
   */
  planId?: string;
  
  /**
   * User ID related to the error, if applicable.
   */
  userId?: string;
  
  /**
   * Operation that was being performed when the error occurred.
   */
  operation?: string;
  
  /**
   * Additional data related to the error.
   */
  data?: Record<string, any>;
}

/**
 * Interface for Coverage domain error payload.
 */
export interface CoverageErrorPayload {
  /**
   * Coverage ID related to the error, if applicable.
   */
  coverageId?: string;
  
  /**
   * Plan ID related to the error, if applicable.
   */
  planId?: string;
  
  /**
   * Service or procedure code related to the error, if applicable.
   */
  serviceCode?: string;
  
  /**
   * Provider ID related to the error, if applicable.
   */
  providerId?: string;
  
  /**
   * User ID related to the error, if applicable.
   */
  userId?: string;
  
  /**
   * Operation that was being performed when the error occurred.
   */
  operation?: string;
  
  /**
   * Additional data related to the error.
   */
  data?: Record<string, any>;
}

/**
 * Interface for Claim domain error payload.
 */
export interface ClaimErrorPayload {
  /**
   * Claim ID related to the error, if applicable.
   */
  claimId?: string;
  
  /**
   * Plan ID related to the error, if applicable.
   */
  planId?: string;
  
  /**
   * Provider ID related to the error, if applicable.
   */
  providerId?: string;
  
  /**
   * Service date related to the error, if applicable.
   */
  serviceDate?: string;
  
  /**
   * User ID related to the error, if applicable.
   */
  userId?: string;
  
  /**
   * Operation that was being performed when the error occurred.
   */
  operation?: string;
  
  /**
   * Additional data related to the error.
   */
  data?: Record<string, any>;
}

/**
 * Interface for Document domain error payload.
 */
export interface DocumentErrorPayload {
  /**
   * Document ID related to the error, if applicable.
   */
  documentId?: string;
  
  /**
   * Document type related to the error, if applicable.
   */
  documentType?: string;
  
  /**
   * Claim ID related to the error, if applicable.
   */
  claimId?: string;
  
  /**
   * Plan ID related to the error, if applicable.
   */
  planId?: string;
  
  /**
   * User ID related to the error, if applicable.
   */
  userId?: string;
  
  /**
   * Operation that was being performed when the error occurred.
   */
  operation?: string;
  
  /**
   * Additional data related to the error.
   */
  data?: Record<string, any>;
}

/**
 * Type guard to check if an error is related to the Plan domain.
 * @param error - The error to check
 * @returns True if the error is a Plan domain error
 */
export function isPlanError(error: any): error is PlanErrorDetails {
  return (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('PLAN_')
  );
}

/**
 * Type guard to check if an error is related to the Plans subdomain.
 * @param error - The error to check
 * @returns True if the error is a Plans subdomain error
 */
export function isPlansDomainError(error: any): error is PlanErrorDetails {
  return (
    isPlanError(error) &&
    error.context &&
    error.context.domain === PlanErrorDomain.PLANS
  );
}

/**
 * Type guard to check if an error is related to the Benefits subdomain.
 * @param error - The error to check
 * @returns True if the error is a Benefits subdomain error
 */
export function isBenefitsDomainError(error: any): error is PlanErrorDetails {
  return (
    isPlanError(error) &&
    error.context &&
    error.context.domain === PlanErrorDomain.BENEFITS
  );
}

/**
 * Type guard to check if an error is related to the Coverage subdomain.
 * @param error - The error to check
 * @returns True if the error is a Coverage subdomain error
 */
export function isCoverageDomainError(error: any): error is PlanErrorDetails {
  return (
    isPlanError(error) &&
    error.context &&
    error.context.domain === PlanErrorDomain.COVERAGE
  );
}

/**
 * Type guard to check if an error is related to the Claims subdomain.
 * @param error - The error to check
 * @returns True if the error is a Claims subdomain error
 */
export function isClaimsDomainError(error: any): error is PlanErrorDetails {
  return (
    isPlanError(error) &&
    error.context &&
    error.context.domain === PlanErrorDomain.CLAIMS
  );
}

/**
 * Type guard to check if an error is related to the Documents subdomain.
 * @param error - The error to check
 * @returns True if the error is a Documents subdomain error
 */
export function isDocumentsDomainError(error: any): error is PlanErrorDetails {
  return (
    isPlanError(error) &&
    error.context &&
    error.context.domain === PlanErrorDomain.DOCUMENTS
  );
}
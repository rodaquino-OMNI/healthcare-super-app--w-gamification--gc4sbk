import { ErrorType, AppException } from '../../../../shared/src/exceptions/exceptions.types';

/**
 * Enum representing different types of errors in the Plan journey.
 * Used to categorize exceptions for consistent error handling across Plan services.
 */
export enum PlanErrorType {
  /**
   * Plan-related errors - issues with plan data, validation, or operations
   */
  PLAN = 'plan',
  
  /**
   * Benefits-related errors - issues with benefit data, validation, or operations
   */
  BENEFITS = 'benefits',
  
  /**
   * Coverage-related errors - issues with coverage data, validation, or operations
   */
  COVERAGE = 'coverage',
  
  /**
   * Claims-related errors - issues with claim data, validation, or operations
   */
  CLAIMS = 'claims',
  
  /**
   * Documents-related errors - issues with document data, validation, or operations
   */
  DOCUMENTS = 'documents'
}

/**
 * Enum representing different error categories within the Plans subdomain.
 */
export enum PlanErrorCategory {
  NOT_FOUND = 'not_found',
  INVALID_DATA = 'invalid_data',
  EXPIRED = 'expired',
  DUPLICATE = 'duplicate',
  ACCESS_DENIED = 'access_denied'
}

/**
 * Enum representing different error categories within the Benefits subdomain.
 */
export enum BenefitsErrorCategory {
  NOT_FOUND = 'not_found',
  INVALID_DATA = 'invalid_data',
  LIMIT_EXCEEDED = 'limit_exceeded',
  EXPIRED = 'expired',
  INELIGIBLE = 'ineligible'
}

/**
 * Enum representing different error categories within the Coverage subdomain.
 */
export enum CoverageErrorCategory {
  NOT_FOUND = 'not_found',
  INVALID_DATA = 'invalid_data',
  NOT_COVERED = 'not_covered',
  LIMIT_EXCEEDED = 'limit_exceeded',
  WAITING_PERIOD = 'waiting_period'
}

/**
 * Enum representing different error categories within the Claims subdomain.
 */
export enum ClaimsErrorCategory {
  NOT_FOUND = 'not_found',
  INVALID_DATA = 'invalid_data',
  DUPLICATE = 'duplicate',
  INELIGIBLE = 'ineligible',
  EXPIRED = 'expired',
  PROCESSING_ERROR = 'processing_error',
  DOCUMENT_ERROR = 'document_error',
  STATUS_TRANSITION_ERROR = 'status_transition_error'
}

/**
 * Enum representing different error categories within the Documents subdomain.
 */
export enum DocumentsErrorCategory {
  NOT_FOUND = 'not_found',
  INVALID_DATA = 'invalid_data',
  UPLOAD_ERROR = 'upload_error',
  SIZE_EXCEEDED = 'size_exceeded',
  TYPE_NOT_SUPPORTED = 'type_not_supported',
  STORAGE_ERROR = 'storage_error',
  ACCESS_DENIED = 'access_denied'
}

/**
 * Plan error code constants for standardized error identification.
 * Format: PLAN_<SUBDOMAIN>_<CATEGORY>_<SPECIFIC_ERROR>
 */

// Plan error codes
export const PLAN_NOT_FOUND = 'PLAN_001';
export const PLAN_INVALID_DATA = 'PLAN_002';
export const PLAN_EXPIRED = 'PLAN_003';
export const PLAN_ACCESS_DENIED = 'PLAN_004';
export const PLAN_DUPLICATE = 'PLAN_005';

// Existing error codes from shared constants
export const PLAN_INVALID_CLAIM_DATA = 'PLAN_001';
export const PLAN_COVERAGE_VERIFICATION_FAILED_LEGACY = 'PLAN_002';

// Benefits error codes
export const PLAN_BENEFITS_NOT_FOUND = 'PLAN_BENEFITS_001';
export const PLAN_BENEFITS_INVALID_DATA = 'PLAN_BENEFITS_002';
export const PLAN_BENEFITS_LIMIT_EXCEEDED = 'PLAN_BENEFITS_003';
export const PLAN_BENEFITS_EXPIRED = 'PLAN_BENEFITS_004';
export const PLAN_BENEFITS_INELIGIBLE = 'PLAN_BENEFITS_005';

// Coverage error codes
export const PLAN_COVERAGE_NOT_FOUND = 'PLAN_COVERAGE_001';
export const PLAN_COVERAGE_INVALID_DATA = 'PLAN_COVERAGE_002';
export const PLAN_COVERAGE_NOT_COVERED = 'PLAN_COVERAGE_003';
export const PLAN_COVERAGE_LIMIT_EXCEEDED = 'PLAN_COVERAGE_004';
export const PLAN_COVERAGE_WAITING_PERIOD = 'PLAN_COVERAGE_005';
export const PLAN_COVERAGE_VERIFICATION_FAILED = 'PLAN_COVERAGE_006';

// Claims error codes
export const PLAN_CLAIMS_NOT_FOUND = 'PLAN_CLAIMS_001';
export const PLAN_CLAIMS_INVALID_DATA = 'PLAN_CLAIMS_002';
export const PLAN_CLAIMS_DUPLICATE = 'PLAN_CLAIMS_003';
export const PLAN_CLAIMS_INELIGIBLE = 'PLAN_CLAIMS_004';
export const PLAN_CLAIMS_EXPIRED = 'PLAN_CLAIMS_005';
export const PLAN_CLAIMS_PROCESSING_ERROR = 'PLAN_CLAIMS_006';
export const PLAN_CLAIMS_DOCUMENT_ERROR = 'PLAN_CLAIMS_007';
export const PLAN_CLAIMS_STATUS_TRANSITION_ERROR = 'PLAN_CLAIMS_008';

// Documents error codes
export const PLAN_DOCUMENTS_NOT_FOUND = 'PLAN_DOCUMENTS_001';
export const PLAN_DOCUMENTS_INVALID_DATA = 'PLAN_DOCUMENTS_002';
export const PLAN_DOCUMENTS_UPLOAD_ERROR = 'PLAN_DOCUMENTS_003';
export const PLAN_DOCUMENTS_SIZE_EXCEEDED = 'PLAN_DOCUMENTS_004';
export const PLAN_DOCUMENTS_TYPE_NOT_SUPPORTED = 'PLAN_DOCUMENTS_005';
export const PLAN_DOCUMENTS_STORAGE_ERROR = 'PLAN_DOCUMENTS_006';
export const PLAN_DOCUMENTS_ACCESS_DENIED = 'PLAN_DOCUMENTS_007';

/**
 * Mapping of error codes to their corresponding error types and categories.
 * Used for error classification and handling.
 */
export const PLAN_ERROR_CODE_MAP: Record<string, { type: ErrorType; planType: PlanErrorType; category: string }> = {
  // Legacy error codes (for backward compatibility)
  [PLAN_INVALID_CLAIM_DATA]: { type: ErrorType.VALIDATION, planType: PlanErrorType.CLAIMS, category: ClaimsErrorCategory.INVALID_DATA },
  [PLAN_COVERAGE_VERIFICATION_FAILED_LEGACY]: { type: ErrorType.TECHNICAL, planType: PlanErrorType.COVERAGE, category: CoverageErrorCategory.NOT_COVERED },
  
  // Plan error codes
  [PLAN_NOT_FOUND]: { type: ErrorType.BUSINESS, planType: PlanErrorType.PLAN, category: PlanErrorCategory.NOT_FOUND },
  [PLAN_INVALID_DATA]: { type: ErrorType.VALIDATION, planType: PlanErrorType.PLAN, category: PlanErrorCategory.INVALID_DATA },
  [PLAN_EXPIRED]: { type: ErrorType.BUSINESS, planType: PlanErrorType.PLAN, category: PlanErrorCategory.EXPIRED },
  [PLAN_ACCESS_DENIED]: { type: ErrorType.BUSINESS, planType: PlanErrorType.PLAN, category: PlanErrorCategory.ACCESS_DENIED },
  [PLAN_DUPLICATE]: { type: ErrorType.BUSINESS, planType: PlanErrorType.PLAN, category: PlanErrorCategory.DUPLICATE },
  
  // Benefits error codes
  [PLAN_BENEFITS_NOT_FOUND]: { type: ErrorType.BUSINESS, planType: PlanErrorType.BENEFITS, category: BenefitsErrorCategory.NOT_FOUND },
  [PLAN_BENEFITS_INVALID_DATA]: { type: ErrorType.VALIDATION, planType: PlanErrorType.BENEFITS, category: BenefitsErrorCategory.INVALID_DATA },
  [PLAN_BENEFITS_LIMIT_EXCEEDED]: { type: ErrorType.BUSINESS, planType: PlanErrorType.BENEFITS, category: BenefitsErrorCategory.LIMIT_EXCEEDED },
  [PLAN_BENEFITS_EXPIRED]: { type: ErrorType.BUSINESS, planType: PlanErrorType.BENEFITS, category: BenefitsErrorCategory.EXPIRED },
  [PLAN_BENEFITS_INELIGIBLE]: { type: ErrorType.BUSINESS, planType: PlanErrorType.BENEFITS, category: BenefitsErrorCategory.INELIGIBLE },
  
  // Coverage error codes
  [PLAN_COVERAGE_NOT_FOUND]: { type: ErrorType.BUSINESS, planType: PlanErrorType.COVERAGE, category: CoverageErrorCategory.NOT_FOUND },
  [PLAN_COVERAGE_INVALID_DATA]: { type: ErrorType.VALIDATION, planType: PlanErrorType.COVERAGE, category: CoverageErrorCategory.INVALID_DATA },
  [PLAN_COVERAGE_NOT_COVERED]: { type: ErrorType.BUSINESS, planType: PlanErrorType.COVERAGE, category: CoverageErrorCategory.NOT_COVERED },
  [PLAN_COVERAGE_LIMIT_EXCEEDED]: { type: ErrorType.BUSINESS, planType: PlanErrorType.COVERAGE, category: CoverageErrorCategory.LIMIT_EXCEEDED },
  [PLAN_COVERAGE_WAITING_PERIOD]: { type: ErrorType.BUSINESS, planType: PlanErrorType.COVERAGE, category: CoverageErrorCategory.WAITING_PERIOD },
  [PLAN_COVERAGE_VERIFICATION_FAILED]: { type: ErrorType.TECHNICAL, planType: PlanErrorType.COVERAGE, category: CoverageErrorCategory.NOT_COVERED },
  
  // Claims error codes
  [PLAN_CLAIMS_NOT_FOUND]: { type: ErrorType.BUSINESS, planType: PlanErrorType.CLAIMS, category: ClaimsErrorCategory.NOT_FOUND },
  [PLAN_CLAIMS_INVALID_DATA]: { type: ErrorType.VALIDATION, planType: PlanErrorType.CLAIMS, category: ClaimsErrorCategory.INVALID_DATA },
  [PLAN_CLAIMS_DUPLICATE]: { type: ErrorType.BUSINESS, planType: PlanErrorType.CLAIMS, category: ClaimsErrorCategory.DUPLICATE },
  [PLAN_CLAIMS_INELIGIBLE]: { type: ErrorType.BUSINESS, planType: PlanErrorType.CLAIMS, category: ClaimsErrorCategory.INELIGIBLE },
  [PLAN_CLAIMS_EXPIRED]: { type: ErrorType.BUSINESS, planType: PlanErrorType.CLAIMS, category: ClaimsErrorCategory.EXPIRED },
  [PLAN_CLAIMS_PROCESSING_ERROR]: { type: ErrorType.TECHNICAL, planType: PlanErrorType.CLAIMS, category: ClaimsErrorCategory.PROCESSING_ERROR },
  [PLAN_CLAIMS_DOCUMENT_ERROR]: { type: ErrorType.BUSINESS, planType: PlanErrorType.CLAIMS, category: ClaimsErrorCategory.DOCUMENT_ERROR },
  [PLAN_CLAIMS_STATUS_TRANSITION_ERROR]: { type: ErrorType.BUSINESS, planType: PlanErrorType.CLAIMS, category: ClaimsErrorCategory.STATUS_TRANSITION_ERROR },
  
  // Documents error codes
  [PLAN_DOCUMENTS_NOT_FOUND]: { type: ErrorType.BUSINESS, planType: PlanErrorType.DOCUMENTS, category: DocumentsErrorCategory.NOT_FOUND },
  [PLAN_DOCUMENTS_INVALID_DATA]: { type: ErrorType.VALIDATION, planType: PlanErrorType.DOCUMENTS, category: DocumentsErrorCategory.INVALID_DATA },
  [PLAN_DOCUMENTS_UPLOAD_ERROR]: { type: ErrorType.TECHNICAL, planType: PlanErrorType.DOCUMENTS, category: DocumentsErrorCategory.UPLOAD_ERROR },
  [PLAN_DOCUMENTS_SIZE_EXCEEDED]: { type: ErrorType.VALIDATION, planType: PlanErrorType.DOCUMENTS, category: DocumentsErrorCategory.SIZE_EXCEEDED },
  [PLAN_DOCUMENTS_TYPE_NOT_SUPPORTED]: { type: ErrorType.VALIDATION, planType: PlanErrorType.DOCUMENTS, category: DocumentsErrorCategory.TYPE_NOT_SUPPORTED },
  [PLAN_DOCUMENTS_STORAGE_ERROR]: { type: ErrorType.TECHNICAL, planType: PlanErrorType.DOCUMENTS, category: DocumentsErrorCategory.STORAGE_ERROR },
  [PLAN_DOCUMENTS_ACCESS_DENIED]: { type: ErrorType.BUSINESS, planType: PlanErrorType.DOCUMENTS, category: DocumentsErrorCategory.ACCESS_DENIED },
};

/**
 * Interface for Plan error context.
 * Contains additional information about the error.
 */
export interface PlanErrorContext {
  planId?: string;
  userId?: string;
  requestId?: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Interface for Benefits error context.
 * Contains additional information about the error.
 */
export interface BenefitsErrorContext extends PlanErrorContext {
  benefitId?: string;
  benefitType?: string;
  limitValue?: number;
  currentUsage?: number;
}

/**
 * Interface for Coverage error context.
 * Contains additional information about the error.
 */
export interface CoverageErrorContext extends PlanErrorContext {
  coverageId?: string;
  procedureCode?: string;
  procedureType?: string;
  coveragePercentage?: number;
  waitingPeriodDays?: number;
}

/**
 * Interface for Claims error context.
 * Contains additional information about the error.
 */
export interface ClaimsErrorContext extends PlanErrorContext {
  claimId?: string;
  claimStatus?: string;
  submissionDate?: string;
  amount?: number;
  documentIds?: string[];
  currentStatus?: string;
  targetStatus?: string;
}

/**
 * Interface for Documents error context.
 * Contains additional information about the error.
 */
export interface DocumentsErrorContext extends PlanErrorContext {
  documentId?: string;
  documentType?: string;
  fileSize?: number;
  maxFileSize?: number;
  supportedTypes?: string[];
  storageProvider?: string;
}

/**
 * Type guard to check if an error code is a Plan error.
 * @param code The error code to check.
 * @returns True if the error code is a Plan error.
 */
export function isPlanError(code: string): boolean {
  return code.startsWith('PLAN_');
}

/**
 * Type guard to check if an error code is a Plan-specific error.
 * @param code The error code to check.
 * @returns True if the error code is a Plan-specific error.
 */
export function isPlanSpecificError(code: string): boolean {
  return code.startsWith('PLAN_') && !code.includes('_', 5);
}

/**
 * Type guard to check if an error code is a Benefits error.
 * @param code The error code to check.
 * @returns True if the error code is a Benefits error.
 */
export function isBenefitsError(code: string): boolean {
  return code.startsWith('PLAN_BENEFITS_');
}

/**
 * Type guard to check if an error code is a Coverage error.
 * @param code The error code to check.
 * @returns True if the error code is a Coverage error.
 */
export function isCoverageError(code: string): boolean {
  return code.startsWith('PLAN_COVERAGE_');
}

/**
 * Type guard to check if an error code is a Claims error.
 * @param code The error code to check.
 * @returns True if the error code is a Claims error.
 */
export function isClaimsError(code: string): boolean {
  return code.startsWith('PLAN_CLAIMS_');
}

/**
 * Type guard to check if an error code is a Documents error.
 * @param code The error code to check.
 * @returns True if the error code is a Documents error.
 */
export function isDocumentsError(code: string): boolean {
  return code.startsWith('PLAN_DOCUMENTS_');
}

/**
 * Gets the error type and category for a given error code.
 * @param code The error code to get the type and category for.
 * @returns The error type and category, or undefined if not found.
 */
export function getPlanErrorTypeAndCategory(code: string): { type: ErrorType; planType: PlanErrorType; category: string } | undefined {
  return PLAN_ERROR_CODE_MAP[code];
}

/**
 * Gets the appropriate error context interface based on the error code.
 * @param code The error code to get the context interface for.
 * @returns The error context interface type.
 */
export function getPlanErrorContextType(code: string): any {
  if (isPlanSpecificError(code)) {
    return PlanErrorContext;
  } else if (isBenefitsError(code)) {
    return BenefitsErrorContext;
  } else if (isCoverageError(code)) {
    return CoverageErrorContext;
  } else if (isClaimsError(code)) {
    return ClaimsErrorContext;
  } else if (isDocumentsError(code)) {
    return DocumentsErrorContext;
  }
  return PlanErrorContext;
}

/**
 * Creates a Plan-specific AppException with the appropriate error type and category.
 * @param message The error message.
 * @param code The error code.
 * @param details Additional error details.
 * @param cause The original error that caused this exception, if any.
 * @returns An AppException instance.
 */
export function createPlanException(
  message: string,
  code: string,
  details?: any,
  cause?: Error
): AppException {
  const errorInfo = getPlanErrorTypeAndCategory(code);
  
  if (!errorInfo) {
    throw new Error(`Invalid Plan error code: ${code}`);
  }
  
  // Add timestamp to details if not already present
  const enhancedDetails = {
    ...details,
    timestamp: details?.timestamp || new Date().toISOString(),
    planErrorType: errorInfo.planType,
    category: errorInfo.category
  };
  
  return new AppException(
    message,
    errorInfo.type,
    code,
    enhancedDetails,
    cause
  );
}

/**
 * Checks if an exception is a Plan-related exception.
 * @param error The error to check.
 * @returns True if the error is a Plan-related exception.
 */
export function isPlanException(error: any): boolean {
  return (
    error instanceof AppException &&
    typeof error.code === 'string' &&
    isPlanError(error.code)
  );
}

/**
 * Gets the Plan error type from an AppException.
 * @param error The AppException to get the Plan error type from.
 * @returns The Plan error type, or undefined if not a Plan exception.
 */
export function getPlanErrorType(error: AppException): PlanErrorType | undefined {
  if (!isPlanException(error)) {
    return undefined;
  }
  
  const errorInfo = getPlanErrorTypeAndCategory(error.code);
  return errorInfo?.planType;
}

/**
 * Gets the Plan error category from an AppException.
 * @param error The AppException to get the Plan error category from.
 * @returns The Plan error category, or undefined if not a Plan exception.
 */
export function getPlanErrorCategory(error: AppException): string | undefined {
  if (!isPlanException(error)) {
    return undefined;
  }
  
  const errorInfo = getPlanErrorTypeAndCategory(error.code);
  return errorInfo?.category;
}
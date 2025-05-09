/**
 * @file claims-errors.ts
 * @description Specialized error classes for the Claims domain in the Plan journey.
 * These error classes ensure consistent error handling for claim-related operations
 * with proper HTTP status codes and structured error responses.
 */

import { BaseError, ErrorType, JourneyContext } from '../../base';
import { PLAN_ERROR_PREFIXES, PLAN_ERROR_MESSAGES } from '../../constants';

/**
 * Error thrown when a claim is not found.
 */
export class ClaimNotFoundError extends BaseError {
  /**
   * Creates a new ClaimNotFoundError instance.
   * 
   * @param claimId - ID of the claim that was not found
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly claimId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      PLAN_ERROR_MESSAGES.CLAIMS.CLAIM_NOT_FOUND,
      ErrorType.NOT_FOUND,
      `${PLAN_ERROR_PREFIXES.CLAIMS}_001`,
      { journey: JourneyContext.PLAN, claimId },
      details,
      'Please verify the claim ID and try again.',
      cause
    );
  }
}

/**
 * Error thrown when a duplicate claim is detected.
 */
export class DuplicateClaimError extends BaseError {
  /**
   * Creates a new DuplicateClaimError instance.
   * 
   * @param existingClaimId - ID of the existing claim that caused the duplication
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly existingClaimId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      PLAN_ERROR_MESSAGES.CLAIMS.DUPLICATE_CLAIM,
      ErrorType.CONFLICT,
      `${PLAN_ERROR_PREFIXES.CLAIMS}_002`,
      { journey: JourneyContext.PLAN, existingClaimId },
      details,
      'Please review your existing claims before submitting a new one.',
      cause
    );
  }
}

/**
 * Error thrown when claim data fails validation.
 */
export class ClaimValidationError extends BaseError {
  /**
   * Creates a new ClaimValidationError instance.
   * 
   * @param validationErrors - Specific validation errors that occurred
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly validationErrors: Record<string, string>,
    details?: any,
    cause?: Error
  ) {
    super(
      PLAN_ERROR_MESSAGES.CLAIMS.INVALID_CLAIM_DATA.replace(
        '{details}',
        Object.values(validationErrors).join(', ')
      ),
      ErrorType.VALIDATION,
      `${PLAN_ERROR_PREFIXES.CLAIMS}_003`,
      { journey: JourneyContext.PLAN, validationErrors },
      details,
      'Please correct the errors and try again.',
      cause
    );
  }
}

/**
 * Error thrown when a claim is denied by the insurance provider.
 */
export class ClaimDeniedError extends BaseError {
  /**
   * Creates a new ClaimDeniedError instance.
   * 
   * @param claimId - ID of the denied claim
   * @param reason - Reason for the denial
   * @param denialCode - Insurance provider's denial code (optional)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly claimId: string,
    public readonly reason: string,
    public readonly denialCode?: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Claim was denied: ${reason}`,
      ErrorType.BUSINESS,
      `${PLAN_ERROR_PREFIXES.CLAIMS}_004`,
      { journey: JourneyContext.PLAN, claimId, reason, denialCode },
      details,
      'Please contact customer support for assistance with this claim.',
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in persisting claim data.
 */
export class ClaimPersistenceError extends BaseError {
  /**
   * Creates a new ClaimPersistenceError instance.
   * 
   * @param operation - Database operation that failed (e.g., 'create', 'update')
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly operation: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to ${operation} claim data in the database`,
      ErrorType.TECHNICAL,
      `${PLAN_ERROR_PREFIXES.CLAIMS}_005`,
      { journey: JourneyContext.PLAN, operation },
      details,
      'Please try again later. If the problem persists, contact support.',
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in the external claim processing API.
 */
export class ClaimProcessingApiError extends BaseError {
  /**
   * Creates a new ClaimProcessingApiError instance.
   * 
   * @param apiOperation - API operation that failed (e.g., 'submit', 'status')
   * @param statusCode - HTTP status code returned by the API (if available)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly apiOperation: string,
    public readonly statusCode?: number,
    details?: any,
    cause?: Error
  ) {
    super(
      PLAN_ERROR_MESSAGES.CLAIMS.CLAIM_SUBMISSION_FAILED.replace(
        '{reason}',
        `API error during ${apiOperation}`
      ),
      ErrorType.EXTERNAL,
      `${PLAN_ERROR_PREFIXES.CLAIMS}_006`,
      { journey: JourneyContext.PLAN, apiOperation, statusCode },
      details,
      'The system will automatically retry processing your claim.',
      cause
    );
  }

  /**
   * Determines if this API error is retryable based on the status code.
   * Generally, 5xx errors and some specific 4xx errors are retryable.
   * 
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(): boolean {
    // Always retry if we don't have a status code (network error, etc.)
    if (!this.statusCode) {
      return true;
    }
    
    // Retry on server errors (5xx)
    if (this.statusCode >= 500 && this.statusCode < 600) {
      return true;
    }
    
    // Retry on specific client errors
    return this.statusCode === 429 || // Too Many Requests
           this.statusCode === 408;   // Request Timeout
  }
}

/**
 * Error thrown when there's an issue with claim documents or attachments.
 */
export class ClaimDocumentError extends BaseError {
  /**
   * Creates a new ClaimDocumentError instance.
   * 
   * @param documentType - Type of document that had an issue
   * @param issue - Specific issue with the document
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly documentType: string,
    public readonly issue: 'missing' | 'invalid' | 'upload_failed' | 'too_large' | 'processing_failed',
    details?: any,
    cause?: Error
  ) {
    super(
      getDocumentErrorMessage(documentType, issue),
      getErrorTypeForDocumentIssue(issue),
      `${PLAN_ERROR_PREFIXES.CLAIMS}_007`,
      { journey: JourneyContext.PLAN, documentType, issue },
      details,
      getDocumentErrorSuggestion(issue),
      cause
    );
  }
}

/**
 * Helper function to get the appropriate error message for document issues.
 * 
 * @param documentType - Type of document
 * @param issue - Specific issue with the document
 * @returns Appropriate error message
 */
function getDocumentErrorMessage(documentType: string, issue: string): string {
  switch (issue) {
    case 'missing':
      return `Required document ${documentType} is missing`;
    case 'invalid':
      return `Document ${documentType} is invalid or corrupted`;
    case 'upload_failed':
      return PLAN_ERROR_MESSAGES.DOCUMENTS.DOCUMENT_UPLOAD_FAILED.replace('{reason}', `Failed to upload ${documentType}`);
    case 'too_large':
      return PLAN_ERROR_MESSAGES.DOCUMENTS.DOCUMENT_TOO_LARGE;
    case 'processing_failed':
      return PLAN_ERROR_MESSAGES.DOCUMENTS.DOCUMENT_PROCESSING_ERROR;
    default:
      return `An issue occurred with document ${documentType}`;
  }
}

/**
 * Helper function to get the appropriate error type for document issues.
 * 
 * @param issue - Specific issue with the document
 * @returns Appropriate ErrorType
 */
function getErrorTypeForDocumentIssue(issue: string): ErrorType {
  switch (issue) {
    case 'missing':
    case 'invalid':
    case 'too_large':
      return ErrorType.VALIDATION;
    case 'upload_failed':
      return ErrorType.EXTERNAL;
    case 'processing_failed':
      return ErrorType.TECHNICAL;
    default:
      return ErrorType.TECHNICAL;
  }
}

/**
 * Helper function to get the appropriate suggestion for document issues.
 * 
 * @param issue - Specific issue with the document
 * @returns Appropriate suggestion message
 */
function getDocumentErrorSuggestion(issue: string): string {
  switch (issue) {
    case 'missing':
      return 'Please attach all required documents before submitting.';
    case 'invalid':
      return 'Please ensure the document is in a supported format (PDF, JPG, PNG).';
    case 'upload_failed':
      return 'Please try uploading the document again or use a different file.';
    case 'too_large':
      return 'Please reduce the file size or split it into multiple documents.';
    case 'processing_failed':
      return 'Our system had trouble processing your document. Please try again later.';
    default:
      return 'Please review your document and try again.';
  }
}
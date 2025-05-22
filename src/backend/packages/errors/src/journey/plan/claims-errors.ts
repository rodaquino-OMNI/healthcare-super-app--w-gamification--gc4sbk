import { ErrorType } from '../../types';
import { BaseError } from '../../base';

/**
 * Error thrown when a claim cannot be found by its identifier.
 * This is a business logic error that occurs when attempting to access or modify a non-existent claim.
 */
export class ClaimNotFoundError extends BaseError {
  /**
   * Creates a new ClaimNotFoundError instance.
   * 
   * @param claimId - The identifier of the claim that was not found
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly claimId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Claim with ID ${claimId} not found`,
      ErrorType.BUSINESS,
      'PLAN_CLAIMS_001',
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ClaimNotFoundError.prototype);
  }
}

/**
 * Error thrown when a duplicate claim is detected.
 * This is a business logic error that occurs when attempting to submit a claim that already exists.
 */
export class DuplicateClaimError extends BaseError {
  /**
   * Creates a new DuplicateClaimError instance.
   * 
   * @param claimId - The identifier of the duplicate claim
   * @param originalClaimId - The identifier of the original claim (optional)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly claimId: string,
    public readonly originalClaimId?: string,
    details?: any,
    cause?: Error
  ) {
    super(
      originalClaimId
        ? `Duplicate claim detected. Claim ${claimId} is a duplicate of existing claim ${originalClaimId}`
        : `Duplicate claim detected for claim ${claimId}`,
      ErrorType.BUSINESS,
      'PLAN_CLAIMS_002',
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DuplicateClaimError.prototype);
  }
}

/**
 * Error thrown when claim data fails validation.
 * This is a validation error that occurs when the submitted claim data is invalid or incomplete.
 */
export class ClaimValidationError extends BaseError {
  /**
   * Creates a new ClaimValidationError instance.
   * 
   * @param message - Specific validation error message
   * @param validationErrors - Object containing field-specific validation errors
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    public readonly validationErrors: Record<string, string>,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'PLAN_CLAIMS_003',
      { validationErrors, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ClaimValidationError.prototype);
  }
}

/**
 * Error thrown when a claim is denied by the insurance provider.
 * This is a business logic error that occurs when a claim is rejected with a specific reason.
 */
export class ClaimDeniedError extends BaseError {
  /**
   * Creates a new ClaimDeniedError instance.
   * 
   * @param claimId - The identifier of the denied claim
   * @param reason - The reason for the claim denial
   * @param denialCode - The insurance provider's denial code (optional)
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
      denialCode
        ? `Claim ${claimId} was denied: ${reason} (Code: ${denialCode})`
        : `Claim ${claimId} was denied: ${reason}`,
      ErrorType.BUSINESS,
      'PLAN_CLAIMS_004',
      { reason, denialCode, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ClaimDeniedError.prototype);
  }
}

/**
 * Error thrown when there's a failure in persisting claim data to the database.
 * This is a technical error that occurs when database operations for claims fail.
 */
export class ClaimPersistenceError extends BaseError {
  /**
   * Creates a new ClaimPersistenceError instance.
   * 
   * @param message - Specific persistence error message
   * @param operation - The database operation that failed (e.g., 'create', 'update', 'delete')
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    public readonly operation: string,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      'PLAN_CLAIMS_005',
      { operation, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ClaimPersistenceError.prototype);
  }
}

/**
 * Error thrown when there's a failure in communicating with an external claims processing API.
 * This is an external system error that occurs when third-party insurance systems fail.
 */
export class ClaimProcessingApiError extends BaseError {
  /**
   * Creates a new ClaimProcessingApiError instance.
   * 
   * @param message - Specific API error message
   * @param apiName - The name of the external API that failed
   * @param statusCode - The HTTP status code returned by the external API (optional)
   * @param isRetryable - Whether the error is potentially recoverable with a retry
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    public readonly apiName: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false,
    details?: any,
    cause?: Error
  ) {
    super(
      statusCode
        ? `External claims processing API error (${apiName}): ${message} (Status: ${statusCode})`
        : `External claims processing API error (${apiName}): ${message}`,
      ErrorType.EXTERNAL,
      'PLAN_CLAIMS_006',
      { apiName, statusCode, isRetryable, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ClaimProcessingApiError.prototype);
  }
}

/**
 * Error thrown when there's an issue with claim document attachments.
 * This can be a validation error (invalid format) or a technical error (storage failure).
 */
export class ClaimDocumentError extends BaseError {
  /**
   * Creates a new ClaimDocumentError instance.
   * 
   * @param message - Specific document error message
   * @param documentType - The type of document that caused the error
   * @param errorType - The type of error (validation or technical)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    public readonly documentType: string,
    public readonly errorType: ErrorType.VALIDATION | ErrorType.TECHNICAL = ErrorType.VALIDATION,
    details?: any,
    cause?: Error
  ) {
    super(
      `Claim document error (${documentType}): ${message}`,
      errorType,
      errorType === ErrorType.VALIDATION ? 'PLAN_CLAIMS_007' : 'PLAN_CLAIMS_008',
      { documentType, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ClaimDocumentError.prototype);
  }
}

/**
 * Error thrown when a claim status transition is invalid.
 * This is a business logic error that occurs when attempting to change a claim's status in an invalid way.
 */
export class InvalidClaimStatusTransitionError extends BaseError {
  /**
   * Creates a new InvalidClaimStatusTransitionError instance.
   * 
   * @param claimId - The identifier of the claim
   * @param currentStatus - The current status of the claim
   * @param attemptedStatus - The status that was attempted to be set
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly claimId: string,
    public readonly currentStatus: string,
    public readonly attemptedStatus: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Invalid claim status transition for claim ${claimId}: Cannot change from '${currentStatus}' to '${attemptedStatus}'`,
      ErrorType.BUSINESS,
      'PLAN_CLAIMS_009',
      { currentStatus, attemptedStatus, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InvalidClaimStatusTransitionError.prototype);
  }
}

/**
 * Error thrown when a claim requires additional information before it can be processed.
 * This is a business logic error that provides context about what information is missing.
 */
export class ClaimAdditionalInfoRequiredError extends BaseError {
  /**
   * Creates a new ClaimAdditionalInfoRequiredError instance.
   * 
   * @param claimId - The identifier of the claim
   * @param requiredFields - Array of field names that require additional information
   * @param message - Custom message explaining what information is needed (optional)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly claimId: string,
    public readonly requiredFields: string[],
    message?: string,
    details?: any,
    cause?: Error
  ) {
    super(
      message || `Claim ${claimId} requires additional information: ${requiredFields.join(', ')}`,
      ErrorType.BUSINESS,
      'PLAN_CLAIMS_010',
      { requiredFields, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ClaimAdditionalInfoRequiredError.prototype);
  }
}
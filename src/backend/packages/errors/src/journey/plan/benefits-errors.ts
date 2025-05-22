import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';
import { BenefitErrorCodes } from './error-codes';
import { BenefitErrorPayload, BenefitErrorType, PlanErrorContext, PlanErrorDomain } from './types';

/**
 * Base class for all benefit-related errors in the Plan journey.
 * Extends the AppException class to ensure consistent error handling.
 */
export abstract class BaseBenefitError extends AppException {
  /**
   * Creates a new BaseBenefitError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code from BenefitErrorCodes
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    // Create a standardized error context for all benefit errors
    const context: PlanErrorContext = {
      domain: PlanErrorDomain.BENEFITS,
      data: details
    };

    super(message, type, code, context, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseBenefitError.prototype);
  }
}

/**
 * Error thrown when a requested benefit cannot be found.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class BenefitNotFoundError extends BaseBenefitError {
  /**
   * Creates a new BenefitNotFoundError instance.
   * 
   * @param benefitId - ID of the benefit that was not found
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `Benefit with ID ${benefitId} not found`,
      ErrorType.BUSINESS,
      BenefitErrorCodes.PLAN_BENEFIT_BUS_NOT_FOUND,
      { ...details, benefitId, operation: 'findBenefit' },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitNotFoundError.prototype);
  }
}

/**
 * Error thrown when a benefit is not covered by the user's plan.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class BenefitNotCoveredError extends BaseBenefitError {
  /**
   * Creates a new BenefitNotCoveredError instance.
   * 
   * @param benefitId - ID of the benefit that is not covered
   * @param planId - ID of the plan that does not cover the benefit
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    planId: string,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `Benefit ${benefitId} is not covered by plan ${planId}`,
      ErrorType.BUSINESS,
      BenefitErrorCodes.PLAN_BENEFIT_BUS_NOT_COVERED,
      { ...details, benefitId, planId, operation: 'checkBenefitCoverage' },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitNotCoveredError.prototype);
  }
}

/**
 * Error thrown when a user is not eligible for a specific benefit.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class BenefitEligibilityError extends BaseBenefitError {
  /**
   * Creates a new BenefitEligibilityError instance.
   * 
   * @param benefitId - ID of the benefit
   * @param userId - ID of the user who is not eligible
   * @param reason - Reason for eligibility failure
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    userId: string,
    reason: string,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `User ${userId} is not eligible for benefit ${benefitId}: ${reason}`,
      ErrorType.BUSINESS,
      BenefitErrorCodes.PLAN_BENEFIT_BUS_REQUIRES_PREAUTHORIZATION,
      { ...details, benefitId, userId, reason, operation: 'checkBenefitEligibility' },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitEligibilityError.prototype);
  }
}

/**
 * Error thrown when a user has exceeded the usage limit for a benefit.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class BenefitLimitExceededError extends BaseBenefitError {
  /**
   * Creates a new BenefitLimitExceededError instance.
   * 
   * @param benefitId - ID of the benefit
   * @param userId - ID of the user who exceeded the limit
   * @param currentUsage - Current usage amount
   * @param limit - Maximum allowed usage
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    userId: string,
    currentUsage: number,
    limit: number,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `User ${userId} has exceeded the limit for benefit ${benefitId}: ${currentUsage}/${limit}`,
      ErrorType.BUSINESS,
      BenefitErrorCodes.PLAN_BENEFIT_BUS_LIMIT_EXCEEDED,
      { ...details, benefitId, userId, currentUsage, limit, operation: 'checkBenefitLimit' },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitLimitExceededError.prototype);
  }
}

/**
 * Error thrown when there is a technical issue with benefit data persistence.
 * This is a technical error (500 Internal Server Error).
 */
export class BenefitPersistenceError extends BaseBenefitError {
  /**
   * Creates a new BenefitPersistenceError instance.
   * 
   * @param operation - Database operation that failed
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    operation: string,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `Failed to perform database operation '${operation}' for benefit`,
      ErrorType.TECHNICAL,
      BenefitErrorCodes.PLAN_BENEFIT_TECH_PERSISTENCE_FAILURE,
      { ...details, operation },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitPersistenceError.prototype);
  }
}

/**
 * Error thrown when there is an issue with the external benefit verification API.
 * This is an external system error (502 Bad Gateway).
 */
export class BenefitVerificationApiError extends BaseBenefitError {
  /**
   * Creates a new BenefitVerificationApiError instance.
   * 
   * @param apiName - Name of the external API that failed
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    apiName: string,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `Failed to verify benefit with external API: ${apiName}`,
      ErrorType.EXTERNAL,
      BenefitErrorCodes.PLAN_BENEFIT_EXT_AUTHORIZATION_SERVICE_FAILURE,
      { ...details, apiName, operation: 'verifyBenefitWithExternalApi' },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitVerificationApiError.prototype);
  }
}

/**
 * Error thrown when benefit data retrieval fails.
 * This is a technical error (500 Internal Server Error).
 */
export class BenefitRetrievalError extends BaseBenefitError {
  /**
   * Creates a new BenefitRetrievalError instance.
   * 
   * @param operation - Retrieval operation that failed
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    operation: string,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `Failed to retrieve benefit data during operation '${operation}'`,
      ErrorType.TECHNICAL,
      BenefitErrorCodes.PLAN_BENEFIT_TECH_RETRIEVAL_FAILURE,
      { ...details, operation },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitRetrievalError.prototype);
  }
}

/**
 * Error thrown when benefit validation fails.
 * This is a validation error (400 Bad Request).
 */
export class BenefitValidationError extends BaseBenefitError {
  /**
   * Creates a new BenefitValidationError instance.
   * 
   * @param field - Field that failed validation
   * @param value - Invalid value
   * @param constraint - Validation constraint that was violated
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    field: string,
    value: any,
    constraint: string,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `Benefit validation failed for field '${field}': ${constraint}`,
      ErrorType.VALIDATION,
      BenefitErrorCodes.PLAN_BENEFIT_VAL_INVALID_COVERAGE,
      { ...details, field, value, constraint, operation: 'validateBenefit' },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitValidationError.prototype);
  }
}

/**
 * Error thrown when benefit calculation fails.
 * This is a technical error (500 Internal Server Error).
 */
export class BenefitCalculationError extends BaseBenefitError {
  /**
   * Creates a new BenefitCalculationError instance.
   * 
   * @param benefitId - ID of the benefit
   * @param calculationType - Type of calculation that failed
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    calculationType: string,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `Failed to calculate ${calculationType} for benefit ${benefitId}`,
      ErrorType.TECHNICAL,
      BenefitErrorCodes.PLAN_BENEFIT_TECH_CALCULATION_FAILURE,
      { ...details, benefitId, calculationType, operation: 'calculateBenefit' },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitCalculationError.prototype);
  }
}

/**
 * Error thrown when a benefit requires waiting period before usage.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class BenefitWaitingPeriodError extends BaseBenefitError {
  /**
   * Creates a new BenefitWaitingPeriodError instance.
   * 
   * @param benefitId - ID of the benefit
   * @param userId - ID of the user
   * @param waitingPeriodDays - Required waiting period in days
   * @param effectiveDate - Date when the benefit becomes available
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    userId: string,
    waitingPeriodDays: number,
    effectiveDate: Date,
    details?: BenefitErrorPayload,
    cause?: Error
  ) {
    super(
      `Benefit ${benefitId} requires a waiting period of ${waitingPeriodDays} days. Available from ${effectiveDate.toISOString().split('T')[0]}`,
      ErrorType.BUSINESS,
      BenefitErrorCodes.PLAN_BENEFIT_BUS_WAITING_PERIOD,
      { ...details, benefitId, userId, waitingPeriodDays, effectiveDate: effectiveDate.toISOString(), operation: 'checkBenefitWaitingPeriod' },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BenefitWaitingPeriodError.prototype);
  }
}
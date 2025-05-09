/**
 * @file plans-errors.ts
 * @description Defines specialized error classes for the Plans domain in the Plan journey.
 * These error classes ensure consistent error handling for plan-related operations
 * with proper HTTP status codes and structured error responses.
 */

import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';
import { PlanErrorContext, createPlanException } from './types';
import {
  PLAN_PLAN_BUSINESS_ERRORS,
  PLAN_PLAN_VALIDATION_ERRORS,
  PLAN_PLAN_TECHNICAL_ERRORS,
  PLAN_PLAN_EXTERNAL_ERRORS
} from './error-codes';

/**
 * Error thrown when a requested plan cannot be found.
 * Maps to HTTP 422 Unprocessable Entity.
 */
export class PlanNotFoundError extends AppException {
  /**
   * Creates a new PlanNotFoundError instance.
   * 
   * @param planId - ID of the plan that was not found
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    planId: string,
    message: string = `Plan with ID ${planId} not found`,
    details?: Partial<PlanErrorContext>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_PLAN_BUSINESS_ERRORS.PLAN_NOT_FOUND,
      {
        planId,
        ...details,
        timestamp: new Date().toISOString()
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PlanNotFoundError.prototype);
  }
}

/**
 * Error thrown when a plan exists but is not available in the user's region.
 * Maps to HTTP 422 Unprocessable Entity.
 */
export class PlanNotAvailableInRegionError extends AppException {
  /**
   * Creates a new PlanNotAvailableInRegionError instance.
   * 
   * @param planId - ID of the plan that is not available
   * @param region - Region code where the plan was requested
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    planId: string,
    region: string,
    message: string = `Plan with ID ${planId} is not available in region ${region}`,
    details?: Partial<PlanErrorContext>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_PLAN_BUSINESS_ERRORS.PLAN_NOT_AVAILABLE,
      {
        planId,
        region,
        ...details,
        timestamp: new Date().toISOString()
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PlanNotAvailableInRegionError.prototype);
  }
}

/**
 * Error thrown when plan selection validation fails.
 * Maps to HTTP 400 Bad Request.
 */
export class PlanSelectionValidationError extends AppException {
  /**
   * Creates a new PlanSelectionValidationError instance.
   * 
   * @param planId - ID of the plan that failed validation
   * @param validationErrors - List of validation errors
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    planId: string,
    validationErrors: string[],
    message: string = `Plan selection validation failed for plan ID ${planId}`,
    details?: Partial<PlanErrorContext>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      PLAN_PLAN_VALIDATION_ERRORS.INVALID_PLAN_TYPE,
      {
        planId,
        validationErrors,
        ...details,
        timestamp: new Date().toISOString()
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PlanSelectionValidationError.prototype);
  }
}

/**
 * Error thrown when plan comparison fails.
 * Maps to HTTP 422 Unprocessable Entity.
 */
export class PlanComparisonError extends AppException {
  /**
   * Creates a new PlanComparisonError instance.
   * 
   * @param planIds - Array of plan IDs that were being compared
   * @param reason - Reason for the comparison failure
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    planIds: string[],
    reason: string,
    message: string = `Failed to compare plans: ${reason}`,
    details?: Partial<PlanErrorContext>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_PLAN_BUSINESS_ERRORS.COMPARISON_FAILED,
      {
        planIds,
        reason,
        ...details,
        timestamp: new Date().toISOString()
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PlanComparisonError.prototype);
  }
}

/**
 * Error thrown when there's a technical issue with plan data persistence.
 * Maps to HTTP 500 Internal Server Error.
 */
export class PlanPersistenceError extends AppException {
  /**
   * Creates a new PlanPersistenceError instance.
   * 
   * @param planId - ID of the plan with persistence issues
   * @param operation - Database operation that failed (e.g., 'create', 'update', 'delete')
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    planId: string,
    operation: string,
    message: string = `Failed to ${operation} plan with ID ${planId}`,
    details?: Partial<PlanErrorContext>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      operation === 'retrieve' 
        ? PLAN_PLAN_TECHNICAL_ERRORS.DATABASE_RETRIEVAL_ERROR 
        : PLAN_PLAN_TECHNICAL_ERRORS.DATABASE_SAVE_ERROR,
      {
        planId,
        operation,
        ...details,
        timestamp: new Date().toISOString()
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PlanPersistenceError.prototype);
  }
}

/**
 * Error thrown when there's an issue with the external insurance provider API.
 * Maps to HTTP 502 Bad Gateway.
 */
export class PlanProviderApiError extends AppException {
  /**
   * Creates a new PlanProviderApiError instance.
   * 
   * @param providerName - Name of the insurance provider
   * @param endpoint - API endpoint that failed
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    providerName: string,
    endpoint: string,
    message: string = `Failed to communicate with insurance provider ${providerName} at endpoint ${endpoint}`,
    details?: Partial<PlanErrorContext>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      PLAN_PLAN_EXTERNAL_ERRORS.PROVIDER_API_ERROR,
      {
        providerName,
        endpoint,
        ...details,
        timestamp: new Date().toISOString()
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PlanProviderApiError.prototype);
  }
}

/**
 * Helper function to create a PlanNotFoundError with the given details.
 * 
 * @param planId - ID of the plan that was not found
 * @param message - Custom error message (optional)
 * @param details - Additional error details (optional)
 * @param cause - Original error that caused this exception, if any (optional)
 * @returns A new PlanNotFoundError instance
 */
export function createPlanNotFoundError(
  planId: string,
  message?: string,
  details?: Partial<PlanErrorContext>,
  cause?: Error
): PlanNotFoundError {
  return new PlanNotFoundError(planId, message, details, cause);
}

/**
 * Helper function to create a PlanNotAvailableInRegionError with the given details.
 * 
 * @param planId - ID of the plan that is not available
 * @param region - Region code where the plan was requested
 * @param message - Custom error message (optional)
 * @param details - Additional error details (optional)
 * @param cause - Original error that caused this exception, if any (optional)
 * @returns A new PlanNotAvailableInRegionError instance
 */
export function createPlanNotAvailableInRegionError(
  planId: string,
  region: string,
  message?: string,
  details?: Partial<PlanErrorContext>,
  cause?: Error
): PlanNotAvailableInRegionError {
  return new PlanNotAvailableInRegionError(planId, region, message, details, cause);
}

/**
 * Helper function to create a PlanSelectionValidationError with the given details.
 * 
 * @param planId - ID of the plan that failed validation
 * @param validationErrors - List of validation errors
 * @param message - Custom error message (optional)
 * @param details - Additional error details (optional)
 * @param cause - Original error that caused this exception, if any (optional)
 * @returns A new PlanSelectionValidationError instance
 */
export function createPlanSelectionValidationError(
  planId: string,
  validationErrors: string[],
  message?: string,
  details?: Partial<PlanErrorContext>,
  cause?: Error
): PlanSelectionValidationError {
  return new PlanSelectionValidationError(planId, validationErrors, message, details, cause);
}

/**
 * Helper function to create a PlanComparisonError with the given details.
 * 
 * @param planIds - Array of plan IDs that were being compared
 * @param reason - Reason for the comparison failure
 * @param message - Custom error message (optional)
 * @param details - Additional error details (optional)
 * @param cause - Original error that caused this exception, if any (optional)
 * @returns A new PlanComparisonError instance
 */
export function createPlanComparisonError(
  planIds: string[],
  reason: string,
  message?: string,
  details?: Partial<PlanErrorContext>,
  cause?: Error
): PlanComparisonError {
  return new PlanComparisonError(planIds, reason, message, details, cause);
}

/**
 * Helper function to create a PlanPersistenceError with the given details.
 * 
 * @param planId - ID of the plan with persistence issues
 * @param operation - Database operation that failed (e.g., 'create', 'update', 'delete')
 * @param message - Custom error message (optional)
 * @param details - Additional error details (optional)
 * @param cause - Original error that caused this exception, if any (optional)
 * @returns A new PlanPersistenceError instance
 */
export function createPlanPersistenceError(
  planId: string,
  operation: string,
  message?: string,
  details?: Partial<PlanErrorContext>,
  cause?: Error
): PlanPersistenceError {
  return new PlanPersistenceError(planId, operation, message, details, cause);
}

/**
 * Helper function to create a PlanProviderApiError with the given details.
 * 
 * @param providerName - Name of the insurance provider
 * @param endpoint - API endpoint that failed
 * @param message - Custom error message (optional)
 * @param details - Additional error details (optional)
 * @param cause - Original error that caused this exception, if any (optional)
 * @returns A new PlanProviderApiError instance
 */
export function createPlanProviderApiError(
  providerName: string,
  endpoint: string,
  message?: string,
  details?: Partial<PlanErrorContext>,
  cause?: Error
): PlanProviderApiError {
  return new PlanProviderApiError(providerName, endpoint, message, details, cause);
}
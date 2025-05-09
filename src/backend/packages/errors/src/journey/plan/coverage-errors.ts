/**
 * @file coverage-errors.ts
 * @description Defines specialized error classes for the Coverage domain in the Plan journey.
 * These error classes ensure consistent error handling for coverage-related operations
 * with proper HTTP status codes and structured error responses.
 */

import { ErrorType } from '../../../../shared/src/exceptions/exceptions.types';
import { 
  PLAN_COVER_BUSINESS_ERRORS, 
  PLAN_COVER_TECHNICAL_ERRORS, 
  PLAN_COVER_EXTERNAL_ERRORS 
} from './error-codes';
import { 
  createPlanException, 
  CoverageErrorContext, 
  PlanErrorType, 
  CoverageErrorCategory 
} from './types';

/**
 * Error thrown when coverage information cannot be found.
 * Maps to HTTP 422 Unprocessable Entity.
 */
export class CoverageNotFoundError extends Error {
  /**
   * Creates a new CoverageNotFoundError instance.
   * 
   * @param coverageId - ID of the coverage that was not found
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    coverageId: string,
    message: string = `Coverage with ID ${coverageId} not found`,
    details?: Partial<CoverageErrorContext>,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Create the underlying AppException
    const exception = createPlanException(
      message,
      PLAN_COVER_BUSINESS_ERRORS.COVERAGE_NOT_FOUND,
      {
        ...details,
        coverageId,
        errorType: PlanErrorType.COVERAGE,
        errorCategory: CoverageErrorCategory.NOT_FOUND
      },
      cause
    );
    
    // Copy properties from the AppException to this error
    Object.defineProperties(this, {
      code: { value: exception.code },
      type: { value: exception.type },
      details: { value: exception.details },
      cause: { value: exception.cause },
      toJSON: { value: () => exception.toJSON() },
      toHttpException: { value: () => exception.toHttpException() }
    });
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CoverageNotFoundError.prototype);
  }
}

/**
 * Error thrown when a service is not covered by the plan.
 * Maps to HTTP 422 Unprocessable Entity.
 */
export class ServiceNotCoveredError extends Error {
  /**
   * Creates a new ServiceNotCoveredError instance.
   * 
   * @param serviceCode - Code of the service that is not covered
   * @param planId - ID of the plan
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    serviceCode: string,
    planId: string,
    message: string = `Service ${serviceCode} is not covered by plan ${planId}`,
    details?: Partial<CoverageErrorContext>,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Create the underlying AppException
    const exception = createPlanException(
      message,
      PLAN_COVER_BUSINESS_ERRORS.SERVICE_NOT_COVERED,
      {
        ...details,
        planId,
        procedureCode: serviceCode,
        errorType: PlanErrorType.COVERAGE,
        errorCategory: CoverageErrorCategory.NOT_COVERED
      },
      cause
    );
    
    // Copy properties from the AppException to this error
    Object.defineProperties(this, {
      code: { value: exception.code },
      type: { value: exception.type },
      details: { value: exception.details },
      cause: { value: exception.cause },
      toJSON: { value: () => exception.toJSON() },
      toHttpException: { value: () => exception.toHttpException() }
    });
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ServiceNotCoveredError.prototype);
  }
}

/**
 * Error thrown when a provider is out of network.
 * Maps to HTTP 422 Unprocessable Entity.
 */
export class OutOfNetworkError extends Error {
  /**
   * Creates a new OutOfNetworkError instance.
   * 
   * @param providerId - ID of the provider that is out of network
   * @param planId - ID of the plan
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    providerId: string,
    planId: string,
    message: string = `Provider ${providerId} is out of network for plan ${planId}`,
    details?: Partial<CoverageErrorContext>,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Create the underlying AppException
    const exception = createPlanException(
      message,
      PLAN_COVER_BUSINESS_ERRORS.OUT_OF_NETWORK,
      {
        ...details,
        planId,
        providerId,
        errorType: PlanErrorType.COVERAGE,
        errorCategory: CoverageErrorCategory.NOT_COVERED
      },
      cause
    );
    
    // Copy properties from the AppException to this error
    Object.defineProperties(this, {
      code: { value: exception.code },
      type: { value: exception.type },
      details: { value: exception.details },
      cause: { value: exception.cause },
      toJSON: { value: () => exception.toJSON() },
      toHttpException: { value: () => exception.toHttpException() }
    });
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, OutOfNetworkError.prototype);
  }
}

/**
 * Error thrown when coverage verification fails.
 * Maps to HTTP 422 Unprocessable Entity.
 */
export class CoverageVerificationError extends Error {
  /**
   * Creates a new CoverageVerificationError instance.
   * 
   * @param coverageId - ID of the coverage being verified
   * @param reason - Reason for verification failure
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    coverageId: string,
    reason: string,
    message: string = `Coverage verification failed for ID ${coverageId}: ${reason}`,
    details?: Partial<CoverageErrorContext>,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Create the underlying AppException
    const exception = createPlanException(
      message,
      PLAN_COVER_BUSINESS_ERRORS.VERIFICATION_FAILED,
      {
        ...details,
        coverageId,
        reason,
        errorType: PlanErrorType.COVERAGE,
        errorCategory: CoverageErrorCategory.NOT_COVERED
      },
      cause
    );
    
    // Copy properties from the AppException to this error
    Object.defineProperties(this, {
      code: { value: exception.code },
      type: { value: exception.type },
      details: { value: exception.details },
      cause: { value: exception.cause },
      toJSON: { value: () => exception.toJSON() },
      toHttpException: { value: () => exception.toHttpException() }
    });
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CoverageVerificationError.prototype);
  }
}

/**
 * Error thrown when there is a database failure related to coverage.
 * Maps to HTTP 500 Internal Server Error.
 */
export class CoveragePersistenceError extends Error {
  /**
   * Creates a new CoveragePersistenceError instance.
   * 
   * @param operation - Database operation that failed (e.g., 'create', 'update', 'delete', 'read')
   * @param coverageId - ID of the coverage (if available)
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    operation: string,
    coverageId?: string,
    message?: string,
    details?: Partial<CoverageErrorContext>,
    cause?: Error
  ) {
    const errorMessage = message || 
      `Database operation '${operation}' failed${coverageId ? ` for coverage ID ${coverageId}` : ''}`;
    
    super(errorMessage);
    this.name = this.constructor.name;
    
    // Create the underlying AppException
    const exception = createPlanException(
      errorMessage,
      PLAN_COVER_TECHNICAL_ERRORS.DATABASE_RETRIEVAL_ERROR,
      {
        ...details,
        coverageId,
        operation,
        errorType: PlanErrorType.COVERAGE,
        errorCategory: 'persistence_error'
      },
      cause
    );
    
    // Copy properties from the AppException to this error
    Object.defineProperties(this, {
      code: { value: exception.code },
      type: { value: exception.type },
      details: { value: exception.details },
      cause: { value: exception.cause },
      toJSON: { value: () => exception.toJSON() },
      toHttpException: { value: () => exception.toHttpException() }
    });
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CoveragePersistenceError.prototype);
  }
}

/**
 * Error thrown when there is a failure in communication with an external coverage verification system.
 * Maps to HTTP 502 Bad Gateway.
 */
export class CoverageApiIntegrationError extends Error {
  /**
   * Creates a new CoverageApiIntegrationError instance.
   * 
   * @param apiName - Name of the external API that failed
   * @param operation - API operation that failed
   * @param message - Custom error message (optional)
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    apiName: string,
    operation: string,
    message?: string,
    details?: Partial<CoverageErrorContext>,
    cause?: Error
  ) {
    const errorMessage = message || 
      `External API '${apiName}' failed during operation '${operation}'`;
    
    super(errorMessage);
    this.name = this.constructor.name;
    
    // Create the underlying AppException
    const exception = createPlanException(
      errorMessage,
      PLAN_COVER_EXTERNAL_ERRORS.VERIFICATION_SERVICE_ERROR,
      {
        ...details,
        apiName,
        operation,
        errorType: PlanErrorType.COVERAGE,
        errorCategory: 'external_api_error'
      },
      cause
    );
    
    // Copy properties from the AppException to this error
    Object.defineProperties(this, {
      code: { value: exception.code },
      type: { value: exception.type },
      details: { value: exception.details },
      cause: { value: exception.cause },
      toJSON: { value: () => exception.toJSON() },
      toHttpException: { value: () => exception.toHttpException() }
    });
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CoverageApiIntegrationError.prototype);
  }
}
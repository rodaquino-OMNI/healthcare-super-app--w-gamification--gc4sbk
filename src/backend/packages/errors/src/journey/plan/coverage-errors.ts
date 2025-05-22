/**
 * @file coverage-errors.ts
 * @description Specialized error classes for the Coverage domain in the Plan journey.
 * 
 * This file defines error classes for coverage verification, network provider validation,
 * service eligibility checks, and related operations in the Plan journey. These error
 * classes ensure consistent error handling with proper HTTP status codes and structured
 * error responses.
 */

import { BaseError, ErrorType, JourneyType } from '../../base';
import { PLAN_ERROR_CODES } from '../../constants';
import { PlanErrorType } from '../../types';

/**
 * Error thrown when a coverage record is not found.
 * This is a business error that occurs when attempting to access a coverage
 * record that does not exist in the system.
 */
export class CoverageNotFoundError extends BaseError {
  /**
   * Creates a new CoverageNotFoundError instance.
   * 
   * @param coverageId - ID of the coverage that was not found
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly coverageId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Coverage with ID ${coverageId} not found`,
      ErrorType.BUSINESS,
      PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
      {
        journey: JourneyType.PLAN,
        operation: 'coverage-verification',
        component: 'coverage-service',
        metadata: { coverageId }
      },
      details,
      cause
    );
  }
}

/**
 * Error thrown when a service is not covered by the member's plan.
 * This is a business error that occurs during coverage verification when
 * a requested service is not included in the member's coverage.
 */
export class ServiceNotCoveredError extends BaseError {
  /**
   * Creates a new ServiceNotCoveredError instance.
   * 
   * @param serviceCode - Code of the service that is not covered
   * @param planId - ID of the plan that does not cover the service
   * @param memberId - ID of the member requesting coverage
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly serviceCode: string,
    public readonly planId: string,
    public readonly memberId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Service ${serviceCode} is not covered by plan ${planId}`,
      ErrorType.BUSINESS,
      PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
      {
        journey: JourneyType.PLAN,
        operation: 'service-coverage-check',
        component: 'coverage-service',
        metadata: { serviceCode, planId, memberId }
      },
      details,
      cause
    );
  }
}

/**
 * Error thrown when a provider is out of network for the member's plan.
 * This is a business error that occurs during coverage verification when
 * a provider is not in the network associated with the member's plan.
 */
export class OutOfNetworkError extends BaseError {
  /**
   * Creates a new OutOfNetworkError instance.
   * 
   * @param providerId - ID of the provider that is out of network
   * @param networkId - ID of the network associated with the plan
   * @param planId - ID of the member's plan
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly providerId: string,
    public readonly networkId: string,
    public readonly planId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Provider ${providerId} is out of network for plan ${planId}`,
      ErrorType.BUSINESS,
      PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
      {
        journey: JourneyType.PLAN,
        operation: 'network-provider-check',
        component: 'coverage-service',
        metadata: { providerId, networkId, planId }
      },
      details,
      cause
    );
  }
}

/**
 * Error thrown when coverage verification fails due to technical issues.
 * This is a technical error that occurs when the system cannot complete
 * the coverage verification process due to internal errors.
 */
export class CoverageVerificationError extends BaseError {
  /**
   * Creates a new CoverageVerificationError instance.
   * 
   * @param memberId - ID of the member whose coverage is being verified
   * @param planId - ID of the plan being verified
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly memberId: string,
    public readonly planId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to verify coverage for member ${memberId} with plan ${planId}`,
      ErrorType.TECHNICAL,
      PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
      {
        journey: JourneyType.PLAN,
        operation: 'coverage-verification',
        component: 'coverage-service',
        isTransient: true,
        retryStrategy: {
          maxAttempts: 3,
          baseDelayMs: 500,
          useExponentialBackoff: true
        },
        metadata: { memberId, planId }
      },
      details,
      cause
    );
  }
}

/**
 * Error thrown when coverage data cannot be persisted in the database.
 * This is a technical error that occurs when the system encounters database
 * errors while saving or updating coverage information.
 */
export class CoveragePersistenceError extends BaseError {
  /**
   * Creates a new CoveragePersistenceError instance.
   * 
   * @param operation - Database operation that failed (create, update, delete)
   * @param coverageId - ID of the coverage record (if applicable)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly operation: 'create' | 'update' | 'delete',
    public readonly coverageId?: string,
    details?: any,
    cause?: Error
  ) {
    const entityDesc = coverageId ? `coverage ${coverageId}` : 'coverage record';
    super(
      `Failed to ${operation} ${entityDesc} in database`,
      ErrorType.TECHNICAL,
      PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
      {
        journey: JourneyType.PLAN,
        operation: `${operation}-coverage`,
        component: 'coverage-service',
        isTransient: true,
        retryStrategy: {
          maxAttempts: 5,
          baseDelayMs: 200,
          useExponentialBackoff: true
        },
        metadata: { operation, coverageId }
      },
      details,
      cause
    );
  }
}

/**
 * Error thrown when communication with external coverage verification API fails.
 * This is an external error that occurs when the system cannot communicate with
 * external coverage verification systems or receives invalid responses.
 */
export class CoverageApiIntegrationError extends BaseError {
  /**
   * Creates a new CoverageApiIntegrationError instance.
   * 
   * @param apiName - Name of the external API that failed
   * @param errorCode - Error code returned by the external API (if available)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly apiName: string,
    public readonly errorCode?: string,
    details?: any,
    cause?: Error
  ) {
    const errorCodeMsg = errorCode ? ` (error code: ${errorCode})` : '';
    super(
      `Failed to communicate with external coverage API ${apiName}${errorCodeMsg}`,
      ErrorType.EXTERNAL,
      PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
      {
        journey: JourneyType.PLAN,
        operation: 'external-coverage-verification',
        component: 'coverage-service',
        isTransient: true,
        retryStrategy: {
          maxAttempts: 3,
          baseDelayMs: 500,
          useExponentialBackoff: true
        },
        metadata: { apiName, errorCode }
      },
      details,
      cause
    );
  }
}
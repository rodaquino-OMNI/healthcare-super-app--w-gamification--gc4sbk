/**
 * @file Plan Domain Error Classes
 * @description Defines specialized error classes for the Plans domain in the Plan journey.
 * These error classes ensure consistent error handling for plan-related operations
 * with proper HTTP status codes and structured error responses.
 *
 * @module @austa/errors/journey/plan/plans
 */

import { BaseError, ErrorType, JourneyType } from '../../base';
import { PlanErrorCodes } from './error-codes';
import { PlanErrorDomain, PlanErrorPayload } from './types';

/**
 * Error thrown when a requested plan cannot be found.
 * This is a business logic error that occurs when attempting to access a plan that doesn't exist.
 *
 * @example
 * throw new PlanNotFoundError('The requested health plan could not be found', {
 *   planId: 'PLAN-123',
 *   userId: 'USER-456'
 * });
 */
export class PlanNotFoundError extends BaseError {
  /**
   * Creates a new PlanNotFoundError instance.
   *
   * @param message - Human-readable error message
   * @param payload - Additional context about the plan that wasn't found
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    payload?: PlanErrorPayload,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      PlanErrorCodes.PLAN_PLAN_BUS_NOT_FOUND,
      {
        journey: JourneyType.PLAN,
        domain: PlanErrorDomain.PLANS,
        operation: 'getPlan',
        data: payload
      },
      payload,
      cause
    );
  }
}

/**
 * Error thrown when a plan is not available in the user's region.
 * This is a business logic error that occurs when a user attempts to access or enroll in a plan
 * that is not available in their geographic location.
 *
 * @example
 * throw new PlanNotAvailableInRegionError('This plan is not available in your region', {
 *   planId: 'PLAN-123',
 *   userId: 'USER-456',
 *   region: 'Northeast',
 *   userRegion: 'Southwest'
 * });
 */
export class PlanNotAvailableInRegionError extends BaseError {
  /**
   * Creates a new PlanNotAvailableInRegionError instance.
   *
   * @param message - Human-readable error message
   * @param payload - Additional context about the region availability issue
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    payload?: PlanErrorPayload & { region?: string; userRegion?: string },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      PlanErrorCodes.PLAN_PLAN_BUS_NOT_ELIGIBLE,
      {
        journey: JourneyType.PLAN,
        domain: PlanErrorDomain.PLANS,
        operation: 'checkPlanAvailability',
        data: payload
      },
      payload,
      cause
    );
  }
}

/**
 * Error thrown when plan selection validation fails.
 * This is a validation error that occurs when a user attempts to select a plan
 * but fails eligibility or other validation requirements.
 *
 * @example
 * throw new PlanSelectionValidationError('You are not eligible for this plan type', {
 *   planId: 'PLAN-123',
 *   userId: 'USER-456',
 *   validationErrors: ['Age requirement not met', 'Income threshold exceeded']
 * });
 */
export class PlanSelectionValidationError extends BaseError {
  /**
   * Creates a new PlanSelectionValidationError instance.
   *
   * @param message - Human-readable error message
   * @param payload - Additional context about the validation failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    payload?: PlanErrorPayload & { validationErrors?: string[] },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      PlanErrorCodes.PLAN_PLAN_VAL_INVALID_DETAILS,
      {
        journey: JourneyType.PLAN,
        domain: PlanErrorDomain.PLANS,
        operation: 'validatePlanSelection',
        data: payload
      },
      payload,
      cause
    );
  }
}

/**
 * Error thrown when plan comparison operation fails.
 * This is a technical error that occurs when attempting to compare multiple plans
 * and the operation fails due to data issues or processing problems.
 *
 * @example
 * throw new PlanComparisonError('Unable to compare selected plans', {
 *   planIds: ['PLAN-123', 'PLAN-456'],
 *   userId: 'USER-789',
 *   comparisonCriteria: ['premium', 'deductible', 'coverage']
 * });
 */
export class PlanComparisonError extends BaseError {
  /**
   * Creates a new PlanComparisonError instance.
   *
   * @param message - Human-readable error message
   * @param payload - Additional context about the comparison failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    payload?: PlanErrorPayload & { planIds?: string[]; comparisonCriteria?: string[] },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      PlanErrorCodes.PLAN_PLAN_TECH_RETRIEVAL_FAILURE,
      {
        journey: JourneyType.PLAN,
        domain: PlanErrorDomain.PLANS,
        operation: 'comparePlans',
        data: payload
      },
      payload,
      cause
    );
  }
}

/**
 * Error thrown when plan data persistence operations fail.
 * This is a technical error that occurs when attempting to save, update, or delete plan data
 * and the database operation fails.
 *
 * @example
 * throw new PlanPersistenceError('Failed to save plan selection', {
 *   planId: 'PLAN-123',
 *   userId: 'USER-456',
 *   operation: 'create'
 * });
 */
export class PlanPersistenceError extends BaseError {
  /**
   * Creates a new PlanPersistenceError instance.
   *
   * @param message - Human-readable error message
   * @param payload - Additional context about the persistence failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    payload?: PlanErrorPayload & { operation?: 'create' | 'update' | 'delete' | 'read' },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      PlanErrorCodes.PLAN_PLAN_TECH_PERSISTENCE_FAILURE,
      {
        journey: JourneyType.PLAN,
        domain: PlanErrorDomain.PLANS,
        operation: `${payload?.operation || 'persist'}Plan`,
        isTransient: true,
        retryStrategy: {
          maxAttempts: 3,
          baseDelayMs: 1000,
          useExponentialBackoff: true
        },
        data: payload
      },
      payload,
      cause
    );
  }
}

/**
 * Error thrown when external insurance provider API calls fail.
 * This is an external system error that occurs when attempting to communicate with
 * external insurance provider systems for plan data, eligibility checks, or enrollment.
 *
 * @example
 * throw new PlanProviderApiError('Failed to retrieve plan details from provider API', {
 *   planId: 'PLAN-123',
 *   providerId: 'PROVIDER-789',
 *   endpoint: '/api/plans/details',
 *   statusCode: 503
 * });
 */
export class PlanProviderApiError extends BaseError {
  /**
   * Creates a new PlanProviderApiError instance.
   *
   * @param message - Human-readable error message
   * @param payload - Additional context about the API failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    payload?: PlanErrorPayload & { 
      providerId?: string; 
      endpoint?: string; 
      statusCode?: number 
    },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      PlanErrorCodes.PLAN_PLAN_EXT_PROVIDER_UNAVAILABLE,
      {
        journey: JourneyType.PLAN,
        domain: PlanErrorDomain.PLANS,
        operation: 'callProviderApi',
        isTransient: payload?.statusCode ? [502, 503, 504].includes(payload.statusCode) : true,
        retryStrategy: {
          maxAttempts: 3,
          baseDelayMs: 2000,
          useExponentialBackoff: true
        },
        data: payload
      },
      payload,
      cause
    );
  }
}

/**
 * Error thrown when plan enrollment process fails.
 * This is a business logic error that occurs when a user attempts to enroll in a plan
 * but the enrollment process fails due to business rules or constraints.
 *
 * @example
 * throw new PlanEnrollmentError('Enrollment period has ended for this plan', {
 *   planId: 'PLAN-123',
 *   userId: 'USER-456',
 *   enrollmentPeriod: { start: '2023-01-01', end: '2023-03-31' }
 * });
 */
export class PlanEnrollmentError extends BaseError {
  /**
   * Creates a new PlanEnrollmentError instance.
   *
   * @param message - Human-readable error message
   * @param payload - Additional context about the enrollment failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    payload?: PlanErrorPayload & { 
      enrollmentPeriod?: { start: string; end: string };
      reason?: string;
    },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      PlanErrorCodes.PLAN_PLAN_BUS_ENROLLMENT_CLOSED,
      {
        journey: JourneyType.PLAN,
        domain: PlanErrorDomain.PLANS,
        operation: 'enrollInPlan',
        data: payload
      },
      payload,
      cause
    );
  }
}

/**
 * Error thrown when plan search operation fails.
 * This is a technical error that occurs when attempting to search for plans
 * and the operation fails due to data issues or processing problems.
 *
 * @example
 * throw new PlanSearchError('Unable to search for plans with the provided criteria', {
 *   searchCriteria: { type: 'HMO', maxPremium: 500 },
 *   userId: 'USER-456'
 * });
 */
export class PlanSearchError extends BaseError {
  /**
   * Creates a new PlanSearchError instance.
   *
   * @param message - Human-readable error message
   * @param payload - Additional context about the search failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    payload?: PlanErrorPayload & { searchCriteria?: Record<string, any> },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      PlanErrorCodes.PLAN_PLAN_TECH_RETRIEVAL_FAILURE,
      {
        journey: JourneyType.PLAN,
        domain: PlanErrorDomain.PLANS,
        operation: 'searchPlans',
        data: payload
      },
      payload,
      cause
    );
  }
}
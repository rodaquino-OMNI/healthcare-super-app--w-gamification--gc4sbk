/**
 * @file benefits-errors.ts
 * @description Defines specialized error classes for the Benefits domain in the Plan journey.
 * These error classes ensure consistent error handling for benefit-related operations
 * with proper HTTP status codes and structured error responses.
 */

import { BaseError, ErrorType, JourneyContext } from '../../base';
import { PLAN_BENEF_BUSINESS_ERRORS, PLAN_BENEF_TECHNICAL_ERRORS, PLAN_BENEF_EXTERNAL_ERRORS } from './error-codes';
import { BenefitsErrorContext, PlanErrorType } from './types';

/**
 * Base class for all benefit-related errors in the Plan journey.
 * Provides common functionality and context for benefit errors.
 */
export abstract class BenefitError extends BaseError {
  /**
   * Creates a new BenefitError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    context: BenefitsErrorContext = {},
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    // Ensure journey context is set to PLAN
    super(
      message,
      type,
      code,
      { ...context, journey: JourneyContext.PLAN },
      details,
      suggestion,
      cause
    );

    // Add plan error type to details if not already present
    if (!this.details?.planErrorType) {
      this.details = {
        ...this.details,
        planErrorType: PlanErrorType.BENEFITS
      };
    }
  }
}

/**
 * Error thrown when a requested benefit cannot be found.
 * This is a business logic error that occurs when a benefit ID is valid
 * but the corresponding benefit does not exist in the system.
 */
export class BenefitNotFoundError extends BenefitError {
  /**
   * Creates a new BenefitNotFoundError instance.
   * 
   * @param benefitId - ID of the benefit that was not found
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const message = `Benefit with ID '${benefitId}' not found`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId
    };
    
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_BENEF_BUSINESS_ERRORS.BENEFIT_NOT_FOUND,
      enhancedContext,
      undefined,
      'Please verify the benefit ID and try again.',
      cause
    );
  }
}

/**
 * Error thrown when a benefit is not covered by the user's plan.
 * This is a business logic error that occurs when a user attempts to use
 * a benefit that is not included in their current insurance plan.
 */
export class BenefitNotCoveredError extends BenefitError {
  /**
   * Creates a new BenefitNotCoveredError instance.
   * 
   * @param benefitId - ID of the benefit that is not covered
   * @param benefitType - Type of the benefit that is not covered
   * @param planId - ID of the user's plan
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    benefitType: string,
    planId: string,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const message = `Benefit '${benefitType}' (ID: ${benefitId}) is not covered by plan ${planId}`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId,
      benefitType,
      planId
    };
    
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_BENEF_BUSINESS_ERRORS.BENEFIT_NOT_COVERED,
      enhancedContext,
      undefined,
      'Please check your plan coverage details or contact customer support for more information.',
      cause
    );
  }
}

/**
 * Error thrown when a user is not eligible for a specific benefit.
 * This is a business logic error that occurs when a user attempts to use
 * a benefit for which they do not meet the eligibility criteria.
 */
export class BenefitEligibilityError extends BenefitError {
  /**
   * Creates a new BenefitEligibilityError instance.
   * 
   * @param benefitId - ID of the benefit
   * @param benefitType - Type of the benefit
   * @param reason - Reason for the eligibility failure
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    benefitType: string,
    reason: string,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const message = `Not eligible for benefit '${benefitType}' (ID: ${benefitId}). Reason: ${reason}`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId,
      benefitType,
      eligibilityReason: reason
    };
    
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_BENEF_BUSINESS_ERRORS.VERIFICATION_FAILED,
      enhancedContext,
      undefined,
      'Please review the eligibility requirements or contact customer support for assistance.',
      cause
    );
  }
}

/**
 * Error thrown when a user has exceeded the usage limit for a benefit.
 * This is a business logic error that occurs when a user attempts to use
 * a benefit beyond its defined usage limits (e.g., number of visits, amount).
 */
export class BenefitLimitExceededError extends BenefitError {
  /**
   * Creates a new BenefitLimitExceededError instance.
   * 
   * @param benefitId - ID of the benefit
   * @param benefitType - Type of the benefit
   * @param currentUsage - Current usage amount or count
   * @param limitValue - Maximum allowed usage amount or count
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    benefitType: string,
    currentUsage: number,
    limitValue: number,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const message = `Benefit limit exceeded for '${benefitType}' (ID: ${benefitId}). Current usage: ${currentUsage}, Limit: ${limitValue}`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId,
      benefitType,
      currentUsage,
      limitValue
    };
    
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_BENEF_BUSINESS_ERRORS.BENEFIT_LIMIT_REACHED,
      enhancedContext,
      undefined,
      'You have reached the maximum allowed usage for this benefit. Please contact customer support for options.',
      cause
    );
  }
}

/**
 * Error thrown when there is a database or persistence issue with benefit data.
 * This is a technical error that occurs when the system encounters an issue
 * while saving, updating, or retrieving benefit information from the database.
 */
export class BenefitPersistenceError extends BenefitError {
  /**
   * Creates a new BenefitPersistenceError instance.
   * 
   * @param operation - The database operation that failed (e.g., 'create', 'update', 'delete', 'read')
   * @param benefitId - ID of the benefit (if available)
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    operation: string,
    benefitId?: string,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const idInfo = benefitId ? ` for benefit ID '${benefitId}'` : '';
    const message = `Database ${operation} operation failed${idInfo}`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId,
      operation
    };
    
    super(
      message,
      ErrorType.TECHNICAL,
      PLAN_BENEF_TECHNICAL_ERRORS.DATABASE_SAVE_ERROR,
      enhancedContext,
      undefined,
      'Please try again later or contact technical support if the issue persists.',
      cause
    );
  }
}

/**
 * Error thrown when there is an issue with the external benefit verification API.
 * This is an external system error that occurs when the system encounters an issue
 * while communicating with an external service for benefit verification.
 */
export class BenefitVerificationApiError extends BenefitError {
  /**
   * Creates a new BenefitVerificationApiError instance.
   * 
   * @param benefitId - ID of the benefit being verified (if available)
   * @param statusCode - HTTP status code from the external API (if available)
   * @param apiResponse - Response from the external API (if available)
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId?: string,
    statusCode?: number,
    apiResponse?: any,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const idInfo = benefitId ? ` for benefit ID '${benefitId}'` : '';
    const statusInfo = statusCode ? ` (Status: ${statusCode})` : '';
    const message = `Benefit verification API error${idInfo}${statusInfo}`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId,
      statusCode,
      apiResponse
    };
    
    super(
      message,
      ErrorType.EXTERNAL,
      PLAN_BENEF_EXTERNAL_ERRORS.VERIFICATION_SERVICE_ERROR,
      enhancedContext,
      undefined,
      'Please try again later or contact customer support if the issue persists.',
      cause
    );
  }
}

/**
 * Error thrown when a benefit has expired or is no longer available.
 * This is a business logic error that occurs when a user attempts to use
 * a benefit that has expired or is outside its valid period.
 */
export class BenefitExpiredError extends BenefitError {
  /**
   * Creates a new BenefitExpiredError instance.
   * 
   * @param benefitId - ID of the expired benefit
   * @param benefitType - Type of the expired benefit
   * @param expirationDate - Date when the benefit expired
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    benefitType: string,
    expirationDate: Date | string,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const expDateStr = typeof expirationDate === 'string' 
      ? expirationDate 
      : expirationDate.toISOString().split('T')[0];
    
    const message = `Benefit '${benefitType}' (ID: ${benefitId}) expired on ${expDateStr}`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId,
      benefitType,
      expirationDate: expDateStr
    };
    
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_BENEF_BUSINESS_ERRORS.BENEFIT_PERIOD_EXPIRED,
      enhancedContext,
      undefined,
      'Please check your current plan benefits or contact customer support for assistance.',
      cause
    );
  }
}

/**
 * Error thrown when a benefit requires prior authorization but none was obtained.
 * This is a business logic error that occurs when a user attempts to use
 * a benefit that requires prior authorization without obtaining it.
 */
export class BenefitAuthorizationRequiredError extends BenefitError {
  /**
   * Creates a new BenefitAuthorizationRequiredError instance.
   * 
   * @param benefitId - ID of the benefit
   * @param benefitType - Type of the benefit
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    benefitType: string,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const message = `Benefit '${benefitType}' (ID: ${benefitId}) requires prior authorization`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId,
      benefitType
    };
    
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_BENEF_BUSINESS_ERRORS.AUTHORIZATION_REQUIRED,
      enhancedContext,
      undefined,
      'Please contact your healthcare provider to obtain the required authorization before using this benefit.',
      cause
    );
  }
}

/**
 * Error thrown when a benefit has a waiting period that has not yet elapsed.
 * This is a business logic error that occurs when a user attempts to use
 * a benefit during its waiting period.
 */
export class BenefitWaitingPeriodError extends BenefitError {
  /**
   * Creates a new BenefitWaitingPeriodError instance.
   * 
   * @param benefitId - ID of the benefit
   * @param benefitType - Type of the benefit
   * @param waitingPeriodDays - Total waiting period in days
   * @param daysRemaining - Days remaining in the waiting period
   * @param availableDate - Date when the benefit becomes available
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    benefitType: string,
    waitingPeriodDays: number,
    daysRemaining: number,
    availableDate: Date | string,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const availableDateStr = typeof availableDate === 'string' 
      ? availableDate 
      : availableDate.toISOString().split('T')[0];
    
    const message = `Benefit '${benefitType}' (ID: ${benefitId}) has a waiting period of ${waitingPeriodDays} days with ${daysRemaining} days remaining. Available from ${availableDateStr}`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId,
      benefitType,
      waitingPeriodDays,
      daysRemaining,
      availableDate: availableDateStr
    };
    
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_BENEF_BUSINESS_ERRORS.WAITING_PERIOD_ACTIVE,
      enhancedContext,
      undefined,
      'This benefit will be available after the waiting period has elapsed. Please check back on the available date.',
      cause
    );
  }
}

/**
 * Error thrown when a benefit is excluded due to a pre-existing condition.
 * This is a business logic error that occurs when a user attempts to use
 * a benefit that is excluded due to a pre-existing condition.
 */
export class BenefitPreExistingConditionError extends BenefitError {
  /**
   * Creates a new BenefitPreExistingConditionError instance.
   * 
   * @param benefitId - ID of the benefit
   * @param benefitType - Type of the benefit
   * @param conditionCode - Code of the pre-existing condition
   * @param conditionName - Name of the pre-existing condition
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    benefitId: string,
    benefitType: string,
    conditionCode: string,
    conditionName: string,
    context: Partial<BenefitsErrorContext> = {},
    cause?: Error
  ) {
    const message = `Benefit '${benefitType}' (ID: ${benefitId}) is excluded due to pre-existing condition: ${conditionName} (${conditionCode})`;
    const enhancedContext: BenefitsErrorContext = {
      ...context,
      benefitId,
      benefitType,
      conditionCode,
      conditionName
    };
    
    super(
      message,
      ErrorType.BUSINESS,
      PLAN_BENEF_BUSINESS_ERRORS.PREEXISTING_CONDITION,
      enhancedContext,
      undefined,
      'Please contact customer support for more information about your coverage options.',
      cause
    );
  }
}
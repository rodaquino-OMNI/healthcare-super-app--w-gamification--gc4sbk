/**
 * @file Treatment Errors
 * @description Specialized error classes for the Treatment domain in the Care journey.
 * These error classes ensure consistent error handling for treatment-related operations
 * with proper HTTP status codes and structured error responses.
 *
 * @module @austa/errors/journey/care/treatment
 */

import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';

/**
 * Error code prefix for Treatment domain errors in the Care journey
 */
const ERROR_CODE_PREFIX = 'CARE_TREATMENT';

/**
 * Error thrown when a requested treatment plan cannot be found.
 * This is a business logic error that occurs when attempting to access or modify
 * a treatment plan that does not exist in the system.
 *
 * @example
 * // Throw when a treatment plan is not found by ID
 * throw new TreatmentPlanNotFoundError('Treatment plan not found', { planId: '12345' });
 */
export class TreatmentPlanNotFoundError extends AppException {
  /**
   * Creates a new TreatmentPlanNotFoundError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_001`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when treatment step data fails validation.
 * This is a validation error that occurs when treatment step data
 * is invalid, incomplete, or does not meet required criteria.
 *
 * @example
 * // Throw when treatment step data is invalid
 * throw new TreatmentStepInvalidError('Invalid treatment step data', {
 *   stepId: '12345',
 *   validationErrors: ['duration is required', 'frequency must be a positive number']
 * });
 */
export class TreatmentStepInvalidError extends AppException {
  /**
   * Creates a new TreatmentStepInvalidError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      `${ERROR_CODE_PREFIX}_002`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when a treatment plan conflicts with existing treatments.
 * This is a business logic error that occurs when a new treatment plan
 * conflicts with existing treatments, such as incompatible therapies or medications.
 *
 * @example
 * // Throw when a treatment plan conflicts with existing treatments
 * throw new TreatmentPlanConflictError('Treatment plan conflicts with existing treatments', {
 *   planId: '12345',
 *   conflictingPlanIds: ['67890', '54321'],
 *   conflictReason: 'Incompatible therapy types'
 * });
 */
export class TreatmentPlanConflictError extends AppException {
  /**
   * Creates a new TreatmentPlanConflictError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_003`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there are issues with tracking treatment progress.
 * This is a business logic error that occurs when the system cannot
 * properly track or update treatment progress due to business rule violations.
 *
 * @example
 * // Throw when treatment progress cannot be updated
 * throw new TreatmentProgressError('Cannot update treatment progress', {
 *   planId: '12345',
 *   stepId: '67890',
 *   reason: 'Step prerequisites not completed'
 * });
 */
export class TreatmentProgressError extends AppException {
  /**
   * Creates a new TreatmentProgressError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_004`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there are issues with persisting treatment data.
 * This is a technical error that occurs when the system encounters
 * database or storage issues when saving treatment-related data.
 *
 * @example
 * // Throw when treatment data cannot be saved
 * throw new TreatmentPersistenceError('Failed to save treatment plan', {
 *   planId: '12345',
 *   operation: 'create'
 * }, originalError);
 */
export class TreatmentPersistenceError extends AppException {
  /**
   * Creates a new TreatmentPersistenceError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      `${ERROR_CODE_PREFIX}_005`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there are issues with clinical guidelines integration.
 * This is an external system error that occurs when the system cannot
 * properly integrate with external clinical guidelines systems.
 *
 * @example
 * // Throw when clinical guidelines cannot be retrieved
 * throw new ClinicalGuidelinesError('Failed to retrieve clinical guidelines', {
 *   conditionCode: 'J45.909', // Asthma, unspecified
 *   guidelineSystem: 'NICE',
 *   requestId: '12345'
 * }, originalError);
 */
export class ClinicalGuidelinesError extends AppException {
  /**
   * Creates a new ClinicalGuidelinesError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      `${ERROR_CODE_PREFIX}_006`,
      details,
      cause
    );
  }
}
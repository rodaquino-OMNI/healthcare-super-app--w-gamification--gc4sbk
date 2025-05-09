import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Error code prefix for treatment-related errors in the Care journey
 */
const ERROR_CODE_PREFIX = 'CARE_TREATMENT';

/**
 * Error thrown when a treatment plan cannot be found
 */
export class TreatmentPlanNotFoundError extends AppException {
  /**
   * Creates a new TreatmentPlanNotFoundError instance
   * 
   * @param planId - ID of the treatment plan that was not found
   * @param userId - ID of the user associated with the treatment plan
   * @param details - Additional error details (optional)
   */
  constructor(
    planId: string,
    userId: string,
    details?: Record<string, any>
  ) {
    super(
      `Treatment plan with ID ${planId} not found for user ${userId}`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_001`,
      details
    );
  }
}

/**
 * Error thrown when a treatment step is invalid or cannot be processed
 */
export class TreatmentStepInvalidError extends AppException {
  /**
   * Creates a new TreatmentStepInvalidError instance
   * 
   * @param stepId - ID of the invalid treatment step
   * @param planId - ID of the treatment plan containing the step
   * @param reason - Reason why the step is invalid
   * @param details - Additional error details (optional)
   */
  constructor(
    stepId: string,
    planId: string,
    reason: string,
    details?: Record<string, any>
  ) {
    super(
      `Invalid treatment step ${stepId} in plan ${planId}: ${reason}`,
      ErrorType.VALIDATION,
      `${ERROR_CODE_PREFIX}_002`,
      details
    );
  }
}

/**
 * Error thrown when a treatment plan conflicts with another treatment
 * (e.g., incompatible medications, conflicting therapies)
 */
export class TreatmentPlanConflictError extends AppException {
  /**
   * Creates a new TreatmentPlanConflictError instance
   * 
   * @param planId - ID of the treatment plan with conflicts
   * @param conflictingPlanId - ID of the conflicting treatment plan
   * @param conflictReason - Description of the conflict
   * @param details - Additional error details (optional)
   */
  constructor(
    planId: string,
    conflictingPlanId: string,
    conflictReason: string,
    details?: Record<string, any>
  ) {
    super(
      `Treatment plan ${planId} conflicts with plan ${conflictingPlanId}: ${conflictReason}`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_003`,
      details
    );
  }
}

/**
 * Error thrown when there are issues tracking treatment progress
 */
export class TreatmentProgressError extends AppException {
  /**
   * Creates a new TreatmentProgressError instance
   * 
   * @param planId - ID of the treatment plan
   * @param userId - ID of the user associated with the treatment plan
   * @param reason - Reason for the progress tracking failure
   * @param details - Additional error details (optional)
   */
  constructor(
    planId: string,
    userId: string,
    reason: string,
    details?: Record<string, any>
  ) {
    super(
      `Failed to track progress for treatment plan ${planId} for user ${userId}: ${reason}`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_004`,
      details
    );
  }
}

/**
 * Error thrown when there are database or persistence issues with treatment data
 */
export class TreatmentPersistenceError extends AppException {
  /**
   * Creates a new TreatmentPersistenceError instance
   * 
   * @param operation - Database operation that failed (e.g., 'create', 'update', 'delete')
   * @param entityType - Type of entity being operated on (e.g., 'treatment plan', 'treatment step')
   * @param entityId - ID of the entity (if available)
   * @param cause - Original error that caused this exception
   * @param details - Additional error details (optional)
   */
  constructor(
    operation: string,
    entityType: string,
    entityId: string | null,
    cause: Error,
    details?: Record<string, any>
  ) {
    super(
      `Failed to ${operation} ${entityType}${entityId ? ` with ID ${entityId}` : ''}: ${cause.message}`,
      ErrorType.TECHNICAL,
      `${ERROR_CODE_PREFIX}_005`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there are issues with clinical guidelines integration
 */
export class ClinicalGuidelinesError extends AppException {
  /**
   * Creates a new ClinicalGuidelinesError instance
   * 
   * @param operation - Operation that failed (e.g., 'validate', 'lookup', 'recommend')
   * @param guidelineSystem - Name of the clinical guideline system
   * @param errorCode - Error code from the external system (if available)
   * @param cause - Original error that caused this exception (optional)
   * @param details - Additional error details (optional)
   */
  constructor(
    operation: string,
    guidelineSystem: string,
    errorCode: string | null,
    cause?: Error,
    details?: Record<string, any>
  ) {
    super(
      `Clinical guidelines ${operation} operation failed with ${guidelineSystem}${errorCode ? ` (code: ${errorCode})` : ''}`,
      ErrorType.EXTERNAL,
      `${ERROR_CODE_PREFIX}_006`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when a treatment step cannot be completed
 */
export class TreatmentStepCompletionError extends AppException {
  /**
   * Creates a new TreatmentStepCompletionError instance
   * 
   * @param stepId - ID of the treatment step
   * @param planId - ID of the treatment plan
   * @param reason - Reason why the step cannot be completed
   * @param details - Additional error details (optional)
   */
  constructor(
    stepId: string,
    planId: string,
    reason: string,
    details?: Record<string, any>
  ) {
    super(
      `Cannot complete treatment step ${stepId} in plan ${planId}: ${reason}`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_007`,
      details
    );
  }
}

/**
 * Error thrown when a treatment plan cannot be updated
 */
export class TreatmentPlanUpdateError extends AppException {
  /**
   * Creates a new TreatmentPlanUpdateError instance
   * 
   * @param planId - ID of the treatment plan
   * @param reason - Reason why the plan cannot be updated
   * @param details - Additional error details (optional)
   */
  constructor(
    planId: string,
    reason: string,
    details?: Record<string, any>
  ) {
    super(
      `Cannot update treatment plan ${planId}: ${reason}`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_008`,
      details
    );
  }
}

/**
 * Error thrown when a treatment plan cannot be created
 */
export class TreatmentPlanCreationError extends AppException {
  /**
   * Creates a new TreatmentPlanCreationError instance
   * 
   * @param userId - ID of the user for whom the plan was being created
   * @param reason - Reason why the plan cannot be created
   * @param details - Additional error details (optional)
   */
  constructor(
    userId: string,
    reason: string,
    details?: Record<string, any>
  ) {
    super(
      `Cannot create treatment plan for user ${userId}: ${reason}`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_009`,
      details
    );
  }
}

/**
 * Error thrown when a treatment plan validation fails
 */
export class TreatmentPlanValidationError extends AppException {
  /**
   * Creates a new TreatmentPlanValidationError instance
   * 
   * @param planId - ID of the treatment plan (if available)
   * @param validationErrors - List of validation errors
   * @param details - Additional error details (optional)
   */
  constructor(
    planId: string | null,
    validationErrors: string[],
    details?: Record<string, any>
  ) {
    super(
      `Treatment plan${planId ? ` ${planId}` : ''} validation failed: ${validationErrors.join(', ')}`,
      ErrorType.VALIDATION,
      `${ERROR_CODE_PREFIX}_010`,
      details
    );
  }
}

/**
 * Error thrown when a treatment adherence check fails
 */
export class TreatmentAdherenceError extends AppException {
  /**
   * Creates a new TreatmentAdherenceError instance
   * 
   * @param planId - ID of the treatment plan
   * @param userId - ID of the user
   * @param adherenceRate - Current adherence rate (if available)
   * @param threshold - Minimum required adherence threshold
   * @param details - Additional error details (optional)
   */
  constructor(
    planId: string,
    userId: string,
    adherenceRate: number | null,
    threshold: number,
    details?: Record<string, any>
  ) {
    super(
      `Treatment adherence below threshold for plan ${planId} (user ${userId}): ${adherenceRate !== null ? `${adherenceRate}%` : 'unknown'} < ${threshold}%`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_011`,
      details
    );
  }
}

/**
 * Error thrown when a treatment plan is already completed
 */
export class TreatmentPlanAlreadyCompletedError extends AppException {
  /**
   * Creates a new TreatmentPlanAlreadyCompletedError instance
   * 
   * @param planId - ID of the treatment plan
   * @param completionDate - Date when the plan was completed
   * @param details - Additional error details (optional)
   */
  constructor(
    planId: string,
    completionDate: Date,
    details?: Record<string, any>
  ) {
    super(
      `Treatment plan ${planId} is already completed (completed on ${completionDate.toISOString()})`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}_012`,
      details
    );
  }
}
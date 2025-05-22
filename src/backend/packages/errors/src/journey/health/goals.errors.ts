import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Interface defining the structure of health goal error context.
 * This provides detailed information about the goal that caused the error.
 */
export interface HealthGoalErrorContext {
  /** Unique identifier of the goal, if available */
  goalId?: string;
  /** Type of health goal (e.g., 'steps', 'weight', 'sleep', 'activity') */
  goalType?: string;
  /** Target value for the goal (e.g., 10000 steps, 8 hours sleep) */
  targetValue?: number | string;
  /** Unit of measurement for the goal (e.g., 'steps', 'kg', 'hours') */
  unit?: string;
  /** Start date of the goal period */
  startDate?: Date | string;
  /** End date of the goal period */
  endDate?: Date | string;
  /** Current progress toward the goal, if applicable */
  currentProgress?: number | string;
  /** Additional goal-specific parameters */
  parameters?: Record<string, any>;
  /** User ID associated with the goal */
  userId?: string;
}

/**
 * Base class for all health goal related errors.
 * Extends AppException with health goal specific context.
 */
export abstract class HealthGoalException extends AppException {
  /**
   * Creates a new HealthGoalException instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code with HEALTH_GOALS_ prefix
   * @param goalContext - Context information about the health goal
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    public readonly goalContext: HealthGoalErrorContext,
    cause?: Error
  ) {
    super(message, type, code, goalContext, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HealthGoalException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with goal-specific context.
   * Overrides the base toJSON method to include goal context in a structured format.
   * 
   * @returns JSON object with standardized error structure including goal context
   */
  toJSON(): Record<string, any> {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        details: this.goalContext
      }
    };
  }
}

/**
 * Error thrown when goal parameters fail validation.
 * Examples include invalid target values, unsupported goal types, or invalid timeframes.
 */
export class InvalidGoalParametersError extends HealthGoalException {
  /**
   * Creates a new InvalidGoalParametersError instance.
   * 
   * @param message - Specific validation error message
   * @param goalContext - Context about the goal with invalid parameters
   * @param cause - Original validation error, if any
   */
  constructor(
    message: string,
    goalContext: HealthGoalErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'HEALTH_GOALS_INVALID_PARAMETERS',
      goalContext,
      cause
    );
  }
}

/**
 * Error thrown when a goal conflicts with existing goals.
 * Examples include overlapping timeframes for the same goal type or conflicting targets.
 */
export class ConflictingGoalsError extends HealthGoalException {
  /**
   * Creates a new ConflictingGoalsError instance.
   * 
   * @param message - Description of the conflict
   * @param goalContext - Context about the conflicting goal
   * @param conflictingGoalIds - IDs of goals that conflict with the current goal
   */
  constructor(
    message: string,
    goalContext: HealthGoalErrorContext,
    public readonly conflictingGoalIds: string[]
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_GOALS_CONFLICT',
      {
        ...goalContext,
        conflictingGoalIds
      }
    );
  }
}

/**
 * Error thrown when a goal is determined to be unachievable based on user history or constraints.
 * Examples include targets that are too aggressive compared to historical performance.
 */
export class UnachievableGoalError extends HealthGoalException {
  /**
   * Creates a new UnachievableGoalError instance.
   * 
   * @param message - Explanation of why the goal is deemed unachievable
   * @param goalContext - Context about the unachievable goal
   * @param recommendedTarget - Optional recommended alternative target that would be achievable
   */
  constructor(
    message: string,
    goalContext: HealthGoalErrorContext,
    public readonly recommendedTarget?: number | string
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_GOALS_UNACHIEVABLE',
      {
        ...goalContext,
        recommendedTarget
      }
    );
  }
}

/**
 * Error thrown when a goal cannot be updated due to business rules.
 * Examples include attempting to modify a completed goal or changing a goal in progress beyond allowed thresholds.
 */
export class GoalUpdateRestrictedError extends HealthGoalException {
  /**
   * Creates a new GoalUpdateRestrictedError instance.
   * 
   * @param message - Explanation of why the goal cannot be updated
   * @param goalContext - Context about the goal that cannot be updated
   * @param restrictionReason - Specific reason code for the restriction
   */
  constructor(
    message: string,
    goalContext: HealthGoalErrorContext,
    public readonly restrictionReason: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED' | 'SYSTEM_GENERATED'
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_GOALS_UPDATE_RESTRICTED',
      {
        ...goalContext,
        restrictionReason
      }
    );
  }
}

/**
 * Error thrown when goal tracking encounters technical issues.
 * Examples include database errors when updating progress or integration failures with metric systems.
 */
export class GoalTrackingFailureError extends HealthGoalException {
  /**
   * Creates a new GoalTrackingFailureError instance.
   * 
   * @param message - Description of the tracking failure
   * @param goalContext - Context about the goal with tracking issues
   * @param operationType - Type of operation that failed (create, update, delete, progress)
   * @param cause - Original technical error that caused the failure
   */
  constructor(
    message: string,
    goalContext: HealthGoalErrorContext,
    public readonly operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'PROGRESS' | 'ACHIEVEMENT',
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      'HEALTH_GOALS_TRACKING_FAILURE',
      {
        ...goalContext,
        operationType
      },
      cause
    );
  }
}

/**
 * Error thrown when goal achievement processing fails.
 * Examples include failures when integrating with the gamification system for rewards.
 */
export class GoalAchievementProcessingError extends HealthGoalException {
  /**
   * Creates a new GoalAchievementProcessingError instance.
   * 
   * @param message - Description of the achievement processing failure
   * @param goalContext - Context about the goal with achievement processing issues
   * @param achievementId - ID of the achievement that failed to process, if available
   * @param cause - Original error that caused the failure
   */
  constructor(
    message: string,
    goalContext: HealthGoalErrorContext,
    public readonly achievementId?: string,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      'HEALTH_GOALS_ACHIEVEMENT_FAILURE',
      {
        ...goalContext,
        achievementId
      },
      cause
    );
  }
}

/**
 * Error thrown when a goal cannot be found.
 * Examples include attempting to update or delete a non-existent goal.
 */
export class GoalNotFoundError extends HealthGoalException {
  /**
   * Creates a new GoalNotFoundError instance.
   * 
   * @param message - Description of the not found error
   * @param goalId - ID of the goal that could not be found
   * @param userId - ID of the user who owns the goal
   */
  constructor(
    message: string,
    goalId: string,
    userId: string
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_GOALS_NOT_FOUND',
      {
        goalId,
        userId
      }
    );
  }
}
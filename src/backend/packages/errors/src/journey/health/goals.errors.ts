import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Interface defining the context for health goal errors.
 * Provides structured information about the goal that caused the error.
 */
export interface HealthGoalErrorContext {
  /** The ID of the goal, if available */
  goalId?: string;
  /** The type of the goal (steps, sleep, weight, etc.) */
  goalType?: string;
  /** The target value for the goal */
  targetValue?: number;
  /** The unit of measurement for the goal */
  unit?: string;
  /** The time period for the goal (daily, weekly, monthly, custom) */
  period?: string;
  /** The start date for the goal */
  startDate?: Date;
  /** The end date for the goal, if applicable */
  endDate?: Date;
  /** Additional context-specific information */
  additionalInfo?: Record<string, any>;
}

/**
 * Base class for all health goal related errors.
 * Extends AppException with health goal specific context.
 */
export abstract class HealthGoalError extends AppException {
  /**
   * Creates a new HealthGoalError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code with HEALTH_GOALS_ prefix
   * @param context - Health goal specific context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    public readonly context?: HealthGoalErrorContext,
    cause?: Error
  ) {
    super(message, type, code, context, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HealthGoalError.prototype);
  }

  /**
   * Returns a JSON representation of the exception with health goal context.
   * Overrides the base toJSON method to include goal-specific details.
   * 
   * @returns JSON object with standardized error structure and goal context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    // Add journey-specific context to help with debugging and user messaging
    if (this.context) {
      baseJson.error.journey = 'health';
      baseJson.error.feature = 'goals';
      baseJson.error.context = this.context;
    }
    
    return baseJson;
  }
}

/**
 * Error thrown when goal parameters are invalid.
 * This is a validation error that occurs during goal creation or update.
 */
export class InvalidGoalParametersError extends HealthGoalError {
  /**
   * Creates a new InvalidGoalParametersError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Health goal specific context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Invalid health goal parameters',
    context?: HealthGoalErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'HEALTH_GOALS_INVALID_PARAMETERS',
      context,
      cause
    );
  }
}

/**
 * Error thrown when a goal conflicts with existing goals.
 * This is a business error that occurs when a user tries to create a goal
 * that conflicts with their existing goals (e.g., duplicate goal type for the same period).
 */
export class ConflictingGoalsError extends HealthGoalError {
  /**
   * Creates a new ConflictingGoalsError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Health goal specific context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Goal conflicts with existing goals',
    context?: HealthGoalErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_GOALS_CONFLICT',
      context,
      cause
    );
  }
}

/**
 * Error thrown when a goal is deemed unachievable based on user history.
 * This is a business error that occurs during goal validation.
 */
export class UnachievableGoalError extends HealthGoalError {
  /**
   * Creates a new UnachievableGoalError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Health goal specific context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Goal appears to be unachievable based on history',
    context?: HealthGoalErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_GOALS_UNACHIEVABLE',
      context,
      cause
    );
  }
}

/**
 * Error thrown when a user exceeds the maximum number of allowed goals.
 * This is a business error that occurs during goal creation.
 */
export class GoalLimitExceededError extends HealthGoalError {
  /**
   * Creates a new GoalLimitExceededError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Health goal specific context with limit information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Maximum number of allowed goals exceeded',
    context?: HealthGoalErrorContext & { currentCount?: number, maxAllowed?: number },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_GOALS_LIMIT_EXCEEDED',
      context,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in tracking goal progress.
 * This is a technical error that occurs during goal progress updates.
 */
export class GoalTrackingFailureError extends HealthGoalError {
  /**
   * Creates a new GoalTrackingFailureError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Health goal specific context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Failed to track goal progress',
    context?: HealthGoalErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      'HEALTH_GOALS_TRACKING_FAILURE',
      context,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in synchronizing goals with external systems.
 * This is a technical error that occurs during integration with external health systems.
 */
export class GoalSynchronizationError extends HealthGoalError {
  /**
   * Creates a new GoalSynchronizationError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Health goal specific context with external system information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Failed to synchronize goal with external system',
    context?: HealthGoalErrorContext & { externalSystem?: string, operationType?: string },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_GOALS_SYNC_FAILURE',
      context,
      cause
    );
  }
}

/**
 * Error thrown when a goal achievement event fails to process.
 * This is a technical error that occurs during integration with the gamification system.
 */
export class GoalAchievementProcessingError extends HealthGoalError {
  /**
   * Creates a new GoalAchievementProcessingError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Health goal specific context with achievement information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Failed to process goal achievement',
    context?: HealthGoalErrorContext & { achievementId?: string, eventId?: string },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      'HEALTH_GOALS_ACHIEVEMENT_PROCESSING_FAILURE',
      context,
      cause
    );
  }
}
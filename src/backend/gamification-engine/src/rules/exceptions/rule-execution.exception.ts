import { AppException, ErrorType } from 'src/backend/shared/src/exceptions/exceptions.types';

/**
 * Type of action being executed when the failure occurred.
 * Used to provide context about what operation was being attempted.
 */
export enum RuleActionType {
  AWARD_POINTS = 'award_points',
  UNLOCK_ACHIEVEMENT = 'unlock_achievement',
  PROGRESS_QUEST = 'progress_quest',
  GRANT_REWARD = 'grant_reward',
  UPDATE_PROFILE = 'update_profile',
  TRIGGER_EVENT = 'trigger_event',
  CUSTOM = 'custom'
}

/**
 * Exception thrown when a rule's action execution fails after successful evaluation.
 * This occurs when the rule condition was satisfied, but the resulting action
 * (such as awarding points, unlocking achievements, etc.) could not be completed.
 */
export class RuleExecutionException extends AppException {
  /**
   * Creates a new RuleExecutionException instance.
   * 
   * @param message - Human-readable error message
   * @param ruleId - Identifier of the rule that failed during action execution
   * @param actionType - Type of action that was being executed
   * @param userId - Identifier of the user for whom the action was being executed
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    public readonly ruleId: string,
    public readonly actionType: RuleActionType,
    public readonly userId: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL, // System error (5xx)
      'GAME_RULE_EXEC_001', // Error code for rule execution failures
      {
        ruleId,
        actionType,
        userId,
        ...details
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RuleExecutionException.prototype);
  }

  /**
   * Creates a standardized error message for rule execution failures.
   * 
   * @param ruleId - Identifier of the rule
   * @param actionType - Type of action that failed
   * @returns A formatted error message
   */
  static createMessage(ruleId: string, actionType: RuleActionType): string {
    return `Failed to execute ${actionType} action for rule ${ruleId}`;
  }

  /**
   * Factory method to create a RuleExecutionException from a specific action type.
   * Provides a convenient way to create exceptions with standardized messages.
   * 
   * @param ruleId - Identifier of the rule
   * @param actionType - Type of action that failed
   * @param userId - Identifier of the user
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception (optional)
   * @returns A new RuleExecutionException instance
   */
  static fromAction(
    ruleId: string,
    actionType: RuleActionType,
    userId: string,
    details?: Record<string, any>,
    cause?: Error
  ): RuleExecutionException {
    return new RuleExecutionException(
      RuleExecutionException.createMessage(ruleId, actionType),
      ruleId,
      actionType,
      userId,
      details,
      cause
    );
  }
}
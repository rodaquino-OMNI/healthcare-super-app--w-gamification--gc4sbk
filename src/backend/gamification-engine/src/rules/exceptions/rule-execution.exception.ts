import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Represents the type of action that was being executed when the failure occurred.
 */
export enum RuleActionType {
  AWARD_POINTS = 'award_points',
  UNLOCK_ACHIEVEMENT = 'unlock_achievement',
  PROGRESS_QUEST = 'progress_quest',
  GRANT_REWARD = 'grant_reward',
  TRIGGER_EVENT = 'trigger_event',
  CUSTOM = 'custom'
}

/**
 * Interface for the context details of a rule execution failure.
 */
export interface RuleExecutionErrorContext {
  /** The ID of the rule that failed during execution */
  ruleId: string;
  /** The ID of the user for whom the rule was being executed */
  userId: string;
  /** The type of action that was being executed */
  actionType: RuleActionType;
  /** Any additional parameters related to the action */
  actionParams?: Record<string, any>;
  /** The event that triggered the rule evaluation */
  triggeringEvent?: Record<string, any>;
}

/**
 * Exception thrown when a rule's action execution fails after successful evaluation.
 * 
 * This exception is used when the rule condition was successfully evaluated to true,
 * but the resulting action (such as awarding points, unlocking achievements, or
 * progressing quests) could not be completed due to a system error.
 */
export class RuleExecutionException extends AppException {
  /**
   * Creates a new RuleExecutionException.
   * 
   * @param message - Human-readable error message
   * @param context - Detailed context about the rule execution failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    public readonly context: RuleExecutionErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL, // System errors are classified as TECHNICAL
      'GAME_020', // Gamification engine error code for rule execution failures
      context,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RuleExecutionException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with additional context.
   * Extends the base toJSON method to include rule execution specific details.
   * 
   * @returns JSON object with standardized error structure and rule context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    // Add rule-specific context to the error details
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        ruleId: this.context.ruleId,
        actionType: this.context.actionType,
        userId: this.context.userId
      }
    };
  }
}
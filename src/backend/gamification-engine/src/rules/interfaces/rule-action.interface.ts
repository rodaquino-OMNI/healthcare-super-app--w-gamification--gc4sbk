/**
 * Interfaces for rule actions and their parameters in the gamification engine.
 * These interfaces define the structure of actions that can be executed when a rule is triggered.
 * 
 * The rule action system enables type-safe action processing and validation, preventing
 * misconfiguration of rule actions and ensuring consistent action execution across the rules system.
 */

/**
 * Enum representing the different journeys in the application.
 * Used to target actions to specific journeys.
 */
export enum JourneyType {
  /**
   * Health journey - focused on personal health metrics, goals, and medical history.
   */
  HEALTH = 'HEALTH',
  
  /**
   * Care journey - focused on appointments, medications, and treatments.
   */
  CARE = 'CARE',
  
  /**
   * Plan journey - focused on insurance plans, benefits, and claims.
   */
  PLAN = 'PLAN',
  
  /**
   * For actions that apply to all journeys.
   */
  ALL = 'ALL',
}

/**
 * Enum representing the different types of actions that can be executed when a rule is triggered.
 */
export enum ActionType {
  /**
   * Awards experience points to a user.
   */
  AWARD_XP = 'AWARD_XP',
  
  /**
   * Unlocks an achievement for a user.
   */
  UNLOCK_ACHIEVEMENT = 'UNLOCK_ACHIEVEMENT',
  
  /**
   * Progresses a user's quest by a specified amount.
   */
  PROGRESS_QUEST = 'PROGRESS_QUEST',
}

/**
 * Base interface for all rule actions.
 * Uses a discriminated union pattern with the 'type' property to enable type-safe action handling.
 */
export interface IRuleActionBase {
  /**
   * The type of action to execute.
   * This property is used as a discriminator for the union type.
   */
  type: ActionType;
  
  /**
   * Optional journey context for the action.
   * If specified, the action will only be applied within the context of the specified journey.
   * If not specified or set to JourneyType.ALL, the action applies to all journeys.
   */
  journey?: JourneyType;
}

/**
 * Interface for actions that award experience points to a user.
 */
export interface IAwardXpAction extends IRuleActionBase {
  type: ActionType.AWARD_XP;
  
  /**
   * The amount of XP to award to the user.
   * Must be a positive integer.
   */
  value: number;
}

/**
 * Interface for actions that unlock an achievement for a user.
 */
export interface IUnlockAchievementAction extends IRuleActionBase {
  type: ActionType.UNLOCK_ACHIEVEMENT;
  
  /**
   * The ID of the achievement to unlock.
   */
  achievementId: string;
}

/**
 * Interface for actions that progress a user's quest.
 */
export interface IProgressQuestAction extends IRuleActionBase {
  type: ActionType.PROGRESS_QUEST;
  
  /**
   * The ID of the quest to progress.
   */
  questId: string;
  
  /**
   * The amount of progress to add to the quest.
   * Must be a positive integer.
   */
  value: number;
}

/**
 * Union type representing all possible rule actions.
 * This enables type-safe handling of actions based on their type.
 */
export type IRuleAction = IAwardXpAction | IUnlockAchievementAction | IProgressQuestAction;

/**
 * Type guard to check if an action is an award XP action.
 * @param action The action to check.
 * @returns True if the action is an award XP action, false otherwise.
 */
export function isAwardXpAction(action: IRuleAction): action is IAwardXpAction {
  return action.type === ActionType.AWARD_XP;
}

/**
 * Type guard to check if an action is an unlock achievement action.
 * @param action The action to check.
 * @returns True if the action is an unlock achievement action, false otherwise.
 */
export function isUnlockAchievementAction(action: IRuleAction): action is IUnlockAchievementAction {
  return action.type === ActionType.UNLOCK_ACHIEVEMENT;
}

/**
 * Type guard to check if an action is a progress quest action.
 * @param action The action to check.
 * @returns True if the action is a progress quest action, false otherwise.
 */
export function isProgressQuestAction(action: IRuleAction): action is IProgressQuestAction {
  return action.type === ActionType.PROGRESS_QUEST;
}

/**
 * Interface for validation results with error messages.
 */
export interface IValidationResult {
  /**
   * Whether the validation passed.
   */
  valid: boolean;
  
  /**
   * Error message if validation failed, empty string otherwise.
   */
  error: string;
}

/**
 * Creates a successful validation result.
 * @returns A successful validation result.
 */
export function validResult(): IValidationResult {
  return { valid: true, error: '' };
}

/**
 * Creates a failed validation result with the specified error message.
 * @param error The error message.
 * @returns A failed validation result.
 */
export function invalidResult(error: string): IValidationResult {
  return { valid: false, error };
}

/**
 * Validates an award XP action.
 * @param action The action to validate.
 * @returns A validation result object.
 */
export function validateAwardXpAction(action: IAwardXpAction): IValidationResult {
  if (action.value <= 0) {
    return invalidResult(`XP value must be positive, got ${action.value}`);
  }
  
  return validResult();
}

/**
 * Validates an unlock achievement action.
 * @param action The action to validate.
 * @returns A validation result object.
 */
export function validateUnlockAchievementAction(action: IUnlockAchievementAction): IValidationResult {
  if (!action.achievementId || action.achievementId.trim().length === 0) {
    return invalidResult('Achievement ID is required');
  }
  
  return validResult();
}

/**
 * Validates a progress quest action.
 * @param action The action to validate.
 * @returns A validation result object.
 */
export function validateProgressQuestAction(action: IProgressQuestAction): IValidationResult {
  if (!action.questId || action.questId.trim().length === 0) {
    return invalidResult('Quest ID is required');
  }
  
  if (action.value <= 0) {
    return invalidResult(`Progress value must be positive, got ${action.value}`);
  }
  
  return validResult();
}

/**
 * Validates a rule action based on its type.
 * @param action The action to validate.
 * @returns A validation result object.
 */
export function validateRuleAction(action: IRuleAction): IValidationResult {
  // Validate journey type if specified
  if (action.journey && !Object.values(JourneyType).includes(action.journey)) {
    return invalidResult(`Invalid journey type: ${action.journey}`);
  }
  
  switch (action.type) {
    case ActionType.AWARD_XP:
      return validateAwardXpAction(action);
    case ActionType.UNLOCK_ACHIEVEMENT:
      return validateUnlockAchievementAction(action);
    case ActionType.PROGRESS_QUEST:
      return validateProgressQuestAction(action);
    default:
      return invalidResult(`Unknown action type: ${(action as any).type}`);
  }
}

/**
 * Result of parsing rule actions from JSON.
 */
export interface IParseRuleActionsResult {
  /**
   * The parsed actions.
   */
  actions: IRuleAction[];
  
  /**
   * Any errors encountered during parsing.
   */
  errors: string[];
  
  /**
   * Whether the parsing was successful (no errors).
   */
  success: boolean;
}

/**
 * Converts an array of rule actions to a JSON string.
 * @param actions The actions to convert.
 * @returns A JSON string representation of the actions.
 */
export function stringifyRuleActions(actions: IRuleAction[]): string {
  return JSON.stringify(actions, null, 2);
}

/**
 * Filters actions by journey type.
 * @param actions The actions to filter.
 * @param journeyType The journey type to filter by.
 * @returns Actions that apply to the specified journey type.
 */
export function filterActionsByJourney(actions: IRuleAction[], journeyType: JourneyType): IRuleAction[] {
  return actions.filter(action => {
    // If the action doesn't specify a journey, it applies to all journeys
    if (!action.journey) {
      return true;
    }
    
    // If the action specifies ALL, it applies to all journeys
    if (action.journey === JourneyType.ALL) {
      return true;
    }
    
    // Otherwise, check if the action's journey matches the specified journey
    return action.journey === journeyType;
  });
}

/**
 * Parses a JSON string into an array of rule actions.
 * @param actionsJson The JSON string to parse.
 * @returns A result object containing the parsed actions and any errors.
 */
export function parseRuleActions(actionsJson: string): IParseRuleActionsResult {
  const result: IParseRuleActionsResult = {
    actions: [],
    errors: [],
    success: true
  };
  
  try {
    const parsedData = JSON.parse(actionsJson);
    
    if (!Array.isArray(parsedData)) {
      result.errors.push('Actions must be an array');
      result.success = false;
      return result;
    }
    
    // Validate each action
    parsedData.forEach((action, index) => {
      // Check if the action has a valid type
      if (!action || typeof action !== 'object' || !action.type) {
        result.errors.push(`Action at index ${index} is missing a type property`);
        return;
      }
      
      // Validate the action
      const validationResult = validateRuleAction(action as IRuleAction);
      
      if (validationResult.valid) {
        result.actions.push(action as IRuleAction);
      } else {
        result.errors.push(`Action at index ${index}: ${validationResult.error}`);
      }
    });
    
    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.errors.push(`Failed to parse actions JSON: ${error instanceof Error ? error.message : String(error)}`);
    result.success = false;
    return result;
  }
}
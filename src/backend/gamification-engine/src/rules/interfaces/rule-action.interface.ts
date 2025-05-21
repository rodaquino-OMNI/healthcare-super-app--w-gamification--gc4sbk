/**
 * Defines interfaces for rule actions and their parameters in the gamification engine.
 * This file provides type definitions for different action types and their required parameters,
 * ensuring consistent action execution across the rules system.
 */

/**
 * Enum for supported rule action types
 */
export enum RuleActionType {
  AWARD_XP = 'AWARD_XP',
  UNLOCK_ACHIEVEMENT = 'UNLOCK_ACHIEVEMENT',
  PROGRESS_QUEST = 'PROGRESS_QUEST',
}

/**
 * Enum for supported journey types
 */
export enum JourneyType {
  HEALTH = 'HEALTH',
  CARE = 'CARE',
  PLAN = 'PLAN',
  ALL = 'ALL', // Applies to all journeys
}

/**
 * Base interface for all rule actions
 */
export interface IRuleActionBase {
  type: RuleActionType;
  journeyType?: JourneyType; // Optional journey type to target specific journeys
}

/**
 * Interface for AWARD_XP action
 */
export interface IAwardXpAction extends IRuleActionBase {
  type: RuleActionType.AWARD_XP;
  value: number; // Amount of XP to award
}

/**
 * Interface for UNLOCK_ACHIEVEMENT action
 */
export interface IUnlockAchievementAction extends IRuleActionBase {
  type: RuleActionType.UNLOCK_ACHIEVEMENT;
  achievementId: string; // ID of the achievement to unlock
}

/**
 * Interface for PROGRESS_QUEST action
 */
export interface IProgressQuestAction extends IRuleActionBase {
  type: RuleActionType.PROGRESS_QUEST;
  questId: string; // ID of the quest to progress
  value: number; // Amount of progress to add
}

/**
 * Union type for all rule actions
 */
export type IRuleAction = IAwardXpAction | IUnlockAchievementAction | IProgressQuestAction;

/**
 * Type guard to check if an action is an AWARD_XP action
 * @param action The action to check
 * @returns True if the action is an AWARD_XP action
 */
export function isAwardXpAction(action: IRuleAction): action is IAwardXpAction {
  return action.type === RuleActionType.AWARD_XP;
}

/**
 * Type guard to check if an action is an UNLOCK_ACHIEVEMENT action
 * @param action The action to check
 * @returns True if the action is an UNLOCK_ACHIEVEMENT action
 */
export function isUnlockAchievementAction(action: IRuleAction): action is IUnlockAchievementAction {
  return action.type === RuleActionType.UNLOCK_ACHIEVEMENT;
}

/**
 * Type guard to check if an action is a PROGRESS_QUEST action
 * @param action The action to check
 * @returns True if the action is a PROGRESS_QUEST action
 */
export function isProgressQuestAction(action: IRuleAction): action is IProgressQuestAction {
  return action.type === RuleActionType.PROGRESS_QUEST;
}

/**
 * Validates an AWARD_XP action's parameters
 * @param action The action to validate
 * @returns True if the action parameters are valid
 */
export function validateAwardXpAction(action: IAwardXpAction): boolean {
  return action.value > 0;
}

/**
 * Validates an UNLOCK_ACHIEVEMENT action's parameters
 * @param action The action to validate
 * @returns True if the action parameters are valid
 */
export function validateUnlockAchievementAction(action: IUnlockAchievementAction): boolean {
  return !!action.achievementId && action.achievementId.trim().length > 0;
}

/**
 * Validates a PROGRESS_QUEST action's parameters
 * @param action The action to validate
 * @returns True if the action parameters are valid
 */
export function validateProgressQuestAction(action: IProgressQuestAction): boolean {
  return (
    !!action.questId &&
    action.questId.trim().length > 0 &&
    action.value > 0
  );
}

/**
 * Validates any rule action based on its type
 * @param action The action to validate
 * @returns True if the action parameters are valid
 */
export function validateRuleAction(action: IRuleAction): boolean {
  switch (action.type) {
    case RuleActionType.AWARD_XP:
      return validateAwardXpAction(action);
    case RuleActionType.UNLOCK_ACHIEVEMENT:
      return validateUnlockAchievementAction(action);
    case RuleActionType.PROGRESS_QUEST:
      return validateProgressQuestAction(action);
    default:
      return false;
  }
}

/**
 * Checks if an action applies to a specific journey
 * @param action The action to check
 * @param journeyType The journey type to check against
 * @returns True if the action applies to the specified journey
 */
export function isActionApplicableToJourney(action: IRuleAction, journeyType: JourneyType): boolean {
  // If no journey type is specified or it's set to ALL, the action applies to all journeys
  if (!action.journeyType || action.journeyType === JourneyType.ALL) {
    return true;
  }
  
  // Otherwise, check if the action's journey type matches the specified journey type
  return action.journeyType === journeyType;
}

/**
 * Parses a JSON string into an array of rule actions
 * @param actionsJson JSON string containing rule actions
 * @returns Array of typed rule actions
 */
export function parseRuleActions(actionsJson: string): IRuleAction[] {
  try {
    const actions = JSON.parse(actionsJson) as IRuleAction[];
    return actions.filter(validateRuleAction);
  } catch (error) {
    return [];
  }
}
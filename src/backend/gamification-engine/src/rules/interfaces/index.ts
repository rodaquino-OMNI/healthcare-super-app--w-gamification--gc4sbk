/**
 * @file Barrel file for rule interfaces in the gamification engine
 * 
 * This file exports all rule-related interfaces to provide a clean API surface
 * for the rules module. It centralizes access to rule interfaces, conditions,
 * actions, and events interfaces to maintain a consistent API and prevent
 * circular dependencies.
 */

// Import from @austa/interfaces package for standardized types
import { JourneyType as AustaJourneyType } from '@austa/interfaces/journey';
import { GamificationEventType } from '@austa/interfaces/gamification/events';

/**
 * Core rule interfaces
 * @see rule.interface.ts
 */
export {
  // Enums
  RuleStatus,
  
  // Interfaces
  IJourneyContext,
  IRuleAction as IRuleActionFromRule,
  IRuleStatus,
  IRule,
  IRuleEvaluationContext,
  IRuleEvaluationResult,
  
  // Versioned interfaces for backward compatibility
  V1,
  V2
} from './rule.interface';

/**
 * Rule action interfaces
 * @see rule-action.interface.ts
 */
export {
  // Enums
  JourneyType,
  ActionType,
  
  // Interfaces
  IRuleActionBase,
  IAwardXpAction,
  IUnlockAchievementAction,
  IProgressQuestAction,
  IRuleAction,
  IValidationResult,
  IParseRuleActionsResult,
  
  // Type guards
  isAwardXpAction,
  isUnlockAchievementAction,
  isProgressQuestAction,
  
  // Validation functions
  validResult,
  invalidResult,
  validateAwardXpAction,
  validateUnlockAchievementAction,
  validateProgressQuestAction,
  validateRuleAction,
  
  // Utility functions
  stringifyRuleActions,
  filterActionsByJourney,
  parseRuleActions
} from './rule-action.interface';

/**
 * Rule condition interfaces
 * @see rule-condition.interface.ts
 */
export {
  // Enums
  LogicalOperator,
  ComparisonOperator,
  
  // Interfaces
  IRuleCondition,
  ISimpleCondition,
  ICompoundCondition,
  IEvaluationContext,
  
  // Types
  ConditionEvaluator,
  
  // Service interfaces
  IRuleConditionEvaluator
} from './rule-condition.interface';

/**
 * Rule event interfaces
 * @see rule-event.interface.ts
 */
export {
  // Enums
  RuleEventSource,
  
  // Interfaces
  IRuleEventMetadata,
  IRuleEvent,
  IHealthRuleEvent,
  ICareRuleEvent,
  IPlanRuleEvent,
  JourneyRuleEvent,
  IRuleEventContext,
  IRuleEventProcessingOptions,
  IRuleEventProcessingResult
} from './rule-event.interface';

/**
 * Re-export types from @austa/interfaces for convenience
 * This allows consumers to import these types directly from the rules interfaces
 * without having to import from @austa/interfaces
 */
export {
  AustaJourneyType as JourneyTypeFromAusta,
  GamificationEventType as EventTypeFromAusta
};

/**
 * Type aliases for improved readability when working with rules
 */
export type RuleId = string;
export type RuleCondition = IRuleCondition | ISimpleCondition | ICompoundCondition;
export type RuleAction = IRuleAction;
export type RuleEvent = IRuleEvent;
export type RuleActionFromRule = IRuleActionFromRule;

// Export default to enable import * as RuleInterfaces syntax
export default {
  RuleStatus,
  JourneyType,
  ActionType,
  LogicalOperator,
  ComparisonOperator,
  RuleEventSource
};
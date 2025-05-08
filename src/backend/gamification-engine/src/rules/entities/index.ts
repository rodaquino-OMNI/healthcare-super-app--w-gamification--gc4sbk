/**
 * @file Barrel file that exports all rule entity classes in the entities folder.
 * 
 * This file provides a single import point for consumers, simplifying imports and reducing
 * code duplication. It establishes a clear public API for the rules module, making it easier
 * to maintain and extend the codebase.
 * 
 * @module gamification-engine/rules/entities
 */

/**
 * Rule entity for the gamification engine.
 * 
 * Rules define the conditions under which achievements are unlocked, rewards are granted,
 * and other gamification actions are triggered based on user events across all journeys.
 * 
 * @see {@link Rule} for detailed entity documentation
 */
export { Rule } from './rule.entity';

/**
 * Re-export interfaces and types from @austa/interfaces for convenience.
 * This allows consumers to import both the entity and its related types from a single location.
 */
export {
  RuleCondition,
  RuleAction,
  RuleActionType,
} from '@austa/interfaces/gamification/rules';
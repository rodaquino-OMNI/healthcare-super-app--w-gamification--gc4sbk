/**
 * @file Barrel file for rule interfaces
 * @description Exports all rule-related interfaces for improved code organization and importing.
 * This file centralizes access to rule interfaces, conditions, actions, and events interfaces
 * to maintain a clean API surface for the rules module.
 */

// Export local rule interfaces
export * from './rule.interface';
export * from './rule-action.interface';
export * from './rule-condition.interface';
export * from './rule-event.interface';

// Re-export interfaces from @austa/interfaces package
// This provides a single import point for all rule-related interfaces
export * from '@austa/interfaces/gamification/rules';
export * from '@austa/interfaces/gamification/events';

// Export specific types with namespaces for more organized imports
import * as RuleActions from './rule-action.interface';
import * as RuleConditions from './rule-condition.interface';
import * as RuleEvents from './rule-event.interface';

/**
 * Namespace for rule action related interfaces and utilities
 */
export { RuleActions };

/**
 * Namespace for rule condition related interfaces and utilities
 */
export { RuleConditions };

/**
 * Namespace for rule event related interfaces and utilities
 */
export { RuleEvents };
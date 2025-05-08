/**
 * @file index.ts
 * @description Barrel file that exports all rule-related exception classes.
 * This centralized export pattern simplifies imports, reduces code duplication,
 * and ensures all exceptions are properly exposed throughout the application.
 *
 * @module rules/exceptions
 * @category Error Handling
 */

// Client Errors (4xx)
// ==================

/**
 * Exception thrown when a requested rule cannot be found.
 * This is a client error (404) that occurs when attempting to retrieve,
 * update, or delete a rule that doesn't exist in the system.
 */
export { RuleNotFoundException } from './rule-not-found.exception';

/**
 * Exception thrown when rule data fails validation.
 * This is a client error (400) that occurs during rule creation
 * or updates when a rule's condition syntax, action configuration,
 * or other definition elements are invalid.
 */
export { RuleDefinitionException } from './rule-definition.exception';

// System/Transient Errors (5xx)
// ============================

/**
 * Exception thrown when loading rules from the database or configuration sources fails.
 * This is a system error that handles database connectivity issues, schema inconsistencies,
 * and initialization failures during rule loading processes.
 */
export { RuleLoadingException } from './rule-loading.exception';

/**
 * Exception thrown when rule evaluation fails.
 * This is a system error (500) that occurs during the evaluation of rule conditions
 * due to syntax errors, reference errors, or other JavaScript runtime issues.
 */
export { RuleEvaluationException } from './rule-evaluation.exception';

/**
 * Exception thrown when rule action execution fails.
 * This is a system error (500) that occurs when executing rule actions
 * after successful evaluation, such as when awards, unlocks, or other
 * side effects cannot be completed.
 */
export { RuleExecutionException } from './rule-execution.exception';
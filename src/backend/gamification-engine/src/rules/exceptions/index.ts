/**
 * @file index.ts
 * @description Barrel file that exports all rule-related exception classes.
 * This centralized export pattern simplifies imports, reduces code duplication,
 * and ensures all exceptions are properly exposed throughout the application.
 */

/**
 * Client Errors (4xx)
 * These exceptions represent client-side errors such as invalid input,
 * missing resources, or unauthorized access attempts.
 */

/**
 * Exception thrown when a rule cannot be found.
 * Used when attempting to retrieve, update, or delete a non-existent rule.
 */
export * from './rule-not-found.exception';

/**
 * Exception thrown when rule data fails validation.
 * Used during rule creation, update, or loading when a rule's condition syntax,
 * action configuration, or other definition elements are invalid.
 */
export * from './rule-definition.exception';

/**
 * System Errors (5xx)
 * These exceptions represent server-side errors such as database failures,
 * internal processing errors, or configuration issues.
 */

/**
 * Exception thrown when an error occurs during the evaluation of rule conditions.
 * Used when the dynamic evaluation of rule conditions fails due to syntax errors,
 * reference errors, or other JavaScript runtime issues.
 */
export * from './rule-evaluation.exception';

/**
 * Exception thrown when executing rule actions after successful evaluation fails.
 * Used when awards, unlocks, or other side effects cannot be completed.
 */
export * from './rule-execution.exception';

/**
 * Transient Errors
 * These exceptions represent temporary failures that may be resolved by retrying
 * the operation, such as network issues or resource contention.
 */

/**
 * Exception thrown when loading rules from the database or configuration sources fails.
 * Used for database connectivity issues, schema inconsistencies, and initialization failures.
 */
export * from './rule-loading.exception';

// Import all exception classes for type definition and default export
import { RuleNotFoundException } from './rule-not-found.exception';
import { RuleDefinitionException } from './rule-definition.exception';
import { RuleEvaluationException } from './rule-evaluation.exception';
import { RuleExecutionException } from './rule-execution.exception';
import { RuleLoadingException } from './rule-loading.exception';

/**
 * Type representing all rule exception classes
 * This type can be used for functions that need to handle any type of rule exception
 */
export type RuleException =
  | RuleNotFoundException
  | RuleDefinitionException
  | RuleEvaluationException
  | RuleExecutionException
  | RuleLoadingException;

/**
 * Default export for convenience when importing all exceptions
 * Example usage: import RuleExceptions from '@app/rules/exceptions';
 */
export default {
  RuleNotFoundException,
  RuleDefinitionException,
  RuleEvaluationException,
  RuleExecutionException,
  RuleLoadingException
};
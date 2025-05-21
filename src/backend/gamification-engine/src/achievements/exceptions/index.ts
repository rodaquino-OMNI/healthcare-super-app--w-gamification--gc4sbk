/**
 * @file index.ts
 * @description Barrel file that exports all achievement-related exception classes.
 * This centralized export pattern simplifies imports, reduces code duplication,
 * and ensures all exceptions are properly exposed throughout the application.
 */

// Base exception and types
export * from './base-achievement.exception';
export * from './achievement-exception.types';

/**
 * Client Errors (4xx)
 * These exceptions represent client-side errors such as invalid input,
 * missing resources, or unauthorized access attempts.
 */

/**
 * Exception thrown when an achievement cannot be found.
 * Used when attempting to retrieve, update, or delete a non-existent achievement.
 */
export * from './achievement-not-found.exception';

/**
 * Exception thrown when a user's achievement relationship cannot be found.
 * Used when attempting to access, update, or unlock a non-existent user-achievement relationship.
 */
export * from './user-achievement-not-found.exception';

/**
 * Exception thrown when attempting to create an achievement that already exists.
 * Used to prevent duplicate achievements with the same title or key.
 */
export * from './duplicate-achievement.exception';

/**
 * Exception thrown when achievement data fails validation.
 * Used during achievement creation or updates when input fails validation rules.
 */
export * from './invalid-achievement-data.exception';

/**
 * System Errors (5xx)
 * These exceptions represent server-side errors such as database failures,
 * internal processing errors, or configuration issues.
 */

/**
 * Exception thrown when an achievement event fails validation.
 * Used when an incoming achievement event fails schema validation before processing.
 */
export * from './achievement-event-validation.exception';

/**
 * Transient Errors
 * These exceptions represent temporary failures that may be resolved by retrying
 * the operation, such as network issues or resource contention.
 */

/**
 * Exception thrown when an achievement event fails during processing.
 * Used to handle system or transient errors in Kafka event processing with retry support.
 */
export * from './achievement-event-processing.exception';

/**
 * External Dependency Errors
 * These exceptions represent failures in external services or dependencies
 * that the achievement system relies on.
 */

/**
 * Exception thrown when an external service interaction fails during achievement operations.
 * Used when interactions with services like profiles or notifications fail.
 */
export * from './achievement-external-service.exception';
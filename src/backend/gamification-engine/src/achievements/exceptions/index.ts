/**
 * @file index.ts
 * @description Barrel file that exports all achievement-related exception classes.
 * This centralized export pattern simplifies imports, reduces code duplication,
 * and ensures all exceptions are properly exposed throughout the application.
 *
 * @module achievements/exceptions
 * @category Error Handling
 */

// Base Exception Classes and Interfaces
// =====================================

/**
 * Base exception class and error context interface for achievement exceptions.
 * These provide the foundation for all achievement-specific error handling.
 */
export { 
  BaseAchievementException, 
  AchievementErrorContext 
} from './base-achievement.exception';

// Error Types and Metadata
// =======================

/**
 * Achievement-specific error types, codes, and metadata interfaces.
 * These provide a structured approach to error classification and handling.
 */
export {
  AchievementErrorType,
  ACHIEVEMENT_ERROR_CODES,
  ACHIEVEMENT_ERROR_MESSAGES,
  ACHIEVEMENT_HTTP_STATUS_CODES,
  ACHIEVEMENT_ERROR_CATEGORIES,
  ACHIEVEMENT_ERROR_SEVERITIES,
  ACHIEVEMENT_RETRY_CONFIG,
  createAchievementErrorMetadata,
  
  // Error metadata interfaces
  AchievementNotFoundErrorMetadata,
  UserAchievementNotFoundErrorMetadata,
  InvalidAchievementDataErrorMetadata,
  AchievementAlreadyUnlockedErrorMetadata,
  AchievementCriteriaNotMetErrorMetadata,
  AchievementDisabledErrorMetadata,
  AchievementProcessingErrorMetadata,
  AchievementTransientErrorMetadata,
  AchievementExternalServiceErrorMetadata,
  AchievementNotificationErrorMetadata,
  AchievementErrorMetadata,
  AchievementErrorTypeToMetadata
} from './achievement-exception.types';

// Client Errors (4xx)
// ==================

/**
 * Exception thrown when a requested achievement cannot be found.
 * This is a client error (404) that occurs when attempting to retrieve,
 * update, or delete an achievement that doesn't exist in the system.
 */
export { AchievementNotFoundException } from './achievement-not-found.exception';

/**
 * Exception thrown when a user's achievement relationship cannot be found.
 * This is a client error (404) that occurs when attempting to access, update,
 * or unlock a user-achievement relationship that doesn't exist.
 */
export { UserAchievementNotFoundException } from './user-achievement-not-found.exception';

/**
 * Exception thrown when achievement data fails validation.
 * This is a client error (400) that occurs during achievement creation
 * or updates when input fails validation rules.
 */
export { InvalidAchievementDataException } from './invalid-achievement-data.exception';

/**
 * Exception thrown when attempting to create an achievement that already exists.
 * This is a client error (409 Conflict) that occurs when attempting to create
 * an achievement with a title or key that already exists in the system.
 */
export { DuplicateAchievementException } from './duplicate-achievement.exception';

// System/Transient Errors (5xx)
// ============================

/**
 * Exception thrown when achievement event processing fails.
 * This is a system/transient error that occurs when Kafka event processing
 * fails within the achievement consumers. Supports retry and dead letter queue mechanisms.
 */
export { AchievementEventProcessingException } from './achievement-event-processing.exception';

// External Dependency Errors
// =========================

/**
 * Exception thrown when an external service interaction fails during achievement operations.
 * This exception is used when interactions with services like profiles, notifications,
 * or other external dependencies fail during achievement processing.
 * Supports circuit breaker patterns and fallback strategies.
 */
export { 
  AchievementExternalServiceException,
  ExternalServiceErrorMetadata 
} from './achievement-external-service.exception';

/**
 * Exception thrown when an achievement event fails validation.
 * This is a client error that occurs when an incoming achievement event
 * fails schema validation before processing. Ensures only valid events
 * enter the processing pipeline.
 */
export { AchievementEventValidationException } from './achievement-event-validation.exception';
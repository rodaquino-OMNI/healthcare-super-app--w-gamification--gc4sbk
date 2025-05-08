/**
 * @file index.ts
 * @description Barrel file that exports all reward-related exception classes.
 * This centralized export pattern simplifies imports, reduces code duplication,
 * and ensures all exceptions are properly exposed throughout the application.
 *
 * @module rewards/exceptions
 * @category Error Handling
 */

// Base Exception Classes and Interfaces
// =====================================

/**
 * Base exception class and error context interface for reward exceptions.
 * These provide the foundation for all reward-specific error handling.
 */
export { 
  BaseRewardException, 
  RewardErrorContext 
} from './base-reward.exception';

// Error Types and Metadata
// =======================

/**
 * Reward-specific error types, codes, and metadata interfaces.
 * These provide a structured approach to error classification and handling.
 */
export {
  RewardErrorType,
  REWARD_ERROR_CODES,
  REWARD_ERROR_MESSAGES,
  REWARD_HTTP_STATUS_CODES,
  REWARD_ERROR_CATEGORIES,
  REWARD_ERROR_SEVERITIES,
  REWARD_RETRY_CONFIG,
  createRewardErrorMetadata,
  
  // Error metadata interfaces
  RewardNotFoundErrorMetadata,
  UserRewardNotFoundErrorMetadata,
  InvalidRewardDataErrorMetadata,
  RewardAlreadyGrantedErrorMetadata,
  RewardEligibilityNotMetErrorMetadata,
  RewardDisabledErrorMetadata,
  RewardExpiredErrorMetadata,
  RewardProcessingErrorMetadata,
  RewardTransientErrorMetadata,
  RewardExternalServiceErrorMetadata,
  RewardNotificationErrorMetadata,
  ProfileServiceErrorMetadata,
  RewardErrorMetadata,
  RewardErrorTypeToMetadata
} from './reward-exception.types';

// Client Errors (4xx)
// ==================

/**
 * Exception thrown when a requested reward cannot be found.
 * This is a client error (404) that occurs when attempting to retrieve,
 * update, or delete a reward that doesn't exist in the system.
 */
export { RewardNotFoundException } from './reward-not-found.exception';

/**
 * Exception thrown when a user's reward relationship cannot be found.
 * This is a client error (404) that occurs when attempting to access, update,
 * or grant a user-reward relationship that doesn't exist.
 */
export { UserRewardNotFoundException } from './user-reward-not-found.exception';

/**
 * Exception thrown when reward data fails validation.
 * This is a client error (400) that occurs during reward creation
 * or updates when input fails validation rules.
 */
export { InvalidRewardDataException } from './invalid-reward-data.exception';

/**
 * Exception thrown when attempting to create a reward that already exists.
 * This is a client error (409 Conflict) that occurs when attempting to create
 * a reward with a title or key that already exists in the system.
 */
export { DuplicateRewardException } from './duplicate-reward.exception';

// System/Transient Errors (5xx)
// ============================

/**
 * Exception thrown when internal reward processing fails.
 * This is a system error (500) that occurs during reward operations
 * due to internal server issues, database errors, or other system failures.
 * Includes detailed context for debugging and monitoring.
 */
export { RewardProcessingException } from './reward-processing.exception';

// External Dependency Errors
// =========================

/**
 * Exception thrown when an external service interaction fails during reward operations.
 * This exception is used when interactions with services like profiles, notifications,
 * or other external dependencies fail during reward processing.
 * Supports circuit breaker patterns and fallback strategies.
 */
export { 
  RewardExternalServiceException,
  ExternalServiceErrorMetadata 
} from './reward-external-service.exception';
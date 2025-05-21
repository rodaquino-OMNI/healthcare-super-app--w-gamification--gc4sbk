/**
 * @file index.ts
 * @description Barrel file that exports all reward-related exception classes and types.
 * This file provides a single entry point for importing exceptions throughout the application,
 * simplifying imports, reducing code duplication, and ensuring consistent error handling.
 */

// Base Exception
export { BaseRewardException } from './base-reward.exception';

// Error Types and Utilities
export {
  RewardErrorType,
  RewardErrorStatusMap,
  RewardErrorCodeMap,
  RewardErrorMessageMap,
  isRetryableRewardError,
  isClientRewardError,
  isSystemRewardError,
  isExternalDependencyRewardError,
  mapLegacyRewardErrorCode,
  // Error Metadata Interfaces
  RewardValidationErrorMetadata,
  RewardNotFoundErrorMetadata,
  UserRewardNotFoundErrorMetadata,
  RewardDuplicateErrorMetadata,
  RewardDatabaseErrorMetadata,
  RewardEventProcessingErrorMetadata,
  RewardExternalServiceErrorMetadata,
  RewardGrantingErrorMetadata
} from './reward-exception.types';

/**
 * Client Errors (4xx)
 * These exceptions represent client-side errors such as invalid input,
 * missing resources, or unauthorized access attempts.
 */

/**
 * Exception thrown when a reward cannot be found.
 * Used when attempting to retrieve, update, or delete a reward that doesn't exist.
 * Maps to HTTP 404 Not Found.
 */
export { RewardNotFoundException } from './reward-not-found.exception';

/**
 * Exception thrown when a user's reward relationship cannot be found.
 * Used when attempting to access, update, or unlock a user-reward relationship that doesn't exist.
 * Maps to HTTP 404 Not Found.
 */
export { UserRewardNotFoundException } from './user-reward-not-found.exception';

/**
 * Exception thrown when attempting to create a reward that already exists.
 * Used when a duplicate reward title, key, or identifier is detected.
 * Maps to HTTP 409 Conflict.
 */
export { DuplicateRewardException } from './duplicate-reward.exception';

/**
 * Exception thrown when reward data fails validation.
 * Used during reward creation or updates when input fails validation rules.
 * Maps to HTTP 400 Bad Request.
 */
export { InvalidRewardDataException } from './invalid-reward-data.exception';

/**
 * System Errors (5xx)
 * These exceptions represent server-side errors such as internal processing failures,
 * database errors, or configuration issues.
 */

/**
 * Exception thrown when an internal error occurs during reward processing operations.
 * Used to capture detailed error contexts for debugging and root cause analysis.
 * Maps to HTTP 500 Internal Server Error.
 */
export { 
  RewardProcessingException,
  RewardProcessingContext 
} from './reward-processing.exception';

/**
 * External Dependency Errors
 * These exceptions represent failures in external service interactions,
 * such as profile service, notification service, or other dependencies.
 */

/**
 * Exception thrown when an external service interaction fails during reward operations.
 * Provides detailed context about the external service failure, including circuit breaker
 * state and fallback strategy information.
 * Maps to HTTP 502 Bad Gateway.
 */
export { 
  RewardExternalServiceException,
  ExternalServiceType,
  CircuitBreakerInfo,
  FallbackStrategyInfo 
} from './reward-external-service.exception';
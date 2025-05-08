/**
 * @file reward-exception.types.ts
 * @description Defines error type enumeration and interfaces for reward-related exceptions.
 * This file contains error codes, categories, and metadata structures for reward operations
 * that standardize error handling across the gamification engine.
 *
 * @module rewards/exceptions
 * @category Error Handling
 */

import { ErrorType } from '../../../common/exceptions/error-types.enum';
import { ErrorCategory, ErrorSeverity } from '../../../common/exceptions/error-types.enum';

/**
 * Reward-specific error types that extend the base ErrorType.
 * These error types are used to classify reward-related exceptions
 * for consistent error handling, logging, and client responses.
 */
export enum RewardErrorType {
  // Client errors (4xx)
  REWARD_NOT_FOUND = 'REWARD_NOT_FOUND',
  USER_REWARD_NOT_FOUND = 'USER_REWARD_NOT_FOUND',
  INVALID_REWARD_DATA = 'INVALID_REWARD_DATA',
  REWARD_ALREADY_GRANTED = 'REWARD_ALREADY_GRANTED',
  REWARD_ELIGIBILITY_NOT_MET = 'REWARD_ELIGIBILITY_NOT_MET',
  REWARD_DISABLED = 'REWARD_DISABLED',
  REWARD_EXPIRED = 'REWARD_EXPIRED',
  
  // System errors (5xx)
  REWARD_CREATION_FAILED = 'REWARD_CREATION_FAILED',
  REWARD_UPDATE_FAILED = 'REWARD_UPDATE_FAILED',
  REWARD_DELETION_FAILED = 'REWARD_DELETION_FAILED',
  REWARD_QUERY_FAILED = 'REWARD_QUERY_FAILED',
  REWARD_PROCESSING_FAILED = 'REWARD_PROCESSING_FAILED',
  REWARD_GRANTING_FAILED = 'REWARD_GRANTING_FAILED',
  
  // Transient errors
  REWARD_TRANSIENT_ERROR = 'REWARD_TRANSIENT_ERROR',
  REWARD_RETRY_EXHAUSTED = 'REWARD_RETRY_EXHAUSTED',
  
  // External dependency errors
  REWARD_EXTERNAL_SERVICE_ERROR = 'REWARD_EXTERNAL_SERVICE_ERROR',
  REWARD_NOTIFICATION_FAILED = 'REWARD_NOTIFICATION_FAILED',
  REWARD_PROFILE_SERVICE_ERROR = 'REWARD_PROFILE_SERVICE_ERROR'
}

/**
 * Maps reward error types to their corresponding error codes with REWARD- prefix.
 * These codes are used in API responses and logs for easy identification and tracking.
 */
export const REWARD_ERROR_CODES: Record<RewardErrorType, string> = {
  // Client errors (4xx)
  [RewardErrorType.REWARD_NOT_FOUND]: 'REWARD-404-001',
  [RewardErrorType.USER_REWARD_NOT_FOUND]: 'REWARD-404-002',
  [RewardErrorType.INVALID_REWARD_DATA]: 'REWARD-400-001',
  [RewardErrorType.REWARD_ALREADY_GRANTED]: 'REWARD-409-001',
  [RewardErrorType.REWARD_ELIGIBILITY_NOT_MET]: 'REWARD-400-002',
  [RewardErrorType.REWARD_DISABLED]: 'REWARD-403-001',
  [RewardErrorType.REWARD_EXPIRED]: 'REWARD-410-001',
  
  // System errors (5xx)
  [RewardErrorType.REWARD_CREATION_FAILED]: 'REWARD-500-001',
  [RewardErrorType.REWARD_UPDATE_FAILED]: 'REWARD-500-002',
  [RewardErrorType.REWARD_DELETION_FAILED]: 'REWARD-500-003',
  [RewardErrorType.REWARD_QUERY_FAILED]: 'REWARD-500-004',
  [RewardErrorType.REWARD_PROCESSING_FAILED]: 'REWARD-500-005',
  [RewardErrorType.REWARD_GRANTING_FAILED]: 'REWARD-500-006',
  
  // Transient errors
  [RewardErrorType.REWARD_TRANSIENT_ERROR]: 'REWARD-503-001',
  [RewardErrorType.REWARD_RETRY_EXHAUSTED]: 'REWARD-503-002',
  
  // External dependency errors
  [RewardErrorType.REWARD_EXTERNAL_SERVICE_ERROR]: 'REWARD-502-001',
  [RewardErrorType.REWARD_NOTIFICATION_FAILED]: 'REWARD-502-002',
  [RewardErrorType.REWARD_PROFILE_SERVICE_ERROR]: 'REWARD-502-003'
};

/**
 * Maps reward error types to client-friendly message templates.
 * These templates can include placeholders that will be replaced with
 * actual values from the error metadata.
 */
export const REWARD_ERROR_MESSAGES: Record<RewardErrorType, string> = {
  // Client errors (4xx)
  [RewardErrorType.REWARD_NOT_FOUND]: 'Reward with ID {{rewardId}} not found',
  [RewardErrorType.USER_REWARD_NOT_FOUND]: 'User reward for user {{userId}} and reward {{rewardId}} not found',
  [RewardErrorType.INVALID_REWARD_DATA]: 'Invalid reward data: {{details}}',
  [RewardErrorType.REWARD_ALREADY_GRANTED]: 'Reward {{rewardId}} has already been granted to user {{userId}} on {{grantedAt}}',
  [RewardErrorType.REWARD_ELIGIBILITY_NOT_MET]: 'User {{userId}} does not meet eligibility criteria for reward {{rewardId}}: {{details}}',
  [RewardErrorType.REWARD_DISABLED]: 'Reward {{rewardId}} is currently disabled: {{reason}}',
  [RewardErrorType.REWARD_EXPIRED]: 'Reward {{rewardId}} has expired on {{expirationDate}}',
  
  // System errors (5xx)
  [RewardErrorType.REWARD_CREATION_FAILED]: 'Failed to create reward: {{details}}',
  [RewardErrorType.REWARD_UPDATE_FAILED]: 'Failed to update reward {{rewardId}}: {{details}}',
  [RewardErrorType.REWARD_DELETION_FAILED]: 'Failed to delete reward {{rewardId}}: {{details}}',
  [RewardErrorType.REWARD_QUERY_FAILED]: 'Failed to query rewards: {{details}}',
  [RewardErrorType.REWARD_PROCESSING_FAILED]: 'Failed to process reward {{rewardId}}: {{details}}',
  [RewardErrorType.REWARD_GRANTING_FAILED]: 'Failed to grant reward {{rewardId}} to user {{userId}}: {{details}}',
  
  // Transient errors
  [RewardErrorType.REWARD_TRANSIENT_ERROR]: 'Temporary error processing reward {{rewardId}}. Please try again later.',
  [RewardErrorType.REWARD_RETRY_EXHAUSTED]: 'Maximum retry attempts reached for reward operation: {{details}}',
  
  // External dependency errors
  [RewardErrorType.REWARD_EXTERNAL_SERVICE_ERROR]: 'External service error while processing reward {{rewardId}}: {{details}}',
  [RewardErrorType.REWARD_NOTIFICATION_FAILED]: 'Failed to send reward notification for {{rewardId}}: {{details}}',
  [RewardErrorType.REWARD_PROFILE_SERVICE_ERROR]: 'Profile service error while processing reward for user {{userId}}: {{details}}'
};

/**
 * Maps reward error types to their corresponding HTTP status codes.
 * Used for generating appropriate HTTP responses for reward-related errors.
 */
export const REWARD_HTTP_STATUS_CODES: Record<RewardErrorType, number> = {
  // Client errors (4xx)
  [RewardErrorType.REWARD_NOT_FOUND]: 404,
  [RewardErrorType.USER_REWARD_NOT_FOUND]: 404,
  [RewardErrorType.INVALID_REWARD_DATA]: 400,
  [RewardErrorType.REWARD_ALREADY_GRANTED]: 409,
  [RewardErrorType.REWARD_ELIGIBILITY_NOT_MET]: 400,
  [RewardErrorType.REWARD_DISABLED]: 403,
  [RewardErrorType.REWARD_EXPIRED]: 410,
  
  // System errors (5xx)
  [RewardErrorType.REWARD_CREATION_FAILED]: 500,
  [RewardErrorType.REWARD_UPDATE_FAILED]: 500,
  [RewardErrorType.REWARD_DELETION_FAILED]: 500,
  [RewardErrorType.REWARD_QUERY_FAILED]: 500,
  [RewardErrorType.REWARD_PROCESSING_FAILED]: 500,
  [RewardErrorType.REWARD_GRANTING_FAILED]: 500,
  
  // Transient errors
  [RewardErrorType.REWARD_TRANSIENT_ERROR]: 503,
  [RewardErrorType.REWARD_RETRY_EXHAUSTED]: 503,
  
  // External dependency errors
  [RewardErrorType.REWARD_EXTERNAL_SERVICE_ERROR]: 502,
  [RewardErrorType.REWARD_NOTIFICATION_FAILED]: 502,
  [RewardErrorType.REWARD_PROFILE_SERVICE_ERROR]: 502
};

/**
 * Maps reward error types to their corresponding error categories.
 * Used for classifying errors for monitoring, alerting, and reporting.
 */
export const REWARD_ERROR_CATEGORIES: Record<RewardErrorType, ErrorCategory> = {
  // Client errors (4xx)
  [RewardErrorType.REWARD_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [RewardErrorType.USER_REWARD_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [RewardErrorType.INVALID_REWARD_DATA]: ErrorCategory.VALIDATION,
  [RewardErrorType.REWARD_ALREADY_GRANTED]: ErrorCategory.CONFLICT,
  [RewardErrorType.REWARD_ELIGIBILITY_NOT_MET]: ErrorCategory.VALIDATION,
  [RewardErrorType.REWARD_DISABLED]: ErrorCategory.FORBIDDEN,
  [RewardErrorType.REWARD_EXPIRED]: ErrorCategory.RESOURCE_EXPIRED,
  
  // System errors (5xx)
  [RewardErrorType.REWARD_CREATION_FAILED]: ErrorCategory.INTERNAL,
  [RewardErrorType.REWARD_UPDATE_FAILED]: ErrorCategory.INTERNAL,
  [RewardErrorType.REWARD_DELETION_FAILED]: ErrorCategory.INTERNAL,
  [RewardErrorType.REWARD_QUERY_FAILED]: ErrorCategory.INTERNAL,
  [RewardErrorType.REWARD_PROCESSING_FAILED]: ErrorCategory.INTERNAL,
  [RewardErrorType.REWARD_GRANTING_FAILED]: ErrorCategory.INTERNAL,
  
  // Transient errors
  [RewardErrorType.REWARD_TRANSIENT_ERROR]: ErrorCategory.TRANSIENT,
  [RewardErrorType.REWARD_RETRY_EXHAUSTED]: ErrorCategory.TRANSIENT,
  
  // External dependency errors
  [RewardErrorType.REWARD_EXTERNAL_SERVICE_ERROR]: ErrorCategory.EXTERNAL,
  [RewardErrorType.REWARD_NOTIFICATION_FAILED]: ErrorCategory.EXTERNAL,
  [RewardErrorType.REWARD_PROFILE_SERVICE_ERROR]: ErrorCategory.EXTERNAL
};

/**
 * Maps reward error types to their severity levels.
 * Used for prioritizing alerts and monitoring.
 */
export const REWARD_ERROR_SEVERITIES: Record<RewardErrorType, ErrorSeverity> = {
  // Client errors (4xx) - generally lower severity
  [RewardErrorType.REWARD_NOT_FOUND]: ErrorSeverity.LOW,
  [RewardErrorType.USER_REWARD_NOT_FOUND]: ErrorSeverity.LOW,
  [RewardErrorType.INVALID_REWARD_DATA]: ErrorSeverity.LOW,
  [RewardErrorType.REWARD_ALREADY_GRANTED]: ErrorSeverity.LOW,
  [RewardErrorType.REWARD_ELIGIBILITY_NOT_MET]: ErrorSeverity.LOW,
  [RewardErrorType.REWARD_DISABLED]: ErrorSeverity.LOW,
  [RewardErrorType.REWARD_EXPIRED]: ErrorSeverity.LOW,
  
  // System errors (5xx) - higher severity
  [RewardErrorType.REWARD_CREATION_FAILED]: ErrorSeverity.MEDIUM,
  [RewardErrorType.REWARD_UPDATE_FAILED]: ErrorSeverity.MEDIUM,
  [RewardErrorType.REWARD_DELETION_FAILED]: ErrorSeverity.MEDIUM,
  [RewardErrorType.REWARD_QUERY_FAILED]: ErrorSeverity.MEDIUM,
  [RewardErrorType.REWARD_PROCESSING_FAILED]: ErrorSeverity.HIGH,
  [RewardErrorType.REWARD_GRANTING_FAILED]: ErrorSeverity.HIGH,
  
  // Transient errors - variable severity
  [RewardErrorType.REWARD_TRANSIENT_ERROR]: ErrorSeverity.LOW,
  [RewardErrorType.REWARD_RETRY_EXHAUSTED]: ErrorSeverity.MEDIUM,
  
  // External dependency errors - generally medium severity
  [RewardErrorType.REWARD_EXTERNAL_SERVICE_ERROR]: ErrorSeverity.MEDIUM,
  [RewardErrorType.REWARD_NOTIFICATION_FAILED]: ErrorSeverity.MEDIUM,
  [RewardErrorType.REWARD_PROFILE_SERVICE_ERROR]: ErrorSeverity.MEDIUM
};

/**
 * Maps reward error types to their retry configuration.
 * Defines which errors are retryable and their retry parameters.
 */
export const REWARD_RETRY_CONFIG: Record<RewardErrorType, { retryable: boolean; maxRetries?: number; backoffFactor?: number; initialDelayMs?: number }> = {
  // Client errors (4xx) - generally not retryable
  [RewardErrorType.REWARD_NOT_FOUND]: { retryable: false },
  [RewardErrorType.USER_REWARD_NOT_FOUND]: { retryable: false },
  [RewardErrorType.INVALID_REWARD_DATA]: { retryable: false },
  [RewardErrorType.REWARD_ALREADY_GRANTED]: { retryable: false },
  [RewardErrorType.REWARD_ELIGIBILITY_NOT_MET]: { retryable: false },
  [RewardErrorType.REWARD_DISABLED]: { retryable: false },
  [RewardErrorType.REWARD_EXPIRED]: { retryable: false },
  
  // System errors (5xx) - some may be retryable
  [RewardErrorType.REWARD_CREATION_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  [RewardErrorType.REWARD_UPDATE_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  [RewardErrorType.REWARD_DELETION_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  [RewardErrorType.REWARD_QUERY_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  [RewardErrorType.REWARD_PROCESSING_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  [RewardErrorType.REWARD_GRANTING_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  
  // Transient errors - always retryable
  [RewardErrorType.REWARD_TRANSIENT_ERROR]: { retryable: true, maxRetries: 5, backoffFactor: 1.5, initialDelayMs: 100 },
  [RewardErrorType.REWARD_RETRY_EXHAUSTED]: { retryable: false },
  
  // External dependency errors - retryable with specific configuration
  [RewardErrorType.REWARD_EXTERNAL_SERVICE_ERROR]: { retryable: true, maxRetries: 3, backoffFactor: 2, initialDelayMs: 200 },
  [RewardErrorType.REWARD_NOTIFICATION_FAILED]: { retryable: true, maxRetries: 5, backoffFactor: 1.5, initialDelayMs: 150 },
  [RewardErrorType.REWARD_PROFILE_SERVICE_ERROR]: { retryable: true, maxRetries: 3, backoffFactor: 2, initialDelayMs: 200 }
};

/**
 * Interface for reward not found error metadata.
 */
export interface RewardNotFoundErrorMetadata {
  rewardId: string;
}

/**
 * Interface for user reward not found error metadata.
 */
export interface UserRewardNotFoundErrorMetadata {
  userId: string;
  rewardId: string;
}

/**
 * Interface for invalid reward data error metadata.
 */
export interface InvalidRewardDataErrorMetadata {
  details: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Interface for reward already granted error metadata.
 */
export interface RewardAlreadyGrantedErrorMetadata {
  userId: string;
  rewardId: string;
  grantedAt: Date;
}

/**
 * Interface for reward eligibility not met error metadata.
 */
export interface RewardEligibilityNotMetErrorMetadata {
  rewardId: string;
  userId: string;
  details: string;
  requiredCriteria?: Record<string, any>;
  userCriteria?: Record<string, any>;
}

/**
 * Interface for reward disabled error metadata.
 */
export interface RewardDisabledErrorMetadata {
  rewardId: string;
  reason?: string;
  enabledAt?: Date;
}

/**
 * Interface for reward expired error metadata.
 */
export interface RewardExpiredErrorMetadata {
  rewardId: string;
  expirationDate: Date;
}

/**
 * Interface for reward processing error metadata.
 */
export interface RewardProcessingErrorMetadata {
  rewardId?: string;
  details: string;
  operationType: 'create' | 'update' | 'delete' | 'query' | 'process' | 'grant';
  errorDetails?: Error;
}

/**
 * Interface for reward transient error metadata.
 */
export interface RewardTransientErrorMetadata {
  rewardId?: string;
  retryCount: number;
  nextRetryAt?: Date;
  details: string;
}

/**
 * Interface for reward external service error metadata.
 */
export interface RewardExternalServiceErrorMetadata {
  rewardId?: string;
  serviceName: string;
  details: string;
  retryable: boolean;
}

/**
 * Interface for reward notification error metadata.
 */
export interface RewardNotificationErrorMetadata {
  rewardId: string;
  userId: string;
  notificationType: string;
  details: string;
}

/**
 * Interface for profile service error metadata.
 */
export interface ProfileServiceErrorMetadata {
  userId: string;
  rewardId?: string;
  details: string;
  operation: string;
}

/**
 * Union type of all reward error metadata interfaces.
 * Used for type-safe error metadata handling across the reward module.
 */
export type RewardErrorMetadata =
  | RewardNotFoundErrorMetadata
  | UserRewardNotFoundErrorMetadata
  | InvalidRewardDataErrorMetadata
  | RewardAlreadyGrantedErrorMetadata
  | RewardEligibilityNotMetErrorMetadata
  | RewardDisabledErrorMetadata
  | RewardExpiredErrorMetadata
  | RewardProcessingErrorMetadata
  | RewardTransientErrorMetadata
  | RewardExternalServiceErrorMetadata
  | RewardNotificationErrorMetadata
  | ProfileServiceErrorMetadata;

/**
 * Maps reward error types to their corresponding metadata interface.
 * Used for type checking and validation of error metadata.
 */
export interface RewardErrorTypeToMetadata {
  [RewardErrorType.REWARD_NOT_FOUND]: RewardNotFoundErrorMetadata;
  [RewardErrorType.USER_REWARD_NOT_FOUND]: UserRewardNotFoundErrorMetadata;
  [RewardErrorType.INVALID_REWARD_DATA]: InvalidRewardDataErrorMetadata;
  [RewardErrorType.REWARD_ALREADY_GRANTED]: RewardAlreadyGrantedErrorMetadata;
  [RewardErrorType.REWARD_ELIGIBILITY_NOT_MET]: RewardEligibilityNotMetErrorMetadata;
  [RewardErrorType.REWARD_DISABLED]: RewardDisabledErrorMetadata;
  [RewardErrorType.REWARD_EXPIRED]: RewardExpiredErrorMetadata;
  [RewardErrorType.REWARD_CREATION_FAILED]: RewardProcessingErrorMetadata;
  [RewardErrorType.REWARD_UPDATE_FAILED]: RewardProcessingErrorMetadata;
  [RewardErrorType.REWARD_DELETION_FAILED]: RewardProcessingErrorMetadata;
  [RewardErrorType.REWARD_QUERY_FAILED]: RewardProcessingErrorMetadata;
  [RewardErrorType.REWARD_PROCESSING_FAILED]: RewardProcessingErrorMetadata;
  [RewardErrorType.REWARD_GRANTING_FAILED]: RewardProcessingErrorMetadata;
  [RewardErrorType.REWARD_TRANSIENT_ERROR]: RewardTransientErrorMetadata;
  [RewardErrorType.REWARD_RETRY_EXHAUSTED]: RewardTransientErrorMetadata;
  [RewardErrorType.REWARD_EXTERNAL_SERVICE_ERROR]: RewardExternalServiceErrorMetadata;
  [RewardErrorType.REWARD_NOTIFICATION_FAILED]: RewardNotificationErrorMetadata;
  [RewardErrorType.REWARD_PROFILE_SERVICE_ERROR]: ProfileServiceErrorMetadata;
}

/**
 * Helper function to create a properly typed reward error metadata object.
 * Ensures type safety when creating error metadata for specific error types.
 * 
 * @param errorType The reward error type
 * @param metadata The error metadata corresponding to the error type
 * @returns The properly typed error metadata
 */
export function createRewardErrorMetadata<T extends RewardErrorType>(
  errorType: T,
  metadata: RewardErrorTypeToMetadata[T]
): RewardErrorTypeToMetadata[T] {
  return metadata;
}
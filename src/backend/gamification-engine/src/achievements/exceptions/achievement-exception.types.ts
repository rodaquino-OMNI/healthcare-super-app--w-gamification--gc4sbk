/**
 * @file achievement-exception.types.ts
 * @description Defines error type enumeration and interfaces for achievement-related exceptions.
 * This file contains error codes, categories, and metadata structures for achievement operations
 * that standardize error handling across the gamification engine.
 *
 * @module achievements/exceptions
 * @category Error Handling
 */

import { ErrorType } from '../../../common/exceptions/error-types.enum';
import { ErrorCategory, ErrorSeverity } from '../../../common/exceptions/error-types.enum';

/**
 * Achievement-specific error types that extend the base ErrorType.
 * These error types are used to classify achievement-related exceptions
 * for consistent error handling, logging, and client responses.
 */
export enum AchievementErrorType {
  // Client errors (4xx)
  ACHIEVEMENT_NOT_FOUND = 'ACHIEVEMENT_NOT_FOUND',
  USER_ACHIEVEMENT_NOT_FOUND = 'USER_ACHIEVEMENT_NOT_FOUND',
  INVALID_ACHIEVEMENT_DATA = 'INVALID_ACHIEVEMENT_DATA',
  ACHIEVEMENT_ALREADY_UNLOCKED = 'ACHIEVEMENT_ALREADY_UNLOCKED',
  ACHIEVEMENT_CRITERIA_NOT_MET = 'ACHIEVEMENT_CRITERIA_NOT_MET',
  ACHIEVEMENT_DISABLED = 'ACHIEVEMENT_DISABLED',
  
  // System errors (5xx)
  ACHIEVEMENT_CREATION_FAILED = 'ACHIEVEMENT_CREATION_FAILED',
  ACHIEVEMENT_UPDATE_FAILED = 'ACHIEVEMENT_UPDATE_FAILED',
  ACHIEVEMENT_DELETION_FAILED = 'ACHIEVEMENT_DELETION_FAILED',
  ACHIEVEMENT_QUERY_FAILED = 'ACHIEVEMENT_QUERY_FAILED',
  ACHIEVEMENT_PROCESSING_FAILED = 'ACHIEVEMENT_PROCESSING_FAILED',
  
  // Transient errors
  ACHIEVEMENT_TRANSIENT_ERROR = 'ACHIEVEMENT_TRANSIENT_ERROR',
  ACHIEVEMENT_RETRY_EXHAUSTED = 'ACHIEVEMENT_RETRY_EXHAUSTED',
  
  // External dependency errors
  ACHIEVEMENT_EXTERNAL_SERVICE_ERROR = 'ACHIEVEMENT_EXTERNAL_SERVICE_ERROR',
  ACHIEVEMENT_NOTIFICATION_FAILED = 'ACHIEVEMENT_NOTIFICATION_FAILED'
}

/**
 * Maps achievement error types to their corresponding error codes with ACH- prefix.
 * These codes are used in API responses and logs for easy identification and tracking.
 */
export const ACHIEVEMENT_ERROR_CODES: Record<AchievementErrorType, string> = {
  // Client errors (4xx)
  [AchievementErrorType.ACHIEVEMENT_NOT_FOUND]: 'ACH-404-001',
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: 'ACH-404-002',
  [AchievementErrorType.INVALID_ACHIEVEMENT_DATA]: 'ACH-400-001',
  [AchievementErrorType.ACHIEVEMENT_ALREADY_UNLOCKED]: 'ACH-409-001',
  [AchievementErrorType.ACHIEVEMENT_CRITERIA_NOT_MET]: 'ACH-400-002',
  [AchievementErrorType.ACHIEVEMENT_DISABLED]: 'ACH-403-001',
  
  // System errors (5xx)
  [AchievementErrorType.ACHIEVEMENT_CREATION_FAILED]: 'ACH-500-001',
  [AchievementErrorType.ACHIEVEMENT_UPDATE_FAILED]: 'ACH-500-002',
  [AchievementErrorType.ACHIEVEMENT_DELETION_FAILED]: 'ACH-500-003',
  [AchievementErrorType.ACHIEVEMENT_QUERY_FAILED]: 'ACH-500-004',
  [AchievementErrorType.ACHIEVEMENT_PROCESSING_FAILED]: 'ACH-500-005',
  
  // Transient errors
  [AchievementErrorType.ACHIEVEMENT_TRANSIENT_ERROR]: 'ACH-503-001',
  [AchievementErrorType.ACHIEVEMENT_RETRY_EXHAUSTED]: 'ACH-503-002',
  
  // External dependency errors
  [AchievementErrorType.ACHIEVEMENT_EXTERNAL_SERVICE_ERROR]: 'ACH-502-001',
  [AchievementErrorType.ACHIEVEMENT_NOTIFICATION_FAILED]: 'ACH-502-002'
};

/**
 * Maps achievement error types to client-friendly message templates.
 * These templates can include placeholders that will be replaced with
 * actual values from the error metadata.
 */
export const ACHIEVEMENT_ERROR_MESSAGES: Record<AchievementErrorType, string> = {
  // Client errors (4xx)
  [AchievementErrorType.ACHIEVEMENT_NOT_FOUND]: 'Achievement with ID {{achievementId}} not found',
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: 'User achievement for user {{userId}} and achievement {{achievementId}} not found',
  [AchievementErrorType.INVALID_ACHIEVEMENT_DATA]: 'Invalid achievement data: {{details}}',
  [AchievementErrorType.ACHIEVEMENT_ALREADY_UNLOCKED]: 'Achievement {{achievementId}} has already been unlocked by user {{userId}}',
  [AchievementErrorType.ACHIEVEMENT_CRITERIA_NOT_MET]: 'Criteria not met for achievement {{achievementId}}: {{details}}',
  [AchievementErrorType.ACHIEVEMENT_DISABLED]: 'Achievement {{achievementId}} is currently disabled',
  
  // System errors (5xx)
  [AchievementErrorType.ACHIEVEMENT_CREATION_FAILED]: 'Failed to create achievement: {{details}}',
  [AchievementErrorType.ACHIEVEMENT_UPDATE_FAILED]: 'Failed to update achievement {{achievementId}}: {{details}}',
  [AchievementErrorType.ACHIEVEMENT_DELETION_FAILED]: 'Failed to delete achievement {{achievementId}}: {{details}}',
  [AchievementErrorType.ACHIEVEMENT_QUERY_FAILED]: 'Failed to query achievements: {{details}}',
  [AchievementErrorType.ACHIEVEMENT_PROCESSING_FAILED]: 'Failed to process achievement {{achievementId}}: {{details}}',
  
  // Transient errors
  [AchievementErrorType.ACHIEVEMENT_TRANSIENT_ERROR]: 'Temporary error processing achievement {{achievementId}}. Please try again later.',
  [AchievementErrorType.ACHIEVEMENT_RETRY_EXHAUSTED]: 'Maximum retry attempts reached for achievement operation: {{details}}',
  
  // External dependency errors
  [AchievementErrorType.ACHIEVEMENT_EXTERNAL_SERVICE_ERROR]: 'External service error while processing achievement {{achievementId}}: {{details}}',
  [AchievementErrorType.ACHIEVEMENT_NOTIFICATION_FAILED]: 'Failed to send achievement notification for {{achievementId}}: {{details}}'
};

/**
 * Maps achievement error types to their corresponding HTTP status codes.
 * Used for generating appropriate HTTP responses for achievement-related errors.
 */
export const ACHIEVEMENT_HTTP_STATUS_CODES: Record<AchievementErrorType, number> = {
  // Client errors (4xx)
  [AchievementErrorType.ACHIEVEMENT_NOT_FOUND]: 404,
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: 404,
  [AchievementErrorType.INVALID_ACHIEVEMENT_DATA]: 400,
  [AchievementErrorType.ACHIEVEMENT_ALREADY_UNLOCKED]: 409,
  [AchievementErrorType.ACHIEVEMENT_CRITERIA_NOT_MET]: 400,
  [AchievementErrorType.ACHIEVEMENT_DISABLED]: 403,
  
  // System errors (5xx)
  [AchievementErrorType.ACHIEVEMENT_CREATION_FAILED]: 500,
  [AchievementErrorType.ACHIEVEMENT_UPDATE_FAILED]: 500,
  [AchievementErrorType.ACHIEVEMENT_DELETION_FAILED]: 500,
  [AchievementErrorType.ACHIEVEMENT_QUERY_FAILED]: 500,
  [AchievementErrorType.ACHIEVEMENT_PROCESSING_FAILED]: 500,
  
  // Transient errors
  [AchievementErrorType.ACHIEVEMENT_TRANSIENT_ERROR]: 503,
  [AchievementErrorType.ACHIEVEMENT_RETRY_EXHAUSTED]: 503,
  
  // External dependency errors
  [AchievementErrorType.ACHIEVEMENT_EXTERNAL_SERVICE_ERROR]: 502,
  [AchievementErrorType.ACHIEVEMENT_NOTIFICATION_FAILED]: 502
};

/**
 * Maps achievement error types to their corresponding error categories.
 * Used for classifying errors for monitoring, alerting, and reporting.
 */
export const ACHIEVEMENT_ERROR_CATEGORIES: Record<AchievementErrorType, ErrorCategory> = {
  // Client errors (4xx)
  [AchievementErrorType.ACHIEVEMENT_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [AchievementErrorType.INVALID_ACHIEVEMENT_DATA]: ErrorCategory.VALIDATION,
  [AchievementErrorType.ACHIEVEMENT_ALREADY_UNLOCKED]: ErrorCategory.CONFLICT,
  [AchievementErrorType.ACHIEVEMENT_CRITERIA_NOT_MET]: ErrorCategory.VALIDATION,
  [AchievementErrorType.ACHIEVEMENT_DISABLED]: ErrorCategory.FORBIDDEN,
  
  // System errors (5xx)
  [AchievementErrorType.ACHIEVEMENT_CREATION_FAILED]: ErrorCategory.INTERNAL,
  [AchievementErrorType.ACHIEVEMENT_UPDATE_FAILED]: ErrorCategory.INTERNAL,
  [AchievementErrorType.ACHIEVEMENT_DELETION_FAILED]: ErrorCategory.INTERNAL,
  [AchievementErrorType.ACHIEVEMENT_QUERY_FAILED]: ErrorCategory.INTERNAL,
  [AchievementErrorType.ACHIEVEMENT_PROCESSING_FAILED]: ErrorCategory.INTERNAL,
  
  // Transient errors
  [AchievementErrorType.ACHIEVEMENT_TRANSIENT_ERROR]: ErrorCategory.TRANSIENT,
  [AchievementErrorType.ACHIEVEMENT_RETRY_EXHAUSTED]: ErrorCategory.TRANSIENT,
  
  // External dependency errors
  [AchievementErrorType.ACHIEVEMENT_EXTERNAL_SERVICE_ERROR]: ErrorCategory.EXTERNAL,
  [AchievementErrorType.ACHIEVEMENT_NOTIFICATION_FAILED]: ErrorCategory.EXTERNAL
};

/**
 * Maps achievement error types to their severity levels.
 * Used for prioritizing alerts and monitoring.
 */
export const ACHIEVEMENT_ERROR_SEVERITIES: Record<AchievementErrorType, ErrorSeverity> = {
  // Client errors (4xx) - generally lower severity
  [AchievementErrorType.ACHIEVEMENT_NOT_FOUND]: ErrorSeverity.LOW,
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: ErrorSeverity.LOW,
  [AchievementErrorType.INVALID_ACHIEVEMENT_DATA]: ErrorSeverity.LOW,
  [AchievementErrorType.ACHIEVEMENT_ALREADY_UNLOCKED]: ErrorSeverity.LOW,
  [AchievementErrorType.ACHIEVEMENT_CRITERIA_NOT_MET]: ErrorSeverity.LOW,
  [AchievementErrorType.ACHIEVEMENT_DISABLED]: ErrorSeverity.LOW,
  
  // System errors (5xx) - higher severity
  [AchievementErrorType.ACHIEVEMENT_CREATION_FAILED]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.ACHIEVEMENT_UPDATE_FAILED]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.ACHIEVEMENT_DELETION_FAILED]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.ACHIEVEMENT_QUERY_FAILED]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.ACHIEVEMENT_PROCESSING_FAILED]: ErrorSeverity.HIGH,
  
  // Transient errors - variable severity
  [AchievementErrorType.ACHIEVEMENT_TRANSIENT_ERROR]: ErrorSeverity.LOW,
  [AchievementErrorType.ACHIEVEMENT_RETRY_EXHAUSTED]: ErrorSeverity.MEDIUM,
  
  // External dependency errors - generally medium severity
  [AchievementErrorType.ACHIEVEMENT_EXTERNAL_SERVICE_ERROR]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.ACHIEVEMENT_NOTIFICATION_FAILED]: ErrorSeverity.MEDIUM
};

/**
 * Maps achievement error types to their retry configuration.
 * Defines which errors are retryable and their retry parameters.
 */
export const ACHIEVEMENT_RETRY_CONFIG: Record<AchievementErrorType, { retryable: boolean; maxRetries?: number; backoffFactor?: number; initialDelayMs?: number }> = {
  // Client errors (4xx) - generally not retryable
  [AchievementErrorType.ACHIEVEMENT_NOT_FOUND]: { retryable: false },
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: { retryable: false },
  [AchievementErrorType.INVALID_ACHIEVEMENT_DATA]: { retryable: false },
  [AchievementErrorType.ACHIEVEMENT_ALREADY_UNLOCKED]: { retryable: false },
  [AchievementErrorType.ACHIEVEMENT_CRITERIA_NOT_MET]: { retryable: false },
  [AchievementErrorType.ACHIEVEMENT_DISABLED]: { retryable: false },
  
  // System errors (5xx) - some may be retryable
  [AchievementErrorType.ACHIEVEMENT_CREATION_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  [AchievementErrorType.ACHIEVEMENT_UPDATE_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  [AchievementErrorType.ACHIEVEMENT_DELETION_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  [AchievementErrorType.ACHIEVEMENT_QUERY_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  [AchievementErrorType.ACHIEVEMENT_PROCESSING_FAILED]: { retryable: true, maxRetries: 3, backoffFactor: 2 },
  
  // Transient errors - always retryable
  [AchievementErrorType.ACHIEVEMENT_TRANSIENT_ERROR]: { retryable: true, maxRetries: 5, backoffFactor: 1.5, initialDelayMs: 100 },
  [AchievementErrorType.ACHIEVEMENT_RETRY_EXHAUSTED]: { retryable: false },
  
  // External dependency errors - retryable with specific configuration
  [AchievementErrorType.ACHIEVEMENT_EXTERNAL_SERVICE_ERROR]: { retryable: true, maxRetries: 3, backoffFactor: 2, initialDelayMs: 200 },
  [AchievementErrorType.ACHIEVEMENT_NOTIFICATION_FAILED]: { retryable: true, maxRetries: 5, backoffFactor: 1.5, initialDelayMs: 150 }
};

/**
 * Interface for achievement not found error metadata.
 */
export interface AchievementNotFoundErrorMetadata {
  achievementId: string;
}

/**
 * Interface for user achievement not found error metadata.
 */
export interface UserAchievementNotFoundErrorMetadata {
  userId: string;
  achievementId: string;
}

/**
 * Interface for invalid achievement data error metadata.
 */
export interface InvalidAchievementDataErrorMetadata {
  details: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Interface for achievement already unlocked error metadata.
 */
export interface AchievementAlreadyUnlockedErrorMetadata {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
}

/**
 * Interface for achievement criteria not met error metadata.
 */
export interface AchievementCriteriaNotMetErrorMetadata {
  achievementId: string;
  userId: string;
  details: string;
  currentProgress?: number;
  requiredProgress?: number;
}

/**
 * Interface for achievement disabled error metadata.
 */
export interface AchievementDisabledErrorMetadata {
  achievementId: string;
  disabledReason?: string;
  enabledAt?: Date;
}

/**
 * Interface for achievement processing error metadata.
 */
export interface AchievementProcessingErrorMetadata {
  achievementId: string;
  details: string;
  operationType: 'create' | 'update' | 'delete' | 'query' | 'process';
  errorDetails?: Error;
}

/**
 * Interface for achievement transient error metadata.
 */
export interface AchievementTransientErrorMetadata {
  achievementId: string;
  retryCount: number;
  nextRetryAt?: Date;
  details: string;
}

/**
 * Interface for achievement external service error metadata.
 */
export interface AchievementExternalServiceErrorMetadata {
  achievementId: string;
  serviceName: string;
  details: string;
  retryable: boolean;
}

/**
 * Interface for achievement notification error metadata.
 */
export interface AchievementNotificationErrorMetadata {
  achievementId: string;
  userId: string;
  notificationType: string;
  details: string;
}

/**
 * Union type of all achievement error metadata interfaces.
 * Used for type-safe error metadata handling across the achievement module.
 */
export type AchievementErrorMetadata =
  | AchievementNotFoundErrorMetadata
  | UserAchievementNotFoundErrorMetadata
  | InvalidAchievementDataErrorMetadata
  | AchievementAlreadyUnlockedErrorMetadata
  | AchievementCriteriaNotMetErrorMetadata
  | AchievementDisabledErrorMetadata
  | AchievementProcessingErrorMetadata
  | AchievementTransientErrorMetadata
  | AchievementExternalServiceErrorMetadata
  | AchievementNotificationErrorMetadata;

/**
 * Maps achievement error types to their corresponding metadata interface.
 * Used for type checking and validation of error metadata.
 */
export interface AchievementErrorTypeToMetadata {
  [AchievementErrorType.ACHIEVEMENT_NOT_FOUND]: AchievementNotFoundErrorMetadata;
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: UserAchievementNotFoundErrorMetadata;
  [AchievementErrorType.INVALID_ACHIEVEMENT_DATA]: InvalidAchievementDataErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_ALREADY_UNLOCKED]: AchievementAlreadyUnlockedErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_CRITERIA_NOT_MET]: AchievementCriteriaNotMetErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_DISABLED]: AchievementDisabledErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_CREATION_FAILED]: AchievementProcessingErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_UPDATE_FAILED]: AchievementProcessingErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_DELETION_FAILED]: AchievementProcessingErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_QUERY_FAILED]: AchievementProcessingErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_PROCESSING_FAILED]: AchievementProcessingErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_TRANSIENT_ERROR]: AchievementTransientErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_RETRY_EXHAUSTED]: AchievementTransientErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_EXTERNAL_SERVICE_ERROR]: AchievementExternalServiceErrorMetadata;
  [AchievementErrorType.ACHIEVEMENT_NOTIFICATION_FAILED]: AchievementNotificationErrorMetadata;
}

/**
 * Helper function to create a properly typed achievement error metadata object.
 * Ensures type safety when creating error metadata for specific error types.
 * 
 * @param errorType The achievement error type
 * @param metadata The error metadata corresponding to the error type
 * @returns The properly typed error metadata
 */
export function createAchievementErrorMetadata<T extends AchievementErrorType>(
  errorType: T,
  metadata: AchievementErrorTypeToMetadata[T]
): AchievementErrorTypeToMetadata[T] {
  return metadata;
}
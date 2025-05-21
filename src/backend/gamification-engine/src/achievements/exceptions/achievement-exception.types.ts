/**
 * @file achievement-exception.types.ts
 * @description Defines error type enumeration and interfaces for achievement-related exceptions.
 */

import { HttpStatus } from '@nestjs/common';

/**
 * Enum representing the different types of achievement-related errors.
 * Used for categorizing errors for proper handling, logging, and client responses.
 */
export enum AchievementErrorType {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',           // Invalid input data
  NOT_FOUND = 'NOT_FOUND',                         // Achievement not found
  USER_ACHIEVEMENT_NOT_FOUND = 'USER_ACHIEVEMENT_NOT_FOUND', // User achievement relationship not found
  DUPLICATE = 'DUPLICATE',                         // Duplicate achievement
  UNAUTHORIZED = 'UNAUTHORIZED',                   // Unauthorized access
  FORBIDDEN = 'FORBIDDEN',                         // Forbidden operation
  
  // System Errors (5xx)
  DATABASE_ERROR = 'DATABASE_ERROR',               // Database operation failure
  INTERNAL_ERROR = 'INTERNAL_ERROR',               // Unspecified internal error
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',     // System configuration issue
  
  // Transient Errors (potentially recoverable)
  TEMPORARY_UNAVAILABLE = 'TEMPORARY_UNAVAILABLE', // Service temporarily unavailable
  TIMEOUT = 'TIMEOUT',                             // Operation timed out
  CONCURRENCY_ERROR = 'CONCURRENCY_ERROR',         // Concurrent modification issue
  
  // External Dependency Errors
  PROFILE_SERVICE_ERROR = 'PROFILE_SERVICE_ERROR', // Profile service integration error
  NOTIFICATION_SERVICE_ERROR = 'NOTIFICATION_SERVICE_ERROR', // Notification service error
  EVENT_PROCESSING_ERROR = 'EVENT_PROCESSING_ERROR', // Event processing error
  KAFKA_ERROR = 'KAFKA_ERROR'                      // Kafka-related error
}

/**
 * Maps achievement error types to HTTP status codes for consistent API responses.
 */
export const AchievementErrorStatusMap: Record<AchievementErrorType, HttpStatus> = {
  // Client Errors (4xx)
  [AchievementErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [AchievementErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [AchievementErrorType.DUPLICATE]: HttpStatus.CONFLICT,
  [AchievementErrorType.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [AchievementErrorType.FORBIDDEN]: HttpStatus.FORBIDDEN,
  
  // System Errors (5xx)
  [AchievementErrorType.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [AchievementErrorType.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [AchievementErrorType.CONFIGURATION_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  
  // Transient Errors
  [AchievementErrorType.TEMPORARY_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [AchievementErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [AchievementErrorType.CONCURRENCY_ERROR]: HttpStatus.CONFLICT,
  
  // External Dependency Errors
  [AchievementErrorType.PROFILE_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [AchievementErrorType.NOTIFICATION_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [AchievementErrorType.EVENT_PROCESSING_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [AchievementErrorType.KAFKA_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR
};

/**
 * Maps achievement error types to standardized error codes with ACH- prefix.
 * These codes are used for consistent error identification across the system.
 */
export const AchievementErrorCodeMap: Record<AchievementErrorType, string> = {
  // Client Errors (4xx)
  [AchievementErrorType.VALIDATION_ERROR]: 'ACH-400',
  [AchievementErrorType.NOT_FOUND]: 'ACH-404',
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: 'ACH-405',
  [AchievementErrorType.DUPLICATE]: 'ACH-409',
  [AchievementErrorType.UNAUTHORIZED]: 'ACH-401',
  [AchievementErrorType.FORBIDDEN]: 'ACH-403',
  
  // System Errors (5xx)
  [AchievementErrorType.DATABASE_ERROR]: 'ACH-500',
  [AchievementErrorType.INTERNAL_ERROR]: 'ACH-501',
  [AchievementErrorType.CONFIGURATION_ERROR]: 'ACH-502',
  
  // Transient Errors
  [AchievementErrorType.TEMPORARY_UNAVAILABLE]: 'ACH-503',
  [AchievementErrorType.TIMEOUT]: 'ACH-504',
  [AchievementErrorType.CONCURRENCY_ERROR]: 'ACH-505',
  
  // External Dependency Errors
  [AchievementErrorType.PROFILE_SERVICE_ERROR]: 'ACH-600',
  [AchievementErrorType.NOTIFICATION_SERVICE_ERROR]: 'ACH-601',
  [AchievementErrorType.EVENT_PROCESSING_ERROR]: 'ACH-602',
  [AchievementErrorType.KAFKA_ERROR]: 'ACH-603'
};

/**
 * Maps achievement error types to client-friendly message templates.
 * These templates can be used to generate consistent user-facing error messages.
 */
export const AchievementErrorMessageMap: Record<AchievementErrorType, string> = {
  // Client Errors (4xx)
  [AchievementErrorType.VALIDATION_ERROR]: 'The achievement data provided is invalid. Please check your input and try again.',
  [AchievementErrorType.NOT_FOUND]: 'The requested achievement could not be found.',
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: 'The requested user achievement relationship could not be found.',
  [AchievementErrorType.DUPLICATE]: 'An achievement with this identifier already exists.',
  [AchievementErrorType.UNAUTHORIZED]: 'You are not authorized to access this achievement.',
  [AchievementErrorType.FORBIDDEN]: 'You do not have permission to perform this operation on the achievement.',
  
  // System Errors (5xx)
  [AchievementErrorType.DATABASE_ERROR]: 'A database error occurred while processing your achievement request.',
  [AchievementErrorType.INTERNAL_ERROR]: 'An internal error occurred while processing your achievement request.',
  [AchievementErrorType.CONFIGURATION_ERROR]: 'A system configuration error occurred while processing your achievement request.',
  
  // Transient Errors
  [AchievementErrorType.TEMPORARY_UNAVAILABLE]: 'The achievement service is temporarily unavailable. Please try again later.',
  [AchievementErrorType.TIMEOUT]: 'The achievement operation timed out. Please try again later.',
  [AchievementErrorType.CONCURRENCY_ERROR]: 'The achievement was modified by another request. Please try again.',
  
  // External Dependency Errors
  [AchievementErrorType.PROFILE_SERVICE_ERROR]: 'Unable to process achievement due to profile service issues.',
  [AchievementErrorType.NOTIFICATION_SERVICE_ERROR]: 'Achievement processed but notification delivery failed.',
  [AchievementErrorType.EVENT_PROCESSING_ERROR]: 'An error occurred while processing the achievement event.',
  [AchievementErrorType.KAFKA_ERROR]: 'An error occurred in the event messaging system while processing achievements.'
};

/**
 * Interface for achievement validation error metadata.
 * Used to provide structured validation error details.
 */
export interface AchievementValidationErrorMetadata {
  field: string;
  value: any;
  constraints: Record<string, string>;
  children?: AchievementValidationErrorMetadata[];
}

/**
 * Interface for achievement not found error metadata.
 * Used to provide context about the missing achievement.
 */
export interface AchievementNotFoundErrorMetadata {
  achievementId: string;
  searchCriteria?: Record<string, any>;
}

/**
 * Interface for user achievement not found error metadata.
 * Used to provide context about the missing user achievement relationship.
 */
export interface UserAchievementNotFoundErrorMetadata {
  userId: string;
  achievementId: string;
  journeyType?: string;
}

/**
 * Interface for achievement duplicate error metadata.
 * Used to provide context about the conflicting achievement.
 */
export interface AchievementDuplicateErrorMetadata {
  existingAchievementId: string;
  conflictingField: string;
  attemptedValue: any;
}

/**
 * Interface for achievement database error metadata.
 * Used to provide context about database operation failures.
 */
export interface AchievementDatabaseErrorMetadata {
  operation: 'create' | 'read' | 'update' | 'delete' | 'query';
  entityType: 'achievement' | 'userAchievement' | 'achievementRule';
  errorCode?: string;
  queryDetails?: Record<string, any>;
}

/**
 * Interface for achievement event processing error metadata.
 * Used to provide context about event processing failures.
 */
export interface AchievementEventProcessingErrorMetadata {
  eventType: string;
  eventId: string;
  userId?: string;
  journeyType?: string;
  processingStage: 'validation' | 'processing' | 'persistence' | 'notification';
  retryCount?: number;
  isRetryable: boolean;
}

/**
 * Interface for achievement external service error metadata.
 * Used to provide context about external service integration failures.
 */
export interface AchievementExternalServiceErrorMetadata {
  serviceName: string;
  operation: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;
  isRetryable: boolean;
  circuitBreakerStatus?: 'open' | 'closed' | 'half-open';
}

/**
 * Determines if an achievement error is retryable based on its type.
 * Used for implementing retry policies for transient errors.
 * 
 * @param errorType - The type of achievement error
 * @returns True if the error is potentially recoverable with a retry, false otherwise
 */
export function isRetryableAchievementError(errorType: AchievementErrorType): boolean {
  return [
    AchievementErrorType.TEMPORARY_UNAVAILABLE,
    AchievementErrorType.TIMEOUT,
    AchievementErrorType.CONCURRENCY_ERROR,
    AchievementErrorType.PROFILE_SERVICE_ERROR,
    AchievementErrorType.NOTIFICATION_SERVICE_ERROR,
    AchievementErrorType.KAFKA_ERROR
  ].includes(errorType);
}

/**
 * Determines if an achievement error is a client error (4xx).
 * Used for error classification and handling.
 * 
 * @param errorType - The type of achievement error
 * @returns True if the error is a client error, false otherwise
 */
export function isClientAchievementError(errorType: AchievementErrorType): boolean {
  return [
    AchievementErrorType.VALIDATION_ERROR,
    AchievementErrorType.NOT_FOUND,
    AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND,
    AchievementErrorType.DUPLICATE,
    AchievementErrorType.UNAUTHORIZED,
    AchievementErrorType.FORBIDDEN
  ].includes(errorType);
}

/**
 * Determines if an achievement error is a system error (5xx).
 * Used for error classification and handling.
 * 
 * @param errorType - The type of achievement error
 * @returns True if the error is a system error, false otherwise
 */
export function isSystemAchievementError(errorType: AchievementErrorType): boolean {
  return [
    AchievementErrorType.DATABASE_ERROR,
    AchievementErrorType.INTERNAL_ERROR,
    AchievementErrorType.CONFIGURATION_ERROR,
    AchievementErrorType.EVENT_PROCESSING_ERROR
  ].includes(errorType);
}

/**
 * Determines if an achievement error is an external dependency error.
 * Used for error classification and handling.
 * 
 * @param errorType - The type of achievement error
 * @returns True if the error is an external dependency error, false otherwise
 */
export function isExternalDependencyAchievementError(errorType: AchievementErrorType): boolean {
  return [
    AchievementErrorType.PROFILE_SERVICE_ERROR,
    AchievementErrorType.NOTIFICATION_SERVICE_ERROR,
    AchievementErrorType.KAFKA_ERROR
  ].includes(errorType);
}
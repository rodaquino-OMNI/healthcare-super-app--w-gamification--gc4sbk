/**
 * @file reward-exception.types.ts
 * @description Defines error type enumeration and interfaces for reward-related exceptions.
 */

import { HttpStatus } from '@nestjs/common';

/**
 * Enum representing the different types of reward-related errors.
 * Used for categorizing errors for proper handling, logging, and client responses.
 */
export enum RewardErrorType {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',           // Invalid input data
  NOT_FOUND = 'NOT_FOUND',                         // Reward not found
  USER_REWARD_NOT_FOUND = 'USER_REWARD_NOT_FOUND', // User reward relationship not found
  DUPLICATE = 'DUPLICATE',                         // Duplicate reward
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
  KAFKA_ERROR = 'KAFKA_ERROR',                     // Kafka-related error
  ACHIEVEMENT_SERVICE_ERROR = 'ACHIEVEMENT_SERVICE_ERROR' // Achievement service error
}

/**
 * Maps reward error types to HTTP status codes for consistent API responses.
 */
export const RewardErrorStatusMap: Record<RewardErrorType, HttpStatus> = {
  // Client Errors (4xx)
  [RewardErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [RewardErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [RewardErrorType.USER_REWARD_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [RewardErrorType.DUPLICATE]: HttpStatus.CONFLICT,
  [RewardErrorType.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [RewardErrorType.FORBIDDEN]: HttpStatus.FORBIDDEN,
  
  // System Errors (5xx)
  [RewardErrorType.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [RewardErrorType.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [RewardErrorType.CONFIGURATION_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  
  // Transient Errors
  [RewardErrorType.TEMPORARY_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [RewardErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [RewardErrorType.CONCURRENCY_ERROR]: HttpStatus.CONFLICT,
  
  // External Dependency Errors
  [RewardErrorType.PROFILE_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [RewardErrorType.NOTIFICATION_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [RewardErrorType.EVENT_PROCESSING_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [RewardErrorType.KAFKA_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [RewardErrorType.ACHIEVEMENT_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY
};

/**
 * Maps reward error types to standardized error codes with REWARD- prefix.
 * These codes are used for consistent error identification across the system.
 */
export const RewardErrorCodeMap: Record<RewardErrorType, string> = {
  // Client Errors (4xx)
  [RewardErrorType.VALIDATION_ERROR]: 'REWARD-400',
  [RewardErrorType.NOT_FOUND]: 'REWARD-404',
  [RewardErrorType.USER_REWARD_NOT_FOUND]: 'REWARD-405',
  [RewardErrorType.DUPLICATE]: 'REWARD-409',
  [RewardErrorType.UNAUTHORIZED]: 'REWARD-401',
  [RewardErrorType.FORBIDDEN]: 'REWARD-403',
  
  // System Errors (5xx)
  [RewardErrorType.DATABASE_ERROR]: 'REWARD-500',
  [RewardErrorType.INTERNAL_ERROR]: 'REWARD-501',
  [RewardErrorType.CONFIGURATION_ERROR]: 'REWARD-502',
  
  // Transient Errors
  [RewardErrorType.TEMPORARY_UNAVAILABLE]: 'REWARD-503',
  [RewardErrorType.TIMEOUT]: 'REWARD-504',
  [RewardErrorType.CONCURRENCY_ERROR]: 'REWARD-505',
  
  // External Dependency Errors
  [RewardErrorType.PROFILE_SERVICE_ERROR]: 'REWARD-600',
  [RewardErrorType.NOTIFICATION_SERVICE_ERROR]: 'REWARD-601',
  [RewardErrorType.EVENT_PROCESSING_ERROR]: 'REWARD-602',
  [RewardErrorType.KAFKA_ERROR]: 'REWARD-603',
  [RewardErrorType.ACHIEVEMENT_SERVICE_ERROR]: 'REWARD-604'
};

/**
 * Maps reward error types to client-friendly message templates.
 * These templates can be used to generate consistent user-facing error messages.
 */
export const RewardErrorMessageMap: Record<RewardErrorType, string> = {
  // Client Errors (4xx)
  [RewardErrorType.VALIDATION_ERROR]: 'The reward data provided is invalid. Please check your input and try again.',
  [RewardErrorType.NOT_FOUND]: 'The requested reward could not be found.',
  [RewardErrorType.USER_REWARD_NOT_FOUND]: 'The requested user reward relationship could not be found.',
  [RewardErrorType.DUPLICATE]: 'A reward with this identifier already exists.',
  [RewardErrorType.UNAUTHORIZED]: 'You are not authorized to access this reward.',
  [RewardErrorType.FORBIDDEN]: 'You do not have permission to perform this operation on the reward.',
  
  // System Errors (5xx)
  [RewardErrorType.DATABASE_ERROR]: 'A database error occurred while processing your reward request.',
  [RewardErrorType.INTERNAL_ERROR]: 'An internal error occurred while processing your reward request.',
  [RewardErrorType.CONFIGURATION_ERROR]: 'A system configuration error occurred while processing your reward request.',
  
  // Transient Errors
  [RewardErrorType.TEMPORARY_UNAVAILABLE]: 'The reward service is temporarily unavailable. Please try again later.',
  [RewardErrorType.TIMEOUT]: 'The reward operation timed out. Please try again later.',
  [RewardErrorType.CONCURRENCY_ERROR]: 'The reward was modified by another request. Please try again.',
  
  // External Dependency Errors
  [RewardErrorType.PROFILE_SERVICE_ERROR]: 'Unable to process reward due to profile service issues.',
  [RewardErrorType.NOTIFICATION_SERVICE_ERROR]: 'Reward processed but notification delivery failed.',
  [RewardErrorType.EVENT_PROCESSING_ERROR]: 'An error occurred while processing the reward event.',
  [RewardErrorType.KAFKA_ERROR]: 'An error occurred in the event messaging system while processing rewards.',
  [RewardErrorType.ACHIEVEMENT_SERVICE_ERROR]: 'Unable to process reward due to achievement service issues.'
};

/**
 * Interface for reward validation error metadata.
 * Used to provide structured validation error details.
 */
export interface RewardValidationErrorMetadata {
  field: string;
  value: any;
  constraints: Record<string, string>;
  children?: RewardValidationErrorMetadata[];
}

/**
 * Interface for reward not found error metadata.
 * Used to provide context about the missing reward.
 */
export interface RewardNotFoundErrorMetadata {
  rewardId: string;
  searchCriteria?: Record<string, any>;
}

/**
 * Interface for user reward not found error metadata.
 * Used to provide context about the missing user reward relationship.
 */
export interface UserRewardNotFoundErrorMetadata {
  userId: string;
  rewardId: string;
  journeyType?: string;
}

/**
 * Interface for reward duplicate error metadata.
 * Used to provide context about the conflicting reward.
 */
export interface RewardDuplicateErrorMetadata {
  existingRewardId: string;
  conflictingField: string;
  attemptedValue: any;
}

/**
 * Interface for reward database error metadata.
 * Used to provide context about database operation failures.
 */
export interface RewardDatabaseErrorMetadata {
  operation: 'create' | 'read' | 'update' | 'delete' | 'query';
  entityType: 'reward' | 'userReward';
  errorCode?: string;
  queryDetails?: Record<string, any>;
}

/**
 * Interface for reward event processing error metadata.
 * Used to provide context about event processing failures.
 */
export interface RewardEventProcessingErrorMetadata {
  eventType: string;
  eventId: string;
  userId?: string;
  journeyType?: string;
  processingStage: 'validation' | 'processing' | 'persistence' | 'notification';
  retryCount?: number;
  isRetryable: boolean;
}

/**
 * Interface for reward external service error metadata.
 * Used to provide context about external service integration failures.
 */
export interface RewardExternalServiceErrorMetadata {
  serviceName: string;
  operation: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;
  isRetryable: boolean;
  circuitBreakerStatus?: 'open' | 'closed' | 'half-open';
}

/**
 * Interface for reward granting error metadata.
 * Used to provide context about failures during reward granting process.
 */
export interface RewardGrantingErrorMetadata {
  userId: string;
  rewardId: string;
  journeyType?: string;
  xpReward?: number;
  failureReason: string;
  processingStage: 'profile-lookup' | 'reward-lookup' | 'user-reward-creation' | 'event-publishing';
}

/**
 * Determines if a reward error is retryable based on its type.
 * Used for implementing retry policies for transient errors.
 * 
 * @param errorType - The type of reward error
 * @returns True if the error is potentially recoverable with a retry, false otherwise
 */
export function isRetryableRewardError(errorType: RewardErrorType): boolean {
  return [
    RewardErrorType.TEMPORARY_UNAVAILABLE,
    RewardErrorType.TIMEOUT,
    RewardErrorType.CONCURRENCY_ERROR,
    RewardErrorType.PROFILE_SERVICE_ERROR,
    RewardErrorType.NOTIFICATION_SERVICE_ERROR,
    RewardErrorType.KAFKA_ERROR,
    RewardErrorType.ACHIEVEMENT_SERVICE_ERROR
  ].includes(errorType);
}

/**
 * Determines if a reward error is a client error (4xx).
 * Used for error classification and handling.
 * 
 * @param errorType - The type of reward error
 * @returns True if the error is a client error, false otherwise
 */
export function isClientRewardError(errorType: RewardErrorType): boolean {
  return [
    RewardErrorType.VALIDATION_ERROR,
    RewardErrorType.NOT_FOUND,
    RewardErrorType.USER_REWARD_NOT_FOUND,
    RewardErrorType.DUPLICATE,
    RewardErrorType.UNAUTHORIZED,
    RewardErrorType.FORBIDDEN
  ].includes(errorType);
}

/**
 * Determines if a reward error is a system error (5xx).
 * Used for error classification and handling.
 * 
 * @param errorType - The type of reward error
 * @returns True if the error is a system error, false otherwise
 */
export function isSystemRewardError(errorType: RewardErrorType): boolean {
  return [
    RewardErrorType.DATABASE_ERROR,
    RewardErrorType.INTERNAL_ERROR,
    RewardErrorType.CONFIGURATION_ERROR,
    RewardErrorType.EVENT_PROCESSING_ERROR
  ].includes(errorType);
}

/**
 * Determines if a reward error is an external dependency error.
 * Used for error classification and handling.
 * 
 * @param errorType - The type of reward error
 * @returns True if the error is an external dependency error, false otherwise
 */
export function isExternalDependencyRewardError(errorType: RewardErrorType): boolean {
  return [
    RewardErrorType.PROFILE_SERVICE_ERROR,
    RewardErrorType.NOTIFICATION_SERVICE_ERROR,
    RewardErrorType.KAFKA_ERROR,
    RewardErrorType.ACHIEVEMENT_SERVICE_ERROR
  ].includes(errorType);
}

/**
 * Maps legacy error codes to the new standardized reward error codes.
 * Used for backward compatibility during the transition period.
 * 
 * @param legacyCode - The legacy error code (e.g., 'REWARD_001')
 * @returns The corresponding standardized error code (e.g., 'REWARD-500')
 */
export function mapLegacyRewardErrorCode(legacyCode: string): string {
  const legacyCodeMap: Record<string, string> = {
    'REWARD_001': 'REWARD-500', // Failed to create reward
    'REWARD_002': 'REWARD-500', // Failed to retrieve rewards
    'REWARD_003': 'REWARD-404', // Reward not found
    'REWARD_004': 'REWARD-500', // Failed to retrieve reward
    'REWARD_005': 'REWARD-500'  // Failed to grant reward
  };

  return legacyCodeMap[legacyCode] || 'REWARD-501'; // Default to internal error if not found
}
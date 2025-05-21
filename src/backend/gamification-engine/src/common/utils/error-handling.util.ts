/**
 * Error handling utilities for the gamification engine.
 * 
 * Provides a comprehensive error handling framework with journey-specific error classification,
 * standardized error codes, and context enrichment. Enables consistent error responses and
 * proper troubleshooting across gamification components.
 */

import { Logger } from '@nestjs/common';
import {
  BaseError,
  ErrorType,
  BusinessError,
  TechnicalError,
  ValidationError,
  ExternalError,
  ErrorContext,
  ErrorMetadata,
} from '@austa/errors';
import { formatErrorWithContext } from '@austa/errors/utils';
import { JourneyType } from '../interfaces/journey.interface';

// Create a dedicated logger for error handling
const logger = new Logger('GamificationErrorHandler');

/**
 * Gamification-specific error types that extend the base ErrorType
 */
export enum GamificationErrorType {
  // Achievement-related errors
  ACHIEVEMENT_NOT_FOUND = 'ACHIEVEMENT_NOT_FOUND',
  ACHIEVEMENT_ALREADY_COMPLETED = 'ACHIEVEMENT_ALREADY_COMPLETED',
  ACHIEVEMENT_CRITERIA_INVALID = 'ACHIEVEMENT_CRITERIA_INVALID',
  ACHIEVEMENT_PROGRESS_INVALID = 'ACHIEVEMENT_PROGRESS_INVALID',
  
  // Quest-related errors
  QUEST_NOT_FOUND = 'QUEST_NOT_FOUND',
  QUEST_ALREADY_COMPLETED = 'QUEST_ALREADY_COMPLETED',
  QUEST_EXPIRED = 'QUEST_EXPIRED',
  QUEST_NOT_AVAILABLE = 'QUEST_NOT_AVAILABLE',
  
  // Reward-related errors
  REWARD_NOT_FOUND = 'REWARD_NOT_FOUND',
  REWARD_ALREADY_CLAIMED = 'REWARD_ALREADY_CLAIMED',
  REWARD_EXPIRED = 'REWARD_EXPIRED',
  REWARD_NOT_AVAILABLE = 'REWARD_NOT_AVAILABLE',
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
  
  // Profile-related errors
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  PROFILE_CREATION_FAILED = 'PROFILE_CREATION_FAILED',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  
  // Event-related errors
  EVENT_VALIDATION_FAILED = 'EVENT_VALIDATION_FAILED',
  EVENT_PROCESSING_FAILED = 'EVENT_PROCESSING_FAILED',
  EVENT_SCHEMA_INVALID = 'EVENT_SCHEMA_INVALID',
  EVENT_SOURCE_INVALID = 'EVENT_SOURCE_INVALID',
  
  // Rule-related errors
  RULE_EVALUATION_FAILED = 'RULE_EVALUATION_FAILED',
  RULE_NOT_FOUND = 'RULE_NOT_FOUND',
  RULE_CONDITION_INVALID = 'RULE_CONDITION_INVALID',
  
  // Leaderboard-related errors
  LEADERBOARD_NOT_FOUND = 'LEADERBOARD_NOT_FOUND',
  LEADERBOARD_UPDATE_FAILED = 'LEADERBOARD_UPDATE_FAILED',
  
  // General gamification errors
  JOURNEY_NOT_SUPPORTED = 'JOURNEY_NOT_SUPPORTED',
  GAMIFICATION_SERVICE_UNAVAILABLE = 'GAMIFICATION_SERVICE_UNAVAILABLE',
  CONFIGURATION_INVALID = 'CONFIGURATION_INVALID',
}

/**
 * Error codes specific to the gamification engine
 */
export enum GamificationErrorCode {
  // Achievement error codes
  ACHIEVEMENT_NOT_FOUND = 'GAMIFICATION_ACHIEVEMENT_001',
  ACHIEVEMENT_ALREADY_COMPLETED = 'GAMIFICATION_ACHIEVEMENT_002',
  ACHIEVEMENT_CRITERIA_INVALID = 'GAMIFICATION_ACHIEVEMENT_003',
  ACHIEVEMENT_PROGRESS_INVALID = 'GAMIFICATION_ACHIEVEMENT_004',
  
  // Quest error codes
  QUEST_NOT_FOUND = 'GAMIFICATION_QUEST_001',
  QUEST_ALREADY_COMPLETED = 'GAMIFICATION_QUEST_002',
  QUEST_EXPIRED = 'GAMIFICATION_QUEST_003',
  QUEST_NOT_AVAILABLE = 'GAMIFICATION_QUEST_004',
  
  // Reward error codes
  REWARD_NOT_FOUND = 'GAMIFICATION_REWARD_001',
  REWARD_ALREADY_CLAIMED = 'GAMIFICATION_REWARD_002',
  REWARD_EXPIRED = 'GAMIFICATION_REWARD_003',
  REWARD_NOT_AVAILABLE = 'GAMIFICATION_REWARD_004',
  INSUFFICIENT_POINTS = 'GAMIFICATION_REWARD_005',
  
  // Profile error codes
  PROFILE_NOT_FOUND = 'GAMIFICATION_PROFILE_001',
  PROFILE_CREATION_FAILED = 'GAMIFICATION_PROFILE_002',
  PROFILE_UPDATE_FAILED = 'GAMIFICATION_PROFILE_003',
  
  // Event error codes
  EVENT_VALIDATION_FAILED = 'GAMIFICATION_EVENT_001',
  EVENT_PROCESSING_FAILED = 'GAMIFICATION_EVENT_002',
  EVENT_SCHEMA_INVALID = 'GAMIFICATION_EVENT_003',
  EVENT_SOURCE_INVALID = 'GAMIFICATION_EVENT_004',
  
  // Rule error codes
  RULE_EVALUATION_FAILED = 'GAMIFICATION_RULE_001',
  RULE_NOT_FOUND = 'GAMIFICATION_RULE_002',
  RULE_CONDITION_INVALID = 'GAMIFICATION_RULE_003',
  
  // Leaderboard error codes
  LEADERBOARD_NOT_FOUND = 'GAMIFICATION_LEADERBOARD_001',
  LEADERBOARD_UPDATE_FAILED = 'GAMIFICATION_LEADERBOARD_002',
  
  // General gamification error codes
  JOURNEY_NOT_SUPPORTED = 'GAMIFICATION_GENERAL_001',
  GAMIFICATION_SERVICE_UNAVAILABLE = 'GAMIFICATION_GENERAL_002',
  CONFIGURATION_INVALID = 'GAMIFICATION_GENERAL_003',
}

/**
 * Maps gamification error types to their corresponding error codes
 */
const errorTypeToCodeMap: Record<GamificationErrorType, GamificationErrorCode> = {
  [GamificationErrorType.ACHIEVEMENT_NOT_FOUND]: GamificationErrorCode.ACHIEVEMENT_NOT_FOUND,
  [GamificationErrorType.ACHIEVEMENT_ALREADY_COMPLETED]: GamificationErrorCode.ACHIEVEMENT_ALREADY_COMPLETED,
  [GamificationErrorType.ACHIEVEMENT_CRITERIA_INVALID]: GamificationErrorCode.ACHIEVEMENT_CRITERIA_INVALID,
  [GamificationErrorType.ACHIEVEMENT_PROGRESS_INVALID]: GamificationErrorCode.ACHIEVEMENT_PROGRESS_INVALID,
  
  [GamificationErrorType.QUEST_NOT_FOUND]: GamificationErrorCode.QUEST_NOT_FOUND,
  [GamificationErrorType.QUEST_ALREADY_COMPLETED]: GamificationErrorCode.QUEST_ALREADY_COMPLETED,
  [GamificationErrorType.QUEST_EXPIRED]: GamificationErrorCode.QUEST_EXPIRED,
  [GamificationErrorType.QUEST_NOT_AVAILABLE]: GamificationErrorCode.QUEST_NOT_AVAILABLE,
  
  [GamificationErrorType.REWARD_NOT_FOUND]: GamificationErrorCode.REWARD_NOT_FOUND,
  [GamificationErrorType.REWARD_ALREADY_CLAIMED]: GamificationErrorCode.REWARD_ALREADY_CLAIMED,
  [GamificationErrorType.REWARD_EXPIRED]: GamificationErrorCode.REWARD_EXPIRED,
  [GamificationErrorType.REWARD_NOT_AVAILABLE]: GamificationErrorCode.REWARD_NOT_AVAILABLE,
  [GamificationErrorType.INSUFFICIENT_POINTS]: GamificationErrorCode.INSUFFICIENT_POINTS,
  
  [GamificationErrorType.PROFILE_NOT_FOUND]: GamificationErrorCode.PROFILE_NOT_FOUND,
  [GamificationErrorType.PROFILE_CREATION_FAILED]: GamificationErrorCode.PROFILE_CREATION_FAILED,
  [GamificationErrorType.PROFILE_UPDATE_FAILED]: GamificationErrorCode.PROFILE_UPDATE_FAILED,
  
  [GamificationErrorType.EVENT_VALIDATION_FAILED]: GamificationErrorCode.EVENT_VALIDATION_FAILED,
  [GamificationErrorType.EVENT_PROCESSING_FAILED]: GamificationErrorCode.EVENT_PROCESSING_FAILED,
  [GamificationErrorType.EVENT_SCHEMA_INVALID]: GamificationErrorCode.EVENT_SCHEMA_INVALID,
  [GamificationErrorType.EVENT_SOURCE_INVALID]: GamificationErrorCode.EVENT_SOURCE_INVALID,
  
  [GamificationErrorType.RULE_EVALUATION_FAILED]: GamificationErrorCode.RULE_EVALUATION_FAILED,
  [GamificationErrorType.RULE_NOT_FOUND]: GamificationErrorCode.RULE_NOT_FOUND,
  [GamificationErrorType.RULE_CONDITION_INVALID]: GamificationErrorCode.RULE_CONDITION_INVALID,
  
  [GamificationErrorType.LEADERBOARD_NOT_FOUND]: GamificationErrorCode.LEADERBOARD_NOT_FOUND,
  [GamificationErrorType.LEADERBOARD_UPDATE_FAILED]: GamificationErrorCode.LEADERBOARD_UPDATE_FAILED,
  
  [GamificationErrorType.JOURNEY_NOT_SUPPORTED]: GamificationErrorCode.JOURNEY_NOT_SUPPORTED,
  [GamificationErrorType.GAMIFICATION_SERVICE_UNAVAILABLE]: GamificationErrorCode.GAMIFICATION_SERVICE_UNAVAILABLE,
  [GamificationErrorType.CONFIGURATION_INVALID]: GamificationErrorCode.CONFIGURATION_INVALID,
};

/**
 * Maps gamification error types to their corresponding base error types
 */
const errorTypeToBaseTypeMap: Record<GamificationErrorType, ErrorType> = {
  // Business errors (4xx client errors)
  [GamificationErrorType.ACHIEVEMENT_NOT_FOUND]: ErrorType.BUSINESS,
  [GamificationErrorType.ACHIEVEMENT_ALREADY_COMPLETED]: ErrorType.BUSINESS,
  [GamificationErrorType.ACHIEVEMENT_CRITERIA_INVALID]: ErrorType.VALIDATION,
  [GamificationErrorType.ACHIEVEMENT_PROGRESS_INVALID]: ErrorType.VALIDATION,
  
  [GamificationErrorType.QUEST_NOT_FOUND]: ErrorType.BUSINESS,
  [GamificationErrorType.QUEST_ALREADY_COMPLETED]: ErrorType.BUSINESS,
  [GamificationErrorType.QUEST_EXPIRED]: ErrorType.BUSINESS,
  [GamificationErrorType.QUEST_NOT_AVAILABLE]: ErrorType.BUSINESS,
  
  [GamificationErrorType.REWARD_NOT_FOUND]: ErrorType.BUSINESS,
  [GamificationErrorType.REWARD_ALREADY_CLAIMED]: ErrorType.BUSINESS,
  [GamificationErrorType.REWARD_EXPIRED]: ErrorType.BUSINESS,
  [GamificationErrorType.REWARD_NOT_AVAILABLE]: ErrorType.BUSINESS,
  [GamificationErrorType.INSUFFICIENT_POINTS]: ErrorType.BUSINESS,
  
  [GamificationErrorType.PROFILE_NOT_FOUND]: ErrorType.BUSINESS,
  [GamificationErrorType.PROFILE_CREATION_FAILED]: ErrorType.TECHNICAL,
  [GamificationErrorType.PROFILE_UPDATE_FAILED]: ErrorType.TECHNICAL,
  
  // Validation errors (4xx client errors)
  [GamificationErrorType.EVENT_VALIDATION_FAILED]: ErrorType.VALIDATION,
  [GamificationErrorType.EVENT_SCHEMA_INVALID]: ErrorType.VALIDATION,
  [GamificationErrorType.EVENT_SOURCE_INVALID]: ErrorType.VALIDATION,
  
  // Technical errors (5xx server errors)
  [GamificationErrorType.EVENT_PROCESSING_FAILED]: ErrorType.TECHNICAL,
  [GamificationErrorType.RULE_EVALUATION_FAILED]: ErrorType.TECHNICAL,
  [GamificationErrorType.RULE_NOT_FOUND]: ErrorType.BUSINESS,
  [GamificationErrorType.RULE_CONDITION_INVALID]: ErrorType.VALIDATION,
  
  [GamificationErrorType.LEADERBOARD_NOT_FOUND]: ErrorType.BUSINESS,
  [GamificationErrorType.LEADERBOARD_UPDATE_FAILED]: ErrorType.TECHNICAL,
  
  [GamificationErrorType.JOURNEY_NOT_SUPPORTED]: ErrorType.VALIDATION,
  [GamificationErrorType.GAMIFICATION_SERVICE_UNAVAILABLE]: ErrorType.TECHNICAL,
  [GamificationErrorType.CONFIGURATION_INVALID]: ErrorType.TECHNICAL,
};

/**
 * Default error messages for gamification error types
 */
const defaultErrorMessages: Record<GamificationErrorType, string> = {
  [GamificationErrorType.ACHIEVEMENT_NOT_FOUND]: 'Achievement not found',
  [GamificationErrorType.ACHIEVEMENT_ALREADY_COMPLETED]: 'Achievement already completed',
  [GamificationErrorType.ACHIEVEMENT_CRITERIA_INVALID]: 'Invalid achievement criteria',
  [GamificationErrorType.ACHIEVEMENT_PROGRESS_INVALID]: 'Invalid achievement progress',
  
  [GamificationErrorType.QUEST_NOT_FOUND]: 'Quest not found',
  [GamificationErrorType.QUEST_ALREADY_COMPLETED]: 'Quest already completed',
  [GamificationErrorType.QUEST_EXPIRED]: 'Quest has expired',
  [GamificationErrorType.QUEST_NOT_AVAILABLE]: 'Quest is not available',
  
  [GamificationErrorType.REWARD_NOT_FOUND]: 'Reward not found',
  [GamificationErrorType.REWARD_ALREADY_CLAIMED]: 'Reward already claimed',
  [GamificationErrorType.REWARD_EXPIRED]: 'Reward has expired',
  [GamificationErrorType.REWARD_NOT_AVAILABLE]: 'Reward is not available',
  [GamificationErrorType.INSUFFICIENT_POINTS]: 'Insufficient points to claim reward',
  
  [GamificationErrorType.PROFILE_NOT_FOUND]: 'Gamification profile not found',
  [GamificationErrorType.PROFILE_CREATION_FAILED]: 'Failed to create gamification profile',
  [GamificationErrorType.PROFILE_UPDATE_FAILED]: 'Failed to update gamification profile',
  
  [GamificationErrorType.EVENT_VALIDATION_FAILED]: 'Event validation failed',
  [GamificationErrorType.EVENT_PROCESSING_FAILED]: 'Event processing failed',
  [GamificationErrorType.EVENT_SCHEMA_INVALID]: 'Invalid event schema',
  [GamificationErrorType.EVENT_SOURCE_INVALID]: 'Invalid event source',
  
  [GamificationErrorType.RULE_EVALUATION_FAILED]: 'Rule evaluation failed',
  [GamificationErrorType.RULE_NOT_FOUND]: 'Rule not found',
  [GamificationErrorType.RULE_CONDITION_INVALID]: 'Invalid rule condition',
  
  [GamificationErrorType.LEADERBOARD_NOT_FOUND]: 'Leaderboard not found',
  [GamificationErrorType.LEADERBOARD_UPDATE_FAILED]: 'Failed to update leaderboard',
  
  [GamificationErrorType.JOURNEY_NOT_SUPPORTED]: 'Journey type not supported',
  [GamificationErrorType.GAMIFICATION_SERVICE_UNAVAILABLE]: 'Gamification service is currently unavailable',
  [GamificationErrorType.CONFIGURATION_INVALID]: 'Invalid gamification configuration',
};

/**
 * Interface for gamification-specific error context
 */
export interface GamificationErrorContext extends ErrorContext {
  journeyType?: JourneyType;
  userId?: string;
  achievementId?: string;
  questId?: string;
  rewardId?: string;
  ruleId?: string;
  eventType?: string;
  eventId?: string;
  profileId?: string;
  leaderboardId?: string;
  points?: number;
  requiredPoints?: number;
  progress?: number;
  threshold?: number;
}

/**
 * Creates a gamification error with the specified type and context
 * 
 * @param type The gamification error type
 * @param context Additional context for the error
 * @param message Optional custom error message
 * @param cause Optional cause of the error
 * @returns A properly typed error instance
 */
export function createGamificationError(
  type: GamificationErrorType,
  context: GamificationErrorContext = {},
  message?: string,
  cause?: Error,
): BusinessError | ValidationError | TechnicalError | ExternalError {
  const baseType = errorTypeToBaseTypeMap[type];
  const errorCode = errorTypeToCodeMap[type];
  const errorMessage = message || defaultErrorMessages[type];
  
  // Enrich context with error type and code
  const enrichedContext: GamificationErrorContext = {
    ...context,
    errorType: type,
    errorCode,
  };
  
  // Create metadata for the error
  const metadata: ErrorMetadata = {
    code: errorCode,
    type: baseType,
    context: enrichedContext,
  };
  
  // Log the error with context
  logError(type, enrichedContext, errorMessage, cause);
  
  // Create the appropriate error type
  switch (baseType) {
    case ErrorType.BUSINESS:
      return new BusinessError(errorMessage, metadata, cause);
    case ErrorType.VALIDATION:
      return new ValidationError(errorMessage, metadata, cause);
    case ErrorType.TECHNICAL:
      return new TechnicalError(errorMessage, metadata, cause);
    case ErrorType.EXTERNAL:
      return new ExternalError(errorMessage, metadata, cause);
    default:
      return new TechnicalError(errorMessage, metadata, cause);
  }
}

/**
 * Handles an error by categorizing it and enriching it with context
 * 
 * @param error The error to handle
 * @param context Additional context to add to the error
 * @returns A properly typed and enriched error
 */
export function handleError(
  error: unknown,
  context: GamificationErrorContext = {},
): Error {
  // If it's already a BaseError, just enrich it with additional context
  if (error instanceof BaseError) {
    // Merge the existing context with the new context
    const enrichedContext = {
      ...error.metadata?.context,
      ...context,
    };
    
    // Update the error's metadata with the enriched context
    error.metadata = {
      ...error.metadata,
      context: enrichedContext,
    };
    
    // Log the enriched error
    logError(
      enrichedContext.errorType as GamificationErrorType,
      enrichedContext,
      error.message,
      error.cause,
    );
    
    return error;
  }
  
  // If it's a standard Error, convert it to a TechnicalError
  if (error instanceof Error) {
    return createGamificationError(
      GamificationErrorType.GAMIFICATION_SERVICE_UNAVAILABLE,
      context,
      error.message,
      error,
    );
  }
  
  // If it's something else, convert it to a string and create a TechnicalError
  const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred';
  return createGamificationError(
    GamificationErrorType.GAMIFICATION_SERVICE_UNAVAILABLE,
    context,
    errorMessage,
  );
}

/**
 * Determines if an error is retryable based on its type and context
 * 
 * @param error The error to check
 * @returns True if the error is retryable, false otherwise
 */
export function isRetryableError(error: unknown): boolean {
  // If it's not a BaseError, assume it's retryable as a precaution
  if (!(error instanceof BaseError)) {
    return true;
  }
  
  // Technical errors are generally retryable
  if (error.metadata?.type === ErrorType.TECHNICAL) {
    return true;
  }
  
  // External errors are generally retryable
  if (error.metadata?.type === ErrorType.EXTERNAL) {
    return true;
  }
  
  // Specific gamification error types that are retryable
  const errorType = error.metadata?.context?.errorType as GamificationErrorType;
  const retryableErrorTypes = [
    GamificationErrorType.EVENT_PROCESSING_FAILED,
    GamificationErrorType.RULE_EVALUATION_FAILED,
    GamificationErrorType.LEADERBOARD_UPDATE_FAILED,
    GamificationErrorType.PROFILE_CREATION_FAILED,
    GamificationErrorType.PROFILE_UPDATE_FAILED,
    GamificationErrorType.GAMIFICATION_SERVICE_UNAVAILABLE,
  ];
  
  return retryableErrorTypes.includes(errorType);
}

/**
 * Determines if an error is a client error (4xx) or server error (5xx)
 * 
 * @param error The error to check
 * @returns True if it's a client error, false if it's a server error
 */
export function isClientError(error: unknown): boolean {
  if (!(error instanceof BaseError)) {
    return false; // Assume server error for unknown error types
  }
  
  // Business and validation errors are client errors
  return (
    error.metadata?.type === ErrorType.BUSINESS ||
    error.metadata?.type === ErrorType.VALIDATION
  );
}

/**
 * Creates a user-friendly error message with journey context
 * 
 * @param error The error to format
 * @returns A user-friendly error message
 */
export function formatUserFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof BaseError)) {
    return 'An unexpected error occurred. Please try again later.';
  }
  
  const context = error.metadata?.context as GamificationErrorContext;
  const journeyType = context?.journeyType;
  
  // Format the error message based on the journey type
  let journeyPrefix = '';
  if (journeyType) {
    switch (journeyType) {
      case JourneyType.HEALTH:
        journeyPrefix = 'Health Journey: ';
        break;
      case JourneyType.CARE:
        journeyPrefix = 'Care Journey: ';
        break;
      case JourneyType.PLAN:
        journeyPrefix = 'Plan Journey: ';
        break;
      default:
        journeyPrefix = '';
    }
  }
  
  // Use the formatErrorWithContext utility from @austa/errors
  return formatErrorWithContext(error, { journeyPrefix });
}

/**
 * Logs an error with its context and additional information
 * 
 * @param type The gamification error type
 * @param context The error context
 * @param message The error message
 * @param cause The cause of the error
 */
function logError(
  type: GamificationErrorType,
  context: GamificationErrorContext,
  message: string,
  cause?: Error,
): void {
  const baseType = errorTypeToBaseTypeMap[type];
  const errorCode = errorTypeToCodeMap[type];
  
  // Create a structured log entry
  const logEntry = {
    errorType: type,
    errorCode,
    baseType,
    message,
    context,
    timestamp: new Date().toISOString(),
    stack: cause?.stack,
  };
  
  // Log at the appropriate level based on the error type
  switch (baseType) {
    case ErrorType.BUSINESS:
    case ErrorType.VALIDATION:
      logger.warn(`Gamification client error: ${message}`, logEntry);
      break;
    case ErrorType.TECHNICAL:
    case ErrorType.EXTERNAL:
    default:
      logger.error(`Gamification server error: ${message}`, logEntry);
      break;
  }
}

/**
 * Wraps an async function with error handling
 * 
 * @param fn The function to wrap
 * @param context The context to add to any errors
 * @returns A wrapped function that handles errors
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  context: GamificationErrorContext = {},
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error, context);
    }
  };
}

/**
 * Safely executes a function and returns a result or null if an error occurs
 * 
 * @param fn The function to execute
 * @param context The context to add to any errors
 * @returns The function result or null if an error occurs
 */
export async function trySafe<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  args: Args,
  context: GamificationErrorContext = {},
): Promise<T | null> {
  try {
    return await fn(...args);
  } catch (error) {
    // Log the error but don't throw
    handleError(error, context);
    return null;
  }
}

/**
 * Safely executes a function and returns a result or a default value if an error occurs
 * 
 * @param fn The function to execute
 * @param args The arguments to pass to the function
 * @param defaultValue The default value to return if an error occurs
 * @param context The context to add to any errors
 * @returns The function result or the default value if an error occurs
 */
export async function trySafeWithDefault<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  args: Args,
  defaultValue: T,
  context: GamificationErrorContext = {},
): Promise<T> {
  try {
    return await fn(...args);
  } catch (error) {
    // Log the error but don't throw
    handleError(error, context);
    return defaultValue;
  }
}
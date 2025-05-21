/**
 * @file error-types.enum.ts
 * @description Defines comprehensive error type enumerations and interfaces for the entire gamification engine.
 * Contains error codes, categories, and standardized metadata structures that ensure consistent error classification
 * across all modules.
 */

import { HttpStatus } from '@nestjs/common';

/**
 * Primary error type classification for the gamification engine.
 * Used for high-level categorization of errors for proper handling, logging, and client responses.
 */
export enum ErrorType {
  // Client-side errors (typically 4xx HTTP status codes)
  VALIDATION = 'VALIDATION',       // Input validation failures
  BUSINESS = 'BUSINESS',           // Business rule violations
  AUTHENTICATION = 'AUTHENTICATION', // Authentication failures
  AUTHORIZATION = 'AUTHORIZATION',   // Authorization failures
  NOT_FOUND = 'NOT_FOUND',        // Resource not found
  
  // System-side errors (typically 5xx HTTP status codes)
  TECHNICAL = 'TECHNICAL',         // Internal technical failures
  DATABASE = 'DATABASE',           // Database operation failures
  CONFIGURATION = 'CONFIGURATION', // System configuration issues
  
  // Special error categories
  TRANSIENT = 'TRANSIENT',         // Temporary errors that may resolve with retry
  EXTERNAL = 'EXTERNAL'            // External dependency failures
}

/**
 * Error severity levels for monitoring, alerting, and reporting.
 * Used to prioritize error handling and notification.
 */
export enum ErrorSeverity {
  LOW = 'low',           // Minor issues, no immediate action required
  MEDIUM = 'medium',     // Significant issues requiring attention
  HIGH = 'high',         // Critical issues requiring immediate attention
  CRITICAL = 'critical'  // Severe issues that may affect system stability
}

/**
 * Detailed error types for the Achievements domain in the gamification engine.
 */
export enum AchievementErrorType {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'ACHIEVEMENT_VALIDATION_ERROR',           // Invalid achievement data
  NOT_FOUND = 'ACHIEVEMENT_NOT_FOUND',                         // Achievement not found
  USER_ACHIEVEMENT_NOT_FOUND = 'USER_ACHIEVEMENT_NOT_FOUND',   // User achievement relationship not found
  DUPLICATE = 'ACHIEVEMENT_DUPLICATE',                         // Duplicate achievement
  UNAUTHORIZED = 'ACHIEVEMENT_UNAUTHORIZED',                   // Unauthorized access
  FORBIDDEN = 'ACHIEVEMENT_FORBIDDEN',                         // Forbidden operation
  
  // System Errors (5xx)
  DATABASE_ERROR = 'ACHIEVEMENT_DATABASE_ERROR',               // Database operation failure
  INTERNAL_ERROR = 'ACHIEVEMENT_INTERNAL_ERROR',               // Unspecified internal error
  CONFIGURATION_ERROR = 'ACHIEVEMENT_CONFIGURATION_ERROR',     // System configuration issue
  
  // Transient Errors (potentially recoverable)
  TEMPORARY_UNAVAILABLE = 'ACHIEVEMENT_TEMPORARY_UNAVAILABLE', // Service temporarily unavailable
  TIMEOUT = 'ACHIEVEMENT_TIMEOUT',                             // Operation timed out
  CONCURRENCY_ERROR = 'ACHIEVEMENT_CONCURRENCY_ERROR',         // Concurrent modification issue
  
  // External Dependency Errors
  PROFILE_SERVICE_ERROR = 'ACHIEVEMENT_PROFILE_SERVICE_ERROR', // Profile service integration error
  NOTIFICATION_SERVICE_ERROR = 'ACHIEVEMENT_NOTIFICATION_ERROR', // Notification service error
  EVENT_PROCESSING_ERROR = 'ACHIEVEMENT_EVENT_PROCESSING_ERROR', // Event processing error
  KAFKA_ERROR = 'ACHIEVEMENT_KAFKA_ERROR'                      // Kafka-related error
}

/**
 * Detailed error types for the Events domain in the gamification engine.
 */
export enum EventErrorType {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'EVENT_VALIDATION_ERROR',           // Invalid event data
  SCHEMA_ERROR = 'EVENT_SCHEMA_ERROR',                   // Event schema violation
  UNSUPPORTED_EVENT = 'EVENT_UNSUPPORTED',              // Unsupported event type
  DUPLICATE_EVENT = 'EVENT_DUPLICATE',                   // Duplicate event
  
  // System Errors (5xx)
  PROCESSING_ERROR = 'EVENT_PROCESSING_ERROR',           // Event processing failure
  PERSISTENCE_ERROR = 'EVENT_PERSISTENCE_ERROR',         // Event persistence failure
  INTERNAL_ERROR = 'EVENT_INTERNAL_ERROR',               // Unspecified internal error
  
  // Transient Errors (potentially recoverable)
  TEMPORARY_UNAVAILABLE = 'EVENT_TEMPORARY_UNAVAILABLE', // Service temporarily unavailable
  TIMEOUT = 'EVENT_TIMEOUT',                             // Operation timed out
  
  // External Dependency Errors
  KAFKA_PRODUCER_ERROR = 'EVENT_KAFKA_PRODUCER_ERROR',   // Kafka producer error
  KAFKA_CONSUMER_ERROR = 'EVENT_KAFKA_CONSUMER_ERROR',   // Kafka consumer error
  KAFKA_CONNECTION_ERROR = 'EVENT_KAFKA_CONNECTION_ERROR', // Kafka connection error
  KAFKA_TOPIC_ERROR = 'EVENT_KAFKA_TOPIC_ERROR'          // Kafka topic error
}

/**
 * Detailed error types for the Profiles domain in the gamification engine.
 */
export enum ProfileErrorType {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'PROFILE_VALIDATION_ERROR',           // Invalid profile data
  NOT_FOUND = 'PROFILE_NOT_FOUND',                         // Profile not found
  DUPLICATE = 'PROFILE_DUPLICATE',                         // Duplicate profile
  
  // System Errors (5xx)
  DATABASE_ERROR = 'PROFILE_DATABASE_ERROR',               // Database operation failure
  INTERNAL_ERROR = 'PROFILE_INTERNAL_ERROR',               // Unspecified internal error
  
  // Transient Errors (potentially recoverable)
  TEMPORARY_UNAVAILABLE = 'PROFILE_TEMPORARY_UNAVAILABLE', // Service temporarily unavailable
  TIMEOUT = 'PROFILE_TIMEOUT',                             // Operation timed out
  
  // External Dependency Errors
  AUTH_SERVICE_ERROR = 'PROFILE_AUTH_SERVICE_ERROR',       // Auth service integration error
  USER_SERVICE_ERROR = 'PROFILE_USER_SERVICE_ERROR'        // User service integration error
}

/**
 * Detailed error types for the Rewards domain in the gamification engine.
 */
export enum RewardErrorType {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'REWARD_VALIDATION_ERROR',           // Invalid reward data
  NOT_FOUND = 'REWARD_NOT_FOUND',                         // Reward not found
  USER_REWARD_NOT_FOUND = 'USER_REWARD_NOT_FOUND',       // User reward relationship not found
  INSUFFICIENT_POINTS = 'REWARD_INSUFFICIENT_POINTS',     // Not enough points to claim reward
  ALREADY_CLAIMED = 'REWARD_ALREADY_CLAIMED',            // Reward already claimed
  EXPIRED = 'REWARD_EXPIRED',                            // Reward expired
  
  // System Errors (5xx)
  DATABASE_ERROR = 'REWARD_DATABASE_ERROR',               // Database operation failure
  INTERNAL_ERROR = 'REWARD_INTERNAL_ERROR',               // Unspecified internal error
  
  // Transient Errors (potentially recoverable)
  TEMPORARY_UNAVAILABLE = 'REWARD_TEMPORARY_UNAVAILABLE', // Service temporarily unavailable
  TIMEOUT = 'REWARD_TIMEOUT',                             // Operation timed out
  
  // External Dependency Errors
  NOTIFICATION_SERVICE_ERROR = 'REWARD_NOTIFICATION_ERROR', // Notification service error
  EXTERNAL_REWARD_SERVICE_ERROR = 'REWARD_EXTERNAL_SERVICE_ERROR' // External reward service error
}

/**
 * Detailed error types for the Quests domain in the gamification engine.
 */
export enum QuestErrorType {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'QUEST_VALIDATION_ERROR',           // Invalid quest data
  NOT_FOUND = 'QUEST_NOT_FOUND',                         // Quest not found
  USER_QUEST_NOT_FOUND = 'USER_QUEST_NOT_FOUND',         // User quest relationship not found
  ALREADY_COMPLETED = 'QUEST_ALREADY_COMPLETED',         // Quest already completed
  EXPIRED = 'QUEST_EXPIRED',                             // Quest expired
  PREREQUISITES_NOT_MET = 'QUEST_PREREQUISITES_NOT_MET', // Quest prerequisites not met
  
  // System Errors (5xx)
  DATABASE_ERROR = 'QUEST_DATABASE_ERROR',               // Database operation failure
  INTERNAL_ERROR = 'QUEST_INTERNAL_ERROR',               // Unspecified internal error
  
  // Transient Errors (potentially recoverable)
  TEMPORARY_UNAVAILABLE = 'QUEST_TEMPORARY_UNAVAILABLE', // Service temporarily unavailable
  TIMEOUT = 'QUEST_TIMEOUT',                             // Operation timed out
  
  // External Dependency Errors
  ACHIEVEMENT_SERVICE_ERROR = 'QUEST_ACHIEVEMENT_SERVICE_ERROR', // Achievement service error
  REWARD_SERVICE_ERROR = 'QUEST_REWARD_SERVICE_ERROR'     // Reward service error
}

/**
 * Detailed error types for the Rules domain in the gamification engine.
 */
export enum RuleErrorType {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'RULE_VALIDATION_ERROR',           // Invalid rule data
  NOT_FOUND = 'RULE_NOT_FOUND',                         // Rule not found
  CIRCULAR_DEPENDENCY = 'RULE_CIRCULAR_DEPENDENCY',     // Circular dependency between rules
  INVALID_CONDITION = 'RULE_INVALID_CONDITION',         // Invalid rule condition
  
  // System Errors (5xx)
  DATABASE_ERROR = 'RULE_DATABASE_ERROR',               // Database operation failure
  INTERNAL_ERROR = 'RULE_INTERNAL_ERROR',               // Unspecified internal error
  EVALUATION_ERROR = 'RULE_EVALUATION_ERROR',           // Rule evaluation error
  
  // Transient Errors (potentially recoverable)
  TEMPORARY_UNAVAILABLE = 'RULE_TEMPORARY_UNAVAILABLE', // Service temporarily unavailable
  TIMEOUT = 'RULE_TIMEOUT',                             // Operation timed out
  
  // External Dependency Errors
  EVENT_SERVICE_ERROR = 'RULE_EVENT_SERVICE_ERROR'      // Event service error
}

/**
 * Detailed error types for the Leaderboard domain in the gamification engine.
 */
export enum LeaderboardErrorType {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'LEADERBOARD_VALIDATION_ERROR',           // Invalid leaderboard data
  NOT_FOUND = 'LEADERBOARD_NOT_FOUND',                         // Leaderboard not found
  USER_NOT_FOUND = 'LEADERBOARD_USER_NOT_FOUND',               // User not found in leaderboard
  
  // System Errors (5xx)
  DATABASE_ERROR = 'LEADERBOARD_DATABASE_ERROR',               // Database operation failure
  INTERNAL_ERROR = 'LEADERBOARD_INTERNAL_ERROR',               // Unspecified internal error
  CALCULATION_ERROR = 'LEADERBOARD_CALCULATION_ERROR',         // Score calculation error
  
  // Transient Errors (potentially recoverable)
  TEMPORARY_UNAVAILABLE = 'LEADERBOARD_TEMPORARY_UNAVAILABLE', // Service temporarily unavailable
  TIMEOUT = 'LEADERBOARD_TIMEOUT',                             // Operation timed out
  
  // External Dependency Errors
  REDIS_ERROR = 'LEADERBOARD_REDIS_ERROR',                     // Redis error
  PROFILE_SERVICE_ERROR = 'LEADERBOARD_PROFILE_SERVICE_ERROR'  // Profile service error
}

/**
 * Maps error types to standardized error codes with GAM- prefix.
 * These codes are used for consistent error identification across the system.
 */
export const ErrorCodeMap: Record<string, string> = {
  // Achievement Error Codes
  [AchievementErrorType.VALIDATION_ERROR]: 'GAM-ACH-400',
  [AchievementErrorType.NOT_FOUND]: 'GAM-ACH-404',
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: 'GAM-ACH-405',
  [AchievementErrorType.DUPLICATE]: 'GAM-ACH-409',
  [AchievementErrorType.UNAUTHORIZED]: 'GAM-ACH-401',
  [AchievementErrorType.FORBIDDEN]: 'GAM-ACH-403',
  [AchievementErrorType.DATABASE_ERROR]: 'GAM-ACH-500',
  [AchievementErrorType.INTERNAL_ERROR]: 'GAM-ACH-501',
  [AchievementErrorType.CONFIGURATION_ERROR]: 'GAM-ACH-502',
  [AchievementErrorType.TEMPORARY_UNAVAILABLE]: 'GAM-ACH-503',
  [AchievementErrorType.TIMEOUT]: 'GAM-ACH-504',
  [AchievementErrorType.CONCURRENCY_ERROR]: 'GAM-ACH-505',
  [AchievementErrorType.PROFILE_SERVICE_ERROR]: 'GAM-ACH-600',
  [AchievementErrorType.NOTIFICATION_SERVICE_ERROR]: 'GAM-ACH-601',
  [AchievementErrorType.EVENT_PROCESSING_ERROR]: 'GAM-ACH-602',
  [AchievementErrorType.KAFKA_ERROR]: 'GAM-ACH-603',
  
  // Event Error Codes
  [EventErrorType.VALIDATION_ERROR]: 'GAM-EVT-400',
  [EventErrorType.SCHEMA_ERROR]: 'GAM-EVT-401',
  [EventErrorType.UNSUPPORTED_EVENT]: 'GAM-EVT-402',
  [EventErrorType.DUPLICATE_EVENT]: 'GAM-EVT-409',
  [EventErrorType.PROCESSING_ERROR]: 'GAM-EVT-500',
  [EventErrorType.PERSISTENCE_ERROR]: 'GAM-EVT-501',
  [EventErrorType.INTERNAL_ERROR]: 'GAM-EVT-502',
  [EventErrorType.TEMPORARY_UNAVAILABLE]: 'GAM-EVT-503',
  [EventErrorType.TIMEOUT]: 'GAM-EVT-504',
  [EventErrorType.KAFKA_PRODUCER_ERROR]: 'GAM-EVT-600',
  [EventErrorType.KAFKA_CONSUMER_ERROR]: 'GAM-EVT-601',
  [EventErrorType.KAFKA_CONNECTION_ERROR]: 'GAM-EVT-602',
  [EventErrorType.KAFKA_TOPIC_ERROR]: 'GAM-EVT-603',
  
  // Profile Error Codes
  [ProfileErrorType.VALIDATION_ERROR]: 'GAM-PRF-400',
  [ProfileErrorType.NOT_FOUND]: 'GAM-PRF-404',
  [ProfileErrorType.DUPLICATE]: 'GAM-PRF-409',
  [ProfileErrorType.DATABASE_ERROR]: 'GAM-PRF-500',
  [ProfileErrorType.INTERNAL_ERROR]: 'GAM-PRF-501',
  [ProfileErrorType.TEMPORARY_UNAVAILABLE]: 'GAM-PRF-503',
  [ProfileErrorType.TIMEOUT]: 'GAM-PRF-504',
  [ProfileErrorType.AUTH_SERVICE_ERROR]: 'GAM-PRF-600',
  [ProfileErrorType.USER_SERVICE_ERROR]: 'GAM-PRF-601',
  
  // Reward Error Codes
  [RewardErrorType.VALIDATION_ERROR]: 'GAM-RWD-400',
  [RewardErrorType.NOT_FOUND]: 'GAM-RWD-404',
  [RewardErrorType.USER_REWARD_NOT_FOUND]: 'GAM-RWD-405',
  [RewardErrorType.INSUFFICIENT_POINTS]: 'GAM-RWD-406',
  [RewardErrorType.ALREADY_CLAIMED]: 'GAM-RWD-407',
  [RewardErrorType.EXPIRED]: 'GAM-RWD-408',
  [RewardErrorType.DATABASE_ERROR]: 'GAM-RWD-500',
  [RewardErrorType.INTERNAL_ERROR]: 'GAM-RWD-501',
  [RewardErrorType.TEMPORARY_UNAVAILABLE]: 'GAM-RWD-503',
  [RewardErrorType.TIMEOUT]: 'GAM-RWD-504',
  [RewardErrorType.NOTIFICATION_SERVICE_ERROR]: 'GAM-RWD-600',
  [RewardErrorType.EXTERNAL_REWARD_SERVICE_ERROR]: 'GAM-RWD-601',
  
  // Quest Error Codes
  [QuestErrorType.VALIDATION_ERROR]: 'GAM-QST-400',
  [QuestErrorType.NOT_FOUND]: 'GAM-QST-404',
  [QuestErrorType.USER_QUEST_NOT_FOUND]: 'GAM-QST-405',
  [QuestErrorType.ALREADY_COMPLETED]: 'GAM-QST-406',
  [QuestErrorType.EXPIRED]: 'GAM-QST-407',
  [QuestErrorType.PREREQUISITES_NOT_MET]: 'GAM-QST-408',
  [QuestErrorType.DATABASE_ERROR]: 'GAM-QST-500',
  [QuestErrorType.INTERNAL_ERROR]: 'GAM-QST-501',
  [QuestErrorType.TEMPORARY_UNAVAILABLE]: 'GAM-QST-503',
  [QuestErrorType.TIMEOUT]: 'GAM-QST-504',
  [QuestErrorType.ACHIEVEMENT_SERVICE_ERROR]: 'GAM-QST-600',
  [QuestErrorType.REWARD_SERVICE_ERROR]: 'GAM-QST-601',
  
  // Rule Error Codes
  [RuleErrorType.VALIDATION_ERROR]: 'GAM-RUL-400',
  [RuleErrorType.NOT_FOUND]: 'GAM-RUL-404',
  [RuleErrorType.CIRCULAR_DEPENDENCY]: 'GAM-RUL-405',
  [RuleErrorType.INVALID_CONDITION]: 'GAM-RUL-406',
  [RuleErrorType.DATABASE_ERROR]: 'GAM-RUL-500',
  [RuleErrorType.INTERNAL_ERROR]: 'GAM-RUL-501',
  [RuleErrorType.EVALUATION_ERROR]: 'GAM-RUL-502',
  [RuleErrorType.TEMPORARY_UNAVAILABLE]: 'GAM-RUL-503',
  [RuleErrorType.TIMEOUT]: 'GAM-RUL-504',
  [RuleErrorType.EVENT_SERVICE_ERROR]: 'GAM-RUL-600',
  
  // Leaderboard Error Codes
  [LeaderboardErrorType.VALIDATION_ERROR]: 'GAM-LDB-400',
  [LeaderboardErrorType.NOT_FOUND]: 'GAM-LDB-404',
  [LeaderboardErrorType.USER_NOT_FOUND]: 'GAM-LDB-405',
  [LeaderboardErrorType.DATABASE_ERROR]: 'GAM-LDB-500',
  [LeaderboardErrorType.INTERNAL_ERROR]: 'GAM-LDB-501',
  [LeaderboardErrorType.CALCULATION_ERROR]: 'GAM-LDB-502',
  [LeaderboardErrorType.TEMPORARY_UNAVAILABLE]: 'GAM-LDB-503',
  [LeaderboardErrorType.TIMEOUT]: 'GAM-LDB-504',
  [LeaderboardErrorType.REDIS_ERROR]: 'GAM-LDB-600',
  [LeaderboardErrorType.PROFILE_SERVICE_ERROR]: 'GAM-LDB-601'
};

/**
 * Maps error types to HTTP status codes for consistent API responses.
 */
export const ErrorStatusMap: Record<string, HttpStatus> = {
  // Achievement Error Status Codes
  [AchievementErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [AchievementErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [AchievementErrorType.DUPLICATE]: HttpStatus.CONFLICT,
  [AchievementErrorType.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [AchievementErrorType.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [AchievementErrorType.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [AchievementErrorType.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [AchievementErrorType.CONFIGURATION_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [AchievementErrorType.TEMPORARY_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [AchievementErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [AchievementErrorType.CONCURRENCY_ERROR]: HttpStatus.CONFLICT,
  [AchievementErrorType.PROFILE_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [AchievementErrorType.NOTIFICATION_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [AchievementErrorType.EVENT_PROCESSING_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [AchievementErrorType.KAFKA_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  
  // Event Error Status Codes
  [EventErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [EventErrorType.SCHEMA_ERROR]: HttpStatus.BAD_REQUEST,
  [EventErrorType.UNSUPPORTED_EVENT]: HttpStatus.BAD_REQUEST,
  [EventErrorType.DUPLICATE_EVENT]: HttpStatus.CONFLICT,
  [EventErrorType.PROCESSING_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [EventErrorType.PERSISTENCE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [EventErrorType.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [EventErrorType.TEMPORARY_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [EventErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [EventErrorType.KAFKA_PRODUCER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [EventErrorType.KAFKA_CONSUMER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [EventErrorType.KAFKA_CONNECTION_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [EventErrorType.KAFKA_TOPIC_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  
  // Profile Error Status Codes
  [ProfileErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [ProfileErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ProfileErrorType.DUPLICATE]: HttpStatus.CONFLICT,
  [ProfileErrorType.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ProfileErrorType.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ProfileErrorType.TEMPORARY_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [ProfileErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [ProfileErrorType.AUTH_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [ProfileErrorType.USER_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  
  // Reward Error Status Codes
  [RewardErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [RewardErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [RewardErrorType.USER_REWARD_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [RewardErrorType.INSUFFICIENT_POINTS]: HttpStatus.BAD_REQUEST,
  [RewardErrorType.ALREADY_CLAIMED]: HttpStatus.CONFLICT,
  [RewardErrorType.EXPIRED]: HttpStatus.GONE,
  [RewardErrorType.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [RewardErrorType.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [RewardErrorType.TEMPORARY_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [RewardErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [RewardErrorType.NOTIFICATION_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [RewardErrorType.EXTERNAL_REWARD_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  
  // Quest Error Status Codes
  [QuestErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [QuestErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [QuestErrorType.USER_QUEST_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [QuestErrorType.ALREADY_COMPLETED]: HttpStatus.CONFLICT,
  [QuestErrorType.EXPIRED]: HttpStatus.GONE,
  [QuestErrorType.PREREQUISITES_NOT_MET]: HttpStatus.PRECONDITION_FAILED,
  [QuestErrorType.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [QuestErrorType.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [QuestErrorType.TEMPORARY_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [QuestErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [QuestErrorType.ACHIEVEMENT_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  [QuestErrorType.REWARD_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  
  // Rule Error Status Codes
  [RuleErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [RuleErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [RuleErrorType.CIRCULAR_DEPENDENCY]: HttpStatus.BAD_REQUEST,
  [RuleErrorType.INVALID_CONDITION]: HttpStatus.BAD_REQUEST,
  [RuleErrorType.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [RuleErrorType.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [RuleErrorType.EVALUATION_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [RuleErrorType.TEMPORARY_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [RuleErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [RuleErrorType.EVENT_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
  
  // Leaderboard Error Status Codes
  [LeaderboardErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [LeaderboardErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [LeaderboardErrorType.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [LeaderboardErrorType.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [LeaderboardErrorType.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [LeaderboardErrorType.CALCULATION_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [LeaderboardErrorType.TEMPORARY_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [LeaderboardErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [LeaderboardErrorType.REDIS_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [LeaderboardErrorType.PROFILE_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY
};

/**
 * Maps error types to default error messages for consistent user-facing error messages.
 */
export const ErrorMessageMap: Record<string, string> = {
  // Achievement Error Messages
  [AchievementErrorType.VALIDATION_ERROR]: 'The achievement data provided is invalid. Please check your input and try again.',
  [AchievementErrorType.NOT_FOUND]: 'The requested achievement could not be found.',
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: 'The requested user achievement relationship could not be found.',
  [AchievementErrorType.DUPLICATE]: 'An achievement with this identifier already exists.',
  [AchievementErrorType.UNAUTHORIZED]: 'You are not authorized to access this achievement.',
  [AchievementErrorType.FORBIDDEN]: 'You do not have permission to perform this operation on the achievement.',
  [AchievementErrorType.DATABASE_ERROR]: 'A database error occurred while processing your achievement request.',
  [AchievementErrorType.INTERNAL_ERROR]: 'An internal error occurred while processing your achievement request.',
  [AchievementErrorType.CONFIGURATION_ERROR]: 'A system configuration error occurred while processing your achievement request.',
  [AchievementErrorType.TEMPORARY_UNAVAILABLE]: 'The achievement service is temporarily unavailable. Please try again later.',
  [AchievementErrorType.TIMEOUT]: 'The achievement operation timed out. Please try again later.',
  [AchievementErrorType.CONCURRENCY_ERROR]: 'The achievement was modified by another request. Please try again.',
  [AchievementErrorType.PROFILE_SERVICE_ERROR]: 'Unable to process achievement due to profile service issues.',
  [AchievementErrorType.NOTIFICATION_SERVICE_ERROR]: 'Achievement processed but notification delivery failed.',
  [AchievementErrorType.EVENT_PROCESSING_ERROR]: 'An error occurred while processing the achievement event.',
  [AchievementErrorType.KAFKA_ERROR]: 'An error occurred in the event messaging system while processing achievements.',
  
  // Event Error Messages
  [EventErrorType.VALIDATION_ERROR]: 'The event data provided is invalid. Please check your input and try again.',
  [EventErrorType.SCHEMA_ERROR]: 'The event schema is invalid. Please check your event structure.',
  [EventErrorType.UNSUPPORTED_EVENT]: 'The event type is not supported by the system.',
  [EventErrorType.DUPLICATE_EVENT]: 'This event has already been processed.',
  [EventErrorType.PROCESSING_ERROR]: 'An error occurred while processing the event.',
  [EventErrorType.PERSISTENCE_ERROR]: 'An error occurred while saving the event.',
  [EventErrorType.INTERNAL_ERROR]: 'An internal error occurred while handling the event.',
  [EventErrorType.TEMPORARY_UNAVAILABLE]: 'The event service is temporarily unavailable. Please try again later.',
  [EventErrorType.TIMEOUT]: 'The event processing timed out. Please try again later.',
  [EventErrorType.KAFKA_PRODUCER_ERROR]: 'An error occurred while publishing the event.',
  [EventErrorType.KAFKA_CONSUMER_ERROR]: 'An error occurred while consuming the event.',
  [EventErrorType.KAFKA_CONNECTION_ERROR]: 'An error occurred while connecting to the event messaging system.',
  [EventErrorType.KAFKA_TOPIC_ERROR]: 'An error occurred with the event topic configuration.',
  
  // Profile Error Messages
  [ProfileErrorType.VALIDATION_ERROR]: 'The profile data provided is invalid. Please check your input and try again.',
  [ProfileErrorType.NOT_FOUND]: 'The requested profile could not be found.',
  [ProfileErrorType.DUPLICATE]: 'A profile with this identifier already exists.',
  [ProfileErrorType.DATABASE_ERROR]: 'A database error occurred while processing your profile request.',
  [ProfileErrorType.INTERNAL_ERROR]: 'An internal error occurred while processing your profile request.',
  [ProfileErrorType.TEMPORARY_UNAVAILABLE]: 'The profile service is temporarily unavailable. Please try again later.',
  [ProfileErrorType.TIMEOUT]: 'The profile operation timed out. Please try again later.',
  [ProfileErrorType.AUTH_SERVICE_ERROR]: 'Unable to process profile due to authentication service issues.',
  [ProfileErrorType.USER_SERVICE_ERROR]: 'Unable to process profile due to user service issues.',
  
  // Reward Error Messages
  [RewardErrorType.VALIDATION_ERROR]: 'The reward data provided is invalid. Please check your input and try again.',
  [RewardErrorType.NOT_FOUND]: 'The requested reward could not be found.',
  [RewardErrorType.USER_REWARD_NOT_FOUND]: 'The requested user reward relationship could not be found.',
  [RewardErrorType.INSUFFICIENT_POINTS]: 'You do not have enough points to claim this reward.',
  [RewardErrorType.ALREADY_CLAIMED]: 'This reward has already been claimed.',
  [RewardErrorType.EXPIRED]: 'This reward has expired and is no longer available.',
  [RewardErrorType.DATABASE_ERROR]: 'A database error occurred while processing your reward request.',
  [RewardErrorType.INTERNAL_ERROR]: 'An internal error occurred while processing your reward request.',
  [RewardErrorType.TEMPORARY_UNAVAILABLE]: 'The reward service is temporarily unavailable. Please try again later.',
  [RewardErrorType.TIMEOUT]: 'The reward operation timed out. Please try again later.',
  [RewardErrorType.NOTIFICATION_SERVICE_ERROR]: 'Reward processed but notification delivery failed.',
  [RewardErrorType.EXTERNAL_REWARD_SERVICE_ERROR]: 'Unable to process reward due to external service issues.',
  
  // Quest Error Messages
  [QuestErrorType.VALIDATION_ERROR]: 'The quest data provided is invalid. Please check your input and try again.',
  [QuestErrorType.NOT_FOUND]: 'The requested quest could not be found.',
  [QuestErrorType.USER_QUEST_NOT_FOUND]: 'The requested user quest relationship could not be found.',
  [QuestErrorType.ALREADY_COMPLETED]: 'This quest has already been completed.',
  [QuestErrorType.EXPIRED]: 'This quest has expired and is no longer available.',
  [QuestErrorType.PREREQUISITES_NOT_MET]: 'The prerequisites for this quest have not been met.',
  [QuestErrorType.DATABASE_ERROR]: 'A database error occurred while processing your quest request.',
  [QuestErrorType.INTERNAL_ERROR]: 'An internal error occurred while processing your quest request.',
  [QuestErrorType.TEMPORARY_UNAVAILABLE]: 'The quest service is temporarily unavailable. Please try again later.',
  [QuestErrorType.TIMEOUT]: 'The quest operation timed out. Please try again later.',
  [QuestErrorType.ACHIEVEMENT_SERVICE_ERROR]: 'Unable to process quest due to achievement service issues.',
  [QuestErrorType.REWARD_SERVICE_ERROR]: 'Unable to process quest due to reward service issues.',
  
  // Rule Error Messages
  [RuleErrorType.VALIDATION_ERROR]: 'The rule data provided is invalid. Please check your input and try again.',
  [RuleErrorType.NOT_FOUND]: 'The requested rule could not be found.',
  [RuleErrorType.CIRCULAR_DEPENDENCY]: 'A circular dependency was detected in the rule configuration.',
  [RuleErrorType.INVALID_CONDITION]: 'The rule condition is invalid or cannot be evaluated.',
  [RuleErrorType.DATABASE_ERROR]: 'A database error occurred while processing your rule request.',
  [RuleErrorType.INTERNAL_ERROR]: 'An internal error occurred while processing your rule request.',
  [RuleErrorType.EVALUATION_ERROR]: 'An error occurred while evaluating the rule.',
  [RuleErrorType.TEMPORARY_UNAVAILABLE]: 'The rule service is temporarily unavailable. Please try again later.',
  [RuleErrorType.TIMEOUT]: 'The rule operation timed out. Please try again later.',
  [RuleErrorType.EVENT_SERVICE_ERROR]: 'Unable to process rule due to event service issues.',
  
  // Leaderboard Error Messages
  [LeaderboardErrorType.VALIDATION_ERROR]: 'The leaderboard data provided is invalid. Please check your input and try again.',
  [LeaderboardErrorType.NOT_FOUND]: 'The requested leaderboard could not be found.',
  [LeaderboardErrorType.USER_NOT_FOUND]: 'The requested user could not be found in the leaderboard.',
  [LeaderboardErrorType.DATABASE_ERROR]: 'A database error occurred while processing your leaderboard request.',
  [LeaderboardErrorType.INTERNAL_ERROR]: 'An internal error occurred while processing your leaderboard request.',
  [LeaderboardErrorType.CALCULATION_ERROR]: 'An error occurred while calculating leaderboard scores.',
  [LeaderboardErrorType.TEMPORARY_UNAVAILABLE]: 'The leaderboard service is temporarily unavailable. Please try again later.',
  [LeaderboardErrorType.TIMEOUT]: 'The leaderboard operation timed out. Please try again later.',
  [LeaderboardErrorType.REDIS_ERROR]: 'An error occurred with the leaderboard caching system.',
  [LeaderboardErrorType.PROFILE_SERVICE_ERROR]: 'Unable to process leaderboard due to profile service issues.'
};

/**
 * Maps error types to severity levels for monitoring and alerting.
 */
export const ErrorSeverityMap: Record<string, ErrorSeverity> = {
  // Achievement Error Severities
  [AchievementErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [AchievementErrorType.NOT_FOUND]: ErrorSeverity.LOW,
  [AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND]: ErrorSeverity.LOW,
  [AchievementErrorType.DUPLICATE]: ErrorSeverity.LOW,
  [AchievementErrorType.UNAUTHORIZED]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.FORBIDDEN]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.DATABASE_ERROR]: ErrorSeverity.HIGH,
  [AchievementErrorType.INTERNAL_ERROR]: ErrorSeverity.HIGH,
  [AchievementErrorType.CONFIGURATION_ERROR]: ErrorSeverity.HIGH,
  [AchievementErrorType.TEMPORARY_UNAVAILABLE]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.TIMEOUT]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.CONCURRENCY_ERROR]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.PROFILE_SERVICE_ERROR]: ErrorSeverity.HIGH,
  [AchievementErrorType.NOTIFICATION_SERVICE_ERROR]: ErrorSeverity.MEDIUM,
  [AchievementErrorType.EVENT_PROCESSING_ERROR]: ErrorSeverity.HIGH,
  [AchievementErrorType.KAFKA_ERROR]: ErrorSeverity.HIGH,
  
  // Event Error Severities
  [EventErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [EventErrorType.SCHEMA_ERROR]: ErrorSeverity.MEDIUM,
  [EventErrorType.UNSUPPORTED_EVENT]: ErrorSeverity.LOW,
  [EventErrorType.DUPLICATE_EVENT]: ErrorSeverity.LOW,
  [EventErrorType.PROCESSING_ERROR]: ErrorSeverity.HIGH,
  [EventErrorType.PERSISTENCE_ERROR]: ErrorSeverity.HIGH,
  [EventErrorType.INTERNAL_ERROR]: ErrorSeverity.HIGH,
  [EventErrorType.TEMPORARY_UNAVAILABLE]: ErrorSeverity.MEDIUM,
  [EventErrorType.TIMEOUT]: ErrorSeverity.MEDIUM,
  [EventErrorType.KAFKA_PRODUCER_ERROR]: ErrorSeverity.HIGH,
  [EventErrorType.KAFKA_CONSUMER_ERROR]: ErrorSeverity.HIGH,
  [EventErrorType.KAFKA_CONNECTION_ERROR]: ErrorSeverity.CRITICAL,
  [EventErrorType.KAFKA_TOPIC_ERROR]: ErrorSeverity.HIGH,
  
  // Profile Error Severities
  [ProfileErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [ProfileErrorType.NOT_FOUND]: ErrorSeverity.LOW,
  [ProfileErrorType.DUPLICATE]: ErrorSeverity.LOW,
  [ProfileErrorType.DATABASE_ERROR]: ErrorSeverity.HIGH,
  [ProfileErrorType.INTERNAL_ERROR]: ErrorSeverity.HIGH,
  [ProfileErrorType.TEMPORARY_UNAVAILABLE]: ErrorSeverity.MEDIUM,
  [ProfileErrorType.TIMEOUT]: ErrorSeverity.MEDIUM,
  [ProfileErrorType.AUTH_SERVICE_ERROR]: ErrorSeverity.HIGH,
  [ProfileErrorType.USER_SERVICE_ERROR]: ErrorSeverity.HIGH,
  
  // Reward Error Severities
  [RewardErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [RewardErrorType.NOT_FOUND]: ErrorSeverity.LOW,
  [RewardErrorType.USER_REWARD_NOT_FOUND]: ErrorSeverity.LOW,
  [RewardErrorType.INSUFFICIENT_POINTS]: ErrorSeverity.LOW,
  [RewardErrorType.ALREADY_CLAIMED]: ErrorSeverity.LOW,
  [RewardErrorType.EXPIRED]: ErrorSeverity.LOW,
  [RewardErrorType.DATABASE_ERROR]: ErrorSeverity.HIGH,
  [RewardErrorType.INTERNAL_ERROR]: ErrorSeverity.HIGH,
  [RewardErrorType.TEMPORARY_UNAVAILABLE]: ErrorSeverity.MEDIUM,
  [RewardErrorType.TIMEOUT]: ErrorSeverity.MEDIUM,
  [RewardErrorType.NOTIFICATION_SERVICE_ERROR]: ErrorSeverity.MEDIUM,
  [RewardErrorType.EXTERNAL_REWARD_SERVICE_ERROR]: ErrorSeverity.HIGH,
  
  // Quest Error Severities
  [QuestErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [QuestErrorType.NOT_FOUND]: ErrorSeverity.LOW,
  [QuestErrorType.USER_QUEST_NOT_FOUND]: ErrorSeverity.LOW,
  [QuestErrorType.ALREADY_COMPLETED]: ErrorSeverity.LOW,
  [QuestErrorType.EXPIRED]: ErrorSeverity.LOW,
  [QuestErrorType.PREREQUISITES_NOT_MET]: ErrorSeverity.LOW,
  [QuestErrorType.DATABASE_ERROR]: ErrorSeverity.HIGH,
  [QuestErrorType.INTERNAL_ERROR]: ErrorSeverity.HIGH,
  [QuestErrorType.TEMPORARY_UNAVAILABLE]: ErrorSeverity.MEDIUM,
  [QuestErrorType.TIMEOUT]: ErrorSeverity.MEDIUM,
  [QuestErrorType.ACHIEVEMENT_SERVICE_ERROR]: ErrorSeverity.HIGH,
  [QuestErrorType.REWARD_SERVICE_ERROR]: ErrorSeverity.HIGH,
  
  // Rule Error Severities
  [RuleErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [RuleErrorType.NOT_FOUND]: ErrorSeverity.LOW,
  [RuleErrorType.CIRCULAR_DEPENDENCY]: ErrorSeverity.MEDIUM,
  [RuleErrorType.INVALID_CONDITION]: ErrorSeverity.MEDIUM,
  [RuleErrorType.DATABASE_ERROR]: ErrorSeverity.HIGH,
  [RuleErrorType.INTERNAL_ERROR]: ErrorSeverity.HIGH,
  [RuleErrorType.EVALUATION_ERROR]: ErrorSeverity.HIGH,
  [RuleErrorType.TEMPORARY_UNAVAILABLE]: ErrorSeverity.MEDIUM,
  [RuleErrorType.TIMEOUT]: ErrorSeverity.MEDIUM,
  [RuleErrorType.EVENT_SERVICE_ERROR]: ErrorSeverity.HIGH,
  
  // Leaderboard Error Severities
  [LeaderboardErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [LeaderboardErrorType.NOT_FOUND]: ErrorSeverity.LOW,
  [LeaderboardErrorType.USER_NOT_FOUND]: ErrorSeverity.LOW,
  [LeaderboardErrorType.DATABASE_ERROR]: ErrorSeverity.HIGH,
  [LeaderboardErrorType.INTERNAL_ERROR]: ErrorSeverity.HIGH,
  [LeaderboardErrorType.CALCULATION_ERROR]: ErrorSeverity.HIGH,
  [LeaderboardErrorType.TEMPORARY_UNAVAILABLE]: ErrorSeverity.MEDIUM,
  [LeaderboardErrorType.TIMEOUT]: ErrorSeverity.MEDIUM,
  [LeaderboardErrorType.REDIS_ERROR]: ErrorSeverity.HIGH,
  [LeaderboardErrorType.PROFILE_SERVICE_ERROR]: ErrorSeverity.HIGH
};

/**
 * Interface for validation error metadata.
 * Used to provide structured validation error details.
 */
export interface ValidationErrorMetadata {
  field: string;
  value: any;
  constraints: Record<string, string>;
  children?: ValidationErrorMetadata[];
}

/**
 * Interface for resource not found error metadata.
 * Used to provide context about the missing resource.
 */
export interface NotFoundErrorMetadata {
  resourceType: string;
  resourceId: string;
  searchCriteria?: Record<string, any>;
}

/**
 * Interface for database error metadata.
 * Used to provide context about database operation failures.
 */
export interface DatabaseErrorMetadata {
  operation: 'create' | 'read' | 'update' | 'delete' | 'query' | 'transaction';
  entityType: string;
  errorCode?: string;
  queryDetails?: Record<string, any>;
  transactionId?: string;
}

/**
 * Interface for event processing error metadata.
 * Used to provide context about event processing failures.
 */
export interface EventProcessingErrorMetadata {
  eventType: string;
  eventId: string;
  userId?: string;
  journeyType?: string;
  processingStage: 'validation' | 'processing' | 'persistence' | 'notification';
  retryCount?: number;
  isRetryable: boolean;
  payload?: Record<string, any>;
}

/**
 * Interface for external service error metadata.
 * Used to provide context about external service integration failures.
 */
export interface ExternalServiceErrorMetadata {
  serviceName: string;
  operation: string;
  endpoint?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;
  isRetryable: boolean;
  circuitBreakerStatus?: 'open' | 'closed' | 'half-open';
  requestId?: string;
}

/**
 * Interface for Kafka error metadata.
 * Used to provide context about Kafka-related failures.
 */
export interface KafkaErrorMetadata {
  operation: 'produce' | 'consume' | 'connect' | 'disconnect' | 'admin';
  topic?: string;
  partition?: number;
  offset?: number;
  errorCode?: number;
  errorMessage?: string;
  retryCount?: number;
  isRetryable: boolean;
  clientId?: string;
  groupId?: string;
}

/**
 * Interface for Redis error metadata.
 * Used to provide context about Redis-related failures.
 */
export interface RedisErrorMetadata {
  operation: 'get' | 'set' | 'delete' | 'update' | 'connect' | 'disconnect' | 'pipeline' | 'transaction';
  key?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;
  isRetryable: boolean;
  connectionId?: string;
}

/**
 * Interface for authentication error metadata.
 * Used to provide context about authentication failures.
 */
export interface AuthenticationErrorMetadata {
  userId?: string;
  tokenType?: 'access' | 'refresh';
  reason: 'invalid' | 'expired' | 'revoked' | 'missing' | 'malformed';
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface for authorization error metadata.
 * Used to provide context about authorization failures.
 */
export interface AuthorizationErrorMetadata {
  userId?: string;
  resourceType: string;
  resourceId?: string;
  requiredPermission: string;
  userPermissions?: string[];
  userRoles?: string[];
}

/**
 * Interface for concurrency error metadata.
 * Used to provide context about concurrent modification issues.
 */
export interface ConcurrencyErrorMetadata {
  resourceType: string;
  resourceId: string;
  expectedVersion: number;
  actualVersion: number;
  operation: 'update' | 'delete';
  conflictingUser?: string;
  timestamp?: string;
}

/**
 * Interface for timeout error metadata.
 * Used to provide context about operation timeouts.
 */
export interface TimeoutErrorMetadata {
  operation: string;
  resourceType?: string;
  resourceId?: string;
  timeoutMs: number;
  elapsedMs: number;
  isRetryable: boolean;
}

/**
 * Interface for rule evaluation error metadata.
 * Used to provide context about rule evaluation failures.
 */
export interface RuleEvaluationErrorMetadata {
  ruleId: string;
  ruleName?: string;
  conditionExpression?: string;
  inputData?: Record<string, any>;
  evaluationStage: 'parsing' | 'execution' | 'validation';
  errorDetails?: string;
}

/**
 * Interface for leaderboard calculation error metadata.
 * Used to provide context about leaderboard calculation failures.
 */
export interface LeaderboardCalculationErrorMetadata {
  leaderboardId: string;
  leaderboardType: string;
  timeRange?: string;
  calculationStage: 'aggregation' | 'sorting' | 'ranking' | 'persistence';
  affectedUsers?: number;
  errorDetails?: string;
}

/**
 * Determines if an error is retryable based on its type.
 * Used for implementing retry policies for transient errors.
 * 
 * @param errorType - The type of error
 * @returns True if the error is potentially recoverable with a retry, false otherwise
 */
export function isRetryableError(errorType: string): boolean {
  // Check if the error type contains indicators of transient issues
  return (
    errorType.includes('TEMPORARY') ||
    errorType.includes('TIMEOUT') ||
    errorType.includes('CONCURRENCY') ||
    errorType.includes('CONNECTION') ||
    // Some external dependency errors may be retryable
    (errorType.includes('KAFKA') && !errorType.includes('TOPIC')) ||
    (errorType.includes('REDIS') && !errorType.includes('KEY')) ||
    errorType.includes('SERVICE_ERROR')
  );
}

/**
 * Determines if an error is a client error (4xx).
 * Used for error classification and handling.
 * 
 * @param errorType - The type of error
 * @returns True if the error is a client error, false otherwise
 */
export function isClientError(errorType: string): boolean {
  return (
    errorType.includes('VALIDATION') ||
    errorType.includes('NOT_FOUND') ||
    errorType.includes('DUPLICATE') ||
    errorType.includes('UNAUTHORIZED') ||
    errorType.includes('FORBIDDEN') ||
    errorType.includes('INSUFFICIENT') ||
    errorType.includes('ALREADY_') ||
    errorType.includes('EXPIRED') ||
    errorType.includes('PREREQUISITES') ||
    errorType.includes('INVALID_CONDITION') ||
    errorType.includes('CIRCULAR') ||
    errorType.includes('SCHEMA') ||
    errorType.includes('UNSUPPORTED')
  );
}

/**
 * Determines if an error is a system error (5xx).
 * Used for error classification and handling.
 * 
 * @param errorType - The type of error
 * @returns True if the error is a system error, false otherwise
 */
export function isSystemError(errorType: string): boolean {
  return (
    errorType.includes('DATABASE') ||
    errorType.includes('INTERNAL') ||
    errorType.includes('CONFIGURATION') ||
    errorType.includes('PROCESSING') ||
    errorType.includes('PERSISTENCE') ||
    errorType.includes('EVALUATION') ||
    errorType.includes('CALCULATION')
  );
}

/**
 * Determines if an error is an external dependency error.
 * Used for error classification and handling.
 * 
 * @param errorType - The type of error
 * @returns True if the error is an external dependency error, false otherwise
 */
export function isExternalDependencyError(errorType: string): boolean {
  return (
    errorType.includes('SERVICE_ERROR') ||
    errorType.includes('KAFKA') ||
    errorType.includes('REDIS') ||
    errorType.includes('EXTERNAL')
  );
}

/**
 * Gets the appropriate error severity based on error type.
 * 
 * @param errorType - The type of error
 * @returns The error severity level
 */
export function getErrorSeverity(errorType: string): ErrorSeverity {
  return ErrorSeverityMap[errorType] || ErrorSeverity.MEDIUM;
}

/**
 * Gets the appropriate HTTP status code based on error type.
 * 
 * @param errorType - The type of error
 * @returns The HTTP status code
 */
export function getHttpStatusForError(errorType: string): HttpStatus {
  return ErrorStatusMap[errorType] || HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Gets the standardized error code based on error type.
 * 
 * @param errorType - The type of error
 * @returns The standardized error code
 */
export function getErrorCode(errorType: string): string {
  return ErrorCodeMap[errorType] || 'GAM-500';
}

/**
 * Gets the default error message based on error type.
 * 
 * @param errorType - The type of error
 * @returns The default error message
 */
export function getDefaultErrorMessage(errorType: string): string {
  return ErrorMessageMap[errorType] || 'An unexpected error occurred in the gamification engine.';
}
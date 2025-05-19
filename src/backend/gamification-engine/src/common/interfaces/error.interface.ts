/**
 * @file error.interface.ts
 * @description Defines standardized error interfaces used throughout the gamification engine
 * for consistent error handling and reporting. These interfaces ensure uniform error handling
 * across all modules, improving debugging and client-side error messaging.
 */

import { HttpStatus } from '@nestjs/common';
import { JourneyType } from './journey.interface';

/**
 * Error types for classification of errors in the gamification engine.
 * Aligns with the broader error classification system in @austa/errors.
 */
export enum ErrorType {
  VALIDATION = 'validation',   // Client-side validation errors (400)
  BUSINESS = 'business',      // Business rule violations (400, 409, etc.)
  TECHNICAL = 'technical',    // System/internal errors (500)
  EXTERNAL = 'external',      // External dependency errors (502, 503, etc.)
  UNAUTHORIZED = 'unauthorized', // Authentication/authorization errors (401, 403)
  NOT_FOUND = 'not_found',    // Resource not found errors (404)
  TIMEOUT = 'timeout',        // Request timeout errors (408, 504)
  TRANSIENT = 'transient'     // Temporary errors that can be retried
}

/**
 * Gamification-specific error codes enum.
 * These codes are prefixed with 'GAMIFICATION_' to distinguish them
 * from other error codes in the system.
 */
export enum GamificationErrorCode {
  // Achievement errors
  ACHIEVEMENT_NOT_FOUND = 'GAMIFICATION_ACHIEVEMENT_NOT_FOUND',
  ACHIEVEMENT_ALREADY_EXISTS = 'GAMIFICATION_ACHIEVEMENT_ALREADY_EXISTS',
  ACHIEVEMENT_VALIDATION_FAILED = 'GAMIFICATION_ACHIEVEMENT_VALIDATION_FAILED',
  ACHIEVEMENT_PROCESSING_FAILED = 'GAMIFICATION_ACHIEVEMENT_PROCESSING_FAILED',
  
  // Event errors
  EVENT_VALIDATION_FAILED = 'GAMIFICATION_EVENT_VALIDATION_FAILED',
  EVENT_PROCESSING_FAILED = 'GAMIFICATION_EVENT_PROCESSING_FAILED',
  EVENT_SCHEMA_INVALID = 'GAMIFICATION_EVENT_SCHEMA_INVALID',
  EVENT_DUPLICATE = 'GAMIFICATION_EVENT_DUPLICATE',
  
  // Quest errors
  QUEST_NOT_FOUND = 'GAMIFICATION_QUEST_NOT_FOUND',
  QUEST_ALREADY_EXISTS = 'GAMIFICATION_QUEST_ALREADY_EXISTS',
  QUEST_VALIDATION_FAILED = 'GAMIFICATION_QUEST_VALIDATION_FAILED',
  QUEST_EXPIRED = 'GAMIFICATION_QUEST_EXPIRED',
  
  // Reward errors
  REWARD_NOT_FOUND = 'GAMIFICATION_REWARD_NOT_FOUND',
  REWARD_ALREADY_EXISTS = 'GAMIFICATION_REWARD_ALREADY_EXISTS',
  REWARD_VALIDATION_FAILED = 'GAMIFICATION_REWARD_VALIDATION_FAILED',
  REWARD_UNAVAILABLE = 'GAMIFICATION_REWARD_UNAVAILABLE',
  
  // Rule errors
  RULE_NOT_FOUND = 'GAMIFICATION_RULE_NOT_FOUND',
  RULE_ALREADY_EXISTS = 'GAMIFICATION_RULE_ALREADY_EXISTS',
  RULE_VALIDATION_FAILED = 'GAMIFICATION_RULE_VALIDATION_FAILED',
  RULE_EXECUTION_FAILED = 'GAMIFICATION_RULE_EXECUTION_FAILED',
  
  // Profile errors
  PROFILE_NOT_FOUND = 'GAMIFICATION_PROFILE_NOT_FOUND',
  PROFILE_ALREADY_EXISTS = 'GAMIFICATION_PROFILE_ALREADY_EXISTS',
  PROFILE_VALIDATION_FAILED = 'GAMIFICATION_PROFILE_VALIDATION_FAILED',
  
  // Leaderboard errors
  LEADERBOARD_NOT_FOUND = 'GAMIFICATION_LEADERBOARD_NOT_FOUND',
  LEADERBOARD_VALIDATION_FAILED = 'GAMIFICATION_LEADERBOARD_VALIDATION_FAILED',
  
  // External dependency errors
  KAFKA_CONNECTION_FAILED = 'GAMIFICATION_KAFKA_CONNECTION_FAILED',
  KAFKA_PUBLISH_FAILED = 'GAMIFICATION_KAFKA_PUBLISH_FAILED',
  KAFKA_CONSUME_FAILED = 'GAMIFICATION_KAFKA_CONSUME_FAILED',
  DATABASE_CONNECTION_FAILED = 'GAMIFICATION_DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED = 'GAMIFICATION_DATABASE_QUERY_FAILED',
  REDIS_CONNECTION_FAILED = 'GAMIFICATION_REDIS_CONNECTION_FAILED',
  EXTERNAL_SERVICE_UNAVAILABLE = 'GAMIFICATION_EXTERNAL_SERVICE_UNAVAILABLE',
  
  // General errors
  UNAUTHORIZED_ACCESS = 'GAMIFICATION_UNAUTHORIZED_ACCESS',
  FORBIDDEN_ACCESS = 'GAMIFICATION_FORBIDDEN_ACCESS',
  INTERNAL_SERVER_ERROR = 'GAMIFICATION_INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'GAMIFICATION_BAD_REQUEST',
  TIMEOUT = 'GAMIFICATION_TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'GAMIFICATION_RATE_LIMIT_EXCEEDED'
}

/**
 * Maps error types to HTTP status codes for consistent API responses.
 */
export const ERROR_TYPE_TO_HTTP_STATUS: Record<ErrorType, HttpStatus> = {
  [ErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
  [ErrorType.BUSINESS]: HttpStatus.BAD_REQUEST,
  [ErrorType.TECHNICAL]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorType.EXTERNAL]: HttpStatus.BAD_GATEWAY,
  [ErrorType.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [ErrorType.TRANSIENT]: HttpStatus.SERVICE_UNAVAILABLE
};

/**
 * Interface for error context data that provides additional information
 * about the error for debugging and client-side messaging.
 */
export interface IErrorContext {
  /** The source module or component where the error occurred */
  source?: string;
  
  /** The operation that was being performed when the error occurred */
  operation?: string;
  
  /** The journey context in which the error occurred */
  journey?: JourneyType;
  
  /** The user ID associated with the error, if applicable */
  userId?: string;
  
  /** The request ID associated with the error for tracing */
  requestId?: string;
  
  /** The timestamp when the error occurred */
  timestamp?: Date | string;
  
  /** Additional metadata specific to the error type */
  metadata?: Record<string, any>;
  
  /** The original error that caused this error, if applicable */
  cause?: Error | unknown;
  
  /** Stack trace for debugging (not included in client responses) */
  stack?: string;
  
  /** For transient errors, the number of retry attempts made */
  retryAttempts?: number;
  
  /** For transient errors, the maximum number of retry attempts allowed */
  maxRetryAttempts?: number;
  
  /** For rate-limited errors, the time to wait before retrying */
  retryAfter?: number;
  
  /** For circuit breaker pattern, the circuit state */
  circuitState?: 'closed' | 'open' | 'half-open';
}

/**
 * Interface for standardized error responses returned to clients.
 * This ensures consistent error structure across all API endpoints.
 */
export interface IErrorResponse {
  /** Unique error code for identifying the error type */
  code: GamificationErrorCode | string;
  
  /** Human-readable error message */
  message: string;
  
  /** Error type for classification */
  type: ErrorType;
  
  /** HTTP status code */
  status: HttpStatus;
  
  /** Additional context data for debugging and client guidance */
  context?: Omit<IErrorContext, 'stack' | 'cause'>;
  
  /** For validation errors, field-specific error details */
  details?: Record<string, string[]>;
  
  /** For client errors, guidance on how to resolve the issue */
  resolution?: string;
}

/**
 * Interface for error serialization options to control
 * what information is included in serialized errors.
 */
export interface IErrorSerializationOptions {
  /** Whether to include stack traces */
  includeStack?: boolean;
  
  /** Whether to include the original error cause */
  includeCause?: boolean;
  
  /** Whether to include sensitive data in the error context */
  includeSensitiveData?: boolean;
  
  /** Whether to include detailed error context */
  includeContext?: boolean;
  
  /** Whether to include resolution guidance */
  includeResolution?: boolean;
}

/**
 * Interface for retry policy configuration used with transient errors.
 */
export interface IRetryPolicy {
  /** Maximum number of retry attempts */
  maxRetryAttempts: number;
  
  /** Base delay in milliseconds between retry attempts */
  baseDelayMs: number;
  
  /** Maximum delay in milliseconds between retry attempts */
  maxDelayMs: number;
  
  /** Jitter factor to add randomness to retry delays (0-1) */
  jitterFactor: number;
  
  /** Whether to use exponential backoff for retry delays */
  useExponentialBackoff: boolean;
}

/**
 * Default retry policy for transient errors in the gamification engine.
 */
export const DEFAULT_RETRY_POLICY: IRetryPolicy = {
  maxRetryAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  jitterFactor: 0.3,
  useExponentialBackoff: true
};

/**
 * Interface for circuit breaker configuration used with external dependencies.
 */
export interface ICircuitBreakerConfig {
  /** Failure threshold before opening the circuit */
  failureThreshold: number;
  
  /** Success threshold in half-open state to close the circuit */
  successThreshold: number;
  
  /** Timeout in milliseconds before transitioning from open to half-open */
  resetTimeoutMs: number;
  
  /** Time window in milliseconds for tracking failures */
  failureWindowMs: number;
}

/**
 * Default circuit breaker configuration for external dependencies.
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: ICircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeoutMs: 30000,
  failureWindowMs: 60000
};

/**
 * Type guard to check if an error is a specific error type.
 */
export function isErrorType(error: any, type: ErrorType): boolean {
  return error && error.type === type;
}

/**
 * Type guard to check if an error has a specific error code.
 */
export function hasErrorCode(error: any, code: GamificationErrorCode | string): boolean {
  return error && error.code === code;
}

/**
 * Type guard to check if an error is a transient error that can be retried.
 */
export function isTransientError(error: any): boolean {
  return isErrorType(error, ErrorType.TRANSIENT) || 
         hasErrorCode(error, GamificationErrorCode.KAFKA_CONNECTION_FAILED) ||
         hasErrorCode(error, GamificationErrorCode.DATABASE_CONNECTION_FAILED) ||
         hasErrorCode(error, GamificationErrorCode.REDIS_CONNECTION_FAILED) ||
         hasErrorCode(error, GamificationErrorCode.EXTERNAL_SERVICE_UNAVAILABLE) ||
         hasErrorCode(error, GamificationErrorCode.TIMEOUT);
}

/**
 * Type guard to check if an error is related to a specific journey.
 */
export function isJourneyError(error: any, journey: JourneyType): boolean {
  return error && error.context && error.context.journey === journey;
}
/**
 * Enum defining all error types in the gamification engine.
 * Used for consistent error classification and handling across the application.
 */
export enum ErrorType {
  // General error types
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  BAD_REQUEST_ERROR = 'BAD_REQUEST_ERROR',
  
  // System error types
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Database error types
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  SCHEMA_ERROR = 'SCHEMA_ERROR',
  
  // External dependency error types
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  API_ERROR = 'API_ERROR',
  
  // Event processing error types
  EVENT_PROCESSING_ERROR = 'EVENT_PROCESSING_ERROR',
  EVENT_VALIDATION_ERROR = 'EVENT_VALIDATION_ERROR',
  EVENT_PUBLISHING_ERROR = 'EVENT_PUBLISHING_ERROR',
  EVENT_CONSUMPTION_ERROR = 'EVENT_CONSUMPTION_ERROR',
  
  // Gamification domain error types
  ACHIEVEMENT_ERROR = 'ACHIEVEMENT_ERROR',
  QUEST_ERROR = 'QUEST_ERROR',
  REWARD_ERROR = 'REWARD_ERROR',
  RULE_ERROR = 'RULE_ERROR',
  PROFILE_ERROR = 'PROFILE_ERROR',
  LEADERBOARD_ERROR = 'LEADERBOARD_ERROR',
  
  // Journey-specific error types
  HEALTH_JOURNEY_ERROR = 'HEALTH_JOURNEY_ERROR',
  CARE_JOURNEY_ERROR = 'CARE_JOURNEY_ERROR',
  PLAN_JOURNEY_ERROR = 'PLAN_JOURNEY_ERROR',
}

/**
 * Interface for error metadata that provides additional context
 * about an error for logging, monitoring, and debugging purposes.
 */
export interface ErrorMetadata {
  [key: string]: any;
}

/**
 * Interface for error context that provides information about
 * the environment and state when an error occurred.
 */
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  journeyType?: 'HEALTH' | 'CARE' | 'PLAN';
  timestamp?: Date;
  source?: string;
  [key: string]: any;
}

/**
 * Enum defining HTTP status codes for error responses.
 * Used to map internal error types to appropriate HTTP status codes.
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Maps error types to appropriate HTTP status codes.
 * Used for consistent HTTP response generation across the API surface.
 */
export const errorTypeToStatusCode: Record<ErrorType, HttpStatusCode> = {
  // Client errors (4xx)
  [ErrorType.VALIDATION_ERROR]: HttpStatusCode.BAD_REQUEST,
  [ErrorType.BAD_REQUEST_ERROR]: HttpStatusCode.BAD_REQUEST,
  [ErrorType.AUTHENTICATION_ERROR]: HttpStatusCode.UNAUTHORIZED,
  [ErrorType.AUTHORIZATION_ERROR]: HttpStatusCode.FORBIDDEN,
  [ErrorType.NOT_FOUND_ERROR]: HttpStatusCode.NOT_FOUND,
  [ErrorType.CONFLICT_ERROR]: HttpStatusCode.CONFLICT,
  [ErrorType.EVENT_VALIDATION_ERROR]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  
  // System errors (5xx)
  [ErrorType.INTERNAL_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.CRITICAL_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.INITIALIZATION_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.CONFIGURATION_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.UNKNOWN_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  
  // Database errors (mostly 5xx)
  [ErrorType.DATABASE_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.CONNECTION_ERROR]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ErrorType.QUERY_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.TRANSACTION_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.CONSTRAINT_VIOLATION]: HttpStatusCode.BAD_REQUEST, // 4xx for constraint violations
  [ErrorType.RESOURCE_NOT_FOUND]: HttpStatusCode.NOT_FOUND, // 4xx for not found resources
  [ErrorType.SCHEMA_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  
  // External dependency errors
  [ErrorType.EXTERNAL_SERVICE_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ErrorType.NETWORK_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ErrorType.TIMEOUT_ERROR]: HttpStatusCode.GATEWAY_TIMEOUT,
  [ErrorType.API_ERROR]: HttpStatusCode.BAD_GATEWAY,
  
  // Event processing errors
  [ErrorType.EVENT_PROCESSING_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.EVENT_PUBLISHING_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.EVENT_CONSUMPTION_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  
  // Gamification domain errors (mix of 4xx and 5xx depending on context)
  [ErrorType.ACHIEVEMENT_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.QUEST_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.REWARD_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.RULE_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.PROFILE_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.LEADERBOARD_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  
  // Journey-specific errors
  [ErrorType.HEALTH_JOURNEY_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.CARE_JOURNEY_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.PLAN_JOURNEY_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
};

/**
 * Determines if an error type is transient and can be retried.
 * Used for implementing retry mechanisms with exponential backoff.
 */
export const isTransientError = (errorType: ErrorType): boolean => {
  return [
    ErrorType.CONNECTION_ERROR,
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.EVENT_PUBLISHING_ERROR,
    ErrorType.EVENT_CONSUMPTION_ERROR,
  ].includes(errorType);
};

/**
 * Determines if an error type is critical and requires immediate attention.
 * Used for alerting and monitoring purposes.
 */
export const isCriticalError = (errorType: ErrorType): boolean => {
  return [
    ErrorType.CRITICAL_ERROR,
    ErrorType.INITIALIZATION_ERROR,
    ErrorType.CONFIGURATION_ERROR,
  ].includes(errorType);
};
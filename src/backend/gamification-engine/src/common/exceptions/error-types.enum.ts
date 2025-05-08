/**
 * @file error-types.enum.ts
 * @description Defines comprehensive error type enumerations and interfaces for the entire gamification engine.
 * Contains error codes, categories, and standardized metadata structures that ensure consistent error
 * classification across all modules.
 */

/**
 * Main error categories used for classification and handling strategies
 */
export enum ErrorCategory {
  CLIENT = 'CLIENT',           // 4xx errors - client-side issues
  SYSTEM = 'SYSTEM',           // 5xx errors - server-side issues
  TRANSIENT = 'TRANSIENT',     // Temporary errors that can be retried
  EXTERNAL = 'EXTERNAL'        // Errors from external dependencies
}

/**
 * Error severity levels for monitoring, alerting and reporting
 */
export enum ErrorSeverity {
  DEBUG = 'DEBUG',         // Low severity, primarily for debugging
  INFO = 'INFO',           // Informational, no action needed
  WARNING = 'WARNING',     // Potential issue, may need attention
  ERROR = 'ERROR',         // Significant error, requires attention
  CRITICAL = 'CRITICAL'    // Severe error, immediate attention required
}

/**
 * Domain prefixes for error codes to identify the source module
 */
export enum ErrorDomain {
  GENERAL = 'GEN',         // General application errors
  ACHIEVEMENT = 'ACH',     // Achievement-related errors
  EVENT = 'EVT',           // Event processing errors
  QUEST = 'QST',           // Quest-related errors
  REWARD = 'RWD',          // Reward-related errors
  RULE = 'RUL',            // Rule evaluation errors
  PROFILE = 'PRF',         // User profile errors
  LEADERBOARD = 'LDB',     // Leaderboard-related errors
  DATABASE = 'DB',         // Database operation errors
  KAFKA = 'KFK',           // Kafka messaging errors
  AUTH = 'AUTH',           // Authentication/authorization errors
  VALIDATION = 'VAL'       // Input validation errors
}

/**
 * Specific error types for client errors (4xx)
 */
export enum ClientErrorType {
  // General client errors
  BAD_REQUEST = 'BAD_REQUEST',                     // 400 - Invalid request format or parameters
  UNAUTHORIZED = 'UNAUTHORIZED',                   // 401 - Authentication required
  FORBIDDEN = 'FORBIDDEN',                         // 403 - Permission denied
  NOT_FOUND = 'NOT_FOUND',                         // 404 - Resource not found
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',       // 405 - HTTP method not allowed
  CONFLICT = 'CONFLICT',                           // 409 - Resource conflict
  GONE = 'GONE',                                   // 410 - Resource no longer available
  PRECONDITION_FAILED = 'PRECONDITION_FAILED',     // 412 - Precondition not met
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',         // 413 - Request entity too large
  UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE', // 415 - Unsupported content type
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',         // 429 - Rate limit exceeded
  
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',                 // Invalid input data
  INVALID_FORMAT = 'INVALID_FORMAT',               // Invalid data format
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD', // Required field missing
  INVALID_ENUM_VALUE = 'INVALID_ENUM_VALUE',       // Invalid enum value
  INVALID_DATE = 'INVALID_DATE',                   // Invalid date format or value
  INVALID_NUMERIC_VALUE = 'INVALID_NUMERIC_VALUE', // Invalid numeric value
  
  // Domain-specific client errors
  ACHIEVEMENT_NOT_FOUND = 'ACHIEVEMENT_NOT_FOUND',       // Achievement not found
  USER_ACHIEVEMENT_NOT_FOUND = 'USER_ACHIEVEMENT_NOT_FOUND', // User achievement not found
  QUEST_NOT_FOUND = 'QUEST_NOT_FOUND',                 // Quest not found
  USER_QUEST_NOT_FOUND = 'USER_QUEST_NOT_FOUND',       // User quest not found
  REWARD_NOT_FOUND = 'REWARD_NOT_FOUND',               // Reward not found
  USER_REWARD_NOT_FOUND = 'USER_REWARD_NOT_FOUND',     // User reward not found
  RULE_NOT_FOUND = 'RULE_NOT_FOUND',                   // Rule not found
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',             // User profile not found
  LEADERBOARD_NOT_FOUND = 'LEADERBOARD_NOT_FOUND',     // Leaderboard not found
  
  // Authentication/authorization errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',         // Invalid username/password
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',                     // JWT token expired
  INVALID_TOKEN = 'INVALID_TOKEN',                     // Invalid JWT token
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS', // Insufficient permissions
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',                   // User account locked
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',               // User account disabled
  
  // Business logic errors
  ALREADY_COMPLETED = 'ALREADY_COMPLETED',             // Achievement/quest already completed
  PREREQUISITES_NOT_MET = 'PREREQUISITES_NOT_MET',     // Prerequisites not met
  REWARD_ALREADY_CLAIMED = 'REWARD_ALREADY_CLAIMED',   // Reward already claimed
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',         // Insufficient points for action
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',                 // Duplicate entry detected
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION' // Invalid state transition
}

/**
 * Specific error types for system errors (5xx)
 */
export enum SystemErrorType {
  // General system errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',     // 500 - Unhandled server error
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',                 // 501 - Feature not implemented
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',         // 503 - Service temporarily unavailable
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',                 // 504 - Gateway timeout
  
  // Database errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR', // Database connection failed
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',           // Database query failed
  DATABASE_TRANSACTION_ERROR = 'DATABASE_TRANSACTION_ERROR', // Transaction failed
  DATABASE_CONSTRAINT_ERROR = 'DATABASE_CONSTRAINT_ERROR',   // Constraint violation
  DATABASE_DEADLOCK_ERROR = 'DATABASE_DEADLOCK_ERROR',       // Deadlock detected
  DATABASE_TIMEOUT_ERROR = 'DATABASE_TIMEOUT_ERROR',         // Query timeout
  
  // Cache errors
  CACHE_CONNECTION_ERROR = 'CACHE_CONNECTION_ERROR',   // Cache connection failed
  CACHE_OPERATION_ERROR = 'CACHE_OPERATION_ERROR',     // Cache operation failed
  
  // Configuration errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',         // Configuration error
  ENVIRONMENT_ERROR = 'ENVIRONMENT_ERROR',             // Environment setup error
  
  // Domain-specific system errors
  EVENT_PROCESSING_ERROR = 'EVENT_PROCESSING_ERROR',   // Event processing failed
  RULE_EVALUATION_ERROR = 'RULE_EVALUATION_ERROR',     // Rule evaluation failed
  ACHIEVEMENT_PROCESSING_ERROR = 'ACHIEVEMENT_PROCESSING_ERROR', // Achievement processing failed
  QUEST_PROCESSING_ERROR = 'QUEST_PROCESSING_ERROR',   // Quest processing failed
  REWARD_PROCESSING_ERROR = 'REWARD_PROCESSING_ERROR', // Reward processing failed
  LEADERBOARD_UPDATE_ERROR = 'LEADERBOARD_UPDATE_ERROR', // Leaderboard update failed
  
  // Unexpected errors
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',               // Unexpected error
  UNHANDLED_EXCEPTION = 'UNHANDLED_EXCEPTION'          // Unhandled exception
}

/**
 * Specific error types for transient errors (retryable)
 */
export enum TransientErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',                     // Network connectivity issue
  CONNECTION_RESET = 'CONNECTION_RESET',               // Connection reset
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',           // Connection timeout
  DNS_RESOLUTION_ERROR = 'DNS_RESOLUTION_ERROR',       // DNS resolution failed
  
  // Resource contention
  RESOURCE_CONTENTION = 'RESOURCE_CONTENTION',         // Resource contention
  LOCK_ACQUISITION_FAILURE = 'LOCK_ACQUISITION_FAILURE', // Failed to acquire lock
  DEADLOCK_DETECTED = 'DEADLOCK_DETECTED',             // Deadlock detected
  
  // Temporary service issues
  SERVICE_OVERLOADED = 'SERVICE_OVERLOADED',           // Service overloaded
  RATE_LIMITED = 'RATE_LIMITED',                       // Rate limited by service
  TEMPORARY_OUTAGE = 'TEMPORARY_OUTAGE',               // Temporary service outage
  
  // Database transient issues
  DATABASE_CONNECTION_INTERRUPTED = 'DATABASE_CONNECTION_INTERRUPTED', // DB connection interrupted
  DATABASE_FAILOVER_IN_PROGRESS = 'DATABASE_FAILOVER_IN_PROGRESS',   // DB failover in progress
  DATABASE_THROTTLED = 'DATABASE_THROTTLED',           // DB throttled
  
  // Kafka transient issues
  KAFKA_TEMPORARY_ERROR = 'KAFKA_TEMPORARY_ERROR',     // Kafka temporary error
  KAFKA_REBALANCING = 'KAFKA_REBALANCING',             // Kafka consumer rebalancing
  KAFKA_BROKER_UNAVAILABLE = 'KAFKA_BROKER_UNAVAILABLE', // Kafka broker unavailable
  
  // Cache transient issues
  CACHE_TEMPORARY_ERROR = 'CACHE_TEMPORARY_ERROR',     // Cache temporary error
  CACHE_EVICTION = 'CACHE_EVICTION',                   // Cache entry evicted
  CACHE_REBALANCING = 'CACHE_REBALANCING'              // Cache rebalancing
}

/**
 * Specific error types for external dependency errors
 */
export enum ExternalErrorType {
  // External service errors
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE', // External service unavailable
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',         // External service timeout
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',             // External service error
  EXTERNAL_SERVICE_INVALID_RESPONSE = 'EXTERNAL_SERVICE_INVALID_RESPONSE', // Invalid response
  
  // Kafka errors
  KAFKA_PRODUCER_ERROR = 'KAFKA_PRODUCER_ERROR',       // Kafka producer error
  KAFKA_CONSUMER_ERROR = 'KAFKA_CONSUMER_ERROR',       // Kafka consumer error
  KAFKA_ADMIN_ERROR = 'KAFKA_ADMIN_ERROR',             // Kafka admin error
  KAFKA_SCHEMA_ERROR = 'KAFKA_SCHEMA_ERROR',           // Kafka schema error
  
  // Authentication service errors
  AUTH_SERVICE_ERROR = 'AUTH_SERVICE_ERROR',           // Auth service error
  AUTH_SERVICE_UNAVAILABLE = 'AUTH_SERVICE_UNAVAILABLE', // Auth service unavailable
  
  // Notification service errors
  NOTIFICATION_SERVICE_ERROR = 'NOTIFICATION_SERVICE_ERROR', // Notification service error
  NOTIFICATION_DELIVERY_FAILURE = 'NOTIFICATION_DELIVERY_FAILURE', // Notification delivery failed
  
  // Journey service errors
  HEALTH_SERVICE_ERROR = 'HEALTH_SERVICE_ERROR',       // Health service error
  CARE_SERVICE_ERROR = 'CARE_SERVICE_ERROR',           // Care service error
  PLAN_SERVICE_ERROR = 'PLAN_SERVICE_ERROR',           // Plan service error
  
  // Third-party API errors
  THIRD_PARTY_API_ERROR = 'THIRD_PARTY_API_ERROR',     // Third-party API error
  THIRD_PARTY_RATE_LIMIT = 'THIRD_PARTY_RATE_LIMIT',   // Third-party rate limit
  THIRD_PARTY_AUTH_ERROR = 'THIRD_PARTY_AUTH_ERROR'    // Third-party auth error
}

/**
 * Combined error type enum for use with AppExceptionBase
 * This combines all specific error types into a single enum for easier reference
 */
export enum ErrorType {
  // Client error types
  BAD_REQUEST = ClientErrorType.BAD_REQUEST,
  UNAUTHORIZED = ClientErrorType.UNAUTHORIZED,
  FORBIDDEN = ClientErrorType.FORBIDDEN,
  NOT_FOUND = ClientErrorType.NOT_FOUND,
  METHOD_NOT_ALLOWED = ClientErrorType.METHOD_NOT_ALLOWED,
  CONFLICT = ClientErrorType.CONFLICT,
  GONE = ClientErrorType.GONE,
  PRECONDITION_FAILED = ClientErrorType.PRECONDITION_FAILED,
  PAYLOAD_TOO_LARGE = ClientErrorType.PAYLOAD_TOO_LARGE,
  UNSUPPORTED_MEDIA_TYPE = ClientErrorType.UNSUPPORTED_MEDIA_TYPE,
  TOO_MANY_REQUESTS = ClientErrorType.TOO_MANY_REQUESTS,
  INVALID_INPUT = ClientErrorType.INVALID_INPUT,
  INVALID_FORMAT = ClientErrorType.INVALID_FORMAT,
  MISSING_REQUIRED_FIELD = ClientErrorType.MISSING_REQUIRED_FIELD,
  INVALID_ENUM_VALUE = ClientErrorType.INVALID_ENUM_VALUE,
  INVALID_DATE = ClientErrorType.INVALID_DATE,
  INVALID_NUMERIC_VALUE = ClientErrorType.INVALID_NUMERIC_VALUE,
  ACHIEVEMENT_NOT_FOUND = ClientErrorType.ACHIEVEMENT_NOT_FOUND,
  USER_ACHIEVEMENT_NOT_FOUND = ClientErrorType.USER_ACHIEVEMENT_NOT_FOUND,
  QUEST_NOT_FOUND = ClientErrorType.QUEST_NOT_FOUND,
  USER_QUEST_NOT_FOUND = ClientErrorType.USER_QUEST_NOT_FOUND,
  REWARD_NOT_FOUND = ClientErrorType.REWARD_NOT_FOUND,
  USER_REWARD_NOT_FOUND = ClientErrorType.USER_REWARD_NOT_FOUND,
  RULE_NOT_FOUND = ClientErrorType.RULE_NOT_FOUND,
  PROFILE_NOT_FOUND = ClientErrorType.PROFILE_NOT_FOUND,
  LEADERBOARD_NOT_FOUND = ClientErrorType.LEADERBOARD_NOT_FOUND,
  INVALID_CREDENTIALS = ClientErrorType.INVALID_CREDENTIALS,
  EXPIRED_TOKEN = ClientErrorType.EXPIRED_TOKEN,
  INVALID_TOKEN = ClientErrorType.INVALID_TOKEN,
  INSUFFICIENT_PERMISSIONS = ClientErrorType.INSUFFICIENT_PERMISSIONS,
  ACCOUNT_LOCKED = ClientErrorType.ACCOUNT_LOCKED,
  ACCOUNT_DISABLED = ClientErrorType.ACCOUNT_DISABLED,
  ALREADY_COMPLETED = ClientErrorType.ALREADY_COMPLETED,
  PREREQUISITES_NOT_MET = ClientErrorType.PREREQUISITES_NOT_MET,
  REWARD_ALREADY_CLAIMED = ClientErrorType.REWARD_ALREADY_CLAIMED,
  INSUFFICIENT_POINTS = ClientErrorType.INSUFFICIENT_POINTS,
  DUPLICATE_ENTRY = ClientErrorType.DUPLICATE_ENTRY,
  INVALID_STATE_TRANSITION = ClientErrorType.INVALID_STATE_TRANSITION,
  
  // System error types
  INTERNAL_SERVER_ERROR = SystemErrorType.INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED = SystemErrorType.NOT_IMPLEMENTED,
  SERVICE_UNAVAILABLE = SystemErrorType.SERVICE_UNAVAILABLE,
  GATEWAY_TIMEOUT = SystemErrorType.GATEWAY_TIMEOUT,
  DATABASE_CONNECTION_ERROR = SystemErrorType.DATABASE_CONNECTION_ERROR,
  DATABASE_QUERY_ERROR = SystemErrorType.DATABASE_QUERY_ERROR,
  DATABASE_TRANSACTION_ERROR = SystemErrorType.DATABASE_TRANSACTION_ERROR,
  DATABASE_CONSTRAINT_ERROR = SystemErrorType.DATABASE_CONSTRAINT_ERROR,
  DATABASE_DEADLOCK_ERROR = SystemErrorType.DATABASE_DEADLOCK_ERROR,
  DATABASE_TIMEOUT_ERROR = SystemErrorType.DATABASE_TIMEOUT_ERROR,
  CACHE_CONNECTION_ERROR = SystemErrorType.CACHE_CONNECTION_ERROR,
  CACHE_OPERATION_ERROR = SystemErrorType.CACHE_OPERATION_ERROR,
  CONFIGURATION_ERROR = SystemErrorType.CONFIGURATION_ERROR,
  ENVIRONMENT_ERROR = SystemErrorType.ENVIRONMENT_ERROR,
  EVENT_PROCESSING_ERROR = SystemErrorType.EVENT_PROCESSING_ERROR,
  RULE_EVALUATION_ERROR = SystemErrorType.RULE_EVALUATION_ERROR,
  ACHIEVEMENT_PROCESSING_ERROR = SystemErrorType.ACHIEVEMENT_PROCESSING_ERROR,
  QUEST_PROCESSING_ERROR = SystemErrorType.QUEST_PROCESSING_ERROR,
  REWARD_PROCESSING_ERROR = SystemErrorType.REWARD_PROCESSING_ERROR,
  LEADERBOARD_UPDATE_ERROR = SystemErrorType.LEADERBOARD_UPDATE_ERROR,
  UNEXPECTED_ERROR = SystemErrorType.UNEXPECTED_ERROR,
  UNHANDLED_EXCEPTION = SystemErrorType.UNHANDLED_EXCEPTION,
  
  // Transient error types
  NETWORK_ERROR = TransientErrorType.NETWORK_ERROR,
  CONNECTION_RESET = TransientErrorType.CONNECTION_RESET,
  CONNECTION_TIMEOUT = TransientErrorType.CONNECTION_TIMEOUT,
  DNS_RESOLUTION_ERROR = TransientErrorType.DNS_RESOLUTION_ERROR,
  RESOURCE_CONTENTION = TransientErrorType.RESOURCE_CONTENTION,
  LOCK_ACQUISITION_FAILURE = TransientErrorType.LOCK_ACQUISITION_FAILURE,
  DEADLOCK_DETECTED = TransientErrorType.DEADLOCK_DETECTED,
  SERVICE_OVERLOADED = TransientErrorType.SERVICE_OVERLOADED,
  RATE_LIMITED = TransientErrorType.RATE_LIMITED,
  TEMPORARY_OUTAGE = TransientErrorType.TEMPORARY_OUTAGE,
  DATABASE_CONNECTION_INTERRUPTED = TransientErrorType.DATABASE_CONNECTION_INTERRUPTED,
  DATABASE_FAILOVER_IN_PROGRESS = TransientErrorType.DATABASE_FAILOVER_IN_PROGRESS,
  DATABASE_THROTTLED = TransientErrorType.DATABASE_THROTTLED,
  KAFKA_TEMPORARY_ERROR = TransientErrorType.KAFKA_TEMPORARY_ERROR,
  KAFKA_REBALANCING = TransientErrorType.KAFKA_REBALANCING,
  KAFKA_BROKER_UNAVAILABLE = TransientErrorType.KAFKA_BROKER_UNAVAILABLE,
  CACHE_TEMPORARY_ERROR = TransientErrorType.CACHE_TEMPORARY_ERROR,
  CACHE_EVICTION = TransientErrorType.CACHE_EVICTION,
  CACHE_REBALANCING = TransientErrorType.CACHE_REBALANCING,
  
  // External error types
  EXTERNAL_SERVICE_UNAVAILABLE = ExternalErrorType.EXTERNAL_SERVICE_UNAVAILABLE,
  EXTERNAL_SERVICE_TIMEOUT = ExternalErrorType.EXTERNAL_SERVICE_TIMEOUT,
  EXTERNAL_SERVICE_ERROR = ExternalErrorType.EXTERNAL_SERVICE_ERROR,
  EXTERNAL_SERVICE_INVALID_RESPONSE = ExternalErrorType.EXTERNAL_SERVICE_INVALID_RESPONSE,
  KAFKA_PRODUCER_ERROR = ExternalErrorType.KAFKA_PRODUCER_ERROR,
  KAFKA_CONSUMER_ERROR = ExternalErrorType.KAFKA_CONSUMER_ERROR,
  KAFKA_ADMIN_ERROR = ExternalErrorType.KAFKA_ADMIN_ERROR,
  KAFKA_SCHEMA_ERROR = ExternalErrorType.KAFKA_SCHEMA_ERROR,
  AUTH_SERVICE_ERROR = ExternalErrorType.AUTH_SERVICE_ERROR,
  AUTH_SERVICE_UNAVAILABLE = ExternalErrorType.AUTH_SERVICE_UNAVAILABLE,
  NOTIFICATION_SERVICE_ERROR = ExternalErrorType.NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_DELIVERY_FAILURE = ExternalErrorType.NOTIFICATION_DELIVERY_FAILURE,
  HEALTH_SERVICE_ERROR = ExternalErrorType.HEALTH_SERVICE_ERROR,
  CARE_SERVICE_ERROR = ExternalErrorType.CARE_SERVICE_ERROR,
  PLAN_SERVICE_ERROR = ExternalErrorType.PLAN_SERVICE_ERROR,
  THIRD_PARTY_API_ERROR = ExternalErrorType.THIRD_PARTY_API_ERROR,
  THIRD_PARTY_RATE_LIMIT = ExternalErrorType.THIRD_PARTY_RATE_LIMIT,
  THIRD_PARTY_AUTH_ERROR = ExternalErrorType.THIRD_PARTY_AUTH_ERROR
}

/**
 * Interface for error metadata common to all error types
 */
export interface ErrorMetadata {
  [key: string]: any;          // Allow any additional metadata properties
  timestamp?: Date;            // When the error occurred
  correlationId?: string;      // For tracking related errors
  requestId?: string;          // Associated request ID
  userId?: string;             // User who experienced the error
  journeyType?: string;        // Health, Care, or Plan journey
  source?: string;             // Source module/component
  stackTrace?: string;         // Stack trace (for system errors)
}

/**
 * Interface for error context information
 */
export interface ErrorContext {
  [key: string]: any;          // Allow any context properties
  module?: string;             // Module where the error occurred
  method?: string;             // Method where the error occurred
  path?: string;               // API path or resource path
  params?: Record<string, any>; // Parameters at the time of error
  query?: Record<string, any>;  // Query parameters
  body?: Record<string, any>;   // Request body (sanitized)
  headers?: Record<string, string>; // Request headers (sanitized)
  user?: {                     // User context
    id?: string;               // User ID
    roles?: string[];          // User roles
  };
  journey?: {                  // Journey context
    type?: string;             // Journey type (Health, Care, Plan)
    step?: string;             // Current journey step
  };
}

/**
 * Interface for client error specific metadata
 */
export interface ClientErrorMetadata extends ErrorMetadata {
  validationErrors?: Record<string, string[]>; // Field-specific validation errors
  requestParams?: Record<string, any>;         // Request parameters (sanitized)
  suggestedAction?: string;                    // Suggested action for the client
}

/**
 * Interface for system error specific metadata
 */
export interface SystemErrorMetadata extends ErrorMetadata {
  component?: string;           // Specific component that failed
  exception?: string;           // Exception type/name
  affectedServices?: string[];  // Other services affected
  recoveryAttempted?: boolean;  // Whether recovery was attempted
  memoryUsage?: number;         // Memory usage at time of error
  cpuUsage?: number;            // CPU usage at time of error
}

/**
 * Interface for transient error specific metadata
 */
export interface TransientErrorMetadata extends ErrorMetadata {
  retryCount: number;           // Current retry attempt
  maxRetries: number;           // Maximum retry attempts
  backoffMs: number;            // Current backoff time in ms
  retryable: boolean;           // Whether error is still retryable
  lastRetryTimestamp?: Date;    // When the last retry occurred
  nextRetryTimestamp?: Date;    // When the next retry is scheduled
}

/**
 * Interface for external dependency error specific metadata
 */
export interface ExternalErrorMetadata extends ErrorMetadata {
  dependency: string;           // Name of the external dependency
  endpoint?: string;            // Specific endpoint that failed
  statusCode?: number;          // HTTP status code (if applicable)
  responseBody?: string;        // Response body (sanitized)
  requestId?: string;           // External system request ID
  circuitBreakerStatus?: string; // Open, closed, half-open
  fallbackUsed?: boolean;       // Whether fallback was used
}

/**
 * Structure for error codes with domain prefix and numeric code
 * Format: {DOMAIN}-{NUMERIC_CODE}
 * Example: ACH-4001 (Achievement not found error)
 */
export interface ErrorCode {
  domain: ErrorDomain;          // Domain prefix
  code: number;                 // Numeric error code
  toString(): string;           // Returns formatted error code
}

/**
 * Creates a formatted error code string from domain and numeric code
 * @param domain The error domain prefix
 * @param code The numeric error code
 * @returns Formatted error code string (e.g., "ACH-4001")
 */
export function createErrorCode(domain: ErrorDomain, code: number): ErrorCode {
  return {
    domain,
    code,
    toString: () => `${domain}-${code}`
  };
}

/**
 * Maps HTTP status codes to error categories
 */
export const HTTP_STATUS_TO_ERROR_CATEGORY: Record<number, ErrorCategory> = {
  400: ErrorCategory.CLIENT,
  401: ErrorCategory.CLIENT,
  403: ErrorCategory.CLIENT,
  404: ErrorCategory.CLIENT,
  405: ErrorCategory.CLIENT,
  409: ErrorCategory.CLIENT,
  410: ErrorCategory.CLIENT,
  412: ErrorCategory.CLIENT,
  413: ErrorCategory.CLIENT,
  415: ErrorCategory.CLIENT,
  422: ErrorCategory.CLIENT,
  429: ErrorCategory.CLIENT,
  
  500: ErrorCategory.SYSTEM,
  501: ErrorCategory.SYSTEM,
  502: ErrorCategory.EXTERNAL,
  503: ErrorCategory.SYSTEM,
  504: ErrorCategory.EXTERNAL,
  
  // Special cases that might be transient
  408: ErrorCategory.TRANSIENT, // Request Timeout
  423: ErrorCategory.TRANSIENT, // Locked
  425: ErrorCategory.TRANSIENT, // Too Early
  429: ErrorCategory.TRANSIENT, // Too Many Requests (can be retried later)
  503: ErrorCategory.TRANSIENT  // Service Unavailable (can be retried later)
};

/**
 * Maps error types to their corresponding error category
 */
export const ERROR_TYPE_TO_CATEGORY: Record<ErrorType, ErrorCategory> = {
  // Map all client error types to CLIENT category
  [ErrorType.BAD_REQUEST]: ErrorCategory.CLIENT,
  [ErrorType.UNAUTHORIZED]: ErrorCategory.CLIENT,
  [ErrorType.FORBIDDEN]: ErrorCategory.CLIENT,
  [ErrorType.NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.METHOD_NOT_ALLOWED]: ErrorCategory.CLIENT,
  [ErrorType.CONFLICT]: ErrorCategory.CLIENT,
  [ErrorType.GONE]: ErrorCategory.CLIENT,
  [ErrorType.PRECONDITION_FAILED]: ErrorCategory.CLIENT,
  [ErrorType.PAYLOAD_TOO_LARGE]: ErrorCategory.CLIENT,
  [ErrorType.UNSUPPORTED_MEDIA_TYPE]: ErrorCategory.CLIENT,
  [ErrorType.TOO_MANY_REQUESTS]: ErrorCategory.CLIENT,
  [ErrorType.INVALID_INPUT]: ErrorCategory.CLIENT,
  [ErrorType.INVALID_FORMAT]: ErrorCategory.CLIENT,
  [ErrorType.MISSING_REQUIRED_FIELD]: ErrorCategory.CLIENT,
  [ErrorType.INVALID_ENUM_VALUE]: ErrorCategory.CLIENT,
  [ErrorType.INVALID_DATE]: ErrorCategory.CLIENT,
  [ErrorType.INVALID_NUMERIC_VALUE]: ErrorCategory.CLIENT,
  [ErrorType.ACHIEVEMENT_NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.USER_ACHIEVEMENT_NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.QUEST_NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.USER_QUEST_NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.REWARD_NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.USER_REWARD_NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.RULE_NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.PROFILE_NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.LEADERBOARD_NOT_FOUND]: ErrorCategory.CLIENT,
  [ErrorType.INVALID_CREDENTIALS]: ErrorCategory.CLIENT,
  [ErrorType.EXPIRED_TOKEN]: ErrorCategory.CLIENT,
  [ErrorType.INVALID_TOKEN]: ErrorCategory.CLIENT,
  [ErrorType.INSUFFICIENT_PERMISSIONS]: ErrorCategory.CLIENT,
  [ErrorType.ACCOUNT_LOCKED]: ErrorCategory.CLIENT,
  [ErrorType.ACCOUNT_DISABLED]: ErrorCategory.CLIENT,
  [ErrorType.ALREADY_COMPLETED]: ErrorCategory.CLIENT,
  [ErrorType.PREREQUISITES_NOT_MET]: ErrorCategory.CLIENT,
  [ErrorType.REWARD_ALREADY_CLAIMED]: ErrorCategory.CLIENT,
  [ErrorType.INSUFFICIENT_POINTS]: ErrorCategory.CLIENT,
  [ErrorType.DUPLICATE_ENTRY]: ErrorCategory.CLIENT,
  [ErrorType.INVALID_STATE_TRANSITION]: ErrorCategory.CLIENT,
  
  // Map all system error types to SYSTEM category
  [ErrorType.INTERNAL_SERVER_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.NOT_IMPLEMENTED]: ErrorCategory.SYSTEM,
  [ErrorType.SERVICE_UNAVAILABLE]: ErrorCategory.SYSTEM,
  [ErrorType.GATEWAY_TIMEOUT]: ErrorCategory.SYSTEM,
  [ErrorType.DATABASE_CONNECTION_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.DATABASE_QUERY_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.DATABASE_TRANSACTION_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.DATABASE_CONSTRAINT_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.DATABASE_DEADLOCK_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.DATABASE_TIMEOUT_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.CACHE_CONNECTION_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.CACHE_OPERATION_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.CONFIGURATION_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.ENVIRONMENT_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.EVENT_PROCESSING_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.RULE_EVALUATION_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.ACHIEVEMENT_PROCESSING_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.QUEST_PROCESSING_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.REWARD_PROCESSING_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.LEADERBOARD_UPDATE_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.UNEXPECTED_ERROR]: ErrorCategory.SYSTEM,
  [ErrorType.UNHANDLED_EXCEPTION]: ErrorCategory.SYSTEM,
  
  // Map all transient error types to TRANSIENT category
  [ErrorType.NETWORK_ERROR]: ErrorCategory.TRANSIENT,
  [ErrorType.CONNECTION_RESET]: ErrorCategory.TRANSIENT,
  [ErrorType.CONNECTION_TIMEOUT]: ErrorCategory.TRANSIENT,
  [ErrorType.DNS_RESOLUTION_ERROR]: ErrorCategory.TRANSIENT,
  [ErrorType.RESOURCE_CONTENTION]: ErrorCategory.TRANSIENT,
  [ErrorType.LOCK_ACQUISITION_FAILURE]: ErrorCategory.TRANSIENT,
  [ErrorType.DEADLOCK_DETECTED]: ErrorCategory.TRANSIENT,
  [ErrorType.SERVICE_OVERLOADED]: ErrorCategory.TRANSIENT,
  [ErrorType.RATE_LIMITED]: ErrorCategory.TRANSIENT,
  [ErrorType.TEMPORARY_OUTAGE]: ErrorCategory.TRANSIENT,
  [ErrorType.DATABASE_CONNECTION_INTERRUPTED]: ErrorCategory.TRANSIENT,
  [ErrorType.DATABASE_FAILOVER_IN_PROGRESS]: ErrorCategory.TRANSIENT,
  [ErrorType.DATABASE_THROTTLED]: ErrorCategory.TRANSIENT,
  [ErrorType.KAFKA_TEMPORARY_ERROR]: ErrorCategory.TRANSIENT,
  [ErrorType.KAFKA_REBALANCING]: ErrorCategory.TRANSIENT,
  [ErrorType.KAFKA_BROKER_UNAVAILABLE]: ErrorCategory.TRANSIENT,
  [ErrorType.CACHE_TEMPORARY_ERROR]: ErrorCategory.TRANSIENT,
  [ErrorType.CACHE_EVICTION]: ErrorCategory.TRANSIENT,
  [ErrorType.CACHE_REBALANCING]: ErrorCategory.TRANSIENT,
  
  // Map all external error types to EXTERNAL category
  [ErrorType.EXTERNAL_SERVICE_UNAVAILABLE]: ErrorCategory.EXTERNAL,
  [ErrorType.EXTERNAL_SERVICE_TIMEOUT]: ErrorCategory.EXTERNAL,
  [ErrorType.EXTERNAL_SERVICE_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.EXTERNAL_SERVICE_INVALID_RESPONSE]: ErrorCategory.EXTERNAL,
  [ErrorType.KAFKA_PRODUCER_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.KAFKA_CONSUMER_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.KAFKA_ADMIN_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.KAFKA_SCHEMA_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.AUTH_SERVICE_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.AUTH_SERVICE_UNAVAILABLE]: ErrorCategory.EXTERNAL,
  [ErrorType.NOTIFICATION_SERVICE_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.NOTIFICATION_DELIVERY_FAILURE]: ErrorCategory.EXTERNAL,
  [ErrorType.HEALTH_SERVICE_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.CARE_SERVICE_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.PLAN_SERVICE_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.THIRD_PARTY_API_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.THIRD_PARTY_RATE_LIMIT]: ErrorCategory.EXTERNAL,
  [ErrorType.THIRD_PARTY_AUTH_ERROR]: ErrorCategory.EXTERNAL
};

/**
 * Predefined error codes for common gamification engine errors
 */
export const ERROR_CODES = {
  // Achievement errors (4000-4099: client, 5000-5099: system)
  ACHIEVEMENT_NOT_FOUND: createErrorCode(ErrorDomain.ACHIEVEMENT, 4001),
  USER_ACHIEVEMENT_NOT_FOUND: createErrorCode(ErrorDomain.ACHIEVEMENT, 4002),
  INVALID_ACHIEVEMENT_DATA: createErrorCode(ErrorDomain.ACHIEVEMENT, 4003),
  ACHIEVEMENT_ALREADY_COMPLETED: createErrorCode(ErrorDomain.ACHIEVEMENT, 4004),
  ACHIEVEMENT_PREREQUISITES_NOT_MET: createErrorCode(ErrorDomain.ACHIEVEMENT, 4005),
  ACHIEVEMENT_PROCESSING_ERROR: createErrorCode(ErrorDomain.ACHIEVEMENT, 5001),
  ACHIEVEMENT_EXTERNAL_SERVICE_ERROR: createErrorCode(ErrorDomain.ACHIEVEMENT, 5002),
  
  // Event errors (4100-4199: client, 5100-5199: system)
  EVENT_VALIDATION_ERROR: createErrorCode(ErrorDomain.EVENT, 4101),
  EVENT_PROCESSING_ERROR: createErrorCode(ErrorDomain.EVENT, 5101),
  EVENT_KAFKA_ERROR: createErrorCode(ErrorDomain.EVENT, 5102),
  EVENT_SCHEMA_ERROR: createErrorCode(ErrorDomain.EVENT, 4102),
  
  // Quest errors (4200-4299: client, 5200-5299: system)
  QUEST_NOT_FOUND: createErrorCode(ErrorDomain.QUEST, 4201),
  USER_QUEST_NOT_FOUND: createErrorCode(ErrorDomain.QUEST, 4202),
  INVALID_QUEST_DATA: createErrorCode(ErrorDomain.QUEST, 4203),
  QUEST_ALREADY_COMPLETED: createErrorCode(ErrorDomain.QUEST, 4204),
  QUEST_PREREQUISITES_NOT_MET: createErrorCode(ErrorDomain.QUEST, 4205),
  QUEST_PROCESSING_ERROR: createErrorCode(ErrorDomain.QUEST, 5201),
  
  // Reward errors (4300-4399: client, 5300-5399: system)
  REWARD_NOT_FOUND: createErrorCode(ErrorDomain.REWARD, 4301),
  USER_REWARD_NOT_FOUND: createErrorCode(ErrorDomain.REWARD, 4302),
  INVALID_REWARD_DATA: createErrorCode(ErrorDomain.REWARD, 4303),
  REWARD_ALREADY_CLAIMED: createErrorCode(ErrorDomain.REWARD, 4304),
  INSUFFICIENT_POINTS: createErrorCode(ErrorDomain.REWARD, 4305),
  REWARD_PROCESSING_ERROR: createErrorCode(ErrorDomain.REWARD, 5301),
  
  // Rule errors (4400-4499: client, 5400-5499: system)
  RULE_NOT_FOUND: createErrorCode(ErrorDomain.RULE, 4401),
  INVALID_RULE_DATA: createErrorCode(ErrorDomain.RULE, 4402),
  RULE_EVALUATION_ERROR: createErrorCode(ErrorDomain.RULE, 5401),
  
  // Profile errors (4500-4599: client, 5500-5599: system)
  PROFILE_NOT_FOUND: createErrorCode(ErrorDomain.PROFILE, 4501),
  INVALID_PROFILE_DATA: createErrorCode(ErrorDomain.PROFILE, 4502),
  PROFILE_UPDATE_ERROR: createErrorCode(ErrorDomain.PROFILE, 5501),
  
  // Leaderboard errors (4600-4699: client, 5600-5699: system)
  LEADERBOARD_NOT_FOUND: createErrorCode(ErrorDomain.LEADERBOARD, 4601),
  INVALID_LEADERBOARD_DATA: createErrorCode(ErrorDomain.LEADERBOARD, 4602),
  LEADERBOARD_UPDATE_ERROR: createErrorCode(ErrorDomain.LEADERBOARD, 5601),
  
  // Database errors (5700-5799)
  DATABASE_CONNECTION_ERROR: createErrorCode(ErrorDomain.DATABASE, 5701),
  DATABASE_QUERY_ERROR: createErrorCode(ErrorDomain.DATABASE, 5702),
  DATABASE_TRANSACTION_ERROR: createErrorCode(ErrorDomain.DATABASE, 5703),
  DATABASE_CONSTRAINT_ERROR: createErrorCode(ErrorDomain.DATABASE, 5704),
  
  // Kafka errors (5800-5899)
  KAFKA_PRODUCER_ERROR: createErrorCode(ErrorDomain.KAFKA, 5801),
  KAFKA_CONSUMER_ERROR: createErrorCode(ErrorDomain.KAFKA, 5802),
  KAFKA_SCHEMA_ERROR: createErrorCode(ErrorDomain.KAFKA, 5803),
  
  // Authentication errors (4900-4999)
  UNAUTHORIZED: createErrorCode(ErrorDomain.AUTH, 4901),
  FORBIDDEN: createErrorCode(ErrorDomain.AUTH, 4902),
  INVALID_TOKEN: createErrorCode(ErrorDomain.AUTH, 4903),
  EXPIRED_TOKEN: createErrorCode(ErrorDomain.AUTH, 4904),
  
  // Validation errors (4800-4899)
  VALIDATION_ERROR: createErrorCode(ErrorDomain.VALIDATION, 4801),
  MISSING_REQUIRED_FIELD: createErrorCode(ErrorDomain.VALIDATION, 4802),
  INVALID_FORMAT: createErrorCode(ErrorDomain.VALIDATION, 4803),
  
  // General errors
  GENERAL_CLIENT_ERROR: createErrorCode(ErrorDomain.GENERAL, 4001),
  GENERAL_SERVER_ERROR: createErrorCode(ErrorDomain.GENERAL, 5001),
  GENERAL_TRANSIENT_ERROR: createErrorCode(ErrorDomain.GENERAL, 5002),
  GENERAL_EXTERNAL_ERROR: createErrorCode(ErrorDomain.GENERAL, 5003)
};
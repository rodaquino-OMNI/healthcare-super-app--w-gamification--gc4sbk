import { HttpStatus } from '@nestjs/common';

/**
 * Base error categories for the application.
 * Provides a high-level classification of errors across all journeys.
 */
export enum ErrorCategory {
  /**
   * Validation errors - input data fails validation requirements
   * Maps to HTTP 400 Bad Request
   */
  VALIDATION = 'validation',
  
  /**
   * Business logic errors - operation cannot be completed due to business rules
   * Maps to HTTP 422 Unprocessable Entity
   */
  BUSINESS = 'business',
  
  /**
   * Technical errors - unexpected system errors and exceptions
   * Maps to HTTP 500 Internal Server Error
   */
  TECHNICAL = 'technical',
  
  /**
   * External system errors - failures in external services or dependencies
   * Maps to HTTP 502 Bad Gateway
   */
  EXTERNAL = 'external',

  /**
   * Authentication errors - user authentication failures
   * Maps to HTTP 401 Unauthorized
   */
  AUTHENTICATION = 'authentication',

  /**
   * Authorization errors - user lacks permissions for the requested operation
   * Maps to HTTP 403 Forbidden
   */
  AUTHORIZATION = 'authorization',

  /**
   * Not found errors - requested resource does not exist
   * Maps to HTTP 404 Not Found
   */
  NOT_FOUND = 'not_found',

  /**
   * Conflict errors - request conflicts with current state of the server
   * Maps to HTTP 409 Conflict
   */
  CONFLICT = 'conflict',

  /**
   * Rate limit errors - too many requests
   * Maps to HTTP 429 Too Many Requests
   */
  RATE_LIMIT = 'rate_limit',

  /**
   * Timeout errors - request timed out
   * Maps to HTTP 504 Gateway Timeout
   */
  TIMEOUT = 'timeout'
}

/**
 * More specific error types for granular error classification.
 * Extends the base ErrorCategory with more detailed error types.
 */
export enum ErrorType {
  // Validation errors
  INVALID_INPUT = 'invalid_input',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  INVALID_FORMAT = 'invalid_format',
  INVALID_ENUM_VALUE = 'invalid_enum_value',
  INVALID_DATE = 'invalid_date',
  INVALID_NUMERIC_VALUE = 'invalid_numeric_value',
  
  // Business errors
  BUSINESS_RULE_VIOLATION = 'business_rule_violation',
  DUPLICATE_ENTITY = 'duplicate_entity',
  ENTITY_NOT_FOUND = 'entity_not_found',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  OPERATION_NOT_ALLOWED = 'operation_not_allowed',
  LIMIT_EXCEEDED = 'limit_exceeded',
  INVALID_STATE_TRANSITION = 'invalid_state_transition',
  
  // Technical errors
  DATABASE_ERROR = 'database_error',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  UNEXPECTED_ERROR = 'unexpected_error',
  CONFIGURATION_ERROR = 'configuration_error',
  DATA_INTEGRITY_ERROR = 'data_integrity_error',
  
  // External errors
  EXTERNAL_SERVICE_UNAVAILABLE = 'external_service_unavailable',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  EXTERNAL_SERVICE_TIMEOUT = 'external_service_timeout',
  EXTERNAL_SERVICE_INVALID_RESPONSE = 'external_service_invalid_response',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'invalid_credentials',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'token_invalid',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_DISABLED = 'account_disabled',
  MFA_REQUIRED = 'mfa_required',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  RESOURCE_ACCESS_DENIED = 'resource_access_denied',
  INVALID_ROLE = 'invalid_role',
  
  // Not found errors
  RESOURCE_NOT_FOUND = 'resource_not_found',
  ENDPOINT_NOT_FOUND = 'endpoint_not_found',
  
  // Conflict errors
  RESOURCE_CONFLICT = 'resource_conflict',
  CONCURRENT_MODIFICATION = 'concurrent_modification',
  VERSION_CONFLICT = 'version_conflict',
  
  // Rate limit errors
  TOO_MANY_REQUESTS = 'too_many_requests',
  QUOTA_EXCEEDED = 'quota_exceeded',
  
  // Timeout errors
  REQUEST_TIMEOUT = 'request_timeout',
  OPERATION_TIMEOUT = 'operation_timeout'
}

/**
 * Health journey specific error types.
 * Used for errors that occur within the Health journey context.
 */
export enum HealthErrorType {
  // Health metrics errors
  INVALID_HEALTH_METRIC = 'invalid_health_metric',
  METRIC_THRESHOLD_EXCEEDED = 'metric_threshold_exceeded',
  METRIC_RECORDING_FAILED = 'metric_recording_failed',
  
  // Health goals errors
  GOAL_CREATION_FAILED = 'goal_creation_failed',
  GOAL_UPDATE_FAILED = 'goal_update_failed',
  GOAL_NOT_FOUND = 'goal_not_found',
  INVALID_GOAL_PARAMETERS = 'invalid_goal_parameters',
  
  // Device connection errors
  DEVICE_CONNECTION_FAILED = 'device_connection_failed',
  DEVICE_SYNC_FAILED = 'device_sync_failed',
  DEVICE_NOT_SUPPORTED = 'device_not_supported',
  DEVICE_AUTHORIZATION_FAILED = 'device_authorization_failed',
  
  // FHIR integration errors
  FHIR_INTEGRATION_ERROR = 'fhir_integration_error',
  FHIR_RESOURCE_NOT_FOUND = 'fhir_resource_not_found',
  FHIR_INVALID_RESOURCE = 'fhir_invalid_resource',
  
  // Health insights errors
  INSIGHT_GENERATION_FAILED = 'insight_generation_failed',
  INSUFFICIENT_DATA_FOR_INSIGHT = 'insufficient_data_for_insight'
}

/**
 * Care journey specific error types.
 * Used for errors that occur within the Care journey context.
 */
export enum CareErrorType {
  // Appointment errors
  APPOINTMENT_SCHEDULING_FAILED = 'appointment_scheduling_failed',
  APPOINTMENT_CANCELLATION_FAILED = 'appointment_cancellation_failed',
  APPOINTMENT_RESCHEDULING_FAILED = 'appointment_rescheduling_failed',
  APPOINTMENT_NOT_FOUND = 'appointment_not_found',
  NO_AVAILABLE_SLOTS = 'no_available_slots',
  
  // Provider errors
  PROVIDER_NOT_FOUND = 'provider_not_found',
  PROVIDER_UNAVAILABLE = 'provider_unavailable',
  INVALID_PROVIDER_SPECIALTY = 'invalid_provider_specialty',
  
  // Telemedicine errors
  TELEMEDICINE_SESSION_FAILED = 'telemedicine_session_failed',
  TELEMEDICINE_CONNECTION_ERROR = 'telemedicine_connection_error',
  TELEMEDICINE_MEDIA_ERROR = 'telemedicine_media_error',
  
  // Medication errors
  MEDICATION_NOT_FOUND = 'medication_not_found',
  MEDICATION_INTERACTION_DETECTED = 'medication_interaction_detected',
  INVALID_MEDICATION_DOSAGE = 'invalid_medication_dosage',
  PRESCRIPTION_ERROR = 'prescription_error',
  
  // Symptom checker errors
  SYMPTOM_ANALYSIS_FAILED = 'symptom_analysis_failed',
  INSUFFICIENT_SYMPTOMS = 'insufficient_symptoms',
  INVALID_SYMPTOM_DATA = 'invalid_symptom_data',
  
  // Treatment errors
  TREATMENT_PLAN_CREATION_FAILED = 'treatment_plan_creation_failed',
  TREATMENT_PLAN_UPDATE_FAILED = 'treatment_plan_update_failed',
  TREATMENT_PLAN_NOT_FOUND = 'treatment_plan_not_found'
}

/**
 * Plan journey specific error types.
 * Used for errors that occur within the Plan journey context.
 */
export enum PlanErrorType {
  // Plan errors
  PLAN_NOT_FOUND = 'plan_not_found',
  PLAN_ENROLLMENT_FAILED = 'plan_enrollment_failed',
  PLAN_TERMINATION_FAILED = 'plan_termination_failed',
  INVALID_PLAN_PARAMETERS = 'invalid_plan_parameters',
  
  // Benefit errors
  BENEFIT_NOT_FOUND = 'benefit_not_found',
  BENEFIT_NOT_COVERED = 'benefit_not_covered',
  BENEFIT_LIMIT_REACHED = 'benefit_limit_reached',
  BENEFIT_ELIGIBILITY_ERROR = 'benefit_eligibility_error',
  
  // Coverage errors
  COVERAGE_VERIFICATION_FAILED = 'coverage_verification_failed',
  SERVICE_NOT_COVERED = 'service_not_covered',
  COVERAGE_EXPIRED = 'coverage_expired',
  PREAUTHORIZATION_REQUIRED = 'preauthorization_required',
  
  // Claim errors
  CLAIM_SUBMISSION_FAILED = 'claim_submission_failed',
  CLAIM_PROCESSING_ERROR = 'claim_processing_error',
  CLAIM_NOT_FOUND = 'claim_not_found',
  INVALID_CLAIM_DATA = 'invalid_claim_data',
  DUPLICATE_CLAIM = 'duplicate_claim',
  
  // Document errors
  DOCUMENT_UPLOAD_FAILED = 'document_upload_failed',
  DOCUMENT_NOT_FOUND = 'document_not_found',
  INVALID_DOCUMENT_TYPE = 'invalid_document_type',
  DOCUMENT_PROCESSING_ERROR = 'document_processing_error'
}

/**
 * Error severity levels for categorizing the impact of errors.
 */
export enum ErrorSeverity {
  /**
   * Debug level - lowest severity, used for debugging purposes
   */
  DEBUG = 'debug',
  
  /**
   * Info level - informational messages, not actual errors
   */
  INFO = 'info',
  
  /**
   * Warning level - potential issues that don't prevent operation
   */
  WARNING = 'warning',
  
  /**
   * Error level - standard errors that affect the current operation
   */
  ERROR = 'error',
  
  /**
   * Critical level - severe errors that may affect system stability
   */
  CRITICAL = 'critical',
  
  /**
   * Fatal level - highest severity, system cannot continue operation
   */
  FATAL = 'fatal'
}

/**
 * Maps error categories to HTTP status codes.
 */
export const ErrorCategoryToHttpStatus: Record<ErrorCategory, HttpStatus> = {
  [ErrorCategory.VALIDATION]: HttpStatus.BAD_REQUEST,
  [ErrorCategory.BUSINESS]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ErrorCategory.TECHNICAL]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCategory.EXTERNAL]: HttpStatus.BAD_GATEWAY,
  [ErrorCategory.AUTHENTICATION]: HttpStatus.UNAUTHORIZED,
  [ErrorCategory.AUTHORIZATION]: HttpStatus.FORBIDDEN,
  [ErrorCategory.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCategory.CONFLICT]: HttpStatus.CONFLICT,
  [ErrorCategory.RATE_LIMIT]: HttpStatus.TOO_MANY_REQUESTS,
  [ErrorCategory.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT
};

/**
 * Maps error types to their corresponding error categories.
 */
export const ErrorTypeToCategory: Record<ErrorType, ErrorCategory> = {
  // Validation errors
  [ErrorType.INVALID_INPUT]: ErrorCategory.VALIDATION,
  [ErrorType.MISSING_REQUIRED_FIELD]: ErrorCategory.VALIDATION,
  [ErrorType.INVALID_FORMAT]: ErrorCategory.VALIDATION,
  [ErrorType.INVALID_ENUM_VALUE]: ErrorCategory.VALIDATION,
  [ErrorType.INVALID_DATE]: ErrorCategory.VALIDATION,
  [ErrorType.INVALID_NUMERIC_VALUE]: ErrorCategory.VALIDATION,
  
  // Business errors
  [ErrorType.BUSINESS_RULE_VIOLATION]: ErrorCategory.BUSINESS,
  [ErrorType.DUPLICATE_ENTITY]: ErrorCategory.BUSINESS,
  [ErrorType.ENTITY_NOT_FOUND]: ErrorCategory.BUSINESS,
  [ErrorType.INSUFFICIENT_FUNDS]: ErrorCategory.BUSINESS,
  [ErrorType.OPERATION_NOT_ALLOWED]: ErrorCategory.BUSINESS,
  [ErrorType.LIMIT_EXCEEDED]: ErrorCategory.BUSINESS,
  [ErrorType.INVALID_STATE_TRANSITION]: ErrorCategory.BUSINESS,
  
  // Technical errors
  [ErrorType.DATABASE_ERROR]: ErrorCategory.TECHNICAL,
  [ErrorType.INTERNAL_SERVER_ERROR]: ErrorCategory.TECHNICAL,
  [ErrorType.UNEXPECTED_ERROR]: ErrorCategory.TECHNICAL,
  [ErrorType.CONFIGURATION_ERROR]: ErrorCategory.TECHNICAL,
  [ErrorType.DATA_INTEGRITY_ERROR]: ErrorCategory.TECHNICAL,
  
  // External errors
  [ErrorType.EXTERNAL_SERVICE_UNAVAILABLE]: ErrorCategory.EXTERNAL,
  [ErrorType.EXTERNAL_SERVICE_ERROR]: ErrorCategory.EXTERNAL,
  [ErrorType.EXTERNAL_SERVICE_TIMEOUT]: ErrorCategory.EXTERNAL,
  [ErrorType.EXTERNAL_SERVICE_INVALID_RESPONSE]: ErrorCategory.EXTERNAL,
  
  // Authentication errors
  [ErrorType.INVALID_CREDENTIALS]: ErrorCategory.AUTHENTICATION,
  [ErrorType.TOKEN_EXPIRED]: ErrorCategory.AUTHENTICATION,
  [ErrorType.TOKEN_INVALID]: ErrorCategory.AUTHENTICATION,
  [ErrorType.ACCOUNT_LOCKED]: ErrorCategory.AUTHENTICATION,
  [ErrorType.ACCOUNT_DISABLED]: ErrorCategory.AUTHENTICATION,
  [ErrorType.MFA_REQUIRED]: ErrorCategory.AUTHENTICATION,
  
  // Authorization errors
  [ErrorType.INSUFFICIENT_PERMISSIONS]: ErrorCategory.AUTHORIZATION,
  [ErrorType.RESOURCE_ACCESS_DENIED]: ErrorCategory.AUTHORIZATION,
  [ErrorType.INVALID_ROLE]: ErrorCategory.AUTHORIZATION,
  
  // Not found errors
  [ErrorType.RESOURCE_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [ErrorType.ENDPOINT_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  
  // Conflict errors
  [ErrorType.RESOURCE_CONFLICT]: ErrorCategory.CONFLICT,
  [ErrorType.CONCURRENT_MODIFICATION]: ErrorCategory.CONFLICT,
  [ErrorType.VERSION_CONFLICT]: ErrorCategory.CONFLICT,
  
  // Rate limit errors
  [ErrorType.TOO_MANY_REQUESTS]: ErrorCategory.RATE_LIMIT,
  [ErrorType.QUOTA_EXCEEDED]: ErrorCategory.RATE_LIMIT,
  
  // Timeout errors
  [ErrorType.REQUEST_TIMEOUT]: ErrorCategory.TIMEOUT,
  [ErrorType.OPERATION_TIMEOUT]: ErrorCategory.TIMEOUT
};

/**
 * Interface for error metadata.
 * Contains additional information about the error.
 */
export interface ErrorMetadata {
  /**
   * Unique identifier for the error instance
   */
  errorId?: string;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: string;
  
  /**
   * Error category from ErrorCategory enum
   */
  category: ErrorCategory;
  
  /**
   * Specific error type from ErrorType enum
   */
  type: ErrorType | HealthErrorType | CareErrorType | PlanErrorType;
  
  /**
   * Error code for more specific categorization (e.g., "HEALTH_001")
   */
  code: string;
  
  /**
   * Error severity level
   */
  severity: ErrorSeverity;
  
  /**
   * Source of the error (service, component, or module)
   */
  source?: string;
  
  /**
   * Stack trace for technical errors (only included in development/staging)
   */
  stack?: string;
  
  /**
   * Additional properties specific to the error
   */
  [key: string]: any;
}

/**
 * Interface for user context in errors.
 * Contains information about the user who encountered the error.
 */
export interface UserErrorContext {
  /**
   * User ID if authenticated
   */
  userId?: string;
  
  /**
   * User's roles or permissions
   */
  roles?: string[];
  
  /**
   * User's session ID
   */
  sessionId?: string;
  
  /**
   * User's IP address
   */
  ipAddress?: string;
  
  /**
   * User agent information
   */
  userAgent?: string;
}

/**
 * Interface for request context in errors.
 * Contains information about the HTTP request that led to the error.
 */
export interface RequestErrorContext {
  /**
   * HTTP method (GET, POST, etc.)
   */
  method?: string;
  
  /**
   * Request URL
   */
  url?: string;
  
  /**
   * Request headers (sensitive information should be redacted)
   */
  headers?: Record<string, string>;
  
  /**
   * Request parameters (query parameters, path parameters)
   */
  params?: Record<string, any>;
  
  /**
   * Request body (sensitive information should be redacted)
   */
  body?: any;
  
  /**
   * Correlation ID for request tracing
   */
  correlationId?: string;
}

/**
 * Interface for journey context in errors.
 * Contains information about the journey context in which the error occurred.
 */
export interface JourneyErrorContext {
  /**
   * Journey type (health, care, plan)
   */
  journeyType: 'health' | 'care' | 'plan';
  
  /**
   * Journey-specific context information
   */
  journeyContext?: Record<string, any>;
  
  /**
   * Current step or screen in the journey
   */
  journeyStep?: string;
  
  /**
   * Previous step or screen in the journey
   */
  previousStep?: string;
}

/**
 * Interface for error context.
 * Contains contextual information about the error.
 */
export interface ErrorContext {
  /**
   * User context
   */
  user?: UserErrorContext;
  
  /**
   * Request context
   */
  request?: RequestErrorContext;
  
  /**
   * Journey context
   */
  journey?: JourneyErrorContext;
  
  /**
   * Additional context information
   */
  [key: string]: any;
}

/**
 * Interface for client-friendly error messages.
 * Used to provide user-friendly error information.
 */
export interface ClientErrorMessage {
  /**
   * Short, user-friendly error message
   */
  message: string;
  
  /**
   * Optional detailed explanation for the user
   */
  detail?: string;
  
  /**
   * Optional action that the user can take to resolve the error
   */
  action?: string;
  
  /**
   * Optional link to documentation or help
   */
  helpLink?: string;
  
  /**
   * Optional field name for validation errors
   */
  field?: string;
}

/**
 * Interface for serialized error response.
 * Defines the structure of error responses sent to clients.
 */
export interface SerializedError {
  /**
   * Error metadata
   */
  error: {
    /**
     * Error code
     */
    code: string;
    
    /**
     * Error category
     */
    category: ErrorCategory;
    
    /**
     * Error type
     */
    type: string;
    
    /**
     * Client-friendly error message
     */
    message: string;
    
    /**
     * Optional detailed explanation
     */
    detail?: string;
    
    /**
     * Optional action suggestion
     */
    action?: string;
    
    /**
     * Optional help link
     */
    helpLink?: string;
    
    /**
     * Optional field name for validation errors
     */
    field?: string;
    
    /**
     * Optional additional details about the error
     */
    details?: any;
    
    /**
     * Timestamp when the error occurred
     */
    timestamp: string;
    
    /**
     * Request correlation ID for tracing
     */
    correlationId?: string;
  };
}

/**
 * Type for error handler functions.
 * Defines the signature for error handler callbacks.
 */
export type ErrorHandler<T = any> = (error: Error, context?: ErrorContext) => T;

/**
 * Type for error transformer functions.
 * Defines the signature for functions that transform errors.
 */
export type ErrorTransformer = (error: Error, context?: ErrorContext) => Error;

/**
 * Type for error serializer functions.
 * Defines the signature for functions that serialize errors for client responses.
 */
export type ErrorSerializer = (error: Error, context?: ErrorContext) => SerializedError;

/**
 * Type for error logger functions.
 * Defines the signature for functions that log errors.
 */
export type ErrorLogger = (error: Error, context?: ErrorContext) => void;

/**
 * Type for error filter functions.
 * Defines the signature for functions that determine if an error should be processed.
 */
export type ErrorFilter = (error: Error, context?: ErrorContext) => boolean;
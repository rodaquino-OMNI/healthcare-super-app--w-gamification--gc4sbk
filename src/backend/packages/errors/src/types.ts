import { HttpStatus } from '@nestjs/common';

/**
 * Enhanced enum representing different types of errors in the application.
 * Used to categorize exceptions for consistent error handling across services.
 */
export enum ErrorType {
  /**
   * Validation errors - input data fails validation requirements
   * Maps to HTTP 400 Bad Request
   */
  VALIDATION = 'validation',
  
  /**
   * Authentication errors - user is not authenticated or token is invalid
   * Maps to HTTP 401 Unauthorized
   */
  AUTHENTICATION = 'authentication',
  
  /**
   * Authorization errors - user does not have permission to perform the action
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
   * Business logic errors - operation cannot be completed due to business rules
   * Maps to HTTP 422 Unprocessable Entity
   */
  BUSINESS = 'business',
  
  /**
   * Rate limit errors - too many requests
   * Maps to HTTP 429 Too Many Requests
   */
  RATE_LIMIT = 'rate_limit',
  
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
   * Service unavailable errors - service is temporarily unavailable
   * Maps to HTTP 503 Service Unavailable
   */
  SERVICE_UNAVAILABLE = 'service_unavailable',
  
  /**
   * Timeout errors - request timed out
   * Maps to HTTP 504 Gateway Timeout
   */
  TIMEOUT = 'timeout'
}

/**
 * Enum representing error categories specific to the Health journey.
 */
export enum HealthErrorType {
  /**
   * Device connection errors - issues with connecting to health devices
   */
  DEVICE_CONNECTION = 'device_connection',
  
  /**
   * Metric recording errors - issues with recording health metrics
   */
  METRIC_RECORDING = 'metric_recording',
  
  /**
   * Goal tracking errors - issues with health goal tracking
   */
  GOAL_TRACKING = 'goal_tracking',
  
  /**
   * Data synchronization errors - issues with syncing health data
   */
  DATA_SYNC = 'data_sync',
  
  /**
   * FHIR integration errors - issues with FHIR API integration
   */
  FHIR_INTEGRATION = 'fhir_integration',
  
  /**
   * Insight generation errors - issues with generating health insights
   */
  INSIGHT_GENERATION = 'insight_generation'
}

/**
 * Enum representing error categories specific to the Care journey.
 */
export enum CareErrorType {
  /**
   * Appointment booking errors - issues with booking appointments
   */
  APPOINTMENT_BOOKING = 'appointment_booking',
  
  /**
   * Provider availability errors - issues with provider availability
   */
  PROVIDER_AVAILABILITY = 'provider_availability',
  
  /**
   * Telemedicine session errors - issues with telemedicine sessions
   */
  TELEMEDICINE_SESSION = 'telemedicine_session',
  
  /**
   * Medication tracking errors - issues with medication tracking
   */
  MEDICATION_TRACKING = 'medication_tracking',
  
  /**
   * Symptom checker errors - issues with symptom checker
   */
  SYMPTOM_CHECKER = 'symptom_checker',
  
  /**
   * Treatment plan errors - issues with treatment plans
   */
  TREATMENT_PLAN = 'treatment_plan'
}

/**
 * Enum representing error categories specific to the Plan journey.
 */
export enum PlanErrorType {
  /**
   * Claim submission errors - issues with submitting claims
   */
  CLAIM_SUBMISSION = 'claim_submission',
  
  /**
   * Benefit verification errors - issues with verifying benefits
   */
  BENEFIT_VERIFICATION = 'benefit_verification',
  
  /**
   * Coverage determination errors - issues with determining coverage
   */
  COVERAGE_DETERMINATION = 'coverage_determination',
  
  /**
   * Document upload errors - issues with uploading documents
   */
  DOCUMENT_UPLOAD = 'document_upload',
  
  /**
   * Plan comparison errors - issues with comparing plans
   */
  PLAN_COMPARISON = 'plan_comparison',
  
  /**
   * Insurance integration errors - issues with insurance system integration
   */
  INSURANCE_INTEGRATION = 'insurance_integration'
}

/**
 * Enum representing error recovery strategies.
 */
export enum ErrorRecoveryStrategy {
  /**
   * Retry the operation with exponential backoff
   */
  RETRY = 'retry',
  
  /**
   * Use cached data as a fallback
   */
  CACHED_DATA = 'cached_data',
  
  /**
   * Use default behavior
   */
  DEFAULT_BEHAVIOR = 'default_behavior',
  
  /**
   * Gracefully degrade the feature
   */
  GRACEFUL_DEGRADATION = 'graceful_degradation',
  
  /**
   * Apply circuit breaker pattern
   */
  CIRCUIT_BREAKER = 'circuit_breaker',
  
  /**
   * No recovery possible, fail the operation
   */
  FAIL = 'fail'
}

/**
 * Mapping of error types to HTTP status codes.
 */
export const ERROR_TYPE_TO_HTTP_STATUS: Record<ErrorType, HttpStatus> = {
  [ErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
  [ErrorType.AUTHENTICATION]: HttpStatus.UNAUTHORIZED,
  [ErrorType.AUTHORIZATION]: HttpStatus.FORBIDDEN,
  [ErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorType.CONFLICT]: HttpStatus.CONFLICT,
  [ErrorType.BUSINESS]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ErrorType.RATE_LIMIT]: HttpStatus.TOO_MANY_REQUESTS,
  [ErrorType.TECHNICAL]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorType.EXTERNAL]: HttpStatus.BAD_GATEWAY,
  [ErrorType.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [ErrorType.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT
}

/**
 * Interface for error metadata that provides additional context about the error.
 */
export interface ErrorMetadata {
  /**
   * Unique error code for identification and tracking
   */
  code: string;
  
  /**
   * Primary error type from ErrorType enum
   */
  type: ErrorType;
  
  /**
   * Journey-specific error type (optional)
   */
  journeyType?: HealthErrorType | CareErrorType | PlanErrorType;
  
  /**
   * Recommended recovery strategy (optional)
   */
  recoveryStrategy?: ErrorRecoveryStrategy;
  
  /**
   * Whether the error is retryable
   */
  retryable: boolean;
  
  /**
   * Whether the error should be logged
   */
  loggable: boolean;
  
  /**
   * Whether the error should trigger an alert
   */
  alertable: boolean;
  
  /**
   * Source of the error (service name, component, etc.)
   */
  source: string;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: Date;
}

/**
 * Interface for error context that provides additional information about the error.
 */
export interface ErrorContext {
  /**
   * User ID associated with the error (if applicable)
   */
  userId?: string;
  
  /**
   * Request ID associated with the error
   */
  requestId: string;
  
  /**
   * Trace ID for distributed tracing
   */
  traceId: string;
  
  /**
   * Journey context (health, care, plan)
   */
  journey?: 'health' | 'care' | 'plan';
  
  /**
   * Operation being performed when the error occurred
   */
  operation: string;
  
  /**
   * Resource being accessed when the error occurred
   */
  resource?: string;
  
  /**
   * Additional data relevant to the error
   */
  data?: Record<string, any>;
  
  /**
   * Stack trace (only included in development and testing environments)
   */
  stack?: string;
}

/**
 * Interface for serialized error response sent to clients.
 * Provides a consistent error structure across all services.
 */
export interface SerializedError {
  /**
   * Error object containing standardized error information
   */
  error: {
    /**
     * Error type from ErrorType enum
     */
    type: string;
    
    /**
     * Unique error code for identification
     */
    code: string;
    
    /**
     * Human-readable error message
     */
    message: string;
    
    /**
     * Journey-specific context if applicable
     */
    journey?: string;
    
    /**
     * Additional details about the error
     */
    details?: Record<string, any>;
    
    /**
     * Request ID for tracking
     */
    requestId?: string;
    
    /**
     * Timestamp when the error occurred
     */
    timestamp: string;
  };
}

/**
 * Type for error code prefixes based on journey.
 * Used to create consistent error codes across the application.
 */
export type ErrorCodePrefix = 'AUTH' | 'HEALTH' | 'CARE' | 'PLAN' | 'GAMIFICATION' | 'NOTIFICATION' | 'SYSTEM';

/**
 * Type for error severity levels.
 * Used for logging and alerting purposes.
 */
export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Interface for error classification used to categorize errors for reporting and analytics.
 */
export interface ErrorClassification {
  /**
   * Primary error type
   */
  type: ErrorType;
  
  /**
   * Journey-specific error type if applicable
   */
  journeyType?: HealthErrorType | CareErrorType | PlanErrorType;
  
  /**
   * Error severity level
   */
  severity: ErrorSeverity;
  
  /**
   * Whether the error is expected in normal operation
   */
  expected: boolean;
  
  /**
   * Whether the error requires immediate attention
   */
  requiresAttention: boolean;
  
  /**
   * Category for grouping similar errors
   */
  category: string;
}
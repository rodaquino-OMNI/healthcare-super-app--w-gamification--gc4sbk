/**
 * Common error interfaces and types for the AUSTA SuperApp
 * 
 * This file defines standardized error structures for API responses,
 * application exceptions, validation errors, and service errors.
 * These types ensure consistent error handling and reporting across
 * all domains and help maintain a unified error experience for users.
 */

/**
 * Error classification categories
 */
export enum ErrorCategory {
  CLIENT = 'CLIENT',       // 4xx errors - client-side issues
  SYSTEM = 'SYSTEM',       // 5xx errors - server-side issues
  TRANSIENT = 'TRANSIENT', // Temporary errors that may resolve with retry
  EXTERNAL = 'EXTERNAL'    // Errors from external dependencies
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'INFO',         // Informational, not critical
  WARNING = 'WARNING',   // Warning, operation completed but with issues
  ERROR = 'ERROR',       // Error, operation failed
  CRITICAL = 'CRITICAL'  // Critical error, system stability affected
}

/**
 * Common error codes shared across all journeys
 */
export enum CommonErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Input validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // External dependency errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Miscellaneous
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Base error interface that all error types extend
 */
export interface BaseError {
  code: string;                 // Error code (from error code enums)
  message: string;              // User-friendly error message
  category: ErrorCategory;      // Error classification
  severity: ErrorSeverity;      // Error severity level
  timestamp: string;            // ISO timestamp when error occurred
  requestId?: string;           // Correlation ID for request tracing
  path?: string;                // API path where error occurred
  journeyContext?: string;      // Current journey context (health, care, plan)
}

/**
 * Field-level validation error
 */
export interface ValidationFieldError {
  field: string;                // Field name with error
  message: string;              // Error message for this field
  code: string;                 // Validation error code
  value?: any;                  // Invalid value (if safe to include)
  constraints?: string[];       // Validation constraints that failed
}

/**
 * Validation error with field-level details
 */
export interface ValidationError extends BaseError {
  code: CommonErrorCode.VALIDATION_FAILED;
  fields: ValidationFieldError[];
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  error: BaseError | ValidationError;
  success: false;               // Always false for error responses
  timestamp: string;            // ISO timestamp of response
  path: string;                 // Request path
  status: number;               // HTTP status code
}

/**
 * Health journey specific error codes
 */
export enum HealthErrorCode {
  // Device integration errors
  DEVICE_CONNECTION_FAILED = 'HEALTH_DEVICE_CONNECTION_FAILED',
  DEVICE_SYNC_FAILED = 'HEALTH_DEVICE_SYNC_FAILED',
  DEVICE_NOT_SUPPORTED = 'HEALTH_DEVICE_NOT_SUPPORTED',
  
  // Health data errors
  INVALID_METRIC_TYPE = 'HEALTH_INVALID_METRIC_TYPE',
  INVALID_METRIC_VALUE = 'HEALTH_INVALID_METRIC_VALUE',
  METRIC_NOT_FOUND = 'HEALTH_METRIC_NOT_FOUND',
  
  // Health goal errors
  GOAL_ALREADY_COMPLETED = 'HEALTH_GOAL_ALREADY_COMPLETED',
  GOAL_NOT_ACTIVE = 'HEALTH_GOAL_NOT_ACTIVE',
  INVALID_GOAL_TARGET = 'HEALTH_INVALID_GOAL_TARGET',
  
  // FHIR integration errors
  FHIR_INTEGRATION_ERROR = 'HEALTH_FHIR_INTEGRATION_ERROR',
  FHIR_RESOURCE_NOT_FOUND = 'HEALTH_FHIR_RESOURCE_NOT_FOUND'
}

/**
 * Care journey specific error codes
 */
export enum CareErrorCode {
  // Appointment errors
  APPOINTMENT_NOT_AVAILABLE = 'CARE_APPOINTMENT_NOT_AVAILABLE',
  APPOINTMENT_ALREADY_BOOKED = 'CARE_APPOINTMENT_ALREADY_BOOKED',
  APPOINTMENT_CANCELLATION_FAILED = 'CARE_APPOINTMENT_CANCELLATION_FAILED',
  APPOINTMENT_RESCHEDULE_FAILED = 'CARE_APPOINTMENT_RESCHEDULE_FAILED',
  
  // Provider errors
  PROVIDER_NOT_AVAILABLE = 'CARE_PROVIDER_NOT_AVAILABLE',
  PROVIDER_NOT_FOUND = 'CARE_PROVIDER_NOT_FOUND',
  
  // Telemedicine errors
  TELEMEDICINE_SESSION_FAILED = 'CARE_TELEMEDICINE_SESSION_FAILED',
  TELEMEDICINE_NOT_AVAILABLE = 'CARE_TELEMEDICINE_NOT_AVAILABLE',
  
  // Medication errors
  MEDICATION_NOT_FOUND = 'CARE_MEDICATION_NOT_FOUND',
  MEDICATION_INTERACTION_DETECTED = 'CARE_MEDICATION_INTERACTION_DETECTED',
  
  // Treatment errors
  TREATMENT_PLAN_NOT_FOUND = 'CARE_TREATMENT_PLAN_NOT_FOUND',
  TREATMENT_UPDATE_FAILED = 'CARE_TREATMENT_UPDATE_FAILED'
}

/**
 * Plan journey specific error codes
 */
export enum PlanErrorCode {
  // Plan errors
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',
  PLAN_NOT_ACTIVE = 'PLAN_NOT_ACTIVE',
  PLAN_CHANGE_NOT_ALLOWED = 'PLAN_CHANGE_NOT_ALLOWED',
  
  // Claim errors
  CLAIM_NOT_FOUND = 'PLAN_CLAIM_NOT_FOUND',
  CLAIM_SUBMISSION_FAILED = 'PLAN_CLAIM_SUBMISSION_FAILED',
  CLAIM_DOCUMENT_INVALID = 'PLAN_CLAIM_DOCUMENT_INVALID',
  CLAIM_ALREADY_PROCESSED = 'PLAN_CLAIM_ALREADY_PROCESSED',
  
  // Coverage errors
  COVERAGE_NOT_FOUND = 'PLAN_COVERAGE_NOT_FOUND',
  SERVICE_NOT_COVERED = 'PLAN_SERVICE_NOT_COVERED',
  COVERAGE_LIMIT_REACHED = 'PLAN_COVERAGE_LIMIT_REACHED',
  
  // Benefit errors
  BENEFIT_NOT_FOUND = 'PLAN_BENEFIT_NOT_FOUND',
  BENEFIT_NOT_AVAILABLE = 'PLAN_BENEFIT_NOT_AVAILABLE',
  BENEFIT_ALREADY_USED = 'PLAN_BENEFIT_ALREADY_USED'
}

/**
 * Gamification specific error codes
 */
export enum GamificationErrorCode {
  // Achievement errors
  ACHIEVEMENT_NOT_FOUND = 'GAMIFICATION_ACHIEVEMENT_NOT_FOUND',
  ACHIEVEMENT_ALREADY_UNLOCKED = 'GAMIFICATION_ACHIEVEMENT_ALREADY_UNLOCKED',
  
  // Quest errors
  QUEST_NOT_FOUND = 'GAMIFICATION_QUEST_NOT_FOUND',
  QUEST_NOT_ACTIVE = 'GAMIFICATION_QUEST_NOT_ACTIVE',
  QUEST_ALREADY_COMPLETED = 'GAMIFICATION_QUEST_ALREADY_COMPLETED',
  
  // Reward errors
  REWARD_NOT_FOUND = 'GAMIFICATION_REWARD_NOT_FOUND',
  REWARD_NOT_AVAILABLE = 'GAMIFICATION_REWARD_NOT_AVAILABLE',
  INSUFFICIENT_POINTS = 'GAMIFICATION_INSUFFICIENT_POINTS',
  
  // Profile errors
  PROFILE_NOT_FOUND = 'GAMIFICATION_PROFILE_NOT_FOUND',
  PROFILE_UPDATE_FAILED = 'GAMIFICATION_PROFILE_UPDATE_FAILED',
  
  // Event errors
  EVENT_PROCESSING_FAILED = 'GAMIFICATION_EVENT_PROCESSING_FAILED',
  INVALID_EVENT_TYPE = 'GAMIFICATION_INVALID_EVENT_TYPE',
  EVENT_VALIDATION_FAILED = 'GAMIFICATION_EVENT_VALIDATION_FAILED'
}

/**
 * Error factory function to create standardized error objects
 */
export interface ErrorFactory {
  createError(params: {
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    requestId?: string;
    path?: string;
    journeyContext?: string;
    details?: Record<string, any>;
  }): BaseError;
  
  createValidationError(params: {
    message: string;
    fields: ValidationFieldError[];
    severity?: ErrorSeverity;
    requestId?: string;
    path?: string;
    journeyContext?: string;
  }): ValidationError;
  
  createApiErrorResponse(error: BaseError | ValidationError, status: number, path: string): ApiErrorResponse;
}

/**
 * Type guard to check if an error is a validation error
 */
export function isValidationError(error: BaseError): error is ValidationError {
  return error.code === CommonErrorCode.VALIDATION_FAILED && 'fields' in error;
}

/**
 * Helper type that combines all error codes from different journeys
 */
export type ErrorCode = CommonErrorCode | HealthErrorCode | CareErrorCode | PlanErrorCode | GamificationErrorCode;
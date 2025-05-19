/**
 * Error Types for AUSTA SuperApp API
 * 
 * This file defines the TypeScript interfaces and types for handling errors
 * across the AUSTA SuperApp. It provides a consistent error handling structure
 * for all journeys and ensures proper error propagation from backend to frontend.
 */

/**
 * Base error codes that are common across all journeys
 */
export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Authentication/Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Input validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // External dependency errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  THIRD_PARTY_API_ERROR = 'THIRD_PARTY_API_ERROR',
}

/**
 * Health journey specific error codes
 */
export enum HealthErrorCode {
  // Device connection errors
  DEVICE_CONNECTION_FAILED = 'HEALTH_DEVICE_CONNECTION_FAILED',
  DEVICE_SYNC_FAILED = 'HEALTH_DEVICE_SYNC_FAILED',
  DEVICE_NOT_SUPPORTED = 'HEALTH_DEVICE_NOT_SUPPORTED',
  DEVICE_PERMISSION_DENIED = 'HEALTH_DEVICE_PERMISSION_DENIED',
  
  // Health data errors
  INVALID_HEALTH_METRIC = 'HEALTH_INVALID_METRIC',
  HEALTH_DATA_NOT_AVAILABLE = 'HEALTH_DATA_NOT_AVAILABLE',
  HEALTH_GOAL_INVALID = 'HEALTH_GOAL_INVALID',
  
  // FHIR integration errors
  FHIR_INTEGRATION_ERROR = 'HEALTH_FHIR_INTEGRATION_ERROR',
  FHIR_DATA_MAPPING_ERROR = 'HEALTH_FHIR_DATA_MAPPING_ERROR',
}

/**
 * Care journey specific error codes
 */
export enum CareErrorCode {
  // Appointment errors
  APPOINTMENT_SCHEDULING_FAILED = 'CARE_APPOINTMENT_SCHEDULING_FAILED',
  APPOINTMENT_CANCELLATION_FAILED = 'CARE_APPOINTMENT_CANCELLATION_FAILED',
  APPOINTMENT_RESCHEDULE_FAILED = 'CARE_APPOINTMENT_RESCHEDULE_FAILED',
  APPOINTMENT_NOT_AVAILABLE = 'CARE_APPOINTMENT_NOT_AVAILABLE',
  
  // Provider errors
  PROVIDER_NOT_AVAILABLE = 'CARE_PROVIDER_NOT_AVAILABLE',
  PROVIDER_NOT_FOUND = 'CARE_PROVIDER_NOT_FOUND',
  
  // Telemedicine errors
  TELEMEDICINE_SESSION_FAILED = 'CARE_TELEMEDICINE_SESSION_FAILED',
  TELEMEDICINE_CONNECTION_ERROR = 'CARE_TELEMEDICINE_CONNECTION_ERROR',
  
  // Medication errors
  MEDICATION_NOT_FOUND = 'CARE_MEDICATION_NOT_FOUND',
  MEDICATION_INTERACTION_WARNING = 'CARE_MEDICATION_INTERACTION_WARNING',
  
  // Treatment errors
  TREATMENT_PLAN_NOT_FOUND = 'CARE_TREATMENT_PLAN_NOT_FOUND',
  TREATMENT_PLAN_UPDATE_FAILED = 'CARE_TREATMENT_PLAN_UPDATE_FAILED',
}

/**
 * Plan journey specific error codes
 */
export enum PlanErrorCode {
  // Plan errors
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',
  PLAN_NOT_ACTIVE = 'PLAN_NOT_ACTIVE',
  PLAN_EXPIRED = 'PLAN_EXPIRED',
  
  // Claim errors
  CLAIM_SUBMISSION_FAILED = 'PLAN_CLAIM_SUBMISSION_FAILED',
  CLAIM_NOT_FOUND = 'PLAN_CLAIM_NOT_FOUND',
  CLAIM_ALREADY_PROCESSED = 'PLAN_CLAIM_ALREADY_PROCESSED',
  CLAIM_DOCUMENT_INVALID = 'PLAN_CLAIM_DOCUMENT_INVALID',
  
  // Coverage errors
  COVERAGE_NOT_FOUND = 'PLAN_COVERAGE_NOT_FOUND',
  COVERAGE_LIMIT_EXCEEDED = 'PLAN_COVERAGE_LIMIT_EXCEEDED',
  SERVICE_NOT_COVERED = 'PLAN_SERVICE_NOT_COVERED',
  
  // Benefit errors
  BENEFIT_NOT_FOUND = 'PLAN_BENEFIT_NOT_FOUND',
  BENEFIT_NOT_AVAILABLE = 'PLAN_BENEFIT_NOT_AVAILABLE',
  BENEFIT_ELIGIBILITY_ERROR = 'PLAN_BENEFIT_ELIGIBILITY_ERROR',
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
  QUEST_NOT_AVAILABLE = 'GAMIFICATION_QUEST_NOT_AVAILABLE',
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
  EVENT_VALIDATION_FAILED = 'GAMIFICATION_EVENT_VALIDATION_FAILED',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'INFO',         // Informational, not an actual error
  WARNING = 'WARNING',   // Warning, operation succeeded but with issues
  ERROR = 'ERROR',       // Error, operation failed but system is stable
  CRITICAL = 'CRITICAL', // Critical error, system stability may be affected
  FATAL = 'FATAL',       // Fatal error, system cannot function properly
}

/**
 * Error source identifiers
 */
export enum ErrorSource {
  CLIENT = 'CLIENT',           // Error originated from client-side validation
  API_GATEWAY = 'API_GATEWAY', // Error originated from API Gateway
  AUTH_SERVICE = 'AUTH_SERVICE', // Error originated from Auth Service
  HEALTH_SERVICE = 'HEALTH_SERVICE', // Error originated from Health Service
  CARE_SERVICE = 'CARE_SERVICE', // Error originated from Care Service
  PLAN_SERVICE = 'PLAN_SERVICE', // Error originated from Plan Service
  GAMIFICATION_ENGINE = 'GAMIFICATION_ENGINE', // Error from Gamification Engine
  NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE', // Error from Notification Service
  EXTERNAL_API = 'EXTERNAL_API', // Error from external API integration
  DATABASE = 'DATABASE',       // Error originated from database operation
  UNKNOWN = 'UNKNOWN',         // Error source could not be determined
}

/**
 * Base error interface that all error types extend
 */
export interface BaseError {
  code: ErrorCode | HealthErrorCode | CareErrorCode | PlanErrorCode | GamificationErrorCode;
  message: string;          // User-friendly error message
  severity: ErrorSeverity;  // Error severity level
  source: ErrorSource;      // Source of the error
  timestamp: string;        // ISO timestamp when error occurred
  requestId?: string;       // Optional request ID for tracing
  journeyContext?: string;  // Optional journey context (health, care, plan)
}

/**
 * REST API error response structure
 */
export interface RestApiError extends BaseError {
  status: number;           // HTTP status code
  path: string;             // API endpoint path
  details?: unknown;        // Additional error details
  stackTrace?: string;      // Stack trace (only in development)
}

/**
 * GraphQL error response structure
 */
export interface GraphQLError extends BaseError {
  locations?: Array<{ line: number; column: number }>; // Query locations
  path?: string[];          // Path to the field that caused the error
  extensions?: {            // GraphQL error extensions
    classification?: string; // Error classification
    [key: string]: unknown; // Additional extension fields
  };
}

/**
 * Field validation error structure
 */
export interface FieldValidationError {
  field: string;            // Field name with error
  message: string;          // Validation error message
  value?: unknown;          // Invalid value (if safe to return)
  rule?: string;            // Validation rule that failed
}

/**
 * Nested field validation error structure for complex forms
 */
export interface NestedValidationError {
  field: string;            // Parent field name
  index?: number;           // Index in array (for array fields)
  errors: FieldValidationError[]; // Nested field errors
}

/**
 * Form validation error response
 */
export interface ValidationErrorResponse extends BaseError {
  code: ErrorCode.VALIDATION_ERROR;
  fieldErrors: FieldValidationError[]; // Field-level errors
  nestedErrors?: NestedValidationError[]; // Nested validation errors
  formErrors?: string[];    // Form-level validation errors
}

/**
 * Error with retry information
 */
export interface RetryableError extends BaseError {
  retryable: boolean;       // Whether the operation can be retried
  retryAfter?: number;      // Suggested retry delay in milliseconds
  retryCount?: number;      // Current retry attempt count
  maxRetries?: number;      // Maximum number of retry attempts
}

/**
 * Error with recovery suggestions
 */
export interface RecoverableError extends BaseError {
  recoverySteps?: string[]; // Steps user can take to recover
  supportReference?: string; // Reference ID for support
  documentationUrl?: string; // URL to relevant documentation
}

/**
 * Composite error response that can be used for all error scenarios
 */
export interface ApiErrorResponse {
  error: BaseError;
  validation?: {
    fieldErrors: FieldValidationError[];
    formErrors?: string[];
  };
  retry?: {
    retryable: boolean;
    retryAfter?: number;
  };
  recovery?: {
    steps?: string[];
    supportReference?: string;
  };
}

/**
 * Type guard to check if an error is a validation error
 */
export function isValidationError(error: BaseError): error is ValidationErrorResponse {
  return error.code === ErrorCode.VALIDATION_ERROR;
}

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: BaseError): error is RetryableError {
  return 'retryable' in error && (error as RetryableError).retryable === true;
}

/**
 * Type guard to check if an error is from a specific journey
 */
export function isJourneyError(
  error: BaseError,
  journey: 'health' | 'care' | 'plan' | 'gamification'
): boolean {
  const code = error.code.toString();
  switch (journey) {
    case 'health':
      return code.startsWith('HEALTH_');
    case 'care':
      return code.startsWith('CARE_');
    case 'plan':
      return code.startsWith('PLAN_');
    case 'gamification':
      return code.startsWith('GAMIFICATION_');
    default:
      return false;
  }
}
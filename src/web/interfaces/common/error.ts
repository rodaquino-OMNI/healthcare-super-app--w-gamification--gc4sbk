/**
 * Common error interfaces and types for the AUSTA SuperApp
 * 
 * This file defines standardized error structures used throughout the application
 * for API responses, application exceptions, validation errors, and service errors.
 * These types ensure consistent error handling and reporting across all domains
 * and help maintain a unified error experience for users.
 */

import { ErrorCategory, ErrorSeverity } from './response';

/**
 * Base error code enum
 * Provides a standardized set of error codes that can be used across the application
 */
export enum ErrorCode {
  // General error codes
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Validation error codes
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_VALUE = 'INVALID_VALUE',
  
  // Authentication/Authorization error codes
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Resource error codes
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Business logic error codes
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE = 'INVALID_STATE',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // External service error codes
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_RESPONSE_ERROR = 'EXTERNAL_SERVICE_RESPONSE_ERROR',
  
  // Technical error codes
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

/**
 * Health journey specific error codes
 */
export enum HealthErrorCode {
  // Device connection errors
  DEVICE_CONNECTION_FAILED = 'HEALTH_DEVICE_CONNECTION_FAILED',
  DEVICE_SYNC_FAILED = 'HEALTH_DEVICE_SYNC_FAILED',
  DEVICE_NOT_SUPPORTED = 'HEALTH_DEVICE_NOT_SUPPORTED',
  DEVICE_ALREADY_CONNECTED = 'HEALTH_DEVICE_ALREADY_CONNECTED',
  
  // Health metric errors
  INVALID_METRIC_TYPE = 'HEALTH_INVALID_METRIC_TYPE',
  INVALID_METRIC_VALUE = 'HEALTH_INVALID_METRIC_VALUE',
  METRIC_NOT_FOUND = 'HEALTH_METRIC_NOT_FOUND',
  
  // Health goal errors
  GOAL_NOT_FOUND = 'HEALTH_GOAL_NOT_FOUND',
  INVALID_GOAL_TARGET = 'HEALTH_INVALID_GOAL_TARGET',
  GOAL_ALREADY_COMPLETED = 'HEALTH_GOAL_ALREADY_COMPLETED',
  
  // FHIR integration errors
  FHIR_INTEGRATION_ERROR = 'HEALTH_FHIR_INTEGRATION_ERROR',
  FHIR_RESOURCE_NOT_FOUND = 'HEALTH_FHIR_RESOURCE_NOT_FOUND',
  FHIR_INVALID_RESOURCE = 'HEALTH_FHIR_INVALID_RESOURCE',
}

/**
 * Care journey specific error codes
 */
export enum CareErrorCode {
  // Appointment errors
  APPOINTMENT_NOT_FOUND = 'CARE_APPOINTMENT_NOT_FOUND',
  APPOINTMENT_SLOT_UNAVAILABLE = 'CARE_APPOINTMENT_SLOT_UNAVAILABLE',
  APPOINTMENT_ALREADY_BOOKED = 'CARE_APPOINTMENT_ALREADY_BOOKED',
  APPOINTMENT_CANCELLATION_WINDOW_EXPIRED = 'CARE_APPOINTMENT_CANCELLATION_WINDOW_EXPIRED',
  
  // Provider errors
  PROVIDER_NOT_FOUND = 'CARE_PROVIDER_NOT_FOUND',
  PROVIDER_UNAVAILABLE = 'CARE_PROVIDER_UNAVAILABLE',
  
  // Medication errors
  MEDICATION_NOT_FOUND = 'CARE_MEDICATION_NOT_FOUND',
  MEDICATION_ALREADY_EXISTS = 'CARE_MEDICATION_ALREADY_EXISTS',
  INVALID_MEDICATION_DOSAGE = 'CARE_INVALID_MEDICATION_DOSAGE',
  
  // Telemedicine errors
  TELEMEDICINE_SESSION_NOT_FOUND = 'CARE_TELEMEDICINE_SESSION_NOT_FOUND',
  TELEMEDICINE_SESSION_EXPIRED = 'CARE_TELEMEDICINE_SESSION_EXPIRED',
  TELEMEDICINE_CONNECTION_ERROR = 'CARE_TELEMEDICINE_CONNECTION_ERROR',
  
  // Treatment errors
  TREATMENT_PLAN_NOT_FOUND = 'CARE_TREATMENT_PLAN_NOT_FOUND',
  TREATMENT_STEP_NOT_FOUND = 'CARE_TREATMENT_STEP_NOT_FOUND',
  INVALID_TREATMENT_PROGRESS = 'CARE_INVALID_TREATMENT_PROGRESS',
}

/**
 * Plan journey specific error codes
 */
export enum PlanErrorCode {
  // Plan errors
  PLAN_NOT_FOUND = 'PLAN_PLAN_NOT_FOUND',
  PLAN_NOT_ACTIVE = 'PLAN_PLAN_NOT_ACTIVE',
  
  // Benefit errors
  BENEFIT_NOT_FOUND = 'PLAN_BENEFIT_NOT_FOUND',
  BENEFIT_NOT_AVAILABLE = 'PLAN_BENEFIT_NOT_AVAILABLE',
  BENEFIT_LIMIT_REACHED = 'PLAN_BENEFIT_LIMIT_REACHED',
  
  // Coverage errors
  COVERAGE_NOT_FOUND = 'PLAN_COVERAGE_NOT_FOUND',
  SERVICE_NOT_COVERED = 'PLAN_SERVICE_NOT_COVERED',
  
  // Claim errors
  CLAIM_NOT_FOUND = 'PLAN_CLAIM_NOT_FOUND',
  CLAIM_ALREADY_SUBMITTED = 'PLAN_CLAIM_ALREADY_SUBMITTED',
  INVALID_CLAIM_AMOUNT = 'PLAN_INVALID_CLAIM_AMOUNT',
  MISSING_CLAIM_DOCUMENT = 'PLAN_MISSING_CLAIM_DOCUMENT',
  CLAIM_SUBMISSION_WINDOW_EXPIRED = 'PLAN_CLAIM_SUBMISSION_WINDOW_EXPIRED',
}

/**
 * Gamification journey specific error codes
 */
export enum GamificationErrorCode {
  // Achievement errors
  ACHIEVEMENT_NOT_FOUND = 'GAMIFICATION_ACHIEVEMENT_NOT_FOUND',
  ACHIEVEMENT_ALREADY_UNLOCKED = 'GAMIFICATION_ACHIEVEMENT_ALREADY_UNLOCKED',
  
  // Quest errors
  QUEST_NOT_FOUND = 'GAMIFICATION_QUEST_NOT_FOUND',
  QUEST_ALREADY_COMPLETED = 'GAMIFICATION_QUEST_ALREADY_COMPLETED',
  QUEST_NOT_ACTIVE = 'GAMIFICATION_QUEST_NOT_ACTIVE',
  QUEST_EXPIRED = 'GAMIFICATION_QUEST_EXPIRED',
  
  // Reward errors
  REWARD_NOT_FOUND = 'GAMIFICATION_REWARD_NOT_FOUND',
  INSUFFICIENT_POINTS = 'GAMIFICATION_INSUFFICIENT_POINTS',
  REWARD_ALREADY_CLAIMED = 'GAMIFICATION_REWARD_ALREADY_CLAIMED',
  REWARD_EXPIRED = 'GAMIFICATION_REWARD_EXPIRED',
  
  // Profile errors
  PROFILE_NOT_FOUND = 'GAMIFICATION_PROFILE_NOT_FOUND',
  INVALID_PROFILE_UPDATE = 'GAMIFICATION_INVALID_PROFILE_UPDATE',
  
  // Event errors
  INVALID_EVENT_TYPE = 'GAMIFICATION_INVALID_EVENT_TYPE',
  EVENT_PROCESSING_ERROR = 'GAMIFICATION_EVENT_PROCESSING_ERROR',
}

/**
 * Error type enum that categorizes errors by their source and nature
 */
export enum ErrorType {
  /** Errors related to input validation */
  VALIDATION = 'validation',
  /** Errors related to business rules and logic */
  BUSINESS = 'business',
  /** Errors related to technical/system issues */
  TECHNICAL = 'technical',
  /** Errors related to external services and integrations */
  EXTERNAL = 'external',
}

/**
 * Maps error types to their corresponding HTTP status codes
 */
export const ERROR_TYPE_STATUS_MAP: Record<ErrorType, number> = {
  [ErrorType.VALIDATION]: 400,
  [ErrorType.BUSINESS]: 422,
  [ErrorType.TECHNICAL]: 500,
  [ErrorType.EXTERNAL]: 503,
};

/**
 * Maps error categories to their corresponding error types
 */
export const ERROR_CATEGORY_TYPE_MAP: Record<ErrorCategory, ErrorType> = {
  [ErrorCategory.VALIDATION]: ErrorType.VALIDATION,
  [ErrorCategory.CLIENT]: ErrorType.VALIDATION,
  [ErrorCategory.AUTH]: ErrorType.BUSINESS,
  [ErrorCategory.BUSINESS]: ErrorType.BUSINESS,
  [ErrorCategory.SERVER]: ErrorType.TECHNICAL,
  [ErrorCategory.EXTERNAL]: ErrorType.EXTERNAL,
};

/**
 * Base error interface that all application errors implement
 */
export interface AppError {
  /** Unique error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Error type classification */
  type: ErrorType;
  /** Error category */
  category: ErrorCategory;
  /** Error severity level */
  severity: ErrorSeverity;
  /** HTTP status code */
  status: number;
  /** Stack trace (only in development) */
  stack?: string;
  /** Additional error context */
  context?: Record<string, unknown>;
  /** Journey identifier for journey-specific errors */
  journey?: 'health' | 'care' | 'plan' | 'gamification';
  /** Original error if this is a wrapped error */
  cause?: Error | AppError;
}

/**
 * Validation error interface for field-level validation errors
 */
export interface ValidationError extends AppError {
  type: ErrorType.VALIDATION;
  category: ErrorCategory.VALIDATION;
  /** The field that failed validation */
  field: string;
  /** The validation rule that failed */
  rule?: string;
  /** The expected value or pattern */
  expected?: string;
  /** The received value */
  received?: string;
}

/**
 * Business error interface for business rule violations
 */
export interface BusinessError extends AppError {
  type: ErrorType.BUSINESS;
  category: ErrorCategory.BUSINESS;
  /** The business rule that was violated */
  rule?: string;
}

/**
 * Technical error interface for system/infrastructure errors
 */
export interface TechnicalError extends AppError {
  type: ErrorType.TECHNICAL;
  category: ErrorCategory.SERVER;
  /** The component that experienced the error */
  component?: string;
  /** The operation that failed */
  operation?: string;
}

/**
 * External error interface for errors from external services
 */
export interface ExternalError extends AppError {
  type: ErrorType.EXTERNAL;
  category: ErrorCategory.EXTERNAL;
  /** The external service that experienced the error */
  service?: string;
  /** The external operation that failed */
  operation?: string;
  /** The external status code if available */
  externalStatus?: number | string;
}

/**
 * Health journey error interface
 */
export interface HealthError extends AppError {
  code: HealthErrorCode | ErrorCode;
  journey: 'health';
}

/**
 * Care journey error interface
 */
export interface CareError extends AppError {
  code: CareErrorCode | ErrorCode;
  journey: 'care';
}

/**
 * Plan journey error interface
 */
export interface PlanError extends AppError {
  code: PlanErrorCode | ErrorCode;
  journey: 'plan';
}

/**
 * Gamification journey error interface
 */
export interface GamificationError extends AppError {
  code: GamificationErrorCode | ErrorCode;
  journey: 'gamification';
}

/**
 * Error factory options interface
 */
export interface ErrorOptions {
  /** Error message */
  message?: string;
  /** Error code */
  code?: ErrorCode | HealthErrorCode | CareErrorCode | PlanErrorCode | GamificationErrorCode;
  /** Error type */
  type?: ErrorType;
  /** Error category */
  category?: ErrorCategory;
  /** Error severity */
  severity?: ErrorSeverity;
  /** HTTP status code */
  status?: number;
  /** Additional error context */
  context?: Record<string, unknown>;
  /** Journey identifier */
  journey?: 'health' | 'care' | 'plan' | 'gamification';
  /** Original error */
  cause?: Error | AppError;
}

/**
 * Validation error options interface
 */
export interface ValidationErrorOptions extends ErrorOptions {
  /** The field that failed validation */
  field: string;
  /** The validation rule that failed */
  rule?: string;
  /** The expected value or pattern */
  expected?: string;
  /** The received value */
  received?: string;
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'type' in error
  );
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    isAppError(error) &&
    error.type === ErrorType.VALIDATION &&
    'field' in error
  );
}

/**
 * Type guard to check if an error is a BusinessError
 */
export function isBusinessError(error: unknown): error is BusinessError {
  return (
    isAppError(error) &&
    error.type === ErrorType.BUSINESS
  );
}

/**
 * Type guard to check if an error is a TechnicalError
 */
export function isTechnicalError(error: unknown): error is TechnicalError {
  return (
    isAppError(error) &&
    error.type === ErrorType.TECHNICAL
  );
}

/**
 * Type guard to check if an error is an ExternalError
 */
export function isExternalError(error: unknown): error is ExternalError {
  return (
    isAppError(error) &&
    error.type === ErrorType.EXTERNAL
  );
}

/**
 * Type guard to check if an error is a journey-specific error
 */
export function isJourneyError(
  error: unknown,
  journey?: 'health' | 'care' | 'plan' | 'gamification'
): boolean {
  return (
    isAppError(error) &&
    'journey' in error &&
    (journey ? error.journey === journey : true)
  );
}

/**
 * Type guard to check if an error is a HealthError
 */
export function isHealthError(error: unknown): error is HealthError {
  return isJourneyError(error, 'health');
}

/**
 * Type guard to check if an error is a CareError
 */
export function isCareError(error: unknown): error is CareError {
  return isJourneyError(error, 'care');
}

/**
 * Type guard to check if an error is a PlanError
 */
export function isPlanError(error: unknown): error is PlanError {
  return isJourneyError(error, 'plan');
}

/**
 * Type guard to check if an error is a GamificationError
 */
export function isGamificationError(error: unknown): error is GamificationError {
  return isJourneyError(error, 'gamification');
}
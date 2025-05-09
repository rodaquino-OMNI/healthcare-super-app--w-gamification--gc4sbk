/**
 * @file constants.ts
 * @description Centralizes all error-related constants for the AUSTA SuperApp.
 * This file contains error codes, error messages, HTTP status code mappings,
 * and retry configuration parameters to ensure consistent error handling
 * across all services and journeys.
 */

import { HttpStatus } from '@nestjs/common';

/**
 * ------------------------------------------------
 * ERROR TYPE CONSTANTS
 * ------------------------------------------------
 */

/**
 * Base error types used across the application.
 * These are the fundamental categories for all errors.
 */
export enum ErrorType {
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
  EXTERNAL = 'external'
}

/**
 * ------------------------------------------------
 * ERROR CODE PREFIXES
 * ------------------------------------------------
 */

/**
 * Journey-specific error code prefixes.
 * These prefixes help identify which journey or service generated the error.
 */
export const ERROR_CODE_PREFIXES = {
  /**
   * General error prefix for non-journey specific errors
   */
  GENERAL: 'GEN',

  /**
   * Health journey error prefix
   */
  HEALTH: 'HEALTH',

  /**
   * Care journey error prefix
   */
  CARE: 'CARE',

  /**
   * Plan journey error prefix
   */
  PLAN: 'PLAN',

  /**
   * Authentication service error prefix
   */
  AUTH: 'AUTH',

  /**
   * Gamification engine error prefix
   */
  GAMIFICATION: 'GAME',

  /**
   * Notification service error prefix
   */
  NOTIFICATION: 'NOTIF'
};

/**
 * Health journey specific error code prefixes
 */
export const HEALTH_ERROR_PREFIXES = {
  METRICS: `${ERROR_CODE_PREFIXES.HEALTH}_METRICS`,
  GOALS: `${ERROR_CODE_PREFIXES.HEALTH}_GOALS`,
  INSIGHTS: `${ERROR_CODE_PREFIXES.HEALTH}_INSIGHTS`,
  DEVICES: `${ERROR_CODE_PREFIXES.HEALTH}_DEVICES`,
  FHIR: `${ERROR_CODE_PREFIXES.HEALTH}_FHIR`
};

/**
 * Care journey specific error code prefixes
 */
export const CARE_ERROR_PREFIXES = {
  APPOINTMENTS: `${ERROR_CODE_PREFIXES.CARE}_APPT`,
  MEDICATIONS: `${ERROR_CODE_PREFIXES.CARE}_MED`,
  PROVIDERS: `${ERROR_CODE_PREFIXES.CARE}_PROV`,
  TELEMEDICINE: `${ERROR_CODE_PREFIXES.CARE}_TELE`,
  TREATMENTS: `${ERROR_CODE_PREFIXES.CARE}_TREAT`,
  SYMPTOM_CHECKER: `${ERROR_CODE_PREFIXES.CARE}_SYMPT`
};

/**
 * Plan journey specific error code prefixes
 */
export const PLAN_ERROR_PREFIXES = {
  BENEFITS: `${ERROR_CODE_PREFIXES.PLAN}_BENEF`,
  CLAIMS: `${ERROR_CODE_PREFIXES.PLAN}_CLAIM`,
  COVERAGE: `${ERROR_CODE_PREFIXES.PLAN}_COVER`,
  DOCUMENTS: `${ERROR_CODE_PREFIXES.PLAN}_DOC`,
  PLANS: `${ERROR_CODE_PREFIXES.PLAN}_PLAN`
};

/**
 * ------------------------------------------------
 * HTTP STATUS CODE MAPPINGS
 * ------------------------------------------------
 */

/**
 * Maps error types to HTTP status codes.
 * Used for consistent HTTP responses across all services.
 */
export const ERROR_TYPE_TO_HTTP_STATUS: Record<ErrorType, HttpStatus> = {
  [ErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
  [ErrorType.BUSINESS]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ErrorType.TECHNICAL]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorType.EXTERNAL]: HttpStatus.BAD_GATEWAY
};

/**
 * Maps specific error scenarios to HTTP status codes.
 * Provides more granular control over HTTP responses.
 */
export const ERROR_SCENARIO_TO_HTTP_STATUS = {
  // Authentication errors
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  TOKEN_EXPIRED: HttpStatus.UNAUTHORIZED,
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  
  // Resource errors
  NOT_FOUND: HttpStatus.NOT_FOUND,
  ALREADY_EXISTS: HttpStatus.CONFLICT,
  CONFLICT: HttpStatus.CONFLICT,
  
  // Request errors
  BAD_REQUEST: HttpStatus.BAD_REQUEST,
  INVALID_PARAMETERS: HttpStatus.BAD_REQUEST,
  UNPROCESSABLE_ENTITY: HttpStatus.UNPROCESSABLE_ENTITY,
  
  // Server errors
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED: HttpStatus.NOT_IMPLEMENTED,
  SERVICE_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
  
  // External errors
  EXTERNAL_SERVICE_ERROR: HttpStatus.BAD_GATEWAY,
  GATEWAY_TIMEOUT: HttpStatus.GATEWAY_TIMEOUT,
  TOO_MANY_REQUESTS: HttpStatus.TOO_MANY_REQUESTS
};

/**
 * ------------------------------------------------
 * RETRY CONFIGURATION CONSTANTS
 * ------------------------------------------------
 */

/**
 * Default retry configuration for transient errors.
 * Used when no specific retry policy is defined.
 */
export const DEFAULT_RETRY_CONFIG = {
  /**
   * Maximum number of retry attempts
   */
  MAX_ATTEMPTS: 3,
  
  /**
   * Initial delay in milliseconds before the first retry
   */
  INITIAL_DELAY_MS: 1000,
  
  /**
   * Factor by which the delay increases with each retry (exponential backoff)
   */
  BACKOFF_FACTOR: 2,
  
  /**
   * Maximum delay in milliseconds between retries
   */
  MAX_DELAY_MS: 30000,
  
  /**
   * Whether to add jitter to retry delays to prevent thundering herd problems
   */
  USE_JITTER: true,
  
  /**
   * Maximum jitter percentage (0-1) to apply to the delay
   */
  JITTER_FACTOR: 0.25
};

/**
 * Retry configuration for database operations.
 * Optimized for database transient errors.
 */
export const DATABASE_RETRY_CONFIG = {
  MAX_ATTEMPTS: 5,
  INITIAL_DELAY_MS: 500,
  BACKOFF_FACTOR: 1.5,
  MAX_DELAY_MS: 10000,
  USE_JITTER: true,
  JITTER_FACTOR: 0.2
};

/**
 * Retry configuration for external API calls.
 * Optimized for network and external service transient errors.
 */
export const EXTERNAL_API_RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 2000,
  BACKOFF_FACTOR: 2,
  MAX_DELAY_MS: 20000,
  USE_JITTER: true,
  JITTER_FACTOR: 0.3
};

/**
 * Retry configuration for Kafka event processing.
 * Optimized for event processing and message broker transient errors.
 */
export const KAFKA_RETRY_CONFIG = {
  MAX_ATTEMPTS: 5,
  INITIAL_DELAY_MS: 1000,
  BACKOFF_FACTOR: 2,
  MAX_DELAY_MS: 60000,
  USE_JITTER: true,
  JITTER_FACTOR: 0.2
};

/**
 * Retry configuration for health-related external integrations.
 * Optimized for FHIR and healthcare data exchange.
 */
export const HEALTH_INTEGRATION_RETRY_CONFIG = {
  MAX_ATTEMPTS: 4,
  INITIAL_DELAY_MS: 2000,
  BACKOFF_FACTOR: 2,
  MAX_DELAY_MS: 30000,
  USE_JITTER: true,
  JITTER_FACTOR: 0.2
};

/**
 * Retry configuration for device synchronization.
 * Optimized for wearable device data synchronization.
 */
export const DEVICE_SYNC_RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 3000,
  BACKOFF_FACTOR: 1.5,
  MAX_DELAY_MS: 15000,
  USE_JITTER: true,
  JITTER_FACTOR: 0.2
};

/**
 * Retry configuration for notification delivery.
 * Optimized for notification service transient errors.
 */
export const NOTIFICATION_RETRY_CONFIG = {
  MAX_ATTEMPTS: 5,
  INITIAL_DELAY_MS: 1000,
  BACKOFF_FACTOR: 2,
  MAX_DELAY_MS: 60000,
  USE_JITTER: true,
  JITTER_FACTOR: 0.1
};

/**
 * Maps error types to appropriate retry configurations.
 * Used to determine the retry strategy based on the error type.
 */
export const ERROR_TYPE_TO_RETRY_CONFIG = {
  // Only retry technical and external errors by default
  [ErrorType.TECHNICAL]: DEFAULT_RETRY_CONFIG,
  [ErrorType.EXTERNAL]: EXTERNAL_API_RETRY_CONFIG,
  
  // Don't retry validation or business errors by default
  [ErrorType.VALIDATION]: null,
  [ErrorType.BUSINESS]: null
};

/**
 * HTTP status codes that are considered retryable.
 * Used to determine if a request should be retried based on the HTTP status code.
 */
export const RETRYABLE_HTTP_STATUS_CODES = [
  HttpStatus.TOO_MANY_REQUESTS, // 429
  HttpStatus.INTERNAL_SERVER_ERROR, // 500
  HttpStatus.BAD_GATEWAY, // 502
  HttpStatus.SERVICE_UNAVAILABLE, // 503
  HttpStatus.GATEWAY_TIMEOUT // 504
];

/**
 * ------------------------------------------------
 * ERROR MESSAGE TEMPLATES
 * ------------------------------------------------
 */

/**
 * Generic error message templates.
 * Used for common error scenarios across all services.
 */
export const ERROR_MESSAGES = {
  // Validation errors
  VALIDATION: {
    MISSING_REQUIRED_FIELD: 'The required field "{field}" is missing',
    INVALID_FORMAT: 'The field "{field}" has an invalid format',
    INVALID_VALUE: 'The value "{value}" is not valid for field "{field}"',
    INVALID_ENUM_VALUE: 'The value "{value}" is not a valid option for "{field}"',
    STRING_TOO_SHORT: 'The field "{field}" must be at least {min} characters long',
    STRING_TOO_LONG: 'The field "{field}" cannot exceed {max} characters',
    NUMBER_TOO_SMALL: 'The field "{field}" must be at least {min}',
    NUMBER_TOO_LARGE: 'The field "{field}" cannot exceed {max}',
    INVALID_DATE: 'The field "{field}" is not a valid date',
    FUTURE_DATE_REQUIRED: 'The field "{field}" must be a future date',
    PAST_DATE_REQUIRED: 'The field "{field}" must be a past date',
    INVALID_EMAIL: 'The provided email address is not valid',
    INVALID_PHONE: 'The provided phone number is not valid',
    INVALID_PASSWORD: 'Password does not meet the security requirements',
    PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
    INVALID_ID: 'The provided ID is not valid',
    INVALID_UUID: 'The provided UUID is not valid'
  },
  
  // Business errors
  BUSINESS: {
    RESOURCE_NOT_FOUND: 'The requested {resource} was not found',
    RESOURCE_ALREADY_EXISTS: 'A {resource} with this {identifier} already exists',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to {action} this {resource}',
    INVALID_STATE_TRANSITION: 'Cannot transition {resource} from {currentState} to {targetState}',
    BUSINESS_RULE_VIOLATION: 'The operation violates business rule: {rule}',
    DEPENDENCY_CONFLICT: 'This operation conflicts with existing {dependency}',
    LIMIT_EXCEEDED: 'You have exceeded the limit for {resource}',
    ACCOUNT_LOCKED: 'Your account has been locked due to {reason}',
    ACCOUNT_DISABLED: 'Your account has been disabled',
    INVALID_CREDENTIALS: 'The provided credentials are invalid',
    SESSION_EXPIRED: 'Your session has expired, please log in again',
    CONCURRENT_MODIFICATION: 'The {resource} was modified by another user'
  },
  
  // Technical errors
  TECHNICAL: {
    INTERNAL_ERROR: 'An unexpected error occurred',
    DATABASE_ERROR: 'A database error occurred: {details}',
    TRANSACTION_FAILED: 'The database transaction failed',
    CONNECTION_ERROR: 'Failed to connect to {service}',
    TIMEOUT: 'The operation timed out after {duration}ms',
    SERIALIZATION_ERROR: 'Failed to serialize data',
    DESERIALIZATION_ERROR: 'Failed to deserialize data',
    CONFIGURATION_ERROR: 'Invalid configuration: {details}',
    FILE_SYSTEM_ERROR: 'File system operation failed: {details}',
    MEMORY_ERROR: 'Insufficient memory to complete the operation',
    UNEXPECTED_STATE: 'The system encountered an unexpected state',
    SERVICE_UNAVAILABLE: 'The service is currently unavailable',
    MAINTENANCE_MODE: 'The system is currently in maintenance mode'
  },
  
  // External errors
  EXTERNAL: {
    EXTERNAL_SERVICE_ERROR: 'An error occurred in an external service: {service}',
    EXTERNAL_SERVICE_TIMEOUT: 'The external service {service} timed out',
    EXTERNAL_SERVICE_UNAVAILABLE: 'The external service {service} is currently unavailable',
    EXTERNAL_RESPONSE_FORMAT_ERROR: 'Received an invalid response format from {service}',
    EXTERNAL_AUTHENTICATION_FAILED: 'Authentication failed with external service {service}',
    EXTERNAL_AUTHORIZATION_FAILED: 'Authorization failed with external service {service}',
    EXTERNAL_RATE_LIMIT_EXCEEDED: 'Rate limit exceeded for external service {service}',
    EXTERNAL_QUOTA_EXCEEDED: 'Quota exceeded for external service {service}',
    EXTERNAL_REQUEST_REJECTED: 'Request rejected by external service {service}: {reason}',
    EXTERNAL_DEPENDENCY_FAILED: 'A required external dependency {dependency} is unavailable'
  }
};

/**
 * Health journey specific error message templates.
 */
export const HEALTH_ERROR_MESSAGES = {
  METRICS: {
    INVALID_METRIC_VALUE: 'The provided value {value} is not valid for metric type {metricType}',
    METRIC_NOT_FOUND: 'The requested health metric was not found',
    INVALID_METRIC_DATE: 'The provided date is not valid for this metric',
    METRIC_THRESHOLD_EXCEEDED: 'The metric value exceeds the defined threshold',
    DUPLICATE_METRIC_ENTRY: 'A metric entry already exists for this timestamp',
    METRIC_VALIDATION_FAILED: 'The metric data failed validation: {details}'
  },
  GOALS: {
    GOAL_NOT_FOUND: 'The requested health goal was not found',
    INVALID_GOAL_PARAMETERS: 'The goal parameters are invalid: {details}',
    GOAL_ALREADY_COMPLETED: 'This health goal has already been completed',
    GOAL_ALREADY_EXISTS: 'A similar health goal already exists',
    CONFLICTING_GOALS: 'This goal conflicts with an existing goal: {conflictingGoal}',
    UNACHIEVABLE_GOAL: 'The goal parameters are not achievable based on your health profile'
  },
  INSIGHTS: {
    INSUFFICIENT_DATA: 'Not enough data to generate health insights',
    INSIGHT_GENERATION_FAILED: 'Failed to generate health insights: {reason}',
    INVALID_INSIGHT_TYPE: 'The requested insight type is not supported',
    INSIGHT_NOT_AVAILABLE: 'Health insights are not available for your profile',
    INSIGHT_PROCESSING_ERROR: 'An error occurred while processing health data for insights'
  },
  DEVICES: {
    DEVICE_CONNECTION_FAILED: 'Failed to connect to device: {reason}',
    DEVICE_SYNC_FAILED: 'Failed to synchronize data from device: {reason}',
    DEVICE_NOT_SUPPORTED: 'The device type {deviceType} is not supported',
    DEVICE_AUTHENTICATION_FAILED: 'Authentication with the device failed',
    DEVICE_ALREADY_CONNECTED: 'This device is already connected to another account',
    INVALID_DEVICE_DATA: 'The data received from the device is invalid'
  },
  FHIR: {
    FHIR_CONNECTION_FAILED: 'Failed to connect to FHIR server: {reason}',
    INVALID_FHIR_RESOURCE: 'The FHIR resource is invalid: {details}',
    FHIR_RESOURCE_NOT_FOUND: 'The requested FHIR resource was not found',
    FHIR_OPERATION_FAILED: 'The FHIR operation failed: {operation}',
    FHIR_VALIDATION_ERROR: 'The FHIR resource failed validation: {details}',
    UNSUPPORTED_FHIR_VERSION: 'The FHIR version is not supported: {version}'
  }
};

/**
 * Care journey specific error message templates.
 */
export const CARE_ERROR_MESSAGES = {
  APPOINTMENTS: {
    APPOINTMENT_NOT_FOUND: 'The requested appointment was not found',
    APPOINTMENT_SLOT_UNAVAILABLE: 'The requested appointment slot is no longer available',
    APPOINTMENT_BOOKING_FAILED: 'Failed to book the appointment: {reason}',
    APPOINTMENT_CANCELLATION_FAILED: 'Failed to cancel the appointment: {reason}',
    APPOINTMENT_RESCHEDULE_FAILED: 'Failed to reschedule the appointment: {reason}',
    APPOINTMENT_ALREADY_CONFIRMED: 'This appointment is already confirmed',
    APPOINTMENT_ALREADY_CANCELLED: 'This appointment has already been cancelled',
    APPOINTMENT_IN_PAST: 'Cannot modify an appointment that has already occurred'
  },
  MEDICATIONS: {
    MEDICATION_NOT_FOUND: 'The requested medication was not found',
    INVALID_MEDICATION_DOSAGE: 'The medication dosage is invalid',
    MEDICATION_INTERACTION_DETECTED: 'A potential medication interaction was detected',
    MEDICATION_ALREADY_EXISTS: 'This medication is already in your list',
    MEDICATION_ADHERENCE_RECORD_FAILED: 'Failed to record medication adherence: {reason}',
    INVALID_MEDICATION_SCHEDULE: 'The medication schedule is invalid: {details}'
  },
  PROVIDERS: {
    PROVIDER_NOT_FOUND: 'The requested healthcare provider was not found',
    PROVIDER_UNAVAILABLE: 'The selected provider is not available',
    PROVIDER_NOT_ACCEPTING_PATIENTS: 'This provider is not accepting new patients',
    INVALID_PROVIDER_SPECIALTY: 'The provider specialty is invalid',
    PROVIDER_SEARCH_FAILED: 'The provider search failed: {reason}',
    PROVIDER_OUTSIDE_NETWORK: 'This provider is outside of your insurance network'
  },
  TELEMEDICINE: {
    SESSION_CREATION_FAILED: 'Failed to create telemedicine session: {reason}',
    SESSION_JOIN_FAILED: 'Failed to join telemedicine session: {reason}',
    SESSION_NOT_FOUND: 'The telemedicine session was not found',
    SESSION_EXPIRED: 'The telemedicine session has expired',
    SESSION_ALREADY_ENDED: 'The telemedicine session has already ended',
    INCOMPATIBLE_DEVICE: 'Your device does not meet the requirements for telemedicine'
  },
  TREATMENTS: {
    TREATMENT_NOT_FOUND: 'The requested treatment plan was not found',
    TREATMENT_UPDATE_FAILED: 'Failed to update treatment plan: {reason}',
    INVALID_TREATMENT_PARAMETERS: 'The treatment parameters are invalid: {details}',
    TREATMENT_ALREADY_COMPLETED: 'This treatment has already been completed',
    TREATMENT_CONTRAINDICATION: 'A contraindication was detected for this treatment',
    TREATMENT_REQUIRES_APPROVAL: 'This treatment requires provider approval'
  },
  SYMPTOM_CHECKER: {
    SYMPTOM_CHECK_FAILED: 'The symptom check failed: {reason}',
    INSUFFICIENT_SYMPTOMS: 'Please provide more symptoms for accurate assessment',
    EMERGENCY_DETECTED: 'Your symptoms may indicate a medical emergency. Please seek immediate care.',
    INVALID_SYMPTOM: 'One or more symptoms are not recognized',
    SYMPTOM_DATA_INCOMPLETE: 'The symptom data is incomplete: {details}',
    ASSESSMENT_UNAVAILABLE: 'Symptom assessment is currently unavailable'
  }
};

/**
 * Plan journey specific error message templates.
 */
export const PLAN_ERROR_MESSAGES = {
  BENEFITS: {
    BENEFIT_NOT_FOUND: 'The requested benefit was not found',
    BENEFIT_NOT_COVERED: 'This benefit is not covered by your plan',
    BENEFIT_LIMIT_REACHED: 'You have reached the limit for this benefit',
    BENEFIT_REQUIRES_AUTHORIZATION: 'This benefit requires prior authorization',
    BENEFIT_VERIFICATION_FAILED: 'Failed to verify benefit eligibility: {reason}',
    BENEFIT_PERIOD_EXPIRED: 'The benefit period has expired'
  },
  CLAIMS: {
    CLAIM_NOT_FOUND: 'The requested claim was not found',
    CLAIM_SUBMISSION_FAILED: 'Failed to submit claim: {reason}',
    INVALID_CLAIM_DATA: 'The claim data is invalid: {details}',
    DUPLICATE_CLAIM: 'A similar claim has already been submitted',
    CLAIM_PROCESSING_ERROR: 'An error occurred while processing the claim',
    CLAIM_DOCUMENTATION_MISSING: 'Required documentation is missing for this claim'
  },
  COVERAGE: {
    COVERAGE_NOT_FOUND: 'The requested coverage information was not found',
    SERVICE_NOT_COVERED: 'This service is not covered by your plan',
    COVERAGE_VERIFICATION_FAILED: 'Failed to verify coverage: {reason}',
    COVERAGE_EXPIRED: 'Your coverage has expired',
    COVERAGE_NOT_ACTIVE: 'Your coverage is not active',
    OUT_OF_NETWORK: 'This service is out of network'
  },
  DOCUMENTS: {
    DOCUMENT_NOT_FOUND: 'The requested document was not found',
    DOCUMENT_UPLOAD_FAILED: 'Failed to upload document: {reason}',
    INVALID_DOCUMENT_TYPE: 'The document type is not supported',
    DOCUMENT_TOO_LARGE: 'The document exceeds the maximum allowed size',
    DOCUMENT_PROCESSING_ERROR: 'An error occurred while processing the document',
    DOCUMENT_ACCESS_DENIED: 'You do not have permission to access this document'
  },
  PLANS: {
    PLAN_NOT_FOUND: 'The requested insurance plan was not found',
    PLAN_NOT_AVAILABLE: 'This plan is not available in your region',
    PLAN_ENROLLMENT_FAILED: 'Failed to enroll in plan: {reason}',
    PLAN_COMPARISON_FAILED: 'Failed to compare plans: {reason}',
    INVALID_PLAN_SELECTION: 'The selected plan is invalid',
    ENROLLMENT_PERIOD_CLOSED: 'The enrollment period is closed'
  }
};

/**
 * Authentication specific error message templates.
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'The provided username or password is incorrect',
  ACCOUNT_LOCKED: 'Your account has been locked due to too many failed login attempts',
  ACCOUNT_DISABLED: 'Your account has been disabled',
  TOKEN_EXPIRED: 'Your authentication token has expired',
  INVALID_TOKEN: 'The provided authentication token is invalid',
  REFRESH_TOKEN_EXPIRED: 'Your refresh token has expired, please log in again',
  INVALID_REFRESH_TOKEN: 'The provided refresh token is invalid',
  SESSION_EXPIRED: 'Your session has expired, please log in again',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  MFA_REQUIRED: 'Multi-factor authentication is required',
  MFA_FAILED: 'Multi-factor authentication failed',
  PASSWORD_CHANGE_REQUIRED: 'You must change your password before continuing',
  PASSWORD_RECENTLY_USED: 'You cannot reuse a recently used password',
  PASSWORD_TOO_WEAK: 'The provided password does not meet the security requirements',
  INVALID_RESET_TOKEN: 'The password reset token is invalid or has expired',
  EMAIL_VERIFICATION_REQUIRED: 'You must verify your email address before continuing',
  SOCIAL_AUTH_FAILED: 'Social authentication failed: {provider}',
  DEVICE_NOT_RECOGNIZED: 'Login attempt from an unrecognized device'
};

/**
 * Gamification specific error message templates.
 */
export const GAMIFICATION_ERROR_MESSAGES = {
  ACHIEVEMENT_NOT_FOUND: 'The requested achievement was not found',
  ACHIEVEMENT_ALREADY_UNLOCKED: 'This achievement has already been unlocked',
  ACHIEVEMENT_REQUIREMENTS_NOT_MET: 'The requirements for this achievement have not been met',
  QUEST_NOT_FOUND: 'The requested quest was not found',
  QUEST_ALREADY_COMPLETED: 'This quest has already been completed',
  QUEST_NOT_AVAILABLE: 'This quest is not currently available',
  QUEST_EXPIRED: 'This quest has expired',
  REWARD_NOT_FOUND: 'The requested reward was not found',
  REWARD_ALREADY_CLAIMED: 'This reward has already been claimed',
  INSUFFICIENT_POINTS: 'You do not have enough points to claim this reward',
  PROFILE_NOT_FOUND: 'The gamification profile was not found',
  EVENT_PROCESSING_FAILED: 'Failed to process gamification event: {reason}',
  INVALID_EVENT_TYPE: 'The event type is not recognized',
  RULE_EVALUATION_FAILED: 'Failed to evaluate gamification rule: {reason}',
  LEADERBOARD_ERROR: 'An error occurred with the leaderboard: {reason}'
};

/**
 * Notification specific error message templates.
 */
export const NOTIFICATION_ERROR_MESSAGES = {
  NOTIFICATION_SEND_FAILED: 'Failed to send notification: {reason}',
  INVALID_NOTIFICATION_TYPE: 'The notification type is not supported',
  NOTIFICATION_NOT_FOUND: 'The requested notification was not found',
  CHANNEL_UNAVAILABLE: 'The notification channel is currently unavailable',
  DELIVERY_FAILED: 'Notification delivery failed: {reason}',
  TEMPLATE_NOT_FOUND: 'The notification template was not found',
  TEMPLATE_RENDERING_FAILED: 'Failed to render notification template: {reason}',
  INVALID_RECIPIENT: 'The notification recipient is invalid',
  RATE_LIMIT_EXCEEDED: 'Notification rate limit exceeded',
  PREFERENCES_NOT_FOUND: 'Notification preferences not found',
  CHANNEL_DISABLED_BY_USER: 'This notification channel has been disabled by the user',
  PUSH_TOKEN_INVALID: 'The push notification token is invalid',
  EMAIL_DELIVERY_FAILED: 'Failed to deliver email: {reason}',
  SMS_DELIVERY_FAILED: 'Failed to deliver SMS: {reason}',
  WEBSOCKET_DELIVERY_FAILED: 'Failed to deliver websocket notification: {reason}'
};
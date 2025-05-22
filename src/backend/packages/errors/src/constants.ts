/**
 * @file constants.ts
 * @description Centralizes all error-related constants for the AUSTA SuperApp
 * 
 * This file contains error codes, error messages, HTTP status code mappings,
 * and retry configuration parameters to ensure consistent error handling
 * across all services and journeys.
 */

import { HttpStatus } from '@nestjs/common';

/**
 * Error types used for categorizing errors across the application
 */
export enum ErrorType {
  /** Validation errors (e.g., invalid input data) */
  VALIDATION = 'VALIDATION',
  /** Business logic errors (e.g., insufficient funds) */
  BUSINESS = 'BUSINESS',
  /** External system errors (e.g., third-party API failure) */
  EXTERNAL = 'EXTERNAL',
  /** Technical/system errors (e.g., database connection failure) */
  TECHNICAL = 'TECHNICAL',
}

/**
 * Maps error types to HTTP status codes
 */
export const ERROR_TYPE_TO_HTTP_STATUS: Record<ErrorType, HttpStatus> = {
  [ErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
  [ErrorType.BUSINESS]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ErrorType.EXTERNAL]: HttpStatus.BAD_GATEWAY,
  [ErrorType.TECHNICAL]: HttpStatus.INTERNAL_SERVER_ERROR,
};

/**
 * Journey-specific error code prefixes
 */
export const ERROR_CODE_PREFIXES = {
  /** Health journey error prefix */
  HEALTH: 'HEALTH_',
  /** Care journey error prefix */
  CARE: 'CARE_',
  /** Plan journey error prefix */
  PLAN: 'PLAN_',
  /** Gamification error prefix */
  GAMIFICATION: 'GAMIFICATION_',
  /** Authentication error prefix */
  AUTH: 'AUTH_',
  /** General error prefix */
  GENERAL: 'GENERAL_',
};

/**
 * Common error codes used across all journeys
 */
export const COMMON_ERROR_CODES = {
  /** General validation error */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Resource not found */
  NOT_FOUND: 'NOT_FOUND',
  /** Unauthorized access */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** Forbidden access */
  FORBIDDEN: 'FORBIDDEN',
  /** Internal server error */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** External service error */
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  /** Database error */
  DATABASE_ERROR: 'DATABASE_ERROR',
  /** Request timeout */
  TIMEOUT: 'TIMEOUT',
  /** Too many requests */
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  /** Conflict with current state */
  CONFLICT: 'CONFLICT',
};

/**
 * Health journey specific error codes
 */
export const HEALTH_ERROR_CODES = {
  /** Device connection failed */
  DEVICE_CONNECTION_FAILED: `${ERROR_CODE_PREFIXES.HEALTH}DEVICE_CONNECTION_FAILED`,
  /** Health metric validation failed */
  INVALID_HEALTH_METRIC: `${ERROR_CODE_PREFIXES.HEALTH}INVALID_HEALTH_METRIC`,
  /** Health goal not achievable */
  INVALID_HEALTH_GOAL: `${ERROR_CODE_PREFIXES.HEALTH}INVALID_HEALTH_GOAL`,
  /** FHIR integration error */
  FHIR_INTEGRATION_ERROR: `${ERROR_CODE_PREFIXES.HEALTH}FHIR_INTEGRATION_ERROR`,
  /** Wearable device sync failed */
  WEARABLE_SYNC_FAILED: `${ERROR_CODE_PREFIXES.HEALTH}WEARABLE_SYNC_FAILED`,
};

/**
 * Care journey specific error codes
 */
export const CARE_ERROR_CODES = {
  /** Provider not available */
  PROVIDER_UNAVAILABLE: `${ERROR_CODE_PREFIXES.CARE}PROVIDER_UNAVAILABLE`,
  /** Appointment slot not available */
  APPOINTMENT_UNAVAILABLE: `${ERROR_CODE_PREFIXES.CARE}APPOINTMENT_UNAVAILABLE`,
  /** Telemedicine session failed */
  TELEMEDICINE_ERROR: `${ERROR_CODE_PREFIXES.CARE}TELEMEDICINE_ERROR`,
  /** Medication not found */
  MEDICATION_NOT_FOUND: `${ERROR_CODE_PREFIXES.CARE}MEDICATION_NOT_FOUND`,
  /** Treatment plan validation failed */
  INVALID_TREATMENT_PLAN: `${ERROR_CODE_PREFIXES.CARE}INVALID_TREATMENT_PLAN`,
};

/**
 * Plan journey specific error codes
 */
export const PLAN_ERROR_CODES = {
  /** Benefit not available */
  BENEFIT_UNAVAILABLE: `${ERROR_CODE_PREFIXES.PLAN}BENEFIT_UNAVAILABLE`,
  /** Claim submission failed */
  CLAIM_SUBMISSION_FAILED: `${ERROR_CODE_PREFIXES.PLAN}CLAIM_SUBMISSION_FAILED`,
  /** Coverage verification failed */
  COVERAGE_VERIFICATION_FAILED: `${ERROR_CODE_PREFIXES.PLAN}COVERAGE_VERIFICATION_FAILED`,
  /** Document upload failed */
  DOCUMENT_UPLOAD_FAILED: `${ERROR_CODE_PREFIXES.PLAN}DOCUMENT_UPLOAD_FAILED`,
  /** Plan not eligible */
  PLAN_NOT_ELIGIBLE: `${ERROR_CODE_PREFIXES.PLAN}PLAN_NOT_ELIGIBLE`,
};

/**
 * Gamification specific error codes
 */
export const GAMIFICATION_ERROR_CODES = {
  /** Achievement not found */
  ACHIEVEMENT_NOT_FOUND: `${ERROR_CODE_PREFIXES.GAMIFICATION}ACHIEVEMENT_NOT_FOUND`,
  /** Quest not available */
  QUEST_UNAVAILABLE: `${ERROR_CODE_PREFIXES.GAMIFICATION}QUEST_UNAVAILABLE`,
  /** Reward redemption failed */
  REWARD_REDEMPTION_FAILED: `${ERROR_CODE_PREFIXES.GAMIFICATION}REWARD_REDEMPTION_FAILED`,
  /** Event processing failed */
  EVENT_PROCESSING_FAILED: `${ERROR_CODE_PREFIXES.GAMIFICATION}EVENT_PROCESSING_FAILED`,
  /** Profile update failed */
  PROFILE_UPDATE_FAILED: `${ERROR_CODE_PREFIXES.GAMIFICATION}PROFILE_UPDATE_FAILED`,
};

/**
 * Authentication specific error codes
 */
export const AUTH_ERROR_CODES = {
  /** Invalid credentials */
  INVALID_CREDENTIALS: `${ERROR_CODE_PREFIXES.AUTH}INVALID_CREDENTIALS`,
  /** Token expired */
  TOKEN_EXPIRED: `${ERROR_CODE_PREFIXES.AUTH}TOKEN_EXPIRED`,
  /** Invalid token */
  INVALID_TOKEN: `${ERROR_CODE_PREFIXES.AUTH}INVALID_TOKEN`,
  /** Account locked */
  ACCOUNT_LOCKED: `${ERROR_CODE_PREFIXES.AUTH}ACCOUNT_LOCKED`,
  /** Session expired */
  SESSION_EXPIRED: `${ERROR_CODE_PREFIXES.AUTH}SESSION_EXPIRED`,
};

/**
 * Standard error message templates
 */
export const ERROR_MESSAGES = {
  // Common error messages
  [COMMON_ERROR_CODES.VALIDATION_ERROR]: 'The provided data is invalid',
  [COMMON_ERROR_CODES.NOT_FOUND]: 'The requested resource was not found',
  [COMMON_ERROR_CODES.UNAUTHORIZED]: 'Authentication is required to access this resource',
  [COMMON_ERROR_CODES.FORBIDDEN]: 'You do not have permission to access this resource',
  [COMMON_ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred',
  [COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'An external service is currently unavailable',
  [COMMON_ERROR_CODES.DATABASE_ERROR]: 'A database error occurred',
  [COMMON_ERROR_CODES.TIMEOUT]: 'The request timed out',
  [COMMON_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests, please try again later',
  [COMMON_ERROR_CODES.CONFLICT]: 'The request conflicts with the current state',
  
  // Health journey error messages
  [HEALTH_ERROR_CODES.DEVICE_CONNECTION_FAILED]: 'Failed to connect to the health device',
  [HEALTH_ERROR_CODES.INVALID_HEALTH_METRIC]: 'The health metric data is invalid',
  [HEALTH_ERROR_CODES.INVALID_HEALTH_GOAL]: 'The health goal is not achievable or invalid',
  [HEALTH_ERROR_CODES.FHIR_INTEGRATION_ERROR]: 'Failed to integrate with FHIR health records',
  [HEALTH_ERROR_CODES.WEARABLE_SYNC_FAILED]: 'Failed to synchronize with wearable device',
  
  // Care journey error messages
  [CARE_ERROR_CODES.PROVIDER_UNAVAILABLE]: 'The healthcare provider is currently unavailable',
  [CARE_ERROR_CODES.APPOINTMENT_UNAVAILABLE]: 'The requested appointment slot is not available',
  [CARE_ERROR_CODES.TELEMEDICINE_ERROR]: 'The telemedicine session encountered an error',
  [CARE_ERROR_CODES.MEDICATION_NOT_FOUND]: 'The requested medication was not found',
  [CARE_ERROR_CODES.INVALID_TREATMENT_PLAN]: 'The treatment plan is invalid',
  
  // Plan journey error messages
  [PLAN_ERROR_CODES.BENEFIT_UNAVAILABLE]: 'The requested benefit is not available',
  [PLAN_ERROR_CODES.CLAIM_SUBMISSION_FAILED]: 'Failed to submit the insurance claim',
  [PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED]: 'Failed to verify coverage',
  [PLAN_ERROR_CODES.DOCUMENT_UPLOAD_FAILED]: 'Failed to upload the document',
  [PLAN_ERROR_CODES.PLAN_NOT_ELIGIBLE]: 'You are not eligible for this plan',
  
  // Gamification error messages
  [GAMIFICATION_ERROR_CODES.ACHIEVEMENT_NOT_FOUND]: 'The achievement was not found',
  [GAMIFICATION_ERROR_CODES.QUEST_UNAVAILABLE]: 'The quest is not available',
  [GAMIFICATION_ERROR_CODES.REWARD_REDEMPTION_FAILED]: 'Failed to redeem the reward',
  [GAMIFICATION_ERROR_CODES.EVENT_PROCESSING_FAILED]: 'Failed to process the gamification event',
  [GAMIFICATION_ERROR_CODES.PROFILE_UPDATE_FAILED]: 'Failed to update the gamification profile',
  
  // Authentication error messages
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 'The provided credentials are invalid',
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: 'Your authentication token has expired',
  [AUTH_ERROR_CODES.INVALID_TOKEN]: 'The authentication token is invalid',
  [AUTH_ERROR_CODES.ACCOUNT_LOCKED]: 'Your account has been locked',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired, please log in again',
};

/**
 * Retry configuration for transient errors
 */
export const RETRY_CONFIG = {
  /** Default retry configuration */
  DEFAULT: {
    /** Maximum number of retry attempts */
    MAX_ATTEMPTS: 3,
    /** Initial delay in milliseconds */
    INITIAL_DELAY_MS: 100,
    /** Maximum delay in milliseconds */
    MAX_DELAY_MS: 5000,
    /** Backoff factor for exponential backoff */
    BACKOFF_FACTOR: 2,
    /** Jitter factor to add randomness to retry delays */
    JITTER_FACTOR: 0.1,
  },
  
  /** Retry configuration for database operations */
  DATABASE: {
    /** Maximum number of retry attempts */
    MAX_ATTEMPTS: 5,
    /** Initial delay in milliseconds */
    INITIAL_DELAY_MS: 200,
    /** Maximum delay in milliseconds */
    MAX_DELAY_MS: 10000,
    /** Backoff factor for exponential backoff */
    BACKOFF_FACTOR: 2,
    /** Jitter factor to add randomness to retry delays */
    JITTER_FACTOR: 0.2,
  },
  
  /** Retry configuration for external API calls */
  EXTERNAL_API: {
    /** Maximum number of retry attempts */
    MAX_ATTEMPTS: 3,
    /** Initial delay in milliseconds */
    INITIAL_DELAY_MS: 500,
    /** Maximum delay in milliseconds */
    MAX_DELAY_MS: 15000,
    /** Backoff factor for exponential backoff */
    BACKOFF_FACTOR: 3,
    /** Jitter factor to add randomness to retry delays */
    JITTER_FACTOR: 0.3,
  },
  
  /** Retry configuration for event processing */
  EVENT_PROCESSING: {
    /** Maximum number of retry attempts */
    MAX_ATTEMPTS: 10,
    /** Initial delay in milliseconds */
    INITIAL_DELAY_MS: 1000,
    /** Maximum delay in milliseconds */
    MAX_DELAY_MS: 60000,
    /** Backoff factor for exponential backoff */
    BACKOFF_FACTOR: 2,
    /** Jitter factor to add randomness to retry delays */
    JITTER_FACTOR: 0.2,
  },
  
  /** Retry configuration for notification delivery */
  NOTIFICATION: {
    /** Maximum number of retry attempts */
    MAX_ATTEMPTS: 5,
    /** Initial delay in milliseconds */
    INITIAL_DELAY_MS: 5000,
    /** Maximum delay in milliseconds */
    MAX_DELAY_MS: 300000, // 5 minutes
    /** Backoff factor for exponential backoff */
    BACKOFF_FACTOR: 2,
    /** Jitter factor to add randomness to retry delays */
    JITTER_FACTOR: 0.1,
  },
};

/**
 * Dead Letter Queue (DLQ) configuration
 */
export const DLQ_CONFIG = {
  /** Maximum number of items to process in a batch */
  BATCH_SIZE: 10,
  /** Processing interval in milliseconds */
  PROCESSING_INTERVAL_MS: 60000, // 1 minute
  /** Maximum age of items to retry (in milliseconds) */
  MAX_AGE_MS: 86400000, // 24 hours
  /** Maximum number of retries before permanent failure */
  MAX_RETRIES: 5,
};

/**
 * Circuit breaker configuration
 */
export const CIRCUIT_BREAKER_CONFIG = {
  /** Default circuit breaker configuration */
  DEFAULT: {
    /** Failure threshold percentage to trip the circuit */
    FAILURE_THRESHOLD_PERCENTAGE: 50,
    /** Number of requests to sample for threshold calculation */
    REQUEST_VOLUME_THRESHOLD: 20,
    /** Time window for request volume threshold in milliseconds */
    ROLLING_WINDOW_MS: 10000, // 10 seconds
    /** Time to wait before attempting to close the circuit in milliseconds */
    RESET_TIMEOUT_MS: 30000, // 30 seconds
  },
  
  /** Circuit breaker configuration for critical services */
  CRITICAL: {
    /** Failure threshold percentage to trip the circuit */
    FAILURE_THRESHOLD_PERCENTAGE: 25,
    /** Number of requests to sample for threshold calculation */
    REQUEST_VOLUME_THRESHOLD: 10,
    /** Time window for request volume threshold in milliseconds */
    ROLLING_WINDOW_MS: 5000, // 5 seconds
    /** Time to wait before attempting to close the circuit in milliseconds */
    RESET_TIMEOUT_MS: 15000, // 15 seconds
  },
  
  /** Circuit breaker configuration for non-critical services */
  NON_CRITICAL: {
    /** Failure threshold percentage to trip the circuit */
    FAILURE_THRESHOLD_PERCENTAGE: 75,
    /** Number of requests to sample for threshold calculation */
    REQUEST_VOLUME_THRESHOLD: 30,
    /** Time window for request volume threshold in milliseconds */
    ROLLING_WINDOW_MS: 20000, // 20 seconds
    /** Time to wait before attempting to close the circuit in milliseconds */
    RESET_TIMEOUT_MS: 60000, // 60 seconds
  },
};

/**
 * Fallback strategy configuration
 */
export const FALLBACK_STRATEGY = {
  /** Use cached data when available */
  USE_CACHED_DATA: 'USE_CACHED_DATA',
  /** Use default values */
  USE_DEFAULT_VALUES: 'USE_DEFAULT_VALUES',
  /** Gracefully degrade functionality */
  GRACEFUL_DEGRADATION: 'GRACEFUL_DEGRADATION',
  /** Return empty result */
  RETURN_EMPTY: 'RETURN_EMPTY',
  /** Fail fast with error */
  FAIL_FAST: 'FAIL_FAST',
};

/**
 * Cache configuration for fallback strategies
 */
export const CACHE_CONFIG = {
  /** Default TTL for cached items in milliseconds */
  DEFAULT_TTL_MS: 300000, // 5 minutes
  /** Extended TTL for cached items during degraded service in milliseconds */
  DEGRADED_SERVICE_TTL_MS: 1800000, // 30 minutes
  /** Maximum size of the cache (number of items) */
  MAX_ITEMS: 1000,
};
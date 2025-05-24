/**
 * Error handling interfaces for the AUSTA SuperApp
 * 
 * This file defines comprehensive TypeScript interfaces for API error handling,
 * including error code enumerations, journey-specific error types, error response
 * structures, and validation error formats. These interfaces enable consistent
 * error handling across the frontend application.
 */

/**
 * Base error codes shared across all journeys
 */
export enum ErrorCode {
  // General error codes (1-99)
  UNKNOWN_ERROR = 1,
  VALIDATION_ERROR = 2,
  UNAUTHORIZED = 3,
  FORBIDDEN = 4,
  NOT_FOUND = 5,
  CONFLICT = 6,
  RATE_LIMITED = 7,
  SERVICE_UNAVAILABLE = 8,
  TIMEOUT = 9,
  BAD_REQUEST = 10,
  
  // Authentication error codes (100-199)
  INVALID_CREDENTIALS = 100,
  EXPIRED_TOKEN = 101,
  INVALID_TOKEN = 102,
  ACCOUNT_LOCKED = 103,
  MFA_REQUIRED = 104,
  PASSWORD_EXPIRED = 105,
  INVALID_REFRESH_TOKEN = 106,
  SESSION_EXPIRED = 107,
  
  // Health journey error codes (200-299)
  INVALID_HEALTH_METRIC = 200,
  DEVICE_CONNECTION_FAILED = 201,
  HEALTH_GOAL_CONFLICT = 202,
  MEDICAL_EVENT_INVALID = 203,
  HEALTH_DATA_SYNC_FAILED = 204,
  
  // Care journey error codes (300-399)
  APPOINTMENT_UNAVAILABLE = 300,
  PROVIDER_NOT_FOUND = 301,
  MEDICATION_CONFLICT = 302,
  TELEMEDICINE_SESSION_FAILED = 303,
  TREATMENT_PLAN_INVALID = 304,
  
  // Plan journey error codes (400-499)
  CLAIM_SUBMISSION_FAILED = 400,
  INVALID_COVERAGE = 401,
  BENEFIT_NOT_ELIGIBLE = 402,
  DOCUMENT_UPLOAD_FAILED = 403,
  PLAN_NOT_ACTIVE = 404,
  
  // Gamification error codes (500-599)
  ACHIEVEMENT_ALREADY_CLAIMED = 500,
  QUEST_NOT_AVAILABLE = 501,
  REWARD_REDEMPTION_FAILED = 502,
  INSUFFICIENT_POINTS = 503,
  PROFILE_NOT_FOUND = 504,
  
  // Notification error codes (600-699)
  NOTIFICATION_DELIVERY_FAILED = 600,
  INVALID_NOTIFICATION_TEMPLATE = 601,
  NOTIFICATION_PREFERENCE_INVALID = 602,
  CHANNEL_UNAVAILABLE = 603
}

/**
 * Maps error codes to their respective journeys for context-aware error handling
 */
export enum ErrorJourney {
  GENERAL = 'general',
  AUTH = 'auth',
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  NOTIFICATION = 'notification'
}

/**
 * Maps error code ranges to their respective journeys
 */
export const ERROR_JOURNEY_MAP: Record<number, ErrorJourney> = {
  // General errors (1-99)
  1: ErrorJourney.GENERAL,
  // Auth errors (100-199)
  100: ErrorJourney.AUTH,
  // Health journey errors (200-299)
  200: ErrorJourney.HEALTH,
  // Care journey errors (300-399)
  300: ErrorJourney.CARE,
  // Plan journey errors (400-499)
  400: ErrorJourney.PLAN,
  // Gamification errors (500-599)
  500: ErrorJourney.GAMIFICATION,
  // Notification errors (600-699)
  600: ErrorJourney.NOTIFICATION
};

/**
 * Gets the journey for a specific error code
 */
export function getErrorJourney(code: ErrorCode): ErrorJourney {
  const journeyCode = Math.floor(code / 100) * 100;
  return ERROR_JOURNEY_MAP[journeyCode] || ErrorJourney.GENERAL;
}

/**
 * Base error interface for all API errors
 */
export interface ApiError {
  code: ErrorCode;
  message: string;
  timestamp: string;
  path?: string;
  requestId?: string;
  journey?: ErrorJourney;
  details?: Record<string, unknown>;
}

/**
 * Validation error field definition
 */
export interface ValidationErrorField {
  field: string;
  message: string;
  value?: unknown;
  constraints?: Record<string, string>;
}

/**
 * Validation error interface for form validation errors
 */
export interface ValidationError extends ApiError {
  code: ErrorCode.VALIDATION_ERROR;
  fields: ValidationErrorField[];
}

/**
 * Type guard to check if an error is a validation error
 */
export function isValidationError(error: ApiError): error is ValidationError {
  return error.code === ErrorCode.VALIDATION_ERROR && 'fields' in error;
}

/**
 * Health journey specific error interface
 */
export interface HealthJourneyError extends ApiError {
  journey: ErrorJourney.HEALTH;
  healthMetricId?: string;
  deviceId?: string;
  goalId?: string;
  medicalEventId?: string;
}

/**
 * Care journey specific error interface
 */
export interface CareJourneyError extends ApiError {
  journey: ErrorJourney.CARE;
  appointmentId?: string;
  providerId?: string;
  medicationId?: string;
  sessionId?: string;
  treatmentPlanId?: string;
}

/**
 * Plan journey specific error interface
 */
export interface PlanJourneyError extends ApiError {
  journey: ErrorJourney.PLAN;
  claimId?: string;
  coverageId?: string;
  benefitId?: string;
  documentId?: string;
  planId?: string;
}

/**
 * Gamification specific error interface
 */
export interface GamificationError extends ApiError {
  journey: ErrorJourney.GAMIFICATION;
  achievementId?: string;
  questId?: string;
  rewardId?: string;
  profileId?: string;
  points?: number;
}

/**
 * Authentication specific error interface
 */
export interface AuthError extends ApiError {
  journey: ErrorJourney.AUTH;
  userId?: string;
  tokenId?: string;
  sessionId?: string;
  expiresIn?: number;
}

/**
 * Notification specific error interface
 */
export interface NotificationError extends ApiError {
  journey: ErrorJourney.NOTIFICATION;
  notificationId?: string;
  templateId?: string;
  channelId?: string;
  preferenceId?: string;
}

/**
 * Union type of all journey-specific errors
 */
export type JourneyError =
  | HealthJourneyError
  | CareJourneyError
  | PlanJourneyError
  | GamificationError
  | AuthError
  | NotificationError
  | ApiError;

/**
 * REST API specific error response
 */
export interface RestErrorResponse {
  error: JourneyError;
  status: number;
  success: false;
}

/**
 * GraphQL error location
 */
export interface GraphQLErrorLocation {
  line: number;
  column: number;
}

/**
 * GraphQL specific error response
 */
export interface GraphQLErrorResponse {
  message: string;
  locations?: GraphQLErrorLocation[];
  path?: string[];
  extensions?: {
    code: string;
    exception?: {
      error?: JourneyError;
    };
  };
}

/**
 * WebSocket specific error response
 */
export interface WebSocketErrorResponse {
  type: 'error';
  payload: JourneyError;
  id?: string;
  timestamp: string;
}

/**
 * Error response for form submissions
 */
export interface FormErrorResponse {
  success: false;
  error: ValidationError | JourneyError;
  fieldErrors?: Record<string, string>;
}

/**
 * Helper function to extract field errors from a validation error
 */
export function extractFieldErrors(error: ValidationError): Record<string, string> {
  return error.fields.reduce((acc, field) => {
    acc[field.field] = field.message;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Error handler configuration for different journeys
 */
export interface ErrorHandlerConfig {
  journey: ErrorJourney;
  defaultMessage: string;
  redirectPath?: string;
  retryable?: boolean;
  logLevel?: 'error' | 'warn' | 'info';
  showNotification?: boolean;
}

/**
 * Default error handler configurations by journey
 */
export const DEFAULT_ERROR_HANDLERS: Record<ErrorJourney, ErrorHandlerConfig> = {
  [ErrorJourney.GENERAL]: {
    journey: ErrorJourney.GENERAL,
    defaultMessage: 'An unexpected error occurred. Please try again later.',
    logLevel: 'error',
    showNotification: true,
    retryable: true
  },
  [ErrorJourney.AUTH]: {
    journey: ErrorJourney.AUTH,
    defaultMessage: 'Authentication failed. Please sign in again.',
    redirectPath: '/auth/login',
    logLevel: 'warn',
    showNotification: true,
    retryable: false
  },
  [ErrorJourney.HEALTH]: {
    journey: ErrorJourney.HEALTH,
    defaultMessage: 'Unable to process health data. Please try again.',
    logLevel: 'error',
    showNotification: true,
    retryable: true
  },
  [ErrorJourney.CARE]: {
    journey: ErrorJourney.CARE,
    defaultMessage: 'Unable to process care request. Please try again.',
    logLevel: 'error',
    showNotification: true,
    retryable: true
  },
  [ErrorJourney.PLAN]: {
    journey: ErrorJourney.PLAN,
    defaultMessage: 'Unable to process plan request. Please try again.',
    logLevel: 'error',
    showNotification: true,
    retryable: true
  },
  [ErrorJourney.GAMIFICATION]: {
    journey: ErrorJourney.GAMIFICATION,
    defaultMessage: 'Unable to process gamification request. Please try again.',
    logLevel: 'warn',
    showNotification: true,
    retryable: true
  },
  [ErrorJourney.NOTIFICATION]: {
    journey: ErrorJourney.NOTIFICATION,
    defaultMessage: 'Unable to process notification. Please check your settings.',
    logLevel: 'warn',
    showNotification: false,
    retryable: true
  }
};

/**
 * Error response with retry information
 */
export interface RetryableError extends ApiError {
  retryable: boolean;
  retryAfter?: number; // in milliseconds
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: ApiError): error is RetryableError {
  return 'retryable' in error;
}

/**
 * Error with recovery options
 */
export interface RecoverableError extends ApiError {
  recoveryOptions?: {
    actions: Array<{
      label: string;
      action: string;
      data?: Record<string, unknown>;
    }>;
  };
}

/**
 * Type guard to check if an error has recovery options
 */
export function hasRecoveryOptions(error: ApiError): error is RecoverableError {
  return 'recoveryOptions' in error && !!error.recoveryOptions?.actions.length;
}
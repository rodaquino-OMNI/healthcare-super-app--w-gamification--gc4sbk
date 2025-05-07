/**
 * @file error.interface.ts
 * @description Defines standardized error interfaces used throughout the auth service.
 * Includes error types, codes, and serialization formats for consistent error handling and reporting.
 * This file integrates with the @austa/errors package while providing auth-specific error interfaces.
 */

import { ErrorType, ErrorContext, ErrorMetadata, SerializedError } from '@austa/errors/types';
import { IHttpErrorResponse } from './http-response.interface';

/**
 * Auth service specific error codes
 * Prefixed with AUTH_ to distinguish from other service error codes
 * Organized by category for better maintainability
 */
export enum AuthErrorCode {
  // Authentication errors (001-099)
  INVALID_CREDENTIALS = 'AUTH_001',
  ACCOUNT_LOCKED = 'AUTH_002',
  ACCOUNT_DISABLED = 'AUTH_003',
  INVALID_TOKEN = 'AUTH_004',
  TOKEN_EXPIRED = 'AUTH_005',
  REFRESH_TOKEN_EXPIRED = 'AUTH_006',
  INVALID_REFRESH_TOKEN = 'AUTH_007',
  SESSION_EXPIRED = 'AUTH_008',
  INVALID_MFA_CODE = 'AUTH_009',
  MFA_REQUIRED = 'AUTH_010',
  MFA_SETUP_REQUIRED = 'AUTH_011',
  INVALID_RECOVERY_CODE = 'AUTH_012',
  RECOVERY_CODE_EXPIRED = 'AUTH_013',
  TOO_MANY_LOGIN_ATTEMPTS = 'AUTH_014',
  DEVICE_NOT_RECOGNIZED = 'AUTH_015',
  LOCATION_BLOCKED = 'AUTH_016',
  
  // Authorization errors (100-199)
  INSUFFICIENT_PERMISSIONS = 'AUTH_101',
  FORBIDDEN_RESOURCE = 'AUTH_102',
  INVALID_ROLE = 'AUTH_103',
  ROLE_ASSIGNMENT_FAILED = 'AUTH_104',
  PERMISSION_NOT_FOUND = 'AUTH_105',
  ROLE_NOT_FOUND = 'AUTH_106',
  PERMISSION_ALREADY_EXISTS = 'AUTH_107',
  ROLE_ALREADY_EXISTS = 'AUTH_108',
  INVALID_PERMISSION_DATA = 'AUTH_109',
  INVALID_ROLE_DATA = 'AUTH_110',
  
  // User management errors (200-299)
  USER_NOT_FOUND = 'AUTH_201',
  USER_ALREADY_EXISTS = 'AUTH_202',
  EMAIL_ALREADY_EXISTS = 'AUTH_203',
  INVALID_USER_DATA = 'AUTH_204',
  PASSWORD_POLICY_VIOLATION = 'AUTH_205',
  PASSWORD_HISTORY_VIOLATION = 'AUTH_206',
  EMAIL_VERIFICATION_FAILED = 'AUTH_207',
  PHONE_VERIFICATION_FAILED = 'AUTH_208',
  INVALID_VERIFICATION_CODE = 'AUTH_209',
  VERIFICATION_CODE_EXPIRED = 'AUTH_210',
  USER_PROFILE_INCOMPLETE = 'AUTH_211',
  USERNAME_ALREADY_EXISTS = 'AUTH_212',
  PHONE_ALREADY_EXISTS = 'AUTH_213',
  
  // External provider errors (300-399)
  OAUTH_PROVIDER_ERROR = 'AUTH_301',
  OAUTH_INVALID_STATE = 'AUTH_302',
  OAUTH_USER_REJECTED = 'AUTH_303',
  OAUTH_MISSING_PROFILE = 'AUTH_304',
  OAUTH_PROVIDER_UNAVAILABLE = 'AUTH_305',
  OAUTH_INVALID_CALLBACK = 'AUTH_306',
  OAUTH_ACCOUNT_LINKING_FAILED = 'AUTH_307',
  OAUTH_INVALID_TOKEN = 'AUTH_308',
  OAUTH_INVALID_SCOPE = 'AUTH_309',
  OAUTH_EMAIL_VERIFICATION_REQUIRED = 'AUTH_310',
  
  // Journey integration errors (400-499)
  HEALTH_JOURNEY_INTEGRATION_ERROR = 'AUTH_401',
  CARE_JOURNEY_INTEGRATION_ERROR = 'AUTH_402',
  PLAN_JOURNEY_INTEGRATION_ERROR = 'AUTH_403',
  JOURNEY_PERMISSION_SYNC_ERROR = 'AUTH_404',
  JOURNEY_ROLE_SYNC_ERROR = 'AUTH_405',
  JOURNEY_USER_SYNC_ERROR = 'AUTH_406',
  
  // System errors (900-999)
  REDIS_CONNECTION_ERROR = 'AUTH_901',
  DATABASE_ERROR = 'AUTH_902',
  CONFIGURATION_ERROR = 'AUTH_903',
  CACHE_ERROR = 'AUTH_904',
  RATE_LIMIT_EXCEEDED = 'AUTH_905',
  INTERNAL_SERVICE_ERROR = 'AUTH_906',
  EXTERNAL_SERVICE_ERROR = 'AUTH_907',
  UNEXPECTED_ERROR = 'AUTH_999'
}

/**
 * Auth service specific error types that extend the base ErrorType
 * These types help categorize errors for better handling and reporting
 */
export enum AuthErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  USER_MANAGEMENT = 'user_management',
  OAUTH = 'oauth',
  JOURNEY_INTEGRATION = 'journey_integration',
  SYSTEM = 'system'
}

/**
 * Maps error codes to their respective error types for consistent categorization
 */
export const AUTH_ERROR_TYPE_MAP: Record<string, ErrorType | AuthErrorType> = {
  // Authentication errors
  [AuthErrorCode.INVALID_CREDENTIALS]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.ACCOUNT_LOCKED]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.ACCOUNT_DISABLED]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.INVALID_TOKEN]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.TOKEN_EXPIRED]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.REFRESH_TOKEN_EXPIRED]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.INVALID_REFRESH_TOKEN]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.SESSION_EXPIRED]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.INVALID_MFA_CODE]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.MFA_REQUIRED]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.MFA_SETUP_REQUIRED]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.INVALID_RECOVERY_CODE]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.RECOVERY_CODE_EXPIRED]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.TOO_MANY_LOGIN_ATTEMPTS]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.DEVICE_NOT_RECOGNIZED]: AuthErrorType.AUTHENTICATION,
  [AuthErrorCode.LOCATION_BLOCKED]: AuthErrorType.AUTHENTICATION,
  
  // Authorization errors
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: AuthErrorType.AUTHORIZATION,
  [AuthErrorCode.FORBIDDEN_RESOURCE]: AuthErrorType.AUTHORIZATION,
  [AuthErrorCode.INVALID_ROLE]: AuthErrorType.AUTHORIZATION,
  [AuthErrorCode.ROLE_ASSIGNMENT_FAILED]: AuthErrorType.AUTHORIZATION,
  [AuthErrorCode.PERMISSION_NOT_FOUND]: AuthErrorType.AUTHORIZATION,
  [AuthErrorCode.ROLE_NOT_FOUND]: AuthErrorType.AUTHORIZATION,
  [AuthErrorCode.PERMISSION_ALREADY_EXISTS]: AuthErrorType.AUTHORIZATION,
  [AuthErrorCode.ROLE_ALREADY_EXISTS]: AuthErrorType.AUTHORIZATION,
  [AuthErrorCode.INVALID_PERMISSION_DATA]: AuthErrorType.AUTHORIZATION,
  [AuthErrorCode.INVALID_ROLE_DATA]: AuthErrorType.AUTHORIZATION,
  
  // User management errors
  [AuthErrorCode.USER_NOT_FOUND]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.USER_ALREADY_EXISTS]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.INVALID_USER_DATA]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.PASSWORD_POLICY_VIOLATION]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.PASSWORD_HISTORY_VIOLATION]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.EMAIL_VERIFICATION_FAILED]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.PHONE_VERIFICATION_FAILED]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.INVALID_VERIFICATION_CODE]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.VERIFICATION_CODE_EXPIRED]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.USER_PROFILE_INCOMPLETE]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.USERNAME_ALREADY_EXISTS]: AuthErrorType.USER_MANAGEMENT,
  [AuthErrorCode.PHONE_ALREADY_EXISTS]: AuthErrorType.USER_MANAGEMENT,
  
  // OAuth errors
  [AuthErrorCode.OAUTH_PROVIDER_ERROR]: AuthErrorType.OAUTH,
  [AuthErrorCode.OAUTH_INVALID_STATE]: AuthErrorType.OAUTH,
  [AuthErrorCode.OAUTH_USER_REJECTED]: AuthErrorType.OAUTH,
  [AuthErrorCode.OAUTH_MISSING_PROFILE]: AuthErrorType.OAUTH,
  [AuthErrorCode.OAUTH_PROVIDER_UNAVAILABLE]: AuthErrorType.OAUTH,
  [AuthErrorCode.OAUTH_INVALID_CALLBACK]: AuthErrorType.OAUTH,
  [AuthErrorCode.OAUTH_ACCOUNT_LINKING_FAILED]: AuthErrorType.OAUTH,
  [AuthErrorCode.OAUTH_INVALID_TOKEN]: AuthErrorType.OAUTH,
  [AuthErrorCode.OAUTH_INVALID_SCOPE]: AuthErrorType.OAUTH,
  [AuthErrorCode.OAUTH_EMAIL_VERIFICATION_REQUIRED]: AuthErrorType.OAUTH,
  
  // Journey integration errors
  [AuthErrorCode.HEALTH_JOURNEY_INTEGRATION_ERROR]: AuthErrorType.JOURNEY_INTEGRATION,
  [AuthErrorCode.CARE_JOURNEY_INTEGRATION_ERROR]: AuthErrorType.JOURNEY_INTEGRATION,
  [AuthErrorCode.PLAN_JOURNEY_INTEGRATION_ERROR]: AuthErrorType.JOURNEY_INTEGRATION,
  [AuthErrorCode.JOURNEY_PERMISSION_SYNC_ERROR]: AuthErrorType.JOURNEY_INTEGRATION,
  [AuthErrorCode.JOURNEY_ROLE_SYNC_ERROR]: AuthErrorType.JOURNEY_INTEGRATION,
  [AuthErrorCode.JOURNEY_USER_SYNC_ERROR]: AuthErrorType.JOURNEY_INTEGRATION,
  
  // System errors
  [AuthErrorCode.REDIS_CONNECTION_ERROR]: AuthErrorType.SYSTEM,
  [AuthErrorCode.DATABASE_ERROR]: AuthErrorType.SYSTEM,
  [AuthErrorCode.CONFIGURATION_ERROR]: AuthErrorType.SYSTEM,
  [AuthErrorCode.CACHE_ERROR]: AuthErrorType.SYSTEM,
  [AuthErrorCode.RATE_LIMIT_EXCEEDED]: AuthErrorType.SYSTEM,
  [AuthErrorCode.INTERNAL_SERVICE_ERROR]: AuthErrorType.SYSTEM,
  [AuthErrorCode.EXTERNAL_SERVICE_ERROR]: AuthErrorType.SYSTEM,
  [AuthErrorCode.UNEXPECTED_ERROR]: AuthErrorType.SYSTEM
}

/**
 * Auth service specific error context that extends the base ErrorContext
 * Provides additional context information specific to auth service errors
 */
export interface AuthErrorContext extends ErrorContext {
  // User identification context
  userId?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  
  // Authorization context
  roleId?: string;
  roleName?: string;
  permissionId?: string;
  permissionName?: string;
  resourceId?: string;
  resourceType?: string;
  
  // Authentication context
  tokenId?: string;
  tokenType?: 'access' | 'refresh' | 'verification' | 'recovery';
  sessionId?: string;
  deviceId?: string;
  deviceName?: string;
  
  // OAuth context
  oauthProvider?: string;
  oauthState?: string;
  oauthScope?: string;
  
  // Request context
  requestId?: string;
  clientIp?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  
  // Journey context
  journey?: 'health' | 'care' | 'plan' | 'all';
  journeyAction?: string;
  
  // Error handling context
  attemptCount?: number;
  maxAttempts?: number;
  retryAfter?: number;
  fallbackUsed?: boolean;
}

/**
 * Auth service specific error metadata that extends the base ErrorMetadata
 * Contains all information needed for error tracking, logging, and analysis
 */
export interface AuthErrorMetadata extends ErrorMetadata {
  // Error identification
  errorCode: AuthErrorCode;
  errorType: ErrorType | AuthErrorType;
  errorName: string;
  
  // Error context
  context: AuthErrorContext;
  
  // Error timing and location
  timestamp: string;
  path: string;
  serviceName: string;
  serviceVersion: string;
  environment: string;
  
  // HTTP context
  statusCode: number;
  requestId: string;
  
  // Stack trace (for internal use only)
  stack?: string;
  
  // Correlation for distributed tracing
  traceId?: string;
  spanId?: string;
  
  // Additional metadata
  isRetryable: boolean;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Serialized auth error format for consistent error responses
 * This is the format that will be sent to clients in error responses
 */
export interface SerializedAuthError extends SerializedError {
  // Error identification
  errorCode: AuthErrorCode;
  errorType: ErrorType | AuthErrorType;
  message: string;
  
  // Safe context (filtered to remove sensitive information)
  context: Partial<AuthErrorContext>;
  
  // Additional information for clients
  timestamp: string;
  path: string;
  statusCode: number;
  requestId: string;
  
  // Help information
  helpUrl?: string;
  supportReference?: string;
  
  // Recovery information
  retryable: boolean;
  retryAfter?: number;
  suggestedAction?: string;
}

/**
 * Auth error response interface that extends the HTTP error response
 * This is the final format that will be returned to clients in error responses
 */
export interface IAuthErrorResponse extends IHttpErrorResponse {
  error: SerializedAuthError;
  meta?: {
    documentation?: string;
    supportContact?: string;
    requestId?: string;
    timestamp?: string;
  };
}

/**
 * Interface for error transformation between internal errors and client-facing errors
 */
export interface IAuthErrorTransformer {
  /**
   * Transforms an error into a serialized auth error for client responses
   * @param error The error to transform
   * @param options Additional options for the transformation
   */
  transformError(error: Error, options?: {
    includeStack?: boolean;
    includeSensitiveData?: boolean;
    includeHelpInfo?: boolean;
  }): SerializedAuthError;
  
  /**
   * Creates an HTTP error response from a serialized auth error
   * @param serializedError The serialized error
   * @param options Additional options for the response
   */
  createErrorResponse(serializedError: SerializedAuthError, options?: {
    includeMetadata?: boolean;
    includeDocumentation?: boolean;
  }): IAuthErrorResponse;
}

/**
 * Interface for error filtering to remove sensitive information before sending to clients
 */
export interface IAuthErrorFilter {
  /**
   * Filters sensitive information from error context
   * @param context The error context to filter
   * @param level The filtering level (strict removes more information)
   */
  filterContext(context: AuthErrorContext, level: 'strict' | 'standard' | 'debug'): Partial<AuthErrorContext>;
  
  /**
   * Determines if a specific context field should be included in client responses
   * @param fieldName The name of the context field
   * @param level The filtering level
   */
  shouldIncludeField(fieldName: keyof AuthErrorContext, level: 'strict' | 'standard' | 'debug'): boolean;
}

/**
 * Interface for error classification in the auth service
 * Provides methods to classify errors and determine appropriate handling
 */
export interface IAuthErrorClassification {
  // Error type classification
  isAuthenticationError(code: AuthErrorCode): boolean;
  isAuthorizationError(code: AuthErrorCode): boolean;
  isUserManagementError(code: AuthErrorCode): boolean;
  isOAuthError(code: AuthErrorCode): boolean;
  isJourneyIntegrationError(code: AuthErrorCode): boolean;
  isSystemError(code: AuthErrorCode): boolean;
  
  // Error handling classification
  isTransientError(code: AuthErrorCode): boolean;
  isPermanentError(code: AuthErrorCode): boolean;
  isClientError(code: AuthErrorCode): boolean;
  isServerError(code: AuthErrorCode): boolean;
  isExternalError(code: AuthErrorCode): boolean;
  
  // Error handling strategies
  shouldRetry(code: AuthErrorCode): boolean;
  shouldCache(code: AuthErrorCode): boolean;
  shouldAlert(code: AuthErrorCode): boolean;
  shouldLog(code: AuthErrorCode, level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean;
  
  // Error response helpers
  getStatusCode(code: AuthErrorCode): number;
  getDefaultMessage(code: AuthErrorCode): string;
  getSuggestedAction(code: AuthErrorCode): string;
  getRetryConfig(code: AuthErrorCode): IAuthErrorRetryConfig | null;
  getHelpUrl(code: AuthErrorCode): string | null;
}

/**
 * Interface for mapping error codes to HTTP status codes
 * Used to determine the appropriate HTTP status code for each error
 */
export interface IAuthErrorStatusCodeMap {
  [key: string]: number;
}

/**
 * Default HTTP status code mappings for auth error codes
 */
export const DEFAULT_AUTH_ERROR_STATUS_CODES: IAuthErrorStatusCodeMap = {
  // Authentication errors (401 Unauthorized)
  [AuthErrorCode.INVALID_CREDENTIALS]: 401,
  [AuthErrorCode.ACCOUNT_LOCKED]: 401,
  [AuthErrorCode.ACCOUNT_DISABLED]: 401,
  [AuthErrorCode.INVALID_TOKEN]: 401,
  [AuthErrorCode.TOKEN_EXPIRED]: 401,
  [AuthErrorCode.REFRESH_TOKEN_EXPIRED]: 401,
  [AuthErrorCode.INVALID_REFRESH_TOKEN]: 401,
  [AuthErrorCode.SESSION_EXPIRED]: 401,
  [AuthErrorCode.INVALID_MFA_CODE]: 401,
  [AuthErrorCode.MFA_REQUIRED]: 401,
  [AuthErrorCode.MFA_SETUP_REQUIRED]: 401,
  [AuthErrorCode.INVALID_RECOVERY_CODE]: 401,
  [AuthErrorCode.RECOVERY_CODE_EXPIRED]: 401,
  [AuthErrorCode.DEVICE_NOT_RECOGNIZED]: 401,
  
  // Authorization errors (403 Forbidden)
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [AuthErrorCode.FORBIDDEN_RESOURCE]: 403,
  [AuthErrorCode.INVALID_ROLE]: 403,
  [AuthErrorCode.ROLE_ASSIGNMENT_FAILED]: 403,
  
  // Rate limiting (429 Too Many Requests)
  [AuthErrorCode.TOO_MANY_LOGIN_ATTEMPTS]: 429,
  [AuthErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  
  // Not found errors (404 Not Found)
  [AuthErrorCode.USER_NOT_FOUND]: 404,
  [AuthErrorCode.PERMISSION_NOT_FOUND]: 404,
  [AuthErrorCode.ROLE_NOT_FOUND]: 404,
  
  // Conflict errors (409 Conflict)
  [AuthErrorCode.USER_ALREADY_EXISTS]: 409,
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [AuthErrorCode.USERNAME_ALREADY_EXISTS]: 409,
  [AuthErrorCode.PHONE_ALREADY_EXISTS]: 409,
  [AuthErrorCode.PERMISSION_ALREADY_EXISTS]: 409,
  [AuthErrorCode.ROLE_ALREADY_EXISTS]: 409,
  
  // Bad request errors (400 Bad Request)
  [AuthErrorCode.INVALID_USER_DATA]: 400,
  [AuthErrorCode.PASSWORD_POLICY_VIOLATION]: 400,
  [AuthErrorCode.PASSWORD_HISTORY_VIOLATION]: 400,
  [AuthErrorCode.INVALID_PERMISSION_DATA]: 400,
  [AuthErrorCode.INVALID_ROLE_DATA]: 400,
  [AuthErrorCode.OAUTH_INVALID_STATE]: 400,
  [AuthErrorCode.OAUTH_INVALID_CALLBACK]: 400,
  [AuthErrorCode.OAUTH_INVALID_SCOPE]: 400,
  [AuthErrorCode.INVALID_VERIFICATION_CODE]: 400,
  
  // Precondition failed (412 Precondition Failed)
  [AuthErrorCode.EMAIL_VERIFICATION_FAILED]: 412,
  [AuthErrorCode.PHONE_VERIFICATION_FAILED]: 412,
  [AuthErrorCode.USER_PROFILE_INCOMPLETE]: 412,
  [AuthErrorCode.OAUTH_EMAIL_VERIFICATION_REQUIRED]: 412,
  
  // Service unavailable (503 Service Unavailable)
  [AuthErrorCode.OAUTH_PROVIDER_UNAVAILABLE]: 503,
  [AuthErrorCode.REDIS_CONNECTION_ERROR]: 503,
  [AuthErrorCode.DATABASE_ERROR]: 503,
  [AuthErrorCode.CACHE_ERROR]: 503,
  
  // Internal server errors (500 Internal Server Error)
  [AuthErrorCode.CONFIGURATION_ERROR]: 500,
  [AuthErrorCode.INTERNAL_SERVICE_ERROR]: 500,
  [AuthErrorCode.EXTERNAL_SERVICE_ERROR]: 500,
  [AuthErrorCode.UNEXPECTED_ERROR]: 500,
  [AuthErrorCode.OAUTH_PROVIDER_ERROR]: 500,
  [AuthErrorCode.OAUTH_ACCOUNT_LINKING_FAILED]: 500,
  [AuthErrorCode.HEALTH_JOURNEY_INTEGRATION_ERROR]: 500,
  [AuthErrorCode.CARE_JOURNEY_INTEGRATION_ERROR]: 500,
  [AuthErrorCode.PLAN_JOURNEY_INTEGRATION_ERROR]: 500,
  [AuthErrorCode.JOURNEY_PERMISSION_SYNC_ERROR]: 500,
  [AuthErrorCode.JOURNEY_ROLE_SYNC_ERROR]: 500,
  [AuthErrorCode.JOURNEY_USER_SYNC_ERROR]: 500,
  
  // Default for any unhandled errors
  default: 500
};

/**
 * Interface for mapping error codes to default error messages
 * Provides user-friendly error messages for each error code
 */
export interface IAuthErrorMessageMap {
  [key: string]: string;
}

/**
 * Default error messages for auth error codes
 */
export const DEFAULT_AUTH_ERROR_MESSAGES: IAuthErrorMessageMap = {
  // Authentication errors
  [AuthErrorCode.INVALID_CREDENTIALS]: 'The username or password provided is incorrect',
  [AuthErrorCode.ACCOUNT_LOCKED]: 'Your account has been locked due to too many failed login attempts',
  [AuthErrorCode.ACCOUNT_DISABLED]: 'Your account has been disabled',
  [AuthErrorCode.INVALID_TOKEN]: 'The authentication token is invalid',
  [AuthErrorCode.TOKEN_EXPIRED]: 'The authentication token has expired',
  [AuthErrorCode.REFRESH_TOKEN_EXPIRED]: 'Your session has expired, please log in again',
  [AuthErrorCode.INVALID_REFRESH_TOKEN]: 'The refresh token is invalid',
  [AuthErrorCode.SESSION_EXPIRED]: 'Your session has expired, please log in again',
  [AuthErrorCode.INVALID_MFA_CODE]: 'The multi-factor authentication code is invalid',
  [AuthErrorCode.MFA_REQUIRED]: 'Multi-factor authentication is required to complete this action',
  [AuthErrorCode.MFA_SETUP_REQUIRED]: 'You need to set up multi-factor authentication for your account',
  [AuthErrorCode.INVALID_RECOVERY_CODE]: 'The recovery code is invalid',
  [AuthErrorCode.RECOVERY_CODE_EXPIRED]: 'The recovery code has expired',
  [AuthErrorCode.TOO_MANY_LOGIN_ATTEMPTS]: 'Too many login attempts, please try again later',
  [AuthErrorCode.DEVICE_NOT_RECOGNIZED]: 'Login attempt from an unrecognized device',
  [AuthErrorCode.LOCATION_BLOCKED]: 'Login attempt from a blocked location',
  
  // Authorization errors
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action',
  [AuthErrorCode.FORBIDDEN_RESOURCE]: 'You do not have access to this resource',
  [AuthErrorCode.INVALID_ROLE]: 'The specified role is invalid',
  [AuthErrorCode.ROLE_ASSIGNMENT_FAILED]: 'Failed to assign the role to the user',
  [AuthErrorCode.PERMISSION_NOT_FOUND]: 'The specified permission does not exist',
  [AuthErrorCode.ROLE_NOT_FOUND]: 'The specified role does not exist',
  [AuthErrorCode.PERMISSION_ALREADY_EXISTS]: 'A permission with this name already exists',
  [AuthErrorCode.ROLE_ALREADY_EXISTS]: 'A role with this name already exists',
  [AuthErrorCode.INVALID_PERMISSION_DATA]: 'The permission data provided is invalid',
  [AuthErrorCode.INVALID_ROLE_DATA]: 'The role data provided is invalid',
  
  // User management errors
  [AuthErrorCode.USER_NOT_FOUND]: 'The specified user does not exist',
  [AuthErrorCode.USER_ALREADY_EXISTS]: 'A user with this identifier already exists',
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: 'A user with this email address already exists',
  [AuthErrorCode.INVALID_USER_DATA]: 'The user data provided is invalid',
  [AuthErrorCode.PASSWORD_POLICY_VIOLATION]: 'The password does not meet the security requirements',
  [AuthErrorCode.PASSWORD_HISTORY_VIOLATION]: 'The new password cannot be the same as your previous passwords',
  [AuthErrorCode.EMAIL_VERIFICATION_FAILED]: 'Email verification failed',
  [AuthErrorCode.PHONE_VERIFICATION_FAILED]: 'Phone verification failed',
  [AuthErrorCode.INVALID_VERIFICATION_CODE]: 'The verification code is invalid',
  [AuthErrorCode.VERIFICATION_CODE_EXPIRED]: 'The verification code has expired',
  [AuthErrorCode.USER_PROFILE_INCOMPLETE]: 'Your user profile is incomplete',
  [AuthErrorCode.USERNAME_ALREADY_EXISTS]: 'A user with this username already exists',
  [AuthErrorCode.PHONE_ALREADY_EXISTS]: 'A user with this phone number already exists',
  
  // OAuth errors
  [AuthErrorCode.OAUTH_PROVIDER_ERROR]: 'An error occurred with the authentication provider',
  [AuthErrorCode.OAUTH_INVALID_STATE]: 'Invalid state parameter in OAuth flow',
  [AuthErrorCode.OAUTH_USER_REJECTED]: 'The user rejected the authentication request',
  [AuthErrorCode.OAUTH_MISSING_PROFILE]: 'The authentication provider did not return a user profile',
  [AuthErrorCode.OAUTH_PROVIDER_UNAVAILABLE]: 'The authentication provider is currently unavailable',
  [AuthErrorCode.OAUTH_INVALID_CALLBACK]: 'Invalid callback URL in OAuth flow',
  [AuthErrorCode.OAUTH_ACCOUNT_LINKING_FAILED]: 'Failed to link the external account to your user account',
  [AuthErrorCode.OAUTH_INVALID_TOKEN]: 'The OAuth token is invalid',
  [AuthErrorCode.OAUTH_INVALID_SCOPE]: 'Invalid scope requested in OAuth flow',
  [AuthErrorCode.OAUTH_EMAIL_VERIFICATION_REQUIRED]: 'Email verification is required to complete the authentication',
  
  // Journey integration errors
  [AuthErrorCode.HEALTH_JOURNEY_INTEGRATION_ERROR]: 'An error occurred while integrating with the Health journey',
  [AuthErrorCode.CARE_JOURNEY_INTEGRATION_ERROR]: 'An error occurred while integrating with the Care journey',
  [AuthErrorCode.PLAN_JOURNEY_INTEGRATION_ERROR]: 'An error occurred while integrating with the Plan journey',
  [AuthErrorCode.JOURNEY_PERMISSION_SYNC_ERROR]: 'Failed to synchronize permissions with journey services',
  [AuthErrorCode.JOURNEY_ROLE_SYNC_ERROR]: 'Failed to synchronize roles with journey services',
  [AuthErrorCode.JOURNEY_USER_SYNC_ERROR]: 'Failed to synchronize user data with journey services',
  
  // System errors
  [AuthErrorCode.REDIS_CONNECTION_ERROR]: 'Failed to connect to the session store',
  [AuthErrorCode.DATABASE_ERROR]: 'A database error occurred',
  [AuthErrorCode.CONFIGURATION_ERROR]: 'A configuration error occurred',
  [AuthErrorCode.CACHE_ERROR]: 'A caching error occurred',
  [AuthErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded, please try again later',
  [AuthErrorCode.INTERNAL_SERVICE_ERROR]: 'An internal service error occurred',
  [AuthErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service error occurred',
  [AuthErrorCode.UNEXPECTED_ERROR]: 'An unexpected error occurred',
  
  // Default for any unhandled errors
  default: 'An error occurred while processing your request'
};

/**
 * Interface for retry configuration based on error codes
 * Defines how retries should be handled for transient errors
 */
export interface IAuthErrorRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
  jitterFactor: number;
}

/**
 * Default retry configuration for transient errors
 */
export const DEFAULT_RETRY_CONFIG: IAuthErrorRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  backoffFactor: 2,
  maxDelayMs: 5000,
  jitterFactor: 0.1
};

/**
 * Interface for error codes that should be retried
 * Maps retryable error codes to their retry configuration
 */
export interface IAuthRetryableErrors {
  [key: string]: IAuthErrorRetryConfig;
}

/**
 * Default retryable errors with their retry configurations
 */
export const DEFAULT_RETRYABLE_ERRORS: IAuthRetryableErrors = {
  // Database connection errors
  [AuthErrorCode.DATABASE_ERROR]: {
    maxRetries: 3,
    initialDelayMs: 100,
    backoffFactor: 2,
    maxDelayMs: 2000,
    jitterFactor: 0.1
  },
  
  // Redis connection errors
  [AuthErrorCode.REDIS_CONNECTION_ERROR]: {
    maxRetries: 3,
    initialDelayMs: 100,
    backoffFactor: 2,
    maxDelayMs: 2000,
    jitterFactor: 0.1
  },
  
  // Cache errors
  [AuthErrorCode.CACHE_ERROR]: {
    maxRetries: 2,
    initialDelayMs: 50,
    backoffFactor: 2,
    maxDelayMs: 1000,
    jitterFactor: 0.1
  },
  
  // External service errors
  [AuthErrorCode.EXTERNAL_SERVICE_ERROR]: {
    maxRetries: 3,
    initialDelayMs: 200,
    backoffFactor: 2,
    maxDelayMs: 5000,
    jitterFactor: 0.2
  },
  
  // OAuth provider errors
  [AuthErrorCode.OAUTH_PROVIDER_ERROR]: {
    maxRetries: 2,
    initialDelayMs: 300,
    backoffFactor: 2,
    maxDelayMs: 3000,
    jitterFactor: 0.1
  },
  
  // Journey integration errors
  [AuthErrorCode.HEALTH_JOURNEY_INTEGRATION_ERROR]: {
    maxRetries: 3,
    initialDelayMs: 200,
    backoffFactor: 2,
    maxDelayMs: 3000,
    jitterFactor: 0.1
  },
  [AuthErrorCode.CARE_JOURNEY_INTEGRATION_ERROR]: {
    maxRetries: 3,
    initialDelayMs: 200,
    backoffFactor: 2,
    maxDelayMs: 3000,
    jitterFactor: 0.1
  },
  [AuthErrorCode.PLAN_JOURNEY_INTEGRATION_ERROR]: {
    maxRetries: 3,
    initialDelayMs: 200,
    backoffFactor: 2,
    maxDelayMs: 3000,
    jitterFactor: 0.1
  }
};
/**
 * Authentication Response Interfaces
 * 
 * This file defines standardized interfaces for authentication-related API responses,
 * including login, registration, and token refresh endpoints. These interfaces ensure
 * consistency across all authentication flows and enable proper type checking for
 * auth service controllers.
 */

/**
 * Enum representing the available user journeys in the application
 */
export enum UserJourney {
  /**
   * Health journey - focused on health metrics and goals
   */
  HEALTH = 'HEALTH',
  
  /**
   * Care journey - focused on appointments and treatments
   */
  CARE = 'CARE',
  
  /**
   * Plan journey - focused on insurance plans and benefits
   */
  PLAN = 'PLAN'
}

/**
 * Base interface for authentication tokens
 */
export interface AuthTokens {
  /**
   * JWT access token for API authorization
   */
  accessToken: string;
  
  /**
   * JWT refresh token used to obtain a new access token when expired
   */
  refreshToken: string;
  
  /**
   * Timestamp (in milliseconds since epoch) when the access token expires
   */
  expiresAt: number;
  
  /**
   * Token type (usually "Bearer")
   */
  tokenType: string;
}

/**
 * Response interface for user registration
 */
export interface RegisterResponse {
  /**
   * Indicates if the registration was successful
   */
  success: boolean;
  
  /**
   * Authentication tokens for the newly registered user
   */
  tokens: AuthTokens;
  
  /**
   * User data for the newly registered account
   */
  user: {
    /**
     * Unique identifier for the user
     */
    id: string;
    
    /**
     * User's email address
     */
    email: string;
    
    /**
     * User's full name
     */
    name: string;
    
    /**
     * Timestamp when the user was created
     */
    createdAt: string;
    
    /**
     * User's preferred journeys
     */
    preferredJourneys?: UserJourney[];
    
    /**
     * User's roles within the system
     */
    roles?: string[];
    
    /**
     * User's permissions within the system
     */
    permissions?: string[];
  };
}

/**
 * Response interface for user login
 */
export interface LoginResponse {
  /**
   * Indicates if the login was successful
   */
  success: boolean;
  
  /**
   * Authentication tokens for the user session
   */
  tokens: AuthTokens;
  
  /**
   * User data for the authenticated account
   */
  user: {
    /**
     * Unique identifier for the user
     */
    id: string;
    
    /**
     * User's email address
     */
    email: string;
    
    /**
     * User's full name
     */
    name: string;
    
    /**
     * User's preferred journeys
     */
    preferredJourneys?: UserJourney[];
    
    /**
     * User's roles within the system
     */
    roles?: string[];
    
    /**
     * User's permissions within the system
     */
    permissions?: string[];
    
    /**
     * Last login timestamp
     */
    lastLoginAt?: string;
  };
}

/**
 * Response interface for token refresh operations
 */
export interface RefreshTokenResponse {
  /**
   * Indicates if the token refresh was successful
   */
  success: boolean;
  
  /**
   * New authentication tokens
   */
  tokens: AuthTokens;
}

/**
 * Error codes for authentication failures
 */
export enum AuthErrorCode {
  /**
   * Invalid credentials provided
   */
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  /**
   * Account is locked due to too many failed attempts
   */
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  /**
   * User account not found
   */
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  /**
   * Email already in use
   */
  EMAIL_IN_USE = 'EMAIL_IN_USE',
  
  /**
   * Invalid or expired token
   */
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  /**
   * Missing required fields
   */
  MISSING_FIELDS = 'MISSING_FIELDS',
  
  /**
   * Invalid input format
   */
  INVALID_INPUT = 'INVALID_INPUT',
  
  /**
   * Server error occurred
   */
  SERVER_ERROR = 'SERVER_ERROR',
  
  /**
   * Multi-factor authentication required
   */
  MFA_REQUIRED = 'MFA_REQUIRED',
  
  /**
   * Session expired
   */
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  /**
   * Invalid MFA code provided
   */
  INVALID_MFA_CODE = 'INVALID_MFA_CODE',
  
  /**
   * MFA challenge expired
   */
  MFA_CHALLENGE_EXPIRED = 'MFA_CHALLENGE_EXPIRED',
  
  /**
   * Too many MFA attempts
   */
  TOO_MANY_MFA_ATTEMPTS = 'TOO_MANY_MFA_ATTEMPTS',
  
  /**
   * Password reset required
   */
  PASSWORD_RESET_REQUIRED = 'PASSWORD_RESET_REQUIRED',
  
  /**
   * Password policy violation
   */
  PASSWORD_POLICY_VIOLATION = 'PASSWORD_POLICY_VIOLATION',
  
  /**
   * Account not verified
   */
  ACCOUNT_NOT_VERIFIED = 'ACCOUNT_NOT_VERIFIED',
  
  /**
   * Access denied due to insufficient permissions
   */
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  /**
   * Journey access not permitted
   */
  JOURNEY_ACCESS_DENIED = 'JOURNEY_ACCESS_DENIED',
  
  /**
   * Rate limit exceeded
   */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * Severity level for authentication errors
 */
export enum ErrorSeverity {
  /**
   * Informational message, not a true error
   */
  INFO = 'INFO',
  
  /**
   * Warning that doesn't prevent the operation but requires attention
   */
  WARNING = 'WARNING',
  
  /**
   * Error that prevented the operation from completing
   */
  ERROR = 'ERROR',
  
  /**
   * Critical error that requires immediate attention
   */
  CRITICAL = 'CRITICAL'
}

/**
 * Response interface for authentication errors
 */
export interface AuthErrorResponse {
  /**
   * Indicates that the operation failed
   */
  success: false;
  
  /**
   * Error code identifying the type of failure
   */
  errorCode: AuthErrorCode;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Error severity level
   */
  severity: ErrorSeverity;
  
  /**
   * Optional additional error details
   */
  details?: Record<string, any>;
  
  /**
   * Optional field validation errors
   */
  fieldErrors?: {
    /**
     * Field name as the key and error message as the value
     */
    [field: string]: string;
  };
  
  /**
   * Optional error identifier for tracking in logs
   */
  errorId?: string;
  
  /**
   * Optional timestamp when the error occurred
   */
  timestamp?: string;
  
  /**
   * Optional journey context where the error occurred
   */
  journeyContext?: {
    /**
     * Journey where the error occurred
     */
    journey: UserJourney;
    
    /**
     * Specific section or feature within the journey
     */
    section?: string;
  };
  
  /**
   * Optional recovery actions that the client can take
   */
  recoveryActions?: {
    /**
     * Type of recovery action
     */
    type: 'RETRY' | 'REDIRECT' | 'REFRESH' | 'CONTACT_SUPPORT' | 'WAIT';
    
    /**
     * Description of the recovery action
     */
    description: string;
    
    /**
     * Optional URL for redirect actions
     */
    url?: string;
    
    /**
     * Optional wait time in seconds before retrying
     */
    waitTime?: number;
  }[];
}

/**
 * Response interface for multi-factor authentication challenge
 */
export interface MfaChallengeResponse {
  /**
   * Indicates that MFA is required
   */
  success: boolean;
  
  /**
   * Temporary token to be used with MFA verification
   */
  temporaryToken: string;
  
  /**
   * Type of MFA challenge issued
   */
  challengeType: 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
  
  /**
   * Masked destination where the code was sent (if applicable)
   * e.g., "***@example.com" or "***-***-1234"
   */
  maskedDestination?: string;
  
  /**
   * Expiration time for the MFA challenge in seconds
   */
  expiresIn: number;
}

/**
 * Response interface for session validation
 */
export interface SessionValidationResponse {
  /**
   * Indicates if the session is valid
   */
  valid: boolean;
  
  /**
   * User ID associated with the session (if valid)
   */
  userId?: string;
  
  /**
   * Roles associated with the user
   */
  roles?: string[];
  
  /**
   * Permissions associated with the user
   */
  permissions?: string[];
  
  /**
   * Time remaining until session expiration (in seconds)
   */
  expiresIn?: number;
}

/**
 * Response interface for session revocation (logout)
 */
export interface LogoutResponse {
  /**
   * Indicates if the logout was successful
   */
  success: boolean;
  
  /**
   * Timestamp of when the session was revoked
   */
  revokedAt?: string;
}

/**
 * Union type for all possible authentication responses
 */
export type AuthResponse = 
  | RegisterResponse 
  | LoginResponse 
  | RefreshTokenResponse 
  | MfaChallengeResponse
  | SessionValidationResponse
  | LogoutResponse
  | AuthErrorResponse;
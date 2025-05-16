/**
 * Authentication API interfaces for the AUSTA SuperApp
 * 
 * This file defines the request and response interfaces for all authentication-related
 * API endpoints, including login, registration, token refresh, password reset, and MFA operations.
 * These interfaces ensure type safety for authentication flows across both web and mobile platforms.
 */

// Import types from auth interfaces
import { AuthSession } from '../auth/session.types';
import { JWTPayload, TokenValidationResult } from '../auth/token.types';
import { UserProfile } from '../auth/user.types';

// Import common API types
import { APIResponse } from './response.types';
import { APIErrorResponse } from './error.types';

/**
 * Authentication API error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_001',
  ACCOUNT_LOCKED = 'AUTH_002',
  ACCOUNT_NOT_VERIFIED = 'AUTH_003',
  INVALID_TOKEN = 'AUTH_004',
  TOKEN_EXPIRED = 'AUTH_005',
  INVALID_MFA_CODE = 'AUTH_006',
  PASSWORD_POLICY_VIOLATION = 'AUTH_007',
  EMAIL_ALREADY_EXISTS = 'AUTH_008',
  USERNAME_ALREADY_EXISTS = 'AUTH_009',
  INVALID_RESET_TOKEN = 'AUTH_010',
  RESET_TOKEN_EXPIRED = 'AUTH_011',
  MFA_REQUIRED = 'AUTH_012',
  SOCIAL_ACCOUNT_NOT_LINKED = 'AUTH_013',
  PERMISSION_DENIED = 'AUTH_014',
  INVALID_REFRESH_TOKEN = 'AUTH_015',
}

/**
 * MFA (Multi-Factor Authentication) types supported by the system
 */
export enum MFAType {
  SMS = 'sms',
  EMAIL = 'email',
  AUTHENTICATOR_APP = 'authenticator_app',
  PUSH_NOTIFICATION = 'push_notification',
}

/**
 * Social authentication providers supported by the system
 */
export enum SocialAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
  MICROSOFT = 'microsoft',
}

/**
 * Base interface for all authentication requests
 */
export interface AuthRequest {
  /**
   * Client device information for security and analytics
   */
  deviceInfo?: {
    /**
     * Device type (mobile, tablet, desktop)
     */
    deviceType: string;
    
    /**
     * Operating system
     */
    os: string;
    
    /**
     * Browser or app version
     */
    appVersion: string;
    
    /**
     * Device identifier (when available)
     */
    deviceId?: string;
  };
}

/**
 * Login request payload
 */
export interface LoginRequest extends AuthRequest {
  /**
   * User email address
   */
  email: string;
  
  /**
   * User password
   */
  password: string;
  
  /**
   * Remember user session (extends token expiration)
   */
  rememberMe?: boolean;
}

/**
 * Login response payload
 */
export interface LoginResponse extends APIResponse {
  /**
   * Authentication session with tokens
   */
  session: AuthSession;
  
  /**
   * User profile information
   */
  user: UserProfile;
  
  /**
   * Indicates if MFA verification is required
   */
  requiresMFA?: boolean;
  
  /**
   * MFA verification methods available for this user
   */
  mfaMethods?: MFAType[];
  
  /**
   * Temporary token for MFA verification flow
   */
  mfaToken?: string;
}

/**
 * Registration request payload
 */
export interface RegistrationRequest extends AuthRequest {
  /**
   * User email address
   */
  email: string;
  
  /**
   * User password
   */
  password: string;
  
  /**
   * Password confirmation
   */
  passwordConfirmation: string;
  
  /**
   * User's first name
   */
  firstName: string;
  
  /**
   * User's last name
   */
  lastName: string;
  
  /**
   * User's phone number (optional)
   */
  phoneNumber?: string;
  
  /**
   * User's date of birth
   */
  dateOfBirth: string;
  
  /**
   * User's preferred language
   */
  preferredLanguage?: string;
  
  /**
   * Marketing opt-in preference
   */
  marketingOptIn?: boolean;
  
  /**
   * Terms and conditions acceptance
   */
  termsAccepted: boolean;
  
  /**
   * Privacy policy acceptance
   */
  privacyPolicyAccepted: boolean;
}

/**
 * Registration response payload
 */
export interface RegistrationResponse extends APIResponse {
  /**
   * User ID of the newly created account
   */
  userId: string;
  
  /**
   * Indicates if email verification is required
   */
  requiresEmailVerification: boolean;
  
  /**
   * Authentication session (if auto-login is enabled)
   */
  session?: AuthSession;
  
  /**
   * User profile (if auto-login is enabled)
   */
  user?: UserProfile;
}

/**
 * MFA verification request payload
 */
export interface MFAVerificationRequest extends AuthRequest {
  /**
   * MFA token received during login
   */
  mfaToken: string;
  
  /**
   * Verification code entered by the user
   */
  verificationCode: string;
  
  /**
   * MFA method used for verification
   */
  mfaType: MFAType;
}

/**
 * MFA verification response payload
 */
export interface MFAVerificationResponse extends APIResponse {
  /**
   * Authentication session with tokens
   */
  session: AuthSession;
  
  /**
   * User profile information
   */
  user: UserProfile;
}

/**
 * Request to initiate MFA setup
 */
export interface InitiateMFASetupRequest extends AuthRequest {
  /**
   * MFA method to set up
   */
  mfaType: MFAType;
  
  /**
   * Phone number (for SMS verification)
   */
  phoneNumber?: string;
  
  /**
   * Email address (for email verification)
   */
  email?: string;
}

/**
 * Response for MFA setup initiation
 */
export interface InitiateMFASetupResponse extends APIResponse {
  /**
   * Setup token for completing MFA configuration
   */
  setupToken: string;
  
  /**
   * QR code data URL (for authenticator app)
   */
  qrCodeDataUrl?: string;
  
  /**
   * Secret key (for authenticator app manual entry)
   */
  secretKey?: string;
}

/**
 * Request to complete MFA setup
 */
export interface CompleteMFASetupRequest extends AuthRequest {
  /**
   * Setup token from initiation step
   */
  setupToken: string;
  
  /**
   * Verification code entered by the user
   */
  verificationCode: string;
}

/**
 * Response for MFA setup completion
 */
export interface CompleteMFASetupResponse extends APIResponse {
  /**
   * Indicates if MFA setup was successful
   */
  success: boolean;
  
  /**
   * List of active MFA methods for the user
   */
  activeMfaMethods: MFAType[];
}

/**
 * Request to refresh authentication tokens
 */
export interface TokenRefreshRequest extends AuthRequest {
  /**
   * Refresh token from current session
   */
  refreshToken: string;
}

/**
 * Response for token refresh
 */
export interface TokenRefreshResponse extends APIResponse {
  /**
   * New authentication session with updated tokens
   */
  session: AuthSession;
}

/**
 * Request to validate a token
 */
export interface TokenValidationRequest extends AuthRequest {
  /**
   * Access token to validate
   */
  accessToken: string;
}

/**
 * Response for token validation
 */
export interface TokenValidationResponse extends APIResponse {
  /**
   * Validation result
   */
  result: TokenValidationResult;
  
  /**
   * Decoded token payload (if valid)
   */
  payload?: JWTPayload;
}

/**
 * Request to initiate password reset
 */
export interface InitiatePasswordResetRequest extends AuthRequest {
  /**
   * Email address for the account
   */
  email: string;
}

/**
 * Response for password reset initiation
 */
export interface InitiatePasswordResetResponse extends APIResponse {
  /**
   * Indicates if the reset email was sent
   */
  emailSent: boolean;
}

/**
 * Request to complete password reset
 */
export interface CompletePasswordResetRequest extends AuthRequest {
  /**
   * Reset token from email
   */
  resetToken: string;
  
  /**
   * New password
   */
  newPassword: string;
  
  /**
   * New password confirmation
   */
  newPasswordConfirmation: string;
}

/**
 * Response for password reset completion
 */
export interface CompletePasswordResetResponse extends APIResponse {
  /**
   * Indicates if password reset was successful
   */
  success: boolean;
  
  /**
   * Authentication session (if auto-login is enabled)
   */
  session?: AuthSession;
}

/**
 * Request to change password (authenticated)
 */
export interface ChangePasswordRequest extends AuthRequest {
  /**
   * Current password
   */
  currentPassword: string;
  
  /**
   * New password
   */
  newPassword: string;
  
  /**
   * New password confirmation
   */
  newPasswordConfirmation: string;
}

/**
 * Response for password change
 */
export interface ChangePasswordResponse extends APIResponse {
  /**
   * Indicates if password change was successful
   */
  success: boolean;
}

/**
 * Request for email verification
 */
export interface VerifyEmailRequest extends AuthRequest {
  /**
   * Verification token from email
   */
  verificationToken: string;
}

/**
 * Response for email verification
 */
export interface VerifyEmailResponse extends APIResponse {
  /**
   * Indicates if email verification was successful
   */
  success: boolean;
  
  /**
   * Authentication session (if auto-login is enabled)
   */
  session?: AuthSession;
}

/**
 * Request to initiate social authentication
 */
export interface SocialAuthRequest extends AuthRequest {
  /**
   * Social provider
   */
  provider: SocialAuthProvider;
  
  /**
   * Authentication token from social provider
   */
  token: string;
  
  /**
   * Additional data from social provider
   */
  userData?: Record<string, any>;
}

/**
 * Response for social authentication
 */
export interface SocialAuthResponse extends APIResponse {
  /**
   * Authentication session with tokens
   */
  session: AuthSession;
  
  /**
   * User profile information
   */
  user: UserProfile;
  
  /**
   * Indicates if this is a new account
   */
  isNewAccount: boolean;
}

/**
 * Request to log out
 */
export interface LogoutRequest extends AuthRequest {
  /**
   * Refresh token to invalidate
   */
  refreshToken: string;
  
  /**
   * Log out from all devices
   */
  logoutFromAllDevices?: boolean;
}

/**
 * Response for logout
 */
export interface LogoutResponse extends APIResponse {
  /**
   * Indicates if logout was successful
   */
  success: boolean;
}

/**
 * Request to get current user profile
 */
export interface GetUserProfileRequest extends AuthRequest {
  /**
   * Include additional user data
   */
  includePreferences?: boolean;
}

/**
 * Response for user profile request
 */
export interface GetUserProfileResponse extends APIResponse {
  /**
   * User profile information
   */
  user: UserProfile;
}

/**
 * Request to update user profile
 */
export interface UpdateUserProfileRequest extends AuthRequest {
  /**
   * User's first name
   */
  firstName?: string;
  
  /**
   * User's last name
   */
  lastName?: string;
  
  /**
   * User's phone number
   */
  phoneNumber?: string;
  
  /**
   * User's preferred language
   */
  preferredLanguage?: string;
  
  /**
   * Marketing opt-in preference
   */
  marketingOptIn?: boolean;
  
  /**
   * User preferences
   */
  preferences?: Record<string, any>;
}

/**
 * Response for profile update
 */
export interface UpdateUserProfileResponse extends APIResponse {
  /**
   * Updated user profile
   */
  user: UserProfile;
}
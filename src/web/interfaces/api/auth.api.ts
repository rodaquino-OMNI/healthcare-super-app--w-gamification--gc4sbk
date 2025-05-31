/**
 * Authentication API Interfaces for the AUSTA SuperApp
 * 
 * This file defines the request and response interfaces for all authentication-related
 * API operations, including login, registration, token refresh, password reset, and MFA.
 * 
 * These interfaces ensure type safety for authentication operations across the application
 * and enable consistent authentication patterns across web and mobile platforms.
 * 
 * Security best practices implemented:
 * - Short-lived access tokens with refresh token mechanism
 * - Multi-factor authentication support
 * - Device tracking for session management
 * - Secure password reset and recovery flows
 * - Support for social authentication providers
 */

// Import from source types until auth interfaces are fully implemented
import type { AuthSession } from '../../shared/types/auth.types';

/**
 * Authentication API namespace containing all auth-related interfaces
 */
export namespace AuthAPI {
  /**
   * JWT token payload structure
   * Represents the decoded content of a JWT token
   */
  export interface JwtPayload {
    /**
     * Subject (user ID)
     */
    sub: string;
    
    /**
     * Issuer (auth service identifier)
     */
    iss: string;
    
    /**
     * Audience (intended recipient of the token)
     */
    aud: string | string[];
    
    /**
     * Expiration time (Unix timestamp)
     */
    exp: number;
    
    /**
     * Issued at time (Unix timestamp)
     */
    iat: number;
    
    /**
     * JWT ID (unique identifier for this token)
     */
    jti: string;
    
    /**
     * User email (optional)
     */
    email?: string;
    
    /**
     * User roles
     */
    roles?: string[];
    
    /**
     * User permissions
     */
    permissions?: string[];
    
    /**
     * Token type (access or refresh)
     */
    type: 'access' | 'refresh';
  }
  /**
   * Base interface for authentication requests
   */
  export interface BaseAuthRequest {
    /**
     * Client identifier for tracking and analytics
     */
    clientId?: string;

    /**
     * Device information for security tracking
     */
    deviceInfo?: DeviceInfo;
    
    /**
     * Request fingerprint for fraud detection
     * Contains hashed browser/device fingerprint data
     */
    fingerprint?: string;
    
    /**
     * Request timestamp for replay attack prevention
     */
    timestamp?: number;
  }

  /**
   * Device information for security tracking and multi-device management
   */
  export interface DeviceInfo {
    /**
     * Unique device identifier
     */
    deviceId: string;

    /**
     * Device platform (ios, android, web)
     */
    platform: 'ios' | 'android' | 'web';

    /**
     * Device model information
     */
    model?: string;

    /**
     * Operating system version
     */
    osVersion?: string;

    /**
     * App version
     */
    appVersion?: string;
  }

  /**
   * Login request payload
   */
  export interface LoginRequest extends BaseAuthRequest {
    /**
     * User email address
     */
    email: string;

    /**
     * User password
     */
    password: string;

    /**
     * Remember user preference for extended session duration
     */
    rememberMe?: boolean;
  }

  /**
   * Login response payload
   */
  export interface LoginResponse {
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
    requiresMfa?: boolean;

    /**
     * MFA challenge ID if MFA is required
     */
    mfaChallengeId?: string;
    
    /**
     * Token expiration time in seconds
     */
    expiresIn: number;
    
    /**
     * Indicates if this is a new device login
     * When true, the user may receive a notification about a new device login
     */
    newDeviceLogin?: boolean;
    
    /**
     * Security recommendations for the user (optional)
     * For example, suggesting enabling MFA if not enabled
     */
    securityRecommendations?: string[];
  }

  /**
   * Registration request payload
   */
  export interface RegistrationRequest extends BaseAuthRequest {
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
     * User's date of birth (YYYY-MM-DD)
     */
    dateOfBirth: string;

    /**
     * User's phone number
     */
    phoneNumber?: string;

    /**
     * Marketing opt-in preference
     */
    marketingOptIn?: boolean;

    /**
     * Terms and conditions acceptance
     */
    termsAccepted: boolean;
  }

  /**
   * Registration response payload
   */
  export interface RegistrationResponse {
    /**
     * Authentication session with tokens
     */
    session: AuthSession;

    /**
     * User profile information
     */
    user: UserProfile;

    /**
     * Indicates if email verification is required
     */
    requiresEmailVerification: boolean;

    /**
     * Verification token if email verification is required
     */
    verificationToken?: string;
  }

  /**
   * Token refresh request payload
   */
  export interface TokenRefreshRequest extends BaseAuthRequest {
    /**
     * Refresh token for obtaining a new access token
     */
    refreshToken: string;
    
    /**
     * Current access token (optional, for token rotation security)
     */
    accessToken?: string;
  }

  /**
   * Token refresh response payload
   */
  export interface TokenRefreshResponse {
    /**
     * New authentication session with updated tokens
     */
    session: AuthSession;
    
    /**
     * Token rotation indicator
     * When true, the refresh token has been rotated and the old one is invalidated
     */
    tokenRotated?: boolean;
  }

  /**
   * Logout request payload
   */
  export interface LogoutRequest extends BaseAuthRequest {
    /**
     * Refresh token to invalidate
     */
    refreshToken: string;
    
    /**
     * Access token to blacklist
     */
    accessToken: string;

    /**
     * Whether to logout from all devices
     */
    logoutFromAllDevices?: boolean;
  }

  /**
   * Logout response payload
   */
  export interface LogoutResponse {
    /**
     * Indicates if logout was successful
     */
    success: boolean;
  }

  /**
   * Password reset request payload
   */
  export interface PasswordResetRequest extends BaseAuthRequest {
    /**
     * User email address
     */
    email: string;
  }

  /**
   * Password reset response payload
   */
  export interface PasswordResetResponse {
    /**
     * Indicates if password reset email was sent successfully
     */
    success: boolean;
  }

  /**
   * Password reset confirmation request payload
   */
  export interface PasswordResetConfirmationRequest extends BaseAuthRequest {
    /**
     * Password reset token from email
     */
    token: string;

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
   * Password reset confirmation response payload
   */
  export interface PasswordResetConfirmationResponse {
    /**
     * Indicates if password was reset successfully
     */
    success: boolean;

    /**
     * Authentication session if auto-login is enabled
     */
    session?: AuthSession;
  }

  /**
   * Email verification request payload
   */
  export interface EmailVerificationRequest extends BaseAuthRequest {
    /**
     * Email verification token
     */
    token: string;
  }

  /**
   * Email verification response payload
   */
  export interface EmailVerificationResponse {
    /**
     * Indicates if email was verified successfully
     */
    success: boolean;

    /**
     * Authentication session if auto-login is enabled
     */
    session?: AuthSession;
  }

  /**
   * MFA setup request payload
   */
  export interface MfaSetupRequest extends BaseAuthRequest {
    /**
     * MFA method to set up
     */
    method: MfaMethod;

    /**
     * Phone number for SMS verification
     */
    phoneNumber?: string;
  }

  /**
   * MFA setup response payload
   */
  export interface MfaSetupResponse {
    /**
     * Indicates if MFA setup was initiated successfully
     */
    success: boolean;

    /**
     * MFA setup challenge ID
     */
    challengeId: string;

    /**
     * QR code data URL for TOTP setup
     */
    qrCodeDataUrl?: string;

    /**
     * Secret key for TOTP setup
     */
    secretKey?: string;
  }

  /**
   * MFA verification request payload
   */
  export interface MfaVerificationRequest extends BaseAuthRequest {
    /**
     * MFA challenge ID
     */
    challengeId: string;

    /**
     * Verification code provided by the user
     */
    code: string;

    /**
     * MFA method used for verification
     */
    method: MfaMethod;
  }

  /**
   * MFA verification response payload
   */
  export interface MfaVerificationResponse {
    /**
     * Indicates if MFA verification was successful
     */
    success: boolean;

    /**
     * Authentication session if verification was successful
     */
    session?: AuthSession;
  }

  /**
   * MFA method options
   * - sms: SMS-based verification code
   * - email: Email-based verification code
   * - totp: Time-based One-Time Password (authenticator apps)
   * - recovery: Recovery codes for account access
   * - webauthn: WebAuthn/FIDO2 authentication (security keys, biometrics)
   */
  export type MfaMethod = 'sms' | 'email' | 'totp' | 'recovery' | 'webauthn';

  /**
   * MFA recovery codes request
   */
  export interface MfaRecoveryCodesRequest extends BaseAuthRequest {
    /**
     * Current password for verification
     */
    currentPassword: string;
  }

  /**
   * MFA recovery codes response
   */
  export interface MfaRecoveryCodesResponse {
    /**
     * List of recovery codes
     */
    recoveryCodes: string[];
  }

  /**
   * Change password request payload
   */
  export interface ChangePasswordRequest extends BaseAuthRequest {
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
   * Change password response payload
   */
  export interface ChangePasswordResponse {
    /**
     * Indicates if password was changed successfully
     */
    success: boolean;
  }

  /**
   * Token validation error types
   */
  export enum TokenErrorType {
    EXPIRED = 'token_expired',
    INVALID_SIGNATURE = 'invalid_signature',
    MALFORMED = 'malformed_token',
    MISSING = 'missing_token',
    BLACKLISTED = 'blacklisted_token',
    INSUFFICIENT_SCOPE = 'insufficient_scope',
    INVALID_ISSUER = 'invalid_issuer',
    INVALID_AUDIENCE = 'invalid_audience'
  }
  
  /**
   * Token validation error response
   */
  export interface TokenValidationError {
    /**
     * Error type
     */
    type: TokenErrorType;
    
    /**
     * Error message
     */
    message: string;
    
    /**
     * Error details
     */
    details?: Record<string, unknown>;
  }
  
  /**
   * User profile information
   */
  export interface UserProfile {
    /**
     * User ID
     */
    id: string;

    /**
     * User email address
     */
    email: string;

    /**
     * User's first name
     */
    firstName: string;

    /**
     * User's last name
     */
    lastName: string;

    /**
     * User's full name (firstName + lastName)
     */
    fullName: string;

    /**
     * User's date of birth (YYYY-MM-DD)
     */
    dateOfBirth?: string;

    /**
     * User's phone number
     */
    phoneNumber?: string;

    /**
     * User's profile picture URL
     */
    profilePictureUrl?: string;

    /**
     * Indicates if email is verified
     */
    emailVerified: boolean;

    /**
     * Indicates if MFA is enabled
     */
    mfaEnabled: boolean;

    /**
     * MFA methods enabled for the user
     */
    mfaMethods?: MfaMethod[];

    /**
     * User's preferred language
     */
    preferredLanguage?: string;

    /**
     * User's roles
     */
    roles: string[];

    /**
     * User's permissions
     */
    permissions: string[];

    /**
     * User's creation date
     */
    createdAt: string;

    /**
     * User's last update date
     */
    updatedAt: string;

    /**
     * User's last login date
     */
    lastLoginAt?: string;
  }

  /**
   * Update user profile request payload
   */
  export interface UpdateProfileRequest extends BaseAuthRequest {
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
  }

  /**
   * Update user profile response payload
   */
  export interface UpdateProfileResponse {
    /**
     * Updated user profile
     */
    user: UserProfile;
  }

  /**
   * Upload profile picture request payload
   */
  export interface UploadProfilePictureRequest extends BaseAuthRequest {
    /**
     * Profile picture file
     * Note: This will be handled as a multipart/form-data request
     */
    file: File;
  }

  /**
   * Upload profile picture response payload
   */
  export interface UploadProfilePictureResponse {
    /**
     * URL of the uploaded profile picture
     */
    profilePictureUrl: string;
  }

  /**
   * Get user sessions request
   */
  export interface GetUserSessionsRequest extends BaseAuthRequest {}

  /**
   * User session information
   */
  export interface UserSession {
    /**
     * Session ID
     */
    id: string;

    /**
     * Device information
     */
    deviceInfo: DeviceInfo;

    /**
     * IP address
     */
    ipAddress: string;

    /**
     * Location information (if available)
     */
    location?: string;

    /**
     * Session creation date
     */
    createdAt: string;

    /**
     * Last activity date
     */
    lastActivityAt: string;

    /**
     * Indicates if this is the current session
     */
    isCurrent: boolean;
  }

  /**
   * Get user sessions response
   */
  export interface GetUserSessionsResponse {
    /**
     * List of user sessions
     */
    sessions: UserSession[];
  }

  /**
   * Revoke session request
   */
  export interface RevokeSessionRequest extends BaseAuthRequest {
    /**
     * Session ID to revoke
     */
    sessionId: string;
  }

  /**
   * Revoke session response
   */
  export interface RevokeSessionResponse {
    /**
     * Indicates if session was revoked successfully
     */
    success: boolean;
  }

  /**
   * Social login request payload
   */
  export interface SocialLoginRequest extends BaseAuthRequest {
    /**
     * Social provider
     */
    provider: 'google' | 'facebook' | 'apple' | 'microsoft';

    /**
     * Access token or authorization code from the social provider
     */
    token: string;

    /**
     * ID token for providers that support it (e.g., Google, Apple)
     */
    idToken?: string;
    
    /**
     * OAuth state parameter for CSRF protection
     */
    state?: string;
    
    /**
     * OAuth code verifier for PKCE flow
     */
    codeVerifier?: string;
  }

  /**
   * Social login response payload
   */
  export interface SocialLoginResponse {
    /**
     * Authentication session with tokens
     */
    session: AuthSession;

    /**
     * User profile information
     */
    user: UserProfile;

    /**
     * Indicates if this is a new user
     */
    isNewUser: boolean;

    /**
     * Indicates if profile completion is required
     */
    requiresProfileCompletion?: boolean;
  }

  /**
   * Check email availability request
   */
  export interface CheckEmailRequest {
    /**
     * Email to check
     */
    email: string;
  }

  /**
   * Check email availability response
   */
  export interface CheckEmailResponse {
    /**
     * Indicates if email is available (not registered)
     */
    available: boolean;
  }
  
  /**
   * WebAuthn registration request
   */
  export interface WebAuthnRegistrationRequest extends BaseAuthRequest {
    /**
     * User ID
     */
    userId: string;
    
    /**
     * Friendly name for the security key/device
     */
    deviceName: string;
  }
  
  /**
   * WebAuthn registration response
   */
  export interface WebAuthnRegistrationResponse {
    /**
     * Indicates if registration was successful
     */
    success: boolean;
    
    /**
     * Credential ID of the registered authenticator
     */
    credentialId?: string;
  }
  
  /**
   * WebAuthn authentication request
   */
  export interface WebAuthnAuthenticationRequest extends BaseAuthRequest {
    /**
     * User ID (optional, can be determined from email in some flows)
     */
    userId?: string;
    
    /**
     * User email (optional, can be used to look up the user)
     */
    email?: string;
  }
  
  /**
   * WebAuthn authentication response
   */
  export interface WebAuthnAuthenticationResponse {
    /**
     * Authentication session with tokens
     */
    session: AuthSession;
    
    /**
     * User profile information
     */
    user: UserProfile;
  }
}
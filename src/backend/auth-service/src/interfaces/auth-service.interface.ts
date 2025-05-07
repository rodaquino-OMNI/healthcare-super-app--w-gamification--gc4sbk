/**
 * Auth Service Interface
 * 
 * This file defines the core interfaces that represent the public API contract for the auth-service.
 * It contains interfaces for service capabilities, supported authentication methods, and service health.
 * These interfaces are essential for consistent integration with API Gateway and other services.
 */

// Import shared types from @austa/interfaces
import {
  IUser,
  IRole,
  IPermission,
  IJwtPayloadBase,
  ITokenValidationResult,
  ILoginRequestDto,
  IRegisterRequestDto,
  ILoginResponseDto,
  IRegisterResponseDto,
  IRefreshTokenRequestDto,
} from '@austa/interfaces/auth';

import { IJwtTokens, IJwtPayload, IJourneySpecificClaims } from './token.interface';
import { IUserContext } from './user-context.interface';

/**
 * Authentication methods supported by the auth service
 */
export enum AuthMethod {
  /** Email and password authentication */
  EMAIL_PASSWORD = 'email_password',
  /** OAuth2 authentication */
  OAUTH2 = 'oauth2',
  /** Single sign-on authentication */
  SSO = 'sso',
  /** Multi-factor authentication */
  MFA = 'mfa',
  /** Biometric authentication (mobile only) */
  BIOMETRIC = 'biometric',
}

/**
 * Authentication provider types for OAuth2 and SSO
 */
export enum AuthProvider {
  /** Google authentication provider */
  GOOGLE = 'google',
  /** Facebook authentication provider */
  FACEBOOK = 'facebook',
  /** Apple authentication provider */
  APPLE = 'apple',
  /** Microsoft authentication provider */
  MICROSOFT = 'microsoft',
  /** Custom SAML provider */
  SAML = 'saml',
}

/**
 * Interface for authentication strategy capabilities
 */
export interface IAuthStrategy {
  /** Unique identifier for this strategy */
  readonly id: string;
  
  /** Authentication method this strategy implements */
  readonly method: AuthMethod;
  
  /** Provider for OAuth2/SSO strategies */
  readonly provider?: AuthProvider;
  
  /** Whether this strategy is currently enabled */
  readonly isEnabled: boolean;
  
  /** Whether this strategy requires additional verification */
  readonly requiresVerification: boolean;
  
  /** Configuration options for this strategy */
  readonly config: Record<string, any>;
}

/**
 * Interface for service health information
 */
export interface IAuthServiceHealth {
  /** Whether the service is operational */
  isOperational: boolean;
  
  /** Current service version */
  version: string;
  
  /** Uptime in seconds */
  uptime: number;
  
  /** Database connection status */
  databaseStatus: {
    isConnected: boolean;
    latency: number;
  };
  
  /** Redis connection status */
  redisStatus: {
    isConnected: boolean;
    latency: number;
  };
  
  /** Available authentication strategies */
  availableStrategies: AuthMethod[];
}

/**
 * Interface for password policy configuration
 */
export interface IPasswordPolicy {
  /** Minimum password length */
  minLength: number;
  
  /** Whether to require uppercase characters */
  requireUppercase: boolean;
  
  /** Whether to require lowercase characters */
  requireLowercase: boolean;
  
  /** Whether to require numbers */
  requireNumbers: boolean;
  
  /** Whether to require special characters */
  requireSpecialChars: boolean;
  
  /** Maximum password age in days (0 = no expiration) */
  maxPasswordAge: number;
  
  /** Number of previous passwords to prevent reuse */
  preventPasswordReuse: number;
}

/**
 * Interface for session configuration
 */
export interface ISessionConfig {
  /** Access token lifetime in seconds */
  accessTokenLifetime: number;
  
  /** Refresh token lifetime in seconds */
  refreshTokenLifetime: number;
  
  /** Whether to use sliding sessions (extend on activity) */
  useSlidingSessions: boolean;
  
  /** Whether to allow concurrent sessions for the same user */
  allowConcurrentSessions: boolean;
  
  /** Maximum number of concurrent sessions per user (0 = unlimited) */
  maxConcurrentSessions: number;
}

/**
 * Interface for authentication result
 */
export interface IAuthResult {
  /** Whether authentication was successful */
  success: boolean;
  
  /** JWT tokens if authentication was successful */
  tokens?: IJwtTokens;
  
  /** User context if authentication was successful */
  userContext?: IUserContext;
  
  /** Error message if authentication failed */
  error?: string;
  
  /** Whether additional verification is required */
  requiresVerification?: boolean;
  
  /** Verification method if additional verification is required */
  verificationMethod?: string;
  
  /** Verification token if additional verification is required */
  verificationToken?: string;
}

/**
 * Interface for verification result
 */
export interface IVerificationResult {
  /** Whether verification was successful */
  success: boolean;
  
  /** JWT tokens if verification was successful */
  tokens?: IJwtTokens;
  
  /** User context if verification was successful */
  userContext?: IUserContext;
  
  /** Error message if verification failed */
  error?: string;
}

/**
 * Main interface for the Auth Service
 * Defines the public API contract for the service
 */
export interface IAuthService {
  /**
   * Get available authentication strategies
   * @returns Promise resolving to an array of available authentication strategies
   */
  getAuthStrategies(): Promise<IAuthStrategy[]>;
  
  /**
   * Get service health information
   * @returns Promise resolving to service health information
   */
  getServiceHealth(): Promise<IAuthServiceHealth>;
  
  /**
   * Get password policy configuration
   * @returns Promise resolving to password policy configuration
   */
  getPasswordPolicy(): Promise<IPasswordPolicy>;
  
  /**
   * Get session configuration
   * @returns Promise resolving to session configuration
   */
  getSessionConfig(): Promise<ISessionConfig>;
  
  /**
   * Authenticate a user with email and password
   * @param email User email
   * @param password User password
   * @returns Promise resolving to authentication result
   */
  authenticateWithEmailPassword(email: string, password: string): Promise<IAuthResult>;
  
  /**
   * Authenticate a user with OAuth2
   * @param provider OAuth2 provider
   * @param token OAuth2 token
   * @returns Promise resolving to authentication result
   */
  authenticateWithOAuth2(provider: AuthProvider, token: string): Promise<IAuthResult>;
  
  /**
   * Authenticate a user with SSO
   * @param provider SSO provider
   * @param token SSO token
   * @returns Promise resolving to authentication result
   */
  authenticateWithSSO(provider: AuthProvider, token: string): Promise<IAuthResult>;
  
  /**
   * Authenticate a user with biometrics (mobile only)
   * @param userId User ID
   * @param biometricToken Biometric token
   * @returns Promise resolving to authentication result
   */
  authenticateWithBiometrics(userId: string, biometricToken: string): Promise<IAuthResult>;
  
  /**
   * Verify a user with multi-factor authentication
   * @param userId User ID
   * @param verificationToken Verification token
   * @param verificationCode Verification code
   * @returns Promise resolving to verification result
   */
  verifyWithMFA(userId: string, verificationToken: string, verificationCode: string): Promise<IVerificationResult>;
  
  /**
   * Register a new user
   * @param registerDto User registration data
   * @returns Promise resolving to registration result
   */
  registerUser(registerDto: IRegisterRequestDto): Promise<IRegisterResponseDto>;
  
  /**
   * Login a user
   * @param loginDto User login data
   * @returns Promise resolving to login result
   */
  loginUser(loginDto: ILoginRequestDto): Promise<ILoginResponseDto>;
  
  /**
   * Refresh access token
   * @param refreshDto Refresh token data
   * @returns Promise resolving to new JWT tokens
   */
  refreshToken(refreshDto: IRefreshTokenRequestDto): Promise<IJwtTokens>;
  
  /**
   * Validate a token
   * @param token JWT token to validate
   * @returns Promise resolving to token validation result
   */
  validateToken(token: string): Promise<ITokenValidationResult>;
  
  /**
   * Logout a user
   * @param userId User ID
   * @param refreshToken Refresh token
   * @returns Promise resolving to logout success
   */
  logoutUser(userId: string, refreshToken: string): Promise<boolean>;
  
  /**
   * Logout a user from all devices
   * @param userId User ID
   * @returns Promise resolving to logout success
   */
  logoutUserFromAllDevices(userId: string): Promise<boolean>;
  
  /**
   * Get user context from token
   * @param token JWT token
   * @returns Promise resolving to user context
   */
  getUserContextFromToken(token: string): Promise<IUserContext>;
  
  /**
   * Update user journey context
   * @param userId User ID
   * @param journeyType Journey type
   * @param journeyContext Journey context data
   * @returns Promise resolving to updated user context
   */
  updateUserJourneyContext(userId: string, journeyType: string, journeyContext: any): Promise<IUserContext>;
  
  /**
   * Request password reset
   * @param email User email
   * @returns Promise resolving to request success
   */
  requestPasswordReset(email: string): Promise<boolean>;
  
  /**
   * Reset password
   * @param resetToken Password reset token
   * @param newPassword New password
   * @returns Promise resolving to reset success
   */
  resetPassword(resetToken: string, newPassword: string): Promise<boolean>;
  
  /**
   * Change password
   * @param userId User ID
   * @param currentPassword Current password
   * @param newPassword New password
   * @returns Promise resolving to change success
   */
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  
  /**
   * Enable multi-factor authentication
   * @param userId User ID
   * @param mfaType MFA type (e.g., 'totp', 'sms')
   * @returns Promise resolving to MFA setup data
   */
  enableMFA(userId: string, mfaType: string): Promise<{ secret: string; qrCodeUrl?: string }>;
  
  /**
   * Disable multi-factor authentication
   * @param userId User ID
   * @param verificationCode Verification code
   * @returns Promise resolving to disable success
   */
  disableMFA(userId: string, verificationCode: string): Promise<boolean>;
  
  /**
   * Verify email address
   * @param verificationToken Email verification token
   * @returns Promise resolving to verification success
   */
  verifyEmail(verificationToken: string): Promise<boolean>;
  
  /**
   * Resend email verification
   * @param email User email
   * @returns Promise resolving to resend success
   */
  resendEmailVerification(email: string): Promise<boolean>;
}
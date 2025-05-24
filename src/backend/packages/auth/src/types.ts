/**
 * @file Authentication system type definitions
 * 
 * This file contains TypeScript type definitions specific to the authentication system,
 * including token payload types, authentication request types, and authentication
 * configuration types. It enhances type safety across the authentication system by
 * providing clear interface contracts, improving developer experience with
 * autocompletion and compile-time type checking.
 */

import { Request } from 'express';

/**
 * Supported authentication providers for social login
 */
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

/**
 * Supported multi-factor authentication methods
 */
export enum MfaMethod {
  SMS = 'sms',
  EMAIL = 'email',
  AUTHENTICATOR = 'authenticator',
}

/**
 * Authentication event types for logging and monitoring
 */
export enum AuthEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGE = 'password_change',
  MFA_CHALLENGE = 'mfa_challenge',
  MFA_VERIFY = 'mfa_verify',
  TOKEN_REFRESH = 'token_refresh',
  SOCIAL_LOGIN = 'social_login',
}

/**
 * JWT token types
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'reset_password',
  VERIFY_EMAIL = 'verify_email',
  MFA_CHALLENGE = 'mfa_challenge',
}

/**
 * Standard claims included in JWT tokens
 */
export interface JwtClaims {
  /** JWT issuer (who created and signed this token) */
  iss?: string;
  /** JWT subject (whom the token refers to) */
  sub: string;
  /** JWT audience (recipient for whom the token is intended) */
  aud?: string | string[];
  /** Expiration time (as NumericDate) */
  exp: number;
  /** Not before (as NumericDate) */
  nbf?: number;
  /** Issued at (as NumericDate) */
  iat: number;
  /** JWT ID */
  jti?: string;
}

/**
 * User information included in JWT token payload
 */
export interface TokenUserInfo {
  /** User ID */
  id: string;
  /** User email */
  email: string;
  /** User roles */
  roles: string[];
  /** Journey-specific permissions */
  permissions?: Record<string, string[]>;
}

/**
 * Complete JWT token payload structure
 */
export interface TokenPayload extends JwtClaims, TokenUserInfo {
  /** Token type (access, refresh, etc.) */
  type: TokenType;
  /** Provider used for authentication */
  provider?: AuthProvider;
  /** Journey context if applicable */
  journeyContext?: string;
}

/**
 * Token response returned to clients after successful authentication
 */
export interface TokenResponse {
  /** JWT access token */
  accessToken: string;
  /** JWT refresh token */
  refreshToken: string;
  /** Access token expiration timestamp (in seconds) */
  expiresIn: number;
  /** Token type (always 'Bearer' for JWT) */
  tokenType: 'Bearer';
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequest {
  /** JWT refresh token */
  refreshToken: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  /** User email */
  email: string;
  /** User password */
  password: string;
  /** Remember user preference */
  rememberMe?: boolean;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  /** User email */
  email: string;
  /** User password */
  password: string;
  /** User first name */
  firstName: string;
  /** User last name */
  lastName: string;
  /** User phone number */
  phoneNumber?: string;
}

/**
 * Social login request payload
 */
export interface SocialLoginRequest {
  /** OAuth provider */
  provider: AuthProvider;
  /** Authorization code from OAuth provider */
  code: string;
  /** Redirect URI used in OAuth flow */
  redirectUri?: string;
  /** ID token (for Apple Sign In) */
  idToken?: string;
}

/**
 * Multi-factor authentication challenge request
 */
export interface MfaChallengeRequest {
  /** User ID */
  userId: string;
  /** MFA method to use */
  method: MfaMethod;
}

/**
 * Multi-factor authentication verification request
 */
export interface MfaVerifyRequest {
  /** Temporary token from MFA challenge */
  token: string;
  /** Verification code */
  code: string;
}

/**
 * Password reset request payload
 */
export interface PasswordResetRequest {
  /** User email */
  email: string;
}

/**
 * Password reset confirmation payload
 */
export interface PasswordResetConfirmRequest {
  /** Password reset token */
  token: string;
  /** New password */
  password: string;
}

/**
 * Password change request payload
 */
export interface PasswordChangeRequest {
  /** Current password */
  currentPassword: string;
  /** New password */
  newPassword: string;
}

/**
 * Authentication result with token response
 */
export interface AuthResult {
  /** User information */
  user: UserResponse;
  /** Token information */
  tokens: TokenResponse;
  /** Whether MFA is required */
  mfaRequired?: boolean;
  /** MFA challenge token if MFA is required */
  mfaChallengeToken?: string;
}

/**
 * Base user entity structure
 */
export interface User {
  /** User ID */
  id: string;
  /** User email */
  email: string;
  /** User first name */
  firstName: string;
  /** User last name */
  lastName: string;
  /** User phone number */
  phoneNumber?: string;
  /** Whether email is verified */
  emailVerified: boolean;
  /** Whether MFA is enabled */
  mfaEnabled: boolean;
  /** Preferred MFA method */
  mfaMethod?: MfaMethod;
  /** User creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt: Date;
  /** Authentication provider */
  provider: AuthProvider;
  /** External provider ID if using social login */
  externalId?: string;
}

/**
 * User with roles and permissions
 */
export interface UserWithRoles extends User {
  /** User roles */
  roles: Role[];
}

/**
 * User response returned to clients
 */
export interface UserResponse {
  /** User ID */
  id: string;
  /** User email */
  email: string;
  /** User first name */
  firstName: string;
  /** User last name */
  lastName: string;
  /** User phone number */
  phoneNumber?: string;
  /** Whether email is verified */
  emailVerified: boolean;
  /** Whether MFA is enabled */
  mfaEnabled: boolean;
  /** Preferred MFA method */
  mfaMethod?: MfaMethod;
  /** User creation date */
  createdAt: string;
  /** Last update date */
  updatedAt: string;
  /** Authentication provider */
  provider: AuthProvider;
  /** User roles */
  roles: string[];
  /** Journey-specific permissions */
  permissions?: Record<string, string[]>;
}

/**
 * Role entity structure
 */
export interface Role {
  /** Role ID */
  id: string;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Whether this is a system role */
  isSystem: boolean;
  /** Journey this role belongs to (if journey-specific) */
  journey?: string;
  /** Permissions assigned to this role */
  permissions?: Permission[];
}

/**
 * Permission entity structure
 */
export interface Permission {
  /** Permission ID */
  id: string;
  /** Permission name */
  name: string;
  /** Permission description */
  description?: string;
  /** Resource this permission applies to */
  resource: string;
  /** Action this permission allows */
  action: string;
  /** Journey this permission belongs to (if journey-specific) */
  journey?: string;
}

/**
 * JWT configuration options
 */
export interface JwtConfig {
  /** Secret key for signing tokens */
  secret: string;
  /** Access token expiration time (in seconds) */
  accessTokenExpiration: number;
  /** Refresh token expiration time (in seconds) */
  refreshTokenExpiration: number;
  /** Token issuer */
  issuer?: string;
  /** Token audience */
  audience?: string;
  /** Whether to use Redis for token blacklisting */
  useRedisBlacklist?: boolean;
  /** Redis connection options if using blacklist */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  /** Client ID */
  clientId: string;
  /** Client secret */
  clientSecret: string;
  /** Redirect URI */
  redirectUri: string;
  /** Authorization endpoint */
  authorizationUrl?: string;
  /** Token endpoint */
  tokenUrl?: string;
  /** User info endpoint */
  userInfoUrl?: string;
  /** Scope requested from provider */
  scope?: string;
}

/**
 * OAuth configuration for all providers
 */
export interface OAuthConfig {
  /** Google OAuth configuration */
  google?: OAuthProviderConfig;
  /** Facebook OAuth configuration */
  facebook?: OAuthProviderConfig;
  /** Apple OAuth configuration */
  apple?: OAuthProviderConfig & {
    /** Apple team ID */
    teamId?: string;
    /** Apple key ID */
    keyId?: string;
    /** Apple private key */
    privateKey?: string;
  };
}

/**
 * Multi-factor authentication configuration
 */
export interface MfaConfig {
  /** Whether MFA is enabled */
  enabled: boolean;
  /** Available MFA methods */
  methods: MfaMethod[];
  /** Default MFA method */
  defaultMethod?: MfaMethod;
  /** MFA token expiration time (in seconds) */
  challengeTokenExpiration: number;
  /** SMS provider configuration */
  sms?: {
    provider: string;
    apiKey: string;
    from: string;
  };
  /** Email provider configuration */
  email?: {
    from: string;
    templateId?: string;
  };
}

/**
 * Complete authentication configuration
 */
export interface AuthConfig {
  /** JWT configuration */
  jwt: JwtConfig;
  /** OAuth configuration */
  oauth?: OAuthConfig;
  /** MFA configuration */
  mfa?: MfaConfig;
  /** Password policy configuration */
  passwordPolicy?: {
    /** Minimum password length */
    minLength: number;
    /** Whether to require uppercase letters */
    requireUppercase: boolean;
    /** Whether to require lowercase letters */
    requireLowercase: boolean;
    /** Whether to require numbers */
    requireNumbers: boolean;
    /** Whether to require special characters */
    requireSpecialChars: boolean;
    /** Maximum password age (in days) */
    maxAge?: number;
  };
}

/**
 * Authentication event structure for logging and monitoring
 */
export interface AuthEvent {
  /** Event type */
  type: AuthEventType;
  /** User ID */
  userId?: string;
  /** User email */
  email?: string;
  /** Authentication provider */
  provider?: AuthProvider;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
  /** Event timestamp */
  timestamp: Date;
  /** Event status (success/failure) */
  status: 'success' | 'failure';
  /** Error message if status is failure */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Express request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  /** Authenticated user */
  user?: TokenUserInfo;
}

/**
 * Discriminated union type for auth events
 */
export type AuthEventUnion =
  | { type: AuthEventType.LOGIN; email: string; provider: AuthProvider; rememberMe?: boolean }
  | { type: AuthEventType.LOGOUT; userId: string }
  | { type: AuthEventType.REGISTER; email: string; provider: AuthProvider }
  | { type: AuthEventType.PASSWORD_RESET; email: string }
  | { type: AuthEventType.PASSWORD_CHANGE; userId: string }
  | { type: AuthEventType.MFA_CHALLENGE; userId: string; method: MfaMethod }
  | { type: AuthEventType.MFA_VERIFY; userId: string; method: MfaMethod }
  | { type: AuthEventType.TOKEN_REFRESH; userId: string }
  | { type: AuthEventType.SOCIAL_LOGIN; email: string; provider: AuthProvider };

/**
 * Utility type for extracting user properties
 */
export type UserProperty<T extends keyof User> = User[T];

/**
 * Utility type for creating a partial user with required fields
 */
export type PartialUserWithRequired<RequiredKeys extends keyof User> = 
  Pick<User, RequiredKeys> & Partial<Omit<User, RequiredKeys>>;

/**
 * Utility type for token operations
 */
export type TokenOperation = {
  /** Operation type */
  operation: 'create' | 'verify' | 'refresh' | 'revoke';
  /** Token type */
  tokenType: TokenType;
  /** Token payload for create operations */
  payload?: Omit<TokenPayload, keyof JwtClaims>;
  /** Token string for verify/refresh/revoke operations */
  token?: string;
};
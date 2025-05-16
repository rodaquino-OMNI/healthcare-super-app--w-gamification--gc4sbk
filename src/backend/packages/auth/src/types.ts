/**
 * @file Authentication system type definitions
 * @description Contains TypeScript type definitions specific to the authentication system,
 * including token payload types, authentication request types, and authentication configuration types.
 */

/**
 * JWT Token Types
 */

/**
 * Standard JWT payload structure with user information and claims
 */
export interface JwtPayload {
  /** Unique identifier for the user (subject) */
  sub: string;
  /** User's email address */
  email: string;
  /** User's roles for authorization */
  roles: string[];
  /** Journey-specific claims for cross-journey authorization */
  journeyClaims?: Record<string, unknown>;
  /** Token issued at timestamp (seconds since epoch) */
  iat?: number;
  /** Token expiration timestamp (seconds since epoch) */
  exp?: number;
  /** Token issuer identifier */
  iss?: string;
  /** Audience this token is intended for */
  aud?: string | string[];
  /** JWT ID - unique identifier for this token */
  jti?: string;
}

/**
 * Pair of access and refresh tokens used for authentication
 */
export interface TokenPair {
  /** JWT access token for API authorization */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Access token expiration timestamp (seconds since epoch) */
  expiresAt: number;
}

/**
 * Standard response format for token-issuing operations
 */
export interface TokenResponse extends TokenPair {
  /** Token type (always 'Bearer' for JWT) */
  tokenType: 'Bearer';
}

/**
 * User Authentication Types
 */

/**
 * Authenticated user information available in request objects
 */
export interface AuthenticatedUser {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name?: string;
  /** User's assigned roles */
  roles: string[];
  /** User's permissions derived from roles */
  permissions?: string[];
  /** Journey-specific user attributes */
  journeyAttributes?: Record<string, unknown>;
  /** Last authentication timestamp */
  lastAuthenticated?: Date;
}

/**
 * User credentials for login and registration
 */
export interface UserCredentials {
  /** User's email address */
  email: string;
  /** User's password (plain text for input only) */
  password: string;
  /** User's display name (optional for login, required for registration) */
  name?: string;
}

/**
 * Multi-factor authentication verification data
 */
export interface MfaVerification {
  /** Type of MFA method being used */
  method: 'totp' | 'sms' | 'email';
  /** Verification code provided by the user */
  code: string;
  /** User identifier for the verification */
  userId: string;
  /** Challenge identifier for this verification attempt */
  challengeId?: string;
}

/**
 * Session information for tracking authentication state
 */
export interface SessionInfo {
  /** Unique session identifier */
  id: string;
  /** User identifier associated with this session */
  userId: string;
  /** IP address that created this session */
  ipAddress?: string;
  /** User agent information for the session */
  userAgent?: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActiveAt: Date;
  /** Session expiration timestamp */
  expiresAt: Date;
  /** Whether this session has been revoked */
  isRevoked: boolean;
}

/**
 * Role and Permission Types
 */

/**
 * Role definition for role-based access control
 */
export interface Role {
  /** Unique identifier for the role */
  id: string;
  /** Role name (e.g., 'admin', 'user', 'health-journey-user') */
  name: string;
  /** Human-readable description of the role */
  description?: string;
  /** Whether this is a system role that cannot be modified */
  isSystem?: boolean;
  /** Journey this role belongs to (null for global roles) */
  journeyId?: string | null;
  /** Permissions granted by this role */
  permissions?: Permission[];
}

/**
 * Permission definition for fine-grained access control
 */
export interface Permission {
  /** Unique identifier for the permission */
  id: string;
  /** Permission name in format 'resource:action' (e.g., 'users:read') */
  name: string;
  /** Human-readable description of the permission */
  description?: string;
  /** Resource this permission applies to */
  resource: string;
  /** Action allowed on the resource */
  action: string;
  /** Conditions or constraints on this permission */
  conditions?: Record<string, unknown>;
}

/**
 * Role assignment linking users to roles
 */
export interface RoleAssignment {
  /** User identifier */
  userId: string;
  /** Role identifier */
  roleId: string;
  /** When this role was assigned */
  assignedAt: Date;
  /** Who assigned this role (user ID) */
  assignedBy?: string;
  /** When this role assignment expires (null for permanent) */
  expiresAt?: Date | null;
}

/**
 * Authentication Response Types
 */

/**
 * Response format for user registration
 */
export interface RegisterResponse {
  /** User information */
  user: {
    id: string;
    email: string;
    name?: string;
  };
  /** Authentication tokens */
  tokens: TokenResponse;
}

/**
 * Response format for user login
 */
export interface LoginResponse {
  /** User information */
  user: {
    id: string;
    email: string;
    name?: string;
    roles: string[];
  };
  /** Authentication tokens */
  tokens: TokenResponse;
}

/**
 * Response format for token refresh
 */
export interface RefreshTokenResponse {
  /** New authentication tokens */
  tokens: TokenResponse;
}

/**
 * Authentication Event Types
 */

/**
 * Base interface for all authentication events
 */
export interface BaseAuthEvent {
  /** Event timestamp */
  timestamp: Date;
  /** User identifier */
  userId: string;
  /** IP address that triggered the event */
  ipAddress?: string;
  /** User agent information */
  userAgent?: string;
  /** Session identifier (if applicable) */
  sessionId?: string;
}

/**
 * Login event data
 */
export interface LoginEvent extends BaseAuthEvent {
  /** Event type discriminator */
  type: 'login';
  /** Login method used */
  method: 'password' | 'oauth' | 'token' | 'mfa';
  /** Whether the login was successful */
  success: boolean;
  /** Error message if login failed */
  errorMessage?: string;
  /** OAuth provider if applicable */
  oauthProvider?: string;
}

/**
 * Logout event data
 */
export interface LogoutEvent extends BaseAuthEvent {
  /** Event type discriminator */
  type: 'logout';
  /** Logout reason */
  reason?: 'user_initiated' | 'session_expired' | 'admin_action' | 'security_violation';
}

/**
 * Registration event data
 */
export interface RegistrationEvent extends BaseAuthEvent {
  /** Event type discriminator */
  type: 'registration';
  /** Registration method used */
  method: 'email_password' | 'oauth';
  /** Whether the registration was successful */
  success: boolean;
  /** Error message if registration failed */
  errorMessage?: string;
  /** OAuth provider if applicable */
  oauthProvider?: string;
}

/**
 * Password reset event data
 */
export interface PasswordResetEvent extends BaseAuthEvent {
  /** Event type discriminator */
  type: 'password_reset';
  /** Current stage in the password reset flow */
  stage: 'requested' | 'token_validated' | 'completed';
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if the operation failed */
  errorMessage?: string;
}

/**
 * MFA event data
 */
export interface MfaEvent extends BaseAuthEvent {
  /** Event type discriminator */
  type: 'mfa';
  /** MFA operation type */
  operation: 'setup' | 'verify' | 'disable';
  /** MFA method used */
  method: 'totp' | 'sms' | 'email';
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if the operation failed */
  errorMessage?: string;
}

/**
 * Token event data
 */
export interface TokenEvent extends BaseAuthEvent {
  /** Event type discriminator */
  type: 'token';
  /** Token operation type */
  operation: 'issued' | 'refreshed' | 'revoked' | 'validated';
  /** Token type */
  tokenType: 'access' | 'refresh';
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if the operation failed */
  errorMessage?: string;
}

/**
 * Union type for all authentication events
 */
export type AuthEvent =
  | LoginEvent
  | LogoutEvent
  | RegistrationEvent
  | PasswordResetEvent
  | MfaEvent
  | TokenEvent;

/**
 * Authentication Configuration Types
 */

/**
 * JWT configuration options
 */
export interface JwtConfig {
  /** Secret key for signing JWTs */
  secret: string;
  /** Access token expiration time in seconds */
  accessTokenExpiration: number;
  /** Refresh token expiration time in seconds */
  refreshTokenExpiration: number;
  /** JWT issuer claim */
  issuer?: string;
  /** JWT audience claim */
  audience?: string | string[];
  /** Whether to include timestamp claims (iat, exp) */
  includeTimestampClaims?: boolean;
  /** Algorithm to use for signing */
  algorithm?: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** OAuth callback URL */
  callbackUrl: string;
  /** OAuth scopes to request */
  scope: string[];
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
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
  apple?: OAuthProviderConfig;
  /** Microsoft OAuth configuration */
  microsoft?: OAuthProviderConfig;
  /** Additional OAuth providers */
  [provider: string]: OAuthProviderConfig | undefined;
}

/**
 * Password policy configuration
 */
export interface PasswordPolicyConfig {
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
  /** Maximum password age in days (0 for no expiration) */
  maxAgeDays: number;
  /** Number of previous passwords to prevent reuse (0 to disable) */
  preventReuse: number;
}

/**
 * MFA configuration options
 */
export interface MfaConfig {
  /** Whether MFA is enabled for the system */
  enabled: boolean;
  /** Available MFA methods */
  methods: ('totp' | 'sms' | 'email')[];
  /** Whether to enforce MFA for all users */
  enforced: boolean;
  /** User roles that require MFA */
  requiredForRoles?: string[];
  /** TOTP-specific configuration */
  totp?: {
    /** TOTP issuer name */
    issuer: string;
    /** TOTP algorithm */
    algorithm: 'SHA1' | 'SHA256' | 'SHA512';
    /** TOTP digits */
    digits: 6 | 8;
    /** TOTP period in seconds */
    period: number;
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
  /** Password policy configuration */
  passwordPolicy: PasswordPolicyConfig;
  /** MFA configuration */
  mfa?: MfaConfig;
  /** Session configuration */
  session?: {
    /** Session duration in seconds */
    duration: number;
    /** Whether to use sliding expiration */
    slidingExpiration: boolean;
    /** Whether to enforce single session per user */
    singleSession: boolean;
  };
  /** Rate limiting configuration */
  rateLimit?: {
    /** Max login attempts before lockout */
    maxLoginAttempts: number;
    /** Lockout duration in seconds */
    lockoutDuration: number;
    /** Whether to use exponential backoff for repeated failures */
    useExponentialBackoff: boolean;
  };
}
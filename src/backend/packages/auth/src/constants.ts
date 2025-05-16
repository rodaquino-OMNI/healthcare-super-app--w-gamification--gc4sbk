/**
 * Authentication Constants
 * 
 * This file centralizes all authentication-related constants used throughout the AUSTA SuperApp.
 * It provides a single source of truth for error codes, claim types, token types, and configuration keys
 * to ensure consistency and avoid magic strings across the codebase.
 */

/**
 * Authentication Error Codes
 * 
 * Standardized error codes for authentication-related errors.
 * These codes are used for client-side error handling and debugging.
 */
export const ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  ACCOUNT_LOCKED: 'AUTH_004',
  INVALID_TOKEN: 'AUTH_005',
  MFA_REQUIRED: 'AUTH_006',
  MFA_INVALID_CODE: 'AUTH_007',
  SESSION_EXPIRED: 'AUTH_008',
  MAX_SESSIONS_EXCEEDED: 'AUTH_009',
  PASSWORD_POLICY_VIOLATION: 'AUTH_010',
  EMAIL_ALREADY_EXISTS: 'AUTH_011',
  USERNAME_ALREADY_EXISTS: 'AUTH_012',
  INVALID_REFRESH_TOKEN: 'AUTH_013',
  OAUTH_PROVIDER_ERROR: 'AUTH_014',
  BIOMETRIC_VERIFICATION_FAILED: 'AUTH_015',
  RATE_LIMIT_EXCEEDED: 'AUTH_016',
};

/**
 * JWT Claim Types
 * 
 * Standard claims used in JWT tokens for the AUSTA SuperApp.
 * These claims are used to store user information and permissions in the token.
 */
export const JWT_CLAIMS = {
  USER_ID: 'sub',
  EMAIL: 'email',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  ISSUED_AT: 'iat',
  EXPIRATION: 'exp',
  ISSUER: 'iss',
  AUDIENCE: 'aud',
  JOURNEY_ACCESS: 'journeys',
  SESSION_ID: 'sid',
  TOKEN_TYPE: 'type',
  MFA_VERIFIED: 'mfa',
  DEVICE_ID: 'did',
};

/**
 * Token Types
 * 
 * Types of tokens used in the authentication system.
 */
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  ID: 'id',
  MFA: 'mfa',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
};

/**
 * Configuration Keys
 * 
 * Keys used for accessing configuration values from the environment.
 * These keys are used in the auth service configuration.
 */
export const CONFIG_KEYS = {
  JWT_SECRET: 'JWT_SECRET',
  JWT_ACCESS_EXPIRATION: 'JWT_ACCESS_EXPIRATION',
  JWT_REFRESH_EXPIRATION: 'JWT_REFRESH_EXPIRATION',
  JWT_ISSUER: 'JWT_ISSUER',
  JWT_AUDIENCE: 'JWT_AUDIENCE',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_ISSUER: 'MFA_ISSUER',
  MFA_CODE_EXPIRATION: 'MFA_CODE_EXPIRATION',
  MFA_WINDOW_SIZE: 'MFA_WINDOW_SIZE',
  SMS_PROVIDER: 'SMS_PROVIDER',
  EMAIL_MFA_ENABLED: 'EMAIL_MFA_ENABLED',
  SMS_MFA_ENABLED: 'SMS_MFA_ENABLED',
  TOTP_MFA_ENABLED: 'TOTP_MFA_ENABLED',
  PASSWORD_MIN_LENGTH: 'PASSWORD_MIN_LENGTH',
  PASSWORD_REQUIRE_UPPERCASE: 'PASSWORD_REQUIRE_UPPERCASE',
  PASSWORD_REQUIRE_LOWERCASE: 'PASSWORD_REQUIRE_LOWERCASE',
  PASSWORD_REQUIRE_NUMBER: 'PASSWORD_REQUIRE_NUMBER',
  PASSWORD_REQUIRE_SPECIAL: 'PASSWORD_REQUIRE_SPECIAL',
  PASSWORD_HISTORY: 'PASSWORD_HISTORY',
  PASSWORD_MAX_AGE: 'PASSWORD_MAX_AGE',
  PASSWORD_LOCKOUT_THRESHOLD: 'PASSWORD_LOCKOUT_THRESHOLD',
  PASSWORD_LOCKOUT_DURATION: 'PASSWORD_LOCKOUT_DURATION',
  MAX_CONCURRENT_SESSIONS: 'MAX_CONCURRENT_SESSIONS',
  SESSION_ABSOLUTE_TIMEOUT: 'SESSION_ABSOLUTE_TIMEOUT',
  SESSION_INACTIVITY_TIMEOUT: 'SESSION_INACTIVITY_TIMEOUT',
  REMEMBER_ME_EXTENSION: 'REMEMBER_ME_EXTENSION',
};

/**
 * Permission Constants
 * 
 * Constants for permission types used in role-based access control.
 * These permissions are used to control access to resources across the AUSTA SuperApp.
 */
export const PERMISSIONS = {
  // User management permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Role management permissions
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  
  // Permission management permissions
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_READ: 'permission:read',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_DELETE: 'permission:delete',
  
  // Journey-specific permissions
  HEALTH_JOURNEY_ACCESS: 'journey:health:access',
  CARE_JOURNEY_ACCESS: 'journey:care:access',
  PLAN_JOURNEY_ACCESS: 'journey:plan:access',
  
  // Admin permissions
  ADMIN_ACCESS: 'admin:access',
  SYSTEM_CONFIG: 'system:config',
};

/**
 * OAuth Provider Types
 * 
 * Types of OAuth providers supported by the authentication system.
 */
export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  APPLE: 'apple',
};

/**
 * MFA Types
 * 
 * Types of multi-factor authentication methods supported by the system.
 */
export const MFA_TYPES = {
  SMS: 'sms',
  EMAIL: 'email',
  TOTP: 'totp',
};

/**
 * Session Constants
 * 
 * Constants related to user sessions and session management.
 */
export const SESSION = {
  DEVICE_TYPES: {
    MOBILE: 'mobile',
    WEB: 'web',
    TABLET: 'tablet',
    DESKTOP: 'desktop',
    OTHER: 'other',
  },
  STATUS: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    REVOKED: 'revoked',
  },
};
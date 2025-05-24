/**
 * Authentication Constants
 * 
 * This file centralizes all authentication-related constants used throughout the AUSTA SuperApp.
 * It provides a single source of truth for error codes, claim types, token types, and configuration keys,
 * ensuring consistency and avoiding magic strings across the codebase.
 */

/**
 * Authentication Error Codes
 * 
 * Standardized error codes for authentication-related errors.
 * These codes are used for client-side error handling and debugging.
 */
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  INVALID_TOKEN: 'AUTH_004',
  INVALID_REFRESH_TOKEN: 'AUTH_005',
  SESSION_EXPIRED: 'AUTH_006',
  ACCOUNT_LOCKED: 'AUTH_007',
  MFA_REQUIRED: 'AUTH_008',
  MFA_INVALID_CODE: 'AUTH_009',
  PASSWORD_POLICY_VIOLATION: 'AUTH_010',
  EMAIL_ALREADY_EXISTS: 'AUTH_011',
  USERNAME_ALREADY_EXISTS: 'AUTH_012',
  INVALID_RESET_TOKEN: 'AUTH_013',
  MAX_SESSIONS_EXCEEDED: 'AUTH_014',
  BIOMETRIC_VERIFICATION_FAILED: 'AUTH_015',
  OAUTH_PROVIDER_ERROR: 'AUTH_016',
  RATE_LIMIT_EXCEEDED: 'AUTH_017',
  ACCOUNT_NOT_VERIFIED: 'AUTH_018',
  INVALID_JOURNEY_ACCESS: 'AUTH_019',
  TOKEN_REVOKED: 'AUTH_020',
};

/**
 * JWT Claim Types
 * 
 * Standard and custom claims used in JWT tokens throughout the authentication system.
 * These constants ensure consistent token structure and processing.
 */
export const JWT_CLAIMS = {
  // Standard JWT claims
  SUBJECT: 'sub',           // User ID
  ISSUER: 'iss',            // Token issuer (AUSTA)
  AUDIENCE: 'aud',          // Intended recipient of the token
  ISSUED_AT: 'iat',         // Token issuance timestamp
  EXPIRATION: 'exp',        // Token expiration timestamp
  NOT_BEFORE: 'nbf',        // Token validity start timestamp
  JWT_ID: 'jti',            // Unique token identifier
  
  // Custom claims
  EMAIL: 'email',           // User email
  ROLES: 'roles',           // User roles
  PERMISSIONS: 'permissions', // User permissions
  SESSION_ID: 'sid',        // Session identifier
  DEVICE_ID: 'did',         // Device identifier
  MFA_VERIFIED: 'mfa',      // MFA verification status
  USER_TYPE: 'uty',         // User type (patient, provider, admin)
  
  // Journey-specific claims
  HEALTH_JOURNEY_ACCESS: 'hja', // Health journey access level
  CARE_JOURNEY_ACCESS: 'cja',   // Care journey access level
  PLAN_JOURNEY_ACCESS: 'pja',   // Plan journey access level
};

/**
 * Token Types
 * 
 * Constants defining different token types used in the authentication system.
 */
export const TOKEN_TYPES = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  ID: 'id_token',
  VERIFICATION: 'verification_token',
  PASSWORD_RESET: 'password_reset_token',
  MFA: 'mfa_token',
  API: 'api_token',
  DEVICE: 'device_token',
};

/**
 * Configuration Keys
 * 
 * Constants for environment variable names used in the authentication configuration.
 * These keys are used to retrieve configuration values from the environment.
 */
export const CONFIG_KEYS = {
  // Server configuration
  PORT: 'AUTH_SERVICE_PORT',
  HOST: 'AUTH_SERVICE_HOST',
  NODE_ENV: 'NODE_ENV',
  API_PREFIX: 'AUTH_SERVICE_API_PREFIX',
  
  // JWT configuration
  JWT_SECRET: 'JWT_SECRET',
  JWT_ACCESS_EXPIRATION: 'JWT_ACCESS_EXPIRATION',
  JWT_REFRESH_EXPIRATION: 'JWT_REFRESH_EXPIRATION',
  JWT_ISSUER: 'JWT_ISSUER',
  JWT_AUDIENCE: 'JWT_AUDIENCE',
  
  // OAuth configuration
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  GOOGLE_CALLBACK_URL: 'GOOGLE_CALLBACK_URL',
  GOOGLE_AUTH_ENABLED: 'GOOGLE_AUTH_ENABLED',
  FACEBOOK_CLIENT_ID: 'FACEBOOK_CLIENT_ID',
  FACEBOOK_CLIENT_SECRET: 'FACEBOOK_CLIENT_SECRET',
  FACEBOOK_CALLBACK_URL: 'FACEBOOK_CALLBACK_URL',
  FACEBOOK_AUTH_ENABLED: 'FACEBOOK_AUTH_ENABLED',
  APPLE_CLIENT_ID: 'APPLE_CLIENT_ID',
  APPLE_TEAM_ID: 'APPLE_TEAM_ID',
  APPLE_KEY_ID: 'APPLE_KEY_ID',
  APPLE_PRIVATE_KEY: 'APPLE_PRIVATE_KEY',
  APPLE_CALLBACK_URL: 'APPLE_CALLBACK_URL',
  APPLE_AUTH_ENABLED: 'APPLE_AUTH_ENABLED',
  
  // MFA configuration
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_ISSUER: 'MFA_ISSUER',
  MFA_CODE_EXPIRATION: 'MFA_CODE_EXPIRATION',
  MFA_WINDOW_SIZE: 'MFA_WINDOW_SIZE',
  SMS_PROVIDER: 'SMS_PROVIDER',
  EMAIL_MFA_ENABLED: 'EMAIL_MFA_ENABLED',
  SMS_MFA_ENABLED: 'SMS_MFA_ENABLED',
  TOTP_MFA_ENABLED: 'TOTP_MFA_ENABLED',
  
  // Database configuration
  DATABASE_URL: 'AUTH_DATABASE_URL',
  DATABASE_SSL: 'DATABASE_SSL',
  DATABASE_MAX_CONNECTIONS: 'DATABASE_MAX_CONNECTIONS',
  DATABASE_IDLE_TIMEOUT: 'DATABASE_IDLE_TIMEOUT',
  
  // Session management
  MAX_CONCURRENT_SESSIONS: 'MAX_CONCURRENT_SESSIONS',
  SESSION_ABSOLUTE_TIMEOUT: 'SESSION_ABSOLUTE_TIMEOUT',
  SESSION_INACTIVITY_TIMEOUT: 'SESSION_INACTIVITY_TIMEOUT',
  REMEMBER_ME_EXTENSION: 'REMEMBER_ME_EXTENSION',
  
  // Password policy
  PASSWORD_MIN_LENGTH: 'PASSWORD_MIN_LENGTH',
  PASSWORD_REQUIRE_UPPERCASE: 'PASSWORD_REQUIRE_UPPERCASE',
  PASSWORD_REQUIRE_LOWERCASE: 'PASSWORD_REQUIRE_LOWERCASE',
  PASSWORD_REQUIRE_NUMBER: 'PASSWORD_REQUIRE_NUMBER',
  PASSWORD_REQUIRE_SPECIAL: 'PASSWORD_REQUIRE_SPECIAL',
  PASSWORD_HISTORY: 'PASSWORD_HISTORY',
  PASSWORD_MAX_AGE: 'PASSWORD_MAX_AGE',
  PASSWORD_LOCKOUT_THRESHOLD: 'PASSWORD_LOCKOUT_THRESHOLD',
  PASSWORD_LOCKOUT_DURATION: 'PASSWORD_LOCKOUT_DURATION',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 'RATE_LIMIT_WINDOW_MS',
  RATE_LIMIT_MAX: 'RATE_LIMIT_MAX',
  
  // CORS
  CORS_ORIGIN: 'CORS_ORIGIN',
  CORS_METHODS: 'CORS_METHODS',
  CORS_CREDENTIALS: 'CORS_CREDENTIALS',
  
  // Logging
  LOG_LEVEL: 'LOG_LEVEL',
  LOG_FORMAT: 'LOG_FORMAT',
  LOG_FILE_OUTPUT: 'LOG_FILE_OUTPUT',
  LOG_FILE_PATH: 'LOG_FILE_PATH',
  
  // Monitoring
  MONITORING_ENABLED: 'MONITORING_ENABLED',
  METRICS_PATH: 'METRICS_PATH',
};

/**
 * Permission Constants
 * 
 * Constants defining permission types and resources used in the authorization system.
 * These constants ensure consistent permission checking across the application.
 */
export const PERMISSIONS = {
  // Action types
  ACTIONS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage',  // Full control
    EXECUTE: 'execute', // For operations/functions
  },
  
  // Resource types
  RESOURCES: {
    // User resources
    USER: 'user',
    PROFILE: 'profile',
    ROLE: 'role',
    PERMISSION: 'permission',
    SESSION: 'session',
    
    // Journey-specific resources
    HEALTH_JOURNEY: 'health_journey',
    CARE_JOURNEY: 'care_journey',
    PLAN_JOURNEY: 'plan_journey',
    
    // Authentication resources
    AUTHENTICATION: 'authentication',
    MFA: 'mfa',
    PASSWORD: 'password',
    API_KEY: 'api_key',
  },
  
  // Special permission flags
  FLAGS: {
    ADMIN: 'admin',           // Administrative access
    SELF: 'self',             // Self-resource access
    JOURNEY_ADMIN: 'journey_admin', // Journey-specific admin
    SYSTEM: 'system',         // System-level operations
  },
};

/**
 * Role Constants
 * 
 * Predefined roles used in the authentication system.
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
  
  // Journey-specific roles
  HEALTH_ADMIN: 'health_admin',
  HEALTH_USER: 'health_user',
  CARE_ADMIN: 'care_admin',
  CARE_USER: 'care_user',
  PLAN_ADMIN: 'plan_admin',
  PLAN_USER: 'plan_user',
  
  // Special roles
  SYSTEM: 'system',
  API: 'api',
};

/**
 * Authentication Providers
 * 
 * Constants for different authentication providers supported by the system.
 */
export const AUTH_PROVIDERS = {
  LOCAL: 'local',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  APPLE: 'apple',
  MICROSOFT: 'microsoft',
  BIOMETRIC: 'biometric',
};

/**
 * MFA Types
 * 
 * Constants for different multi-factor authentication methods.
 */
export const MFA_TYPES = {
  SMS: 'sms',
  EMAIL: 'email',
  TOTP: 'totp',
  PUSH: 'push',
  BIOMETRIC: 'biometric',
};
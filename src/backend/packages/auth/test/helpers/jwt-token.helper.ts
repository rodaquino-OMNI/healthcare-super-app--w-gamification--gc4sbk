/**
 * JWT Token Test Helper
 * 
 * Provides utility functions for generating test JWT tokens with customizable claims and payloads
 * for authentication tests. This file enables developers to create valid/invalid tokens with
 * different permission sets, roles, expiration times, and custom claims for various test scenarios.
 */
import { sign } from 'jsonwebtoken';
import { TokenPayload } from '../../src/types';
import { JWT_CLAIMS, TOKEN_TYPES } from '../../src/constants';

/**
 * Default test secret key for signing JWT tokens
 * Note: This is only for testing and should never be used in production
 */
export const TEST_JWT_SECRET = 'test-jwt-secret-key-for-unit-testing-only';

/**
 * Default test issuer for JWT tokens
 */
export const TEST_JWT_ISSUER = 'austa-superapp-test';

/**
 * Default test audience for JWT tokens
 */
export const TEST_JWT_AUDIENCE = 'austa-users-test';

/**
 * Options for generating test JWT tokens
 */
export interface GenerateTokenOptions {
  /** User ID to include in the token (sub claim) */
  userId?: string;
  /** User email to include in the token */
  email?: string;
  /** User roles to include in the token */
  roles?: string[];
  /** Permissions to include in the token */
  permissions?: string[];
  /** Journey-specific claims to include in the token */
  journeyClaims?: Record<string, unknown>;
  /** Session ID to include in the token */
  sessionId?: string;
  /** Device ID to include in the token */
  deviceId?: string;
  /** Whether MFA has been verified for this session */
  mfaVerified?: boolean;
  /** Token expiration time in seconds from now (default: 3600) */
  expiresIn?: number;
  /** Whether to include timestamp claims (iat, exp) */
  includeTimestampClaims?: boolean;
  /** Secret key to use for signing (default: TEST_JWT_SECRET) */
  secret?: string;
  /** Issuer claim (default: TEST_JWT_ISSUER) */
  issuer?: string;
  /** Audience claim (default: TEST_JWT_AUDIENCE) */
  audience?: string | string[];
  /** Token type (default: 'access') */
  tokenType?: string;
  /** Whether to sign the token (set to false for invalid signature tests) */
  sign?: boolean;
  /** Additional custom claims to include in the token */
  additionalClaims?: Record<string, unknown>;
}

/**
 * Default test user for token generation
 */
export const DEFAULT_TEST_USER = {
  userId: 'test-user-id',
  email: 'test@example.com',
  roles: ['user'],
  permissions: [],
};

/**
 * Generates a JWT token for testing purposes with customizable claims
 * 
 * @param options Options for token generation
 * @returns JWT token string
 */
export function generateTestToken(options: GenerateTokenOptions = {}): string {
  const now = Math.floor(Date.now() / 1000);
  
  // Merge options with defaults
  const {
    userId = DEFAULT_TEST_USER.userId,
    email = DEFAULT_TEST_USER.email,
    roles = DEFAULT_TEST_USER.roles,
    permissions = DEFAULT_TEST_USER.permissions,
    journeyClaims,
    sessionId,
    deviceId,
    mfaVerified,
    expiresIn = 3600, // 1 hour default
    includeTimestampClaims = true,
    secret = TEST_JWT_SECRET,
    issuer = TEST_JWT_ISSUER,
    audience = TEST_JWT_AUDIENCE,
    tokenType = TOKEN_TYPES.ACCESS,
    sign: shouldSign = true,
    additionalClaims = {},
  } = options;

  // Create the payload
  const payload: Record<string, any> = {
    [JWT_CLAIMS.USER_ID]: userId,
    [JWT_CLAIMS.EMAIL]: email,
    [JWT_CLAIMS.ROLES]: roles,
    [JWT_CLAIMS.TOKEN_TYPE]: tokenType,
    ...additionalClaims,
  };

  // Add optional claims
  if (permissions.length > 0) {
    payload[JWT_CLAIMS.PERMISSIONS] = permissions;
  }

  if (journeyClaims) {
    payload[JWT_CLAIMS.JOURNEY_ACCESS] = journeyClaims;
  }

  if (sessionId) {
    payload[JWT_CLAIMS.SESSION_ID] = sessionId;
  }

  if (deviceId) {
    payload[JWT_CLAIMS.DEVICE_ID] = deviceId;
  }

  if (mfaVerified !== undefined) {
    payload[JWT_CLAIMS.MFA_VERIFIED] = mfaVerified;
  }

  // Add timestamp claims if configured
  if (includeTimestampClaims) {
    payload[JWT_CLAIMS.ISSUED_AT] = now;
    payload[JWT_CLAIMS.EXPIRATION] = now + expiresIn;
  }

  // Add issuer and audience if configured
  if (issuer) {
    payload[JWT_CLAIMS.ISSUER] = issuer;
  }

  if (audience) {
    payload[JWT_CLAIMS.AUDIENCE] = audience;
  }

  // Sign the token if requested
  if (shouldSign) {
    return sign(payload, secret, {
      algorithm: 'HS256',
      expiresIn,
    });
  } else {
    // For testing invalid signatures, create a properly formatted but unsigned token
    // This is a simplified version that won't pass validation but has the right format
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${body}.invalid-signature`;
  }
}

/**
 * Generates an expired JWT token for testing token expiration handling
 * 
 * @param options Additional options for token generation
 * @returns Expired JWT token string
 */
export function generateExpiredToken(options: Partial<GenerateTokenOptions> = {}): string {
  // Create a token that expired 1 hour ago
  return generateTestToken({
    ...options,
    expiresIn: -3600, // Negative value means it expired 1 hour ago
  });
}

/**
 * Generates a JWT token that is about to expire for testing token refresh logic
 * 
 * @param options Additional options for token generation
 * @param secondsUntilExpiry Seconds until the token expires (default: 30)
 * @returns JWT token string that will expire soon
 */
export function generateAboutToExpireToken(
  options: Partial<GenerateTokenOptions> = {},
  secondsUntilExpiry = 30
): string {
  return generateTestToken({
    ...options,
    expiresIn: secondsUntilExpiry,
  });
}

/**
 * Generates a long-lived JWT token for testing long-running sessions
 * 
 * @param options Additional options for token generation
 * @param daysValid Number of days the token should be valid (default: 30)
 * @returns Long-lived JWT token string
 */
export function generateLongLivedToken(
  options: Partial<GenerateTokenOptions> = {},
  daysValid = 30
): string {
  const secondsValid = daysValid * 24 * 60 * 60; // Convert days to seconds
  return generateTestToken({
    ...options,
    expiresIn: secondsValid,
  });
}

/**
 * Generates a JWT token with an invalid signature for testing signature validation
 * 
 * @param options Additional options for token generation
 * @returns JWT token with invalid signature
 */
export function generateInvalidSignatureToken(options: Partial<GenerateTokenOptions> = {}): string {
  return generateTestToken({
    ...options,
    sign: false,
  });
}

/**
 * Generates a JWT token with admin permissions for testing admin functionality
 * 
 * @param options Additional options for token generation
 * @returns JWT token with admin permissions
 */
export function generateAdminToken(options: Partial<GenerateTokenOptions> = {}): string {
  return generateTestToken({
    ...options,
    roles: ['admin', ...(options.roles || [])],
    permissions: [
      'admin:access',
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'role:create',
      'role:read',
      'role:update',
      'role:delete',
      'permission:create',
      'permission:read',
      'permission:update',
      'permission:delete',
      'system:config',
      ...(options.permissions || []),
    ],
  });
}

/**
 * Generates a JWT token for a specific journey
 * 
 * @param journeyType The journey type ('health', 'care', or 'plan')
 * @param options Additional options for token generation
 * @returns JWT token with journey-specific claims
 */
export function generateJourneyToken(
  journeyType: 'health' | 'care' | 'plan',
  options: Partial<GenerateTokenOptions> = {}
): string {
  const journeyPermission = `journey:${journeyType}:access`;
  const journeyClaims = {
    ...options.journeyClaims,
    [journeyType]: { enabled: true, level: 'full' },
  };

  return generateTestToken({
    ...options,
    permissions: [journeyPermission, ...(options.permissions || [])],
    journeyClaims,
    roles: [`${journeyType}-user`, ...(options.roles || [])],
  });
}

/**
 * Generates a health journey token for testing health journey functionality
 * 
 * @param options Additional options for token generation
 * @returns JWT token for health journey
 */
export function generateHealthJourneyToken(options: Partial<GenerateTokenOptions> = {}): string {
  return generateJourneyToken('health', options);
}

/**
 * Generates a care journey token for testing care journey functionality
 * 
 * @param options Additional options for token generation
 * @returns JWT token for care journey
 */
export function generateCareJourneyToken(options: Partial<GenerateTokenOptions> = {}): string {
  return generateJourneyToken('care', options);
}

/**
 * Generates a plan journey token for testing plan journey functionality
 * 
 * @param options Additional options for token generation
 * @returns JWT token for plan journey
 */
export function generatePlanJourneyToken(options: Partial<GenerateTokenOptions> = {}): string {
  return generateJourneyToken('plan', options);
}

/**
 * Generates a multi-journey token for testing cross-journey functionality
 * 
 * @param journeyTypes Array of journey types to include
 * @param options Additional options for token generation
 * @returns JWT token with multiple journey claims
 */
export function generateMultiJourneyToken(
  journeyTypes: Array<'health' | 'care' | 'plan'>,
  options: Partial<GenerateTokenOptions> = {}
): string {
  const journeyPermissions = journeyTypes.map(type => `journey:${type}:access`);
  const journeyClaims = journeyTypes.reduce(
    (claims, type) => ({
      ...claims,
      [type]: { enabled: true, level: 'full' },
    }),
    options.journeyClaims || {}
  );

  const journeyRoles = journeyTypes.map(type => `${type}-user`);

  return generateTestToken({
    ...options,
    permissions: [...journeyPermissions, ...(options.permissions || [])],
    journeyClaims,
    roles: [...journeyRoles, ...(options.roles || [])],
  });
}

/**
 * Generates a token with MFA verification for testing MFA-protected routes
 * 
 * @param options Additional options for token generation
 * @returns JWT token with MFA verification
 */
export function generateMfaVerifiedToken(options: Partial<GenerateTokenOptions> = {}): string {
  return generateTestToken({
    ...options,
    mfaVerified: true,
  });
}

/**
 * Generates a token without MFA verification for testing MFA enforcement
 * 
 * @param options Additional options for token generation
 * @returns JWT token without MFA verification
 */
export function generateNonMfaVerifiedToken(options: Partial<GenerateTokenOptions> = {}): string {
  return generateTestToken({
    ...options,
    mfaVerified: false,
  });
}

/**
 * Generates a token with a specific session ID for testing session management
 * 
 * @param sessionId Session ID to include in the token
 * @param options Additional options for token generation
 * @returns JWT token with session ID
 */
export function generateSessionToken(
  sessionId: string,
  options: Partial<GenerateTokenOptions> = {}
): string {
  return generateTestToken({
    ...options,
    sessionId,
  });
}

/**
 * Generates a token with a specific device ID for testing device binding
 * 
 * @param deviceId Device ID to include in the token
 * @param options Additional options for token generation
 * @returns JWT token with device ID
 */
export function generateDeviceToken(
  deviceId: string,
  options: Partial<GenerateTokenOptions> = {}
): string {
  return generateTestToken({
    ...options,
    deviceId,
  });
}
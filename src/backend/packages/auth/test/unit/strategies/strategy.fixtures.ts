/**
 * Authentication Strategy Test Fixtures
 * 
 * This file provides test data fixtures for authentication strategy testing, including:
 * - Mock JWT payloads with various states (valid, expired, malformed)
 * - Sample user credentials for local authentication
 * - OAuth profile data structures for different providers (Google, Facebook, Apple)
 * 
 * These fixtures enable consistent and comprehensive test coverage across all authentication flows.
 */

import { ITokenPayload, IUserCredentials } from '../../../src/interfaces';

/**
 * Interface for OAuth profile test data
 */
export interface IOAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  locale?: string;
  isVerified?: boolean;
}

/**
 * Interface for OAuth tokens test data
 */
export interface IOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

/**
 * JWT Token Test Fixtures
 */
export const jwtFixtures = {
  /**
   * Valid JWT payload with all required fields
   */
  validPayload: {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@austa.health',
    name: 'Test User',
    roles: ['user'],
    permissions: ['health:read', 'care:read', 'plan:read'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iss: 'austa-auth-service',
    aud: 'austa-superapp',
    jti: '7f8d9e0a-1b2c-3d4e-5f6g-7h8i9j0k1l2m'
  } as ITokenPayload,

  /**
   * Valid JWT payload with minimal required fields
   */
  minimalPayload: {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  } as ITokenPayload,

  /**
   * JWT payload with journey-specific context data
   */
  journeyContextPayload: {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@austa.health',
    name: 'Test User',
    roles: ['user'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    journeyContext: {
      health: {
        lastMetricId: '5f8d9e0a-1b2c-3d4e-5f6g-7h8i9j0k1l2m',
        preferredUnits: 'metric'
      },
      care: {
        lastAppointmentId: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
        preferredProvider: 'dr-smith'
      },
      plan: {
        activePlanId: '9i8h7g6f-5e4d-3c2b-1a0z-9y8x7w6v5u4t',
        lastClaimId: '2q3w4e5r-6t7y-8u9i-0o9i-8u7y6t5r4e3w'
      }
    }
  } as ITokenPayload,

  /**
   * Expired JWT payload (expired 1 hour ago)
   */
  expiredPayload: {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@austa.health',
    name: 'Test User',
    roles: ['user'],
    iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    iss: 'austa-auth-service',
    aud: 'austa-superapp'
  } as ITokenPayload,

  /**
   * JWT payload with future nbf (not valid yet)
   */
  notBeforePayload: {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@austa.health',
    name: 'Test User',
    roles: ['user'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    nbf: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
    iss: 'austa-auth-service',
    aud: 'austa-superapp'
  } as ITokenPayload,

  /**
   * JWT payload with missing required fields
   */
  missingSubPayload: {
    email: 'test@austa.health',
    name: 'Test User',
    roles: ['user'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  } as unknown as ITokenPayload,

  /**
   * JWT payload with invalid issuer
   */
  invalidIssuerPayload: {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@austa.health',
    name: 'Test User',
    roles: ['user'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'unknown-issuer',
    aud: 'austa-superapp'
  } as ITokenPayload,

  /**
   * JWT payload with invalid audience
   */
  invalidAudiencePayload: {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@austa.health',
    name: 'Test User',
    roles: ['user'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'austa-auth-service',
    aud: 'unknown-audience'
  } as ITokenPayload,

  /**
   * JWT payload with admin role
   */
  adminPayload: {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@austa.health',
    name: 'Admin User',
    roles: ['admin'],
    permissions: ['health:read', 'health:write', 'care:read', 'care:write', 'plan:read', 'plan:write'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'austa-auth-service',
    aud: 'austa-superapp'
  } as ITokenPayload,

  /**
   * Malformed JWT token string (not a valid JWT format)
   */
  malformedToken: 'not-a-valid-jwt-token',

  /**
   * Valid JWT token string (for testing token parsing)
   * Note: This is a mock token and not actually signed
   */
  validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InRlc3RAYWF1c3RhLmhlYWx0aCIsIm5hbWUiOiJUZXN0IFVzZXIiLCJyb2xlcyI6WyJ1c2VyIl0sImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.mock-signature',

  /**
   * Expired JWT token string (for testing token validation)
   * Note: This is a mock token and not actually signed
   */
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InRlc3RAYWF1c3RhLmhlYWx0aCIsIm5hbWUiOiJUZXN0IFVzZXIiLCJyb2xlcyI6WyJ1c2VyIl0sImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.mock-signature'
};

/**
 * Local Authentication Test Fixtures
 */
export const localAuthFixtures = {
  /**
   * Valid user credentials
   */
  validCredentials: {
    email: 'test@austa.health',
    password: 'Password123!'
  } as IUserCredentials,

  /**
   * Admin user credentials
   */
  adminCredentials: {
    email: 'admin@austa.health',
    password: 'AdminPass123!'
  } as IUserCredentials,

  /**
   * Invalid credentials (wrong password)
   */
  invalidPasswordCredentials: {
    email: 'test@austa.health',
    password: 'WrongPassword123!'
  } as IUserCredentials,

  /**
   * Invalid credentials (non-existent user)
   */
  nonExistentUserCredentials: {
    email: 'nonexistent@austa.health',
    password: 'Password123!'
  } as IUserCredentials,

  /**
   * Malformed credentials (missing email)
   */
  missingEmailCredentials: {
    password: 'Password123!'
  } as unknown as IUserCredentials,

  /**
   * Malformed credentials (missing password)
   */
  missingPasswordCredentials: {
    email: 'test@austa.health'
  } as unknown as IUserCredentials,

  /**
   * Malformed credentials (empty email)
   */
  emptyEmailCredentials: {
    email: '',
    password: 'Password123!'
  } as IUserCredentials,

  /**
   * Malformed credentials (empty password)
   */
  emptyPasswordCredentials: {
    email: 'test@austa.health',
    password: ''
  } as IUserCredentials,

  /**
   * Credentials with special characters
   */
  specialCharCredentials: {
    email: 'test+special@austa.health',
    password: 'P@$$w0rd!'
  } as IUserCredentials
};

/**
 * OAuth Authentication Test Fixtures
 */
export const oauthFixtures = {
  /**
   * Google OAuth profile
   */
  googleProfile: {
    provider: 'google',
    providerId: '123456789012345678901',
    email: 'test@gmail.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    picture: 'https://lh3.googleusercontent.com/a/photo.jpg',
    locale: 'en',
    isVerified: true
  } as IOAuthProfile,

  /**
   * Facebook OAuth profile
   */
  facebookProfile: {
    provider: 'facebook',
    providerId: '1234567890123456',
    email: 'test@facebook.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    picture: 'https://graph.facebook.com/1234567890123456/picture?type=large',
    locale: 'en_US',
    isVerified: true
  } as IOAuthProfile,

  /**
   * Apple OAuth profile
   */
  appleProfile: {
    provider: 'apple',
    providerId: '001234.abcdef1234567890.1234',
    email: 'test@privaterelay.appleid.com',
    name: 'Test User',
    isVerified: true
  } as IOAuthProfile,

  /**
   * Invalid OAuth profile (missing required fields)
   */
  invalidProfile: {
    provider: 'google',
    providerId: '123456789012345678901'
    // Missing email and name
  } as unknown as IOAuthProfile,

  /**
   * Minimal OAuth profile (only required fields)
   */
  minimalProfile: {
    provider: 'google',
    providerId: '123456789012345678901',
    email: 'minimal@gmail.com',
    name: 'Minimal User'
  } as IOAuthProfile,

  /**
   * OAuth profile with unverified email
   */
  unverifiedProfile: {
    provider: 'google',
    providerId: '123456789012345678901',
    email: 'unverified@gmail.com',
    name: 'Unverified User',
    isVerified: false
  } as IOAuthProfile,

  /**
   * Google OAuth tokens
   */
  googleTokens: {
    accessToken: 'google-mock-access-token',
    refreshToken: 'google-mock-refresh-token',
    idToken: 'google-mock-id-token',
    expiresIn: 3600,
    tokenType: 'Bearer'
  } as IOAuthTokens,

  /**
   * Facebook OAuth tokens
   */
  facebookTokens: {
    accessToken: 'facebook-mock-access-token',
    expiresIn: 3600,
    tokenType: 'Bearer'
  } as IOAuthTokens,

  /**
   * Apple OAuth tokens
   */
  appleTokens: {
    accessToken: 'apple-mock-access-token',
    refreshToken: 'apple-mock-refresh-token',
    idToken: 'apple-mock-id-token',
    expiresIn: 3600,
    tokenType: 'Bearer'
  } as IOAuthTokens
};

/**
 * Mock User Data for Authentication Testing
 */
export const userFixtures = {
  /**
   * Standard user
   */
  standardUser: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@austa.health',
    name: 'Test User',
    roles: ['user'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },

  /**
   * Admin user
   */
  adminUser: {
    id: '223e4567-e89b-12d3-a456-426614174001',
    email: 'admin@austa.health',
    name: 'Admin User',
    roles: ['admin', 'user'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },

  /**
   * User with journey-specific roles
   */
  journeyUser: {
    id: '323e4567-e89b-12d3-a456-426614174002',
    email: 'journey@austa.health',
    name: 'Journey User',
    roles: ['user', 'health:admin', 'care:provider'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },

  /**
   * User with OAuth connections
   */
  oauthUser: {
    id: '423e4567-e89b-12d3-a456-426614174003',
    email: 'oauth@austa.health',
    name: 'OAuth User',
    roles: ['user'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
    oauthConnections: [
      {
        provider: 'google',
        providerId: '123456789012345678901',
        email: 'oauth@gmail.com'
      },
      {
        provider: 'facebook',
        providerId: '1234567890123456',
        email: 'oauth@facebook.com'
      }
    ]
  }
};
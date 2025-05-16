/**
 * @file strategy.fixtures.ts
 * @description Test fixtures for authentication strategies including JWT tokens, user credentials,
 * and OAuth profiles. These fixtures enable comprehensive testing of all authentication flows
 * with consistent test data across authentication components.
 */

import { JourneyType } from '../../../src/interfaces/role.interface';
import { ITokenPayload } from '../../../src/interfaces/token.interface';
import { OAuthProfile, OAuthProviderType } from '../../../src/providers/oauth/interfaces';

// ==========================================
// JWT Token Fixtures
// ==========================================

/**
 * Valid JWT token payload with complete user information
 */
export const validTokenPayload: ITokenPayload = {
  sub: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'Test User',
  roles: [1, 2], // User, Health Journey User
  permissions: ['health:metrics:read', 'health:goals:write', 'profile:read'],
  journeyContext: JourneyType.HEALTH,
  iat: Math.floor(Date.now() / 1000) - 60, // Issued 1 minute ago
  exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
  iss: 'austa-auth-service',
  aud: 'austa-superapp',
  jti: '7f8d9e0a-1b2c-3d4e-5f6g-7h8i9j0k1l2m'
};

/**
 * Expired JWT token payload
 */
export const expiredTokenPayload: ITokenPayload = {
  ...validTokenPayload,
  iat: Math.floor(Date.now() / 1000) - 7200, // Issued 2 hours ago
  exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
};

/**
 * JWT token payload with missing required claims
 */
export const incompleteTokenPayload: Partial<ITokenPayload> = {
  sub: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'Test User',
  // Missing roles and permissions
  iat: Math.floor(Date.now() / 1000) - 60,
  exp: Math.floor(Date.now() / 1000) + 3600,
  // Missing issuer and audience
};

/**
 * Malformed JWT token payload with invalid data types
 */
export const malformedTokenPayload: Record<string, any> = {
  sub: 12345, // Should be string
  email: true, // Should be string
  name: 'Test User',
  roles: 'admin', // Should be array
  permissions: null, // Should be array
  iat: 'yesterday', // Should be number
  exp: 'tomorrow', // Should be number
};

/**
 * Admin user JWT token payload
 */
export const adminTokenPayload: ITokenPayload = {
  ...validTokenPayload,
  roles: [1, 2, 5], // User, Health Journey User, Admin
  permissions: [
    'health:metrics:read',
    'health:metrics:write',
    'health:goals:read',
    'health:goals:write',
    'care:appointments:read',
    'care:appointments:write',
    'plan:benefits:read',
    'plan:claims:read',
    'plan:claims:write',
    'admin:users:read',
    'admin:users:write'
  ],
};

/**
 * Multi-journey user JWT token payload
 */
export const multiJourneyTokenPayload: ITokenPayload = {
  ...validTokenPayload,
  roles: [1, 2, 3, 4], // User, Health Journey User, Care Journey User, Plan Journey User
  permissions: [
    'health:metrics:read',
    'health:goals:read',
    'care:appointments:read',
    'plan:benefits:read',
    'profile:read',
    'profile:write'
  ],
  // No specific journey context - user has access to all journeys
  journeyContext: undefined
};

// ==========================================
// Local Authentication Fixtures
// ==========================================

/**
 * Valid user credentials for local authentication
 */
export const validUserCredentials = {
  email: 'user@example.com',
  password: 'Password123!',
  rememberMe: false
};

/**
 * Invalid user credentials with incorrect password
 */
export const invalidPasswordCredentials = {
  email: 'user@example.com',
  password: 'WrongPassword!',
  rememberMe: false
};

/**
 * Non-existent user credentials
 */
export const nonExistentUserCredentials = {
  email: 'nonexistent@example.com',
  password: 'Password123!',
  rememberMe: false
};

/**
 * User credentials with MFA enabled
 */
export const mfaEnabledUserCredentials = {
  email: 'mfa-user@example.com',
  password: 'Password123!',
  rememberMe: false
};

/**
 * User credentials with special characters
 */
export const specialCharactersCredentials = {
  email: 'user+test@example.com',
  password: 'P@$$w0rd!',
  rememberMe: true
};

/**
 * User registration data
 */
export const validRegistrationData = {
  email: 'newuser@example.com',
  password: 'NewPassword123!',
  name: 'New Test User',
  phone: '+5511987654321',
  acceptedTerms: true
};

/**
 * Invalid registration data (missing required fields)
 */
export const invalidRegistrationData = {
  email: 'incomplete@example.com',
  password: 'Incomplete!',
  // Missing name
  acceptedTerms: false // Terms not accepted
};

// ==========================================
// OAuth Profile Fixtures
// ==========================================

/**
 * Google OAuth profile fixture
 */
export const googleOAuthProfile: OAuthProfile = {
  id: '109876543210987654321',
  provider: 'google' as OAuthProviderType,
  displayName: 'Google Test User',
  firstName: 'Google',
  lastName: 'User',
  email: 'google-user@gmail.com',
  emailVerified: true,
  picture: 'https://lh3.googleusercontent.com/a-/AOh14Gi-profile-picture',
  locale: 'en',
  _raw: {
    sub: '109876543210987654321',
    name: 'Google Test User',
    given_name: 'Google',
    family_name: 'User',
    picture: 'https://lh3.googleusercontent.com/a-/AOh14Gi-profile-picture',
    email: 'google-user@gmail.com',
    email_verified: true,
    locale: 'en'
  },
  _json: {
    sub: '109876543210987654321',
    name: 'Google Test User',
    given_name: 'Google',
    family_name: 'User',
    picture: 'https://lh3.googleusercontent.com/a-/AOh14Gi-profile-picture',
    email: 'google-user@gmail.com',
    email_verified: true,
    locale: 'en'
  }
};

/**
 * Facebook OAuth profile fixture
 */
export const facebookOAuthProfile: OAuthProfile = {
  id: '1234567890123456',
  provider: 'facebook' as OAuthProviderType,
  displayName: 'Facebook Test User',
  firstName: 'Facebook',
  lastName: 'User',
  email: 'facebook-user@example.com',
  emailVerified: true,
  picture: 'https://graph.facebook.com/1234567890123456/picture?type=large',
  gender: 'male',
  locale: 'en_US',
  _raw: {
    id: '1234567890123456',
    name: 'Facebook Test User',
    first_name: 'Facebook',
    last_name: 'User',
    email: 'facebook-user@example.com',
    picture: {
      data: {
        height: 200,
        is_silhouette: false,
        url: 'https://graph.facebook.com/1234567890123456/picture?type=large',
        width: 200
      }
    },
    gender: 'male',
    locale: 'en_US'
  },
  _json: {
    id: '1234567890123456',
    name: 'Facebook Test User',
    first_name: 'Facebook',
    last_name: 'User',
    email: 'facebook-user@example.com',
    picture: {
      data: {
        height: 200,
        is_silhouette: false,
        url: 'https://graph.facebook.com/1234567890123456/picture?type=large',
        width: 200
      }
    },
    gender: 'male',
    locale: 'en_US'
  }
};

/**
 * Apple OAuth profile fixture
 * Note: Apple provides minimal profile information
 */
export const appleOAuthProfile: OAuthProfile = {
  id: '001234.abcdef1234567890abcdef1234567890.1234',
  provider: 'apple' as OAuthProviderType,
  email: 'apple-user@privaterelay.appleid.com', // Apple's private email relay
  emailVerified: true,
  // Apple often doesn't provide name information after the first login
  firstName: 'Apple',
  lastName: 'User',
  _raw: {
    sub: '001234.abcdef1234567890abcdef1234567890.1234',
    email: 'apple-user@privaterelay.appleid.com',
    email_verified: 'true',
    is_private_email: 'true'
  },
  _json: {
    sub: '001234.abcdef1234567890abcdef1234567890.1234',
    email: 'apple-user@privaterelay.appleid.com',
    email_verified: 'true',
    is_private_email: 'true'
  }
};

/**
 * Incomplete OAuth profile fixture (missing email)
 */
export const incompleteOAuthProfile: OAuthProfile = {
  id: '9876543210',
  provider: 'facebook' as OAuthProviderType,
  displayName: 'Incomplete Profile User',
  firstName: 'Incomplete',
  lastName: 'User',
  // Missing email
  emailVerified: false,
  picture: 'https://example.com/profile-picture.jpg',
  _raw: {
    id: '9876543210',
    name: 'Incomplete Profile User',
    first_name: 'Incomplete',
    last_name: 'User',
    picture: {
      data: {
        url: 'https://example.com/profile-picture.jpg'
      }
    }
  },
  _json: {
    id: '9876543210',
    name: 'Incomplete Profile User',
    first_name: 'Incomplete',
    last_name: 'User',
    picture: {
      data: {
        url: 'https://example.com/profile-picture.jpg'
      }
    }
  }
};

// ==========================================
// Token Response Fixtures
// ==========================================

/**
 * Valid token response fixture
 */
export const validTokenResponse = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwicm9sZXMiOlsxLDJdLCJwZXJtaXNzaW9ucyI6WyJoZWFsdGg6bWV0cmljczpyZWFkIiwiaGVhbHRoOmdvYWxzOndyaXRlIiwicHJvZmlsZTpyZWFkIl0sImlhdCI6MTYxNjE1MTYxNiwiZXhwIjoxNjE2MTU1MjE2fQ.signature',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTYxNjE1MTYxNiwiZXhwIjoxNjE2MjM4MDE2fQ.refresh-signature',
  expiresAt: Date.now() + 3600000, // 1 hour from now
  tokenType: 'Bearer'
};

/**
 * Refresh token response fixture
 */
export const refreshTokenResponse = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwicm9sZXMiOlsxLDJdLCJwZXJtaXNzaW9ucyI6WyJoZWFsdGg6bWV0cmljczpyZWFkIiwiaGVhbHRoOmdvYWxzOndyaXRlIiwicHJvZmlsZTpyZWFkIl0sImlhdCI6MTYxNjE1NTIxNiwiZXhwIjoxNjE2MTU4ODE2fQ.new-signature',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTYxNjE1NTIxNiwiZXhwIjoxNjE2MjQxNjE2fQ.new-refresh-signature',
  expiresAt: Date.now() + 3600000, // 1 hour from now
  tokenType: 'Bearer'
};

/**
 * OAuth token response fixture
 */
export const oauthTokenResponse = {
  access_token: 'ya29.a0AfH6SMBx-OAuth-Access-Token-Example',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: '1//0eRefresh-Token-Example',
  scope: 'email profile openid',
  id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMjM0NTY3ODkwLWV4YW1wbGUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIxMjM0NTY3ODkwLWV4YW1wbGUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDk4NzY1NDMyMTA5ODc2NTQzMjEiLCJlbWFpbCI6Imdvb2dsZS11c2VyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiZXhhbXBsZS1hdC1oYXNoIiwibmFtZSI6Ikdvb2dsZSBUZXN0IFVzZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FPaDE0R2ktcHJvZmlsZS1waWN0dXJlIiwiZ2l2ZW5fbmFtZSI6Ikdvb2dsZSIsImZhbWlseV9uYW1lIjoiVXNlciIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjE2MTUxNjE2LCJleHAiOjE2MTYxNTUyMTZ9.signature'
};

/**
 * Error response fixtures
 */
export const authErrorResponses = {
  invalidCredentials: {
    statusCode: 401,
    message: 'Invalid email or password',
    error: 'Unauthorized',
    code: 'AUTH_INVALID_CREDENTIALS'
  },
  accountLocked: {
    statusCode: 401,
    message: 'Account is locked due to too many failed attempts',
    error: 'Unauthorized',
    code: 'AUTH_ACCOUNT_LOCKED'
  },
  tokenExpired: {
    statusCode: 401,
    message: 'JWT token has expired',
    error: 'Unauthorized',
    code: 'AUTH_TOKEN_EXPIRED'
  },
  invalidToken: {
    statusCode: 401,
    message: 'Invalid JWT token',
    error: 'Unauthorized',
    code: 'AUTH_INVALID_TOKEN'
  },
  missingToken: {
    statusCode: 401,
    message: 'JWT token is missing',
    error: 'Unauthorized',
    code: 'AUTH_MISSING_TOKEN'
  },
  insufficientPermissions: {
    statusCode: 403,
    message: 'Insufficient permissions to access this resource',
    error: 'Forbidden',
    code: 'AUTH_INSUFFICIENT_PERMISSIONS'
  },
  oauthError: {
    statusCode: 401,
    message: 'Failed to authenticate with OAuth provider',
    error: 'Unauthorized',
    code: 'AUTH_OAUTH_ERROR'
  }
};
/**
 * Test fixtures for JWT tokens with various states (valid, expired, malformed)
 * for testing token validation, guard behavior, and error handling.
 */
import * as jwt from 'jsonwebtoken';

/**
 * Test signing keys for different environments
 */
export const TEST_JWT_KEYS = {
  /** Secret key for signing tokens in test environment */
  SECRET: 'test-jwt-secret-key-for-unit-testing-purposes-only',
  /** Public key for asymmetric signing (if needed) */
  PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCqGKukO1De7zhZj6+H0qtjTkVxwTCpvKe4eCZ0\nFPqri0cb2JZfXJ/DgYSF6vUpwmJG8wVQZKjeGcjDOL5UlsuusFncCzWBQ7RKNUSesmQRMSGkVb1/\n3j+skZ6UtW+5u09lHNsj6tQ51s1SPrCBkedbNf0Tp0GbMJDyR4e9T04ZZwIDAQAB\n-----END PUBLIC KEY-----',
  /** Private key for asymmetric signing (if needed) */
  PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAKoYq6Q7UN7vOFmPr4fSq2NORXHBMKm8p7h4JnQU+quLRxvYll9cn8OBhIXq9SnCYkbzBVBkqN4ZyMM4vlSWy66wWdwLNYFDtEo1RJ6yZBExIaRVvX/eP6yRnpS1b7m7T2Uc2yPq1DnWzVI+sIGR51s1/ROnQZswkPJHh71PThlnAgMBAAECgYBYWVtleUzavkbrPjy0T5FMou8HX9u2AC2ry8vD/l7cqedtwMPp9k7TubgNFo+NGvKsl2ynyprOZR1xjQ7WgrgVB+mmuScOM/5HVceFuGRDhYTCObE+y1kxRloNYXnx3ei1zbeYLPCHdhxRYW7T0qcynNmwrn05/KO2RLjgQNalsQJBANeA3Q4Nugqy4QBUCEC09SqylT2K9FrrItqL2QKc9v0ZzO2uwllCbg0dwpVuYPYXYvikNHHg+aCWF+VXsb9rpPsCQQDKm8ZGE0rcR2nvRuppIXqiAEQ7YA4OQgNcA2xvAjJZKjXWuFgXx7prPN+1VO2y6xI1uiMKelKw/aPHh5g7d+NdAkEAoggv2WBJxIYbOurJmVhP2gffoiomyEYYIDcAp6KXLdffKOkuJulLIv0GzTiwEMWZ5MWbPOHN78Gg+naU/AM5aQJAZ5SsZyCP7SiAb3+9Yf5vKiHZVNUbIHZrPSzXq8KXiRNEQKyTW6wfzwFcnYYcETW5Zm+a1vKnNBZ4W4snYVVYIQJAVPjrZX+5gIGwXPcbLfqF55l9MciKvmVMFLa0cBDq4Uqq2a7WBvqZOF+t7/Yqu/l55/JfHXgr+iqoXuQwlq7Xtg==\n-----END PRIVATE KEY-----',
  /** Audience value for test tokens */
  AUDIENCE: 'test-audience',
  /** Issuer value for test tokens */
  ISSUER: 'test-issuer',
};

/**
 * Standard token payload interface matching the auth service
 */
export interface TokenPayload {
  /** User ID (subject) */
  sub: string;
  /** User name (optional) */
  name?: string;
  /** User email (optional) */
  email?: string;
  /** User roles (optional) */
  roles?: string[];
  /** Token issued at timestamp */
  iat?: number;
  /** Token expiration timestamp */
  exp?: number;
  /** Token audience */
  aud?: string;
  /** Token issuer */
  iss?: string;
  /** Token not valid before timestamp */
  nbf?: number;
  /** Token ID */
  jti?: string;
  /** Custom claims (optional) */
  [key: string]: any;
}

/**
 * Helper function to generate a token with specific properties
 * 
 * @param payload - Token payload
 * @param secret - Secret key for signing
 * @param options - JWT sign options
 * @returns Signed JWT token
 */
export function generateToken(
  payload: Partial<TokenPayload>,
  secret: string = TEST_JWT_KEYS.SECRET,
  options: jwt.SignOptions = {}
): string {
  const defaultPayload: Partial<TokenPayload> = {
    sub: '12345',
    name: 'Test User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    aud: TEST_JWT_KEYS.AUDIENCE,
    iss: TEST_JWT_KEYS.ISSUER,
  };

  const finalPayload = { ...defaultPayload, ...payload };
  return jwt.sign(finalPayload, secret, options);
}

/**
 * Helper function to generate an expired token
 * 
 * @param payload - Token payload
 * @param expiresInSeconds - Seconds in the past for expiration
 * @returns Expired JWT token
 */
export function generateExpiredToken(
  payload: Partial<TokenPayload> = {},
  expiresInSeconds: number = 3600 // 1 hour ago by default
): string {
  const now = Math.floor(Date.now() / 1000);
  return generateToken({
    ...payload,
    iat: now - expiresInSeconds - 10, // Issued before expiration
    exp: now - 10, // Expired 10 seconds ago
  });
}

/**
 * Helper function to generate a token with future validity
 * 
 * @param payload - Token payload
 * @param validInSeconds - Seconds in the future when token becomes valid
 * @returns JWT token valid in the future
 */
export function generateFutureToken(
  payload: Partial<TokenPayload> = {},
  validInSeconds: number = 3600 // Valid 1 hour from now
): string {
  const now = Math.floor(Date.now() / 1000);
  return generateToken({
    ...payload,
    iat: now,
    nbf: now + validInSeconds, // Not valid before future time
    exp: now + validInSeconds + 3600, // Expires 1 hour after becoming valid
  });
}

/**
 * Helper function to generate a malformed token
 * 
 * @param type - Type of malformation
 * @returns Malformed JWT token
 */
export function generateMalformedToken(type: 'header' | 'payload' | 'signature' = 'signature'): string {
  const validToken = generateToken({ sub: '12345' });
  const [header, payload, signature] = validToken.split('.');
  
  switch (type) {
    case 'header':
      return `invalid${header}.${payload}.${signature}`;
    case 'payload':
      return `${header}.invalid${payload}.${signature}`;
    case 'signature':
      return `${header}.${payload}.invalidsignature`;
    default:
      return validToken;
  }
}

/**
 * Pre-generated tokens for common test cases
 */
export const TEST_TOKENS = {
  /** Valid token with default claims */
  VALID: generateToken({
    sub: '12345',
    name: 'Test User',
    email: 'test@example.com',
  }),
  
  /** Valid token with admin role */
  ADMIN: generateToken({
    sub: '12345',
    name: 'Admin User',
    email: 'admin@example.com',
    roles: ['admin'],
  }),
  
  /** Valid token with user role */
  USER: generateToken({
    sub: '67890',
    name: 'Regular User',
    email: 'user@example.com',
    roles: ['user'],
  }),
  
  /** Token that expires in 5 minutes */
  SHORT_LIVED: generateToken({
    sub: '12345',
    exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
  }),
  
  /** Token that expires in 30 days */
  LONG_LIVED: generateToken({
    sub: '12345',
    exp: Math.floor(Date.now() / 1000) + 2592000, // 30 days
  }),
  
  /** Expired token */
  EXPIRED: generateExpiredToken(),
  
  /** Token not valid yet */
  FUTURE: generateFutureToken(),
  
  /** Token with invalid signature */
  INVALID_SIGNATURE: generateMalformedToken('signature'),
  
  /** Token with malformed header */
  MALFORMED_HEADER: generateMalformedToken('header'),
  
  /** Token with malformed payload */
  MALFORMED_PAYLOAD: generateMalformedToken('payload'),
  
  /** Token signed with wrong secret */
  WRONG_SECRET: generateToken({ sub: '12345' }, 'wrong-secret'),
  
  /** Token with wrong audience */
  WRONG_AUDIENCE: generateToken({ sub: '12345', aud: 'wrong-audience' }),
  
  /** Token with wrong issuer */
  WRONG_ISSUER: generateToken({ sub: '12345', iss: 'wrong-issuer' }),
  
  /** Token with journey-specific claims for health journey */
  HEALTH_JOURNEY: generateToken({
    sub: '12345',
    name: 'Health User',
    journeyAccess: ['health'],
    healthMetrics: ['heart_rate', 'steps', 'sleep'],
  }),
  
  /** Token with journey-specific claims for care journey */
  CARE_JOURNEY: generateToken({
    sub: '12345',
    name: 'Care User',
    journeyAccess: ['care'],
    careAccess: ['appointments', 'medications', 'providers'],
  }),
  
  /** Token with journey-specific claims for plan journey */
  PLAN_JOURNEY: generateToken({
    sub: '12345',
    name: 'Plan User',
    journeyAccess: ['plan'],
    planAccess: ['benefits', 'claims', 'coverage'],
  }),
  
  /** Token with access to all journeys */
  ALL_JOURNEYS: generateToken({
    sub: '12345',
    name: 'Super User',
    journeyAccess: ['health', 'care', 'plan'],
    roles: ['admin', 'user'],
  }),
};

/**
 * Mock token payloads for testing without actual token generation
 */
export const TEST_PAYLOADS = {
  /** Valid user payload */
  VALID_USER: {
    sub: '12345',
    name: 'Test User',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    aud: TEST_JWT_KEYS.AUDIENCE,
    iss: TEST_JWT_KEYS.ISSUER,
  },
  
  /** Admin user payload */
  ADMIN_USER: {
    sub: '12345',
    name: 'Admin User',
    email: 'admin@example.com',
    roles: ['admin'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    aud: TEST_JWT_KEYS.AUDIENCE,
    iss: TEST_JWT_KEYS.ISSUER,
  },
  
  /** Expired token payload */
  EXPIRED: {
    sub: '12345',
    name: 'Test User',
    iat: Math.floor(Date.now() / 1000) - 7200,
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    aud: TEST_JWT_KEYS.AUDIENCE,
    iss: TEST_JWT_KEYS.ISSUER,
  },
};
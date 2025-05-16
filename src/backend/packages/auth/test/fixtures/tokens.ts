/**
 * Test fixtures for JWT tokens with various states (valid, expired, malformed)
 * for testing authentication and authorization functionality.
 * 
 * These fixtures are used across test suites to validate token handling,
 * guard behavior, and error scenarios.
 */

import * as jwt from 'jsonwebtoken';

/**
 * Test signing keys for different environments
 */
export const TEST_JWT_KEYS = {
  // Secret key for HMAC algorithms (HS256)
  secret: 'test-jwt-secret-key-for-unit-testing-purposes-only',
  // RSA keys for asymmetric algorithms (RS256)
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAwaZ3afW0/zYy3HfJwAAr83PDdZvADuSJ8v8+LIAsnT3OHZ1e
QoMeJuV6QxR1EgCi9K5Xg2ZYjQXMPRMYw1MEE0xwgmOlx0AoAkpx5H3s78xQJW2d
eDPxMBKLe1vKFaD8wfQBLYR5v4v/HcJxrXnWbYCpAZJIlhh3weK+w+5yCp9NoDQs
CxIrfA7GdKqTUPDHfxemXQwDRWGUju9JvJVomzOiNiQKuOXx7K23mKvq6IDZpJQM
JCVVnYqwQEZYUWlc/al3/kCOWLMXvQQPAGz8NeFn8hWYL5GeyUJ+Mh9JxEo7CT8h
fBrxzTXZvCXNrirNUcM3G7Bq6TvnTHGiYVQI2QIDAQABAoIBAEV+41xmK/egPYxz
JgFVnJKJKBNwOCwHiHeq+jNtAWVQiGqTVLnJjUHDWFhdYIQtfGYC0hb9duvVYlKh
+iJsLQUwNHjYKXUrqQCKMKxVV+Z0QcpMiDHJCdLHL7BDVw1H4DxSjHGgX+ZC6zQP
TkxZvQH/nBnZ5KBKhXJQ4Ei6Jv8tMjvSv/JU4xS73xfBFRFKsqm9MmJ9z0M0jlck
WMUWRmrFGl+VAE1hJh3ZLwSRkHpBYJQzHNtGWpAITjEd4yRdQXLBn2ocPpZel8PD
DiGYt2fYQgenfGiKxQJVG6R/HWY0mQRlCJyuBcHSZEVAoLEVeNPTuKEU5rHovf6M
OWIAHAECgYEA/CXkCRbADcPGjhqQb+mycYBmQL4EQgmklWhIeUdFN2SXzmRGBg4+
AXCpXtLKK5VLYBnKRIUVCZMRdN+JWGGHPpQbLGGj4DmQvR77JbZl5x0+jRoLzH5h
ELpeVxo/ruD+Jh+fmGMSvXX3cQhHvPMsJI6fOqWwZeWMqCkLCiJinuECgYEAxMtB
1w8+/xpAQOlg0TUz+TJ3Rh1t93tMh9F7EtN8Y4YQTv4DTtC0wF3fYFYklZJkXSj7
fulgn01kgnOXCiGydGcLv5wrkwAP0qDmO1siLvR7HtZU5TQeX5oMQAsY4mYxwIV/
A3+syfOv8jLMUjOJ3PPV9zPWENiRJMjKVginJJkCgYBIJSaWQwvf3RxGYHDzbS9V
Gy0bl+XgOYwL/dHhLvg59mZ6fallITj8kFDviPBjK9fxQ+Xq7/xgqodqMEMFw+AV
DGR8iyxOQNi9gn4sZLweJUYE3tqHczR6VDIYda8UmsvUo3PrWKPw+pkJKboL0GqJ
GH+deICVNhQYRyJKIjXAAQKBgQCN87YGJ40Y3YEfQnBJh7qQ9rOXGcLjMnQqAGe4
UZGMzCH5H+8p0apvEPCgptWaCKl9IxCG9nzSyMhaMO9/0QnALqcXGnEJlUKfVLwP
EyuRDXY3kGkLECXN7vtiXHCj1LD5kwOZIgQGlWlCj7nHJitVZ0F8I59/JrzFHQng
BYA+2QKBgHKvy7zyHqL01UHXtSQQvZ0DRuXqcJwBfKG4vQHOGJUjrJGVrALIUNZA
O+frGsM4ZTLLYoLAyBCGdL/iQKFK8BQ+Qf5XoPuUjQnGXKL8tK/g5HVjv0R2Ht57
Tq6Vhm6Jsh5uZq9IRERSxamxQwPGYUK7Hqh6QJHLrYRXlC91HJqi
-----END RSA PRIVATE KEY-----`,
  publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwaZ3afW0/zYy3HfJwAAr
83PDdZvADuSJ8v8+LIAsnT3OHZ1eQoMeJuV6QxR1EgCi9K5Xg2ZYjQXMPRMYw1ME
E0xwgmOlx0AoAkpx5H3s78xQJW2deDPxMBKLe1vKFaD8wfQBLYR5v4v/HcJxrXnW
bYCpAZJIlhh3weK+w+5yCp9NoDQsCxIrfA7GdKqTUPDHfxemXQwDRWGUju9JvJVo
mzOiNiQKuOXx7K23mKvq6IDZpJQMJCVVnYqwQEZYUWlc/al3/kCOWLMXvQQPAGz8
NeFn8hWYL5GeyUJ+Mh9JxEo7CT8hfBrxzTXZvCXNrirNUcM3G7Bq6TvnTHGiYVQI
2QIDAQAB
-----END PUBLIC KEY-----`
};

/**
 * Standard JWT configuration for tests
 */
export const TEST_JWT_CONFIG = {
  issuer: 'austa-auth-service',
  audience: 'austa-api',
  expiresIn: '1h',
  algorithm: 'HS256' as jwt.Algorithm
};

/**
 * Standard user payload for test tokens
 */
export const TEST_USER_PAYLOAD = {
  sub: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['user'],
  journeys: ['health', 'care', 'plan']
};

/**
 * Admin user payload for test tokens with elevated permissions
 */
export const TEST_ADMIN_PAYLOAD = {
  sub: 'admin-456',
  email: 'admin@example.com',
  name: 'Admin User',
  roles: ['admin', 'user'],
  journeys: ['health', 'care', 'plan', 'admin']
};

/**
 * Generates a JWT token with the specified payload and options
 * 
 * @param payload - The token payload
 * @param options - JWT sign options
 * @returns The signed JWT token
 */
export function generateToken(
  payload: Record<string, any> = TEST_USER_PAYLOAD,
  options: jwt.SignOptions = {}
): string {
  const signOptions: jwt.SignOptions = {
    algorithm: TEST_JWT_CONFIG.algorithm,
    issuer: TEST_JWT_CONFIG.issuer,
    audience: TEST_JWT_CONFIG.audience,
    expiresIn: TEST_JWT_CONFIG.expiresIn,
    ...options
  };

  return jwt.sign(payload, TEST_JWT_KEYS.secret, signOptions);
}

/**
 * Generates an RS256 signed JWT token
 * 
 * @param payload - The token payload
 * @param options - JWT sign options
 * @returns The signed JWT token using RSA
 */
export function generateRSAToken(
  payload: Record<string, any> = TEST_USER_PAYLOAD,
  options: jwt.SignOptions = {}
): string {
  const signOptions: jwt.SignOptions = {
    algorithm: 'RS256',
    issuer: TEST_JWT_CONFIG.issuer,
    audience: TEST_JWT_CONFIG.audience,
    expiresIn: TEST_JWT_CONFIG.expiresIn,
    ...options
  };

  return jwt.sign(payload, TEST_JWT_KEYS.privateKey, signOptions);
}

/**
 * Generates a token that will expire in the specified number of seconds
 * 
 * @param seconds - Seconds until expiration
 * @param payload - The token payload
 * @returns JWT token that will expire in the specified time
 */
export function generateExpiringToken(
  seconds: number,
  payload: Record<string, any> = TEST_USER_PAYLOAD
): string {
  return generateToken(payload, { expiresIn: `${seconds}s` });
}

/**
 * Generates a token that has already expired
 * 
 * @param payload - The token payload
 * @returns An expired JWT token
 */
export function generateExpiredToken(
  payload: Record<string, any> = TEST_USER_PAYLOAD
): string {
  // Set expiration to 1 second ago
  const now = Math.floor(Date.now() / 1000);
  const expiredPayload = { ...payload, exp: now - 1 };
  
  return generateToken(expiredPayload, { expiresIn: undefined });
}

/**
 * Generates a token with an invalid signature
 * 
 * @param payload - The token payload
 * @returns A JWT token with an invalid signature
 */
export function generateInvalidSignatureToken(
  payload: Record<string, any> = TEST_USER_PAYLOAD
): string {
  const token = generateToken(payload);
  const parts = token.split('.');
  
  // Modify the signature part to make it invalid
  // Keep the header and payload intact
  if (parts.length === 3) {
    const invalidSignature = parts[2].split('').reverse().join('');
    return `${parts[0]}.${parts[1]}.${invalidSignature}`;
  }
  
  return token;
}

/**
 * Generates a malformed token that doesn't follow JWT structure
 * 
 * @returns A malformed token string
 */
export function generateMalformedToken(): string {
  return 'not-a-valid-jwt-token';
}

/**
 * Generates a token with missing required claims
 * 
 * @returns A JWT token missing required claims
 */
export function generateTokenWithMissingClaims(): string {
  // Create a payload without subject (sub) claim
  const { sub, ...payloadWithoutSub } = TEST_USER_PAYLOAD;
  return generateToken(payloadWithoutSub);
}

/**
 * Generates a token with an incorrect issuer
 * 
 * @returns A JWT token with incorrect issuer
 */
export function generateTokenWithIncorrectIssuer(): string {
  return generateToken(TEST_USER_PAYLOAD, { issuer: 'wrong-issuer' });
}

/**
 * Generates a token with an incorrect audience
 * 
 * @returns A JWT token with incorrect audience
 */
export function generateTokenWithIncorrectAudience(): string {
  return generateToken(TEST_USER_PAYLOAD, { audience: 'wrong-audience' });
}

/**
 * Pre-generated tokens for common test cases
 */
export const TEST_TOKENS = {
  // Valid tokens
  valid: generateToken(),
  validAdmin: generateToken(TEST_ADMIN_PAYLOAD),
  validRS256: generateRSAToken(),
  validShortLived: generateExpiringToken(30), // Expires in 30 seconds
  validLongLived: generateToken(TEST_USER_PAYLOAD, { expiresIn: '30d' }), // Expires in 30 days
  
  // Invalid tokens
  expired: generateExpiredToken(),
  invalidSignature: generateInvalidSignatureToken(),
  malformed: generateMalformedToken(),
  missingClaims: generateTokenWithMissingClaims(),
  wrongIssuer: generateTokenWithIncorrectIssuer(),
  wrongAudience: generateTokenWithIncorrectAudience(),
};

/**
 * Helper function to create a Bearer token header
 * 
 * @param token - The JWT token
 * @returns Authorization header with Bearer token
 */
export function createBearerToken(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Helper function to create Authorization headers for requests
 * 
 * @param token - The JWT token
 * @returns Headers object with Authorization
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: createBearerToken(token)
  };
}
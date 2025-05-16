/**
 * Unit tests for authentication validation utilities
 * 
 * These tests verify the functionality of validation utilities including token format validation,
 * authorization header parsing, OAuth state validation, and CPF number validation. The tests ensure
 * that these critical input validation functions protect authentication endpoints from malformed
 * or malicious data.
 */

import {
  isValidCPF,
  isValidTokenFormat,
  extractTokenFromHeader,
  isValidOAuthState,
  generateOAuthState,
  isTokenExpired,
  isValidIssuer,
  isValidAudience
} from '../../../src/utils/validation.util';

// Mock crypto for secure random generation
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('0123456789abcdef0123456789abcdef'))
}));

// Mock window.crypto for browser environment
const originalWindow = global.window;
beforeAll(() => {
  // @ts-ignore - partial implementation for testing
  global.window = {
    crypto: {
      getRandomValues: jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256; // Simple deterministic values for testing
        }
        return array;
      })
    }
  };
});

afterAll(() => {
  global.window = originalWindow;
});

describe('Authentication Validation Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidCPF', () => {
    it('should return true for valid CPF with formatting', () => {
      // Valid CPF with dots and dash
      const result = isValidCPF('529.982.247-25');
      expect(result).toBe(true);
    });

    it('should return true for valid CPF without formatting', () => {
      // Valid CPF without formatting
      const result = isValidCPF('52998224725');
      expect(result).toBe(true);
    });

    it('should return false for CPF with invalid check digits', () => {
      // CPF with invalid check digits
      const result = isValidCPF('529.982.247-26');
      expect(result).toBe(false);
    });

    it('should return false for CPF with repeated digits', () => {
      // CPF with all digits the same (invalid)
      const result = isValidCPF('111.111.111-11');
      expect(result).toBe(false);
    });

    it('should return false for CPF with incorrect length', () => {
      // CPF with too few digits
      const result1 = isValidCPF('529.982.247');
      expect(result1).toBe(false);

      // CPF with too many digits
      const result2 = isValidCPF('529.982.247-2555');
      expect(result2).toBe(false);
    });

    it('should return false for empty or null input', () => {
      // Empty string
      const result1 = isValidCPF('');
      expect(result1).toBe(false);

      // Null
      const result2 = isValidCPF(null as unknown as string);
      expect(result2).toBe(false);

      // Undefined
      const result3 = isValidCPF(undefined as unknown as string);
      expect(result3).toBe(false);
    });

    it('should return false for non-numeric input', () => {
      // Letters instead of numbers
      const result = isValidCPF('abc.def.ghi-jk');
      expect(result).toBe(false);
    });
  });

  describe('isValidTokenFormat', () => {
    it('should return true for valid JWT token format', () => {
      // Valid JWT format with three parts separated by dots
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const result = isValidTokenFormat(token);
      expect(result).toBe(true);
    });

    it('should return false for token with incorrect number of parts', () => {
      // Only two parts
      const token1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
      const result1 = isValidTokenFormat(token1);
      expect(result1).toBe(false);

      // Four parts
      const token2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c.extra';
      const result2 = isValidTokenFormat(token2);
      expect(result2).toBe(false);
    });

    it('should return false for token with invalid characters', () => {
      // Contains invalid characters (spaces)
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV adQssw5c';
      const result = isValidTokenFormat(token);
      expect(result).toBe(false);
    });

    it('should return false for empty or null input', () => {
      // Empty string
      const result1 = isValidTokenFormat('');
      expect(result1).toBe(false);

      // Null
      const result2 = isValidTokenFormat(null as unknown as string);
      expect(result2).toBe(false);

      // Undefined
      const result3 = isValidTokenFormat(undefined as unknown as string);
      expect(result3).toBe(false);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const authHeader = `Bearer ${validToken}`;
      const result = extractTokenFromHeader(authHeader);
      expect(result).toBe(validToken);
    });

    it('should return null for header without Bearer prefix', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const authHeader = `Token ${validToken}`; // Wrong prefix
      const result = extractTokenFromHeader(authHeader);
      expect(result).toBeNull();
    });

    it('should return null for header with incorrect format', () => {
      // No space after Bearer
      const result1 = extractTokenFromHeader('Bearertoken123');
      expect(result1).toBeNull();

      // Too many parts
      const result2 = extractTokenFromHeader('Bearer token extra parts');
      expect(result2).toBeNull();
    });

    it('should return null for header with invalid token format', () => {
      // Invalid token format
      const result = extractTokenFromHeader('Bearer invalid.token');
      expect(result).toBeNull();
    });

    it('should return null for empty or null input', () => {
      // Empty string
      const result1 = extractTokenFromHeader('');
      expect(result1).toBeNull();

      // Null
      const result2 = extractTokenFromHeader(null as unknown as string);
      expect(result2).toBeNull();

      // Undefined
      const result3 = extractTokenFromHeader(undefined as unknown as string);
      expect(result3).toBeNull();
    });
  });

  describe('isValidOAuthState', () => {
    it('should return true when stored and received states match', () => {
      const state = 'random-state-value-123';
      const result = isValidOAuthState(state, state);
      expect(result).toBe(true);
    });

    it('should return false when states do not match', () => {
      const storedState = 'original-state-value';
      const receivedState = 'different-state-value';
      const result = isValidOAuthState(storedState, receivedState);
      expect(result).toBe(false);
    });

    it('should return false when either state is empty', () => {
      // Empty stored state
      const result1 = isValidOAuthState('', 'received-state');
      expect(result1).toBe(false);

      // Empty received state
      const result2 = isValidOAuthState('stored-state', '');
      expect(result2).toBe(false);

      // Both empty
      const result3 = isValidOAuthState('', '');
      expect(result3).toBe(false);
    });

    it('should return false when either state is null or undefined', () => {
      // Null stored state
      const result1 = isValidOAuthState(null as unknown as string, 'received-state');
      expect(result1).toBe(false);

      // Null received state
      const result2 = isValidOAuthState('stored-state', null as unknown as string);
      expect(result2).toBe(false);

      // Undefined stored state
      const result3 = isValidOAuthState(undefined as unknown as string, 'received-state');
      expect(result3).toBe(false);

      // Undefined received state
      const result4 = isValidOAuthState('stored-state', undefined as unknown as string);
      expect(result4).toBe(false);
    });
  });

  describe('generateOAuthState', () => {
    it('should generate a state parameter with default length', () => {
      const state = generateOAuthState();
      expect(state).toBeDefined();
      expect(state.length).toBe(32); // Default length
    });

    it('should generate a state parameter with custom length', () => {
      const customLength = 64;
      const state = generateOAuthState(customLength);
      expect(state.length).toBe(customLength);
    });

    it('should use window.crypto in browser environment', () => {
      // Save original window object
      const originalRequire = global.require;
      // @ts-ignore - Remove require to simulate browser environment
      global.require = undefined;

      const state = generateOAuthState();
      expect(state).toBeDefined();
      expect(state.length).toBe(32);
      expect(window.crypto.getRandomValues).toHaveBeenCalled();

      // Restore original require
      global.require = originalRequire;
    });

    it('should use crypto module in Node.js environment', () => {
      // Save original window object
      const originalWindow = global.window;
      // @ts-ignore - Remove window to simulate Node.js environment
      global.window = undefined;

      const crypto = require('crypto');
      const state = generateOAuthState();
      expect(state).toBeDefined();
      expect(state.length).toBe(32);
      expect(crypto.randomBytes).toHaveBeenCalled();

      // Restore original window
      global.window = originalWindow;
    });

    it('should throw error when no secure random generator is available', () => {
      // Save original objects
      const originalWindow = global.window;
      const originalRequire = global.require;

      // @ts-ignore - Remove both window and require
      global.window = undefined;
      // @ts-ignore
      global.require = () => { throw new Error('Cannot find module'); };

      expect(() => generateOAuthState()).toThrow('No secure random number generator available');

      // Restore original objects
      global.window = originalWindow;
      global.require = originalRequire;
    });
  });

  describe('isTokenExpired', () => {
    // Helper to create a token with a specific expiration time
    const createTokenWithExp = (exp: number): string => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Dummy signature
      return `${header}.${payload}.${signature}`;
    };

    it('should return false for a token that has not expired', () => {
      // Create a token that expires 1 hour from now
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const token = createTokenWithExp(futureTime);
      const result = isTokenExpired(token);
      expect(result).toBe(false);
    });

    it('should return true for a token that has expired', () => {
      // Create a token that expired 1 hour ago
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const token = createTokenWithExp(pastTime);
      const result = isTokenExpired(token);
      expect(result).toBe(true);
    });

    it('should account for allowed time skew', () => {
      // Create a token that expired 20 seconds ago (within 30s default skew)
      const slightlyPastTime = Math.floor(Date.now() / 1000) - 20;
      const token = createTokenWithExp(slightlyPastTime);
      const result = isTokenExpired(token); // Default skew is 30s
      expect(result).toBe(false);

      // With a smaller skew of 10s, the token should be considered expired
      const resultWithSmallerSkew = isTokenExpired(token, 10);
      expect(resultWithSmallerSkew).toBe(true);
    });

    it('should return false for a token without an expiration claim', () => {
      // Create a token without an exp claim
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64url');
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Dummy signature
      const token = `${header}.${payload}.${signature}`;
      
      const result = isTokenExpired(token);
      expect(result).toBe(false);
    });

    it('should return true for invalid token format', () => {
      // Invalid token format (only two parts)
      const token = 'header.payload';
      const result = isTokenExpired(token);
      expect(result).toBe(true);
    });

    it('should return true for empty or null input', () => {
      // Empty string
      const result1 = isTokenExpired('');
      expect(result1).toBe(true);

      // Null
      const result2 = isTokenExpired(null as unknown as string);
      expect(result2).toBe(true);

      // Undefined
      const result3 = isTokenExpired(undefined as unknown as string);
      expect(result3).toBe(true);
    });

    it('should return true if token payload cannot be parsed', () => {
      // Create a token with invalid payload (not valid JSON when decoded)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = 'invalid-payload-not-base64';
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Dummy signature
      const token = `${header}.${payload}.${signature}`;
      
      const result = isTokenExpired(token);
      expect(result).toBe(true);
    });
  });

  describe('isValidIssuer', () => {
    // Helper to create a token with a specific issuer
    const createTokenWithIssuer = (iss: string): string => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ iss })).toString('base64url');
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Dummy signature
      return `${header}.${payload}.${signature}`;
    };

    it('should return true when token issuer matches expected string issuer', () => {
      const issuer = 'https://auth.austa.com';
      const token = createTokenWithIssuer(issuer);
      const result = isValidIssuer(token, issuer);
      expect(result).toBe(true);
    });

    it('should return true when token issuer is in the expected array of issuers', () => {
      const issuer = 'https://auth.austa.com';
      const token = createTokenWithIssuer(issuer);
      const expectedIssuers = ['https://login.austa.com', 'https://auth.austa.com', 'https://sso.austa.com'];
      const result = isValidIssuer(token, expectedIssuers);
      expect(result).toBe(true);
    });

    it('should return false when token issuer does not match expected issuer', () => {
      const issuer = 'https://auth.austa.com';
      const token = createTokenWithIssuer(issuer);
      const expectedIssuer = 'https://login.austa.com';
      const result = isValidIssuer(token, expectedIssuer);
      expect(result).toBe(false);
    });

    it('should return false when token issuer is not in the expected array of issuers', () => {
      const issuer = 'https://auth.austa.com';
      const token = createTokenWithIssuer(issuer);
      const expectedIssuers = ['https://login.austa.com', 'https://sso.austa.com'];
      const result = isValidIssuer(token, expectedIssuers);
      expect(result).toBe(false);
    });

    it('should return false when token has no issuer claim', () => {
      // Create a token without an iss claim
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64url');
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Dummy signature
      const token = `${header}.${payload}.${signature}`;
      
      const result = isValidIssuer(token, 'https://auth.austa.com');
      expect(result).toBe(false);
    });

    it('should return false for invalid token format', () => {
      // Invalid token format (only two parts)
      const token = 'header.payload';
      const result = isValidIssuer(token, 'https://auth.austa.com');
      expect(result).toBe(false);
    });

    it('should return false for empty or null input', () => {
      // Empty token
      const result1 = isValidIssuer('', 'https://auth.austa.com');
      expect(result1).toBe(false);

      // Null token
      const result2 = isValidIssuer(null as unknown as string, 'https://auth.austa.com');
      expect(result2).toBe(false);

      // Undefined token
      const result3 = isValidIssuer(undefined as unknown as string, 'https://auth.austa.com');
      expect(result3).toBe(false);
    });

    it('should return false if token payload cannot be parsed', () => {
      // Create a token with invalid payload (not valid JSON when decoded)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = 'invalid-payload-not-base64';
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Dummy signature
      const token = `${header}.${payload}.${signature}`;
      
      const result = isValidIssuer(token, 'https://auth.austa.com');
      expect(result).toBe(false);
    });
  });

  describe('isValidAudience', () => {
    // Helper to create a token with a specific audience (string or array)
    const createTokenWithAudience = (aud: string | string[]): string => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ aud })).toString('base64url');
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Dummy signature
      return `${header}.${payload}.${signature}`;
    };

    it('should return true when token audience matches expected string audience', () => {
      const audience = 'austa-mobile-app';
      const token = createTokenWithAudience(audience);
      const result = isValidAudience(token, audience);
      expect(result).toBe(true);
    });

    it('should return true when token audience is in the expected array of audiences', () => {
      const audience = 'austa-mobile-app';
      const token = createTokenWithAudience(audience);
      const expectedAudiences = ['austa-web-app', 'austa-mobile-app', 'austa-admin-panel'];
      const result = isValidAudience(token, expectedAudiences);
      expect(result).toBe(true);
    });

    it('should return true when token audience array includes the expected audience', () => {
      const audiences = ['austa-web-app', 'austa-mobile-app', 'austa-admin-panel'];
      const token = createTokenWithAudience(audiences);
      const expectedAudience = 'austa-mobile-app';
      const result = isValidAudience(token, expectedAudience);
      expect(result).toBe(true);
    });

    it('should return true when any token audience array item is in the expected audience array', () => {
      const tokenAudiences = ['austa-web-app', 'austa-mobile-app'];
      const expectedAudiences = ['austa-mobile-app', 'austa-admin-panel'];
      const token = createTokenWithAudience(tokenAudiences);
      const result = isValidAudience(token, expectedAudiences);
      expect(result).toBe(true);
    });

    it('should return false when token audience does not match expected audience', () => {
      const audience = 'austa-mobile-app';
      const token = createTokenWithAudience(audience);
      const expectedAudience = 'austa-web-app';
      const result = isValidAudience(token, expectedAudience);
      expect(result).toBe(false);
    });

    it('should return false when token audience is not in the expected array of audiences', () => {
      const audience = 'austa-mobile-app';
      const token = createTokenWithAudience(audience);
      const expectedAudiences = ['austa-web-app', 'austa-admin-panel'];
      const result = isValidAudience(token, expectedAudiences);
      expect(result).toBe(false);
    });

    it('should return false when no token audience array items are in the expected audience array', () => {
      const tokenAudiences = ['austa-mobile-app', 'austa-partner-api'];
      const expectedAudiences = ['austa-web-app', 'austa-admin-panel'];
      const token = createTokenWithAudience(tokenAudiences);
      const result = isValidAudience(token, expectedAudiences);
      expect(result).toBe(false);
    });

    it('should return false when token has no audience claim', () => {
      // Create a token without an aud claim
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64url');
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Dummy signature
      const token = `${header}.${payload}.${signature}`;
      
      const result = isValidAudience(token, 'austa-mobile-app');
      expect(result).toBe(false);
    });

    it('should return false for invalid token format', () => {
      // Invalid token format (only two parts)
      const token = 'header.payload';
      const result = isValidAudience(token, 'austa-mobile-app');
      expect(result).toBe(false);
    });

    it('should return false for empty or null input', () => {
      // Empty token
      const result1 = isValidAudience('', 'austa-mobile-app');
      expect(result1).toBe(false);

      // Null token
      const result2 = isValidAudience(null as unknown as string, 'austa-mobile-app');
      expect(result2).toBe(false);

      // Undefined token
      const result3 = isValidAudience(undefined as unknown as string, 'austa-mobile-app');
      expect(result3).toBe(false);
    });

    it('should return false if token payload cannot be parsed', () => {
      // Create a token with invalid payload (not valid JSON when decoded)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = 'invalid-payload-not-base64';
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Dummy signature
      const token = `${header}.${payload}.${signature}`;
      
      const result = isValidAudience(token, 'austa-mobile-app');
      expect(result).toBe(false);
    });
  });
});
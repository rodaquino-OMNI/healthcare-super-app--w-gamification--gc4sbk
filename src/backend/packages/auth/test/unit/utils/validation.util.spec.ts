import {
  isValidCPF,
  validateCPF,
  isValidTokenFormat,
  validateTokenFormat,
  extractBearerToken,
  validateAuthorizationHeader,
  isValidOAuthState,
  validateOAuthState,
  isValidAccessToken,
  isValidRefreshToken,
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
  isValidMfaCode,
  createValidationError
} from '../../../src/utils/validation.util';
import { ERROR_CODES } from '../../../src/constants';

describe('Authentication Validation Utilities', () => {
  describe('createValidationError', () => {
    it('should create a validation error with code and message', () => {
      const error = createValidationError('TEST_CODE', 'Test message');
      expect(error).toEqual({
        code: 'TEST_CODE',
        message: 'Test message'
      });
    });

    it('should create a validation error with code, message, and field', () => {
      const error = createValidationError('TEST_CODE', 'Test message', 'testField');
      expect(error).toEqual({
        code: 'TEST_CODE',
        message: 'Test message',
        field: 'testField'
      });
    });
  });

  describe('CPF Validation', () => {
    describe('isValidCPF', () => {
      it('should return true for valid CPF numbers', () => {
        // Valid CPF numbers
        expect(isValidCPF('529.982.247-25')).toBe(true);
        expect(isValidCPF('52998224725')).toBe(true);
        expect(isValidCPF('111.444.777-35')).toBe(true);
      });

      it('should return false for null or empty CPF', () => {
        expect(isValidCPF(null)).toBe(false);
        expect(isValidCPF(undefined)).toBe(false);
        expect(isValidCPF('')).toBe(false);
      });

      it('should return false for CPF with incorrect length', () => {
        expect(isValidCPF('1234567890')).toBe(false); // 10 digits
        expect(isValidCPF('123456789012')).toBe(false); // 12 digits
      });

      it('should return false for CPF with all same digits', () => {
        expect(isValidCPF('111.111.111-11')).toBe(false);
        expect(isValidCPF('22222222222')).toBe(false);
        expect(isValidCPF('999.999.999-99')).toBe(false);
      });

      it('should return false for CPF with invalid verification digits', () => {
        expect(isValidCPF('529.982.247-26')).toBe(false); // Last digit changed
        expect(isValidCPF('529.982.247-15')).toBe(false); // Last two digits changed
        expect(isValidCPF('111.444.777-36')).toBe(false); // Last digit changed
      });
    });

    describe('validateCPF', () => {
      it('should return null for valid CPF numbers', () => {
        expect(validateCPF('529.982.247-25')).toBeNull();
        expect(validateCPF('52998224725')).toBeNull();
      });

      it('should return validation error for null or empty CPF', () => {
        const error = validateCPF('');
        expect(error).toEqual({
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'CPF is required',
          field: 'cpf'
        });
      });

      it('should return validation error for CPF with incorrect length', () => {
        const error = validateCPF('1234567890');
        expect(error).toEqual({
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'CPF must have 11 digits',
          field: 'cpf'
        });
      });

      it('should return validation error for invalid CPF', () => {
        const error = validateCPF('111.111.111-11');
        expect(error).toEqual({
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid CPF',
          field: 'cpf'
        });
      });
    });
  });

  describe('Token Format Validation', () => {
    describe('isValidTokenFormat', () => {
      it('should return true for valid JWT token format', () => {
        // Valid JWT token format (header.payload.signature)
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        expect(isValidTokenFormat(validToken)).toBe(true);
      });

      it('should return false for null or empty token', () => {
        expect(isValidTokenFormat(null)).toBe(false);
        expect(isValidTokenFormat(undefined)).toBe(false);
        expect(isValidTokenFormat('')).toBe(false);
      });

      it('should return false for tokens with incorrect number of parts', () => {
        expect(isValidTokenFormat('header.payload')).toBe(false); // 2 parts
        expect(isValidTokenFormat('header')).toBe(false); // 1 part
        expect(isValidTokenFormat('header.payload.signature.extra')).toBe(false); // 4 parts
      });

      it('should return false for tokens with empty parts', () => {
        expect(isValidTokenFormat('..signature')).toBe(false);
        expect(isValidTokenFormat('header..')).toBe(false);
        expect(isValidTokenFormat('.payload.')).toBe(false);
      });

      it('should return false for tokens with invalid characters', () => {
        expect(isValidTokenFormat('header!.payload.signature')).toBe(false);
        expect(isValidTokenFormat('header.pay@load.signature')).toBe(false);
        expect(isValidTokenFormat('header.payload.sign#ture')).toBe(false);
      });
    });

    describe('validateTokenFormat', () => {
      it('should return null for valid token format', () => {
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        expect(validateTokenFormat(validToken)).toBeNull();
      });

      it('should return validation error for null or empty token', () => {
        const error = validateTokenFormat('');
        expect(error).toEqual({
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Token is required',
          field: 'token'
        });
      });

      it('should return validation error for invalid token format', () => {
        const error = validateTokenFormat('invalid-token');
        expect(error).toEqual({
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Invalid token format',
          field: 'token'
        });
      });

      it('should use custom token type in error messages', () => {
        const error = validateTokenFormat('', 'refreshToken');
        expect(error).toEqual({
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'RefreshToken is required',
          field: 'refreshToken'
        });

        const formatError = validateTokenFormat('invalid-token', 'accessToken');
        expect(formatError).toEqual({
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Invalid accessToken format',
          field: 'accessToken'
        });
      });
    });
  });

  describe('Authorization Header Validation', () => {
    describe('extractBearerToken', () => {
      it('should extract token from valid Bearer authorization header', () => {
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const header = `Bearer ${validToken}`;
        expect(extractBearerToken(header)).toBe(validToken);
      });

      it('should handle case-insensitive Bearer prefix', () => {
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        expect(extractBearerToken(`bearer ${validToken}`)).toBe(validToken);
        expect(extractBearerToken(`BEARER ${validToken}`)).toBe(validToken);
        expect(extractBearerToken(`BeArEr ${validToken}`)).toBe(validToken);
      });

      it('should return null for null or empty header', () => {
        expect(extractBearerToken(null)).toBeNull();
        expect(extractBearerToken(undefined)).toBeNull();
        expect(extractBearerToken('')).toBeNull();
      });

      it('should return null for header without Bearer prefix', () => {
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        expect(extractBearerToken(`Token ${validToken}`)).toBeNull();
        expect(extractBearerToken(`JWT ${validToken}`)).toBeNull();
        expect(extractBearerToken(validToken)).toBeNull();
      });

      it('should return null for header with incorrect format', () => {
        expect(extractBearerToken('Bearer')).toBeNull();
        expect(extractBearerToken('Bearer ')).toBeNull();
        expect(extractBearerToken('Bearer  ')).toBeNull();
      });
    });

    describe('validateAuthorizationHeader', () => {
      it('should return token and null error for valid authorization header', () => {
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const header = `Bearer ${validToken}`;
        const result = validateAuthorizationHeader(header);
        expect(result).toEqual({
          token: validToken,
          error: null
        });
      });

      it('should return error for null or empty header', () => {
        const result = validateAuthorizationHeader('');
        expect(result).toEqual({
          token: null,
          error: {
            code: ERROR_CODES.INVALID_TOKEN,
            message: 'Authorization header is required',
            field: 'authorization'
          }
        });
      });

      it('should return error for header without Bearer prefix', () => {
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const result = validateAuthorizationHeader(`Token ${validToken}`);
        expect(result).toEqual({
          token: null,
          error: {
            code: ERROR_CODES.INVALID_TOKEN,
            message: 'Invalid Authorization header format. Expected: Bearer <token>',
            field: 'authorization'
          }
        });
      });

      it('should return error for header with invalid token format', () => {
        const result = validateAuthorizationHeader('Bearer invalid-token');
        expect(result).toEqual({
          token: null,
          error: {
            code: ERROR_CODES.INVALID_TOKEN,
            message: 'Invalid token format in Authorization header',
            field: 'authorization'
          }
        });
      });
    });
  });

  describe('OAuth State Validation', () => {
    describe('isValidOAuthState', () => {
      it('should return true for valid OAuth state', () => {
        // Valid state with sufficient length and valid characters
        const validState = 'abcdefghijklmnopqrstuvwxyz1234567890';
        expect(isValidOAuthState(validState)).toBe(true);
      });

      it('should return true for state with URL-safe special characters', () => {
        const validState = 'abcdefghijklmnopqrstuvwxyz1234567890-_';
        expect(isValidOAuthState(validState)).toBe(true);
      });

      it('should return false for null or empty state', () => {
        expect(isValidOAuthState(null)).toBe(false);
        expect(isValidOAuthState(undefined)).toBe(false);
        expect(isValidOAuthState('')).toBe(false);
      });

      it('should return false for state with insufficient length', () => {
        expect(isValidOAuthState('short')).toBe(false); // Less than default 32 chars
        expect(isValidOAuthState('abcdefghijklmnopqrstuvwxyz12345', 32)).toBe(false); // 31 chars
      });

      it('should return false for state with invalid characters', () => {
        expect(isValidOAuthState('abcdefghijklmnopqrstuvwxyz1234567890!')).toBe(false); // Contains !
        expect(isValidOAuthState('abcdefghijklmnopqrstuvwxyz1234567890@')).toBe(false); // Contains @
        expect(isValidOAuthState('abcdefghijklmnopqrstuvwxyz1234567890#')).toBe(false); // Contains #
      });

      it('should respect custom minimum length', () => {
        const shortState = 'abcdefghijklmnop'; // 16 chars
        expect(isValidOAuthState(shortState, 16)).toBe(true);
        expect(isValidOAuthState(shortState, 20)).toBe(false);
      });
    });

    describe('validateOAuthState', () => {
      it('should return null for valid OAuth state', () => {
        const validState = 'abcdefghijklmnopqrstuvwxyz1234567890';
        expect(validateOAuthState(validState)).toBeNull();
      });

      it('should return validation error for null or empty state', () => {
        const error = validateOAuthState('');
        expect(error).toEqual({
          code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
          message: 'OAuth state parameter is required',
          field: 'state'
        });
      });

      it('should return validation error for state with insufficient length', () => {
        const error = validateOAuthState('short');
        expect(error).toEqual({
          code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
          message: 'OAuth state parameter must be at least 32 characters long',
          field: 'state'
        });
      });

      it('should return validation error for state with invalid characters', () => {
        const error = validateOAuthState('abcdefghijklmnopqrstuvwxyz1234567890!');
        expect(error).toEqual({
          code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
          message: 'OAuth state parameter contains invalid characters',
          field: 'state'
        });
      });

      it('should respect custom minimum length', () => {
        const shortState = 'abcdefghijklmnop'; // 16 chars
        expect(validateOAuthState(shortState, 16)).toBeNull();
        
        const error = validateOAuthState(shortState, 20);
        expect(error).toEqual({
          code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
          message: 'OAuth state parameter must be at least 20 characters long',
          field: 'state'
        });
      });
    });
  });

  describe('Token Type Validation', () => {
    describe('isValidAccessToken', () => {
      it('should return true for valid access token format', () => {
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        expect(isValidAccessToken(validToken)).toBe(true);
      });

      it('should return false for invalid token format', () => {
        expect(isValidAccessToken('invalid-token')).toBe(false);
        expect(isValidAccessToken('')).toBe(false);
        expect(isValidAccessToken(null)).toBe(false);
      });
    });

    describe('isValidRefreshToken', () => {
      it('should return true for valid refresh token format', () => {
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        expect(isValidRefreshToken(validToken)).toBe(true);
      });

      it('should return false for invalid token format', () => {
        expect(isValidRefreshToken('invalid-token')).toBe(false);
        expect(isValidRefreshToken('')).toBe(false);
        expect(isValidRefreshToken(null)).toBe(false);
      });
    });
  });

  describe('Email Validation', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('user-name@example.org')).toBe(true);
      expect(isValidEmail('123@example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
      expect(isValidEmail('user@example..com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should return true for valid passwords meeting all requirements', () => {
      expect(isValidPassword('Password123!')).toBe(true);
      expect(isValidPassword('Secure@Password2023')).toBe(true);
      expect(isValidPassword('P@ssw0rd')).toBe(true);
    });

    it('should return false for passwords that are too short', () => {
      expect(isValidPassword('Pass1!')).toBe(false); // Less than 8 characters
      expect(isValidPassword('Pw1!', 4)).toBe(true); // Custom minimum length
      expect(isValidPassword('Pw1!', 5)).toBe(false); // Custom minimum length
    });

    it('should validate based on character type requirements', () => {
      // Missing uppercase
      expect(isValidPassword('password123!')).toBe(false);
      expect(isValidPassword('password123!', 8, false)).toBe(true); // Uppercase not required
      
      // Missing lowercase
      expect(isValidPassword('PASSWORD123!')).toBe(false);
      expect(isValidPassword('PASSWORD123!', 8, true, false)).toBe(true); // Lowercase not required
      
      // Missing number
      expect(isValidPassword('Password!')).toBe(false);
      expect(isValidPassword('Password!', 8, true, true, false)).toBe(true); // Numbers not required
      
      // Missing special character
      expect(isValidPassword('Password123')).toBe(false);
      expect(isValidPassword('Password123', 8, true, true, true, false)).toBe(true); // Special chars not required
    });
  });

  describe('Phone Number Validation', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true); // 10 digits
      expect(isValidPhoneNumber('123-456-7890')).toBe(true); // With hyphens
      expect(isValidPhoneNumber('(123) 456-7890')).toBe(true); // With parentheses and space
      expect(isValidPhoneNumber('+11234567890')).toBe(true); // With country code
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhoneNumber('')).toBe(false); // Empty
      expect(isValidPhoneNumber(null)).toBe(false); // Null
      expect(isValidPhoneNumber('123')).toBe(false); // Too short
      expect(isValidPhoneNumber('123456789012345678901')).toBe(false); // Too long
      expect(isValidPhoneNumber('abcdefghij')).toBe(false); // Non-numeric
    });

    it('should handle international format based on allowInternational parameter', () => {
      expect(isValidPhoneNumber('+11234567890')).toBe(true); // Default: international allowed
      expect(isValidPhoneNumber('+11234567890', false)).toBe(false); // International not allowed
    });
  });

  describe('MFA Code Validation', () => {
    it('should return true for valid MFA codes', () => {
      expect(isValidMfaCode('123456')).toBe(true); // 6 digits (default)
      expect(isValidMfaCode('1234', 4)).toBe(true); // 4 digits (custom length)
      expect(isValidMfaCode('12345678', 8)).toBe(true); // 8 digits (custom length)
    });

    it('should return false for invalid MFA codes', () => {
      expect(isValidMfaCode('')).toBe(false); // Empty
      expect(isValidMfaCode(null)).toBe(false); // Null
      expect(isValidMfaCode('12345')).toBe(false); // Too short for default
      expect(isValidMfaCode('1234567')).toBe(false); // Too long for default
      expect(isValidMfaCode('abcdef')).toBe(false); // Non-numeric
      expect(isValidMfaCode('12345', 6)).toBe(false); // Too short for custom length
      expect(isValidMfaCode('1234567', 6)).toBe(false); // Too long for custom length
    });
  });
});
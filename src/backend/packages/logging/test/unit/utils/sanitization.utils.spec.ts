import {
  sanitizeCredentials,
  maskPII,
  sanitizeObject,
  configureSanitization,
  SENSITIVE_KEYS,
  PII_PATTERNS,
  SanitizationConfig
} from '../../../src/utils/sanitization.utils';

describe('Sanitization Utils', () => {
  describe('sanitizeCredentials', () => {
    it('masks password values', () => {
      // Arrange
      const input = { username: 'testuser', password: 'secret123' };
      
      // Act
      const result = sanitizeCredentials(input);
      
      // Assert
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('password', '********');
    });

    it('masks token values', () => {
      // Arrange
      const input = { 
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmNkZWYifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      };
      
      // Act
      const result = sanitizeCredentials(input);
      
      // Assert
      expect(result).toHaveProperty('accessToken', '********');
      expect(result).toHaveProperty('refreshToken', '********');
    });

    it('masks API key values', () => {
      // Arrange
      const input = { 
        apiKey: 'sk_test_abcdefghijklmnopqrstuvwxyz',
        secretKey: '1234567890abcdef'
      };
      
      // Act
      const result = sanitizeCredentials(input);
      
      // Assert
      expect(result).toHaveProperty('apiKey', '********');
      expect(result).toHaveProperty('secretKey', '********');
    });

    it('handles case-insensitive credential keys', () => {
      // Arrange
      const input = { 
        Password: 'secret123',
        API_KEY: 'sk_test_abcdefghijklmnopqrstuvwxyz',
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
      };
      
      // Act
      const result = sanitizeCredentials(input);
      
      // Assert
      expect(result).toHaveProperty('Password', '********');
      expect(result).toHaveProperty('API_KEY', '********');
      expect(result).toHaveProperty('access_token', '********');
    });

    it('returns non-object values unchanged', () => {
      // Arrange
      const input = 'not an object';
      
      // Act
      const result = sanitizeCredentials(input);
      
      // Assert
      expect(result).toBe(input);
    });

    it('handles null and undefined values', () => {
      // Arrange
      const nullInput = null;
      const undefinedInput = undefined;
      
      // Act
      const nullResult = sanitizeCredentials(nullInput);
      const undefinedResult = sanitizeCredentials(undefinedInput);
      
      // Assert
      expect(nullResult).toBe(null);
      expect(undefinedResult).toBe(undefined);
    });
  });

  describe('maskPII', () => {
    it('masks email addresses', () => {
      // Arrange
      const input = { email: 'user@example.com', name: 'Test User' };
      
      // Act
      const result = maskPII(input);
      
      // Assert
      expect(result).toHaveProperty('email', 'u***@e***.com');
      expect(result).toHaveProperty('name', 'Test User');
    });

    it('masks phone numbers', () => {
      // Arrange
      const input = { 
        phone: '+1 (555) 123-4567',
        mobilePhone: '555-987-6543',
        name: 'Test User'
      };
      
      // Act
      const result = maskPII(input);
      
      // Assert
      expect(result).toHaveProperty('phone', '+1 (***) ***-4567');
      expect(result).toHaveProperty('mobilePhone', '***-***-6543');
      expect(result).toHaveProperty('name', 'Test User');
    });

    it('masks social security numbers', () => {
      // Arrange
      const input = { ssn: '123-45-6789', name: 'Test User' };
      
      // Act
      const result = maskPII(input);
      
      // Assert
      expect(result).toHaveProperty('ssn', '***-**-6789');
      expect(result).toHaveProperty('name', 'Test User');
    });

    it('masks credit card numbers', () => {
      // Arrange
      const input = { 
        creditCard: '4111 1111 1111 1111',
        cardNumber: '5555555555554444',
        name: 'Test User'
      };
      
      // Act
      const result = maskPII(input);
      
      // Assert
      expect(result).toHaveProperty('creditCard', '**** **** **** 1111');
      expect(result).toHaveProperty('cardNumber', '************4444');
      expect(result).toHaveProperty('name', 'Test User');
    });

    it('masks PII in string values', () => {
      // Arrange
      const input = 'User email is user@example.com and phone is 555-123-4567';
      
      // Act
      const result = maskPII(input);
      
      // Assert
      expect(result).toBe('User email is u***@e***.com and phone is ***-***-4567');
    });

    it('returns non-string and non-object values unchanged', () => {
      // Arrange
      const numberInput = 12345;
      const booleanInput = true;
      
      // Act
      const numberResult = maskPII(numberInput);
      const booleanResult = maskPII(booleanInput);
      
      // Assert
      expect(numberResult).toBe(numberInput);
      expect(booleanResult).toBe(booleanInput);
    });

    it('handles null and undefined values', () => {
      // Arrange
      const nullInput = null;
      const undefinedInput = undefined;
      
      // Act
      const nullResult = maskPII(nullInput);
      const undefinedResult = maskPII(undefinedInput);
      
      // Assert
      expect(nullResult).toBe(null);
      expect(undefinedResult).toBe(undefined);
    });
  });

  describe('sanitizeObject', () => {
    it('sanitizes credentials and masks PII in objects', () => {
      // Arrange
      const input = { 
        username: 'testuser',
        password: 'secret123',
        email: 'user@example.com',
        phone: '555-123-4567'
      };
      
      // Act
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('password', '********');
      expect(result).toHaveProperty('email', 'u***@e***.com');
      expect(result).toHaveProperty('phone', '***-***-4567');
    });

    it('handles deeply nested objects with sensitive information', () => {
      // Arrange
      const input = { 
        user: {
          profile: {
            name: 'Test User',
            contact: {
              email: 'user@example.com',
              phone: '555-123-4567'
            },
            security: {
              password: 'secret123',
              apiKey: 'sk_test_abcdefghijklmnopqrstuvwxyz'
            }
          }
        },
        metadata: {
          lastLogin: new Date().toISOString()
        }
      };
      
      // Act
      const result = sanitizeObject(input);
      
      // Assert
      expect(result.user.profile.name).toBe('Test User');
      expect(result.user.profile.contact.email).toBe('u***@e***.com');
      expect(result.user.profile.contact.phone).toBe('***-***-4567');
      expect(result.user.profile.security.password).toBe('********');
      expect(result.user.profile.security.apiKey).toBe('********');
      expect(result.metadata.lastLogin).toBe(input.metadata.lastLogin);
    });

    it('sanitizes arrays of objects with sensitive information', () => {
      // Arrange
      const input = {
        users: [
          { id: 1, email: 'user1@example.com', apiKey: 'key1' },
          { id: 2, email: 'user2@example.com', apiKey: 'key2' },
          { id: 3, email: 'user3@example.com', apiKey: 'key3' }
        ]
      };
      
      // Act
      const result = sanitizeObject(input);
      
      // Assert
      expect(result.users[0].id).toBe(1);
      expect(result.users[0].email).toBe('u***@e***.com');
      expect(result.users[0].apiKey).toBe('********');
      expect(result.users[1].id).toBe(2);
      expect(result.users[1].email).toBe('u***@e***.com');
      expect(result.users[1].apiKey).toBe('********');
      expect(result.users[2].id).toBe(3);
      expect(result.users[2].email).toBe('u***@e***.com');
      expect(result.users[2].apiKey).toBe('********');
    });

    it('handles circular references', () => {
      // Arrange
      const circular: any = { 
        name: 'Circular',
        email: 'circular@example.com',
        password: 'secret123'
      };
      circular.self = circular;
      
      // Act
      const result = sanitizeObject(circular);
      
      // Assert
      expect(result).toHaveProperty('name', 'Circular');
      expect(result).toHaveProperty('email', 'c***@e***.com');
      expect(result).toHaveProperty('password', '********');
      expect(result.self).toEqual('[Circular Reference]');
    });

    it('returns non-object values unchanged', () => {
      // Arrange
      const input = 'not an object';
      
      // Act
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toBe(input);
    });

    it('handles null and undefined values', () => {
      // Arrange
      const nullInput = null;
      const undefinedInput = undefined;
      
      // Act
      const nullResult = sanitizeObject(nullInput);
      const undefinedResult = sanitizeObject(undefinedInput);
      
      // Assert
      expect(nullResult).toBe(null);
      expect(undefinedResult).toBe(undefined);
    });
  });

  describe('configureSanitization', () => {
    let originalSensitiveKeys: string[];
    let originalPIIPatterns: RegExp[];

    beforeEach(() => {
      // Save original values
      originalSensitiveKeys = [...SENSITIVE_KEYS];
      originalPIIPatterns = [...PII_PATTERNS];
    });

    afterEach(() => {
      // Restore original values
      configureSanitization({
        sensitiveKeys: originalSensitiveKeys,
        piiPatterns: originalPIIPatterns
      });
    });

    it('allows adding custom sensitive keys', () => {
      // Arrange
      const config: SanitizationConfig = {
        sensitiveKeys: [...SENSITIVE_KEYS, 'customSecret', 'privateData']
      };
      const input = { 
        username: 'testuser',
        customSecret: 'very-secret-value',
        privateData: 'confidential-info'
      };
      
      // Act
      configureSanitization(config);
      const result = sanitizeCredentials(input);
      
      // Assert
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('customSecret', '********');
      expect(result).toHaveProperty('privateData', '********');
    });

    it('allows adding custom PII patterns', () => {
      // Arrange
      const customPatterns = [
        /\b(custom-id-\d{6})\b/g  // Matches custom-id-123456 format
      ];
      const config: SanitizationConfig = {
        piiPatterns: [...PII_PATTERNS, ...customPatterns]
      };
      const input = { 
        username: 'testuser',
        identifier: 'custom-id-123456'
      };
      
      // Act
      configureSanitization(config);
      const result = maskPII(input);
      
      // Assert
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('identifier', 'custom-id-******');
    });

    it('allows configuring different masking characters', () => {
      // Arrange
      const config: SanitizationConfig = {
        maskCharacter: 'X',
        sensitiveKeys: SENSITIVE_KEYS,
        piiPatterns: PII_PATTERNS
      };
      const input = { 
        password: 'secret123',
        email: 'user@example.com'
      };
      
      // Act
      configureSanitization(config);
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toHaveProperty('password', 'XXXXXXXX');
      expect(result).toHaveProperty('email', 'uXXX@eXXX.com');
    });

    it('allows configuring environment-specific rules', () => {
      // Arrange
      const devConfig: SanitizationConfig = {
        environment: 'development',
        sensitiveKeys: ['password', 'apiKey'], // Only mask critical credentials in dev
        maskPII: false // Don't mask PII in development for easier debugging
      };
      const input = { 
        password: 'secret123',
        apiKey: 'sk_test_abcdefghijklmnopqrstuvwxyz',
        email: 'user@example.com',
        phone: '555-123-4567'
      };
      
      // Act
      configureSanitization(devConfig);
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toHaveProperty('password', '********');
      expect(result).toHaveProperty('apiKey', '********');
      expect(result).toHaveProperty('email', 'user@example.com'); // Not masked in dev
      expect(result).toHaveProperty('phone', '555-123-4567'); // Not masked in dev
    });

    it('allows disabling sanitization completely for local development', () => {
      // Arrange
      const localConfig: SanitizationConfig = {
        environment: 'local',
        enabled: false // Disable all sanitization in local environment
      };
      const input = { 
        password: 'secret123',
        apiKey: 'sk_test_abcdefghijklmnopqrstuvwxyz',
        email: 'user@example.com',
        phone: '555-123-4567'
      };
      
      // Act
      configureSanitization(localConfig);
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toEqual(input); // Nothing is sanitized
    });
  });
});
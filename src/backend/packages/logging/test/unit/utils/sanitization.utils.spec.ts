import { sanitizeLogData, SanitizationConfig, createDefaultSanitizationConfig } from '../../../src/utils/sanitization.utils';

describe('Sanitization Utils', () => {
  let defaultConfig: SanitizationConfig;

  beforeEach(() => {
    // Reset to default configuration before each test
    defaultConfig = createDefaultSanitizationConfig();
  });

  describe('sanitizeLogData', () => {
    it('should mask password fields', () => {
      const data = {
        username: 'testuser',
        password: 'secret123',
        confirmPassword: 'secret123',
        otherField: 'not sensitive'
      };

      const sanitized = sanitizeLogData(data, defaultConfig);

      expect(sanitized.username).toBe('testuser');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.confirmPassword).toBe('[REDACTED]');
      expect(sanitized.otherField).toBe('not sensitive');
    });

    it('should mask authentication tokens', () => {
      const data = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
        refreshToken: 'refresh-token-value',
        apiKey: 'api-key-12345',
        request: {
          headers: {
            authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
            'x-api-key': 'another-api-key'
          }
        }
      };

      const sanitized = sanitizeLogData(data, defaultConfig);

      expect(sanitized.accessToken).toBe('[REDACTED]');
      expect(sanitized.refreshToken).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.request.headers.authorization).toBe('[REDACTED]');
      expect(sanitized.request.headers['x-api-key']).toBe('[REDACTED]');
    });

    it('should mask PII data like email addresses and phone numbers', () => {
      const data = {
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          address: '123 Main St, Anytown, CA 12345',
          ssn: '123-45-6789',
          dob: '1980-01-01'
        },
        message: 'User john.doe@example.com called about their account.'
      };

      const sanitized = sanitizeLogData(data, defaultConfig);

      expect(sanitized.user.name).toBe('[PII_NAME]');
      expect(sanitized.user.email).toBe('[PII_EMAIL]');
      expect(sanitized.user.phone).toBe('[PII_PHONE]');
      expect(sanitized.user.address).toBe('[PII_ADDRESS]');
      expect(sanitized.user.ssn).toBe('[PII_SSN]');
      expect(sanitized.user.dob).toBe('[PII_DOB]');
      // Email in message text should also be masked
      expect(sanitized.message).toBe('User [PII_EMAIL] called about their account.');
    });

    it('should handle deeply nested objects containing sensitive information', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              password: 'deep-secret',
              email: 'nested@example.com',
              normalField: 'this is fine'
            }
          },
          array: [
            { password: 'array-secret1', email: 'array1@example.com' },
            { password: 'array-secret2', email: 'array2@example.com' }
          ]
        }
      };

      const sanitized = sanitizeLogData(data, defaultConfig);

      expect(sanitized.level1.level2.level3.password).toBe('[REDACTED]');
      expect(sanitized.level1.level2.level3.email).toBe('[PII_EMAIL]');
      expect(sanitized.level1.level2.level3.normalField).toBe('this is fine');
      expect(sanitized.level1.array[0].password).toBe('[REDACTED]');
      expect(sanitized.level1.array[0].email).toBe('[PII_EMAIL]');
      expect(sanitized.level1.array[1].password).toBe('[REDACTED]');
      expect(sanitized.level1.array[1].email).toBe('[PII_EMAIL]');
    });

    it('should handle arrays of primitive values', () => {
      const data = {
        emails: ['user1@example.com', 'user2@example.com'],
        passwords: ['secret1', 'secret2'],
        normalArray: ['item1', 'item2']
      };

      const sanitized = sanitizeLogData(data, defaultConfig);

      expect(sanitized.emails[0]).toBe('[PII_EMAIL]');
      expect(sanitized.emails[1]).toBe('[PII_EMAIL]');
      expect(sanitized.passwords[0]).toBe('[REDACTED]');
      expect(sanitized.passwords[1]).toBe('[REDACTED]');
      expect(sanitized.normalArray).toEqual(['item1', 'item2']);
    });

    it('should handle circular references gracefully', () => {
      const circular: any = {
        name: 'Circular Object',
        password: 'circular-secret'
      };
      circular.self = circular;
      circular.nested = {
        parent: circular,
        password: 'nested-secret'
      };

      const sanitized = sanitizeLogData(circular, defaultConfig);

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.nested.password).toBe('[REDACTED]');
      // Should not throw due to circular reference
      expect(() => JSON.stringify(sanitized)).not.toThrow();
    });

    it('should preserve non-sensitive data', () => {
      const data = {
        id: 12345,
        timestamp: '2023-04-01T12:00:00Z',
        status: 'active',
        tags: ['tag1', 'tag2'],
        metadata: {
          version: '1.0.0',
          environment: 'production'
        }
      };

      const sanitized = sanitizeLogData(data, defaultConfig);

      // Should be identical to original
      expect(sanitized).toEqual(data);
    });

    it('should handle null and undefined values', () => {
      const data = {
        nullField: null,
        undefinedField: undefined,
        emptyObject: {},
        emptyArray: [],
        password: 'secret'
      };

      const sanitized = sanitizeLogData(data, defaultConfig);

      expect(sanitized.nullField).toBeNull();
      expect(sanitized.undefinedField).toBeUndefined();
      expect(sanitized.emptyObject).toEqual({});
      expect(sanitized.emptyArray).toEqual([]);
      expect(sanitized.password).toBe('[REDACTED]');
    });
  });

  describe('Sanitization Configuration', () => {
    it('should allow custom redaction markers', () => {
      const customConfig: SanitizationConfig = {
        ...defaultConfig,
        redactionMarkers: {
          credentials: '***HIDDEN***',
          pii: {
            email: '***EMAIL***',
            phone: '***PHONE***',
            name: '***NAME***',
            address: '***ADDRESS***',
            ssn: '***SSN***',
            dob: '***DOB***'
          }
        }
      };

      const data = {
        password: 'secret',
        email: 'test@example.com',
        phone: '555-123-4567'
      };

      const sanitized = sanitizeLogData(data, customConfig);

      expect(sanitized.password).toBe('***HIDDEN***');
      expect(sanitized.email).toBe('***EMAIL***');
      expect(sanitized.phone).toBe('***PHONE***');
    });

    it('should allow custom field patterns for credentials', () => {
      const customConfig: SanitizationConfig = {
        ...defaultConfig,
        credentialPatterns: [
          /^secret.*/i,
          /^private.*/i,
          'myCustomSecret'
        ]
      };

      const data = {
        secretKey: 'should be redacted',
        privateInfo: 'should be redacted',
        myCustomSecret: 'should be redacted',
        normalField: 'should not be redacted'
      };

      const sanitized = sanitizeLogData(data, customConfig);

      expect(sanitized.secretKey).toBe('[REDACTED]');
      expect(sanitized.privateInfo).toBe('[REDACTED]');
      expect(sanitized.myCustomSecret).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('should not be redacted');
    });

    it('should allow disabling specific sanitization types', () => {
      const customConfig: SanitizationConfig = {
        ...defaultConfig,
        sanitizeCredentials: false,
        sanitizePiiData: true
      };

      const data = {
        password: 'secret',
        email: 'test@example.com'
      };

      const sanitized = sanitizeLogData(data, customConfig);

      // Credentials should not be sanitized
      expect(sanitized.password).toBe('secret');
      // PII should still be sanitized
      expect(sanitized.email).toBe('[PII_EMAIL]');
    });

    it('should support environment-specific configurations', () => {
      // Simulate different environment configurations
      const devConfig: SanitizationConfig = {
        ...defaultConfig,
        sanitizeCredentials: true,
        sanitizePiiData: false, // Don't sanitize PII in dev for easier debugging
        preserveOriginalStructure: true
      };

      const prodConfig: SanitizationConfig = {
        ...defaultConfig,
        sanitizeCredentials: true,
        sanitizePiiData: true, // Sanitize everything in production
        preserveOriginalStructure: true
      };

      const data = {
        password: 'secret',
        email: 'test@example.com'
      };

      const devSanitized = sanitizeLogData(data, devConfig);
      const prodSanitized = sanitizeLogData(data, prodConfig);

      // In dev, only credentials are sanitized
      expect(devSanitized.password).toBe('[REDACTED]');
      expect(devSanitized.email).toBe('test@example.com');

      // In prod, both credentials and PII are sanitized
      expect(prodSanitized.password).toBe('[REDACTED]');
      expect(prodSanitized.email).toBe('[PII_EMAIL]');
    });

    it('should support partial masking of sensitive data', () => {
      const customConfig: SanitizationConfig = {
        ...defaultConfig,
        useMasking: true,
        maskingPatterns: {
          email: { pattern: /(^[^@]+)@(.+)$/, replacement: '$1@***' },
          phone: { pattern: /(\d{3})[\s-]?(\d{3})[\s-]?(\d{4})/, replacement: '$1-***-$3' },
          creditCard: { pattern: /(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})/, replacement: '$1-****-****-$4' }
        }
      };

      const data = {
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        creditCard: '4111 1111 1111 1111'
      };

      const sanitized = sanitizeLogData(data, customConfig);

      expect(sanitized.email).toBe('john.doe@***');
      expect(sanitized.phone).toBe('555-***-4567');
      expect(sanitized.creditCard).toBe('4111-****-****-1111');
    });
  });
});
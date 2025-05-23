import {
  maskValue,
  maskPII,
  maskCredentials,
  sanitizeString,
  sanitizeObject,
  sanitizeRequest,
  sanitizeResponse,
  sanitizeError,
  sanitizeJourneyData,
  sanitizeGamificationEvent,
  SanitizationOptions
} from '../../../src/utils/sanitization.utils';

describe('Sanitization Utilities', () => {
  describe('maskValue', () => {
    it('should mask a string value with asterisks by default', () => {
      // Arrange
      const value = 'sensitive-data';
      
      // Act
      const result = maskValue(value);
      
      // Assert
      expect(result).toBe('*************');
    });

    it('should preserve characters at the beginning when preserveStart is specified', () => {
      // Arrange
      const value = 'sensitive-data';
      const options: SanitizationOptions = { preserveStart: 3 };
      
      // Act
      const result = maskValue(value, options);
      
      // Assert
      expect(result).toBe('sen**********');
    });

    it('should preserve characters at the end when preserveEnd is specified', () => {
      // Arrange
      const value = 'sensitive-data';
      const options: SanitizationOptions = { preserveEnd: 4 };
      
      // Act
      const result = maskValue(value, options);
      
      // Assert
      expect(result).toBe('*********data');
    });

    it('should preserve characters at both ends when both options are specified', () => {
      // Arrange
      const value = 'sensitive-data';
      const options: SanitizationOptions = { preserveStart: 3, preserveEnd: 4 };
      
      // Act
      const result = maskValue(value, options);
      
      // Assert
      expect(result).toBe('sen******data');
    });

    it('should use custom mask character when specified', () => {
      // Arrange
      const value = 'sensitive-data';
      const options: SanitizationOptions = { maskChar: '#' };
      
      // Act
      const result = maskValue(value, options);
      
      // Assert
      expect(result).toBe('#############');
    });

    it('should handle empty strings', () => {
      // Arrange
      const value = '';
      
      // Act
      const result = maskValue(value);
      
      // Assert
      expect(result).toBe('');
    });

    it('should handle null and undefined values', () => {
      // Act & Assert
      expect(maskValue(null as any)).toBeNull();
      expect(maskValue(undefined as any)).toBeUndefined();
    });

    it('should mask entire string when preserveStart + preserveEnd exceeds string length', () => {
      // Arrange
      const value = 'short';
      const options: SanitizationOptions = { preserveStart: 3, preserveEnd: 3, maskChar: '#' };
      
      // Act
      const result = maskValue(value, options);
      
      // Assert
      expect(result).toBe('#####');
    });
  });

  describe('maskPII', () => {
    it('should mask email addresses while preserving domain', () => {
      // Arrange
      const text = 'Contact us at user@example.com or support@company.org';
      
      // Act
      const result = maskPII(text);
      
      // Assert
      expect(result).toContain('@example.com');
      expect(result).toContain('@company.org');
      expect(result).not.toContain('user@');
      expect(result).not.toContain('support@');
    });

    it('should mask phone numbers while preserving last 4 digits', () => {
      // Arrange
      const text = 'Call us at (123) 456-7890 or +1 987-654-3210';
      
      // Act
      const result = maskPII(text);
      
      // Assert
      expect(result).toContain('7890');
      expect(result).toContain('3210');
      expect(result).not.toContain('(123)');
      expect(result).not.toContain('456-');
      expect(result).not.toContain('+1 987');
    });

    it('should mask Brazilian CPF numbers while preserving last 2 digits', () => {
      // Arrange
      const text = 'CPF: 123.456.789-01';
      
      // Act
      const result = maskPII(text);
      
      // Assert
      expect(result).toContain('01');
      expect(result).not.toContain('123.456.789');
    });

    it('should mask Brazilian RG numbers while preserving last 2 digits', () => {
      // Arrange
      const text = 'RG: 12.345.678-9';
      
      // Act
      const result = maskPII(text);
      
      // Assert
      expect(result).toContain('9');
      expect(result).not.toContain('12.345.678');
    });

    it('should mask credit card numbers while preserving last 4 digits', () => {
      // Arrange
      const text = 'Card: 4111 1111 1111 1234 and 5555-5555-5555-4444';
      
      // Act
      const result = maskPII(text);
      
      // Assert
      expect(result).toContain('1234');
      expect(result).toContain('4444');
      expect(result).not.toContain('4111');
      expect(result).not.toContain('5555-5555-5555-');
    });

    it('should not mask text when detectPII is false', () => {
      // Arrange
      const text = 'Email: user@example.com, Phone: (123) 456-7890';
      const options: SanitizationOptions = { detectPII: false };
      
      // Act
      const result = maskPII(text, options);
      
      // Assert
      expect(result).toBe(text);
    });

    it('should handle multiple PII patterns in the same text', () => {
      // Arrange
      const text = 'Contact: user@example.com, (123) 456-7890, CPF: 123.456.789-01';
      
      // Act
      const result = maskPII(text);
      
      // Assert
      expect(result).toContain('@example.com');
      expect(result).toContain('7890');
      expect(result).toContain('01');
      expect(result).not.toContain('user@');
      expect(result).not.toContain('(123)');
      expect(result).not.toContain('123.456.789');
    });
  });

  describe('maskCredentials', () => {
    it('should mask password fields', () => {
      // Arrange
      const text = 'password: "secretpassword", data: "other"';
      
      // Act
      const result = maskCredentials(text);
      
      // Assert
      expect(result).not.toContain('secretpassword');
      expect(result).toContain('password:');
      expect(result).toContain('data: "other"');
    });

    it('should mask token fields', () => {
      // Arrange
      const text = 'api_key: "abcd1234", access_token: "xyz789"';
      
      // Act
      const result = maskCredentials(text);
      
      // Assert
      expect(result).not.toContain('abcd1234');
      expect(result).not.toContain('xyz789');
      expect(result).toContain('api_key:');
      expect(result).toContain('access_token:');
    });

    it('should mask Basic Auth headers', () => {
      // Arrange
      const text = 'Authorization: Basic dXNlcjpwYXNzd29yZA==';
      
      // Act
      const result = maskCredentials(text);
      
      // Assert
      expect(result).toContain('Basic ');
      expect(result).not.toContain('dXNlcjpwYXNzd29yZA==');
    });

    it('should mask Bearer tokens while preserving parts', () => {
      // Arrange
      const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
      const options: SanitizationOptions = { preserveStart: 3, preserveEnd: 3 };
      
      // Act
      const result = maskCredentials(text, options);
      
      // Assert
      expect(result).toContain('Bearer ');
      expect(result).toContain('eyJ');
      expect(result).toContain('In0');
      expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should not mask text when detectCredentials is false', () => {
      // Arrange
      const text = 'password: "secretpassword", api_key: "abcd1234"';
      const options: SanitizationOptions = { detectCredentials: false };
      
      // Act
      const result = maskCredentials(text, options);
      
      // Assert
      expect(result).toBe(text);
    });

    it('should handle multiple credential patterns in the same text', () => {
      // Arrange
      const text = 'password: "secret123", api_key: "abcd1234", Authorization: Bearer token123';
      
      // Act
      const result = maskCredentials(text);
      
      // Assert
      expect(result).not.toContain('secret123');
      expect(result).not.toContain('abcd1234');
      expect(result).not.toContain('token123');
      expect(result).toContain('password:');
      expect(result).toContain('api_key:');
      expect(result).toContain('Bearer ');
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize both PII and credentials in a string', () => {
      // Arrange
      const text = 'Email: user@example.com, password: "secret123", Phone: (123) 456-7890';
      
      // Act
      const result = sanitizeString(text);
      
      // Assert
      expect(result).toContain('@example.com');
      expect(result).toContain('7890');
      expect(result).not.toContain('user@');
      expect(result).not.toContain('secret123');
      expect(result).not.toContain('(123)');
    });

    it('should respect configuration options', () => {
      // Arrange
      const text = 'Email: user@example.com, password: "secret123"';
      const options: SanitizationOptions = { detectPII: true, detectCredentials: false };
      
      // Act
      const result = sanitizeString(text, options);
      
      // Assert
      expect(result).toContain('@example.com');
      expect(result).not.toContain('user@');
      expect(result).toContain('secret123'); // Credentials not masked
    });

    it('should handle null and undefined values', () => {
      // Act & Assert
      expect(sanitizeString(null as any)).toBeNull();
      expect(sanitizeString(undefined as any)).toBeUndefined();
    });

    it('should handle non-string values', () => {
      // Arrange
      const value = 123 as any;
      
      // Act
      const result = sanitizeString(value);
      
      // Assert
      expect(result).toBe(value);
    });
  });

  describe('sanitizeObject', () => {
    it('should redact sensitive fields in an object', () => {
      // Arrange
      const obj = {
        username: 'testuser',
        password: 'secret123',
        email: 'user@example.com',
        data: 'regular data'
      };
      
      // Act
      const result = sanitizeObject(obj);
      
      // Assert
      expect(result.username).toBe('testuser');
      expect(result.password).not.toBe('secret123');
      expect(result.email).not.toBe('user@example.com');
      expect(result.data).toBe('regular data');
    });

    it('should sanitize nested objects', () => {
      // Arrange
      const obj = {
        user: {
          name: 'Test User',
          credentials: {
            password: 'secret123',
            apiKey: 'abcd1234'
          }
        },
        data: 'regular data'
      };
      
      // Act
      const result = sanitizeObject(obj);
      
      // Assert
      expect(result.user.name).toBe('Test User');
      expect(result.user.credentials.password).not.toBe('secret123');
      expect(result.user.credentials.apiKey).not.toBe('abcd1234');
      expect(result.data).toBe('regular data');
    });

    it('should sanitize arrays of objects', () => {
      // Arrange
      const obj = {
        users: [
          { name: 'User 1', password: 'pass1', email: 'user1@example.com' },
          { name: 'User 2', password: 'pass2', email: 'user2@example.com' }
        ]
      };
      
      // Act
      const result = sanitizeObject(obj);
      
      // Assert
      expect(result.users[0].name).toBe('User 1');
      expect(result.users[0].password).not.toBe('pass1');
      expect(result.users[0].email).not.toBe('user1@example.com');
      expect(result.users[1].name).toBe('User 2');
      expect(result.users[1].password).not.toBe('pass2');
      expect(result.users[1].email).not.toBe('user2@example.com');
    });

    it('should respect maxDepth option', () => {
      // Arrange
      const obj = {
        level1: {
          level2: {
            level3: {
              password: 'secret123'
            }
          }
        }
      };
      const options: SanitizationOptions = { maxDepth: 2 };
      
      // Act
      const result = sanitizeObject(obj, options);
      
      // Assert
      expect(result.level1.level2.level3.password).toBe('secret123'); // Not sanitized due to depth limit
    });

    it('should use custom sensitive fields list', () => {
      // Arrange
      const obj = {
        username: 'testuser',
        customSecret: 'secret123',
        data: 'regular data'
      };
      const options: SanitizationOptions = { sensitiveFields: ['customSecret'] };
      
      // Act
      const result = sanitizeObject(obj, options);
      
      // Assert
      expect(result.username).toBe('testuser');
      expect(result.customSecret).not.toBe('secret123');
      expect(result.data).toBe('regular data');
    });

    it('should handle null and undefined values', () => {
      // Act & Assert
      expect(sanitizeObject(null as any)).toBeNull();
      expect(sanitizeObject(undefined as any)).toBeUndefined();
    });

    it('should handle non-object values', () => {
      // Arrange
      const value = 'string value' as any;
      
      // Act
      const result = sanitizeObject(value);
      
      // Assert
      expect(result).toBe(value);
    });

    it('should not sanitize nested objects when sanitizeNested is false', () => {
      // Arrange
      const obj = {
        user: {
          password: 'secret123'
        }
      };
      const options: SanitizationOptions = { sanitizeNested: false };
      
      // Act
      const result = sanitizeObject(obj, options);
      
      // Assert
      expect(result.user.password).toBe('secret123'); // Not sanitized because sanitizeNested is false
    });
  });

  describe('sanitizeRequest', () => {
    it('should sanitize authorization headers', () => {
      // Arrange
      const request = {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          'x-api-key': 'abcd1234',
          'content-type': 'application/json'
        },
        method: 'POST',
        url: '/api/users'
      };
      
      // Act
      const result = sanitizeRequest(request);
      
      // Assert
      expect(result.headers.authorization).not.toBe('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(result.headers['x-api-key']).not.toBe('abcd1234');
      expect(result.headers['content-type']).toBe('application/json');
      expect(result.method).toBe('POST');
      expect(result.url).toBe('/api/users');
    });

    it('should sanitize request body with sensitive data', () => {
      // Arrange
      const request = {
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        body: {
          username: 'testuser',
          password: 'secret123',
          email: 'user@example.com'
        }
      };
      
      // Act
      const result = sanitizeRequest(request);
      
      // Assert
      expect(result.body.username).toBe('testuser');
      expect(result.body.password).not.toBe('secret123');
      expect(result.body.email).not.toBe('user@example.com');
    });

    it('should sanitize query parameters with sensitive data', () => {
      // Arrange
      const request = {
        headers: { 'content-type': 'application/json' },
        method: 'GET',
        url: '/api/users',
        query: {
          apiKey: 'abcd1234',
          email: 'user@example.com',
          filter: 'active'
        }
      };
      
      // Act
      const result = sanitizeRequest(request);
      
      // Assert
      expect(result.query.apiKey).not.toBe('abcd1234');
      expect(result.query.email).not.toBe('user@example.com');
      expect(result.query.filter).toBe('active');
    });

    it('should sanitize URLs with sensitive data', () => {
      // Arrange
      const request = {
        headers: { 'content-type': 'application/json' },
        method: 'GET',
        url: '/api/users?email=user@example.com&apiKey=abcd1234'
      };
      
      // Act
      const result = sanitizeRequest(request);
      
      // Assert
      expect(result.url).toContain('/api/users');
      expect(result.url).toContain('@example.com');
      expect(result.url).not.toContain('user@example.com');
      expect(result.url).not.toContain('abcd1234');
    });

    it('should handle null and undefined values', () => {
      // Act & Assert
      expect(sanitizeRequest(null as any)).toBeNull();
      expect(sanitizeRequest(undefined as any)).toBeUndefined();
    });
  });

  describe('sanitizeResponse', () => {
    it('should sanitize response headers', () => {
      // Arrange
      const response = {
        headers: {
          'set-cookie': 'auth=token123; Path=/; HttpOnly',
          'content-type': 'application/json'
        },
        statusCode: 200
      };
      
      // Act
      const result = sanitizeResponse(response);
      
      // Assert
      expect(result.headers['set-cookie']).not.toBe('auth=token123; Path=/; HttpOnly');
      expect(result.headers['content-type']).toBe('application/json');
      expect(result.statusCode).toBe(200);
    });

    it('should sanitize response body with sensitive data', () => {
      // Arrange
      const response = {
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
        body: {
          user: {
            id: 123,
            email: 'user@example.com',
            token: 'abcd1234'
          }
        }
      };
      
      // Act
      const result = sanitizeResponse(response);
      
      // Assert
      expect(result.body.user.id).toBe(123);
      expect(result.body.user.email).not.toBe('user@example.com');
      expect(result.body.user.token).not.toBe('abcd1234');
    });

    it('should sanitize response data with sensitive information', () => {
      // Arrange
      const response = {
        headers: { 'content-type': 'application/json' },
        status: 200,
        data: {
          users: [
            { id: 1, email: 'user1@example.com', apiKey: 'key1' },
            { id: 2, email: 'user2@example.com', apiKey: 'key2' }
          ]
        }
      };
      
      // Act
      const result = sanitizeResponse(response);
      
      // Assert
      expect(result.data.users[0].id).toBe(1);
      expect(result.data.users[0].email).not.toBe('user1@example.com');
      expect(result.data.users[0].apiKey).not.toBe('key1');
      expect(result.data.users[1].id).toBe(2);
      expect(result.data.users[1].email).not.toBe('user2@example.com');
      expect(result.data.users[1].apiKey).not.toBe('key2');
    });

    it('should handle null and undefined values', () => {
      // Act & Assert
      expect(sanitizeResponse(null as any)).toBeNull();
      expect(sanitizeResponse(undefined as any)).toBeUndefined();
    });
  });

  describe('sanitizeError', () => {
    it('should sanitize standard Error objects', () => {
      // Arrange
      const error = new Error('Error with sensitive data: user@example.com, password: secret123');
      
      // Act
      const result = sanitizeError(error);
      
      // Assert
      expect(result.name).toBe('Error');
      expect(result.message).toContain('@example.com');
      expect(result.message).not.toContain('user@example.com');
      expect(result.message).not.toContain('secret123');
      expect(result).toHaveProperty('stack');
    });

    it('should sanitize custom error properties', () => {
      // Arrange
      class CustomError extends Error {
        constructor(message: string, public context: any) {
          super(message);
          this.name = 'CustomError';
        }
      }
      
      const error = new CustomError('Authentication failed', {
        user: { email: 'user@example.com' },
        credentials: { apiKey: 'abcd1234' }
      });
      
      // Act
      const result = sanitizeError(error);
      
      // Assert
      expect(result.name).toBe('CustomError');
      expect(result.message).toBe('Authentication failed');
      expect(result.context.user.email).not.toBe('user@example.com');
      expect(result.context.credentials.apiKey).not.toBe('abcd1234');
    });

    it('should sanitize error-like objects', () => {
      // Arrange
      const errorLike = {
        code: 'AUTH_FAILED',
        message: 'Failed to authenticate with token: abcd1234',
        user: { email: 'user@example.com' }
      };
      
      // Act
      const result = sanitizeError(errorLike);
      
      // Assert
      expect(result.code).toBe('AUTH_FAILED');
      expect(result.message).not.toContain('abcd1234');
      expect(result.user.email).not.toBe('user@example.com');
    });

    it('should handle null and undefined values', () => {
      // Act & Assert
      expect(sanitizeError(null as any)).toBeNull();
      expect(sanitizeError(undefined as any)).toBeUndefined();
    });
  });

  describe('sanitizeJourneyData', () => {
    it('should sanitize health journey data with journey-specific fields', () => {
      // Arrange
      const healthData = {
        userId: 123,
        medicalRecordNumber: 'MRN12345',
        healthMetric: {
          bloodPressure: '120/80',
          heartRate: 75
        },
        email: 'patient@example.com'
      };
      
      // Act
      const result = sanitizeJourneyData(healthData, 'health');
      
      // Assert
      expect(result.userId).toBe(123);
      expect(result.medicalRecordNumber).not.toBe('MRN12345');
      expect(result.healthMetric).not.toEqual({
        bloodPressure: '120/80',
        heartRate: 75
      });
      expect(result.email).not.toBe('patient@example.com');
    });

    it('should sanitize care journey data with journey-specific fields', () => {
      // Arrange
      const careData = {
        userId: 123,
        diagnosisCode: 'ICD10-A123',
        medicationName: 'Medication XYZ',
        providerNotes: 'Patient reported symptoms...',
        email: 'patient@example.com'
      };
      
      // Act
      const result = sanitizeJourneyData(careData, 'care');
      
      // Assert
      expect(result.userId).toBe(123);
      expect(result.diagnosisCode).not.toBe('ICD10-A123');
      expect(result.medicationName).not.toBe('Medication XYZ');
      expect(result.providerNotes).not.toBe('Patient reported symptoms...');
      expect(result.email).not.toBe('patient@example.com');
    });

    it('should sanitize plan journey data with journey-specific fields', () => {
      // Arrange
      const planData = {
        userId: 123,
        membershipId: 'MEM12345',
        policyNumber: 'POL-987654',
        claimId: 'CLM-123-456',
        email: 'member@example.com'
      };
      
      // Act
      const result = sanitizeJourneyData(planData, 'plan');
      
      // Assert
      expect(result.userId).toBe(123);
      expect(result.membershipId).not.toBe('MEM12345');
      expect(result.policyNumber).not.toBe('POL-987654');
      expect(result.claimId).not.toBe('CLM-123-456');
      expect(result.email).not.toBe('member@example.com');
    });

    it('should respect custom sanitization options', () => {
      // Arrange
      const healthData = {
        userId: 123,
        medicalRecordNumber: 'MRN12345',
        customField: 'sensitive-value'
      };
      const options: SanitizationOptions = {
        sensitiveFields: ['customField'],
        maskChar: '#'
      };
      
      // Act
      const result = sanitizeJourneyData(healthData, 'health', options);
      
      // Assert
      expect(result.userId).toBe(123);
      expect(result.medicalRecordNumber).not.toBe('MRN12345');
      expect(result.customField).not.toBe('sensitive-value');
      expect(result.customField).toContain('#'); // Custom mask character
    });

    it('should handle null and undefined values', () => {
      // Act & Assert
      expect(sanitizeJourneyData(null as any, 'health')).toBeNull();
      expect(sanitizeJourneyData(undefined as any, 'care')).toBeUndefined();
    });
  });

  describe('sanitizeGamificationEvent', () => {
    it('should sanitize gamification event data with specific fields', () => {
      // Arrange
      const eventData = {
        eventType: 'ACHIEVEMENT_UNLOCKED',
        userId: 'user-123',
        profileId: 'profile-456',
        achievementData: {
          code: 'ACH-789',
          progress: 100
        },
        timestamp: '2023-01-01T12:00:00Z'
      };
      
      // Act
      const result = sanitizeGamificationEvent(eventData);
      
      // Assert
      expect(result.eventType).toBe('ACHIEVEMENT_UNLOCKED');
      expect(result.userId).not.toBe('user-123');
      expect(result.profileId).not.toBe('profile-456');
      expect(result.achievementData).not.toEqual({
        code: 'ACH-789',
        progress: 100
      });
      expect(result.timestamp).toBe('2023-01-01T12:00:00Z');
    });

    it('should sanitize nested gamification data', () => {
      // Arrange
      const eventData = {
        eventType: 'REWARD_CLAIMED',
        user: {
          id: 'user-123',
          email: 'user@example.com'
        },
        reward: {
          rewardCode: 'RWD-456',
          points: 500
        }
      };
      
      // Act
      const result = sanitizeGamificationEvent(eventData);
      
      // Assert
      expect(result.eventType).toBe('REWARD_CLAIMED');
      expect(result.user.id).not.toBe('user-123');
      expect(result.user.email).not.toBe('user@example.com');
      expect(result.reward.rewardCode).not.toBe('RWD-456');
      expect(result.reward.points).toBe(500);
    });

    it('should respect custom sanitization options', () => {
      // Arrange
      const eventData = {
        eventType: 'QUEST_COMPLETED',
        userId: 'user-123',
        customField: 'sensitive-value'
      };
      const options: SanitizationOptions = {
        sensitiveFields: ['customField'],
        maskChar: '#'
      };
      
      // Act
      const result = sanitizeGamificationEvent(eventData, options);
      
      // Assert
      expect(result.eventType).toBe('QUEST_COMPLETED');
      expect(result.userId).not.toBe('user-123');
      expect(result.customField).not.toBe('sensitive-value');
      expect(result.customField).toContain('#'); // Custom mask character
    });

    it('should handle null and undefined values', () => {
      // Act & Assert
      expect(sanitizeGamificationEvent(null as any)).toBeNull();
      expect(sanitizeGamificationEvent(undefined as any)).toBeUndefined();
    });
  });
});
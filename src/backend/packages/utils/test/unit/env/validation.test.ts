import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';
import {
  validateEnv,
  validateUrl,
  validateNumericRange,
  validateBoolean,
  validateBatchEnv,
  validateStructuredEnv,
  createEnvValidator
} from '../../../src/env/validation';
import { MissingEnvironmentVariableError, InvalidEnvironmentVariableError } from '../../../src/env/error';

describe('Environment Variable Validation', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should validate a required environment variable', () => {
      process.env.TEST_VAR = 'test-value';
      const schema = z.string();
      
      const result = validateEnv('TEST_VAR', schema);
      
      expect(result).toBe('test-value');
    });

    it('should throw MissingEnvironmentVariableError when required variable is missing', () => {
      delete process.env.TEST_VAR;
      const schema = z.string();
      
      expect(() => validateEnv('TEST_VAR', schema))
        .toThrow(MissingEnvironmentVariableError);
    });

    it('should throw InvalidEnvironmentVariableError when validation fails', () => {
      process.env.TEST_VAR = '123';
      const schema = z.string().email();
      
      expect(() => validateEnv('TEST_VAR', schema))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should include detailed error information in validation error', () => {
      process.env.TEST_VAR = '123';
      const schema = z.string().email();
      
      try {
        validateEnv('TEST_VAR', schema);
        fail('Expected validation to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEnvironmentVariableError);
        expect(error.message).toContain('TEST_VAR');
        expect(error.message).toContain('email');
        expect(error.details).toBeDefined();
        expect(error.details.issues).toHaveLength(1);
      }
    });

    it('should support default values for optional variables', () => {
      delete process.env.TEST_VAR;
      const schema = z.string().optional().default('default-value');
      
      const result = validateEnv('TEST_VAR', schema);
      
      expect(result).toBe('default-value');
    });

    it('should transform values according to schema', () => {
      process.env.TEST_VAR = '42';
      const schema = z.string().transform(val => parseInt(val, 10));
      
      const result = validateEnv('TEST_VAR', schema);
      
      expect(result).toBe(42);
    });
  });

  describe('validateUrl', () => {
    it('should validate a valid URL', () => {
      process.env.API_URL = 'https://api.example.com/v1';
      
      const result = validateUrl('API_URL');
      
      expect(result).toBe('https://api.example.com/v1');
    });

    it('should throw InvalidEnvironmentVariableError for invalid URL', () => {
      process.env.API_URL = 'not-a-url';
      
      expect(() => validateUrl('API_URL'))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should validate URL with specific protocol requirement', () => {
      process.env.SECURE_URL = 'https://secure.example.com';
      
      const result = validateUrl('SECURE_URL', { protocols: ['https'] });
      
      expect(result).toBe('https://secure.example.com');
    });

    it('should throw error when URL does not match required protocol', () => {
      process.env.SECURE_URL = 'http://insecure.example.com';
      
      expect(() => validateUrl('SECURE_URL', { protocols: ['https'] }))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should validate URL with required hostname pattern', () => {
      process.env.INTERNAL_URL = 'https://internal.austa.com';
      
      const result = validateUrl('INTERNAL_URL', { hostnamePattern: /\.austa\.com$/ });
      
      expect(result).toBe('https://internal.austa.com');
    });

    it('should throw error when URL hostname does not match required pattern', () => {
      process.env.INTERNAL_URL = 'https://external.example.com';
      
      expect(() => validateUrl('INTERNAL_URL', { hostnamePattern: /\.austa\.com$/ }))
        .toThrow(InvalidEnvironmentVariableError);
    });
  });

  describe('validateNumericRange', () => {
    it('should validate a number within range', () => {
      process.env.PORT = '3000';
      
      const result = validateNumericRange('PORT', { min: 1024, max: 49151 });
      
      expect(result).toBe(3000);
    });

    it('should throw InvalidEnvironmentVariableError when value is below minimum', () => {
      process.env.PORT = '80';
      
      expect(() => validateNumericRange('PORT', { min: 1024, max: 49151 }))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should throw InvalidEnvironmentVariableError when value is above maximum', () => {
      process.env.PORT = '65000';
      
      expect(() => validateNumericRange('PORT', { min: 1024, max: 49151 }))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should throw InvalidEnvironmentVariableError when value is not a number', () => {
      process.env.PORT = 'not-a-number';
      
      expect(() => validateNumericRange('PORT', { min: 1024, max: 49151 }))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should validate with only minimum constraint', () => {
      process.env.TIMEOUT = '5000';
      
      const result = validateNumericRange('TIMEOUT', { min: 1000 });
      
      expect(result).toBe(5000);
    });

    it('should validate with only maximum constraint', () => {
      process.env.MAX_CONNECTIONS = '50';
      
      const result = validateNumericRange('MAX_CONNECTIONS', { max: 100 });
      
      expect(result).toBe(50);
    });
  });

  describe('validateBoolean', () => {
    it('should validate "true" as true', () => {
      process.env.FEATURE_FLAG = 'true';
      
      const result = validateBoolean('FEATURE_FLAG');
      
      expect(result).toBe(true);
    });

    it('should validate "false" as false', () => {
      process.env.FEATURE_FLAG = 'false';
      
      const result = validateBoolean('FEATURE_FLAG');
      
      expect(result).toBe(false);
    });

    it('should validate "1" as true', () => {
      process.env.FEATURE_FLAG = '1';
      
      const result = validateBoolean('FEATURE_FLAG');
      
      expect(result).toBe(true);
    });

    it('should validate "0" as false', () => {
      process.env.FEATURE_FLAG = '0';
      
      const result = validateBoolean('FEATURE_FLAG');
      
      expect(result).toBe(false);
    });

    it('should throw InvalidEnvironmentVariableError for invalid boolean value', () => {
      process.env.FEATURE_FLAG = 'not-a-boolean';
      
      expect(() => validateBoolean('FEATURE_FLAG'))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should support default value when variable is missing', () => {
      delete process.env.FEATURE_FLAG;
      
      const result = validateBoolean('FEATURE_FLAG', { defaultValue: false });
      
      expect(result).toBe(false);
    });
  });

  describe('validateBatchEnv', () => {
    it('should validate multiple environment variables', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'test_db';
      
      const schema = {
        DB_HOST: z.string(),
        DB_PORT: z.string().transform(val => parseInt(val, 10)),
        DB_NAME: z.string()
      };
      
      const result = validateBatchEnv(schema);
      
      expect(result).toEqual({
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'test_db'
      });
    });

    it('should throw error with all validation failures', () => {
      process.env.DB_HOST = '';
      process.env.DB_PORT = 'not-a-number';
      delete process.env.DB_NAME;
      
      const schema = {
        DB_HOST: z.string().min(1),
        DB_PORT: z.string().transform(val => parseInt(val, 10)),
        DB_NAME: z.string()
      };
      
      try {
        validateBatchEnv(schema);
        fail('Expected validation to throw');
      } catch (error) {
        expect(error.message).toContain('Multiple environment variables failed validation');
        expect(error.details.issues).toHaveLength(3);
        expect(error.details.issues[0].path).toContain('DB_HOST');
        expect(error.details.issues[1].path).toContain('DB_PORT');
        expect(error.details.issues[2].path).toContain('DB_NAME');
      }
    });

    it('should support partial validation with optional fields', () => {
      process.env.REQUIRED_VAR = 'value';
      delete process.env.OPTIONAL_VAR;
      
      const schema = {
        REQUIRED_VAR: z.string(),
        OPTIONAL_VAR: z.string().optional()
      };
      
      const result = validateBatchEnv(schema);
      
      expect(result).toEqual({
        REQUIRED_VAR: 'value',
        OPTIONAL_VAR: undefined
      });
    });
  });

  describe('validateStructuredEnv', () => {
    it('should validate and transform structured environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      
      const result = validateStructuredEnv('DATABASE_URL', {
        transform: (url) => {
          const parsed = new URL(url);
          return {
            host: parsed.hostname,
            port: parseInt(parsed.port, 10),
            username: parsed.username,
            password: parsed.password,
            database: parsed.pathname.substring(1)
          };
        },
        validate: (config) => {
          const schema = z.object({
            host: z.string().min(1),
            port: z.number().int().positive(),
            username: z.string().min(1),
            password: z.string(),
            database: z.string().min(1)
          });
          return schema.parse(config);
        }
      });
      
      expect(result).toEqual({
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'db'
      });
    });

    it('should throw InvalidEnvironmentVariableError when transformation fails', () => {
      process.env.DATABASE_URL = 'invalid-url';
      
      expect(() => validateStructuredEnv('DATABASE_URL', {
        transform: (url) => new URL(url),
        validate: (url) => url
      })).toThrow(InvalidEnvironmentVariableError);
    });

    it('should throw InvalidEnvironmentVariableError when validation fails', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      
      expect(() => validateStructuredEnv('DATABASE_URL', {
        transform: (url) => {
          const parsed = new URL(url);
          return {
            host: parsed.hostname,
            port: parseInt(parsed.port, 10),
            username: parsed.username,
            password: parsed.password,
            database: parsed.pathname.substring(1)
          };
        },
        validate: (config) => {
          const schema = z.object({
            host: z.string().min(1),
            port: z.number().int().positive(),
            username: z.string().min(10), // Will fail validation
            password: z.string(),
            database: z.string().min(1)
          });
          return schema.parse(config);
        }
      })).toThrow(InvalidEnvironmentVariableError);
    });
  });

  describe('createEnvValidator', () => {
    it('should create a validator function with predefined schema', () => {
      const validatePort = createEnvValidator(z.string().transform(val => parseInt(val, 10)));
      
      process.env.PORT = '3000';
      
      const result = validatePort('PORT');
      
      expect(result).toBe(3000);
    });

    it('should create a validator that throws appropriate errors', () => {
      const validateEmail = createEnvValidator(z.string().email());
      
      process.env.ADMIN_EMAIL = 'not-an-email';
      
      expect(() => validateEmail('ADMIN_EMAIL'))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should support validator with custom error message', () => {
      const customMessage = 'API key must be a valid UUID';
      const validateApiKey = createEnvValidator(
        z.string().uuid(),
        { errorMessage: customMessage }
      );
      
      process.env.API_KEY = 'not-a-uuid';
      
      try {
        validateApiKey('API_KEY');
        fail('Expected validation to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should support validator with custom error handler', () => {
      const mockErrorHandler = vi.fn();
      const validateApiKey = createEnvValidator(
        z.string().uuid(),
        { onError: mockErrorHandler }
      );
      
      process.env.API_KEY = 'not-a-uuid';
      
      try {
        validateApiKey('API_KEY');
      } catch (error) {
        expect(mockErrorHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            varName: 'API_KEY',
            value: 'not-a-uuid'
          }),
          expect.any(Object) // ZodError
        );
      }
    });
  });
});
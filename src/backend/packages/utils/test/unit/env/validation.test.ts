/**
 * Unit tests for environment variable validation utilities
 */

import { z } from 'zod';
import * as validation from '../../../src/env/validation';
import {
  EnvironmentVariableError,
  InvalidEnvironmentVariableError,
  ValidationEnvironmentVariableError,
  BatchEnvironmentValidationError
} from '../../../src/env/error';

// Helper to set environment variables for testing
const setEnv = (key: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

// Helper to reset environment variables after tests
const resetEnv = (key: string): void => {
  delete process.env[key];
};

describe('Environment Variable Validation Utilities', () => {
  // Clean up environment variables after each test
  afterEach(() => {
    // Reset all environment variables that might have been set during tests
    resetEnv('TEST_STRING');
    resetEnv('TEST_NUMBER');
    resetEnv('TEST_BOOLEAN');
    resetEnv('TEST_URL');
    resetEnv('TEST_ARRAY');
    resetEnv('TEST_JSON');
    resetEnv('TEST_ENUM');
    resetEnv('TEST_DURATION');
    resetEnv('TEST_PORT');
    resetEnv('TEST_HOST');
    resetEnv('TEST_DB_URL');
    resetEnv('TEST_API_KEY');
    resetEnv('TEST_JWT_SECRET');
    resetEnv('TEST_NODE_ENV');
    resetEnv('TEST_REDIS_URL');
    resetEnv('TEST_KAFKA_BROKERS');
    resetEnv('TEST_CORS_ORIGINS');
    resetEnv('TEST_LOG_LEVEL');
    resetEnv('TEST_FEATURE_FLAGS');
    resetEnv('TEST_JOURNEY_CONFIG');
    resetEnv('TEST_DB_POOL_CONFIG');
    resetEnv('TEST_RETRY_POLICY');
    resetEnv('TEST_GROUP_1');
    resetEnv('TEST_GROUP_2');
    resetEnv('TEST_GROUP_3');
    resetEnv('HEALTH_API_KEY');
    resetEnv('HEALTH_SERVICE_URL');
    resetEnv('HEALTH_FEATURES');
  });

  describe('createZodValidator', () => {
    it('should validate a string using a Zod schema', () => {
      setEnv('TEST_STRING', 'hello');
      const validator = validation.createZodValidator('TEST_STRING', z.string().min(3));
      expect(validator()).toBe('hello');
    });

    it('should throw InvalidEnvironmentVariableError when variable is undefined', () => {
      setEnv('TEST_STRING', undefined);
      const validator = validation.createZodValidator('TEST_STRING', z.string());
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a defined value/);
    });

    it('should throw ValidationEnvironmentVariableError when validation fails', () => {
      setEnv('TEST_STRING', 'hi');
      const validator = validation.createZodValidator('TEST_STRING', z.string().min(3));
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Should be at least 3 characters/);
    });

    it('should validate complex objects with nested properties', () => {
      setEnv('TEST_JSON', JSON.stringify({ name: 'test', count: 5, nested: { value: true } }));
      const schema = z.object({
        name: z.string(),
        count: z.number(),
        nested: z.object({
          value: z.boolean()
        })
      });
      const validator = validation.createZodValidator('TEST_JSON', schema);
      const result = validator();
      expect(result).toEqual({ name: 'test', count: 5, nested: { value: true } });
    });
  });

  describe('createZodValidatorWithDefault', () => {
    it('should return the default value when variable is undefined', () => {
      setEnv('TEST_STRING', undefined);
      const validator = validation.createZodValidatorWithDefault('TEST_STRING', z.string(), 'default');
      expect(validator()).toBe('default');
    });

    it('should validate and return the value when variable is defined', () => {
      setEnv('TEST_STRING', 'hello');
      const validator = validation.createZodValidatorWithDefault('TEST_STRING', z.string(), 'default');
      expect(validator()).toBe('hello');
    });

    it('should throw ValidationEnvironmentVariableError when validation fails', () => {
      setEnv('TEST_STRING', 'hi');
      const validator = validation.createZodValidatorWithDefault('TEST_STRING', z.string().min(3), 'default');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
    });
  });

  describe('createStringValidator', () => {
    it('should validate a string with no options', () => {
      setEnv('TEST_STRING', 'hello');
      const validator = validation.createStringValidator('TEST_STRING');
      expect(validator()).toBe('hello');
    });

    it('should validate a string with minLength option', () => {
      setEnv('TEST_STRING', 'hello');
      const validator = validation.createStringValidator('TEST_STRING', { minLength: 3 });
      expect(validator()).toBe('hello');
    });

    it('should throw when string is too short', () => {
      setEnv('TEST_STRING', 'hi');
      const validator = validation.createStringValidator('TEST_STRING', { minLength: 3 });
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Should be at least 3 characters/);
    });

    it('should validate a string with maxLength option', () => {
      setEnv('TEST_STRING', 'hello');
      const validator = validation.createStringValidator('TEST_STRING', { maxLength: 10 });
      expect(validator()).toBe('hello');
    });

    it('should throw when string is too long', () => {
      setEnv('TEST_STRING', 'hello world this is too long');
      const validator = validation.createStringValidator('TEST_STRING', { maxLength: 10 });
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Should be at most 10 characters/);
    });

    it('should validate a string with pattern option', () => {
      setEnv('TEST_STRING', 'abc123');
      const validator = validation.createStringValidator('TEST_STRING', { pattern: /^[a-z0-9]+$/ });
      expect(validator()).toBe('abc123');
    });

    it('should throw when string does not match pattern', () => {
      setEnv('TEST_STRING', 'ABC123!');
      const validator = validation.createStringValidator('TEST_STRING', { pattern: /^[a-z0-9]+$/ });
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Does not match the required pattern/);
    });

    it('should validate a string with enum option', () => {
      setEnv('TEST_STRING', 'apple');
      const validator = validation.createStringValidator('TEST_STRING', { enum: ['apple', 'banana', 'orange'] });
      expect(validator()).toBe('apple');
    });

    it('should throw when string is not in enum', () => {
      setEnv('TEST_STRING', 'grape');
      const validator = validation.createStringValidator('TEST_STRING', { enum: ['apple', 'banana', 'orange'] });
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Should be one of: apple, banana, orange/);
    });
  });

  describe('createNumberValidator', () => {
    it('should validate a number with no options', () => {
      setEnv('TEST_NUMBER', '42');
      const validator = validation.createNumberValidator('TEST_NUMBER');
      expect(validator()).toBe(42);
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_NUMBER', undefined);
      const validator = validation.createNumberValidator('TEST_NUMBER');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a number value/);
    });

    it('should throw when value is not a number', () => {
      setEnv('TEST_NUMBER', 'not-a-number');
      const validator = validation.createNumberValidator('TEST_NUMBER');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid number/);
    });

    it('should validate a number with min option', () => {
      setEnv('TEST_NUMBER', '42');
      const validator = validation.createNumberValidator('TEST_NUMBER', { min: 10 });
      expect(validator()).toBe(42);
    });

    it('should throw when number is less than min', () => {
      setEnv('TEST_NUMBER', '5');
      const validator = validation.createNumberValidator('TEST_NUMBER', { min: 10 });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a number greater than or equal to 10/);
    });

    it('should validate a number with max option', () => {
      setEnv('TEST_NUMBER', '42');
      const validator = validation.createNumberValidator('TEST_NUMBER', { max: 50 });
      expect(validator()).toBe(42);
    });

    it('should throw when number is greater than max', () => {
      setEnv('TEST_NUMBER', '100');
      const validator = validation.createNumberValidator('TEST_NUMBER', { max: 50 });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a number less than or equal to 50/);
    });

    it('should validate an integer with int option', () => {
      setEnv('TEST_NUMBER', '42');
      const validator = validation.createNumberValidator('TEST_NUMBER', { int: true });
      expect(validator()).toBe(42);
    });

    it('should throw when number is not an integer', () => {
      setEnv('TEST_NUMBER', '42.5');
      const validator = validation.createNumberValidator('TEST_NUMBER', { int: true });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/an integer value/);
    });

    it('should validate a positive number', () => {
      setEnv('TEST_NUMBER', '42');
      const validator = validation.createNumberValidator('TEST_NUMBER', { positive: true });
      expect(validator()).toBe(42);
    });

    it('should throw when number is not positive', () => {
      setEnv('TEST_NUMBER', '0');
      const validator = validation.createNumberValidator('TEST_NUMBER', { positive: true });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a positive number/);
    });

    it('should validate a non-negative number', () => {
      setEnv('TEST_NUMBER', '0');
      const validator = validation.createNumberValidator('TEST_NUMBER', { nonNegative: true });
      expect(validator()).toBe(0);
    });

    it('should throw when number is negative', () => {
      setEnv('TEST_NUMBER', '-5');
      const validator = validation.createNumberValidator('TEST_NUMBER', { nonNegative: true });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a non-negative number/);
    });
  });

  describe('createBooleanValidator', () => {
    it('should validate a boolean true value', () => {
      setEnv('TEST_BOOLEAN', 'true');
      const validator = validation.createBooleanValidator('TEST_BOOLEAN');
      expect(validator()).toBe(true);
    });

    it('should validate a boolean false value', () => {
      setEnv('TEST_BOOLEAN', 'false');
      const validator = validation.createBooleanValidator('TEST_BOOLEAN');
      expect(validator()).toBe(false);
    });

    it('should validate alternative true values', () => {
      const trueValues = ['TRUE', 'True', 'yes', 'YES', 'Y', '1', 'on', 'ON'];
      for (const value of trueValues) {
        setEnv('TEST_BOOLEAN', value);
        const validator = validation.createBooleanValidator('TEST_BOOLEAN');
        expect(validator()).toBe(true);
      }
    });

    it('should validate alternative false values', () => {
      const falseValues = ['FALSE', 'False', 'no', 'NO', 'N', '0', 'off', 'OFF'];
      for (const value of falseValues) {
        setEnv('TEST_BOOLEAN', value);
        const validator = validation.createBooleanValidator('TEST_BOOLEAN');
        expect(validator()).toBe(false);
      }
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_BOOLEAN', undefined);
      const validator = validation.createBooleanValidator('TEST_BOOLEAN');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a boolean value/);
    });
  });

  describe('createUrlValidator', () => {
    it('should validate a URL with no options', () => {
      setEnv('TEST_URL', 'https://example.com');
      const validator = validation.createUrlValidator('TEST_URL');
      expect(validator().toString()).toBe('https://example.com/');
    });

    it('should validate a URL with path and query parameters', () => {
      setEnv('TEST_URL', 'https://example.com/path?query=value');
      const validator = validation.createUrlValidator('TEST_URL');
      expect(validator().toString()).toBe('https://example.com/path?query=value');
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_URL', undefined);
      const validator = validation.createUrlValidator('TEST_URL');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid URL/);
    });

    it('should throw when URL is invalid', () => {
      setEnv('TEST_URL', 'not-a-url');
      const validator = validation.createUrlValidator('TEST_URL');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid URL/);
    });

    it('should validate a URL with specific protocol', () => {
      setEnv('TEST_URL', 'https://example.com');
      const validator = validation.createUrlValidator('TEST_URL', { protocols: ['https'] });
      expect(validator().toString()).toBe('https://example.com/');
    });

    it('should throw when URL has wrong protocol', () => {
      setEnv('TEST_URL', 'http://example.com');
      const validator = validation.createUrlValidator('TEST_URL', { protocols: ['https'] });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid URL/);
    });
  });

  describe('createArrayValidator', () => {
    it('should validate an array with default delimiter', () => {
      setEnv('TEST_ARRAY', 'a,b,c');
      const validator = validation.createArrayValidator('TEST_ARRAY');
      expect(validator()).toEqual(['a', 'b', 'c']);
    });

    it('should validate an array with custom delimiter', () => {
      setEnv('TEST_ARRAY', 'a|b|c');
      const validator = validation.createArrayValidator('TEST_ARRAY', { delimiter: '|' });
      expect(validator()).toEqual(['a', 'b', 'c']);
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_ARRAY', undefined);
      const validator = validation.createArrayValidator('TEST_ARRAY');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a comma-separated list/);
    });

    it('should validate an array with minLength option', () => {
      setEnv('TEST_ARRAY', 'a,b,c');
      const validator = validation.createArrayValidator('TEST_ARRAY', { minLength: 2 });
      expect(validator()).toEqual(['a', 'b', 'c']);
    });

    it('should throw when array is too short', () => {
      setEnv('TEST_ARRAY', 'a');
      const validator = validation.createArrayValidator('TEST_ARRAY', { minLength: 2 });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a list with at least 2 items/);
    });

    it('should validate an array with maxLength option', () => {
      setEnv('TEST_ARRAY', 'a,b,c');
      const validator = validation.createArrayValidator('TEST_ARRAY', { maxLength: 5 });
      expect(validator()).toEqual(['a', 'b', 'c']);
    });

    it('should throw when array is too long', () => {
      setEnv('TEST_ARRAY', 'a,b,c,d,e,f');
      const validator = validation.createArrayValidator('TEST_ARRAY', { maxLength: 5 });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a list with at most 5 items/);
    });

    it('should validate an array with itemValidator option', () => {
      setEnv('TEST_ARRAY', 'a1,b2,c3');
      const validator = validation.createArrayValidator('TEST_ARRAY', {
        itemValidator: (item) => /^[a-z]\d$/.test(item)
      });
      expect(validator()).toEqual(['a1', 'b2', 'c3']);
    });

    it('should throw when an item fails validation', () => {
      setEnv('TEST_ARRAY', 'a1,b2,invalid');
      const validator = validation.createArrayValidator('TEST_ARRAY', {
        itemValidator: (item) => /^[a-z]\d$/.test(item)
      });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a list where item at index 2/);
    });
  });

  describe('createJsonValidator', () => {
    it('should validate a JSON string with no schema', () => {
      setEnv('TEST_JSON', '{"name":"test","value":42}');
      const validator = validation.createJsonValidator('TEST_JSON');
      expect(validator()).toEqual({ name: 'test', value: 42 });
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_JSON', undefined);
      const validator = validation.createJsonValidator('TEST_JSON');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid JSON string/);
    });

    it('should throw when JSON is invalid', () => {
      setEnv('TEST_JSON', '{invalid-json}');
      const validator = validation.createJsonValidator('TEST_JSON');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid JSON string/);
    });

    it('should validate a JSON string with a schema', () => {
      setEnv('TEST_JSON', '{"name":"test","value":42}');
      const schema = z.object({
        name: z.string(),
        value: z.number()
      });
      const validator = validation.createJsonValidator('TEST_JSON', schema);
      expect(validator()).toEqual({ name: 'test', value: 42 });
    });

    it('should throw when JSON does not match schema', () => {
      setEnv('TEST_JSON', '{"name":"test","value":"not-a-number"}');
      const schema = z.object({
        name: z.string(),
        value: z.number()
      });
      const validator = validation.createJsonValidator('TEST_JSON', schema);
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Expected number, received string at value/);
    });
  });

  describe('createEnumValidator', () => {
    enum TestEnum {
      A = 'a',
      B = 'b',
      C = 'c'
    }

    it('should validate an enum value', () => {
      setEnv('TEST_ENUM', 'a');
      const validator = validation.createEnumValidator('TEST_ENUM', TestEnum);
      expect(validator()).toBe('a');
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_ENUM', undefined);
      const validator = validation.createEnumValidator('TEST_ENUM', TestEnum);
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/one of: a, b, c/);
    });

    it('should throw when value is not in enum', () => {
      setEnv('TEST_ENUM', 'd');
      const validator = validation.createEnumValidator('TEST_ENUM', TestEnum);
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/one of: a, b, c/);
    });

    it('should validate case-insensitive enum values', () => {
      setEnv('TEST_ENUM', 'A');
      const validator = validation.createEnumValidator('TEST_ENUM', TestEnum);
      expect(validator()).toBe('a');
    });

    it('should validate enum keys', () => {
      setEnv('TEST_ENUM', 'A');
      const validator = validation.createEnumValidator('TEST_ENUM', TestEnum);
      expect(validator()).toBe('a');
    });
  });

  describe('createDurationValidator', () => {
    it('should validate a duration string', () => {
      setEnv('TEST_DURATION', '1h');
      const validator = validation.createDurationValidator('TEST_DURATION');
      expect(validator()).toBe(3600000); // 1 hour in milliseconds
    });

    it('should validate different duration units', () => {
      const durations = [
        { value: '1d', expected: 86400000 }, // 1 day
        { value: '2h', expected: 7200000 },  // 2 hours
        { value: '30m', expected: 1800000 }, // 30 minutes
        { value: '45s', expected: 45000 },   // 45 seconds
        { value: '500ms', expected: 500 }    // 500 milliseconds
      ];

      for (const { value, expected } of durations) {
        setEnv('TEST_DURATION', value);
        const validator = validation.createDurationValidator('TEST_DURATION');
        expect(validator()).toBe(expected);
      }
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_DURATION', undefined);
      const validator = validation.createDurationValidator('TEST_DURATION');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid duration/);
    });

    it('should throw when duration format is invalid', () => {
      setEnv('TEST_DURATION', 'invalid');
      const validator = validation.createDurationValidator('TEST_DURATION');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid duration/);
    });

    it('should validate a duration with min option', () => {
      setEnv('TEST_DURATION', '1h');
      const validator = validation.createDurationValidator('TEST_DURATION', { min: 3600000 });
      expect(validator()).toBe(3600000);
    });

    it('should throw when duration is less than min', () => {
      setEnv('TEST_DURATION', '30m');
      const validator = validation.createDurationValidator('TEST_DURATION', { min: 3600000 });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a duration greater than or equal to 3600000ms/);
    });

    it('should validate a duration with max option', () => {
      setEnv('TEST_DURATION', '1h');
      const validator = validation.createDurationValidator('TEST_DURATION', { max: 7200000 });
      expect(validator()).toBe(3600000);
    });

    it('should throw when duration is greater than max', () => {
      setEnv('TEST_DURATION', '3h');
      const validator = validation.createDurationValidator('TEST_DURATION', { max: 7200000 });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a duration less than or equal to 7200000ms/);
    });
  });

  describe('createPortValidator', () => {
    it('should validate a valid port number', () => {
      setEnv('TEST_PORT', '8080');
      const validator = validation.createPortValidator('TEST_PORT');
      expect(validator()).toBe(8080);
    });

    it('should throw when port is not an integer', () => {
      setEnv('TEST_PORT', '8080.5');
      const validator = validation.createPortValidator('TEST_PORT');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/an integer value/);
    });

    it('should throw when port is less than 1', () => {
      setEnv('TEST_PORT', '0');
      const validator = validation.createPortValidator('TEST_PORT');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a number greater than or equal to 1/);
    });

    it('should throw when port is greater than 65535', () => {
      setEnv('TEST_PORT', '70000');
      const validator = validation.createPortValidator('TEST_PORT');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a number less than or equal to 65535/);
    });
  });

  describe('createHostValidator', () => {
    it('should validate a hostname', () => {
      setEnv('TEST_HOST', 'example.com');
      const validator = validation.createHostValidator('TEST_HOST');
      expect(validator()).toBe('example.com');
    });

    it('should validate an IP address', () => {
      setEnv('TEST_HOST', '127.0.0.1');
      const validator = validation.createHostValidator('TEST_HOST');
      expect(validator()).toBe('127.0.0.1');
    });

    it('should throw when host is invalid', () => {
      setEnv('TEST_HOST', 'invalid host!');
      const validator = validation.createHostValidator('TEST_HOST');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Does not match the required pattern/);
    });
  });

  describe('createDatabaseUrlValidator', () => {
    it('should validate a PostgreSQL database URL', () => {
      setEnv('TEST_DB_URL', 'postgresql://user:pass@localhost:5432/db');
      const validator = validation.createDatabaseUrlValidator('TEST_DB_URL');
      expect(validator().toString()).toBe('postgresql://user:pass@localhost:5432/db');
    });

    it('should validate a MySQL database URL', () => {
      setEnv('TEST_DB_URL', 'mysql://user:pass@localhost:3306/db');
      const validator = validation.createDatabaseUrlValidator('TEST_DB_URL');
      expect(validator().toString()).toBe('mysql://user:pass@localhost:3306/db');
    });

    it('should validate a MongoDB database URL', () => {
      setEnv('TEST_DB_URL', 'mongodb://user:pass@localhost:27017/db');
      const validator = validation.createDatabaseUrlValidator('TEST_DB_URL');
      expect(validator().toString()).toBe('mongodb://user:pass@localhost:27017/db');
    });

    it('should throw when protocol is not supported', () => {
      setEnv('TEST_DB_URL', 'unsupported://user:pass@localhost:5432/db');
      const validator = validation.createDatabaseUrlValidator('TEST_DB_URL');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid URL/);
    });

    it('should validate with specific protocols', () => {
      setEnv('TEST_DB_URL', 'postgresql://user:pass@localhost:5432/db');
      const validator = validation.createDatabaseUrlValidator('TEST_DB_URL', { protocols: ['postgresql'] });
      expect(validator().toString()).toBe('postgresql://user:pass@localhost:5432/db');
    });

    it('should throw when protocol is not in specified list', () => {
      setEnv('TEST_DB_URL', 'mysql://user:pass@localhost:3306/db');
      const validator = validation.createDatabaseUrlValidator('TEST_DB_URL', { protocols: ['postgresql'] });
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid URL/);
    });
  });

  describe('createApiKeyValidator', () => {
    it('should validate an API key with default options', () => {
      setEnv('TEST_API_KEY', 'abcdef1234567890abcdef1234567890');
      const validator = validation.createApiKeyValidator('TEST_API_KEY');
      expect(validator()).toBe('abcdef1234567890abcdef1234567890');
    });

    it('should throw when API key is too short', () => {
      setEnv('TEST_API_KEY', 'short');
      const validator = validation.createApiKeyValidator('TEST_API_KEY');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Should be at least 16 characters/);
    });

    it('should validate an API key with custom minLength', () => {
      setEnv('TEST_API_KEY', 'abcdef1234');
      const validator = validation.createApiKeyValidator('TEST_API_KEY', { minLength: 10 });
      expect(validator()).toBe('abcdef1234');
    });

    it('should validate an API key with pattern', () => {
      setEnv('TEST_API_KEY', 'abcdef1234567890');
      const validator = validation.createApiKeyValidator('TEST_API_KEY', { pattern: /^[a-f0-9]+$/ });
      expect(validator()).toBe('abcdef1234567890');
    });

    it('should throw when API key does not match pattern', () => {
      setEnv('TEST_API_KEY', 'ABCDEF1234567890');
      const validator = validation.createApiKeyValidator('TEST_API_KEY', { pattern: /^[a-f0-9]+$/ });
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Does not match the required pattern/);
    });
  });

  describe('createJwtSecretValidator', () => {
    it('should validate a JWT secret', () => {
      setEnv('TEST_JWT_SECRET', 'abcdef1234567890abcdef1234567890abcdef1234567890');
      const validator = validation.createJwtSecretValidator('TEST_JWT_SECRET');
      expect(validator()).toBe('abcdef1234567890abcdef1234567890abcdef1234567890');
    });

    it('should throw when JWT secret is too short', () => {
      setEnv('TEST_JWT_SECRET', 'short');
      const validator = validation.createJwtSecretValidator('TEST_JWT_SECRET');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Should be at least 32 characters/);
    });
  });

  describe('createEnvironmentValidator', () => {
    it('should validate development environment', () => {
      setEnv('TEST_NODE_ENV', 'development');
      const validator = validation.createEnvironmentValidator('TEST_NODE_ENV');
      expect(validator()).toBe('development');
    });

    it('should validate test environment', () => {
      setEnv('TEST_NODE_ENV', 'test');
      const validator = validation.createEnvironmentValidator('TEST_NODE_ENV');
      expect(validator()).toBe('test');
    });

    it('should validate staging environment', () => {
      setEnv('TEST_NODE_ENV', 'staging');
      const validator = validation.createEnvironmentValidator('TEST_NODE_ENV');
      expect(validator()).toBe('staging');
    });

    it('should validate production environment', () => {
      setEnv('TEST_NODE_ENV', 'production');
      const validator = validation.createEnvironmentValidator('TEST_NODE_ENV');
      expect(validator()).toBe('production');
    });

    it('should throw when environment is invalid', () => {
      setEnv('TEST_NODE_ENV', 'invalid');
      const validator = validation.createEnvironmentValidator('TEST_NODE_ENV');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/one of: development, test, staging, production/);
    });
  });

  describe('createRedisUrlValidator', () => {
    it('should validate a Redis URL', () => {
      setEnv('TEST_REDIS_URL', 'redis://localhost:6379');
      const validator = validation.createRedisUrlValidator('TEST_REDIS_URL');
      expect(validator().toString()).toBe('redis://localhost:6379/');
    });

    it('should validate a Redis URL with password', () => {
      setEnv('TEST_REDIS_URL', 'redis://:password@localhost:6379');
      const validator = validation.createRedisUrlValidator('TEST_REDIS_URL');
      expect(validator().toString()).toBe('redis://:password@localhost:6379/');
    });

    it('should throw when protocol is not redis', () => {
      setEnv('TEST_REDIS_URL', 'http://localhost:6379');
      const validator = validation.createRedisUrlValidator('TEST_REDIS_URL');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid URL/);
    });
  });

  describe('createKafkaBrokersValidator', () => {
    it('should validate a list of Kafka brokers', () => {
      setEnv('TEST_KAFKA_BROKERS', 'localhost:9092,kafka:9092');
      const validator = validation.createKafkaBrokersValidator('TEST_KAFKA_BROKERS');
      expect(validator()).toEqual(['localhost:9092', 'kafka:9092']);
    });

    it('should throw when list is empty', () => {
      setEnv('TEST_KAFKA_BROKERS', '');
      const validator = validation.createKafkaBrokersValidator('TEST_KAFKA_BROKERS');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a list with at least 1 items/);
    });

    it('should throw when broker format is invalid', () => {
      setEnv('TEST_KAFKA_BROKERS', 'localhost,kafka:9092');
      const validator = validation.createKafkaBrokersValidator('TEST_KAFKA_BROKERS');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a list where item at index 0/);
    });

    it('should throw when port is invalid', () => {
      setEnv('TEST_KAFKA_BROKERS', 'localhost:9092,kafka:invalid');
      const validator = validation.createKafkaBrokersValidator('TEST_KAFKA_BROKERS');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a list where item at index 1/);
    });
  });

  describe('createCorsOriginsValidator', () => {
    it('should validate a list of CORS origins', () => {
      setEnv('TEST_CORS_ORIGINS', 'https://example.com,http://localhost:3000');
      const validator = validation.createCorsOriginsValidator('TEST_CORS_ORIGINS');
      expect(validator()).toEqual(['https://example.com', 'http://localhost:3000']);
    });

    it('should validate wildcard origin', () => {
      setEnv('TEST_CORS_ORIGINS', '*');
      const validator = validation.createCorsOriginsValidator('TEST_CORS_ORIGINS');
      expect(validator()).toEqual(['*']);
    });

    it('should throw when origin is invalid', () => {
      setEnv('TEST_CORS_ORIGINS', 'https://example.com,invalid');
      const validator = validation.createCorsOriginsValidator('TEST_CORS_ORIGINS');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a list where item at index 1/);
    });
  });

  describe('createLogLevelValidator', () => {
    it('should validate debug log level', () => {
      setEnv('TEST_LOG_LEVEL', 'debug');
      const validator = validation.createLogLevelValidator('TEST_LOG_LEVEL');
      expect(validator()).toBe('debug');
    });

    it('should validate info log level', () => {
      setEnv('TEST_LOG_LEVEL', 'info');
      const validator = validation.createLogLevelValidator('TEST_LOG_LEVEL');
      expect(validator()).toBe('info');
    });

    it('should validate warn log level', () => {
      setEnv('TEST_LOG_LEVEL', 'warn');
      const validator = validation.createLogLevelValidator('TEST_LOG_LEVEL');
      expect(validator()).toBe('warn');
    });

    it('should validate error log level', () => {
      setEnv('TEST_LOG_LEVEL', 'error');
      const validator = validation.createLogLevelValidator('TEST_LOG_LEVEL');
      expect(validator()).toBe('error');
    });

    it('should validate fatal log level', () => {
      setEnv('TEST_LOG_LEVEL', 'fatal');
      const validator = validation.createLogLevelValidator('TEST_LOG_LEVEL');
      expect(validator()).toBe('fatal');
    });

    it('should validate case-insensitive log levels', () => {
      setEnv('TEST_LOG_LEVEL', 'DEBUG');
      const validator = validation.createLogLevelValidator('TEST_LOG_LEVEL');
      expect(validator()).toBe('debug');
    });

    it('should throw when log level is invalid', () => {
      setEnv('TEST_LOG_LEVEL', 'trace');
      const validator = validation.createLogLevelValidator('TEST_LOG_LEVEL');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/one of: debug, info, warn, error, fatal/);
    });
  });

  describe('createFeatureFlagsValidator', () => {
    it('should validate feature flags', () => {
      setEnv('TEST_FEATURE_FLAGS', '{"feature1":true,"feature2":false}');
      const validator = validation.createFeatureFlagsValidator('TEST_FEATURE_FLAGS');
      expect(validator()).toEqual({ feature1: true, feature2: false });
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_FEATURE_FLAGS', undefined);
      const validator = validation.createFeatureFlagsValidator('TEST_FEATURE_FLAGS');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a JSON object with boolean values/);
    });

    it('should throw when JSON is invalid', () => {
      setEnv('TEST_FEATURE_FLAGS', '{invalid-json}');
      const validator = validation.createFeatureFlagsValidator('TEST_FEATURE_FLAGS');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid JSON object/);
    });

    it('should throw when value is not an object', () => {
      setEnv('TEST_FEATURE_FLAGS', '"not-an-object"');
      const validator = validation.createFeatureFlagsValidator('TEST_FEATURE_FLAGS');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a JSON object with boolean values/);
    });

    it('should throw when a value is not a boolean', () => {
      setEnv('TEST_FEATURE_FLAGS', '{"feature1":true,"feature2":"not-a-boolean"}');
      const validator = validation.createFeatureFlagsValidator('TEST_FEATURE_FLAGS');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a JSON object with boolean values \(feature2 is not a boolean\)/);
    });
  });

  describe('createJourneyConfigValidator', () => {
    it('should validate journey configuration', () => {
      setEnv('TEST_JOURNEY_CONFIG', JSON.stringify({
        health: { enabled: true, features: ['metrics', 'goals'] },
        care: { enabled: false },
        plan: { enabled: true, features: ['claims'] }
      }));
      const validator = validation.createJourneyConfigValidator('TEST_JOURNEY_CONFIG');
      expect(validator()).toEqual({
        health: { enabled: true, features: ['metrics', 'goals'] },
        care: { enabled: false },
        plan: { enabled: true, features: ['claims'] }
      });
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_JOURNEY_CONFIG', undefined);
      const validator = validation.createJourneyConfigValidator('TEST_JOURNEY_CONFIG');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid JSON string/);
    });

    it('should throw when JSON is invalid', () => {
      setEnv('TEST_JOURNEY_CONFIG', '{invalid-json}');
      const validator = validation.createJourneyConfigValidator('TEST_JOURNEY_CONFIG');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid JSON string/);
    });

    it('should throw when missing required journey', () => {
      setEnv('TEST_JOURNEY_CONFIG', JSON.stringify({
        health: { enabled: true },
        care: { enabled: false }
        // Missing plan journey
      }));
      const validator = validation.createJourneyConfigValidator('TEST_JOURNEY_CONFIG');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Required at plan/);
    });

    it('should throw when journey enabled is not a boolean', () => {
      setEnv('TEST_JOURNEY_CONFIG', JSON.stringify({
        health: { enabled: 'true' }, // String instead of boolean
        care: { enabled: false },
        plan: { enabled: true }
      }));
      const validator = validation.createJourneyConfigValidator('TEST_JOURNEY_CONFIG');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Expected boolean, received string at health.enabled/);
    });

    it('should throw when features is not an array', () => {
      setEnv('TEST_JOURNEY_CONFIG', JSON.stringify({
        health: { enabled: true, features: 'metrics' }, // String instead of array
        care: { enabled: false },
        plan: { enabled: true }
      }));
      const validator = validation.createJourneyConfigValidator('TEST_JOURNEY_CONFIG');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Expected array, received string at health.features/);
    });
  });

  describe('createDbPoolConfigValidator', () => {
    it('should validate database pool configuration', () => {
      setEnv('TEST_DB_POOL_CONFIG', JSON.stringify({
        min: 5,
        max: 20,
        idle: 10000
      }));
      const validator = validation.createDbPoolConfigValidator('TEST_DB_POOL_CONFIG');
      expect(validator()).toEqual({
        min: 5,
        max: 20,
        idle: 10000
      });
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_DB_POOL_CONFIG', undefined);
      const validator = validation.createDbPoolConfigValidator('TEST_DB_POOL_CONFIG');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid JSON string/);
    });

    it('should throw when JSON is invalid', () => {
      setEnv('TEST_DB_POOL_CONFIG', '{invalid-json}');
      const validator = validation.createDbPoolConfigValidator('TEST_DB_POOL_CONFIG');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid JSON string/);
    });

    it('should throw when min is missing', () => {
      setEnv('TEST_DB_POOL_CONFIG', JSON.stringify({
        max: 20,
        idle: 10000
      }));
      const validator = validation.createDbPoolConfigValidator('TEST_DB_POOL_CONFIG');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Required at min/);
    });

    it('should throw when min is not a positive integer', () => {
      setEnv('TEST_DB_POOL_CONFIG', JSON.stringify({
        min: 0, // Should be at least 1
        max: 20,
        idle: 10000
      }));
      const validator = validation.createDbPoolConfigValidator('TEST_DB_POOL_CONFIG');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Number must be greater than or equal to 1 at min/);
    });

    it('should throw when min is greater than max', () => {
      setEnv('TEST_DB_POOL_CONFIG', JSON.stringify({
        min: 30,
        max: 20,
        idle: 10000
      }));
      const validator = validation.createDbPoolConfigValidator('TEST_DB_POOL_CONFIG');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/min must be less than or equal to max at min/);
    });

    it('should throw when idle is not a positive integer', () => {
      setEnv('TEST_DB_POOL_CONFIG', JSON.stringify({
        min: 5,
        max: 20,
        idle: 500 // Should be at least 1000
      }));
      const validator = validation.createDbPoolConfigValidator('TEST_DB_POOL_CONFIG');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Number must be greater than or equal to 1000 at idle/);
    });
  });

  describe('createRetryPolicyValidator', () => {
    it('should validate retry policy configuration', () => {
      setEnv('TEST_RETRY_POLICY', JSON.stringify({
        attempts: 3,
        delay: 1000,
        backoff: 2,
        maxDelay: 10000
      }));
      const validator = validation.createRetryPolicyValidator('TEST_RETRY_POLICY');
      expect(validator()).toEqual({
        attempts: 3,
        delay: 1000,
        backoff: 2,
        maxDelay: 10000
      });
    });

    it('should validate retry policy without optional maxDelay', () => {
      setEnv('TEST_RETRY_POLICY', JSON.stringify({
        attempts: 3,
        delay: 1000,
        backoff: 2
      }));
      const validator = validation.createRetryPolicyValidator('TEST_RETRY_POLICY');
      expect(validator()).toEqual({
        attempts: 3,
        delay: 1000,
        backoff: 2
      });
    });

    it('should throw when variable is undefined', () => {
      setEnv('TEST_RETRY_POLICY', undefined);
      const validator = validation.createRetryPolicyValidator('TEST_RETRY_POLICY');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid JSON string/);
    });

    it('should throw when JSON is invalid', () => {
      setEnv('TEST_RETRY_POLICY', '{invalid-json}');
      const validator = validation.createRetryPolicyValidator('TEST_RETRY_POLICY');
      expect(() => validator()).toThrow(InvalidEnvironmentVariableError);
      expect(() => validator()).toThrow(/a valid JSON string/);
    });

    it('should throw when attempts is missing', () => {
      setEnv('TEST_RETRY_POLICY', JSON.stringify({
        delay: 1000,
        backoff: 2
      }));
      const validator = validation.createRetryPolicyValidator('TEST_RETRY_POLICY');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Required at attempts/);
    });

    it('should throw when attempts is not a positive integer', () => {
      setEnv('TEST_RETRY_POLICY', JSON.stringify({
        attempts: 0, // Should be at least 1
        delay: 1000,
        backoff: 2
      }));
      const validator = validation.createRetryPolicyValidator('TEST_RETRY_POLICY');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Number must be greater than or equal to 1 at attempts/);
    });

    it('should throw when backoff is not a positive number', () => {
      setEnv('TEST_RETRY_POLICY', JSON.stringify({
        attempts: 3,
        delay: 1000,
        backoff: 0 // Should be at least 1
      }));
      const validator = validation.createRetryPolicyValidator('TEST_RETRY_POLICY');
      expect(() => validator()).toThrow(ValidationEnvironmentVariableError);
      expect(() => validator()).toThrow(/Number must be greater than or equal to 1 at backoff/);
    });
  });

  describe('validateEnvironmentGroup', () => {
    it('should validate a group of environment variables', () => {
      setEnv('TEST_GROUP_1', 'value1');
      setEnv('TEST_GROUP_2', '42');
      setEnv('TEST_GROUP_3', 'true');

      const result = validation.validateEnvironmentGroup({
        TEST_GROUP_1: validation.createStringValidator('TEST_GROUP_1'),
        TEST_GROUP_2: validation.createNumberValidator('TEST_GROUP_2'),
        TEST_GROUP_3: validation.createBooleanValidator('TEST_GROUP_3')
      });

      expect(result).toEqual({
        TEST_GROUP_1: 'value1',
        TEST_GROUP_2: 42,
        TEST_GROUP_3: true
      });
    });

    it('should throw BatchEnvironmentValidationError when any validation fails', () => {
      setEnv('TEST_GROUP_1', 'value1');
      setEnv('TEST_GROUP_2', 'not-a-number');
      setEnv('TEST_GROUP_3', 'true');

      expect(() => validation.validateEnvironmentGroup({
        TEST_GROUP_1: validation.createStringValidator('TEST_GROUP_1'),
        TEST_GROUP_2: validation.createNumberValidator('TEST_GROUP_2'),
        TEST_GROUP_3: validation.createBooleanValidator('TEST_GROUP_3')
      })).toThrow(BatchEnvironmentValidationError);
    });

    it('should include context message in error', () => {
      setEnv('TEST_GROUP_1', 'value1');
      setEnv('TEST_GROUP_2', 'not-a-number');
      setEnv('TEST_GROUP_3', 'true');

      try {
        validation.validateEnvironmentGroup({
          TEST_GROUP_1: validation.createStringValidator('TEST_GROUP_1'),
          TEST_GROUP_2: validation.createNumberValidator('TEST_GROUP_2'),
          TEST_GROUP_3: validation.createBooleanValidator('TEST_GROUP_3')
        }, 'Test Group');
        fail('Expected BatchEnvironmentValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BatchEnvironmentValidationError);
        expect((error as BatchEnvironmentValidationError).message).toContain('Test Group');
      }
    });
  });

  describe('validateServiceEnvironment', () => {
    it('should validate service environment variables', () => {
      setEnv('TEST_PORT', '8080');
      setEnv('TEST_HOST', 'localhost');
      setEnv('TEST_NODE_ENV', 'development');

      const result = validation.validateServiceEnvironment({
        PORT: validation.createPortValidator('TEST_PORT'),
        HOST: validation.createHostValidator('TEST_HOST'),
        NODE_ENV: validation.createEnvironmentValidator('TEST_NODE_ENV')
      });

      expect(result).toEqual({
        PORT: 8080,
        HOST: 'localhost',
        NODE_ENV: 'development'
      });
    });

    it('should throw Error with detailed message when validation fails', () => {
      setEnv('TEST_PORT', 'not-a-port');
      setEnv('TEST_HOST', 'localhost');
      setEnv('TEST_NODE_ENV', 'development');

      expect(() => validation.validateServiceEnvironment({
        PORT: validation.createPortValidator('TEST_PORT'),
        HOST: validation.createHostValidator('TEST_HOST'),
        NODE_ENV: validation.createEnvironmentValidator('TEST_NODE_ENV')
      })).toThrow(/Service cannot start due to 1 environment configuration errors/);
    });
  });

  describe('validateJourneyEnvironment', () => {
    it('should validate journey environment variables', () => {
      setEnv('HEALTH_API_KEY', 'abcdef1234567890abcdef1234567890');
      setEnv('HEALTH_SERVICE_URL', 'https://health-service.example.com');
      setEnv('HEALTH_FEATURES', '{"metrics":true,"goals":false}');

      const result = validation.validateJourneyEnvironment('health', {
        API_KEY: validation.createApiKeyValidator('HEALTH_API_KEY'),
        SERVICE_URL: validation.createUrlValidator('HEALTH_SERVICE_URL'),
        FEATURES: validation.createFeatureFlagsValidator('HEALTH_FEATURES')
      });

      expect(result).toEqual({
        API_KEY: 'abcdef1234567890abcdef1234567890',
        SERVICE_URL: new URL('https://health-service.example.com'),
        FEATURES: { metrics: true, goals: false }
      });
    });

    it('should throw Error with journey-specific message when validation fails', () => {
      setEnv('HEALTH_API_KEY', 'too-short');
      setEnv('HEALTH_SERVICE_URL', 'https://health-service.example.com');
      setEnv('HEALTH_FEATURES', '{"metrics":true,"goals":false}');

      expect(() => validation.validateJourneyEnvironment('health', {
        API_KEY: validation.createApiKeyValidator('HEALTH_API_KEY'),
        SERVICE_URL: validation.createUrlValidator('HEALTH_SERVICE_URL'),
        FEATURES: validation.createFeatureFlagsValidator('HEALTH_FEATURES')
      })).toThrow(/health journey cannot start due to 1 environment configuration errors/);
    });
  });
});
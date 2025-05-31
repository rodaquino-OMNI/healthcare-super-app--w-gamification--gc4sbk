import { afterEach, beforeEach, describe, expect, it, jest } from 'jest';
import {
  getEnv,
  getRequiredEnv,
  getOptionalEnv,
  clearEnvCache,
} from '../../../src/env/config';
import { MissingEnvironmentVariableError } from '../../../src/env/error';

describe('Environment Configuration', () => {
  // Store original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Clear the cache before each test
    clearEnvCache();
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
    // Clear the cache after each test
    clearEnvCache();
  });

  describe('getEnv', () => {
    it('should retrieve environment variable as string by default', () => {
      // Arrange
      process.env.TEST_VAR = 'test-value';

      // Act
      const result = getEnv('TEST_VAR');

      // Assert
      expect(result).toBe('test-value');
    });

    it('should convert environment variable to number when specified', () => {
      // Arrange
      process.env.TEST_NUMBER = '42';

      // Act
      const result = getEnv('TEST_NUMBER', { type: 'number' });

      // Assert
      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });

    it('should convert environment variable to boolean when specified', () => {
      // Arrange
      process.env.TEST_BOOL_TRUE = 'true';
      process.env.TEST_BOOL_FALSE = 'false';

      // Act
      const resultTrue = getEnv('TEST_BOOL_TRUE', { type: 'boolean' });
      const resultFalse = getEnv('TEST_BOOL_FALSE', { type: 'boolean' });

      // Assert
      expect(resultTrue).toBe(true);
      expect(resultFalse).toBe(false);
      expect(typeof resultTrue).toBe('boolean');
      expect(typeof resultFalse).toBe('boolean');
    });

    it('should convert environment variable to array when specified', () => {
      // Arrange
      process.env.TEST_ARRAY = 'item1,item2,item3';

      // Act
      const result = getEnv('TEST_ARRAY', { type: 'array' });

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('should convert environment variable to JSON when specified', () => {
      // Arrange
      process.env.TEST_JSON = '{"key":"value","number":42}';

      // Act
      const result = getEnv('TEST_JSON', { type: 'json' });

      // Assert
      expect(typeof result).toBe('object');
      expect(result).toEqual({ key: 'value', number: 42 });
    });

    it('should use default value when environment variable is not set', () => {
      // Act
      const result = getEnv('NONEXISTENT_VAR', { defaultValue: 'default-value' });

      // Assert
      expect(result).toBe('default-value');
    });

    it('should use default value with type conversion when environment variable is not set', () => {
      // Act
      const result = getEnv('NONEXISTENT_NUMBER', { 
        type: 'number', 
        defaultValue: 100 
      });

      // Assert
      expect(result).toBe(100);
      expect(typeof result).toBe('number');
    });

    it('should throw error when environment variable is not set and no default is provided', () => {
      // Act & Assert
      expect(() => getEnv('NONEXISTENT_VAR')).toThrow(MissingEnvironmentVariableError);
      expect(() => getEnv('NONEXISTENT_VAR')).toThrow('Environment variable NONEXISTENT_VAR is required but not set');
    });

    it('should cache environment variable values for performance', () => {
      // Arrange
      process.env.CACHED_VAR = 'initial-value';
      const spy = jest.spyOn(process, 'env', 'get');

      // Act - First call should access process.env
      const result1 = getEnv('CACHED_VAR');
      
      // Change the environment variable
      process.env.CACHED_VAR = 'changed-value';
      
      // Act - Second call should use cached value
      const result2 = getEnv('CACHED_VAR');

      // Assert
      expect(result1).toBe('initial-value');
      expect(result2).toBe('initial-value'); // Should still be initial value due to caching
      expect(spy).toHaveBeenCalledTimes(1); // process.env should only be accessed once
    });

    it('should refresh cache when clearEnvCache is called', () => {
      // Arrange
      process.env.CACHED_VAR = 'initial-value';
      
      // Act - First call
      const result1 = getEnv('CACHED_VAR');
      
      // Change the environment variable
      process.env.CACHED_VAR = 'changed-value';
      
      // Clear the cache
      clearEnvCache();
      
      // Act - Second call after cache clear
      const result2 = getEnv('CACHED_VAR');

      // Assert
      expect(result1).toBe('initial-value');
      expect(result2).toBe('changed-value'); // Should get the new value after cache clear
    });

    it('should support namespaced environment variables', () => {
      // Arrange
      process.env.HEALTH_SERVICE_API_URL = 'https://health-api.example.com';
      process.env.CARE_SERVICE_API_URL = 'https://care-api.example.com';

      // Act
      const healthUrl = getEnv('API_URL', { namespace: 'HEALTH_SERVICE' });
      const careUrl = getEnv('API_URL', { namespace: 'CARE_SERVICE' });

      // Assert
      expect(healthUrl).toBe('https://health-api.example.com');
      expect(careUrl).toBe('https://care-api.example.com');
    });
  });

  describe('getRequiredEnv', () => {
    it('should retrieve required environment variable', () => {
      // Arrange
      process.env.REQUIRED_VAR = 'required-value';

      // Act
      const result = getRequiredEnv('REQUIRED_VAR');

      // Assert
      expect(result).toBe('required-value');
    });

    it('should throw error when required environment variable is not set', () => {
      // Act & Assert
      expect(() => getRequiredEnv('NONEXISTENT_REQUIRED_VAR')).toThrow(MissingEnvironmentVariableError);
      expect(() => getRequiredEnv('NONEXISTENT_REQUIRED_VAR')).toThrow(
        'Environment variable NONEXISTENT_REQUIRED_VAR is required but not set'
      );
    });

    it('should convert required environment variable to specified type', () => {
      // Arrange
      process.env.REQUIRED_NUMBER = '42';

      // Act
      const result = getRequiredEnv('REQUIRED_NUMBER', { type: 'number' });

      // Assert
      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });

    it('should support namespaced required environment variables', () => {
      // Arrange
      process.env.PLAN_SERVICE_API_KEY = 'plan-service-key';

      // Act
      const result = getRequiredEnv('API_KEY', { namespace: 'PLAN_SERVICE' });

      // Assert
      expect(result).toBe('plan-service-key');
    });
  });

  describe('getOptionalEnv', () => {
    it('should retrieve optional environment variable when set', () => {
      // Arrange
      process.env.OPTIONAL_VAR = 'optional-value';

      // Act
      const result = getOptionalEnv('OPTIONAL_VAR');

      // Assert
      expect(result).toBe('optional-value');
    });

    it('should return undefined when optional environment variable is not set', () => {
      // Act
      const result = getOptionalEnv('NONEXISTENT_OPTIONAL_VAR');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should use default value when optional environment variable is not set', () => {
      // Act
      const result = getOptionalEnv('NONEXISTENT_OPTIONAL_VAR', { defaultValue: 'default-optional' });

      // Assert
      expect(result).toBe('default-optional');
    });

    it('should convert optional environment variable to specified type when set', () => {
      // Arrange
      process.env.OPTIONAL_NUMBER = '42';

      // Act
      const result = getOptionalEnv('OPTIONAL_NUMBER', { type: 'number' });

      // Assert
      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });

    it('should convert default value to specified type when optional environment variable is not set', () => {
      // Act
      const result = getOptionalEnv('NONEXISTENT_OPTIONAL_NUMBER', { 
        type: 'number', 
        defaultValue: 100 
      });

      // Assert
      expect(result).toBe(100);
      expect(typeof result).toBe('number');
    });

    it('should support namespaced optional environment variables', () => {
      // Arrange
      process.env.NOTIFICATION_SERVICE_DEBUG_MODE = 'true';

      // Act
      const result = getOptionalEnv('DEBUG_MODE', { 
        namespace: 'NOTIFICATION_SERVICE',
        type: 'boolean'
      });

      // Assert
      expect(result).toBe(true);
      expect(typeof result).toBe('boolean');
    });
  });
});
import {
  getEnv,
  getRequiredEnv,
  getOptionalEnv,
  clearEnvCache,
  getNamespacedEnv,
  validateRequiredEnv,
  getBooleanEnv,
  getOptionalBooleanEnv,
  getNumberEnv,
  getOptionalNumberEnv,
  getJsonEnv,
  getOptionalJsonEnv,
  getArrayEnv,
  getOptionalArrayEnv,
  getJourneyEnv,
  getOptionalJourneyEnv,
  getFeatureFlag,
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError
} from '../../../src/env/config';

describe('Environment Variable Access Module', () => {
  // Store the original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Clear the cache to ensure tests are isolated
    clearEnvCache();
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
  });

  describe('getEnv', () => {
    it('should retrieve string environment variables', () => {
      process.env.TEST_STRING = 'test-value';
      const result = getEnv('TEST_STRING', 'string');
      expect(result).toBe('test-value');
    });

    it('should retrieve and convert number environment variables', () => {
      process.env.TEST_NUMBER = '42';
      const result = getEnv('TEST_NUMBER', 'number');
      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });

    it('should retrieve and convert boolean environment variables', () => {
      process.env.TEST_BOOL_TRUE = 'true';
      process.env.TEST_BOOL_FALSE = 'false';
      process.env.TEST_BOOL_ONE = '1';
      process.env.TEST_BOOL_ZERO = '0';

      expect(getEnv('TEST_BOOL_TRUE', 'boolean')).toBe(true);
      expect(getEnv('TEST_BOOL_FALSE', 'boolean')).toBe(false);
      expect(getEnv('TEST_BOOL_ONE', 'boolean')).toBe(true);
      expect(getEnv('TEST_BOOL_ZERO', 'boolean')).toBe(false);
    });

    it('should retrieve and parse JSON environment variables', () => {
      process.env.TEST_JSON = '{"key":"value","number":42}';
      const result = getEnv('TEST_JSON', 'json');
      expect(result).toEqual({ key: 'value', number: 42 });
    });

    it('should retrieve and parse array environment variables', () => {
      process.env.TEST_ARRAY = 'item1,item2,item3';
      const result = getEnv('TEST_ARRAY', 'array');
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('should throw MissingEnvironmentVariableError for undefined variables', () => {
      expect(() => getEnv('UNDEFINED_VAR', 'string')).toThrow(MissingEnvironmentVariableError);
      expect(() => getEnv('UNDEFINED_VAR', 'string')).toThrow(
        "Required environment variable 'UNDEFINED_VAR' is missing"
      );
    });

    it('should throw InvalidEnvironmentVariableError for invalid number format', () => {
      process.env.INVALID_NUMBER = 'not-a-number';
      expect(() => getEnv('INVALID_NUMBER', 'number')).toThrow(InvalidEnvironmentVariableError);
      expect(() => getEnv('INVALID_NUMBER', 'number')).toThrow(
        "Environment variable 'INVALID_NUMBER' has invalid format. Expected type: number"
      );
    });

    it('should throw InvalidEnvironmentVariableError for invalid boolean format', () => {
      process.env.INVALID_BOOLEAN = 'not-a-boolean';
      expect(() => getEnv('INVALID_BOOLEAN', 'boolean')).toThrow(InvalidEnvironmentVariableError);
    });

    it('should throw InvalidEnvironmentVariableError for invalid JSON format', () => {
      process.env.INVALID_JSON = '{not-valid-json}';
      expect(() => getEnv('INVALID_JSON', 'json')).toThrow(InvalidEnvironmentVariableError);
    });
  });

  describe('getRequiredEnv', () => {
    it('should be an alias for getEnv', () => {
      process.env.REQUIRED_VAR = 'required-value';
      const result = getRequiredEnv('REQUIRED_VAR', 'string');
      expect(result).toBe('required-value');
    });

    it('should throw MissingEnvironmentVariableError for undefined variables', () => {
      expect(() => getRequiredEnv('UNDEFINED_VAR', 'string')).toThrow(MissingEnvironmentVariableError);
    });
  });

  describe('getOptionalEnv', () => {
    it('should return the environment variable value when defined', () => {
      process.env.OPTIONAL_VAR = 'optional-value';
      const result = getOptionalEnv('OPTIONAL_VAR', 'string', 'default-value');
      expect(result).toBe('optional-value');
    });

    it('should return the default value when environment variable is undefined', () => {
      const result = getOptionalEnv('UNDEFINED_VAR', 'string', 'default-value');
      expect(result).toBe('default-value');
    });

    it('should return the default value with correct type', () => {
      const numberResult = getOptionalEnv('UNDEFINED_NUMBER', 'number', 42);
      expect(numberResult).toBe(42);
      expect(typeof numberResult).toBe('number');

      const boolResult = getOptionalEnv('UNDEFINED_BOOL', 'boolean', true);
      expect(boolResult).toBe(true);
      expect(typeof boolResult).toBe('boolean');

      const jsonResult = getOptionalEnv('UNDEFINED_JSON', 'json', { default: true });
      expect(jsonResult).toEqual({ default: true });

      const arrayResult = getOptionalEnv('UNDEFINED_ARRAY', 'array', ['default']);
      expect(arrayResult).toEqual(['default']);
    });

    it('should throw InvalidEnvironmentVariableError for invalid format', () => {
      process.env.INVALID_NUMBER = 'not-a-number';
      expect(() => getOptionalEnv('INVALID_NUMBER', 'number', 42)).toThrow(InvalidEnvironmentVariableError);
    });
  });

  describe('Caching behavior', () => {
    it('should cache values by default', () => {
      process.env.CACHED_VAR = 'initial-value';
      const firstResult = getEnv('CACHED_VAR', 'string');
      expect(firstResult).toBe('initial-value');

      // Change the environment variable
      process.env.CACHED_VAR = 'changed-value';
      
      // Should still return the cached value
      const secondResult = getEnv('CACHED_VAR', 'string');
      expect(secondResult).toBe('initial-value');
    });

    it('should not cache values when cache option is false', () => {
      process.env.UNCACHED_VAR = 'initial-value';
      const firstResult = getEnv('UNCACHED_VAR', 'string', { cache: false });
      expect(firstResult).toBe('initial-value');

      // Change the environment variable
      process.env.UNCACHED_VAR = 'changed-value';
      
      // Should return the new value since caching is disabled
      const secondResult = getEnv('UNCACHED_VAR', 'string', { cache: false });
      expect(secondResult).toBe('changed-value');
    });

    it('should clear specific cache entries with clearEnvCache', () => {
      process.env.CACHE_TEST_1 = 'value1';
      process.env.CACHE_TEST_2 = 'value2';
      
      // Cache both values
      getEnv('CACHE_TEST_1', 'string');
      getEnv('CACHE_TEST_2', 'string');
      
      // Change both environment variables
      process.env.CACHE_TEST_1 = 'new-value1';
      process.env.CACHE_TEST_2 = 'new-value2';
      
      // Clear only the first cache entry
      clearEnvCache('CACHE_TEST_1');
      
      // First value should be updated, second should still be cached
      expect(getEnv('CACHE_TEST_1', 'string')).toBe('new-value1');
      expect(getEnv('CACHE_TEST_2', 'string')).toBe('value2');
    });

    it('should clear all cache entries with clearEnvCache()', () => {
      process.env.CACHE_TEST_1 = 'value1';
      process.env.CACHE_TEST_2 = 'value2';
      
      // Cache both values
      getEnv('CACHE_TEST_1', 'string');
      getEnv('CACHE_TEST_2', 'string');
      
      // Change both environment variables
      process.env.CACHE_TEST_1 = 'new-value1';
      process.env.CACHE_TEST_2 = 'new-value2';
      
      // Clear all cache entries
      clearEnvCache();
      
      // Both values should be updated
      expect(getEnv('CACHE_TEST_1', 'string')).toBe('new-value1');
      expect(getEnv('CACHE_TEST_2', 'string')).toBe('new-value2');
    });

    it('should cache default values for optional environment variables', () => {
      const firstResult = getOptionalEnv('UNDEFINED_VAR', 'string', 'default-value');
      expect(firstResult).toBe('default-value');
      
      // Define the environment variable after first access
      process.env.UNDEFINED_VAR = 'actual-value';
      
      // Should still return the cached default value
      const secondResult = getOptionalEnv('UNDEFINED_VAR', 'string', 'default-value');
      expect(secondResult).toBe('default-value');
    });
  });

  describe('Namespace support', () => {
    it('should retrieve namespaced environment variables', () => {
      process.env.NAMESPACE_TEST_VAR = 'namespaced-value';
      const result = getEnv('TEST_VAR', 'string', { namespace: 'NAMESPACE' });
      expect(result).toBe('namespaced-value');
    });

    it('should throw MissingEnvironmentVariableError with namespace information', () => {
      expect(() => getEnv('TEST_VAR', 'string', { namespace: 'NAMESPACE' })).toThrow(
        "Required environment variable 'NAMESPACE_TEST_VAR' is missing"
      );
    });

    it('should throw InvalidEnvironmentVariableError with namespace information', () => {
      process.env.NAMESPACE_INVALID_NUMBER = 'not-a-number';
      expect(() => getEnv('INVALID_NUMBER', 'number', { namespace: 'NAMESPACE' })).toThrow(
        "Environment variable 'NAMESPACE_INVALID_NUMBER' has invalid format. Expected type: number"
      );
    });

    it('should clear namespaced cache entries', () => {
      process.env.NAMESPACE_CACHE_TEST = 'value';
      getEnv('CACHE_TEST', 'string', { namespace: 'NAMESPACE' });
      
      process.env.NAMESPACE_CACHE_TEST = 'new-value';
      clearEnvCache('CACHE_TEST', 'NAMESPACE');
      
      expect(getEnv('CACHE_TEST', 'string', { namespace: 'NAMESPACE' })).toBe('new-value');
    });

    it('should retrieve all environment variables with a namespace prefix', () => {
      process.env.TEST_NS_VAR1 = 'value1';
      process.env.TEST_NS_VAR2 = 'value2';
      process.env.OTHER_VAR = 'other-value';
      
      const result = getNamespacedEnv('TEST_NS');
      
      expect(result).toEqual({
        VAR1: 'value1',
        VAR2: 'value2'
      });
      expect(result.OTHER_VAR).toBeUndefined();
    });
  });

  describe('Journey-specific environment variables', () => {
    it('should retrieve health journey environment variables', () => {
      process.env.HEALTH_TEST_VAR = 'health-value';
      const result = getJourneyEnv('health', 'TEST_VAR', 'string');
      expect(result).toBe('health-value');
    });

    it('should retrieve care journey environment variables', () => {
      process.env.CARE_TEST_VAR = 'care-value';
      const result = getJourneyEnv('care', 'TEST_VAR', 'string');
      expect(result).toBe('care-value');
    });

    it('should retrieve plan journey environment variables', () => {
      process.env.PLAN_TEST_VAR = 'plan-value';
      const result = getJourneyEnv('plan', 'TEST_VAR', 'string');
      expect(result).toBe('plan-value');
    });

    it('should retrieve optional journey environment variables with default values', () => {
      const result = getOptionalJourneyEnv('health', 'UNDEFINED_VAR', 'string', 'default-value');
      expect(result).toBe('default-value');
      
      process.env.HEALTH_DEFINED_VAR = 'health-value';
      const definedResult = getOptionalJourneyEnv('health', 'DEFINED_VAR', 'string', 'default-value');
      expect(definedResult).toBe('health-value');
    });
  });

  describe('Feature flags', () => {
    it('should retrieve feature flags with FF_ prefix', () => {
      process.env.FF_TEST_FEATURE = 'true';
      const result = getFeatureFlag('TEST_FEATURE');
      expect(result).toBe(true);
    });

    it('should return default value for undefined feature flags', () => {
      const result = getFeatureFlag('UNDEFINED_FEATURE');
      expect(result).toBe(false);
      
      const customDefault = getFeatureFlag('UNDEFINED_FEATURE', true);
      expect(customDefault).toBe(true);
    });
  });

  describe('Convenience wrappers', () => {
    it('should retrieve boolean environment variables with getBooleanEnv', () => {
      process.env.BOOL_VAR = 'true';
      const result = getBooleanEnv('BOOL_VAR');
      expect(result).toBe(true);
    });

    it('should retrieve optional boolean environment variables with getOptionalBooleanEnv', () => {
      const result = getOptionalBooleanEnv('UNDEFINED_BOOL', false);
      expect(result).toBe(false);
    });

    it('should retrieve number environment variables with getNumberEnv', () => {
      process.env.NUMBER_VAR = '42';
      const result = getNumberEnv('NUMBER_VAR');
      expect(result).toBe(42);
    });

    it('should retrieve optional number environment variables with getOptionalNumberEnv', () => {
      const result = getOptionalNumberEnv('UNDEFINED_NUMBER', 42);
      expect(result).toBe(42);
    });

    it('should retrieve JSON environment variables with getJsonEnv', () => {
      process.env.JSON_VAR = '{"key":"value"}';
      const result = getJsonEnv('JSON_VAR');
      expect(result).toEqual({ key: 'value' });
    });

    it('should retrieve optional JSON environment variables with getOptionalJsonEnv', () => {
      const result = getOptionalJsonEnv('UNDEFINED_JSON', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should retrieve array environment variables with getArrayEnv', () => {
      process.env.ARRAY_VAR = 'item1,item2,item3';
      const result = getArrayEnv('ARRAY_VAR');
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('should retrieve optional array environment variables with getOptionalArrayEnv', () => {
      const result = getOptionalArrayEnv('UNDEFINED_ARRAY', ['default']);
      expect(result).toEqual(['default']);
    });
  });

  describe('validateRequiredEnv', () => {
    it('should not throw error when all required variables are present', () => {
      process.env.REQUIRED_VAR1 = 'value1';
      process.env.REQUIRED_VAR2 = 'value2';
      
      expect(() => validateRequiredEnv(['REQUIRED_VAR1', 'REQUIRED_VAR2'])).not.toThrow();
    });

    it('should throw error when any required variable is missing', () => {
      process.env.REQUIRED_VAR1 = 'value1';
      // REQUIRED_VAR2 is missing
      
      expect(() => validateRequiredEnv(['REQUIRED_VAR1', 'REQUIRED_VAR2'])).toThrow(
        'Missing required environment variables: REQUIRED_VAR2'
      );
    });

    it('should throw error with multiple missing variables', () => {
      // Both variables are missing
      
      expect(() => validateRequiredEnv(['REQUIRED_VAR1', 'REQUIRED_VAR2'])).toThrow(
        'Missing required environment variables: REQUIRED_VAR1, REQUIRED_VAR2'
      );
    });

    it('should support namespaced required variables', () => {
      process.env.NAMESPACE_REQUIRED_VAR = 'value';
      
      expect(() => validateRequiredEnv(['REQUIRED_VAR'], 'NAMESPACE')).not.toThrow();
      expect(() => validateRequiredEnv(['MISSING_VAR'], 'NAMESPACE')).toThrow(
        'Missing required environment variables: NAMESPACE_MISSING_VAR'
      );
    });
  });
});
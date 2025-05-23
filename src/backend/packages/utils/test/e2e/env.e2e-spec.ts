import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  getEnv,
  getRequiredEnv,
  getOptionalEnv,
  getBooleanEnv,
  getNumberEnv,
  getArrayEnv,
  getJsonEnv,
  getUrlEnv,
  getEnumEnv,
  getFeatureFlag,
  getJourneyEnv,
  getRequiredJourneyEnv,
  getOptionalJourneyEnv,
  getJourneyFeatureFlag,
  validateRequiredEnv,
  validateRequiredJourneyEnv,
  clearEnvCache,
  getAllEnvWithPrefix,
  getAllJourneyEnv,
} from '../../src/env';

import {
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError,
  EnvironmentVariableTypeError,
  EnvironmentVariableValidationError,
  EnvironmentVariableBatchError,
  withEnvErrorFallback,
  collectEnvErrors,
  validateEnvBatch,
} from '../../src/env/error';

import {
  JourneyType,
  createJourneyEnvConfig,
  healthEnv,
  careEnv,
  planEnv,
  sharedEnv,
} from '../../src/env/journey';

/**
 * End-to-end tests for environment configuration utilities.
 * 
 * These tests validate environment variable handling in realistic application settings,
 * including loading, type conversion, validation, and journey-specific configuration.
 */
describe('Environment Configuration Utilities (e2e)', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  // Helper to set environment variables for testing
  const setEnv = (vars: Record<string, string | undefined>) => {
    Object.entries(vars).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  };

  // Reset environment variables and cache before each test
  beforeEach(() => {
    clearEnvCache();
  });

  // Restore original environment variables after each test
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Basic Environment Variable Access', () => {
    it('should retrieve existing environment variables', () => {
      // Arrange
      setEnv({ TEST_VAR: 'test-value' });

      // Act
      const value = getEnv('TEST_VAR');

      // Assert
      expect(value).toBe('test-value');
    });

    it('should throw error for missing required environment variables', () => {
      // Arrange
      setEnv({ TEST_VAR: undefined });

      // Act & Assert
      expect(() => getRequiredEnv('TEST_VAR')).toThrow(MissingEnvironmentVariableError);
      expect(() => getRequiredEnv('TEST_VAR')).toThrow('Missing required environment variable: TEST_VAR');
    });

    it('should return default value for missing optional environment variables', () => {
      // Arrange
      setEnv({ TEST_VAR: undefined });

      // Act
      const value = getOptionalEnv('TEST_VAR', 'default-value');

      // Assert
      expect(value).toBe('default-value');
    });

    it('should cache environment variable values', () => {
      // Arrange
      setEnv({ TEST_VAR: 'initial-value' });

      // Act - Get the value first time
      const value1 = getEnv('TEST_VAR');

      // Change the environment variable
      setEnv({ TEST_VAR: 'changed-value' });

      // Get the value again - should be cached
      const value2 = getEnv('TEST_VAR');

      // Clear cache and get again
      clearEnvCache();
      const value3 = getEnv('TEST_VAR');

      // Assert
      expect(value1).toBe('initial-value');
      expect(value2).toBe('initial-value'); // Should be cached
      expect(value3).toBe('changed-value'); // Should get new value after cache clear
    });
  });

  describe('Type Conversion', () => {
    it('should convert boolean environment variables', () => {
      // Arrange
      setEnv({
        BOOL_TRUE_1: 'true',
        BOOL_TRUE_2: 'yes',
        BOOL_TRUE_3: '1',
        BOOL_TRUE_4: 'on',
        BOOL_FALSE_1: 'false',
        BOOL_FALSE_2: 'no',
        BOOL_FALSE_3: '0',
        BOOL_FALSE_4: 'off',
      });

      // Act & Assert
      expect(getBooleanEnv('BOOL_TRUE_1')).toBe(true);
      expect(getBooleanEnv('BOOL_TRUE_2')).toBe(true);
      expect(getBooleanEnv('BOOL_TRUE_3')).toBe(true);
      expect(getBooleanEnv('BOOL_TRUE_4')).toBe(true);
      expect(getBooleanEnv('BOOL_FALSE_1')).toBe(false);
      expect(getBooleanEnv('BOOL_FALSE_2')).toBe(false);
      expect(getBooleanEnv('BOOL_FALSE_3')).toBe(false);
      expect(getBooleanEnv('BOOL_FALSE_4')).toBe(false);
    });

    it('should throw error for invalid boolean values', () => {
      // Arrange
      setEnv({ BOOL_INVALID: 'not-a-boolean' });

      // Act & Assert
      expect(() => getBooleanEnv('BOOL_INVALID')).toThrow(EnvironmentVariableTypeError);
    });

    it('should convert numeric environment variables', () => {
      // Arrange
      setEnv({
        NUM_INT: '42',
        NUM_FLOAT: '3.14',
        NUM_NEGATIVE: '-10',
        NUM_ZERO: '0',
      });

      // Act & Assert
      expect(getNumberEnv('NUM_INT')).toBe(42);
      expect(getNumberEnv('NUM_FLOAT')).toBe(3.14);
      expect(getNumberEnv('NUM_NEGATIVE')).toBe(-10);
      expect(getNumberEnv('NUM_ZERO')).toBe(0);
    });

    it('should throw error for invalid numeric values', () => {
      // Arrange
      setEnv({ NUM_INVALID: 'not-a-number' });

      // Act & Assert
      expect(() => getNumberEnv('NUM_INVALID')).toThrow(EnvironmentVariableTypeError);
    });

    it('should enforce min/max constraints for numeric values', () => {
      // Arrange
      setEnv({ NUM_VALUE: '50' });

      // Act & Assert
      expect(getNumberEnv('NUM_VALUE', { min: 0, max: 100 })).toBe(50); // Within range
      expect(() => getNumberEnv('NUM_VALUE', { min: 60, max: 100 })).toThrow(EnvironmentVariableTypeError); // Below min
      expect(() => getNumberEnv('NUM_VALUE', { min: 0, max: 40 })).toThrow(EnvironmentVariableTypeError); // Above max
    });

    it('should convert array environment variables', () => {
      // Arrange
      setEnv({
        ARRAY_CSV: 'a,b,c,d',
        ARRAY_JSON: '["x", "y", "z"]',
        ARRAY_CUSTOM: 'item1|item2|item3',
      });

      // Act & Assert
      expect(getArrayEnv('ARRAY_CSV')).toEqual(['a', 'b', 'c', 'd']);
      expect(getArrayEnv('ARRAY_JSON')).toEqual(['x', 'y', 'z']);
      expect(getArrayEnv('ARRAY_CUSTOM', { delimiter: '|' })).toEqual(['item1', 'item2', 'item3']);
    });

    it('should transform array items', () => {
      // Arrange
      setEnv({ ARRAY_NUMBERS: '1,2,3,4,5' });

      // Act
      const numbers = getArrayEnv<number>('ARRAY_NUMBERS', {
        itemTransform: (item) => parseInt(item, 10),
      });

      // Assert
      expect(numbers).toEqual([1, 2, 3, 4, 5]);
    });

    it('should convert JSON environment variables', () => {
      // Arrange
      setEnv({
        JSON_OBJECT: '{"name":"test","value":42}',
        JSON_ARRAY: '[1,2,3,4]',
      });

      // Act
      const jsonObject = getJsonEnv<{ name: string; value: number }>('JSON_OBJECT');
      const jsonArray = getJsonEnv<number[]>('JSON_ARRAY');

      // Assert
      expect(jsonObject).toEqual({ name: 'test', value: 42 });
      expect(jsonArray).toEqual([1, 2, 3, 4]);
    });

    it('should throw error for invalid JSON', () => {
      // Arrange
      setEnv({ JSON_INVALID: '{name:"test",value:42}' }); // Missing quotes around property names

      // Act & Assert
      expect(() => getJsonEnv('JSON_INVALID')).toThrow(EnvironmentVariableTypeError);
    });

    it('should convert URL environment variables', () => {
      // Arrange
      setEnv({
        URL_HTTP: 'http://example.com/path',
        URL_HTTPS: 'https://api.example.org/v1',
      });

      // Act
      const httpUrl = getUrlEnv('URL_HTTP');
      const httpsUrl = getUrlEnv('URL_HTTPS');

      // Assert
      expect(httpUrl.href).toBe('http://example.com/path');
      expect(httpUrl.protocol).toBe('http:');
      expect(httpUrl.hostname).toBe('example.com');
      expect(httpUrl.pathname).toBe('/path');

      expect(httpsUrl.href).toBe('https://api.example.org/v1');
      expect(httpsUrl.protocol).toBe('https:');
      expect(httpsUrl.hostname).toBe('api.example.org');
      expect(httpsUrl.pathname).toBe('/v1');
    });

    it('should validate URL protocols', () => {
      // Arrange
      setEnv({
        URL_HTTP: 'http://example.com',
        URL_HTTPS: 'https://example.com',
        URL_FTP: 'ftp://example.com',
      });

      // Act & Assert
      // Should allow only http and https
      expect(getUrlEnv('URL_HTTP', { protocols: ['http', 'https'] }).href).toBe('http://example.com/');
      expect(getUrlEnv('URL_HTTPS', { protocols: ['http', 'https'] }).href).toBe('https://example.com/');
      expect(() => getUrlEnv('URL_FTP', { protocols: ['http', 'https'] })).toThrow(EnvironmentVariableTypeError);
    });

    it('should convert enum environment variables', () => {
      // Arrange
      const LogLevel = ['debug', 'info', 'warn', 'error'] as const;
      type LogLevel = typeof LogLevel[number];

      setEnv({
        LOG_LEVEL_DEBUG: 'debug',
        LOG_LEVEL_INFO: 'info',
        LOG_LEVEL_WARN: 'warn',
        LOG_LEVEL_ERROR: 'error',
      });

      // Act & Assert
      expect(getEnumEnv<LogLevel>('LOG_LEVEL_DEBUG', LogLevel)).toBe('debug');
      expect(getEnumEnv<LogLevel>('LOG_LEVEL_INFO', LogLevel)).toBe('info');
      expect(getEnumEnv<LogLevel>('LOG_LEVEL_WARN', LogLevel)).toBe('warn');
      expect(getEnumEnv<LogLevel>('LOG_LEVEL_ERROR', LogLevel)).toBe('error');
    });

    it('should throw error for invalid enum values', () => {
      // Arrange
      const LogLevel = ['debug', 'info', 'warn', 'error'] as const;
      type LogLevel = typeof LogLevel[number];

      setEnv({ LOG_LEVEL_INVALID: 'trace' });

      // Act & Assert
      expect(() => getEnumEnv<LogLevel>('LOG_LEVEL_INVALID', LogLevel)).toThrow(EnvironmentVariableTypeError);
    });
  });

  describe('Validation', () => {
    it('should validate required environment variables', () => {
      // Arrange
      setEnv({
        REQUIRED_VAR_1: 'value1',
        REQUIRED_VAR_2: 'value2',
        REQUIRED_VAR_3: 'value3',
      });

      // Act & Assert
      expect(() => validateRequiredEnv(['REQUIRED_VAR_1', 'REQUIRED_VAR_2', 'REQUIRED_VAR_3'])).not.toThrow();
    });

    it('should throw error for missing required variables', () => {
      // Arrange
      setEnv({
        REQUIRED_VAR_1: 'value1',
        REQUIRED_VAR_2: undefined, // Missing
        REQUIRED_VAR_3: 'value3',
      });

      // Act & Assert
      expect(() => validateRequiredEnv(['REQUIRED_VAR_1', 'REQUIRED_VAR_2', 'REQUIRED_VAR_3'])).toThrow();
    });

    it('should validate batch of environment variables', () => {
      // Arrange
      setEnv({
        BATCH_VAR_1: 'value1',
        BATCH_VAR_2: 'value2',
        BATCH_VAR_3: undefined, // Missing
        BATCH_VAR_4: 'not-a-number', // Invalid
      });

      // Act & Assert
      expect(() => validateEnvBatch({
        'BATCH_VAR_1': () => getRequiredEnv('BATCH_VAR_1'),
        'BATCH_VAR_2': () => getRequiredEnv('BATCH_VAR_2'),
        'BATCH_VAR_3': () => getRequiredEnv('BATCH_VAR_3'),
        'BATCH_VAR_4': () => getNumberEnv('BATCH_VAR_4'),
      })).toThrow(EnvironmentVariableBatchError);
    });

    it('should collect environment errors without throwing', () => {
      // Arrange
      setEnv({
        COLLECT_VAR_1: undefined, // Missing
        COLLECT_VAR_2: 'not-a-number', // Invalid
      });

      // Act
      const errors = collectEnvErrors([
        () => getRequiredEnv('COLLECT_VAR_1'),
        () => getNumberEnv('COLLECT_VAR_2'),
      ], false);

      // Assert
      expect(errors.length).toBe(2);
      expect(errors[0]).toBeInstanceOf(MissingEnvironmentVariableError);
      expect(errors[1]).toBeInstanceOf(EnvironmentVariableTypeError);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors with fallback values', () => {
      // Arrange
      setEnv({ FALLBACK_VAR: undefined });

      // Act
      const value = withEnvErrorFallback(
        () => getRequiredEnv('FALLBACK_VAR'),
        'fallback-value'
      );

      // Assert
      expect(value).toBe('fallback-value');
    });

    it('should provide detailed error information', () => {
      // Arrange
      setEnv({ INVALID_NUMBER: 'not-a-number' });

      // Act & Assert
      try {
        getNumberEnv('INVALID_NUMBER');
        fail('Should have thrown an error');
      } catch (error) {
        if (error instanceof EnvironmentVariableTypeError) {
          expect(error.variableName).toBe('INVALID_NUMBER');
          expect(error.message).toContain('Invalid type for environment variable');
          expect(error.message).toContain('not-a-number');
          expect(error.message).toContain('Expected type: number');
        } else {
          fail('Wrong error type');
        }
      }
    });
  });

  describe('Journey-Specific Configuration', () => {
    it('should retrieve journey-specific environment variables', () => {
      // Arrange
      setEnv({
        'HEALTH_API_URL': 'https://health-api.example.com',
        'CARE_API_URL': 'https://care-api.example.com',
        'PLAN_API_URL': 'https://plan-api.example.com',
      });

      // Act
      const healthApiUrl = getJourneyEnv('health', 'API_URL');
      const careApiUrl = getJourneyEnv('care', 'API_URL');
      const planApiUrl = getJourneyEnv('plan', 'API_URL');

      // Assert
      expect(healthApiUrl).toBe('https://health-api.example.com');
      expect(careApiUrl).toBe('https://care-api.example.com');
      expect(planApiUrl).toBe('https://plan-api.example.com');
    });

    it('should throw error for missing required journey variables', () => {
      // Arrange
      setEnv({
        'HEALTH_API_URL': 'https://health-api.example.com',
        'CARE_API_URL': undefined, // Missing
        'PLAN_API_URL': 'https://plan-api.example.com',
      });

      // Act & Assert
      expect(() => getRequiredJourneyEnv('care', 'API_URL')).toThrow(MissingEnvironmentVariableError);
    });

    it('should return default value for missing optional journey variables', () => {
      // Arrange
      setEnv({ 'HEALTH_TIMEOUT': undefined });

      // Act
      const timeout = getOptionalJourneyEnv('health', 'TIMEOUT', '30000');

      // Assert
      expect(timeout).toBe('30000');
    });

    it('should handle journey-specific feature flags', () => {
      // Arrange
      setEnv({
        'HEALTH_FEATURE_NEW_METRICS': 'true',
        'CARE_FEATURE_NEW_METRICS': 'false',
        'PLAN_FEATURE_NEW_METRICS': undefined, // Missing, should default to false
      });

      // Act
      const healthFeature = getJourneyFeatureFlag('health', 'NEW_METRICS');
      const careFeature = getJourneyFeatureFlag('care', 'NEW_METRICS');
      const planFeature = getJourneyFeatureFlag('plan', 'NEW_METRICS');

      // Assert
      expect(healthFeature).toBe(true);
      expect(careFeature).toBe(false);
      expect(planFeature).toBe(false); // Default value
    });

    it('should validate required journey environment variables', () => {
      // Arrange
      setEnv({
        'HEALTH_API_URL': 'https://health-api.example.com',
        'HEALTH_API_KEY': 'health-api-key',
        'HEALTH_TIMEOUT': '30000',
      });

      // Act & Assert
      expect(() => validateRequiredJourneyEnv('health', ['API_URL', 'API_KEY', 'TIMEOUT'])).not.toThrow();
    });

    it('should throw error for missing required journey variables', () => {
      // Arrange
      setEnv({
        'HEALTH_API_URL': 'https://health-api.example.com',
        'HEALTH_API_KEY': undefined, // Missing
        'HEALTH_TIMEOUT': '30000',
      });

      // Act & Assert
      expect(() => validateRequiredJourneyEnv('health', ['API_URL', 'API_KEY', 'TIMEOUT'])).toThrow();
    });

    it('should retrieve all environment variables with a prefix', () => {
      // Arrange
      setEnv({
        'HEALTH_API_URL': 'https://health-api.example.com',
        'HEALTH_API_KEY': 'health-api-key',
        'HEALTH_TIMEOUT': '30000',
        'CARE_API_URL': 'https://care-api.example.com',
        'OTHER_VAR': 'other-value',
      });

      // Act
      const healthVars = getAllEnvWithPrefix('HEALTH');

      // Assert
      expect(healthVars).toEqual({
        'API_URL': 'https://health-api.example.com',
        'API_KEY': 'health-api-key',
        'TIMEOUT': '30000',
      });
    });

    it('should retrieve all journey environment variables', () => {
      // Arrange
      setEnv({
        'HEALTH_API_URL': 'https://health-api.example.com',
        'HEALTH_API_KEY': 'health-api-key',
        'HEALTH_TIMEOUT': '30000',
        'CARE_API_URL': 'https://care-api.example.com',
        'OTHER_VAR': 'other-value',
      });

      // Act
      const healthVars = getAllJourneyEnv('health');

      // Assert
      expect(healthVars).toEqual({
        'API_URL': 'https://health-api.example.com',
        'API_KEY': 'health-api-key',
        'TIMEOUT': '30000',
      });
    });

    it('should use journey-specific environment config', () => {
      // Arrange
      setEnv({
        'HEALTH_API_URL': 'https://health-api.example.com',
        'HEALTH_FEATURE_NEW_METRICS': 'true',
        'HEALTH_TIMEOUT': '30000',
      });

      // Act & Assert
      expect(healthEnv.getString('API_URL')).toBe('https://health-api.example.com');
      expect(healthEnv.getNumber('TIMEOUT')).toBe(30000);
      expect(healthEnv.isFeatureEnabled('NEW_METRICS')).toBe(true);
    });

    it('should create custom journey environment config', () => {
      // Arrange
      setEnv({
        'CUSTOM_API_URL': 'https://custom-api.example.com',
        'CUSTOM_FEATURE_ENABLED': 'true',
        'CUSTOM_TIMEOUT': '15000',
      });

      // Create custom journey config
      const customEnv = createJourneyEnvConfig(JourneyType.SHARED, {
        // Default values
        'API_URL': 'https://default-api.example.com',
        'TIMEOUT': '5000',
      });

      // Act & Assert
      expect(customEnv.getString('API_URL')).toBe('https://custom-api.example.com');
      expect(customEnv.getNumber('TIMEOUT')).toBe(15000);
      expect(customEnv.isFeatureEnabled('ENABLED')).toBe(true);

      // Test default value
      expect(customEnv.getString('MISSING_VAR', { defaultValue: 'default-value' })).toBe('default-value');
    });
  });
});
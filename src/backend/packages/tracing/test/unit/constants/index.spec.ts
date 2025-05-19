/**
 * Unit tests for the tracing constants barrel file.
 * 
 * These tests verify that all constant modules are correctly exported and accessible
 * from the barrel file, ensuring backward compatibility and a complete constants API.
 */

import * as allConstants from '../../../src/constants';
import * as errorCodes from '../../../src/constants/error-codes';
import * as spanAttributes from '../../../src/constants/span-attributes';
import * as configKeys from '../../../src/constants/config-keys';
import * as defaults from '../../../src/constants/defaults';

describe('Constants barrel exports', () => {
  describe('Error codes', () => {
    it('should export all error code constants', () => {
      // Get all exported keys from the error-codes module
      const errorCodeKeys = Object.keys(errorCodes);
      
      // Verify each error code constant is exported from the barrel file
      errorCodeKeys.forEach(key => {
        expect(allConstants).toHaveProperty(key);
        expect(allConstants[key]).toBe(errorCodes[key]);
      });
    });

    it('should maintain the correct types for error code constants', () => {
      // Verify each error code constant is a string
      Object.keys(errorCodes).forEach(key => {
        expect(typeof allConstants[key]).toBe('string');
      });
    });

    it('should include critical error codes for backward compatibility', () => {
      // List of critical error codes that must be maintained for backward compatibility
      const criticalErrorCodes = [
        'TRACER_INITIALIZATION_ERROR',
        'SPAN_CREATION_ERROR',
        'CONTEXT_EXTRACTION_ERROR',
        'JOURNEY_CONTEXT_ERROR',
        'TRACING_DISABLED_ERROR',
      ];

      criticalErrorCodes.forEach(code => {
        expect(allConstants).toHaveProperty(code);
      });
    });
  });

  describe('Span attributes', () => {
    it('should export all span attribute namespaces', () => {
      // Get all exported keys from the span-attributes module
      const spanAttributeKeys = Object.keys(spanAttributes);
      
      // Verify each span attribute namespace is exported from the barrel file
      spanAttributeKeys.forEach(key => {
        expect(allConstants).toHaveProperty(key);
        expect(allConstants[key]).toEqual(spanAttributes[key]);
      });
    });

    it('should maintain the correct structure for span attribute objects', () => {
      // Verify each span attribute namespace is an object
      const namespaces = [
        'COMMON_ATTRIBUTES',
        'HEALTH_JOURNEY_ATTRIBUTES',
        'CARE_JOURNEY_ATTRIBUTES',
        'PLAN_JOURNEY_ATTRIBUTES',
        'GAMIFICATION_ATTRIBUTES',
      ];

      namespaces.forEach(namespace => {
        expect(typeof allConstants[namespace]).toBe('object');
        expect(allConstants[namespace]).not.toBeNull();
      });
    });

    it('should include critical span attributes for backward compatibility', () => {
      // Verify critical common attributes exist
      expect(allConstants.COMMON_ATTRIBUTES).toHaveProperty('USER_ID');
      expect(allConstants.COMMON_ATTRIBUTES).toHaveProperty('REQUEST_ID');
      expect(allConstants.COMMON_ATTRIBUTES).toHaveProperty('CORRELATION_ID');
      expect(allConstants.COMMON_ATTRIBUTES).toHaveProperty('JOURNEY_TYPE');

      // Verify critical journey-specific attributes exist
      expect(allConstants.HEALTH_JOURNEY_ATTRIBUTES).toHaveProperty('HEALTH_METRIC_TYPE');
      expect(allConstants.CARE_JOURNEY_ATTRIBUTES).toHaveProperty('APPOINTMENT_ID');
      expect(allConstants.PLAN_JOURNEY_ATTRIBUTES).toHaveProperty('PLAN_ID');
      expect(allConstants.GAMIFICATION_ATTRIBUTES).toHaveProperty('ACHIEVEMENT_ID');
    });

    it('should prevent naming collisions between attribute namespaces', () => {
      // Check that attribute keys don't conflict across different namespaces
      // This ensures that importing all constants doesn't cause naming conflicts
      const namespaces = [
        allConstants.COMMON_ATTRIBUTES,
        allConstants.HEALTH_JOURNEY_ATTRIBUTES,
        allConstants.CARE_JOURNEY_ATTRIBUTES,
        allConstants.PLAN_JOURNEY_ATTRIBUTES,
        allConstants.GAMIFICATION_ATTRIBUTES,
      ];

      // Create a map to track attribute values and their namespaces
      const attributeValues = new Map();

      // Check each namespace for value collisions
      namespaces.forEach((namespace, index) => {
        Object.values(namespace).forEach(value => {
          if (attributeValues.has(value)) {
            // If we find the same attribute value in multiple namespaces, it's a collision
            fail(`Attribute value collision detected: ${value} appears in multiple namespaces`);
          }
          attributeValues.set(value, index);
        });
      });
    });
  });

  describe('Config keys', () => {
    it('should export all config key constants', () => {
      // Get all exported keys from the config-keys module
      const configKeyKeys = Object.keys(configKeys);
      
      // Verify each config key constant is exported from the barrel file
      configKeyKeys.forEach(key => {
        expect(allConstants).toHaveProperty(key);
        expect(allConstants[key]).toBe(configKeys[key]);
      });
    });

    it('should maintain the correct types for config key constants', () => {
      // Verify each config key constant is a string
      Object.keys(configKeys).forEach(key => {
        expect(typeof allConstants[key]).toBe('string');
      });
    });

    it('should include critical config keys for backward compatibility', () => {
      // List of critical config keys that must be maintained for backward compatibility
      const criticalConfigKeys = [
        'TRACING_CONFIG_NAMESPACE',
        'SERVICE_NAME_CONFIG_KEY',
        'TRACING_ENABLED_CONFIG_KEY',
        'TRACING_SAMPLING_RATE_CONFIG_KEY',
        'TRACING_EXPORTER_TYPE_CONFIG_KEY',
      ];

      criticalConfigKeys.forEach(key => {
        expect(allConstants).toHaveProperty(key);
      });
    });

    it('should maintain the correct namespace prefix for all config keys', () => {
      // All config keys except SERVICE_NAME_CONFIG_KEY should start with the namespace
      const namespace = allConstants.TRACING_CONFIG_NAMESPACE;
      
      Object.keys(configKeys)
        .filter(key => key !== 'TRACING_CONFIG_NAMESPACE' && key !== 'SERVICE_NAME_CONFIG_KEY')
        .forEach(key => {
          expect(allConstants[key].startsWith(`${namespace}.`)).toBe(true);
        });
    });
  });

  describe('Default values', () => {
    it('should export all default value constants', () => {
      // Get all exported keys from the defaults module
      const defaultKeys = Object.keys(defaults);
      
      // Verify each default value constant is exported from the barrel file
      defaultKeys.forEach(key => {
        expect(allConstants).toHaveProperty(key);
        expect(allConstants[key]).toBe(defaults[key]);
      });
    });

    it('should maintain the correct types for default value constants', () => {
      // Verify string defaults
      const stringDefaults = [
        'DEFAULT_SERVICE_NAME',
        'DEFAULT_SPAN_NAME',
        'DEFAULT_LOGGER_CONTEXT',
        'DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE',
      ];

      stringDefaults.forEach(key => {
        expect(typeof allConstants[key]).toBe('string');
      });

      // Verify number defaults
      const numberDefaults = [
        'DEFAULT_SAMPLING_RATE',
        'DEFAULT_EXPORT_RETRY_ATTEMPTS',
        'DEFAULT_TRACING_TIMEOUT_MS',
        'DEFAULT_BATCH_SIZE',
        'DEFAULT_QUEUE_SIZE',
        'DEFAULT_SCHEDULE_DELAY_MS',
      ];

      numberDefaults.forEach(key => {
        expect(typeof allConstants[key]).toBe('number');
      });
    });

    it('should include critical default values for backward compatibility', () => {
      // List of critical default values that must be maintained for backward compatibility
      const criticalDefaults = [
        'DEFAULT_SERVICE_NAME',
        'DEFAULT_SPAN_NAME',
        'DEFAULT_LOGGER_CONTEXT',
        'DEFAULT_SAMPLING_RATE',
      ];

      criticalDefaults.forEach(key => {
        expect(allConstants).toHaveProperty(key);
      });
    });
  });

  describe('Negative tests', () => {
    it('should not expose non-existent constants', () => {
      // List of constants that should not exist
      const nonExistentConstants = [
        'UNKNOWN_ERROR_CODE',
        'INVALID_ATTRIBUTE',
        'MISSING_CONFIG_KEY',
        'WRONG_DEFAULT_VALUE',
      ];

      nonExistentConstants.forEach(key => {
        expect(allConstants).not.toHaveProperty(key);
      });
    });

    it('should throw an error when accessing non-existent constants', () => {
      // Attempting to access a non-existent constant should throw a TypeError
      expect(() => {
        // @ts-ignore - Intentionally accessing a non-existent property
        const value = allConstants.NON_EXISTENT_CONSTANT;
        // Additional check to ensure the test fails if the property exists
        expect(value).toBeUndefined();
      }).not.toThrow();
    });

    it('should not have naming collisions between different constant categories', () => {
      // Get all keys from each constants module
      const errorCodeKeys = Object.keys(errorCodes);
      const configKeyKeys = Object.keys(configKeys);
      const defaultKeys = Object.keys(defaults);
      
      // Check for collisions between error codes and config keys
      errorCodeKeys.forEach(key => {
        expect(configKeyKeys).not.toContain(key);
        expect(defaultKeys).not.toContain(key);
      });
      
      // Check for collisions between config keys and defaults
      configKeyKeys.forEach(key => {
        expect(defaultKeys).not.toContain(key);
      });
    });
  });
});
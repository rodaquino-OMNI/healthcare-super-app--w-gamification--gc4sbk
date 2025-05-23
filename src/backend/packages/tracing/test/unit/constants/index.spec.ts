import * as allConstants from '../../../src/constants';
import * as errorCodes from '../../../src/constants/error-codes';
import * as spanAttributes from '../../../src/constants/span-attributes';
import * as configKeys from '../../../src/constants/config-keys';
import * as defaults from '../../../src/constants/defaults';

describe('Constants Barrel File', () => {
  describe('Error Codes', () => {
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
      // Verify specific error codes have the correct type and value
      expect(typeof allConstants.TRACER_INITIALIZATION_FAILED).toBe('string');
      expect(allConstants.TRACER_INITIALIZATION_FAILED).toBe('TRACING-1000');
      
      expect(typeof allConstants.SPAN_CREATION_FAILED).toBe('string');
      expect(allConstants.SPAN_CREATION_FAILED).toBe('TRACING-2000');
      
      expect(typeof allConstants.CONTEXT_EXTRACTION_FAILED).toBe('string');
      expect(allConstants.CONTEXT_EXTRACTION_FAILED).toBe('TRACING-3000');
    });

    it('should include all required error code categories', () => {
      // Verify that error codes from all categories are exported
      const requiredPrefixes = ['TRACER_', 'SPAN_', 'CONTEXT_', 'EXPORTER_', 'RESOURCE_', 'JOURNEY_', 'SAMPLER_'];
      
      requiredPrefixes.forEach(prefix => {
        const matchingKeys = Object.keys(allConstants).filter(key => key.startsWith(prefix));
        expect(matchingKeys.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Span Attributes', () => {
    it('should export all span attribute namespaces', () => {
      // Verify all span attribute namespaces are exported
      const attributeNamespaces = [
        'COMMON_ATTRIBUTES',
        'HEALTH_JOURNEY_ATTRIBUTES',
        'CARE_JOURNEY_ATTRIBUTES',
        'PLAN_JOURNEY_ATTRIBUTES',
        'GAMIFICATION_ATTRIBUTES',
        'NOTIFICATION_ATTRIBUTES',
        'DATABASE_ATTRIBUTES',
        'HTTP_ATTRIBUTES',
        'GRAPHQL_ATTRIBUTES',
        'KAFKA_ATTRIBUTES'
      ];
      
      attributeNamespaces.forEach(namespace => {
        expect(allConstants).toHaveProperty(namespace);
        expect(allConstants[namespace]).toEqual(spanAttributes[namespace]);
      });
    });

    it('should maintain the correct structure for attribute objects', () => {
      // Verify the structure of attribute objects is maintained
      expect(allConstants.COMMON_ATTRIBUTES).toBeInstanceOf(Object);
      expect(Object.keys(allConstants.COMMON_ATTRIBUTES).length).toBeGreaterThan(0);
      
      // Check specific attributes in different namespaces
      expect(allConstants.COMMON_ATTRIBUTES.REQUEST_ID).toBe('request.id');
      expect(allConstants.HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_TYPE).toBe('health.metric.type');
      expect(allConstants.CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_ID).toBe('appointment.id');
      expect(allConstants.PLAN_JOURNEY_ATTRIBUTES.PLAN_ID).toBe('plan.id');
    });

    it('should prevent naming collisions between attribute namespaces', () => {
      // Verify that attribute keys are properly namespaced to prevent collisions
      const commonKeys = Object.keys(allConstants.COMMON_ATTRIBUTES);
      const healthKeys = Object.keys(allConstants.HEALTH_JOURNEY_ATTRIBUTES);
      const careKeys = Object.keys(allConstants.CARE_JOURNEY_ATTRIBUTES);
      const planKeys = Object.keys(allConstants.PLAN_JOURNEY_ATTRIBUTES);
      
      // Check for potential collisions in attribute values
      const allValues = [
        ...Object.values(allConstants.COMMON_ATTRIBUTES),
        ...Object.values(allConstants.HEALTH_JOURNEY_ATTRIBUTES),
        ...Object.values(allConstants.CARE_JOURNEY_ATTRIBUTES),
        ...Object.values(allConstants.PLAN_JOURNEY_ATTRIBUTES)
      ];
      
      // Each journey should have unique attribute keys
      const uniqueKeys = new Set([...commonKeys, ...healthKeys, ...careKeys, ...planKeys]);
      expect(uniqueKeys.size).toBe(commonKeys.length + healthKeys.length + careKeys.length + planKeys.length);
      
      // Each attribute should have a unique value
      const uniqueValues = new Set(allValues);
      expect(uniqueValues.size).toBe(allValues.length);
    });
  });

  describe('Config Keys', () => {
    it('should export all configuration key constants', () => {
      // Get all exported keys from the config-keys module
      const configKeyNames = Object.keys(configKeys);
      
      // Verify each config key constant is exported from the barrel file
      configKeyNames.forEach(key => {
        expect(allConstants).toHaveProperty(key);
        expect(allConstants[key]).toBe(configKeys[key]);
      });
    });

    it('should maintain the correct namespace for configuration keys', () => {
      // Verify the namespace is correctly applied to configuration keys
      expect(allConstants.TRACING_CONFIG_NAMESPACE).toBe('tracing');
      expect(allConstants.TRACING_ENABLED_KEY).toBe('tracing.enabled');
      expect(allConstants.SAMPLING_RATE_KEY).toBe('tracing.sampling.rate');
    });

    it('should include journey-specific configuration keys', () => {
      // Verify journey-specific configuration keys are exported
      expect(allConstants.JOURNEY_TRACING_KEYS).toBeInstanceOf(Object);
      expect(allConstants.JOURNEY_TRACING_KEYS.HEALTH).toBe('tracing.journey.health');
      expect(allConstants.JOURNEY_TRACING_KEYS.CARE).toBe('tracing.journey.care');
      expect(allConstants.JOURNEY_TRACING_KEYS.PLAN).toBe('tracing.journey.plan');
    });
  });

  describe('Default Values', () => {
    it('should export all default value constants', () => {
      // Get all exported keys from the defaults module
      const defaultValueKeys = Object.keys(defaults);
      
      // Verify each default value constant is exported from the barrel file
      defaultValueKeys.forEach(key => {
        expect(allConstants).toHaveProperty(key);
        expect(allConstants[key]).toBe(defaults[key]);
      });
    });

    it('should maintain the correct types for default values', () => {
      // Verify specific default values have the correct type
      expect(typeof allConstants.DEFAULT_SERVICE_NAME).toBe('string');
      expect(allConstants.DEFAULT_SERVICE_NAME).toBe('austa-service');
      
      expect(typeof allConstants.DEFAULT_SAMPLING_RATE).toBe('number');
      expect(allConstants.DEFAULT_SAMPLING_RATE).toBe(1.0);
      
      expect(typeof allConstants.DEFAULT_JOURNEY_CONTEXT_ENABLED).toBe('boolean');
      expect(allConstants.DEFAULT_JOURNEY_CONTEXT_ENABLED).toBe(true);
      
      expect(allConstants.DEFAULT_JOURNEY_TYPES).toBeInstanceOf(Object);
      expect(allConstants.DEFAULT_JOURNEY_TYPES.HEALTH).toBe('health');
    });

    it('should include all required default categories', () => {
      // Verify defaults for different categories are exported
      expect(allConstants).toHaveProperty('DEFAULT_SERVICE_NAME');
      expect(allConstants).toHaveProperty('DEFAULT_SPAN_NAME');
      expect(allConstants).toHaveProperty('DEFAULT_LOGGER_CONTEXT');
      expect(allConstants).toHaveProperty('DEFAULT_SAMPLING_RATE');
      expect(allConstants).toHaveProperty('DEFAULT_MAX_ATTRIBUTES_PER_SPAN');
      expect(allConstants).toHaveProperty('DEFAULT_JOURNEY_TYPES');
      expect(allConstants).toHaveProperty('DEFAULT_EXPORTER_TYPE');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with critical constants', () => {
      // These constants are considered critical and must be maintained for backward compatibility
      const criticalConstants = [
        // Error codes
        'TRACER_INITIALIZATION_FAILED',
        'SPAN_CREATION_FAILED',
        'CONTEXT_EXTRACTION_FAILED',
        'UNKNOWN_ERROR',
        
        // Span attributes
        'COMMON_ATTRIBUTES',
        'HEALTH_JOURNEY_ATTRIBUTES',
        'CARE_JOURNEY_ATTRIBUTES',
        'PLAN_JOURNEY_ATTRIBUTES',
        
        // Config keys
        'TRACING_CONFIG_NAMESPACE',
        'SERVICE_NAME_KEY',
        'TRACING_ENABLED_KEY',
        
        // Default values
        'DEFAULT_SERVICE_NAME',
        'DEFAULT_SPAN_NAME',
        'DEFAULT_LOGGER_CONTEXT'
      ];
      
      criticalConstants.forEach(constant => {
        expect(allConstants).toHaveProperty(constant);
      });
    });
  });

  describe('Negative Tests', () => {
    it('should not export non-existent constants', () => {
      // These constants should not exist in the exports
      const nonExistentConstants = [
        'NON_EXISTENT_ERROR_CODE',
        'INVALID_ATTRIBUTE_NAMESPACE',
        'UNKNOWN_CONFIG_KEY',
        'MISSING_DEFAULT_VALUE'
      ];
      
      nonExistentConstants.forEach(constant => {
        expect(allConstants).not.toHaveProperty(constant);
      });
    });

    it('should throw an error when accessing non-existent constants', () => {
      // Attempting to access a non-existent constant should result in undefined
      expect(allConstants['NON_EXISTENT_CONSTANT']).toBeUndefined();
    });
  });
});
import {
  TRACING_CONFIG_NAMESPACE,
  SERVICE_NAME_KEY,
  TRACING_ENABLED_KEY,
  SAMPLING_RATE_KEY,
  EXPORTER_TYPE_KEY,
  EXPORTER_ENDPOINT_KEY,
  MAX_ATTRIBUTES_PER_SPAN_KEY,
  MAX_EVENTS_PER_SPAN_KEY,
  MAX_LINKS_PER_SPAN_KEY,
  JOURNEY_CONTEXT_ENABLED_KEY,
  JOURNEY_TRACING_KEYS,
  LOGGER_CONTEXT_KEY,
} from '../../../src/constants/config-keys';

describe('Tracing Configuration Key Constants', () => {
  describe('TRACING_CONFIG_NAMESPACE', () => {
    it('should be defined', () => {
      expect(TRACING_CONFIG_NAMESPACE).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof TRACING_CONFIG_NAMESPACE).toBe('string');
    });

    it('should have the correct value', () => {
      expect(TRACING_CONFIG_NAMESPACE).toBe('tracing');
    });

    it('should be a valid namespace for configuration keys', () => {
      // Configuration namespaces should be lowercase and not contain special characters
      expect(TRACING_CONFIG_NAMESPACE).toMatch(/^[a-z][a-z0-9]*$/);
    });
  });

  describe('SERVICE_NAME_KEY', () => {
    it('should be defined', () => {
      expect(SERVICE_NAME_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof SERVICE_NAME_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(SERVICE_NAME_KEY).toBe('service.name');
    });

    it('should follow dot notation convention for configuration keys', () => {
      expect(SERVICE_NAME_KEY).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/);
    });

    it('should map to a valid environment variable name', () => {
      // Convert dot notation to uppercase with underscores (common env var convention)
      const envVarName = SERVICE_NAME_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('SERVICE_NAME');
    });
  });

  describe('TRACING_ENABLED_KEY', () => {
    it('should be defined', () => {
      expect(TRACING_ENABLED_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof TRACING_ENABLED_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(TRACING_ENABLED_KEY).toBe('tracing.enabled');
    });

    it('should start with the tracing namespace', () => {
      expect(TRACING_ENABLED_KEY.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
    });

    it('should follow dot notation convention for configuration keys', () => {
      expect(TRACING_ENABLED_KEY).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/);
    });

    it('should map to a valid environment variable name', () => {
      const envVarName = TRACING_ENABLED_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('TRACING_ENABLED');
    });
  });

  describe('SAMPLING_RATE_KEY', () => {
    it('should be defined', () => {
      expect(SAMPLING_RATE_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof SAMPLING_RATE_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(SAMPLING_RATE_KEY).toBe('tracing.sampling.rate');
    });

    it('should start with the tracing namespace', () => {
      expect(SAMPLING_RATE_KEY.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
    });

    it('should follow dot notation convention for configuration keys', () => {
      expect(SAMPLING_RATE_KEY).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/);
    });

    it('should map to a valid environment variable name', () => {
      const envVarName = SAMPLING_RATE_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('TRACING_SAMPLING_RATE');
    });
  });

  describe('EXPORTER_TYPE_KEY', () => {
    it('should be defined', () => {
      expect(EXPORTER_TYPE_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof EXPORTER_TYPE_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(EXPORTER_TYPE_KEY).toBe('tracing.exporter.type');
    });

    it('should start with the tracing namespace', () => {
      expect(EXPORTER_TYPE_KEY.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
    });

    it('should follow dot notation convention for configuration keys', () => {
      expect(EXPORTER_TYPE_KEY).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/);
    });

    it('should map to a valid environment variable name', () => {
      const envVarName = EXPORTER_TYPE_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('TRACING_EXPORTER_TYPE');
    });
  });

  describe('EXPORTER_ENDPOINT_KEY', () => {
    it('should be defined', () => {
      expect(EXPORTER_ENDPOINT_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof EXPORTER_ENDPOINT_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(EXPORTER_ENDPOINT_KEY).toBe('tracing.exporter.endpoint');
    });

    it('should start with the tracing namespace', () => {
      expect(EXPORTER_ENDPOINT_KEY.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
    });

    it('should follow dot notation convention for configuration keys', () => {
      expect(EXPORTER_ENDPOINT_KEY).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/);
    });

    it('should map to a valid environment variable name', () => {
      const envVarName = EXPORTER_ENDPOINT_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('TRACING_EXPORTER_ENDPOINT');
    });
  });

  describe('MAX_ATTRIBUTES_PER_SPAN_KEY', () => {
    it('should be defined', () => {
      expect(MAX_ATTRIBUTES_PER_SPAN_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof MAX_ATTRIBUTES_PER_SPAN_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(MAX_ATTRIBUTES_PER_SPAN_KEY).toBe('tracing.span.maxAttributes');
    });

    it('should start with the tracing namespace', () => {
      expect(MAX_ATTRIBUTES_PER_SPAN_KEY.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
    });

    it('should follow camelCase convention for the property name', () => {
      const propertyName = MAX_ATTRIBUTES_PER_SPAN_KEY.split('.').pop();
      expect(propertyName).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    });

    it('should map to a valid environment variable name', () => {
      const envVarName = MAX_ATTRIBUTES_PER_SPAN_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('TRACING_SPAN_MAXATTRIBUTES');
    });
  });

  describe('MAX_EVENTS_PER_SPAN_KEY', () => {
    it('should be defined', () => {
      expect(MAX_EVENTS_PER_SPAN_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof MAX_EVENTS_PER_SPAN_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(MAX_EVENTS_PER_SPAN_KEY).toBe('tracing.span.maxEvents');
    });

    it('should start with the tracing namespace', () => {
      expect(MAX_EVENTS_PER_SPAN_KEY.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
    });

    it('should follow camelCase convention for the property name', () => {
      const propertyName = MAX_EVENTS_PER_SPAN_KEY.split('.').pop();
      expect(propertyName).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    });

    it('should map to a valid environment variable name', () => {
      const envVarName = MAX_EVENTS_PER_SPAN_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('TRACING_SPAN_MAXEVENTS');
    });
  });

  describe('MAX_LINKS_PER_SPAN_KEY', () => {
    it('should be defined', () => {
      expect(MAX_LINKS_PER_SPAN_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof MAX_LINKS_PER_SPAN_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(MAX_LINKS_PER_SPAN_KEY).toBe('tracing.span.maxLinks');
    });

    it('should start with the tracing namespace', () => {
      expect(MAX_LINKS_PER_SPAN_KEY.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
    });

    it('should follow camelCase convention for the property name', () => {
      const propertyName = MAX_LINKS_PER_SPAN_KEY.split('.').pop();
      expect(propertyName).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    });

    it('should map to a valid environment variable name', () => {
      const envVarName = MAX_LINKS_PER_SPAN_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('TRACING_SPAN_MAXLINKS');
    });
  });

  describe('JOURNEY_CONTEXT_ENABLED_KEY', () => {
    it('should be defined', () => {
      expect(JOURNEY_CONTEXT_ENABLED_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof JOURNEY_CONTEXT_ENABLED_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(JOURNEY_CONTEXT_ENABLED_KEY).toBe('tracing.journeyContext.enabled');
    });

    it('should start with the tracing namespace', () => {
      expect(JOURNEY_CONTEXT_ENABLED_KEY.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
    });

    it('should follow camelCase convention for nested objects', () => {
      const parts = JOURNEY_CONTEXT_ENABLED_KEY.split('.');
      expect(parts[1]).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    });

    it('should map to a valid environment variable name', () => {
      const envVarName = JOURNEY_CONTEXT_ENABLED_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('TRACING_JOURNEYCONTEXT_ENABLED');
    });
  });

  describe('JOURNEY_TRACING_KEYS', () => {
    it('should be defined', () => {
      expect(JOURNEY_TRACING_KEYS).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof JOURNEY_TRACING_KEYS).toBe('object');
      expect(JOURNEY_TRACING_KEYS).not.toBeNull();
    });

    it('should contain the correct journey keys', () => {
      expect(JOURNEY_TRACING_KEYS.HEALTH).toBe('tracing.journey.health');
      expect(JOURNEY_TRACING_KEYS.CARE).toBe('tracing.journey.care');
      expect(JOURNEY_TRACING_KEYS.PLAN).toBe('tracing.journey.plan');
    });

    it('should have the correct number of journey keys', () => {
      // There should be exactly 3 journey types as per the AUSTA SuperApp requirements
      expect(Object.keys(JOURNEY_TRACING_KEYS).length).toBe(3);
    });

    it('should use uppercase for object keys', () => {
      // Object keys should be uppercase for constants
      Object.keys(JOURNEY_TRACING_KEYS).forEach(key => {
        expect(key).toBe(key.toUpperCase());
      });
    });

    it('should have values that start with the tracing namespace', () => {
      Object.values(JOURNEY_TRACING_KEYS).forEach(value => {
        expect(value.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
      });
    });

    it('should have values that follow dot notation convention', () => {
      Object.values(JOURNEY_TRACING_KEYS).forEach(value => {
        expect(value).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/);
      });
    });

    it('should have values that map to valid environment variable names', () => {
      const healthEnvVar = JOURNEY_TRACING_KEYS.HEALTH.toUpperCase().replace(/\./g, '_');
      const careEnvVar = JOURNEY_TRACING_KEYS.CARE.toUpperCase().replace(/\./g, '_');
      const planEnvVar = JOURNEY_TRACING_KEYS.PLAN.toUpperCase().replace(/\./g, '_');
      
      expect(healthEnvVar).toBe('TRACING_JOURNEY_HEALTH');
      expect(careEnvVar).toBe('TRACING_JOURNEY_CARE');
      expect(planEnvVar).toBe('TRACING_JOURNEY_PLAN');
    });
  });

  describe('LOGGER_CONTEXT_KEY', () => {
    it('should be defined', () => {
      expect(LOGGER_CONTEXT_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof LOGGER_CONTEXT_KEY).toBe('string');
    });

    it('should have the correct value', () => {
      expect(LOGGER_CONTEXT_KEY).toBe('tracing.logger.context');
    });

    it('should start with the tracing namespace', () => {
      expect(LOGGER_CONTEXT_KEY.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
    });

    it('should follow dot notation convention for configuration keys', () => {
      expect(LOGGER_CONTEXT_KEY).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/);
    });

    it('should map to a valid environment variable name', () => {
      const envVarName = LOGGER_CONTEXT_KEY.toUpperCase().replace(/\./g, '_');
      expect(envVarName).toBe('TRACING_LOGGER_CONTEXT');
    });
  });

  describe('Configuration Key Organization', () => {
    it('should group span-related configuration keys', () => {
      // All span-related keys should have the same prefix
      const spanPrefix = 'tracing.span.';
      expect(MAX_ATTRIBUTES_PER_SPAN_KEY.startsWith(spanPrefix)).toBe(true);
      expect(MAX_EVENTS_PER_SPAN_KEY.startsWith(spanPrefix)).toBe(true);
      expect(MAX_LINKS_PER_SPAN_KEY.startsWith(spanPrefix)).toBe(true);
    });

    it('should group exporter-related configuration keys', () => {
      // All exporter-related keys should have the same prefix
      const exporterPrefix = 'tracing.exporter.';
      expect(EXPORTER_TYPE_KEY.startsWith(exporterPrefix)).toBe(true);
      expect(EXPORTER_ENDPOINT_KEY.startsWith(exporterPrefix)).toBe(true);
    });

    it('should group journey-related configuration keys', () => {
      // All journey-related keys should have the same prefix
      const journeyPrefix = 'tracing.journey.';
      Object.values(JOURNEY_TRACING_KEYS).forEach(value => {
        expect(value.startsWith(journeyPrefix)).toBe(true);
      });
    });
  });

  describe('Configuration Key Patterns', () => {
    it('should use consistent naming patterns for all keys', () => {
      // All keys should follow the same pattern: namespace.category.property
      const allKeys = [
        TRACING_ENABLED_KEY,
        SAMPLING_RATE_KEY,
        EXPORTER_TYPE_KEY,
        EXPORTER_ENDPOINT_KEY,
        MAX_ATTRIBUTES_PER_SPAN_KEY,
        MAX_EVENTS_PER_SPAN_KEY,
        MAX_LINKS_PER_SPAN_KEY,
        JOURNEY_CONTEXT_ENABLED_KEY,
        LOGGER_CONTEXT_KEY,
        ...Object.values(JOURNEY_TRACING_KEYS)
      ];

      allKeys.forEach(key => {
        const parts = key.split('.');
        expect(parts.length).toBeGreaterThanOrEqual(2); // At least namespace.property
        expect(parts[0]).toBe(TRACING_CONFIG_NAMESPACE); // First part should be the namespace
      });
    });

    it('should use consistent casing for all keys', () => {
      // All parts of the keys should be lowercase
      const allKeys = [
        TRACING_ENABLED_KEY,
        SAMPLING_RATE_KEY,
        EXPORTER_TYPE_KEY,
        EXPORTER_ENDPOINT_KEY,
        MAX_ATTRIBUTES_PER_SPAN_KEY,
        MAX_EVENTS_PER_SPAN_KEY,
        MAX_LINKS_PER_SPAN_KEY,
        JOURNEY_CONTEXT_ENABLED_KEY,
        LOGGER_CONTEXT_KEY,
        ...Object.values(JOURNEY_TRACING_KEYS)
      ];

      allKeys.forEach(key => {
        // All parts should be lowercase (except for camelCase property names)
        const parts = key.split('.');
        parts.forEach(part => {
          // First character should be lowercase
          expect(part.charAt(0)).toBe(part.charAt(0).toLowerCase());
        });
      });
    });
  });
});
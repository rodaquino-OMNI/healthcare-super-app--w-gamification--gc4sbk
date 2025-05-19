import {
  TRACING_CONFIG_NAMESPACE,
  SERVICE_NAME_CONFIG_KEY,
  TRACING_ENABLED_CONFIG_KEY,
  TRACING_SAMPLING_RATE_CONFIG_KEY,
  TRACING_EXPORTER_TYPE_CONFIG_KEY,
  TRACING_EXPORTER_ENDPOINT_CONFIG_KEY,
  TRACING_MAX_ATTRIBUTES_CONFIG_KEY,
  TRACING_MAX_EVENTS_CONFIG_KEY,
  TRACING_MAX_LINKS_CONFIG_KEY,
  TRACING_JOURNEY_CONTEXT_ENABLED_CONFIG_KEY,
  TRACING_LOG_CORRELATION_ENABLED_CONFIG_KEY
} from '../../../src/constants/config-keys';

describe('Tracing Configuration Key Constants', () => {
  describe('TRACING_CONFIG_NAMESPACE', () => {
    it('should be defined', () => {
      expect(TRACING_CONFIG_NAMESPACE).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(TRACING_CONFIG_NAMESPACE).toBe('tracing');
    });

    it('should be a non-empty string', () => {
      expect(typeof TRACING_CONFIG_NAMESPACE).toBe('string');
      expect(TRACING_CONFIG_NAMESPACE.length).toBeGreaterThan(0);
    });

    it('should be lowercase for consistency', () => {
      expect(TRACING_CONFIG_NAMESPACE).toBe(TRACING_CONFIG_NAMESPACE.toLowerCase());
    });
  });

  describe('SERVICE_NAME_CONFIG_KEY', () => {
    it('should be defined', () => {
      expect(SERVICE_NAME_CONFIG_KEY).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(SERVICE_NAME_CONFIG_KEY).toBe('service.name');
    });

    it('should be a non-empty string', () => {
      expect(typeof SERVICE_NAME_CONFIG_KEY).toBe('string');
      expect(SERVICE_NAME_CONFIG_KEY.length).toBeGreaterThan(0);
    });

    it('should follow dot notation for hierarchical configuration', () => {
      expect(SERVICE_NAME_CONFIG_KEY.split('.')).toHaveLength(2);
      expect(SERVICE_NAME_CONFIG_KEY).toContain('.');
    });

    it('should map to a valid environment variable name', () => {
      // Convert from camelCase or dot notation to uppercase with underscores
      const envVarName = SERVICE_NAME_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(envVarName).toBe('SERVICE_NAME');
    });
  });

  describe('Tracing-specific configuration keys', () => {
    const tracingSpecificKeys = [
      TRACING_ENABLED_CONFIG_KEY,
      TRACING_SAMPLING_RATE_CONFIG_KEY,
      TRACING_EXPORTER_TYPE_CONFIG_KEY,
      TRACING_EXPORTER_ENDPOINT_CONFIG_KEY,
      TRACING_MAX_ATTRIBUTES_CONFIG_KEY,
      TRACING_MAX_EVENTS_CONFIG_KEY,
      TRACING_MAX_LINKS_CONFIG_KEY,
      TRACING_JOURNEY_CONTEXT_ENABLED_CONFIG_KEY,
      TRACING_LOG_CORRELATION_ENABLED_CONFIG_KEY
    ];

    it('should all be defined', () => {
      tracingSpecificKeys.forEach(key => {
        expect(key).toBeDefined();
      });
    });

    it('should all be non-empty strings', () => {
      tracingSpecificKeys.forEach(key => {
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
      });
    });

    it('should all start with the tracing namespace', () => {
      tracingSpecificKeys.forEach(key => {
        expect(key.startsWith(`${TRACING_CONFIG_NAMESPACE}.`)).toBe(true);
      });
    });

    it('should all follow dot notation for hierarchical configuration', () => {
      tracingSpecificKeys.forEach(key => {
        const parts = key.split('.');
        expect(parts.length).toBeGreaterThanOrEqual(2);
        expect(parts[0]).toBe(TRACING_CONFIG_NAMESPACE);
      });
    });

    it('should all be lowercase for consistency', () => {
      tracingSpecificKeys.forEach(key => {
        expect(key).toBe(key.toLowerCase());
      });
    });

    it('should all map to valid environment variable names', () => {
      tracingSpecificKeys.forEach(key => {
        // Convert from camelCase or dot notation to uppercase with underscores
        const envVarName = key
          .replace(/\./g, '_')
          .toUpperCase();
        
        // Ensure it follows environment variable naming conventions
        expect(envVarName).toMatch(/^[A-Z][A-Z0-9_]*$/);
        expect(envVarName).not.toContain('.');
      });
    });
  });

  describe('Functional grouping of configuration keys', () => {
    it('should have keys for basic configuration', () => {
      expect(TRACING_ENABLED_CONFIG_KEY).toContain('enabled');
      expect(TRACING_SAMPLING_RATE_CONFIG_KEY).toContain('sampling.rate');
    });

    it('should have keys for exporter configuration', () => {
      expect(TRACING_EXPORTER_TYPE_CONFIG_KEY).toContain('exporter.type');
      expect(TRACING_EXPORTER_ENDPOINT_CONFIG_KEY).toContain('exporter.endpoint');
    });

    it('should have keys for span configuration', () => {
      expect(TRACING_MAX_ATTRIBUTES_CONFIG_KEY).toContain('span.maxAttributes');
      expect(TRACING_MAX_EVENTS_CONFIG_KEY).toContain('span.maxEvents');
      expect(TRACING_MAX_LINKS_CONFIG_KEY).toContain('span.maxLinks');
    });

    it('should have keys for integration configuration', () => {
      expect(TRACING_JOURNEY_CONTEXT_ENABLED_CONFIG_KEY).toContain('journeyContext.enabled');
      expect(TRACING_LOG_CORRELATION_ENABLED_CONFIG_KEY).toContain('logCorrelation.enabled');
    });
  });

  describe('Configuration key relationships', () => {
    it('should have consistent naming for enabled flags', () => {
      expect(TRACING_ENABLED_CONFIG_KEY.endsWith('enabled')).toBe(true);
      expect(TRACING_JOURNEY_CONTEXT_ENABLED_CONFIG_KEY.endsWith('enabled')).toBe(true);
      expect(TRACING_LOG_CORRELATION_ENABLED_CONFIG_KEY.endsWith('enabled')).toBe(true);
    });

    it('should have consistent naming for exporter configuration', () => {
      expect(TRACING_EXPORTER_TYPE_CONFIG_KEY).toContain('exporter');
      expect(TRACING_EXPORTER_ENDPOINT_CONFIG_KEY).toContain('exporter');
    });

    it('should have consistent naming for span limits', () => {
      expect(TRACING_MAX_ATTRIBUTES_CONFIG_KEY).toContain('span.max');
      expect(TRACING_MAX_EVENTS_CONFIG_KEY).toContain('span.max');
      expect(TRACING_MAX_LINKS_CONFIG_KEY).toContain('span.max');
    });
  });

  describe('Environment variable mapping', () => {
    it('should map SERVICE_NAME_CONFIG_KEY to SERVICE_NAME', () => {
      const envVarName = SERVICE_NAME_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(envVarName).toBe('SERVICE_NAME');
    });

    it('should map TRACING_ENABLED_CONFIG_KEY to TRACING_ENABLED', () => {
      const envVarName = TRACING_ENABLED_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(envVarName).toBe('TRACING_ENABLED');
    });

    it('should map TRACING_SAMPLING_RATE_CONFIG_KEY to TRACING_SAMPLING_RATE', () => {
      const envVarName = TRACING_SAMPLING_RATE_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(envVarName).toBe('TRACING_SAMPLING_RATE');
    });

    it('should map TRACING_EXPORTER_TYPE_CONFIG_KEY to TRACING_EXPORTER_TYPE', () => {
      const envVarName = TRACING_EXPORTER_TYPE_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(envVarName).toBe('TRACING_EXPORTER_TYPE');
    });

    it('should map TRACING_EXPORTER_ENDPOINT_CONFIG_KEY to TRACING_EXPORTER_ENDPOINT', () => {
      const envVarName = TRACING_EXPORTER_ENDPOINT_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(envVarName).toBe('TRACING_EXPORTER_ENDPOINT');
    });

    it('should map span configuration keys to appropriate environment variables', () => {
      const maxAttributesEnvVar = TRACING_MAX_ATTRIBUTES_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(maxAttributesEnvVar).toBe('TRACING_SPAN_MAXATTRIBUTES');

      const maxEventsEnvVar = TRACING_MAX_EVENTS_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(maxEventsEnvVar).toBe('TRACING_SPAN_MAXEVENTS');

      const maxLinksEnvVar = TRACING_MAX_LINKS_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(maxLinksEnvVar).toBe('TRACING_SPAN_MAXLINKS');
    });

    it('should map integration configuration keys to appropriate environment variables', () => {
      const journeyContextEnvVar = TRACING_JOURNEY_CONTEXT_ENABLED_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(journeyContextEnvVar).toBe('TRACING_JOURNEYCONTEXT_ENABLED');

      const logCorrelationEnvVar = TRACING_LOG_CORRELATION_ENABLED_CONFIG_KEY
        .replace(/\./g, '_')
        .toUpperCase();
      expect(logCorrelationEnvVar).toBe('TRACING_LOGCORRELATION_ENABLED');
    });
  });
});
import {
  DEFAULT_SERVICE_NAME,
  DEFAULT_SPAN_NAME,
  DEFAULT_LOGGER_CONTEXT,
  DEFAULT_SAMPLING_RATE,
  DEFAULT_MAX_ATTRIBUTES_PER_SPAN,
  DEFAULT_MAX_EVENTS_PER_SPAN,
  DEFAULT_MAX_LINKS_PER_SPAN,
  DEFAULT_RETRY_ATTEMPTS,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_EXPORT_BATCH_SIZE,
  DEFAULT_EXPORT_INTERVAL_MS,
  DEFAULT_JOURNEY_CONTEXT_ENABLED,
  DEFAULT_JOURNEY_TYPES,
  DEFAULT_EXPORTER_TYPE,
  DEFAULT_ATTRIBUTE_VALUE,
} from '../../../src/constants/defaults';

describe('Tracing Default Constants', () => {
  describe('DEFAULT_SERVICE_NAME', () => {
    it('should be defined', () => {
      expect(DEFAULT_SERVICE_NAME).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof DEFAULT_SERVICE_NAME).toBe('string');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_SERVICE_NAME).toBe('austa-service');
    });

    it('should be a valid service name for OpenTelemetry', () => {
      // OpenTelemetry service names should not be empty and should be reasonable length
      expect(DEFAULT_SERVICE_NAME.length).toBeGreaterThan(0);
      expect(DEFAULT_SERVICE_NAME.length).toBeLessThan(100);
    });
  });

  describe('DEFAULT_SPAN_NAME', () => {
    it('should be defined', () => {
      expect(DEFAULT_SPAN_NAME).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof DEFAULT_SPAN_NAME).toBe('string');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_SPAN_NAME).toBe('unnamed_span');
    });

    it('should follow OpenTelemetry naming conventions', () => {
      // OpenTelemetry recommends snake_case for span names
      expect(DEFAULT_SPAN_NAME).toMatch(/^[a-z][a-z0-9_]*$/);
    });
  });

  describe('DEFAULT_LOGGER_CONTEXT', () => {
    it('should be defined', () => {
      expect(DEFAULT_LOGGER_CONTEXT).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof DEFAULT_LOGGER_CONTEXT).toBe('string');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_LOGGER_CONTEXT).toBe('AustaTracing');
    });

    it('should be a descriptive context name', () => {
      // Logger context should be descriptive and follow PascalCase convention
      expect(DEFAULT_LOGGER_CONTEXT.length).toBeGreaterThan(0);
      expect(DEFAULT_LOGGER_CONTEXT).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
    });
  });

  describe('DEFAULT_SAMPLING_RATE', () => {
    it('should be defined', () => {
      expect(DEFAULT_SAMPLING_RATE).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_SAMPLING_RATE).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_SAMPLING_RATE).toBe(1.0);
    });

    it('should be within valid sampling rate range', () => {
      // Sampling rate should be between 0 and 1 inclusive
      expect(DEFAULT_SAMPLING_RATE).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SAMPLING_RATE).toBeLessThanOrEqual(1);
    });
  });

  describe('DEFAULT_MAX_ATTRIBUTES_PER_SPAN', () => {
    it('should be defined', () => {
      expect(DEFAULT_MAX_ATTRIBUTES_PER_SPAN).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_MAX_ATTRIBUTES_PER_SPAN).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_MAX_ATTRIBUTES_PER_SPAN).toBe(128);
    });

    it('should be a reasonable limit for span attributes', () => {
      // Span attribute limits should be positive and not excessively large
      expect(DEFAULT_MAX_ATTRIBUTES_PER_SPAN).toBeGreaterThan(0);
      expect(DEFAULT_MAX_ATTRIBUTES_PER_SPAN).toBeLessThan(1000);
    });
  });

  describe('DEFAULT_MAX_EVENTS_PER_SPAN', () => {
    it('should be defined', () => {
      expect(DEFAULT_MAX_EVENTS_PER_SPAN).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_MAX_EVENTS_PER_SPAN).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_MAX_EVENTS_PER_SPAN).toBe(128);
    });

    it('should be a reasonable limit for span events', () => {
      // Span event limits should be positive and not excessively large
      expect(DEFAULT_MAX_EVENTS_PER_SPAN).toBeGreaterThan(0);
      expect(DEFAULT_MAX_EVENTS_PER_SPAN).toBeLessThan(1000);
    });
  });

  describe('DEFAULT_MAX_LINKS_PER_SPAN', () => {
    it('should be defined', () => {
      expect(DEFAULT_MAX_LINKS_PER_SPAN).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_MAX_LINKS_PER_SPAN).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_MAX_LINKS_PER_SPAN).toBe(128);
    });

    it('should be a reasonable limit for span links', () => {
      // Span link limits should be positive and not excessively large
      expect(DEFAULT_MAX_LINKS_PER_SPAN).toBeGreaterThan(0);
      expect(DEFAULT_MAX_LINKS_PER_SPAN).toBeLessThan(1000);
    });
  });

  describe('DEFAULT_RETRY_ATTEMPTS', () => {
    it('should be defined', () => {
      expect(DEFAULT_RETRY_ATTEMPTS).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_RETRY_ATTEMPTS).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_RETRY_ATTEMPTS).toBe(3);
    });

    it('should be a reasonable number of retry attempts', () => {
      // Retry attempts should be positive and not excessively large
      expect(DEFAULT_RETRY_ATTEMPTS).toBeGreaterThan(0);
      expect(DEFAULT_RETRY_ATTEMPTS).toBeLessThan(10);
    });
  });

  describe('DEFAULT_RETRY_DELAY_MS', () => {
    it('should be defined', () => {
      expect(DEFAULT_RETRY_DELAY_MS).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_RETRY_DELAY_MS).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_RETRY_DELAY_MS).toBe(100);
    });

    it('should be a reasonable retry delay', () => {
      // Retry delay should be positive and not excessively large
      expect(DEFAULT_RETRY_DELAY_MS).toBeGreaterThan(0);
      expect(DEFAULT_RETRY_DELAY_MS).toBeLessThan(10000); // Less than 10 seconds
    });
  });

  describe('DEFAULT_TIMEOUT_MS', () => {
    it('should be defined', () => {
      expect(DEFAULT_TIMEOUT_MS).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_TIMEOUT_MS).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_TIMEOUT_MS).toBe(30000);
    });

    it('should be a reasonable timeout value', () => {
      // Timeout should be positive and not excessively large or small
      expect(DEFAULT_TIMEOUT_MS).toBeGreaterThan(1000); // At least 1 second
      expect(DEFAULT_TIMEOUT_MS).toBeLessThan(300000); // Less than 5 minutes
    });
  });

  describe('DEFAULT_EXPORT_BATCH_SIZE', () => {
    it('should be defined', () => {
      expect(DEFAULT_EXPORT_BATCH_SIZE).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_EXPORT_BATCH_SIZE).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_EXPORT_BATCH_SIZE).toBe(512);
    });

    it('should be a reasonable batch size', () => {
      // Batch size should be positive and not excessively large
      expect(DEFAULT_EXPORT_BATCH_SIZE).toBeGreaterThan(0);
      expect(DEFAULT_EXPORT_BATCH_SIZE).toBeLessThan(10000);
    });
  });

  describe('DEFAULT_EXPORT_INTERVAL_MS', () => {
    it('should be defined', () => {
      expect(DEFAULT_EXPORT_INTERVAL_MS).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_EXPORT_INTERVAL_MS).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_EXPORT_INTERVAL_MS).toBe(5000);
    });

    it('should be a reasonable export interval', () => {
      // Export interval should be positive and not excessively large or small
      expect(DEFAULT_EXPORT_INTERVAL_MS).toBeGreaterThan(100); // At least 100ms
      expect(DEFAULT_EXPORT_INTERVAL_MS).toBeLessThan(60000); // Less than 1 minute
    });
  });

  describe('DEFAULT_JOURNEY_CONTEXT_ENABLED', () => {
    it('should be defined', () => {
      expect(DEFAULT_JOURNEY_CONTEXT_ENABLED).toBeDefined();
    });

    it('should be a boolean', () => {
      expect(typeof DEFAULT_JOURNEY_CONTEXT_ENABLED).toBe('boolean');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_JOURNEY_CONTEXT_ENABLED).toBe(true);
    });
  });

  describe('DEFAULT_JOURNEY_TYPES', () => {
    it('should be defined', () => {
      expect(DEFAULT_JOURNEY_TYPES).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof DEFAULT_JOURNEY_TYPES).toBe('object');
      expect(DEFAULT_JOURNEY_TYPES).not.toBeNull();
    });

    it('should contain the correct journey types', () => {
      expect(DEFAULT_JOURNEY_TYPES.HEALTH).toBe('health');
      expect(DEFAULT_JOURNEY_TYPES.CARE).toBe('care');
      expect(DEFAULT_JOURNEY_TYPES.PLAN).toBe('plan');
    });

    it('should have the correct number of journey types', () => {
      // There should be exactly 3 journey types as per the AUSTA SuperApp requirements
      expect(Object.keys(DEFAULT_JOURNEY_TYPES).length).toBe(3);
    });

    it('should use lowercase values for journey types', () => {
      // Journey type values should be lowercase for consistency
      Object.values(DEFAULT_JOURNEY_TYPES).forEach(value => {
        expect(value).toBe(value.toLowerCase());
      });
    });
  });

  describe('DEFAULT_EXPORTER_TYPE', () => {
    it('should be defined', () => {
      expect(DEFAULT_EXPORTER_TYPE).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof DEFAULT_EXPORTER_TYPE).toBe('string');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_EXPORTER_TYPE).toBe('console');
    });

    it('should be a valid exporter type', () => {
      // Valid exporter types include 'console', 'jaeger', 'zipkin', 'otlp'
      const validExporterTypes = ['console', 'jaeger', 'zipkin', 'otlp'];
      expect(validExporterTypes).toContain(DEFAULT_EXPORTER_TYPE);
    });
  });

  describe('DEFAULT_ATTRIBUTE_VALUE', () => {
    it('should be defined', () => {
      expect(DEFAULT_ATTRIBUTE_VALUE).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof DEFAULT_ATTRIBUTE_VALUE).toBe('string');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_ATTRIBUTE_VALUE).toBe('unknown');
    });

    it('should be a descriptive fallback value', () => {
      // Fallback value should indicate that the actual value is unknown
      expect(DEFAULT_ATTRIBUTE_VALUE.toLowerCase()).toContain('unknown');
    });
  });
});
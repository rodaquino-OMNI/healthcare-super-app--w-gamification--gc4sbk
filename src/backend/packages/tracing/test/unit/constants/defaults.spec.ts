import {
  DEFAULT_SERVICE_NAME,
  DEFAULT_SPAN_NAME,
  DEFAULT_LOGGER_CONTEXT,
  DEFAULT_SAMPLING_RATE,
  MAX_SPAN_ATTRIBUTES,
  DEFAULT_SPAN_TIMEOUT_MS
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

    it('should be a valid service name format', () => {
      // Service names should follow a consistent pattern with lowercase and hyphens
      expect(DEFAULT_SERVICE_NAME).toMatch(/^[a-z][a-z0-9-]*$/);
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
      expect(DEFAULT_SPAN_NAME).toBe('unnamed-operation');
    });

    it('should be descriptive for debugging', () => {
      // Span names should be descriptive enough to identify unnamed spans in traces
      expect(DEFAULT_SPAN_NAME.length).toBeGreaterThan(5);
      expect(DEFAULT_SPAN_NAME).toContain('unnamed');
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

    it('should follow the logger context naming convention', () => {
      // Logger contexts typically use PascalCase and should be descriptive
      expect(DEFAULT_LOGGER_CONTEXT).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      expect(DEFAULT_LOGGER_CONTEXT).toContain('Tracing');
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
      // Sampling rates should be between 0 and 1 inclusive
      expect(DEFAULT_SAMPLING_RATE).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SAMPLING_RATE).toBeLessThanOrEqual(1);
    });
  });

  describe('MAX_SPAN_ATTRIBUTES', () => {
    it('should be defined', () => {
      expect(MAX_SPAN_ATTRIBUTES).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof MAX_SPAN_ATTRIBUTES).toBe('number');
    });

    it('should have the correct value', () => {
      expect(MAX_SPAN_ATTRIBUTES).toBe(128);
    });

    it('should be a positive integer', () => {
      expect(Number.isInteger(MAX_SPAN_ATTRIBUTES)).toBe(true);
      expect(MAX_SPAN_ATTRIBUTES).toBeGreaterThan(0);
    });

    it('should be reasonable for production use', () => {
      // Span attributes should be limited to prevent excessive memory usage
      // but still allow enough attributes for detailed tracing
      expect(MAX_SPAN_ATTRIBUTES).toBeGreaterThanOrEqual(32); // Minimum reasonable value
      expect(MAX_SPAN_ATTRIBUTES).toBeLessThanOrEqual(1000); // Maximum reasonable value
    });
  });

  describe('DEFAULT_SPAN_TIMEOUT_MS', () => {
    it('should be defined', () => {
      expect(DEFAULT_SPAN_TIMEOUT_MS).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_SPAN_TIMEOUT_MS).toBe('number');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_SPAN_TIMEOUT_MS).toBe(30000); // 30 seconds
    });

    it('should be a positive integer', () => {
      expect(Number.isInteger(DEFAULT_SPAN_TIMEOUT_MS)).toBe(true);
      expect(DEFAULT_SPAN_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it('should be reasonable for typical operations', () => {
      // Span timeouts should be long enough for typical operations
      // but not so long that resources are tied up unnecessarily
      const oneSecondMs = 1000;
      const fiveMinutesMs = 5 * 60 * 1000;
      
      expect(DEFAULT_SPAN_TIMEOUT_MS).toBeGreaterThanOrEqual(oneSecondMs);
      expect(DEFAULT_SPAN_TIMEOUT_MS).toBeLessThanOrEqual(fiveMinutesMs);
    });
  });

  describe('Constant relationships', () => {
    it('should have a service name that matches logger context pattern', () => {
      // The service name prefix should match the logger context prefix
      expect(DEFAULT_LOGGER_CONTEXT.toLowerCase()).toContain(DEFAULT_SERVICE_NAME.split('-')[0].toLowerCase());
    });

    it('should have a span timeout appropriate for the sampling rate', () => {
      // With 100% sampling (1.0), timeouts should be reasonable to prevent resource exhaustion
      if (DEFAULT_SAMPLING_RATE === 1.0) {
        expect(DEFAULT_SPAN_TIMEOUT_MS).toBeLessThanOrEqual(5 * 60 * 1000); // Max 5 minutes
      }
    });
  });
});
import {
  DEFAULT_SERVICE_NAME,
  DEFAULT_SPAN_NAME,
  DEFAULT_LOGGER_CONTEXT,
  DEFAULT_SAMPLING_RATE,
  DEFAULT_EXPORT_RETRY_ATTEMPTS,
  DEFAULT_TRACING_TIMEOUT_MS,
  DEFAULT_BATCH_SIZE,
  DEFAULT_QUEUE_SIZE,
  DEFAULT_SCHEDULE_DELAY_MS,
  DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE
} from '../../../src/constants/defaults';

describe('Tracing Default Constants', () => {
  describe('DEFAULT_SERVICE_NAME', () => {
    it('should be defined', () => {
      expect(DEFAULT_SERVICE_NAME).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_SERVICE_NAME).toBe('austa-service');
    });

    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_SERVICE_NAME).toBe('string');
      expect(DEFAULT_SERVICE_NAME.length).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_SPAN_NAME', () => {
    it('should be defined', () => {
      expect(DEFAULT_SPAN_NAME).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_SPAN_NAME).toBe('unnamed-span');
    });

    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_SPAN_NAME).toBe('string');
      expect(DEFAULT_SPAN_NAME.length).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_LOGGER_CONTEXT', () => {
    it('should be defined', () => {
      expect(DEFAULT_LOGGER_CONTEXT).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_LOGGER_CONTEXT).toBe('AustaTracing');
    });

    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_LOGGER_CONTEXT).toBe('string');
      expect(DEFAULT_LOGGER_CONTEXT.length).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_SAMPLING_RATE', () => {
    it('should be defined', () => {
      expect(DEFAULT_SAMPLING_RATE).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_SAMPLING_RATE).toBe(1.0);
    });

    it('should be a number between 0 and 1', () => {
      expect(typeof DEFAULT_SAMPLING_RATE).toBe('number');
      expect(DEFAULT_SAMPLING_RATE).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SAMPLING_RATE).toBeLessThanOrEqual(1);
    });
  });

  describe('DEFAULT_EXPORT_RETRY_ATTEMPTS', () => {
    it('should be defined', () => {
      expect(DEFAULT_EXPORT_RETRY_ATTEMPTS).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_EXPORT_RETRY_ATTEMPTS).toBe(3);
    });

    it('should be a positive integer', () => {
      expect(typeof DEFAULT_EXPORT_RETRY_ATTEMPTS).toBe('number');
      expect(Number.isInteger(DEFAULT_EXPORT_RETRY_ATTEMPTS)).toBe(true);
      expect(DEFAULT_EXPORT_RETRY_ATTEMPTS).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_TRACING_TIMEOUT_MS', () => {
    it('should be defined', () => {
      expect(DEFAULT_TRACING_TIMEOUT_MS).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_TRACING_TIMEOUT_MS).toBe(30000); // 30 seconds
    });

    it('should be a positive integer', () => {
      expect(typeof DEFAULT_TRACING_TIMEOUT_MS).toBe('number');
      expect(Number.isInteger(DEFAULT_TRACING_TIMEOUT_MS)).toBe(true);
      expect(DEFAULT_TRACING_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it('should be a reasonable timeout value', () => {
      // Timeout should be at least 1 second but not excessively long
      expect(DEFAULT_TRACING_TIMEOUT_MS).toBeGreaterThanOrEqual(1000);
      expect(DEFAULT_TRACING_TIMEOUT_MS).toBeLessThanOrEqual(300000); // 5 minutes max
    });
  });

  describe('DEFAULT_BATCH_SIZE', () => {
    it('should be defined', () => {
      expect(DEFAULT_BATCH_SIZE).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_BATCH_SIZE).toBe(512);
    });

    it('should be a positive integer', () => {
      expect(typeof DEFAULT_BATCH_SIZE).toBe('number');
      expect(Number.isInteger(DEFAULT_BATCH_SIZE)).toBe(true);
      expect(DEFAULT_BATCH_SIZE).toBeGreaterThan(0);
    });

    it('should be a power of 2 for optimal performance', () => {
      // Check if the number is a power of 2 using bitwise operation
      expect(DEFAULT_BATCH_SIZE & (DEFAULT_BATCH_SIZE - 1)).toBe(0);
    });
  });

  describe('DEFAULT_QUEUE_SIZE', () => {
    it('should be defined', () => {
      expect(DEFAULT_QUEUE_SIZE).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_QUEUE_SIZE).toBe(2048);
    });

    it('should be a positive integer', () => {
      expect(typeof DEFAULT_QUEUE_SIZE).toBe('number');
      expect(Number.isInteger(DEFAULT_QUEUE_SIZE)).toBe(true);
      expect(DEFAULT_QUEUE_SIZE).toBeGreaterThan(0);
    });

    it('should be a power of 2 for optimal performance', () => {
      // Check if the number is a power of 2 using bitwise operation
      expect(DEFAULT_QUEUE_SIZE & (DEFAULT_QUEUE_SIZE - 1)).toBe(0);
    });

    it('should be larger than the batch size', () => {
      expect(DEFAULT_QUEUE_SIZE).toBeGreaterThan(DEFAULT_BATCH_SIZE);
    });
  });

  describe('DEFAULT_SCHEDULE_DELAY_MS', () => {
    it('should be defined', () => {
      expect(DEFAULT_SCHEDULE_DELAY_MS).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_SCHEDULE_DELAY_MS).toBe(5000); // 5 seconds
    });

    it('should be a positive integer', () => {
      expect(typeof DEFAULT_SCHEDULE_DELAY_MS).toBe('number');
      expect(Number.isInteger(DEFAULT_SCHEDULE_DELAY_MS)).toBe(true);
      expect(DEFAULT_SCHEDULE_DELAY_MS).toBeGreaterThan(0);
    });

    it('should be a reasonable delay value', () => {
      // Delay should not be too short or too long
      expect(DEFAULT_SCHEDULE_DELAY_MS).toBeGreaterThanOrEqual(1000); // At least 1 second
      expect(DEFAULT_SCHEDULE_DELAY_MS).toBeLessThanOrEqual(60000); // At most 1 minute
    });
  });

  describe('DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE', () => {
    it('should be defined', () => {
      expect(DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE).toBe('austa.journey.context');
    });

    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE).toBe('string');
      expect(DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE.length).toBeGreaterThan(0);
    });

    it('should follow the naming convention for span attributes', () => {
      // OpenTelemetry recommends using dot notation for attribute namespaces
      expect(DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE).toContain('.');
      
      // Should be lowercase for consistency
      const parts = DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE.split('.');
      expect(parts.length).toBeGreaterThanOrEqual(2);
      
      // Check that it follows the vendor.component.attribute pattern
      expect(parts[0]).toBe('austa'); // Vendor/organization
      expect(parts[1]).toBe('journey'); // Component
    });
  });

  describe('Default constants relationships', () => {
    it('should have batch size smaller than queue size', () => {
      expect(DEFAULT_BATCH_SIZE).toBeLessThan(DEFAULT_QUEUE_SIZE);
    });

    it('should have schedule delay less than timeout', () => {
      expect(DEFAULT_SCHEDULE_DELAY_MS).toBeLessThan(DEFAULT_TRACING_TIMEOUT_MS);
    });
  });
});
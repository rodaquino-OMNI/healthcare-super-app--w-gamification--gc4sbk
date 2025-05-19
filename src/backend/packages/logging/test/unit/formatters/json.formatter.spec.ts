import { JsonFormatter } from '../../../src/formatters/json.formatter';
import { LogEntry } from '../../../src/formatters/formatter.interface';
import { LogLevel } from '../../../src/interfaces';
import { 
  standardLogEntries,
  journeyContextEntries,
  errorLogEntries,
  largeObjectEntries,
  circularReferenceEntries
} from '../../fixtures/log-entries.fixture';
import { errorObjects } from '../../fixtures/error-objects.fixture';
import { logContexts } from '../../fixtures/log-contexts.fixture';
import { journeyData } from '../../fixtures/journey-data.fixture';
import { 
  assertJsonFormat, 
  assertLogLevelFormat, 
  assertTimestampFormat,
  assertContextEnrichment,
  assertErrorSerialization
} from '../../utils/assertion.utils';

describe('JsonFormatter', () => {
  let formatter: JsonFormatter;

  beforeEach(() => {
    formatter = new JsonFormatter();
  });

  describe('format', () => {
    it('should format a basic log entry as JSON', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Test message',
        context: { service: 'test-service' }
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed).toEqual({
        timestamp: '2023-01-01T12:00:00.000Z',
        level: 'INFO',
        message: 'Test message',
        context: { service: 'test-service' }
      });
    });

    it('should format log entries with different log levels correctly', () => {
      // Test all log levels
      Object.values(LogLevel).forEach(level => {
        // Arrange
        const entry: LogEntry = {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level,
          message: `Test message for ${level}`,
          context: { service: 'test-service' }
        };

        // Act
        const result = formatter.format(entry);
        const parsed = JSON.parse(result);

        // Assert
        expect(parsed.level).toBe(level);
        assertLogLevelFormat(parsed);
      });
    });

    it('should include all context information in the formatted output', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Test message with context',
        context: logContexts.requestContext
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.context).toEqual(logContexts.requestContext);
      assertContextEnrichment(parsed, 'request');
    });

    it('should properly format timestamps in ISO format', () => {
      // Arrange
      const timestamps = [
        new Date('2023-01-01T12:00:00Z'),
        new Date('2023-01-01T12:00:00.123Z'),
        new Date()
      ];

      timestamps.forEach(timestamp => {
        const entry: LogEntry = {
          timestamp,
          level: LogLevel.INFO,
          message: 'Test timestamp',
          context: {}
        };

        // Act
        const result = formatter.format(entry);
        const parsed = JSON.parse(result);

        // Assert
        expect(parsed.timestamp).toBe(timestamp.toISOString());
        assertTimestampFormat(parsed);
      });
    });

    it('should properly serialize error objects with stack traces', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.ERROR,
        message: 'Error occurred',
        context: {},
        error: errorObjects.standardError
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error).toBeDefined();
      expect(parsed.error.message).toBe(errorObjects.standardError.message);
      expect(parsed.error.stack).toBeDefined();
      assertErrorSerialization(parsed);
    });

    it('should handle custom application exceptions with metadata', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.ERROR,
        message: 'Application error',
        context: {},
        error: errorObjects.applicationException
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error).toBeDefined();
      expect(parsed.error.code).toBe(errorObjects.applicationException.code);
      expect(parsed.error.metadata).toEqual(errorObjects.applicationException.metadata);
      assertErrorSerialization(parsed);
    });

    it('should handle nested error chains', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.ERROR,
        message: 'Nested error',
        context: {},
        error: errorObjects.nestedError
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error).toBeDefined();
      expect(parsed.error.cause).toBeDefined();
      expect(parsed.error.cause.message).toBe(errorObjects.nestedError.cause.message);
      assertErrorSerialization(parsed);
    });

    it('should include journey-specific context in the formatted output', () => {
      // Arrange
      const healthJourneyEntry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Health journey log',
        context: {
          ...logContexts.requestContext,
          journey: journeyData.health.identifier,
          journeyContext: journeyData.health.context
        }
      };

      // Act
      const result = formatter.format(healthJourneyEntry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.context.journey).toBe(journeyData.health.identifier);
      expect(parsed.context.journeyContext).toEqual(journeyData.health.context);
      assertContextEnrichment(parsed, 'journey');
    });

    it('should include correlation IDs for distributed tracing', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Traced operation',
        context: {
          requestId: 'req-123',
          correlationId: 'corr-456',
          traceId: 'trace-789'
        }
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.context.requestId).toBe('req-123');
      expect(parsed.context.correlationId).toBe('corr-456');
      expect(parsed.context.traceId).toBe('trace-789');
      assertContextEnrichment(parsed, 'correlation');
    });

    it('should handle circular references in objects', () => {
      // Arrange
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Circular reference test',
        context: { circular: circularObj }
      };

      // Act & Assert
      expect(() => {
        const result = formatter.format(entry);
        const parsed = JSON.parse(result);
        expect(parsed.context.circular.name).toBe('circular');
        expect(parsed.context.circular.self).toBe('[Circular]');
      }).not.toThrow();
    });

    it('should handle large objects without exceeding size limits', () => {
      // Arrange
      const largeObject = {};
      // Create a large object with 1000 properties
      for (let i = 0; i < 1000; i++) {
        largeObject[`prop${i}`] = `value${i}`;
      }

      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Large object test',
        context: { large: largeObject }
      };

      // Act
      const result = formatter.format(entry);
      
      // Assert
      // Ensure the result is valid JSON and doesn't exceed reasonable size
      expect(() => JSON.parse(result)).not.toThrow();
      expect(result.length).toBeLessThan(1000000); // Reasonable size limit
    });

    it('should handle undefined or null values in context', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Null values test',
        context: {
          nullValue: null,
          undefinedValue: undefined,
          validValue: 'test'
        }
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.context.nullValue).toBeNull();
      expect(parsed.context.undefinedValue).toBeUndefined();
      expect(parsed.context.validValue).toBe('test');
    });

    it('should handle missing optional fields', () => {
      // Arrange
      const minimalEntry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Minimal entry'
        // No context or error
      };

      // Act
      const result = formatter.format(minimalEntry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.level).toBe(LogLevel.INFO);
      expect(parsed.message).toBe('Minimal entry');
      expect(parsed.context).toBeUndefined();
      expect(parsed.error).toBeUndefined();
    });

    it('should format all standard log entries correctly', () => {
      // Test all standard log entries from fixtures
      standardLogEntries.forEach(entry => {
        // Act
        const result = formatter.format(entry);
        const parsed = JSON.parse(result);

        // Assert
        expect(parsed.timestamp).toBe(entry.timestamp.toISOString());
        expect(parsed.level).toBe(entry.level);
        expect(parsed.message).toBe(entry.message);
        assertJsonFormat(parsed);
      });
    });

    it('should format all error log entries correctly', () => {
      // Test all error log entries from fixtures
      errorLogEntries.forEach(entry => {
        // Act
        const result = formatter.format(entry);
        const parsed = JSON.parse(result);

        // Assert
        expect(parsed.error).toBeDefined();
        assertErrorSerialization(parsed);
      });
    });

    it('should format all journey context entries correctly', () => {
      // Test all journey context entries from fixtures
      journeyContextEntries.forEach(entry => {
        // Act
        const result = formatter.format(entry);
        const parsed = JSON.parse(result);

        // Assert
        expect(parsed.context.journey).toBeDefined();
        assertContextEnrichment(parsed, 'journey');
      });
    });
  });
});
import { createLogEntry, formatTimestamp } from '../../../src/utils/format.utils';
import {
  serializeLogEntry,
  deserializeLogEntry,
  serializeWithOptions,
} from '../../../src/utils/serialization.utils';

describe('Serialization Utils', () => {
  describe('serializeLogEntry', () => {
    it('should serialize a simple log entry to JSON string', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const logEntry = createLogEntry('info', 'Test message', { requestId: '123' });
      
      // Force timestamp to be consistent for testing
      logEntry.timestamp = formatTimestamp(timestamp);
      
      // Act
      const serialized = serializeLogEntry(logEntry);
      
      // Assert
      expect(serialized).toBe(JSON.stringify(logEntry));
      expect(serialized).toContain('"timestamp":"2023-01-01T12:00:00.000Z"');
      expect(serialized).toContain('"level":"info"');
      expect(serialized).toContain('"message":"Test message"');
      expect(serialized).toContain('"requestId":"123"');
    });

    it('should handle complex objects with nested properties', () => {
      // Arrange
      const complexContext = {
        requestId: '123',
        user: {
          id: 'user-1',
          profile: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        metadata: {
          source: 'web',
          browser: 'Chrome',
          version: '100.0.0',
        },
      };
      
      const logEntry = createLogEntry('info', 'Complex log', complexContext);
      
      // Act
      const serialized = serializeLogEntry(logEntry);
      const parsed = JSON.parse(serialized);
      
      // Assert
      expect(parsed.context.requestId).toBe('123');
      expect(parsed.context.user.id).toBe('user-1');
      expect(parsed.context.user.profile.name).toBe('Test User');
      expect(parsed.context.metadata.browser).toBe('Chrome');
    });

    it('should handle circular references in objects', () => {
      // Arrange
      const circular: any = {
        name: 'Circular Object',
        nested: {
          data: 'Some data',
        },
      };
      
      // Create circular reference
      circular.self = circular;
      circular.nested.parent = circular;
      
      const logEntry = createLogEntry('info', 'Circular reference test', { circular });
      
      // Act
      const serialized = serializeLogEntry(logEntry);
      const parsed = JSON.parse(serialized);
      
      // Assert
      expect(parsed.context.circular.name).toBe('Circular Object');
      expect(parsed.context.circular.nested.data).toBe('Some data');
      expect(parsed.context.circular.self).toBe('[Circular Reference]');
      expect(parsed.context.circular.nested.parent).toBe('[Circular Reference]');
    });

    it('should properly format timestamps in serialized log entries', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const logEntry = createLogEntry('info', 'Timestamp test');
      
      // Force timestamp to be consistent for testing
      logEntry.timestamp = formatTimestamp(timestamp);
      
      // Act
      const serialized = serializeLogEntry(logEntry);
      const parsed = JSON.parse(serialized);
      
      // Assert
      expect(parsed.timestamp).toBe('2023-01-01T12:00:00.000Z');
      expect(new Date(parsed.timestamp).toISOString()).toBe(timestamp.toISOString());
    });

    it('should handle Error objects in log entries', () => {
      // Arrange
      const error = new Error('Test error');
      error.name = 'TestError';
      const logEntry = createLogEntry('error', 'Error occurred', {}, error);
      
      // Act
      const serialized = serializeLogEntry(logEntry);
      const parsed = JSON.parse(serialized);
      
      // Assert
      expect(parsed.level).toBe('error');
      expect(parsed.message).toBe('Error occurred');
      expect(parsed.error.name).toBe('TestError');
      expect(parsed.error.message).toBe('Test error');
      expect(Array.isArray(parsed.error.stack)).toBe(true);
    });

    it('should consistently serialize context information across different log types', () => {
      // Arrange
      const context = {
        requestId: 'req-123',
        userId: 'user-456',
        journey: 'health',
        traceId: 'trace-789',
        spanId: 'span-012',
        custom: 'value',
      };
      
      const infoLog = createLogEntry('info', 'Info message', context);
      const errorLog = createLogEntry('error', 'Error message', context);
      const warnLog = createLogEntry('warn', 'Warning message', context);
      
      // Act
      const serializedInfo = serializeLogEntry(infoLog);
      const serializedError = serializeLogEntry(errorLog);
      const serializedWarn = serializeLogEntry(warnLog);
      
      const parsedInfo = JSON.parse(serializedInfo);
      const parsedError = JSON.parse(serializedError);
      const parsedWarn = JSON.parse(serializedWarn);
      
      // Assert - context should be consistent across all log types
      expect(parsedInfo.context).toEqual(parsedError.context);
      expect(parsedInfo.context).toEqual(parsedWarn.context);
      expect(parsedInfo.context.requestId).toBe('req-123');
      expect(parsedInfo.context.userId).toBe('user-456');
      expect(parsedInfo.context.journey).toBe('health');
      expect(parsedInfo.context.traceId).toBe('trace-789');
      expect(parsedInfo.context.spanId).toBe('span-012');
      expect(parsedInfo.context.custom).toBe('value');
    });
  });

  describe('deserializeLogEntry', () => {
    it('should deserialize a JSON string back to a log entry object', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const originalEntry = createLogEntry('info', 'Test message', { requestId: '123' });
      originalEntry.timestamp = formatTimestamp(timestamp);
      
      const serialized = serializeLogEntry(originalEntry);
      
      // Act
      const deserialized = deserializeLogEntry(serialized);
      
      // Assert
      expect(deserialized).toEqual(originalEntry);
      expect(deserialized.timestamp).toBe('2023-01-01T12:00:00.000Z');
      expect(deserialized.level).toBe('info');
      expect(deserialized.message).toBe('Test message');
      expect(deserialized.context.requestId).toBe('123');
    });

    it('should handle malformed JSON strings gracefully', () => {
      // Arrange
      const malformedJson = '{"timestamp":"2023-01-01T12:00:00.000Z","level":"info","message":"Broken JSON';
      
      // Act & Assert
      expect(() => deserializeLogEntry(malformedJson)).toThrow();
    });
  });

  describe('serializeWithOptions', () => {
    it('should serialize with pretty printing when specified', () => {
      // Arrange
      const logEntry = createLogEntry('info', 'Pretty print test', { requestId: '123' });
      
      // Act
      const serialized = serializeWithOptions(logEntry, { pretty: true });
      
      // Assert
      expect(serialized).toContain('\n');
      expect(serialized).toContain('  "');
      expect(JSON.parse(serialized)).toEqual(logEntry);
    });

    it('should exclude specified fields when using the exclude option', () => {
      // Arrange
      const logEntry = createLogEntry('info', 'Exclude fields test', {
        requestId: '123',
        sensitive: 'secret-data',
        userId: 'user-456',
      });
      
      // Act
      const serialized = serializeWithOptions(logEntry, { exclude: ['context.sensitive'] });
      const parsed = JSON.parse(serialized);
      
      // Assert
      expect(parsed.context.requestId).toBe('123');
      expect(parsed.context.userId).toBe('user-456');
      expect(parsed.context.sensitive).toBeUndefined();
    });

    it('should limit string length when maxLength option is provided', () => {
      // Arrange
      const longMessage = 'This is a very long message that should be truncated when the maxLength option is used';
      const logEntry = createLogEntry('info', longMessage);
      
      // Act
      const serialized = serializeWithOptions(logEntry, { maxLength: 20 });
      const parsed = JSON.parse(serialized);
      
      // Assert
      expect(parsed.message.length).toBeLessThanOrEqual(23); // 20 + '...' suffix
      expect(parsed.message).toContain('...');
      expect(parsed.message).toContain('This is a very long');
    });

    it('should handle journey-specific data formatting', () => {
      // Arrange
      const healthData = {
        metrics: [
          { id: 1, name: 'Heart Rate', value: 75 },
          { id: 2, name: 'Steps', value: 10000 },
          { id: 3, name: 'Sleep', value: 8 },
        ],
        goals: [
          { id: 1, name: 'Daily Steps', target: 10000, current: 8500 },
        ],
      };
      
      const logEntry = createLogEntry('info', 'Health journey data', {
        journey: 'health',
        journeyData: healthData,
      });
      
      // Act
      const serialized = serializeWithOptions(logEntry, { journeyFormat: true });
      const parsed = JSON.parse(serialized);
      
      // Assert
      expect(parsed.context.journey).toBe('health');
      expect(Array.isArray(parsed.context.journeyData.metrics)).toBe(true);
      expect(parsed.context.journeyData.metrics.length).toBe(3);
      expect(parsed.context.journeyData.goals[0].name).toBe('Daily Steps');
    });
  });
});
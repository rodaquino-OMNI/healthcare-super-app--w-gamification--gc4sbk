import { serializeLogEntry, handleCircularReferences, formatTimestamp, serializeContext } from '../../../src/utils/serialization.utils';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';

describe('Serialization Utils', () => {
  describe('serializeLogEntry', () => {
    it('should serialize a basic log entry to JSON format', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const logEntry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp,
        context: { requestId: '123', userId: '456' }
      };

      // Act
      const serialized = serializeLogEntry(logEntry);

      // Assert
      expect(serialized).toEqual({
        message: 'Test message',
        level: 'INFO',
        timestamp: '2023-01-01T12:00:00.000Z',
        context: { requestId: '123', userId: '456' }
      });
    });

    it('should include journey information in serialized log entry', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const logEntry: LogEntry = {
        message: 'Journey event',
        level: LogLevel.INFO,
        timestamp,
        context: { 
          requestId: '123', 
          userId: '456',
          journey: 'health',
          journeyAction: 'view-metrics'
        }
      };

      // Act
      const serialized = serializeLogEntry(logEntry);

      // Assert
      expect(serialized).toEqual({
        message: 'Journey event',
        level: 'INFO',
        timestamp: '2023-01-01T12:00:00.000Z',
        context: { 
          requestId: '123', 
          userId: '456',
          journey: 'health',
          journeyAction: 'view-metrics'
        }
      });
    });

    it('should include error information in serialized log entry', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const error = new Error('Test error');
      const logEntry: LogEntry = {
        message: 'Error occurred',
        level: LogLevel.ERROR,
        timestamp,
        context: { requestId: '123', userId: '456' },
        error
      };

      // Act
      const serialized = serializeLogEntry(logEntry);

      // Assert
      expect(serialized).toEqual({
        message: 'Error occurred',
        level: 'ERROR',
        timestamp: '2023-01-01T12:00:00.000Z',
        context: { requestId: '123', userId: '456' },
        error: {
          message: 'Test error',
          stack: expect.any(String),
          name: 'Error'
        }
      });
    });

    it('should include metadata in serialized log entry', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const logEntry: LogEntry = {
        message: 'With metadata',
        level: LogLevel.INFO,
        timestamp,
        context: { requestId: '123', userId: '456' },
        metadata: { key1: 'value1', key2: 42 }
      };

      // Act
      const serialized = serializeLogEntry(logEntry);

      // Assert
      expect(serialized).toEqual({
        message: 'With metadata',
        level: 'INFO',
        timestamp: '2023-01-01T12:00:00.000Z',
        context: { requestId: '123', userId: '456' },
        metadata: { key1: 'value1', key2: 42 }
      });
    });
  });

  describe('handleCircularReferences', () => {
    it('should handle objects with circular references', () => {
      // Arrange
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj; // Create circular reference

      // Act
      const result = handleCircularReferences(circularObj);

      // Assert
      expect(result).toEqual({
        name: 'circular',
        self: '[Circular Reference]'
      });
    });

    it('should handle nested objects with circular references', () => {
      // Arrange
      const parent: any = { name: 'parent' };
      const child: any = { name: 'child', parent };
      parent.child = child; // Create circular reference

      // Act
      const result = handleCircularReferences(parent);

      // Assert
      expect(result).toEqual({
        name: 'parent',
        child: {
          name: 'child',
          parent: '[Circular Reference]'
        }
      });
    });

    it('should handle arrays with circular references', () => {
      // Arrange
      const arr: any[] = [1, 2, 3];
      const obj: any = { array: arr };
      arr.push(obj); // Create circular reference

      // Act
      const result = handleCircularReferences(arr);

      // Assert
      expect(result).toEqual([1, 2, 3, { array: '[Circular Reference]' }]);
    });

    it('should handle complex objects with multiple circular references', () => {
      // Arrange
      const obj1: any = { name: 'obj1' };
      const obj2: any = { name: 'obj2', ref1: obj1 };
      const obj3: any = { name: 'obj3', ref2: obj2 };
      obj1.ref3 = obj3; // Create circular reference

      // Act
      const result = handleCircularReferences(obj1);

      // Assert
      expect(result).toEqual({
        name: 'obj1',
        ref3: {
          name: 'obj3',
          ref2: {
            name: 'obj2',
            ref1: '[Circular Reference]'
          }
        }
      });
    });

    it('should not modify objects without circular references', () => {
      // Arrange
      const obj = {
        name: 'test',
        nested: {
          value: 42,
          array: [1, 2, 3]
        }
      };

      // Act
      const result = handleCircularReferences(obj);

      // Assert
      expect(result).toEqual(obj);
    });
  });

  describe('formatTimestamp', () => {
    it('should format Date object to ISO 8601 string', () => {
      // Arrange
      const date = new Date('2023-01-01T12:00:00.000Z');

      // Act
      const result = formatTimestamp(date);

      // Assert
      expect(result).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle date string input', () => {
      // Arrange
      const dateString = '2023-01-01T12:00:00.000Z';

      // Act
      const result = formatTimestamp(dateString);

      // Assert
      expect(result).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle timestamp number input', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z').getTime();

      // Act
      const result = formatTimestamp(timestamp);

      // Assert
      expect(result).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should return current time in ISO format when no timestamp provided', () => {
      // Arrange
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      // Act
      const result = formatTimestamp();

      // Assert
      expect(result).toBe('2023-01-01T12:00:00.000Z');

      // Cleanup
      jest.restoreAllMocks();
    });

    it('should format timestamp with millisecond precision', () => {
      // Arrange
      const date = new Date('2023-01-01T12:00:00.123Z');

      // Act
      const result = formatTimestamp(date);

      // Assert
      expect(result).toBe('2023-01-01T12:00:00.123Z');
    });

    it('should match ISO 8601 format pattern', () => {
      // Arrange
      const date = new Date('2023-01-01T12:00:00.000Z');
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      // Act
      const result = formatTimestamp(date);

      // Assert
      expect(result).toMatch(isoPattern);
    });
  });

  describe('serializeContext', () => {
    it('should serialize basic context object', () => {
      // Arrange
      const context = {
        requestId: '123',
        userId: '456'
      };

      // Act
      const result = serializeContext(context);

      // Assert
      expect(result).toEqual({
        requestId: '123',
        userId: '456'
      });
    });

    it('should serialize journey-specific context', () => {
      // Arrange
      const context = {
        requestId: '123',
        userId: '456',
        journey: 'health',
        journeyAction: 'view-metrics'
      };

      // Act
      const result = serializeContext(context);

      // Assert
      expect(result).toEqual({
        requestId: '123',
        userId: '456',
        journey: 'health',
        journeyAction: 'view-metrics'
      });
    });

    it('should handle context with nested objects', () => {
      // Arrange
      const context = {
        requestId: '123',
        userId: '456',
        journey: 'health',
        metadata: {
          deviceId: 'device-123',
          platform: 'ios'
        }
      };

      // Act
      const result = serializeContext(context);

      // Assert
      expect(result).toEqual({
        requestId: '123',
        userId: '456',
        journey: 'health',
        metadata: {
          deviceId: 'device-123',
          platform: 'ios'
        }
      });
    });

    it('should handle context with circular references', () => {
      // Arrange
      const context: any = {
        requestId: '123',
        userId: '456'
      };
      const metadata: any = {
        context
      };
      context.metadata = metadata; // Create circular reference

      // Act
      const result = serializeContext(context);

      // Assert
      expect(result).toEqual({
        requestId: '123',
        userId: '456',
        metadata: {
          context: '[Circular Reference]'
        }
      });
    });

    it('should return empty object when context is undefined', () => {
      // Act
      const result = serializeContext(undefined);

      // Assert
      expect(result).toEqual({});
    });

    it('should return empty object when context is null', () => {
      // Act
      const result = serializeContext(null);

      // Assert
      expect(result).toEqual({});
    });
  });
});
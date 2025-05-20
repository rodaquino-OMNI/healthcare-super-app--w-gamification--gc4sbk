import { JsonFormatter } from '../../../src/formatters/json.formatter';
import { LogEntry } from '../../../src/formatters/formatter.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

describe('JsonFormatter', () => {
  let formatter: JsonFormatter;

  beforeEach(() => {
    formatter = new JsonFormatter();
  });

  describe('basic formatting', () => {
    it('should format a basic log entry with minimal fields', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const entry: LogEntry = {
        timestamp,
        level: LogLevel.INFO,
        message: 'Test message',
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed).toEqual({
        timestamp: timestamp.toISOString(),
        level: 'INFO',
        levelValue: LogLevel.INFO,
        message: 'Test message',
      });
    });

    it('should format log entries with different log levels', () => {
      // Arrange
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const levels = [
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.FATAL,
      ];

      // Act & Assert
      levels.forEach(level => {
        const entry: LogEntry = {
          timestamp,
          level,
          message: `${LogLevel[level]} message`,
        };

        const result = formatter.format(entry);
        const parsed = JSON.parse(result);

        expect(parsed.level).toBe(LogLevel[level]);
        expect(parsed.levelValue).toBe(level);
        expect(parsed.message).toBe(`${LogLevel[level]} message`);
      });
    });

    it('should include service information when available', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Service info test',
        context: {
          service: 'test-service',
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.service).toBe('test-service');
    });

    it('should include journey information when available', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Journey info test',
        context: {
          journey: 'health',
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.journey).toBe('health');
    });
  });

  describe('context handling', () => {
    it('should format request context correctly', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Request context test',
        context: {
          request: {
            id: 'req-123',
            method: 'GET',
            path: '/api/test',
            userId: 'user-456',
            duration: 42,
            extraField: 'extra-value',
          },
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.request).toBeDefined();
      expect(parsed.request.id).toBe('req-123');
      expect(parsed.request.method).toBe('GET');
      expect(parsed.request.path).toBe('/api/test');
      expect(parsed.request.userId).toBe('user-456');
      expect(parsed.request.duration).toBe(42);
      expect(parsed.request.extraField).toBe('extra-value');
    });

    it('should format trace context correctly', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Trace context test',
        context: {
          trace: {
            id: 'trace-123',
            spanId: 'span-456',
            parentSpanId: 'parent-789',
            extraField: 'extra-value',
          },
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.trace).toBeDefined();
      expect(parsed.trace.id).toBe('trace-123');
      expect(parsed.trace.spanId).toBe('span-456');
      expect(parsed.trace.parentSpanId).toBe('parent-789');
      expect(parsed.trace.extraField).toBe('extra-value');
    });

    it('should include additional context fields', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Additional context test',
        context: {
          service: 'test-service',
          journey: 'health',
          customField1: 'custom-value-1',
          customField2: 42,
          customObject: { key: 'value' },
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.service).toBe('test-service');
      expect(parsed.journey).toBe('health');
      expect(parsed.customField1).toBe('custom-value-1');
      expect(parsed.customField2).toBe(42);
      expect(parsed.customObject).toEqual({ key: 'value' });
    });

    it('should include additional entry fields', () => {
      // Arrange
      const entry: LogEntry & { customField1: string; customField2: number } = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Additional entry fields test',
        customField1: 'custom-value-1',
        customField2: 42,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.customField1).toBe('custom-value-1');
      expect(parsed.customField2).toBe(42);
    });
  });

  describe('error handling', () => {
    it('should format Error objects correctly', () => {
      // Arrange
      const error = new Error('Test error');
      error.name = 'TestError';
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.ERROR,
        message: 'Error test',
        error,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error).toBeDefined();
      expect(parsed.error.message).toBe('Test error');
      expect(parsed.error.name).toBe('TestError');
      expect(Array.isArray(parsed.error.stack)).toBe(true);
      expect(parsed.error.stack.length).toBeGreaterThan(0);
    });

    it('should format string errors correctly', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.ERROR,
        message: 'String error test',
        error: 'String error message',
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error).toBeDefined();
      expect(parsed.error.message).toBe('String error message');
    });

    it('should format custom error objects correctly', () => {
      // Arrange
      const customError = {
        name: 'CustomError',
        message: 'Custom error message',
        code: 'ERR_CUSTOM',
        statusCode: 400,
        details: { field: 'test', reason: 'invalid' },
      };
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.ERROR,
        message: 'Custom error test',
        error: customError,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error).toBeDefined();
      expect(parsed.error.name).toBe('CustomError');
      expect(parsed.error.message).toBe('Custom error message');
      expect(parsed.error.code).toBe('ERR_CUSTOM');
      expect(parsed.error.statusCode).toBe(400);
      expect(parsed.error.details).toEqual({ field: 'test', reason: 'invalid' });
    });

    it('should respect includeStackTrace option', () => {
      // Arrange
      const error = new Error('Test error');
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.ERROR,
        message: 'Stack trace option test',
        error,
      };
      const formatterWithoutStack = new JsonFormatter({ includeStackTrace: false });

      // Act
      const result = formatterWithoutStack.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error).toBeDefined();
      expect(parsed.error.message).toBe('Test error');
      expect(parsed.error.stack).toBeUndefined();
    });
  });

  describe('sensitive information handling', () => {
    it('should redact default sensitive fields', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Sensitive info test',
        context: {
          password: 'secret123',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          apiKey: '1234567890abcdef',
          user: {
            name: 'Test User',
            password: 'userpass',
            creditCardSecret: '4111111111111111',
          },
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.password).toBe('[REDACTED]');
      expect(parsed.token).toBe('[REDACTED]');
      expect(parsed.apiKey).toBe('[REDACTED]');
      expect(parsed.user.name).toBe('Test User');
      expect(parsed.user.password).toBe('[REDACTED]');
      expect(parsed.user.creditCardSecret).toBe('[REDACTED]');
    });

    it('should redact additional sensitive fields', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Additional sensitive fields test',
        context: {
          customSecret: 'very-secret',
          sensitiveData: 'sensitive-value',
        },
      };
      const formatterWithCustomSensitiveKeys = new JsonFormatter({
        additionalSensitiveKeys: ['customSecret', 'sensitiveData'],
      });

      // Act
      const result = formatterWithCustomSensitiveKeys.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.customSecret).toBe('[REDACTED]');
      expect(parsed.sensitiveData).toBe('[REDACTED]');
    });
  });

  describe('edge cases', () => {
    it('should handle circular references', () => {
      // Arrange
      const circular: any = { name: 'circular' };
      circular.self = circular;
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Circular reference test',
        context: {
          circular,
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.circular.name).toBe('circular');
      expect(parsed.circular.self).toBe('[Circular Reference]');
    });

    it('should handle nested circular references', () => {
      // Arrange
      const parent: any = { name: 'parent' };
      const child: any = { name: 'child', parent };
      parent.child = child;
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Nested circular reference test',
        context: {
          parent,
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.parent.name).toBe('parent');
      expect(parsed.parent.child.name).toBe('child');
      expect(parsed.parent.child.parent).toBe('[Circular Reference]');
    });

    it('should handle large objects', () => {
      // Arrange
      const largeObject: any = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Large object test',
        context: {
          largeObject,
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.largeObject).toBeDefined();
      expect(Object.keys(parsed.largeObject).length).toBe(1000);
      expect(parsed.largeObject.key0).toBe('value0');
      expect(parsed.largeObject.key999).toBe('value999');
    });

    it('should handle very long strings', () => {
      // Arrange
      const veryLongString = 'a'.repeat(20000);
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Very long string test',
        context: {
          longString: veryLongString,
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.longString).toContain('... [truncated');
      expect(parsed.longString.length).toBeLessThan(veryLongString.length);
    });
  });

  describe('formatting options', () => {
    it('should support pretty printing', () => {
      // Arrange
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00.000Z'),
        level: LogLevel.INFO,
        message: 'Pretty print test',
        context: {
          field1: 'value1',
          field2: 'value2',
        },
      };
      const prettyFormatter = new JsonFormatter({ pretty: true });

      // Act
      const result = prettyFormatter.format(entry);

      // Assert
      expect(result).toContain('\n');
      expect(result).toContain('  "');
      
      // Verify it's still valid JSON
      const parsed = JSON.parse(result);
      expect(parsed.message).toBe('Pretty print test');
    });
  });
});
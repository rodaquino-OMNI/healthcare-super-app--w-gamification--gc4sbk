import { JSONFormatter } from '../../../src/formatters/json.formatter';
import { LogEntry, ErrorInfo, JourneyContext, JourneyType } from '../../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

describe('JSONFormatter', () => {
  let formatter: JSONFormatter;
  const timestamp = new Date('2023-01-01T12:00:00.000Z');

  beforeEach(() => {
    formatter = new JSONFormatter();
  });

  describe('Basic log formatting', () => {
    it('should format a basic log entry with minimal fields', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed).toEqual(expect.objectContaining({
        message: 'Test message',
        level: 'info',
        levelCode: LogLevel.INFO,
        timestamp: '2023-01-01T12:00:00.000Z',
        service: 'unknown',
        context: 'global'
      }));
    });

    it('should format logs with different log levels correctly', () => {
      // Test all log levels
      const levels = [
        { level: LogLevel.DEBUG, expected: 'debug' },
        { level: LogLevel.INFO, expected: 'info' },
        { level: LogLevel.WARN, expected: 'warn' },
        { level: LogLevel.ERROR, expected: 'error' },
        { level: LogLevel.FATAL, expected: 'fatal' },
      ];

      levels.forEach(({ level, expected }) => {
        // Arrange
        const entry: LogEntry = {
          message: `Test ${expected} message`,
          level,
          timestamp,
        };

        // Act
        const result = formatter.format(entry);
        const parsed = JSON.parse(result);

        // Assert
        expect(parsed.level).toBe(expected);
        expect(parsed.levelCode).toBe(level);
      });
    });

    it('should include service name and context when provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with service and context',
        level: LogLevel.INFO,
        timestamp,
        serviceName: 'test-service',
        context: 'test-context',
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.service).toBe('test-service');
      expect(parsed.context).toBe('test-context');
    });
  });

  describe('Request context formatting', () => {
    it('should include request context when provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with request context',
        level: LogLevel.INFO,
        timestamp,
        requestId: 'req-123',
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test User Agent',
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.request).toEqual({
        id: 'req-123',
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test User Agent',
      });
    });

    it('should not include request context when not provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message without request context',
        level: LogLevel.INFO,
        timestamp,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.request).toBeUndefined();
    });
  });

  describe('User context formatting', () => {
    it('should include user context when provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with user context',
        level: LogLevel.INFO,
        timestamp,
        userId: 'user-123',
        sessionId: 'session-456',
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.user).toEqual({
        id: 'user-123',
        sessionId: 'session-456',
      });
    });

    it('should include partial user context when only userId is provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with partial user context',
        level: LogLevel.INFO,
        timestamp,
        userId: 'user-123',
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.user).toEqual({
        id: 'user-123',
        sessionId: undefined,
      });
    });

    it('should not include user context when not provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message without user context',
        level: LogLevel.INFO,
        timestamp,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.user).toBeUndefined();
    });
  });

  describe('Tracing context formatting', () => {
    it('should include tracing context when provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with tracing context',
        level: LogLevel.INFO,
        timestamp,
        traceId: 'trace-123',
        spanId: 'span-456',
        parentSpanId: 'parent-789',
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.trace).toEqual({
        traceId: 'trace-123',
        spanId: 'span-456',
        parentSpanId: 'parent-789',
      });
    });

    it('should include partial tracing context when only some fields are provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with partial tracing context',
        level: LogLevel.INFO,
        timestamp,
        traceId: 'trace-123',
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.trace).toEqual({
        traceId: 'trace-123',
        spanId: undefined,
        parentSpanId: undefined,
      });
    });

    it('should not include tracing context when not provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message without tracing context',
        level: LogLevel.INFO,
        timestamp,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.trace).toBeUndefined();
    });
  });

  describe('Journey context formatting', () => {
    it('should include journey context when provided', () => {
      // Arrange
      const journeyContext: JourneyContext = {
        type: JourneyType.HEALTH,
        resourceId: 'health-record-123',
        action: 'view',
        data: { metricId: 'weight-123' },
      };

      const entry: LogEntry = {
        message: 'Test message with journey context',
        level: LogLevel.INFO,
        timestamp,
        journey: journeyContext,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.journey).toEqual({
        type: 'health',
        resourceId: 'health-record-123',
        action: 'view',
        data: { metricId: 'weight-123' },
      });
    });

    it('should include minimal journey context when only type is provided', () => {
      // Arrange
      const journeyContext: JourneyContext = {
        type: JourneyType.CARE,
      };

      const entry: LogEntry = {
        message: 'Test message with minimal journey context',
        level: LogLevel.INFO,
        timestamp,
        journey: journeyContext,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.journey).toEqual({
        type: 'care',
      });
    });

    it('should not include journey context when not provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message without journey context',
        level: LogLevel.INFO,
        timestamp,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.journey).toBeUndefined();
    });
  });

  describe('Error formatting', () => {
    it('should format basic error information', () => {
      // Arrange
      const errorInfo: ErrorInfo = {
        message: 'Test error message',
        name: 'TestError',
        code: 'ERR_TEST',
        stack: 'Error: Test error message\n    at TestFunction (test.ts:10:15)',
      };

      const entry: LogEntry = {
        message: 'Test message with error',
        level: LogLevel.ERROR,
        timestamp,
        error: errorInfo,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error).toEqual({
        message: 'Test error message',
        name: 'TestError',
        code: 'ERR_TEST',
        stack: 'Error: Test error message\n    at TestFunction (test.ts:10:15)',
      });
    });

    it('should include error classification flags when provided', () => {
      // Arrange
      const errorInfo: ErrorInfo = {
        message: 'Test error message with classification',
        name: 'TestError',
        isTransient: true,
        isClientError: false,
        isExternalError: true,
      };

      const entry: LogEntry = {
        message: 'Test message with classified error',
        level: LogLevel.ERROR,
        timestamp,
        error: errorInfo,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error).toEqual(expect.objectContaining({
        message: 'Test error message with classification',
        name: 'TestError',
        isTransient: true,
        isClientError: false,
        isExternalError: true,
      }));
    });

    it('should handle original error objects', () => {
      // Arrange
      const originalError = new Error('Original error');
      originalError.name = 'OriginalError';
      
      const errorInfo: ErrorInfo = {
        message: 'Wrapped error message',
        name: 'WrappedError',
        originalError,
      };

      const entry: LogEntry = {
        message: 'Test message with original error',
        level: LogLevel.ERROR,
        timestamp,
        error: errorInfo,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error.originalError).toEqual(expect.objectContaining({
        message: 'Original error',
        name: 'OriginalError',
      }));
      expect(parsed.error.originalError.stack).toBeDefined();
    });

    it('should handle non-Error objects as original errors', () => {
      // Arrange
      const originalError = { code: 'CUSTOM_ERROR', details: 'Custom error details' };
      
      const errorInfo: ErrorInfo = {
        message: 'Error with custom object',
        name: 'CustomObjectError',
        originalError,
      };

      const entry: LogEntry = {
        message: 'Test message with custom error object',
        level: LogLevel.ERROR,
        timestamp,
        error: errorInfo,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.error.originalError).toEqual({
        code: 'CUSTOM_ERROR',
        details: 'Custom error details',
      });
    });
  });

  describe('Context data and metadata formatting', () => {
    it('should include context data when provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with context data',
        level: LogLevel.INFO,
        timestamp,
        contextData: {
          requestParams: { id: '123' },
          responseStatus: 200,
          processingTime: 150,
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.contextData).toEqual({
        requestParams: { id: '123' },
        responseStatus: 200,
        processingTime: 150,
      });
    });

    it('should include metadata when provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with metadata',
        level: LogLevel.INFO,
        timestamp,
        metadata: {
          environment: 'test',
          version: '1.0.0',
          region: 'us-east-1',
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.metadata).toEqual({
        environment: 'test',
        version: '1.0.0',
        region: 'us-east-1',
      });
    });

    it('should not include context data or metadata when not provided', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message without context data or metadata',
        level: LogLevel.INFO,
        timestamp,
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.contextData).toBeUndefined();
      expect(parsed.metadata).toBeUndefined();
    });
  });

  describe('Edge cases and special object handling', () => {
    it('should handle Date objects in nested properties', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with nested Date',
        level: LogLevel.INFO,
        timestamp,
        contextData: {
          createdAt: new Date('2023-02-01T10:30:00.000Z'),
          updatedAt: new Date('2023-02-02T14:45:00.000Z'),
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.contextData).toEqual({
        createdAt: '2023-02-01T10:30:00.000Z',
        updatedAt: '2023-02-02T14:45:00.000Z',
      });
    });

    it('should handle nested Error objects', () => {
      // Arrange
      const nestedError = new Error('Nested error');
      
      const entry: LogEntry = {
        message: 'Test message with nested Error',
        level: LogLevel.ERROR,
        timestamp,
        contextData: {
          error: nestedError,
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.contextData.error).toEqual(expect.objectContaining({
        message: 'Nested error',
        name: 'Error',
      }));
      expect(parsed.contextData.error.stack).toBeDefined();
    });

    it('should handle arrays of objects', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with array of objects',
        level: LogLevel.INFO,
        timestamp,
        contextData: {
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
            { id: 3, name: 'Item 3' },
          ],
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.contextData.items).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]);
    });

    it('should handle circular references', () => {
      // Arrange
      const circular: any = { name: 'Circular Object' };
      circular.self = circular; // Create circular reference
      
      const entry: LogEntry = {
        message: 'Test message with circular reference',
        level: LogLevel.INFO,
        timestamp,
        contextData: {
          circular,
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.contextData.circular.name).toBe('Circular Object');
      expect(parsed.contextData.circular.self).toBe('[Circular or Unserializable]');
    });

    it('should handle null and undefined values', () => {
      // Arrange
      const entry: LogEntry = {
        message: 'Test message with null and undefined',
        level: LogLevel.INFO,
        timestamp,
        contextData: {
          nullValue: null,
          undefinedValue: undefined,
          emptyString: '',
          zero: 0,
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.contextData.nullValue).toBeNull();
      expect(parsed.contextData.undefinedValue).toBeUndefined();
      expect(parsed.contextData.emptyString).toBe('');
      expect(parsed.contextData.zero).toBe(0);
    });

    it('should handle very large objects by sanitizing them', () => {
      // Create a large object with many nested properties
      const createLargeObject = (depth: number, breadth: number, prefix = ''): any => {
        if (depth <= 0) return `Value at ${prefix}`;
        
        const obj: any = {};
        for (let i = 0; i < breadth; i++) {
          obj[`prop${i}${prefix}`] = createLargeObject(depth - 1, breadth, `${prefix}.${i}`);
        }
        return obj;
      };
      
      // Arrange
      const largeObject = createLargeObject(5, 5); // Creates a very large nested object
      
      const entry: LogEntry = {
        message: 'Test message with large object',
        level: LogLevel.INFO,
        timestamp,
        contextData: {
          largeObject,
        },
      };

      // Act
      const result = formatter.format(entry);
      
      // Assert - just verify it doesn't throw and produces valid JSON
      expect(() => {
        JSON.parse(result);
      }).not.toThrow();
    });
  });

  describe('Complete log entry formatting', () => {
    it('should format a complete log entry with all fields', () => {
      // Arrange
      const journeyContext: JourneyContext = {
        type: JourneyType.PLAN,
        resourceId: 'claim-123',
        action: 'submit',
        data: { claimAmount: 500 },
      };

      const errorInfo: ErrorInfo = {
        message: 'Validation error',
        name: 'ValidationError',
        code: 'INVALID_CLAIM',
        isClientError: true,
      };

      const entry: LogEntry = {
        message: 'Complete test log entry',
        level: LogLevel.WARN,
        timestamp,
        serviceName: 'plan-service',
        context: 'ClaimController',
        requestId: 'req-abc-123',
        userId: 'user-xyz-789',
        sessionId: 'session-def-456',
        clientIp: '203.0.113.42',
        userAgent: 'AUSTA-App/1.0',
        traceId: 'trace-ghi-789',
        spanId: 'span-jkl-012',
        parentSpanId: 'parent-mno-345',
        journey: journeyContext,
        error: errorInfo,
        contextData: {
          claimId: 'claim-123',
          validationErrors: ['amount must be positive', 'date is required'],
        },
        metadata: {
          environment: 'production',
          version: '2.3.1',
          region: 'sa-east-1',
        },
      };

      // Act
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed).toEqual(expect.objectContaining({
        message: 'Complete test log entry',
        level: 'warn',
        levelCode: LogLevel.WARN,
        timestamp: '2023-01-01T12:00:00.000Z',
        service: 'plan-service',
        context: 'ClaimController',
        request: {
          id: 'req-abc-123',
          clientIp: '203.0.113.42',
          userAgent: 'AUSTA-App/1.0',
        },
        user: {
          id: 'user-xyz-789',
          sessionId: 'session-def-456',
        },
        trace: {
          traceId: 'trace-ghi-789',
          spanId: 'span-jkl-012',
          parentSpanId: 'parent-mno-345',
        },
        journey: {
          type: 'plan',
          resourceId: 'claim-123',
          action: 'submit',
          data: { claimAmount: 500 },
        },
        error: {
          message: 'Validation error',
          name: 'ValidationError',
          code: 'INVALID_CLAIM',
          isClientError: true,
        },
        contextData: {
          claimId: 'claim-123',
          validationErrors: ['amount must be positive', 'date is required'],
        },
        metadata: {
          environment: 'production',
          version: '2.3.1',
          region: 'sa-east-1',
        },
      }));
    });
  });
});
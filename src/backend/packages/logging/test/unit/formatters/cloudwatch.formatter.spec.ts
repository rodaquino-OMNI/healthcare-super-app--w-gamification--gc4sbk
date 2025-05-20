import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';
import { JsonFormatter } from '../../../src/formatters/json.formatter';
import { LogEntry } from '../../../src/formatters/formatter.interface';

describe('CloudWatchFormatter', () => {
  let formatter: CloudWatchFormatter;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = { ...process.env };
    
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'us-west-2';
    
    formatter = new CloudWatchFormatter();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  it('should be an instance of JsonFormatter', () => {
    expect(formatter).toBeInstanceOf(JsonFormatter);
  });

  describe('format', () => {
    it('should add AWS-specific metadata fields', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'INFO' as any,
        message: 'Test message',
        context: {
          service: 'test-service',
          journey: 'health',
        },
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.aws).toBeDefined();
      expect(result.aws.service).toBe('test-service');
      expect(result.aws.environment).toBe('test');
      expect(result.aws.region).toBe('us-west-2');
      expect(result.aws.journey).toBe('health');
    });

    it('should use default values for AWS metadata when not provided', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'INFO' as any,
        message: 'Test message',
        context: {},
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.aws).toBeDefined();
      expect(result.aws.service).toBe('austa-service');
      expect(result.aws.environment).toBe('test');
      expect(result.aws.region).toBe('us-west-2');
      expect(result.aws.journey).toBe('unknown');
    });

    it('should format timestamp as ISO string for CloudWatch indexing', () => {
      // Arrange
      const testDate = new Date('2023-01-01T12:00:00Z');
      const entry: Partial<LogEntry> = {
        timestamp: testDate,
        level: 'INFO' as any,
        message: 'Test message',
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.timestamp).toBe(testDate.toISOString());
    });

    it('should handle undefined timestamp by using current time', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        level: 'INFO' as any,
        message: 'Test message',
      };
      
      // Mock Date.now() to return a fixed timestamp
      const mockNow = 1672574400000; // 2023-01-01T12:00:00Z
      jest.spyOn(Date, 'now').mockImplementation(() => mockNow);

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.timestamp).toBe(new Date(mockNow).toISOString());
      
      // Restore Date.now
      jest.restoreAllMocks();
    });

    it('should add log level as a top-level field for easier filtering', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'ERROR' as any,
        message: 'Test error message',
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.logLevel).toBe('ERROR');
    });
  });

  describe('error formatting', () => {
    it('should format Error objects for CloudWatch error detection', () => {
      // Arrange
      const testError = new Error('Test error');
      testError.name = 'TestError';
      testError.stack = 'Error: Test error\n    at Test.testMethod (/path/to/file.ts:123:45)';
      
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'ERROR' as any,
        message: 'Error occurred',
        error: testError,
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Test error');
      expect(result.error.name).toBe('TestError');
      expect(result.error.stack).toBeDefined();
    });

    it('should handle string errors', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'ERROR' as any,
        message: 'Error occurred',
        error: 'String error message',
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.error).toBe('String error message');
    });

    it('should handle custom error objects with additional fields', () => {
      // Arrange
      const customError = {
        message: 'Custom error',
        name: 'CustomError',
        code: 'CUSTOM_ERROR_CODE',
        statusCode: 400,
        details: { field: 'username', issue: 'required' },
        journey: 'health',
      };
      
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'ERROR' as any,
        message: 'Error occurred',
        error: customError,
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Custom error');
      expect(result.error.name).toBe('CustomError');
      expect(result.error.code).toBe('CUSTOM_ERROR_CODE');
      expect(result.error.statusCode).toBe(400);
      expect(result.error.details).toEqual({ field: 'username', issue: 'required' });
      expect(result.error.journey).toBe('health');
    });

    it('should handle null or undefined errors', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'INFO' as any,
        message: 'No error',
        error: null,
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.error).toBeNull();
    });
  });

  describe('request context formatting', () => {
    it('should format request context in a CloudWatch-friendly format', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'INFO' as any,
        message: 'Request processed',
        context: {
          request: {
            id: 'req-123',
            method: 'POST',
            path: '/api/health/metrics',
            userId: 'user-456',
            duration: 123.45,
            additionalField: 'value',
          },
        },
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.request).toBeDefined();
      expect(result.request.id).toBe('req-123');
      expect(result.request.method).toBe('POST');
      expect(result.request.path).toBe('/api/health/metrics');
      expect(result.request.userId).toBe('user-456');
      expect(result.request.duration).toBe(123.45);
    });

    it('should handle missing request fields', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'INFO' as any,
        message: 'Request processed',
        context: {
          request: {
            id: 'req-123',
            // Other fields missing
          },
        },
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.request).toBeDefined();
      expect(result.request.id).toBe('req-123');
      expect(result.request.method).toBeUndefined();
      expect(result.request.path).toBeUndefined();
      expect(result.request.userId).toBeUndefined();
      expect(result.request.duration).toBeUndefined();
    });
  });

  describe('trace context formatting', () => {
    it('should format trace context for distributed tracing correlation', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'INFO' as any,
        message: 'Operation traced',
        context: {
          trace: {
            id: 'trace-123',
            spanId: 'span-456',
            parentSpanId: 'parent-span-789',
            additionalField: 'value',
          },
        },
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.trace).toBeDefined();
      expect(result.trace.id).toBe('trace-123');
      expect(result.trace.spanId).toBe('span-456');
      expect(result.trace.parentSpanId).toBe('parent-span-789');
    });

    it('should handle missing trace fields', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'INFO' as any,
        message: 'Operation traced',
        context: {
          trace: {
            id: 'trace-123',
            // Other fields missing
          },
        },
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert
      expect(result.trace).toBeDefined();
      expect(result.trace.id).toBe('trace-123');
      expect(result.trace.spanId).toBeUndefined();
      expect(result.trace.parentSpanId).toBeUndefined();
    });
  });

  describe('integration with JsonFormatter', () => {
    it('should preserve JsonFormatter functionality', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'INFO' as any,
        message: 'Test message',
        metadata: {
          customField: 'customValue',
          nestedObject: {
            nestedField: 'nestedValue',
          },
        },
      };

      // Create both formatters for comparison
      const cloudWatchFormatter = new CloudWatchFormatter();
      const jsonFormatter = new JsonFormatter();
      
      // Mock the JsonFormatter.format method to verify it's called
      const jsonFormatSpy = jest.spyOn(JsonFormatter.prototype, 'format');

      // Act
      const result = JSON.parse(cloudWatchFormatter.format(entry as LogEntry));

      // Assert
      expect(jsonFormatSpy).toHaveBeenCalled();
      expect(result.message).toBe('Test message');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.customField).toBe('customValue');
      expect(result.metadata.nestedObject.nestedField).toBe('nestedValue');
      
      // Restore the spy
      jsonFormatSpy.mockRestore();
    });
  });

  describe('CloudWatch Logs Insights query compatibility', () => {
    it('should structure logs for optimal CloudWatch Logs Insights filtering', () => {
      // Arrange
      const entry: Partial<LogEntry> = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: 'ERROR' as any,
        message: 'Database connection failed',
        context: {
          service: 'database-service',
          journey: 'health',
          request: {
            id: 'req-123',
            method: 'GET',
            path: '/api/health/metrics',
            userId: 'user-456',
            duration: 1500,
          },
          trace: {
            id: 'trace-123',
            spanId: 'span-456',
          },
        },
        error: {
          message: 'Connection refused',
          name: 'ConnectionError',
          code: 'ECONNREFUSED',
          statusCode: 500,
        },
      };

      // Act
      const result = JSON.parse(formatter.format(entry as LogEntry));

      // Assert - Verify fields are structured for CloudWatch Logs Insights queries
      
      // These fields should be at the top level for direct filtering
      expect(result.logLevel).toBe('ERROR');
      expect(result.timestamp).toBe('2023-01-01T12:00:00.000Z');
      expect(result.message).toBe('Database connection failed');
      
      // AWS metadata should be structured for filtering
      expect(result.aws.service).toBe('database-service');
      expect(result.aws.journey).toBe('health');
      expect(result.aws.environment).toBe('test');
      expect(result.aws.region).toBe('us-west-2');
      
      // Request context should be structured for filtering
      expect(result.request.id).toBe('req-123');
      expect(result.request.method).toBe('GET');
      expect(result.request.path).toBe('/api/health/metrics');
      expect(result.request.userId).toBe('user-456');
      expect(result.request.duration).toBe(1500);
      
      // Trace context should be structured for filtering
      expect(result.trace.id).toBe('trace-123');
      expect(result.trace.spanId).toBe('span-456');
      
      // Error should be structured for filtering
      expect(result.error.message).toBe('Connection refused');
      expect(result.error.name).toBe('ConnectionError');
      expect(result.error.code).toBe('ECONNREFUSED');
      expect(result.error.statusCode).toBe(500);
    });
  });
});
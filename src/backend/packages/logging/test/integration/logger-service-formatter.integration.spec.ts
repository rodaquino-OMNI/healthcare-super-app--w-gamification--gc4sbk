import { Test } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { TextFormatter } from '../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../src/formatters/cloudwatch.formatter';
import { Transport } from '../../src/interfaces/transport.interface';
import { TransportType } from '../../src/interfaces/transport-type.enum';
import { JourneyType } from '../../src/formatters/formatter.interface';
import { ContextManager } from '../../src/context/context-manager';
import { TracingService } from '@austa/tracing';

/**
 * Custom transport implementation for testing that captures formatted logs
 * instead of writing them to an actual destination
 */
class TestTransport implements Transport {
  public readonly id: string;
  public readonly type: string;
  public readonly level: LogLevel;
  public readonly active: boolean = true;
  
  public logs: any[] = [];
  public formatter: JsonFormatter | TextFormatter | CloudWatchFormatter;

  constructor(
    id: string,
    formatter: JsonFormatter | TextFormatter | CloudWatchFormatter,
    level: LogLevel = LogLevel.DEBUG
  ) {
    this.id = id;
    this.type = TransportType.CUSTOM;
    this.level = level;
    this.formatter = formatter;
  }

  async initialize(): Promise<void> {
    // No-op for testing
  }

  async write(entry: any): Promise<void> {
    const formatted = this.formatter.format(entry);
    this.logs.push(formatted);
  }

  async writeBatch(batch: any): Promise<void> {
    for (const entry of batch.entries) {
      await this.write(entry);
    }
    if (batch.callback) {
      batch.callback();
    }
  }

  async flush(): Promise<void> {
    // No-op for testing
  }

  async close(): Promise<void> {
    // No-op for testing
  }

  shouldProcess(entry: any): boolean {
    return entry.level >= this.level;
  }

  async handleError(error: Error): Promise<void> {
    console.error('Test transport error:', error);
  }

  // Helper method to clear logs for test isolation
  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Mock implementation of TracingService for testing
 */
class MockTracingService implements Partial<TracingService> {
  getCurrentTraceContext() {
    return {
      traceId: 'test-trace-id',
      spanId: 'test-span-id',
    };
  }
}

describe('LoggerService Formatter Integration', () => {
  let jsonTransport: TestTransport;
  let textTransport: TestTransport;
  let cloudwatchTransport: TestTransport;
  let loggerWithJsonFormatter: LoggerService;
  let loggerWithTextFormatter: LoggerService;
  let loggerWithCloudWatchFormatter: LoggerService;
  let mockTracingService: MockTracingService;

  beforeEach(async () => {
    // Create formatters
    const jsonFormatter = new JsonFormatter();
    const textFormatter = new TextFormatter();
    const cloudwatchFormatter = new CloudWatchFormatter();

    // Create test transports with different formatters
    jsonTransport = new TestTransport('json-transport', jsonFormatter);
    textTransport = new TestTransport('text-transport', textFormatter);
    cloudwatchTransport = new TestTransport('cloudwatch-transport', cloudwatchFormatter);

    // Create mock tracing service
    mockTracingService = new MockTracingService();

    // Create logger configurations for different formatters
    const jsonLoggerConfig: LoggerConfig = {
      serviceName: 'test-service',
      environment: 'test',
      appVersion: '1.0.0',
      logLevel: LogLevel.DEBUG,
      transports: [
        {
          type: TransportType.CUSTOM,
          level: LogLevel.DEBUG,
          // In a real scenario, we'd configure the transport properly
          // For testing, we'll inject our test transport later
        }
      ]
    };

    const textLoggerConfig: LoggerConfig = {
      ...jsonLoggerConfig,
      // Any text-specific config would go here
    };

    const cloudwatchLoggerConfig: LoggerConfig = {
      ...jsonLoggerConfig,
      // Any cloudwatch-specific config would go here
    };

    // Create logger instances
    loggerWithJsonFormatter = new LoggerService(jsonLoggerConfig, mockTracingService);
    loggerWithTextFormatter = new LoggerService(textLoggerConfig, mockTracingService);
    loggerWithCloudWatchFormatter = new LoggerService(cloudwatchLoggerConfig, mockTracingService);

    // Inject test transports
    // Note: This is a bit of a hack for testing purposes
    // In a real scenario, the transports would be created by the TransportFactory
    (loggerWithJsonFormatter as any).transports = [jsonTransport];
    (loggerWithTextFormatter as any).transports = [textTransport];
    (loggerWithCloudWatchFormatter as any).transports = [cloudwatchTransport];
  });

  afterEach(() => {
    // Clear logs between tests
    jsonTransport.clearLogs();
    textTransport.clearLogs();
    cloudwatchTransport.clearLogs();
  });

  describe('JSON Formatter Integration', () => {
    it('should format basic log messages correctly', () => {
      // Act
      loggerWithJsonFormatter.log('Test message');
      
      // Assert
      expect(jsonTransport.logs.length).toBe(1);
      
      // Parse the JSON string back to an object for assertions
      const logObject = JSON.parse(jsonTransport.logs[0] as string);
      
      expect(logObject).toHaveProperty('timestamp');
      expect(logObject).toHaveProperty('level', 'INFO');
      expect(logObject).toHaveProperty('message', 'Test message');
      expect(logObject).toHaveProperty('service', 'test-service');
      expect(logObject).toHaveProperty('environment', 'test');
    });

    it('should include trace context when available', () => {
      // Act
      loggerWithJsonFormatter.log('Test message with trace');
      
      // Assert
      expect(jsonTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(jsonTransport.logs[0] as string);
      
      expect(logObject).toHaveProperty('traceId', 'test-trace-id');
      expect(logObject).toHaveProperty('spanId', 'test-span-id');
    });

    it('should properly format error objects', () => {
      // Arrange
      const testError = new Error('Test error');
      
      // Act
      loggerWithJsonFormatter.error('Error occurred', testError);
      
      // Assert
      expect(jsonTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(jsonTransport.logs[0] as string);
      
      expect(logObject).toHaveProperty('level', 'ERROR');
      expect(logObject).toHaveProperty('message', 'Error occurred');
      expect(logObject).toHaveProperty('error');
      expect(logObject.error).toHaveProperty('name', 'Error');
      expect(logObject.error).toHaveProperty('message', 'Test error');
      expect(logObject.error).toHaveProperty('stack');
    });

    it('should include journey context when provided', () => {
      // Act
      loggerWithJsonFormatter.logWithJourneyContext(
        LogLevel.INFO,
        'Journey-specific log',
        { journey: JourneyType.HEALTH }
      );
      
      // Assert
      expect(jsonTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(jsonTransport.logs[0] as string);
      
      expect(logObject).toHaveProperty('journey', 'health');
      expect(logObject).toHaveProperty('message', 'Journey-specific log');
    });

    it('should include user context when provided', () => {
      // Act
      loggerWithJsonFormatter.logWithUserContext(
        LogLevel.INFO,
        'User-specific log',
        { userId: 'test-user-id', userEmail: 'test@example.com' }
      );
      
      // Assert
      expect(jsonTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(jsonTransport.logs[0] as string);
      
      expect(logObject).toHaveProperty('userId', 'test-user-id');
      expect(logObject).toHaveProperty('userEmail', 'test@example.com');
    });

    it('should include request context when provided', () => {
      // Act
      loggerWithJsonFormatter.logWithRequestContext(
        LogLevel.INFO,
        'Request-specific log',
        { requestId: 'test-request-id', method: 'GET', path: '/api/test' }
      );
      
      // Assert
      expect(jsonTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(jsonTransport.logs[0] as string);
      
      expect(logObject).toHaveProperty('requestId', 'test-request-id');
      expect(logObject).toHaveProperty('method', 'GET');
      expect(logObject).toHaveProperty('path', '/api/test');
    });

    it('should handle complex objects in log context', () => {
      // Arrange
      const complexContext = {
        user: {
          id: 'user-123',
          profile: {
            name: 'Test User',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        metrics: {
          duration: 123.45,
          memory: 67890
        }
      };
      
      // Act
      loggerWithJsonFormatter.log('Complex context log', complexContext);
      
      // Assert
      expect(jsonTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(jsonTransport.logs[0] as string);
      
      // The complex object should be properly serialized
      expect(logObject).toHaveProperty('user');
      expect(logObject.user).toHaveProperty('id', 'user-123');
      expect(logObject.user).toHaveProperty('profile');
      expect(logObject.user.profile).toHaveProperty('name', 'Test User');
      expect(logObject.metrics).toHaveProperty('duration', 123.45);
    });

    it('should create a context logger with inherited context', () => {
      // Arrange
      const contextLogger = loggerWithJsonFormatter.createContextLogger({
        department: 'engineering',
        component: 'auth-service'
      });
      
      // Act
      contextLogger.log('Log from context logger');
      
      // Assert
      expect(jsonTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(jsonTransport.logs[0] as string);
      
      expect(logObject).toHaveProperty('department', 'engineering');
      expect(logObject).toHaveProperty('component', 'auth-service');
      expect(logObject).toHaveProperty('service', 'test-service'); // Inherited from parent
    });
  });

  describe('Text Formatter Integration', () => {
    it('should format basic log messages in human-readable format', () => {
      // Act
      loggerWithTextFormatter.log('Test message');
      
      // Assert
      expect(textTransport.logs.length).toBe(1);
      
      const logText = textTransport.logs[0] as string;
      
      // Text formatter should produce a string with the message
      expect(logText).toContain('Test message');
      // Should include the timestamp
      expect(logText).toMatch(/d{4}-d{2}-d{2}/); // Date format
      // Should include the log level
      expect(logText).toContain('INFO');
      // Should include the service name
      expect(logText).toContain('test-service');
    });

    it('should format error logs with stack traces', () => {
      // Arrange
      const testError = new Error('Test error');
      
      // Act
      loggerWithTextFormatter.error('Error occurred', testError);
      
      // Assert
      expect(textTransport.logs.length).toBe(1);
      
      const logText = textTransport.logs[0] as string;
      
      // Should include the error message
      expect(logText).toContain('Test error');
      // Should include the log level
      expect(logText).toContain('ERROR');
      // Should include the stack trace
      expect(logText).toContain('Error: Test error');
      expect(logText).toContain('at '); // Stack trace line
    });

    it('should include journey context in text format', () => {
      // Act
      loggerWithTextFormatter.logWithJourneyContext(
        LogLevel.INFO,
        'Journey-specific log',
        { journey: JourneyType.CARE }
      );
      
      // Assert
      expect(textTransport.logs.length).toBe(1);
      
      const logText = textTransport.logs[0] as string;
      
      // Should include the journey type
      expect(logText).toContain('care');
      // Should include the message
      expect(logText).toContain('Journey-specific log');
    });

    it('should format complex objects in a readable way', () => {
      // Arrange
      const complexContext = {
        user: {
          id: 'user-123',
          profile: {
            name: 'Test User'
          }
        }
      };
      
      // Act
      loggerWithTextFormatter.log('Complex context log', complexContext);
      
      // Assert
      expect(textTransport.logs.length).toBe(1);
      
      const logText = textTransport.logs[0] as string;
      
      // Should include the complex object in a readable format
      expect(logText).toContain('user-123');
      expect(logText).toContain('Test User');
    });
  });

  describe('CloudWatch Formatter Integration', () => {
    it('should format logs with CloudWatch-specific optimizations', () => {
      // Act
      loggerWithCloudWatchFormatter.log('CloudWatch test message');
      
      // Assert
      expect(cloudwatchTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(cloudwatchTransport.logs[0] as string);
      
      // CloudWatch formatter should add AWS-specific fields
      expect(logObject).toHaveProperty('timestamp');
      expect(logObject).toHaveProperty('level', 'INFO');
      expect(logObject).toHaveProperty('message', 'CloudWatch test message');
      // Should include service metadata for CloudWatch filtering
      expect(logObject).toHaveProperty('service', 'test-service');
      expect(logObject).toHaveProperty('environment', 'test');
    });

    it('should format timestamps in CloudWatch-compatible format', () => {
      // Act
      loggerWithCloudWatchFormatter.log('Timestamp test');
      
      // Assert
      expect(cloudwatchTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(cloudwatchTransport.logs[0] as string);
      
      // CloudWatch expects ISO8601 timestamps
      expect(logObject.timestamp).toMatch(/^d{4}-d{2}-d{2}Td{2}:d{2}:d{2}.d{3}Z$/);
    });

    it('should include AWS-specific metadata for enhanced filtering', () => {
      // Act
      loggerWithCloudWatchFormatter.log('Metadata test');
      
      // Assert
      expect(cloudwatchTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(cloudwatchTransport.logs[0] as string);
      
      // CloudWatch formatter should add AWS-specific metadata
      expect(logObject).toHaveProperty('aws');
      expect(logObject.aws).toHaveProperty('service', 'test-service');
      expect(logObject.aws).toHaveProperty('environment', 'test');
      expect(logObject.aws).toHaveProperty('timestamp');
    });

    it('should format errors for CloudWatch error detection', () => {
      // Arrange
      const testError = new Error('CloudWatch test error');
      
      // Act
      loggerWithCloudWatchFormatter.error('Error for CloudWatch', testError);
      
      // Assert
      expect(cloudwatchTransport.logs.length).toBe(1);
      
      const logObject = JSON.parse(cloudwatchTransport.logs[0] as string);
      
      // CloudWatch formatter should structure errors for CloudWatch error detection
      expect(logObject).toHaveProperty('error');
      expect(logObject.error).toHaveProperty('name', 'Error');
      expect(logObject.error).toHaveProperty('message', 'CloudWatch test error');
      expect(logObject.error).toHaveProperty('stack');
      // Should include error flag for CloudWatch Logs Insights queries
      expect(logObject).toHaveProperty('isError', true);
    });
  });

  describe('Cross-Formatter Context Enrichment', () => {
    it('should maintain consistent context across different formatters', () => {
      // Arrange
      const testContext = {
        requestId: 'shared-request-id',
        userId: 'shared-user-id',
        journey: JourneyType.PLAN
      };
      
      // Act - log the same message with the same context to all loggers
      loggerWithJsonFormatter.log('Cross-formatter test', testContext);
      loggerWithTextFormatter.log('Cross-formatter test', testContext);
      loggerWithCloudWatchFormatter.log('Cross-formatter test', testContext);
      
      // Assert
      // JSON formatter
      const jsonLog = JSON.parse(jsonTransport.logs[0] as string);
      expect(jsonLog).toHaveProperty('requestId', 'shared-request-id');
      expect(jsonLog).toHaveProperty('userId', 'shared-user-id');
      expect(jsonLog).toHaveProperty('journey', 'plan');
      
      // Text formatter - should include the context in some form
      const textLog = textTransport.logs[0] as string;
      expect(textLog).toContain('shared-request-id');
      expect(textLog).toContain('shared-user-id');
      expect(textLog).toContain('plan');
      
      // CloudWatch formatter
      const cloudwatchLog = JSON.parse(cloudwatchTransport.logs[0] as string);
      expect(cloudwatchLog).toHaveProperty('requestId', 'shared-request-id');
      expect(cloudwatchLog).toHaveProperty('userId', 'shared-user-id');
      expect(cloudwatchLog).toHaveProperty('journey', 'plan');
    });

    it('should propagate trace context to all formatters', () => {
      // Act - log to all loggers to capture trace context
      loggerWithJsonFormatter.log('Trace context test');
      loggerWithTextFormatter.log('Trace context test');
      loggerWithCloudWatchFormatter.log('Trace context test');
      
      // Assert
      // JSON formatter
      const jsonLog = JSON.parse(jsonTransport.logs[0] as string);
      expect(jsonLog).toHaveProperty('traceId', 'test-trace-id');
      expect(jsonLog).toHaveProperty('spanId', 'test-span-id');
      
      // Text formatter - should include the trace context in some form
      const textLog = textTransport.logs[0] as string;
      expect(textLog).toContain('test-trace-id');
      
      // CloudWatch formatter
      const cloudwatchLog = JSON.parse(cloudwatchTransport.logs[0] as string);
      expect(cloudwatchLog).toHaveProperty('traceId', 'test-trace-id');
      expect(cloudwatchLog).toHaveProperty('spanId', 'test-span-id');
    });
  });

  describe('Error Handling Between Service and Formatters', () => {
    it('should handle circular references in log objects', () => {
      // Arrange
      const circularObject: any = { name: 'circular' };
      circularObject.self = circularObject; // Create circular reference
      
      // Act - this should not throw despite the circular reference
      loggerWithJsonFormatter.log('Circular reference test', circularObject);
      loggerWithTextFormatter.log('Circular reference test', circularObject);
      loggerWithCloudWatchFormatter.log('Circular reference test', circularObject);
      
      // Assert - all logs should be created without errors
      expect(jsonTransport.logs.length).toBe(1);
      expect(textTransport.logs.length).toBe(1);
      expect(cloudwatchTransport.logs.length).toBe(1);
      
      // JSON formatter should handle circular references
      const jsonLog = JSON.parse(jsonTransport.logs[0] as string);
      expect(jsonLog).toHaveProperty('name', 'circular');
      // The circular reference should be replaced with a placeholder
      expect(jsonLog.self).toContain('[Circular]');
    });

    it('should handle errors thrown during formatting', () => {
      // Arrange - create a formatter that throws an error
      const throwingFormatter = new JsonFormatter();
      jest.spyOn(throwingFormatter, 'format').mockImplementation(() => {
        throw new Error('Formatter error');
      });
      
      const throwingTransport = new TestTransport('throwing-transport', throwingFormatter);
      const loggerWithThrowingFormatter = new LoggerService({
        serviceName: 'test-service',
        environment: 'test',
        logLevel: LogLevel.DEBUG,
      });
      
      // Inject the throwing transport
      (loggerWithThrowingFormatter as any).transports = [throwingTransport];
      
      // Act - this should not throw despite the formatter error
      loggerWithThrowingFormatter.log('This should not throw');
      
      // Assert - the logger should handle the error gracefully
      // No logs should be in the transport since formatting failed
      expect(throwingTransport.logs.length).toBe(0);
      
      // The format method should have been called
      expect(throwingFormatter.format).toHaveBeenCalled();
    });
  });
});
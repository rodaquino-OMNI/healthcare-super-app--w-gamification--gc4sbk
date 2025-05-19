import { Test } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { TextFormatter } from '../../src/formatters/text.formatter';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { ContextManager } from '../../src/context/context-manager';
import { JourneyType } from '../../src/context/context.constants';
import { TransportFactory } from '../../src/transports/transport-factory';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { CloudWatchFormatter } from '../../src/formatters/cloudwatch.formatter';
import { CloudWatchTransport } from '../../src/transports/cloudwatch.transport';
import { FileTransport } from '../../src/transports/file.transport';

/**
 * Mock transport for testing that captures logs instead of sending them
 */
class MockTransport implements Transport {
  public logs: any[] = [];
  private formatter: Formatter;

  constructor(formatter: Formatter) {
    this.formatter = formatter;
  }

  async write(entry: any): Promise<void> {
    const formatted = this.formatter.format(entry);
    this.logs.push(formatted);
    return Promise.resolve();
  }

  getFormatter(): Formatter {
    return this.formatter;
  }
}

describe('Logging Integration', () => {
  let loggerService: LoggerService;
  let contextManager: ContextManager;
  let mockTransport: MockTransport;
  let jsonFormatter: JsonFormatter;

  beforeEach(async () => {
    // Create formatters
    jsonFormatter = new JsonFormatter();
    
    // Create mock transport with the JSON formatter
    mockTransport = new MockTransport(jsonFormatter);
    
    // Create a spy on the TransportFactory to return our mock transport
    jest.spyOn(TransportFactory, 'create').mockImplementation(() => {
      return [mockTransport];
    });

    // Create context manager
    contextManager = new ContextManager();

    // Create logger config
    const config: LoggerConfig = {
      level: LogLevel.DEBUG,
      appName: 'test-app',
      serviceName: 'test-service',
      transports: {
        console: { enabled: true },
      },
    };

    // Create the module with LoggerService
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: 'LOGGER_CONFIG',
          useValue: config,
        },
        LoggerService,
        {
          provide: ContextManager,
          useValue: contextManager,
        },
      ],
    }).compile();

    // Get the LoggerService instance
    loggerService = moduleRef.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockTransport.logs = [];
  });

  describe('End-to-end logging flow', () => {
    it('should log a message through the entire pipeline', () => {
      // Act
      loggerService.log('Test message');

      // Assert
      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toHaveProperty('message', 'Test message');
      expect(mockTransport.logs[0]).toHaveProperty('level', 'INFO');
      expect(mockTransport.logs[0]).toHaveProperty('timestamp');
      expect(mockTransport.logs[0]).toHaveProperty('context');
    });

    it('should log an error with stack trace through the entire pipeline', () => {
      // Arrange
      const error = new Error('Test error');

      // Act
      loggerService.error('Error occurred', error.stack);

      // Assert
      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toHaveProperty('message', 'Error occurred');
      expect(mockTransport.logs[0]).toHaveProperty('level', 'ERROR');
      expect(mockTransport.logs[0]).toHaveProperty('error');
      expect(mockTransport.logs[0].error).toContain('Test error');
    });

    it('should respect log level configuration', () => {
      // Arrange - Create a new logger with WARN level
      const warnConfig: LoggerConfig = {
        level: LogLevel.WARN,
        appName: 'test-app',
        serviceName: 'test-service',
        transports: {
          console: { enabled: true },
        },
      };

      // Reset the mock transport
      mockTransport.logs = [];

      // Create a new logger service with WARN level
      const warnLogger = new LoggerService(warnConfig, contextManager);

      // Act - Log at different levels
      warnLogger.debug('Debug message'); // Should be filtered out
      warnLogger.info('Info message');   // Should be filtered out
      warnLogger.warn('Warn message');   // Should be logged
      warnLogger.error('Error message'); // Should be logged

      // Assert
      expect(mockTransport.logs).toHaveLength(2);
      expect(mockTransport.logs[0]).toHaveProperty('message', 'Warn message');
      expect(mockTransport.logs[0]).toHaveProperty('level', 'WARN');
      expect(mockTransport.logs[1]).toHaveProperty('message', 'Error message');
      expect(mockTransport.logs[1]).toHaveProperty('level', 'ERROR');
    });
  });

  describe('Context propagation', () => {
    it('should include request context in logs', () => {
      // Arrange
      const requestId = 'test-request-id';
      const requestContext = contextManager.createRequestContext({
        requestId,
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });

      // Act - Log with request context
      loggerService.log('Request received', { context: requestContext });

      // Assert
      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].context).toHaveProperty('requestId', requestId);
      expect(mockTransport.logs[0].context).toHaveProperty('method', 'GET');
      expect(mockTransport.logs[0].context).toHaveProperty('url', '/api/test');
    });

    it('should include user context in logs', () => {
      // Arrange
      const userId = 'test-user-id';
      const userContext = contextManager.createUserContext({
        userId,
        isAuthenticated: true,
        roles: ['user'],
      });

      // Act - Log with user context
      loggerService.log('User action', { context: userContext });

      // Assert
      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].context).toHaveProperty('userId', userId);
      expect(mockTransport.logs[0].context).toHaveProperty('isAuthenticated', true);
      expect(mockTransport.logs[0].context.roles).toContain('user');
    });

    it('should include journey context in logs', () => {
      // Arrange
      const journeyContext = contextManager.createJourneyContext({
        journeyType: JourneyType.HEALTH,
        journeyState: { step: 'metrics-input' },
      });

      // Act - Log with journey context
      loggerService.log('Journey progress', { context: journeyContext });

      // Assert
      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].context).toHaveProperty('journeyType', JourneyType.HEALTH);
      expect(mockTransport.logs[0].context.journeyState).toHaveProperty('step', 'metrics-input');
    });

    it('should merge multiple contexts correctly', () => {
      // Arrange
      const requestContext = contextManager.createRequestContext({
        requestId: 'test-request-id',
        method: 'POST',
        url: '/api/health/metrics',
      });

      const userContext = contextManager.createUserContext({
        userId: 'test-user-id',
        isAuthenticated: true,
      });

      const journeyContext = contextManager.createJourneyContext({
        journeyType: JourneyType.HEALTH,
        journeyState: { action: 'save-metrics' },
      });

      // Merge contexts
      const mergedContext = contextManager.mergeContexts([
        requestContext,
        userContext,
        journeyContext,
      ]);

      // Act - Log with merged context
      loggerService.log('Complex operation', { context: mergedContext });

      // Assert
      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].context).toHaveProperty('requestId', 'test-request-id');
      expect(mockTransport.logs[0].context).toHaveProperty('userId', 'test-user-id');
      expect(mockTransport.logs[0].context).toHaveProperty('journeyType', JourneyType.HEALTH);
      expect(mockTransport.logs[0].context.journeyState).toHaveProperty('action', 'save-metrics');
    });
  });

  describe('Formatter integration', () => {
    it('should format logs correctly with JsonFormatter', () => {
      // Act
      loggerService.log('JSON formatted message');

      // Assert
      expect(mockTransport.logs).toHaveLength(1);
      expect(typeof mockTransport.logs[0]).toBe('object');
      expect(mockTransport.logs[0]).toHaveProperty('message', 'JSON formatted message');
      expect(mockTransport.logs[0]).toHaveProperty('timestamp');
      expect(new Date(mockTransport.logs[0].timestamp)).toBeInstanceOf(Date);
    });

    it('should format logs correctly with TextFormatter', () => {
      // Arrange
      const textFormatter = new TextFormatter();
      const textTransport = new MockTransport(textFormatter);
      
      // Replace the mock transport with text formatter
      jest.spyOn(TransportFactory, 'create').mockImplementation(() => {
        return [textTransport];
      });

      // Create a new logger service with text formatter
      const config: LoggerConfig = {
        level: LogLevel.DEBUG,
        appName: 'test-app',
        serviceName: 'test-service',
        transports: {
          console: { enabled: true, formatter: 'text' },
        },
      };
      const textLogger = new LoggerService(config, contextManager);

      // Act
      textLogger.log('Text formatted message');

      // Assert
      expect(textTransport.logs).toHaveLength(1);
      expect(typeof textTransport.logs[0]).toBe('string');
      expect(textTransport.logs[0]).toContain('Text formatted message');
      expect(textTransport.logs[0]).toContain('INFO');
    });

    it('should format logs correctly with CloudWatchFormatter', () => {
      // Arrange
      const cloudWatchFormatter = new CloudWatchFormatter();
      const cloudWatchTransport = new MockTransport(cloudWatchFormatter);
      
      // Replace the mock transport with CloudWatch formatter
      jest.spyOn(TransportFactory, 'create').mockImplementation(() => {
        return [cloudWatchTransport];
      });

      // Create a new logger service with CloudWatch formatter
      const config: LoggerConfig = {
        level: LogLevel.DEBUG,
        appName: 'test-app',
        serviceName: 'test-service',
        transports: {
          cloudwatch: { enabled: true },
        },
      };
      const cloudWatchLogger = new LoggerService(config, contextManager);

      // Act
      cloudWatchLogger.log('CloudWatch formatted message');

      // Assert
      expect(cloudWatchTransport.logs).toHaveLength(1);
      expect(typeof cloudWatchTransport.logs[0]).toBe('object');
      expect(cloudWatchTransport.logs[0]).toHaveProperty('message', 'CloudWatch formatted message');
      expect(cloudWatchTransport.logs[0]).toHaveProperty('aws');
      expect(cloudWatchTransport.logs[0].aws).toHaveProperty('service', 'test-service');
    });
  });

  describe('Transport integration', () => {
    it('should support multiple transports simultaneously', () => {
      // Arrange
      const jsonFormatter = new JsonFormatter();
      const textFormatter = new TextFormatter();
      
      const jsonTransport = new MockTransport(jsonFormatter);
      const textTransport = new MockTransport(textFormatter);
      
      // Replace the mock transport with multiple transports
      jest.spyOn(TransportFactory, 'create').mockImplementation(() => {
        return [jsonTransport, textTransport];
      });

      // Create a new logger service with multiple transports
      const config: LoggerConfig = {
        level: LogLevel.DEBUG,
        appName: 'test-app',
        serviceName: 'test-service',
        transports: {
          console: { enabled: true, formatter: 'json' },
          file: { enabled: true, formatter: 'text' },
        },
      };
      const multiTransportLogger = new LoggerService(config, contextManager);

      // Act
      multiTransportLogger.log('Multi-transport message');

      // Assert
      expect(jsonTransport.logs).toHaveLength(1);
      expect(textTransport.logs).toHaveLength(1);
      expect(typeof jsonTransport.logs[0]).toBe('object');
      expect(typeof textTransport.logs[0]).toBe('string');
      expect(jsonTransport.logs[0]).toHaveProperty('message', 'Multi-transport message');
      expect(textTransport.logs[0]).toContain('Multi-transport message');
    });

    it('should handle transport-specific configuration', () => {
      // Arrange
      const consoleTransport = new ConsoleTransport(new TextFormatter(), { colorize: true });
      const fileTransport = new FileTransport(new JsonFormatter(), { filename: 'test.log', maxSize: '10m' });
      
      // Spy on the write methods
      const consoleSpy = jest.spyOn(consoleTransport, 'write').mockResolvedValue();
      const fileSpy = jest.spyOn(fileTransport, 'write').mockResolvedValue();
      
      // Replace the mock transport with configured transports
      jest.spyOn(TransportFactory, 'create').mockImplementation(() => {
        return [consoleTransport, fileTransport];
      });

      // Create a new logger service with configured transports
      const config: LoggerConfig = {
        level: LogLevel.DEBUG,
        appName: 'test-app',
        serviceName: 'test-service',
        transports: {
          console: { 
            enabled: true, 
            formatter: 'text',
            options: { colorize: true } 
          },
          file: { 
            enabled: true, 
            formatter: 'json',
            options: { filename: 'test.log', maxSize: '10m' } 
          },
        },
      };
      const configuredLogger = new LoggerService(config, contextManager);

      // Act
      configuredLogger.log('Configured transport message');

      // Assert
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(fileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should handle formatter errors gracefully', () => {
      // Arrange - Create a formatter that throws an error
      const errorFormatter = new JsonFormatter();
      jest.spyOn(errorFormatter, 'format').mockImplementation(() => {
        throw new Error('Formatter error');
      });

      const errorTransport = new MockTransport(errorFormatter);
      
      // Replace the mock transport with error transport
      jest.spyOn(TransportFactory, 'create').mockImplementation(() => {
        return [errorTransport];
      });

      // Create a new logger service with error formatter
      const config: LoggerConfig = {
        level: LogLevel.DEBUG,
        appName: 'test-app',
        serviceName: 'test-service',
        transports: {
          console: { enabled: true },
        },
      };
      const errorLogger = new LoggerService(config, contextManager);

      // Create a console spy to verify error is logged
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act - This should not throw despite formatter error
      errorLogger.log('Message with formatter error');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in log formatter'),
        expect.any(Error)
      );
    });

    it('should handle transport errors gracefully', () => {
      // Arrange - Create a transport that throws an error
      const transportError = new Error('Transport error');
      mockTransport.write = jest.fn().mockRejectedValue(transportError);
      
      // Create a console spy to verify error is logged
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act - This should not throw despite transport error
      loggerService.log('Message with transport error');

      // Wait for the promise to resolve/reject
      return new Promise<void>(resolve => {
        setTimeout(() => {
          // Assert
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error in log transport'),
            transportError
          );
          resolve();
        }, 100);
      });
    });

    it('should handle circular references in log objects', () => {
      // Arrange - Create an object with circular reference
      const circular: any = { name: 'circular' };
      circular.self = circular;

      // Act - This should not throw despite circular reference
      loggerService.log('Message with circular reference', { data: circular });

      // Assert
      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toHaveProperty('message', 'Message with circular reference');
      // The circular reference should be replaced with '[Circular]'
      expect(JSON.stringify(mockTransport.logs[0])).toContain('"self":"[Circular]"');
    });
  });

  describe('Tracing integration', () => {
    it('should include trace IDs in log context', () => {
      // Arrange - Mock trace IDs
      const traceId = 'test-trace-id';
      const spanId = 'test-span-id';
      
      // Create a context with trace information
      const contextWithTrace = contextManager.createRequestContext({
        requestId: 'test-request-id',
        traceId,
        spanId,
      });

      // Act
      loggerService.log('Traced message', { context: contextWithTrace });

      // Assert
      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].context).toHaveProperty('traceId', traceId);
      expect(mockTransport.logs[0].context).toHaveProperty('spanId', spanId);
    });

    it('should propagate trace context through the logging pipeline', () => {
      // Arrange - Create a CloudWatch transport that expects trace IDs
      const cloudWatchFormatter = new CloudWatchFormatter();
      const cloudWatchTransport = new MockTransport(cloudWatchFormatter);
      
      // Replace the mock transport with CloudWatch transport
      jest.spyOn(TransportFactory, 'create').mockImplementation(() => {
        return [cloudWatchTransport];
      });

      // Create a new logger service with CloudWatch transport
      const config: LoggerConfig = {
        level: LogLevel.DEBUG,
        appName: 'test-app',
        serviceName: 'test-service',
        transports: {
          cloudwatch: { enabled: true },
        },
      };
      const cloudWatchLogger = new LoggerService(config, contextManager);

      // Create a context with trace information
      const traceId = 'aws-xray-trace-id';
      const contextWithTrace = contextManager.createRequestContext({
        requestId: 'test-request-id',
        traceId,
      });

      // Act
      cloudWatchLogger.log('AWS traced message', { context: contextWithTrace });

      // Assert
      expect(cloudWatchTransport.logs).toHaveLength(1);
      expect(cloudWatchTransport.logs[0].context).toHaveProperty('traceId', traceId);
      // CloudWatch formatter should add AWS X-Ray trace ID in the expected format
      expect(cloudWatchTransport.logs[0].aws).toHaveProperty('xray', expect.objectContaining({
        trace_id: traceId
      }));
    });
  });
});
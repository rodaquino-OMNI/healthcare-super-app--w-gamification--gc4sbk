import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { TextFormatter } from '../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../src/formatters/cloudwatch.formatter';
import { TransportFactory } from '../../src/transports/transport-factory';
import { Transport } from '../../src/interfaces/transport.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { JourneyType } from '../../src/context/context.constants';

/**
 * Mock transport that captures log entries for testing
 */
class MockTransport implements Transport {
  public entries: LogEntry[] = [];
  public formattedLogs: string[] = [];
  private formatter: any;

  constructor(formatter: any) {
    this.formatter = formatter;
  }

  write(entry: LogEntry): void {
    this.entries.push({ ...entry });
    this.formattedLogs.push(this.formatter.format(entry));
  }
}

/**
 * Mock transport factory that creates mock transports with the specified formatter
 */
class MockTransportFactory {
  private formatter: any;
  private transport: MockTransport;

  constructor(formatter: any) {
    this.formatter = formatter;
    this.transport = new MockTransport(formatter);
  }

  createTransports(): Transport[] {
    return [this.transport];
  }

  getTransport(): MockTransport {
    return this.transport;
  }
}

/**
 * Integration tests for LoggerService with various formatters
 * 
 * These tests verify the correct interaction between LoggerService and the
 * various formatters (JSON, Text, CloudWatch) with minimal mocking.
 */
describe('LoggerService Formatter Integration', () => {
  // Test with JSON formatter
  describe('LoggerService with JsonFormatter', () => {
    let loggerService: LoggerService;
    let jsonFormatter: JsonFormatter;
    let transportFactory: MockTransportFactory;
    let mockTransport: MockTransport;

    beforeEach(async () => {
      // Create real JsonFormatter instance
      jsonFormatter = new JsonFormatter();
      
      // Create mock transport factory with the real formatter
      transportFactory = new MockTransportFactory(jsonFormatter);
      mockTransport = transportFactory.getTransport();

      // Create logger service with mock config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'LOGGER_CONFIG',
            useValue: {
              level: LogLevel.DEBUG,
              defaultContext: {
                application: 'austa-superapp',
                service: 'test-service',
                environment: 'test',
              },
              journeyLevels: {},
              tracing: { enabled: false },
            },
          },
          {
            provide: TransportFactory,
            useValue: transportFactory,
          },
          LoggerService,
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should format log entries as JSON', () => {
      // Act
      loggerService.log('Test message');
      
      // Assert
      expect(mockTransport.entries.length).toBe(1);
      expect(mockTransport.formattedLogs.length).toBe(1);
      
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      // Verify JSON structure
      expect(parsedLog).toHaveProperty('timestamp');
      expect(parsedLog).toHaveProperty('level', LogLevel.INFO);
      expect(parsedLog).toHaveProperty('message', 'Test message');
      expect(parsedLog).toHaveProperty('service', 'test-service');
    });

    it('should include error details in JSON format', () => {
      // Arrange
      const testError = new Error('Test error');
      
      // Act
      loggerService.error('Error occurred', testError);
      
      // Assert
      expect(mockTransport.entries.length).toBe(1);
      
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      // Verify error structure
      expect(parsedLog).toHaveProperty('error');
      expect(parsedLog.error).toHaveProperty('message', 'Test error');
      expect(parsedLog.error).toHaveProperty('name', 'Error');
      expect(parsedLog.error).toHaveProperty('stack');
    });

    it('should include context information in JSON format', () => {
      // Act
      loggerService.log('Context test', { userId: '123', requestId: 'req-456' });
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      // Verify context structure
      expect(parsedLog).toHaveProperty('context');
      expect(parsedLog.context).toHaveProperty('userId', '123');
      expect(parsedLog.context).toHaveProperty('requestId', 'req-456');
    });

    it('should handle nested objects in context', () => {
      // Arrange
      const complexContext = {
        user: {
          id: '123',
          roles: ['admin', 'user'],
          profile: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        request: {
          id: 'req-456',
          path: '/api/test',
          method: 'GET',
        },
      };
      
      // Act
      loggerService.log('Complex context test', complexContext);
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      // Verify complex context structure
      expect(parsedLog).toHaveProperty('context');
      expect(parsedLog.context).toHaveProperty('user');
      expect(parsedLog.context.user).toHaveProperty('id', '123');
      expect(parsedLog.context.user).toHaveProperty('roles');
      expect(parsedLog.context.user.roles).toEqual(['admin', 'user']);
      expect(parsedLog.context.user).toHaveProperty('profile');
      expect(parsedLog.context.user.profile).toHaveProperty('name', 'Test User');
      expect(parsedLog.context.user.profile).toHaveProperty('email', 'test@example.com');
      expect(parsedLog.context).toHaveProperty('request');
      expect(parsedLog.context.request).toHaveProperty('id', 'req-456');
      expect(parsedLog.context.request).toHaveProperty('path', '/api/test');
      expect(parsedLog.context.request).toHaveProperty('method', 'GET');
    });
  });

  // Test with Text formatter
  describe('LoggerService with TextFormatter', () => {
    let loggerService: LoggerService;
    let textFormatter: TextFormatter;
    let transportFactory: MockTransportFactory;
    let mockTransport: MockTransport;

    beforeEach(async () => {
      // Create real TextFormatter instance
      textFormatter = new TextFormatter();
      
      // Create mock transport factory with the real formatter
      transportFactory = new MockTransportFactory(textFormatter);
      mockTransport = transportFactory.getTransport();

      // Create logger service with mock config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'LOGGER_CONFIG',
            useValue: {
              level: LogLevel.DEBUG,
              defaultContext: {
                application: 'austa-superapp',
                service: 'test-service',
                environment: 'test',
              },
              journeyLevels: {},
              tracing: { enabled: false },
            },
          },
          {
            provide: TransportFactory,
            useValue: transportFactory,
          },
          LoggerService,
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should format log entries as human-readable text', () => {
      // Act
      loggerService.log('Test message');
      
      // Assert
      expect(mockTransport.entries.length).toBe(1);
      expect(mockTransport.formattedLogs.length).toBe(1);
      
      const formattedLog = mockTransport.formattedLogs[0];
      
      // Verify text format contains key elements
      expect(formattedLog).toContain('Test message');
      expect(formattedLog).toContain('INFO');
      expect(formattedLog).toContain('test-service');
    });

    it('should include error details in text format', () => {
      // Arrange
      const testError = new Error('Test error');
      
      // Act
      loggerService.error('Error occurred', testError);
      
      // Assert
      expect(mockTransport.entries.length).toBe(1);
      
      const formattedLog = mockTransport.formattedLogs[0];
      
      // Verify error text format
      expect(formattedLog).toContain('Error occurred');
      expect(formattedLog).toContain('ERROR');
      expect(formattedLog).toContain('Test error');
      // Should contain part of stack trace
      expect(formattedLog).toContain('at ');
    });

    it('should include context information in text format', () => {
      // Act
      loggerService.log('Context test', { userId: '123', requestId: 'req-456' });
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      
      // Verify context in text format
      expect(formattedLog).toContain('Context test');
      expect(formattedLog).toContain('userId: \'123\'');
      expect(formattedLog).toContain('requestId: \'req-456\'');
    });

    it('should format journey-specific logs with visual indicators', () => {
      // Create journey-specific loggers
      const healthLogger = loggerService.forHealthJourney();
      const careLogger = loggerService.forCareJourney();
      const planLogger = loggerService.forPlanJourney();
      
      // Act
      healthLogger.log('Health journey log');
      careLogger.log('Care journey log');
      planLogger.log('Plan journey log');
      
      // Assert
      expect(mockTransport.entries.length).toBe(3);
      
      // Verify health journey log
      const healthLog = mockTransport.formattedLogs[0];
      expect(healthLog).toContain('Health journey log');
      expect(healthLog).toContain(JourneyType.HEALTH);
      
      // Verify care journey log
      const careLog = mockTransport.formattedLogs[1];
      expect(careLog).toContain('Care journey log');
      expect(careLog).toContain(JourneyType.CARE);
      
      // Verify plan journey log
      const planLog = mockTransport.formattedLogs[2];
      expect(planLog).toContain('Plan journey log');
      expect(planLog).toContain(JourneyType.PLAN);
    });
  });

  // Test with CloudWatch formatter
  describe('LoggerService with CloudWatchFormatter', () => {
    let loggerService: LoggerService;
    let cloudWatchFormatter: CloudWatchFormatter;
    let transportFactory: MockTransportFactory;
    let mockTransport: MockTransport;

    beforeEach(async () => {
      // Create real CloudWatchFormatter instance
      cloudWatchFormatter = new CloudWatchFormatter();
      
      // Create mock transport factory with the real formatter
      transportFactory = new MockTransportFactory(cloudWatchFormatter);
      mockTransport = transportFactory.getTransport();

      // Create logger service with mock config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'LOGGER_CONFIG',
            useValue: {
              level: LogLevel.DEBUG,
              defaultContext: {
                application: 'austa-superapp',
                service: 'test-service',
                environment: 'test',
              },
              journeyLevels: {},
              tracing: { enabled: false },
            },
          },
          {
            provide: TransportFactory,
            useValue: transportFactory,
          },
          LoggerService,
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should format log entries for CloudWatch', () => {
      // Act
      loggerService.log('Test message');
      
      // Assert
      expect(mockTransport.entries.length).toBe(1);
      expect(mockTransport.formattedLogs.length).toBe(1);
      
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      // Verify CloudWatch format
      expect(parsedLog).toHaveProperty('@timestamp');
      expect(parsedLog).toHaveProperty('level', LogLevel.INFO);
      expect(parsedLog).toHaveProperty('message', 'Test message');
      expect(parsedLog).toHaveProperty('service', 'test-service');
      expect(parsedLog).toHaveProperty('aws');
      expect(parsedLog.aws).toHaveProperty('region');
    });

    it('should include flattened context for CloudWatch Logs Insights queries', () => {
      // Act
      loggerService.log('Context test', { 
        user: { id: '123', name: 'Test User' },
        request: { id: 'req-456', path: '/api/test' }
      });
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      // Verify flattened context
      expect(parsedLog).toHaveProperty('ctx.user.id', '123');
      expect(parsedLog).toHaveProperty('ctx.user.name', 'Test User');
      expect(parsedLog).toHaveProperty('ctx.request.id', 'req-456');
      expect(parsedLog).toHaveProperty('ctx.request.path', '/api/test');
    });

    it('should format errors for CloudWatch error detection', () => {
      // Arrange
      const testError = new Error('Test error');
      testError.name = 'ValidationError';
      Object.defineProperty(testError, 'code', { value: 'ERR_VALIDATION' });
      Object.defineProperty(testError, 'statusCode', { value: 400 });
      
      // Act
      loggerService.error('Error occurred', testError);
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      // Verify CloudWatch error format
      expect(parsedLog).toHaveProperty('error', 'Test error');
      expect(parsedLog).toHaveProperty('errorDetails');
      expect(parsedLog.errorDetails).toHaveProperty('message', 'Test error');
      expect(parsedLog.errorDetails).toHaveProperty('name', 'ValidationError');
      expect(parsedLog.errorDetails).toHaveProperty('stack');
      expect(parsedLog.errorDetails).toHaveProperty('code', 'ERR_VALIDATION');
      expect(parsedLog.errorDetails).toHaveProperty('statusCode', 400);
      expect(parsedLog).toHaveProperty('errorCode', 'ERR_VALIDATION');
      expect(parsedLog).toHaveProperty('statusCode', 400);
    });

    it('should format journey context for CloudWatch', () => {
      // Create journey-specific logger with context
      const healthLogger = loggerService.forHealthJourney({
        journeyId: 'health-123',
        metadata: {
          metricType: 'weight',
          deviceId: 'device-456',
        },
      });
      
      // Act
      healthLogger.log('Health metric recorded');
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      // Verify journey context in CloudWatch format
      expect(parsedLog).toHaveProperty('journey', JourneyType.HEALTH);
      expect(parsedLog).toHaveProperty('journeyId', 'health-123');
      expect(parsedLog).toHaveProperty('health.metricType', 'weight');
      expect(parsedLog).toHaveProperty('health.deviceId', 'device-456');
    });
  });

  // Test context enrichment across formatter boundaries
  describe('Context enrichment across formatters', () => {
    let jsonLoggerService: LoggerService;
    let textLoggerService: LoggerService;
    let cloudWatchLoggerService: LoggerService;
    let jsonTransport: MockTransport;
    let textTransport: MockTransport;
    let cloudWatchTransport: MockTransport;

    beforeEach(async () => {
      // Create real formatter instances
      const jsonFormatter = new JsonFormatter();
      const textFormatter = new TextFormatter();
      const cloudWatchFormatter = new CloudWatchFormatter();
      
      // Create mock transport factories with real formatters
      const jsonTransportFactory = new MockTransportFactory(jsonFormatter);
      const textTransportFactory = new MockTransportFactory(textFormatter);
      const cloudWatchTransportFactory = new MockTransportFactory(cloudWatchFormatter);
      
      // Get mock transports
      jsonTransport = jsonTransportFactory.getTransport();
      textTransport = textTransportFactory.getTransport();
      cloudWatchTransport = cloudWatchTransportFactory.getTransport();

      // Create logger services with mock config
      const baseConfig = {
        level: LogLevel.DEBUG,
        defaultContext: {
          application: 'austa-superapp',
          service: 'test-service',
          environment: 'test',
        },
        journeyLevels: {},
        tracing: { enabled: false },
      };

      // Create JSON logger service
      const jsonModule: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'LOGGER_CONFIG',
            useValue: baseConfig,
          },
          {
            provide: TransportFactory,
            useValue: jsonTransportFactory,
          },
          LoggerService,
        ],
      }).compile();

      // Create Text logger service
      const textModule: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'LOGGER_CONFIG',
            useValue: baseConfig,
          },
          {
            provide: TransportFactory,
            useValue: textTransportFactory,
          },
          LoggerService,
        ],
      }).compile();

      // Create CloudWatch logger service
      const cloudWatchModule: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'LOGGER_CONFIG',
            useValue: baseConfig,
          },
          {
            provide: TransportFactory,
            useValue: cloudWatchTransportFactory,
          },
          LoggerService,
        ],
      }).compile();

      jsonLoggerService = jsonModule.get<LoggerService>(LoggerService);
      textLoggerService = textModule.get<LoggerService>(LoggerService);
      cloudWatchLoggerService = cloudWatchModule.get<LoggerService>(LoggerService);
    });

    it('should maintain consistent context across different formatters', () => {
      // Create enriched context
      const context = {
        userId: 'user-123',
        requestId: 'req-456',
        sessionId: 'session-789',
        journey: JourneyType.HEALTH,
        journeyContext: {
          journeyId: 'health-123',
          step: 'record-metric',
          metadata: {
            metricType: 'weight',
            value: 75.5,
            unit: 'kg',
          },
        },
      };

      // Create context-enriched loggers
      const jsonLogger = jsonLoggerService.withContext(context);
      const textLogger = textLoggerService.withContext(context);
      const cloudWatchLogger = cloudWatchLoggerService.withContext(context);

      // Log with all formatters
      jsonLogger.log('Test with JSON formatter');
      textLogger.log('Test with Text formatter');
      cloudWatchLogger.log('Test with CloudWatch formatter');

      // Verify JSON formatter preserves context
      const jsonLog = JSON.parse(jsonTransport.formattedLogs[0]);
      expect(jsonLog).toHaveProperty('context');
      expect(jsonLog.context).toHaveProperty('userId', 'user-123');
      expect(jsonLog.context).toHaveProperty('requestId', 'req-456');
      expect(jsonLog.context).toHaveProperty('sessionId', 'session-789');
      expect(jsonLog).toHaveProperty('journey', JourneyType.HEALTH);
      expect(jsonLog).toHaveProperty('journeyContext');
      expect(jsonLog.journeyContext).toHaveProperty('journeyId', 'health-123');
      expect(jsonLog.journeyContext).toHaveProperty('step', 'record-metric');
      expect(jsonLog.journeyContext).toHaveProperty('metadata');
      expect(jsonLog.journeyContext.metadata).toHaveProperty('metricType', 'weight');
      expect(jsonLog.journeyContext.metadata).toHaveProperty('value', 75.5);
      expect(jsonLog.journeyContext.metadata).toHaveProperty('unit', 'kg');

      // Verify Text formatter includes context
      const textLog = textTransport.formattedLogs[0];
      expect(textLog).toContain('Test with Text formatter');
      expect(textLog).toContain('userId: \'user-123\'');
      expect(textLog).toContain('requestId: \'req-456\'');
      expect(textLog).toContain('sessionId: \'session-789\'');
      expect(textLog).toContain(JourneyType.HEALTH);
      expect(textLog).toContain('journeyId: \'health-123\'');
      expect(textLog).toContain('step: \'record-metric\'');
      expect(textLog).toContain('metricType: \'weight\'');
      expect(textLog).toContain('value: 75.5');
      expect(textLog).toContain('unit: \'kg\'');

      // Verify CloudWatch formatter flattens context
      const cloudWatchLog = JSON.parse(cloudWatchTransport.formattedLogs[0]);
      expect(cloudWatchLog).toHaveProperty('journey', JourneyType.HEALTH);
      expect(cloudWatchLog).toHaveProperty('journeyId', 'health-123');
      expect(cloudWatchLog).toHaveProperty('ctx.userId', 'user-123');
      expect(cloudWatchLog).toHaveProperty('ctx.requestId', 'req-456');
      expect(cloudWatchLog).toHaveProperty('ctx.sessionId', 'session-789');
      expect(cloudWatchLog).toHaveProperty('health.metricType', 'weight');
      expect(cloudWatchLog).toHaveProperty('health.value', 75.5);
      expect(cloudWatchLog).toHaveProperty('health.unit', 'kg');
    });
  });

  // Test error handling and serialization
  describe('Error handling and serialization', () => {
    let loggerService: LoggerService;
    let jsonFormatter: JsonFormatter;
    let transportFactory: MockTransportFactory;
    let mockTransport: MockTransport;

    beforeEach(async () => {
      // Create real JsonFormatter instance
      jsonFormatter = new JsonFormatter();
      
      // Create mock transport factory with the real formatter
      transportFactory = new MockTransportFactory(jsonFormatter);
      mockTransport = transportFactory.getTransport();

      // Create logger service with mock config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'LOGGER_CONFIG',
            useValue: {
              level: LogLevel.DEBUG,
              defaultContext: {
                application: 'austa-superapp',
                service: 'test-service',
                environment: 'test',
              },
              journeyLevels: {},
              tracing: { enabled: false },
            },
          },
          {
            provide: TransportFactory,
            useValue: transportFactory,
          },
          LoggerService,
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should properly serialize basic Error objects', () => {
      // Arrange
      const basicError = new Error('Basic error message');
      
      // Act
      loggerService.error('Error occurred', basicError);
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      expect(parsedLog).toHaveProperty('error');
      expect(parsedLog.error).toHaveProperty('message', 'Basic error message');
      expect(parsedLog.error).toHaveProperty('name', 'Error');
      expect(parsedLog.error).toHaveProperty('stack');
    });

    it('should handle custom error properties', () => {
      // Arrange
      class CustomError extends Error {
        code: string;
        statusCode: number;
        isOperational: boolean;
        details: Record<string, any>;

        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
          this.code = 'ERR_CUSTOM';
          this.statusCode = 400;
          this.isOperational = true;
          this.details = {
            field: 'username',
            constraint: 'required',
          };
        }
      }

      const customError = new CustomError('Custom error with properties');
      
      // Act
      loggerService.error('Custom error occurred', customError);
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      expect(parsedLog).toHaveProperty('error');
      expect(parsedLog.error).toHaveProperty('message', 'Custom error with properties');
      expect(parsedLog.error).toHaveProperty('name', 'CustomError');
      expect(parsedLog.error).toHaveProperty('code', 'ERR_CUSTOM');
      expect(parsedLog.error).toHaveProperty('statusCode', 400);
      expect(parsedLog.error).toHaveProperty('isOperational', true);
      expect(parsedLog.error).toHaveProperty('details');
      expect(parsedLog.error.details).toHaveProperty('field', 'username');
      expect(parsedLog.error.details).toHaveProperty('constraint', 'required');
    });

    it('should handle nested errors with cause property', () => {
      // Arrange
      const rootCause = new Error('Database connection failed');
      rootCause.name = 'ConnectionError';
      Object.defineProperty(rootCause, 'code', { value: 'ERR_DB_CONNECT' });

      const midError = new Error('Query execution failed');
      midError.name = 'QueryError';
      Object.defineProperty(midError, 'code', { value: 'ERR_QUERY' });
      Object.defineProperty(midError, 'cause', { value: rootCause });

      const topError = new Error('User data retrieval failed');
      topError.name = 'UserDataError';
      Object.defineProperty(topError, 'code', { value: 'ERR_USER_DATA' });
      Object.defineProperty(topError, 'cause', { value: midError });
      
      // Act
      loggerService.error('Failed to get user data', topError);
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      // Verify top-level error
      expect(parsedLog).toHaveProperty('error');
      expect(parsedLog.error).toHaveProperty('message', 'User data retrieval failed');
      expect(parsedLog.error).toHaveProperty('name', 'UserDataError');
      expect(parsedLog.error).toHaveProperty('code', 'ERR_USER_DATA');
      
      // Verify mid-level error (cause)
      expect(parsedLog.error).toHaveProperty('cause');
      expect(parsedLog.error.cause).toHaveProperty('message', 'Query execution failed');
      expect(parsedLog.error.cause).toHaveProperty('name', 'QueryError');
      expect(parsedLog.error.cause).toHaveProperty('code', 'ERR_QUERY');
      
      // Verify root cause error
      expect(parsedLog.error.cause).toHaveProperty('cause');
      expect(parsedLog.error.cause.cause).toHaveProperty('message', 'Database connection failed');
      expect(parsedLog.error.cause.cause).toHaveProperty('name', 'ConnectionError');
      expect(parsedLog.error.cause.cause).toHaveProperty('code', 'ERR_DB_CONNECT');
    });

    it('should handle circular references in error objects', () => {
      // Arrange
      const circularObj: any = {};
      circularObj.self = circularObj;
      
      const errorWithCircular = new Error('Error with circular reference');
      Object.defineProperty(errorWithCircular, 'details', { value: circularObj });
      
      // Act
      loggerService.error('Circular reference error', errorWithCircular);
      
      // Assert - should not throw
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      expect(parsedLog).toHaveProperty('error');
      expect(parsedLog.error).toHaveProperty('message', 'Error with circular reference');
      expect(parsedLog.error).toHaveProperty('details');
      // The circular reference should be replaced with a placeholder
      expect(parsedLog.error.details.self).toContain('Circular');
    });

    it('should handle non-error objects passed as errors', () => {
      // Arrange
      const nonError = {
        message: 'This is not an Error instance',
        code: 'NOT_ERROR',
        details: {
          reason: 'Testing non-Error objects',
        },
      };
      
      // Act
      loggerService.error('Non-error object', nonError as any);
      
      // Assert
      const formattedLog = mockTransport.formattedLogs[0];
      const parsedLog = JSON.parse(formattedLog);
      
      expect(parsedLog).toHaveProperty('error');
      expect(parsedLog.error).toHaveProperty('message', 'This is not an Error instance');
      expect(parsedLog.error).toHaveProperty('code', 'NOT_ERROR');
      expect(parsedLog.error).toHaveProperty('details');
      expect(parsedLog.error.details).toHaveProperty('reason', 'Testing non-Error objects');
    });
  });
});
import { Test } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerModule } from '../../src/logger.module';
import { ContextManager } from '../../src/context/context-manager';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { TextFormatter } from '../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../src/formatters/cloudwatch.formatter';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { FileTransport } from '../../src/transports/file.transport';
import { CloudWatchTransport } from '../../src/transports/cloudwatch.transport';
import { TransportFactory } from '../../src/transports/transport-factory';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { UserContext } from '../../src/context/user-context.interface';

import {
  captureLogOutput,
  resetCapturedLogs,
  getCapturedLogs,
} from '../utils/log-capture.utils';
import {
  assertLogContainsContext,
  assertLogHasLevel,
  assertLogHasTimestamp,
  assertLogIsFormatted,
} from '../utils/assertion.utils';
import {
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  createRequestContext,
  createUserContext,
} from '../utils/test-context.utils';
import { MockTracingService } from '../utils/mocks';
import { journeyData } from '../fixtures/journey-data.fixture';
import { configOptions } from '../fixtures/config-options.fixture';
import { errorObjects } from '../fixtures/error-objects.fixture';
import { logContexts } from '../fixtures/log-contexts.fixture';
import { logEntries } from '../fixtures/log-entries.fixture';

describe('Logging Integration', () => {
  let loggerService: LoggerService;
  let contextManager: ContextManager;
  let jsonFormatter: JsonFormatter;
  let textFormatter: TextFormatter;
  let cloudwatchFormatter: CloudWatchFormatter;
  let consoleTransport: ConsoleTransport;
  let fileTransport: FileTransport;
  let cloudwatchTransport: CloudWatchTransport;
  let transportFactory: TransportFactory;
  let mockTracingService: MockTracingService;

  beforeEach(async () => {
    resetCapturedLogs();
    mockTracingService = new MockTracingService();
    
    // Create test module with real implementations
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot(configOptions.testing)],
      providers: [
        {
          provide: 'TracingService',
          useValue: mockTracingService,
        },
      ],
    }).compile();

    // Get service instances
    loggerService = moduleRef.get<LoggerService>(LoggerService);
    contextManager = moduleRef.get<ContextManager>(ContextManager);
    jsonFormatter = moduleRef.get<JsonFormatter>(JsonFormatter);
    textFormatter = moduleRef.get<TextFormatter>(TextFormatter);
    cloudwatchFormatter = moduleRef.get<CloudWatchFormatter>(CloudWatchFormatter);
    consoleTransport = moduleRef.get<ConsoleTransport>(ConsoleTransport);
    transportFactory = moduleRef.get<TransportFactory>(TransportFactory);

    // Setup log capture
    captureLogOutput();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-end logging pipeline', () => {
    it('should log messages through the entire pipeline with proper formatting', () => {
      // Arrange
      const message = 'Test log message';
      const context = { service: 'test-service' };

      // Act
      loggerService.log(message, context);

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain(message);
      expect(logs[0]).toContain('test-service');
      assertLogHasLevel(logs[0], LogLevel.INFO);
      assertLogHasTimestamp(logs[0]);
    });

    it('should log errors with stack traces through the entire pipeline', () => {
      // Arrange
      const errorMessage = 'Test error message';
      const error = new Error(errorMessage);
      const context = { service: 'test-service' };

      // Act
      loggerService.error(errorMessage, error.stack, context);

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain(errorMessage);
      expect(logs[0]).toContain('test-service');
      expect(logs[0]).toContain('Error:');
      expect(logs[0]).toContain('stack');
      assertLogHasLevel(logs[0], LogLevel.ERROR);
    });

    it('should respect log level configuration', () => {
      // Arrange - Create a logger with INFO level
      const infoLevelConfig = { ...configOptions.testing, level: LogLevel.INFO };
      const moduleRef = Test.createTestingModule({
        imports: [LoggerModule.forRoot(infoLevelConfig)],
      }).compile();

      const infoLevelLogger = moduleRef.get<LoggerService>(LoggerService);

      // Act
      infoLevelLogger.debug('This should not be logged');
      infoLevelLogger.info('This should be logged');
      infoLevelLogger.warn('This should be logged');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(2);
      expect(logs[0]).toContain('This should be logged');
      expect(logs[1]).toContain('This should be logged');
      expect(logs.some(log => log.includes('This should not be logged'))).toBe(false);
    });

    it('should log messages with all log levels', () => {
      // Act
      loggerService.debug('Debug message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');
      
      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(4);
      assertLogHasLevel(logs[0], LogLevel.DEBUG);
      assertLogHasLevel(logs[1], LogLevel.INFO);
      assertLogHasLevel(logs[2], LogLevel.WARN);
      assertLogHasLevel(logs[3], LogLevel.ERROR);
    });
  });

  describe('Context propagation', () => {
    it('should include request context in logs', () => {
      // Arrange
      const requestContext = createRequestContext();
      contextManager.setContext(requestContext);

      // Act
      loggerService.log('Request log message');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      assertLogContainsContext(logs[0], requestContext);
    });

    it('should include user context in logs', () => {
      // Arrange
      const userContext = createUserContext();
      contextManager.setContext(userContext);

      // Act
      loggerService.log('User log message');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      assertLogContainsContext(logs[0], userContext);
    });

    it('should include journey context in logs', () => {
      // Arrange
      const journeyContext = createHealthJourneyContext();
      contextManager.setContext(journeyContext);

      // Act
      loggerService.log('Journey log message');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      assertLogContainsContext(logs[0], journeyContext);
    });

    it('should merge multiple contexts correctly', () => {
      // Arrange
      const requestContext = createRequestContext();
      const userContext = createUserContext();
      const journeyContext = createHealthJourneyContext();
      
      contextManager.setContext(requestContext);
      contextManager.setContext(userContext);
      contextManager.setContext(journeyContext);

      // Act
      loggerService.log('Combined context log message');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      assertLogContainsContext(logs[0], requestContext);
      assertLogContainsContext(logs[0], userContext);
      assertLogContainsContext(logs[0], journeyContext);
    });

    it('should maintain context across async operations', async () => {
      // Arrange
      const journeyContext = createHealthJourneyContext();
      contextManager.setContext(journeyContext);

      // Act
      await new Promise<void>(resolve => {
        setTimeout(() => {
          loggerService.log('Async log message');
          resolve();
        }, 10);
      });

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      assertLogContainsContext(logs[0], journeyContext);
    });
  });

  describe('Formatter and transport integration', () => {
    it('should format logs using the configured formatter', () => {
      // Arrange - Create a logger with JSON formatter
      const jsonConfig = { 
        ...configOptions.testing, 
        formatter: 'json',
        transports: ['console']
      };
      
      const moduleRef = Test.createTestingModule({
        imports: [LoggerModule.forRoot(jsonConfig)],
      }).compile();

      const jsonLogger = moduleRef.get<LoggerService>(LoggerService);

      // Act
      jsonLogger.log('JSON formatted message');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(() => JSON.parse(logs[0])).not.toThrow();
      const parsedLog = JSON.parse(logs[0]);
      expect(parsedLog.message).toBe('JSON formatted message');
      expect(parsedLog.level).toBe('info');
    });

    it('should use text formatter for development environment', () => {
      // Arrange - Create a logger with development config
      const devConfig = configOptions.development;
      
      const moduleRef = Test.createTestingModule({
        imports: [LoggerModule.forRoot(devConfig)],
      }).compile();

      const devLogger = moduleRef.get<LoggerService>(LoggerService);

      // Act
      devLogger.log('Development log message');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      // Text formatter doesn't produce JSON, so this should throw
      expect(() => JSON.parse(logs[0])).toThrow();
      expect(logs[0]).toContain('Development log message');
    });

    it('should use CloudWatch formatter for production environment', () => {
      // Arrange - Create a logger with production config
      const prodConfig = configOptions.production;
      
      const moduleRef = Test.createTestingModule({
        imports: [LoggerModule.forRoot(prodConfig)],
      }).compile();

      const prodLogger = moduleRef.get<LoggerService>(LoggerService);

      // Act
      prodLogger.log('Production log message');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(() => JSON.parse(logs[0])).not.toThrow();
      const parsedLog = JSON.parse(logs[0]);
      expect(parsedLog.message).toBe('Production log message');
      // CloudWatch formatter adds AWS-specific fields
      expect(parsedLog.aws).toBeDefined();
    });

    it('should route logs to the configured transport', () => {
      // We'll use the console transport with a spy
      const consoleSpy = jest.spyOn(consoleTransport, 'write');
      
      // Act
      loggerService.log('Transport test message');
      
      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const transportedLog = consoleSpy.mock.calls[0][0];
      expect(transportedLog).toContain('Transport test message');
    });
  });

  describe('Error handling across component boundaries', () => {
    it('should handle formatter errors gracefully', () => {
      // Arrange - Create a formatter that throws an error
      const errorFormatter: Formatter = {
        format: () => {
          throw new Error('Formatter error');
        }
      };
      
      // Replace the formatter in the logger service
      (loggerService as any).formatter = errorFormatter;
      
      // Act & Assert - Should not throw
      expect(() => {
        loggerService.log('This should not throw');
      }).not.toThrow();
      
      // Should fall back to a simple string format
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('This should not throw');
      expect(logs[0]).toContain('Formatter error');
    });

    it('should handle transport errors gracefully', () => {
      // Arrange - Create a transport that throws an error
      const errorTransport: Transport = {
        write: () => {
          throw new Error('Transport error');
        },
        initialize: jest.fn(),
        close: jest.fn()
      };
      
      // Replace the transport in the logger service
      (loggerService as any).transports = [errorTransport];
      
      // Act & Assert - Should not throw
      expect(() => {
        loggerService.log('This should not throw');
      }).not.toThrow();
    });

    it('should handle context errors gracefully', () => {
      // Arrange - Create a context manager that throws an error
      jest.spyOn(contextManager, 'getContext').mockImplementation(() => {
        throw new Error('Context error');
      });
      
      // Act & Assert - Should not throw
      expect(() => {
        loggerService.log('This should not throw');
      }).not.toThrow();
      
      // Should log without context
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('This should not throw');
    });

    it('should handle circular references in log objects', () => {
      // Arrange - Create an object with circular reference
      const circular: any = { name: 'circular' };
      circular.self = circular;
      
      // Act
      loggerService.log('Circular reference test', { circular });
      
      // Assert - Should not throw and should handle the circular reference
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('Circular reference test');
      expect(logs[0]).toContain('circular');
    });
  });

  describe('Configuration inheritance', () => {
    it('should apply default configuration when not specified', () => {
      // Arrange - Create a logger with minimal config
      const minimalConfig = {};
      
      const moduleRef = Test.createTestingModule({
        imports: [LoggerModule.forRoot(minimalConfig)],
      }).compile();

      const minimalLogger = moduleRef.get<LoggerService>(LoggerService);

      // Act
      minimalLogger.log('Minimal config message');

      // Assert - Should use default console transport and formatter
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('Minimal config message');
    });

    it('should override specific configuration options', () => {
      // Arrange - Create a logger with specific overrides
      const overrideConfig = { 
        level: LogLevel.WARN,
        formatter: 'json',
        transports: ['console']
      };
      
      const moduleRef = Test.createTestingModule({
        imports: [LoggerModule.forRoot(overrideConfig)],
      }).compile();

      const overrideLogger = moduleRef.get<LoggerService>(LoggerService);

      // Act
      overrideLogger.debug('Should not be logged');
      overrideLogger.info('Should not be logged');
      overrideLogger.warn('Should be logged');
      overrideLogger.error('Should be logged');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(2);
      expect(logs[0]).toContain('Should be logged');
      expect(logs[1]).toContain('Should be logged');
      expect(logs.some(log => log.includes('Should not be logged'))).toBe(false);
      
      // Should be JSON formatted
      expect(() => JSON.parse(logs[0])).not.toThrow();
    });

    it('should apply journey-specific configuration', () => {
      // Arrange - Create a logger with journey-specific config
      const journeyConfig = {
        journeys: {
          health: { level: LogLevel.DEBUG },
          care: { level: LogLevel.INFO },
          plan: { level: LogLevel.WARN }
        }
      };
      
      const moduleRef = Test.createTestingModule({
        imports: [LoggerModule.forRoot(journeyConfig)],
      }).compile();

      const journeyLogger = moduleRef.get<LoggerService>(LoggerService);
      const journeyContextManager = moduleRef.get<ContextManager>(ContextManager);

      // Act - Test with Health journey context
      journeyContextManager.setContext(createHealthJourneyContext());
      journeyLogger.debug('Health debug - should be logged');
      
      // Switch to Care journey context
      journeyContextManager.setContext(createCareJourneyContext());
      journeyLogger.debug('Care debug - should not be logged');
      journeyLogger.info('Care info - should be logged');
      
      // Switch to Plan journey context
      journeyContextManager.setContext(createPlanJourneyContext());
      journeyLogger.debug('Plan debug - should not be logged');
      journeyLogger.info('Plan info - should not be logged');
      journeyLogger.warn('Plan warn - should be logged');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(3);
      expect(logs[0]).toContain('Health debug - should be logged');
      expect(logs[1]).toContain('Care info - should be logged');
      expect(logs[2]).toContain('Plan warn - should be logged');
    });

    it('should apply environment-specific configuration', () => {
      // Arrange - Create loggers for different environments
      const devLogger = Test.createTestingModule({
        imports: [LoggerModule.forRoot(configOptions.development)],
      }).compile().get<LoggerService>(LoggerService);
      
      const testLogger = Test.createTestingModule({
        imports: [LoggerModule.forRoot(configOptions.testing)],
      }).compile().get<LoggerService>(LoggerService);
      
      const prodLogger = Test.createTestingModule({
        imports: [LoggerModule.forRoot(configOptions.production)],
      }).compile().get<LoggerService>(LoggerService);

      // Act
      devLogger.log('Development environment log');
      testLogger.log('Testing environment log');
      prodLogger.log('Production environment log');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(3);
      
      // Development should use text formatter
      expect(() => JSON.parse(logs[0])).toThrow();
      expect(logs[0]).toContain('Development environment log');
      
      // Testing should use JSON formatter
      expect(() => JSON.parse(logs[1])).not.toThrow();
      expect(JSON.parse(logs[1]).message).toBe('Testing environment log');
      
      // Production should use CloudWatch formatter
      expect(() => JSON.parse(logs[2])).not.toThrow();
      expect(JSON.parse(logs[2]).message).toBe('Production environment log');
      expect(JSON.parse(logs[2]).aws).toBeDefined();
    });
  });

  describe('Tracing integration', () => {
    it('should include trace context in logs', () => {
      // Arrange
      const traceId = 'test-trace-id';
      const spanId = 'test-span-id';
      mockTracingService.getCurrentTraceId.mockReturnValue(traceId);
      mockTracingService.getCurrentSpanId.mockReturnValue(spanId);

      // Act
      loggerService.log('Traced log message');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain(traceId);
      expect(logs[0]).toContain(spanId);
    });

    it('should correlate logs with the same trace', () => {
      // Arrange
      const traceId = 'correlation-trace-id';
      mockTracingService.getCurrentTraceId.mockReturnValue(traceId);

      // Act - Log multiple messages in the same trace
      loggerService.log('First traced message');
      loggerService.log('Second traced message');
      loggerService.error('Error in trace');

      // Assert
      const logs = getCapturedLogs();
      expect(logs.length).toBe(3);
      expect(logs.every(log => log.includes(traceId))).toBe(true);
    });

    it('should handle missing trace context gracefully', () => {
      // Arrange
      mockTracingService.getCurrentTraceId.mockReturnValue(null);
      mockTracingService.getCurrentSpanId.mockReturnValue(null);

      // Act
      loggerService.log('No trace context message');

      // Assert - Should log without trace context
      const logs = getCapturedLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('No trace context message');
    });
  });
});
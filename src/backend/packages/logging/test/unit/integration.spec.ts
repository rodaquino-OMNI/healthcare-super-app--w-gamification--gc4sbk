import { Test } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { TextFormatter } from '../../src/formatters/text.formatter';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { ContextManager } from '../../src/context/context-manager';
import { JourneyType } from '../../src/context/context.constants';
import { Transport } from '../../src/interfaces/transport.interface';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { TransportFactory } from '../../src/transports/transport-factory';

/**
 * Integration tests for the logging system.
 * 
 * These tests verify the end-to-end logging flow from LoggerService through formatters 
 * and transports, ensuring that context is properly maintained and log entries are 
 * correctly formatted and delivered.
 */
describe('Logging Integration', () => {
  let loggerService: LoggerService;
  let contextManager: ContextManager;
  let transportSpy: jest.SpyInstance;
  let capturedLogs: LogEntry[] = [];

  // Custom transport implementation for testing that captures logs instead of writing them
  class TestTransport implements Transport {
    private formatter: Formatter;

    constructor(formatter: Formatter) {
      this.formatter = formatter;
    }

    async write(logEntry: LogEntry): Promise<void> {
      capturedLogs.push(logEntry);
      return Promise.resolve();
    }

    getFormatter(): Formatter {
      return this.formatter;
    }

    initialize(): Promise<void> {
      return Promise.resolve();
    }

    close(): Promise<void> {
      return Promise.resolve();
    }
  }

  beforeEach(async () => {
    capturedLogs = [];
    
    // Create a test module with real implementations of logging components
    const moduleRef = await Test.createTestingModule({
      providers: [
        LoggerService,
        ContextManager,
        {
          provide: 'LOGGER_CONFIG',
          useValue: {
            level: LogLevel.DEBUG,
            defaultContext: {
              service: 'test-service',
              environment: 'test'
            }
          } as LoggerConfig
        },
        {
          provide: TransportFactory,
          useValue: {
            createTransports: jest.fn().mockReturnValue([
              new TestTransport(new JsonFormatter())
            ])
          }
        }
      ],
    }).compile();

    loggerService = moduleRef.get<LoggerService>(LoggerService);
    contextManager = moduleRef.get<ContextManager>(ContextManager);
    
    // Spy on the transport's write method to verify it's called correctly
    const transportFactory = moduleRef.get<TransportFactory>(TransportFactory);
    const transports = transportFactory.createTransports();
    transportSpy = jest.spyOn(transports[0], 'write');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-end logging flow', () => {
    it('should log a message with the correct level and format', async () => {
      // Act
      loggerService.log('Test message');
      
      // Assert
      expect(transportSpy).toHaveBeenCalledTimes(1);
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].level).toBe(LogLevel.INFO);
      expect(capturedLogs[0].message).toBe('Test message');
      expect(capturedLogs[0].context).toHaveProperty('service', 'test-service');
      expect(capturedLogs[0].context).toHaveProperty('environment', 'test');
    });

    it('should include error details when logging errors', async () => {
      // Arrange
      const testError = new Error('Test error');
      
      // Act
      loggerService.error('Error occurred', testError);
      
      // Assert
      expect(transportSpy).toHaveBeenCalledTimes(1);
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].level).toBe(LogLevel.ERROR);
      expect(capturedLogs[0].message).toBe('Error occurred');
      expect(capturedLogs[0].error).toBeDefined();
      expect(capturedLogs[0].error.message).toBe('Test error');
      expect(capturedLogs[0].error.stack).toBeDefined();
    });

    it('should respect log level filtering', async () => {
      // Arrange - Create a new logger with WARN level
      const moduleRef = await Test.createTestingModule({
        providers: [
          LoggerService,
          ContextManager,
          {
            provide: 'LOGGER_CONFIG',
            useValue: {
              level: LogLevel.WARN, // Only WARN and above should be logged
              defaultContext: {
                service: 'test-service',
                environment: 'test'
              }
            } as LoggerConfig
          },
          {
            provide: TransportFactory,
            useValue: {
              createTransports: jest.fn().mockReturnValue([
                new TestTransport(new JsonFormatter())
              ])
            }
          }
        ],
      }).compile();

      const warnLevelLogger = moduleRef.get<LoggerService>(LoggerService);
      capturedLogs = [];
      
      // Act - Log messages at different levels
      warnLevelLogger.debug('Debug message'); // Should be filtered out
      warnLevelLogger.log('Info message');    // Should be filtered out
      warnLevelLogger.warn('Warning message'); // Should be logged
      warnLevelLogger.error('Error message');  // Should be logged
      
      // Assert
      expect(capturedLogs.length).toBe(2); // Only WARN and ERROR should be logged
      expect(capturedLogs[0].level).toBe(LogLevel.WARN);
      expect(capturedLogs[1].level).toBe(LogLevel.ERROR);
    });
  });

  describe('Context propagation', () => {
    it('should include request context in logs', async () => {
      // Arrange
      const requestContext = contextManager.createRequestContext({
        requestId: 'test-request-id',
        method: 'GET',
        url: '/test',
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      });
      
      // Act
      loggerService.log('Request received', { context: requestContext });
      
      // Assert
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].context).toHaveProperty('requestId', 'test-request-id');
      expect(capturedLogs[0].context).toHaveProperty('method', 'GET');
      expect(capturedLogs[0].context).toHaveProperty('url', '/test');
      expect(capturedLogs[0].context).toHaveProperty('ip', '127.0.0.1');
      expect(capturedLogs[0].context).toHaveProperty('userAgent', 'test-agent');
    });

    it('should include user context in logs', async () => {
      // Arrange
      const userContext = contextManager.createUserContext({
        userId: 'test-user-id',
        isAuthenticated: true,
        roles: ['user', 'admin']
      });
      
      // Act
      loggerService.log('User action', { context: userContext });
      
      // Assert
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].context).toHaveProperty('userId', 'test-user-id');
      expect(capturedLogs[0].context).toHaveProperty('isAuthenticated', true);
      expect(capturedLogs[0].context).toHaveProperty('roles');
      expect(capturedLogs[0].context.roles).toEqual(['user', 'admin']);
    });

    it('should include journey context in logs', async () => {
      // Arrange
      const journeyContext = contextManager.createJourneyContext({
        journeyType: JourneyType.HEALTH,
        journeyState: {
          currentStep: 'metrics-input',
          progress: 0.5
        }
      });
      
      // Act
      loggerService.log('Journey progress', { context: journeyContext });
      
      // Assert
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].context).toHaveProperty('journeyType', JourneyType.HEALTH);
      expect(capturedLogs[0].context).toHaveProperty('journeyState');
      expect(capturedLogs[0].context.journeyState).toHaveProperty('currentStep', 'metrics-input');
      expect(capturedLogs[0].context.journeyState).toHaveProperty('progress', 0.5);
    });

    it('should merge multiple context types correctly', async () => {
      // Arrange
      const requestContext = contextManager.createRequestContext({
        requestId: 'test-request-id',
        method: 'POST',
        url: '/health/metrics'
      });
      
      const userContext = contextManager.createUserContext({
        userId: 'test-user-id',
        isAuthenticated: true
      });
      
      const journeyContext = contextManager.createJourneyContext({
        journeyType: JourneyType.HEALTH
      });
      
      const mergedContext = contextManager.mergeContexts([
        requestContext,
        userContext,
        journeyContext
      ]);
      
      // Act
      loggerService.log('Complex operation', { context: mergedContext });
      
      // Assert
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].context).toHaveProperty('requestId', 'test-request-id');
      expect(capturedLogs[0].context).toHaveProperty('method', 'POST');
      expect(capturedLogs[0].context).toHaveProperty('userId', 'test-user-id');
      expect(capturedLogs[0].context).toHaveProperty('isAuthenticated', true);
      expect(capturedLogs[0].context).toHaveProperty('journeyType', JourneyType.HEALTH);
    });
  });

  describe('Formatter integration', () => {
    it('should use JSON formatter correctly', async () => {
      // Arrange
      const jsonFormatter = new JsonFormatter();
      const testTransport = new TestTransport(jsonFormatter);
      const formatterSpy = jest.spyOn(jsonFormatter, 'format');
      
      // Create a test log entry
      const logEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test JSON formatting',
        context: {
          service: 'test-service',
          requestId: 'test-request-id'
        }
      };
      
      // Act
      await testTransport.write(logEntry);
      
      // Assert
      expect(formatterSpy).toHaveBeenCalledTimes(1);
      expect(formatterSpy).toHaveBeenCalledWith(logEntry);
    });

    it('should use Text formatter correctly', async () => {
      // Arrange
      const textFormatter = new TextFormatter();
      const testTransport = new TestTransport(textFormatter);
      const formatterSpy = jest.spyOn(textFormatter, 'format');
      
      // Create a test log entry
      const logEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test text formatting',
        context: {
          service: 'test-service',
          requestId: 'test-request-id'
        }
      };
      
      // Act
      await testTransport.write(logEntry);
      
      // Assert
      expect(formatterSpy).toHaveBeenCalledTimes(1);
      expect(formatterSpy).toHaveBeenCalledWith(logEntry);
    });

    it('should handle complex objects in log context', async () => {
      // Arrange
      const jsonFormatter = new JsonFormatter();
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          map: new Map([['key1', 'value1'], ['key2', 'value2']]),
          date: new Date('2023-01-01')
        },
        circular: {}
      };
      // Create circular reference
      complexObject.circular = complexObject;
      
      // Create a test log entry with complex context
      const logEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test complex context',
        context: {
          service: 'test-service',
          complexData: complexObject
        }
      };
      
      // Act - This should not throw an error despite circular reference
      const formatted = jsonFormatter.format(logEntry);
      
      // Assert
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      // The circular reference should be replaced with "[Circular]"
      expect(formatted).toContain('[Circular]');
    });
  });

  describe('Transport integration', () => {
    it('should initialize and close console transport correctly', async () => {
      // Arrange
      const consoleTransport = new ConsoleTransport(new TextFormatter());
      const initSpy = jest.spyOn(consoleTransport, 'initialize');
      const closeSpy = jest.spyOn(consoleTransport, 'close');
      
      // Act
      await consoleTransport.initialize();
      await consoleTransport.write({
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test console transport',
        context: { service: 'test-service' }
      });
      await consoleTransport.close();
      
      // Assert
      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle transport errors gracefully', async () => {
      // Arrange
      const errorTransport = new TestTransport(new JsonFormatter());
      jest.spyOn(errorTransport, 'write').mockImplementation(() => {
        throw new Error('Transport failure');
      });
      
      // Create a test module with the error-throwing transport
      const moduleRef = await Test.createTestingModule({
        providers: [
          LoggerService,
          ContextManager,
          {
            provide: 'LOGGER_CONFIG',
            useValue: {
              level: LogLevel.DEBUG,
              defaultContext: { service: 'test-service' }
            } as LoggerConfig
          },
          {
            provide: TransportFactory,
            useValue: {
              createTransports: jest.fn().mockReturnValue([errorTransport])
            }
          }
        ],
      }).compile();

      const errorLogger = moduleRef.get<LoggerService>(LoggerService);
      
      // Act & Assert - This should not throw despite transport error
      expect(() => {
        errorLogger.log('This should not throw');
      }).not.toThrow();
    });
  });

  describe('Configuration inheritance', () => {
    it('should apply default context to all logs', async () => {
      // Arrange
      const defaultContext = {
        service: 'test-service',
        environment: 'test',
        version: '1.0.0'
      };
      
      // Create a test module with default context
      const moduleRef = await Test.createTestingModule({
        providers: [
          LoggerService,
          ContextManager,
          {
            provide: 'LOGGER_CONFIG',
            useValue: {
              level: LogLevel.DEBUG,
              defaultContext
            } as LoggerConfig
          },
          {
            provide: TransportFactory,
            useValue: {
              createTransports: jest.fn().mockReturnValue([
                new TestTransport(new JsonFormatter())
              ])
            }
          }
        ],
      }).compile();

      const configuredLogger = moduleRef.get<LoggerService>(LoggerService);
      capturedLogs = [];
      
      // Act
      configuredLogger.log('Test default context');
      
      // Assert
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].context).toMatchObject(defaultContext);
    });

    it('should override default context with provided context', async () => {
      // Arrange
      const defaultContext = {
        service: 'default-service',
        environment: 'default'
      };
      
      const customContext = {
        service: 'custom-service', // This should override the default
        requestId: 'custom-request-id' // This should be added
      };
      
      // Create a test module with default context
      const moduleRef = await Test.createTestingModule({
        providers: [
          LoggerService,
          ContextManager,
          {
            provide: 'LOGGER_CONFIG',
            useValue: {
              level: LogLevel.DEBUG,
              defaultContext
            } as LoggerConfig
          },
          {
            provide: TransportFactory,
            useValue: {
              createTransports: jest.fn().mockReturnValue([
                new TestTransport(new JsonFormatter())
              ])
            }
          }
        ],
      }).compile();

      const configuredLogger = moduleRef.get<LoggerService>(LoggerService);
      capturedLogs = [];
      
      // Act
      configuredLogger.log('Test context override', { context: customContext });
      
      // Assert
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].context).toHaveProperty('service', 'custom-service'); // Overridden
      expect(capturedLogs[0].context).toHaveProperty('environment', 'default'); // From default
      expect(capturedLogs[0].context).toHaveProperty('requestId', 'custom-request-id'); // Added
    });
  });
});
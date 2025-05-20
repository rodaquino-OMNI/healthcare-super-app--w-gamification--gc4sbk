import { Test } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { Transport } from '../../src/interfaces/transport.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';

// Import test fixtures
import { journeyContexts } from '../fixtures/journey-data.fixture';
import { logContexts } from '../fixtures/log-contexts.fixture';
import { errorObjects } from '../fixtures/error-objects.fixture';
import { configOptions } from '../fixtures/config-options.fixture';

// Create mock for TracingService
class MockTracingService {
  getCurrentTraceContext() {
    return {
      traceId: 'test-trace-id',
      spanId: 'test-span-id',
    };
  }
}

// Create mock for Transport
class MockTransport implements Transport {
  public logs: any[] = [];
  
  write(logEntry: any): void {
    this.logs.push(logEntry);
  }

  initialize(): Promise<void> {
    return Promise.resolve();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  clear(): void {
    this.logs = [];
  }
}

describe('LoggerService', () => {
  let loggerService: LoggerService;
  let mockTransport: MockTransport;
  let mockTracingService: MockTracingService;
  let defaultConfig: LoggerConfig;

  beforeEach(async () => {
    mockTransport = new MockTransport();
    mockTracingService = new MockTracingService();
    
    // Create a default config for testing
    defaultConfig = {
      serviceName: 'test-service',
      environment: 'test',
      appVersion: '1.0.0',
      logLevel: LogLevel.DEBUG,
      transports: [{ type: 'console' }]
    };

    // Create the logger service with mocked dependencies
    loggerService = new LoggerService(defaultConfig, mockTracingService);
    
    // Replace the transports with our mock
    (loggerService as any).transports = [mockTransport];
  });

  afterEach(() => {
    mockTransport.clear();
  });

  describe('Basic logging methods', () => {
    it('should log messages with INFO level', () => {
      // Act
      loggerService.log('Test info message');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.INFO);
      expect(mockTransport.logs[0].message).toBe('Test info message');
    });

    it('should log messages with ERROR level', () => {
      // Act
      loggerService.error('Test error message');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.ERROR);
      expect(mockTransport.logs[0].message).toBe('Test error message');
    });

    it('should log messages with WARN level', () => {
      // Act
      loggerService.warn('Test warning message');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.WARN);
      expect(mockTransport.logs[0].message).toBe('Test warning message');
    });

    it('should log messages with DEBUG level', () => {
      // Act
      loggerService.debug('Test debug message');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.DEBUG);
      expect(mockTransport.logs[0].message).toBe('Test debug message');
    });

    it('should log messages with VERBOSE level (maps to DEBUG)', () => {
      // Act
      loggerService.verbose('Test verbose message');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.DEBUG);
      expect(mockTransport.logs[0].message).toBe('Test verbose message');
    });

    it('should log messages with FATAL level', () => {
      // Act
      loggerService.fatal('Test fatal message');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.FATAL);
      expect(mockTransport.logs[0].message).toBe('Test fatal message');
    });
  });

  describe('Context handling', () => {
    it('should include default context in log entries', () => {
      // Act
      loggerService.log('Test message with default context');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].serviceName).toBe('test-service');
      expect(mockTransport.logs[0].environment).toBe('test');
      expect(mockTransport.logs[0].appVersion).toBe('1.0.0');
    });

    it('should include string context in log entries', () => {
      // Act
      loggerService.log('Test message with string context', 'TestContext');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].context).toBe('TestContext');
    });

    it('should include object context in log entries', () => {
      // Arrange
      const contextObj = { userId: '123', action: 'test' };
      
      // Act
      loggerService.log('Test message with object context', contextObj);
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].context).toBeUndefined();
      expect(mockTransport.logs[0].userId).toBe('123');
      expect(mockTransport.logs[0].action).toBe('test');
    });

    it('should include error details when logging errors', () => {
      // Arrange
      const error = new Error('Test error');
      
      // Act
      loggerService.error('Error occurred', error);
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].error).toBeDefined();
      expect(mockTransport.logs[0].error.name).toBe('Error');
      expect(mockTransport.logs[0].error.message).toBe('Test error');
      expect(mockTransport.logs[0].error.stack).toBeDefined();
    });

    it('should include trace context from tracing service', () => {
      // Act
      loggerService.log('Test message with trace context');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].traceId).toBe('test-trace-id');
      expect(mockTransport.logs[0].spanId).toBe('test-span-id');
    });
  });

  describe('Journey-specific logging', () => {
    it('should log with journey context', () => {
      // Arrange
      const journeyContext: JourneyContext = {
        journeyType: 'health',
        journeyId: 'health-journey-123',
        journeyState: 'active',
      };
      
      // Act
      loggerService.logWithJourneyContext(LogLevel.INFO, 'Health journey event', journeyContext);
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].journeyType).toBe('health');
      expect(mockTransport.logs[0].journeyId).toBe('health-journey-123');
      expect(mockTransport.logs[0].journeyState).toBe('active');
    });

    it('should create a journey-specific logger', () => {
      // Arrange
      const journeyContext: JourneyContext = {
        journeyType: 'care',
        journeyId: 'care-journey-456',
        journeyState: 'pending',
      };
      
      // Act
      const journeyLogger = loggerService.createJourneyLogger(journeyContext);
      journeyLogger.log('Care journey event');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].journeyType).toBe('care');
      expect(mockTransport.logs[0].journeyId).toBe('care-journey-456');
      expect(mockTransport.logs[0].journeyState).toBe('pending');
    });
  });

  describe('User-specific logging', () => {
    it('should log with user context', () => {
      // Arrange
      const userContext: UserContext = {
        userId: 'user-123',
        isAuthenticated: true,
        roles: ['patient'],
      };
      
      // Act
      loggerService.logWithUserContext(LogLevel.INFO, 'User action', userContext);
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].userId).toBe('user-123');
      expect(mockTransport.logs[0].isAuthenticated).toBe(true);
      expect(mockTransport.logs[0].roles).toEqual(['patient']);
    });

    it('should create a user-specific logger', () => {
      // Arrange
      const userContext: UserContext = {
        userId: 'user-456',
        isAuthenticated: true,
        roles: ['provider'],
      };
      
      // Act
      const userLogger = loggerService.createUserLogger(userContext);
      userLogger.log('Provider action');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].userId).toBe('user-456');
      expect(mockTransport.logs[0].isAuthenticated).toBe(true);
      expect(mockTransport.logs[0].roles).toEqual(['provider']);
    });
  });

  describe('Request-specific logging', () => {
    it('should log with request context', () => {
      // Arrange
      const requestContext: RequestContext = {
        requestId: 'req-123',
        method: 'GET',
        url: '/api/health',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      };
      
      // Act
      loggerService.logWithRequestContext(LogLevel.INFO, 'API request', requestContext);
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].requestId).toBe('req-123');
      expect(mockTransport.logs[0].method).toBe('GET');
      expect(mockTransport.logs[0].url).toBe('/api/health');
      expect(mockTransport.logs[0].ip).toBe('127.0.0.1');
      expect(mockTransport.logs[0].userAgent).toBe('test-agent');
    });

    it('should create a request-specific logger', () => {
      // Arrange
      const requestContext: RequestContext = {
        requestId: 'req-456',
        method: 'POST',
        url: '/api/care',
        ip: '192.168.1.1',
        userAgent: 'mobile-app',
      };
      
      // Act
      const requestLogger = loggerService.createRequestLogger(requestContext);
      requestLogger.log('API request processed');
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].requestId).toBe('req-456');
      expect(mockTransport.logs[0].method).toBe('POST');
      expect(mockTransport.logs[0].url).toBe('/api/care');
      expect(mockTransport.logs[0].ip).toBe('192.168.1.1');
      expect(mockTransport.logs[0].userAgent).toBe('mobile-app');
    });
  });

  describe('Combined context logging', () => {
    it('should log with combined contexts', () => {
      // Arrange
      const userContext: UserContext = {
        userId: 'user-789',
        isAuthenticated: true,
        roles: ['patient'],
      };
      
      const journeyContext: JourneyContext = {
        journeyType: 'plan',
        journeyId: 'plan-journey-789',
        journeyState: 'completed',
      };
      
      const requestContext: RequestContext = {
        requestId: 'req-789',
        method: 'PUT',
        url: '/api/plan',
        ip: '10.0.0.1',
        userAgent: 'web-app',
      };
      
      // Act
      loggerService.logWithCombinedContext(
        LogLevel.INFO,
        'Cross-journey action',
        [userContext, journeyContext, requestContext]
      );
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      expect(mockTransport.logs[0].userId).toBe('user-789');
      expect(mockTransport.logs[0].journeyType).toBe('plan');
      expect(mockTransport.logs[0].requestId).toBe('req-789');
    });
  });

  describe('Log level filtering', () => {
    it('should not log messages below configured log level', () => {
      // Arrange
      const highLevelConfig: LoggerConfig = {
        ...defaultConfig,
        logLevel: LogLevel.ERROR,
      };
      const highLevelLogger = new LoggerService(highLevelConfig, mockTracingService);
      (highLevelLogger as any).transports = [mockTransport];
      
      // Act - these should be filtered out
      highLevelLogger.debug('Debug message');
      highLevelLogger.log('Info message');
      highLevelLogger.warn('Warning message');
      
      // Act - these should be logged
      highLevelLogger.error('Error message');
      highLevelLogger.fatal('Fatal message');
      
      // Assert
      expect(mockTransport.logs.length).toBe(2);
      expect(mockTransport.logs[0].level).toBe(LogLevel.ERROR);
      expect(mockTransport.logs[1].level).toBe(LogLevel.FATAL);
    });
  });

  describe('Message formatting', () => {
    it('should format string messages', () => {
      // Act
      loggerService.log('Simple string message');
      
      // Assert
      expect(mockTransport.logs[0].message).toBe('Simple string message');
    });

    it('should format error messages', () => {
      // Arrange
      const error = new Error('Test error message');
      
      // Act
      loggerService.log(error);
      
      // Assert
      expect(mockTransport.logs[0].message).toBe('Test error message');
    });

    it('should format object messages', () => {
      // Arrange
      const obj = { key: 'value', nested: { prop: 'test' } };
      
      // Act
      loggerService.log(obj);
      
      // Assert
      expect(mockTransport.logs[0].message).toBe(JSON.stringify(obj));
    });

    it('should handle circular references in object messages', () => {
      // Arrange
      const obj: any = { key: 'value' };
      obj.circular = obj; // Create circular reference
      
      // Act
      loggerService.log(obj);
      
      // Assert
      expect(mockTransport.logs[0].message).toBe('[Object]');
    });
  });

  describe('Error handling', () => {
    it('should handle transport errors gracefully', () => {
      // Arrange
      const errorTransport: Transport = {
        write: jest.fn().mockImplementation(() => {
          throw new Error('Transport failure');
        }),
        initialize: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };
      
      // Replace transports with our error-throwing transport
      (loggerService as any).transports = [errorTransport];
      
      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Act - should not throw despite transport error
      expect(() => {
        loggerService.log('This should not throw');
      }).not.toThrow();
      
      // Assert
      expect(errorTransport.write).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // Restore console.error
      console.error = originalConsoleError;
    });
  });
});
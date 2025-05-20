/**
 * @file logger-context.integration.spec.ts
 * @description Integration tests for the LoggerService context management functionality.
 * These tests verify the correct interaction between LoggerService and the context management system.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { ContextManager } from '../../src/context/context-manager';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';

/**
 * Mock implementation of the TracingService for testing
 */
class MockTracingService {
  private traceId = '1234567890abcdef1234567890abcdef';
  private spanId = '1234567890abcdef';

  getCurrentTraceContext() {
    return { traceId: this.traceId, spanId: this.spanId };
  }

  createSpan(name: string) {
    return { name, id: '0987654321fedcba0987654321fedcba' };
  }

  endSpan() {
    // No-op for testing
  }

  setTraceId(traceId: string) {
    this.traceId = traceId;
  }

  setSpanId(spanId: string) {
    this.spanId = spanId;
  }
}

/**
 * Mock implementation of Transport for capturing log output
 */
class MockTransport implements Transport {
  public logs: any[] = [];

  initialize(): Promise<void> {
    return Promise.resolve();
  }

  write(logEntry: any): void {
    this.logs.push(logEntry);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  clear(): void {
    this.logs = [];
  }

  getLastLog(): any {
    return this.logs[this.logs.length - 1];
  }

  getLogs(): any[] {
    return this.logs;
  }
}

describe('LoggerService Context Integration', () => {
  let loggerService: LoggerService;
  let contextManager: ContextManager;
  let mockTracingService: MockTracingService;
  let mockTransport: MockTransport;
  let module: TestingModule;

  beforeEach(async () => {
    mockTracingService = new MockTracingService();
    mockTransport = new MockTransport();

    const loggerConfig: LoggerConfig = {
      serviceName: 'test-service',
      environment: 'test',
      appVersion: '1.0.0',
      logLevel: LogLevel.DEBUG,
      transports: [{ type: 'custom', transport: mockTransport }],
    };

    module = await Test.createTestingModule({
      providers: [
        {
          provide: LoggerConfig,
          useValue: loggerConfig,
        },
        {
          provide: 'TracingService',
          useValue: mockTracingService,
        },
        LoggerService,
      ],
    }).compile();

    loggerService = module.get<LoggerService>(LoggerService);
    contextManager = new ContextManager({ tracingService: mockTracingService });
  });

  afterEach(() => {
    mockTransport.clear();
  });

  describe('Journey Context Integration', () => {
    it('should include journey context in log entries', () => {
      // Create a journey context
      const journeyContext: JourneyContext = {
        journeyType: 'health',
        journeyState: { step: 'metrics-input' },
        journeyMetadata: { startedAt: new Date().toISOString() },
        correlationId: 'journey-correlation-id',
      } as JourneyContext;

      // Log with journey context
      loggerService.logWithJourneyContext(
        LogLevel.INFO,
        'Health metrics recorded',
        journeyContext
      );

      // Verify log entry
      const logEntry = mockTransport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry.journeyType).toBe('health');
      expect(logEntry.journeyState).toEqual({ step: 'metrics-input' });
      expect(logEntry.journeyMetadata).toBeDefined();
      expect(logEntry.correlationId).toBe('journey-correlation-id');
    });

    it('should create a journey-specific logger that includes context in all logs', () => {
      // Create a journey context
      const journeyContext: JourneyContext = {
        journeyType: 'care',
        journeyState: { step: 'appointment-booking' },
        correlationId: 'care-journey-id',
      } as JourneyContext;

      // Create a journey-specific logger
      const journeyLogger = loggerService.createJourneyLogger(journeyContext);

      // Log using the journey logger
      journeyLogger.log('Appointment booked');
      journeyLogger.error('Booking failed', new Error('Provider unavailable'));

      // Verify log entries
      const logs = mockTransport.getLogs();
      expect(logs.length).toBe(2);

      // Check first log
      expect(logs[0].journeyType).toBe('care');
      expect(logs[0].journeyState).toEqual({ step: 'appointment-booking' });
      expect(logs[0].correlationId).toBe('care-journey-id');
      expect(logs[0].message).toBe('Appointment booked');

      // Check second log
      expect(logs[1].journeyType).toBe('care');
      expect(logs[1].journeyState).toEqual({ step: 'appointment-booking' });
      expect(logs[1].correlationId).toBe('care-journey-id');
      expect(logs[1].message).toBe('Booking failed');
      expect(logs[1].error).toBeDefined();
      expect(logs[1].error.message).toBe('Provider unavailable');
    });

    it('should support all three journey types', () => {
      // Test each journey type
      const journeyTypes: Array<'health' | 'care' | 'plan'> = ['health', 'care', 'plan'];

      journeyTypes.forEach(journeyType => {
        const journeyContext: JourneyContext = {
          journeyType,
          correlationId: `${journeyType}-journey-id`,
        } as JourneyContext;

        loggerService.logWithJourneyContext(
          LogLevel.INFO,
          `${journeyType} journey event`,
          journeyContext
        );
      });

      // Verify log entries
      const logs = mockTransport.getLogs();
      expect(logs.length).toBe(3);

      // Check each journey type
      journeyTypes.forEach((journeyType, index) => {
        expect(logs[index].journeyType).toBe(journeyType);
        expect(logs[index].correlationId).toBe(`${journeyType}-journey-id`);
        expect(logs[index].message).toBe(`${journeyType} journey event`);
      });
    });
  });

  describe('User Context Propagation', () => {
    it('should include user context in log entries', () => {
      // Create a user context
      const userContext: UserContext = {
        userId: 'user-123',
        isAuthenticated: true,
        roles: ['patient'],
        correlationId: 'user-correlation-id',
      } as UserContext;

      // Log with user context
      loggerService.logWithUserContext(
        LogLevel.INFO,
        'User profile updated',
        userContext
      );

      // Verify log entry
      const logEntry = mockTransport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry.userId).toBe('user-123');
      expect(logEntry.isAuthenticated).toBe(true);
      expect(logEntry.roles).toEqual(['patient']);
      expect(logEntry.correlationId).toBe('user-correlation-id');
    });

    it('should create a user-specific logger that includes context in all logs', () => {
      // Create a user context
      const userContext: UserContext = {
        userId: 'user-456',
        isAuthenticated: true,
        roles: ['provider'],
        correlationId: 'provider-correlation-id',
      } as UserContext;

      // Create a user-specific logger
      const userLogger = loggerService.createUserLogger(userContext);

      // Log using the user logger
      userLogger.log('Provider logged in');
      userLogger.warn('Unusual login pattern detected');

      // Verify log entries
      const logs = mockTransport.getLogs();
      expect(logs.length).toBe(2);

      // Check first log
      expect(logs[0].userId).toBe('user-456');
      expect(logs[0].isAuthenticated).toBe(true);
      expect(logs[0].roles).toEqual(['provider']);
      expect(logs[0].correlationId).toBe('provider-correlation-id');
      expect(logs[0].message).toBe('Provider logged in');

      // Check second log
      expect(logs[1].userId).toBe('user-456');
      expect(logs[1].isAuthenticated).toBe(true);
      expect(logs[1].roles).toEqual(['provider']);
      expect(logs[1].correlationId).toBe('provider-correlation-id');
      expect(logs[1].message).toBe('Unusual login pattern detected');
    });

    it('should propagate user context across async operations', async () => {
      // Create a user context
      const userContext: UserContext = {
        userId: 'user-789',
        isAuthenticated: true,
        correlationId: 'async-correlation-id',
      } as UserContext;

      // Create a user-specific logger
      const userLogger = loggerService.createUserLogger(userContext);

      // Simulate async operation
      const asyncOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        userLogger.log('Async operation completed');
      };

      // Execute async operation
      await asyncOperation();

      // Verify log entry
      const logEntry = mockTransport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry.userId).toBe('user-789');
      expect(logEntry.isAuthenticated).toBe(true);
      expect(logEntry.correlationId).toBe('async-correlation-id');
      expect(logEntry.message).toBe('Async operation completed');
    });
  });

  describe('Request Context Extraction', () => {
    it('should include request context in log entries', () => {
      // Create a request context
      const requestContext: RequestContext = {
        requestId: 'req-123',
        method: 'GET',
        url: 'https://api.austa.health/users/profile',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        correlationId: 'request-correlation-id',
      } as RequestContext;

      // Log with request context
      loggerService.logWithRequestContext(
        LogLevel.INFO,
        'API request received',
        requestContext
      );

      // Verify log entry
      const logEntry = mockTransport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry.requestId).toBe('req-123');
      expect(logEntry.method).toBe('GET');
      expect(logEntry.url).toBe('https://api.austa.health/users/profile');
      expect(logEntry.ip).toBe('192.168.1.1');
      expect(logEntry.userAgent).toBe('Mozilla/5.0');
      expect(logEntry.correlationId).toBe('request-correlation-id');
    });

    it('should create a request-specific logger that includes context in all logs', () => {
      // Create a request context
      const requestContext: RequestContext = {
        requestId: 'req-456',
        method: 'POST',
        url: 'https://api.austa.health/appointments',
        correlationId: 'appointment-correlation-id',
      } as RequestContext;

      // Create a request-specific logger
      const requestLogger = loggerService.createRequestLogger(requestContext);

      // Log using the request logger
      requestLogger.log('Processing appointment request');
      requestLogger.debug('Validating appointment data');

      // Verify log entries
      const logs = mockTransport.getLogs();
      expect(logs.length).toBe(2);

      // Check first log
      expect(logs[0].requestId).toBe('req-456');
      expect(logs[0].method).toBe('POST');
      expect(logs[0].url).toBe('https://api.austa.health/appointments');
      expect(logs[0].correlationId).toBe('appointment-correlation-id');
      expect(logs[0].message).toBe('Processing appointment request');

      // Check second log
      expect(logs[1].requestId).toBe('req-456');
      expect(logs[1].method).toBe('POST');
      expect(logs[1].url).toBe('https://api.austa.health/appointments');
      expect(logs[1].correlationId).toBe('appointment-correlation-id');
      expect(logs[1].message).toBe('Validating appointment data');
    });

    it('should sanitize sensitive information from request context', () => {
      // Create a request context with sensitive information
      const requestContext: RequestContext = {
        requestId: 'req-789',
        method: 'POST',
        url: 'https://api.austa.health/auth/login',
        params: {
          username: 'testuser',
          password: 'supersecret', // Sensitive
          rememberMe: true,
        },
        headers: {
          'authorization': 'Bearer token123', // Sensitive
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0',
        },
        correlationId: 'login-correlation-id',
      } as RequestContext;

      // Create a context manager to handle sanitization
      const sanitizedContext = contextManager.createRequestContext(requestContext);

      // Log with sanitized request context
      loggerService.logWithRequestContext(
        LogLevel.INFO,
        'Login attempt',
        sanitizedContext
      );

      // Verify log entry
      const logEntry = mockTransport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry.requestId).toBe('req-789');
      expect(logEntry.method).toBe('POST');
      expect(logEntry.url).toBe('https://api.austa.health/auth/login');
      
      // Verify sensitive data is sanitized
      if (logEntry.params) {
        expect(logEntry.params.username).toBe('testuser');
        expect(logEntry.params.password).not.toBe('supersecret');
        expect(logEntry.params.rememberMe).toBe(true);
      }
      
      if (logEntry.headers) {
        expect(logEntry.headers['authorization']).not.toBe('Bearer token123');
        expect(logEntry.headers['content-type']).toBe('application/json');
        expect(logEntry.headers['user-agent']).toBe('Mozilla/5.0');
      }
    });
  });

  describe('Context Inheritance in Nested Operations', () => {
    it('should properly merge multiple context types', () => {
      // Create different context types
      const userContext: UserContext = {
        userId: 'user-123',
        isAuthenticated: true,
        correlationId: 'user-correlation-id',
      } as UserContext;

      const journeyContext: JourneyContext = {
        journeyType: 'health',
        journeyState: { step: 'metrics-input' },
        correlationId: 'journey-correlation-id', // This should override user correlationId
      } as JourneyContext;

      const requestContext: RequestContext = {
        requestId: 'req-123',
        method: 'POST',
        url: 'https://api.austa.health/metrics',
        // No correlationId, should use journey's
      } as RequestContext;

      // Log with combined contexts
      loggerService.logWithCombinedContext(
        LogLevel.INFO,
        'Health metrics submitted',
        [userContext, journeyContext, requestContext]
      );

      // Verify log entry
      const logEntry = mockTransport.getLastLog();
      expect(logEntry).toBeDefined();
      
      // User context properties
      expect(logEntry.userId).toBe('user-123');
      expect(logEntry.isAuthenticated).toBe(true);
      
      // Journey context properties
      expect(logEntry.journeyType).toBe('health');
      expect(logEntry.journeyState).toEqual({ step: 'metrics-input' });
      
      // Request context properties
      expect(logEntry.requestId).toBe('req-123');
      expect(logEntry.method).toBe('POST');
      expect(logEntry.url).toBe('https://api.austa.health/metrics');
      
      // Correlation ID should come from journey context (last one wins)
      expect(logEntry.correlationId).toBe('journey-correlation-id');
    });

    it('should maintain context in nested function calls', () => {
      // Create a user context
      const userContext: UserContext = {
        userId: 'user-123',
        isAuthenticated: true,
        correlationId: 'nested-correlation-id',
      } as UserContext;

      // Create a user-specific logger
      const userLogger = loggerService.createUserLogger(userContext);

      // Define nested functions
      const level3Function = () => {
        userLogger.log('Level 3 function executed');
      };

      const level2Function = () => {
        userLogger.log('Level 2 function executed');
        level3Function();
      };

      const level1Function = () => {
        userLogger.log('Level 1 function executed');
        level2Function();
      };

      // Execute nested functions
      level1Function();

      // Verify log entries
      const logs = mockTransport.getLogs();
      expect(logs.length).toBe(3);

      // All logs should have the same user context
      logs.forEach(log => {
        expect(log.userId).toBe('user-123');
        expect(log.isAuthenticated).toBe(true);
        expect(log.correlationId).toBe('nested-correlation-id');
      });

      // Check log messages in order
      expect(logs[0].message).toBe('Level 1 function executed');
      expect(logs[1].message).toBe('Level 2 function executed');
      expect(logs[2].message).toBe('Level 3 function executed');
    });

    it('should preserve context across async boundaries', async () => {
      // Create contexts
      const userContext: UserContext = {
        userId: 'user-456',
        isAuthenticated: true,
      } as UserContext;

      const journeyContext: JourneyContext = {
        journeyType: 'care',
        journeyState: { step: 'provider-search' },
        correlationId: 'async-journey-id',
      } as JourneyContext;

      // Create combined logger
      const combinedLogger = loggerService.createContextLogger(
        contextManager.mergeContexts(userContext, journeyContext)
      );

      // Define async functions
      const asyncLevel2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        combinedLogger.log('Async level 2 executed');
      };

      const asyncLevel1 = async () => {
        combinedLogger.log('Async level 1 starting');
        await asyncLevel2();
        combinedLogger.log('Async level 1 completed');
      };

      // Execute async functions
      await asyncLevel1();

      // Verify log entries
      const logs = mockTransport.getLogs();
      expect(logs.length).toBe(3);

      // All logs should have the same combined context
      logs.forEach(log => {
        expect(log.userId).toBe('user-456');
        expect(log.isAuthenticated).toBe(true);
        expect(log.journeyType).toBe('care');
        expect(log.journeyState).toEqual({ step: 'provider-search' });
        expect(log.correlationId).toBe('async-journey-id');
      });

      // Check log messages in order
      expect(logs[0].message).toBe('Async level 1 starting');
      expect(logs[1].message).toBe('Async level 2 executed');
      expect(logs[2].message).toBe('Async level 1 completed');
    });
  });

  describe('Context Isolation Between Concurrent Operations', () => {
    it('should maintain separate contexts for concurrent operations', async () => {
      // Create different user contexts
      const userContext1: UserContext = {
        userId: 'user-1',
        isAuthenticated: true,
        correlationId: 'concurrent-id-1',
      } as UserContext;

      const userContext2: UserContext = {
        userId: 'user-2',
        isAuthenticated: true,
        correlationId: 'concurrent-id-2',
      } as UserContext;

      // Create user-specific loggers
      const userLogger1 = loggerService.createUserLogger(userContext1);
      const userLogger2 = loggerService.createUserLogger(userContext2);

      // Define concurrent operations
      const operation1 = async () => {
        userLogger1.log('Operation 1 starting');
        await new Promise(resolve => setTimeout(resolve, 15));
        userLogger1.log('Operation 1 completed');
      };

      const operation2 = async () => {
        userLogger2.log('Operation 2 starting');
        await new Promise(resolve => setTimeout(resolve, 10));
        userLogger2.log('Operation 2 completed');
      };

      // Execute operations concurrently
      await Promise.all([operation1(), operation2()]);

      // Verify log entries
      const logs = mockTransport.getLogs();
      expect(logs.length).toBe(4);

      // Filter logs by user ID
      const user1Logs = logs.filter(log => log.userId === 'user-1');
      const user2Logs = logs.filter(log => log.userId === 'user-2');

      // Check user 1 logs
      expect(user1Logs.length).toBe(2);
      expect(user1Logs[0].message).toBe('Operation 1 starting');
      expect(user1Logs[1].message).toBe('Operation 1 completed');
      user1Logs.forEach(log => {
        expect(log.correlationId).toBe('concurrent-id-1');
      });

      // Check user 2 logs
      expect(user2Logs.length).toBe(2);
      expect(user2Logs[0].message).toBe('Operation 2 starting');
      expect(user2Logs[1].message).toBe('Operation 2 completed');
      user2Logs.forEach(log => {
        expect(log.correlationId).toBe('concurrent-id-2');
      });
    });

    it('should not leak context between different logger instances', () => {
      // Create different journey contexts
      const healthJourneyContext: JourneyContext = {
        journeyType: 'health',
        correlationId: 'health-journey-id',
      } as JourneyContext;

      const careJourneyContext: JourneyContext = {
        journeyType: 'care',
        correlationId: 'care-journey-id',
      } as JourneyContext;

      // Create journey-specific loggers
      const healthLogger = loggerService.createJourneyLogger(healthJourneyContext);
      const careLogger = loggerService.createJourneyLogger(careJourneyContext);

      // Log with both loggers
      healthLogger.log('Health journey event');
      careLogger.log('Care journey event');
      healthLogger.log('Another health event');

      // Verify log entries
      const logs = mockTransport.getLogs();
      expect(logs.length).toBe(3);

      // Check health journey logs
      const healthLogs = logs.filter(log => log.journeyType === 'health');
      expect(healthLogs.length).toBe(2);
      healthLogs.forEach(log => {
        expect(log.correlationId).toBe('health-journey-id');
      });

      // Check care journey logs
      const careLogs = logs.filter(log => log.journeyType === 'care');
      expect(careLogs.length).toBe(1);
      expect(careLogs[0].correlationId).toBe('care-journey-id');
    });

    it('should handle context changes without affecting other contexts', () => {
      // Create initial journey context
      const initialJourneyContext: JourneyContext = {
        journeyType: 'health',
        journeyState: { step: 'initial' },
        correlationId: 'journey-id',
      } as JourneyContext;

      // Create journey logger
      const journeyLogger = loggerService.createJourneyLogger(initialJourneyContext);

      // Log with initial context
      journeyLogger.log('Initial journey state');

      // Create modified context
      const modifiedJourneyContext: JourneyContext = {
        ...initialJourneyContext,
        journeyState: { step: 'modified' },
      };

      // Create new logger with modified context
      const modifiedLogger = loggerService.createJourneyLogger(modifiedJourneyContext);

      // Log with both loggers
      journeyLogger.log('Using original context');
      modifiedLogger.log('Using modified context');

      // Verify log entries
      const logs = mockTransport.getLogs();
      expect(logs.length).toBe(3);

      // Check initial log
      expect(logs[0].journeyState).toEqual({ step: 'initial' });
      expect(logs[0].message).toBe('Initial journey state');

      // Check original context log
      expect(logs[1].journeyState).toEqual({ step: 'initial' });
      expect(logs[1].message).toBe('Using original context');

      // Check modified context log
      expect(logs[2].journeyState).toEqual({ step: 'modified' });
      expect(logs[2].message).toBe('Using modified context');
    });
  });

  describe('Tracing Integration', () => {
    it('should include trace context in log entries', () => {
      // Set specific trace IDs
      mockTracingService.setTraceId('abcdef1234567890abcdef1234567890');
      mockTracingService.setSpanId('abcdef1234567890');

      // Log a message
      loggerService.log('Operation with tracing');

      // Verify log entry
      const logEntry = mockTransport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry.traceId).toBe('abcdef1234567890abcdef1234567890');
      expect(logEntry.spanId).toBe('abcdef1234567890');
    });

    it('should maintain trace context with journey context', () => {
      // Set specific trace IDs
      mockTracingService.setTraceId('trace-123');
      mockTracingService.setSpanId('span-456');

      // Create journey context
      const journeyContext: JourneyContext = {
        journeyType: 'plan',
        correlationId: 'plan-journey-id',
      } as JourneyContext;

      // Log with journey context
      loggerService.logWithJourneyContext(
        LogLevel.INFO,
        'Plan selection',
        journeyContext
      );

      // Verify log entry
      const logEntry = mockTransport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry.journeyType).toBe('plan');
      expect(logEntry.correlationId).toBe('plan-journey-id');
      expect(logEntry.traceId).toBe('trace-123');
      expect(logEntry.spanId).toBe('span-456');
    });
  });
});
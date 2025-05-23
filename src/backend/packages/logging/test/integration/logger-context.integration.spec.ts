import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerModule } from '../../src/logger.module';
import { ContextManager } from '../../src/context/context-manager';
import { JourneyType } from '../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { TracingService } from '@austa/tracing';

/**
 * Mock implementation of the TracingService for testing purposes.
 */
class MockTracingService implements TracingService {
  private traceId = 'test-trace-id';
  private spanId = 'test-span-id';
  private parentSpanId = 'test-parent-span-id';

  getCurrentTraceId(): string {
    return this.traceId;
  }

  getCurrentSpanId(): string {
    return this.spanId;
  }

  getParentSpanId(): string {
    return this.parentSpanId;
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  setSpanId(spanId: string): void {
    this.spanId = spanId;
  }

  setParentSpanId(parentSpanId: string): void {
    this.parentSpanId = parentSpanId;
  }
}

/**
 * Mock transport for capturing log entries during tests.
 */
class TestTransport {
  public logs: any[] = [];

  write(formattedLog: string, level: LogLevel): void {
    try {
      this.logs.push(JSON.parse(formattedLog));
    } catch (e) {
      this.logs.push({ message: formattedLog, level });
    }
  }

  clear(): void {
    this.logs = [];
  }
}

describe('LoggerService Context Integration', () => {
  let loggerService: LoggerService;
  let tracingService: MockTracingService;
  let testTransport: TestTransport;
  let contextManager: ContextManager;

  beforeEach(async () => {
    testTransport = new TestTransport();
    tracingService = new MockTracingService();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({
          serviceName: 'test-service',
          logLevel: 'debug',
          formatter: 'json',
          transports: ['console']
        })
      ],
      providers: [
        {
          provide: TracingService,
          useValue: tracingService
        }
      ]
    }).compile();

    loggerService = module.get<LoggerService>(LoggerService);
    contextManager = new ContextManager({ tracingService });

    // Replace the transports with our test transport
    (loggerService as any).transports = [testTransport];
    
    // Clear logs before each test
    testTransport.clear();
  });

  afterEach(() => {
    testTransport.clear();
  });

  describe('Basic Context Enrichment', () => {
    it('should include service name in logs', () => {
      loggerService.log('Test message');
      
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].context.serviceName).toBe('test-service');
    });

    it('should include trace information in logs', () => {
      loggerService.log('Test message with trace');
      
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].traceId).toBe('test-trace-id');
      expect(testTransport.logs[0].spanId).toBe('test-span-id');
    });

    it('should include timestamp in logs', () => {
      loggerService.log('Test message with timestamp');
      
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].timestamp).toBeDefined();
      expect(new Date(testTransport.logs[0].timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Journey Context', () => {
    it('should include journey context in logs', () => {
      const journeyLogger = loggerService.withJourneyContext({
        journeyType: JourneyType.HEALTH,
        resourceId: 'health-record-123'
      });

      journeyLogger.log('Health journey log');
      
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].context.journeyType).toBe(JourneyType.HEALTH);
      expect(testTransport.logs[0].context.resourceId).toBe('health-record-123');
    });

    it('should use journey-specific helper methods', () => {
      loggerService.forHealthJourney({ resourceId: 'health-metric-456' }).log('Health metric updated');
      loggerService.forCareJourney({ resourceId: 'appointment-789' }).log('Appointment scheduled');
      loggerService.forPlanJourney({ resourceId: 'claim-101' }).log('Claim submitted');
      
      expect(testTransport.logs.length).toBe(3);
      
      expect(testTransport.logs[0].context.journeyType).toBe(JourneyType.HEALTH);
      expect(testTransport.logs[0].context.resourceId).toBe('health-metric-456');
      expect(testTransport.logs[0].message).toBe('Health metric updated');
      
      expect(testTransport.logs[1].context.journeyType).toBe(JourneyType.CARE);
      expect(testTransport.logs[1].context.resourceId).toBe('appointment-789');
      expect(testTransport.logs[1].message).toBe('Appointment scheduled');
      
      expect(testTransport.logs[2].context.journeyType).toBe(JourneyType.PLAN);
      expect(testTransport.logs[2].context.resourceId).toBe('claim-101');
      expect(testTransport.logs[2].message).toBe('Claim submitted');
    });

    it('should maintain journey context across multiple log calls', () => {
      const healthLogger = loggerService.forHealthJourney({ resourceId: 'health-goal-123' });
      
      healthLogger.log('Goal created');
      healthLogger.warn('Goal target may be unrealistic');
      healthLogger.error('Failed to sync goal with wearable device');
      
      expect(testTransport.logs.length).toBe(3);
      testTransport.logs.forEach(log => {
        expect(log.context.journeyType).toBe(JourneyType.HEALTH);
        expect(log.context.resourceId).toBe('health-goal-123');
      });
      
      expect(testTransport.logs[0].level).toBe(LogLevel.INFO);
      expect(testTransport.logs[1].level).toBe(LogLevel.WARN);
      expect(testTransport.logs[2].level).toBe(LogLevel.ERROR);
    });
  });

  describe('User Context', () => {
    it('should include user context in logs', () => {
      const userLogger = loggerService.withUserContext({
        userId: 'user-123',
        sessionId: 'session-456',
        roles: ['patient']
      });

      userLogger.log('User action logged');
      
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].context.userId).toBe('user-123');
      expect(testTransport.logs[0].context.sessionId).toBe('session-456');
      expect(testTransport.logs[0].context.roles).toContain('patient');
    });

    it('should maintain user context across multiple log calls', () => {
      const userLogger = loggerService.withUserContext({
        userId: 'user-789',
        isAuthenticated: true
      });
      
      userLogger.log('User logged in');
      userLogger.log('User viewed dashboard');
      userLogger.log('User logged out');
      
      expect(testTransport.logs.length).toBe(3);
      testTransport.logs.forEach(log => {
        expect(log.context.userId).toBe('user-789');
        expect(log.context.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Request Context', () => {
    it('should include request context in logs', () => {
      const requestLogger = loggerService.withRequestContext({
        requestId: 'req-123',
        method: 'GET',
        url: '/api/health/metrics',
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      requestLogger.log('API request received');
      
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].context.requestId).toBe('req-123');
      expect(testTransport.logs[0].context.method).toBe('GET');
      expect(testTransport.logs[0].context.url).toBe('/api/health/metrics');
      expect(testTransport.logs[0].context.clientIp).toBe('192.168.1.1');
      expect(testTransport.logs[0].context.userAgent).toBe('Mozilla/5.0');
    });

    it('should sanitize sensitive information in request context', () => {
      const requestContext = contextManager.extractContextFromRequest({
        id: 'req-456',
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'authorization': 'Bearer token123',
          'user-agent': 'Mozilla/5.0',
          'content-type': 'application/json'
        },
        body: {
          username: 'testuser',
          password: 'secret123'
        }
      });

      const requestLogger = loggerService.withRequestContext(requestContext);
      requestLogger.log('Login attempt');
      
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].context.requestId).toBe('req-456');
      expect(testTransport.logs[0].context.headers.authorization).toBe('[REDACTED]');
      expect(testTransport.logs[0].context.headers['content-type']).toBe('application/json');
      
      // Body should not be included by default for security reasons
      expect(testTransport.logs[0].context.body).toBeUndefined();
    });
  });

  describe('Context Merging', () => {
    it('should properly merge multiple context types', () => {
      // Create a logger with user context
      const userLogger = loggerService.withUserContext({
        userId: 'user-123',
        roles: ['patient']
      });
      
      // Add journey context
      const journeyUserLogger = userLogger.withJourneyContext({
        journeyType: JourneyType.CARE,
        resourceId: 'appointment-456'
      });
      
      // Add request context
      const fullContextLogger = journeyUserLogger.withRequestContext({
        requestId: 'req-789',
        method: 'POST',
        url: '/api/care/appointments'
      });
      
      fullContextLogger.log('Appointment created');
      
      expect(testTransport.logs.length).toBe(1);
      const logContext = testTransport.logs[0].context;
      
      // User context should be present
      expect(logContext.userId).toBe('user-123');
      expect(logContext.roles).toContain('patient');
      
      // Journey context should be present
      expect(logContext.journeyType).toBe(JourneyType.CARE);
      expect(logContext.resourceId).toBe('appointment-456');
      
      // Request context should be present
      expect(logContext.requestId).toBe('req-789');
      expect(logContext.method).toBe('POST');
      expect(logContext.url).toBe('/api/care/appointments');
    });

    it('should override properties when merging contexts', () => {
      // Create a logger with a context containing a property
      const loggerA = loggerService.withContext({ property: 'original value' });
      
      // Create a new logger that overrides the property
      const loggerB = loggerA.withContext({ property: 'new value' });
      
      loggerA.log('Log with original value');
      loggerB.log('Log with new value');
      
      expect(testTransport.logs.length).toBe(2);
      expect(testTransport.logs[0].context.property).toBe('original value');
      expect(testTransport.logs[1].context.property).toBe('new value');
    });

    it('should merge metadata from different contexts', () => {
      // Create a logger with metadata
      const loggerA = loggerService.withContext({ 
        metadata: { source: 'system', feature: 'authentication' } 
      });
      
      // Create a new logger with additional metadata
      const loggerB = loggerA.withContext({ 
        metadata: { action: 'login', result: 'success' } 
      });
      
      loggerB.log('User authenticated');
      
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].context.metadata.source).toBe('system');
      expect(testTransport.logs[0].context.metadata.feature).toBe('authentication');
      expect(testTransport.logs[0].context.metadata.action).toBe('login');
      expect(testTransport.logs[0].context.metadata.result).toBe('success');
    });
  });

  describe('Async Context Propagation', () => {
    it('should maintain context across async operations', async () => {
      const journeyLogger = loggerService.forHealthJourney({ resourceId: 'health-metric-123' });
      
      journeyLogger.log('Before async operation');
      
      await new Promise<void>(resolve => {
        setTimeout(() => {
          journeyLogger.log('During async operation');
          resolve();
        }, 10);
      });
      
      journeyLogger.log('After async operation');
      
      expect(testTransport.logs.length).toBe(3);
      testTransport.logs.forEach(log => {
        expect(log.context.journeyType).toBe(JourneyType.HEALTH);
        expect(log.context.resourceId).toBe('health-metric-123');
      });
    });

    it('should maintain context in Promise chains', async () => {
      const userLogger = loggerService.withUserContext({ userId: 'user-123' });
      
      await Promise.resolve()
        .then(() => {
          userLogger.log('First promise step');
          return 'next';
        })
        .then(value => {
          userLogger.log(`Second promise step: ${value}`);
          return 'final';
        })
        .then(value => {
          userLogger.log(`Final promise step: ${value}`);
        });
      
      expect(testTransport.logs.length).toBe(3);
      testTransport.logs.forEach(log => {
        expect(log.context.userId).toBe('user-123');
      });
      
      expect(testTransport.logs[0].message).toBe('First promise step');
      expect(testTransport.logs[1].message).toBe('Second promise step: next');
      expect(testTransport.logs[2].message).toBe('Final promise step: final');
    });

    it('should maintain context with async/await', async () => {
      const requestLogger = loggerService.withRequestContext({ requestId: 'req-123' });
      
      async function nestedAsyncFunction() {
        requestLogger.log('Inside nested async function');
        await new Promise(resolve => setTimeout(resolve, 10));
        requestLogger.log('After await in nested function');
        return 'done';
      }
      
      requestLogger.log('Before calling async function');
      const result = await nestedAsyncFunction();
      requestLogger.log(`After async function with result: ${result}`);
      
      expect(testTransport.logs.length).toBe(4);
      testTransport.logs.forEach(log => {
        expect(log.context.requestId).toBe('req-123');
      });
    });
  });

  describe('Nested Operations', () => {
    it('should handle nested logger instances correctly', () => {
      // Create a base logger with user context
      const userLogger = loggerService.withUserContext({ userId: 'user-123' });
      userLogger.log('User context log');
      
      // Create a nested logger with journey context
      const journeyLogger = userLogger.withJourneyContext({ 
        journeyType: JourneyType.HEALTH,
        resourceId: 'health-goal-456'
      });
      journeyLogger.log('Journey context log');
      
      // Create a further nested logger with request context
      const requestLogger = journeyLogger.withRequestContext({ 
        requestId: 'req-789',
        method: 'PUT'
      });
      requestLogger.log('Request context log');
      
      // Original loggers should maintain their own contexts
      userLogger.log('Another user context log');
      journeyLogger.log('Another journey context log');
      
      expect(testTransport.logs.length).toBe(5);
      
      // First log: user context only
      expect(testTransport.logs[0].context.userId).toBe('user-123');
      expect(testTransport.logs[0].context.journeyType).toBeUndefined();
      expect(testTransport.logs[0].context.requestId).toBeUndefined();
      
      // Second log: user + journey context
      expect(testTransport.logs[1].context.userId).toBe('user-123');
      expect(testTransport.logs[1].context.journeyType).toBe(JourneyType.HEALTH);
      expect(testTransport.logs[1].context.requestId).toBeUndefined();
      
      // Third log: user + journey + request context
      expect(testTransport.logs[2].context.userId).toBe('user-123');
      expect(testTransport.logs[2].context.journeyType).toBe(JourneyType.HEALTH);
      expect(testTransport.logs[2].context.requestId).toBe('req-789');
      
      // Fourth log: user context only (again)
      expect(testTransport.logs[3].context.userId).toBe('user-123');
      expect(testTransport.logs[3].context.journeyType).toBeUndefined();
      expect(testTransport.logs[3].context.requestId).toBeUndefined();
      
      // Fifth log: user + journey context (again)
      expect(testTransport.logs[4].context.userId).toBe('user-123');
      expect(testTransport.logs[4].context.journeyType).toBe(JourneyType.HEALTH);
      expect(testTransport.logs[4].context.requestId).toBeUndefined();
    });

    it('should handle child loggers with inheritance', () => {
      const parentLogger = loggerService.withContext({ component: 'parent' });
      const childLogger = parentLogger.child('child');
      
      parentLogger.log('Parent log');
      childLogger.log('Child log');
      
      expect(testTransport.logs.length).toBe(2);
      expect(testTransport.logs[0].context.component).toBe('parent');
      expect(testTransport.logs[0].context.childName).toBeUndefined();
      
      expect(testTransport.logs[1].context.component).toBe('parent');
      expect(testTransport.logs[1].context.childName).toBe('child');
    });

    it('should handle deeply nested operations', () => {
      function level1() {
        const l1Logger = loggerService.withContext({ level: 1 });
        l1Logger.log('Level 1');
        level2(l1Logger);
      }
      
      function level2(parentLogger: any) {
        const l2Logger = parentLogger.withContext({ level: 2 });
        l2Logger.log('Level 2');
        level3(l2Logger);
      }
      
      function level3(parentLogger: any) {
        const l3Logger = parentLogger.withContext({ level: 3 });
        l3Logger.log('Level 3');
      }
      
      level1();
      
      expect(testTransport.logs.length).toBe(3);
      
      expect(testTransport.logs[0].context.level).toBe(1);
      
      expect(testTransport.logs[1].context.level).toBe(2);
      
      expect(testTransport.logs[2].context.level).toBe(3);
    });
  });

  describe('Context Isolation', () => {
    it('should maintain context isolation between different logger instances', () => {
      const healthLogger = loggerService.forHealthJourney();
      const careLogger = loggerService.forCareJourney();
      const planLogger = loggerService.forPlanJourney();
      
      healthLogger.log('Health journey log');
      careLogger.log('Care journey log');
      planLogger.log('Plan journey log');
      
      expect(testTransport.logs.length).toBe(3);
      expect(testTransport.logs[0].context.journeyType).toBe(JourneyType.HEALTH);
      expect(testTransport.logs[1].context.journeyType).toBe(JourneyType.CARE);
      expect(testTransport.logs[2].context.journeyType).toBe(JourneyType.PLAN);
    });

    it('should maintain context isolation in concurrent operations', async () => {
      const userA = loggerService.withUserContext({ userId: 'user-A' });
      const userB = loggerService.withUserContext({ userId: 'user-B' });
      
      // Simulate concurrent operations
      await Promise.all([
        new Promise<void>(resolve => {
          setTimeout(() => {
            userA.log('User A operation');
            resolve();
          }, Math.random() * 10);
        }),
        new Promise<void>(resolve => {
          setTimeout(() => {
            userB.log('User B operation');
            resolve();
          }, Math.random() * 10);
        })
      ]);
      
      expect(testTransport.logs.length).toBe(2);
      
      // Find logs by message
      const userALog = testTransport.logs.find(log => log.message === 'User A operation');
      const userBLog = testTransport.logs.find(log => log.message === 'User B operation');
      
      expect(userALog).toBeDefined();
      expect(userBLog).toBeDefined();
      expect(userALog?.context.userId).toBe('user-A');
      expect(userBLog?.context.userId).toBe('user-B');
    });

    it('should maintain context isolation when contexts change', () => {
      // Create a logger with initial context
      const initialLogger = loggerService.withContext({ version: '1.0' });
      
      // Store a reference to the initial logger
      const storedLogger = initialLogger;
      
      // Create a new logger with updated context
      const updatedLogger = loggerService.withContext({ version: '2.0' });
      
      // Both loggers should maintain their separate contexts
      initialLogger.log('Initial logger');
      updatedLogger.log('Updated logger');
      storedLogger.log('Stored logger reference');
      
      expect(testTransport.logs.length).toBe(3);
      expect(testTransport.logs[0].context.version).toBe('1.0');
      expect(testTransport.logs[1].context.version).toBe('2.0');
      expect(testTransport.logs[2].context.version).toBe('1.0'); // Should match initial logger
    });
  });

  describe('Trace Context Integration', () => {
    it('should update trace context when tracing service changes', () => {
      // Initial log with default trace ID
      loggerService.log('Initial trace');
      
      // Change the trace ID in the tracing service
      tracingService.setTraceId('new-trace-id');
      tracingService.setSpanId('new-span-id');
      
      // Create a new logger with current trace context
      const tracedLogger = loggerService.withCurrentTraceContext();
      tracedLogger.log('Updated trace');
      
      expect(testTransport.logs.length).toBe(2);
      expect(testTransport.logs[0].traceId).toBe('test-trace-id');
      expect(testTransport.logs[0].spanId).toBe('test-span-id');
      
      expect(testTransport.logs[1].traceId).toBe('new-trace-id');
      expect(testTransport.logs[1].spanId).toBe('new-span-id');
    });

    it('should handle trace context in async operations', async () => {
      // Set initial trace context
      tracingService.setTraceId('trace-1');
      const logger1 = loggerService.withCurrentTraceContext();
      
      // Start an async operation with the first trace context
      const operation1 = new Promise<void>(resolve => {
        setTimeout(() => {
          logger1.log('Operation 1');
          resolve();
        }, 10);
      });
      
      // Change trace context for a second operation
      tracingService.setTraceId('trace-2');
      const logger2 = loggerService.withCurrentTraceContext();
      
      // Start a second async operation with the new trace context
      const operation2 = new Promise<void>(resolve => {
        setTimeout(() => {
          logger2.log('Operation 2');
          resolve();
        }, 5);
      });
      
      // Wait for both operations to complete
      await Promise.all([operation1, operation2]);
      
      expect(testTransport.logs.length).toBe(2);
      
      // Find logs by message
      const log1 = testTransport.logs.find(log => log.message === 'Operation 1');
      const log2 = testTransport.logs.find(log => log.message === 'Operation 2');
      
      expect(log1).toBeDefined();
      expect(log2).toBeDefined();
      expect(log1?.traceId).toBe('trace-1');
      expect(log2?.traceId).toBe('trace-2');
    });
  });
});
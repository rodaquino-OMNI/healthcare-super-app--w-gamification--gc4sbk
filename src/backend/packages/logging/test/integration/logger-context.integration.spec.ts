import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerModule } from '../../src/logger.module';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { JourneyType } from '../../src/context/context.constants';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { ContextManager } from '../../src/context/context-manager';
import { MemoryTransport, createTestLogger, assertLogEntry } from './utils';
import { MockTracingService } from '../mocks/tracing.service.mock';

describe('LoggerService Context Integration', () => {
  let logger: LoggerService;
  let transport: MemoryTransport;
  let tracingService: MockTracingService;

  beforeEach(async () => {
    // Create a test logger with a memory transport for capturing logs
    const testSetup = await createTestLogger({
      level: LogLevel.DEBUG,
      defaultContext: {
        application: 'austa-superapp',
        service: 'test-service',
        environment: 'test',
      },
    });

    logger = testSetup.logger;
    transport = testSetup.transport;
    
    // Get the tracing service from the logger
    tracingService = new MockTracingService();
    (logger as any).tracingService = tracingService;
  });

  afterEach(() => {
    // Reset the transport to clear logs between tests
    transport.reset();
    if (tracingService) {
      tracingService.reset();
    }
  });

  describe('Basic Context Handling', () => {
    it('should include journey context in log entries', () => {
      // Create a logger with health journey context
      const journeyLogger = logger.forHealthJourney({
        journeyState: { currentSection: 'metrics' }
      });

      // Log a message with the journey context
      journeyLogger.log('Health metric recorded');

      // Verify the log entry includes the journey context
      const logEntry = transport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry?.context?.journey).toBe(JourneyType.HEALTH);
      expect(logEntry?.context?.journeyState?.currentSection).toBe('metrics');
    });

    it('should include user context in log entries', () => {
      // Create a logger with user context
      const userId = 'user-123';
      const userLogger = logger.withUserContext({
        userId,
        isAuthenticated: true,
        roles: ['user']
      });

      // Log a message with the user context
      userLogger.log('User action performed');

      // Verify the log entry includes the user context
      const logEntry = transport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry?.context?.userId).toBe(userId);
      expect(logEntry?.context?.isAuthenticated).toBe(true);
      expect(logEntry?.context?.roles).toContain('user');
    });

    it('should include request context in log entries', () => {
      // Create a logger with request context
      const requestId = 'req-456';
      const requestLogger = logger.withRequestContext({
        requestId,
        method: 'GET',
        url: '/api/health/metrics',
        ip: '127.0.0.1'
      });

      // Log a message with the request context
      requestLogger.log('API request received');

      // Verify the log entry includes the request context
      const logEntry = transport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry?.context?.requestId).toBe(requestId);
      expect(logEntry?.context?.method).toBe('GET');
      expect(logEntry?.context?.url).toBe('/api/health/metrics');
      expect(logEntry?.context?.ip).toBe('127.0.0.1');
    });

    it('should support all journey types', () => {
      // Test each journey type
      const healthLogger = logger.forHealthJourney();
      healthLogger.log('Health journey log');
      const healthLog = transport.getLastLog();
      expect(healthLog?.context?.journey).toBe(JourneyType.HEALTH);

      transport.reset();

      const careLogger = logger.forCareJourney();
      careLogger.log('Care journey log');
      const careLog = transport.getLastLog();
      expect(careLog?.context?.journey).toBe(JourneyType.CARE);

      transport.reset();

      const planLogger = logger.forPlanJourney();
      planLogger.log('Plan journey log');
      const planLog = transport.getLastLog();
      expect(planLog?.context?.journey).toBe(JourneyType.PLAN);
    });
  });

  describe('Context Inheritance and Nesting', () => {
    it('should properly merge multiple context types', () => {
      // Create a logger with multiple context types
      const multiContextLogger = logger
        .forHealthJourney({ journeyState: { currentSection: 'metrics' } })
        .withUserContext({ userId: 'user-123', isAuthenticated: true })
        .withRequestContext({ requestId: 'req-456', method: 'POST' });

      // Log a message with the combined context
      multiContextLogger.log('Multi-context log');

      // Verify the log entry includes all context types
      const logEntry = transport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry?.context?.journey).toBe(JourneyType.HEALTH);
      expect(logEntry?.context?.journeyState?.currentSection).toBe('metrics');
      expect(logEntry?.context?.userId).toBe('user-123');
      expect(logEntry?.context?.isAuthenticated).toBe(true);
      expect(logEntry?.context?.requestId).toBe('req-456');
      expect(logEntry?.context?.method).toBe('POST');
    });

    it('should override context properties when contexts are merged', () => {
      // Create a logger with a base context
      const baseLogger = logger.withContext({
        correlationId: 'original-correlation-id',
        userId: 'original-user-id'
      } as LoggingContext);

      // Create a derived logger with some overlapping properties
      const derivedLogger = baseLogger.withContext({
        correlationId: 'new-correlation-id',
        requestId: 'req-789'
      } as LoggingContext);

      // Log a message with the derived context
      derivedLogger.log('Context override test');

      // Verify the log entry has the overridden properties
      const logEntry = transport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry?.context?.correlationId).toBe('new-correlation-id');
      expect(logEntry?.context?.userId).toBe('original-user-id');
      expect(logEntry?.context?.requestId).toBe('req-789');
    });

    it('should handle nested context operations correctly', () => {
      // Create a base logger with user context
      const userLogger = logger.withUserContext({
        userId: 'user-123',
        isAuthenticated: true
      });

      // Log with the user context
      userLogger.log('User context log');

      // Create a nested logger with journey context
      const journeyLogger = userLogger.forHealthJourney();

      // Log with the combined context
      journeyLogger.log('Health journey for user');

      // Create another nested level with request context
      const requestLogger = journeyLogger.withRequestContext({
        requestId: 'req-456',
        method: 'GET'
      });

      // Log with all three context levels
      requestLogger.log('User health journey request');

      // Verify the log entries have the correct context at each level
      const logs = transport.logs;
      expect(logs.length).toBe(3);

      // First log should have only user context
      expect(logs[0].context?.userId).toBe('user-123');
      expect(logs[0].context?.journey).toBeUndefined();
      expect(logs[0].context?.requestId).toBeUndefined();

      // Second log should have user and journey context
      expect(logs[1].context?.userId).toBe('user-123');
      expect(logs[1].context?.journey).toBe(JourneyType.HEALTH);
      expect(logs[1].context?.requestId).toBeUndefined();

      // Third log should have all three contexts
      expect(logs[2].context?.userId).toBe('user-123');
      expect(logs[2].context?.journey).toBe(JourneyType.HEALTH);
      expect(logs[2].context?.requestId).toBe('req-456');
      expect(logs[2].context?.method).toBe('GET');
    });
  });

  describe('Async Context Propagation', () => {
    it('should maintain context across async operations', async () => {
      // Create a logger with context
      const contextLogger = logger
        .forHealthJourney()
        .withUserContext({ userId: 'user-123' });

      // Define an async function that uses the logger
      async function asyncOperation() {
        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Log after the async operation
        contextLogger.log('After async operation');
        return 'done';
      }

      // Log before the async operation
      contextLogger.log('Before async operation');
      
      // Perform the async operation
      await asyncOperation();

      // Verify both logs have the same context
      const logs = transport.logs;
      expect(logs.length).toBe(2);
      
      expect(logs[0].context?.journey).toBe(JourneyType.HEALTH);
      expect(logs[0].context?.userId).toBe('user-123');
      
      expect(logs[1].context?.journey).toBe(JourneyType.HEALTH);
      expect(logs[1].context?.userId).toBe('user-123');
    });

    it('should maintain context in Promise.all operations', async () => {
      // Create a logger with context
      const contextLogger = logger
        .forCareJourney()
        .withUserContext({ userId: 'user-456' });

      // Define multiple async functions that use the logger
      async function asyncOperation1() {
        await new Promise(resolve => setTimeout(resolve, 10));
        contextLogger.log('Async operation 1');
        return 'result1';
      }

      async function asyncOperation2() {
        await new Promise(resolve => setTimeout(resolve, 5));
        contextLogger.log('Async operation 2');
        return 'result2';
      }

      // Execute both operations in parallel
      await Promise.all([asyncOperation1(), asyncOperation2()]);

      // Verify both logs have the correct context
      const logs = transport.logs;
      expect(logs.length).toBe(2);
      
      logs.forEach(log => {
        expect(log.context?.journey).toBe(JourneyType.CARE);
        expect(log.context?.userId).toBe('user-456');
      });
    });

    it('should handle nested async operations with different contexts', async () => {
      // Create a base logger
      const baseLogger = logger.withUserContext({ userId: 'user-789' });

      // Define a nested async function
      async function outerOperation() {
        // Log in the outer operation
        baseLogger.log('Outer operation start');

        // Create a new logger with additional context
        const innerLogger = baseLogger.forPlanJourney();

        // Define and execute an inner async operation
        async function innerOperation() {
          await new Promise(resolve => setTimeout(resolve, 10));
          innerLogger.log('Inner operation');
          return 'inner-result';
        }

        // Execute the inner operation
        await innerOperation();

        // Log again in the outer operation
        baseLogger.log('Outer operation end');
        return 'outer-result';
      }

      // Execute the outer operation
      await outerOperation();

      // Verify the logs have the correct context
      const logs = transport.logs;
      expect(logs.length).toBe(3);

      // First and third logs should have only user context
      expect(logs[0].context?.userId).toBe('user-789');
      expect(logs[0].context?.journey).toBeUndefined();
      
      expect(logs[2].context?.userId).toBe('user-789');
      expect(logs[2].context?.journey).toBeUndefined();

      // Second log should have user and journey context
      expect(logs[1].context?.userId).toBe('user-789');
      expect(logs[1].context?.journey).toBe(JourneyType.PLAN);
    });
  });

  describe('Context Isolation', () => {
    it('should maintain context isolation between different logger instances', () => {
      // Create two separate logger instances with different contexts
      const healthLogger = logger.forHealthJourney();
      const careLogger = logger.forCareJourney();

      // Log with both loggers
      healthLogger.log('Health journey log');
      careLogger.log('Care journey log');

      // Verify each log has its own isolated context
      const logs = transport.logs;
      expect(logs.length).toBe(2);
      
      expect(logs[0].context?.journey).toBe(JourneyType.HEALTH);
      expect(logs[1].context?.journey).toBe(JourneyType.CARE);
    });

    it('should maintain context isolation in concurrent operations', async () => {
      // Create two separate logger instances
      const userLogger1 = logger.withUserContext({ userId: 'user-111' });
      const userLogger2 = logger.withUserContext({ userId: 'user-222' });

      // Define concurrent operations that use different loggers
      async function operation1() {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        userLogger1.log('Operation 1');
      }

      async function operation2() {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        userLogger2.log('Operation 2');
      }

      // Execute both operations concurrently
      await Promise.all([operation1(), operation2()]);

      // Verify context isolation
      const logs = transport.logs;
      expect(logs.length).toBe(2);
      
      const op1Log = transport.getLogsByMessage('Operation 1')[0];
      const op2Log = transport.getLogsByMessage('Operation 2')[0];
      
      expect(op1Log.context?.userId).toBe('user-111');
      expect(op2Log.context?.userId).toBe('user-222');
    });

    it('should not leak context between unrelated operations', async () => {
      // Create a logger with context
      const contextLogger = logger.withContext({
        correlationId: 'test-correlation-id',
        customField: 'custom-value'
      } as LoggingContext);

      // Log with the context logger
      contextLogger.log('With context');

      // Log with the original logger
      logger.log('Without context');

      // Verify context isolation
      const logs = transport.logs;
      expect(logs.length).toBe(2);
      
      expect(logs[0].context?.correlationId).toBe('test-correlation-id');
      expect(logs[0].context?.customField).toBe('custom-value');
      
      expect(logs[1].context?.correlationId).toBeUndefined();
      expect(logs[1].context?.customField).toBeUndefined();
    });
  });

  describe('Cross-Journey Context', () => {
    it('should handle transitions between journeys', () => {
      // Start with health journey
      const healthLogger = logger.forHealthJourney();
      healthLogger.log('In health journey');

      // Transition to care journey
      const careLogger = healthLogger.forCareJourney();
      careLogger.log('Transitioned to care journey');

      // Verify the journey context was properly updated
      const logs = transport.logs;
      expect(logs.length).toBe(2);
      
      expect(logs[0].context?.journey).toBe(JourneyType.HEALTH);
      expect(logs[1].context?.journey).toBe(JourneyType.CARE);
    });

    it('should preserve user context across journey transitions', () => {
      // Create a user context logger
      const userLogger = logger.withUserContext({
        userId: 'user-123',
        isAuthenticated: true
      });

      // Add health journey context
      const healthLogger = userLogger.forHealthJourney();
      healthLogger.log('User in health journey');

      // Transition to care journey
      const careLogger = healthLogger.forCareJourney();
      careLogger.log('User in care journey');

      // Verify the user context is preserved across journey transitions
      const logs = transport.logs;
      expect(logs.length).toBe(2);
      
      expect(logs[0].context?.userId).toBe('user-123');
      expect(logs[0].context?.isAuthenticated).toBe(true);
      expect(logs[0].context?.journey).toBe(JourneyType.HEALTH);
      
      expect(logs[1].context?.userId).toBe('user-123');
      expect(logs[1].context?.isAuthenticated).toBe(true);
      expect(logs[1].context?.journey).toBe(JourneyType.CARE);
    });

    it('should handle complex context transitions', () => {
      // Start with a base context
      const baseLogger = logger.withContext({
        correlationId: 'correlation-123',
        sessionId: 'session-456'
      } as LoggingContext);

      // Add user context
      const userLogger = baseLogger.withUserContext({
        userId: 'user-789',
        isAuthenticated: true
      });

      // Add health journey context
      const healthLogger = userLogger.forHealthJourney({
        journeyState: { currentSection: 'metrics' }
      });

      // Add request context
      const requestLogger = healthLogger.withRequestContext({
        requestId: 'req-101',
        method: 'POST'
      });

      // Log with the full context
      requestLogger.log('Complex context log');

      // Transition to care journey but keep other contexts
      const careLogger = requestLogger.forCareJourney({
        journeyState: { currentSection: 'appointments' }
      });

      // Log with the updated context
      careLogger.log('Transitioned to care journey');

      // Verify the context transitions
      const logs = transport.logs;
      expect(logs.length).toBe(2);
      
      // First log should have health journey context
      expect(logs[0].context?.correlationId).toBe('correlation-123');
      expect(logs[0].context?.sessionId).toBe('session-456');
      expect(logs[0].context?.userId).toBe('user-789');
      expect(logs[0].context?.isAuthenticated).toBe(true);
      expect(logs[0].context?.journey).toBe(JourneyType.HEALTH);
      expect(logs[0].context?.journeyState?.currentSection).toBe('metrics');
      expect(logs[0].context?.requestId).toBe('req-101');
      expect(logs[0].context?.method).toBe('POST');
      
      // Second log should have care journey context but keep other contexts
      expect(logs[1].context?.correlationId).toBe('correlation-123');
      expect(logs[1].context?.sessionId).toBe('session-456');
      expect(logs[1].context?.userId).toBe('user-789');
      expect(logs[1].context?.isAuthenticated).toBe(true);
      expect(logs[1].context?.journey).toBe(JourneyType.CARE);
      expect(logs[1].context?.journeyState?.currentSection).toBe('appointments');
      expect(logs[1].context?.requestId).toBe('req-101');
      expect(logs[1].context?.method).toBe('POST');
    });
  });

  describe('Trace Context Integration', () => {
    it('should include trace context in logs when tracing is available', () => {
      // Set up mock trace IDs
      const traceId = 'trace-123';
      const spanId = 'span-456';
      
      // Configure the mock tracing service to return these IDs
      tracingService.getCurrentTraceId = jest.fn().mockReturnValue(traceId);
      tracingService.getCurrentSpanId = jest.fn().mockReturnValue(spanId);
      
      // Enable tracing in the logger
      (logger as any).config.tracing = { enabled: true };
      
      // Log a message
      logger.log('Log with trace context');
      
      // Verify the log includes trace context
      const logEntry = transport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry?.traceId).toBe(traceId);
      expect(logEntry?.spanId).toBe(spanId);
    });
    
    it('should gracefully handle errors from the tracing service', () => {
      // Configure the mock tracing service to throw an error
      tracingService.getCurrentTraceId = jest.fn().mockImplementation(() => {
        throw new Error('Tracing service error');
      });
      
      // Enable tracing in the logger
      (logger as any).config.tracing = { enabled: true };
      
      // Log a message - this should not throw
      expect(() => {
        logger.log('Log with tracing error');
      }).not.toThrow();
      
      // Verify the log was still created without trace context
      const logEntry = transport.getLastLog();
      expect(logEntry).toBeDefined();
      expect(logEntry?.message).toBe('Log with tracing error');
      expect(logEntry?.traceId).toBeUndefined();
      expect(logEntry?.spanId).toBeUndefined();
    });
  });
});
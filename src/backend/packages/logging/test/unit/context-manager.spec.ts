/**
 * @file context-manager.spec.ts
 * @description Tests for the ContextManager class that manages logging contexts
 * throughout the application. These tests verify context creation, retrieval,
 * nesting, serialization, and async propagation.
 */

import { Test } from '@nestjs/testing';
import { AsyncLocalStorage } from 'async_hooks';
import { ContextManager } from '../../src/context/context-manager';
import { LoggingContext } from '../../src/context/context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';

// Mock TracingService for testing
class MockTracingService {
  getCurrentTraceContext() {
    return { traceId: 'test-trace-id', spanId: 'test-span-id' };
  }

  createSpan(name: string) {
    return { name, id: 'test-span-id' };
  }

  endSpan() {}
}

describe('ContextManager', () => {
  let contextManager: ContextManager;
  let tracingService: MockTracingService;

  beforeEach(async () => {
    // Create a fresh instance for each test
    tracingService = new MockTracingService();
    contextManager = new ContextManager({
      defaultContext: {
        application: 'test-app',
        environment: 'test',
        service: 'test-service',
      },
      tracingService,
    });
  });

  describe('Context Creation', () => {
    it('should create a base context with default values', () => {
      const context = contextManager.createContext();

      expect(context).toBeDefined();
      expect(context.application).toBe('test-app');
      expect(context.environment).toBe('test');
      expect(context.service).toBe('test-service');
      expect(context.correlationId).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should include trace context when tracing service is available', () => {
      const context = contextManager.createContext();

      expect(context.traceId).toBe('test-trace-id');
      expect(context.spanId).toBe('test-span-id');
    });

    it('should create a request context with required fields', () => {
      const requestInfo: Partial<RequestContext> = {
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      };

      const context = contextManager.createRequestContext(requestInfo);

      expect(context).toBeDefined();
      expect(context.requestId).toBeDefined();
      expect(context.method).toBe('GET');
      expect(context.path).toBe('/test');
      expect(context.ip).toBe('127.0.0.1');
      expect(context.userAgent).toBe('test-agent');
    });

    it('should create a user context with required fields', () => {
      const userInfo: Partial<UserContext> = {
        userId: 'test-user',
        isAuthenticated: true,
        roles: ['user'],
      };

      const context = contextManager.createUserContext(userInfo);

      expect(context).toBeDefined();
      expect(context.userId).toBe('test-user');
      expect(context.isAuthenticated).toBe(true);
      expect(context.roles).toEqual(['user']);
    });

    it('should throw an error when creating user context without userId', () => {
      const userInfo: Partial<UserContext> = {
        isAuthenticated: true,
      };

      expect(() => contextManager.createUserContext(userInfo)).toThrow();
    });

    it('should create a journey context with required fields', () => {
      const journeyInfo: Partial<JourneyContext> = {
        journeyType: 'health',
        journeyState: { step: 'initial' },
      };

      const context = contextManager.createJourneyContext(journeyInfo);

      expect(context).toBeDefined();
      expect(context.journeyType).toBe('health');
      expect(context.journeyState).toEqual({ step: 'initial' });
    });

    it('should throw an error when creating journey context without journeyType', () => {
      const journeyInfo: Partial<JourneyContext> = {
        journeyState: { step: 'initial' },
      };

      expect(() => contextManager.createJourneyContext(journeyInfo)).toThrow();
    });
  });

  describe('Context Merging', () => {
    it('should merge multiple contexts correctly', () => {
      const baseContext = contextManager.createContext();
      const requestContext = contextManager.createRequestContext({
        method: 'GET',
        path: '/test',
      });
      const userContext = contextManager.createUserContext({
        userId: 'test-user',
        isAuthenticated: true,
      });

      const mergedContext = contextManager.mergeContexts(
        baseContext,
        requestContext,
        userContext
      );

      expect(mergedContext).toBeDefined();
      expect(mergedContext.application).toBe('test-app');
      expect(mergedContext.method).toBe('GET');
      expect(mergedContext.path).toBe('/test');
      expect(mergedContext.userId).toBe('test-user');
      expect(mergedContext.isAuthenticated).toBe(true);
    });

    it('should handle undefined contexts in mergeContexts', () => {
      const baseContext = contextManager.createContext();
      const mergedContext = contextManager.mergeContexts(baseContext, undefined);

      expect(mergedContext).toBeDefined();
      expect(mergedContext).toEqual(baseContext);
    });

    it('should create a complete context with all information', () => {
      const requestInfo: Partial<RequestContext> = {
        method: 'GET',
        path: '/test',
      };
      const userInfo: Partial<UserContext> = {
        userId: 'test-user',
        isAuthenticated: true,
      };
      const journeyInfo: Partial<JourneyContext> = {
        journeyType: 'health',
        journeyState: { step: 'initial' },
      };

      const completeContext = contextManager.createCompleteContext(
        requestInfo,
        userInfo,
        journeyInfo
      );

      expect(completeContext).toBeDefined();
      expect(completeContext.application).toBe('test-app');
      expect(completeContext.method).toBe('GET');
      expect(completeContext.path).toBe('/test');
      expect(completeContext.userId).toBe('test-user');
      expect(completeContext.isAuthenticated).toBe(true);
      expect(completeContext.journeyType).toBe('health');
      expect(completeContext.journeyState).toEqual({ step: 'initial' });
    });

    it('should handle errors in createCompleteContext', () => {
      const requestInfo: Partial<RequestContext> = {
        method: 'GET',
        path: '/test',
      };
      // Missing userId which should cause an error
      const userInfo: Partial<UserContext> = {
        isAuthenticated: true,
      };
      const journeyInfo: Partial<JourneyContext> = {
        journeyType: 'health',
      };

      // Spy on console.error to verify it's called
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const completeContext = contextManager.createCompleteContext(
        requestInfo,
        userInfo,
        journeyInfo
      );

      expect(completeContext).toBeDefined();
      expect(completeContext.method).toBe('GET');
      expect(completeContext.path).toBe('/test');
      expect(completeContext.journeyType).toBe('health');
      // User context should not be included due to error
      expect(completeContext.userId).toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Context Propagation', () => {
    it('should extract context for propagation', () => {
      const context: LoggingContext = {
        correlationId: 'test-correlation-id',
        traceId: 'test-trace-id',
        spanId: 'test-span-id',
        application: 'test-app',
        environment: 'test',
        service: 'test-service',
        timestamp: new Date(),
      };

      // Add journey and user information
      (context as JourneyContext).journeyType = 'health';
      (context as UserContext).userId = 'test-user';

      const headers = contextManager.extractContextForPropagation(context);

      expect(headers).toBeDefined();
      expect(headers['x-correlation-id']).toBe('test-correlation-id');
      expect(headers['traceparent']).toBeDefined();
      expect(headers['traceparent']).toContain('test-trace-id');
      expect(headers['x-journey-type']).toBe('health');
      expect(headers['x-user-id']).toBe('test-user');
    });

    it('should create context from propagated headers', () => {
      const headers = {
        'x-correlation-id': 'test-correlation-id',
        'traceparent': '00-test-trace-id-test-span-id-01',
        'x-journey-type': 'health',
        'x-user-id': 'test-user',
      };

      const context = contextManager.createContextFromPropagation(headers);

      expect(context).toBeDefined();
      expect(context.correlationId).toBe('test-correlation-id');
      expect(context.traceId).toBe('test-trace-id');
      expect(context.spanId).toBe('test-span-id');
      expect((context as JourneyContext).journeyType).toBe('health');
      expect((context as UserContext).userId).toBe('test-user');
      expect((context as UserContext).isAuthenticated).toBe(true);
    });

    it('should handle invalid traceparent header', () => {
      const headers = {
        'x-correlation-id': 'test-correlation-id',
        'traceparent': 'invalid-format',
      };

      const context = contextManager.createContextFromPropagation(headers);

      expect(context).toBeDefined();
      expect(context.correlationId).toBe('test-correlation-id');
      expect(context.traceId).toBeUndefined();
      expect(context.spanId).toBeUndefined();
    });
  });

  describe('Async Context Propagation', () => {
    it('should maintain context across async boundaries', async () => {
      // Create a context
      const context = contextManager.createContext({
        customValue: 'test-value',
      });

      // Function that runs asynchronously
      const asyncFunction = async () => {
        // This should have access to the same context
        const currentContext = contextManager.createContext();
        return currentContext;
      };

      // Run the async function and verify context is maintained
      const resultContext = await asyncFunction();

      expect(resultContext.customValue).toBe('test-value');
    });

    it('should maintain nested contexts correctly', async () => {
      // Create a parent context
      const parentContext = contextManager.createContext({
        parentValue: 'parent',
      });

      // First level async function
      const firstLevelAsync = async () => {
        // Create a child context that inherits from parent
        const childContext = contextManager.createContext({
          childValue: 'child',
        });

        // Second level async function
        const secondLevelAsync = async () => {
          // This should have access to both parent and child values
          const nestedContext = contextManager.createContext();
          return nestedContext;
        };

        return secondLevelAsync();
      };

      // Run the nested async functions
      const resultContext = await firstLevelAsync();

      // Verify both parent and child values are present
      expect(resultContext.parentValue).toBe('parent');
      expect(resultContext.childValue).toBe('child');
    });

    it('should isolate contexts between different async flows', async () => {
      // Create two separate contexts
      const context1 = contextManager.createContext({
        flowId: 'flow-1',
      });

      const context2 = contextManager.createContext({
        flowId: 'flow-2',
      });

      // Two separate async flows
      const flow1 = async () => {
        // This should have access to context1
        const currentContext = contextManager.createContext();
        return currentContext;
      };

      const flow2 = async () => {
        // This should have access to context2
        const currentContext = contextManager.createContext();
        return currentContext;
      };

      // Run both flows and verify contexts are isolated
      const result1 = await flow1();
      const result2 = await flow2();

      expect(result1.flowId).toBe('flow-1');
      expect(result2.flowId).toBe('flow-2');
    });

    it('should handle context cleanup after async operations', async () => {
      // Create a context with a specific value
      const context = contextManager.createContext({
        tempValue: 'temporary',
      });

      // Async function that should use the context
      const asyncFunction = async () => {
        const currentContext = contextManager.createContext();
        expect(currentContext.tempValue).toBe('temporary');
        return 'done';
      };

      // Run the async function
      await asyncFunction();

      // After the async function completes, the context should be cleaned up
      const newContext = contextManager.createContext();
      expect(newContext.tempValue).toBeUndefined();
    });
  });

  describe('Journey-Specific Context', () => {
    it('should create health journey context', () => {
      const journeyInfo: Partial<JourneyContext> = {
        journeyType: 'health',
        journeyState: { 
          metrics: { steps: 5000, heartRate: 75 },
          goals: { dailySteps: 10000 }
        },
      };

      const context = contextManager.createJourneyContext(journeyInfo);

      expect(context).toBeDefined();
      expect(context.journeyType).toBe('health');
      expect(context.journeyState.metrics.steps).toBe(5000);
      expect(context.journeyState.metrics.heartRate).toBe(75);
      expect(context.journeyState.goals.dailySteps).toBe(10000);
    });

    it('should create care journey context', () => {
      const journeyInfo: Partial<JourneyContext> = {
        journeyType: 'care',
        journeyState: { 
          appointments: { upcoming: 2, past: 5 },
          medications: { active: 3 }
        },
      };

      const context = contextManager.createJourneyContext(journeyInfo);

      expect(context).toBeDefined();
      expect(context.journeyType).toBe('care');
      expect(context.journeyState.appointments.upcoming).toBe(2);
      expect(context.journeyState.appointments.past).toBe(5);
      expect(context.journeyState.medications.active).toBe(3);
    });

    it('should create plan journey context', () => {
      const journeyInfo: Partial<JourneyContext> = {
        journeyType: 'plan',
        journeyState: { 
          claims: { pending: 1, approved: 3, denied: 0 },
          benefits: { used: 2500, remaining: 7500 }
        },
      };

      const context = contextManager.createJourneyContext(journeyInfo);

      expect(context).toBeDefined();
      expect(context.journeyType).toBe('plan');
      expect(context.journeyState.claims.pending).toBe(1);
      expect(context.journeyState.claims.approved).toBe(3);
      expect(context.journeyState.benefits.used).toBe(2500);
      expect(context.journeyState.benefits.remaining).toBe(7500);
    });

    it('should support cross-journey context', () => {
      const journeyInfo: Partial<JourneyContext> = {
        journeyType: 'health',
        journeyState: { metrics: { steps: 5000 } },
        crossJourneyContext: {
          careAppointments: { upcoming: 1 },
          planBenefits: { remaining: 5000 }
        },
      };

      const context = contextManager.createJourneyContext(journeyInfo);

      expect(context).toBeDefined();
      expect(context.journeyType).toBe('health');
      expect(context.journeyState.metrics.steps).toBe(5000);
      expect(context.crossJourneyContext.careAppointments.upcoming).toBe(1);
      expect(context.crossJourneyContext.planBenefits.remaining).toBe(5000);
    });
  });

  describe('Tracing Integration', () => {
    it('should set and get tracing service', () => {
      const newTracingService = new MockTracingService();
      contextManager.setTracingService(newTracingService);

      const retrievedService = contextManager.getTracingService();
      expect(retrievedService).toBe(newTracingService);
    });

    it('should format trace context according to W3C spec', () => {
      const context: LoggingContext = {
        traceId: 'abcdef0123456789abcdef0123456789',
        spanId: 'abcdef0123456789',
        correlationId: 'test-correlation-id',
        application: 'test-app',
        environment: 'test',
        service: 'test-service',
        timestamp: new Date(),
      };

      const headers = contextManager.extractContextForPropagation(context);

      expect(headers).toBeDefined();
      expect(headers['traceparent']).toBe('00-abcdef0123456789abcdef0123456789-abcdef0123456789-01');
    });

    it('should parse trace context according to W3C spec', () => {
      const headers = {
        'traceparent': '00-abcdef0123456789abcdef0123456789-abcdef0123456789-01',
      };

      const context = contextManager.createContextFromPropagation(headers);

      expect(context).toBeDefined();
      expect(context.traceId).toBe('abcdef0123456789abcdef0123456789');
      expect(context.spanId).toBe('abcdef0123456789');
    });
  });
});
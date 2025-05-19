import { AsyncLocalStorage } from 'async_hooks';
import { ContextManager } from '../../src/context/context-manager';
import { JourneyType } from '../../src/context/context.constants';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { UserContext } from '../../src/context/user-context.interface';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager();
  });

  describe('Context Creation and Retrieval', () => {
    it('should create and retrieve a basic context', () => {
      const context = contextManager.run<LoggingContext>({ correlationId: 'test-correlation-id' }, () => {
        return contextManager.getContext();
      });

      expect(context).toBeDefined();
      expect(context.correlationId).toBe('test-correlation-id');
    });

    it('should return undefined when getting context outside of a context scope', () => {
      const context = contextManager.getContext();
      expect(context).toBeUndefined();
    });

    it('should create a request context with proper properties', () => {
      const requestContext: RequestContext = {
        correlationId: 'test-correlation-id',
        requestId: 'req-123',
        method: 'GET',
        path: '/api/health',
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      };

      const context = contextManager.run<RequestContext>(requestContext, () => {
        return contextManager.getContext();
      });

      expect(context).toBeDefined();
      expect(context.requestId).toBe('req-123');
      expect(context.method).toBe('GET');
      expect(context.path).toBe('/api/health');
    });

    it('should create a user context with proper properties', () => {
      const userContext: UserContext = {
        correlationId: 'test-correlation-id',
        userId: 'user-123',
        isAuthenticated: true,
        roles: ['user', 'admin']
      };

      const context = contextManager.run<UserContext>(userContext, () => {
        return contextManager.getContext();
      });

      expect(context).toBeDefined();
      expect(context.userId).toBe('user-123');
      expect(context.isAuthenticated).toBe(true);
      expect(context.roles).toContain('admin');
    });

    it('should create a journey context with proper properties', () => {
      const journeyContext: JourneyContext = {
        correlationId: 'test-correlation-id',
        journeyType: JourneyType.HEALTH,
        journeyState: { currentStep: 'metrics-view' }
      };

      const context = contextManager.run<JourneyContext>(journeyContext, () => {
        return contextManager.getContext();
      });

      expect(context).toBeDefined();
      expect(context.journeyType).toBe(JourneyType.HEALTH);
      expect(context.journeyState.currentStep).toBe('metrics-view');
    });
  });

  describe('Nested Context Inheritance', () => {
    it('should inherit properties from parent context', () => {
      const parentContext = contextManager.run<LoggingContext>(
        { correlationId: 'parent-correlation-id' },
        () => {
          // Create a nested context that inherits from parent
          return contextManager.run<LoggingContext>(
            { nestedProperty: 'nested-value' },
            () => {
              return contextManager.getContext();
            }
          );
        }
      );

      expect(parentContext).toBeDefined();
      expect(parentContext.correlationId).toBe('parent-correlation-id');
      expect(parentContext['nestedProperty']).toBe('nested-value');
    });

    it('should override parent properties in nested context when specified', () => {
      const context = contextManager.run<LoggingContext>(
        { correlationId: 'parent-correlation-id', sharedProperty: 'parent-value' },
        () => {
          return contextManager.run<LoggingContext>(
            { sharedProperty: 'child-value' },
            () => {
              return contextManager.getContext();
            }
          );
        }
      );

      expect(context).toBeDefined();
      expect(context.correlationId).toBe('parent-correlation-id');
      expect(context.sharedProperty).toBe('child-value');
    });

    it('should support multiple levels of nesting with proper inheritance', () => {
      const context = contextManager.run<LoggingContext>(
        { level: 1, shared: 'level-1' },
        () => {
          return contextManager.run<LoggingContext>(
            { level: 2, shared: 'level-2' },
            () => {
              return contextManager.run<LoggingContext>(
                { level: 3 },
                () => {
                  return contextManager.getContext();
                }
              );
            }
          );
        }
      );

      expect(context).toBeDefined();
      expect(context.level).toBe(3);
      expect(context.shared).toBe('level-2');
    });
  });

  describe('Async Context Propagation', () => {
    it('should maintain context across async/await boundaries', async () => {
      const asyncContext = await contextManager.run<LoggingContext>(
        { correlationId: 'async-correlation-id' },
        async () => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 10));
          return contextManager.getContext();
        }
      );

      expect(asyncContext).toBeDefined();
      expect(asyncContext.correlationId).toBe('async-correlation-id');
    });

    it('should maintain context across Promise chains', async () => {
      const promiseContext = await contextManager.run<LoggingContext>(
        { correlationId: 'promise-correlation-id' },
        () => {
          return Promise.resolve()
            .then(() => Promise.resolve())
            .then(() => contextManager.getContext());
        }
      );

      expect(promiseContext).toBeDefined();
      expect(promiseContext.correlationId).toBe('promise-correlation-id');
    });

    it('should maintain context in nested async functions', async () => {
      const nestedAsyncContext = await contextManager.run<LoggingContext>(
        { correlationId: 'nested-async-id' },
        async () => {
          const nestedAsync = async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return contextManager.getContext();
          };
          return nestedAsync();
        }
      );

      expect(nestedAsyncContext).toBeDefined();
      expect(nestedAsyncContext.correlationId).toBe('nested-async-id');
    });

    it('should handle parallel async operations with different contexts', async () => {
      const task1 = contextManager.run<LoggingContext>(
        { taskId: 'task-1' },
        async () => {
          await new Promise(resolve => setTimeout(resolve, 20));
          return contextManager.getContext();
        }
      );

      const task2 = contextManager.run<LoggingContext>(
        { taskId: 'task-2' },
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return contextManager.getContext();
        }
      );

      const [result1, result2] = await Promise.all([task1, task2]);

      expect(result1.taskId).toBe('task-1');
      expect(result2.taskId).toBe('task-2');
    });
  });

  describe('Journey-specific Context Serialization', () => {
    it('should serialize health journey context correctly', () => {
      const healthJourneyContext: JourneyContext = {
        correlationId: 'health-correlation-id',
        journeyType: JourneyType.HEALTH,
        journeyState: { 
          currentStep: 'metrics-view',
          healthMetrics: {
            steps: 10000,
            heartRate: 75
          }
        }
      };

      const serializedContext = contextManager.run<JourneyContext>(healthJourneyContext, () => {
        return contextManager.serializeContext();
      });

      expect(serializedContext).toBeDefined();
      expect(serializedContext).toHaveProperty('journeyType', JourneyType.HEALTH);
      expect(serializedContext).toHaveProperty('journeyState.healthMetrics.steps', 10000);
    });

    it('should serialize care journey context correctly', () => {
      const careJourneyContext: JourneyContext = {
        correlationId: 'care-correlation-id',
        journeyType: JourneyType.CARE,
        journeyState: { 
          currentStep: 'appointment-booking',
          appointmentDetails: {
            doctorId: 'doc-123',
            date: '2023-05-15'
          }
        }
      };

      const serializedContext = contextManager.run<JourneyContext>(careJourneyContext, () => {
        return contextManager.serializeContext();
      });

      expect(serializedContext).toBeDefined();
      expect(serializedContext).toHaveProperty('journeyType', JourneyType.CARE);
      expect(serializedContext).toHaveProperty('journeyState.appointmentDetails.doctorId', 'doc-123');
    });

    it('should serialize plan journey context correctly', () => {
      const planJourneyContext: JourneyContext = {
        correlationId: 'plan-correlation-id',
        journeyType: JourneyType.PLAN,
        journeyState: { 
          currentStep: 'benefits-view',
          planDetails: {
            planId: 'plan-premium',
            coverage: 'full'
          }
        }
      };

      const serializedContext = contextManager.run<JourneyContext>(planJourneyContext, () => {
        return contextManager.serializeContext();
      });

      expect(serializedContext).toBeDefined();
      expect(serializedContext).toHaveProperty('journeyType', JourneyType.PLAN);
      expect(serializedContext).toHaveProperty('journeyState.planDetails.planId', 'plan-premium');
    });

    it('should handle serialization of complex nested objects', () => {
      const complexContext: LoggingContext = {
        correlationId: 'complex-correlation-id',
        nestedObject: {
          level1: {
            level2: {
              level3: {
                value: 'deeply-nested-value'
              }
            }
          }
        },
        arrayOfObjects: [
          { id: 1, name: 'item1' },
          { id: 2, name: 'item2' }
        ]
      };

      const serializedContext = contextManager.run<LoggingContext>(complexContext, () => {
        return contextManager.serializeContext();
      });

      expect(serializedContext).toBeDefined();
      expect(serializedContext).toHaveProperty('nestedObject.level1.level2.level3.value', 'deeply-nested-value');
      expect(serializedContext.arrayOfObjects[1]).toHaveProperty('name', 'item2');
    });
  });

  describe('Context Cleanup and Isolation', () => {
    it('should clean up context after execution completes', () => {
      contextManager.run<LoggingContext>({ correlationId: 'temp-correlation-id' }, () => {
        const context = contextManager.getContext();
        expect(context).toBeDefined();
        expect(context.correlationId).toBe('temp-correlation-id');
      });

      // Context should be cleaned up after run completes
      const contextAfterRun = contextManager.getContext();
      expect(contextAfterRun).toBeUndefined();
    });

    it('should maintain isolation between different context executions', async () => {
      // First execution
      await contextManager.run<LoggingContext>({ execution: 'first' }, async () => {
        const firstContext = contextManager.getContext();
        expect(firstContext.execution).toBe('first');
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Second execution should have its own isolated context
      await contextManager.run<LoggingContext>({ execution: 'second' }, async () => {
        const secondContext = contextManager.getContext();
        expect(secondContext.execution).toBe('second');
        // Should not have properties from first execution
        expect(secondContext).not.toHaveProperty('correlationId');
      });
    });

    it('should handle errors without leaking context', async () => {
      try {
        await contextManager.run<LoggingContext>({ errorTest: true }, async () => {
          const context = contextManager.getContext();
          expect(context.errorTest).toBe(true);
          throw new Error('Test error');
        });
      } catch (error) {
        // Error should be propagated
        expect(error.message).toBe('Test error');
      }

      // Context should be cleaned up despite error
      const contextAfterError = contextManager.getContext();
      expect(contextAfterError).toBeUndefined();
    });

    it('should support explicit context exit', () => {
      contextManager.run<LoggingContext>({ correlationId: 'exit-test' }, () => {
        const beforeExit = contextManager.getContext();
        expect(beforeExit).toBeDefined();
        
        // Explicitly exit the context
        contextManager.exit();
        
        // Context should be undefined after exit
        const afterExit = contextManager.getContext();
        expect(afterExit).toBeUndefined();
      });
    });
  });
});
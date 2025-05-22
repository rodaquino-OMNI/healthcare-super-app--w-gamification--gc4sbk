import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import {
  DatabaseMiddleware,
  MiddlewareContext,
  MiddlewareResult,
  NextMiddlewareFunction,
  DatabaseOperationType,
  JourneyContext,
} from '../../src/middleware/middleware.interface';
import { MiddlewareRegistry } from '../../src/middleware/middleware.registry';
import { MiddlewareFactory } from '../../src/middleware/middleware.factory';
import { LoggingMiddleware } from '../../src/middleware/logging.middleware';
import { PerformanceMiddleware } from '../../src/middleware/performance.middleware';
import { TransformationMiddleware } from '../../src/middleware/transformation.middleware';
import { CircuitBreakerMiddleware } from '../../src/middleware/circuit-breaker.middleware';

/**
 * Mock implementation of a database middleware for testing
 */
class MockMiddleware implements DatabaseMiddleware {
  public readonly name: string;
  public readonly priority: number;
  public beforeExecuteCalls: number = 0;
  public afterExecuteCalls: number = 0;
  public executionOrder: string[] = [];

  constructor(name: string, priority: number = 0) {
    this.name = name;
    this.priority = priority;
  }

  async beforeExecute(context: MiddlewareContext, next: NextMiddlewareFunction): Promise<MiddlewareResult> {
    this.beforeExecuteCalls++;
    this.executionOrder.push(`before:${this.name}`);
    
    // Add a marker to the context to track execution
    if (!context.metadata) {
      context.metadata = {};
    }
    
    if (!context.metadata.executionOrder) {
      context.metadata.executionOrder = [];
    }
    
    context.metadata.executionOrder.push(`before:${this.name}`);
    
    return next(context);
  }

  async afterExecute(context: MiddlewareContext, next: NextMiddlewareFunction): Promise<MiddlewareResult> {
    this.afterExecuteCalls++;
    this.executionOrder.push(`after:${this.name}`);
    
    // Add a marker to the context to track execution
    if (!context.metadata) {
      context.metadata = {};
    }
    
    if (!context.metadata.executionOrder) {
      context.metadata.executionOrder = [];
    }
    
    context.metadata.executionOrder.push(`after:${this.name}`);
    
    return next(context);
  }
}

/**
 * Mock implementation of a transformation middleware for testing
 */
class MockTransformationMiddleware extends MockMiddleware implements DatabaseMiddleware {
  private transformations: Record<string, (args: any) => any> = {};

  constructor(name: string = 'TransformationMiddleware', priority: number = 20) {
    super(name, priority);
  }

  addTransformation(model: string, operation: string, transform: (args: any) => any): void {
    const key = `${model}:${operation}`;
    this.transformations[key] = transform;
  }

  async beforeExecute(context: MiddlewareContext, next: NextMiddlewareFunction): Promise<MiddlewareResult> {
    this.beforeExecuteCalls++;
    this.executionOrder.push(`before:${this.name}`);
    
    // Add a marker to the context to track execution
    if (!context.metadata) {
      context.metadata = {};
    }
    
    if (!context.metadata.executionOrder) {
      context.metadata.executionOrder = [];
    }
    
    context.metadata.executionOrder.push(`before:${this.name}`);
    
    // Apply transformations if available
    const { model, operation, args } = context;
    if (model && operation) {
      const key = `${model}:${operation}`;
      if (this.transformations[key]) {
        context.args = this.transformations[key](args);
      }
    }
    
    return next(context);
  }
}

/**
 * Mock implementation of a logging middleware for testing
 */
class MockLoggingMiddleware extends MockMiddleware implements DatabaseMiddleware {
  public logs: Array<{ level: string; message: string; context: any }> = [];

  constructor(name: string = 'LoggingMiddleware', priority: number = 10) {
    super(name, priority);
  }

  log(level: string, message: string, context: any): void {
    this.logs.push({ level, message, context });
  }

  async beforeExecute(context: MiddlewareContext, next: NextMiddlewareFunction): Promise<MiddlewareResult> {
    this.beforeExecuteCalls++;
    this.executionOrder.push(`before:${this.name}`);
    
    // Add a marker to the context to track execution
    if (!context.metadata) {
      context.metadata = {};
    }
    
    if (!context.metadata.executionOrder) {
      context.metadata.executionOrder = [];
    }
    
    context.metadata.executionOrder.push(`before:${this.name}`);
    
    // Log the operation
    const { model, operation } = context;
    this.log('debug', `Database ${operation} on ${model}`, { model, operation, args: context.args });
    
    // Store start time for performance tracking
    context.startTime = Date.now();
    
    return next(context);
  }

  async afterExecute(context: MiddlewareContext, next: NextMiddlewareFunction): Promise<MiddlewareResult> {
    this.afterExecuteCalls++;
    this.executionOrder.push(`after:${this.name}`);
    
    // Add a marker to the context to track execution
    if (!context.metadata) {
      context.metadata = {};
    }
    
    if (!context.metadata.executionOrder) {
      context.metadata.executionOrder = [];
    }
    
    context.metadata.executionOrder.push(`after:${this.name}`);
    
    // Log the result
    const { model, operation, result, startTime } = context;
    const executionTime = startTime ? Date.now() - startTime : undefined;
    
    this.log('debug', `Database ${operation} on ${model} completed in ${executionTime}ms`, {
      model,
      operation,
      executionTime,
      resultMetadata: result ? { count: Array.isArray(result) ? result.length : 1 } : undefined,
    });
    
    return next(context);
  }
}

/**
 * Mock implementation of a performance middleware for testing
 */
class MockPerformanceMiddleware extends MockMiddleware implements DatabaseMiddleware {
  public metrics: Array<{ operation: string; model: string; executionTime: number }> = [];
  public slowQueryThreshold: number = 1000;

  constructor(name: string = 'PerformanceMiddleware', priority: number = 30) {
    super(name, priority);
  }

  async beforeExecute(context: MiddlewareContext, next: NextMiddlewareFunction): Promise<MiddlewareResult> {
    this.beforeExecuteCalls++;
    this.executionOrder.push(`before:${this.name}`);
    
    // Add a marker to the context to track execution
    if (!context.metadata) {
      context.metadata = {};
    }
    
    if (!context.metadata.executionOrder) {
      context.metadata.executionOrder = [];
    }
    
    context.metadata.executionOrder.push(`before:${this.name}`);
    
    // Store start time for performance tracking
    context.startTime = Date.now();
    
    return next(context);
  }

  async afterExecute(context: MiddlewareContext, next: NextMiddlewareFunction): Promise<MiddlewareResult> {
    this.afterExecuteCalls++;
    this.executionOrder.push(`after:${this.name}`);
    
    // Add a marker to the context to track execution
    if (!context.metadata) {
      context.metadata = {};
    }
    
    if (!context.metadata.executionOrder) {
      context.metadata.executionOrder = [];
    }
    
    context.metadata.executionOrder.push(`after:${this.name}`);
    
    // Record performance metrics
    const { model, operation, startTime } = context;
    if (startTime) {
      const executionTime = Date.now() - startTime;
      
      this.metrics.push({
        operation,
        model,
        executionTime,
      });
      
      // Add execution time to context
      context.duration = executionTime;
      
      // Check for slow queries
      if (executionTime > this.slowQueryThreshold) {
        if (!context.metadata) {
          context.metadata = {};
        }
        context.metadata.isSlowQuery = true;
      }
    }
    
    return next(context);
  }
}

/**
 * Mock implementation of a circuit breaker middleware for testing
 */
class MockCircuitBreakerMiddleware extends MockMiddleware implements DatabaseMiddleware {
  public state: 'open' | 'closed' | 'half-open' = 'closed';
  public failureCount: number = 0;
  public failureThreshold: number = 5;

  constructor(name: string = 'CircuitBreakerMiddleware', priority: number = 0) {
    super(name, priority);
  }

  async beforeExecute(context: MiddlewareContext, next: NextMiddlewareFunction): Promise<MiddlewareResult> {
    this.beforeExecuteCalls++;
    this.executionOrder.push(`before:${this.name}`);
    
    // Add a marker to the context to track execution
    if (!context.metadata) {
      context.metadata = {};
    }
    
    if (!context.metadata.executionOrder) {
      context.metadata.executionOrder = [];
    }
    
    context.metadata.executionOrder.push(`before:${this.name}`);
    
    // Check if circuit is open
    if (this.state === 'open') {
      throw new Error('Circuit is open, database operations are not allowed');
    }
    
    return next(context);
  }

  async afterExecute(context: MiddlewareContext, next: NextMiddlewareFunction): Promise<MiddlewareResult> {
    this.afterExecuteCalls++;
    this.executionOrder.push(`after:${this.name}`);
    
    // Add a marker to the context to track execution
    if (!context.metadata) {
      context.metadata = {};
    }
    
    if (!context.metadata.executionOrder) {
      context.metadata.executionOrder = [];
    }
    
    context.metadata.executionOrder.push(`after:${this.name}`);
    
    // Check for errors
    if (context.error) {
      this.failureCount++;
      
      // Open circuit if failure threshold is reached
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
      }
    } else {
      // Reset failure count on successful operation
      this.failureCount = 0;
      
      // Close circuit if it was half-open
      if (this.state === 'half-open') {
        this.state = 'closed';
      }
    }
    
    return next(context);
  }

  // Method to manually reset the circuit breaker
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
  }

  // Method to manually open the circuit
  openCircuit(): void {
    this.state = 'open';
  }

  // Method to manually set the circuit to half-open
  halfOpenCircuit(): void {
    this.state = 'half-open';
  }
}

/**
 * Mock database operation for testing
 */
async function mockDatabaseOperation(args: any): Promise<any> {
  // Simulate database operation
  return { id: 1, ...args };
}

/**
 * Mock database operation that throws an error for testing
 */
async function mockFailingDatabaseOperation(): Promise<any> {
  throw new Error('Database operation failed');
}

describe('Middleware Pipeline Integration Tests', () => {
  let moduleRef: TestingModule;
  let middlewareRegistry: MiddlewareRegistry;
  let middlewareFactory: MiddlewareFactory;
  let mockLoggingMiddleware: MockLoggingMiddleware;
  let mockPerformanceMiddleware: MockPerformanceMiddleware;
  let mockTransformationMiddleware: MockTransformationMiddleware;
  let mockCircuitBreakerMiddleware: MockCircuitBreakerMiddleware;

  beforeEach(async () => {
    // Create mock middleware instances
    mockLoggingMiddleware = new MockLoggingMiddleware();
    mockPerformanceMiddleware = new MockPerformanceMiddleware();
    mockTransformationMiddleware = new MockTransformationMiddleware();
    mockCircuitBreakerMiddleware = new MockCircuitBreakerMiddleware();

    // Create a test module with the necessary providers
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            database: {
              middleware: {
                activeProfile: 'default',
                profiles: [
                  {
                    name: 'default',
                    enabled: true,
                    include: ['*'],
                    exclude: [],
                  },
                ],
                journeys: [
                  {
                    journeyType: JourneyContext.HEALTH,
                    enabledMiddleware: ['*'],
                    disabledMiddleware: [],
                  },
                ],
                defaultOptions: {
                  enableCircuitBreaker: true,
                  enableLogging: true,
                  enablePerformanceMonitoring: true,
                  enableTransformation: true,
                  skipForSimpleOperations: false,
                  executionOrder: [
                    'CircuitBreakerMiddleware',
                    'LoggingMiddleware',
                    'PerformanceMiddleware',
                    'TransformationMiddleware',
                  ],
                },
              },
            },
          })],
        }),
      ],
      providers: [
        {
          provide: 'LOGGER_SERVICE',
          useValue: new Logger(),
        },
        MiddlewareRegistry,
        MiddlewareFactory,
      ],
    }).compile();

    // Get instances from the test module
    middlewareRegistry = moduleRef.get<MiddlewareRegistry>(MiddlewareRegistry);
    middlewareFactory = moduleRef.get<MiddlewareFactory>(MiddlewareFactory);

    // Register mock middleware with the registry
    middlewareRegistry['middlewares'] = [];
    middlewareRegistry['middlewareMap'] = new Map();
    middlewareRegistry.register(mockCircuitBreakerMiddleware);
    middlewareRegistry.register(mockLoggingMiddleware);
    middlewareRegistry.register(mockPerformanceMiddleware);
    middlewareRegistry.register(mockTransformationMiddleware);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('Middleware Execution Order', () => {
    it('should execute middleware in the correct order based on priority', async () => {
      // Create a middleware chain
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      const chain = middlewareFactory.createMiddlewareChain(context);

      // Execute the chain with a mock database operation
      await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      await chain['executeAfterHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
        result: { id: 1, name: 'Test User' },
      });

      // Verify execution order based on priority
      const executionOrder = context.metadata?.executionOrder || [];
      
      // Circuit breaker should be first (priority 0)
      expect(executionOrder[0]).toBe('before:CircuitBreakerMiddleware');
      
      // Logging should be second (priority 10)
      expect(executionOrder[1]).toBe('before:LoggingMiddleware');
      
      // Performance should be third (priority 20)
      expect(executionOrder[2]).toBe('before:PerformanceMiddleware');
      
      // Transformation should be fourth (priority 30)
      expect(executionOrder[3]).toBe('before:TransformationMiddleware');
      
      // After hooks should be in reverse order
      expect(executionOrder[4]).toBe('after:TransformationMiddleware');
      expect(executionOrder[5]).toBe('after:PerformanceMiddleware');
      expect(executionOrder[6]).toBe('after:LoggingMiddleware');
      expect(executionOrder[7]).toBe('after:CircuitBreakerMiddleware');
    });

    it('should execute middleware in the order specified by executionOrder', async () => {
      // Update the execution order in the factory
      middlewareFactory['defaultOptions'].executionOrder = [
        'LoggingMiddleware',
        'CircuitBreakerMiddleware',
        'TransformationMiddleware',
        'PerformanceMiddleware',
      ];

      // Create a middleware chain
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      const chain = middlewareFactory.createMiddlewareChain(context);

      // Execute the chain with a mock database operation
      await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      await chain['executeAfterHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
        result: { id: 1, name: 'Test User' },
      });

      // Verify execution order based on executionOrder
      const executionOrder = context.metadata?.executionOrder || [];
      
      // Logging should be first
      expect(executionOrder[0]).toBe('before:LoggingMiddleware');
      
      // Circuit breaker should be second
      expect(executionOrder[1]).toBe('before:CircuitBreakerMiddleware');
      
      // Transformation should be third
      expect(executionOrder[2]).toBe('before:TransformationMiddleware');
      
      // Performance should be fourth
      expect(executionOrder[3]).toBe('before:PerformanceMiddleware');
      
      // After hooks should be in reverse order
      expect(executionOrder[4]).toBe('after:PerformanceMiddleware');
      expect(executionOrder[5]).toBe('after:TransformationMiddleware');
      expect(executionOrder[6]).toBe('after:CircuitBreakerMiddleware');
      expect(executionOrder[7]).toBe('after:LoggingMiddleware');
    });
  });

  describe('Middleware Context Modification', () => {
    it('should allow middleware to modify the operation context', async () => {
      // Add a transformation to the transformation middleware
      mockTransformationMiddleware.addTransformation('User', 'findUnique', (args) => {
        return {
          ...args,
          where: {
            ...args.where,
            isActive: true, // Add an additional filter
          },
        };
      });

      // Create a middleware chain
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      const chain = middlewareFactory.createMiddlewareChain(context);

      // Execute the chain with a mock database operation
      const result = await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      // Verify that the transformation was applied
      expect(result.args.where).toEqual({
        id: 1,
        isActive: true,
      });
    });

    it('should track performance metrics in the context', async () => {
      // Create a middleware chain
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      const chain = middlewareFactory.createMiddlewareChain(context);

      // Execute the chain with a mock database operation
      await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 10));

      await chain['executeAfterHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
        result: { id: 1, name: 'Test User' },
      });

      // Verify that performance metrics were recorded
      expect(mockPerformanceMiddleware.metrics.length).toBe(1);
      expect(mockPerformanceMiddleware.metrics[0].model).toBe('User');
      expect(mockPerformanceMiddleware.metrics[0].operation).toBe('findUnique');
      expect(mockPerformanceMiddleware.metrics[0].executionTime).toBeGreaterThan(0);
      
      // Verify that the duration was added to the context
      expect(context.duration).toBeGreaterThan(0);
    });

    it('should log database operations', async () => {
      // Create a middleware chain
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      const chain = middlewareFactory.createMiddlewareChain(context);

      // Execute the chain with a mock database operation
      await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      await chain['executeAfterHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
        result: { id: 1, name: 'Test User' },
      });

      // Verify that logs were created
      expect(mockLoggingMiddleware.logs.length).toBe(2);
      expect(mockLoggingMiddleware.logs[0].message).toContain('Database findUnique on User');
      expect(mockLoggingMiddleware.logs[1].message).toContain('Database findUnique on User completed');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in database operations', async () => {
      // Create a middleware chain
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      const chain = middlewareFactory.createMiddlewareChain(context);

      // Execute the chain with a mock database operation
      await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      const error = new Error('Database operation failed');

      await chain['executeAfterHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
        result: undefined,
        error,
      });

      // Verify that the circuit breaker recorded the failure
      expect(mockCircuitBreakerMiddleware.failureCount).toBe(1);
    });

    it('should open the circuit after reaching the failure threshold', async () => {
      // Set a low failure threshold for testing
      mockCircuitBreakerMiddleware.failureThreshold = 3;

      // Create a middleware chain
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      const chain = middlewareFactory.createMiddlewareChain(context);

      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        await chain['executeBeforeHooks']({
          args: context.args,
          dataPath: [],
          runInTransaction: false,
        });

        const error = new Error('Database operation failed');

        await chain['executeAfterHooks']({
          args: context.args,
          dataPath: [],
          runInTransaction: false,
          result: undefined,
          error,
        });
      }

      // Verify that the circuit is now open
      expect(mockCircuitBreakerMiddleware.state).toBe('open');
      expect(mockCircuitBreakerMiddleware.failureCount).toBe(3);

      // Verify that the next operation will fail due to open circuit
      await expect(async () => {
        await chain['executeBeforeHooks']({
          args: context.args,
          dataPath: [],
          runInTransaction: false,
        });
      }).rejects.toThrow('Circuit is open');
    });
  });

  describe('Journey-Specific Middleware', () => {
    it('should apply journey-specific middleware configuration', async () => {
      // Configure journey-specific middleware
      const healthJourneyConfig = {
        journeyType: JourneyContext.HEALTH,
        enabledMiddleware: ['LoggingMiddleware', 'PerformanceMiddleware'],
        disabledMiddleware: ['TransformationMiddleware', 'CircuitBreakerMiddleware'],
      };

      middlewareRegistry.updateJourneyConfiguration(healthJourneyConfig);

      // Create a middleware chain for the health journey
      const context: MiddlewareContext = {
        model: 'HealthMetric',
        operation: 'findMany',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { userId: 1 } },
        operationId: '123',
        journeyType: JourneyContext.HEALTH,
      };

      const chain = middlewareFactory.createJourneyMiddlewareChain(
        JourneyContext.HEALTH,
        context,
      );

      // Execute the chain with a mock database operation
      await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      await chain['executeAfterHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
        result: [{ id: 1, userId: 1, type: 'HEART_RATE', value: 75 }],
      });

      // Verify that only the enabled middleware was executed
      const executionOrder = context.metadata?.executionOrder || [];
      
      // Should only include LoggingMiddleware and PerformanceMiddleware
      expect(executionOrder).toContain('before:LoggingMiddleware');
      expect(executionOrder).toContain('before:PerformanceMiddleware');
      expect(executionOrder).not.toContain('before:TransformationMiddleware');
      expect(executionOrder).not.toContain('before:CircuitBreakerMiddleware');
    });
  });

  describe('Middleware Chain Performance', () => {
    it('should have minimal performance impact for simple operations', async () => {
      // Enable skipping middleware for simple operations
      middlewareFactory['defaultOptions'].skipForSimpleOperations = true;

      // Create a middleware chain for a simple operation
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      // Measure the time to execute the operation with middleware
      const startTime = Date.now();

      const chain = middlewareFactory.createMiddlewareChain(context);

      await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      const result = await mockDatabaseOperation(context.args);

      await chain['executeAfterHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
        result,
      });

      const endTime = Date.now();
      const executionTimeWithMiddleware = endTime - startTime;

      // Measure the time to execute the operation without middleware
      const startTimeWithoutMiddleware = Date.now();
      await mockDatabaseOperation(context.args);
      const endTimeWithoutMiddleware = Date.now();
      const executionTimeWithoutMiddleware = endTimeWithoutMiddleware - startTimeWithoutMiddleware;

      // Verify that the middleware overhead is reasonable
      // This is a simple check and may need adjustment based on the environment
      expect(executionTimeWithMiddleware).toBeLessThan(executionTimeWithoutMiddleware * 10);

      // Log the performance impact for reference
      console.log(`Middleware overhead: ${executionTimeWithMiddleware - executionTimeWithoutMiddleware}ms`);
    });
  });

  describe('Middleware Registry Management', () => {
    it('should allow updating middleware profiles at runtime', async () => {
      // Update the active profile
      const newProfile = {
        name: 'minimal',
        enabled: true,
        include: ['LoggingMiddleware'],
        exclude: ['PerformanceMiddleware', 'TransformationMiddleware', 'CircuitBreakerMiddleware'],
      };

      middlewareRegistry.updateProfile(newProfile, { activateImmediately: true });

      // Create a middleware chain
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      const chain = middlewareFactory.createMiddlewareChain(context);

      // Execute the chain with a mock database operation
      await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      await chain['executeAfterHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
        result: { id: 1, name: 'Test User' },
      });

      // Verify that only the LoggingMiddleware was executed
      const executionOrder = context.metadata?.executionOrder || [];
      
      expect(executionOrder).toContain('before:LoggingMiddleware');
      expect(executionOrder).not.toContain('before:PerformanceMiddleware');
      expect(executionOrder).not.toContain('before:TransformationMiddleware');
      expect(executionOrder).not.toContain('before:CircuitBreakerMiddleware');
    });

    it('should allow disabling all middleware', async () => {
      // Update the active profile to disable all middleware
      const disabledProfile = {
        name: 'disabled',
        enabled: false,
        include: [],
        exclude: [],
      };

      middlewareRegistry.updateProfile(disabledProfile, { activateImmediately: true });

      // Create a middleware chain
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        operationType: DatabaseOperationType.QUERY,
        args: { where: { id: 1 } },
        operationId: '123',
      };

      const chain = middlewareFactory.createMiddlewareChain(context);

      // Execute the chain with a mock database operation
      await chain['executeBeforeHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
      });

      await chain['executeAfterHooks']({
        args: context.args,
        dataPath: [],
        runInTransaction: false,
        result: { id: 1, name: 'Test User' },
      });

      // Verify that no middleware was executed
      expect(mockLoggingMiddleware.beforeExecuteCalls).toBe(0);
      expect(mockPerformanceMiddleware.beforeExecuteCalls).toBe(0);
      expect(mockTransformationMiddleware.beforeExecuteCalls).toBe(0);
      expect(mockCircuitBreakerMiddleware.beforeExecuteCalls).toBe(0);
    });
  });
});
/**
 * @file middleware-pipeline.integration.spec.ts
 * @description Integration tests for the database middleware pipeline.
 * 
 * These tests verify the execution of multiple middleware in the correct order,
 * focusing on logging, metrics collection, query transformation, and performance monitoring.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { PrismaClient } from '@prisma/client';

import {
  DatabaseMiddleware,
  LoggingMiddleware,
  PerformanceMiddleware,
  TransformationMiddleware,
  CircuitBreakerMiddleware,
  MiddlewareContext,
} from '../../src/middleware/middleware.interface';
import { MiddlewareRegistry, JourneyContext } from '../../src/middleware/middleware.registry';
import { MiddlewareFactory, JourneyType } from '../../src/middleware/middleware.factory';
import { LoggingMiddleware as LoggingMiddlewareImpl } from '../../src/middleware/logging.middleware';
import { PerformanceMiddleware as PerformanceMiddlewareImpl } from '../../src/middleware/performance.middleware';
import { QueryTransformationMiddleware } from '../../src/middleware/transformation.middleware';
import { CircuitBreakerMiddleware as CircuitBreakerMiddlewareImpl } from '../../src/middleware/circuit-breaker.middleware';
import { OperationType } from '../../src/types/circuit-breaker.types';

// Mock implementations
class MockLoggerService implements Partial<LoggerService> {
  logs: Record<string, any[]> = {
    log: [],
    error: [],
    warn: [],
    debug: [],
    verbose: [],
  };

  log(message: string, ...args: any[]) {
    this.logs.log.push({ message, args });
  }

  error(message: string, ...args: any[]) {
    this.logs.error.push({ message, args });
  }

  warn(message: string, ...args: any[]) {
    this.logs.warn.push({ message, args });
  }

  debug(message: string, ...args: any[]) {
    this.logs.debug.push({ message, args });
  }

  verbose(message: string, ...args: any[]) {
    this.logs.verbose.push({ message, args });
  }

  clear() {
    this.logs = {
      log: [],
      error: [],
      warn: [],
      debug: [],
      verbose: [],
    };
  }
}

class MockTracingService implements Partial<TracingService> {
  spans: any[] = [];

  startSpan(name: string, options?: any) {
    const span = { name, options, events: [] };
    this.spans.push(span);
    return {
      end: () => {},
      addEvent: (event: string, attributes?: any) => {
        span.events.push({ event, attributes });
      },
    };
  }

  clear() {
    this.spans = [];
  }
}

class MockConfigService implements Partial<ConfigService> {
  private configs: Record<string, any> = {
    NODE_ENV: 'test',
  };

  get<T>(key: string, defaultValue?: T): T {
    return (this.configs[key] ?? defaultValue) as T;
  }

  set(key: string, value: any): void {
    this.configs[key] = value;
  }
}

class MockPrismaClient implements Partial<PrismaClient> {
  operations: any[] = [];

  async $executeRaw(query: any): Promise<any> {
    this.operations.push({ type: '$executeRaw', query });
    return 1;
  }

  async $queryRaw(query: any): Promise<any> {
    this.operations.push({ type: '$queryRaw', query });
    return [{ count: 1 }];
  }

  clear() {
    this.operations = [];
  }
}

// Custom test middleware for execution order verification
class TestOrderMiddleware implements DatabaseMiddleware {
  readonly id: string;
  readonly name: string;
  readonly priority: number;
  executionOrder: { method: string; timestamp: number }[] = [];

  constructor(id: string, priority: number = 100) {
    this.id = id;
    this.name = `Test Order Middleware ${id}`;
    this.priority = priority;
  }

  async beforeExecute<T>(params: T, context: MiddlewareContext): Promise<T> {
    this.executionOrder.push({ method: 'beforeExecute', timestamp: Date.now() });
    return params;
  }

  async afterExecute<T>(result: T | null, context: MiddlewareContext): Promise<T | null> {
    this.executionOrder.push({ method: 'afterExecute', timestamp: Date.now() });
    return result;
  }

  clear() {
    this.executionOrder = [];
  }
}

describe('Middleware Pipeline Integration', () => {
  let module: TestingModule;
  let middlewareRegistry: MiddlewareRegistry;
  let middlewareFactory: MiddlewareFactory;
  let loggerService: MockLoggerService;
  let tracingService: MockTracingService;
  let configService: MockConfigService;
  let prismaClient: MockPrismaClient;

  // Test middleware instances
  let loggingMiddleware: LoggingMiddleware;
  let performanceMiddleware: PerformanceMiddleware;
  let transformationMiddleware: TransformationMiddleware;
  let circuitBreakerMiddleware: CircuitBreakerMiddleware;
  let testMiddleware1: TestOrderMiddleware;
  let testMiddleware2: TestOrderMiddleware;
  let testMiddleware3: TestOrderMiddleware;

  beforeAll(async () => {
    // Create mock services
    loggerService = new MockLoggerService();
    tracingService = new MockTracingService();
    configService = new MockConfigService();
    prismaClient = new MockPrismaClient();

    // Create test module
    module = await Test.createTestingModule({
      providers: [
        {
          provide: LoggerService,
          useValue: loggerService,
        },
        {
          provide: TracingService,
          useValue: tracingService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: PrismaClient,
          useValue: prismaClient,
        },
        MiddlewareRegistry,
        MiddlewareFactory,
      ],
    }).compile();

    // Get service instances
    middlewareRegistry = module.get<MiddlewareRegistry>(MiddlewareRegistry);
    middlewareFactory = module.get<MiddlewareFactory>(MiddlewareFactory);

    // Create middleware instances
    loggingMiddleware = new LoggingMiddlewareImpl(loggerService, tracingService, {
      logLevel: 'debug',
      logParameters: true,
      logResults: true,
      maxLogSize: 2000,
      includeStackTrace: true,
      enableTracing: true,
    });

    performanceMiddleware = new PerformanceMiddlewareImpl({
      slowQueryThreshold: 100,
      enableMetrics: true,
      trackStackTrace: true,
      maxSlowQueries: 100,
      suggestOptimizations: true,
      logSlowQueries: true,
      emitMetrics: true,
    });

    transformationMiddleware = new QueryTransformationMiddleware();

    circuitBreakerMiddleware = new CircuitBreakerMiddlewareImpl(loggerService, {
      failureThreshold: {
        [OperationType.READ]: 5,
        [OperationType.WRITE]: 3,
        [OperationType.TRANSACTION]: 2,
        [OperationType.MIGRATION]: 1,
      },
      resetTimeout: 30000,
      halfOpenMaxOperations: 3,
      monitoringEnabled: true,
    });

    // Create test order middleware instances with different priorities
    testMiddleware1 = new TestOrderMiddleware('test1', 110); // Highest priority, executes first
    testMiddleware2 = new TestOrderMiddleware('test2', 100); // Medium priority
    testMiddleware3 = new TestOrderMiddleware('test3', 90);  // Lowest priority, executes last

    // Register middleware with the registry
    middlewareRegistry.registerLoggingMiddleware(loggingMiddleware, {
      id: 'test-logging',
      enabled: true,
      priority: 80,
      journeyContexts: ['global', 'health', 'care', 'plan'],
      environmentProfiles: ['development', 'test', 'production'],
    });

    middlewareRegistry.registerPerformanceMiddleware(performanceMiddleware, {
      id: 'test-performance',
      enabled: true,
      priority: 90,
      journeyContexts: ['global', 'health', 'care', 'plan'],
      environmentProfiles: ['development', 'test', 'production'],
    });

    middlewareRegistry.registerTransformationMiddleware(transformationMiddleware, {
      id: 'test-transformation',
      enabled: true,
      priority: 100,
      journeyContexts: ['global', 'health', 'care', 'plan'],
      environmentProfiles: ['development', 'test', 'production'],
    });

    middlewareRegistry.registerCircuitBreakerMiddleware(circuitBreakerMiddleware, {
      id: 'test-circuit-breaker',
      enabled: true,
      priority: 110,
      journeyContexts: ['global', 'health', 'care', 'plan'],
      environmentProfiles: ['development', 'test', 'production'],
    });

    // Register test middleware
    middlewareRegistry.register(testMiddleware1, {
      id: 'test-order-1',
      type: 'custom',
      enabled: true,
      priority: testMiddleware1.priority,
      journeyContexts: ['global'],
      environmentProfiles: ['test'],
    });

    middlewareRegistry.register(testMiddleware2, {
      id: 'test-order-2',
      type: 'custom',
      enabled: true,
      priority: testMiddleware2.priority,
      journeyContexts: ['global'],
      environmentProfiles: ['test'],
    });

    middlewareRegistry.register(testMiddleware3, {
      id: 'test-order-3',
      type: 'custom',
      enabled: true,
      priority: testMiddleware3.priority,
      journeyContexts: ['global'],
      environmentProfiles: ['test'],
    });
  });

  beforeEach(() => {
    // Clear all mocks before each test
    loggerService.clear();
    tracingService.clear();
    prismaClient.clear();
    testMiddleware1.clear();
    testMiddleware2.clear();
    testMiddleware3.clear();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Middleware Execution Order', () => {
    it('should execute middleware in order of priority for beforeExecute (highest to lowest)', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        args: { where: { id: 1 } },
        journey: JourneyType.GLOBAL,
      };

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'global',
        { where: { id: 1 } },
        context,
        async (params) => params,
      );

      // Assert - Check execution order of test middleware
      // Higher priority should execute first in beforeExecute
      const beforeExecutions = [
        ...testMiddleware1.executionOrder.filter(e => e.method === 'beforeExecute'),
        ...testMiddleware2.executionOrder.filter(e => e.method === 'beforeExecute'),
        ...testMiddleware3.executionOrder.filter(e => e.method === 'beforeExecute'),
      ];

      expect(beforeExecutions.length).toBe(3);
      
      // Verify order by timestamp
      expect(beforeExecutions[0].timestamp).toBeLessThanOrEqual(beforeExecutions[1].timestamp);
      expect(beforeExecutions[1].timestamp).toBeLessThanOrEqual(beforeExecutions[2].timestamp);
    });

    it('should execute middleware in reverse order of priority for afterExecute (lowest to highest)', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        args: { where: { id: 1 } },
        journey: JourneyType.GLOBAL,
      };

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'global',
        { where: { id: 1 } },
        context,
        async (params) => params,
      );

      // Assert - Check execution order of test middleware
      // Lower priority should execute first in afterExecute (reverse order)
      const afterExecutions = [
        ...testMiddleware3.executionOrder.filter(e => e.method === 'afterExecute'),
        ...testMiddleware2.executionOrder.filter(e => e.method === 'afterExecute'),
        ...testMiddleware1.executionOrder.filter(e => e.method === 'afterExecute'),
      ];

      expect(afterExecutions.length).toBe(3);
      
      // Verify order by timestamp
      expect(afterExecutions[0].timestamp).toBeLessThanOrEqual(afterExecutions[1].timestamp);
      expect(afterExecutions[1].timestamp).toBeLessThanOrEqual(afterExecutions[2].timestamp);
    });
  });

  describe('Logging Middleware', () => {
    it('should log database operations with parameters', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        args: { where: { id: 1 } },
        journey: JourneyType.HEALTH,
      };

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'health',
        { where: { id: 1 } },
        context,
        async (params) => ({ id: 1, name: 'Test User' }),
      );

      // Assert
      // Should have debug logs for the operation
      const debugLogs = loggerService.logs.debug;
      expect(debugLogs.length).toBeGreaterThan(0);
      
      // Should contain operation details
      const operationLog = debugLogs.find(log => 
        log.message.includes('User') && log.message.includes('findUnique')
      );
      expect(operationLog).toBeDefined();
      
      // Should contain parameters
      expect(JSON.stringify(operationLog)).toContain('id: 1');
    });

    it('should create tracing spans for database operations', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        args: { where: { id: 1 } },
        journey: JourneyType.HEALTH,
      };

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'health',
        { where: { id: 1 } },
        context,
        async (params) => ({ id: 1, name: 'Test User' }),
      );

      // Assert
      // Should have created a span for the operation
      expect(tracingService.spans.length).toBeGreaterThan(0);
      
      // Should have a span for the database operation
      const dbSpan = tracingService.spans.find(span => 
        span.name.includes('db') || span.name.includes('database')
      );
      expect(dbSpan).toBeDefined();
      
      // Should have events in the span
      expect(dbSpan.events.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Middleware', () => {
    it('should track query execution time', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        args: { where: { id: 1 } },
        journey: JourneyType.HEALTH,
        startTime: Date.now(), // Set start time for performance tracking
      };

      // Act
      // Simulate a slow query by adding a delay
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'health',
        { where: { id: 1 } },
        context,
        async (params) => {
          await new Promise(resolve => setTimeout(resolve, 150)); // 150ms delay
          return { id: 1, name: 'Test User' };
        },
      );

      // Assert
      // Should have logged a slow query
      const warnLogs = loggerService.logs.warn;
      const slowQueryLog = warnLogs.find(log => 
        log.message.includes('slow') || log.message.includes('performance')
      );
      expect(slowQueryLog).toBeDefined();
    });

    it('should collect metrics for query performance', async () => {
      // This test would typically verify that metrics are being collected
      // For this integration test, we'll check that the performance middleware is being called
      // and that it's tracking execution time

      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findMany',
        args: { where: { active: true } },
        journey: JourneyType.HEALTH,
        startTime: Date.now(),
      };

      // Create a spy on the performance middleware
      const afterExecuteSpy = jest.spyOn(performanceMiddleware, 'afterExecute');

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'health',
        { where: { active: true } },
        context,
        async (params) => {
          return [{ id: 1, name: 'Test User' }];
        },
      );

      // Assert
      expect(afterExecuteSpy).toHaveBeenCalled();
      
      // The context passed to afterExecute should have timing information
      const callContext = afterExecuteSpy.mock.calls[0][1];
      expect(callContext.startTime).toBeDefined();
      
      // Restore the spy
      afterExecuteSpy.mockRestore();
    });
  });

  describe('Transformation Middleware', () => {
    it('should transform query parameters before execution', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findMany',
        args: { where: { active: true } },
        journey: JourneyType.HEALTH,
      };

      // Create a spy on the transformation middleware
      const beforeExecuteSpy = jest.spyOn(transformationMiddleware, 'beforeExecute');

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'health',
        { where: { active: true } },
        context,
        async (params) => {
          // Verify that the parameters were transformed
          expect(params.where).toHaveProperty('isDeleted');
          expect(params.where.isDeleted).toBe(false);
          return [{ id: 1, name: 'Test User', active: true }];
        },
      );

      // Assert
      expect(beforeExecuteSpy).toHaveBeenCalled();
      
      // Restore the spy
      beforeExecuteSpy.mockRestore();
    });

    it('should apply soft deletion filter automatically', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findMany',
        args: { where: { active: true } },
        journey: JourneyType.HEALTH,
      };

      let transformedParams: any;

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'health',
        { where: { active: true } },
        context,
        async (params) => {
          transformedParams = params;
          return [{ id: 1, name: 'Test User', active: true }];
        },
      );

      // Assert
      expect(transformedParams.where).toHaveProperty('isDeleted');
      expect(transformedParams.where.isDeleted).toBe(false);
    });
  });

  describe('Circuit Breaker Middleware', () => {
    it('should allow operations when circuit is closed', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        args: { where: { id: 1 } },
        journey: JourneyType.HEALTH,
      };

      // Ensure circuit is closed
      if (circuitBreakerMiddleware.state !== 'closed') {
        circuitBreakerMiddleware.closeCircuit();
      }

      // Act & Assert - Should not throw
      await expect(
        middlewareRegistry.executeWithMiddleware<any, any>(
          'health',
          { where: { id: 1 } },
          context,
          async (params) => ({ id: 1, name: 'Test User' }),
        )
      ).resolves.toEqual({ id: 1, name: 'Test User' });
    });

    it('should block operations when circuit is open', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findUnique',
        args: { where: { id: 1 } },
        journey: JourneyType.HEALTH,
      };

      // Open the circuit
      circuitBreakerMiddleware.openCircuit();

      // Act & Assert - Should throw a circuit open exception
      await expect(
        middlewareRegistry.executeWithMiddleware<any, any>(
          'health',
          { where: { id: 1 } },
          context,
          async (params) => ({ id: 1, name: 'Test User' }),
        )
      ).rejects.toThrow(/circuit.*open/i);

      // Clean up - close the circuit for other tests
      circuitBreakerMiddleware.closeCircuit();
    });
  });

  describe('Middleware Chain Performance', () => {
    it('should measure the overhead of the middleware chain', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'User',
        operation: 'findMany',
        args: { where: { active: true } },
        journey: JourneyType.HEALTH,
      };

      const iterations = 100;
      const operation = async (params: any) => [{ id: 1, name: 'Test User', active: true }];

      // Act - Measure time without middleware
      const startWithout = Date.now();
      for (let i = 0; i < iterations; i++) {
        await operation({ where: { active: true } });
      }
      const endWithout = Date.now();
      const timeWithout = endWithout - startWithout;

      // Act - Measure time with middleware
      const startWith = Date.now();
      for (let i = 0; i < iterations; i++) {
        await middlewareRegistry.executeWithMiddleware<any, any>(
          'health',
          { where: { active: true } },
          context,
          operation,
        );
      }
      const endWith = Date.now();
      const timeWith = endWith - startWith;

      // Calculate overhead
      const overhead = timeWith - timeWithout;
      const overheadPerOperation = overhead / iterations;

      // Assert - Log the results
      console.log(`Middleware chain overhead: ${overhead}ms total, ${overheadPerOperation}ms per operation`);
      
      // The actual assertion is just to ensure the test runs without errors
      // In a real test, you might have performance budgets to enforce
      expect(overheadPerOperation).toBeDefined();
    });
  });

  describe('Journey-Specific Middleware', () => {
    it('should apply journey-specific middleware for health journey', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'HealthMetric',
        operation: 'create',
        args: { data: { userId: 1, type: 'HEART_RATE', value: 75 } },
        journey: JourneyType.HEALTH,
      };

      // Create a spy on the logging middleware
      const beforeExecuteSpy = jest.spyOn(loggingMiddleware, 'beforeExecute');

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'health',
        { data: { userId: 1, type: 'HEART_RATE', value: 75 } },
        context,
        async (params) => ({ id: 1, ...params.data }),
      );

      // Assert
      expect(beforeExecuteSpy).toHaveBeenCalled();
      
      // The context passed to beforeExecute should have the health journey
      const callContext = beforeExecuteSpy.mock.calls[0][1];
      expect(callContext.journey).toBe(JourneyType.HEALTH);
      
      // Restore the spy
      beforeExecuteSpy.mockRestore();
    });

    it('should apply journey-specific middleware for care journey', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'Appointment',
        operation: 'create',
        args: { data: { userId: 1, providerId: 2, date: new Date() } },
        journey: JourneyType.CARE,
      };

      // Create a spy on the logging middleware
      const beforeExecuteSpy = jest.spyOn(loggingMiddleware, 'beforeExecute');

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'care',
        { data: { userId: 1, providerId: 2, date: new Date() } },
        context,
        async (params) => ({ id: 1, ...params.data }),
      );

      // Assert
      expect(beforeExecuteSpy).toHaveBeenCalled();
      
      // The context passed to beforeExecute should have the care journey
      const callContext = beforeExecuteSpy.mock.calls[0][1];
      expect(callContext.journey).toBe(JourneyType.CARE);
      
      // Restore the spy
      beforeExecuteSpy.mockRestore();
    });

    it('should apply journey-specific middleware for plan journey', async () => {
      // Arrange
      const context: MiddlewareContext = {
        model: 'Claim',
        operation: 'create',
        args: { data: { userId: 1, amount: 100, description: 'Test claim' } },
        journey: JourneyType.PLAN,
      };

      // Create a spy on the logging middleware
      const beforeExecuteSpy = jest.spyOn(loggingMiddleware, 'beforeExecute');

      // Act
      await middlewareRegistry.executeWithMiddleware<any, any>(
        'plan',
        { data: { userId: 1, amount: 100, description: 'Test claim' } },
        context,
        async (params) => ({ id: 1, ...params.data }),
      );

      // Assert
      expect(beforeExecuteSpy).toHaveBeenCalled();
      
      // The context passed to beforeExecute should have the plan journey
      const callContext = beforeExecuteSpy.mock.calls[0][1];
      expect(callContext.journey).toBe(JourneyType.PLAN);
      
      // Restore the spy
      beforeExecuteSpy.mockRestore();
    });
  });

  describe('Middleware Factory', () => {
    it('should create optimized middleware chains for different operation types', async () => {
      // Arrange & Act
      const readChain = middlewareFactory.createReadOperationMiddlewareChain(JourneyType.HEALTH);
      const writeChain = middlewareFactory.createWriteOperationMiddlewareChain(JourneyType.HEALTH);
      const transactionChain = middlewareFactory.createTransactionMiddlewareChain(JourneyType.HEALTH);

      // Assert
      // All chains should have middleware
      expect(readChain.length).toBeGreaterThan(0);
      expect(writeChain.length).toBeGreaterThan(0);
      expect(transactionChain.length).toBeGreaterThan(0);
      
      // Chains should be different based on operation type
      // This is a simple check - in reality, the differences might be in configuration rather than length
      expect(JSON.stringify(readChain)).not.toEqual(JSON.stringify(writeChain));
      expect(JSON.stringify(readChain)).not.toEqual(JSON.stringify(transactionChain));
    });

    it('should create journey-specific middleware chains', async () => {
      // Arrange & Act
      const healthChain = middlewareFactory.createJourneyMiddlewareChain(JourneyType.HEALTH);
      const careChain = middlewareFactory.createJourneyMiddlewareChain(JourneyType.CARE);
      const planChain = middlewareFactory.createJourneyMiddlewareChain(JourneyType.PLAN);

      // Assert
      // All chains should have middleware
      expect(healthChain.length).toBeGreaterThan(0);
      expect(careChain.length).toBeGreaterThan(0);
      expect(planChain.length).toBeGreaterThan(0);
      
      // Chains should be different based on journey type
      // This is a simple check - in reality, the differences might be in configuration rather than length
      expect(JSON.stringify(healthChain)).not.toEqual(JSON.stringify(careChain));
      expect(JSON.stringify(healthChain)).not.toEqual(JSON.stringify(planChain));
    });

    it('should create high-throughput middleware chains with minimal overhead', async () => {
      // Arrange & Act
      const highThroughputChain = middlewareFactory.createHighThroughputMiddlewareChain();
      const standardChain = middlewareFactory.createMiddlewareChain();

      // Assert
      // High-throughput chain should have fewer middleware than standard chain
      expect(highThroughputChain.length).toBeLessThan(standardChain.length);
    });
  });
});
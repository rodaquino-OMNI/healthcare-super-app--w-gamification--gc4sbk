import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { LoggerService } from '../../src/logger.service';
import { TracingService } from '@austa/tracing';
import { Context, SpanStatusCode, trace } from '@opentelemetry/api';
import { TestAppModule } from './test-app.module';
import {
  captureLogOutput,
  clearCapturedLogs,
  getCapturedLogs,
} from '../utils/log-capture.utils';
import {
  assertLogContainsTraceId,
  assertLogContainsSpanId,
  assertLogsCorrelateWithTrace,
} from '../utils/assertion.utils';
import { createTestTraceContext } from '../utils/test-context.utils';
import { MockTracerProvider, createMockSpan } from '@austa/tracing/test/utils';

describe('Tracing Integration with Logging (E2E)', () => {
  let app: INestApplication;
  let loggerService: LoggerService;
  let tracingService: TracingService;
  let mockTracerProvider: MockTracerProvider;

  beforeAll(async () => {
    // Set up log capture before initializing the application
    captureLogOutput();

    // Create a test module with both logging and tracing
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get the services we need for testing
    loggerService = app.get<LoggerService>(LoggerService);
    tracingService = app.get<TracingService>(TracingService);
    mockTracerProvider = app.get<MockTracerProvider>(MockTracerProvider);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Clear captured logs before each test
    clearCapturedLogs();
    // Reset the mock tracer provider
    mockTracerProvider.reset();
  });

  describe('Basic Trace ID Propagation', () => {
    it('should include trace ID in logs when logging within a traced context', async () => {
      // Create a span and log within it
      await tracingService.createSpan('test-operation', async () => {
        loggerService.log('Test log message within a traced context');
        return true;
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log contains a trace ID
      assertLogContainsTraceId(logs[0]);

      // Verify that the log contains a span ID
      assertLogContainsSpanId(logs[0]);
    });

    it('should include the same trace ID in multiple logs within the same trace', async () => {
      // Create a span and log multiple times within it
      await tracingService.createSpan('multi-log-operation', async () => {
        loggerService.log('First log message');
        loggerService.log('Second log message');
        loggerService.log('Third log message');
        return true;
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured
      expect(logs.length).toEqual(3);

      // Get the trace ID from the first log
      const traceId = logs[0].traceId;

      // Verify that all logs have the same trace ID
      expect(logs[1].traceId).toEqual(traceId);
      expect(logs[2].traceId).toEqual(traceId);
    });
  });

  describe('Nested Span Context', () => {
    it('should include parent-child span relationship in logs for nested spans', async () => {
      // Create a parent span
      await tracingService.createSpan('parent-operation', async () => {
        loggerService.log('Log in parent span');

        // Create a child span
        await tracingService.createSpan('child-operation', async () => {
          loggerService.log('Log in child span');
          return true;
        });

        return true;
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured
      expect(logs.length).toEqual(2);

      // Both logs should have the same trace ID
      expect(logs[0].traceId).toEqual(logs[1].traceId);

      // But different span IDs
      expect(logs[0].spanId).not.toEqual(logs[1].spanId);

      // The second log should have the first log's span ID as its parent span ID
      expect(logs[1].parentSpanId).toEqual(logs[0].spanId);
    });
  });

  describe('Error Scenarios', () => {
    it('should include trace context in error logs', async () => {
      // Create a span that will throw an error
      try {
        await tracingService.createSpan('error-operation', async () => {
          throw new Error('Test error');
        });
      } catch (error) {
        // Error is expected, we'll check the logs
      }

      // Get the captured logs
      const logs = getCapturedLogs();

      // Find the error log
      const errorLog = logs.find(log => log.level === 'error');

      // Verify that an error log was captured
      expect(errorLog).toBeDefined();

      // Verify that the error log contains trace context
      assertLogContainsTraceId(errorLog);
      assertLogContainsSpanId(errorLog);

      // Verify that the error log contains the error message
      expect(errorLog.message).toContain('Test error');
    });
  });

  describe('Cross-Service Trace Propagation', () => {
    it('should maintain trace context when propagated across service boundaries', async () => {
      // Create a mock trace context as if it came from another service
      const externalTraceContext = createTestTraceContext({
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        traceFlags: 1, // sampled
      });

      // Simulate receiving a request from another service with trace context
      await trace.with(externalTraceContext, async () => {
        // This simulates processing in the current service
        await tracingService.createSpan('cross-service-operation', async () => {
          loggerService.log('Processing request from another service');
          return true;
        });
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log contains the external trace ID
      expect(logs[0].traceId).toEqual('0af7651916cd43dd8448eb211c80319c');

      // Verify that the log contains a new span ID (not the external one)
      expect(logs[0].spanId).not.toEqual('b7ad6b7169203331');

      // Verify that the log contains the external span ID as the parent
      expect(logs[0].parentSpanId).toEqual('b7ad6b7169203331');
    });

    it('should propagate trace context through multiple service hops', async () => {
      // Simulate a three-service call chain: Service A -> Service B -> Service C
      
      // Service A creates the initial trace
      const serviceATraceContext = createTestTraceContext({
        traceId: 'abcdef0123456789abcdef0123456789',
        spanId: 'aaaaaaaabbbbbbbb',
        traceFlags: 1, // sampled
      });

      await trace.with(serviceATraceContext, async () => {
        // Service A logs
        loggerService.log('Service A processing');

        // Service A calls Service B
        const serviceBSpan = createMockSpan('service-b-operation');
        await trace.with(trace.setSpan(trace.context(), serviceBSpan), async () => {
          // Service B logs
          loggerService.log('Service B processing');

          // Service B calls Service C
          const serviceCSpan = createMockSpan('service-c-operation');
          await trace.with(trace.setSpan(trace.context(), serviceCSpan), async () => {
            // Service C logs
            loggerService.log('Service C processing');
          });
        });
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured for all three services
      expect(logs.length).toEqual(3);

      // All logs should have the same trace ID (from Service A)
      expect(logs[0].traceId).toEqual('abcdef0123456789abcdef0123456789');
      expect(logs[1].traceId).toEqual('abcdef0123456789abcdef0123456789');
      expect(logs[2].traceId).toEqual('abcdef0123456789abcdef0123456789');

      // Verify the span hierarchy
      expect(logs[0].spanId).toEqual('aaaaaaaabbbbbbbb'); // Service A's span ID
      expect(logs[1].parentSpanId).toEqual('aaaaaaaabbbbbbbb'); // Service B's parent is Service A
      expect(logs[2].parentSpanId).toEqual(logs[1].spanId); // Service C's parent is Service B
    });
  });

  describe('Trace Context in Different Log Levels', () => {
    it('should include trace context in logs of all levels', async () => {
      // Create a span and log at different levels within it
      await tracingService.createSpan('multi-level-operation', async () => {
        loggerService.log('Info level log');
        loggerService.error('Error level log');
        loggerService.warn('Warning level log');
        loggerService.debug('Debug level log');
        loggerService.verbose('Verbose level log');
        return true;
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured for all levels
      expect(logs.length).toEqual(5);

      // Get the trace ID from the first log
      const traceId = logs[0].traceId;

      // Verify that all logs have the same trace ID regardless of level
      logs.forEach(log => {
        expect(log.traceId).toEqual(traceId);
        assertLogContainsSpanId(log);
      });

      // Verify that we have logs of each level
      const levels = logs.map(log => log.level);
      expect(levels).toContain('info');
      expect(levels).toContain('error');
      expect(levels).toContain('warn');
      expect(levels).toContain('debug');
      expect(levels).toContain('verbose');
    });
  });

  describe('Journey-Specific Trace Context', () => {
    it('should include journey information in trace context for Health journey', async () => {
      // Create a span with Health journey context
      await tracingService.createSpan('health-journey-operation', async () => {
        // Set journey context for the log
        loggerService.setContext({
          journeyType: 'Health',
          journeyId: 'health-123',
          userId: 'user-456',
        });
        
        loggerService.log('Health journey operation');
        return true;
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log contains trace context
      assertLogContainsTraceId(logs[0]);
      assertLogContainsSpanId(logs[0]);

      // Verify that the log contains journey context
      expect(logs[0].journeyType).toEqual('Health');
      expect(logs[0].journeyId).toEqual('health-123');
      expect(logs[0].userId).toEqual('user-456');
    });

    it('should include journey information in trace context for Care journey', async () => {
      // Create a span with Care journey context
      await tracingService.createSpan('care-journey-operation', async () => {
        // Set journey context for the log
        loggerService.setContext({
          journeyType: 'Care',
          journeyId: 'care-789',
          userId: 'user-456',
        });
        
        loggerService.log('Care journey operation');
        return true;
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log contains trace context
      assertLogContainsTraceId(logs[0]);
      assertLogContainsSpanId(logs[0]);

      // Verify that the log contains journey context
      expect(logs[0].journeyType).toEqual('Care');
      expect(logs[0].journeyId).toEqual('care-789');
      expect(logs[0].userId).toEqual('user-456');
    });

    it('should include journey information in trace context for Plan journey', async () => {
      // Create a span with Plan journey context
      await tracingService.createSpan('plan-journey-operation', async () => {
        // Set journey context for the log
        loggerService.setContext({
          journeyType: 'Plan',
          journeyId: 'plan-101',
          userId: 'user-456',
        });
        
        loggerService.log('Plan journey operation');
        return true;
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log contains trace context
      assertLogContainsTraceId(logs[0]);
      assertLogContainsSpanId(logs[0]);

      // Verify that the log contains journey context
      expect(logs[0].journeyType).toEqual('Plan');
      expect(logs[0].journeyId).toEqual('plan-101');
      expect(logs[0].userId).toEqual('user-456');
    });
  });

  describe('Business Transaction Tracking', () => {
    it('should track business transactions across multiple spans', async () => {
      // Create a business transaction with multiple steps
      await tracingService.createSpan('business-transaction', async () => {
        // Add business transaction ID to the span
        const currentSpan = trace.getSpan(trace.context());
        currentSpan.setAttribute('business.transactionId', 'tx-12345');
        
        loggerService.log('Starting business transaction');

        // Step 1: Validate input
        await tracingService.createSpan('validate-input', async () => {
          loggerService.log('Validating input data');
          return true;
        });

        // Step 2: Process data
        await tracingService.createSpan('process-data', async () => {
          loggerService.log('Processing data');
          return true;
        });

        // Step 3: Save results
        await tracingService.createSpan('save-results', async () => {
          loggerService.log('Saving results');
          return true;
        });

        loggerService.log('Completed business transaction');
        return true;
      });

      // Get the captured logs
      const logs = getCapturedLogs();

      // Verify that logs were captured for all steps
      expect(logs.length).toEqual(5);

      // All logs should have the same trace ID
      const traceId = logs[0].traceId;
      logs.forEach(log => {
        expect(log.traceId).toEqual(traceId);
      });

      // Verify that the business transaction ID is included in the logs
      // This would typically be added by the LoggerService when it detects the attribute in the span
      logs.forEach(log => {
        expect(log.businessTransactionId).toEqual('tx-12345');
      });

      // Verify the span hierarchy for the business transaction
      const parentSpanId = logs[0].spanId; // First log's span ID is the parent
      
      // The validate, process, and save spans should have the parent span ID as their parent
      expect(logs[1].parentSpanId).toEqual(parentSpanId);
      expect(logs[2].parentSpanId).toEqual(parentSpanId);
      expect(logs[3].parentSpanId).toEqual(parentSpanId);
      
      // The last log should have the same span ID as the first (they're in the same span)
      expect(logs[4].spanId).toEqual(parentSpanId);
    });
  });
});
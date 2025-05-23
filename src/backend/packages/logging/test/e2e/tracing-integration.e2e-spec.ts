import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { TestAppModule } from './test-app.module';
import { LoggerService } from '../../src/logger.service';
import { TracingService } from '@austa/tracing';
import { LogCaptureUtils, TraceContextUtils } from './utils';
import { TraceContexts } from './fixtures/trace-contexts';

describe('Tracing Integration', () => {
  let app: INestApplication;
  let loggerService: LoggerService;
  let tracingService: TracingService;
  let logCapture: LogCaptureUtils;

  beforeAll(async () => {
    // Initialize log capture utility
    logCapture = new LogCaptureUtils();
    logCapture.startCapture();

    // Create test module with both logging and tracing
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get service instances
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    tracingService = moduleFixture.get<TracingService>(TracingService);
  });

  afterAll(async () => {
    logCapture.stopCapture();
    await app.close();
  });

  afterEach(() => {
    logCapture.clearCapture();
  });

  describe('Basic Trace ID Propagation', () => {
    it('should include trace ID in logs when logging within a span', async () => {
      // Create a span and log within it
      await tracingService.createSpan('test-operation', async () => {
        // Get current span context
        const spanContext = trace.getSpan(context.active())?.spanContext();
        
        // Log a message
        loggerService.log('Test message within span');
        
        // Verify the log contains the trace ID
        const logs = logCapture.getCapturedLogs();
        expect(logs.length).toBeGreaterThan(0);
        
        const lastLog = logs[logs.length - 1];
        expect(lastLog).toContain(spanContext.traceId);
      });
    });

    it('should include span ID in logs when logging within a span', async () => {
      // Create a span and log within it
      await tracingService.createSpan('test-operation-span-id', async () => {
        // Get current span context
        const spanContext = trace.getSpan(context.active())?.spanContext();
        
        // Log a message
        loggerService.log('Test message for span ID verification');
        
        // Verify the log contains the span ID
        const logs = logCapture.getCapturedLogs();
        expect(logs.length).toBeGreaterThan(0);
        
        const lastLog = logs[logs.length - 1];
        expect(lastLog).toContain(spanContext.spanId);
      });
    });
  });

  describe('Error Handling with Tracing', () => {
    it('should record exceptions in spans and include error details in logs', async () => {
      // Create a span that will throw an error
      try {
        await tracingService.createSpan('error-operation', async () => {
          // Get current span context
          const spanContext = trace.getSpan(context.active())?.spanContext();
          
          // Log before error
          loggerService.log('About to throw an error');
          
          // Throw an error
          throw new Error('Test error in span');
        });
      } catch (error) {
        // Error is expected, continue
      }
      
      // Verify logs contain error information and trace context
      const logs = logCapture.getCapturedLogs();
      expect(logs.length).toBeGreaterThan(1); // Should have at least 2 logs (pre-error and error)
      
      // Find the error log
      const errorLog = logs.find(log => log.includes('Test error in span'));
      expect(errorLog).toBeDefined();
      
      // Verify it contains trace information
      expect(errorLog).toContain('traceId');
      expect(errorLog).toContain('spanId');
    });
  });

  describe('Nested Spans', () => {
    it('should maintain parent-child relationship in logs for nested spans', async () => {
      // Create a parent span
      await tracingService.createSpan('parent-operation', async () => {
        const parentSpanContext = trace.getSpan(context.active())?.spanContext();
        loggerService.log('Parent span log');
        
        // Create a child span
        await tracingService.createSpan('child-operation', async () => {
          const childSpanContext = trace.getSpan(context.active())?.spanContext();
          loggerService.log('Child span log');
          
          // Verify logs
          const logs = logCapture.getCapturedLogs();
          const parentLog = logs.find(log => log.includes('Parent span log'));
          const childLog = logs.find(log => log.includes('Child span log'));
          
          // Both logs should exist
          expect(parentLog).toBeDefined();
          expect(childLog).toBeDefined();
          
          // Both should have the same trace ID
          expect(parentLog).toContain(parentSpanContext.traceId);
          expect(childLog).toContain(childSpanContext.traceId);
          expect(parentSpanContext.traceId).toEqual(childSpanContext.traceId);
          
          // But different span IDs
          expect(parentSpanContext.spanId).not.toEqual(childSpanContext.spanId);
        });
      });
    });
  });

  describe('Cross-Service Trace Propagation', () => {
    it('should maintain trace context across simulated service boundaries', async () => {
      // Create a mock trace context from another service
      const externalTraceContext = TraceContextUtils.createMockTraceContext(
        TraceContexts.crossServiceTrace.traceId,
        TraceContexts.crossServiceTrace.spanId
      );
      
      // Simulate receiving a request from another service with trace context
      await TraceContextUtils.runWithMockTraceContext(externalTraceContext, async () => {
        // Log in the "receiving" service
        loggerService.log('Received request from external service');
        
        // Create a new span in this service (should be a child of the external span)
        await tracingService.createSpan('local-operation', async () => {
          loggerService.log('Processing in local service');
          
          // Verify logs
          const logs = logCapture.getCapturedLogs();
          const receivedLog = logs.find(log => log.includes('Received request'));
          const processingLog = logs.find(log => log.includes('Processing in local'));
          
          // Both logs should exist
          expect(receivedLog).toBeDefined();
          expect(processingLog).toBeDefined();
          
          // Both should have the same trace ID as the external context
          expect(receivedLog).toContain(TraceContexts.crossServiceTrace.traceId);
          expect(processingLog).toContain(TraceContexts.crossServiceTrace.traceId);
        });
      });
    });
  });

  describe('Log Level Consistency with Tracing', () => {
    it('should maintain trace context across all log levels', async () => {
      await tracingService.createSpan('multi-level-logging', async () => {
        const spanContext = trace.getSpan(context.active())?.spanContext();
        
        // Log at different levels
        loggerService.log('Info level log');
        loggerService.error('Error level log');
        loggerService.warn('Warning level log');
        loggerService.debug('Debug level log');
        loggerService.verbose('Verbose level log');
        
        // Verify all logs have trace context
        const logs = logCapture.getCapturedLogs();
        const logLevels = ['Info', 'Error', 'Warning', 'Debug', 'Verbose'];
        
        logLevels.forEach(level => {
          const levelLog = logs.find(log => log.includes(`${level} level log`));
          expect(levelLog).toBeDefined();
          expect(levelLog).toContain(spanContext.traceId);
          expect(levelLog).toContain(spanContext.spanId);
        });
      });
    });
  });

  describe('Span Attributes in Logs', () => {
    it('should include custom span attributes in logs', async () => {
      await tracingService.createSpan('attributed-operation', async () => {
        // Get current span and add attributes
        const span = trace.getSpan(context.active());
        span.setAttribute('journey', 'health');
        span.setAttribute('userId', '12345');
        span.setAttribute('operation', 'update-health-metrics');
        
        // Log a message
        loggerService.log('Operation with custom attributes');
        
        // Verify the log contains the custom attributes
        const logs = logCapture.getCapturedLogs();
        const lastLog = logs[logs.length - 1];
        
        expect(lastLog).toContain('journey');
        expect(lastLog).toContain('health');
        expect(lastLog).toContain('userId');
        expect(lastLog).toContain('12345');
        expect(lastLog).toContain('operation');
        expect(lastLog).toContain('update-health-metrics');
      });
    });
  });

  describe('Trace Context with Journey Context', () => {
    it('should combine trace context with journey context in logs', async () => {
      // Create a health journey context
      const healthJourneyContext = {
        journeyType: 'HEALTH',
        journeyId: 'health-journey-123',
        userId: 'user-456',
      };
      
      await tracingService.createSpan('health-journey-operation', async () => {
        const spanContext = trace.getSpan(context.active())?.spanContext();
        
        // Log with journey context
        loggerService.log('Health journey operation', { journeyContext: healthJourneyContext });
        
        // Verify the log contains both trace and journey context
        const logs = logCapture.getCapturedLogs();
        const lastLog = logs[logs.length - 1];
        
        // Should have trace context
        expect(lastLog).toContain(spanContext.traceId);
        expect(lastLog).toContain(spanContext.spanId);
        
        // Should have journey context
        expect(lastLog).toContain('HEALTH');
        expect(lastLog).toContain('health-journey-123');
        expect(lastLog).toContain('user-456');
      });
    });
  });
});
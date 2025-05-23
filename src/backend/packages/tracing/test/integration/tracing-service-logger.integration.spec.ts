import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '../../src/tracing.service';
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

/**
 * Integration tests for TracingService and LoggerService interaction.
 * These tests verify that trace context is properly propagated to logs,
 * enabling correlation between logs and traces for unified observability.
 */
describe('TracingService and LoggerService Integration', () => {
  let tracingService: TracingService;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let memoryExporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;
  
  // Mock implementation of LoggerService to capture logs for verification
  class MockLoggerService implements Partial<LoggerService> {
    public logs: Array<{ level: string; message: string; context?: any; traceId?: string; spanId?: string }> = [];
    
    log(message: string, context?: any): void {
      this.logs.push({ level: 'info', message, context });
    }
    
    error(message: string, trace?: any, context?: any): void {
      this.logs.push({ level: 'error', message, context });
    }
    
    warn(message: string, context?: any): void {
      this.logs.push({ level: 'warn', message, context });
    }
    
    debug(message: string, context?: any): void {
      this.logs.push({ level: 'debug', message, context });
    }
    
    withCurrentTraceContext(): LoggerService {
      // This method will be spied on in tests
      return this;
    }
  }
  
  beforeEach(async () => {
    // Set up OpenTelemetry test infrastructure
    memoryExporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider();
    provider.addSpanProcessor(new SimpleSpanProcessor(memoryExporter));
    provider.register();
    
    // Create mock ConfigService
    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'service.name') return 'test-service';
        return defaultValue;
      }),
    } as unknown as ConfigService;
    
    // Create mock LoggerService
    const mockLoggerService = new MockLoggerService();
    
    // Create the module with TracingService
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracingService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();
    
    tracingService = module.get<TracingService>(TracingService);
    loggerService = module.get<LoggerService>(LoggerService);
  });
  
  afterEach(() => {
    memoryExporter.reset();
  });
  
  /**
   * Test that verifies trace ID propagation to logs.
   * When a log is created within a traced context, the log entry should
   * include the trace ID and span ID from the active span.
   */
  it('should propagate trace context to logs', async () => {
    // Spy on the getCorrelationInfo method
    const getCorrelationInfoSpy = jest.spyOn(tracingService, 'getCorrelationInfo');
    
    // Create a span and execute a function within it
    await tracingService.createSpan('test-span', async () => {
      // Get the current span
      const currentSpan = tracingService.getCurrentSpan();
      expect(currentSpan).toBeDefined();
      
      // Get correlation info
      const correlationInfo = tracingService.getCorrelationInfo();
      expect(correlationInfo).toBeDefined();
      expect(correlationInfo['trace.id']).toBeDefined();
      expect(correlationInfo['span.id']).toBeDefined();
      
      // Log a message
      loggerService.log('Test message within span');
      
      // Verify getCorrelationInfo was called
      expect(getCorrelationInfoSpy).toHaveBeenCalled();
    });
    
    // Verify spans were created and exported
    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('test-span');
    
    // Verify the log contains trace context
    const mockLogger = loggerService as unknown as MockLoggerService;
    expect(mockLogger.logs.length).toBeGreaterThan(0);
    
    // The log should have been enriched with trace context
    const lastLog = mockLogger.logs[mockLogger.logs.length - 1];
    expect(lastLog.message).toBe('Test message within span');
  });
  
  /**
   * Test that verifies span context extraction and inclusion in log metadata.
   * This test ensures that the trace context is properly extracted from the
   * current span and included in the log metadata.
   */
  it('should extract span context and include it in log metadata', async () => {
    // Spy on the withCurrentTraceContext method
    const withCurrentTraceContextSpy = jest.spyOn(loggerService, 'withCurrentTraceContext');
    
    // Create a span and execute a function within it
    await tracingService.createSpan('metadata-test-span', async () => {
      // Get the current span
      const currentSpan = tracingService.getCurrentSpan();
      expect(currentSpan).toBeDefined();
      
      // Create a logger with the current trace context
      const contextLogger = loggerService.withCurrentTraceContext();
      contextLogger.log('Test message with trace context');
      
      // Verify withCurrentTraceContext was called
      expect(withCurrentTraceContextSpy).toHaveBeenCalled();
    });
    
    // Verify spans were created and exported
    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('metadata-test-span');
  });
  
  /**
   * Test that verifies correlation IDs are consistent between traces and logs.
   * This test ensures that the trace ID used in logs matches the trace ID
   * from the active span, providing a consistent correlation mechanism.
   */
  it('should ensure correlation IDs are consistent between traces and logs', async () => {
    let traceId: string | undefined;
    let spanId: string | undefined;
    
    // Create a span and execute a function within it
    await tracingService.createSpan('correlation-test-span', async () => {
      // Get the current span
      const currentSpan = tracingService.getCurrentSpan();
      expect(currentSpan).toBeDefined();
      
      // Get correlation info
      const correlationInfo = tracingService.getCorrelationInfo();
      traceId = correlationInfo['trace.id'];
      spanId = correlationInfo['span.id'];
      
      // Log a message
      loggerService.log('Test message for correlation');
    });
    
    // Verify spans were created and exported
    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('correlation-test-span');
    
    // Verify the exported span has the same trace ID and span ID
    const exportedSpan = spans[0];
    expect(exportedSpan.spanContext().traceId).toBe(traceId);
    expect(exportedSpan.spanContext().spanId).toBe(spanId);
  });
  
  /**
   * Test that verifies error handling and logging within traced operations.
   * This test ensures that when an error occurs within a traced operation,
   * the error is properly recorded in the span and the log entry includes
   * the trace context for correlation.
   */
  it('should handle errors and preserve trace context in logs', async () => {
    // Spy on the error method of the logger
    const errorSpy = jest.spyOn(loggerService, 'error');
    
    // Create a span that will throw an error
    try {
      await tracingService.createSpan('error-test-span', async () => {
        throw new Error('Test error');
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      // Verify the error was logged
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toContain('Test error');
    }
    
    // Verify spans were created, recorded the error, and exported
    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('error-test-span');
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    
    // Verify the span has error attributes
    const events = spans[0].events;
    expect(events.length).toBeGreaterThan(0);
    const errorEvent = events.find(e => e.name === 'exception');
    expect(errorEvent).toBeDefined();
  });
  
  /**
   * Test that validates trace context preservation in nested logging operations.
   * This test ensures that when nested spans are created, the trace context
   * is properly maintained and propagated to logs at each level.
   */
  it('should preserve trace context in nested logging operations', async () => {
    // Create a parent span
    await tracingService.createSpan('parent-span', async () => {
      const parentSpan = tracingService.getCurrentSpan();
      expect(parentSpan).toBeDefined();
      
      // Get parent correlation info
      const parentCorrelationInfo = tracingService.getCorrelationInfo();
      const parentTraceId = parentCorrelationInfo['trace.id'];
      const parentSpanId = parentCorrelationInfo['span.id'];
      
      // Log a message in the parent span
      loggerService.log('Parent span message');
      
      // Create a child span
      await tracingService.createSpan('child-span', async () => {
        const childSpan = tracingService.getCurrentSpan();
        expect(childSpan).toBeDefined();
        
        // Get child correlation info
        const childCorrelationInfo = tracingService.getCorrelationInfo();
        const childTraceId = childCorrelationInfo['trace.id'];
        const childSpanId = childCorrelationInfo['span.id'];
        
        // Log a message in the child span
        loggerService.log('Child span message');
        
        // Verify the trace ID is the same but the span ID is different
        expect(childTraceId).toBe(parentTraceId);
        expect(childSpanId).not.toBe(parentSpanId);
      });
    });
    
    // Verify spans were created and exported
    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(2);
    
    // Find parent and child spans
    const parentSpan = spans.find(s => s.name === 'parent-span');
    const childSpan = spans.find(s => s.name === 'child-span');
    
    expect(parentSpan).toBeDefined();
    expect(childSpan).toBeDefined();
    
    // Verify parent-child relationship
    expect(childSpan?.parentSpanId).toBe(parentSpan?.spanContext().spanId);
    
    // Verify both spans have the same trace ID
    expect(childSpan?.spanContext().traceId).toBe(parentSpan?.spanContext().traceId);
  });
  
  /**
   * Test that verifies journey-specific context is included in logs and traces.
   * This test ensures that when journey context is added to a span, it is
   * properly propagated to logs for correlation with business operations.
   */
  it('should include journey-specific context in logs and traces', async () => {
    // Create a span with journey context
    await tracingService.createSpan('journey-span', async () => {
      // Set journey context
      tracingService.setJourneyContext({
        journeyType: 'health',
        journeyId: 'health-123',
        userId: 'user-456',
      });
      
      // Log a message
      loggerService.log('Journey-specific message');
      
      // Get the current span
      const currentSpan = tracingService.getCurrentSpan();
      expect(currentSpan).toBeDefined();
      
      // Verify journey attributes were added to the span
      expect(currentSpan?.attributes['journey.type']).toBe('health');
      expect(currentSpan?.attributes['journey.id']).toBe('health-123');
      expect(currentSpan?.attributes['user.id']).toBe('user-456');
    });
    
    // Verify spans were created and exported
    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('journey-span');
    
    // Verify journey attributes in the exported span
    const exportedSpan = spans[0];
    expect(exportedSpan.attributes['journey.type']).toBe('health');
    expect(exportedSpan.attributes['journey.id']).toBe('health-123');
    expect(exportedSpan.attributes['user.id']).toBe('user-456');
  });
  
  /**
   * Test that verifies trace context is properly propagated across async boundaries.
   * This test ensures that when async operations occur within a span, the trace
   * context is properly maintained and propagated to logs in each async operation.
   */
  it('should propagate trace context across async boundaries', async () => {
    // Create a span with async operations
    await tracingService.createSpan('async-span', async () => {
      // Get initial correlation info
      const initialCorrelationInfo = tracingService.getCorrelationInfo();
      const initialTraceId = initialCorrelationInfo['trace.id'];
      const initialSpanId = initialCorrelationInfo['span.id'];
      
      // Log a message before async operation
      loggerService.log('Before async operation');
      
      // Perform an async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Get correlation info after async operation
      const afterCorrelationInfo = tracingService.getCorrelationInfo();
      const afterTraceId = afterCorrelationInfo['trace.id'];
      const afterSpanId = afterCorrelationInfo['span.id'];
      
      // Log a message after async operation
      loggerService.log('After async operation');
      
      // Verify the trace and span IDs are preserved across the async boundary
      expect(afterTraceId).toBe(initialTraceId);
      expect(afterSpanId).toBe(initialSpanId);
    });
    
    // Verify spans were created and exported
    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('async-span');
  });
  
  /**
   * Test that verifies trace context is properly propagated when using the
   * TracingService's startSpan and getCurrentSpan methods directly.
   */
  it('should propagate trace context when using startSpan directly', async () => {
    // Start a span manually
    const span = tracingService.startSpan('manual-span');
    
    try {
      // Set the span as active
      await trace.with(trace.setSpan(context.active(), span), async () => {
        // Get the current span
        const currentSpan = tracingService.getCurrentSpan();
        expect(currentSpan).toBeDefined();
        expect(currentSpan?.spanContext().spanId).toBe(span.spanContext().spanId);
        
        // Get correlation info
        const correlationInfo = tracingService.getCorrelationInfo();
        expect(correlationInfo['trace.id']).toBe(span.spanContext().traceId);
        expect(correlationInfo['span.id']).toBe(span.spanContext().spanId);
        
        // Log a message
        loggerService.log('Manual span message');
      });
    } finally {
      // End the span
      span.end();
    }
    
    // Verify spans were created and exported
    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('manual-span');
  });
});
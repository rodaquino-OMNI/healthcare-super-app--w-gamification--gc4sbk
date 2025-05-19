import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { TracingService } from '../../../../src/tracing.service';
import { Context, SpanStatusCode, trace, context, SpanContext, Span } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

/**
 * Custom logger implementation for testing that captures logs for verification
 */
class TestLoggerService implements LoggerService {
  logs: Array<{ level: string; message: string; context?: string; trace?: string; metadata?: any }> = [];

  log(message: string, context?: string, metadata?: any): void {
    this.logs.push({ level: 'info', message, context, metadata });
  }

  error(message: string, trace?: string, context?: string, metadata?: any): void {
    this.logs.push({ level: 'error', message, trace, context, metadata });
  }

  warn(message: string, context?: string, metadata?: any): void {
    this.logs.push({ level: 'warn', message, context, metadata });
  }

  debug(message: string, context?: string, metadata?: any): void {
    this.logs.push({ level: 'debug', message, context, metadata });
  }

  verbose(message: string, context?: string, metadata?: any): void {
    this.logs.push({ level: 'verbose', message, context, metadata });
  }

  // Helper method to clear logs between tests
  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Enhanced TracingService for testing that exposes internal methods and properties
 */
class TestTracingService extends TracingService {
  // Expose the tracer for testing
  getTracer() {
    return (this as any).tracer;
  }

  // Helper method to get the current active span
  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  // Helper method to get the current span context
  getCurrentSpanContext(): SpanContext | undefined {
    const span = this.getCurrentSpan();
    return span?.spanContext();
  }
}

describe('TracingService and LoggerService Integration', () => {
  let module: TestingModule;
  let tracingService: TestTracingService;
  let loggerService: TestLoggerService;
  let configService: ConfigService;
  let memoryExporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;

  beforeEach(async () => {
    // Create an in-memory span exporter for testing
    memoryExporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider();
    provider.addSpanProcessor(new SimpleSpanProcessor(memoryExporter));
    provider.register();

    // Create a mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'service.name') return 'test-service';
        return defaultValue;
      }),
    };

    // Create the test module
    module = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useClass: TestLoggerService,
        },
        {
          provide: TracingService,
          useClass: TestTracingService,
        },
      ],
    }).compile();

    // Get service instances
    tracingService = module.get<TestTracingService>(TracingService) as TestTracingService;
    loggerService = module.get<TestLoggerService>(LoggerService) as TestLoggerService;
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    // Clear logs and spans between tests
    loggerService.clearLogs();
    memoryExporter.reset();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(tracingService).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  it('should initialize tracer with service name from config', () => {
    // Verify the config service was called with the correct key
    expect(configService.get).toHaveBeenCalledWith('service.name', 'austa-service');
    
    // Verify the tracer was initialized
    expect(tracingService.getTracer()).toBeDefined();
    
    // Verify initialization was logged
    expect(loggerService.logs).toHaveLength(1);
    expect(loggerService.logs[0].message).toContain('Initialized tracer for test-service');
    expect(loggerService.logs[0].context).toBe('AustaTracing');
  });

  it('should propagate trace context to logs during successful operations', async () => {
    // Define a test operation
    const testOperation = async () => {
      // Get the current span context for verification
      const spanContext = tracingService.getCurrentSpanContext();
      
      // Log a message within the span context
      loggerService.log('Test operation executed successfully', 'TestOperation', { 
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId
      });
      
      return 'success';
    };

    // Execute the operation within a span
    const result = await tracingService.createSpan('test-operation', testOperation);

    // Verify the operation was successful
    expect(result).toBe('success');

    // Verify spans were created and completed
    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe('test-operation');
    expect(spans[0].status.code).toBe(SpanStatusCode.OK);

    // Verify logs contain trace context
    expect(loggerService.logs).toHaveLength(2); // Initialization log + operation log
    const operationLog = loggerService.logs[1];
    expect(operationLog.level).toBe('info');
    expect(operationLog.message).toBe('Test operation executed successfully');
    expect(operationLog.context).toBe('TestOperation');
    
    // Verify trace context in log metadata
    expect(operationLog.metadata).toBeDefined();
    expect(operationLog.metadata.traceId).toBeDefined();
    expect(operationLog.metadata.spanId).toBeDefined();
    
    // Verify trace context matches the span
    expect(operationLog.metadata.traceId).toBe(spans[0].spanContext().traceId);
    expect(operationLog.metadata.spanId).toBe(spans[0].spanContext().spanId);
  });

  it('should propagate trace context to error logs during failed operations', async () => {
    // Define a test operation that throws an error
    const testErrorOperation = async () => {
      // Get the current span context for verification
      const spanContext = tracingService.getCurrentSpanContext();
      
      // Log a message before throwing error
      loggerService.log('About to fail', 'TestErrorOperation', { 
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId
      });
      
      throw new Error('Test error');
    };

    // Execute the operation within a span and expect it to throw
    await expect(tracingService.createSpan('error-operation', testErrorOperation))
      .rejects.toThrow('Test error');

    // Verify spans were created and completed with error status
    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe('error-operation');
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);

    // Verify logs contain trace context
    expect(loggerService.logs).toHaveLength(3); // Initialization log + operation log + error log
    
    // Verify operation log
    const operationLog = loggerService.logs[1];
    expect(operationLog.level).toBe('info');
    expect(operationLog.message).toBe('About to fail');
    expect(operationLog.context).toBe('TestErrorOperation');
    
    // Verify error log
    const errorLog = loggerService.logs[2];
    expect(errorLog.level).toBe('error');
    expect(errorLog.message).toContain('Error in span error-operation');
    expect(errorLog.message).toContain('Test error');
    expect(errorLog.context).toBe('AustaTracing');
    
    // Verify trace context in operation log metadata
    expect(operationLog.metadata).toBeDefined();
    expect(operationLog.metadata.traceId).toBeDefined();
    expect(operationLog.metadata.spanId).toBeDefined();
    
    // Verify trace context matches the span
    expect(operationLog.metadata.traceId).toBe(spans[0].spanContext().traceId);
    expect(operationLog.metadata.spanId).toBe(spans[0].spanContext().spanId);
  });

  it('should maintain trace context across nested spans', async () => {
    // Define nested operations
    const innerOperation = async () => {
      const spanContext = tracingService.getCurrentSpanContext();
      loggerService.log('Inner operation executed', 'InnerOperation', { 
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId
      });
      return 'inner success';
    };

    const outerOperation = async () => {
      const outerSpanContext = tracingService.getCurrentSpanContext();
      loggerService.log('Outer operation started', 'OuterOperation', { 
        traceId: outerSpanContext?.traceId,
        spanId: outerSpanContext?.spanId
      });
      
      // Execute inner operation in its own span
      const innerResult = await tracingService.createSpan('inner-operation', innerOperation);
      
      // Verify we're back to the outer span context
      const afterInnerSpanContext = tracingService.getCurrentSpanContext();
      loggerService.log('Outer operation completed', 'OuterOperation', { 
        traceId: afterInnerSpanContext?.traceId,
        spanId: afterInnerSpanContext?.spanId
      });
      
      return { innerResult, outerResult: 'outer success' };
    };

    // Execute the outer operation
    const result = await tracingService.createSpan('outer-operation', outerOperation);

    // Verify the operations were successful
    expect(result).toEqual({ innerResult: 'inner success', outerResult: 'outer success' });

    // Verify spans were created and completed
    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(2);
    
    // Find outer and inner spans
    const outerSpan = spans.find(span => span.name === 'outer-operation');
    const innerSpan = spans.find(span => span.name === 'inner-operation');
    
    expect(outerSpan).toBeDefined();
    expect(innerSpan).toBeDefined();
    expect(outerSpan?.status.code).toBe(SpanStatusCode.OK);
    expect(innerSpan?.status.code).toBe(SpanStatusCode.OK);
    
    // Verify parent-child relationship
    expect(innerSpan?.parentSpanId).toBe(outerSpan?.spanContext().spanId);
    
    // Verify logs contain correct trace context
    expect(loggerService.logs).toHaveLength(4); // Initialization log + 3 operation logs
    
    // Extract operation logs (skipping initialization log)
    const operationLogs = loggerService.logs.slice(1);
    
    // Verify outer operation start log
    expect(operationLogs[0].message).toBe('Outer operation started');
    expect(operationLogs[0].metadata.spanId).toBe(outerSpan?.spanContext().spanId);
    
    // Verify inner operation log
    expect(operationLogs[1].message).toBe('Inner operation executed');
    expect(operationLogs[1].metadata.spanId).toBe(innerSpan?.spanContext().spanId);
    
    // Verify outer operation completion log
    expect(operationLogs[2].message).toBe('Outer operation completed');
    expect(operationLogs[2].metadata.spanId).toBe(outerSpan?.spanContext().spanId);
    
    // Verify all logs have the same trace ID
    const traceId = outerSpan?.spanContext().traceId;
    operationLogs.forEach(log => {
      expect(log.metadata.traceId).toBe(traceId);
    });
  });

  it('should handle multiple concurrent traced operations with correct context isolation', async () => {
    // Define a test operation that returns its span context
    const testOperation = async (operationName: string) => {
      const spanContext = tracingService.getCurrentSpanContext();
      loggerService.log(`Operation ${operationName} executed`, operationName, { 
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId
      });
      return { 
        result: `${operationName} success`,
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId
      };
    };

    // Execute multiple operations concurrently
    const [resultA, resultB, resultC] = await Promise.all([
      tracingService.createSpan('operation-a', () => testOperation('A')),
      tracingService.createSpan('operation-b', () => testOperation('B')),
      tracingService.createSpan('operation-c', () => testOperation('C')),
    ]);

    // Verify each operation was successful
    expect(resultA.result).toBe('A success');
    expect(resultB.result).toBe('B success');
    expect(resultC.result).toBe('C success');

    // Verify spans were created and completed
    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(3);
    
    // Find spans for each operation
    const spanA = spans.find(span => span.name === 'operation-a');
    const spanB = spans.find(span => span.name === 'operation-b');
    const spanC = spans.find(span => span.name === 'operation-c');
    
    expect(spanA).toBeDefined();
    expect(spanB).toBeDefined();
    expect(spanC).toBeDefined();
    
    // Verify each operation has a different trace ID
    expect(spanA?.spanContext().traceId).not.toBe(spanB?.spanContext().traceId);
    expect(spanA?.spanContext().traceId).not.toBe(spanC?.spanContext().traceId);
    expect(spanB?.spanContext().traceId).not.toBe(spanC?.spanContext().traceId);
    
    // Verify logs contain correct trace context
    expect(loggerService.logs).toHaveLength(4); // Initialization log + 3 operation logs
    
    // Extract operation logs (skipping initialization log)
    const operationLogs = loggerService.logs.slice(1);
    
    // Find log for each operation
    const logA = operationLogs.find(log => log.context === 'A');
    const logB = operationLogs.find(log => log.context === 'B');
    const logC = operationLogs.find(log => log.context === 'C');
    
    expect(logA).toBeDefined();
    expect(logB).toBeDefined();
    expect(logC).toBeDefined();
    
    // Verify each log has the correct trace and span ID
    expect(logA?.metadata.traceId).toBe(resultA.traceId);
    expect(logA?.metadata.spanId).toBe(resultA.spanId);
    
    expect(logB?.metadata.traceId).toBe(resultB.traceId);
    expect(logB?.metadata.spanId).toBe(resultB.spanId);
    
    expect(logC?.metadata.traceId).toBe(resultC.traceId);
    expect(logC?.metadata.spanId).toBe(resultC.spanId);
  });

  it('should preserve trace context when handling journey-specific operations', async () => {
    // Define journey-specific operations
    const healthJourneyOperation = async () => {
      const spanContext = tracingService.getCurrentSpanContext();
      loggerService.log('Health metric recorded', 'HealthJourney', { 
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId,
        journeyType: 'health'
      });
      return { journeyType: 'health', status: 'success' };
    };

    const careJourneyOperation = async () => {
      const spanContext = tracingService.getCurrentSpanContext();
      loggerService.log('Care appointment scheduled', 'CareJourney', { 
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId,
        journeyType: 'care'
      });
      return { journeyType: 'care', status: 'success' };
    };

    const planJourneyOperation = async () => {
      const spanContext = tracingService.getCurrentSpanContext();
      loggerService.log('Plan benefit viewed', 'PlanJourney', { 
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId,
        journeyType: 'plan'
      });
      return { journeyType: 'plan', status: 'success' };
    };

    // Execute journey operations
    const healthResult = await tracingService.createSpan('health-journey-operation', healthJourneyOperation);
    const careResult = await tracingService.createSpan('care-journey-operation', careJourneyOperation);
    const planResult = await tracingService.createSpan('plan-journey-operation', planJourneyOperation);

    // Verify operations were successful
    expect(healthResult).toEqual({ journeyType: 'health', status: 'success' });
    expect(careResult).toEqual({ journeyType: 'care', status: 'success' });
    expect(planResult).toEqual({ journeyType: 'plan', status: 'success' });

    // Verify spans were created and completed
    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(3);
    
    // Find spans for each journey
    const healthSpan = spans.find(span => span.name === 'health-journey-operation');
    const careSpan = spans.find(span => span.name === 'care-journey-operation');
    const planSpan = spans.find(span => span.name === 'plan-journey-operation');
    
    expect(healthSpan).toBeDefined();
    expect(careSpan).toBeDefined();
    expect(planSpan).toBeDefined();
    
    // Verify logs contain correct journey-specific context
    expect(loggerService.logs).toHaveLength(4); // Initialization log + 3 journey logs
    
    // Extract journey logs (skipping initialization log)
    const journeyLogs = loggerService.logs.slice(1);
    
    // Find log for each journey
    const healthLog = journeyLogs.find(log => log.context === 'HealthJourney');
    const careLog = journeyLogs.find(log => log.context === 'CareJourney');
    const planLog = journeyLogs.find(log => log.context === 'PlanJourney');
    
    expect(healthLog).toBeDefined();
    expect(careLog).toBeDefined();
    expect(planLog).toBeDefined();
    
    // Verify each log has the correct journey type and trace context
    expect(healthLog?.metadata.journeyType).toBe('health');
    expect(healthLog?.metadata.traceId).toBe(healthSpan?.spanContext().traceId);
    expect(healthLog?.metadata.spanId).toBe(healthSpan?.spanContext().spanId);
    
    expect(careLog?.metadata.journeyType).toBe('care');
    expect(careLog?.metadata.traceId).toBe(careSpan?.spanContext().traceId);
    expect(careLog?.metadata.spanId).toBe(careSpan?.spanContext().spanId);
    
    expect(planLog?.metadata.journeyType).toBe('plan');
    expect(planLog?.metadata.traceId).toBe(planSpan?.spanContext().traceId);
    expect(planLog?.metadata.spanId).toBe(planSpan?.spanContext().spanId);
  });
});
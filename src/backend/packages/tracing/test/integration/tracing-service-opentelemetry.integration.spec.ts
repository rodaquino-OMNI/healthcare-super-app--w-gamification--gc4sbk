import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { 
  Tracer, 
  SpanKind, 
  SpanStatusCode, 
  trace, 
  context,
  ROOT_CONTEXT,
  propagation
} from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

import { TracingService } from '../../src/tracing.service';
import { 
  DEFAULT_SERVICE_NAME,
  DEFAULT_LOGGER_CONTEXT
} from '../../src/constants/defaults';
import { SpanAttributes } from '../../src/utils/span-attributes';

/**
 * Mock implementation of ConfigService for testing
 */
class MockConfigService {
  private config: Record<string, any> = {};

  constructor(config: Record<string, any> = {}) {
    this.config = config;
  }

  get<T>(key: string, defaultValue?: T): T {
    return (this.config[key] !== undefined) ? this.config[key] : defaultValue;
  }
}

/**
 * Mock implementation of LoggerService for testing
 */
class MockLoggerService implements LoggerService {
  logs: any[] = [];
  errors: any[] = [];
  warns: any[] = [];
  debugs: any[] = [];

  log(message: any, ...optionalParams: any[]) {
    this.logs.push({ message, params: optionalParams });
  }

  error(message: any, ...optionalParams: any[]) {
    this.errors.push({ message, params: optionalParams });
  }

  warn(message: any, ...optionalParams: any[]) {
    this.warns.push({ message, params: optionalParams });
  }

  debug(message: any, ...optionalParams: any[]) {
    this.debugs.push({ message, params: optionalParams });
  }

  verbose(message: any, ...optionalParams: any[]) {
    // Not used in this test
  }
}

describe('TracingService OpenTelemetry Integration', () => {
  let tracingService: TracingService;
  let configService: MockConfigService;
  let loggerService: MockLoggerService;
  let memoryExporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;

  beforeEach(async () => {
    // Create an in-memory span exporter for testing
    memoryExporter = new InMemorySpanExporter();
    
    // Create and register a tracer provider with the in-memory exporter
    provider = new NodeTracerProvider();
    provider.addSpanProcessor(new SimpleSpanProcessor(memoryExporter));
    provider.register();
    
    // Create mock services
    configService = new MockConfigService({
      'service.name': 'test-service'
    });
    loggerService = new MockLoggerService();

    // Create a NestJS test module with TracingService
    const moduleRef = await Test.createTestingModule({
      providers: [
        TracingService,
        { provide: ConfigService, useValue: configService },
        { provide: LoggerService, useValue: loggerService },
      ],
    }).compile();

    // Get the TracingService instance
    tracingService = moduleRef.get<TracingService>(TracingService);
  });

  afterEach(() => {
    // Reset the OpenTelemetry API to its default state
    memoryExporter.reset();
    // Unregister the provider to avoid affecting other tests
    trace.disable();
  });

  describe('Initialization', () => {
    it('should initialize with the configured service name', () => {
      expect(loggerService.logs.length).toBeGreaterThan(0);
      expect(loggerService.logs[0].message).toContain('Initialized tracer for test-service');
    });

    it('should use default service name when not configured', async () => {
      // Create a new config service without a service name
      const emptyConfigService = new MockConfigService();
      const newLoggerService = new MockLoggerService();
      
      // Create a new module with the empty config
      const moduleRef = await Test.createTestingModule({
        providers: [
          TracingService,
          { provide: ConfigService, useValue: emptyConfigService },
          { provide: LoggerService, useValue: newLoggerService },
        ],
      }).compile();

      // Get the new TracingService instance
      const newTracingService = moduleRef.get<TracingService>(TracingService);
      
      // Verify it used the default service name
      expect(newLoggerService.logs.length).toBeGreaterThan(0);
      expect(newLoggerService.logs[0].message).toContain(`Initialized tracer for ${DEFAULT_SERVICE_NAME}`);
    });
  });

  describe('createSpan', () => {
    it('should create and complete a span', async () => {
      // Define a test function to execute within the span
      const testFunction = async () => {
        return 'test-result';
      };

      // Create a span and execute the test function
      const result = await tracingService.createSpan('test-span', testFunction);

      // Verify the result
      expect(result).toBe('test-result');

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify a span was created and exported
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('test-span');
      expect(spans[0].status.code).toBe(SpanStatusCode.OK);
    });

    it('should add common attributes to the span', async () => {
      // Create a span with options containing common attributes
      await tracingService.createSpan(
        'span-with-attributes', 
        async () => 'result',
        {
          attributes: { 'custom.attribute': 'custom-value' },
          commonAttributes: {
            userId: 'user-123',
            requestId: 'req-456',
            operation: 'test-operation'
          }
        }
      );

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify the span has the expected attributes
      expect(spans.length).toBe(1);
      expect(spans[0].attributes['custom.attribute']).toBe('custom-value');
      expect(spans[0].attributes[SpanAttributes.CommonAttributeKeys.USER_ID]).toBe('user-123');
      expect(spans[0].attributes[SpanAttributes.CommonAttributeKeys.REQUEST_ID]).toBe('req-456');
      expect(spans[0].attributes[SpanAttributes.CommonAttributeKeys.OPERATION]).toBe('test-operation');
      expect(spans[0].attributes[SpanAttributes.CommonAttributeKeys.SERVICE_NAME]).toBe('test-service');
    });

    it('should add journey-specific attributes to the span', async () => {
      // Create a span with journey context
      await tracingService.createSpan(
        'health-journey-span', 
        async () => 'result',
        {
          journeyContext: {
            journey: 'health',
            journeyId: 'health-journey-123',
            userId: 'user-123'
          }
        }
      );

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify the span has journey attributes
      expect(spans.length).toBe(1);
      expect(spans[0].attributes[SpanAttributes.CommonAttributeKeys.JOURNEY]).toBe('health');
      expect(spans[0].attributes['journey.id']).toBe('health-journey-123');
      expect(spans[0].attributes[SpanAttributes.CommonAttributeKeys.USER_ID]).toBe('user-123');
    });

    it('should set span kind based on options', async () => {
      // Create a span with SERVER kind
      await tracingService.createSpan(
        'server-span', 
        async () => 'result',
        { kind: SpanKind.SERVER }
      );

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify the span has the expected kind
      expect(spans.length).toBe(1);
      expect(spans[0].kind).toBe(SpanKind.SERVER);
    });

    it('should handle errors and set error status', async () => {
      // Define a test function that throws an error
      const errorFunction = async () => {
        throw new Error('Test error');
      };

      // Create a span and execute the error function
      try {
        await tracingService.createSpan('error-span', errorFunction);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Test error');
      }

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify the span has error status and attributes
      expect(spans.length).toBe(1);
      expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
      expect(spans[0].status.message).toBe('Test error');
      expect(spans[0].events.length).toBe(1); // Should have an exception event
      expect(spans[0].events[0].name).toBe('exception');
    });
  });

  describe('Nested spans and context propagation', () => {
    it('should create nested spans with parent-child relationship', async () => {
      // Create a parent span with nested child span
      await tracingService.createSpan('parent-span', async () => {
        // Create a child span within the parent span context
        await tracingService.createSpan('child-span', async () => {
          return 'child-result';
        });
        return 'parent-result';
      });

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify two spans were created
      expect(spans.length).toBe(2);
      
      // Find parent and child spans
      const childSpan = spans.find(span => span.name === 'child-span');
      const parentSpan = spans.find(span => span.name === 'parent-span');
      
      expect(childSpan).toBeDefined();
      expect(parentSpan).toBeDefined();
      
      // Verify parent-child relationship
      expect(childSpan.parentSpanId).toEqual(parentSpan.spanContext().spanId);
    });

    it('should maintain trace context across async operations', async () => {
      // Create a span with async operations
      await tracingService.createSpan('async-parent-span', async () => {
        // Simulate async operation with setTimeout
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Create a child span after the async operation
        await tracingService.createSpan('async-child-span', async () => {
          return 'async-child-result';
        });
        
        return 'async-parent-result';
      });

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify two spans were created
      expect(spans.length).toBe(2);
      
      // Find parent and child spans
      const childSpan = spans.find(span => span.name === 'async-child-span');
      const parentSpan = spans.find(span => span.name === 'async-parent-span');
      
      expect(childSpan).toBeDefined();
      expect(parentSpan).toBeDefined();
      
      // Verify parent-child relationship is maintained across async operations
      expect(childSpan.parentSpanId).toEqual(parentSpan.spanContext().spanId);
      
      // Verify both spans have the same trace ID
      expect(childSpan.spanContext().traceId).toEqual(parentSpan.spanContext().traceId);
    });
  });

  describe('getCurrentSpan and span manipulation', () => {
    it('should get the current active span', async () => {
      let currentSpan;
      
      // Create a span and get the current span within it
      await tracingService.createSpan('test-current-span', async () => {
        currentSpan = tracingService.getCurrentSpan();
        return 'result';
      });

      // Verify the current span was retrieved
      expect(currentSpan).toBeDefined();
      expect(currentSpan.name).toBe('test-current-span');
      
      // Verify no current span outside the context
      const outsideSpan = tracingService.getCurrentSpan();
      expect(outsideSpan).toBeUndefined();
    });

    it('should add events to the current span', async () => {
      // Create a span and add events to it
      await tracingService.createSpan('span-with-events', async () => {
        tracingService.addEvent('test-event', { eventKey: 'event-value' });
        return 'result';
      });

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify the span has the event
      expect(spans.length).toBe(1);
      expect(spans[0].events.length).toBe(1);
      expect(spans[0].events[0].name).toBe('test-event');
      expect(spans[0].events[0].attributes['eventKey']).toBe('event-value');
    });

    it('should set attributes on the current span', async () => {
      // Create a span and set attributes on it
      await tracingService.createSpan('span-with-set-attributes', async () => {
        tracingService.setAttributes({
          'dynamic.attribute': 'dynamic-value',
          'count': 42
        });
        return 'result';
      });

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify the span has the attributes
      expect(spans.length).toBe(1);
      expect(spans[0].attributes['dynamic.attribute']).toBe('dynamic-value');
      expect(spans[0].attributes['count']).toBe(42);
    });
  });

  describe('Context propagation', () => {
    it('should inject and extract trace context', async () => {
      let traceId;
      let spanId;
      
      // Create a span and inject its context into a carrier
      await tracingService.createSpan('context-injection-span', async () => {
        const currentSpan = tracingService.getCurrentSpan();
        const spanContext = currentSpan.spanContext();
        traceId = spanContext.traceId;
        spanId = spanContext.spanId;
        
        // Create a carrier object (like HTTP headers)
        const carrier: Record<string, string> = {};
        
        // Inject the current context into the carrier
        tracingService.injectContext(carrier);
        
        // Verify the carrier now contains trace context
        expect(carrier['traceparent']).toBeDefined();
        expect(carrier['traceparent']).toContain(traceId);
        
        // Extract the context from the carrier
        const extractedContext = tracingService.extractContext(carrier);
        
        // Create a child span using the extracted context
        await trace.with(extractedContext, async () => {
          await tracingService.createSpan('extracted-context-span', async () => {
            return 'extracted-result';
          });
        });
        
        return 'injection-result';
      });

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify two spans were created
      expect(spans.length).toBe(2);
      
      // Find the spans
      const parentSpan = spans.find(span => span.name === 'context-injection-span');
      const childSpan = spans.find(span => span.name === 'extracted-context-span');
      
      expect(parentSpan).toBeDefined();
      expect(childSpan).toBeDefined();
      
      // Verify parent-child relationship
      expect(childSpan.parentSpanId).toEqual(parentSpan.spanContext().spanId);
      
      // Verify both spans have the same trace ID
      expect(childSpan.spanContext().traceId).toEqual(traceId);
    });

    it('should create a correlation ID from trace context', async () => {
      let correlationId;
      
      // Create a span and get correlation ID within it
      await tracingService.createSpan('correlation-span', async () => {
        correlationId = tracingService.getCorrelationId();
        return 'result';
      });

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify the correlation ID matches the trace ID
      expect(spans.length).toBe(1);
      expect(correlationId).toEqual(spans[0].spanContext().traceId);
    });

    it('should get correlation info from the current span', async () => {
      let correlationInfo;
      
      // Create a span and get correlation info within it
      await tracingService.createSpan('correlation-info-span', async () => {
        correlationInfo = tracingService.getCorrelationInfo();
        return 'result';
      });

      // Get the exported spans
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify the correlation info contains trace and span IDs
      expect(spans.length).toBe(1);
      expect(correlationInfo).toBeDefined();
      expect(correlationInfo['trace_id']).toEqual(spans[0].spanContext().traceId);
      expect(correlationInfo['span_id']).toEqual(spans[0].spanContext().spanId);
    });
  });

  describe('Error handling', () => {
    it('should handle errors in span creation', async () => {
      // Mock the tracer to throw an error when startSpan is called
      const originalTracer = (tracingService as any).tracer;
      (tracingService as any).tracer = {
        startSpan: jest.fn().mockImplementation(() => {
          throw new Error('Tracer error');
        })
      };

      // Attempt to create a span with the failing tracer
      try {
        await tracingService.createSpan('error-span', async () => 'result');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toContain('Tracer error');
      }

      // Verify the error was logged
      expect(loggerService.errors.length).toBeGreaterThan(0);
      expect(loggerService.errors[0].message).toContain('Error in span error-span');

      // Restore the original tracer
      (tracingService as any).tracer = originalTracer;
    });

    it('should handle errors in context propagation', async () => {
      // Mock the propagation API to throw an error
      const originalInject = propagation.inject;
      propagation.inject = jest.fn().mockImplementation(() => {
        throw new Error('Propagation error');
      });

      // Attempt to inject context with the failing propagation
      try {
        tracingService.injectContext({});
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toContain('Propagation error');
      }

      // Verify the error was logged
      expect(loggerService.errors.length).toBeGreaterThan(0);
      expect(loggerService.errors[0].message).toContain('Failed to inject trace context');

      // Restore the original propagation
      propagation.inject = originalInject;
    });
  });
});
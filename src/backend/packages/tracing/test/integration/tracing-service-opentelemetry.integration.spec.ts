import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { TracingService } from '../../src/tracing.service';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { trace, context, SpanStatusCode, SpanKind, Span } from '@opentelemetry/api';
import { JourneyContext } from '../../src/interfaces/journey-context.interface';
import { SpanAttributes } from '../../src/interfaces/span-attributes.interface';
import { SPAN_ATTRIBUTE_KEYS } from '../../src/constants/span-attributes';

describe('TracingService OpenTelemetry Integration', () => {
  let tracingService: TracingService;
  let provider: NodeTracerProvider;
  let memoryExporter: InMemorySpanExporter;
  let module: TestingModule;

  beforeEach(async () => {
    // Create an in-memory span exporter for testing
    memoryExporter = new InMemorySpanExporter();
    
    // Create a tracer provider with the memory exporter
    provider = new NodeTracerProvider();
    provider.addSpanProcessor(new SimpleSpanProcessor(memoryExporter));
    provider.register();

    // Create a test module with the TracingService and its dependencies
    module = await Test.createTestingModule({
      providers: [
        TracingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => {
              if (key === 'service.name') return 'test-service';
              return defaultValue;
            }),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    tracingService = module.get<TracingService>(TracingService);
  });

  afterEach(async () => {
    // Clean up after each test
    memoryExporter.reset();
    await module.close();
  });

  it('should create and complete a span', async () => {
    // Execute a function within a span
    await tracingService.createSpan('test-span', async () => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'test-result';
    });

    // Get the exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Verify that a span was created and exported
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('test-span');
    expect(spans[0].status.code).toBe(SpanStatusCode.OK);
    
    // Verify that the span has a duration (it was properly ended)
    expect(spans[0].endTime).toBeDefined();
    expect(spans[0].endTime).toBeGreaterThan(spans[0].startTime);
  });

  it('should record exceptions in spans', async () => {
    // Define an error to throw
    const testError = new Error('Test error');
    
    // Execute a function that throws an error
    await expect(
      tracingService.createSpan('error-span', async () => {
        throw testError;
      })
    ).rejects.toThrow(testError);

    // Get the exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Verify that a span was created and exported
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('error-span');
    
    // Verify that the span has an error status
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    
    // Verify that the span has events for the exception
    const events = spans[0].events;
    expect(events.length).toBeGreaterThan(0);
    
    // Find the exception event
    const exceptionEvent = events.find(event => event.name === 'exception');
    expect(exceptionEvent).toBeDefined();
    
    // Verify the exception details
    const attributes = exceptionEvent?.attributes;
    expect(attributes?.['exception.message']).toBe('Test error');
    expect(attributes?.['exception.type']).toBe('Error');
  });

  it('should support nested spans with proper parent-child relationships', async () => {
    // Execute a function with nested spans
    await tracingService.createSpan('parent-span', async () => {
      // Simulate some work in the parent span
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Create a child span
      return await tracingService.createSpan('child-span', async () => {
        // Simulate some work in the child span
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'nested-result';
      });
    });

    // Get the exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Verify that two spans were created and exported
    expect(spans.length).toBe(2);
    
    // Find the parent and child spans
    const parentSpan = spans.find(span => span.name === 'parent-span');
    const childSpan = spans.find(span => span.name === 'child-span');
    
    expect(parentSpan).toBeDefined();
    expect(childSpan).toBeDefined();
    
    // Verify the parent-child relationship
    expect(childSpan?.parentSpanId).toBe(parentSpan?.spanContext().spanId);
    
    // Verify that both spans have a duration (they were properly ended)
    expect(parentSpan?.endTime).toBeDefined();
    expect(childSpan?.endTime).toBeDefined();
    
    // Verify that the parent span encompasses the child span
    expect(parentSpan?.startTime).toBeLessThanOrEqual(childSpan?.startTime as number);
    expect(parentSpan?.endTime).toBeGreaterThanOrEqual(childSpan?.endTime as number);
  });

  it('should add custom attributes to spans', async () => {
    // Create a span with custom attributes using the OpenTelemetry API directly
    await tracingService.createSpan('attribute-span', async () => {
      const currentSpan = trace.getSpan(context.active());
      expect(currentSpan).toBeDefined();
      
      // Add custom attributes to the span
      currentSpan?.setAttribute('custom.attribute', 'test-value');
      currentSpan?.setAttribute('custom.number', 42);
      
      // Add journey-specific attributes
      currentSpan?.setAttribute(SPAN_ATTRIBUTE_KEYS.JOURNEY_TYPE, 'health');
      currentSpan?.setAttribute(SPAN_ATTRIBUTE_KEYS.USER_ID, 'user-123');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Get the exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Verify that a span was created and exported
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('attribute-span');
    
    // Verify the custom attributes
    const attributes = spans[0].attributes;
    expect(attributes['custom.attribute']).toBe('test-value');
    expect(attributes['custom.number']).toBe(42);
    expect(attributes[SPAN_ATTRIBUTE_KEYS.JOURNEY_TYPE]).toBe('health');
    expect(attributes[SPAN_ATTRIBUTE_KEYS.USER_ID]).toBe('user-123');
  });

  it('should properly time span execution', async () => {
    const sleepTime = 50; // ms
    
    // Execute a function with a known delay
    await tracingService.createSpan('timed-span', async () => {
      await new Promise(resolve => setTimeout(resolve, sleepTime));
    });

    // Get the exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Verify that a span was created and exported
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('timed-span');
    
    // Calculate the span duration in milliseconds
    const durationMs = (spans[0].endTime - spans[0].startTime) / 1000000; // Convert nanoseconds to milliseconds
    
    // Verify that the span duration is at least the sleep time
    // We use a lower bound slightly less than the sleep time to account for timing variations
    expect(durationMs).toBeGreaterThanOrEqual(sleepTime * 0.9);
  });

  it('should integrate with different OpenTelemetry exporters', async () => {
    // Create a second in-memory exporter
    const secondExporter = new InMemorySpanExporter();
    provider.addSpanProcessor(new SimpleSpanProcessor(secondExporter));
    
    // Execute a function within a span
    await tracingService.createSpan('multi-exporter-span', async () => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Get the exported spans from both exporters
    const spansFromFirstExporter = memoryExporter.getFinishedSpans();
    const spansFromSecondExporter = secondExporter.getFinishedSpans();
    
    // Verify that both exporters received the span
    expect(spansFromFirstExporter.length).toBe(1);
    expect(spansFromSecondExporter.length).toBe(1);
    
    // Verify that both exporters received the same span
    expect(spansFromFirstExporter[0].name).toBe('multi-exporter-span');
    expect(spansFromSecondExporter[0].name).toBe('multi-exporter-span');
    expect(spansFromFirstExporter[0].spanContext().traceId).toBe(spansFromSecondExporter[0].spanContext().traceId);
    expect(spansFromFirstExporter[0].spanContext().spanId).toBe(spansFromSecondExporter[0].spanContext().spanId);
  });

  it('should support business-relevant span annotations for journey context', async () => {
    // Define a journey context
    const journeyContext: JourneyContext = {
      journeyType: 'health',
      userId: 'user-456',
      sessionId: 'session-789',
      correlationId: 'correlation-abc',
    };
    
    // Execute a function within a span with journey context
    await tracingService.createSpan('journey-span', async () => {
      const currentSpan = trace.getSpan(context.active());
      expect(currentSpan).toBeDefined();
      
      // Add journey context attributes
      currentSpan?.setAttribute(SPAN_ATTRIBUTE_KEYS.JOURNEY_TYPE, journeyContext.journeyType);
      currentSpan?.setAttribute(SPAN_ATTRIBUTE_KEYS.USER_ID, journeyContext.userId);
      currentSpan?.setAttribute(SPAN_ATTRIBUTE_KEYS.SESSION_ID, journeyContext.sessionId);
      currentSpan?.setAttribute(SPAN_ATTRIBUTE_KEYS.CORRELATION_ID, journeyContext.correlationId);
      
      // Add health journey specific attributes
      currentSpan?.setAttribute(SPAN_ATTRIBUTE_KEYS.HEALTH_METRIC_TYPE, 'heart_rate');
      currentSpan?.setAttribute(SPAN_ATTRIBUTE_KEYS.HEALTH_METRIC_VALUE, 75);
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Get the exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Verify that a span was created and exported
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('journey-span');
    
    // Verify the journey context attributes
    const attributes = spans[0].attributes;
    expect(attributes[SPAN_ATTRIBUTE_KEYS.JOURNEY_TYPE]).toBe(journeyContext.journeyType);
    expect(attributes[SPAN_ATTRIBUTE_KEYS.USER_ID]).toBe(journeyContext.userId);
    expect(attributes[SPAN_ATTRIBUTE_KEYS.SESSION_ID]).toBe(journeyContext.sessionId);
    expect(attributes[SPAN_ATTRIBUTE_KEYS.CORRELATION_ID]).toBe(journeyContext.correlationId);
    
    // Verify the health journey specific attributes
    expect(attributes[SPAN_ATTRIBUTE_KEYS.HEALTH_METRIC_TYPE]).toBe('heart_rate');
    expect(attributes[SPAN_ATTRIBUTE_KEYS.HEALTH_METRIC_VALUE]).toBe(75);
  });
});
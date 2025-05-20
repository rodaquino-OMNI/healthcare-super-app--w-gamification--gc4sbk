import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SpanKind, SpanStatusCode, trace, context, ROOT_CONTEXT } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import { TracingService } from '../../src/tracing.service';
import { MockLoggerService } from '../mocks/mock-logger.service';
import { errorScenarios, healthJourneyContext, careJourneyContext, planJourneyContext } from '../fixtures/error-scenarios';
import { 
  healthMetricsAttributes, 
  careAppointmentAttributes, 
  planClaimAttributes,
  combineAttributes,
  commonAttributes
} from '../fixtures/span-attributes';

/**
 * Integration tests for TracingService with OpenTelemetry.
 * 
 * These tests verify the correct interaction between TracingService and the OpenTelemetry API,
 * ensuring that spans are properly created, annotated, and completed with the expected attributes
 * and timing.
 */
describe('TracingService OpenTelemetry Integration', () => {
  let tracingService: TracingService;
  let mockLogger: MockLoggerService;
  let inMemoryExporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;
  let configService: ConfigService;
  
  beforeEach(async () => {
    // Create an in-memory span exporter for testing
    inMemoryExporter = new InMemorySpanExporter();
    
    // Set up a tracer provider with the in-memory exporter
    provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'test-service',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'test',
      }),
    });
    
    // Add the in-memory exporter to the provider
    provider.addSpanProcessor(new SimpleSpanProcessor(inMemoryExporter));
    
    // Register the provider with the OpenTelemetry API
    provider.register();
    
    // Create a mock logger for testing
    mockLogger = new MockLoggerService();
    
    // Create a test module with the TracingService
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            service: {
              name: 'test-service',
              version: '1.0.0',
            },
          })],
        }),
      ],
      providers: [
        {
          provide: 'LoggerService',
          useValue: mockLogger,
        },
        TracingService,
      ],
    }).compile();
    
    // Get the TracingService and ConfigService instances
    tracingService = module.get<TracingService>(TracingService);
    configService = module.get<ConfigService>(ConfigService);
  });
  
  afterEach(() => {
    // Clear all spans from the exporter
    inMemoryExporter.reset();
    // Clear all logs from the logger
    mockLogger.clearLogs();
  });
  
  describe('Initialization', () => {
    it('should initialize with the correct service name from config', () => {
      // Verify that the logger was called with the correct service name
      expect(mockLogger.hasLoggedMessage('log', 'Initialized tracer for test-service')).toBe(true);
      
      // Verify that the tracer was created
      expect(tracingService.getTracer()).toBeDefined();
    });
    
    it('should handle initialization errors gracefully', async () => {
      // Create a test module with a configuration that will cause an error
      const errorModule: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({})], // Empty config will cause service name to be undefined
          }),
        ],
        providers: [
          {
            provide: 'LoggerService',
            useValue: mockLogger,
          },
          TracingService,
        ],
      }).compile();
      
      // Get the TracingService instance
      const errorTracingService = errorModule.get<TracingService>(TracingService);
      
      // Verify that the service was created despite the error
      expect(errorTracingService).toBeDefined();
      
      // Verify that the logger was called with the default service name
      expect(mockLogger.hasLoggedMessage('log', 'Initialized tracer for austa-service')).toBe(true);
    });
  });
  
  describe('Span Creation and Completion', () => {
    it('should create and complete a span with the correct name', async () => {
      // Define a test operation name
      const operationName = 'test-operation';
      
      // Create a span and execute a function within it
      await tracingService.createSpan(operationName, async () => {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the correct name
      expect(spans[0].name).toBe(operationName);
      
      // Verify that the span was completed (has an end time)
      expect(spans[0].endTime).toBeDefined();
      
      // Verify that the span has the correct status
      expect(spans[0].status.code).toBe(SpanStatusCode.OK);
    });
    
    it('should create spans with different kinds based on options', async () => {
      // Create a span with the default kind (INTERNAL)
      await tracingService.createSpan('internal-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      });
      
      // Create a span with the SERVER kind
      await tracingService.createSpan('server-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, { kind: SpanKind.SERVER });
      
      // Create a span with the CLIENT kind
      await tracingService.createSpan('client-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, { kind: SpanKind.CLIENT });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that three spans were created
      expect(spans.length).toBe(3);
      
      // Find each span by name
      const internalSpan = spans.find(span => span.name === 'internal-operation');
      const serverSpan = spans.find(span => span.name === 'server-operation');
      const clientSpan = spans.find(span => span.name === 'client-operation');
      
      // Verify that each span has the correct kind
      expect(internalSpan.kind).toBe(SpanKind.INTERNAL);
      expect(serverSpan.kind).toBe(SpanKind.SERVER);
      expect(clientSpan.kind).toBe(SpanKind.CLIENT);
    });
    
    it('should measure the duration of operations accurately', async () => {
      // Define a test operation duration
      const operationDuration = 50; // milliseconds
      
      // Create a span and execute a function with a known duration
      await tracingService.createSpan('timed-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, operationDuration));
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Calculate the span duration in milliseconds
      const startTimeMs = spans[0].startTime[0] * 1000 + spans[0].startTime[1] / 1000000;
      const endTimeMs = spans[0].endTime[0] * 1000 + spans[0].endTime[1] / 1000000;
      const durationMs = endTimeMs - startTimeMs;
      
      // Verify that the span duration is at least the operation duration
      // (allowing for some overhead)
      expect(durationMs).toBeGreaterThanOrEqual(operationDuration);
      
      // Verify that the span duration is not excessively longer than the operation duration
      // (allowing for some overhead, but not more than 100ms)
      expect(durationMs).toBeLessThan(operationDuration + 100);
    });
  });
  
  describe('Span Attributes', () => {
    it('should add common attributes to spans', async () => {
      // Create a span with common attributes
      await tracingService.createSpan('attributed-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, {
        userId: 'user-123',
        requestId: 'req-456',
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the common attributes
      expect(spans[0].attributes['user.id']).toBe('user-123');
      expect(spans[0].attributes['request.id']).toBe('req-456');
    });
    
    it('should add custom attributes to spans', async () => {
      // Create a span with custom attributes
      await tracingService.createSpan('custom-attributes', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, {
        attributes: {
          'custom.string': 'value',
          'custom.number': 123,
          'custom.boolean': true,
        },
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the custom attributes
      expect(spans[0].attributes['custom.string']).toBe('value');
      expect(spans[0].attributes['custom.number']).toBe(123);
      expect(spans[0].attributes['custom.boolean']).toBe(true);
    });
    
    it('should add journey-specific attributes to spans', async () => {
      // Create spans for different journeys
      await tracingService.createJourneySpan('health', 'getMetrics', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, {
        userId: 'user-123',
        attributes: healthMetricsAttributes,
      });
      
      await tracingService.createJourneySpan('care', 'bookAppointment', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, {
        userId: 'user-456',
        attributes: careAppointmentAttributes,
      });
      
      await tracingService.createJourneySpan('plan', 'submitClaim', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, {
        userId: 'user-789',
        attributes: planClaimAttributes,
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that three spans were created
      expect(spans.length).toBe(3);
      
      // Find each span by name
      const healthSpan = spans.find(span => span.name === 'health.getMetrics');
      const careSpan = spans.find(span => span.name === 'care.bookAppointment');
      const planSpan = spans.find(span => span.name === 'plan.submitClaim');
      
      // Verify that each span has the correct journey attributes
      expect(healthSpan.attributes['journey.context']).toBe('health');
      expect(healthSpan.attributes['austa.journey']).toBe('health');
      expect(healthSpan.attributes['austa.journey.context']).toBe('metrics');
      
      expect(careSpan.attributes['journey.context']).toBe('care');
      expect(careSpan.attributes['austa.journey']).toBe('care');
      expect(careSpan.attributes['austa.journey.context']).toBe('appointments');
      
      expect(planSpan.attributes['journey.context']).toBe('plan');
      expect(planSpan.attributes['austa.journey']).toBe('plan');
      expect(planSpan.attributes['austa.journey.context']).toBe('claim');
    });
    
    it('should add attributes to the current span', async () => {
      // Create a span and add attributes to the current span within it
      await tracingService.createSpan('current-span-attributes', async () => {
        // Add a single attribute
        tracingService.addAttributeToCurrentSpan('single.attribute', 'value');
        
        // Add multiple attributes
        tracingService.addAttributesToCurrentSpan({
          'multi.attribute1': 'value1',
          'multi.attribute2': 'value2',
        });
        
        await new Promise(resolve => setTimeout(resolve, 5));
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the added attributes
      expect(spans[0].attributes['single.attribute']).toBe('value');
      expect(spans[0].attributes['multi.attribute1']).toBe('value1');
      expect(spans[0].attributes['multi.attribute2']).toBe('value2');
    });
  });
  
  describe('Nested Spans and Context Propagation', () => {
    it('should create nested spans with proper parent-child relationships', async () => {
      // Create a parent span
      await tracingService.createSpan('parent-operation', async () => {
        // Create a child span within the parent span
        await tracingService.createSpan('child-operation-1', async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
        
        // Create another child span within the parent span
        await tracingService.createSpan('child-operation-2', async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that three spans were created
      expect(spans.length).toBe(3);
      
      // Find each span by name
      const parentSpan = spans.find(span => span.name === 'parent-operation');
      const childSpan1 = spans.find(span => span.name === 'child-operation-1');
      const childSpan2 = spans.find(span => span.name === 'child-operation-2');
      
      // Verify that the parent span has no parent
      expect(parentSpan.parentSpanId).toBeUndefined();
      
      // Verify that the child spans have the parent span as their parent
      expect(childSpan1.parentSpanId).toBe(parentSpan.spanContext().spanId);
      expect(childSpan2.parentSpanId).toBe(parentSpan.spanContext().spanId);
      
      // Verify that all spans have the same trace ID
      const traceId = parentSpan.spanContext().traceId;
      expect(childSpan1.spanContext().traceId).toBe(traceId);
      expect(childSpan2.spanContext().traceId).toBe(traceId);
    });
    
    it('should maintain context across async operations', async () => {
      // Create a span with async operations
      await tracingService.createSpan('async-parent', async () => {
        // Create a promise that will be resolved after a delay
        const promise = new Promise<void>(resolve => {
          setTimeout(() => {
            // Create a child span within the async operation
            tracingService.createSpan('async-child', async () => {
              // Do some work
              await new Promise(innerResolve => setTimeout(innerResolve, 5));
            }).then(() => resolve());
          }, 10);
        });
        
        // Wait for the promise to resolve
        await promise;
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that two spans were created
      expect(spans.length).toBe(2);
      
      // Find each span by name
      const parentSpan = spans.find(span => span.name === 'async-parent');
      const childSpan = spans.find(span => span.name === 'async-child');
      
      // Verify that the child span has the parent span as its parent
      expect(childSpan.parentSpanId).toBe(parentSpan.spanContext().spanId);
      
      // Verify that both spans have the same trace ID
      expect(childSpan.spanContext().traceId).toBe(parentSpan.spanContext().traceId);
    });
    
    it('should create spans with explicit context', async () => {
      // Create a root context with a span
      const rootSpan = tracingService.getTracer().startSpan('root-span');
      const rootContext = trace.setSpan(ROOT_CONTEXT, rootSpan);
      
      // Execute a function with the root context
      await context.with(rootContext, async () => {
        // Create a child span that should inherit the root context
        await tracingService.createSpan('context-child', async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      });
      
      // End the root span
      rootSpan.end();
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that two spans were created
      expect(spans.length).toBe(2);
      
      // Find each span by name
      const exportedRootSpan = spans.find(span => span.name === 'root-span');
      const childSpan = spans.find(span => span.name === 'context-child');
      
      // Verify that the child span has the root span as its parent
      expect(childSpan.parentSpanId).toBe(exportedRootSpan.spanContext().spanId);
      
      // Verify that both spans have the same trace ID
      expect(childSpan.spanContext().traceId).toBe(exportedRootSpan.spanContext().traceId);
    });
  });
  
  describe('Error Handling', () => {
    it('should record exceptions and set error status on spans', async () => {
      // Create a span that will throw an error
      try {
        await tracingService.createSpan('error-operation', async () => {
          throw new Error('Test error');
        });
      } catch (error) {
        // Expected error, do nothing
      }
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the error status
      expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
      
      // Verify that the span has an exception event
      const exceptionEvents = spans[0].events.filter(event => event.name === 'exception');
      expect(exceptionEvents.length).toBe(1);
      
      // Verify that the exception event has the correct attributes
      const exceptionEvent = exceptionEvents[0];
      expect(exceptionEvent.attributes['exception.type']).toBe('Error');
      expect(exceptionEvent.attributes['exception.message']).toBe('Test error');
    });
    
    it('should record exceptions with the recordExceptionInCurrentSpan method', async () => {
      // Create a span and record an exception within it
      await tracingService.createSpan('record-exception', async () => {
        const error = new Error('Recorded error');
        tracingService.recordExceptionInCurrentSpan(error, 'Custom error message');
        
        // Don't throw the error, just record it
        await new Promise(resolve => setTimeout(resolve, 5));
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the error status
      expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
      expect(spans[0].status.message).toBe('Custom error message');
      
      // Verify that the span has an exception event
      const exceptionEvents = spans[0].events.filter(event => event.name === 'exception');
      expect(exceptionEvents.length).toBe(1);
      
      // Verify that the exception event has the correct attributes
      const exceptionEvent = exceptionEvents[0];
      expect(exceptionEvent.attributes['exception.type']).toBe('Error');
      expect(exceptionEvent.attributes['exception.message']).toBe('Recorded error');
    });
    
    it('should handle complex error scenarios with journey context', async () => {
      // Get a test error scenario
      const errorScenario = errorScenarios[0]; // validation_error
      
      // Create a span that will throw the error
      try {
        await tracingService.createJourneySpan(
          errorScenario.journeyContext.journeyType,
          'validateInput',
          async () => {
            throw errorScenario.error;
          },
          {
            userId: errorScenario.journeyContext.userId,
            requestId: errorScenario.journeyContext.requestId,
          }
        );
      } catch (error) {
        // Expected error, do nothing
      }
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the error status
      expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
      
      // Verify that the span has the journey context attributes
      expect(spans[0].attributes['journey.context']).toBe(errorScenario.journeyContext.journeyType);
      expect(spans[0].attributes['user.id']).toBe(errorScenario.journeyContext.userId);
      expect(spans[0].attributes['request.id']).toBe(errorScenario.journeyContext.requestId);
      
      // Verify that the span has an exception event
      const exceptionEvents = spans[0].events.filter(event => event.name === 'exception');
      expect(exceptionEvents.length).toBe(1);
      
      // Verify that the exception event has the correct attributes
      const exceptionEvent = exceptionEvents[0];
      expect(exceptionEvent.attributes['exception.type']).toBe(errorScenario.error.name);
      expect(exceptionEvent.attributes['exception.message']).toBe(errorScenario.error.message);
    });
  });
  
  describe('Journey-Specific Tracing', () => {
    it('should create health journey spans with the correct attributes', async () => {
      // Create a health journey span
      await tracingService.createJourneySpan('health', 'getMetrics', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, {
        userId: healthJourneyContext.userId,
        requestId: healthJourneyContext.requestId,
        attributes: healthMetricsAttributes,
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the correct name
      expect(spans[0].name).toBe('health.getMetrics');
      
      // Verify that the span has the health journey attributes
      expect(spans[0].attributes['journey.context']).toBe('health');
      expect(spans[0].attributes['journey.operation']).toBe('getMetrics');
      expect(spans[0].attributes['user.id']).toBe(healthJourneyContext.userId);
      expect(spans[0].attributes['request.id']).toBe(healthJourneyContext.requestId);
      
      // Verify that the span has the health metrics attributes
      expect(spans[0].attributes['austa.journey']).toBe('health');
      expect(spans[0].attributes['austa.journey.context']).toBe('metrics');
      expect(spans[0].attributes['austa.health.metric.type']).toBe('blood_pressure');
    });
    
    it('should create care journey spans with the correct attributes', async () => {
      // Create a care journey span
      await tracingService.createJourneySpan('care', 'bookAppointment', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, {
        userId: careJourneyContext.userId,
        requestId: careJourneyContext.requestId,
        attributes: careAppointmentAttributes,
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the correct name
      expect(spans[0].name).toBe('care.bookAppointment');
      
      // Verify that the span has the care journey attributes
      expect(spans[0].attributes['journey.context']).toBe('care');
      expect(spans[0].attributes['journey.operation']).toBe('bookAppointment');
      expect(spans[0].attributes['user.id']).toBe(careJourneyContext.userId);
      expect(spans[0].attributes['request.id']).toBe(careJourneyContext.requestId);
      
      // Verify that the span has the care appointment attributes
      expect(spans[0].attributes['austa.journey']).toBe('care');
      expect(spans[0].attributes['austa.journey.context']).toBe('appointments');
      expect(spans[0].attributes['austa.care.appointment.id']).toBe('appointment-123456');
    });
    
    it('should create plan journey spans with the correct attributes', async () => {
      // Create a plan journey span
      await tracingService.createJourneySpan('plan', 'submitClaim', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      }, {
        userId: planJourneyContext.userId,
        requestId: planJourneyContext.requestId,
        attributes: planClaimAttributes,
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was created
      expect(spans.length).toBe(1);
      
      // Verify that the span has the correct name
      expect(spans[0].name).toBe('plan.submitClaim');
      
      // Verify that the span has the plan journey attributes
      expect(spans[0].attributes['journey.context']).toBe('plan');
      expect(spans[0].attributes['journey.operation']).toBe('submitClaim');
      expect(spans[0].attributes['user.id']).toBe(planJourneyContext.userId);
      expect(spans[0].attributes['request.id']).toBe(planJourneyContext.requestId);
      
      // Verify that the span has the plan claim attributes
      expect(spans[0].attributes['austa.journey']).toBe('plan');
      expect(spans[0].attributes['austa.journey.context']).toBe('claim');
      expect(spans[0].attributes['austa.plan.claim.id']).toBe('claim-123456');
    });
  });
  
  describe('Performance Measurement', () => {
    it('should measure operation performance within the required threshold', async () => {
      // Define the performance threshold (50ms as per requirements)
      const performanceThreshold = 50; // milliseconds
      
      // Create spans for different operations with varying durations
      const operations = [
        { name: 'fast-operation', duration: 10 },
        { name: 'medium-operation', duration: 30 },
        { name: 'slow-operation', duration: 70 },
      ];
      
      // Execute each operation
      for (const op of operations) {
        await tracingService.createSpan(op.name, async () => {
          await new Promise(resolve => setTimeout(resolve, op.duration));
        }, {
          attributes: {
            'performance.threshold': performanceThreshold,
            'performance.expected': op.duration,
          },
        });
      }
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that three spans were created
      expect(spans.length).toBe(3);
      
      // Calculate the actual durations
      const durations = spans.map(span => {
        const startTimeMs = span.startTime[0] * 1000 + span.startTime[1] / 1000000;
        const endTimeMs = span.endTime[0] * 1000 + span.endTime[1] / 1000000;
        return {
          name: span.name,
          duration: endTimeMs - startTimeMs,
          expected: span.attributes['performance.expected'] as number,
          threshold: span.attributes['performance.threshold'] as number,
        };
      });
      
      // Verify that each operation's duration is close to the expected duration
      for (const duration of durations) {
        // Allow for some overhead in the measurement (10ms)
        expect(duration.duration).toBeGreaterThanOrEqual(duration.expected);
        expect(duration.duration).toBeLessThan(duration.expected + 20);
        
        // Add performance annotations to the test output
        if (duration.duration > duration.threshold) {
          console.log(`Performance warning: ${duration.name} took ${duration.duration}ms, exceeding threshold of ${duration.threshold}ms`);
        }
      }
      
      // Verify that at least one operation exceeds the threshold (the slow one)
      const slowOperation = durations.find(d => d.name === 'slow-operation');
      expect(slowOperation.duration).toBeGreaterThan(slowOperation.threshold);
      
      // Verify that at least one operation is within the threshold (the fast one)
      const fastOperation = durations.find(d => d.name === 'fast-operation');
      expect(fastOperation.duration).toBeLessThan(fastOperation.threshold);
    });
    
    it('should identify performance bottlenecks in nested operations', async () => {
      // Create a parent span with nested operations of varying durations
      await tracingService.createSpan('parent-operation', async () => {
        // Fast child operation
        await tracingService.createSpan('child-fast', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
        
        // Slow child operation (potential bottleneck)
        await tracingService.createSpan('child-slow', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        // Medium child operation
        await tracingService.createSpan('child-medium', async () => {
          await new Promise(resolve => setTimeout(resolve, 30));
        });
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that four spans were created
      expect(spans.length).toBe(4);
      
      // Calculate the durations for each span
      const durations = spans.map(span => {
        const startTimeMs = span.startTime[0] * 1000 + span.startTime[1] / 1000000;
        const endTimeMs = span.endTime[0] * 1000 + span.endTime[1] / 1000000;
        return {
          name: span.name,
          duration: endTimeMs - startTimeMs,
        };
      });
      
      // Find each span by name
      const parentDuration = durations.find(d => d.name === 'parent-operation').duration;
      const fastDuration = durations.find(d => d.name === 'child-fast').duration;
      const slowDuration = durations.find(d => d.name === 'child-slow').duration;
      const mediumDuration = durations.find(d => d.name === 'child-medium').duration;
      
      // Verify that the parent duration is approximately the sum of the child durations
      // (allowing for some overhead)
      const childDurationsSum = fastDuration + slowDuration + mediumDuration;
      expect(parentDuration).toBeGreaterThanOrEqual(childDurationsSum);
      expect(parentDuration).toBeLessThan(childDurationsSum + 50);
      
      // Verify that the slow operation is the bottleneck
      expect(slowDuration).toBeGreaterThan(fastDuration + mediumDuration);
      
      // Calculate the percentage of time spent in each child operation
      const fastPercentage = (fastDuration / parentDuration) * 100;
      const slowPercentage = (slowDuration / parentDuration) * 100;
      const mediumPercentage = (mediumDuration / parentDuration) * 100;
      
      // Verify that the slow operation takes up a significant portion of the parent duration
      expect(slowPercentage).toBeGreaterThan(50); // More than 50% of the parent duration
      
      // Add performance annotations to the test output
      console.log(`Performance analysis: parent=${parentDuration.toFixed(2)}ms, fast=${fastPercentage.toFixed(2)}%, slow=${slowPercentage.toFixed(2)}%, medium=${mediumPercentage.toFixed(2)}%`);
    });
  });
  
  describe('Trace Export', () => {
    it('should export spans to the configured destination', async () => {
      // Create a span
      await tracingService.createSpan('export-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that a span was exported
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('export-test');
    });
    
    it('should export multiple spans in the same trace', async () => {
      // Create a parent span with child spans
      await tracingService.createSpan('export-parent', async () => {
        await tracingService.createSpan('export-child-1', async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
        
        await tracingService.createSpan('export-child-2', async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      });
      
      // Get the exported spans
      const spans = inMemoryExporter.getFinishedSpans();
      
      // Verify that three spans were exported
      expect(spans.length).toBe(3);
      
      // Find each span by name
      const parentSpan = spans.find(span => span.name === 'export-parent');
      const childSpan1 = spans.find(span => span.name === 'export-child-1');
      const childSpan2 = spans.find(span => span.name === 'export-child-2');
      
      // Verify that all spans have the same trace ID
      const traceId = parentSpan.spanContext().traceId;
      expect(childSpan1.spanContext().traceId).toBe(traceId);
      expect(childSpan2.spanContext().traceId).toBe(traceId);
    });
  });
});
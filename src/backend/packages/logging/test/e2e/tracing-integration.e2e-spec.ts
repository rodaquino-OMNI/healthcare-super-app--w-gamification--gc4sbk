import { Test } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { context, trace, SpanStatusCode, SpanKind, Span } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { LoggerModule } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { JourneyType } from '../../src/context/context.constants';
import {
  mockTransport,
  logCapture,
  testApp,
  traceContext,
  journeyContext,
} from './utils';

/**
 * Mock implementation of the TracingService for testing purposes
 */
class MockTracingService {
  private currentTraceId: string | null = null;
  private currentSpanId: string | null = null;

  setCurrentTraceContext(traceId: string, spanId: string): void {
    this.currentTraceId = traceId;
    this.currentSpanId = spanId;
  }

  getCurrentTraceId(): string | null {
    return this.currentTraceId;
  }

  getCurrentSpanId(): string | null {
    return this.currentSpanId;
  }

  clearCurrentTraceContext(): void {
    this.currentTraceId = null;
    this.currentSpanId = null;
  }

  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    // Generate a new trace ID and span ID for this span
    const traceId = traceContext.generateTraceId();
    const spanId = traceContext.generateSpanId();
    
    // Set the current trace context
    this.setCurrentTraceContext(traceId, spanId);
    
    try {
      // Execute the function within the span context
      return await fn();
    } finally {
      // Clear the trace context when the span is complete
      this.clearCurrentTraceContext();
    }
  }
}

/**
 * Test module that provides both logging and tracing services
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({
        logger: {
          level: 'debug',
          tracing: { enabled: true },
          defaultContext: {
            application: 'austa-superapp',
            service: 'test-service',
            environment: 'test',
          },
        },
      })],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        level: configService.get('logger.level', 'info'),
        tracing: { enabled: true },
        defaultContext: configService.get('logger.defaultContext', {}),
      }),
    }),
  ],
  providers: [
    {
      provide: 'TRACING_SERVICE',
      useClass: MockTracingService,
    },
  ],
  exports: ['TRACING_SERVICE'],
})
class TestModule {}

/**
 * Real OpenTelemetry setup for more realistic testing
 */
class OpenTelemetryTestSetup {
  private provider: NodeTracerProvider;
  private exporter: InMemorySpanExporter;
  private tracer: any;

  constructor() {
    // Create an in-memory exporter for testing
    this.exporter = new InMemorySpanExporter();
    
    // Create a tracer provider
    this.provider = new NodeTracerProvider();
    
    // Add the exporter to the provider
    this.provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter));
    
    // Register the provider
    this.provider.register();
    
    // Get a tracer
    this.tracer = trace.getTracer('test-tracer');
  }

  /**
   * Creates a span and executes a function within its context
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
    });
    
    return await context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Gets the current trace ID from the active span
   */
  getCurrentTraceId(): string | undefined {
    const span = trace.getSpan(context.active());
    return span?.spanContext().traceId;
  }

  /**
   * Gets the current span ID from the active span
   */
  getCurrentSpanId(): string | undefined {
    const span = trace.getSpan(context.active());
    return span?.spanContext().spanId;
  }

  /**
   * Gets all captured spans
   */
  getSpans() {
    return this.exporter.getFinishedSpans();
  }

  /**
   * Clears all captured spans
   */
  clearSpans() {
    this.exporter.reset();
  }
}

describe('Tracing Integration with Logging', () => {
  let app: INestApplication;
  let loggerService: LoggerService;
  let mockTracingService: MockTracingService;
  let capturedLogs: LogEntry[];
  let memoryTransport: Transport;
  let otelSetup: OpenTelemetryTestSetup;

  beforeAll(async () => {
    // Create a memory transport to capture logs
    memoryTransport = mockTransport.createMemoryTransport();
    
    // Create the test module
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    // Create the application
    app = moduleRef.createNestApplication();
    await app.init();

    // Get the logger service
    loggerService = moduleRef.get<LoggerService>(LoggerService);
    
    // Add the memory transport to the logger service
    (loggerService as any).transports.push(memoryTransport);

    // Get the tracing service
    mockTracingService = moduleRef.get<MockTracingService>('TRACING_SERVICE');

    // Create the OpenTelemetry setup
    otelSetup = new OpenTelemetryTestSetup();
  });

  beforeEach(() => {
    // Clear captured logs before each test
    capturedLogs = [];
    (memoryTransport as any).logs = capturedLogs;
    
    // Clear any trace context
    mockTracingService.clearCurrentTraceContext();
    
    // Clear OpenTelemetry spans
    otelSetup.clearSpans();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Mock Tracing Service Integration', () => {
    it('should include trace ID in logs when trace context is available', () => {
      // Set up a trace context
      const traceId = 'test-trace-id-12345';
      const spanId = 'test-span-id-67890';
      mockTracingService.setCurrentTraceContext(traceId, spanId);

      // Log a message
      loggerService.log('Test message with trace context');

      // Verify the log includes the trace ID
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].traceId).toBe(traceId);
      expect(capturedLogs[0].spanId).toBe(spanId);
    });

    it('should not include trace ID in logs when trace context is not available', () => {
      // Log a message without setting trace context
      loggerService.log('Test message without trace context');

      // Verify the log does not include a trace ID
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].traceId).toBeUndefined();
      expect(capturedLogs[0].spanId).toBeUndefined();
    });

    it('should maintain trace context across multiple log entries', async () => {
      // Create a span and log within it
      await mockTracingService.createSpan('test-span', async () => {
        // Get the current trace ID and span ID
        const traceId = mockTracingService.getCurrentTraceId();
        const spanId = mockTracingService.getCurrentSpanId();

        // Log multiple messages
        loggerService.log('First message within span');
        loggerService.warn('Warning message within span');
        loggerService.error('Error message within span');

        // Verify all logs have the same trace ID and span ID
        expect(capturedLogs.length).toBe(3);
        capturedLogs.forEach(log => {
          expect(log.traceId).toBe(traceId);
          expect(log.spanId).toBe(spanId);
        });
      });
    });

    it('should include trace context in journey-specific logs', async () => {
      // Create a span and log within it
      await mockTracingService.createSpan('journey-span', async () => {
        // Get the current trace ID and span ID
        const traceId = mockTracingService.getCurrentTraceId();
        const spanId = mockTracingService.getCurrentSpanId();

        // Create journey-specific loggers
        const healthLogger = loggerService.withJourneyContext({ journeyType: JourneyType.HEALTH });
        const careLogger = loggerService.withJourneyContext({ journeyType: JourneyType.CARE });
        const planLogger = loggerService.withJourneyContext({ journeyType: JourneyType.PLAN });

        // Log messages with each logger
        healthLogger.log('Health journey log');
        careLogger.log('Care journey log');
        planLogger.log('Plan journey log');

        // Verify all logs have the same trace ID and span ID
        expect(capturedLogs.length).toBe(3);
        capturedLogs.forEach(log => {
          expect(log.traceId).toBe(traceId);
          expect(log.spanId).toBe(spanId);
        });

        // Verify journey context is preserved
        expect(capturedLogs[0].context.journeyType).toBe(JourneyType.HEALTH);
        expect(capturedLogs[1].context.journeyType).toBe(JourneyType.CARE);
        expect(capturedLogs[2].context.journeyType).toBe(JourneyType.PLAN);
      });
    });

    it('should handle errors within traced context', async () => {
      // Create a span that will contain an error
      try {
        await mockTracingService.createSpan('error-span', async () => {
          // Get the current trace ID and span ID
          const traceId = mockTracingService.getCurrentTraceId();
          const spanId = mockTracingService.getCurrentSpanId();

          // Log a message before the error
          loggerService.log('Message before error');

          // Throw an error
          throw new Error('Test error in span');
        });
      } catch (error) {
        // Log the error after the span has completed
        loggerService.error('Caught error', error);
      }

      // Verify logs
      expect(capturedLogs.length).toBe(2);
      
      // First log should have trace context
      expect(capturedLogs[0].traceId).toBeDefined();
      expect(capturedLogs[0].spanId).toBeDefined();
      
      // Error log should not have trace context since it's outside the span
      expect(capturedLogs[1].traceId).toBeUndefined();
      expect(capturedLogs[1].spanId).toBeUndefined();
      expect(capturedLogs[1].level).toBe(LogLevel.ERROR);
      expect(capturedLogs[1].message).toBe('Caught error');
    });
  });

  describe('OpenTelemetry Integration', () => {
    it('should capture trace context from OpenTelemetry', async () => {
      // Create a real OpenTelemetry span
      await otelSetup.createSpan('otel-test-span', async () => {
        // Get the current trace ID and span ID from OpenTelemetry
        const traceId = otelSetup.getCurrentTraceId();
        const spanId = otelSetup.getCurrentSpanId();

        // Manually set the trace context in our mock service to simulate integration
        mockTracingService.setCurrentTraceContext(traceId, spanId);

        // Log a message
        loggerService.log('Message within OpenTelemetry span');

        // Verify the log includes the trace ID and span ID
        expect(capturedLogs.length).toBe(1);
        expect(capturedLogs[0].traceId).toBe(traceId);
        expect(capturedLogs[0].spanId).toBe(spanId);
      });

      // Verify that the span was created and completed
      const spans = otelSetup.getSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('otel-test-span');
    });

    it('should handle nested spans with correct context', async () => {
      // Create a parent span
      await otelSetup.createSpan('parent-span', async () => {
        const parentTraceId = otelSetup.getCurrentTraceId();
        const parentSpanId = otelSetup.getCurrentSpanId();

        // Set the trace context
        mockTracingService.setCurrentTraceContext(parentTraceId, parentSpanId);

        // Log in parent span
        loggerService.log('Parent span log');

        // Create a child span
        await otelSetup.createSpan('child-span', async () => {
          const childTraceId = otelSetup.getCurrentTraceId();
          const childSpanId = otelSetup.getCurrentSpanId();

          // Set the trace context for the child span
          mockTracingService.setCurrentTraceContext(childTraceId, childSpanId);

          // Log in child span
          loggerService.log('Child span log');

          // Verify child span log
          expect(capturedLogs.length).toBe(2);
          expect(capturedLogs[1].traceId).toBe(childTraceId);
          expect(capturedLogs[1].spanId).toBe(childSpanId);
          
          // Trace ID should be the same for parent and child, but span IDs should differ
          expect(childTraceId).toBe(parentTraceId);
          expect(childSpanId).not.toBe(parentSpanId);
        });
      });

      // Verify spans
      const spans = otelSetup.getSpans();
      expect(spans.length).toBe(2);
      expect(spans.some(span => span.name === 'parent-span')).toBe(true);
      expect(spans.some(span => span.name === 'child-span')).toBe(true);
    });

    it('should record errors in spans and logs', async () => {
      try {
        await otelSetup.createSpan('error-span', async () => {
          const traceId = otelSetup.getCurrentTraceId();
          const spanId = otelSetup.getCurrentSpanId();

          // Set the trace context
          mockTracingService.setCurrentTraceContext(traceId, spanId);

          // Log before error
          loggerService.log('Before error');

          // Throw an error
          throw new Error('Test error in OpenTelemetry span');
        });
      } catch (error) {
        // Error is caught outside the span
        loggerService.error('Caught OpenTelemetry error', error);
      }

      // Verify logs
      expect(capturedLogs.length).toBe(2);
      expect(capturedLogs[0].message).toBe('Before error');
      expect(capturedLogs[0].traceId).toBeDefined();
      expect(capturedLogs[1].message).toBe('Caught OpenTelemetry error');
      expect(capturedLogs[1].traceId).toBeUndefined(); // Outside the span

      // Verify span has error status
      const spans = otelSetup.getSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('error-span');
      expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    });
  });

  describe('Cross-Service Trace Propagation', () => {
    // Simulate trace context propagation across service boundaries
    it('should maintain trace context across simulated service boundaries', async () => {
      // Create a trace ID and span ID that would be propagated from another service
      const upstreamTraceId = traceContext.generateTraceId();
      const upstreamSpanId = traceContext.generateSpanId();

      // Simulate receiving this context from an upstream service
      mockTracingService.setCurrentTraceContext(upstreamTraceId, upstreamSpanId);

      // Log in the current service with the propagated context
      loggerService.log('Log with propagated trace context');

      // Verify the log includes the propagated trace ID
      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0].traceId).toBe(upstreamTraceId);
      expect(capturedLogs[0].spanId).toBe(upstreamSpanId);

      // Simulate creating a new span in the current service that is a child of the upstream span
      await mockTracingService.createSpan('downstream-service-span', async () => {
        // Get the new span ID (trace ID should remain the same)
        const currentTraceId = mockTracingService.getCurrentTraceId();
        const currentSpanId = mockTracingService.getCurrentSpanId();

        // Log with the new span context
        loggerService.log('Log in downstream service span');

        // Verify the log includes the correct trace context
        expect(capturedLogs.length).toBe(2);
        expect(capturedLogs[1].traceId).toBe(currentTraceId);
        expect(capturedLogs[1].spanId).toBe(currentSpanId);
        
        // Trace ID should be preserved across services
        expect(currentTraceId).toBe(upstreamTraceId);
        // But span ID should be different
        expect(currentSpanId).not.toBe(upstreamSpanId);
      });
    });

    it('should handle complex request flows across multiple services', async () => {
      // Simulate a request flow: API Gateway -> Auth Service -> User Service -> Notification Service
      
      // 1. API Gateway receives request and creates initial span
      const gatewayTraceId = traceContext.generateTraceId();
      const gatewaySpanId = traceContext.generateSpanId();
      mockTracingService.setCurrentTraceContext(gatewayTraceId, gatewaySpanId);
      
      // Log in API Gateway
      const gatewayLogger = loggerService.withContext({ service: 'api-gateway' });
      gatewayLogger.log('Received request in API Gateway');
      
      // 2. Auth Service receives the request with propagated trace context
      await mockTracingService.createSpan('auth-service-span', async () => {
        const authSpanId = mockTracingService.getCurrentSpanId();
        const authLogger = loggerService.withContext({ service: 'auth-service' });
        
        // Log in Auth Service
        authLogger.log('Authenticating user in Auth Service');
        
        // 3. User Service is called by Auth Service
        await mockTracingService.createSpan('user-service-span', async () => {
          const userSpanId = mockTracingService.getCurrentSpanId();
          const userLogger = loggerService.withContext({ service: 'user-service' });
          
          // Log in User Service
          userLogger.log('Retrieving user data in User Service');
          
          // 4. Notification Service is called by User Service
          await mockTracingService.createSpan('notification-service-span', async () => {
            const notificationSpanId = mockTracingService.getCurrentSpanId();
            const notificationLogger = loggerService.withContext({ service: 'notification-service' });
            
            // Log in Notification Service
            notificationLogger.log('Sending notification in Notification Service');
            
            // Verify Notification Service log
            const notificationLog = capturedLogs[capturedLogs.length - 1];
            expect(notificationLog.traceId).toBe(gatewayTraceId);
            expect(notificationLog.spanId).toBe(notificationSpanId);
            expect(notificationLog.context.service).toBe('notification-service');
          });
          
          // Verify User Service log
          const userLog = capturedLogs[capturedLogs.length - 2];
          expect(userLog.traceId).toBe(gatewayTraceId);
          expect(userLog.spanId).toBe(userSpanId);
          expect(userLog.context.service).toBe('user-service');
        });
        
        // Verify Auth Service log
        const authLog = capturedLogs[capturedLogs.length - 3];
        expect(authLog.traceId).toBe(gatewayTraceId);
        expect(authLog.spanId).toBe(authSpanId);
        expect(authLog.context.service).toBe('auth-service');
      });
      
      // Verify API Gateway log
      const gatewayLog = capturedLogs[0];
      expect(gatewayLog.traceId).toBe(gatewayTraceId);
      expect(gatewayLog.spanId).toBe(gatewaySpanId);
      expect(gatewayLog.context.service).toBe('api-gateway');
      
      // Verify total number of logs
      expect(capturedLogs.length).toBe(4);
      
      // Verify all logs have the same trace ID but different span IDs
      const uniqueTraceIds = new Set(capturedLogs.map(log => log.traceId));
      const uniqueSpanIds = new Set(capturedLogs.map(log => log.spanId));
      expect(uniqueTraceIds.size).toBe(1);
      expect(uniqueSpanIds.size).toBe(4);
    });
  });

  describe('Journey-Specific Tracing', () => {
    it('should include journey context in traced logs', async () => {
      // Create a span for a health journey operation
      await mockTracingService.createSpan('health-journey-operation', async () => {
        const traceId = mockTracingService.getCurrentTraceId();
        const spanId = mockTracingService.getCurrentSpanId();
        
        // Create a health journey logger
        const healthLogger = loggerService.forHealthJourney({
          userId: 'user-123',
          journeyId: 'health-journey-456',
        });
        
        // Log with the health journey logger
        healthLogger.log('Health metrics recorded');
        
        // Verify the log includes both trace context and journey context
        expect(capturedLogs.length).toBe(1);
        expect(capturedLogs[0].traceId).toBe(traceId);
        expect(capturedLogs[0].spanId).toBe(spanId);
        expect(capturedLogs[0].context.journeyType).toBe(JourneyType.HEALTH);
        expect(capturedLogs[0].context.userId).toBe('user-123');
        expect(capturedLogs[0].context.journeyId).toBe('health-journey-456');
      });
    });
    
    it('should trace operations across multiple journeys', async () => {
      // Create a span for a cross-journey operation
      await mockTracingService.createSpan('cross-journey-operation', async () => {
        const traceId = mockTracingService.getCurrentTraceId();
        
        // Create loggers for different journeys
        const healthLogger = loggerService.forHealthJourney({ userId: 'user-123' });
        const careLogger = loggerService.forCareJourney({ userId: 'user-123' });
        const planLogger = loggerService.forPlanJourney({ userId: 'user-123' });
        
        // Log with each journey logger
        healthLogger.log('Health journey operation');
        careLogger.log('Care journey operation');
        planLogger.log('Plan journey operation');
        
        // Verify all logs have the same trace ID
        expect(capturedLogs.length).toBe(3);
        capturedLogs.forEach(log => {
          expect(log.traceId).toBe(traceId);
        });
        
        // Verify journey context is preserved
        expect(capturedLogs[0].context.journeyType).toBe(JourneyType.HEALTH);
        expect(capturedLogs[1].context.journeyType).toBe(JourneyType.CARE);
        expect(capturedLogs[2].context.journeyType).toBe(JourneyType.PLAN);
      });
    });
  });
});
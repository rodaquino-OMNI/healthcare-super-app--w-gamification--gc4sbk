import { Test } from '@nestjs/testing';
import { INestApplication, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TracingService } from '../../src/tracing.service';
import * as request from 'supertest';
import { Controller, Get, Module, Param } from '@nestjs/common';
import { SpanStatusCode, context, trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { SpanAttributes } from '../../src/interfaces/span-attributes.interface';
import { JourneyContext } from '../../src/interfaces/journey-context.interface';
import { spanAttributeUtils } from '../../src/utils/span-attributes';
import { correlationUtils } from '../../src/utils/correlation';
import { contextPropagationUtils } from '../../src/utils/context-propagation';
import { MockLoggerService } from '../mocks/mock-logger.service';
import { spanAssertionUtils } from '../utils/span-assertion.utils';

/**
 * Mock Health Service Controller
 */
@Controller('health')
class HealthController {
  constructor(private readonly tracingService: TracingService) {}

  @Get('metrics/:userId')
  async getHealthMetrics(@Param('userId') userId: string) {
    return this.tracingService.createSpan('health.getMetrics', async () => {
      // Add health journey specific attributes
      const span = trace.getActiveSpan();
      if (span) {
        spanAttributeUtils.addHealthJourneyAttributes(span, {
          userId,
          metricType: 'heartRate',
          deviceId: 'mock-device-123'
        });
      }
      
      // Simulate fetching health metrics
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return { 
        userId, 
        metrics: [
          { type: 'heartRate', value: 75, unit: 'bpm', timestamp: new Date().toISOString() }
        ]
      };
    });
  }
}

/**
 * Mock Care Service Controller
 */
@Controller('care')
class CareController {
  constructor(private readonly tracingService: TracingService) {}

  @Get('appointments/:userId')
  async getAppointments(@Param('userId') userId: string) {
    return this.tracingService.createSpan('care.getAppointments', async () => {
      // Add care journey specific attributes
      const span = trace.getActiveSpan();
      if (span) {
        spanAttributeUtils.addCareJourneyAttributes(span, {
          userId,
          providerId: 'mock-provider-456',
          appointmentType: 'checkup'
        });
      }
      
      // Simulate fetching appointments
      await new Promise(resolve => setTimeout(resolve, 30));
      
      return { 
        userId, 
        appointments: [
          { id: 'apt-123', provider: 'Dr. Smith', date: new Date().toISOString(), type: 'checkup' }
        ]
      };
    });
  }
}

/**
 * Mock Plan Service Controller
 */
@Controller('plan')
class PlanController {
  constructor(private readonly tracingService: TracingService) {}

  @Get('benefits/:userId')
  async getBenefits(@Param('userId') userId: string) {
    return this.tracingService.createSpan('plan.getBenefits', async () => {
      // Add plan journey specific attributes
      const span = trace.getActiveSpan();
      if (span) {
        spanAttributeUtils.addPlanJourneyAttributes(span, {
          userId,
          planId: 'mock-plan-789',
          membershipType: 'premium'
        });
      }
      
      // Simulate fetching benefits
      await new Promise(resolve => setTimeout(resolve, 40));
      
      return { 
        userId, 
        benefits: [
          { id: 'ben-123', name: 'Annual Checkup', coverage: '100%', category: 'preventive' }
        ]
      };
    });
  }

  @Get('error/:userId')
  async simulateError(@Param('userId') userId: string) {
    try {
      return await this.tracingService.createSpan('plan.errorOperation', async () => {
        // Add plan journey specific attributes
        const span = trace.getActiveSpan();
        if (span) {
          spanAttributeUtils.addPlanJourneyAttributes(span, {
            userId,
            planId: 'mock-plan-789',
            membershipType: 'premium'
          });
        }
        
        // Simulate an error
        throw new Error('Simulated error in plan service');
      });
    } catch (error) {
      // The error should be recorded in the span and rethrown
      throw error;
    }
  }
}

/**
 * Mock User Journey Controller that calls multiple services
 */
@Controller('journey')
class UserJourneyController {
  constructor(
    private readonly tracingService: TracingService,
    private readonly httpService: HttpClientService
  ) {}

  @Get('user-dashboard/:userId')
  async getUserDashboard(@Param('userId') userId: string) {
    return this.tracingService.createSpan('journey.getUserDashboard', async () => {
      // Add cross-journey attributes
      const span = trace.getActiveSpan();
      if (span) {
        span.setAttribute('user.id', userId);
        span.setAttribute('journey.type', 'dashboard');
      }
      
      // Make calls to all three services with trace context propagation
      const [healthData, careData, planData] = await Promise.all([
        this.httpService.get(`http://localhost:3000/health/metrics/${userId}`),
        this.httpService.get(`http://localhost:3000/care/appointments/${userId}`),
        this.httpService.get(`http://localhost:3000/plan/benefits/${userId}`)
      ]);
      
      return {
        userId,
        dashboard: {
          health: healthData,
          care: careData,
          plan: planData
        }
      };
    });
  }

  @Get('error-handling/:userId')
  async testErrorHandling(@Param('userId') userId: string) {
    return this.tracingService.createSpan('journey.errorHandling', async () => {
      try {
        // Make a call to a service that will generate an error
        await this.httpService.get(`http://localhost:3000/plan/error/${userId}`);
        return { success: true };
      } catch (error) {
        // The error should be recorded in the span
        return { success: false, error: error.message };
      }
    });
  }
}

/**
 * Simple HTTP client service that propagates trace context
 */
class HttpClientService {
  constructor(private readonly tracingService: TracingService) {}

  async get(url: string): Promise<any> {
    return this.tracingService.createSpan(`http.get.${new URL(url).pathname}`, async () => {
      const span = trace.getActiveSpan();
      if (span) {
        span.setAttribute('http.url', url);
        span.setAttribute('http.method', 'GET');
      }
      
      // Extract current context for propagation
      const currentContext = context.active();
      const headers = {};
      
      // Inject trace context into headers
      contextPropagationUtils.injectTraceContext(currentContext, headers);
      
      // Make the HTTP request with trace context headers
      const response = await request('http://localhost:3000')
        .get(new URL(url).pathname)
        .set(headers);
      
      if (span) {
        span.setAttribute('http.status_code', response.status);
      }
      
      return response.body;
    });
  }
}

/**
 * Test Module
 */
@Module({
  controllers: [HealthController, CareController, PlanController, UserJourneyController],
  providers: [
    {
      provide: ConfigService,
      useValue: {
        get: (key: string, defaultValue?: any) => {
          const config = {
            'service.name': 'austa-e2e-test'
          };
          return config[key] || defaultValue;
        }
      }
    },
    {
      provide: LoggerService,
      useClass: MockLoggerService
    },
    TracingService,
    HttpClientService
  ]
})
class TestModule {}

describe('Tracing Integration Tests', () => {
  let app: INestApplication;
  let memoryExporter: InMemorySpanExporter;
  let tracerProvider: NodeTracerProvider;
  let mockLogger: MockLoggerService;
  
  beforeAll(async () => {
    // Set up the in-memory span exporter for testing
    memoryExporter = new InMemorySpanExporter();
    tracerProvider = new NodeTracerProvider();
    tracerProvider.addSpanProcessor(new SimpleSpanProcessor(memoryExporter));
    tracerProvider.register({
      propagator: new W3CTraceContextPropagator()
    });
    
    // Register instrumentations for HTTP and NestJS
    registerInstrumentations({
      instrumentations: [
        new HttpInstrumentation(),
        new NestInstrumentation()
      ]
    });
    
    // Create the NestJS test module
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule]
    }).compile();
    
    app = moduleRef.createNestApplication();
    mockLogger = moduleRef.get<MockLoggerService>(LoggerService);
    
    await app.init();
  });
  
  afterEach(() => {
    // Clear the spans after each test
    memoryExporter.reset();
    mockLogger.clearLogs();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('Trace ID Propagation', () => {
    it('should propagate trace ID across service boundaries', async () => {
      // Make a request to the user journey endpoint that calls multiple services
      const response = await request(app.getHttpServer())
        .get('/journey/user-dashboard/user-123')
        .expect(200);
      
      // Get all spans from the exporter
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify that we have spans from all services
      expect(spans.length).toBeGreaterThan(4); // At least one span per service plus the journey span
      
      // Get all unique trace IDs
      const traceIds = new Set(spans.map(span => span.spanContext().traceId));
      
      // Verify that all spans have the same trace ID (single trace across services)
      expect(traceIds.size).toBe(1);
      
      // Verify the response contains data from all services
      expect(response.body.dashboard.health).toBeDefined();
      expect(response.body.dashboard.care).toBeDefined();
      expect(response.body.dashboard.plan).toBeDefined();
    });
  });
  
  describe('OpenTelemetry Instrumentation', () => {
    it('should automatically collect spans for HTTP requests', async () => {
      // Make a simple request to a service
      await request(app.getHttpServer())
        .get('/health/metrics/user-123')
        .expect(200);
      
      // Get all spans from the exporter
      const spans = memoryExporter.getFinishedSpans();
      
      // Find HTTP spans created by auto-instrumentation
      const httpSpans = spans.filter(span => 
        span.name.startsWith('HTTP ') || 
        span.attributes['http.method'] !== undefined
      );
      
      // Verify that HTTP instrumentation created spans
      expect(httpSpans.length).toBeGreaterThan(0);
      
      // Verify HTTP span attributes
      const httpSpan = httpSpans[0];
      expect(httpSpan.attributes['http.method']).toBeDefined();
      expect(httpSpan.attributes['http.url'] || httpSpan.attributes['http.target']).toBeDefined();
      expect(httpSpan.attributes['http.status_code']).toBeDefined();
    });
  });
  
  describe('Custom Span Annotations', () => {
    it('should add journey-specific attributes to spans', async () => {
      // Make requests to all journey services
      await request(app.getHttpServer()).get('/health/metrics/user-123').expect(200);
      await request(app.getHttpServer()).get('/care/appointments/user-123').expect(200);
      await request(app.getHttpServer()).get('/plan/benefits/user-123').expect(200);
      
      // Get all spans from the exporter
      const spans = memoryExporter.getFinishedSpans();
      
      // Find spans for each journey
      const healthSpan = spans.find(span => span.name === 'health.getMetrics');
      const careSpan = spans.find(span => span.name === 'care.getAppointments');
      const planSpan = spans.find(span => span.name === 'plan.getBenefits');
      
      // Verify health journey attributes
      expect(healthSpan).toBeDefined();
      expect(healthSpan?.attributes['journey.type']).toBe('health');
      expect(healthSpan?.attributes['health.metric.type']).toBe('heartRate');
      expect(healthSpan?.attributes['health.device.id']).toBe('mock-device-123');
      
      // Verify care journey attributes
      expect(careSpan).toBeDefined();
      expect(careSpan?.attributes['journey.type']).toBe('care');
      expect(careSpan?.attributes['care.provider.id']).toBe('mock-provider-456');
      expect(careSpan?.attributes['care.appointment.type']).toBe('checkup');
      
      // Verify plan journey attributes
      expect(planSpan).toBeDefined();
      expect(planSpan?.attributes['journey.type']).toBe('plan');
      expect(planSpan?.attributes['plan.id']).toBe('mock-plan-789');
      expect(planSpan?.attributes['plan.membership.type']).toBe('premium');
    });
  });
  
  describe('Correlation IDs', () => {
    it('should correlate logs with traces using correlation IDs', async () => {
      // Make a request that generates logs
      await request(app.getHttpServer())
        .get('/journey/user-dashboard/user-123')
        .expect(200);
      
      // Get all spans from the exporter
      const spans = memoryExporter.getFinishedSpans();
      const traceId = spans[0].spanContext().traceId;
      
      // Get logs from the mock logger
      const logs = mockLogger.getLogs();
      
      // Verify that logs contain trace correlation IDs
      const logsWithTraceId = logs.filter(log => 
        log.message.includes(traceId) || 
        (log.context && JSON.stringify(log.context).includes(traceId))
      );
      
      expect(logsWithTraceId.length).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should record exceptions in spans and set appropriate status', async () => {
      // Make a request that will generate an error
      await request(app.getHttpServer())
        .get('/journey/error-handling/user-123')
        .expect(200); // The controller catches the error, so HTTP status is still 200
      
      // Get all spans from the exporter
      const spans = memoryExporter.getFinishedSpans();
      
      // Find the error span
      const errorSpan = spans.find(span => span.name === 'plan.errorOperation');
      
      // Verify error was recorded in the span
      expect(errorSpan).toBeDefined();
      expect(errorSpan?.status.code).toBe(SpanStatusCode.ERROR);
      
      // Verify error events were recorded
      const events = errorSpan?.events || [];
      const errorEvents = events.filter(event => event.name === 'exception');
      expect(errorEvents.length).toBeGreaterThan(0);
      
      // Verify error message
      const errorEvent = errorEvents[0];
      expect(errorEvent.attributes['exception.message']).toBe('Simulated error in plan service');
    });
  });
  
  describe('End-to-End User Journeys', () => {
    it('should trace complete user journey across all services', async () => {
      // Make a request to the user journey endpoint
      await request(app.getHttpServer())
        .get('/journey/user-dashboard/user-123')
        .expect(200);
      
      // Get all spans from the exporter
      const spans = memoryExporter.getFinishedSpans();
      
      // Verify spans from all services exist in the trace
      const journeySpan = spans.find(span => span.name === 'journey.getUserDashboard');
      const healthSpan = spans.find(span => span.name.includes('health'));
      const careSpan = spans.find(span => span.name.includes('care'));
      const planSpan = spans.find(span => span.name.includes('plan'));
      
      expect(journeySpan).toBeDefined();
      expect(healthSpan).toBeDefined();
      expect(careSpan).toBeDefined();
      expect(planSpan).toBeDefined();
      
      // Verify parent-child relationships
      // All service spans should have the same trace ID as the journey span
      const traceId = journeySpan?.spanContext().traceId;
      expect(healthSpan?.spanContext().traceId).toBe(traceId);
      expect(careSpan?.spanContext().traceId).toBe(traceId);
      expect(planSpan?.spanContext().traceId).toBe(traceId);
      
      // Verify timing - journey span should encompass all other spans
      const journeyStartTime = journeySpan?.startTime;
      const journeyEndTime = journeySpan?.endTime;
      
      // All other spans should be within the journey span's time range
      spans.forEach(span => {
        if (span !== journeySpan) {
          expect(span.startTime).toBeGreaterThanOrEqual(journeyStartTime!);
          expect(span.endTime).toBeLessThanOrEqual(journeyEndTime!);
        }
      });
    });
  });
});
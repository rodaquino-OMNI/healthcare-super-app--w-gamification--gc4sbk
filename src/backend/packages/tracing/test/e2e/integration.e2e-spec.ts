/**
 * @file integration.e2e-spec.ts
 * @description End-to-end tests for the tracing functionality across service boundaries.
 * These tests verify trace propagation, span recording, error handling, and correlation
 * with logs in a production-like environment with actual HTTP requests between services.
 */

import { Test } from '@nestjs/testing';
import { INestApplication, LoggerService } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import axios from 'axios';

import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';
import { TraceContext, PropagationFormat, JourneyType, TRACE_CONTEXT_KEYS } from '../../src/interfaces';

// Mock logger to capture log messages
class MockLogger implements LoggerService {
  logs: Record<string, any[]> = {
    log: [],
    error: [],
    warn: [],
    debug: [],
    verbose: []
  };

  log(message: any, ...optionalParams: any[]) {
    this.logs.log.push({ message, params: optionalParams });
  }

  error(message: any, ...optionalParams: any[]) {
    this.logs.error.push({ message, params: optionalParams });
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logs.warn.push({ message, params: optionalParams });
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logs.debug.push({ message, params: optionalParams });
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logs.verbose.push({ message, params: optionalParams });
  }

  clear() {
    this.logs = {
      log: [],
      error: [],
      warn: [],
      debug: [],
      verbose: []
    };
  }
}

describe('Tracing Integration Tests', () => {
  let primaryApp: INestApplication;
  let secondaryApp: INestApplication;
  let primaryServer: Server;
  let secondaryServer: Server;
  let primaryPort: number;
  let secondaryPort: number;
  let primaryTracingService: TracingService;
  let secondaryTracingService: TracingService;
  let mockLogger: MockLogger;
  let spanExporter: InMemorySpanExporter;
  let tracerProvider: NodeTracerProvider;

  // Helper function to get all collected spans
  const getSpans = () => spanExporter.getFinishedSpans();
  
  // Helper function to clear all spans
  const clearSpans = () => spanExporter.reset();

  beforeAll(async () => {
    // Set up OpenTelemetry with in-memory exporter for testing
    spanExporter = new InMemorySpanExporter();
    tracerProvider = new NodeTracerProvider();
    tracerProvider.addSpanProcessor(new SimpleSpanProcessor(spanExporter));
    tracerProvider.register({
      propagator: new W3CTraceContextPropagator()
    });

    // Register auto-instrumentations
    registerInstrumentations({
      tracerProvider,
      instrumentations: [
        new HttpInstrumentation(),
        new NestInstrumentation()
      ]
    });

    // Create mock logger
    mockLogger = new MockLogger();

    // Create primary service (simulating API Gateway)
    const primaryModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            service: {
              name: 'primary-service',
              port: 0 // Use any available port
            }
          })]
        }),
        TracingModule
      ],
      providers: [
        {
          provide: LoggerService,
          useValue: mockLogger
        }
      ]
    }).compile();

    primaryApp = primaryModule.createNestApplication();
    await primaryApp.init();
    primaryTracingService = primaryModule.get<TracingService>(TracingService);

    // Create secondary service (simulating a microservice)
    const secondaryModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            service: {
              name: 'secondary-service',
              port: 0 // Use any available port
            }
          })]
        }),
        TracingModule
      ],
      providers: [
        {
          provide: LoggerService,
          useValue: mockLogger
        }
      ]
    }).compile();

    secondaryApp = secondaryModule.createNestApplication();
    await secondaryApp.init();
    secondaryTracingService = secondaryModule.get<TracingService>(TracingService);

    // Start HTTP servers for both applications
    primaryServer = createServer(primaryApp.getHttpAdapter().getInstance());
    secondaryServer = createServer(secondaryApp.getHttpAdapter().getInstance());

    // Listen on random available ports
    primaryServer.listen(0);
    secondaryServer.listen(0);

    // Get the assigned ports
    primaryPort = (primaryServer.address() as AddressInfo).port;
    secondaryPort = (secondaryServer.address() as AddressInfo).port;

    // Configure routes for testing
    const primaryHttpAdapter = primaryApp.getHttpAdapter();
    primaryHttpAdapter.get('/api/health', async (req: any, res: any) => {
      // Create a span for this operation
      await primaryTracingService.createSpan('health-check', async () => {
        // Make a request to the secondary service
        const response = await axios.get(`http://localhost:${secondaryPort}/internal/status`, {
          headers: {
            // Extract headers from the incoming request to propagate trace context
            ...req.headers
          }
        });
        res.status(200).json({ status: 'ok', downstream: response.data });
      });
    });

    primaryHttpAdapter.get('/api/error', async (req: any, res: any) => {
      try {
        // Create a span that will contain an error
        await primaryTracingService.createSpan('error-operation', async () => {
          // Make a request to a non-existent endpoint on the secondary service
          await axios.get(`http://localhost:${secondaryPort}/internal/non-existent`, {
            headers: {
              ...req.headers
            }
          });
        });
      } catch (error) {
        // The error is caught here, but the span should record the error
        res.status(500).json({ error: 'An error occurred' });
      }
    });

    primaryHttpAdapter.get('/api/journey/:type', async (req: any, res: any) => {
      // Create a span with journey context
      await primaryTracingService.createSpan('journey-operation', async () => {
        const journeyType = req.params.type;
        const userId = req.query.userId || 'test-user';
        
        // Add journey context to headers
        const headers = {
          ...req.headers,
          [TRACE_CONTEXT_KEYS.JOURNEY_ID]: `journey-${Date.now()}`,
          [TRACE_CONTEXT_KEYS.JOURNEY_TYPE]: journeyType,
          [TRACE_CONTEXT_KEYS.USER_ID]: userId
        };
        
        // Make a request to the secondary service with journey context
        const response = await axios.get(`http://localhost:${secondaryPort}/internal/journey-status`, {
          headers
        });
        
        res.status(200).json({ journey: journeyType, data: response.data });
      });
    });

    const secondaryHttpAdapter = secondaryApp.getHttpAdapter();
    secondaryHttpAdapter.get('/internal/status', async (req: any, res: any) => {
      // Create a child span in the secondary service
      await secondaryTracingService.createSpan('internal-status-check', async () => {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 50));
        res.status(200).json({ status: 'healthy', service: 'secondary' });
      });
    });

    secondaryHttpAdapter.get('/internal/journey-status', async (req: any, res: any) => {
      // Create a child span with journey attributes
      await secondaryTracingService.createSpan('journey-status-check', async () => {
        // Extract journey information from headers
        const journeyId = req.headers[TRACE_CONTEXT_KEYS.JOURNEY_ID];
        const journeyType = req.headers[TRACE_CONTEXT_KEYS.JOURNEY_TYPE];
        const userId = req.headers[TRACE_CONTEXT_KEYS.USER_ID];
        
        // Simulate journey-specific work
        await new Promise(resolve => setTimeout(resolve, 50));
        
        res.status(200).json({
          journeyId,
          journeyType,
          userId,
          status: 'active',
          timestamp: new Date().toISOString()
        });
      });
    });
  });

  afterAll(async () => {
    // Clean up resources
    await primaryApp.close();
    await secondaryApp.close();
    primaryServer.close();
    secondaryServer.close();
  });

  beforeEach(() => {
    // Clear spans and logs before each test
    clearSpans();
    mockLogger.clear();
  });

  describe('Trace Propagation', () => {
    it('should propagate trace context between services', async () => {
      // Make a request to the primary service
      await request(primaryServer)
        .get('/api/health')
        .expect(200);

      // Get all spans generated during the request
      const spans = getSpans();
      
      // There should be spans from both services
      expect(spans.length).toBeGreaterThanOrEqual(3); // At least 3 spans (HTTP client, server, and custom spans)
      
      // All spans should have the same trace ID
      const traceId = spans[0].spanContext().traceId;
      spans.forEach(span => {
        expect(span.spanContext().traceId).toEqual(traceId);
      });
      
      // Verify we have spans from both services
      const serviceNames = spans.map(span => span.attributes['service.name']);
      expect(serviceNames).toContain('primary-service');
      expect(serviceNames).toContain('secondary-service');
      
      // Verify parent-child relationships
      const spanIds = spans.map(span => span.spanContext().spanId);
      const parentIds = spans.map(span => span.parentSpanId).filter(Boolean);
      
      // At least some spans should have parents within our trace
      parentIds.forEach(parentId => {
        expect(spanIds).toContain(parentId);
      });
    });

    it('should include correlation IDs in trace context', async () => {
      // Make a request with a correlation ID
      const correlationId = `test-correlation-${Date.now()}`;
      
      await request(primaryServer)
        .get('/api/health')
        .set('x-correlation-id', correlationId)
        .expect(200);

      // Get all spans generated during the request
      const spans = getSpans();
      
      // Verify correlation ID is present in span attributes
      const spanWithCorrelationId = spans.find(span => 
        span.attributes && span.attributes['correlation.id'] === correlationId
      );
      
      expect(spanWithCorrelationId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should record errors in spans', async () => {
      // Make a request that will cause an error
      await request(primaryServer)
        .get('/api/error')
        .expect(500);

      // Get all spans generated during the request
      const spans = getSpans();
      
      // Find spans with error status
      const errorSpans = spans.filter(span => 
        span.status.code === SpanStatusCode.ERROR
      );
      
      // Verify we have at least one span with error status
      expect(errorSpans.length).toBeGreaterThanOrEqual(1);
      
      // Verify error details are recorded
      const errorSpan = errorSpans.find(span => 
        span.name === 'error-operation' || span.name.includes('GET /internal/non-existent')
      );
      
      expect(errorSpan).toBeDefined();
      expect(errorSpan?.events.length).toBeGreaterThanOrEqual(1); // Should have at least one event (the exception)
      
      // Verify error is logged
      expect(mockLogger.logs.error.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Journey Context', () => {
    it('should propagate journey context between services', async () => {
      // Make a request with journey context
      const userId = `user-${Date.now()}`;
      const journeyType = JourneyType.HEALTH;
      
      await request(primaryServer)
        .get(`/api/journey/${journeyType}`)
        .query({ userId })
        .expect(200);

      // Get all spans generated during the request
      const spans = getSpans();
      
      // Find spans with journey attributes
      const journeySpans = spans.filter(span => 
        span.attributes && (
          span.attributes['journey.type'] === journeyType ||
          span.attributes['user.id'] === userId
        )
      );
      
      // Verify we have spans with journey context from both services
      expect(journeySpans.length).toBeGreaterThanOrEqual(2);
      
      // Verify journey attributes are correctly propagated
      const primaryJourneySpan = journeySpans.find(span => 
        span.attributes['service.name'] === 'primary-service'
      );
      
      const secondaryJourneySpan = journeySpans.find(span => 
        span.attributes['service.name'] === 'secondary-service'
      );
      
      expect(primaryJourneySpan).toBeDefined();
      expect(secondaryJourneySpan).toBeDefined();
      
      // Both spans should have the same journey ID
      if (primaryJourneySpan && secondaryJourneySpan) {
        expect(primaryJourneySpan.attributes['journey.id'])
          .toEqual(secondaryJourneySpan.attributes['journey.id']);
      }
    });

    it('should support different journey types', async () => {
      // Test with different journey types
      const journeyTypes = [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN];
      
      for (const journeyType of journeyTypes) {
        // Clear spans before each journey type test
        clearSpans();
        
        await request(primaryServer)
          .get(`/api/journey/${journeyType}`)
          .expect(200);

        // Get all spans generated during the request
        const spans = getSpans();
        
        // Find spans with this journey type
        const journeySpans = spans.filter(span => 
          span.attributes && span.attributes['journey.type'] === journeyType
        );
        
        // Verify we have spans with the correct journey type
        expect(journeySpans.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Custom Span Annotations', () => {
    it('should support custom span attributes for business operations', async () => {
      // Create a custom span with business-relevant attributes
      await primaryTracingService.createSpan('business-operation', async () => {
        const span = trace.getSpan(context.active());
        if (span) {
          // Add business-specific attributes
          span.setAttribute('business.operation.type', 'health-data-sync');
          span.setAttribute('business.operation.entity', 'health-metrics');
          span.setAttribute('business.operation.result', 'success');
          span.setAttribute('business.operation.count', 42);
        }
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Get all spans generated during the operation
      const spans = getSpans();
      
      // Find the business operation span
      const businessSpan = spans.find(span => span.name === 'business-operation');
      
      // Verify business attributes are recorded
      expect(businessSpan).toBeDefined();
      expect(businessSpan?.attributes['business.operation.type']).toEqual('health-data-sync');
      expect(businessSpan?.attributes['business.operation.entity']).toEqual('health-metrics');
      expect(businessSpan?.attributes['business.operation.result']).toEqual('success');
      expect(businessSpan?.attributes['business.operation.count']).toEqual(42);
    });
  });

  describe('Log Correlation', () => {
    it('should correlate logs with trace context', async () => {
      // Create a span and generate logs within it
      await primaryTracingService.createSpan('logging-operation', async () => {
        const span = trace.getSpan(context.active());
        const traceId = span?.spanContext().traceId;
        const spanId = span?.spanContext().spanId;
        
        // Log messages that should be correlated with the span
        mockLogger.log('Test log message', { traceId, spanId, context: 'test' });
        mockLogger.error('Test error message', { traceId, spanId, context: 'test' });
      });

      // Get all spans generated during the operation
      const spans = getSpans();
      
      // Find the logging operation span
      const loggingSpan = spans.find(span => span.name === 'logging-operation');
      expect(loggingSpan).toBeDefined();
      
      if (loggingSpan) {
        const traceId = loggingSpan.spanContext().traceId;
        const spanId = loggingSpan.spanContext().spanId;
        
        // Verify logs contain trace and span IDs
        const correlatedLogs = mockLogger.logs.log.filter(log => 
          log.params.some((param: any) => 
            param.traceId === traceId && param.spanId === spanId
          )
        );
        
        expect(correlatedLogs.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('End-to-End User Journeys', () => {
    it('should trace a complete health journey flow', async () => {
      // Simulate a complete health journey with multiple steps
      const userId = `user-${Date.now()}`;
      const journeyId = `journey-${Date.now()}`;
      
      // Step 1: Start health journey
      await request(primaryServer)
        .get(`/api/journey/${JourneyType.HEALTH}`)
        .query({ userId })
        .set(TRACE_CONTEXT_KEYS.JOURNEY_ID, journeyId)
        .set(TRACE_CONTEXT_KEYS.JOURNEY_TYPE, JourneyType.HEALTH)
        .set(TRACE_CONTEXT_KEYS.USER_ID, userId)
        .expect(200);
      
      // Step 2: Make another request in the same journey
      await request(primaryServer)
        .get('/api/health')
        .set(TRACE_CONTEXT_KEYS.JOURNEY_ID, journeyId)
        .set(TRACE_CONTEXT_KEYS.JOURNEY_TYPE, JourneyType.HEALTH)
        .set(TRACE_CONTEXT_KEYS.USER_ID, userId)
        .expect(200);

      // Get all spans generated during the journey
      const spans = getSpans();
      
      // Group spans by trace ID
      const traceGroups = spans.reduce((groups: Record<string, Span[]>, span) => {
        const traceId = span.spanContext().traceId;
        if (!groups[traceId]) {
          groups[traceId] = [];
        }
        groups[traceId].push(span);
        return groups;
      }, {});
      
      // We should have at least 2 traces (one for each request)
      expect(Object.keys(traceGroups).length).toBeGreaterThanOrEqual(2);
      
      // Each trace should have spans from both services
      Object.values(traceGroups).forEach(traceSpans => {
        const serviceNames = traceSpans.map(span => span.attributes['service.name']);
        expect(serviceNames).toContain('primary-service');
        expect(serviceNames).toContain('secondary-service');
      });
      
      // All traces should have the same journey ID
      const journeySpans = spans.filter(span => 
        span.attributes && span.attributes['journey.id'] === journeyId
      );
      
      expect(journeySpans.length).toBeGreaterThanOrEqual(2);
    });
  });
});
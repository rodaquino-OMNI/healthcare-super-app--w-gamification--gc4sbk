import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { context, trace, SpanStatusCode, propagation, ROOT_CONTEXT, Context, TextMapPropagator } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { KafkaHeaders } from '@nestjs/microservices';
import { TracingService } from '../../src/tracing.service';
import { createTestModule } from '../utils/test-module.utils';
import { assertSpanAttributes } from '../utils/span-assertion.utils';
import { MockTracer } from '../mocks/mock-tracer';
import { MockLoggerService } from '../mocks/mock-logger.service';
import * as spanFixtures from '../fixtures/span-attributes';

describe('Tracing Context Propagation Integration Tests', () => {
  let tracingService: TracingService;
  let mockTracer: MockTracer;
  let mockLogger: MockLoggerService;
  let configService: ConfigService;
  let w3cPropagator: TextMapPropagator;

  beforeEach(async () => {
    // Create a test module with TracingService
    const moduleRef = await Test.createTestingModule({
      providers: [
        TracingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: any) => {
              if (key === 'service.name') return 'test-tracing-service';
              return defaultValue;
            }),
          },
        },
        {
          provide: LoggerService,
          useClass: MockLoggerService,
        },
      ],
    }).compile();

    tracingService = moduleRef.get<TracingService>(TracingService);
    mockLogger = moduleRef.get<MockLoggerService>(LoggerService) as MockLoggerService;
    configService = moduleRef.get<ConfigService>(ConfigService);
    
    // Get the tracer from the tracing service
    mockTracer = new MockTracer();
    jest.spyOn(trace, 'getTracer').mockReturnValue(mockTracer as any);
    
    // Initialize W3C propagator
    w3cPropagator = new W3CTraceContextPropagator();
    jest.spyOn(propagation, 'getTextMapPropagator').mockReturnValue(w3cPropagator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP Header Context Propagation', () => {
    it('should inject trace context into HTTP headers', async () => {
      // Create a span to establish context
      const span = mockTracer.startSpan('test-http-operation');
      const ctx = trace.setSpan(context.active(), span);
      
      // Create headers object to inject context into
      const headers: Record<string, string> = {};
      
      // Inject context into headers
      context.with(ctx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), headers, {
          set: (carrier, key, value) => {
            carrier[key] = value;
          },
        });
      });
      
      // Verify headers contain trace context
      expect(headers).toHaveProperty('traceparent');
      expect(headers.traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
      
      // Extract context from headers
      const extractedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        headers,
        {
          get: (carrier, key) => carrier[key],
          keys: (carrier) => Object.keys(carrier),
        },
      );
      
      // Verify extracted context has the same trace ID
      const extractedSpan = trace.getSpan(extractedContext);
      expect(extractedSpan).toBeDefined();
      expect(trace.getSpanContext(extractedContext)?.traceId).toBe(span.spanContext().traceId);
      expect(trace.getSpanContext(extractedContext)?.spanId).toBe(span.spanContext().spanId);
      
      span.end();
    });
    
    it('should propagate journey-specific context in HTTP headers', async () => {
      // Create a span with journey-specific attributes
      const span = mockTracer.startSpan('health-journey-operation');
      span.setAttributes(spanFixtures.healthJourneyAttributes);
      const ctx = trace.setSpan(context.active(), span);
      
      // Create headers object to inject context into
      const headers: Record<string, string> = {};
      
      // Inject context into headers
      context.with(ctx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), headers, {
          set: (carrier, key, value) => {
            carrier[key] = value;
          },
        });
      });
      
      // Add journey-specific headers
      headers['x-journey-type'] = 'health';
      headers['x-journey-context'] = JSON.stringify({ userId: '12345', metricId: 'heart-rate' });
      
      // Extract context from headers
      const extractedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        headers,
        {
          get: (carrier, key) => carrier[key],
          keys: (carrier) => Object.keys(carrier),
        },
      );
      
      // Create a new span using the extracted context
      const childSpan = mockTracer.startSpan('child-operation', {}, extractedContext);
      
      // Verify the child span has the same trace ID
      expect(childSpan.spanContext().traceId).toBe(span.spanContext().traceId);
      
      // Verify journey-specific context can be accessed
      expect(headers['x-journey-type']).toBe('health');
      expect(JSON.parse(headers['x-journey-context'])).toEqual({ userId: '12345', metricId: 'heart-rate' });
      
      span.end();
      childSpan.end();
    });
  });

  describe('Kafka Message Context Propagation', () => {
    it('should inject trace context into Kafka message headers', async () => {
      // Create a span to establish context
      const span = mockTracer.startSpan('kafka-produce-operation');
      const ctx = trace.setSpan(context.active(), span);
      
      // Create Kafka message headers object
      const headers: Record<string, Buffer> = {};
      
      // Inject context into Kafka headers
      context.with(ctx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), headers, {
          set: (carrier, key, value) => {
            carrier[key] = Buffer.from(value);
          },
        });
      });
      
      // Verify Kafka headers contain trace context
      expect(headers).toHaveProperty('traceparent');
      expect(headers.traceparent.toString()).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
      
      // Extract context from Kafka headers
      const extractedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        headers,
        {
          get: (carrier, key) => {
            const value = carrier[key];
            return value instanceof Buffer ? value.toString() : value;
          },
          keys: (carrier) => Object.keys(carrier),
        },
      );
      
      // Verify extracted context has the same trace ID
      const extractedSpanContext = trace.getSpanContext(extractedContext);
      expect(extractedSpanContext).toBeDefined();
      expect(extractedSpanContext?.traceId).toBe(span.spanContext().traceId);
      expect(extractedSpanContext?.spanId).toBe(span.spanContext().spanId);
      
      span.end();
    });
    
    it('should maintain trace context across Kafka producer and consumer', async () => {
      // Simulate a Kafka producer span
      const producerSpan = mockTracer.startSpan('kafka-produce-message');
      producerSpan.setAttributes({
        'messaging.system': 'kafka',
        'messaging.destination': 'test-topic',
        'messaging.operation': 'publish',
      });
      const producerCtx = trace.setSpan(context.active(), producerSpan);
      
      // Create Kafka message with headers
      const kafkaMessage = {
        topic: 'test-topic',
        messages: [
          {
            value: JSON.stringify({ data: 'test-data' }),
            headers: {},
          },
        ],
      };
      
      // Inject context into Kafka message headers
      context.with(producerCtx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), kafkaMessage.messages[0].headers, {
          set: (carrier, key, value) => {
            carrier[key] = Buffer.from(value);
          },
        });
      });
      
      // Simulate message being sent and received
      
      // Consumer receives the message and extracts context
      const receivedHeaders = kafkaMessage.messages[0].headers;
      const consumerContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        receivedHeaders,
        {
          get: (carrier, key) => {
            const value = carrier[key];
            return value instanceof Buffer ? value.toString() : value;
          },
          keys: (carrier) => Object.keys(carrier),
        },
      );
      
      // Consumer creates a span with the extracted context
      const consumerSpan = mockTracer.startSpan('kafka-consume-message', {}, consumerContext);
      consumerSpan.setAttributes({
        'messaging.system': 'kafka',
        'messaging.destination': 'test-topic',
        'messaging.operation': 'process',
      });
      
      // Verify consumer span is part of the same trace
      expect(consumerSpan.spanContext().traceId).toBe(producerSpan.spanContext().traceId);
      
      // Verify parent-child relationship
      expect(consumerSpan.parentSpanId).toBe(producerSpan.spanContext().spanId);
      
      producerSpan.end();
      consumerSpan.end();
    });
    
    it('should propagate journey-specific context in Kafka messages', async () => {
      // Create a span with care journey attributes
      const span = mockTracer.startSpan('care-journey-operation');
      span.setAttributes(spanFixtures.careJourneyAttributes);
      const ctx = trace.setSpan(context.active(), span);
      
      // Create Kafka message headers
      const headers: Record<string, Buffer> = {};
      
      // Add journey-specific context
      headers['x-journey-type'] = Buffer.from('care');
      headers['x-journey-context'] = Buffer.from(JSON.stringify({ 
        appointmentId: 'appt-123', 
        providerId: 'provider-456' 
      }));
      
      // Inject trace context into headers
      context.with(ctx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), headers, {
          set: (carrier, key, value) => {
            carrier[key] = Buffer.from(value);
          },
        });
      });
      
      // Extract context from headers
      const extractedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        headers,
        {
          get: (carrier, key) => {
            const value = carrier[key];
            return value instanceof Buffer ? value.toString() : value;
          },
          keys: (carrier) => Object.keys(carrier),
        },
      );
      
      // Create a new span using the extracted context
      const childSpan = mockTracer.startSpan('child-operation', {}, extractedContext);
      
      // Verify the child span has the same trace ID
      expect(childSpan.spanContext().traceId).toBe(span.spanContext().traceId);
      
      // Verify journey-specific context can be accessed
      expect(headers['x-journey-type'].toString()).toBe('care');
      expect(JSON.parse(headers['x-journey-context'].toString())).toEqual({ 
        appointmentId: 'appt-123', 
        providerId: 'provider-456' 
      });
      
      span.end();
      childSpan.end();
    });
  });

  describe('gRPC Metadata Context Propagation', () => {
    it('should inject trace context into gRPC metadata', async () => {
      // Create a span to establish context
      const span = mockTracer.startSpan('grpc-client-operation');
      const ctx = trace.setSpan(context.active(), span);
      
      // Create gRPC metadata object
      const metadata: Record<string, string> = {};
      
      // Inject context into gRPC metadata
      context.with(ctx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), metadata, {
          set: (carrier, key, value) => {
            carrier[key] = value;
          },
        });
      });
      
      // Verify gRPC metadata contains trace context
      expect(metadata).toHaveProperty('traceparent');
      expect(metadata.traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
      
      // Extract context from gRPC metadata
      const extractedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        metadata,
        {
          get: (carrier, key) => carrier[key],
          keys: (carrier) => Object.keys(carrier),
        },
      );
      
      // Verify extracted context has the same trace ID
      const extractedSpanContext = trace.getSpanContext(extractedContext);
      expect(extractedSpanContext).toBeDefined();
      expect(extractedSpanContext?.traceId).toBe(span.spanContext().traceId);
      expect(extractedSpanContext?.spanId).toBe(span.spanContext().spanId);
      
      span.end();
    });
    
    it('should maintain trace context across gRPC client and server', async () => {
      // Simulate a gRPC client span
      const clientSpan = mockTracer.startSpan('grpc-client-request');
      clientSpan.setAttributes({
        'rpc.system': 'grpc',
        'rpc.service': 'test.Service',
        'rpc.method': 'TestMethod',
      });
      const clientCtx = trace.setSpan(context.active(), clientSpan);
      
      // Create gRPC metadata
      const metadata: Record<string, string> = {};
      
      // Inject context into gRPC metadata
      context.with(clientCtx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), metadata, {
          set: (carrier, key, value) => {
            carrier[key] = value;
          },
        });
      });
      
      // Simulate gRPC call
      
      // Server receives the metadata and extracts context
      const serverContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        metadata,
        {
          get: (carrier, key) => carrier[key],
          keys: (carrier) => Object.keys(carrier),
        },
      );
      
      // Server creates a span with the extracted context
      const serverSpan = mockTracer.startSpan('grpc-server-handler', {}, serverContext);
      serverSpan.setAttributes({
        'rpc.system': 'grpc',
        'rpc.service': 'test.Service',
        'rpc.method': 'TestMethod',
      });
      
      // Verify server span is part of the same trace
      expect(serverSpan.spanContext().traceId).toBe(clientSpan.spanContext().traceId);
      
      // Verify parent-child relationship
      expect(serverSpan.parentSpanId).toBe(clientSpan.spanContext().spanId);
      
      clientSpan.end();
      serverSpan.end();
    });
    
    it('should propagate journey-specific context in gRPC metadata', async () => {
      // Create a span with plan journey attributes
      const span = mockTracer.startSpan('plan-journey-operation');
      span.setAttributes(spanFixtures.planJourneyAttributes);
      const ctx = trace.setSpan(context.active(), span);
      
      // Create gRPC metadata
      const metadata: Record<string, string> = {};
      
      // Add journey-specific metadata
      metadata['x-journey-type'] = 'plan';
      metadata['x-journey-context'] = JSON.stringify({ 
        planId: 'plan-789', 
        benefitId: 'benefit-101' 
      });
      
      // Inject trace context into metadata
      context.with(ctx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), metadata, {
          set: (carrier, key, value) => {
            carrier[key] = value;
          },
        });
      });
      
      // Extract context from metadata
      const extractedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        metadata,
        {
          get: (carrier, key) => carrier[key],
          keys: (carrier) => Object.keys(carrier),
        },
      );
      
      // Create a new span using the extracted context
      const childSpan = mockTracer.startSpan('child-operation', {}, extractedContext);
      
      // Verify the child span has the same trace ID
      expect(childSpan.spanContext().traceId).toBe(span.spanContext().traceId);
      
      // Verify journey-specific context can be accessed
      expect(metadata['x-journey-type']).toBe('plan');
      expect(JSON.parse(metadata['x-journey-context'])).toEqual({ 
        planId: 'plan-789', 
        benefitId: 'benefit-101' 
      });
      
      span.end();
      childSpan.end();
    });
  });

  describe('Context Serialization and Deserialization', () => {
    it('should accurately serialize and deserialize trace context', async () => {
      // Create a span with attributes
      const originalSpan = mockTracer.startSpan('original-operation');
      originalSpan.setAttributes({
        'service.name': 'test-service',
        'operation.name': 'test-operation',
        'custom.attribute': 'test-value',
      });
      const originalCtx = trace.setSpan(context.active(), originalSpan);
      
      // Serialize context to a carrier
      const carrier: Record<string, string> = {};
      context.with(originalCtx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), carrier, {
          set: (c, k, v) => { c[k] = v; },
        });
      });
      
      // Deserialize context from the carrier
      const deserializedCtx = w3cPropagator.extract(
        ROOT_CONTEXT,
        carrier,
        {
          get: (c, k) => c[k],
          keys: (c) => Object.keys(c),
        },
      );
      
      // Create a new span with the deserialized context
      const newSpan = mockTracer.startSpan('new-operation', {}, deserializedCtx);
      
      // Verify trace continuity
      expect(newSpan.spanContext().traceId).toBe(originalSpan.spanContext().traceId);
      
      // Verify parent-child relationship
      expect(newSpan.parentSpanId).toBe(originalSpan.spanContext().spanId);
      
      originalSpan.end();
      newSpan.end();
    });
    
    it('should handle complex journey context with nested objects', async () => {
      // Create a complex journey context
      const complexJourneyContext = {
        userId: 'user-123',
        session: {
          id: 'session-456',
          startTime: new Date().toISOString(),
          properties: {
            device: 'mobile',
            platform: 'ios',
            version: '2.1.0',
          },
        },
        preferences: {
          language: 'pt-BR',
          notifications: true,
          theme: 'dark',
        },
        metrics: [
          { id: 'metric-1', value: 75.5 },
          { id: 'metric-2', value: 120 },
        ],
      };
      
      // Create a span
      const span = mockTracer.startSpan('complex-context-operation');
      const ctx = trace.setSpan(context.active(), span);
      
      // Create carrier
      const carrier: Record<string, string> = {};
      
      // Add complex journey context
      carrier['x-journey-context'] = JSON.stringify(complexJourneyContext);
      
      // Inject trace context
      context.with(ctx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), carrier, {
          set: (c, k, v) => { c[k] = v; },
        });
      });
      
      // Extract context
      const extractedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        carrier,
        {
          get: (c, k) => c[k],
          keys: (c) => Object.keys(c),
        },
      );
      
      // Create a new span
      const childSpan = mockTracer.startSpan('child-operation', {}, extractedContext);
      
      // Verify trace continuity
      expect(childSpan.spanContext().traceId).toBe(span.spanContext().traceId);
      
      // Verify complex journey context is preserved
      const extractedJourneyContext = JSON.parse(carrier['x-journey-context']);
      expect(extractedJourneyContext).toEqual(complexJourneyContext);
      expect(extractedJourneyContext.session.properties.device).toBe('mobile');
      expect(extractedJourneyContext.metrics[0].value).toBe(75.5);
      
      span.end();
      childSpan.end();
    });
  });

  describe('Journey-Specific Context Propagation', () => {
    it('should propagate Health journey context across service boundaries', async () => {
      // Create a Health journey span
      const healthSpan = mockTracer.startSpan('health-journey-operation');
      healthSpan.setAttributes(spanFixtures.healthJourneyAttributes);
      const healthCtx = trace.setSpan(context.active(), healthSpan);
      
      // Create Health journey context
      const healthJourneyContext = {
        userId: 'user-123',
        metricId: 'heart-rate',
        deviceId: 'device-789',
        timestamp: new Date().toISOString(),
      };
      
      // Create carrier for HTTP headers
      const headers: Record<string, string> = {};
      headers['x-journey-type'] = 'health';
      headers['x-journey-context'] = JSON.stringify(healthJourneyContext);
      
      // Inject trace context
      context.with(healthCtx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), headers, {
          set: (c, k, v) => { c[k] = v; },
        });
      });
      
      // Simulate HTTP request to another service
      
      // Extract context in the receiving service
      const receivedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        headers,
        {
          get: (c, k) => c[k],
          keys: (c) => Object.keys(c),
        },
      );
      
      // Create a span in the receiving service
      const receivingSpan = mockTracer.startSpan('health-data-processor', {}, receivedContext);
      
      // Verify trace continuity
      expect(receivingSpan.spanContext().traceId).toBe(healthSpan.spanContext().traceId);
      
      // Verify journey context is preserved
      expect(headers['x-journey-type']).toBe('health');
      const extractedJourneyContext = JSON.parse(headers['x-journey-context']);
      expect(extractedJourneyContext).toEqual(healthJourneyContext);
      expect(extractedJourneyContext.metricId).toBe('heart-rate');
      
      healthSpan.end();
      receivingSpan.end();
    });
    
    it('should propagate Care journey context across service boundaries', async () => {
      // Create a Care journey span
      const careSpan = mockTracer.startSpan('care-journey-operation');
      careSpan.setAttributes(spanFixtures.careJourneyAttributes);
      const careCtx = trace.setSpan(context.active(), careSpan);
      
      // Create Care journey context
      const careJourneyContext = {
        appointmentId: 'appt-123',
        providerId: 'provider-456',
        patientId: 'patient-789',
        appointmentType: 'telemedicine',
        scheduledTime: new Date().toISOString(),
      };
      
      // Create Kafka message headers
      const headers: Record<string, Buffer> = {};
      headers['x-journey-type'] = Buffer.from('care');
      headers['x-journey-context'] = Buffer.from(JSON.stringify(careJourneyContext));
      
      // Inject trace context
      context.with(careCtx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), headers, {
          set: (c, k, v) => { c[k] = Buffer.from(v); },
        });
      });
      
      // Simulate Kafka message to another service
      
      // Extract context in the receiving service
      const receivedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        headers,
        {
          get: (c, k) => {
            const value = c[k];
            return value instanceof Buffer ? value.toString() : value;
          },
          keys: (c) => Object.keys(c),
        },
      );
      
      // Create a span in the receiving service
      const receivingSpan = mockTracer.startSpan('appointment-processor', {}, receivedContext);
      
      // Verify trace continuity
      expect(receivingSpan.spanContext().traceId).toBe(careSpan.spanContext().traceId);
      
      // Verify journey context is preserved
      expect(headers['x-journey-type'].toString()).toBe('care');
      const extractedJourneyContext = JSON.parse(headers['x-journey-context'].toString());
      expect(extractedJourneyContext).toEqual(careJourneyContext);
      expect(extractedJourneyContext.appointmentType).toBe('telemedicine');
      
      careSpan.end();
      receivingSpan.end();
    });
    
    it('should propagate Plan journey context across service boundaries', async () => {
      // Create a Plan journey span
      const planSpan = mockTracer.startSpan('plan-journey-operation');
      planSpan.setAttributes(spanFixtures.planJourneyAttributes);
      const planCtx = trace.setSpan(context.active(), planSpan);
      
      // Create Plan journey context
      const planJourneyContext = {
        planId: 'plan-123',
        memberId: 'member-456',
        benefitId: 'benefit-789',
        claimId: 'claim-101',
        coverageType: 'family',
      };
      
      // Create gRPC metadata
      const metadata: Record<string, string> = {};
      metadata['x-journey-type'] = 'plan';
      metadata['x-journey-context'] = JSON.stringify(planJourneyContext);
      
      // Inject trace context
      context.with(planCtx, () => {
        const textMapPropagator = propagation.getTextMapPropagator();
        textMapPropagator.inject(context.active(), metadata, {
          set: (c, k, v) => { c[k] = v; },
        });
      });
      
      // Simulate gRPC call to another service
      
      // Extract context in the receiving service
      const receivedContext = w3cPropagator.extract(
        ROOT_CONTEXT,
        metadata,
        {
          get: (c, k) => c[k],
          keys: (c) => Object.keys(c),
        },
      );
      
      // Create a span in the receiving service
      const receivingSpan = mockTracer.startSpan('claim-processor', {}, receivedContext);
      
      // Verify trace continuity
      expect(receivingSpan.spanContext().traceId).toBe(planSpan.spanContext().traceId);
      
      // Verify journey context is preserved
      expect(metadata['x-journey-type']).toBe('plan');
      const extractedJourneyContext = JSON.parse(metadata['x-journey-context']);
      expect(extractedJourneyContext).toEqual(planJourneyContext);
      expect(extractedJourneyContext.coverageType).toBe('family');
      
      planSpan.end();
      receivingSpan.end();
    });
  });
});
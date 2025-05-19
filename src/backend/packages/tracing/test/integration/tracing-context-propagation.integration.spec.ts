import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { context, trace, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

import { TracingService } from '../../src/tracing.service';
import { JourneyType } from '../../src/interfaces/journey-context.interface';
import * as contextPropagationUtils from '../../src/utils/context-propagation';
import {
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  simulateCrossServiceTrace,
  areContextsRelated,
  extractCorrelationId,
  JourneyType as TestJourneyType,
} from '../utils/trace-context.utils';
import { createMockTracer } from '../utils/mock-tracer.utils';

describe('Tracing Context Propagation Integration Tests', () => {
  let tracingService: TracingService;
  let configService: ConfigService;
  let logger: Logger;

  beforeEach(async () => {
    // Create a mock logger
    logger = new Logger('TracingTest');
    
    // Create a mock config service
    configService = new ConfigService({
      'service.name': 'test-service',
      'service.version': '1.0.0',
    });

    // Create the testing module
    const moduleRef = await Test.createTestingModule({
      providers: [
        TracingService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    // Get the tracing service
    tracingService = moduleRef.get<TracingService>(TracingService);
  });

  describe('HTTP Header Context Propagation', () => {
    it('should propagate trace context through HTTP headers', async () => {
      // Create a trace context
      const traceId = 'test-trace-id-12345678901234567890';
      const spanId = 'test-span-id-1234567890';
      const correlationId = 'test-correlation-id';
      
      // Simulate a source service creating a trace context
      const sourceContext = createHealthJourneyContext({
        traceId,
        spanId,
        correlationId,
        attributes: {
          'user.id': 'test-user-123',
          'journey.step': 'health-metrics-view',
        },
      });
      
      // Inject the context into HTTP headers
      const headers: Record<string, string> = {};
      context.with(sourceContext, () => {
        // Use the tracing service to inject context into headers
        tracingService.injectTraceContextIntoHeaders(headers);
        
        // Verify that the headers contain the trace context
        expect(headers['traceparent']).toBeDefined();
        expect(headers['traceparent']).toContain(traceId);
        expect(headers['x-correlation-id']).toBe(correlationId);
      });
      
      // Extract the context from the headers in a target service
      const extractedContext = tracingService.extractTraceContextFromHeaders(headers);
      
      // Verify that the extracted context contains the same trace ID
      const extractedSpanContext = trace.getSpanContext(extractedContext);
      expect(extractedSpanContext).toBeDefined();
      expect(extractedSpanContext?.traceId).toBe(traceId);
      
      // Create a child span in the target service
      await context.with(extractedContext, async () => {
        await tracingService.createSpan('target-service-operation', async () => {
          // Get the current trace info
          const traceInfo = tracingService.getCurrentTraceInfo();
          
          // Verify that the trace ID is preserved
          expect(traceInfo.traceId).toBe(traceId);
          
          // Verify that a new span ID is generated
          expect(traceInfo.spanId).not.toBe(spanId);
        });
      });
    });
    
    it('should maintain journey-specific context across HTTP boundaries', async () => {
      // Simulate a cross-service trace with journey context
      const { sourceContext, targetContext, headers } = simulateCrossServiceTrace(
        TestJourneyType.HEALTH,
        TestJourneyType.CARE,
        {
          attributes: {
            'user.id': 'test-user-456',
            'journey.step': 'health-to-care-referral',
          },
        }
      );
      
      // Verify that the contexts are related (same trace ID)
      expect(areContextsRelated(sourceContext, targetContext)).toBe(true);
      
      // Verify that the correlation ID is preserved
      const sourceCorrelationId = extractCorrelationId(sourceContext);
      const targetCorrelationId = extractCorrelationId(targetContext);
      expect(sourceCorrelationId).toBeDefined();
      expect(targetCorrelationId).toBeDefined();
      expect(targetCorrelationId).toBe(sourceCorrelationId);
      
      // Verify that the journey context is properly propagated
      context.with(sourceContext, () => {
        const sourceTraceInfo = tracingService.getCurrentTraceInfo();
        
        context.with(targetContext, () => {
          const targetTraceInfo = tracingService.getCurrentTraceInfo();
          
          // Same trace ID, different span IDs
          expect(targetTraceInfo.traceId).toBe(sourceTraceInfo.traceId);
          expect(targetTraceInfo.spanId).not.toBe(sourceTraceInfo.spanId);
        });
      });
    });
  });

  describe('Kafka Message Trace Context Propagation', () => {
    it('should propagate trace context through Kafka message headers', async () => {
      // Create a trace context for the producer service
      const producerContext = createCareJourneyContext({
        attributes: {
          'user.id': 'test-user-789',
          'journey.step': 'appointment-booked',
        },
      });
      
      // Get the trace and span IDs from the producer context
      const producerSpanContext = trace.getSpanContext(producerContext);
      const producerTraceId = producerSpanContext?.traceId;
      const producerSpanId = producerSpanContext?.spanId;
      
      // Create Kafka message headers
      const kafkaHeaders: Record<string, Buffer> = {};
      
      // Inject the context into Kafka headers
      context.with(producerContext, () => {
        // Use the context propagation utilities to inject context into Kafka headers
        contextPropagationUtils.injectTraceContextIntoKafkaHeaders(kafkaHeaders, JourneyType.CARE);
        
        // Verify that the headers contain the trace context
        expect(kafkaHeaders['traceparent']).toBeDefined();
        expect(kafkaHeaders['traceparent'].toString()).toContain(producerTraceId);
      });
      
      // Extract the context from the Kafka headers in a consumer service
      const consumerContext = contextPropagationUtils.extractTraceContextFromKafkaHeaders(kafkaHeaders);
      
      // Verify that the extracted context contains the same trace ID
      const consumerSpanContext = trace.getSpanContext(consumerContext);
      expect(consumerSpanContext).toBeDefined();
      expect(consumerSpanContext?.traceId).toBe(producerTraceId);
      
      // Create a child span in the consumer service
      await context.with(consumerContext, async () => {
        await tracingService.createSpan('kafka-consumer-operation', async () => {
          // Get the current trace info
          const traceInfo = tracingService.getCurrentTraceInfo();
          
          // Verify that the trace ID is preserved
          expect(traceInfo.traceId).toBe(producerTraceId);
          
          // Verify that a new span ID is generated
          expect(traceInfo.spanId).not.toBe(producerSpanId);
        });
      });
    });
    
    it('should propagate journey-specific context through Kafka events', async () => {
      // Create a trace context for a health journey event
      const healthContext = createHealthJourneyContext({
        attributes: {
          'user.id': 'test-user-101',
          'journey.step': 'health-goal-achieved',
          'health.metric': 'steps',
          'health.goal.id': 'goal-123',
        },
      });
      
      // Create Kafka message headers
      const kafkaHeaders: Record<string, Buffer> = {};
      
      // Inject the context into Kafka headers with journey type
      context.with(healthContext, () => {
        contextPropagationUtils.injectTraceContextIntoKafkaHeaders(kafkaHeaders, JourneyType.HEALTH);
      });
      
      // Extract the context in the gamification service
      const gamificationContext = contextPropagationUtils.extractTraceContextFromKafkaHeaders(kafkaHeaders);
      
      // Verify that the contexts are related (same trace ID)
      expect(areContextsRelated(healthContext, gamificationContext)).toBe(true);
      
      // Create a child span in the gamification service
      await context.with(gamificationContext, async () => {
        await tracingService.createJourneySpan(
          'health',
          'process-achievement',
          async () => {
            // Verify that the journey type is preserved
            const currentSpan = trace.getSpan(context.active());
            expect(currentSpan?.attributes['journey.type']).toBe('health');
          },
          { userId: 'test-user-101', journeyId: 'journey-123' }
        );
      });
    });
  });

  describe('gRPC Metadata Trace Context Handling', () => {
    it('should propagate trace context through gRPC metadata', async () => {
      // Create a trace context for the client service
      const clientContext = createPlanJourneyContext({
        attributes: {
          'user.id': 'test-user-202',
          'journey.step': 'plan-benefits-view',
        },
      });
      
      // Get the trace and span IDs from the client context
      const clientSpanContext = trace.getSpanContext(clientContext);
      const clientTraceId = clientSpanContext?.traceId;
      const clientSpanId = clientSpanContext?.spanId;
      
      // Create gRPC metadata (similar structure to HTTP headers)
      const metadata: Record<string, string> = {};
      
      // Inject the context into gRPC metadata
      context.with(clientContext, () => {
        // Use the tracing service to inject context into metadata (same as HTTP headers)
        tracingService.injectTraceContextIntoHeaders(metadata);
        
        // Verify that the metadata contains the trace context
        expect(metadata['traceparent']).toBeDefined();
        expect(metadata['traceparent']).toContain(clientTraceId);
      });
      
      // Extract the context from the gRPC metadata in a server service
      const serverContext = tracingService.extractTraceContextFromHeaders(metadata);
      
      // Verify that the extracted context contains the same trace ID
      const serverSpanContext = trace.getSpanContext(serverContext);
      expect(serverSpanContext).toBeDefined();
      expect(serverSpanContext?.traceId).toBe(clientTraceId);
      
      // Create a child span in the server service
      await context.with(serverContext, async () => {
        await tracingService.createSpan('grpc-server-operation', async () => {
          // Get the current trace info
          const traceInfo = tracingService.getCurrentTraceInfo();
          
          // Verify that the trace ID is preserved
          expect(traceInfo.traceId).toBe(clientTraceId);
          
          // Verify that a new span ID is generated
          expect(traceInfo.spanId).not.toBe(clientSpanId);
        });
      });
    });
  });

  describe('Context Serialization and Deserialization', () => {
    it('should accurately serialize and deserialize trace context', async () => {
      // Create a trace context
      const originalContext = createHealthJourneyContext({
        attributes: {
          'user.id': 'test-user-303',
          'journey.step': 'health-metrics-view',
          'custom.attribute': 'test-value',
        },
      });
      
      // Get the original trace and span IDs
      const originalSpanContext = trace.getSpanContext(originalContext);
      const originalTraceId = originalSpanContext?.traceId;
      const originalSpanId = originalSpanContext?.spanId;
      
      // Serialize the context
      let serializedContext: string;
      context.with(originalContext, () => {
        serializedContext = contextPropagationUtils.serializeTraceContext(JourneyType.HEALTH);
        
        // Verify that the serialized context is a string
        expect(typeof serializedContext).toBe('string');
        expect(serializedContext).toContain(originalTraceId!);
      });
      
      // Deserialize the context
      const deserializedContext = contextPropagationUtils.deserializeTraceContext(serializedContext!);
      
      // Verify that the deserialized context contains the same trace ID
      const deserializedSpanContext = trace.getSpanContext(deserializedContext);
      expect(deserializedSpanContext).toBeDefined();
      expect(deserializedSpanContext?.traceId).toBe(originalTraceId);
      
      // Create a child span with the deserialized context
      await context.with(deserializedContext, async () => {
        await tracingService.createSpan('operation-after-deserialization', async () => {
          // Get the current trace info
          const traceInfo = tracingService.getCurrentTraceInfo();
          
          // Verify that the trace ID is preserved
          expect(traceInfo.traceId).toBe(originalTraceId);
          
          // Verify that a new span ID is generated
          expect(traceInfo.spanId).not.toBe(originalSpanId);
        });
      });
    });
  });

  describe('Journey-Specific Context Propagation', () => {
    it('should propagate health journey context across service boundaries', async () => {
      // Create a health journey context
      const healthContext = createHealthJourneyContext({
        attributes: {
          'user.id': 'test-user-404',
          'journey.step': 'health-metrics-view',
          'health.metric': 'heart-rate',
          'device.id': 'device-123',
        },
      });
      
      // Inject the context into HTTP headers
      const headers: Record<string, string> = {};
      context.with(healthContext, () => {
        tracingService.injectTraceContextIntoHeaders(headers);
      });
      
      // Extract the context in another service
      const extractedContext = tracingService.extractTraceContextFromHeaders(headers);
      
      // Create a child span in the target service with journey context
      await context.with(extractedContext, async () => {
        await tracingService.createJourneySpan(
          'health',
          'process-health-metric',
          async () => {
            // Verify that the journey type is preserved
            const currentSpan = trace.getSpan(context.active());
            expect(currentSpan?.attributes['journey.type']).toBe('health');
          },
          {
            userId: 'test-user-404',
            journeyId: 'journey-404',
            metricType: 'heart-rate',
            deviceId: 'device-123',
          }
        );
      });
    });
    
    it('should propagate care journey context across service boundaries', async () => {
      // Create a care journey context
      const careContext = createCareJourneyContext({
        attributes: {
          'user.id': 'test-user-505',
          'journey.step': 'appointment-booking',
          'provider.id': 'provider-123',
          'appointment.type': 'consultation',
        },
      });
      
      // Inject the context into HTTP headers
      const headers: Record<string, string> = {};
      context.with(careContext, () => {
        tracingService.injectTraceContextIntoHeaders(headers);
      });
      
      // Extract the context in another service
      const extractedContext = tracingService.extractTraceContextFromHeaders(headers);
      
      // Create a child span in the target service with journey context
      await context.with(extractedContext, async () => {
        await tracingService.createJourneySpan(
          'care',
          'process-appointment-booking',
          async () => {
            // Verify that the journey type is preserved
            const currentSpan = trace.getSpan(context.active());
            expect(currentSpan?.attributes['journey.type']).toBe('care');
          },
          {
            userId: 'test-user-505',
            journeyId: 'journey-505',
            appointmentType: 'consultation',
            providerId: 'provider-123',
          }
        );
      });
    });
    
    it('should propagate plan journey context across service boundaries', async () => {
      // Create a plan journey context
      const planContext = createPlanJourneyContext({
        attributes: {
          'user.id': 'test-user-606',
          'journey.step': 'claim-submission',
          'plan.id': 'plan-123',
          'claim.type': 'medical',
        },
      });
      
      // Inject the context into HTTP headers
      const headers: Record<string, string> = {};
      context.with(planContext, () => {
        tracingService.injectTraceContextIntoHeaders(headers);
      });
      
      // Extract the context in another service
      const extractedContext = tracingService.extractTraceContextFromHeaders(headers);
      
      // Create a child span in the target service with journey context
      await context.with(extractedContext, async () => {
        await tracingService.createJourneySpan(
          'plan',
          'process-claim-submission',
          async () => {
            // Verify that the journey type is preserved
            const currentSpan = trace.getSpan(context.active());
            expect(currentSpan?.attributes['journey.type']).toBe('plan');
          },
          {
            userId: 'test-user-606',
            journeyId: 'journey-606',
            claimType: 'medical',
            planId: 'plan-123',
          }
        );
      });
    });
  });

  describe('Cross-Journey Trace Context Propagation', () => {
    it('should maintain trace context across different journeys', async () => {
      // Create a health journey context
      const healthContext = createHealthJourneyContext({
        attributes: {
          'user.id': 'test-user-707',
          'journey.step': 'health-goal-achieved',
        },
      });
      
      // Get the trace ID from the health context
      const healthSpanContext = trace.getSpanContext(healthContext);
      const traceId = healthSpanContext?.traceId;
      
      // Inject the context into HTTP headers
      const headers: Record<string, string> = {};
      context.with(healthContext, () => {
        tracingService.injectTraceContextIntoHeaders(headers);
      });
      
      // Extract the context in the gamification service
      const gamificationContext = tracingService.extractTraceContextFromHeaders(headers);
      
      // Create a gamification span
      await context.with(gamificationContext, async () => {
        await tracingService.createSpan('process-achievement', async () => {
          // Get the current trace info
          const traceInfo = tracingService.getCurrentTraceInfo();
          
          // Verify that the trace ID is preserved
          expect(traceInfo.traceId).toBe(traceId);
          
          // Add gamification-specific attributes
          const currentSpan = trace.getSpan(context.active());
          currentSpan?.setAttribute('achievement.id', 'achievement-123');
          currentSpan?.setAttribute('points.awarded', 100);
        });
      });
      
      // Now propagate to the plan journey
      const planHeaders: Record<string, string> = {};
      context.with(gamificationContext, () => {
        tracingService.injectTraceContextIntoHeaders(planHeaders);
      });
      
      // Extract the context in the plan service
      const planContext = tracingService.extractTraceContextFromHeaders(planHeaders);
      
      // Create a plan journey span
      await context.with(planContext, async () => {
        await tracingService.createJourneySpan(
          'plan',
          'award-benefit',
          async () => {
            // Verify that the trace ID is preserved across all three services
            const traceInfo = tracingService.getCurrentTraceInfo();
            expect(traceInfo.traceId).toBe(traceId);
            
            // Add plan-specific attributes
            const currentSpan = trace.getSpan(context.active());
            currentSpan?.setAttribute('benefit.id', 'benefit-123');
            currentSpan?.setAttribute('benefit.type', 'discount');
          },
          {
            userId: 'test-user-707',
            journeyId: 'journey-707',
          }
        );
      });
    });
  });

  describe('Business Transaction Tracking', () => {
    it('should track business transactions across services', async () => {
      // Create a mock tracer for this test
      const mockTracer = createMockTracer({
        serviceName: 'business-transaction-service',
      });
      
      // Create a unique transaction ID
      const transactionId = 'txn-' + Date.now();
      
      // Start a transaction in the care service
      await mockTracer.createSpan('start-appointment-booking', async () => {
        // Add business transaction ID
        mockTracer.addAttribute('transaction.id', transactionId);
        mockTracer.addAttribute('journey.type', 'care');
        mockTracer.addAttribute('business.operation', 'appointment-booking');
        mockTracer.addAttribute('user.id', 'test-user-808');
        
        // Get correlation IDs for propagation
        const correlationIds = mockTracer.getCorrelationIds();
        
        // Simulate calling the provider service
        await mockTracer.createSpan('check-provider-availability', async () => {
          mockTracer.addAttribute('transaction.id', transactionId);
          mockTracer.addAttribute('provider.id', 'provider-123');
          mockTracer.addAttribute('appointment.slot', '2023-06-01T10:00:00Z');
        });
        
        // Simulate calling the notification service
        await mockTracer.createSpan('send-appointment-confirmation', async () => {
          mockTracer.addAttribute('transaction.id', transactionId);
          mockTracer.addAttribute('notification.type', 'email');
          mockTracer.addAttribute('notification.template', 'appointment-confirmation');
        });
      });
      
      // Verify that all spans in the transaction have the same transaction ID
      const transactionSpans = mockTracer.getSpans({
        attributeKey: 'transaction.id',
        attributeValue: transactionId,
      });
      
      expect(transactionSpans.length).toBe(3);
      
      // Verify that all spans have the same trace ID
      const traceId = transactionSpans[0].attributes['trace.id'];
      transactionSpans.forEach(span => {
        expect(span.attributes['trace.id']).toBe(traceId);
      });
    });
  });
});
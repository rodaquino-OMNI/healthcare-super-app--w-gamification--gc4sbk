/**
 * Integration tests for trace context propagation across service boundaries
 * 
 * These tests verify the correct propagation of trace context across different
 * transport mechanisms, ensuring end-to-end tracing capabilities throughout
 * the AUSTA SuperApp.
 */

import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { KafkaMessage, Message, ProducerRecord } from 'kafkajs';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { Metadata } from '@grpc/grpc-js';

import {
  extractContextFromHttpHeaders,
  injectContextIntoHttpHeaders,
  extractContextFromKafkaMessage,
  injectContextIntoKafkaMessage,
  serializeContext,
  deserializeContext,
  createJourneyContext,
  extractJourneyContext,
  getCurrentTraceId,
  getCurrentSpanId,
  getCorrelationId,
  JourneyType,
  TRACE_HEADER_NAMES,
} from '../../src/utils/context-propagation';

/**
 * Mock HTTP headers for testing
 */
class MockHttpHeaders implements Record<string, string | string[] | undefined> {
  private headers: Record<string, string> = {};

  constructor(initialHeaders?: Record<string, string>) {
    if (initialHeaders) {
      this.headers = { ...initialHeaders };
    }
  }

  get(key: string): string | undefined {
    return this.headers[key.toLowerCase()];
  }

  set(key: string, value: string): void {
    this.headers[key.toLowerCase()] = value;
  }

  keys(): string[] {
    return Object.keys(this.headers);
  }

  getAll(): Record<string, string> {
    return { ...this.headers };
  }
}

/**
 * Mock Kafka message for testing
 */
class MockKafkaMessage implements KafkaMessage {
  key: Buffer | null = null;
  value: Buffer | null = null;
  timestamp: string = Date.now().toString();
  size: number = 0;
  attributes: number = 0;
  offset: string = '0';
  headers: Record<string, any> = {};

  constructor(initialHeaders?: Record<string, any>) {
    if (initialHeaders) {
      this.headers = { ...initialHeaders };
    }
  }
}

/**
 * Mock gRPC metadata for testing
 */
class MockGrpcMetadata {
  private metadata: Record<string, string> = {};

  constructor(initialMetadata?: Record<string, string>) {
    if (initialMetadata) {
      this.metadata = { ...initialMetadata };
    }
  }

  get(key: string): string | undefined {
    return this.metadata[key.toLowerCase()];
  }

  set(key: string, value: string): void {
    this.metadata[key.toLowerCase()] = value;
  }

  getAll(): Record<string, string> {
    return { ...this.metadata };
  }
}

/**
 * Helper function to create a span and context for testing
 */
function createTestSpanAndContext() {
  const tracer = trace.getTracer('test-tracer');
  const span = tracer.startSpan('test-span');
  const ctx = trace.setSpan(context.active(), span);
  return { span, ctx };
}

describe('Trace Context Propagation Integration Tests', () => {
  describe('HTTP Header Context Propagation', () => {
    it('should inject and extract trace context from HTTP headers', () => {
      // Create a span and context
      const { span, ctx } = createTestSpanAndContext();
      
      try {
        // Create mock HTTP headers
        const headers = new MockHttpHeaders();
        
        // Inject context into headers
        injectContextIntoHttpHeaders(ctx, headers);
        
        // Verify headers contain trace context
        expect(headers.get(TRACE_HEADER_NAMES.TRACE_PARENT)).toBeDefined();
        
        // Extract context from headers
        const extractedContext = extractContextFromHttpHeaders(headers);
        const extractedSpanContext = trace.getSpanContext(extractedContext);
        const originalSpanContext = trace.getSpanContext(ctx);
        
        // Verify trace and span IDs match
        expect(extractedSpanContext?.traceId).toBe(originalSpanContext?.traceId);
        expect(extractedSpanContext?.spanId).not.toBe(originalSpanContext?.spanId); // Span ID should be different
        expect(extractedSpanContext?.traceFlags).toBe(originalSpanContext?.traceFlags);
      } finally {
        // End the span
        span.end();
      }
    });

    it('should propagate trace context across multiple HTTP requests', () => {
      // Create a span and context for the first service
      const { span: serviceASpan, ctx: serviceAContext } = createTestSpanAndContext();
      
      try {
        // Service A injects context into outgoing request headers
        const outgoingHeaders = new MockHttpHeaders();
        injectContextIntoHttpHeaders(serviceAContext, outgoingHeaders);
        
        // Service B receives the request and extracts context
        const serviceBContext = extractContextFromHttpHeaders(outgoingHeaders);
        const serviceBTracer = trace.getTracer('service-b-tracer');
        const serviceBSpan = serviceBTracer.startSpan('service-b-operation', {}, serviceBContext);
        const enhancedServiceBContext = trace.setSpan(serviceBContext, serviceBSpan);
        
        try {
          // Service B makes a request to Service C
          const outgoingHeadersToC = new MockHttpHeaders();
          injectContextIntoHttpHeaders(enhancedServiceBContext, outgoingHeadersToC);
          
          // Service C receives the request and extracts context
          const serviceCContext = extractContextFromHttpHeaders(outgoingHeadersToC);
          const serviceCSpanContext = trace.getSpanContext(serviceCContext);
          const originalSpanContext = trace.getSpanContext(serviceAContext);
          
          // Verify trace ID is preserved across all services
          expect(serviceCSpanContext?.traceId).toBe(originalSpanContext?.traceId);
          
          // Verify span IDs are different (new spans created in each service)
          const serviceBSpanContext = trace.getSpanContext(enhancedServiceBContext);
          expect(serviceBSpanContext?.spanId).not.toBe(originalSpanContext?.spanId);
          expect(serviceCSpanContext?.spanId).not.toBe(serviceBSpanContext?.spanId);
        } finally {
          serviceBSpan.end();
        }
      } finally {
        serviceASpan.end();
      }
    });

    it('should include journey context in HTTP headers', () => {
      // Create a journey-specific context
      const journeyContext = createJourneyContext(JourneyType.HEALTH, {
        userId: 'user-123',
        sessionId: 'session-456',
        journeyId: 'health-journey-789'
      });
      
      // Create a span with the journey context
      const tracer = trace.getTracer('journey-tracer');
      const span = tracer.startSpan('health-operation', {}, journeyContext);
      const ctx = trace.setSpan(journeyContext, span);
      
      try {
        // Inject context into headers
        const headers = new MockHttpHeaders();
        injectContextIntoHttpHeaders(ctx, headers);
        
        // Extract context from headers
        const extractedContext = extractContextFromHttpHeaders(headers);
        
        // Extract journey context
        const extractedJourneyContext = extractJourneyContext(extractedContext);
        
        // Verify journey context is preserved
        expect(extractedJourneyContext).toBeDefined();
        expect(extractedJourneyContext?.journeyType).toBe(JourneyType.HEALTH);
        expect(extractedJourneyContext?.userId).toBe('user-123');
        expect(extractedJourneyContext?.sessionId).toBe('session-456');
        expect(extractedJourneyContext?.journeyId).toBe('health-journey-789');
      } finally {
        span.end();
      }
    });
  });

  describe('Kafka Message Context Propagation', () => {
    it('should inject and extract trace context from Kafka message headers', () => {
      // Create a span and context
      const { span, ctx } = createTestSpanAndContext();
      
      try {
        // Create mock Kafka message
        const message: Message = {
          key: Buffer.from('test-key'),
          value: Buffer.from(JSON.stringify({ data: 'test-data' })),
          headers: {}
        };
        
        // Inject context into Kafka message
        injectContextIntoKafkaMessage(ctx, message);
        
        // Verify message headers contain trace context
        expect(message.headers?.[TRACE_HEADER_NAMES.TRACE_PARENT]).toBeDefined();
        
        // Extract context from Kafka message
        const kafkaMessage = new MockKafkaMessage(message.headers);
        const extractedContext = extractContextFromKafkaMessage(kafkaMessage);
        const extractedSpanContext = trace.getSpanContext(extractedContext);
        const originalSpanContext = trace.getSpanContext(ctx);
        
        // Verify trace and span IDs match
        expect(extractedSpanContext?.traceId).toBe(originalSpanContext?.traceId);
        expect(extractedSpanContext?.traceFlags).toBe(originalSpanContext?.traceFlags);
      } finally {
        span.end();
      }
    });

    it('should propagate trace context across Kafka producer and consumer', () => {
      // Create a span and context for the producer service
      const { span: producerSpan, ctx: producerContext } = createTestSpanAndContext();
      
      try {
        // Producer service creates a Kafka message
        const producerRecord: ProducerRecord = {
          topic: 'test-topic',
          messages: [
            {
              key: 'test-key',
              value: JSON.stringify({ event: 'test-event' }),
              headers: {}
            }
          ],
          headers: {}
        };
        
        // Inject context into Kafka producer record
        injectContextIntoKafkaMessage(producerContext, producerRecord.messages[0]);
        
        // Consumer service receives the Kafka message
        const consumerMessage = new MockKafkaMessage(producerRecord.messages[0].headers);
        const consumerContext = extractContextFromKafkaMessage(consumerMessage);
        
        // Consumer service creates a span for processing
        const consumerTracer = trace.getTracer('consumer-tracer');
        const consumerSpan = consumerTracer.startSpan('process-message', {}, consumerContext);
        const enhancedConsumerContext = trace.setSpan(consumerContext, consumerSpan);
        
        try {
          // Verify trace context is preserved
          const consumerSpanContext = trace.getSpanContext(enhancedConsumerContext);
          const producerSpanContext = trace.getSpanContext(producerContext);
          
          expect(consumerSpanContext?.traceId).toBe(producerSpanContext?.traceId);
          expect(consumerSpanContext?.spanId).not.toBe(producerSpanContext?.spanId);
        } finally {
          consumerSpan.end();
        }
      } finally {
        producerSpan.end();
      }
    });

    it('should include journey context in Kafka messages', () => {
      // Create a journey-specific context for the Care journey
      const journeyContext = createJourneyContext(JourneyType.CARE, {
        userId: 'user-456',
        sessionId: 'session-789',
        journeyId: 'care-journey-123',
        appointmentId: 'appointment-456' // Care journey specific context
      });
      
      // Create a span with the journey context
      const tracer = trace.getTracer('journey-tracer');
      const span = tracer.startSpan('care-operation', {}, journeyContext);
      const ctx = trace.setSpan(journeyContext, span);
      
      try {
        // Create Kafka message
        const message: Message = {
          key: Buffer.from('appointment-update'),
          value: Buffer.from(JSON.stringify({ status: 'confirmed' })),
          headers: {}
        };
        
        // Inject context into Kafka message
        injectContextIntoKafkaMessage(ctx, message);
        
        // Extract context from Kafka message
        const kafkaMessage = new MockKafkaMessage(message.headers);
        const extractedContext = extractContextFromKafkaMessage(kafkaMessage);
        
        // Extract journey context
        const extractedJourneyContext = extractJourneyContext(extractedContext);
        
        // Verify journey context is preserved
        expect(extractedJourneyContext).toBeDefined();
        expect(extractedJourneyContext?.journeyType).toBe(JourneyType.CARE);
        expect(extractedJourneyContext?.userId).toBe('user-456');
        expect(extractedJourneyContext?.sessionId).toBe('session-789');
        expect(extractedJourneyContext?.journeyId).toBe('care-journey-123');
        expect(extractedJourneyContext?.appointmentId).toBe('appointment-456');
      } finally {
        span.end();
      }
    });
  });

  describe('gRPC Metadata Context Propagation', () => {
    it('should inject and extract trace context from gRPC metadata', () => {
      // Create a span and context
      const { span, ctx } = createTestSpanAndContext();
      
      try {
        // Create mock gRPC metadata
        const metadata = new MockGrpcMetadata();
        
        // Inject context into gRPC metadata (using the same mechanism as HTTP headers)
        injectContextIntoHttpHeaders(ctx, metadata);
        
        // Verify metadata contains trace context
        expect(metadata.get(TRACE_HEADER_NAMES.TRACE_PARENT)).toBeDefined();
        
        // Extract context from gRPC metadata
        const extractedContext = extractContextFromHttpHeaders(metadata);
        const extractedSpanContext = trace.getSpanContext(extractedContext);
        const originalSpanContext = trace.getSpanContext(ctx);
        
        // Verify trace and span IDs match
        expect(extractedSpanContext?.traceId).toBe(originalSpanContext?.traceId);
        expect(extractedSpanContext?.traceFlags).toBe(originalSpanContext?.traceFlags);
      } finally {
        span.end();
      }
    });

    it('should propagate trace context across multiple gRPC services', () => {
      // Create a span and context for the first service
      const { span: serviceASpan, ctx: serviceAContext } = createTestSpanAndContext();
      
      try {
        // Service A injects context into outgoing gRPC metadata
        const outgoingMetadata = new MockGrpcMetadata();
        injectContextIntoHttpHeaders(serviceAContext, outgoingMetadata);
        
        // Service B receives the request and extracts context
        const serviceBContext = extractContextFromHttpHeaders(outgoingMetadata);
        const serviceBTracer = trace.getTracer('service-b-tracer');
        const serviceBSpan = serviceBTracer.startSpan('service-b-operation', {}, serviceBContext);
        const enhancedServiceBContext = trace.setSpan(serviceBContext, serviceBSpan);
        
        try {
          // Service B makes a request to Service C
          const outgoingMetadataToC = new MockGrpcMetadata();
          injectContextIntoHttpHeaders(enhancedServiceBContext, outgoingMetadataToC);
          
          // Service C receives the request and extracts context
          const serviceCContext = extractContextFromHttpHeaders(outgoingMetadataToC);
          const serviceCSpanContext = trace.getSpanContext(serviceCContext);
          const originalSpanContext = trace.getSpanContext(serviceAContext);
          
          // Verify trace ID is preserved across all services
          expect(serviceCSpanContext?.traceId).toBe(originalSpanContext?.traceId);
          
          // Verify span IDs are different (new spans created in each service)
          const serviceBSpanContext = trace.getSpanContext(enhancedServiceBContext);
          expect(serviceBSpanContext?.spanId).not.toBe(originalSpanContext?.spanId);
          expect(serviceCSpanContext?.spanId).not.toBe(serviceBSpanContext?.spanId);
        } finally {
          serviceBSpan.end();
        }
      } finally {
        serviceASpan.end();
      }
    });
  });

  describe('Context Serialization and Deserialization', () => {
    it('should correctly serialize and deserialize trace context', () => {
      // Create a span and context
      const { span, ctx } = createTestSpanAndContext();
      
      try {
        // Serialize context
        const serializedContext = serializeContext(ctx);
        
        // Verify serialized context is a string
        expect(typeof serializedContext).toBe('string');
        expect(serializedContext.length).toBeGreaterThan(0);
        
        // Deserialize context
        const deserializedContext = deserializeContext(serializedContext);
        const deserializedSpanContext = trace.getSpanContext(deserializedContext);
        const originalSpanContext = trace.getSpanContext(ctx);
        
        // Verify trace and span IDs match
        expect(deserializedSpanContext?.traceId).toBe(originalSpanContext?.traceId);
        expect(deserializedSpanContext?.traceFlags).toBe(originalSpanContext?.traceFlags);
      } finally {
        span.end();
      }
    });

    it('should handle invalid serialized context gracefully', () => {
      // Create invalid serialized context
      const invalidSerializedContext = 'not-a-valid-context';
      
      // Deserialize invalid context
      const deserializedContext = deserializeContext(invalidSerializedContext);
      
      // Verify a default context is returned
      expect(deserializedContext).toBeDefined();
      // The default context should be the active context
      expect(deserializedContext).toBe(context.active());
    });
  });

  describe('Journey-Specific Context Propagation', () => {
    it('should propagate Health journey context across service boundaries', () => {
      // Create Health journey context
      const healthJourneyContext = createJourneyContext(JourneyType.HEALTH, {
        userId: 'user-123',
        journeyId: 'health-journey-456',
        metricType: 'blood-pressure',
        deviceId: 'device-789'
      });
      
      // Create a span with the journey context
      const tracer = trace.getTracer('health-journey-tracer');
      const span = tracer.startSpan('record-health-metric', {}, healthJourneyContext);
      const ctx = trace.setSpan(healthJourneyContext, span);
      
      try {
        // Simulate HTTP request from Health service to Gamification service
        const headers = new MockHttpHeaders();
        injectContextIntoHttpHeaders(ctx, headers);
        
        // Gamification service receives the request
        const gamificationContext = extractContextFromHttpHeaders(headers);
        const extractedJourneyContext = extractJourneyContext(gamificationContext);
        
        // Verify journey context is preserved
        expect(extractedJourneyContext).toBeDefined();
        expect(extractedJourneyContext?.journeyType).toBe(JourneyType.HEALTH);
        expect(extractedJourneyContext?.userId).toBe('user-123');
        expect(extractedJourneyContext?.journeyId).toBe('health-journey-456');
        expect(extractedJourneyContext?.metricType).toBe('blood-pressure');
        expect(extractedJourneyContext?.deviceId).toBe('device-789');
        
        // Gamification service creates an event for the Notification service
        const gamificationTracer = trace.getTracer('gamification-tracer');
        const gamificationSpan = gamificationTracer.startSpan('process-achievement', {}, gamificationContext);
        const enhancedGamificationContext = trace.setSpan(gamificationContext, gamificationSpan);
        
        try {
          // Create Kafka message to Notification service
          const message: Message = {
            key: Buffer.from('achievement-unlocked'),
            value: Buffer.from(JSON.stringify({ achievementId: 'health-milestone' })),
            headers: {}
          };
          
          // Inject context into Kafka message
          injectContextIntoKafkaMessage(enhancedGamificationContext, message);
          
          // Notification service receives the message
          const kafkaMessage = new MockKafkaMessage(message.headers);
          const notificationContext = extractContextFromKafkaMessage(kafkaMessage);
          const notificationJourneyContext = extractJourneyContext(notificationContext);
          
          // Verify journey context is preserved through the entire chain
          expect(notificationJourneyContext).toBeDefined();
          expect(notificationJourneyContext?.journeyType).toBe(JourneyType.HEALTH);
          expect(notificationJourneyContext?.userId).toBe('user-123');
          expect(notificationJourneyContext?.journeyId).toBe('health-journey-456');
          expect(notificationJourneyContext?.metricType).toBe('blood-pressure');
          expect(notificationJourneyContext?.deviceId).toBe('device-789');
          
          // Verify trace ID is preserved across all services
          const notificationSpanContext = trace.getSpanContext(notificationContext);
          const originalSpanContext = trace.getSpanContext(ctx);
          expect(notificationSpanContext?.traceId).toBe(originalSpanContext?.traceId);
        } finally {
          gamificationSpan.end();
        }
      } finally {
        span.end();
      }
    });

    it('should propagate Plan journey context across service boundaries', () => {
      // Create Plan journey context
      const planJourneyContext = createJourneyContext(JourneyType.PLAN, {
        userId: 'user-789',
        journeyId: 'plan-journey-123',
        planId: 'health-plan-456',
        claimId: 'claim-789'
      });
      
      // Create a span with the journey context
      const tracer = trace.getTracer('plan-journey-tracer');
      const span = tracer.startSpan('submit-claim', {}, planJourneyContext);
      const ctx = trace.setSpan(planJourneyContext, span);
      
      try {
        // Simulate gRPC call from Plan service to Auth service
        const metadata = new MockGrpcMetadata();
        injectContextIntoHttpHeaders(ctx, metadata);
        
        // Auth service receives the request
        const authContext = extractContextFromHttpHeaders(metadata);
        const extractedJourneyContext = extractJourneyContext(authContext);
        
        // Verify journey context is preserved
        expect(extractedJourneyContext).toBeDefined();
        expect(extractedJourneyContext?.journeyType).toBe(JourneyType.PLAN);
        expect(extractedJourneyContext?.userId).toBe('user-789');
        expect(extractedJourneyContext?.journeyId).toBe('plan-journey-123');
        expect(extractedJourneyContext?.planId).toBe('health-plan-456');
        expect(extractedJourneyContext?.claimId).toBe('claim-789');
      } finally {
        span.end();
      }
    });
  });

  describe('Correlation ID Generation', () => {
    it('should generate consistent correlation IDs from trace context', () => {
      // Create a span and context
      const { span, ctx } = createTestSpanAndContext();
      
      try {
        // Get correlation ID
        const correlationId = getCorrelationId(ctx);
        
        // Verify correlation ID format
        expect(correlationId).toBeDefined();
        expect(correlationId).toContain('.');
        
        const [traceId, spanId] = correlationId.split('.');
        const spanContext = trace.getSpanContext(ctx);
        
        // Verify correlation ID contains trace ID and span ID
        expect(traceId).toBe(spanContext?.traceId);
        expect(spanId).toBe(spanContext?.spanId);
      } finally {
        span.end();
      }
    });

    it('should generate fallback correlation ID when no trace context exists', () => {
      // Create empty context
      const emptyContext = context.active();
      
      // Get correlation ID
      const correlationId = getCorrelationId(emptyContext);
      
      // Verify fallback correlation ID format
      expect(correlationId).toBeDefined();
      expect(correlationId).toContain('no-trace.');
    });

    it('should provide consistent trace and span IDs from active context', () => {
      // Create a span and context
      const { span, ctx } = createTestSpanAndContext();
      
      try {
        // Make the context active
        context.with(ctx, () => {
          // Get trace and span IDs
          const traceId = getCurrentTraceId();
          const spanId = getCurrentSpanId();
          
          // Verify IDs match the context
          const spanContext = trace.getSpanContext(ctx);
          expect(traceId).toBe(spanContext?.traceId);
          expect(spanId).toBe(spanContext?.spanId);
        });
      } finally {
        span.end();
      }
    });
  });
});
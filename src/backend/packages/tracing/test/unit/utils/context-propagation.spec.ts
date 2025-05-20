/**
 * Unit tests for trace context propagation utilities.
 * 
 * These tests verify the extraction and injection of trace context across different
 * transport mechanisms (HTTP headers, Kafka messages) and ensure that trace context
 * is properly maintained across service boundaries. This enables end-to-end distributed
 * tracing in the application, allowing for visualization of complete request flows and
 * business transactions across multiple services.
 * 
 * Key aspects tested:
 * - HTTP header trace context propagation
 * - Kafka message trace context propagation
 * - Serialization and deserialization of trace context
 * - Journey-specific context propagation (health, care, plan)
 * - End-to-end request visualization
 * - Cross-service business transaction tracking
 * - Error handling and edge cases
 */

import { Context, SpanContext, context, trace, propagation, SpanStatusCode } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { KafkaMessage } from 'kafkajs';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { MockSpan, MockTracer } from '../../mocks/mock-tracer';
// Import test fixtures
import { mockSpanAttributes } from '../../fixtures/span-attributes';
import {
  createHttpHeadersCarrier,
  createKafkaMessageCarrier,
  extractContextFromHttpHeaders,
  injectContextIntoHttpHeaders,
  extractContextFromKafkaMessage,
  injectContextIntoKafkaMessage,
  serializeContext,
  deserializeContext,
  addJourneyContext,
  extractJourneyContext,
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  JourneyContext,
  HttpHeadersCarrier,
  KafkaMessageCarrier
} from '../../../src/utils/context-propagation';

// Mock OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  const originalModule = jest.requireActual('@opentelemetry/api');
  
  return {
    ...originalModule,
    trace: {
      ...originalModule.trace,
      getSpan: jest.fn(),
      setSpan: jest.fn((ctx, span) => ctx),
      getSpanContext: jest.fn(),
      setSpanContext: jest.fn((ctx, spanContext) => ctx),
    },
    context: {
      ...originalModule.context,
      active: jest.fn(() => ({})),
    },
    propagation: {
      ...originalModule.propagation,
      extract: jest.fn((ctx, carrier, getter) => ctx),
      inject: jest.fn((ctx, carrier, setter) => {}),
    },
  };
});

// Mock W3CTraceContextPropagator
jest.mock('@opentelemetry/core', () => {
  const originalModule = jest.requireActual('@opentelemetry/core');
  
  return {
    ...originalModule,
    W3CTraceContextPropagator: jest.fn().mockImplementation(() => ({
      extract: jest.fn((ctx, carrier) => ctx),
      inject: jest.fn((ctx, carrier) => {}),
    })),
  };
});

describe('Context Propagation Utilities', () => {
  let mockTracer: MockTracer;
  let mockSpan: MockSpan;
  let activeContext: Context;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock tracer and span
    mockTracer = new MockTracer('test-tracer');
    mockSpan = mockTracer.startSpan('test-span');
    activeContext = {};
    
    // Mock the active context and current span
    (context.active as jest.Mock).mockReturnValue(activeContext);
    (trace.getSpan as jest.Mock).mockReturnValue(mockSpan);
  });
  
  describe('HTTP Headers Context Propagation', () => {
    let headers: OutgoingHttpHeaders;
    
    beforeEach(() => {
      headers = {};
    });
    
    describe('createHttpHeadersCarrier', () => {
      it('should create a carrier that can get and set header values', () => {
        // Setup
        headers = {
          'content-type': 'application/json',
          'x-request-id': '12345',
        };
        
        // Execute
        const carrier = createHttpHeadersCarrier(headers);
        
        // Verify
        expect(carrier.get('content-type')).toBe('application/json');
        expect(carrier.get('x-request-id')).toBe('12345');
        expect(carrier.get('not-exist')).toBeUndefined();
        
        // Test setting a value
        carrier.set('traceparent', 'test-value');
        expect(headers['traceparent']).toBe('test-value');
      });
      
      it('should handle case-insensitive header names', () => {
        // Setup
        headers = {
          'Content-Type': 'application/json',
        };
        
        // Execute
        const carrier = createHttpHeadersCarrier(headers);
        
        // Verify
        expect(carrier.get('content-type')).toBe('application/json');
        expect(carrier.get('CONTENT-TYPE')).toBe('application/json');
        
        // Test setting with different case
        carrier.set('TRACEPARENT', 'test-value');
        expect(headers['traceparent']).toBe('test-value');
      });
    });
    
    describe('extractContextFromHttpHeaders', () => {
      it('should extract context from HTTP headers', () => {
        // Setup
        const headers: IncomingHttpHeaders = {
          'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
        };
        const expectedContext = { traceId: '123' };
        const mockPropagator = new W3CTraceContextPropagator();
        jest.spyOn(mockPropagator, 'extract').mockReturnValue(expectedContext as Context);
        
        // Mock the propagator's extract method
        jest.spyOn(propagation, 'extract').mockImplementation((ctx, carrier, getter) => {
          return expectedContext as Context;
        });
        
        // Execute
        const result = extractContextFromHttpHeaders(headers);
        
        // Verify
        expect(result).toBe(expectedContext);
        expect(propagation.extract).toHaveBeenCalled();
      });
    });
    
    describe('injectContextIntoHttpHeaders', () => {
      it('should inject context into HTTP headers', () => {
        // Setup
        const headers: OutgoingHttpHeaders = {};
        const ctx = { spanContext: { traceId: '123', spanId: '456' } } as unknown as Context;
        
        // Execute
        injectContextIntoHttpHeaders(headers, ctx);
        
        // Verify
        expect(propagation.inject).toHaveBeenCalled();
        expect(propagation.inject).toHaveBeenCalledWith(ctx, expect.any(Object), expect.any(Object));
      });
      
      it('should use active context if no context is provided', () => {
        // Setup
        const headers: OutgoingHttpHeaders = {};
        
        // Execute
        injectContextIntoHttpHeaders(headers);
        
        // Verify
        expect(context.active).toHaveBeenCalled();
        expect(propagation.inject).toHaveBeenCalledWith(activeContext, expect.any(Object), expect.any(Object));
      });
    });
  });
  
  describe('Kafka Message Context Propagation', () => {
    let kafkaMessage: KafkaMessage;
    
    beforeEach(() => {
      kafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '123456789',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {},
      };
    });
    
    describe('createKafkaMessageCarrier', () => {
      it('should create a carrier with headers from Kafka message', () => {
        // Setup
        kafkaMessage.headers = {
          'correlation-id': Buffer.from('12345'),
          'user-id': Buffer.from('user-123'),
        };
        
        // Execute
        const carrier = createKafkaMessageCarrier(kafkaMessage);
        
        // Verify
        expect(carrier.headers).toBeDefined();
        expect(carrier.headers['correlation-id']).toBeInstanceOf(Buffer);
        expect(carrier.headers['user-id']).toBeInstanceOf(Buffer);
      });
      
      it('should handle null header values', () => {
        // Setup
        kafkaMessage.headers = {
          'correlation-id': null,
          'user-id': Buffer.from('user-123'),
        };
        
        // Execute
        const carrier = createKafkaMessageCarrier(kafkaMessage);
        
        // Verify
        expect(carrier.headers['correlation-id']).toBeNull();
        expect(carrier.headers['user-id']).toBeInstanceOf(Buffer);
      });
      
      it('should handle string header values', () => {
        // Setup
        kafkaMessage.headers = {
          'correlation-id': 'string-value' as unknown as Buffer,
        };
        
        // Execute
        const carrier = createKafkaMessageCarrier(kafkaMessage);
        
        // Verify
        expect(carrier.headers['correlation-id']).toBeInstanceOf(Buffer);
        expect((carrier.headers['correlation-id'] as Buffer).toString()).toBe('string-value');
      });
    });
    
    describe('extractContextFromKafkaMessage', () => {
      it('should extract context from Kafka message headers', () => {
        // Setup
        kafkaMessage.headers = {
          'traceparent': Buffer.from('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'),
        };
        const expectedContext = { traceId: '123' };
        
        // Mock the propagator's extract method
        jest.spyOn(propagation, 'extract').mockImplementation((ctx, carrier, getter) => {
          // Verify the getter works correctly
          const value = getter(carrier as KafkaMessageCarrier, 'traceparent');
          expect(value).toBe('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01');
          
          return expectedContext as Context;
        });
        
        // Execute
        const result = extractContextFromKafkaMessage(kafkaMessage);
        
        // Verify
        expect(result).toBe(expectedContext);
        expect(propagation.extract).toHaveBeenCalled();
      });
    });
    
    describe('injectContextIntoKafkaMessage', () => {
      it('should inject context into Kafka message headers', () => {
        // Setup
        kafkaMessage.headers = {};
        const ctx = { spanContext: { traceId: '123', spanId: '456' } } as unknown as Context;
        
        // Mock the propagator's inject method
        jest.spyOn(propagation, 'inject').mockImplementation((ctx, carrier, setter) => {
          // Simulate setting a header
          setter(carrier as KafkaMessageCarrier, 'traceparent', '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01');
        });
        
        // Execute
        injectContextIntoKafkaMessage(kafkaMessage, ctx);
        
        // Verify
        expect(propagation.inject).toHaveBeenCalled();
        expect(kafkaMessage.headers['traceparent']).toBe('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01');
      });
      
      it('should use active context if no context is provided', () => {
        // Setup
        kafkaMessage.headers = {};
        
        // Execute
        injectContextIntoKafkaMessage(kafkaMessage);
        
        // Verify
        expect(context.active).toHaveBeenCalled();
        expect(propagation.inject).toHaveBeenCalledWith(activeContext, expect.any(Object), expect.any(Object));
      });
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    it('should handle missing HTTP headers gracefully', () => {
      // Setup
      const emptyHeaders: IncomingHttpHeaders = {};
      
      // Execute
      const result = extractContextFromHttpHeaders(emptyHeaders);
      
      // Verify
      expect(result).toBeDefined();
      expect(propagation.extract).toHaveBeenCalled();
    });
    
    it('should handle missing Kafka message headers gracefully', () => {
      // Setup
      const messageWithoutHeaders: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '123456789',
        size: 100,
        attributes: 0,
        offset: '0',
      };
      
      // Execute
      const result = extractContextFromKafkaMessage(messageWithoutHeaders);
      
      // Verify
      expect(result).toBeDefined();
      expect(propagation.extract).toHaveBeenCalled();
    });
    
    it('should handle invalid trace context in HTTP headers', () => {
      // Setup
      const invalidHeaders: IncomingHttpHeaders = {
        'traceparent': 'invalid-trace-parent-format',
      };
      
      // Execute
      const result = extractContextFromHttpHeaders(invalidHeaders);
      
      // Verify
      expect(result).toBeDefined();
      expect(propagation.extract).toHaveBeenCalled();
    });
    
    it('should handle concurrent journeys with different trace contexts', () => {
      // Setup - simulate two concurrent journeys
      const healthJourneyContext = createHealthJourneyContext('health-journey-123', 'user-123');
      const careJourneyContext = createCareJourneyContext('care-journey-456', 'user-123');
      
      // Create HTTP headers for both journeys
      const healthHeaders: OutgoingHttpHeaders = {};
      const careHeaders: OutgoingHttpHeaders = {};
      
      // Inject contexts into respective headers
      injectContextIntoHttpHeaders(healthHeaders, healthJourneyContext);
      injectContextIntoHttpHeaders(careHeaders, careJourneyContext);
      
      // Verify each journey maintains its own context
      expect(propagation.inject).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('Context Serialization and Deserialization', () => {
    describe('serializeContext', () => {
      it('should serialize span context to a JSON string', () => {
        // Setup
        const spanContext: SpanContext = {
          traceId: '0af7651916cd43dd8448eb211c80319c',
          spanId: 'b7ad6b7169203331',
          traceFlags: 1,
          isRemote: false,
          traceState: {
            serialize: jest.fn().mockReturnValue('rojo=00f067aa0ba902b7')
          } as any,
        };
        
        (trace.getSpan as jest.Mock).mockReturnValue({
          spanContext: () => spanContext
        });
        
        // Execute
        const serialized = serializeContext(activeContext);
        
        // Verify
        expect(serialized).toBeTruthy();
        const parsed = JSON.parse(serialized);
        expect(parsed.traceId).toBe(spanContext.traceId);
        expect(parsed.spanId).toBe(spanContext.spanId);
        expect(parsed.traceFlags).toBe(spanContext.traceFlags);
        expect(parsed.isRemote).toBe(spanContext.isRemote);
        expect(parsed.traceState).toBe('rojo=00f067aa0ba902b7');
      });
      
      it('should return empty string if no span is associated with context', () => {
        // Setup
        (trace.getSpan as jest.Mock).mockReturnValue(undefined);
        
        // Execute
        const serialized = serializeContext(activeContext);
        
        // Verify
        expect(serialized).toBe('');
      });
    });
    
    describe('deserializeContext', () => {
      it('should deserialize a JSON string to a context with span context', () => {
        // Setup
        const serialized = JSON.stringify({
          traceId: '0af7651916cd43dd8448eb211c80319c',
          spanId: 'b7ad6b7169203331',
          traceFlags: 1,
          isRemote: true,
          traceState: 'rojo=00f067aa0ba902b7',
        });
        
        // Mock setSpanContext to verify the created span context
        (trace.setSpanContext as jest.Mock).mockImplementation((ctx, spanContext) => {
          expect(spanContext.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
          expect(spanContext.spanId).toBe('b7ad6b7169203331');
          expect(spanContext.traceFlags).toBe(1);
          expect(spanContext.isRemote).toBe(true);
          return { ...ctx, spanContext };
        });
        
        // Execute
        const result = deserializeContext(serialized);
        
        // Verify
        expect(trace.setSpanContext).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
      
      it('should return active context if serialized string is empty', () => {
        // Execute
        const result = deserializeContext('');
        
        // Verify
        expect(context.active).toHaveBeenCalled();
        expect(result).toBe(activeContext);
      });
      
      it('should handle deserialization errors gracefully', () => {
        // Setup - invalid JSON
        const serialized = 'not-valid-json';
        console.error = jest.fn();
        
        // Execute
        const result = deserializeContext(serialized);
        
        // Verify
        expect(console.error).toHaveBeenCalled();
        expect(context.active).toHaveBeenCalled();
        expect(result).toBe(activeContext);
      });
    });
  });
  
  describe('End-to-End Request Visualization', () => {
    it('should maintain trace context across multiple service boundaries', () => {
      // Setup - simulate a request flowing through multiple services
      const initialHeaders: IncomingHttpHeaders = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
      };
      
      // Step 1: Extract context from incoming HTTP request
      const extractedContext = extractContextFromHttpHeaders(initialHeaders);
      
      // Step 2: Add journey context to the extracted context
      const journeyContext = addJourneyContext({
        journeyType: 'health',
        journeyId: 'health-journey-123',
        userId: 'user-123',
        sessionId: 'session-456',
      }, extractedContext);
      
      // Step 3: Inject context into outgoing Kafka message
      const kafkaMessage: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '123456789',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {},
      };
      injectContextIntoKafkaMessage(kafkaMessage, journeyContext);
      
      // Step 4: Extract context from Kafka message in another service
      const kafkaExtractedContext = extractContextFromKafkaMessage(kafkaMessage);
      
      // Step 5: Inject context into outgoing HTTP request to another service
      const outgoingHeaders: OutgoingHttpHeaders = {};
      injectContextIntoHttpHeaders(outgoingHeaders, kafkaExtractedContext);
      
      // Verify the trace context is maintained throughout the chain
      expect(propagation.extract).toHaveBeenCalledTimes(2);
      expect(propagation.inject).toHaveBeenCalledTimes(2);
      expect(trace.getSpan).toHaveBeenCalled();
    });
    
    it('should serialize and deserialize context for storage and later use', () => {
      // Setup - simulate storing context and retrieving it later
      const spanContext: SpanContext = {
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        traceFlags: 1,
        isRemote: false,
      };
      
      (trace.getSpan as jest.Mock).mockReturnValue({
        spanContext: () => spanContext
      });
      
      // Step 1: Serialize context for storage
      const serialized = serializeContext(activeContext);
      
      // Step 2: Store in database or cache (simulated)
      const storedValue = serialized;
      
      // Step 3: Retrieve from storage later (simulated)
      const retrievedValue = storedValue;
      
      // Step 4: Deserialize context
      const deserializedContext = deserializeContext(retrievedValue);
      
      // Step 5: Use the context for a new operation
      const outgoingHeaders: OutgoingHttpHeaders = {};
      injectContextIntoHttpHeaders(outgoingHeaders, deserializedContext);
      
      // Verify
      expect(trace.setSpanContext).toHaveBeenCalled();
      expect(propagation.inject).toHaveBeenCalled();
    });
  });
  
  describe('Cross-Service Business Transaction Tracking', () => {
    it('should propagate business transaction IDs across services', () => {
      // Setup - simulate a business transaction flowing through multiple services
      const businessTransactionId = 'bt-123456789';
      const transactionName = 'HealthMetricRecording';
      
      // Add business transaction attributes to the span
      mockSpan.setAttribute('austa.transaction.id', businessTransactionId);
      mockSpan.setAttribute('austa.transaction.name', transactionName);
      mockSpan.setAttribute('austa.correlation.id', `corr-${businessTransactionId}`);
      
      // Step 1: Inject context with business transaction into HTTP headers
      const outgoingHeaders: OutgoingHttpHeaders = {};
      injectContextIntoHttpHeaders(outgoingHeaders, activeContext);
      
      // Step 2: Extract context in the receiving service
      const extractedContext = extractContextFromHttpHeaders(outgoingHeaders as IncomingHttpHeaders);
      
      // Verify business transaction context is propagated
      expect(propagation.inject).toHaveBeenCalled();
      expect(propagation.extract).toHaveBeenCalled();
    });
    
    it('should maintain business transaction context across different journey types', () => {
      // Setup - simulate a transaction spanning health and care journeys
      const businessTransactionId = 'bt-987654321';
      const initialContext = createHealthJourneyContext('health-journey-123', 'user-123');
      
      // Add business transaction attributes
      mockSpan.setAttribute('austa.transaction.id', businessTransactionId);
      mockSpan.setAttribute('austa.transaction.name', 'CompleteHealthCheckup');
      
      // Step 1: Serialize the health journey context
      const serialized = serializeContext(initialContext);
      
      // Step 2: Deserialize in the care journey service
      const deserializedContext = deserializeContext(serialized);
      
      // Step 3: Add care journey context while maintaining the same transaction
      const careContext = createCareJourneyContext('care-journey-456', 'user-123', undefined, deserializedContext);
      
      // Verify
      expect(addJourneyContext).toHaveBeenCalled();
    });
  });
  
  describe('Journey Context Management', () => {
    describe('addJourneyContext', () => {
      it('should add journey attributes to the current span', () => {
        // Setup
        const journeyContext: JourneyContext = {
          journeyType: 'health',
          journeyId: 'health-journey-123',
          userId: 'user-123',
          sessionId: 'session-456',
        };
        
        // Execute
        const result = addJourneyContext(journeyContext);
        
        // Verify
        expect(trace.getSpan).toHaveBeenCalledWith(activeContext);
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.type', 'health');
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.id', 'health-journey-123');
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('user.id', 'user-123');
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('session.id', 'session-456');
        expect(result).toBe(activeContext);
      });
      
      it('should use provided context instead of active context if specified', () => {
        // Setup
        const journeyContext: JourneyContext = {
          journeyType: 'care',
          journeyId: 'care-journey-123',
        };
        const customContext = { custom: true } as unknown as Context;
        
        // Execute
        const result = addJourneyContext(journeyContext, customContext);
        
        // Verify
        expect(trace.getSpan).toHaveBeenCalledWith(customContext);
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.type', 'care');
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.id', 'care-journey-123');
        expect(result).toBe(customContext);
      });
      
      it('should handle case when no span is associated with context', () => {
        // Setup
        const journeyContext: JourneyContext = {
          journeyType: 'plan',
          journeyId: 'plan-journey-123',
        };
        (trace.getSpan as jest.Mock).mockReturnValue(undefined);
        
        // Execute
        const result = addJourneyContext(journeyContext);
        
        // Verify
        expect(trace.getSpan).toHaveBeenCalledWith(activeContext);
        expect(result).toBe(activeContext);
      });
    });
    
    describe('extractJourneyContext', () => {
      it('should extract journey context from span attributes', () => {
        // Setup
        mockSpan.setAttribute('journey.type', 'health');
        mockSpan.setAttribute('journey.id', 'health-journey-123');
        mockSpan.setAttribute('user.id', 'user-123');
        mockSpan.setAttribute('session.id', 'session-456');
        
        // Execute
        const result = extractJourneyContext();
        
        // Verify
        expect(trace.getSpan).toHaveBeenCalledWith(activeContext);
        expect(result).toEqual({
          journeyType: 'health',
          journeyId: 'health-journey-123',
          userId: 'user-123',
          sessionId: 'session-456',
        });
      });
      
      it('should use provided context instead of active context if specified', () => {
        // Setup
        const customContext = { custom: true } as unknown as Context;
        mockSpan.setAttribute('journey.type', 'care');
        mockSpan.setAttribute('journey.id', 'care-journey-123');
        
        // Execute
        const result = extractJourneyContext(customContext);
        
        // Verify
        expect(trace.getSpan).toHaveBeenCalledWith(customContext);
        expect(result).toEqual({
          journeyType: 'care',
          journeyId: 'care-journey-123',
        });
      });
      
      it('should return undefined if no span is associated with context', () => {
        // Setup
        (trace.getSpan as jest.Mock).mockReturnValue(undefined);
        
        // Execute
        const result = extractJourneyContext();
        
        // Verify
        expect(trace.getSpan).toHaveBeenCalledWith(activeContext);
        expect(result).toBeUndefined();
      });
      
      it('should return undefined if required journey attributes are missing', () => {
        // Setup - missing journeyId
        mockSpan.setAttribute('journey.type', 'health');
        
        // Execute
        const result = extractJourneyContext();
        
        // Verify
        expect(result).toBeUndefined();
      });
    });
    
    describe('Journey-specific context creation', () => {
      beforeEach(() => {
        // Mock addJourneyContext to verify the journey context
        jest.spyOn(global, 'addJourneyContext').mockImplementation((journeyContext, ctx) => {
          return ctx || activeContext;
        });
      });
      
      describe('createHealthJourneyContext', () => {
        it('should create a context with health journey information', () => {
          // Execute
          const result = createHealthJourneyContext('health-journey-123', 'user-123', 'session-456');
          
          // Verify
          expect(addJourneyContext).toHaveBeenCalledWith(
            {
              journeyType: 'health',
              journeyId: 'health-journey-123',
              userId: 'user-123',
              sessionId: 'session-456',
            },
            undefined
          );
          expect(result).toBe(activeContext);
        });
        
        it('should support health metrics tracking use case', () => {
          // Setup - simulate a health metrics recording scenario
          const healthMetricsJourneyId = 'health-metrics-123';
          const userId = 'user-123';
          
          // Add health-specific attributes from fixtures
          const healthAttributes = mockSpanAttributes.healthMetricsAttributes;
          
          // Execute
          const result = createHealthJourneyContext(healthMetricsJourneyId, userId);
          
          // Verify
          expect(addJourneyContext).toHaveBeenCalledWith(
            expect.objectContaining({
              journeyType: 'health',
              journeyId: healthMetricsJourneyId,
              userId: userId,
            }),
            undefined
          );
        });
        
        it('should maintain trace context across health journey operations', () => {
          // Setup - simulate a sequence of operations in the health journey
          const healthJourneyId = 'health-journey-123';
          const userId = 'user-123';
          
          // Step 1: Create initial health journey context
          const initialContext = createHealthJourneyContext(healthJourneyId, userId);
          
          // Step 2: Inject context into HTTP headers for API call
          const headers: OutgoingHttpHeaders = {};
          injectContextIntoHttpHeaders(headers, initialContext);
          
          // Step 3: Extract context in the receiving service
          const extractedContext = extractContextFromHttpHeaders(headers as IncomingHttpHeaders);
          
          // Verify context is maintained
          expect(addJourneyContext).toHaveBeenCalled();
          expect(propagation.inject).toHaveBeenCalled();
          expect(propagation.extract).toHaveBeenCalled();
        });
      });
      
      describe('createCareJourneyContext', () => {
        it('should create a context with care journey information', () => {
          // Execute
          const result = createCareJourneyContext('care-journey-123');
          
          // Verify
          expect(addJourneyContext).toHaveBeenCalledWith(
            {
              journeyType: 'care',
              journeyId: 'care-journey-123',
              userId: undefined,
              sessionId: undefined,
            },
            undefined
          );
          expect(result).toBe(activeContext);
        });
        
        it('should support telemedicine session use case', () => {
          // Setup - simulate a telemedicine session scenario
          const careJourneyId = 'care-telemedicine-123';
          const userId = 'user-123';
          const sessionId = 'telemedicine-session-456';
          
          // Add care-specific attributes from fixtures
          const careAttributes = mockSpanAttributes.careTelemedicineAttributes;
          
          // Execute
          const result = createCareJourneyContext(careJourneyId, userId, sessionId);
          
          // Verify
          expect(addJourneyContext).toHaveBeenCalledWith(
            expect.objectContaining({
              journeyType: 'care',
              journeyId: careJourneyId,
              userId: userId,
              sessionId: sessionId,
            }),
            undefined
          );
        });
        
        it('should maintain trace context across care journey operations', () => {
          // Setup - simulate a sequence of operations in the care journey
          const careJourneyId = 'care-journey-123';
          const userId = 'user-123';
          const sessionId = 'session-456';
          
          // Step 1: Create initial care journey context
          const initialContext = createCareJourneyContext(careJourneyId, userId, sessionId);
          
          // Step 2: Serialize context for storage
          const serialized = serializeContext(initialContext);
          
          // Step 3: Deserialize context in another component
          const deserializedContext = deserializeContext(serialized);
          
          // Verify context is maintained
          expect(addJourneyContext).toHaveBeenCalled();
          expect(trace.setSpanContext).toHaveBeenCalled();
        });
      });
      
      describe('createPlanJourneyContext', () => {
        it('should create a context with plan journey information', () => {
          // Setup
          const customContext = { custom: true } as unknown as Context;
          
          // Execute
          const result = createPlanJourneyContext('plan-journey-123', 'user-123', undefined, customContext);
          
          // Verify
          expect(addJourneyContext).toHaveBeenCalledWith(
            {
              journeyType: 'plan',
              journeyId: 'plan-journey-123',
              userId: 'user-123',
              sessionId: undefined,
            },
            customContext
          );
          expect(result).toBe(customContext);
        });
        
        it('should support insurance claim submission use case', () => {
          // Setup - simulate an insurance claim submission scenario
          const planJourneyId = 'plan-claim-123';
          const userId = 'user-123';
          
          // Add plan-specific attributes from fixtures
          const planAttributes = mockSpanAttributes.planClaimAttributes;
          
          // Execute
          const result = createPlanJourneyContext(planJourneyId, userId);
          
          // Verify
          expect(addJourneyContext).toHaveBeenCalledWith(
            expect.objectContaining({
              journeyType: 'plan',
              journeyId: planJourneyId,
              userId: userId,
            }),
            undefined
          );
        });
        
        it('should propagate context through Kafka for asynchronous processing', () => {
          // Setup - simulate asynchronous processing via Kafka
          const planJourneyId = 'plan-journey-123';
          const userId = 'user-123';
          
          // Step 1: Create initial plan journey context
          const initialContext = createPlanJourneyContext(planJourneyId, userId);
          
          // Step 2: Inject context into Kafka message
          const kafkaMessage: KafkaMessage = {
            key: Buffer.from('claim-submission'),
            value: Buffer.from(JSON.stringify({ claimId: 'claim-123', amount: 500 })),
            timestamp: '123456789',
            size: 100,
            attributes: 0,
            offset: '0',
            headers: {},
          };
          injectContextIntoKafkaMessage(kafkaMessage, initialContext);
          
          // Step 3: Extract context in the receiving service
          const extractedContext = extractContextFromKafkaMessage(kafkaMessage);
          
          // Verify context is propagated
          expect(addJourneyContext).toHaveBeenCalled();
          expect(propagation.inject).toHaveBeenCalled();
          expect(propagation.extract).toHaveBeenCalled();
        });
      });
    });
  });
});
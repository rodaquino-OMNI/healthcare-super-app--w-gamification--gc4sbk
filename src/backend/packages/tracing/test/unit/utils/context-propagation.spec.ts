import { Context, SpanContext, SpanKind, SpanStatusCode, context, propagation, trace } from '@opentelemetry/api';
import { JourneyType } from '../../../src/interfaces/journey-context.interface';
import {
  addJourneyContext,
  deserializeTraceContext,
  extractTraceContextFromHttpHeaders,
  extractTraceContextFromKafkaHeaders,
  getCurrentSpanId,
  getCurrentTraceId,
  getTraceCorrelationInfo,
  injectTraceContextIntoHttpHeaders,
  injectTraceContextIntoKafkaHeaders,
  serializeTraceContext,
} from '../../../src/utils/context-propagation';
import { MockSpan } from '../../mocks/mock-span';
import { MockTracer } from '../../mocks/mock-tracer';

// Mock OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  const originalModule = jest.requireActual('@opentelemetry/api');
  
  // Mock span context for consistent trace and span IDs in tests
  const mockSpanContext: SpanContext = {
    traceId: '0af7651916cd43dd8448eb211c80319c',
    spanId: 'b7ad6b7169203331',
    traceFlags: originalModule.TraceFlags.SAMPLED,
    isRemote: false,
  };
  
  // Mock span for testing
  const mockSpan = {
    spanContext: () => mockSpanContext,
    setAttribute: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn(),
    isRecording: () => true,
    recordException: jest.fn(),
  };
  
  // Mock active context
  let activeContext: Context = originalModule.context.active();
  
  return {
    ...originalModule,
    context: {
      ...originalModule.context,
      active: jest.fn(() => activeContext),
      with: jest.fn((ctx, fn) => {
        const previousContext = activeContext;
        activeContext = ctx;
        try {
          return fn();
        } finally {
          activeContext = previousContext;
        }
      }),
    },
    trace: {
      ...originalModule.trace,
      getSpan: jest.fn((ctx) => mockSpan),
      setSpan: jest.fn((ctx, span) => ctx),
      getTracer: jest.fn(() => ({
        startSpan: jest.fn(() => mockSpan),
      })),
    },
    propagation: {
      ...originalModule.propagation,
      getTextMapPropagator: jest.fn(() => ({
        inject: jest.fn((ctx, carrier, setter) => {
          setter.set('traceparent', `00-${mockSpanContext.traceId}-${mockSpanContext.spanId}-01`);
          if (ctx['journey.type']) {
            setter.set('journey-type', ctx['journey.type']);
          }
        }),
        extract: jest.fn((ctx, carrier, getter) => {
          const traceparent = getter.get('traceparent');
          if (!traceparent) return ctx;
          
          const parts = traceparent.split('-');
          if (parts.length !== 4) return ctx;
          
          const extractedContext = { ...ctx };
          extractedContext['traceparent'] = traceparent;
          
          const journeyType = getter.get('journey-type');
          if (journeyType) {
            extractedContext['journey.type'] = journeyType;
          }
          
          return extractedContext;
        }),
      })),
    },
  };
});

describe('Context Propagation Utilities', () => {
  let mockTracer: MockTracer;
  let mockSpan: MockSpan;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockTracer = new MockTracer();
    mockSpan = new MockSpan();
    
    // Set up the mock tracer to return our mock span
    jest.spyOn(trace, 'getTracer').mockReturnValue(mockTracer as any);
    jest.spyOn(mockTracer, 'startSpan').mockReturnValue(mockSpan as any);
    jest.spyOn(trace, 'getSpan').mockReturnValue(mockSpan as any);
  });
  
  describe('HTTP Header Context Propagation', () => {
    it('should inject trace context into HTTP headers', () => {
      // Arrange
      const headers: Record<string, string> = {};
      
      // Act
      const result = injectTraceContextIntoHttpHeaders(headers);
      
      // Assert
      expect(result).toBe(headers); // Should return the same headers object
      expect(propagation.getTextMapPropagator().inject).toHaveBeenCalled();
      expect(headers).toHaveProperty('traceparent');
      expect(headers.traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
    });
    
    it('should inject journey-specific context into HTTP headers', () => {
      // Arrange
      const headers: Record<string, string> = {};
      const journeyType = JourneyType.HEALTH;
      
      // Act
      const result = injectTraceContextIntoHttpHeaders(headers, journeyType);
      
      // Assert
      expect(result).toBe(headers); // Should return the same headers object
      expect(propagation.getTextMapPropagator().inject).toHaveBeenCalled();
      expect(headers).toHaveProperty('traceparent');
      expect(headers).toHaveProperty('journey-type');
      expect(headers['journey-type']).toBe(journeyType);
    });
    
    it('should extract trace context from HTTP headers', () => {
      // Arrange
      const headers: Record<string, string> = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
      };
      
      // Act
      const extractedContext = extractTraceContextFromHttpHeaders(headers);
      
      // Assert
      expect(propagation.getTextMapPropagator().extract).toHaveBeenCalled();
      expect(extractedContext).toHaveProperty('traceparent');
      expect(extractedContext['traceparent']).toBe(headers.traceparent);
    });
    
    it('should extract journey-specific context from HTTP headers', () => {
      // Arrange
      const headers: Record<string, string> = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
        'journey-type': JourneyType.CARE,
      };
      
      // Act
      const extractedContext = extractTraceContextFromHttpHeaders(headers);
      
      // Assert
      expect(propagation.getTextMapPropagator().extract).toHaveBeenCalled();
      expect(extractedContext).toHaveProperty('traceparent');
      expect(extractedContext).toHaveProperty('journey.type');
      expect(extractedContext['journey.type']).toBe(JourneyType.CARE);
    });
  });
  
  describe('Kafka Header Context Propagation', () => {
    it('should inject trace context into Kafka headers', () => {
      // Arrange
      const headers: Record<string, Buffer> = {};
      
      // Act
      const result = injectTraceContextIntoKafkaHeaders(headers);
      
      // Assert
      expect(result).toBe(headers); // Should return the same headers object
      expect(propagation.getTextMapPropagator().inject).toHaveBeenCalled();
      expect(headers).toHaveProperty('traceparent');
      expect(headers.traceparent.toString()).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
    });
    
    it('should inject journey-specific context into Kafka headers', () => {
      // Arrange
      const headers: Record<string, Buffer> = {};
      const journeyType = JourneyType.PLAN;
      
      // Act
      const result = injectTraceContextIntoKafkaHeaders(headers, journeyType);
      
      // Assert
      expect(result).toBe(headers); // Should return the same headers object
      expect(propagation.getTextMapPropagator().inject).toHaveBeenCalled();
      expect(headers).toHaveProperty('traceparent');
      expect(headers).toHaveProperty('journey-type');
      expect(headers['journey-type'].toString()).toBe(journeyType);
    });
    
    it('should extract trace context from Kafka headers', () => {
      // Arrange
      const headers: Record<string, Buffer> = {
        'traceparent': Buffer.from('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'),
      };
      
      // Act
      const extractedContext = extractTraceContextFromKafkaHeaders(headers);
      
      // Assert
      expect(propagation.getTextMapPropagator().extract).toHaveBeenCalled();
      expect(extractedContext).toHaveProperty('traceparent');
      expect(extractedContext['traceparent']).toBe(headers.traceparent.toString());
    });
    
    it('should extract journey-specific context from Kafka headers', () => {
      // Arrange
      const headers: Record<string, Buffer> = {
        'traceparent': Buffer.from('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'),
        'journey-type': Buffer.from(JourneyType.HEALTH),
      };
      
      // Act
      const extractedContext = extractTraceContextFromKafkaHeaders(headers);
      
      // Assert
      expect(propagation.getTextMapPropagator().extract).toHaveBeenCalled();
      expect(extractedContext).toHaveProperty('traceparent');
      expect(extractedContext).toHaveProperty('journey.type');
      expect(extractedContext['journey.type']).toBe(JourneyType.HEALTH);
    });
  });
  
  describe('Context Serialization and Deserialization', () => {
    it('should serialize trace context to a string', () => {
      // Act
      const serializedContext = serializeTraceContext();
      
      // Assert
      expect(typeof serializedContext).toBe('string');
      expect(serializedContext).toContain('traceparent');
      
      // Verify it's valid JSON
      const parsed = JSON.parse(serializedContext);
      expect(parsed).toHaveProperty('traceparent');
      expect(parsed.traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
    });
    
    it('should serialize journey-specific context to a string', () => {
      // Arrange
      const journeyType = JourneyType.CARE;
      
      // Act
      const serializedContext = serializeTraceContext(journeyType);
      
      // Assert
      expect(typeof serializedContext).toBe('string');
      
      // Verify it's valid JSON with journey type
      const parsed = JSON.parse(serializedContext);
      expect(parsed).toHaveProperty('traceparent');
      expect(parsed).toHaveProperty('journey-type');
      expect(parsed['journey-type']).toBe(journeyType);
    });
    
    it('should deserialize trace context from a string', () => {
      // Arrange
      const serializedContext = JSON.stringify({
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
      });
      
      // Act
      const deserializedContext = deserializeTraceContext(serializedContext);
      
      // Assert
      expect(deserializedContext).toHaveProperty('traceparent');
      expect(deserializedContext['traceparent']).toBe('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01');
    });
    
    it('should deserialize journey-specific context from a string', () => {
      // Arrange
      const serializedContext = JSON.stringify({
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
        'journey-type': JourneyType.PLAN,
      });
      
      // Act
      const deserializedContext = deserializeTraceContext(serializedContext);
      
      // Assert
      expect(deserializedContext).toHaveProperty('traceparent');
      expect(deserializedContext).toHaveProperty('journey.type');
      expect(deserializedContext['journey.type']).toBe(JourneyType.PLAN);
    });
    
    it('should handle invalid serialized context gracefully', () => {
      // Arrange
      const invalidContext = 'not-valid-json';
      
      // Act & Assert
      expect(() => deserializeTraceContext(invalidContext)).not.toThrow();
      const result = deserializeTraceContext(invalidContext);
      
      // Should return the active context when deserialization fails
      expect(result).toBeDefined();
      expect(context.active).toHaveBeenCalled();
    });
  });
  
  describe('Journey Context Management', () => {
    it('should add journey context to the current span', () => {
      // Arrange
      const ctx = context.active();
      const journeyType = JourneyType.HEALTH;
      
      // Act
      const updatedContext = addJourneyContext(ctx, journeyType);
      
      // Assert
      expect(trace.getSpan).toHaveBeenCalledWith(ctx);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.type', journeyType);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.domain', 'health');
      expect(trace.setSpan).toHaveBeenCalledWith(ctx, mockSpan);
    });
    
    it('should add care journey context to the current span', () => {
      // Arrange
      const ctx = context.active();
      const journeyType = JourneyType.CARE;
      
      // Act
      const updatedContext = addJourneyContext(ctx, journeyType);
      
      // Assert
      expect(trace.getSpan).toHaveBeenCalledWith(ctx);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.type', journeyType);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.domain', 'care');
      expect(trace.setSpan).toHaveBeenCalledWith(ctx, mockSpan);
    });
    
    it('should add plan journey context to the current span', () => {
      // Arrange
      const ctx = context.active();
      const journeyType = JourneyType.PLAN;
      
      // Act
      const updatedContext = addJourneyContext(ctx, journeyType);
      
      // Assert
      expect(trace.getSpan).toHaveBeenCalledWith(ctx);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.type', journeyType);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.domain', 'plan');
      expect(trace.setSpan).toHaveBeenCalledWith(ctx, mockSpan);
    });
    
    it('should return the original context if no span is available', () => {
      // Arrange
      const ctx = context.active();
      const journeyType = JourneyType.HEALTH;
      
      // Mock no span available
      jest.spyOn(trace, 'getSpan').mockReturnValueOnce(undefined);
      
      // Act
      const updatedContext = addJourneyContext(ctx, journeyType);
      
      // Assert
      expect(trace.getSpan).toHaveBeenCalledWith(ctx);
      expect(mockSpan.setAttribute).not.toHaveBeenCalled();
      expect(trace.setSpan).not.toHaveBeenCalled();
      expect(updatedContext).toBe(ctx);
    });
  });
  
  describe('Trace and Span ID Retrieval', () => {
    it('should get the current trace ID', () => {
      // Act
      const traceId = getCurrentTraceId();
      
      // Assert
      expect(trace.getSpan).toHaveBeenCalledWith(context.active());
      expect(traceId).toBe('0af7651916cd43dd8448eb211c80319c');
    });
    
    it('should return undefined if no span is available for trace ID', () => {
      // Arrange
      jest.spyOn(trace, 'getSpan').mockReturnValueOnce(undefined);
      
      // Act
      const traceId = getCurrentTraceId();
      
      // Assert
      expect(trace.getSpan).toHaveBeenCalledWith(context.active());
      expect(traceId).toBeUndefined();
    });
    
    it('should get the current span ID', () => {
      // Act
      const spanId = getCurrentSpanId();
      
      // Assert
      expect(trace.getSpan).toHaveBeenCalledWith(context.active());
      expect(spanId).toBe('b7ad6b7169203331');
    });
    
    it('should return undefined if no span is available for span ID', () => {
      // Arrange
      jest.spyOn(trace, 'getSpan').mockReturnValueOnce(undefined);
      
      // Act
      const spanId = getCurrentSpanId();
      
      // Assert
      expect(trace.getSpan).toHaveBeenCalledWith(context.active());
      expect(spanId).toBeUndefined();
    });
  });
  
  describe('Trace Correlation Info', () => {
    it('should get trace correlation info with trace and span IDs', () => {
      // Act
      const correlationInfo = getTraceCorrelationInfo();
      
      // Assert
      expect(correlationInfo).toHaveProperty('trace_id', '0af7651916cd43dd8448eb211c80319c');
      expect(correlationInfo).toHaveProperty('span_id', 'b7ad6b7169203331');
    });
    
    it('should handle missing trace and span IDs in correlation info', () => {
      // Arrange
      jest.spyOn(trace, 'getSpan').mockReturnValue(undefined);
      
      // Act
      const correlationInfo = getTraceCorrelationInfo();
      
      // Assert
      expect(correlationInfo).toHaveProperty('trace_id', undefined);
      expect(correlationInfo).toHaveProperty('span_id', undefined);
    });
  });
});
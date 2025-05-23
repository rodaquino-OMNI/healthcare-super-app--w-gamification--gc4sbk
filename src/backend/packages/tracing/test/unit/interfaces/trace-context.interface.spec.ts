/**
 * @file trace-context.interface.spec.ts
 * @description Unit tests for the TraceContext interface that verify the proper extraction,
 * injection, and propagation of trace context across service boundaries.
 */

import { Context, ROOT_CONTEXT, SpanContext, trace } from '@opentelemetry/api';
import { TraceContext, PropagationFormat, HttpTraceContextCarrier, KafkaTraceContextCarrier, TRACE_CONTEXT_KEYS, TRACE_CONTEXT_ATTRIBUTES } from '../../../src/interfaces/trace-context.interface';
import { JourneyContext, JourneyType, HealthJourneyContext } from '../../../src/interfaces/journey-context.interface';
import { SpanAttributes } from '../../../src/interfaces/span-attributes.interface';

/**
 * Mock implementation of TraceContext for testing
 */
class MockTraceContext implements TraceContext {
  private activeContext: Context = ROOT_CONTEXT;
  private readonly contextMap = new Map<string, any>();

  extract<T extends object>(carrier: T, format: PropagationFormat = PropagationFormat.HTTP_HEADERS): Context {
    if (!carrier) {
      throw new Error('Carrier cannot be null or undefined');
    }

    let context = ROOT_CONTEXT;

    // Simulate extraction based on format
    if (format === PropagationFormat.HTTP_HEADERS) {
      const httpCarrier = carrier as HttpTraceContextCarrier;
      if (httpCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT]) {
        // Parse W3C trace context format
        const traceParent = httpCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT];
        const parts = traceParent.split('-');
        if (parts.length >= 3) {
          const traceId = parts[1];
          const spanId = parts[2];
          
          // Create a mock span context
          const spanContext: SpanContext = {
            traceId,
            spanId,
            traceFlags: 1,
            isRemote: true,
          };
          
          // Set the span context in the context
          context = trace.setSpanContext(context, spanContext);
        }
      }

      // Extract correlation ID if present
      if (httpCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID]) {
        context = this.withCorrelationId(httpCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID], context);
      }

      // Extract journey context if present
      if (httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_ID] && httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_TYPE]) {
        const journeyContext: JourneyContext = {
          journeyId: httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_ID],
          journeyType: httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_TYPE] as JourneyType,
          userId: httpCarrier[TRACE_CONTEXT_KEYS.USER_ID] || 'unknown',
          sessionId: httpCarrier[TRACE_CONTEXT_KEYS.SESSION_ID],
        };
        context = this.withJourneyContext(journeyContext, context);
      }
    } else if (format === PropagationFormat.KAFKA_HEADERS) {
      const kafkaCarrier = carrier as KafkaTraceContextCarrier;
      // Similar logic for Kafka headers, but with Buffer values
      if (kafkaCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT]) {
        const traceParent = kafkaCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT].toString('utf8');
        const parts = traceParent.split('-');
        if (parts.length >= 3) {
          const traceId = parts[1];
          const spanId = parts[2];
          
          // Create a mock span context
          const spanContext: SpanContext = {
            traceId,
            spanId,
            traceFlags: 1,
            isRemote: true,
          };
          
          // Set the span context in the context
          context = trace.setSpanContext(context, spanContext);
        }
      }

      // Extract other values from Kafka headers
      if (kafkaCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID]) {
        context = this.withCorrelationId(
          kafkaCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID].toString('utf8'),
          context
        );
      }
    }

    return context;
  }

  inject<T extends object>(context: Context, carrier: T, format: PropagationFormat = PropagationFormat.HTTP_HEADERS): void {
    if (!carrier) {
      throw new Error('Carrier cannot be null or undefined');
    }

    const spanContext = trace.getSpanContext(context);
    
    if (format === PropagationFormat.HTTP_HEADERS) {
      const httpCarrier = carrier as HttpTraceContextCarrier;
      
      // Inject trace context
      if (spanContext) {
        httpCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT] = 
          `00-${spanContext.traceId}-${spanContext.spanId}-0${spanContext.traceFlags}`;
      }
      
      // Inject correlation ID if present
      const correlationId = this.getCorrelationId(context);
      if (correlationId) {
        httpCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID] = correlationId;
      }
      
      // Inject journey context if present
      const journeyContext = this.getJourneyContext(context);
      if (journeyContext) {
        httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_ID] = journeyContext.journeyId;
        httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_TYPE] = journeyContext.journeyType;
        httpCarrier[TRACE_CONTEXT_KEYS.USER_ID] = journeyContext.userId;
        
        if (journeyContext.sessionId) {
          httpCarrier[TRACE_CONTEXT_KEYS.SESSION_ID] = journeyContext.sessionId;
        }
      }
    } else if (format === PropagationFormat.KAFKA_HEADERS) {
      const kafkaCarrier = carrier as KafkaTraceContextCarrier;
      
      // Inject trace context
      if (spanContext) {
        const traceParent = `00-${spanContext.traceId}-${spanContext.spanId}-0${spanContext.traceFlags}`;
        kafkaCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT] = Buffer.from(traceParent, 'utf8');
      }
      
      // Inject correlation ID if present
      const correlationId = this.getCorrelationId(context);
      if (correlationId) {
        kafkaCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID] = Buffer.from(correlationId, 'utf8');
      }
      
      // Inject journey context if present
      const journeyContext = this.getJourneyContext(context);
      if (journeyContext) {
        kafkaCarrier[TRACE_CONTEXT_KEYS.JOURNEY_ID] = Buffer.from(journeyContext.journeyId, 'utf8');
        kafkaCarrier[TRACE_CONTEXT_KEYS.JOURNEY_TYPE] = Buffer.from(journeyContext.journeyType, 'utf8');
        kafkaCarrier[TRACE_CONTEXT_KEYS.USER_ID] = Buffer.from(journeyContext.userId, 'utf8');
        
        if (journeyContext.sessionId) {
          kafkaCarrier[TRACE_CONTEXT_KEYS.SESSION_ID] = Buffer.from(journeyContext.sessionId, 'utf8');
        }
      }
    }
  }

  getCurrentContext(): Context {
    return this.activeContext;
  }

  setCurrentContext(context: Context): () => void {
    const previousContext = this.activeContext;
    this.activeContext = context;
    return () => {
      this.activeContext = previousContext;
    };
  }

  createChildContext(attributes?: SpanAttributes): Context {
    let context = this.getCurrentContext();
    
    // Add attributes to context
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        this.contextMap.set(`${context}-${key}`, value);
      }
    }
    
    return context;
  }

  getTraceId(context?: Context): string | undefined {
    const ctx = context || this.getCurrentContext();
    const spanContext = trace.getSpanContext(ctx);
    return spanContext?.traceId;
  }

  getSpanId(context?: Context): string | undefined {
    const ctx = context || this.getCurrentContext();
    const spanContext = trace.getSpanContext(ctx);
    return spanContext?.spanId;
  }

  withJourneyContext(journeyContext: JourneyContext, context?: Context): Context {
    const ctx = context || this.getCurrentContext();
    this.contextMap.set(`${ctx}-journeyContext`, journeyContext);
    return ctx;
  }

  getJourneyContext(context?: Context): JourneyContext | undefined {
    const ctx = context || this.getCurrentContext();
    return this.contextMap.get(`${ctx}-journeyContext`);
  }

  getJourneyType(context?: Context): JourneyType | undefined {
    const journeyContext = this.getJourneyContext(context);
    return journeyContext?.journeyType;
  }

  withCorrelationId(correlationId: string, context?: Context): Context {
    const ctx = context || this.getCurrentContext();
    this.contextMap.set(`${ctx}-correlationId`, correlationId);
    return ctx;
  }

  getCorrelationId(context?: Context): string | undefined {
    const ctx = context || this.getCurrentContext();
    return this.contextMap.get(`${ctx}-correlationId`);
  }

  serializeContext(context?: Context): string {
    const ctx = context || this.getCurrentContext();
    const spanContext = trace.getSpanContext(ctx);
    const journeyContext = this.getJourneyContext(ctx);
    const correlationId = this.getCorrelationId(ctx);
    
    const serialized = {
      spanContext: spanContext ? {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        traceFlags: spanContext.traceFlags,
        isRemote: spanContext.isRemote,
      } : undefined,
      journeyContext,
      correlationId,
    };
    
    return JSON.stringify(serialized);
  }

  deserializeContext(serialized: string): Context {
    if (!serialized) {
      throw new Error('Serialized context cannot be null or undefined');
    }
    
    try {
      const parsed = JSON.parse(serialized);
      let context = ROOT_CONTEXT;
      
      // Restore span context
      if (parsed.spanContext) {
        context = trace.setSpanContext(context, parsed.spanContext);
      }
      
      // Restore journey context
      if (parsed.journeyContext) {
        context = this.withJourneyContext(parsed.journeyContext, context);
      }
      
      // Restore correlation ID
      if (parsed.correlationId) {
        context = this.withCorrelationId(parsed.correlationId, context);
      }
      
      return context;
    } catch (error) {
      throw new Error(`Failed to deserialize context: ${error.message}`);
    }
  }

  createExternalSystemContext(
    externalSystemName: string,
    attributes?: SpanAttributes,
    context?: Context
  ): Context {
    const ctx = context || this.getCurrentContext();
    const externalAttributes: SpanAttributes = {
      [TRACE_CONTEXT_ATTRIBUTES.EXTERNAL_SYSTEM]: externalSystemName,
      ...attributes,
    };
    
    // Store external system attributes
    for (const [key, value] of Object.entries(externalAttributes)) {
      this.contextMap.set(`${ctx}-${key}`, value);
    }
    
    return ctx;
  }

  mergeContexts(primary: Context, secondary: Context): Context {
    // Start with the primary context
    let mergedContext = primary;
    
    // Get span context from secondary if primary doesn't have one
    const primarySpanContext = trace.getSpanContext(primary);
    const secondarySpanContext = trace.getSpanContext(secondary);
    
    if (!primarySpanContext && secondarySpanContext) {
      mergedContext = trace.setSpanContext(mergedContext, secondarySpanContext);
    }
    
    // Merge journey context
    const secondaryJourneyContext = this.getJourneyContext(secondary);
    if (secondaryJourneyContext && !this.getJourneyContext(primary)) {
      mergedContext = this.withJourneyContext(secondaryJourneyContext, mergedContext);
    }
    
    // Merge correlation ID
    const secondaryCorrelationId = this.getCorrelationId(secondary);
    if (secondaryCorrelationId && !this.getCorrelationId(primary)) {
      mergedContext = this.withCorrelationId(secondaryCorrelationId, mergedContext);
    }
    
    return mergedContext;
  }

  clearContext(): Context {
    return ROOT_CONTEXT;
  }
}

describe('TraceContext Interface', () => {
  let traceContext: TraceContext;
  
  beforeEach(() => {
    traceContext = new MockTraceContext();
  });
  
  describe('Context Extraction', () => {
    it('should extract trace context from HTTP headers', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      const httpCarrier: HttpTraceContextCarrier = {
        [TRACE_CONTEXT_KEYS.TRACE_PARENT]: `00-${traceId}-${spanId}-01`,
        [TRACE_CONTEXT_KEYS.CORRELATION_ID]: 'test-correlation-id',
        [TRACE_CONTEXT_KEYS.JOURNEY_ID]: 'test-journey-id',
        [TRACE_CONTEXT_KEYS.JOURNEY_TYPE]: JourneyType.HEALTH,
        [TRACE_CONTEXT_KEYS.USER_ID]: 'test-user-id',
        [TRACE_CONTEXT_KEYS.SESSION_ID]: 'test-session-id',
      };
      
      // Act
      const context = traceContext.extract(httpCarrier);
      
      // Assert
      expect(traceContext.getTraceId(context)).toBe(traceId);
      expect(traceContext.getSpanId(context)).toBe(spanId);
      expect(traceContext.getCorrelationId(context)).toBe('test-correlation-id');
      
      const journeyContext = traceContext.getJourneyContext(context);
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyId).toBe('test-journey-id');
      expect(journeyContext?.journeyType).toBe(JourneyType.HEALTH);
      expect(journeyContext?.userId).toBe('test-user-id');
      expect(journeyContext?.sessionId).toBe('test-session-id');
    });
    
    it('should extract trace context from Kafka headers', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      const kafkaCarrier: KafkaTraceContextCarrier = {
        [TRACE_CONTEXT_KEYS.TRACE_PARENT]: Buffer.from(`00-${traceId}-${spanId}-01`, 'utf8'),
        [TRACE_CONTEXT_KEYS.CORRELATION_ID]: Buffer.from('test-correlation-id', 'utf8'),
      };
      
      // Act
      const context = traceContext.extract(kafkaCarrier, PropagationFormat.KAFKA_HEADERS);
      
      // Assert
      expect(traceContext.getTraceId(context)).toBe(traceId);
      expect(traceContext.getSpanId(context)).toBe(spanId);
      expect(traceContext.getCorrelationId(context)).toBe('test-correlation-id');
    });
    
    it('should handle missing trace context in carrier', () => {
      // Arrange
      const httpCarrier: HttpTraceContextCarrier = {
        [TRACE_CONTEXT_KEYS.CORRELATION_ID]: 'test-correlation-id',
      };
      
      // Act
      const context = traceContext.extract(httpCarrier);
      
      // Assert
      expect(traceContext.getTraceId(context)).toBeUndefined();
      expect(traceContext.getSpanId(context)).toBeUndefined();
      expect(traceContext.getCorrelationId(context)).toBe('test-correlation-id');
    });
    
    it('should throw error when carrier is null or undefined', () => {
      // Act & Assert
      expect(() => traceContext.extract(null as any)).toThrow('Carrier cannot be null or undefined');
      expect(() => traceContext.extract(undefined as any)).toThrow('Carrier cannot be null or undefined');
    });
    
    it('should handle malformed trace parent header', () => {
      // Arrange
      const httpCarrier: HttpTraceContextCarrier = {
        [TRACE_CONTEXT_KEYS.TRACE_PARENT]: 'invalid-trace-parent',
      };
      
      // Act
      const context = traceContext.extract(httpCarrier);
      
      // Assert
      expect(traceContext.getTraceId(context)).toBeUndefined();
      expect(traceContext.getSpanId(context)).toBeUndefined();
    });
  });
  
  describe('Context Injection', () => {
    it('should inject trace context into HTTP headers', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      const spanContext: SpanContext = {
        traceId,
        spanId,
        traceFlags: 1,
        isRemote: false,
      };
      
      let context = trace.setSpanContext(ROOT_CONTEXT, spanContext);
      context = traceContext.withCorrelationId('test-correlation-id', context);
      
      const journeyContext: JourneyContext = {
        journeyId: 'test-journey-id',
        journeyType: JourneyType.HEALTH,
        userId: 'test-user-id',
        sessionId: 'test-session-id',
      };
      context = traceContext.withJourneyContext(journeyContext, context);
      
      const httpCarrier: HttpTraceContextCarrier = {};
      
      // Act
      traceContext.inject(context, httpCarrier);
      
      // Assert
      expect(httpCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT]).toBe(`00-${traceId}-${spanId}-01`);
      expect(httpCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID]).toBe('test-correlation-id');
      expect(httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_ID]).toBe('test-journey-id');
      expect(httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_TYPE]).toBe(JourneyType.HEALTH);
      expect(httpCarrier[TRACE_CONTEXT_KEYS.USER_ID]).toBe('test-user-id');
      expect(httpCarrier[TRACE_CONTEXT_KEYS.SESSION_ID]).toBe('test-session-id');
    });
    
    it('should inject trace context into Kafka headers', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      const spanContext: SpanContext = {
        traceId,
        spanId,
        traceFlags: 1,
        isRemote: false,
      };
      
      let context = trace.setSpanContext(ROOT_CONTEXT, spanContext);
      context = traceContext.withCorrelationId('test-correlation-id', context);
      
      const kafkaCarrier: KafkaTraceContextCarrier = {};
      
      // Act
      traceContext.inject(context, kafkaCarrier, PropagationFormat.KAFKA_HEADERS);
      
      // Assert
      expect(kafkaCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT]).toBeDefined();
      expect(kafkaCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT].toString('utf8')).toBe(`00-${traceId}-${spanId}-01`);
      expect(kafkaCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID]).toBeDefined();
      expect(kafkaCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID].toString('utf8')).toBe('test-correlation-id');
    });
    
    it('should handle context without span context', () => {
      // Arrange
      let context = ROOT_CONTEXT;
      context = traceContext.withCorrelationId('test-correlation-id', context);
      
      const httpCarrier: HttpTraceContextCarrier = {};
      
      // Act
      traceContext.inject(context, httpCarrier);
      
      // Assert
      expect(httpCarrier[TRACE_CONTEXT_KEYS.TRACE_PARENT]).toBeUndefined();
      expect(httpCarrier[TRACE_CONTEXT_KEYS.CORRELATION_ID]).toBe('test-correlation-id');
    });
    
    it('should throw error when carrier is null or undefined', () => {
      // Act & Assert
      expect(() => traceContext.inject(ROOT_CONTEXT, null as any)).toThrow('Carrier cannot be null or undefined');
      expect(() => traceContext.inject(ROOT_CONTEXT, undefined as any)).toThrow('Carrier cannot be null or undefined');
    });
    
    it('should handle partial journey context', () => {
      // Arrange
      const journeyContext: JourneyContext = {
        journeyId: 'test-journey-id',
        journeyType: JourneyType.HEALTH,
        userId: 'test-user-id',
        // No sessionId
      };
      
      let context = ROOT_CONTEXT;
      context = traceContext.withJourneyContext(journeyContext, context);
      
      const httpCarrier: HttpTraceContextCarrier = {};
      
      // Act
      traceContext.inject(context, httpCarrier);
      
      // Assert
      expect(httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_ID]).toBe('test-journey-id');
      expect(httpCarrier[TRACE_CONTEXT_KEYS.JOURNEY_TYPE]).toBe(JourneyType.HEALTH);
      expect(httpCarrier[TRACE_CONTEXT_KEYS.USER_ID]).toBe('test-user-id');
      expect(httpCarrier[TRACE_CONTEXT_KEYS.SESSION_ID]).toBeUndefined();
    });
  });
  
  describe('Context Serialization/Deserialization', () => {
    it('should serialize and deserialize context correctly', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      const spanContext: SpanContext = {
        traceId,
        spanId,
        traceFlags: 1,
        isRemote: false,
      };
      
      let context = trace.setSpanContext(ROOT_CONTEXT, spanContext);
      context = traceContext.withCorrelationId('test-correlation-id', context);
      
      const journeyContext: JourneyContext = {
        journeyId: 'test-journey-id',
        journeyType: JourneyType.HEALTH,
        userId: 'test-user-id',
        sessionId: 'test-session-id',
      };
      context = traceContext.withJourneyContext(journeyContext, context);
      
      // Act
      const serialized = traceContext.serializeContext(context);
      const deserialized = traceContext.deserializeContext(serialized);
      
      // Assert
      expect(traceContext.getTraceId(deserialized)).toBe(traceId);
      expect(traceContext.getSpanId(deserialized)).toBe(spanId);
      expect(traceContext.getCorrelationId(deserialized)).toBe('test-correlation-id');
      
      const deserializedJourneyContext = traceContext.getJourneyContext(deserialized);
      expect(deserializedJourneyContext).toBeDefined();
      expect(deserializedJourneyContext?.journeyId).toBe('test-journey-id');
      expect(deserializedJourneyContext?.journeyType).toBe(JourneyType.HEALTH);
      expect(deserializedJourneyContext?.userId).toBe('test-user-id');
      expect(deserializedJourneyContext?.sessionId).toBe('test-session-id');
    });
    
    it('should handle serialization of context without span context', () => {
      // Arrange
      let context = ROOT_CONTEXT;
      context = traceContext.withCorrelationId('test-correlation-id', context);
      
      // Act
      const serialized = traceContext.serializeContext(context);
      const deserialized = traceContext.deserializeContext(serialized);
      
      // Assert
      expect(traceContext.getTraceId(deserialized)).toBeUndefined();
      expect(traceContext.getSpanId(deserialized)).toBeUndefined();
      expect(traceContext.getCorrelationId(deserialized)).toBe('test-correlation-id');
    });
    
    it('should throw error when serialized context is null or undefined', () => {
      // Act & Assert
      expect(() => traceContext.deserializeContext(null as any)).toThrow('Serialized context cannot be null or undefined');
      expect(() => traceContext.deserializeContext(undefined as any)).toThrow('Serialized context cannot be null or undefined');
    });
    
    it('should throw error when serialized context is invalid JSON', () => {
      // Act & Assert
      expect(() => traceContext.deserializeContext('invalid-json')).toThrow('Failed to deserialize context');
    });
    
    it('should handle complex journey context serialization', () => {
      // Arrange
      const healthJourneyContext: HealthJourneyContext = {
        journeyId: 'test-journey-id',
        journeyType: JourneyType.HEALTH,
        userId: 'test-user-id',
        sessionId: 'test-session-id',
        metricType: 'heart_rate',
        dataSource: 'wearable',
        deviceId: 'device-123',
        goalId: 'goal-456',
        isCritical: false,
      };
      
      let context = ROOT_CONTEXT;
      context = traceContext.withJourneyContext(healthJourneyContext, context);
      
      // Act
      const serialized = traceContext.serializeContext(context);
      const deserialized = traceContext.deserializeContext(serialized);
      
      // Assert
      const deserializedJourneyContext = traceContext.getJourneyContext(deserialized) as HealthJourneyContext;
      expect(deserializedJourneyContext).toBeDefined();
      expect(deserializedJourneyContext.metricType).toBe('heart_rate');
      expect(deserializedJourneyContext.dataSource).toBe('wearable');
      expect(deserializedJourneyContext.deviceId).toBe('device-123');
      expect(deserializedJourneyContext.goalId).toBe('goal-456');
      expect(deserializedJourneyContext.isCritical).toBe(false);
    });
  });
  
  describe('Error Handling in Context Operations', () => {
    it('should handle errors in extract method', () => {
      // Act & Assert
      expect(() => traceContext.extract(null as any)).toThrow('Carrier cannot be null or undefined');
    });
    
    it('should handle errors in inject method', () => {
      // Act & Assert
      expect(() => traceContext.inject(ROOT_CONTEXT, null as any)).toThrow('Carrier cannot be null or undefined');
    });
    
    it('should handle errors in deserializeContext method', () => {
      // Act & Assert
      expect(() => traceContext.deserializeContext(null as any)).toThrow('Serialized context cannot be null or undefined');
      expect(() => traceContext.deserializeContext('invalid-json')).toThrow('Failed to deserialize context');
    });
    
    it('should handle missing context gracefully', () => {
      // Act & Assert
      expect(traceContext.getTraceId(undefined)).toBeUndefined();
      expect(traceContext.getSpanId(undefined)).toBeUndefined();
      expect(traceContext.getCorrelationId(undefined)).toBeUndefined();
      expect(traceContext.getJourneyContext(undefined)).toBeUndefined();
      expect(traceContext.getJourneyType(undefined)).toBeUndefined();
    });
    
    it('should handle invalid context gracefully', () => {
      // Arrange
      const invalidContext = {} as Context;
      
      // Act & Assert
      expect(traceContext.getTraceId(invalidContext)).toBeUndefined();
      expect(traceContext.getSpanId(invalidContext)).toBeUndefined();
      expect(traceContext.getCorrelationId(invalidContext)).toBeUndefined();
      expect(traceContext.getJourneyContext(invalidContext)).toBeUndefined();
      expect(traceContext.getJourneyType(invalidContext)).toBeUndefined();
    });
  });
  
  describe('External System Context Propagation', () => {
    it('should create context for external system integration', () => {
      // Arrange
      const externalSystemName = 'fhir-api';
      const attributes: SpanAttributes = {
        'service.endpoint': 'https://fhir.example.com/api/v1/Patient',
        'service.operation': 'getPatient',
      };
      
      // Act
      const context = traceContext.createExternalSystemContext(externalSystemName, attributes);
      
      // Assert
      // Note: In a real implementation, we would verify the attributes were properly stored
      // For this mock, we're just ensuring the method doesn't throw
      expect(context).toBeDefined();
    });
    
    it('should merge contexts correctly', () => {
      // Arrange
      const traceId1 = '0af7651916cd43dd8448eb211c80319c';
      const spanId1 = 'b7ad6b7169203331';
      const spanContext1: SpanContext = {
        traceId: traceId1,
        spanId: spanId1,
        traceFlags: 1,
        isRemote: false,
      };
      
      let context1 = trace.setSpanContext(ROOT_CONTEXT, spanContext1);
      context1 = traceContext.withCorrelationId('correlation-id-1', context1);
      
      const traceId2 = '1bf8762027de54ee9559fc322d91420d';
      const spanId2 = 'c8be7c827a314442';
      const spanContext2: SpanContext = {
        traceId: traceId2,
        spanId: spanId2,
        traceFlags: 1,
        isRemote: false,
      };
      
      let context2 = trace.setSpanContext(ROOT_CONTEXT, spanContext2);
      context2 = traceContext.withJourneyContext({
        journeyId: 'journey-id-2',
        journeyType: JourneyType.CARE,
        userId: 'user-id-2',
      }, context2);
      
      // Act
      const mergedContext = traceContext.mergeContexts(context1, context2);
      
      // Assert
      expect(traceContext.getTraceId(mergedContext)).toBe(traceId1); // Primary context's trace ID
      expect(traceContext.getSpanId(mergedContext)).toBe(spanId1); // Primary context's span ID
      expect(traceContext.getCorrelationId(mergedContext)).toBe('correlation-id-1'); // From primary
      
      const journeyContext = traceContext.getJourneyContext(mergedContext);
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyId).toBe('journey-id-2'); // From secondary
      expect(journeyContext?.journeyType).toBe(JourneyType.CARE); // From secondary
    });
    
    it('should handle merging when primary context is missing span context', () => {
      // Arrange
      let context1 = ROOT_CONTEXT;
      context1 = traceContext.withCorrelationId('correlation-id-1', context1);
      
      const traceId2 = '1bf8762027de54ee9559fc322d91420d';
      const spanId2 = 'c8be7c827a314442';
      const spanContext2: SpanContext = {
        traceId: traceId2,
        spanId: spanId2,
        traceFlags: 1,
        isRemote: false,
      };
      
      let context2 = trace.setSpanContext(ROOT_CONTEXT, spanContext2);
      
      // Act
      const mergedContext = traceContext.mergeContexts(context1, context2);
      
      // Assert
      expect(traceContext.getTraceId(mergedContext)).toBe(traceId2); // From secondary
      expect(traceContext.getSpanId(mergedContext)).toBe(spanId2); // From secondary
      expect(traceContext.getCorrelationId(mergedContext)).toBe('correlation-id-1'); // From primary
    });
    
    it('should clear context correctly', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      const spanContext: SpanContext = {
        traceId,
        spanId,
        traceFlags: 1,
        isRemote: false,
      };
      
      let context = trace.setSpanContext(ROOT_CONTEXT, spanContext);
      context = traceContext.withCorrelationId('test-correlation-id', context);
      context = traceContext.withJourneyContext({
        journeyId: 'test-journey-id',
        journeyType: JourneyType.HEALTH,
        userId: 'test-user-id',
      }, context);
      
      // Act
      const clearedContext = traceContext.clearContext();
      
      // Assert
      expect(traceContext.getTraceId(clearedContext)).toBeUndefined();
      expect(traceContext.getSpanId(clearedContext)).toBeUndefined();
      expect(traceContext.getCorrelationId(clearedContext)).toBeUndefined();
      expect(traceContext.getJourneyContext(clearedContext)).toBeUndefined();
    });
  });
  
  describe('Context Management', () => {
    it('should get and set current context', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      const spanContext: SpanContext = {
        traceId,
        spanId,
        traceFlags: 1,
        isRemote: false,
      };
      
      const context = trace.setSpanContext(ROOT_CONTEXT, spanContext);
      
      // Act
      const restore = traceContext.setCurrentContext(context);
      const currentContext = traceContext.getCurrentContext();
      
      // Assert
      expect(traceContext.getTraceId(currentContext)).toBe(traceId);
      expect(traceContext.getSpanId(currentContext)).toBe(spanId);
      
      // Restore previous context
      restore();
      expect(traceContext.getCurrentContext()).not.toBe(context);
    });
    
    it('should create child context with attributes', () => {
      // Arrange
      const attributes: SpanAttributes = {
        'service.name': 'test-service',
        'component.name': 'test-component',
      };
      
      // Act
      const childContext = traceContext.createChildContext(attributes);
      
      // Assert
      expect(childContext).toBeDefined();
      // Note: In a real implementation, we would verify the attributes were properly stored
      // For this mock, we're just ensuring the method doesn't throw
    });
  });
});
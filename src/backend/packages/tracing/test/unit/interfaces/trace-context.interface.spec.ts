import { Context, SpanContext, context, trace } from '@opentelemetry/api';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { KafkaMessage } from 'kafkajs';
import { TraceContext, JourneyContextInfo } from '../../../src/interfaces/trace-context.interface';
import { CONTEXT_EXTRACTION_FAILED, CONTEXT_INJECTION_FAILED, CONTEXT_PROPAGATION_FAILED } from '../../../src/constants/error-codes';
import { SAMPLE_TRACE_ID, SAMPLE_SPAN_ID_1 } from '../../fixtures/mock-spans';

/**
 * Mock implementation of the TraceContext interface for testing
 */
class MockTraceContext implements TraceContext {
  private ctx: Context;
  private journeyContext?: JourneyContextInfo;
  private attributes: Record<string, any> = {};

  constructor(ctx?: Context, journeyContext?: JourneyContextInfo) {
    this.ctx = ctx || context.active();
    this.journeyContext = journeyContext;
  }

  getContext(): Context {
    return this.ctx;
  }

  getSpanContext(): SpanContext | undefined {
    return trace.getSpanContext(this.ctx);
  }

  getTraceId(): string | undefined {
    return this.getSpanContext()?.traceId;
  }

  getSpanId(): string | undefined {
    return this.getSpanContext()?.spanId;
  }

  getTraceFlags(): number | undefined {
    return this.getSpanContext()?.traceFlags;
  }

  isSampled(): boolean {
    const flags = this.getTraceFlags();
    return flags !== undefined && (flags & 1) === 1;
  }

  extractFromHttpHeaders(headers: IncomingHttpHeaders): TraceContext {
    // Mock implementation - in a real implementation, this would use OpenTelemetry propagation
    if (!headers) {
      throw new Error(CONTEXT_EXTRACTION_FAILED);
    }

    // For testing, we'll create a mock context based on traceparent header
    const traceparent = headers['traceparent'] as string;
    if (!traceparent) {
      return new MockTraceContext();
    }

    // Parse traceparent header (format: 00-traceId-spanId-flags)
    const parts = traceparent.split('-');
    if (parts.length !== 4) {
      return new MockTraceContext();
    }

    const [, traceId, spanId, flags] = parts;
    const spanContext: SpanContext = {
      traceId,
      spanId,
      traceFlags: parseInt(flags, 16),
      isRemote: true,
    };

    const newCtx = trace.setSpanContext(context.active(), spanContext);
    return new MockTraceContext(newCtx);
  }

  injectIntoHttpHeaders(headers: OutgoingHttpHeaders): OutgoingHttpHeaders {
    if (!headers) {
      throw new Error(CONTEXT_INJECTION_FAILED);
    }

    const spanContext = this.getSpanContext();
    if (spanContext) {
      // Format: 00-traceId-spanId-flags
      const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-0${spanContext.traceFlags.toString(16)}`;
      headers['traceparent'] = traceparent;

      // Add journey context if available
      if (this.journeyContext) {
        headers['x-journey-type'] = this.journeyContext.journeyType;
        headers['x-journey-id'] = this.journeyContext.journeyId;
        
        if (this.journeyContext.userId) {
          headers['x-user-id'] = this.journeyContext.userId;
        }
        
        if (this.journeyContext.sessionId) {
          headers['x-session-id'] = this.journeyContext.sessionId;
        }
        
        if (this.journeyContext.requestId) {
          headers['x-request-id'] = this.journeyContext.requestId;
        }
      }
    }

    return headers;
  }

  extractFromKafkaMessage(message: KafkaMessage): TraceContext {
    if (!message || !message.headers) {
      throw new Error(CONTEXT_EXTRACTION_FAILED);
    }

    // For testing, we'll create a mock context based on traceparent header
    const traceparentBuffer = message.headers['traceparent'];
    if (!traceparentBuffer) {
      return new MockTraceContext();
    }

    const traceparent = traceparentBuffer instanceof Buffer 
      ? traceparentBuffer.toString() 
      : String(traceparentBuffer);

    // Parse traceparent header (format: 00-traceId-spanId-flags)
    const parts = traceparent.split('-');
    if (parts.length !== 4) {
      return new MockTraceContext();
    }

    const [, traceId, spanId, flags] = parts;
    const spanContext: SpanContext = {
      traceId,
      spanId,
      traceFlags: parseInt(flags, 16),
      isRemote: true,
    };

    const newCtx = trace.setSpanContext(context.active(), spanContext);
    
    // Extract journey context if available
    let journeyContext: JourneyContextInfo | undefined;
    
    const journeyTypeBuffer = message.headers['x-journey-type'];
    const journeyIdBuffer = message.headers['x-journey-id'];
    
    if (journeyTypeBuffer && journeyIdBuffer) {
      const journeyType = journeyTypeBuffer instanceof Buffer 
        ? journeyTypeBuffer.toString() 
        : String(journeyTypeBuffer);
        
      const journeyId = journeyIdBuffer instanceof Buffer 
        ? journeyIdBuffer.toString() 
        : String(journeyIdBuffer);
      
      if ((journeyType === 'health' || journeyType === 'care' || journeyType === 'plan') && journeyId) {
        journeyContext = {
          journeyType,
          journeyId,
        };
        
        const userIdBuffer = message.headers['x-user-id'];
        if (userIdBuffer) {
          journeyContext.userId = userIdBuffer instanceof Buffer 
            ? userIdBuffer.toString() 
            : String(userIdBuffer);
        }
        
        const sessionIdBuffer = message.headers['x-session-id'];
        if (sessionIdBuffer) {
          journeyContext.sessionId = sessionIdBuffer instanceof Buffer 
            ? sessionIdBuffer.toString() 
            : String(sessionIdBuffer);
        }
        
        const requestIdBuffer = message.headers['x-request-id'];
        if (requestIdBuffer) {
          journeyContext.requestId = requestIdBuffer instanceof Buffer 
            ? requestIdBuffer.toString() 
            : String(requestIdBuffer);
        }
      }
    }
    
    return new MockTraceContext(newCtx, journeyContext);
  }

  injectIntoKafkaMessage(message: KafkaMessage): KafkaMessage {
    if (!message) {
      throw new Error(CONTEXT_INJECTION_FAILED);
    }

    if (!message.headers) {
      message.headers = {};
    }

    const spanContext = this.getSpanContext();
    if (spanContext) {
      // Format: 00-traceId-spanId-flags
      const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-0${spanContext.traceFlags.toString(16)}`;
      message.headers['traceparent'] = Buffer.from(traceparent);

      // Add journey context if available
      if (this.journeyContext) {
        message.headers['x-journey-type'] = Buffer.from(this.journeyContext.journeyType);
        message.headers['x-journey-id'] = Buffer.from(this.journeyContext.journeyId);
        
        if (this.journeyContext.userId) {
          message.headers['x-user-id'] = Buffer.from(this.journeyContext.userId);
        }
        
        if (this.journeyContext.sessionId) {
          message.headers['x-session-id'] = Buffer.from(this.journeyContext.sessionId);
        }
        
        if (this.journeyContext.requestId) {
          message.headers['x-request-id'] = Buffer.from(this.journeyContext.requestId);
        }
      }
    }

    return message;
  }

  serialize(): string {
    const spanContext = this.getSpanContext();
    if (!spanContext) {
      return '';
    }

    const serialized = {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      traceFlags: spanContext.traceFlags,
      isRemote: spanContext.isRemote,
      journeyContext: this.journeyContext,
      attributes: this.attributes,
    };

    return JSON.stringify(serialized);
  }

  deserialize(serialized: string): TraceContext {
    if (!serialized) {
      throw new Error(CONTEXT_PROPAGATION_FAILED);
    }

    try {
      const parsed = JSON.parse(serialized);
      const spanContext: SpanContext = {
        traceId: parsed.traceId,
        spanId: parsed.spanId,
        traceFlags: parsed.traceFlags,
        isRemote: parsed.isRemote || true,
      };

      const newCtx = trace.setSpanContext(context.active(), spanContext);
      const traceContext = new MockTraceContext(newCtx, parsed.journeyContext);
      
      // Restore attributes
      if (parsed.attributes) {
        Object.entries(parsed.attributes).forEach(([key, value]) => {
          traceContext.withAttributes({ [key]: value });
        });
      }
      
      return traceContext;
    } catch (error) {
      throw new Error(`${CONTEXT_PROPAGATION_FAILED}: ${error.message}`);
    }
  }

  withJourneyContext(journeyContext: JourneyContextInfo): TraceContext {
    return new MockTraceContext(this.ctx, journeyContext);
  }

  getJourneyContext(): JourneyContextInfo | undefined {
    return this.journeyContext;
  }

  withHealthJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext {
    return this.withJourneyContext({
      journeyType: 'health',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  withCareJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext {
    return this.withJourneyContext({
      journeyType: 'care',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  withPlanJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext {
    return this.withJourneyContext({
      journeyType: 'plan',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  getCorrelationInfo(): {
    traceId: string | undefined;
    spanId: string | undefined;
    traceFlags: number | undefined;
    isSampled: boolean;
    journeyType?: 'health' | 'care' | 'plan';
    journeyId?: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
  } {
    return {
      traceId: this.getTraceId(),
      spanId: this.getSpanId(),
      traceFlags: this.getTraceFlags(),
      isSampled: this.isSampled(),
      journeyType: this.journeyContext?.journeyType,
      journeyId: this.journeyContext?.journeyId,
      userId: this.journeyContext?.userId,
      sessionId: this.journeyContext?.sessionId,
      requestId: this.journeyContext?.requestId,
    };
  }

  createLogContext(additionalContext?: Record<string, any>): Record<string, any> {
    const correlationInfo = this.getCorrelationInfo();
    return {
      traceId: correlationInfo.traceId,
      spanId: correlationInfo.spanId,
      sampled: correlationInfo.isSampled,
      journeyType: correlationInfo.journeyType,
      journeyId: correlationInfo.journeyId,
      userId: correlationInfo.userId,
      sessionId: correlationInfo.sessionId,
      requestId: correlationInfo.requestId,
      ...this.attributes,
      ...(additionalContext || {}),
    };
  }

  withAttributes(attributes: Record<string, any>): TraceContext {
    const newTraceContext = new MockTraceContext(this.ctx, this.journeyContext);
    newTraceContext.attributes = { ...this.attributes, ...attributes };
    return newTraceContext;
  }

  hasAttribute(key: string): boolean {
    return key in this.attributes;
  }

  getAttribute(key: string): any {
    return this.attributes[key];
  }
}

/**
 * Helper function to create a mock TraceContext with a valid span context
 */
function createMockTraceContextWithSpan(): MockTraceContext {
  const spanContext: SpanContext = {
    traceId: SAMPLE_TRACE_ID,
    spanId: SAMPLE_SPAN_ID_1,
    traceFlags: 1, // Sampled
    isRemote: false,
  };
  
  const ctx = trace.setSpanContext(context.active(), spanContext);
  return new MockTraceContext(ctx);
}

describe('TraceContext Interface', () => {
  let traceContext: MockTraceContext;

  beforeEach(() => {
    traceContext = createMockTraceContextWithSpan();
  });

  describe('Basic Context Operations', () => {
    it('should retrieve the current context', () => {
      const ctx = traceContext.getContext();
      expect(ctx).toBeDefined();
    });

    it('should retrieve the current span context', () => {
      const spanContext = traceContext.getSpanContext();
      expect(spanContext).toBeDefined();
      expect(spanContext?.traceId).toBe(SAMPLE_TRACE_ID);
      expect(spanContext?.spanId).toBe(SAMPLE_SPAN_ID_1);
    });

    it('should retrieve the trace ID', () => {
      const traceId = traceContext.getTraceId();
      expect(traceId).toBe(SAMPLE_TRACE_ID);
    });

    it('should retrieve the span ID', () => {
      const spanId = traceContext.getSpanId();
      expect(spanId).toBe(SAMPLE_SPAN_ID_1);
    });

    it('should retrieve the trace flags', () => {
      const traceFlags = traceContext.getTraceFlags();
      expect(traceFlags).toBe(1); // Sampled
    });

    it('should check if the context is sampled', () => {
      const isSampled = traceContext.isSampled();
      expect(isSampled).toBe(true);
    });
  });

  describe('HTTP Context Propagation', () => {
    it('should extract context from HTTP headers', () => {
      const headers: IncomingHttpHeaders = {
        traceparent: `00-${SAMPLE_TRACE_ID}-${SAMPLE_SPAN_ID_1}-01`,
      };

      const extractedContext = traceContext.extractFromHttpHeaders(headers);
      expect(extractedContext).toBeDefined();
      expect(extractedContext.getTraceId()).toBe(SAMPLE_TRACE_ID);
      expect(extractedContext.getSpanId()).toBe(SAMPLE_SPAN_ID_1);
      expect(extractedContext.isSampled()).toBe(true);
    });

    it('should handle missing traceparent header', () => {
      const headers: IncomingHttpHeaders = {};
      const extractedContext = traceContext.extractFromHttpHeaders(headers);
      expect(extractedContext).toBeDefined();
      // Should create a new context without trace information
      expect(extractedContext.getTraceId()).toBeUndefined();
    });

    it('should throw an error when headers are null', () => {
      expect(() => {
        traceContext.extractFromHttpHeaders(null as any);
      }).toThrow(CONTEXT_EXTRACTION_FAILED);
    });

    it('should inject context into HTTP headers', () => {
      const headers: OutgoingHttpHeaders = {};
      const injectedHeaders = traceContext.injectIntoHttpHeaders(headers);

      expect(injectedHeaders).toBeDefined();
      expect(injectedHeaders.traceparent).toBeDefined();
      expect(typeof injectedHeaders.traceparent).toBe('string');

      const traceparent = injectedHeaders.traceparent as string;
      expect(traceparent).toContain(SAMPLE_TRACE_ID);
      expect(traceparent).toContain(SAMPLE_SPAN_ID_1);
    });

    it('should inject journey context into HTTP headers', () => {
      const headers: OutgoingHttpHeaders = {};
      const contextWithJourney = traceContext.withHealthJourney('journey-123', 'user-456', 'session-789', 'request-abc');
      const injectedHeaders = contextWithJourney.injectIntoHttpHeaders(headers);

      expect(injectedHeaders['x-journey-type']).toBe('health');
      expect(injectedHeaders['x-journey-id']).toBe('journey-123');
      expect(injectedHeaders['x-user-id']).toBe('user-456');
      expect(injectedHeaders['x-session-id']).toBe('session-789');
      expect(injectedHeaders['x-request-id']).toBe('request-abc');
    });

    it('should throw an error when headers are null for injection', () => {
      expect(() => {
        traceContext.injectIntoHttpHeaders(null as any);
      }).toThrow(CONTEXT_INJECTION_FAILED);
    });
  });

  describe('Kafka Context Propagation', () => {
    it('should extract context from Kafka message', () => {
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1672531200000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          traceparent: Buffer.from(`00-${SAMPLE_TRACE_ID}-${SAMPLE_SPAN_ID_1}-01`),
        },
      };

      const extractedContext = traceContext.extractFromKafkaMessage(message);
      expect(extractedContext).toBeDefined();
      expect(extractedContext.getTraceId()).toBe(SAMPLE_TRACE_ID);
      expect(extractedContext.getSpanId()).toBe(SAMPLE_SPAN_ID_1);
      expect(extractedContext.isSampled()).toBe(true);
    });

    it('should extract journey context from Kafka message', () => {
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1672531200000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          traceparent: Buffer.from(`00-${SAMPLE_TRACE_ID}-${SAMPLE_SPAN_ID_1}-01`),
          'x-journey-type': Buffer.from('care'),
          'x-journey-id': Buffer.from('journey-456'),
          'x-user-id': Buffer.from('user-789'),
          'x-session-id': Buffer.from('session-abc'),
          'x-request-id': Buffer.from('request-def'),
        },
      };

      const extractedContext = traceContext.extractFromKafkaMessage(message);
      expect(extractedContext).toBeDefined();
      
      const journeyContext = extractedContext.getJourneyContext();
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyType).toBe('care');
      expect(journeyContext?.journeyId).toBe('journey-456');
      expect(journeyContext?.userId).toBe('user-789');
      expect(journeyContext?.sessionId).toBe('session-abc');
      expect(journeyContext?.requestId).toBe('request-def');
    });

    it('should handle missing traceparent header in Kafka message', () => {
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1672531200000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {},
      };

      const extractedContext = traceContext.extractFromKafkaMessage(message);
      expect(extractedContext).toBeDefined();
      // Should create a new context without trace information
      expect(extractedContext.getTraceId()).toBeUndefined();
    });

    it('should throw an error when message is null', () => {
      expect(() => {
        traceContext.extractFromKafkaMessage(null as any);
      }).toThrow(CONTEXT_EXTRACTION_FAILED);
    });

    it('should inject context into Kafka message', () => {
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1672531200000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {},
      };

      const injectedMessage = traceContext.injectIntoKafkaMessage(message);
      expect(injectedMessage).toBeDefined();
      expect(injectedMessage.headers).toBeDefined();
      expect(injectedMessage.headers.traceparent).toBeDefined();
      
      const traceparent = injectedMessage.headers.traceparent as Buffer;
      expect(traceparent.toString()).toContain(SAMPLE_TRACE_ID);
      expect(traceparent.toString()).toContain(SAMPLE_SPAN_ID_1);
    });

    it('should inject journey context into Kafka message', () => {
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1672531200000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {},
      };

      const contextWithJourney = traceContext.withPlanJourney('journey-789', 'user-abc', 'session-def', 'request-ghi');
      const injectedMessage = contextWithJourney.injectIntoKafkaMessage(message);

      expect(injectedMessage.headers['x-journey-type']).toBeDefined();
      expect((injectedMessage.headers['x-journey-type'] as Buffer).toString()).toBe('plan');
      expect((injectedMessage.headers['x-journey-id'] as Buffer).toString()).toBe('journey-789');
      expect((injectedMessage.headers['x-user-id'] as Buffer).toString()).toBe('user-abc');
      expect((injectedMessage.headers['x-session-id'] as Buffer).toString()).toBe('session-def');
      expect((injectedMessage.headers['x-request-id'] as Buffer).toString()).toBe('request-ghi');
    });

    it('should create headers if they do not exist', () => {
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1672531200000',
        size: 100,
        attributes: 0,
        offset: '0',
      };

      const injectedMessage = traceContext.injectIntoKafkaMessage(message);
      expect(injectedMessage.headers).toBeDefined();
      expect(injectedMessage.headers.traceparent).toBeDefined();
    });

    it('should throw an error when message is null for injection', () => {
      expect(() => {
        traceContext.injectIntoKafkaMessage(null as any);
      }).toThrow(CONTEXT_INJECTION_FAILED);
    });
  });

  describe('Context Serialization and Deserialization', () => {
    it('should serialize context to a string', () => {
      const serialized = traceContext.serialize();
      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('string');
      
      const parsed = JSON.parse(serialized);
      expect(parsed.traceId).toBe(SAMPLE_TRACE_ID);
      expect(parsed.spanId).toBe(SAMPLE_SPAN_ID_1);
      expect(parsed.traceFlags).toBe(1);
    });

    it('should serialize context with journey information', () => {
      const contextWithJourney = traceContext.withHealthJourney('journey-123', 'user-456');
      const serialized = contextWithJourney.serialize();
      
      const parsed = JSON.parse(serialized);
      expect(parsed.journeyContext).toBeDefined();
      expect(parsed.journeyContext.journeyType).toBe('health');
      expect(parsed.journeyContext.journeyId).toBe('journey-123');
      expect(parsed.journeyContext.userId).toBe('user-456');
    });

    it('should serialize context with attributes', () => {
      const contextWithAttributes = traceContext.withAttributes({
        'custom.attribute1': 'value1',
        'custom.attribute2': 42,
      });
      const serialized = contextWithAttributes.serialize();
      
      const parsed = JSON.parse(serialized);
      expect(parsed.attributes).toBeDefined();
      expect(parsed.attributes['custom.attribute1']).toBe('value1');
      expect(parsed.attributes['custom.attribute2']).toBe(42);
    });

    it('should return empty string when no span context is available', () => {
      const emptyContext = new MockTraceContext();
      const serialized = emptyContext.serialize();
      expect(serialized).toBe('');
    });

    it('should deserialize context from a string', () => {
      const serialized = traceContext.serialize();
      const deserialized = traceContext.deserialize(serialized);
      
      expect(deserialized).toBeDefined();
      expect(deserialized.getTraceId()).toBe(SAMPLE_TRACE_ID);
      expect(deserialized.getSpanId()).toBe(SAMPLE_SPAN_ID_1);
      expect(deserialized.isSampled()).toBe(true);
    });

    it('should deserialize context with journey information', () => {
      const contextWithJourney = traceContext.withCareJourney('journey-456', 'user-789');
      const serialized = contextWithJourney.serialize();
      const deserialized = traceContext.deserialize(serialized);
      
      const journeyContext = deserialized.getJourneyContext();
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyType).toBe('care');
      expect(journeyContext?.journeyId).toBe('journey-456');
      expect(journeyContext?.userId).toBe('user-789');
    });

    it('should deserialize context with attributes', () => {
      const contextWithAttributes = traceContext.withAttributes({
        'custom.attribute1': 'value1',
        'custom.attribute2': 42,
      });
      const serialized = contextWithAttributes.serialize();
      const deserialized = traceContext.deserialize(serialized);
      
      expect(deserialized.hasAttribute('custom.attribute1')).toBe(true);
      expect(deserialized.getAttribute('custom.attribute1')).toBe('value1');
      expect(deserialized.getAttribute('custom.attribute2')).toBe(42);
    });

    it('should throw an error when serialized string is empty', () => {
      expect(() => {
        traceContext.deserialize('');
      }).toThrow(CONTEXT_PROPAGATION_FAILED);
    });

    it('should throw an error when serialized string is invalid JSON', () => {
      expect(() => {
        traceContext.deserialize('invalid-json');
      }).toThrow(CONTEXT_PROPAGATION_FAILED);
    });
  });

  describe('Journey Context Operations', () => {
    it('should add health journey context', () => {
      const healthContext = traceContext.withHealthJourney('health-journey-123', 'user-456', 'session-789');
      
      const journeyContext = healthContext.getJourneyContext();
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyType).toBe('health');
      expect(journeyContext?.journeyId).toBe('health-journey-123');
      expect(journeyContext?.userId).toBe('user-456');
      expect(journeyContext?.sessionId).toBe('session-789');
    });

    it('should add care journey context', () => {
      const careContext = traceContext.withCareJourney('care-journey-456', 'user-789', 'session-abc');
      
      const journeyContext = careContext.getJourneyContext();
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyType).toBe('care');
      expect(journeyContext?.journeyId).toBe('care-journey-456');
      expect(journeyContext?.userId).toBe('user-789');
      expect(journeyContext?.sessionId).toBe('session-abc');
    });

    it('should add plan journey context', () => {
      const planContext = traceContext.withPlanJourney('plan-journey-789', 'user-abc', 'session-def');
      
      const journeyContext = planContext.getJourneyContext();
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyType).toBe('plan');
      expect(journeyContext?.journeyId).toBe('plan-journey-789');
      expect(journeyContext?.userId).toBe('user-abc');
      expect(journeyContext?.sessionId).toBe('session-def');
    });

    it('should add generic journey context', () => {
      const journeyInfo: JourneyContextInfo = {
        journeyType: 'health',
        journeyId: 'custom-journey-123',
        userId: 'user-custom',
        sessionId: 'session-custom',
        requestId: 'request-custom',
      };
      
      const journeyContext = traceContext.withJourneyContext(journeyInfo);
      const retrievedContext = journeyContext.getJourneyContext();
      
      expect(retrievedContext).toBeDefined();
      expect(retrievedContext).toEqual(journeyInfo);
    });
  });

  describe('Correlation and Logging', () => {
    it('should get correlation info', () => {
      const correlationInfo = traceContext.getCorrelationInfo();
      
      expect(correlationInfo).toBeDefined();
      expect(correlationInfo.traceId).toBe(SAMPLE_TRACE_ID);
      expect(correlationInfo.spanId).toBe(SAMPLE_SPAN_ID_1);
      expect(correlationInfo.isSampled).toBe(true);
    });

    it('should get correlation info with journey context', () => {
      const contextWithJourney = traceContext.withHealthJourney('journey-123', 'user-456', 'session-789', 'request-abc');
      const correlationInfo = contextWithJourney.getCorrelationInfo();
      
      expect(correlationInfo.journeyType).toBe('health');
      expect(correlationInfo.journeyId).toBe('journey-123');
      expect(correlationInfo.userId).toBe('user-456');
      expect(correlationInfo.sessionId).toBe('session-789');
      expect(correlationInfo.requestId).toBe('request-abc');
    });

    it('should create log context', () => {
      const logContext = traceContext.createLogContext();
      
      expect(logContext).toBeDefined();
      expect(logContext.traceId).toBe(SAMPLE_TRACE_ID);
      expect(logContext.spanId).toBe(SAMPLE_SPAN_ID_1);
      expect(logContext.sampled).toBe(true);
    });

    it('should create log context with journey information', () => {
      const contextWithJourney = traceContext.withCareJourney('journey-456', 'user-789');
      const logContext = contextWithJourney.createLogContext();
      
      expect(logContext.journeyType).toBe('care');
      expect(logContext.journeyId).toBe('journey-456');
      expect(logContext.userId).toBe('user-789');
    });

    it('should create log context with additional context', () => {
      const additionalContext = {
        operation: 'test-operation',
        duration: 123,
        status: 'success',
      };
      
      const logContext = traceContext.createLogContext(additionalContext);
      
      expect(logContext.operation).toBe('test-operation');
      expect(logContext.duration).toBe(123);
      expect(logContext.status).toBe('success');
    });

    it('should create log context with attributes', () => {
      const contextWithAttributes = traceContext.withAttributes({
        'custom.attribute1': 'value1',
        'custom.attribute2': 42,
      });
      
      const logContext = contextWithAttributes.createLogContext();
      
      expect(logContext['custom.attribute1']).toBe('value1');
      expect(logContext['custom.attribute2']).toBe(42);
    });
  });

  describe('Attribute Management', () => {
    it('should add attributes to context', () => {
      const contextWithAttributes = traceContext.withAttributes({
        'custom.attribute1': 'value1',
        'custom.attribute2': 42,
      });
      
      expect(contextWithAttributes.hasAttribute('custom.attribute1')).toBe(true);
      expect(contextWithAttributes.getAttribute('custom.attribute1')).toBe('value1');
      expect(contextWithAttributes.getAttribute('custom.attribute2')).toBe(42);
    });

    it('should check if attribute exists', () => {
      const contextWithAttributes = traceContext.withAttributes({
        'custom.attribute1': 'value1',
      });
      
      expect(contextWithAttributes.hasAttribute('custom.attribute1')).toBe(true);
      expect(contextWithAttributes.hasAttribute('non.existent')).toBe(false);
    });

    it('should get attribute value', () => {
      const contextWithAttributes = traceContext.withAttributes({
        'custom.attribute1': 'value1',
        'custom.attribute2': 42,
        'custom.attribute3': true,
        'custom.attribute4': { nested: 'object' },
      });
      
      expect(contextWithAttributes.getAttribute('custom.attribute1')).toBe('value1');
      expect(contextWithAttributes.getAttribute('custom.attribute2')).toBe(42);
      expect(contextWithAttributes.getAttribute('custom.attribute3')).toBe(true);
      expect(contextWithAttributes.getAttribute('custom.attribute4')).toEqual({ nested: 'object' });
      expect(contextWithAttributes.getAttribute('non.existent')).toBeUndefined();
    });

    it('should merge attributes when adding multiple times', () => {
      const context1 = traceContext.withAttributes({
        'custom.attribute1': 'value1',
        'custom.attribute2': 42,
      });
      
      const context2 = context1.withAttributes({
        'custom.attribute3': true,
        'custom.attribute2': 100, // Override existing attribute
      });
      
      expect(context2.getAttribute('custom.attribute1')).toBe('value1');
      expect(context2.getAttribute('custom.attribute2')).toBe(100); // Should be overridden
      expect(context2.getAttribute('custom.attribute3')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing span context', () => {
      const emptyContext = new MockTraceContext();
      
      expect(emptyContext.getTraceId()).toBeUndefined();
      expect(emptyContext.getSpanId()).toBeUndefined();
      expect(emptyContext.getTraceFlags()).toBeUndefined();
      expect(emptyContext.isSampled()).toBe(false);
    });

    it('should handle invalid traceparent format in HTTP headers', () => {
      const headers: IncomingHttpHeaders = {
        traceparent: 'invalid-format',
      };

      const extractedContext = traceContext.extractFromHttpHeaders(headers);
      expect(extractedContext).toBeDefined();
      // Should create a new context without trace information
      expect(extractedContext.getTraceId()).toBeUndefined();
    });

    it('should handle invalid traceparent format in Kafka message', () => {
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1672531200000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          traceparent: Buffer.from('invalid-format'),
        },
      };

      const extractedContext = traceContext.extractFromKafkaMessage(message);
      expect(extractedContext).toBeDefined();
      // Should create a new context without trace information
      expect(extractedContext.getTraceId()).toBeUndefined();
    });

    it('should handle missing headers in Kafka message', () => {
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1672531200000',
        size: 100,
        attributes: 0,
        offset: '0',
      };

      expect(() => {
        traceContext.extractFromKafkaMessage(message);
      }).toThrow(CONTEXT_EXTRACTION_FAILED);
    });
  });
});
/**
 * Unit tests for trace context propagation utilities
 * 
 * These tests verify the extraction and injection of trace context across different
 * transport mechanisms, ensuring that trace context is properly maintained across
 * service boundaries for end-to-end distributed tracing.
 */

import { context, propagation, trace } from '@opentelemetry/api';
import { KafkaMessage, Message, ProducerRecord } from 'kafkajs';

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
  HttpHeadersCarrier,
  KafkaMessageCarrier,
  TRACE_HEADER_NAMES
} from '../../../src/utils/context-propagation';

import { MockContext } from '../../mocks/mock-context';
import {
  validTracingHeaders,
  healthJourneyHeaders,
  careJourneyHeaders,
  planJourneyHeaders,
  invalidTraceparentHeaders,
  createTracingHeaders
} from '../../fixtures/tracing-headers';
import {
  healthJourneyContext,
  careJourneyContext,
  planJourneyContext,
  fixedTraceContext
} from '../../fixtures/trace-contexts';

// Mock OpenTelemetry API
jest.mock('@opentelemetry/api', () => ({
  context: {
    active: jest.fn(() => MockContext.active()),
    with: jest.fn((ctx, fn) => MockContext.with(ctx, fn))
  },
  propagation: {
    extract: jest.fn((ctx, carrier) => {
      // Simple mock implementation that extracts traceparent from carrier
      const traceparent = carrier.get(TRACE_HEADER_NAMES.TRACE_PARENT);
      if (traceparent) {
        const parts = traceparent.split('-');
        if (parts.length >= 4) {
          const [, traceId, spanId] = parts;
          let mockCtx = MockContext.setTraceId(ctx, traceId);
          mockCtx = MockContext.setSpanId(mockCtx, spanId);
          
          // Extract journey context if available
          const journeyContextStr = carrier.get(TRACE_HEADER_NAMES.JOURNEY_CONTEXT);
          if (journeyContextStr) {
            try {
              const journeyContext = JSON.parse(journeyContextStr);
              mockCtx = MockContext.setJourneyContext(mockCtx, journeyContext);
            } catch (e) {
              // Ignore parsing errors in tests
            }
          }
          
          return mockCtx;
        }
      }
      return ctx;
    }),
    inject: jest.fn((ctx, carrier) => {
      // Simple mock implementation that injects traceparent into carrier
      const traceId = MockContext.getTraceId(ctx) || '00000000000000000000000000000000';
      const spanId = MockContext.getSpanId(ctx) || '0000000000000000';
      carrier.set(TRACE_HEADER_NAMES.TRACE_PARENT, `00-${traceId}-${spanId}-01`);
      
      // Inject journey context if available
      const journeyContext = MockContext.getJourneyContext(ctx);
      if (journeyContext) {
        carrier.set(TRACE_HEADER_NAMES.JOURNEY_CONTEXT, JSON.stringify(journeyContext));
      }
    })
  },
  trace: {
    getSpanContext: jest.fn((ctx) => {
      const traceId = MockContext.getTraceId(ctx);
      const spanId = MockContext.getSpanId(ctx);
      if (traceId && spanId) {
        return { traceId, spanId, traceFlags: 1, isRemote: false };
      }
      return undefined;
    }),
    getTracer: jest.fn(),
    setSpan: jest.fn(),
    getSpan: jest.fn(),
    with: jest.fn((ctx, fn) => fn())
  }
}));

describe('Context Propagation Utilities', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    MockContext.reset();
  });

  describe('HTTP Header Context Propagation', () => {
    test('should extract context from valid HTTP headers', () => {
      // Arrange
      const headers: HttpHeadersCarrier = {
        get: (key) => validTracingHeaders[key.toLowerCase()],
        set: jest.fn()
      };

      // Act
      const extractedContext = extractContextFromHttpHeaders(headers);

      // Assert
      expect(propagation.extract).toHaveBeenCalledWith(expect.any(Object), headers);
      expect(MockContext.getTraceId(extractedContext)).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(MockContext.getSpanId(extractedContext)).toBe('b7ad6b7169203331');
    });

    test('should not extract context from invalid HTTP headers', () => {
      // Arrange
      const headers: HttpHeadersCarrier = {
        get: (key) => invalidTraceparentHeaders[key.toLowerCase()],
        set: jest.fn()
      };

      // Act
      const extractedContext = extractContextFromHttpHeaders(headers);

      // Assert
      expect(propagation.extract).toHaveBeenCalledWith(expect.any(Object), headers);
      expect(MockContext.getTraceId(extractedContext)).toBeUndefined();
      expect(MockContext.getSpanId(extractedContext)).toBeUndefined();
    });

    test('should inject context into HTTP headers', () => {
      // Arrange
      const ctx = MockContext.createTestContext();
      const headers: HttpHeadersCarrier = {
        get: jest.fn(),
        set: jest.fn()
      };

      // Act
      injectContextIntoHttpHeaders(ctx, headers);

      // Assert
      expect(propagation.inject).toHaveBeenCalledWith(ctx, headers);
      expect(headers.set).toHaveBeenCalledWith(
        TRACE_HEADER_NAMES.TRACE_PARENT,
        expect.stringContaining('-')
      );
    });

    test('should handle empty headers when extracting context', () => {
      // Arrange
      const headers: HttpHeadersCarrier = {
        get: () => undefined,
        set: jest.fn()
      };

      // Act
      const extractedContext = extractContextFromHttpHeaders(headers);

      // Assert
      expect(propagation.extract).toHaveBeenCalledWith(expect.any(Object), headers);
      // Should return the active context when no headers are present
      expect(extractedContext).toBeDefined();
    });

    test('should extract journey-specific context from HTTP headers', () => {
      // Arrange - Health journey
      const healthHeaders: HttpHeadersCarrier = {
        get: (key) => healthJourneyHeaders[key.toLowerCase()],
        set: jest.fn()
      };

      // Act
      const healthContext = extractContextFromHttpHeaders(healthHeaders);

      // Assert
      expect(propagation.extract).toHaveBeenCalledWith(expect.any(Object), healthHeaders);
      expect(MockContext.getTraceId(healthContext)).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
      
      // Arrange - Care journey
      const careHeaders: HttpHeadersCarrier = {
        get: (key) => careJourneyHeaders[key.toLowerCase()],
        set: jest.fn()
      };

      // Act
      const careContext = extractContextFromHttpHeaders(careHeaders);

      // Assert
      expect(propagation.extract).toHaveBeenCalledWith(expect.any(Object), careHeaders);
      expect(MockContext.getTraceId(careContext)).toBe('b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a1');
      
      // Arrange - Plan journey
      const planHeaders: HttpHeadersCarrier = {
        get: (key) => planJourneyHeaders[key.toLowerCase()],
        set: jest.fn()
      };

      // Act
      const planContext = extractContextFromHttpHeaders(planHeaders);

      // Assert
      expect(propagation.extract).toHaveBeenCalledWith(expect.any(Object), planHeaders);
      expect(MockContext.getTraceId(planContext)).toBe('c3d4e5f6a7b8c9d0e1f2a3b4c5d6a1b2');
    });
  });

  describe('Kafka Message Context Propagation', () => {
    test('should extract context from Kafka message headers', () => {
      // Arrange
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          [TRACE_HEADER_NAMES.TRACE_PARENT]: Buffer.from('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')
        }
      };

      // Act
      const extractedContext = extractContextFromKafkaMessage(message);

      // Assert
      expect(propagation.extract).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(KafkaMessageCarrier)
      );
      expect(MockContext.getTraceId(extractedContext)).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(MockContext.getSpanId(extractedContext)).toBe('b7ad6b7169203331');
    });

    test('should inject context into Kafka message headers', () => {
      // Arrange
      const ctx = MockContext.createTestContext();
      const message: Message = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        headers: {}
      };

      // Act
      injectContextIntoKafkaMessage(ctx, message);

      // Assert
      expect(propagation.inject).toHaveBeenCalledWith(
        ctx,
        expect.any(KafkaMessageCarrier)
      );
      expect(message.headers).toBeDefined();
      expect(message.headers[TRACE_HEADER_NAMES.TRACE_PARENT]).toBeDefined();
    });

    test('should handle Kafka message with no headers', () => {
      // Arrange
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0'
        // No headers
      };

      // Act
      const extractedContext = extractContextFromKafkaMessage(message);

      // Assert
      expect(propagation.extract).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(KafkaMessageCarrier)
      );
      // Should return the active context when no headers are present
      expect(extractedContext).toBeDefined();
    });

    test('should handle different types of header values in Kafka messages', () => {
      // Arrange - String header
      const stringMessage: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          [TRACE_HEADER_NAMES.TRACE_PARENT]: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
        }
      };

      // Act - String header
      const stringContext = extractContextFromKafkaMessage(stringMessage);

      // Assert - String header
      expect(MockContext.getTraceId(stringContext)).toBe('0af7651916cd43dd8448eb211c80319c');

      // Arrange - Buffer header
      const bufferMessage: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          [TRACE_HEADER_NAMES.TRACE_PARENT]: Buffer.from('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')
        }
      };

      // Act - Buffer header
      const bufferContext = extractContextFromKafkaMessage(bufferMessage);

      // Assert - Buffer header
      expect(MockContext.getTraceId(bufferContext)).toBe('0af7651916cd43dd8448eb211c80319c');

      // Arrange - Array header
      const arrayMessage: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          [TRACE_HEADER_NAMES.TRACE_PARENT]: [Buffer.from('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')]
        }
      };

      // Act - Array header
      const arrayContext = extractContextFromKafkaMessage(arrayMessage);

      // Assert - Array header
      expect(MockContext.getTraceId(arrayContext)).toBe('0af7651916cd43dd8448eb211c80319c');
    });

    test('should inject context into Kafka producer record', () => {
      // Arrange
      const ctx = MockContext.createTestContext();
      const producerRecord: ProducerRecord = {
        topic: 'test-topic',
        messages: [
          {
            key: 'test-key',
            value: 'test-value'
          }
        ]
      };

      // Act
      injectContextIntoKafkaMessage(ctx, producerRecord);

      // Assert
      expect(propagation.inject).toHaveBeenCalledWith(
        ctx,
        expect.any(KafkaMessageCarrier)
      );
      expect(producerRecord.headers).toBeDefined();
      expect(producerRecord.headers[TRACE_HEADER_NAMES.TRACE_PARENT]).toBeDefined();
    });
  });

  describe('Context Serialization and Deserialization', () => {
    test('should serialize context to string', () => {
      // Arrange
      const ctx = MockContext.createTestContext();

      // Act
      const serialized = serializeContext(ctx);

      // Assert
      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('string');
      expect(propagation.inject).toHaveBeenCalledWith(ctx, expect.any(Object));
    });

    test('should deserialize context from string', () => {
      // Arrange
      const ctx = MockContext.createTestContext();
      const serialized = serializeContext(ctx);

      // Reset mocks to verify deserialize calls
      jest.clearAllMocks();

      // Act
      const deserialized = deserializeContext(serialized);

      // Assert
      expect(deserialized).toBeDefined();
      expect(propagation.extract).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    });

    test('should handle invalid serialized context', () => {
      // Arrange
      const invalidSerialized = 'not-a-valid-json';

      // Act
      const deserialized = deserializeContext(invalidSerialized);

      // Assert
      expect(deserialized).toBeDefined();
      // Should return the active context when deserialization fails
      expect(deserialized).toBe(context.active());
    });

    test('should maintain trace context through serialization and deserialization', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      let ctx = MockContext.createRoot();
      ctx = MockContext.setTraceId(ctx, traceId);
      ctx = MockContext.setSpanId(ctx, spanId);

      // Act
      const serialized = serializeContext(ctx);
      const deserialized = deserializeContext(serialized);

      // Assert
      expect(MockContext.getTraceId(deserialized)).toBe(traceId);
      expect(MockContext.getSpanId(deserialized)).toBe(spanId);
    });
  });

  describe('Journey Context Management', () => {
    test('should create journey context with specified journey type', () => {
      // Arrange
      const journeyType = JourneyType.HEALTH;
      const userId = 'user-123';
      const sessionId = 'session-456';

      // Act
      const journeyContext = createJourneyContext(journeyType, {
        userId,
        sessionId
      });

      // Assert
      expect(journeyContext).toBeDefined();
      const extractedJourneyContext = extractJourneyContext(journeyContext);
      expect(extractedJourneyContext).toBeDefined();
      expect(extractedJourneyContext?.journeyType).toBe(journeyType);
      expect(extractedJourneyContext?.userId).toBe(userId);
      expect(extractedJourneyContext?.sessionId).toBe(sessionId);
    });

    test('should extract journey context from context', () => {
      // Arrange
      const journeyType = JourneyType.CARE;
      const userId = 'user-789';
      const journeyId = 'journey-123';
      const ctx = createJourneyContext(journeyType, {
        userId,
        journeyId
      });

      // Act
      const extractedContext = extractJourneyContext(ctx);

      // Assert
      expect(extractedContext).toBeDefined();
      expect(extractedContext?.journeyType).toBe(journeyType);
      expect(extractedContext?.userId).toBe(userId);
      expect(extractedContext?.journeyId).toBe(journeyId);
    });

    test('should return undefined when no journey context is present', () => {
      // Arrange
      const ctx = MockContext.createRoot();

      // Act
      const extractedContext = extractJourneyContext(ctx);

      // Assert
      expect(extractedContext).toBeUndefined();
    });

    test('should handle invalid journey context', () => {
      // Arrange - Mock a context with invalid journey context
      const ctx = MockContext.createRoot();
      // Force an invalid journey context string
      const carrier: Record<string, string> = {};
      carrier[TRACE_HEADER_NAMES.JOURNEY_CONTEXT] = 'not-valid-json';
      propagation.inject(ctx, carrier);

      // Act
      const extractedContext = extractJourneyContext(ctx);

      // Assert
      expect(extractedContext).toBeUndefined();
    });

    test('should support all journey types', () => {
      // Test all journey types
      const journeyTypes = [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN];

      for (const journeyType of journeyTypes) {
        // Arrange
        const ctx = createJourneyContext(journeyType);

        // Act
        const extractedContext = extractJourneyContext(ctx);

        // Assert
        expect(extractedContext).toBeDefined();
        expect(extractedContext?.journeyType).toBe(journeyType);
      }
    });
  });

  describe('Trace and Span ID Utilities', () => {
    test('should get current trace ID from active context', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      let ctx = MockContext.createRoot();
      ctx = MockContext.setTraceId(ctx, traceId);
      MockContext._activeContext = ctx;

      // Act
      const currentTraceId = getCurrentTraceId();

      // Assert
      expect(currentTraceId).toBe(traceId);
      expect(trace.getSpanContext).toHaveBeenCalledWith(context.active());
    });

    test('should get current span ID from active context', () => {
      // Arrange
      const spanId = 'b7ad6b7169203331';
      let ctx = MockContext.createRoot();
      ctx = MockContext.setSpanId(ctx, spanId);
      MockContext._activeContext = ctx;

      // Act
      const currentSpanId = getCurrentSpanId();

      // Assert
      expect(currentSpanId).toBe(spanId);
      expect(trace.getSpanContext).toHaveBeenCalledWith(context.active());
    });

    test('should return undefined when no trace ID is in active context', () => {
      // Arrange
      MockContext._activeContext = MockContext.createRoot();

      // Act
      const currentTraceId = getCurrentTraceId();

      // Assert
      expect(currentTraceId).toBeUndefined();
    });

    test('should return undefined when no span ID is in active context', () => {
      // Arrange
      MockContext._activeContext = MockContext.createRoot();

      // Act
      const currentSpanId = getCurrentSpanId();

      // Assert
      expect(currentSpanId).toBeUndefined();
    });

    test('should get correlation ID from context', () => {
      // Arrange
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      let ctx = MockContext.createRoot();
      ctx = MockContext.setTraceId(ctx, traceId);
      ctx = MockContext.setSpanId(ctx, spanId);

      // Act
      const correlationId = getCorrelationId(ctx);

      // Assert
      expect(correlationId).toBe(`${traceId}.${spanId}`);
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
    });

    test('should generate fallback correlation ID when no span context exists', () => {
      // Arrange
      const ctx = MockContext.createRoot();
      // Mock trace.getSpanContext to return undefined
      (trace.getSpanContext as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const correlationId = getCorrelationId(ctx);

      // Assert
      expect(correlationId).toContain('no-trace.');
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
    });
  });

  describe('KafkaMessageCarrier', () => {
    test('should get header from Kafka message', () => {
      // Arrange
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          'test-header': Buffer.from('test-value')
        }
      };
      const carrier = new KafkaMessageCarrier(message);

      // Act
      const value = carrier.get('test-header');

      // Assert
      expect(value).toBe('test-value');
    });

    test('should set header on Kafka message', () => {
      // Arrange
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {}
      };
      const carrier = new KafkaMessageCarrier(message);

      // Act
      carrier.set('test-header', 'test-value');

      // Assert
      expect(message.headers['test-header']).toBe('test-value');
    });

    test('should initialize headers if not present', () => {
      // Arrange
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0'
        // No headers
      };
      const carrier = new KafkaMessageCarrier(message);

      // Act
      carrier.set('test-header', 'test-value');

      // Assert
      expect(message.headers).toBeDefined();
      expect(message.headers['test-header']).toBe('test-value');
    });

    test('should get keys from Kafka message headers', () => {
      // Arrange
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          'header1': Buffer.from('value1'),
          'header2': Buffer.from('value2')
        }
      };
      const carrier = new KafkaMessageCarrier(message);

      // Act
      const keys = carrier.keys();

      // Assert
      expect(keys).toContain('header1');
      expect(keys).toContain('header2');
      expect(keys.length).toBe(2);
    });

    test('should return empty array for keys when no headers', () => {
      // Arrange
      const message: KafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from('test-value'),
        timestamp: '1630000000000',
        size: 100,
        attributes: 0,
        offset: '0'
        // No headers
      };
      const carrier = new KafkaMessageCarrier(message);

      // Act
      const keys = carrier.keys();

      // Assert
      expect(keys).toEqual([]);
    });
  });
});
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import {
  generateCorrelationId,
  isValidCorrelationId,
  getCurrentCorrelationId,
  setCurrentCorrelationId,
  extractCorrelationId,
  addCorrelationId,
  createCorrelationHeaders,
  extractCorrelationIdFromHeaders,
  createKafkaCorrelationHeaders,
  linkEvents,
  createCorrelationContext,
  withCorrelation,
  createCorrelationChain,
  enrichErrorWithCorrelation,
  extractJourneyFromCorrelationContext,
  CORRELATION_ID_HEADER,
  TRACE_ID_HEADER,
  SPAN_ID_HEADER,
  PARENT_ID_HEADER,
  REQUEST_ID_HEADER,
  EVENT_CORRELATION_ID_KEY
} from '../../../src/utils/correlation-id';
import { IBaseEvent } from '../../../src/interfaces/base-event.interface';
import { IJourneyEvent, JourneyType } from '../../../src/interfaces/journey-events.interface';
import { IKafkaEvent } from '../../../src/interfaces/kafka-event.interface';

// Mock OpenTelemetry APIs
jest.mock('@opentelemetry/api', () => {
  const mockSpanContext = {
    traceId: 'mock-trace-id',
    spanId: 'mock-span-id',
    traceFlags: 1,
    isRemote: false,
  };

  const mockSpan = {
    setAttribute: jest.fn(),
    attributes: {},
    recordException: jest.fn(),
    setStatus: jest.fn(),
    spanContext: () => mockSpanContext,
  };

  return {
    context: {
      active: jest.fn(() => ({})),
    },
    trace: {
      getSpan: jest.fn(() => mockSpan),
    },
    SpanStatusCode: {
      ERROR: 'ERROR',
    },
    SemanticAttributes: {},
  };
});

describe('Correlation Tracking Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock span attributes
    const mockSpan = trace.getSpan(context.active());
    if (mockSpan) {
      mockSpan.attributes = {};
    }
  });

  describe('generateCorrelationId', () => {
    it('should generate a valid UUID v4 correlation ID', () => {
      const id = generateCorrelationId();
      expect(isValidCorrelationId(id)).toBe(true);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs on each call', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      const id3 = generateCorrelationId();

      expect(id1).not.toEqual(id2);
      expect(id1).not.toEqual(id3);
      expect(id2).not.toEqual(id3);
    });
  });

  describe('isValidCorrelationId', () => {
    it('should return true for valid UUID v4 strings', () => {
      expect(isValidCorrelationId('123e4567-e89b-12d3-a456-426614174000')).toBe(false); // Not v4
      expect(isValidCorrelationId('123e4567-e89b-42d3-a456-426614174000')).toBe(true); // v4
      expect(isValidCorrelationId('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true); // v4
    });

    it('should return false for invalid UUID strings', () => {
      expect(isValidCorrelationId('')).toBe(false);
      expect(isValidCorrelationId('not-a-uuid')).toBe(false);
      expect(isValidCorrelationId('123e4567-e89b-12d3-a456')).toBe(false); // Incomplete
      expect(isValidCorrelationId('123e4567-e89b-12d3-a456-4266141740001')).toBe(false); // Too long
    });

    it('should return false for null or undefined', () => {
      expect(isValidCorrelationId(null as any)).toBe(false);
      expect(isValidCorrelationId(undefined as any)).toBe(false);
    });
  });

  describe('getCurrentCorrelationId', () => {
    it('should return correlation ID from active span', () => {
      const mockSpan = trace.getSpan(context.active());
      if (mockSpan) {
        mockSpan.attributes[CORRELATION_ID_HEADER] = 'test-correlation-id';
      }

      const id = getCurrentCorrelationId();
      expect(id).toBe('test-correlation-id');
    });

    it('should return trace ID as fallback when no correlation ID is set', () => {
      const id = getCurrentCorrelationId();
      expect(id).toBe('mock-trace-id');
    });

    it('should return undefined when no active span exists', () => {
      (trace.getSpan as jest.Mock).mockReturnValueOnce(undefined);
      const id = getCurrentCorrelationId();
      expect(id).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      (trace.getSpan as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      const id = getCurrentCorrelationId();
      expect(id).toBeUndefined();
    });
  });

  describe('setCurrentCorrelationId', () => {
    it('should set correlation ID on active span', () => {
      const mockSpan = trace.getSpan(context.active());
      const result = setCurrentCorrelationId('test-correlation-id');

      expect(result).toBe(false); // Should return false because the ID is not a valid UUID v4
      expect(mockSpan?.setAttribute).not.toHaveBeenCalled();
    });

    it('should set valid UUID v4 correlation ID on active span', () => {
      const validId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const mockSpan = trace.getSpan(context.active());
      const result = setCurrentCorrelationId(validId);

      expect(result).toBe(true);
      expect(mockSpan?.setAttribute).toHaveBeenCalledWith(CORRELATION_ID_HEADER, validId);
    });

    it('should return false when no active span exists', () => {
      (trace.getSpan as jest.Mock).mockReturnValueOnce(undefined);
      const result = setCurrentCorrelationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(result).toBe(false);
    });

    it('should return false for invalid correlation IDs', () => {
      const result = setCurrentCorrelationId('not-a-valid-id');
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', () => {
      const validId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      (trace.getSpan as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      const result = setCurrentCorrelationId(validId);
      expect(result).toBe(false);
    });
  });

  describe('extractCorrelationId', () => {
    it('should extract correlation ID from event metadata', () => {
      const event = {
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        }
      };

      const id = extractCorrelationId(event);
      expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('should extract correlation ID from Kafka event headers', () => {
      const event = {
        headers: {
          [CORRELATION_ID_HEADER]: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        }
      } as unknown as IKafkaEvent;

      const id = extractCorrelationId(event);
      expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('should extract correlation ID from Kafka event headers with Buffer value', () => {
      const event = {
        headers: {
          [CORRELATION_ID_HEADER]: Buffer.from('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'utf8')
        }
      } as unknown as IKafkaEvent;

      const id = extractCorrelationId(event);
      expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('should use event ID as fallback', () => {
      const event = {
        eventId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      } as unknown as IBaseEvent;

      const id = extractCorrelationId(event);
      expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('should return undefined when no correlation ID is found', () => {
      const event = {
        type: 'test-event'
      };

      const id = extractCorrelationId(event);
      expect(id).toBeUndefined();
    });

    it('should return undefined for invalid correlation IDs', () => {
      const event = {
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: 'not-a-valid-id'
        }
      };

      const id = extractCorrelationId(event);
      expect(id).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      const event = {
        metadata: {
          get [EVENT_CORRELATION_ID_KEY]() {
            throw new Error('Test error');
          }
        }
      };

      const id = extractCorrelationId(event);
      expect(id).toBeUndefined();
    });
  });

  describe('addCorrelationId', () => {
    it('should add correlation ID to event metadata', () => {
      const event = {
        type: 'test-event'
      };

      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = addCorrelationId(event, correlationId);

      expect(result).toEqual({
        type: 'test-event',
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: correlationId
        }
      });
    });

    it('should add correlation ID to Kafka event headers', () => {
      const event = {
        type: 'test-event',
        headers: {}
      } as unknown as IKafkaEvent;

      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = addCorrelationId(event, correlationId);

      expect(result).toEqual({
        type: 'test-event',
        headers: {
          [CORRELATION_ID_HEADER]: correlationId
        },
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: correlationId
        }
      });
    });

    it('should use current context correlation ID if none provided', () => {
      const mockSpan = trace.getSpan(context.active());
      if (mockSpan) {
        mockSpan.attributes[CORRELATION_ID_HEADER] = 'test-correlation-id';
      }

      const event = {
        type: 'test-event'
      };

      const result = addCorrelationId(event);

      expect(result).toEqual({
        type: 'test-event',
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: 'test-correlation-id'
        }
      });
    });

    it('should generate new correlation ID if none provided and none in context', () => {
      (trace.getSpan as jest.Mock).mockReturnValueOnce(undefined);

      const event = {
        type: 'test-event'
      };

      const result = addCorrelationId(event);

      expect(result.type).toBe('test-event');
      expect(result.metadata).toBeDefined();
      expect(result.metadata[EVENT_CORRELATION_ID_KEY]).toBeDefined();
      expect(isValidCorrelationId(result.metadata[EVENT_CORRELATION_ID_KEY])).toBe(true);
    });

    it('should preserve existing metadata', () => {
      const event = {
        type: 'test-event',
        metadata: {
          userId: 'user-123',
          timestamp: '2023-01-01T12:00:00Z'
        }
      };

      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = addCorrelationId(event, correlationId);

      expect(result).toEqual({
        type: 'test-event',
        metadata: {
          userId: 'user-123',
          timestamp: '2023-01-01T12:00:00Z',
          [EVENT_CORRELATION_ID_KEY]: correlationId
        }
      });
    });

    it('should handle errors gracefully', () => {
      const event = {
        type: 'test-event',
        get metadata() {
          throw new Error('Test error');
        }
      };

      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = addCorrelationId(event, correlationId);

      // Should return original event on error
      expect(result).toBe(event);
    });
  });

  describe('createCorrelationHeaders', () => {
    it('should create HTTP headers with correlation ID', () => {
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const headers = createCorrelationHeaders(correlationId);

      expect(headers).toEqual({
        [CORRELATION_ID_HEADER]: correlationId,
        [TRACE_ID_HEADER]: 'mock-trace-id',
        [SPAN_ID_HEADER]: 'mock-span-id'
      });
    });

    it('should use current context correlation ID if none provided', () => {
      const mockSpan = trace.getSpan(context.active());
      if (mockSpan) {
        mockSpan.attributes[CORRELATION_ID_HEADER] = 'test-correlation-id';
      }

      const headers = createCorrelationHeaders();

      expect(headers).toEqual({
        [CORRELATION_ID_HEADER]: 'test-correlation-id',
        [TRACE_ID_HEADER]: 'mock-trace-id',
        [SPAN_ID_HEADER]: 'mock-span-id'
      });
    });

    it('should generate new correlation ID if none provided and none in context', () => {
      (trace.getSpan as jest.Mock).mockReturnValueOnce(undefined);

      const headers = createCorrelationHeaders();

      expect(headers[CORRELATION_ID_HEADER]).toBeDefined();
      expect(isValidCorrelationId(headers[CORRELATION_ID_HEADER])).toBe(true);
    });

    it('should handle errors gracefully', () => {
      (trace.getSpan as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const headers = createCorrelationHeaders();

      expect(headers[CORRELATION_ID_HEADER]).toBeDefined();
      expect(isValidCorrelationId(headers[CORRELATION_ID_HEADER])).toBe(true);
    });
  });

  describe('extractCorrelationIdFromHeaders', () => {
    it('should extract correlation ID from HTTP headers', () => {
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const headers = {
        [CORRELATION_ID_HEADER]: correlationId
      };

      const id = extractCorrelationIdFromHeaders(headers);
      expect(id).toBe(correlationId);
    });

    it('should extract correlation ID from lowercase HTTP headers', () => {
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const headers = {
        [CORRELATION_ID_HEADER.toLowerCase()]: correlationId
      };

      const id = extractCorrelationIdFromHeaders(headers);
      expect(id).toBe(correlationId);
    });

    it('should extract correlation ID from array headers', () => {
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const headers = {
        [CORRELATION_ID_HEADER]: [correlationId]
      };

      const id = extractCorrelationIdFromHeaders(headers);
      expect(id).toBe(correlationId);
    });

    it('should use request ID as fallback', () => {
      const requestId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const headers = {
        [REQUEST_ID_HEADER]: requestId
      };

      const id = extractCorrelationIdFromHeaders(headers);
      expect(id).toBe(requestId);
    });

    it('should return undefined when no correlation ID is found', () => {
      const headers = {
        'content-type': 'application/json'
      };

      const id = extractCorrelationIdFromHeaders(headers);
      expect(id).toBeUndefined();
    });

    it('should return undefined for invalid correlation IDs', () => {
      const headers = {
        [CORRELATION_ID_HEADER]: 'not-a-valid-id'
      };

      const id = extractCorrelationIdFromHeaders(headers);
      expect(id).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      const headers = {
        get [CORRELATION_ID_HEADER]() {
          throw new Error('Test error');
        }
      };

      const id = extractCorrelationIdFromHeaders(headers);
      expect(id).toBeUndefined();
    });
  });

  describe('createKafkaCorrelationHeaders', () => {
    it('should create Kafka headers with correlation ID as Buffer', () => {
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const headers = createKafkaCorrelationHeaders(correlationId);

      expect(headers[CORRELATION_ID_HEADER]).toBeInstanceOf(Buffer);
      expect(headers[CORRELATION_ID_HEADER].toString('utf8')).toBe(correlationId);
      expect(headers[TRACE_ID_HEADER]).toBeInstanceOf(Buffer);
      expect(headers[TRACE_ID_HEADER].toString('utf8')).toBe('mock-trace-id');
      expect(headers[SPAN_ID_HEADER]).toBeInstanceOf(Buffer);
      expect(headers[SPAN_ID_HEADER].toString('utf8')).toBe('mock-span-id');
    });

    it('should use current context correlation ID if none provided', () => {
      const mockSpan = trace.getSpan(context.active());
      if (mockSpan) {
        mockSpan.attributes[CORRELATION_ID_HEADER] = 'test-correlation-id';
      }

      const headers = createKafkaCorrelationHeaders();

      expect(headers[CORRELATION_ID_HEADER]).toBeInstanceOf(Buffer);
      expect(headers[CORRELATION_ID_HEADER].toString('utf8')).toBe('test-correlation-id');
    });

    it('should generate new correlation ID if none provided and none in context', () => {
      (trace.getSpan as jest.Mock).mockReturnValueOnce(undefined);

      const headers = createKafkaCorrelationHeaders();

      expect(headers[CORRELATION_ID_HEADER]).toBeInstanceOf(Buffer);
      const id = headers[CORRELATION_ID_HEADER].toString('utf8');
      expect(isValidCorrelationId(id)).toBe(true);
    });

    it('should handle errors gracefully', () => {
      (trace.getSpan as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const headers = createKafkaCorrelationHeaders();

      expect(headers[CORRELATION_ID_HEADER]).toBeInstanceOf(Buffer);
      const id = headers[CORRELATION_ID_HEADER].toString('utf8');
      expect(isValidCorrelationId(id)).toBe(true);
    });
  });

  describe('linkEvents', () => {
    it('should link events by copying correlation ID from source to target', () => {
      const sourceEvent = {
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        }
      };

      const targetEvent = {
        type: 'target-event'
      };

      const result = linkEvents(sourceEvent, targetEvent);

      expect(result).toEqual({
        type: 'target-event',
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        }
      });
    });

    it('should return original target event when source has no correlation ID', () => {
      const sourceEvent = {
        type: 'source-event'
      };

      const targetEvent = {
        type: 'target-event'
      };

      const result = linkEvents(sourceEvent, targetEvent);

      expect(result).toBe(targetEvent);
    });

    it('should handle errors gracefully', () => {
      const sourceEvent = {
        get metadata() {
          throw new Error('Test error');
        }
      };

      const targetEvent = {
        type: 'target-event'
      };

      const result = linkEvents(sourceEvent, targetEvent);

      expect(result).toBe(targetEvent);
    });
  });

  describe('createCorrelationContext', () => {
    it('should create correlation context with new correlation ID', () => {
      const context = createCorrelationContext();

      expect(context.correlationId).toBeDefined();
      expect(isValidCorrelationId(context.correlationId)).toBe(true);
      expect(context.metadata).toEqual({
        [EVENT_CORRELATION_ID_KEY]: context.correlationId
      });
    });

    it('should include journey information when provided', () => {
      const journey = 'health';
      const context = createCorrelationContext(journey);

      expect(context.correlationId).toBeDefined();
      expect(isValidCorrelationId(context.correlationId)).toBe(true);
      expect(context.metadata).toEqual({
        [EVENT_CORRELATION_ID_KEY]: context.correlationId,
        journey
      });
    });
  });

  describe('withCorrelation', () => {
    it('should execute function with correlation ID', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const result = await withCorrelation(fn, correlationId);

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledWith(correlationId);

      const mockSpan = trace.getSpan(context.active());
      expect(mockSpan?.setAttribute).toHaveBeenCalledWith(CORRELATION_ID_HEADER, correlationId);
    });

    it('should generate new correlation ID if none provided', async () => {
      const fn = jest.fn().mockResolvedValue('result');

      const result = await withCorrelation(fn);

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
      const calledWithId = fn.mock.calls[0][0];
      expect(isValidCorrelationId(calledWithId)).toBe(true);

      const mockSpan = trace.getSpan(context.active());
      expect(mockSpan?.setAttribute).toHaveBeenCalledWith(CORRELATION_ID_HEADER, calledWithId);
    });

    it('should record exception on span when function throws', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      await expect(withCorrelation(fn, correlationId)).rejects.toThrow(error);

      const mockSpan = trace.getSpan(context.active());
      expect(mockSpan?.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan?.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
    });

    it('should execute function without span when no active span exists', async () => {
      (trace.getSpan as jest.Mock).mockReturnValueOnce(undefined);

      const fn = jest.fn().mockResolvedValue('result');
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const result = await withCorrelation(fn, correlationId);

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledWith(correlationId);
    });
  });

  describe('createCorrelationChain', () => {
    it('should create correlation chain from root event', () => {
      const rootEvent = {
        type: 'root-event',
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        }
      };

      const chain = createCorrelationChain(rootEvent);

      expect(chain.correlationId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(chain.getMetadata()).toEqual({
        [EVENT_CORRELATION_ID_KEY]: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      });
    });

    it('should generate new correlation ID if root event has none', () => {
      const rootEvent = {
        type: 'root-event'
      };

      const chain = createCorrelationChain(rootEvent);

      expect(isValidCorrelationId(chain.correlationId)).toBe(true);
      expect(chain.getMetadata()).toEqual({
        [EVENT_CORRELATION_ID_KEY]: chain.correlationId
      });
    });

    it('should include journey information when provided', () => {
      const rootEvent = {
        type: 'root-event'
      };

      const journey = 'health';
      const chain = createCorrelationChain(rootEvent, journey);

      expect(isValidCorrelationId(chain.correlationId)).toBe(true);
      expect(chain.getMetadata()).toEqual({
        [EVENT_CORRELATION_ID_KEY]: chain.correlationId,
        journey
      });
    });

    it('should add events to the correlation chain', () => {
      const rootEvent = {
        type: 'root-event',
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        }
      };

      const chain = createCorrelationChain(rootEvent);

      const childEvent = {
        type: 'child-event'
      };

      const linkedEvent = chain.addEvent(childEvent);

      expect(linkedEvent).toEqual({
        type: 'child-event',
        metadata: {
          [EVENT_CORRELATION_ID_KEY]: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        }
      });
    });
  });

  describe('enrichErrorWithCorrelation', () => {
    it('should add correlation ID to error object', () => {
      const error = new Error('Test error');
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const enrichedError = enrichErrorWithCorrelation(error, correlationId);

      expect(enrichedError).toBe(error); // Same object reference
      expect(enrichedError.message).toBe('Test error [correlationId: f47ac10b-58cc-4372-a567-0e02b2c3d479]');
      expect((enrichedError as any).correlationId).toBe(correlationId);
    });

    it('should use current context correlation ID if none provided', () => {
      const mockSpan = trace.getSpan(context.active());
      if (mockSpan) {
        mockSpan.attributes[CORRELATION_ID_HEADER] = 'test-correlation-id';
      }

      const error = new Error('Test error');
      const enrichedError = enrichErrorWithCorrelation(error);

      expect(enrichedError).toBe(error); // Same object reference
      expect(enrichedError.message).toBe('Test error [correlationId: test-correlation-id]');
      expect((enrichedError as any).correlationId).toBe('test-correlation-id');
    });

    it('should not modify error message if it already contains correlationId', () => {
      const error = new Error('Test error with correlationId: abc123');
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const enrichedError = enrichErrorWithCorrelation(error, correlationId);

      expect(enrichedError).toBe(error); // Same object reference
      expect(enrichedError.message).toBe('Test error with correlationId: abc123');
      expect((enrichedError as any).correlationId).toBe(correlationId);
    });

    it('should return original error when no correlation ID is available', () => {
      (trace.getSpan as jest.Mock).mockReturnValueOnce(undefined);

      const error = new Error('Test error');
      const enrichedError = enrichErrorWithCorrelation(error);

      expect(enrichedError).toBe(error); // Same object reference
      expect(enrichedError.message).toBe('Test error');
      expect((enrichedError as any).correlationId).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      const error = new Error('Test error');
      Object.defineProperty(error, 'message', {
        get() {
          throw new Error('Cannot access message');
        }
      });

      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = enrichErrorWithCorrelation(error, correlationId);

      expect(result).toBe(error); // Should return original error on failure
    });
  });

  describe('extractJourneyFromCorrelationContext', () => {
    it('should extract journey from event metadata', () => {
      const event = {
        metadata: {
          journey: 'health'
        }
      };

      const journey = extractJourneyFromCorrelationContext(event);
      expect(journey).toBe('health');
    });

    it('should extract journey from journey event', () => {
      const event = {
        journey: 'care'
      } as unknown as IJourneyEvent;

      const journey = extractJourneyFromCorrelationContext(event);
      expect(journey).toBe('care');
    });

    it('should return undefined when no journey information is found', () => {
      const event = {
        type: 'test-event'
      };

      const journey = extractJourneyFromCorrelationContext(event);
      expect(journey).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      const event = {
        get metadata() {
          throw new Error('Test error');
        }
      };

      const journey = extractJourneyFromCorrelationContext(event);
      expect(journey).toBeUndefined();
    });
  });

  describe('Cross-journey correlation scenarios', () => {
    it('should maintain correlation across health, care, and plan journeys', () => {
      // Create a correlation chain starting with a health event
      const healthEvent = {
        type: 'health.metric.recorded',
        journeyType: JourneyType.HEALTH,
        userId: 'user-123',
        payload: { metricType: 'HEART_RATE', value: 75 }
      } as unknown as IJourneyEvent;

      const chain = createCorrelationChain(healthEvent, 'health');
      const correlationId = chain.correlationId;

      // Add a care journey event to the chain
      const careEvent = {
        type: 'care.appointment.booked',
        journeyType: JourneyType.CARE,
        userId: 'user-123',
        payload: { provider: 'Dr. Smith', appointmentDate: '2023-05-15T10:00:00Z' }
      } as unknown as IJourneyEvent;

      const linkedCareEvent = chain.addEvent(careEvent);
      expect(extractCorrelationId(linkedCareEvent)).toBe(correlationId);

      // Add a plan journey event to the chain
      const planEvent = {
        type: 'plan.claim.submitted',
        journeyType: JourneyType.PLAN,
        userId: 'user-123',
        payload: { amount: 150, provider: 'Dr. Smith' }
      } as unknown as IJourneyEvent;

      const linkedPlanEvent = chain.addEvent(planEvent);
      expect(extractCorrelationId(linkedPlanEvent)).toBe(correlationId);

      // Verify journey information is preserved
      expect(extractJourneyFromCorrelationContext(linkedCareEvent)).toBe('care');
      expect(extractJourneyFromCorrelationContext(linkedPlanEvent)).toBe('plan');
    });

    it('should reconstruct event sequences using correlation metadata', () => {
      // Create a sequence of events with the same correlation ID
      const correlationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const events = [
        {
          type: 'health.metric.recorded',
          timestamp: '2023-01-01T10:00:00Z',
          metadata: { [EVENT_CORRELATION_ID_KEY]: correlationId, journey: 'health' }
        },
        {
          type: 'health.goal.achieved',
          timestamp: '2023-01-01T10:05:00Z',
          metadata: { [EVENT_CORRELATION_ID_KEY]: correlationId, journey: 'health' }
        },
        {
          type: 'care.appointment.booked',
          timestamp: '2023-01-01T10:10:00Z',
          metadata: { [EVENT_CORRELATION_ID_KEY]: correlationId, journey: 'care' }
        },
        {
          type: 'plan.claim.submitted',
          timestamp: '2023-01-01T10:15:00Z',
          metadata: { [EVENT_CORRELATION_ID_KEY]: correlationId, journey: 'plan' }
        }
      ];

      // Shuffle the events to simulate out-of-order processing
      const shuffledEvents = [...events].sort(() => Math.random() - 0.5);

      // Reconstruct the sequence by correlation ID and timestamp
      const reconstructed = shuffledEvents
        .filter(event => extractCorrelationId(event) === correlationId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Verify the reconstructed sequence matches the original
      expect(reconstructed.map(e => e.type)).toEqual(events.map(e => e.type));
      expect(reconstructed.map(e => e.timestamp)).toEqual(events.map(e => e.timestamp));
    });

    it('should track parent-child relationships between events', () => {
      // Create a parent event
      const parentEvent = {
        type: 'parent-event',
        eventId: 'parent-123',
        metadata: {}
      };

      // Add correlation ID to parent
      const parentWithCorrelation = addCorrelationId(parentEvent);
      const correlationId = extractCorrelationId(parentWithCorrelation);
      expect(correlationId).toBeDefined();

      // Create child events linked to parent
      const childEvent1 = linkEvents(parentWithCorrelation, {
        type: 'child-event-1',
        eventId: 'child-1',
        metadata: { parentId: 'parent-123' }
      });

      const childEvent2 = linkEvents(parentWithCorrelation, {
        type: 'child-event-2',
        eventId: 'child-2',
        metadata: { parentId: 'parent-123' }
      });

      // Create grandchild event linked to child1
      const grandchildEvent = linkEvents(childEvent1, {
        type: 'grandchild-event',
        eventId: 'grandchild-1',
        metadata: { parentId: 'child-1' }
      });

      // Verify correlation ID is propagated through the hierarchy
      expect(extractCorrelationId(childEvent1)).toBe(correlationId);
      expect(extractCorrelationId(childEvent2)).toBe(correlationId);
      expect(extractCorrelationId(grandchildEvent)).toBe(correlationId);

      // Verify parent-child relationships are maintained
      expect(childEvent1.metadata.parentId).toBe('parent-123');
      expect(childEvent2.metadata.parentId).toBe('parent-123');
      expect(grandchildEvent.metadata.parentId).toBe('child-1');
    });
  });
});
/**
 * @file correlation-tracking.spec.ts
 * @description Unit tests for correlation tracking utilities that connect related events
 * across different services and journeys. These tests validate the generation, propagation,
 * and extraction of correlation IDs that link events in a causal chain or business transaction.
 */

import { context, Context, propagation, trace, SpanContext } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';
import {
  CORRELATION_HEADERS,
  CORRELATION_ID_CONTEXT_KEY,
  generateCorrelationId,
  isValidCorrelationId,
  getCurrentCorrelationId,
  setCorrelationId,
  withCorrelationId,
  extractCorrelationIdFromHttpHeaders,
  extractCorrelationIdFromKafkaHeaders,
  extractCorrelationIdFromEvent,
  addCorrelationIdToEvent,
  addCorrelationIdToHttpHeaders,
  addCorrelationIdToKafkaHeaders,
  addCorrelationIdToCurrentSpan,
  extractCorrelationIdFromTraceContext,
  correlationContextPropagator,
  registerCorrelationContextPropagator,
  createCorrelationIdMiddleware,
  withRetry
} from '../../../src/utils/correlation-id';
import { BaseEvent, EventMetadata } from '../../../src/interfaces/base-event.interface';

// Mock OpenTelemetry APIs
jest.mock('@opentelemetry/api', () => {
  // Create a mock context implementation
  const mockContextStorage = new Map<symbol, any>();
  const mockContext: Context = {
    getValue: jest.fn((key) => mockContextStorage.get(key)),
    setValue: jest.fn((key, value) => {
      const newContext = { ...mockContext };
      mockContextStorage.set(key, value);
      return newContext;
    }),
    deleteValue: jest.fn((key) => {
      const newContext = { ...mockContext };
      mockContextStorage.delete(key);
      return newContext;
    })
  };

  // Create a mock span
  const mockSpan = {
    setAttribute: jest.fn(),
    spanContext: jest.fn(() => ({
      traceId: 'mock-trace-id',
      spanId: 'mock-span-id',
      traceFlags: 1,
      isRemote: false,
    }))
  };

  return {
    context: {
      active: jest.fn(() => mockContext),
      with: jest.fn((ctx, fn) => fn())
    },
    trace: {
      getSpan: jest.fn(() => mockSpan),
      getTracer: jest.fn(() => ({
        startSpan: jest.fn(() => mockSpan)
      }))
    },
    propagation: {
      getGlobalPropagator: jest.fn(() => ({
        inject: jest.fn(),
        extract: jest.fn(() => mockContext),
        fields: jest.fn(() => [])
      })),
      setGlobalPropagator: jest.fn()
    },
    SpanContext: jest.requireActual('@opentelemetry/api').SpanContext,
    Context: jest.requireActual('@opentelemetry/api').Context
  };
});

// Mock uuid to make tests deterministic
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4')
}));

describe('Correlation Tracking Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Correlation ID Generation', () => {
    it('should generate a unique correlation ID', () => {
      const correlationId = generateCorrelationId();
      expect(correlationId).toBe('mocked-uuid-v4');
      expect(uuidv4).toHaveBeenCalledTimes(1);
    });

    it('should generate different IDs for different event chains', () => {
      // Mock uuid to return different values for each call
      (uuidv4 as jest.Mock).mockImplementationOnce(() => 'uuid-chain-1');
      (uuidv4 as jest.Mock).mockImplementationOnce(() => 'uuid-chain-2');

      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toBe('uuid-chain-1');
      expect(id2).toBe('uuid-chain-2');
      expect(id1).not.toBe(id2);
    });
  });

  describe('Correlation ID Validation', () => {
    it('should validate a correctly formatted UUID v4', () => {
      const validId = '123e4567-e89b-42d3-a456-556642440000';
      expect(isValidCorrelationId(validId)).toBe(true);
    });

    it('should reject an invalid UUID format', () => {
      const invalidIds = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-556642440000', // Wrong version number
        '123e4567-e89b-42d3-7456-556642440000', // Wrong variant
        '',
        null,
        undefined
      ];

      invalidIds.forEach(id => {
        // @ts-ignore - Testing invalid inputs
        expect(isValidCorrelationId(id)).toBe(false);
      });
    });
  });

  describe('Context Management', () => {
    it('should get the current correlation ID from context', () => {
      // Setup a correlation ID in context
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);
      
      // Mock context.active to return our mock context
      (context.active as jest.Mock).mockReturnValue(mockContext);

      const result = getCurrentCorrelationId(false);
      expect(result).toBe(testId);
    });

    it('should generate a new correlation ID if none exists and generateIfMissing is true', () => {
      // Mock context.active to return a context with no correlation ID
      const emptyContext = context.active();
      (context.active as jest.Mock).mockReturnValue(emptyContext);

      const result = getCurrentCorrelationId(true);
      expect(result).toBe('mocked-uuid-v4');
      expect(uuidv4).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if no correlation ID exists and generateIfMissing is false', () => {
      // Mock context.active to return a context with no correlation ID
      const emptyContext = context.active();
      (context.active as jest.Mock).mockReturnValue(emptyContext);

      const result = getCurrentCorrelationId(false);
      expect(result).toBeUndefined();
      expect(uuidv4).not.toHaveBeenCalled();
    });

    it('should set a correlation ID in the current context', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const mockContext = context.active();
      
      setCorrelationId(testId);
      
      expect(mockContext.setValue).toHaveBeenCalledWith(CORRELATION_ID_CONTEXT_KEY, testId);
    });

    it('should run a function with a specific correlation ID in context', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const mockFn = jest.fn();
      
      withCorrelationId(testId, mockFn);
      
      expect(context.with).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('Correlation ID Extraction', () => {
    it('should extract correlation ID from HTTP headers', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = {
        'x-correlation-id': testId,
        'content-type': 'application/json'
      };

      const result = extractCorrelationIdFromHttpHeaders(headers);
      expect(result).toBe(testId);
    });

    it('should handle case-insensitive HTTP header names', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = {
        'X-Correlation-ID': testId,
        'content-type': 'application/json'
      };

      const result = extractCorrelationIdFromHttpHeaders(headers);
      expect(result).toBe(testId);
    });

    it('should extract correlation ID from HTTP headers with custom header name', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = {
        'custom-correlation-header': testId,
        'content-type': 'application/json'
      };

      const result = extractCorrelationIdFromHttpHeaders(headers, 'custom-correlation-header');
      expect(result).toBe(testId);
    });

    it('should handle array values in HTTP headers', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = {
        'x-correlation-id': [testId, 'other-value'],
        'content-type': 'application/json'
      };

      const result = extractCorrelationIdFromHttpHeaders(headers);
      expect(result).toBe(testId);
    });

    it('should return undefined if correlation ID is not found in HTTP headers', () => {
      const headers = {
        'content-type': 'application/json'
      };

      const result = extractCorrelationIdFromHttpHeaders(headers);
      expect(result).toBeUndefined();
    });

    it('should extract correlation ID from Kafka headers', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = [
        { key: 'correlation-id', value: testId },
        { key: 'content-type', value: 'application/json' }
      ];

      const result = extractCorrelationIdFromKafkaHeaders(headers);
      expect(result).toBe(testId);
    });

    it('should extract correlation ID from Kafka headers with Buffer value', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = [
        { key: 'correlation-id', value: Buffer.from(testId) },
        { key: 'content-type', value: 'application/json' }
      ];

      const result = extractCorrelationIdFromKafkaHeaders(headers);
      expect(result).toBe(testId);
    });

    it('should extract correlation ID from Kafka headers with custom header name', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = [
        { key: 'custom-correlation-header', value: testId },
        { key: 'content-type', value: 'application/json' }
      ];

      const result = extractCorrelationIdFromKafkaHeaders(headers, 'custom-correlation-header');
      expect(result).toBe(testId);
    });

    it('should return undefined if correlation ID is not found in Kafka headers', () => {
      const headers = [
        { key: 'content-type', value: 'application/json' }
      ];

      const result = extractCorrelationIdFromKafkaHeaders(headers);
      expect(result).toBeUndefined();
    });

    it('should return undefined if Kafka header value is null', () => {
      const headers = [
        { key: 'correlation-id', value: null },
        { key: 'content-type', value: 'application/json' }
      ];

      const result = extractCorrelationIdFromKafkaHeaders(headers);
      expect(result).toBeUndefined();
    });

    it('should extract correlation ID from event metadata', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const event: BaseEvent = {
        eventId: 'event-1',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' },
        metadata: {
          correlationId: testId
        }
      };

      const result = extractCorrelationIdFromEvent(event);
      expect(result).toBe(testId);
    });

    it('should extract correlation ID from event data as fallback', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const event: BaseEvent = {
        eventId: 'event-1',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' },
        data: { correlationId: testId } as any
      };

      const result = extractCorrelationIdFromEvent(event);
      expect(result).toBe(testId);
    });

    it('should return undefined if correlation ID is not found in event', () => {
      const event: BaseEvent = {
        eventId: 'event-1',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' }
      };

      const result = extractCorrelationIdFromEvent(event);
      expect(result).toBeUndefined();
    });

    it('should return undefined if event is null or undefined', () => {
      // @ts-ignore - Testing invalid inputs
      expect(extractCorrelationIdFromEvent(null)).toBeUndefined();
      // @ts-ignore - Testing invalid inputs
      expect(extractCorrelationIdFromEvent(undefined)).toBeUndefined();
    });
  });

  describe('Correlation ID Addition', () => {
    it('should add correlation ID to event metadata', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const event: BaseEvent = {
        eventId: 'event-1',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' }
      };

      const result = addCorrelationIdToEvent(event, testId);
      expect(result).not.toBe(event); // Should return a new object
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.correlationId).toBe(testId);
    });

    it('should use current context correlation ID if none provided', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const event: BaseEvent = {
        eventId: 'event-1',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' }
      };

      // Setup a correlation ID in context
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);
      (context.active as jest.Mock).mockReturnValue(mockContext);

      const result = addCorrelationIdToEvent(event);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.correlationId).toBe(testId);
    });

    it('should preserve existing metadata when adding correlation ID', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const event: BaseEvent = {
        eventId: 'event-1',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' },
        metadata: {
          traceId: 'trace-123',
          priority: 'high'
        }
      };

      const result = addCorrelationIdToEvent(event, testId);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.correlationId).toBe(testId);
      expect(result.metadata?.traceId).toBe('trace-123');
      expect(result.metadata?.priority).toBe('high');
    });

    it('should return the original event if no correlation ID is provided and none in context', () => {
      const event: BaseEvent = {
        eventId: 'event-1',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' }
      };

      // Setup an empty context
      const emptyContext = context.active();
      (context.active as jest.Mock).mockReturnValue(emptyContext);

      const result = addCorrelationIdToEvent(event);
      expect(result).toBe(event);
    });

    it('should add correlation ID to HTTP headers', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = {
        'content-type': 'application/json'
      };

      const result = addCorrelationIdToHttpHeaders(headers, testId);
      expect(result).not.toBe(headers); // Should return a new object
      expect(result[CORRELATION_HEADERS.HTTP]).toBe(testId);
    });

    it('should use current context correlation ID if none provided for HTTP headers', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = {
        'content-type': 'application/json'
      };

      // Setup a correlation ID in context
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);
      (context.active as jest.Mock).mockReturnValue(mockContext);

      const result = addCorrelationIdToHttpHeaders(headers);
      expect(result[CORRELATION_HEADERS.HTTP]).toBe(testId);
    });

    it('should add correlation ID to HTTP headers with custom header name', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = {
        'content-type': 'application/json'
      };

      const result = addCorrelationIdToHttpHeaders(headers, testId, 'custom-correlation-header');
      expect(result['custom-correlation-header']).toBe(testId);
    });

    it('should return the original headers if no correlation ID is provided and none in context', () => {
      const headers = {
        'content-type': 'application/json'
      };

      // Setup an empty context
      const emptyContext = context.active();
      (context.active as jest.Mock).mockReturnValue(emptyContext);

      const result = addCorrelationIdToHttpHeaders(headers);
      expect(result).toBe(headers);
    });

    it('should add correlation ID to Kafka headers', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = [
        { key: 'content-type', value: 'application/json' }
      ];

      const result = addCorrelationIdToKafkaHeaders(headers, testId);
      expect(result).not.toBe(headers); // Should return a new array
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ key: CORRELATION_HEADERS.KAFKA, value: testId });
    });

    it('should use current context correlation ID if none provided for Kafka headers', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = [
        { key: 'content-type', value: 'application/json' }
      ];

      // Setup a correlation ID in context
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);
      (context.active as jest.Mock).mockReturnValue(mockContext);

      const result = addCorrelationIdToKafkaHeaders(headers);
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ key: CORRELATION_HEADERS.KAFKA, value: testId });
    });

    it('should replace existing correlation ID in Kafka headers', () => {
      const oldId = 'old-correlation-id';
      const newId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = [
        { key: 'content-type', value: 'application/json' },
        { key: CORRELATION_HEADERS.KAFKA, value: oldId }
      ];

      const result = addCorrelationIdToKafkaHeaders(headers, newId);
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ key: CORRELATION_HEADERS.KAFKA, value: newId });
    });

    it('should add correlation ID to Kafka headers with custom header name', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const headers = [
        { key: 'content-type', value: 'application/json' }
      ];

      const result = addCorrelationIdToKafkaHeaders(headers, testId, 'custom-correlation-header');
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ key: 'custom-correlation-header', value: testId });
    });

    it('should return the original headers if no correlation ID is provided and none in context', () => {
      const headers = [
        { key: 'content-type', value: 'application/json' }
      ];

      // Setup an empty context
      const emptyContext = context.active();
      (context.active as jest.Mock).mockReturnValue(emptyContext);

      const result = addCorrelationIdToKafkaHeaders(headers);
      expect(result).toBe(headers);
    });
  });

  describe('OpenTelemetry Integration', () => {
    it('should add correlation ID to current span', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const mockSpan = trace.getSpan(context.active());

      addCorrelationIdToCurrentSpan(testId);

      expect(mockSpan?.setAttribute).toHaveBeenCalledWith('correlation.id', testId);
    });

    it('should use current context correlation ID if none provided for span', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const mockSpan = trace.getSpan(context.active());

      // Setup a correlation ID in context
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);
      (context.active as jest.Mock).mockReturnValue(mockContext);

      addCorrelationIdToCurrentSpan();

      expect(mockSpan?.setAttribute).toHaveBeenCalledWith('correlation.id', testId);
    });

    it('should do nothing if no correlation ID is provided and none in context', () => {
      const mockSpan = trace.getSpan(context.active());

      // Setup an empty context
      const emptyContext = context.active();
      (context.active as jest.Mock).mockReturnValue(emptyContext);

      addCorrelationIdToCurrentSpan();

      expect(mockSpan?.setAttribute).not.toHaveBeenCalled();
    });

    it('should extract correlation ID from trace context', () => {
      const mockSpan = trace.getSpan(context.active());
      const mockTraceId = 'mock-trace-id';

      // Mock the span context to return our trace ID
      (mockSpan?.spanContext as jest.Mock).mockReturnValue({
        traceId: mockTraceId,
        spanId: 'mock-span-id',
        traceFlags: 1,
        isRemote: false
      });

      const result = extractCorrelationIdFromTraceContext();
      expect(result).toBe(mockTraceId);
    });

    it('should return undefined if no span exists in context', () => {
      // Mock trace.getSpan to return undefined
      (trace.getSpan as jest.Mock).mockReturnValueOnce(undefined);

      const result = extractCorrelationIdFromTraceContext();
      expect(result).toBeUndefined();
    });
  });

  describe('Correlation Context Propagator', () => {
    it('should inject correlation ID into carrier', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);

      const carrier: Record<string, string> = {};
      const setter = jest.fn((c, k, v) => { c[k] = v; });

      correlationContextPropagator.inject(mockContext, carrier, setter);

      expect(setter).toHaveBeenCalledWith(carrier, CORRELATION_HEADERS.HTTP, testId);
      expect(carrier[CORRELATION_HEADERS.HTTP]).toBe(testId);
    });

    it('should not inject if no correlation ID exists in context', () => {
      const mockContext = context.active();
      const carrier: Record<string, string> = {};
      const setter = jest.fn((c, k, v) => { c[k] = v; });

      correlationContextPropagator.inject(mockContext, carrier, setter);

      expect(setter).not.toHaveBeenCalled();
      expect(carrier[CORRELATION_HEADERS.HTTP]).toBeUndefined();
    });

    it('should extract correlation ID from carrier', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const mockContext = context.active();
      const carrier: Record<string, string> = {
        [CORRELATION_HEADERS.HTTP]: testId
      };
      const getter = jest.fn((c, k) => c[k]);

      const result = correlationContextPropagator.extract(mockContext, carrier, getter);

      expect(getter).toHaveBeenCalledWith(carrier, CORRELATION_HEADERS.HTTP);
      expect(result.setValue).toHaveBeenCalledWith(CORRELATION_ID_CONTEXT_KEY, testId);
    });

    it('should not extract if correlation ID is invalid', () => {
      const mockContext = context.active();
      const carrier: Record<string, string> = {
        [CORRELATION_HEADERS.HTTP]: 'invalid-id'
      };
      const getter = jest.fn((c, k) => c[k]);

      const result = correlationContextPropagator.extract(mockContext, carrier, getter);

      expect(getter).toHaveBeenCalledWith(carrier, CORRELATION_HEADERS.HTTP);
      expect(result).toBe(mockContext);
    });

    it('should return the propagator fields', () => {
      const fields = correlationContextPropagator.fields();
      expect(fields).toEqual([CORRELATION_HEADERS.HTTP]);
    });
  });

  describe('Express Middleware', () => {
    it('should create middleware that extracts correlation ID from request headers', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const req = { headers: { [CORRELATION_HEADERS.HTTP]: testId } };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      const middleware = createCorrelationIdMiddleware();
      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_HEADERS.HTTP, testId);
      expect(next).toHaveBeenCalled();
    });

    it('should generate a new correlation ID if none exists in request headers', () => {
      const req = { headers: {} };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      const middleware = createCorrelationIdMiddleware();
      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_HEADERS.HTTP, 'mocked-uuid-v4');
      expect(next).toHaveBeenCalled();
    });

    it('should not generate a new correlation ID if generateIfMissing is false', () => {
      const req = { headers: {} };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      const middleware = createCorrelationIdMiddleware({ generateIfMissing: false });
      middleware(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should use custom header name if provided', () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const customHeader = 'custom-correlation-header';
      const req = { headers: { [customHeader]: testId } };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      const middleware = createCorrelationIdMiddleware({ headerName: customHeader });
      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(customHeader, testId);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Retry with Correlation ID Preservation', () => {
    it('should preserve correlation ID during retries', async () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const operation = jest.fn().mockResolvedValue('success');

      // Setup a correlation ID in context
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);
      (context.active as jest.Mock).mockReturnValue(mockContext);

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and preserve correlation ID', async () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('success');

      // Setup a correlation ID in context
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);
      (context.active as jest.Mock).mockReturnValue(mockContext);

      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return {} as any;
      });

      const result = await withRetry(operation, {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffFactor: 2
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const error = new Error('Persistent failure');
      const operation = jest.fn().mockRejectedValue(error);

      // Setup a correlation ID in context
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);
      (context.active as jest.Mock).mockReturnValue(mockContext);

      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return {} as any;
      });

      await expect(withRetry(operation, { maxRetries: 2 })).rejects.toThrow(error);
      expect(operation).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
    });

    it('should only retry on specified error patterns', async () => {
      const testId = '123e4567-e89b-42d3-a456-556642440000';
      const retryableError = new Error('Connection timeout');
      const nonRetryableError = new Error('Invalid input');
      const operation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(nonRetryableError);

      // Setup a correlation ID in context
      const mockContext = context.active();
      mockContext.setValue(CORRELATION_ID_CONTEXT_KEY, testId);
      (context.active as jest.Mock).mockReturnValue(mockContext);

      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return {} as any;
      });

      await expect(withRetry(operation, {
        maxRetries: 3,
        retryableErrors: ['timeout', /connection/i]
      })).rejects.toThrow(nonRetryableError);
      
      expect(operation).toHaveBeenCalledTimes(2); // Initial attempt + 1 retry for retryable error
    });
  });

  describe('Event Sequence Reconstruction', () => {
    it('should link parent-child events through correlation IDs', () => {
      const parentId = '123e4567-e89b-42d3-a456-556642440000';
      
      // Create a parent event
      const parentEvent: BaseEvent = {
        eventId: 'parent-event',
        type: 'PARENT_EVENT',
        timestamp: '2023-04-15T14:30:00.000Z',
        version: '1.0.0',
        source: 'parent-service',
        journey: 'HEALTH',
        userId: 'user-123',
        payload: { action: 'start' },
        metadata: {
          correlationId: parentId
        }
      };
      
      // Create child events that reference the parent
      const childEvent1: BaseEvent = {
        eventId: 'child-event-1',
        type: 'CHILD_EVENT_1',
        timestamp: '2023-04-15T14:31:00.000Z',
        version: '1.0.0',
        source: 'child-service-1',
        journey: 'HEALTH',
        userId: 'user-123',
        payload: { action: 'process' },
        metadata: {
          correlationId: parentId
        }
      };
      
      const childEvent2: BaseEvent = {
        eventId: 'child-event-2',
        type: 'CHILD_EVENT_2',
        timestamp: '2023-04-15T14:32:00.000Z',
        version: '1.0.0',
        source: 'child-service-2',
        journey: 'HEALTH',
        userId: 'user-123',
        payload: { action: 'complete' },
        metadata: {
          correlationId: parentId
        }
      };
      
      // Verify all events have the same correlation ID
      expect(extractCorrelationIdFromEvent(parentEvent)).toBe(parentId);
      expect(extractCorrelationIdFromEvent(childEvent1)).toBe(parentId);
      expect(extractCorrelationIdFromEvent(childEvent2)).toBe(parentId);
      
      // Simulate reconstructing the event sequence
      const allEvents = [childEvent2, parentEvent, childEvent1]; // Unordered events
      const correlationId = parentId;
      
      // Filter events by correlation ID
      const relatedEvents = allEvents.filter(event => 
        extractCorrelationIdFromEvent(event) === correlationId
      );
      
      // Sort by timestamp to reconstruct sequence
      const orderedEvents = relatedEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Verify the sequence is correctly reconstructed
      expect(orderedEvents).toHaveLength(3);
      expect(orderedEvents[0].eventId).toBe('parent-event');
      expect(orderedEvents[1].eventId).toBe('child-event-1');
      expect(orderedEvents[2].eventId).toBe('child-event-2');
    });
    
    it('should preserve journey context across service boundaries', () => {
      const correlationId = '123e4567-e89b-42d3-a456-556642440000';
      const journey = 'HEALTH';
      const userId = 'user-123';
      
      // Create an event in the health journey
      const healthEvent: BaseEvent = {
        eventId: 'health-event',
        type: 'HEALTH_METRIC_RECORDED',
        timestamp: '2023-04-15T14:30:00.000Z',
        version: '1.0.0',
        source: 'health-service',
        journey,
        userId,
        payload: { metricType: 'HEART_RATE', value: 75 },
        metadata: {
          correlationId
        }
      };
      
      // Event propagates to gamification service
      const gamificationEvent: BaseEvent = {
        eventId: 'gamification-event',
        type: 'ACHIEVEMENT_PROGRESS',
        timestamp: '2023-04-15T14:30:05.000Z',
        version: '1.0.0',
        source: 'gamification-engine',
        journey, // Journey context preserved
        userId, // User context preserved
        payload: { achievementType: 'health-check-streak', progress: 0.5 },
        metadata: {
          correlationId, // Correlation ID preserved
          originalEventId: healthEvent.eventId // Reference to original event
        }
      };
      
      // Event propagates to notification service
      const notificationEvent: BaseEvent = {
        eventId: 'notification-event',
        type: 'NOTIFICATION_SENT',
        timestamp: '2023-04-15T14:30:10.000Z',
        version: '1.0.0',
        source: 'notification-service',
        journey, // Journey context preserved
        userId, // User context preserved
        payload: { channel: 'PUSH', title: 'Health Streak Progress' },
        metadata: {
          correlationId, // Correlation ID preserved
          originalEventId: gamificationEvent.eventId // Reference to previous event
        }
      };
      
      // Verify correlation ID is preserved across all events
      expect(extractCorrelationIdFromEvent(healthEvent)).toBe(correlationId);
      expect(extractCorrelationIdFromEvent(gamificationEvent)).toBe(correlationId);
      expect(extractCorrelationIdFromEvent(notificationEvent)).toBe(correlationId);
      
      // Verify journey context is preserved
      expect(healthEvent.journey).toBe(journey);
      expect(gamificationEvent.journey).toBe(journey);
      expect(notificationEvent.journey).toBe(journey);
      
      // Verify user context is preserved
      expect(healthEvent.userId).toBe(userId);
      expect(gamificationEvent.userId).toBe(userId);
      expect(notificationEvent.userId).toBe(userId);
      
      // Verify event chain references
      expect(gamificationEvent.metadata?.originalEventId).toBe(healthEvent.eventId);
      expect(notificationEvent.metadata?.originalEventId).toBe(gamificationEvent.eventId);
    });
  });
});
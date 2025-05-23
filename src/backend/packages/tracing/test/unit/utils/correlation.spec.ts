/**
 * Unit tests for trace correlation utilities
 * 
 * These tests verify the correct extraction of trace and span IDs from current context
 * and proper enrichment of log objects with tracing information. These tests ensure that
 * distributed traces can be properly correlated with logs and metrics for comprehensive
 * observability.
 */

import { Context, SpanContext, SpanKind, trace } from '@opentelemetry/api';

import {
  extractCurrentTraceInfo,
  extractTraceInfoFromContext,
  enrichLogWithTraceInfo,
  enrichLogWithTraceInfoFromContext,
  createExternalCorrelationContext,
  createExternalCorrelationContextFromContext,
  createMetricCorrelationContext,
  createMetricCorrelationContextFromContext,
  extractW3CTraceContextHeaders,
  addJourneyAttributesToSpan,
  generateCorrelationId,
  hasTraceContext,
  formatTraceId,
  createTraceViewUrl,
  TraceLogContext,
  TraceMetricContext,
  ExternalCorrelationContext
} from '../../../src/utils/correlation';

import { MockSpan } from '../../mocks/mock-span';
import { MockContext } from '../../mocks/mock-context';

// Mock OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  const mockActiveSpan = new MockSpan('test-span', {
    spanContext: {
      traceId: '1234567890abcdef1234567890abcdef',
      spanId: 'abcdef1234567890',
      traceFlags: 1, // Sampled
      isRemote: false,
    }
  });

  return {
    trace: {
      getActiveSpan: jest.fn(() => mockActiveSpan),
      getSpanContext: jest.fn((context) => {
        // Use MockContext helper to get trace and span IDs
        const traceId = MockContext.getTraceId(context);
        const spanId = MockContext.getSpanId(context);
        
        if (traceId && spanId) {
          return {
            traceId,
            spanId,
            traceFlags: 1, // Sampled
            isRemote: false,
          };
        }
        return undefined;
      }),
    },
    SpanKind: {
      INTERNAL: 0,
      SERVER: 1,
      CLIENT: 2,
      PRODUCER: 3,
      CONSUMER: 4,
    },
  };
});

describe('Correlation Utilities', () => {
  let mockSpan: MockSpan;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    MockContext.reset();
    
    // Create a new mock span for each test
    mockSpan = new MockSpan('test-span', {
      spanContext: {
        traceId: '1234567890abcdef1234567890abcdef',
        spanId: 'abcdef1234567890',
        traceFlags: 1, // Sampled
        isRemote: false,
      }
    });
    
    // Update the mock implementation to return our new mock span
    (trace.getActiveSpan as jest.Mock).mockReturnValue(mockSpan);
  });

  describe('Trace Info Extraction', () => {
    test('should extract trace info from current context', () => {
      // Act
      const traceInfo = extractCurrentTraceInfo();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(traceInfo).toBeDefined();
      expect(traceInfo?.['trace.id']).toBe('1234567890abcdef1234567890abcdef');
      expect(traceInfo?.['span.id']).toBe('abcdef1234567890');
      expect(traceInfo?.['trace.sampled']).toBe(true);
      expect(traceInfo?.['trace.flags']).toBe(1);
    });

    test('should return undefined when no active span exists', () => {
      // Arrange
      (trace.getActiveSpan as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const traceInfo = extractCurrentTraceInfo();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(traceInfo).toBeUndefined();
    });

    test('should return undefined when active span has no context', () => {
      // Arrange
      const spanWithoutContext = new MockSpan('test-span');
      // Force spanContext to return undefined
      jest.spyOn(spanWithoutContext, 'spanContext').mockReturnValueOnce(undefined as unknown as SpanContext);
      (trace.getActiveSpan as jest.Mock).mockReturnValueOnce(spanWithoutContext);

      // Act
      const traceInfo = extractCurrentTraceInfo();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(traceInfo).toBeUndefined();
    });

    test('should extract trace info from provided context', () => {
      // Arrange
      const ctx = MockContext.createTestContext();

      // Act
      const traceInfo = extractTraceInfoFromContext(ctx);

      // Assert
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
      expect(traceInfo).toBeDefined();
      expect(traceInfo?.['trace.id']).toBe('1234567890abcdef1234567890abcdef');
      expect(traceInfo?.['span.id']).toBe('abcdef1234567890');
      expect(traceInfo?.['trace.sampled']).toBe(true);
      expect(traceInfo?.['trace.flags']).toBe(1);
    });

    test('should return undefined when provided context has no span context', () => {
      // Arrange
      const ctx = MockContext.createRoot();
      (trace.getSpanContext as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const traceInfo = extractTraceInfoFromContext(ctx);

      // Assert
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
      expect(traceInfo).toBeUndefined();
    });
  });

  describe('Log Enrichment', () => {
    test('should enrich log object with trace info from current context', () => {
      // Arrange
      const logObject = { message: 'Test log message', level: 'info' };

      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(enrichedLog).toEqual({
        ...logObject,
        'trace.id': '1234567890abcdef1234567890abcdef',
        'span.id': 'abcdef1234567890',
        'trace.sampled': true,
        'trace.flags': 1,
      });
    });

    test('should return original log object when no active span exists', () => {
      // Arrange
      const logObject = { message: 'Test log message', level: 'info' };
      (trace.getActiveSpan as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(enrichedLog).toEqual(logObject);
    });

    test('should enrich log object with trace info from provided context', () => {
      // Arrange
      const logObject = { message: 'Test log message', level: 'info' };
      const ctx = MockContext.createTestContext();

      // Act
      const enrichedLog = enrichLogWithTraceInfoFromContext(logObject, ctx);

      // Assert
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
      expect(enrichedLog).toEqual({
        ...logObject,
        'trace.id': '1234567890abcdef1234567890abcdef',
        'span.id': 'abcdef1234567890',
        'trace.sampled': true,
        'trace.flags': 1,
      });
    });

    test('should return original log object when provided context has no span context', () => {
      // Arrange
      const logObject = { message: 'Test log message', level: 'info' };
      const ctx = MockContext.createRoot();
      (trace.getSpanContext as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const enrichedLog = enrichLogWithTraceInfoFromContext(logObject, ctx);

      // Assert
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
      expect(enrichedLog).toEqual(logObject);
    });

    test('should preserve existing log object properties when enriching', () => {
      // Arrange
      const logObject = {
        message: 'Test log message',
        level: 'info',
        userId: 'user-123',
        requestId: 'req-456',
        timestamp: new Date().toISOString(),
      };

      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);

      // Assert
      expect(enrichedLog.message).toBe(logObject.message);
      expect(enrichedLog.level).toBe(logObject.level);
      expect(enrichedLog.userId).toBe(logObject.userId);
      expect(enrichedLog.requestId).toBe(logObject.requestId);
      expect(enrichedLog.timestamp).toBe(logObject.timestamp);
      expect(enrichedLog['trace.id']).toBe('1234567890abcdef1234567890abcdef');
      expect(enrichedLog['span.id']).toBe('abcdef1234567890');
    });
  });

  describe('External Correlation Context', () => {
    test('should create external correlation context from current context', () => {
      // Act
      const correlationContext = createExternalCorrelationContext();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(correlationContext).toBeDefined();
      expect(correlationContext?.traceId).toBe('1234567890abcdef1234567890abcdef');
      expect(correlationContext?.spanId).toBe('abcdef1234567890');
      expect(correlationContext?.traceFlags).toBe(1);
      expect(correlationContext?.isRemote).toBe(false);
    });

    test('should return undefined when no active span exists', () => {
      // Arrange
      (trace.getActiveSpan as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const correlationContext = createExternalCorrelationContext();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(correlationContext).toBeUndefined();
    });

    test('should create external correlation context from provided context', () => {
      // Arrange
      const ctx = MockContext.createTestContext();

      // Act
      const correlationContext = createExternalCorrelationContextFromContext(ctx);

      // Assert
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
      expect(correlationContext).toBeDefined();
      expect(correlationContext?.traceId).toBe('1234567890abcdef1234567890abcdef');
      expect(correlationContext?.spanId).toBe('abcdef1234567890');
      expect(correlationContext?.traceFlags).toBe(1);
      expect(correlationContext?.isRemote).toBe(false);
    });

    test('should return undefined when provided context has no span context', () => {
      // Arrange
      const ctx = MockContext.createRoot();
      (trace.getSpanContext as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const correlationContext = createExternalCorrelationContextFromContext(ctx);

      // Assert
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
      expect(correlationContext).toBeUndefined();
    });
  });

  describe('Metric Correlation Context', () => {
    test('should create metric correlation context from current context', () => {
      // Act
      const metricContext = createMetricCorrelationContext();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(metricContext).toBeDefined();
      expect(metricContext?.['trace.id']).toBe('1234567890abcdef1234567890abcdef');
      expect(metricContext?.['span.id']).toBe('abcdef1234567890');
      expect(metricContext?.['trace.sampled']).toBe(true);
    });

    test('should return undefined when no active span exists', () => {
      // Arrange
      (trace.getActiveSpan as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const metricContext = createMetricCorrelationContext();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(metricContext).toBeUndefined();
    });

    test('should create metric correlation context from provided context', () => {
      // Arrange
      const ctx = MockContext.createTestContext();

      // Act
      const metricContext = createMetricCorrelationContextFromContext(ctx);

      // Assert
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
      expect(metricContext).toBeDefined();
      expect(metricContext?.['trace.id']).toBe('1234567890abcdef1234567890abcdef');
      expect(metricContext?.['span.id']).toBe('abcdef1234567890');
      expect(metricContext?.['trace.sampled']).toBe(true);
    });

    test('should return undefined when provided context has no span context', () => {
      // Arrange
      const ctx = MockContext.createRoot();
      (trace.getSpanContext as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const metricContext = createMetricCorrelationContextFromContext(ctx);

      // Assert
      expect(trace.getSpanContext).toHaveBeenCalledWith(ctx);
      expect(metricContext).toBeUndefined();
    });
  });

  describe('W3C Trace Context Headers', () => {
    test('should extract W3C trace context headers from current context', () => {
      // Act
      const headers = extractW3CTraceContextHeaders();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(headers).toBeDefined();
      expect(headers?.traceparent).toBe('00-1234567890abcdef1234567890abcdef-abcdef1234567890-01');
    });

    test('should return undefined when no active span exists', () => {
      // Arrange
      (trace.getActiveSpan as jest.Mock).mockReturnValueOnce(undefined);

      // Act
      const headers = extractW3CTraceContextHeaders();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(headers).toBeUndefined();
    });

    test('should include tracestate header when available', () => {
      // Arrange
      const spanWithTraceState = new MockSpan('test-span', {
        spanContext: {
          traceId: '1234567890abcdef1234567890abcdef',
          spanId: 'abcdef1234567890',
          traceFlags: 1,
          isRemote: false,
          traceState: {
            serialize: () => 'vendor1=value1,vendor2=value2'
          }
        }
      });
      (trace.getActiveSpan as jest.Mock).mockReturnValueOnce(spanWithTraceState);

      // Act
      const headers = extractW3CTraceContextHeaders();

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(headers).toBeDefined();
      expect(headers?.traceparent).toBe('00-1234567890abcdef1234567890abcdef-abcdef1234567890-01');
      expect(headers?.tracestate).toBe('vendor1=value1,vendor2=value2');
    });
  });

  describe('Journey Attributes', () => {
    test('should add journey attributes to current span', () => {
      // Arrange
      const journeyType = 'health';
      const journeyId = 'journey-123';
      const attributes = {
        step: 'health-metrics',
        action: 'view',
        userId: 'user-456'
      };

      // Act
      addJourneyAttributesToSpan(journeyType as any, journeyId, attributes);

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      expect(mockSpan.hasAttribute('journey.type', journeyType)).toBe(true);
      expect(mockSpan.hasAttribute('journey.id', journeyId)).toBe(true);
      expect(mockSpan.hasAttribute('journey.step', attributes.step)).toBe(true);
      expect(mockSpan.hasAttribute('journey.action', attributes.action)).toBe(true);
      expect(mockSpan.hasAttribute('journey.userId', attributes.userId)).toBe(true);
    });

    test('should not add attributes when no active span exists', () => {
      // Arrange
      (trace.getActiveSpan as jest.Mock).mockReturnValueOnce(undefined);
      const journeyType = 'care';
      const journeyId = 'journey-789';

      // Act - This should not throw an error
      addJourneyAttributesToSpan(journeyType as any, journeyId);

      // Assert
      expect(trace.getActiveSpan).toHaveBeenCalled();
      // No assertions on mockSpan since it wasn't called
    });

    test('should support all journey types', () => {
      // Test all journey types
      const journeyTypes = ['health', 'care', 'plan'];

      for (const journeyType of journeyTypes) {
        // Arrange
        const journeyId = `journey-${journeyType}-123`;
        jest.clearAllMocks();
        mockSpan.reset();

        // Act
        addJourneyAttributesToSpan(journeyType as any, journeyId);

        // Assert
        expect(trace.getActiveSpan).toHaveBeenCalled();
        expect(mockSpan.hasAttribute('journey.type', journeyType)).toBe(true);
        expect(mockSpan.hasAttribute('journey.id', journeyId)).toBe(true);
      }
    });
  });

  describe('Utility Functions', () => {
    test('should generate a correlation ID', () => {
      // Act
      const correlationId = generateCorrelationId();

      // Assert
      expect(correlationId).toBeDefined();
      expect(correlationId.startsWith('corr-')).toBe(true);
      expect(correlationId.length).toBeGreaterThan(10);
    });

    test('should detect if a log object has trace context', () => {
      // Arrange
      const logWithContext = {
        message: 'Test log',
        'trace.id': '1234567890abcdef1234567890abcdef',
        'span.id': 'abcdef1234567890',
        'trace.sampled': true
      };

      const logWithoutContext = {
        message: 'Test log'
      };

      const logWithPartialContext = {
        message: 'Test log',
        'trace.id': '1234567890abcdef1234567890abcdef',
        // Missing span.id
        'trace.sampled': true
      };

      // Act & Assert
      expect(hasTraceContext(logWithContext)).toBe(true);
      expect(hasTraceContext(logWithoutContext)).toBe(false);
      expect(hasTraceContext(logWithPartialContext)).toBe(false);
    });

    test('should format trace ID for display', () => {
      // Arrange
      const traceId = '1234567890abcdef1234567890abcdef';

      // Act
      const formatted = formatTraceId(traceId);

      // Assert
      expect(formatted).toBe('12345678-90ab-cdef-1234-567890abcdef');
    });

    test('should not format invalid trace IDs', () => {
      // Arrange
      const invalidTraceId = '12345';

      // Act
      const formatted = formatTraceId(invalidTraceId);

      // Assert
      expect(formatted).toBe(invalidTraceId);
    });

    test('should create trace view URLs for different backends', () => {
      // Arrange
      const traceId = '1234567890abcdef1234567890abcdef';

      // Act & Assert
      expect(createTraceViewUrl(traceId, 'datadog')).toBe(`https://app.datadoghq.com/apm/trace/${traceId}`);
      expect(createTraceViewUrl(traceId, 'jaeger')).toBe(`http://localhost:16686/trace/${traceId}`);
      expect(createTraceViewUrl(traceId, 'zipkin')).toBe(`http://localhost:9411/zipkin/traces/${traceId}`);
      expect(createTraceViewUrl(traceId, 'unknown' as any)).toBe(`trace:${traceId}`);
      
      // Test default (should be datadog)
      expect(createTraceViewUrl(traceId)).toBe(`https://app.datadoghq.com/apm/trace/${traceId}`);
    });
  });
});
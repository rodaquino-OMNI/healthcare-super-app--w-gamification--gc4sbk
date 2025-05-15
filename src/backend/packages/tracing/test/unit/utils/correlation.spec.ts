/**
 * @file correlation.spec.ts
 * @description Unit tests for trace correlation utilities
 */

import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import {
  extractTraceInfo,
  createExternalCorrelationObject,
  enrichLogWithTraceInfo,
  enrichMetricWithTraceInfo,
  createJourneyCorrelationInfo,
  recordErrorWithTraceInfo,
  formatTraceInfoForDisplay,
  TraceCorrelationInfo,
} from '../../../src/utils/correlation';
import { MockTracer } from '../../mocks/mock-tracer';
import { MockSpan } from '../../mocks/mock-span';
import { MockContext, MockContextManager, ROOT_CONTEXT, createMockContextKey } from '../../mocks/mock-context';

// Mock OpenTelemetry API
const mockTracer = new MockTracer('test-tracer');
const mockContextManager = new MockContextManager();

// Create a mock span key for context
const SPAN_KEY = createMockContextKey<MockSpan>('current-span');

// Mock the OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  const original = jest.requireActual('@opentelemetry/api');
  return {
    ...original,
    trace: {
      ...original.trace,
      getSpan: jest.fn((ctx) => {
        if (ctx instanceof MockContext) {
          return ctx.getValue(SPAN_KEY);
        }
        return undefined;
      }),
      getTracer: jest.fn(() => mockTracer),
      setSpan: jest.fn((ctx, span) => {
        if (ctx instanceof MockContext) {
          return ctx.setValue(SPAN_KEY, span);
        }
        return ctx;
      }),
    },
    context: {
      ...original.context,
      active: jest.fn(() => mockContextManager.active()),
    },
    propagation: {
      ...original.propagation,
      inject: jest.fn((ctx, carrier) => {
        const span = trace.getSpan(ctx);
        if (span) {
          const spanContext = span.spanContext();
          carrier['traceparent'] = `00-${spanContext.traceId}-${spanContext.spanId}-01`;
        }
      }),
    },
  };
});

describe('Correlation Utilities', () => {
  // Create a test span for each test
  let testSpan: MockSpan;
  let activeContext: MockContext;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockTracer.reset();

    // Create a test span with known trace and span IDs
    const spanContext = {
      traceId: '1234567890abcdef1234567890abcdef',
      spanId: 'abcdef1234567890',
      traceFlags: 1, // Sampled
      isRemote: false,
    };
    testSpan = new MockSpan('test-span', spanContext, SpanStatusCode.UNSET);

    // Set up the active context with the test span
    activeContext = ROOT_CONTEXT.setValue(SPAN_KEY, testSpan);
    jest.spyOn(mockContextManager, 'active').mockReturnValue(activeContext);
  });

  describe('extractTraceInfo', () => {
    it('should extract trace and span IDs from the current context', () => {
      // Act
      const traceInfo = extractTraceInfo();

      // Assert
      expect(traceInfo).toBeDefined();
      expect(traceInfo?.traceId).toBe('1234567890abcdef1234567890abcdef');
      expect(traceInfo?.spanId).toBe('abcdef1234567890');
      expect(traceInfo?.traceFlags).toBe(1);
      expect(traceInfo?.isSampled).toBe(true);
      expect(context.active).toHaveBeenCalled();
      expect(trace.getSpan).toHaveBeenCalledWith(activeContext);
    });

    it('should return undefined when no active span exists', () => {
      // Arrange
      jest.spyOn(mockContextManager, 'active').mockReturnValue(ROOT_CONTEXT);

      // Act
      const traceInfo = extractTraceInfo();

      // Assert
      expect(traceInfo).toBeUndefined();
      expect(context.active).toHaveBeenCalled();
      expect(trace.getSpan).toHaveBeenCalledWith(ROOT_CONTEXT);
    });
  });

  describe('createExternalCorrelationObject', () => {
    it('should create a correlation object with trace context headers', () => {
      // Act
      const correlationObject = createExternalCorrelationObject();

      // Assert
      expect(correlationObject).toBeDefined();
      expect(correlationObject['traceparent']).toBe(
        `00-${testSpan.spanContext().traceId}-${testSpan.spanContext().spanId}-01`
      );
    });

    it('should include additional context in the correlation object', () => {
      // Arrange
      const additionalContext = {
        userId: '12345',
        journeyType: 'health',
      };

      // Act
      const correlationObject = createExternalCorrelationObject(additionalContext);

      // Assert
      expect(correlationObject).toBeDefined();
      expect(correlationObject['traceparent']).toBe(
        `00-${testSpan.spanContext().traceId}-${testSpan.spanContext().spanId}-01`
      );
      expect(correlationObject['x-austa-userId']).toBe('12345');
      expect(correlationObject['x-austa-journeyType']).toBe('health');
    });

    it('should stringify non-string values in additional context', () => {
      // Arrange
      const additionalContext = {
        metadata: { key: 'value' },
        count: 42,
      };

      // Act
      const correlationObject = createExternalCorrelationObject(additionalContext);

      // Assert
      expect(correlationObject).toBeDefined();
      expect(correlationObject['x-austa-metadata']).toBe(JSON.stringify({ key: 'value' }));
      expect(correlationObject['x-austa-count']).toBe(JSON.stringify(42));
    });
  });

  describe('enrichLogWithTraceInfo', () => {
    it('should enrich a log object with trace information', () => {
      // Arrange
      const logObject = {
        message: 'Test log message',
        level: 'info',
        context: 'TestService',
      };

      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);

      // Assert
      expect(enrichedLog).toBeDefined();
      expect(enrichedLog.message).toBe('Test log message');
      expect(enrichedLog.level).toBe('info');
      expect(enrichedLog.context).toBe('TestService');
      expect(enrichedLog.traceId).toBe('1234567890abcdef1234567890abcdef');
      expect(enrichedLog.spanId).toBe('abcdef1234567890');
      expect(enrichedLog.traceFlags).toBe(1);
      expect(enrichedLog.isSampled).toBe(true);
    });

    it('should handle log objects without a message property', () => {
      // Arrange
      const logObject = {
        level: 'error',
        error: new Error('Test error'),
      };

      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);

      // Assert
      expect(enrichedLog).toBeDefined();
      expect(enrichedLog.message).toBe('');
      expect(enrichedLog.level).toBe('error');
      expect(enrichedLog.error).toBeInstanceOf(Error);
      expect(enrichedLog.traceId).toBe('1234567890abcdef1234567890abcdef');
      expect(enrichedLog.spanId).toBe('abcdef1234567890');
    });

    it('should handle log objects when no active span exists', () => {
      // Arrange
      jest.spyOn(mockContextManager, 'active').mockReturnValue(ROOT_CONTEXT);
      const logObject = {
        message: 'Test log message',
        level: 'info',
      };

      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);

      // Assert
      expect(enrichedLog).toBeDefined();
      expect(enrichedLog.message).toBe('Test log message');
      expect(enrichedLog.level).toBe('info');
      expect(enrichedLog.traceId).toBeUndefined();
      expect(enrichedLog.spanId).toBeUndefined();
    });
  });

  describe('enrichMetricWithTraceInfo', () => {
    it('should enrich a metric with trace information', () => {
      // Act
      const enrichedMetric = enrichMetricWithTraceInfo('test_metric', 42, { unit: 'ms' });

      // Assert
      expect(enrichedMetric).toBeDefined();
      expect(enrichedMetric.metricName).toBe('test_metric');
      expect(enrichedMetric.value).toBe(42);
      expect(enrichedMetric.unit).toBe('ms');
      expect(enrichedMetric.traceId).toBe('1234567890abcdef1234567890abcdef');
      expect(enrichedMetric.spanId).toBe('abcdef1234567890');
      expect(enrichedMetric.traceFlags).toBe(1);
      expect(enrichedMetric.isSampled).toBe(true);
    });

    it('should handle metrics when no active span exists', () => {
      // Arrange
      jest.spyOn(mockContextManager, 'active').mockReturnValue(ROOT_CONTEXT);

      // Act
      const enrichedMetric = enrichMetricWithTraceInfo('test_metric', 42);

      // Assert
      expect(enrichedMetric).toBeDefined();
      expect(enrichedMetric.metricName).toBe('test_metric');
      expect(enrichedMetric.value).toBe(42);
      expect(enrichedMetric.traceId).toBeUndefined();
      expect(enrichedMetric.spanId).toBeUndefined();
    });
  });

  describe('createJourneyCorrelationInfo', () => {
    it('should create a correlation context for journey-specific tracing', () => {
      // Arrange
      const journeyType = 'health';
      const journeyContext = {
        userId: '12345',
        action: 'view_metrics',
      };

      // Act
      const correlationInfo = createJourneyCorrelationInfo(journeyType, journeyContext);

      // Assert
      expect(correlationInfo).toBeDefined();
      expect(correlationInfo.traceId).toBe('1234567890abcdef1234567890abcdef');
      expect(correlationInfo.spanId).toBe('abcdef1234567890');
      expect(correlationInfo.journeyContext).toBeDefined();
      expect(correlationInfo.journeyContext?.journeyType).toBe('health');
      expect(correlationInfo.journeyContext?.userId).toBe('12345');
      expect(correlationInfo.journeyContext?.action).toBe('view_metrics');
    });

    it('should create a correlation context with empty trace info when no active span exists', () => {
      // Arrange
      jest.spyOn(mockContextManager, 'active').mockReturnValue(ROOT_CONTEXT);
      const journeyType = 'care';
      const journeyContext = {
        appointmentId: 'appt-123',
      };

      // Act
      const correlationInfo = createJourneyCorrelationInfo(journeyType, journeyContext);

      // Assert
      expect(correlationInfo).toBeDefined();
      expect(correlationInfo.traceId).toBe('');
      expect(correlationInfo.spanId).toBe('');
      expect(correlationInfo.journeyContext).toBeDefined();
      expect(correlationInfo.journeyContext?.journeyType).toBe('care');
      expect(correlationInfo.journeyContext?.appointmentId).toBe('appt-123');
    });
  });

  describe('recordErrorWithTraceInfo', () => {
    it('should record an error in the current span and return trace info', () => {
      // Arrange
      const error = new Error('Test error');
      const errorContext = {
        component: 'TestService',
        operation: 'getData',
      };

      // Act
      const traceInfo = recordErrorWithTraceInfo(error, errorContext);

      // Assert
      expect(traceInfo).toBeDefined();
      expect(traceInfo.traceId).toBe('1234567890abcdef1234567890abcdef');
      expect(traceInfo.spanId).toBe('abcdef1234567890');
      expect(traceInfo.error).toBeDefined();
      expect(traceInfo.error.message).toBe('Test error');
      expect(traceInfo.error.name).toBe('Error');
      expect(traceInfo.error.component).toBe('TestService');
      expect(traceInfo.error.operation).toBe('getData');

      // Verify the error was recorded in the span
      expect(testSpan.operations.some(op => op.name === 'recordException')).toBe(true);
      expect(testSpan.operations.some(op => op.name === 'setStatus')).toBe(true);
    });

    it('should return trace info with error details when no active span exists', () => {
      // Arrange
      jest.spyOn(mockContextManager, 'active').mockReturnValue(ROOT_CONTEXT);
      const error = new Error('Test error');

      // Act
      const traceInfo = recordErrorWithTraceInfo(error);

      // Assert
      expect(traceInfo).toBeDefined();
      expect(traceInfo.traceId).toBe('');
      expect(traceInfo.spanId).toBe('');
      expect(traceInfo.error).toBeDefined();
      expect(traceInfo.error.message).toBe('Test error');
      expect(traceInfo.error.name).toBe('Error');
    });
  });

  describe('formatTraceInfoForDisplay', () => {
    it('should format trace information for display', () => {
      // Arrange
      const traceInfo: TraceCorrelationInfo = {
        traceId: '1234567890abcdef1234567890abcdef',
        spanId: 'abcdef1234567890',
        traceFlags: 1,
        isSampled: true,
      };

      // Act
      const formattedInfo = formatTraceInfoForDisplay(traceInfo);

      // Assert
      expect(formattedInfo).toBe('Trace ID: 1234567890abcdef1234567890abcdef | Span ID: abcdef1234567890 | Sampled');
    });

    it('should format trace information without sampled flag when not sampled', () => {
      // Arrange
      const traceInfo: TraceCorrelationInfo = {
        traceId: '1234567890abcdef1234567890abcdef',
        spanId: 'abcdef1234567890',
        traceFlags: 0,
        isSampled: false,
      };

      // Act
      const formattedInfo = formatTraceInfoForDisplay(traceInfo);

      // Assert
      expect(formattedInfo).toBe('Trace ID: 1234567890abcdef1234567890abcdef | Span ID: abcdef1234567890');
    });

    it('should return a message when no trace information is available', () => {
      // Act
      const formattedInfo = formatTraceInfoForDisplay(undefined);

      // Assert
      expect(formattedInfo).toBe('No trace information available');
    });

    it('should return a message when trace ID is empty', () => {
      // Arrange
      const traceInfo: TraceCorrelationInfo = {
        traceId: '',
        spanId: 'abcdef1234567890',
      };

      // Act
      const formattedInfo = formatTraceInfoForDisplay(traceInfo);

      // Assert
      expect(formattedInfo).toBe('No trace information available');
    });
  });
});
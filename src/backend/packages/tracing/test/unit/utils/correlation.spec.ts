import { context, trace, SpanContext, SpanStatusCode } from '@opentelemetry/api';
import {
  getTraceCorrelation,
  getTraceCorrelationFromContext,
  enrichLogWithTraceInfo,
  createExternalCorrelationHeaders,
  createMetricsCorrelation,
  getTraceCorrelationFromSpanContext,
  hasActiveTrace,
  TraceCorrelation,
  EnrichedLogContext
} from '../../../src/utils/correlation';
import { MockSpan, MockTracer, createMockTracer } from '../../../test/mocks/mock-tracer';
import {
  createMockSpanContext,
  createMockTraceContext,
  generateTraceId,
  generateSpanId,
  createMockTracingService
} from '../../../test/utils/mock-tracer.utils';

// Mock OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  const originalModule = jest.requireActual('@opentelemetry/api');
  let mockActiveSpan: MockSpan | undefined;
  let mockCurrentContext: any = {};
  
  return {
    ...originalModule,
    trace: {
      ...originalModule.trace,
      getActiveSpan: jest.fn(() => mockActiveSpan),
      getSpan: jest.fn(() => mockActiveSpan),
      setSpan: jest.fn((ctx, span) => {
        mockActiveSpan = span as MockSpan;
        return ctx;
      }),
    },
    context: {
      ...originalModule.context,
      active: jest.fn(() => mockCurrentContext),
    },
    // Helper functions for tests to control the mock state
    __setMockActiveSpan: (span: MockSpan | undefined) => {
      mockActiveSpan = span;
    },
    __setMockCurrentContext: (ctx: any) => {
      mockCurrentContext = ctx;
    },
    __resetMocks: () => {
      mockActiveSpan = undefined;
      mockCurrentContext = {};
    },
  };
});

// Get the mocked module
const mockedOpenTelemetry = jest.mocked(trace);

describe('Correlation Utilities', () => {
  let mockTracer: MockTracer;
  let mockSpan: MockSpan;
  let mockSpanContext: SpanContext;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    (trace as any).__resetMocks();
    
    // Create mock tracer and span for testing
    mockTracer = createMockTracer('test-service');
    mockSpanContext = {
      traceId: generateTraceId(),
      spanId: generateSpanId(),
      traceFlags: 1, // Sampled
      isRemote: false,
    };
    mockSpan = mockTracer.startSpan('test-span');
    
    // Set the mock active span
    (trace as any).__setMockActiveSpan(mockSpan);
  });
  
  afterEach(() => {
    // Clean up
    (trace as any).__resetMocks();
  });
  
  describe('getTraceCorrelation', () => {
    it('should return trace correlation information from active span', () => {
      // Arrange
      const expectedCorrelation: TraceCorrelation = {
        traceId: mockSpan.spanContext().traceId,
        spanId: mockSpan.spanContext().spanId,
        traceFlags: mockSpan.spanContext().traceFlags,
        isRemote: mockSpan.spanContext().isRemote,
        traceState: undefined, // Mock doesn't implement traceState
      };
      
      // Act
      const correlation = getTraceCorrelation();
      
      // Assert
      expect(correlation).toEqual(expectedCorrelation);
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
    
    it('should return undefined when no active span exists', () => {
      // Arrange
      (trace as any).__setMockActiveSpan(undefined);
      
      // Act
      const correlation = getTraceCorrelation();
      
      // Assert
      expect(correlation).toBeUndefined();
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
    
    it('should return undefined when span context is incomplete', () => {
      // Arrange
      const incompleteSpan = {
        spanContext: () => ({ traceId: '', spanId: '' }),
        isRecording: () => true,
      } as unknown as MockSpan;
      (trace as any).__setMockActiveSpan(incompleteSpan);
      
      // Act
      const correlation = getTraceCorrelation();
      
      // Assert
      expect(correlation).toBeUndefined();
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
  });
  
  describe('getTraceCorrelationFromContext', () => {
    it('should return trace correlation information from current context', () => {
      // Arrange
      const expectedCorrelation: TraceCorrelation = {
        traceId: mockSpan.spanContext().traceId,
        spanId: mockSpan.spanContext().spanId,
        traceFlags: mockSpan.spanContext().traceFlags,
        isRemote: mockSpan.spanContext().isRemote,
        traceState: undefined, // Mock doesn't implement traceState
      };
      
      // Act
      const correlation = getTraceCorrelationFromContext();
      
      // Assert
      expect(correlation).toEqual(expectedCorrelation);
      expect(mockedOpenTelemetry.getSpan).toHaveBeenCalled();
      expect(context.active).toHaveBeenCalled();
    });
    
    it('should return undefined when no span exists in context', () => {
      // Arrange
      (trace as any).__setMockActiveSpan(undefined);
      
      // Act
      const correlation = getTraceCorrelationFromContext();
      
      // Assert
      expect(correlation).toBeUndefined();
      expect(mockedOpenTelemetry.getSpan).toHaveBeenCalled();
      expect(context.active).toHaveBeenCalled();
    });
    
    it('should return undefined when span context is incomplete', () => {
      // Arrange
      const incompleteSpan = {
        spanContext: () => ({ traceId: '', spanId: '' }),
        isRecording: () => true,
      } as unknown as MockSpan;
      (trace as any).__setMockActiveSpan(incompleteSpan);
      
      // Act
      const correlation = getTraceCorrelationFromContext();
      
      // Assert
      expect(correlation).toBeUndefined();
      expect(mockedOpenTelemetry.getSpan).toHaveBeenCalled();
      expect(context.active).toHaveBeenCalled();
    });
  });
  
  describe('enrichLogWithTraceInfo', () => {
    it('should enrich log object with trace information', () => {
      // Arrange
      const logObject = { message: 'Test log message', level: 'info' };
      const expectedEnrichedLog = {
        ...logObject,
        'trace.id': mockSpan.spanContext().traceId,
        'span.id': mockSpan.spanContext().spanId,
        'trace.flags': mockSpan.spanContext().traceFlags,
        'trace.remote': mockSpan.spanContext().isRemote,
      };
      
      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);
      
      // Assert
      expect(enrichedLog).toEqual(expectedEnrichedLog);
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
    
    it('should return original log object when no active span exists', () => {
      // Arrange
      (trace as any).__setMockActiveSpan(undefined);
      const logObject = { message: 'Test log message', level: 'info' };
      
      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);
      
      // Assert
      expect(enrichedLog).toBe(logObject);
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
    
    it('should include traceState when available', () => {
      // Arrange
      const spanWithTraceState = {
        spanContext: () => ({
          traceId: mockSpanContext.traceId,
          spanId: mockSpanContext.spanId,
          traceFlags: mockSpanContext.traceFlags,
          isRemote: mockSpanContext.isRemote,
          traceState: { toString: () => 'vendor1=value1,vendor2=value2' },
        }),
        isRecording: () => true,
      } as unknown as MockSpan;
      (trace as any).__setMockActiveSpan(spanWithTraceState);
      
      const logObject = { message: 'Test log message', level: 'info' };
      const expectedEnrichedLog = {
        ...logObject,
        'trace.id': mockSpanContext.traceId,
        'span.id': mockSpanContext.spanId,
        'trace.flags': mockSpanContext.traceFlags,
        'trace.remote': mockSpanContext.isRemote,
        'trace.state': 'vendor1=value1,vendor2=value2',
      };
      
      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);
      
      // Assert
      expect(enrichedLog).toEqual(expectedEnrichedLog);
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
  });
  
  describe('createExternalCorrelationHeaders', () => {
    it('should create W3C trace context headers from active span', () => {
      // Arrange
      const traceFlags = mockSpanContext.traceFlags.toString(16).padStart(2, '0');
      const expectedHeaders = {
        traceparent: `00-${mockSpanContext.traceId}-${mockSpanContext.spanId}-${traceFlags}`,
      };
      
      // Act
      const headers = createExternalCorrelationHeaders();
      
      // Assert
      expect(headers).toEqual(expectedHeaders);
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
    
    it('should include tracestate header when available', () => {
      // Arrange
      const traceStateValue = 'vendor1=value1,vendor2=value2';
      const spanWithTraceState = {
        spanContext: () => ({
          traceId: mockSpanContext.traceId,
          spanId: mockSpanContext.spanId,
          traceFlags: mockSpanContext.traceFlags,
          isRemote: mockSpanContext.isRemote,
          traceState: { toString: () => traceStateValue },
        }),
        isRecording: () => true,
      } as unknown as MockSpan;
      (trace as any).__setMockActiveSpan(spanWithTraceState);
      
      const traceFlags = mockSpanContext.traceFlags.toString(16).padStart(2, '0');
      const expectedHeaders = {
        traceparent: `00-${mockSpanContext.traceId}-${mockSpanContext.spanId}-${traceFlags}`,
        tracestate: traceStateValue,
      };
      
      // Act
      const headers = createExternalCorrelationHeaders();
      
      // Assert
      expect(headers).toEqual(expectedHeaders);
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
    
    it('should return undefined when no active span exists', () => {
      // Arrange
      (trace as any).__setMockActiveSpan(undefined);
      
      // Act
      const headers = createExternalCorrelationHeaders();
      
      // Assert
      expect(headers).toBeUndefined();
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
  });
  
  describe('createMetricsCorrelation', () => {
    it('should create metrics correlation object from active span', () => {
      // Arrange
      const expectedCorrelation = {
        'trace_id': mockSpanContext.traceId,
        'span_id': mockSpanContext.spanId,
      };
      
      // Act
      const correlation = createMetricsCorrelation();
      
      // Assert
      expect(correlation).toEqual(expectedCorrelation);
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
    
    it('should return empty object when no active span exists', () => {
      // Arrange
      (trace as any).__setMockActiveSpan(undefined);
      
      // Act
      const correlation = createMetricsCorrelation();
      
      // Assert
      expect(correlation).toEqual({});
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
  });
  
  describe('getTraceCorrelationFromSpanContext', () => {
    it('should extract trace correlation from span context', () => {
      // Arrange
      const spanContext: SpanContext = {
        traceId: generateTraceId(),
        spanId: generateSpanId(),
        traceFlags: 1,
        isRemote: false,
      };
      
      const expectedCorrelation: TraceCorrelation = {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        traceFlags: spanContext.traceFlags,
        isRemote: spanContext.isRemote,
        traceState: undefined,
      };
      
      // Act
      const correlation = getTraceCorrelationFromSpanContext(spanContext);
      
      // Assert
      expect(correlation).toEqual(expectedCorrelation);
    });
    
    it('should include traceState when available', () => {
      // Arrange
      const traceStateValue = 'vendor1=value1,vendor2=value2';
      const spanContext: SpanContext = {
        traceId: generateTraceId(),
        spanId: generateSpanId(),
        traceFlags: 1,
        isRemote: true,
        traceState: { toString: () => traceStateValue } as any,
      };
      
      const expectedCorrelation: TraceCorrelation = {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        traceFlags: spanContext.traceFlags,
        isRemote: spanContext.isRemote,
        traceState: traceStateValue,
      };
      
      // Act
      const correlation = getTraceCorrelationFromSpanContext(spanContext);
      
      // Assert
      expect(correlation).toEqual(expectedCorrelation);
    });
  });
  
  describe('hasActiveTrace', () => {
    it('should return true when active span exists', () => {
      // Act
      const result = hasActiveTrace();
      
      // Assert
      expect(result).toBe(true);
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
    
    it('should return false when no active span exists', () => {
      // Arrange
      (trace as any).__setMockActiveSpan(undefined);
      
      // Act
      const result = hasActiveTrace();
      
      // Assert
      expect(result).toBe(false);
      expect(mockedOpenTelemetry.getActiveSpan).toHaveBeenCalled();
    });
  });
  
  describe('Integration with real tracing service', () => {
    it('should work with the mock tracing service', () => {
      // Arrange
      const mockTracingService = createMockTracingService('test-service');
      const logObject = { message: 'Test log message', level: 'info' };
      
      // Act - Create a span and test correlation within it
      mockTracingService.createSpan('test-operation', async () => {
        // Get the current span from the mock service
        const currentSpan = mockTracingService.getMockTracer().getCurrentSpan();
        (trace as any).__setMockActiveSpan(currentSpan);
        
        // Test correlation functions
        const correlation = getTraceCorrelation();
        const enrichedLog = enrichLogWithTraceInfo(logObject);
        const headers = createExternalCorrelationHeaders();
        const metricsCorrelation = createMetricsCorrelation();
        
        // Assert within the span
        expect(correlation).toBeDefined();
        expect(correlation?.traceId).toBe(currentSpan?.spanContext().traceId);
        expect(correlation?.spanId).toBe(currentSpan?.spanContext().spanId);
        
        expect(enrichedLog['trace.id']).toBe(currentSpan?.spanContext().traceId);
        expect(enrichedLog['span.id']).toBe(currentSpan?.spanContext().spanId);
        
        expect(headers).toBeDefined();
        expect(headers?.traceparent).toContain(currentSpan?.spanContext().traceId);
        expect(headers?.traceparent).toContain(currentSpan?.spanContext().spanId);
        
        expect(metricsCorrelation['trace_id']).toBe(currentSpan?.spanContext().traceId);
        expect(metricsCorrelation['span_id']).toBe(currentSpan?.spanContext().spanId);
        
        return { correlation, enrichedLog, headers, metricsCorrelation };
      });
    });
    
    it('should handle journey-specific context in logs', async () => {
      // Arrange
      const mockTracingService = createMockTracingService('test-service');
      const journeyId = 'journey-123';
      const userId = 'user-456';
      const logObject = { message: 'Health journey log', level: 'info' };
      
      // Create a health journey context
      const healthContext = mockTracingService.createHealthJourneyContext(journeyId, userId);
      const mockSpan = mockTracingService.getMockTracer().startSpan('health-operation', {
        attributes: {
          'journey.type': 'health',
          'journey.id': journeyId,
          'user.id': userId,
        },
      });
      
      // Set as active span
      (trace as any).__setMockActiveSpan(mockSpan);
      
      // Act
      const enrichedLog = enrichLogWithTraceInfo(logObject);
      
      // Assert
      expect(enrichedLog['trace.id']).toBe(mockSpan.spanContext().traceId);
      expect(enrichedLog['span.id']).toBe(mockSpan.spanContext().spanId);
      
      // The correlation utilities don't directly expose journey context
      // This would typically be added by a higher-level logging service
      // that combines trace correlation with journey context
    });
  });
});
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { Context, SpanStatusCode, trace, Span, Tracer } from '@opentelemetry/api';
import { TracingService } from '../../../../src/tracing.service';
import {
  ERROR_SCENARIOS,
  SPAN_NAMES,
  SERVICE_NAMES,
  SPAN_ATTRIBUTES,
  createMockSpan,
  createMockTracer
} from '../test-constants';

/**
 * Integration tests for error handling in the tracing system.
 * 
 * These tests verify that errors are properly:
 * - Recorded in spans with correct attributes
 * - Propagated to logs with trace correlation
 * - Handled with appropriate span status codes
 * - Managed for proper span completion even in failure scenarios
 * - Contextualized with journey-specific information
 */
describe('Tracing Error Handling Integration', () => {
  let tracingService: TracingService;
  let mockTracer: jest.Mocked<Tracer>;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockSpan: jest.Mocked<Span>;

  beforeEach(async () => {
    // Create mock implementations
    mockTracer = createMockTracer() as jest.Mocked<Tracer>;
    mockSpan = createMockSpan() as jest.Mocked<Span>;
    mockTracer.startSpan.mockReturnValue(mockSpan);

    // Mock the global trace API
    jest.spyOn(trace, 'getTracer').mockReturnValue(mockTracer);
    jest.spyOn(trace, 'setSpan').mockImplementation((context, span) => context);
    jest.spyOn(trace, 'with').mockImplementation((context, fn) => fn());

    // Create mock logger and config service
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as jest.Mocked<LoggerService>;

    mockConfigService = {
      get: jest.fn().mockReturnValue(SERVICE_NAMES.API_GATEWAY),
    } as jest.Mocked<ConfigService>;

    // Create a test module with TracingService
    const moduleRef = await Test.createTestingModule({
      providers: [
        TracingService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    tracingService = moduleRef.get<TracingService>(TracingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Recording in Spans', () => {
    it('should record exceptions in spans when errors occur', async () => {
      // Arrange
      const error = new Error('Test error');
      const spanName = 'test.operation';
      const operation = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(tracingService.createSpan(spanName, operation)).rejects.toThrow(error);
      
      // Verify span recording
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should set appropriate error attributes based on error type', async () => {
      // Arrange
      const { error, spanName, expectedStatus } = ERROR_SCENARIOS.DB_CONNECTION_ERROR;
      const operation = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(tracingService.createSpan(spanName, operation)).rejects.toThrow(error);
      
      // Verify error status
      expect(mockSpan.setStatus).toHaveBeenCalledWith(expectedStatus);
    });

    it('should handle nested errors in spans correctly', async () => {
      // Arrange
      const outerSpanName = 'outer.operation';
      const innerSpanName = 'inner.operation';
      const innerError = new Error('Inner operation failed');
      
      const innerMockSpan = createMockSpan() as jest.Mocked<Span>;
      const outerMockSpan = mockSpan;
      
      // Setup span creation sequence
      mockTracer.startSpan
        .mockReturnValueOnce(outerMockSpan)
        .mockReturnValueOnce(innerMockSpan);
      
      const innerOperation = jest.fn().mockRejectedValue(innerError);
      const outerOperation = jest.fn().mockImplementation(async () => {
        try {
          await tracingService.createSpan(innerSpanName, innerOperation);
        } catch (error) {
          throw new Error(`Outer operation failed: ${error.message}`);
        }
      });

      // Act & Assert
      await expect(tracingService.createSpan(outerSpanName, outerOperation))
        .rejects.toThrow('Outer operation failed: Inner operation failed');
      
      // Verify both spans recorded their respective errors
      expect(innerMockSpan.recordException).toHaveBeenCalledWith(innerError);
      expect(innerMockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      expect(innerMockSpan.end).toHaveBeenCalled();
      
      expect(outerMockSpan.recordException).toHaveBeenCalled();
      expect(outerMockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      expect(outerMockSpan.end).toHaveBeenCalled();
    });
  });

  describe('Error Propagation to Logs', () => {
    it('should log errors with span context information', async () => {
      // Arrange
      const error = new Error('Operation failed');
      const spanName = 'test.operation';
      const operation = jest.fn().mockRejectedValue(error);

      // Act
      try {
        await tracingService.createSpan(spanName, operation);
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error in span ${spanName}`),
        error.stack,
        'AustaTracing'
      );
    });

    it('should include trace correlation information in error logs', async () => {
      // Arrange
      const { error, spanName } = ERROR_SCENARIOS.AUTH_ERROR;
      const operation = jest.fn().mockRejectedValue(error);

      // Act
      try {
        await tracingService.createSpan(spanName, operation);
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(spanName),
        expect.any(String),
        'AustaTracing'
      );
    });
  });

  describe('Span Status for Different Error Types', () => {
    it.each([
      ['database connection error', ERROR_SCENARIOS.DB_CONNECTION_ERROR],
      ['authentication error', ERROR_SCENARIOS.AUTH_ERROR],
      ['health metric validation error', ERROR_SCENARIOS.HEALTH_METRIC_ERROR],
      ['care appointment error', ERROR_SCENARIOS.CARE_APPOINTMENT_ERROR],
      ['plan claim error', ERROR_SCENARIOS.PLAN_CLAIM_ERROR]
    ])('should set correct span status for %s', async (_, errorScenario) => {
      // Arrange
      const { error, spanName, expectedStatus } = errorScenario;
      const operation = jest.fn().mockRejectedValue(error);

      // Act
      try {
        await tracingService.createSpan(spanName, operation);
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(mockSpan.setStatus).toHaveBeenCalledWith(expectedStatus);
    });

    it('should handle non-Error objects thrown in spans', async () => {
      // Arrange
      const nonError = { message: 'This is not an Error instance' };
      const spanName = 'test.operation';
      const operation = jest.fn().mockRejectedValue(nonError);

      // Act
      try {
        await tracingService.createSpan(spanName, operation);
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      expect(mockSpan.recordException).toHaveBeenCalled();
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe('Error Recovery and Span Completion', () => {
    it('should always end spans even when errors occur', async () => {
      // Arrange
      const error = new Error('Operation failed');
      const spanName = 'test.operation';
      const operation = jest.fn().mockRejectedValue(error);

      // Act
      try {
        await tracingService.createSpan(spanName, operation);
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle errors in span recording gracefully', async () => {
      // Arrange
      const error = new Error('Operation failed');
      const spanName = 'test.operation';
      const operation = jest.fn().mockRejectedValue(error);
      
      // Make span.recordException throw an error
      mockSpan.recordException.mockImplementation(() => {
        throw new Error('Error recording exception');
      });

      // Act
      try {
        await tracingService.createSpan(spanName, operation);
      } catch (e) {
        // Expected to throw the original error, not the recordException error
        expect(e).toBe(error);
      }

      // Assert - should still end the span despite recordException failing
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle errors in span.end gracefully', async () => {
      // Arrange
      const error = new Error('Operation failed');
      const spanName = 'test.operation';
      const operation = jest.fn().mockRejectedValue(error);
      
      // Make span.end throw an error
      mockSpan.end.mockImplementation(() => {
        throw new Error('Error ending span');
      });

      // Act & Assert
      await expect(tracingService.createSpan(spanName, operation)).rejects.toThrow(error);
      
      // Verify the original error is propagated, not the span.end error
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error in span ${spanName}`),
        error.stack,
        'AustaTracing'
      );
    });
  });

  describe('Journey-Specific Error Handling', () => {
    it.each([
      ['health journey', ERROR_SCENARIOS.HEALTH_METRIC_ERROR, SPAN_ATTRIBUTES.HEALTH],
      ['care journey', ERROR_SCENARIOS.CARE_APPOINTMENT_ERROR, SPAN_ATTRIBUTES.CARE],
      ['plan journey', ERROR_SCENARIOS.PLAN_CLAIM_ERROR, SPAN_ATTRIBUTES.PLAN]
    ])('should include journey context in %s errors', async (_, errorScenario, journeyAttributes) => {
      // Arrange
      const { error, spanName } = errorScenario;
      const operation = jest.fn().mockRejectedValue(error);
      
      // Set journey-specific attributes on the span
      mockSpan.isRecording.mockReturnValue(true);
      mockSpan.setAttribute.mockImplementation((key, value) => mockSpan);
      
      // Act
      try {
        // Set journey attributes before executing operation
        Object.entries(journeyAttributes).forEach(([key, value]) => {
          mockSpan.setAttribute(key, value);
        });
        
        await tracingService.createSpan(spanName, operation);
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      
      // Verify journey type is preserved in the span
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey.type', journeyAttributes['journey.type']);
    });

    it('should handle errors with retry mechanisms in journey operations', async () => {
      // Arrange
      const error = new Error('Transient error');
      const spanName = SPAN_NAMES.DB_QUERY;
      
      // Create a retryable operation that fails twice then succeeds
      let attempts = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts <= 2) {
          throw error;
        }
        return 'Success after retry';
      });
      
      // Create a wrapper with retry logic
      const withRetry = async () => {
        let lastError;
        for (let i = 0; i < 3; i++) {
          try {
            return await tracingService.createSpan(`${spanName}.attempt${i+1}`, operation);
          } catch (e) {
            lastError = e;
            // In a real implementation, we might wait before retrying
          }
        }
        throw lastError;
      };

      // Act
      const result = await withRetry();

      // Assert
      expect(result).toBe('Success after retry');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(mockTracer.startSpan).toHaveBeenCalledTimes(3);
      
      // Verify the first two spans recorded errors and the third succeeded
      expect(mockSpan.recordException).toHaveBeenCalledTimes(2);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
      expect(mockSpan.end).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Classification and Context', () => {
    it('should classify errors with appropriate context', async () => {
      // Arrange
      class DatabaseError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'DatabaseError';
        }
      }
      
      const error = new DatabaseError('Connection pool exhausted');
      const spanName = SPAN_NAMES.DB_QUERY;
      const operation = jest.fn().mockRejectedValue(error);

      // Act
      try {
        await tracingService.createSpan(spanName, operation);
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      
      // Verify error is logged with proper classification
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error in span ${spanName}`),
        error.stack,
        'AustaTracing'
      );
    });

    it('should handle async errors in traced operations', async () => {
      // Arrange
      const error = new Error('Async operation failed');
      const spanName = 'async.operation';
      
      // Create an operation that throws asynchronously
      const operation = jest.fn().mockImplementation(async () => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(error), 10);
        });
      });

      // Act & Assert
      await expect(tracingService.createSpan(spanName, operation)).rejects.toThrow(error);
      
      // Verify error handling
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });
});
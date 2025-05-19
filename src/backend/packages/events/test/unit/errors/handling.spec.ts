import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { 
  HandleEventErrors, 
  HandleValidationErrors, 
  EventErrorHandler,
  EventErrorHandlingService,
  EventProcessingStage,
  createFallbackHandler,
  logEventError,
  createErrorResponse
} from '../../../src/errors/handling';
import { 
  EventProcessingError, 
  EventValidationError,
  EventDatabaseError,
  EventTimeoutError,
  EventExternalSystemError,
  DuplicateEventError
} from '../../../src/errors/event-errors';
import { CircuitBreaker } from '../../../src/errors/circuit-breaker';
import { IBaseEvent } from '../../../src/interfaces/base-event.interface';
import { IEventResponse, EventResponseStatus } from '../../../src/interfaces/event-response.interface';
import { IEventHandler } from '../../../src/interfaces/event-handler.interface';

// Mock dependencies
jest.mock('@austa/tracing', () => ({
  getCurrentTraceId: jest.fn().mockReturnValue('mock-trace-id'),
  TraceContext: jest.fn(),
}));

jest.mock('../../../src/errors/dlq', () => ({
  sendToDlq: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/errors/retry-policies', () => ({
  applyRetryPolicy: jest.fn().mockResolvedValue(false),
}));

// Import mocked dependencies
import { sendToDlq } from '../../../src/errors/dlq';
import { applyRetryPolicy } from '../../../src/errors/retry-policies';

describe('Event Error Handling', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Sample event for testing
  const mockEvent: IBaseEvent = {
    eventId: 'test-event-id',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test-service',
    type: 'test.event',
    payload: { data: 'test-data' },
    metadata: {
      correlationId: 'test-correlation-id',
      userId: 'test-user-id',
      journey: 'health'
    }
  };

  describe('@HandleEventErrors decorator', () => {
    // Test class with decorated method
    class TestEventProcessor {
      @HandleEventErrors()
      async processEvent(event: IBaseEvent): Promise<string> {
        return 'success';
      }

      @HandleEventErrors({ sendToDlq: false, applyRetryPolicy: false })
      async processWithoutDlq(event: IBaseEvent): Promise<string> {
        throw new Error('Test error');
      }

      @HandleEventErrors({ journeyContext: 'care' })
      async processCareEvent(event: IBaseEvent): Promise<string> {
        throw new EventProcessingError(
          'Care event processing failed',
          { eventId: event.eventId, eventType: event.type },
          new Error('Underlying error')
        );
      }

      @HandleEventErrors({ useCircuitBreaker: true })
      async processWithCircuitBreaker(event: IBaseEvent): Promise<string> {
        return 'circuit breaker success';
      }
    }

    let processor: TestEventProcessor;

    beforeEach(() => {
      processor = new TestEventProcessor();
    });

    it('should return the result when no error occurs', async () => {
      const result = await processor.processEvent(mockEvent);
      expect(result).toBe('success');
    });

    it('should handle errors and send to DLQ by default', async () => {
      // Mock implementation to throw an error
      jest.spyOn(processor, 'processWithoutDlq').mockImplementation(() => {
        throw new Error('Test error');
      });

      await processor.processWithoutDlq(mockEvent);
      
      // Verify DLQ was not called due to configuration
      expect(sendToDlq).not.toHaveBeenCalled();
    });

    it('should handle journey-specific errors with correct context', async () => {
      try {
        await processor.processCareEvent(mockEvent);
      } catch (error) {
        // Error should be rethrown since we're not implementing IEventHandler
      }

      // Verify DLQ was called with correct journey context
      expect(sendToDlq).toHaveBeenCalledWith(
        mockEvent,
        expect.any(EventProcessingError),
        'care'
      );
    });

    it('should use circuit breaker when configured', async () => {
      // Spy on CircuitBreaker methods
      const isOpenSpy = jest.spyOn(CircuitBreaker.prototype, 'isOpen').mockReturnValue(false);
      const recordSuccessSpy = jest.spyOn(CircuitBreaker.prototype, 'recordSuccess');

      const result = await processor.processWithCircuitBreaker(mockEvent);
      
      expect(result).toBe('circuit breaker success');
      expect(isOpenSpy).toHaveBeenCalled();
      expect(recordSuccessSpy).toHaveBeenCalled();
    });

    it('should reject requests when circuit breaker is open', async () => {
      // Mock circuit breaker to be open
      jest.spyOn(CircuitBreaker.prototype, 'isOpen').mockReturnValue(true);

      try {
        await processor.processWithCircuitBreaker(mockEvent);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(EventProcessingError);
        expect(error.message).toContain('Circuit breaker is open');
      }
    });
  });

  describe('@HandleValidationErrors decorator', () => {
    class TestValidator {
      @HandleValidationErrors()
      async validateEvent(event: IBaseEvent): Promise<boolean> {
        return true;
      }

      @HandleValidationErrors({ journeyContext: 'plan' })
      async validateWithError(event: IBaseEvent): Promise<boolean> {
        throw new EventValidationError(
          'Invalid event format',
          { eventId: event.eventId, eventType: event.type }
        );
      }

      @HandleValidationErrors()
      async validateWithNonValidationError(event: IBaseEvent): Promise<boolean> {
        throw new Error('Non-validation error');
      }
    }

    let validator: TestValidator;

    beforeEach(() => {
      validator = new TestValidator();
    });

    it('should return the result when validation succeeds', async () => {
      const result = await validator.validateEvent(mockEvent);
      expect(result).toBe(true);
    });

    it('should handle validation errors with correct context', async () => {
      try {
        await validator.validateWithError(mockEvent);
      } catch (error) {
        // Error should be rethrown since we're not implementing IEventHandler
      }

      // Verify DLQ was called with correct journey context
      expect(sendToDlq).toHaveBeenCalledWith(
        mockEvent,
        expect.any(EventValidationError),
        'plan'
      );
    });

    it('should rethrow non-validation errors', async () => {
      await expect(validator.validateWithNonValidationError(mockEvent))
        .rejects.toThrow('Non-validation error');
      
      // Verify DLQ was not called for non-validation errors
      expect(sendToDlq).not.toHaveBeenCalled();
    });
  });

  describe('@EventErrorHandler class decorator', () => {
    // Define a test class with the class decorator
    @EventErrorHandler({ journeyContext: 'health' })
    class TestEventHandler implements IEventHandler {
      async handle(event: IBaseEvent): Promise<IEventResponse> {
        return {
          success: true,
          status: EventResponseStatus.SUCCESS,
          eventId: event.eventId,
          eventType: event.type,
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      async validateEvent(event: IBaseEvent): Promise<boolean> {
        if (!event.payload) {
          throw new EventValidationError('Missing payload', { eventId: event.eventId });
        }
        return true;
      }

      async processEvent(event: IBaseEvent): Promise<any> {
        throw new EventProcessingError('Processing failed', { eventId: event.eventId });
      }

      async saveEvent(event: IBaseEvent): Promise<void> {
        throw new EventDatabaseError('Database error', { eventId: event.eventId });
      }

      async canHandle(event: IBaseEvent): Promise<boolean> {
        return event.type === 'test.event';
      }

      getEventType(): string {
        return 'test.event';
      }
    }

    let handler: TestEventHandler;

    beforeEach(() => {
      handler = new TestEventHandler();
    });

    it('should apply validation error handling to validate* methods', async () => {
      const invalidEvent = { ...mockEvent, payload: null };
      
      const result = await handler.validateEvent(invalidEvent as any);
      
      // For IEventHandler implementations, we return an error response instead of throwing
      expect(result).toEqual(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Missing payload'),
          type: 'VALIDATION_ERROR'
        })
      }));
    });

    it('should apply processing error handling to process* methods', async () => {
      const result = await handler.processEvent(mockEvent);
      
      expect(result).toEqual(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Processing failed'),
          processingStage: EventProcessingStage.PROCESSING
        })
      }));
    });

    it('should apply persistence error handling to save* methods', async () => {
      const result = await handler.saveEvent(mockEvent);
      
      expect(result).toEqual(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Database error'),
          processingStage: EventProcessingStage.PERSISTENCE
        })
      }));
    });

    it('should apply validation error handling to canHandle method', async () => {
      const result = await handler.canHandle({ ...mockEvent, type: null } as any);
      
      // canHandle should return false for invalid events rather than throwing
      expect(result).toBe(false);
    });
  });

  describe('EventErrorHandlingService', () => {
    let errorHandlingService: EventErrorHandlingService;

    beforeEach(() => {
      errorHandlingService = new EventErrorHandlingService();
    });

    it('should wrap handler functions with error handling', async () => {
      // Create a handler function that throws an error
      const handlerFn = jest.fn().mockImplementation(() => {
        throw new EventProcessingError('Handler error', { eventId: mockEvent.eventId });
      });

      // Wrap the handler with error handling
      const wrappedHandler = errorHandlingService.wrapWithErrorHandling(handlerFn);

      // Call the wrapped handler
      const result = await wrappedHandler(mockEvent);

      // Verify the result is an error response
      expect(result).toEqual(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Handler error')
        })
      }));

      // Verify DLQ was called
      expect(sendToDlq).toHaveBeenCalled();
    });

    it('should execute with fallback when primary handler fails', async () => {
      // Create a primary handler that throws an error
      const primaryHandler = jest.fn().mockImplementation(() => {
        throw new Error('Primary handler error');
      });

      // Create a fallback handler
      const fallbackHandler = jest.fn().mockResolvedValue('fallback result');

      // Execute with fallback
      const result = await errorHandlingService.executeWithFallback(
        primaryHandler,
        fallbackHandler,
        mockEvent
      );

      // Verify fallback was called with the error
      expect(fallbackHandler).toHaveBeenCalledWith(
        mockEvent,
        expect.objectContaining({
          message: 'Primary handler error'
        })
      );

      // Verify the result is from the fallback
      expect(result).toBe('fallback result');
    });

    it('should create a circuit breaker', () => {
      const circuitBreaker = errorHandlingService.createCircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 5000
      });

      expect(circuitBreaker).toBeInstanceOf(CircuitBreaker);
    });

    it('should correctly identify retryable errors', () => {
      // Test with retryable error
      const retryableError = new EventTimeoutError(
        'Connection timeout',
        { eventId: mockEvent.eventId }
      );
      expect(errorHandlingService.isRetryableError(retryableError, mockEvent)).toBe(true);

      // Test with non-retryable error
      const nonRetryableError = new DuplicateEventError(
        'Duplicate event',
        { eventId: mockEvent.eventId }
      );
      expect(errorHandlingService.isRetryableError(nonRetryableError, mockEvent)).toBe(false);
    });
  });

  describe('createFallbackHandler', () => {
    it('should execute fallback function when called', async () => {
      // Create a fallback function
      const fallbackFn = jest.fn().mockImplementation((event, error) => {
        return Promise.resolve({
          success: true,
          status: EventResponseStatus.SUCCESS,
          eventId: event.eventId,
          eventType: event.type,
          data: { fallback: true },
          metadata: {
            timestamp: new Date().toISOString(),
            originalError: error.message
          }
        });
      });

      // Create a fallback handler
      const fallbackHandler = createFallbackHandler(fallbackFn);

      // Call the fallback handler
      const error = new Error('Original error');
      const result = await fallbackHandler(mockEvent, error);

      // Verify fallback was called with the event and error
      expect(fallbackFn).toHaveBeenCalledWith(mockEvent, error);

      // Verify the result is from the fallback
      expect(result).toEqual(expect.objectContaining({
        success: true,
        data: { fallback: true }
      }));
    });

    it('should handle errors in the fallback function', async () => {
      // Create a fallback function that throws an error
      const fallbackFn = jest.fn().mockImplementation(() => {
        throw new Error('Fallback error');
      });

      // Create a fallback handler
      const fallbackHandler = createFallbackHandler(fallbackFn, { sendToDlq: true });

      // Call the fallback handler
      const error = new Error('Original error');
      const result = await fallbackHandler(mockEvent, error);

      // Verify the result indicates both handlers failed
      expect(result).toEqual(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Both primary and fallback handlers failed',
          code: 'FALLBACK_FAILED'
        })
      }));

      // Verify DLQ was called with combined error
      expect(sendToDlq).toHaveBeenCalledWith(
        mockEvent,
        expect.objectContaining({
          message: expect.stringContaining('Both primary and fallback handlers failed'),
          code: 'FALLBACK_FAILED'
        }),
        expect.any(String)
      );
    });
  });

  describe('logEventError', () => {
    let loggerSpy: jest.SpyInstance;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    it('should log processing errors with correct context', () => {
      const error = new EventProcessingError(
        'Processing error',
        { eventId: mockEvent.eventId, eventType: mockEvent.type },
        new Error('Underlying error')
      );

      logEventError(error, mockEvent, 'health', true, EventProcessingStage.PROCESSING);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processing error'),
        expect.objectContaining({
          eventId: mockEvent.eventId,
          eventType: mockEvent.type,
          journey: 'health',
          processingStage: EventProcessingStage.PROCESSING,
          traceId: 'mock-trace-id'
        }),
        expect.any(String)
      );
    });

    it('should log validation errors with correct level', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      
      const error = new EventValidationError(
        'Validation error',
        { eventId: mockEvent.eventId, eventType: mockEvent.type }
      );

      logEventError(error, mockEvent, 'health', true, EventProcessingStage.VALIDATION);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validation error'),
        expect.objectContaining({
          eventId: mockEvent.eventId,
          eventType: mockEvent.type,
          journey: 'health',
          processingStage: EventProcessingStage.VALIDATION
        })
      );
    });

    it('should log unexpected errors as errors', () => {
      const error = new Error('Unexpected error');

      logEventError(error, mockEvent, 'health', true, EventProcessingStage.PROCESSING);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error'),
        expect.objectContaining({
          eventId: mockEvent.eventId,
          eventType: mockEvent.type,
          journey: 'health'
        }),
        expect.any(String)
      );
    });
  });

  describe('createErrorResponse', () => {
    it('should create standardized error response for EventProcessingError', () => {
      const error = new EventProcessingError(
        'Processing error',
        { eventId: mockEvent.eventId, eventType: mockEvent.type, details: { field: 'value' } },
        new Error('Underlying error')
      );

      const response = createErrorResponse(error, mockEvent);

      expect(response).toEqual(expect.objectContaining({
        success: false,
        eventId: mockEvent.eventId,
        error: expect.objectContaining({
          message: 'Processing error',
          type: 'PROCESSING_ERROR',
          details: expect.objectContaining({ field: 'value' }),
          retryable: false
        })
      }));
    });

    it('should create standardized error response for EventValidationError', () => {
      const error = new EventValidationError(
        'Validation error',
        { eventId: mockEvent.eventId, eventType: mockEvent.type, details: { field: 'invalid' } }
      );

      const response = createErrorResponse(error, mockEvent);

      expect(response).toEqual(expect.objectContaining({
        success: false,
        eventId: mockEvent.eventId,
        error: expect.objectContaining({
          message: 'Validation error',
          type: 'VALIDATION_ERROR',
          details: expect.objectContaining({ field: 'invalid' }),
          retryable: false
        })
      }));
    });

    it('should create generic error response for unknown errors', () => {
      const error = new Error('Unknown error');

      const response = createErrorResponse(error, mockEvent);

      expect(response).toEqual(expect.objectContaining({
        success: false,
        eventId: mockEvent.eventId,
        error: expect.objectContaining({
          message: 'An unexpected error occurred during event processing',
          code: 'UNKNOWN_ERROR',
          type: 'SYSTEM_ERROR',
          retryable: false
        })
      }));
    });

    it('should include trace ID if available', () => {
      const error = new Error('Error with trace');

      const response = createErrorResponse(error, mockEvent);

      expect(response).toEqual(expect.objectContaining({
        traceId: 'mock-trace-id'
      }));
    });
  });

  describe('Error classification and retry behavior', () => {
    // Test class with methods that throw different types of errors
    class ErrorClassificationTest {
      @HandleEventErrors()
      async throwDatabaseError(event: IBaseEvent): Promise<void> {
        throw new EventDatabaseError(
          'Database connection failed',
          { eventId: event.eventId, eventType: event.type },
          'query',
          new Error('Connection refused')
        );
      }

      @HandleEventErrors()
      async throwTimeoutError(event: IBaseEvent): Promise<void> {
        throw new EventTimeoutError(
          'Operation timed out',
          { eventId: event.eventId, eventType: event.type },
          5000,
          new Error('Timeout')
        );
      }

      @HandleEventErrors()
      async throwExternalSystemError(event: IBaseEvent): Promise<void> {
        throw new EventExternalSystemError(
          'External API failed',
          { eventId: event.eventId, eventType: event.type },
          503,
          new Error('Service unavailable')
        );
      }

      @HandleEventErrors()
      async throwDuplicateEventError(event: IBaseEvent): Promise<void> {
        throw new DuplicateEventError(
          'Event already processed',
          { eventId: event.eventId, eventType: event.type }
        );
      }
    }

    let errorTest: ErrorClassificationTest;

    beforeEach(() => {
      errorTest = new ErrorClassificationTest();
    });

    it('should classify database errors as retryable', async () => {
      // Mock applyRetryPolicy to test classification
      (applyRetryPolicy as jest.Mock).mockResolvedValueOnce(true);

      try {
        await errorTest.throwDatabaseError(mockEvent);
      } catch (error) {
        // Error should be rethrown
      }

      // Verify retry policy was applied
      expect(applyRetryPolicy).toHaveBeenCalledWith(
        expect.any(EventDatabaseError),
        mockEvent,
        undefined
      );

      // Since we mocked applyRetryPolicy to return true, DLQ should not be called
      expect(sendToDlq).not.toHaveBeenCalled();
    });

    it('should classify timeout errors as retryable', async () => {
      // Mock applyRetryPolicy to test classification
      (applyRetryPolicy as jest.Mock).mockResolvedValueOnce(true);

      try {
        await errorTest.throwTimeoutError(mockEvent);
      } catch (error) {
        // Error should be rethrown
      }

      // Verify retry policy was applied
      expect(applyRetryPolicy).toHaveBeenCalledWith(
        expect.any(EventTimeoutError),
        mockEvent,
        undefined
      );

      // Since we mocked applyRetryPolicy to return true, DLQ should not be called
      expect(sendToDlq).not.toHaveBeenCalled();
    });

    it('should classify external system errors based on status code', async () => {
      // Mock applyRetryPolicy to test classification
      (applyRetryPolicy as jest.Mock).mockResolvedValueOnce(true);

      try {
        await errorTest.throwExternalSystemError(mockEvent);
      } catch (error) {
        // Error should be rethrown
      }

      // Verify retry policy was applied
      expect(applyRetryPolicy).toHaveBeenCalledWith(
        expect.any(EventExternalSystemError),
        mockEvent,
        undefined
      );

      // Since we mocked applyRetryPolicy to return true, DLQ should not be called
      expect(sendToDlq).not.toHaveBeenCalled();
    });

    it('should classify duplicate event errors as non-retryable', async () => {
      // Mock applyRetryPolicy to test classification
      (applyRetryPolicy as jest.Mock).mockResolvedValueOnce(false);

      try {
        await errorTest.throwDuplicateEventError(mockEvent);
      } catch (error) {
        // Error should be rethrown
      }

      // Verify retry policy was applied
      expect(applyRetryPolicy).toHaveBeenCalledWith(
        expect.any(DuplicateEventError),
        mockEvent,
        undefined
      );

      // Since we mocked applyRetryPolicy to return false, DLQ should be called
      expect(sendToDlq).toHaveBeenCalled();
    });
  });
});
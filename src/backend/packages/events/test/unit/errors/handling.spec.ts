import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';
import {
  WithErrorHandling,
  WithRetry,
  WithFallback,
  EventErrorHandlingService,
  classifyError,
  ErrorCategory,
  DEFAULT_ERROR_HANDLING_OPTIONS
} from '../../../src/errors/handling';
import { CircuitBreaker, CircuitBreakerState } from '../../../src/errors/circuit-breaker';
import {
  EventProcessingException,
  EventValidationException,
  EventSchemaVersionException,
  EventErrorCategory,
  EventProcessingStage
} from '../../../src/errors/event-errors';
import { IEventHandler } from '../../../src/interfaces/event-handler.interface';
import { BaseEvent, createEvent } from '../../../src/interfaces/base-event.interface';
import { IEventResponse } from '../../../src/interfaces/event-response.interface';

// Mock implementations
class MockLoggerService {
  error = jest.fn();
  warn = jest.fn();
  log = jest.fn();
  debug = jest.fn();
}

class MockTracingService {
  startSpan = jest.fn().mockReturnValue({
    end: jest.fn(),
    recordException: jest.fn(),
    setAttributes: jest.fn()
  });
}

// Test event types
interface TestEventPayload {
  value: string;
  metadata?: Record<string, any>;
}

type TestEvent = BaseEvent<TestEventPayload>;

// Mock event handler implementation
class TestEventHandler implements IEventHandler<TestEvent, string> {
  constructor(
    private readonly logger: LoggerService = new Logger('TestEventHandler'),
    private readonly tracingService?: TracingService
  ) {}

  async handle(event: TestEvent): Promise<IEventResponse<string>> {
    return {
      success: true,
      eventId: event.eventId,
      eventType: event.type,
      data: `Processed ${event.payload.value}`,
      metadata: {
        processingTimeMs: 10,
        completedAt: new Date().toISOString()
      }
    };
  }

  async canHandle(event: any): Promise<{ isValid: boolean; errors?: string[] }> {
    return { isValid: event.type === 'TEST_EVENT' };
  }

  getEventType(): string {
    return 'TEST_EVENT';
  }
}

// Test class with decorated methods
class TestEventProcessor {
  constructor(
    public readonly logger: LoggerService = new Logger('TestEventProcessor'),
    public readonly tracingService?: TracingService
  ) {}

  @WithErrorHandling()
  async processEvent(event: TestEvent): Promise<string> {
    return `Processed ${event.payload.value}`;
  }

  @WithErrorHandling({ detailedLogging: false })
  async processEventWithError(event: TestEvent): Promise<string> {
    throw new Error('Test error');
  }

  @WithErrorHandling()
  async processEventWithValidationError(event: TestEvent): Promise<string> {
    throw new EventValidationException(
      'Invalid event data',
      'VALIDATION_ERROR',
      {
        eventId: event.eventId,
        eventType: event.type,
        processingStage: EventProcessingStage.VALIDATION
      },
      { field: 'value', constraint: 'required' }
    );
  }

  @WithErrorHandling()
  async processEventWithSchemaError(event: TestEvent): Promise<string> {
    throw new EventSchemaVersionException(
      'Schema version mismatch',
      'SCHEMA_VERSION_ERROR',
      {
        eventId: event.eventId,
        eventType: event.type,
        processingStage: EventProcessingStage.VALIDATION
      },
      { expectedVersion: '2.0.0', actualVersion: '1.0.0' }
    );
  }

  @WithRetry(3, 100)
  async processEventWithRetry(event: TestEvent): Promise<string> {
    if (event.payload.metadata?.shouldFail) {
      throw new Error('Transient error');
    }
    return `Processed ${event.payload.value} with retry`;
  }

  @WithFallback<TestEvent, string>(async (event) => {
    return `Fallback for ${event.payload.value}`;
  })
  async processEventWithFallback(event: TestEvent): Promise<string> {
    if (event.payload.metadata?.shouldFail) {
      throw new Error('Error with fallback');
    }
    return `Processed ${event.payload.value}`;
  }

  @WithErrorHandling({ useCircuitBreaker: true })
  async processEventWithCircuitBreaker(event: TestEvent): Promise<string> {
    if (event.payload.metadata?.shouldFail) {
      throw new Error('Circuit breaker error');
    }
    return `Processed ${event.payload.value} with circuit breaker`;
  }

  // Combined decorators (order matters - innermost executes first)
  @WithErrorHandling()
  @WithRetry(2, 50)
  @WithFallback<TestEvent, string>(async (event) => {
    return `Final fallback for ${event.payload.value}`;
  })
  async processEventWithCombinedDecorators(event: TestEvent): Promise<string> {
    if (event.payload.metadata?.shouldFail) {
      throw new Error('Combined decorators error');
    }
    return `Processed ${event.payload.value} with combined decorators`;
  }
}

describe('Event Error Handling', () => {
  let processor: TestEventProcessor;
  let mockLogger: MockLoggerService;
  let mockTracing: MockTracingService;
  let errorHandlingService: EventErrorHandlingService;
  let testEvent: TestEvent;

  beforeEach(async () => {
    // Reset circuit breaker instances before each test
    jest.spyOn(CircuitBreaker, 'getInstance').mockImplementation((key, options) => {
      const instance = new CircuitBreaker(options || DEFAULT_ERROR_HANDLING_OPTIONS.circuitBreakerOptions);
      jest.spyOn(instance, 'isAllowed').mockReturnValue(true);
      jest.spyOn(instance, 'recordSuccess');
      jest.spyOn(instance, 'recordFailure');
      return instance;
    });

    mockLogger = new MockLoggerService();
    mockTracing = new MockTracingService();
    processor = new TestEventProcessor(mockLogger as unknown as LoggerService, mockTracing as unknown as TracingService);

    const moduleRef = await Test.createTestingModule({
      providers: [
        EventErrorHandlingService,
        {
          provide: LoggerService,
          useValue: mockLogger
        },
        {
          provide: TracingService,
          useValue: mockTracing
        }
      ]
    }).compile();

    errorHandlingService = moduleRef.get<EventErrorHandlingService>(EventErrorHandlingService);

    // Create a test event
    testEvent = createEvent<TestEventPayload>(
      'TEST_EVENT',
      'test-service',
      { value: 'test-value' },
      {
        userId: 'user-123',
        journey: 'health',
        eventId: 'event-123',
        metadata: {
          correlationId: 'corr-123',
          traceId: 'trace-123'
        }
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Classification', () => {
    it('should classify validation errors as PERMANENT', () => {
      const error = new EventValidationException(
        'Invalid event data',
        'VALIDATION_ERROR',
        {
          eventId: 'event-123',
          eventType: 'TEST_EVENT',
          processingStage: EventProcessingStage.VALIDATION
        }
      );

      const category = classifyError(error);
      expect(category).toBe(ErrorCategory.PERMANENT);
    });

    it('should classify schema errors as PERMANENT', () => {
      const error = new EventSchemaVersionException(
        'Schema version mismatch',
        'SCHEMA_VERSION_ERROR',
        {
          eventId: 'event-123',
          eventType: 'TEST_EVENT',
          processingStage: EventProcessingStage.VALIDATION
        }
      );

      const category = classifyError(error);
      expect(category).toBe(ErrorCategory.PERMANENT);
    });

    it('should classify network-related processing errors as TRANSIENT', () => {
      const error = new EventProcessingException(
        'Network connection error',
        'NETWORK_ERROR',
        EventErrorCategory.TRANSIENT,
        {
          eventId: 'event-123',
          eventType: 'TEST_EVENT',
          processingStage: EventProcessingStage.PROCESSING
        }
      );

      const category = classifyError(error);
      expect(category).toBe(ErrorCategory.TRANSIENT);
    });

    it('should classify permission errors as PERMANENT', () => {
      const error = new EventProcessingException(
        'Permission denied for resource',
        'PERMISSION_DENIED',
        EventErrorCategory.PERMANENT,
        {
          eventId: 'event-123',
          eventType: 'TEST_EVENT',
          processingStage: EventProcessingStage.PROCESSING
        }
      );

      const category = classifyError(error);
      expect(category).toBe(ErrorCategory.PERMANENT);
    });

    it('should classify unknown errors as INDETERMINATE', () => {
      const error = new Error('Unknown error');
      const category = classifyError(error);
      expect(category).toBe(ErrorCategory.INDETERMINATE);
    });
  });

  describe('WithErrorHandling Decorator', () => {
    it('should successfully process an event', async () => {
      const result = await processor.processEvent(testEvent);
      expect(result).toBe('Processed test-value');
      expect(mockTracing.startSpan).toHaveBeenCalled();
    });

    it('should handle and rethrow errors', async () => {
      await expect(processor.processEventWithError(testEvent)).rejects.toThrow('Test error');
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockTracing.startSpan).toHaveBeenCalled();
    });

    it('should properly handle validation errors', async () => {
      await expect(processor.processEventWithValidationError(testEvent)).rejects.toThrow('Invalid event data');
      expect(mockLogger.error).toHaveBeenCalled();
      
      // Verify error details were logged
      const errorCall = mockLogger.error.mock.calls[0];
      expect(errorCall[1].errorCategory).toBe(ErrorCategory.PERMANENT);
    });

    it('should properly handle schema errors', async () => {
      await expect(processor.processEventWithSchemaError(testEvent)).rejects.toThrow('Schema version mismatch');
      expect(mockLogger.error).toHaveBeenCalled();
      
      // Verify error details were logged
      const errorCall = mockLogger.error.mock.calls[0];
      expect(errorCall[1].errorCategory).toBe(ErrorCategory.PERMANENT);
    });
  });

  describe('WithRetry Decorator', () => {
    it('should retry failed operations', async () => {
      // First call will fail, second will succeed
      let attempts = 0;
      jest.spyOn(processor, 'processEventWithRetry').mockImplementation(async (event) => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Transient error');
        }
        return `Processed ${event.payload.value} after ${attempts} attempts`;
      });

      const result = await processor.processEventWithRetry(testEvent);
      expect(result).toBe('Processed test-value after 2 attempts');
      expect(attempts).toBe(2);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should stop retrying after max attempts', async () => {
      // All calls will fail
      jest.spyOn(processor, 'processEventWithRetry').mockImplementation(async () => {
        throw new Error('Persistent error');
      });

      await expect(processor.processEventWithRetry(testEvent)).rejects.toThrow('Persistent error');
      expect(processor.processEventWithRetry).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(mockLogger.warn).toHaveBeenCalledTimes(3); // Log for each retry
      expect(mockLogger.error).toHaveBeenCalledTimes(1); // Final error log
    });
  });

  describe('WithFallback Decorator', () => {
    it('should use fallback when operation fails', async () => {
      const eventWithFailure = createEvent<TestEventPayload>(
        'TEST_EVENT',
        'test-service',
        { value: 'failing-value', metadata: { shouldFail: true } },
        { eventId: 'event-456' }
      );

      const result = await processor.processEventWithFallback(eventWithFailure);
      expect(result).toBe('Fallback for failing-value');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should not use fallback when operation succeeds', async () => {
      const result = await processor.processEventWithFallback(testEvent);
      expect(result).toBe('Processed test-value');
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should record success when operation succeeds', async () => {
      const result = await processor.processEventWithCircuitBreaker(testEvent);
      expect(result).toBe('Processed test-value with circuit breaker');
      
      // Get the circuit breaker instance that was used
      const circuitBreaker = CircuitBreaker.getInstance('TestEventProcessor.processEventWithCircuitBreaker');
      expect(circuitBreaker.recordSuccess).toHaveBeenCalled();
    });

    it('should record failure when operation fails', async () => {
      const eventWithFailure = createEvent<TestEventPayload>(
        'TEST_EVENT',
        'test-service',
        { value: 'failing-value', metadata: { shouldFail: true } },
        { eventId: 'event-456' }
      );

      await expect(processor.processEventWithCircuitBreaker(eventWithFailure)).rejects.toThrow('Circuit breaker error');
      
      // Get the circuit breaker instance that was used
      const circuitBreaker = CircuitBreaker.getInstance('TestEventProcessor.processEventWithCircuitBreaker');
      expect(circuitBreaker.recordFailure).toHaveBeenCalled();
    });

    it('should skip processing when circuit is open', async () => {
      // Mock circuit breaker to be open
      jest.spyOn(CircuitBreaker.prototype, 'isAllowed').mockReturnValue(false);
      jest.spyOn(CircuitBreaker.prototype, 'getState').mockReturnValue({
        state: CircuitBreakerState.OPEN,
        failureCount: 5,
        lastFailureTime: Date.now()
      });

      await expect(processor.processEventWithCircuitBreaker(testEvent)).rejects.toThrow('Circuit breaker open');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('Combined Decorators', () => {
    it('should apply decorators in the correct order', async () => {
      // First call will fail, second will succeed
      let attempts = 0;
      jest.spyOn(processor, 'processEventWithCombinedDecorators').mockImplementation(async (event) => {
        attempts++;
        if (attempts <= 2) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return `Processed ${event.payload.value} after ${attempts} attempts`;
      });

      const result = await processor.processEventWithCombinedDecorators(testEvent);
      expect(result).toBe('Final fallback for test-value');
      expect(attempts).toBe(3); // Initial + 2 retries
    });
  });

  describe('EventErrorHandlingService', () => {
    it('should wrap an event handler with error handling', async () => {
      const handler = new TestEventHandler(mockLogger as unknown as LoggerService, mockTracing as unknown as TracingService);
      const wrappedHandler = errorHandlingService.wrapWithErrorHandling(handler);

      const response = await wrappedHandler.handle(testEvent);
      expect(response.success).toBe(true);
      expect(response.data).toBe('Processed test-value');
    });

    it('should handle errors in wrapped handlers', async () => {
      const handler = new TestEventHandler(mockLogger as unknown as LoggerService, mockTracing as unknown as TracingService);
      
      // Mock handler to throw an error
      jest.spyOn(handler, 'handle').mockImplementation(async () => {
        throw new Error('Handler error');
      });
      
      const wrappedHandler = errorHandlingService.wrapWithErrorHandling(handler);
      const response = await wrappedHandler.handle(testEvent);
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe('Handler error');
      expect(response.error?.category).toBe(ErrorCategory.INDETERMINATE);
    });

    it('should create a safe event handler function', async () => {
      const handlerFn = async (event: TestEvent) => {
        return `Processed ${event.payload.value} with function handler`;
      };
      
      const safeHandler = errorHandlingService.createSafeEventHandler(handlerFn);
      const response = await safeHandler(testEvent);
      
      expect(response.success).toBe(true);
      expect(response.data).toBe('Processed test-value with function handler');
    });

    it('should handle errors in safe event handler functions', async () => {
      const handlerFn = async (event: TestEvent) => {
        throw new Error('Function handler error');
      };
      
      const safeHandler = errorHandlingService.createSafeEventHandler(handlerFn);
      const response = await safeHandler(testEvent);
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe('Function handler error');
    });

    it('should use fallback function when provided and error is permanent', async () => {
      const handler = new TestEventHandler(mockLogger as unknown as LoggerService, mockTracing as unknown as TracingService);
      
      // Mock handler to throw a permanent error
      jest.spyOn(handler, 'handle').mockImplementation(async (event) => {
        throw new EventValidationException(
          'Permanent validation error',
          'VALIDATION_ERROR',
          {
            eventId: event.eventId,
            eventType: event.type,
            processingStage: EventProcessingStage.VALIDATION
          }
        );
      });
      
      const fallbackFn = async (event: TestEvent) => {
        return `Fallback result for ${event.payload.value}`;
      };
      
      const wrappedHandler = errorHandlingService.wrapWithErrorHandling(handler, {
        fallbackFn
      });
      
      const response = await wrappedHandler.handle(testEvent);
      
      expect(response.success).toBe(true);
      expect(response.data).toBe('Fallback result for test-value');
      expect(response.metadata?.fallback).toBe(true);
    });
  });
});
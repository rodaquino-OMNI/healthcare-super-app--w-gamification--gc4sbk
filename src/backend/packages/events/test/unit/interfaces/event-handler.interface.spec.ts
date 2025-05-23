import { IEventHandler, IBatchEventHandler, IDLQEventHandler, EventHandlerContext, EventHandlerOptions } from '../../../src/interfaces/event-handler.interface';
import { IEventResponse, createSuccessResponse, createErrorResponse } from '../../../src/interfaces/event-response.interface';
import { ValidationResult } from '../../../src/interfaces/event-validation.interface';

// Mock event types for testing
interface TestEvent {
  eventId: string;
  eventType: string;
  payload: {
    data: string;
    value: number;
  };
}

interface HealthMetricEvent {
  eventId: string;
  eventType: string;
  payload: {
    userId: string;
    metricType: string;
    value: number;
    unit: string;
    timestamp: string;
  };
}

// Mock response data types
interface TestEventResult {
  processed: boolean;
  value: number;
}

// Mock validation results
const validResult: ValidationResult = {
  isValid: true,
  errors: [],
};

const invalidResult: ValidationResult = {
  isValid: false,
  errors: [{
    code: 'INVALID_PAYLOAD',
    message: 'Event payload is invalid',
    path: 'payload',
  }],
};

// Mock event handler implementation
class TestEventHandler implements IEventHandler<TestEvent, TestEventResult> {
  async handle(
    event: TestEvent,
    context?: EventHandlerContext,
    options?: EventHandlerOptions
  ): Promise<IEventResponse<TestEventResult>> {
    try {
      // Simple processing logic for testing
      const result: TestEventResult = {
        processed: true,
        value: event.payload.value * 2,
      };

      return createSuccessResponse(
        event.eventId,
        event.eventType,
        result,
        {
          processingTimeMs: 10,
          correlationId: context?.correlationId,
          serviceId: context?.serviceId || 'test-service',
        }
      );
    } catch (error) {
      return createErrorResponse(
        event.eventId,
        event.eventType,
        {
          code: 'PROCESSING_ERROR',
          message: error.message || 'Failed to process event',
          retryable: true,
        }
      );
    }
  }

  async canHandle(event: any, context?: EventHandlerContext): Promise<ValidationResult> {
    // Check if this is a TestEvent that this handler can process
    if (event.eventType === 'TEST_EVENT' && event.payload?.data && typeof event.payload.value === 'number') {
      return validResult;
    }
    return invalidResult;
  }

  getEventType(): string {
    return 'TEST_EVENT';
  }
}

// Mock batch event handler implementation
class BatchTestEventHandler extends TestEventHandler implements IBatchEventHandler<TestEvent, TestEventResult> {
  async handleBatch(
    events: TestEvent[],
    context?: EventHandlerContext,
    options?: EventHandlerOptions
  ): Promise<IEventResponse<TestEventResult>[]> {
    const results: IEventResponse<TestEventResult>[] = [];
    
    for (const event of events) {
      results.push(await this.handle(event, context, options));
    }
    
    return results;
  }

  getMaxBatchSize(): number {
    return 10;
  }
}

// Mock DLQ event handler implementation
class DLQTestEventHandler extends TestEventHandler implements IDLQEventHandler<TestEvent, TestEventResult> {
  async handleDeadLetter(
    event: TestEvent,
    failureReason: string,
    failureCount: number,
    context?: EventHandlerContext,
    options?: EventHandlerOptions
  ): Promise<IEventResponse<TestEventResult>> {
    // Special handling for dead-letter events
    const result: TestEventResult = {
      processed: true,
      value: event.payload.value, // No multiplication for DLQ events
    };

    return createSuccessResponse(
      event.eventId,
      event.eventType,
      result,
      {
        processingTimeMs: 5,
        correlationId: context?.correlationId,
        serviceId: context?.serviceId || 'dlq-service',
        retryCount: failureCount,
      }
    );
  }

  async shouldRetryDeadLetter(
    event: TestEvent,
    failureReason: string,
    failureCount: number
  ): Promise<boolean> {
    // Only retry up to 3 times
    return failureCount < 3;
  }

  getRetryDelayMs(failureCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.pow(2, failureCount) * 1000;
  }
}

// Mock health-specific event handler for testing type safety
class HealthMetricEventHandler implements IEventHandler<HealthMetricEvent> {
  async handle(
    event: HealthMetricEvent,
    context?: EventHandlerContext,
    options?: EventHandlerOptions
  ): Promise<IEventResponse<void>> {
    // Simple processing logic for health metrics
    return createSuccessResponse(
      event.eventId,
      event.eventType,
      undefined,
      {
        processingTimeMs: 15,
        correlationId: context?.correlationId,
        serviceId: 'health-service',
      }
    );
  }

  async canHandle(event: any, context?: EventHandlerContext): Promise<ValidationResult> {
    if (
      event.eventType === 'HEALTH_METRIC_RECORDED' &&
      event.payload?.userId &&
      event.payload?.metricType &&
      typeof event.payload.value === 'number' &&
      event.payload?.unit
    ) {
      return validResult;
    }
    return invalidResult;
  }

  getEventType(): string {
    return 'HEALTH_METRIC_RECORDED';
  }
}

// Mock error-throwing handler for testing error handling
class ErrorThrowingHandler implements IEventHandler<TestEvent> {
  async handle(
    event: TestEvent,
    context?: EventHandlerContext,
    options?: EventHandlerOptions
  ): Promise<IEventResponse<any>> {
    throw new Error('Simulated processing error');
  }

  async canHandle(event: any): Promise<ValidationResult> {
    return validResult; // Always says it can handle the event
  }

  getEventType(): string {
    return 'TEST_EVENT';
  }
}

describe('Event Handler Interface', () => {
  // Test data
  const testEvent: TestEvent = {
    eventId: 'test-123',
    eventType: 'TEST_EVENT',
    payload: {
      data: 'test data',
      value: 10,
    },
  };

  const invalidTestEvent = {
    eventId: 'invalid-123',
    eventType: 'UNKNOWN_EVENT',
    payload: {
      foo: 'bar',
    },
  };

  const healthEvent: HealthMetricEvent = {
    eventId: 'health-123',
    eventType: 'HEALTH_METRIC_RECORDED',
    payload: {
      userId: 'user-123',
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: new Date().toISOString(),
    },
  };

  // Handler instances
  let testHandler: TestEventHandler;
  let batchHandler: BatchTestEventHandler;
  let dlqHandler: DLQTestEventHandler;
  let healthHandler: HealthMetricEventHandler;
  let errorHandler: ErrorThrowingHandler;

  beforeEach(() => {
    testHandler = new TestEventHandler();
    batchHandler = new BatchTestEventHandler();
    dlqHandler = new DLQTestEventHandler();
    healthHandler = new HealthMetricEventHandler();
    errorHandler = new ErrorThrowingHandler();
  });

  describe('Basic Handler Contract', () => {
    it('should implement all required methods', () => {
      expect(testHandler.handle).toBeDefined();
      expect(testHandler.canHandle).toBeDefined();
      expect(testHandler.getEventType).toBeDefined();
      
      expect(typeof testHandler.handle).toBe('function');
      expect(typeof testHandler.canHandle).toBe('function');
      expect(typeof testHandler.getEventType).toBe('function');
    });

    it('should return the correct event type', () => {
      expect(testHandler.getEventType()).toBe('TEST_EVENT');
      expect(healthHandler.getEventType()).toBe('HEALTH_METRIC_RECORDED');
    });
  });

  describe('Event Type Validation', () => {
    it('should correctly identify events it can handle', async () => {
      const result = await testHandler.canHandle(testEvent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should correctly identify events it cannot handle', async () => {
      const result = await testHandler.canHandle(invalidTestEvent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_PAYLOAD');
    });

    it('should validate type-specific events correctly', async () => {
      // Health handler should handle health events
      const healthResult = await healthHandler.canHandle(healthEvent);
      expect(healthResult.isValid).toBe(true);
      
      // Health handler should not handle test events
      const testResult = await healthHandler.canHandle(testEvent);
      expect(testResult.isValid).toBe(false);
      
      // Test handler should not handle health events
      const crossResult = await testHandler.canHandle(healthEvent);
      expect(crossResult.isValid).toBe(false);
    });
  });

  describe('Event Processing', () => {
    it('should process events and return success responses', async () => {
      const context: EventHandlerContext = {
        correlationId: 'corr-123',
        serviceId: 'test-service',
      };
      
      const response = await testHandler.handle(testEvent, context);
      
      expect(response.success).toBe(true);
      expect(response.eventId).toBe(testEvent.eventId);
      expect(response.eventType).toBe(testEvent.eventType);
      expect(response.data).toBeDefined();
      expect(response.data?.processed).toBe(true);
      expect(response.data?.value).toBe(testEvent.payload.value * 2);
      expect(response.metadata?.correlationId).toBe(context.correlationId);
      expect(response.metadata?.serviceId).toBe(context.serviceId);
    });

    it('should handle type-specific events correctly', async () => {
      const response = await healthHandler.handle(healthEvent);
      
      expect(response.success).toBe(true);
      expect(response.eventId).toBe(healthEvent.eventId);
      expect(response.eventType).toBe(healthEvent.eventType);
      expect(response.data).toBeUndefined(); // Health handler doesn't return data
      expect(response.metadata?.serviceId).toBe('health-service');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors and return error responses', async () => {
      try {
        const response = await errorHandler.handle(testEvent);
        
        // If we get here, the handler didn't throw but returned an error response
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
        expect(response.error?.code).toBe('PROCESSING_ERROR');
        expect(response.error?.message).toBe('Simulated processing error');
      } catch (error) {
        // The test should not reach here if the handler properly handles errors
        fail('Handler should not throw errors but return error responses');
      }
    });
  });

  describe('Batch Event Handler', () => {
    it('should implement batch handler interface correctly', () => {
      expect(batchHandler.handleBatch).toBeDefined();
      expect(batchHandler.getMaxBatchSize).toBeDefined();
      expect(typeof batchHandler.handleBatch).toBe('function');
      expect(typeof batchHandler.getMaxBatchSize).toBe('function');
    });

    it('should process batches of events', async () => {
      const events = [
        testEvent,
        {
          ...testEvent,
          eventId: 'test-456',
          payload: { ...testEvent.payload, value: 20 },
        },
      ];
      
      const responses = await batchHandler.handleBatch(events);
      
      expect(responses).toHaveLength(events.length);
      expect(responses[0].success).toBe(true);
      expect(responses[0].data?.value).toBe(events[0].payload.value * 2);
      expect(responses[1].success).toBe(true);
      expect(responses[1].data?.value).toBe(events[1].payload.value * 2);
    });

    it('should return the correct max batch size', () => {
      expect(batchHandler.getMaxBatchSize()).toBe(10);
    });
  });

  describe('DLQ Event Handler', () => {
    it('should implement DLQ handler interface correctly', () => {
      expect(dlqHandler.handleDeadLetter).toBeDefined();
      expect(dlqHandler.shouldRetryDeadLetter).toBeDefined();
      expect(dlqHandler.getRetryDelayMs).toBeDefined();
      expect(typeof dlqHandler.handleDeadLetter).toBe('function');
      expect(typeof dlqHandler.shouldRetryDeadLetter).toBe('function');
      expect(typeof dlqHandler.getRetryDelayMs).toBe('function');
    });

    it('should process dead-letter events', async () => {
      const failureReason = 'Previous processing attempt failed';
      const failureCount = 2;
      
      const response = await dlqHandler.handleDeadLetter(
        testEvent,
        failureReason,
        failureCount
      );
      
      expect(response.success).toBe(true);
      expect(response.data?.processed).toBe(true);
      expect(response.data?.value).toBe(testEvent.payload.value); // No multiplication for DLQ
      expect(response.metadata?.retryCount).toBe(failureCount);
    });

    it('should determine if dead-letter events should be retried', async () => {
      // Should retry when count is below threshold
      let shouldRetry = await dlqHandler.shouldRetryDeadLetter(
        testEvent,
        'Error',
        2
      );
      expect(shouldRetry).toBe(true);
      
      // Should not retry when count is at or above threshold
      shouldRetry = await dlqHandler.shouldRetryDeadLetter(
        testEvent,
        'Error',
        3
      );
      expect(shouldRetry).toBe(false);
    });

    it('should calculate correct retry delays', () => {
      expect(dlqHandler.getRetryDelayMs(0)).toBe(1000);  // 2^0 * 1000 = 1000ms
      expect(dlqHandler.getRetryDelayMs(1)).toBe(2000);  // 2^1 * 1000 = 2000ms
      expect(dlqHandler.getRetryDelayMs(2)).toBe(4000);  // 2^2 * 1000 = 4000ms
      expect(dlqHandler.getRetryDelayMs(3)).toBe(8000);  // 2^3 * 1000 = 8000ms
    });
  });
});
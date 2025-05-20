import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

// Import test fixtures
import { 
  validHealthEvent,
  validCareEvent,
  validPlanEvent,
  invalidEvent
} from '../dto/mocks';

// Mock implementations
class MockSuccessHandler implements IEventHandler<HealthEvent> {
  public handle = jest.fn().mockImplementation(async (event: HealthEvent) => {
    return {
      success: true,
      eventId: event.eventId,
      message: 'Event processed successfully',
      metadata: {
        processingTimeMs: 100,
        handlerName: this.constructor.name
      }
    };
  });

  public canHandle = jest.fn().mockImplementation((event: BaseEvent) => {
    return event.type === 'HEALTH_METRIC_RECORDED';
  });

  public getEventType = jest.fn().mockReturnValue('HEALTH_METRIC_RECORDED');
}

class MockFailureHandler implements IEventHandler<BaseEvent> {
  public handle = jest.fn().mockImplementation(async () => {
    throw new Error('Processing failed');
  });

  public canHandle = jest.fn().mockReturnValue(true);

  public getEventType = jest.fn().mockReturnValue('ANY');
}

class MockRetryableHandler implements IEventHandler<BaseEvent> {
  private retryCount = 0;
  private maxRetries = 3;

  public handle = jest.fn().mockImplementation(async (event: BaseEvent) => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      return {
        success: false,
        eventId: event.eventId,
        error: {
          code: 'TEMPORARY_FAILURE',
          message: 'Temporary failure, can retry',
          retryable: true
        },
        metadata: {
          retryCount: this.retryCount,
          maxRetries: this.maxRetries
        }
      };
    }
    
    return {
      success: true,
      eventId: event.eventId,
      message: 'Event processed successfully after retries',
      metadata: {
        retryCount: this.retryCount,
        maxRetries: this.maxRetries
      }
    };
  });

  public canHandle = jest.fn().mockReturnValue(true);

  public getEventType = jest.fn().mockReturnValue('RETRYABLE');

  public reset(): void {
    this.retryCount = 0;
  }
}

class MockJourneySpecificHandler implements IEventHandler<CareEvent> {
  public handle = jest.fn().mockImplementation(async (event: CareEvent) => {
    // Type-safe access to care-specific properties
    const appointmentId = event.payload.appointmentId;
    
    return {
      success: true,
      eventId: event.eventId,
      message: `Processed appointment ${appointmentId}`,
      metadata: {
        journey: 'care',
        appointmentId
      }
    };
  });

  public canHandle = jest.fn().mockImplementation((event: BaseEvent) => {
    return event.type === 'APPOINTMENT_BOOKED' && event.journey === 'care';
  });

  public getEventType = jest.fn().mockReturnValue('APPOINTMENT_BOOKED');
}

describe('IEventHandler Interface', () => {
  let successHandler: MockSuccessHandler;
  let failureHandler: MockFailureHandler;
  let retryableHandler: MockRetryableHandler;
  let journeyHandler: MockJourneySpecificHandler;

  beforeEach(() => {
    successHandler = new MockSuccessHandler();
    failureHandler = new MockFailureHandler();
    retryableHandler = new MockRetryableHandler();
    journeyHandler = new MockJourneySpecificHandler();
    
    // Reset mocks before each test
    jest.clearAllMocks();
    retryableHandler.reset();
  });

  describe('Interface Contract', () => {
    it('should require handle, canHandle, and getEventType methods', () => {
      // Verify that the handler implements all required methods
      expect(successHandler.handle).toBeDefined();
      expect(successHandler.canHandle).toBeDefined();
      expect(successHandler.getEventType).toBeDefined();
      
      // Verify method types
      expect(typeof successHandler.handle).toBe('function');
      expect(typeof successHandler.canHandle).toBe('function');
      expect(typeof successHandler.getEventType).toBe('function');
    });

    it('should return a Promise<EventResponse> from handle method', async () => {
      const response = await successHandler.handle(validHealthEvent);
      
      // Verify response structure
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('eventId');
      expect(response.success).toBe(true);
      expect(response.eventId).toBe(validHealthEvent.eventId);
    });

    it('should return a boolean from canHandle method', () => {
      const result = successHandler.canHandle(validHealthEvent);
      
      expect(typeof result).toBe('boolean');
    });

    it('should return a string from getEventType method', () => {
      const eventType = successHandler.getEventType();
      
      expect(typeof eventType).toBe('string');
      expect(eventType).toBe('HEALTH_METRIC_RECORDED');
    });
  });

  describe('Type Safety', () => {
    it('should handle events with correct type parameters', async () => {
      // Health event handler should process health events
      const healthResponse = await successHandler.handle(validHealthEvent);
      expect(healthResponse.success).toBe(true);
      
      // Care event handler should process care events
      const careResponse = await journeyHandler.handle(validCareEvent);
      expect(careResponse.success).toBe(true);
      expect(careResponse.metadata).toHaveProperty('appointmentId');
    });

    it('should enforce type safety for journey-specific event properties', async () => {
      // This test verifies that TypeScript correctly enforces type safety
      // The test itself will compile only if the types are correct
      const response = await journeyHandler.handle(validCareEvent);
      
      // Care-specific properties should be accessible in a type-safe way
      expect(response.metadata.appointmentId).toBeDefined();
      expect(response.message).toContain('Processed appointment');
    });
  });

  describe('Handler Capability Detection', () => {
    it('should correctly identify events it can handle', () => {
      // Health handler should handle health events
      expect(successHandler.canHandle(validHealthEvent)).toBe(true);
      
      // Health handler should not handle care events
      expect(successHandler.canHandle(validCareEvent)).toBe(false);
      
      // Care handler should handle care events
      expect(journeyHandler.canHandle(validCareEvent)).toBe(true);
      
      // Care handler should not handle plan events
      expect(journeyHandler.canHandle(validPlanEvent)).toBe(false);
    });

    it('should check both event type and journey for capability detection', () => {
      // Create a modified event with correct type but wrong journey
      const wrongJourneyEvent = {
        ...validCareEvent,
        journey: 'health' // Changed from 'care'
      };
      
      // Handler should reject event with wrong journey
      expect(journeyHandler.canHandle(wrongJourneyEvent)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Using try/catch to handle the thrown error
      try {
        await failureHandler.handle(validHealthEvent);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Processing failed');
      }
    });

    it('should support retryable errors', async () => {
      // First attempt - should fail but be retryable
      let response = await retryableHandler.handle(validHealthEvent);
      expect(response.success).toBe(false);
      expect(response.error.retryable).toBe(true);
      expect(response.metadata.retryCount).toBe(1);
      
      // Second attempt - should fail but be retryable
      response = await retryableHandler.handle(validHealthEvent);
      expect(response.success).toBe(false);
      expect(response.error.retryable).toBe(true);
      expect(response.metadata.retryCount).toBe(2);
      
      // Third attempt - should fail but be retryable
      response = await retryableHandler.handle(validHealthEvent);
      expect(response.success).toBe(false);
      expect(response.error.retryable).toBe(true);
      expect(response.metadata.retryCount).toBe(3);
      
      // Fourth attempt - should succeed after max retries
      response = await retryableHandler.handle(validHealthEvent);
      expect(response.success).toBe(true);
      expect(response.message).toContain('after retries');
      expect(response.metadata.retryCount).toBe(3);
    });

    it('should provide detailed error information in the response', async () => {
      // First attempt with retryable handler
      const response = await retryableHandler.handle(validHealthEvent);
      
      // Verify error structure
      expect(response.error).toBeDefined();
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('message');
      expect(response.error).toHaveProperty('retryable');
      
      // Verify error details
      expect(response.error.code).toBe('TEMPORARY_FAILURE');
      expect(typeof response.error.message).toBe('string');
      expect(response.error.retryable).toBe(true);
    });
  });

  describe('Response Generation', () => {
    it('should generate consistent response structure', async () => {
      const response = await successHandler.handle(validHealthEvent);
      
      // Verify response has all required properties
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('eventId');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('metadata');
    });

    it('should include handler-specific metadata in response', async () => {
      const response = await successHandler.handle(validHealthEvent);
      
      // Verify metadata contains handler-specific information
      expect(response.metadata).toHaveProperty('processingTimeMs');
      expect(response.metadata).toHaveProperty('handlerName');
      expect(response.metadata.handlerName).toBe('MockSuccessHandler');
    });

    it('should include original eventId in response', async () => {
      const customEvent = {
        ...validHealthEvent,
        eventId: uuidv4() // Generate a unique ID
      };
      
      const response = await successHandler.handle(customEvent);
      
      // Verify eventId is preserved
      expect(response.eventId).toBe(customEvent.eventId);
    });
  });

  describe('Invalid Event Handling', () => {
    it('should reject invalid events through canHandle', () => {
      // Health handler should reject invalid events
      expect(successHandler.canHandle(invalidEvent)).toBe(false);
    });

    it('should provide appropriate error response for invalid events', async () => {
      // Create a handler that accepts invalid events but returns error
      const invalidEventHandler = {
        handle: async (event: BaseEvent) => {
          if (!event.type || !event.eventId) {
            return {
              success: false,
              eventId: event.eventId || 'unknown',
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid event structure',
                retryable: false
              },
              metadata: {
                validationErrors: ['Missing required fields']
              }
            };
          }
          return { success: true, eventId: event.eventId, message: 'OK', metadata: {} };
        },
        canHandle: () => true,
        getEventType: () => 'ANY'
      };
      
      const response = await invalidEventHandler.handle(invalidEvent);
      
      // Verify error response for invalid event
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.retryable).toBe(false);
      expect(response.metadata.validationErrors).toContain('Missing required fields');
    });
  });
});
/**
 * @file event-response.interface.spec.ts
 * @description Unit tests for the EventResponse interface that standardizes
 * the structure for event processing results across all services.
 */

import { EventResponse, EventErrorDetails, EventResponseMetadata } from '../../../src/interfaces/event-response.interface';
import { ERROR_CODES, ERROR_MESSAGES, ERROR_SEVERITY } from '../../../src/constants/errors.constants';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';

describe('EventResponse Interface', () => {
  describe('Structure Validation', () => {
    it('should create a successful response with data', () => {
      const metadata: EventResponseMetadata = {
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        processingTimeMs: 42,
        source: 'health-service',
        destination: 'gamification-engine'
      };

      const response: EventResponse<{ userId: string }> = {
        success: true,
        data: { userId: '123456' },
        metadata
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.userId).toBe('123456');
      expect(response.error).toBeUndefined();
      expect(response.metadata).toBeDefined();
      expect(response.metadata.correlationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should create a failed response with error details', () => {
      const metadata: EventResponseMetadata = {
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        processingTimeMs: 42,
        source: 'health-service',
        destination: 'gamification-engine'
      };

      const errorDetails: EventErrorDetails = {
        code: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED],
        retryable: false,
        context: {
          validationErrors: ['Field userId is required']
        }
      };

      const response: EventResponse = {
        success: false,
        error: errorDetails,
        metadata
      };

      expect(response.success).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      expect(response.error?.message).toBe(ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED]);
      expect(response.error?.retryable).toBe(false);
      expect(response.metadata).toBeDefined();
    });

    it('should enforce the required properties', () => {
      // @ts-expect-error - Testing missing required property 'success'
      const invalidResponse1: EventResponse = {
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date()
        }
      };

      // @ts-expect-error - Testing missing required property 'metadata'
      const invalidResponse2: EventResponse = {
        success: true,
        data: { userId: '123456' }
      };

      // These assertions will not be reached if TypeScript correctly flags the errors,
      // but they're included for runtime validation in case the types are bypassed
      expect(() => validateEventResponse(invalidResponse1)).toThrow();
      expect(() => validateEventResponse(invalidResponse2)).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should include proper error codes from the constants', () => {
      const response: EventResponse = {
        success: false,
        error: {
          code: ERROR_CODES.CONSUMER_PROCESSING_FAILED,
          message: ERROR_MESSAGES[ERROR_CODES.CONSUMER_PROCESSING_FAILED],
          retryable: true,
          stack: 'Error stack trace'
        },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date(),
          processingTimeMs: 42,
          retryCount: 0,
          source: 'health-service',
          destination: 'gamification-engine'
        }
      };

      expect(response.error?.code).toBe(ERROR_CODES.CONSUMER_PROCESSING_FAILED);
      expect(response.error?.message).toBe(ERROR_MESSAGES[ERROR_CODES.CONSUMER_PROCESSING_FAILED]);
      expect(ERROR_SEVERITY[response.error?.code as keyof typeof ERROR_SEVERITY]).toBeDefined();
    });

    it('should indicate whether an error is retryable', () => {
      // Non-retryable error (validation failure)
      const nonRetryableResponse: EventResponse = {
        success: false,
        error: {
          code: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED],
          retryable: false
        },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date()
        }
      };

      // Retryable error (connection issue)
      const retryableResponse: EventResponse = {
        success: false,
        error: {
          code: ERROR_CODES.CONSUMER_CONNECTION_FAILED,
          message: ERROR_MESSAGES[ERROR_CODES.CONSUMER_CONNECTION_FAILED],
          retryable: true
        },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date()
        }
      };

      expect(nonRetryableResponse.error?.retryable).toBe(false);
      expect(retryableResponse.error?.retryable).toBe(true);
    });

    it('should include detailed context in error details', () => {
      const response: EventResponse = {
        success: false,
        error: {
          code: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED],
          retryable: false,
          context: {
            validationErrors: [
              { field: 'userId', message: 'Field is required' },
              { field: 'eventType', message: 'Invalid event type' }
            ],
            receivedData: { eventType: 'INVALID_TYPE' }
          }
        },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date()
        }
      };

      expect(response.error?.context).toBeDefined();
      expect(response.error?.context?.validationErrors).toHaveLength(2);
      expect(response.error?.context?.validationErrors[0].field).toBe('userId');
      expect(response.error?.context?.receivedData.eventType).toBe('INVALID_TYPE');
    });

    it('should handle retry exhaustion errors', () => {
      const response: EventResponse = {
        success: false,
        error: {
          code: ERROR_CODES.RETRY_EXHAUSTED,
          message: ERROR_MESSAGES[ERROR_CODES.RETRY_EXHAUSTED],
          retryable: false, // No longer retryable after exhaustion
          context: {
            maxRetries: 3,
            originalError: {
              code: ERROR_CODES.CONSUMER_CONNECTION_FAILED,
              message: ERROR_MESSAGES[ERROR_CODES.CONSUMER_CONNECTION_FAILED]
            }
          }
        },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date(),
          retryCount: 3 // Indicates this was the final retry
        }
      };

      expect(response.error?.code).toBe(ERROR_CODES.RETRY_EXHAUSTED);
      expect(response.error?.retryable).toBe(false);
      expect(response.metadata.retryCount).toBe(3);
      expect(response.error?.context?.originalError.code).toBe(ERROR_CODES.CONSUMER_CONNECTION_FAILED);
    });
  });

  describe('Metadata Handling', () => {
    it('should include correlation ID for distributed tracing', () => {
      const correlationId = '550e8400-e29b-41d4-a716-446655440000';
      const response: EventResponse = {
        success: true,
        data: { processed: true },
        metadata: {
          correlationId,
          timestamp: new Date()
        }
      };

      expect(response.metadata.correlationId).toBe(correlationId);
    });

    it('should track processing time for performance monitoring', () => {
      const response: EventResponse = {
        success: true,
        data: { processed: true },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date(),
          processingTimeMs: 42
        }
      };

      expect(response.metadata.processingTimeMs).toBe(42);
    });

    it('should track retry count for retry mechanism', () => {
      const response: EventResponse = {
        success: true,
        data: { processed: true },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date(),
          retryCount: 2
        }
      };

      expect(response.metadata.retryCount).toBe(2);
    });

    it('should include source and destination for message routing', () => {
      const response: EventResponse = {
        success: true,
        data: { processed: true },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date(),
          source: 'health-service',
          destination: 'gamification-engine'
        }
      };

      expect(response.metadata.source).toBe('health-service');
      expect(response.metadata.destination).toBe('gamification-engine');
    });

    it('should be compatible with EventMetadataDto', () => {
      // Create an EventMetadataDto instance
      const eventMetadata = new EventMetadataDto({
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        origin: {
          service: 'health-service',
          component: 'metric-processor'
        }
      });

      // Convert to EventResponseMetadata
      const responseMetadata: EventResponseMetadata = {
        correlationId: eventMetadata.correlationId,
        timestamp: eventMetadata.timestamp,
        source: eventMetadata.origin?.service,
        processingTimeMs: 42,
        retryCount: 0
      };

      const response: EventResponse = {
        success: true,
        data: { processed: true },
        metadata: responseMetadata
      };

      expect(response.metadata.correlationId).toBe(eventMetadata.correlationId);
      expect(response.metadata.source).toBe(eventMetadata.origin?.service);
    });
  });

  describe('Serialization', () => {
    it('should be serializable to JSON', () => {
      const response: EventResponse = {
        success: true,
        data: { userId: '123456', metrics: [{ type: 'HEART_RATE', value: 72 }] },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date(),
          processingTimeMs: 42
        }
      };

      const serialized = JSON.stringify(response);
      expect(serialized).toBeTruthy();
      expect(typeof serialized).toBe('string');

      const deserialized = JSON.parse(serialized);
      expect(deserialized.success).toBe(true);
      expect(deserialized.data.userId).toBe('123456');
      expect(deserialized.data.metrics[0].type).toBe('HEART_RATE');
      expect(deserialized.metadata.correlationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle Date serialization/deserialization', () => {
      const now = new Date();
      const response: EventResponse = {
        success: true,
        data: { processed: true },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: now
        }
      };

      const serialized = JSON.stringify(response);
      const deserialized = JSON.parse(serialized);

      // Date is serialized as a string
      expect(typeof deserialized.metadata.timestamp).toBe('string');
      
      // Convert back to Date for comparison
      const deserializedDate = new Date(deserialized.metadata.timestamp);
      expect(deserializedDate.getTime()).toBe(now.getTime());
    });

    it('should handle error details serialization', () => {
      const response: EventResponse = {
        success: false,
        error: {
          code: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED],
          retryable: false,
          stack: 'Error stack trace',
          context: {
            validationErrors: ['Field userId is required']
          }
        },
        metadata: {
          correlationId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date()
        }
      };

      const serialized = JSON.stringify(response);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.success).toBe(false);
      expect(deserialized.error.code).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      expect(deserialized.error.message).toBe(ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED]);
      expect(deserialized.error.retryable).toBe(false);
      expect(deserialized.error.stack).toBe('Error stack trace');
      expect(deserialized.error.context.validationErrors[0]).toBe('Field userId is required');
    });
  });
});

/**
 * Helper function to validate an EventResponse at runtime.
 * This is used in tests to verify that the interface constraints are enforced.
 */
function validateEventResponse(response: EventResponse): void {
  if (response.success === undefined) {
    throw new Error('EventResponse must have a success property');
  }
  
  if (!response.metadata) {
    throw new Error('EventResponse must have a metadata property');
  }
  
  if (response.success === false && !response.error) {
    throw new Error('Failed EventResponse must have an error property');
  }
  
  if (response.success === true && response.error) {
    throw new Error('Successful EventResponse should not have an error property');
  }
}
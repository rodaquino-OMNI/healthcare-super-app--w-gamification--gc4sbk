/**
 * @file event-response.interface.spec.ts
 * @description Unit tests for event response interfaces verifying the standardized structure
 * for event processing results. Tests validate proper handling of success/failure statuses,
 * error details, and result metadata.
 */

import {
  IEventResponse,
  EventErrorDetails,
  EventResponseMetadata,
  createSuccessResponse,
  createErrorResponse,
} from '../../../src/interfaces/event-response.interface';
import { EventErrorCategory, EventProcessingStage } from '../../../src/errors/event-errors';

describe('EventResponse Interface', () => {
  // Test data
  const testEventId = '550e8400-e29b-41d4-a716-446655440000';
  const testEventType = 'TEST_EVENT';
  const testData = { key: 'value', count: 42 };
  const testMetadata: EventResponseMetadata = {
    processingTimeMs: 150,
    correlationId: 'corr-123456',
    serviceId: 'test-service',
    retryCount: 0,
  };
  const testError: EventErrorDetails = {
    code: 'TEST_ERROR_001',
    message: 'Test error message',
    details: {
      category: EventErrorCategory.TRANSIENT,
      processingStage: EventProcessingStage.PROCESSING,
      additionalInfo: 'Some additional error context',
    },
    retryable: true,
    retryDelayMs: 5000,
  };

  describe('Interface Structure Compliance', () => {
    it('should validate a successful response structure', () => {
      const response: IEventResponse<typeof testData> = {
        success: true,
        eventId: testEventId,
        eventType: testEventType,
        data: testData,
        metadata: testMetadata,
      };

      // Verify required properties
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('eventId', testEventId);
      expect(response).toHaveProperty('eventType', testEventType);
      
      // Verify optional properties
      expect(response).toHaveProperty('data', testData);
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toEqual(expect.objectContaining(testMetadata));
      
      // Verify error is not present in success response
      expect(response.error).toBeUndefined();
    });

    it('should validate a failed response structure', () => {
      const response: IEventResponse = {
        success: false,
        eventId: testEventId,
        eventType: testEventType,
        error: testError,
        metadata: testMetadata,
      };

      // Verify required properties
      expect(response).toHaveProperty('success', false);
      expect(response).toHaveProperty('eventId', testEventId);
      expect(response).toHaveProperty('eventType', testEventType);
      
      // Verify error details
      expect(response).toHaveProperty('error');
      expect(response.error).toEqual(expect.objectContaining(testError));
      
      // Verify metadata
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toEqual(expect.objectContaining(testMetadata));
      
      // Verify data is not present in error response
      expect(response.data).toBeUndefined();
    });

    it('should support generic type parameter for data', () => {
      // String data
      const stringResponse: IEventResponse<string> = {
        success: true,
        eventId: testEventId,
        eventType: testEventType,
        data: 'string data',
      };
      expect(typeof stringResponse.data).toBe('string');

      // Number data
      const numberResponse: IEventResponse<number> = {
        success: true,
        eventId: testEventId,
        eventType: testEventType,
        data: 42,
      };
      expect(typeof numberResponse.data).toBe('number');

      // Object data
      const objectResponse: IEventResponse<{id: number, name: string}> = {
        success: true,
        eventId: testEventId,
        eventType: testEventType,
        data: {id: 1, name: 'test'},
      };
      expect(objectResponse.data).toHaveProperty('id');
      expect(objectResponse.data).toHaveProperty('name');

      // Array data
      const arrayResponse: IEventResponse<string[]> = {
        success: true,
        eventId: testEventId,
        eventType: testEventType,
        data: ['a', 'b', 'c'],
      };
      expect(Array.isArray(arrayResponse.data)).toBe(true);
    });
  });

  describe('Error Information Formatting', () => {
    it('should validate error details structure', () => {
      const errorDetails: EventErrorDetails = {
        code: 'ERROR_CODE_001',
        message: 'Detailed error message',
        details: {
          category: EventErrorCategory.PERMANENT,
          processingStage: EventProcessingStage.VALIDATION,
          fieldErrors: [
            { field: 'username', message: 'Username is required' },
            { field: 'email', message: 'Invalid email format' },
          ],
        },
        stack: 'Error stack trace...',
        retryable: false,
      };

      // Create a failed response with the error details
      const response: IEventResponse = {
        success: false,
        eventId: testEventId,
        eventType: testEventType,
        error: errorDetails,
      };

      // Verify error structure
      expect(response.error).toHaveProperty('code', 'ERROR_CODE_001');
      expect(response.error).toHaveProperty('message', 'Detailed error message');
      expect(response.error).toHaveProperty('details');
      expect(response.error).toHaveProperty('stack');
      expect(response.error).toHaveProperty('retryable', false);
      
      // Verify error details
      expect(response.error.details).toHaveProperty('category', EventErrorCategory.PERMANENT);
      expect(response.error.details).toHaveProperty('processingStage', EventProcessingStage.VALIDATION);
      expect(response.error.details).toHaveProperty('fieldErrors');
      expect(response.error.details.fieldErrors).toHaveLength(2);
    });

    it('should handle retryable errors with retry delay', () => {
      const retryableError: EventErrorDetails = {
        code: 'TRANSIENT_ERROR_001',
        message: 'Temporary service unavailable',
        details: {
          category: EventErrorCategory.TRANSIENT,
          processingStage: EventProcessingStage.PROCESSING,
        },
        retryable: true,
        retryDelayMs: 3000,
      };

      const response: IEventResponse = {
        success: false,
        eventId: testEventId,
        eventType: testEventType,
        error: retryableError,
      };

      // Verify retryable properties
      expect(response.error).toHaveProperty('retryable', true);
      expect(response.error).toHaveProperty('retryDelayMs', 3000);
      expect(response.error.details).toHaveProperty('category', EventErrorCategory.TRANSIENT);
    });

    it('should handle different error categories', () => {
      // Test each error category
      const categories = [
        EventErrorCategory.TRANSIENT,
        EventErrorCategory.PERMANENT,
        EventErrorCategory.RETRIABLE,
        EventErrorCategory.MANUAL,
      ];

      categories.forEach(category => {
        const error: EventErrorDetails = {
          code: `${category.toUpperCase()}_ERROR`,
          message: `${category} error message`,
          details: {
            category,
            processingStage: EventProcessingStage.PROCESSING,
          },
          retryable: category === EventErrorCategory.TRANSIENT || category === EventErrorCategory.RETRIABLE,
        };

        const response: IEventResponse = {
          success: false,
          eventId: testEventId,
          eventType: testEventType,
          error,
        };

        expect(response.error.details.category).toBe(category);
        expect(response.error.retryable).toBe(
          category === EventErrorCategory.TRANSIENT || category === EventErrorCategory.RETRIABLE
        );
      });
    });

    it('should handle different processing stages in errors', () => {
      // Test each processing stage
      const stages = [
        EventProcessingStage.VALIDATION,
        EventProcessingStage.DESERIALIZATION,
        EventProcessingStage.PROCESSING,
        EventProcessingStage.PUBLISHING,
        EventProcessingStage.PERSISTENCE,
      ];

      stages.forEach(stage => {
        const error: EventErrorDetails = {
          code: `${stage.toUpperCase()}_ERROR`,
          message: `Error during ${stage}`,
          details: {
            category: EventErrorCategory.PERMANENT,
            processingStage: stage,
          },
        };

        const response: IEventResponse = {
          success: false,
          eventId: testEventId,
          eventType: testEventType,
          error,
        };

        expect(response.error.details.processingStage).toBe(stage);
      });
    });
  });

  describe('Metadata Fields for Tracing and Monitoring', () => {
    it('should validate metadata structure', () => {
      const metadata: EventResponseMetadata = {
        processingTimeMs: 123,
        correlationId: 'corr-id-12345',
        serviceId: 'event-processor-service',
        completedAt: new Date().toISOString(),
        retryCount: 2,
        customField1: 'custom value',
        customField2: 42,
      };

      const response: IEventResponse = {
        success: true,
        eventId: testEventId,
        eventType: testEventType,
        metadata,
      };

      // Verify standard metadata fields
      expect(response.metadata).toHaveProperty('processingTimeMs', 123);
      expect(response.metadata).toHaveProperty('correlationId', 'corr-id-12345');
      expect(response.metadata).toHaveProperty('serviceId', 'event-processor-service');
      expect(response.metadata).toHaveProperty('completedAt');
      expect(response.metadata).toHaveProperty('retryCount', 2);
      
      // Verify custom metadata fields
      expect(response.metadata).toHaveProperty('customField1', 'custom value');
      expect(response.metadata).toHaveProperty('customField2', 42);
    });

    it('should handle processing time tracking', () => {
      // Create metadata with processing time
      const metadata: EventResponseMetadata = {
        processingTimeMs: 50,
        serviceId: 'test-service',
      };

      const response: IEventResponse = {
        success: true,
        eventId: testEventId,
        eventType: testEventType,
        metadata,
      };

      expect(response.metadata).toHaveProperty('processingTimeMs');
      expect(typeof response.metadata.processingTimeMs).toBe('number');
      expect(response.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should track retry attempts in metadata', () => {
      // Test with different retry counts
      [0, 1, 3, 5].forEach(retryCount => {
        const metadata: EventResponseMetadata = {
          retryCount,
          serviceId: 'test-service',
        };

        const response: IEventResponse = {
          success: retryCount < 5, // Simulate failure after max retries
          eventId: testEventId,
          eventType: testEventType,
          metadata,
          error: retryCount >= 5 ? {
            code: 'MAX_RETRIES_EXCEEDED',
            message: 'Maximum retry attempts exceeded',
            retryable: false,
          } : undefined,
        };

        expect(response.metadata).toHaveProperty('retryCount', retryCount);
        expect(response.success).toBe(retryCount < 5);
        
        if (retryCount >= 5) {
          expect(response.error).toBeDefined();
          expect(response.error.code).toBe('MAX_RETRIES_EXCEEDED');
          expect(response.error.retryable).toBe(false);
        } else {
          expect(response.error).toBeUndefined();
        }
      });
    });
  });

  describe('Response Serialization and Deserialization', () => {
    it('should properly serialize and deserialize success responses', () => {
      const originalResponse: IEventResponse<typeof testData> = {
        success: true,
        eventId: testEventId,
        eventType: testEventType,
        data: testData,
        metadata: testMetadata,
      };

      // Serialize to JSON
      const serialized = JSON.stringify(originalResponse);
      
      // Deserialize back to object
      const deserialized = JSON.parse(serialized) as IEventResponse<typeof testData>;

      // Verify structure is preserved
      expect(deserialized.success).toBe(originalResponse.success);
      expect(deserialized.eventId).toBe(originalResponse.eventId);
      expect(deserialized.eventType).toBe(originalResponse.eventType);
      expect(deserialized.data).toEqual(originalResponse.data);
      expect(deserialized.metadata).toEqual(originalResponse.metadata);
    });

    it('should properly serialize and deserialize error responses', () => {
      const originalResponse: IEventResponse = {
        success: false,
        eventId: testEventId,
        eventType: testEventType,
        error: testError,
        metadata: testMetadata,
      };

      // Serialize to JSON
      const serialized = JSON.stringify(originalResponse);
      
      // Deserialize back to object
      const deserialized = JSON.parse(serialized) as IEventResponse;

      // Verify structure is preserved
      expect(deserialized.success).toBe(originalResponse.success);
      expect(deserialized.eventId).toBe(originalResponse.eventId);
      expect(deserialized.eventType).toBe(originalResponse.eventType);
      expect(deserialized.error).toEqual(originalResponse.error);
      expect(deserialized.metadata).toEqual(originalResponse.metadata);
    });

    it('should handle complex nested objects in data and error details', () => {
      const complexData = {
        user: {
          id: 123,
          profile: {
            name: 'Test User',
            preferences: {
              theme: 'dark',
              notifications: ['email', 'push'],
            },
          },
        },
        stats: [1, 2, 3, 4, 5],
        nested: {
          level1: {
            level2: {
              level3: 'deep value',
            },
          },
        },
      };

      const complexError: EventErrorDetails = {
        code: 'COMPLEX_ERROR',
        message: 'Complex error with nested details',
        details: {
          category: EventErrorCategory.PERMANENT,
          processingStage: EventProcessingStage.PROCESSING,
          validationErrors: [
            { field: 'user.profile.name', message: 'Name is required' },
            { field: 'user.profile.preferences.theme', message: 'Invalid theme' },
          ],
          context: {
            request: { path: '/api/users', method: 'POST' },
            response: { status: 400, body: { error: 'Bad Request' } },
          },
        },
        retryable: false,
      };

      const originalResponse: IEventResponse<typeof complexData> = {
        success: false,
        eventId: testEventId,
        eventType: testEventType,
        data: complexData,
        error: complexError,
        metadata: testMetadata,
      };

      // Serialize to JSON
      const serialized = JSON.stringify(originalResponse);
      
      // Deserialize back to object
      const deserialized = JSON.parse(serialized) as IEventResponse<typeof complexData>;

      // Verify complex structures are preserved
      expect(deserialized.data).toEqual(complexData);
      expect(deserialized.error.details).toEqual(complexError.details);
      
      // Verify deep nested properties
      expect(deserialized.data.user.profile.preferences.theme).toBe('dark');
      expect(deserialized.data.nested.level1.level2.level3).toBe('deep value');
      expect(deserialized.error.details.validationErrors[0].field).toBe('user.profile.name');
    });
  });

  describe('Helper Functions', () => {
    it('should create a success response with createSuccessResponse', () => {
      const response = createSuccessResponse(
        testEventId,
        testEventType,
        testData,
        testMetadata
      );

      expect(response.success).toBe(true);
      expect(response.eventId).toBe(testEventId);
      expect(response.eventType).toBe(testEventType);
      expect(response.data).toEqual(testData);
      expect(response.metadata).toEqual(expect.objectContaining(testMetadata));
      expect(response.metadata).toHaveProperty('completedAt');
      expect(response.error).toBeUndefined();
    });

    it('should create an error response with createErrorResponse', () => {
      const response = createErrorResponse(
        testEventId,
        testEventType,
        testError,
        testMetadata
      );

      expect(response.success).toBe(false);
      expect(response.eventId).toBe(testEventId);
      expect(response.eventType).toBe(testEventType);
      expect(response.error).toEqual(testError);
      expect(response.metadata).toEqual(expect.objectContaining(testMetadata));
      expect(response.metadata).toHaveProperty('completedAt');
      expect(response.data).toBeUndefined();
    });

    it('should add completedAt timestamp if not provided', () => {
      const metadataWithoutCompletedAt = { ...testMetadata };
      delete metadataWithoutCompletedAt.completedAt;

      const response = createSuccessResponse(
        testEventId,
        testEventType,
        testData,
        metadataWithoutCompletedAt
      );

      expect(response.metadata).toHaveProperty('completedAt');
      expect(typeof response.metadata.completedAt).toBe('string');
      
      // Verify it's a valid ISO timestamp
      expect(() => new Date(response.metadata.completedAt)).not.toThrow();
    });

    it('should preserve existing completedAt timestamp if provided', () => {
      const specificTimestamp = '2023-01-01T12:00:00.000Z';
      const metadataWithCompletedAt = { 
        ...testMetadata,
        completedAt: specificTimestamp
      };

      const response = createSuccessResponse(
        testEventId,
        testEventType,
        testData,
        metadataWithCompletedAt
      );

      expect(response.metadata.completedAt).toBe(specificTimestamp);
    });

    it('should work with minimal parameters', () => {
      // Success response with only required parameters
      const minimalSuccess = createSuccessResponse(testEventId, testEventType);
      expect(minimalSuccess.success).toBe(true);
      expect(minimalSuccess.eventId).toBe(testEventId);
      expect(minimalSuccess.eventType).toBe(testEventType);
      expect(minimalSuccess.data).toBeUndefined();
      expect(minimalSuccess.metadata).toHaveProperty('completedAt');

      // Error response with only required parameters
      const minimalError = createErrorResponse(testEventId, testEventType, {
        code: 'MINIMAL_ERROR',
        message: 'Minimal error message',
      });
      expect(minimalError.success).toBe(false);
      expect(minimalError.eventId).toBe(testEventId);
      expect(minimalError.eventType).toBe(testEventType);
      expect(minimalError.error.code).toBe('MINIMAL_ERROR');
      expect(minimalError.error.message).toBe('Minimal error message');
      expect(minimalError.metadata).toHaveProperty('completedAt');
    });
  });
});
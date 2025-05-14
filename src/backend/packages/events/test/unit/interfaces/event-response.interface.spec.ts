import { IEventResponse } from '../../../src/interfaces/event-response.interface';

describe('IEventResponse Interface', () => {
  describe('Structure validation', () => {
    it('should create a valid success response', () => {
      // Arrange & Act
      const successResponse: IEventResponse<string> = {
        success: true,
        data: 'Operation completed successfully',
        metadata: {
          correlationId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: new Date().toISOString(),
          processingTime: 42,
          source: 'test-service'
        }
      };

      // Assert
      expect(successResponse).toBeDefined();
      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toBe('Operation completed successfully');
      expect(successResponse.error).toBeUndefined();
      expect(successResponse.metadata).toBeDefined();
      expect(successResponse.metadata?.correlationId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(successResponse.metadata?.source).toBe('test-service');
    });

    it('should create a valid error response', () => {
      // Arrange & Act
      const errorResponse: IEventResponse = {
        success: false,
        error: {
          code: 'EVENT_PROCESSING_FAILED',
          message: 'Failed to process event due to invalid payload',
          details: { field: 'userId', issue: 'missing' }
        },
        metadata: {
          correlationId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: new Date().toISOString(),
          processingTime: 15,
          retryCount: 0,
          source: 'test-service'
        }
      };

      // Assert
      expect(errorResponse).toBeDefined();
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.data).toBeUndefined();
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error?.code).toBe('EVENT_PROCESSING_FAILED');
      expect(errorResponse.error?.message).toBe('Failed to process event due to invalid payload');
      expect(errorResponse.error?.details).toEqual({ field: 'userId', issue: 'missing' });
      expect(errorResponse.metadata?.retryCount).toBe(0);
    });

    it('should allow minimal success response with only required fields', () => {
      // Arrange & Act
      const minimalSuccessResponse: IEventResponse = {
        success: true
      };

      // Assert
      expect(minimalSuccessResponse).toBeDefined();
      expect(minimalSuccessResponse.success).toBe(true);
      expect(minimalSuccessResponse.data).toBeUndefined();
      expect(minimalSuccessResponse.error).toBeUndefined();
      expect(minimalSuccessResponse.metadata).toBeUndefined();
    });

    it('should allow minimal error response with only required fields', () => {
      // Arrange & Act
      const minimalErrorResponse: IEventResponse = {
        success: false,
        error: {
          code: 'GENERIC_ERROR',
          message: 'An error occurred'
        }
      };

      // Assert
      expect(minimalErrorResponse).toBeDefined();
      expect(minimalErrorResponse.success).toBe(false);
      expect(minimalErrorResponse.error?.code).toBe('GENERIC_ERROR');
      expect(minimalErrorResponse.error?.message).toBe('An error occurred');
      expect(minimalErrorResponse.error?.details).toBeUndefined();
      expect(minimalErrorResponse.metadata).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle different error codes', () => {
      // Common error codes that should be supported
      const errorCodes = [
        'VALIDATION_ERROR',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'CONFLICT',
        'INTERNAL_ERROR',
        'SERVICE_UNAVAILABLE',
        'TIMEOUT',
        'INVALID_PAYLOAD',
        'EVENT_PROCESSING_FAILED'
      ];

      // Test each error code
      errorCodes.forEach(code => {
        const response: IEventResponse = {
          success: false,
          error: {
            code,
            message: `Error with code ${code}`
          }
        };

        expect(response.success).toBe(false);
        expect(response.error?.code).toBe(code);
      });
    });

    it('should support detailed error information', () => {
      // Arrange & Act
      const detailedErrorResponse: IEventResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Multiple validation errors occurred',
          details: {
            fields: [
              { name: 'email', error: 'Invalid email format' },
              { name: 'age', error: 'Must be a positive number' }
            ],
            requestId: '12345',
            timestamp: new Date().toISOString()
          }
        }
      };

      // Assert
      expect(detailedErrorResponse.error?.details).toBeDefined();
      expect(detailedErrorResponse.error?.details.fields).toHaveLength(2);
      expect(detailedErrorResponse.error?.details.fields[0].name).toBe('email');
      expect(detailedErrorResponse.error?.details.fields[1].error).toBe('Must be a positive number');
    });

    it('should handle nested error details for complex scenarios', () => {
      // Arrange & Act
      const nestedErrorResponse: IEventResponse = {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Failed to process event chain',
          details: {
            originalError: {
              code: 'DATABASE_ERROR',
              message: 'Connection failed',
              details: {
                sqlState: '08006',
                errorCode: 'CONNECTION_EXCEPTION'
              }
            },
            context: {
              operation: 'saveUserAchievement',
              entityId: '12345'
            }
          }
        }
      };

      // Assert
      expect(nestedErrorResponse.error?.details.originalError).toBeDefined();
      expect(nestedErrorResponse.error?.details.originalError.code).toBe('DATABASE_ERROR');
      expect(nestedErrorResponse.error?.details.originalError.details.sqlState).toBe('08006');
      expect(nestedErrorResponse.error?.details.context.operation).toBe('saveUserAchievement');
    });
  });

  describe('Metadata handling', () => {
    it('should include correlation ID for tracing', () => {
      // Arrange & Act
      const response: IEventResponse = {
        success: true,
        metadata: {
          correlationId: '123e4567-e89b-12d3-a456-426614174000'
        }
      };

      // Assert
      expect(response.metadata?.correlationId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should track processing time for performance monitoring', () => {
      // Arrange & Act
      const response: IEventResponse = {
        success: true,
        metadata: {
          processingTime: 123 // milliseconds
        }
      };

      // Assert
      expect(response.metadata?.processingTime).toBe(123);
    });

    it('should track retry attempts for retry mechanism', () => {
      // Arrange & Act
      const response: IEventResponse = {
        success: false,
        error: {
          code: 'TEMPORARY_FAILURE',
          message: 'Service temporarily unavailable'
        },
        metadata: {
          retryCount: 3,
          nextRetryAt: new Date(Date.now() + 30000).toISOString() // 30 seconds later
        }
      };

      // Assert
      expect(response.metadata?.retryCount).toBe(3);
      expect(response.metadata?.nextRetryAt).toBeDefined();
    });

    it('should include source information for distributed tracing', () => {
      // Arrange & Act
      const response: IEventResponse = {
        success: true,
        metadata: {
          source: 'gamification-engine',
          sourceInstance: 'gamification-engine-pod-1234',
          sourceVersion: '1.2.3'
        }
      };

      // Assert
      expect(response.metadata?.source).toBe('gamification-engine');
      expect(response.metadata?.sourceInstance).toBe('gamification-engine-pod-1234');
      expect(response.metadata?.sourceVersion).toBe('1.2.3');
    });
  });

  describe('Serialization and deserialization', () => {
    it('should properly serialize and deserialize response for transport', () => {
      // Arrange
      const originalResponse: IEventResponse<{ userId: string; points: number }> = {
        success: true,
        data: {
          userId: 'user-123',
          points: 100
        },
        metadata: {
          correlationId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: new Date().toISOString(),
          processingTime: 42
        }
      };

      // Act
      const serialized = JSON.stringify(originalResponse);
      const deserialized = JSON.parse(serialized) as IEventResponse<{ userId: string; points: number }>;

      // Assert
      expect(deserialized.success).toBe(originalResponse.success);
      expect(deserialized.data).toEqual(originalResponse.data);
      expect(deserialized.metadata?.correlationId).toBe(originalResponse.metadata?.correlationId);
      expect(deserialized.metadata?.processingTime).toBe(originalResponse.metadata?.processingTime);
    });

    it('should handle Date objects during serialization', () => {
      // Arrange
      const now = new Date();
      const originalResponse: IEventResponse = {
        success: true,
        data: {
          createdAt: now,
          updatedAt: now
        },
        metadata: {
          timestamp: now.toISOString()
        }
      };

      // Act
      const serialized = JSON.stringify(originalResponse);
      const deserialized = JSON.parse(serialized) as IEventResponse;

      // Assert
      expect(deserialized.data.createdAt).not.toBeInstanceOf(Date); // JSON serializes dates as strings
      expect(typeof deserialized.data.createdAt).toBe('string');
      expect(deserialized.metadata?.timestamp).toBe(now.toISOString());
    });

    it('should handle complex nested objects during serialization', () => {
      // Arrange
      const originalResponse: IEventResponse = {
        success: false,
        error: {
          code: 'COMPLEX_ERROR',
          message: 'Complex error occurred',
          details: {
            errors: [
              { field: 'name', message: 'Required' },
              { field: 'email', message: 'Invalid format' }
            ],
            context: {
              requestPath: '/api/events',
              method: 'POST',
              timestamp: new Date().toISOString()
            }
          }
        }
      };

      // Act
      const serialized = JSON.stringify(originalResponse);
      const deserialized = JSON.parse(serialized) as IEventResponse;

      // Assert
      expect(deserialized.error?.code).toBe('COMPLEX_ERROR');
      expect(deserialized.error?.details.errors).toHaveLength(2);
      expect(deserialized.error?.details.errors[0].field).toBe('name');
      expect(deserialized.error?.details.context.requestPath).toBe('/api/events');
    });
  });

  describe('Type safety', () => {
    it('should support generic type for data property', () => {
      // String data
      const stringResponse: IEventResponse<string> = {
        success: true,
        data: 'Success message'
      };
      expect(typeof stringResponse.data).toBe('string');

      // Number data
      const numberResponse: IEventResponse<number> = {
        success: true,
        data: 42
      };
      expect(typeof numberResponse.data).toBe('number');

      // Object data
      const objectResponse: IEventResponse<{id: string; name: string}> = {
        success: true,
        data: {id: '123', name: 'Test'}
      };
      expect(objectResponse.data?.id).toBe('123');
      expect(objectResponse.data?.name).toBe('Test');

      // Array data
      const arrayResponse: IEventResponse<string[]> = {
        success: true,
        data: ['one', 'two', 'three']
      };
      expect(Array.isArray(arrayResponse.data)).toBe(true);
      expect(arrayResponse.data?.length).toBe(3);
    });

    it('should enforce required properties', () => {
      // @ts-expect-error - success is required
      const invalidResponse: IEventResponse = {};

      // This should compile without errors
      const validResponse: IEventResponse = {
        success: true
      };

      expect(validResponse.success).toBe(true);
    });

    it('should enforce error object structure when present', () => {
      // @ts-expect-error - error.code is required
      const invalidErrorResponse: IEventResponse = {
        success: false,
        error: {
          message: 'Missing code'
        }
      };

      // @ts-expect-error - error.message is required
      const anotherInvalidErrorResponse: IEventResponse = {
        success: false,
        error: {
          code: 'ERROR_CODE'
        }
      };

      // This should compile without errors
      const validErrorResponse: IEventResponse = {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'Error message'
        }
      };

      expect(validErrorResponse.error?.code).toBe('ERROR_CODE');
      expect(validErrorResponse.error?.message).toBe('Error message');
    });
  });
});
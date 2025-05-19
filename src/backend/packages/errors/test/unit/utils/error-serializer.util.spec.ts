import { BaseError } from '../../../src/base';
import { ErrorType } from '../../../src/types';
import { serializeError, deserializeError } from '../../../src/utils/serialize';
import { ValidationError, MissingParameterError } from '../../../src/categories/validation.errors';
import { BusinessError, ResourceNotFoundError } from '../../../src/categories/business.errors';
import { TechnicalError, DatabaseError } from '../../../src/categories/technical.errors';
import { ExternalError, ExternalApiError } from '../../../src/categories/external.errors';

describe('Error Serializer Utility', () => {
  describe('serializeError', () => {
    it('should serialize a standard Error object', () => {
      // Arrange
      const originalError = new Error('Standard error message');
      
      // Act
      const serialized = serializeError(originalError);
      
      // Assert
      expect(serialized).toBeDefined();
      expect(serialized.message).toBe('Standard error message');
      expect(serialized.name).toBe('Error');
      expect(serialized.stack).toBeDefined();
    });
    
    it('should serialize a BaseError with metadata', () => {
      // Arrange
      const metadata = { userId: '123', requestId: 'abc-xyz' };
      const originalError = new BaseError({
        message: 'Base error with metadata',
        type: ErrorType.BUSINESS,
        metadata
      });
      
      // Act
      const serialized = serializeError(originalError);
      
      // Assert
      expect(serialized).toBeDefined();
      expect(serialized.message).toBe('Base error with metadata');
      expect(serialized.name).toBe('BaseError');
      expect(serialized.type).toBe(ErrorType.BUSINESS);
      expect(serialized.metadata).toEqual(metadata);
      expect(serialized.stack).toBeDefined();
    });
    
    it('should serialize specialized error classes', () => {
      // Arrange
      const validationError = new ValidationError('Invalid input');
      const businessError = new BusinessError('Business rule violated');
      const technicalError = new TechnicalError('System failure');
      const externalError = new ExternalError('External system error');
      
      // Act
      const serializedValidation = serializeError(validationError);
      const serializedBusiness = serializeError(businessError);
      const serializedTechnical = serializeError(technicalError);
      const serializedExternal = serializeError(externalError);
      
      // Assert
      expect(serializedValidation.type).toBe(ErrorType.VALIDATION);
      expect(serializedBusiness.type).toBe(ErrorType.BUSINESS);
      expect(serializedTechnical.type).toBe(ErrorType.TECHNICAL);
      expect(serializedExternal.type).toBe(ErrorType.EXTERNAL);
    });
    
    it('should serialize error with cause chain', () => {
      // Arrange
      const rootCause = new Error('Root cause');
      const intermediateError = new BaseError({
        message: 'Intermediate error',
        type: ErrorType.TECHNICAL,
        cause: rootCause
      });
      const topError = new BaseError({
        message: 'Top level error',
        type: ErrorType.BUSINESS,
        cause: intermediateError
      });
      
      // Act
      const serialized = serializeError(topError);
      
      // Assert
      expect(serialized.cause).toBeDefined();
      expect(serialized.cause.message).toBe('Intermediate error');
      expect(serialized.cause.type).toBe(ErrorType.TECHNICAL);
      expect(serialized.cause.cause).toBeDefined();
      expect(serialized.cause.cause.message).toBe('Root cause');
    });
    
    it('should handle circular references in error objects', () => {
      // Arrange
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj; // Create circular reference
      
      const errorWithCircular = new BaseError({
        message: 'Error with circular reference',
        type: ErrorType.TECHNICAL,
        metadata: { circular: circularObj }
      });
      
      // Act
      const serialized = serializeError(errorWithCircular);
      
      // Assert
      expect(serialized).toBeDefined();
      expect(serialized.metadata).toBeDefined();
      // The circular reference should be replaced with a placeholder
      expect(serialized.metadata.circular.self).toMatch(/\[Circular\]/);
    });
  });
  
  describe('deserializeError', () => {
    it('should deserialize a standard Error object', () => {
      // Arrange
      const originalError = new Error('Standard error message');
      const serialized = serializeError(originalError);
      
      // Act
      const deserialized = deserializeError(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(Error);
      expect(deserialized.message).toBe('Standard error message');
      expect(deserialized.stack).toBeDefined();
    });
    
    it('should deserialize a BaseError with correct prototype', () => {
      // Arrange
      const originalError = new BaseError({
        message: 'Base error message',
        type: ErrorType.BUSINESS
      });
      const serialized = serializeError(originalError);
      
      // Act
      const deserialized = deserializeError(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(BaseError);
      expect(deserialized.message).toBe('Base error message');
      expect(deserialized.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should deserialize specialized error classes with correct prototype', () => {
      // Arrange
      const originalErrors = [
        new MissingParameterError('userId'),
        new ResourceNotFoundError('User', '123'),
        new DatabaseError('Failed to execute query', { query: 'SELECT * FROM users' }),
        new ExternalApiError('API call failed', { url: 'https://api.example.com', statusCode: 500 })
      ];
      
      const serializedErrors = originalErrors.map(serializeError);
      
      // Act
      const deserializedErrors = serializedErrors.map(deserializeError);
      
      // Assert
      expect(deserializedErrors[0]).toBeInstanceOf(MissingParameterError);
      expect(deserializedErrors[1]).toBeInstanceOf(ResourceNotFoundError);
      expect(deserializedErrors[2]).toBeInstanceOf(DatabaseError);
      expect(deserializedErrors[3]).toBeInstanceOf(ExternalApiError);
      
      // Check that specific properties are preserved
      expect(deserializedErrors[0].paramName).toBe('userId');
      expect(deserializedErrors[1].resourceType).toBe('User');
      expect(deserializedErrors[1].resourceId).toBe('123');
      expect(deserializedErrors[2].metadata.query).toBe('SELECT * FROM users');
      expect(deserializedErrors[3].metadata.url).toBe('https://api.example.com');
      expect(deserializedErrors[3].metadata.statusCode).toBe(500);
    });
    
    it('should deserialize error with cause chain preserving prototypes', () => {
      // Arrange
      const rootCause = new ValidationError('Invalid input');
      const intermediateError = new DatabaseError('Database query failed', { cause: rootCause });
      const topError = new ExternalApiError('API call failed', { cause: intermediateError });
      
      const serialized = serializeError(topError);
      
      // Act
      const deserialized = deserializeError(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(ExternalApiError);
      expect(deserialized.cause).toBeInstanceOf(DatabaseError);
      expect(deserialized.cause.cause).toBeInstanceOf(ValidationError);
    });
    
    it('should preserve metadata during serialization and deserialization', () => {
      // Arrange
      const metadata = {
        userId: '123',
        requestId: 'abc-xyz',
        timestamp: new Date().toISOString(),
        context: {
          journey: 'health',
          action: 'updateMetrics',
          parameters: { metricId: '456', value: 120 }
        }
      };
      
      const originalError = new BaseError({
        message: 'Error with complex metadata',
        type: ErrorType.BUSINESS,
        metadata
      });
      
      // Act
      const serialized = serializeError(originalError);
      const deserialized = deserializeError(serialized);
      
      // Assert
      expect(deserialized.metadata).toEqual(metadata);
    });
    
    it('should handle errors with non-enumerable properties', () => {
      // Arrange
      const originalError = new BaseError({
        message: 'Error with non-enumerable property',
        type: ErrorType.TECHNICAL
      });
      
      // Add a non-enumerable property
      Object.defineProperty(originalError, 'sensitiveData', {
        value: 'secret',
        enumerable: false
      });
      
      // Act
      const serialized = serializeError(originalError);
      const deserialized = deserializeError(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(BaseError);
      // Non-enumerable properties should be preserved if the serializer supports it
      // This is an implementation detail that may vary
      if (Object.getOwnPropertyDescriptor(deserialized, 'sensitiveData')) {
        expect(Object.getOwnPropertyDescriptor(deserialized, 'sensitiveData')?.enumerable).toBe(false);
        expect(deserialized.sensitiveData).toBe('secret');
      }
    });
  });
  
  describe('Cross-service error propagation', () => {
    it('should maintain error integrity when transmitted between services', () => {
      // Arrange
      const originalError = new ResourceNotFoundError('User', '123', {
        requestId: 'req-456',
        context: { journey: 'health' }
      });
      
      // Act - Simulate error transmission between services
      const serialized = serializeError(originalError);
      const jsonString = JSON.stringify(serialized); // Convert to string for transmission
      const parsedJson = JSON.parse(jsonString); // Parse back from string after transmission
      const deserialized = deserializeError(parsedJson);
      
      // Assert
      expect(deserialized).toBeInstanceOf(ResourceNotFoundError);
      expect(deserialized.message).toBe(originalError.message);
      expect(deserialized.type).toBe(ErrorType.BUSINESS);
      expect(deserialized.resourceType).toBe('User');
      expect(deserialized.resourceId).toBe('123');
      expect(deserialized.metadata.requestId).toBe('req-456');
      expect(deserialized.metadata.context.journey).toBe('health');
    });
    
    it('should handle errors with custom properties when transmitted between services', () => {
      // Arrange
      class CustomJourneyError extends BaseError {
        public readonly journeyId: string;
        public readonly stepName: string;
        
        constructor(journeyId: string, stepName: string, message: string) {
          super({
            message,
            type: ErrorType.BUSINESS,
            metadata: { journeyId, stepName }
          });
          this.journeyId = journeyId;
          this.stepName = stepName;
        }
      }
      
      const originalError = new CustomJourneyError('journey-123', 'health-metrics', 'Failed to process journey step');
      
      // Act - Simulate error transmission between services
      const serialized = serializeError(originalError);
      const jsonString = JSON.stringify(serialized);
      const parsedJson = JSON.parse(jsonString);
      const deserialized = deserializeError(parsedJson);
      
      // Assert
      // Note: Custom classes might not be reconstructed with the exact same prototype
      // unless the deserializer has a registry of error classes
      expect(deserialized.message).toBe('Failed to process journey step');
      expect(deserialized.type).toBe(ErrorType.BUSINESS);
      expect(deserialized.metadata.journeyId).toBe('journey-123');
      expect(deserialized.metadata.stepName).toBe('health-metrics');
      
      // If the deserializer supports custom class reconstruction
      if (deserialized instanceof CustomJourneyError) {
        expect(deserialized.journeyId).toBe('journey-123');
        expect(deserialized.stepName).toBe('health-metrics');
      }
    });
  });
});
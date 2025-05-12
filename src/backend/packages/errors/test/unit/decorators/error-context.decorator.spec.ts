import { Test } from '@nestjs/testing';
import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Mock implementation of the WithErrorContext decorator.
 * In a real implementation, this would be imported from the actual decorator file.
 * 
 * This decorator adds execution context to errors thrown by the decorated method,
 * including method name, timestamp, and arguments.
 */
function WithErrorContext() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Add context to the error
        if (error instanceof AppException) {
          // Add execution context to the error
          error.context = {
            method: `${target.constructor.name}.${propertyKey}`,
            timestamp: new Date().toISOString(),
            args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg)
          };
          
          // If this error already has a context from a nested call, preserve it in the chain
          if (error.context && this.traceContext) {
            error.context.traceId = this.traceContext.traceId;
            error.context.spanId = this.traceContext.spanId;
          }
        }
        throw error;
      }
    };
    return descriptor;
  };
}

/**
 * Mock implementation of the ClassifyError decorator.
 * In a real implementation, this would be imported from the actual decorator file.
 * 
 * This decorator automatically classifies uncaught errors into appropriate ErrorTypes
 * based on the error name and message. It can be configured with default error type and code.
 * 
 * @param defaultType - Default error type to use if the error can't be classified
 * @param defaultCode - Default error code to use if the error can't be classified
 */
function ClassifyError(defaultType: ErrorType = ErrorType.TECHNICAL, defaultCode: string = 'UNKNOWN_ERROR') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // If it's already an AppException, just rethrow it
        if (error instanceof AppException) {
          throw error;
        }
        
        // Classify the error based on its type
        let errorType = defaultType;
        let errorCode = defaultCode;
        
        // Example classification logic
        if (error.name === 'ValidationError') {
          errorType = ErrorType.VALIDATION;
          errorCode = 'VALIDATION_ERROR';
        } else if (error.name === 'DatabaseError') {
          errorType = ErrorType.TECHNICAL;
          errorCode = 'DATABASE_ERROR';
        } else if (error.name === 'NetworkError') {
          errorType = ErrorType.EXTERNAL;
          errorCode = 'NETWORK_ERROR';
        } else if (error.message && error.message.includes('business rule')) {
          errorType = ErrorType.BUSINESS;
          errorCode = 'BUSINESS_RULE_VIOLATION';
        }
        
        // Create a new AppException with the classified error type
        throw new AppException(
          error.message || 'An unknown error occurred',
          errorType,
          errorCode,
          { originalError: error.name },
          error
        );
      }
    };
    return descriptor;
  };
}

/**
 * Mock implementation of the TransformError decorator.
 * In a real implementation, this would be imported from the actual decorator file.
 * 
 * This decorator transforms errors thrown by the decorated method using a provided
 * transformation function. This allows for converting between error types or
 * adding additional context to errors.
 * 
 * @param transformFn - Function to transform the error
 */
function TransformError(transformFn: (error: Error) => Error) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Transform the error using the provided function
        throw transformFn(error);
      }
    };
    return descriptor;
  };
}

/**
 * Mock service class for testing the error context decorators.
 * This class contains methods decorated with each decorator to test their behavior.
 */
class MockService {
  @WithErrorContext()
  async methodWithContext() {
    throw new AppException('Test error', ErrorType.TECHNICAL, 'TEST_ERROR');
  }
  
  @ClassifyError()
  async methodWithClassification() {
    throw new Error('Something went wrong');
  }
  
  @ClassifyError(ErrorType.BUSINESS, 'CUSTOM_ERROR')
  async methodWithCustomClassification() {
    throw new Error('Business rule violated');
  }
  
  @TransformError((error: Error) => {
    if (error instanceof AppException) {
      return new AppException(
        `Transformed: ${error.message}`,
        ErrorType.BUSINESS,
        'TRANSFORMED_ERROR',
        error.details,
        error
      );
    }
    return new AppException(
      `Transformed: ${error.message}`,
      ErrorType.BUSINESS,
      'TRANSFORMED_ERROR',
      {},
      error
    );
  })
  async methodWithTransformation() {
    throw new Error('Original error');
  }
  
  // Test nested method calls
  @WithErrorContext()
  async outerMethod() {
    return this.innerMethod();
  }
  
  @WithErrorContext()
  async innerMethod() {
    throw new AppException('Inner error', ErrorType.TECHNICAL, 'INNER_ERROR');
  }
  
  // Test combination of decorators
  @WithErrorContext()
  @ClassifyError()
  async methodWithContextAndClassification() {
    throw new Error('Combined error');
  }
  
  // Test integration with tracing
  @WithErrorContext()
  async methodWithTracing() {
    // Simulate a traced method
    const traceId = 'trace-123';
    const spanId = 'span-456';
    
    // Set trace context
    this.setTraceContext(traceId, spanId);
    
    throw new AppException('Traced error', ErrorType.TECHNICAL, 'TRACED_ERROR');
  }
  
  // Mock method to set trace context
  private setTraceContext(traceId: string, spanId: string) {
    // In a real implementation, this would set the trace context
    // For testing, we'll just store it in the instance
    (this as any).traceContext = { traceId, spanId };
  }
}

/**
 * Test suite for error context decorators.
 * Tests the behavior of WithErrorContext, ClassifyError, and TransformError decorators,
 * as well as their combinations and integration with tracing.
 */
describe('Error Context Decorators', () => {
  let service: MockService;
  
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MockService],
    }).compile();
    
    service = moduleRef.get<MockService>(MockService);
  });
  
  /**
   * Tests for the WithErrorContext decorator.
   * Verifies that the decorator adds execution context to errors,
   * preserves original error properties, and propagates context through nested calls.
   */
  describe('WithErrorContext', () => {
    it('should add execution context to errors', async () => {
      try {
        await service.methodWithContext();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.context).toBeDefined();
        expect(error.context.method).toBe('MockService.methodWithContext');
        expect(error.context.timestamp).toBeDefined();
        expect(error.context.args).toEqual([]);
      }
    });
    
    it('should preserve the original error properties', async () => {
      try {
        await service.methodWithContext();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.message).toBe('Test error');
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('TEST_ERROR');
      }
    });
    
    it('should propagate context through nested method calls', async () => {
      try {
        await service.outerMethod();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.context).toBeDefined();
        // The innermost context should be preserved
        expect(error.context.method).toBe('MockService.innerMethod');
        // But we should also have the outer context in a chain
        expect(error.outerContext).toBeDefined();
        expect(error.outerContext.method).toBe('MockService.outerMethod');
      }
    });
  });
  
  /**
   * Tests for the ClassifyError decorator.
   * Verifies that the decorator correctly classifies errors based on their type,
   * uses custom error types and codes when provided, and preserves AppException errors.
   */
  describe('ClassifyError', () => {
    it('should classify unknown errors as technical by default', async () => {
      try {
        await service.methodWithClassification();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('UNKNOWN_ERROR');
        expect(error.message).toBe('Something went wrong');
      }
    });
    
    it('should use custom error type and code when provided', async () => {
      try {
        await service.methodWithCustomClassification();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('CUSTOM_ERROR');
      }
    });
    
    it('should not modify AppException errors', async () => {
      const originalError = new AppException('Original app exception', ErrorType.VALIDATION, 'ORIGINAL_CODE');
      jest.spyOn(service as any, 'methodWithClassification').mockImplementation(() => {
        throw originalError;
      });
      
      try {
        await service.methodWithClassification();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBe(originalError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe('ORIGINAL_CODE');
      }
    });
    
    it('should classify errors based on error name and message', async () => {
      // Test ValidationError classification
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      jest.spyOn(service as any, 'methodWithClassification').mockImplementation(() => {
        throw validationError;
      });
      
      try {
        await service.methodWithClassification();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe('VALIDATION_ERROR');
      }
      
      // Test DatabaseError classification
      const databaseError = new Error('Database connection failed');
      databaseError.name = 'DatabaseError';
      jest.spyOn(service as any, 'methodWithClassification').mockImplementation(() => {
        throw databaseError;
      });
      
      try {
        await service.methodWithClassification();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('DATABASE_ERROR');
      }
      
      // Test NetworkError classification
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      jest.spyOn(service as any, 'methodWithClassification').mockImplementation(() => {
        throw networkError;
      });
      
      try {
        await service.methodWithClassification();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.code).toBe('NETWORK_ERROR');
      }
      
      // Test business rule violation classification
      const businessError = new Error('This operation violates a business rule');
      jest.spyOn(service as any, 'methodWithClassification').mockImplementation(() => {
        throw businessError;
      });
      
      try {
        await service.methodWithClassification();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      }
    });
  });
  
  /**
   * Tests for the TransformError decorator.
   * Verifies that the decorator correctly transforms errors using the provided function,
   * and handles both regular errors and AppException errors.
   */
  describe('TransformError', () => {
    it('should transform errors using the provided function', async () => {
      try {
        await service.methodWithTransformation();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.message).toBe('Transformed: Original error');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('TRANSFORMED_ERROR');
      }
    });
    
    it('should transform AppException errors', async () => {
      const originalError = new AppException('Original app exception', ErrorType.VALIDATION, 'ORIGINAL_CODE');
      jest.spyOn(service as any, 'methodWithTransformation').mockImplementation(() => {
        throw originalError;
      });
      
      try {
        await service.methodWithTransformation();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.message).toBe('Transformed: Original app exception');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('TRANSFORMED_ERROR');
      }
    });
  });
  
  /**
   * Tests for combinations of decorators.
   * Verifies that multiple decorators can be applied to the same method
   * and that they are applied in the correct order.
   */
  describe('Combined Decorators', () => {
    it('should apply multiple decorators in the correct order', async () => {
      try {
        await service.methodWithContextAndClassification();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        // First the error should be classified
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('UNKNOWN_ERROR');
        // Then context should be added
        expect(error.context).toBeDefined();
        expect(error.context.method).toBe('MockService.methodWithContextAndClassification');
      }
    });
  });
  
  /**
   * Tests for integration with tracing.
   * Verifies that trace context is included in error context,
   * enabling correlation between errors and request context.
   */
  describe('Integration with Tracing', () => {
    it('should include trace context in error context', async () => {
      try {
        await service.methodWithTracing();
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.context).toBeDefined();
        expect(error.context.method).toBe('MockService.methodWithTracing');
        // Trace context should be included
        expect(error.context.traceId).toBe('trace-123');
        expect(error.context.spanId).toBe('span-456');
      }
    });
  });
});
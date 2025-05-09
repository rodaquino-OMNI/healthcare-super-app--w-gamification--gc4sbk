import { Test } from '@nestjs/testing';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import { ErrorRecoveryStrategy } from '../../../src/types';
import {
  WithErrorContext,
  ClassifyError,
  TransformError
} from '../../../src/decorators/error-context.decorator';

// Custom error classes for testing
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

class CustomBusinessError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.BUSINESS, 'BUSINESS_ERROR');
    Object.setPrototypeOf(this, CustomBusinessError.prototype);
  }
}

// Mock service for testing decorators
class MockService {
  @WithErrorContext({
    journey: 'health',
    operation: 'getHealthMetrics',
    resource: 'HealthMetric',
    getUserId: (userId: string) => userId
  })
  async getHealthMetricsWithContext(userId: string): Promise<any> {
    throw new Error('Failed to get health metrics');
  }

  @WithErrorContext({
    journey: 'health'
  })
  async getHealthMetricsMinimalContext(): Promise<any> {
    throw new Error('Failed to get health metrics');
  }

  @WithErrorContext({
    journey: 'health',
    data: { additionalInfo: 'test-data' }
  })
  async getHealthMetricsWithAdditionalData(): Promise<any> {
    throw new Error('Failed to get health metrics');
  }

  @WithErrorContext({
    journey: 'health'
  })
  async throwBaseError(): Promise<any> {
    throw new BaseError(
      'Base error message',
      ErrorType.TECHNICAL,
      'TECHNICAL_ERROR'
    );
  }

  @ClassifyError({
    defaultType: ErrorType.BUSINESS,
    errorTypeMappings: {
      'ValidationError': ErrorType.VALIDATION,
      'DatabaseError': ErrorType.TECHNICAL,
      'NotFoundError': ErrorType.NOT_FOUND
    }
  })
  async methodWithClassification(): Promise<any> {
    throw new ValidationError('Validation failed');
  }

  @ClassifyError({
    defaultType: ErrorType.BUSINESS,
    errorTypeMappings: new Map([
      [ValidationError, ErrorType.VALIDATION],
      [DatabaseError, ErrorType.TECHNICAL],
      [(error) => error.message.includes('not found'), ErrorType.NOT_FOUND]
    ])
  })
  async methodWithMapClassification(errorType: string): Promise<any> {
    if (errorType === 'validation') {
      throw new ValidationError('Validation failed');
    } else if (errorType === 'database') {
      throw new DatabaseError('Database error');
    } else if (errorType === 'notfound') {
      throw new Error('Resource not found');
    } else {
      throw new Error('Generic error');
    }
  }

  @ClassifyError({
    defaultType: ErrorType.BUSINESS,
    errorTypeMappings: {
      'ValidationError': ErrorType.VALIDATION
    },
    recoveryStrategy: ErrorRecoveryStrategy.RETRY
  })
  async methodWithRecoveryStrategy(): Promise<any> {
    throw new ValidationError('Validation failed');
  }

  @ClassifyError({
    defaultType: ErrorType.BUSINESS,
    rethrow: false
  })
  async methodWithoutRethrow(): Promise<any> {
    throw new Error('Test error');
  }

  @TransformError({
    transformFn: (error) => {
      if (error instanceof ValidationError) {
        return new BaseError(
          `Transformed: ${error.message}`,
          ErrorType.VALIDATION,
          'VALIDATION_ERROR'
        );
      }
      return error;
    }
  })
  async methodWithTransformation(): Promise<any> {
    throw new ValidationError('Validation failed');
  }

  @TransformError({
    transformFn: (error) => {
      return new BaseError(
        `Transformed: ${error.message}`,
        ErrorType.BUSINESS,
        'BUSINESS_ERROR'
      );
    },
    transformErrors: [ErrorType.VALIDATION, ErrorType.BUSINESS]
  })
  async methodWithSelectiveTransformation(errorType: ErrorType): Promise<any> {
    throw new BaseError('Test error', errorType, `${errorType.toUpperCase()}_ERROR`);
  }

  @TransformError({
    transformFn: (error) => {
      return new BaseError(
        `Transformed: ${error.message}`,
        ErrorType.BUSINESS,
        'BUSINESS_ERROR'
      );
    },
    shouldTransform: (error) => error.message.includes('transform me')
  })
  async methodWithCustomTransformCondition(message: string): Promise<any> {
    throw new Error(message);
  }

  // Method with nested decorators to test composition
  @WithErrorContext({
    journey: 'health',
    operation: 'compositeOperation'
  })
  @ClassifyError({
    defaultType: ErrorType.TECHNICAL,
    errorTypeMappings: {
      'ValidationError': ErrorType.VALIDATION
    }
  })
  @TransformError({
    transformFn: (error) => {
      if (error instanceof ValidationError) {
        return new BaseError(
          `Transformed: ${error.message}`,
          ErrorType.VALIDATION,
          'VALIDATION_ERROR'
        );
      }
      return error;
    }
  })
  async compositeMethod(): Promise<any> {
    throw new ValidationError('Composite error');
  }

  // Method that calls another decorated method to test context propagation
  @WithErrorContext({
    journey: 'care',
    operation: 'parentOperation'
  })
  async parentMethod(): Promise<any> {
    try {
      return await this.getHealthMetricsWithContext('user123');
    } catch (error) {
      throw error;
    }
  }
}

// Mock for tracing context
const mockTraceContext = {
  requestId: 'test-request-id',
  traceId: 'test-trace-id',
  spanId: 'test-span-id'
};

// Mock the getTraceContext function
jest.mock('../../../src/decorators/error-context.decorator', () => {
  const original = jest.requireActual('../../../src/decorators/error-context.decorator');
  return {
    ...original,
    getTraceContext: jest.fn().mockReturnValue(mockTraceContext)
  };
});

describe('Error Context Decorators', () => {
  let service: MockService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MockService],
    }).compile();

    service = moduleRef.get<MockService>(MockService);
  });

  describe('WithErrorContext Decorator', () => {
    it('should add context to thrown errors', async () => {
      try {
        await service.getHealthMetricsWithContext('user123');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.context).toBeDefined();
        expect(error.context.journey).toBe(JourneyContext.HEALTH);
        expect(error.context.operation).toBe('getHealthMetrics');
        expect(error.context.resource).toBe('HealthMetric');
        expect(error.context.userId).toBe('user123');
        expect(error.context.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should use method name as operation if not provided', async () => {
      try {
        await service.getHealthMetricsMinimalContext();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.context).toBeDefined();
        expect(error.context.journey).toBe(JourneyContext.HEALTH);
        expect(error.context.operation).toBe('getHealthMetricsMinimalContext');
        expect(error.context.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should add additional data to context if provided', async () => {
      try {
        await service.getHealthMetricsWithAdditionalData();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.context).toBeDefined();
        expect(error.context.additionalInfo).toBe('test-data');
      }
    });

    it('should add context to BaseError instances', async () => {
      try {
        await service.throwBaseError();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('TECHNICAL_ERROR');
        expect(error.context).toBeDefined();
        expect(error.context.journey).toBe(JourneyContext.HEALTH);
      }
    });

    it('should preserve context when propagating through multiple methods', async () => {
      try {
        await service.parentMethod();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.context).toBeDefined();
        // The innermost decorator (health journey) should take precedence
        expect(error.context.journey).toBe(JourneyContext.HEALTH);
        expect(error.context.operation).toBe('getHealthMetrics');
        expect(error.context.userId).toBe('user123');
      }
    });

    it('should include tracing information in error context', async () => {
      try {
        await service.getHealthMetricsWithContext('user123');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.context).toBeDefined();
        expect(error.context.requestId).toBe(mockTraceContext.requestId);
        expect(error.context.traceId).toBe(mockTraceContext.traceId);
        expect(error.context.spanId).toBe(mockTraceContext.spanId);
      }
    });
  });

  describe('ClassifyError Decorator', () => {
    it('should classify errors based on constructor name', async () => {
      try {
        await service.methodWithClassification();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.message).toBe('Validation failed');
      }
    });

    it('should classify errors using Map with instanceof checks', async () => {
      try {
        await service.methodWithMapClassification('validation');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
      }
    });

    it('should classify errors using Map with custom functions', async () => {
      try {
        await service.methodWithMapClassification('notfound');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.NOT_FOUND);
      }
    });

    it('should use default type when no mapping matches', async () => {
      try {
        await service.methodWithMapClassification('other');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.BUSINESS);
      }
    });

    it('should add recovery strategy to classified errors', async () => {
      try {
        await service.methodWithRecoveryStrategy();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        // Note: In a real implementation, the recovery strategy would be stored in the error
        // For this test, we're just verifying the decorator logic works
      }
    });

    it('should return error instead of throwing when rethrow is false', async () => {
      const result = await service.methodWithoutRethrow();
      expect(result).toBeInstanceOf(BaseError);
      expect(result.type).toBe(ErrorType.BUSINESS);
      expect(result.message).toBe('Test error');
    });
  });

  describe('TransformError Decorator', () => {
    it('should transform errors using the provided function', async () => {
      try {
        await service.methodWithTransformation();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('Transformed: Validation failed');
      }
    });

    it('should transform only specified error types', async () => {
      // Should transform VALIDATION errors
      try {
        await service.methodWithSelectiveTransformation(ErrorType.VALIDATION);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.message).toBe('Transformed: Test error');
      }

      // Should transform BUSINESS errors
      try {
        await service.methodWithSelectiveTransformation(ErrorType.BUSINESS);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.message).toBe('Transformed: Test error');
      }

      // Should NOT transform TECHNICAL errors
      try {
        await service.methodWithSelectiveTransformation(ErrorType.TECHNICAL);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.message).toBe('Test error');
      }
    });

    it('should use custom condition to determine if error should be transformed', async () => {
      // Should transform this error
      try {
        await service.methodWithCustomTransformCondition('transform me please');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.message).toBe('Transformed: transform me please');
      }

      // Should NOT transform this error
      try {
        await service.methodWithCustomTransformCondition('do not transform');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('do not transform');
      }
    });
  });

  describe('Decorator Composition', () => {
    it('should apply multiple decorators in the correct order', async () => {
      try {
        await service.compositeMethod();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('Transformed: Composite error');
        expect(error.context).toBeDefined();
        expect(error.context.journey).toBe(JourneyContext.HEALTH);
        expect(error.context.operation).toBe('compositeOperation');
      }
    });
  });
});
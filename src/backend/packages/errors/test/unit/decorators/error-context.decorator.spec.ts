import { Test } from '@nestjs/testing';
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { BaseError, ErrorType, JourneyType } from '../../../src/base';
import {
  WithErrorContext,
  ClassifyError,
  TransformError,
  WithErrorHandling,
  ErrorContextConfig,
  ErrorClassificationConfig
} from '../../../src/decorators/error-context.decorator';

// Mock OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  const mockSpan = {
    setStatus: jest.fn(),
    recordException: jest.fn(),
    setAttribute: jest.fn(),
    spanContext: jest.fn().mockReturnValue({
      traceId: 'mock-trace-id',
      spanId: 'mock-span-id'
    })
  };
  
  return {
    context: {
      active: jest.fn().mockReturnValue({})
    },
    trace: {
      getSpan: jest.fn().mockReturnValue(mockSpan)
    },
    SpanStatusCode: {
      ERROR: 'ERROR'
    }
  };
});

// Custom error classes for testing
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Mock service for testing decorators
class MockService {
  // Method with WithErrorContext decorator
  @WithErrorContext({
    component: 'MockService',
    journey: JourneyType.HEALTH,
    operation: 'processHealthData',
    metadata: { importance: 'high' }
  })
  async withContextSuccess(): Promise<string> {
    return 'success';
  }

  @WithErrorContext({
    component: 'MockService',
    journey: JourneyType.HEALTH,
    operation: 'processHealthData',
    metadata: { importance: 'high' }
  })
  async withContextError(): Promise<string> {
    throw new Error('Test error');
  }

  @WithErrorContext()
  async withDefaultContext(): Promise<string> {
    throw new Error('Default context error');
  }

  // Method with ClassifyError decorator
  @ClassifyError({
    defaultType: ErrorType.TECHNICAL,
    defaultCode: 'MOCK_001',
    defaultMessage: 'An error occurred in mock service'
  })
  async withClassification(): Promise<string> {
    throw new Error('Classification test error');
  }

  @ClassifyError({
    defaultType: ErrorType.TECHNICAL,
    defaultCode: 'MOCK_002',
    classifier: (error) => {
      if (error instanceof ValidationError) {
        return ErrorType.VALIDATION;
      } else if (error instanceof DatabaseError) {
        return ErrorType.TECHNICAL;
      } else if (error instanceof ApiError) {
        return ErrorType.EXTERNAL;
      }
      return undefined; // Use default
    }
  })
  async withCustomClassifier(errorType?: string): Promise<string> {
    if (errorType === 'validation') {
      throw new ValidationError('Validation failed');
    } else if (errorType === 'database') {
      throw new DatabaseError('Database error');
    } else if (errorType === 'api') {
      throw new ApiError('External API error');
    } else if (errorType === 'base') {
      throw new BaseError('Already classified', ErrorType.BUSINESS, 'BUSINESS_001', { operation: 'test' });
    }
    return 'success';
  }

  // Method with TransformError decorator
  @TransformError({
    transformer: (error) => {
      if (error instanceof ValidationError) {
        return new BaseError('Transformed validation error', ErrorType.VALIDATION, 'VALIDATION_001', { operation: 'transform' });
      }
      return error;
    }
  })
  async withTransformation(errorType?: string): Promise<string> {
    if (errorType === 'validation') {
      throw new ValidationError('Original validation error');
    } else if (errorType === 'other') {
      throw new Error('Non-transformed error');
    }
    return 'success';
  }

  // Method with conditional transformation
  @TransformError({
    transformer: (error) => {
      return new BaseError('Conditionally transformed', ErrorType.TECHNICAL, 'CONDITION_001', { operation: 'conditional' });
    },
    condition: (error) => error instanceof DatabaseError,
    errorTypes: [DatabaseError]
  })
  async withConditionalTransform(errorType?: string): Promise<string> {
    if (errorType === 'database') {
      throw new DatabaseError('Database error for conditional transform');
    } else if (errorType === 'validation') {
      throw new ValidationError('Should not be transformed');
    }
    return 'success';
  }

  // Method with combined decorators
  @WithErrorHandling(
    { journey: JourneyType.CARE, metadata: { source: 'combined' } },
    { defaultType: ErrorType.BUSINESS, defaultCode: 'COMBINED_001' }
  )
  async withCombinedDecorators(): Promise<string> {
    throw new Error('Error in combined decorators');
  }

  // Methods for testing nested calls
  @WithErrorContext({ journey: JourneyType.HEALTH, operation: 'outer' })
  async outerMethod(): Promise<string> {
    return this.innerMethod();
  }

  @WithErrorContext({ operation: 'inner' })
  async innerMethod(): Promise<string> {
    throw new Error('Error in inner method');
  }
}

describe('Error Context Decorators', () => {
  let service: MockService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MockService],
    }).compile();

    service = moduleRef.get<MockService>(MockService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('WithErrorContext Decorator', () => {
    it('should return success result when no error occurs', async () => {
      const result = await service.withContextSuccess();
      expect(result).toBe('success');
    });

    it('should add context to thrown errors', async () => {
      try {
        await service.withContextError();
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('Test error');
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.context).toBeDefined();
        expect(error.context.component).toBe('MockService');
        expect(error.context.journey).toBe(JourneyType.HEALTH);
        expect(error.context.operation).toBe('processHealthData');
        expect(error.context.metadata).toEqual({ importance: 'high' });
        expect(error.context.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should use default context values when not provided', async () => {
      try {
        await service.withDefaultContext();
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.context).toBeDefined();
        expect(error.context.component).toBe('MockService'); // Class name
        expect(error.context.operation).toBe('withDefaultContext'); // Method name
        expect(error.context.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should extract trace context when available', async () => {
      try {
        await service.withContextError();
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error.context.traceId).toBe('mock-trace-id');
        expect(error.context.spanId).toBe('mock-span-id');
      }
    });

    it('should record error in current span when available', async () => {
      const mockSpan = trace.getSpan(context.active());
      
      try {
        await service.withContextError();
        fail('Expected error was not thrown');
      } catch (error) {
        expect(mockSpan.setStatus).toHaveBeenCalledWith({
          code: SpanStatusCode.ERROR,
          message: 'Test error'
        });
        
        expect(mockSpan.recordException).toHaveBeenCalled();
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', ErrorType.TECHNICAL);
      }
    });
  });

  describe('ClassifyError Decorator', () => {
    it('should classify unknown errors with default values', async () => {
      try {
        await service.withClassification();
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('MOCK_001');
        expect(error.message).toBe('Classification test error'); // Uses original message
        expect(error.context).toBeDefined();
        expect(error.context.component).toBe('MockService');
        expect(error.context.operation).toBe('withClassification');
      }
    });

    it('should not reclassify BaseError instances', async () => {
      try {
        await service.withCustomClassifier('base');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.BUSINESS); // Original type preserved
        expect(error.code).toBe('BUSINESS_001'); // Original code preserved
      }
    });

    it('should use custom classifier for ValidationError', async () => {
      try {
        await service.withCustomClassifier('validation');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe('MOCK_002');
        expect(error.message).toBe('Validation failed');
      }
    });

    it('should use custom classifier for DatabaseError', async () => {
      try {
        await service.withCustomClassifier('database');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('MOCK_002');
        expect(error.message).toBe('Database error');
      }
    });

    it('should use custom classifier for ApiError', async () => {
      try {
        await service.withCustomClassifier('api');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.code).toBe('MOCK_002');
        expect(error.message).toBe('External API error');
      }
    });
  });

  describe('TransformError Decorator', () => {
    it('should transform ValidationError to BaseError', async () => {
      try {
        await service.withTransformation('validation');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe('VALIDATION_001');
        expect(error.message).toBe('Transformed validation error');
        expect(error.context.operation).toBe('transform');
      }
    });

    it('should not transform other error types', async () => {
      try {
        await service.withTransformation('other');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).not.toBeInstanceOf(BaseError);
        expect(error.message).toBe('Non-transformed error');
      }
    });

    it('should apply conditional transformation based on error type', async () => {
      try {
        await service.withConditionalTransform('database');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('Conditionally transformed');
        expect(error.code).toBe('CONDITION_001');
      }
    });

    it('should not transform errors that do not match condition', async () => {
      try {
        await service.withConditionalTransform('validation');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).not.toBeInstanceOf(BaseError);
        expect(error.message).toBe('Should not be transformed');
      }
    });
  });

  describe('WithErrorHandling Decorator', () => {
    it('should combine context and classification', async () => {
      try {
        await service.withCombinedDecorators();
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('COMBINED_001');
        expect(error.message).toBe('Error in combined decorators');
        expect(error.context.journey).toBe(JourneyType.CARE);
        expect(error.context.metadata).toEqual({ source: 'combined' });
      }
    });
  });

  describe('Nested Method Calls', () => {
    it('should preserve context from outer method when inner method throws', async () => {
      try {
        await service.outerMethod();
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.context.journey).toBe(JourneyType.HEALTH); // From outer
        expect(error.context.operation).toBe('inner'); // From inner (overrides outer)
      }
    });
  });
});
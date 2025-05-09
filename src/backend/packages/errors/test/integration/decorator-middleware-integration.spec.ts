import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, HttpStatus, INestApplication, Module, Param, UseFilters, Injectable, Scope, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as request from 'supertest';
import { BaseError, ErrorType } from '../../src/base';
import { ClassifyError, TransformError, WithErrorContext } from '../../src/decorators/error-context.decorator';
import { Retry, RetryWithBackoff } from '../../src/decorators/retry.decorator';
import { WithFallback } from '../../src/decorators/fallback.decorator';
import { GlobalExceptionFilter } from '../../src/nest/filters';
import { ErrorsModule } from '../../src/nest/module';
import { errorHandlerMiddleware, requestContextMiddleware } from '../../src/middleware';

// Custom error classes for testing
class ValidationTestError extends BaseError {
  constructor(message: string) {
    super({
      message,
      type: ErrorType.VALIDATION,
      code: 'TEST_VALIDATION_ERROR',
    });
  }
}

class BusinessTestError extends BaseError {
  constructor(message: string) {
    super({
      message,
      type: ErrorType.BUSINESS,
      code: 'TEST_BUSINESS_ERROR',
    });
  }
}

class TechnicalTestError extends BaseError {
  constructor(message: string) {
    super({
      message,
      type: ErrorType.TECHNICAL,
      code: 'TEST_TECHNICAL_ERROR',
    });
  }
}

class ExternalTestError extends BaseError {
  constructor(message: string) {
    super({
      message,
      type: ErrorType.EXTERNAL,
      code: 'TEST_EXTERNAL_ERROR',
    });
  }
}

// Test service with decorated methods
@Injectable({ scope: Scope.REQUEST })
class TestService {
  private callCount = 0;

  @WithErrorContext()
  throwValidationError() {
    throw new ValidationTestError('Validation error from service');
  }

  @WithErrorContext()
  throwBusinessError() {
    throw new BusinessTestError('Business error from service');
  }

  @WithErrorContext()
  throwTechnicalError() {
    throw new TechnicalTestError('Technical error from service');
  }

  @WithErrorContext()
  throwExternalError() {
    throw new ExternalTestError('External error from service');
  }

  @WithErrorContext()
  @ClassifyError(ErrorType.TECHNICAL)
  throwStandardError() {
    throw new Error('Standard error that should be classified as TECHNICAL');
  }

  @WithErrorContext()
  @TransformError(ValidationTestError, (err) => {
    return new BusinessTestError(`Transformed from validation: ${err.message}`);
  })
  @TransformError(BusinessTestError, (err) => {
    return new TechnicalTestError(`Transformed from business: ${err.message}`);
  })
  throwTransformedError(type: string) {
    switch (type) {
      case 'validation':
        throw new ValidationTestError('Initial validation error');
      case 'business':
        throw new BusinessTestError('Initial business error');
      default:
        throw new Error('Unknown error type');
    }
  }

  @WithErrorContext()
  throwErrorWithMetadata() {
    const error = new BusinessTestError('Error with metadata');
    error.addMetadata('userId', '12345');
    error.addMetadata('journeyId', 'health');
    error.addMetadata('requestId', 'req-abc-123');
    throw error;
  }

  @Retry(3)
  @WithErrorContext()
  retryableMethod() {
    this.callCount++;
    if (this.callCount < 3) {
      throw new ExternalTestError(`Attempt ${this.callCount} failed`);
    }
    return { success: true, attempts: this.callCount };
  }

  @RetryWithBackoff({ maxAttempts: 3, initialDelayMs: 10 })
  @WithErrorContext()
  retryWithBackoffMethod() {
    this.callCount++;
    if (this.callCount < 3) {
      throw new ExternalTestError(`Attempt ${this.callCount} failed with backoff`);
    }
    return { success: true, attempts: this.callCount };
  }

  @WithFallback(() => ({ fallback: true, message: 'Used fallback value' }))
  @WithErrorContext()
  methodWithFallback() {
    throw new TechnicalTestError('Error that should trigger fallback');
  }

  resetCallCount() {
    this.callCount = 0;
  }
}

// Test controller with decorated methods
@Controller('test')
@ClassifyError(ErrorType.TECHNICAL) // Class-level decorator for default error classification
class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('validation-error')
  @WithErrorContext() // Add request context to errors
  throwValidationError() {
    return this.testService.throwValidationError();
  }

  @Get('business-error')
  @WithErrorContext()
  throwBusinessError() {
    return this.testService.throwBusinessError();
  }

  @Get('technical-error')
  @WithErrorContext()
  throwTechnicalError() {
    return this.testService.throwTechnicalError();
  }

  @Get('external-error')
  @WithErrorContext()
  throwExternalError() {
    return this.testService.throwExternalError();
  }

  @Get('standard-error')
  @WithErrorContext()
  throwStandardError() {
    return this.testService.throwStandardError();
  }

  @Get('transform-error/:type')
  @WithErrorContext()
  throwTransformedError(@Param('type') type: string) {
    return this.testService.throwTransformedError(type);
  }

  @Get('metadata-error')
  @WithErrorContext()
  throwErrorWithMetadata() {
    return this.testService.throwErrorWithMetadata();
  }

  @Get('retry')
  @WithErrorContext()
  async retryableEndpoint() {
    this.testService.resetCallCount();
    return await this.testService.retryableMethod();
  }

  @Get('retry-backoff')
  @WithErrorContext()
  async retryWithBackoffEndpoint() {
    this.testService.resetCallCount();
    return await this.testService.retryWithBackoffMethod();
  }

  @Get('fallback')
  @WithErrorContext()
  async fallbackEndpoint() {
    return await this.testService.methodWithFallback();
  }
  
  @Get('http-exception')
  @WithErrorContext()
  throwHttpException() {
    throw new HttpException('HTTP exception from controller', HttpStatus.FORBIDDEN);
  }
  
  // This endpoint has no error decorator but should still be handled by the global filter
  @Get('undecorated-error')
  throwUndecoratedError() {
    throw new Error('Undecorated error that should be classified by global filter');
  }
}

// Test module
@Module({
  imports: [ErrorsModule],
  controllers: [TestController],
  providers: [TestService],
})
class TestModule {}

describe('Decorator and Middleware Integration', () => {
  let app: INestApplication;
  let server: any;
  let testService: TestService;
  let originalNodeEnv: string | undefined;

  beforeAll(async () => {
    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;

    // Create a NestJS test module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    // Get the test service for direct testing
    testService = moduleFixture.get<TestService>(TestService);

    // Create the application
    app = moduleFixture.createNestApplication();

    // Apply middleware in the correct order
    app.use(requestContextMiddleware());
    app.use(errorHandlerMiddleware());

    // Apply global filters
    app.useGlobalFilters(app.get(GlobalExceptionFilter));

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
    await app.close();
  });
  
  beforeEach(() => {
    // Reset call count before each test
    testService.resetCallCount();
  });

  describe('Error Classification and HTTP Status Codes', () => {
    it('should return 400 Bad Request for validation errors', async () => {
      const response = await request(server).get('/test/validation-error');
      
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.VALIDATION);
      expect(response.body.error.code).toBe('TEST_VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Validation error from controller');
    });

    it('should return 422 Unprocessable Entity for business errors', async () => {
      const response = await request(server).get('/test/business-error');
      
      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.BUSINESS);
      expect(response.body.error.code).toBe('TEST_BUSINESS_ERROR');
      expect(response.body.error.message).toBe('Business error from controller');
    });

    it('should return 500 Internal Server Error for technical errors', async () => {
      const response = await request(server).get('/test/technical-error');
      
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.TECHNICAL);
      expect(response.body.error.code).toBe('TEST_TECHNICAL_ERROR');
      expect(response.body.error.message).toBe('Technical error from controller');
    });

    it('should return 502 Bad Gateway for external errors', async () => {
      const response = await request(server).get('/test/external-error');
      
      expect(response.status).toBe(HttpStatus.BAD_GATEWAY);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.EXTERNAL);
      expect(response.body.error.code).toBe('TEST_EXTERNAL_ERROR');
      expect(response.body.error.message).toBe('External error from controller');
    });
  });

  describe('Error Decorator Behavior', () => {
    it('should classify standard errors using method-level decorator', async () => {
      const response = await request(server).get('/test/standard-error');
      
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.TECHNICAL);
      expect(response.body.error.message).toBe('Standard error that should be classified as TECHNICAL');
    });

    it('should transform validation errors to business errors', async () => {
      const response = await request(server).get('/test/transform-error/validation');
      
      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY); // Business error status
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.BUSINESS);
      expect(response.body.error.message).toContain('Transformed from validation');
    });

    it('should transform business errors to technical errors', async () => {
      const response = await request(server).get('/test/transform-error/business');
      
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR); // Technical error status
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.TECHNICAL);
      expect(response.body.error.message).toContain('Transformed from business');
    });
  });

  describe('Error Metadata Handling', () => {
    it('should preserve error metadata in the response', async () => {
      const response = await request(server).get('/test/metadata-error');
      
      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.BUSINESS);
      expect(response.body.error.metadata).toBeDefined();
      expect(response.body.error.metadata.userId).toBe('12345');
      expect(response.body.error.metadata.journeyId).toBe('health');
      expect(response.body.error.metadata.requestId).toBe('req-abc-123');
    });
  });

  describe('Request Context Integration', () => {
    it('should add request context to errors when using WithErrorContext', async () => {
      // Set custom headers to simulate request context
      const response = await request(server)
        .get('/test/validation-error')
        .set('x-request-id', 'test-request-123')
        .set('x-journey-id', 'health-journey')
        .set('x-user-id', 'user-456');
      
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.requestId).toBe('test-request-123');
      expect(response.body.error.context.journeyId).toBe('health-journey');
      expect(response.body.error.context.userId).toBe('user-456');
    });
  });

  describe('Resilience Pattern Integration', () => {
    it('should retry failed operations and eventually succeed', async () => {
      const response = await request(server).get('/test/retry');
      
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.attempts).toBe(3); // Should succeed on the 3rd attempt
    });

    it('should retry with backoff and eventually succeed', async () => {
      const response = await request(server).get('/test/retry-backoff');
      
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.attempts).toBe(3); // Should succeed on the 3rd attempt
    });

    it('should use fallback when operation fails', async () => {
      const response = await request(server).get('/test/fallback');
      
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.fallback).toBe(true);
      expect(response.body.message).toBe('Used fallback value');
    });
  });

  describe('Decorator Chain Behavior', () => {
    it('should apply decorators in the correct order', async () => {
      // This test verifies that decorators are applied in the correct order:
      // 1. WithErrorContext captures context
      // 2. TransformError transforms the error type
      // 3. The error is then handled by the global filter
      const response = await request(server)
        .get('/test/transform-error/validation')
        .set('x-request-id', 'chain-test-123')
        .set('x-journey-id', 'test-journey');
      
      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY); // Business error status
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.BUSINESS);
      expect(response.body.error.message).toContain('Transformed from validation');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.requestId).toBe('chain-test-123');
      expect(response.body.error.context.journeyId).toBe('test-journey');
    });
  });

  describe('Error Propagation Across Layers', () => {
    it('should preserve error context when propagating from service to controller', async () => {
      const response = await request(server)
        .get('/test/metadata-error')
        .set('x-request-id', 'propagation-test-123');
      
      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.metadata).toBeDefined();
      expect(response.body.error.metadata.userId).toBe('12345');
      expect(response.body.error.metadata.journeyId).toBe('health');
      expect(response.body.error.metadata.requestId).toBe('req-abc-123');
      
      // Should also have the request context from the controller
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.requestId).toBe('propagation-test-123');
    });
  });
  
  describe('NestJS Exception Filter Integration', () => {
    it('should handle HttpExceptions with proper status code and format', async () => {
      const response = await request(server)
        .get('/test/http-exception')
        .set('x-request-id', 'http-exception-test-123');
      
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBe('HTTP exception from controller');
      expect(response.body.error.type).toBeDefined();
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.requestId).toBe('http-exception-test-123');
    });
    
    it('should handle undecorated errors with global filter', async () => {
      const response = await request(server)
        .get('/test/undecorated-error')
        .set('x-request-id', 'undecorated-test-123');
      
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBe('Undecorated error that should be classified by global filter');
      expect(response.body.error.type).toBe(ErrorType.TECHNICAL); // Should be classified as TECHNICAL by default
      
      // Even without @WithErrorContext, the global filter should add context
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.requestId).toBe('undecorated-test-123');
    });
  });
  
  describe('Environment-Specific Error Handling', () => {
    it('should include detailed error information in development mode', async () => {
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';
      
      const response = await request(server)
        .get('/test/technical-error')
        .set('x-request-id', 'dev-mode-test-123');
      
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.TECHNICAL);
      expect(response.body.error.stack).toBeDefined(); // Stack trace should be included in development
      expect(response.body.error.details).toBeDefined(); // Additional details should be included
    });
    
    it('should exclude sensitive error information in production mode', async () => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';
      
      const response = await request(server)
        .get('/test/technical-error')
        .set('x-request-id', 'prod-mode-test-123');
      
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.TECHNICAL);
      expect(response.body.error.stack).toBeUndefined(); // Stack trace should be excluded in production
      expect(response.body.error.details).toBeUndefined(); // Additional details should be excluded
    });
  });
});
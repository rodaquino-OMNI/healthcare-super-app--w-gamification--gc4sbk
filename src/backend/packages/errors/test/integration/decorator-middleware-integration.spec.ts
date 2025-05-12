import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, Injectable, Module, Param, UseFilters } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

// Import error handling components
import { 
  ClassifyError, 
  TransformError, 
  WithErrorContext 
} from '../../src/decorators/error-context.decorator';
import { GlobalExceptionFilter } from '../../src/nest/filters';
import { ErrorsModule } from '../../src/nest/module';
import { BaseError } from '../../src/base';
import { ErrorType } from '../../src/types';

// Custom error classes for testing
class TestBusinessError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super({
      message,
      type: ErrorType.BUSINESS,
      code: 'TEST_BUSINESS_ERROR',
      details
    });
  }
}

class TestValidationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super({
      message,
      type: ErrorType.VALIDATION,
      code: 'TEST_VALIDATION_ERROR',
      details
    });
  }
}

class TestTechnicalError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super({
      message,
      type: ErrorType.TECHNICAL,
      code: 'TEST_TECHNICAL_ERROR',
      details
    });
  }
}

class TestExternalError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super({
      message,
      type: ErrorType.EXTERNAL,
      code: 'TEST_EXTERNAL_ERROR',
      details
    });
  }
}

// Test service with decorated methods
@Injectable()
@ClassifyError() // Class-level decorator to classify uncaught errors
class TestErrorService {
  // Method that throws a specific error type
  @WithErrorContext()
  throwBusinessError(param: string): never {
    throw new TestBusinessError('Business logic error', { param });
  }

  // Method that throws a validation error
  @WithErrorContext()
  throwValidationError(param: string): never {
    throw new TestValidationError('Invalid input', { param });
  }

  // Method that throws a technical error
  @WithErrorContext()
  throwTechnicalError(param: string): never {
    throw new TestTechnicalError('System error occurred', { param });
  }

  // Method that throws an external error
  @WithErrorContext()
  throwExternalError(param: string): never {
    throw new TestExternalError('External system failed', { param });
  }

  // Method that throws a generic error which should be classified
  @ClassifyError()
  throwGenericError(param: string): never {
    throw new Error(`Generic error with param: ${param}`);
  }

  // Method that transforms one error type to another
  @TransformError(Error, (err, context) => {
    return new TestBusinessError(`Transformed error: ${err.message}`, { 
      originalError: err.message,
      context 
    });
  })
  transformError(param: string): never {
    throw new Error(`Original error with param: ${param}`);
  }

  // Method with multiple decorators to test chaining
  @WithErrorContext()
  @ClassifyError()
  @TransformError(TestValidationError, (err) => {
    return new TestBusinessError(`Transformed from validation: ${err.message}`, {
      originalCode: err.code,
      originalType: err.type
    });
  })
  chainedDecorators(param: string): never {
    throw new TestValidationError(`Validation error with param: ${param}`);
  }
}

// Test controller that uses the service
@Controller('test-errors')
@UseFilters(GlobalExceptionFilter)
class TestErrorController {
  constructor(private readonly errorService: TestErrorService) {}

  @Get('business/:param')
  throwBusinessError(@Param('param') param: string) {
    return this.errorService.throwBusinessError(param);
  }

  @Get('validation/:param')
  throwValidationError(@Param('param') param: string) {
    return this.errorService.throwValidationError(param);
  }

  @Get('technical/:param')
  throwTechnicalError(@Param('param') param: string) {
    return this.errorService.throwTechnicalError(param);
  }

  @Get('external/:param')
  throwExternalError(@Param('param') param: string) {
    return this.errorService.throwExternalError(param);
  }

  @Get('generic/:param')
  throwGenericError(@Param('param') param: string) {
    return this.errorService.throwGenericError(param);
  }

  @Get('transform/:param')
  transformError(@Param('param') param: string) {
    return this.errorService.transformError(param);
  }

  @Get('chained/:param')
  chainedDecorators(@Param('param') param: string) {
    return this.errorService.chainedDecorators(param);
  }
}

// Test module
@Module({
  imports: [ErrorsModule],
  controllers: [TestErrorController],
  providers: [TestErrorService],
})
class TestAppModule {}

describe('Decorator and Middleware Integration', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    // Create a NestJS application for testing
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Set up request context middleware and global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Error Classification and Context', () => {
    it('should properly handle business errors with context', async () => {
      const param = 'test-param';
      const response = await request(app.getHttpServer())
        .get(`/test-errors/business/${param}`)
        .expect(422); // Unprocessable Entity for business errors

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(response.body.error).toHaveProperty('code', 'TEST_BUSINESS_ERROR');
      expect(response.body.error).toHaveProperty('message', 'Business logic error');
      expect(response.body.error.details).toHaveProperty('param', param);
    });

    it('should properly handle validation errors with context', async () => {
      const param = 'invalid-input';
      const response = await request(app.getHttpServer())
        .get(`/test-errors/validation/${param}`)
        .expect(400); // Bad Request for validation errors

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(response.body.error).toHaveProperty('code', 'TEST_VALIDATION_ERROR');
      expect(response.body.error).toHaveProperty('message', 'Invalid input');
      expect(response.body.error.details).toHaveProperty('param', param);
    });

    it('should properly handle technical errors with context', async () => {
      const param = 'system-error';
      const response = await request(app.getHttpServer())
        .get(`/test-errors/technical/${param}`)
        .expect(500); // Internal Server Error for technical errors

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('code', 'TEST_TECHNICAL_ERROR');
      expect(response.body.error).toHaveProperty('message', 'System error occurred');
      expect(response.body.error.details).toHaveProperty('param', param);
    });

    it('should properly handle external errors with context', async () => {
      const param = 'external-error';
      const response = await request(app.getHttpServer())
        .get(`/test-errors/external/${param}`)
        .expect(502); // Bad Gateway for external errors

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(response.body.error).toHaveProperty('code', 'TEST_EXTERNAL_ERROR');
      expect(response.body.error).toHaveProperty('message', 'External system failed');
      expect(response.body.error.details).toHaveProperty('param', param);
    });
  });

  describe('Error Classification for Generic Errors', () => {
    it('should classify generic errors as technical errors', async () => {
      const param = 'generic-error';
      const response = await request(app.getHttpServer())
        .get(`/test-errors/generic/${param}`)
        .expect(500); // Internal Server Error for technical errors

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
      expect(response.body.error.message).toContain('Generic error with param');
    });
  });

  describe('Error Transformation', () => {
    it('should transform errors according to the decorator configuration', async () => {
      const param = 'transform-test';
      const response = await request(app.getHttpServer())
        .get(`/test-errors/transform/${param}`)
        .expect(422); // Unprocessable Entity for business errors

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(response.body.error).toHaveProperty('code', 'TEST_BUSINESS_ERROR');
      expect(response.body.error.message).toContain('Transformed error');
      expect(response.body.error.details).toHaveProperty('originalError');
      expect(response.body.error.details.originalError).toContain(param);
    });
  });

  describe('Decorator Chaining', () => {
    it('should process decorators in the correct order', async () => {
      const param = 'chained-decorators';
      const response = await request(app.getHttpServer())
        .get(`/test-errors/chained/${param}`)
        .expect(422); // Unprocessable Entity for business errors

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(response.body.error).toHaveProperty('code', 'TEST_BUSINESS_ERROR');
      expect(response.body.error.message).toContain('Transformed from validation');
      expect(response.body.error.details).toHaveProperty('originalCode', 'TEST_VALIDATION_ERROR');
      expect(response.body.error.details).toHaveProperty('originalType', ErrorType.VALIDATION);
    });
  });
});
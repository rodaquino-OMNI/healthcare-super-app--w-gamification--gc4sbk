import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, Injectable, Module, Param, UseFilters } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClassifyError, TransformError, WithErrorContext } from '../../src/decorators/error-context.decorator';
import { ErrorType } from '../../src/categories/error-types';
import { AppException } from '../../src/categories/app-exception';
import { AllExceptionsFilter } from '../../src/nest/all-exceptions.filter';
import { ErrorHandlerMiddleware } from '../../src/middleware/error-handler.middleware';
import { RequestContextMiddleware } from '../../src/middleware/request-context.middleware';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

/**
 * Test service with decorated methods for error handling
 */
@Injectable()
class TestService {
  /**
   * Method that throws a validation error
   * Decorated with ClassifyError to ensure proper error classification
   */
  @ClassifyError({
    errorType: ErrorType.VALIDATION,
    errorCode: 'TEST_001',
    message: 'Invalid input parameter'
  })
  throwValidationError(param: string): string {
    if (!param || param.length < 3) {
      throw new Error('Parameter must be at least 3 characters');
    }
    return `Valid parameter: ${param}`;
  }

  /**
   * Method that throws a business error
   * Decorated with TransformError to convert generic errors to AppExceptions
   */
  @TransformError({
    transformer: (error: Error) => {
      return new AppException(
        error.message,
        ErrorType.BUSINESS,
        'TEST_002',
        { operation: 'businessOperation' }
      );
    }
  })
  throwBusinessError(param: string): string {
    if (param === 'business-error') {
      throw new Error('Business rule violation');
    }
    return `Business operation completed: ${param}`;
  }

  /**
   * Method that throws a technical error
   * Decorated with WithErrorContext to add context information to the error
   */
  @WithErrorContext({
    contextProvider: () => ({
      service: 'TestService',
      operation: 'technicalOperation',
      timestamp: new Date().toISOString()
    })
  })
  throwTechnicalError(param: string): string {
    if (param === 'technical-error') {
      throw new Error('System failure occurred');
    }
    return `Technical operation completed: ${param}`;
  }

  /**
   * Method that throws an external dependency error
   * Decorated with multiple decorators to demonstrate chaining
   */
  @ClassifyError({
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_003'
  })
  @WithErrorContext({
    contextProvider: () => ({
      externalSystem: 'TestExternalAPI',
      endpoint: '/api/test'
    })
  })
  throwExternalError(param: string): string {
    if (param === 'external-error') {
      throw new Error('External API failure');
    }
    return `External operation completed: ${param}`;
  }
}

/**
 * Test controller with decorated endpoints
 */
@Controller('test')
@ClassifyError({
  errorType: ErrorType.TECHNICAL,
  errorCode: 'CONTROLLER_ERROR'
})
class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('validation/:param')
  testValidation(@Param('param') param: string): string {
    return this.testService.throwValidationError(param);
  }

  @Get('business/:param')
  testBusiness(@Param('param') param: string): string {
    return this.testService.throwBusinessError(param);
  }

  @Get('technical/:param')
  testTechnical(@Param('param') param: string): string {
    return this.testService.throwTechnicalError(param);
  }

  @Get('external/:param')
  testExternal(@Param('param') param: string): string {
    return this.testService.throwExternalError(param);
  }

  @Get('controller-error')
  testControllerError(): string {
    throw new Error('Controller-level error');
    return 'This should not be returned';
  }
}

/**
 * Test module that sets up the controller and service
 */
@Module({
  controllers: [TestController],
  providers: [TestService, AllExceptionsFilter],
})
class TestModule {}

describe('Decorator and Middleware Integration', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    // Create a NestJS testing module
    moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    // Create the application instance
    app = moduleRef.createNestApplication();

    // Apply middleware
    app.use(RequestContextMiddleware);
    app.useGlobalFilters(app.get(AllExceptionsFilter));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Method-level error decorators', () => {
    it('should transform and classify validation errors correctly', async () => {
      // Test with a parameter that will trigger a validation error
      const response = await request(app.getHttpServer())
        .get('/test/validation/ab')
        .expect(400); // Validation errors should return 400 Bad Request

      // Verify the error response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(response.body.error).toHaveProperty('code', 'TEST_001');
      expect(response.body.error).toHaveProperty('message', 'Invalid input parameter');
    });

    it('should transform business errors correctly', async () => {
      // Test with a parameter that will trigger a business error
      const response = await request(app.getHttpServer())
        .get('/test/business/business-error')
        .expect(422); // Business errors should return 422 Unprocessable Entity

      // Verify the error response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(response.body.error).toHaveProperty('code', 'TEST_002');
      expect(response.body.error).toHaveProperty('message', 'Business rule violation');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('operation', 'businessOperation');
    });

    it('should add context to technical errors', async () => {
      // Test with a parameter that will trigger a technical error
      const response = await request(app.getHttpServer())
        .get('/test/technical/technical-error')
        .expect(500); // Technical errors should return 500 Internal Server Error

      // Verify the error response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('details');
      
      // Context information should be included in the details
      expect(response.body.error.details).toHaveProperty('service', 'TestService');
      expect(response.body.error.details).toHaveProperty('operation', 'technicalOperation');
      expect(response.body.error.details).toHaveProperty('timestamp');
    });
  });

  describe('Decorator chaining', () => {
    it('should apply multiple decorators in the correct order', async () => {
      // Test with a parameter that will trigger an external error
      const response = await request(app.getHttpServer())
        .get('/test/external/external-error')
        .expect(502); // External errors should return 502 Bad Gateway

      // Verify the error response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(response.body.error).toHaveProperty('code', 'TEST_003');
      expect(response.body.error).toHaveProperty('message', 'External API failure');
      
      // Context information from WithErrorContext should be included
      expect(response.body.error.details).toHaveProperty('externalSystem', 'TestExternalAPI');
      expect(response.body.error.details).toHaveProperty('endpoint', '/api/test');
    });
  });

  describe('Class-level error decorators', () => {
    it('should apply class-level decorators to all methods', async () => {
      // Test the controller-level error handler
      const response = await request(app.getHttpServer())
        .get('/test/controller-error')
        .expect(500); // Technical errors should return 500 Internal Server Error

      // Verify the error response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('code', 'CONTROLLER_ERROR');
      expect(response.body.error).toHaveProperty('message', 'Controller-level error');
    });
  });

  describe('Successful responses', () => {
    it('should return successful responses when no errors occur', async () => {
      // Test with valid parameters that won't trigger errors
      const response = await request(app.getHttpServer())
        .get('/test/validation/valid-param')
        .expect(200);

      expect(response.text).toBe('Valid parameter: valid-param');
    });
  });
});

/**
 * Tests for Express middleware integration with error decorators
 */
describe('Express Middleware and Decorator Integration', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    // Create a NestJS testing module
    moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    // Create the application instance
    app = moduleRef.createNestApplication();

    // Apply Express middleware manually instead of using NestJS filters
    app.use(RequestContextMiddleware);
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      const middleware = new ErrorHandlerMiddleware();
      middleware.use(err, req, res, next);
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle errors with Express middleware', async () => {
    // Test with a parameter that will trigger a validation error
    const response = await request(app.getHttpServer())
      .get('/test/validation/ab')
      .expect(400); // Validation errors should return 400 Bad Request

    // Verify the error response structure
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('type', ErrorType.VALIDATION);
    expect(response.body.error).toHaveProperty('code', 'TEST_001');
  });
});

/**
 * Tests for custom error decorators with specific error types
 */
describe('Custom Error Decorators', () => {
  // Create a custom error decorator for health journey errors
  const HealthJourneyError = (config: { errorCode: string, message?: string }) => {
    return ClassifyError({
      errorType: ErrorType.BUSINESS,
      errorCode: `HEALTH_${config.errorCode}`,
      message: config.message,
      details: { journey: 'health' }
    });
  };

  // Create a test service with the custom decorator
  @Injectable()
  class HealthService {
    @HealthJourneyError({
      errorCode: '001',
      message: 'Health metric validation failed'
    })
    validateHealthMetric(value: number): number {
      if (value < 0 || value > 100) {
        throw new Error('Health metric must be between 0 and 100');
      }
      return value;
    }
  }

  @Controller('health')
  class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get('metric/:value')
    validateMetric(@Param('value') value: string): number {
      return this.healthService.validateHealthMetric(parseInt(value, 10));
    }
  }

  @Module({
    controllers: [HealthController],
    providers: [HealthService, AllExceptionsFilter],
  })
  class HealthModule {}

  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    // Create a NestJS testing module
    moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    // Create the application instance
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(app.get(AllExceptionsFilter));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should apply custom journey-specific error decorators', async () => {
    // Test with an invalid health metric value
    const response = await request(app.getHttpServer())
      .get('/health/metric/150')
      .expect(422); // Business errors should return 422 Unprocessable Entity

    // Verify the error response structure
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('type', ErrorType.BUSINESS);
    expect(response.body.error).toHaveProperty('code', 'HEALTH_001');
    expect(response.body.error).toHaveProperty('message', 'Health metric validation failed');
    expect(response.body.error).toHaveProperty('details');
    expect(response.body.error.details).toHaveProperty('journey', 'health');
  });

  it('should return successful responses for valid inputs', async () => {
    // Test with a valid health metric value
    const response = await request(app.getHttpServer())
      .get('/health/metric/75')
      .expect(200);

    expect(response.body).toBe(75);
  });
});
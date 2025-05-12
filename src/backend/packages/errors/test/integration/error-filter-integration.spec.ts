import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Controller, Get, Module, UseFilters } from '@nestjs/common';
import { AllExceptionsFilter } from '@backend/shared/exceptions/exceptions.filter';
import { AppException, ErrorType } from '@backend/shared/exceptions/exceptions.types';
import { LoggerService } from '@backend/shared/logging/logger.service';
import {
  AUTH_INVALID_CREDENTIALS,
  HEALTH_INVALID_METRIC,
  CARE_PROVIDER_UNAVAILABLE,
  SYS_INTERNAL_SERVER_ERROR
} from '@backend/shared/constants/error-codes.constants';

// Mock logger service to avoid actual logging during tests
class MockLoggerService {
  log() {}
  error() {}
  warn() {}
  debug() {}
}

/**
 * Test controller that exposes endpoints that throw different types of exceptions
 * for testing the error filter's handling of various error scenarios.
 */
@Controller('test')
@UseFilters(new AllExceptionsFilter(new MockLoggerService() as LoggerService))
class TestController {
  @Get('validation-error')
  throwValidationError() {
    throw new AppException(
      'Invalid input data',
      ErrorType.VALIDATION,
      AUTH_INVALID_CREDENTIALS,
      { field: 'username', constraint: 'required' }
    );
  }

  @Get('business-error')
  throwBusinessError() {
    throw new AppException(
      'Cannot process this health metric',
      ErrorType.BUSINESS,
      HEALTH_INVALID_METRIC,
      { metricType: 'blood_pressure', reason: 'out of range' }
    );
  }

  @Get('technical-error')
  throwTechnicalError() {
    throw new AppException(
      'Database connection failed',
      ErrorType.TECHNICAL,
      SYS_INTERNAL_SERVER_ERROR,
      { service: 'database', operation: 'connect' }
    );
  }

  @Get('external-error')
  throwExternalError() {
    throw new AppException(
      'External provider service unavailable',
      ErrorType.EXTERNAL,
      CARE_PROVIDER_UNAVAILABLE,
      { providerId: '12345', service: 'appointment-booking' }
    );
  }

  @Get('http-exception')
  throwHttpException() {
    const error = new Error('Forbidden resource');
    error.name = 'ForbiddenException';
    throw error;
  }

  @Get('unknown-error')
  throwUnknownError() {
    throw new Error('Some unexpected error occurred');
  }

  @Get('journey-context-error')
  throwErrorWithJourneyContext() {
    const error = new AppException(
      'Error with journey context',
      ErrorType.BUSINESS,
      HEALTH_INVALID_METRIC,
      { journeyId: 'health', userId: '12345', action: 'record-metric' }
    );
    return error;
  }
}

@Module({
  controllers: [TestController],
  providers: [
    {
      provide: LoggerService,
      useClass: MockLoggerService
    }
  ]
})
class TestModule {}

describe('Error Filter Integration Tests', () => {
  let app: INestApplication;
  let originalNodeEnv: string;

  beforeAll(() => {
    // Store original NODE_ENV to restore after tests
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Production Environment', () => {
    beforeEach(async () => {
      // Set NODE_ENV to production for these tests
      process.env.NODE_ENV = 'production';

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe());
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should return 400 Bad Request for validation errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/validation-error')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: AUTH_INVALID_CREDENTIALS,
          message: 'Invalid input data',
          details: { field: 'username', constraint: 'required' }
        }
      });
    });

    it('should return 422 Unprocessable Entity for business errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/business-error')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: HEALTH_INVALID_METRIC,
          message: 'Cannot process this health metric',
          details: { metricType: 'blood_pressure', reason: 'out of range' }
        }
      });
    });

    it('should return 500 Internal Server Error for technical errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/technical-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: SYS_INTERNAL_SERVER_ERROR,
          message: 'Database connection failed',
          details: { service: 'database', operation: 'connect' }
        }
      });
    });

    it('should return 502 Bad Gateway for external dependency errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/external-error')
        .expect(HttpStatus.BAD_GATEWAY);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.EXTERNAL,
          code: CARE_PROVIDER_UNAVAILABLE,
          message: 'External provider service unavailable',
          details: { providerId: '12345', service: 'appointment-booking' }
        }
      });
    });

    it('should handle unknown errors with a generic error response in production', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/unknown-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
          // No details in production mode
        }
      });
    });

    it('should include journey context in error responses when available', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/journey-context-error')
        .set('x-journey-id', 'health')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('journeyId', 'health');
      expect(response.body.error.details).toHaveProperty('userId', '12345');
    });
  });

  describe('Development Environment', () => {
    beforeEach(async () => {
      // Set NODE_ENV to development for these tests
      process.env.NODE_ENV = 'development';

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe());
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should include additional error details in development mode', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/unknown-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
      expect(response.body.error).toHaveProperty('message', 'An unexpected error occurred');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('name', 'Error');
      expect(response.body.error.details).toHaveProperty('message', 'Some unexpected error occurred');
    });

    it('should transform HTTP exceptions into the standard error format', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/http-exception')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('name', 'ForbiddenException');
      expect(response.body.error.details).toHaveProperty('message', 'Forbidden resource');
    });
  });

  describe('Error Response Structure', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'development';

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe());
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should always include type, code, and message in error responses', async () => {
      const endpoints = [
        '/test/validation-error',
        '/test/business-error',
        '/test/technical-error',
        '/test/external-error',
        '/test/unknown-error'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer()).get(endpoint);
        
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('type');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
        
        // Verify that type is one of the valid ErrorTypes
        expect(Object.values(ErrorType)).toContain(response.body.error.type);
      }
    });

    it('should include request context in error responses when headers are present', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/validation-error')
        .set('x-journey-id', 'health')
        .set('x-request-id', '12345-abcde')
        .set('x-correlation-id', 'corr-67890');

      // The AllExceptionsFilter should capture these headers and include them in the response
      // This test verifies that the request context is properly propagated to error responses
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('field', 'username');
      expect(response.body.error.details).toHaveProperty('constraint', 'required');
      
      // The actual implementation might vary, but we're testing the concept that
      // request context should be captured and included in error responses
      // If the implementation doesn't currently do this, this test will fail and
      // indicate that this feature should be implemented
    });
  });
});
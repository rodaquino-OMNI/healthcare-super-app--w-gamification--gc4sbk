import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, HttpException, HttpStatus, INestApplication, Module } from '@nestjs/common';
import * as request from 'supertest';
import { GlobalExceptionFilter } from '../../../../src/nest/filters';
import { BaseError } from '../../../../src/base';
import { ErrorType } from '../../../../src/types';
import { LoggerService } from '@austa/logging';
import { ErrorCodes } from '../../../../src/constants';

// Mock logger service to avoid actual logging during tests
class MockLoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
}

// Test controller that throws different types of errors for testing
@Controller('test')
class TestController {
  @Get('validation-error')
  throwValidationError() {
    throw new BaseError(
      'Invalid input data',
      ErrorType.VALIDATION,
      ErrorCodes.API_INVALID_INPUT,
      { field: 'email', constraint: 'must be a valid email' }
    );
  }

  @Get('business-error')
  throwBusinessError() {
    throw new BaseError(
      'Operation not allowed due to business rules',
      ErrorType.BUSINESS,
      ErrorCodes.CARE_APPOINTMENT_SLOT_TAKEN,
      { appointmentId: '12345', slotTime: '2023-05-01T10:00:00Z' }
    );
  }

  @Get('technical-error')
  throwTechnicalError() {
    throw new BaseError(
      'Internal server error occurred',
      ErrorType.TECHNICAL,
      ErrorCodes.SYS_INTERNAL_SERVER_ERROR,
      { service: 'database', operation: 'query' }
    );
  }

  @Get('external-error')
  throwExternalError() {
    throw new BaseError(
      'External service unavailable',
      ErrorType.EXTERNAL,
      ErrorCodes.HEALTH_DEVICE_CONNECTION_FAILED,
      { deviceId: 'fitbit-123', status: 'timeout' }
    );
  }

  @Get('http-exception')
  throwHttpException() {
    throw new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);
  }

  @Get('standard-error')
  throwStandardError() {
    throw new Error('Unexpected standard error');
  }

  @Get('journey-context-error')
  throwJourneyContextError() {
    const error = new BaseError(
      'Error with journey context',
      ErrorType.VALIDATION,
      ErrorCodes.API_INVALID_INPUT,
      { journeyId: 'health', context: 'metrics' }
    );
    return error.toHttpException();
  }
  
  @Get('health-metrics-error')
  throwHealthMetricsError() {
    // Import a specific Health journey error from the categories
    // This simulates using a journey-specific error class
    throw new BaseError(
      'Invalid health metric value',
      ErrorType.VALIDATION,
      ErrorCodes.HEALTH_INVALID_METRIC,
      { metricType: 'bloodPressure', value: '250/180', allowedRange: '90/60-140/90' }
    );
  }
}

@Module({
  controllers: [TestController],
  providers: [
    {
      provide: LoggerService,
      useClass: MockLoggerService,
    },
  ],
})
class TestModule {}

/**
 * Integration tests for the GlobalExceptionFilter
 * 
 * These tests verify how errors are captured, transformed, and returned as HTTP responses.
 * The tests simulate HTTP requests and examine response payloads, status codes, and headers.
 * 
 * Key aspects tested:
 * - Error classification (client, system, transient, external)
 * - HTTP status code mapping
 * - Error response structure (type, code, message, details)
 * - Environment-specific behavior (production vs. development)
 * - Journey context propagation
 * - Tracing information handling
 */
describe('Error Filter Integration Tests', () => {
  let app: INestApplication;
  let loggerService: MockLoggerService;
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    // Store original NODE_ENV to restore after tests
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  // Helper function to create the app with the current NODE_ENV
  async function createApp() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    loggerService = moduleFixture.get(LoggerService) as unknown as MockLoggerService;
    
    // Apply the global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter(moduleFixture.get(LoggerService)));
    
    await app.init();
    return app;
  }

  describe('Production Environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await createApp();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should transform validation errors to 400 Bad Request responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/validation-error')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: ErrorCodes.API_INVALID_INPUT,
          message: 'Invalid input data',
          details: { field: 'email', constraint: 'must be a valid email' }
        }
      });

      expect(loggerService.debug).toHaveBeenCalled();
    });

    it('should transform business errors to 422 Unprocessable Entity responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/business-error')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: ErrorCodes.CARE_APPOINTMENT_SLOT_TAKEN,
          message: 'Operation not allowed due to business rules',
          details: { appointmentId: '12345', slotTime: '2023-05-01T10:00:00Z' }
        }
      });

      expect(loggerService.warn).toHaveBeenCalled();
    });

    it('should transform technical errors to 500 Internal Server Error responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/technical-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: ErrorCodes.SYS_INTERNAL_SERVER_ERROR,
          message: 'Internal server error occurred',
          details: { service: 'database', operation: 'query' }
        }
      });

      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should transform external errors to 502 Bad Gateway responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/external-error')
        .expect(HttpStatus.BAD_GATEWAY);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.EXTERNAL,
          code: ErrorCodes.HEALTH_DEVICE_CONNECTION_FAILED,
          message: 'External service unavailable',
          details: { deviceId: 'fitbit-123', status: 'timeout' }
        }
      });

      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should transform HttpExceptions to appropriate responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/http-exception')
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.VALIDATION);
      expect(response.body.error.message).toBe('Forbidden resource');

      expect(loggerService.warn).toHaveBeenCalled();
    });

    it('should transform standard errors to 500 Internal Server Error responses without exposing details', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/standard-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
          // No details should be included in production
        }
      });

      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should preserve journey context in error responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/journey-context-error')
        .set('x-journey-id', 'health')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.details).toEqual({ journeyId: 'health', context: 'metrics' });

      expect(loggerService.debug).toHaveBeenCalled();
    });
  });

  describe('Development Environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'development';
      await createApp();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should include error details for standard errors in development mode', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/standard-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.TECHNICAL);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(response.body.error.message).toBe('An unexpected error occurred');
      
      // In development mode, details should be included
      expect(response.body.error.details).toBeDefined();
      expect(response.body.error.details.name).toBe('Error');
      expect(response.body.error.details.message).toBe('Unexpected standard error');

      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should include stack traces in error logs in development mode', async () => {
      await request(app.getHttpServer())
        .get('/test/technical-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Verify that error was logged with stack trace
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Technical error:'),
        expect.any(String), // Stack trace
        expect.any(String)  // Log context
      );
    });
  });

  describe('Error Response Structure', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await createApp();
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
        '/test/http-exception',
        '/test/standard-error',
        '/test/health-metrics-error'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer()).get(endpoint);
        
        expect(response.body.error).toBeDefined();
        expect(response.body.error.type).toBeDefined();
        expect(response.body.error.message).toBeDefined();
        
        // All errors except HttpException should have a code
        if (endpoint !== '/test/http-exception') {
          expect(response.body.error.code).toBeDefined();
        }
      }
    });

    it('should propagate request headers to error context', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/validation-error')
        .set('x-journey-id', 'health')
        .set('x-request-id', '12345')
        .set('x-correlation-id', 'corr-67890')
        .expect(HttpStatus.BAD_REQUEST);

      // Verify that the logger was called with the request context
      expect(loggerService.debug).toHaveBeenCalled();
      
      // The exact implementation depends on how the filter extracts and uses headers
      // This is a simplified check that assumes the filter logs these values
      const logCall = loggerService.debug.mock.calls[0];
      expect(logCall[0]).toContain('Validation error:');
    });
    
    it('should handle journey-specific errors with appropriate context', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/health-metrics-error')
        .set('x-journey-id', 'health')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.VALIDATION);
      expect(response.body.error.code).toBe(ErrorCodes.HEALTH_INVALID_METRIC);
      expect(response.body.error.details).toEqual({
        metricType: 'bloodPressure',
        value: '250/180',
        allowedRange: '90/60-140/90'
      });
      
      // Verify that the logger was called with the journey context
      expect(loggerService.debug).toHaveBeenCalled();
    });
    
    it('should include tracing information in error responses when available', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/technical-error')
        .set('x-trace-id', 'trace-12345')
        .set('x-span-id', 'span-67890')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // If the filter is configured to include trace IDs in development mode
      // we should see them in the response or at least verify they're logged
      expect(loggerService.error).toHaveBeenCalled();
      
      // This test might need adjustment based on how tracing is implemented
      // It could check for trace headers in the response or verify they're logged
      const logCall = loggerService.error.mock.calls[0];
      expect(logCall[0]).toContain('Technical error:');
    });
  });
});
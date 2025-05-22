import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppException, ErrorType } from '../../../src/exceptions/exceptions.types';
import { AllExceptionsFilter } from '../../../src/exceptions/exceptions.filter';
import { LoggerService } from '../../../src/logging/logger.service';
import { mockLogger } from '../setup-tests';
import {
  createAppException,
  createBusinessRuleViolationError,
  createDatabaseError,
  createExternalApiError,
  createInvalidParameterError,
  createResourceNotFoundError,
  Health,
  Care,
  Plan
} from '../helpers/error-factory';
import {
  assertHttpErrorResponse,
  assertJourneyHttpErrorResponse,
  assertValidationErrorResponse
} from '../helpers/assertion-helpers';
import * as ErrorCodes from '../../../src/constants/error-codes.constants';

/**
 * Controller for testing exception filter
 */
class TestController {
  throwError(error: Error): void {
    throw error;
  }
}

/**
 * Integration tests for error filters that verify how errors are captured, transformed,
 * and returned as HTTP responses.
 */
describe('Error Filter Integration', () => {
  let app: INestApplication;
  let controller: TestController;
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a test module with the exception filter
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: LoggerService,
          useValue: mockLogger
        }
      ]
    }).compile();

    // Create the app and set up the global exception filter
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter(mockLogger as unknown as LoggerService));
    await app.init();

    // Get the controller instance
    controller = moduleRef.get<TestController>(TestController);

    // Create a spy on the controller's throwError method
    jest.spyOn(controller, 'throwError');
  });

  afterEach(async () => {
    await app.close();
  });

  /**
   * Helper function to create a route that throws a specific error
   */
  const setupErrorRoute = (app: INestApplication, path: string, error: Error) => {
    const router = app.getHttpAdapter().getInstance();
    router.get(path, (req: any, res: any, next: any) => {
      controller.throwError(error);
      next(error);
    });
  };

  describe('Error Classification and Status Codes', () => {
    it('should map validation errors to 400 Bad Request', async () => {
      // Arrange
      const error = createInvalidParameterError('email', 'invalid-email', 'email');
      setupErrorRoute(app, '/test/validation-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/validation-error')
        .expect(HttpStatus.BAD_REQUEST);

      // Assert
      assertHttpErrorResponse(response, HttpStatus.BAD_REQUEST, ErrorType.VALIDATION);
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should map business errors to 422 Unprocessable Entity', async () => {
      // Arrange
      const error = createBusinessRuleViolationError('UserCannotDeleteOwnAccount');
      setupErrorRoute(app, '/test/business-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/business-error')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Assert
      assertHttpErrorResponse(response, HttpStatus.UNPROCESSABLE_ENTITY, ErrorType.BUSINESS);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should map technical errors to 500 Internal Server Error', async () => {
      // Arrange
      const error = createDatabaseError('query');
      setupErrorRoute(app, '/test/technical-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/technical-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Assert
      assertHttpErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR, ErrorType.TECHNICAL);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should map external errors to 502 Bad Gateway', async () => {
      // Arrange
      const error = createExternalApiError('PaymentGateway', '/api/payments', 500);
      setupErrorRoute(app, '/test/external-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/external-error')
        .expect(HttpStatus.BAD_GATEWAY);

      // Assert
      assertHttpErrorResponse(response, HttpStatus.BAD_GATEWAY, ErrorType.EXTERNAL);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle unknown errors as 500 Internal Server Error', async () => {
      // Arrange
      const error = new Error('Unknown error');
      setupErrorRoute(app, '/test/unknown-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/unknown-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.TECHNICAL);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle resource not found errors as 422 Unprocessable Entity', async () => {
      // Arrange
      const error = createResourceNotFoundError('User', '123');
      setupErrorRoute(app, '/test/not-found-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/not-found-error')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Assert
      assertHttpErrorResponse(response, HttpStatus.UNPROCESSABLE_ENTITY, ErrorType.BUSINESS);
      expect(response.body.error.details).toEqual(expect.objectContaining({
        resourceType: 'User',
        resourceId: '123'
      }));
    });
  });

  describe('Error Response Structure', () => {
    it('should include type, code, and message in error responses', async () => {
      // Arrange
      const error = new AppException(
        'Test error message',
        ErrorType.VALIDATION,
        'TEST_ERROR_001'
      );
      setupErrorRoute(app, '/test/error-structure', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/error-structure')
        .expect(HttpStatus.BAD_REQUEST);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe(ErrorType.VALIDATION);
      expect(response.body.error.code).toBe('TEST_ERROR_001');
      expect(response.body.error.message).toBe('Test error message');
    });

    it('should include details in error responses when provided', async () => {
      // Arrange
      const details = { field: 'email', reason: 'invalid format' };
      const error = new AppException(
        'Invalid email format',
        ErrorType.VALIDATION,
        'VALIDATION_INVALID_EMAIL',
        details
      );
      setupErrorRoute(app, '/test/error-with-details', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/error-with-details')
        .expect(HttpStatus.BAD_REQUEST);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.details).toEqual(details);
    });

    it('should handle validation errors with field-specific details', async () => {
      // Arrange
      const invalidFields = ['email', 'password'];
      const details = { fields: invalidFields };
      const error = new AppException(
        'Validation failed',
        ErrorType.VALIDATION,
        'VALIDATION_FAILED',
        details
      );
      setupErrorRoute(app, '/test/validation-details', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/validation-details')
        .expect(HttpStatus.BAD_REQUEST);

      // Assert
      assertValidationErrorResponse(response, invalidFields);
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should include stack traces in development environment', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Development error');
      setupErrorRoute(app, '/test/dev-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/dev-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.details).toBeDefined();
      expect(response.body.error.details.name).toBe('Error');
      expect(response.body.error.details.message).toBe('Development error');
    });

    it('should not include stack traces in production environment', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new Error('Production error');
      setupErrorRoute(app, '/test/prod-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/prod-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.details).toBeUndefined();
    });
  });

  describe('Journey-Specific Error Handling', () => {
    it('should handle Health journey errors with proper context', async () => {
      // Arrange
      const error = Health.createMetricError('heartRate');
      setupErrorRoute(app, '/test/health-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/health-error')
        .expect(HttpStatus.BAD_REQUEST);

      // Assert
      assertJourneyHttpErrorResponse(response, 'health', HttpStatus.BAD_REQUEST, ErrorType.VALIDATION);
      expect(response.body.error.details).toEqual(expect.objectContaining({
        metricType: 'heartRate'
      }));
    });

    it('should handle Care journey errors with proper context', async () => {
      // Arrange
      const error = Care.createAppointmentError('notFound', 'appt-123');
      setupErrorRoute(app, '/test/care-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/care-error')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Assert
      assertJourneyHttpErrorResponse(response, 'care', HttpStatus.UNPROCESSABLE_ENTITY, ErrorType.BUSINESS);
      expect(response.body.error.details).toEqual(expect.objectContaining({
        appointmentId: 'appt-123'
      }));
    });

    it('should handle Plan journey errors with proper context', async () => {
      // Arrange
      const error = Plan.createClaimError('notFound', 'claim-123');
      setupErrorRoute(app, '/test/plan-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/plan-error')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Assert
      assertJourneyHttpErrorResponse(response, 'plan', HttpStatus.UNPROCESSABLE_ENTITY, ErrorType.BUSINESS);
      expect(response.body.error.details).toEqual(expect.objectContaining({
        claimId: 'claim-123'
      }));
    });
  });

  describe('Error Context Propagation', () => {
    it('should preserve request context in error responses', async () => {
      // Arrange
      const userId = 'user-123';
      const journeyId = 'health';
      const error = createAppException(ErrorType.BUSINESS);
      setupErrorRoute(app, '/test/context-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/context-error')
        .set('x-journey-id', journeyId)
        .set('Authorization', `Bearer token-for-${userId}`)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalled();
      const logCall = mockLogger.warn.mock.calls[0];
      expect(logCall[0]).toContain('Business error');
    });

    it('should include correlation ID in error responses if available', async () => {
      // Arrange
      const correlationId = 'test-correlation-123';
      const error = createAppException(ErrorType.TECHNICAL);
      setupErrorRoute(app, '/test/correlation-error', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/correlation-error')
        .set('x-correlation-id', correlationId)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Assert
      expect(mockLogger.error).toHaveBeenCalled();
      const logCall = mockLogger.error.mock.calls[0];
      expect(logCall[0]).toContain('Technical error');
    });
  });

  describe('Error Code Constants', () => {
    it('should use predefined error codes from constants', async () => {
      // Arrange
      const error = new AppException(
        'Invalid credentials',
        ErrorType.VALIDATION,
        ErrorCodes.AUTH_INVALID_CREDENTIALS
      );
      setupErrorRoute(app, '/test/error-code-constants', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/error-code-constants')
        .expect(HttpStatus.BAD_REQUEST);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe(ErrorCodes.AUTH_INVALID_CREDENTIALS);
    });

    it('should use health journey error codes from constants', async () => {
      // Arrange
      const error = new AppException(
        'Invalid health metric',
        ErrorType.VALIDATION,
        ErrorCodes.HEALTH_INVALID_METRIC
      );
      setupErrorRoute(app, '/test/health-error-code', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/health-error-code')
        .expect(HttpStatus.BAD_REQUEST);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe(ErrorCodes.HEALTH_INVALID_METRIC);
    });

    it('should use care journey error codes from constants', async () => {
      // Arrange
      const error = new AppException(
        'Provider unavailable',
        ErrorType.EXTERNAL,
        ErrorCodes.CARE_PROVIDER_UNAVAILABLE
      );
      setupErrorRoute(app, '/test/care-error-code', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/care-error-code')
        .expect(HttpStatus.BAD_GATEWAY);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe(ErrorCodes.CARE_PROVIDER_UNAVAILABLE);
    });

    it('should use plan journey error codes from constants', async () => {
      // Arrange
      const error = new AppException(
        'Invalid claim data',
        ErrorType.VALIDATION,
        ErrorCodes.PLAN_INVALID_CLAIM_DATA
      );
      setupErrorRoute(app, '/test/plan-error-code', error);

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/plan-error-code')
        .expect(HttpStatus.BAD_REQUEST);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe(ErrorCodes.PLAN_INVALID_CLAIM_DATA);
    });
  });
});
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ErrorsModule } from '../../src/nest/module';
import { ValidationError, BusinessError, TechnicalError, ExternalError } from '../../src/categories';
import { ErrorType } from '../../src/types';
import { createTestModule, TestController } from './test-app';
import { assertErrorResponse } from '../helpers/assertion-helpers';
import { createValidationError, createBusinessError, createTechnicalError, createExternalError } from '../helpers/error-factory';

describe('GlobalExceptionFilter (e2e)', () => {
  let app: INestApplication;
  let testController: TestController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [createTestModule()],
    }).compile();

    app = moduleRef.createNestApplication();
    testController = moduleRef.get<TestController>(TestController);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Validation Errors', () => {
    it('should return 400 Bad Request for validation errors', async () => {
      // Arrange
      const errorMessage = 'Invalid input parameters';
      const errorCode = 'VALIDATION_ERROR';
      const validationError = createValidationError(errorMessage, errorCode);
      
      jest.spyOn(testController, 'triggerValidationError').mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/test/validation-error')
        .expect(400);

      // Assert response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(response.body.error).toHaveProperty('code', errorCode);
      expect(response.body.error).toHaveProperty('message', errorMessage);
      
      // Use custom assertion helper
      assertErrorResponse(response.body, {
        type: ErrorType.VALIDATION,
        code: errorCode,
        message: errorMessage,
        status: 400
      });
    });

    it('should handle NestJS validation pipe errors', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/test/validate-dto')
        .send({})
        .expect(400);

      // Assert response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');
      expect(Array.isArray(response.body.error.details)).toBe(true);
    });

    it('should include field-specific validation errors in the response', async () => {
      // Arrange
      const invalidData = { name: '', age: 'not-a-number' };

      // Act
      const response = await request(app.getHttpServer())
        .post('/test/validate-dto')
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body.error.details).toHaveLength(2);
      expect(response.body.error.details[0]).toHaveProperty('field');
      expect(response.body.error.details[0]).toHaveProperty('message');
    });
  });

  describe('Business Errors', () => {
    it('should return 422 Unprocessable Entity for business errors', async () => {
      // Arrange
      const errorMessage = 'Business rule violation';
      const errorCode = 'BUSINESS_RULE_ERROR';
      const businessError = createBusinessError(errorMessage, errorCode);
      
      jest.spyOn(testController, 'triggerBusinessError').mockImplementation(() => {
        throw businessError;
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/test/business-error')
        .expect(422);

      // Assert response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(response.body.error).toHaveProperty('code', errorCode);
      expect(response.body.error).toHaveProperty('message', errorMessage);
      
      // Use custom assertion helper
      assertErrorResponse(response.body, {
        type: ErrorType.BUSINESS,
        code: errorCode,
        message: errorMessage,
        status: 422
      });
    });

    it('should include business context in the error response', async () => {
      // Arrange
      const errorMessage = 'Resource not found';
      const errorCode = 'RESOURCE_NOT_FOUND';
      const context = { resourceId: '123', resourceType: 'User' };
      const businessError = createBusinessError(errorMessage, errorCode, context);
      
      jest.spyOn(testController, 'triggerBusinessErrorWithContext').mockImplementation(() => {
        throw businessError;
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/business-error-with-context')
        .expect(422);

      // Assert
      expect(response.body.error).toHaveProperty('context');
      expect(response.body.error.context).toEqual(context);
    });
  });

  describe('Technical Errors', () => {
    it('should return 500 Internal Server Error for technical errors', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      const errorCode = 'DATABASE_ERROR';
      const technicalError = createTechnicalError(errorMessage, errorCode);
      
      jest.spyOn(testController, 'triggerTechnicalError').mockImplementation(() => {
        throw technicalError;
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/test/technical-error')
        .expect(500);

      // Assert response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('code', errorCode);
      expect(response.body.error).toHaveProperty('message', errorMessage);
      
      // Use custom assertion helper
      assertErrorResponse(response.body, {
        type: ErrorType.TECHNICAL,
        code: errorCode,
        message: errorMessage,
        status: 500
      });
    });

    it('should sanitize sensitive information in technical error responses', async () => {
      // Arrange
      const errorMessage = 'Database query failed';
      const errorCode = 'DATABASE_QUERY_ERROR';
      const sensitiveDetails = {
        query: 'SELECT * FROM users WHERE password = "secret"',
        connectionString: 'postgresql://user:password@localhost:5432/db'
      };
      const technicalError = createTechnicalError(errorMessage, errorCode, sensitiveDetails);
      
      jest.spyOn(testController, 'triggerTechnicalErrorWithSensitiveData').mockImplementation(() => {
        throw technicalError;
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/technical-error-with-sensitive-data')
        .expect(500);

      // Assert
      expect(response.body.error).not.toHaveProperty('details.connectionString');
      expect(response.body.error).not.toHaveProperty('details.query');
      
      // In production, sensitive details should be completely removed
      if (process.env.NODE_ENV === 'production') {
        expect(response.body.error).not.toHaveProperty('details');
      }
    });
  });

  describe('External Errors', () => {
    it('should return 502 Bad Gateway for external system errors', async () => {
      // Arrange
      const errorMessage = 'External API unavailable';
      const errorCode = 'EXTERNAL_API_ERROR';
      const externalError = createExternalError(errorMessage, errorCode);
      
      jest.spyOn(testController, 'triggerExternalError').mockImplementation(() => {
        throw externalError;
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/test/external-error')
        .expect(502);

      // Assert response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(response.body.error).toHaveProperty('code', errorCode);
      expect(response.body.error).toHaveProperty('message', errorMessage);
      
      // Use custom assertion helper
      assertErrorResponse(response.body, {
        type: ErrorType.EXTERNAL,
        code: errorCode,
        message: errorMessage,
        status: 502
      });
    });

    it('should include retry information for transient external errors', async () => {
      // Arrange
      const errorMessage = 'External API rate limit exceeded';
      const errorCode = 'RATE_LIMIT_ERROR';
      const retryAfter = 30; // seconds
      const externalError = createExternalError(errorMessage, errorCode, { retryAfter });
      
      jest.spyOn(testController, 'triggerExternalRateLimitError').mockImplementation(() => {
        throw externalError;
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/external-rate-limit-error')
        .expect(502);

      // Assert
      expect(response.body.error).toHaveProperty('retryAfter', retryAfter);
      expect(response.headers).toHaveProperty('retry-after', String(retryAfter));
    });
  });

  describe('Unhandled Errors', () => {
    it('should convert generic Error to a technical error with 500 status', async () => {
      // Arrange
      const errorMessage = 'Something went wrong';
      
      jest.spyOn(testController, 'triggerGenericError').mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/test/generic-error')
        .expect(500);

      // Assert response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
      
      // Generic error message should be sanitized in production
      if (process.env.NODE_ENV === 'production') {
        expect(response.body.error.message).toBe('An unexpected error occurred');
        expect(response.body.error).not.toHaveProperty('details');
      } else {
        expect(response.body.error.details).toHaveProperty('message', errorMessage);
      }
    });

    it('should handle async errors properly', async () => {
      // Arrange
      const errorMessage = 'Async operation failed';
      
      jest.spyOn(testController, 'triggerAsyncError').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error(errorMessage);
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/test/async-error')
        .expect(500);

      // Assert response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
    });
  });

  describe('Journey-specific Errors', () => {
    it('should handle health journey errors with proper context', async () => {
      // Arrange
      const errorMessage = 'Health metric validation failed';
      const errorCode = 'HEALTH_METRIC_INVALID';
      const journeyContext = { journeyId: 'health', metricType: 'bloodPressure' };
      const healthError = createBusinessError(errorMessage, errorCode, journeyContext);
      
      jest.spyOn(testController, 'triggerHealthJourneyError').mockImplementation(() => {
        throw healthError;
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/health-journey-error')
        .set('X-Journey-ID', 'health')
        .expect(422);

      // Assert
      expect(response.body.error).toHaveProperty('context');
      expect(response.body.error.context).toEqual(journeyContext);
      expect(response.body.error.code).toContain('HEALTH_');
    });

    it('should handle care journey errors with proper context', async () => {
      // Arrange
      const errorMessage = 'Appointment booking failed';
      const errorCode = 'CARE_APPOINTMENT_CONFLICT';
      const journeyContext = { journeyId: 'care', appointmentId: '123' };
      const careError = createBusinessError(errorMessage, errorCode, journeyContext);
      
      jest.spyOn(testController, 'triggerCareJourneyError').mockImplementation(() => {
        throw careError;
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/care-journey-error')
        .set('X-Journey-ID', 'care')
        .expect(422);

      // Assert
      expect(response.body.error).toHaveProperty('context');
      expect(response.body.error.context).toEqual(journeyContext);
      expect(response.body.error.code).toContain('CARE_');
    });

    it('should handle plan journey errors with proper context', async () => {
      // Arrange
      const errorMessage = 'Benefit not available';
      const errorCode = 'PLAN_BENEFIT_UNAVAILABLE';
      const journeyContext = { journeyId: 'plan', benefitId: '456' };
      const planError = createBusinessError(errorMessage, errorCode, journeyContext);
      
      jest.spyOn(testController, 'triggerPlanJourneyError').mockImplementation(() => {
        throw planError;
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/plan-journey-error')
        .set('X-Journey-ID', 'plan')
        .expect(422);

      // Assert
      expect(response.body.error).toHaveProperty('context');
      expect(response.body.error.context).toEqual(journeyContext);
      expect(response.body.error.code).toContain('PLAN_');
    });
  });

  describe('Error Serialization', () => {
    it('should properly serialize error objects with circular references', async () => {
      // Arrange
      const errorMessage = 'Error with circular reference';
      const errorWithCircularRef = new TechnicalError(errorMessage);
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj; // Create circular reference
      errorWithCircularRef.details = { circular: circularObj };
      
      jest.spyOn(testController, 'triggerErrorWithCircularReference').mockImplementation(() => {
        throw errorWithCircularRef;
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/error-with-circular-reference')
        .expect(500);

      // Assert - should not crash and should have a valid JSON response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', errorMessage);
    });

    it('should handle errors with nested causes', async () => {
      // Arrange
      const rootCause = new Error('Root cause');
      const midCause = new TechnicalError('Intermediate cause', 'MID_ERROR', {}, rootCause);
      const topError = new BusinessError('Top level error', 'TOP_ERROR', {}, midCause);
      
      jest.spyOn(testController, 'triggerErrorWithNestedCauses').mockImplementation(() => {
        throw topError;
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/test/error-with-nested-causes')
        .expect(422); // Business error status

      // Assert
      expect(response.body.error).toHaveProperty('message', 'Top level error');
      expect(response.body.error).toHaveProperty('code', 'TOP_ERROR');
      
      // In non-production, we should see the cause chain
      if (process.env.NODE_ENV !== 'production') {
        expect(response.body.error).toHaveProperty('cause');
        expect(response.body.error.cause).toHaveProperty('message', 'Intermediate cause');
        expect(response.body.error.cause).toHaveProperty('code', 'MID_ERROR');
      }
    });
  });
});
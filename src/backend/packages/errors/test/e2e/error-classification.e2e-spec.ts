import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { createTestModule, TestController } from './test-app';
import { ErrorsModule } from '../../src/nest/module';
import { ValidationError } from '../../src/categories/validation.errors';
import { BusinessError } from '../../src/categories/business.errors';
import { TechnicalError } from '../../src/categories/technical.errors';
import { ExternalError } from '../../src/categories/external.errors';
import { Health } from '../../src/journey';
import { Care } from '../../src/journey';
import { Plan } from '../../src/journey';

describe('Error Classification System (E2E)', () => {
  let app: INestApplication;
  let testController: TestController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        createTestModule({
          enableTracing: true,
          enableDetailedLogs: true,
        }),
        ErrorsModule.forRoot({
          enableGlobalFilters: true,
          detailedErrorsInResponse: true,
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    testController = moduleRef.get<TestController>(TestController);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Client Errors (4xx)', () => {
    it('should classify validation errors as 400 Bad Request', async () => {
      // Mock the controller to throw a validation error
      jest.spyOn(testController, 'triggerError').mockImplementation(() => {
        throw new ValidationError('Invalid input parameter', 'TEST_001', { field: 'username' });
      });

      const response = await request(app.getHttpServer())
        .get('/test/error')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'validation');
      expect(response.body.error).toHaveProperty('code', 'TEST_001');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('field', 'username');
    });

    it('should classify business errors as 422 Unprocessable Entity', async () => {
      // Mock the controller to throw a business error
      jest.spyOn(testController, 'triggerError').mockImplementation(() => {
        throw new BusinessError('Business rule violation', 'TEST_002', { rule: 'uniqueUsername' });
      });

      const response = await request(app.getHttpServer())
        .get('/test/error')
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'business');
      expect(response.body.error).toHaveProperty('code', 'TEST_002');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('rule', 'uniqueUsername');
    });
  });

  describe('System Errors (5xx)', () => {
    it('should classify technical errors as 500 Internal Server Error', async () => {
      // Mock the controller to throw a technical error
      jest.spyOn(testController, 'triggerError').mockImplementation(() => {
        throw new TechnicalError('Database connection failed', 'TEST_003', { 
          operation: 'findUser',
          component: 'UserRepository'
        });
      });

      const response = await request(app.getHttpServer())
        .get('/test/error')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'technical');
      expect(response.body.error).toHaveProperty('code', 'TEST_003');
      // In production, technical error details might be sanitized for security
      if (response.body.error.details) {
        expect(response.body.error.details).toHaveProperty('operation');
        expect(response.body.error.details).toHaveProperty('component');
      }
    });

    it('should classify external errors as 502 Bad Gateway', async () => {
      // Mock the controller to throw an external error
      jest.spyOn(testController, 'triggerError').mockImplementation(() => {
        throw new ExternalError('External API unavailable', 'TEST_004', { 
          service: 'PaymentGateway',
          endpoint: '/process-payment'
        });
      });

      const response = await request(app.getHttpServer())
        .get('/test/error')
        .expect(502);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'external');
      expect(response.body.error).toHaveProperty('code', 'TEST_004');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('service', 'PaymentGateway');
    });
  });

  describe('Transient Errors', () => {
    it('should properly classify and handle transient database errors', async () => {
      // Mock the controller to throw a transient database error
      jest.spyOn(testController, 'triggerTransientError').mockImplementation(() => {
        const error = new TechnicalError('Database connection timeout', 'TEST_005', { 
          operation: 'findUser',
          isTransient: true,
          retryable: true
        });
        error.isTransient = true; // Mark as transient for retry mechanisms
        return error;
      });

      const response = await request(app.getHttpServer())
        .get('/test/transient-error')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'technical');
      expect(response.body.error).toHaveProperty('code', 'TEST_005');
      expect(response.body.error.details).toHaveProperty('isTransient', true);
      expect(response.body.error.details).toHaveProperty('retryable', true);
      // Verify retry-after header for transient errors
      expect(response.headers).toHaveProperty('retry-after');
    });

    it('should properly classify and handle transient external service errors', async () => {
      // Mock the controller to throw a transient external service error
      jest.spyOn(testController, 'triggerTransientError').mockImplementation(() => {
        const error = new ExternalError('External API rate limit exceeded', 'TEST_006', { 
          service: 'PaymentGateway',
          isTransient: true,
          retryAfter: 30 // seconds
        });
        error.isTransient = true; // Mark as transient for retry mechanisms
        return error;
      });

      const response = await request(app.getHttpServer())
        .get('/test/transient-error')
        .expect(429); // Rate limit errors should be 429 Too Many Requests

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'external');
      expect(response.body.error).toHaveProperty('code', 'TEST_006');
      expect(response.body.error.details).toHaveProperty('isTransient', true);
      expect(response.body.error.details).toHaveProperty('retryAfter', 30);
      // Verify retry-after header for rate limit errors
      expect(response.headers).toHaveProperty('retry-after', '30');
    });
  });

  describe('Journey-Specific Errors', () => {
    it('should properly classify and handle Health journey errors', async () => {
      // Mock the controller to throw a Health journey error
      jest.spyOn(testController, 'triggerJourneyError').mockImplementation(() => {
        throw new Health.Metrics.InvalidMetricValueError('Heart rate value out of range', { 
          metricType: 'heartRate',
          value: 250,
          validRange: { min: 30, max: 220 }
        });
      });

      const response = await request(app.getHttpServer())
        .get('/test/journey-error')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'validation');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^HEALTH_METRICS_/);
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('metricType', 'heartRate');
      expect(response.body.error.details).toHaveProperty('value', 250);
      expect(response.body.error.details).toHaveProperty('validRange');
    });

    it('should properly classify and handle Care journey errors', async () => {
      // Mock the controller to throw a Care journey error
      jest.spyOn(testController, 'triggerJourneyError').mockImplementation(() => {
        throw new Care.Appointment.AppointmentDateInPastError('Cannot book appointment in the past', { 
          requestedDate: '2023-01-01T10:00:00Z',
          currentDate: new Date().toISOString()
        });
      });

      const response = await request(app.getHttpServer())
        .get('/test/journey-error')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'validation');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^CARE_APPOINTMENT_/);
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('requestedDate', '2023-01-01T10:00:00Z');
      expect(response.body.error.details).toHaveProperty('currentDate');
    });

    it('should properly classify and handle Plan journey errors', async () => {
      // Mock the controller to throw a Plan journey error
      jest.spyOn(testController, 'triggerJourneyError').mockImplementation(() => {
        throw new Plan.Claims.ClaimDeniedError('Claim denied due to coverage limitations', { 
          claimId: 'CLM12345',
          denialReason: 'SERVICE_NOT_COVERED',
          appealable: true
        });
      });

      const response = await request(app.getHttpServer())
        .get('/test/journey-error')
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'business');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^PLAN_CLAIMS_/);
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('claimId', 'CLM12345');
      expect(response.body.error.details).toHaveProperty('denialReason', 'SERVICE_NOT_COVERED');
      expect(response.body.error.details).toHaveProperty('appealable', true);
    });
  });

  describe('Error Context and Metadata', () => {
    it('should include request context in error responses', async () => {
      // Mock the controller to throw an error with request context
      jest.spyOn(testController, 'triggerContextualError').mockImplementation((req) => {
        const error = new BusinessError('Operation failed', 'TEST_007');
        error.addContext({
          requestId: req.headers['x-request-id'],
          userId: req.headers['x-user-id'],
          path: req.path
        });
        throw error;
      });

      const response = await request(app.getHttpServer())
        .get('/test/contextual-error')
        .set('X-Request-ID', 'test-request-123')
        .set('X-User-ID', 'user-456')
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('context');
      expect(response.body.error.context).toHaveProperty('requestId', 'test-request-123');
      expect(response.body.error.context).toHaveProperty('userId', 'user-456');
      expect(response.body.error.context).toHaveProperty('path', '/test/contextual-error');
    });

    it('should include error metadata for debugging while protecting sensitive information', async () => {
      // Mock the controller to throw an error with sensitive information
      jest.spyOn(testController, 'triggerError').mockImplementation(() => {
        const error = new TechnicalError('Database query failed', 'TEST_008', { 
          query: 'SELECT * FROM users WHERE email = ?',
          parameters: ['user@example.com'],
          sensitiveData: {
            password: 'should-not-appear',
            creditCard: '1234-5678-9012-3456'
          }
        });
        throw error;
      });

      const response = await request(app.getHttpServer())
        .get('/test/error')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'technical');
      expect(response.body.error).toHaveProperty('code', 'TEST_008');
      
      // Technical details should be included for debugging
      if (response.body.error.details) {
        expect(response.body.error.details).toHaveProperty('query');
        expect(response.body.error.details).toHaveProperty('parameters');
        
        // Sensitive data should be sanitized
        if (response.body.error.details.sensitiveData) {
          expect(response.body.error.details.sensitiveData).not.toHaveProperty('password');
          expect(response.body.error.details.sensitiveData).not.toHaveProperty('creditCard');
          // Or it should be masked
          if (response.body.error.details.sensitiveData.creditCard) {
            expect(response.body.error.details.sensitiveData.creditCard).toMatch(/^\*+\d{4}$/);
          }
        }
      }
    });
  });
});
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { 
  createDefaultTestApp,
  createValidationErrorsTestApp,
  createBusinessErrorsTestApp,
  createTechnicalErrorsTestApp,
  createExternalErrorsTestApp,
  createJourneyErrorsTestApp
} from './test-app';

/**
 * End-to-end tests for the GlobalExceptionFilter
 * 
 * These tests verify that the GlobalExceptionFilter properly catches, formats, and responds
 * to all types of unhandled exceptions with appropriate HTTP status codes and standardized
 * JSON response structures.
 */
describe('GlobalExceptionFilter (E2E)', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Validation Errors', () => {
    beforeEach(async () => {
      app = await createValidationErrorsTestApp();
    });

    it('should return 400 Bad Request for missing parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/validation/missing-param')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'validation');
      expect(response.body.error).toHaveProperty('code', 'MISSING_PARAMETER');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('required');
    });

    it('should return 400 Bad Request for invalid parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/validation/invalid-param/abc')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'validation');
      expect(response.body.error).toHaveProperty('code', 'INVALID_PARAMETER');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('id');
    });

    it('should return 400 Bad Request for schema validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/validation/schema-validation')
        .send({ age: -1 }) // Missing name and invalid age
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'validation');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('Name is required');
    });

    it('should return 200 OK for valid parameters', async () => {
      await request(app.getHttpServer())
        .get('/validation/missing-param?required=value')
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .get('/validation/invalid-param/123')
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .post('/validation/schema-validation')
        .send({ name: 'Test User', age: 30 })
        .expect(HttpStatus.OK);
    });
  });

  describe('Business Errors', () => {
    beforeEach(async () => {
      app = await createBusinessErrorsTestApp();
    });

    it('should return 404 Not Found for resource not found errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/business/resource/404')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'business');
      expect(response.body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('resource');
      expect(response.body.error.message).toContain('404');
    });

    it('should return 422 Unprocessable Entity for business rule violations', async () => {
      const response = await request(app.getHttpServer())
        .post('/business/rule-violation')
        .send({ action: 'forbidden' })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'business');
      expect(response.body.error).toHaveProperty('code', 'BUSINESS_RULE_VIOLATION');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('not allowed');
    });

    it('should return 422 Unprocessable Entity for custom business errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/business/custom-business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'business');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('Custom business logic error');
    });

    it('should return 200 OK for valid business operations', async () => {
      await request(app.getHttpServer())
        .get('/business/resource/123')
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .post('/business/rule-violation')
        .send({ action: 'allowed' })
        .expect(HttpStatus.OK);
    });
  });

  describe('Technical Errors', () => {
    beforeEach(async () => {
      app = await createTechnicalErrorsTestApp();
    });

    it('should return 500 Internal Server Error for database errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/technical/database')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'technical');
      expect(response.body.error).toHaveProperty('code', 'DATABASE_ERROR');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('database query');
      
      // Check if details are included in non-production environments
      if (process.env.NODE_ENV !== 'production' && response.body.error.details) {
        expect(response.body.error.details).toHaveProperty('operation', 'SELECT');
        expect(response.body.error.details).toHaveProperty('table', 'users');
      }
    });

    it('should return 500 Internal Server Error for internal server errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/technical/internal')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'technical');
      expect(response.body.error).toHaveProperty('code', 'INTERNAL_SERVER_ERROR');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('Unexpected server error');
    });

    it('should return 500 Internal Server Error for custom technical errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/technical/custom-technical')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'technical');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('Custom technical error');
    });
  });

  describe('External Errors', () => {
    beforeEach(async () => {
      app = await createExternalErrorsTestApp();
    });

    it('should return 502 Bad Gateway for external API errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/external/api')
        .expect(HttpStatus.BAD_GATEWAY);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'external');
      expect(response.body.error).toHaveProperty('code', 'EXTERNAL_API_ERROR');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('external API');
      
      // Check if details are included
      if (response.body.error.details) {
        expect(response.body.error.details).toHaveProperty('service', 'payment-gateway');
        expect(response.body.error.details).toHaveProperty('endpoint', '/process');
      }
    });

    it('should return 503 Service Unavailable for external dependency unavailable errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/external/dependency')
        .expect(HttpStatus.SERVICE_UNAVAILABLE);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'external');
      expect(response.body.error).toHaveProperty('code', 'EXTERNAL_DEPENDENCY_UNAVAILABLE');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('External service unavailable');
      
      // Check if details are included
      if (response.body.error.details) {
        expect(response.body.error.details).toHaveProperty('service', 'email-service');
      }
    });

    it('should return 502 Bad Gateway for custom external errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/external/custom-external')
        .expect(HttpStatus.BAD_GATEWAY);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'external');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('Custom external system error');
    });
  });

  describe('Journey-Specific Errors', () => {
    beforeEach(async () => {
      app = await createJourneyErrorsTestApp();
    });

    it('should return appropriate status code for health journey errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/journey/health/metrics')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'validation');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toContain('HEALTH_');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('heart_rate');
      
      // Check if details are included
      if (response.body.error.details) {
        expect(response.body.error.details).toHaveProperty('min');
        expect(response.body.error.details).toHaveProperty('max');
      }
    });

    it('should return appropriate status code for health device errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/journey/health/devices')
        .expect(HttpStatus.BAD_GATEWAY);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'external');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toContain('HEALTH_DEVICES_');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('fitbit');
      
      // Check if details are included
      if (response.body.error.details) {
        expect(response.body.error.details).toHaveProperty('reason', 'authentication_failed');
      }
    });
  });

  describe('Error Response Format', () => {
    beforeEach(async () => {
      app = await createDefaultTestApp();
    });

    it('should include standardized error response format for all error types', async () => {
      // Test validation error format
      const validationResponse = await request(app.getHttpServer())
        .get('/validation/missing-param')
        .expect(HttpStatus.BAD_REQUEST);

      expect(validationResponse.body).toHaveProperty('error');
      expect(validationResponse.body.error).toHaveProperty('type');
      expect(validationResponse.body.error).toHaveProperty('message');
      expect(validationResponse.body.error).toHaveProperty('code');

      // Test business error format
      const businessResponse = await request(app.getHttpServer())
        .get('/business/resource/404')
        .expect(HttpStatus.NOT_FOUND);

      expect(businessResponse.body).toHaveProperty('error');
      expect(businessResponse.body.error).toHaveProperty('type');
      expect(businessResponse.body.error).toHaveProperty('message');
      expect(businessResponse.body.error).toHaveProperty('code');

      // Test technical error format
      const technicalResponse = await request(app.getHttpServer())
        .get('/technical/database')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(technicalResponse.body).toHaveProperty('error');
      expect(technicalResponse.body.error).toHaveProperty('type');
      expect(technicalResponse.body.error).toHaveProperty('message');
      expect(technicalResponse.body.error).toHaveProperty('code');

      // Test external error format
      const externalResponse = await request(app.getHttpServer())
        .get('/external/api')
        .expect(HttpStatus.BAD_GATEWAY);

      expect(externalResponse.body).toHaveProperty('error');
      expect(externalResponse.body.error).toHaveProperty('type');
      expect(externalResponse.body.error).toHaveProperty('message');
      expect(externalResponse.body.error).toHaveProperty('code');
    });

    it('should include trace ID in error responses when available', async () => {
      // Set a trace ID header to simulate a traced request
      const response = await request(app.getHttpServer())
        .get('/technical/database')
        .set('X-Trace-ID', 'test-trace-123')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toHaveProperty('error');
      
      // In non-production environments, trace ID should be included
      if (process.env.NODE_ENV !== 'production') {
        expect(response.body.error).toHaveProperty('traceId');
      }
    });

    it('should include journey context in error responses when available', async () => {
      // Set journey headers to simulate a journey request
      const response = await request(app.getHttpServer())
        .get('/business/resource/404')
        .set('X-Journey-ID', 'health-journey-123')
        .set('X-Journey-Step', 'metrics-input')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('error');
      
      // Journey context should be included when journey headers are present
      if (response.body.error.journeyContext) {
        expect(response.body.error.journeyContext).toHaveProperty('journeyId', 'health-journey-123');
        expect(response.body.error.journeyContext).toHaveProperty('journeyStep', 'metrics-input');
      }
    });
  });

  describe('Error Recovery and Fallback', () => {
    beforeEach(async () => {
      app = await createDefaultTestApp();
    });

    it('should apply retry for transient errors when configured', async () => {
      // The retry decorator in the test app is configured to retry 3 times
      const response = await request(app.getHttpServer())
        .get('/recovery/retry?succeed=true')
        .expect(HttpStatus.OK);

      // The response should indicate that the operation succeeded after retries
      expect(response.text).toContain('succeeded after');
      expect(response.text).toMatch(/succeeded after [1-3] attempts/);
    });

    it('should apply fallback for operations that fail', async () => {
      const response = await request(app.getHttpServer())
        .get('/recovery/fallback?fail=true')
        .expect(HttpStatus.OK);

      // The response should be the fallback response
      expect(response.text).toBe('Fallback response when operation fails');
    });

    it('should contain error boundaries for different error types', async () => {
      // Test validation error inside boundary
      await request(app.getHttpServer())
        .get('/recovery/error-boundary?error-type=validation')
        .expect(HttpStatus.BAD_REQUEST);

      // Test business error inside boundary
      await request(app.getHttpServer())
        .get('/recovery/error-boundary?error-type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Test technical error inside boundary
      await request(app.getHttpServer())
        .get('/recovery/error-boundary?error-type=technical')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Test external error inside boundary
      await request(app.getHttpServer())
        .get('/recovery/error-boundary?error-type=external')
        .expect(HttpStatus.BAD_GATEWAY);

      // Test unhandled error inside boundary
      await request(app.getHttpServer())
        .get('/recovery/error-boundary?error-type=unhandled')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('NestJS Built-in Exceptions', () => {
    beforeEach(async () => {
      app = await createDefaultTestApp();
    });

    it('should handle NestJS HttpException properly', async () => {
      // The ValidationPipe in the test app throws HttpException for validation errors
      const response = await request(app.getHttpServer())
        .post('/validation/schema-validation')
        .send({}) // Empty body will trigger validation error
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'validation');
    });
  });

  describe('Client-Friendly Error Messages', () => {
    beforeEach(async () => {
      app = await createDefaultTestApp();
    });

    it('should provide user-friendly error messages for validation errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/validation/invalid-param/abc')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.message.length).toBeGreaterThan(0);
      expect(response.body.error.message).not.toContain('Exception');
      expect(response.body.error.message).not.toContain('Error:');
    });

    it('should provide user-friendly error messages for business errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/business/resource/404')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.message.length).toBeGreaterThan(0);
      expect(response.body.error.message).not.toContain('Exception');
      expect(response.body.error.message).not.toContain('Error:');
    });

    it('should provide generic error messages for technical errors in production', async () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        // Set NODE_ENV to production
        process.env.NODE_ENV = 'production';
        
        const response = await request(app.getHttpServer())
          .get('/technical/database')
          .expect(HttpStatus.INTERNAL_SERVER_ERROR);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body.error.message).toBeDefined();
        
        // In production, technical errors should have generic messages
        // and should not expose implementation details
        expect(response.body.error.message).not.toContain('SELECT');
        expect(response.body.error.message).not.toContain('users');
        expect(response.body.error.message).not.toContain('Connection timeout');
        
        // Details should not be included in production
        expect(response.body.error).not.toHaveProperty('details');
        expect(response.body.error).not.toHaveProperty('stack');
      } finally {
        // Restore the original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });
});
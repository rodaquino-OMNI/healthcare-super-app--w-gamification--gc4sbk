import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApplication } from './test-app';
import { ErrorType } from '../../src/types';

describe('GlobalExceptionFilter (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Create test application with detailed errors enabled
    app = await createTestApplication({
      errorsModuleOptions: {
        detailedErrors: true,
        enableLogging: false,
        enableTracing: false,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Reset the test service state before each test
    await request(app.getHttpServer()).get('/test-errors/reset');
  });

  /**
   * Helper function to verify the basic structure of error responses
   */
  const verifyErrorResponseStructure = (response: request.Response) => {
    expect(response.body).toBeDefined();
    expect(response.body.error).toBeDefined();
    expect(response.body.error.type).toBeDefined();
    expect(response.body.error.code).toBeDefined();
    expect(response.body.error.message).toBeDefined();
    expect(response.body.error.timestamp).toBeDefined();
    
    // Verify timestamp is a valid ISO date string
    expect(new Date(response.body.error.timestamp).toISOString()).toEqual(response.body.error.timestamp);
    
    // Verify path is included
    expect(response.body.error.path).toBeDefined();
  };

  describe('Error Classification and Status Codes', () => {
    it('should handle validation errors with 400 status code', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/validation')
        .expect(HttpStatus.BAD_REQUEST);

      verifyErrorResponseStructure(response);
      expect(response.body.error.type).toBe(ErrorType.VALIDATION);
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.parameter).toBeDefined();
    });

    it('should handle business errors with 422 status code', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      verifyErrorResponseStructure(response);
      expect(response.body.error.type).toBe(ErrorType.BUSINESS);
      expect(response.body.error.rule).toBeDefined();
    });

    it('should handle technical errors with 500 status code', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/technical')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      verifyErrorResponseStructure(response);
      expect(response.body.error.type).toBe(ErrorType.TECHNICAL);
      expect(response.body.error.component).toBeDefined();
    });

    it('should handle external errors with 502 status code', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/external')
        .expect(HttpStatus.BAD_GATEWAY);

      verifyErrorResponseStructure(response);
      expect(response.body.error.type).toBe(ErrorType.EXTERNAL);
      expect(response.body.error.endpoint).toBeDefined();
    });

    it('should handle not found errors with 404 status code', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/not-found')
        .expect(HttpStatus.NOT_FOUND);

      verifyErrorResponseStructure(response);
      expect(response.body.error.type).toBe(ErrorType.NOT_FOUND);
      expect(response.body.error.resourceType).toBeDefined();
      expect(response.body.error.resourceId).toBeDefined();
    });
  });

  describe('Journey-Specific Error Handling', () => {
    it('should handle health journey errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/health-journey')
        .expect(HttpStatus.BAD_REQUEST);

      verifyErrorResponseStructure(response);
      expect(response.body.error.journey).toBe('health');
      expect(response.body.error.metricType).toBe('bloodPressure');
      expect(response.body.error.value).toBeDefined();
      expect(response.body.error.validRange).toBeDefined();
    });
  });

  describe('Error Recovery Mechanisms', () => {
    it('should retry transient errors and eventually succeed', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/transient?failUntil=3')
        .expect(HttpStatus.OK);

      expect(response.text).toContain('Success after');
    });

    it('should use circuit breaker for failing external dependencies', async () => {
      // First request should fail with external error
      await request(app.getHttpServer())
        .get('/test-errors/circuit-breaker')
        .expect(HttpStatus.BAD_GATEWAY);

      // Make enough requests to trip the circuit breaker
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).get('/test-errors/circuit-breaker');
      }

      // Now the circuit breaker should be open and return the fallback
      const response = await request(app.getHttpServer())
        .get('/test-errors/circuit-breaker')
        .expect(HttpStatus.OK);

      expect(response.text).toBe('Circuit breaker fallback response');
    });

    it('should use fallback for persistent errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/fallback')
        .expect(HttpStatus.OK);

      expect(response.text).toBe('This is a fallback response');
    });
  });

  describe('Error Boundaries', () => {
    it('should contain errors within controller boundaries', async () => {
      const response = await request(app.getHttpServer())
        .get('/error-boundary/contained-error')
        .expect(HttpStatus.OK);

      expect(response.body.message).toContain('Error was caught by controller error boundary');
      expect(response.body.originalError).toBeDefined();
    });
  });

  describe('Error Response Format', () => {
    it('should include stack traces in non-production environments', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/technical')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      verifyErrorResponseStructure(response);
      expect(response.body.error.stack).toBeDefined();
      expect(Array.isArray(response.body.error.stack.split('\n'))).toBe(true);
    });

    it('should include detailed error context in the response', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      verifyErrorResponseStructure(response);
      expect(response.body.error.details).toBeDefined();
      expect(response.body.error.rule).toBe('appointment.scheduling');
      expect(response.body.error.details).toContain('Cannot schedule more than 3 appointments per day');
    });

    it('should include request path in error responses', async () => {
      const testPath = '/test-errors/validation';
      const response = await request(app.getHttpServer())
        .get(testPath)
        .expect(HttpStatus.BAD_REQUEST);

      verifyErrorResponseStructure(response);
      expect(response.body.error.path).toBe(testPath);
    });
  });

  describe('Timeout Handling', () => {
    it('should handle request timeouts properly', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/timeout')
        .expect(HttpStatus.GATEWAY_TIMEOUT);

      verifyErrorResponseStructure(response);
      expect(response.body.error.type).toBe(ErrorType.TIMEOUT);
    });
  });

  describe('Unknown Error Handling', () => {
    it('should handle unknown errors with 500 status code', async () => {
      // This endpoint doesn't exist, so it will trigger a 404 NestJS error
      const response = await request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .expect(HttpStatus.NOT_FOUND);

      verifyErrorResponseStructure(response);
      expect(response.body.error.type).toBe(ErrorType.NOT_FOUND);
    });

    it('should sanitize error responses in production mode', async () => {
      // Create a new app with production mode settings
      const prodApp = await createTestApplication({
        errorsModuleOptions: {
          detailedErrors: false,
          enableLogging: false,
          enableTracing: false,
        },
      });

      try {
        const response = await request(prodApp.getHttpServer())
          .get('/test-errors/technical')
          .expect(HttpStatus.INTERNAL_SERVER_ERROR);

        verifyErrorResponseStructure(response);
        expect(response.body.error.stack).toBeUndefined();
        expect(response.body.error.details).toBeUndefined();
      } finally {
        await prodApp.close();
      }
    });
  });

  describe('Request Context in Errors', () => {
    it('should include request ID in error responses when available', async () => {
      const requestId = 'test-request-id-123';
      const response = await request(app.getHttpServer())
        .get('/test-errors/validation')
        .set('X-Request-ID', requestId)
        .expect(HttpStatus.BAD_REQUEST);

      verifyErrorResponseStructure(response);
      expect(response.body.error.requestId).toBe(requestId);
    });

    it('should include journey context from headers when available', async () => {
      const journeyId = 'health';
      const response = await request(app.getHttpServer())
        .get('/test-errors/validation')
        .set('X-Journey-ID', journeyId)
        .expect(HttpStatus.BAD_REQUEST);

      verifyErrorResponseStructure(response);
      expect(response.body.error.journey).toBe(journeyId);
    });
  });
});
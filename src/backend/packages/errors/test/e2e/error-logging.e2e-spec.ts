import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { AppModule } from '../fixtures/app.module';
import { ErrorsModule } from '../../src';
import { BusinessRuleViolationError, InvalidParameterError, InternalServerError, ExternalApiError } from '../../src/categories';
import { MockLoggerService } from '../mocks/mock-logger.service';
import { MockTracingService } from '../mocks/mock-tracing.service';
import { TestController } from '../fixtures/test.controller';

describe('Error Logging E2E Tests', () => {
  let app: INestApplication;
  let mockLoggerService: MockLoggerService;
  let mockTracingService: MockTracingService;
  let testController: TestController;

  beforeEach(async () => {
    mockLoggerService = new MockLoggerService();
    mockTracingService = new MockTracingService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ErrorsModule],
      providers: [
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TracingService, useValue: mockTracingService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    testController = moduleFixture.get<TestController>(TestController);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    mockLoggerService.reset();
    mockTracingService.reset();
  });

  describe('Error Context and Correlation', () => {
    it('should log validation errors with complete context', async () => {
      // Arrange
      const traceId = 'test-trace-id-123';
      const requestId = 'test-request-id-456';
      const userId = 'user-789';
      const journeyId = 'health';

      // Act
      await request(app.getHttpServer())
        .get('/test/validation-error')
        .set('X-Trace-ID', traceId)
        .set('X-Request-ID', requestId)
        .set('X-User-ID', userId)
        .set('X-Journey-ID', journeyId)
        .expect(400);

      // Assert
      expect(mockLoggerService.getLogs()).toHaveLength(1);
      const logEntry = mockLoggerService.getLogs()[0];
      
      // Verify log contains all context information
      expect(logEntry.context).toEqual(expect.objectContaining({
        traceId,
        requestId,
        userId,
        journeyId,
      }));
      
      // Verify error details are logged
      expect(logEntry.message).toContain('Validation error');
      expect(logEntry.error).toBeInstanceOf(InvalidParameterError);
      expect(logEntry.error.code).toBe('INVALID_PARAMETER');
    });

    it('should correlate errors with tracing spans', async () => {
      // Arrange
      const traceId = 'test-trace-id-789';
      const requestId = 'test-request-id-012';
      
      // Act
      await request(app.getHttpServer())
        .get('/test/business-error')
        .set('X-Trace-ID', traceId)
        .set('X-Request-ID', requestId)
        .expect(422);

      // Assert
      // Verify span was created with error
      const spans = mockTracingService.getSpans();
      expect(spans).toHaveLength(1);
      
      const span = spans[0];
      expect(span.attributes).toEqual(expect.objectContaining({
        'error': true,
        'error.type': 'business',
        'error.code': 'BUSINESS_RULE_VIOLATION',
        'request.id': requestId,
      }));
      
      // Verify log entry has the same trace ID
      const logEntry = mockLoggerService.getLogs()[0];
      expect(logEntry.context.traceId).toBe(traceId);
      expect(logEntry.context.spanId).toBe(span.spanId);
    });

    it('should include request details in error logs', async () => {
      // Act
      await request(app.getHttpServer())
        .post('/test/technical-error')
        .send({ testData: 'example' })
        .expect(500);

      // Assert
      const logEntry = mockLoggerService.getLogs()[0];
      
      // Verify request details are included
      expect(logEntry.context).toEqual(expect.objectContaining({
        'http.method': 'POST',
        'http.url': '/test/technical-error',
        'http.status_code': 500
      }));
      
      // Verify error stack trace is included
      expect(logEntry.error).toBeInstanceOf(InternalServerError);
      expect(logEntry.error.stack).toBeDefined();
      expect(logEntry.error.stack).toContain('InternalServerError');
    });
  });

  describe('Sensitive Data Handling', () => {
    it('should sanitize sensitive information in error logs', async () => {
      // Arrange
      const sensitiveData = {
        password: 'secret123',
        creditCard: '4111111111111111',
        ssn: '123-45-6789',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
      };

      // Act
      await request(app.getHttpServer())
        .post('/test/sensitive-data-error')
        .send(sensitiveData)
        .expect(400);

      // Assert
      const logEntry = mockLoggerService.getLogs()[0];
      
      // Verify sensitive data is sanitized
      expect(logEntry.context.request).toBeDefined();
      expect(logEntry.context.request.body).toBeDefined();
      expect(logEntry.context.request.body).toEqual(expect.objectContaining({
        password: '[REDACTED]',
        creditCard: '[REDACTED]',
        ssn: '[REDACTED]',
        token: '[REDACTED]'
      }));
    });

    it('should sanitize sensitive information in error responses', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/test/sensitive-response-error')
        .expect(500);

      // Assert
      expect(response.body.error).toBeDefined();
      
      // Verify stack trace is not included in production
      if (process.env.NODE_ENV === 'production') {
        expect(response.body.error.stack).toBeUndefined();
        expect(response.body.error.details).toBeUndefined();
      } else {
        // In non-production, details may be included but sanitized
        if (response.body.error.details) {
          expect(response.body.error.details.sensitiveData).toBe('[REDACTED]');
        }
      }
      
      // Verify error message doesn't contain sensitive information
      expect(response.body.error.message).not.toContain('secret');
      expect(response.body.error.message).not.toContain('password');
      expect(response.body.error.message).not.toContain('token');
    });
  });

  describe('Structured Logging', () => {
    it('should use structured logging format for all errors', async () => {
      // Act
      await request(app.getHttpServer())
        .get('/test/external-error')
        .expect(502);

      // Assert
      const logEntry = mockLoggerService.getLogs()[0];
      
      // Verify structured log format
      expect(logEntry).toEqual(expect.objectContaining({
        timestamp: expect.any(Date),
        level: 'error',
        message: expect.stringContaining('External system error'),
        context: expect.any(Object),
        error: expect.any(ExternalApiError)
      }));
      
      // Verify error object structure
      expect(logEntry.error).toEqual(expect.objectContaining({
        name: 'ExternalApiError',
        message: expect.any(String),
        code: 'EXTERNAL_API_ERROR',
        type: 'external',
        status: 502,
        details: expect.any(Object)
      }));
      
      // Verify external API details are included
      expect(logEntry.error.details).toEqual(expect.objectContaining({
        service: 'test-external-service',
        endpoint: '/api/test',
        statusCode: 500
      }));
    });

    it('should include metadata for error aggregation and analysis', async () => {
      // Act
      await request(app.getHttpServer())
        .get('/test/aggregated-errors')
        .expect(500);

      // Assert
      const logs = mockLoggerService.getLogs();
      expect(logs).toHaveLength(3); // Multiple errors logged
      
      // Verify all logs have consistent metadata for aggregation
      logs.forEach(log => {
        expect(log.context).toEqual(expect.objectContaining({
          service: 'test-service',
          environment: expect.any(String),
          version: expect.any(String),
          errorId: expect.any(String) // Unique ID for each error instance
        }));
      });
      
      // Verify error grouping metadata
      expect(logs[0].context.errorGroupId).toBe(logs[1].context.errorGroupId);
      expect(logs[0].context.errorGroupId).not.toBe(logs[2].context.errorGroupId);
    });
  });

  describe('Journey-Specific Error Context', () => {
    it('should include journey-specific context in health journey errors', async () => {
      // Act
      await request(app.getHttpServer())
        .get('/test/health-journey-error')
        .set('X-Journey-ID', 'health')
        .expect(422);

      // Assert
      const logEntry = mockLoggerService.getLogs()[0];
      
      // Verify health journey context
      expect(logEntry.context.journey).toBe('health');
      expect(logEntry.context.journeyContext).toEqual(expect.objectContaining({
        metricType: expect.any(String),
        goalId: expect.any(String)
      }));
    });

    it('should include journey-specific context in care journey errors', async () => {
      // Act
      await request(app.getHttpServer())
        .get('/test/care-journey-error')
        .set('X-Journey-ID', 'care')
        .expect(422);

      // Assert
      const logEntry = mockLoggerService.getLogs()[0];
      
      // Verify care journey context
      expect(logEntry.context.journey).toBe('care');
      expect(logEntry.context.journeyContext).toEqual(expect.objectContaining({
        appointmentId: expect.any(String),
        providerId: expect.any(String)
      }));
    });

    it('should include journey-specific context in plan journey errors', async () => {
      // Act
      await request(app.getHttpServer())
        .get('/test/plan-journey-error')
        .set('X-Journey-ID', 'plan')
        .expect(422);

      // Assert
      const logEntry = mockLoggerService.getLogs()[0];
      
      // Verify plan journey context
      expect(logEntry.context.journey).toBe('plan');
      expect(logEntry.context.journeyContext).toEqual(expect.objectContaining({
        planId: expect.any(String),
        benefitId: expect.any(String)
      }));
    });
  });
});
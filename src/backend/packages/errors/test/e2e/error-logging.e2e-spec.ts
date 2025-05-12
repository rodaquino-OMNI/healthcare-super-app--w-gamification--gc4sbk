import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { createTestModule } from './test-app';
import { LoggerService } from '../../../logging/src/logger.service';
import { TracerService } from '../../../tracing/src/tracer.service';
import { ErrorsModule } from '../../src/nest/module';

/**
 * Mock logger service that captures logs for testing
 */
class MockLoggerService {
  logs: Array<{ level: string; message: string; context?: string; trace?: string; meta?: any }> = [];

  log(message: string, context?: string, meta?: any) {
    this.logs.push({ level: 'log', message, context, meta });
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    this.logs.push({ level: 'error', message, trace, context, meta });
  }

  warn(message: string, context?: string, meta?: any) {
    this.logs.push({ level: 'warn', message, context, meta });
  }

  debug(message: string, context?: string, meta?: any) {
    this.logs.push({ level: 'debug', message, context, meta });
  }

  verbose(message: string, context?: string, meta?: any) {
    this.logs.push({ level: 'verbose', message, context, meta });
  }

  clearLogs() {
    this.logs = [];
  }
}

/**
 * Mock tracer service that captures spans for testing
 */
class MockTracerService {
  currentTraceId: string = 'test-trace-id';
  currentSpanId: string = 'test-span-id';
  spans: Array<{ name: string; attributes: Record<string, any>; events: Array<{ name: string; attributes: Record<string, any> }> }> = [];

  startSpan(name: string, attributes: Record<string, any> = {}) {
    const span = {
      name,
      attributes,
      events: [],
      addEvent: (eventName: string, eventAttributes: Record<string, any> = {}) => {
        span.events.push({ name: eventName, attributes: eventAttributes });
      },
      end: () => {
        this.spans.push({
          name: span.name,
          attributes: span.attributes,
          events: span.events
        });
      }
    };
    return span;
  }

  getCurrentTraceId() {
    return this.currentTraceId;
  }

  getCurrentSpanId() {
    return this.currentSpanId;
  }

  clearSpans() {
    this.spans = [];
  }
}

describe('Error Logging E2E Tests', () => {
  let app: INestApplication;
  let mockLogger: MockLoggerService;
  let mockTracer: MockTracerService;

  beforeAll(async () => {
    mockLogger = new MockLoggerService();
    mockTracer = new MockTracerService();

    const moduleRef = await Test.createTestingModule({
      imports: [
        createTestModule({
          errorsModuleOptions: {
            enableDetailedErrors: true,
            sanitizeErrors: true,
            includeTraceInfo: true
          }
        })
      ]
    })
      .overrideProvider(LoggerService)
      .useValue(mockLogger)
      .overrideProvider(TracerService)
      .useValue(mockTracer)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    mockLogger.clearLogs();
    mockTracer.clearSpans();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Error Context in Logs', () => {
    it('should include complete context in error logs', async () => {
      // Make a request that will trigger an error
      await request(app.getHttpServer())
        .get('/technical/internal-error')
        .set('X-Request-ID', 'test-request-id')
        .set('X-Journey-ID', 'test-journey-id')
        .set('Authorization', 'Bearer test-token')
        .expect(500);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'error' && 
        log.message.includes('Something went wrong internally')
      );

      // Verify the log exists and has the expected context
      expect(errorLog).toBeDefined();
      expect(errorLog.meta).toBeDefined();
      expect(errorLog.meta.requestId).toBe('test-request-id');
      expect(errorLog.meta.journeyId).toBe('test-journey-id');
      expect(errorLog.meta.method).toBeDefined();
      expect(errorLog.meta.url).toBeDefined();
    });

    it('should include journey-specific context in error logs', async () => {
      // Make a request that will trigger a journey-specific error
      await request(app.getHttpServer())
        .get('/context/with-context?type=business')
        .set('X-Request-ID', 'test-request-id')
        .set('X-Journey-ID', 'test-journey-id')
        .expect(422);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'warn' && 
        log.message.includes('Business rule violation with context')
      );

      // Verify the log exists and has the expected context
      expect(errorLog).toBeDefined();
      expect(errorLog.meta).toBeDefined();
      expect(errorLog.meta.journey).toBe('TEST_JOURNEY');
      expect(errorLog.meta.feature).toBe('ERROR_TESTING');
      expect(errorLog.meta.code).toBe('TEST_RULE');
    });
  });

  describe('Tracing Integration', () => {
    it('should correlate errors with tracing spans', async () => {
      // Make a request that will trigger an error
      await request(app.getHttpServer())
        .get('/technical/database-error')
        .set('X-Request-ID', 'test-request-id')
        .set('traceparent', `00-${mockTracer.getCurrentTraceId()}-${mockTracer.getCurrentSpanId()}-01`)
        .expect(500);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'error' && 
        log.message.includes('Failed to execute database query')
      );

      // Verify the log exists and has trace information
      expect(errorLog).toBeDefined();
      expect(errorLog.meta).toBeDefined();
      expect(errorLog.meta.traceId).toBe(mockTracer.getCurrentTraceId());
      expect(errorLog.meta.spanId).toBeDefined();
    });

    it('should record error events in the current span', async () => {
      // Make a request that will trigger an error
      await request(app.getHttpServer())
        .get('/external/api-error')
        .set('X-Request-ID', 'test-request-id')
        .set('traceparent', `00-${mockTracer.getCurrentTraceId()}-${mockTracer.getCurrentSpanId()}-01`)
        .expect(502);

      // Verify that an error event was recorded in a span
      const errorSpan = mockTracer.spans.find(span => 
        span.events.some(event => event.name === 'error')
      );

      expect(errorSpan).toBeDefined();
      const errorEvent = errorSpan.events.find(event => event.name === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent.attributes.errorType).toBe('EXTERNAL');
      expect(errorEvent.attributes.errorCode).toBeDefined();
      expect(errorEvent.attributes.errorMessage).toBeDefined();
    });
  });

  describe('Sensitive Data Sanitization', () => {
    it('should sanitize sensitive information in error logs', async () => {
      // Make a request with sensitive information that will trigger an error
      await request(app.getHttpServer())
        .post('/validation/validate-body')
        .send({
          password: 'secret-password',
          creditCard: '1234-5678-9012-3456',
          ssn: '123-45-6789'
        })
        .set('X-Request-ID', 'test-request-id')
        .expect(400);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'debug' && 
        log.message.includes('Validation error')
      );

      // Verify the log exists and sensitive data is sanitized
      expect(errorLog).toBeDefined();
      expect(errorLog.meta).toBeDefined();
      expect(errorLog.meta.request).toBeDefined();
      
      // Convert to string to check if sensitive data appears anywhere
      const logString = JSON.stringify(errorLog);
      expect(logString).not.toContain('secret-password');
      expect(logString).not.toContain('1234-5678-9012-3456');
      expect(logString).not.toContain('123-45-6789');
      
      // Should contain masked versions instead
      expect(logString).toContain('*****');
    });

    it('should sanitize sensitive information in error responses', async () => {
      // Make a request with sensitive information that will trigger an error
      const response = await request(app.getHttpServer())
        .post('/validation/validate-body')
        .send({
          password: 'secret-password',
          creditCard: '1234-5678-9012-3456',
          ssn: '123-45-6789'
        })
        .set('X-Request-ID', 'test-request-id')
        .expect(400);

      // Verify sensitive data is sanitized in the response
      const responseBody = response.body;
      const responseString = JSON.stringify(responseBody);
      expect(responseString).not.toContain('secret-password');
      expect(responseString).not.toContain('1234-5678-9012-3456');
      expect(responseString).not.toContain('123-45-6789');
    });
  });

  describe('Structured Logging', () => {
    it('should use structured logging format for errors', async () => {
      // Make a request that will trigger an error
      await request(app.getHttpServer())
        .get('/business/resource/404')
        .set('X-Request-ID', 'test-request-id')
        .expect(404);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'warn' && 
        log.message.includes('Resource not found')
      );

      // Verify the log exists and has structured format
      expect(errorLog).toBeDefined();
      expect(errorLog.meta).toBeDefined();
      expect(errorLog.meta.errorType).toBe('BUSINESS');
      expect(errorLog.meta.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(errorLog.meta.requestId).toBe('test-request-id');
      expect(errorLog.meta.timestamp).toBeDefined();
      expect(errorLog.meta.path).toBeDefined();
      expect(errorLog.meta.method).toBeDefined();
    });

    it('should include stack traces for technical errors in non-production environments', async () => {
      // Store original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      // Set to development for this test
      process.env.NODE_ENV = 'development';

      // Make a request that will trigger a technical error
      await request(app.getHttpServer())
        .get('/technical/internal-error')
        .set('X-Request-ID', 'test-request-id')
        .expect(500);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'error' && 
        log.message.includes('Something went wrong internally')
      );

      // Verify the log exists and has a stack trace
      expect(errorLog).toBeDefined();
      expect(errorLog.trace).toBeDefined();
      expect(errorLog.trace).toContain('InternalServerError');

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Error Classification', () => {
    it('should log validation errors at debug level', async () => {
      // Make a request that will trigger a validation error
      await request(app.getHttpServer())
        .get('/validation/missing-param')
        .set('X-Request-ID', 'test-request-id')
        .expect(400);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'debug' && 
        log.message.includes('Missing parameter')
      );

      // Verify the log exists
      expect(errorLog).toBeDefined();
    });

    it('should log business errors at warn level', async () => {
      // Make a request that will trigger a business error
      await request(app.getHttpServer())
        .get('/business/rule-violation?value=-5')
        .set('X-Request-ID', 'test-request-id')
        .expect(422);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'warn' && 
        log.message.includes('Business rule violation')
      );

      // Verify the log exists
      expect(errorLog).toBeDefined();
    });

    it('should log technical errors at error level', async () => {
      // Make a request that will trigger a technical error
      await request(app.getHttpServer())
        .get('/technical/timeout')
        .set('X-Request-ID', 'test-request-id')
        .expect(500);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'error' && 
        log.message.includes('Operation timed out')
      );

      // Verify the log exists
      expect(errorLog).toBeDefined();
    });

    it('should log external errors at error level', async () => {
      // Make a request that will trigger an external error
      await request(app.getHttpServer())
        .get('/external/dependency-unavailable')
        .set('X-Request-ID', 'test-request-id')
        .expect(502);

      // Find the error log
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'error' && 
        log.message.includes('External payment service')
      );

      // Verify the log exists
      expect(errorLog).toBeDefined();
    });
  });
});
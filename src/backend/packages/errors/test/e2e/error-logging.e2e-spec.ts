import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './test-app';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';

/**
 * Mock implementation of the LoggerService for testing
 */
class MockLoggerService implements Partial<LoggerService> {
  logs: Array<{ level: string; message: string; context?: string; meta?: any }> = [];

  debug(message: string, context?: string, meta?: any): void {
    this.logs.push({ level: 'debug', message, context, meta });
  }

  log(message: string, context?: string, meta?: any): void {
    this.logs.push({ level: 'info', message, context, meta });
  }

  warn(message: string, context?: string, meta?: any): void {
    this.logs.push({ level: 'warn', message, context, meta });
  }

  error(message: string, trace?: string, context?: string, meta?: any): void {
    this.logs.push({ level: 'error', message, context, meta: { ...meta, trace } });
  }

  fatal(message: string, trace?: string, context?: string, meta?: any): void {
    this.logs.push({ level: 'fatal', message, context, meta: { ...meta, trace } });
  }

  clear(): void {
    this.logs = [];
  }

  getLastLog(): any {
    return this.logs[this.logs.length - 1];
  }

  getLogs(): any[] {
    return this.logs;
  }

  getLogsByLevel(level: string): any[] {
    return this.logs.filter(log => log.level === level);
  }
}

/**
 * Mock implementation of the TracingService for testing
 */
class MockTracingService implements Partial<TracingService> {
  spans: Array<{ name: string; attributes?: Record<string, any>; events?: Array<{ name: string; attributes?: Record<string, any> }> }> = [];
  currentTraceId: string = 'test-trace-id';
  currentSpanId: string = 'test-span-id';

  startSpan(name: string, attributes?: Record<string, any>): any {
    const span = { 
      name, 
      attributes, 
      events: [],
      end: () => {}, // Mock end method
      recordException: (error: Error) => {
        span.events.push({
          name: 'exception',
          attributes: {
            'exception.type': error.name,
            'exception.message': error.message,
            'exception.stacktrace': error.stack
          }
        });
      },
      setStatus: () => {},
      setAttribute: (key: string, value: any) => {
        if (!span.attributes) span.attributes = {};
        span.attributes[key] = value;
      }
    };
    
    this.spans.push(span);
    return span;
  }

  getActiveSpan(): any {
    return this.spans[this.spans.length - 1] || null;
  }

  getCurrentTraceId(): string {
    return this.currentTraceId;
  }

  getCurrentSpanId(): string {
    return this.currentSpanId;
  }

  clear(): void {
    this.spans = [];
  }

  getLastSpan(): any {
    return this.spans[this.spans.length - 1];
  }

  getSpans(): any[] {
    return this.spans;
  }
}

describe('Error Logging E2E Tests', () => {
  let app: INestApplication;
  let mockLoggerService: MockLoggerService;
  let mockTracingService: MockTracingService;

  beforeAll(async () => {
    mockLoggerService = new MockLoggerService();
    mockTracingService = new MockTracingService();

    // Create test app with mocked services
    app = await createTestApp({
      errorsModuleOptions: {
        logErrors: true,
        includeStackTraces: true
      }
    });

    // Override the logger and tracing services with our mocks
    const loggerProvider = {
      provide: LoggerService,
      useValue: mockLoggerService
    };

    const tracingProvider = {
      provide: TracingService,
      useValue: mockTracingService
    };

    app.get('ErrorsModule').providers.push(loggerProvider, tracingProvider);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockLoggerService.clear();
    mockTracingService.clear();
  });

  describe('Error Context and Metadata', () => {
    it('should include request ID in error logs', async () => {
      // Make a request with a request ID header
      const requestId = 'test-request-id-123';
      await request(app.getHttpServer())
        .get('/technical/database')
        .set('X-Request-ID', requestId)
        .expect(500);

      // Verify the error log contains the request ID
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].meta).toBeDefined();
      expect(errorLogs[0].meta.requestId).toBe(requestId);
    });

    it('should include user ID in error logs when authenticated', async () => {
      // Make a request with a mock user ID
      const userId = 'user-123';
      await request(app.getHttpServer())
        .get('/technical/internal')
        .set('X-User-ID', userId) // Simulating an authenticated request
        .expect(500);

      // Verify the error log contains the user ID
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].meta).toBeDefined();
      expect(errorLogs[0].meta.userId).toBe(userId);
    });

    it('should include journey context in error logs', async () => {
      // Make a request with journey context
      const journeyId = 'health';
      await request(app.getHttpServer())
        .get('/journey/health/metrics')
        .set('X-Journey-ID', journeyId)
        .expect(500);

      // Verify the error log contains the journey context
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].meta).toBeDefined();
      expect(errorLogs[0].meta.journeyId).toBe(journeyId);
    });

    it('should include HTTP method and URL in error logs', async () => {
      // Make a request
      const testPath = '/technical/database';
      await request(app.getHttpServer())
        .get(testPath)
        .expect(500);

      // Verify the error log contains the HTTP method and URL
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].meta).toBeDefined();
      expect(errorLogs[0].meta.method).toBe('GET');
      expect(errorLogs[0].meta.url).toBe(testPath);
    });
  });

  describe('Tracing Integration', () => {
    it('should correlate error logs with trace IDs', async () => {
      // Set a trace ID in the tracing service
      const traceId = 'test-trace-id-456';
      mockTracingService.currentTraceId = traceId;

      // Make a request
      await request(app.getHttpServer())
        .get('/technical/database')
        .expect(500);

      // Verify the error log contains the trace ID
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].meta).toBeDefined();
      expect(errorLogs[0].meta.traceId).toBe(traceId);
    });

    it('should correlate error logs with span IDs', async () => {
      // Set a span ID in the tracing service
      const spanId = 'test-span-id-456';
      mockTracingService.currentSpanId = spanId;

      // Make a request
      await request(app.getHttpServer())
        .get('/technical/database')
        .expect(500);

      // Verify the error log contains the span ID
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].meta).toBeDefined();
      expect(errorLogs[0].meta.spanId).toBe(spanId);
    });

    it('should record exceptions in the active span', async () => {
      // Make a request
      await request(app.getHttpServer())
        .get('/technical/database')
        .expect(500);

      // Verify an exception was recorded in the span
      const spans = mockTracingService.getSpans();
      expect(spans.length).toBeGreaterThan(0);
      
      const lastSpan = spans[spans.length - 1];
      expect(lastSpan.events).toBeDefined();
      
      const exceptionEvents = lastSpan.events.filter(event => event.name === 'exception');
      expect(exceptionEvents.length).toBeGreaterThan(0);
      
      const exceptionEvent = exceptionEvents[0];
      expect(exceptionEvent.attributes).toBeDefined();
      expect(exceptionEvent.attributes['exception.type']).toBe('DatabaseError');
      expect(exceptionEvent.attributes['exception.message']).toBe('Failed to execute database query');
    });

    it('should add error attributes to the active span', async () => {
      // Make a request
      await request(app.getHttpServer())
        .get('/technical/database')
        .expect(500);

      // Verify error attributes were added to the span
      const spans = mockTracingService.getSpans();
      expect(spans.length).toBeGreaterThan(0);
      
      const lastSpan = spans[spans.length - 1];
      expect(lastSpan.attributes).toBeDefined();
      expect(lastSpan.attributes['error']).toBe(true);
      expect(lastSpan.attributes['error.type']).toBe('DatabaseError');
    });
  });

  describe('Structured Logging', () => {
    it('should use structured logging format for errors', async () => {
      // Make a request
      await request(app.getHttpServer())
        .get('/technical/database')
        .expect(500);

      // Verify the error log has a structured format
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      
      const errorLog = errorLogs[0];
      expect(errorLog).toHaveProperty('level', 'error');
      expect(errorLog).toHaveProperty('message');
      expect(errorLog).toHaveProperty('context');
      expect(errorLog).toHaveProperty('meta');
      
      // Verify the meta object contains structured error details
      expect(errorLog.meta).toBeDefined();
      expect(errorLog.meta.errorType).toBe('TECHNICAL');
      expect(errorLog.meta.errorCode).toBe('DATABASE_ERROR');
      expect(errorLog.meta.operation).toBe('SELECT');
      expect(errorLog.meta.table).toBe('users');
    });

    it('should include stack traces in error logs', async () => {
      // Make a request
      await request(app.getHttpServer())
        .get('/technical/database')
        .expect(500);

      // Verify the error log contains a stack trace
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].meta).toBeDefined();
      expect(errorLogs[0].meta.trace).toBeDefined();
      expect(typeof errorLogs[0].meta.trace).toBe('string');
      expect(errorLogs[0].meta.trace).toContain('DatabaseError');
    });

    it('should use different log levels based on error type', async () => {
      // Make requests that trigger different error types
      await request(app.getHttpServer())
        .get('/validation/missing-param')
        .expect(400);

      await request(app.getHttpServer())
        .get('/business/resource/404')
        .expect(404);

      await request(app.getHttpServer())
        .get('/technical/database')
        .expect(500);

      // Verify the logs have appropriate levels
      const debugLogs = mockLoggerService.getLogsByLevel('debug');
      const warnLogs = mockLoggerService.getLogsByLevel('warn');
      const errorLogs = mockLoggerService.getLogsByLevel('error');

      // Validation errors should be debug level
      expect(debugLogs.length).toBeGreaterThan(0);
      expect(debugLogs[0].message).toContain('Validation error');

      // Business errors should be warn level
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(warnLogs[0].message).toContain('Business error');

      // Technical errors should be error level
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].message).toContain('Technical error');
    });
  });

  describe('Sensitive Data Sanitization', () => {
    it('should sanitize sensitive information in error logs', async () => {
      // Make a request with sensitive data
      await request(app.getHttpServer())
        .post('/validation/schema-validation')
        .send({
          name: 'Test User',
          age: 30,
          password: 'secret123',
          creditCard: '4111-1111-1111-1111',
          ssn: '123-45-6789'
        })
        .expect(400);

      // Verify sensitive data is sanitized in logs
      const logs = mockLoggerService.getLogs();
      const logStrings = logs.map(log => JSON.stringify(log));
      
      // Check that no log entry contains the sensitive data
      logStrings.forEach(logString => {
        expect(logString).not.toContain('secret123');
        expect(logString).not.toContain('4111-1111-1111-1111');
        expect(logString).not.toContain('123-45-6789');
      });
    });

    it('should sanitize sensitive information in error responses', async () => {
      // Make a request with sensitive data
      const response = await request(app.getHttpServer())
        .post('/validation/schema-validation')
        .send({
          name: 'Test User',
          age: 30,
          password: 'secret123',
          creditCard: '4111-1111-1111-1111',
          ssn: '123-45-6789'
        })
        .expect(400);

      // Verify sensitive data is sanitized in the response
      const responseBody = JSON.stringify(response.body);
      expect(responseBody).not.toContain('secret123');
      expect(responseBody).not.toContain('4111-1111-1111-1111');
      expect(responseBody).not.toContain('123-45-6789');
    });

    it('should sanitize sensitive headers in error logs', async () => {
      // Make a request with sensitive headers
      await request(app.getHttpServer())
        .get('/technical/database')
        .set('Authorization', 'Bearer secret-token-123')
        .set('X-API-Key', 'api-key-456')
        .expect(500);

      // Verify sensitive headers are sanitized in logs
      const logs = mockLoggerService.getLogs();
      const logStrings = logs.map(log => JSON.stringify(log));
      
      // Check that no log entry contains the sensitive headers
      logStrings.forEach(logString => {
        expect(logString).not.toContain('secret-token-123');
        expect(logString).not.toContain('api-key-456');
      });
    });

    it('should sanitize sensitive query parameters in error logs', async () => {
      // Make a request with sensitive query parameters
      await request(app.getHttpServer())
        .get('/validation/missing-param')
        .query({
          token: 'secret-token-789',
          password: 'query-password-123'
        })
        .expect(400);

      // Verify sensitive query parameters are sanitized in logs
      const logs = mockLoggerService.getLogs();
      const logStrings = logs.map(log => JSON.stringify(log));
      
      // Check that no log entry contains the sensitive query parameters
      logStrings.forEach(logString => {
        expect(logString).not.toContain('secret-token-789');
        expect(logString).not.toContain('query-password-123');
      });
    });
  });
});
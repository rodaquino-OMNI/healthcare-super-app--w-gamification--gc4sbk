import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from './test-app.module';
import { LoggerService } from '../../src/logger.service';
import { AppException, ErrorType } from '@austa/errors';
import { TestService } from './test.service';
import { TestController } from './test.controller';

/**
 * End-to-end tests for the integration between the logging service and exception handling system.
 * Verifies that exceptions are properly logged with appropriate context, stack traces, and severity levels.
 * Tests different error types (validation, business, technical, external) and ensures they're logged correctly.
 */
describe('Exceptions Integration (e2e)', () => {
  let app: INestApplication;
  let loggerService: LoggerService;
  let testService: TestService;
  
  // Spy on the logger methods to verify they're called correctly
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Create a testing module with our TestAppModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    // Create the NestJS application
    app = moduleFixture.createNestApplication();
    
    // Get the logger service and test service
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    testService = moduleFixture.get<TestService>(TestService);
    
    // Create spies on the logger methods
    logSpy = jest.spyOn(loggerService, 'log');
    errorSpy = jest.spyOn(loggerService, 'error');
    warnSpy = jest.spyOn(loggerService, 'warn');
    debugSpy = jest.spyOn(loggerService, 'debug');
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset all spies before each test
    jest.clearAllMocks();
  });

  describe('Error Type Classification', () => {
    it('should log validation errors with debug level', async () => {
      // Make a request that triggers a validation error
      await request(app.getHttpServer())
        .get('/test/error')
        .query({ type: 'validation' })
        .expect(HttpStatus.BAD_REQUEST);

      // Verify that the debug method was called with the correct message
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validation error'),
        expect.any(String)
      );
    });

    it('should log business errors with warn level', async () => {
      // Make a request that triggers a business error
      await request(app.getHttpServer())
        .get('/test/error')
        .query({ type: 'business' })
        .expect(HttpStatus.CONFLICT);

      // Verify that the warn method was called with the correct message
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Business logic error'),
        expect.any(String)
      );
    });

    it('should log technical errors with error level and include stack trace', async () => {
      // Make a request that triggers a technical error
      await request(app.getHttpServer())
        .get('/test/error')
        .query({ type: 'technical' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Verify that the error method was called with the correct message and stack trace
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Technical error'),
        expect.any(String), // Stack trace
        expect.any(String)  // Context
      );
    });

    it('should log external dependency errors with error level', async () => {
      // Make a request that triggers an external dependency error
      await request(app.getHttpServer())
        .get('/test/error')
        .query({ type: 'external' })
        .expect(HttpStatus.SERVICE_UNAVAILABLE);

      // Verify that the error method was called with the correct message
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('External service unavailable'),
        expect.any(String), // Stack trace
        expect.any(String)  // Context
      );
    });

    it('should log unhandled errors with error level and include stack trace', async () => {
      // Make a request that triggers an unhandled error
      await request(app.getHttpServer())
        .get('/test/error')
        .query({ type: 'unhandled' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Verify that the error method was called with the correct message and stack trace
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled exception'),
        expect.any(String), // Stack trace
        expect.any(String)  // Context
      );
    });
  });

  describe('Stack Trace Handling', () => {
    it('should include stack traces for technical errors in non-production environments', async () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';
      
      try {
        // Make a request that triggers a technical error
        const response = await request(app.getHttpServer())
          .get('/test/error')
          .query({ type: 'technical' })
          .expect(HttpStatus.INTERNAL_SERVER_ERROR);

        // Verify the response includes error details in development
        expect(response.body.error).toHaveProperty('details');
        
        // Verify that the error method was called with stack trace
        expect(errorSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('Error:'), // Stack trace should contain 'Error:'
          expect.any(String)
        );
      } finally {
        // Restore the original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should not include stack traces in error responses in production environment', async () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';
      
      try {
        // Make a request that triggers a technical error
        const response = await request(app.getHttpServer())
          .get('/test/error')
          .query({ type: 'technical' })
          .expect(HttpStatus.INTERNAL_SERVER_ERROR);

        // Verify the response does not include error details in production
        expect(response.body.error).not.toHaveProperty('details');
      } finally {
        // Restore the original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('Error Message Formatting and Sanitization', () => {
    it('should sanitize sensitive information in error messages', async () => {
      // Create a spy on the sanitizeMessage method
      const sanitizeSpy = jest.spyOn(testService as any, 'processSensitiveData');
      
      // Create user data with sensitive information
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        creditCard: '1234-5678-9012-3456',
        ssn: '123-45-6789'
      };
      
      // Make a request with sensitive data
      await request(app.getHttpServer())
        .post('/test/log-payload')
        .send(userData)
        .expect(HttpStatus.OK);

      // Verify that the log method was called
      expect(logSpy).toHaveBeenCalled();
      
      // Get the log message and verify sensitive data is sanitized
      const logCalls = logSpy.mock.calls;
      const payloadLogs = logCalls.filter(call => 
        typeof call[0] === 'string' && call[0].includes('payload')
      );
      
      // Check if any of the log messages contain sensitive information
      const sensitiveDataExposed = payloadLogs.some(call => {
        const logStr = JSON.stringify(call);
        return (
          logStr.includes('password123') ||
          logStr.includes('1234-5678-9012-3456') ||
          logStr.includes('123-45-6789')
        );
      });
      
      expect(sensitiveDataExposed).toBe(false);
    });

    it('should format error objects with proper structure', async () => {
      // Create a custom AppException
      const customError = new AppException(
        'Custom error message',
        ErrorType.TECHNICAL,
        'CUSTOM_ERROR_001',
        { additionalInfo: 'test' }
      );
      
      // Spy on the testService to throw our custom error
      jest.spyOn(testService, 'simulateError').mockImplementationOnce(() => {
        throw customError;
      });
      
      // Make a request that will trigger our custom error
      const response = await request(app.getHttpServer())
        .get('/test/error')
        .query({ type: 'custom' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Verify the error response has the correct structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('code', 'CUSTOM_ERROR_001');
      expect(response.body.error).toHaveProperty('message', 'Custom error message');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('additionalInfo', 'test');
      
      // Verify that the error was logged correctly
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom error message'),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('Error Correlation Across Services', () => {
    it('should include correlation IDs in error logs', async () => {
      // Mock the tracing service to return a specific trace ID
      const mockTraceId = 'test-trace-id-123';
      const mockSpanId = 'test-span-id-456';
      
      // Create a spy on the withCurrentTraceContext method
      const withTraceContextSpy = jest.spyOn(loggerService, 'withCurrentTraceContext');
      
      // Make a request with trace headers
      await request(app.getHttpServer())
        .get('/test/error')
        .query({ type: 'technical' })
        .set('X-Trace-ID', mockTraceId)
        .set('X-Span-ID', mockSpanId)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Verify that the withCurrentTraceContext method was called
      expect(withTraceContextSpy).toHaveBeenCalled();
      
      // Verify that the error was logged with trace context
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should maintain journey context in error logs', async () => {
      // Make a request with journey context
      await request(app.getHttpServer())
        .get('/test/journey/health')
        .expect(HttpStatus.OK);

      // Verify that the log includes journey context
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('health'),
        expect.objectContaining({
          journeyContext: expect.objectContaining({
            journeyType: 'health'
          })
        }),
        expect.any(String)
      );
      
      // Now make an error request with the same journey context
      await request(app.getHttpServer())
        .get('/test/error')
        .query({ type: 'technical' })
        .set('X-Journey-ID', 'health-journey-123')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Verify that the error log includes the journey context
      const errorCalls = errorSpy.mock.calls;
      const journeyErrorLogs = errorCalls.some(call => {
        const logStr = JSON.stringify(call);
        return logStr.includes('health-journey-123');
      });
      
      expect(journeyErrorLogs).toBe(true);
    });
  });

  describe('Custom Exception Handling', () => {
    it('should properly log custom exceptions with the correct error type', async () => {
      // Define custom exceptions for each error type
      const exceptions = [
        new AppException('Validation failed', ErrorType.VALIDATION, 'VAL_001', { field: 'email' }),
        new AppException('Business rule violated', ErrorType.BUSINESS, 'BUS_001', { rule: 'uniqueEmail' }),
        new AppException('System error occurred', ErrorType.TECHNICAL, 'TECH_001', { component: 'database' }),
        new AppException('External API failed', ErrorType.EXTERNAL, 'EXT_001', { service: 'payment' })
      ];
      
      // Test each exception type
      for (const exception of exceptions) {
        // Reset spies
        jest.clearAllMocks();
        
        // Mock the testService to throw our custom exception
        jest.spyOn(testService, 'simulateError').mockImplementationOnce(() => {
          throw exception;
        });
        
        // Make a request that will trigger our custom exception
        await request(app.getHttpServer())
          .get('/test/error')
          .query({ type: 'custom' })
          .expect(exception.type === ErrorType.VALIDATION ? HttpStatus.BAD_REQUEST :
                 exception.type === ErrorType.BUSINESS ? HttpStatus.CONFLICT :
                 exception.type === ErrorType.EXTERNAL ? HttpStatus.SERVICE_UNAVAILABLE :
                 HttpStatus.INTERNAL_SERVER_ERROR);
        
        // Verify that the appropriate log method was called based on error type
        switch (exception.type) {
          case ErrorType.VALIDATION:
            expect(debugSpy).toHaveBeenCalled();
            break;
          case ErrorType.BUSINESS:
            expect(warnSpy).toHaveBeenCalled();
            break;
          case ErrorType.TECHNICAL:
          case ErrorType.EXTERNAL:
            expect(errorSpy).toHaveBeenCalled();
            break;
        }
      }
    });
  });
});
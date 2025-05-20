import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppException, ErrorType } from '../../../shared/src/exceptions/exceptions.types';
import { AllExceptionsFilter } from '../../../shared/src/exceptions/exceptions.filter';
import { LoggerService } from '../../../shared/src/logging/logger.service';
import { LogCaptureUtils, AssertionUtils, TestContextUtils } from '../utils';
import { ErrorObjectsFixture } from '../fixtures/error-objects.fixture';
import { LogContextsFixture } from '../fixtures/log-contexts.fixture';
import { MockLoggerService } from '../mocks/logger.service.mock';
import { Controller, Get, Module, UseFilters } from '@nestjs/common';

/**
 * Test controller that throws different types of exceptions for testing
 */
@Controller('test')
@UseFilters(AllExceptionsFilter)
class TestExceptionController {
  @Get('validation-error')
  throwValidationError() {
    throw new AppException(
      'Invalid input data',
      ErrorType.VALIDATION,
      'TEST_VALIDATION_001',
      { field: 'username', constraint: 'required' }
    );
  }

  @Get('business-error')
  throwBusinessError() {
    throw new AppException(
      'Operation not allowed',
      ErrorType.BUSINESS,
      'TEST_BUSINESS_001',
      { reason: 'insufficient permissions' }
    );
  }

  @Get('technical-error')
  throwTechnicalError() {
    throw new AppException(
      'Database connection failed',
      ErrorType.TECHNICAL,
      'TEST_TECHNICAL_001',
      { service: 'postgres' }
    );
  }

  @Get('external-error')
  throwExternalError() {
    throw new AppException(
      'External API unavailable',
      ErrorType.EXTERNAL,
      'TEST_EXTERNAL_001',
      { service: 'payment-gateway' }
    );
  }

  @Get('nested-error')
  throwNestedError() {
    const originalError = new Error('Original database error');
    throw new AppException(
      'Failed to process request',
      ErrorType.TECHNICAL,
      'TEST_NESTED_001',
      { operation: 'data-processing' },
      originalError
    );
  }

  @Get('standard-error')
  throwStandardError() {
    throw new Error('Standard JavaScript error');
  }

  @Get('http-error')
  throwHttpError() {
    const error: any = new Error('Not Found');
    error.status = 404;
    throw error;
  }
}

/**
 * Test module for exception integration testing
 */
@Module({
  controllers: [TestExceptionController],
  providers: [
    {
      provide: LoggerService,
      useClass: MockLoggerService
    },
    AllExceptionsFilter
  ]
})
class TestExceptionModule {}

describe('Exceptions Integration with Logging (E2E)', () => {
  let app: INestApplication;
  let loggerService: MockLoggerService;
  let logCapture: LogCaptureUtils;

  beforeAll(async () => {
    // Create a testing module with our test controller and exception filter
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestExceptionModule],
    }).compile();

    // Get the mock logger service
    loggerService = moduleFixture.get<MockLoggerService>(LoggerService);
    
    // Create the application
    app = moduleFixture.createNestApplication();
    
    // Set up global pipes and filters
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter(loggerService));
    
    // Initialize log capture
    logCapture = new LogCaptureUtils();
    logCapture.startCapture();
    
    await app.init();
  });

  afterEach(() => {
    // Clear captured logs and reset the mock logger between tests
    logCapture.clearCapture();
    loggerService.reset();
  });

  afterAll(async () => {
    // Stop log capture and close the application
    logCapture.stopCapture();
    await app.close();
  });

  describe('Error Classification and Logging', () => {
    it('should log validation errors with DEBUG level', async () => {
      // Make a request that will trigger a validation error
      await request(app.getHttpServer())
        .get('/test/validation-error')
        .expect(400);

      // Verify the error was logged with the correct level and details
      expect(loggerService.debugMessages.length).toBeGreaterThan(0);
      const lastDebugMessage = loggerService.debugMessages[loggerService.debugMessages.length - 1];
      
      // Verify log content
      AssertionUtils.assertLogContains(lastDebugMessage, 'Validation error');
      AssertionUtils.assertLogContains(lastDebugMessage, 'TEST_VALIDATION_001');
    });

    it('should log business errors with WARN level', async () => {
      // Make a request that will trigger a business error
      await request(app.getHttpServer())
        .get('/test/business-error')
        .expect(422);

      // Verify the error was logged with the correct level and details
      expect(loggerService.warnMessages.length).toBeGreaterThan(0);
      const lastWarnMessage = loggerService.warnMessages[loggerService.warnMessages.length - 1];
      
      // Verify log content
      AssertionUtils.assertLogContains(lastWarnMessage, 'Business error');
      AssertionUtils.assertLogContains(lastWarnMessage, 'TEST_BUSINESS_001');
    });

    it('should log technical errors with ERROR level and include stack trace', async () => {
      // Make a request that will trigger a technical error
      await request(app.getHttpServer())
        .get('/test/technical-error')
        .expect(500);

      // Verify the error was logged with the correct level and details
      expect(loggerService.errorMessages.length).toBeGreaterThan(0);
      const lastErrorMessage = loggerService.errorMessages[loggerService.errorMessages.length - 1];
      const lastErrorTrace = loggerService.errorTraces[loggerService.errorTraces.length - 1];
      
      // Verify log content
      AssertionUtils.assertLogContains(lastErrorMessage, 'Technical error');
      AssertionUtils.assertLogContains(lastErrorMessage, 'TEST_TECHNICAL_001');
      
      // Verify stack trace was captured
      expect(lastErrorTrace).toBeDefined();
      expect(lastErrorTrace).toContain('AppException');
    });

    it('should log external dependency errors with ERROR level', async () => {
      // Make a request that will trigger an external error
      await request(app.getHttpServer())
        .get('/test/external-error')
        .expect(502);

      // Verify the error was logged with the correct level and details
      expect(loggerService.errorMessages.length).toBeGreaterThan(0);
      const lastErrorMessage = loggerService.errorMessages[loggerService.errorMessages.length - 1];
      
      // Verify log content
      AssertionUtils.assertLogContains(lastErrorMessage, 'External system error');
      AssertionUtils.assertLogContains(lastErrorMessage, 'TEST_EXTERNAL_001');
    });
  });

  describe('Error Details and Context', () => {
    it('should include error details in logs for technical errors', async () => {
      // Make a request that will trigger a technical error
      await request(app.getHttpServer())
        .get('/test/technical-error')
        .expect(500);

      // Verify error details were included in the log
      const lastErrorMessage = loggerService.errorMessages[loggerService.errorMessages.length - 1];
      AssertionUtils.assertLogContains(lastErrorMessage, 'service');
      AssertionUtils.assertLogContains(lastErrorMessage, 'postgres');
    });

    it('should capture and log original errors in nested exceptions', async () => {
      // Make a request that will trigger a nested error
      await request(app.getHttpServer())
        .get('/test/nested-error')
        .expect(500);

      // Verify the error was logged with the correct level and details
      expect(loggerService.errorMessages.length).toBeGreaterThan(0);
      const lastErrorMessage = loggerService.errorMessages[loggerService.errorMessages.length - 1];
      const lastErrorTrace = loggerService.errorTraces[loggerService.errorTraces.length - 1];
      
      // Verify log content includes both the wrapper and original error
      AssertionUtils.assertLogContains(lastErrorMessage, 'Failed to process request');
      AssertionUtils.assertLogContains(lastErrorMessage, 'TEST_NESTED_001');
      
      // Verify stack trace contains information about the original error
      expect(lastErrorTrace).toContain('Original database error');
    });

    it('should handle and log standard JavaScript errors', async () => {
      // Make a request that will trigger a standard error
      await request(app.getHttpServer())
        .get('/test/standard-error')
        .expect(500);

      // Verify the error was logged with the correct level and details
      expect(loggerService.errorMessages.length).toBeGreaterThan(0);
      const lastErrorMessage = loggerService.errorMessages[loggerService.errorMessages.length - 1];
      
      // Verify log content
      AssertionUtils.assertLogContains(lastErrorMessage, 'Unhandled exception');
      AssertionUtils.assertLogContains(lastErrorMessage, 'Standard JavaScript error');
    });
  });

  describe('Request Context in Error Logs', () => {
    it('should include request information in error logs', async () => {
      // Add a custom header to simulate journey context
      await request(app.getHttpServer())
        .get('/test/technical-error')
        .set('x-journey-id', 'health-journey')
        .set('x-request-id', 'test-request-123')
        .expect(500);

      // Verify request context was included in the log
      const lastErrorContext = loggerService.errorContexts[loggerService.errorContexts.length - 1];
      expect(lastErrorContext).toBeDefined();
      expect(lastErrorContext).toContain('ExceptionsFilter');
    });

    it('should sanitize sensitive information in error logs', async () => {
      // Make a request with sensitive information in query params
      await request(app.getHttpServer())
        .get('/test/validation-error?password=secret&token=sensitive')
        .expect(400);

      // Verify sensitive information was sanitized
      const allLogs = loggerService.getAllLogs();
      const sensitiveLog = allLogs.find(log => 
        log.includes('password') || log.includes('token')
      );
      
      // Should not find any logs with the sensitive information
      expect(sensitiveLog).toBeUndefined();
    });
  });

  describe('Error Correlation', () => {
    it('should maintain correlation IDs across error logs', async () => {
      const correlationId = 'test-correlation-123';
      
      // Make a request with a correlation ID
      await request(app.getHttpServer())
        .get('/test/technical-error')
        .set('x-correlation-id', correlationId)
        .expect(500);

      // Verify correlation ID was preserved in logs
      const allLogs = loggerService.getAllLogs();
      const correlatedLogs = allLogs.filter(log => log.includes(correlationId));
      
      // Should find at least one log with the correlation ID
      expect(correlatedLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Environment-Specific Behavior', () => {
    const originalEnv = process.env.NODE_ENV;
    
    afterEach(() => {
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should include detailed error information in non-production environments', async () => {
      // Set non-production environment
      process.env.NODE_ENV = 'development';
      
      // Make a request that will trigger a standard error
      await request(app.getHttpServer())
        .get('/test/standard-error')
        .expect(500)
        .then(response => {
          // Verify response includes detailed error information
          expect(response.body.error).toBeDefined();
          expect(response.body.error.details).toBeDefined();
        });
    });

    it('should exclude detailed error information in production environment', async () => {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      // Make a request that will trigger a standard error
      await request(app.getHttpServer())
        .get('/test/standard-error')
        .expect(500)
        .then(response => {
          // Verify response excludes detailed error information
          expect(response.body.error).toBeDefined();
          expect(response.body.error.details).toBeUndefined();
        });
    });
  });
});
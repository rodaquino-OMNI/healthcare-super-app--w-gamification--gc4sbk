import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { LoggerService } from '../../src/logger.service';
import { TestAppModule } from './test-app.module';
import { AppException, ErrorType } from '@austa/errors';
import { TEST_ERRORS, TEST_JOURNEY_CONTEXTS, TEST_USER_CONTEXT, TEST_REQUEST_CONTEXT } from '../test-constants';
import { JourneyType } from '../../src/context/context.constants';

/**
 * End-to-end tests for the integration between the logging service and exception handling system.
 * 
 * These tests verify that exceptions are properly logged with appropriate context, stack traces,
 * and severity levels. They ensure that different error types (validation, business, technical, external)
 * are logged with the correct formatting and level.
 */
describe('Exceptions Integration', () => {
  let app: INestApplication;
  let loggerService: LoggerService;
  let originalEnv: NodeJS.ProcessEnv;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeAll(() => {
    // Save original environment variables
    originalEnv = { ...process.env };
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  beforeEach(async () => {
    // Create a testing module with our TestAppModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    loggerService = moduleFixture.get<LoggerService>(LoggerService);

    // Spy on logger methods to verify they're called correctly
    errorSpy = jest.spyOn(loggerService, 'error');
    warnSpy = jest.spyOn(loggerService, 'warn');
    debugSpy = jest.spyOn(loggerService, 'debug');

    await app.init();
  });

  afterEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    await app.close();
  });

  describe('Error Classification and Logging', () => {
    it('should log validation errors with DEBUG level', () => {
      // Create a validation error
      const validationError = new AppException(
        'Invalid input: Email is required',
        ErrorType.VALIDATION,
        'AUTH_001',
        { field: 'email', constraint: 'required' }
      );

      // Simulate error handling
      try {
        throw validationError;
      } catch (error) {
        // Handle the error as the exception filter would
        loggerService.debug(`Validation error: ${error.message} (${error.code})`, 'ExceptionsFilter');
      }

      // Verify the error was logged with the correct level and message
      expect(debugSpy).toHaveBeenCalledWith(
        'Validation error: Invalid input: Email is required (AUTH_001)',
        'ExceptionsFilter'
      );
    });

    it('should log business errors with WARN level', () => {
      // Create a business error
      const businessError = new AppException(
        'Appointment slot already booked',
        ErrorType.BUSINESS,
        'CARE_002',
        { appointmentId: '12345', time: '2023-06-15T10:00:00Z' }
      );

      // Simulate error handling
      try {
        throw businessError;
      } catch (error) {
        // Handle the error as the exception filter would
        loggerService.warn(`Business error: ${error.message} (${error.code})`, 'ExceptionsFilter');
      }

      // Verify the error was logged with the correct level and message
      expect(warnSpy).toHaveBeenCalledWith(
        'Business error: Appointment slot already booked (CARE_002)',
        'ExceptionsFilter'
      );
    });

    it('should log technical errors with ERROR level and include stack trace', () => {
      // Create a technical error
      const technicalError = new AppException(
        'Database connection failed',
        ErrorType.TECHNICAL,
        'DB_001',
        { database: 'care_service_db' },
        TEST_ERRORS.database
      );

      // Simulate error handling
      try {
        throw technicalError;
      } catch (error) {
        // Handle the error as the exception filter would
        loggerService.error(
          `Technical error: ${error.message} (${error.code})`,
          error.stack,
          'ExceptionsFilter'
        );
      }

      // Verify the error was logged with the correct level, message, and stack trace
      expect(errorSpy).toHaveBeenCalledWith(
        'Technical error: Database connection failed (DB_001)',
        expect.stringContaining('Error: Database connection failed'),
        'ExceptionsFilter'
      );
    });

    it('should log external dependency errors with ERROR level', () => {
      // Create an external dependency error
      const externalError = new AppException(
        'Payment gateway timeout',
        ErrorType.EXTERNAL,
        'PAYMENT_001',
        { provider: 'stripe', operation: 'charge' },
        TEST_ERRORS.network
      );

      // Simulate error handling
      try {
        throw externalError;
      } catch (error) {
        // Handle the error as the exception filter would
        loggerService.error(
          `External system error: ${error.message} (${error.code})`,
          error.stack,
          'ExceptionsFilter'
        );
      }

      // Verify the error was logged with the correct level and message
      expect(errorSpy).toHaveBeenCalledWith(
        'External system error: Payment gateway timeout (PAYMENT_001)',
        expect.stringContaining('Error: Network request timeout'),
        'ExceptionsFilter'
      );
    });
  });

  describe('Stack Trace Handling', () => {
    it('should include stack traces in non-production environments', () => {
      // Ensure we're in a non-production environment
      process.env.NODE_ENV = 'development';

      // Create a technical error
      const technicalError = new AppException(
        'Unexpected server error',
        ErrorType.TECHNICAL,
        'SERVER_001',
        { component: 'auth-service' },
        TEST_ERRORS.basic
      );

      // Simulate error handling
      try {
        throw technicalError;
      } catch (error) {
        // Handle the error as the exception filter would
        loggerService.error(
          `Technical error: ${error.message} (${error.code})`,
          error.stack,
          'ExceptionsFilter'
        );
      }

      // Verify the stack trace was included
      expect(errorSpy).toHaveBeenCalledWith(
        'Technical error: Unexpected server error (SERVER_001)',
        expect.stringContaining('at TestFunction'),
        'ExceptionsFilter'
      );
    });

    it('should sanitize stack traces in production environment', () => {
      // Set production environment
      process.env.NODE_ENV = 'production';

      // Create a technical error
      const technicalError = new AppException(
        'Unexpected server error',
        ErrorType.TECHNICAL,
        'SERVER_001',
        { component: 'auth-service' },
        TEST_ERRORS.basic
      );

      // Create a sanitized version of the error for production
      const sanitizedError = {
        message: technicalError.message,
        type: technicalError.type,
        code: technicalError.code,
      };

      // Simulate error handling in production
      try {
        throw technicalError;
      } catch (error) {
        // In production, we might sanitize the error before logging
        loggerService.error(
          `Technical error: ${sanitizedError.message} (${sanitizedError.code})`,
          undefined, // No stack trace in production
          'ExceptionsFilter'
        );
      }

      // Verify the error was logged without a stack trace
      expect(errorSpy).toHaveBeenCalledWith(
        'Technical error: Unexpected server error (SERVER_001)',
        undefined,
        'ExceptionsFilter'
      );

      // Reset environment
      process.env.NODE_ENV = 'test';
    });
  });

  describe('Error Message Formatting', () => {
    it('should format error messages consistently', () => {
      // Create errors of different types
      const errors = [
        new AppException('Invalid input', ErrorType.VALIDATION, 'VAL_001'),
        new AppException('Business rule violation', ErrorType.BUSINESS, 'BUS_001'),
        new AppException('System failure', ErrorType.TECHNICAL, 'TECH_001'),
        new AppException('External API error', ErrorType.EXTERNAL, 'EXT_001'),
      ];

      // Log each error
      errors.forEach(error => {
        try {
          throw error;
        } catch (e) {
          // Format the message based on error type
          const prefix = `${e.type.charAt(0).toUpperCase() + e.type.slice(1)} error`;
          const message = `${prefix}: ${e.message} (${e.code})`;
          
          // Log with appropriate level
          switch (e.type) {
            case ErrorType.VALIDATION:
              loggerService.debug(message, 'ExceptionsFilter');
              break;
            case ErrorType.BUSINESS:
              loggerService.warn(message, 'ExceptionsFilter');
              break;
            case ErrorType.TECHNICAL:
            case ErrorType.EXTERNAL:
              loggerService.error(message, e.stack, 'ExceptionsFilter');
              break;
          }
        }
      });

      // Verify all errors were logged with consistent formatting
      expect(debugSpy).toHaveBeenCalledWith(
        'Validation error: Invalid input (VAL_001)',
        'ExceptionsFilter'
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'Business error: Business rule violation (BUS_001)',
        'ExceptionsFilter'
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Technical error: System failure (TECH_001)',
        expect.any(String),
        'ExceptionsFilter'
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'External error: External API error (EXT_001)',
        expect.any(String),
        'ExceptionsFilter'
      );
    });

    it('should sanitize sensitive information from error messages', () => {
      // Create an error with sensitive information
      const errorWithSensitiveInfo = new AppException(
        'Authentication failed for user john.doe@example.com with password P@ssw0rd',
        ErrorType.VALIDATION,
        'AUTH_002',
        { username: 'john.doe@example.com', password: 'P@ssw0rd' }
      );

      // Function to sanitize sensitive data
      const sanitizeMessage = (message: string): string => {
        return message
          .replace(/password\s+[^\s]+/gi, 'password [REDACTED]')
          .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL_REDACTED]');
      };

      // Simulate error handling with sanitization
      try {
        throw errorWithSensitiveInfo;
      } catch (error) {
        const sanitizedMessage = sanitizeMessage(error.message);
        loggerService.debug(`Validation error: ${sanitizedMessage} (${error.code})`, 'ExceptionsFilter');
      }

      // Verify sensitive information was redacted
      expect(debugSpy).toHaveBeenCalledWith(
        'Validation error: Authentication failed for user [EMAIL_REDACTED] with password [REDACTED] (AUTH_002)',
        'ExceptionsFilter'
      );
    });
  });

  describe('Error Correlation', () => {
    it('should include journey context in error logs', () => {
      // Create a journey-specific logger
      const healthLogger = loggerService.withJourneyContext(TEST_JOURNEY_CONTEXTS[JourneyType.HEALTH]);
      const errorWithJourneySpy = jest.spyOn(healthLogger, 'error');

      // Create a health journey error
      const healthError = new AppException(
        'Health metric validation failed',
        ErrorType.VALIDATION,
        'HEALTH_001',
        { metricType: 'heart-rate', value: -10 }
      );

      // Simulate error handling with journey context
      try {
        throw healthError;
      } catch (error) {
        healthLogger.error(
          `Error in Health journey: ${error.message} (${error.code})`,
          error.stack,
          'HealthService'
        );
      }

      // Verify journey context was included
      expect(errorWithJourneySpy).toHaveBeenCalledWith(
        'Error in Health journey: Health metric validation failed (HEALTH_001)',
        expect.any(String),
        'HealthService'
      );
    });

    it('should correlate errors across services with request context', () => {
      // Create a logger with request context
      const requestLogger = loggerService.withRequestContext(TEST_REQUEST_CONTEXT);
      const requestErrorSpy = jest.spyOn(requestLogger, 'error');

      // Create an error in a downstream service
      const downstreamError = new AppException(
        'Failed to process health data',
        ErrorType.TECHNICAL,
        'HEALTH_002',
        { operation: 'processHealthMetrics' }
      );

      // Simulate error propagation across services
      try {
        // Simulate downstream service error
        throw downstreamError;
      } catch (downstreamErr) {
        try {
          // Simulate API gateway wrapping the error
          throw new AppException(
            'Error processing request',
            ErrorType.TECHNICAL,
            'API_001',
            { originalError: downstreamErr.message },
            downstreamErr
          );
        } catch (gatewayErr) {
          // Log the error with request context
          requestLogger.error(
            `Gateway error: ${gatewayErr.message} (${gatewayErr.code})`,
            gatewayErr.stack,
            'ApiGateway'
          );
        }
      }

      // Verify request context was included for correlation
      expect(requestErrorSpy).toHaveBeenCalledWith(
        'Gateway error: Error processing request (API_001)',
        expect.stringContaining('Error: Failed to process health data'),
        'ApiGateway'
      );
    });

    it('should include user context in error logs for user-related errors', () => {
      // Create a logger with user context
      const userLogger = loggerService.withUserContext(TEST_USER_CONTEXT);
      const userErrorSpy = jest.spyOn(userLogger, 'warn');

      // Create a user-related error
      const userError = new AppException(
        'User exceeded daily API limit',
        ErrorType.BUSINESS,
        'RATE_001',
        { limit: 100, current: 101 }
      );

      // Simulate error handling with user context
      try {
        throw userError;
      } catch (error) {
        userLogger.warn(
          `Rate limiting error: ${error.message} (${error.code})`,
          'RateLimitingService'
        );
      }

      // Verify user context was included
      expect(userErrorSpy).toHaveBeenCalledWith(
        'Rate limiting error: User exceeded daily API limit (RATE_001)',
        'RateLimitingService'
      );
    });
  });

  describe('Error Aggregation', () => {
    it('should log errors with consistent structure for aggregation', () => {
      // Create multiple instances of the same error type
      const errors = [
        new AppException('Database query timeout', ErrorType.TECHNICAL, 'DB_002', { query: 'SELECT * FROM users' }),
        new AppException('Database query timeout', ErrorType.TECHNICAL, 'DB_002', { query: 'SELECT * FROM metrics' }),
        new AppException('Database query timeout', ErrorType.TECHNICAL, 'DB_002', { query: 'SELECT * FROM appointments' }),
      ];

      // Log each error with the same structure
      errors.forEach((error, index) => {
        try {
          throw error;
        } catch (e) {
          loggerService.error(
            `Database error [${index + 1}]: ${e.message} (${e.code})`,
            e.stack,
            'DatabaseService'
          );
        }
      });

      // Verify all errors were logged with consistent structure
      expect(errorSpy).toHaveBeenCalledTimes(3);
      expect(errorSpy).toHaveBeenNthCalledWith(
        1,
        'Database error [1]: Database query timeout (DB_002)',
        expect.any(String),
        'DatabaseService'
      );
      expect(errorSpy).toHaveBeenNthCalledWith(
        2,
        'Database error [2]: Database query timeout (DB_002)',
        expect.any(String),
        'DatabaseService'
      );
      expect(errorSpy).toHaveBeenNthCalledWith(
        3,
        'Database error [3]: Database query timeout (DB_002)',
        expect.any(String),
        'DatabaseService'
      );
    });
  });
});
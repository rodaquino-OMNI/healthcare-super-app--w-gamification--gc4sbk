import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { BaseError } from '../../src/base';
import { ErrorType, JourneyContext } from '../../src/types';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { AllExceptionsFilter } from '../../src/nest/filters/all-exceptions.filter';

// Mock implementation of LoggerService to capture logs
class MockLoggerService implements Partial<LoggerService> {
  public logs: Array<{ level: string; message: string; context?: any; trace?: any }> = [];

  log(message: string, context?: any): void {
    this.logs.push({ level: 'info', message, context });
  }

  error(message: string, trace?: any, context?: any): void {
    this.logs.push({ level: 'error', message, trace, context });
  }

  warn(message: string, context?: any): void {
    this.logs.push({ level: 'warn', message, context });
  }

  debug(message: string, context?: any): void {
    this.logs.push({ level: 'debug', message, context });
  }

  verbose(message: string, context?: any): void {
    this.logs.push({ level: 'verbose', message, context });
  }

  clear(): void {
    this.logs = [];
  }
}

// Mock implementation of TracingService
class MockTracingService implements Partial<TracingService> {
  getCurrentTraceId(): string {
    return 'mock-trace-id';
  }

  getCurrentSpanId(): string {
    return 'mock-span-id';
  }

  startSpan(name: string): any {
    return {
      end: () => {}
    };
  }
}

// Test error classes for different error types
class TestTechnicalError extends BaseError {
  constructor(message: string, code: string, details?: any) {
    super(message, ErrorType.TECHNICAL, code, details);
  }
}

class TestBusinessError extends BaseError {
  constructor(message: string, code: string, details?: any) {
    super(message, ErrorType.BUSINESS, code, details);
  }
}

class TestValidationError extends BaseError {
  constructor(message: string, code: string, details?: any) {
    super(message, ErrorType.VALIDATION, code, details);
  }
}

class TestExternalError extends BaseError {
  constructor(message: string, code: string, details?: any) {
    super(message, ErrorType.EXTERNAL, code, details);
  }
}

// Test controller to simulate HTTP context
class TestController {
  throwError(errorType: string, includeDetails: boolean = false): void {
    switch (errorType) {
      case 'technical':
        throw new TestTechnicalError('Technical error occurred', 'TECH_ERROR', 
          includeDetails ? { sensitive: 'secret-data', public: 'public-data' } : undefined);
      case 'business':
        throw new TestBusinessError('Business rule violation', 'BIZ_ERROR',
          includeDetails ? { reason: 'Invalid operation for current state' } : undefined);
      case 'validation':
        throw new TestValidationError('Validation failed', 'VALIDATION_ERROR',
          includeDetails ? { fields: ['name', 'email'] } : undefined);
      case 'external':
        throw new TestExternalError('External system failure', 'EXT_ERROR',
          includeDetails ? { service: 'payment-gateway', status: 503 } : undefined);
      default:
        throw new Error('Unknown error');
    }
  }
}

describe('Error Logging Integration', () => {
  let app: INestApplication;
  let mockLoggerService: MockLoggerService;
  let mockTracingService: MockTracingService;
  let exceptionFilter: AllExceptionsFilter;
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(async () => {
    mockLoggerService = new MockLoggerService();
    mockTracingService = new MockTracingService();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TracingService, useValue: mockTracingService },
        AllExceptionsFilter,
        TestController
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    exceptionFilter = moduleRef.get<AllExceptionsFilter>(AllExceptionsFilter);
    
    // Use the exception filter globally
    app.useGlobalFilters(exceptionFilter);
    
    await app.init();
  });

  afterEach(async () => {
    mockLoggerService.clear();
    await app.close();
  });

  describe('Error Severity Levels', () => {
    it('should log technical errors with ERROR level', () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestTechnicalError('Critical system failure', 'SYSTEM_ERROR');
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      expect(mockLoggerService.logs[0].level).toBe('error');
      expect(mockLoggerService.logs[0].message).toContain('Technical error');
      expect(mockLoggerService.logs[0].message).toContain('SYSTEM_ERROR');
    });

    it('should log business errors with WARN level', () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestBusinessError('Business rule violation', 'BUSINESS_RULE_ERROR');
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      expect(mockLoggerService.logs[0].level).toBe('warn');
      expect(mockLoggerService.logs[0].message).toContain('Business error');
      expect(mockLoggerService.logs[0].message).toContain('BUSINESS_RULE_ERROR');
    });

    it('should log validation errors with DEBUG level', () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestValidationError('Invalid input data', 'VALIDATION_ERROR');
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      expect(mockLoggerService.logs[0].level).toBe('debug');
      expect(mockLoggerService.logs[0].message).toContain('Validation error');
      expect(mockLoggerService.logs[0].message).toContain('VALIDATION_ERROR');
    });

    it('should log external errors with ERROR level', () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestExternalError('External API failure', 'EXTERNAL_API_ERROR');
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      expect(mockLoggerService.logs[0].level).toBe('error');
      expect(mockLoggerService.logs[0].message).toContain('External system error');
      expect(mockLoggerService.logs[0].message).toContain('EXTERNAL_API_ERROR');
    });
  });

  describe('Context Information', () => {
    it('should include request information in error logs', () => {
      // Arrange
      const mockRequest = createMockRequest({
        method: 'POST',
        url: '/api/health/metrics',
        user: { id: 'user-123' }
      });
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestTechnicalError('System error', 'SYSTEM_ERROR');
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      const logContext = mockLoggerService.logs[0].context;
      expect(logContext).toBeDefined();
      expect(logContext.request).toBeDefined();
      expect(logContext.request.method).toBe('POST');
      expect(logContext.request.url).toBe('/api/health/metrics');
      expect(logContext.request.userId).toBe('user-123');
    });

    it('should include journey context in error logs', () => {
      // Arrange
      const journeyContext: JourneyContext = {
        journeyId: 'health',
        journeyName: 'Minha Saúde',
        featureId: 'metrics',
        featureName: 'Health Metrics'
      };
      
      const mockRequest = createMockRequest({
        headers: { 'x-journey-id': 'health' },
        journeyContext
      });
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestBusinessError('Business rule violation', 'BUSINESS_RULE_ERROR');
      error.setJourneyContext(journeyContext);
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      const logContext = mockLoggerService.logs[0].context;
      expect(logContext).toBeDefined();
      expect(logContext.journey).toBeDefined();
      expect(logContext.journey.journeyId).toBe('health');
      expect(logContext.journey.journeyName).toBe('Minha Saúde');
      expect(logContext.journey.featureId).toBe('metrics');
    });

    it('should include correlation IDs in error logs', () => {
      // Arrange
      const mockRequest = createMockRequest({
        headers: { 
          'x-correlation-id': 'corr-123',
          'x-request-id': 'req-456'
        }
      });
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestTechnicalError('System error', 'SYSTEM_ERROR');
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      const logContext = mockLoggerService.logs[0].context;
      expect(logContext).toBeDefined();
      expect(logContext.correlationId).toBe('corr-123');
      expect(logContext.requestId).toBe('req-456');
      expect(logContext.traceId).toBe('mock-trace-id'); // From mock tracing service
    });
  });

  describe('Error Serialization', () => {
    it('should sanitize sensitive data in error logs', () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestTechnicalError('System error', 'SYSTEM_ERROR', {
        password: 'secret123',
        token: 'jwt-token-here',
        publicInfo: 'This is public',
        user: {
          id: 'user-123',
          password: 'another-secret',
          email: 'user@example.com'
        }
      });
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      const loggedError = JSON.parse(JSON.stringify(mockLoggerService.logs[0].trace || {}));
      
      // Sensitive fields should be redacted
      expect(loggedError).not.toContain('secret123');
      expect(loggedError).not.toContain('jwt-token-here');
      expect(loggedError).not.toContain('another-secret');
      
      // Public information should be preserved
      expect(loggedError).toContain('This is public');
      expect(loggedError).toContain('user-123');
      expect(loggedError).toContain('user@example.com');
    });

    it('should preserve diagnostic information in error logs', () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestExternalError('External API failure', 'EXTERNAL_API_ERROR', {
        service: 'payment-gateway',
        endpoint: '/api/payments',
        statusCode: 503,
        responseTime: 5000,
        retryAttempt: 3
      });
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      const loggedError = JSON.stringify(mockLoggerService.logs[0]);
      
      // Diagnostic information should be preserved
      expect(loggedError).toContain('payment-gateway');
      expect(loggedError).toContain('/api/payments');
      expect(loggedError).toContain('503');
      expect(loggedError).toContain('5000');
      expect(loggedError).toContain('3');
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should include stack traces in development environment', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestTechnicalError('System error', 'SYSTEM_ERROR');
      
      // Act
      exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      expect(mockLoggerService.logs[0].trace).toBeDefined();
      expect(mockLoggerService.logs[0].trace).toContain('TestTechnicalError');
      expect(mockLoggerService.logs[0].trace).toContain('System error');
    });

    it('should exclude detailed stack traces in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const host = createMockArgumentsHost(mockRequest, mockResponse);
      const error = new TestTechnicalError('System error', 'SYSTEM_ERROR');
      
      // Act
      const response = exceptionFilter.catch(error, host);
      
      // Assert
      expect(mockLoggerService.logs.length).toBe(1);
      
      // Stack trace should still be logged for internal purposes
      expect(mockLoggerService.logs[0].trace).toBeDefined();
      
      // But the response to the client should not contain detailed error info
      expect(response.error).toBeDefined();
      expect(response.error.message).toBe('System error');
      expect(response.error.details).toBeUndefined();
    });
  });
});

// Helper functions to create mock objects for testing
function createMockRequest(overrides: any = {}) {
  return {
    method: 'GET',
    url: '/api/test',
    headers: {},
    user: null,
    ...overrides
  };
}

function createMockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function createMockArgumentsHost(req: any, res: any) {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res
    }),
    getType: () => 'http',
    getArgs: () => [req, res]
  };
}
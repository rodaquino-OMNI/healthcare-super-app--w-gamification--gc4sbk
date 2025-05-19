import { Test } from '@nestjs/testing';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { Request, Response } from 'express';
import {
  ApiGatewayLogger,
  createApiGatewayLogger,
  getApiGatewayLogger,
  ensureCorrelationId,
  generateCorrelationId,
  createStructuredLog,
  sanitizeLogData,
  measureExecutionTime,
} from '../../src/utils/logging.util';
import { JourneyType } from '@austa/interfaces/common';

// Mock implementations
class MockLoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
  setContext = jest.fn().mockReturnThis();
}

class MockTracingService {
  createSpan = jest.fn().mockImplementation((name, fn) => Promise.resolve(fn()));
  getCorrelationId = jest.fn().mockReturnValue('mock-correlation-id');
}

describe('ApiGatewayLogger', () => {
  let apiGatewayLogger: ApiGatewayLogger;
  let loggerService: MockLoggerService;
  let tracingService: MockTracingService;

  beforeEach(async () => {
    // Create a testing module with our mocks
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LoggerService,
          useClass: MockLoggerService,
        },
        {
          provide: TracingService,
          useClass: MockTracingService,
        },
        ApiGatewayLogger,
      ],
    }).compile();

    // Get the services from the testing module
    loggerService = moduleRef.get(LoggerService) as unknown as MockLoggerService;
    tracingService = moduleRef.get(TracingService) as unknown as MockTracingService;
    apiGatewayLogger = moduleRef.get(ApiGatewayLogger);

    // Initialize the singleton instance
    createApiGatewayLogger(loggerService as unknown as LoggerService, tracingService as unknown as TracingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic logging methods', () => {
    it('should log messages with the correct level and context', () => {
      apiGatewayLogger.log('Test message');
      expect(loggerService.log).toHaveBeenCalledWith('Test message', 'ApiGateway');

      apiGatewayLogger.error('Error message', 'Error stack');
      expect(loggerService.error).toHaveBeenCalledWith('Error message', 'Error stack', 'ApiGateway');

      apiGatewayLogger.warn('Warning message');
      expect(loggerService.warn).toHaveBeenCalledWith('Warning message', 'ApiGateway');

      apiGatewayLogger.debug('Debug message');
      expect(loggerService.debug).toHaveBeenCalledWith('Debug message', 'ApiGateway');

      apiGatewayLogger.verbose('Verbose message');
      expect(loggerService.verbose).toHaveBeenCalledWith('Verbose message', 'ApiGateway');
    });

    it('should use custom context when provided', () => {
      apiGatewayLogger.log('Test message', 'CustomContext');
      expect(loggerService.log).toHaveBeenCalledWith('Test message', 'CustomContext');
    });
  });

  describe('Context creation', () => {
    it('should create request context from Express request', () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/health/metrics',
        path: '/api/health/metrics',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
          'authorization': 'Bearer token',
        },
        query: {
          param1: 'value1',
          password: 'secret',
        },
      } as unknown as Request;

      const context = apiGatewayLogger.createRequestContext(mockRequest);

      expect(context).toHaveProperty('requestId', 'mock-correlation-id');
      expect(context).toHaveProperty('method', 'GET');
      expect(context).toHaveProperty('url', '/api/health/metrics');
      expect(context).toHaveProperty('path', '/api/health/metrics');
      expect(context).toHaveProperty('ip', '127.0.0.1');
      expect(context).toHaveProperty('userAgent', 'test-agent');
      expect(context).toHaveProperty('headers');
      expect(context.headers).toHaveProperty('authorization', '[REDACTED]');
      expect(context).toHaveProperty('query');
      expect(context.query).toHaveProperty('param1', 'value1');
      expect(context.query).toHaveProperty('password', '[REDACTED]');
    });

    it('should create journey context with the correct journey type', () => {
      const healthContext = apiGatewayLogger.createJourneyContext(JourneyType.HEALTH);
      expect(healthContext).toHaveProperty('journey', JourneyType.HEALTH);

      const careContext = apiGatewayLogger.createJourneyContext('care');
      expect(careContext).toHaveProperty('journey', JourneyType.CARE);

      const contextWithAdditionalData = apiGatewayLogger.createJourneyContext(
        JourneyType.PLAN,
        { additionalProp: 'value' },
      );
      expect(contextWithAdditionalData).toHaveProperty('journey', JourneyType.PLAN);
      expect(contextWithAdditionalData).toHaveProperty('additionalProp', 'value');
    });

    it('should create user context with user information', () => {
      const anonymousContext = apiGatewayLogger.createUserContext(null);
      expect(anonymousContext).toHaveProperty('isAuthenticated', false);

      const userContext = apiGatewayLogger.createUserContext({
        id: '123',
        email: 'user@example.com',
        roles: ['user'],
      });
      expect(userContext).toHaveProperty('userId', '123');
      expect(userContext).toHaveProperty('email', 'user@example.com');
      expect(userContext).toHaveProperty('roles');
      expect(userContext.roles).toEqual(['user']);
      expect(userContext).toHaveProperty('isAuthenticated', true);
    });
  });

  describe('Request and response logging', () => {
    it('should log requests with enriched context', () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/health/metrics',
        path: '/api/health/metrics',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
        query: {},
        user: {
          id: '123',
          email: 'user@example.com',
        },
      } as unknown as Request;

      apiGatewayLogger.logRequest(mockRequest);

      expect(loggerService.setContext).toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalledWith(
        'Request: GET /api/health/metrics',
        'ApiGateway:Request',
      );
    });

    it('should log responses with execution time', () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/health/metrics',
        __loggingContext: {},
      } as unknown as Request;

      const mockResponse = {
        statusCode: 200,
      } as unknown as Response;

      apiGatewayLogger.logResponse(mockRequest, mockResponse, 42);

      expect(loggerService.setContext).toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalledWith(
        'Response: 200 GET /api/health/metrics - 42ms',
        'ApiGateway:Response',
      );
    });
  });

  describe('Error logging', () => {
    it('should log errors with appropriate level based on status code', () => {
      const clientError = {
        message: 'Bad Request',
        stack: 'Error stack',
        statusCode: 400,
      };

      const serverError = {
        message: 'Internal Server Error',
        stack: 'Error stack',
        statusCode: 500,
      };

      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/health/metrics',
        path: '/api/health/metrics',
        headers: {},
        query: {},
      } as unknown as Request;

      apiGatewayLogger.logError(clientError, mockRequest);
      expect(loggerService.warn).toHaveBeenCalled();

      apiGatewayLogger.logError(serverError, mockRequest);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });
});

describe('Utility functions', () => {
  describe('ensureCorrelationId', () => {
    it('should use existing correlation ID if present', () => {
      const mockRequest = {
        headers: {
          'x-correlation-id': 'existing-id',
        },
      } as unknown as Request;

      const correlationId = ensureCorrelationId(mockRequest);
      expect(correlationId).toBe('existing-id');
    });

    it('should generate a new correlation ID if none exists', () => {
      const mockRequest = {
        headers: {},
      } as unknown as Request;

      const correlationId = ensureCorrelationId(mockRequest);
      expect(correlationId).toMatch(/^api-gateway-\d+-[a-z0-9]+$/);
      expect(mockRequest.headers['x-correlation-id']).toBe(correlationId);
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate a unique correlation ID', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toMatch(/^api-gateway-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^api-gateway-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('createStructuredLog', () => {
    it('should create a structured log object with message and timestamp', () => {
      const log = createStructuredLog('Test message');

      expect(log).toHaveProperty('message', 'Test message');
      expect(log).toHaveProperty('timestamp');
      expect(new Date(log.timestamp).getTime()).not.toBeNaN();
    });

    it('should include sanitized data when provided', () => {
      const log = createStructuredLog('Test message', {
        userId: '123',
        password: 'secret',
      });

      expect(log).toHaveProperty('data');
      expect(log.data).toHaveProperty('userId', '123');
      expect(log.data).toHaveProperty('password', '[REDACTED]');
    });

    it('should include context when provided', () => {
      const log = createStructuredLog(
        'Test message',
        { userId: '123' },
        { correlationId: 'test-id', journey: 'health' },
      );

      expect(log).toHaveProperty('correlationId', 'test-id');
      expect(log).toHaveProperty('journey', 'health');
    });
  });

  describe('sanitizeLogData', () => {
    it('should redact sensitive fields', () => {
      const data = {
        userId: '123',
        password: 'secret',
        token: 'jwt-token',
        apiKey: 'api-key',
        nested: {
          secret: 'nested-secret',
          safe: 'safe-value',
        },
      };

      const sanitized = sanitizeLogData(data);

      expect(sanitized).toHaveProperty('userId', '123');
      expect(sanitized).toHaveProperty('password', '[REDACTED]');
      expect(sanitized).toHaveProperty('token', '[REDACTED]');
      expect(sanitized).toHaveProperty('apiKey', '[REDACTED]');
      expect(sanitized).toHaveProperty('nested');
      expect(sanitized.nested).toHaveProperty('secret', '[REDACTED]');
      expect(sanitized.nested).toHaveProperty('safe', 'safe-value');
    });
  });

  describe('measureExecutionTime', () => {
    it('should measure the execution time of an operation', async () => {
      jest.useFakeTimers();

      const operation = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result';
      });

      const promise = measureExecutionTime(operation);
      jest.advanceTimersByTime(100);
      const [result, time] = await promise;

      expect(operation).toHaveBeenCalled();
      expect(result).toBe('result');
      expect(time).toBeGreaterThanOrEqual(100);

      jest.useRealTimers();
    });
  });

  describe('getApiGatewayLogger', () => {
    it('should return the singleton instance', () => {
      const logger = getApiGatewayLogger();
      expect(logger).toBeDefined();
    });
  });
});
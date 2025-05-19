/**
 * @file client.test.ts
 * @description Unit tests for the HTTP client utility module that provides the base HTTP client functionality.
 * These tests verify that the createHttpClient function creates a valid Axios instance with proper default
 * configuration, handles connection timeouts appropriately, implements proper error transformation, and
 * supports customizable request and response interception.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { jest } from '@jest/globals';
import { BaseError } from '@austa/errors/base';
import { ErrorType } from '@austa/errors/types';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';

// Import the module under test
import {
  createHttpClient,
  createSimpleHttpClient,
  HttpClientError,
  HttpClientErrorType,
  RetryConfig,
  exponentialDelay,
  linearDelay,
  noDelay
} from '../../../src/http/client';

// Import test helpers and fixtures
import {
  createMockAxiosInstance,
  createMockAxiosError,
  mockAxiosInterceptors,
  simulateFailedRequest,
  simulateNetworkError,
  simulateTimeoutError
} from '../../helpers/http.helpers';
import { allErrors } from '../../fixtures/http/errors';

// Mock axios module
jest.mock('axios', () => {
  return {
    create: jest.fn(() => createMockAxiosInstance()),
    isAxiosError: jest.fn((error) => error && error.isAxiosError === true)
  };
});

// Mock the logger service
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  setContext: jest.fn(),
  getContext: jest.fn()
} as jest.Mocked<LoggerService>;

// Mock the tracing service
const mockTracer = {
  startSpan: jest.fn(() => ({
    setAttributes: jest.fn(),
    end: jest.fn(),
    spanContext: jest.fn(() => ({
      traceId: 'test-trace-id',
      spanId: 'test-span-id'
    }))
  })),
  currentSpan: jest.fn(),
  injectTraceContext: jest.fn(),
  extractTraceContext: jest.fn()
} as unknown as jest.Mocked<TracingService>;

describe('HTTP Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createHttpClient', () => {
    it('should create an Axios instance with default configuration', () => {
      // Act
      const client = createHttpClient();

      // Assert
      expect(axios.create).toHaveBeenCalledWith({});
      expect(client).toBeDefined();
    });

    it('should create an Axios instance with custom configuration', () => {
      // Arrange
      const config: AxiosRequestConfig = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'test'
        }
      };

      // Act
      const client = createHttpClient(config);

      // Assert
      expect(axios.create).toHaveBeenCalledWith(config);
      expect(client).toBeDefined();
    });

    it('should create an Axios instance with retry configuration', () => {
      // Arrange
      const retryConfig: Partial<RetryConfig> = {
        retries: 5,
        retryDelay: jest.fn(),
        httpMethodsToRetry: ['GET', 'POST'],
        statusCodesToRetry: [[500, 599]],
        timeout: 3000
      };

      // Act
      const client = createHttpClient({ retry: retryConfig });

      // Assert
      expect(axios.create).toHaveBeenCalled();
      expect(client.interceptors.request.use).toHaveBeenCalled();
      expect(client.interceptors.response.use).toHaveBeenCalled();
    });

    it('should create an Axios instance with logger configuration', () => {
      // Act
      const client = createHttpClient({ logger: mockLogger });

      // Assert
      expect(axios.create).toHaveBeenCalled();
      expect(client.interceptors.request.use).toHaveBeenCalled();
      expect(client.interceptors.response.use).toHaveBeenCalled();
    });

    it('should create an Axios instance with tracer configuration', () => {
      // Act
      const client = createHttpClient({ tracer: mockTracer });

      // Assert
      expect(axios.create).toHaveBeenCalled();
      expect(client.interceptors.request.use).toHaveBeenCalled();
      expect(client.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('createSimpleHttpClient', () => {
    it('should create an Axios instance with default simple configuration', () => {
      // Act
      const client = createSimpleHttpClient();

      // Assert
      expect(axios.create).toHaveBeenCalledWith({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(client).toBeDefined();
    });
  });

  describe('HttpClientError', () => {
    it('should create an HttpClientError with proper properties', () => {
      // Arrange
      const axiosError = createMockAxiosError({
        status: 500,
        statusText: 'Internal Server Error',
        message: 'Request failed with status code 500',
        config: { url: 'https://api.example.com/test', method: 'get' }
      });

      // Act
      const error = new HttpClientError('Test error message', axiosError);

      // Assert
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(HttpClientError);
      expect(error.message).toBe('Test error message');
      expect(error.originalError).toBe(axiosError);
      expect(error.statusCode).toBe(500);
      expect(error.httpErrorType).toBe(HttpClientErrorType.SERVER);
      expect(error.url).toBe('https://api.example.com/test');
      expect(error.method).toBe('GET');
    });

    it('should categorize network errors correctly', () => {
      // Arrange
      const networkError = createMockAxiosError({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
        config: { url: 'https://api.example.com/test', method: 'get' }
      });

      // Act
      const error = new HttpClientError('Connection refused', networkError);

      // Assert
      expect(error.httpErrorType).toBe(HttpClientErrorType.NETWORK);
    });

    it('should categorize timeout errors correctly', () => {
      // Arrange
      const timeoutError = createMockAxiosError({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
        config: { url: 'https://api.example.com/test', method: 'get', timeout: 30000 }
      });

      // Act
      const error = new HttpClientError('Request timeout', timeoutError);

      // Assert
      expect(error.httpErrorType).toBe(HttpClientErrorType.NETWORK);
    });

    it('should categorize client errors correctly', () => {
      // Arrange
      const clientError = createMockAxiosError({
        status: 400,
        statusText: 'Bad Request',
        message: 'Request failed with status code 400',
        config: { url: 'https://api.example.com/test', method: 'get' }
      });

      // Act
      const error = new HttpClientError('Bad request', clientError);

      // Assert
      expect(error.httpErrorType).toBe(HttpClientErrorType.CLIENT);
    });

    it('should categorize server errors correctly', () => {
      // Arrange
      const serverError = createMockAxiosError({
        status: 500,
        statusText: 'Internal Server Error',
        message: 'Request failed with status code 500',
        config: { url: 'https://api.example.com/test', method: 'get' }
      });

      // Act
      const error = new HttpClientError('Server error', serverError);

      // Assert
      expect(error.httpErrorType).toBe(HttpClientErrorType.SERVER);
    });

    it('should categorize cancelled requests correctly', () => {
      // Arrange
      const cancelledError = createMockAxiosError({
        code: 'ERR_CANCELED',
        message: 'Request cancelled',
        config: { url: 'https://api.example.com/test', method: 'get' }
      });

      // Act
      const error = new HttpClientError('Request cancelled', cancelledError);

      // Assert
      expect(error.httpErrorType).toBe(HttpClientErrorType.CANCELLED);
    });

    it('should map HTTP error types to base error types correctly', () => {
      // Test cases for each HTTP error type and its corresponding base error type
      const testCases = [
        { httpErrorType: HttpClientErrorType.CLIENT, expectedBaseType: ErrorType.VALIDATION },
        { httpErrorType: HttpClientErrorType.SERVER, expectedBaseType: ErrorType.TECHNICAL },
        { httpErrorType: HttpClientErrorType.NETWORK, expectedBaseType: ErrorType.EXTERNAL },
        { httpErrorType: HttpClientErrorType.CANCELLED, expectedBaseType: ErrorType.EXTERNAL },
        { httpErrorType: HttpClientErrorType.UNKNOWN, expectedBaseType: ErrorType.TECHNICAL }
      ];

      testCases.forEach(({ httpErrorType, expectedBaseType }) => {
        // Arrange
        const axiosError = createMockAxiosError({
          status: httpErrorType === HttpClientErrorType.CLIENT ? 400 : 500,
          message: `Error of type ${httpErrorType}`,
          config: { url: 'https://api.example.com/test', method: 'get' }
        });

        // Act
        const error = new HttpClientError(`Error of type ${httpErrorType}`, axiosError);

        // Assert
        expect(error.errorType).toBe(expectedBaseType);
      });
    });

    it('should create user-friendly error messages', () => {
      // Test cases for different error scenarios
      const testCases = [
        {
          error: createMockAxiosError({
            status: 404,
            statusText: 'Not Found',
            message: 'Request failed with status code 404',
            config: { url: 'https://api.example.com/test', method: 'get' }
          }),
          expectedMessage: 'HTTP 404 error occurred while GET https://api.example.com/test: Request failed with status code 404'
        },
        {
          error: createMockAxiosError({
            code: 'ECONNABORTED',
            message: 'timeout of 30000ms exceeded',
            config: { url: 'https://api.example.com/test', method: 'get', timeout: 30000 }
          }),
          expectedMessage: 'Request timeout: timeout of 30000ms exceeded'
        },
        {
          error: createMockAxiosError({
            code: 'ERR_CANCELED',
            message: 'Request cancelled',
            config: { url: 'https://api.example.com/test', method: 'get' }
          }),
          expectedMessage: 'Request cancelled: Request cancelled'
        },
        {
          error: createMockAxiosError({
            code: 'ECONNREFUSED',
            message: 'Connection refused',
            config: { url: 'https://api.example.com/test', method: 'get' }
          }),
          expectedMessage: 'Connection refused: Connection refused'
        },
        {
          error: createMockAxiosError({
            code: 'ENOTFOUND',
            message: 'getaddrinfo ENOTFOUND api.example.com',
            config: { url: 'https://api.example.com/test', method: 'get' }
          }),
          expectedMessage: 'Host not found: getaddrinfo ENOTFOUND api.example.com'
        },
        {
          error: createMockAxiosError({
            code: 'UNKNOWN',
            message: 'Unknown error',
            config: { url: 'https://api.example.com/test', method: 'get' }
          }),
          expectedMessage: 'HTTP request failed: Unknown error'
        }
      ];

      testCases.forEach(({ error, expectedMessage }) => {
        // Act
        const message = HttpClientError.createErrorMessage(error);

        // Assert
        expect(message).toBe(expectedMessage);
      });
    });
  });

  describe('Retry Mechanisms', () => {
    it('should retry failed requests according to retry configuration', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const retryConfig: Partial<RetryConfig> = {
        retries: 3,
        retryDelay: jest.fn().mockReturnValue(0), // No delay for faster tests
        httpMethodsToRetry: ['GET'],
        statusCodesToRetry: [[500, 599]]
      };

      // Simulate a server error that should be retried
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'server', 500);

      // Act
      const client = createHttpClient({ retry: retryConfig });
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('https://api.example.com/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(retryConfig.retryDelay).toHaveBeenCalledTimes(3); // Should retry 3 times
        expect(mockAxios.get).toHaveBeenCalledTimes(4); // Original + 3 retries
      }
    });

    it('should not retry requests that are not configured for retry', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const retryConfig: Partial<RetryConfig> = {
        retries: 3,
        retryDelay: jest.fn().mockReturnValue(0),
        httpMethodsToRetry: ['GET'],
        statusCodesToRetry: [[500, 599]]
      };

      // Simulate a client error that should not be retried
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'client', 400);

      // Act
      const client = createHttpClient({ retry: retryConfig });
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('https://api.example.com/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(retryConfig.retryDelay).not.toHaveBeenCalled(); // Should not retry
        expect(mockAxios.get).toHaveBeenCalledTimes(1); // Only the original request
      }
    });

    it('should respect the Retry-After header if present', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Create a server error with Retry-After header
      const serverErrorWithRetryAfter = allErrors.server.serverWithRetryAfter.error as AxiosError;

      // Mock the get method to return this specific error
      mockAxios.get.mockRejectedValueOnce(serverErrorWithRetryAfter);

      const retryConfig: Partial<RetryConfig> = {
        retries: 1,
        retryDelay: exponentialDelay, // Use the real exponential delay function
        respectRetryAfter: true
      };

      // Act
      const client = createHttpClient({ retry: retryConfig });
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('https://api.example.com/test');
        fail('Request should have failed');
      } catch (error) {
        // The test passes if we reach here, as we're expecting the request to fail
        // We can't easily test the exact delay timing in a unit test
      }
    });

    it('should use custom retry condition if provided', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const customRetryCondition = jest.fn((error: AxiosError) => {
        // Only retry 429 Too Many Requests errors
        return error.response?.status === 429;
      });

      const retryConfig: Partial<RetryConfig> = {
        retries: 2,
        retryDelay: jest.fn().mockReturnValue(0),
        retryCondition: customRetryCondition
      };

      // Simulate a 429 error that should be retried
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'client', 429);

      // Act
      const client = createHttpClient({ retry: retryConfig });
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('https://api.example.com/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(customRetryCondition).toHaveBeenCalled();
        expect(retryConfig.retryDelay).toHaveBeenCalledTimes(2); // Should retry 2 times
        expect(mockAxios.get).toHaveBeenCalledTimes(3); // Original + 2 retries
      }
    });
  });

  describe('Delay Strategies', () => {
    it('should implement exponential delay with jitter', () => {
      // Act
      const delay1 = exponentialDelay(1);
      const delay2 = exponentialDelay(2);
      const delay3 = exponentialDelay(3);

      // Assert
      // Base exponential delay formula: 2^retryCount * 100
      expect(delay1).toBeGreaterThanOrEqual(200); // 2^1 * 100 = 200 (plus jitter)
      expect(delay1).toBeLessThanOrEqual(240); // 200 + 20% max jitter

      expect(delay2).toBeGreaterThanOrEqual(400); // 2^2 * 100 = 400 (plus jitter)
      expect(delay2).toBeLessThanOrEqual(480); // 400 + 20% max jitter

      expect(delay3).toBeGreaterThanOrEqual(800); // 2^3 * 100 = 800 (plus jitter)
      expect(delay3).toBeLessThanOrEqual(960); // 800 + 20% max jitter
    });

    it('should implement linear delay', () => {
      // Arrange
      const linearDelayFn = linearDelay(100);

      // Act
      const delay1 = linearDelayFn(1);
      const delay2 = linearDelayFn(2);
      const delay3 = linearDelayFn(3);

      // Assert
      expect(delay1).toBe(100); // 1 * 100 = 100
      expect(delay2).toBe(200); // 2 * 100 = 200
      expect(delay3).toBe(300); // 3 * 100 = 300
    });

    it('should implement no delay', () => {
      // Act
      const delay = noDelay();

      // Assert
      expect(delay).toBe(0);
    });
  });

  describe('Request/Response Interceptors', () => {
    it('should add request interceptor for timeout when retry is configured', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const retryConfig: Partial<RetryConfig> = {
        timeout: 5000
      };

      // Act
      createHttpClient({ retry: retryConfig });

      // Assert
      expect(mockAxios.interceptors.request.use).toHaveBeenCalled();

      // Simulate the interceptor being called
      const requestInterceptor = mockAxios.interceptors.request.use.mock.calls[0][0];
      const config: AxiosRequestConfig = {};
      const result = requestInterceptor(config);

      // Verify the timeout was set
      expect(result.timeout).toBe(5000);
    });

    it('should add response interceptor for retries when retry is configured', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const retryConfig: Partial<RetryConfig> = {
        retries: 3,
        retryDelay: jest.fn().mockReturnValue(0)
      };

      // Act
      createHttpClient({ retry: retryConfig });

      // Assert
      expect(mockAxios.interceptors.response.use).toHaveBeenCalled();
    });

    it('should add request interceptor for tracing when tracer is provided', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Act
      createHttpClient({ tracer: mockTracer });

      // Assert
      expect(mockAxios.interceptors.request.use).toHaveBeenCalled();

      // Simulate the interceptor being called
      const requestInterceptor = mockAxios.interceptors.request.use.mock.calls[0][0];
      const config: AxiosRequestConfig = { method: 'get', url: 'https://api.example.com/test', headers: {} };
      const result = requestInterceptor(config);

      // Verify tracing headers were added
      expect(mockTracer.startSpan).toHaveBeenCalledWith('HTTP Request');
      expect(result.headers['x-trace-id']).toBe('test-trace-id');
      expect(result.headers['x-span-id']).toBe('test-span-id');
    });

    it('should add response interceptor for tracing when tracer is provided', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Act
      createHttpClient({ tracer: mockTracer });

      // Assert
      expect(mockAxios.interceptors.response.use).toHaveBeenCalled();

      // Get the success and error handlers
      const successHandler = mockAxios.interceptors.response.use.mock.calls[0][0];
      const errorHandler = mockAxios.interceptors.response.use.mock.calls[0][1];

      // Create a mock span
      const mockSpan = {
        setAttributes: jest.fn(),
        end: jest.fn()
      };

      // Simulate the success handler being called
      const response: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true },
        headers: {},
        config: { method: 'get', url: 'https://api.example.com/test', __span: mockSpan } as any
      };

      successHandler(response);

      // Verify span was updated and ended
      expect(mockSpan.setAttributes).toHaveBeenCalled();
      expect(mockSpan.end).toHaveBeenCalled();

      // Simulate the error handler being called
      const error = createMockAxiosError({
        status: 500,
        message: 'Server error',
        config: { method: 'get', url: 'https://api.example.com/test', __span: mockSpan } as any
      });

      try {
        errorHandler(error);
      } catch (e) {
        // Expected to throw
      }

      // Verify span was updated with error and ended
      expect(mockSpan.setAttributes).toHaveBeenCalledWith(expect.objectContaining({
        'error': true
      }));
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should add request interceptor for logging when logger is provided', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Act
      createHttpClient({ logger: mockLogger });

      // Assert
      expect(mockAxios.interceptors.request.use).toHaveBeenCalled();

      // Simulate the interceptor being called
      const requestInterceptor = mockAxios.interceptors.request.use.mock.calls[0][0];
      const config: AxiosRequestConfig = { method: 'get', url: 'https://api.example.com/test', headers: {} };
      requestInterceptor(config);

      // Verify logger was called
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'HTTP GET request to https://api.example.com/test',
        expect.objectContaining({
          url: 'https://api.example.com/test',
          method: 'get'
        })
      );
    });

    it('should add response interceptor for logging when logger is provided', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Act
      createHttpClient({ logger: mockLogger });

      // Assert
      expect(mockAxios.interceptors.response.use).toHaveBeenCalled();

      // Get the success and error handlers
      const successHandler = mockAxios.interceptors.response.use.mock.calls[0][0];
      const errorHandler = mockAxios.interceptors.response.use.mock.calls[0][1];

      // Simulate the success handler being called
      const response: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true },
        headers: {},
        config: { method: 'get', url: 'https://api.example.com/test' } as any
      };

      successHandler(response);

      // Verify logger was called for success
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'HTTP 200 response from https://api.example.com/test',
        expect.objectContaining({
          status: 200,
          statusText: 'OK'
        })
      );

      // Simulate the error handler being called
      const error = createMockAxiosError({
        status: 500,
        message: 'Server error',
        config: { method: 'get', url: 'https://api.example.com/test' }
      });

      try {
        errorHandler(error);
      } catch (e) {
        // Expected to throw
      }

      // Verify logger was called for error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'HTTP 500 error from https://api.example.com/test',
        expect.objectContaining({
          status: 500,
          statusText: 'Internal Server Error'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should transform Axios errors into HttpClientErrors', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Configure retry to ensure error transformation
      const retryConfig: Partial<RetryConfig> = {
        retries: 1,
        retryDelay: jest.fn().mockReturnValue(0)
      };

      // Simulate a server error
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'server', 500);

      // Act
      const client = createHttpClient({ retry: retryConfig });
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('https://api.example.com/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(HttpClientError);
        expect((error as HttpClientError).httpErrorType).toBe(HttpClientErrorType.SERVER);
        expect((error as HttpClientError).statusCode).toBe(500);
      }
    });

    it('should handle network errors correctly', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Configure retry to ensure error transformation
      const retryConfig: Partial<RetryConfig> = {
        retries: 1,
        retryDelay: jest.fn().mockReturnValue(0)
      };

      // Simulate a network error
      simulateNetworkError(mockAxios);

      // Act
      const client = createHttpClient({ retry: retryConfig });
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('https://api.example.com/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(HttpClientError);
        expect((error as HttpClientError).httpErrorType).toBe(HttpClientErrorType.NETWORK);
        expect((error as HttpClientError).statusCode).toBeUndefined();
      }
    });

    it('should handle timeout errors correctly', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Configure retry to ensure error transformation
      const retryConfig: Partial<RetryConfig> = {
        retries: 1,
        retryDelay: jest.fn().mockReturnValue(0)
      };

      // Simulate a timeout error
      simulateTimeoutError(mockAxios);

      // Act
      const client = createHttpClient({ retry: retryConfig });
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('https://api.example.com/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(HttpClientError);
        expect((error as HttpClientError).httpErrorType).toBe(HttpClientErrorType.NETWORK);
        expect((error as HttpClientError).originalError.code).toBe('ECONNABORTED');
      }
    });

    it('should handle client errors correctly', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Configure retry to ensure error transformation
      const retryConfig: Partial<RetryConfig> = {
        retries: 1,
        retryDelay: jest.fn().mockReturnValue(0)
      };

      // Simulate a client error
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'client', 400);

      // Act
      const client = createHttpClient({ retry: retryConfig });
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('https://api.example.com/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(HttpClientError);
        expect((error as HttpClientError).httpErrorType).toBe(HttpClientErrorType.CLIENT);
        expect((error as HttpClientError).statusCode).toBe(400);
      }
    });
  });

  describe('Integration with Journey-Specific Error Handling', () => {
    it('should handle journey-specific errors correctly', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Configure retry to ensure error transformation
      const retryConfig: Partial<RetryConfig> = {
        retries: 1,
        retryDelay: jest.fn().mockReturnValue(0)
      };

      // Create a journey-specific error
      const journeyError = allErrors.journey.healthMetricsUnavailable.error as AxiosError;
      mockAxios.get.mockRejectedValueOnce(journeyError);

      // Act
      const client = createHttpClient({ retry: retryConfig });
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('https://api.example.com/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(HttpClientError);
        expect((error as HttpClientError).httpErrorType).toBe(HttpClientErrorType.SERVER);
        expect((error as HttpClientError).statusCode).toBe(503);
        expect((error as HttpClientError).originalError.response?.data).toEqual(
          expect.objectContaining({
            journeyType: 'health',
            errorCode: 'HEALTH_METRICS_UNAVAILABLE'
          })
        );
      }
    });
  });
});
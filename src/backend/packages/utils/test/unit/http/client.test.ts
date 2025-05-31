import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createHttpClient, HttpClientConfig, HttpClientError } from '../../../src/http/client';

// Mock axios module
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      defaults: {},
    })),
  };
});

describe('HTTP Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createHttpClient', () => {
    it('should create an axios instance with default configuration', () => {
      // Act
      const client = createHttpClient();

      // Assert
      expect(axios.create).toHaveBeenCalledWith({
        timeout: 30000, // Default timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(client).toBeDefined();
      expect(client.interceptors.request.use).toHaveBeenCalled();
      expect(client.interceptors.response.use).toHaveBeenCalled();
    });

    it('should create an axios instance with custom configuration', () => {
      // Arrange
      const config: HttpClientConfig = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'X-Custom-Header': 'custom-value',
          'Content-Type': 'application/xml',
        },
      };

      // Act
      const client = createHttpClient(config);

      // Assert
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'X-Custom-Header': 'custom-value',
          'Content-Type': 'application/xml',
        },
      });
    });

    it('should merge default headers with custom headers', () => {
      // Arrange
      const config: HttpClientConfig = {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      };

      // Act
      const client = createHttpClient(config);

      // Assert
      expect(axios.create).toHaveBeenCalledWith({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
      });
    });
  });

  describe('Request Interceptors', () => {
    let client: AxiosInstance;
    let requestInterceptor: (config: AxiosRequestConfig) => AxiosRequestConfig;

    beforeEach(() => {
      // Reset mocks
      (axios.create as jest.Mock).mockImplementation(() => ({
        interceptors: {
          request: { use: jest.fn((interceptor) => { requestInterceptor = interceptor; }) },
          response: { use: jest.fn() },
        },
        defaults: {},
      }));

      // Create client to capture the interceptor
      client = createHttpClient();
    });

    it('should add request logging', () => {
      // Arrange
      const mockConfig: AxiosRequestConfig = {
        method: 'GET',
        url: '/test',
        headers: { 'Content-Type': 'application/json' },
      };
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      // Act
      const result = requestInterceptor(mockConfig);

      // Assert
      expect(result).toEqual(mockConfig);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP Request:'),
        expect.objectContaining({
          method: 'GET',
          url: '/test',
        })
      );
      consoleSpy.mockRestore();
    });

    it('should add correlation ID header if provided', () => {
      // Arrange
      const mockConfig: AxiosRequestConfig = {
        method: 'GET',
        url: '/test',
        headers: { 'Content-Type': 'application/json' },
        correlationId: 'test-correlation-id',
      };
      jest.spyOn(console, 'debug').mockImplementation();

      // Act
      const result = requestInterceptor(mockConfig);

      // Assert
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Correlation-ID': 'test-correlation-id',
      });
      expect(result.correlationId).toBeUndefined(); // Should be removed from config
    });
  });

  describe('Response Interceptors', () => {
    let client: AxiosInstance;
    let responseSuccessInterceptor: (response: AxiosResponse) => AxiosResponse;
    let responseErrorInterceptor: (error: AxiosError) => Promise<never>;

    beforeEach(() => {
      // Reset mocks
      (axios.create as jest.Mock).mockImplementation(() => ({
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((successInterceptor, errorInterceptor) => {
              responseSuccessInterceptor = successInterceptor;
              responseErrorInterceptor = errorInterceptor;
            }),
          },
        },
        defaults: {},
      }));

      // Create client to capture the interceptors
      client = createHttpClient();
    });

    it('should add response logging for successful responses', () => {
      // Arrange
      const mockResponse: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { success: true },
        config: {
          url: '/test',
          method: 'GET',
        } as AxiosRequestConfig,
      };
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      // Act
      const result = responseSuccessInterceptor(mockResponse);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP Response:'),
        expect.objectContaining({
          status: 200,
          url: '/test',
          method: 'GET',
        })
      );
      consoleSpy.mockRestore();
    });

    it('should transform axios errors into HttpClientError', async () => {
      // Arrange
      const mockAxiosError = {
        isAxiosError: true,
        config: {
          url: '/test',
          method: 'GET',
        } as AxiosRequestConfig,
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found' },
        },
        message: 'Request failed with status code 404',
      } as AxiosError;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(responseErrorInterceptor(mockAxiosError)).rejects.toThrow(HttpClientError);
      await expect(responseErrorInterceptor(mockAxiosError)).rejects.toMatchObject({
        message: 'HTTP request failed: Request failed with status code 404',
        status: 404,
        data: { message: 'Resource not found' },
        originalError: mockAxiosError,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP Error:'),
        expect.objectContaining({
          status: 404,
          url: '/test',
          method: 'GET',
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle network errors without response', async () => {
      // Arrange
      const mockAxiosError = {
        isAxiosError: true,
        config: {
          url: '/test',
          method: 'GET',
        } as AxiosRequestConfig,
        response: undefined,
        message: 'Network Error',
      } as AxiosError;
      jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(responseErrorInterceptor(mockAxiosError)).rejects.toThrow(HttpClientError);
      await expect(responseErrorInterceptor(mockAxiosError)).rejects.toMatchObject({
        message: 'HTTP request failed: Network Error',
        status: 0, // Network errors have status 0
        data: null,
        originalError: mockAxiosError,
      });
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const mockAxiosError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        config: {
          url: '/test',
          method: 'GET',
          timeout: 5000,
        } as AxiosRequestConfig,
        response: undefined,
        message: 'timeout of 5000ms exceeded',
      } as AxiosError;
      jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(responseErrorInterceptor(mockAxiosError)).rejects.toThrow(HttpClientError);
      await expect(responseErrorInterceptor(mockAxiosError)).rejects.toMatchObject({
        message: 'HTTP request failed: Request timeout after 5000ms',
        status: 0,
        data: null,
        originalError: mockAxiosError,
        isTimeout: true,
      });
    });

    it('should handle non-axios errors', async () => {
      // Arrange
      const mockError = new Error('Generic error');
      jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(responseErrorInterceptor(mockError as unknown as AxiosError)).rejects.toThrow(Error);
      await expect(responseErrorInterceptor(mockError as unknown as AxiosError)).rejects.toEqual(mockError);
    });
  });

  describe('Integration with real Axios', () => {
    let mockAxios: MockAdapter;
    let client: AxiosInstance;

    beforeEach(() => {
      // Restore axios to use the real implementation
      jest.restoreAllMocks();
      
      // Create a real client
      client = createHttpClient({
        baseURL: 'https://api.example.com',
      });
      
      // Create mock adapter
      mockAxios = new MockAdapter(client);
    });

    afterEach(() => {
      mockAxios.restore();
    });

    it('should successfully make GET requests', async () => {
      // Arrange
      const responseData = { id: 1, name: 'Test' };
      mockAxios.onGet('/users/1').reply(200, responseData);

      // Act
      const response = await client.get('/users/1');

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toEqual(responseData);
    });

    it('should handle error responses correctly', async () => {
      // Arrange
      const errorData = { message: 'User not found' };
      mockAxios.onGet('/users/999').reply(404, errorData);

      // Act & Assert
      try {
        await client.get('/users/999');
        fail('Expected request to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpClientError);
        const httpError = error as HttpClientError;
        expect(httpError.status).toBe(404);
        expect(httpError.data).toEqual(errorData);
        expect(httpError.message).toContain('HTTP request failed');
      }
    });

    it('should handle timeout errors correctly', async () => {
      // Arrange
      mockAxios.onGet('/slow-endpoint').timeout();

      // Act & Assert
      try {
        await client.get('/slow-endpoint', { timeout: 100 });
        fail('Expected request to timeout');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpClientError);
        const httpError = error as HttpClientError;
        expect(httpError.isTimeout).toBe(true);
        expect(httpError.message).toContain('Request timeout');
      }
    });

    it('should handle network errors correctly', async () => {
      // Arrange
      mockAxios.onGet('/network-error').networkError();

      // Act & Assert
      try {
        await client.get('/network-error');
        fail('Expected network error');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpClientError);
        const httpError = error as HttpClientError;
        expect(httpError.status).toBe(0);
        expect(httpError.message).toContain('HTTP request failed');
      }
    });

    it('should support POST requests with data', async () => {
      // Arrange
      const requestData = { name: 'New User', email: 'user@example.com' };
      const responseData = { id: 2, ...requestData };
      
      mockAxios.onPost('/users', requestData).reply(201, responseData);

      // Act
      const response = await client.post('/users', requestData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.data).toEqual(responseData);
    });
  });
});
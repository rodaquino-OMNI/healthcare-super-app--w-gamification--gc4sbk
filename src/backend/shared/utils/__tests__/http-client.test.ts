import { HttpClient, createHttpClient, createJourneyHttpClient } from '../http-client';
import { createSecureAxios } from '../secure-axios';
import { ExternalApiError, ExternalDependencyUnavailableError, ExternalRateLimitError } from '@austa/errors/categories/external.errors';
import { TimeoutError } from '@austa/errors/categories/technical.errors';
import axios, { AxiosError } from 'axios';
import { Logger } from '@nestjs/common';

// Mock dependencies
jest.mock('../secure-axios');
jest.mock('axios');

const mockCreateSecureAxios = createSecureAxios as jest.MockedFunction<typeof createSecureAxios>;
const mockAxiosInstance = {
  defaults: {
    headers: {
      common: {}
    },
    timeout: 0,
    baseURL: ''
  },
  interceptors: {
    request: {
      use: jest.fn()
    },
    response: {
      use: jest.fn()
    }
  },
  request: jest.fn()
};

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let mockLogger: Logger;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSecureAxios.mockReturnValue(mockAxiosInstance as any);
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() } as any;
    httpClient = new HttpClient({
      baseURL: 'https://api.example.com',
      headers: { 'X-API-Key': 'test-key' },
      timeout: 5000,
      logger: mockLogger,
      journey: 'health'
    });
  });
  
  describe('constructor', () => {
    it('should create a secure axios instance with the provided configuration', () => {
      expect(mockCreateSecureAxios).toHaveBeenCalled();
      expect(mockAxiosInstance.defaults.baseURL).toBe('https://api.example.com');
      expect(mockAxiosInstance.defaults.headers.common['X-API-Key']).toBe('test-key');
      expect(mockAxiosInstance.defaults.timeout).toBe(5000);
    });
    
    it('should set up response interceptors', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });
  
  describe('HTTP methods', () => {
    beforeEach(() => {
      // Mock successful response
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true },
        status: 200
      });
    });
    
    it('should perform GET requests', async () => {
      const result = await httpClient.get('/users');
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users'
      });
      expect(result).toEqual({ success: true });
    });
    
    it('should perform POST requests', async () => {
      const data = { name: 'Test User' };
      const result = await httpClient.post('/users', data);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/users',
        data
      });
      expect(result).toEqual({ success: true });
    });
    
    it('should perform PUT requests', async () => {
      const data = { name: 'Updated User' };
      const result = await httpClient.put('/users/1', data);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/users/1',
        data
      });
      expect(result).toEqual({ success: true });
    });
    
    it('should perform PATCH requests', async () => {
      const data = { name: 'Patched User' };
      const result = await httpClient.patch('/users/1', data);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/users/1',
        data
      });
      expect(result).toEqual({ success: true });
    });
    
    it('should perform DELETE requests', async () => {
      const result = await httpClient.delete('/users/1');
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/users/1'
      });
      expect(result).toEqual({ success: true });
    });
  });
  
  describe('error handling', () => {
    it('should transform timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError['code'] = 'ECONNABORTED';
      mockAxiosInstance.request.mockRejectedValueOnce(timeoutError);
      
      await expect(httpClient.get('/users')).rejects.toThrow(TimeoutError);
      await expect(httpClient.get('/users')).rejects.toMatchObject({
        message: expect.stringContaining('timed out'),
        metadata: expect.objectContaining({
          journey: 'health'
        })
      });
    });
    
    it('should transform rate limit errors', async () => {
      const rateLimitError = new AxiosError(
        'Rate limit exceeded',
        'ECONNABORTED',
        { headers: {} } as any,
        {} as any,
        {
          status: 429,
          headers: { 'retry-after': '60' },
          data: { message: 'Too many requests' }
        } as any
      );
      rateLimitError.response = {
        status: 429,
        headers: { 'retry-after': '60' },
        data: { message: 'Too many requests' }
      } as any;
      
      mockAxiosInstance.request.mockRejectedValueOnce(rateLimitError);
      
      await expect(httpClient.get('/users')).rejects.toThrow(ExternalRateLimitError);
      await expect(httpClient.get('/users')).rejects.toMatchObject({
        metadata: expect.objectContaining({
          retryAfter: 60,
          journey: 'health'
        })
      });
    });
    
    it('should transform API errors', async () => {
      const apiError = new AxiosError(
        'Request failed with status code 500',
        'ECONNABORTED',
        { headers: {} } as any,
        {} as any,
        {
          status: 500,
          data: { message: 'Internal server error' }
        } as any
      );
      apiError.response = {
        status: 500,
        data: { message: 'Internal server error' }
      } as any;
      
      mockAxiosInstance.request.mockRejectedValueOnce(apiError);
      
      await expect(httpClient.get('/users')).rejects.toThrow(ExternalApiError);
      await expect(httpClient.get('/users')).rejects.toMatchObject({
        metadata: expect.objectContaining({
          statusCode: 500,
          journey: 'health'
        })
      });
    });
    
    it('should transform network errors', async () => {
      const networkError = new AxiosError(
        'Network Error',
        'ECONNABORTED',
        { headers: {} } as any,
        {} as any
      );
      networkError.request = {};
      
      mockAxiosInstance.request.mockRejectedValueOnce(networkError);
      
      await expect(httpClient.get('/users')).rejects.toThrow(ExternalDependencyUnavailableError);
      await expect(httpClient.get('/users')).rejects.toMatchObject({
        metadata: expect.objectContaining({
          journey: 'health'
        })
      });
    });
  });
  
  describe('retry mechanism', () => {
    it('should retry failed requests with exponential backoff', async () => {
      // First two calls fail, third succeeds
      const networkError = new AxiosError('Network Error', 'ECONNABORTED');
      networkError.request = {};
      
      mockAxiosInstance.request
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: { success: true }, status: 200 });
      
      const result = await httpClient.get('/users');
      
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });
    
    it('should not retry 4xx client errors except 429', async () => {
      const clientError = new AxiosError('Bad Request', 'ECONNABORTED');
      clientError.response = {
        status: 400,
        data: { message: 'Bad request' }
      } as any;
      
      mockAxiosInstance.request.mockRejectedValueOnce(clientError);
      
      await expect(httpClient.get('/users')).rejects.toThrow(ExternalApiError);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1); // No retries
    });
  });
  
  describe('circuit breaker', () => {
    it('should open the circuit after multiple failures', async () => {
      const networkError = new AxiosError('Network Error', 'ECONNABORTED');
      networkError.request = {};
      
      // Mock 6 consecutive failures to trigger circuit breaker
      mockAxiosInstance.request.mockRejectedValue(networkError);
      
      // First call should attempt and fail
      await expect(httpClient.get('/users')).rejects.toThrow(ExternalDependencyUnavailableError);
      
      // After threshold is reached, circuit should open
      for (let i = 0; i < 5; i++) {
        await expect(httpClient.get('/users')).rejects.toThrow(ExternalDependencyUnavailableError);
      }
      
      // Next call should fail fast with circuit breaker error
      await expect(httpClient.get('/users')).rejects.toThrow('Circuit breaker is open');
      
      // The request should not have been made after circuit opened
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(5);
    });
  });
  
  describe('factory functions', () => {
    it('should create an HTTP client with default options', () => {
      const client = createHttpClient();
      expect(client).toBeInstanceOf(HttpClient);
    });
    
    it('should create a journey-specific HTTP client', () => {
      const client = createJourneyHttpClient('care', { timeout: 3000 });
      expect(client).toBeInstanceOf(HttpClient);
      // @ts-ignore - accessing private property for testing
      expect(client.options.journey).toBe('care');
      // @ts-ignore - accessing private property for testing
      expect(client.options.timeout).toBe(3000);
    });
  });
});
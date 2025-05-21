import axios from 'axios';
import axiosRetry from 'axios-retry';
import CircuitBreaker from 'opossum';
import { createHttpClient, createInternalServiceClient, createExternalApiClient } from '../http-client';

// Mock dependencies
jest.mock('axios');
jest.mock('axios-retry');
jest.mock('opossum');
jest.mock('../../packages/utils/src/http/security', () => ({
  createSecureAxios: jest.fn().mockImplementation(() => axios.create()),
}));

describe('HTTP Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (axios.create as jest.Mock).mockReturnValue({
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
    });
    
    // Mock CircuitBreaker constructor and methods
    (CircuitBreaker as unknown as jest.Mock).mockImplementation(() => ({
      on: jest.fn(),
      fire: jest.fn(),
    }));
  });

  describe('createHttpClient', () => {
    it('should create an HTTP client with default configuration', () => {
      const client = createHttpClient();
      
      expect(client).toBeDefined();
      expect(axiosRetry).toHaveBeenCalled();
    });

    it('should apply custom configuration', () => {
      const config = {
        baseURL: 'https://api.example.com',
        headers: {
          'X-Custom-Header': 'value',
        },
        timeout: 5000,
      };

      const client = createHttpClient(config);
      
      expect(client.defaults.baseURL).toBe(config.baseURL);
      expect(client.defaults.headers.common['X-Custom-Header']).toBe('value');
      expect(client.defaults.timeout).toBe(5000);
    });

    it('should configure retry mechanism with exponential backoff', () => {
      createHttpClient({
        retry: {
          retries: 5,
          useExponentialBackoff: true,
          initialRetryDelay: 2000,
        },
      });

      expect(axiosRetry).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          retries: 5,
          retryDelay: expect.any(Function),
        })
      );
    });

    it('should apply circuit breaker if configured', () => {
      createHttpClient({
        circuitBreaker: {
          failureThreshold: 3,
          resetTimeout: 5000,
        },
      });

      expect(CircuitBreaker).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          failureThreshold: 3,
          resetTimeout: 5000,
        })
      );
    });
  });

  describe('createInternalServiceClient', () => {
    it('should create a client configured for internal service communication', () => {
      const client = createInternalServiceClient(
        'auth-service',
        'http://auth-service:3000',
        { journey: 'health' }
      );

      expect(client).toBeDefined();
      expect(axiosRetry).toHaveBeenCalled();
      expect(CircuitBreaker).toHaveBeenCalled();
    });
  });

  describe('createExternalApiClient', () => {
    it('should create a client configured for external API communication', () => {
      const client = createExternalApiClient(
        'https://api.external-service.com',
        { journey: 'care' }
      );

      expect(client).toBeDefined();
      expect(axiosRetry).toHaveBeenCalled();
      expect(CircuitBreaker).toHaveBeenCalled();
    });
  });
});
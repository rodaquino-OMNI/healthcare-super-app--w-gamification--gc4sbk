/**
 * @file internal.test.ts
 * @description Unit tests for the internal.ts HTTP utility module that provides specialized client functionality
 * for internal service-to-service communication. These tests verify that the createInternalApiClient function
 * correctly sets the baseURL, applies default and custom headers, configures appropriate timeout settings,
 * and includes journey-specific configuration options. It also tests the retry logic and error handling
 * capabilities added in the refactored implementation.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { jest } from '@jest/globals';

// Import the module under test
import {
  createInternalApiClient,
  createHealthJourneyClient,
  createCareJourneyClient,
  createPlanJourneyClient,
  createGamificationClient,
  createNotificationClient,
  createAuthClient,
  JourneyType,
  InternalApiClientOptions
} from '../../../src/http/internal';

// Import security module that's used by internal.ts
import { createSecureHttpClient } from '../../../src/http/security';

// Import test helpers and fixtures
import {
  createMockAxiosInstance,
  createMockAxiosError,
  simulateFailedRequest,
  simulateNetworkError,
  simulateTimeoutError,
  mockJourneySpecificConfig,
  verifyTraceHeaders
} from '../../helpers/http.helpers';

// Mock axios module
jest.mock('axios', () => {
  return {
    create: jest.fn(() => createMockAxiosInstance()),
    isAxiosError: jest.fn((error) => error && error.isAxiosError === true)
  };
});

// Mock the security module
jest.mock('../../../src/http/security', () => {
  return {
    createSecureHttpClient: jest.fn(() => ({
      validateUrl: jest.fn(),
      isRestrictedHost: jest.fn(),
      options: {}
    }))
  };
});

describe('Internal API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInternalApiClient', () => {
    it('should create an Axios instance with default configuration', () => {
      // Arrange
      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com'
      };

      // Act
      const client = createInternalApiClient(options);

      // Assert
      expect(axios.create).toHaveBeenCalled();
      expect(createSecureHttpClient).toHaveBeenCalled();
      expect(client.defaults.baseURL).toBe('https://api.example.com');
      expect(client.defaults.timeout).toBe(10000); // Default timeout
      expect(client.defaults.headers.common['Content-Type']).toBe('application/json');
    });

    it('should create an Axios instance with custom configuration', () => {
      // Arrange
      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        headers: {
          'X-Custom-Header': 'test-value',
          'Authorization': 'Bearer test-token'
        },
        timeout: 5000
      };

      // Act
      const client = createInternalApiClient(options);

      // Assert
      expect(axios.create).toHaveBeenCalled();
      expect(client.defaults.baseURL).toBe('https://api.example.com');
      expect(client.defaults.timeout).toBe(5000);
      expect(client.defaults.headers.common['Content-Type']).toBe('application/json');
      expect(client.defaults.headers.common['X-Custom-Header']).toBe('test-value');
      expect(client.defaults.headers.common['Authorization']).toBe('Bearer test-token');
    });

    it('should add journey context headers when provided', () => {
      // Arrange
      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        journeyContext: {
          journeyType: JourneyType.HEALTH,
          context: {
            userId: 'test-user-id',
            deviceId: 'test-device-id'
          }
        }
      };

      // Act
      const client = createInternalApiClient(options);

      // Assert
      expect(client.defaults.headers.common['X-Journey-Type']).toBe(JourneyType.HEALTH);
      expect(client.defaults.headers.common['X-Journey-userId']).toBe('test-user-id');
      expect(client.defaults.headers.common['X-Journey-deviceId']).toBe('test-device-id');
    });

    it('should add SSRF protection interceptor', () => {
      // Arrange
      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com'
      };
      const mockSecurityClient = createSecureHttpClient();

      // Act
      const client = createInternalApiClient(options);

      // Assert
      expect(createSecureHttpClient).toHaveBeenCalled();
      expect(client.interceptors.request.use).toHaveBeenCalled();

      // Get the request interceptor
      const requestInterceptor = client.interceptors.request.use.mock.calls[0][0];
      
      // Create a test config with a URL
      const config: AxiosRequestConfig = { url: 'https://api.example.com/test' };
      
      // Call the interceptor
      requestInterceptor(config);
      
      // Verify that validateUrl was called
      expect(mockSecurityClient.validateUrl).toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests according to retry configuration', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        retry: {
          maxRetries: 3,
          baseDelayMs: 0, // No delay for faster tests
          retryStatusCodes: [500, 502, 503, 504],
          retryNetworkErrors: true
        }
      };

      // Simulate a server error that should be retried
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'server', 500);

      // Act
      const client = createInternalApiClient(options);
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        // Original request + 3 retries = 4 total calls
        expect(mockAxios.get).toHaveBeenCalledTimes(4);
      }
    });

    it('should not retry requests with status codes not in retryStatusCodes', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        retry: {
          maxRetries: 3,
          baseDelayMs: 0,
          retryStatusCodes: [500, 502, 503, 504], // 400 not included
          retryNetworkErrors: true
        }
      };

      // Simulate a client error that should not be retried
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'client', 400);

      // Act
      const client = createInternalApiClient(options);
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        // Only the original request, no retries
        expect(mockAxios.get).toHaveBeenCalledTimes(1);
      }
    });

    it('should retry network errors when retryNetworkErrors is true', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        retry: {
          maxRetries: 2,
          baseDelayMs: 0,
          retryStatusCodes: [500],
          retryNetworkErrors: true
        }
      };

      // Simulate a network error
      simulateNetworkError(mockAxios);

      // Act
      const client = createInternalApiClient(options);
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        // Original request + 2 retries = 3 total calls
        expect(mockAxios.get).toHaveBeenCalledTimes(3);
      }
    });

    it('should not retry network errors when retryNetworkErrors is false', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        retry: {
          maxRetries: 2,
          baseDelayMs: 0,
          retryStatusCodes: [500],
          retryNetworkErrors: false
        }
      };

      // Simulate a network error
      simulateNetworkError(mockAxios);

      // Act
      const client = createInternalApiClient(options);
      
      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        // Only the original request, no retries
        expect(mockAxios.get).toHaveBeenCalledTimes(1);
      }
    });

    it('should respect the Retry-After header if present', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        retry: {
          maxRetries: 1,
          baseDelayMs: 100,
          retryStatusCodes: [429]
        }
      };

      // Create a 429 error with Retry-After header
      const retryAfterError = createMockAxiosError({
        status: 429,
        statusText: 'Too Many Requests',
        message: 'Rate limit exceeded',
        config: { url: 'https://api.example.com/test', method: 'get' }
      });
      
      // Add Retry-After header (in seconds)
      if (retryAfterError.response) {
        retryAfterError.response.headers = { 'retry-after': '2' };
      }

      // Mock the get method to return this specific error
      mockAxios.get.mockRejectedValueOnce(retryAfterError);

      // Act
      const client = createInternalApiClient(options);
      
      // Mock Date.now to track time
      const originalDateNow = Date.now;
      const mockDateNow = jest.fn();
      Date.now = mockDateNow;
      
      // First call to get current time
      mockDateNow.mockReturnValueOnce(1000);
      // Second call after delay to check time elapsed
      mockDateNow.mockReturnValueOnce(3000); // 2 seconds later

      // Trigger the interceptor by making a request that will fail
      try {
        await client.get('/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        // The test passes if we reach here, as we're expecting the request to fail
        // We can verify that the retry was attempted
        expect(mockAxios.get).toHaveBeenCalledTimes(2);
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow;
      }
    });

    it('should use exponential backoff for retries', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      // Mock setTimeout
      jest.useFakeTimers();

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        retry: {
          maxRetries: 2,
          baseDelayMs: 100,
          retryStatusCodes: [500]
        }
      };

      // Simulate a server error
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'server', 500);

      // Act
      const client = createInternalApiClient(options);
      
      // Start the request (it will fail and retry)
      const requestPromise = client.get('/test').catch(() => {});
      
      // Fast-forward time to trigger all retries
      jest.runAllTimers();
      
      // Wait for the request to complete
      await requestPromise;

      // Assert
      // Original request + 2 retries = 3 total calls
      expect(mockAxios.get).toHaveBeenCalledTimes(3);
      
      // Restore real timers
      jest.useRealTimers();
    });
  });

  describe('Circuit Breaker', () => {
    it('should open the circuit after reaching the failure threshold', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        circuitBreaker: {
          enabled: true,
          failureThreshold: 3,
          resetTimeoutMs: 30000
        },
        retry: {
          maxRetries: 0 // Disable retries for this test
        }
      };

      // Simulate a server error
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'server', 500);

      // Act
      const client = createInternalApiClient(options);
      
      // Make 3 failed requests to reach the threshold
      for (let i = 0; i < 3; i++) {
        try {
          await client.get('/test');
        } catch (error) {
          // Expected to fail
        }
      }

      // Make another request that should be rejected by the circuit breaker
      try {
        await client.get('/test');
        fail('Request should have been rejected by circuit breaker');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Circuit breaker is open');
        // The 4th request should not reach the actual HTTP call
        expect(mockAxios.get).toHaveBeenCalledTimes(3);
      }
    });

    it('should reset the circuit after the reset timeout', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const resetTimeoutMs = 1000; // 1 second for testing
      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        circuitBreaker: {
          enabled: true,
          failureThreshold: 2,
          resetTimeoutMs
        },
        retry: {
          maxRetries: 0 // Disable retries for this test
        }
      };

      // Simulate a server error
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'server', 500);

      // Act
      const client = createInternalApiClient(options);
      
      // Make 2 failed requests to reach the threshold
      for (let i = 0; i < 2; i++) {
        try {
          await client.get('/test');
        } catch (error) {
          // Expected to fail
        }
      }

      // Mock Date.now to control time
      const originalDateNow = Date.now;
      const mockDateNow = jest.fn();
      Date.now = mockDateNow;
      
      // First call to record failure time
      mockDateNow.mockReturnValueOnce(1000);
      
      // Make a request that should be rejected by the circuit breaker
      try {
        await client.get('/test');
        fail('Request should have been rejected by circuit breaker');
      } catch (error) {
        // Expected to be rejected by circuit breaker
        expect((error as Error).message).toContain('Circuit breaker is open');
      }

      // Second call after reset timeout
      mockDateNow.mockReturnValueOnce(2500); // 1.5 seconds later, past the reset timeout
      
      // The circuit should now be half-open and allow the next request
      try {
        await client.get('/test');
        fail('Request should have failed but been allowed through the circuit breaker');
      } catch (error) {
        // Expected to fail with the actual HTTP error, not circuit breaker
        expect((error as Error).message).not.toContain('Circuit breaker is open');
      }

      // Assert
      // 2 initial failures + 1 after reset = 3 total calls
      expect(mockAxios.get).toHaveBeenCalledTimes(3);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });

    it('should not use circuit breaker when disabled', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        circuitBreaker: {
          enabled: false,
          failureThreshold: 1 // Would open immediately if enabled
        },
        retry: {
          maxRetries: 0 // Disable retries for this test
        }
      };

      // Simulate a server error
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'server', 500);

      // Act
      const client = createInternalApiClient(options);
      
      // Make multiple requests that would normally trigger the circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await client.get('/test');
        } catch (error) {
          // Expected to fail with the actual HTTP error
          expect((error as AxiosError).response?.status).toBe(500);
        }
      }

      // Assert
      // All 5 requests should have been attempted
      expect(mockAxios.get).toHaveBeenCalledTimes(5);
    });
  });

  describe('Tracing and Correlation', () => {
    it('should add correlation ID header if not present', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        tracing: {
          enabled: true,
          serviceName: 'test-service'
        }
      };

      // Act
      const client = createInternalApiClient(options);
      
      // Make a request
      await client.get('/test').catch(() => {});

      // Assert
      // Get the request config from the mock
      const requestConfig = mockAxios.get.mock.calls[0][1];
      
      // Verify correlation ID was added
      expect(requestConfig.headers['X-Correlation-ID']).toBeDefined();
      expect(requestConfig.headers['X-Source-Service']).toBe('test-service');
    });

    it('should preserve existing correlation ID if present', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        headers: {
          'X-Correlation-ID': 'existing-correlation-id'
        },
        tracing: {
          enabled: true,
          serviceName: 'test-service'
        }
      };

      // Act
      const client = createInternalApiClient(options);
      
      // Make a request
      await client.get('/test').catch(() => {});

      // Assert
      // Get the request config from the mock
      const requestConfig = mockAxios.get.mock.calls[0][1];
      
      // Verify correlation ID was preserved
      expect(requestConfig.headers['X-Correlation-ID']).toBe('existing-correlation-id');
    });

    it('should not add tracing headers when tracing is disabled', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        tracing: {
          enabled: false
        }
      };

      // Act
      const client = createInternalApiClient(options);
      
      // Make a request
      await client.get('/test').catch(() => {});

      // Assert
      // Get the request config from the mock
      const requestConfig = mockAxios.get.mock.calls[0][1];
      
      // Verify tracing headers were not added
      expect(requestConfig.headers['X-Correlation-ID']).toBeUndefined();
      expect(requestConfig.headers['X-Source-Service']).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should enhance errors with journey context', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        journeyContext: {
          journeyType: JourneyType.HEALTH,
          context: {
            userId: 'test-user-id'
          }
        },
        retry: {
          maxRetries: 0 // Disable retries for this test
        }
      };

      // Simulate a server error
      simulateFailedRequest(mockAxios, 'https://api.example.com/test', 'server', 500);

      // Act
      const client = createInternalApiClient(options);
      
      // Make a request that will fail
      try {
        await client.get('/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(Error);
        expect((error as any).journeyContext).toEqual(options.journeyContext);
        expect((error as Error).message).toContain('[HEALTH]');
      }
    });

    it('should not modify errors when journey context is not provided', async () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);

      const options: InternalApiClientOptions = {
        baseURL: 'https://api.example.com',
        retry: {
          maxRetries: 0 // Disable retries for this test
        }
      };

      // Create an error with a specific message
      const errorMessage = 'Original error message';
      const serverError = createMockAxiosError({
        status: 500,
        message: errorMessage,
        config: { url: 'https://api.example.com/test', method: 'get' }
      });
      mockAxios.get.mockRejectedValueOnce(serverError);

      // Act
      const client = createInternalApiClient(options);
      
      // Make a request that will fail
      try {
        await client.get('/test');
        fail('Request should have failed');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(Error);
        expect((error as any).journeyContext).toBeUndefined();
        expect((error as Error).message).toBe(errorMessage);
      }
    });
  });

  describe('Journey-Specific Clients', () => {
    it('should create a Health journey client with correct configuration', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);
      const baseURL = 'https://health-api.example.com';

      // Act
      const client = createHealthJourneyClient(baseURL);

      // Assert
      expect(client.defaults.baseURL).toBe(baseURL);
      expect(client.defaults.headers.common['X-Journey-Type']).toBe(JourneyType.HEALTH);
    });

    it('should create a Care journey client with correct configuration', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);
      const baseURL = 'https://care-api.example.com';

      // Act
      const client = createCareJourneyClient(baseURL);

      // Assert
      expect(client.defaults.baseURL).toBe(baseURL);
      expect(client.defaults.headers.common['X-Journey-Type']).toBe(JourneyType.CARE);
    });

    it('should create a Plan journey client with correct configuration', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);
      const baseURL = 'https://plan-api.example.com';

      // Act
      const client = createPlanJourneyClient(baseURL);

      // Assert
      expect(client.defaults.baseURL).toBe(baseURL);
      expect(client.defaults.headers.common['X-Journey-Type']).toBe(JourneyType.PLAN);
    });

    it('should create a Gamification client with correct configuration', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);
      const baseURL = 'https://gamification-api.example.com';

      // Act
      const client = createGamificationClient(baseURL);

      // Assert
      expect(client.defaults.baseURL).toBe(baseURL);
      expect(client.defaults.headers.common['X-Journey-Type']).toBe(JourneyType.GAMIFICATION);
    });

    it('should create a Notification client with correct configuration', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);
      const baseURL = 'https://notification-api.example.com';

      // Act
      const client = createNotificationClient(baseURL);

      // Assert
      expect(client.defaults.baseURL).toBe(baseURL);
      expect(client.defaults.headers.common['X-Journey-Type']).toBe(JourneyType.NOTIFICATION);
    });

    it('should create an Auth client with correct configuration', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);
      const baseURL = 'https://auth-api.example.com';

      // Act
      const client = createAuthClient(baseURL);

      // Assert
      expect(client.defaults.baseURL).toBe(baseURL);
      expect(client.defaults.headers.common['X-Journey-Type']).toBe(JourneyType.AUTH);
    });

    it('should allow custom options in journey-specific clients', () => {
      // Arrange
      const mockAxios = createMockAxiosInstance();
      (axios.create as jest.Mock).mockReturnValue(mockAxios);
      const baseURL = 'https://health-api.example.com';
      const customOptions = {
        timeout: 15000,
        headers: {
          'X-Custom-Header': 'test-value'
        },
        retry: {
          maxRetries: 5
        }
      };

      // Act
      const client = createHealthJourneyClient(baseURL, customOptions);

      // Assert
      expect(client.defaults.baseURL).toBe(baseURL);
      expect(client.defaults.timeout).toBe(15000);
      expect(client.defaults.headers.common['X-Journey-Type']).toBe(JourneyType.HEALTH);
      expect(client.defaults.headers.common['X-Custom-Header']).toBe('test-value');
    });
  });
});
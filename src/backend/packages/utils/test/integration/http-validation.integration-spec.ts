/**
 * Integration tests for HTTP utilities and validation utilities
 * 
 * These tests verify the integration between HTTP utilities and validation utilities,
 * focusing on URL validation, SSRF protection, and error handling.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import nock from 'nock';

// Import HTTP utilities
import { createSecureHttpClient } from '../../src/http/security';
import { createHttpClient, HttpClientError } from '../../src/http/client';
import { createInternalApiClient, JourneyType } from '../../src/http/internal';

// Import validation utilities
import { validateUrl, isValidUrl, StringValidationErrors } from '../../src/validation/string.validator';

describe('HTTP and Validation Integration', () => {
  // Setup and teardown for nock
  beforeAll(() => {
    nock.disableNetConnect();
    // Allow localhost connections for the test server
    nock.enableNetConnect('127.0.0.1');
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Secure HTTP Client with URL Validation', () => {
    it('should block requests to private IP addresses', async () => {
      // Create a secure HTTP client
      const secureClient = createSecureHttpClient();
      
      // Test validation of private IP
      const privateIpUrl = 'http://192.168.1.1/api/data';
      
      // Expect validation to fail
      expect(() => {
        secureClient.validateUrl(privateIpUrl);
      }).toThrow('SSRF Protection');
      
      // Verify the same with string validator
      const validationResult = validateUrl(privateIpUrl);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(StringValidationErrors.SSRF_PROTECTION);
    });

    it('should block requests to localhost', async () => {
      // Create a secure HTTP client
      const secureClient = createSecureHttpClient();
      
      // Test validation of localhost
      const localhostUrl = 'http://localhost:3000/api/data';
      
      // Expect validation to fail
      expect(() => {
        secureClient.validateUrl(localhostUrl);
      }).toThrow('SSRF Protection');
      
      // Verify the same with string validator
      const validationResult = validateUrl(localhostUrl);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(StringValidationErrors.SSRF_PROTECTION);
    });

    it('should allow requests to public domains', async () => {
      // Create a secure HTTP client
      const secureClient = createSecureHttpClient();
      
      // Test validation of public domain
      const publicUrl = 'https://api.example.com/data';
      
      // Expect validation to pass
      expect(() => {
        secureClient.validateUrl(publicUrl);
      }).not.toThrow();
      
      // Verify the same with string validator
      const validationResult = validateUrl(publicUrl);
      expect(validationResult.isValid).toBe(true);
    });

    it('should handle invalid URLs correctly', async () => {
      // Create a secure HTTP client
      const secureClient = createSecureHttpClient();
      
      // Test validation of invalid URL
      const invalidUrl = 'not-a-valid-url';
      
      // Expect validation to fail
      expect(() => {
        secureClient.validateUrl(invalidUrl);
      }).toThrow('Invalid URL');
      
      // Verify the same with string validator
      const validationResult = validateUrl(invalidUrl);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(StringValidationErrors.INVALID_URL);
    });
  });

  describe('HTTP Client with URL Validation Integration', () => {
    let httpClient: AxiosInstance;

    beforeEach(() => {
      // Create HTTP client with custom config
      httpClient = createHttpClient({
        timeout: 5000,
        retry: {
          retries: 0 // Disable retries for testing
        }
      });
    });

    it('should reject requests to private IP addresses', async () => {
      // Add request interceptor for SSRF protection
      httpClient.interceptors.request.use(config => {
        if (config.url) {
          const validationResult = validateUrl(config.url, { allowPrivateIps: false });
          if (!validationResult.isValid) {
            throw new Error(validationResult.error);
          }
        }
        return config;
      });

      // Attempt to make a request to a private IP
      await expect(httpClient.get('http://192.168.1.1/api/data'))
        .rejects
        .toThrow(StringValidationErrors.SSRF_PROTECTION);
    });

    it('should reject requests to localhost', async () => {
      // Add request interceptor for SSRF protection
      httpClient.interceptors.request.use(config => {
        if (config.url) {
          const validationResult = validateUrl(config.url, { allowPrivateIps: false });
          if (!validationResult.isValid) {
            throw new Error(validationResult.error);
          }
        }
        return config;
      });

      // Attempt to make a request to localhost
      await expect(httpClient.get('http://localhost:3000/api/data'))
        .rejects
        .toThrow(StringValidationErrors.SSRF_PROTECTION);
    });

    it('should allow requests to public domains with proper validation', async () => {
      // Mock a successful response
      nock('https://api.example.com')
        .get('/data')
        .reply(200, { success: true });

      // Add request interceptor for URL validation
      httpClient.interceptors.request.use(config => {
        if (config.url) {
          const validationResult = validateUrl(config.url);
          if (!validationResult.isValid) {
            throw new Error(validationResult.error);
          }
        }
        return config;
      });

      // Make a request to a public domain
      const response = await httpClient.get('https://api.example.com/data');
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
    });

    it('should handle invalid URLs with validation', async () => {
      // Add request interceptor for URL validation
      httpClient.interceptors.request.use(config => {
        if (config.url) {
          const validationResult = validateUrl(config.url);
          if (!validationResult.isValid) {
            throw new Error(validationResult.error);
          }
        }
        return config;
      });

      // Attempt to make a request with an invalid URL
      await expect(httpClient.get('not-a-valid-url'))
        .rejects
        .toThrow(StringValidationErrors.INVALID_URL);
    });
  });

  describe('Internal API Client with Journey-Specific Validation', () => {
    it('should apply journey-specific validation rules for Health journey', async () => {
      // Mock a successful response
      nock('https://health-api.example.com')
        .get('/metrics')
        .reply(200, { metrics: [] });

      // Create a Health journey client
      const healthClient = createInternalApiClient({
        baseURL: 'https://health-api.example.com',
        journeyContext: {
          journeyType: JourneyType.HEALTH
        }
      });

      // Add request interceptor for journey-specific validation
      healthClient.interceptors.request.use(config => {
        // Verify journey headers are set
        expect(config.headers['X-Journey-Type']).toBe(JourneyType.HEALTH);
        
        // Apply URL validation
        if (config.url) {
          const validationResult = validateUrl(config.url);
          if (!validationResult.isValid) {
            throw new Error(validationResult.error);
          }
        }
        return config;
      });

      // Make a request
      const response = await healthClient.get('/metrics');
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ metrics: [] });
    });

    it('should apply journey-specific validation rules for Care journey', async () => {
      // Mock a successful response
      nock('https://care-api.example.com')
        .get('/appointments')
        .reply(200, { appointments: [] });

      // Create a Care journey client
      const careClient = createInternalApiClient({
        baseURL: 'https://care-api.example.com',
        journeyContext: {
          journeyType: JourneyType.CARE
        }
      });

      // Add request interceptor for journey-specific validation
      careClient.interceptors.request.use(config => {
        // Verify journey headers are set
        expect(config.headers['X-Journey-Type']).toBe(JourneyType.CARE);
        
        // Apply URL validation
        if (config.url) {
          const validationResult = validateUrl(config.url);
          if (!validationResult.isValid) {
            throw new Error(validationResult.error);
          }
        }
        return config;
      });

      // Make a request
      const response = await careClient.get('/appointments');
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ appointments: [] });
    });

    it('should apply journey-specific validation rules for Plan journey', async () => {
      // Mock a successful response
      nock('https://plan-api.example.com')
        .get('/benefits')
        .reply(200, { benefits: [] });

      // Create a Plan journey client
      const planClient = createInternalApiClient({
        baseURL: 'https://plan-api.example.com',
        journeyContext: {
          journeyType: JourneyType.PLAN
        }
      });

      // Add request interceptor for journey-specific validation
      planClient.interceptors.request.use(config => {
        // Verify journey headers are set
        expect(config.headers['X-Journey-Type']).toBe(JourneyType.PLAN);
        
        // Apply URL validation
        if (config.url) {
          const validationResult = validateUrl(config.url);
          if (!validationResult.isValid) {
            throw new Error(validationResult.error);
          }
        }
        return config;
      });

      // Make a request
      const response = await planClient.get('/benefits');
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ benefits: [] });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle validation errors with proper error context', async () => {
      // Create HTTP client
      const httpClient = createHttpClient({
        timeout: 5000,
        retry: {
          retries: 0 // Disable retries for testing
        }
      });

      // Add request interceptor that throws a specific error type
      httpClient.interceptors.request.use(config => {
        if (config.url) {
          const validationResult = validateUrl(config.url);
          if (!validationResult.isValid) {
            const error = new Error(validationResult.error) as any;
            error.isValidationError = true;
            error.validationDetails = validationResult.details;
            throw error;
          }
        }
        return config;
      });

      try {
        // Attempt to make a request with an invalid URL
        await httpClient.get('http://localhost:3000/api/data');
        fail('Request should have failed');
      } catch (error) {
        // Verify error properties
        expect((error as any).isValidationError).toBe(true);
        expect((error as Error).message).toBe(StringValidationErrors.SSRF_PROTECTION);
        expect((error as any).validationDetails).toBeDefined();
        expect((error as any).validationDetails.reason).toBe('private_ip');
      }
    });

    it('should integrate with HttpClientError for comprehensive error handling', async () => {
      // Create HTTP client
      const httpClient = createHttpClient({
        timeout: 5000,
        retry: {
          retries: 0 // Disable retries for testing
        }
      });

      // Mock a server error
      nock('https://api.example.com')
        .get('/data')
        .reply(500, { error: 'Internal Server Error' });

      try {
        // Make a request that will result in a server error
        await httpClient.get('https://api.example.com/data');
        fail('Request should have failed');
      } catch (error) {
        // Verify it's an HttpClientError with the right properties
        expect(error).toBeInstanceOf(HttpClientError);
        const clientError = error as HttpClientError;
        expect(clientError.statusCode).toBe(500);
        expect(clientError.httpErrorType).toBe('SERVER');
        expect(clientError.url).toBe('https://api.example.com/data');
      }
    });

    it('should handle network errors with proper categorization', async () => {
      // Create HTTP client
      const httpClient = createHttpClient({
        timeout: 1000, // Short timeout to trigger timeout error
        retry: {
          retries: 0 // Disable retries for testing
        }
      });

      // Mock a delayed response that will trigger a timeout
      nock('https://api.example.com')
        .get('/data')
        .delay(2000) // Delay longer than the timeout
        .reply(200, { data: 'too late' });

      try {
        // Make a request that will timeout
        await httpClient.get('https://api.example.com/data');
        fail('Request should have timed out');
      } catch (error) {
        // Verify it's an HttpClientError with the right properties
        expect(error).toBeInstanceOf(HttpClientError);
        const clientError = error as HttpClientError;
        expect(clientError.httpErrorType).toBe('NETWORK');
        expect(clientError.originalError.code).toBe('ECONNABORTED');
      }
    });
  });

  describe('Combined HTTP and Validation Integration', () => {
    it('should validate URLs before making requests', async () => {
      // Create a function that validates URLs before making requests
      const makeValidatedRequest = async (url: string): Promise<any> => {
        // First validate the URL
        const validationResult = validateUrl(url);
        if (!validationResult.isValid) {
          throw new Error(validationResult.error);
        }
        
        // If validation passes, create a client and make the request
        const client = createHttpClient();
        return client.get(url);
      };

      // Mock a successful response
      nock('https://api.example.com')
        .get('/data')
        .reply(200, { success: true });

      // Test with a valid URL
      const response = await makeValidatedRequest('https://api.example.com/data');
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });

      // Test with an invalid URL
      await expect(makeValidatedRequest('not-a-valid-url'))
        .rejects
        .toThrow(StringValidationErrors.INVALID_URL);

      // Test with a private IP
      await expect(makeValidatedRequest('http://192.168.1.1/api/data'))
        .rejects
        .toThrow(StringValidationErrors.SSRF_PROTECTION);
    });

    it('should integrate validation with journey-specific clients', async () => {
      // Create a factory function for journey-specific clients with validation
      const createValidatedJourneyClient = (journeyType: JourneyType, baseURL: string): AxiosInstance => {
        // Create the journey client
        const client = createInternalApiClient({
          baseURL,
          journeyContext: {
            journeyType
          }
        });
        
        // Add validation interceptor
        client.interceptors.request.use(config => {
          // Apply URL validation with journey-specific rules
          if (config.url) {
            // Different validation rules based on journey type
            const options = {
              allowPrivateIps: false,
              requireHttps: journeyType === JourneyType.HEALTH || journeyType === JourneyType.CARE
            };
            
            const validationResult = validateUrl(config.url, options);
            if (!validationResult.isValid) {
              throw new Error(`[${journeyType}] ${validationResult.error}`);
            }
          }
          return config;
        });
        
        return client;
      };

      // Mock responses for different journeys
      nock('https://health-api.example.com')
        .get('/metrics')
        .reply(200, { metrics: [] });

      nock('https://care-api.example.com')
        .get('/appointments')
        .reply(200, { appointments: [] });

      // Create clients for different journeys
      const healthClient = createValidatedJourneyClient(
        JourneyType.HEALTH,
        'https://health-api.example.com'
      );
      
      const careClient = createValidatedJourneyClient(
        JourneyType.CARE,
        'https://care-api.example.com'
      );

      // Test successful requests
      const healthResponse = await healthClient.get('/metrics');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.data).toEqual({ metrics: [] });

      const careResponse = await careClient.get('/appointments');
      expect(careResponse.status).toBe(200);
      expect(careResponse.data).toEqual({ appointments: [] });

      // Test with HTTP instead of HTTPS for health journey (should fail)
      const httpHealthClient = createValidatedJourneyClient(
        JourneyType.HEALTH,
        'http://health-api.example.com'
      );
      
      await expect(httpHealthClient.get('/metrics'))
        .rejects
        .toThrow('[health] Invalid URL');
    });
  });
});
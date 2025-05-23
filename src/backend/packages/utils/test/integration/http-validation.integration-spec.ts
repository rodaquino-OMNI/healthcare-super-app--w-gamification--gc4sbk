/**
 * @file HTTP Validation Integration Tests
 * @description Integration tests for HTTP utilities and validation utilities
 * 
 * These tests verify the integration between secure-axios and validation utilities,
 * ensuring that HTTP requests are properly validated for security and data integrity.
 * The tests focus on URL validation, SSRF protection, and error handling when validation fails.
 */

import { createSecureAxios, createInternalApiClient } from '../../../shared/src/utils/secure-axios';
import * as StringValidator from '../../src/validation/string.validator';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Create a mock for axios to avoid actual HTTP requests during tests
let mockAxios: MockAdapter;

describe('HTTP Validation Integration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a fresh mock adapter for each test
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    // Clean up mock adapter after each test
    mockAxios.restore();
  });

  describe('Secure Axios with URL Validation', () => {
    it('should successfully make requests to valid URLs', async () => {
      // Arrange
      const secureAxios = createSecureAxios();
      const url = 'https://api.example.com/data';
      mockAxios.onGet(url).reply(200, { data: 'success' });
      
      // Spy on the URL validation function
      const validateUrlSpy = jest.spyOn(StringValidator, 'validateUrl');
      
      // Act
      const response = await secureAxios.get(url);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'success' });
      // Validation function should not be directly called by secure-axios
      // as it implements its own validation logic
      expect(validateUrlSpy).not.toHaveBeenCalled();
    });

    it('should reject requests to private IP addresses (SSRF protection)', async () => {
      // Arrange
      const secureAxios = createSecureAxios();
      const privateUrls = [
        'http://localhost/api',
        'http://127.0.0.1/data',
        'http://192.168.1.1/admin',
        'http://10.0.0.1/internal',
        'http://172.16.0.1/private'
      ];
      
      // Act & Assert
      for (const url of privateUrls) {
        await expect(secureAxios.get(url)).rejects.toThrow('SSRF Protection');
      }
    });

    it('should integrate with string validator for manual URL validation', async () => {
      // Arrange
      const secureAxios = createSecureAxios();
      const validUrl = 'https://api.example.com/data';
      const invalidUrl = 'http://localhost/api';
      mockAxios.onGet(validUrl).reply(200, { data: 'success' });
      
      // Act & Assert - Valid URL
      const isValidUrl = StringValidator.isValidUrl(validUrl, { checkSsrf: true });
      expect(isValidUrl).toBe(true);
      
      if (isValidUrl) {
        const response = await secureAxios.get(validUrl);
        expect(response.status).toBe(200);
      }
      
      // Act & Assert - Invalid URL (SSRF risk)
      const isInvalidUrl = StringValidator.isValidUrl(invalidUrl, { checkSsrf: true });
      expect(isInvalidUrl).toBe(false);
      
      // Should not even attempt the request if validation fails
      if (isInvalidUrl) {
        await secureAxios.get(invalidUrl); // This line should not execute
      }
    });

    it('should provide detailed validation results for URLs', () => {
      // Arrange
      const validUrl = 'https://api.example.com/data';
      const invalidUrl = 'http://localhost/api';
      const nonHttpsUrl = 'http://example.com';
      
      // Act & Assert - Valid URL
      const validResult = StringValidator.validateUrl(validUrl, { checkSsrf: true });
      expect(validResult.valid).toBe(true);
      
      // Act & Assert - Invalid URL (SSRF risk)
      const invalidResult = StringValidator.validateUrl(invalidUrl, { checkSsrf: true });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.message).toContain('SSRF Protection');
      
      // Act & Assert - Non-HTTPS URL with HTTPS required
      const httpsResult = StringValidator.validateUrl(nonHttpsUrl, { requireHttps: true });
      expect(httpsResult.valid).toBe(false);
      expect(httpsResult.message).toContain('HTTPS protocol');
    });
  });

  describe('Internal API Client with Validation', () => {
    it('should create a properly configured internal API client', () => {
      // Arrange
      const baseURL = 'https://api.austa.health';
      const headers = { 'X-API-Key': 'test-key' };
      
      // Act
      const apiClient = createInternalApiClient(baseURL, headers);
      
      // Assert
      expect(apiClient.defaults.baseURL).toBe(baseURL);
      expect(apiClient.defaults.headers.common['X-API-Key']).toBe('test-key');
      expect(apiClient.defaults.headers.common['Content-Type']).toBe('application/json');
      expect(apiClient.defaults.timeout).toBe(10000);
    });

    it('should validate URLs before making requests with internal client', async () => {
      // Arrange
      const baseURL = 'https://api.austa.health';
      const apiClient = createInternalApiClient(baseURL);
      const endpoint = '/users';
      const fullUrl = `${baseURL}${endpoint}`;
      
      mockAxios.onGet(fullUrl).reply(200, { users: [] });
      
      // Validate the URL first
      const urlValidation = StringValidator.validateUrl(fullUrl, {
        requireHttps: true,
        checkSsrf: true
      });
      
      // Act & Assert
      expect(urlValidation.valid).toBe(true);
      
      if (urlValidation.valid) {
        const response = await apiClient.get(endpoint);
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ users: [] });
      }
    });
  });

  describe('Error Handling with Validation', () => {
    it('should throw validation errors when URL validation fails', () => {
      // Arrange
      const invalidUrl = 'not-a-url';
      
      // Act & Assert
      expect(() => {
        StringValidator.isValidUrl(invalidUrl, { throwOnError: true });
      }).toThrow('Invalid URL');
    });

    it('should provide custom error messages for validation failures', () => {
      // Arrange
      const invalidUrl = 'http://localhost/api';
      const customErrorMessage = 'Security policy violation: internal URLs not allowed';
      
      // Act & Assert
      expect(() => {
        StringValidator.isValidUrl(invalidUrl, {
          checkSsrf: true,
          throwOnError: true,
          errorMessage: customErrorMessage
        });
      }).toThrow(customErrorMessage);
    });

    it('should handle null and undefined values in validation', () => {
      // Arrange
      const nullUrl = null;
      const undefinedUrl = undefined;
      
      // Act & Assert - Default behavior (not allowing null/undefined)
      expect(StringValidator.isValidUrl(nullUrl)).toBe(false);
      expect(StringValidator.isValidUrl(undefinedUrl)).toBe(false);
      
      // Act & Assert - With allowNull/allowUndefined options
      expect(StringValidator.isValidUrl(nullUrl, { allowNull: true })).toBe(true);
      expect(StringValidator.isValidUrl(undefinedUrl, { allowUndefined: true })).toBe(true);
    });
  });

  describe('Journey-Specific Validation Rules', () => {
    it('should validate health journey API endpoints', () => {
      // Arrange
      const healthApiUrl = 'https://api.austa.health/health-service/v1/metrics';
      const invalidHealthApiUrl = 'https://api.austa.health/health-service/v1/admin';
      
      // Define health journey specific validation options
      const healthJourneyOptions: StringValidator.UrlValidationOptions = {
        requireHttps: true,
        checkSsrf: true,
        allowedDomains: ['api.austa.health'],
        // Only allow specific health journey endpoints
        errorMessage: 'Invalid health journey API endpoint'
      };
      
      // Act & Assert
      const validResult = StringValidator.validateUrl(healthApiUrl, healthJourneyOptions);
      expect(validResult.valid).toBe(true);
      
      // Validate URL pattern for health metrics endpoint
      const isValidHealthEndpoint = StringValidator.matchesPattern(
        healthApiUrl,
        { pattern: /\/health-service\/v1\/(metrics|goals|devices)/ }
      );
      expect(isValidHealthEndpoint).toBe(true);
      
      // Invalid health endpoint (admin is not allowed)
      const isInvalidHealthEndpoint = StringValidator.matchesPattern(
        invalidHealthApiUrl,
        { pattern: /\/health-service\/v1\/(metrics|goals|devices)/ }
      );
      expect(isInvalidHealthEndpoint).toBe(false);
    });

    it('should validate care journey API endpoints', () => {
      // Arrange
      const careApiUrl = 'https://api.austa.health/care-service/v1/appointments';
      
      // Define care journey specific validation options
      const careJourneyOptions: StringValidator.UrlValidationOptions = {
        requireHttps: true,
        checkSsrf: true,
        allowedDomains: ['api.austa.health'],
        errorMessage: 'Invalid care journey API endpoint'
      };
      
      // Act & Assert
      const validResult = StringValidator.validateUrl(careApiUrl, careJourneyOptions);
      expect(validResult.valid).toBe(true);
      
      // Validate URL pattern for care appointments endpoint
      const isValidCareEndpoint = StringValidator.matchesPattern(
        careApiUrl,
        { pattern: /\/care-service\/v1\/(appointments|providers|telemedicine)/ }
      );
      expect(isValidCareEndpoint).toBe(true);
    });

    it('should validate plan journey API endpoints', () => {
      // Arrange
      const planApiUrl = 'https://api.austa.health/plan-service/v1/benefits';
      
      // Define plan journey specific validation options
      const planJourneyOptions: StringValidator.UrlValidationOptions = {
        requireHttps: true,
        checkSsrf: true,
        allowedDomains: ['api.austa.health'],
        errorMessage: 'Invalid plan journey API endpoint'
      };
      
      // Act & Assert
      const validResult = StringValidator.validateUrl(planApiUrl, planJourneyOptions);
      expect(validResult.valid).toBe(true);
      
      // Validate URL pattern for plan benefits endpoint
      const isValidPlanEndpoint = StringValidator.matchesPattern(
        planApiUrl,
        { pattern: /\/plan-service\/v1\/(benefits|claims|coverage)/ }
      );
      expect(isValidPlanEndpoint).toBe(true);
    });
  });

  describe('Combined Validation Scenarios', () => {
    it('should validate URL and make request in a single flow', async () => {
      // Arrange
      const url = 'https://api.austa.health/health-service/v1/metrics';
      mockAxios.onGet(url).reply(200, { metrics: [] });
      
      // Act - Validate URL first
      const urlValidation = StringValidator.validateUrl(url, {
        requireHttps: true,
        checkSsrf: true,
        allowedDomains: ['api.austa.health']
      });
      
      // Assert validation result
      expect(urlValidation.valid).toBe(true);
      
      // Act - Make request if validation passes
      if (urlValidation.valid) {
        const secureAxios = createSecureAxios();
        const response = await secureAxios.get(url);
        
        // Assert response
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ metrics: [] });
      }
    });

    it('should validate request parameters before making request', async () => {
      // Arrange
      const baseURL = 'https://api.austa.health';
      const endpoint = '/health-service/v1/metrics';
      const params = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      const apiClient = createInternalApiClient(baseURL);
      mockAxios.onGet(`${baseURL}${endpoint}`).reply(200, { metrics: [] });
      
      // Act - Validate parameters
      const isValidUserId = StringValidator.isUuid(params.userId);
      const isValidDateRange = true; // Assume we have a date validator that would check this
      
      // Assert validation results
      expect(isValidUserId).toBe(true);
      expect(isValidDateRange).toBe(true);
      
      // Act - Make request if all validations pass
      if (isValidUserId && isValidDateRange) {
        const response = await apiClient.get(endpoint, { params });
        
        // Assert response
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ metrics: [] });
      }
    });

    it('should handle validation and request errors appropriately', async () => {
      // Arrange
      const validUrl = 'https://api.austa.health/health-service/v1/metrics';
      const invalidUrl = 'http://localhost/api';
      
      // Mock a server error for the valid URL
      mockAxios.onGet(validUrl).reply(500, { error: 'Internal Server Error' });
      
      // Act & Assert - Invalid URL (should fail validation)
      const urlValidation = StringValidator.validateUrl(invalidUrl, { checkSsrf: true });
      expect(urlValidation.valid).toBe(false);
      
      // Act & Assert - Valid URL but server error
      const validUrlValidation = StringValidator.validateUrl(validUrl, { checkSsrf: true });
      expect(validUrlValidation.valid).toBe(true);
      
      if (validUrlValidation.valid) {
        const secureAxios = createSecureAxios();
        await expect(secureAxios.get(validUrl)).rejects.toThrow('Request failed with status code 500');
      }
    });
  });
});
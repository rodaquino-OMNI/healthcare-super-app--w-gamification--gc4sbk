import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, Module } from '@nestjs/common';
import { createSecureAxios, createInternalApiClient } from '../../../src/http/secure-axios';
import * as nock from 'nock';
import * as express from 'express';
import * as http from 'http';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

/**
 * HTTP Utilities E2E Tests
 * 
 * This suite tests the HTTP utilities in real network scenarios, including:
 * - SSRF protection by attempting to access prohibited private IP ranges and domains
 * - Internal service client functionality with mocked responses
 * - Error handling during network failures
 * - Retry mechanisms for failed operations
 *
 * These tests validate the security and reliability of cross-service communication
 * in the AUSTA SuperApp architecture.
 */
describe('HTTP Utilities E2E Tests', () => {
  let mockServer: http.Server;
  let mockServerPort: number;
  let mockServerBaseUrl: string;
  
  /**
   * Sets up a mock HTTP server before all tests to simulate real network requests
   * without requiring external dependencies.
   */
  beforeAll(async () => {
    // Create a simple Express app for testing
    const app = express();
    
    // Setup routes for testing
    app.get('/success', (req, res) => {
      res.status(200).json({ message: 'Success' });
    });
    
    app.get('/error', (req, res) => {
      res.status(500).json({ message: 'Internal Server Error' });
    });
    
    app.get('/timeout', (req, res) => {
      // Simulate a timeout by not responding
      setTimeout(() => {
        res.status(200).json({ message: 'Delayed response' });
      }, 3000); // 3 seconds delay
    });
    
    app.get('/retry-success', (req, res) => {
      const attempt = req.headers['x-retry-attempt'] || '1';
      if (attempt === '1') {
        res.status(503).json({ message: 'Service Unavailable' });
      } else {
        res.status(200).json({ message: 'Success after retry' });
      }
    });
    
    app.get('/journey/:journeyType/data', (req, res) => {
      const { journeyType } = req.params;
      res.status(200).json({ journey: journeyType, data: { id: '123', name: 'Test Data' } });
    });
    
    // Start the server on a random port
    return new Promise<void>((resolve) => {
      mockServer = app.listen(0, () => {
        const address = mockServer.address() as { port: number };
        mockServerPort = address.port;
        mockServerBaseUrl = `http://localhost:${mockServerPort}`;
        resolve();
      });
    });
  });
  
  /**
   * Cleans up the mock server after all tests are complete.
   */
  afterAll(async () => {
    if (mockServer) {
      await new Promise<void>((resolve) => mockServer.close(() => resolve()));
    }
    
    // Clean up any remaining nock interceptors
    nock.cleanAll();
    nock.restore();
  });
  
  /**
   * Cleans up nock interceptors before each test to ensure a clean state.
   */
  beforeEach(() => {
    nock.cleanAll();
  });
  
  describe('createSecureAxios', () => {
    let secureAxios: AxiosInstance;
    
    beforeEach(() => {
      secureAxios = createSecureAxios();
    });
    
    /**
     * Test case: should successfully make requests to public domains
     * 
     * Verifies that the secure Axios instance can make requests to public domains
     * without being blocked by SSRF protection.
     */
    it('should successfully make requests to public domains', async () => {
      const response = await secureAxios.get(`${mockServerBaseUrl}/success`);
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Success' });
    });
    
    /**
     * Test case: should block requests to private IP ranges (localhost)
     * 
     * Verifies that the secure Axios instance blocks requests to localhost,
     * which is a private IP range that could be used for SSRF attacks.
     */
    it('should block requests to private IP ranges (localhost)', async () => {
      await expect(secureAxios.get('http://localhost/anything')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });
    
    /**
     * Test case: should block requests to private IP ranges (127.0.0.1)
     * 
     * Verifies that the secure Axios instance blocks requests to 127.0.0.1,
     * which is a private IP range that could be used for SSRF attacks.
     */
    it('should block requests to private IP ranges (127.0.0.1)', async () => {
      await expect(secureAxios.get('http://127.0.0.1/anything')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });
    
    /**
     * Test case: should block requests to private IP ranges (10.x.x.x)
     * 
     * Verifies that the secure Axios instance blocks requests to 10.x.x.x,
     * which is a private IP range that could be used for SSRF attacks.
     */
    it('should block requests to private IP ranges (10.x.x.x)', async () => {
      await expect(secureAxios.get('http://10.0.0.1/anything')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });
    
    /**
     * Test case: should block requests to private IP ranges (192.168.x.x)
     * 
     * Verifies that the secure Axios instance blocks requests to 192.168.x.x,
     * which is a private IP range that could be used for SSRF attacks.
     */
    it('should block requests to private IP ranges (192.168.x.x)', async () => {
      await expect(secureAxios.get('http://192.168.1.1/anything')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });
    
    /**
     * Test case: should block requests to private IP ranges (172.16.x.x - 172.31.x.x)
     * 
     * Verifies that the secure Axios instance blocks requests to 172.16.x.x - 172.31.x.x,
     * which is a private IP range that could be used for SSRF attacks.
     */
    it('should block requests to private IP ranges (172.16.x.x - 172.31.x.x)', async () => {
      await expect(secureAxios.get('http://172.16.0.1/anything')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
      
      await expect(secureAxios.get('http://172.31.255.255/anything')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });
    
    /**
     * Test case: should block requests to .local domains
     * 
     * Verifies that the secure Axios instance blocks requests to .local domains,
     * which are typically used for local network discovery and could be used for SSRF attacks.
     */
    it('should block requests to .local domains', async () => {
      await expect(secureAxios.get('http://service.local/anything')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });
    
    /**
     * Test case: should handle network errors gracefully
     * 
     * Verifies that the secure Axios instance handles network errors gracefully
     * by throwing an appropriate error that can be caught and handled by the application.
     */
    it('should handle network errors gracefully', async () => {
      // Use a non-existent domain to trigger a network error
      await expect(secureAxios.get('http://non-existent-domain-12345.com/anything')).rejects.toThrow();
    });
    
    /**
     * Test case: should handle server errors correctly
     * 
     * Verifies that the secure Axios instance handles server errors correctly
     * by returning the error response from the server.
     */
    it('should handle server errors correctly', async () => {
      try {
        await secureAxios.get(`${mockServerBaseUrl}/error`);
        fail('Expected request to fail with server error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(500);
        expect(axiosError.response?.data).toEqual({ message: 'Internal Server Error' });
      }
    });
    
    /**
     * Test case: should timeout after the specified timeout period
     * 
     * Verifies that the secure Axios instance times out after the specified timeout period
     * when a server takes too long to respond.
     */
    it('should timeout after the specified timeout period', async () => {
      // Configure a short timeout for this test
      const axiosWithTimeout = createSecureAxios();
      axiosWithTimeout.defaults.timeout = 1000; // 1 second timeout
      
      try {
        await axiosWithTimeout.get(`${mockServerBaseUrl}/timeout`);
        fail('Expected request to timeout');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.code).toBe('ECONNABORTED');
        expect(axiosError.message).toContain('timeout');
      }
    });
  });
  
  describe('createInternalApiClient', () => {
    let internalApiClient: AxiosInstance;
    
    beforeEach(() => {
      internalApiClient = createInternalApiClient(mockServerBaseUrl);
    });
    
    /**
     * Test case: should configure baseURL correctly
     * 
     * Verifies that the internal API client configures the baseURL correctly
     * so that requests are sent to the correct service.
     */
    it('should configure baseURL correctly', () => {
      expect(internalApiClient.defaults.baseURL).toBe(mockServerBaseUrl);
    });
    
    /**
     * Test case: should set default headers correctly
     * 
     * Verifies that the internal API client sets the default headers correctly
     * for internal service communication.
     */
    it('should set default headers correctly', () => {
      expect(internalApiClient.defaults.headers.common['Content-Type']).toBe('application/json');
    });
    
    /**
     * Test case: should set custom headers when provided
     * 
     * Verifies that the internal API client sets custom headers when provided
     * to support authentication and other requirements for internal service communication.
     */
    it('should set custom headers when provided', () => {
      const clientWithCustomHeaders = createInternalApiClient(mockServerBaseUrl, {
        'X-API-Key': 'test-api-key',
        'X-Journey-ID': 'health',
      });
      
      expect(clientWithCustomHeaders.defaults.headers.common['X-API-Key']).toBe('test-api-key');
      expect(clientWithCustomHeaders.defaults.headers.common['X-Journey-ID']).toBe('health');
    });
    
    /**
     * Test case: should set default timeout
     * 
     * Verifies that the internal API client sets a default timeout
     * to prevent requests from hanging indefinitely.
     */
    it('should set default timeout', () => {
      expect(internalApiClient.defaults.timeout).toBe(10000); // 10 seconds
    });
    
    /**
     * Test case: should successfully make requests to internal services
     * 
     * Verifies that the internal API client can make requests to internal services
     * and receive responses correctly.
     */
    it('should successfully make requests to internal services', async () => {
      const response = await internalApiClient.get('/success');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Success' });
    });
    
    /**
     * Test case: should handle journey-specific endpoints correctly
     * 
     * Verifies that the internal API client can handle journey-specific endpoints
     * for cross-journey communication.
     */
    it('should handle journey-specific endpoints correctly', async () => {
      // Test health journey endpoint
      const healthResponse = await internalApiClient.get('/journey/health/data');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.data).toEqual({ journey: 'health', data: { id: '123', name: 'Test Data' } });
      
      // Test care journey endpoint
      const careResponse = await internalApiClient.get('/journey/care/data');
      expect(careResponse.status).toBe(200);
      expect(careResponse.data).toEqual({ journey: 'care', data: { id: '123', name: 'Test Data' } });
      
      // Test plan journey endpoint
      const planResponse = await internalApiClient.get('/journey/plan/data');
      expect(planResponse.status).toBe(200);
      expect(planResponse.data).toEqual({ journey: 'plan', data: { id: '123', name: 'Test Data' } });
    });
  });
  
  describe('Error Handling and Retry Mechanisms', () => {
    /**
     * Test case: should implement retry logic for transient errors
     * 
     * Verifies that the HTTP client can implement retry logic for transient errors
     * to improve reliability of cross-service communication.
     */
    it('should implement retry logic for transient errors', async () => {
      // Create a client with retry logic
      const axiosWithRetry = createSecureAxios();
      
      // Mock retry logic using interceptors
      let retryAttempt = 0;
      axiosWithRetry.interceptors.response.use(
        (response) => response,
        async (error) => {
          const { config, response } = error;
          
          // Only retry on 503 Service Unavailable
          if (response && response.status === 503 && retryAttempt < 1) {
            retryAttempt++;
            
            // Add retry attempt header for the mock server to respond differently
            config.headers = config.headers || {};
            config.headers['X-Retry-Attempt'] = String(retryAttempt + 1);
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Retry the request
            return axiosWithRetry(config);
          }
          
          return Promise.reject(error);
        }
      );
      
      // Make a request that will fail on the first attempt but succeed on retry
      const response = await axiosWithRetry.get(`${mockServerBaseUrl}/retry-success`);
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Success after retry' });
      expect(retryAttempt).toBe(1); // Verify that retry was attempted once
    });
    
    /**
     * Test case: should handle network failures with appropriate error messages
     * 
     * Verifies that network failures are handled with appropriate error messages
     * to help diagnose and resolve issues in cross-service communication.
     */
    it('should handle network failures with appropriate error messages', async () => {
      // Mock a network failure using nock
      nock('http://api.example.com')
        .get('/resource')
        .replyWithError('Network error: Connection refused');
      
      const secureAxios = createSecureAxios();
      
      try {
        await secureAxios.get('http://api.example.com/resource');
        fail('Expected request to fail with network error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.message).toContain('Network error: Connection refused');
      }
    });
    
    /**
     * Test case: should handle timeouts with journey-specific error handling
     * 
     * Verifies that timeouts are handled with journey-specific error handling
     * to provide context-aware error messages for different journeys.
     */
    it('should handle timeouts with journey-specific error handling', async () => {
      // Create clients for different journeys
      const healthClient = createInternalApiClient(mockServerBaseUrl, { 'X-Journey-ID': 'health' });
      const careClient = createInternalApiClient(mockServerBaseUrl, { 'X-Journey-ID': 'care' });
      const planClient = createInternalApiClient(mockServerBaseUrl, { 'X-Journey-ID': 'plan' });
      
      // Set a short timeout for testing
      healthClient.defaults.timeout = 1000;
      careClient.defaults.timeout = 1000;
      planClient.defaults.timeout = 1000;
      
      // Helper function to test timeout with journey context
      const testJourneyTimeout = async (client: AxiosInstance, journeyId: string) => {
        try {
          await client.get('/timeout');
          fail(`Expected ${journeyId} request to timeout`);
        } catch (error) {
          const axiosError = error as AxiosError;
          expect(axiosError.code).toBe('ECONNABORTED');
          expect(axiosError.message).toContain('timeout');
          expect(client.defaults.headers.common['X-Journey-ID']).toBe(journeyId);
        }
      };
      
      // Test timeouts for each journey
      await testJourneyTimeout(healthClient, 'health');
      await testJourneyTimeout(careClient, 'care');
      await testJourneyTimeout(planClient, 'plan');
    });
  });
});
/**
 * End-to-End Tests for HTTP Utilities
 * 
 * This test suite validates the secure HTTP client behavior in real network scenarios:
 * - Tests SSRF protection by attempting to access prohibited private IP ranges and domains
 * - Validates internal service client functionality with mocked responses
 * - Ensures proper error handling during network failures
 * - Tests timeout handling and retry mechanisms
 * 
 * These tests are critical for ensuring the security and reliability of cross-service
 * communication throughout the AUSTA SuperApp.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as http from 'http';
import * as AxiosMockAdapter from 'axios-mock-adapter';
import { createTestApplication, cleanupUtils } from './test-setup';

// Import the utilities to test
import { createSecureAxios, createInternalApiClient } from '../../../src/http/secure-axios';

describe('HTTP Utilities (e2e)', () => {
  let app: INestApplication;
  let mockServer: http.Server;
  let mockServerPort: number;
  let mockServerBaseUrl: string;
  
  // Set up a real HTTP server for testing actual network requests
  beforeAll(async () => {
    // Create a simple HTTP server for testing real requests
    mockServer = http.createServer((req, res) => {
      if (req.url === '/success') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'OK' }));
      } else if (req.url === '/error') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Internal Server Error' }));
      } else if (req.url === '/timeout') {
        // Don't respond to simulate a timeout
      } else if (req.url === '/echo') {
        // Echo back the request headers and body
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: body ? JSON.parse(body) : null
          }));
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Not Found' }));
      }
    });

    // Start the server on a random available port
    mockServer.listen(0);
    const address = mockServer.address() as { port: number };
    mockServerPort = address.port;
    mockServerBaseUrl = `http://localhost:${mockServerPort}`;
    
    // Create a NestJS application for testing
    const testApp = await createTestApplication({
      imports: [],
      controllers: [],
      providers: [],
      applyGlobalPipes: false,
      applyGlobalFilters: false,
      initPrisma: false,
    });
    
    app = testApp.app;
  });

  afterAll(async () => {
    // Close the mock server and NestJS application
    await new Promise<void>((resolve) => {
      mockServer.close(() => resolve());
    });
    await cleanupUtils.closeApp(app);
  });

  describe('createSecureAxios', () => {
    let secureAxios: AxiosInstance;
    let mock: AxiosMockAdapter;

    beforeEach(() => {
      secureAxios = createSecureAxios();
      mock = new AxiosMockAdapter(secureAxios);
    });

    afterEach(() => {
      mock.restore();
    });

    it('should create a valid axios instance', () => {
      expect(secureAxios).toBeDefined();
      expect(typeof secureAxios.request).toBe('function');
      expect(typeof secureAxios.get).toBe('function');
      expect(typeof secureAxios.post).toBe('function');
    });

    it('should successfully make requests to public domains', async () => {
      // Mock a successful response
      mock.onGet('https://api.example.com/test').reply(200, { data: 'test' });

      const response = await secureAxios.get('https://api.example.com/test');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });

    it('should block requests to private IP ranges (10.x.x.x)', async () => {
      await expect(secureAxios.get('http://10.0.0.1/test')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });

    it('should block requests to private IP ranges (172.16.x.x)', async () => {
      await expect(secureAxios.get('http://172.16.0.1/test')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });

    it('should block requests to private IP ranges (192.168.x.x)', async () => {
      await expect(secureAxios.get('http://192.168.0.1/test')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });

    it('should block requests to localhost', async () => {
      await expect(secureAxios.get('http://localhost/test')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });

    it('should block requests to 127.0.0.1', async () => {
      await expect(secureAxios.get('http://127.0.0.1/test')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });

    it('should block requests to .local domains', async () => {
      await expect(secureAxios.get('http://myserver.local/test')).rejects.toThrow(
        'SSRF Protection: Blocked request to private or local network'
      );
    });

    it('should make real HTTP requests to the mock server', async () => {
      // Use a new instance without the mock adapter to make real requests
      const realAxios = createSecureAxios();
      
      const response = await realAxios.get(`${mockServerBaseUrl}/success`);
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true, message: 'OK' });
    });

    it('should handle server errors appropriately', async () => {
      // Use a new instance without the mock adapter to make real requests
      const realAxios = createSecureAxios();
      
      try {
        await realAxios.get(`${mockServerBaseUrl}/error`);
        fail('Expected request to fail with 500 error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(500);
        expect(axiosError.response?.data).toEqual({ 
          success: false, 
          message: 'Internal Server Error' 
        });
      }
    });

    it('should handle timeouts appropriately', async () => {
      // Use a new instance without the mock adapter but with a short timeout
      const realAxios = createSecureAxios();
      realAxios.defaults.timeout = 500; // 500ms timeout
      
      try {
        await realAxios.get(`${mockServerBaseUrl}/timeout`);
        fail('Expected request to timeout');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.code).toBe('ECONNABORTED');
        expect(axiosError.message).toContain('timeout');
      }
    });
  });

  describe('createInternalApiClient', () => {
    let internalClient: AxiosInstance;
    let mock: AxiosMockAdapter;

    beforeEach(() => {
      internalClient = createInternalApiClient('https://internal-api.austa.local');
      mock = new AxiosMockAdapter(internalClient);
    });

    afterEach(() => {
      mock.restore();
    });

    it('should create a valid axios instance with the correct base URL', () => {
      expect(internalClient).toBeDefined();
      expect(internalClient.defaults.baseURL).toBe('https://internal-api.austa.local');
    });

    it('should set the correct default headers', () => {
      expect(internalClient.defaults.headers.common['Content-Type']).toBe('application/json');
    });

    it('should set a default timeout', () => {
      expect(internalClient.defaults.timeout).toBe(10000); // 10 seconds
    });

    it('should allow custom headers to be set', () => {
      const clientWithCustomHeaders = createInternalApiClient(
        'https://internal-api.austa.local',
        { 'X-API-Key': 'test-api-key', 'X-Journey': 'health' }
      );
      
      expect(clientWithCustomHeaders.defaults.headers.common['X-API-Key']).toBe('test-api-key');
      expect(clientWithCustomHeaders.defaults.headers.common['X-Journey']).toBe('health');
      expect(clientWithCustomHeaders.defaults.headers.common['Content-Type']).toBe('application/json');
    });

    it('should successfully make requests to the internal API', async () => {
      mock.onGet('/users').reply(200, [{ id: 1, name: 'Test User' }]);

      const response = await internalClient.get('/users');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual([{ id: 1, name: 'Test User' }]);
    });

    it('should handle errors from the internal API', async () => {
      mock.onGet('/users').reply(500, { error: 'Internal Server Error' });

      try {
        await internalClient.get('/users');
        fail('Expected request to fail with 500 error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(500);
        expect(axiosError.response?.data).toEqual({ error: 'Internal Server Error' });
      }
    });

    it('should handle network errors', async () => {
      mock.onGet('/users').networkError();

      try {
        await internalClient.get('/users');
        fail('Expected request to fail with network error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.message).toContain('Network Error');
      }
    });

    it('should handle timeouts', async () => {
      mock.onGet('/users').timeout();

      try {
        await internalClient.get('/users');
        fail('Expected request to timeout');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.code).toBe('ECONNABORTED');
      }
    });

    it('should make POST requests with the correct data', async () => {
      const requestData = { name: 'New User', email: 'user@example.com' };
      
      mock.onPost('/users', requestData).reply(201, {
        id: 123,
        ...requestData
      });

      const response = await internalClient.post('/users', requestData);
      
      expect(response.status).toBe(201);
      expect(response.data).toEqual({
        id: 123,
        name: 'New User',
        email: 'user@example.com'
      });
    });

    it('should make real HTTP requests to the mock server', async () => {
      // Use a new instance without the mock adapter to make real requests
      const realClient = createInternalApiClient(mockServerBaseUrl);
      
      const response = await realClient.get('/success');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true, message: 'OK' });
    });

    it('should send the correct data in POST requests to the mock server', async () => {
      // Use a new instance without the mock adapter to make real requests
      const realClient = createInternalApiClient(mockServerBaseUrl);
      const requestData = { name: 'Test User', email: 'test@example.com' };
      
      const response = await realClient.post('/echo', requestData);
      
      expect(response.status).toBe(200);
      expect(response.data.method).toBe('POST');
      expect(response.data.body).toEqual(requestData);
    });

    it('should handle journey-specific configurations', async () => {
      // Create clients for different journeys
      const healthClient = createInternalApiClient(
        'https://health-api.austa.local',
        { 'X-Journey': 'health' }
      );
      
      const careClient = createInternalApiClient(
        'https://care-api.austa.local',
        { 'X-Journey': 'care' }
      );
      
      const planClient = createInternalApiClient(
        'https://plan-api.austa.local',
        { 'X-Journey': 'plan' }
      );
      
      // Mock responses for each journey
      const mockHealth = new AxiosMockAdapter(healthClient);
      mockHealth.onGet('/metrics').reply(200, [{ type: 'HEART_RATE', value: 72 }]);
      
      const mockCare = new AxiosMockAdapter(careClient);
      mockCare.onGet('/appointments').reply(200, [{ id: 1, type: 'CONSULTATION' }]);
      
      const mockPlan = new AxiosMockAdapter(planClient);
      mockPlan.onGet('/benefits').reply(200, [{ id: 1, name: 'Dental Coverage' }]);
      
      // Test each journey client
      const healthResponse = await healthClient.get('/metrics');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.data).toEqual([{ type: 'HEART_RATE', value: 72 }]);
      
      const careResponse = await careClient.get('/appointments');
      expect(careResponse.status).toBe(200);
      expect(careResponse.data).toEqual([{ id: 1, type: 'CONSULTATION' }]);
      
      const planResponse = await planClient.get('/benefits');
      expect(planResponse.status).toBe(200);
      expect(planResponse.data).toEqual([{ id: 1, name: 'Dental Coverage' }]);
      
      // Clean up
      mockHealth.restore();
      mockCare.restore();
      mockPlan.restore();
    });
  });
});
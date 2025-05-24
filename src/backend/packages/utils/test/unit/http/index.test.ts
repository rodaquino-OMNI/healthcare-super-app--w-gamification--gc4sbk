import { describe, expect, jest, test } from '@jest/globals';

// Mock the individual HTTP utility modules
jest.mock('../../../src/http/client', () => ({
  createHttpClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('../../../src/http/security', () => ({
  createSecureHttpClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('../../../src/http/internal', () => ({
  createInternalApiClient: jest.fn().mockImplementation((baseURL: string, headers = {}) => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      baseURL,
      headers: {
        common: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      timeout: 10000,
    },
  })),
}));

describe('HTTP Utilities Barrel File', () => {
  // Import the barrel file after mocking the individual modules
  // This ensures that the barrel file uses our mocked implementations
  const httpUtils = require('../../../src/http');

  test('should export createHttpClient function', () => {
    // Verify the function is exported
    expect(httpUtils.createHttpClient).toBeDefined();
    expect(typeof httpUtils.createHttpClient).toBe('function');

    // Verify the function works as expected
    const client = httpUtils.createHttpClient();
    expect(client).toBeDefined();
    expect(client.get).toBeDefined();
    expect(client.post).toBeDefined();
    expect(client.put).toBeDefined();
    expect(client.delete).toBeDefined();
  });

  test('should export createSecureHttpClient function', () => {
    // Verify the function is exported
    expect(httpUtils.createSecureHttpClient).toBeDefined();
    expect(typeof httpUtils.createSecureHttpClient).toBe('function');

    // Verify the function works as expected
    const client = httpUtils.createSecureHttpClient();
    expect(client).toBeDefined();
    expect(client.get).toBeDefined();
    expect(client.post).toBeDefined();
    expect(client.put).toBeDefined();
    expect(client.delete).toBeDefined();
  });

  test('should export createInternalApiClient function', () => {
    // Verify the function is exported
    expect(httpUtils.createInternalApiClient).toBeDefined();
    expect(typeof httpUtils.createInternalApiClient).toBe('function');

    // Verify the function works as expected with parameters
    const baseURL = 'https://api.example.com';
    const headers = { 'Authorization': 'Bearer token' };
    const client = httpUtils.createInternalApiClient(baseURL, headers);
    
    expect(client).toBeDefined();
    expect(client.get).toBeDefined();
    expect(client.post).toBeDefined();
    expect(client.put).toBeDefined();
    expect(client.delete).toBeDefined();
    
    // Verify the configuration is passed correctly
    expect(client.defaults.baseURL).toBe(baseURL);
    expect(client.defaults.headers.common['Content-Type']).toBe('application/json');
    expect(client.defaults.headers.common['Authorization']).toBe('Bearer token');
    expect(client.defaults.timeout).toBe(10000);
  });

  test('should support named imports for tree-shaking', () => {
    // Import the functions directly to verify named exports work
    const { createHttpClient, createSecureHttpClient, createInternalApiClient } = require('../../../src/http');
    
    expect(createHttpClient).toBeDefined();
    expect(createSecureHttpClient).toBeDefined();
    expect(createInternalApiClient).toBeDefined();
    
    // Verify they are the same functions as the ones exported from the module
    expect(createHttpClient).toBe(httpUtils.createHttpClient);
    expect(createSecureHttpClient).toBe(httpUtils.createSecureHttpClient);
    expect(createInternalApiClient).toBe(httpUtils.createInternalApiClient);
  });

  test('should not export any unexpected functions or properties', () => {
    // Get all exported keys
    const exportedKeys = Object.keys(httpUtils);
    
    // Verify only the expected functions are exported
    expect(exportedKeys).toHaveLength(3);
    expect(exportedKeys).toContain('createHttpClient');
    expect(exportedKeys).toContain('createSecureHttpClient');
    expect(exportedKeys).toContain('createInternalApiClient');
  });

  test('should preserve function parameter types', () => {
    // This test verifies that TypeScript types are preserved in the exports
    // We can't directly test types at runtime, but we can verify the function accepts parameters correctly
    
    // Should accept baseURL and headers
    expect(() => httpUtils.createInternalApiClient('https://api.example.com')).not.toThrow();
    expect(() => httpUtils.createInternalApiClient('https://api.example.com', { 'X-Custom': 'value' })).not.toThrow();
    
    // Should work without parameters
    expect(() => httpUtils.createHttpClient()).not.toThrow();
    expect(() => httpUtils.createSecureHttpClient()).not.toThrow();
  });
});
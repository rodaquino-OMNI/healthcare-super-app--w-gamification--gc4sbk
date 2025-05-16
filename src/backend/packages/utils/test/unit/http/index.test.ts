/**
 * @file index.test.ts
 * @description Unit tests for the HTTP utilities barrel file (index.ts) that exports all functions
 * from the specialized HTTP modules. These tests verify that all expected functions are correctly
 * exported with their proper types and interfaces.
 */

import * as HttpUtils from '../../../src/http';
import { createHttpClient } from '../../../src/http/client';
import { createSecureHttpClient } from '../../../src/http/security';
import { createInternalApiClient } from '../../../src/http/internal';
import defaultExport from '../../../src/http';

describe('HTTP Utilities Barrel File', () => {
  describe('Named Exports', () => {
    it('should export all client module functions and types', () => {
      // Client module exports
      expect(HttpUtils.createHttpClient).toBeDefined();
      expect(HttpUtils.createSimpleHttpClient).toBeDefined();
      expect(HttpUtils.HttpClientError).toBeDefined();
      expect(HttpUtils.HttpClientErrorType).toBeDefined();
      expect(HttpUtils.exponentialDelay).toBeDefined();
      expect(HttpUtils.linearDelay).toBeDefined();
      expect(HttpUtils.noDelay).toBeDefined();
    });

    it('should export all security module functions and types', () => {
      // Security module exports
      expect(HttpUtils.createSecureHttpClient).toBeDefined();
      expect(HttpUtils.validateUrlAgainstSSRF).toBeDefined();
      expect(HttpUtils.isRestrictedHostname).toBeDefined();
      expect(HttpUtils.isIPv4InCIDR).toBeDefined();
      expect(HttpUtils.isIPv6InCIDR).toBeDefined();
      expect(HttpUtils.createUrlValidator).toBeDefined();
      expect(HttpUtils.SSRFDetectionError).toBeDefined();
    });

    it('should export all internal module functions and types', () => {
      // Internal module exports
      expect(HttpUtils.createInternalApiClient).toBeDefined();
      expect(HttpUtils.createHealthJourneyClient).toBeDefined();
      expect(HttpUtils.createCareJourneyClient).toBeDefined();
      expect(HttpUtils.createPlanJourneyClient).toBeDefined();
      expect(HttpUtils.createGamificationClient).toBeDefined();
      expect(HttpUtils.createNotificationClient).toBeDefined();
      expect(HttpUtils.createAuthClient).toBeDefined();
      expect(HttpUtils.JourneyType).toBeDefined();
    });

    it('should export functions that are identical to their source module exports', () => {
      // Verify that the exports are the same functions, not copies
      expect(HttpUtils.createHttpClient).toBe(createHttpClient);
      expect(HttpUtils.createSecureHttpClient).toBe(createSecureHttpClient);
      expect(HttpUtils.createInternalApiClient).toBe(createInternalApiClient);
    });
  });

  describe('Default Export', () => {
    it('should export createHttpClient as the default export', () => {
      expect(defaultExport).toBeDefined();
      expect(defaultExport).toBe(createHttpClient);
      expect(defaultExport).toBe(HttpUtils.createHttpClient);
    });

    it('should allow the default export to be used as a function', () => {
      // This test verifies that the TypeScript types are correct
      // If this compiles, it means the default export is correctly typed as a function
      const client = defaultExport({ timeout: 5000 });
      expect(client).toBeDefined();
      expect(client.request).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should export HttpClientErrorType enum with correct values', () => {
      expect(HttpUtils.HttpClientErrorType.NETWORK).toBe('NETWORK');
      expect(HttpUtils.HttpClientErrorType.CLIENT).toBe('CLIENT');
      expect(HttpUtils.HttpClientErrorType.SERVER).toBe('SERVER');
      expect(HttpUtils.HttpClientErrorType.CANCELLED).toBe('CANCELLED');
      expect(HttpUtils.HttpClientErrorType.UNKNOWN).toBe('UNKNOWN');
    });

    it('should export JourneyType enum with correct values', () => {
      expect(HttpUtils.JourneyType.HEALTH).toBe('health');
      expect(HttpUtils.JourneyType.CARE).toBe('care');
      expect(HttpUtils.JourneyType.PLAN).toBe('plan');
      expect(HttpUtils.JourneyType.GAMIFICATION).toBe('gamification');
      expect(HttpUtils.JourneyType.NOTIFICATION).toBe('notification');
      expect(HttpUtils.JourneyType.AUTH).toBe('auth');
    });

    it('should export HttpClientError class with correct inheritance', () => {
      // Verify that HttpClientError extends Error
      expect(new HttpUtils.HttpClientError('test', new Error('test') as any)).toBeInstanceOf(Error);
    });

    it('should export SSRFDetectionError class with correct inheritance', () => {
      // Verify that SSRFDetectionError extends Error
      expect(new HttpUtils.SSRFDetectionError('test', 'http://example.com', 'test')).toBeInstanceOf(Error);
    });
  });

  describe('Documentation', () => {
    it('should preserve JSDoc comments in exported functions', () => {
      // This test verifies that the documentation is preserved in the exports
      // We can't directly test JSDoc comments, but we can check that the functions have a name and length
      expect(HttpUtils.createHttpClient.name).toBe('createHttpClient');
      expect(HttpUtils.createSecureHttpClient.name).toBe('createSecureHttpClient');
      expect(HttpUtils.createInternalApiClient.name).toBe('createInternalApiClient');
    });
  });

  describe('Module Resolution', () => {
    it('should support tree-shaking through named exports', () => {
      // This test verifies that the named exports are properly exported
      // If this compiles, it means the named exports are correctly typed
      const { createHttpClient, createSecureHttpClient, createInternalApiClient } = HttpUtils;
      
      expect(createHttpClient).toBeDefined();
      expect(createSecureHttpClient).toBeDefined();
      expect(createInternalApiClient).toBeDefined();
    });

    it('should support importing specific functions', () => {
      // This test verifies that specific functions can be imported
      // If this compiles, it means the specific imports are correctly typed
      const client = createHttpClient({ timeout: 5000 });
      const secureClient = createSecureHttpClient();
      const internalClient = createInternalApiClient({ baseURL: 'http://example.com' });
      
      expect(client).toBeDefined();
      expect(secureClient).toBeDefined();
      expect(internalClient).toBeDefined();
    });

    it('should support importing specific types', () => {
      // This test verifies that specific types can be imported
      // If this compiles, it means the specific type imports are correctly typed
      type RetryConfig = HttpUtils.RetryConfig;
      type SSRFProtectionOptions = HttpUtils.SSRFProtectionOptions;
      type InternalApiClientOptions = HttpUtils.InternalApiClientOptions;
      
      // Create objects that match the types to verify type compatibility
      const retryConfig: RetryConfig = {
        retries: 3,
        retryDelay: HttpUtils.exponentialDelay,
        httpMethodsToRetry: ['GET'],
        statusCodesToRetry: [[500, 599]],
        timeout: 5000,
        respectRetryAfter: true
      };
      
      const ssrfOptions: SSRFProtectionOptions = {
        blockPrivateIPs: true,
        blockLocalhost: true,
        blockLinkLocal: true,
        blockDotLocal: true,
        customBlockedRanges: [],
        allowedHosts: [],
        logViolations: true
      };
      
      const internalOptions: InternalApiClientOptions = {
        baseURL: 'http://example.com',
        headers: { 'X-Custom-Header': 'value' },
        timeout: 5000,
        journeyContext: {
          journeyType: HttpUtils.JourneyType.HEALTH
        }
      };
      
      expect(retryConfig).toBeDefined();
      expect(ssrfOptions).toBeDefined();
      expect(internalOptions).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with the original secure-axios implementation', () => {
      // This test verifies that the new implementation is compatible with the original
      // The original implementation exported createSecureAxios and createInternalApiClient
      // The new implementation should export equivalent functions
      
      // The original createSecureAxios is now createSecureHttpClient
      const secureClient = HttpUtils.createSecureHttpClient();
      expect(secureClient).toBeDefined();
      expect(secureClient.validateUrl).toBeDefined();
      
      // The original createInternalApiClient is still exported but with enhanced functionality
      const internalClient = HttpUtils.createInternalApiClient({ baseURL: 'http://example.com' });
      expect(internalClient).toBeDefined();
      expect(internalClient.defaults.baseURL).toBe('http://example.com');
    });
  });
});
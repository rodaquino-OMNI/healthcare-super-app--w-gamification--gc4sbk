/**
 * @file security.test.ts
 * @description Unit tests for the HTTP security utilities that implement SSRF protection
 */

import { URL } from 'url';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  createSecureHttpClient,
  validateUrlAgainstSSRF,
  isRestrictedHostname,
  isIPv4InCIDR,
  isIPv6InCIDR,
  SSRFDetectionError,
  SSRFProtectionOptions,
  createUrlValidator
} from '../../../src/http/security';

// Mock axios to prevent actual HTTP requests
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => ({
      interceptors: {
        request: {
          use: jest.fn((interceptor) => {
            mockAxios.interceptor = interceptor;
            return interceptor;
          })
        },
        response: {
          use: jest.fn()
        }
      },
      defaults: {}
    })),
    interceptor: null as any
  };
  return mockAxios;
});

describe('HTTP Security Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isIPv4InCIDR', () => {
    it('should correctly identify IPs within IPv4 CIDR ranges', () => {
      // Test private network ranges
      expect(isIPv4InCIDR('10.0.0.1', '10.0.0.0/8')).toBe(true);
      expect(isIPv4InCIDR('10.255.255.255', '10.0.0.0/8')).toBe(true);
      expect(isIPv4InCIDR('11.0.0.1', '10.0.0.0/8')).toBe(false);

      // Test class B private network
      expect(isIPv4InCIDR('172.16.0.1', '172.16.0.0/12')).toBe(true);
      expect(isIPv4InCIDR('172.31.255.255', '172.16.0.0/12')).toBe(true);
      expect(isIPv4InCIDR('172.32.0.1', '172.16.0.0/12')).toBe(false);

      // Test class C private network
      expect(isIPv4InCIDR('192.168.0.1', '192.168.0.0/16')).toBe(true);
      expect(isIPv4InCIDR('192.168.255.255', '192.168.0.0/16')).toBe(true);
      expect(isIPv4InCIDR('192.169.0.1', '192.168.0.0/16')).toBe(false);

      // Test localhost
      expect(isIPv4InCIDR('127.0.0.1', '127.0.0.0/8')).toBe(true);
      expect(isIPv4InCIDR('127.255.255.255', '127.0.0.0/8')).toBe(true);
      expect(isIPv4InCIDR('128.0.0.1', '127.0.0.0/8')).toBe(false);

      // Test specific subnet masks
      expect(isIPv4InCIDR('192.168.1.1', '192.168.1.0/24')).toBe(true);
      expect(isIPv4InCIDR('192.168.1.255', '192.168.1.0/24')).toBe(true);
      expect(isIPv4InCIDR('192.168.2.1', '192.168.1.0/24')).toBe(false);

      // Test edge cases
      expect(isIPv4InCIDR('0.0.0.0', '0.0.0.0/32')).toBe(true);
      expect(isIPv4InCIDR('255.255.255.255', '255.255.255.255/32')).toBe(true);
    });
  });

  describe('isIPv6InCIDR', () => {
    it('should correctly identify IPs within IPv6 CIDR ranges', () => {
      // Test localhost
      expect(isIPv6InCIDR('::1', '::1/128')).toBe(true);
      expect(isIPv6InCIDR('::2', '::1/128')).toBe(false);

      // Test link-local
      expect(isIPv6InCIDR('fe80::1', 'fe80::/10')).toBe(true);
      expect(isIPv6InCIDR('fe80::ffff:ffff:ffff:ffff', 'fe80::/10')).toBe(true);
      expect(isIPv6InCIDR('fec0::1', 'fe80::/10')).toBe(false);

      // Test unique local addresses
      expect(isIPv6InCIDR('fc00::1', 'fc00::/7')).toBe(true);
      expect(isIPv6InCIDR('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', 'fc00::/7')).toBe(true);
      expect(isIPv6InCIDR('fb00::1', 'fc00::/7')).toBe(false);

      // Test documentation prefix
      expect(isIPv6InCIDR('2001:db8::1', '2001:db8::/32')).toBe(true);
      expect(isIPv6InCIDR('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff', '2001:db8::/32')).toBe(true);
      expect(isIPv6InCIDR('2001:db9::1', '2001:db8::/32')).toBe(false);

      // Test with expanded notation
      expect(isIPv6InCIDR('2001:0db8:0000:0000:0000:0000:0000:0001', '2001:db8::/32')).toBe(true);

      // Test with compressed notation
      expect(isIPv6InCIDR('2001:db8::', '2001:db8::/32')).toBe(true);
    });

    it('should handle IPv6 addresses with different notations', () => {
      // Test with :: notation
      expect(isIPv6InCIDR('::1', '::1/128')).toBe(true);
      expect(isIPv6InCIDR('0:0:0:0:0:0:0:1', '::1/128')).toBe(true);

      // Test with :: in the middle
      expect(isIPv6InCIDR('2001:db8::1:0:0:1', '2001:db8::/32')).toBe(true);
      expect(isIPv6InCIDR('2001:db8:0:0:1:0:0:1', '2001:db8::/32')).toBe(true);
    });
  });

  describe('isRestrictedHostname', () => {
    it('should identify localhost as restricted', () => {
      expect(isRestrictedHostname('localhost')).toBe(true);
      expect(isRestrictedHostname('LOCALHOST')).toBe(false); // Case sensitive
      expect(isRestrictedHostname('localhost.example.com')).toBe(false); // Not exact match
    });

    it('should identify IPv6 localhost as restricted', () => {
      expect(isRestrictedHostname('::1')).toBe(true);
      expect(isRestrictedHostname('0:0:0:0:0:0:0:1')).toBe(true);
    });

    it('should identify .local domains as restricted', () => {
      expect(isRestrictedHostname('example.local')).toBe(true);
      expect(isRestrictedHostname('sub.example.local')).toBe(true);
      expect(isRestrictedHostname('example.localhost')).toBe(false); // Not .local
    });

    it('should identify private IPv4 addresses as restricted', () => {
      // Class A private network
      expect(isRestrictedHostname('10.0.0.1')).toBe(true);
      expect(isRestrictedHostname('10.255.255.255')).toBe(true);

      // Class B private network
      expect(isRestrictedHostname('172.16.0.1')).toBe(true);
      expect(isRestrictedHostname('172.31.255.255')).toBe(true);
      expect(isRestrictedHostname('172.32.0.1')).toBe(false); // Outside range
      expect(isRestrictedHostname('172.15.0.1')).toBe(false); // Outside range

      // Class C private network
      expect(isRestrictedHostname('192.168.0.1')).toBe(true);
      expect(isRestrictedHostname('192.168.255.255')).toBe(true);

      // Localhost
      expect(isRestrictedHostname('127.0.0.1')).toBe(true);
      expect(isRestrictedHostname('127.255.255.255')).toBe(true);
    });

    it('should identify private IPv6 addresses as restricted', () => {
      // Loopback
      expect(isRestrictedHostname('::1')).toBe(true);

      // Link-local
      expect(isRestrictedHostname('fe80::1')).toBe(true);
      expect(isRestrictedHostname('fe80::dead:beef')).toBe(true);

      // Unique local
      expect(isRestrictedHostname('fc00::1')).toBe(true);
      expect(isRestrictedHostname('fd00::1')).toBe(true);
    });

    it('should allow public hostnames and IPs', () => {
      expect(isRestrictedHostname('example.com')).toBe(false);
      expect(isRestrictedHostname('www.google.com')).toBe(false);
      expect(isRestrictedHostname('8.8.8.8')).toBe(false); // Google DNS
      expect(isRestrictedHostname('2001:4860:4860::8888')).toBe(false); // Google DNS IPv6
    });

    it('should respect allowedHosts option', () => {
      const options: SSRFProtectionOptions = {
        allowedHosts: ['localhost', '127.0.0.1', '192.168.1.1']
      };

      expect(isRestrictedHostname('localhost', options)).toBe(false);
      expect(isRestrictedHostname('127.0.0.1', options)).toBe(false);
      expect(isRestrictedHostname('192.168.1.1', options)).toBe(false);
      expect(isRestrictedHostname('192.168.1.2', options)).toBe(true); // Not in allowed list
    });

    it('should respect customBlockedRanges option', () => {
      const options: SSRFProtectionOptions = {
        customBlockedRanges: ['8.8.8.0/24', '2001:4860:4860::/48']
      };

      expect(isRestrictedHostname('8.8.8.8', options)).toBe(true);
      expect(isRestrictedHostname('8.8.8.254', options)).toBe(true);
      expect(isRestrictedHostname('8.8.9.1', options)).toBe(false); // Outside custom range
      expect(isRestrictedHostname('2001:4860:4860::8888', options)).toBe(true);
      expect(isRestrictedHostname('2001:4860:4861::8888', options)).toBe(false); // Outside custom range
    });

    it('should respect blockPrivateIPs option', () => {
      const options: SSRFProtectionOptions = {
        blockPrivateIPs: false
      };

      expect(isRestrictedHostname('10.0.0.1', options)).toBe(false);
      expect(isRestrictedHostname('172.16.0.1', options)).toBe(false);
      expect(isRestrictedHostname('192.168.0.1', options)).toBe(false);
      expect(isRestrictedHostname('127.0.0.1', options)).toBe(false);
      expect(isRestrictedHostname('fe80::1', options)).toBe(false);
    });

    it('should respect blockLocalhost option', () => {
      const options: SSRFProtectionOptions = {
        blockLocalhost: false
      };

      expect(isRestrictedHostname('localhost', options)).toBe(false);
      expect(isRestrictedHostname('::1', options)).toBe(false);
      expect(isRestrictedHostname('127.0.0.1', options)).toBe(true); // Still blocked by blockPrivateIPs
    });

    it('should respect blockDotLocal option', () => {
      const options: SSRFProtectionOptions = {
        blockDotLocal: false
      };

      expect(isRestrictedHostname('example.local', options)).toBe(false);
      expect(isRestrictedHostname('sub.example.local', options)).toBe(false);
    });
  });

  describe('validateUrlAgainstSSRF', () => {
    it('should throw SSRFDetectionError for restricted URLs', () => {
      expect(() => validateUrlAgainstSSRF('http://localhost/api')).toThrow(SSRFDetectionError);
      expect(() => validateUrlAgainstSSRF('http://127.0.0.1/api')).toThrow(SSRFDetectionError);
      expect(() => validateUrlAgainstSSRF('http://example.local/api')).toThrow(SSRFDetectionError);
      expect(() => validateUrlAgainstSSRF('http://10.0.0.1/api')).toThrow(SSRFDetectionError);
      expect(() => validateUrlAgainstSSRF('http://[::1]/api')).toThrow(SSRFDetectionError);
    });

    it('should not throw for public URLs', () => {
      expect(() => validateUrlAgainstSSRF('https://example.com/api')).not.toThrow();
      expect(() => validateUrlAgainstSSRF('https://www.google.com/api')).not.toThrow();
      expect(() => validateUrlAgainstSSRF('https://8.8.8.8/api')).not.toThrow();
      expect(() => validateUrlAgainstSSRF('https://[2001:4860:4860::8888]/api')).not.toThrow();
    });

    it('should handle relative URLs with baseUrl', () => {
      expect(() => validateUrlAgainstSSRF('/api', 'https://example.com')).not.toThrow();
      expect(() => validateUrlAgainstSSRF('/api', 'http://localhost')).toThrow(SSRFDetectionError);
    });

    it('should throw for invalid URLs', () => {
      expect(() => validateUrlAgainstSSRF('not-a-valid-url')).toThrow('Invalid URL');
    });

    it('should respect custom options', () => {
      const options: SSRFProtectionOptions = {
        allowedHosts: ['localhost'],
        customBlockedRanges: ['8.8.8.0/24']
      };

      expect(() => validateUrlAgainstSSRF('http://localhost/api', undefined, options)).not.toThrow();
      expect(() => validateUrlAgainstSSRF('http://8.8.8.8/api', undefined, options)).toThrow(SSRFDetectionError);
    });

    it('should include violation type in the error', () => {
      try {
        validateUrlAgainstSSRF('http://localhost/api');
        fail('Expected SSRFDetectionError to be thrown');
      } catch (error) {
        if (error instanceof SSRFDetectionError) {
          expect(error.violationType).toBe('localhost');
          expect(error.url).toBe('http://localhost/api');
        } else {
          fail('Expected error to be instance of SSRFDetectionError');
        }
      }

      try {
        validateUrlAgainstSSRF('http://example.local/api');
        fail('Expected SSRFDetectionError to be thrown');
      } catch (error) {
        if (error instanceof SSRFDetectionError) {
          expect(error.violationType).toBe('local-domain');
          expect(error.url).toBe('http://example.local/api');
        } else {
          fail('Expected error to be instance of SSRFDetectionError');
        }
      }

      try {
        validateUrlAgainstSSRF('http://10.0.0.1/api');
        fail('Expected SSRFDetectionError to be thrown');
      } catch (error) {
        if (error instanceof SSRFDetectionError) {
          expect(error.violationType).toBe('private-ip');
          expect(error.url).toBe('http://10.0.0.1/api');
        } else {
          fail('Expected error to be instance of SSRFDetectionError');
        }
      }
    });
  });

  describe('createUrlValidator', () => {
    it('should create a validator function that validates URLs', () => {
      const validator = createUrlValidator();

      expect(() => validator('http://localhost/api')).toThrow(SSRFDetectionError);
      expect(() => validator('https://example.com/api')).not.toThrow();
    });

    it('should respect custom options', () => {
      const validator = createUrlValidator({
        allowedHosts: ['localhost'],
        customBlockedRanges: ['8.8.8.0/24']
      });

      expect(() => validator('http://localhost/api')).not.toThrow();
      expect(() => validator('http://8.8.8.8/api')).toThrow(SSRFDetectionError);
    });
  });

  describe('createSecureHttpClient', () => {
    it('should create a client with security utilities', () => {
      const client = createSecureHttpClient();

      expect(client).toHaveProperty('validateUrl');
      expect(client).toHaveProperty('isRestrictedHost');
      expect(client).toHaveProperty('options');

      expect(typeof client.validateUrl).toBe('function');
      expect(typeof client.isRestrictedHost).toBe('function');
      expect(client.options).toEqual(expect.objectContaining({
        blockPrivateIPs: true,
        blockLocalhost: true,
        blockLinkLocal: true,
        blockDotLocal: true
      }));
    });

    it('should merge custom options with defaults', () => {
      const client = createSecureHttpClient({
        blockPrivateIPs: false,
        allowedHosts: ['localhost']
      });

      expect(client.options).toEqual(expect.objectContaining({
        blockPrivateIPs: false,
        blockLocalhost: true,
        blockLinkLocal: true,
        blockDotLocal: true,
        allowedHosts: ['localhost']
      }));
    });

    it('should validate URLs using the client', () => {
      const client = createSecureHttpClient();

      expect(() => client.validateUrl('http://localhost/api')).toThrow(SSRFDetectionError);
      expect(() => client.validateUrl('https://example.com/api')).not.toThrow();
    });

    it('should check if hostnames are restricted', () => {
      const client = createSecureHttpClient();

      expect(client.isRestrictedHost('localhost')).toBe(true);
      expect(client.isRestrictedHost('example.com')).toBe(false);
    });

    it('should respect custom options when validating', () => {
      const client = createSecureHttpClient({
        allowedHosts: ['localhost'],
        customBlockedRanges: ['8.8.8.0/24']
      });

      expect(() => client.validateUrl('http://localhost/api')).not.toThrow();
      expect(() => client.validateUrl('http://8.8.8.8/api')).toThrow(SSRFDetectionError);
      expect(client.isRestrictedHost('localhost')).toBe(false);
      expect(client.isRestrictedHost('8.8.8.8')).toBe(true);
    });
  });

  describe('Environment-specific configurations', () => {
    // Save original environment
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment before each test
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      // Restore original environment after all tests
      process.env = originalEnv;
    });

    it('should allow configuring security options via environment variables', () => {
      // This test demonstrates how security options could be configured via environment variables
      // in a real application. The actual implementation would need to be added to the security.ts file.
      process.env.SSRF_BLOCK_PRIVATE_IPS = 'false';
      process.env.SSRF_ALLOWED_HOSTS = 'localhost,127.0.0.1';

      // Example of how environment variables could be used to configure security options
      const options: SSRFProtectionOptions = {
        blockPrivateIPs: process.env.SSRF_BLOCK_PRIVATE_IPS !== 'false',
        allowedHosts: process.env.SSRF_ALLOWED_HOSTS?.split(',') || []
      };

      const client = createSecureHttpClient(options);

      expect(client.options.blockPrivateIPs).toBe(false);
      expect(client.options.allowedHosts).toEqual(['localhost', '127.0.0.1']);
      expect(client.isRestrictedHost('localhost')).toBe(false);
      expect(client.isRestrictedHost('10.0.0.1')).toBe(false); // Not blocked because blockPrivateIPs is false
    });

    it('should support different configurations for different environments', () => {
      // Development environment might allow localhost
      process.env.NODE_ENV = 'development';
      process.env.SSRF_ALLOWED_HOSTS = 'localhost,127.0.0.1';

      const devOptions: SSRFProtectionOptions = {
        allowedHosts: process.env.SSRF_ALLOWED_HOSTS?.split(',') || []
      };

      const devClient = createSecureHttpClient(devOptions);
      expect(devClient.isRestrictedHost('localhost')).toBe(false);

      // Production environment should be more restrictive
      process.env.NODE_ENV = 'production';
      process.env.SSRF_ALLOWED_HOSTS = '';

      const prodOptions: SSRFProtectionOptions = {
        allowedHosts: process.env.SSRF_ALLOWED_HOSTS?.split(',').filter(Boolean) || []
      };

      const prodClient = createSecureHttpClient(prodOptions);
      expect(prodClient.isRestrictedHost('localhost')).toBe(true);
    });
  });
});
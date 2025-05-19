import { describe, it, expect, jest, beforeEach, afterEach } from 'jest';
import axios from 'axios';
import { createSecureAxios } from '@austa/errors/utils/secure-http';
import { SecurityError } from '@austa/errors/categories/security.errors';

// Mock axios to prevent actual HTTP requests during tests
jest.mock('axios', () => {
  const originalAxios = jest.requireActual('axios');
  return {
    ...originalAxios,
    create: jest.fn().mockReturnValue({
      interceptors: {
        request: {
          use: jest.fn((interceptor) => {
            // Store the interceptor for testing
            mockedInterceptor = interceptor;
            return { interceptor };
          }),
        },
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
    }),
  };
});

// Store the request interceptor for testing
let mockedInterceptor: any;

describe('Secure HTTP Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createSecureAxios', () => {
    it('should create an axios instance with interceptors', () => {
      const instance = createSecureAxios();
      expect(axios.create).toHaveBeenCalled();
      expect(instance.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('SSRF Protection', () => {
    let instance: any;

    beforeEach(() => {
      instance = createSecureAxios();
    });

    it('should block requests to localhost', () => {
      const config = { url: 'http://localhost/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to 127.0.0.1', () => {
      const config = { url: 'http://127.0.0.1/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to IPv6 localhost (::1)', () => {
      const config = { url: 'http://[::1]/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to .local domains', () => {
      const config = { url: 'http://server.local/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to private IPv4 ranges (10.x.x.x)', () => {
      const config = { url: 'http://10.0.0.1/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to private IPv4 ranges (172.16.x.x - 172.31.x.x)', () => {
      const config = { url: 'http://172.16.0.1/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to private IPv4 ranges (192.168.x.x)', () => {
      const config = { url: 'http://192.168.0.1/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to 0.0.0.0', () => {
      const config = { url: 'http://0.0.0.0/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to IPv6 link-local addresses (fe80::)', () => {
      const config = { url: 'http://[fe80::1]/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to AWS metadata service (169.254.169.254)', () => {
      const config = { url: 'http://169.254.169.254/latest/meta-data/' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to Azure metadata service (169.254.169.254)', () => {
      const config = { url: 'http://169.254.169.254/metadata/instance' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests to GCP metadata service (metadata.google.internal)', () => {
      const config = { url: 'http://metadata.google.internal/computeMetadata/v1/' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests with IP address obfuscation techniques (decimal notation)', () => {
      const config = { url: 'http://2130706433/api' }; // Decimal for 127.0.0.1
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests with IP address obfuscation techniques (hex notation)', () => {
      const config = { url: 'http://0x7f000001/api' }; // Hex for 127.0.0.1
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should block requests with IP address obfuscation techniques (octal notation)', () => {
      const config = { url: 'http://0177.0.0.1/api' }; // Octal for 127.0.0.1
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should allow requests to public domains', () => {
      const config = { url: 'https://example.com/api' };
      
      expect(() => {
        mockedInterceptor(config);
      }).not.toThrow();
    });

    it('should allow requests to public IP addresses', () => {
      const config = { url: 'https://203.0.113.1/api' }; // TEST-NET-3 block for documentation
      
      expect(() => {
        mockedInterceptor(config);
      }).not.toThrow();
    });

    it('should handle URLs with baseURL correctly', () => {
      const config = { url: '/api', baseURL: 'https://example.com' };
      
      expect(() => {
        mockedInterceptor(config);
      }).not.toThrow();
    });

    it('should handle URLs with baseURL correctly and block if baseURL is restricted', () => {
      const config = { url: '/api', baseURL: 'http://localhost' };
      
      expect(() => {
        mockedInterceptor(config);
      }).toThrow(SecurityError);
    });

    it('should throw a specific SecurityError with appropriate message', () => {
      const config = { url: 'http://localhost/api' };
      
      try {
        mockedInterceptor(config);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(SecurityError);
        expect(error.message).toContain('SSRF Protection');
        expect(error.code).toBeDefined();
        expect(error.httpStatus).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error information for security violations', () => {
      const config = { url: 'http://localhost/api' };
      
      try {
        mockedInterceptor(config);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(SecurityError);
        expect(error.details).toBeDefined();
        expect(error.details.url).toBe('http://localhost/api');
        expect(error.details.blockedHost).toBe('localhost');
        expect(error.details.reason).toBeDefined();
      }
    });

    it('should include the original request in the error details', () => {
      const config = { 
        url: 'http://localhost/api',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { test: 'data' }
      };
      
      try {
        mockedInterceptor(config);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(SecurityError);
        expect(error.details).toBeDefined();
        expect(error.details.request).toBeDefined();
        expect(error.details.request.method).toBe('POST');
        expect(error.details.request.headers).toEqual({ 'Content-Type': 'application/json' });
      }
    });
  });
});
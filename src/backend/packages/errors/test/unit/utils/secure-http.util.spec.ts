import { Test } from '@nestjs/testing';
import axios from 'axios';
import { createSecureAxios } from '../../../../../shared/utils/secure-axios';
import { ExternalError } from '../../../src/categories/external.errors';

// Mock axios to prevent actual HTTP requests during tests
jest.mock('axios', () => {
  const originalModule = jest.requireActual('axios');
  return {
    ...originalModule,
    create: jest.fn(() => ({
      interceptors: {
        request: {
          use: jest.fn((interceptor) => {
            // Store the interceptor for testing
            (axios as any).mockInterceptor = interceptor;
            return { mockInterceptorId: 'request-interceptor' };
          }),
        },
        response: {
          use: jest.fn(() => ({ mockInterceptorId: 'response-interceptor' })),
        },
      },
    })),
  };
});

describe('Secure HTTP Utility', () => {
  let secureAxios: ReturnType<typeof createSecureAxios>;
  let requestInterceptor: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a secure axios instance
    secureAxios = createSecureAxios();
    
    // Get the request interceptor for testing
    requestInterceptor = (axios as any).mockInterceptor;
  });

  describe('SSRF Protection', () => {
    it('should block requests to private IPv4 ranges (10.x.x.x)', () => {
      const config = { url: 'http://10.0.0.1/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });

    it('should block requests to private IPv4 ranges (172.16-31.x.x)', () => {
      const config = { url: 'http://172.16.0.1/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');

      const config2 = { url: 'http://172.31.255.255/api/data' };
      
      expect(() => {
        requestInterceptor(config2);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });

    it('should block requests to private IPv4 ranges (192.168.x.x)', () => {
      const config = { url: 'http://192.168.1.1/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });

    it('should block requests to localhost (127.x.x.x)', () => {
      const config = { url: 'http://127.0.0.1/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');

      const config2 = { url: 'http://127.255.255.255/api/data' };
      
      expect(() => {
        requestInterceptor(config2);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });

    it('should block requests to 0.0.0.0', () => {
      const config = { url: 'http://0.0.0.0/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });

    it('should block requests to localhost hostname', () => {
      const config = { url: 'http://localhost/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');

      const config2 = { url: 'http://localhost:8080/api/data' };
      
      expect(() => {
        requestInterceptor(config2);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });

    it('should block requests to IPv6 loopback address (::1)', () => {
      const config = { url: 'http://[::1]/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });

    it('should block requests to IPv6 link-local addresses (fe80::)', () => {
      const config = { url: 'http://[fe80::1]/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });

    it('should block requests to .local domains', () => {
      const config = { url: 'http://myservice.local/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');

      const config2 = { url: 'http://printer.local:631/api/data' };
      
      expect(() => {
        requestInterceptor(config2);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });

    it('should allow requests to public domains', () => {
      const config = { url: 'https://api.example.com/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).not.toThrow();

      const config2 = { url: 'https://subdomain.example.org/api/v1/data' };
      
      expect(() => {
        requestInterceptor(config2);
      }).not.toThrow();
    });

    it('should allow requests to public IP addresses', () => {
      const config = { url: 'https://203.0.113.1/api/data' }; // TEST-NET-3 block for documentation
      
      expect(() => {
        requestInterceptor(config);
      }).not.toThrow();
    });

    it('should handle URLs with baseURL correctly', () => {
      const config = { 
        url: '/api/data', 
        baseURL: 'https://api.example.com'
      };
      
      expect(() => {
        requestInterceptor(config);
      }).not.toThrow();

      const configWithPrivateBase = { 
        url: '/api/data', 
        baseURL: 'http://192.168.1.1'
      };
      
      expect(() => {
        requestInterceptor(configWithPrivateBase);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
    });
  });

  describe('Error Handling', () => {
    it('should throw an appropriate error type for security violations', () => {
      // This test would be more meaningful if the secure-axios utility used the error framework
      // For now, we just verify it throws an Error with the expected message
      const config = { url: 'http://10.0.0.1/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow('SSRF Protection: Blocked request to private or local network');
      
      // In a future implementation, we might expect a specific error type:
      // expect(() => {
      //   requestInterceptor(config);
      // }).toThrow(SecurityViolationError);
    });

    it('should provide context about the blocked URL in the error', () => {
      const config = { url: 'http://internal-service.local/api/data' };
      
      try {
        requestInterceptor(config);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toContain('SSRF Protection');
        // In a future implementation, we might expect more context:
        // expect(error.details).toEqual({
        //   blockedUrl: 'http://internal-service.local/api/data',
        //   reason: 'local_domain'
        // });
      }
    });
  });

  describe('Configuration', () => {
    it('should create an axios instance with interceptors', () => {
      expect(axios.create).toHaveBeenCalled();
      expect(secureAxios.interceptors.request.use).toHaveBeenCalled();
    });
  });
});
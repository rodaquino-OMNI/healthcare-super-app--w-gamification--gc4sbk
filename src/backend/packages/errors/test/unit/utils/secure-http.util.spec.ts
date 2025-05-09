import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createSecureAxios } from '@austa/utils/http';
import { InvalidParameterError } from '../../../src/categories/validation.errors';

// Mock axios to prevent actual HTTP requests during tests
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxiosInstance),
    interceptors: {
      request: {
        use: jest.fn()
      }
    }
  };

  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: jest.fn((interceptor) => {
          // Store the interceptor function for testing
          mockAxiosInstance.interceptors.request.interceptor = interceptor;
          return { eject: jest.fn() };
        }),
        interceptor: null,
        eject: jest.fn()
      }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };

  return mockAxios;
});

describe('Secure HTTP Utility', () => {
  let secureAxios: AxiosInstance;
  let requestInterceptor: (config: AxiosRequestConfig) => AxiosRequestConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    secureAxios = createSecureAxios();
    // Get the request interceptor function that was registered
    requestInterceptor = (axios.create() as any).interceptors.request.interceptor;
    expect(requestInterceptor).toBeDefined();
  });

  describe('SSRF Protection', () => {
    it('should create an axios instance with request interceptors', () => {
      expect(axios.create).toHaveBeenCalled();
      expect((axios.create() as any).interceptors.request.use).toHaveBeenCalled();
    });

    it('should block requests to private IPv4 addresses (10.x.x.x)', () => {
      const config = { url: 'http://10.0.0.1/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow(InvalidParameterError);

      expect(() => {
        requestInterceptor(config);
      }).toThrow(/SSRF Protection: Blocked request to private network/);
    });

    it('should block requests to private IPv4 addresses (172.16.x.x - 172.31.x.x)', () => {
      const testCases = [
        'http://172.16.0.1/api/data',
        'http://172.20.0.1/api/data',
        'http://172.31.255.255/api/data'
      ];

      testCases.forEach(url => {
        const config = { url };
        
        expect(() => {
          requestInterceptor(config);
        }).toThrow(InvalidParameterError);
      });
    });

    it('should block requests to private IPv4 addresses (192.168.x.x)', () => {
      const config = { url: 'http://192.168.1.1/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow(InvalidParameterError);
    });

    it('should block requests to localhost using IP address', () => {
      const testCases = [
        'http://127.0.0.1/api/data',
        'http://127.0.0.1:8080/api/data',
        'https://127.0.0.1/api/data'
      ];

      testCases.forEach(url => {
        const config = { url };
        
        expect(() => {
          requestInterceptor(config);
        }).toThrow(InvalidParameterError);
      });
    });

    it('should block requests to 0.0.0.0', () => {
      const config = { url: 'http://0.0.0.0/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow(InvalidParameterError);
    });

    it('should block requests to localhost hostname', () => {
      const testCases = [
        'http://localhost/api/data',
        'http://localhost:8080/api/data',
        'https://localhost/api/data'
      ];

      testCases.forEach(url => {
        const config = { url };
        
        expect(() => {
          requestInterceptor(config);
        }).toThrow(InvalidParameterError);
      });
    });

    it('should block requests to IPv6 localhost (::1)', () => {
      const config = { url: 'http://[::1]/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow(InvalidParameterError);
    });

    it('should block requests to IPv6 link-local addresses (fe80::)', () => {
      const config = { url: 'http://[fe80::1]/api/data' };
      
      expect(() => {
        requestInterceptor(config);
      }).toThrow(InvalidParameterError);
    });

    it('should block requests to .local domains', () => {
      const testCases = [
        'http://myservice.local/api/data',
        'http://printer.local/api/data',
        'https://router.local/api/data'
      ];

      testCases.forEach(url => {
        const config = { url };
        
        expect(() => {
          requestInterceptor(config);
        }).toThrow(InvalidParameterError);
      });
    });

    it('should allow requests to public domains', () => {
      const testCases = [
        'https://api.example.com/data',
        'https://www.google.com',
        'https://api.github.com/users'
      ];

      testCases.forEach(url => {
        const config = { url };
        
        expect(() => {
          requestInterceptor(config);
        }).not.toThrow();
      });
    });

    it('should handle URLs with baseURL correctly', () => {
      // Should block when combined URL points to private network
      const config1 = { 
        url: '/api/data', 
        baseURL: 'http://192.168.1.1' 
      };
      
      expect(() => {
        requestInterceptor(config1);
      }).toThrow(InvalidParameterError);

      // Should allow when combined URL points to public domain
      const config2 = { 
        url: '/api/data', 
        baseURL: 'https://api.example.com' 
      };
      
      expect(() => {
        requestInterceptor(config2);
      }).not.toThrow();
    });

    it('should provide detailed error information when blocking requests', () => {
      const config = { url: 'http://10.0.0.1/api/data' };
      
      try {
        requestInterceptor(config);
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidParameterError);
        expect(error.field).toBe('url');
        expect(error.value).toBe('http://10.0.0.1/api/data');
        expect(error.code).toContain('VALIDATION');
        expect(error.message).toContain('SSRF Protection');
      }
    });

    it('should handle URLs with different protocols', () => {
      // Should block localhost regardless of protocol
      const testCases = [
        'http://localhost/api/data',
        'https://localhost/api/data',
        'ftp://localhost/api/data'
      ];

      testCases.forEach(url => {
        const config = { url };
        
        expect(() => {
          requestInterceptor(config);
        }).toThrow(InvalidParameterError);
      });
    });
  });
});
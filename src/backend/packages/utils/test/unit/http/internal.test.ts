import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { createInternalApiClient, JourneyType, InternalApiClientOptions } from '../../../src/http/internal';

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      defaults: {
        baseURL: '',
        headers: {
          common: {}
        },
        timeout: 0
      },
      interceptors: {
        request: {
          use: jest.fn()
        },
        response: {
          use: jest.fn()
        }
      }
    })),
    isAxiosError: jest.fn((error) => error && error.isAxiosError)
  };
});

describe('internal HTTP client', () => {
  let mockAxiosInstance: AxiosInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = axios.create();
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
  });

  describe('createInternalApiClient', () => {
    it('should create an axios instance with the provided baseURL', () => {
      const baseURL = 'https://api.internal.austa.health';
      const client = createInternalApiClient(baseURL);
      
      expect(axios.create).toHaveBeenCalled();
      expect(client.defaults.baseURL).toBe(baseURL);
    });

    it('should set default headers for internal API communication', () => {
      const client = createInternalApiClient('https://api.internal.austa.health');
      
      expect(client.defaults.headers.common['Content-Type']).toBe('application/json');
      expect(client.defaults.headers.common['X-Internal-Request']).toBe('true');
    });

    it('should merge custom headers with default headers', () => {
      const customHeaders = {
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'custom-value'
      };
      
      const client = createInternalApiClient('https://api.internal.austa.health', { headers: customHeaders });
      
      expect(client.defaults.headers.common['Content-Type']).toBe('application/json');
      expect(client.defaults.headers.common['X-Internal-Request']).toBe('true');
      expect(client.defaults.headers.common['Authorization']).toBe('Bearer token123');
      expect(client.defaults.headers.common['X-Custom-Header']).toBe('custom-value');
    });

    it('should set default timeout for internal API requests', () => {
      const client = createInternalApiClient('https://api.internal.austa.health');
      
      expect(client.defaults.timeout).toBe(10000); // 10 seconds default timeout
    });

    it('should allow custom timeout configuration', () => {
      const customTimeout = 5000;
      const client = createInternalApiClient('https://api.internal.austa.health', { timeout: customTimeout });
      
      expect(client.defaults.timeout).toBe(customTimeout);
    });

    it('should configure journey-specific headers when journey type is provided', () => {
      const client = createInternalApiClient('https://api.internal.austa.health', { 
        journeyType: JourneyType.HEALTH 
      });
      
      expect(client.defaults.headers.common['X-Journey-Type']).toBe('health');
    });

    it('should configure journey-specific headers for CARE journey', () => {
      const client = createInternalApiClient('https://api.internal.austa.health', { 
        journeyType: JourneyType.CARE 
      });
      
      expect(client.defaults.headers.common['X-Journey-Type']).toBe('care');
    });

    it('should configure journey-specific headers for PLAN journey', () => {
      const client = createInternalApiClient('https://api.internal.austa.health', { 
        journeyType: JourneyType.PLAN 
      });
      
      expect(client.defaults.headers.common['X-Journey-Type']).toBe('plan');
    });

    it('should not set journey header when no journey type is provided', () => {
      const client = createInternalApiClient('https://api.internal.austa.health');
      
      expect(client.defaults.headers.common['X-Journey-Type']).toBeUndefined();
    });
  });

  describe('retry mechanism', () => {
    let requestInterceptorFn: any;
    let responseErrorInterceptorFn: any;
    
    beforeEach(() => {
      // Capture the interceptor functions when they're registered
      (mockAxiosInstance.interceptors.request.use as jest.Mock).mockImplementation((fn) => {
        requestInterceptorFn = fn;
        return 0;
      });
      
      (mockAxiosInstance.interceptors.response.use as jest.Mock).mockImplementation((successFn, errorFn) => {
        responseErrorInterceptorFn = errorFn;
        return 0;
      });
      
      createInternalApiClient('https://api.internal.austa.health', { 
        retry: { 
          maxRetries: 3,
          retryDelay: 100,
          statusCodesToRetry: [408, 500, 502, 503, 504]
        } 
      });
    });

    it('should add request interceptor for retry configuration', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(requestInterceptorFn).toBeDefined();
    });

    it('should add response interceptor for retry logic', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
      expect(responseErrorInterceptorFn).toBeDefined();
    });

    it('should initialize retry count in request config', () => {
      const config: AxiosRequestConfig = {};
      const result = requestInterceptorFn(config);
      
      expect(result).toHaveProperty('_retryCount', 0);
    });

    it('should retry on network errors', async () => {
      const error = new Error('Network Error') as AxiosError;
      error.config = { _retryCount: 0, _retryDelay: 100, _maxRetries: 3 };
      error.isAxiosError = true;
      
      // Mock axios to resolve on retry
      (axios as any).mockImplementationOnce(() => Promise.resolve({ data: 'success' }));
      
      try {
        await responseErrorInterceptorFn(error);
      } catch (e) {
        // Ignore error
      }
      
      // Verify retry attempt was made
      expect(error.config._retryCount).toBe(1);
    });

    it('should retry on configured status codes', async () => {
      const error = {
        config: { _retryCount: 0, _retryDelay: 100, _maxRetries: 3, _statusCodesToRetry: [500] },
        response: { status: 500 },
        isAxiosError: true
      } as AxiosError;
      
      // Mock axios to resolve on retry
      (axios as any).mockImplementationOnce(() => Promise.resolve({ data: 'success' }));
      
      try {
        await responseErrorInterceptorFn(error);
      } catch (e) {
        // Ignore error
      }
      
      // Verify retry attempt was made
      expect(error.config._retryCount).toBe(1);
    });

    it('should not retry when max retries is reached', async () => {
      const error = {
        config: { _retryCount: 3, _retryDelay: 100, _maxRetries: 3, _statusCodesToRetry: [500] },
        response: { status: 500 },
        isAxiosError: true
      } as AxiosError;
      
      try {
        await responseErrorInterceptorFn(error);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    it('should not retry on status codes not configured for retry', async () => {
      const error = {
        config: { _retryCount: 0, _retryDelay: 100, _maxRetries: 3, _statusCodesToRetry: [500] },
        response: { status: 400 },
        isAxiosError: true
      } as AxiosError;
      
      try {
        await responseErrorInterceptorFn(error);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBe(error);
        expect(error.config._retryCount).toBe(0); // No retry attempted
      }
    });
  });

  describe('correlation ID and tracing', () => {
    it('should add correlation ID header if provided in options', () => {
      const correlationId = 'test-correlation-id-123';
      const client = createInternalApiClient('https://api.internal.austa.health', { 
        correlationId 
      });
      
      expect(client.defaults.headers.common['X-Correlation-ID']).toBe(correlationId);
    });

    it('should generate a correlation ID if not provided', () => {
      const client = createInternalApiClient('https://api.internal.austa.health', { 
        generateCorrelationId: true 
      });
      
      expect(client.defaults.headers.common['X-Correlation-ID']).toBeDefined();
      expect(typeof client.defaults.headers.common['X-Correlation-ID']).toBe('string');
      expect(client.defaults.headers.common['X-Correlation-ID'].length).toBeGreaterThan(0);
    });

    it('should add tracing headers when tracing is enabled', () => {
      const client = createInternalApiClient('https://api.internal.austa.health', { 
        tracing: true 
      });
      
      expect(client.defaults.headers.common['X-Trace-Enabled']).toBe('true');
    });

    it('should propagate parent span ID when provided', () => {
      const parentSpanId = 'parent-span-123';
      const client = createInternalApiClient('https://api.internal.austa.health', { 
        tracing: true,
        parentSpanId
      });
      
      expect(client.defaults.headers.common['X-Parent-Span-ID']).toBe(parentSpanId);
    });
  });

  describe('error handling with journey context', () => {
    let responseErrorInterceptorFn: any;
    
    beforeEach(() => {
      // Capture the error interceptor function when registered
      (mockAxiosInstance.interceptors.response.use as jest.Mock).mockImplementation((successFn, errorFn) => {
        responseErrorInterceptorFn = errorFn;
        return 0;
      });
      
      createInternalApiClient('https://api.internal.austa.health', { 
        journeyType: JourneyType.HEALTH,
        enhancedErrors: true
      });
    });

    it('should add response interceptor for error enhancement', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
      expect(responseErrorInterceptorFn).toBeDefined();
    });

    it('should enhance errors with journey context', async () => {
      const originalError = {
        config: { url: '/api/health/metrics' },
        response: { status: 500, data: { message: 'Internal server error' } },
        isAxiosError: true
      } as AxiosError;
      
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);
      
      try {
        await responseErrorInterceptorFn(originalError);
        fail('Should have thrown an error');
      } catch (e: any) {
        expect(e.journeyContext).toBeDefined();
        expect(e.journeyContext.journeyType).toBe('health');
        expect(e.journeyContext.serviceName).toBeDefined();
        expect(e.isEnhancedError).toBe(true);
      }
    });

    it('should preserve original error properties', async () => {
      const originalMessage = 'Internal server error';
      const originalError = {
        config: { url: '/api/health/metrics' },
        response: { status: 500, data: { message: originalMessage } },
        isAxiosError: true,
        message: originalMessage
      } as AxiosError;
      
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);
      
      try {
        await responseErrorInterceptorFn(originalError);
        fail('Should have thrown an error');
      } catch (e: any) {
        expect(e.message).toBe(originalMessage);
        expect(e.response).toBe(originalError.response);
        expect(e.config).toBe(originalError.config);
        expect(e.isAxiosError).toBe(true);
      }
    });

    it('should add request context to enhanced errors', async () => {
      const originalError = {
        config: { 
          url: '/api/health/metrics',
          method: 'GET',
          headers: { 'X-Correlation-ID': 'test-correlation-id' }
        },
        response: { status: 500, data: { message: 'Internal server error' } },
        isAxiosError: true
      } as AxiosError;
      
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);
      
      try {
        await responseErrorInterceptorFn(originalError);
        fail('Should have thrown an error');
      } catch (e: any) {
        expect(e.requestContext).toBeDefined();
        expect(e.requestContext.method).toBe('GET');
        expect(e.requestContext.url).toBe('/api/health/metrics');
        expect(e.requestContext.correlationId).toBe('test-correlation-id');
      }
    });

    it('should handle non-Axios errors', async () => {
      const originalError = new Error('Generic error');
      
      (axios.isAxiosError as jest.Mock).mockReturnValue(false);
      
      try {
        await responseErrorInterceptorFn(originalError);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBe(originalError); // Should pass through unchanged
      }
    });
  });
});
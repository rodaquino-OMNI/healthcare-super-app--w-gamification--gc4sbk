import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createSecureHttpClient, SecurityRuleConfig } from '../../../src/http/security';

// Mock axios module
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      defaults: {},
    })),
  };
});

describe('HTTP Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSecureHttpClient', () => {
    it('should create an axios instance with SSRF protection', () => {
      // Act
      const client = createSecureHttpClient();

      // Assert
      expect(axios.create).toHaveBeenCalled();
      expect(client).toBeDefined();
      expect(client.interceptors.request.use).toHaveBeenCalled();
    });

    it('should create an axios instance with custom configuration', () => {
      // Arrange
      const config = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      };

      // Act
      const client = createSecureHttpClient(config);

      // Assert
      expect(axios.create).toHaveBeenCalledWith(config);
    });

    it('should accept security rule configuration', () => {
      // Arrange
      const securityConfig: SecurityRuleConfig = {
        allowPrivateIPsInDevelopment: true,
        additionalBlockedDomains: ['blocked-domain.com'],
      };

      // Act
      const client = createSecureHttpClient({}, securityConfig);

      // Assert
      expect(client).toBeDefined();
      expect(client.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('SSRF Protection', () => {
    let client: AxiosInstance;
    let mockAxios: MockAdapter;
    let requestInterceptor: (config: AxiosRequestConfig) => AxiosRequestConfig;

    beforeEach(() => {
      // Restore axios to use the real implementation
      jest.restoreAllMocks();
      
      // Create a client with the interceptor
      client = createSecureHttpClient();
      
      // Create mock adapter
      mockAxios = new MockAdapter(client);
      
      // Extract the request interceptor
      requestInterceptor = client.interceptors.request.handlers[0].fulfilled;
    });

    afterEach(() => {
      mockAxios.restore();
    });

    describe('IPv4 Private Range Blocking', () => {
      it('should block requests to 10.x.x.x private range', async () => {
        // Arrange
        const url = 'http://10.0.0.1/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to private IP address (10.0.0.1)'
        );
      });

      it('should block requests to 172.16.x.x - 172.31.x.x private range', async () => {
        // Arrange
        const urls = [
          'http://172.16.0.1/api',
          'http://172.20.0.1/api',
          'http://172.31.255.255/api',
        ];

        urls.forEach(url => {
          mockAxios.onGet(url).reply(200);
        });

        // Act & Assert
        for (const url of urls) {
          const ipAddress = new URL(url).hostname;
          await expect(client.get(url)).rejects.toThrow(
            `SSRF Protection: Blocked request to private IP address (${ipAddress})`
          );
        }
      });

      it('should allow requests to 172.15.x.x and 172.32.x.x (outside private range)', async () => {
        // Arrange
        const urls = [
          'http://172.15.0.1/api',
          'http://172.32.0.1/api',
        ];

        urls.forEach(url => {
          mockAxios.onGet(url).reply(200, { success: true });
        });

        // Act & Assert
        for (const url of urls) {
          const response = await client.get(url);
          expect(response.status).toBe(200);
          expect(response.data).toEqual({ success: true });
        }
      });

      it('should block requests to 192.168.x.x private range', async () => {
        // Arrange
        const url = 'http://192.168.1.1/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to private IP address (192.168.1.1)'
        );
      });

      it('should block requests to 127.x.x.x localhost range', async () => {
        // Arrange
        const url = 'http://127.0.0.1/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to localhost (127.0.0.1)'
        );
      });

      it('should block requests to 0.0.0.0', async () => {
        // Arrange
        const url = 'http://0.0.0.0/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to reserved IP address (0.0.0.0)'
        );
      });
    });

    describe('IPv6 Address Blocking', () => {
      it('should block requests to ::1 (IPv6 loopback)', async () => {
        // Arrange
        const url = 'http://[::1]/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to IPv6 loopback address (::1)'
        );
      });

      it('should block requests to fe80:: (IPv6 link-local)', async () => {
        // Arrange
        const url = 'http://[fe80::1]/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to IPv6 link-local address (fe80::1)'
        );
      });

      it('should block requests to fc00:: (IPv6 unique local)', async () => {
        // Arrange
        const url = 'http://[fc00::1]/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to IPv6 unique local address (fc00::1)'
        );
      });

      it('should allow requests to public IPv6 addresses', async () => {
        // Arrange
        const url = 'http://[2001:db8::1]/api';
        mockAxios.onGet(url).reply(200, { success: true });

        // Act & Assert
        const response = await client.get(url);
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ success: true });
      });
    });

    describe('Domain Name Blocking', () => {
      it('should block requests to localhost domain', async () => {
        // Arrange
        const url = 'http://localhost/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to localhost'
        );
      });

      it('should block requests to localhost with port', async () => {
        // Arrange
        const url = 'http://localhost:8080/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to localhost'
        );
      });

      it('should block requests to .local domains', async () => {
        // Arrange
        const url = 'http://service.local/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to .local domain (service.local)'
        );
      });

      it('should block requests to subdomains of .local domains', async () => {
        // Arrange
        const url = 'http://sub.service.local/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        await expect(client.get(url)).rejects.toThrow(
          'SSRF Protection: Blocked request to .local domain (sub.service.local)'
        );
      });

      it('should allow requests to public domains', async () => {
        // Arrange
        const url = 'https://api.example.com/data';
        mockAxios.onGet(url).reply(200, { success: true });

        // Act & Assert
        const response = await client.get(url);
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ success: true });
      });
    });

    describe('Custom Security Rules', () => {
      it('should block requests to custom blocked domains', async () => {
        // Arrange
        const blockedDomain = 'blocked-domain.com';
        const client = createSecureHttpClient({}, {
          additionalBlockedDomains: [blockedDomain],
        });
        mockAxios = new MockAdapter(client);
        mockAxios.onGet(`https://${blockedDomain}/api`).reply(200);

        // Act & Assert
        await expect(client.get(`https://${blockedDomain}/api`)).rejects.toThrow(
          `SSRF Protection: Blocked request to explicitly blocked domain (${blockedDomain})`
        );
      });

      it('should allow private IPs in development mode when configured', async () => {
        // Arrange
        const privateIp = '10.0.0.1';
        const client = createSecureHttpClient({}, {
          allowPrivateIPsInDevelopment: true,
          environment: 'development',
        });
        mockAxios = new MockAdapter(client);
        mockAxios.onGet(`http://${privateIp}/api`).reply(200, { success: true });

        // Act & Assert
        const response = await client.get(`http://${privateIp}/api`);
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ success: true });
      });

      it('should still block private IPs in production even when allowPrivateIPsInDevelopment is true', async () => {
        // Arrange
        const privateIp = '10.0.0.1';
        const client = createSecureHttpClient({}, {
          allowPrivateIPsInDevelopment: true,
          environment: 'production',
        });
        mockAxios = new MockAdapter(client);
        mockAxios.onGet(`http://${privateIp}/api`).reply(200);

        // Act & Assert
        await expect(client.get(`http://${privateIp}/api`)).rejects.toThrow(
          `SSRF Protection: Blocked request to private IP address (${privateIp})`
        );
      });

      it('should allow requests to explicitly allowed domains even if they match blocked patterns', async () => {
        // Arrange
        const allowedDomain = 'special-local.com'; // Contains 'local' but should be allowed
        const client = createSecureHttpClient({}, {
          allowedDomains: [allowedDomain],
        });
        mockAxios = new MockAdapter(client);
        mockAxios.onGet(`https://${allowedDomain}/api`).reply(200, { success: true });

        // Act & Assert
        const response = await client.get(`https://${allowedDomain}/api`);
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ success: true });
      });
    });

    describe('Error Handling', () => {
      it('should provide detailed error messages for blocked requests', async () => {
        // Arrange
        const url = 'http://10.0.0.1/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        try {
          await client.get(url);
          fail('Expected request to be blocked');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('SSRF Protection');
          expect(error.message).toContain('10.0.0.1');
          expect(error).toHaveProperty('isSSRFProtectionError', true);
        }
      });

      it('should include the blocked URL in the error details', async () => {
        // Arrange
        const url = 'http://internal.local/api';
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        try {
          await client.get(url);
          fail('Expected request to be blocked');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('SSRF Protection');
          expect(error).toHaveProperty('blockedUrl', url);
          expect(error).toHaveProperty('reason', 'BLOCKED_LOCAL_DOMAIN');
        }
      });

      it('should log security violations when configured', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const url = 'http://192.168.1.1/api';
        const client = createSecureHttpClient({}, {
          logViolations: true,
        });
        mockAxios = new MockAdapter(client);
        mockAxios.onGet(url).reply(200);

        // Act & Assert
        try {
          await client.get(url);
          fail('Expected request to be blocked');
        } catch (error) {
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('SSRF Protection Violation'),
            expect.objectContaining({
              url,
              hostname: '192.168.1.1',
              reason: 'BLOCKED_PRIVATE_IP',
            })
          );
        } finally {
          consoleSpy.mockRestore();
        }
      });
    });

    describe('URL Parsing Edge Cases', () => {
      it('should handle URLs with authentication credentials', async () => {
        // Arrange
        const url = 'https://user:password@api.example.com/data';
        mockAxios.onGet(url).reply(200, { success: true });

        // Act & Assert
        const response = await client.get(url);
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ success: true });
      });

      it('should handle relative URLs with baseURL', async () => {
        // Arrange
        const baseURL = 'https://api.example.com';
        const client = createSecureHttpClient({ baseURL });
        mockAxios = new MockAdapter(client);
        mockAxios.onGet(`${baseURL}/data`).reply(200, { success: true });

        // Act & Assert
        const response = await client.get('/data');
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ success: true });
      });

      it('should handle invalid URLs gracefully', async () => {
        // Arrange
        const invalidUrl = '://invalid-url';
        
        // We need to mock the interceptor to simulate URL parsing error
        jest.spyOn(console, 'error').mockImplementation();
        
        // Act & Assert
        // The request should proceed (not throw) since the URL parsing error
        // should be caught and handled in the interceptor
        await expect(client.get(invalidUrl)).rejects.toThrow();
        // The error should be from axios, not from our SSRF protection
        await expect(client.get(invalidUrl)).rejects.not.toHaveProperty('isSSRFProtectionError');
      });
    });
  });
});
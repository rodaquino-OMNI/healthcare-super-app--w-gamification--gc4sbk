/**
 * @file HTTP Request Test Fixtures
 * @description Contains mock HTTP request objects with varying configurations for testing HTTP client utilities and interceptors.
 */

import { AxiosRequestConfig } from 'axios';
import { JourneyType } from '../../../src/http/internal';

/**
 * Base interface for mock request objects
 */
export interface MockRequestObject extends AxiosRequestConfig {
  /**
   * Unique identifier for the request object
   */
  id: string;
  
  /**
   * Description of the request object for documentation
   */
  description: string;
  
  /**
   * Expected behavior of the request when used with secure HTTP clients
   */
  expectedBehavior?: {
    /**
     * Whether the request should be blocked by SSRF protection
     */
    blockedBySsrf?: boolean;
    
    /**
     * Whether the request should be retried on failure
     */
    shouldRetry?: boolean;
    
    /**
     * Expected error type if the request fails
     */
    expectedErrorType?: string;
  };
}

/**
 * Mock request objects for testing HTTP methods
 */
export const HTTP_METHOD_REQUESTS: MockRequestObject[] = [
  {
    id: 'get-request',
    description: 'Standard GET request to a public API',
    method: 'GET',
    url: 'https://api.example.com/users',
    headers: {
      'Accept': 'application/json'
    },
    expectedBehavior: {
      blockedBySsrf: false,
      shouldRetry: true
    }
  },
  {
    id: 'post-request',
    description: 'Standard POST request with JSON body',
    method: 'POST',
    url: 'https://api.example.com/users',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    expectedBehavior: {
      blockedBySsrf: false,
      shouldRetry: false // POST requests are not retried by default
    }
  },
  {
    id: 'put-request',
    description: 'Standard PUT request with JSON body',
    method: 'PUT',
    url: 'https://api.example.com/users/123',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    data: {
      name: 'John Doe Updated',
      email: 'john.updated@example.com'
    },
    expectedBehavior: {
      blockedBySsrf: false,
      shouldRetry: true
    }
  },
  {
    id: 'delete-request',
    description: 'Standard DELETE request',
    method: 'DELETE',
    url: 'https://api.example.com/users/123',
    headers: {
      'Accept': 'application/json'
    },
    expectedBehavior: {
      blockedBySsrf: false,
      shouldRetry: true
    }
  },
  {
    id: 'patch-request',
    description: 'Standard PATCH request with JSON body',
    method: 'PATCH',
    url: 'https://api.example.com/users/123',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    data: {
      email: 'john.patched@example.com'
    },
    expectedBehavior: {
      blockedBySsrf: false,
      shouldRetry: false // PATCH requests are not retried by default
    }
  },
  {
    id: 'head-request',
    description: 'Standard HEAD request',
    method: 'HEAD',
    url: 'https://api.example.com/users/123',
    expectedBehavior: {
      blockedBySsrf: false,
      shouldRetry: true
    }
  },
  {
    id: 'options-request',
    description: 'Standard OPTIONS request',
    method: 'OPTIONS',
    url: 'https://api.example.com/users',
    expectedBehavior: {
      blockedBySsrf: false,
      shouldRetry: true
    }
  }
];

/**
 * Mock request objects for testing SSRF protection
 */
export const SSRF_TEST_REQUESTS: MockRequestObject[] = [
  {
    id: 'localhost-request',
    description: 'Request to localhost that should be blocked by SSRF protection',
    method: 'GET',
    url: 'http://localhost:3000/api',
    expectedBehavior: {
      blockedBySsrf: true,
      expectedErrorType: 'SSRF_ERROR'
    }
  },
  {
    id: 'localhost-ip-request',
    description: 'Request to 127.0.0.1 that should be blocked by SSRF protection',
    method: 'GET',
    url: 'http://127.0.0.1:3000/api',
    expectedBehavior: {
      blockedBySsrf: true,
      expectedErrorType: 'SSRF_ERROR'
    }
  },
  {
    id: 'private-ip-class-a-request',
    description: 'Request to private Class A IP that should be blocked by SSRF protection',
    method: 'GET',
    url: 'http://10.0.0.1:8080/api',
    expectedBehavior: {
      blockedBySsrf: true,
      expectedErrorType: 'SSRF_ERROR'
    }
  },
  {
    id: 'private-ip-class-b-request',
    description: 'Request to private Class B IP that should be blocked by SSRF protection',
    method: 'GET',
    url: 'http://172.16.0.1:8080/api',
    expectedBehavior: {
      blockedBySsrf: true,
      expectedErrorType: 'SSRF_ERROR'
    }
  },
  {
    id: 'private-ip-class-c-request',
    description: 'Request to private Class C IP that should be blocked by SSRF protection',
    method: 'GET',
    url: 'http://192.168.1.1:8080/api',
    expectedBehavior: {
      blockedBySsrf: true,
      expectedErrorType: 'SSRF_ERROR'
    }
  },
  {
    id: 'ipv6-localhost-request',
    description: 'Request to IPv6 localhost that should be blocked by SSRF protection',
    method: 'GET',
    url: 'http://[::1]:3000/api',
    expectedBehavior: {
      blockedBySsrf: true,
      expectedErrorType: 'SSRF_ERROR'
    }
  },
  {
    id: 'local-domain-request',
    description: 'Request to .local domain that should be blocked by SSRF protection',
    method: 'GET',
    url: 'http://service.local/api',
    expectedBehavior: {
      blockedBySsrf: true,
      expectedErrorType: 'SSRF_ERROR'
    }
  },
  {
    id: 'link-local-ipv6-request',
    description: 'Request to link-local IPv6 address that should be blocked by SSRF protection',
    method: 'GET',
    url: 'http://[fe80::1]:3000/api',
    expectedBehavior: {
      blockedBySsrf: true,
      expectedErrorType: 'SSRF_ERROR'
    }
  },
  {
    id: 'public-ip-request',
    description: 'Request to public IP that should not be blocked by SSRF protection',
    method: 'GET',
    url: 'http://203.0.113.1/api', // TEST-NET-3 block, used for examples
    expectedBehavior: {
      blockedBySsrf: false
    }
  },
  {
    id: 'public-domain-request',
    description: 'Request to public domain that should not be blocked by SSRF protection',
    method: 'GET',
    url: 'https://api.example.com/users',
    expectedBehavior: {
      blockedBySsrf: false
    }
  },
  {
    id: 'dns-rebinding-attempt',
    description: 'Request that might attempt DNS rebinding attack',
    method: 'GET',
    url: 'http://attacker-controlled-domain.com/api',
    // This domain could resolve to a private IP, which should be caught by DNS resolution check
    expectedBehavior: {
      blockedBySsrf: false // Initially allowed, but should be blocked after DNS resolution
    }
  }
];

/**
 * Mock request objects with different content types
 */
export const CONTENT_TYPE_REQUESTS: MockRequestObject[] = [
  {
    id: 'json-request',
    description: 'Request with JSON content type',
    method: 'POST',
    url: 'https://api.example.com/data',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      key: 'value',
      nested: {
        property: 'nested value'
      }
    }
  },
  {
    id: 'form-urlencoded-request',
    description: 'Request with form URL-encoded content type',
    method: 'POST',
    url: 'https://api.example.com/form',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: 'key1=value1&key2=value2&key3=value3'
  },
  {
    id: 'multipart-form-request',
    description: 'Request with multipart form data content type',
    method: 'POST',
    url: 'https://api.example.com/upload',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    // In a real scenario, this would be a FormData object
    // For testing purposes, we're using a mock object
    data: {
      _isFormData: true,
      _boundary: '----WebKitFormBoundary7MA4YWxkTrZu0gW',
      _entries: [
        { name: 'field1', value: 'value1' },
        { name: 'field2', value: 'value2' },
        { name: 'file', value: 'file-content', filename: 'test.txt', contentType: 'text/plain' }
      ]
    }
  },
  {
    id: 'xml-request',
    description: 'Request with XML content type',
    method: 'POST',
    url: 'https://api.example.com/xml',
    headers: {
      'Content-Type': 'application/xml'
    },
    data: '<?xml version="1.0" encoding="UTF-8"?><root><item>value</item></root>'
  },
  {
    id: 'text-plain-request',
    description: 'Request with plain text content type',
    method: 'POST',
    url: 'https://api.example.com/text',
    headers: {
      'Content-Type': 'text/plain'
    },
    data: 'This is plain text content for testing purposes.'
  },
  {
    id: 'binary-request',
    description: 'Request with binary content type',
    method: 'POST',
    url: 'https://api.example.com/binary',
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    // In a real scenario, this would be a Buffer or ArrayBuffer
    // For testing purposes, we're using a mock object
    data: {
      _isBinary: true,
      _type: 'Buffer',
      _data: [0x00, 0x01, 0x02, 0x03, 0x04]
    },
    responseType: 'arraybuffer'
  }
];

/**
 * Mock request objects for testing retry behavior
 */
export const RETRY_TEST_REQUESTS: MockRequestObject[] = [
  {
    id: 'timeout-request',
    description: 'Request that will timeout and should be retried',
    method: 'GET',
    url: 'https://api.example.com/slow-endpoint',
    timeout: 100, // Very short timeout to ensure it fails
    expectedBehavior: {
      shouldRetry: true,
      expectedErrorType: 'TIMEOUT_ERROR'
    }
  },
  {
    id: 'server-error-request',
    description: 'Request that will receive a 500 error and should be retried',
    method: 'GET',
    url: 'https://api.example.com/error-500',
    expectedBehavior: {
      shouldRetry: true,
      expectedErrorType: 'SERVER_ERROR'
    }
  },
  {
    id: 'rate-limit-request',
    description: 'Request that will be rate limited (429) and should be retried',
    method: 'GET',
    url: 'https://api.example.com/rate-limited',
    expectedBehavior: {
      shouldRetry: true,
      expectedErrorType: 'CLIENT_ERROR'
    }
  },
  {
    id: 'client-error-request',
    description: 'Request that will receive a 400 error and should not be retried',
    method: 'GET',
    url: 'https://api.example.com/error-400',
    expectedBehavior: {
      shouldRetry: false,
      expectedErrorType: 'CLIENT_ERROR'
    }
  },
  {
    id: 'network-error-request',
    description: 'Request that will encounter a network error and should be retried',
    method: 'GET',
    url: 'https://non-existent-domain-12345.example.com/api',
    expectedBehavior: {
      shouldRetry: true,
      expectedErrorType: 'NETWORK_ERROR'
    }
  },
  {
    id: 'post-retry-request',
    description: 'POST request that should not be retried even on server error',
    method: 'POST',
    url: 'https://api.example.com/error-500',
    data: { key: 'value' },
    expectedBehavior: {
      shouldRetry: false,
      expectedErrorType: 'SERVER_ERROR'
    }
  }
];

/**
 * Mock request objects for testing journey-specific configurations
 */
export const JOURNEY_SPECIFIC_REQUESTS: Record<JourneyType, MockRequestObject[]> = {
  health: [
    {
      id: 'health-metrics-request',
      description: 'Request to health metrics API',
      method: 'GET',
      url: 'https://api.example.com/health/metrics/user/123',
      headers: {
        'X-Journey-Context': 'health',
        'Accept': 'application/json'
      }
    },
    {
      id: 'health-goals-request',
      description: 'Request to create health goal',
      method: 'POST',
      url: 'https://api.example.com/health/goals',
      headers: {
        'X-Journey-Context': 'health',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        userId: '123',
        type: 'steps',
        target: 10000,
        period: 'daily'
      }
    }
  ],
  care: [
    {
      id: 'care-appointments-request',
      description: 'Request to care appointments API',
      method: 'GET',
      url: 'https://api.example.com/care/appointments/user/123',
      headers: {
        'X-Journey-Context': 'care',
        'Accept': 'application/json'
      }
    },
    {
      id: 'care-providers-request',
      description: 'Request to search care providers',
      method: 'POST',
      url: 'https://api.example.com/care/providers/search',
      headers: {
        'X-Journey-Context': 'care',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        specialty: 'cardiology',
        location: {
          latitude: -23.5505,
          longitude: -46.6333
        },
        radius: 10
      }
    }
  ],
  plan: [
    {
      id: 'plan-benefits-request',
      description: 'Request to plan benefits API',
      method: 'GET',
      url: 'https://api.example.com/plan/benefits/user/123',
      headers: {
        'X-Journey-Context': 'plan',
        'Accept': 'application/json'
      }
    },
    {
      id: 'plan-claims-request',
      description: 'Request to submit insurance claim',
      method: 'POST',
      url: 'https://api.example.com/plan/claims',
      headers: {
        'X-Journey-Context': 'plan',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        userId: '123',
        providerName: 'Example Hospital',
        serviceDate: '2023-05-15',
        amount: 250.00,
        description: 'Consultation'
      }
    }
  ],
  common: [
    {
      id: 'common-user-profile-request',
      description: 'Request to user profile API',
      method: 'GET',
      url: 'https://api.example.com/users/123/profile',
      headers: {
        'X-Journey-Context': 'common',
        'Accept': 'application/json'
      }
    },
    {
      id: 'common-notifications-request',
      description: 'Request to notifications API',
      method: 'GET',
      url: 'https://api.example.com/notifications/user/123',
      headers: {
        'X-Journey-Context': 'common',
        'Accept': 'application/json'
      }
    }
  ]
};

/**
 * Mock request objects with authentication headers
 */
export const AUTHENTICATION_REQUESTS: MockRequestObject[] = [
  {
    id: 'basic-auth-request',
    description: 'Request with Basic Authentication',
    method: 'GET',
    url: 'https://api.example.com/protected',
    auth: {
      username: 'user',
      password: 'password'
    }
  },
  {
    id: 'bearer-token-request',
    description: 'Request with Bearer Token Authentication',
    method: 'GET',
    url: 'https://api.example.com/protected',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    }
  },
  {
    id: 'api-key-request',
    description: 'Request with API Key Authentication',
    method: 'GET',
    url: 'https://api.example.com/protected',
    headers: {
      'X-API-Key': 'abcdef123456'
    }
  },
  {
    id: 'oauth-request',
    description: 'Request with OAuth Authentication',
    method: 'GET',
    url: 'https://api.example.com/protected',
    headers: {
      'Authorization': 'OAuth oauth_consumer_key="key",oauth_token="token",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1234567890",oauth_nonce="nonce",oauth_version="1.0",oauth_signature="signature"'
    }
  }
];

/**
 * Mock request objects with different configurations
 */
export const CONFIGURATION_REQUESTS: MockRequestObject[] = [
  {
    id: 'custom-timeout-request',
    description: 'Request with custom timeout',
    method: 'GET',
    url: 'https://api.example.com/slow-endpoint',
    timeout: 60000 // 60 seconds
  },
  {
    id: 'max-redirects-request',
    description: 'Request with maximum redirects configuration',
    method: 'GET',
    url: 'https://api.example.com/redirect',
    maxRedirects: 5
  },
  {
    id: 'proxy-request',
    description: 'Request through a proxy',
    method: 'GET',
    url: 'https://api.example.com/users',
    proxy: {
      host: 'proxy.example.com',
      port: 8080,
      auth: {
        username: 'proxy-user',
        password: 'proxy-password'
      }
    }
  },
  {
    id: 'response-type-request',
    description: 'Request with specific response type',
    method: 'GET',
    url: 'https://api.example.com/image.jpg',
    responseType: 'arraybuffer'
  },
  {
    id: 'params-request',
    description: 'Request with URL parameters',
    method: 'GET',
    url: 'https://api.example.com/search',
    params: {
      q: 'test query',
      page: 1,
      limit: 10,
      sort: 'relevance'
    }
  },
  {
    id: 'base-url-request',
    description: 'Request with base URL and relative path',
    method: 'GET',
    baseURL: 'https://api.example.com',
    url: '/users/123'
  }
];

/**
 * All mock request objects combined
 */
export const ALL_REQUESTS: MockRequestObject[] = [
  ...HTTP_METHOD_REQUESTS,
  ...SSRF_TEST_REQUESTS,
  ...CONTENT_TYPE_REQUESTS,
  ...RETRY_TEST_REQUESTS,
  ...JOURNEY_SPECIFIC_REQUESTS.health,
  ...JOURNEY_SPECIFIC_REQUESTS.care,
  ...JOURNEY_SPECIFIC_REQUESTS.plan,
  ...JOURNEY_SPECIFIC_REQUESTS.common,
  ...AUTHENTICATION_REQUESTS,
  ...CONFIGURATION_REQUESTS
];

/**
 * Get a request object by ID
 * 
 * @param id - The ID of the request object to retrieve
 * @returns The request object with the specified ID, or undefined if not found
 */
export function getRequestById(id: string): MockRequestObject | undefined {
  return ALL_REQUESTS.find(request => request.id === id);
}

/**
 * Create a modified copy of a request object
 * 
 * @param id - The ID of the request object to modify
 * @param modifications - The modifications to apply to the request object
 * @returns A new request object with the modifications applied
 */
export function createModifiedRequest(
  id: string,
  modifications: Partial<MockRequestObject>
): MockRequestObject {
  const baseRequest = getRequestById(id);
  
  if (!baseRequest) {
    throw new Error(`Request with ID '${id}' not found`);
  }
  
  return {
    ...baseRequest,
    ...modifications,
    id: `${baseRequest.id}-modified`,
    description: `Modified version of: ${baseRequest.description}`
  };
}
import { AxiosRequestConfig } from 'axios';

/**
 * Mock HTTP request objects for testing HTTP client utilities and interceptors.
 * These fixtures are designed to test various aspects of HTTP request handling,
 * including SSRF protection, content type handling, and request transformation.
 */

// ===== Valid Public URL Requests =====

/**
 * Valid GET request to a public domain
 */
export const validGetRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: {
    'Accept': 'application/json',
    'X-Request-ID': '123456789',
  },
};

/**
 * Valid POST request to a public domain with JSON body
 */
export const validPostJsonRequest: AxiosRequestConfig = {
  method: 'POST',
  url: 'https://api.example.com/users',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Request-ID': '123456789',
  },
  data: {
    name: 'John Doe',
    email: 'john.doe@example.com',
  },
};

/**
 * Valid PUT request to a public domain with JSON body
 */
export const validPutJsonRequest: AxiosRequestConfig = {
  method: 'PUT',
  url: 'https://api.example.com/users/123',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Request-ID': '123456789',
  },
  data: {
    name: 'John Doe Updated',
    email: 'john.updated@example.com',
  },
};

/**
 * Valid DELETE request to a public domain
 */
export const validDeleteRequest: AxiosRequestConfig = {
  method: 'DELETE',
  url: 'https://api.example.com/users/123',
  headers: {
    'Accept': 'application/json',
    'X-Request-ID': '123456789',
  },
};

/**
 * Valid PATCH request to a public domain with JSON body
 */
export const validPatchJsonRequest: AxiosRequestConfig = {
  method: 'PATCH',
  url: 'https://api.example.com/users/123',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Request-ID': '123456789',
  },
  data: {
    email: 'john.updated@example.com',
  },
};

// ===== Invalid Private/Local URL Requests (Should be blocked by SSRF protection) =====

/**
 * Invalid GET request to a private IP in 10.x.x.x range
 */
export const privateIp10RangeRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'http://10.0.0.1/api/data',
  headers: {
    'Accept': 'application/json',
  },
};

/**
 * Invalid GET request to a private IP in 172.16-31.x.x range
 */
export const privateIp172RangeRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'http://172.16.0.1/api/data',
  headers: {
    'Accept': 'application/json',
  },
};

/**
 * Invalid GET request to a private IP in 192.168.x.x range
 */
export const privateIp192RangeRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'http://192.168.1.1/api/data',
  headers: {
    'Accept': 'application/json',
  },
};

/**
 * Invalid GET request to localhost
 */
export const localhostRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'http://localhost:3000/api/data',
  headers: {
    'Accept': 'application/json',
  },
};

/**
 * Invalid GET request to 127.0.0.1 (localhost)
 */
export const localhost127Request: AxiosRequestConfig = {
  method: 'GET',
  url: 'http://127.0.0.1:3000/api/data',
  headers: {
    'Accept': 'application/json',
  },
};

/**
 * Invalid GET request to a .local domain
 */
export const localDomainRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'http://service.local/api/data',
  headers: {
    'Accept': 'application/json',
  },
};

/**
 * Invalid GET request to IPv6 localhost
 */
export const ipv6LocalhostRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'http://[::1]:3000/api/data',
  headers: {
    'Accept': 'application/json',
  },
};

/**
 * Invalid GET request to IPv6 link-local address
 */
export const ipv6LinkLocalRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'http://[fe80::1]:3000/api/data',
  headers: {
    'Accept': 'application/json',
  },
};

// ===== Requests with Different Content Types =====

/**
 * POST request with form-urlencoded content type
 */
export const formUrlEncodedRequest: AxiosRequestConfig = {
  method: 'POST',
  url: 'https://api.example.com/form',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  },
  data: 'name=John%20Doe&email=john.doe%40example.com',
};

/**
 * POST request with multipart/form-data content type
 * Note: In actual usage, this would typically use FormData object
 */
export const multipartFormDataRequest: AxiosRequestConfig = {
  method: 'POST',
  url: 'https://api.example.com/upload',
  headers: {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json',
  },
  // In real usage, this would be a FormData object
  // This is just a mock representation for testing
  data: {
    name: 'John Doe',
    file: '[BINARY_FILE_DATA]',
  },
};

/**
 * POST request with text/plain content type
 */
export const textPlainRequest: AxiosRequestConfig = {
  method: 'POST',
  url: 'https://api.example.com/text',
  headers: {
    'Content-Type': 'text/plain',
    'Accept': 'text/plain',
  },
  data: 'This is a plain text message',
};

/**
 * POST request with application/xml content type
 */
export const xmlRequest: AxiosRequestConfig = {
  method: 'POST',
  url: 'https://api.example.com/xml',
  headers: {
    'Content-Type': 'application/xml',
    'Accept': 'application/xml',
  },
  data: '<user><name>John Doe</name><email>john.doe@example.com</email></user>',
};

// ===== Requests with Special Headers and Configurations =====

/**
 * Request with authentication headers
 */
export const authHeaderRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'https://api.example.com/protected',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    'Accept': 'application/json',
  },
};

/**
 * Request with custom headers for journey context
 */
export const journeyContextRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'https://api.example.com/journey/health',
  headers: {
    'X-Journey-ID': 'health-journey',
    'X-User-ID': '12345',
    'X-Session-ID': 'session-67890',
    'Accept': 'application/json',
  },
};

/**
 * Request with timeout and retry configuration
 */
export const timeoutConfigRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'https://api.example.com/slow-endpoint',
  headers: {
    'Accept': 'application/json',
  },
  timeout: 5000, // 5 seconds timeout
  // Custom property for retry configuration (not standard Axios)
  // @ts-ignore
  retryConfig: {
    retries: 3,
    retryDelay: 1000,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
  },
};

/**
 * Request with query parameters
 */
export const queryParamsRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'https://api.example.com/search',
  params: {
    q: 'health metrics',
    limit: 10,
    offset: 0,
    sort: 'date',
    order: 'desc',
  },
  headers: {
    'Accept': 'application/json',
  },
};

/**
 * Request with baseURL and relative URL
 */
export const baseUrlRequest: AxiosRequestConfig = {
  method: 'GET',
  baseURL: 'https://api.example.com',
  url: '/users/profile',
  headers: {
    'Accept': 'application/json',
  },
};

/**
 * Request with response type specified
 */
export const binaryResponseRequest: AxiosRequestConfig = {
  method: 'GET',
  url: 'https://api.example.com/download/file.pdf',
  responseType: 'arraybuffer',
  headers: {
    'Accept': 'application/pdf',
  },
};

// ===== Grouped Request Collections =====

/**
 * Collection of valid requests for different HTTP methods
 */
export const validRequestsByMethod = {
  GET: validGetRequest,
  POST: validPostJsonRequest,
  PUT: validPutJsonRequest,
  PATCH: validPatchJsonRequest,
  DELETE: validDeleteRequest,
};

/**
 * Collection of invalid requests that should be blocked by SSRF protection
 */
export const ssrfBlockedRequests = {
  privateIp10Range: privateIp10RangeRequest,
  privateIp172Range: privateIp172RangeRequest,
  privateIp192Range: privateIp192RangeRequest,
  localhost: localhostRequest,
  localhost127: localhost127Request,
  localDomain: localDomainRequest,
  ipv6Localhost: ipv6LocalhostRequest,
  ipv6LinkLocal: ipv6LinkLocalRequest,
};

/**
 * Collection of requests with different content types
 */
export const contentTypeRequests = {
  json: validPostJsonRequest,
  formUrlEncoded: formUrlEncodedRequest,
  multipartFormData: multipartFormDataRequest,
  textPlain: textPlainRequest,
  xml: xmlRequest,
};

/**
 * Collection of requests with special configurations
 */
export const specialConfigRequests = {
  auth: authHeaderRequest,
  journeyContext: journeyContextRequest,
  timeout: timeoutConfigRequest,
  queryParams: queryParamsRequest,
  baseUrl: baseUrlRequest,
  binaryResponse: binaryResponseRequest,
};
/**
 * @file response-objects.ts
 * @description Provides a collection of mock HTTP response objects with various status codes,
 * headers, and body formats for testing HTTP client response handling. These fixtures enable
 * testing of successful responses, client/server errors, redirects, and special response types
 * with consistent patterns across the codebase.
 */

import { AxiosResponse, AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';
import { contentTypes, responseHeaders, corsHeaders, securityHeaders, journeyHeaders } from './headers';

/**
 * Interface for a simplified HTTP response object used in tests
 */
export interface HttpResponseObject {
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response body */
  data: any;
  /** Response headers */
  headers: Record<string, string>;
  /** Request configuration that generated this response */
  config?: any;
}

/**
 * Interface for a factory function that creates HTTP response objects
 */
export type HttpResponseFactory = (overrides?: Partial<HttpResponseObject>) => HttpResponseObject;

/**
 * Creates a basic HTTP response object with the given parameters
 * 
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @param data - Response body
 * @param headers - Response headers
 * @param config - Request configuration
 * @returns An HTTP response object
 */
export function createHttpResponse(
  status: number = 200,
  statusText: string = 'OK',
  data: any = {},
  headers: Record<string, string> = { 'Content-Type': contentTypes.json },
  config: any = { url: 'https://api.example.com/test', method: 'GET' }
): HttpResponseObject {
  return {
    status,
    statusText,
    data,
    headers,
    config
  };
}

/**
 * Creates an Axios response object with the given parameters
 * 
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @param data - Response body
 * @param headers - Response headers
 * @param config - Request configuration
 * @returns An Axios response object
 */
export function createAxiosResponse(
  status: number = 200,
  statusText: string = 'OK',
  data: any = {},
  headers: Record<string, string> = { 'Content-Type': contentTypes.json },
  config: any = { url: 'https://api.example.com/test', method: 'GET' }
): AxiosResponse {
  return {
    status,
    statusText,
    data,
    headers: headers as RawAxiosResponseHeaders,
    config,
    request: {}
  };
}

/**
 * Success response objects (2xx status codes)
 */
export const successResponses = {
  /**
   * Basic 200 OK response with empty JSON object
   */
  ok: createHttpResponse(
    200,
    'OK',
    {},
    responseHeaders.json
  ),

  /**
   * 200 OK response with JSON data
   */
  okWithData: createHttpResponse(
    200,
    'OK',
    { id: 123, name: 'Test User', email: 'test@example.com' },
    responseHeaders.json
  ),

  /**
   * 200 OK response with array data
   */
  okWithArray: createHttpResponse(
    200,
    'OK',
    [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ],
    responseHeaders.json
  ),

  /**
   * 200 OK response with paginated data
   */
  okWithPagination: createHttpResponse(
    200,
    'OK',
    {
      data: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ],
      pagination: {
        total: 25,
        page: 1,
        perPage: 3,
        totalPages: 9
      }
    },
    responseHeaders.json
  ),

  /**
   * 200 OK response with HTML content
   */
  okWithHtml: createHttpResponse(
    200,
    'OK',
    '<html><body><h1>Hello World</h1><p>This is a test</p></body></html>',
    { 'Content-Type': contentTypes.textHtml }
  ),

  /**
   * 200 OK response with XML content
   */
  okWithXml: createHttpResponse(
    200,
    'OK',
    '<?xml version="1.0" encoding="UTF-8"?><root><item id="1">Test</item></root>',
    { 'Content-Type': contentTypes.xml }
  ),

  /**
   * 200 OK response with plain text content
   */
  okWithText: createHttpResponse(
    200,
    'OK',
    'This is a plain text response',
    { 'Content-Type': contentTypes.textPlain }
  ),

  /**
   * 201 Created response
   */
  created: createHttpResponse(
    201,
    'Created',
    { id: 456, name: 'New Resource', createdAt: '2023-05-15T10:30:00Z' },
    { ...responseHeaders.json, 'Location': 'https://api.example.com/resources/456' }
  ),

  /**
   * 202 Accepted response
   */
  accepted: createHttpResponse(
    202,
    'Accepted',
    { message: 'Your request has been accepted and is being processed', requestId: 'req-123456' },
    responseHeaders.json
  ),

  /**
   * 204 No Content response
   */
  noContent: createHttpResponse(
    204,
    'No Content',
    null,
    { 'Content-Length': '0' }
  ),

  /**
   * 200 OK response with CORS headers
   */
  okWithCors: createHttpResponse(
    200,
    'OK',
    { id: 123, name: 'Test User' },
    { ...responseHeaders.json, ...corsHeaders.withCredentials }
  ),

  /**
   * 200 OK response with security headers
   */
  okWithSecurity: createHttpResponse(
    200,
    'OK',
    { id: 123, name: 'Test User' },
    { ...responseHeaders.json, ...securityHeaders.recommended }
  ),

  /**
   * 200 OK response with caching headers
   */
  okWithCaching: createHttpResponse(
    200,
    'OK',
    { id: 123, name: 'Test User', lastUpdated: '2023-05-15T10:30:00Z' },
    { 
      ...responseHeaders.json, 
      'Cache-Control': 'public, max-age=3600',
      'ETag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
      'Last-Modified': 'Mon, 15 May 2023 10:30:00 GMT'
    }
  ),
};

/**
 * Redirect response objects (3xx status codes)
 */
export const redirectResponses = {
  /**
   * 301 Moved Permanently response
   */
  movedPermanently: createHttpResponse(
    301,
    'Moved Permanently',
    '',
    { 'Location': 'https://api.example.com/new-endpoint' }
  ),

  /**
   * 302 Found response
   */
  found: createHttpResponse(
    302,
    'Found',
    '',
    { 'Location': 'https://api.example.com/temporary-redirect' }
  ),

  /**
   * 303 See Other response
   */
  seeOther: createHttpResponse(
    303,
    'See Other',
    '',
    { 'Location': 'https://api.example.com/other-resource' }
  ),

  /**
   * 307 Temporary Redirect response
   */
  temporaryRedirect: createHttpResponse(
    307,
    'Temporary Redirect',
    '',
    { 'Location': 'https://api.example.com/temporary-endpoint' }
  ),

  /**
   * 308 Permanent Redirect response
   */
  permanentRedirect: createHttpResponse(
    308,
    'Permanent Redirect',
    '',
    { 'Location': 'https://api.example.com/permanent-endpoint' }
  ),
};

/**
 * Client error response objects (4xx status codes)
 */
export const clientErrorResponses = {
  /**
   * 400 Bad Request response
   */
  badRequest: createHttpResponse(
    400,
    'Bad Request',
    { message: 'Invalid request parameters', errors: [{ field: 'email', message: 'Invalid email format' }] },
    responseHeaders.json
  ),

  /**
   * 401 Unauthorized response
   */
  unauthorized: createHttpResponse(
    401,
    'Unauthorized',
    { message: 'Authentication required' },
    { ...responseHeaders.json, 'WWW-Authenticate': 'Bearer' }
  ),

  /**
   * 403 Forbidden response
   */
  forbidden: createHttpResponse(
    403,
    'Forbidden',
    { message: 'You do not have permission to access this resource' },
    responseHeaders.json
  ),

  /**
   * 404 Not Found response
   */
  notFound: createHttpResponse(
    404,
    'Not Found',
    { message: 'The requested resource was not found' },
    responseHeaders.json
  ),

  /**
   * 405 Method Not Allowed response
   */
  methodNotAllowed: createHttpResponse(
    405,
    'Method Not Allowed',
    { message: 'Method not allowed' },
    { ...responseHeaders.json, 'Allow': 'GET, POST, PUT, DELETE' }
  ),

  /**
   * 409 Conflict response
   */
  conflict: createHttpResponse(
    409,
    'Conflict',
    { message: 'Resource already exists', conflictingId: '12345' },
    responseHeaders.json
  ),

  /**
   * 422 Unprocessable Entity response
   */
  unprocessableEntity: createHttpResponse(
    422,
    'Unprocessable Entity',
    { 
      message: 'Validation failed',
      errors: [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Email must be valid' },
        { field: 'age', message: 'Age must be a positive number' }
      ] 
    },
    responseHeaders.json
  ),

  /**
   * 429 Too Many Requests response
   */
  tooManyRequests: createHttpResponse(
    429,
    'Too Many Requests',
    { message: 'Rate limit exceeded' },
    { ...responseHeaders.json, 'Retry-After': '60' }
  ),
};

/**
 * Server error response objects (5xx status codes)
 */
export const serverErrorResponses = {
  /**
   * 500 Internal Server Error response
   */
  internalServerError: createHttpResponse(
    500,
    'Internal Server Error',
    { message: 'An unexpected error occurred' },
    responseHeaders.json
  ),

  /**
   * 501 Not Implemented response
   */
  notImplemented: createHttpResponse(
    501,
    'Not Implemented',
    { message: 'This feature is not implemented yet' },
    responseHeaders.json
  ),

  /**
   * 502 Bad Gateway response
   */
  badGateway: createHttpResponse(
    502,
    'Bad Gateway',
    { message: 'Invalid response from upstream server' },
    responseHeaders.json
  ),

  /**
   * 503 Service Unavailable response
   */
  serviceUnavailable: createHttpResponse(
    503,
    'Service Unavailable',
    { message: 'Service is currently unavailable' },
    { ...responseHeaders.json, 'Retry-After': '120' }
  ),

  /**
   * 504 Gateway Timeout response
   */
  gatewayTimeout: createHttpResponse(
    504,
    'Gateway Timeout',
    { message: 'Gateway timeout' },
    responseHeaders.json
  ),
};

/**
 * Journey-specific response objects
 */
export const journeyResponses = {
  /**
   * Health journey success response
   */
  healthSuccess: createHttpResponse(
    200,
    'OK',
    {
      userId: 'user-123',
      metrics: [
        { type: 'steps', value: 8500, date: '2023-05-15' },
        { type: 'heartRate', value: 72, date: '2023-05-15' },
        { type: 'sleep', value: 7.5, date: '2023-05-15' }
      ],
      goals: [
        { type: 'steps', target: 10000, current: 8500, progress: 0.85 },
        { type: 'sleep', target: 8, current: 7.5, progress: 0.94 }
      ]
    },
    { ...responseHeaders.json, ...journeyHeaders.health }
  ),

  /**
   * Health journey error response
   */
  healthError: createHttpResponse(
    500,
    'Internal Server Error',
    { 
      message: 'Failed to retrieve health metrics',
      journeyType: 'health',
      errorCode: 'HEALTH_METRICS_UNAVAILABLE'
    },
    { ...responseHeaders.json, ...journeyHeaders.health }
  ),

  /**
   * Care journey success response
   */
  careSuccess: createHttpResponse(
    200,
    'OK',
    {
      userId: 'user-123',
      appointments: [
        { id: 'appt-1', provider: 'Dr. Smith', date: '2023-05-20T14:30:00Z', status: 'confirmed' },
        { id: 'appt-2', provider: 'Dr. Johnson', date: '2023-06-15T10:00:00Z', status: 'scheduled' }
      ],
      medications: [
        { id: 'med-1', name: 'Medication A', dosage: '10mg', frequency: 'daily' },
        { id: 'med-2', name: 'Medication B', dosage: '5mg', frequency: 'twice daily' }
      ]
    },
    { ...responseHeaders.json, ...journeyHeaders.care }
  ),

  /**
   * Care journey error response
   */
  careError: createHttpResponse(
    409,
    'Conflict',
    { 
      message: 'Appointment slot is no longer available',
      journeyType: 'care',
      errorCode: 'APPOINTMENT_UNAVAILABLE',
      appointmentId: 'appt-12345'
    },
    { ...responseHeaders.json, ...journeyHeaders.care }
  ),

  /**
   * Plan journey success response
   */
  planSuccess: createHttpResponse(
    200,
    'OK',
    {
      userId: 'user-123',
      plan: {
        id: 'plan-premium',
        name: 'Premium Health Plan',
        coverage: 'Comprehensive',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      },
      benefits: [
        { id: 'benefit-1', name: 'Annual Checkup', coverage: '100%', used: false },
        { id: 'benefit-2', name: 'Specialist Visits', coverage: '80%', used: true, remaining: 4 }
      ],
      claims: [
        { id: 'claim-1', date: '2023-03-15', amount: 150.00, status: 'approved' },
        { id: 'claim-2', date: '2023-04-22', amount: 75.50, status: 'pending' }
      ]
    },
    { ...responseHeaders.json, ...journeyHeaders.plan }
  ),

  /**
   * Plan journey error response
   */
  planError: createHttpResponse(
    400,
    'Bad Request',
    { 
      message: 'Insurance claim validation failed',
      journeyType: 'plan',
      errorCode: 'CLAIM_VALIDATION_FAILED',
      claimId: 'claim-12345',
      validationErrors: [
        { field: 'serviceDate', message: 'Service date cannot be in the future' },
        { field: 'amount', message: 'Amount exceeds maximum allowed' }
      ]
    },
    { ...responseHeaders.json, ...journeyHeaders.plan }
  ),

  /**
   * Gamification success response
   */
  gamificationSuccess: createHttpResponse(
    200,
    'OK',
    {
      userId: 'user-123',
      profile: {
        level: 5,
        xp: 2500,
        nextLevelXp: 3000,
        achievements: 12
      },
      achievements: [
        { id: 'achievement-1', name: 'First Steps', description: 'Complete your first health assessment', earned: true, date: '2023-02-10' },
        { id: 'achievement-2', name: 'Consistent Care', description: 'Attend 3 appointments without cancellation', earned: true, date: '2023-04-05' },
        { id: 'achievement-3', name: 'Plan Master', description: 'Use all your preventive care benefits', earned: false, progress: 0.75 }
      ],
      rewards: [
        { id: 'reward-1', name: 'Premium Discount', description: '5% off next month premium', redeemed: false },
        { id: 'reward-2', name: 'Fitness Tracker', description: 'Free fitness tracker', redeemed: true, redeemedDate: '2023-03-20' }
      ]
    },
    { ...responseHeaders.json, ...journeyHeaders.gamification }
  ),
};

/**
 * Special case response objects
 */
export const specialResponses = {
  /**
   * Empty response body
   */
  empty: createHttpResponse(
    200,
    'OK',
    '',
    { 'Content-Length': '0' }
  ),

  /**
   * Malformed JSON response
   */
  malformedJson: createHttpResponse(
    200,
    'OK',
    '{"data":{"user":',
    responseHeaders.json
  ),

  /**
   * Binary data response
   */
  binaryData: createHttpResponse(
    200,
    'OK',
    Buffer.from('Binary data content', 'utf-8'),
    { 'Content-Type': contentTypes.binary, 'Content-Length': '20' }
  ),

  /**
   * Response with very large payload
   */
  largePayload: createHttpResponse(
    200,
    'OK',
    { data: Array(1000).fill({ id: 1, name: 'Repeated item', description: 'A'.repeat(1000) }) },
    responseHeaders.json
  ),

  /**
   * Response with unusual status code
   */
  unusualStatus: createHttpResponse(
    418,
    'I\'m a teapot',
    { message: 'The server refuses to brew coffee because it is a teapot' },
    responseHeaders.json
  ),

  /**
   * Response with multiple content types
   */
  multipleContentTypes: createHttpResponse(
    200,
    'OK',
    { html: '<p>HTML content</p>', text: 'Plain text content', data: { key: 'value' } },
    { 'Content-Type': 'multipart/mixed' }
  ),

  /**
   * Response with streaming data
   */
  streamingData: createHttpResponse(
    200,
    'OK',
    '[1, 2, 3, 4',  // Incomplete JSON to simulate streaming
    { 'Content-Type': contentTypes.json, 'Transfer-Encoding': 'chunked' }
  ),
};

/**
 * Factory functions for creating custom response objects
 */
export const responseFactories = {
  /**
   * Creates a success response with the given data
   * 
   * @param data - Response data
   * @param headers - Optional additional headers
   * @returns A success response object
   */
  success: (data: any, headers: Record<string, string> = {}): HttpResponseObject => {
    return createHttpResponse(
      200,
      'OK',
      data,
      { ...responseHeaders.json, ...headers }
    );
  },

  /**
   * Creates a client error response
   * 
   * @param status - HTTP status code (4xx)
   * @param message - Error message
   * @param details - Additional error details
   * @param headers - Optional additional headers
   * @returns A client error response object
   */
  clientError: (
    status: number = 400,
    message: string = 'Bad Request',
    details: any = {},
    headers: Record<string, string> = {}
  ): HttpResponseObject => {
    if (status < 400 || status >= 500) {
      throw new Error(`Invalid client error status code: ${status}. Must be in range 400-499.`);
    }

    return createHttpResponse(
      status,
      getStatusText(status),
      { message, ...details },
      { ...responseHeaders.json, ...headers }
    );
  },

  /**
   * Creates a server error response
   * 
   * @param status - HTTP status code (5xx)
   * @param message - Error message
   * @param details - Additional error details
   * @param headers - Optional additional headers
   * @returns A server error response object
   */
  serverError: (
    status: number = 500,
    message: string = 'Internal Server Error',
    details: any = {},
    headers: Record<string, string> = {}
  ): HttpResponseObject => {
    if (status < 500 || status >= 600) {
      throw new Error(`Invalid server error status code: ${status}. Must be in range 500-599.`);
    }

    return createHttpResponse(
      status,
      getStatusText(status),
      { message, ...details },
      { ...responseHeaders.json, ...headers }
    );
  },

  /**
   * Creates a redirect response
   * 
   * @param status - HTTP status code (3xx)
   * @param location - Redirect location URL
   * @param headers - Optional additional headers
   * @returns A redirect response object
   */
  redirect: (
    status: number = 302,
    location: string,
    headers: Record<string, string> = {}
  ): HttpResponseObject => {
    if (status < 300 || status >= 400) {
      throw new Error(`Invalid redirect status code: ${status}. Must be in range 300-399.`);
    }

    return createHttpResponse(
      status,
      getStatusText(status),
      '',
      { 'Location': location, ...headers }
    );
  },

  /**
   * Creates a journey-specific response
   * 
   * @param journeyType - Type of journey ('health', 'care', 'plan', or 'gamification')
   * @param status - HTTP status code
   * @param data - Response data
   * @param headers - Optional additional headers
   * @returns A journey-specific response object
   */
  journeyResponse: (
    journeyType: 'health' | 'care' | 'plan' | 'gamification',
    status: number = 200,
    data: any = {},
    headers: Record<string, string> = {}
  ): HttpResponseObject => {
    const journeyHeader = journeyHeaders[journeyType] || {};
    
    return createHttpResponse(
      status,
      getStatusText(status),
      { ...data, journeyType },
      { ...responseHeaders.json, ...journeyHeader, ...headers }
    );
  },
};

/**
 * Helper function to get status text for a given status code
 * 
 * @param status - HTTP status code
 * @returns The corresponding status text
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };

  return statusTexts[status] || 'Unknown Status';
}

/**
 * Groups all response objects for easy access
 */
export const allResponses = {
  success: successResponses,
  redirect: redirectResponses,
  clientError: clientErrorResponses,
  serverError: serverErrorResponses,
  journey: journeyResponses,
  special: specialResponses,
  factories: responseFactories
};

/**
 * Default export for all response objects
 */
export default allResponses;
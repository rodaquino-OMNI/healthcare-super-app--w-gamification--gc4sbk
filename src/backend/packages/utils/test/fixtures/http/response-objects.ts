/**
 * HTTP Response Objects Test Fixtures
 * 
 * This module provides a collection of mock HTTP response objects with various status codes,
 * headers, and body formats for testing HTTP client response handling. These fixtures enable
 * testing of successful responses, client/server errors, redirects, and special response types
 * with consistent patterns across the codebase.
 */

import { AxiosResponse, AxiosResponseHeaders, AxiosRequestConfig } from 'axios';
import { 
  STANDARD_JSON_RESPONSE_HEADERS,
  CORS_RESPONSE_HEADERS,
  CACHEABLE_RESPONSE_HEADERS,
  NON_CACHEABLE_RESPONSE_HEADERS,
  REDIRECT_RESPONSE_HEADERS,
  ERROR_RESPONSE_HEADERS,
  SECURITY_RESPONSE_HEADERS,
  RATE_LIMIT_RESPONSE_HEADERS,
  RATE_LIMIT_EXCEEDED_HEADERS,
  HEALTH_JOURNEY_HEADERS,
  CARE_JOURNEY_HEADERS,
  PLAN_JOURNEY_HEADERS,
  CONTENT_TYPES,
  ResponseHeaders
} from './headers';
import { HttpStatusCode } from './errors';

/**
 * HTTP Response Interface
 */
export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
  headers: ResponseHeaders;
  config?: AxiosRequestConfig;
  request?: any;
}

/**
 * Pagination Metadata Interface
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated Response Interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * API Error Response Interface
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    path?: string;
    timestamp?: string;
    requestId?: string;
  };
}

/**
 * Journey Context Interface
 */
export interface JourneyContext {
  journeyId: string; // 'health', 'care', or 'plan'
  userId: string;
  sessionId?: string;
  [key: string]: any; // Additional journey-specific context
}

/**
 * Factory function to create a mock Axios response
 */
export function createAxiosResponse<T = any, D = any>(
  data: T,
  status: number = 200,
  statusText: string = 'OK',
  headers: ResponseHeaders = STANDARD_JSON_RESPONSE_HEADERS,
  config: AxiosRequestConfig = {},
  request: any = {}
): AxiosResponse<T, D> {
  return {
    data,
    status,
    statusText,
    headers: headers as AxiosResponseHeaders,
    config,
    request
  };
}

/**
 * Factory function to create a mock HTTP response
 */
export function createHttpResponse<T = any>(
  data: T,
  status: number = 200,
  statusText: string = 'OK',
  headers: ResponseHeaders = STANDARD_JSON_RESPONSE_HEADERS
): HttpResponse<T> {
  return {
    data,
    status,
    statusText,
    headers,
    config: {
      url: 'https://api.example.com/resource',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    },
    request: { path: '/resource' }
  };
}

/**
 * Factory function to create a paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  currentPage: number = 1,
  totalPages: number = 1,
  totalItems: number = items.length,
  itemsPerPage: number = 10
): PaginatedResponse<T> {
  return {
    data: items,
    meta: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    }
  };
}

/**
 * Factory function to create an API error response
 */
export function createApiErrorResponse(
  code: string,
  message: string,
  details?: Record<string, any>,
  path: string = '/resource',
  requestId: string = '12345678-1234-1234-1234-123456789012'
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      path,
      timestamp: new Date().toISOString(),
      requestId
    }
  };
}

/**
 * Factory function to create a journey-specific response
 */
export function createJourneyResponse<T = any>(
  data: T,
  journeyId: 'health' | 'care' | 'plan',
  context: Partial<JourneyContext> = {},
  status: number = 200
): HttpResponse<T> {
  let headers: ResponseHeaders;
  
  switch (journeyId) {
    case 'health':
      headers = HEALTH_JOURNEY_HEADERS;
      break;
    case 'care':
      headers = CARE_JOURNEY_HEADERS;
      break;
    case 'plan':
      headers = PLAN_JOURNEY_HEADERS;
      break;
    default:
      headers = STANDARD_JSON_RESPONSE_HEADERS;
  }
  
  return createHttpResponse(
    data,
    status,
    status === 200 ? 'OK' : '',
    headers
  );
}

/**
 * Factory function to create a response with a specific content type
 */
export function createTypedResponse<T = any>(
  data: T,
  contentType: string,
  status: number = 200
): HttpResponse<T> {
  const headers = {
    ...STANDARD_JSON_RESPONSE_HEADERS,
    'Content-Type': contentType
  };
  
  return createHttpResponse(data, status, status === 200 ? 'OK' : '', headers);
}

/**
 * Success Responses (2xx)
 */
export const SuccessResponses = {
  // 200 OK
  OK_EMPTY: createHttpResponse<null>(null),
  
  OK_JSON: createHttpResponse<Record<string, any>>(
    { id: '123', name: 'Test Resource', status: 'active' }
  ),
  
  OK_ARRAY: createHttpResponse<any[]>(
    [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }]
  ),
  
  OK_STRING: createTypedResponse<string>(
    'Plain text response',
    CONTENT_TYPES.TEXT
  ),
  
  OK_HTML: createTypedResponse<string>(
    '<html><body><h1>Hello World</h1></body></html>',
    CONTENT_TYPES.HTML
  ),
  
  OK_XML: createTypedResponse<string>(
    '<?xml version="1.0" encoding="UTF-8"?><root><item id="1">Test</item></root>',
    CONTENT_TYPES.XML
  ),
  
  OK_BINARY: createTypedResponse<ArrayBuffer>(
    new ArrayBuffer(8),
    CONTENT_TYPES.OCTET_STREAM
  ),
  
  // 201 Created
  CREATED: createHttpResponse<Record<string, any>>(
    { id: '123', name: 'Newly Created Resource', createdAt: new Date().toISOString() },
    HttpStatusCode.CREATED,
    'Created'
  ),
  
  // 202 Accepted
  ACCEPTED: createHttpResponse<Record<string, any>>(
    { message: 'Request accepted for processing', jobId: '456' },
    HttpStatusCode.ACCEPTED,
    'Accepted'
  ),
  
  // 204 No Content
  NO_CONTENT: createHttpResponse<null>(
    null,
    HttpStatusCode.NO_CONTENT,
    'No Content'
  ),
  
  // Paginated responses
  PAGINATED: createHttpResponse<PaginatedResponse<Record<string, any>>>(
    createPaginatedResponse(
      Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), name: `Item ${i + 1}` }))
    )
  ),
  
  PAGINATED_EMPTY: createHttpResponse<PaginatedResponse<Record<string, any>>>(
    createPaginatedResponse([], 1, 0, 0, 10)
  ),
  
  // Cached response
  CACHED: createHttpResponse<Record<string, any>>(
    { id: '123', name: 'Cached Resource', timestamp: new Date().toISOString() },
    200,
    'OK',
    CACHEABLE_RESPONSE_HEADERS
  ),
  
  // CORS response
  CORS: createHttpResponse<Record<string, any>>(
    { id: '123', name: 'CORS Resource' },
    200,
    'OK',
    CORS_RESPONSE_HEADERS
  ),
  
  // Security headers response
  SECURE: createHttpResponse<Record<string, any>>(
    { id: '123', name: 'Secure Resource' },
    200,
    'OK',
    SECURITY_RESPONSE_HEADERS
  )
};

/**
 * Redirect Responses (3xx)
 */
export const RedirectResponses = {
  // 301 Moved Permanently
  MOVED_PERMANENTLY: createHttpResponse<null>(
    null,
    HttpStatusCode.MOVED_PERMANENTLY,
    'Moved Permanently',
    { ...REDIRECT_RESPONSE_HEADERS, 'Location': 'https://api.example.com/new-location' }
  ),
  
  // 302 Found
  FOUND: createHttpResponse<null>(
    null,
    HttpStatusCode.FOUND,
    'Found',
    { ...REDIRECT_RESPONSE_HEADERS, 'Location': 'https://api.example.com/temporary-redirect' }
  ),
  
  // 303 See Other
  SEE_OTHER: createHttpResponse<null>(
    null,
    HttpStatusCode.SEE_OTHER,
    'See Other',
    { ...REDIRECT_RESPONSE_HEADERS, 'Location': 'https://api.example.com/see-other' }
  ),
  
  // 307 Temporary Redirect
  TEMPORARY_REDIRECT: createHttpResponse<null>(
    null,
    HttpStatusCode.TEMPORARY_REDIRECT,
    'Temporary Redirect',
    { ...REDIRECT_RESPONSE_HEADERS, 'Location': 'https://api.example.com/temp-redirect' }
  ),
  
  // 308 Permanent Redirect
  PERMANENT_REDIRECT: createHttpResponse<null>(
    null,
    HttpStatusCode.PERMANENT_REDIRECT,
    'Permanent Redirect',
    { ...REDIRECT_RESPONSE_HEADERS, 'Location': 'https://api.example.com/permanent-redirect' }
  )
};

/**
 * Client Error Responses (4xx)
 */
export const ClientErrorResponses = {
  // 400 Bad Request
  BAD_REQUEST: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('BAD_REQUEST', 'Invalid request parameters'),
    HttpStatusCode.BAD_REQUEST,
    'Bad Request',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 401 Unauthorized
  UNAUTHORIZED: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('UNAUTHORIZED', 'Authentication required'),
    HttpStatusCode.UNAUTHORIZED,
    'Unauthorized',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 403 Forbidden
  FORBIDDEN: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('FORBIDDEN', 'Insufficient permissions'),
    HttpStatusCode.FORBIDDEN,
    'Forbidden',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 404 Not Found
  NOT_FOUND: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('NOT_FOUND', 'Resource not found'),
    HttpStatusCode.NOT_FOUND,
    'Not Found',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 405 Method Not Allowed
  METHOD_NOT_ALLOWED: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed for this resource'),
    HttpStatusCode.METHOD_NOT_ALLOWED,
    'Method Not Allowed',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 409 Conflict
  CONFLICT: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('CONFLICT', 'Resource already exists'),
    HttpStatusCode.CONFLICT,
    'Conflict',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 422 Unprocessable Entity
  UNPROCESSABLE_ENTITY: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse(
      'VALIDATION_ERROR',
      'Validation failed',
      {
        fields: {
          'email': ['Invalid email format'],
          'password': ['Password must be at least 8 characters']
        }
      }
    ),
    HttpStatusCode.UNPROCESSABLE_ENTITY,
    'Unprocessable Entity',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 429 Too Many Requests
  TOO_MANY_REQUESTS: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded'),
    HttpStatusCode.TOO_MANY_REQUESTS,
    'Too Many Requests',
    RATE_LIMIT_EXCEEDED_HEADERS
  )
};

/**
 * Server Error Responses (5xx)
 */
export const ServerErrorResponses = {
  // 500 Internal Server Error
  INTERNAL_SERVER_ERROR: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'),
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    'Internal Server Error',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 501 Not Implemented
  NOT_IMPLEMENTED: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('NOT_IMPLEMENTED', 'This feature is not implemented yet'),
    HttpStatusCode.NOT_IMPLEMENTED,
    'Not Implemented',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 502 Bad Gateway
  BAD_GATEWAY: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('BAD_GATEWAY', 'Invalid response from upstream server'),
    HttpStatusCode.BAD_GATEWAY,
    'Bad Gateway',
    ERROR_RESPONSE_HEADERS
  ),
  
  // 503 Service Unavailable
  SERVICE_UNAVAILABLE: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('SERVICE_UNAVAILABLE', 'Service temporarily unavailable'),
    HttpStatusCode.SERVICE_UNAVAILABLE,
    'Service Unavailable',
    { ...ERROR_RESPONSE_HEADERS, 'Retry-After': '60' }
  ),
  
  // 504 Gateway Timeout
  GATEWAY_TIMEOUT: createHttpResponse<ApiErrorResponse>(
    createApiErrorResponse('GATEWAY_TIMEOUT', 'Upstream server timed out'),
    HttpStatusCode.GATEWAY_TIMEOUT,
    'Gateway Timeout',
    ERROR_RESPONSE_HEADERS
  )
};

/**
 * Journey-Specific Responses
 */
export const JourneyResponses = {
  // Health Journey
  HEALTH_METRICS: createJourneyResponse<Record<string, any>>(
    {
      userId: 'user123',
      metrics: [
        { type: 'steps', value: 8500, unit: 'count', timestamp: new Date().toISOString() },
        { type: 'heartRate', value: 72, unit: 'bpm', timestamp: new Date().toISOString() },
        { type: 'sleep', value: 7.5, unit: 'hours', timestamp: new Date().toISOString() }
      ]
    },
    'health',
    { userId: 'user123', healthMetricId: 'metric123' }
  ),
  
  HEALTH_GOALS: createJourneyResponse<Record<string, any>>(
    {
      userId: 'user123',
      goals: [
        { id: 'goal1', type: 'steps', target: 10000, progress: 8500, unit: 'count' },
        { id: 'goal2', type: 'weight', target: 70, progress: 72, unit: 'kg' }
      ]
    },
    'health',
    { userId: 'user123', goalId: 'goal1' }
  ),
  
  // Care Journey
  CARE_APPOINTMENTS: createJourneyResponse<Record<string, any>>(
    {
      userId: 'user123',
      appointments: [
        { id: 'appt1', providerId: 'dr123', type: 'checkup', date: '2023-06-15T10:00:00Z', status: 'confirmed' },
        { id: 'appt2', providerId: 'dr456', type: 'followup', date: '2023-07-01T14:30:00Z', status: 'scheduled' }
      ]
    },
    'care',
    { userId: 'user123', appointmentId: 'appt1' }
  ),
  
  CARE_PROVIDERS: createJourneyResponse<Record<string, any>>(
    {
      providers: [
        { id: 'dr123', name: 'Dr. Smith', specialty: 'Cardiology', rating: 4.8 },
        { id: 'dr456', name: 'Dr. Johnson', specialty: 'Dermatology', rating: 4.6 }
      ]
    },
    'care',
    { userId: 'user123' }
  ),
  
  // Plan Journey
  PLAN_BENEFITS: createJourneyResponse<Record<string, any>>(
    {
      userId: 'user123',
      planId: 'plan456',
      benefits: [
        { id: 'benefit1', type: 'medical', coverage: 90, limit: 10000 },
        { id: 'benefit2', type: 'dental', coverage: 80, limit: 2000 },
        { id: 'benefit3', type: 'vision', coverage: 70, limit: 500 }
      ]
    },
    'plan',
    { userId: 'user123', planId: 'plan456' }
  ),
  
  PLAN_CLAIMS: createJourneyResponse<Record<string, any>>(
    {
      userId: 'user123',
      claims: [
        { id: 'claim1', type: 'medical', amount: 500, status: 'approved', date: '2023-05-10T00:00:00Z' },
        { id: 'claim2', type: 'dental', amount: 200, status: 'pending', date: '2023-06-01T00:00:00Z' }
      ]
    },
    'plan',
    { userId: 'user123', claimId: 'claim1' }
  )
};

/**
 * Special Response Types
 */
export const SpecialResponses = {
  // Empty responses
  EMPTY_ARRAY: createHttpResponse<any[]>([]),
  EMPTY_OBJECT: createHttpResponse<Record<string, never>>({}),
  NULL_DATA: createHttpResponse<null>(null),
  
  // Non-standard content types
  CSV: createTypedResponse<string>(
    'id,name,email\n1,John Doe,john@example.com\n2,Jane Smith,jane@example.com',
    CONTENT_TYPES.CSV
  ),
  
  PDF: createTypedResponse<ArrayBuffer>(
    new ArrayBuffer(1024),
    CONTENT_TYPES.PDF
  ),
  
  // Malformed responses
  MALFORMED_JSON: createHttpResponse<string>(
    '{"data":"incomplete',
    200,
    'OK',
    { ...STANDARD_JSON_RESPONSE_HEADERS, 'Content-Type': CONTENT_TYPES.JSON }
  ),
  
  WRONG_CONTENT_TYPE: createHttpResponse<string>(
    '{"data":"complete but wrong content type"}',
    200,
    'OK',
    { ...STANDARD_JSON_RESPONSE_HEADERS, 'Content-Type': CONTENT_TYPES.TEXT }
  ),
  
  // Rate limited but successful
  RATE_LIMITED: createHttpResponse<Record<string, any>>(
    { id: '123', name: 'Rate Limited Resource' },
    200,
    'OK',
    RATE_LIMIT_RESPONSE_HEADERS
  )
};

/**
 * Utility function to check if a response is successful (2xx)
 */
export function isSuccessResponse(response: HttpResponse): boolean {
  return response.status >= 200 && response.status < 300;
}

/**
 * Utility function to check if a response is a redirect (3xx)
 */
export function isRedirectResponse(response: HttpResponse): boolean {
  return response.status >= 300 && response.status < 400;
}

/**
 * Utility function to check if a response is a client error (4xx)
 */
export function isClientErrorResponse(response: HttpResponse): boolean {
  return response.status >= 400 && response.status < 500;
}

/**
 * Utility function to check if a response is a server error (5xx)
 */
export function isServerErrorResponse(response: HttpResponse): boolean {
  return response.status >= 500 && response.status < 600;
}

/**
 * Utility function to check if a response is JSON
 */
export function isJsonResponse(response: HttpResponse): boolean {
  const contentType = response.headers['Content-Type'] || response.headers['content-type'];
  return contentType?.includes('application/json') || false;
}

/**
 * Utility function to check if a response is paginated
 */
export function isPaginatedResponse(response: HttpResponse): boolean {
  if (!isJsonResponse(response) || !isSuccessResponse(response)) {
    return false;
  }
  
  const data = response.data;
  return (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray(data.data) &&
    'meta' in data &&
    typeof data.meta === 'object' &&
    'currentPage' in data.meta &&
    'totalPages' in data.meta
  );
}

/**
 * Utility function to check if a response is a journey response
 */
export function isJourneyResponse(response: HttpResponse): boolean {
  const headers = response.headers;
  return !!(
    headers['X-Journey-ID'] || 
    headers['x-journey-id'] || 
    headers['X-Journey-Context'] || 
    headers['x-journey-context']
  );
}

/**
 * Utility function to get journey context from a response
 */
export function getJourneyContext(response: HttpResponse): JourneyContext | null {
  if (!isJourneyResponse(response)) {
    return null;
  }
  
  const journeyId = response.headers['X-Journey-ID'] || response.headers['x-journey-id'];
  const contextStr = response.headers['X-Journey-Context'] || response.headers['x-journey-context'];
  
  if (!journeyId) {
    return null;
  }
  
  let context: Record<string, any> = {};
  
  if (contextStr) {
    try {
      context = JSON.parse(contextStr as string);
    } catch (e) {
      // Invalid JSON in context header
      return null;
    }
  }
  
  return {
    journeyId: journeyId as string,
    userId: context.userId || '',
    sessionId: context.sessionId,
    ...context
  };
}
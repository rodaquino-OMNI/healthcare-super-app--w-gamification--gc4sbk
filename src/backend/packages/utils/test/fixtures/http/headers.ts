/**
 * HTTP Headers Test Fixtures
 * 
 * This module provides standardized collections of HTTP headers for testing request and response
 * processing in HTTP utilities. These fixtures enable consistent header handling tests throughout
 * the codebase and simplify test setup for HTTP-related functionality.
 */

/**
 * Standard request headers for testing HTTP client requests
 */
export interface RequestHeaders {
  [key: string]: string;
}

/**
 * Standard response headers for testing HTTP client responses
 */
export interface ResponseHeaders {
  [key: string]: string;
}

/**
 * Common content type values for HTTP requests and responses
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  PDF: 'application/pdf',
  OCTET_STREAM: 'application/octet-stream',
  CSV: 'text/csv',
};

/**
 * Standard request headers for JSON API requests
 */
export const STANDARD_JSON_REQUEST_HEADERS: RequestHeaders = {
  'Content-Type': CONTENT_TYPES.JSON,
  'Accept': CONTENT_TYPES.JSON,
  'X-Request-ID': '00000000-0000-0000-0000-000000000000',
  'User-Agent': 'AUSTA-SuperApp-Test/1.0',
};

/**
 * Standard request headers with authorization token
 */
export const AUTHORIZED_REQUEST_HEADERS: RequestHeaders = {
  ...STANDARD_JSON_REQUEST_HEADERS,
  'Authorization': 'Bearer test-jwt-token',
};

/**
 * Request headers with journey context for testing journey-specific functionality
 */
export const JOURNEY_REQUEST_HEADERS: RequestHeaders = {
  ...AUTHORIZED_REQUEST_HEADERS,
  'X-Journey-ID': 'health',  // One of: 'health', 'care', 'plan'
  'X-Journey-Context': '{"userId":"test-user-id","sessionId":"test-session-id"}',
};

/**
 * Request headers for multipart form data (file uploads)
 */
export const MULTIPART_REQUEST_HEADERS: RequestHeaders = {
  ...AUTHORIZED_REQUEST_HEADERS,
  'Content-Type': CONTENT_TYPES.MULTIPART,
  'Content-Length': '1024',
};

/**
 * Request headers for form submissions
 */
export const FORM_REQUEST_HEADERS: RequestHeaders = {
  ...AUTHORIZED_REQUEST_HEADERS,
  'Content-Type': CONTENT_TYPES.FORM,
};

/**
 * Request headers with pagination parameters
 */
export const PAGINATED_REQUEST_HEADERS: RequestHeaders = {
  ...STANDARD_JSON_REQUEST_HEADERS,
  'X-Page': '1',
  'X-Per-Page': '10',
  'X-Sort-By': 'createdAt',
  'X-Sort-Direction': 'desc',
};

/**
 * Request headers with cache control directives
 */
export const CACHE_CONTROL_REQUEST_HEADERS: RequestHeaders = {
  ...STANDARD_JSON_REQUEST_HEADERS,
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

/**
 * Request headers for conditional requests
 */
export const CONDITIONAL_REQUEST_HEADERS: RequestHeaders = {
  ...STANDARD_JSON_REQUEST_HEADERS,
  'If-Modified-Since': 'Wed, 21 Oct 2023 07:28:00 GMT',
  'If-None-Match': '"737060cd8c284d8af7ad3082f209582d"',
};

/**
 * Standard response headers for successful JSON responses
 */
export const STANDARD_JSON_RESPONSE_HEADERS: ResponseHeaders = {
  'Content-Type': CONTENT_TYPES.JSON,
  'Content-Length': '1024',
  'X-Request-ID': '00000000-0000-0000-0000-000000000000',
  'X-Response-Time': '42ms',
};

/**
 * Response headers with CORS configuration
 */
export const CORS_RESPONSE_HEADERS: ResponseHeaders = {
  ...STANDARD_JSON_RESPONSE_HEADERS,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

/**
 * Response headers with caching directives
 */
export const CACHEABLE_RESPONSE_HEADERS: ResponseHeaders = {
  ...STANDARD_JSON_RESPONSE_HEADERS,
  'Cache-Control': 'public, max-age=3600',
  'ETag': '"737060cd8c284d8af7ad3082f209582d"',
  'Last-Modified': 'Wed, 21 Oct 2023 07:28:00 GMT',
};

/**
 * Response headers for non-cacheable responses
 */
export const NON_CACHEABLE_RESPONSE_HEADERS: ResponseHeaders = {
  ...STANDARD_JSON_RESPONSE_HEADERS,
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * Response headers for redirects
 */
export const REDIRECT_RESPONSE_HEADERS: ResponseHeaders = {
  'Location': 'https://api.austa.health/v1/new-location',
  'Content-Length': '0',
};

/**
 * Response headers for error responses
 */
export const ERROR_RESPONSE_HEADERS: ResponseHeaders = {
  'Content-Type': CONTENT_TYPES.JSON,
  'Content-Length': '256',
  'X-Error-Code': 'VALIDATION_ERROR',
  'X-Error-Message': 'Invalid input parameters',
};

/**
 * Security headers for responses
 */
export const SECURITY_RESPONSE_HEADERS: ResponseHeaders = {
  ...STANDARD_JSON_RESPONSE_HEADERS,
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Headers for testing SSRF protection
 */
export const SSRF_TEST_HEADERS: RequestHeaders = {
  ...STANDARD_JSON_REQUEST_HEADERS,
  'X-Forwarded-For': '127.0.0.1',
  'X-Forwarded-Host': 'localhost',
};

/**
 * Headers for testing rate limiting
 */
export const RATE_LIMIT_RESPONSE_HEADERS: ResponseHeaders = {
  ...STANDARD_JSON_RESPONSE_HEADERS,
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '99',
  'X-RateLimit-Reset': '1635739200',
};

/**
 * Headers for rate limit exceeded responses
 */
export const RATE_LIMIT_EXCEEDED_HEADERS: ResponseHeaders = {
  'Content-Type': CONTENT_TYPES.JSON,
  'Content-Length': '256',
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '0',
  'X-RateLimit-Reset': '1635739200',
  'Retry-After': '60',
};

/**
 * Journey-specific response headers for health journey
 */
export const HEALTH_JOURNEY_HEADERS: ResponseHeaders = {
  ...STANDARD_JSON_RESPONSE_HEADERS,
  'X-Journey-ID': 'health',
  'X-Journey-Context': '{"userId":"test-user-id","healthMetricId":"test-metric-id"}',
};

/**
 * Journey-specific response headers for care journey
 */
export const CARE_JOURNEY_HEADERS: ResponseHeaders = {
  ...STANDARD_JSON_RESPONSE_HEADERS,
  'X-Journey-ID': 'care',
  'X-Journey-Context': '{"userId":"test-user-id","appointmentId":"test-appointment-id"}',
};

/**
 * Journey-specific response headers for plan journey
 */
export const PLAN_JOURNEY_HEADERS: ResponseHeaders = {
  ...STANDARD_JSON_RESPONSE_HEADERS,
  'X-Journey-ID': 'plan',
  'X-Journey-Context': '{"userId":"test-user-id","planId":"test-plan-id"}',
};

/**
 * Headers for testing distributed tracing
 */
export const TRACING_HEADERS: RequestHeaders = {
  ...STANDARD_JSON_REQUEST_HEADERS,
  'X-Trace-ID': '1234567890abcdef1234567890abcdef',
  'X-Span-ID': 'abcdef1234567890',
  'X-Parent-Span-ID': '0987654321fedcba',
};

/**
 * Headers for testing gamification event processing
 */
export const GAMIFICATION_EVENT_HEADERS: RequestHeaders = {
  ...STANDARD_JSON_REQUEST_HEADERS,
  'X-Event-Type': 'achievement.unlocked',
  'X-Event-Source': 'health-service',
  'X-Event-Version': '1.0',
};

/**
 * Creates custom request headers by extending standard headers
 * 
 * @param customHeaders - Custom headers to add or override
 * @param baseHeaders - Base headers to extend (defaults to STANDARD_JSON_REQUEST_HEADERS)
 * @returns Combined headers object
 */
export function createRequestHeaders(
  customHeaders: Record<string, string>,
  baseHeaders: RequestHeaders = STANDARD_JSON_REQUEST_HEADERS
): RequestHeaders {
  return {
    ...baseHeaders,
    ...customHeaders,
  };
}

/**
 * Creates custom response headers by extending standard headers
 * 
 * @param customHeaders - Custom headers to add or override
 * @param baseHeaders - Base headers to extend (defaults to STANDARD_JSON_RESPONSE_HEADERS)
 * @returns Combined headers object
 */
export function createResponseHeaders(
  customHeaders: Record<string, string>,
  baseHeaders: ResponseHeaders = STANDARD_JSON_RESPONSE_HEADERS
): ResponseHeaders {
  return {
    ...baseHeaders,
    ...customHeaders,
  };
}
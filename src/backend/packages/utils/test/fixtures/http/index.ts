/**
 * @file HTTP Test Fixtures Barrel File
 * @description Centralizes access to all HTTP-related test fixtures for simplified imports and consistent testing patterns.
 * This file exports URL fixtures, request/response objects, headers, error scenarios, and query parameters
 * to support comprehensive testing of HTTP utilities across the codebase.
 */

/**
 * URL Fixtures
 * @description URL fixtures for testing SSRF protection and URL validation
 */
import * as UrlFixtures from './urls';
export { UrlFixtures };

/**
 * Request Object Fixtures
 * @description Mock HTTP request objects with varying configurations for testing HTTP client utilities
 */
import * as RequestFixtures from './request-objects';
export { RequestFixtures };

/**
 * Response Object Fixtures
 * @description Mock HTTP response objects with various status codes, headers, and body formats
 */
import * as ResponseFixtures from './response-objects';
export { ResponseFixtures };

/**
 * HTTP Header Fixtures
 * @description Standardized collections of HTTP headers for testing request and response processing
 */
import * as HeaderFixtures from './headers';
export { HeaderFixtures };

/**
 * HTTP Error Fixtures
 * @description Mock HTTP error scenarios and error objects for testing error handling
 */
import * as ErrorFixtures from './errors';
export { ErrorFixtures };

/**
 * Query Parameter Fixtures
 * @description Test fixtures for URL query parameters with various formats and encoding scenarios
 */
import * as QueryParamFixtures from './query-params';
export { QueryParamFixtures };

// Re-export specific types for easier access

// URL Types
export type { UrlFixtures as UrlFixtureType, CategorizedUrlFixtures } from './urls';

// Request Types
export type { MockRequestObject } from './request-objects';

// Response Types
export type {
  HttpResponse,
  PaginationMeta,
  PaginatedResponse,
  ApiErrorResponse,
  JourneyContext
} from './response-objects';

// Header Types
export type { RequestHeaders, ResponseHeaders } from './headers';

// Error Types
export type {
  HttpErrorResponse,
  NetworkErrorData,
  ValidationErrorData,
  RateLimitErrorData
} from './errors';
export { HttpStatusCode, ErrorCategory } from './errors';

// Query Parameter Types
export type {
  SimpleQueryParams,
  ComplexQueryParams,
  EncodedQueryParams
} from './query-params';

/**
 * Convenience functions for common test fixture needs
 */
export const Fixtures = {
  /**
   * Get a request object by ID
   * @param id - The ID of the request object to retrieve
   * @returns The request object with the specified ID, or undefined if not found
   */
  getRequestById: RequestFixtures.getRequestById,

  /**
   * Create a modified copy of a request object
   * @param id - The ID of the request object to modify
   * @param modifications - The modifications to apply to the request object
   * @returns A new request object with the modifications applied
   */
  createModifiedRequest: RequestFixtures.createModifiedRequest,

  /**
   * Create a mock Axios response
   * @param data - The response data
   * @param status - The HTTP status code (default: 200)
   * @param statusText - The HTTP status text (default: 'OK')
   * @param headers - The response headers (default: standard JSON headers)
   * @param config - The request configuration
   * @param request - The request object
   * @returns A mock Axios response
   */
  createAxiosResponse: ResponseFixtures.createAxiosResponse,

  /**
   * Create a mock HTTP response
   * @param data - The response data
   * @param status - The HTTP status code (default: 200)
   * @param statusText - The HTTP status text (default: 'OK')
   * @param headers - The response headers (default: standard JSON headers)
   * @returns A mock HTTP response
   */
  createHttpResponse: ResponseFixtures.createHttpResponse,

  /**
   * Create a paginated response
   * @param items - The items to include in the response
   * @param currentPage - The current page number (default: 1)
   * @param totalPages - The total number of pages (default: 1)
   * @param totalItems - The total number of items (default: items.length)
   * @param itemsPerPage - The number of items per page (default: 10)
   * @returns A paginated response
   */
  createPaginatedResponse: ResponseFixtures.createPaginatedResponse,

  /**
   * Create an API error response
   * @param code - The error code
   * @param message - The error message
   * @param details - Additional error details
   * @param path - The request path (default: '/resource')
   * @param requestId - The request ID (default: UUID)
   * @returns An API error response
   */
  createApiErrorResponse: ResponseFixtures.createApiErrorResponse,

  /**
   * Create a journey-specific response
   * @param data - The response data
   * @param journeyId - The journey ID ('health', 'care', or 'plan')
   * @param context - Additional journey context
   * @param status - The HTTP status code (default: 200)
   * @returns A journey-specific HTTP response
   */
  createJourneyResponse: ResponseFixtures.createJourneyResponse,

  /**
   * Create custom request headers
   * @param customHeaders - Custom headers to add or override
   * @param baseHeaders - Base headers to extend (default: standard JSON headers)
   * @returns Combined headers object
   */
  createRequestHeaders: HeaderFixtures.createRequestHeaders,

  /**
   * Create custom response headers
   * @param customHeaders - Custom headers to add or override
   * @param baseHeaders - Base headers to extend (default: standard JSON headers)
   * @returns Combined headers object
   */
  createResponseHeaders: HeaderFixtures.createResponseHeaders,

  /**
   * Create a mock Axios error
   * @param message - The error message
   * @param code - The error code
   * @param config - The request configuration
   * @param request - The request object
   * @param response - The response object
   * @returns A mock Axios error
   */
  createAxiosError: ErrorFixtures.createAxiosError,

  /**
   * Create a mock HTTP error response
   * @param status - The HTTP status code
   * @param statusText - The HTTP status text
   * @param data - The response data
   * @param headers - The response headers
   * @param config - The request configuration
   * @returns A mock HTTP error response
   */
  createHttpErrorResponse: ErrorFixtures.createHttpErrorResponse,

  /**
   * Create a network error
   * @param code - The error code
   * @param message - The error message
   * @param details - Additional error details
   * @returns A mock network error
   */
  createNetworkError: ErrorFixtures.createNetworkError,

  /**
   * Create a timeout error
   * @param timeoutMs - The timeout in milliseconds (default: 30000)
   * @param url - The request URL (default: 'https://api.example.com/resource')
   * @returns A mock timeout error
   */
  createTimeoutError: ErrorFixtures.createTimeoutError,

  /**
   * Create a server error
   * @param status - The HTTP status code (default: 500)
   * @param message - The error message (default: 'Internal Server Error')
   * @param data - The response data
   * @returns A mock server error
   */
  createServerError: ErrorFixtures.createServerError,

  /**
   * Create a client error
   * @param status - The HTTP status code (default: 400)
   * @param message - The error message (default: 'Bad Request')
   * @param data - The response data
   * @returns A mock client error
   */
  createClientError: ErrorFixtures.createClientError,

  /**
   * Create a validation error
   * @param fields - The validation errors by field
   * @param message - The error message (default: 'Validation failed')
   * @returns A mock validation error
   */
  createValidationError: ErrorFixtures.createValidationError,

  /**
   * Create a rate limit error
   * @param retryAfter - The retry after time in seconds (default: 60)
   * @param limit - The rate limit (default: 100)
   * @param remaining - The remaining requests (default: 0)
   * @returns A mock rate limit error
   */
  createRateLimitError: ErrorFixtures.createRateLimitError,

  /**
   * Check if a response is successful (2xx)
   * @param response - The HTTP response to check
   * @returns True if the response is successful, false otherwise
   */
  isSuccessResponse: ResponseFixtures.isSuccessResponse,

  /**
   * Check if a response is a redirect (3xx)
   * @param response - The HTTP response to check
   * @returns True if the response is a redirect, false otherwise
   */
  isRedirectResponse: ResponseFixtures.isRedirectResponse,

  /**
   * Check if a response is a client error (4xx)
   * @param response - The HTTP response to check
   * @returns True if the response is a client error, false otherwise
   */
  isClientErrorResponse: ResponseFixtures.isClientErrorResponse,

  /**
   * Check if a response is a server error (5xx)
   * @param response - The HTTP response to check
   * @returns True if the response is a server error, false otherwise
   */
  isServerErrorResponse: ResponseFixtures.isServerErrorResponse,

  /**
   * Check if a response is JSON
   * @param response - The HTTP response to check
   * @returns True if the response is JSON, false otherwise
   */
  isJsonResponse: ResponseFixtures.isJsonResponse,

  /**
   * Check if a response is paginated
   * @param response - The HTTP response to check
   * @returns True if the response is paginated, false otherwise
   */
  isPaginatedResponse: ResponseFixtures.isPaginatedResponse,

  /**
   * Check if a response is a journey response
   * @param response - The HTTP response to check
   * @returns True if the response is a journey response, false otherwise
   */
  isJourneyResponse: ResponseFixtures.isJourneyResponse,

  /**
   * Get journey context from a response
   * @param response - The HTTP response to get context from
   * @returns The journey context, or null if not a journey response
   */
  getJourneyContext: ResponseFixtures.getJourneyContext,

  /**
   * Check if an error is a network error
   * @param error - The error to check
   * @returns True if the error is a network error, false otherwise
   */
  isNetworkError: ErrorFixtures.isNetworkError,

  /**
   * Check if an error is a timeout error
   * @param error - The error to check
   * @returns True if the error is a timeout error, false otherwise
   */
  isTimeoutError: ErrorFixtures.isTimeoutError,

  /**
   * Check if an error is a server error (5xx)
   * @param error - The error to check
   * @returns True if the error is a server error, false otherwise
   */
  isServerError: ErrorFixtures.isServerError,

  /**
   * Check if an error is a client error (4xx)
   * @param error - The error to check
   * @returns True if the error is a client error, false otherwise
   */
  isClientError: ErrorFixtures.isClientError,

  /**
   * Check if an error is a validation error
   * @param error - The error to check
   * @returns True if the error is a validation error, false otherwise
   */
  isValidationError: ErrorFixtures.isValidationError,

  /**
   * Check if an error is a rate limit error
   * @param error - The error to check
   * @returns True if the error is a rate limit error, false otherwise
   */
  isRateLimitError: ErrorFixtures.isRateLimitError,

  /**
   * Get retry delay from a rate limit error
   * @param error - The rate limit error
   * @returns The retry delay in milliseconds, or null if not applicable
   */
  getRetryDelay: ErrorFixtures.getRetryDelay,

  /**
   * Categorize an error
   * @param error - The error to categorize
   * @returns The error category
   */
  categorizeError: ErrorFixtures.categorizeError
};

/**
 * Commonly used fixture collections
 */
export const Collections = {
  /**
   * URL collections
   */
  Urls: {
    safe: UrlFixtures.SAFE_URLS,
    unsafe: UrlFixtures.UNSAFE_URLS,
    publicDomains: UrlFixtures.PUBLIC_DOMAIN_URLS,
    publicIpAddresses: UrlFixtures.PUBLIC_IP_ADDRESSES,
    privateIpRanges: UrlFixtures.PRIVATE_IP_RANGES,
    localhost: UrlFixtures.LOCALHOST_URLS,
    loopback: UrlFixtures.LOOPBACK_URLS,
    internalDomains: UrlFixtures.INTERNAL_DOMAIN_URLS,
    encodedUrls: UrlFixtures.ENCODED_URLS,
    edgeCases: UrlFixtures.EDGE_CASE_URLS,
    categorized: UrlFixtures.CATEGORIZED_URL_FIXTURES
  },

  /**
   * Request collections
   */
  Requests: {
    methods: RequestFixtures.HTTP_METHOD_REQUESTS,
    ssrfTests: RequestFixtures.SSRF_TEST_REQUESTS,
    contentTypes: RequestFixtures.CONTENT_TYPE_REQUESTS,
    retryTests: RequestFixtures.RETRY_TEST_REQUESTS,
    journeys: RequestFixtures.JOURNEY_SPECIFIC_REQUESTS,
    authentication: RequestFixtures.AUTHENTICATION_REQUESTS,
    configurations: RequestFixtures.CONFIGURATION_REQUESTS,
    all: RequestFixtures.ALL_REQUESTS
  },

  /**
   * Response collections
   */
  Responses: {
    success: ResponseFixtures.SuccessResponses,
    redirect: ResponseFixtures.RedirectResponses,
    clientError: ResponseFixtures.ClientErrorResponses,
    serverError: ResponseFixtures.ServerErrorResponses,
    journey: ResponseFixtures.JourneyResponses,
    special: ResponseFixtures.SpecialResponses
  },

  /**
   * Header collections
   */
  Headers: {
    contentTypes: HeaderFixtures.CONTENT_TYPES,
    standardJsonRequest: HeaderFixtures.STANDARD_JSON_REQUEST_HEADERS,
    authorizedRequest: HeaderFixtures.AUTHORIZED_REQUEST_HEADERS,
    journeyRequest: HeaderFixtures.JOURNEY_REQUEST_HEADERS,
    multipartRequest: HeaderFixtures.MULTIPART_REQUEST_HEADERS,
    formRequest: HeaderFixtures.FORM_REQUEST_HEADERS,
    paginatedRequest: HeaderFixtures.PAGINATED_REQUEST_HEADERS,
    cacheControlRequest: HeaderFixtures.CACHE_CONTROL_REQUEST_HEADERS,
    conditionalRequest: HeaderFixtures.CONDITIONAL_REQUEST_HEADERS,
    standardJsonResponse: HeaderFixtures.STANDARD_JSON_RESPONSE_HEADERS,
    corsResponse: HeaderFixtures.CORS_RESPONSE_HEADERS,
    cacheableResponse: HeaderFixtures.CACHEABLE_RESPONSE_HEADERS,
    nonCacheableResponse: HeaderFixtures.NON_CACHEABLE_RESPONSE_HEADERS,
    redirectResponse: HeaderFixtures.REDIRECT_RESPONSE_HEADERS,
    errorResponse: HeaderFixtures.ERROR_RESPONSE_HEADERS,
    securityResponse: HeaderFixtures.SECURITY_RESPONSE_HEADERS,
    ssrfTest: HeaderFixtures.SSRF_TEST_HEADERS,
    rateLimitResponse: HeaderFixtures.RATE_LIMIT_RESPONSE_HEADERS,
    rateLimitExceeded: HeaderFixtures.RATE_LIMIT_EXCEEDED_HEADERS,
    healthJourney: HeaderFixtures.HEALTH_JOURNEY_HEADERS,
    careJourney: HeaderFixtures.CARE_JOURNEY_HEADERS,
    planJourney: HeaderFixtures.PLAN_JOURNEY_HEADERS,
    tracing: HeaderFixtures.TRACING_HEADERS,
    gamificationEvent: HeaderFixtures.GAMIFICATION_EVENT_HEADERS
  },

  /**
   * Error collections
   */
  Errors: {
    network: {
      connectionRefused: ErrorFixtures.ErrorScenarios.NETWORK_CONNECTION_REFUSED,
      connectionReset: ErrorFixtures.ErrorScenarios.NETWORK_CONNECTION_RESET,
      dnsNotFound: ErrorFixtures.ErrorScenarios.NETWORK_DNS_NOT_FOUND,
      internetDisconnected: ErrorFixtures.ErrorScenarios.NETWORK_INTERNET_DISCONNECTED
    },
    timeout: {
      request: ErrorFixtures.ErrorScenarios.TIMEOUT_REQUEST,
      longRunning: ErrorFixtures.ErrorScenarios.TIMEOUT_LONG_RUNNING
    },
    server: {
      internalError: ErrorFixtures.ErrorScenarios.SERVER_INTERNAL_ERROR,
      badGateway: ErrorFixtures.ErrorScenarios.SERVER_BAD_GATEWAY,
      serviceUnavailable: ErrorFixtures.ErrorScenarios.SERVER_SERVICE_UNAVAILABLE,
      gatewayTimeout: ErrorFixtures.ErrorScenarios.SERVER_GATEWAY_TIMEOUT
    },
    client: {
      badRequest: ErrorFixtures.ErrorScenarios.CLIENT_BAD_REQUEST,
      unauthorized: ErrorFixtures.ErrorScenarios.CLIENT_UNAUTHORIZED,
      forbidden: ErrorFixtures.ErrorScenarios.CLIENT_FORBIDDEN,
      notFound: ErrorFixtures.ErrorScenarios.CLIENT_NOT_FOUND,
      methodNotAllowed: ErrorFixtures.ErrorScenarios.CLIENT_METHOD_NOT_ALLOWED
    },
    validation: {
      requiredFields: ErrorFixtures.ErrorScenarios.VALIDATION_REQUIRED_FIELDS,
      invalidFormat: ErrorFixtures.ErrorScenarios.VALIDATION_INVALID_FORMAT
    },
    rateLimit: {
      exceeded: ErrorFixtures.ErrorScenarios.RATE_LIMIT_EXCEEDED,
      longWait: ErrorFixtures.ErrorScenarios.RATE_LIMIT_LONG_WAIT
    },
    malformedResponse: {
      json: ErrorFixtures.ErrorScenarios.MALFORMED_JSON,
      contentType: ErrorFixtures.ErrorScenarios.MALFORMED_CONTENT_TYPE
    },
    cors: {
      originMismatch: ErrorFixtures.ErrorScenarios.CORS_ORIGIN_MISMATCH
    }
  },

  /**
   * Query parameter collections
   */
  QueryParams: {
    simple: QueryParamFixtures.simpleQueryParams,
    complex: QueryParamFixtures.complexQueryParams,
    specialCharacters: QueryParamFixtures.specialCharacterParams,
    encoded: QueryParamFixtures.encodedQueryParams,
    edgeCases: QueryParamFixtures.edgeCaseParams,
    journey: QueryParamFixtures.journeyQueryParams
  }
};

// Default export for easier imports
export default {
  UrlFixtures,
  RequestFixtures,
  ResponseFixtures,
  HeaderFixtures,
  ErrorFixtures,
  QueryParamFixtures,
  Fixtures,
  Collections
};
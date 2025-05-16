/**
 * @file index.ts
 * @description Barrel file that exports all HTTP-related test fixtures from the directory in a structured,
 * type-safe manner. It centralizes access to URL fixtures, request/response objects, headers, error scenarios,
 * and query parameters to simplify test implementation across the codebase.
 */

/**
 * URL fixtures for testing HTTP utilities, especially SSRF protection mechanisms.
 * @see {@link urlFixtures} for the complete collection of URL fixtures
 */
import urlFixtures, {
  UrlFixtures,
  safeUrls,
  unsafeUrls
} from './urls';

/**
 * Mock HTTP request objects for testing HTTP client utilities and interceptors.
 * @see {@link validRequestsByMethod} for request objects grouped by HTTP method
 * @see {@link ssrfBlockedRequests} for requests that should be blocked by SSRF protection
 * @see {@link contentTypeRequests} for requests with different content types
 * @see {@link specialConfigRequests} for requests with special configurations
 */
import {
  validGetRequest,
  validPostJsonRequest,
  validPutJsonRequest,
  validDeleteRequest,
  validPatchJsonRequest,
  privateIp10RangeRequest,
  privateIp172RangeRequest,
  privateIp192RangeRequest,
  localhostRequest,
  localhost127Request,
  localDomainRequest,
  ipv6LocalhostRequest,
  ipv6LinkLocalRequest,
  formUrlEncodedRequest,
  multipartFormDataRequest,
  textPlainRequest,
  xmlRequest,
  authHeaderRequest,
  journeyContextRequest,
  timeoutConfigRequest,
  queryParamsRequest,
  baseUrlRequest,
  binaryResponseRequest,
  validRequestsByMethod,
  ssrfBlockedRequests,
  contentTypeRequests,
  specialConfigRequests
} from './request-objects';

/**
 * Mock HTTP response objects with various status codes, headers, and body formats.
 * @see {@link successResponses} for 2xx status code responses
 * @see {@link redirectResponses} for 3xx status code responses
 * @see {@link clientErrorResponses} for 4xx status code responses
 * @see {@link serverErrorResponses} for 5xx status code responses
 * @see {@link journeyResponses} for journey-specific responses
 * @see {@link specialResponses} for special case responses
 * @see {@link responseFactories} for factory functions to create custom responses
 */
import {
  HttpResponseObject,
  HttpResponseFactory,
  createHttpResponse,
  createAxiosResponse,
  successResponses,
  redirectResponses,
  clientErrorResponses,
  serverErrorResponses,
  journeyResponses,
  specialResponses,
  responseFactories,
  allResponses
} from './response-objects';

/**
 * Standardized collections of HTTP headers for testing request and response processing.
 * @see {@link requestHeaders} for common request header collections
 * @see {@link responseHeaders} for common response header collections
 * @see {@link corsHeaders} for CORS-related headers
 * @see {@link securityHeaders} for security-related headers
 * @see {@link journeyHeaders} for journey-specific headers
 */
import {
  HttpHeaders,
  HttpHeadersWithArrays,
  contentTypes,
  acceptTypes,
  authorizationHeaders,
  userAgentHeaders,
  requestCacheHeaders,
  responseCacheHeaders,
  corsHeaders,
  securityHeaders,
  journeyHeaders,
  requestHeaders,
  responseHeaders,
  testScenarioHeaders,
  specialHeaders
} from './headers';

/**
 * Mock HTTP error scenarios and error objects for testing error handling.
 * @see {@link networkErrors} for network-related error test cases
 * @see {@link timeoutErrors} for timeout-related error test cases
 * @see {@link serverErrors} for server error (5xx) test cases
 * @see {@link clientErrors} for client error (4xx) test cases
 * @see {@link parseErrors} for parse error test cases
 * @see {@link journeyErrors} for journey-specific error test cases
 * @see {@link errorFactories} for factory functions to create custom errors
 */
import {
  HttpErrorTestCase,
  networkErrors,
  timeoutErrors,
  serverErrors,
  clientErrors,
  parseErrors,
  miscErrors,
  journeyErrors,
  circuitBreakerErrors,
  errorFactories,
  allErrors
} from './errors';

/**
 * Test fixtures for URL query parameters with various formats and encoding scenarios.
 * @see {@link simpleQueryParams} for basic key-value query parameters
 * @see {@link specialCharQueryParams} for query parameters with special characters
 * @see {@link arrayQueryParams} for query parameters with array values
 * @see {@link nestedQueryParams} for query parameters with nested objects
 * @see {@link complexQueryParams} for complex query parameter combinations
 * @see {@link urlExamples} for complete URL examples with query parameters
 */
import {
  simpleQueryParams,
  specialCharQueryParams,
  arrayQueryParams,
  nestedQueryParams,
  complexQueryParams,
  edgeCaseQueryParams,
  urlExamples,
  queryParamFactories
} from './query-params';

/**
 * Namespace for URL fixtures
 */
export const urls = {
  /** Complete collection of URL fixtures */
  fixtures: urlFixtures,
  /** Safe URLs that should pass SSRF protection */
  safe: safeUrls,
  /** Unsafe URLs that should be blocked by SSRF protection */
  unsafe: unsafeUrls
};

/**
 * Namespace for request object fixtures
 */
export const requests = {
  /** Valid request objects for different HTTP methods */
  valid: {
    get: validGetRequest,
    post: validPostJsonRequest,
    put: validPutJsonRequest,
    delete: validDeleteRequest,
    patch: validPatchJsonRequest,
    byMethod: validRequestsByMethod
  },
  /** Requests that should be blocked by SSRF protection */
  ssrfBlocked: ssrfBlockedRequests,
  /** Requests with different content types */
  contentTypes: contentTypeRequests,
  /** Requests with special configurations */
  specialConfig: specialConfigRequests,
  /** Individual request objects */
  individual: {
    formUrlEncoded: formUrlEncodedRequest,
    multipartFormData: multipartFormDataRequest,
    textPlain: textPlainRequest,
    xml: xmlRequest,
    authHeader: authHeaderRequest,
    journeyContext: journeyContextRequest,
    timeout: timeoutConfigRequest,
    queryParams: queryParamsRequest,
    baseUrl: baseUrlRequest,
    binaryResponse: binaryResponseRequest,
    privateIp10Range: privateIp10RangeRequest,
    privateIp172Range: privateIp172RangeRequest,
    privateIp192Range: privateIp192RangeRequest,
    localhost: localhostRequest,
    localhost127: localhost127Request,
    localDomain: localDomainRequest,
    ipv6Localhost: ipv6LocalhostRequest,
    ipv6LinkLocal: ipv6LinkLocalRequest
  }
};

/**
 * Namespace for response object fixtures
 */
export const responses = {
  /** Success response objects (2xx status codes) */
  success: successResponses,
  /** Redirect response objects (3xx status codes) */
  redirect: redirectResponses,
  /** Client error response objects (4xx status codes) */
  clientError: clientErrorResponses,
  /** Server error response objects (5xx status codes) */
  serverError: serverErrorResponses,
  /** Journey-specific response objects */
  journey: journeyResponses,
  /** Special case response objects */
  special: specialResponses,
  /** Factory functions for creating custom response objects */
  factories: responseFactories,
  /** All response objects grouped together */
  all: allResponses,
  /** Helper functions for creating response objects */
  create: {
    httpResponse: createHttpResponse,
    axiosResponse: createAxiosResponse
  }
};

/**
 * Namespace for header fixtures
 */
export const headers = {
  /** Common Content-Type header values */
  contentTypes,
  /** Common Accept header values */
  acceptTypes,
  /** Common Authorization header values */
  authorization: authorizationHeaders,
  /** Common User-Agent header values */
  userAgent: userAgentHeaders,
  /** Common Cache-Control header values for requests */
  requestCache: requestCacheHeaders,
  /** Common Cache-Control header values for responses */
  responseCache: responseCacheHeaders,
  /** Common CORS header values */
  cors: corsHeaders,
  /** Security-related header values */
  security: securityHeaders,
  /** Journey-specific header values */
  journey: journeyHeaders,
  /** Common request header collections for testing */
  request: requestHeaders,
  /** Common response header collections for testing */
  response: responseHeaders,
  /** Header collections for specific test scenarios */
  testScenarios: testScenarioHeaders,
  /** Headers with special characters or encoding challenges */
  special: specialHeaders
};

/**
 * Namespace for error fixtures
 */
export const errors = {
  /** Network-related error test cases */
  network: networkErrors,
  /** Timeout-related error test cases */
  timeout: timeoutErrors,
  /** Server error (5xx) test cases */
  server: serverErrors,
  /** Client error (4xx) test cases */
  client: clientErrors,
  /** Parse error test cases (malformed responses) */
  parse: parseErrors,
  /** Miscellaneous error test cases */
  misc: miscErrors,
  /** Journey-specific error test cases */
  journey: journeyErrors,
  /** Circuit breaker test cases */
  circuitBreaker: circuitBreakerErrors,
  /** Factory functions for generating custom HTTP error test cases */
  factories: errorFactories,
  /** All error test cases grouped together */
  all: allErrors
};

/**
 * Namespace for query parameter fixtures
 */
export const queryParams = {
  /** Simple key-value query parameters */
  simple: simpleQueryParams,
  /** Query parameters with special characters that require encoding */
  specialChars: specialCharQueryParams,
  /** Query parameters with array values */
  arrays: arrayQueryParams,
  /** Query parameters with nested objects */
  nested: nestedQueryParams,
  /** Complex query parameter combinations */
  complex: complexQueryParams,
  /** Edge cases for query parameters */
  edgeCases: edgeCaseQueryParams,
  /** Complete URL examples with query parameters */
  urlExamples,
  /** Factory functions for generating test query parameters */
  factories: queryParamFactories
};

/**
 * Export types for better TypeScript integration
 */
export type {
  UrlFixtures,
  HttpResponseObject,
  HttpResponseFactory,
  HttpHeaders,
  HttpHeadersWithArrays,
  HttpErrorTestCase
};

/**
 * Default export with all HTTP test fixtures
 */
export default {
  urls,
  requests,
  responses,
  headers,
  errors,
  queryParams
};
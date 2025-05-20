/**
 * @file HTTP utilities barrel export file
 * @description Provides a unified public API for all HTTP utilities in the @austa/utils/http package.
 * This file re-exports all functions and types from the individual utility files with a clean interface
 * that enables importing multiple utilities with a single import statement.
 */

/**
 * Secure Axios utilities for creating HTTP clients with SSRF protections
 * @module secure-axios
 */
export { 
  createSecureAxios,
  createInternalApiClient
} from './secure-axios';

/**
 * Retry mechanism utilities for HTTP requests with exponential backoff
 * @module retry
 */
export {
  createRetryableAxios,
  retryRequest,
  DEFAULT_RETRY_POLICY,
  AGGRESSIVE_RETRY_POLICY,
  MINIMAL_RETRY_POLICY
} from './retry';

/**
 * Circuit breaker pattern implementation for preventing cascading failures
 * @module circuit-breaker
 */
export {
  createCircuitBreakerAxios,
  CLOSED,
  OPEN,
  HALF_OPEN
} from './circuit-breaker';

/**
 * Request helper utilities for standardizing HTTP request operations
 * @module request-helpers
 */
export {
  addAuthHeader,
  addJourneyContext,
  sanitizeRequestUrl,
  validateRequestParams,
  logRequest
} from './request-helpers';

/**
 * Response helper utilities for standardizing HTTP response processing
 * @module response-helpers
 */
export {
  parseErrorResponse,
  extractPaginationData,
  validateResponseSchema,
  sanitizeResponseData,
  logResponse
} from './response-helpers';
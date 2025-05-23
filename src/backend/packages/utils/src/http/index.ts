/**
 * @file HTTP Utilities Index
 * @description Barrel file that exports all HTTP utility functions from specialized modules.
 */

// Export from client module
export { createHttpClient } from './client';

// Export from internal module
export { createInternalApiClient } from './internal';

// Export from security module
export { createSecureHttpClient } from './security';

// Export from retry module
export {
  createRetryableAxios,
  createRetryableInternalApiClient,
  retryRequest,
  calculateBackoffDelay,
  isRetryableError,
  DEFAULT_RETRY_POLICY,
  AGGRESSIVE_RETRY_POLICY,
  MINIMAL_RETRY_POLICY,
  type RetryPolicy,
  type RetryOptions,
  type RetryableAxiosOptions
} from './retry';

// Export from response-helpers module
export {
  parseErrorResponse,
  extractPaginationData,
  validateResponseSchema,
  sanitizeResponseData,
  logResponse,
  type PaginationMetadata,
  type PaginationExtractionOptions,
  type SanitizeOptions,
  type LogResponseOptions
} from '../../http/response-helpers';
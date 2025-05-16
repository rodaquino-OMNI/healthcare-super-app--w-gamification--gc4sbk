/**
 * @file Central export point for all HTTP-related test fixtures.
 * 
 * This barrel file provides a single import point for all HTTP test fixtures, including
 * headers, request/response objects, URLs, query parameters, and error scenarios.
 * It enables consistent and simplified importing of fixtures across all HTTP-related tests
 * while maintaining proper TypeScript typing for improved developer experience.
 * 
 * @example
 * // Import all HTTP fixtures
 * import * as httpFixtures from '@austa/utils/test/fixtures/http';
 * 
 * // Import specific HTTP fixture categories
 * import { headers, urls } from '@austa/utils/test/fixtures/http';
 * 
 * // Import specific fixtures directly
 * import { requestHeaders, responseHeaders } from '@austa/utils/test/fixtures/http';
 */

// Headers fixtures
export * from './headers';
export { default as headers } from './headers';

// Query parameters fixtures
export * from './query-params';
export { default as queryParams } from './query-params';

// Error fixtures
export * from './errors';
export { default as errors } from './errors';

// Response object fixtures
export * from './response-objects';
export { default as responseObjects } from './response-objects';

// Request object fixtures
export * from './request-objects';
export { default as requestObjects } from './request-objects';

// URL fixtures
export * from './urls';
export { default as urls } from './urls';

/**
 * Comprehensive collection of all HTTP test fixtures organized by category.
 * This object provides a structured way to access all HTTP fixtures when needed as a group.
 */
export const httpFixtures = {
  headers,
  queryParams,
  errors,
  responseObjects,
  requestObjects,
  urls
};

/**
 * @typedef {Object} HttpFixtureCollection
 * @property {typeof headers} headers - HTTP header test fixtures
 * @property {typeof queryParams} queryParams - URL query parameter test fixtures
 * @property {typeof errors} errors - HTTP error scenario test fixtures
 * @property {typeof responseObjects} responseObjects - HTTP response object test fixtures
 * @property {typeof requestObjects} requestObjects - HTTP request object test fixtures
 * @property {typeof urls} urls - URL test fixtures for HTTP clients
 */

// Type declaration for the httpFixtures object to improve IDE support
export type HttpFixtureCollection = typeof httpFixtures;

// Default export for simplified importing
export default httpFixtures;
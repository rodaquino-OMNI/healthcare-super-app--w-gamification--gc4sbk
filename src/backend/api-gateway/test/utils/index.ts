/**
 * API Gateway Test Utilities
 * 
 * This barrel file exports all test utilities from the utils folder,
 * enabling cleaner imports in test files. Instead of importing each utility
 * individually, developers can import all needed utilities from this single entry point.
 * 
 * @example
 * // Instead of:
 * import { assertValidResponse } from './utils/response-assertions';
 * import { createTestApp } from './utils/test-app.factory';
 * 
 * // Use:
 * import { assertValidResponse, createTestApp } from './utils';
 * 
 * @module test/utils
 */

/**
 * Re-export all utilities from response-assertions.ts
 * These utilities help validate API Gateway responses in tests
 */
export * from './response-assertions';

/**
 * Re-export all utilities from journey-mock.ts
 * These utilities provide mock data for journey-specific tests
 */
export * from './journey-mock';

/**
 * Re-export all utilities from graphql-client.ts
 * These utilities simplify GraphQL operations in tests
 */
export * from './graphql-client';

/**
 * Re-export all utilities from auth-helper.ts
 * These utilities provide authentication helpers for tests
 */
export * from './auth-helper';

/**
 * Re-export all utilities from test-app.factory.ts
 * These utilities help create and configure NestJS test applications
 */
export * from './test-app.factory';
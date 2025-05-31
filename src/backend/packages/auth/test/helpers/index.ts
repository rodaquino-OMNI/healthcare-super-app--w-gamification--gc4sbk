/**
 * @file Authentication Test Helpers
 * @description Centralized exports for all authentication testing utilities.
 * This barrel file provides a single import point for all auth test helpers,
 * improving code organization and developer experience.
 */

/**
 * Authentication test constants and predefined test data
 * @module TestConstants
 */
export * from './test-constants.helper';

/**
 * Mock implementations of authentication providers and services
 * @module MockAuthProviders
 */
export * from './mock-auth-providers.helper';

/**
 * Database utilities for authentication testing
 * @module TestDatabase
 */
export * from './test-database.helper';

/**
 * Assertion utilities for verifying authentication states
 * @module AuthAssertions
 */
export * from './auth-assertion.helper';

/**
 * Utilities for creating authenticated HTTP requests
 * @module AuthRequest
 */
export * from './auth-request.helper';

/**
 * JWT token generation utilities for testing
 * @module JwtToken
 */
export * from './jwt-token.helper';
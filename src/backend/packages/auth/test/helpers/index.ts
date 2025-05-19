/**
 * @austa/auth test helpers
 * 
 * Centralized collection of test utilities for authentication testing across the AUSTA SuperApp.
 * These helpers provide standardized utilities for creating test tokens, mocking authentication
 * providers, setting up test database state, and verifying authentication in tests.
 * 
 * @packageDocumentation
 */

/**
 * Authentication assertion utilities for verifying authentication and authorization states in tests.
 * Provides fluent assertion methods for checking permissions, roles, and authorization status.
 * 
 * @example
 * // Verify a user has the required permissions
 * assertUserHasPermissions(response, ['read:users', 'write:users']);
 * 
 * @module auth-assertion
 */
export * from './auth-assertion.helper';

/**
 * Authentication request utilities for creating HTTP request objects with authentication data.
 * Provides functions to create mock requests with different authentication methods and contexts.
 * 
 * @example
 * // Create a mock authenticated request with a bearer token
 * const req = mockAuthenticatedRequest({ userId: '123', permissions: ['read:users'] });
 * 
 * @module auth-request
 */
export * from './auth-request.helper';

/**
 * JWT token utilities for generating test tokens with customizable claims and payloads.
 * Supports creating tokens with different expiration times, permissions, and validation states.
 * 
 * @example
 * // Generate a test token with custom claims
 * const token = generateTestToken({ userId: '123', permissions: ['read:users'] });
 * 
 * @module jwt-token
 */
export * from './jwt-token.helper';

/**
 * Mock authentication providers for isolated testing of components that depend on auth services.
 * Provides NestJS-compatible mock providers with configurable behaviors for different test scenarios.
 * 
 * @example
 * // Create a mock JWT service that always validates tokens
 * const mockJwtService = createMockJwtService({ validateAlways: true });
 * 
 * @module mock-auth-providers
 */
export * from './mock-auth-providers.helper';

/**
 * Test constants for authentication testing, providing standardized test data and configurations.
 * Centralizes shared test values like default users, permission sets, and secret keys.
 * 
 * @example
 * // Use a predefined test admin user
 * const { adminUser } = TEST_USERS;
 * 
 * @module test-constants
 */
export * from './test-constants.helper';

/**
 * Test database utilities for setting up and manipulating database state for authentication tests.
 * Provides factory functions, seeding utilities, and cleanup functions for test isolation.
 * 
 * @example
 * // Create a test user with specific permissions
 * const user = await createTestUser({ permissions: ['read:users'] });
 * 
 * @module test-database
 */
export * from './test-database.helper';
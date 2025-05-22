/**
 * @file Error Testing Helpers
 * 
 * This barrel file centralizes exports from all error testing utilities, providing a single
 * entry point for importing error testing helpers across the AUSTA SuperApp codebase.
 * 
 * Organized by category, these utilities simplify testing of error handling, validation,
 * and recovery mechanisms across all journey services.
 * 
 * @example
 * // Import specific categories of helpers
 * import { createBusinessError, toBeErrorType, mockErrorFilter } from '@austa/errors/test/helpers';
 * 
 * // Or import everything
 * import * as ErrorTestHelpers from '@austa/errors/test/helpers';
 */

//-----------------------------------------------------------------------------
// Factory Functions
//-----------------------------------------------------------------------------

/**
 * Error factory functions for creating test error instances with specific properties.
 * These utilities simplify testing by allowing developers to quickly generate
 * journey-specific errors with customizable properties.
 * 
 * @example
 * // Create a validation error for the health journey
 * const error = createValidationError('Invalid health metric', 'HEALTH_001', { field: 'steps' });
 */
export * from './error-factory';

// Type exports for factory functions
export type { ErrorFactory, ErrorOptions, JourneyErrorContext } from './error-factory';

//-----------------------------------------------------------------------------
// Jest Matchers
//-----------------------------------------------------------------------------

/**
 * Custom Jest matchers that extend the assertion library for error-specific testing.
 * These matchers allow tests to verify error types, codes, properties, and response
 * structures with readable and expressive assertions.
 * 
 * @example
 * // Use custom matchers in tests
 * expect(error).toBeErrorType(ErrorType.VALIDATION);
 * expect(response).toMatchErrorResponse({ code: 'HEALTH_001' });
 */
export * from './test-matchers';

// Type exports for matchers
export type { ErrorMatcherOptions, ErrorResponseShape } from './test-matchers';

//-----------------------------------------------------------------------------
// Mock Implementations
//-----------------------------------------------------------------------------

/**
 * Mock implementations of error handlers, filters, and interceptors for testing.
 * These utilities provide controllable implementations of error handling components
 * that can be injected during tests to verify error processing flows.
 * 
 * @example
 * // Create and configure a mock error filter
 * const mockFilter = createMockExceptionFilter();
 * mockFilter.setResponse(HttpStatus.BAD_REQUEST, { error: 'Invalid input' });
 */
export * from './mock-error-handler';

// Type exports for mocks
export type { MockErrorHandler, MockExceptionFilter, ErrorInterceptorOptions } from './mock-error-handler';

//-----------------------------------------------------------------------------
// Network Error Simulation
//-----------------------------------------------------------------------------

/**
 * Utilities to simulate various network and external system errors for testing resilience.
 * These functions generate timeouts, connection failures, malformed responses, and other
 * error conditions that services might encounter when communicating with external systems.
 * 
 * @example
 * // Simulate a network timeout in a test
 * const errorFn = simulateNetworkTimeout(500); // 500ms timeout
 * await expect(errorFn(() => api.fetchData())).rejects.toThrow();
 */
export * from './network-error-simulator';

// Type exports for simulators
export type { NetworkErrorOptions, RetrySimulationOptions, CircuitBreakerTestOptions } from './network-error-simulator';

//-----------------------------------------------------------------------------
// Assertion Helpers
//-----------------------------------------------------------------------------

/**
 * Specialized assertion functions for verifying error handling behavior in different contexts.
 * These utilities provide higher-level assertions beyond custom Jest matchers, focusing on
 * validating error handling workflows, error transformation, and integration with other services.
 * 
 * @example
 * // Verify HTTP error response structure
 * await assertHttpErrorResponse(response, {
 *   status: HttpStatus.BAD_REQUEST,
 *   type: ErrorType.VALIDATION,
 *   code: 'HEALTH_001'
 * });
 */
export * from './assertion-helpers';

// Type exports for assertions
export type { HttpErrorAssertionOptions, ErrorRecoveryOptions, JourneyErrorAssertionOptions } from './assertion-helpers';
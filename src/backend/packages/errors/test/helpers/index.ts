/**
 * @file Error Testing Helpers
 * 
 * This barrel file centralizes exports from all error testing helpers,
 * simplifying imports in test files. By providing a single entry point
 * for all helper functions, classes, and matchers, this file reduces
 * import complexity and enables developers to easily access the full
 * suite of error testing utilities.
 *
 * @module errors/test/helpers
 */

// ===================================================================
// Error Factory Functions
// ===================================================================

/**
 * Factory functions for creating test error instances with specific properties.
 * These utilities simplify testing by allowing developers to quickly generate
 * journey-specific errors, business logic errors, validation errors, and
 * technical errors with customizable properties.
 * 
 * @example
 * // Create a validation error for the health journey
 * const error = createValidationError('Invalid health metric', 'HEALTH_001', { field: 'steps' });
 */
export * from './error-factory';

// Types for error factories
export type {
  ErrorFactoryOptions,
  JourneyErrorOptions,
  ErrorChainOptions
} from './error-factory';

// ===================================================================
// Custom Jest Matchers
// ===================================================================

/**
 * Custom Jest matchers that extend the assertion library for error-specific
 * testing scenarios. These matchers allow tests to verify error types, codes,
 * properties, and response structures with readable and expressive assertions.
 * 
 * @example
 * // In your test file
 * import { setupErrorMatchers } from '@austa/errors/test/helpers';
 * 
 * beforeAll(() => {
 *   setupErrorMatchers();
 * });
 * 
 * test('should throw a validation error', () => {
 *   expect(() => validateInput({})).toThrowErrorWithCode('VALIDATION_001');
 * });
 */
export * from './test-matchers';

// Types for custom matchers
export type {
  ErrorMatcherOptions,
  ErrorResponseShape,
  CustomMatchers
} from './test-matchers';

// ===================================================================
// Mock Error Handlers
// ===================================================================

/**
 * Mock implementations of error handlers, filters, and interceptors for
 * testing error processing flows. These utilities provide controllable
 * implementations of error handling components that can be injected during
 * tests to verify error propagation, transformation, and reporting.
 * 
 * @example
 * // Create a mock exception filter for testing
 * const mockFilter = createMockExceptionFilter();
 * 
 * // Use in a NestJS test
 * const moduleRef = await Test.createTestingModule({
 *   providers: [
 *     {
 *       provide: APP_FILTER,
 *       useValue: mockFilter
 *     }
 *   ]
 * }).compile();
 */
export * from './mock-error-handler';

// Types for mock handlers
export type {
  MockExceptionFilter,
  MockErrorInterceptor,
  ErrorHandlerConfig,
  RecordedError
} from './mock-error-handler';

// ===================================================================
// Network Error Simulators
// ===================================================================

/**
 * Utilities to simulate various network and external system errors for
 * testing resilience patterns. These functions generate timeouts,
 * connection failures, malformed responses, and other error conditions
 * that services might encounter when communicating with external systems.
 * 
 * @example
 * // Test a service with simulated network timeout
 * jest.spyOn(httpService, 'get').mockImplementation(() => 
 *   simulateNetworkTimeout(3000) // Simulates a 3 second timeout
 * );
 * 
 * // Test retry mechanism
 * jest.spyOn(httpService, 'get')
 *   .mockImplementationOnce(() => simulateConnectionFailure())
 *   .mockImplementationOnce(() => simulateConnectionFailure())
 *   .mockImplementationOnce(() => of({ data: expectedResponse }));
 */
export * from './network-error-simulator';

// Types for network simulators
export type {
  NetworkErrorSimulatorOptions,
  NetworkErrorType,
  CircuitBreakerTestConfig
} from './network-error-simulator';

// ===================================================================
// Assertion Helpers
// ===================================================================

/**
 * Specialized assertion functions for verifying error handling behavior
 * in different contexts. These utilities provide higher-level assertions
 * beyond the custom Jest matchers, focusing on validating error handling
 * workflows, error transformation, and integration with other services.
 * 
 * @example
 * // Verify HTTP response error structure
 * await assertHttpErrorResponse(response, {
 *   statusCode: 400,
 *   errorType: ErrorType.VALIDATION,
 *   errorCode: 'VALIDATION_001'
 * });
 * 
 * // Test error recovery mechanism
 * await assertErrorRecovery(async () => {
 *   await service.processWithRetry(invalidData);
 * }, {
 *   maxRetries: 3,
 *   recoveryResult: expectedResult
 * });
 */
export * from './assertion-helpers';

// Types for assertion helpers
export type {
  HttpErrorAssertionOptions,
  ErrorRecoveryOptions,
  JourneyErrorAssertionOptions
} from './assertion-helpers';
/**
 * @file Error Test Fixtures Index
 * 
 * This file serves as the central export point for all error test fixtures,
 * providing a clean API for importing test data in unit, integration, and e2e tests.
 * 
 * Fixtures are organized by category for better discoverability and include helper
 * functions to customize fixtures for specific test scenarios.
 */

// Re-export all fixtures from their respective files
import * as baseErrors from './base-errors';
import * as journeyErrors from './journey-errors';
import * as errorMetadata from './error-metadata';
import * as httpContexts from './http-contexts';
import * as nestContexts from './nest-contexts';
import * as retryScenarios from './retry-scenarios';

/**
 * Base error fixtures for testing core error functionality.
 * Includes standard instances of BaseError, ValidationError, BusinessError,
 * TechnicalError, ExternalSystemError, and NotFoundError with consistent
 * test properties.
 * 
 * @example
 * import { baseErrors } from '@austa/errors/test/fixtures';
 * 
 * // Use a pre-configured validation error
 * const { validationError } = baseErrors;
 * expect(validationError.statusCode).toBe(400);
 */
export { baseErrors };

/**
 * Journey-specific error fixtures for Health, Care, and Plan journeys.
 * Each journey has dedicated sample errors for common scenarios like
 * invalid metrics, device connection issues, provider unavailability,
 * appointment conflicts, claim data issues, and coverage verification failures.
 * 
 * @example
 * import { journeyErrors } from '@austa/errors/test/fixtures';
 * 
 * // Use a pre-configured health journey error
 * const { invalidHealthMetricError } = journeyErrors.health;
 * expect(invalidHealthMetricError.journey).toBe('health');
 */
export { journeyErrors };

/**
 * Error context and metadata fixtures for testing error enrichment,
 * transformation, and formatting. Provides sample user contexts,
 * request metadata, application states, and expected serialized outputs.
 * 
 * @example
 * import { errorMetadata } from '@austa/errors/test/fixtures';
 * 
 * // Use pre-configured user context
 * const { authenticatedUserContext } = errorMetadata;
 * expect(authenticatedUserContext.userId).toBeDefined();
 */
export { errorMetadata };

/**
 * HTTP context fixtures with mock request and response objects.
 * Includes various test scenarios like authenticated requests,
 * invalid input requests, and session-expired scenarios.
 * 
 * @example
 * import { httpContexts } from '@austa/errors/test/fixtures';
 * 
 * // Use a pre-configured HTTP request with authentication
 * const { authenticatedRequest, mockResponse } = httpContexts;
 * expect(authenticatedRequest.headers.authorization).toBeDefined();
 */
export { httpContexts };

/**
 * NestJS context fixtures with mock execution contexts, argument hosts,
 * and handler references. Contains fixtures for testing exception filters,
 * guards, interceptors, and custom decorators.
 * 
 * @example
 * import { nestContexts } from '@austa/errors/test/fixtures';
 * 
 * // Use a pre-configured NestJS HTTP context
 * const { httpExecutionContext } = nestContexts;
 * expect(httpExecutionContext.getType()).toBe('http');
 */
export { nestContexts };

/**
 * Retry scenario fixtures with sample transient errors and retry history objects.
 * Includes pre-configured common transient errors like network timeouts,
 * rate limiting, temporary unavailability, and database connection issues.
 * 
 * @example
 * import { retryScenarios } from '@austa/errors/test/fixtures';
 * 
 * // Use a pre-configured retry scenario
 * const { networkTimeoutScenario } = retryScenarios;
 * expect(networkTimeoutScenario.shouldRetry).toBe(true);
 */
export { retryScenarios };

// Helper functions for customizing fixtures

/**
 * Creates a custom error instance with specified properties.
 * Useful for creating test-specific error scenarios.
 * 
 * @param baseError - The base error to customize
 * @param customProps - Custom properties to add to the error
 * @returns A new error instance with custom properties
 * 
 * @example
 * import { createCustomError, baseErrors } from '@austa/errors/test/fixtures';
 * 
 * const customError = createCustomError(baseErrors.validationError, {
 *   field: 'email',
 *   constraint: 'isEmail',
 *   message: 'Invalid email format'
 * });
 */
export function createCustomError<T extends Error, P extends Record<string, any>>(
  baseError: T,
  customProps: P
): T & P {
  return Object.assign(Object.create(Object.getPrototypeOf(baseError)), baseError, customProps);
}

/**
 * Adds context information to an error instance.
 * Useful for testing context-aware error handling.
 * 
 * @param error - The error to add context to
 * @param context - The context information to add
 * @returns The error with added context
 * 
 * @example
 * import { withContext, baseErrors, errorMetadata } from '@austa/errors/test/fixtures';
 * 
 * const errorWithContext = withContext(
 *   baseErrors.validationError,
 *   errorMetadata.authenticatedUserContext
 * );
 */
export function withContext<T extends Error, C extends Record<string, any>>(
  error: T,
  context: C
): T & { context: C } {
  return createCustomError(error, { context });
}

/**
 * Adds metadata to an error instance.
 * Useful for testing error serialization and logging.
 * 
 * @param error - The error to add metadata to
 * @param metadata - The metadata to add
 * @returns The error with added metadata
 * 
 * @example
 * import { withMetadata, baseErrors } from '@austa/errors/test/fixtures';
 * 
 * const errorWithMetadata = withMetadata(baseErrors.validationError, {
 *   requestId: '123456',
 *   timestamp: new Date().toISOString(),
 *   source: 'test'
 * });
 */
export function withMetadata<T extends Error, M extends Record<string, any>>(
  error: T,
  metadata: M
): T & { metadata: M } {
  return createCustomError(error, { metadata });
}

/**
 * Configures retry information for an error instance.
 * Useful for testing retry mechanisms and policies.
 * 
 * @param error - The error to configure retry for
 * @param retryConfig - The retry configuration
 * @returns The error with retry configuration
 * 
 * @example
 * import { withRetryConfig, baseErrors } from '@austa/errors/test/fixtures';
 * 
 * const retriableError = withRetryConfig(baseErrors.technicalError, {
 *   retryable: true,
 *   maxRetries: 3,
 *   backoffFactor: 2,
 *   initialDelay: 100
 * });
 */
export function withRetryConfig<T extends Error, R extends Record<string, any>>(
  error: T,
  retryConfig: R
): T & { retry: R } {
  return createCustomError(error, { retry: retryConfig });
}

/**
 * Combines multiple fixture customization functions.
 * Useful for creating complex test scenarios.
 * 
 * @param error - The base error to customize
 * @param customizations - Functions to apply to the error
 * @returns The customized error
 * 
 * @example
 * import {
 *   compose,
 *   withContext,
 *   withMetadata,
 *   withRetryConfig,
 *   baseErrors,
 *   errorMetadata
 * } from '@austa/errors/test/fixtures';
 * 
 * const complexError = compose(
 *   baseErrors.technicalError,
 *   [  
 *     error => withContext(error, errorMetadata.authenticatedUserContext),
 *     error => withMetadata(error, { requestId: '123456' }),
 *     error => withRetryConfig(error, { retryable: true, maxRetries: 3 })
 *   ]
 * );
 */
export function compose<T extends Error>(
  error: T,
  customizations: Array<(error: any) => any>
): any {
  return customizations.reduce((acc, fn) => fn(acc), error);
}

// Export everything as a default object for convenience
export default {
  baseErrors,
  journeyErrors,
  errorMetadata,
  httpContexts,
  nestContexts,
  retryScenarios,
  createCustomError,
  withContext,
  withMetadata,
  withRetryConfig,
  compose
};
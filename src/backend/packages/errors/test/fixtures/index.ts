/**
 * @file Central export point for all error test fixtures
 * 
 * This file provides a clean API for importing test data in unit, integration, and e2e tests.
 * It organizes exports by category and provides helper functions to customize fixtures for
 * specific test scenarios.
 * 
 * @example
 * // Import all fixtures
 * import * as ErrorFixtures from '@austa/errors/test/fixtures';
 * 
 * // Import specific fixture categories
 * import { BaseErrors, JourneyErrors } from '@austa/errors/test/fixtures';
 * 
 * // Use helper functions to customize fixtures
 * import { createCustomError } from '@austa/errors/test/fixtures';
 */

// Export all base error fixtures
export * from './base-errors';

// Export error metadata fixtures
export * from './error-metadata';

// Export HTTP context fixtures
export * from './http-contexts';

// Export journey-specific error fixtures
export * from './journey-errors';

// Export NestJS context fixtures
export * from './nest-contexts';

// Export retry scenario fixtures
export * from './retry-scenarios';

// Organize exports by category for better discoverability
import * as BaseErrors from './base-errors';
import * as ErrorMetadata from './error-metadata';
import * as HttpContexts from './http-contexts';
import * as JourneyErrors from './journey-errors';
import * as NestContexts from './nest-contexts';
import * as RetryScenarios from './retry-scenarios';

/**
 * Categorized error fixtures for improved discoverability and organization.
 * 
 * @example
 * // Import the namespace
 * import { ErrorFixtures } from '@austa/errors/test';
 * 
 * // Use categorized fixtures
 * const { error } = ErrorFixtures.BaseErrors.validationError;
 * const { context } = ErrorFixtures.HttpContexts.authenticatedRequest;
 */
export const ErrorFixtures = {
  /**
   * Base error class instances for testing core error functionality.
   * Includes ValidationError, BusinessError, TechnicalError, and ExternalSystemError instances.
   */
  BaseErrors,

  /**
   * Error metadata, context, and serialization examples for testing error enrichment.
   * Provides sample user contexts, request metadata, and expected serialized outputs.
   */
  ErrorMetadata,

  /**
   * Mock HTTP request and response objects for testing error middleware and filters.
   * Includes various scenarios like authenticated requests and invalid input requests.
   */
  HttpContexts,

  /**
   * Journey-specific error instances for Health, Care, and Plan journeys.
   * Each journey has dedicated sample errors for common scenarios.
   */
  JourneyErrors,

  /**
   * Mock NestJS execution contexts for testing framework-specific error handling.
   * Contains fixtures for testing exception filters, guards, and interceptors.
   */
  NestContexts,

  /**
   * Sample retry scenarios and transient error patterns for testing retry mechanisms.
   * Includes pre-configured common transient errors with appropriate timing patterns.
   */
  RetryScenarios,
};

/**
 * Helper function to create a custom error instance with specific properties.
 * Useful for creating test-specific error scenarios.
 * 
 * @param baseError - The base error instance to customize
 * @param overrides - Properties to override in the base error
 * @returns A new error instance with the specified properties
 * 
 * @example
 * const customError = createCustomError(BaseErrors.validationError, {
 *   message: 'Custom validation message',
 *   code: 'CUSTOM_CODE',
 *   context: { userId: '123' }
 * });
 */
export function createCustomError<T extends Error>(baseError: T, overrides: Partial<T>): T {
  return { ...baseError, ...overrides };
}

/**
 * Helper function to create a journey-specific error with custom context.
 * 
 * @param journeyType - The journey type (Health, Care, Plan)
 * @param errorType - The type of error to create
 * @param customContext - Custom context to include in the error
 * @returns A journey-specific error instance
 * 
 * @example
 * const healthError = createJourneyError('Health', 'MetricValidation', {
 *   metricType: 'BloodPressure',
 *   value: '180/120',
 *   userId: '123'
 * });
 */
export function createJourneyError(
  journeyType: 'Health' | 'Care' | 'Plan',
  errorType: string,
  customContext: Record<string, any>
): Error {
  // Get the appropriate journey error factory based on the journey type
  const journeyErrors = JourneyErrors as any;
  const errorFactory = journeyErrors[`create${journeyType}Error`];
  
  if (!errorFactory) {
    throw new Error(`No error factory found for journey type: ${journeyType}`);
  }
  
  return errorFactory(errorType, customContext);
}

/**
 * Helper function to create an HTTP error response context for testing.
 * 
 * @param statusCode - The HTTP status code
 * @param errorInstance - The error instance to serialize
 * @returns A mock HTTP response with the serialized error
 * 
 * @example
 * const response = createErrorResponse(400, BaseErrors.validationError);
 * expect(response.status).toBe(400);
 * expect(response.body.code).toBe('VALIDATION_ERROR');
 */
export function createErrorResponse(
  statusCode: number,
  errorInstance: Error
): { status: number; body: any } {
  // Get the appropriate error serializer based on the error type
  const serializer = (errorInstance as any).serialize || (() => ({
    message: errorInstance.message,
    stack: errorInstance.stack,
  }));
  
  return {
    status: statusCode,
    body: serializer(),
  };
}

/**
 * Helper function to create a retry scenario with custom parameters.
 * 
 * @param errorType - The type of error that triggers retry
 * @param maxRetries - Maximum number of retry attempts
 * @param backoffFactor - Exponential backoff multiplier
 * @returns A configured retry scenario for testing
 * 
 * @example
 * const scenario = createRetryScenario('NetworkTimeout', 3, 2);
 * // Test retry logic with this scenario
 * retryWithExponentialBackoff(operation, scenario);
 */
export function createRetryScenario(
  errorType: string,
  maxRetries: number = 3,
  backoffFactor: number = 2
): any {
  const baseScenario = RetryScenarios.scenarios[errorType] || RetryScenarios.scenarios.default;
  
  return {
    ...baseScenario,
    maxRetries,
    backoffFactor,
    currentAttempt: 0,
  };
}
/**
 * @austa/errors
 * 
 * Comprehensive error handling framework for the AUSTA SuperApp that provides
 * standardized error classification, resilience patterns, and consistent error
 * responses across all services and journeys.
 *
 * This package serves as the central error handling solution for the entire
 * application, providing:
 * 
 * - Base error classes with enhanced context tracking
 * - Journey-specific error types for Health, Care, and Plan journeys
 * - Resilience patterns (retry, circuit breaker, fallback)
 * - NestJS integration (filters, interceptors, decorators)
 * - Express middleware for non-NestJS contexts
 * - Utility functions for error handling
 *
 * @example
 * // Import base error classes
 * import { BaseError, ErrorType } from '@austa/errors';
 *
 * // Import journey-specific errors
 * import { Health, Care, Plan } from '@austa/errors/journey';
 *
 * // Import resilience decorators
 * import { Retry, CircuitBreaker, Fallback } from '@austa/errors/decorators';
 *
 * // Import NestJS integration
 * import { ErrorsModule } from '@austa/errors/nest';
 */

// Core error types and base classes
export * from './base';
export * from './types';
export * from './constants';

// Re-export category-specific error classes
export * from './categories';

// Re-export journey-specific error namespaces
import * as Health from './journey/health';
import * as Care from './journey/care';
import * as Plan from './journey/plan';

// Export journey namespaces
export { Health, Care, Plan };

// Re-export decorator modules
import * as decorators from './decorators';
export { decorators };

// Re-export middleware modules
import * as middleware from './middleware';
export { middleware };

// Re-export NestJS integration
import * as nest from './nest';
export { nest };

// Re-export utility functions
import * as utils from './utils';
export { utils };

/**
 * Convenience exports for commonly used error types
 */

// Export commonly used error classes from categories
export { 
  ValidationError,
  MissingParameterError,
  InvalidParameterError,
  SchemaValidationError,
  InvalidCredentialsError
} from './categories/validation.errors';

export {
  BusinessError,
  ResourceNotFoundError,
  ResourceExistsError,
  BusinessRuleViolationError,
  ConflictError,
  InsufficientPermissionsError
} from './categories/business.errors';

export {
  TechnicalError,
  InternalServerError,
  DatabaseError,
  ConfigurationError,
  TimeoutError,
  ServiceUnavailableError
} from './categories/technical.errors';

export {
  ExternalError,
  ExternalApiError,
  IntegrationError,
  ExternalDependencyUnavailableError,
  ExternalAuthenticationError
} from './categories/external.errors';

// Export commonly used decorators
export {
  Retry,
  RetryWithBackoff,
  CircuitBreaker,
  WithFallback,
  Resilient,
  WithErrorContext
} from './decorators';

// Export NestJS module for easy import
export { ErrorsModule } from './nest/module';
export { GlobalExceptionFilter } from './nest/filters';

/**
 * @internal
 * These exports are for internal use only and may change without notice.
 * Do not use them directly in your application code.
 */
export const __internal = {
  utils,
  middleware,
  nest,
  decorators
};
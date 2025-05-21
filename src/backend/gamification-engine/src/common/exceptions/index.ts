/**
 * @file Common Exceptions Module Barrel Export
 * @description Centralized export file for all exception classes and utilities in the common exceptions module.
 * This file provides a clean and organized interface for importing exceptions throughout the application,
 * simplifying dependency management and improving code organization.
 */

// Import interfaces from @austa/interfaces package using standardized path aliases
import { 
  IErrorResponse, 
  IErrorContext, 
  IRetryPolicy, 
  ICircuitBreakerOptions 
} from '@austa/interfaces/common';

/**
 * Base Exception Classes
 * These abstract classes form the foundation of the exception hierarchy and should be
 * extended by more specific exception types rather than instantiated directly.
 */

/**
 * Base exception class that all other exceptions extend
 * Implements a consistent error structure with standardized properties
 */
export * from './app-exception.base';

/**
 * Base class for HTTP-specific exceptions
 * Maps internal error types to appropriate HTTP status codes
 */
export * from './http-exception.base';

/**
 * Base class for client error exceptions (HTTP 4xx)
 * Handles errors caused by client input with appropriate status codes
 */
export * from './client.exception';

/**
 * Base class for system error exceptions (HTTP 5xx)
 * Handles internal server errors and infrastructure issues
 */
export * from './system.exception';

/**
 * Base class for external dependency failure exceptions
 * Provides context for circuit breaker implementations and fallback strategies
 */
export * from './external-dependency.exception';

/**
 * Specialized Exception Classes
 * These concrete exception classes handle specific error scenarios and can be
 * instantiated directly when the corresponding error condition is detected.
 */

/**
 * Exception for validation failures in API requests and event payloads
 * Provides detailed field-specific validation errors
 */
export * from './validation.exception';

/**
 * Exception for resource not found scenarios
 * Handles cases where requested entities cannot be located
 */
export * from './not-found.exception';

/**
 * Exception for authentication and authorization failures
 * Handles invalid credentials, expired tokens, and insufficient permissions
 */
export * from './unauthorized.exception';

/**
 * Exception for database operation failures
 * Handles connection issues, query errors, and transaction failures
 */
export * from './database.exception';

/**
 * Exception for Kafka-related errors
 * Handles producer/consumer issues and message serialization failures
 */
export * from './kafka.exception';

/**
 * Exception for transient errors that can be retried
 * Implements retry count tracking and backoff calculation
 */
export * from './transient.exception';

/**
 * Utility Classes and Functions
 * These utilities provide exception handling infrastructure and support
 * for implementing resilience patterns throughout the application.
 */

/**
 * NestJS exception filter for global exception handling
 * Transforms exceptions into standardized HTTP responses
 */
export * from './exception.filter';

/**
 * Utility functions for implementing retry logic with exponential backoff
 * Provides configurable retry strategies and backoff calculations
 */
export * from './retry.utils';

/**
 * Utility class implementing the circuit breaker pattern
 * Provides state management and automatic recovery for external service calls
 */
export * from './circuit-breaker';

/**
 * Enumerations and Types
 * These exports define the type system for exceptions, providing consistent
 * error classification and metadata structures across all modules.
 */

/**
 * Error type enumerations and interfaces
 * Contains error codes, categories, and standardized metadata structures
 */
export * from './error-types.enum';

/**
 * Re-export error interfaces from @austa/interfaces for convenience
 */
export {
  IErrorResponse,
  IErrorContext,
  IRetryPolicy,
  ICircuitBreakerOptions
};

/**
 * Type representing all common exception classes
 * This type can be used for functions that need to handle any type of exception
 */
export type CommonException = 
  | import('./app-exception.base').AppExceptionBase
  | import('./client.exception').ClientException
  | import('./system.exception').SystemException
  | import('./external-dependency.exception').ExternalDependencyException
  | import('./validation.exception').ValidationException
  | import('./not-found.exception').NotFoundException
  | import('./unauthorized.exception').UnauthorizedException
  | import('./database.exception').DatabaseException
  | import('./kafka.exception').KafkaException
  | import('./transient.exception').TransientException;

/**
 * Re-export exceptions from other modules for centralized access
 * This allows consumers to import all exceptions from a single location
 */

/**
 * Event exceptions from the events module
 */
export * from '@app/events/exceptions';

/**
 * Achievement exceptions from the achievements module
 */
export * from '@app/achievements/exceptions';

/**
 * Default export for convenience when importing all exceptions
 * Example usage: import CommonExceptions from '@app/common/exceptions';
 */
export default {
  // Base exceptions
  AppExceptionBase: require('./app-exception.base').AppExceptionBase,
  HttpExceptionBase: require('./http-exception.base').HttpExceptionBase,
  ClientException: require('./client.exception').ClientException,
  SystemException: require('./system.exception').SystemException,
  ExternalDependencyException: require('./external-dependency.exception').ExternalDependencyException,
  
  // Specialized exceptions
  ValidationException: require('./validation.exception').ValidationException,
  NotFoundException: require('./not-found.exception').NotFoundException,
  UnauthorizedException: require('./unauthorized.exception').UnauthorizedException,
  DatabaseException: require('./database.exception').DatabaseException,
  KafkaException: require('./kafka.exception').KafkaException,
  TransientException: require('./transient.exception').TransientException,
  
  // Utilities
  GamificationExceptionFilter: require('./exception.filter').GamificationExceptionFilter,
  RetryUtils: require('./retry.utils'),
  CircuitBreaker: require('./circuit-breaker').CircuitBreaker,
  
  // Types and enums
  ErrorTypes: require('./error-types.enum')
};
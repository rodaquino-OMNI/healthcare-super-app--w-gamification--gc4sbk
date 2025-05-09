/**
 * @austa/errors/categories
 * 
 * This module exports all category-specific error classes from the AUSTA SuperApp
 * error handling framework. It provides a centralized access point for all validation,
 * business, technical, and external error types without requiring direct imports
 * from individual files.
 *
 * The error categories are organized by error type rather than by journey to promote
 * consistent error handling patterns across all services. Journey-specific error types
 * are available through the journey-specific modules.
 *
 * @example
 * // Import all error categories
 * import * as ErrorCategories from '@austa/errors/categories';
 *
 * // Import specific category
 * import { ValidationError, MissingParameterError } from '@austa/errors/categories';
 *
 * // Import from specific category file
 * import { BusinessError } from '@austa/errors/categories/business.errors';
 */

/**
 * Validation Errors
 * 
 * These errors represent input validation failures and typically map to
 * HTTP 400 Bad Request responses. They should be used when client input
 * fails to meet the expected format or constraints.
 *
 * @example
 * throw new ValidationError('Invalid input data', 'VALIDATION_001');
 * throw new MissingParameterError('userId');
 * throw new InvalidParameterError('email', 'must be a valid email address');
 */
export * from './validation.errors';

/**
 * Business Errors
 * 
 * These errors represent business rule violations and typically map to
 * HTTP 422 Unprocessable Entity responses. They should be used when an
 * operation cannot be completed due to business logic constraints.
 *
 * @example
 * throw new BusinessError('Cannot process request', 'BUSINESS_001');
 * throw new ResourceNotFoundError('User', userId);
 * throw new BusinessRuleViolationError('Appointment must be scheduled at least 24 hours in advance');
 */
export * from './business.errors';

/**
 * Technical Errors
 * 
 * These errors represent unexpected system failures and typically map to
 * HTTP 500 Internal Server Error responses. They should be used for internal
 * errors that are not directly related to client input or business rules.
 *
 * @example
 * throw new TechnicalError('Database connection failed', 'TECHNICAL_001');
 * throw new DatabaseError('Failed to execute query', 'SELECT_USER');
 * throw new ConfigurationError('Missing required environment variable', 'DATABASE_URL');
 */
export * from './technical.errors';

/**
 * External Errors
 * 
 * These errors represent failures in external systems or dependencies and
 * typically map to HTTP 502 Bad Gateway responses. They should be used when
 * an operation fails due to an external service or API.
 *
 * @example
 * throw new ExternalError('Payment gateway unavailable', 'EXTERNAL_001');
 * throw new ExternalApiError('Failed to fetch user data from API', 'USER_API', 500);
 * throw new ExternalDependencyUnavailableError('Payment service');
 */
export * from './external.errors';
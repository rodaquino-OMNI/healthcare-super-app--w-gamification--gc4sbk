/**
 * @file Error Categories Index
 * @description Barrel export file for all category-specific error classes.
 * This file centralizes access to all validation, business, technical, and external error types
 * without requiring direct imports from individual files.
 *
 * @example
 * // Import all error types from a single entry point
 * import { 
 *   ValidationError, 
 *   BusinessError, 
 *   TechnicalError, 
 *   ExternalError 
 * } from '@austa/errors';
 *
 * // Or import specific error types
 * import { 
 *   MissingParameterError, 
 *   ResourceNotFoundError, 
 *   DatabaseError, 
 *   ExternalApiError 
 * } from '@austa/errors';
 */

// Re-export all validation error types
export * from './validation.errors';

// Re-export all business error types
export * from './business.errors';

// Re-export all technical error types
export * from './technical.errors';

// Re-export all external error types
export * from './external.errors';
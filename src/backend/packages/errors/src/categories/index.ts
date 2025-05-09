/**
 * Error categories module.
 * 
 * This module provides specialized error classes organized by category type.
 * Each category contains error classes for specific error scenarios within that category.
 * 
 * @packageDocumentation
 */

// Export all validation errors
export * from './validation.errors';

// Export all business errors
export * from './business.errors';

// Export all technical errors
export * from './technical.errors';

// Export all external errors
export * from './external.errors';
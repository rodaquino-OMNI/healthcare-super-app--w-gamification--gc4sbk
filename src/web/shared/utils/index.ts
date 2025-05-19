/**
 * Utility Functions Index
 * 
 * This barrel file re-exports all utility functions from the utils directory,
 * providing a single point of import for all shared utilities used throughout
 * the AUSTA SuperApp web and mobile applications.
 *
 * @packageDocumentation
 */

// Re-export date utility functions with explicit named exports for better tree-shaking
export { formatRelativeDate, getAge, isValidDate } from './date';

// Re-export formatting utility functions with explicit named exports for better tree-shaking
export {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatCompactNumber,
  formatJourneyNumber,
  formatHealthMetric,
  truncateText,
  formatPhoneBR,
  maskCPF
} from './format';

// Re-export validation schemas and utilities with explicit named exports for better tree-shaking
export {
  // Hooks
  useClaimValidationSchema,
  useUserValidationSchema,
  useLoginValidationSchema,
  // Standalone schemas
  claimValidationSchema,
  userValidationSchema,
  loginValidationSchema,
  // Helper functions
  getValidationMessages,
  isNotEmpty,
  isValidCPF
} from './validation';

// Re-export constants from the constants module
// Note: Using path alias for better module resolution
export * from '@austa/shared/constants';

/**
 * Type Definitions
 * 
 * These type declarations help improve developer experience by providing
 * type information for the exported utilities.
 */

// Date utility types
export type { FormatRelativeDateOptions } from './date';

// Format utility types
export type { 
  FormatNumberOptions,
  FormatCurrencyOptions,
  FormatPercentOptions,
  FormatCompactNumberOptions,
  FormatJourneyNumberOptions,
  FormatHealthMetricOptions,
  TruncateTextOptions
} from './format';

// Validation utility types
export type {
  ValidationSchema,
  ValidationMessages,
  ClaimValidationSchema,
  UserValidationSchema,
  LoginValidationSchema
} from './validation';
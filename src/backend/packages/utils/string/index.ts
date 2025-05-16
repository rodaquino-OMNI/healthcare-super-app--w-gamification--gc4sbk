/**
 * @file Main entry point for string utilities package
 * @module @austa/utils/string
 * 
 * This module re-exports all string manipulation and validation functions
 * to provide a unified API for consuming modules. It centralizes all exports
 * from format.ts and validation.ts, ensuring backward compatibility with
 * existing imports while organizing the code into more specific modules.
 */

// Re-export all string formatting utilities
export { capitalizeFirstLetter, truncate } from './format';

// Re-export all string validation utilities
export {
  isValidCPF,
  isValidCPFBoolean,
  CPFValidationError,
  CPFValidationResult
} from './validation';
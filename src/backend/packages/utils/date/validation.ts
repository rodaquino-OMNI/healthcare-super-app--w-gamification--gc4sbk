/**
 * @file validation.ts
 * @description Provides a convenient entry point for date validation utilities.
 * These functions are critical for ensuring that date objects, strings, and numbers
 * are valid before processing, preventing errors and exceptions in date operations.
 */

// Re-export validation utilities from the implementation folder
export { 
  isValidDate,
  isValidDateFormat,
  isFutureDate,
  isPastDate,
  isValidJourneyDate
} from '../src/date/validation';
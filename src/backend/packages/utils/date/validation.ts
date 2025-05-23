/**
 * Date Validation Utilities
 * 
 * This module provides functions for validating date objects, strings, and numbers.
 * These utilities help ensure that dates are valid before processing, preventing
 * errors and exceptions in date operations.
 * 
 * @packageDocumentation
 */

import { 
  isValidDate as _isValidDate, 
  isDateInRange as _isDateInRange,
  isValidDateFormat as _isValidDateFormat,
  isPastDate as _isPastDate,
  isFutureDate as _isFutureDate,
  isToday as _isToday
} from '../src/date/validation';

/**
 * Checks if a date is valid
 * 
 * @param date - The date to validate (can be Date object, string, or number)
 * @returns True if the date is valid, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a Date object is valid
 * const isValid = isValidDate(new Date()); // true
 * 
 * // Check if a date string is valid
 * const isValidString = isValidDate('2023-01-01'); // true
 * const isInvalidString = isValidDate('not-a-date'); // false
 * 
 * // Check if a timestamp is valid
 * const isValidTimestamp = isValidDate(1672531200000); // true (2023-01-01)
 * ```
 */
export const isValidDate = _isValidDate;

/**
 * Checks if a date is within a specified range
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @param startDate - The start date of the range (can be Date object, string, or number)
 * @param endDate - The end date of the range (can be Date object, string, or number)
 * @returns True if the date is within the range (inclusive), false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is within a range
 * const isInRange = isDateInRange(
 *   new Date('2023-01-15'),
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31')
 * ); // true
 * 
 * // Works with date strings too
 * const isInRangeString = isDateInRange(
 *   '2023-01-15',
 *   '2023-01-01',
 *   '2023-01-31'
 * ); // true
 * 
 * // Returns false for dates outside the range
 * const isOutsideRange = isDateInRange(
 *   new Date('2023-02-01'),
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31')
 * ); // false
 * ```
 */
export const isDateInRange = _isDateInRange;

/**
 * Validates a date string against a specific format
 * 
 * @param dateStr - The date string to validate
 * @param formatStr - The expected format (e.g., 'yyyy-MM-dd')
 * @param referenceDate - The reference date to use for relative parsing (defaults to current date)
 * @returns True if the date string matches the expected format and is valid, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date string matches the yyyy-MM-dd format
 * const isValid = isValidDateFormat('2023-01-01', 'yyyy-MM-dd'); // true
 * const isInvalid = isValidDateFormat('01/01/2023', 'yyyy-MM-dd'); // false
 * 
 * // Check if a date string matches the dd/MM/yyyy format
 * const isValidFormat = isValidDateFormat('01/01/2023', 'dd/MM/yyyy'); // true
 * 
 * // Check if a date is valid (February 31 is not a valid date)
 * const isInvalidDate = isValidDateFormat('31/02/2023', 'dd/MM/yyyy'); // false
 * ```
 */
export const isValidDateFormat = _isValidDateFormat;

/**
 * Checks if a date is in the past
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the past, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is in the past
 * const isPast = isPastDate(new Date('2020-01-01')); // true (assuming current date is after 2020-01-01)
 * 
 * // Check against a specific reference date
 * const isPastRelative = isPastDate(
 *   new Date('2020-01-01'),
 *   new Date('2021-01-01')
 * ); // true
 * ```
 */
export const isPastDate = _isPastDate;

/**
 * Checks if a date is in the future
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the future, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is in the future
 * const isFuture = isFutureDate(new Date('2030-01-01')); // true (assuming current date is before 2030-01-01)
 * 
 * // Check against a specific reference date
 * const isFutureRelative = isFutureDate(
 *   new Date('2022-01-01'),
 *   new Date('2021-01-01')
 * ); // true
 * ```
 */
export const isFutureDate = _isFutureDate;

/**
 * Checks if a date is today
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @returns True if the date is today, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is today
 * const isDateToday = isToday(new Date()); // true
 * 
 * // Check if a specific date is today
 * const isSpecificDateToday = isToday('2023-05-15'); // depends on current date
 * ```
 */
export const isToday = _isToday;

/**
 * Validates a date string against a specific format
 * 
 * @param dateStr - The date string to validate
 * @param formatStr - The expected format (e.g., 'yyyy-MM-dd')
 * @returns True if the date string matches the expected format and is valid, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date string matches the yyyy-MM-dd format
 * const isValid = isValidDateFormat('2023-01-01', 'yyyy-MM-dd'); // true
 * const isInvalid = isValidDateFormat('01/01/2023', 'yyyy-MM-dd'); // false
 * 
 * // Check if a date string matches the dd/MM/yyyy format
 * const isValidFormat = isValidDateFormat('01/01/2023', 'dd/MM/yyyy'); // true
 * ```
 */
export const isValidDateFormat = _isValidDateFormat;

/**
 * Checks if a date is in the past
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the past, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is in the past
 * const isPast = isPastDate(new Date('2020-01-01')); // true (assuming current date is after 2020-01-01)
 * 
 * // Check against a specific reference date
 * const isPastRelative = isPastDate(
 *   new Date('2020-01-01'),
 *   new Date('2021-01-01')
 * ); // true
 * ```
 */
export const isPastDate = _isPastDate;

/**
 * Checks if a date is in the future
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the future, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is in the future
 * const isFuture = isFutureDate(new Date('2030-01-01')); // true (assuming current date is before 2030-01-01)
 * 
 * // Check against a specific reference date
 * const isFutureRelative = isFutureDate(
 *   new Date('2022-01-01'),
 *   new Date('2021-01-01')
 * ); // true
 * ```
 */
export const isFutureDate = _isFutureDate;

/**
 * Checks if a date is today
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @returns True if the date is today, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is today
 * const isDateToday = isToday(new Date()); // true
 * 
 * // Check if a specific date is today
 * const isSpecificDateToday = isToday('2023-05-15'); // depends on current date
 * ```
 */
export const isToday = _isToday;
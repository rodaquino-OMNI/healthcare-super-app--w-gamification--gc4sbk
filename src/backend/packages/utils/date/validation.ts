/**
 * Date Validation Utilities
 * 
 * This module provides functions for validating date objects, strings, and numbers.
 * These utilities are critical for ensuring that dates are valid before processing,
 * preventing errors and exceptions in date operations.
 * 
 * @packageDocumentation
 */

import { isValidDate as _isValidDate, isDateInRange as _isDateInRange } from '../src/date/validation';

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
 * // Check using string dates
 * const isInRangeStrings = isDateInRange(
 *   '2023-01-15',
 *   '2023-01-01',
 *   '2023-01-31'
 * ); // true
 * 
 * // Check using timestamps
 * const isInRangeTimestamps = isDateInRange(
 *   1673740800000, // 2023-01-15
 *   1672531200000, // 2023-01-01
 *   1675123200000  // 2023-01-31
 * ); // true
 * ```
 */
export const isDateInRange = _isDateInRange;
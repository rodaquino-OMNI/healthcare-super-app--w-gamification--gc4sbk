/**
 * Date calculation utilities
 * 
 * This module provides functions for date-based calculations such as age determination,
 * time elapsed representation, and date range operations.
 * 
 * @module
 */

/**
 * Calculates age in years based on birthdate
 * 
 * @param birthdate - The birthdate
 * @param referenceDate - The reference date to calculate age against (defaults to today)
 * @returns Age in years
 */
export { calculateAge } from '../src/date';

/**
 * Returns a human-readable string representing time elapsed since the given date
 * Supports both Portuguese and English localization.
 * 
 * @param date - The date to calculate time elapsed from
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Human-readable time ago string
 */
export { getTimeAgo } from '../src/date';

/**
 * Gets an array of dates between start and end dates (inclusive)
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of dates between start and end dates
 */
export { getDatesBetween } from '../src/date';

/**
 * Checks if a date is within a specified range
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the date is within the range, false otherwise
 */
export { isDateInRange } from '../src/date';
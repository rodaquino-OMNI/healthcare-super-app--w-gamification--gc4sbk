/**
 * Re-exports timezone utilities from the implementation folder
 * @module
 */

import {
  getLocalTimezone,
  convertToTimezone,
  formatWithTimezone,
  getTimezoneAbbreviation,
  isCurrentlyInDST
} from '../src/date/timezone';

/**
 * Gets the local timezone identifier in the format +HH:MM or -HH:MM
 * 
 * @returns The local timezone identifier string
 */
export { getLocalTimezone };

/**
 * Converts a date to a specific timezone
 * 
 * @param date - The date to convert
 * @param timezone - The target timezone in the format +HH:MM or -HH:MM
 * @returns A new Date object adjusted to the specified timezone
 * @throws Error if the timezone format is invalid
 */
export { convertToTimezone };

/**
 * Formats a date with a specific timezone offset
 * 
 * @param date - The date to format
 * @param format - The format string to use
 * @param timezone - The timezone in the format +HH:MM or -HH:MM
 * @returns The formatted date string with the timezone applied
 */
export { formatWithTimezone };

/**
 * Gets the timezone abbreviation for a specific timezone
 * 
 * @param timezone - The timezone in the format +HH:MM or -HH:MM
 * @returns The timezone abbreviation (e.g., EST, PST, BRT)
 */
export { getTimezoneAbbreviation };

/**
 * Checks if the current date is in Daylight Saving Time
 * 
 * @returns True if the current date is in Daylight Saving Time, false otherwise
 */
export { isCurrentlyInDST };
/**
 * Timezone Utilities
 * 
 * This module provides functions for working with timezones, including getting
 * the local timezone identifier, converting between timezone formats, and
 * validating timezone strings.
 * 
 * @packageDocumentation
 */

import {
  getLocalTimezone as _getLocalTimezone,
  getLocalTimezoneIANA as _getLocalTimezoneIANA,
  getTimezoneOffset as _getTimezoneOffset,
  formatTimezoneOffset as _formatTimezoneOffset,
  isValidTimezoneOffset as _isValidTimezoneOffset,
  isValidTimezoneName as _isValidTimezoneName,
  getShortTimezoneName as _getShortTimezoneName,
  getLongTimezoneName as _getLongTimezoneName,
  getTimezoneOffsetForZone as _getTimezoneOffsetForZone
} from '../src/date/timezone';

/**
 * Gets the local timezone identifier as an offset string
 * 
 * @returns The local timezone identifier in the format '+HH:MM' or '-HH:MM'
 * 
 * @example
 * ```typescript
 * // Get the local timezone offset
 * const timezone = getLocalTimezone(); // e.g., '+03:00' or '-05:00'
 * ```
 */
export const getLocalTimezone = _getLocalTimezone;

/**
 * Gets the IANA timezone identifier for the local timezone
 * 
 * @returns The IANA timezone identifier (e.g., 'America/New_York')
 * 
 * @example
 * ```typescript
 * // Get the IANA timezone name
 * const timezoneName = getLocalTimezoneIANA(); // e.g., 'America/New_York' or 'Europe/London'
 * ```
 */
export const getLocalTimezoneIANA = _getLocalTimezoneIANA;

/**
 * Gets the current timezone offset in minutes
 * 
 * @param date - Optional date to get the timezone offset for (defaults to current date)
 * @returns The timezone offset in minutes (positive for timezones behind UTC, negative for timezones ahead of UTC)
 * 
 * @example
 * ```typescript
 * // Get the timezone offset in minutes
 * const offset = getTimezoneOffset(); // e.g., 300 (for UTC-05:00) or -180 (for UTC+03:00)
 * 
 * // Get the timezone offset for a specific date (useful for handling DST)
 * const summerOffset = getTimezoneOffset(new Date('2023-07-01'));
 * const winterOffset = getTimezoneOffset(new Date('2023-01-01'));
 * ```
 */
export const getTimezoneOffset = _getTimezoneOffset;

/**
 * Converts a timezone offset in minutes to a formatted string
 * 
 * @param offsetMinutes - The timezone offset in minutes
 * @returns The formatted timezone offset string in the format '+HH:MM' or '-HH:MM'
 * 
 * @example
 * ```typescript
 * // Convert a timezone offset to a formatted string
 * const formattedOffset = formatTimezoneOffset(300); // '-05:00' (UTC-05:00)
 * const formattedOffset2 = formatTimezoneOffset(-180); // '+03:00' (UTC+03:00)
 * ```
 */
export const formatTimezoneOffset = _formatTimezoneOffset;

/**
 * Checks if a timezone offset string is valid
 * 
 * @param timezoneOffset - The timezone offset string to validate (e.g., '+05:30', '-08:00')
 * @returns True if the timezone offset string is valid, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a timezone offset string is valid
 * const isValid = isValidTimezoneOffset('+05:30'); // true
 * const isInvalid = isValidTimezoneOffset('invalid'); // false
 * ```
 */
export const isValidTimezoneOffset = _isValidTimezoneOffset;

/**
 * Checks if a timezone name is valid by attempting to use it with the Intl API
 * 
 * @param timezoneName - The IANA timezone name to validate (e.g., 'America/New_York')
 * @returns True if the timezone name is valid, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a timezone name is valid
 * const isValid = isValidTimezoneName('America/New_York'); // true
 * const isInvalid = isValidTimezoneName('Invalid/Timezone'); // false
 * ```
 */
export const isValidTimezoneName = _isValidTimezoneName;

/**
 * Gets the short timezone name (e.g., 'EST', 'PST') for a specific date
 * 
 * @param date - The date to get the timezone name for
 * @param locale - The locale to use (defaults to 'en-US')
 * @returns The short timezone name
 * 
 * @example
 * ```typescript
 * // Get the short timezone name for the current date
 * const tzName = getShortTimezoneName(); // e.g., 'EST', 'PST'
 * 
 * // Get the short timezone name for a specific date
 * const summerTzName = getShortTimezoneName(new Date('2023-07-01')); // e.g., 'EDT', 'PDT'
 * 
 * // Get the short timezone name with a specific locale
 * const tzNamePtBR = getShortTimezoneName(new Date(), 'pt-BR');
 * ```
 */
export const getShortTimezoneName = _getShortTimezoneName;

/**
 * Gets the long timezone name (e.g., 'Eastern Standard Time') for a specific date
 * 
 * @param date - The date to get the timezone name for
 * @param locale - The locale to use (defaults to 'en-US')
 * @returns The long timezone name
 * 
 * @example
 * ```typescript
 * // Get the long timezone name for the current date
 * const tzName = getLongTimezoneName(); // e.g., 'Eastern Standard Time'
 * 
 * // Get the long timezone name for a specific date
 * const summerTzName = getLongTimezoneName(new Date('2023-07-01')); // e.g., 'Eastern Daylight Time'
 * 
 * // Get the long timezone name with a specific locale
 * const tzNamePtBR = getLongTimezoneName(new Date(), 'pt-BR');
 * ```
 */
export const getLongTimezoneName = _getLongTimezoneName;

/**
 * Converts a date to a specific timezone and returns the offset
 * 
 * @param date - The date to convert
 * @param timeZone - The IANA timezone name (e.g., 'America/New_York')
 * @returns The timezone offset in minutes for the specified timezone and date
 * 
 * @example
 * ```typescript
 * // Get the timezone offset for New York on a specific date
 * const nyOffset = getTimezoneOffsetForZone(
 *   new Date('2023-01-01T12:00:00Z'),
 *   'America/New_York'
 * ); // 300 (UTC-05:00)
 * 
 * // Get the timezone offset for Tokyo on a specific date
 * const tokyoOffset = getTimezoneOffsetForZone(
 *   new Date('2023-01-01T12:00:00Z'),
 *   'Asia/Tokyo'
 * ); // -540 (UTC+09:00)
 * ```
 */
export const getTimezoneOffsetForZone = _getTimezoneOffsetForZone;
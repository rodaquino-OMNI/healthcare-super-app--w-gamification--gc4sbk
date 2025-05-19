/**
 * Timezone utilities for date handling
 * 
 * This module provides functions for working with timezones in the application,
 * ensuring consistent timezone handling across different journeys.
 */

/**
 * Gets the local timezone identifier in the format '+HH:MM' or '-HH:MM'
 * 
 * @returns The local timezone identifier string
 * @example
 * // Returns something like '+05:30' or '-08:00'
 * const timezone = getLocalTimezone();
 */
export const getLocalTimezone = (): string => {
  try {
    const date = new Date();
    const offset = -date.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMinutes = Math.abs(offset % 60);
    const direction = offset >= 0 ? '+' : '-';
    
    return `${direction}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error getting local timezone:', error);
    return '+00:00'; // Default to UTC in case of error
  }
};

/**
 * Gets the timezone abbreviation (like EST, PST) for the current or specified date
 * 
 * @param date - Optional date to get timezone abbreviation for (defaults to current date)
 * @param locale - Optional locale to use (defaults to 'en-US')
 * @returns The timezone abbreviation string
 * @example
 * // Returns something like 'EST' or 'PST' depending on the timezone
 * const tzAbbr = getTimezoneAbbreviation();
 */
export const getTimezoneAbbreviation = (
  date: Date = new Date(),
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZoneName: 'short',
    })
      .formatToParts(date)
      .find(part => part.type === 'timeZoneName')?.value || '';
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error);
    return ''; // Return empty string in case of error
  }
};

/**
 * Formats a date according to the specified timezone
 * 
 * @param date - The date to format
 * @param timeZone - The IANA timezone identifier (e.g., 'America/New_York')
 * @param locale - Optional locale to use (defaults to 'en-US')
 * @param options - Optional Intl.DateTimeFormatOptions to customize formatting
 * @returns The formatted date string in the specified timezone
 * @example
 * // Returns the current date formatted in New York timezone
 * const nyDate = formatWithTimezone(new Date(), 'America/New_York');
 */
export const formatWithTimezone = (
  date: Date,
  timeZone: string,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }
): string => {
  try {
    return new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone,
    }).format(date);
  } catch (error) {
    console.error(`Error formatting date with timezone ${timeZone}:`, error);
    return date.toISOString(); // Fall back to ISO string in case of error
  }
};

/**
 * Gets the offset in minutes for a specific timezone
 * 
 * @param timeZone - The IANA timezone identifier (e.g., 'America/New_York')
 * @param date - Optional date to get the offset for (defaults to current date)
 * @returns The timezone offset in minutes
 * @example
 * // Returns the offset in minutes for New York timezone
 * const nyOffset = getTimezoneOffset('America/New_York');
 */
export const getTimezoneOffset = (
  timeZone: string,
  date: Date = new Date()
): number => {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    return (utcDate.getTime() - tzDate.getTime()) / 60000;
  } catch (error) {
    console.error(`Error getting timezone offset for ${timeZone}:`, error);
    return 0; // Default to 0 (UTC) in case of error
  }
};

/**
 * Converts a date to a specific timezone
 * 
 * @param date - The date to convert
 * @param timeZone - The IANA timezone identifier (e.g., 'America/New_York')
 * @returns A new Date object representing the same moment in the specified timezone
 * @example
 * // Returns a Date object converted to New York timezone
 * const nyDate = convertToTimezone(new Date(), 'America/New_York');
 */
export const convertToTimezone = (
  date: Date,
  timeZone: string
): Date => {
  try {
    const dateString = date.toLocaleString('en-US', { timeZone });
    return new Date(dateString);
  } catch (error) {
    console.error(`Error converting date to timezone ${timeZone}:`, error);
    return new Date(date); // Return a copy of the original date in case of error
  }
};
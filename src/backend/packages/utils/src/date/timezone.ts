/**
 * Timezone utilities for date handling
 * 
 * This module provides functions for working with timezones in JavaScript.
 * It includes utilities for retrieving timezone information, converting between
 * timezones, and handling daylight saving time transitions.
 * 
 * @module timezone
 */

import { format, isValid, parseISO } from 'date-fns';

/**
 * Error thrown when an invalid timezone identifier is provided
 */
export class InvalidTimezoneError extends Error {
  constructor(timezone: string) {
    super(`Invalid timezone identifier: ${timezone}`);
    this.name = 'InvalidTimezoneError';
  }
}

/**
 * Error thrown when a daylight saving time transition causes ambiguity
 */
export class DSTAmbiguityError extends Error {
  constructor(date: Date, timezone: string) {
    super(`Ambiguous date due to DST transition: ${date.toISOString()} in timezone ${timezone}`);
    this.name = 'DSTAmbiguityError';
  }
}

/**
 * Gets the local timezone offset as a string in the format '+HH:MM' or '-HH:MM'
 * 
 * @example
 * // Returns something like '+02:00' or '-05:00' depending on your local timezone
 * const timezoneOffset = getLocalTimezone();
 * 
 * @returns The local timezone offset as a string
 */
export const getLocalTimezone = (): string => {
  const date = new Date();
  const offset = -date.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const direction = offset >= 0 ? '+' : '-';
  
  return `${direction}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
};

/**
 * Gets the IANA timezone identifier for the local timezone
 * 
 * This function uses the Intl API to determine the local timezone identifier.
 * It returns the canonical IANA timezone name (e.g., 'America/New_York', 'Europe/Paris').
 * 
 * @example
 * // Returns the IANA timezone identifier for your local timezone
 * // e.g., 'America/New_York', 'Europe/Paris', 'Asia/Tokyo'
 * const tzIdentifier = getLocalTimezoneIANA();
 * 
 * @returns The IANA timezone identifier for the local timezone
 */
export const getLocalTimezoneIANA = (): string => {
  try {
    // Use Intl API to get the timezone identifier
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback for environments where Intl API is not fully supported
    console.warn('Intl API not fully supported, timezone identification may be limited');
    return 'UTC';
  }
};

/**
 * Checks if a timezone identifier is valid
 * 
 * @example
 * // Returns true
 * isValidTimezone('America/New_York');
 * 
 * // Returns false
 * isValidTimezone('Invalid/Timezone');
 * 
 * @param timezone - The timezone identifier to check
 * @returns True if the timezone is valid, false otherwise
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    // Attempt to format a date with the given timezone
    // This will throw an error if the timezone is invalid
    Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Gets the current date and time in a specific timezone
 * 
 * @example
 * // Get current date/time in Tokyo
 * const tokyoTime = getCurrentDateInTimezone('Asia/Tokyo');
 * console.log(formatInTimezone(tokyoTime, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'));
 * 
 * @param timezone - The IANA timezone identifier (e.g., 'America/New_York')
 * @returns A Date object representing the current date/time in the specified timezone
 * @throws {InvalidTimezoneError} If the timezone identifier is invalid
 */
export const getCurrentDateInTimezone = (timezone: string): Date => {
  if (!isValidTimezone(timezone)) {
    throw new InvalidTimezoneError(timezone);
  }
  
  const date = new Date();
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const offset = utcDate.getTime() - tzDate.getTime();
  
  return new Date(date.getTime() + offset);
};

/**
 * Formats a date according to the specified format in a given timezone
 * 
 * @example
 * // Format a date in Tokyo timezone
 * const date = new Date('2023-01-15T12:00:00Z');
 * const formatted = formatInTimezone(date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
 * console.log(formatted); // Will show the date and time in Tokyo
 * 
 * @param date - The date to format
 * @param timezone - The IANA timezone identifier (e.g., 'America/New_York')
 * @param formatStr - The format string (using date-fns format patterns)
 * @returns The formatted date string in the specified timezone
 * @throws {InvalidTimezoneError} If the timezone identifier is invalid
 */
export const formatInTimezone = (date: Date | string | number, timezone: string, formatStr: string): string => {
  if (!isValidTimezone(timezone)) {
    throw new InvalidTimezoneError(timezone);
  }
  
  // Ensure we have a Date object
  const dateObj = typeof date === 'string' ? parseISO(date) : (typeof date === 'number' ? new Date(date) : date);
  
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  
  // Convert to the target timezone
  const utcDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
  const offset = utcDate.getTime() - tzDate.getTime();
  
  const convertedDate = new Date(dateObj.getTime() + offset);
  
  return format(convertedDate, formatStr);
};

/**
 * Converts a date from one timezone to another
 * 
 * @example
 * // Convert a date from New York to Tokyo timezone
 * const nyDate = new Date('2023-01-15T12:00:00');
 * const tokyoDate = convertTimezone(nyDate, 'America/New_York', 'Asia/Tokyo');
 * 
 * @param date - The date to convert
 * @param fromTimezone - The source IANA timezone identifier
 * @param toTimezone - The target IANA timezone identifier
 * @returns A new Date object representing the date in the target timezone
 * @throws {InvalidTimezoneError} If either timezone identifier is invalid
 */
export const convertTimezone = (
  date: Date | string | number,
  fromTimezone: string,
  toTimezone: string
): Date => {
  if (!isValidTimezone(fromTimezone)) {
    throw new InvalidTimezoneError(fromTimezone);
  }
  
  if (!isValidTimezone(toTimezone)) {
    throw new InvalidTimezoneError(toTimezone);
  }
  
  // Ensure we have a Date object
  const dateObj = typeof date === 'string' ? parseISO(date) : (typeof date === 'number' ? new Date(date) : date);
  
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  
  // Get the date string in the source timezone
  const dateStr = dateObj.toLocaleString('en-US', { timeZone: fromTimezone });
  
  // Create a date object in the source timezone
  const sourceTzDate = new Date(dateStr);
  
  // Get the UTC timestamp of the source timezone date
  const sourceUtcDate = new Date(sourceTzDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const sourceOffset = sourceTzDate.getTime() - sourceUtcDate.getTime();
  
  // Get the UTC timestamp of the target timezone date
  const targetTzDate = new Date(sourceTzDate.toLocaleString('en-US', { timeZone: toTimezone }));
  const targetUtcDate = new Date(targetTzDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const targetOffset = targetTzDate.getTime() - targetUtcDate.getTime();
  
  // Calculate the time difference between the two timezones
  const timeDiff = sourceOffset - targetOffset;
  
  // Apply the time difference to the original date
  return new Date(dateObj.getTime() - timeDiff);
};

/**
 * Gets the timezone offset in minutes for a specific timezone at a specific date
 * 
 * This function accounts for daylight saving time changes by using the provided date.
 * 
 * @example
 * // Get the offset for New York on a summer day
 * const summerOffset = getTimezoneOffset('America/New_York', new Date('2023-07-15'));
 * 
 * // Get the offset for New York on a winter day
 * const winterOffset = getTimezoneOffset('America/New_York', new Date('2023-01-15'));
 * 
 * @param timezone - The IANA timezone identifier
 * @param date - The date for which to get the offset (defaults to current date)
 * @returns The timezone offset in minutes
 * @throws {InvalidTimezoneError} If the timezone identifier is invalid
 */
export const getTimezoneOffset = (timezone: string, date: Date = new Date()): number => {
  if (!isValidTimezone(timezone)) {
    throw new InvalidTimezoneError(timezone);
  }
  
  // Format the date in the specified timezone and UTC
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  // Parse the formatted dates
  const tzParts = formatter.formatToParts(date);
  const utcParts = utcFormatter.formatToParts(date);
  
  // Extract date components
  const tzDate = new Date(
    parseInt(tzParts.find(part => part.type === 'year')?.value || '0'),
    parseInt(tzParts.find(part => part.type === 'month')?.value || '0') - 1,
    parseInt(tzParts.find(part => part.type === 'day')?.value || '0'),
    parseInt(tzParts.find(part => part.type === 'hour')?.value || '0'),
    parseInt(tzParts.find(part => part.type === 'minute')?.value || '0'),
    parseInt(tzParts.find(part => part.type === 'second')?.value || '0')
  );
  
  const utcDate = new Date(
    parseInt(utcParts.find(part => part.type === 'year')?.value || '0'),
    parseInt(utcParts.find(part => part.type === 'month')?.value || '0') - 1,
    parseInt(utcParts.find(part => part.type === 'day')?.value || '0'),
    parseInt(utcParts.find(part => part.type === 'hour')?.value || '0'),
    parseInt(utcParts.find(part => part.type === 'minute')?.value || '0'),
    parseInt(utcParts.find(part => part.type === 'second')?.value || '0')
  );
  
  // Calculate the offset in minutes
  return (tzDate.getTime() - utcDate.getTime()) / (60 * 1000);
};

/**
 * Checks if a date falls during a Daylight Saving Time (DST) transition
 * 
 * This function helps identify ambiguous times that occur during DST transitions,
 * such as when the clock is set back and the same hour occurs twice.
 * 
 * @example
 * // Check if a specific date is during a DST transition
 * const isDuringTransition = isDSTTransition(
 *   new Date('2023-11-05T01:30:00'), 
 *   'America/New_York'
 * );
 * 
 * @param date - The date to check
 * @param timezone - The IANA timezone identifier
 * @returns True if the date is during a DST transition, false otherwise
 * @throws {InvalidTimezoneError} If the timezone identifier is invalid
 */
export const isDSTTransition = (date: Date, timezone: string): boolean => {
  if (!isValidTimezone(timezone)) {
    throw new InvalidTimezoneError(timezone);
  }
  
  // Check one hour before and one hour after
  const oneHourBefore = new Date(date.getTime() - 60 * 60 * 1000);
  const oneHourAfter = new Date(date.getTime() + 60 * 60 * 1000);
  
  // Get offsets for all three times
  const offsetBefore = getTimezoneOffset(timezone, oneHourBefore);
  const offsetCurrent = getTimezoneOffset(timezone, date);
  const offsetAfter = getTimezoneOffset(timezone, oneHourAfter);
  
  // If the offset changes within this 2-hour window, we're in a transition
  return offsetBefore !== offsetCurrent || offsetCurrent !== offsetAfter;
};

/**
 * Gets the timezone abbreviation for a specific timezone at a specific date
 * 
 * @example
 * // Get timezone abbreviation for New York in summer (EDT)
 * const summerAbbr = getTimezoneAbbreviation('America/New_York', new Date('2023-07-15'));
 * 
 * // Get timezone abbreviation for New York in winter (EST)
 * const winterAbbr = getTimezoneAbbreviation('America/New_York', new Date('2023-01-15'));
 * 
 * @param timezone - The IANA timezone identifier
 * @param date - The date for which to get the abbreviation (defaults to current date)
 * @returns The timezone abbreviation (e.g., 'EST', 'EDT', 'PST', 'PDT')
 * @throws {InvalidTimezoneError} If the timezone identifier is invalid
 */
export const getTimezoneAbbreviation = (timezone: string, date: Date = new Date()): string => {
  if (!isValidTimezone(timezone)) {
    throw new InvalidTimezoneError(timezone);
  }
  
  // Format the date with the timezone name
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  });
  
  const formatted = formatter.format(date);
  
  // Extract the timezone abbreviation (last part after the comma and space)
  const parts = formatted.split(', ');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  
  // Fallback if the format is unexpected
  return '';
};

/**
 * Safely converts a date to a specific timezone, handling DST transitions
 * 
 * This function checks for DST transitions and handles ambiguous times by
 * using the `preferLater` parameter to determine which occurrence to use.
 * 
 * @example
 * // Convert a date to New York timezone during a DST transition
 * const date = new Date('2023-11-05T01:30:00Z');
 * const nyDate = safeConvertToTimezone(date, 'America/New_York');
 * 
 * // Prefer the earlier occurrence during ambiguous times
 * const earlierTime = safeConvertToTimezone(date, 'America/New_York', false);
 * 
 * @param date - The date to convert
 * @param timezone - The IANA timezone identifier
 * @param preferLater - Whether to prefer the later occurrence during ambiguous times (defaults to true)
 * @returns A new Date object in the specified timezone
 * @throws {InvalidTimezoneError} If the timezone identifier is invalid
 * @throws {DSTAmbiguityError} If the date is ambiguous due to DST and detailed error information is requested
 */
export const safeConvertToTimezone = (
  date: Date | string | number,
  timezone: string,
  preferLater: boolean = true,
  throwOnAmbiguity: boolean = false
): Date => {
  if (!isValidTimezone(timezone)) {
    throw new InvalidTimezoneError(timezone);
  }
  
  // Ensure we have a Date object
  const dateObj = typeof date === 'string' ? parseISO(date) : (typeof date === 'number' ? new Date(date) : date);
  
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  
  // Check if the date is during a DST transition
  const isDuringTransition = isDSTTransition(dateObj, timezone);
  
  if (isDuringTransition && throwOnAmbiguity) {
    throw new DSTAmbiguityError(dateObj, timezone);
  }
  
  // Standard conversion
  const utcDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
  const offset = utcDate.getTime() - tzDate.getTime();
  
  // Base conversion
  const convertedDate = new Date(dateObj.getTime() + offset);
  
  // If during transition, adjust based on preference
  if (isDuringTransition) {
    // During "fall back" transitions, the same hour occurs twice
    // Add or subtract a small amount of time based on preference
    if (preferLater) {
      // Add a small amount to get the later occurrence
      return new Date(convertedDate.getTime() + 1000); // Add 1 second
    } else {
      // Subtract a small amount to get the earlier occurrence
      return new Date(convertedDate.getTime() - 1000); // Subtract 1 second
    }
  }
  
  return convertedDate;
};

/**
 * Gets the full timezone name for a specific timezone
 * 
 * @example
 * // Get the full name for New York timezone
 * const tzName = getTimezoneName('America/New_York');
 * // Returns "Eastern Standard Time" or "Eastern Daylight Time" depending on the date
 * 
 * @param timezone - The IANA timezone identifier
 * @param date - The date for which to get the name (defaults to current date)
 * @returns The full timezone name
 * @throws {InvalidTimezoneError} If the timezone identifier is invalid
 */
export const getTimezoneName = (timezone: string, date: Date = new Date()): string => {
  if (!isValidTimezone(timezone)) {
    throw new InvalidTimezoneError(timezone);
  }
  
  // Format the date with the long timezone name
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'long'
  });
  
  const formatted = formatter.format(date);
  
  // Extract the timezone name (last part after the comma and space)
  const parts = formatted.split(', ');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  
  // Fallback if the format is unexpected
  return '';
};
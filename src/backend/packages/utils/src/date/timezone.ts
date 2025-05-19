/**
 * Timezone utilities for handling timezone-specific date operations.
 * 
 * These utilities help with timezone conversions, formatting, and validation
 * to ensure consistent date and time representation across different regions.
 * 
 * @module timezone
 */

import { formatInTimeZone, getTimezoneOffset as dfsGetTimezoneOffset } from 'date-fns-tz';
import { isValid } from 'date-fns';

/**
 * Error class for timezone-related errors
 */
export class TimezoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimezoneError';
  }
}

/**
 * Gets the local timezone identifier in the format of +/-HH:MM
 * 
 * @returns The local timezone identifier
 * @example
 * // Returns something like "+03:00" or "-05:00" depending on your local timezone
 * const timezone = getLocalTimezone();
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
 * @returns The IANA timezone identifier (e.g., "America/Sao_Paulo")
 * @example
 * // Returns the IANA timezone identifier for your local timezone
 * const ianaTimezone = getLocalIANATimezone();
 * // Example output: "America/Sao_Paulo"
 */
export const getLocalIANATimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    throw new TimezoneError('Failed to retrieve local IANA timezone: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Checks if a timezone identifier is valid
 * 
 * @param timezone - The timezone identifier to validate
 * @returns True if the timezone is valid, false otherwise
 * @example
 * // Check if a timezone is valid
 * const isValid = isValidTimezone("America/Sao_Paulo"); // true
 * const isInvalid = isValidTimezone("Invalid/Timezone"); // false
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    // Attempt to format a date with the given timezone
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Converts a date from one timezone to another
 * 
 * @param date - The date to convert
 * @param fromTimezone - The source timezone (IANA identifier)
 * @param toTimezone - The target timezone (IANA identifier)
 * @returns A new Date object representing the same instant in the target timezone
 * @throws {TimezoneError} If the timezone identifiers are invalid or conversion fails
 * @example
 * // Convert a date from one timezone to another
 * const date = new Date('2023-01-01T12:00:00Z');
 * const convertedDate = convertToTimezone(date, 'UTC', 'America/Sao_Paulo');
 * // Result will be the same instant, but represented in America/Sao_Paulo timezone
 */
export const convertToTimezone = (date: Date, fromTimezone: string, toTimezone: string): Date => {
  if (!isValid(date)) {
    throw new TimezoneError('Invalid date provided for timezone conversion');
  }
  
  if (!isValidTimezone(fromTimezone)) {
    throw new TimezoneError(`Invalid source timezone: ${fromTimezone}`);
  }
  
  if (!isValidTimezone(toTimezone)) {
    throw new TimezoneError(`Invalid target timezone: ${toTimezone}`);
  }
  
  try {
    // Format the date in the source timezone to ISO format
    const isoInFromTz = formatInTimeZone(date, fromTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
    // Create a new date from the ISO string
    const utcDate = new Date(isoInFromTz);
    
    // Format the date in the target timezone
    const isoInToTz = formatInTimeZone(utcDate, toTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
    // Return the new date in the target timezone
    return new Date(isoInToTz);
  } catch (error) {
    throw new TimezoneError('Failed to convert between timezones: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Formats a date with timezone information
 * 
 * @param date - The date to format
 * @param formatStr - The format string
 * @param timezone - The timezone to use (IANA identifier)
 * @returns Formatted date string with timezone information
 * @throws {TimezoneError} If the timezone identifier is invalid or formatting fails
 * @example
 * // Format a date with timezone information
 * const date = new Date('2023-01-01T12:00:00Z');
 * const formatted = formatWithTimezone(date, 'yyyy-MM-dd HH:mm:ss zzz', 'America/Sao_Paulo');
 * // Result: "2023-01-01 09:00:00 -03:00" (assuming -3 hours offset)
 */
export const formatWithTimezone = (date: Date, formatStr: string, timezone: string): string => {
  if (!isValid(date)) {
    throw new TimezoneError('Invalid date provided for timezone formatting');
  }
  
  if (!isValidTimezone(timezone)) {
    throw new TimezoneError(`Invalid timezone: ${timezone}`);
  }
  
  try {
    return formatInTimeZone(date, timezone, formatStr);
  } catch (error) {
    throw new TimezoneError('Failed to format date with timezone: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Gets the offset in minutes for a specific timezone at a given date
 * 
 * @param timezone - The timezone (IANA identifier)
 * @param date - The date to check the offset for (defaults to current date)
 * @returns The offset in minutes
 * @throws {TimezoneError} If the timezone identifier is invalid
 * @example
 * // Get the offset for a timezone
 * const offset = getTimezoneOffset('America/Sao_Paulo');
 * // Result might be -180 (representing -3 hours)
 */
export const getTimezoneOffset = (timezone: string, date: Date = new Date()): number => {
  if (!isValidTimezone(timezone)) {
    throw new TimezoneError(`Invalid timezone: ${timezone}`);
  }
  
  try {
    // Use the date-fns-tz implementation which handles DST transitions correctly
    // The result is in milliseconds, so we convert to minutes
    return dfsGetTimezoneOffset(timezone, date) / (60 * 1000);
  } catch (error) {
    throw new TimezoneError('Failed to get timezone offset: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Checks if a date is in daylight saving time for a specific timezone
 * 
 * @param date - The date to check
 * @param timezone - The timezone (IANA identifier)
 * @returns True if the date is in daylight saving time, false otherwise
 * @throws {TimezoneError} If the timezone identifier is invalid
 * @example
 * // Check if a date is in daylight saving time
 * const isDST = isDaylightSavingTime(new Date(), 'America/Sao_Paulo');
 */
export const isDaylightSavingTime = (date: Date, timezone: string): boolean => {
  if (!isValid(date)) {
    throw new TimezoneError('Invalid date provided for daylight saving time check');
  }
  
  if (!isValidTimezone(timezone)) {
    throw new TimezoneError(`Invalid timezone: ${timezone}`);
  }
  
  try {
    // Create two dates: one in January (typically not DST) and the current date
    const januaryDate = new Date(date.getFullYear(), 0, 1);
    
    // Get timezone offsets for both dates
    const januaryOffset = getTimezoneOffset(timezone, januaryDate);
    const currentOffset = getTimezoneOffset(timezone, date);
    
    // If the current offset is less than January's offset, it's DST
    // (less offset means more hours of daylight)
    return currentOffset < januaryOffset;
  } catch (error) {
    throw new TimezoneError('Failed to check daylight saving time: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Checks if a specific date is during a DST transition in the given timezone
 * 
 * @param date - The date to check
 * @param timezone - The timezone (IANA identifier)
 * @returns True if the date is during a DST transition, false otherwise
 * @throws {TimezoneError} If the timezone identifier is invalid
 * @example
 * // Check if a date is during a DST transition
 * const isTransition = isDSTTransition(new Date('2023-03-12T02:30:00'), 'America/New_York');
 */
export const isDSTTransition = (date: Date, timezone: string): boolean => {
  if (!isValid(date)) {
    throw new TimezoneError('Invalid date provided for DST transition check');
  }
  
  if (!isValidTimezone(timezone)) {
    throw new TimezoneError(`Invalid timezone: ${timezone}`);
  }
  
  try {
    // Check one hour before and one hour after
    const oneHourBefore = new Date(date.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(date.getTime() + 60 * 60 * 1000);
    
    // Get timezone offsets
    const offsetBefore = getTimezoneOffset(timezone, oneHourBefore);
    const offsetAfter = getTimezoneOffset(timezone, oneHourAfter);
    
    // If the offset changed, we're in a DST transition
    return offsetBefore !== offsetAfter;
  } catch (error) {
    throw new TimezoneError('Failed to check DST transition: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Gets the abbreviated name for a timezone at a specific date
 * 
 * @param timezone - The timezone (IANA identifier)
 * @param date - The date to get the abbreviation for (defaults to current date)
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns The timezone abbreviation (e.g., EST, PST, BRT)
 * @throws {TimezoneError} If the timezone identifier is invalid
 * @example
 * // Get the abbreviation for a timezone
 * const abbr = getTimezoneAbbreviation('America/Sao_Paulo');
 * // Result might be "BRT" or "BRST" depending on daylight saving time
 */
export const getTimezoneAbbreviation = (timezone: string, date: Date = new Date(), locale: string = 'en-US'): string => {
  if (!isValidTimezone(timezone)) {
    throw new TimezoneError(`Invalid timezone: ${timezone}`);
  }
  
  try {
    // Format the date with the timezone name and extract the abbreviation
    const formatted = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      timeZoneName: 'short'
    }).format(date);
    
    // Extract the timezone abbreviation (last part after the comma and space)
    const parts = formatted.split(', ');
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    
    // If no abbreviation found, return the offset
    return formatWithTimezone(date, 'zzz', timezone);
  } catch (error) {
    throw new TimezoneError('Failed to get timezone abbreviation: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Gets a list of all available IANA timezone identifiers supported by the runtime
 * 
 * @returns An array of IANA timezone identifiers
 * @example
 * // Get all available timezones
 * const timezones = getAvailableTimezones();
 * // Result is an array of strings like ["Africa/Abidjan", "Africa/Accra", ...]
 */
export const getAvailableTimezones = (): string[] => {
  try {
    // This is only available in some environments (like Node.js with full ICU data)
    // @ts-ignore - Intl.supportedValuesOf might not be available in all environments
    if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
      // @ts-ignore - TypeScript might not recognize this method
      return Intl.supportedValuesOf('timeZone');
    }
    
    // Fallback to a predefined list of common timezones
    return [
      'UTC',
      'GMT',
      'America/Sao_Paulo',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Moscow',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Kolkata',
      'Australia/Sydney',
      'Pacific/Auckland'
    ];
  } catch (error) {
    console.warn('Failed to get available timezones:', error);
    return ['UTC']; // Return at least UTC as a fallback
  }
};

/**
 * Gets the current date and time in a specific timezone
 * 
 * @param timezone - The timezone (IANA identifier)
 * @returns A new Date object representing the current date and time in the specified timezone
 * @throws {TimezoneError} If the timezone identifier is invalid
 * @example
 * // Get the current date and time in a specific timezone
 * const nowInSaoPaulo = getCurrentDateInTimezone('America/Sao_Paulo');
 */
export const getCurrentDateInTimezone = (timezone: string): Date => {
  if (!isValidTimezone(timezone)) {
    throw new TimezoneError(`Invalid timezone: ${timezone}`);
  }
  
  try {
    const now = new Date();
    return convertToTimezone(now, getLocalIANATimezone(), timezone);
  } catch (error) {
    throw new TimezoneError('Failed to get current date in timezone: ' + (error instanceof Error ? error.message : String(error)));
  }
};
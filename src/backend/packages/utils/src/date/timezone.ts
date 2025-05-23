/**
 * Timezone Utilities
 * 
 * This module provides functions for working with timezones, including getting
 * the local timezone identifier, converting between timezone formats, and
 * validating timezone strings.
 * 
 * @packageDocumentation
 */

/**
 * Gets the local timezone identifier as an offset string
 * 
 * @returns The local timezone identifier in the format '+HH:MM' or '-HH:MM'
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
 * @returns The IANA timezone identifier (e.g., 'America/New_York')
 */
export const getLocalTimezoneIANA = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback for environments where Intl API is not available
    return 'UTC';
  }
};

/**
 * Gets the current timezone offset in minutes
 * 
 * @param date - Optional date to get the timezone offset for (defaults to current date)
 * @returns The timezone offset in minutes (positive for timezones behind UTC, negative for timezones ahead of UTC)
 */
export const getTimezoneOffset = (date: Date = new Date()): number => {
  return date.getTimezoneOffset();
};

/**
 * Converts a timezone offset in minutes to a formatted string
 * 
 * @param offsetMinutes - The timezone offset in minutes
 * @returns The formatted timezone offset string in the format '+HH:MM' or '-HH:MM'
 */
export const formatTimezoneOffset = (offsetMinutes: number): string => {
  // Note: getTimezoneOffset returns positive for timezones behind UTC and negative for timezones ahead
  // We need to negate this to get the conventional representation
  const offset = -offsetMinutes;
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMins = Math.abs(offset % 60);
  const direction = offset >= 0 ? '+' : '-';
  
  return `${direction}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
};

/**
 * Checks if a timezone offset string is valid
 * 
 * @param timezoneOffset - The timezone offset string to validate (e.g., '+05:30', '-08:00')
 * @returns True if the timezone offset string is valid, false otherwise
 */
export const isValidTimezoneOffset = (timezoneOffset: string): boolean => {
  if (!timezoneOffset) return false;
  
  // Regex for timezone offset format: +/-HH:MM or +/-HHMM
  const offsetRegex = /^[+-]([01]\d|2[0-3])(:?[0-5]\d)?$/;
  return offsetRegex.test(timezoneOffset);
};

/**
 * Checks if a timezone name is valid by attempting to use it with the Intl API
 * 
 * @param timezoneName - The IANA timezone name to validate (e.g., 'America/New_York')
 * @returns True if the timezone name is valid, false otherwise
 */
export const isValidTimezoneName = (timezoneName: string): boolean => {
  if (!timezoneName) return false;
  
  try {
    // Attempt to use the timezone with Intl API
    Intl.DateTimeFormat(undefined, { timeZone: timezoneName });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Gets the short timezone name (e.g., 'EST', 'PST') for a specific date
 * 
 * @param date - The date to get the timezone name for
 * @param locale - The locale to use (defaults to 'en-US')
 * @returns The short timezone name
 */
export const getShortTimezoneName = (date: Date = new Date(), locale: string = 'en-US'): string => {
  try {
    // Format the date with the timeZoneName option set to 'short'
    const formatter = new Intl.DateTimeFormat(locale, { timeZoneName: 'short' });
    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    
    return timeZonePart ? timeZonePart.value : '';
  } catch (error) {
    // Fallback for environments where Intl API is not fully supported
    return '';
  }
};

/**
 * Gets the long timezone name (e.g., 'Eastern Standard Time') for a specific date
 * 
 * @param date - The date to get the timezone name for
 * @param locale - The locale to use (defaults to 'en-US')
 * @returns The long timezone name
 */
export const getLongTimezoneName = (date: Date = new Date(), locale: string = 'en-US'): string => {
  try {
    // Format the date with the timeZoneName option set to 'long'
    const formatter = new Intl.DateTimeFormat(locale, { timeZoneName: 'long' });
    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    
    return timeZonePart ? timeZonePart.value : '';
  } catch (error) {
    // Fallback for environments where Intl API is not fully supported
    return '';
  }
};

/**
 * Converts a date to a specific timezone and returns the offset
 * 
 * @param date - The date to convert
 * @param timeZone - The IANA timezone name (e.g., 'America/New_York')
 * @returns The timezone offset in minutes for the specified timezone and date
 */
export const getTimezoneOffsetForZone = (date: Date, timeZone: string): number => {
  if (!isValidTimezoneName(timeZone)) {
    throw new Error(`Invalid timezone name: ${timeZone}`);
  }
  
  try {
    // Create a formatter with the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    
    // Format the date in the target timezone
    const targetTime = formatter.format(date);
    
    // Parse the formatted date back to a Date object
    const targetDate = new Date(targetTime);
    
    // Calculate the difference in minutes
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    
    return (tzDate.getTime() - utcDate.getTime()) / (60 * 1000);
  } catch (error) {
    throw new Error(`Error calculating timezone offset: ${error.message}`);
  }
};
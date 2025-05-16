/**
 * Date Validation Utilities
 * 
 * Provides comprehensive date validation functions for ensuring date integrity
 * across all backend services. These utilities are essential for appointment scheduling,
 * health records, insurance claims, and any date-dependent functionality.
 */

import {
  isValid,
  isBefore,
  isAfter,
  isSameDay,
  isWeekend,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  addDays,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

/**
 * Type guard for Date objects
 * Checks if a value is a valid Date object
 * 
 * @param value - The value to check
 * @returns True if the value is a valid Date object, false otherwise
 */
export const isDateObject = (value: any): value is Date => {
  return value instanceof Date && isValid(value);
};

/**
 * Enhanced type guard for date values
 * Checks if a value is a valid date (Date object, ISO string, or timestamp)
 * with improved type narrowing
 * 
 * @param value - The value to check
 * @returns True if the value is a valid date, false otherwise
 */
export const isValidDate = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  // Check if it's a Date object
  if (value instanceof Date) {
    return isValid(value);
  }
  
  // Check if it's a string that can be parsed as a date
  if (typeof value === 'string') {
    try {
      const dateObj = parseISO(value);
      return isValid(dateObj);
    } catch {
      return false;
    }
  }
  
  // Check if it's a number (timestamp)
  if (typeof value === 'number') {
    try {
      const dateObj = new Date(value);
      return isValid(dateObj) && !isNaN(dateObj.getTime());
    } catch {
      return false;
    }
  }
  
  return false;
};

/**
 * Normalizes a date value to a Date object
 * 
 * @param date - The date value to normalize (Date object, ISO string, or timestamp)
 * @returns A Date object or null if the input is invalid
 */
export const normalizeDate = (date: Date | string | number): Date | null => {
  if (!isValidDate(date)) {
    return null;
  }
  
  if (date instanceof Date) {
    return date;
  }
  
  if (typeof date === 'string') {
    return parseISO(date);
  }
  
  return new Date(date);
};

/**
 * Checks if a date is within a specified range with enhanced range handling
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param options - Options for range comparison
 * @returns True if the date is within the range, false otherwise
 */
export const isDateInRange = (
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number,
  options: { inclusive?: boolean } = { inclusive: true }
): boolean => {
  const dateObj = normalizeDate(date);
  const startDateObj = normalizeDate(startDate);
  const endDateObj = normalizeDate(endDate);
  
  if (!dateObj || !startDateObj || !endDateObj) {
    return false;
  }
  
  if (options.inclusive) {
    const isAfterOrEqualStart = isAfter(dateObj, startDateObj) || isSameDay(dateObj, startDateObj);
    const isBeforeOrEqualEnd = isBefore(dateObj, endDateObj) || isSameDay(dateObj, endDateObj);
    return isAfterOrEqualStart && isBeforeOrEqualEnd;
  } else {
    return isAfter(dateObj, startDateObj) && isBefore(dateObj, endDateObj);
  }
};

/**
 * Checks if a date is in the future
 * 
 * @param date - The date to check
 * @param options - Options for future date validation
 * @returns True if the date is in the future, false otherwise
 */
export const isFutureDate = (
  date: Date | string | number,
  options: { threshold?: number; thresholdUnit?: 'days' | 'months' | 'years'; referenceDate?: Date } = {}
): boolean => {
  const dateObj = normalizeDate(date);
  if (!dateObj) {
    return false;
  }
  
  const referenceDate = options.referenceDate || new Date();
  
  // If no threshold is specified, simply check if the date is in the future
  if (!options.threshold) {
    return isAfter(dateObj, referenceDate);
  }
  
  // Apply threshold based on the specified unit
  switch (options.thresholdUnit || 'days') {
    case 'days':
      return differenceInDays(dateObj, referenceDate) > options.threshold;
    case 'months':
      return differenceInMonths(dateObj, referenceDate) > options.threshold;
    case 'years':
      return differenceInYears(dateObj, referenceDate) > options.threshold;
    default:
      return isAfter(dateObj, referenceDate);
  }
};

/**
 * Checks if a date is in the past
 * 
 * @param date - The date to check
 * @param options - Options for past date validation
 * @returns True if the date is in the past, false otherwise
 */
export const isPastDate = (
  date: Date | string | number,
  options: { threshold?: number; thresholdUnit?: 'days' | 'months' | 'years'; referenceDate?: Date } = {}
): boolean => {
  const dateObj = normalizeDate(date);
  if (!dateObj) {
    return false;
  }
  
  const referenceDate = options.referenceDate || new Date();
  
  // If no threshold is specified, simply check if the date is in the past
  if (!options.threshold) {
    return isBefore(dateObj, referenceDate);
  }
  
  // Apply threshold based on the specified unit
  switch (options.thresholdUnit || 'days') {
    case 'days':
      return differenceInDays(referenceDate, dateObj) > options.threshold;
    case 'months':
      return differenceInMonths(referenceDate, dateObj) > options.threshold;
    case 'years':
      return differenceInYears(referenceDate, dateObj) > options.threshold;
    default:
      return isBefore(dateObj, referenceDate);
  }
};

// Brazilian holidays for 2023-2024
const BRAZILIAN_HOLIDAYS_2023_2024 = [
  // 2023 Holidays
  new Date(2023, 0, 1),  // New Year's Day
  new Date(2023, 1, 20), // Carnival Monday
  new Date(2023, 1, 21), // Carnival Tuesday
  new Date(2023, 1, 22), // Ash Wednesday (half-day)
  new Date(2023, 3, 7),  // Good Friday
  new Date(2023, 3, 21), // Tiradentes Day
  new Date(2023, 4, 1),  // Labor Day
  new Date(2023, 5, 8),  // Corpus Christi
  new Date(2023, 8, 7),  // Independence Day
  new Date(2023, 9, 12), // Our Lady of Aparecida
  new Date(2023, 10, 2), // All Souls' Day
  new Date(2023, 10, 15), // Republic Proclamation Day
  new Date(2023, 11, 25), // Christmas Day
  
  // 2024 Holidays
  new Date(2024, 0, 1),  // New Year's Day
  new Date(2024, 1, 12), // Carnival Monday
  new Date(2024, 1, 13), // Carnival Tuesday
  new Date(2024, 1, 14), // Ash Wednesday (half-day)
  new Date(2024, 2, 29), // Good Friday
  new Date(2024, 3, 21), // Tiradentes Day
  new Date(2024, 4, 1),  // Labor Day
  new Date(2024, 4, 30), // Corpus Christi
  new Date(2024, 8, 7),  // Independence Day
  new Date(2024, 9, 12), // Our Lady of Aparecida
  new Date(2024, 10, 2), // All Souls' Day
  new Date(2024, 10, 15), // Republic Proclamation Day
  new Date(2024, 10, 20), // National Day of Zumbi and Black Consciousness (new in 2024)
  new Date(2024, 11, 25), // Christmas Day
];

/**
 * Checks if a date is a Brazilian holiday
 * 
 * @param date - The date to check
 * @returns True if the date is a Brazilian holiday, false otherwise
 */
export const isBrazilianHoliday = (date: Date | string | number): boolean => {
  const dateObj = normalizeDate(date);
  if (!dateObj) {
    return false;
  }
  
  return BRAZILIAN_HOLIDAYS_2023_2024.some(holiday => isSameDay(holiday, dateObj));
};

/**
 * Checks if a date is a business day (not a weekend or holiday)
 * 
 * @param date - The date to check
 * @param options - Options for business day validation
 * @returns True if the date is a business day, false otherwise
 */
export const isBusinessDay = (
  date: Date | string | number,
  options: { countryCode?: string; timezone?: string } = { countryCode: 'BR' }
): boolean => {
  const dateObj = normalizeDate(date);
  if (!dateObj) {
    return false;
  }
  
  // Apply timezone if specified
  let adjustedDate = dateObj;
  if (options.timezone) {
    adjustedDate = utcToZonedTime(dateObj, options.timezone);
  }
  
  // Check if it's a weekend
  if (isWeekend(adjustedDate)) {
    return false;
  }
  
  // Check if it's a holiday based on country code
  if (options.countryCode === 'BR') {
    return !isBrazilianHoliday(adjustedDate);
  }
  
  // For other countries, only check weekends
  return true;
};

/**
 * Checks if a date is valid for a specific journey context
 * 
 * @param date - The date to check
 * @param journeyId - The journey identifier (health, care, plan)
 * @param options - Options for journey-specific validation
 * @returns True if the date is valid for the journey, false otherwise
 */
export const isValidJourneyDate = (
  date: Date | string | number,
  journeyId: string,
  options: { 
    maxFutureDays?: number; 
    maxPastDays?: number; 
    businessDaysOnly?: boolean;
    timezone?: string;
  } = {}
): boolean => {
  const dateObj = normalizeDate(date);
  if (!dateObj) {
    return false;
  }
  
  // Apply timezone if specified
  let adjustedDate = dateObj;
  if (options.timezone) {
    adjustedDate = utcToZonedTime(dateObj, options.timezone);
  }
  
  const now = options.timezone ? utcToZonedTime(new Date(), options.timezone) : new Date();
  
  // Journey-specific validations
  switch (journeyId.toLowerCase()) {
    case 'health':
      // Health journey: Allow past dates for health records, but limit future dates
      if (options.maxFutureDays && differenceInDays(adjustedDate, now) > options.maxFutureDays) {
        return false;
      }
      return true;
      
    case 'care':
      // Care journey: Only allow business days for appointments, limit both past and future
      if (options.businessDaysOnly && !isBusinessDay(adjustedDate, { countryCode: 'BR', timezone: options.timezone })) {
        return false;
      }
      if (options.maxPastDays && differenceInDays(now, adjustedDate) > options.maxPastDays) {
        return false;
      }
      if (options.maxFutureDays && differenceInDays(adjustedDate, now) > options.maxFutureDays) {
        return false;
      }
      return true;
      
    case 'plan':
      // Plan journey: Allow past dates for claims, but limit how far in the past
      if (options.maxPastDays && differenceInDays(now, adjustedDate) > options.maxPastDays) {
        return false;
      }
      return true;
      
    default:
      // Default validation
      return isValidDate(adjustedDate);
  }
};

/**
 * Validates a date range for a specific journey context
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param journeyId - The journey identifier (health, care, plan)
 * @param options - Options for journey-specific range validation
 * @returns True if the date range is valid for the journey, false otherwise
 */
export const isValidJourneyDateRange = (
  startDate: Date | string | number,
  endDate: Date | string | number,
  journeyId: string,
  options: { 
    maxRangeDays?: number; 
    businessDaysOnly?: boolean;
    timezone?: string;
  } = {}
): boolean => {
  const startDateObj = normalizeDate(startDate);
  const endDateObj = normalizeDate(endDate);
  
  if (!startDateObj || !endDateObj) {
    return false;
  }
  
  // Apply timezone if specified
  let adjustedStartDate = startDateObj;
  let adjustedEndDate = endDateObj;
  if (options.timezone) {
    adjustedStartDate = utcToZonedTime(startDateObj, options.timezone);
    adjustedEndDate = utcToZonedTime(endDateObj, options.timezone);
  }
  
  // Check if start date is before end date
  if (!isBefore(adjustedStartDate, adjustedEndDate)) {
    return false;
  }
  
  // Check if both dates are valid for the journey
  if (!isValidJourneyDate(adjustedStartDate, journeyId, options) || 
      !isValidJourneyDate(adjustedEndDate, journeyId, options)) {
    return false;
  }
  
  // Check if the range doesn't exceed the maximum allowed days
  if (options.maxRangeDays && 
      differenceInDays(adjustedEndDate, adjustedStartDate) > options.maxRangeDays) {
    return false;
  }
  
  return true;
};

/**
 * Validates a date in a specific timezone
 * 
 * @param date - The date to validate
 * @param timezone - The timezone to validate the date in
 * @param options - Additional validation options
 * @returns True if the date is valid in the specified timezone, false otherwise
 */
export const isValidDateInTimezone = (
  date: Date | string | number,
  timezone: string,
  options: { 
    businessDay?: boolean; 
    minDate?: Date | string | number;
    maxDate?: Date | string | number;
  } = {}
): boolean => {
  const dateObj = normalizeDate(date);
  if (!dateObj) {
    return false;
  }
  
  try {
    // Convert to the specified timezone
    const zonedDate = utcToZonedTime(dateObj, timezone);
    
    // Check if it's a business day if required
    if (options.businessDay && !isBusinessDay(zonedDate, { timezone })) {
      return false;
    }
    
    // Check min date if specified
    if (options.minDate) {
      const minDateObj = normalizeDate(options.minDate);
      if (minDateObj && isBefore(zonedDate, utcToZonedTime(minDateObj, timezone))) {
        return false;
      }
    }
    
    // Check max date if specified
    if (options.maxDate) {
      const maxDateObj = normalizeDate(options.maxDate);
      if (maxDateObj && isAfter(zonedDate, utcToZonedTime(maxDateObj, timezone))) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    // Invalid timezone or other error
    return false;
  }
};

/**
 * Gets the next valid business day from a given date
 * 
 * @param date - The starting date
 * @param options - Options for finding the next business day
 * @returns The next valid business day or null if not found within maxAttempts
 */
export const getNextBusinessDay = (
  date: Date | string | number,
  options: { 
    countryCode?: string; 
    timezone?: string; 
    skipToday?: boolean;
    maxAttempts?: number;
  } = { countryCode: 'BR', skipToday: false, maxAttempts: 10 }
): Date | null => {
  const dateObj = normalizeDate(date);
  if (!dateObj) {
    return null;
  }
  
  // Apply timezone if specified
  let currentDate = dateObj;
  if (options.timezone) {
    currentDate = utcToZonedTime(dateObj, options.timezone);
  }
  
  // Skip today if required
  if (options.skipToday) {
    currentDate = addDays(currentDate, 1);
  }
  
  let attempts = 0;
  const maxAttempts = options.maxAttempts || 10;
  
  while (attempts < maxAttempts) {
    if (isBusinessDay(currentDate, { 
      countryCode: options.countryCode || 'BR',
      timezone: options.timezone
    })) {
      // Convert back to UTC if timezone was applied
      return options.timezone ? zonedTimeToUtc(currentDate, options.timezone) : currentDate;
    }
    
    currentDate = addDays(currentDate, 1);
    attempts++;
  }
  
  return null; // No valid business day found within maxAttempts
};

/**
 * Checks if a date is within business hours
 * 
 * @param date - The date to check
 * @param options - Options for business hours validation
 * @returns True if the date is within business hours, false otherwise
 */
export const isWithinBusinessHours = (
  date: Date | string | number,
  options: { 
    timezone?: string;
    startHour?: number;
    endHour?: number;
    startMinute?: number;
    endMinute?: number;
  } = { startHour: 9, endHour: 17, startMinute: 0, endMinute: 0 }
): boolean => {
  const dateObj = normalizeDate(date);
  if (!dateObj) {
    return false;
  }
  
  // Apply timezone if specified
  let adjustedDate = dateObj;
  if (options.timezone) {
    adjustedDate = utcToZonedTime(dateObj, options.timezone);
  }
  
  // Check if it's a business day
  if (!isBusinessDay(adjustedDate, { timezone: options.timezone })) {
    return false;
  }
  
  const hours = adjustedDate.getHours();
  const minutes = adjustedDate.getMinutes();
  
  const startHour = options.startHour ?? 9;
  const endHour = options.endHour ?? 17;
  const startMinute = options.startMinute ?? 0;
  const endMinute = options.endMinute ?? 0;
  
  // Check if time is within business hours
  if (hours < startHour || (hours === startHour && minutes < startMinute)) {
    return false;
  }
  
  if (hours > endHour || (hours === endHour && minutes > endMinute)) {
    return false;
  }
  
  return true;
};
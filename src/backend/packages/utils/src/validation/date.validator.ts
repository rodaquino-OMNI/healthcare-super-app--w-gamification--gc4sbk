/**
 * Date Validation Utilities
 * 
 * This module provides comprehensive date validation utilities for ensuring date integrity
 * across all backend services. It includes validation for date ranges, future/past dates,
 * business days, and handling timezone-specific validation.
 * 
 * @module date.validator
 */

import {
  isValid,
  isBefore,
  isAfter,
  isSameDay,
  isWeekend,
  isWithinInterval,
  parseISO,
  addDays,
  subDays,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  startOfDay,
  endOfDay,
  format
} from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Brazilian holidays for the current year
 * This should be updated annually or retrieved from an API
 */
const BRAZILIAN_HOLIDAYS_2023 = [
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
];

// Add 2024 holidays
const BRAZILIAN_HOLIDAYS_2024 = [
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
  new Date(2024, 11, 25), // Christmas Day
];

// Combine holidays
const BRAZILIAN_HOLIDAYS = [...BRAZILIAN_HOLIDAYS_2023, ...BRAZILIAN_HOLIDAYS_2024];

/**
 * Journey-specific date constraints
 */
interface JourneyDateConstraints {
  minDate?: Date;
  maxDate?: Date;
  allowWeekends?: boolean;
  allowHolidays?: boolean;
  timeRestrictions?: {
    minHour?: number;
    maxHour?: number;
    minMinute?: number;
    maxMinute?: number;
  };
}

/**
 * Default journey constraints
 */
const DEFAULT_JOURNEY_CONSTRAINTS: Record<string, JourneyDateConstraints> = {
  health: {
    minDate: new Date(1900, 0, 1),
    maxDate: new Date(new Date().getFullYear() + 1, 11, 31),
    allowWeekends: true,
    allowHolidays: true,
  },
  care: {
    minDate: new Date(),
    maxDate: new Date(new Date().getFullYear() + 1, 11, 31),
    allowWeekends: false,
    allowHolidays: false,
    timeRestrictions: {
      minHour: 8,
      maxHour: 18,
      minMinute: 0,
      maxMinute: 30,
    },
  },
  plan: {
    minDate: new Date(new Date().getFullYear() - 5, 0, 1),
    maxDate: new Date(),
    allowWeekends: false,
    allowHolidays: false,
  },
};

/**
 * Type guard for Date objects
 * @param value - The value to check
 * @returns True if the value is a Date object
 */
const isDateObject = (value: any): value is Date => {
  return value instanceof Date;
};

/**
 * Normalizes a date input to a Date object
 * 
 * @param date - The date to normalize (Date, string, or number)
 * @returns A Date object or null if invalid
 */
export const normalizeDate = (date: Date | string | number): Date | null => {
  if (date === null || date === undefined) {
    return null;
  }
  
  if (isDateObject(date)) {
    return date;
  }
  
  if (typeof date === 'string') {
    try {
      // Try to parse as ISO string first
      const parsedDate = parseISO(date);
      if (isValid(parsedDate)) {
        return parsedDate;
      }
      
      // If not valid ISO, try as timestamp
      const timestampDate = new Date(date);
      return isValid(timestampDate) ? timestampDate : null;
    } catch (error) {
      return null;
    }
  }
  
  if (typeof date === 'number') {
    try {
      const timestampDate = new Date(date);
      return isValid(timestampDate) ? timestampDate : null;
    } catch (error) {
      return null;
    }
  }
  
  return null;
};

/**
 * Checks if a date is valid
 * Enhanced version with improved type narrowing and validation
 * 
 * @param date - The date to validate (Date, string, or number)
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (date: any): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  const normalizedDate = normalizeDate(date);
  return normalizedDate !== null;
};

/**
 * Checks if a date is within a specified range
 * Enhanced version with better range handling and validation
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param options - Options for range validation
 * @returns True if the date is within the range, false otherwise
 */
export const isDateInRange = (
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number,
  options: { inclusive?: boolean } = { inclusive: true }
): boolean => {
  const normalizedDate = normalizeDate(date);
  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);
  
  if (!normalizedDate || !normalizedStartDate || !normalizedEndDate) {
    return false;
  }
  
  if (options.inclusive) {
    return isWithinInterval(normalizedDate, {
      start: normalizedStartDate,
      end: normalizedEndDate
    });
  } else {
    return (
      isAfter(normalizedDate, normalizedStartDate) &&
      isBefore(normalizedDate, normalizedEndDate)
    );
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
  options: {
    referenceDate?: Date;
    minDaysInFuture?: number;
    maxDaysInFuture?: number;
    inclusive?: boolean;
  } = {}
): boolean => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return false;
  }
  
  const referenceDate = options.referenceDate || new Date();
  const startOfReferenceDay = startOfDay(referenceDate);
  
  // Check if date is in the future
  if (options.inclusive) {
    if (isBefore(normalizedDate, startOfReferenceDay)) {
      return false;
    }
  } else {
    if (!isAfter(normalizedDate, referenceDate)) {
      return false;
    }
  }
  
  // Check minimum days in future constraint
  if (options.minDaysInFuture !== undefined) {
    const minFutureDate = addDays(startOfReferenceDay, options.minDaysInFuture);
    if (isBefore(normalizedDate, minFutureDate)) {
      return false;
    }
  }
  
  // Check maximum days in future constraint
  if (options.maxDaysInFuture !== undefined) {
    const maxFutureDate = addDays(startOfReferenceDay, options.maxDaysInFuture);
    if (isAfter(normalizedDate, endOfDay(maxFutureDate))) {
      return false;
    }
  }
  
  return true;
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
  options: {
    referenceDate?: Date;
    minDaysInPast?: number;
    maxDaysInPast?: number;
    inclusive?: boolean;
  } = {}
): boolean => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return false;
  }
  
  const referenceDate = options.referenceDate || new Date();
  const startOfReferenceDay = startOfDay(referenceDate);
  
  // Check if date is in the past
  if (options.inclusive) {
    if (isAfter(normalizedDate, startOfReferenceDay)) {
      return false;
    }
  } else {
    if (!isBefore(normalizedDate, referenceDate)) {
      return false;
    }
  }
  
  // Check minimum days in past constraint
  if (options.minDaysInPast !== undefined) {
    const minPastDate = subDays(startOfReferenceDay, options.minDaysInPast);
    if (isAfter(normalizedDate, minPastDate)) {
      return false;
    }
  }
  
  // Check maximum days in past constraint
  if (options.maxDaysInPast !== undefined) {
    const maxPastDate = subDays(startOfReferenceDay, options.maxDaysInPast);
    if (isBefore(normalizedDate, startOfDay(maxPastDate))) {
      return false;
    }
  }
  
  return true;
};

/**
 * Checks if a date is a business day (not a weekend or holiday in Brazil)
 * 
 * @param date - The date to check
 * @param options - Options for business day validation
 * @returns True if the date is a business day, false otherwise
 */
export const isBusinessDay = (
  date: Date | string | number,
  options: {
    includeHolidays?: boolean;
    customHolidays?: Date[];
    region?: string;
  } = { includeHolidays: true, region: 'BR' }
): boolean => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return false;
  }
  
  // Check if it's a weekend
  if (isWeekend(normalizedDate)) {
    return false;
  }
  
  // Skip holiday check if not required
  if (!options.includeHolidays) {
    return true;
  }
  
  // Combine default and custom holidays
  const holidays = options.region === 'BR' 
    ? [...BRAZILIAN_HOLIDAYS, ...(options.customHolidays || [])]
    : options.customHolidays || [];
  
  // Check if it's a holiday
  return !holidays.some(holiday => isSameDay(normalizedDate!, holiday));
};

/**
 * Validates a date according to journey-specific constraints
 * 
 * @param date - The date to validate
 * @param journeyId - The journey identifier (health, care, plan)
 * @param options - Additional validation options
 * @returns True if the date is valid for the specified journey, false otherwise
 */
export const isValidJourneyDate = (
  date: Date | string | number,
  journeyId: string,
  options: {
    customConstraints?: JourneyDateConstraints;
    referenceDate?: Date;
    timezone?: string;
  } = {}
): boolean => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return false;
  }
  
  const timezone = options.timezone || 'America/Sao_Paulo';
  const referenceDate = options.referenceDate || new Date();
  const journeyKey = journeyId.toLowerCase();
  
  // Convert to the specified timezone if provided
  const dateInTimezone = timezone ? utcToZonedTime(normalizedDate, timezone) : normalizedDate;
  const referenceDateInTimezone = timezone ? utcToZonedTime(referenceDate, timezone) : referenceDate;
  
  // Get journey constraints (custom or default)
  const constraints = options.customConstraints || 
    DEFAULT_JOURNEY_CONSTRAINTS[journeyKey] || 
    DEFAULT_JOURNEY_CONSTRAINTS.health; // Fallback to health constraints
  
  // Check date range
  if (constraints.minDate) {
    const minDateInTimezone = timezone ? utcToZonedTime(constraints.minDate, timezone) : constraints.minDate;
    if (isBefore(dateInTimezone, minDateInTimezone)) {
      return false;
    }
  }
  
  if (constraints.maxDate) {
    const maxDateInTimezone = timezone ? utcToZonedTime(constraints.maxDate, timezone) : constraints.maxDate;
    if (isAfter(dateInTimezone, maxDateInTimezone)) {
      return false;
    }
  }
  
  // Check weekend restriction
  if (!constraints.allowWeekends && isWeekend(dateInTimezone)) {
    return false;
  }
  
  // Check holiday restriction
  if (!constraints.allowHolidays && !isBusinessDay(dateInTimezone, { region: 'BR' })) {
    return false;
  }
  
  // Check time restrictions if specified
  if (constraints.timeRestrictions) {
    const { minHour, maxHour, minMinute, maxMinute } = constraints.timeRestrictions;
    const hours = dateInTimezone.getHours();
    const minutes = dateInTimezone.getMinutes();
    
    if (minHour !== undefined && hours < minHour) {
      return false;
    }
    
    if (maxHour !== undefined && hours > maxHour) {
      return false;
    }
    
    if (minMinute !== undefined && hours === minHour && minutes < minMinute) {
      return false;
    }
    
    if (maxMinute !== undefined && hours === maxHour && minutes > maxMinute) {
      return false;
    }
  }
  
  // Journey-specific additional validations
  switch (journeyKey) {
    case 'health':
      // Health journey might have specific validations
      // For example, certain health metrics might have specific time constraints
      break;
      
    case 'care':
      // Care journey might have specific validations
      // For example, appointments might need to be scheduled in advance
      break;
      
    case 'plan':
      // Plan journey might have specific validations
      // For example, claims might need to be filed within a certain timeframe
      break;
  }
  
  return true;
};

/**
 * Validates a date with timezone consideration
 * 
 * @param date - The date to validate
 * @param options - Options for timezone validation
 * @returns True if the date is valid in the specified timezone, false otherwise
 */
export const isValidDateWithTimezone = (
  date: Date | string | number,
  options: {
    timezone?: string;
    businessHoursOnly?: boolean;
    minHour?: number;
    maxHour?: number;
    allowWeekends?: boolean;
    allowHolidays?: boolean;
  } = {}
): boolean => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return false;
  }
  
  // Default to São Paulo timezone if not specified
  const timezone = options.timezone || 'America/Sao_Paulo';
  
  // Convert to the specified timezone
  const zonedDate = utcToZonedTime(normalizedDate, timezone);
  
  // Check business hours if required
  if (options.businessHoursOnly) {
    const hours = zonedDate.getHours();
    const minHour = options.minHour !== undefined ? options.minHour : 8; // Default business hours: 8 AM
    const maxHour = options.maxHour !== undefined ? options.maxHour : 18; // Default business hours: 6 PM
    
    if (hours < minHour || hours >= maxHour) {
      return false;
    }
  }
  
  // Check weekend restriction
  if (options.allowWeekends === false && isWeekend(zonedDate)) {
    return false;
  }
  
  // Check holiday restriction (using the timezone's region)
  if (options.allowHolidays === false) {
    // Extract region from timezone (simplified approach)
    const region = timezone.includes('America') ? 'BR' : 
                  timezone.includes('Europe') ? 'EU' : 'GLOBAL';
    
    if (!isBusinessDay(zonedDate, { region })) {
      return false;
    }
  }
  
  return true;
};

/**
 * Validates a date range
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param options - Options for date range validation
 * @returns True if the date range is valid, false otherwise
 */
export const isValidDateRange = (
  startDate: Date | string | number,
  endDate: Date | string | number,
  options: {
    maxRangeDays?: number;
    minRangeDays?: number;
    allowSameDay?: boolean;
    journeyId?: string;
  } = {}
): boolean => {
  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);
  
  if (!normalizedStartDate || !normalizedEndDate) {
    return false;
  }
  
  // Check if end date is after start date (or same day if allowed)
  if (isBefore(normalizedEndDate, normalizedStartDate)) {
    return false;
  }
  
  if (!options.allowSameDay && isSameDay(normalizedStartDate, normalizedEndDate)) {
    return false;
  }
  
  // Calculate range in days
  const rangeDays = differenceInDays(normalizedEndDate, normalizedStartDate);
  
  // Check minimum range constraint
  if (options.minRangeDays !== undefined && rangeDays < options.minRangeDays) {
    return false;
  }
  
  // Check maximum range constraint
  if (options.maxRangeDays !== undefined && rangeDays > options.maxRangeDays) {
    return false;
  }
  
  // Check journey-specific constraints if specified
  if (options.journeyId) {
    return (
      isValidJourneyDate(normalizedStartDate, options.journeyId) &&
      isValidJourneyDate(normalizedEndDate, options.journeyId)
    );
  }
  
  return true;
};

/**
 * Validates a date for appointment scheduling
 * Specialized validator for the care journey
 * 
 * @param date - The date to validate
 * @param options - Options for appointment date validation
 * @returns True if the date is valid for an appointment, false otherwise
 */
export const isValidAppointmentDate = (
  date: Date | string | number,
  options: {
    minDaysInFuture?: number;
    maxDaysInFuture?: number;
    allowWeekends?: boolean;
    allowHolidays?: boolean;
    timeSlotMinutes?: number;
    timezone?: string;
    providerTimeZone?: string;
  } = {}
): boolean => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return false;
  }
  
  // Default options for appointment scheduling
  const minDaysInFuture = options.minDaysInFuture !== undefined ? options.minDaysInFuture : 1;
  const maxDaysInFuture = options.maxDaysInFuture !== undefined ? options.maxDaysInFuture : 60;
  const allowWeekends = options.allowWeekends !== undefined ? options.allowWeekends : false;
  const allowHolidays = options.allowHolidays !== undefined ? options.allowHolidays : false;
  const timeSlotMinutes = options.timeSlotMinutes !== undefined ? options.timeSlotMinutes : 30;
  const timezone = options.timezone || 'America/Sao_Paulo';
  
  // Convert to the specified timezone if provided
  const dateInTimezone = timezone ? utcToZonedTime(normalizedDate, timezone) : normalizedDate;
  const nowInTimezone = timezone ? utcToZonedTime(new Date(), timezone) : new Date();
  
  // Check if date is in the future within allowed range
  const minFutureDate = addDays(startOfDay(nowInTimezone), minDaysInFuture);
  const maxFutureDate = addDays(startOfDay(nowInTimezone), maxDaysInFuture);
  
  if (isBefore(dateInTimezone, minFutureDate) || isAfter(dateInTimezone, maxFutureDate)) {
    return false;
  }
  
  // Check weekend restriction
  if (!allowWeekends && isWeekend(dateInTimezone)) {
    return false;
  }
  
  // Check holiday restriction
  if (!allowHolidays && !isBusinessDay(dateInTimezone, { region: 'BR' })) {
    return false;
  }
  
  // Check if time is aligned with time slots
  const minutes = dateInTimezone.getMinutes();
  if (minutes % timeSlotMinutes !== 0) {
    return false;
  }
  
  // If provider timezone is different, check if it's within business hours in provider's timezone
  if (options.providerTimeZone && options.providerTimeZone !== timezone) {
    const dateInProviderTimezone = utcToZonedTime(normalizedDate, options.providerTimeZone);
    
    // Check if it's a business day in provider's timezone
    if (!allowWeekends && isWeekend(dateInProviderTimezone)) {
      return false;
    }
    
    if (!allowHolidays && !isBusinessDay(dateInProviderTimezone, { 
      region: options.providerTimeZone.includes('America') ? 'BR' : 'GLOBAL' 
    })) {
      return false;
    }
    
    // Check if it's within business hours in provider's timezone
    const providerHours = dateInProviderTimezone.getHours();
    if (providerHours < 8 || providerHours >= 18) { // Default business hours: 8 AM - 6 PM
      return false;
    }
  }
  
  // Use care journey constraints
  return isValidJourneyDate(normalizedDate, 'care', {
    customConstraints: timezone ? {
      minDate: minFutureDate,
      maxDate: maxFutureDate,
      allowWeekends,
      allowHolidays,
      timeRestrictions: {
        minHour: 8,
        maxHour: 18,
        minMinute: 0,
        maxMinute: 30,
      },
    } : undefined
  });
};

/**
 * Validates a date for health metrics recording
 * Specialized validator for the health journey
 * 
 * @param date - The date to validate
 * @param options - Options for health metric date validation
 * @returns True if the date is valid for a health metric, false otherwise
 */
export const isValidHealthMetricDate = (
  date: Date | string | number,
  options: {
    maxDaysInPast?: number;
    allowFutureDates?: boolean;
    metricType?: string;
    timezone?: string;
  } = {}
): boolean => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return false;
  }
  
  // Default options for health metrics
  const maxDaysInPast = options.maxDaysInPast !== undefined ? options.maxDaysInPast : 30;
  const allowFutureDates = options.allowFutureDates !== undefined ? options.allowFutureDates : false;
  const timezone = options.timezone || 'America/Sao_Paulo';
  
  // Convert to the specified timezone if provided
  const dateInTimezone = timezone ? utcToZonedTime(normalizedDate, timezone) : normalizedDate;
  const nowInTimezone = timezone ? utcToZonedTime(new Date(), timezone) : new Date();
  
  // Check if date is not in the future (unless allowed)
  if (!allowFutureDates && isAfter(dateInTimezone, nowInTimezone)) {
    return false;
  }
  
  // Check if date is not too far in the past
  if (maxDaysInPast > 0) {
    const oldestAllowedDate = subDays(startOfDay(nowInTimezone), maxDaysInPast);
    if (isBefore(dateInTimezone, oldestAllowedDate)) {
      return false;
    }
  }
  
  // Apply metric-specific validation if needed
  if (options.metricType) {
    switch (options.metricType.toLowerCase()) {
      case 'weight':
      case 'blood_pressure':
      case 'blood_glucose':
        // These metrics typically allow recording once per day
        // Check if there's already a record for this day (would require database check)
        // This is a placeholder for actual implementation
        break;
        
      case 'heart_rate':
      case 'oxygen_saturation':
        // These metrics can be recorded multiple times per day
        // No additional validation needed
        break;
        
      case 'sleep':
        // Sleep data should be for the previous night
        // This is a placeholder for actual implementation
        break;
    }
  }
  
  // Use health journey constraints
  return isValidJourneyDate(normalizedDate, 'health', {
    customConstraints: timezone ? {
      // Adjust constraints based on timezone if needed
      minDate: new Date(1900, 0, 1),
      maxDate: nowInTimezone,
      allowWeekends: true,
      allowHolidays: true,
    } : undefined
  });
};

/**
 * Validates a date for insurance claims
 * Specialized validator for the plan journey
 * 
 * @param date - The date to validate
 * @param options - Options for claim date validation
 * @returns True if the date is valid for an insurance claim, false otherwise
 */
export const isValidClaimDate = (
  date: Date | string | number,
  options: {
    maxDaysInPast?: number;
    allowFutureDates?: boolean;
    claimType?: string;
    timezone?: string;
  } = {}
): boolean => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return false;
  }
  
  // Default options for insurance claims
  const maxDaysInPast = options.maxDaysInPast !== undefined ? options.maxDaysInPast : 90; // Typically 90 days to file a claim
  const allowFutureDates = options.allowFutureDates !== undefined ? options.allowFutureDates : false;
  const timezone = options.timezone || 'America/Sao_Paulo';
  
  // Convert to the specified timezone if provided
  const dateInTimezone = timezone ? utcToZonedTime(normalizedDate, timezone) : normalizedDate;
  const nowInTimezone = timezone ? utcToZonedTime(new Date(), timezone) : new Date();
  
  // Check if date is not in the future (unless allowed)
  if (!allowFutureDates && isAfter(dateInTimezone, nowInTimezone)) {
    return false;
  }
  
  // Check if date is not too far in the past
  if (maxDaysInPast > 0) {
    const oldestAllowedDate = subDays(startOfDay(nowInTimezone), maxDaysInPast);
    if (isBefore(dateInTimezone, oldestAllowedDate)) {
      return false;
    }
  }
  
  // Apply claim-specific validation if needed
  if (options.claimType) {
    switch (options.claimType.toLowerCase()) {
      case 'medical':
        // Medical claims might have different time limits
        // This is a placeholder for actual implementation
        break;
        
      case 'dental':
        // Dental claims might have different time limits
        // This is a placeholder for actual implementation
        break;
        
      case 'pharmacy':
        // Pharmacy claims might have different time limits
        // This is a placeholder for actual implementation
        break;
    }
  }
  
  // Check if it's a business day (claims typically need to be filed on business days)
  if (!isBusinessDay(dateInTimezone, { region: 'BR' })) {
    // Allow the claim date to be on a non-business day, but note that processing will begin on next business day
    // This is just a validation, not a restriction
  }
  
  // Use plan journey constraints
  return isValidJourneyDate(normalizedDate, 'plan', {
    customConstraints: timezone ? {
      minDate: new Date(new Date().getFullYear() - 5, 0, 1), // Claims typically allowed up to 5 years in the past
      maxDate: allowFutureDates ? undefined : nowInTimezone,
      allowWeekends: true, // Allow weekend dates for claim events (but processing happens on business days)
      allowHolidays: true, // Allow holiday dates for claim events (but processing happens on business days)
    } : undefined
  });
};

/**
 * Formats a date according to the specified format and timezone
 * 
 * @param date - The date to format
 * @param timezone - The timezone to use for formatting
 * @param formatStr - The format string to use
 * @param locale - The locale to use for formatting
 * @returns Formatted date string in the specified timezone
 */
export const formatDateInTimezone = (
  date: Date | string | number,
  timezone: string,
  formatStr: string,
  locale: { code: string; [key: string]: any } = { code: 'pt-BR' }
): string => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return '';
  }
  
  try {
    return formatInTimeZone(normalizedDate, timezone, formatStr, { locale });
  } catch (error) {
    // Fallback to basic formatting if timezone formatting fails
    return format(normalizedDate, formatStr);
  }
};

/**
 * Formats a date according to journey-specific requirements
 * 
 * @param date - The date to format
 * @param journeyId - The journey identifier (health, care, plan)
 * @param options - Options for formatting
 * @returns Journey-specific formatted date
 */
export const formatJourneyDate = (
  date: Date | string | number,
  journeyId: string,
  options: {
    locale?: { code: string; [key: string]: any };
    timezone?: string;
  } = {}
): string => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return '';
  }
  
  const locale = options.locale || { code: 'pt-BR' };
  const timezone = options.timezone || 'America/Sao_Paulo';
  
  // Journey-specific formats
  switch (journeyId.toLowerCase()) {
    case 'health':
      // Health journey uses detailed format with time for metrics
      return formatDateInTimezone(normalizedDate, timezone, 'dd/MM/yyyy HH:mm', locale);
      
    case 'care':
      // Care journey uses appointment-friendly format
      return formatDateInTimezone(normalizedDate, timezone, 'EEE, dd MMM yyyy', locale);
      
    case 'plan':
      // Plan journey uses formal date format for claims and documents
      return formatDateInTimezone(normalizedDate, timezone, 'dd/MM/yyyy', locale);
      
    default:
      // Default format
      return formatDateInTimezone(normalizedDate, timezone, 'dd/MM/yyyy', locale);
  }
};
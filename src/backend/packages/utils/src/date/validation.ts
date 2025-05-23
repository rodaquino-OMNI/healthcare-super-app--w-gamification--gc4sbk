/**
 * Date validation utilities
 * 
 * This module provides functions for validating date objects, strings, and numbers
 * before they are processed by other date utility functions. These validation
 * functions help prevent errors from invalid date operations.
 */

import { isValid, isBefore, isAfter } from 'date-fns';

/**
 * Type representing valid date inputs (Date object, timestamp number, or date string)
 */
export type DateInput = Date | string | number;

/**
 * Error messages for date validation
 */
export const DATE_VALIDATION_ERRORS = {
  INVALID_DATE: 'Invalid date provided',
  NULL_OR_UNDEFINED: 'Date cannot be null or undefined',
  INVALID_TYPE: 'Date must be a Date object, string, or number',
  INVALID_DATE_STRING: 'Invalid date string format',
  INVALID_DATE_RANGE: 'Start date must be before or equal to end date',
  INVALID_DATE_FORMAT: 'Date string does not match required format',
};

/**
 * Checks if a value is a valid date
 * 
 * @param date - The value to validate as a date
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (date: unknown): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  if (date instanceof Date) {
    return isValid(date);
  }
  
  if (typeof date === 'string') {
    const dateObj = new Date(date);
    return isValid(dateObj) && !isNaN(dateObj.getTime());
  }
  
  if (typeof date === 'number') {
    const dateObj = new Date(date);
    return isValid(dateObj) && !isNaN(dateObj.getTime());
  }
  
  return false;
};

/**
 * Checks if a value is a valid date and throws an error if not
 * 
 * @param date - The value to validate as a date
 * @param errorMessage - Custom error message (optional)
 * @throws Error if the date is invalid
 * @returns The validated date as a Date object
 */
export const validateDate = (date: unknown, errorMessage?: string): Date => {
  if (date === null || date === undefined) {
    throw new Error(errorMessage || DATE_VALIDATION_ERRORS.NULL_OR_UNDEFINED);
  }
  
  if (date instanceof Date) {
    if (!isValid(date)) {
      throw new Error(errorMessage || DATE_VALIDATION_ERRORS.INVALID_DATE);
    }
    return date;
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const dateObj = new Date(date);
    if (!isValid(dateObj) || isNaN(dateObj.getTime())) {
      throw new Error(errorMessage || DATE_VALIDATION_ERRORS.INVALID_DATE);
    }
    return dateObj;
  }
  
  throw new Error(errorMessage || DATE_VALIDATION_ERRORS.INVALID_TYPE);
};

/**
 * Checks if a string is a valid date string that can be parsed into a Date object
 * 
 * @param dateStr - The string to validate as a date
 * @returns True if the string can be parsed into a valid date, false otherwise
 */
export const isValidDateString = (dateStr: string): boolean => {
  if (typeof dateStr !== 'string') {
    return false;
  }
  
  const dateObj = new Date(dateStr);
  return isValid(dateObj) && !isNaN(dateObj.getTime());
};

/**
 * Checks if a string is a valid ISO 8601 date string
 * 
 * @param dateStr - The string to validate as an ISO date
 * @returns True if the string is a valid ISO date, false otherwise
 */
export const isValidISODateString = (dateStr: string): boolean => {
  if (typeof dateStr !== 'string') {
    return false;
  }
  
  // ISO 8601 regex pattern
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;
  
  if (!isoPattern.test(dateStr)) {
    return false;
  }
  
  const dateObj = new Date(dateStr);
  return isValid(dateObj) && !isNaN(dateObj.getTime());
};

/**
 * Checks if a date is in the past (before current date)
 * 
 * @param date - The date to check
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the past, false otherwise
 */
export const isDateInPast = (date: DateInput, referenceDate: Date = new Date()): boolean => {
  if (!isValidDate(date) || !isValidDate(referenceDate)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return isBefore(dateObj, referenceDate);
};

/**
 * Checks if a date is in the future (after current date)
 * 
 * @param date - The date to check
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the future, false otherwise
 */
export const isDateInFuture = (date: DateInput, referenceDate: Date = new Date()): boolean => {
  if (!isValidDate(date) || !isValidDate(referenceDate)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return isAfter(dateObj, referenceDate);
};

/**
 * Checks if a date range is valid (start date is before or equal to end date)
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the range is valid, false otherwise
 */
export const isValidDateRange = (startDate: DateInput, endDate: DateInput): boolean => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;
  
  // Valid if start date is before end date or they are the same date
  return isBefore(startDateObj, endDateObj) || startDateObj.getTime() === endDateObj.getTime();
};

/**
 * Validates a date range and throws an error if invalid
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param errorMessage - Custom error message (optional)
 * @throws Error if the date range is invalid
 * @returns Object containing validated start and end dates
 */
export const validateDateRange = (
  startDate: DateInput,
  endDate: DateInput,
  errorMessage?: string
): { startDate: Date; endDate: Date } => {
  const validatedStartDate = validateDate(startDate);
  const validatedEndDate = validateDate(endDate);
  
  if (!isValidDateRange(validatedStartDate, validatedEndDate)) {
    throw new Error(errorMessage || DATE_VALIDATION_ERRORS.INVALID_DATE_RANGE);
  }
  
  return {
    startDate: validatedStartDate,
    endDate: validatedEndDate
  };
};

/**
 * Checks if a date string matches a specific format pattern
 * 
 * @param dateStr - The date string to validate
 * @param formatPattern - Regular expression pattern for the expected format
 * @returns True if the string matches the format, false otherwise
 */
export const isValidDateFormat = (dateStr: string, formatPattern: RegExp): boolean => {
  if (typeof dateStr !== 'string') {
    return false;
  }
  
  return formatPattern.test(dateStr);
};

/**
 * Common date format patterns for validation
 */
export const DATE_FORMAT_PATTERNS = {
  // DD/MM/YYYY
  DMY_SLASH: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/,
  // MM/DD/YYYY
  MDY_SLASH: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d\d$/,
  // YYYY/MM/DD
  YMD_SLASH: /^(19|20)\d\d\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/,
  // DD-MM-YYYY
  DMY_DASH: /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d\d$/,
  // MM-DD-YYYY
  MDY_DASH: /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-(19|20)\d\d$/,
  // YYYY-MM-DD
  YMD_DASH: /^(19|20)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
  // ISO 8601
  ISO: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/,
  // Time HH:MM
  TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)$/,
  // Time HH:MM:SS
  TIME_24H_SECONDS: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
};
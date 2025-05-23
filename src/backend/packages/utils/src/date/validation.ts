/**
 * Date Validation Utilities
 * 
 * This module provides functions for validating date objects, strings, and numbers.
 * These utilities help ensure that dates are valid before processing, preventing
 * errors and exceptions in date operations.
 * 
 * @packageDocumentation
 */

import { isValid } from 'date-fns';
import { isBefore, isAfter, isSameDay as fnIsSameDay } from 'date-fns';

/**
 * Checks if a date is valid
 * 
 * @param date - The date to validate (can be Date object, string, or number)
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (date: any): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  if (date instanceof Date) {
    return isValid(date);
  }
  
  if (typeof date === 'string') {
    const dateObj = new Date(date);
    return isValid(dateObj);
  }
  
  if (typeof date === 'number') {
    const dateObj = new Date(date);
    return isValid(dateObj);
  }
  
  return false;
};

/**
 * Checks if a date is within a specified range
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @param startDate - The start date of the range (can be Date object, string, or number)
 * @param endDate - The end date of the range (can be Date object, string, or number)
 * @returns True if the date is within the range (inclusive), false otherwise
 */
export const isDateInRange = (
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number
): boolean => {
  if (!isValidDate(date) || !isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;
  
  const isAfterOrEqualStart = isAfter(dateObj, startDateObj) || fnIsSameDay(dateObj, startDateObj);
  const isBeforeOrEqualEnd = isBefore(dateObj, endDateObj) || fnIsSameDay(dateObj, endDateObj);
  
  return isAfterOrEqualStart && isBeforeOrEqualEnd;
};

/**
 * Validates a date string against a specific format
 * 
 * @param dateStr - The date string to validate
 * @param formatStr - The expected format (e.g., 'yyyy-MM-dd')
 * @param referenceDate - The reference date to use for relative parsing (defaults to current date)
 * @returns True if the date string matches the expected format and is valid, false otherwise
 */
export const isValidDateFormat = (
  dateStr: string, 
  formatStr: string,
  referenceDate: Date = new Date()
): boolean => {
  if (!dateStr || !formatStr) {
    return false;
  }
  
  try {
    // Import parse and isValid from date-fns
    const { parse, isValid } = require('date-fns');
    
    // Attempt to parse the date string according to the format
    const parsedDate = parse(dateStr, formatStr, referenceDate);
    
    // Check if the parsed date is valid
    return isValid(parsedDate);
  } catch (error) {
    // If parsing fails, the date string doesn't match the format
    return false;
  }
};

/**
 * Checks if a date is in the past
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the past, false otherwise
 */
export const isPastDate = (
  date: Date | string | number,
  referenceDate: Date = new Date()
): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  return isBefore(dateObj, referenceDate);
};

/**
 * Checks if a date is in the future
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the future, false otherwise
 */
export const isFutureDate = (
  date: Date | string | number,
  referenceDate: Date = new Date()
): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  return isAfter(dateObj, referenceDate);
};

/**
 * Checks if a date is today
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @returns True if the date is today, false otherwise
 */
export const isToday = (date: Date | string | number): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const today = new Date();
  
  return fnIsSameDay(dateObj, today);
};
/**
 * Date Validation Utilities Implementation
 * 
 * This module provides the implementation of functions for validating date objects, strings, and numbers.
 * These utilities are critical for ensuring that dates are valid before processing,
 * preventing errors and exceptions in date operations.
 * 
 * @packageDocumentation
 * @internal This file is for internal use only and should not be imported directly.
 */

import { isValid, isBefore, isAfter } from 'date-fns';
import { isSameDay as fnIsSameDay } from 'date-fns';

/**
 * Checks if a date is valid
 * 
 * @param date - The date to validate (can be Date object, string, or number)
 * @returns True if the date is valid, false otherwise
 * 
 * @internal
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
 * 
 * @internal
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
import { isSameDay as fnIsSameDay, isAfter, isBefore } from 'date-fns'; // date-fns version: 3.3.1
import { isValidDate } from './validation';

/**
 * Checks if two dates are the same day
 * 
 * @param dateA - The first date (can be Date object, string, or number)
 * @param dateB - The second date (can be Date object, string, or number)
 * @returns True if dates are the same day, false otherwise
 */
export const isSameDay = (
  dateA: Date | string | number,
  dateB: Date | string | number
): boolean => {
  if (!isValidDate(dateA) || !isValidDate(dateB)) {
    return false;
  }
  
  const dateAObj = typeof dateA === 'string' || typeof dateA === 'number' ? new Date(dateA) : dateA;
  const dateBObj = typeof dateB === 'string' || typeof dateB === 'number' ? new Date(dateB) : dateB;
  
  return fnIsSameDay(dateAObj, dateBObj);
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
 * Checks if a date is before another date
 * 
 * @param dateA - The date to check (can be Date object, string, or number)
 * @param dateB - The reference date (can be Date object, string, or number)
 * @returns True if dateA is before dateB, false otherwise
 */
export const isDateBefore = (
  dateA: Date | string | number,
  dateB: Date | string | number
): boolean => {
  if (!isValidDate(dateA) || !isValidDate(dateB)) {
    return false;
  }
  
  const dateAObj = typeof dateA === 'string' || typeof dateA === 'number' ? new Date(dateA) : dateA;
  const dateBObj = typeof dateB === 'string' || typeof dateB === 'number' ? new Date(dateB) : dateB;
  
  return isBefore(dateAObj, dateBObj);
};

/**
 * Checks if a date is after another date
 * 
 * @param dateA - The date to check (can be Date object, string, or number)
 * @param dateB - The reference date (can be Date object, string, or number)
 * @returns True if dateA is after dateB, false otherwise
 */
export const isDateAfter = (
  dateA: Date | string | number,
  dateB: Date | string | number
): boolean => {
  if (!isValidDate(dateA) || !isValidDate(dateB)) {
    return false;
  }
  
  const dateAObj = typeof dateA === 'string' || typeof dateA === 'number' ? new Date(dateA) : dateA;
  const dateBObj = typeof dateB === 'string' || typeof dateB === 'number' ? new Date(dateB) : dateB;
  
  return isAfter(dateAObj, dateBObj);
};

/**
 * Checks if a date is the same as or before another date
 * 
 * @param dateA - The date to check (can be Date object, string, or number)
 * @param dateB - The reference date (can be Date object, string, or number)
 * @returns True if dateA is the same as or before dateB, false otherwise
 */
export const isDateSameOrBefore = (
  dateA: Date | string | number,
  dateB: Date | string | number
): boolean => {
  return isSameDay(dateA, dateB) || isDateBefore(dateA, dateB);
};

/**
 * Checks if a date is the same as or after another date
 * 
 * @param dateA - The date to check (can be Date object, string, or number)
 * @param dateB - The reference date (can be Date object, string, or number)
 * @returns True if dateA is the same as or after dateB, false otherwise
 */
export const isDateSameOrAfter = (
  dateA: Date | string | number,
  dateB: Date | string | number
): boolean => {
  return isSameDay(dateA, dateB) || isDateAfter(dateA, dateB);
};
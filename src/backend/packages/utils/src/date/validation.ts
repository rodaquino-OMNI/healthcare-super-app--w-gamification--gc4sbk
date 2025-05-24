import { isValid } from 'date-fns'; // date-fns version: 3.3.1

/**
 * Checks if a date is valid
 * 
 * @param date - The date to validate
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
    // Handle special cases like NaN and Infinity
    if (!Number.isFinite(date)) {
      return false;
    }
    
    const dateObj = new Date(date);
    return isValid(dateObj);
  }
  
  return false;
};
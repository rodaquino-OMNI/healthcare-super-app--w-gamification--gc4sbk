import { isValid } from 'date-fns'; // date-fns version: 3.3.1

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
 * Validates a date string against a specific format
 * 
 * @param dateStr - The date string to validate
 * @param formatStr - The expected format of the date string
 * @returns True if the date string matches the format and is valid, false otherwise
 */
export const isValidDateFormat = (dateStr: string, formatStr: string): boolean => {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }
  
  try {
    // Simple format validation based on length and separators
    // For more complex validation, a full parsing would be required
    
    // Check for common date formats
    if (formatStr === 'dd/MM/yyyy') {
      const regex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!regex.test(dateStr)) {
        return false;
      }
      
      // Further validate the date components
      const [day, month, year] = dateStr.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day);
      
      return (
        isValid(dateObj) &&
        dateObj.getDate() === day &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getFullYear() === year
      );
    }
    
    if (formatStr === 'MM/dd/yyyy') {
      const regex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!regex.test(dateStr)) {
        return false;
      }
      
      // Further validate the date components
      const [month, day, year] = dateStr.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day);
      
      return (
        isValid(dateObj) &&
        dateObj.getDate() === day &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getFullYear() === year
      );
    }
    
    if (formatStr === 'yyyy-MM-dd') {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(dateStr)) {
        return false;
      }
      
      // Further validate the date components
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      
      return (
        isValid(dateObj) &&
        dateObj.getDate() === day &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getFullYear() === year
      );
    }
    
    // For other formats, perform a basic validation
    return isValidDate(dateStr);
  } catch (error) {
    return false;
  }
};

/**
 * Checks if a date is in the future
 * 
 * @param date - The date to check
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
  return dateObj.getTime() > referenceDate.getTime();
};

/**
 * Checks if a date is in the past
 * 
 * @param date - The date to check
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
  return dateObj.getTime() < referenceDate.getTime();
};

/**
 * Validates a date against journey-specific rules
 * 
 * @param date - The date to validate
 * @param journeyId - The journey identifier (health, care, plan)
 * @returns True if the date is valid for the specified journey, false otherwise
 */
export const isValidJourneyDate = (
  date: Date | string | number,
  journeyId: string
): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  
  // Journey-specific validation rules
  switch (journeyId.toLowerCase()) {
    case 'health':
      // Health journey: Dates shouldn't be more than 100 years in the past
      // or more than 1 year in the future
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(now.getFullYear() - 100);
      
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(now.getFullYear() + 1);
      
      return (
        dateObj.getTime() >= hundredYearsAgo.getTime() &&
        dateObj.getTime() <= oneYearFromNow.getTime()
      );
      
    case 'care':
      // Care journey: Appointments can't be in the past or more than 1 year in the future
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(now.getDate() - 1);
      
      const oneYearAhead = new Date(now);
      oneYearAhead.setFullYear(now.getFullYear() + 1);
      
      return (
        dateObj.getTime() >= oneDayAgo.getTime() &&
        dateObj.getTime() <= oneYearAhead.getTime()
      );
      
    case 'plan':
      // Plan journey: Claims can't be more than 5 years in the past
      // or in the future
      const fiveYearsAgo = new Date(now);
      fiveYearsAgo.setFullYear(now.getFullYear() - 5);
      
      return (
        dateObj.getTime() >= fiveYearsAgo.getTime() &&
        dateObj.getTime() <= now.getTime()
      );
      
    default:
      // Default validation just checks if it's a valid date
      return true;
  }
};
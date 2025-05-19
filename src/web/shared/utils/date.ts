import i18next from 'i18next'; // version 23.8.2
import { format, isValid, differenceInDays } from 'date-fns';
import { DateError } from '@austa/interfaces/common/error';
import { DateInput } from '@austa/interfaces/common/types';

/**
 * Formats a date relative to the current date, e.g., 'today', 'yesterday', or a specific date if it's further in the past.
 *
 * @param date - The date to format, can be a Date object, string, or timestamp
 * @returns The formatted relative date string.
 * @throws {DateError} If the input date is invalid
 */
export function formatRelativeDate(date: DateInput): string {
  const inputDate = new Date(date);
  if (!isValidDate(inputDate)) {
    const error = new DateError('Invalid date provided to formatRelativeDate', {
      input: date,
      function: 'formatRelativeDate'
    });
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  inputDate.setHours(0, 0, 0, 0);
  
  const diffDays = differenceInDays(today, inputDate);
  
  if (diffDays === 0) {
    return i18next.t('common:dates.today', 'Today');
  } else if (diffDays === 1) {
    return i18next.t('common:dates.yesterday', 'Yesterday');
  } else {
    // Format date according to locale
    const locale = i18next.language || 'pt-BR'; // Default to Brazilian Portuguese
    return format(inputDate, 'dd/MM/yyyy', { locale: getLocale(locale) });
  }
}

/**
 * Calculates the age based on a given date of birth.
 *
 * @param dateOfBirth - The date of birth, can be a Date object, string, or timestamp
 * @returns The age in years.
 * @throws {DateError} If the input date is invalid
 */
export function getAge(dateOfBirth: DateInput): number {
  const birthDate = new Date(dateOfBirth);
  if (!isValidDate(birthDate)) {
    const error = new DateError('Invalid date of birth provided to getAge', {
      input: dateOfBirth,
      function: 'getAge'
    });
    throw error;
  }
  
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birth month hasn't occurred yet this year or birth day hasn't occurred yet in the birth month
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Checks if a given value is a valid Date object.
 *
 * @param date - The value to check
 * @returns True if the value is a valid Date object, false otherwise.
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && isValid(date);
}

/**
 * Gets the appropriate locale object for date-fns based on the locale string.
 * This is a placeholder function that should be implemented to return the correct
 * locale object from date-fns/locale.
 *
 * @param localeStr - The locale string (e.g., 'pt-BR', 'en-US')
 * @returns The date-fns locale object or undefined if not available
 */
function getLocale(localeStr: string): any {
  // This is a placeholder. In a real implementation, you would import and return
  // the appropriate locale from date-fns/locale based on the localeStr.
  // For example:
  // if (localeStr.startsWith('pt')) {
  //   return ptBR;
  // } else {
  //   return enUS; // default
  // }
  return undefined; // Using default locale
}
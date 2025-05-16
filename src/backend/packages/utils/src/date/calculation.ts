/**
 * Date calculation utilities
 * 
 * This module provides utilities for date calculations, including age calculation,
 * relative time formatting, and date range operations.
 * 
 * @module date/calculation
 */

import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  isBefore,
  isAfter,
  isSameDay,
  addDays,
  subDays
} from 'date-fns';

import { ptBR, enUS } from 'date-fns/locale';

// Locale mapping
const LOCALE_MAP = {
  'pt-BR': ptBR,
  'en-US': enUS
};

// Default locale
const DEFAULT_LOCALE = 'pt-BR';

/**
 * Type for supported locales
 */
export type SupportedLocale = 'pt-BR' | 'en-US';

/**
 * Interface for time units in different languages
 */
interface TimeUnits {
  seconds: string;
  minute: string;
  minutes: string;
  hour: string;
  hours: string;
  day: string;
  days: string;
  week: string;
  weeks: string;
  month: string;
  months: string;
  year: string;
  years: string;
  ago: string;
}

/**
 * Time units for different locales
 */
const TIME_UNITS: Record<SupportedLocale, TimeUnits> = {
  'pt-BR': {
    seconds: 'segundos',
    minute: 'minuto',
    minutes: 'minutos',
    hour: 'hora',
    hours: 'horas',
    day: 'dia',
    days: 'dias',
    week: 'semana',
    weeks: 'semanas',
    month: 'mês',
    months: 'meses',
    year: 'ano',
    years: 'anos',
    ago: 'atrás'
  },
  'en-US': {
    seconds: 'seconds',
    minute: 'minute',
    minutes: 'minutes',
    hour: 'hour',
    hours: 'hours',
    day: 'day',
    days: 'days',
    week: 'week',
    weeks: 'weeks',
    month: 'month',
    months: 'months',
    year: 'year',
    years: 'years',
    ago: 'ago'
  }
};

/**
 * Validates if a date is valid
 * 
 * @param date - The date to validate
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (date: any): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }
  
  return false;
};

/**
 * Calculates age in years based on birthdate
 * 
 * @param birthdate - The birthdate
 * @param referenceDate - The reference date to calculate age against (defaults to today)
 * @returns Age in years
 * @throws Error if birthdate is invalid or in the future
 */
export const calculateAge = (
  birthdate: Date | string | number,
  referenceDate: Date = new Date()
): number => {
  if (!isValidDate(birthdate)) {
    throw new Error('Invalid birthdate provided');
  }
  
  const birthdateObj = typeof birthdate === 'string' || typeof birthdate === 'number' 
    ? new Date(birthdate) 
    : birthdate;
  
  if (isBefore(referenceDate, birthdateObj)) {
    throw new Error('Birthdate cannot be in the future');
  }
  
  return differenceInYears(referenceDate, birthdateObj);
};

/**
 * Returns a human-readable string representing time elapsed since the given date
 * Enhanced with more natural language patterns
 * 
 * @param date - The date to calculate time elapsed from
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Human-readable time ago string
 */
export const getTimeAgo = (
  date: Date | string | number,
  locale: SupportedLocale = DEFAULT_LOCALE as SupportedLocale
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  
  // Handle future dates
  if (isAfter(dateObj, now)) {
    return locale === 'pt-BR' ? 'no futuro' : 'in the future';
  }
  
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  const timeUnits = TIME_UNITS[locale];
  
  // Just now / Agora mesmo (less than 10 seconds)
  if (diffInSeconds < 10) {
    return locale === 'pt-BR' ? 'agora mesmo' : 'just now';
  }
  
  // Seconds
  if (diffInSeconds < 60) {
    return `${diffInSeconds} ${timeUnits.seconds} ${timeUnits.ago}`;
  }
  
  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? `1 ${timeUnits.minute} ${timeUnits.ago}`
      : `${diffInMinutes} ${timeUnits.minutes} ${timeUnits.ago}`;
  }
  
  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1
      ? `1 ${timeUnits.hour} ${timeUnits.ago}`
      : `${diffInHours} ${timeUnits.hours} ${timeUnits.ago}`;
  }
  
  // Days
  const diffInDaysValue = Math.floor(diffInHours / 24);
  if (diffInDaysValue < 7) {
    return diffInDaysValue === 1
      ? `1 ${timeUnits.day} ${timeUnits.ago}`
      : `${diffInDaysValue} ${timeUnits.days} ${timeUnits.ago}`;
  }
  
  // Weeks
  const diffInWeeks = Math.floor(diffInDaysValue / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1
      ? `1 ${timeUnits.week} ${timeUnits.ago}`
      : `${diffInWeeks} ${timeUnits.weeks} ${timeUnits.ago}`;
  }
  
  // Months
  const diffInMonthsValue = differenceInMonths(now, dateObj);
  if (diffInMonthsValue < 12) {
    return diffInMonthsValue === 1
      ? `1 ${timeUnits.month} ${timeUnits.ago}`
      : `${diffInMonthsValue} ${timeUnits.months} ${timeUnits.ago}`;
  }
  
  // Years
  const diffInYearsValue = differenceInYears(now, dateObj);
  return diffInYearsValue === 1
    ? `1 ${timeUnits.year} ${timeUnits.ago}`
    : `${diffInYearsValue} ${timeUnits.years} ${timeUnits.ago}`;
};

/**
 * Gets an array of dates between start and end dates (inclusive)
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of dates between start and end dates
 * @throws Error if date range is invalid
 */
export const getDatesBetween = (startDate: Date | string | number, endDate: Date | string | number): Date[] => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date range provided');
  }
  
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' 
    ? new Date(startDate) 
    : startDate;
  
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' 
    ? new Date(endDate) 
    : endDate;
  
  if (!isBefore(startDateObj, endDateObj) && !isSameDay(startDateObj, endDateObj)) {
    throw new Error('Start date must be before or the same as end date');
  }
  
  const dates: Date[] = [];
  let currentDate = new Date(startDateObj);
  
  while (isBefore(currentDate, endDateObj) || isSameDay(currentDate, endDateObj)) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};

/**
 * Checks if a date is within a specified range
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the date is within the range, false otherwise
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
  
  const isAfterOrEqualStart = isAfter(dateObj, startDateObj) || isSameDay(dateObj, startDateObj);
  const isBeforeOrEqualEnd = isBefore(dateObj, endDateObj) || isSameDay(dateObj, endDateObj);
  
  return isAfterOrEqualStart && isBeforeOrEqualEnd;
};

/**
 * Formats a date relative to the current date (today, yesterday, etc.)
 * Enhanced with more natural language patterns
 * 
 * @param date - The date to format
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Relative date string
 */
export const formatRelativeDate = (
  date: Date | string | number,
  locale: SupportedLocale = DEFAULT_LOCALE as SupportedLocale
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const today = new Date();
  const yesterday = subDays(today, 1);
  
  // Localized relative terms
  const terms = locale === 'pt-BR' ? {
    today: 'Hoje',
    yesterday: 'Ontem',
    daysAgo: 'dias atrás',
    thisMonth: 'Este mês',
    lastMonth: 'Mês passado',
    inDays: 'em %d dias',
    tomorrow: 'Amanhã',
    future: 'No futuro'
  } : {
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    thisMonth: 'This month',
    lastMonth: 'Last month',
    inDays: 'in %d days',
    tomorrow: 'Tomorrow',
    future: 'In the future'
  };
  
  // Handle future dates
  if (isAfter(dateObj, today)) {
    if (isSameDay(dateObj, addDays(today, 1))) {
      return terms.tomorrow;
    }
    
    const diffDays = differenceInDays(dateObj, today);
    if (diffDays < 30) {
      return terms.inDays.replace('%d', diffDays.toString());
    }
    
    return terms.future;
  }
  
  // Handle past dates
  if (isSameDay(dateObj, today)) {
    return terms.today;
  }
  
  if (isSameDay(dateObj, yesterday)) {
    return terms.yesterday;
  }
  
  const diffDays = differenceInDays(today, dateObj);
  
  if (diffDays < 30) {
    return `${diffDays} ${terms.daysAgo}`;
  }
  
  // For older dates, return time ago format
  return getTimeAgo(dateObj, locale);
};

/**
 * Calculates the difference in days between two dates
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns The difference in days
 * @throws Error if either date is invalid
 */
export const getDaysDifference = (
  startDate: Date | string | number,
  endDate: Date | string | number
): number => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date provided');
  }
  
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' 
    ? new Date(startDate) 
    : startDate;
  
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' 
    ? new Date(endDate) 
    : endDate;
  
  return differenceInDays(endDateObj, startDateObj);
};

/**
 * Calculates the difference in months between two dates
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns The difference in months
 * @throws Error if either date is invalid
 */
export const getMonthsDifference = (
  startDate: Date | string | number,
  endDate: Date | string | number
): number => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date provided');
  }
  
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' 
    ? new Date(startDate) 
    : startDate;
  
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' 
    ? new Date(endDate) 
    : endDate;
  
  return differenceInMonths(endDateObj, startDateObj);
};

/**
 * Calculates the difference in years between two dates
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns The difference in years
 * @throws Error if either date is invalid
 */
export const getYearsDifference = (
  startDate: Date | string | number,
  endDate: Date | string | number
): number => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date provided');
  }
  
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' 
    ? new Date(startDate) 
    : startDate;
  
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' 
    ? new Date(endDate) 
    : endDate;
  
  return differenceInYears(endDateObj, startDateObj);
};
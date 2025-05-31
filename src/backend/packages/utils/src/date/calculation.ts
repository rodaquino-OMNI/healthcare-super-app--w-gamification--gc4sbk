/**
 * Date calculation utilities
 * 
 * This module provides functions for date calculations, including age calculation,
 * relative time formatting, date range checks, and other common date operations.
 * 
 * @module date/calculation
 */

import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  addDays,
  isBefore,
  isSameDay,
  isValid
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
 * Validates if a date is valid
 * 
 * @param date - The date to validate
 * @returns True if the date is valid, false otherwise
 */
const isValidDate = (date: any): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  if (date instanceof Date) {
    return isValid(date);
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const dateObj = new Date(date);
    return isValid(dateObj);
  }
  
  return false;
};

/**
 * Calculates age in years based on birthdate
 * 
 * @param birthdate - The birthdate
 * @param referenceDate - The reference date to calculate age against (defaults to today)
 * @returns Age in years
 * @throws Error if an invalid birthdate is provided
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
    throw new Error('Reference date cannot be before birthdate');
  }
  
  return differenceInYears(referenceDate, birthdateObj);
};

/**
 * Returns a human-readable string representing time elapsed since the given date
 * 
 * @param date - The date to calculate time elapsed from
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Human-readable time ago string
 * @throws Error if an invalid date is provided
 */
export const getTimeAgo = (
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided');
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  
  if (isBefore(now, dateObj)) {
    throw new Error('Reference date cannot be before the provided date');
  }
  
  // Localized time units
  const timeUnits = locale === 'pt-BR' ? {
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
    ago: 'atrás',
    justNow: 'agora mesmo',
    lessThanAMinute: 'menos de um minuto'
  } : {
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
    ago: 'ago',
    justNow: 'just now',
    lessThanAMinute: 'less than a minute'
  };
  
  const diffInSeconds = differenceInSeconds(now, dateObj);
  
  // Just now
  if (diffInSeconds < 5) {
    return timeUnits.justNow;
  }
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return `${timeUnits.lessThanAMinute} ${timeUnits.ago}`;
  }
  
  const diffInMinutes = differenceInMinutes(now, dateObj);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? `1 ${timeUnits.minute} ${timeUnits.ago}`
      : `${diffInMinutes} ${timeUnits.minutes} ${timeUnits.ago}`;
  }
  
  const diffInHours = differenceInHours(now, dateObj);
  if (diffInHours < 24) {
    return diffInHours === 1
      ? `1 ${timeUnits.hour} ${timeUnits.ago}`
      : `${diffInHours} ${timeUnits.hours} ${timeUnits.ago}`;
  }
  
  const diffInDays = differenceInDays(now, dateObj);
  if (diffInDays < 7) {
    return diffInDays === 1
      ? `1 ${timeUnits.day} ${timeUnits.ago}`
      : `${diffInDays} ${timeUnits.days} ${timeUnits.ago}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1
      ? `1 ${timeUnits.week} ${timeUnits.ago}`
      : `${diffInWeeks} ${timeUnits.weeks} ${timeUnits.ago}`;
  }
  
  const diffInMonths = differenceInMonths(now, dateObj);
  if (diffInMonths < 12) {
    return diffInMonths === 1
      ? `1 ${timeUnits.month} ${timeUnits.ago}`
      : `${diffInMonths} ${timeUnits.months} ${timeUnits.ago}`;
  }
  
  const diffInYears = differenceInYears(now, dateObj);
  return diffInYears === 1
    ? `1 ${timeUnits.year} ${timeUnits.ago}`
    : `${diffInYears} ${timeUnits.years} ${timeUnits.ago}`;
};

/**
 * Gets an array of dates between start and end dates (inclusive)
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of dates between start and end dates
 * @throws Error if invalid date range is provided
 */
export const getDatesBetween = (
  startDate: Date | string | number,
  endDate: Date | string | number
): Date[] => {
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
 * @throws Error if invalid dates are provided
 */
export const isDateInRange = (
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number
): boolean => {
  if (!isValidDate(date) || !isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date(s) provided');
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;
  
  if (!isBefore(startDateObj, endDateObj) && !isSameDay(startDateObj, endDateObj)) {
    throw new Error('Start date must be before or the same as end date');
  }
  
  const isAfterOrEqualStart = !isBefore(dateObj, startDateObj) || isSameDay(dateObj, startDateObj);
  const isBeforeOrEqualEnd = isBefore(dateObj, endDateObj) || isSameDay(dateObj, endDateObj);
  
  return isAfterOrEqualStart && isBeforeOrEqualEnd;
};

/**
 * Calculates the difference between two dates in the specified unit
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @param unit - The unit to calculate the difference in ('years', 'months', 'days', 'hours', 'minutes', 'seconds')
 * @returns The difference in the specified unit
 * @throws Error if invalid dates or unit are provided
 */
export const calculateDateDifference = (
  startDate: Date | string | number,
  endDate: Date | string | number,
  unit: 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds'
): number => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date(s) provided');
  }
  
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' 
    ? new Date(startDate) 
    : startDate;
  
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' 
    ? new Date(endDate) 
    : endDate;
  
  switch (unit) {
    case 'years':
      return differenceInYears(endDateObj, startDateObj);
    case 'months':
      return differenceInMonths(endDateObj, startDateObj);
    case 'days':
      return differenceInDays(endDateObj, startDateObj);
    case 'hours':
      return differenceInHours(endDateObj, startDateObj);
    case 'minutes':
      return differenceInMinutes(endDateObj, startDateObj);
    case 'seconds':
      return differenceInSeconds(endDateObj, startDateObj);
    default:
      throw new Error(`Invalid unit: ${unit}`);
  }
};

/**
 * Calculates a person's age in different units based on birthdate
 * 
 * @param birthdate - The birthdate
 * @param unit - The unit to calculate the age in ('years', 'months', 'days')
 * @param referenceDate - The reference date to calculate age against (defaults to today)
 * @returns Age in the specified unit
 * @throws Error if an invalid birthdate or unit is provided
 */
export const calculateAgeInUnit = (
  birthdate: Date | string | number,
  unit: 'years' | 'months' | 'days',
  referenceDate: Date = new Date()
): number => {
  if (!isValidDate(birthdate)) {
    throw new Error('Invalid birthdate provided');
  }
  
  const birthdateObj = typeof birthdate === 'string' || typeof birthdate === 'number' 
    ? new Date(birthdate) 
    : birthdate;
  
  if (isBefore(referenceDate, birthdateObj)) {
    throw new Error('Reference date cannot be before birthdate');
  }
  
  switch (unit) {
    case 'years':
      return differenceInYears(referenceDate, birthdateObj);
    case 'months':
      return differenceInMonths(referenceDate, birthdateObj);
    case 'days':
      return differenceInDays(referenceDate, birthdateObj);
    default:
      throw new Error(`Invalid unit: ${unit}`);
  }
};
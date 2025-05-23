/**
 * Date calculation utilities
 * 
 * This module provides functions for performing date calculations such as
 * calculating age, determining time elapsed, and working with date ranges.
 * 
 * @packageDocumentation
 */

import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  addDays,
  isBefore,
  isValid,
  isSameDay as fnIsSameDay
} from 'date-fns'; // date-fns version: 3.3.1

import { isValidDate } from './validation';
import { parseDate } from './parse';

/**
 * Calculates age in years based on birthdate
 * 
 * @param birthdate - The birthdate
 * @param referenceDate - The reference date to calculate age against (defaults to today)
 * @returns Age in years
 * @throws Error if the birthdate is invalid
 */
export const calculateAge = (
  birthdate: Date | string,
  referenceDate: Date = new Date()
): number => {
  if (!isValidDate(birthdate)) {
    throw new Error('Invalid birthdate provided');
  }
  
  const birthdateObj = typeof birthdate === 'string' ? parseDate(birthdate) : birthdate;
  
  return differenceInYears(referenceDate, birthdateObj);
};

/**
 * Returns a human-readable string representing time elapsed since the given date
 * 
 * @param date - The date to calculate time elapsed from
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Human-readable time ago string
 */
export const getTimeAgo = (
  date: Date | string | number,
  locale: string = 'pt-BR'
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
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
    ago: 'atrás'
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
    ago: 'ago'
  };
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} ${timeUnits.seconds} ${timeUnits.ago}`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? `1 ${timeUnits.minute} ${timeUnits.ago}`
      : `${diffInMinutes} ${timeUnits.minutes} ${timeUnits.ago}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1
      ? `1 ${timeUnits.hour} ${timeUnits.ago}`
      : `${diffInHours} ${timeUnits.hours} ${timeUnits.ago}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
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
 * @throws Error if the date range is invalid
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date range provided');
  }
  
  if (!isBefore(startDate, endDate) && !fnIsSameDay(startDate, endDate)) {
    throw new Error('Start date must be before or the same as end date');
  }
  
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (isBefore(currentDate, endDate) || fnIsSameDay(currentDate, endDate)) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};

/**
 * Checks if a date is after another date
 * 
 * @param date - The date to check
 * @param dateToCompare - The date to compare against
 * @returns True if the date is after the comparison date, false otherwise
 */
export const isAfter = (
  date: Date | string | number,
  dateToCompare: Date | string | number
): boolean => {
  if (!isValidDate(date) || !isValidDate(dateToCompare)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const compareObj = typeof dateToCompare === 'string' || typeof dateToCompare === 'number' 
    ? new Date(dateToCompare) 
    : dateToCompare;
  
  return dateObj.getTime() > compareObj.getTime();
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
  
  const isAfterOrEqualStart = isAfter(dateObj, startDateObj) || fnIsSameDay(dateObj, startDateObj);
  const isBeforeOrEqualEnd = isBefore(dateObj, endDateObj) || fnIsSameDay(dateObj, endDateObj);
  
  return isAfterOrEqualStart && isBeforeOrEqualEnd;
};

/**
 * Checks if a date is after another date
 * 
 * @param date - The date to check
 * @param dateToCompare - The date to compare against
 * @returns True if the date is after the comparison date, false otherwise
 */
export const isAfter = (
  date: Date | string | number,
  dateToCompare: Date | string | number
): boolean => {
  if (!isValidDate(date) || !isValidDate(dateToCompare)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const compareObj = typeof dateToCompare === 'string' || typeof dateToCompare === 'number' 
    ? new Date(dateToCompare) 
    : dateToCompare;
  
  return dateObj.getTime() > compareObj.getTime();
};
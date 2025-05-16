/**
 * @file calculation.ts
 * @description Provides utilities for date calculations, including age calculation
 * and human-readable relative time descriptions. These functions support both
 * Portuguese and English localization and are used across all journey services.
 */

import { differenceInYears, differenceInMonths } from 'date-fns';
import { isValidDate } from './validation';
import { parseDate } from './parse';

/**
 * Time unit translations for localized time descriptions
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
 * Localized time units for supported languages
 */
const TIME_UNITS: Record<string, TimeUnits> = {
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
  
  // Get localized time units or default to en-US if locale not supported
  const timeUnits = TIME_UNITS[locale] || TIME_UNITS['en-US'];
  
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
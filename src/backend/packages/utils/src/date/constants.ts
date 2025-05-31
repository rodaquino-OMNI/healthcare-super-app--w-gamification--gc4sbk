/**
 * @file Date-related constants used across the application
 * @description Centralizes all date-related constants for consistent formatting and locale handling
 */

import { Locale } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale'; // date-fns version: 3.3.1

/**
 * Default format string for dates (dd/MM/yyyy)
 * @constant
 * @type {string}
 */
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

/**
 * Default format string for times (HH:mm)
 * @constant
 * @type {string}
 */
export const DEFAULT_TIME_FORMAT = 'HH:mm';

/**
 * Default format string for date and time (dd/MM/yyyy HH:mm)
 * @constant
 * @type {string}
 */
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

/**
 * Default locale for date formatting (pt-BR)
 * @constant
 * @type {string}
 */
export const DEFAULT_LOCALE = 'pt-BR';

/**
 * Mapping between locale identifiers and date-fns locale objects
 * @constant
 * @type {Record<string, Locale>}
 */
export const LOCALE_MAP: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS
};

/**
 * Available date range types for getDateRange function
 * @constant
 * @type {Record<string, string>}
 */
export const DATE_RANGE_TYPES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'thisWeek',
  LAST_WEEK: 'lastWeek',
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  THIS_YEAR: 'thisYear',
  LAST_YEAR: 'lastYear',
  LAST_7_DAYS: 'last7Days',
  LAST_30_DAYS: 'last30Days',
  LAST_90_DAYS: 'last90Days',
  LAST_365_DAYS: 'last365Days'
} as const;

/**
 * Type for date range types
 * @type {string}
 */
export type DateRangeType = typeof DATE_RANGE_TYPES[keyof typeof DATE_RANGE_TYPES];

/**
 * Journey identifiers for journey-specific date formatting
 * @constant
 * @type {Record<string, string>}
 */
export const JOURNEY_IDS = {
  HEALTH: 'health',
  CARE: 'care',
  PLAN: 'plan'
} as const;

/**
 * Type for journey identifiers
 * @type {string}
 */
export type JourneyId = typeof JOURNEY_IDS[keyof typeof JOURNEY_IDS];

/**
 * Journey-specific date formats
 * @constant
 * @type {Record<JourneyId, string>}
 */
export const JOURNEY_DATE_FORMATS: Record<JourneyId, string> = {
  [JOURNEY_IDS.HEALTH]: 'dd/MM/yyyy HH:mm',
  [JOURNEY_IDS.CARE]: 'EEE, dd MMM yyyy',
  [JOURNEY_IDS.PLAN]: 'dd/MM/yyyy'
};

/**
 * Localized time units for Portuguese (pt-BR)
 * @constant
 * @type {Record<string, string>}
 */
export const PT_BR_TIME_UNITS: Record<string, string> = {
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
};

/**
 * Localized time units for English (en-US)
 * @constant
 * @type {Record<string, string>}
 */
export const EN_US_TIME_UNITS: Record<string, string> = {
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

/**
 * Mapping between locale identifiers and time units
 * @constant
 * @type {Record<string, Record<string, string>>}
 */
export const TIME_UNITS_MAP: Record<string, Record<string, string>> = {
  'pt-BR': PT_BR_TIME_UNITS,
  'en-US': EN_US_TIME_UNITS
};

/**
 * Localized relative date terms for Portuguese (pt-BR)
 * @constant
 * @type {Record<string, string>}
 */
export const PT_BR_RELATIVE_TERMS: Record<string, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  daysAgo: 'dias atrás',
  thisMonth: 'Este mês',
  lastMonth: 'Mês passado'
};

/**
 * Localized relative date terms for English (en-US)
 * @constant
 * @type {Record<string, string>}
 */
export const EN_US_RELATIVE_TERMS: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  daysAgo: 'days ago',
  thisMonth: 'This month',
  lastMonth: 'Last month'
};

/**
 * Mapping between locale identifiers and relative date terms
 * @constant
 * @type {Record<string, Record<string, string>>}
 */
export const RELATIVE_TERMS_MAP: Record<string, Record<string, string>> = {
  'pt-BR': PT_BR_RELATIVE_TERMS,
  'en-US': EN_US_RELATIVE_TERMS
};
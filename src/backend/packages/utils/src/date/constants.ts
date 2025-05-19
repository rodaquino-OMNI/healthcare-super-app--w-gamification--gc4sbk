/**
 * @file Date-related constants used across the application
 * @description Centralizes all date-related constants for consistent formatting and locale handling
 */

import { Locale } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';

/**
 * Default date format (dd/MM/yyyy)
 * @constant
 * @type {string}
 */
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

/**
 * Default time format (HH:mm)
 * @constant
 * @type {string}
 */
export const DEFAULT_TIME_FORMAT = 'HH:mm';

/**
 * Default datetime format (dd/MM/yyyy HH:mm)
 * @constant
 * @type {string}
 */
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

/**
 * Default locale identifier (pt-BR)
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
 * Time unit translations for Portuguese (pt-BR)
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
 * Time unit translations for English (en-US)
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
 * Mapping between locale identifiers and time unit translations
 * @constant
 * @type {Record<string, Record<string, string>>}
 */
export const TIME_UNITS_MAP: Record<string, Record<string, string>> = {
  'pt-BR': PT_BR_TIME_UNITS,
  'en-US': EN_US_TIME_UNITS
};

/**
 * Relative date terms for Portuguese (pt-BR)
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
 * Relative date terms for English (en-US)
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

/**
 * Date range types for use with getDateRange function
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
 * Journey identifiers for use with journey-specific formatting
 * @constant
 * @type {Record<string, string>}
 */
export const JOURNEY_IDS = {
  HEALTH: 'health',
  CARE: 'care',
  PLAN: 'plan'
} as const;

/**
 * Journey-specific date formats
 * @constant
 * @type {Record<string, string>}
 */
export const JOURNEY_DATE_FORMATS: Record<string, string> = {
  [JOURNEY_IDS.HEALTH]: 'dd/MM/yyyy HH:mm',
  [JOURNEY_IDS.CARE]: 'EEE, dd MMM yyyy',
  [JOURNEY_IDS.PLAN]: 'dd/MM/yyyy'
};
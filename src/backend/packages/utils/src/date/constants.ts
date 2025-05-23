/**
 * @file Date Constants
 * @description Centralizes all date-related constants used across the date utility functions.
 * This file ensures consistent formatting and locale handling throughout the application.
 */

import { Locale } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale'; // date-fns version: 3.3.1

/**
 * Default date format string (dd/MM/yyyy)
 * Used for standard date formatting across the application
 */
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

/**
 * Default time format string (HH:mm)
 * Used for standard time formatting across the application
 */
export const DEFAULT_TIME_FORMAT = 'HH:mm';

/**
 * Default datetime format string (dd/MM/yyyy HH:mm)
 * Used for standard datetime formatting across the application
 */
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

/**
 * Default locale identifier (pt-BR)
 * Used as the default locale for all date operations
 */
export const DEFAULT_LOCALE = 'pt-BR';

/**
 * Mapping between locale identifiers and date-fns locale objects
 * Used for locale-specific date formatting and parsing
 */
export const LOCALE_MAP: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS
};

/**
 * Supported locale identifiers
 * Used for type checking and validation
 */
export type SupportedLocale = 'pt-BR' | 'en-US';

/**
 * Journey-specific date formats
 * Used for formatting dates according to journey requirements
 */
export const JOURNEY_DATE_FORMATS: Record<string, string> = {
  health: 'dd/MM/yyyy HH:mm',
  care: 'EEE, dd MMM yyyy',
  plan: 'dd/MM/yyyy'
};

/**
 * Date range types
 * Used for predefined date range calculations
 */
export type DateRangeType =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'last7Days'
  | 'last30Days'
  | 'last90Days'
  | 'last365Days';
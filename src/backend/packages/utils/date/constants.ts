/**
 * @file Date Constants
 * @description Re-exports date-related constants for consistent date formatting and locale handling across all services.
 * These constants ensure standardized date operations throughout the application.
 */

import { ptBR, enUS } from 'date-fns/locale';

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
 * Default locale for date formatting ('pt-BR')
 * Used as the default locale for all date operations
 */
export const DEFAULT_LOCALE = 'pt-BR';

/**
 * Mapping of locale strings to date-fns locale objects
 * Used for locale-specific date formatting
 */
export const LOCALE_MAP: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS
};

/**
 * Journey-specific date formats
 * Used for formatting dates according to journey-specific requirements
 */
export const JOURNEY_DATE_FORMATS = {
  health: 'dd/MM/yyyy HH:mm', // Health journey uses detailed format with time for metrics
  care: 'EEE, dd MMM yyyy',   // Care journey uses appointment-friendly format
  plan: 'dd/MM/yyyy'          // Plan journey uses formal date format for claims and documents
};

/**
 * Predefined date range types
 * Used with getDateRange function to retrieve common date ranges
 */
export const DATE_RANGE_TYPES = {
  today: 'today',
  yesterday: 'yesterday',
  thisWeek: 'thisWeek',
  lastWeek: 'lastWeek',
  thisMonth: 'thisMonth',
  lastMonth: 'lastMonth',
  thisYear: 'thisYear',
  lastYear: 'lastYear',
  last7Days: 'last7Days',
  last30Days: 'last30Days',
  last90Days: 'last90Days',
  last365Days: 'last365Days'
} as const;

/**
 * Type definition for date range types
 * Provides type safety when using date range types
 */
export type DateRangeType = keyof typeof DATE_RANGE_TYPES;

/**
 * Type definition for journey IDs
 * Provides type safety when using journey IDs for date formatting
 */
export type JourneyId = keyof typeof JOURNEY_DATE_FORMATS;
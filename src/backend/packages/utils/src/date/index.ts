/**
 * @file Date Utilities
 * @description Provides a comprehensive set of date manipulation, formatting, parsing, and validation utilities.
 * This module serves as the entry point for all date-related functionality in the AUSTA SuperApp.
 * 
 * @module @austa/utils/date
 * @version 1.0.0
 */

// Re-export constants
export {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  LOCALE_MAP,
  JOURNEY_DATE_FORMATS,
  type SupportedLocale,
  type DateRangeType
} from './constants';

// Re-export validation utilities
export { isValidDate } from './validation';

// Re-export formatting utilities
export {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRange,
  formatRelativeDate
} from './format';

// Re-export parsing utilities
export { parseDate } from './parse';

// Re-export range utilities
export {
  getDateRange,
  getDatesBetween
} from './range';

// Re-export calculation utilities
export {
  calculateAge,
  getTimeAgo
} from './calculation';

// Re-export comparison utilities
export {
  isSameDay,
  isDateInRange
} from './comparison';

// Re-export journey-specific utilities
export { formatJourneyDate } from './journey';

// Re-export timezone utilities
export { getLocalTimezone } from './timezone';
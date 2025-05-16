/**
 * @file Date Utilities
 * @description A comprehensive collection of date manipulation, formatting, parsing, and validation utilities.
 * This module provides a standardized API for working with dates across the AUSTA SuperApp.
 * Built on date-fns 3.3.1 for modularity and tree-shaking support.
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
  LOCALE_MAP
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

// Re-export timezone utilities
export { getLocalTimezone } from './timezone';

// Re-export journey-specific utilities
export { formatJourneyDate } from './journey';

/**
 * Date Utilities
 * 
 * This package provides a comprehensive set of utilities for working with dates
 * in the AUSTA SuperApp. It includes functions for formatting, parsing, validation,
 * comparison, calculation, and more.
 * 
 * The utilities are organized into specialized modules for better maintainability
 * and to enable tree-shaking, but are re-exported here for convenience.
 * 
 * All date utilities are built on date-fns 3.3.1, which provides a modular, functional
 * approach to date manipulation with excellent tree-shaking support.
 * 
 * @example
 * // Import specific utilities
 * import { formatDate, parseDate } from '@austa/utils/date';
 * 
 * // Format a date
 * const formattedDate = formatDate(new Date(), 'dd/MM/yyyy', 'pt-BR');
 * 
 * // Parse a date string
 * const parsedDate = parseDate('01/01/2023', 'dd/MM/yyyy', 'pt-BR');
 * 
 * @example
 * // Journey-specific formatting
 * import { formatJourneyDate } from '@austa/utils/date';
 * 
 * // Format a date for the health journey
 * const healthDate = formatJourneyDate(new Date(), 'health', 'pt-BR');
 * 
 * // Format a date for the care journey
 * const careDate = formatJourneyDate(new Date(), 'care', 'pt-BR');
 * 
 * // Format a date for the plan journey
 * const planDate = formatJourneyDate(new Date(), 'plan', 'pt-BR');
 */
/**
 * Date formatting utilities
 * 
 * This module provides a convenient entry point for date formatting utilities,
 * ensuring consistent date string representations across all journey services.
 */

// Re-export date formatting constants and functions from the implementation
export {
  // Constants
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  
  // Formatting functions
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRange,
  formatRelativeDate,
  formatJourneyDate
} from '../src/date/format';
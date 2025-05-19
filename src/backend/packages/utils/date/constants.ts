/**
 * Date-related constants
 * 
 * This module provides a convenient entry point for date-related constants,
 * ensuring consistent date formatting and locale handling across all services.
 */

// Re-export date constants from the implementation
export {
  // Format constants
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  
  // Locale mapping
  LOCALE_MAP,
  
  // Journey-specific formats
  JOURNEY_DATE_FORMATS,
  
  // Type definitions
  DateRangeType
} from '../src/date/constants';
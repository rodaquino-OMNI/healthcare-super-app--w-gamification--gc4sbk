/**
 * @file comparison.ts
 * @description Provides a convenient entry point for date comparison utilities.
 * These functions are critical for comparing dates, determining if dates fall on the same day,
 * and checking if a date is within a specified range.
 */

// Re-export comparison utilities from the implementation folder
export { 
  isSameDay,
  isDateInRange,
  isDateBefore,
  isDateAfter,
  isDateSameOrBefore,
  isDateSameOrAfter
} from '../src/date/comparison';
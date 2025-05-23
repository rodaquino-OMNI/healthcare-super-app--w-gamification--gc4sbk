/**
 * Date calculation utilities
 * 
 * This module provides functions for performing date calculations such as
 * calculating age, determining time elapsed, and working with date ranges.
 * 
 * @packageDocumentation
 */

// Re-export calculation utilities from implementation
export { 
  calculateAge,
  getTimeAgo,
  getDatesBetween,
  isDateInRange,
  isAfter
} from '../src/date/calculation';
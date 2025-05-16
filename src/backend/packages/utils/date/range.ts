/**
 * Date range utilities for working with date ranges, generating arrays of dates,
 * and retrieving predefined date ranges.
 * 
 * @packageDocumentation
 */

// Re-export types and functions from implementation
export type { DateRangeType, DateRange } from '../src/date/range';
export { getDateRange, getDatesBetween, isDateInRange } from '../src/date/range';
/**
 * Date Formatting Utilities
 * 
 * This module provides functions for formatting dates into strings with various formats.
 * These utilities ensure consistent date string representations across all journey services.
 * 
 * @packageDocumentation
 */

import {
  formatDate as _formatDate,
  formatTime as _formatTime,
  formatDateTime as _formatDateTime,
  formatDateRange as _formatDateRange,
  formatRelativeDate as _formatRelativeDate
} from '../src/date/format';

/**
 * Formats a date according to the specified format and locale
 * 
 * @param date - The date to format (can be Date object, string, or number)
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns The formatted date string
 * 
 * @example
 * ```typescript
 * // Format a date with default format (dd/MM/yyyy)
 * const formattedDate = formatDate(new Date(2023, 0, 15)); // '15/01/2023'
 * 
 * // Format a date with custom format
 * const customFormat = formatDate(new Date(2023, 0, 15), 'yyyy-MM-dd'); // '2023-01-15'
 * 
 * // Format a date with English locale
 * const englishDate = formatDate(new Date(2023, 0, 15), 'MMMM dd, yyyy', 'en-US'); // 'January 15, 2023'
 * ```
 */
export const formatDate = _formatDate;

/**
 * Formats a time according to the specified format and locale
 * 
 * @param date - The date/time to format (can be Date object, string, or number)
 * @param formatStr - The format string (defaults to HH:mm)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns The formatted time string
 * 
 * @example
 * ```typescript
 * // Format a time with default format (HH:mm)
 * const formattedTime = formatTime(new Date(2023, 0, 15, 14, 30)); // '14:30'
 * 
 * // Format a time with custom format
 * const customTime = formatTime(new Date(2023, 0, 15, 14, 30), 'h:mm a'); // '2:30 PM'
 * ```
 */
export const formatTime = _formatTime;

/**
 * Formats a date and time according to the specified format and locale
 * 
 * @param date - The date/time to format (can be Date object, string, or number)
 * @param formatStr - The format string (defaults to dd/MM/yyyy HH:mm)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns The formatted date and time string
 * 
 * @example
 * ```typescript
 * // Format a date and time with default format (dd/MM/yyyy HH:mm)
 * const formattedDateTime = formatDateTime(new Date(2023, 0, 15, 14, 30)); // '15/01/2023 14:30'
 * 
 * // Format a date and time with custom format
 * const customDateTime = formatDateTime(new Date(2023, 0, 15, 14, 30), 'yyyy-MM-dd HH:mm:ss'); // '2023-01-15 14:30:00'
 * ```
 */
export const formatDateTime = _formatDateTime;

/**
 * Formats a date range as a string
 * 
 * @param startDate - The start date of the range (can be Date object, string, or number)
 * @param endDate - The end date of the range (can be Date object, string, or number)
 * @param formatStr - The format string for dates (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Formatted date range string
 * 
 * @example
 * ```typescript
 * // Format a date range with default format
 * const dateRange = formatDateRange(
 *   new Date(2023, 0, 15),
 *   new Date(2023, 0, 20)
 * ); // '15/01/2023 - 20/01/2023'
 * 
 * // Format a date range with custom format
 * const customRange = formatDateRange(
 *   new Date(2023, 0, 15),
 *   new Date(2023, 0, 20),
 *   'MMM dd'
 * ); // 'Jan 15 - Jan 20'
 * ```
 */
export const formatDateRange = _formatDateRange;

/**
 * Formats a date relative to the current date (today, yesterday, etc.)
 * 
 * @param date - The date to format (can be Date object, string, or number)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Relative date string
 * 
 * @example
 * ```typescript
 * // Format a date relative to today
 * const today = formatRelativeDate(new Date()); // 'Hoje' or 'Today' depending on locale
 * 
 * // Format yesterday's date
 * const yesterday = new Date();
 * yesterday.setDate(yesterday.getDate() - 1);
 * const yesterdayFormatted = formatRelativeDate(yesterday); // 'Ontem' or 'Yesterday'
 * 
 * // Format a date from a few days ago
 * const threeDaysAgo = new Date();
 * threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
 * const daysAgoFormatted = formatRelativeDate(threeDaysAgo); // '3 dias atrás' or '3 days ago'
 * ```
 */
export const formatRelativeDate = _formatRelativeDate;
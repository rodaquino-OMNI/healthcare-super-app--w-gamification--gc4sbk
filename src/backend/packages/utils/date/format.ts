/**
 * Date Formatting Utilities
 * 
 * This module provides functions for formatting dates in a consistent way
 * across all journey services. It supports localization for Portuguese and English.
 * 
 * @packageDocumentation
 */

import {
  formatDate as _formatDate,
  formatTime as _formatTime,
  formatDateTime as _formatDateTime,
  formatDateRange as _formatDateRange,
  formatRelativeDate as _formatRelativeDate,
  formatJourneyDate as _formatJourneyDate,
  getTimeAgo as _getTimeAgo
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
 * // Format a date with default settings (dd/MM/yyyy in pt-BR)
 * const formattedDate = formatDate(new Date('2023-01-15')); // '15/01/2023'
 * 
 * // Format a date with a custom format
 * const customFormat = formatDate(new Date('2023-01-15'), 'yyyy-MM-dd'); // '2023-01-15'
 * 
 * // Format a date with English locale
 * const englishDate = formatDate(new Date('2023-01-15'), 'MMMM d, yyyy', 'en-US'); // 'January 15, 2023'
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
 * // Format a time with default settings (HH:mm in pt-BR)
 * const formattedTime = formatTime(new Date('2023-01-15T14:30:00')); // '14:30'
 * 
 * // Format a time with a custom format
 * const customFormat = formatTime(new Date('2023-01-15T14:30:00'), 'h:mm a'); // '2:30 PM'
 * 
 * // Format a time with seconds
 * const withSeconds = formatTime(new Date('2023-01-15T14:30:45'), 'HH:mm:ss'); // '14:30:45'
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
 * // Format a date and time with default settings (dd/MM/yyyy HH:mm in pt-BR)
 * const formattedDateTime = formatDateTime(new Date('2023-01-15T14:30:00')); // '15/01/2023 14:30'
 * 
 * // Format a date and time with a custom format
 * const customFormat = formatDateTime(
 *   new Date('2023-01-15T14:30:00'),
 *   'yyyy-MM-dd HH:mm:ss'
 * ); // '2023-01-15 14:30:00'
 * 
 * // Format a date and time with English locale
 * const englishDateTime = formatDateTime(
 *   new Date('2023-01-15T14:30:00'),
 *   'MMMM d, yyyy h:mm a',
 *   'en-US'
 * ); // 'January 15, 2023 2:30 PM'
 * ```
 */
export const formatDateTime = _formatDateTime;

/**
 * Formats a date range as a string
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param formatStr - The format string for dates (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Formatted date range string
 * 
 * @example
 * ```typescript
 * // Format a date range with default settings
 * const dateRange = formatDateRange(
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31')
 * ); // '01/01/2023 - 31/01/2023'
 * 
 * // Format a date range with a custom format
 * const customRange = formatDateRange(
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31'),
 *   'MMM d'
 * ); // 'Jan 1 - Jan 31'
 * 
 * // Format a date range with English locale
 * const englishRange = formatDateRange(
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31'),
 *   'MMMM d, yyyy',
 *   'en-US'
 * ); // 'January 1, 2023 - January 31, 2023'
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
 * // Format today's date
 * const today = formatRelativeDate(new Date()); // 'Hoje' (in pt-BR) or 'Today' (in en-US)
 * 
 * // Format yesterday's date
 * const yesterday = formatRelativeDate(
 *   new Date(Date.now() - 86400000)
 * ); // 'Ontem' (in pt-BR) or 'Yesterday' (in en-US)
 * 
 * // Format a date from a few days ago
 * const daysAgo = formatRelativeDate(
 *   new Date(Date.now() - 3 * 86400000)
 * ); // '3 dias atrás' (in pt-BR) or '3 days ago' (in en-US)
 * 
 * // Format an older date (falls back to standard date format)
 * const olderDate = formatRelativeDate(
 *   new Date('2022-01-01')
 * ); // '01/01/2022' (if more than 30 days ago)
 * ```
 */
export const formatRelativeDate = _formatRelativeDate;

/**
 * Formats a date according to journey-specific requirements
 * 
 * @param date - The date to format (can be Date object, string, or number)
 * @param journeyId - The journey identifier (health, care, plan)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Journey-specific formatted date
 * 
 * @example
 * ```typescript
 * // Format a date for the Health journey
 * const healthDate = formatJourneyDate(
 *   new Date('2023-01-15T14:30:00'),
 *   'health'
 * ); // '15/01/2023 14:30' (includes time for health metrics)
 * 
 * // Format a date for the Care journey
 * const careDate = formatJourneyDate(
 *   new Date('2023-01-15'),
 *   'care'
 * ); // 'Dom, 15 Jan 2023' (appointment-friendly format)
 * 
 * // Format a date for the Plan journey
 * const planDate = formatJourneyDate(
 *   new Date('2023-01-15'),
 *   'plan'
 * ); // '15/01/2023' (formal date format for claims)
 * ```
 */
export const formatJourneyDate = _formatJourneyDate;

/**
 * Returns a human-readable string representing time elapsed since the given date
 * 
 * @param date - The date to calculate time elapsed from (can be Date object, string, or number)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Human-readable time ago string
 * 
 * @example
 * ```typescript
 * // Get time elapsed for a date 5 minutes ago
 * const minutesAgo = getTimeAgo(
 *   new Date(Date.now() - 5 * 60 * 1000)
 * ); // '5 minutos atrás' (in pt-BR) or '5 minutes ago' (in en-US)
 * 
 * // Get time elapsed for a date 3 hours ago
 * const hoursAgo = getTimeAgo(
 *   new Date(Date.now() - 3 * 60 * 60 * 1000)
 * ); // '3 horas atrás' (in pt-BR) or '3 hours ago' (in en-US)
 * 
 * // Get time elapsed for a date 2 days ago
 * const daysAgo = getTimeAgo(
 *   new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
 * ); // '2 dias atrás' (in pt-BR) or '2 days ago' (in en-US)
 * 
 * // Get time elapsed for a date 1 year ago
 * const yearsAgo = getTimeAgo(
 *   new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
 * ); // '1 ano atrás' (in pt-BR) or '1 year ago' (in en-US)
 * ```
 */
export const getTimeAgo = _getTimeAgo;
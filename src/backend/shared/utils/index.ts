/**
 * @file Barrel file for shared utility modules
 * @description This file provides standardized exports for all utility modules in the shared/utils folder.
 * It creates a consistent public API for importing utilities across the application, reducing import
 * complexity and preventing circular dependencies.
 */

// Re-export secure-axios utilities
import secureAxios, { createSecureAxios, createInternalApiClient } from './secure-axios';

// Re-export string utilities from src/utils
import { capitalizeFirstLetter, truncate, isValidCPF } from '../src/utils/string.util';

// Re-export date utilities from src/utils
import {
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
  formatJourneyDate,
  
  // Parsing and validation
  parseDate,
  isValidDate,
  
  // Date calculations
  getDateRange,
  calculateAge,
  getTimeAgo,
  getDatesBetween,
  isSameDay,
  isDateInRange,
  
  // Timezone utilities
  getLocalTimezone
} from '../src/utils/date.util';

/**
 * Secure HTTP client utilities
 * @description Provides SSRF-protected HTTP client creation for all server-side code
 */
export {
  /**
   * Creates a secured Axios instance with protections against SSRF attacks
   * @returns A configured Axios instance with additional security measures
   */
  createSecureAxios,
  
  /**
   * Creates a secure axios instance with predefined config for internal API calls
   * @param baseURL - The base URL for the API client
   * @param headers - Optional headers to include with all requests
   * @returns A configured Axios instance for internal API calls
   */
  createInternalApiClient,
  
  /**
   * Default export of createSecureAxios for backward compatibility
   */
  secureAxios as default
};

/**
 * String manipulation utilities
 * @description Provides consistent string handling throughout the application
 */
export {
  /**
   * Capitalizes the first letter of a string
   * @param str - The input string to capitalize
   * @returns The string with the first letter capitalized
   */
  capitalizeFirstLetter,
  
  /**
   * Truncates a string to a specified length, adding an ellipsis if the string exceeds the length
   * @param str - The input string to truncate
   * @param length - The maximum length of the returned string (excluding the ellipsis)
   * @returns The truncated string with ellipsis if needed
   */
  truncate,
  
  /**
   * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number
   * @param cpf - The CPF string to validate
   * @returns True if the CPF is valid, false otherwise
   */
  isValidCPF
};

/**
 * Date and time utilities
 * @description Provides comprehensive date/time handling with locale support
 */
export {
  // Constants
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  
  // Formatting functions
  /**
   * Formats a date according to the specified format and locale
   * @param date - The date to format
   * @param formatStr - The format string (defaults to dd/MM/yyyy)
   * @param locale - The locale to use for formatting (defaults to pt-BR)
   * @returns The formatted date string
   */
  formatDate,
  
  /**
   * Formats a time according to the specified format and locale
   * @param date - The date/time to format
   * @param formatStr - The format string (defaults to HH:mm)
   * @param locale - The locale to use for formatting (defaults to pt-BR)
   * @returns The formatted time string
   */
  formatTime,
  
  /**
   * Formats a date and time according to the specified format and locale
   * @param date - The date/time to format
   * @param formatStr - The format string (defaults to dd/MM/yyyy HH:mm)
   * @param locale - The locale to use for formatting (defaults to pt-BR)
   * @returns The formatted date and time string
   */
  formatDateTime,
  
  /**
   * Formats a date range as a string
   * @param startDate - The start date of the range
   * @param endDate - The end date of the range
   * @param formatStr - The format string for dates (defaults to dd/MM/yyyy)
   * @param locale - The locale to use for formatting (defaults to pt-BR)
   * @returns Formatted date range string
   */
  formatDateRange,
  
  /**
   * Formats a date relative to the current date (today, yesterday, etc.)
   * @param date - The date to format
   * @param locale - The locale to use for formatting (defaults to pt-BR)
   * @returns Relative date string
   */
  formatRelativeDate,
  
  /**
   * Formats a date according to journey-specific requirements
   * @param date - The date to format
   * @param journeyId - The journey identifier (health, care, plan)
   * @param locale - The locale to use for formatting (defaults to pt-BR)
   * @returns Journey-specific formatted date
   */
  formatJourneyDate,
  
  // Parsing and validation
  /**
   * Parses a date string according to the specified format and locale
   * @param dateStr - The date string to parse
   * @param formatStr - The format string (defaults to dd/MM/yyyy)
   * @param locale - The locale to use for parsing (defaults to pt-BR)
   * @returns The parsed date object
   * @throws Error if the date string cannot be parsed
   */
  parseDate,
  
  /**
   * Checks if a date is valid
   * @param date - The date to validate
   * @returns True if the date is valid, false otherwise
   */
  isValidDate,
  
  // Date calculations
  /**
   * Gets the start and end dates for a specified range type
   * @param rangeType - The type of range (today, thisWeek, thisMonth, etc.)
   * @param referenceDate - The reference date (defaults to today)
   * @returns Object with start and end dates for the range
   */
  getDateRange,
  
  /**
   * Calculates age in years based on birthdate
   * @param birthdate - The birthdate
   * @param referenceDate - The reference date to calculate age against (defaults to today)
   * @returns Age in years
   */
  calculateAge,
  
  /**
   * Returns a human-readable string representing time elapsed since the given date
   * @param date - The date to calculate time elapsed from
   * @param locale - The locale to use for formatting (defaults to pt-BR)
   * @returns Human-readable time ago string
   */
  getTimeAgo,
  
  /**
   * Gets an array of dates between start and end dates (inclusive)
   * @param startDate - The start date
   * @param endDate - The end date
   * @returns Array of dates between start and end dates
   */
  getDatesBetween,
  
  /**
   * Checks if two dates are the same day
   * @param dateA - The first date
   * @param dateB - The second date
   * @returns True if dates are the same day, false otherwise
   */
  isSameDay,
  
  /**
   * Checks if a date is within a specified range
   * @param date - The date to check
   * @param startDate - The start date of the range
   * @param endDate - The end date of the range
   * @returns True if the date is within the range, false otherwise
   */
  isDateInRange,
  
  // Timezone utilities
  /**
   * Gets the local timezone identifier
   * @returns The local timezone identifier
   */
  getLocalTimezone
};

// Named export groups for convenience

/**
 * HTTP client utilities
 */
export const httpUtils = {
  createSecureAxios,
  createInternalApiClient
};

/**
 * String manipulation utilities
 */
export const stringUtils = {
  capitalizeFirstLetter,
  truncate,
  isValidCPF
};

/**
 * Date and time utilities
 */
export const dateUtils = {
  // Constants
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  
  // Formatting
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRange,
  formatRelativeDate,
  formatJourneyDate,
  
  // Parsing and validation
  parseDate,
  isValidDate,
  
  // Calculations
  getDateRange,
  calculateAge,
  getTimeAgo,
  getDatesBetween,
  isSameDay,
  isDateInRange,
  
  // Timezone
  getLocalTimezone
};
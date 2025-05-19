/**
 * Common formatting interfaces for the AUSTA SuperApp
 * 
 * This file provides TypeScript interfaces for formatting functions used across
 * the application to ensure consistent type safety and parameter validation.
 */

/**
 * Options for number formatting
 */
export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  /**
   * The locale to use for formatting (defaults to user's locale or app default)
   */
  locale?: string;
}

/**
 * Options for currency formatting
 */
export interface FormatCurrencyOptions {
  /**
   * The ISO currency code (defaults to BRL for Brazilian Real)
   */
  currencyCode?: string;
  
  /**
   * The locale to use for formatting (defaults to user's locale or app default)
   */
  locale?: string;
}

/**
 * Options for percentage formatting
 */
export interface FormatPercentOptions {
  /**
   * The number of decimal places to include
   */
  decimalPlaces?: number;
  
  /**
   * The locale to use for formatting (defaults to user's locale or app default)
   */
  locale?: string;
}

/**
 * Options for compact number formatting
 */
export interface FormatCompactNumberOptions {
  /**
   * The locale to use for formatting (defaults to user's locale or app default)
   */
  locale?: string;
}

/**
 * Format types for journey-specific formatting
 */
export type FormatType = 'number' | 'currency' | 'percent';

/**
 * Options for journey-specific value formatting
 */
export interface FormatJourneyValueOptions extends Intl.NumberFormatOptions {
  /**
   * The format type (number, currency, percent)
   */
  format?: FormatType;
  
  /**
   * The journey identifier (health, care, plan)
   */
  journeyId: string;
}

/**
 * Options for health metric formatting
 */
export interface FormatHealthMetricOptions {
  /**
   * The type of health metric (e.g., HEART_RATE, BLOOD_PRESSURE)
   */
  metricType: string;
  
  /**
   * The unit of measurement
   */
  unit: string;
  
  /**
   * The locale to use for formatting (defaults to user's locale or app default)
   */
  locale?: string;
}

/**
 * Options for text truncation
 */
export interface TruncateTextOptions {
  /**
   * The maximum length of the text (default: 50)
   */
  maxLength?: number;
  
  /**
   * The ellipsis string to append (default: '...')
   */
  ellipsis?: string;
}

/**
 * Error types for formatting operations
 */
export enum FormatErrorType {
  INVALID_NUMBER = 'INVALID_NUMBER',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  INVALID_PERCENT = 'INVALID_PERCENT',
  INVALID_LOCALE = 'INVALID_LOCALE',
  INVALID_METRIC = 'INVALID_METRIC',
  FORMATTING_FAILED = 'FORMATTING_FAILED'
}

/**
 * Format error interface
 */
export interface FormatError {
  type: FormatErrorType;
  message: string;
  originalError?: Error;
}
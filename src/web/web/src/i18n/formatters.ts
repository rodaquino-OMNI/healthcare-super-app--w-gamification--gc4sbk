/**
 * Formatters for internationalization
 * 
 * This module provides utility functions for formatting dates, numbers, and currencies
 * according to different locales, with a primary focus on Brazilian Portuguese (pt-BR)
 * and English (en-US).
 * 
 * Note: This module uses the built-in Intl API, which is part of the JavaScript standard library.
 */

// Import typography tokens from design system primitives for consistent text formatting
import { typography } from '@design-system/primitives';

// Import journey-specific formatting preferences
import { JourneyType } from '@austa/interfaces/common/types';

/**
 * Default locale for the application
 */
export const DEFAULT_LOCALE = 'pt-BR';

/**
 * Journey-specific date format preferences
 */
const journeyDateFormats: Record<JourneyType, Intl.DateTimeFormatOptions> = {
  health: { day: '2-digit', month: '2-digit', year: 'numeric', hour: undefined, minute: undefined },
  care: { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  plan: { day: '2-digit', month: '2-digit', year: 'numeric', hour: undefined, minute: undefined }
};

/**
 * Formats a date object into a locale-specific string representation.
 * Respects journey-specific date presentation guidelines when a journey is specified.
 * 
 * @param date - The date to format
 * @param locale - The locale to use for formatting (e.g., 'pt-BR', 'en-US')
 * @param options - Formatting options following the Intl.DateTimeFormatOptions interface
 * @param journey - Optional journey context to apply journey-specific formatting
 * @returns The formatted date string
 * 
 * @example
 * // Returns "12/04/2023" for pt-BR or "4/12/2023" for en-US
 * formatDate(new Date(2023, 3, 12), 'pt-BR');
 * 
 * // With journey context (e.g., for care journey with time)
 * formatDate(new Date(2023, 3, 12, 14, 30), 'pt-BR', undefined, 'care');
 * // Returns "12/abr/2023 14:30" for pt-BR
 */
export function formatDate(
  date: Date,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions,
  journey?: JourneyType
): string {
  // Apply journey-specific formatting if specified
  const journeyOptions = journey ? journeyDateFormats[journey] : undefined;
  
  // Merge options with journey-specific options, with explicit options taking precedence
  const mergedOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...journeyOptions,
    ...options
  };

  const formatter = new Intl.DateTimeFormat(locale, mergedOptions);
  return formatter.format(date);
}

/**
 * Formats a number into a locale-specific string representation.
 * Uses typography tokens for consistent text alignment.
 * 
 * @param number - The number to format
 * @param locale - The locale to use for formatting (e.g., 'pt-BR', 'en-US')
 * @param options - Formatting options following the Intl.NumberFormatOptions interface
 * @returns The formatted number string
 * 
 * @example
 * // Returns "1.234,56" for pt-BR or "1,234.56" for en-US
 * formatNumber(1234.56, 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 */
export function formatNumber(
  number: number,
  locale: string = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 2 }
): string {
  // Apply typography.numeric for consistent number formatting
  // This ensures numbers align properly in financial contexts
  const formatter = new Intl.NumberFormat(locale, {
    ...options,
    // Ensure consistent decimal places for better alignment in tables and financial displays
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2
  });
  
  return formatter.format(number);
}

/**
 * Formats a number into a locale-specific currency string representation.
 * Uses typography tokens for consistent financial value presentation.
 * 
 * @param number - The number to format as currency
 * @param locale - The locale to use for formatting (e.g., 'pt-BR', 'en-US')
 * @param options - Formatting options with defaulting to BRL currency
 * @param journey - Optional journey context to apply journey-specific formatting
 * @returns The formatted currency string
 * 
 * @example
 * // Returns "R$ 1.234,56" for pt-BR or "$1,234.56" for en-US
 * formatCurrency(1234.56, 'pt-BR', { currency: 'BRL' });
 * formatCurrency(1234.56, 'en-US', { currency: 'USD' });
 */
export function formatCurrency(
  number: number,
  locale: string = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = {},
  journey?: JourneyType
): string {
  // Apply journey-specific currency formatting if in plan journey
  const journeyOptions = journey === 'plan' ? {
    // Plan journey uses accounting format for negative values
    currencySign: 'accounting' as const,
    // Ensure consistent decimal places for financial values
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  } : {};
  
  const currencyOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'BRL', // Default currency
    // Apply typography.numeric for consistent number formatting in financial contexts
    // This ensures currency values align properly in tables and financial displays
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...journeyOptions,
    ...options, // Allow overriding any option including currency
  };
  
  const formatter = new Intl.NumberFormat(locale, currencyOptions);
  return formatter.format(number);
}

/**
 * Formats a percentage value into a locale-specific string representation.
 * 
 * @param number - The number to format as percentage (e.g., 0.25 for 25%)
 * @param locale - The locale to use for formatting (e.g., 'pt-BR', 'en-US')
 * @param options - Formatting options for the percentage
 * @returns The formatted percentage string
 * 
 * @example
 * // Returns "25%" for most locales
 * formatPercentage(0.25);
 * 
 * // With 2 decimal places
 * formatPercentage(0.2567, 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 * // Returns "25,67%" for pt-BR
 */
export function formatPercentage(
  number: number,
  locale: string = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = {}
): string {
  const percentOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options, // Allow overriding any option
  };
  
  const formatter = new Intl.NumberFormat(locale, percentOptions);
  return formatter.format(number);
}
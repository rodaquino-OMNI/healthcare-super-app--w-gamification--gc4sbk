/**
 * Mobile-specific formatting utilities for the AUSTA SuperApp
 * 
 * This file provides utility functions for formatting data, such as numbers, currency,
 * and phone numbers, specifically tailored for the mobile application. It re-exports
 * formatting functions from the shared utilities to maintain consistency across platforms.
 *
 * @package i18next v23.0.0
 */

import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatJourneyValue,
  formatHealthMetric,
  truncateText,
  formatPhoneNumber,
  formatCPF,
  formatCompactNumber
} from '@app/shared/utils/format';

// Import journey-specific types for type safety
import { HealthMetricType } from '@austa/interfaces/health/types';

/**
 * Re-export formatting functions from shared utilities.
 * This promotes code reuse and ensures consistent formatting across
 * all platforms while making the functions directly accessible
 * within the mobile application's codebase.
 */
export {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatJourneyValue,
  formatHealthMetric,
  truncateText,
  formatPhoneNumber,
  formatCPF,
  formatCompactNumber
};

/**
 * Formats a health metric value with proper error handling and type safety.
 * This is a mobile-specific wrapper around the shared formatHealthMetric function.
 *
 * @param value - The metric value to format
 * @param metricType - The type of health metric from HealthMetricType enum
 * @param unit - The unit of measurement
 * @param locale - The locale to use for formatting
 * @returns The formatted health metric string
 */
export function formatHealthMetricSafe(
  value: number | string | null | undefined,
  metricType: HealthMetricType | string,
  unit: string,
  locale?: string
): string {
  if (value === null || value === undefined) {
    return ''; // Handle null/undefined values gracefully
  }
  
  try {
    return formatHealthMetric(value as number | string, metricType, unit, locale);
  } catch (error) {
    console.error(`Error formatting health metric (${metricType}):`, error);
    // Fallback formatting for error cases
    return typeof value === 'string' ? `${value} ${unit}` : `${Number(value).toString()} ${unit}`;
  }
}

/**
 * Formats a care journey appointment time with proper error handling.
 * 
 * @param date - The appointment date to format
 * @param format - The format style to use ('short', 'medium', 'long')
 * @param locale - The locale to use for formatting
 * @returns The formatted appointment time string
 */
export function formatAppointmentTime(
  date: Date | string | null | undefined,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale?: string
): string {
  if (!date) {
    return '';
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    const userLocale = locale || navigator.language || 'pt-BR';
    
    let options: Intl.DateTimeFormatOptions;
    switch (format) {
      case 'short':
        options = { hour: '2-digit', minute: '2-digit' };
        break;
      case 'long':
        options = { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit'
        };
        break;
      case 'medium':
      default:
        options = { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit'
        };
    }
    
    return new Intl.DateTimeFormat(userLocale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting appointment time:', error);
    // Return original string or empty string as fallback
    return typeof date === 'string' ? date : '';
  }
}

/**
 * Formats a plan benefit value with proper error handling.
 * 
 * @param value - The benefit value to format
 * @param showCurrency - Whether to show currency symbol
 * @param locale - The locale to use for formatting
 * @returns The formatted benefit value string
 */
export function formatBenefitValue(
  value: number | null | undefined,
  showCurrency: boolean = true,
  locale?: string
): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '-';
  }
  
  try {
    if (showCurrency) {
      return formatCurrency(Number(value), 'BRL', locale);
    } else {
      return formatNumber(Number(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 }, locale);
    }
  } catch (error) {
    console.error('Error formatting benefit value:', error);
    // Fallback formatting for error cases
    return showCurrency ? `R$ ${Number(value).toFixed(2)}` : Number(value).toFixed(2);
  }
}

/**
 * Note: Additional mobile-specific formatting functions can be added here
 * as needed for journey-specific requirements. Each function should include
 * proper error handling and type safety.
 */
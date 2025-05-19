import i18n from '@app/i18n';
import { JourneyId } from '@austa/interfaces/journey-context';
import { FormattingOptions } from '@austa/interfaces/common';

/**
 * Interface for date formatting options with journey-specific customizations
 */
export interface DateFormattingOptions extends Intl.DateTimeFormatOptions, FormattingOptions {
  /**
   * The journey context to use for formatting (applies journey-specific date formats)
   */
  journeyId?: JourneyId;
}

/**
 * Interface for number formatting options with journey-specific customizations
 */
export interface NumberFormattingOptions extends Intl.NumberFormatOptions, FormattingOptions {
  /**
   * The journey context to use for formatting (applies journey-specific number formats)
   */
  journeyId?: JourneyId;
}

/**
 * Interface for currency formatting options with journey-specific customizations
 */
export interface CurrencyFormattingOptions extends FormattingOptions {
  /**
   * The ISO 4217 currency code (defaults to BRL)
   */
  currencyCode?: string;
  
  /**
   * The journey context to use for formatting (applies journey-specific currency formats)
   */
  journeyId?: JourneyId;
}

/**
 * Interface for phone number formatting options with journey-specific customizations
 */
export interface PhoneFormattingOptions extends FormattingOptions {
  /**
   * The journey context to use for formatting (applies journey-specific phone formats)
   */
  journeyId?: JourneyId;
}

/**
 * Formats a date according to the specified locale and format options.
 * Supports journey-specific formatting when journeyId is provided.
 * 
 * @param date - The date to format
 * @param options - The formatting options including journey-specific customizations
 * @param locale - The locale to use for formatting (defaults to current i18n locale)
 * @returns The formatted date string
 */
export const formatDate = (
  date: Date,
  options: DateFormattingOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  },
  locale?: string
): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const currentLocale = locale || i18n.language || 'pt-BR';
  const { journeyId, ...dateTimeOptions } = options;
  
  // Apply journey-specific formatting if journeyId is provided
  // Each journey may have specific date display preferences
  if (journeyId) {
    switch (journeyId) {
      case 'health':
        // Health journey might prefer including time for medical records
        if (!dateTimeOptions.hour && !dateTimeOptions.minute) {
          dateTimeOptions.hour = '2-digit';
          dateTimeOptions.minute = '2-digit';
        }
        break;
      case 'care':
        // Care journey might need weekday for appointment scheduling
        if (!dateTimeOptions.weekday) {
          dateTimeOptions.weekday = 'long';
        }
        break;
      case 'plan':
        // Plan journey might need more formal date representation
        // Default options are sufficient
        break;
    }
  }

  return new Intl.DateTimeFormat(currentLocale, dateTimeOptions).format(date);
};

/**
 * Formats a number according to the specified locale and format options.
 * Supports journey-specific formatting when journeyId is provided.
 * 
 * @param value - The number to format
 * @param options - The formatting options including journey-specific customizations
 * @param locale - The locale to use for formatting (defaults to current i18n locale)
 * @returns The formatted number string
 */
export const formatNumber = (
  value: number,
  options: NumberFormattingOptions = {},
  locale?: string
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '';
  }

  const currentLocale = locale || i18n.language || 'pt-BR';
  const { journeyId, ...numberFormatOptions } = options;
  
  // Apply journey-specific formatting if journeyId is provided
  if (journeyId) {
    switch (journeyId) {
      case 'health':
        // Health journey might need more precision for health metrics
        if (!numberFormatOptions.maximumFractionDigits) {
          numberFormatOptions.maximumFractionDigits = 1;
        }
        break;
      case 'care':
        // Care journey might need rounded numbers for simplicity
        if (!numberFormatOptions.maximumFractionDigits) {
          numberFormatOptions.maximumFractionDigits = 0;
        }
        break;
      case 'plan':
        // Plan journey might need more precision for financial values
        if (!numberFormatOptions.maximumFractionDigits) {
          numberFormatOptions.maximumFractionDigits = 2;
        }
        break;
    }
  }

  return new Intl.NumberFormat(currentLocale, numberFormatOptions).format(value);
};

/**
 * Formats a number as currency according to the specified locale and currency code.
 * Supports journey-specific formatting when journeyId is provided.
 * 
 * @param value - The number to format as currency
 * @param options - The formatting options including currency code and journey-specific customizations
 * @param locale - The locale to use for formatting (defaults to current i18n locale)
 * @returns The formatted currency string
 */
export const formatCurrency = (
  value: number,
  options: CurrencyFormattingOptions = {},
  locale?: string
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '';
  }

  const currentLocale = locale || i18n.language || 'pt-BR';
  const { journeyId, currencyCode = 'BRL', ...otherOptions } = options;
  
  const numberFormatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    ...otherOptions
  };
  
  // Apply journey-specific formatting if journeyId is provided
  if (journeyId) {
    switch (journeyId) {
      case 'plan':
        // Plan journey might need more detailed currency representation
        if (!numberFormatOptions.maximumFractionDigits) {
          numberFormatOptions.maximumFractionDigits = 2;
        }
        // Always show currency symbol for plan journey
        numberFormatOptions.currencyDisplay = 'symbol';
        break;
      default:
        // Other journeys can use default currency formatting
        break;
    }
  }

  return new Intl.NumberFormat(currentLocale, numberFormatOptions).format(value);
};

/**
 * Formats a phone number according to Brazilian phone number format.
 * Supports journey-specific formatting when journeyId is provided.
 * 
 * @param phoneNumber - The phone number to format
 * @param options - The formatting options including journey-specific customizations
 * @returns The formatted phone number string
 */
export const formatPhoneNumber = (
  phoneNumber: string,
  options: PhoneFormattingOptions = {}
): string => {
  // Remove non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  const { journeyId } = options;
  
  // Check if we have a valid Brazilian number
  if (cleaned.length < 10 || cleaned.length > 11) {
    return phoneNumber; // Return original if format doesn't match expectations
  }
  
  // Apply journey-specific formatting if journeyId is provided
  if (journeyId) {
    switch (journeyId) {
      case 'care':
        // Care journey might need a more visible format for appointment contacts
        if (cleaned.length === 11) {
          // Mobile number with area code and more visible spacing: (XX) XXXXX-XXXX
          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        } else {
          // Landline with area code and more visible spacing: (XX) XXXX-XXXX
          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        }
      default:
        // Other journeys use standard formatting
        break;
    }
  }
  
  // Format according to Brazilian standards
  if (cleaned.length === 11) {
    // Mobile number with area code: (XX) XXXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else {
    // Landline with area code: (XX) XXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
};
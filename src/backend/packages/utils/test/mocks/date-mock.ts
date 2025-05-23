/**
 * Mock implementation of date utility functions for testing
 * 
 * This module provides mock implementations of all date utility functions
 * from date.util.ts, allowing tests to control date-related behavior
 * without relying on the actual date-fns library or system clock.
 */

// Constants from the original module
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const DEFAULT_LOCALE = 'pt-BR';

// Locale mapping for mocks
const LOCALE_MAP = {
  'pt-BR': 'pt-BR',
  'en-US': 'en-US'
};

/**
 * MockDateService class for controlling date-related behavior in tests
 */
export class MockDateService {
  private currentDate: Date;
  private validationBehavior: boolean;
  private formatResults: Map<string, string>;
  private parseResults: Map<string, Date>;
  private calculationResults: Map<string, any>;
  private journeyFormats: Map<string, string>;
  
  constructor() {
    // Initialize with default values
    this.currentDate = new Date('2023-01-01T12:00:00Z'); // Fixed date for consistent testing
    this.validationBehavior = true; // Default to valid dates
    this.formatResults = new Map();
    this.parseResults = new Map();
    this.calculationResults = new Map();
    this.journeyFormats = new Map([
      ['health', 'dd/MM/yyyy HH:mm'],
      ['care', 'EEE, dd MMM yyyy'],
      ['plan', 'dd/MM/yyyy']
    ]);
  }

  /**
   * Sets the current date used by the mock service
   * 
   * @param date - The date to use as "current" in tests
   * @returns The MockDateService instance for chaining
   */
  setCurrentDate(date: Date): MockDateService {
    this.currentDate = new Date(date);
    return this;
  }

  /**
   * Sets the validation behavior for isValidDate and related functions
   * 
   * @param isValid - Whether dates should be considered valid
   * @returns The MockDateService instance for chaining
   */
  setValidationBehavior(isValid: boolean): MockDateService {
    this.validationBehavior = isValid;
    return this;
  }

  /**
   * Sets a specific format result for a given input
   * 
   * @param input - The input date
   * @param format - The format string
   * @param locale - The locale
   * @param result - The result to return
   * @returns The MockDateService instance for chaining
   */
  setFormatResult(input: any, format: string, locale: string, result: string): MockDateService {
    const key = this.getFormatKey(input, format, locale);
    this.formatResults.set(key, result);
    return this;
  }

  /**
   * Sets a specific parse result for a given input
   * 
   * @param dateStr - The date string to parse
   * @param format - The format string
   * @param locale - The locale
   * @param result - The result to return
   * @returns The MockDateService instance for chaining
   */
  setParseResult(dateStr: string, format: string, locale: string, result: Date): MockDateService {
    const key = this.getParseKey(dateStr, format, locale);
    this.parseResults.set(key, result);
    return this;
  }

  /**
   * Sets a specific calculation result for a given function and inputs
   * 
   * @param functionName - The name of the function (e.g., 'calculateAge')
   * @param inputs - The function inputs as an array
   * @param result - The result to return
   * @returns The MockDateService instance for chaining
   */
  setCalculationResult(functionName: string, inputs: any[], result: any): MockDateService {
    const key = this.getCalculationKey(functionName, inputs);
    this.calculationResults.set(key, result);
    return this;
  }

  /**
   * Sets a specific format for a journey
   * 
   * @param journeyId - The journey identifier (health, care, plan)
   * @param format - The format to use for this journey
   * @returns The MockDateService instance for chaining
   */
  setJourneyFormat(journeyId: string, format: string): MockDateService {
    this.journeyFormats.set(journeyId.toLowerCase(), format);
    return this;
  }

  /**
   * Resets all mock configurations to defaults
   * 
   * @returns The MockDateService instance for chaining
   */
  reset(): MockDateService {
    this.currentDate = new Date('2023-01-01T12:00:00Z');
    this.validationBehavior = true;
    this.formatResults.clear();
    this.parseResults.clear();
    this.calculationResults.clear();
    this.journeyFormats.clear();
    this.journeyFormats.set('health', 'dd/MM/yyyy HH:mm');
    this.journeyFormats.set('care', 'EEE, dd MMM yyyy');
    this.journeyFormats.set('plan', 'dd/MM/yyyy');
    return this;
  }

  // Helper methods for key generation
  private getFormatKey(input: any, format: string, locale: string): string {
    const inputStr = input instanceof Date ? input.toISOString() : String(input);
    return `format:${inputStr}:${format}:${locale}`;
  }

  private getParseKey(dateStr: string, format: string, locale: string): string {
    return `parse:${dateStr}:${format}:${locale}`;
  }

  private getCalculationKey(functionName: string, inputs: any[]): string {
    const inputsStr = inputs.map(input => {
      if (input instanceof Date) {
        return input.toISOString();
      }
      return String(input);
    }).join(',');
    return `${functionName}:${inputsStr}`;
  }

  // Mock implementations of date utility functions

  /**
   * Mock implementation of formatDate
   */
  formatDate = (
    date: Date | string | number,
    formatStr: string = DEFAULT_DATE_FORMAT,
    locale: string = DEFAULT_LOCALE
  ): string => {
    if (!this.isValidDate(date)) {
      return '';
    }

    const key = this.getFormatKey(date, formatStr, locale);
    if (this.formatResults.has(key)) {
      return this.formatResults.get(key)!;
    }

    // Default mock behavior
    if (date instanceof Date) {
      return date.toISOString().split('T')[0].split('-').reverse().join('/');
    } else if (typeof date === 'string' && date.includes('T')) {
      return date.split('T')[0].split('-').reverse().join('/');
    }
    return '01/01/2023'; // Default mock date
  };

  /**
   * Mock implementation of formatTime
   */
  formatTime = (
    date: Date | string | number,
    formatStr: string = DEFAULT_TIME_FORMAT,
    locale: string = DEFAULT_LOCALE
  ): string => {
    if (!this.isValidDate(date)) {
      return '';
    }

    const key = this.getFormatKey(date, formatStr, locale);
    if (this.formatResults.has(key)) {
      return this.formatResults.get(key)!;
    }

    // Default mock behavior
    if (date instanceof Date) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (typeof date === 'string' && date.includes('T')) {
      const timePart = date.split('T')[1] || '';
      return timePart.substring(0, 5);
    }
    return '12:00'; // Default mock time
  };

  /**
   * Mock implementation of formatDateTime
   */
  formatDateTime = (
    date: Date | string | number,
    formatStr: string = DEFAULT_DATETIME_FORMAT,
    locale: string = DEFAULT_LOCALE
  ): string => {
    if (!this.isValidDate(date)) {
      return '';
    }

    const key = this.getFormatKey(date, formatStr, locale);
    if (this.formatResults.has(key)) {
      return this.formatResults.get(key)!;
    }

    // Default mock behavior
    const dateStr = this.formatDate(date, DEFAULT_DATE_FORMAT, locale);
    const timeStr = this.formatTime(date, DEFAULT_TIME_FORMAT, locale);
    return `${dateStr} ${timeStr}`;
  };

  /**
   * Mock implementation of parseDate
   */
  parseDate = (
    dateStr: string,
    formatStr: string = DEFAULT_DATE_FORMAT,
    locale: string = DEFAULT_LOCALE
  ): Date => {
    const key = this.getParseKey(dateStr, formatStr, locale);
    if (this.parseResults.has(key)) {
      return new Date(this.parseResults.get(key)!);
    }

    // Default mock behavior or throw error for invalid dates
    if (!this.validationBehavior) {
      throw new Error(`Invalid date string: ${dateStr} for format: ${formatStr}`);
    }

    // Simple parsing for dd/MM/yyyy format
    if (formatStr === DEFAULT_DATE_FORMAT && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }

    // Default mock date
    return new Date(this.currentDate);
  };

  /**
   * Mock implementation of isValidDate
   */
  isValidDate = (date: any): boolean => {
    // Return configured validation behavior
    if (date === null || date === undefined) {
      return false;
    }

    // Allow specific overrides for testing
    if (date === 'INVALID_DATE_FOR_TESTING') {
      return false;
    }

    return this.validationBehavior;
  };

  /**
   * Mock implementation of getDateRange
   */
  getDateRange = (
    rangeType: string,
    referenceDate: Date = this.currentDate
  ): { startDate: Date; endDate: Date } => {
    const key = this.getCalculationKey('getDateRange', [rangeType, referenceDate]);
    if (this.calculationResults.has(key)) {
      return this.calculationResults.get(key)!;
    }

    // Default mock behavior
    const today = new Date(referenceDate);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Simple mock implementations for common ranges
    switch (rangeType) {
      case 'today':
        return {
          startDate: new Date(today.setHours(0, 0, 0, 0)),
          endDate: new Date(today.setHours(23, 59, 59, 999))
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: new Date(yesterday.setHours(0, 0, 0, 0)),
          endDate: new Date(yesterday.setHours(23, 59, 59, 999))
        };
      case 'thisWeek':
        // Simple mock - just return 7 day range
        const weekStart = new Date(today);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return {
          startDate: new Date(weekStart.setHours(0, 0, 0, 0)),
          endDate: new Date(weekEnd.setHours(23, 59, 59, 999))
        };
      case 'thisMonth':
        // Simple mock - just return current month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          startDate: new Date(monthStart.setHours(0, 0, 0, 0)),
          endDate: new Date(monthEnd.setHours(23, 59, 59, 999))
        };
      default:
        // Default mock for any other range type
        return {
          startDate: new Date(today.setHours(0, 0, 0, 0)),
          endDate: new Date(tomorrow.setHours(23, 59, 59, 999))
        };
    }
  };

  /**
   * Mock implementation of calculateAge
   */
  calculateAge = (
    birthdate: Date | string,
    referenceDate: Date = this.currentDate
  ): number => {
    const key = this.getCalculationKey('calculateAge', [birthdate, referenceDate]);
    if (this.calculationResults.has(key)) {
      return this.calculationResults.get(key)!;
    }

    if (!this.isValidDate(birthdate)) {
      throw new Error('Invalid birthdate provided');
    }

    // Simple mock implementation
    const birthdateObj = typeof birthdate === 'string' ? this.parseDate(birthdate) : birthdate;
    const refYear = referenceDate.getFullYear();
    const birthYear = birthdateObj.getFullYear();
    
    return refYear - birthYear;
  };

  /**
   * Mock implementation of formatDateRange
   */
  formatDateRange = (
    startDate: Date,
    endDate: Date,
    formatStr: string = DEFAULT_DATE_FORMAT,
    locale: string = DEFAULT_LOCALE
  ): string => {
    const key = this.getCalculationKey('formatDateRange', [startDate, endDate, formatStr, locale]);
    if (this.calculationResults.has(key)) {
      return this.calculationResults.get(key)!;
    }

    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      return '';
    }

    const formattedStartDate = this.formatDate(startDate, formatStr, locale);
    const formattedEndDate = this.formatDate(endDate, formatStr, locale);

    return `${formattedStartDate} - ${formattedEndDate}`;
  };

  /**
   * Mock implementation of getTimeAgo
   */
  getTimeAgo = (
    date: Date | string | number,
    locale: string = DEFAULT_LOCALE
  ): string => {
    const key = this.getCalculationKey('getTimeAgo', [date, locale]);
    if (this.calculationResults.has(key)) {
      return this.calculationResults.get(key)!;
    }

    if (!this.isValidDate(date)) {
      return '';
    }

    // Localized time units for mocks
    const timeUnits = locale === 'pt-BR' ? {
      seconds: 'segundos',
      minute: 'minuto',
      minutes: 'minutos',
      hour: 'hora',
      hours: 'horas',
      day: 'dia',
      days: 'dias',
      week: 'semana',
      weeks: 'semanas',
      month: 'mês',
      months: 'meses',
      year: 'ano',
      years: 'anos',
      ago: 'atrás'
    } : {
      seconds: 'seconds',
      minute: 'minute',
      minutes: 'minutes',
      hour: 'hour',
      hours: 'hours',
      day: 'day',
      days: 'days',
      week: 'week',
      weeks: 'weeks',
      month: 'month',
      months: 'months',
      year: 'year',
      years: 'years',
      ago: 'ago'
    };

    // Simple mock implementation
    return `5 ${timeUnits.minutes} ${timeUnits.ago}`;
  };

  /**
   * Mock implementation of getDatesBetween
   */
  getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
    const key = this.getCalculationKey('getDatesBetween', [startDate, endDate]);
    if (this.calculationResults.has(key)) {
      return this.calculationResults.get(key)!;
    }

    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new Error('Invalid date range provided');
    }

    // Simple mock implementation
    const dates: Date[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // If start is after end, throw error
    if (start > end) {
      throw new Error('Start date must be before or the same as end date');
    }

    // Generate dates (simplified for mock)
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  /**
   * Mock implementation of isSameDay
   */
  isSameDay = (
    dateA: Date | string | number,
    dateB: Date | string | number
  ): boolean => {
    const key = this.getCalculationKey('isSameDay', [dateA, dateB]);
    if (this.calculationResults.has(key)) {
      return this.calculationResults.get(key)!;
    }

    if (!this.isValidDate(dateA) || !this.isValidDate(dateB)) {
      return false;
    }

    // Simple mock implementation
    const dateAObj = typeof dateA === 'string' || typeof dateA === 'number' ? new Date(dateA) : dateA;
    const dateBObj = typeof dateB === 'string' || typeof dateB === 'number' ? new Date(dateB) : dateB;

    return (
      dateAObj.getFullYear() === dateBObj.getFullYear() &&
      dateAObj.getMonth() === dateBObj.getMonth() &&
      dateAObj.getDate() === dateBObj.getDate()
    );
  };

  /**
   * Mock implementation of getLocalTimezone
   */
  getLocalTimezone = (): string => {
    // Fixed mock implementation
    return '+03:00';
  };

  /**
   * Mock implementation of formatRelativeDate
   */
  formatRelativeDate = (
    date: Date | string | number,
    locale: string = DEFAULT_LOCALE
  ): string => {
    const key = this.getCalculationKey('formatRelativeDate', [date, locale]);
    if (this.calculationResults.has(key)) {
      return this.calculationResults.get(key)!;
    }

    if (!this.isValidDate(date)) {
      return '';
    }

    // Localized relative terms
    const terms = locale === 'pt-BR' ? {
      today: 'Hoje',
      yesterday: 'Ontem',
      daysAgo: 'dias atrás',
      thisMonth: 'Este mês',
      lastMonth: 'Mês passado'
    } : {
      today: 'Today',
      yesterday: 'Yesterday',
      daysAgo: 'days ago',
      thisMonth: 'This month',
      lastMonth: 'Last month'
    };

    // Simple mock implementation
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const today = this.currentDate;

    if (this.isSameDay(dateObj, today)) {
      return terms.today;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (this.isSameDay(dateObj, yesterday)) {
      return terms.yesterday;
    }

    // Default to "X days ago"
    return `3 ${terms.daysAgo}`;
  };

  /**
   * Mock implementation of formatJourneyDate
   */
  formatJourneyDate = (
    date: Date | string | number,
    journeyId: string,
    locale: string = DEFAULT_LOCALE
  ): string => {
    const key = this.getCalculationKey('formatJourneyDate', [date, journeyId, locale]);
    if (this.calculationResults.has(key)) {
      return this.calculationResults.get(key)!;
    }

    if (!this.isValidDate(date)) {
      return '';
    }

    // Get journey-specific format
    const journeyFormat = this.journeyFormats.get(journeyId.toLowerCase()) || DEFAULT_DATE_FORMAT;

    // Journey-specific formats
    switch (journeyId.toLowerCase()) {
      case 'health':
        return this.formatDateTime(date, journeyFormat, locale);
      case 'care':
        return this.formatDate(date, journeyFormat, locale);
      case 'plan':
        return this.formatDate(date, journeyFormat, locale);
      default:
        return this.formatDate(date, DEFAULT_DATE_FORMAT, locale);
    }
  };

  /**
   * Mock implementation of isDateInRange
   */
  isDateInRange = (
    date: Date | string | number,
    startDate: Date | string | number,
    endDate: Date | string | number
  ): boolean => {
    const key = this.getCalculationKey('isDateInRange', [date, startDate, endDate]);
    if (this.calculationResults.has(key)) {
      return this.calculationResults.get(key)!;
    }

    if (!this.isValidDate(date) || !this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      return false;
    }

    // Simple mock implementation
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
    const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;

    return dateObj >= startDateObj && dateObj <= endDateObj;
  };
}

// Create and export a default instance for easy use in tests
export const mockDateService = new MockDateService();

// Export individual mock functions for direct use
export const formatDate = mockDateService.formatDate;
export const formatTime = mockDateService.formatTime;
export const formatDateTime = mockDateService.formatDateTime;
export const parseDate = mockDateService.parseDate;
export const isValidDate = mockDateService.isValidDate;
export const getDateRange = mockDateService.getDateRange;
export const calculateAge = mockDateService.calculateAge;
export const formatDateRange = mockDateService.formatDateRange;
export const getTimeAgo = mockDateService.getTimeAgo;
export const getDatesBetween = mockDateService.getDatesBetween;
export const isSameDay = mockDateService.isSameDay;
export const getLocalTimezone = mockDateService.getLocalTimezone;
export const formatRelativeDate = mockDateService.formatRelativeDate;
export const formatJourneyDate = mockDateService.formatJourneyDate;
export const isDateInRange = mockDateService.isDateInRange;

// Export a function to reset all mocks
export const resetDateMocks = (): void => {
  mockDateService.reset();
};

// Export a function to set the current date for all mocks
export const setMockCurrentDate = (date: Date): void => {
  mockDateService.setCurrentDate(date);
};

// Export a function to set validation behavior for all mocks
export const setMockValidationBehavior = (isValid: boolean): void => {
  mockDateService.setValidationBehavior(isValid);
};

/**
 * Example usage in tests:
 * 
 * ```typescript
 * import { 
 *   mockDateService, 
 *   formatDate, 
 *   setMockCurrentDate, 
 *   resetDateMocks 
 * } from '../mocks/date-mock';
 * 
 * describe('Date Utils Tests', () => {
 *   beforeEach(() => {
 *     resetDateMocks();
 *   });
 * 
 *   it('should format dates correctly', () => {
 *     // Set specific mock behavior
 *     mockDateService.setFormatResult(
 *       '2023-05-15T10:30:00Z', 
 *       'dd/MM/yyyy', 
 *       'pt-BR', 
 *       '15/05/2023'
 *     );
 * 
 *     // Use the mock in tests
 *     expect(formatDate('2023-05-15T10:30:00Z')).toBe('15/05/2023');
 *   });
 * 
 *   it('should handle journey-specific formatting', () => {
 *     // Configure journey-specific format
 *     mockDateService.setJourneyFormat('health', 'yyyy-MM-dd HH:mm');
 * 
 *     // Test with the custom format
 *     const result = mockDateService.formatJourneyDate(
 *       new Date('2023-05-15T10:30:00Z'),
 *       'health',
 *       'pt-BR'
 *     );
 * 
 *     // Verify the result
 *     expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
 *   });
 * });
 * ```
 */
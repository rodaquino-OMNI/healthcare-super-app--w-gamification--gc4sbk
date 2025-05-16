/**
 * Date Test Helpers
 * 
 * This module provides test helper functions for date utilities, including date mock generators,
 * timezone simulators, fixed date providers for deterministic testing, and comparison utilities.
 * These helpers facilitate testing of date formatting, parsing, comparison, calculation, and
 * validation functions across all journey services.
 */

import { addDays, addMonths, addYears, subDays, subMonths, subYears } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Types
export type DateGeneratorOptions = {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
};

export type TimezoneOptions = {
  timezone: string;
};

export type DateRangeTestCase = {
  start: Date;
  end: Date;
  expected: Date[];
  description: string;
};

export type DateComparisonTestCase = {
  date1: Date;
  date2: Date;
  expected: boolean;
  description: string;
};

export type DateFormatTestCase = {
  date: Date;
  format: string;
  locale?: 'pt-BR' | 'en-US';
  expected: string;
  description: string;
};

/**
 * Creates a fixed reference date for testing (2023-05-15T10:30:00.000Z)
 * This provides a consistent date reference for deterministic testing
 */
export const createReferenceDate = (): Date => new Date(2023, 4, 15, 10, 30, 0, 0);

/**
 * Creates a date in the future relative to the reference date
 */
export const createFutureDate = (options: DateGeneratorOptions = {}): Date => {
  const { years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0 } = options;
  const referenceDate = createReferenceDate();
  
  let result = referenceDate;
  if (years) result = addYears(result, years);
  if (months) result = addMonths(result, months);
  if (days) result = addDays(result, days);
  
  // Handle time components
  if (hours || minutes || seconds || milliseconds) {
    result = new Date(
      result.getFullYear(),
      result.getMonth(),
      result.getDate(),
      referenceDate.getHours() + hours,
      referenceDate.getMinutes() + minutes,
      referenceDate.getSeconds() + seconds,
      referenceDate.getMilliseconds() + milliseconds
    );
  }
  
  return result;
};

/**
 * Creates a date in the past relative to the reference date
 */
export const createPastDate = (options: DateGeneratorOptions = {}): Date => {
  const { years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0 } = options;
  const referenceDate = createReferenceDate();
  
  let result = referenceDate;
  if (years) result = subYears(result, years);
  if (months) result = subMonths(result, months);
  if (days) result = subDays(result, days);
  
  // Handle time components
  if (hours || minutes || seconds || milliseconds) {
    result = new Date(
      result.getFullYear(),
      result.getMonth(),
      result.getDate(),
      referenceDate.getHours() - hours,
      referenceDate.getMinutes() - minutes,
      referenceDate.getSeconds() - seconds,
      referenceDate.getMilliseconds() - milliseconds
    );
  }
  
  return result;
};

/**
 * Creates a date with the specified components
 */
export const createSpecificDate = (year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0, milliseconds = 0): Date => {
  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
};

/**
 * Creates a birthdate for a person of the specified age (in years)
 */
export const createBirthdateForAge = (age: number): Date => {
  const today = new Date();
  return new Date(
    today.getFullYear() - age,
    today.getMonth(),
    today.getDate()
  );
};

/**
 * Mocks the timezone for testing timezone-specific functionality
 * This function returns a cleanup function that should be called after the test
 */
export const mockTimezone = (timezone: string): () => void => {
  const originalDateTimeFormat = Intl.DateTimeFormat;
  const originalDate = global.Date;
  const originalTimezone = process.env.TZ;
  
  // Mock the timezone
  process.env.TZ = timezone;
  
  // Return cleanup function
  return () => {
    process.env.TZ = originalTimezone;
    global.Date = originalDate;
    Intl.DateTimeFormat = originalDateTimeFormat;
  };
};

/**
 * Mocks the current date for testing date-dependent functionality
 * This function returns a cleanup function that should be called after the test
 */
export const mockCurrentDate = (mockDate: Date): () => void => {
  const RealDate = global.Date;
  
  // Mock the Date constructor
  const MockDate = class extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        return new RealDate(mockDate.getTime());
      }
      return new RealDate(...args);
    }
  };
  
  // Mock Date.now
  MockDate.now = () => mockDate.getTime();
  
  // Replace global Date
  global.Date = MockDate as DateConstructor;
  
  // Return cleanup function
  return () => {
    global.Date = RealDate;
  };
};

/**
 * Creates test cases for date range functions
 */
export const createDateRangeTestCases = (): DateRangeTestCase[] => {
  const referenceDate = createReferenceDate();
  const yesterday = subDays(referenceDate, 1);
  const tomorrow = addDays(referenceDate, 1);
  const nextWeek = addDays(referenceDate, 7);
  
  return [
    {
      start: referenceDate,
      end: referenceDate,
      expected: [referenceDate],
      description: 'Same day range should return single date'
    },
    {
      start: yesterday,
      end: tomorrow,
      expected: [yesterday, referenceDate, tomorrow],
      description: 'Three day range should return three dates'
    },
    {
      start: referenceDate,
      end: nextWeek,
      expected: Array.from({ length: 8 }, (_, i) => addDays(referenceDate, i)),
      description: 'Week range should return eight dates'
    },
    {
      start: tomorrow,
      end: yesterday,
      expected: [],
      description: 'Invalid range (end before start) should return empty array'
    }
  ];
};

/**
 * Creates test cases for date comparison functions
 */
export const createDateComparisonTestCases = (): DateComparisonTestCase[] => {
  const referenceDate = createReferenceDate();
  const sameDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    14, 45, 0, 0
  );
  const yesterday = subDays(referenceDate, 1);
  const tomorrow = addDays(referenceDate, 1);
  
  return [
    {
      date1: referenceDate,
      date2: referenceDate,
      expected: true,
      description: 'Same date objects should be equal'
    },
    {
      date1: referenceDate,
      date2: sameDay,
      expected: true,
      description: 'Different times on same day should be same day'
    },
    {
      date1: referenceDate,
      date2: yesterday,
      expected: false,
      description: 'Different days should not be same day'
    },
    {
      date1: referenceDate,
      date2: tomorrow,
      expected: false,
      description: 'Different days should not be same day'
    }
  ];
};

/**
 * Creates test cases for date formatting functions
 */
export const createDateFormatTestCases = (): DateFormatTestCase[] => {
  const referenceDate = createReferenceDate(); // 2023-05-15
  
  return [
    {
      date: referenceDate,
      format: 'dd/MM/yyyy',
      locale: 'pt-BR',
      expected: '15/05/2023',
      description: 'Brazilian date format (dd/MM/yyyy)'
    },
    {
      date: referenceDate,
      format: 'MM/dd/yyyy',
      locale: 'en-US',
      expected: '05/15/2023',
      description: 'US date format (MM/dd/yyyy)'
    },
    {
      date: referenceDate,
      format: "d 'de' MMMM 'de' yyyy",
      locale: 'pt-BR',
      expected: '15 de maio de 2023',
      description: 'Brazilian long date format'
    },
    {
      date: referenceDate,
      format: 'MMMM d, yyyy',
      locale: 'en-US',
      expected: 'May 15, 2023',
      description: 'US long date format'
    },
    {
      date: referenceDate,
      format: 'HH:mm',
      expected: '10:30',
      description: 'Time format (24h)'
    },
    {
      date: referenceDate,
      format: 'h:mm a',
      locale: 'en-US',
      expected: '10:30 AM',
      description: 'Time format (12h)'
    }
  ];
};

/**
 * Creates test cases for Brazilian-specific date formats
 */
export const createBrazilianDateFormatTestCases = (): DateFormatTestCase[] => {
  const referenceDate = createReferenceDate(); // 2023-05-15
  
  return [
    {
      date: referenceDate,
      format: 'dd/MM/yyyy',
      locale: 'pt-BR',
      expected: '15/05/2023',
      description: 'Standard Brazilian date format'
    },
    {
      date: referenceDate,
      format: "d 'de' MMMM 'de' yyyy",
      locale: 'pt-BR',
      expected: '15 de maio de 2023',
      description: 'Brazilian long date format'
    },
    {
      date: referenceDate,
      format: "EEEE, d 'de' MMMM 'de' yyyy",
      locale: 'pt-BR',
      expected: 'segunda-feira, 15 de maio de 2023',
      description: 'Brazilian full date format with weekday'
    },
    {
      date: referenceDate,
      format: "d MMM yyyy 'às' HH:mm",
      locale: 'pt-BR',
      expected: '15 mai 2023 às 10:30',
      description: 'Brazilian datetime format'
    }
  ];
};

/**
 * Creates a map of locale identifiers to date-fns locale objects
 */
export const getLocaleMap = () => ({
  'pt-BR': ptBR,
  'en-US': enUS
});

/**
 * Helper to create a date string in Brazilian format (dd/MM/yyyy)
 */
export const createBrazilianDateString = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Helper to create a date string in US format (MM/dd/yyyy)
 */
export const createUSDateString = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

/**
 * Creates an array of dates for testing date range functions
 */
export const createDateArray = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Creates test cases for journey-specific date formatting
 */
export const createJourneyDateFormatTestCases = () => {
  const referenceDate = createReferenceDate(); // 2023-05-15
  
  return [
    {
      date: referenceDate,
      journey: 'health',
      expected: '15/05/2023',
      description: 'Health journey uses standard Brazilian date format'
    },
    {
      date: referenceDate,
      journey: 'care',
      expected: '15 de maio de 2023',
      description: 'Care journey uses long Brazilian date format'
    },
    {
      date: referenceDate,
      journey: 'plan',
      expected: '15/05/2023',
      description: 'Plan journey uses standard Brazilian date format'
    }
  ];
};
/**
 * Date Test Helpers
 * 
 * Provides test helper functions for date utilities, including date mock generators,
 * timezone simulators, fixed date providers for deterministic testing, and comparison utilities.
 * These helpers facilitate testing of date formatting, parsing, comparison, calculation,
 * and validation functions across all journey services.
 */

import { addDays, addMonths, addYears, subDays, subMonths, subYears } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Types for date helper functions
export type DateGeneratorOptions = {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
};

export type DateRangeGeneratorOptions = DateGeneratorOptions & {
  count: number;
  interval?: 'days' | 'months' | 'years';
};

export type TimezoneOptions = {
  timezone: string;
};

export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

export type LocaleType = 'pt-BR' | 'en-US';

/**
 * Creates a fixed date for deterministic testing
 * @returns Date object set to 2023-01-15T12:00:00.000Z
 */
export const createFixedDate = (): Date => {
  return new Date(2023, 0, 15, 12, 0, 0, 0); // January 15, 2023, 12:00:00
};

/**
 * Creates a date relative to the current date with specified offsets
 * @param options Configuration options for the date
 * @returns Date object with the specified offsets applied
 */
export const createRelativeDate = (options: DateGeneratorOptions = {}): Date => {
  const {
    years = 0,
    months = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
  } = options;

  let date = new Date();

  if (years !== 0) date = years > 0 ? addYears(date, years) : subYears(date, Math.abs(years));
  if (months !== 0) date = months > 0 ? addMonths(date, months) : subMonths(date, Math.abs(months));
  if (days !== 0) date = days > 0 ? addDays(date, days) : subDays(date, Math.abs(days));

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds,
    milliseconds
  );
};

/**
 * Creates a date relative to the fixed test date with specified offsets
 * @param options Configuration options for the date
 * @returns Date object with the specified offsets applied to the fixed date
 */
export const createRelativeToFixedDate = (options: DateGeneratorOptions = {}): Date => {
  const {
    years = 0,
    months = 0,
    days = 0,
    hours = 12,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
  } = options;

  let date = createFixedDate();

  if (years !== 0) date = years > 0 ? addYears(date, years) : subYears(date, Math.abs(years));
  if (months !== 0) date = months > 0 ? addMonths(date, months) : subMonths(date, Math.abs(months));
  if (days !== 0) date = days > 0 ? addDays(date, days) : subDays(date, Math.abs(days));

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds,
    milliseconds
  );
};

/**
 * Creates a specific date with the provided parameters
 * @param year Full year (e.g., 2023)
 * @param month Month index (0-11, where 0 is January)
 * @param day Day of the month (1-31)
 * @param hours Hours (0-23)
 * @param minutes Minutes (0-59)
 * @param seconds Seconds (0-59)
 * @param milliseconds Milliseconds (0-999)
 * @returns Date object with the specified parameters
 */
export const createSpecificDate = (
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0
): Date => {
  return new Date(year, month, day, hours, minutes, seconds, milliseconds);
};

/**
 * Creates an array of dates for testing date ranges
 * @param options Configuration options for the date range
 * @returns Array of Date objects
 */
export const createDateRange = (options: DateRangeGeneratorOptions): Date[] => {
  const { count, interval = 'days', ...dateOptions } = options;
  const startDate = createRelativeToFixedDate(dateOptions);
  const dates: Date[] = [startDate];

  for (let i = 1; i < count; i++) {
    if (interval === 'days') {
      dates.push(addDays(startDate, i));
    } else if (interval === 'months') {
      dates.push(addMonths(startDate, i));
    } else if (interval === 'years') {
      dates.push(addYears(startDate, i));
    }
  }

  return dates;
};

/**
 * Creates a date in the past relative to the fixed date
 * @param options Configuration options for the date
 * @returns Date object in the past
 */
export const createPastDate = (options: DateGeneratorOptions = {}): Date => {
  const adjustedOptions: DateGeneratorOptions = {
    ...options,
    days: options.days ? -Math.abs(options.days) : -7,
  };
  return createRelativeToFixedDate(adjustedOptions);
};

/**
 * Creates a date in the future relative to the fixed date
 * @param options Configuration options for the date
 * @returns Date object in the future
 */
export const createFutureDate = (options: DateGeneratorOptions = {}): Date => {
  const adjustedOptions: DateGeneratorOptions = {
    ...options,
    days: options.days ? Math.abs(options.days) : 7,
  };
  return createRelativeToFixedDate(adjustedOptions);
};

/**
 * Creates a date for a specific age (years from current date)
 * @param age Age in years
 * @param options Additional configuration options
 * @returns Date object representing a birthdate for the specified age
 */
export const createDateForAge = (age: number, options: DateGeneratorOptions = {}): Date => {
  const adjustedOptions: DateGeneratorOptions = {
    ...options,
    years: -Math.abs(age),
  };
  return createRelativeDate(adjustedOptions);
};

/**
 * Creates a mock for the current date that can be used to override the global Date object
 * @param mockDate The date to use as the current date
 * @returns A function that restores the original Date object
 */
export const mockCurrentDate = (mockDate: Date): () => void => {
  const originalDate = global.Date;
  const mockDateConstructor = function(this: Date, ...args: any[]) {
    if (args.length === 0) {
      return new originalDate(mockDate.getTime());
    }
    // @ts-ignore
    return new originalDate(...args);
  } as DateConstructor;

  mockDateConstructor.now = () => mockDate.getTime();
  mockDateConstructor.parse = originalDate.parse;
  mockDateConstructor.UTC = originalDate.UTC;

  // @ts-ignore
  global.Date = mockDateConstructor;

  return () => {
    global.Date = originalDate;
  };
};

/**
 * Mocks the timezone for testing timezone-specific functionality
 * @param timezone The timezone to simulate (e.g., 'America/Sao_Paulo')
 * @returns A function that restores the original timezone
 */
export const mockTimezone = (timezone: string): () => void => {
  const originalIntl = global.Intl;
  const originalDateTimeFormat = global.Intl.DateTimeFormat;
  const originalTimeZone = process.env.TZ;

  // Override process.env.TZ
  process.env.TZ = timezone;

  // Mock Intl.DateTimeFormat to always return the specified timezone
  global.Intl.DateTimeFormat = function(locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
    const newOptions = { ...options, timeZone: timezone };
    return new originalDateTimeFormat(locales, newOptions);
  } as typeof Intl.DateTimeFormat;

  // Copy over the original properties
  Object.defineProperties(global.Intl.DateTimeFormat, Object.getOwnPropertyDescriptors(originalDateTimeFormat));

  return () => {
    global.Intl = originalIntl;
    if (originalTimeZone) {
      process.env.TZ = originalTimeZone;
    } else {
      delete process.env.TZ;
    }
  };
};

/**
 * Creates a date string in Brazilian format (DD/MM/YYYY)
 * @param date The date to format
 * @returns Formatted date string
 */
export const createBrazilianDateString = (date: Date = createFixedDate()): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Creates a date string in American format (MM/DD/YYYY)
 * @param date The date to format
 * @returns Formatted date string
 */
export const createAmericanDateString = (date: Date = createFixedDate()): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

/**
 * Creates a date string in ISO format (YYYY-MM-DD)
 * @param date The date to format
 * @returns Formatted date string
 */
export const createISODateString = (date: Date = createFixedDate()): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Creates a datetime string in Brazilian format (DD/MM/YYYY HH:mm:ss)
 * @param date The date to format
 * @returns Formatted datetime string
 */
export const createBrazilianDateTimeString = (date: Date = createFixedDate()): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Creates a date-fns locale object based on the locale string
 * @param locale The locale string ('pt-BR' or 'en-US')
 * @returns The corresponding date-fns locale object
 */
export const getLocaleObject = (locale: LocaleType) => {
  return locale === 'pt-BR' ? ptBR : enUS;
};

/**
 * Creates a journey-specific date format based on the journey type
 * @param journeyType The type of journey
 * @param date The date to format
 * @returns Formatted date string according to journey-specific rules
 */
export const createJourneyDateString = (journeyType: JourneyType, date: Date = createFixedDate()): string => {
  switch (journeyType) {
    case JourneyType.HEALTH:
      // Health journey uses Brazilian format with time
      return createBrazilianDateTimeString(date);
    case JourneyType.CARE:
      // Care journey uses Brazilian format without time
      return createBrazilianDateString(date);
    case JourneyType.PLAN:
      // Plan journey uses ISO format
      return createISODateString(date);
    default:
      return createBrazilianDateString(date);
  }
};

/**
 * Creates an array of invalid date values for testing validation functions
 * @returns Array of invalid date values
 */
export const createInvalidDateValues = (): any[] => {
  return [
    null,
    undefined,
    '',
    'not-a-date',
    '32/01/2023', // Invalid day
    '01/13/2023', // Invalid month
    '29/02/2023', // Invalid date (not a leap year)
    '31/04/2023', // Invalid date (April has 30 days)
    '2023/01/01', // Wrong format for Brazilian date
    new Date('Invalid Date'),
    NaN,
    {},
    [],
    true,
    false,
    () => {},
    Symbol('date'),
  ];
};

/**
 * Creates test cases for date comparison functions
 * @returns Array of test cases with dates and expected comparison results
 */
export const createDateComparisonTestCases = () => {
  const baseDate = createFixedDate();
  const sameDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 18, 30);
  const nextDay = addDays(baseDate, 1);
  const previousDay = subDays(baseDate, 1);
  const nextMonth = addMonths(baseDate, 1);
  const previousMonth = subMonths(baseDate, 1);
  const nextYear = addYears(baseDate, 1);
  const previousYear = subYears(baseDate, 1);

  return {
    baseDate,
    sameDay,
    nextDay,
    previousDay,
    nextMonth,
    previousMonth,
    nextYear,
    previousYear,
    isSameDay: [
      { a: baseDate, b: sameDay, expected: true },
      { a: baseDate, b: nextDay, expected: false },
      { a: baseDate, b: previousDay, expected: false },
    ],
    isBefore: [
      { a: baseDate, b: nextDay, expected: true },
      { a: baseDate, b: sameDay, expected: false },
      { a: baseDate, b: previousDay, expected: false },
    ],
    isAfter: [
      { a: baseDate, b: previousDay, expected: true },
      { a: baseDate, b: sameDay, expected: false },
      { a: baseDate, b: nextDay, expected: false },
    ],
    isWithinRange: [
      { date: baseDate, start: previousDay, end: nextDay, expected: true },
      { date: previousDay, start: baseDate, end: nextDay, expected: false },
      { date: nextDay, start: previousDay, end: baseDate, expected: false },
    ],
  };
};

/**
 * Creates test cases for date range functions
 * @returns Object with various date range test cases
 */
export const createDateRangeTestCases = () => {
  const baseDate = createFixedDate();
  const yesterday = subDays(baseDate, 1);
  const tomorrow = addDays(baseDate, 1);
  const lastWeekStart = subDays(baseDate, 7);
  const lastWeekEnd = subDays(baseDate, 1);
  const nextWeekStart = addDays(baseDate, 1);
  const nextWeekEnd = addDays(baseDate, 7);
  const lastMonthStart = subMonths(baseDate, 1);
  const lastMonthEnd = subDays(baseDate, 1);
  const nextMonthStart = addDays(baseDate, 1);
  const nextMonthEnd = addMonths(baseDate, 1);

  return {
    baseDate,
    yesterday,
    tomorrow,
    lastWeek: { start: lastWeekStart, end: lastWeekEnd },
    nextWeek: { start: nextWeekStart, end: nextWeekEnd },
    lastMonth: { start: lastMonthStart, end: lastMonthEnd },
    nextMonth: { start: nextMonthStart, end: nextMonthEnd },
    datesBetween: {
      case1: { start: yesterday, end: tomorrow, expected: 3 }, // yesterday, today, tomorrow
      case2: { start: baseDate, end: baseDate, expected: 1 }, // just today
      case3: { start: lastWeekStart, end: lastWeekEnd, expected: 7 }, // 7 days
    },
  };
};

/**
 * Creates test cases for date calculation functions
 * @returns Object with various date calculation test cases
 */
export const createDateCalculationTestCases = () => {
  const now = createFixedDate();
  const age20BirthDate = subYears(now, 20);
  const age30BirthDate = subYears(now, 30);
  const age40BirthDate = subYears(now, 40);
  
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = subDays(now, 1);
  const oneWeekAgo = subDays(now, 7);
  const oneMonthAgo = subMonths(now, 1);
  const oneYearAgo = subYears(now, 1);

  return {
    now,
    ages: [
      { birthDate: age20BirthDate, expected: 20 },
      { birthDate: age30BirthDate, expected: 30 },
      { birthDate: age40BirthDate, expected: 40 },
    ],
    timeAgo: [
      { date: fiveMinutesAgo, expected: { pt: 'há 5 minutos', en: '5 minutes ago' } },
      { date: oneHourAgo, expected: { pt: 'há 1 hora', en: '1 hour ago' } },
      { date: oneDayAgo, expected: { pt: 'há 1 dia', en: '1 day ago' } },
      { date: oneWeekAgo, expected: { pt: 'há 7 dias', en: '7 days ago' } },
      { date: oneMonthAgo, expected: { pt: 'há 1 mês', en: '1 month ago' } },
      { date: oneYearAgo, expected: { pt: 'há 1 ano', en: '1 year ago' } },
    ],
  };
};

/**
 * Creates test cases for date formatting functions
 * @returns Object with various date formatting test cases
 */
export const createDateFormattingTestCases = () => {
  const testDate = createSpecificDate(2023, 0, 15, 14, 30, 45); // January 15, 2023, 14:30:45

  return {
    testDate,
    formats: {
      date: {
        'pt-BR': '15/01/2023',
        'en-US': '01/15/2023',
      },
      time: {
        'pt-BR': '14:30',
        'en-US': '2:30 PM',
      },
      dateTime: {
        'pt-BR': '15/01/2023 14:30',
        'en-US': '01/15/2023 2:30 PM',
      },
      longDate: {
        'pt-BR': '15 de janeiro de 2023',
        'en-US': 'January 15, 2023',
      },
      shortDate: {
        'pt-BR': '15/01/23',
        'en-US': '1/15/23',
      },
      isoDate: '2023-01-15',
      isoDateTime: '2023-01-15T14:30:45',
    },
    journeyFormats: {
      [JourneyType.HEALTH]: '15/01/2023 14:30:45',
      [JourneyType.CARE]: '15/01/2023',
      [JourneyType.PLAN]: '2023-01-15',
    },
  };
};

/**
 * Creates test cases for date parsing functions
 * @returns Object with various date parsing test cases
 */
export const createDateParsingTestCases = () => {
  const expectedDate = createSpecificDate(2023, 0, 15, 0, 0, 0); // January 15, 2023
  const expectedDateTime = createSpecificDate(2023, 0, 15, 14, 30, 45); // January 15, 2023, 14:30:45

  return {
    expectedDate,
    expectedDateTime,
    validInputs: {
      brazilianDate: '15/01/2023',
      americanDate: '01/15/2023',
      isoDate: '2023-01-15',
      brazilianDateTime: '15/01/2023 14:30:45',
      americanDateTime: '01/15/2023 14:30:45',
      isoDateTime: '2023-01-15T14:30:45',
    },
    invalidInputs: [
      '',
      'not-a-date',
      '32/01/2023',
      '01/13/2023',
      '29/02/2023',
      '31/04/2023',
    ],
  };
};
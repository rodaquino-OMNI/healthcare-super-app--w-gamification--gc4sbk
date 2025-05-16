/**
 * Mock implementation of date utility functions for testing
 * 
 * This file provides mock implementations of all date utility functions from date.util.ts
 * to enable testing of date-dependent code without relying on the actual date-fns library
 * or system clock.
 */

// Default format strings (matching the real implementation)
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const DEFAULT_LOCALE = 'pt-BR';

// Mock configuration state
interface MockDateConfig {
  now: Date;
  isValidOverride: boolean | null;
  formatResults: Record<string, string>;
  parseResults: Record<string, Date>;
  throwOnParse: boolean;
  journeyFormats: Record<string, string>;
  timeAgoResults: Record<string, string>;
  dateRanges: Record<string, { startDate: Date; endDate: Date }>;
  localTimezone: string;
}

// Initialize mock configuration with defaults
const mockConfig: MockDateConfig = {
  now: new Date('2023-06-15T12:00:00Z'), // Fixed reference date for tests
  isValidOverride: null, // When set, overrides all isValid checks
  formatResults: {}, // Custom format results by input+format key
  parseResults: {}, // Custom parse results by input+format key
  throwOnParse: false, // Whether parseDate should throw errors
  journeyFormats: {}, // Journey-specific format results
  timeAgoResults: {}, // Custom time ago results
  dateRanges: {}, // Custom date range results
  localTimezone: '+03:00', // Default mock timezone
};

/**
 * Reset all mock configurations to defaults
 */
export const resetDateMock = (): void => {
  mockConfig.now = new Date('2023-06-15T12:00:00Z');
  mockConfig.isValidOverride = null;
  mockConfig.formatResults = {};
  mockConfig.parseResults = {};
  mockConfig.throwOnParse = false;
  mockConfig.journeyFormats = {};
  mockConfig.timeAgoResults = {};
  mockConfig.dateRanges = {};
  mockConfig.localTimezone = '+03:00';
};

/**
 * Set the current date/time for all mock functions
 * 
 * @param date - The date to use as "now" in all mock functions
 */
export const setMockDate = (date: Date | string): void => {
  mockConfig.now = typeof date === 'string' ? new Date(date) : date;
};

/**
 * Override the result of isValidDate checks
 * 
 * @param isValid - Boolean to override all validity checks, or null to use default behavior
 */
export const setDateValidityOverride = (isValid: boolean | null): void => {
  mockConfig.isValidOverride = isValid;
};

/**
 * Set a custom format result for specific inputs
 * 
 * @param date - The input date
 * @param format - The format string
 * @param locale - The locale string
 * @param result - The result to return when formatDate is called with these parameters
 */
export const setFormatDateResult = (
  date: Date | string | number,
  format: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE,
  result: string
): void => {
  const key = getFormatKey(date, format, locale);
  mockConfig.formatResults[key] = result;
};

/**
 * Set a custom parse result for specific inputs
 * 
 * @param dateStr - The input date string
 * @param format - The format string
 * @param locale - The locale string
 * @param result - The Date to return when parseDate is called with these parameters
 */
export const setParseDateResult = (
  dateStr: string,
  format: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE,
  result: Date
): void => {
  const key = `${dateStr}|${format}|${locale}`;
  mockConfig.parseResults[key] = result;
};

/**
 * Configure parseDate to throw errors
 * 
 * @param shouldThrow - Whether parseDate should throw errors for invalid inputs
 */
export const setParseThrowBehavior = (shouldThrow: boolean): void => {
  mockConfig.throwOnParse = shouldThrow;
};

/**
 * Set a custom journey format result
 * 
 * @param date - The input date
 * @param journeyId - The journey identifier
 * @param locale - The locale string
 * @param result - The result to return when formatJourneyDate is called with these parameters
 */
export const setJourneyFormatResult = (
  date: Date | string | number,
  journeyId: string,
  locale: string = DEFAULT_LOCALE,
  result: string
): void => {
  const key = `${getDateString(date)}|${journeyId}|${locale}`;
  mockConfig.journeyFormats[key] = result;
};

/**
 * Set a custom time ago result
 * 
 * @param date - The input date
 * @param locale - The locale string
 * @param result - The result to return when getTimeAgo is called with these parameters
 */
export const setTimeAgoResult = (
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE,
  result: string
): void => {
  const key = `${getDateString(date)}|${locale}`;
  mockConfig.timeAgoResults[key] = result;
};

/**
 * Set a custom date range result
 * 
 * @param rangeType - The range type (today, thisWeek, etc.)
 * @param result - The result to return when getDateRange is called with this range type
 */
export const setDateRangeResult = (
  rangeType: string,
  result: { startDate: Date; endDate: Date }
): void => {
  mockConfig.dateRanges[rangeType] = result;
};

/**
 * Set the mock local timezone
 * 
 * @param timezone - The timezone string to return (e.g., '+03:00')
 */
export const setLocalTimezone = (timezone: string): void => {
  mockConfig.localTimezone = timezone;
};

// Helper function to generate consistent keys for format results
const getFormatKey = (date: Date | string | number, format: string, locale: string): string => {
  return `${getDateString(date)}|${format}|${locale}`;
};

// Helper function to convert any date input to a consistent string representation
const getDateString = (date: Date | string | number): string => {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return String(date);
};

/**
 * Mock implementation of formatDate
 * 
 * @param date - The date to format
 * @param formatStr - The format string
 * @param locale - The locale to use for formatting
 * @returns The formatted date string
 */
export const formatDate = (
  date: Date | string | number,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(date)) {
    return '';
  }

  const key = getFormatKey(date, formatStr, locale);
  if (mockConfig.formatResults[key]) {
    return mockConfig.formatResults[key];
  }

  // Default mock implementation
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Simple default formatting for common formats
  if (formatStr === 'dd/MM/yyyy') {
    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
  }
  
  if (formatStr === 'yyyy-MM-dd') {
    return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
  }
  
  // For other formats, return a placeholder
  return `MOCK_DATE(${dateObj.toISOString()})`;
};

/**
 * Mock implementation of formatTime
 * 
 * @param date - The date/time to format
 * @param formatStr - The format string
 * @param locale - The locale to use for formatting
 * @returns The formatted time string
 */
export const formatTime = (
  date: Date | string | number,
  formatStr: string = DEFAULT_TIME_FORMAT,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(date)) {
    return '';
  }

  const key = getFormatKey(date, formatStr, locale);
  if (mockConfig.formatResults[key]) {
    return mockConfig.formatResults[key];
  }

  // Default mock implementation
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Simple default formatting for common formats
  if (formatStr === 'HH:mm') {
    return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
  }
  
  if (formatStr === 'HH:mm:ss') {
    return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;
  }
  
  // For other formats, return a placeholder
  return `MOCK_TIME(${dateObj.toISOString()})`;
};

/**
 * Mock implementation of formatDateTime
 * 
 * @param date - The date/time to format
 * @param formatStr - The format string
 * @param locale - The locale to use for formatting
 * @returns The formatted date and time string
 */
export const formatDateTime = (
  date: Date | string | number,
  formatStr: string = DEFAULT_DATETIME_FORMAT,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(date)) {
    return '';
  }

  const key = getFormatKey(date, formatStr, locale);
  if (mockConfig.formatResults[key]) {
    return mockConfig.formatResults[key];
  }

  // Default mock implementation
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Simple default formatting for common formats
  if (formatStr === 'dd/MM/yyyy HH:mm') {
    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // For other formats, return a placeholder
  return `MOCK_DATETIME(${dateObj.toISOString()})`;
};

/**
 * Mock implementation of parseDate
 * 
 * @param dateStr - The date string to parse
 * @param formatStr - The format string
 * @param locale - The locale to use for parsing
 * @returns The parsed date object
 * @throws Error if the date string cannot be parsed and throwOnParse is true
 */
export const parseDate = (
  dateStr: string,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE
): Date => {
  const key = `${dateStr}|${formatStr}|${locale}`;
  
  if (mockConfig.parseResults[key]) {
    return mockConfig.parseResults[key];
  }
  
  // Default parsing behavior
  if (mockConfig.throwOnParse) {
    throw new Error(`Invalid date string: ${dateStr} for format: ${formatStr}`);
  }
  
  // Simple default parsing for common formats
  if (formatStr === 'dd/MM/yyyy') {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  
  // For other formats, return a default date
  return new Date('2023-01-01T00:00:00Z');
};

/**
 * Mock implementation of isValidDate
 * 
 * @param date - The date to validate
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (date: any): boolean => {
  // If there's an override, use it
  if (mockConfig.isValidOverride !== null) {
    return mockConfig.isValidOverride;
  }
  
  // Default validation logic
  if (date === null || date === undefined) {
    return false;
  }
  
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  if (typeof date === 'string') {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }
  
  if (typeof date === 'number') {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }
  
  return false;
};

/**
 * Mock implementation of getDateRange
 * 
 * @param rangeType - The type of range (today, thisWeek, thisMonth, etc.)
 * @param referenceDate - The reference date
 * @returns Object with start and end dates for the range
 */
export const getDateRange = (
  rangeType: string,
  referenceDate: Date = mockConfig.now
): { startDate: Date; endDate: Date } => {
  // If there's a custom range result, use it
  if (mockConfig.dateRanges[rangeType]) {
    return mockConfig.dateRanges[rangeType];
  }
  
  const today = referenceDate || mockConfig.now;
  
  // Default mock implementation with simplified ranges
  switch (rangeType) {
    case 'today':
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      };
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0),
        endDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      };
      
    case 'thisWeek':
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      startOfWeek.setDate(today.getDate() - dayOfWeek); // Start of week (Sunday)
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
      
      return {
        startDate: new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate(), 0, 0, 0),
        endDate: new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59)
      };
      
    case 'thisMonth':
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59) // Last day of month
      };
      
    case 'thisYear':
      return {
        startDate: new Date(today.getFullYear(), 0, 1, 0, 0, 0),
        endDate: new Date(today.getFullYear(), 11, 31, 23, 59, 59)
      };
      
    case 'last7Days':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      return {
        startDate: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 0, 0, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      };
      
    case 'last30Days':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      return {
        startDate: new Date(thirtyDaysAgo.getFullYear(), thirtyDaysAgo.getMonth(), thirtyDaysAgo.getDate(), 0, 0, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      };
      
    default:
      // Default to today for unknown range types
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      };
  }
};

/**
 * Mock implementation of calculateAge
 * 
 * @param birthdate - The birthdate
 * @param referenceDate - The reference date to calculate age against
 * @returns Age in years
 */
export const calculateAge = (
  birthdate: Date | string,
  referenceDate: Date = mockConfig.now
): number => {
  if (!isValidDate(birthdate)) {
    throw new Error('Invalid birthdate provided');
  }
  
  const birthdateObj = typeof birthdate === 'string' ? parseDate(birthdate) : birthdate;
  
  // Simple age calculation
  let age = referenceDate.getFullYear() - birthdateObj.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthdateObj.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthdateObj.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Mock implementation of formatDateRange
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param formatStr - The format string for dates
 * @param locale - The locale to use for formatting
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startDate: Date,
  endDate: Date,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return '';
  }
  
  const formattedStartDate = formatDate(startDate, formatStr, locale);
  const formattedEndDate = formatDate(endDate, formatStr, locale);
  
  return `${formattedStartDate} - ${formattedEndDate}`;
};

/**
 * Mock implementation of getTimeAgo
 * 
 * @param date - The date to calculate time elapsed from
 * @param locale - The locale to use for formatting
 * @returns Human-readable time ago string
 */
export const getTimeAgo = (
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const key = `${getDateString(date)}|${locale}`;
  if (mockConfig.timeAgoResults[key]) {
    return mockConfig.timeAgoResults[key];
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = mockConfig.now;
  
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Localized time units
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
    month: 'mu00eas',
    months: 'meses',
    year: 'ano',
    years: 'anos',
    ago: 'atru00e1s'
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
  if (diffInSeconds < 60) {
    return `${diffInSeconds} ${timeUnits.seconds} ${timeUnits.ago}`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? `1 ${timeUnits.minute} ${timeUnits.ago}`
      : `${diffInMinutes} ${timeUnits.minutes} ${timeUnits.ago}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1
      ? `1 ${timeUnits.hour} ${timeUnits.ago}`
      : `${diffInHours} ${timeUnits.hours} ${timeUnits.ago}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1
      ? `1 ${timeUnits.day} ${timeUnits.ago}`
      : `${diffInDays} ${timeUnits.days} ${timeUnits.ago}`;
  }
  
  // For longer periods, return a simple format
  return `MOCK_TIME_AGO(${diffInDays} days)`;
};

/**
 * Mock implementation of getDatesBetween
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of dates between start and end dates
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date range provided');
  }
  
  if (startDate > endDate) {
    throw new Error('Start date must be before or the same as end date');
  }
  
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Mock implementation of isSameDay
 * 
 * @param dateA - The first date
 * @param dateB - The second date
 * @returns True if dates are the same day, false otherwise
 */
export const isSameDay = (
  dateA: Date | string | number,
  dateB: Date | string | number
): boolean => {
  if (!isValidDate(dateA) || !isValidDate(dateB)) {
    return false;
  }
  
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
 * 
 * @returns The local timezone identifier
 */
export const getLocalTimezone = (): string => {
  return mockConfig.localTimezone;
};

/**
 * Mock implementation of formatRelativeDate
 * 
 * @param date - The date to format
 * @param locale - The locale to use for formatting
 * @returns Relative date string
 */
export const formatRelativeDate = (
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const key = `${getDateString(date)}|${locale}`;
  if (mockConfig.timeAgoResults[key]) {
    return mockConfig.timeAgoResults[key];
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const today = mockConfig.now;
  
  // Localized relative terms
  const terms = locale === 'pt-BR' ? {
    today: 'Hoje',
    yesterday: 'Ontem',
    daysAgo: 'dias atru00e1s',
    thisMonth: 'Este mu00eas',
    lastMonth: 'Mu00eas passado'
  } : {
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    thisMonth: 'This month',
    lastMonth: 'Last month'
  };
  
  if (isSameDay(dateObj, today)) {
    return terms.today;
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isSameDay(dateObj, yesterday)) {
    return terms.yesterday;
  }
  
  // Simple implementation for other cases
  const diffDays = Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} ${terms.daysAgo}`;
  }
  
  // For older dates, return formatted date
  return formatDate(dateObj, DEFAULT_DATE_FORMAT, locale);
};

/**
 * Mock implementation of formatJourneyDate
 * 
 * @param date - The date to format
 * @param journeyId - The journey identifier (health, care, plan)
 * @param locale - The locale to use for formatting
 * @returns Journey-specific formatted date
 */
export const formatJourneyDate = (
  date: Date | string | number,
  journeyId: string,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const key = `${getDateString(date)}|${journeyId}|${locale}`;
  if (mockConfig.journeyFormats[key]) {
    return mockConfig.journeyFormats[key];
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Journey-specific formats
  switch (journeyId.toLowerCase()) {
    case 'health':
      // Health journey uses detailed format with time for metrics
      return formatDateTime(dateObj, 'dd/MM/yyyy HH:mm', locale);
      
    case 'care':
      // Care journey uses appointment-friendly format
      return formatDate(dateObj, 'EEE, dd MMM yyyy', locale);
      
    case 'plan':
      // Plan journey uses formal date format for claims and documents
      return formatDate(dateObj, 'dd/MM/yyyy', locale);
      
    default:
      // Default format
      return formatDate(dateObj, DEFAULT_DATE_FORMAT, locale);
  }
};

/**
 * Mock implementation of isDateInRange
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the date is within the range, false otherwise
 */
export const isDateInRange = (
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number
): boolean => {
  if (!isValidDate(date) || !isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;
  
  const startTime = startOfDay(startDateObj).getTime();
  const endTime = endOfDay(endDateObj).getTime();
  const targetTime = dateObj.getTime();
  
  return targetTime >= startTime && targetTime <= endTime;
};

/**
 * Helper function to get start of day
 */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
}

/**
 * Helper function to get end of day
 */
function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
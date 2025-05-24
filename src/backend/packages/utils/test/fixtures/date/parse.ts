/**
 * Test fixtures for date parsing functions
 * Contains test cases for parseDate function with various formats and locales
 */

/**
 * Valid date parsing test cases
 * Each case includes a date string, format string, locale, and expected Date object
 */
export const validDateParseFixtures = [
  // Default format (dd/MM/yyyy) with default locale (pt-BR)
  {
    description: 'Default format with default locale',
    dateStr: '01/02/2023',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1) // Month is 0-indexed (February = 1)
  },
  {
    description: 'Default format with default locale - another date',
    dateStr: '15/07/2023',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 6, 15) // Month is 0-indexed (July = 6)
  },
  
  // US format (MM/dd/yyyy) with en-US locale
  {
    description: 'US format with en-US locale',
    dateStr: '02/01/2023',
    formatStr: 'MM/dd/yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1) // Month is 0-indexed (February = 1)
  },
  {
    description: 'US format with en-US locale - another date',
    dateStr: '07/15/2023',
    formatStr: 'MM/dd/yyyy',
    locale: 'en-US',
    expected: new Date(2023, 6, 15) // Month is 0-indexed (July = 6)
  },
  
  // Date with time components
  {
    description: 'Date with time in default locale',
    dateStr: '01/02/2023 14:30',
    formatStr: 'dd/MM/yyyy HH:mm',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1, 14, 30) // Year, month (0-indexed), day, hour, minute
  },
  {
    description: 'Date with time and seconds in default locale',
    dateStr: '01/02/2023 14:30:45',
    formatStr: 'dd/MM/yyyy HH:mm:ss',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1, 14, 30, 45) // Year, month (0-indexed), day, hour, minute, second
  },
  
  // Custom formats
  {
    description: 'Custom format - yyyy-MM-dd',
    dateStr: '2023-02-01',
    formatStr: 'yyyy-MM-dd',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1) // Month is 0-indexed (February = 1)
  },
  {
    description: 'Custom format - dd MMM yyyy',
    dateStr: '01 Feb 2023',
    formatStr: 'dd MMM yyyy',
    locale: 'en-US', // Using English month names
    expected: new Date(2023, 1, 1) // Month is 0-indexed (February = 1)
  },
  {
    description: 'Custom format - MMMM do, yyyy',
    dateStr: 'February 1st, 2023',
    formatStr: 'MMMM do, yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1) // Month is 0-indexed (February = 1)
  },
  
  // Locale-specific month names
  {
    description: 'Brazilian Portuguese month name',
    dateStr: '01 Fevereiro 2023',
    formatStr: 'dd MMMM yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1) // Month is 0-indexed (February = 1)
  },
  {
    description: 'English month name',
    dateStr: '01 February 2023',
    formatStr: 'dd MMMM yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1) // Month is 0-indexed (February = 1)
  },
  
  // Short weekday names
  {
    description: 'Format with short weekday - pt-BR',
    dateStr: 'qua, 01/02/2023',
    formatStr: 'EEE, dd/MM/yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1) // February 1, 2023 was a Wednesday
  },
  {
    description: 'Format with short weekday - en-US',
    dateStr: 'Wed, 02/01/2023',
    formatStr: 'EEE, MM/dd/yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1) // February 1, 2023 was a Wednesday
  },
  
  // Edge cases
  {
    description: 'Leap year date',
    dateStr: '29/02/2020',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expected: new Date(2020, 1, 29) // February 29, 2020 (leap year)
  },
  {
    description: 'Last day of the year',
    dateStr: '31/12/2023',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 11, 31) // December 31, 2023
  },
  {
    description: 'First day of the year',
    dateStr: '01/01/2023',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 0, 1) // January 1, 2023
  }
];

/**
 * Invalid date parsing test cases
 * Each case includes a date string, format string, locale, and expected error message pattern
 */
export const invalidDateParseFixtures = [
  // Malformed dates
  {
    description: 'Malformed date - incorrect separator',
    dateStr: '01-02-2023',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expectedErrorPattern: /Invalid date string/
  },
  {
    description: 'Malformed date - incorrect order',
    dateStr: '2023/01/02',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expectedErrorPattern: /Invalid date string/
  },
  
  // Invalid dates
  {
    description: 'Invalid date - February 30',
    dateStr: '30/02/2023',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expectedErrorPattern: /Invalid date string/
  },
  {
    description: 'Invalid date - April 31',
    dateStr: '31/04/2023',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expectedErrorPattern: /Invalid date string/
  },
  
  // Non-date strings
  {
    description: 'Non-date string',
    dateStr: 'not a date',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expectedErrorPattern: /Invalid date string/
  },
  {
    description: 'Empty string',
    dateStr: '',
    formatStr: 'dd/MM/yyyy',
    locale: 'pt-BR',
    expectedErrorPattern: /Invalid date string/
  },
  
  // Incorrect format strings
  {
    description: 'Incorrect format string for date',
    dateStr: '01/02/2023',
    formatStr: 'yyyy-MM-dd',
    locale: 'pt-BR',
    expectedErrorPattern: /Invalid date string/
  },
  {
    description: 'Format string with missing components',
    dateStr: '01/02',
    formatStr: 'dd/MM',
    locale: 'pt-BR',
    expectedErrorPattern: /Invalid date string/
  }
];

/**
 * Locale-specific date parsing test cases
 * Tests parsing behavior with different locales
 */
export const localeSpecificParseFixtures = [
  // Brazilian locale (pt-BR) specific tests
  {
    description: 'Brazilian date format with month name',
    dateStr: '01 de janeiro de 2023',
    formatStr: 'dd \\de MMMM \\de yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 0, 1) // January 1, 2023
  },
  {
    description: 'Brazilian date format with abbreviated month name',
    dateStr: '01 jan 2023',
    formatStr: 'dd MMM yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 0, 1) // January 1, 2023
  },
  {
    description: 'Brazilian date format with weekday',
    dateStr: 'domingo, 01 de janeiro de 2023',
    formatStr: 'EEEE, dd \\de MMMM \\de yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 0, 1) // January 1, 2023 was a Sunday
  },
  
  // US locale (en-US) specific tests
  {
    description: 'US date format with month name',
    dateStr: 'January 1, 2023',
    formatStr: 'MMMM d, yyyy',
    locale: 'en-US',
    expected: new Date(2023, 0, 1) // January 1, 2023
  },
  {
    description: 'US date format with abbreviated month name',
    dateStr: 'Jan 1, 2023',
    formatStr: 'MMM d, yyyy',
    locale: 'en-US',
    expected: new Date(2023, 0, 1) // January 1, 2023
  },
  {
    description: 'US date format with weekday',
    dateStr: 'Sunday, January 1, 2023',
    formatStr: 'EEEE, MMMM d, yyyy',
    locale: 'en-US',
    expected: new Date(2023, 0, 1) // January 1, 2023 was a Sunday
  },
  
  // Cross-locale parsing (testing robustness)
  {
    description: 'Brazilian format with US locale',
    dateStr: '01/02/2023', // In Brazil this is February 1, but parsing with US locale
    formatStr: 'dd/MM/yyyy', // Explicitly telling it's day/month/year format
    locale: 'en-US',
    expected: new Date(2023, 1, 1) // Should still correctly parse as February 1, 2023
  },
  {
    description: 'US format with Brazilian locale',
    dateStr: '02/01/2023', // In US this is January 2, but parsing with Brazilian locale
    formatStr: 'MM/dd/yyyy', // Explicitly telling it's month/day/year format
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1) // Should still correctly parse as February 1, 2023
  }
];

/**
 * Custom format pattern test cases
 * Tests parsing with various custom format patterns
 */
export const customFormatParseFixtures = [
  // ISO format
  {
    description: 'ISO date format',
    dateStr: '2023-02-01',
    formatStr: 'yyyy-MM-dd',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1) // February 1, 2023
  },
  {
    description: 'ISO datetime format',
    dateStr: '2023-02-01T14:30:00',
    formatStr: "yyyy-MM-dd'T'HH:mm:ss",
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1, 14, 30, 0) // February 1, 2023, 14:30:00
  },
  
  // Slash-separated formats
  {
    description: 'Slash-separated year first',
    dateStr: '2023/02/01',
    formatStr: 'yyyy/MM/dd',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1) // February 1, 2023
  },
  
  // Dot-separated formats
  {
    description: 'Dot-separated format',
    dateStr: '01.02.2023',
    formatStr: 'dd.MM.yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1) // February 1, 2023
  },
  
  // Space-separated formats
  {
    description: 'Space-separated format',
    dateStr: '01 02 2023',
    formatStr: 'dd MM yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1) // February 1, 2023
  },
  
  // Text month formats
  {
    description: 'Month as text - full',
    dateStr: '1 February 2023',
    formatStr: 'd MMMM yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1) // February 1, 2023
  },
  {
    description: 'Month as text - abbreviated',
    dateStr: '1 Feb 2023',
    formatStr: 'd MMM yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1) // February 1, 2023
  },
  
  // Formats with day of week
  {
    description: 'Format with full day of week',
    dateStr: 'Wednesday, February 1, 2023',
    formatStr: 'EEEE, MMMM d, yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1) // February 1, 2023 was a Wednesday
  },
  
  // Formats with time components
  {
    description: 'Format with 12-hour time',
    dateStr: 'February 1, 2023 2:30 PM',
    formatStr: 'MMMM d, yyyy h:mm a',
    locale: 'en-US',
    expected: new Date(2023, 1, 1, 14, 30) // February 1, 2023, 2:30 PM
  },
  {
    description: 'Format with 24-hour time',
    dateStr: '01/02/2023 14:30',
    formatStr: 'dd/MM/yyyy HH:mm',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1, 14, 30) // February 1, 2023, 14:30
  }
];
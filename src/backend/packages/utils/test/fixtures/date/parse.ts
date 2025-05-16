/**
 * Test fixtures for date parsing functions
 * Contains test cases for parseDate function with various formats and locales
 */

/**
 * Interface for valid date parsing test cases
 */
export interface ValidDateParseFixture {
  description: string;
  input: string;
  format?: string;
  locale?: string;
  expected: Date;
}

/**
 * Interface for invalid date parsing test cases
 */
export interface InvalidDateParseFixture {
  description: string;
  input: string;
  format?: string;
  locale?: string;
  errorMessage?: string;
}

/**
 * Standard date format test cases (dd/MM/yyyy for pt-BR)
 */
export const standardFormatFixtures: ValidDateParseFixture[] = [
  {
    description: 'Standard date format (dd/MM/yyyy)',
    input: '01/02/2023',
    expected: new Date(2023, 1, 1) // Month is 0-indexed in JS Date
  },
  {
    description: 'Date with single-digit day and month',
    input: '1/2/2023',
    format: 'd/M/yyyy',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Date with leading zeros',
    input: '01/02/2023',
    format: 'dd/MM/yyyy',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Date at end of month',
    input: '31/01/2023',
    expected: new Date(2023, 0, 31)
  },
  {
    description: 'Date with leap year (February 29)',
    input: '29/02/2020',
    expected: new Date(2020, 1, 29)
  }
];

/**
 * Locale-specific test cases for pt-BR
 */
export const ptBRFormatFixtures: ValidDateParseFixture[] = [
  {
    description: 'Brazilian format with explicit locale',
    input: '01/02/2023',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Brazilian format with month name',
    input: '01 fev 2023',
    format: 'dd MMM yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Brazilian format with full month name',
    input: '01 fevereiro 2023',
    format: 'dd MMMM yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Brazilian format with weekday',
    input: 'qua, 01/02/2023',
    format: 'EEE, dd/MM/yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Brazilian format with full weekday',
    input: 'quarta-feira, 01/02/2023',
    format: 'EEEE, dd/MM/yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1)
  }
];

/**
 * Locale-specific test cases for en-US
 */
export const enUSFormatFixtures: ValidDateParseFixture[] = [
  {
    description: 'US format with explicit locale',
    input: '02/01/2023', // MM/dd/yyyy in US format
    format: 'MM/dd/yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'US format with month name',
    input: 'Feb 01, 2023',
    format: 'MMM dd, yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'US format with full month name',
    input: 'February 01, 2023',
    format: 'MMMM dd, yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'US format with weekday',
    input: 'Wed, 02/01/2023',
    format: 'EEE, MM/dd/yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'US format with full weekday',
    input: 'Wednesday, February 01, 2023',
    format: 'EEEE, MMMM dd, yyyy',
    locale: 'en-US',
    expected: new Date(2023, 1, 1)
  }
];

/**
 * Custom format pattern test cases
 */
export const customFormatFixtures: ValidDateParseFixture[] = [
  {
    description: 'ISO format (yyyy-MM-dd)',
    input: '2023-02-01',
    format: 'yyyy-MM-dd',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Slash-separated format (yyyy/MM/dd)',
    input: '2023/02/01',
    format: 'yyyy/MM/dd',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Dot-separated format (dd.MM.yyyy)',
    input: '01.02.2023',
    format: 'dd.MM.yyyy',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Space-separated format (dd MM yyyy)',
    input: '01 02 2023',
    format: 'dd MM yyyy',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Custom separator format (dd-MM-yyyy)',
    input: '01-02-2023',
    format: 'dd-MM-yyyy',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Format with time component (dd/MM/yyyy HH:mm)',
    input: '01/02/2023 14:30',
    format: 'dd/MM/yyyy HH:mm',
    expected: new Date(2023, 1, 1, 14, 30)
  },
  {
    description: 'Format with seconds (dd/MM/yyyy HH:mm:ss)',
    input: '01/02/2023 14:30:45',
    format: 'dd/MM/yyyy HH:mm:ss',
    expected: new Date(2023, 1, 1, 14, 30, 45)
  },
  {
    description: 'Format with milliseconds (dd/MM/yyyy HH:mm:ss.SSS)',
    input: '01/02/2023 14:30:45.123',
    format: 'dd/MM/yyyy HH:mm:ss.SSS',
    expected: new Date(2023, 1, 1, 14, 30, 45, 123)
  },
  {
    description: 'Format with 12-hour clock (dd/MM/yyyy hh:mm a)',
    input: '01/02/2023 02:30 PM',
    format: 'dd/MM/yyyy hh:mm a',
    expected: new Date(2023, 1, 1, 14, 30)
  },
  {
    description: 'Format with timezone offset (yyyy-MM-dd'T'HH:mm:ssXXX)',
    input: '2023-02-01T14:30:00-03:00',
    format: "yyyy-MM-dd'T'HH:mm:ssXXX",
    expected: new Date('2023-02-01T14:30:00-03:00')
  }
];

/**
 * Edge case test fixtures
 */
export const edgeCaseFixtures: ValidDateParseFixture[] = [
  {
    description: 'Leap year date (February 29)',
    input: '29/02/2020',
    expected: new Date(2020, 1, 29)
  },
  {
    description: 'Last day of the year',
    input: '31/12/2023',
    expected: new Date(2023, 11, 31)
  },
  {
    description: 'First day of the year',
    input: '01/01/2023',
    expected: new Date(2023, 0, 1)
  },
  {
    description: 'Date with single-digit day',
    input: '1/02/2023',
    format: 'd/MM/yyyy',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Date with single-digit month',
    input: '01/2/2023',
    format: 'dd/M/yyyy',
    expected: new Date(2023, 1, 1)
  }
];

/**
 * Invalid date test fixtures that should throw errors
 */
export const invalidDateFixtures: InvalidDateParseFixture[] = [
  {
    description: 'Invalid day (day 32)',
    input: '32/01/2023',
    errorMessage: 'Invalid date string: 32/01/2023 for format: dd/MM/yyyy'
  },
  {
    description: 'Invalid month (month 13)',
    input: '01/13/2023',
    errorMessage: 'Invalid date string: 01/13/2023 for format: dd/MM/yyyy'
  },
  {
    description: 'Invalid date in February (non-leap year)',
    input: '29/02/2023',
    errorMessage: 'Invalid date string: 29/02/2023 for format: dd/MM/yyyy'
  },
  {
    description: 'Invalid format (expected dd/MM/yyyy, got MM/dd/yyyy)',
    input: '02/01/2023', // This is actually MM/dd/yyyy format
    format: 'dd/MM/yyyy',
    locale: 'pt-BR',
    errorMessage: 'Invalid date string: 02/01/2023 for format: dd/MM/yyyy'
  },
  {
    description: 'Completely invalid date string',
    input: 'not-a-date',
    errorMessage: 'Invalid date string: not-a-date for format: dd/MM/yyyy'
  },
  {
    description: 'Empty date string',
    input: '',
    errorMessage: 'Invalid date string:  for format: dd/MM/yyyy'
  },
  {
    description: 'Partial date (missing year)',
    input: '01/02',
    errorMessage: 'Invalid date string: 01/02 for format: dd/MM/yyyy'
  },
  {
    description: 'Wrong separator for format',
    input: '01-02-2023',
    format: 'dd/MM/yyyy',
    errorMessage: 'Invalid date string: 01-02-2023 for format: dd/MM/yyyy'
  },
  {
    description: 'Invalid characters in date string',
    input: '01/02/202X',
    errorMessage: 'Invalid date string: 01/02/202X for format: dd/MM/yyyy'
  }
];

/**
 * Journey-specific date format test fixtures
 */
export const journeySpecificFixtures: ValidDateParseFixture[] = [
  {
    description: 'Health journey date format with time',
    input: '01/02/2023 14:30',
    format: 'dd/MM/yyyy HH:mm',
    expected: new Date(2023, 1, 1, 14, 30)
  },
  {
    description: 'Care journey appointment date format',
    input: 'qua, 01 fev 2023',
    format: 'EEE, dd MMM yyyy',
    locale: 'pt-BR',
    expected: new Date(2023, 1, 1)
  },
  {
    description: 'Plan journey formal date format',
    input: '01/02/2023',
    format: 'dd/MM/yyyy',
    expected: new Date(2023, 1, 1)
  }
];

/**
 * All valid date fixtures combined
 */
export const allValidFixtures: ValidDateParseFixture[] = [
  ...standardFormatFixtures,
  ...ptBRFormatFixtures,
  ...enUSFormatFixtures,
  ...customFormatFixtures,
  ...edgeCaseFixtures,
  ...journeySpecificFixtures
];
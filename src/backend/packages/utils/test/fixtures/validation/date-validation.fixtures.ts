/**
 * @file Test fixtures for date validation and formatting in Brazilian and international formats.
 * 
 * This file provides comprehensive test data for validating and formatting dates across
 * all journey services. It includes valid dates in various formats, invalid dates with
 * formatting errors, and edge cases like leap years and month boundaries.
 * 
 * The fixtures support testing of date-dependent features like appointment scheduling,
 * claim submission dates, and health metric timestamps, ensuring consistent date handling
 * across the SuperApp.
 */

/**
 * Interface for date test fixtures with string representation and expected parsing result
 */
export interface DateTestFixture {
  /** The date string to be validated/parsed */
  dateString: string;
  /** The expected Date object if parsing is successful (optional) */
  expectedResult?: Date;
  /** Format string to use for parsing (defaults to dd/MM/yyyy for Brazilian format) */
  format?: string;
  /** Locale to use for parsing (defaults to pt-BR) */
  locale?: string;
  /** Description of the test case for better test reporting */
  description?: string;
}

/**
 * Interface for invalid date test fixtures with error context
 */
export interface InvalidDateTestFixture extends Omit<DateTestFixture, 'expectedResult'> {
  /** The expected error message or error context */
  errorContext: string;
}

/**
 * Valid dates in Brazilian format (dd/MM/yyyy)
 * 
 * These fixtures represent correctly formatted dates in the Brazilian format,
 * which is the primary format used in the AUSTA SuperApp for the Brazilian market.
 */
export const validBrazilianDates: DateTestFixture[] = [
  {
    dateString: '01/01/2023',
    expectedResult: new Date(2023, 0, 1), // Month is 0-indexed in JS Date
    description: 'New Year\'s Day 2023'
  },
  {
    dateString: '31/12/2022',
    expectedResult: new Date(2022, 11, 31),
    description: 'New Year\'s Eve 2022'
  },
  {
    dateString: '29/02/2020',
    expectedResult: new Date(2020, 1, 29),
    description: 'Leap day in 2020 (leap year)'
  },
  {
    dateString: '15/08/1995',
    expectedResult: new Date(1995, 7, 15),
    description: 'Historical date - mid 1990s'
  },
  {
    dateString: '21/04/2022',
    expectedResult: new Date(2022, 3, 21),
    description: 'Tiradentes Day 2022 (Brazilian holiday)'
  },
  {
    dateString: '07/09/2023',
    expectedResult: new Date(2023, 8, 7),
    description: 'Independence Day 2023 (Brazilian holiday)'
  },
  {
    dateString: '12/10/2023',
    expectedResult: new Date(2023, 9, 12),
    description: 'Our Lady of Aparecida 2023 (Brazilian holiday)'
  },
  {
    dateString: '02/11/2023',
    expectedResult: new Date(2023, 10, 2),
    description: 'All Souls Day 2023 (Brazilian holiday)'
  },
  {
    dateString: '15/11/2023',
    expectedResult: new Date(2023, 10, 15),
    description: 'Republic Proclamation Day 2023 (Brazilian holiday)'
  },
  {
    dateString: '25/12/2023',
    expectedResult: new Date(2023, 11, 25),
    description: 'Christmas Day 2023'
  },
  {
    dateString: '01/01/2024',
    expectedResult: new Date(2024, 0, 1),
    description: 'New Year\'s Day 2024'
  },
  {
    dateString: '12/02/2024',
    expectedResult: new Date(2024, 1, 12),
    description: 'Carnival Monday 2024 (Brazilian holiday)'
  },
  {
    dateString: '13/02/2024',
    expectedResult: new Date(2024, 1, 13),
    description: 'Carnival Tuesday 2024 (Brazilian holiday)'
  },
  {
    dateString: '29/03/2024',
    expectedResult: new Date(2024, 2, 29),
    description: 'Good Friday 2024 (Brazilian holiday)'
  },
  {
    dateString: '31/03/2024',
    expectedResult: new Date(2024, 2, 31),
    description: 'Easter Sunday 2024 (Brazilian holiday)'
  }
];

/**
 * Valid dates in international formats
 * 
 * These fixtures represent correctly formatted dates in various international formats,
 * supporting cross-region functionality in the AUSTA SuperApp.
 */
export const validInternationalDates: DateTestFixture[] = [
  {
    dateString: '2023-01-01',
    expectedResult: new Date(2023, 0, 1),
    format: 'yyyy-MM-dd',
    locale: 'en-US',
    description: 'ISO format date (yyyy-MM-dd)'
  },
  {
    dateString: '01/01/2023',
    expectedResult: new Date(2023, 0, 1),
    format: 'MM/dd/yyyy',
    locale: 'en-US',
    description: 'US format date (MM/dd/yyyy)'
  },
  {
    dateString: 'January 1, 2023',
    expectedResult: new Date(2023, 0, 1),
    format: 'MMMM d, yyyy',
    locale: 'en-US',
    description: 'US long format date (Month Day, Year)'
  },
  {
    dateString: '1-Jan-2023',
    expectedResult: new Date(2023, 0, 1),
    format: 'd-MMM-yyyy',
    locale: 'en-US',
    description: 'Abbreviated month format (d-MMM-yyyy)'
  },
  {
    dateString: '2023/01/01',
    expectedResult: new Date(2023, 0, 1),
    format: 'yyyy/MM/dd',
    locale: 'en-US',
    description: 'Year first format with slashes (yyyy/MM/dd)'
  },
  {
    dateString: '01.01.2023',
    expectedResult: new Date(2023, 0, 1),
    format: 'dd.MM.yyyy',
    locale: 'de-DE',
    description: 'German format with dots (dd.MM.yyyy)'
  },
  {
    dateString: '01/01/2023',
    expectedResult: new Date(2023, 0, 1),
    format: 'dd/MM/yyyy',
    locale: 'es-ES',
    description: 'Spanish format (same as Brazilian but different locale)'
  },
  {
    dateString: '2023年1月1日',
    expectedResult: new Date(2023, 0, 1),
    format: 'yyyy年M月d日',
    locale: 'ja-JP',
    description: 'Japanese format with year, month, day characters'
  }
];

/**
 * Valid dates with time components
 * 
 * These fixtures represent correctly formatted dates with time components,
 * used for testing datetime parsing and formatting functions.
 */
export const validDateTimes: DateTestFixture[] = [
  {
    dateString: '01/01/2023 00:00',
    expectedResult: new Date(2023, 0, 1, 0, 0),
    format: 'dd/MM/yyyy HH:mm',
    description: 'Brazilian format with time (midnight)'
  },
  {
    dateString: '31/12/2022 23:59',
    expectedResult: new Date(2022, 11, 31, 23, 59),
    format: 'dd/MM/yyyy HH:mm',
    description: 'Brazilian format with time (almost midnight)'
  },
  {
    dateString: '15/06/2023 12:30',
    expectedResult: new Date(2023, 5, 15, 12, 30),
    format: 'dd/MM/yyyy HH:mm',
    description: 'Brazilian format with time (midday)'
  },
  {
    dateString: '2023-01-01T12:00:00',
    expectedResult: new Date(2023, 0, 1, 12, 0, 0),
    format: "yyyy-MM-dd'T'HH:mm:ss",
    locale: 'en-US',
    description: 'ISO format with time'
  },
  {
    dateString: '01/01/2023 12:00 PM',
    expectedResult: new Date(2023, 0, 1, 12, 0),
    format: 'MM/dd/yyyy hh:mm a',
    locale: 'en-US',
    description: 'US format with 12-hour time (noon)'
  },
  {
    dateString: '01/01/2023 12:00 AM',
    expectedResult: new Date(2023, 0, 1, 0, 0),
    format: 'MM/dd/yyyy hh:mm a',
    locale: 'en-US',
    description: 'US format with 12-hour time (midnight)'
  }
];

/**
 * Edge case dates for testing boundary conditions
 * 
 * These fixtures represent edge cases like leap years, month boundaries,
 * and other special cases that should be handled correctly.
 */
export const edgeCaseDates: DateTestFixture[] = [
  {
    dateString: '29/02/2020',
    expectedResult: new Date(2020, 1, 29),
    description: 'Leap day in 2020 (leap year)'
  },
  {
    dateString: '28/02/2021',
    expectedResult: new Date(2021, 1, 28),
    description: 'Last day of February in non-leap year'
  },
  {
    dateString: '29/02/2024',
    expectedResult: new Date(2024, 1, 29),
    description: 'Leap day in 2024 (leap year)'
  },
  {
    dateString: '31/01/2023',
    expectedResult: new Date(2023, 0, 31),
    description: 'Last day of January'
  },
  {
    dateString: '30/04/2023',
    expectedResult: new Date(2023, 3, 30),
    description: 'Last day of 30-day month (April)'
  },
  {
    dateString: '31/12/9999',
    expectedResult: new Date(9999, 11, 31),
    description: 'Far future date (year 9999)'
  },
  {
    dateString: '01/01/1900',
    expectedResult: new Date(1900, 0, 1),
    description: 'Historical date (year 1900)'
  },
  {
    dateString: '01/01/1970',
    expectedResult: new Date(1970, 0, 1),
    description: 'Unix epoch start date'
  },
  {
    dateString: '19/01/2038',
    expectedResult: new Date(2038, 0, 19),
    description: 'Year 2038 problem boundary (32-bit time_t overflow)'
  }
];

/**
 * Invalid dates with formatting errors
 * 
 * These fixtures represent incorrectly formatted dates that should fail validation,
 * with descriptive error contexts for better test reporting.
 */
export const invalidDates: InvalidDateTestFixture[] = [
  {
    dateString: '32/01/2023',
    errorContext: 'Day out of range (32)',
    description: 'Invalid day (32) in January'
  },
  {
    dateString: '29/02/2023',
    errorContext: 'Invalid date (February 29 in non-leap year)',
    description: 'February 29 in non-leap year 2023'
  },
  {
    dateString: '31/04/2023',
    errorContext: 'Day out of range for month (April has 30 days)',
    description: 'April 31 (April only has 30 days)'
  },
  {
    dateString: '00/01/2023',
    errorContext: 'Day out of range (0)',
    description: 'Day zero (invalid)'
  },
  {
    dateString: '01/00/2023',
    errorContext: 'Month out of range (0)',
    description: 'Month zero (invalid)'
  },
  {
    dateString: '01/13/2023',
    errorContext: 'Month out of range (13)',
    description: 'Month 13 (invalid)'
  },
  {
    dateString: '31-01-2023',
    errorContext: 'Invalid format (using hyphens instead of slashes)',
    description: 'Wrong separator (hyphens instead of slashes)'
  },
  {
    dateString: '2023/01/01',
    errorContext: 'Invalid format (year first instead of day first)',
    description: 'Wrong order (year first instead of day first)'
  },
  {
    dateString: '01/Jan/2023',
    errorContext: 'Invalid format (text month instead of numeric)',
    description: 'Text month instead of numeric month'
  },
  {
    dateString: '1/1/2023',
    errorContext: 'Invalid format (missing leading zeros)',
    description: 'Missing leading zeros'
  },
  {
    dateString: 'abc',
    errorContext: 'Not a date string',
    description: 'Not a date string at all'
  },
  {
    dateString: '',
    errorContext: 'Empty string',
    description: 'Empty string'
  },
  {
    dateString: '01/01/23',
    errorContext: 'Invalid format (2-digit year)',
    description: '2-digit year instead of 4-digit year'
  },
  {
    dateString: '01/01/20233',
    errorContext: 'Invalid format (5-digit year)',
    description: '5-digit year'
  }
];

/**
 * Journey-specific date test fixtures
 * 
 * These fixtures represent dates in formats specific to each journey,
 * used for testing journey-specific date formatting and validation.
 */
export const journeySpecificDates = {
  /**
   * Health journey date fixtures
   * 
   * Health journey uses detailed format with time for metrics (dd/MM/yyyy HH:mm)
   */
  health: [
    {
      dateString: '15/06/2023 08:30',
      expectedResult: new Date(2023, 5, 15, 8, 30),
      format: 'dd/MM/yyyy HH:mm',
      description: 'Health check appointment time'
    },
    {
      dateString: '01/01/2023 00:00',
      expectedResult: new Date(2023, 0, 1, 0, 0),
      format: 'dd/MM/yyyy HH:mm',
      description: 'Start of health tracking period'
    },
    {
      dateString: '15/06/2023 12:00',
      expectedResult: new Date(2023, 5, 15, 12, 0),
      format: 'dd/MM/yyyy HH:mm',
      description: 'Blood pressure measurement time'
    }
  ],
  
  /**
   * Care journey date fixtures
   * 
   * Care journey uses appointment-friendly format (EEE, dd MMM yyyy)
   */
  care: [
    {
      dateString: 'Qui, 15 Jun 2023',
      expectedResult: new Date(2023, 5, 15),
      format: 'EEE, dd MMM yyyy',
      locale: 'pt-BR',
      description: 'Doctor appointment (Thursday)'
    },
    {
      dateString: 'Seg, 19 Jun 2023',
      expectedResult: new Date(2023, 5, 19),
      format: 'EEE, dd MMM yyyy',
      locale: 'pt-BR',
      description: 'Follow-up appointment (Monday)'
    },
    {
      dateString: 'Ter, 20 Jun 2023',
      expectedResult: new Date(2023, 5, 20),
      format: 'EEE, dd MMM yyyy',
      locale: 'pt-BR',
      description: 'Specialist consultation (Tuesday)'
    }
  ],
  
  /**
   * Plan journey date fixtures
   * 
   * Plan journey uses formal date format for claims and documents (dd/MM/yyyy)
   */
  plan: [
    {
      dateString: '01/06/2023',
      expectedResult: new Date(2023, 5, 1),
      description: 'Insurance claim submission date'
    },
    {
      dateString: '15/05/2023',
      expectedResult: new Date(2023, 4, 15),
      description: 'Medical procedure date'
    },
    {
      dateString: '30/06/2023',
      expectedResult: new Date(2023, 5, 30),
      description: 'Insurance coverage period end'
    }
  ]
};

/**
 * Date ranges for testing date range functions
 * 
 * These fixtures represent start and end date pairs for testing date range
 * functions like getDatesBetween and isDateInRange.
 */
export const dateRanges = [
  {
    startDate: new Date(2023, 0, 1),
    endDate: new Date(2023, 0, 31),
    description: 'Full month (January 2023)'
  },
  {
    startDate: new Date(2023, 0, 1),
    endDate: new Date(2023, 11, 31),
    description: 'Full year (2023)'
  },
  {
    startDate: new Date(2023, 5, 1),
    endDate: new Date(2023, 5, 30),
    description: 'Full month (June 2023)'
  },
  {
    startDate: new Date(2023, 0, 1),
    endDate: new Date(2023, 0, 1),
    description: 'Same day (single day range)'
  },
  {
    startDate: new Date(2023, 0, 1),
    endDate: new Date(2022, 0, 1),
    description: 'Invalid range (end before start)'
  }
];

/**
 * Date format strings for testing formatting functions
 * 
 * These fixtures represent various format strings for testing date
 * formatting functions like formatDate and formatDateTime.
 */
export const dateFormatStrings = [
  {
    format: 'dd/MM/yyyy',
    description: 'Brazilian standard date format'
  },
  {
    format: 'MM/dd/yyyy',
    description: 'US standard date format'
  },
  {
    format: 'yyyy-MM-dd',
    description: 'ISO date format'
  },
  {
    format: 'dd.MM.yyyy',
    description: 'European date format with dots'
  },
  {
    format: 'dd/MM/yyyy HH:mm',
    description: 'Brazilian date and time format'
  },
  {
    format: 'dd/MM/yyyy HH:mm:ss',
    description: 'Brazilian date and time format with seconds'
  },
  {
    format: "yyyy-MM-dd'T'HH:mm:ss",
    description: 'ISO date and time format'
  },
  {
    format: 'dd MMMM yyyy',
    description: 'Long date format with full month name'
  },
  {
    format: 'EEE, dd MMM yyyy',
    description: 'Date format with weekday and abbreviated month'
  }
];

/**
 * Relative date test fixtures
 * 
 * These fixtures represent dates relative to a reference date,
 * used for testing functions like formatRelativeDate and getTimeAgo.
 */
export const relativeDates = [
  {
    date: new Date(), // Today
    description: 'Today'
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
    description: 'Yesterday'
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
    description: '2 days ago'
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 7)), // 1 week ago
    description: '1 week ago'
  },
  {
    date: new Date(new Date().setMonth(new Date().getMonth() - 1)), // 1 month ago
    description: '1 month ago'
  },
  {
    date: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), // 1 year ago
    description: '1 year ago'
  }
];

/**
 * All date validation fixtures combined
 * 
 * This object provides a structured way to access all date validation fixtures
 * when needed as a group.
 */
export const dateValidationFixtures = {
  validBrazilianDates,
  validInternationalDates,
  validDateTimes,
  edgeCaseDates,
  invalidDates,
  journeySpecificDates,
  dateRanges,
  dateFormatStrings,
  relativeDates
};

/**
 * @typedef {Object} DateValidationFixtures
 * @property {DateTestFixture[]} validBrazilianDates - Valid dates in Brazilian format
 * @property {DateTestFixture[]} validInternationalDates - Valid dates in international formats
 * @property {DateTestFixture[]} validDateTimes - Valid dates with time components
 * @property {DateTestFixture[]} edgeCaseDates - Edge case dates for testing boundary conditions
 * @property {InvalidDateTestFixture[]} invalidDates - Invalid dates with formatting errors
 * @property {Object} journeySpecificDates - Journey-specific date test fixtures
 * @property {Object[]} dateRanges - Date ranges for testing date range functions
 * @property {Object[]} dateFormatStrings - Date format strings for testing formatting functions
 * @property {Object[]} relativeDates - Relative date test fixtures
 */

// Type declaration for the dateValidationFixtures object to improve IDE support
export type DateValidationFixtures = typeof dateValidationFixtures;
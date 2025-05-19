/**
 * Test fixtures for date validation functions
 * 
 * This file provides comprehensive test fixtures for validating date handling
 * across the application. It includes various representations of dates in different
 * formats, edge cases, and invalid values to ensure robust validation.
 */

/**
 * Interface for date validation test fixtures
 */
export interface DateValidationFixture {
  /** Description of the test case */
  description: string;
  /** Input value to test */
  input: any;
  /** Expected validation result */
  expected: boolean;
  /** Optional tags for categorizing test cases */
  tags?: string[];
}

/**
 * Valid Date object fixtures
 */
export const validDateObjects: DateValidationFixture[] = [
  {
    description: 'Current date',
    input: new Date(),
    expected: true,
    tags: ['date-object', 'valid']
  },
  {
    description: 'Specific date (2023-01-15)',
    input: new Date(2023, 0, 15), // January 15, 2023
    expected: true,
    tags: ['date-object', 'valid']
  },
  {
    description: 'Date with time (2023-06-30 14:30:45)',
    input: new Date(2023, 5, 30, 14, 30, 45), // June 30, 2023, 14:30:45
    expected: true,
    tags: ['date-object', 'valid', 'with-time']
  },
  {
    description: 'Leap year date (February 29, 2020)',
    input: new Date(2020, 1, 29), // February 29, 2020 (leap year)
    expected: true,
    tags: ['date-object', 'valid', 'leap-year']
  },
  {
    description: 'Minimum date (January 1, 1970)',
    input: new Date(1970, 0, 1), // Unix epoch start
    expected: true,
    tags: ['date-object', 'valid', 'boundary']
  },
  {
    description: 'Far future date (December 31, 2099)',
    input: new Date(2099, 11, 31), // December 31, 2099
    expected: true,
    tags: ['date-object', 'valid', 'future']
  }
];

/**
 * Valid ISO string fixtures
 */
export const validISOStrings: DateValidationFixture[] = [
  {
    description: 'ISO date string (2023-01-15)',
    input: '2023-01-15',
    expected: true,
    tags: ['string', 'iso', 'valid']
  },
  {
    description: 'ISO datetime string (2023-06-30T14:30:45)',
    input: '2023-06-30T14:30:45',
    expected: true,
    tags: ['string', 'iso', 'valid', 'with-time']
  },
  {
    description: 'ISO datetime string with timezone (2023-06-30T14:30:45Z)',
    input: '2023-06-30T14:30:45Z',
    expected: true,
    tags: ['string', 'iso', 'valid', 'with-timezone']
  },
  {
    description: 'ISO datetime string with offset (2023-06-30T14:30:45+03:00)',
    input: '2023-06-30T14:30:45+03:00',
    expected: true,
    tags: ['string', 'iso', 'valid', 'with-timezone']
  },
  {
    description: 'ISO leap year date (2020-02-29)',
    input: '2020-02-29',
    expected: true,
    tags: ['string', 'iso', 'valid', 'leap-year']
  },
  {
    description: 'ISO date with milliseconds (2023-06-30T14:30:45.123Z)',
    input: '2023-06-30T14:30:45.123Z',
    expected: true,
    tags: ['string', 'iso', 'valid', 'with-milliseconds']
  }
];

/**
 * Valid formatted string fixtures
 */
export const validFormattedStrings: DateValidationFixture[] = [
  {
    description: 'Formatted date string (MM/DD/YYYY)',
    input: '01/15/2023',
    expected: true,
    tags: ['string', 'formatted', 'valid']
  },
  {
    description: 'Formatted date string (DD/MM/YYYY)',
    input: '15/01/2023',
    expected: true,
    tags: ['string', 'formatted', 'valid']
  },
  {
    description: 'Formatted date string with time (MM/DD/YYYY HH:MM)',
    input: '06/30/2023 14:30',
    expected: true,
    tags: ['string', 'formatted', 'valid', 'with-time']
  },
  {
    description: 'Formatted date string (YYYY.MM.DD)',
    input: '2023.01.15',
    expected: true,
    tags: ['string', 'formatted', 'valid']
  },
  {
    description: 'Formatted date string (Month DD, YYYY)',
    input: 'January 15, 2023',
    expected: true,
    tags: ['string', 'formatted', 'valid', 'month-name']
  },
  {
    description: 'Formatted date string (DD Month YYYY)',
    input: '15 January 2023',
    expected: true,
    tags: ['string', 'formatted', 'valid', 'month-name']
  }
];

/**
 * Valid timestamp fixtures
 */
export const validTimestamps: DateValidationFixture[] = [
  {
    description: 'Current timestamp (milliseconds)',
    input: Date.now(),
    expected: true,
    tags: ['number', 'timestamp', 'valid']
  },
  {
    description: 'Specific timestamp (January 15, 2023)',
    input: new Date(2023, 0, 15).getTime(),
    expected: true,
    tags: ['number', 'timestamp', 'valid']
  },
  {
    description: 'Unix epoch (0)',
    input: 0,
    expected: true,
    tags: ['number', 'timestamp', 'valid', 'boundary']
  },
  {
    description: 'One day after Unix epoch',
    input: 86400000, // 24 * 60 * 60 * 1000 milliseconds
    expected: true,
    tags: ['number', 'timestamp', 'valid']
  },
  {
    description: 'Leap year timestamp (February 29, 2020)',
    input: new Date(2020, 1, 29).getTime(),
    expected: true,
    tags: ['number', 'timestamp', 'valid', 'leap-year']
  },
  {
    description: 'Far future timestamp (December 31, 2099)',
    input: new Date(2099, 11, 31).getTime(),
    expected: true,
    tags: ['number', 'timestamp', 'valid', 'future']
  }
];

/**
 * Invalid Date object fixtures
 */
export const invalidDateObjects: DateValidationFixture[] = [
  {
    description: 'Invalid Date object',
    input: new Date('invalid-date'),
    expected: false,
    tags: ['date-object', 'invalid']
  },
  {
    description: 'Invalid Date from out-of-range values',
    input: new Date(2023, 13, 32), // Invalid month and day
    expected: false,
    tags: ['date-object', 'invalid', 'out-of-range']
  },
  {
    description: 'Non-leap year February 29',
    input: new Date(2023, 1, 29), // February 29, 2023 (not a leap year)
    expected: false,
    tags: ['date-object', 'invalid', 'non-leap-year']
  }
];

/**
 * Invalid string fixtures
 */
export const invalidStrings: DateValidationFixture[] = [
  {
    description: 'Empty string',
    input: '',
    expected: false,
    tags: ['string', 'invalid']
  },
  {
    description: 'Non-date string',
    input: 'not a date',
    expected: false,
    tags: ['string', 'invalid']
  },
  {
    description: 'Partial date string',
    input: '2023-13',
    expected: false,
    tags: ['string', 'invalid', 'partial']
  },
  {
    description: 'Invalid month in ISO string',
    input: '2023-13-01',
    expected: false,
    tags: ['string', 'iso', 'invalid', 'out-of-range']
  },
  {
    description: 'Invalid day in ISO string',
    input: '2023-01-32',
    expected: false,
    tags: ['string', 'iso', 'invalid', 'out-of-range']
  },
  {
    description: 'Invalid format string',
    input: '01/15/20233',
    expected: false,
    tags: ['string', 'formatted', 'invalid']
  },
  {
    description: 'Non-leap year February 29 in ISO string',
    input: '2023-02-29',
    expected: false,
    tags: ['string', 'iso', 'invalid', 'non-leap-year']
  },
  {
    description: 'Invalid timezone format',
    input: '2023-01-15T12:00:00+25:00',
    expected: false,
    tags: ['string', 'iso', 'invalid', 'timezone']
  }
];

/**
 * Invalid number/timestamp fixtures
 */
export const invalidTimestamps: DateValidationFixture[] = [
  {
    description: 'Extremely large number',
    input: Number.MAX_SAFE_INTEGER * 1000,
    expected: false,
    tags: ['number', 'timestamp', 'invalid', 'out-of-range']
  },
  {
    description: 'Negative timestamp (before Unix epoch)',
    input: -8640000000000000, // Minimum date value in JavaScript
    expected: false,
    tags: ['number', 'timestamp', 'invalid', 'boundary']
  },
  {
    description: 'NaN',
    input: NaN,
    expected: false,
    tags: ['number', 'invalid']
  },
  {
    description: 'Infinity',
    input: Infinity,
    expected: false,
    tags: ['number', 'invalid']
  }
];

/**
 * Null, undefined, and other type fixtures
 */
export const otherInvalidTypes: DateValidationFixture[] = [
  {
    description: 'null value',
    input: null,
    expected: false,
    tags: ['null', 'invalid']
  },
  {
    description: 'undefined value',
    input: undefined,
    expected: false,
    tags: ['undefined', 'invalid']
  },
  {
    description: 'Boolean true',
    input: true,
    expected: false,
    tags: ['boolean', 'invalid']
  },
  {
    description: 'Boolean false',
    input: false,
    expected: false,
    tags: ['boolean', 'invalid']
  },
  {
    description: 'Empty object',
    input: {},
    expected: false,
    tags: ['object', 'invalid']
  },
  {
    description: 'Array',
    input: [2023, 0, 15],
    expected: false,
    tags: ['array', 'invalid']
  },
  {
    description: 'Function',
    input: () => new Date(),
    expected: false,
    tags: ['function', 'invalid']
  },
  {
    description: 'Symbol',
    input: Symbol('date'),
    expected: false,
    tags: ['symbol', 'invalid']
  }
];

/**
 * Timezone edge case fixtures
 */
export const timezoneEdgeCases: DateValidationFixture[] = [
  {
    description: 'Date at UTC midnight',
    input: '2023-01-01T00:00:00Z',
    expected: true,
    tags: ['string', 'iso', 'valid', 'timezone-edge']
  },
  {
    description: 'Date at UTC day boundary',
    input: '2023-01-01T23:59:59.999Z',
    expected: true,
    tags: ['string', 'iso', 'valid', 'timezone-edge']
  },
  {
    description: 'Date with positive UTC offset crossing day boundary',
    input: '2023-01-01T00:30:00+01:00', // December 31, 2022, 23:30:00 UTC
    expected: true,
    tags: ['string', 'iso', 'valid', 'timezone-edge']
  },
  {
    description: 'Date with negative UTC offset crossing day boundary',
    input: '2023-01-01T23:30:00-01:00', // January 2, 2023, 00:30:00 UTC
    expected: true,
    tags: ['string', 'iso', 'valid', 'timezone-edge']
  },
  {
    description: 'Date with maximum positive UTC offset',
    input: '2023-01-01T00:00:00+14:00',
    expected: true,
    tags: ['string', 'iso', 'valid', 'timezone-edge']
  },
  {
    description: 'Date with maximum negative UTC offset',
    input: '2023-01-01T00:00:00-12:00',
    expected: true,
    tags: ['string', 'iso', 'valid', 'timezone-edge']
  }
];

/**
 * Leap year edge case fixtures
 */
export const leapYearEdgeCases: DateValidationFixture[] = [
  {
    description: 'February 28 in leap year',
    input: '2020-02-28',
    expected: true,
    tags: ['string', 'iso', 'valid', 'leap-year']
  },
  {
    description: 'February 29 in leap year',
    input: '2020-02-29',
    expected: true,
    tags: ['string', 'iso', 'valid', 'leap-year']
  },
  {
    description: 'February 28 in non-leap year',
    input: '2023-02-28',
    expected: true,
    tags: ['string', 'iso', 'valid', 'non-leap-year']
  },
  {
    description: 'February 29 in non-leap year',
    input: '2023-02-29',
    expected: false,
    tags: ['string', 'iso', 'invalid', 'non-leap-year']
  },
  {
    description: 'February 29 in century year (not leap year)',
    input: '1900-02-29',
    expected: false,
    tags: ['string', 'iso', 'invalid', 'century-year']
  },
  {
    description: 'February 29 in century year divisible by 400 (leap year)',
    input: '2000-02-29',
    expected: true,
    tags: ['string', 'iso', 'valid', 'century-leap-year']
  }
];

/**
 * Combined fixtures for all valid dates
 */
export const allValidDateFixtures: DateValidationFixture[] = [
  ...validDateObjects,
  ...validISOStrings,
  ...validFormattedStrings,
  ...validTimestamps,
  ...timezoneEdgeCases.filter(fixture => fixture.expected === true),
  ...leapYearEdgeCases.filter(fixture => fixture.expected === true)
];

/**
 * Combined fixtures for all invalid dates
 */
export const allInvalidDateFixtures: DateValidationFixture[] = [
  ...invalidDateObjects,
  ...invalidStrings,
  ...invalidTimestamps,
  ...otherInvalidTypes,
  ...timezoneEdgeCases.filter(fixture => fixture.expected === false),
  ...leapYearEdgeCases.filter(fixture => fixture.expected === false)
];

/**
 * All date validation fixtures combined
 */
export const allDateValidationFixtures: DateValidationFixture[] = [
  ...allValidDateFixtures,
  ...allInvalidDateFixtures
];

/**
 * Get fixtures by tag
 * 
 * @param tag - The tag to filter by
 * @returns Array of fixtures with the specified tag
 */
export const getFixturesByTag = (tag: string): DateValidationFixture[] => {
  return allDateValidationFixtures.filter(fixture => 
    fixture.tags?.includes(tag)
  );
};

/**
 * Get fixtures by expected result
 * 
 * @param expected - The expected validation result (true/false)
 * @returns Array of fixtures with the specified expected result
 */
export const getFixturesByExpectedResult = (expected: boolean): DateValidationFixture[] => {
  return allDateValidationFixtures.filter(fixture => 
    fixture.expected === expected
  );
};

/**
 * Get fixtures by multiple tags (AND logic)
 * 
 * @param tags - Array of tags to filter by (all must match)
 * @returns Array of fixtures with all specified tags
 */
export const getFixturesByAllTags = (tags: string[]): DateValidationFixture[] => {
  return allDateValidationFixtures.filter(fixture => 
    tags.every(tag => fixture.tags?.includes(tag))
  );
};

/**
 * Get fixtures by any tag (OR logic)
 * 
 * @param tags - Array of tags to filter by (any can match)
 * @returns Array of fixtures with any of the specified tags
 */
export const getFixturesByAnyTag = (tags: string[]): DateValidationFixture[] => {
  return allDateValidationFixtures.filter(fixture => 
    tags.some(tag => fixture.tags?.includes(tag))
  );
};
/**
 * Test fixtures for date validation functions
 * 
 * This file provides comprehensive test fixtures for validating date handling
 * across the application, particularly for the isValidDate function.
 */

/**
 * Interface for date validation test fixtures
 */
export interface DateValidationFixture {
  description: string;
  value: any;
  expected: boolean;
}

/**
 * Valid date fixtures
 * 
 * These fixtures represent various valid date formats and should all
 * pass validation when using the isValidDate function.
 */
export const validDateFixtures: DateValidationFixture[] = [
  // Date objects
  {
    description: 'Current date as Date object',
    value: new Date(),
    expected: true
  },
  {
    description: 'Specific date as Date object',
    value: new Date(2023, 0, 15), // January 15, 2023
    expected: true
  },
  {
    description: 'Date with time components',
    value: new Date(2023, 5, 10, 14, 30, 0), // June 10, 2023, 14:30:00
    expected: true
  },
  
  // Timestamps (numbers)
  {
    description: 'Current timestamp',
    value: Date.now(),
    expected: true
  },
  {
    description: 'Specific timestamp',
    value: 1672531200000, // January 1, 2023, 00:00:00 UTC
    expected: true
  },
  {
    description: 'Unix epoch (0)',
    value: 0, // January 1, 1970, 00:00:00 UTC
    expected: true
  },
  
  // ISO strings
  {
    description: 'ISO date string (date only)',
    value: '2023-01-15',
    expected: true
  },
  {
    description: 'ISO date string (with time)',
    value: '2023-01-15T14:30:00',
    expected: true
  },
  {
    description: 'ISO date string (with time and timezone)',
    value: '2023-01-15T14:30:00Z',
    expected: true
  },
  {
    description: 'ISO date string (with time and specific timezone)',
    value: '2023-01-15T14:30:00-03:00',
    expected: true
  },
  
  // Formatted strings
  {
    description: 'Formatted date string (dd/MM/yyyy)',
    value: '15/01/2023',
    expected: true
  },
  {
    description: 'Formatted date string (MM/dd/yyyy)',
    value: '01/15/2023',
    expected: true
  },
  {
    description: 'Formatted date string (yyyy-MM-dd)',
    value: '2023-01-15',
    expected: true
  },
  
  // Edge cases (valid)
  {
    description: 'Leap year date (February 29)',
    value: new Date(2020, 1, 29), // February 29, 2020 (leap year)
    expected: true
  },
  {
    description: 'Leap year date as string',
    value: '2020-02-29',
    expected: true
  },
  {
    description: 'Date at year boundary',
    value: '2023-12-31T23:59:59.999Z',
    expected: true
  },
  {
    description: 'Date with milliseconds',
    value: '2023-01-15T14:30:00.123Z',
    expected: true
  },
  {
    description: 'Date with timezone at UTC boundary',
    value: '2023-01-01T00:00:00+14:00', // Earliest timezone
    expected: true
  },
  {
    description: 'Very old date (still valid)',
    value: new Date(1900, 0, 1), // January 1, 1900
    expected: true
  },
  {
    description: 'Future date',
    value: new Date(2100, 0, 1), // January 1, 2100
    expected: true
  }
];

/**
 * Invalid date fixtures
 * 
 * These fixtures represent various invalid date formats and should all
 * fail validation when using the isValidDate function.
 */
export const invalidDateFixtures: DateValidationFixture[] = [
  // Invalid Date objects
  {
    description: 'Invalid Date object',
    value: new Date('invalid date'),
    expected: false
  },
  
  // Invalid strings
  {
    description: 'Invalid date string',
    value: 'not a date',
    expected: false
  },
  {
    description: 'Partial date string',
    value: '2023-01',
    expected: false
  },
  {
    description: 'Malformed ISO date',
    value: '2023-13-32',
    expected: false
  },
  {
    description: 'Malformed formatted date',
    value: '32/13/2023',
    expected: false
  },
  {
    description: 'Empty string',
    value: '',
    expected: false
  },
  
  // Invalid numbers
  {
    description: 'Negative timestamp',
    value: -8640000000000001, // One millisecond before minimum date
    expected: false
  },
  {
    description: 'Extremely large timestamp',
    value: 8640000000000001, // One millisecond after maximum date
    expected: false
  },
  
  // Null and undefined
  {
    description: 'Null value',
    value: null,
    expected: false
  },
  {
    description: 'Undefined value',
    value: undefined,
    expected: false
  },
  
  // Non-date types
  {
    description: 'Boolean value',
    value: true,
    expected: false
  },
  {
    description: 'Object value',
    value: { year: 2023, month: 1, day: 15 },
    expected: false
  },
  {
    description: 'Array value',
    value: [2023, 1, 15],
    expected: false
  },
  {
    description: 'Function value',
    value: () => new Date(),
    expected: false
  },
  
  // Edge cases (invalid)
  {
    description: 'Non-leap year February 29',
    value: '2023-02-29',
    expected: false
  },
  {
    description: 'Invalid day of month',
    value: '2023-04-31', // April has 30 days
    expected: false
  },
  {
    description: 'Invalid month',
    value: '2023-13-01',
    expected: false
  },
  {
    description: 'Invalid time component',
    value: '2023-01-15T25:70:80',
    expected: false
  },
  {
    description: 'Invalid timezone offset',
    value: '2023-01-15T12:00:00+25:00', // Max is +/-14:00
    expected: false
  }
];

/**
 * Combined fixtures for date validation
 * 
 * Combines both valid and invalid fixtures for comprehensive testing.
 */
export const allDateValidationFixtures: DateValidationFixture[] = [
  ...validDateFixtures,
  ...invalidDateFixtures
];

/**
 * Timezone edge case fixtures
 * 
 * These fixtures specifically test date validation across timezone boundaries.
 */
export const timezoneEdgeCaseFixtures: DateValidationFixture[] = [
  {
    description: 'Date at UTC midnight',
    value: '2023-01-01T00:00:00Z',
    expected: true
  },
  {
    description: 'Date at positive timezone boundary',
    value: '2023-01-01T00:00:00+14:00', // Kiribati (UTC+14)
    expected: true
  },
  {
    description: 'Date at negative timezone boundary',
    value: '2023-01-01T00:00:00-12:00', // Baker Island (UTC-12)
    expected: true
  },
  {
    description: 'Date with timezone causing day change',
    value: '2023-01-01T01:00:00+02:00', // Still 2022-12-31 in some timezones
    expected: true
  },
  {
    description: 'Date with fractional timezone',
    value: '2023-01-01T00:00:00+05:30', // India (UTC+5:30)
    expected: true
  },
  {
    description: 'Date with invalid timezone',
    value: '2023-01-01T00:00:00+15:00', // Invalid timezone
    expected: false
  }
];

/**
 * Journey-specific date fixtures
 * 
 * These fixtures represent date formats commonly used in different journeys.
 */
export const journeyDateFixtures: Record<string, DateValidationFixture[]> = {
  health: [
    {
      description: 'Health metric timestamp',
      value: '2023-01-15T14:30:00.000Z',
      expected: true
    },
    {
      description: 'Health goal date',
      value: '2023-01-15',
      expected: true
    },
    {
      description: 'Health device sync time',
      value: '15/01/2023 14:30',
      expected: true
    }
  ],
  care: [
    {
      description: 'Care appointment date',
      value: 'Mon, 15 Jan 2023',
      expected: true
    },
    {
      description: 'Care medication schedule',
      value: '2023-01-15T08:00:00',
      expected: true
    },
    {
      description: 'Care telemedicine session',
      value: '15/01/2023 14:30',
      expected: true
    }
  ],
  plan: [
    {
      description: 'Plan claim submission date',
      value: '15/01/2023',
      expected: true
    },
    {
      description: 'Plan coverage period',
      value: '2023-01-01 to 2023-12-31',
      expected: false // This is not a valid date format for isValidDate
    },
    {
      description: 'Plan document date',
      value: '2023-01-15',
      expected: true
    }
  ]
};

/**
 * Performance testing fixtures
 * 
 * Large array of dates for performance testing of date validation functions.
 */
export const generatePerformanceTestFixtures = (count: number = 1000): DateValidationFixture[] => {
  const fixtures: DateValidationFixture[] = [];
  const baseDate = new Date(2023, 0, 1);
  
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    fixtures.push({
      description: `Performance test date ${i}`,
      value: date,
      expected: true
    });
  }
  
  return fixtures;
};
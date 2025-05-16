/**
 * Test fixtures for date range functions
 * 
 * This file contains test fixtures for date range functions (getDateRange, getDatesBetween, isDateInRange)
 * including predefined range types with their expected start and end dates, reference dates for
 * relative ranges, and dates for testing range inclusion functions.
 */

// Fixed reference date for deterministic tests (2023-06-15T12:00:00Z)
// This is a Thursday in the middle of June 2023
export const REFERENCE_DATE = new Date('2023-06-15T12:00:00Z');

// Fixed dates for testing date ranges
export const FIXED_DATES = {
  // Reference date components
  YEAR_2023: new Date('2023-01-01T00:00:00Z'),
  MONTH_JUNE_2023: new Date('2023-06-01T00:00:00Z'),
  WEEK_JUNE_11_2023: new Date('2023-06-11T00:00:00Z'), // Sunday of the reference week
  DAY_JUNE_15_2023: new Date('2023-06-15T00:00:00Z'),
  
  // Adjacent dates
  YESTERDAY: new Date('2023-06-14T00:00:00Z'),
  TOMORROW: new Date('2023-06-16T00:00:00Z'),
  LAST_WEEK: new Date('2023-06-08T00:00:00Z'),
  NEXT_WEEK: new Date('2023-06-22T00:00:00Z'),
  LAST_MONTH: new Date('2023-05-15T00:00:00Z'),
  NEXT_MONTH: new Date('2023-07-15T00:00:00Z'),
  LAST_YEAR: new Date('2022-06-15T00:00:00Z'),
  NEXT_YEAR: new Date('2024-06-15T00:00:00Z'),
  
  // Edge cases
  MONTH_START: new Date('2023-06-01T00:00:00Z'),
  MONTH_END: new Date('2023-06-30T23:59:59Z'),
  YEAR_START: new Date('2023-01-01T00:00:00Z'),
  YEAR_END: new Date('2023-12-31T23:59:59Z'),
};

// Expected date ranges for each range type based on the reference date
export const DATE_RANGES = {
  today: {
    rangeType: 'today',
    startDate: new Date('2023-06-15T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z'),
    description: 'Today (June 15, 2023)'
  },
  yesterday: {
    rangeType: 'yesterday',
    startDate: new Date('2023-06-14T00:00:00Z'),
    endDate: new Date('2023-06-14T23:59:59.999Z'),
    description: 'Yesterday (June 14, 2023)'
  },
  thisWeek: {
    rangeType: 'thisWeek',
    startDate: new Date('2023-06-11T00:00:00Z'), // Sunday
    endDate: new Date('2023-06-17T23:59:59.999Z'), // Saturday
    description: 'This week (June 11-17, 2023)'
  },
  lastWeek: {
    rangeType: 'lastWeek',
    startDate: new Date('2023-06-04T00:00:00Z'), // Sunday
    endDate: new Date('2023-06-10T23:59:59.999Z'), // Saturday
    description: 'Last week (June 4-10, 2023)'
  },
  thisMonth: {
    rangeType: 'thisMonth',
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z'),
    description: 'This month (June 2023)'
  },
  lastMonth: {
    rangeType: 'lastMonth',
    startDate: new Date('2023-05-01T00:00:00Z'),
    endDate: new Date('2023-05-31T23:59:59.999Z'),
    description: 'Last month (May 2023)'
  },
  thisYear: {
    rangeType: 'thisYear',
    startDate: new Date('2023-01-01T00:00:00Z'),
    endDate: new Date('2023-12-31T23:59:59.999Z'),
    description: 'This year (2023)'
  },
  lastYear: {
    rangeType: 'lastYear',
    startDate: new Date('2022-01-01T00:00:00Z'),
    endDate: new Date('2022-12-31T23:59:59.999Z'),
    description: 'Last year (2022)'
  },
  last7Days: {
    rangeType: 'last7Days',
    startDate: new Date('2023-06-09T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z'),
    description: 'Last 7 days (June 9-15, 2023)'
  },
  last30Days: {
    rangeType: 'last30Days',
    startDate: new Date('2023-05-17T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z'),
    description: 'Last 30 days (May 17 - June 15, 2023)'
  },
  last90Days: {
    rangeType: 'last90Days',
    startDate: new Date('2023-03-18T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z'),
    description: 'Last 90 days (March 18 - June 15, 2023)'
  },
  last365Days: {
    rangeType: 'last365Days',
    startDate: new Date('2022-06-16T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z'),
    description: 'Last 365 days (June 16, 2022 - June 15, 2023)'
  }
};

// List of all supported range types
export const RANGE_TYPES = Object.keys(DATE_RANGES);

// Test cases for date range inclusion
export const DATE_RANGE_INCLUSION_TESTS = [
  {
    description: 'Date is exactly the start date of range',
    date: new Date('2023-06-01T00:00:00Z'),
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z'),
    expected: true
  },
  {
    description: 'Date is exactly the end date of range',
    date: new Date('2023-06-30T23:59:59.999Z'),
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z'),
    expected: true
  },
  {
    description: 'Date is within the range',
    date: new Date('2023-06-15T12:00:00Z'),
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z'),
    expected: true
  },
  {
    description: 'Date is before the range',
    date: new Date('2023-05-31T23:59:59.999Z'),
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z'),
    expected: false
  },
  {
    description: 'Date is after the range',
    date: new Date('2023-07-01T00:00:00Z'),
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z'),
    expected: false
  },
  {
    description: 'Same day range inclusion',
    date: new Date('2023-06-15T12:00:00Z'),
    startDate: new Date('2023-06-15T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z'),
    expected: true
  },
  {
    description: 'Date with different time but same day as range start',
    date: new Date('2023-06-01T12:30:45Z'),
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z'),
    expected: true
  }
];

// Test cases for getDatesBetween function
export const DATES_BETWEEN_TESTS = [
  {
    description: 'Single day range (same day)',
    startDate: new Date('2023-06-15T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z'),
    expectedCount: 1,
    expectedFirstDate: new Date('2023-06-15T00:00:00Z'),
    expectedLastDate: new Date('2023-06-15T00:00:00Z')
  },
  {
    description: 'Two day range',
    startDate: new Date('2023-06-15T00:00:00Z'),
    endDate: new Date('2023-06-16T23:59:59.999Z'),
    expectedCount: 2,
    expectedFirstDate: new Date('2023-06-15T00:00:00Z'),
    expectedLastDate: new Date('2023-06-16T00:00:00Z')
  },
  {
    description: 'Week range',
    startDate: new Date('2023-06-11T00:00:00Z'),
    endDate: new Date('2023-06-17T23:59:59.999Z'),
    expectedCount: 7,
    expectedFirstDate: new Date('2023-06-11T00:00:00Z'),
    expectedLastDate: new Date('2023-06-17T00:00:00Z')
  },
  {
    description: 'Month range (June 2023)',
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z'),
    expectedCount: 30,
    expectedFirstDate: new Date('2023-06-01T00:00:00Z'),
    expectedLastDate: new Date('2023-06-30T00:00:00Z')
  }
];

// Journey-specific date fixtures
export const JOURNEY_DATE_FIXTURES = {
  health: {
    journeyId: 'health',
    referenceDate: new Date('2023-06-15T08:30:00Z'),
    expectedFormat: '15/06/2023 08:30', // Health journey uses detailed format with time
    ranges: {
      today: DATE_RANGES.today,
      thisWeek: DATE_RANGES.thisWeek,
      thisMonth: DATE_RANGES.thisMonth,
      last30Days: DATE_RANGES.last30Days
    }
  },
  care: {
    journeyId: 'care',
    referenceDate: new Date('2023-06-15T09:00:00Z'),
    expectedFormat: 'Thu, 15 Jun 2023', // Care journey uses appointment-friendly format
    ranges: {
      today: DATE_RANGES.today,
      thisWeek: DATE_RANGES.thisWeek,
      next7Days: {
        rangeType: 'next7Days',
        startDate: new Date('2023-06-15T00:00:00Z'),
        endDate: new Date('2023-06-21T23:59:59.999Z'),
        description: 'Next 7 days (June 15-21, 2023)'
      }
    }
  },
  plan: {
    journeyId: 'plan',
    referenceDate: new Date('2023-06-15T10:15:00Z'),
    expectedFormat: '15/06/2023', // Plan journey uses formal date format
    ranges: {
      thisMonth: DATE_RANGES.thisMonth,
      thisYear: DATE_RANGES.thisYear,
      last90Days: DATE_RANGES.last90Days
    }
  }
};

// Locale-specific date fixtures
export const LOCALE_DATE_FIXTURES = {
  'pt-BR': {
    locale: 'pt-BR',
    referenceDate: REFERENCE_DATE,
    expectedFormat: '15/06/2023',
    expectedTimeAgo: '0 segundos atrás',
    expectedRelativeDate: 'Hoje'
  },
  'en-US': {
    locale: 'en-US',
    referenceDate: REFERENCE_DATE,
    expectedFormat: '06/15/2023',
    expectedTimeAgo: '0 seconds ago',
    expectedRelativeDate: 'Today'
  }
};
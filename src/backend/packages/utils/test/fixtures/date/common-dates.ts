/**
 * Common date fixtures used across multiple test files
 * This file provides a single source of truth for commonly used date test values
 */

/**
 * Interface for common date fixtures
 */
export interface CommonDateFixture {
  date: Date;
  isoString: string;
  timestamp: number;
  description: string;
}

/**
 * Standard reference dates for testing
 * These dates are used across multiple test files for consistency
 */
export const referenceFixtures: CommonDateFixture[] = [
  {
    description: 'Standard reference date (mid-month)',
    date: new Date(2023, 5, 15, 12, 30, 0), // June 15, 2023, 12:30:00
    isoString: '2023-06-15T12:30:00.000Z',
    timestamp: new Date(2023, 5, 15, 12, 30, 0).getTime()
  },
  {
    description: 'Month start reference date',
    date: new Date(2023, 5, 1, 0, 0, 0), // June 1, 2023, 00:00:00
    isoString: '2023-06-01T00:00:00.000Z',
    timestamp: new Date(2023, 5, 1, 0, 0, 0).getTime()
  },
  {
    description: 'Month end reference date',
    date: new Date(2023, 5, 30, 23, 59, 59), // June 30, 2023, 23:59:59
    isoString: '2023-06-30T23:59:59.000Z',
    timestamp: new Date(2023, 5, 30, 23, 59, 59).getTime()
  },
  {
    description: 'Year start reference date',
    date: new Date(2023, 0, 1, 0, 0, 0), // January 1, 2023, 00:00:00
    isoString: '2023-01-01T00:00:00.000Z',
    timestamp: new Date(2023, 0, 1, 0, 0, 0).getTime()
  },
  {
    description: 'Year end reference date',
    date: new Date(2023, 11, 31, 23, 59, 59), // December 31, 2023, 23:59:59
    isoString: '2023-12-31T23:59:59.000Z',
    timestamp: new Date(2023, 11, 31, 23, 59, 59).getTime()
  },
  {
    description: 'Leap year date',
    date: new Date(2024, 1, 29, 12, 0, 0), // February 29, 2024, 12:00:00
    isoString: '2024-02-29T12:00:00.000Z',
    timestamp: new Date(2024, 1, 29, 12, 0, 0).getTime()
  }
];

/**
 * Locale-specific date fixtures
 * These fixtures are used for testing locale-specific formatting
 */
export const localeFixtures = {
  'pt-BR': [
    {
      description: 'Brazilian holiday (Independence Day)',
      date: new Date(2023, 8, 7, 12, 0, 0), // September 7, 2023, 12:00:00
      isoString: '2023-09-07T12:00:00.000Z',
      timestamp: new Date(2023, 8, 7, 12, 0, 0).getTime()
    },
    {
      description: 'Brazilian holiday (New Year)',
      date: new Date(2023, 0, 1, 0, 0, 0), // January 1, 2023, 00:00:00
      isoString: '2023-01-01T00:00:00.000Z',
      timestamp: new Date(2023, 0, 1, 0, 0, 0).getTime()
    },
    {
      description: 'Brazilian holiday (Carnival)',
      date: new Date(2023, 1, 21, 12, 0, 0), // February 21, 2023, 12:00:00
      isoString: '2023-02-21T12:00:00.000Z',
      timestamp: new Date(2023, 1, 21, 12, 0, 0).getTime()
    }
  ],
  'en-US': [
    {
      description: 'US holiday (Independence Day)',
      date: new Date(2023, 6, 4, 12, 0, 0), // July 4, 2023, 12:00:00
      isoString: '2023-07-04T12:00:00.000Z',
      timestamp: new Date(2023, 6, 4, 12, 0, 0).getTime()
    },
    {
      description: 'US holiday (Thanksgiving)',
      date: new Date(2023, 10, 23, 12, 0, 0), // November 23, 2023, 12:00:00
      isoString: '2023-11-23T12:00:00.000Z',
      timestamp: new Date(2023, 10, 23, 12, 0, 0).getTime()
    },
    {
      description: 'US date format example (month first)',
      date: new Date(2023, 3, 15, 12, 0, 0), // April 15, 2023, 12:00:00
      isoString: '2023-04-15T12:00:00.000Z',
      timestamp: new Date(2023, 3, 15, 12, 0, 0).getTime()
    }
  ]
};

/**
 * Timezone-aware date fixtures
 * These fixtures include timezone information for testing timezone-related functions
 */
export const timezoneAwareFixtures = [
  {
    description: 'Brazil timezone (BRT)',
    date: new Date('2023-06-15T12:00:00-03:00'),
    isoString: '2023-06-15T15:00:00.000Z', // Converted to UTC
    timestamp: new Date('2023-06-15T12:00:00-03:00').getTime(),
    timezone: '-03:00'
  },
  {
    description: 'US Eastern timezone (EDT)',
    date: new Date('2023-06-15T12:00:00-04:00'),
    isoString: '2023-06-15T16:00:00.000Z', // Converted to UTC
    timestamp: new Date('2023-06-15T12:00:00-04:00').getTime(),
    timezone: '-04:00'
  },
  {
    description: 'UTC/GMT timezone',
    date: new Date('2023-06-15T12:00:00Z'),
    isoString: '2023-06-15T12:00:00.000Z',
    timestamp: new Date('2023-06-15T12:00:00Z').getTime(),
    timezone: '+00:00'
  },
  {
    description: 'India timezone (IST)',
    date: new Date('2023-06-15T12:00:00+05:30'),
    isoString: '2023-06-15T06:30:00.000Z', // Converted to UTC
    timestamp: new Date('2023-06-15T12:00:00+05:30').getTime(),
    timezone: '+05:30'
  }
];

/**
 * Journey-specific date fixtures
 * These fixtures are used for testing journey-specific date handling
 */
export const journeyDateFixtures = {
  health: {
    description: 'Health journey reference date',
    date: new Date(2023, 5, 15, 9, 30, 0), // June 15, 2023, 09:30:00
    isoString: '2023-06-15T09:30:00.000Z',
    timestamp: new Date(2023, 5, 15, 9, 30, 0).getTime()
  },
  care: {
    description: 'Care journey reference date',
    date: new Date(2023, 5, 20, 14, 0, 0), // June 20, 2023, 14:00:00
    isoString: '2023-06-20T14:00:00.000Z',
    timestamp: new Date(2023, 5, 20, 14, 0, 0).getTime()
  },
  plan: {
    description: 'Plan journey reference date',
    date: new Date(2023, 5, 25, 10, 0, 0), // June 25, 2023, 10:00:00
    isoString: '2023-06-25T10:00:00.000Z',
    timestamp: new Date(2023, 5, 25, 10, 0, 0).getTime()
  }
};

/**
 * Consolidated export of all common date fixtures
 */
export const commonDateFixtures = {
  reference: referenceFixtures,
  locale: localeFixtures,
  timezoneAware: timezoneAwareFixtures,
  journey: journeyDateFixtures
};

/**
 * Default export for simplified importing
 */
export default commonDateFixtures;
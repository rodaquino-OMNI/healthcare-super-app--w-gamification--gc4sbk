/**
 * Test fixtures for date comparison functions
 * Contains fixtures for isSameDay and isDateInRange functions
 */

import { commonDateFixtures } from './common-dates';

/**
 * Interface for same day comparison test fixtures
 */
export interface SameDayFixture {
  dateA: Date | string | number;
  dateB: Date | string | number;
  expected: boolean;
  description: string;
}

/**
 * Interface for date range test fixtures
 */
export interface DateRangeFixture {
  date: Date | string | number;
  startDate: Date | string | number;
  endDate: Date | string | number;
  expected: boolean;
  description: string;
}

/**
 * Fixtures for testing the isSameDay function
 * Includes various date formats and edge cases
 */
export const sameDayFixtures: SameDayFixture[] = [
  // Same day with different formats
  {
    description: 'Same day with Date objects',
    dateA: new Date(2023, 5, 15, 9, 30, 0),
    dateB: new Date(2023, 5, 15, 18, 45, 30),
    expected: true
  },
  {
    description: 'Same day with Date object and ISO string',
    dateA: new Date(2023, 5, 15, 9, 30, 0),
    dateB: '2023-06-15T18:45:30.000Z',
    expected: true
  },
  {
    description: 'Same day with Date object and timestamp',
    dateA: new Date(2023, 5, 15, 9, 30, 0),
    dateB: new Date(2023, 5, 15, 18, 45, 30).getTime(),
    expected: true
  },
  {
    description: 'Same day with ISO string and timestamp',
    dateA: '2023-06-15T09:30:00.000Z',
    dateB: new Date(2023, 5, 15, 18, 45, 30).getTime(),
    expected: true
  },
  {
    description: 'Same day with formatted strings',
    dateA: '15/06/2023',
    dateB: '15/06/2023',
    expected: true
  },
  
  // Different days
  {
    description: 'Different days with Date objects',
    dateA: new Date(2023, 5, 15, 9, 30, 0),
    dateB: new Date(2023, 5, 16, 9, 30, 0),
    expected: false
  },
  {
    description: 'Different days with Date object and ISO string',
    dateA: new Date(2023, 5, 15, 9, 30, 0),
    dateB: '2023-06-16T09:30:00.000Z',
    expected: false
  },
  {
    description: 'Different days with Date object and timestamp',
    dateA: new Date(2023, 5, 15, 9, 30, 0),
    dateB: new Date(2023, 5, 16, 9, 30, 0).getTime(),
    expected: false
  },
  
  // Edge cases
  {
    description: 'Midnight boundary case (end of day vs start of next day)',
    dateA: new Date(2023, 5, 15, 23, 59, 59, 999),
    dateB: new Date(2023, 5, 16, 0, 0, 0, 0),
    expected: false
  },
  {
    description: 'Same day in different months',
    dateA: new Date(2023, 5, 15),
    dateB: new Date(2023, 6, 15),
    expected: false
  },
  {
    description: 'Same day in different years',
    dateA: new Date(2023, 5, 15),
    dateB: new Date(2024, 5, 15),
    expected: false
  },
  
  // Timezone edge cases
  {
    description: 'Same UTC day but different local days due to timezone',
    dateA: new Date('2023-06-15T23:30:00Z'), // UTC
    dateB: new Date('2023-06-15T19:30:00-04:00'), // EDT (same UTC time)
    expected: true
  },
  {
    description: 'Different UTC days but could be same local day in some timezones',
    dateA: new Date('2023-06-15T23:30:00Z'), // UTC
    dateB: new Date('2023-06-16T00:30:00Z'), // UTC next day
    expected: false // Different UTC days
  },
  
  // Invalid dates
  {
    description: 'Invalid date in first parameter',
    dateA: 'not-a-date',
    dateB: new Date(2023, 5, 15),
    expected: false
  },
  {
    description: 'Invalid date in second parameter',
    dateA: new Date(2023, 5, 15),
    dateB: 'not-a-date',
    expected: false
  },
  {
    description: 'Both parameters invalid',
    dateA: 'not-a-date',
    dateB: 'also-not-a-date',
    expected: false
  },
  
  // Using common date fixtures
  {
    description: 'Using common reference dates (same day)',
    dateA: commonDateFixtures.reference[0].date,
    dateB: new Date(2023, 5, 15, 18, 45, 30), // Same day as reference[0]
    expected: true
  },
  {
    description: 'Using common reference dates (different days)',
    dateA: commonDateFixtures.reference[0].date,
    dateB: commonDateFixtures.reference[1].date,
    expected: false
  },
  
  // Leap year cases
  {
    description: 'Leap year date comparison (same day)',
    dateA: new Date(2024, 1, 29, 10, 0, 0), // Feb 29, 2024 10:00
    dateB: new Date(2024, 1, 29, 15, 30, 0), // Feb 29, 2024 15:30
    expected: true
  },
  {
    description: 'Leap year vs non-leap year (Feb 28)',
    dateA: new Date(2024, 1, 28), // Feb 28, 2024 (leap year)
    dateB: new Date(2023, 1, 28), // Feb 28, 2023 (non-leap year)
    expected: false // Different years
  }
];

/**
 * Fixtures for testing the isDateInRange function
 * Includes various date formats, edge cases, and boundary conditions
 */
export const dateRangeFixtures: DateRangeFixture[] = [
  // Date within range
  {
    description: 'Date within range (all Date objects)',
    date: new Date(2023, 5, 15),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  {
    description: 'Date within range (mixed formats)',
    date: '2023-06-15T12:00:00.000Z',
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  {
    description: 'Date within range (all timestamps)',
    date: new Date(2023, 5, 15).getTime(),
    startDate: new Date(2023, 5, 10).getTime(),
    endDate: new Date(2023, 5, 20).getTime(),
    expected: true
  },
  
  // Date at range boundaries
  {
    description: 'Date exactly at start boundary',
    date: new Date(2023, 5, 10),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  {
    description: 'Date exactly at end boundary',
    date: new Date(2023, 5, 20),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  
  // Date outside range
  {
    description: 'Date before range start',
    date: new Date(2023, 5, 5),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Date after range end',
    date: new Date(2023, 5, 25),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Date one day before range start',
    date: new Date(2023, 5, 9),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Date one day after range end',
    date: new Date(2023, 5, 21),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  
  // Time-specific edge cases
  {
    description: 'Date at start of day within range',
    date: new Date(2023, 5, 15, 0, 0, 0),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  {
    description: 'Date at end of day within range',
    date: new Date(2023, 5, 15, 23, 59, 59, 999),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  {
    description: 'Start date with time vs date without time',
    date: new Date(2023, 5, 10, 0, 0, 0),
    startDate: new Date(2023, 5, 10, 12, 0, 0), // Noon on start date
    endDate: new Date(2023, 5, 20),
    expected: true // Same day, different times, should be true
  },
  
  // Invalid dates
  {
    description: 'Invalid date parameter',
    date: 'not-a-date',
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Invalid start date parameter',
    date: new Date(2023, 5, 15),
    startDate: 'not-a-date',
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Invalid end date parameter',
    date: new Date(2023, 5, 15),
    startDate: new Date(2023, 5, 10),
    endDate: 'not-a-date',
    expected: false
  },
  
  // Using common date fixtures
  {
    description: 'Using common reference dates (within range)',
    date: commonDateFixtures.reference[0].date, // June 15, 2023
    startDate: commonDateFixtures.reference[1].date, // June 1, 2023
    endDate: commonDateFixtures.reference[2].date, // June 30, 2023
    expected: true
  },
  {
    description: 'Using common reference dates (outside range)',
    date: commonDateFixtures.reference[3].date, // January 1, 2023
    startDate: commonDateFixtures.reference[1].date, // June 1, 2023
    endDate: commonDateFixtures.reference[2].date, // June 30, 2023
    expected: false
  },
  
  // Special cases
  {
    description: 'Single day range (start and end are the same day)',
    date: new Date(2023, 5, 15),
    startDate: new Date(2023, 5, 15),
    endDate: new Date(2023, 5, 15),
    expected: true
  },
  {
    description: 'Date with time outside range time but same day',
    date: new Date(2023, 5, 15, 8, 0, 0), // 8 AM
    startDate: new Date(2023, 5, 15, 9, 0, 0), // 9 AM
    endDate: new Date(2023, 5, 15, 17, 0, 0), // 5 PM
    expected: true // Same day, different time, should be true
  },
  
  // Timezone edge cases
  {
    description: 'Timezone edge case - date strings with timezone info',
    date: '2023-06-15T12:00:00-03:00', // BRT
    startDate: '2023-06-15T00:00:00Z', // UTC
    endDate: '2023-06-16T00:00:00Z', // UTC
    expected: true
  },
  {
    description: 'Timezone edge case - different timezone representations',
    date: commonDateFixtures.timezoneAware[0].date, // Brazil timezone
    startDate: commonDateFixtures.timezoneAware[2].date, // UTC timezone
    endDate: new Date(commonDateFixtures.timezoneAware[2].date.getTime() + 86400000), // UTC + 1 day
    expected: true
  },
  
  // Journey-specific date ranges
  {
    description: 'Health journey date range',
    date: commonDateFixtures.journey.health.date,
    startDate: new Date(2023, 5, 1), // June 1
    endDate: new Date(2023, 5, 30), // June 30
    expected: true
  },
  {
    description: 'Care journey date range',
    date: commonDateFixtures.journey.care.date,
    startDate: new Date(2023, 5, 1), // June 1
    endDate: new Date(2023, 5, 30), // June 30
    expected: true
  },
  {
    description: 'Plan journey date range',
    date: commonDateFixtures.journey.plan.date,
    startDate: new Date(2023, 5, 1), // June 1
    endDate: new Date(2023, 5, 30), // June 30
    expected: true
  }
];

/**
 * Consolidated export of all comparison fixtures
 */
export const comparisonFixtures = {
  sameDay: sameDayFixtures,
  dateRange: dateRangeFixtures
};

/**
 * Default export for simplified importing
 */
export default comparisonFixtures;
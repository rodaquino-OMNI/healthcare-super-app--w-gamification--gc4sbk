/**
 * Test fixtures for date comparison functions
 * Contains test cases for isSameDay and isDateInRange functions
 */

/**
 * Interface for same day comparison test cases
 */
export interface SameDayTestCase {
  description: string;
  dateA: Date | string | number;
  dateB: Date | string | number;
  expected: boolean;
}

/**
 * Interface for date range test cases
 */
export interface DateRangeTestCase {
  description: string;
  date: Date | string | number;
  startDate: Date | string | number;
  endDate: Date | string | number;
  expected: boolean;
}

/**
 * Test fixtures for isSameDay function
 * Includes various date formats and edge cases
 */
export const sameDayTestCases: SameDayTestCase[] = [
  // Same day with different formats
  {
    description: 'Same day as Date objects',
    dateA: new Date(2023, 5, 15, 10, 30, 0),
    dateB: new Date(2023, 5, 15, 14, 45, 0),
    expected: true
  },
  {
    description: 'Same day as ISO strings',
    dateA: '2023-06-15T10:30:00Z',
    dateB: '2023-06-15T14:45:00Z',
    expected: true
  },
  {
    description: 'Same day as timestamps',
    dateA: new Date(2023, 5, 15, 10, 30, 0).getTime(),
    dateB: new Date(2023, 5, 15, 14, 45, 0).getTime(),
    expected: true
  },
  {
    description: 'Same day with one Date and one string',
    dateA: new Date(2023, 5, 15, 10, 30, 0),
    dateB: '2023-06-15T14:45:00Z',
    expected: true
  },
  {
    description: 'Same day with one Date and one timestamp',
    dateA: new Date(2023, 5, 15, 10, 30, 0),
    dateB: new Date(2023, 5, 15, 14, 45, 0).getTime(),
    expected: true
  },
  
  // Different days
  {
    description: 'Different days as Date objects',
    dateA: new Date(2023, 5, 15, 10, 30, 0),
    dateB: new Date(2023, 5, 16, 10, 30, 0),
    expected: false
  },
  {
    description: 'Different days as ISO strings',
    dateA: '2023-06-15T10:30:00Z',
    dateB: '2023-06-16T10:30:00Z',
    expected: false
  },
  {
    description: 'Different days as timestamps',
    dateA: new Date(2023, 5, 15, 10, 30, 0).getTime(),
    dateB: new Date(2023, 5, 16, 10, 30, 0).getTime(),
    expected: false
  },
  
  // Edge cases
  {
    description: 'Midnight boundary - just before midnight and just after midnight',
    dateA: new Date(2023, 5, 15, 23, 59, 59, 999),
    dateB: new Date(2023, 5, 16, 0, 0, 0, 0),
    expected: false
  },
  {
    description: 'Same day in different timezones (UTC vs UTC+2)',
    dateA: '2023-06-15T22:30:00Z', // UTC
    dateB: '2023-06-16T00:30:00+02:00', // UTC+2, same actual time
    expected: true
  },
  {
    description: 'Different days in different timezones',
    dateA: '2023-06-15T22:30:00Z', // UTC
    dateB: '2023-06-16T01:30:00+02:00', // UTC+2, different day
    expected: false
  },
  
  // Invalid date scenarios
  {
    description: 'First date is invalid',
    dateA: 'not-a-date',
    dateB: new Date(2023, 5, 15),
    expected: false
  },
  {
    description: 'Second date is invalid',
    dateA: new Date(2023, 5, 15),
    dateB: 'not-a-date',
    expected: false
  },
  {
    description: 'Both dates are invalid',
    dateA: 'not-a-date',
    dateB: 'also-not-a-date',
    expected: false
  },
  
  // Additional edge cases
  {
    description: 'Daylight Saving Time transition day (spring forward)',
    dateA: new Date(2023, 2, 26, 1, 30, 0), // Before DST change
    dateB: new Date(2023, 2, 26, 3, 30, 0), // After DST change
    expected: true
  },
  {
    description: 'Leap year day comparison',
    dateA: new Date(2024, 1, 29, 10, 30, 0), // Feb 29, 2024 (leap year)
    dateB: new Date(2024, 1, 29, 14, 45, 0),
    expected: true
  }
];

/**
 * Test fixtures for isDateInRange function
 * Includes various date formats, edge cases, and boundary conditions
 */
export const dateRangeTestCases: DateRangeTestCase[] = [
  // Date within range
  {
    description: 'Date within range (all Date objects)',
    date: new Date(2023, 5, 15),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  {
    description: 'Date within range (all ISO strings)',
    date: '2023-06-15T12:00:00Z',
    startDate: '2023-06-10T12:00:00Z',
    endDate: '2023-06-20T12:00:00Z',
    expected: true
  },
  {
    description: 'Date within range (all timestamps)',
    date: new Date(2023, 5, 15).getTime(),
    startDate: new Date(2023, 5, 10).getTime(),
    endDate: new Date(2023, 5, 20).getTime(),
    expected: true
  },
  {
    description: 'Date within range (mixed formats)',
    date: '2023-06-15T12:00:00Z',
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20).getTime(),
    expected: true
  },
  
  // Boundary conditions
  {
    description: 'Date exactly on start date',
    date: new Date(2023, 5, 10),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  {
    description: 'Date exactly on end date',
    date: new Date(2023, 5, 20),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  {
    description: 'Date exactly on start date with different times',
    date: new Date(2023, 5, 10, 23, 59, 59),
    startDate: new Date(2023, 5, 10, 0, 0, 0),
    endDate: new Date(2023, 5, 20),
    expected: true
  },
  {
    description: 'Date exactly on end date with different times',
    date: new Date(2023, 5, 20, 0, 0, 0),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20, 23, 59, 59),
    expected: true
  },
  
  // Outside range
  {
    description: 'Date before range',
    date: new Date(2023, 5, 5),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Date after range',
    date: new Date(2023, 5, 25),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Date just before start date',
    date: new Date(2023, 5, 9, 23, 59, 59),
    startDate: new Date(2023, 5, 10, 0, 0, 0),
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Date just after end date',
    date: new Date(2023, 5, 21, 0, 0, 0),
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20, 23, 59, 59),
    expected: false
  },
  
  // Edge cases
  {
    description: 'One-day range (start and end are the same day)',
    date: new Date(2023, 5, 15),
    startDate: new Date(2023, 5, 15),
    endDate: new Date(2023, 5, 15),
    expected: true
  },
  {
    description: 'One-day range with date being the same day but different time',
    date: new Date(2023, 5, 15, 14, 30, 0),
    startDate: new Date(2023, 5, 15, 0, 0, 0),
    endDate: new Date(2023, 5, 15, 23, 59, 59),
    expected: true
  },
  {
    description: 'Large date range spanning multiple years',
    date: new Date(2024, 5, 15),
    startDate: new Date(2023, 0, 1),
    endDate: new Date(2025, 11, 31),
    expected: true
  },
  {
    description: 'Date range with timezone considerations',
    date: '2023-06-15T22:30:00Z', // UTC
    startDate: '2023-06-10T00:00:00+02:00', // UTC+2
    endDate: '2023-06-20T00:00:00-05:00', // UTC-5
    expected: true
  },
  
  // Invalid date scenarios
  {
    description: 'Invalid date',
    date: 'not-a-date',
    startDate: new Date(2023, 5, 10),
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Invalid start date',
    date: new Date(2023, 5, 15),
    startDate: 'not-a-date',
    endDate: new Date(2023, 5, 20),
    expected: false
  },
  {
    description: 'Invalid end date',
    date: new Date(2023, 5, 15),
    startDate: new Date(2023, 5, 10),
    endDate: 'not-a-date',
    expected: false
  },
  
  // Additional edge cases
  {
    description: 'Date range spanning DST transition',
    date: new Date(2023, 2, 26, 2, 30, 0), // During DST change
    startDate: new Date(2023, 2, 25),
    endDate: new Date(2023, 2, 27),
    expected: true
  },
  {
    description: 'Date range including leap year day',
    date: new Date(2024, 1, 29), // Feb 29, 2024 (leap year)
    startDate: new Date(2024, 1, 28),
    endDate: new Date(2024, 2, 1),
    expected: true
  }
];
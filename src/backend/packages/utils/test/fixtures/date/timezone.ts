/**
 * Test fixtures for timezone utilities
 * These fixtures ensure consistent timezone handling across the application,
 * critical for a healthcare platform serving users in different regions.
 */

/**
 * Interface for timezone test fixtures
 */
export interface TimezoneFixture {
  date: Date;
  expectedFormat: string;
  description: string;
}

/**
 * Interface for timezone offset test fixtures
 */
export interface TimezoneOffsetFixture {
  date: Date;
  offsetMinutes: number;
  expectedFormat: string;
  description: string;
}

/**
 * Standard timezone fixtures with known offsets
 * These fixtures provide predictable timezone strings for testing
 */
export const standardTimezoneFixtures: TimezoneOffsetFixture[] = [
  {
    description: 'UTC+0 (Greenwich Mean Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: 0,
    expectedFormat: '+00:00'
  },
  {
    description: 'UTC+1 (Central European Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: 60,
    expectedFormat: '+01:00'
  },
  {
    description: 'UTC-5 (Eastern Standard Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: -300,
    expectedFormat: '-05:00'
  },
  {
    description: 'UTC+5:30 (Indian Standard Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: 330,
    expectedFormat: '+05:30'
  },
  {
    description: 'UTC+9 (Japan Standard Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: 540,
    expectedFormat: '+09:00'
  },
  {
    description: 'UTC-3 (Brasília Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: -180,
    expectedFormat: '-03:00'
  },
  {
    description: 'UTC+12 (New Zealand Standard Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: 720,
    expectedFormat: '+12:00'
  },
  {
    description: 'UTC-12 (Baker Island Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: -720,
    expectedFormat: '-12:00'
  },
  {
    description: 'UTC+13 (Samoa Standard Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: 780,
    expectedFormat: '+13:00'
  },
  {
    description: 'UTC+5:45 (Nepal Time)',
    date: new Date('2023-06-15T12:00:00Z'),
    offsetMinutes: 345,
    expectedFormat: '+05:45'
  }
];

/**
 * DST transition fixtures for testing timezone handling during shifts
 * These fixtures test the behavior of timezone functions during Daylight Saving Time transitions
 */
export const dstTransitionFixtures: TimezoneFixture[] = [
  // Brazil DST transitions (when applicable)
  {
    description: 'Brazil - Before DST start (when applicable)',
    date: new Date('2023-10-14T23:59:59-03:00'),
    expectedFormat: '-03:00'
  },
  {
    description: 'Brazil - After DST start (when applicable)',
    date: new Date('2023-10-15T00:00:01-02:00'),
    expectedFormat: '-02:00'
  },
  {
    description: 'Brazil - Before DST end (when applicable)',
    date: new Date('2024-02-17T23:59:59-02:00'),
    expectedFormat: '-02:00'
  },
  {
    description: 'Brazil - After DST end (when applicable)',
    date: new Date('2024-02-18T00:00:01-03:00'),
    expectedFormat: '-03:00'
  },
  
  // US DST transitions
  {
    description: 'US - Before DST start',
    date: new Date('2023-03-12T01:59:59-05:00'),
    expectedFormat: '-05:00'
  },
  {
    description: 'US - After DST start',
    date: new Date('2023-03-12T03:00:01-04:00'),
    expectedFormat: '-04:00'
  },
  {
    description: 'US - Before DST end',
    date: new Date('2023-11-05T01:59:59-04:00'),
    expectedFormat: '-04:00'
  },
  {
    description: 'US - After DST end',
    date: new Date('2023-11-05T01:00:01-05:00'),
    expectedFormat: '-05:00'
  },
  
  // European DST transitions
  {
    description: 'Europe - Before DST start',
    date: new Date('2023-03-26T01:59:59+01:00'),
    expectedFormat: '+01:00'
  },
  {
    description: 'Europe - After DST start',
    date: new Date('2023-03-26T03:00:01+02:00'),
    expectedFormat: '+02:00'
  },
  {
    description: 'Europe - Before DST end',
    date: new Date('2023-10-29T02:59:59+02:00'),
    expectedFormat: '+02:00'
  },
  {
    description: 'Europe - After DST end',
    date: new Date('2023-10-29T02:00:01+01:00'),
    expectedFormat: '+01:00'
  }
];

/**
 * Global timezone fixtures for testing international scenarios
 * These fixtures represent major global timezones for comprehensive testing
 */
export const globalTimezoneFixtures: TimezoneFixture[] = [
  // Americas
  {
    description: 'São Paulo, Brazil (BRT)',
    date: new Date('2023-06-15T12:00:00-03:00'),
    expectedFormat: '-03:00'
  },
  {
    description: 'New York, USA (EST/EDT)',
    date: new Date('2023-06-15T12:00:00-04:00'), // EDT (summer time)
    expectedFormat: '-04:00'
  },
  {
    description: 'Los Angeles, USA (PST/PDT)',
    date: new Date('2023-06-15T12:00:00-07:00'), // PDT (summer time)
    expectedFormat: '-07:00'
  },
  {
    description: 'Mexico City, Mexico (CST/CDT)',
    date: new Date('2023-06-15T12:00:00-05:00'), // CDT (summer time)
    expectedFormat: '-05:00'
  },
  
  // Europe
  {
    description: 'London, UK (GMT/BST)',
    date: new Date('2023-06-15T12:00:00+01:00'), // BST (summer time)
    expectedFormat: '+01:00'
  },
  {
    description: 'Paris, France (CET/CEST)',
    date: new Date('2023-06-15T12:00:00+02:00'), // CEST (summer time)
    expectedFormat: '+02:00'
  },
  {
    description: 'Moscow, Russia (MSK)',
    date: new Date('2023-06-15T12:00:00+03:00'),
    expectedFormat: '+03:00'
  },
  
  // Asia
  {
    description: 'Dubai, UAE (GST)',
    date: new Date('2023-06-15T12:00:00+04:00'),
    expectedFormat: '+04:00'
  },
  {
    description: 'Mumbai, India (IST)',
    date: new Date('2023-06-15T12:00:00+05:30'),
    expectedFormat: '+05:30'
  },
  {
    description: 'Singapore (SGT)',
    date: new Date('2023-06-15T12:00:00+08:00'),
    expectedFormat: '+08:00'
  },
  {
    description: 'Tokyo, Japan (JST)',
    date: new Date('2023-06-15T12:00:00+09:00'),
    expectedFormat: '+09:00'
  },
  
  // Oceania
  {
    description: 'Sydney, Australia (AEST/AEDT)',
    date: new Date('2023-06-15T12:00:00+10:00'), // AEST (winter time in June)
    expectedFormat: '+10:00'
  },
  {
    description: 'Auckland, New Zealand (NZST/NZDT)',
    date: new Date('2023-06-15T12:00:00+12:00'), // NZST (winter time in June)
    expectedFormat: '+12:00'
  }
];

/**
 * Edge case timezone fixtures for testing unusual scenarios
 */
export const edgeCaseTimezoneFixtures: TimezoneFixture[] = [
  {
    description: 'International Date Line West',
    date: new Date('2023-06-15T12:00:00-12:00'),
    expectedFormat: '-12:00'
  },
  {
    description: 'International Date Line East',
    date: new Date('2023-06-15T12:00:00+14:00'),
    expectedFormat: '+14:00'
  },
  {
    description: 'Chatham Islands, New Zealand (CHAST)',
    date: new Date('2023-06-15T12:00:00+12:45'),
    expectedFormat: '+12:45'
  },
  {
    description: 'Nepal (NPT)',
    date: new Date('2023-06-15T12:00:00+05:45'),
    expectedFormat: '+05:45'
  },
  {
    description: 'Cocos Islands (CCT)',
    date: new Date('2023-06-15T12:00:00+06:30'),
    expectedFormat: '+06:30'
  },
  {
    description: 'Marquesas Islands (MART)',
    date: new Date('2023-06-15T12:00:00-09:30'),
    expectedFormat: '-09:30'
  }
];

/**
 * Timezone format validation fixtures
 * These fixtures test the format of timezone strings returned by getLocalTimezone
 */
export const timezoneFormatValidationFixtures: {
  format: string;
  isValid: boolean;
  description: string;
}[] = [
  {
    description: 'Valid format with positive offset',
    format: '+05:30',
    isValid: true
  },
  {
    description: 'Valid format with negative offset',
    format: '-07:00',
    isValid: true
  },
  {
    description: 'Valid format with zero offset',
    format: '+00:00',
    isValid: true
  },
  {
    description: 'Invalid format - missing plus/minus sign',
    format: '05:30',
    isValid: false
  },
  {
    description: 'Invalid format - missing colon',
    format: '+0530',
    isValid: false
  },
  {
    description: 'Invalid format - incorrect hour padding',
    format: '+5:30',
    isValid: false
  },
  {
    description: 'Invalid format - incorrect minute padding',
    format: '+05:3',
    isValid: false
  },
  {
    description: 'Invalid format - out of range hours',
    format: '+25:00',
    isValid: false
  },
  {
    description: 'Invalid format - out of range minutes',
    format: '+05:75',
    isValid: false
  }
];

/**
 * Helper function to mock timezone offset for testing
 * This function can be used to simulate different timezone offsets in tests
 * 
 * @param offsetMinutes - The timezone offset in minutes
 * @returns A mocked Date object with the specified timezone offset
 */
export const createDateWithOffset = (offsetMinutes: number): Date => {
  const date = new Date();
  
  // Store the original getTimezoneOffset method
  const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
  
  // Mock the getTimezoneOffset method to return our desired offset
  Date.prototype.getTimezoneOffset = function() {
    return -offsetMinutes; // Note: getTimezoneOffset returns the opposite sign of the timezone
  };
  
  // Create a new date with our mocked timezone offset
  const mockedDate = new Date(date);
  
  // Restore the original method to avoid affecting other tests
  Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
  
  return mockedDate;
};

/**
 * Comprehensive test fixtures for the getLocalTimezone function
 */
export const getLocalTimezoneFixtures = {
  standardTimezoneFixtures,
  dstTransitionFixtures,
  globalTimezoneFixtures,
  edgeCaseTimezoneFixtures,
  timezoneFormatValidationFixtures,
  createDateWithOffset
};
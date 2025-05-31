/**
 * Test fixtures for timezone utilities (getLocalTimezone)
 * These fixtures ensure consistent timezone handling across the application,
 * which is critical for a healthcare platform serving users in different regions.
 */

/**
 * Dates with known timezone offsets for predictable testing
 * Each date is set to noon in its respective timezone to avoid DST edge cases
 */
export const fixedOffsetDates = {
  // UTC+0 (Greenwich Mean Time)
  utc: new Date('2023-06-15T12:00:00Z'),
  
  // UTC-3 (São Paulo, Brazil - standard time)
  saoPaulo: new Date('2023-06-15T12:00:00-03:00'),
  
  // UTC-5 (Eastern Standard Time - non-DST period)
  newYorkWinter: new Date('2023-01-15T12:00:00-05:00'),
  
  // UTC-4 (Eastern Daylight Time - DST period)
  newYorkSummer: new Date('2023-07-15T12:00:00-04:00'),
  
  // UTC+1 (Central European Time - non-DST period)
  parisWinter: new Date('2023-01-15T12:00:00+01:00'),
  
  // UTC+2 (Central European Summer Time - DST period)
  parisSummer: new Date('2023-07-15T12:00:00+02:00'),
  
  // UTC+9 (Japan Standard Time - no DST)
  tokyo: new Date('2023-06-15T12:00:00+09:00'),
  
  // UTC+5:30 (India Standard Time - no DST, non-whole hour offset)
  mumbai: new Date('2023-06-15T12:00:00+05:30'),
  
  // UTC+12 (New Zealand Standard Time - non-DST period)
  aucklandWinter: new Date('2023-06-15T12:00:00+12:00'),
  
  // UTC+13 (New Zealand Daylight Time - DST period)
  aucklandSummer: new Date('2023-01-15T12:00:00+13:00'),
};

/**
 * DST transition dates for testing timezone handling during shifts
 * These dates are set exactly at the DST transition points
 */
export const dstTransitionDates = {
  // North America DST transitions for 2023
  northAmerica: {
    // Spring forward (2:00 AM → 3:00 AM)
    springForward: new Date('2023-03-12T02:00:00-05:00'),
    // One hour after spring forward
    afterSpringForward: new Date('2023-03-12T03:00:00-04:00'),
    // Fall back (2:00 AM → 1:00 AM)
    fallBack: new Date('2023-11-05T02:00:00-04:00'),
    // One hour after fall back
    afterFallBack: new Date('2023-11-05T01:00:00-05:00'),
  },
  
  // Europe DST transitions for 2023
  europe: {
    // Spring forward (2:00 AM → 3:00 AM)
    springForward: new Date('2023-03-26T02:00:00+01:00'),
    // One hour after spring forward
    afterSpringForward: new Date('2023-03-26T03:00:00+02:00'),
    // Fall back (3:00 AM → 2:00 AM)
    fallBack: new Date('2023-10-29T03:00:00+02:00'),
    // One hour after fall back
    afterFallBack: new Date('2023-10-29T02:00:00+01:00'),
  },
  
  // Southern Hemisphere DST transitions for 2023 (e.g., Australia)
  southernHemisphere: {
    // Fall back (3:00 AM → 2:00 AM)
    fallBack: new Date('2023-04-02T03:00:00+11:00'),
    // One hour after fall back
    afterFallBack: new Date('2023-04-02T02:00:00+10:00'),
    // Spring forward (2:00 AM → 3:00 AM)
    springForward: new Date('2023-10-01T02:00:00+10:00'),
    // One hour after spring forward
    afterSpringForward: new Date('2023-10-01T03:00:00+11:00'),
  },
};

/**
 * Expected timezone string formats for validation
 * These match the format returned by getLocalTimezone(): "+HH:MM" or "-HH:MM"
 */
export const expectedTimezoneFormats = {
  // Whole hour offsets
  utc: '+00:00',
  est: '-05:00',
  edt: '-04:00',
  cet: '+01:00',
  cest: '+02:00',
  jst: '+09:00',
  nzst: '+12:00',
  nzdt: '+13:00',
  
  // Non-whole hour offsets
  ist: '+05:30',  // India
  npt: '+05:45',  // Nepal
  acst: '+09:30',  // Australian Central Standard Time
  
  // Negative non-whole hour offsets
  nfnt: '-03:30',  // Newfoundland Time
};

/**
 * Global timezone fixtures for testing international scenarios
 * Each entry contains a location name, its standard offset, and whether it observes DST
 */
export const globalTimezones = [
  { location: 'São Paulo, Brazil', standardOffset: '-03:00', observesDst: false },
  { location: 'New York, USA', standardOffset: '-05:00', observesDst: true },
  { location: 'London, UK', standardOffset: '+00:00', observesDst: true },
  { location: 'Paris, France', standardOffset: '+01:00', observesDst: true },
  { location: 'Cairo, Egypt', standardOffset: '+02:00', observesDst: false },
  { location: 'Mumbai, India', standardOffset: '+05:30', observesDst: false },
  { location: 'Tokyo, Japan', standardOffset: '+09:00', observesDst: false },
  { location: 'Sydney, Australia', standardOffset: '+10:00', observesDst: true },
  { location: 'Auckland, New Zealand', standardOffset: '+12:00', observesDst: true },
];

/**
 * Special test cases for timezone edge scenarios
 */
export const specialTimezoneTestCases = {
  // International Date Line crossing
  dateLineCrossing: {
    // Baker Island (UTC-12)
    west: new Date('2023-06-15T12:00:00-12:00'),
    // Line Islands, Kiribati (UTC+14)
    east: new Date('2023-06-15T12:00:00+14:00'),
  },
  
  // Extreme timezone offsets
  extremeOffsets: {
    // Westernmost timezone (UTC-12)
    westernmost: new Date('2023-06-15T12:00:00-12:00'),
    // Easternmost timezone (UTC+14)
    easternmost: new Date('2023-06-15T12:00:00+14:00'),
  },
  
  // Historical timezone changes
  // For testing with systems that may have historical timezone data
  historicalChanges: {
    // Before Brazil eliminated DST in 2019
    brazilBeforeDstElimination: new Date('2018-10-21T00:00:00-02:00'),
    // After Brazil eliminated DST
    brazilAfterDstElimination: new Date('2019-10-20T00:00:00-03:00'),
  },
};

/**
 * Test cases for invalid or problematic dates
 * These should be handled gracefully by timezone functions
 */
export const invalidTimezoneTestCases = [
  null,
  undefined,
  '',
  'not-a-date',
  '2023-13-45', // Invalid month and day
  {}, // Invalid object
  new Date('Invalid Date'),
];

/**
 * Timezone offset calculation test cases
 * For testing functions that calculate timezone differences
 */
export const timezoneOffsetCalculations = [
  {
    description: 'São Paulo to New York (non-DST)',
    fromTimezone: '-03:00',
    toTimezone: '-05:00',
    expectedHourDifference: -2, // São Paulo is 2 hours ahead of New York
  },
  {
    description: 'Tokyo to London (non-DST)',
    fromTimezone: '+09:00',
    toTimezone: '+00:00',
    expectedHourDifference: 9, // Tokyo is 9 hours ahead of London
  },
  {
    description: 'Sydney to Los Angeles (both in DST)',
    fromTimezone: '+11:00', // Sydney in DST
    toTimezone: '-07:00', // LA in DST
    expectedHourDifference: 18, // Sydney is 18 hours ahead of LA
  },
  {
    description: 'Mumbai to São Paulo (no DST)',
    fromTimezone: '+05:30',
    toTimezone: '-03:00',
    expectedHourDifference: 8.5, // Mumbai is 8.5 hours ahead of São Paulo
  },
];
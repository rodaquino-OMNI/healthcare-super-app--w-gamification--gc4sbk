/**
 * Test fixtures for date range functions
 * 
 * This file contains test fixtures for the date range utility functions:
 * - getDateRange
 * - getDatesBetween
 * - isDateInRange
 * 
 * These fixtures provide consistent test data for unit tests across all services.
 */

/**
 * Fixed reference dates for deterministic testing
 * Using fixed dates ensures tests are not dependent on the current date
 */
export const REFERENCE_DATES = {
  // Fixed date: June 15, 2023 (Thursday)
  STANDARD: new Date('2023-06-15T12:00:00Z'),
  
  // Fixed date: January 15, 2023 (Sunday, first month of year)
  JANUARY: new Date('2023-01-15T12:00:00Z'),
  
  // Fixed date: December 15, 2023 (Friday, last month of year)
  DECEMBER: new Date('2023-12-15T12:00:00Z'),
  
  // Fixed date: June 1, 2023 (Thursday, first day of month)
  MONTH_START: new Date('2023-06-01T12:00:00Z'),
  
  // Fixed date: June 30, 2023 (Friday, last day of month)
  MONTH_END: new Date('2023-06-30T12:00:00Z'),
  
  // Fixed date: January 1, 2023 (Sunday, first day of year)
  YEAR_START: new Date('2023-01-01T12:00:00Z'),
  
  // Fixed date: December 31, 2023 (Sunday, last day of year)
  YEAR_END: new Date('2023-12-31T12:00:00Z'),
};

/**
 * Interface for date range objects
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Expected date ranges for the STANDARD reference date (June 15, 2023)
 */
export const EXPECTED_RANGES: Record<string, DateRange> = {
  // Today: June 15, 2023 (00:00:00 to 23:59:59)
  TODAY: {
    startDate: new Date('2023-06-15T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z')
  },
  
  // Yesterday: June 14, 2023 (00:00:00 to 23:59:59)
  YESTERDAY: {
    startDate: new Date('2023-06-14T00:00:00Z'),
    endDate: new Date('2023-06-14T23:59:59.999Z')
  },
  
  // This Week: June 11, 2023 (Sunday) to June 17, 2023 (Saturday)
  THIS_WEEK: {
    startDate: new Date('2023-06-11T00:00:00Z'),
    endDate: new Date('2023-06-17T23:59:59.999Z')
  },
  
  // Last Week: June 4, 2023 (Sunday) to June 10, 2023 (Saturday)
  LAST_WEEK: {
    startDate: new Date('2023-06-04T00:00:00Z'),
    endDate: new Date('2023-06-10T23:59:59.999Z')
  },
  
  // This Month: June 1, 2023 to June 30, 2023
  THIS_MONTH: {
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z')
  },
  
  // Last Month: May 1, 2023 to May 31, 2023
  LAST_MONTH: {
    startDate: new Date('2023-05-01T00:00:00Z'),
    endDate: new Date('2023-05-31T23:59:59.999Z')
  },
  
  // This Year: January 1, 2023 to December 31, 2023
  THIS_YEAR: {
    startDate: new Date('2023-01-01T00:00:00Z'),
    endDate: new Date('2023-12-31T23:59:59.999Z')
  },
  
  // Last Year: January 1, 2022 to December 31, 2022
  LAST_YEAR: {
    startDate: new Date('2022-01-01T00:00:00Z'),
    endDate: new Date('2022-12-31T23:59:59.999Z')
  },
  
  // Last 7 Days: June 9, 2023 to June 15, 2023
  LAST_7_DAYS: {
    startDate: new Date('2023-06-09T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z')
  },
  
  // Last 30 Days: May 17, 2023 to June 15, 2023
  LAST_30_DAYS: {
    startDate: new Date('2023-05-17T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z')
  },
  
  // Last 90 Days: March 18, 2023 to June 15, 2023
  LAST_90_DAYS: {
    startDate: new Date('2023-03-18T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z')
  },
  
  // Last 365 Days: June 16, 2022 to June 15, 2023
  LAST_365_DAYS: {
    startDate: new Date('2022-06-16T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z')
  }
};

/**
 * Mapping between range type strings and expected range keys
 */
export const RANGE_TYPE_MAPPING: Record<string, keyof typeof EXPECTED_RANGES> = {
  'today': 'TODAY',
  'yesterday': 'YESTERDAY',
  'thisWeek': 'THIS_WEEK',
  'lastWeek': 'LAST_WEEK',
  'thisMonth': 'THIS_MONTH',
  'lastMonth': 'LAST_MONTH',
  'thisYear': 'THIS_YEAR',
  'lastYear': 'LAST_YEAR',
  'last7Days': 'LAST_7_DAYS',
  'last30Days': 'LAST_30_DAYS',
  'last90Days': 'LAST_90_DAYS',
  'last365Days': 'LAST_365_DAYS'
};

/**
 * Test cases for date range inclusion/exclusion
 */
export const DATE_RANGE_INCLUSION_TESTS = [
  // Test case: Date is exactly the start date of range
  {
    description: 'Date is exactly the start date of range',
    date: new Date('2023-06-01T00:00:00Z'),
    range: {
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: new Date('2023-06-30T23:59:59.999Z')
    },
    expectedResult: true
  },
  
  // Test case: Date is exactly the end date of range
  {
    description: 'Date is exactly the end date of range',
    date: new Date('2023-06-30T23:59:59.999Z'),
    range: {
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: new Date('2023-06-30T23:59:59.999Z')
    },
    expectedResult: true
  },
  
  // Test case: Date is within the range
  {
    description: 'Date is within the range',
    date: new Date('2023-06-15T12:00:00Z'),
    range: {
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: new Date('2023-06-30T23:59:59.999Z')
    },
    expectedResult: true
  },
  
  // Test case: Date is before the range
  {
    description: 'Date is before the range',
    date: new Date('2023-05-31T23:59:59.999Z'),
    range: {
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: new Date('2023-06-30T23:59:59.999Z')
    },
    expectedResult: false
  },
  
  // Test case: Date is after the range
  {
    description: 'Date is after the range',
    date: new Date('2023-07-01T00:00:00Z'),
    range: {
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: new Date('2023-06-30T23:59:59.999Z')
    },
    expectedResult: false
  },
  
  // Test case: Date is same day as start date but earlier time
  {
    description: 'Date is same day as start date but earlier time',
    date: new Date('2023-06-01T00:00:00Z'),
    range: {
      startDate: new Date('2023-06-01T12:00:00Z'),
      endDate: new Date('2023-06-30T23:59:59.999Z')
    },
    expectedResult: true // Should be true because we check by day, not exact time
  },
  
  // Test case: Date is same day as end date but later time
  {
    description: 'Date is same day as end date but later time',
    date: new Date('2023-06-30T23:59:59.999Z'),
    range: {
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: new Date('2023-06-30T12:00:00Z')
    },
    expectedResult: true // Should be true because we check by day, not exact time
  }
];

/**
 * Test cases for getDatesBetween function
 */
export const DATES_BETWEEN_TESTS = [
  // Test case: Single day range (same start and end date)
  {
    description: 'Single day range (same start and end date)',
    startDate: new Date('2023-06-15T00:00:00Z'),
    endDate: new Date('2023-06-15T23:59:59.999Z'),
    expectedCount: 1,
    expectedFirstDate: new Date('2023-06-15T00:00:00Z'),
    expectedLastDate: new Date('2023-06-15T00:00:00Z')
  },
  
  // Test case: Two day range
  {
    description: 'Two day range',
    startDate: new Date('2023-06-15T00:00:00Z'),
    endDate: new Date('2023-06-16T23:59:59.999Z'),
    expectedCount: 2,
    expectedFirstDate: new Date('2023-06-15T00:00:00Z'),
    expectedLastDate: new Date('2023-06-16T00:00:00Z')
  },
  
  // Test case: Week range (7 days)
  {
    description: 'Week range (7 days)',
    startDate: new Date('2023-06-11T00:00:00Z'),
    endDate: new Date('2023-06-17T23:59:59.999Z'),
    expectedCount: 7,
    expectedFirstDate: new Date('2023-06-11T00:00:00Z'),
    expectedLastDate: new Date('2023-06-17T00:00:00Z')
  },
  
  // Test case: Month range (30 days)
  {
    description: 'Month range (30 days)',
    startDate: new Date('2023-06-01T00:00:00Z'),
    endDate: new Date('2023-06-30T23:59:59.999Z'),
    expectedCount: 30,
    expectedFirstDate: new Date('2023-06-01T00:00:00Z'),
    expectedLastDate: new Date('2023-06-30T00:00:00Z')
  }
];

/**
 * Journey-specific date range fixtures
 */
export const JOURNEY_DATE_RANGES = {
  // Health journey date ranges (focused on health metrics tracking)
  HEALTH: {
    // Daily metrics range (today)
    DAILY: EXPECTED_RANGES.TODAY,
    
    // Weekly metrics range (last 7 days)
    WEEKLY: EXPECTED_RANGES.LAST_7_DAYS,
    
    // Monthly metrics range (last 30 days)
    MONTHLY: EXPECTED_RANGES.LAST_30_DAYS,
    
    // Quarterly metrics range (last 90 days)
    QUARTERLY: EXPECTED_RANGES.LAST_90_DAYS,
    
    // Yearly metrics range (last 365 days)
    YEARLY: EXPECTED_RANGES.LAST_365_DAYS
  },
  
  // Care journey date ranges (focused on appointments and treatments)
  CARE: {
    // Today's appointments
    TODAY: EXPECTED_RANGES.TODAY,
    
    // This week's appointments
    THIS_WEEK: EXPECTED_RANGES.THIS_WEEK,
    
    // Next week's appointments (custom range for future dates)
    NEXT_WEEK: {
      startDate: new Date('2023-06-18T00:00:00Z'), // Sunday after THIS_WEEK
      endDate: new Date('2023-06-24T23:59:59.999Z')  // Saturday after THIS_WEEK
    },
    
    // This month's appointments
    THIS_MONTH: EXPECTED_RANGES.THIS_MONTH,
    
    // Recent medical history (last 90 days)
    RECENT_HISTORY: EXPECTED_RANGES.LAST_90_DAYS
  },
  
  // Plan journey date ranges (focused on insurance claims and benefits)
  PLAN: {
    // Current month claims
    CURRENT_MONTH: EXPECTED_RANGES.THIS_MONTH,
    
    // Previous month claims
    PREVIOUS_MONTH: EXPECTED_RANGES.LAST_MONTH,
    
    // Current quarter claims (custom range)
    CURRENT_QUARTER: {
      startDate: new Date('2023-04-01T00:00:00Z'), // Q2 2023 start
      endDate: new Date('2023-06-30T23:59:59.999Z')  // Q2 2023 end
    },
    
    // Previous quarter claims (custom range)
    PREVIOUS_QUARTER: {
      startDate: new Date('2023-01-01T00:00:00Z'), // Q1 2023 start
      endDate: new Date('2023-03-31T23:59:59.999Z')  // Q1 2023 end
    },
    
    // Year-to-date claims (custom range)
    YEAR_TO_DATE: {
      startDate: new Date('2023-01-01T00:00:00Z'), // Year start
      endDate: REFERENCE_DATES.STANDARD // Reference date
    },
    
    // Previous year claims
    PREVIOUS_YEAR: EXPECTED_RANGES.LAST_YEAR
  }
};

/**
 * Edge case test fixtures for date range functions
 */
export const EDGE_CASE_FIXTURES = {
  // Leap year date (February 29, 2024)
  LEAP_YEAR_DATE: new Date('2024-02-29T12:00:00Z'),
  
  // Daylight saving time transition dates (Brazil DST)
  DST_START: new Date('2023-10-15T00:00:00Z'), // Brazil DST start
  DST_END: new Date('2023-02-26T00:00:00Z'),   // Brazil DST end
  
  // Month with 31 days
  LONG_MONTH_END: new Date('2023-01-31T23:59:59.999Z'),
  
  // Month with 30 days
  SHORT_MONTH_END: new Date('2023-04-30T23:59:59.999Z'),
  
  // Year boundary dates
  YEAR_BOUNDARY_START: new Date('2022-12-31T23:59:59.999Z'),
  YEAR_BOUNDARY_END: new Date('2023-01-01T00:00:00Z'),
  
  // Invalid date ranges (for testing error handling)
  INVALID_RANGE: {
    startDate: new Date('2023-06-30T00:00:00Z'),
    endDate: new Date('2023-06-01T00:00:00Z') // End date before start date
  }
};
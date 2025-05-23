/**
 * Date Validation Test Fixtures
 * 
 * This file contains comprehensive test data for date validation and formatting
 * in Brazilian (dd/MM/yyyy) and international formats. These fixtures ensure
 * consistent date handling across all journey services for appointments, claims,
 * and health metrics.
 */

// ===== VALID DATES =====

/**
 * Valid dates in Brazilian format (dd/MM/yyyy) - Primary market format
 */
export const VALID_BR_DATES = {
  // Standard dates
  STANDARD: {
    // Current year
    CURRENT_YEAR: [
      '01/01/2023',
      '15/06/2023',
      '31/12/2023'
    ],
    // Past dates
    PAST: [
      '10/05/2020',
      '23/11/2015',
      '01/01/2000'
    ],
    // Future dates
    FUTURE: [
      '01/01/2025',
      '15/06/2030',
      '31/12/2050'
    ]
  },
  
  // Edge cases
  EDGE_CASES: {
    // Leap years
    LEAP_YEAR: [
      '29/02/2020', // Valid leap year
      '29/02/2024', // Valid leap year
      '29/02/2000'  // Valid leap year (century divisible by 400)
    ],
    // Month boundaries
    MONTH_BOUNDARIES: [
      '31/01/2023', // January has 31 days
      '28/02/2023', // February has 28 days in non-leap years
      '31/03/2023', // March has 31 days
      '30/04/2023', // April has 30 days
      '31/05/2023', // May has 31 days
      '30/06/2023', // June has 30 days
      '31/07/2023', // July has 31 days
      '31/08/2023', // August has 31 days
      '30/09/2023', // September has 30 days
      '31/10/2023', // October has 31 days
      '30/11/2023', // November has 30 days
      '31/12/2023'  // December has 31 days
    ],
    // Year transitions
    YEAR_TRANSITIONS: [
      '31/12/2022', // Last day of 2022
      '01/01/2023'  // First day of 2023
    ]
  },
  
  // Journey-specific dates
  JOURNEY: {
    // Health journey dates
    HEALTH: [
      '01/01/2023', // New Year health metrics
      '15/06/2023', // Mid-year health check
      '31/12/2023'  // Year-end health summary
    ],
    // Care journey dates (appointments)
    CARE: [
      '10/05/2023', // Doctor appointment
      '23/11/2023', // Specialist consultation
      '15/12/2023'  // Follow-up visit
    ],
    // Plan journey dates (claims, coverage)
    PLAN: [
      '05/01/2023', // Claim submission date
      '20/06/2023', // Coverage start date
      '31/12/2023'  // Plan renewal date
    ]
  }
};

/**
 * Valid dates in international format (MM/dd/yyyy) - Cross-region support
 */
export const VALID_US_DATES = {
  // Standard dates
  STANDARD: {
    // Current year
    CURRENT_YEAR: [
      '01/01/2023', // January 1, 2023
      '06/15/2023', // June 15, 2023
      '12/31/2023'  // December 31, 2023
    ],
    // Past dates
    PAST: [
      '05/10/2020', // May 10, 2020
      '11/23/2015', // November 23, 2015
      '01/01/2000'  // January 1, 2000
    ],
    // Future dates
    FUTURE: [
      '01/01/2025', // January 1, 2025
      '06/15/2030', // June 15, 2030
      '12/31/2050'  // December 31, 2050
    ]
  },
  
  // Edge cases
  EDGE_CASES: {
    // Leap years
    LEAP_YEAR: [
      '02/29/2020', // February 29, 2020 (valid leap year)
      '02/29/2024', // February 29, 2024 (valid leap year)
      '02/29/2000'  // February 29, 2000 (valid leap year - century divisible by 400)
    ],
    // Month boundaries
    MONTH_BOUNDARIES: [
      '01/31/2023', // January 31, 2023
      '02/28/2023', // February 28, 2023
      '03/31/2023', // March 31, 2023
      '04/30/2023', // April 30, 2023
      '05/31/2023', // May 31, 2023
      '06/30/2023', // June 30, 2023
      '07/31/2023', // July 31, 2023
      '08/31/2023', // August 31, 2023
      '09/30/2023', // September 30, 2023
      '10/31/2023', // October 31, 2023
      '11/30/2023', // November 30, 2023
      '12/31/2023'  // December 31, 2023
    ]
  }
};

/**
 * Valid dates in ISO format (yyyy-MM-dd) - API and database format
 */
export const VALID_ISO_DATES = {
  // Standard dates
  STANDARD: [
    '2023-01-01', // January 1, 2023
    '2023-06-15', // June 15, 2023
    '2023-12-31'  // December 31, 2023
  ],
  // Edge cases
  EDGE_CASES: [
    '2020-02-29', // February 29, 2020 (leap year)
    '2023-02-28', // February 28, 2023 (non-leap year)
    '2000-02-29'  // February 29, 2000 (leap year - century divisible by 400)
  ]
};

/**
 * Valid date objects for testing
 */
export const VALID_DATE_OBJECTS = {
  // Current year
  CURRENT_YEAR: [
    new Date(2023, 0, 1),  // January 1, 2023
    new Date(2023, 5, 15), // June 15, 2023
    new Date(2023, 11, 31) // December 31, 2023
  ],
  // Past dates
  PAST: [
    new Date(2020, 4, 10),  // May 10, 2020
    new Date(2015, 10, 23), // November 23, 2015
    new Date(2000, 0, 1)    // January 1, 2000
  ],
  // Future dates
  FUTURE: [
    new Date(2025, 0, 1),  // January 1, 2025
    new Date(2030, 5, 15), // June 15, 2030
    new Date(2050, 11, 31) // December 31, 2050
  ],
  // Edge cases
  EDGE_CASES: [
    new Date(2020, 1, 29), // February 29, 2020 (leap year)
    new Date(2023, 1, 28), // February 28, 2023 (non-leap year)
    new Date(2000, 1, 29)  // February 29, 2000 (leap year - century divisible by 400)
  ]
};

/**
 * Valid date-time combinations in Brazilian format (dd/MM/yyyy HH:mm)
 */
export const VALID_BR_DATETIMES = [
  '01/01/2023 00:00', // Midnight
  '15/06/2023 12:30', // Midday
  '31/12/2023 23:59'  // End of year
];

/**
 * Valid time values in 24-hour format (HH:mm)
 */
export const VALID_TIMES = [
  '00:00', // Midnight
  '08:30', // Morning
  '12:00', // Noon
  '15:45', // Afternoon
  '18:00', // Evening
  '23:59'  // End of day
];

// ===== INVALID DATES =====

/**
 * Invalid dates in Brazilian format (dd/MM/yyyy) with descriptive error contexts
 */
export const INVALID_BR_DATES = {
  // Formatting errors
  FORMAT_ERRORS: {
    // Wrong separators
    WRONG_SEPARATORS: [
      '01-01-2023', // Using hyphens instead of slashes
      '01.01.2023', // Using dots instead of slashes
      '01 01 2023'  // Using spaces instead of slashes
    ],
    // Wrong order
    WRONG_ORDER: [
      '2023/01/01', // Year first (ISO-like)
      '01/2023/01'  // Month and day swapped
    ],
    // Missing components
    MISSING_COMPONENTS: [
      '01/2023',    // Missing day
      '01//2023',   // Empty month
      '/01/2023',   // Empty day
      '01/01/'      // Empty year
    ],
    // Extra components
    EXTRA_COMPONENTS: [
      '01/01/2023/00', // Extra component
      '01/01/2023 '    // Trailing space
    ]
  },
  
  // Out-of-range values
  OUT_OF_RANGE: {
    // Invalid days
    INVALID_DAYS: [
      '00/01/2023', // Day 0 doesn't exist
      '32/01/2023', // January has 31 days
      '31/04/2023', // April has 30 days
      '31/06/2023', // June has 30 days
      '31/09/2023', // September has 30 days
      '31/11/2023', // November has 30 days
      '29/02/2023'  // February has 28 days in non-leap years
    ],
    // Invalid months
    INVALID_MONTHS: [
      '01/00/2023', // Month 0 doesn't exist
      '01/13/2023'  // Month 13 doesn't exist
    ],
    // Invalid years
    INVALID_YEARS: [
      '01/01/0000', // Year 0 is not valid
      '01/01/10000' // 5-digit year
    ]
  },
  
  // Non-date values
  NON_DATE_VALUES: [
    'not a date',
    'dd/mm/yyyy',
    '??/??/????',
    'undefined',
    'null'
  ],
  
  // Leap year errors
  LEAP_YEAR_ERRORS: [
    '29/02/2023', // 2023 is not a leap year
    '29/02/2022', // 2022 is not a leap year
    '29/02/2100'  // 2100 is not a leap year (century not divisible by 400)
  ]
};

/**
 * Invalid dates in international format (MM/dd/yyyy) with descriptive error contexts
 */
export const INVALID_US_DATES = {
  // Formatting errors
  FORMAT_ERRORS: {
    // Wrong separators
    WRONG_SEPARATORS: [
      '01-01-2023', // Using hyphens instead of slashes
      '01.01.2023', // Using dots instead of slashes
      '01 01 2023'  // Using spaces instead of slashes
    ],
    // Wrong order
    WRONG_ORDER: [
      '2023/01/01', // Year first (ISO-like)
      '01/2023/01'  // Day and year swapped
    ]
  },
  
  // Out-of-range values
  OUT_OF_RANGE: {
    // Invalid days
    INVALID_DAYS: [
      '01/00/2023', // Day 0 doesn't exist
      '01/32/2023', // January has 31 days
      '04/31/2023', // April has 30 days
      '06/31/2023', // June has 30 days
      '09/31/2023', // September has 30 days
      '11/31/2023', // November has 30 days
      '02/29/2023'  // February has 28 days in non-leap years
    ],
    // Invalid months
    INVALID_MONTHS: [
      '00/01/2023', // Month 0 doesn't exist
      '13/01/2023'  // Month 13 doesn't exist
    ]
  },
  
  // Leap year errors
  LEAP_YEAR_ERRORS: [
    '02/29/2023', // 2023 is not a leap year
    '02/29/2022', // 2022 is not a leap year
    '02/29/2100'  // 2100 is not a leap year (century not divisible by 400)
  ]
};

/**
 * Invalid date-time combinations
 */
export const INVALID_DATETIMES = {
  // Invalid time components
  INVALID_TIME: [
    '01/01/2023 24:00', // Hour 24 is invalid
    '01/01/2023 12:60', // Minute 60 is invalid
    '01/01/2023 -1:30', // Negative hour
    '01/01/2023 12:-30' // Negative minute
  ],
  // Invalid formats
  INVALID_FORMAT: [
    '01/01/2023T12:30', // Using 'T' separator (ISO-like)
    '01/01/2023 12h30', // Using 'h' instead of ':'
    '01/01/2023 12.30', // Using '.' instead of ':'
    '01/01/2023 12:30:00' // Including seconds when not expected
  ]
};

/**
 * Invalid time values
 */
export const INVALID_TIMES = [
  '24:00', // Hour 24 is invalid
  '12:60', // Minute 60 is invalid
  '-1:30', // Negative hour
  '12:-30', // Negative minute
  '12h30', // Using 'h' instead of ':'
  '12.30', // Using '.' instead of ':'
  '12:30:00' // Including seconds when not expected
];

// ===== DATE RANGES =====

/**
 * Valid date ranges for testing range functions
 */
export const VALID_DATE_RANGES = {
  // Standard ranges
  STANDARD: [
    { startDate: '01/01/2023', endDate: '31/01/2023' }, // January 2023
    { startDate: '01/01/2023', endDate: '31/12/2023' }, // Full year 2023
    { startDate: '01/01/2020', endDate: '31/12/2023' }  // Multi-year range
  ],
  // Same-day ranges
  SAME_DAY: [
    { startDate: '15/06/2023', endDate: '15/06/2023' } // Single day range
  ],
  // Journey-specific ranges
  JOURNEY: {
    // Health journey date ranges (for metrics tracking)
    HEALTH: [
      { startDate: '01/01/2023', endDate: '31/01/2023', description: 'Monthly health metrics' },
      { startDate: '01/01/2023', endDate: '31/03/2023', description: 'Quarterly health report' },
      { startDate: '01/01/2023', endDate: '31/12/2023', description: 'Annual health summary' }
    ],
    // Care journey date ranges (for appointment scheduling)
    CARE: [
      { startDate: '01/05/2023', endDate: '31/05/2023', description: 'May appointments' },
      { startDate: '01/06/2023', endDate: '30/06/2023', description: 'June appointments' },
      { startDate: '01/01/2023', endDate: '31/12/2023', description: 'Annual appointment schedule' }
    ],
    // Plan journey date ranges (for coverage periods)
    PLAN: [
      { startDate: '01/01/2023', endDate: '31/12/2023', description: 'Annual coverage period' },
      { startDate: '01/07/2023', endDate: '31/12/2023', description: 'Half-year coverage period' },
      { startDate: '01/01/2023', endDate: '31/03/2023', description: 'Quarterly coverage period' }
    ]
  }
};

/**
 * Invalid date ranges
 */
export const INVALID_DATE_RANGES = {
  // End date before start date
  INVERTED: [
    { startDate: '31/01/2023', endDate: '01/01/2023' }, // End before start
    { startDate: '31/12/2023', endDate: '01/01/2023' }  // End before start (full year)
  ],
  // Invalid date components
  INVALID_COMPONENTS: [
    { startDate: '29/02/2023', endDate: '31/03/2023' }, // Invalid start date (non-leap year)
    { startDate: '01/01/2023', endDate: '31/02/2023' }, // Invalid end date (February has max 28/29 days)
    { startDate: 'invalid', endDate: '31/01/2023' },    // Non-date start
    { startDate: '01/01/2023', endDate: 'invalid' }     // Non-date end
  ]
};

// ===== SPECIAL CASES =====

/**
 * Historical dates for testing
 */
export const HISTORICAL_DATES = [
  '01/01/1900', // Start of 20th century
  '07/09/1822', // Brazilian Independence Day
  '25/12/1000'  // Medieval date
];

/**
 * Future dates for testing
 */
export const FUTURE_DATES = [
  '01/01/2030', // Near future
  '01/01/2050', // Mid-century
  '01/01/2100'  // Next century
];

/**
 * Birthdate test fixtures for age calculation
 */
export const BIRTHDATE_FIXTURES = [
  { birthdate: '01/01/1950', referenceDate: '01/01/2023', expectedAge: 73 },
  { birthdate: '15/06/1980', referenceDate: '15/06/2023', expectedAge: 43 },
  { birthdate: '31/12/2000', referenceDate: '01/01/2023', expectedAge: 22 },
  { birthdate: '01/01/2023', referenceDate: '01/01/2023', expectedAge: 0 }
];

/**
 * Journey-specific date fixtures
 */
export const JOURNEY_DATE_FIXTURES = {
  // Health journey dates with expected formats
  HEALTH: [
    { date: '01/01/2023', expectedFormat: '01/01/2023 00:00', locale: 'pt-BR' },
    { date: '15/06/2023 12:30', expectedFormat: '15/06/2023 12:30', locale: 'pt-BR' },
    { date: '31/12/2023', expectedFormat: '31/12/2023 00:00', locale: 'pt-BR' }
  ],
  // Care journey dates with expected formats
  CARE: [
    { date: '01/01/2023', expectedFormat: 'dom, 01 jan 2023', locale: 'pt-BR' },
    { date: '15/06/2023', expectedFormat: 'qui, 15 jun 2023', locale: 'pt-BR' },
    { date: '31/12/2023', expectedFormat: 'dom, 31 dez 2023', locale: 'pt-BR' }
  ],
  // Plan journey dates with expected formats
  PLAN: [
    { date: '01/01/2023', expectedFormat: '01/01/2023', locale: 'pt-BR' },
    { date: '15/06/2023', expectedFormat: '15/06/2023', locale: 'pt-BR' },
    { date: '31/12/2023', expectedFormat: '31/12/2023', locale: 'pt-BR' }
  ]
};

/**
 * Relative date test fixtures
 */
export const RELATIVE_DATE_FIXTURES = [
  // Note: These are examples and actual results will depend on the current date when tests run
  { date: new Date(), expectedResult: 'Hoje', locale: 'pt-BR' }, // Today
  { date: new Date(new Date().setDate(new Date().getDate() - 1)), expectedResult: 'Ontem', locale: 'pt-BR' }, // Yesterday
  { date: new Date(new Date().setDate(new Date().getDate() - 7)), expectedResult: '7 dias atrás', locale: 'pt-BR' }, // 7 days ago
  { date: new Date(new Date().setDate(new Date().getDate() - 30)), expectedResult: '30 dias atrás', locale: 'pt-BR' } // 30 days ago
];
/**
 * Test fixtures for date formatting functions
 * 
 * This file provides test fixtures for all date formatting functions in the utils package.
 * It includes a variety of dates with their expected formatted outputs in different locales,
 * formats, and edge cases to ensure formatting functions work correctly across all scenarios.
 */

// Common test dates to be used across multiple test cases
export const TEST_DATES = {
  // Regular dates
  REGULAR: new Date('2023-05-15T14:30:45'),
  FIRST_DAY_OF_YEAR: new Date('2023-01-01T00:00:00'),
  LAST_DAY_OF_YEAR: new Date('2023-12-31T23:59:59'),
  
  // Edge cases
  LEAP_YEAR: new Date('2024-02-29T12:00:00'),
  DAYLIGHT_SAVING_START_BR: new Date('2023-10-15T01:30:00'), // Brazil DST start
  DAYLIGHT_SAVING_END_BR: new Date('2023-02-19T01:30:00'),   // Brazil DST end
  DAYLIGHT_SAVING_START_US: new Date('2023-03-12T01:30:00'), // US DST start
  DAYLIGHT_SAVING_END_US: new Date('2023-11-05T01:30:00'),   // US DST end
  
  // Special dates
  MIDNIGHT: new Date('2023-05-15T00:00:00'),
  NOON: new Date('2023-05-15T12:00:00'),
  ALMOST_MIDNIGHT: new Date('2023-05-15T23:59:59'),
  
  // Dates for relative formatting
  TODAY: new Date(), // Current date
  YESTERDAY: (() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  })(),
  LAST_WEEK: (() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  })(),
  LAST_MONTH: (() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  })(),
  LAST_YEAR: (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date;
  })()
};

/**
 * Fixtures for formatDate function
 */
export const FORMAT_DATE_FIXTURES = {
  // Default format (dd/MM/yyyy)
  DEFAULT_FORMAT: [
    {
      date: TEST_DATES.REGULAR,
      expected: {
        'pt-BR': '15/05/2023',
        'en-US': '15/05/2023'
      }
    },
    {
      date: TEST_DATES.FIRST_DAY_OF_YEAR,
      expected: {
        'pt-BR': '01/01/2023',
        'en-US': '01/01/2023'
      }
    },
    {
      date: TEST_DATES.LAST_DAY_OF_YEAR,
      expected: {
        'pt-BR': '31/12/2023',
        'en-US': '31/12/2023'
      }
    },
    {
      date: TEST_DATES.LEAP_YEAR,
      expected: {
        'pt-BR': '29/02/2024',
        'en-US': '29/02/2024'
      }
    }
  ],
  
  // Custom formats
  CUSTOM_FORMATS: [
    {
      date: TEST_DATES.REGULAR,
      format: 'yyyy-MM-dd',
      expected: {
        'pt-BR': '2023-05-15',
        'en-US': '2023-05-15'
      }
    },
    {
      date: TEST_DATES.REGULAR,
      format: 'MMMM dd, yyyy',
      expected: {
        'pt-BR': 'maio 15, 2023',
        'en-US': 'May 15, 2023'
      }
    },
    {
      date: TEST_DATES.REGULAR,
      format: 'EEEE, dd MMMM yyyy',
      expected: {
        'pt-BR': 'segunda-feira, 15 maio 2023',
        'en-US': 'Monday, 15 May 2023'
      }
    },
    {
      date: TEST_DATES.REGULAR,
      format: 'd MMM yy',
      expected: {
        'pt-BR': '15 mai 23',
        'en-US': '15 May 23'
      }
    }
  ],
  
  // Edge cases
  EDGE_CASES: [
    {
      date: null,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      date: undefined,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      date: 'invalid-date',
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    }
  ]
};

/**
 * Fixtures for formatTime function
 */
export const FORMAT_TIME_FIXTURES = {
  // Default format (HH:mm)
  DEFAULT_FORMAT: [
    {
      date: TEST_DATES.REGULAR,
      expected: {
        'pt-BR': '14:30',
        'en-US': '14:30'
      }
    },
    {
      date: TEST_DATES.MIDNIGHT,
      expected: {
        'pt-BR': '00:00',
        'en-US': '00:00'
      }
    },
    {
      date: TEST_DATES.NOON,
      expected: {
        'pt-BR': '12:00',
        'en-US': '12:00'
      }
    },
    {
      date: TEST_DATES.ALMOST_MIDNIGHT,
      expected: {
        'pt-BR': '23:59',
        'en-US': '23:59'
      }
    }
  ],
  
  // Custom formats
  CUSTOM_FORMATS: [
    {
      date: TEST_DATES.REGULAR,
      format: 'h:mm a',
      expected: {
        'pt-BR': '2:30 PM',
        'en-US': '2:30 PM'
      }
    },
    {
      date: TEST_DATES.REGULAR,
      format: 'HH:mm:ss',
      expected: {
        'pt-BR': '14:30:45',
        'en-US': '14:30:45'
      }
    },
    {
      date: TEST_DATES.NOON,
      format: 'h:mm a',
      expected: {
        'pt-BR': '12:00 PM',
        'en-US': '12:00 PM'
      }
    },
    {
      date: TEST_DATES.MIDNIGHT,
      format: 'h:mm a',
      expected: {
        'pt-BR': '12:00 AM',
        'en-US': '12:00 AM'
      }
    }
  ],
  
  // Edge cases
  EDGE_CASES: [
    {
      date: null,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      date: undefined,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      date: 'invalid-time',
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    }
  ]
};

/**
 * Fixtures for formatDateTime function
 */
export const FORMAT_DATETIME_FIXTURES = {
  // Default format (dd/MM/yyyy HH:mm)
  DEFAULT_FORMAT: [
    {
      date: TEST_DATES.REGULAR,
      expected: {
        'pt-BR': '15/05/2023 14:30',
        'en-US': '15/05/2023 14:30'
      }
    },
    {
      date: TEST_DATES.FIRST_DAY_OF_YEAR,
      expected: {
        'pt-BR': '01/01/2023 00:00',
        'en-US': '01/01/2023 00:00'
      }
    },
    {
      date: TEST_DATES.LAST_DAY_OF_YEAR,
      expected: {
        'pt-BR': '31/12/2023 23:59',
        'en-US': '31/12/2023 23:59'
      }
    },
    {
      date: TEST_DATES.LEAP_YEAR,
      expected: {
        'pt-BR': '29/02/2024 12:00',
        'en-US': '29/02/2024 12:00'
      }
    }
  ],
  
  // Custom formats
  CUSTOM_FORMATS: [
    {
      date: TEST_DATES.REGULAR,
      format: 'yyyy-MM-dd HH:mm:ss',
      expected: {
        'pt-BR': '2023-05-15 14:30:45',
        'en-US': '2023-05-15 14:30:45'
      }
    },
    {
      date: TEST_DATES.REGULAR,
      format: 'MMMM dd, yyyy h:mm a',
      expected: {
        'pt-BR': 'maio 15, 2023 2:30 PM',
        'en-US': 'May 15, 2023 2:30 PM'
      }
    },
    {
      date: TEST_DATES.REGULAR,
      format: 'EEEE, dd MMMM yyyy HH:mm:ss',
      expected: {
        'pt-BR': 'segunda-feira, 15 maio 2023 14:30:45',
        'en-US': 'Monday, 15 May 2023 14:30:45'
      }
    },
    {
      date: TEST_DATES.REGULAR,
      format: 'd MMM yy, HH:mm',
      expected: {
        'pt-BR': '15 mai 23, 14:30',
        'en-US': '15 May 23, 14:30'
      }
    }
  ],
  
  // Edge cases
  EDGE_CASES: [
    {
      date: null,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      date: undefined,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      date: 'invalid-datetime',
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    }
  ],
  
  // Daylight saving time transitions
  DST_TRANSITIONS: [
    {
      date: TEST_DATES.DAYLIGHT_SAVING_START_BR,
      format: 'dd/MM/yyyy HH:mm:ss',
      expected: {
        'pt-BR': '15/10/2023 01:30:00',
        'en-US': '15/10/2023 01:30:00'
      }
    },
    {
      date: TEST_DATES.DAYLIGHT_SAVING_END_BR,
      format: 'dd/MM/yyyy HH:mm:ss',
      expected: {
        'pt-BR': '19/02/2023 01:30:00',
        'en-US': '19/02/2023 01:30:00'
      }
    },
    {
      date: TEST_DATES.DAYLIGHT_SAVING_START_US,
      format: 'dd/MM/yyyy HH:mm:ss',
      expected: {
        'pt-BR': '12/03/2023 01:30:00',
        'en-US': '12/03/2023 01:30:00'
      }
    },
    {
      date: TEST_DATES.DAYLIGHT_SAVING_END_US,
      format: 'dd/MM/yyyy HH:mm:ss',
      expected: {
        'pt-BR': '05/11/2023 01:30:00',
        'en-US': '05/11/2023 01:30:00'
      }
    }
  ]
};

/**
 * Fixtures for formatDateRange function
 */
export const FORMAT_DATE_RANGE_FIXTURES = {
  // Default format (dd/MM/yyyy)
  DEFAULT_FORMAT: [
    {
      startDate: TEST_DATES.FIRST_DAY_OF_YEAR,
      endDate: TEST_DATES.LAST_DAY_OF_YEAR,
      expected: {
        'pt-BR': '01/01/2023 - 31/12/2023',
        'en-US': '01/01/2023 - 31/12/2023'
      }
    },
    {
      startDate: TEST_DATES.REGULAR,
      endDate: new Date('2023-05-20T14:30:45'),
      expected: {
        'pt-BR': '15/05/2023 - 20/05/2023',
        'en-US': '15/05/2023 - 20/05/2023'
      }
    },
    {
      startDate: TEST_DATES.REGULAR,
      endDate: TEST_DATES.REGULAR, // Same day range
      expected: {
        'pt-BR': '15/05/2023 - 15/05/2023',
        'en-US': '15/05/2023 - 15/05/2023'
      }
    }
  ],
  
  // Custom formats
  CUSTOM_FORMATS: [
    {
      startDate: TEST_DATES.FIRST_DAY_OF_YEAR,
      endDate: TEST_DATES.LAST_DAY_OF_YEAR,
      format: 'yyyy-MM-dd',
      expected: {
        'pt-BR': '2023-01-01 - 2023-12-31',
        'en-US': '2023-01-01 - 2023-12-31'
      }
    },
    {
      startDate: TEST_DATES.FIRST_DAY_OF_YEAR,
      endDate: TEST_DATES.LAST_DAY_OF_YEAR,
      format: 'd MMM',
      expected: {
        'pt-BR': '1 jan - 31 dez',
        'en-US': '1 Jan - 31 Dec'
      }
    },
    {
      startDate: TEST_DATES.FIRST_DAY_OF_YEAR,
      endDate: TEST_DATES.LAST_DAY_OF_YEAR,
      format: 'MMMM yyyy',
      expected: {
        'pt-BR': 'janeiro 2023 - dezembro 2023',
        'en-US': 'January 2023 - December 2023'
      }
    }
  ],
  
  // Edge cases
  EDGE_CASES: [
    {
      startDate: null,
      endDate: TEST_DATES.LAST_DAY_OF_YEAR,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      startDate: TEST_DATES.FIRST_DAY_OF_YEAR,
      endDate: null,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      startDate: 'invalid-date',
      endDate: TEST_DATES.LAST_DAY_OF_YEAR,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      startDate: TEST_DATES.FIRST_DAY_OF_YEAR,
      endDate: 'invalid-date',
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    }
  ]
};

/**
 * Fixtures for formatRelativeDate function
 * 
 * Note: Since these are relative to the current date, the expected values
 * are functions that return the expected string based on the current date.
 */
export const FORMAT_RELATIVE_DATE_FIXTURES = {
  // Today and yesterday
  RECENT_DATES: [
    {
      date: TEST_DATES.TODAY,
      expected: {
        'pt-BR': 'Hoje',
        'en-US': 'Today'
      }
    },
    {
      date: TEST_DATES.YESTERDAY,
      expected: {
        'pt-BR': 'Ontem',
        'en-US': 'Yesterday'
      }
    }
  ],
  
  // Days ago (fixed test dates)
  DAYS_AGO: [
    {
      date: new Date('2023-05-10T14:30:45'), // 5 days before REGULAR
      referenceDate: TEST_DATES.REGULAR,
      expected: {
        'pt-BR': '5 dias atrás',
        'en-US': '5 days ago'
      }
    },
    {
      date: new Date('2023-05-01T14:30:45'), // 14 days before REGULAR
      referenceDate: TEST_DATES.REGULAR,
      expected: {
        'pt-BR': '14 dias atrás',
        'en-US': '14 days ago'
      }
    }
  ],
  
  // Older dates (formatted with default date format)
  OLDER_DATES: [
    {
      date: new Date('2023-04-01T14:30:45'), // More than 30 days before REGULAR
      referenceDate: TEST_DATES.REGULAR,
      expected: {
        'pt-BR': '01/04/2023',
        'en-US': '01/04/2023'
      }
    },
    {
      date: new Date('2022-05-15T14:30:45'), // 1 year before REGULAR
      referenceDate: TEST_DATES.REGULAR,
      expected: {
        'pt-BR': '15/05/2022',
        'en-US': '15/05/2022'
      }
    }
  ],
  
  // Edge cases
  EDGE_CASES: [
    {
      date: null,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      date: undefined,
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      date: 'invalid-date',
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    }
  ]
};

/**
 * Fixtures for formatJourneyDate function
 */
export const FORMAT_JOURNEY_DATE_FIXTURES = {
  // Health journey (dd/MM/yyyy HH:mm)
  HEALTH_JOURNEY: [
    {
      date: TEST_DATES.REGULAR,
      journeyId: 'health',
      expected: {
        'pt-BR': '15/05/2023 14:30',
        'en-US': '15/05/2023 14:30'
      }
    },
    {
      date: TEST_DATES.FIRST_DAY_OF_YEAR,
      journeyId: 'health',
      expected: {
        'pt-BR': '01/01/2023 00:00',
        'en-US': '01/01/2023 00:00'
      }
    }
  ],
  
  // Care journey (EEE, dd MMM yyyy)
  CARE_JOURNEY: [
    {
      date: TEST_DATES.REGULAR,
      journeyId: 'care',
      expected: {
        'pt-BR': 'seg, 15 mai 2023',
        'en-US': 'Mon, 15 May 2023'
      }
    },
    {
      date: TEST_DATES.FIRST_DAY_OF_YEAR,
      journeyId: 'care',
      expected: {
        'pt-BR': 'dom, 01 jan 2023',
        'en-US': 'Sun, 01 Jan 2023'
      }
    }
  ],
  
  // Plan journey (dd/MM/yyyy)
  PLAN_JOURNEY: [
    {
      date: TEST_DATES.REGULAR,
      journeyId: 'plan',
      expected: {
        'pt-BR': '15/05/2023',
        'en-US': '15/05/2023'
      }
    },
    {
      date: TEST_DATES.FIRST_DAY_OF_YEAR,
      journeyId: 'plan',
      expected: {
        'pt-BR': '01/01/2023',
        'en-US': '01/01/2023'
      }
    }
  ],
  
  // Unknown journey (defaults to dd/MM/yyyy)
  UNKNOWN_JOURNEY: [
    {
      date: TEST_DATES.REGULAR,
      journeyId: 'unknown',
      expected: {
        'pt-BR': '15/05/2023',
        'en-US': '15/05/2023'
      }
    }
  ],
  
  // Edge cases
  EDGE_CASES: [
    {
      date: null,
      journeyId: 'health',
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    },
    {
      date: TEST_DATES.REGULAR,
      journeyId: '',
      expected: {
        'pt-BR': '15/05/2023',
        'en-US': '15/05/2023'
      }
    },
    {
      date: 'invalid-date',
      journeyId: 'care',
      expected: {
        'pt-BR': '',
        'en-US': ''
      }
    }
  ]
};
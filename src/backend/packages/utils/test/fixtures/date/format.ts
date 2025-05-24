/**
 * Test fixtures for date formatting functions
 * 
 * This file provides test fixtures for the following date formatting functions:
 * - formatDate
 * - formatTime
 * - formatDateTime
 * - formatDateRange
 * - formatRelativeDate
 * 
 * Each fixture includes input dates and expected formatted outputs for different locales,
 * formats, and edge cases to ensure comprehensive testing of date formatting functionality.
 */

/**
 * Fixtures for formatDate function
 */
export const formatDateFixtures = [
  // Regular dates with default format
  {
    description: 'Regular date with default format',
    input: new Date(2023, 5, 15), // June 15, 2023
    expected: {
      'pt-BR': {
        default: '15/06/2023'
      },
      'en-US': {
        default: '15/06/2023'
      }
    }
  },
  
  // Different formats
  {
    description: 'Regular date with custom formats',
    input: new Date(2023, 5, 15), // June 15, 2023
    expected: {
      'pt-BR': {
        default: '15/06/2023',
        'yyyy-MM-dd': '2023-06-15',
        'dd MMM yyyy': '15 jun 2023',
        'EEEE, dd \\de MMMM \\de yyyy': 'quinta-feira, 15 de junho de 2023'
      },
      'en-US': {
        default: '15/06/2023',
        'yyyy-MM-dd': '2023-06-15',
        'dd MMM yyyy': '15 Jun 2023',
        'EEEE, MMMM dd, yyyy': 'Thursday, June 15, 2023'
      }
    }
  },
  
  // Edge case: Leap year
  {
    description: 'Leap year date (February 29)',
    input: new Date(2024, 1, 29), // February 29, 2024 (leap year)
    expected: {
      'pt-BR': {
        default: '29/02/2024',
        'dd MMM yyyy': '29 fev 2024'
      },
      'en-US': {
        default: '29/02/2024',
        'dd MMM yyyy': '29 Feb 2024'
      }
    }
  },
  
  // Edge case: Year boundary
  {
    description: 'Year boundary (December 31)',
    input: new Date(2023, 11, 31, 23, 59, 59), // December 31, 2023, 23:59:59
    expected: {
      'pt-BR': {
        default: '31/12/2023'
      },
      'en-US': {
        default: '31/12/2023'
      }
    }
  },
  
  // Edge case: Year start
  {
    description: 'Year start (January 1)',
    input: new Date(2023, 0, 1, 0, 0, 0), // January 1, 2023, 00:00:00
    expected: {
      'pt-BR': {
        default: '01/01/2023'
      },
      'en-US': {
        default: '01/01/2023'
      }
    }
  },
  
  // Edge case: Month with 30 days
  {
    description: 'Month with 30 days (April 30)',
    input: new Date(2023, 3, 30), // April 30, 2023
    expected: {
      'pt-BR': {
        default: '30/04/2023'
      },
      'en-US': {
        default: '30/04/2023'
      }
    }
  },
  
  // Edge case: Month with 31 days
  {
    description: 'Month with 31 days (May 31)',
    input: new Date(2023, 4, 31), // May 31, 2023
    expected: {
      'pt-BR': {
        default: '31/05/2023'
      },
      'en-US': {
        default: '31/05/2023'
      }
    }
  },
  
  // Edge case: Daylight saving time transition (Brazil)
  {
    description: 'Daylight saving time transition in Brazil',
    input: new Date(2023, 9, 15), // October 15, 2023 (near DST transition in Brazil)
    expected: {
      'pt-BR': {
        default: '15/10/2023'
      },
      'en-US': {
        default: '15/10/2023'
      }
    }
  },
  
  // Special date: Brazilian holiday
  {
    description: 'Brazilian holiday (Independence Day)',
    input: new Date(2023, 8, 7), // September 7, 2023 (Brazilian Independence Day)
    expected: {
      'pt-BR': {
        default: '07/09/2023',
        'dd \\de MMMM': '07 de setembro'
      },
      'en-US': {
        default: '07/09/2023',
        'MMMM dd': 'September 07'
      }
    }
  },
  
  // Special date: US holiday
  {
    description: 'US holiday (Independence Day)',
    input: new Date(2023, 6, 4), // July 4, 2023 (US Independence Day)
    expected: {
      'pt-BR': {
        default: '04/07/2023'
      },
      'en-US': {
        default: '04/07/2023',
        'MMMM dd': 'July 04'
      }
    }
  }
];

/**
 * Fixtures for formatTime function
 */
export const formatTimeFixtures = [
  // Regular time with default format
  {
    description: 'Regular time with default format',
    input: new Date(2023, 5, 15, 14, 30, 0), // June 15, 2023, 14:30:00
    expected: {
      'pt-BR': {
        default: '14:30'
      },
      'en-US': {
        default: '14:30'
      }
    }
  },
  
  // Different formats
  {
    description: 'Regular time with custom formats',
    input: new Date(2023, 5, 15, 14, 30, 45), // June 15, 2023, 14:30:45
    expected: {
      'pt-BR': {
        default: '14:30',
        'HH:mm:ss': '14:30:45',
        'h:mm a': '2:30 PM',
        'h:mm:ss.SSS a': '2:30:45.000 PM'
      },
      'en-US': {
        default: '14:30',
        'HH:mm:ss': '14:30:45',
        'h:mm a': '2:30 PM',
        'h:mm:ss.SSS a': '2:30:45.000 PM'
      }
    }
  },
  
  // Edge case: Midnight
  {
    description: 'Midnight',
    input: new Date(2023, 5, 15, 0, 0, 0), // June 15, 2023, 00:00:00
    expected: {
      'pt-BR': {
        default: '00:00',
        'h:mm a': '12:00 AM'
      },
      'en-US': {
        default: '00:00',
        'h:mm a': '12:00 AM'
      }
    }
  },
  
  // Edge case: Noon
  {
    description: 'Noon',
    input: new Date(2023, 5, 15, 12, 0, 0), // June 15, 2023, 12:00:00
    expected: {
      'pt-BR': {
        default: '12:00',
        'h:mm a': '12:00 PM'
      },
      'en-US': {
        default: '12:00',
        'h:mm a': '12:00 PM'
      }
    }
  },
  
  // Edge case: Almost midnight
  {
    description: 'Almost midnight',
    input: new Date(2023, 5, 15, 23, 59, 59), // June 15, 2023, 23:59:59
    expected: {
      'pt-BR': {
        default: '23:59',
        'HH:mm:ss': '23:59:59'
      },
      'en-US': {
        default: '23:59',
        'HH:mm:ss': '23:59:59'
      }
    }
  },
  
  // Edge case: Milliseconds
  {
    description: 'Time with milliseconds',
    input: new Date(2023, 5, 15, 14, 30, 45, 500), // June 15, 2023, 14:30:45.500
    expected: {
      'pt-BR': {
        default: '14:30',
        'HH:mm:ss.SSS': '14:30:45.500'
      },
      'en-US': {
        default: '14:30',
        'HH:mm:ss.SSS': '14:30:45.500'
      }
    }
  },
  
  // Edge case: Daylight saving time transition hour
  {
    description: 'Daylight saving time transition hour',
    input: new Date(2023, 9, 15, 2, 30, 0), // October 15, 2023, 02:30:00 (near DST transition)
    expected: {
      'pt-BR': {
        default: '02:30'
      },
      'en-US': {
        default: '02:30'
      }
    }
  }
];

/**
 * Fixtures for formatDateTime function
 */
export const formatDateTimeFixtures = [
  // Regular date and time with default format
  {
    description: 'Regular date and time with default format',
    input: new Date(2023, 5, 15, 14, 30, 0), // June 15, 2023, 14:30:00
    expected: {
      'pt-BR': {
        default: '15/06/2023 14:30'
      },
      'en-US': {
        default: '15/06/2023 14:30'
      }
    }
  },
  
  // Different formats
  {
    description: 'Regular date and time with custom formats',
    input: new Date(2023, 5, 15, 14, 30, 45), // June 15, 2023, 14:30:45
    expected: {
      'pt-BR': {
        default: '15/06/2023 14:30',
        'yyyy-MM-dd HH:mm:ss': '2023-06-15 14:30:45',
        'dd MMM yyyy, h:mm a': '15 jun 2023, 2:30 PM',
        'EEEE, dd \\de MMMM \\de yyyy, HH:mm': 'quinta-feira, 15 de junho de 2023, 14:30'
      },
      'en-US': {
        default: '15/06/2023 14:30',
        'yyyy-MM-dd HH:mm:ss': '2023-06-15 14:30:45',
        'dd MMM yyyy, h:mm a': '15 Jun 2023, 2:30 PM',
        'EEEE, MMMM dd, yyyy, h:mm a': 'Thursday, June 15, 2023, 2:30 PM'
      }
    }
  },
  
  // Edge case: Leap year with time
  {
    description: 'Leap year date with time',
    input: new Date(2024, 1, 29, 12, 0, 0), // February 29, 2024, 12:00:00 (leap year)
    expected: {
      'pt-BR': {
        default: '29/02/2024 12:00'
      },
      'en-US': {
        default: '29/02/2024 12:00'
      }
    }
  },
  
  // Edge case: Year boundary with time
  {
    description: 'Year boundary with time',
    input: new Date(2023, 11, 31, 23, 59, 59), // December 31, 2023, 23:59:59
    expected: {
      'pt-BR': {
        default: '31/12/2023 23:59',
        'dd/MM/yyyy HH:mm:ss': '31/12/2023 23:59:59'
      },
      'en-US': {
        default: '31/12/2023 23:59',
        'MM/dd/yyyy hh:mm:ss a': '12/31/2023 11:59:59 PM'
      }
    }
  },
  
  // Edge case: Year start with time
  {
    description: 'Year start with time',
    input: new Date(2023, 0, 1, 0, 0, 0), // January 1, 2023, 00:00:00
    expected: {
      'pt-BR': {
        default: '01/01/2023 00:00',
        'dd/MM/yyyy HH:mm:ss': '01/01/2023 00:00:00'
      },
      'en-US': {
        default: '01/01/2023 00:00',
        'MM/dd/yyyy hh:mm:ss a': '01/01/2023 12:00:00 AM'
      }
    }
  },
  
  // Edge case: Daylight saving time transition with time
  {
    description: 'Daylight saving time transition with time',
    input: new Date(2023, 9, 15, 2, 30, 0), // October 15, 2023, 02:30:00 (near DST transition)
    expected: {
      'pt-BR': {
        default: '15/10/2023 02:30'
      },
      'en-US': {
        default: '15/10/2023 02:30'
      }
    }
  },
  
  // Special date: Brazilian holiday with time
  {
    description: 'Brazilian holiday with time',
    input: new Date(2023, 8, 7, 10, 0, 0), // September 7, 2023, 10:00:00 (Brazilian Independence Day)
    expected: {
      'pt-BR': {
        default: '07/09/2023 10:00',
        'dd \\de MMMM, HH:mm': '07 de setembro, 10:00'
      },
      'en-US': {
        default: '07/09/2023 10:00',
        'MMMM dd, h:mm a': 'September 07, 10:00 AM'
      }
    }
  }
];

/**
 * Fixtures for formatDateRange function
 */
export const formatDateRangeFixtures = [
  // Regular date range with default format
  {
    description: 'Regular date range with default format',
    input: {
      startDate: new Date(2023, 5, 15), // June 15, 2023
      endDate: new Date(2023, 5, 20)    // June 20, 2023
    },
    expected: {
      'pt-BR': {
        default: '15/06/2023 - 20/06/2023'
      },
      'en-US': {
        default: '15/06/2023 - 20/06/2023'
      }
    }
  },
  
  // Different formats
  {
    description: 'Date range with custom formats',
    input: {
      startDate: new Date(2023, 5, 15), // June 15, 2023
      endDate: new Date(2023, 5, 20)    // June 20, 2023
    },
    expected: {
      'pt-BR': {
        default: '15/06/2023 - 20/06/2023',
        'yyyy-MM-dd': '2023-06-15 - 2023-06-20',
        'dd MMM yyyy': '15 jun 2023 - 20 jun 2023'
      },
      'en-US': {
        default: '15/06/2023 - 20/06/2023',
        'yyyy-MM-dd': '2023-06-15 - 2023-06-20',
        'dd MMM yyyy': '15 Jun 2023 - 20 Jun 2023',
        'MMMM dd, yyyy': 'June 15, 2023 - June 20, 2023'
      }
    }
  },
  
  // Edge case: Same day range
  {
    description: 'Same day range',
    input: {
      startDate: new Date(2023, 5, 15), // June 15, 2023
      endDate: new Date(2023, 5, 15)    // June 15, 2023
    },
    expected: {
      'pt-BR': {
        default: '15/06/2023 - 15/06/2023'
      },
      'en-US': {
        default: '15/06/2023 - 15/06/2023'
      }
    }
  },
  
  // Edge case: Month boundary
  {
    description: 'Month boundary range',
    input: {
      startDate: new Date(2023, 5, 28), // June 28, 2023
      endDate: new Date(2023, 6, 3)     // July 3, 2023
    },
    expected: {
      'pt-BR': {
        default: '28/06/2023 - 03/07/2023',
        'dd MMM yyyy': '28 jun 2023 - 03 jul 2023'
      },
      'en-US': {
        default: '28/06/2023 - 03/07/2023',
        'dd MMM yyyy': '28 Jun 2023 - 03 Jul 2023',
        'MMMM dd, yyyy': 'June 28, 2023 - July 03, 2023'
      }
    }
  },
  
  // Edge case: Year boundary
  {
    description: 'Year boundary range',
    input: {
      startDate: new Date(2023, 11, 28), // December 28, 2023
      endDate: new Date(2024, 0, 3)      // January 3, 2024
    },
    expected: {
      'pt-BR': {
        default: '28/12/2023 - 03/01/2024',
        'dd MMM yyyy': '28 dez 2023 - 03 jan 2024'
      },
      'en-US': {
        default: '28/12/2023 - 03/01/2024',
        'dd MMM yyyy': '28 Dec 2023 - 03 Jan 2024',
        'MMMM dd, yyyy': 'December 28, 2023 - January 03, 2024'
      }
    }
  },
  
  // Edge case: Long range (months)
  {
    description: 'Long range (months)',
    input: {
      startDate: new Date(2023, 1, 15), // February 15, 2023
      endDate: new Date(2023, 4, 15)    // May 15, 2023
    },
    expected: {
      'pt-BR': {
        default: '15/02/2023 - 15/05/2023',
        'dd MMM yyyy': '15 fev 2023 - 15 mai 2023'
      },
      'en-US': {
        default: '15/02/2023 - 15/05/2023',
        'dd MMM yyyy': '15 Feb 2023 - 15 May 2023'
      }
    }
  },
  
  // Edge case: Long range (years)
  {
    description: 'Long range (years)',
    input: {
      startDate: new Date(2020, 5, 15), // June 15, 2020
      endDate: new Date(2023, 5, 15)    // June 15, 2023
    },
    expected: {
      'pt-BR': {
        default: '15/06/2020 - 15/06/2023',
        'dd MMM yyyy': '15 jun 2020 - 15 jun 2023',
        'MM/yyyy': '06/2020 - 06/2023'
      },
      'en-US': {
        default: '15/06/2020 - 15/06/2023',
        'dd MMM yyyy': '15 Jun 2020 - 15 Jun 2023',
        'MM/yyyy': '06/2020 - 06/2023'
      }
    }
  },
  
  // Edge case: Leap year in range
  {
    description: 'Leap year in range',
    input: {
      startDate: new Date(2024, 1, 28), // February 28, 2024
      endDate: new Date(2024, 2, 1)     // March 1, 2024
    },
    expected: {
      'pt-BR': {
        default: '28/02/2024 - 01/03/2024'
      },
      'en-US': {
        default: '28/02/2024 - 01/03/2024'
      }
    }
  }
];

/**
 * Fixtures for formatRelativeDate function
 */
export const formatRelativeDateFixtures = [
  // Note: These fixtures are relative to the current date when tests run
  // So we'll define them in a way that makes them testable regardless of when tests run
  
  // Today (needs to be calculated at test runtime)
  {
    description: 'Today',
    input: {
      // This will be set to today in tests
      date: 'TODAY',
      referenceDate: 'TODAY'
    },
    expected: {
      'pt-BR': 'Hoje',
      'en-US': 'Today'
    }
  },
  
  // Yesterday (needs to be calculated at test runtime)
  {
    description: 'Yesterday',
    input: {
      // This will be set to yesterday in tests
      date: 'YESTERDAY',
      referenceDate: 'TODAY'
    },
    expected: {
      'pt-BR': 'Ontem',
      'en-US': 'Yesterday'
    }
  },
  
  // Days ago (needs to be calculated at test runtime)
  {
    description: '5 days ago',
    input: {
      // This will be set to 5 days ago in tests
      date: 'DAYS_AGO:5',
      referenceDate: 'TODAY'
    },
    expected: {
      'pt-BR': '5 dias atrás',
      'en-US': '5 days ago'
    }
  },
  
  // Fixed dates (for consistent testing)
  {
    description: 'Fixed date - recent',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      referenceDate: new Date(2023, 5, 20) // June 20, 2023 (5 days later)
    },
    expected: {
      'pt-BR': '5 dias atrás',
      'en-US': '5 days ago'
    }
  },
  
  {
    description: 'Fixed date - older',
    input: {
      date: new Date(2023, 4, 15), // May 15, 2023
      referenceDate: new Date(2023, 5, 20) // June 20, 2023 (more than a month later)
    },
    expected: {
      'pt-BR': '15/05/2023',
      'en-US': '15/05/2023'
    }
  },
  
  // Edge case: Same day, different time
  {
    description: 'Same day, different time',
    input: {
      date: new Date(2023, 5, 15, 10, 0, 0), // June 15, 2023, 10:00:00
      referenceDate: new Date(2023, 5, 15, 15, 0, 0) // June 15, 2023, 15:00:00 (5 hours later)
    },
    expected: {
      'pt-BR': 'Hoje',
      'en-US': 'Today'
    }
  },
  
  // Edge case: Almost yesterday (just after midnight)
  {
    description: 'Almost yesterday (just after midnight)',
    input: {
      date: new Date(2023, 5, 14, 23, 59, 0), // June 14, 2023, 23:59:00
      referenceDate: new Date(2023, 5, 15, 0, 1, 0) // June 15, 2023, 00:01:00 (2 minutes later)
    },
    expected: {
      'pt-BR': 'Ontem',
      'en-US': 'Yesterday'
    }
  },
  
  // Edge case: Month boundary
  {
    description: 'Month boundary',
    input: {
      date: new Date(2023, 4, 31), // May 31, 2023
      referenceDate: new Date(2023, 5, 1) // June 1, 2023 (1 day later)
    },
    expected: {
      'pt-BR': 'Ontem',
      'en-US': 'Yesterday'
    }
  },
  
  // Edge case: Year boundary
  {
    description: 'Year boundary',
    input: {
      date: new Date(2022, 11, 31), // December 31, 2022
      referenceDate: new Date(2023, 0, 1) // January 1, 2023 (1 day later)
    },
    expected: {
      'pt-BR': 'Ontem',
      'en-US': 'Yesterday'
    }
  }
];

/**
 * Combined fixtures for all date formatting functions
 */
export default {
  formatDate: formatDateFixtures,
  formatTime: formatTimeFixtures,
  formatDateTime: formatDateTimeFixtures,
  formatDateRange: formatDateRangeFixtures,
  formatRelativeDate: formatRelativeDateFixtures
};
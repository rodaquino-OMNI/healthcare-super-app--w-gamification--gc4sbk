/**
 * Common date fixtures for testing date-related functionality
 * 
 * This file provides a set of standardized date fixtures used across test files
 * to ensure consistency and reduce duplication in date-related tests.
 */

/**
 * Interface for date fixtures with various formats
 */
export interface DateFixture {
  /** Date object instance */
  date: Date;
  /** ISO string representation */
  isoString: string;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Formatted date string (dd/MM/yyyy) */
  formatted: string;
  /** Formatted date-time string (dd/MM/yyyy HH:mm) */
  formattedDateTime: string;
  /** Formatted time string (HH:mm) */
  formattedTime: string;
}

/**
 * Interface for locale-specific date strings
 */
export interface LocaleDateStrings {
  /** Formatted date in default format */
  date: string;
  /** Formatted date and time */
  dateTime: string;
  /** Formatted time */
  time: string;
  /** Relative date description (today, yesterday, etc.) */
  relative: string;
  /** Time ago description (5 minutes ago, 1 hour ago, etc.) */
  timeAgo: string;
}

/**
 * Interface for timezone-specific date information
 */
export interface TimezoneDate {
  /** Date object in the specific timezone */
  date: Date;
  /** Timezone identifier */
  timezone: string;
  /** Formatted date string in the timezone */
  formatted: string;
  /** ISO string representation */
  isoString: string;
}

// Reference date: 2023-05-15 14:30:45 (fixed date for consistent testing)
const REFERENCE_DATE = new Date(2023, 4, 15, 14, 30, 45);

/**
 * Reference date fixture (2023-05-15 14:30:45)
 */
export const referenceDate: DateFixture = {
  date: REFERENCE_DATE,
  isoString: '2023-05-15T14:30:45.000Z',
  timestamp: REFERENCE_DATE.getTime(),
  formatted: '15/05/2023',
  formattedDateTime: '15/05/2023 14:30',
  formattedTime: '14:30'
};

/**
 * Today's date fixture (set to a fixed date for testing)
 */
export const today: DateFixture = {
  date: REFERENCE_DATE,
  isoString: REFERENCE_DATE.toISOString(),
  timestamp: REFERENCE_DATE.getTime(),
  formatted: '15/05/2023',
  formattedDateTime: '15/05/2023 14:30',
  formattedTime: '14:30'
};

/**
 * Yesterday's date fixture (one day before reference date)
 */
export const yesterday: DateFixture = {
  date: new Date(2023, 4, 14, 14, 30, 45),
  isoString: '2023-05-14T14:30:45.000Z',
  timestamp: new Date(2023, 4, 14, 14, 30, 45).getTime(),
  formatted: '14/05/2023',
  formattedDateTime: '14/05/2023 14:30',
  formattedTime: '14:30'
};

/**
 * Tomorrow's date fixture (one day after reference date)
 */
export const tomorrow: DateFixture = {
  date: new Date(2023, 4, 16, 14, 30, 45),
  isoString: '2023-05-16T14:30:45.000Z',
  timestamp: new Date(2023, 4, 16, 14, 30, 45).getTime(),
  formatted: '16/05/2023',
  formattedDateTime: '16/05/2023 14:30',
  formattedTime: '14:30'
};

/**
 * Last week's date fixture (7 days before reference date)
 */
export const lastWeek: DateFixture = {
  date: new Date(2023, 4, 8, 14, 30, 45),
  isoString: '2023-05-08T14:30:45.000Z',
  timestamp: new Date(2023, 4, 8, 14, 30, 45).getTime(),
  formatted: '08/05/2023',
  formattedDateTime: '08/05/2023 14:30',
  formattedTime: '14:30'
};

/**
 * Next week's date fixture (7 days after reference date)
 */
export const nextWeek: DateFixture = {
  date: new Date(2023, 4, 22, 14, 30, 45),
  isoString: '2023-05-22T14:30:45.000Z',
  timestamp: new Date(2023, 4, 22, 14, 30, 45).getTime(),
  formatted: '22/05/2023',
  formattedDateTime: '22/05/2023 14:30',
  formattedTime: '14:30'
};

/**
 * Last month's date fixture (one month before reference date)
 */
export const lastMonth: DateFixture = {
  date: new Date(2023, 3, 15, 14, 30, 45),
  isoString: '2023-04-15T14:30:45.000Z',
  timestamp: new Date(2023, 3, 15, 14, 30, 45).getTime(),
  formatted: '15/04/2023',
  formattedDateTime: '15/04/2023 14:30',
  formattedTime: '14:30'
};

/**
 * Next month's date fixture (one month after reference date)
 */
export const nextMonth: DateFixture = {
  date: new Date(2023, 5, 15, 14, 30, 45),
  isoString: '2023-06-15T14:30:45.000Z',
  timestamp: new Date(2023, 5, 15, 14, 30, 45).getTime(),
  formatted: '15/06/2023',
  formattedDateTime: '15/06/2023 14:30',
  formattedTime: '14:30'
};

/**
 * Last year's date fixture (one year before reference date)
 */
export const lastYear: DateFixture = {
  date: new Date(2022, 4, 15, 14, 30, 45),
  isoString: '2022-05-15T14:30:45.000Z',
  timestamp: new Date(2022, 4, 15, 14, 30, 45).getTime(),
  formatted: '15/05/2022',
  formattedDateTime: '15/05/2022 14:30',
  formattedTime: '14:30'
};

/**
 * Next year's date fixture (one year after reference date)
 */
export const nextYear: DateFixture = {
  date: new Date(2024, 4, 15, 14, 30, 45),
  isoString: '2024-05-15T14:30:45.000Z',
  timestamp: new Date(2024, 4, 15, 14, 30, 45).getTime(),
  formatted: '15/05/2024',
  formattedDateTime: '15/05/2024 14:30',
  formattedTime: '14:30'
};

/**
 * Birthdate fixture for age calculation tests (30 years before reference date)
 */
export const birthdate: DateFixture = {
  date: new Date(1993, 4, 15, 14, 30, 45),
  isoString: '1993-05-15T14:30:45.000Z',
  timestamp: new Date(1993, 4, 15, 14, 30, 45).getTime(),
  formatted: '15/05/1993',
  formattedDateTime: '15/05/1993 14:30',
  formattedTime: '14:30'
};

/**
 * Date range fixtures for testing date range functions
 */
export const dateRanges = {
  /** This week range (Sunday to Saturday) */
  thisWeek: {
    startDate: new Date(2023, 4, 14), // Sunday
    endDate: new Date(2023, 4, 20),   // Saturday
    formattedRange: '14/05/2023 - 20/05/2023'
  },
  /** This month range */
  thisMonth: {
    startDate: new Date(2023, 4, 1),
    endDate: new Date(2023, 4, 31),
    formattedRange: '01/05/2023 - 31/05/2023'
  },
  /** Last 7 days range */
  last7Days: {
    startDate: new Date(2023, 4, 9),
    endDate: new Date(2023, 4, 15),
    formattedRange: '09/05/2023 - 15/05/2023'
  },
  /** Last 30 days range */
  last30Days: {
    startDate: new Date(2023, 3, 16),
    endDate: new Date(2023, 4, 15),
    formattedRange: '16/04/2023 - 15/05/2023'
  },
  /** Custom date range */
  custom: {
    startDate: new Date(2023, 3, 1),
    endDate: new Date(2023, 5, 30),
    formattedRange: '01/04/2023 - 30/06/2023'
  }
};

/**
 * Locale-specific date strings for pt-BR locale
 */
export const ptBRDateStrings: LocaleDateStrings = {
  date: '15/05/2023',
  dateTime: '15/05/2023 14:30',
  time: '14:30',
  relative: 'Hoje',
  timeAgo: '0 segundos atrás'
};

/**
 * Locale-specific date strings for en-US locale
 */
export const enUSDateStrings: LocaleDateStrings = {
  date: '05/15/2023',
  dateTime: '05/15/2023 2:30 PM',
  time: '2:30 PM',
  relative: 'Today',
  timeAgo: '0 seconds ago'
};

/**
 * Journey-specific formatted dates
 */
export const journeyDates = {
  /** Health journey formatted dates */
  health: {
    ptBR: '15/05/2023 14:30',
    enUS: '05/15/2023 2:30 PM'
  },
  /** Care journey formatted dates */
  care: {
    ptBR: 'seg, 15 mai 2023',
    enUS: 'Mon, May 15 2023'
  },
  /** Plan journey formatted dates */
  plan: {
    ptBR: '15/05/2023',
    enUS: '05/15/2023'
  }
};

/**
 * Timezone-specific date fixtures
 */
export const timezoneDates: Record<string, TimezoneDate> = {
  /** UTC timezone */
  UTC: {
    date: new Date('2023-05-15T14:30:45.000Z'),
    timezone: 'UTC',
    formatted: '15/05/2023 14:30',
    isoString: '2023-05-15T14:30:45.000Z'
  },
  /** Brasília timezone (UTC-3) */
  'America/Sao_Paulo': {
    date: new Date('2023-05-15T11:30:45.000-03:00'),
    timezone: 'America/Sao_Paulo',
    formatted: '15/05/2023 11:30',
    isoString: '2023-05-15T14:30:45.000Z' // Equivalent UTC time
  },
  /** New York timezone (UTC-4 or UTC-5 depending on DST) */
  'America/New_York': {
    date: new Date('2023-05-15T10:30:45.000-04:00'),
    timezone: 'America/New_York',
    formatted: '15/05/2023 10:30',
    isoString: '2023-05-15T14:30:45.000Z' // Equivalent UTC time
  },
  /** Tokyo timezone (UTC+9) */
  'Asia/Tokyo': {
    date: new Date('2023-05-15T23:30:45.000+09:00'),
    timezone: 'Asia/Tokyo',
    formatted: '15/05/2023 23:30',
    isoString: '2023-05-15T14:30:45.000Z' // Equivalent UTC time
  }
};

/**
 * Invalid date fixtures for testing error handling
 */
export const invalidDates = {
  /** Invalid date string */
  invalidString: 'not-a-date',
  /** Invalid date object */
  invalidDate: new Date('invalid-date'),
  /** Null value */
  nullDate: null,
  /** Undefined value */
  undefinedDate: undefined
};

/**
 * Date format strings for testing
 */
export const dateFormats = {
  /** Default date format (dd/MM/yyyy) */
  default: 'dd/MM/yyyy',
  /** Default date-time format (dd/MM/yyyy HH:mm) */
  dateTime: 'dd/MM/yyyy HH:mm',
  /** Default time format (HH:mm) */
  time: 'HH:mm',
  /** ISO date format (yyyy-MM-dd) */
  iso: 'yyyy-MM-dd',
  /** Full date format with day name (EEEE, dd 'de' MMMM 'de' yyyy) */
  full: 'EEEE, dd \'de\' MMMM \'de\' yyyy',
  /** Short date format (dd/MM/yy) */
  short: 'dd/MM/yy',
  /** US date format (MM/dd/yyyy) */
  us: 'MM/dd/yyyy',
  /** Custom format for specific use cases */
  custom: 'dd MMM yyyy, HH:mm'
};

/**
 * Time-specific fixtures for testing time functions
 */
export const timeFixtures = {
  /** Morning time (9:30 AM) */
  morning: {
    date: new Date(2023, 4, 15, 9, 30, 0),
    formatted: '09:30',
    formattedAmPm: '9:30 AM'
  },
  /** Noon time (12:00 PM) */
  noon: {
    date: new Date(2023, 4, 15, 12, 0, 0),
    formatted: '12:00',
    formattedAmPm: '12:00 PM'
  },
  /** Afternoon time (2:30 PM) */
  afternoon: {
    date: new Date(2023, 4, 15, 14, 30, 0),
    formatted: '14:30',
    formattedAmPm: '2:30 PM'
  },
  /** Evening time (8:45 PM) */
  evening: {
    date: new Date(2023, 4, 15, 20, 45, 0),
    formatted: '20:45',
    formattedAmPm: '8:45 PM'
  },
  /** Midnight time (12:00 AM) */
  midnight: {
    date: new Date(2023, 4, 15, 0, 0, 0),
    formatted: '00:00',
    formattedAmPm: '12:00 AM'
  }
};
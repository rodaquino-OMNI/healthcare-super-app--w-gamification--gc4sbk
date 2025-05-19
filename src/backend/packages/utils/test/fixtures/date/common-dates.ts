/**
 * Common date fixtures for testing date utilities
 * 
 * This file provides a set of standardized date fixtures used across test files
 * to ensure consistency and reduce duplication in date-related tests.
 */

/**
 * Interface for date fixture objects
 */
export interface DateFixture {
  /** Date object representation */
  date: Date;
  /** ISO string representation */
  isoString: string;
  /** Timestamp (milliseconds since epoch) */
  timestamp: number;
}

/**
 * Interface for formatted date strings
 */
export interface FormattedDateFixture {
  /** Date formatted as dd/MM/yyyy */
  dateFormat: string;
  /** Time formatted as HH:mm */
  timeFormat: string;
  /** Date and time formatted as dd/MM/yyyy HH:mm */
  dateTimeFormat: string;
  /** Date formatted for the Health journey */
  healthFormat: string;
  /** Date formatted for the Care journey */
  careFormat: string;
  /** Date formatted for the Plan journey */
  planFormat: string;
}

/**
 * Interface for locale-specific date strings
 */
export interface LocaleDateFixture {
  /** Formatted date strings for pt-BR locale */
  ptBR: FormattedDateFixture;
  /** Formatted date strings for en-US locale */
  enUS: FormattedDateFixture;
}

// Reference date: 2023-06-15T14:30:45.000Z (fixed date for consistent testing)
export const REFERENCE_DATE: DateFixture = {
  date: new Date('2023-06-15T14:30:45.000Z'),
  isoString: '2023-06-15T14:30:45.000Z',
  timestamp: 1686839445000
};

// Today's date at noon (dynamically set but with fixed time for consistency)
export const TODAY: DateFixture = (() => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return {
    date: today,
    isoString: today.toISOString(),
    timestamp: today.getTime()
  };
})();

// Yesterday's date at noon
export const YESTERDAY: DateFixture = (() => {
  const yesterday = new Date(TODAY.date);
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    date: yesterday,
    isoString: yesterday.toISOString(),
    timestamp: yesterday.getTime()
  };
})();

// Tomorrow's date at noon
export const TOMORROW: DateFixture = (() => {
  const tomorrow = new Date(TODAY.date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    date: tomorrow,
    isoString: tomorrow.toISOString(),
    timestamp: tomorrow.getTime()
  };
})();

// First day of current month
export const FIRST_DAY_OF_MONTH: DateFixture = (() => {
  const firstDay = new Date(TODAY.date);
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);
  return {
    date: firstDay,
    isoString: firstDay.toISOString(),
    timestamp: firstDay.getTime()
  };
})();

// Last day of current month
export const LAST_DAY_OF_MONTH: DateFixture = (() => {
  const lastDay = new Date(TODAY.date);
  lastDay.setMonth(lastDay.getMonth() + 1);
  lastDay.setDate(0);
  lastDay.setHours(23, 59, 59, 999);
  return {
    date: lastDay,
    isoString: lastDay.toISOString(),
    timestamp: lastDay.getTime()
  };
})();

// Specific dates for testing age calculations
export const BIRTHDATE_18_YEARS_AGO: DateFixture = (() => {
  const date = new Date(TODAY.date);
  date.setFullYear(date.getFullYear() - 18);
  return {
    date,
    isoString: date.toISOString(),
    timestamp: date.getTime()
  };
})();

export const BIRTHDATE_65_YEARS_AGO: DateFixture = (() => {
  const date = new Date(TODAY.date);
  date.setFullYear(date.getFullYear() - 65);
  return {
    date,
    isoString: date.toISOString(),
    timestamp: date.getTime()
  };
})();

// Timezone-specific dates for global testing
export const TIMEZONE_DATES = {
  UTC: new Date('2023-06-15T12:00:00.000Z'),
  BRAZIL: new Date('2023-06-15T12:00:00.000-03:00'), // São Paulo (BRT)
  NEW_YORK: new Date('2023-06-15T12:00:00.000-04:00'), // Eastern Time
  LONDON: new Date('2023-06-15T12:00:00.000+01:00'), // British Summer Time
  TOKYO: new Date('2023-06-15T12:00:00.000+09:00') // Japan Standard Time
};

// Formatted reference date strings for different locales
export const FORMATTED_REFERENCE_DATE: LocaleDateFixture = {
  ptBR: {
    dateFormat: '15/06/2023',
    timeFormat: '14:30',
    dateTimeFormat: '15/06/2023 14:30',
    healthFormat: '15/06/2023 14:30',
    careFormat: 'qui, 15 jun 2023',
    planFormat: '15/06/2023'
  },
  enUS: {
    dateFormat: '06/15/2023',
    timeFormat: '2:30 PM',
    dateTimeFormat: '06/15/2023 2:30 PM',
    healthFormat: '06/15/2023 2:30 PM',
    careFormat: 'Thu, Jun 15 2023',
    planFormat: '06/15/2023'
  }
};

// Date ranges for testing
export const DATE_RANGES = {
  WEEK: {
    start: (() => {
      const date = new Date(REFERENCE_DATE.date);
      date.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      date.setHours(0, 0, 0, 0);
      return date;
    })(),
    end: (() => {
      const date = new Date(REFERENCE_DATE.date);
      date.setDate(date.getDate() + (6 - date.getDay())); // End of week (Saturday)
      date.setHours(23, 59, 59, 999);
      return date;
    })()
  },
  MONTH: {
    start: (() => {
      const date = new Date(REFERENCE_DATE.date);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;
    })(),
    end: (() => {
      const date = new Date(REFERENCE_DATE.date);
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
      return date;
    })()
  },
  YEAR: {
    start: (() => {
      const date = new Date(REFERENCE_DATE.date);
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
      return date;
    })(),
    end: (() => {
      const date = new Date(REFERENCE_DATE.date);
      date.setMonth(11, 31);
      date.setHours(23, 59, 59, 999);
      return date;
    })()
  }
};

// Relative time strings for testing getTimeAgo function
export const RELATIVE_TIME_STRINGS = {
  ptBR: {
    justNow: '0 segundos atrás',
    oneMinute: '1 minuto atrás',
    fiveMinutes: '5 minutos atrás',
    oneHour: '1 hora atrás',
    threeHours: '3 horas atrás',
    oneDay: '1 dia atrás',
    threeDays: '3 dias atrás',
    oneWeek: '1 semana atrás',
    twoWeeks: '2 semanas atrás',
    oneMonth: '1 mês atrás',
    sixMonths: '6 meses atrás',
    oneYear: '1 ano atrás',
    fiveYears: '5 anos atrás'
  },
  enUS: {
    justNow: '0 seconds ago',
    oneMinute: '1 minute ago',
    fiveMinutes: '5 minutes ago',
    oneHour: '1 hour ago',
    threeHours: '3 hours ago',
    oneDay: '1 day ago',
    threeDays: '3 days ago',
    oneWeek: '1 week ago',
    twoWeeks: '2 weeks ago',
    oneMonth: '1 month ago',
    sixMonths: '6 months ago',
    oneYear: '1 year ago',
    fiveYears: '5 years ago'
  }
};

// Journey-specific test dates
export const JOURNEY_TEST_DATES = {
  HEALTH: {
    metrics: [
      new Date('2023-06-01T08:00:00.000Z'),
      new Date('2023-06-02T08:00:00.000Z'),
      new Date('2023-06-03T08:00:00.000Z'),
      new Date('2023-06-04T08:00:00.000Z'),
      new Date('2023-06-05T08:00:00.000Z')
    ],
    goals: {
      start: new Date('2023-06-01T00:00:00.000Z'),
      end: new Date('2023-06-30T23:59:59.999Z')
    }
  },
  CARE: {
    appointments: [
      new Date('2023-06-15T09:00:00.000Z'),
      new Date('2023-06-16T14:30:00.000Z'),
      new Date('2023-06-20T11:15:00.000Z')
    ],
    medications: {
      start: new Date('2023-06-01T00:00:00.000Z'),
      end: new Date('2023-07-01T00:00:00.000Z')
    }
  },
  PLAN: {
    claims: [
      new Date('2023-05-10T00:00:00.000Z'),
      new Date('2023-05-25T00:00:00.000Z'),
      new Date('2023-06-05T00:00:00.000Z')
    ],
    coverage: {
      start: new Date('2023-01-01T00:00:00.000Z'),
      end: new Date('2023-12-31T23:59:59.999Z')
    }
  }
};

// Invalid dates for testing error handling
export const INVALID_DATES = {
  invalidString: 'not-a-date',
  invalidDate: new Date('invalid-date'),
  nullDate: null,
  undefinedDate: undefined
};
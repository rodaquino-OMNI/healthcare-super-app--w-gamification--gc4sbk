/**
 * Test fixtures for journey-specific date formatting functions
 * These fixtures ensure consistent date representation across journey services
 * according to their specific requirements.
 */

// Test dates to use across all journey contexts
export const testDates = {
  // Regular date during business hours
  businessHours: new Date('2023-05-15T14:30:00'),
  // Date with midnight time
  midnight: new Date('2023-05-15T00:00:00'),
  // Weekend date
  weekend: new Date('2023-05-13T10:15:00'), // Saturday
  // Date with single-digit day and month
  singleDigits: new Date('2023-01-05T08:45:00'),
  // Future date
  future: new Date('2024-12-31T23:59:59'),
  // Past date from previous year
  pastYear: new Date('2022-03-10T16:20:00'),
};

// Expected formatted outputs for Health journey
export const healthJourneyFormats = {
  // Portuguese (Brazil) locale
  'pt-BR': {
    businessHours: '15/05/2023 14:30',
    midnight: '15/05/2023 00:00',
    weekend: '13/05/2023 10:15',
    singleDigits: '05/01/2023 08:45',
    future: '31/12/2024 23:59',
    pastYear: '10/03/2022 16:20',
  },
  // English (US) locale
  'en-US': {
    businessHours: '05/15/2023 14:30',
    midnight: '05/15/2023 00:00',
    weekend: '05/13/2023 10:15',
    singleDigits: '01/05/2023 08:45',
    future: '12/31/2024 23:59',
    pastYear: '03/10/2022 16:20',
  },
};

// Expected formatted outputs for Care journey
export const careJourneyFormats = {
  // Portuguese (Brazil) locale
  'pt-BR': {
    businessHours: 'seg, 15 mai 2023',
    midnight: 'seg, 15 mai 2023',
    weekend: 'sáb, 13 mai 2023',
    singleDigits: 'qui, 05 jan 2023',
    future: 'ter, 31 dez 2024',
    pastYear: 'qui, 10 mar 2022',
  },
  // English (US) locale
  'en-US': {
    businessHours: 'Mon, 15 May 2023',
    midnight: 'Mon, 15 May 2023',
    weekend: 'Sat, 13 May 2023',
    singleDigits: 'Thu, 05 Jan 2023',
    future: 'Tue, 31 Dec 2024',
    pastYear: 'Thu, 10 Mar 2022',
  },
};

// Expected formatted outputs for Plan journey
export const planJourneyFormats = {
  // Portuguese (Brazil) locale
  'pt-BR': {
    businessHours: '15/05/2023',
    midnight: '15/05/2023',
    weekend: '13/05/2023',
    singleDigits: '05/01/2023',
    future: '31/12/2024',
    pastYear: '10/03/2022',
  },
  // English (US) locale
  'en-US': {
    businessHours: '05/15/2023',
    midnight: '05/15/2023',
    weekend: '05/13/2023',
    singleDigits: '01/05/2023',
    future: '12/31/2024',
    pastYear: '03/10/2022',
  },
};

// Expected formatted outputs for default format (when invalid journey ID is provided)
export const defaultJourneyFormats = {
  // Portuguese (Brazil) locale
  'pt-BR': {
    businessHours: '15/05/2023',
    midnight: '15/05/2023',
    weekend: '13/05/2023',
    singleDigits: '05/01/2023',
    future: '31/12/2024',
    pastYear: '10/03/2022',
  },
  // English (US) locale
  'en-US': {
    businessHours: '05/15/2023',
    midnight: '05/15/2023',
    weekend: '05/13/2023',
    singleDigits: '01/05/2023',
    future: '12/31/2024',
    pastYear: '03/10/2022',
  },
};

// Test cases for invalid journey identifiers
export const invalidJourneyIds = [
  '',
  'unknown',
  'invalid-journey',
  'healthx',
  'carex',
  'planx',
  null,
  undefined,
];

// Combined journey formats for easy access
export const journeyFormats = {
  health: healthJourneyFormats,
  care: careJourneyFormats,
  plan: planJourneyFormats,
  default: defaultJourneyFormats,
};

// Journey-specific date format patterns (for reference)
export const journeyFormatPatterns = {
  health: 'dd/MM/yyyy HH:mm',
  care: 'EEE, dd MMM yyyy',
  plan: 'dd/MM/yyyy',
  default: 'dd/MM/yyyy',
};

// Test case for empty/invalid dates
export const invalidDates = [
  null,
  undefined,
  '',
  'not-a-date',
  '2023-13-45', // Invalid month and day
  {}, // Invalid object
];
/**
 * Test fixtures for date calculation functions
 * 
 * This file contains test fixtures for the following date utility functions:
 * - calculateAge: Calculates age in years based on birthdate and reference date
 * - getTimeAgo: Returns a human-readable string representing time elapsed since a given date
 */

/**
 * Interface for age calculation test fixtures
 */
export interface AgeCalculationFixture {
  /** The birthdate to test */
  birthdate: Date;
  /** The reference date to calculate age against (defaults to current date in actual function) */
  referenceDate: Date;
  /** The expected age result */
  expectedAge: number;
  /** A human-readable description of the test case */
  description: string;
}

/**
 * Interface for time ago calculation test fixtures
 */
export interface TimeAgoFixture {
  /** The timestamp to calculate time ago from */
  timestamp: Date;
  /** The reference date to use as "now" */
  referenceDate: Date;
  /** The expected formatted string */
  expectedOutput: string;
  /** The locale to use (pt-BR or en-US) */
  locale: 'pt-BR' | 'en-US';
  /** A human-readable description of the test case */
  description: string;
}

/**
 * Age calculation test fixtures
 * 
 * These fixtures test the calculateAge function with various birthdates and reference dates
 */
export const ageCalculationFixtures: AgeCalculationFixture[] = [
  // Standard cases
  {
    birthdate: new Date('1990-01-01T00:00:00Z'),
    referenceDate: new Date('2020-01-01T00:00:00Z'),
    expectedAge: 30,
    description: 'Standard case: 30 years difference'
  },
  {
    birthdate: new Date('1990-01-01T00:00:00Z'),
    referenceDate: new Date('2020-12-31T23:59:59Z'),
    expectedAge: 30,
    description: 'Same year, before birthday'
  },
  {
    birthdate: new Date('1990-06-15T00:00:00Z'),
    referenceDate: new Date('2020-06-14T23:59:59Z'),
    expectedAge: 29,
    description: 'One day before birthday'
  },
  {
    birthdate: new Date('1990-06-15T00:00:00Z'),
    referenceDate: new Date('2020-06-15T00:00:00Z'),
    expectedAge: 30,
    description: 'Exactly on birthday'
  },
  {
    birthdate: new Date('1990-06-15T12:30:45Z'),
    referenceDate: new Date('2020-06-15T00:00:00Z'),
    expectedAge: 30,
    description: 'On birthday but different time'
  },
  
  // Edge cases
  {
    birthdate: new Date('2000-02-29T00:00:00Z'), // Leap year
    referenceDate: new Date('2020-02-28T23:59:59Z'),
    expectedAge: 19,
    description: 'Leap year birthdate, before Feb 29 on non-leap year'
  },
  {
    birthdate: new Date('2000-02-29T00:00:00Z'), // Leap year
    referenceDate: new Date('2020-03-01T00:00:00Z'),
    expectedAge: 20,
    description: 'Leap year birthdate, after Feb 29 on non-leap year'
  },
  {
    birthdate: new Date('2000-02-29T00:00:00Z'), // Leap year
    referenceDate: new Date('2020-02-29T00:00:00Z'), // Leap year
    expectedAge: 20,
    description: 'Leap year birthdate, exactly on Feb 29 on leap year'
  },
  {
    birthdate: new Date('2023-01-01T00:00:00Z'),
    referenceDate: new Date('2023-01-01T00:00:00Z'),
    expectedAge: 0,
    description: 'Same date (newborn)'
  },
  {
    birthdate: new Date('2023-01-01T00:00:00Z'),
    referenceDate: new Date('2023-12-31T23:59:59Z'),
    expectedAge: 0,
    description: 'Less than one year old'
  },
  
  // Extreme cases
  {
    birthdate: new Date('1900-01-01T00:00:00Z'),
    referenceDate: new Date('2023-01-01T00:00:00Z'),
    expectedAge: 123,
    description: 'Very old age (123 years)'
  },
  {
    birthdate: new Date('2023-12-31T23:59:59Z'),
    referenceDate: new Date('2023-01-01T00:00:00Z'),
    expectedAge: 0,
    description: 'Future birthdate (should still return 0)'
  }
];

/**
 * Time ago test fixtures for Portuguese locale (pt-BR)
 * 
 * These fixtures test the getTimeAgo function with various timestamps and the pt-BR locale
 */
export const timeAgoFixturesPtBR: TimeAgoFixture[] = [
  // Seconds
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:00:30Z'),
    expectedOutput: '30 segundos atrás',
    locale: 'pt-BR',
    description: 'Seconds ago in Portuguese'
  },
  
  // Minutes
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:01:00Z'),
    expectedOutput: '1 minuto atrás',
    locale: 'pt-BR',
    description: 'One minute ago in Portuguese'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:30:00Z'),
    expectedOutput: '30 minutos atrás',
    locale: 'pt-BR',
    description: 'Multiple minutes ago in Portuguese'
  },
  
  // Hours
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T13:00:00Z'),
    expectedOutput: '1 hora atrás',
    locale: 'pt-BR',
    description: 'One hour ago in Portuguese'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T18:00:00Z'),
    expectedOutput: '6 horas atrás',
    locale: 'pt-BR',
    description: 'Multiple hours ago in Portuguese'
  },
  
  // Days
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-02T12:00:00Z'),
    expectedOutput: '1 dia atrás',
    locale: 'pt-BR',
    description: 'One day ago in Portuguese'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-05T12:00:00Z'),
    expectedOutput: '4 dias atrás',
    locale: 'pt-BR',
    description: 'Multiple days ago in Portuguese'
  },
  
  // Weeks
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-08T12:00:00Z'),
    expectedOutput: '1 semana atrás',
    locale: 'pt-BR',
    description: 'One week ago in Portuguese'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-22T12:00:00Z'),
    expectedOutput: '3 semanas atrás',
    locale: 'pt-BR',
    description: 'Multiple weeks ago in Portuguese'
  },
  
  // Months
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-02-01T12:00:00Z'),
    expectedOutput: '1 mês atrás',
    locale: 'pt-BR',
    description: 'One month ago in Portuguese'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-06-01T12:00:00Z'),
    expectedOutput: '5 meses atrás',
    locale: 'pt-BR',
    description: 'Multiple months ago in Portuguese'
  },
  
  // Years
  {
    timestamp: new Date('2022-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:00:00Z'),
    expectedOutput: '1 ano atrás',
    locale: 'pt-BR',
    description: 'One year ago in Portuguese'
  },
  {
    timestamp: new Date('2020-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:00:00Z'),
    expectedOutput: '3 anos atrás',
    locale: 'pt-BR',
    description: 'Multiple years ago in Portuguese'
  },
  
  // Edge cases
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:00:00Z'),
    expectedOutput: '0 segundos atrás',
    locale: 'pt-BR',
    description: 'Same time in Portuguese'
  },
  {
    timestamp: new Date('2023-02-28T12:00:00Z'),
    referenceDate: new Date('2023-03-01T12:00:00Z'),
    expectedOutput: '1 dia atrás',
    locale: 'pt-BR',
    description: 'Month boundary in Portuguese'
  },
  {
    timestamp: new Date('2020-02-29T12:00:00Z'), // Leap year
    referenceDate: new Date('2021-03-01T12:00:00Z'),
    expectedOutput: '1 ano atrás',
    locale: 'pt-BR',
    description: 'Leap year boundary in Portuguese'
  }
];

/**
 * Time ago test fixtures for English locale (en-US)
 * 
 * These fixtures test the getTimeAgo function with various timestamps and the en-US locale
 */
export const timeAgoFixturesEnUS: TimeAgoFixture[] = [
  // Seconds
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:00:30Z'),
    expectedOutput: '30 seconds ago',
    locale: 'en-US',
    description: 'Seconds ago in English'
  },
  
  // Minutes
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:01:00Z'),
    expectedOutput: '1 minute ago',
    locale: 'en-US',
    description: 'One minute ago in English'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:30:00Z'),
    expectedOutput: '30 minutes ago',
    locale: 'en-US',
    description: 'Multiple minutes ago in English'
  },
  
  // Hours
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T13:00:00Z'),
    expectedOutput: '1 hour ago',
    locale: 'en-US',
    description: 'One hour ago in English'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T18:00:00Z'),
    expectedOutput: '6 hours ago',
    locale: 'en-US',
    description: 'Multiple hours ago in English'
  },
  
  // Days
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-02T12:00:00Z'),
    expectedOutput: '1 day ago',
    locale: 'en-US',
    description: 'One day ago in English'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-05T12:00:00Z'),
    expectedOutput: '4 days ago',
    locale: 'en-US',
    description: 'Multiple days ago in English'
  },
  
  // Weeks
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-08T12:00:00Z'),
    expectedOutput: '1 week ago',
    locale: 'en-US',
    description: 'One week ago in English'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-22T12:00:00Z'),
    expectedOutput: '3 weeks ago',
    locale: 'en-US',
    description: 'Multiple weeks ago in English'
  },
  
  // Months
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-02-01T12:00:00Z'),
    expectedOutput: '1 month ago',
    locale: 'en-US',
    description: 'One month ago in English'
  },
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-06-01T12:00:00Z'),
    expectedOutput: '5 months ago',
    locale: 'en-US',
    description: 'Multiple months ago in English'
  },
  
  // Years
  {
    timestamp: new Date('2022-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:00:00Z'),
    expectedOutput: '1 year ago',
    locale: 'en-US',
    description: 'One year ago in English'
  },
  {
    timestamp: new Date('2020-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:00:00Z'),
    expectedOutput: '3 years ago',
    locale: 'en-US',
    description: 'Multiple years ago in English'
  },
  
  // Edge cases
  {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    referenceDate: new Date('2023-01-01T12:00:00Z'),
    expectedOutput: '0 seconds ago',
    locale: 'en-US',
    description: 'Same time in English'
  },
  {
    timestamp: new Date('2023-02-28T12:00:00Z'),
    referenceDate: new Date('2023-03-01T12:00:00Z'),
    expectedOutput: '1 day ago',
    locale: 'en-US',
    description: 'Month boundary in English'
  },
  {
    timestamp: new Date('2020-02-29T12:00:00Z'), // Leap year
    referenceDate: new Date('2021-03-01T12:00:00Z'),
    expectedOutput: '1 year ago',
    locale: 'en-US',
    description: 'Leap year boundary in English'
  }
];

/**
 * Combined time ago test fixtures for all locales
 */
export const timeAgoFixtures: TimeAgoFixture[] = [
  ...timeAgoFixturesPtBR,
  ...timeAgoFixturesEnUS
];

/**
 * Journey-specific age calculation test fixtures
 * 
 * These fixtures test the calculateAge function in the context of different journeys
 */
export const journeyAgeCalculationFixtures: Record<string, AgeCalculationFixture[]> = {
  health: [
    // Health journey often needs precise age for medical calculations
    {
      birthdate: new Date('1990-01-01T00:00:00Z'),
      referenceDate: new Date('2023-01-01T00:00:00Z'),
      expectedAge: 33,
      description: 'Adult age for health metrics'
    },
    {
      birthdate: new Date('2020-01-01T00:00:00Z'),
      referenceDate: new Date('2023-01-01T00:00:00Z'),
      expectedAge: 3,
      description: 'Child age for pediatric health metrics'
    },
    {
      birthdate: new Date('1950-01-01T00:00:00Z'),
      referenceDate: new Date('2023-01-01T00:00:00Z'),
      expectedAge: 73,
      description: 'Senior age for geriatric health metrics'
    }
  ],
  care: [
    // Care journey needs age for appointment scheduling and provider matching
    {
      birthdate: new Date('1990-01-01T00:00:00Z'),
      referenceDate: new Date('2023-01-01T00:00:00Z'),
      expectedAge: 33,
      description: 'Adult age for general practitioner matching'
    },
    {
      birthdate: new Date('2020-01-01T00:00:00Z'),
      referenceDate: new Date('2023-01-01T00:00:00Z'),
      expectedAge: 3,
      description: 'Child age for pediatrician matching'
    }
  ],
  plan: [
    // Plan journey needs age for insurance coverage and benefits
    {
      birthdate: new Date('1990-01-01T00:00:00Z'),
      referenceDate: new Date('2023-01-01T00:00:00Z'),
      expectedAge: 33,
      description: 'Adult age for insurance premium calculation'
    },
    {
      birthdate: new Date('1950-01-01T00:00:00Z'),
      referenceDate: new Date('2023-01-01T00:00:00Z'),
      expectedAge: 73,
      description: 'Senior age for Medicare-equivalent benefits'
    },
    {
      birthdate: new Date('2005-01-01T00:00:00Z'),
      referenceDate: new Date('2023-01-01T00:00:00Z'),
      expectedAge: 18,
      description: 'Young adult age for dependent coverage transition'
    }
  ]
};
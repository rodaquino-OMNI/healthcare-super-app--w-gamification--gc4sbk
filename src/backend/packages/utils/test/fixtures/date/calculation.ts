/**
 * Test fixtures for date calculation functions
 * 
 * This file provides test fixtures for the following date calculation functions:
 * - calculateAge: Calculates age in years based on birthdate and reference date
 * - getTimeAgo: Returns a human-readable string representing time elapsed since a given date
 */

/**
 * Interface for age calculation test fixtures
 */
export interface AgeCalculationFixture {
  /** Description of the test case */
  description: string;
  /** Birthdate as ISO string */
  birthdate: string;
  /** Reference date as ISO string */
  referenceDate: string;
  /** Expected age in years */
  expectedAge: number;
}

/**
 * Interface for time ago test fixtures
 */
export interface TimeAgoFixture {
  /** Description of the test case */
  description: string;
  /** Date to calculate time elapsed from as ISO string */
  date: string;
  /** Reference date (now) as ISO string */
  referenceDate: string;
  /** Expected output in pt-BR locale */
  expectedPtBR: string;
  /** Expected output in en-US locale */
  expectedEnUS: string;
}

/**
 * Test fixtures for calculateAge function
 */
export const ageCalculationFixtures: AgeCalculationFixture[] = [
  // Standard cases
  {
    description: 'Adult with birthday already passed in reference year',
    birthdate: '1990-05-15T00:00:00.000Z',
    referenceDate: '2023-10-20T00:00:00.000Z',
    expectedAge: 33
  },
  {
    description: 'Adult with birthday not yet passed in reference year',
    birthdate: '1990-11-15T00:00:00.000Z',
    referenceDate: '2023-10-20T00:00:00.000Z',
    expectedAge: 32
  },
  {
    description: 'Child under 1 year',
    birthdate: '2023-01-15T00:00:00.000Z',
    referenceDate: '2023-10-20T00:00:00.000Z',
    expectedAge: 0
  },
  {
    description: 'Exactly 1 year old on birthday',
    birthdate: '2022-10-20T00:00:00.000Z',
    referenceDate: '2023-10-20T00:00:00.000Z',
    expectedAge: 1
  },
  
  // Edge cases
  {
    description: 'Born on February 29 (leap year), reference on February 28 (non-leap year)',
    birthdate: '2000-02-29T00:00:00.000Z',
    referenceDate: '2023-02-28T00:00:00.000Z',
    expectedAge: 22
  },
  {
    description: 'Born on February 29 (leap year), reference on March 1 (non-leap year)',
    birthdate: '2000-02-29T00:00:00.000Z',
    referenceDate: '2023-03-01T00:00:00.000Z',
    expectedAge: 23
  },
  {
    description: 'Born on December 31, reference on December 30 (next year)',
    birthdate: '2000-12-31T00:00:00.000Z',
    referenceDate: '2001-12-30T00:00:00.000Z',
    expectedAge: 0
  },
  {
    description: 'Born on December 31, reference on December 31 (next year)',
    birthdate: '2000-12-31T00:00:00.000Z',
    referenceDate: '2001-12-31T00:00:00.000Z',
    expectedAge: 1
  },
  {
    description: 'Born on January 1, reference on December 31 (same year)',
    birthdate: '2000-01-01T00:00:00.000Z',
    referenceDate: '2000-12-31T00:00:00.000Z',
    expectedAge: 0
  },
  
  // Special cases for health journey
  {
    description: 'Senior citizen (65+) for health journey benefits',
    birthdate: '1950-06-15T00:00:00.000Z',
    referenceDate: '2023-10-20T00:00:00.000Z',
    expectedAge: 73
  },
  {
    description: 'Pediatric patient (under 18) for health journey',
    birthdate: '2010-06-15T00:00:00.000Z',
    referenceDate: '2023-10-20T00:00:00.000Z',
    expectedAge: 13
  },
  
  // Same day (age 0)
  {
    description: 'Born today (age 0)',
    birthdate: '2023-10-20T10:00:00.000Z',
    referenceDate: '2023-10-20T15:00:00.000Z',
    expectedAge: 0
  },
  
  // Day before/after birthday
  {
    description: 'One day before birthday',
    birthdate: '2000-10-21T00:00:00.000Z',
    referenceDate: '2023-10-20T00:00:00.000Z',
    expectedAge: 22
  },
  {
    description: 'One day after birthday',
    birthdate: '2000-10-19T00:00:00.000Z',
    referenceDate: '2023-10-20T00:00:00.000Z',
    expectedAge: 23
  }
];

/**
 * Test fixtures for getTimeAgo function
 */
export const timeAgoFixtures: TimeAgoFixture[] = [
  // Seconds
  {
    description: 'Just now (10 seconds ago)',
    date: '2023-10-20T12:59:50.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '10 segundos atrás',
    expectedEnUS: '10 seconds ago'
  },
  
  // Minutes
  {
    description: 'Single minute ago',
    date: '2023-10-20T12:59:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '1 minuto atrás',
    expectedEnUS: '1 minute ago'
  },
  {
    description: 'Multiple minutes ago',
    date: '2023-10-20T12:45:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '15 minutos atrás',
    expectedEnUS: '15 minutes ago'
  },
  
  // Hours
  {
    description: 'Single hour ago',
    date: '2023-10-20T12:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '1 hora atrás',
    expectedEnUS: '1 hour ago'
  },
  {
    description: 'Multiple hours ago',
    date: '2023-10-20T10:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '3 horas atrás',
    expectedEnUS: '3 hours ago'
  },
  
  // Days
  {
    description: 'Single day ago',
    date: '2023-10-19T13:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '1 dia atrás',
    expectedEnUS: '1 day ago'
  },
  {
    description: 'Multiple days ago',
    date: '2023-10-17T13:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '3 dias atrás',
    expectedEnUS: '3 days ago'
  },
  
  // Weeks
  {
    description: 'Single week ago',
    date: '2023-10-13T13:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '1 semana atrás',
    expectedEnUS: '1 week ago'
  },
  {
    description: 'Multiple weeks ago',
    date: '2023-10-01T13:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '2 semanas atrás',
    expectedEnUS: '2 weeks ago'
  },
  
  // Months
  {
    description: 'Single month ago',
    date: '2023-09-20T13:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '1 mês atrás',
    expectedEnUS: '1 month ago'
  },
  {
    description: 'Multiple months ago',
    date: '2023-07-20T13:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '3 meses atrás',
    expectedEnUS: '3 months ago'
  },
  
  // Years
  {
    description: 'Single year ago',
    date: '2022-10-20T13:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '1 ano atrás',
    expectedEnUS: '1 year ago'
  },
  {
    description: 'Multiple years ago',
    date: '2020-10-20T13:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '3 anos atrás',
    expectedEnUS: '3 years ago'
  },
  
  // Edge cases
  {
    description: 'Almost a minute (59 seconds)',
    date: '2023-10-20T12:59:01.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '59 segundos atrás',
    expectedEnUS: '59 seconds ago'
  },
  {
    description: 'Almost an hour (59 minutes)',
    date: '2023-10-20T12:01:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '59 minutos atrás',
    expectedEnUS: '59 minutes ago'
  },
  {
    description: 'Almost a day (23 hours)',
    date: '2023-10-19T14:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '23 horas atrás',
    expectedEnUS: '23 hours ago'
  },
  
  // Journey-specific cases
  {
    description: 'Health metric recorded recently (care journey context)',
    date: '2023-10-20T10:30:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '2 horas atrás',
    expectedEnUS: '2 hours ago'
  },
  {
    description: 'Appointment scheduled last week (care journey context)',
    date: '2023-10-13T15:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '1 semana atrás',
    expectedEnUS: '1 week ago'
  },
  {
    description: 'Insurance claim submitted last month (plan journey context)',
    date: '2023-09-15T10:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '1 mês atrás',
    expectedEnUS: '1 month ago'
  },
  {
    description: 'Achievement earned last year (gamification context)',
    date: '2022-10-15T10:00:00.000Z',
    referenceDate: '2023-10-20T13:00:00.000Z',
    expectedPtBR: '1 ano atrás',
    expectedEnUS: '1 year ago'
  }
];

/**
 * Combined export of all calculation fixtures
 */
export const calculationFixtures = {
  ageCalculation: ageCalculationFixtures,
  timeAgo: timeAgoFixtures
};

export default calculationFixtures;
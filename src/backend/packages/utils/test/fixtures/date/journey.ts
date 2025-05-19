/**
 * Test fixtures for journey-specific date formatting functions
 * These fixtures ensure consistent date representation across journey services
 * according to their specific requirements.
 */

/**
 * Interface for journey date formatting test fixtures
 */
export interface JourneyDateFixture {
  input: {
    date: Date | string;
    journeyId: string;
    locale?: string;
  };
  expected: string;
  description: string;
}

/**
 * Test fixtures for the formatJourneyDate function
 * Covers all three journeys (Health, Care, Plan) with different locales
 */
export const journeyDateFixtures: JourneyDateFixture[] = [
  // Health Journey Fixtures - Portuguese (default)
  {
    description: 'Health journey - morning time - pt-BR',
    input: {
      date: new Date(2023, 5, 15, 9, 30), // June 15, 2023, 9:30 AM
      journeyId: 'health',
      locale: 'pt-BR'
    },
    expected: '15/06/2023 09:30'
  },
  {
    description: 'Health journey - afternoon time - pt-BR',
    input: {
      date: new Date(2023, 5, 15, 14, 45), // June 15, 2023, 2:45 PM
      journeyId: 'health',
      locale: 'pt-BR'
    },
    expected: '15/06/2023 14:45'
  },
  {
    description: 'Health journey - midnight - pt-BR',
    input: {
      date: new Date(2023, 5, 15, 0, 0), // June 15, 2023, 12:00 AM
      journeyId: 'health',
      locale: 'pt-BR'
    },
    expected: '15/06/2023 00:00'
  },
  
  // Health Journey Fixtures - English
  {
    description: 'Health journey - morning time - en-US',
    input: {
      date: new Date(2023, 5, 15, 9, 30), // June 15, 2023, 9:30 AM
      journeyId: 'health',
      locale: 'en-US'
    },
    expected: '06/15/2023 09:30'
  },
  {
    description: 'Health journey - afternoon time - en-US',
    input: {
      date: new Date(2023, 5, 15, 14, 45), // June 15, 2023, 2:45 PM
      journeyId: 'health',
      locale: 'en-US'
    },
    expected: '06/15/2023 14:45'
  },
  
  // Care Journey Fixtures - Portuguese (default)
  {
    description: 'Care journey - weekday - pt-BR',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023 (Thursday)
      journeyId: 'care',
      locale: 'pt-BR'
    },
    expected: 'qui, 15 jun 2023'
  },
  {
    description: 'Care journey - weekend - pt-BR',
    input: {
      date: new Date(2023, 5, 17), // June 17, 2023 (Saturday)
      journeyId: 'care',
      locale: 'pt-BR'
    },
    expected: 'sáb, 17 jun 2023'
  },
  {
    description: 'Care journey - with time (should ignore time) - pt-BR',
    input: {
      date: new Date(2023, 5, 15, 14, 30), // June 15, 2023, 2:30 PM
      journeyId: 'care',
      locale: 'pt-BR'
    },
    expected: 'qui, 15 jun 2023'
  },
  
  // Care Journey Fixtures - English
  {
    description: 'Care journey - weekday - en-US',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023 (Thursday)
      journeyId: 'care',
      locale: 'en-US'
    },
    expected: 'Thu, 15 Jun 2023'
  },
  {
    description: 'Care journey - weekend - en-US',
    input: {
      date: new Date(2023, 5, 17), // June 17, 2023 (Saturday)
      journeyId: 'care',
      locale: 'en-US'
    },
    expected: 'Sat, 17 Jun 2023'
  },
  
  // Plan Journey Fixtures - Portuguese (default)
  {
    description: 'Plan journey - standard date - pt-BR',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'plan',
      locale: 'pt-BR'
    },
    expected: '15/06/2023'
  },
  {
    description: 'Plan journey - with time (should ignore time) - pt-BR',
    input: {
      date: new Date(2023, 5, 15, 14, 30), // June 15, 2023, 2:30 PM
      journeyId: 'plan',
      locale: 'pt-BR'
    },
    expected: '15/06/2023'
  },
  {
    description: 'Plan journey - end of month - pt-BR',
    input: {
      date: new Date(2023, 5, 30), // June 30, 2023
      journeyId: 'plan',
      locale: 'pt-BR'
    },
    expected: '30/06/2023'
  },
  
  // Plan Journey Fixtures - English
  {
    description: 'Plan journey - standard date - en-US',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'plan',
      locale: 'en-US'
    },
    expected: '06/15/2023'
  },
  {
    description: 'Plan journey - end of month - en-US',
    input: {
      date: new Date(2023, 5, 30), // June 30, 2023
      journeyId: 'plan',
      locale: 'en-US'
    },
    expected: '06/30/2023'
  },
  
  // String Date Input Tests
  {
    description: 'Health journey - ISO string date input - pt-BR',
    input: {
      date: '2023-06-15T09:30:00.000Z', // ISO string format
      journeyId: 'health',
      locale: 'pt-BR'
    },
    expected: '15/06/2023 09:30'
  },
  {
    description: 'Care journey - ISO string date input - pt-BR',
    input: {
      date: '2023-06-15T00:00:00.000Z', // ISO string format
      journeyId: 'care',
      locale: 'pt-BR'
    },
    expected: 'qui, 15 jun 2023'
  },
  {
    description: 'Plan journey - ISO string date input - pt-BR',
    input: {
      date: '2023-06-15T00:00:00.000Z', // ISO string format
      journeyId: 'plan',
      locale: 'pt-BR'
    },
    expected: '15/06/2023'
  },
  
  // Default Locale Tests (should use pt-BR)
  {
    description: 'Health journey - default locale (pt-BR)',
    input: {
      date: new Date(2023, 5, 15, 9, 30), // June 15, 2023, 9:30 AM
      journeyId: 'health'
      // locale omitted - should default to pt-BR
    },
    expected: '15/06/2023 09:30'
  },
  {
    description: 'Care journey - default locale (pt-BR)',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'care'
      // locale omitted - should default to pt-BR
    },
    expected: 'qui, 15 jun 2023'
  },
  {
    description: 'Plan journey - default locale (pt-BR)',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'plan'
      // locale omitted - should default to pt-BR
    },
    expected: '15/06/2023'
  },
  
  // Invalid Journey ID Tests (should use default format)
  {
    description: 'Invalid journey ID - should use default format - pt-BR',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'invalid-journey',
      locale: 'pt-BR'
    },
    expected: '15/06/2023'
  },
  {
    description: 'Invalid journey ID - should use default format - en-US',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'invalid-journey',
      locale: 'en-US'
    },
    expected: '06/15/2023'
  },
  
  // Empty Journey ID Tests (should use default format)
  {
    description: 'Empty journey ID - should use default format - pt-BR',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: '',
      locale: 'pt-BR'
    },
    expected: '15/06/2023'
  },
  
  // Case Insensitivity Tests
  {
    description: 'Health journey - uppercase - pt-BR',
    input: {
      date: new Date(2023, 5, 15, 9, 30), // June 15, 2023, 9:30 AM
      journeyId: 'HEALTH',
      locale: 'pt-BR'
    },
    expected: '15/06/2023 09:30'
  },
  {
    description: 'Care journey - mixed case - pt-BR',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'CaRe',
      locale: 'pt-BR'
    },
    expected: 'qui, 15 jun 2023'
  },
  {
    description: 'Plan journey - uppercase - pt-BR',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'PLAN',
      locale: 'pt-BR'
    },
    expected: '15/06/2023'
  },
  
  // Invalid Date Tests
  {
    description: 'Invalid date - should return empty string',
    input: {
      date: 'not-a-date',
      journeyId: 'health',
      locale: 'pt-BR'
    },
    expected: ''
  },
  
  // Journey-specific Portuguese Names
  // Note: These use the default format as the formatter currently only recognizes
  // 'health', 'care', and 'plan' as valid journey IDs (case-insensitive)
  {
    description: 'Health journey with Portuguese name (Minha Saúde)',
    input: {
      date: new Date(2023, 5, 15, 9, 30), // June 15, 2023, 9:30 AM
      journeyId: 'Minha Saúde',
      locale: 'pt-BR'
    },
    expected: '15/06/2023'
  },
  {
    description: 'Care journey with Portuguese name (Cuidar-me Agora)',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'Cuidar-me Agora',
      locale: 'pt-BR'
    },
    expected: '15/06/2023'
  },
  {
    description: 'Plan journey with Portuguese name (Meu Plano & Benefícios)',
    input: {
      date: new Date(2023, 5, 15), // June 15, 2023
      journeyId: 'Meu Plano & Benefícios',
      locale: 'pt-BR'
    },
    expected: '15/06/2023'
  }
];

/**
 * Test fixtures for invalid dates with journey formatting
 */
export const invalidJourneyDateFixtures: JourneyDateFixture[] = [
  {
    description: 'Null date - health journey',
    input: {
      date: null as any,
      journeyId: 'health',
      locale: 'pt-BR'
    },
    expected: ''
  },
  {
    description: 'Undefined date - care journey',
    input: {
      date: undefined as any,
      journeyId: 'care',
      locale: 'pt-BR'
    },
    expected: ''
  },
  {
    description: 'Invalid date string - plan journey',
    input: {
      date: 'invalid-date-string',
      journeyId: 'plan',
      locale: 'pt-BR'
    },
    expected: ''
  },
  {
    description: 'Invalid date object - health journey',
    input: {
      date: new Date('invalid-date'),
      journeyId: 'health',
      locale: 'pt-BR'
    },
    expected: ''
  }
];
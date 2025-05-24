/**
 * Test credentials for authentication testing
 * 
 * This file contains standardized credential pairs for testing authentication flows
 * across the AUSTA SuperApp. It includes valid credentials, invalid credentials,
 * and journey-specific test users to ensure consistent testing across all services.
 */

/**
 * Interface for credential pairs used in authentication testing
 */
export interface TestCredentials {
  email: string;
  password: string;
  username?: string; // Optional username for services that support username login
  displayName?: string; // User's display name for UI testing
  journeyAccess?: string[]; // List of journeys this user has access to
}

/**
 * Valid credentials for successful authentication testing
 */
export const validCredentials: TestCredentials[] = [
  {
    email: 'user@example.com',
    password: 'Password123!',
    displayName: 'Test User',
    journeyAccess: ['health', 'care', 'plan']
  },
  {
    email: 'admin@austa.health',
    password: 'AdminSecure456!',
    displayName: 'Admin User',
    journeyAccess: ['health', 'care', 'plan']
  },
  {
    email: 'support@austa.health',
    password: 'Support789!',
    displayName: 'Support User',
    journeyAccess: ['health', 'care', 'plan']
  }
];

/**
 * Invalid credentials with incorrect passwords
 */
export const invalidPasswordCredentials: TestCredentials[] = [
  {
    email: 'user@example.com',
    password: 'wrongpassword',
    displayName: 'Test User'
  },
  {
    email: 'admin@austa.health',
    password: 'incorrect',
    displayName: 'Admin User'
  }
];

/**
 * Nonexistent user credentials
 */
export const nonexistentUserCredentials: TestCredentials[] = [
  {
    email: 'nonexistent@example.com',
    password: 'Password123!'
  },
  {
    email: 'fake@austa.health',
    password: 'FakeUser456!'
  }
];

/**
 * Journey-specific test credentials for cross-journey testing
 * Each user has access to specific journeys for testing journey-based permissions
 */
export const journeySpecificCredentials: Record<string, TestCredentials[]> = {
  health: [
    {
      email: 'health.user@example.com',
      password: 'HealthJourney123!',
      displayName: 'Health Journey User',
      journeyAccess: ['health']
    },
    {
      email: 'health.premium@example.com',
      password: 'HealthPremium456!',
      displayName: 'Health Premium User',
      journeyAccess: ['health']
    }
  ],
  care: [
    {
      email: 'care.user@example.com',
      password: 'CareJourney123!',
      displayName: 'Care Journey User',
      journeyAccess: ['care']
    },
    {
      email: 'care.premium@example.com',
      password: 'CarePremium456!',
      displayName: 'Care Premium User',
      journeyAccess: ['care']
    }
  ],
  plan: [
    {
      email: 'plan.user@example.com',
      password: 'PlanJourney123!',
      displayName: 'Plan Journey User',
      journeyAccess: ['plan']
    },
    {
      email: 'plan.premium@example.com',
      password: 'PlanPremium456!',
      displayName: 'Plan Premium User',
      journeyAccess: ['plan']
    }
  ],
  // Users with access to multiple but not all journeys
  multiJourney: [
    {
      email: 'health.care@example.com',
      password: 'HealthCare123!',
      displayName: 'Health & Care User',
      journeyAccess: ['health', 'care']
    },
    {
      email: 'care.plan@example.com',
      password: 'CarePlan456!',
      displayName: 'Care & Plan User',
      journeyAccess: ['care', 'plan']
    },
    {
      email: 'health.plan@example.com',
      password: 'HealthPlan789!',
      displayName: 'Health & Plan User',
      journeyAccess: ['health', 'plan']
    }
  ]
};

/**
 * Special case credentials for validation testing
 */
export const specialCaseCredentials: Record<string, TestCredentials> = {
  // Empty email
  emptyEmail: {
    email: '',
    password: 'Password123!'
  },
  // Empty password
  emptyPassword: {
    email: 'user@example.com',
    password: ''
  },
  // Malformed email (missing @ symbol)
  malformedEmail: {
    email: 'userexample.com',
    password: 'Password123!'
  },
  // Password too short (for validation testing)
  shortPassword: {
    email: 'user@example.com',
    password: 'Short1!'
  },
  // Password without uppercase (for validation testing)
  noUppercasePassword: {
    email: 'user@example.com',
    password: 'password123!'
  },
  // Password without lowercase (for validation testing)
  noLowercasePassword: {
    email: 'user@example.com',
    password: 'PASSWORD123!'
  },
  // Password without numbers (for validation testing)
  noNumberPassword: {
    email: 'user@example.com',
    password: 'PasswordTest!'
  },
  // Password without special characters (for validation testing)
  noSpecialCharPassword: {
    email: 'user@example.com',
    password: 'Password123'
  },
  // Very long email (for boundary testing)
  veryLongEmail: {
    email: 'very.long.email.address.that.exceeds.normal.length.limits.for.testing.boundary.conditions.and.validation.rules@extremely.long.domain.name.example.com',
    password: 'Password123!'
  },
  // Very long password (for boundary testing)
  veryLongPassword: {
    email: 'user@example.com',
    password: 'ThisIsAnExtremelyLongPasswordThatExceedsNormalLengthLimitsForTestingBoundaryConditionsAndValidationRules123!'
  }
};

/**
 * Default test user for quick access in tests
 */
export const defaultTestUser: TestCredentials = validCredentials[0];

/**
 * Default admin user for quick access in tests
 */
export const defaultAdminUser: TestCredentials = validCredentials[1];

/**
 * Helper function to get a user with specific journey access
 * @param journeys Array of journey names the user should have access to
 * @returns A test user with access to the specified journeys
 */
export function getUserWithJourneyAccess(journeys: string[]): TestCredentials | undefined {
  // First check for exact matches in valid credentials
  const exactMatch = validCredentials.find(cred => 
    cred.journeyAccess && 
    cred.journeyAccess.length === journeys.length && 
    journeys.every(j => cred.journeyAccess?.includes(j))
  );
  
  if (exactMatch) return exactMatch;
  
  // Then check in journey-specific credentials
  if (journeys.length === 1) {
    const journey = journeys[0];
    return journeySpecificCredentials[journey]?.[0];
  }
  
  // For multi-journey access
  return journeySpecificCredentials.multiJourney.find(cred => 
    cred.journeyAccess && 
    journeys.every(j => cred.journeyAccess?.includes(j))
  );
}
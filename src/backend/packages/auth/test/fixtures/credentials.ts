/**
 * Test credentials for authentication testing
 * 
 * This file contains sample login credentials (username/email and password pairs) 
 * for testing local authentication strategy and login flows. It includes valid credentials, 
 * invalid passwords, nonexistent users, and special case scenarios to test validation 
 * and error handling.
 */

/**
 * Interface for credential pairs used in authentication testing
 */
export interface TestCredential {
  email: string;
  password: string;
  description?: string;
}

/**
 * Valid credentials for successful authentication
 */
export const validCredentials: TestCredential[] = [
  {
    email: 'user@example.com',
    password: 'Password123!',
    description: 'Standard valid user'
  },
  {
    email: 'admin@austa.health',
    password: 'AdminSecure456!',
    description: 'Admin user with elevated permissions'
  },
  {
    email: 'test@austa.health',
    password: 'TestUser789!',
    description: 'Test user for general testing'
  }
];

/**
 * Invalid credentials with incorrect passwords
 */
export const invalidPasswordCredentials: TestCredential[] = [
  {
    email: 'user@example.com',
    password: 'wrongpassword',
    description: 'Valid email with incorrect password'
  },
  {
    email: 'admin@austa.health',
    password: 'short',
    description: 'Password too short'
  },
  {
    email: 'test@austa.health',
    password: 'nouppercaseletter123!',
    description: 'Password missing uppercase letter'
  },
  {
    email: 'test@austa.health',
    password: 'NOLOWERCASELETTER123!',
    description: 'Password missing lowercase letter'
  },
  {
    email: 'test@austa.health',
    password: 'NoNumbers!',
    description: 'Password missing numbers'
  },
  {
    email: 'test@austa.health',
    password: 'NoSpecialChar123',
    description: 'Password missing special character'
  }
];

/**
 * Credentials with invalid email formats
 */
export const invalidEmailCredentials: TestCredential[] = [
  {
    email: 'notanemail',
    password: 'Password123!',
    description: 'Email missing @ symbol'
  },
  {
    email: 'incomplete@',
    password: 'Password123!',
    description: 'Email missing domain'
  },
  {
    email: '@missingusername.com',
    password: 'Password123!',
    description: 'Email missing username'
  },
  {
    email: 'spaces in email@example.com',
    password: 'Password123!',
    description: 'Email with spaces'
  },
  {
    email: '',
    password: 'Password123!',
    description: 'Empty email'
  }
];

/**
 * Credentials for nonexistent users
 */
export const nonexistentUserCredentials: TestCredential[] = [
  {
    email: 'nonexistent@example.com',
    password: 'Password123!',
    description: 'User that does not exist in the system'
  },
  {
    email: 'deleted@austa.health',
    password: 'Password123!',
    description: 'Previously deleted user'
  },
  {
    email: 'inactive@austa.health',
    password: 'Password123!',
    description: 'Inactive user account'
  }
];

/**
 * Special case credentials for testing edge cases
 */
export const specialCaseCredentials: TestCredential[] = [
  {
    email: 'locked@austa.health',
    password: 'Password123!',
    description: 'Account locked due to too many failed attempts'
  },
  {
    email: 'expired@austa.health',
    password: 'Password123!',
    description: 'Account with expired credentials requiring reset'
  },
  {
    email: 'unverified@austa.health',
    password: 'Password123!',
    description: 'Account with unverified email'
  },
  {
    email: 'passwordreset@austa.health',
    password: 'Password123!',
    description: 'Account with pending password reset'
  },
  {
    email: 'verylongemail.with.many.segments.and.maximum.length.testing@extremely.long.domain.name.austa.health',
    password: 'Password123!',
    description: 'Very long email address testing maximum length'
  }
];

/**
 * Journey-specific test credentials for cross-journey testing
 */
export const journeyCredentials = {
  health: [
    {
      email: 'health.user@austa.health',
      password: 'HealthJourney123!',
      description: 'Standard health journey user'
    },
    {
      email: 'health.premium@austa.health',
      password: 'HealthPremium456!',
      description: 'Premium health journey user with additional features'
    },
    {
      email: 'health.devices@austa.health',
      password: 'HealthDevices789!',
      description: 'Health journey user with connected devices'
    }
  ],
  care: [
    {
      email: 'care.user@austa.health',
      password: 'CareJourney123!',
      description: 'Standard care journey user'
    },
    {
      email: 'care.appointments@austa.health',
      password: 'CareAppts456!',
      description: 'Care journey user with scheduled appointments'
    },
    {
      email: 'care.telemedicine@austa.health',
      password: 'CareTele789!',
      description: 'Care journey user with telemedicine history'
    }
  ],
  plan: [
    {
      email: 'plan.user@austa.health',
      password: 'PlanJourney123!',
      description: 'Standard plan journey user'
    },
    {
      email: 'plan.claims@austa.health',
      password: 'PlanClaims456!',
      description: 'Plan journey user with submitted claims'
    },
    {
      email: 'plan.benefits@austa.health',
      password: 'PlanBenefits789!',
      description: 'Plan journey user with specific benefits'
    }
  ],
  crossJourney: [
    {
      email: 'multi.journey@austa.health',
      password: 'MultiJourney123!',
      description: 'User active across all journeys'
    },
    {
      email: 'health.care@austa.health',
      password: 'HealthCare456!',
      description: 'User active in health and care journeys'
    },
    {
      email: 'care.plan@austa.health',
      password: 'CarePlan789!',
      description: 'User active in care and plan journeys'
    },
    {
      email: 'health.plan@austa.health',
      password: 'HealthPlan123!',
      description: 'User active in health and plan journeys'
    }
  ]
};

/**
 * Default test credential for quick testing
 */
export const defaultTestCredential: TestCredential = {
  email: 'test@austa.health',
  password: 'TestUser789!',
  description: 'Default test user for general testing'
};
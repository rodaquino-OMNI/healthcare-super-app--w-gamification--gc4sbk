/**
 * @file test-constants.helper.ts
 * @description Provides standardized constants, test data, and configurations for authentication testing.
 * This file centralizes all shared test values like default test users, standard permission sets,
 * role configurations, and secret keys used across auth test suites.
 */

import { JourneyType } from '../../src/interfaces/role.interface';
import { IUser, IRole, IPermission, IUserWithRoles, IUserWithPermissions } from '../../src/interfaces/user.interface';
import { ITokenPayload, ITokenGenerationOptions } from '../../src/interfaces/token.interface';
import { JOURNEY_IDS, JOURNEY_NAMES, JOURNEY_COLORS } from '@austa/shared/constants/journey.constants';

/**
 * Test JWT secret keys for consistent token generation in tests
 */
export const TEST_JWT_SECRETS = {
  /**
   * Secret key for access tokens in test environment
   */
  ACCESS_TOKEN_SECRET: 'test-access-token-secret-key-for-unit-tests-only',
  
  /**
   * Secret key for refresh tokens in test environment
   */
  REFRESH_TOKEN_SECRET: 'test-refresh-token-secret-key-for-unit-tests-only',
  
  /**
   * Secret key for temporary tokens (e.g., MFA, email verification) in test environment
   */
  TEMP_TOKEN_SECRET: 'test-temp-token-secret-key-for-unit-tests-only',
};

/**
 * Standard token generation options for tests
 */
export const TEST_TOKEN_OPTIONS: ITokenGenerationOptions = {
  secret: TEST_JWT_SECRETS.ACCESS_TOKEN_SECRET,
  expiresIn: 3600, // 1 hour
  issuer: 'austa-test',
  audience: 'austa-api-test',
  algorithm: 'HS256',
};

/**
 * Test refresh token options
 */
export const TEST_REFRESH_TOKEN_OPTIONS: ITokenGenerationOptions = {
  secret: TEST_JWT_SECRETS.REFRESH_TOKEN_SECRET,
  expiresIn: 86400 * 7, // 7 days
  issuer: 'austa-test',
  audience: 'austa-api-test',
  algorithm: 'HS256',
};

/**
 * Standard test permissions for each journey
 */
export const TEST_PERMISSIONS: Record<JourneyType, IPermission[]> = {
  [JourneyType.HEALTH]: [
    { id: 1, name: 'health:metrics:read', description: 'View health metrics' },
    { id: 2, name: 'health:metrics:write', description: 'Create and update health metrics' },
    { id: 3, name: 'health:goals:read', description: 'View health goals' },
    { id: 4, name: 'health:goals:write', description: 'Create and update health goals' },
    { id: 5, name: 'health:devices:read', description: 'View connected health devices' },
    { id: 6, name: 'health:devices:write', description: 'Connect and manage health devices' },
  ],
  [JourneyType.CARE]: [
    { id: 7, name: 'care:appointments:read', description: 'View appointments' },
    { id: 8, name: 'care:appointments:write', description: 'Schedule and manage appointments' },
    { id: 9, name: 'care:medications:read', description: 'View medications' },
    { id: 10, name: 'care:medications:write', description: 'Manage medications' },
    { id: 11, name: 'care:telemedicine:read', description: 'View telemedicine sessions' },
    { id: 12, name: 'care:telemedicine:write', description: 'Schedule and join telemedicine sessions' },
  ],
  [JourneyType.PLAN]: [
    { id: 13, name: 'plan:benefits:read', description: 'View plan benefits' },
    { id: 14, name: 'plan:claims:read', description: 'View insurance claims' },
    { id: 15, name: 'plan:claims:write', description: 'Submit and manage insurance claims' },
    { id: 16, name: 'plan:coverage:read', description: 'View coverage details' },
    { id: 17, name: 'plan:documents:read', description: 'View plan documents' },
    { id: 18, name: 'plan:documents:write', description: 'Upload and manage plan documents' },
  ],
  [JourneyType.GLOBAL]: [
    { id: 19, name: 'user:profile:read', description: 'View user profile' },
    { id: 20, name: 'user:profile:write', description: 'Update user profile' },
    { id: 21, name: 'user:settings:read', description: 'View user settings' },
    { id: 22, name: 'user:settings:write', description: 'Update user settings' },
    { id: 23, name: 'admin:users:read', description: 'View all users' },
    { id: 24, name: 'admin:users:write', description: 'Create and update users' },
    { id: 25, name: 'admin:roles:read', description: 'View roles and permissions' },
    { id: 26, name: 'admin:roles:write', description: 'Create and update roles and permissions' },
  ],
};

/**
 * Standard test roles for each journey
 */
export const TEST_ROLES: Record<JourneyType, IRole[]> = {
  [JourneyType.HEALTH]: [
    {
      id: 1,
      name: 'Health User',
      description: 'Basic health journey user',
      journey: JourneyType.HEALTH,
      isDefault: true,
      permissions: [TEST_PERMISSIONS[JourneyType.HEALTH][0], TEST_PERMISSIONS[JourneyType.HEALTH][2]],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      id: 2,
      name: 'Health Premium User',
      description: 'Premium health journey user with additional features',
      journey: JourneyType.HEALTH,
      isDefault: false,
      permissions: TEST_PERMISSIONS[JourneyType.HEALTH],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
  ],
  [JourneyType.CARE]: [
    {
      id: 3,
      name: 'Care User',
      description: 'Basic care journey user',
      journey: JourneyType.CARE,
      isDefault: true,
      permissions: [TEST_PERMISSIONS[JourneyType.CARE][0], TEST_PERMISSIONS[JourneyType.CARE][2]],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      id: 4,
      name: 'Care Provider',
      description: 'Healthcare provider with additional permissions',
      journey: JourneyType.CARE,
      isDefault: false,
      permissions: TEST_PERMISSIONS[JourneyType.CARE],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
  ],
  [JourneyType.PLAN]: [
    {
      id: 5,
      name: 'Plan User',
      description: 'Basic plan journey user',
      journey: JourneyType.PLAN,
      isDefault: true,
      permissions: [TEST_PERMISSIONS[JourneyType.PLAN][0], TEST_PERMISSIONS[JourneyType.PLAN][2]],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      id: 6,
      name: 'Plan Administrator',
      description: 'Plan administrator with additional permissions',
      journey: JourneyType.PLAN,
      isDefault: false,
      permissions: TEST_PERMISSIONS[JourneyType.PLAN],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
  ],
  [JourneyType.GLOBAL]: [
    {
      id: 7,
      name: 'User',
      description: 'Standard user with basic permissions',
      journey: JourneyType.GLOBAL,
      isDefault: true,
      permissions: [TEST_PERMISSIONS[JourneyType.GLOBAL][0], TEST_PERMISSIONS[JourneyType.GLOBAL][2]],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      id: 8,
      name: 'Administrator',
      description: 'System administrator with full access',
      journey: JourneyType.GLOBAL,
      isDefault: false,
      permissions: TEST_PERMISSIONS[JourneyType.GLOBAL],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
  ],
};

/**
 * Standard test users for authentication testing
 */
export const TEST_USERS = {
  /**
   * Regular user with basic permissions
   */
  REGULAR_USER: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test User',
    email: 'user@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    phone: '+5511999999999',
    cpf: '12345678900',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as IUser,

  /**
   * Premium user with additional permissions
   */
  PREMIUM_USER: {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Premium Test User',
    email: 'premium@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    phone: '+5511888888888',
    cpf: '98765432100',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as IUser,

  /**
   * Administrator user with full system access
   */
  ADMIN_USER: {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    phone: '+5511777777777',
    cpf: '11122233344',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as IUser,

  /**
   * Healthcare provider user with care journey permissions
   */
  PROVIDER_USER: {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Provider User',
    email: 'provider@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    phone: '+5511666666666',
    cpf: '44433322211',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as IUser,

  /**
   * Unverified user for testing verification flows
   */
  UNVERIFIED_USER: {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Unverified User',
    email: 'unverified@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    phone: '+5511555555555',
    cpf: '55566677788',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as IUser,
};

/**
 * Users with roles for testing role-based authorization
 */
export const TEST_USERS_WITH_ROLES: Record<string, IUserWithRoles> = {
  /**
   * Regular user with basic roles
   */
  REGULAR_USER: {
    ...TEST_USERS.REGULAR_USER,
    password: undefined,
    roles: [
      TEST_ROLES[JourneyType.GLOBAL][0], // User
      TEST_ROLES[JourneyType.HEALTH][0], // Health User
      TEST_ROLES[JourneyType.CARE][0],   // Care User
      TEST_ROLES[JourneyType.PLAN][0],   // Plan User
    ],
  },

  /**
   * Premium user with enhanced roles
   */
  PREMIUM_USER: {
    ...TEST_USERS.PREMIUM_USER,
    password: undefined,
    roles: [
      TEST_ROLES[JourneyType.GLOBAL][0], // User
      TEST_ROLES[JourneyType.HEALTH][1], // Health Premium User
      TEST_ROLES[JourneyType.CARE][0],   // Care User
      TEST_ROLES[JourneyType.PLAN][0],   // Plan User
    ],
  },

  /**
   * Administrator with full access roles
   */
  ADMIN_USER: {
    ...TEST_USERS.ADMIN_USER,
    password: undefined,
    roles: [
      TEST_ROLES[JourneyType.GLOBAL][1], // Administrator
      TEST_ROLES[JourneyType.HEALTH][1], // Health Premium User
      TEST_ROLES[JourneyType.CARE][1],   // Care Provider
      TEST_ROLES[JourneyType.PLAN][1],   // Plan Administrator
    ],
  },

  /**
   * Healthcare provider with care-specific roles
   */
  PROVIDER_USER: {
    ...TEST_USERS.PROVIDER_USER,
    password: undefined,
    roles: [
      TEST_ROLES[JourneyType.GLOBAL][0], // User
      TEST_ROLES[JourneyType.CARE][1],   // Care Provider
    ],
  },
};

/**
 * Users with permissions for testing permission-based authorization
 */
export const TEST_USERS_WITH_PERMISSIONS: Record<string, IUserWithPermissions> = {
  /**
   * Regular user with basic permissions
   */
  REGULAR_USER: {
    ...TEST_USERS.REGULAR_USER,
    password: undefined,
    permissions: [
      ...TEST_ROLES[JourneyType.GLOBAL][0].permissions,
      ...TEST_ROLES[JourneyType.HEALTH][0].permissions,
      ...TEST_ROLES[JourneyType.CARE][0].permissions,
      ...TEST_ROLES[JourneyType.PLAN][0].permissions,
    ],
  },

  /**
   * Premium user with enhanced permissions
   */
  PREMIUM_USER: {
    ...TEST_USERS.PREMIUM_USER,
    password: undefined,
    permissions: [
      ...TEST_ROLES[JourneyType.GLOBAL][0].permissions,
      ...TEST_ROLES[JourneyType.HEALTH][1].permissions,
      ...TEST_ROLES[JourneyType.CARE][0].permissions,
      ...TEST_ROLES[JourneyType.PLAN][0].permissions,
    ],
  },

  /**
   * Administrator with full access permissions
   */
  ADMIN_USER: {
    ...TEST_USERS.ADMIN_USER,
    password: undefined,
    permissions: [
      ...TEST_ROLES[JourneyType.GLOBAL][1].permissions,
      ...TEST_ROLES[JourneyType.HEALTH][1].permissions,
      ...TEST_ROLES[JourneyType.CARE][1].permissions,
      ...TEST_ROLES[JourneyType.PLAN][1].permissions,
    ],
  },

  /**
   * Healthcare provider with care-specific permissions
   */
  PROVIDER_USER: {
    ...TEST_USERS.PROVIDER_USER,
    password: undefined,
    permissions: [
      ...TEST_ROLES[JourneyType.GLOBAL][0].permissions,
      ...TEST_ROLES[JourneyType.CARE][1].permissions,
    ],
  },
};

/**
 * Standard token payloads for testing JWT functionality
 */
export const TEST_TOKEN_PAYLOADS: Record<string, ITokenPayload> = {
  /**
   * Regular user token payload
   */
  REGULAR_USER: {
    sub: TEST_USERS.REGULAR_USER.id,
    email: TEST_USERS.REGULAR_USER.email,
    name: TEST_USERS.REGULAR_USER.name,
    roles: [1, 3, 5, 7], // IDs of regular user roles
    permissions: TEST_USERS_WITH_PERMISSIONS.REGULAR_USER.permissions.map(p => p.name),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'austa-test',
    aud: 'austa-api-test',
  },

  /**
   * Premium user token payload
   */
  PREMIUM_USER: {
    sub: TEST_USERS.PREMIUM_USER.id,
    email: TEST_USERS.PREMIUM_USER.email,
    name: TEST_USERS.PREMIUM_USER.name,
    roles: [2, 3, 5, 7], // IDs of premium user roles
    permissions: TEST_USERS_WITH_PERMISSIONS.PREMIUM_USER.permissions.map(p => p.name),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'austa-test',
    aud: 'austa-api-test',
  },

  /**
   * Admin user token payload
   */
  ADMIN_USER: {
    sub: TEST_USERS.ADMIN_USER.id,
    email: TEST_USERS.ADMIN_USER.email,
    name: TEST_USERS.ADMIN_USER.name,
    roles: [2, 4, 6, 8], // IDs of admin user roles
    permissions: TEST_USERS_WITH_PERMISSIONS.ADMIN_USER.permissions.map(p => p.name),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'austa-test',
    aud: 'austa-api-test',
  },

  /**
   * Provider user token payload
   */
  PROVIDER_USER: {
    sub: TEST_USERS.PROVIDER_USER.id,
    email: TEST_USERS.PROVIDER_USER.email,
    name: TEST_USERS.PROVIDER_USER.name,
    roles: [4, 7], // IDs of provider user roles
    permissions: TEST_USERS_WITH_PERMISSIONS.PROVIDER_USER.permissions.map(p => p.name),
    journeyContext: JourneyType.CARE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'austa-test',
    aud: 'austa-api-test',
  },

  /**
   * Expired token payload for testing expiration handling
   */
  EXPIRED: {
    sub: TEST_USERS.REGULAR_USER.id,
    email: TEST_USERS.REGULAR_USER.email,
    name: TEST_USERS.REGULAR_USER.name,
    roles: [1, 3, 5, 7],
    permissions: TEST_USERS_WITH_PERMISSIONS.REGULAR_USER.permissions.map(p => p.name),
    iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    iss: 'austa-test',
    aud: 'austa-api-test',
  },
};

/**
 * Journey-specific test constants
 */
export const JOURNEY_TEST_CONSTANTS = {
  /**
   * Health journey test constants
   */
  [JourneyType.HEALTH]: {
    id: JOURNEY_IDS.HEALTH,
    name: JOURNEY_NAMES.HEALTH,
    colors: JOURNEY_COLORS.HEALTH,
    roles: TEST_ROLES[JourneyType.HEALTH],
    permissions: TEST_PERMISSIONS[JourneyType.HEALTH],
    testMetrics: [
      { id: 1, name: 'Weight', value: 75.5, unit: 'kg', userId: TEST_USERS.REGULAR_USER.id },
      { id: 2, name: 'Heart Rate', value: 72, unit: 'bpm', userId: TEST_USERS.REGULAR_USER.id },
      { id: 3, name: 'Blood Pressure', value: '120/80', unit: 'mmHg', userId: TEST_USERS.REGULAR_USER.id },
    ],
    testGoals: [
      { id: 1, name: 'Weight Loss', target: 70, unit: 'kg', userId: TEST_USERS.REGULAR_USER.id },
      { id: 2, name: 'Steps', target: 10000, unit: 'steps', userId: TEST_USERS.REGULAR_USER.id },
    ],
  },

  /**
   * Care journey test constants
   */
  [JourneyType.CARE]: {
    id: JOURNEY_IDS.CARE,
    name: JOURNEY_NAMES.CARE,
    colors: JOURNEY_COLORS.CARE,
    roles: TEST_ROLES[JourneyType.CARE],
    permissions: TEST_PERMISSIONS[JourneyType.CARE],
    testAppointments: [
      { 
        id: 1, 
        patientId: TEST_USERS.REGULAR_USER.id, 
        providerId: TEST_USERS.PROVIDER_USER.id,
        date: new Date('2023-06-15T14:30:00Z'),
        status: 'scheduled',
        type: 'consultation',
      },
      { 
        id: 2, 
        patientId: TEST_USERS.PREMIUM_USER.id, 
        providerId: TEST_USERS.PROVIDER_USER.id,
        date: new Date('2023-06-16T10:00:00Z'),
        status: 'scheduled',
        type: 'follow-up',
      },
    ],
    testMedications: [
      {
        id: 1,
        userId: TEST_USERS.REGULAR_USER.id,
        name: 'Aspirin',
        dosage: '100mg',
        frequency: 'daily',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-07-01'),
      },
    ],
  },

  /**
   * Plan journey test constants
   */
  [JourneyType.PLAN]: {
    id: JOURNEY_IDS.PLAN,
    name: JOURNEY_NAMES.PLAN,
    colors: JOURNEY_COLORS.PLAN,
    roles: TEST_ROLES[JourneyType.PLAN],
    permissions: TEST_PERMISSIONS[JourneyType.PLAN],
    testClaims: [
      {
        id: 1,
        userId: TEST_USERS.REGULAR_USER.id,
        amount: 150.0,
        status: 'submitted',
        date: new Date('2023-05-20'),
        description: 'Doctor visit',
      },
      {
        id: 2,
        userId: TEST_USERS.PREMIUM_USER.id,
        amount: 300.0,
        status: 'approved',
        date: new Date('2023-05-15'),
        description: 'Specialist consultation',
      },
    ],
    testBenefits: [
      {
        id: 1,
        name: 'Annual checkup',
        description: 'Free annual health checkup',
        coverage: 100,
      },
      {
        id: 2,
        name: 'Prescription discount',
        description: '20% discount on prescriptions',
        coverage: 20,
      },
    ],
  },
};

/**
 * Common authentication test scenarios
 */
export const AUTH_TEST_SCENARIOS = {
  /**
   * Valid login credentials
   */
  VALID_LOGIN: {
    email: TEST_USERS.REGULAR_USER.email,
    password: 'password123', // Plain text version of the hashed password
  },

  /**
   * Invalid login credentials
   */
  INVALID_LOGIN: {
    email: TEST_USERS.REGULAR_USER.email,
    password: 'wrongpassword',
  },

  /**
   * Valid registration data
   */
  VALID_REGISTRATION: {
    name: 'New Test User',
    email: 'newuser@example.com',
    password: 'Password123!',
    phone: '+5511999999999',
    acceptedTerms: true,
  },

  /**
   * Invalid registration data (missing required fields)
   */
  INVALID_REGISTRATION: {
    name: 'New Test User',
    email: 'newuser@example.com',
    // Missing password
    acceptedTerms: false,
  },

  /**
   * Valid token refresh request
   */
  VALID_REFRESH: {
    refreshToken: 'valid-refresh-token',
  },

  /**
   * Invalid token refresh request
   */
  INVALID_REFRESH: {
    refreshToken: 'invalid-refresh-token',
  },

  /**
   * Valid password reset request
   */
  VALID_PASSWORD_RESET: {
    email: TEST_USERS.REGULAR_USER.email,
  },

  /**
   * Valid password update with reset token
   */
  VALID_PASSWORD_UPDATE: {
    token: 'valid-reset-token',
    password: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  },

  /**
   * Valid MFA verification
   */
  VALID_MFA: {
    tempToken: 'valid-temp-token',
    code: '123456',
  },
};

/**
 * Test error messages for authentication failures
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is locked due to too many failed attempts',
  EXPIRED_TOKEN: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to access this resource',
  EMAIL_IN_USE: 'Email is already in use',
  INVALID_RESET_TOKEN: 'Password reset token is invalid or has expired',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  INVALID_MFA_CODE: 'Invalid verification code',
  MFA_REQUIRED: 'Multi-factor authentication is required',
};
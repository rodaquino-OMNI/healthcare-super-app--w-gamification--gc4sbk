/**
 * Authentication Testing Constants
 * 
 * This file provides standardized constants, test data, and configurations for authentication testing.
 * It centralizes all shared test values like default test users, standard permission sets, role configurations,
 * and secret keys used across auth test suites.
 */

import { JOURNEY_IDS, JOURNEY_CONFIG } from '@backend/shared/src/constants/journey.constants';
import { IUser, IRole, IPermission, ITokenPayload } from '@backend/packages/auth/src/interfaces';

/**
 * Test JWT configuration
 */
export const TEST_JWT_CONFIG = {
  secret: 'test-jwt-secret-key-for-unit-testing-only',
  refreshSecret: 'test-refresh-secret-key-for-unit-testing-only',
  expiresIn: '1h',
  refreshExpiresIn: '7d',
  issuer: 'austa-test',
  audience: 'austa-users-test',
};

/**
 * Standard permission sets for different user types
 */
export const TEST_PERMISSIONS = {
  // Basic user permissions
  BASIC: [
    { id: 'view-profile', name: 'View Profile', description: 'Can view own profile' },
    { id: 'edit-profile', name: 'Edit Profile', description: 'Can edit own profile' },
    { id: 'view-dashboard', name: 'View Dashboard', description: 'Can view dashboard' },
  ] as IPermission[],

  // Admin permissions
  ADMIN: [
    { id: 'manage-users', name: 'Manage Users', description: 'Can manage all users' },
    { id: 'manage-roles', name: 'Manage Roles', description: 'Can manage all roles' },
    { id: 'manage-permissions', name: 'Manage Permissions', description: 'Can manage all permissions' },
    { id: 'view-admin-dashboard', name: 'View Admin Dashboard', description: 'Can view admin dashboard' },
  ] as IPermission[],

  // Health journey permissions
  HEALTH: [
    { id: 'view-health-metrics', name: 'View Health Metrics', description: 'Can view health metrics', journey: JOURNEY_IDS.HEALTH },
    { id: 'add-health-metrics', name: 'Add Health Metrics', description: 'Can add health metrics', journey: JOURNEY_IDS.HEALTH },
    { id: 'connect-devices', name: 'Connect Devices', description: 'Can connect health devices', journey: JOURNEY_IDS.HEALTH },
    { id: 'view-health-insights', name: 'View Health Insights', description: 'Can view health insights', journey: JOURNEY_IDS.HEALTH },
  ] as IPermission[],

  // Care journey permissions
  CARE: [
    { id: 'book-appointments', name: 'Book Appointments', description: 'Can book appointments', journey: JOURNEY_IDS.CARE },
    { id: 'view-appointments', name: 'View Appointments', description: 'Can view appointments', journey: JOURNEY_IDS.CARE },
    { id: 'manage-medications', name: 'Manage Medications', description: 'Can manage medications', journey: JOURNEY_IDS.CARE },
    { id: 'access-telemedicine', name: 'Access Telemedicine', description: 'Can access telemedicine', journey: JOURNEY_IDS.CARE },
  ] as IPermission[],

  // Plan journey permissions
  PLAN: [
    { id: 'view-coverage', name: 'View Coverage', description: 'Can view coverage details', journey: JOURNEY_IDS.PLAN },
    { id: 'submit-claims', name: 'Submit Claims', description: 'Can submit insurance claims', journey: JOURNEY_IDS.PLAN },
    { id: 'view-claims', name: 'View Claims', description: 'Can view insurance claims', journey: JOURNEY_IDS.PLAN },
    { id: 'manage-benefits', name: 'Manage Benefits', description: 'Can manage benefits', journey: JOURNEY_IDS.PLAN },
  ] as IPermission[],
};

/**
 * Standard roles for testing
 */
export const TEST_ROLES = {
  // Basic user role
  USER: {
    id: 'user',
    name: 'User',
    description: 'Standard user with basic permissions',
    isDefault: true,
    permissions: TEST_PERMISSIONS.BASIC,
  } as IRole,

  // Admin role
  ADMIN: {
    id: 'admin',
    name: 'Administrator',
    description: 'Administrator with full system access',
    isDefault: false,
    permissions: [...TEST_PERMISSIONS.BASIC, ...TEST_PERMISSIONS.ADMIN],
  } as IRole,

  // Health journey roles
  HEALTH_USER: {
    id: 'health-user',
    name: 'Health User',
    description: 'User with health journey access',
    journey: JOURNEY_IDS.HEALTH,
    isDefault: true,
    permissions: [...TEST_PERMISSIONS.BASIC, ...TEST_PERMISSIONS.HEALTH],
  } as IRole,

  HEALTH_ADMIN: {
    id: 'health-admin',
    name: 'Health Administrator',
    description: 'Administrator for health journey',
    journey: JOURNEY_IDS.HEALTH,
    isDefault: false,
    permissions: [...TEST_PERMISSIONS.BASIC, ...TEST_PERMISSIONS.HEALTH, ...TEST_PERMISSIONS.ADMIN],
  } as IRole,

  // Care journey roles
  CARE_USER: {
    id: 'care-user',
    name: 'Care User',
    description: 'User with care journey access',
    journey: JOURNEY_IDS.CARE,
    isDefault: true,
    permissions: [...TEST_PERMISSIONS.BASIC, ...TEST_PERMISSIONS.CARE],
  } as IRole,

  CARE_ADMIN: {
    id: 'care-admin',
    name: 'Care Administrator',
    description: 'Administrator for care journey',
    journey: JOURNEY_IDS.CARE,
    isDefault: false,
    permissions: [...TEST_PERMISSIONS.BASIC, ...TEST_PERMISSIONS.CARE, ...TEST_PERMISSIONS.ADMIN],
  } as IRole,

  // Plan journey roles
  PLAN_USER: {
    id: 'plan-user',
    name: 'Plan User',
    description: 'User with plan journey access',
    journey: JOURNEY_IDS.PLAN,
    isDefault: true,
    permissions: [...TEST_PERMISSIONS.BASIC, ...TEST_PERMISSIONS.PLAN],
  } as IRole,

  PLAN_ADMIN: {
    id: 'plan-admin',
    name: 'Plan Administrator',
    description: 'Administrator for plan journey',
    journey: JOURNEY_IDS.PLAN,
    isDefault: false,
    permissions: [...TEST_PERMISSIONS.BASIC, ...TEST_PERMISSIONS.PLAN, ...TEST_PERMISSIONS.ADMIN],
  } as IRole,

  // Super admin role with all permissions
  SUPER_ADMIN: {
    id: 'super-admin',
    name: 'Super Administrator',
    description: 'Super administrator with access to all journeys and features',
    isDefault: false,
    permissions: [
      ...TEST_PERMISSIONS.BASIC,
      ...TEST_PERMISSIONS.ADMIN,
      ...TEST_PERMISSIONS.HEALTH,
      ...TEST_PERMISSIONS.CARE,
      ...TEST_PERMISSIONS.PLAN,
    ],
  } as IRole,
};

/**
 * Standard test users
 */
export const TEST_USERS = {
  // Regular user with basic permissions
  REGULAR_USER: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: [TEST_ROLES.USER],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  } as IUser,

  // Admin user with admin permissions
  ADMIN_USER: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: [TEST_ROLES.USER, TEST_ROLES.ADMIN],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  } as IUser,

  // Health journey user
  HEALTH_USER: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'health@example.com',
    firstName: 'Health',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: [TEST_ROLES.USER, TEST_ROLES.HEALTH_USER],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  } as IUser,

  // Care journey user
  CARE_USER: {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'care@example.com',
    firstName: 'Care',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: [TEST_ROLES.USER, TEST_ROLES.CARE_USER],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  } as IUser,

  // Plan journey user
  PLAN_USER: {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'plan@example.com',
    firstName: 'Plan',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: [TEST_ROLES.USER, TEST_ROLES.PLAN_USER],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  } as IUser,

  // Super admin with all permissions
  SUPER_ADMIN: {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'superadmin@example.com',
    firstName: 'Super',
    lastName: 'Admin',
    isActive: true,
    isVerified: true,
    roles: [TEST_ROLES.SUPER_ADMIN],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  } as IUser,

  // Inactive user for testing account status checks
  INACTIVE_USER: {
    id: '00000000-0000-0000-0000-000000000007',
    email: 'inactive@example.com',
    firstName: 'Inactive',
    lastName: 'User',
    isActive: false,
    isVerified: true,
    roles: [TEST_ROLES.USER],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  } as IUser,

  // Unverified user for testing verification flows
  UNVERIFIED_USER: {
    id: '00000000-0000-0000-0000-000000000008',
    email: 'unverified@example.com',
    firstName: 'Unverified',
    lastName: 'User',
    isActive: true,
    isVerified: false,
    roles: [TEST_ROLES.USER],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  } as IUser,

  // Multi-journey user with access to multiple journeys
  MULTI_JOURNEY_USER: {
    id: '00000000-0000-0000-0000-000000000009',
    email: 'multi@example.com',
    firstName: 'Multi',
    lastName: 'Journey',
    isActive: true,
    isVerified: true,
    roles: [TEST_ROLES.USER, TEST_ROLES.HEALTH_USER, TEST_ROLES.CARE_USER, TEST_ROLES.PLAN_USER],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  } as IUser,
};

/**
 * Test token payloads for different user types
 */
export const TEST_TOKEN_PAYLOADS = {
  REGULAR_USER: {
    sub: TEST_USERS.REGULAR_USER.id,
    email: TEST_USERS.REGULAR_USER.email,
    roles: TEST_USERS.REGULAR_USER.roles.map(role => role.id),
    permissions: TEST_USERS.REGULAR_USER.roles.flatMap(role => role.permissions.map(perm => perm.id)),
    iss: TEST_JWT_CONFIG.issuer,
    aud: TEST_JWT_CONFIG.audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  } as ITokenPayload,

  ADMIN_USER: {
    sub: TEST_USERS.ADMIN_USER.id,
    email: TEST_USERS.ADMIN_USER.email,
    roles: TEST_USERS.ADMIN_USER.roles.map(role => role.id),
    permissions: TEST_USERS.ADMIN_USER.roles.flatMap(role => role.permissions.map(perm => perm.id)),
    iss: TEST_JWT_CONFIG.issuer,
    aud: TEST_JWT_CONFIG.audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  } as ITokenPayload,

  HEALTH_USER: {
    sub: TEST_USERS.HEALTH_USER.id,
    email: TEST_USERS.HEALTH_USER.email,
    roles: TEST_USERS.HEALTH_USER.roles.map(role => role.id),
    permissions: TEST_USERS.HEALTH_USER.roles.flatMap(role => role.permissions.map(perm => perm.id)),
    iss: TEST_JWT_CONFIG.issuer,
    aud: TEST_JWT_CONFIG.audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    journey: JOURNEY_IDS.HEALTH,
  } as ITokenPayload,

  CARE_USER: {
    sub: TEST_USERS.CARE_USER.id,
    email: TEST_USERS.CARE_USER.email,
    roles: TEST_USERS.CARE_USER.roles.map(role => role.id),
    permissions: TEST_USERS.CARE_USER.roles.flatMap(role => role.permissions.map(perm => perm.id)),
    iss: TEST_JWT_CONFIG.issuer,
    aud: TEST_JWT_CONFIG.audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    journey: JOURNEY_IDS.CARE,
  } as ITokenPayload,

  PLAN_USER: {
    sub: TEST_USERS.PLAN_USER.id,
    email: TEST_USERS.PLAN_USER.email,
    roles: TEST_USERS.PLAN_USER.roles.map(role => role.id),
    permissions: TEST_USERS.PLAN_USER.roles.flatMap(role => role.permissions.map(perm => perm.id)),
    iss: TEST_JWT_CONFIG.issuer,
    aud: TEST_JWT_CONFIG.audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    journey: JOURNEY_IDS.PLAN,
  } as ITokenPayload,

  SUPER_ADMIN: {
    sub: TEST_USERS.SUPER_ADMIN.id,
    email: TEST_USERS.SUPER_ADMIN.email,
    roles: TEST_USERS.SUPER_ADMIN.roles.map(role => role.id),
    permissions: TEST_USERS.SUPER_ADMIN.roles.flatMap(role => role.permissions.map(perm => perm.id)),
    iss: TEST_JWT_CONFIG.issuer,
    aud: TEST_JWT_CONFIG.audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  } as ITokenPayload,

  EXPIRED: {
    sub: TEST_USERS.REGULAR_USER.id,
    email: TEST_USERS.REGULAR_USER.email,
    roles: TEST_USERS.REGULAR_USER.roles.map(role => role.id),
    permissions: TEST_USERS.REGULAR_USER.roles.flatMap(role => role.permissions.map(perm => perm.id)),
    iss: TEST_JWT_CONFIG.issuer,
    aud: TEST_JWT_CONFIG.audience,
    iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
  } as ITokenPayload,
};

/**
 * Test authentication scenarios
 */
export const TEST_AUTH_SCENARIOS = {
  VALID_LOGIN: {
    email: TEST_USERS.REGULAR_USER.email,
    password: 'Password123!',
  },
  INVALID_LOGIN: {
    email: 'nonexistent@example.com',
    password: 'WrongPassword123!',
  },
  INVALID_PASSWORD: {
    email: TEST_USERS.REGULAR_USER.email,
    password: 'WrongPassword123!',
  },
  INACTIVE_ACCOUNT: {
    email: TEST_USERS.INACTIVE_USER.email,
    password: 'Password123!',
  },
  UNVERIFIED_ACCOUNT: {
    email: TEST_USERS.UNVERIFIED_USER.email,
    password: 'Password123!',
  },
};

/**
 * Journey-specific test constants
 */
export const JOURNEY_TEST_CONSTANTS = {
  [JOURNEY_IDS.HEALTH]: {
    users: {
      regular: TEST_USERS.HEALTH_USER,
      admin: TEST_USERS.SUPER_ADMIN,
    },
    tokens: {
      regular: TEST_TOKEN_PAYLOADS.HEALTH_USER,
      admin: TEST_TOKEN_PAYLOADS.SUPER_ADMIN,
    },
    permissions: TEST_PERMISSIONS.HEALTH,
    roles: [TEST_ROLES.HEALTH_USER, TEST_ROLES.HEALTH_ADMIN],
    config: JOURNEY_CONFIG[JOURNEY_IDS.HEALTH],
  },
  [JOURNEY_IDS.CARE]: {
    users: {
      regular: TEST_USERS.CARE_USER,
      admin: TEST_USERS.SUPER_ADMIN,
    },
    tokens: {
      regular: TEST_TOKEN_PAYLOADS.CARE_USER,
      admin: TEST_TOKEN_PAYLOADS.SUPER_ADMIN,
    },
    permissions: TEST_PERMISSIONS.CARE,
    roles: [TEST_ROLES.CARE_USER, TEST_ROLES.CARE_ADMIN],
    config: JOURNEY_CONFIG[JOURNEY_IDS.CARE],
  },
  [JOURNEY_IDS.PLAN]: {
    users: {
      regular: TEST_USERS.PLAN_USER,
      admin: TEST_USERS.SUPER_ADMIN,
    },
    tokens: {
      regular: TEST_TOKEN_PAYLOADS.PLAN_USER,
      admin: TEST_TOKEN_PAYLOADS.SUPER_ADMIN,
    },
    permissions: TEST_PERMISSIONS.PLAN,
    roles: [TEST_ROLES.PLAN_USER, TEST_ROLES.PLAN_ADMIN],
    config: JOURNEY_CONFIG[JOURNEY_IDS.PLAN],
  },
};

/**
 * Mock database records for testing
 */
export const TEST_DB_RECORDS = {
  users: Object.values(TEST_USERS),
  roles: Object.values(TEST_ROLES),
  permissions: [
    ...TEST_PERMISSIONS.BASIC,
    ...TEST_PERMISSIONS.ADMIN,
    ...TEST_PERMISSIONS.HEALTH,
    ...TEST_PERMISSIONS.CARE,
    ...TEST_PERMISSIONS.PLAN,
  ],
};

/**
 * Helper function to create a test user with custom properties
 */
export const createTestUser = (overrides: Partial<IUser> = {}): IUser => {
  return {
    ...TEST_USERS.REGULAR_USER,
    id: `test-${Math.random().toString(36).substring(2, 9)}`,
    email: `test-${Math.random().toString(36).substring(2, 9)}@example.com`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

/**
 * Helper function to create a test token payload with custom properties
 */
export const createTestTokenPayload = (overrides: Partial<ITokenPayload> = {}): ITokenPayload => {
  return {
    ...TEST_TOKEN_PAYLOADS.REGULAR_USER,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
};
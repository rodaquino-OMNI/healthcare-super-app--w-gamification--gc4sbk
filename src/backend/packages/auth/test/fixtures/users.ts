/**
 * Test fixtures for user data with various roles, permissions, and profile information.
 * Used for testing authentication and authorization components across the AUSTA SuperApp.
 */

import { JwtPayload } from '../../src/interfaces';
import { JourneyType } from '@austa/interfaces';

/**
 * User fixture interface with all properties needed for comprehensive testing
 */
export interface UserFixture {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  journeyAccess: JourneyType[];
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profileData?: Record<string, any>;
}

/**
 * JWT payload fixture interface for token testing
 */
export interface JwtPayloadFixture extends JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  journeyAccess: JourneyType[];
  iat: number;
  exp: number;
}

/**
 * Admin user with access to all journeys and full permissions
 */
export const adminUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@austa.health',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin', 'health_admin', 'care_admin', 'plan_admin'],
  permissions: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'roles:create', 'roles:read', 'roles:update', 'roles:delete',
    'permissions:create', 'permissions:read', 'permissions:update', 'permissions:delete',
    'health:read', 'health:write', 'health:admin',
    'care:read', 'care:write', 'care:admin',
    'plan:read', 'plan:write', 'plan:admin',
  ],
  journeyAccess: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
  lastLoginAt: new Date('2023-06-01T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    notificationPreferences: {
      email: true,
      push: true,
      sms: true,
    },
    adminLevel: 'super',
  },
};

/**
 * Health journey admin user with full access to health journey
 */
export const healthAdminUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'health.admin@austa.health',
  firstName: 'Health',
  lastName: 'Admin',
  roles: ['health_admin'],
  permissions: [
    'health:read', 'health:write', 'health:admin',
    'health:metrics:read', 'health:metrics:write',
    'health:goals:read', 'health:goals:write',
    'health:devices:read', 'health:devices:write',
    'health:insights:read', 'health:insights:write',
  ],
  journeyAccess: [JourneyType.HEALTH],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-02T00:00:00Z'),
  updatedAt: new Date('2023-01-02T00:00:00Z'),
  lastLoginAt: new Date('2023-06-02T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    specialization: 'nutrition',
    department: 'Health Services',
  },
};

/**
 * Care journey admin user with full access to care journey
 */
export const careAdminUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000003',
  email: 'care.admin@austa.health',
  firstName: 'Care',
  lastName: 'Admin',
  roles: ['care_admin'],
  permissions: [
    'care:read', 'care:write', 'care:admin',
    'care:appointments:read', 'care:appointments:write',
    'care:providers:read', 'care:providers:write',
    'care:medications:read', 'care:medications:write',
    'care:telemedicine:read', 'care:telemedicine:write',
  ],
  journeyAccess: [JourneyType.CARE],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-03T00:00:00Z'),
  updatedAt: new Date('2023-01-03T00:00:00Z'),
  lastLoginAt: new Date('2023-06-03T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    specialization: 'general_practice',
    department: 'Care Services',
  },
};

/**
 * Plan journey admin user with full access to plan journey
 */
export const planAdminUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000004',
  email: 'plan.admin@austa.health',
  firstName: 'Plan',
  lastName: 'Admin',
  roles: ['plan_admin'],
  permissions: [
    'plan:read', 'plan:write', 'plan:admin',
    'plan:benefits:read', 'plan:benefits:write',
    'plan:claims:read', 'plan:claims:write',
    'plan:coverage:read', 'plan:coverage:write',
    'plan:documents:read', 'plan:documents:write',
  ],
  journeyAccess: [JourneyType.PLAN],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-04T00:00:00Z'),
  updatedAt: new Date('2023-01-04T00:00:00Z'),
  lastLoginAt: new Date('2023-06-04T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    specialization: 'insurance',
    department: 'Plan Services',
  },
};

/**
 * Regular user with access to all journeys but limited permissions
 */
export const regularUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000005',
  email: 'user@example.com',
  firstName: 'Regular',
  lastName: 'User',
  roles: ['user', 'health_user', 'care_user', 'plan_user'],
  permissions: [
    'health:read',
    'health:metrics:read',
    'health:goals:read',
    'care:read',
    'care:appointments:read',
    'care:medications:read',
    'plan:read',
    'plan:benefits:read',
    'plan:claims:read',
  ],
  journeyAccess: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-05T00:00:00Z'),
  updatedAt: new Date('2023-01-05T00:00:00Z'),
  lastLoginAt: new Date('2023-06-05T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    notificationPreferences: {
      email: true,
      push: true,
      sms: false,
    },
    healthProfile: {
      height: 175,
      weight: 70,
      bloodType: 'A+',
    },
  },
};

/**
 * Health journey user with read-only access
 */
export const healthReadOnlyUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000006',
  email: 'health.readonly@example.com',
  firstName: 'Health',
  lastName: 'ReadOnly',
  roles: ['health_readonly'],
  permissions: [
    'health:read',
    'health:metrics:read',
    'health:goals:read',
    'health:devices:read',
    'health:insights:read',
  ],
  journeyAccess: [JourneyType.HEALTH],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-06T00:00:00Z'),
  updatedAt: new Date('2023-01-06T00:00:00Z'),
  lastLoginAt: new Date('2023-06-06T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    healthProfile: {
      height: 165,
      weight: 60,
      bloodType: 'O+',
    },
  },
};

/**
 * Care journey user with read-only access
 */
export const careReadOnlyUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000007',
  email: 'care.readonly@example.com',
  firstName: 'Care',
  lastName: 'ReadOnly',
  roles: ['care_readonly'],
  permissions: [
    'care:read',
    'care:appointments:read',
    'care:providers:read',
    'care:medications:read',
    'care:telemedicine:read',
  ],
  journeyAccess: [JourneyType.CARE],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-07T00:00:00Z'),
  updatedAt: new Date('2023-01-07T00:00:00Z'),
  lastLoginAt: new Date('2023-06-07T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    careProfile: {
      primaryPhysician: 'Dr. Silva',
      allergies: ['penicillin'],
      emergencyContact: 'João Silva, (11) 98765-4321',
    },
  },
};

/**
 * Plan journey user with read-only access
 */
export const planReadOnlyUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000008',
  email: 'plan.readonly@example.com',
  firstName: 'Plan',
  lastName: 'ReadOnly',
  roles: ['plan_readonly'],
  permissions: [
    'plan:read',
    'plan:benefits:read',
    'plan:claims:read',
    'plan:coverage:read',
    'plan:documents:read',
  ],
  journeyAccess: [JourneyType.PLAN],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-08T00:00:00Z'),
  updatedAt: new Date('2023-01-08T00:00:00Z'),
  lastLoginAt: new Date('2023-06-08T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    planProfile: {
      planId: 'PREMIUM-2023',
      memberId: 'MBR-123456',
      startDate: '2023-01-01',
      coverageLevel: 'family',
    },
  },
};

/**
 * User with access to health and care journeys
 */
export const healthCareUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000009',
  email: 'health.care@example.com',
  firstName: 'Health',
  lastName: 'Care',
  roles: ['health_user', 'care_user'],
  permissions: [
    'health:read', 'health:write',
    'health:metrics:read', 'health:metrics:write',
    'health:goals:read', 'health:goals:write',
    'care:read', 'care:write',
    'care:appointments:read', 'care:appointments:write',
    'care:medications:read', 'care:medications:write',
  ],
  journeyAccess: [JourneyType.HEALTH, JourneyType.CARE],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-09T00:00:00Z'),
  updatedAt: new Date('2023-01-09T00:00:00Z'),
  lastLoginAt: new Date('2023-06-09T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    healthProfile: {
      height: 180,
      weight: 75,
      bloodType: 'B+',
    },
    careProfile: {
      primaryPhysician: 'Dr. Santos',
      allergies: ['sulfa'],
      emergencyContact: 'Maria Santos, (11) 91234-5678',
    },
  },
};

/**
 * User with access to health and plan journeys
 */
export const healthPlanUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000010',
  email: 'health.plan@example.com',
  firstName: 'Health',
  lastName: 'Plan',
  roles: ['health_user', 'plan_user'],
  permissions: [
    'health:read', 'health:write',
    'health:metrics:read', 'health:metrics:write',
    'health:goals:read', 'health:goals:write',
    'plan:read', 'plan:write',
    'plan:benefits:read', 'plan:benefits:write',
    'plan:claims:read', 'plan:claims:write',
  ],
  journeyAccess: [JourneyType.HEALTH, JourneyType.PLAN],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-10T00:00:00Z'),
  updatedAt: new Date('2023-01-10T00:00:00Z'),
  lastLoginAt: new Date('2023-06-10T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    healthProfile: {
      height: 170,
      weight: 65,
      bloodType: 'AB+',
    },
    planProfile: {
      planId: 'STANDARD-2023',
      memberId: 'MBR-654321',
      startDate: '2023-01-01',
      coverageLevel: 'individual',
    },
  },
};

/**
 * User with access to care and plan journeys
 */
export const carePlanUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000011',
  email: 'care.plan@example.com',
  firstName: 'Care',
  lastName: 'Plan',
  roles: ['care_user', 'plan_user'],
  permissions: [
    'care:read', 'care:write',
    'care:appointments:read', 'care:appointments:write',
    'care:medications:read', 'care:medications:write',
    'plan:read', 'plan:write',
    'plan:benefits:read', 'plan:benefits:write',
    'plan:claims:read', 'plan:claims:write',
  ],
  journeyAccess: [JourneyType.CARE, JourneyType.PLAN],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-11T00:00:00Z'),
  updatedAt: new Date('2023-01-11T00:00:00Z'),
  lastLoginAt: new Date('2023-06-11T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    careProfile: {
      primaryPhysician: 'Dr. Oliveira',
      allergies: ['latex'],
      emergencyContact: 'Carlos Oliveira, (11) 98765-1234',
    },
    planProfile: {
      planId: 'PREMIUM-2023',
      memberId: 'MBR-789012',
      startDate: '2023-01-01',
      coverageLevel: 'family',
    },
  },
};

/**
 * Inactive user for testing account status checks
 */
export const inactiveUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000012',
  email: 'inactive@example.com',
  firstName: 'Inactive',
  lastName: 'User',
  roles: ['user'],
  permissions: ['health:read', 'care:read', 'plan:read'],
  journeyAccess: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
  isActive: false,
  isVerified: true,
  createdAt: new Date('2023-01-12T00:00:00Z'),
  updatedAt: new Date('2023-01-12T00:00:00Z'),
  lastLoginAt: new Date('2023-03-12T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    deactivationReason: 'User requested account deactivation',
    deactivationDate: '2023-06-12',
  },
};

/**
 * Unverified user for testing email verification flows
 */
export const unverifiedUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000013',
  email: 'unverified@example.com',
  firstName: 'Unverified',
  lastName: 'User',
  roles: ['user'],
  permissions: ['health:read', 'care:read', 'plan:read'],
  journeyAccess: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
  isActive: true,
  isVerified: false,
  createdAt: new Date('2023-01-13T00:00:00Z'),
  updatedAt: new Date('2023-01-13T00:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    registrationSource: 'web',
    verificationEmailSent: true,
    verificationEmailSentAt: '2023-01-13T00:05:00Z',
  },
};

/**
 * User with no roles for testing default role assignment
 */
export const noRolesUser: UserFixture = {
  id: '00000000-0000-0000-0000-000000000014',
  email: 'noroles@example.com',
  firstName: 'NoRoles',
  lastName: 'User',
  roles: [],
  permissions: [],
  journeyAccess: [],
  isActive: true,
  isVerified: true,
  createdAt: new Date('2023-01-14T00:00:00Z'),
  updatedAt: new Date('2023-01-14T00:00:00Z'),
  lastLoginAt: new Date('2023-06-14T12:00:00Z'),
  profileData: {
    preferredLanguage: 'pt-BR',
    registrationSource: 'mobile',
  },
};

/**
 * Collection of all user fixtures for easy import
 */
export const userFixtures = {
  adminUser,
  healthAdminUser,
  careAdminUser,
  planAdminUser,
  regularUser,
  healthReadOnlyUser,
  careReadOnlyUser,
  planReadOnlyUser,
  healthCareUser,
  healthPlanUser,
  carePlanUser,
  inactiveUser,
  unverifiedUser,
  noRolesUser,
};

/**
 * JWT payload fixtures for token testing
 */
export const jwtPayloadFixtures: Record<string, JwtPayloadFixture> = {
  adminPayload: {
    userId: adminUser.id,
    email: adminUser.email,
    roles: adminUser.roles,
    permissions: adminUser.permissions,
    journeyAccess: adminUser.journeyAccess,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  },
  regularUserPayload: {
    userId: regularUser.id,
    email: regularUser.email,
    roles: regularUser.roles,
    permissions: regularUser.permissions,
    journeyAccess: regularUser.journeyAccess,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  },
  healthUserPayload: {
    userId: healthReadOnlyUser.id,
    email: healthReadOnlyUser.email,
    roles: healthReadOnlyUser.roles,
    permissions: healthReadOnlyUser.permissions,
    journeyAccess: healthReadOnlyUser.journeyAccess,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  },
  expiredPayload: {
    userId: regularUser.id,
    email: regularUser.email,
    roles: regularUser.roles,
    permissions: regularUser.permissions,
    journeyAccess: regularUser.journeyAccess,
    iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  },
};

/**
 * Helper function to create a custom user fixture
 * @param overrides - Properties to override in the base user fixture
 * @returns A custom user fixture with the specified overrides
 */
export function createUserFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  return {
    ...regularUser,
    id: `custom-${Math.random().toString(36).substring(2, 9)}`,
    email: `user-${Math.random().toString(36).substring(2, 9)}@example.com`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Helper function to create a custom JWT payload fixture
 * @param overrides - Properties to override in the base JWT payload fixture
 * @returns A custom JWT payload fixture with the specified overrides
 */
export function createJwtPayloadFixture(overrides: Partial<JwtPayloadFixture> = {}): JwtPayloadFixture {
  return {
    ...jwtPayloadFixtures.regularUserPayload,
    userId: `custom-${Math.random().toString(36).substring(2, 9)}`,
    email: `user-${Math.random().toString(36).substring(2, 9)}@example.com`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}
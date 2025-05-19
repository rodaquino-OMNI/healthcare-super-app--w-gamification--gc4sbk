/**
 * Authentication Test User Fixtures
 * 
 * This file provides standardized user objects for testing authentication and authorization
 * components across the AUSTA SuperApp. It includes users with various roles, permissions,
 * and profile information to support comprehensive testing of role-based access control
 * guards and decorators.
 * 
 * These fixtures are designed to be used in unit, integration, and e2e tests to ensure
 * consistent user-related test cases across the application.
 */

import { AuthenticatedUser, Role, Permission } from '../../src/types';
import { PERMISSIONS } from '../../src/constants';

/**
 * Standard permissions used across test fixtures
 */
export const testPermissions: Record<string, Permission> = {
  // User management permissions
  userCreate: {
    id: '1',
    name: PERMISSIONS.USER_CREATE,
    description: 'Create new users',
    resource: 'user',
    action: 'create',
  },
  userRead: {
    id: '2',
    name: PERMISSIONS.USER_READ,
    description: 'Read user information',
    resource: 'user',
    action: 'read',
  },
  userUpdate: {
    id: '3',
    name: PERMISSIONS.USER_UPDATE,
    description: 'Update user information',
    resource: 'user',
    action: 'update',
  },
  userDelete: {
    id: '4',
    name: PERMISSIONS.USER_DELETE,
    description: 'Delete users',
    resource: 'user',
    action: 'delete',
  },
  
  // Role management permissions
  roleCreate: {
    id: '5',
    name: PERMISSIONS.ROLE_CREATE,
    description: 'Create new roles',
    resource: 'role',
    action: 'create',
  },
  roleRead: {
    id: '6',
    name: PERMISSIONS.ROLE_READ,
    description: 'Read role information',
    resource: 'role',
    action: 'read',
  },
  roleUpdate: {
    id: '7',
    name: PERMISSIONS.ROLE_UPDATE,
    description: 'Update role information',
    resource: 'role',
    action: 'update',
  },
  roleDelete: {
    id: '8',
    name: PERMISSIONS.ROLE_DELETE,
    description: 'Delete roles',
    resource: 'role',
    action: 'delete',
  },
  
  // Journey-specific permissions
  healthJourneyAccess: {
    id: '9',
    name: PERMISSIONS.HEALTH_JOURNEY_ACCESS,
    description: 'Access to Health Journey',
    resource: 'journey',
    action: 'access:health',
  },
  careJourneyAccess: {
    id: '10',
    name: PERMISSIONS.CARE_JOURNEY_ACCESS,
    description: 'Access to Care Journey',
    resource: 'journey',
    action: 'access:care',
  },
  planJourneyAccess: {
    id: '11',
    name: PERMISSIONS.PLAN_JOURNEY_ACCESS,
    description: 'Access to Plan Journey',
    resource: 'journey',
    action: 'access:plan',
  },
  
  // Admin permissions
  adminAccess: {
    id: '12',
    name: PERMISSIONS.ADMIN_ACCESS,
    description: 'Admin access to all features',
    resource: 'admin',
    action: 'access',
  },
  systemConfig: {
    id: '13',
    name: PERMISSIONS.SYSTEM_CONFIG,
    description: 'Configure system settings',
    resource: 'system',
    action: 'config',
  },
};

/**
 * Standard roles used across test fixtures
 */
export const testRoles: Record<string, Role> = {
  // Core roles
  admin: {
    id: '1',
    name: 'admin',
    description: 'System administrator with full access',
    isSystem: true,
    permissions: [
      testPermissions.userCreate,
      testPermissions.userRead,
      testPermissions.userUpdate,
      testPermissions.userDelete,
      testPermissions.roleCreate,
      testPermissions.roleRead,
      testPermissions.roleUpdate,
      testPermissions.roleDelete,
      testPermissions.adminAccess,
      testPermissions.systemConfig,
      testPermissions.healthJourneyAccess,
      testPermissions.careJourneyAccess,
      testPermissions.planJourneyAccess,
    ],
  },
  user: {
    id: '2',
    name: 'user',
    description: 'Regular user with basic access',
    isSystem: true,
    permissions: [
      testPermissions.userRead,
    ],
  },
  
  // Health journey roles
  healthViewer: {
    id: '3',
    name: 'health:viewer',
    description: 'Can view health data but not modify',
    journeyId: 'health',
    permissions: [
      testPermissions.healthJourneyAccess,
    ],
  },
  healthEditor: {
    id: '4',
    name: 'health:editor',
    description: 'Can view and edit health data',
    journeyId: 'health',
    permissions: [
      testPermissions.healthJourneyAccess,
    ],
  },
  healthManager: {
    id: '5',
    name: 'health:manager',
    description: 'Can manage health goals and insights',
    journeyId: 'health',
    permissions: [
      testPermissions.healthJourneyAccess,
    ],
  },
  healthAdmin: {
    id: '6',
    name: 'health:admin',
    description: 'Full access to health journey features',
    journeyId: 'health',
    permissions: [
      testPermissions.healthJourneyAccess,
      testPermissions.adminAccess,
    ],
  },
  
  // Care journey roles
  careViewer: {
    id: '7',
    name: 'care:viewer',
    description: 'Can view care information but not modify',
    journeyId: 'care',
    permissions: [
      testPermissions.careJourneyAccess,
    ],
  },
  careScheduler: {
    id: '8',
    name: 'care:scheduler',
    description: 'Can schedule and manage appointments',
    journeyId: 'care',
    permissions: [
      testPermissions.careJourneyAccess,
    ],
  },
  careProvider: {
    id: '9',
    name: 'care:provider',
    description: 'Healthcare provider with access to patient data',
    journeyId: 'care',
    permissions: [
      testPermissions.careJourneyAccess,
    ],
  },
  careAdmin: {
    id: '10',
    name: 'care:admin',
    description: 'Full access to care journey features',
    journeyId: 'care',
    permissions: [
      testPermissions.careJourneyAccess,
      testPermissions.adminAccess,
    ],
  },
  
  // Plan journey roles
  planViewer: {
    id: '11',
    name: 'plan:viewer',
    description: 'Can view plan and benefits information',
    journeyId: 'plan',
    permissions: [
      testPermissions.planJourneyAccess,
    ],
  },
  planMember: {
    id: '12',
    name: 'plan:member',
    description: 'Can submit claims and access member benefits',
    journeyId: 'plan',
    permissions: [
      testPermissions.planJourneyAccess,
    ],
  },
  planManager: {
    id: '13',
    name: 'plan:manager',
    description: 'Can manage plan configurations and approvals',
    journeyId: 'plan',
    permissions: [
      testPermissions.planJourneyAccess,
    ],
  },
  planAdmin: {
    id: '14',
    name: 'plan:admin',
    description: 'Full access to plan journey features',
    journeyId: 'plan',
    permissions: [
      testPermissions.planJourneyAccess,
      testPermissions.adminAccess,
    ],
  },
};

/**
 * Test user fixtures with various roles and permissions
 */
export const testUsers: Record<string, AuthenticatedUser> = {
  // System administrator with full access
  admin: {
    id: '1',
    email: 'admin@austa.health',
    name: 'System Administrator',
    roles: ['admin'],
    permissions: Object.values(testPermissions).map(p => p.name),
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  
  // Regular user with basic access
  regularUser: {
    id: '2',
    email: 'user@austa.health',
    name: 'Regular User',
    roles: ['user'],
    permissions: [PERMISSIONS.USER_READ],
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  
  // Health journey users
  healthViewer: {
    id: '3',
    email: 'health.viewer@austa.health',
    name: 'Health Viewer',
    roles: ['user', 'health:viewer'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.HEALTH_JOURNEY_ACCESS],
    journeyAttributes: {
      health: {
        preferredMetrics: ['weight', 'steps', 'heartRate'],
        hasConnectedDevices: false,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  healthEditor: {
    id: '4',
    email: 'health.editor@austa.health',
    name: 'Health Editor',
    roles: ['user', 'health:editor'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.HEALTH_JOURNEY_ACCESS],
    journeyAttributes: {
      health: {
        preferredMetrics: ['weight', 'steps', 'heartRate', 'bloodPressure'],
        hasConnectedDevices: true,
        deviceIds: ['fitbit-123', 'scale-456'],
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  healthManager: {
    id: '5',
    email: 'health.manager@austa.health',
    name: 'Health Manager',
    roles: ['user', 'health:manager'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.HEALTH_JOURNEY_ACCESS],
    journeyAttributes: {
      health: {
        preferredMetrics: ['weight', 'steps', 'heartRate', 'bloodPressure', 'sleep'],
        hasConnectedDevices: true,
        deviceIds: ['fitbit-789', 'scale-012', 'smartwatch-345'],
        canManageGoals: true,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  healthAdmin: {
    id: '6',
    email: 'health.admin@austa.health',
    name: 'Health Admin',
    roles: ['user', 'health:admin'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.HEALTH_JOURNEY_ACCESS, PERMISSIONS.ADMIN_ACCESS],
    journeyAttributes: {
      health: {
        preferredMetrics: ['weight', 'steps', 'heartRate', 'bloodPressure', 'sleep', 'glucose'],
        hasConnectedDevices: true,
        deviceIds: ['fitbit-admin', 'scale-admin', 'smartwatch-admin'],
        canManageGoals: true,
        isAdmin: true,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  
  // Care journey users
  careViewer: {
    id: '7',
    email: 'care.viewer@austa.health',
    name: 'Care Viewer',
    roles: ['user', 'care:viewer'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.CARE_JOURNEY_ACCESS],
    journeyAttributes: {
      care: {
        preferredSpecialties: ['general', 'cardiology'],
        hasAppointments: false,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  careScheduler: {
    id: '8',
    email: 'care.scheduler@austa.health',
    name: 'Care Scheduler',
    roles: ['user', 'care:scheduler'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.CARE_JOURNEY_ACCESS],
    journeyAttributes: {
      care: {
        preferredSpecialties: ['general', 'cardiology', 'dermatology'],
        hasAppointments: true,
        appointmentIds: ['apt-123', 'apt-456'],
        canScheduleForOthers: true,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  careProvider: {
    id: '9',
    email: 'care.provider@austa.health',
    name: 'Care Provider',
    roles: ['user', 'care:provider'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.CARE_JOURNEY_ACCESS],
    journeyAttributes: {
      care: {
        providerSpecialty: 'cardiology',
        providerLicense: 'MD12345',
        hasPatients: true,
        patientCount: 25,
        canPrescribe: true,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  careAdmin: {
    id: '10',
    email: 'care.admin@austa.health',
    name: 'Care Admin',
    roles: ['user', 'care:admin'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.CARE_JOURNEY_ACCESS, PERMISSIONS.ADMIN_ACCESS],
    journeyAttributes: {
      care: {
        providerSpecialty: 'administration',
        providerLicense: 'ADM98765',
        hasPatients: false,
        canManageProviders: true,
        isAdmin: true,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  
  // Plan journey users
  planViewer: {
    id: '11',
    email: 'plan.viewer@austa.health',
    name: 'Plan Viewer',
    roles: ['user', 'plan:viewer'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.PLAN_JOURNEY_ACCESS],
    journeyAttributes: {
      plan: {
        planId: 'basic-plan',
        memberSince: '2022-01-01',
        hasClaims: false,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  planMember: {
    id: '12',
    email: 'plan.member@austa.health',
    name: 'Plan Member',
    roles: ['user', 'plan:member'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.PLAN_JOURNEY_ACCESS],
    journeyAttributes: {
      plan: {
        planId: 'premium-plan',
        memberSince: '2021-06-15',
        hasClaims: true,
        claimIds: ['claim-123', 'claim-456'],
        benefitUtilization: 0.75,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  planManager: {
    id: '13',
    email: 'plan.manager@austa.health',
    name: 'Plan Manager',
    roles: ['user', 'plan:manager'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.PLAN_JOURNEY_ACCESS],
    journeyAttributes: {
      plan: {
        departmentId: 'claims-processing',
        employeeId: 'EMP789',
        canApproveClaims: true,
        claimsProcessed: 150,
        approvalLimit: 5000,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  planAdmin: {
    id: '14',
    email: 'plan.admin@austa.health',
    name: 'Plan Admin',
    roles: ['user', 'plan:admin'],
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.PLAN_JOURNEY_ACCESS, PERMISSIONS.ADMIN_ACCESS],
    journeyAttributes: {
      plan: {
        departmentId: 'plan-administration',
        employeeId: 'ADM012',
        canConfigurePlans: true,
        canApproveClaims: true,
        approvalLimit: null, // unlimited
        isAdmin: true,
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  
  // Multi-journey users
  multiJourneyUser: {
    id: '15',
    email: 'multi.journey@austa.health',
    name: 'Multi-Journey User',
    roles: ['user', 'health:viewer', 'care:viewer', 'plan:member'],
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.HEALTH_JOURNEY_ACCESS,
      PERMISSIONS.CARE_JOURNEY_ACCESS,
      PERMISSIONS.PLAN_JOURNEY_ACCESS,
    ],
    journeyAttributes: {
      health: {
        preferredMetrics: ['weight', 'steps'],
        hasConnectedDevices: true,
        deviceIds: ['fitbit-multi'],
      },
      care: {
        preferredSpecialties: ['general'],
        hasAppointments: true,
        appointmentIds: ['apt-multi-1'],
      },
      plan: {
        planId: 'family-plan',
        memberSince: '2022-03-15',
        hasClaims: true,
        claimIds: ['claim-multi-1'],
      },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  
  // Special test cases
  noRolesUser: {
    id: '16',
    email: 'no.roles@austa.health',
    name: 'No Roles User',
    roles: [],
    permissions: [],
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
  expiredSessionUser: {
    id: '17',
    email: 'expired.session@austa.health',
    name: 'Expired Session User',
    roles: ['user'],
    permissions: [PERMISSIONS.USER_READ],
    lastAuthenticated: new Date('2020-01-01T00:00:00Z'), // Very old authentication
  },
  allJourneysAdmin: {
    id: '18',
    email: 'all.journeys.admin@austa.health',
    name: 'All Journeys Admin',
    roles: ['user', 'health:admin', 'care:admin', 'plan:admin'],
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.HEALTH_JOURNEY_ACCESS,
      PERMISSIONS.CARE_JOURNEY_ACCESS,
      PERMISSIONS.PLAN_JOURNEY_ACCESS,
      PERMISSIONS.ADMIN_ACCESS,
    ],
    journeyAttributes: {
      health: { isAdmin: true },
      care: { isAdmin: true },
      plan: { isAdmin: true },
    },
    lastAuthenticated: new Date('2023-01-01T00:00:00Z'),
  },
};

/**
 * Helper function to get a user with specific roles for testing
 * @param roles Array of role names to assign to the test user
 * @returns A test user with the specified roles
 */
export function getUserWithRoles(roles: string[]): AuthenticatedUser {
  return {
    id: 'test-user-id',
    email: 'test.user@austa.health',
    name: 'Test User',
    roles,
    permissions: roles.flatMap(role => {
      const roleObj = Object.values(testRoles).find(r => r.name === role);
      return roleObj?.permissions?.map(p => p.name) || [];
    }),
    lastAuthenticated: new Date(),
  };
}

/**
 * Helper function to get a user with specific permissions for testing
 * @param permissions Array of permission names to assign to the test user
 * @returns A test user with the specified permissions
 */
export function getUserWithPermissions(permissions: string[]): AuthenticatedUser {
  return {
    id: 'test-user-id',
    email: 'test.user@austa.health',
    name: 'Test User',
    roles: ['user'],
    permissions,
    lastAuthenticated: new Date(),
  };
}

/**
 * Helper function to create a custom test user
 * @param overrides Properties to override in the default test user
 * @returns A custom test user with the specified properties
 */
export function createTestUser(overrides: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 'test-user-id',
    email: 'test.user@austa.health',
    name: 'Test User',
    roles: ['user'],
    permissions: [PERMISSIONS.USER_READ],
    lastAuthenticated: new Date(),
    ...overrides,
  };
}
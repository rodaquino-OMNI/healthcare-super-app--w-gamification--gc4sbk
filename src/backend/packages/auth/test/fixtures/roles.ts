/**
 * Test fixtures for role-based access control (RBAC) testing.
 * 
 * This file provides sample role data structures for testing authentication and authorization
 * across the AUSTA SuperApp, including role definitions, permission sets, and role hierarchies.
 * 
 * These fixtures are essential for testing the RolesGuard and role-based authorization
 * across all three journeys (Health, Care, Plan) and the gamification system.
 */

import { JourneyType } from '../../src/interfaces/journey.enum';

/**
 * Permission fixture interface matching the Permission entity structure
 */
export interface PermissionFixture {
  id: number;
  name: string;
  description: string;
}

/**
 * Role fixture interface matching the Role entity structure
 */
export interface RoleFixture {
  id: number;
  name: string;
  description: string;
  journey: JourneyType | null;
  isDefault: boolean;
  permissions: PermissionFixture[];
}

/**
 * User with roles fixture interface for testing authorization
 */
export interface UserWithRolesFixture {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleFixture[];
}

/**
 * Sample permission fixtures for testing
 * 
 * Permissions follow the format: journey:resource:action
 * For global permissions: resource:action
 */
export const permissionFixtures: Record<string, PermissionFixture> = {
  // Global permissions
  viewUsers: {
    id: 1,
    name: 'users:read',
    description: 'View user information'
  },
  manageUsers: {
    id: 2,
    name: 'users:write',
    description: 'Create, update, and delete users'
  },
  viewRoles: {
    id: 3,
    name: 'roles:read',
    description: 'View roles and permissions'
  },
  manageRoles: {
    id: 4,
    name: 'roles:write',
    description: 'Create, update, and delete roles'
  },
  viewSettings: {
    id: 5,
    name: 'settings:read',
    description: 'View application settings'
  },
  manageSettings: {
    id: 6,
    name: 'settings:write',
    description: 'Update application settings'
  },
  
  // Health journey permissions
  viewHealthMetrics: {
    id: 7,
    name: 'health:metrics:read',
    description: 'View health metrics'
  },
  manageHealthMetrics: {
    id: 8,
    name: 'health:metrics:write',
    description: 'Create and update health metrics'
  },
  viewHealthGoals: {
    id: 9,
    name: 'health:goals:read',
    description: 'View health goals'
  },
  manageHealthGoals: {
    id: 10,
    name: 'health:goals:write',
    description: 'Create, update, and delete health goals'
  },
  connectDevices: {
    id: 11,
    name: 'health:devices:connect',
    description: 'Connect and manage health devices'
  },
  viewMedicalHistory: {
    id: 12,
    name: 'health:history:read',
    description: 'View medical history'
  },
  manageMedicalHistory: {
    id: 13,
    name: 'health:history:write',
    description: 'Update medical history'
  },
  
  // Care journey permissions
  viewAppointments: {
    id: 14,
    name: 'care:appointments:read',
    description: 'View appointments'
  },
  scheduleAppointments: {
    id: 15,
    name: 'care:appointments:write',
    description: 'Schedule and manage appointments'
  },
  viewProviders: {
    id: 16,
    name: 'care:providers:read',
    description: 'View healthcare providers'
  },
  manageProviders: {
    id: 17,
    name: 'care:providers:write',
    description: 'Manage healthcare provider information'
  },
  viewMedications: {
    id: 18,
    name: 'care:medications:read',
    description: 'View medications'
  },
  manageMedications: {
    id: 19,
    name: 'care:medications:write',
    description: 'Manage medication schedules'
  },
  accessTelemedicine: {
    id: 20,
    name: 'care:telemedicine:access',
    description: 'Access telemedicine services'
  },
  provideTelemedicine: {
    id: 21,
    name: 'care:telemedicine:provide',
    description: 'Provide telemedicine services'
  },
  
  // Plan journey permissions
  viewCoverage: {
    id: 22,
    name: 'plan:coverage:read',
    description: 'View insurance coverage information'
  },
  viewClaims: {
    id: 23,
    name: 'plan:claims:read',
    description: 'View insurance claims'
  },
  submitClaims: {
    id: 24,
    name: 'plan:claims:submit',
    description: 'Submit insurance claims'
  },
  manageClaims: {
    id: 25,
    name: 'plan:claims:manage',
    description: 'Manage and process insurance claims'
  },
  viewBenefits: {
    id: 26,
    name: 'plan:benefits:read',
    description: 'View insurance benefits'
  },
  manageBenefits: {
    id: 27,
    name: 'plan:benefits:write',
    description: 'Manage insurance benefits'
  },
  
  // Gamification permissions
  viewAchievements: {
    id: 28,
    name: 'gamification:achievements:read',
    description: 'View achievements and progress'
  },
  manageAchievements: {
    id: 29,
    name: 'gamification:achievements:write',
    description: 'Create and manage achievements'
  },
  viewLeaderboard: {
    id: 30,
    name: 'gamification:leaderboard:read',
    description: 'View leaderboards'
  },
  viewRewards: {
    id: 31,
    name: 'gamification:rewards:read',
    description: 'View available rewards'
  },
  manageRewards: {
    id: 32,
    name: 'gamification:rewards:write',
    description: 'Create and manage rewards'
  },
  redeemRewards: {
    id: 33,
    name: 'gamification:rewards:redeem',
    description: 'Redeem rewards'
  }
};

/**
 * Sample role fixtures for testing
 * 
 * Includes global roles and journey-specific roles with associated permissions
 */
export const roleFixtures: Record<string, RoleFixture> = {
  // Global roles
  superadmin: {
    id: 1,
    name: 'superadmin',
    description: 'Super administrator with full system access',
    journey: null,
    isDefault: false,
    permissions: Object.values(permissionFixtures)
  },
  admin: {
    id: 2,
    name: 'admin',
    description: 'Administrator with access to all journeys',
    journey: null,
    isDefault: false,
    permissions: [
      permissionFixtures.viewUsers,
      permissionFixtures.manageUsers,
      permissionFixtures.viewRoles,
      permissionFixtures.manageRoles,
      permissionFixtures.viewSettings,
      permissionFixtures.manageSettings,
      // Health journey admin permissions
      permissionFixtures.viewHealthMetrics,
      permissionFixtures.manageHealthMetrics,
      permissionFixtures.viewHealthGoals,
      permissionFixtures.manageHealthGoals,
      permissionFixtures.connectDevices,
      permissionFixtures.viewMedicalHistory,
      permissionFixtures.manageMedicalHistory,
      // Care journey admin permissions
      permissionFixtures.viewAppointments,
      permissionFixtures.scheduleAppointments,
      permissionFixtures.viewProviders,
      permissionFixtures.manageProviders,
      permissionFixtures.viewMedications,
      permissionFixtures.manageMedications,
      permissionFixtures.accessTelemedicine,
      // Plan journey admin permissions
      permissionFixtures.viewCoverage,
      permissionFixtures.viewClaims,
      permissionFixtures.submitClaims,
      permissionFixtures.manageClaims,
      permissionFixtures.viewBenefits,
      permissionFixtures.manageBenefits,
      // Gamification admin permissions
      permissionFixtures.viewAchievements,
      permissionFixtures.manageAchievements,
      permissionFixtures.viewLeaderboard,
      permissionFixtures.viewRewards,
      permissionFixtures.manageRewards
    ]
  },
  user: {
    id: 3,
    name: 'user',
    description: 'Standard user with basic access',
    journey: null,
    isDefault: true,
    permissions: [
      // Basic user permissions across all journeys
      permissionFixtures.viewHealthMetrics,
      permissionFixtures.viewHealthGoals,
      permissionFixtures.connectDevices,
      permissionFixtures.viewMedicalHistory,
      permissionFixtures.viewAppointments,
      permissionFixtures.scheduleAppointments,
      permissionFixtures.viewProviders,
      permissionFixtures.viewMedications,
      permissionFixtures.accessTelemedicine,
      permissionFixtures.viewCoverage,
      permissionFixtures.viewClaims,
      permissionFixtures.submitClaims,
      permissionFixtures.viewBenefits,
      permissionFixtures.viewAchievements,
      permissionFixtures.viewLeaderboard,
      permissionFixtures.viewRewards,
      permissionFixtures.redeemRewards
    ]
  },
  
  // Health journey roles
  healthAdmin: {
    id: 4,
    name: 'health:admin',
    description: 'Health journey administrator',
    journey: JourneyType.HEALTH,
    isDefault: false,
    permissions: [
      permissionFixtures.viewHealthMetrics,
      permissionFixtures.manageHealthMetrics,
      permissionFixtures.viewHealthGoals,
      permissionFixtures.manageHealthGoals,
      permissionFixtures.connectDevices,
      permissionFixtures.viewMedicalHistory,
      permissionFixtures.manageMedicalHistory
    ]
  },
  healthViewer: {
    id: 5,
    name: 'health:viewer',
    description: 'Health journey viewer (read-only)',
    journey: JourneyType.HEALTH,
    isDefault: false,
    permissions: [
      permissionFixtures.viewHealthMetrics,
      permissionFixtures.viewHealthGoals,
      permissionFixtures.viewMedicalHistory
    ]
  },
  caregiver: {
    id: 6,
    name: 'health:caregiver',
    description: 'Caregiver with limited health management permissions',
    journey: JourneyType.HEALTH,
    isDefault: false,
    permissions: [
      permissionFixtures.viewHealthMetrics,
      permissionFixtures.manageHealthMetrics,
      permissionFixtures.viewHealthGoals,
      permissionFixtures.manageHealthGoals,
      permissionFixtures.viewMedicalHistory
    ]
  },
  
  // Care journey roles
  careAdmin: {
    id: 7,
    name: 'care:admin',
    description: 'Care journey administrator',
    journey: JourneyType.CARE,
    isDefault: false,
    permissions: [
      permissionFixtures.viewAppointments,
      permissionFixtures.scheduleAppointments,
      permissionFixtures.viewProviders,
      permissionFixtures.manageProviders,
      permissionFixtures.viewMedications,
      permissionFixtures.manageMedications,
      permissionFixtures.accessTelemedicine,
      permissionFixtures.provideTelemedicine
    ]
  },
  provider: {
    id: 8,
    name: 'care:provider',
    description: 'Healthcare provider',
    journey: JourneyType.CARE,
    isDefault: false,
    permissions: [
      permissionFixtures.viewAppointments,
      permissionFixtures.scheduleAppointments,
      permissionFixtures.viewProviders,
      permissionFixtures.viewMedications,
      permissionFixtures.manageMedications,
      permissionFixtures.accessTelemedicine,
      permissionFixtures.provideTelemedicine,
      // Health journey permissions for providers
      permissionFixtures.viewHealthMetrics,
      permissionFixtures.viewHealthGoals,
      permissionFixtures.viewMedicalHistory
    ]
  },
  receptionist: {
    id: 9,
    name: 'care:receptionist',
    description: 'Medical office receptionist',
    journey: JourneyType.CARE,
    isDefault: false,
    permissions: [
      permissionFixtures.viewAppointments,
      permissionFixtures.scheduleAppointments,
      permissionFixtures.viewProviders
    ]
  },
  
  // Plan journey roles
  planAdmin: {
    id: 10,
    name: 'plan:admin',
    description: 'Plan journey administrator',
    journey: JourneyType.PLAN,
    isDefault: false,
    permissions: [
      permissionFixtures.viewCoverage,
      permissionFixtures.viewClaims,
      permissionFixtures.submitClaims,
      permissionFixtures.manageClaims,
      permissionFixtures.viewBenefits,
      permissionFixtures.manageBenefits
    ]
  },
  claimsProcessor: {
    id: 11,
    name: 'plan:claims-processor',
    description: 'Insurance claims processor',
    journey: JourneyType.PLAN,
    isDefault: false,
    permissions: [
      permissionFixtures.viewClaims,
      permissionFixtures.manageClaims,
      permissionFixtures.viewBenefits
    ]
  },
  benefitsManager: {
    id: 12,
    name: 'plan:benefits-manager',
    description: 'Insurance benefits manager',
    journey: JourneyType.PLAN,
    isDefault: false,
    permissions: [
      permissionFixtures.viewBenefits,
      permissionFixtures.manageBenefits,
      permissionFixtures.viewCoverage
    ]
  },
  
  // Gamification roles
  gamificationAdmin: {
    id: 13,
    name: 'gamification:admin',
    description: 'Gamification system administrator',
    journey: null, // Gamification spans all journeys
    isDefault: false,
    permissions: [
      permissionFixtures.viewAchievements,
      permissionFixtures.manageAchievements,
      permissionFixtures.viewLeaderboard,
      permissionFixtures.viewRewards,
      permissionFixtures.manageRewards
    ]
  }
};

/**
 * Sample user fixtures with roles for testing authorization
 */
export const userWithRolesFixtures: Record<string, UserWithRolesFixture> = {
  superadmin: {
    id: '1',
    email: 'superadmin@austa.health',
    firstName: 'Super',
    lastName: 'Admin',
    roles: [roleFixtures.superadmin]
  },
  admin: {
    id: '2',
    email: 'admin@austa.health',
    firstName: 'Admin',
    lastName: 'User',
    roles: [roleFixtures.admin]
  },
  regularUser: {
    id: '3',
    email: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    roles: [roleFixtures.user]
  },
  healthAdmin: {
    id: '4',
    email: 'health.admin@austa.health',
    firstName: 'Health',
    lastName: 'Admin',
    roles: [roleFixtures.healthAdmin]
  },
  careAdmin: {
    id: '5',
    email: 'care.admin@austa.health',
    firstName: 'Care',
    lastName: 'Admin',
    roles: [roleFixtures.careAdmin]
  },
  planAdmin: {
    id: '6',
    email: 'plan.admin@austa.health',
    firstName: 'Plan',
    lastName: 'Admin',
    roles: [roleFixtures.planAdmin]
  },
  provider: {
    id: '7',
    email: 'provider@hospital.org',
    firstName: 'Doctor',
    lastName: 'Provider',
    roles: [roleFixtures.provider]
  },
  caregiver: {
    id: '8',
    email: 'caregiver@example.com',
    firstName: 'Care',
    lastName: 'Giver',
    roles: [roleFixtures.caregiver]
  },
  multiRole: {
    id: '9',
    email: 'multi.role@example.com',
    firstName: 'Multi',
    lastName: 'Role',
    roles: [roleFixtures.user, roleFixtures.caregiver, roleFixtures.healthViewer]
  },
  noRoles: {
    id: '10',
    email: 'no.roles@example.com',
    firstName: 'No',
    lastName: 'Roles',
    roles: []
  }
};

/**
 * Role hierarchy for testing inheritance
 * Maps child roles to their parent roles
 */
export const roleHierarchy: Record<string, string[]> = {
  // Global hierarchy
  'superadmin': [],
  'admin': ['superadmin'],
  'user': ['admin'],
  
  // Health journey hierarchy
  'health:admin': ['admin'],
  'health:viewer': ['health:admin'],
  'health:caregiver': ['health:viewer'],
  
  // Care journey hierarchy
  'care:admin': ['admin'],
  'care:provider': ['care:admin'],
  'care:receptionist': ['care:admin'],
  
  // Plan journey hierarchy
  'plan:admin': ['admin'],
  'plan:claims-processor': ['plan:admin'],
  'plan:benefits-manager': ['plan:admin'],
  
  // Gamification hierarchy
  'gamification:admin': ['admin']
};

/**
 * Helper function to check if a role has a specific permission
 * @param roleName Name of the role to check
 * @param permissionName Name of the permission to check for
 * @returns Boolean indicating if the role has the permission
 */
export function roleHasPermission(roleName: string, permissionName: string): boolean {
  const role = roleFixtures[roleName];
  if (!role) return false;
  
  return role.permissions.some(permission => permission.name === permissionName);
}

/**
 * Helper function to check if a role inherits from another role
 * @param childRoleName Name of the child role
 * @param parentRoleName Name of the potential parent role
 * @returns Boolean indicating if childRole inherits from parentRole
 */
export function roleInheritsFrom(childRoleName: string, parentRoleName: string): boolean {
  if (childRoleName === parentRoleName) return true;
  
  const parentRoles = roleHierarchy[childRoleName] || [];
  if (parentRoles.includes(parentRoleName)) return true;
  
  // Check recursively up the hierarchy
  return parentRoles.some(role => roleInheritsFrom(role, parentRoleName));
}

/**
 * Helper function to get all permissions for a role, including inherited permissions
 * @param roleName Name of the role to get permissions for
 * @returns Array of permission names
 */
export function getAllRolePermissions(roleName: string): string[] {
  const role = roleFixtures[roleName];
  if (!role) return [];
  
  // Get direct permissions
  const directPermissions = role.permissions.map(p => p.name);
  
  // Get inherited permissions from parent roles
  const parentRoles = roleHierarchy[roleName] || [];
  const inheritedPermissions = parentRoles.flatMap(parentRole => getAllRolePermissions(parentRole));
  
  // Combine and deduplicate
  return [...new Set([...directPermissions, ...inheritedPermissions])];
}
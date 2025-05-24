/**
 * Test fixtures for role-based access control (RBAC) testing.
 * 
 * This file provides sample role data structures for testing the RolesGuard
 * and role-based authorization across the AUSTA SuperApp. It includes role
 * definitions, permission sets, and role hierarchies for all three journeys:
 * Health, Care, and Plan.
 */

/**
 * Interface representing a permission for testing purposes
 */
export interface TestPermission {
  id: number;
  name: string;
  description: string;
}

/**
 * Interface representing a role for testing purposes
 */
export interface TestRole {
  id: number;
  name: string;
  description: string;
  journey: string | null;
  isDefault: boolean;
  permissions: TestPermission[];
}

/**
 * Sample permissions for testing, organized by journey and resource
 */
export const testPermissions: Record<string, TestPermission> = {
  // Global permissions
  viewProfile: {
    id: 1,
    name: 'global:profile:read',
    description: 'View user profile information'
  },
  updateProfile: {
    id: 2,
    name: 'global:profile:update',
    description: 'Update user profile information'
  },
  manageUsers: {
    id: 3,
    name: 'global:users:manage',
    description: 'Manage user accounts'
  },
  
  // Health journey permissions
  viewHealthMetrics: {
    id: 101,
    name: 'health:metrics:read',
    description: 'View health metrics'
  },
  createHealthMetrics: {
    id: 102,
    name: 'health:metrics:create',
    description: 'Create health metrics'
  },
  updateHealthMetrics: {
    id: 103,
    name: 'health:metrics:update',
    description: 'Update health metrics'
  },
  deleteHealthMetrics: {
    id: 104,
    name: 'health:metrics:delete',
    description: 'Delete health metrics'
  },
  viewHealthGoals: {
    id: 105,
    name: 'health:goals:read',
    description: 'View health goals'
  },
  createHealthGoals: {
    id: 106,
    name: 'health:goals:create',
    description: 'Create health goals'
  },
  updateHealthGoals: {
    id: 107,
    name: 'health:goals:update',
    description: 'Update health goals'
  },
  deleteHealthGoals: {
    id: 108,
    name: 'health:goals:delete',
    description: 'Delete health goals'
  },
  manageDevices: {
    id: 109,
    name: 'health:devices:manage',
    description: 'Manage connected health devices'
  },
  
  // Care journey permissions
  viewAppointments: {
    id: 201,
    name: 'care:appointments:read',
    description: 'View appointments'
  },
  createAppointments: {
    id: 202,
    name: 'care:appointments:create',
    description: 'Schedule appointments'
  },
  updateAppointments: {
    id: 203,
    name: 'care:appointments:update',
    description: 'Update appointments'
  },
  cancelAppointments: {
    id: 204,
    name: 'care:appointments:cancel',
    description: 'Cancel appointments'
  },
  viewProviders: {
    id: 205,
    name: 'care:providers:read',
    description: 'View healthcare providers'
  },
  manageProviders: {
    id: 206,
    name: 'care:providers:manage',
    description: 'Manage healthcare providers'
  },
  viewMedications: {
    id: 207,
    name: 'care:medications:read',
    description: 'View medications'
  },
  manageMedications: {
    id: 208,
    name: 'care:medications:manage',
    description: 'Manage medications'
  },
  accessTelemedicine: {
    id: 209,
    name: 'care:telemedicine:access',
    description: 'Access telemedicine services'
  },
  provideTelemedicine: {
    id: 210,
    name: 'care:telemedicine:provide',
    description: 'Provide telemedicine services'
  },
  
  // Plan journey permissions
  viewPlans: {
    id: 301,
    name: 'plan:plans:read',
    description: 'View insurance plans'
  },
  managePlans: {
    id: 302,
    name: 'plan:plans:manage',
    description: 'Manage insurance plans'
  },
  viewBenefits: {
    id: 303,
    name: 'plan:benefits:read',
    description: 'View insurance benefits'
  },
  manageBenefits: {
    id: 304,
    name: 'plan:benefits:manage',
    description: 'Manage insurance benefits'
  },
  viewClaims: {
    id: 305,
    name: 'plan:claims:read',
    description: 'View insurance claims'
  },
  submitClaims: {
    id: 306,
    name: 'plan:claims:submit',
    description: 'Submit insurance claims'
  },
  approveClaims: {
    id: 307,
    name: 'plan:claims:approve',
    description: 'Approve insurance claims'
  },
  rejectClaims: {
    id: 308,
    name: 'plan:claims:reject',
    description: 'Reject insurance claims'
  },
  viewCoverage: {
    id: 309,
    name: 'plan:coverage:read',
    description: 'View insurance coverage'
  },
  manageCoverage: {
    id: 310,
    name: 'plan:coverage:manage',
    description: 'Manage insurance coverage'
  },
  
  // Gamification permissions
  viewAchievements: {
    id: 401,
    name: 'gamification:achievements:read',
    description: 'View achievements'
  },
  manageAchievements: {
    id: 402,
    name: 'gamification:achievements:manage',
    description: 'Manage achievements'
  },
  viewRewards: {
    id: 403,
    name: 'gamification:rewards:read',
    description: 'View rewards'
  },
  manageRewards: {
    id: 404,
    name: 'gamification:rewards:manage',
    description: 'Manage rewards'
  },
  viewLeaderboard: {
    id: 405,
    name: 'gamification:leaderboard:read',
    description: 'View leaderboard'
  },
  manageLeaderboard: {
    id: 406,
    name: 'gamification:leaderboard:manage',
    description: 'Manage leaderboard'
  }
};

/**
 * Permission sets grouped by role type for easier role creation
 */
export const permissionSets = {
  // Global permission sets
  basicUser: [
    testPermissions.viewProfile,
    testPermissions.updateProfile,
    testPermissions.viewAchievements,
    testPermissions.viewRewards,
    testPermissions.viewLeaderboard
  ],
  admin: [
    testPermissions.viewProfile,
    testPermissions.updateProfile,
    testPermissions.manageUsers,
    testPermissions.manageAchievements,
    testPermissions.manageRewards,
    testPermissions.manageLeaderboard
  ],
  
  // Health journey permission sets
  healthViewer: [
    testPermissions.viewHealthMetrics,
    testPermissions.viewHealthGoals
  ],
  healthUser: [
    testPermissions.viewHealthMetrics,
    testPermissions.createHealthMetrics,
    testPermissions.updateHealthMetrics,
    testPermissions.viewHealthGoals,
    testPermissions.createHealthGoals,
    testPermissions.updateHealthGoals,
    testPermissions.manageDevices
  ],
  healthManager: [
    testPermissions.viewHealthMetrics,
    testPermissions.createHealthMetrics,
    testPermissions.updateHealthMetrics,
    testPermissions.deleteHealthMetrics,
    testPermissions.viewHealthGoals,
    testPermissions.createHealthGoals,
    testPermissions.updateHealthGoals,
    testPermissions.deleteHealthGoals,
    testPermissions.manageDevices
  ],
  
  // Care journey permission sets
  careViewer: [
    testPermissions.viewAppointments,
    testPermissions.viewProviders,
    testPermissions.viewMedications
  ],
  careUser: [
    testPermissions.viewAppointments,
    testPermissions.createAppointments,
    testPermissions.updateAppointments,
    testPermissions.cancelAppointments,
    testPermissions.viewProviders,
    testPermissions.viewMedications,
    testPermissions.manageMedications,
    testPermissions.accessTelemedicine
  ],
  careProvider: [
    testPermissions.viewAppointments,
    testPermissions.updateAppointments,
    testPermissions.cancelAppointments,
    testPermissions.viewProviders,
    testPermissions.viewMedications,
    testPermissions.manageMedications,
    testPermissions.accessTelemedicine,
    testPermissions.provideTelemedicine
  ],
  careManager: [
    testPermissions.viewAppointments,
    testPermissions.createAppointments,
    testPermissions.updateAppointments,
    testPermissions.cancelAppointments,
    testPermissions.viewProviders,
    testPermissions.manageProviders,
    testPermissions.viewMedications,
    testPermissions.manageMedications,
    testPermissions.accessTelemedicine,
    testPermissions.provideTelemedicine
  ],
  
  // Plan journey permission sets
  planViewer: [
    testPermissions.viewPlans,
    testPermissions.viewBenefits,
    testPermissions.viewClaims,
    testPermissions.viewCoverage
  ],
  planUser: [
    testPermissions.viewPlans,
    testPermissions.viewBenefits,
    testPermissions.viewClaims,
    testPermissions.submitClaims,
    testPermissions.viewCoverage
  ],
  planManager: [
    testPermissions.viewPlans,
    testPermissions.managePlans,
    testPermissions.viewBenefits,
    testPermissions.manageBenefits,
    testPermissions.viewClaims,
    testPermissions.submitClaims,
    testPermissions.approveClaims,
    testPermissions.rejectClaims,
    testPermissions.viewCoverage,
    testPermissions.manageCoverage
  ]
};

/**
 * Sample roles for testing, including global and journey-specific roles
 */
export const testRoles: Record<string, TestRole> = {
  // Global roles
  admin: {
    id: 1,
    name: 'admin',
    description: 'Administrator with full access to all features',
    journey: null,
    isDefault: false,
    permissions: permissionSets.admin
  },
  user: {
    id: 2,
    name: 'user',
    description: 'Basic user with limited access',
    journey: null,
    isDefault: true,
    permissions: permissionSets.basicUser
  },
  
  // Health journey roles
  healthViewer: {
    id: 101,
    name: 'health:viewer',
    description: 'User who can view health data but not modify it',
    journey: 'health',
    isDefault: false,
    permissions: [...permissionSets.basicUser, ...permissionSets.healthViewer]
  },
  healthUser: {
    id: 102,
    name: 'health:user',
    description: 'User who can manage their own health data',
    journey: 'health',
    isDefault: true,
    permissions: [...permissionSets.basicUser, ...permissionSets.healthUser]
  },
  healthManager: {
    id: 103,
    name: 'health:manager',
    description: 'User who can manage all health data',
    journey: 'health',
    isDefault: false,
    permissions: [...permissionSets.basicUser, ...permissionSets.healthManager]
  },
  
  // Care journey roles
  careViewer: {
    id: 201,
    name: 'care:viewer',
    description: 'User who can view care data but not modify it',
    journey: 'care',
    isDefault: false,
    permissions: [...permissionSets.basicUser, ...permissionSets.careViewer]
  },
  careUser: {
    id: 202,
    name: 'care:user',
    description: 'User who can manage their own care',
    journey: 'care',
    isDefault: true,
    permissions: [...permissionSets.basicUser, ...permissionSets.careUser]
  },
  careProvider: {
    id: 203,
    name: 'care:provider',
    description: 'Healthcare provider who can provide care services',
    journey: 'care',
    isDefault: false,
    permissions: [...permissionSets.basicUser, ...permissionSets.careProvider]
  },
  careManager: {
    id: 204,
    name: 'care:manager',
    description: 'User who can manage all care services',
    journey: 'care',
    isDefault: false,
    permissions: [...permissionSets.basicUser, ...permissionSets.careManager]
  },
  
  // Plan journey roles
  planViewer: {
    id: 301,
    name: 'plan:viewer',
    description: 'User who can view plan data but not modify it',
    journey: 'plan',
    isDefault: false,
    permissions: [...permissionSets.basicUser, ...permissionSets.planViewer]
  },
  planUser: {
    id: 302,
    name: 'plan:user',
    description: 'User who can manage their own plan and submit claims',
    journey: 'plan',
    isDefault: true,
    permissions: [...permissionSets.basicUser, ...permissionSets.planUser]
  },
  planManager: {
    id: 303,
    name: 'plan:manager',
    description: 'User who can manage all plans and claims',
    journey: 'plan',
    isDefault: false,
    permissions: [...permissionSets.basicUser, ...permissionSets.planManager]
  }
};

/**
 * Role hierarchy for testing inheritance and relationships
 */
export const roleHierarchy = {
  // Global hierarchy
  global: {
    admin: ['user'],
    user: []
  },
  
  // Health journey hierarchy
  health: {
    'health:manager': ['health:user', 'health:viewer'],
    'health:user': ['health:viewer'],
    'health:viewer': []
  },
  
  // Care journey hierarchy
  care: {
    'care:manager': ['care:provider', 'care:user', 'care:viewer'],
    'care:provider': ['care:viewer'],
    'care:user': ['care:viewer'],
    'care:viewer': []
  },
  
  // Plan journey hierarchy
  plan: {
    'plan:manager': ['plan:user', 'plan:viewer'],
    'plan:user': ['plan:viewer'],
    'plan:viewer': []
  }
};

/**
 * Helper function to get all permissions for a given role, including inherited permissions
 * @param roleName The name of the role
 * @returns Array of permissions for the role
 */
export function getAllPermissionsForRole(roleName: string): TestPermission[] {
  const role = testRoles[roleName];
  if (!role) {
    return [];
  }
  
  // Get direct permissions
  const permissions = [...role.permissions];
  
  // Get inherited permissions from role hierarchy
  const journeyKey = role.journey || 'global';
  const hierarchy = roleHierarchy[journeyKey];
  
  if (hierarchy && hierarchy[roleName]) {
    const inheritedRoles = hierarchy[roleName];
    for (const inheritedRole of inheritedRoles) {
      const inheritedPermissions = getAllPermissionsForRole(inheritedRole);
      for (const permission of inheritedPermissions) {
        if (!permissions.some(p => p.id === permission.id)) {
          permissions.push(permission);
        }
      }
    }
  }
  
  return permissions;
}

/**
 * Helper function to check if a role has a specific permission
 * @param roleName The name of the role
 * @param permissionName The name of the permission
 * @returns Boolean indicating if the role has the permission
 */
export function roleHasPermission(roleName: string, permissionName: string): boolean {
  const permissions = getAllPermissionsForRole(roleName);
  return permissions.some(p => p.name === permissionName);
}

/**
 * Helper function to get all roles that have a specific permission
 * @param permissionName The name of the permission
 * @returns Array of role names that have the permission
 */
export function getRolesWithPermission(permissionName: string): string[] {
  return Object.keys(testRoles).filter(roleName => 
    roleHasPermission(roleName, permissionName)
  );
}

/**
 * Helper function to get all roles for a specific journey
 * @param journey The journey name ('health', 'care', 'plan') or null for global roles
 * @returns Array of roles for the journey
 */
export function getRolesForJourney(journey: string | null): TestRole[] {
  return Object.values(testRoles).filter(role => role.journey === journey);
}

/**
 * Helper function to get default roles for a specific journey
 * @param journey The journey name ('health', 'care', 'plan') or null for global roles
 * @returns Array of default roles for the journey
 */
export function getDefaultRolesForJourney(journey: string | null): TestRole[] {
  return getRolesForJourney(journey).filter(role => role.isDefault);
}
/**
 * @file Role fixtures for testing
 * @module @austa/database/test/fixtures/common/roles
 * 
 * This file provides test fixtures for role entities used in authorization tests
 * across the AUSTA SuperApp. It contains predefined role objects with permissions
 * assignments that mirror production configurations.
 * 
 * These fixtures are critical for testing role-based access control and permission
 * validation in all journey services.
 */

import { IPermission, IRole, RoleId } from '@austa/interfaces/auth';
import { 
  getAllPermissionsArray, 
  PermissionFixture,
  healthPermissions,
  carePermissions,
  planPermissions,
  gamificationPermissions
} from './permissions.fixtures';

/**
 * Type for role fixture with optional overrides
 */
export type RoleFixture = Omit<IRole, 'permissions'> & {
  permissions?: string[];
};

/**
 * Type for role fixture with resolved permission objects
 */
export type ResolvedRoleFixture = IRole;

/**
 * Interface for role fixtures organized by journey
 */
export interface JourneyRoleFixtures {
  health: Record<string, RoleFixture>;
  care: Record<string, RoleFixture>;
  plan: Record<string, RoleFixture>;
  global: Record<string, RoleFixture>;
}

/**
 * Consistent role IDs for testing
 */
export const roleIds = {
  user: 1 as RoleId,
  caregiver: 2 as RoleId,
  provider: 3 as RoleId,
  administrator: 4 as RoleId,
  healthAdmin: 5 as RoleId,
  careAdmin: 6 as RoleId,
  planAdmin: 7 as RoleId,
};

/**
 * Factory function to create a role fixture with default values
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A role fixture object
 */
export function createRoleFixture(overrides: Partial<RoleFixture> = {}): RoleFixture {
  return {
    id: Math.floor(Math.random() * 1000) as RoleId,
    name: `Role-${Math.random().toString(36).substring(2, 7)}`,
    description: 'Test role description',
    isDefault: false,
    journey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [],
    ...overrides,
  };
}

/**
 * Resolves permission names to permission objects
 * 
 * @param role - Role fixture with permission names
 * @returns Role with resolved permission objects
 */
export function resolveRolePermissions(role: RoleFixture): ResolvedRoleFixture {
  const { permissions: permissionNames = [], ...roleData } = role;
  
  // Get all available permissions
  const allPermissions = getAllPermissionsArray();
  
  // Convert PermissionFixture to IPermission
  const resolvedPermissions: IPermission[] = permissionNames.map(name => {
    // Find the permission by name in the fixtures
    const permissionFixture = allPermissions.find(p => p.name === name);
    
    if (!permissionFixture) {
      throw new Error(`Permission not found: ${name}`);
    }
    
    // Convert PermissionFixture to IPermission
    return {
      id: Number(permissionFixture.id?.replace(/\D/g, '')) || Math.floor(Math.random() * 1000),
      name: permissionFixture.name,
      description: permissionFixture.description,
      createdAt: new Date(),
      updatedAt: new Date()
    } as IPermission;
  });
  
  return {
    ...roleData,
    permissions: resolvedPermissions,
  };
}

/**
 * Creates a set of roles with resolved permissions
 * 
 * @param roles - Record of role fixtures
 * @returns Record of resolved role fixtures
 */
export function createRolesWithPermissions<T extends Record<string, RoleFixture>>(
  roles: T
): Record<keyof T, ResolvedRoleFixture> {
  const result = {} as Record<keyof T, ResolvedRoleFixture>;
  
  for (const [key, role] of Object.entries(roles)) {
    result[key as keyof T] = resolveRolePermissions(role);
  }
  
  return result;
}

/**
 * Role fixtures organized by journey
 */
export const journeyRoleFixtures: JourneyRoleFixtures = {
  health: {
    healthAdmin: createRoleFixture({
      id: roleIds.healthAdmin,
      name: 'HealthAdmin',
      description: 'Administrator for the Health journey',
      journey: 'health',
      permissions: [
        'health:metrics:read',
        'health:metrics:write',
        'health:history:read',
        'health:history:write',
        'health:goals:read',
        'health:goals:write',
        'health:devices:read',
        'health:devices:write',
      ],
    }),
  },
  care: {
    provider: createRoleFixture({
      id: roleIds.provider,
      name: 'Provider',
      description: 'Healthcare provider with access to patient data',
      journey: 'care',
      permissions: [
        'health:metrics:read',
        'health:history:read',
        'health:history:write',
        'care:appointments:read',
        'care:appointments:write',
        'care:telemedicine:read',
        'care:telemedicine:write',
        'care:medications:read',
        'care:medications:write',
        'care:treatments:read',
        'care:treatments:write',
      ],
    }),
    careAdmin: createRoleFixture({
      id: roleIds.careAdmin,
      name: 'CareAdmin',
      description: 'Administrator for the Care journey',
      journey: 'care',
      permissions: [
        'care:appointments:read',
        'care:appointments:write',
        'care:telemedicine:read',
        'care:telemedicine:write',
        'care:medications:read',
        'care:medications:write',
        'care:treatments:read',
        'care:treatments:write',
      ],
    }),
  },
  plan: {
    planAdmin: createRoleFixture({
      id: roleIds.planAdmin,
      name: 'PlanAdmin',
      description: 'Administrator for the Plan journey',
      journey: 'plan',
      permissions: [
        'plan:coverage:read',
        'plan:claims:read',
        'plan:claims:write',
        'plan:benefits:read',
        'plan:documents:read',
        'plan:documents:write',
        'plan:payments:read',
        'plan:simulator:use',
      ],
    }),
  },
  global: {
    user: createRoleFixture({
      id: roleIds.user,
      name: 'User',
      description: 'Standard user with access to all journeys',
      isDefault: true,
      journey: null,
      permissions: [
        // Health journey - basic access
        'health:metrics:read',
        'health:metrics:write',
        'health:history:read',
        'health:goals:read',
        'health:goals:write',
        'health:devices:read',
        'health:devices:write',
        
        // Care journey - basic access
        'care:appointments:read',
        'care:appointments:write',
        'care:telemedicine:read',
        'care:telemedicine:write',
        'care:medications:read',
        'care:medications:write',
        'care:treatments:read',
        
        // Plan journey - basic access
        'plan:coverage:read',
        'plan:claims:read',
        'plan:claims:write',
        'plan:benefits:read',
        'plan:documents:read',
        'plan:documents:write',
        'plan:payments:read',
        'plan:simulator:use',
        
        // Gamification
        'game:achievements:read',
        'game:progress:read',
        'game:rewards:read',
        'game:rewards:redeem',
        'game:leaderboard:read',
      ],
    }),
    caregiver: createRoleFixture({
      id: roleIds.caregiver,
      name: 'Caregiver',
      description: 'User with delegated access to another user\'s health data',
      isDefault: false,
      journey: null,
      permissions: [
        'health:metrics:read',
        'health:history:read',
        'health:goals:read',
        'care:appointments:read',
        'care:appointments:write',
        'care:medications:read',
        'care:treatments:read',
      ],
    }),
    administrator: createRoleFixture({
      id: roleIds.administrator,
      name: 'Administrator',
      description: 'System administrator with full access',
      isDefault: false,
      journey: null,
      permissions: [
        // All permissions from all journeys
        // Health journey
        'health:metrics:read',
        'health:metrics:write',
        'health:history:read',
        'health:history:write',
        'health:goals:read',
        'health:goals:write',
        'health:devices:read',
        'health:devices:write',
        
        // Care journey
        'care:appointments:read',
        'care:appointments:write',
        'care:telemedicine:read',
        'care:telemedicine:write',
        'care:medications:read',
        'care:medications:write',
        'care:treatments:read',
        'care:treatments:write',
        
        // Plan journey
        'plan:coverage:read',
        'plan:claims:read',
        'plan:claims:write',
        'plan:benefits:read',
        'plan:documents:read',
        'plan:documents:write',
        'plan:payments:read',
        'plan:simulator:use',
        
        // Gamification
        'game:achievements:read',
        'game:progress:read',
        'game:rewards:read',
        'game:rewards:redeem',
        'game:leaderboard:read',
      ],
    }),
  },
};

/**
 * Flattened role fixtures with resolved permissions
 */
export const roleFixtures = {
  // Global roles
  user: resolveRolePermissions(journeyRoleFixtures.global.user),
  caregiver: resolveRolePermissions(journeyRoleFixtures.global.caregiver),
  administrator: resolveRolePermissions(journeyRoleFixtures.global.administrator),
  
  // Journey-specific roles
  provider: resolveRolePermissions(journeyRoleFixtures.care.provider),
  healthAdmin: resolveRolePermissions(journeyRoleFixtures.health.healthAdmin),
  careAdmin: resolveRolePermissions(journeyRoleFixtures.care.careAdmin),
  planAdmin: resolveRolePermissions(journeyRoleFixtures.plan.planAdmin),
  
  // Helper function to get all roles
  all: {} as Record<string, ResolvedRoleFixture>,
};

// Populate the 'all' property with all roles
Object.entries(journeyRoleFixtures).forEach(([_, journeyRoles]) => {
  Object.entries(journeyRoles).forEach(([key, role]) => {
    roleFixtures.all[key] = resolveRolePermissions(role);
  });
});

/**
 * Helper function to get roles by journey
 * 
 * @param journey - Journey name (health, care, plan) or null for global roles
 * @returns Array of roles for the specified journey
 */
export function getRolesByJourney(journey: string | null): ResolvedRoleFixture[] {
  if (journey === null) {
    return Object.values(journeyRoleFixtures.global).map(resolveRolePermissions);
  }
  
  const journeyRoles = journeyRoleFixtures[journey as keyof JourneyRoleFixtures];
  if (!journeyRoles) {
    throw new Error(`Invalid journey: ${journey}`);
  }
  
  return Object.values(journeyRoles).map(resolveRolePermissions);
}

/**
 * Helper function to get a role by name
 * 
 * @param name - Role name
 * @returns Role fixture with resolved permissions
 */
export function getRoleByName(name: string): ResolvedRoleFixture {
  const role = Object.values(roleFixtures.all).find(r => r.name === name);
  if (!role) {
    throw new Error(`Role not found: ${name}`);
  }
  
  return role;
}

/**
 * Helper function to get a role by ID
 * 
 * @param id - Role ID
 * @returns Role fixture with resolved permissions
 */
export function getRoleById(id: RoleId): ResolvedRoleFixture {
  const role = Object.values(roleFixtures.all).find(r => r.id === id);
  if (!role) {
    throw new Error(`Role not found with ID: ${id}`);
  }
  
  return role;
}

/**
 * Helper function to create a custom role with specific permissions
 * 
 * @param name - Role name
 * @param permissionNames - Array of permission names
 * @param overrides - Additional role properties to override
 * @returns Custom role fixture with resolved permissions
 */
export function createCustomRole(
  name: string,
  permissionNames: string[],
  overrides: Partial<RoleFixture> = {}
): ResolvedRoleFixture {
  const roleFixture = createRoleFixture({
    name,
    permissions: permissionNames,
    ...overrides,
  });
  
  return resolveRolePermissions(roleFixture);
}

/**
 * Helper function to create a role with all permissions from a specific journey
 * 
 * @param name - Role name
 * @param journey - Journey name (health, care, plan, gamification)
 * @param overrides - Additional role properties to override
 * @returns Role fixture with all permissions from the specified journey
 */
export function createJourneyRole(
  name: string,
  journey: 'health' | 'care' | 'plan' | 'gamification',
  overrides: Partial<RoleFixture> = {}
): ResolvedRoleFixture {
  // Get all permission names for the journey
  let permissionNames: string[] = [];
  
  switch (journey) {
    case 'health':
      permissionNames = Object.values(healthPermissions).map(p => p.name);
      break;
    case 'care':
      permissionNames = Object.values(carePermissions).map(p => p.name);
      break;
    case 'plan':
      permissionNames = Object.values(planPermissions).map(p => p.name);
      break;
    case 'gamification':
      permissionNames = Object.values(gamificationPermissions).map(p => p.name);
      break;
  }
  
  return createCustomRole(name, permissionNames, {
    journey: journey === 'gamification' ? null : journey,
    ...overrides,
  });
}
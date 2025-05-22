/**
 * Test fixtures for role entities used in authorization tests across the application.
 * Contains predefined role objects with permissions assignments that mirror production configurations.
 */

import { Role, Permission } from '@austa/interfaces/auth';
import { JourneyType } from '@austa/interfaces/common';

/**
 * Interface for role fixture with associated permissions
 */
export interface RoleFixture extends Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'permissions'> {
  id?: string;
  permissions: string[];
}

/**
 * Interface for creating a role with specific options
 */
export interface CreateRoleOptions {
  id?: string;
  isDefault?: boolean;
  journey?: JourneyType | null;
  includePermissions?: string[];
  excludePermissions?: string[];
}

/**
 * Permission fixtures organized by journey
 */
export const permissionFixtures = {
  health: [
    { name: 'health:metrics:read', description: 'View health metrics' },
    { name: 'health:metrics:write', description: 'Record health metrics' },
    { name: 'health:history:read', description: 'View medical history' },
    { name: 'health:history:write', description: 'Update medical history' },
    { name: 'health:goals:read', description: 'View health goals' },
    { name: 'health:goals:write', description: 'Set health goals' },
    { name: 'health:devices:read', description: 'View connected devices' },
    { name: 'health:devices:write', description: 'Manage device connections' },
  ],
  care: [
    { name: 'care:appointments:read', description: 'View appointments' },
    { name: 'care:appointments:write', description: 'Manage appointments' },
    { name: 'care:telemedicine:read', description: 'View telemedicine sessions' },
    { name: 'care:telemedicine:write', description: 'Manage telemedicine sessions' },
    { name: 'care:medications:read', description: 'View medications' },
    { name: 'care:medications:write', description: 'Manage medications' },
    { name: 'care:treatments:read', description: 'View treatment plans' },
    { name: 'care:treatments:write', description: 'Manage treatment plans' },
  ],
  plan: [
    { name: 'plan:coverage:read', description: 'View coverage information' },
    { name: 'plan:claims:read', description: 'View claims' },
    { name: 'plan:claims:write', description: 'Submit and manage claims' },
    { name: 'plan:benefits:read', description: 'View benefits' },
    { name: 'plan:documents:read', description: 'View insurance documents' },
    { name: 'plan:documents:write', description: 'Upload insurance documents' },
    { name: 'plan:payments:read', description: 'View payment information' },
    { name: 'plan:simulator:use', description: 'Use cost simulator' },
  ],
  gamification: [
    { name: 'game:achievements:read', description: 'View achievements' },
    { name: 'game:progress:read', description: 'View progress' },
    { name: 'game:rewards:read', description: 'View rewards' },
    { name: 'game:rewards:redeem', description: 'Redeem rewards' },
    { name: 'game:leaderboard:read', description: 'View leaderboards' },
  ],
};

/**
 * Get all permission fixtures as a flat array
 */
export const getAllPermissionFixtures = (): Permission[] => {
  return Object.values(permissionFixtures).flat();
};

/**
 * Get permission fixture by name
 */
export const getPermissionFixtureByName = (name: string): Permission | undefined => {
  return getAllPermissionFixtures().find(permission => permission.name === name);
};

/**
 * Get permission fixtures by names
 */
export const getPermissionFixturesByNames = (names: string[]): Permission[] => {
  return names.map(name => {
    const permission = getPermissionFixtureByName(name);
    if (!permission) {
      throw new Error(`Permission fixture not found: ${name}`);
    }
    return permission;
  });
};

/**
 * Base role fixtures with their default permissions
 */
export const roleFixtures: Record<string, RoleFixture> = {
  user: {
    id: 'role-user-fixture',
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
  },
  caregiver: {
    id: 'role-caregiver-fixture',
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
  },
  provider: {
    id: 'role-provider-fixture',
    name: 'Provider',
    description: 'Healthcare provider with access to patient data',
    isDefault: false,
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
  },
  administrator: {
    id: 'role-admin-fixture',
    name: 'Administrator',
    description: 'System administrator with full access',
    isDefault: false,
    journey: null,
    permissions: getAllPermissionFixtures().map(p => p.name),
  },
};

/**
 * Journey-specific role fixtures
 */
export const journeyRoleFixtures: Record<JourneyType, RoleFixture[]> = {
  health: [
    {
      id: 'role-health-coach-fixture',
      name: 'Health Coach',
      description: 'Specialized in health metrics and goals',
      isDefault: false,
      journey: 'health',
      permissions: [
        'health:metrics:read',
        'health:history:read',
        'health:goals:read',
        'health:goals:write',
        'game:progress:read',
      ],
    },
  ],
  care: [
    {
      id: 'role-nurse-fixture',
      name: 'Nurse',
      description: 'Nursing staff with limited clinical access',
      isDefault: false,
      journey: 'care',
      permissions: [
        'health:metrics:read',
        'health:history:read',
        'care:appointments:read',
        'care:medications:read',
        'care:treatments:read',
      ],
    },
  ],
  plan: [
    {
      id: 'role-insurance-agent-fixture',
      name: 'Insurance Agent',
      description: 'Insurance company representative',
      isDefault: false,
      journey: 'plan',
      permissions: [
        'plan:coverage:read',
        'plan:claims:read',
        'plan:benefits:read',
        'plan:documents:read',
      ],
    },
  ],
};

/**
 * Create a role fixture with custom options
 * 
 * @param baseRole - The base role fixture to customize
 * @param options - Custom options for the role
 * @returns A customized role fixture
 */
export const createRoleFixture = (
  baseRole: keyof typeof roleFixtures,
  options: CreateRoleOptions = {}
): Role => {
  const baseFix = { ...roleFixtures[baseRole] };
  let permissionNames = [...baseFix.permissions];
  
  // Add additional permissions if specified
  if (options.includePermissions?.length) {
    permissionNames = [...new Set([...permissionNames, ...options.includePermissions])];
  }
  
  // Remove excluded permissions if specified
  if (options.excludePermissions?.length) {
    permissionNames = permissionNames.filter(p => !options.excludePermissions?.includes(p));
  }
  
  // Create the role with permissions
  const role: Role = {
    id: options.id || baseFix.id || `role-${baseFix.name.toLowerCase()}-${Date.now()}`,
    name: baseFix.name,
    description: baseFix.description,
    isDefault: options.isDefault !== undefined ? options.isDefault : baseFix.isDefault,
    journey: options.journey !== undefined ? options.journey : baseFix.journey,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: getPermissionFixturesByNames(permissionNames),
  };
  
  return role;
};

/**
 * Create a journey-specific role fixture
 * 
 * @param journey - The journey type
 * @param roleIndex - The index of the role in the journey roles array
 * @param options - Custom options for the role
 * @returns A customized journey-specific role fixture
 */
export const createJourneyRoleFixture = (
  journey: JourneyType,
  roleIndex: number = 0,
  options: CreateRoleOptions = {}
): Role => {
  const journeyRoles = journeyRoleFixtures[journey];
  if (!journeyRoles || !journeyRoles[roleIndex]) {
    throw new Error(`Journey role fixture not found: ${journey} at index ${roleIndex}`);
  }
  
  const baseFix = { ...journeyRoles[roleIndex] };
  let permissionNames = [...baseFix.permissions];
  
  // Add additional permissions if specified
  if (options.includePermissions?.length) {
    permissionNames = [...new Set([...permissionNames, ...options.includePermissions])];
  }
  
  // Remove excluded permissions if specified
  if (options.excludePermissions?.length) {
    permissionNames = permissionNames.filter(p => !options.excludePermissions?.includes(p));
  }
  
  // Create the role with permissions
  const role: Role = {
    id: options.id || baseFix.id || `role-${journey}-${baseFix.name.toLowerCase()}-${Date.now()}`,
    name: baseFix.name,
    description: baseFix.description,
    isDefault: options.isDefault !== undefined ? options.isDefault : baseFix.isDefault,
    journey: options.journey !== undefined ? options.journey : baseFix.journey,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: getPermissionFixturesByNames(permissionNames),
  };
  
  return role;
};

/**
 * Create all standard role fixtures
 * 
 * @returns An array of all standard role fixtures
 */
export const createAllRoleFixtures = (): Role[] => {
  return Object.keys(roleFixtures).map(key => createRoleFixture(key as keyof typeof roleFixtures));
};

/**
 * Create all journey-specific role fixtures
 * 
 * @returns An array of all journey-specific role fixtures
 */
export const createAllJourneyRoleFixtures = (): Role[] => {
  const roles: Role[] = [];
  
  Object.keys(journeyRoleFixtures).forEach(journey => {
    const journeyType = journey as JourneyType;
    const journeyRoles = journeyRoleFixtures[journeyType];
    
    journeyRoles.forEach((_, index) => {
      roles.push(createJourneyRoleFixture(journeyType, index));
    });
  });
  
  return roles;
};
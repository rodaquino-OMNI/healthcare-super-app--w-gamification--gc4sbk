/**
 * Main export file for all common test fixtures in the database package.
 * 
 * This module provides a centralized, organized way to import user, role, and permission fixtures for testing.
 * It simplifies test setup by exposing consistently structured test data that can be used across all journey services.
 */

// Re-export all permission fixtures
export * from './permissions.fixtures';

// Re-export all role fixtures
export * from './roles.fixtures';

// Re-export all user fixtures
export * from './users.fixtures';

// Import specific fixtures for named exports
import {
  Permission,
  createPermission,
  healthPermissions,
  carePermissions,
  planPermissions,
  gamificationPermissions,
  allPermissions,
  getAllPermissionsArray,
  getJourneyPermissions,
  getPermissionsByName,
  permissionSets,
} from './permissions.fixtures';

import {
  RoleFixture,
  CreateRoleOptions,
  permissionFixtures,
  getAllPermissionFixtures,
  getPermissionFixtureByName,
  getPermissionFixturesByNames,
  roleFixtures,
  journeyRoleFixtures,
  createRoleFixture,
  createJourneyRoleFixture,
  createAllRoleFixtures,
  createAllJourneyRoleFixtures,
} from './roles.fixtures';

import {
  UserFixture,
  CreateUserOptions,
  userFixtures,
  journeyUserFixtures,
  createUserFixture,
  createJourneyUserFixture,
  createAdminUser,
  createRegularUser,
  createCaregiverUser,
  createProviderUser,
  createMultipleUsers,
  createAllUserFixtures,
  createAllJourneyUserFixtures,
  createUserWithRole,
  createUserWithRoles,
  createUserForJourney,
} from './users.fixtures';

/**
 * Grouped exports by entity type for easier imports in tests
 */
export const fixtures = {
  /**
   * Permission fixtures and utilities
   */
  permissions: {
    // Types
    Permission,
    
    // Factory functions
    create: createPermission,
    getAll: getAllPermissionsArray,
    getByJourney: getJourneyPermissions,
    getByName: getPermissionsByName,
    
    // Predefined fixtures
    health: healthPermissions,
    care: carePermissions,
    plan: planPermissions,
    gamification: gamificationPermissions,
    all: allPermissions,
    sets: permissionSets,
  },
  
  /**
   * Role fixtures and utilities
   */
  roles: {
    // Types
    RoleFixture,
    CreateRoleOptions,
    
    // Factory functions
    create: createRoleFixture,
    createForJourney: createJourneyRoleFixture,
    getAll: createAllRoleFixtures,
    getAllJourney: createAllJourneyRoleFixtures,
    
    // Permission utilities
    permissions: {
      getAll: getAllPermissionFixtures,
      getByName: getPermissionFixtureByName,
      getByNames: getPermissionFixturesByNames,
      fixtures: permissionFixtures,
    },
    
    // Predefined fixtures
    standard: roleFixtures,
    journey: journeyRoleFixtures,
  },
  
  /**
   * User fixtures and utilities
   */
  users: {
    // Types
    UserFixture,
    CreateUserOptions,
    
    // Factory functions
    create: createUserFixture,
    createForJourney: createJourneyUserFixture,
    createAdmin: createAdminUser,
    createRegular: createRegularUser,
    createCaregiver: createCaregiverUser,
    createProvider: createProviderUser,
    createMultiple: createMultipleUsers,
    createWithRole: createUserWithRole,
    createWithRoles: createUserWithRoles,
    createForJourney: createUserForJourney,
    getAll: createAllUserFixtures,
    getAllJourney: createAllJourneyUserFixtures,
    
    // Predefined fixtures
    standard: userFixtures,
    journey: journeyUserFixtures,
  },
};

/**
 * Namespace exports for jest/vitest mocking support
 * 
 * Example usage in tests:
 * ```
 * // Mock specific fixture function
 * jest.mock('@austa/database/test/fixtures/common', () => ({
 *   ...jest.requireActual('@austa/database/test/fixtures/common'),
 *   Permissions: {
 *     ...jest.requireActual('@austa/database/test/fixtures/common').Permissions,
 *     getAll: jest.fn().mockReturnValue([/* mocked permissions */]),
 *   }
 * }));
 * ```
 */
export const Permissions = fixtures.permissions;
export const Roles = fixtures.roles;
export const Users = fixtures.users;

/**
 * Default export for easier importing in tests
 */
export default fixtures;
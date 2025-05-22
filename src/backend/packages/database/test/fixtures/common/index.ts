/**
 * Main export file for all common test fixtures in the database package.
 * 
 * This module provides a centralized, organized way to import user, role, and permission fixtures for testing.
 * Simplifies test setup by exposing consistently structured test data that can be used across all journey services.
 */

// Import all common fixtures
import * as userFixtures from './users.fixtures';
import * as roleFixtures from './roles.fixtures';
import * as permissionFixtures from './permissions.fixtures';

/**
 * User fixtures for authentication and authorization testing
 */
export const users = userFixtures;

/**
 * Role fixtures for role-based access control testing
 */
export const roles = roleFixtures;

/**
 * Permission fixtures for permission-based authorization testing
 */
export const permissions = permissionFixtures;

/**
 * All common fixtures combined in a single object
 */
export const allCommonFixtures = {
  users,
  roles,
  permissions,
};

/**
 * Default export providing all common fixtures
 */
export default allCommonFixtures;
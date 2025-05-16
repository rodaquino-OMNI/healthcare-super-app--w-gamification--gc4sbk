/**
 * @file Authentication Test Fixtures Barrel File
 * 
 * This barrel file exports all authentication test fixtures, providing a centralized
 * import point for test suites. It enables test files to import specific fixtures
 * or groups of fixtures with a single import statement, improving code organization
 * and maintainability across the test suite.
 *
 * @example
 * // Import all fixtures
 * import * as authFixtures from '@austa/auth/test/fixtures';
 *
 * // Import specific fixture categories
 * import { userFixtures, tokenFixtures } from '@austa/auth/test/fixtures';
 *
 * // Import specific fixtures
 * import { adminUser, regularUser } from '@austa/auth/test/fixtures';
 */

// Export all fixtures from individual files
export * from './users';
export * from './roles';
export * from './credentials';
export * from './tokens';
export * from './oauth-profiles';

// Re-export with categorized namespaces for better organization
import * as users from './users';
import * as roles from './roles';
import * as credentials from './credentials';
import * as tokens from './tokens';
import * as oauthProfiles from './oauth-profiles';

/**
 * User-related test fixtures including admin users, regular users,
 * and users with specific role combinations.
 */
export const userFixtures = users;

/**
 * Role-based access control test fixtures including role definitions,
 * permission sets, and role hierarchies.
 */
export const roleFixtures = roles;

/**
 * Authentication credential test fixtures for testing login flows
 * and validation.
 */
export const credentialFixtures = credentials;

/**
 * JWT token test fixtures with various states (valid, expired, malformed)
 * for testing token validation and guard behavior.
 */
export const tokenFixtures = tokens;

/**
 * OAuth profile test fixtures from different providers (Google, Facebook, Apple)
 * for testing OAuth authentication strategies.
 */
export const oauthFixtures = oauthProfiles;

// Grouped fixtures by testing scenario

/**
 * Authentication test fixtures for local strategy testing.
 */
export const localAuthFixtures = {
  users: userFixtures,
  credentials: credentialFixtures,
};

/**
 * Authentication test fixtures for JWT strategy testing.
 */
export const jwtAuthFixtures = {
  users: userFixtures,
  tokens: tokenFixtures,
};

/**
 * Authentication test fixtures for OAuth strategy testing.
 */
export const oauthAuthFixtures = {
  users: userFixtures,
  oauthProfiles: oauthFixtures,
};

/**
 * Authorization test fixtures for role-based access control testing.
 */
export const authorizationFixtures = {
  users: userFixtures,
  roles: roleFixtures,
};

/**
 * Journey-specific test fixtures for cross-journey authentication testing.
 */
export const journeyAuthFixtures = {
  health: {
    users: userFixtures,
    roles: roleFixtures,
  },
  care: {
    users: userFixtures,
    roles: roleFixtures,
  },
  plan: {
    users: userFixtures,
    roles: roleFixtures,
  },
};

// Type exports for improved developer experience

/**
 * All available authentication test fixtures.
 */
export type AuthFixtures = {
  users: typeof userFixtures;
  roles: typeof roleFixtures;
  credentials: typeof credentialFixtures;
  tokens: typeof tokenFixtures;
  oauthProfiles: typeof oauthFixtures;
  localAuth: typeof localAuthFixtures;
  jwtAuth: typeof jwtAuthFixtures;
  oauthAuth: typeof oauthAuthFixtures;
  authorization: typeof authorizationFixtures;
  journeyAuth: typeof journeyAuthFixtures;
};

/**
 * Complete set of all authentication test fixtures.
 */
export const allFixtures: AuthFixtures = {
  users: userFixtures,
  roles: roleFixtures,
  credentials: credentialFixtures,
  tokens: tokenFixtures,
  oauthProfiles: oauthFixtures,
  localAuth: localAuthFixtures,
  jwtAuth: jwtAuthFixtures,
  oauthAuth: oauthAuthFixtures,
  authorization: authorizationFixtures,
  journeyAuth: journeyAuthFixtures,
};

export default allFixtures;
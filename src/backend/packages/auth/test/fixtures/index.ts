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
 * import * as AuthFixtures from '@austa/auth/test/fixtures';
 *
 * // Import specific fixture categories
 * import { UserFixtures, TokenFixtures } from '@austa/auth/test/fixtures';
 *
 * // Import specific fixtures directly
 * import { adminUser, regularUser } from '@austa/auth/test/fixtures';
 */

// Export all fixtures from individual files
export * from './users';
export * from './roles';
export * from './credentials';
export * from './tokens';
export * from './oauth-profiles';

// Re-export as categorized namespaces for better organization
import * as UserFixtures from './users';
import * as RoleFixtures from './roles';
import * as CredentialFixtures from './credentials';
import * as TokenFixtures from './tokens';
import * as OAuthFixtures from './oauth-profiles';

/**
 * Categorized exports for different testing scenarios
 */
export {
  UserFixtures,
  RoleFixtures,
  CredentialFixtures,
  TokenFixtures,
  OAuthFixtures,
};

/**
 * Combined fixtures for journey-specific testing
 */
export const JourneyFixtures = {
  health: {
    users: UserFixtures.healthJourneyUsers,
    roles: RoleFixtures.healthJourneyRoles,
    permissions: RoleFixtures.healthJourneyPermissions,
  },
  care: {
    users: UserFixtures.careJourneyUsers,
    roles: RoleFixtures.careJourneyRoles,
    permissions: RoleFixtures.careJourneyPermissions,
  },
  plan: {
    users: UserFixtures.planJourneyUsers,
    roles: RoleFixtures.planJourneyRoles,
    permissions: RoleFixtures.planJourneyPermissions,
  },
};

/**
 * Authentication scenario fixtures for common testing patterns
 */
export const AuthScenarios = {
  validAuthentication: {
    user: UserFixtures.regularUser,
    credentials: CredentialFixtures.validCredentials,
    token: TokenFixtures.validAccessToken,
  },
  adminAuthentication: {
    user: UserFixtures.adminUser,
    credentials: CredentialFixtures.adminCredentials,
    token: TokenFixtures.adminAccessToken,
  },
  expiredAuthentication: {
    user: UserFixtures.regularUser,
    credentials: CredentialFixtures.validCredentials,
    token: TokenFixtures.expiredAccessToken,
  },
  invalidAuthentication: {
    credentials: CredentialFixtures.invalidCredentials,
  },
  oauthAuthentication: {
    googleProfile: OAuthFixtures.googleProfile,
    facebookProfile: OAuthFixtures.facebookProfile,
    appleProfile: OAuthFixtures.appleProfile,
  },
};

/**
 * Helper function to create custom test users with specific roles and permissions
 * @param roles Array of roles to assign to the user
 * @param permissions Array of additional permissions to assign to the user
 * @returns A test user object with the specified roles and permissions
 */
export function createTestUser(roles: string[] = [], permissions: string[] = []) {
  return {
    ...UserFixtures.baseUserTemplate,
    roles,
    permissions,
  };
}

/**
 * Helper function to create custom test tokens with specific claims and expiration
 * @param payload Custom JWT payload to include in the token
 * @param expiresIn Token expiration time in seconds (default: 3600)
 * @returns A test token with the specified payload and expiration
 */
export function createTestToken(payload: Record<string, any> = {}, expiresIn: number = 3600) {
  return TokenFixtures.generateToken(payload, expiresIn);
}
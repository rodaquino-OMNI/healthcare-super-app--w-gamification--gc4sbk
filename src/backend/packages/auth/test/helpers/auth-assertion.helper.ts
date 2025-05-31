/**
 * Authentication Assertion Helper
 * 
 * Provides utilities for verifying authentication and authorization states in tests.
 * This helper centralizes auth-specific test assertions like verifying a user is authenticated,
 * has specific permissions, belongs to certain roles, or is authorized for particular actions.
 */

import { ErrorType, AppException } from '@backend/shared/src/exceptions/exceptions.types';
import { JOURNEY_IDS } from '@backend/shared/src/constants/journey.constants';
import { IUser, IRole, IPermission, ITokenPayload } from '../../src/interfaces';
import { TEST_PERMISSIONS, TEST_ROLES } from './test-constants.helper';

/**
 * Interface for objects that contain authentication data
 */
export interface IAuthTestResponse {
  user?: IUser | Partial<IUser> | null;
  token?: string | null;
  payload?: ITokenPayload | null;
  roles?: IRole[] | string[] | null;
  permissions?: IPermission[] | string[] | null;
  [key: string]: any;
}

/**
 * Authentication assertion error
 */
export class AuthAssertionError extends AppException {
  constructor(message: string, details?: any) {
    super(
      message,
      ErrorType.VALIDATION,
      'AUTH_ASSERTION_ERROR',
      details,
      undefined
    );
  }
}

/**
 * Helper class for making assertions about authentication and authorization
 */
export class AuthAssertions {
  private response: IAuthTestResponse;
  
  /**
   * Creates a new AuthAssertions instance
   * 
   * @param response The response object to make assertions against
   */
  constructor(response: IAuthTestResponse) {
    this.response = response;
  }

  /**
   * Creates a new AuthAssertions instance
   * 
   * @param response The response object to make assertions against
   * @returns A new AuthAssertions instance
   */
  static for(response: IAuthTestResponse): AuthAssertions {
    return new AuthAssertions(response);
  }

  /**
   * Asserts that the response indicates the user is authenticated
   * 
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user is not authenticated
   */
  isAuthenticated(): AuthAssertions {
    if (!this.response.user) {
      throw new AuthAssertionError(
        'Expected response to contain an authenticated user, but no user was found',
        { response: this.response }
      );
    }

    if (this.response.token === null || this.response.token === undefined) {
      throw new AuthAssertionError(
        'Expected response to contain an authentication token, but no token was found',
        { response: this.response }
      );
    }

    return this;
  }

  /**
   * Asserts that the response indicates the user is not authenticated
   * 
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user is authenticated
   */
  isNotAuthenticated(): AuthAssertions {
    if (this.response.user) {
      throw new AuthAssertionError(
        'Expected response to indicate user is not authenticated, but a user was found',
        { user: this.response.user }
      );
    }

    if (this.response.token) {
      throw new AuthAssertionError(
        'Expected response to indicate user is not authenticated, but a token was found',
        { token: this.response.token }
      );
    }

    return this;
  }

  /**
   * Asserts that the response contains a user with the specified ID
   * 
   * @param userId The expected user ID
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user ID doesn't match
   */
  hasUserId(userId: string): AuthAssertions {
    if (!this.response.user) {
      throw new AuthAssertionError(
        'Expected response to contain a user, but no user was found',
        { response: this.response }
      );
    }

    if (this.response.user.id !== userId) {
      throw new AuthAssertionError(
        `Expected user ID to be "${userId}", but got "${this.response.user.id}"`,
        { user: this.response.user }
      );
    }

    return this;
  }

  /**
   * Asserts that the response contains a user with the specified email
   * 
   * @param email The expected user email
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user email doesn't match
   */
  hasEmail(email: string): AuthAssertions {
    if (!this.response.user) {
      throw new AuthAssertionError(
        'Expected response to contain a user, but no user was found',
        { response: this.response }
      );
    }

    if (this.response.user.email !== email) {
      throw new AuthAssertionError(
        `Expected user email to be "${email}", but got "${this.response.user.email}"`,
        { user: this.response.user }
      );
    }

    return this;
  }

  /**
   * Asserts that the response contains a token payload with the specified subject (user ID)
   * 
   * @param subject The expected subject (user ID)
   * @returns This instance for chaining
   * @throws AuthAssertionError if the token payload doesn't contain the expected subject
   */
  hasTokenSubject(subject: string): AuthAssertions {
    if (!this.response.payload) {
      throw new AuthAssertionError(
        'Expected response to contain a token payload, but no payload was found',
        { response: this.response }
      );
    }

    if (this.response.payload.sub !== subject) {
      throw new AuthAssertionError(
        `Expected token subject to be "${subject}", but got "${this.response.payload.sub}"`,
        { payload: this.response.payload }
      );
    }

    return this;
  }

  /**
   * Asserts that the response contains a valid token that has not expired
   * 
   * @returns This instance for chaining
   * @throws AuthAssertionError if the token is expired or invalid
   */
  hasValidToken(): AuthAssertions {
    if (!this.response.payload) {
      throw new AuthAssertionError(
        'Expected response to contain a token payload, but no payload was found',
        { response: this.response }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (this.response.payload.exp <= now) {
      throw new AuthAssertionError(
        'Expected token to be valid, but it has expired',
        { 
          payload: this.response.payload,
          currentTime: now,
          expirationTime: this.response.payload.exp,
          expiredAgo: `${now - this.response.payload.exp} seconds ago`
        }
      );
    }

    return this;
  }

  /**
   * Asserts that the response contains a token that has expired
   * 
   * @returns This instance for chaining
   * @throws AuthAssertionError if the token is not expired
   */
  hasExpiredToken(): AuthAssertions {
    if (!this.response.payload) {
      throw new AuthAssertionError(
        'Expected response to contain a token payload, but no payload was found',
        { response: this.response }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (this.response.payload.exp > now) {
      throw new AuthAssertionError(
        'Expected token to be expired, but it is still valid',
        { 
          payload: this.response.payload,
          currentTime: now,
          expirationTime: this.response.payload.exp,
          expiresIn: `${this.response.payload.exp - now} seconds`
        }
      );
    }

    return this;
  }

  /**
   * Asserts that the user has the specified permission
   * 
   * @param permissionId The permission ID to check for
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user doesn't have the permission
   */
  hasPermission(permissionId: string): AuthAssertions {
    // Check in payload permissions array
    if (this.response.payload?.permissions) {
      if (!this.response.payload.permissions.includes(permissionId)) {
        throw new AuthAssertionError(
          `Expected user to have permission "${permissionId}", but it was not found in token payload`,
          { permissions: this.response.payload.permissions }
        );
      }
      return this;
    }

    // Check in response permissions array if it's an array of strings
    if (Array.isArray(this.response.permissions)) {
      if (typeof this.response.permissions[0] === 'string') {
        if (!this.response.permissions.includes(permissionId)) {
          throw new AuthAssertionError(
            `Expected user to have permission "${permissionId}", but it was not found in permissions array`,
            { permissions: this.response.permissions }
          );
        }
        return this;
      }

      // Check in response permissions array if it's an array of IPermission objects
      const permissionIds = (this.response.permissions as IPermission[]).map(p => p.id);
      if (!permissionIds.includes(permissionId)) {
        throw new AuthAssertionError(
          `Expected user to have permission "${permissionId}", but it was not found in permissions array`,
          { permissions: this.response.permissions }
        );
      }
      return this;
    }

    // Check in user roles if available
    if (this.response.user?.roles) {
      const allPermissions = (this.response.user.roles as IRole[]).flatMap(role => 
        role.permissions?.map(p => p.id) || []
      );
      
      if (!allPermissions.includes(permissionId)) {
        throw new AuthAssertionError(
          `Expected user to have permission "${permissionId}", but it was not found in user roles`,
          { roles: this.response.user.roles }
        );
      }
      return this;
    }

    throw new AuthAssertionError(
      `Cannot verify permission "${permissionId}" because no permission data was found in the response`,
      { response: this.response }
    );
  }

  /**
   * Asserts that the user does not have the specified permission
   * 
   * @param permissionId The permission ID to check for
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user has the permission
   */
  doesNotHavePermission(permissionId: string): AuthAssertions {
    try {
      this.hasPermission(permissionId);
      // If we get here, the user has the permission, which is not what we want
      throw new AuthAssertionError(
        `Expected user not to have permission "${permissionId}", but the permission was found`,
        { response: this.response }
      );
    } catch (error) {
      // If the error is not an AuthAssertionError, or it's a different assertion error, rethrow it
      if (!(error instanceof AuthAssertionError) || 
          !error.message.includes(`Expected user to have permission "${permissionId}"`)) {
        throw error;
      }
      // Otherwise, the assertion that the user has the permission failed, which is what we want
      return this;
    }
  }

  /**
   * Asserts that the user has all of the specified permissions
   * 
   * @param permissionIds Array of permission IDs to check for
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user doesn't have all the permissions
   */
  hasPermissions(permissionIds: string[]): AuthAssertions {
    for (const permissionId of permissionIds) {
      this.hasPermission(permissionId);
    }
    return this;
  }

  /**
   * Asserts that the user has the specified role
   * 
   * @param roleId The role ID to check for
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user doesn't have the role
   */
  hasRole(roleId: string): AuthAssertions {
    // Check in payload roles array
    if (this.response.payload?.roles) {
      if (!this.response.payload.roles.includes(roleId)) {
        throw new AuthAssertionError(
          `Expected user to have role "${roleId}", but it was not found in token payload`,
          { roles: this.response.payload.roles }
        );
      }
      return this;
    }

    // Check in response roles array if it's an array of strings
    if (Array.isArray(this.response.roles)) {
      if (typeof this.response.roles[0] === 'string') {
        if (!this.response.roles.includes(roleId)) {
          throw new AuthAssertionError(
            `Expected user to have role "${roleId}", but it was not found in roles array`,
            { roles: this.response.roles }
          );
        }
        return this;
      }

      // Check in response roles array if it's an array of IRole objects
      const roleIds = (this.response.roles as IRole[]).map(r => r.id);
      if (!roleIds.includes(roleId)) {
        throw new AuthAssertionError(
          `Expected user to have role "${roleId}", but it was not found in roles array`,
          { roles: this.response.roles }
        );
      }
      return this;
    }

    // Check in user roles if available
    if (this.response.user?.roles) {
      const roleIds = (this.response.user.roles as IRole[]).map(r => r.id);
      if (!roleIds.includes(roleId)) {
        throw new AuthAssertionError(
          `Expected user to have role "${roleId}", but it was not found in user roles`,
          { roles: this.response.user.roles }
        );
      }
      return this;
    }

    throw new AuthAssertionError(
      `Cannot verify role "${roleId}" because no role data was found in the response`,
      { response: this.response }
    );
  }

  /**
   * Asserts that the user does not have the specified role
   * 
   * @param roleId The role ID to check for
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user has the role
   */
  doesNotHaveRole(roleId: string): AuthAssertions {
    try {
      this.hasRole(roleId);
      // If we get here, the user has the role, which is not what we want
      throw new AuthAssertionError(
        `Expected user not to have role "${roleId}", but the role was found`,
        { response: this.response }
      );
    } catch (error) {
      // If the error is not an AuthAssertionError, or it's a different assertion error, rethrow it
      if (!(error instanceof AuthAssertionError) || 
          !error.message.includes(`Expected user to have role "${roleId}"`)) {
        throw error;
      }
      // Otherwise, the assertion that the user has the role failed, which is what we want
      return this;
    }
  }

  /**
   * Asserts that the user has all of the specified roles
   * 
   * @param roleIds Array of role IDs to check for
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user doesn't have all the roles
   */
  hasRoles(roleIds: string[]): AuthAssertions {
    for (const roleId of roleIds) {
      this.hasRole(roleId);
    }
    return this;
  }

  /**
   * Asserts that the user has access to the specified journey
   * 
   * @param journeyId The journey ID to check for
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user doesn't have access to the journey
   */
  hasJourneyAccess(journeyId: string): AuthAssertions {
    // Check in payload journey field
    if (this.response.payload?.journey === journeyId) {
      return this;
    }

    // Check for journey-specific roles
    const journeyRoles: Record<string, string[]> = {
      [JOURNEY_IDS.HEALTH]: ['health-user', 'health-admin'],
      [JOURNEY_IDS.CARE]: ['care-user', 'care-admin'],
      [JOURNEY_IDS.PLAN]: ['plan-user', 'plan-admin'],
    };

    // Check if user has any of the journey-specific roles
    const requiredRoles = journeyRoles[journeyId] || [];
    if (requiredRoles.length > 0) {
      try {
        for (const roleId of requiredRoles) {
          try {
            this.hasRole(roleId);
            // If we find one matching role, the user has access to the journey
            return this;
          } catch (error) {
            // Continue checking other roles
          }
        }
        // If we get here, none of the journey roles were found
        throw new AuthAssertionError(
          `Expected user to have access to journey "${journeyId}", but no journey-specific roles were found`,
          { 
            response: this.response,
            requiredRoles: requiredRoles 
          }
        );
      } catch (error) {
        // If the error is an AuthAssertionError about not finding role data, we need to try permissions
        if (error instanceof AuthAssertionError && 
            error.message.includes('because no role data was found')) {
          // Fall through to permission check
        } else {
          throw error;
        }
      }
    }

    // Check for journey-specific permissions
    const journeyPermissions: Record<string, string[]> = {
      [JOURNEY_IDS.HEALTH]: TEST_PERMISSIONS.HEALTH.map(p => p.id),
      [JOURNEY_IDS.CARE]: TEST_PERMISSIONS.CARE.map(p => p.id),
      [JOURNEY_IDS.PLAN]: TEST_PERMISSIONS.PLAN.map(p => p.id),
    };

    // Check if user has any of the journey-specific permissions
    const requiredPermissions = journeyPermissions[journeyId] || [];
    if (requiredPermissions.length > 0) {
      try {
        for (const permissionId of requiredPermissions) {
          try {
            this.hasPermission(permissionId);
            // If we find one matching permission, the user has access to the journey
            return this;
          } catch (error) {
            // Continue checking other permissions
          }
        }
        // If we get here, none of the journey permissions were found
        throw new AuthAssertionError(
          `Expected user to have access to journey "${journeyId}", but no journey-specific permissions were found`,
          { 
            response: this.response,
            requiredPermissions: requiredPermissions 
          }
        );
      } catch (error) {
        // If the error is an AuthAssertionError about not finding permission data, we need to try super admin
        if (error instanceof AuthAssertionError && 
            error.message.includes('because no permission data was found')) {
          // Fall through to super admin check
        } else {
          throw error;
        }
      }
    }

    // Check for super admin role as a last resort
    try {
      this.hasRole('super-admin');
      // Super admins have access to all journeys
      return this;
    } catch (error) {
      // If not a super admin, and we've exhausted all other checks, the user doesn't have access
      throw new AuthAssertionError(
        `Expected user to have access to journey "${journeyId}", but no journey access was found`,
        { response: this.response }
      );
    }
  }

  /**
   * Asserts that the user is active
   * 
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user is not active
   */
  isActive(): AuthAssertions {
    if (!this.response.user) {
      throw new AuthAssertionError(
        'Expected response to contain a user, but no user was found',
        { response: this.response }
      );
    }

    if (this.response.user.isActive !== true) {
      throw new AuthAssertionError(
        'Expected user to be active, but user is inactive',
        { user: this.response.user }
      );
    }

    return this;
  }

  /**
   * Asserts that the user is verified
   * 
   * @returns This instance for chaining
   * @throws AuthAssertionError if the user is not verified
   */
  isVerified(): AuthAssertions {
    if (!this.response.user) {
      throw new AuthAssertionError(
        'Expected response to contain a user, but no user was found',
        { response: this.response }
      );
    }

    if (this.response.user.isVerified !== true) {
      throw new AuthAssertionError(
        'Expected user to be verified, but user is not verified',
        { user: this.response.user }
      );
    }

    return this;
  }

  /**
   * Asserts that the response contains a specific error code
   * 
   * @param errorCode The expected error code
   * @returns This instance for chaining
   * @throws AuthAssertionError if the response doesn't contain the error code
   */
  hasErrorCode(errorCode: string): AuthAssertions {
    if (!this.response.error) {
      throw new AuthAssertionError(
        `Expected response to contain error code "${errorCode}", but no error was found`,
        { response: this.response }
      );
    }

    if (typeof this.response.error === 'string') {
      if (this.response.error !== errorCode) {
        throw new AuthAssertionError(
          `Expected error code to be "${errorCode}", but got "${this.response.error}"`,
          { error: this.response.error }
        );
      }
    } else if (this.response.error.code !== errorCode) {
      throw new AuthAssertionError(
        `Expected error code to be "${errorCode}", but got "${this.response.error.code}"`,
        { error: this.response.error }
      );
    }

    return this;
  }

  /**
   * Asserts that the response contains a specific error type
   * 
   * @param errorType The expected error type
   * @returns This instance for chaining
   * @throws AuthAssertionError if the response doesn't contain the error type
   */
  hasErrorType(errorType: ErrorType): AuthAssertions {
    if (!this.response.error) {
      throw new AuthAssertionError(
        `Expected response to contain error type "${errorType}", but no error was found`,
        { response: this.response }
      );
    }

    if (typeof this.response.error === 'object' && this.response.error.type !== errorType) {
      throw new AuthAssertionError(
        `Expected error type to be "${errorType}", but got "${this.response.error.type}"`,
        { error: this.response.error }
      );
    }

    return this;
  }

  /**
   * Asserts that the response contains an error message that includes the specified text
   * 
   * @param text The text to look for in the error message
   * @returns This instance for chaining
   * @throws AuthAssertionError if the response doesn't contain an error message with the text
   */
  hasErrorMessageContaining(text: string): AuthAssertions {
    if (!this.response.error) {
      throw new AuthAssertionError(
        `Expected response to contain an error message with "${text}", but no error was found`,
        { response: this.response }
      );
    }

    let errorMessage: string | undefined;
    
    if (typeof this.response.error === 'object') {
      errorMessage = this.response.error.message;
    } else if (this.response.message) {
      errorMessage = this.response.message;
    }

    if (!errorMessage || !errorMessage.includes(text)) {
      throw new AuthAssertionError(
        `Expected error message to contain "${text}", but it doesn't`,
        { 
          error: this.response.error,
          message: errorMessage 
        }
      );
    }

    return this;
  }
}

/**
 * Creates an AuthAssertions instance for the given response
 * 
 * @param response The response object to make assertions against
 * @returns An AuthAssertions instance
 */
export const assertAuth = (response: IAuthTestResponse): AuthAssertions => {
  return AuthAssertions.for(response);
};
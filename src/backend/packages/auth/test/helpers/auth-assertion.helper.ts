/**
 * @file auth-assertion.helper.ts
 * @description Provides assertion utilities for verifying authentication and authorization states in tests.
 * This helper centralizes auth-specific test assertions like verifying a user is authenticated, has specific
 * permissions, belongs to certain roles, or is authorized for particular actions.
 */

import { ErrorType, AppException } from '../../../shared/src/exceptions/exceptions.types';
import { IUserResponse, IUserWithRolesAndPermissions } from '../../src/interfaces/user.interface';
import { ITokenPayload } from '../../src/interfaces/token.interface';
import { JourneyType, IPermission, IRole } from '../../src/interfaces/role.interface';

/**
 * Interface for HTTP response objects in tests
 */
interface TestResponse {
  statusCode?: number;
  body?: any;
  headers?: Record<string, any>;
  [key: string]: any;
}

/**
 * Options for authentication assertions
 */
interface AuthAssertionOptions {
  /**
   * Whether to throw an error on assertion failure (default: true)
   */
  throwOnFailure?: boolean;

  /**
   * Custom error message prefix for assertion failures
   */
  errorMessagePrefix?: string;
}

/**
 * Class providing assertion utilities for authentication and authorization testing
 */
export class AuthAssertions {
  /**
   * Default options for assertions
   */
  private defaultOptions: AuthAssertionOptions = {
    throwOnFailure: true,
    errorMessagePrefix: 'Auth assertion failed:'
  };

  /**
   * Creates a new AuthAssertions instance
   * 
   * @param options - Global options for all assertions made with this instance
   */
  constructor(private options: AuthAssertionOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Asserts that a response indicates the user is authenticated
   * 
   * @param response - The HTTP response object to check
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertAuthenticated(response: TestResponse, options?: AuthAssertionOptions): boolean {
    const opts = this.mergeOptions(options);
    
    // Check for successful status code (2xx)
    const isSuccess = response.statusCode && response.statusCode >= 200 && response.statusCode < 300;
    
    // Check for absence of authentication errors in response body
    const hasNoAuthErrors = !this.hasAuthenticationError(response);
    
    const isAuthenticated = isSuccess && hasNoAuthErrors;
    
    if (!isAuthenticated && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected response to indicate authenticated user, but found unauthenticated state`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_001',
        { response: this.sanitizeResponse(response) }
      );
    }
    
    return isAuthenticated;
  }

  /**
   * Asserts that a response indicates the user is not authenticated
   * 
   * @param response - The HTTP response object to check
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertUnauthenticated(response: TestResponse, options?: AuthAssertionOptions): boolean {
    const opts = this.mergeOptions(options);
    
    // Check for unauthorized status code (401)
    const hasUnauthorizedStatus = response.statusCode === 401;
    
    // Check for authentication errors in response body
    const hasAuthErrors = this.hasAuthenticationError(response);
    
    const isUnauthenticated = hasUnauthorizedStatus || hasAuthErrors;
    
    if (!isUnauthenticated && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected response to indicate unauthenticated state, but found authenticated user`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_002',
        { response: this.sanitizeResponse(response) }
      );
    }
    
    return isUnauthenticated;
  }

  /**
   * Asserts that a user has a specific permission
   * 
   * @param user - The user object to check
   * @param permissionName - The permission name to check for
   * @param journeyContext - Optional journey context for the permission check
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertHasPermission(
    user: IUserWithRolesAndPermissions | IUserResponse | ITokenPayload,
    permissionName: string,
    journeyContext?: JourneyType,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Extract permissions from user object
    const permissions = this.extractPermissions(user);
    
    // Check if the permission exists
    const hasPermission = this.checkPermission(permissions, permissionName, journeyContext);
    
    if (!hasPermission && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected user to have permission '${permissionName}'${journeyContext ? ` in journey '${journeyContext}'` : ''}, but permission was not found`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_003',
        { 
          user: this.sanitizeUser(user),
          permissionName,
          journeyContext,
          availablePermissions: permissions
        }
      );
    }
    
    return hasPermission;
  }

  /**
   * Asserts that a user does not have a specific permission
   * 
   * @param user - The user object to check
   * @param permissionName - The permission name to check for
   * @param journeyContext - Optional journey context for the permission check
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertLacksPermission(
    user: IUserWithRolesAndPermissions | IUserResponse | ITokenPayload,
    permissionName: string,
    journeyContext?: JourneyType,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Extract permissions from user object
    const permissions = this.extractPermissions(user);
    
    // Check if the permission exists
    const hasPermission = this.checkPermission(permissions, permissionName, journeyContext);
    
    if (hasPermission && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected user to lack permission '${permissionName}'${journeyContext ? ` in journey '${journeyContext}'` : ''}, but permission was found`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_004',
        { 
          user: this.sanitizeUser(user),
          permissionName,
          journeyContext,
          availablePermissions: permissions
        }
      );
    }
    
    return !hasPermission;
  }

  /**
   * Asserts that a user has all of the specified permissions
   * 
   * @param user - The user object to check
   * @param permissionNames - Array of permission names to check for
   * @param journeyContext - Optional journey context for the permission check
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertHasAllPermissions(
    user: IUserWithRolesAndPermissions | IUserResponse | ITokenPayload,
    permissionNames: string[],
    journeyContext?: JourneyType,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Extract permissions from user object
    const permissions = this.extractPermissions(user);
    
    // Check if all permissions exist
    const missingPermissions = permissionNames.filter(
      perm => !this.checkPermission(permissions, perm, journeyContext)
    );
    
    const hasAllPermissions = missingPermissions.length === 0;
    
    if (!hasAllPermissions && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected user to have all permissions ${JSON.stringify(permissionNames)}${journeyContext ? ` in journey '${journeyContext}'` : ''}, but missing: ${JSON.stringify(missingPermissions)}`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_005',
        { 
          user: this.sanitizeUser(user),
          permissionNames,
          journeyContext,
          missingPermissions,
          availablePermissions: permissions
        }
      );
    }
    
    return hasAllPermissions;
  }

  /**
   * Asserts that a user has at least one of the specified permissions
   * 
   * @param user - The user object to check
   * @param permissionNames - Array of permission names to check for
   * @param journeyContext - Optional journey context for the permission check
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertHasAnyPermission(
    user: IUserWithRolesAndPermissions | IUserResponse | ITokenPayload,
    permissionNames: string[],
    journeyContext?: JourneyType,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Extract permissions from user object
    const permissions = this.extractPermissions(user);
    
    // Check if any permission exists
    const hasAnyPermission = permissionNames.some(
      perm => this.checkPermission(permissions, perm, journeyContext)
    );
    
    if (!hasAnyPermission && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected user to have at least one of permissions ${JSON.stringify(permissionNames)}${journeyContext ? ` in journey '${journeyContext}'` : ''}, but none were found`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_006',
        { 
          user: this.sanitizeUser(user),
          permissionNames,
          journeyContext,
          availablePermissions: permissions
        }
      );
    }
    
    return hasAnyPermission;
  }

  /**
   * Asserts that a user has a specific role
   * 
   * @param user - The user object to check
   * @param roleName - The role name to check for
   * @param journeyContext - Optional journey context for the role check
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertHasRole(
    user: IUserWithRolesAndPermissions | IUserResponse,
    roleName: string,
    journeyContext?: JourneyType,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Extract roles from user object
    const roles = this.extractRoles(user);
    
    // Check if the role exists
    const hasRole = this.checkRole(roles, roleName, journeyContext);
    
    if (!hasRole && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected user to have role '${roleName}'${journeyContext ? ` in journey '${journeyContext}'` : ''}, but role was not found`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_007',
        { 
          user: this.sanitizeUser(user),
          roleName,
          journeyContext,
          availableRoles: roles
        }
      );
    }
    
    return hasRole;
  }

  /**
   * Asserts that a user does not have a specific role
   * 
   * @param user - The user object to check
   * @param roleName - The role name to check for
   * @param journeyContext - Optional journey context for the role check
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertLacksRole(
    user: IUserWithRolesAndPermissions | IUserResponse,
    roleName: string,
    journeyContext?: JourneyType,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Extract roles from user object
    const roles = this.extractRoles(user);
    
    // Check if the role exists
    const hasRole = this.checkRole(roles, roleName, journeyContext);
    
    if (hasRole && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected user to lack role '${roleName}'${journeyContext ? ` in journey '${journeyContext}'` : ''}, but role was found`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_008',
        { 
          user: this.sanitizeUser(user),
          roleName,
          journeyContext,
          availableRoles: roles
        }
      );
    }
    
    return !hasRole;
  }

  /**
   * Asserts that a response contains a valid JWT token
   * 
   * @param response - The HTTP response object to check
   * @param tokenProperty - The property name in the response body that contains the token (default: 'accessToken')
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertHasValidToken(
    response: TestResponse,
    tokenProperty: string = 'accessToken',
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Check if response has a body
    if (!response.body) {
      if (opts.throwOnFailure) {
        throw new AppException(
          `${opts.errorMessagePrefix} Expected response to contain a body with token, but body is missing`,
          ErrorType.VALIDATION,
          'AUTH_ASSERT_009',
          { response: this.sanitizeResponse(response) }
        );
      }
      return false;
    }
    
    // Check if token exists in response
    const token = response.body[tokenProperty];
    if (!token) {
      if (opts.throwOnFailure) {
        throw new AppException(
          `${opts.errorMessagePrefix} Expected response to contain token in '${tokenProperty}' property, but property is missing or empty`,
          ErrorType.VALIDATION,
          'AUTH_ASSERT_010',
          { 
            response: this.sanitizeResponse(response),
            tokenProperty
          }
        );
      }
      return false;
    }
    
    // Check if token has valid JWT format (simplified check)
    const hasValidFormat = typeof token === 'string' && token.split('.').length === 3;
    if (!hasValidFormat && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected token to have valid JWT format, but found invalid format`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_011',
        { 
          tokenProperty,
          token: typeof token === 'string' ? `${token.substring(0, 10)}...` : token
        }
      );
    }
    
    return hasValidFormat;
  }

  /**
   * Asserts that a response contains a token with specific claims
   * 
   * @param response - The HTTP response object to check
   * @param expectedClaims - Object with expected claims that should be in the token payload
   * @param tokenProperty - The property name in the response body that contains the token (default: 'accessToken')
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertTokenHasClaims(
    response: TestResponse,
    expectedClaims: Record<string, any>,
    tokenProperty: string = 'accessToken',
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // First check if token exists and is valid
    if (!this.assertHasValidToken(response, tokenProperty, { ...opts, throwOnFailure: false })) {
      if (opts.throwOnFailure) {
        throw new AppException(
          `${opts.errorMessagePrefix} Cannot check token claims because token is invalid or missing`,
          ErrorType.VALIDATION,
          'AUTH_ASSERT_012',
          { response: this.sanitizeResponse(response) }
        );
      }
      return false;
    }
    
    // Get token from response
    const token = response.body[tokenProperty];
    
    // Decode token payload (without verification)
    let payload: Record<string, any>;
    try {
      const base64Payload = token.split('.')[1];
      const payloadJson = Buffer.from(base64Payload, 'base64').toString('utf8');
      payload = JSON.parse(payloadJson);
    } catch (error) {
      if (opts.throwOnFailure) {
        throw new AppException(
          `${opts.errorMessagePrefix} Failed to decode token payload`,
          ErrorType.VALIDATION,
          'AUTH_ASSERT_013',
          { 
            token: typeof token === 'string' ? `${token.substring(0, 10)}...` : token,
            error
          }
        );
      }
      return false;
    }
    
    // Check if all expected claims exist with correct values
    const missingClaims: string[] = [];
    const incorrectClaims: Record<string, { expected: any, actual: any }> = {};
    
    Object.entries(expectedClaims).forEach(([claimName, expectedValue]) => {
      if (!(claimName in payload)) {
        missingClaims.push(claimName);
      } else if (!this.deepEquals(payload[claimName], expectedValue)) {
        incorrectClaims[claimName] = {
          expected: expectedValue,
          actual: payload[claimName]
        };
      }
    });
    
    const hasAllClaims = missingClaims.length === 0 && Object.keys(incorrectClaims).length === 0;
    
    if (!hasAllClaims && opts.throwOnFailure) {
      let message = `${opts.errorMessagePrefix} Token does not contain expected claims`;
      
      if (missingClaims.length > 0) {
        message += `\nMissing claims: ${JSON.stringify(missingClaims)}`;
      }
      
      if (Object.keys(incorrectClaims).length > 0) {
        message += `\nIncorrect claim values: ${JSON.stringify(incorrectClaims)}`;
      }
      
      throw new AppException(
        message,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_014',
        { 
          missingClaims,
          incorrectClaims,
          expectedClaims,
          actualPayload: payload
        }
      );
    }
    
    return hasAllClaims;
  }

  /**
   * Asserts that a response indicates the user is authorized for a specific journey
   * 
   * @param response - The HTTP response object to check
   * @param journeyType - The journey type to check authorization for
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertAuthorizedForJourney(
    response: TestResponse,
    journeyType: JourneyType,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // First check if user is authenticated
    if (!this.assertAuthenticated(response, { ...opts, throwOnFailure: false })) {
      if (opts.throwOnFailure) {
        throw new AppException(
          `${opts.errorMessagePrefix} Cannot check journey authorization because user is not authenticated`,
          ErrorType.VALIDATION,
          'AUTH_ASSERT_015',
          { response: this.sanitizeResponse(response) }
        );
      }
      return false;
    }
    
    // Check for journey-specific authorization errors
    const hasJourneyAuthError = this.hasJourneyAuthorizationError(response, journeyType);
    
    if (hasJourneyAuthError && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected user to be authorized for journey '${journeyType}', but found journey authorization error`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_016',
        { 
          response: this.sanitizeResponse(response),
          journeyType
        }
      );
    }
    
    return !hasJourneyAuthError;
  }

  /**
   * Asserts that a response indicates the user is not authorized for a specific journey
   * 
   * @param response - The HTTP response object to check
   * @param journeyType - The journey type to check authorization for
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertUnauthorizedForJourney(
    response: TestResponse,
    journeyType: JourneyType,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Check for journey-specific authorization errors or forbidden status
    const hasJourneyAuthError = this.hasJourneyAuthorizationError(response, journeyType);
    const hasForbiddenStatus = response.statusCode === 403;
    
    const isUnauthorized = hasJourneyAuthError || hasForbiddenStatus;
    
    if (!isUnauthorized && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected user to be unauthorized for journey '${journeyType}', but no journey authorization error was found`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_017',
        { 
          response: this.sanitizeResponse(response),
          journeyType
        }
      );
    }
    
    return isUnauthorized;
  }

  /**
   * Asserts that a response contains a specific error code
   * 
   * @param response - The HTTP response object to check
   * @param errorCode - The error code to check for
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertHasErrorCode(
    response: TestResponse,
    errorCode: string,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Check if response has a body with error
    if (!response.body || !response.body.error) {
      if (opts.throwOnFailure) {
        throw new AppException(
          `${opts.errorMessagePrefix} Expected response to contain error with code '${errorCode}', but no error object was found`,
          ErrorType.VALIDATION,
          'AUTH_ASSERT_018',
          { response: this.sanitizeResponse(response) }
        );
      }
      return false;
    }
    
    // Check if error code matches
    const actualErrorCode = response.body.error.code;
    const hasErrorCode = actualErrorCode === errorCode;
    
    if (!hasErrorCode && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected error code '${errorCode}', but found '${actualErrorCode}'`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_019',
        { 
          expectedErrorCode: errorCode,
          actualErrorCode,
          error: response.body.error
        }
      );
    }
    
    return hasErrorCode;
  }

  /**
   * Asserts that a response contains a specific error type
   * 
   * @param response - The HTTP response object to check
   * @param errorType - The error type to check for
   * @param options - Options for this specific assertion
   * @returns true if assertion passes, false otherwise
   * @throws AppException if assertion fails and throwOnFailure is true
   */
  public assertHasErrorType(
    response: TestResponse,
    errorType: ErrorType,
    options?: AuthAssertionOptions
  ): boolean {
    const opts = this.mergeOptions(options);
    
    // Check if response has a body with error
    if (!response.body || !response.body.error) {
      if (opts.throwOnFailure) {
        throw new AppException(
          `${opts.errorMessagePrefix} Expected response to contain error with type '${errorType}', but no error object was found`,
          ErrorType.VALIDATION,
          'AUTH_ASSERT_020',
          { response: this.sanitizeResponse(response) }
        );
      }
      return false;
    }
    
    // Check if error type matches
    const actualErrorType = response.body.error.type;
    const hasErrorType = actualErrorType === errorType;
    
    if (!hasErrorType && opts.throwOnFailure) {
      throw new AppException(
        `${opts.errorMessagePrefix} Expected error type '${errorType}', but found '${actualErrorType}'`,
        ErrorType.VALIDATION,
        'AUTH_ASSERT_021',
        { 
          expectedErrorType: errorType,
          actualErrorType,
          error: response.body.error
        }
      );
    }
    
    return hasErrorType;
  }

  // Private helper methods

  /**
   * Merges global options with specific assertion options
   * @private
   */
  private mergeOptions(options?: AuthAssertionOptions): AuthAssertionOptions {
    return { ...this.options, ...options };
  }

  /**
   * Checks if a response contains authentication errors
   * @private
   */
  private hasAuthenticationError(response: TestResponse): boolean {
    // Check for 401 status code
    if (response.statusCode === 401) {
      return true;
    }
    
    // Check for error object with authentication-related codes
    if (response.body && response.body.error) {
      const errorCode = response.body.error.code;
      const authErrorCodes = ['AUTH_001', 'AUTH_002', 'AUTH_003', 'AUTH_004', 'TOKEN_001', 'TOKEN_002', 'TOKEN_003'];
      return authErrorCodes.includes(errorCode);
    }
    
    return false;
  }

  /**
   * Checks if a response contains journey-specific authorization errors
   * @private
   */
  private hasJourneyAuthorizationError(response: TestResponse, journeyType: JourneyType): boolean {
    // Check for 403 status code
    if (response.statusCode === 403) {
      return true;
    }
    
    // Check for error object with journey-specific authorization codes
    if (response.body && response.body.error) {
      const errorCode = response.body.error.code;
      const journeyAuthErrorCodes = ['AUTH_005', 'AUTH_006', 'JOURNEY_001', 'JOURNEY_002'];
      
      if (journeyAuthErrorCodes.includes(errorCode)) {
        // If error details contain journey information, check if it matches
        if (response.body.error.details && response.body.error.details.journey) {
          return response.body.error.details.journey === journeyType;
        }
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extracts permissions from a user object
   * @private
   */
  private extractPermissions(user: IUserWithRolesAndPermissions | IUserResponse | ITokenPayload): string[] {
    if ('permissions' in user) {
      // Handle ITokenPayload or user with permissions array
      if (Array.isArray(user.permissions)) {
        if (typeof user.permissions[0] === 'string') {
          return user.permissions as string[];
        } else {
          // Handle IPermission objects
          return (user.permissions as IPermission[]).map(p => p.name);
        }
      }
    }
    
    // Handle user with roles that contain permissions
    if ('roles' in user && Array.isArray(user.roles)) {
      const permissionNames: string[] = [];
      
      user.roles.forEach(role => {
        if (typeof role === 'object' && role !== null && 'permissions' in role && Array.isArray(role.permissions)) {
          (role.permissions as IPermission[]).forEach(permission => {
            if (typeof permission === 'object' && permission !== null && 'name' in permission) {
              permissionNames.push(permission.name);
            }
          });
        }
      });
      
      return permissionNames;
    }
    
    return [];
  }

  /**
   * Extracts roles from a user object
   * @private
   */
  private extractRoles(user: IUserWithRolesAndPermissions | IUserResponse): IRole[] {
    if ('roles' in user && Array.isArray(user.roles)) {
      return user.roles as IRole[];
    }
    
    return [];
  }

  /**
   * Checks if a list of permissions contains a specific permission
   * @private
   */
  private checkPermission(permissions: string[], permissionName: string, journeyContext?: JourneyType): boolean {
    // If journey context is provided, check for journey-specific permission
    if (journeyContext) {
      // Check for exact permission in the specified journey
      if (permissionName.startsWith(`${journeyContext}:`)) {
        return permissions.includes(permissionName);
      }
      
      // Check for permission with journey prefix
      return permissions.includes(`${journeyContext}:${permissionName}`);
    }
    
    // Without journey context, check for the exact permission name
    return permissions.includes(permissionName);
  }

  /**
   * Checks if a list of roles contains a specific role
   * @private
   */
  private checkRole(roles: IRole[], roleName: string, journeyContext?: JourneyType): boolean {
    return roles.some(role => {
      // Check if role name matches
      const nameMatches = role.name === roleName;
      
      // If journey context is provided, check if role belongs to that journey
      if (journeyContext) {
        return nameMatches && role.journey === journeyContext;
      }
      
      return nameMatches;
    });
  }

  /**
   * Sanitizes a response object for error messages
   * @private
   */
  private sanitizeResponse(response: TestResponse): any {
    // Create a simplified version of the response for error messages
    return {
      statusCode: response.statusCode,
      body: response.body,
      headers: response.headers ? {
        ...response.headers,
        // Truncate authorization header if present
        authorization: response.headers.authorization ? 
          `${response.headers.authorization.substring(0, 15)}...` : 
          undefined
      } : undefined
    };
  }

  /**
   * Sanitizes a user object for error messages
   * @private
   */
  private sanitizeUser(user: IUserWithRolesAndPermissions | IUserResponse | ITokenPayload): any {
    // Create a simplified version of the user for error messages
    const sanitized: Record<string, any> = {};
    
    // Include basic user properties
    if ('id' in user) sanitized.id = user.id;
    if ('email' in user) sanitized.email = user.email;
    if ('name' in user) sanitized.name = user.name;
    
    // Include roles if present
    if ('roles' in user && Array.isArray(user.roles)) {
      if (typeof user.roles[0] === 'object') {
        sanitized.roles = (user.roles as IRole[]).map(r => ({ id: r.id, name: r.name, journey: r.journey }));
      } else {
        sanitized.roles = user.roles;
      }
    }
    
    // Include permissions if present
    if ('permissions' in user && Array.isArray(user.permissions)) {
      if (typeof user.permissions[0] === 'object') {
        sanitized.permissions = (user.permissions as IPermission[]).map(p => p.name);
      } else {
        sanitized.permissions = user.permissions;
      }
    }
    
    return sanitized;
  }

  /**
   * Deep equality check for objects
   * @private
   */
  private deepEquals(a: any, b: any): boolean {
    // Handle primitive types
    if (a === b) return true;
    
    // Handle null/undefined
    if (a == null || b == null) return a === b;
    
    // Handle different types
    if (typeof a !== typeof b) return false;
    
    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEquals(item, b[index]));
    }
    
    // Handle objects
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => 
        Object.prototype.hasOwnProperty.call(b, key) && 
        this.deepEquals(a[key], b[key])
      );
    }
    
    return false;
  }
}

/**
 * Creates a new AuthAssertions instance with default options
 * @returns A new AuthAssertions instance
 */
export function createAuthAssertions(options?: AuthAssertionOptions): AuthAssertions {
  return new AuthAssertions(options);
}

/**
 * Default export for easier importing
 */
export default {
  AuthAssertions,
  createAuthAssertions
};
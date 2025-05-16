/**
 * @file index.ts
 * @description Barrel file for exporting all authentication-related interfaces from a single entry point.
 * This centralization creates a clean public API for the auth package, enables straightforward imports,
 * and prevents circular dependencies.
 */

// Export service interfaces
export { IAuthService, IUserService, IRoleService, IPermissionService } from './services.interface';

// Export role and permission interfaces
export {
  JourneyType,
  IPermission,
  IRole,
  IUserRole,
  PermissionCheck,
  IRoleAuthorization
} from './role.interface';

// Export token interfaces
export {
  ITokenPayload,
  IToken,
  ITokenResponse,
  IRefreshTokenRequest,
  ITokenValidationOptions,
  ITokenGenerationOptions
} from './token.interface';

// Export authentication interfaces
export {
  IAuthResult,
  ILoginRequest,
  IRegisterRequest,
  IMfaVerifyRequest,
  ISocialLoginRequest,
  ITokenRefreshRequest,
  IAuthSession
} from './auth.interface';

// Export user interfaces
// Note: IRole and IPermission are already exported from role.interface.ts
export {
  IUser,
  IUserWithRoles,
  IUserWithPermissions,
  IUserWithRolesAndPermissions,
  IUserResponse,
  IUserPublic,
  ICreateUser,
  IUpdateUser
} from './user.interface';
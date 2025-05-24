/**
 * @file index.ts
 * @description Barrel file for exporting all authentication-related interfaces.
 * This file creates a centralized export point for all interfaces in the auth package,
 * enabling a clean public API and simplified imports for consumers.
 */

// Export service interfaces
export { IAuthService, IUserService, IRoleService, IPermissionService } from './services.interface';

// Export role and permission interfaces
export {
  JourneyType,
  IPermission,
  IRole,
  IUserRole,
  HealthRole,
  CareRole,
  PlanRole,
  GlobalRole
} from './role.interface';

// Export token interfaces
export {
  ITokenPayload,
  IToken,
  ITokenResponse,
  IRefreshTokenRequest,
  ITokenVerificationOptions,
  ITokenGenerationOptions
} from './token.interface';

// Export authentication interfaces
export {
  IAuthResult,
  ILoginRequest,
  IRegisterRequest,
  IMfaVerifyRequest,
  ISocialLoginRequest,
  IPasswordResetRequest,
  IPasswordUpdateRequest,
  IAuthSession
} from './auth.interface';

// Export user interfaces
// Note: IRole and IPermission are already exported from role.interface.ts
export {
  IUser,
  IUserWithRoles,
  IUserResponse,
  ICreateUser,
  IUpdateUser,
  IUserCredentials
} from './user.interface';
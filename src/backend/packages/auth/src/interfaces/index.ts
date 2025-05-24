/**
 * Barrel file for exporting all authentication-related interfaces
 * Creates a clean public API for the auth package
 */

// Export token interfaces
export {
  ITokenPayload,
  IToken,
  ITokenResponse,
  IRefreshTokenRequest,
  ITokenVerificationOptions,
  ITokenGenerationOptions
} from './token.interface';

// Export role interfaces
export {
  IRole,
  IPermission,
  IUserRole
} from './role.interface';

// Export user interfaces
export {
  IUser,
  IUserResponse,
  IUserWithRoles
} from './user.interface';

// Export auth interfaces
export {
  IAuthResult,
  ILoginRequest,
  IRegisterRequest,
  IMfaVerifyRequest
} from './auth.interface';

// Export service interfaces
export {
  IAuthService,
  IUserService,
  IRoleService,
  IPermissionService
} from './services.interface';
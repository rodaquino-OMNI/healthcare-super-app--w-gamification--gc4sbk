/**
 * Auth Service Interfaces Barrel Export
 * 
 * This file centralizes and exports all shared interfaces from the auth-service's top-level interfaces folder.
 * It provides a single import point for consuming shared interfaces across all auth-service modules,
 * improving code organization and simplifying imports.
 * 
 * @module interfaces
 */

/**
 * Auth Service Core Interfaces
 * Defines the public API contract for the auth-service
 */
export * from './auth-service.interface';

/**
 * Common Utility Interfaces
 * Includes pagination, sorting, and filtering interfaces
 */
export * from './common.interface';

/**
 * Configuration Interfaces
 * Contains types for environment variables, service settings, and feature flags
 */
export * from './config.interface';

/**
 * Error Interfaces
 * Includes error types, codes, and serialization formats
 */
export * from './error.interface';

/**
 * HTTP Response Interfaces
 * Includes success, error, and pagination response formats
 */
export * from './http-response.interface';

/**
 * Token Interfaces
 * Includes JWT token structure, payload format, and token validation interfaces
 */
export * from './token.interface';

/**
 * User Context Interfaces
 * Includes user data, permissions, and roles
 */
export * from './user-context.interface';

/**
 * Re-export shared interfaces from @austa/interfaces
 * This allows consumers to import all interfaces from a single location
 */
export {
  // Auth interfaces
  IUser,
  IRole,
  IPermission,
  IJwtPayloadBase,
  IJwtTokenBase,
  ITokenValidationResult,
  ILoginRequestDto,
  IRegisterRequestDto,
  ILoginResponseDto,
  IRegisterResponseDto,
  IRefreshTokenRequestDto,
} from '@austa/interfaces/auth';

/**
 * Re-export common utility interfaces from @austa/interfaces
 */
export {
  IPaginationOptions,
  IPaginatedResult,
  ISortOptions,
  IFilterOptions,
} from '@austa/interfaces/common/dto';
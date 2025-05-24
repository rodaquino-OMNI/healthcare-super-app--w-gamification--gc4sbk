/**
 * @file Providers index barrel file
 * @description Centralized export point for all authentication providers and related interfaces.
 * This file organizes exports by provider type (database, JWT, OAuth) for improved code readability
 * and IDE support. It integrates with @austa/interfaces for type-safe request/response models.
 *
 * @module @austa/auth/providers
 */

import { UserInterface, TokenPayloadInterface } from '@austa/interfaces/auth';

/**
 * Base Authentication Provider Interface
 * @description Core interface that all authentication providers must implement
 */
export * from './auth-provider.interface';

/**
 * Authentication Providers Module
 * @description NestJS module for registering all authentication providers
 */
export * from './providers.module';

/**
 * Database Authentication
 * @description Providers for username/password authentication against database
 */
export * from './database';

// Named exports for database providers for better IDE support
export { 
  DatabaseAuthProvider,
  DatabaseAuthProviderInterface,
  DatabaseAuthOptions,
  PasswordUtils,
  hashPassword,
  verifyPassword,
  validatePasswordStrength
} from './database';

/**
 * JWT Authentication
 * @description Providers for JSON Web Token generation and validation
 */
export * from './jwt';

// Named exports for JWT providers for better IDE support
export {
  JwtProvider,
  JwtRedisProvider,
  JwtProviderInterface,
  JwtConfig,
  JwtPayload,
  JwtValidationResult
} from './jwt';

/**
 * OAuth Authentication
 * @description Providers for third-party authentication (Google, Facebook, Apple)
 */
export * from './oauth';

// Named exports for OAuth providers for better IDE support
export {
  BaseOAuthProvider,
  GoogleOAuthProvider,
  FacebookOAuthProvider,
  AppleOAuthProvider,
  OAuthProfile,
  OAuthToken,
  OAuthConfig,
  OAuthProviderType
} from './oauth';

/**
 * Re-export common types from @austa/interfaces for convenience
 * This allows consumers to import these types directly from the providers module
 */
export { UserInterface, TokenPayloadInterface };
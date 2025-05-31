/**
 * @file OAuth Providers index barrel file
 * @description Centralized export point for all OAuth authentication providers and related interfaces.
 * This file organizes exports for OAuth providers (Google, Facebook, Apple) and their shared interfaces
 * for improved code organization and tree-shaking support.
 *
 * @module @austa/auth/providers/oauth
 */

/**
 * OAuth Interfaces
 * @description Type definitions for OAuth authentication including profile structures,
 * token formats, and provider configurations
 */
export {
  OAuthProfile,
  OAuthToken,
  OAuthConfig,
  OAuthProviderType,
  GoogleOAuthConfig,
  FacebookOAuthConfig,
  AppleOAuthConfig,
  OAuthUserData,
  OAuthValidationResult
} from './interfaces';

/**
 * Base OAuth Provider
 * @description Abstract base class that serves as the foundation for all OAuth provider implementations
 */
export { BaseOAuthProvider } from './base.provider';

/**
 * Google OAuth Provider
 * @description Handles Google-specific authentication flow, token validation, and profile normalization
 */
export { GoogleOAuthProvider } from './google.provider';

/**
 * Facebook OAuth Provider
 * @description Handles Facebook-specific authentication flow, token validation, and profile normalization
 */
export { FacebookOAuthProvider } from './facebook.provider';

/**
 * Apple OAuth Provider
 * @description Handles Apple's Sign In with Apple flow, including JWT validation, token exchange, and profile normalization
 */
export { AppleOAuthProvider } from './apple.provider';
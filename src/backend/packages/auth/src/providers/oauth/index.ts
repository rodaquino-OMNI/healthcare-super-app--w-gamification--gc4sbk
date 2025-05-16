/**
 * @file OAuth Providers Barrel File
 * 
 * This barrel file exports all OAuth providers and interfaces, creating a clean public API
 * for the OAuth functionality in the AUSTA SuperApp. It simplifies imports for consumers by
 * providing a single entry point to access all OAuth-related components and enables tree-shaking
 * by using named exports.
 * 
 * Example usage:
 * ```typescript
 * // Import specific providers
 * import { GoogleOAuthProvider, FacebookOAuthProvider } from '@austa/auth/providers/oauth';
 * 
 * // Import interfaces
 * import { OAuthProfile, OAuthToken } from '@austa/auth/providers/oauth';
 * ```
 */

// Export all interfaces and types
export * from './interfaces';

// Export the base provider
export * from './base.provider';

// Export specific provider implementations
export * from './google.provider';
export * from './facebook.provider';
export * from './apple.provider';
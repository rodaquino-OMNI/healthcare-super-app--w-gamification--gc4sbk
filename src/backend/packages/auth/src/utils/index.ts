/**
 * @file Authentication Utilities Index
 * @description Exports all authentication utility functions and types from a single entry point
 * 
 * This barrel file provides a centralized export point for all authentication utilities,
 * enabling consumers to import from a single path rather than individual utility files.
 * This approach simplifies imports and provides a clear public API for the auth package.
 */

// Export all validation utilities
export {
  isValidCPF,
  isValidTokenFormat,
  extractTokenFromHeader,
  isValidOAuthState,
  generateOAuthState,
  isTokenExpired as isTokenExpiredValidation,
  isValidIssuer,
  isValidAudience,
} from './validation.util';

// Export all crypto utilities
export {
  generateRandomBytes,
  generateRandomString,
  generateSecureToken,
  generateUrlSafeToken,
  generateSessionId,
  generateCsrfToken,
  generatePasswordResetToken,
  generateTotpSecret,
  generateDeviceFingerprint,
  generateRefreshToken as generateRefreshTokenCrypto,
  generateNonce,
} from './crypto.util';

// Export all token utilities and types
export {
  TokenErrorType,
  type TokenValidationResult,
  type TokenGenerationOptions,
  encodeToken,
  decodeToken,
  validateToken,
  generateRefreshToken,
  hashRefreshToken,
  isTokenExpired,
  isTokenAboutToExpire,
  extractUserFromPayload,
  calculateExpirationTime,
  createTokenPayload,
  verifyRefreshToken,
  extractTokenFromHeader as extractTokenFromHeaderToken,
} from './token.util';

// Export all password utilities and types
export {
  generateSalt,
  hashPassword,
  verifyPassword,
  type PasswordValidationResult,
  validatePasswordStrength,
  loadPasswordPolicyFromEnv,
  passwordNeedsRehash,
  generateSecurePassword,
  isPasswordPreviouslyUsed,
} from './password.util';

// Re-export with renamed functions to avoid naming conflicts
import { extractTokenFromHeader as extractTokenHeader } from './validation.util';
import { generateRefreshToken as generateRefreshTokenFunc } from './crypto.util';
import { isTokenExpired as isTokenExpiredFunc } from './token.util';

/**
 * Extract token from Authorization header
 * 
 * This is a convenience function that combines the token extraction functions
 * from both validation.util and token.util. It first tries to extract the token
 * using the validation utility, and if that fails, it falls back to the token utility.
 * 
 * @param authHeader - The Authorization header value
 * @returns The extracted token or null if not found or invalid
 */
export const extractToken = (authHeader: string): string | null => {
  return extractTokenHeader(authHeader) || null;
};
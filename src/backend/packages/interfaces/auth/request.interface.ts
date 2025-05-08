/**
 * @file Authentication request interfaces for the AUSTA SuperApp
 * @module @austa/interfaces/auth/request
 * 
 * This file defines standardized request interfaces for authentication operations
 * across the AUSTA SuperApp. These interfaces ensure consistent request validation
 * and handling for operations like login, registration, password reset, and token refresh.
 */

/**
 * Interface for login request payloads.
 * Used for authenticating existing users with email and password.
 */
export interface ILoginRequestDto {
  /**
   * Email address of the user attempting to log in.
   * Must be a valid email format.
   */
  email: string;

  /**
   * Password of the user attempting to log in.
   * Will be validated against the stored hashed password.
   */
  password: string;

  /**
   * Optional remember me flag to extend token expiration.
   * When true, the issued tokens will have a longer expiration time.
   */
  rememberMe?: boolean;
}

/**
 * Interface for user registration request payloads.
 * Contains all necessary information required for creating a new user account.
 */
export interface IRegisterRequestDto {
  /**
   * Full name of the user.
   * Must not be empty and have a maximum length of 255 characters.
   */
  name: string;

  /**
   * Email address of the user.
   * Must be a valid email format and unique in the system.
   */
  email: string;

  /**
   * Password of the user.
   * Must be at least 8 characters long and include at least one uppercase letter,
   * one lowercase letter, one number, and one special character for security.
   */
  password: string;

  /**
   * Phone number of the user (optional).
   * Used for SMS notifications and multi-factor authentication.
   * Must be in a valid international format if provided.
   */
  phone?: string;

  /**
   * CPF (Brazilian national ID) of the user (optional).
   * Used for identity verification as required by Brazilian regulations.
   * Must be a valid CPF format if provided (11 digits).
   */
  cpf?: string;

  /**
   * User's preferred language for the application (optional).
   * Defaults to Portuguese (pt-BR) if not specified.
   */
  preferredLanguage?: string;
}

/**
 * Interface for token refresh request payloads.
 * Used for obtaining a new access token using a valid refresh token.
 */
export interface IRefreshTokenRequestDto {
  /**
   * Refresh token issued during login or previous refresh.
   * Must be valid and not expired to issue a new access token.
   */
  refreshToken: string;
}

/**
 * Interface for password reset request payloads.
 * Used for initiating the password reset process.
 */
export interface IPasswordResetRequestDto {
  /**
   * Email address of the user requesting a password reset.
   * Must be associated with an existing user account.
   */
  email: string;
}

/**
 * Interface for password reset confirmation request payloads.
 * Used for completing the password reset process with a new password.
 */
export interface IPasswordResetConfirmRequestDto {
  /**
   * Reset token sent to the user's email.
   * Must be valid and not expired to allow password reset.
   */
  token: string;

  /**
   * New password to set for the user account.
   * Must meet the same security requirements as registration passwords.
   */
  newPassword: string;

  /**
   * Confirmation of the new password.
   * Must match the newPassword field exactly.
   */
  confirmPassword: string;
}

/**
 * Interface for email verification request payloads.
 * Used for verifying a user's email address.
 */
export interface IEmailVerificationRequestDto {
  /**
   * Verification token sent to the user's email.
   * Must be valid and not expired to verify the email address.
   */
  token: string;
}

/**
 * Interface for logout request payloads.
 * Used for invalidating the current session and tokens.
 */
export interface ILogoutRequestDto {
  /**
   * Optional refresh token to invalidate.
   * If not provided, all refresh tokens for the user will be invalidated.
   */
  refreshToken?: string;

  /**
   * Optional flag to indicate if all devices should be logged out.
   * When true, all refresh tokens for the user will be invalidated.
   */
  logoutFromAllDevices?: boolean;
}

/**
 * Interface for changing password request payloads.
 * Used for changing the password of an authenticated user.
 */
export interface IChangePasswordRequestDto {
  /**
   * Current password of the user.
   * Required for security verification before changing the password.
   */
  currentPassword: string;

  /**
   * New password to set for the user account.
   * Must meet the same security requirements as registration passwords.
   */
  newPassword: string;

  /**
   * Confirmation of the new password.
   * Must match the newPassword field exactly.
   */
  confirmPassword: string;
}
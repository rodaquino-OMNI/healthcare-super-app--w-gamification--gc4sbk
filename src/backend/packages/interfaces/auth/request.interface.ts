/**
 * @file Authentication request interfaces for the AUSTA SuperApp
 * @description Defines standardized interfaces for authentication request payloads
 * used across the AUSTA SuperApp backend. These interfaces ensure consistent
 * request validation across all services.
 */

/**
 * Interface for login request payload.
 * Used for authenticating existing users with email and password.
 */
export interface LoginRequestDto {
  /**
   * Email address of the user.
   * Must be a valid email format registered in the system.
   */
  email: string;

  /**
   * Password of the user.
   * Must match the stored password hash for the provided email.
   */
  password: string;
}

/**
 * Interface for user registration request payload.
 * Contains all necessary information required for creating a new user account.
 */
export interface RegisterRequestDto {
  /**
   * Full name of the user.
   */
  name: string;

  /**
   * Email address of the user.
   * Must be a valid email format and unique in the system.
   */
  email: string;

  /**
   * Password of the user.
   * Must be at least 8 characters long for security.
   */
  password: string;

  /**
   * Phone number of the user (optional).
   * Used for SMS notifications and multi-factor authentication.
   */
  phone?: string;

  /**
   * CPF (Brazilian national ID) of the user (optional).
   * Used for identity verification as required by Brazilian regulations.
   */
  cpf?: string;
}

/**
 * Interface for token refresh request payload.
 * Used for obtaining a new access token using a valid refresh token.
 */
export interface RefreshTokenRequestDto {
  /**
   * Refresh token issued during login or previous refresh.
   * Used to generate a new access token without requiring re-authentication.
   */
  refresh_token: string;
}

/**
 * Interface for password reset request payload.
 * Used to initiate the password reset process for a user.
 */
export interface PasswordResetRequestDto {
  /**
   * Email address of the user requesting password reset.
   * Must be a valid email format registered in the system.
   */
  email: string;
}

/**
 * Interface for password reset confirmation payload.
 * Used to complete the password reset process with a new password.
 */
export interface PasswordResetConfirmRequestDto {
  /**
   * Reset token sent to the user's email.
   * Must be valid and not expired.
   */
  reset_token: string;

  /**
   * New password to set for the user account.
   * Must meet the system's password requirements.
   */
  new_password: string;

  /**
   * Confirmation of the new password.
   * Must match the new_password field exactly.
   */
  confirm_password: string;
}
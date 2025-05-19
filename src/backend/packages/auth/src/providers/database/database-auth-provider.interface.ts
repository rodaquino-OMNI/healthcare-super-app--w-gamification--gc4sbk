/**
 * @file Database Authentication Provider Interface
 * 
 * Defines the interface for database authentication providers, extending the base auth provider
 * interface with database-specific methods. It establishes a contract for credential validation,
 * user retrieval, and password verification operations that all database authentication
 * implementations must fulfill.
 *
 * @module @austa/auth/providers/database
 */

import { IAuthProvider } from '../auth-provider.interface';

/**
 * Database credentials interface for username/password authentication
 */
export interface DatabaseCredentials {
  /**
   * Username (email, username, etc.)
   */
  username: string;
  
  /**
   * Password
   */
  password: string;
  
  /**
   * Remember user session (extended token expiration)
   */
  rememberMe?: boolean;
}

/**
 * Configuration options for database authentication providers
 */
export interface DatabaseAuthProviderOptions {
  /**
   * The database table/collection to use for user authentication
   * @default 'users'
   */
  userTable?: string;
  
  /**
   * The field to use as the username for authentication
   * @default 'email'
   */
  usernameField?: string;
  
  /**
   * The field to use as the password for authentication
   * @default 'password'
   */
  passwordField?: string;
  
  /**
   * Whether to enable case-insensitive username matching
   * @default true
   */
  caseInsensitiveMatch?: boolean;
  
  /**
   * Additional fields to select from the user table
   * @default []
   */
  selectFields?: string[];
  
  /**
   * Custom error messages
   */
  errorMessages?: {
    invalidCredentials?: string;
    userNotFound?: string;
    accountDisabled?: string;
    accountLocked?: string;
    passwordExpired?: string;
  };
}

/**
 * Interface for database authentication providers that validate username/password
 * credentials against database records.
 * 
 * Extends the base auth provider interface with database-specific methods for
 * user lookup, password verification, and account management.
 * 
 * @template TUser The user entity type
 * @template TCredentials The credentials type, defaults to DatabaseCredentials
 */
export interface IDatabaseAuthProvider<
  TUser extends Record<string, any>,
  TCredentials extends DatabaseCredentials = DatabaseCredentials
> extends IAuthProvider<TUser, TCredentials> {
  /**
   * Finds a user by their username (email, username, etc.)
   * 
   * @param username - Username to search for
   * @returns Promise resolving to the user or null if not found
   */
  findUserByUsername(username: string): Promise<TUser | null>;
  
  /**
   * Verifies a password against a user's stored password hash
   * 
   * @param plainPassword - Plain text password to verify
   * @param user - User object containing the hashed password
   * @returns Promise resolving to true if the password is valid, false otherwise
   */
  verifyUserPassword(plainPassword: string, user: TUser): Promise<boolean>;
  
  /**
   * Updates a user's password in the database
   * 
   * @param userId - User identifier
   * @param newPassword - New password (plain text)
   * @returns Promise resolving to true if the update was successful, false otherwise
   */
  updateUserPassword(userId: string, newPassword: string): Promise<boolean>;
  
  /**
   * Checks if a user account is locked due to too many failed login attempts
   * 
   * @param user - User object
   * @returns True if the account is locked, false otherwise
   */
  isAccountLocked(user: TUser): boolean;
  
  /**
   * Checks if a user account is disabled/inactive
   * 
   * @param user - User object
   * @returns True if the account is disabled, false otherwise
   */
  isAccountDisabled(user: TUser): boolean;
  
  /**
   * Checks if a user's password has expired and needs to be changed
   * 
   * @param user - User object
   * @returns True if the password has expired, false otherwise
   */
  isPasswordExpired(user: TUser): boolean;
  
  /**
   * Records a failed login attempt for a user
   * 
   * @param userId - User identifier
   * @returns Promise resolving to the updated number of failed attempts
   */
  recordFailedLoginAttempt(userId: string): Promise<number>;
  
  /**
   * Resets the failed login attempts counter for a user
   * 
   * @param userId - User identifier
   * @returns Promise resolving when the reset is complete
   */
  resetFailedLoginAttempts(userId: string): Promise<void>;
  
  /**
   * Updates the last login timestamp for a user
   * 
   * @param userId - User identifier
   * @returns Promise resolving when the update is complete
   */
  updateLastLogin(userId: string): Promise<void>;
  
  /**
   * Locks a user account, preventing further login attempts
   * 
   * @param userId - User identifier
   * @param reason - Reason for locking the account (optional)
   * @returns Promise resolving when the account is locked
   */
  lockUserAccount(userId: string, reason?: string): Promise<void>;
  
  /**
   * Unlocks a previously locked user account
   * 
   * @param userId - User identifier
   * @returns Promise resolving when the account is unlocked
   */
  unlockUserAccount(userId: string): Promise<void>;
  
  /**
   * Validates that a password meets the required strength criteria
   * 
   * @param password - Password to validate
   * @returns Object containing validation result and any error messages
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  };
}
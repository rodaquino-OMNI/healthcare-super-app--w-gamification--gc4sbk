import { JwtPayload } from '@austa/interfaces/auth';
import { AuthProvider } from '../auth-provider.interface';
import { PasswordHashOptions, PasswordStrengthOptions, PasswordStrengthResult } from './password-utils';

/**
 * Configuration options for database authentication providers
 */
export interface DatabaseAuthProviderOptions {
  /**
   * The Prisma model to use for user lookup
   * @default 'user'
   */
  userModel?: string;

  /**
   * The field to use as the username for authentication
   * @default 'email'
   */
  usernameField?: string;

  /**
   * The field that stores the password hash
   * @default 'password'
   */
  passwordField?: string;

  /**
   * Additional fields to select when retrieving the user
   * @default ['id', 'email', 'name']
   */
  selectFields?: string[];

  /**
   * Custom error messages
   */
  errorMessages?: {
    invalidCredentials?: string;
    userNotFound?: string;
    databaseError?: string;
  };

  /**
   * JWT token configuration
   */
  jwt?: {
    /**
     * Secret key for signing JWT tokens
     */
    secret?: string;

    /**
     * Expiration time for access tokens in seconds
     * @default 3600 (1 hour)
     */
    accessTokenExpiration?: number;

    /**
     * Expiration time for refresh tokens in seconds
     * @default 2592000 (30 days)
     */
    refreshTokenExpiration?: number;
  };
}

/**
 * Interface for database authentication providers in the AUSTA SuperApp.
 * Extends the base AuthProvider interface with database-specific methods.
 * 
 * This interface establishes a contract for credential validation, user retrieval,
 * and password verification operations that all database authentication implementations
 * must fulfill.
 * 
 * @typeParam TUser - The user model type that the provider will work with
 * @typeParam TCredentials - The credentials type used for authentication (defaults to email/password)
 */
export interface DatabaseAuthProvider<TUser, TCredentials = { email: string; password: string }>
  extends AuthProvider<TUser, TCredentials> {
  
  /**
   * Verifies if a plain text password matches a stored password hash
   * 
   * @param hash - The stored password hash
   * @param password - The plain text password to verify
   * @returns A promise that resolves to true if the password matches, false otherwise
   * @throws AppException with appropriate error code if verification fails
   */
  verifyPassword(hash: string, password: string): Promise<boolean>;

  /**
   * Hashes a plain text password using the configured algorithm
   * 
   * @param password - The plain text password to hash
   * @param options - Optional configuration for the hashing algorithm
   * @returns A promise that resolves to the generated password hash
   * @throws AppException with appropriate error code if hashing fails
   */
  hashPassword(password: string, options?: PasswordHashOptions): Promise<string>;

  /**
   * Validates the strength of a password against configurable requirements
   * 
   * @param password - The password to validate
   * @param options - Optional configuration for password strength requirements
   * @returns A result object with validation status, errors, and strength score
   */
  validatePasswordStrength(password: string, options?: PasswordStrengthOptions): PasswordStrengthResult;

  /**
   * Finds a user by a custom field value
   * 
   * @param field - The field name to search by
   * @param value - The value to search for
   * @returns A promise that resolves to the user if found, or null if not found
   * @throws AppException with appropriate error code if retrieval fails
   */
  findUserByField(field: string, value: any): Promise<TUser | null>;

  /**
   * Retrieves a user with their associated roles and permissions
   * 
   * @param userId - The unique identifier of the user to retrieve
   * @returns A promise that resolves to the user with roles and permissions if found, or null if not found
   * @throws AppException with appropriate error code if retrieval fails
   */
  findUserWithRoles(userId: string): Promise<TUser | null>;

  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - The unique identifier of the user
   * @param permission - The permission to check for
   * @returns A promise that resolves to true if the user has the permission, false otherwise
   * @throws AppException with appropriate error code if check fails
   */
  hasPermission(userId: string, permission: string): Promise<boolean>;

  /**
   * Checks if a user has a specific role
   * 
   * @param userId - The unique identifier of the user
   * @param role - The role to check for
   * @returns A promise that resolves to true if the user has the role, false otherwise
   * @throws AppException with appropriate error code if check fails
   */
  hasRole(userId: string, role: string): Promise<boolean>;

  /**
   * Retrieves the configuration options for this provider
   * 
   * @returns The current configuration options
   */
  getOptions(): DatabaseAuthProviderOptions;

  /**
   * Updates the configuration options for this provider
   * 
   * @param options - The new configuration options
   */
  setOptions(options: Partial<DatabaseAuthProviderOptions>): void;
}
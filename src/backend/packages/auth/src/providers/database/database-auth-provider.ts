/**
 * @file Database Authentication Provider
 * 
 * Implements the database authentication provider interface with functionality for
 * validating username/password credentials against database records. It handles user
 * lookup, password verification, and authentication error handling.
 *
 * @module @austa/auth/providers/database
 */

import { Injectable, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import from other @austa packages
import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';
import { JwtPayload } from '@austa/interfaces/auth';

// Import local utilities and interfaces
import { IAuthProvider } from '../auth-provider.interface';
import { verifyPassword, passwordNeedsRehash, hashPassword } from './password-utils';

/**
 * Error codes for authentication failures
 */
export enum AUTH_ERROR_CODES {
  INVALID_CREDENTIALS = 'auth/invalid-credentials',
  USER_NOT_FOUND = 'auth/user-not-found',
  ACCOUNT_DISABLED = 'auth/account-disabled',
  ACCOUNT_LOCKED = 'auth/account-locked',
  PASSWORD_EXPIRED = 'auth/password-expired',
  INVALID_TOKEN = 'auth/invalid-token',
  TOKEN_EXPIRED = 'auth/token-expired',
  INSUFFICIENT_PERMISSIONS = 'auth/insufficient-permissions',
  MFA_REQUIRED = 'auth/mfa-required',
  INTERNAL_ERROR = 'auth/internal-error',
}

/**
 * Configuration keys for authentication
 */
export enum CONFIG_KEYS {
  PASSWORD_MIN_LENGTH = 'AUTH_PASSWORD_MIN_LENGTH',
  PASSWORD_REQUIRE_UPPERCASE = 'AUTH_PASSWORD_REQUIRE_UPPERCASE',
  PASSWORD_REQUIRE_LOWERCASE = 'AUTH_PASSWORD_REQUIRE_LOWERCASE',
  PASSWORD_REQUIRE_NUMBER = 'AUTH_PASSWORD_REQUIRE_NUMBER',
  PASSWORD_REQUIRE_SPECIAL = 'AUTH_PASSWORD_REQUIRE_SPECIAL',
  PASSWORD_MAX_AGE = 'AUTH_PASSWORD_MAX_AGE',
  PASSWORD_HISTORY = 'AUTH_PASSWORD_HISTORY',
  TOKEN_SECRET = 'AUTH_TOKEN_SECRET',
  TOKEN_EXPIRATION = 'AUTH_TOKEN_EXPIRATION',
  REFRESH_TOKEN_EXPIRATION = 'AUTH_REFRESH_TOKEN_EXPIRATION',
  LOCKOUT_THRESHOLD = 'AUTH_LOCKOUT_THRESHOLD',
  LOCKOUT_DURATION = 'AUTH_LOCKOUT_DURATION',
}

/**
 * Configuration options for the database authentication provider
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
 * Default options for the database authentication provider
 */
const defaultOptions: DatabaseAuthProviderOptions = {
  userTable: 'users',
  usernameField: 'email',
  passwordField: 'password',
  caseInsensitiveMatch: true,
  selectFields: [],
  errorMessages: {
    invalidCredentials: 'Invalid username or password',
    userNotFound: 'User not found',
    accountDisabled: 'Account is disabled',
    accountLocked: 'Account is locked due to too many failed login attempts',
    passwordExpired: 'Password has expired and must be changed',
  },
};

/**
 * Credentials interface for database authentication
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
 * Database authentication provider that validates username/password credentials
 * against database records.
 * 
 * This provider integrates with PrismaService for database access and uses secure
 * password comparison functions from password-utils. The implementation allows
 * configuration of lookup fields and error messages.
 */
@Injectable()
export class DatabaseAuthProvider<TUser extends Record<string, any> = Record<string, any>>
  implements IAuthProvider<TUser, DatabaseCredentials> {
  
  private readonly options: DatabaseAuthProviderOptions;
  private readonly logger: LoggerService;
  
  /**
   * Creates a new DatabaseAuthProvider instance
   * 
   * @param prismaService - Prisma database service
   * @param loggerService - Logger service
   * @param options - Configuration options
   * @param configService - Configuration service
   */
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(LoggerService) loggerService: LoggerService,
    options?: DatabaseAuthProviderOptions,
    private readonly configService?: ConfigService,
  ) {
    this.options = { ...defaultOptions, ...options };
    this.logger = loggerService.createLogger('DatabaseAuthProvider');
    this.logger.debug('Initialized with options:', this.options);
  }
  
  /**
   * Validates user credentials against the database
   * 
   * @param credentials - User credentials (username/password)
   * @returns Promise resolving to the authenticated user or null if authentication fails
   */
  async validateCredentials(credentials: DatabaseCredentials): Promise<TUser | null> {
    try {
      const { username, password } = credentials;
      
      if (!username || !password) {
        this.logger.debug('Missing username or password');
        return null;
      }
      
      // Find the user in the database
      const user = await this.findUserByUsername(username);
      
      if (!user) {
        this.logger.debug(`User not found: ${username}`);
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: this.options.errorMessages?.userNotFound || defaultOptions.errorMessages?.userNotFound,
        });
      }
      
      // Check if the account is disabled
      if (user.disabled === true) {
        this.logger.debug(`Account disabled: ${username}`);
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.ACCOUNT_DISABLED,
          message: this.options.errorMessages?.accountDisabled || defaultOptions.errorMessages?.accountDisabled,
        });
      }
      
      // Check if the account is locked
      if (user.locked === true) {
        this.logger.debug(`Account locked: ${username}`);
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.ACCOUNT_LOCKED,
          message: this.options.errorMessages?.accountLocked || defaultOptions.errorMessages?.accountLocked,
        });
      }
      
      // Get the password field from the user object
      const passwordField = this.options.passwordField || defaultOptions.passwordField;
      const hashedPassword = user[passwordField];
      
      if (!hashedPassword) {
        this.logger.warn(`User ${username} has no password set`);
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: this.options.errorMessages?.invalidCredentials || defaultOptions.errorMessages?.invalidCredentials,
        });
      }
      
      // Verify the password
      const isPasswordValid = await verifyPassword(password, hashedPassword);
      
      if (!isPasswordValid) {
        this.logger.debug(`Invalid password for user: ${username}`);
        
        // Update failed login attempts if tracking is enabled
        if (user.failedLoginAttempts !== undefined) {
          await this.updateFailedLoginAttempts(user);
        }
        
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: this.options.errorMessages?.invalidCredentials || defaultOptions.errorMessages?.invalidCredentials,
        });
      }
      
      // Check if password needs rehashing with newer/stronger algorithm
      if (passwordNeedsRehash(hashedPassword)) {
        this.logger.debug(`Rehashing password for user: ${username}`);
        await this.updateUserPassword(user, password);
      }
      
      // Reset failed login attempts if tracking is enabled
      if (user.failedLoginAttempts !== undefined && user.failedLoginAttempts > 0) {
        await this.resetFailedLoginAttempts(user);
      }
      
      // Check if password has expired
      if (user.passwordUpdatedAt && this.isPasswordExpired(user.passwordUpdatedAt)) {
        this.logger.debug(`Password expired for user: ${username}`);
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.PASSWORD_EXPIRED,
          message: this.options.errorMessages?.passwordExpired || defaultOptions.errorMessages?.passwordExpired,
        });
      }
      
      // Update last login timestamp if tracking is enabled
      if (user.lastLoginAt !== undefined) {
        await this.updateLastLogin(user);
      }
      
      return user as TUser;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Error validating credentials:', error);
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.INTERNAL_ERROR,
        message: 'An internal error occurred during authentication',
      });
    }
  }
  
  /**
   * Validates a token and returns the associated user
   * 
   * @param token - Authentication token (JWT, session token, etc.)
   * @returns Promise resolving to the authenticated user or null if validation fails
   */
  async validateToken(token: string): Promise<TUser | null> {
    try {
      // This method would typically decode the JWT and validate it
      // For database auth provider, we delegate this to the JWT provider
      // This is just a placeholder implementation
      this.logger.debug('Token validation not implemented in database provider');
      return null;
    } catch (error) {
      this.logger.error('Error validating token:', error);
      return null;
    }
  }
  
  /**
   * Retrieves a user by their unique identifier
   * 
   * @param id - User identifier
   * @returns Promise resolving to the user or null if not found
   */
  async getUserById(id: string): Promise<TUser | null> {
    try {
      const userTable = this.options.userTable || defaultOptions.userTable;
      
      // Select fields to retrieve
      const selectFields = this.getSelectFields();
      
      // Find the user by ID
      const user = await this.prismaService[userTable].findUnique({
        where: { id },
        select: selectFields,
      });
      
      return user as TUser || null;
    } catch (error) {
      this.logger.error(`Error retrieving user by ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Generates a token for the authenticated user
   * 
   * @param user - Authenticated user
   * @param expiresIn - Token expiration time in seconds (optional)
   * @returns Promise resolving to the generated token
   */
  async generateToken(user: TUser, expiresIn?: number): Promise<string> {
    // This method would typically generate a JWT
    // For database auth provider, we delegate this to the JWT provider
    // This is just a placeholder implementation
    this.logger.debug('Token generation not implemented in database provider');
    return 'database-auth-provider-token-placeholder';
  }
  
  /**
   * Decodes a token and returns its payload without validation
   * 
   * @param token - Authentication token
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  async decodeToken(token: string): Promise<JwtPayload | null> {
    // This method would typically decode the JWT without validation
    // For database auth provider, we delegate this to the JWT provider
    // This is just a placeholder implementation
    this.logger.debug('Token decoding not implemented in database provider');
    return null;
  }
  
  /**
   * Extracts the token from the request
   * 
   * @param request - HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: any): string | null {
    // This method would typically extract the JWT from the Authorization header
    // For database auth provider, we delegate this to the JWT provider
    // This is just a placeholder implementation
    this.logger.debug('Token extraction not implemented in database provider');
    return null;
  }
  
  /**
   * Revokes a token, making it invalid for future authentication
   * 
   * @param token - Authentication token to revoke
   * @returns Promise resolving to true if revocation was successful, false otherwise
   */
  async revokeToken(token: string): Promise<boolean> {
    // This method would typically add the token to a blacklist or revoke it in the database
    // For database auth provider, we delegate this to the JWT provider
    // This is just a placeholder implementation
    this.logger.debug('Token revocation not implemented in database provider');
    return false;
  }
  
  /**
   * Refreshes an existing token and returns a new one
   * 
   * @param refreshToken - Refresh token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    // This method would typically validate the refresh token and generate a new access token
    // For database auth provider, we delegate this to the JWT provider
    // This is just a placeholder implementation
    this.logger.debug('Token refresh not implemented in database provider');
    return null;
  }
  
  /**
   * Finds a user by their username (email, username, etc.)
   * 
   * @param username - Username to search for
   * @returns Promise resolving to the user or null if not found
   * @private
   */
  private async findUserByUsername(username: string): Promise<Record<string, any> | null> {
    try {
      const userTable = this.options.userTable || defaultOptions.userTable;
      const usernameField = this.options.usernameField || defaultOptions.usernameField;
      const caseInsensitive = this.options.caseInsensitiveMatch ?? defaultOptions.caseInsensitiveMatch;
      
      // Select fields to retrieve
      const selectFields = this.getSelectFields();
      
      // Build the query based on case sensitivity
      let query: any;
      
      if (caseInsensitive) {
        // Case-insensitive query using Prisma's mode: 'insensitive' option
        query = {
          where: {
            [usernameField]: {
              equals: username,
              mode: 'insensitive',
            },
          },
          select: selectFields,
        };
      } else {
        // Case-sensitive query
        query = {
          where: {
            [usernameField]: username,
          },
          select: selectFields,
        };
      }
      
      // Execute the query
      const user = await this.prismaService[userTable].findFirst(query);
      
      return user || null;
    } catch (error) {
      this.logger.error(`Error finding user by username ${username}:`, error);
      return null;
    }
  }
  
  /**
   * Updates the user's password in the database
   * 
   * @param user - User object
   * @param newPassword - New password (plain text)
   * @returns Promise resolving to the updated user
   * @private
   */
  private async updateUserPassword(user: Record<string, any>, newPassword: string): Promise<void> {
    try {
      const userTable = this.options.userTable || defaultOptions.userTable;
      const passwordField = this.options.passwordField || defaultOptions.passwordField;
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password and password update timestamp
      await this.prismaService[userTable].update({
        where: { id: user.id },
        data: {
          [passwordField]: hashedPassword,
          passwordUpdatedAt: new Date(),
        },
      });
      
      this.logger.debug(`Password updated for user ID: ${user.id}`);
    } catch (error) {
      this.logger.error(`Error updating password for user ID ${user.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Updates the failed login attempts counter for a user
   * 
   * @param user - User object
   * @returns Promise resolving when the update is complete
   * @private
   */
  private async updateFailedLoginAttempts(user: Record<string, any>): Promise<void> {
    try {
      const userTable = this.options.userTable || defaultOptions.userTable;
      const currentAttempts = user.failedLoginAttempts || 0;
      const lockoutThreshold = this.getConfigNumber('AUTH_LOCKOUT_THRESHOLD', 5);
      
      // Increment failed login attempts
      const newAttempts = currentAttempts + 1;
      
      // Check if account should be locked
      const shouldLock = newAttempts >= lockoutThreshold;
      
      // Update the user record
      await this.prismaService[userTable].update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          locked: shouldLock ? true : user.locked,
          lockedAt: shouldLock ? new Date() : user.lockedAt,
        },
      });
      
      if (shouldLock) {
        this.logger.warn(`Account locked for user ID ${user.id} after ${newAttempts} failed login attempts`);
      } else {
        this.logger.debug(`Failed login attempts for user ID ${user.id}: ${newAttempts}`);
      }
    } catch (error) {
      this.logger.error(`Error updating failed login attempts for user ID ${user.id}:`, error);
    }
  }
  
  /**
   * Resets the failed login attempts counter for a user
   * 
   * @param user - User object
   * @returns Promise resolving when the update is complete
   * @private
   */
  private async resetFailedLoginAttempts(user: Record<string, any>): Promise<void> {
    try {
      const userTable = this.options.userTable || defaultOptions.userTable;
      
      // Reset failed login attempts
      await this.prismaService[userTable].update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
        },
      });
      
      this.logger.debug(`Reset failed login attempts for user ID: ${user.id}`);
    } catch (error) {
      this.logger.error(`Error resetting failed login attempts for user ID ${user.id}:`, error);
    }
  }
  
  /**
   * Updates the last login timestamp for a user
   * 
   * @param user - User object
   * @returns Promise resolving when the update is complete
   * @private
   */
  private async updateLastLogin(user: Record<string, any>): Promise<void> {
    try {
      const userTable = this.options.userTable || defaultOptions.userTable;
      
      // Update last login timestamp
      await this.prismaService[userTable].update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      });
      
      this.logger.debug(`Updated last login timestamp for user ID: ${user.id}`);
    } catch (error) {
      this.logger.error(`Error updating last login timestamp for user ID ${user.id}:`, error);
    }
  }
  
  /**
   * Checks if a password has expired based on the last update timestamp
   * 
   * @param passwordUpdatedAt - Timestamp when the password was last updated
   * @returns True if the password has expired, false otherwise
   * @private
   */
  private isPasswordExpired(passwordUpdatedAt: Date): boolean {
    // Get the maximum password age in days from configuration
    const maxAgeDays = this.getConfigNumber('AUTH_PASSWORD_MAX_AGE', 90);
    
    // If max age is 0 or negative, passwords never expire
    if (maxAgeDays <= 0) {
      return false;
    }
    
    // Calculate the expiration date
    const expirationDate = new Date(passwordUpdatedAt);
    expirationDate.setDate(expirationDate.getDate() + maxAgeDays);
    
    // Compare with current date
    return new Date() > expirationDate;
  }
  
  /**
   * Gets the fields to select from the user table
   * 
   * @returns Object with field selections
   * @private
   */
  private getSelectFields(): Record<string, boolean> {
    const passwordField = this.options.passwordField || defaultOptions.passwordField;
    const selectFields = this.options.selectFields || [];
    
    // Always include id and password field
    const fields: Record<string, boolean> = {
      id: true,
      [passwordField]: true,
    };
    
    // Add optional fields for account status tracking
    const optionalFields = [
      'disabled',
      'locked',
      'failedLoginAttempts',
      'lastLoginAt',
      'passwordUpdatedAt',
      'lockedAt',
    ];
    
    // Add all specified select fields
    for (const field of [...selectFields, ...optionalFields]) {
      fields[field] = true;
    }
    
    return fields;
  }
  
  /**
   * Gets a number from configuration
   * 
   * @param key - Configuration key
   * @param defaultValue - Default value if not found
   * @returns Number value from configuration
   * @private
   */
  private getConfigNumber(key: string, defaultValue: number): number {
    if (!this.configService) {
      return defaultValue;
    }
    
    const value = this.configService.get<number>(key);
    return value !== undefined ? value : defaultValue;
  }
  
  /**
   * Gets a boolean from configuration
   * 
   * @param key - Configuration key
   * @param defaultValue - Default value if not found
   * @returns Boolean value from configuration
   * @private
   */
  private getConfigBoolean(key: string, defaultValue: boolean): boolean {
    if (!this.configService) {
      return defaultValue;
    }
    
    const value = this.configService.get<boolean>(key);
    return value !== undefined ? value : defaultValue;
  }
  
  /**
   * Gets a string from configuration
   * 
   * @param key - Configuration key
   * @param defaultValue - Default value if not found
   * @returns String value from configuration
   * @private
   */
  private getConfigString(key: string, defaultValue: string): string {
    if (!this.configService) {
      return defaultValue;
    }
    
    const value = this.configService.get<string>(key);
    return value !== undefined ? value : defaultValue;
  }
}
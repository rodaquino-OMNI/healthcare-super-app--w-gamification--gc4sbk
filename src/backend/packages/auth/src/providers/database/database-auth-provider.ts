/**
 * Database Authentication Provider
 * 
 * Implements the authentication provider interface with functionality for validating
 * username/password credentials against database records. It handles user lookup,
 * password verification, and authentication error handling.
 * 
 * This provider integrates with PrismaService for database access and uses secure
 * password comparison functions from password-utils.
 */

import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, User } from '@prisma/client';
import { JwtPayload } from '@austa/interfaces/auth';

import { AuthProvider } from '../auth-provider.interface';
import { verifyPassword } from './password-utils';

// Import error types from the errors package
import { 
  InvalidCredentialsError,
  ResourceNotFoundError,
  DatabaseError,
  UnauthorizedError
} from '@austa/errors';

/**
 * Configuration options for the database authentication provider
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
 * Default configuration for the database authentication provider
 */
const DEFAULT_OPTIONS: DatabaseAuthProviderOptions = {
  userModel: 'user',
  usernameField: 'email',
  passwordField: 'password',
  selectFields: ['id', 'email', 'name'],
  errorMessages: {
    invalidCredentials: 'Invalid email or password',
    userNotFound: 'User not found',
    databaseError: 'Database error occurred during authentication',
  },
  jwt: {
    accessTokenExpiration: 3600, // 1 hour
    refreshTokenExpiration: 2592000, // 30 days
  },
};

/**
 * Database Authentication Provider
 * 
 * Implements authentication against database records using Prisma ORM.
 * Supports configurable user lookup fields and secure password verification.
 */
@Injectable()
export class DatabaseAuthProvider<TUser extends User = User> implements AuthProvider<TUser> {
  private readonly logger = new Logger(DatabaseAuthProvider.name);
  private readonly options: DatabaseAuthProviderOptions;

  constructor(
    @Inject('PRISMA') private readonly prisma: PrismaClient,
    @Optional() @Inject('JWT_SERVICE') private readonly jwtService: JwtService,
    @Optional() @Inject('AUTH_OPTIONS') options?: DatabaseAuthProviderOptions,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.logger.log('Database authentication provider initialized');
  }

  /**
   * Validates user credentials against database records
   * 
   * @param credentials - User credentials (email/password)
   * @returns The authenticated user if credentials are valid, null otherwise
   * @throws InvalidCredentialsError if credentials are invalid
   * @throws DatabaseError if a database error occurs
   */
  async validateCredentials(credentials: { email: string; password: string }): Promise<TUser | null> {
    const { email, password } = credentials;
    const { usernameField, passwordField, userModel, selectFields, errorMessages } = this.options;

    try {
      // Build the query dynamically based on configuration
      const where = { [usernameField]: email };
      const select = selectFields.reduce((acc, field) => ({ ...acc, [field]: true }), {
        [passwordField]: true, // Always include the password field for verification
      });

      // Retrieve the user from the database
      const user = await this.prisma[userModel].findUnique({
        where,
        select,
      }) as TUser & { [key: string]: any };

      // If user not found, return null
      if (!user) {
        this.logger.debug(`User not found: ${email}`);
        return null;
      }

      // Verify the password
      const passwordHash = user[passwordField];
      const isPasswordValid = await verifyPassword(passwordHash, password);

      if (!isPasswordValid) {
        this.logger.debug(`Invalid password for user: ${email}`);
        throw new InvalidCredentialsError(errorMessages.invalidCredentials);
      }

      // Remove the password hash from the returned user object
      const { [passwordField]: _, ...userWithoutPassword } = user;

      return userWithoutPassword as unknown as TUser;
    } catch (error) {
      // If the error is already an AppError, rethrow it
      if (error instanceof InvalidCredentialsError) {
        throw error;
      }

      // Log the error and throw a database error
      this.logger.error(`Database error during authentication: ${error.message}`, error.stack);
      throw new DatabaseError(
        errorMessages.databaseError,
        { originalError: error.message }
      );
    }
  }

  /**
   * Validates a JWT token and returns the associated user
   * 
   * @param payload - The decoded JWT payload
   * @returns The authenticated user if token is valid, null otherwise
   * @throws UnauthorizedError if token is invalid
   * @throws DatabaseError if a database error occurs
   */
  async validateToken(payload: JwtPayload): Promise<TUser | null> {
    const { sub: userId } = payload;
    const { userModel, selectFields, errorMessages } = this.options;

    try {
      // Build the query dynamically based on configuration
      const select = selectFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});

      // Retrieve the user from the database
      const user = await this.prisma[userModel].findUnique({
        where: { id: userId },
        select,
      }) as TUser;

      if (!user) {
        this.logger.debug(`User not found for token validation: ${userId}`);
        return null;
      }

      return user;
    } catch (error) {
      // Log the error and throw a database error
      this.logger.error(`Database error during token validation: ${error.message}`, error.stack);
      throw new DatabaseError(
        errorMessages.databaseError,
        { originalError: error.message }
      );
    }
  }

  /**
   * Retrieves a user by their unique identifier
   * 
   * @param userId - The unique identifier of the user
   * @returns The user if found, null otherwise
   * @throws DatabaseError if a database error occurs
   */
  async findUserById(userId: string): Promise<TUser | null> {
    const { userModel, selectFields, errorMessages } = this.options;

    try {
      // Build the query dynamically based on configuration
      const select = selectFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});

      // Retrieve the user from the database
      const user = await this.prisma[userModel].findUnique({
        where: { id: userId },
        select,
      }) as TUser;

      return user || null;
    } catch (error) {
      // Log the error and throw a database error
      this.logger.error(`Database error retrieving user by ID: ${error.message}`, error.stack);
      throw new DatabaseError(
        errorMessages.databaseError,
        { originalError: error.message, userId }
      );
    }
  }

  /**
   * Retrieves a user by their email address
   * 
   * @param email - The email address of the user
   * @returns The user if found, null otherwise
   * @throws DatabaseError if a database error occurs
   */
  async findUserByEmail(email: string): Promise<TUser | null> {
    const { userModel, usernameField, selectFields, errorMessages } = this.options;

    try {
      // Build the query dynamically based on configuration
      const where = { [usernameField]: email };
      const select = selectFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});

      // Retrieve the user from the database
      const user = await this.prisma[userModel].findUnique({
        where,
        select,
      }) as TUser;

      return user || null;
    } catch (error) {
      // Log the error and throw a database error
      this.logger.error(`Database error retrieving user by email: ${error.message}`, error.stack);
      throw new DatabaseError(
        errorMessages.databaseError,
        { originalError: error.message, email }
      );
    }
  }

  /**
   * Creates a new access token for the authenticated user
   * 
   * @param user - The user for whom to create the token
   * @returns The generated access token
   * @throws Error if JWT service is not available
   */
  async createAccessToken(user: TUser): Promise<string> {
    if (!this.jwtService) {
      throw new Error('JWT service is not available. Make sure it is properly injected.');
    }

    const { jwt } = this.options;
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || [],
    };

    return this.jwtService.sign(payload, {
      expiresIn: jwt.accessTokenExpiration,
      secret: jwt.secret,
    });
  }

  /**
   * Creates a new refresh token for the authenticated user
   * 
   * @param user - The user for whom to create the token
   * @returns The generated refresh token
   * @throws Error if JWT service is not available
   */
  async createRefreshToken(user: TUser): Promise<string> {
    if (!this.jwtService) {
      throw new Error('JWT service is not available. Make sure it is properly injected.');
    }

    const { jwt } = this.options;
    const payload: JwtPayload = {
      sub: user.id,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      expiresIn: jwt.refreshTokenExpiration,
      secret: jwt.secret,
    });
  }

  /**
   * Validates a refresh token and returns a new access token
   * 
   * @param refreshToken - The refresh token to validate
   * @returns A new access token if the refresh token is valid, null otherwise
   * @throws UnauthorizedError if token is invalid
   * @throws DatabaseError if a database error occurs
   */
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    if (!this.jwtService) {
      throw new Error('JWT service is not available. Make sure it is properly injected.');
    }

    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.options.jwt.secret,
      }) as JwtPayload;

      // Check if it's a refresh token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      // Get the user from the database
      const user = await this.findUserById(payload.sub);
      if (!user) {
        return null;
      }

      // Generate a new access token
      return this.createAccessToken(user);
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }
      throw error;
    }
  }

  /**
   * Revokes all active tokens for a user
   * 
   * @param userId - The unique identifier of the user
   * @returns A promise that resolves when the operation is complete
   * @throws DatabaseError if a database error occurs
   * 
   * Note: This implementation assumes a token blacklist table in the database.
   * If your application uses a different approach for token revocation,
   * this method should be overridden.
   */
  async revokeTokens(userId: string): Promise<void> {
    try {
      // This is a simplified implementation that assumes a token blacklist table
      // In a real application, you might use Redis or another mechanism for token blacklisting
      if (this.prisma['tokenBlacklist']) {
        await this.prisma['tokenBlacklist'].create({
          data: {
            userId,
            revokedAt: new Date(),
          },
        });
      } else {
        this.logger.warn('Token blacklist table not found. Token revocation may not be effective.');
      }
    } catch (error) {
      this.logger.error(`Error revoking tokens for user ${userId}: ${error.message}`, error.stack);
      throw new DatabaseError(
        'Failed to revoke tokens',
        { originalError: error.message, userId }
      );
    }
  }
}
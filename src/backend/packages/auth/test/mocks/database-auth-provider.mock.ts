/**
 * Mock implementation of the DatabaseAuthProvider
 * 
 * This mock simulates credential validation and user retrieval without database dependencies.
 * It enables testing of authentication flows that depend on database validation while
 * maintaining isolation from actual database services.
 */

import { Injectable, Logger } from '@nestjs/common';

// Import the interfaces we need to implement
import { AuthProvider } from '../../src/providers/auth-provider.interface';

// Import error types from the errors package
import { 
  InvalidCredentialsError,
  ResourceNotFoundError,
  DatabaseError,
  UnauthorizedError
} from '@austa/errors';

/**
 * JwtPayload interface based on usage in the real implementation
 */
export interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  roles?: string[];
  type?: string;
}

/**
 * Mock User type based on Prisma User model
 */
export interface MockUser {
  id: string;
  email: string;
  name: string;
  password: string;
  roles?: string[];
  [key: string]: any; // Allow for additional properties
}

/**
 * Configuration options for the mock database auth provider
 */
export interface MockDatabaseAuthProviderOptions {
  /**
   * Predefined users for testing
   */
  users?: MockUser[];

  /**
   * Whether to simulate database errors
   */
  simulateErrors?: boolean;

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
 * Default configuration for the mock database auth provider
 */
const DEFAULT_OPTIONS: MockDatabaseAuthProviderOptions = {
  users: [
    {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password_123', // Simulated hashed password
      roles: ['user']
    },
    {
      id: '2',
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'hashed_admin_password_456', // Simulated hashed password
      roles: ['admin', 'user']
    }
  ],
  simulateErrors: false,
  errorMessages: {
    invalidCredentials: 'Invalid email or password',
    userNotFound: 'User not found',
    databaseError: 'Database error occurred during authentication',
  },
  jwt: {
    secret: 'test-secret-key',
    accessTokenExpiration: 3600, // 1 hour
    refreshTokenExpiration: 2592000, // 30 days
  },
};

/**
 * Mock Database Authentication Provider
 * 
 * Simulates authentication against database records without actual database dependencies.
 * Supports configurable user data and authentication responses for testing.
 */
@Injectable()
export class MockDatabaseAuthProvider<TUser extends MockUser = MockUser> implements AuthProvider<TUser> {
  private readonly logger = new Logger(MockDatabaseAuthProvider.name);
  private readonly options: MockDatabaseAuthProviderOptions;
  private users: MockUser[];
  private tokenBlacklist: Set<string> = new Set();
  private refreshTokens: Map<string, string> = new Map(); // userId -> refreshToken

  constructor(options?: MockDatabaseAuthProviderOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.users = [...(this.options.users || [])];
    this.logger.log('Mock database authentication provider initialized');
  }

  /**
   * Adds a test user to the mock database
   * 
   * @param user - The user to add
   * @returns The added user
   */
  addUser(user: MockUser): MockUser {
    // Check if user with this email already exists
    const existingUserIndex = this.users.findIndex(u => u.email === user.email);
    if (existingUserIndex >= 0) {
      this.users[existingUserIndex] = { ...user };
      return this.users[existingUserIndex];
    }

    // Add new user
    this.users.push({ ...user });
    return user;
  }

  /**
   * Clears all test users
   */
  clearUsers(): void {
    this.users = [];
  }

  /**
   * Resets the mock to default state
   */
  reset(): void {
    this.users = [...(DEFAULT_OPTIONS.users || [])];
    this.tokenBlacklist.clear();
    this.refreshTokens.clear();
  }

  /**
   * Simulates password verification without actual hashing
   * 
   * @param storedHash - The stored password hash
   * @param plainPassword - The plain text password to verify
   * @returns True if the password is valid, false otherwise
   */
  private async verifyPassword(storedHash: string, plainPassword: string): Promise<boolean> {
    // For testing purposes, we'll use a simple pattern to simulate password verification
    // In a real implementation, this would use bcrypt or another secure hashing algorithm
    
    // For our mock, we'll consider a password valid if:
    // 1. The stored hash starts with 'hashed_' and ends with the plain password
    // 2. Or if the stored hash is exactly equal to the plain password (for simple test cases)
    
    return storedHash === plainPassword || 
           (storedHash.startsWith('hashed_') && storedHash.endsWith(plainPassword));
  }

  /**
   * Validates user credentials against mock database records
   * 
   * @param credentials - User credentials (email/password)
   * @returns The authenticated user if credentials are valid, null otherwise
   * @throws InvalidCredentialsError if credentials are invalid
   * @throws DatabaseError if a database error occurs
   */
  async validateCredentials(credentials: { email: string; password: string }): Promise<TUser | null> {
    const { email, password } = credentials;
    const { errorMessages, simulateErrors } = this.options;

    try {
      // Simulate database error if configured
      if (simulateErrors) {
        throw new Error('Simulated database error');
      }

      // Find user by email
      const user = this.users.find(u => u.email === email);

      // If user not found, return null
      if (!user) {
        this.logger.debug(`User not found: ${email}`);
        return null;
      }

      // Verify the password
      const isPasswordValid = await this.verifyPassword(user.password, password);

      if (!isPasswordValid) {
        this.logger.debug(`Invalid password for user: ${email}`);
        throw new InvalidCredentialsError(errorMessages.invalidCredentials);
      }

      // Remove the password hash from the returned user object
      const { password: _, ...userWithoutPassword } = user;

      return userWithoutPassword as unknown as TUser;
    } catch (error) {
      // If the error is already an InvalidCredentialsError, rethrow it
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
    const { errorMessages, simulateErrors } = this.options;

    try {
      // Simulate database error if configured
      if (simulateErrors) {
        throw new Error('Simulated database error');
      }

      // Check if the token is blacklisted
      if (this.tokenBlacklist.has(userId)) {
        throw new UnauthorizedError('Token has been revoked');
      }

      // Find user by ID
      const user = this.users.find(u => u.id === userId);

      if (!user) {
        this.logger.debug(`User not found for token validation: ${userId}`);
        return null;
      }

      // Remove the password hash from the returned user object
      const { password: _, ...userWithoutPassword } = user;

      return userWithoutPassword as unknown as TUser;
    } catch (error) {
      // If the error is already an UnauthorizedError, rethrow it
      if (error instanceof UnauthorizedError) {
        throw error;
      }

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
    const { errorMessages, simulateErrors } = this.options;

    try {
      // Simulate database error if configured
      if (simulateErrors) {
        throw new Error('Simulated database error');
      }

      // Find user by ID
      const user = this.users.find(u => u.id === userId);

      if (!user) {
        return null;
      }

      // Remove the password hash from the returned user object
      const { password: _, ...userWithoutPassword } = user;

      return userWithoutPassword as unknown as TUser;
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
    const { errorMessages, simulateErrors } = this.options;

    try {
      // Simulate database error if configured
      if (simulateErrors) {
        throw new Error('Simulated database error');
      }

      // Find user by email
      const user = this.users.find(u => u.email === email);

      if (!user) {
        return null;
      }

      // Remove the password hash from the returned user object
      const { password: _, ...userWithoutPassword } = user;

      return userWithoutPassword as unknown as TUser;
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
   */
  async createAccessToken(user: TUser): Promise<string> {
    // In a real implementation, this would use JWT to sign a token
    // For our mock, we'll create a simple string representation
    
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || [],
    };

    // Create a simple token format for testing
    // Format: access_token:{userId}:{expiration}
    const expiration = Date.now() + (this.options.jwt.accessTokenExpiration * 1000);
    return `access_token:${user.id}:${expiration}`;
  }

  /**
   * Creates a new refresh token for the authenticated user
   * 
   * @param user - The user for whom to create the token
   * @returns The generated refresh token
   */
  async createRefreshToken(user: TUser): Promise<string> {
    // In a real implementation, this would use JWT to sign a token
    // For our mock, we'll create a simple string representation
    
    const payload: JwtPayload = {
      sub: user.id,
      type: 'refresh',
    };

    // Create a simple token format for testing
    // Format: refresh_token:{userId}:{expiration}
    const expiration = Date.now() + (this.options.jwt.refreshTokenExpiration * 1000);
    const refreshToken = `refresh_token:${user.id}:${expiration}`;
    
    // Store the refresh token for this user
    this.refreshTokens.set(user.id, refreshToken);
    
    return refreshToken;
  }

  /**
   * Validates a refresh token and returns a new access token
   * 
   * @param refreshToken - The refresh token to validate
   * @returns A new access token if the refresh token is valid, null otherwise
   * @throws UnauthorizedError if token is invalid
   */
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      // Parse the token to extract user ID and expiration
      // Format: refresh_token:{userId}:{expiration}
      const parts = refreshToken.split(':');
      if (parts.length !== 3 || parts[0] !== 'refresh_token') {
        throw new UnauthorizedError('Invalid token format');
      }

      const userId = parts[1];
      const expiration = parseInt(parts[2], 10);

      // Check if token is expired
      if (Date.now() > expiration) {
        throw new UnauthorizedError('Token expired');
      }

      // Check if token is blacklisted
      if (this.tokenBlacklist.has(userId)) {
        throw new UnauthorizedError('Token has been revoked');
      }

      // Check if this is the current refresh token for this user
      const storedToken = this.refreshTokens.get(userId);
      if (storedToken !== refreshToken) {
        throw new UnauthorizedError('Token has been superseded');
      }

      // Get the user from the database
      const user = await this.findUserById(userId);
      if (!user) {
        return null;
      }

      // Generate a new access token
      return this.createAccessToken(user);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Revokes all active tokens for a user
   * 
   * @param userId - The unique identifier of the user
   * @returns A promise that resolves when the operation is complete
   */
  async revokeTokens(userId: string): Promise<void> {
    try {
      // Add the user ID to the blacklist
      this.tokenBlacklist.add(userId);
      
      // Remove any stored refresh tokens
      this.refreshTokens.delete(userId);
    } catch (error) {
      this.logger.error(`Error revoking tokens for user ${userId}: ${error.message}`, error.stack);
      throw new DatabaseError(
        'Failed to revoke tokens',
        { originalError: error.message, userId }
      );
    }
  }
}
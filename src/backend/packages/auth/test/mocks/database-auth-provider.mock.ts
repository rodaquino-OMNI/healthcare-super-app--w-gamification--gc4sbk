/**
 * @file Database Auth Provider Mock
 * 
 * Mock implementation of the DatabaseAuthProvider that simulates credential validation
 * and user retrieval without database dependencies. This mock enables testing of
 * authentication flows that depend on database validation while maintaining isolation
 * from actual database services.
 *
 * @module @austa/auth/test/mocks
 */

import { JwtPayload } from '@austa/interfaces/auth';
import { DatabaseCredentials, IDatabaseAuthProvider } from '../../src/providers/database/database-auth-provider.interface';

/**
 * Configuration options for the mock database auth provider
 */
export interface MockDatabaseAuthProviderOptions {
  /**
   * Predefined users for testing
   */
  users?: Record<string, any>[];
  
  /**
   * Whether to simulate successful authentication
   * @default true
   */
  simulateSuccessfulAuth?: boolean;
  
  /**
   * Whether to simulate account locking after failed attempts
   * @default false
   */
  simulateAccountLocking?: boolean;
  
  /**
   * Number of failed attempts before account is locked
   * @default 3
   */
  lockoutThreshold?: number;
  
  /**
   * Whether to simulate password expiration
   * @default false
   */
  simulatePasswordExpiration?: boolean;
  
  /**
   * Whether to simulate disabled accounts
   * @default false
   */
  simulateDisabledAccounts?: boolean;
  
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
 * Default options for the mock database auth provider
 */
const defaultOptions: MockDatabaseAuthProviderOptions = {
  users: [],
  simulateSuccessfulAuth: true,
  simulateAccountLocking: false,
  lockoutThreshold: 3,
  simulatePasswordExpiration: false,
  simulateDisabledAccounts: false,
  errorMessages: {
    invalidCredentials: 'Invalid username or password',
    userNotFound: 'User not found',
    accountDisabled: 'Account is disabled',
    accountLocked: 'Account is locked due to too many failed login attempts',
    passwordExpired: 'Password has expired and must be changed',
  },
};

/**
 * Mock implementation of the DatabaseAuthProvider for testing purposes.
 * 
 * This mock simulates database authentication without actual database dependencies,
 * allowing tests to verify authentication flows in isolation. It supports configurable
 * responses to test different authentication scenarios.
 * 
 * @template TUser The user entity type
 */
export class MockDatabaseAuthProvider<TUser extends Record<string, any> = Record<string, any>>
  implements IDatabaseAuthProvider<TUser, DatabaseCredentials> {
  
  private options: MockDatabaseAuthProviderOptions;
  private users: Map<string, TUser>;
  private usernameToIdMap: Map<string, string>;
  private failedAttempts: Map<string, number>;
  private lockedAccounts: Set<string>;
  private lastLoginTimestamps: Map<string, Date>;
  
  // Tracking for test verification
  public methodCalls: {
    validateCredentials: number;
    findUserByUsername: number;
    verifyUserPassword: number;
    updateUserPassword: number;
    isAccountLocked: number;
    isAccountDisabled: number;
    isPasswordExpired: number;
    recordFailedLoginAttempt: number;
    resetFailedLoginAttempts: number;
    updateLastLogin: number;
    lockUserAccount: number;
    unlockUserAccount: number;
    validatePasswordStrength: number;
    getUserById: number;
    validateToken: number;
    generateToken: number;
    decodeToken: number;
    extractTokenFromRequest: number;
    revokeToken: number;
    refreshToken: number;
  };
  
  /**
   * Creates a new MockDatabaseAuthProvider instance
   * 
   * @param options - Configuration options
   */
  constructor(options?: MockDatabaseAuthProviderOptions) {
    this.options = { ...defaultOptions, ...options };
    this.users = new Map<string, TUser>();
    this.usernameToIdMap = new Map<string, string>();
    this.failedAttempts = new Map<string, number>();
    this.lockedAccounts = new Set<string>();
    this.lastLoginTimestamps = new Map<string, Date>();
    
    // Initialize method call tracking
    this.methodCalls = {
      validateCredentials: 0,
      findUserByUsername: 0,
      verifyUserPassword: 0,
      updateUserPassword: 0,
      isAccountLocked: 0,
      isAccountDisabled: 0,
      isPasswordExpired: 0,
      recordFailedLoginAttempt: 0,
      resetFailedLoginAttempts: 0,
      updateLastLogin: 0,
      lockUserAccount: 0,
      unlockUserAccount: 0,
      validatePasswordStrength: 0,
      getUserById: 0,
      validateToken: 0,
      generateToken: 0,
      decodeToken: 0,
      extractTokenFromRequest: 0,
      revokeToken: 0,
      refreshToken: 0,
    };
    
    // Initialize with predefined users
    if (this.options.users && this.options.users.length > 0) {
      this.options.users.forEach(user => {
        if (user.id && user.email) {
          this.users.set(user.id, user as TUser);
          this.usernameToIdMap.set(user.email.toLowerCase(), user.id);
        }
      });
    } else {
      // Add a default test user if none provided
      const defaultUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed_password_123',
        name: 'Test User',
        roles: ['user'],
        disabled: false,
        locked: false,
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        passwordUpdatedAt: new Date(),
      } as unknown as TUser;
      
      this.users.set('1', defaultUser);
      this.usernameToIdMap.set('test@example.com', '1');
    }
  }
  
  /**
   * Adds a test user to the mock provider
   * 
   * @param user - User object to add
   * @returns The added user
   */
  addUser(user: TUser): TUser {
    if (!user.id) {
      throw new Error('User must have an id property');
    }
    
    if (!user.email) {
      throw new Error('User must have an email property');
    }
    
    this.users.set(user.id, { ...user });
    this.usernameToIdMap.set(user.email.toLowerCase(), user.id);
    return user;
  }
  
  /**
   * Clears all test users from the mock provider
   */
  clearUsers(): void {
    this.users.clear();
    this.usernameToIdMap.clear();
    this.failedAttempts.clear();
    this.lockedAccounts.clear();
    this.lastLoginTimestamps.clear();
  }
  
  /**
   * Resets all method call counters
   */
  resetMethodCalls(): void {
    Object.keys(this.methodCalls).forEach(key => {
      this.methodCalls[key as keyof typeof this.methodCalls] = 0;
    });
  }
  
  /**
   * Updates the configuration options
   * 
   * @param options - New configuration options
   */
  updateOptions(options: Partial<MockDatabaseAuthProviderOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Validates user credentials
   * 
   * @param credentials - User credentials (username/password)
   * @returns Promise resolving to the authenticated user or null if authentication fails
   */
  async validateCredentials(credentials: DatabaseCredentials): Promise<TUser | null> {
    this.methodCalls.validateCredentials++;
    
    const { username, password } = credentials;
    
    if (!username || !password) {
      return null;
    }
    
    // Find the user
    const user = await this.findUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    // Check if account is disabled
    if (this.isAccountDisabled(user)) {
      return null;
    }
    
    // Check if account is locked
    if (this.isAccountLocked(user)) {
      return null;
    }
    
    // Verify password
    const isPasswordValid = await this.verifyUserPassword(password, user);
    
    if (!isPasswordValid) {
      // Record failed login attempt
      await this.recordFailedLoginAttempt(user.id);
      return null;
    }
    
    // Check if password is expired
    if (this.isPasswordExpired(user)) {
      return null;
    }
    
    // Reset failed login attempts
    await this.resetFailedLoginAttempts(user.id);
    
    // Update last login timestamp
    await this.updateLastLogin(user.id);
    
    return user;
  }
  
  /**
   * Finds a user by their username (email, username, etc.)
   * 
   * @param username - Username to search for
   * @returns Promise resolving to the user or null if not found
   */
  async findUserByUsername(username: string): Promise<TUser | null> {
    this.methodCalls.findUserByUsername++;
    
    const lowercaseUsername = username.toLowerCase();
    const userId = this.usernameToIdMap.get(lowercaseUsername);
    
    if (!userId) {
      return null;
    }
    
    return this.users.get(userId) || null;
  }
  
  /**
   * Verifies a password against a user's stored password hash
   * 
   * @param plainPassword - Plain text password to verify
   * @param user - User object containing the hashed password
   * @returns Promise resolving to true if the password is valid, false otherwise
   */
  async verifyUserPassword(plainPassword: string, user: TUser): Promise<boolean> {
    this.methodCalls.verifyUserPassword++;
    
    // In a real implementation, this would use a secure password comparison
    // For the mock, we can simulate success or failure based on configuration
    if (!this.options.simulateSuccessfulAuth) {
      return false;
    }
    
    // For testing specific passwords, we can add logic here
    // For example, only 'correct_password' is valid
    return plainPassword === 'correct_password' || plainPassword === 'test_password';
  }
  
  /**
   * Updates a user's password in the database
   * 
   * @param userId - User identifier
   * @param newPassword - New password (plain text)
   * @returns Promise resolving to true if the update was successful, false otherwise
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    this.methodCalls.updateUserPassword++;
    
    const user = this.users.get(userId);
    
    if (!user) {
      return false;
    }
    
    // Update the password (in a real implementation, this would hash the password)
    const updatedUser = {
      ...user,
      password: `hashed_${newPassword}`,
      passwordUpdatedAt: new Date(),
    };
    
    this.users.set(userId, updatedUser);
    return true;
  }
  
  /**
   * Checks if a user account is locked due to too many failed login attempts
   * 
   * @param user - User object
   * @returns True if the account is locked, false otherwise
   */
  isAccountLocked(user: TUser): boolean {
    this.methodCalls.isAccountLocked++;
    
    if (!this.options.simulateAccountLocking) {
      return false;
    }
    
    return this.lockedAccounts.has(user.id) || Boolean(user.locked);
  }
  
  /**
   * Checks if a user account is disabled/inactive
   * 
   * @param user - User object
   * @returns True if the account is disabled, false otherwise
   */
  isAccountDisabled(user: TUser): boolean {
    this.methodCalls.isAccountDisabled++;
    
    if (!this.options.simulateDisabledAccounts) {
      return false;
    }
    
    return Boolean(user.disabled);
  }
  
  /**
   * Checks if a user's password has expired and needs to be changed
   * 
   * @param user - User object
   * @returns True if the password has expired, false otherwise
   */
  isPasswordExpired(user: TUser): boolean {
    this.methodCalls.isPasswordExpired++;
    
    if (!this.options.simulatePasswordExpiration) {
      return false;
    }
    
    // In a real implementation, this would check the password age
    // For the mock, we can use a property on the user object
    return Boolean(user.passwordExpired);
  }
  
  /**
   * Records a failed login attempt for a user
   * 
   * @param userId - User identifier
   * @returns Promise resolving to the updated number of failed attempts
   */
  async recordFailedLoginAttempt(userId: string): Promise<number> {
    this.methodCalls.recordFailedLoginAttempt++;
    
    const currentAttempts = this.failedAttempts.get(userId) || 0;
    const newAttempts = currentAttempts + 1;
    this.failedAttempts.set(userId, newAttempts);
    
    // Check if account should be locked
    if (this.options.simulateAccountLocking && newAttempts >= (this.options.lockoutThreshold || 3)) {
      await this.lockUserAccount(userId);
    }
    
    return newAttempts;
  }
  
  /**
   * Resets the failed login attempts counter for a user
   * 
   * @param userId - User identifier
   * @returns Promise resolving when the reset is complete
   */
  async resetFailedLoginAttempts(userId: string): Promise<void> {
    this.methodCalls.resetFailedLoginAttempts++;
    this.failedAttempts.set(userId, 0);
  }
  
  /**
   * Updates the last login timestamp for a user
   * 
   * @param userId - User identifier
   * @returns Promise resolving when the update is complete
   */
  async updateLastLogin(userId: string): Promise<void> {
    this.methodCalls.updateLastLogin++;
    this.lastLoginTimestamps.set(userId, new Date());
    
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = {
        ...user,
        lastLoginAt: new Date(),
      };
      this.users.set(userId, updatedUser);
    }
  }
  
  /**
   * Locks a user account, preventing further login attempts
   * 
   * @param userId - User identifier
   * @param reason - Reason for locking the account (optional)
   * @returns Promise resolving when the account is locked
   */
  async lockUserAccount(userId: string, reason?: string): Promise<void> {
    this.methodCalls.lockUserAccount++;
    this.lockedAccounts.add(userId);
    
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = {
        ...user,
        locked: true,
        lockedAt: new Date(),
        lockReason: reason || 'Too many failed login attempts',
      };
      this.users.set(userId, updatedUser);
    }
  }
  
  /**
   * Unlocks a previously locked user account
   * 
   * @param userId - User identifier
   * @returns Promise resolving when the account is unlocked
   */
  async unlockUserAccount(userId: string): Promise<void> {
    this.methodCalls.unlockUserAccount++;
    this.lockedAccounts.delete(userId);
    
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = {
        ...user,
        locked: false,
        lockedAt: undefined,
        lockReason: undefined,
      };
      this.users.set(userId, updatedUser);
    }
  }
  
  /**
   * Validates that a password meets the required strength criteria
   * 
   * @param password - Password to validate
   * @returns Object containing validation result and any error messages
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    this.methodCalls.validatePasswordStrength++;
    
    const errors: string[] = [];
    
    // Simple password validation for testing
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Retrieves a user by their unique identifier
   * 
   * @param id - User identifier
   * @returns Promise resolving to the user or null if not found
   */
  async getUserById(id: string): Promise<TUser | null> {
    this.methodCalls.getUserById++;
    return this.users.get(id) || null;
  }
  
  /**
   * Validates a token and returns the associated user
   * 
   * @param token - Authentication token (JWT, session token, etc.)
   * @returns Promise resolving to the authenticated user or null if validation fails
   */
  async validateToken(token: string): Promise<TUser | null> {
    this.methodCalls.validateToken++;
    
    // For testing purposes, we can use a simple token format: 'user_id:timestamp'
    const parts = token.split(':');
    if (parts.length !== 2) {
      return null;
    }
    
    const userId = parts[0];
    return this.users.get(userId) || null;
  }
  
  /**
   * Generates a token for the authenticated user
   * 
   * @param user - Authenticated user
   * @param expiresIn - Token expiration time in seconds (optional)
   * @returns Promise resolving to the generated token
   */
  async generateToken(user: TUser, expiresIn?: number): Promise<string> {
    this.methodCalls.generateToken++;
    
    // For testing purposes, we can use a simple token format: 'user_id:timestamp'
    const timestamp = Date.now();
    return `${user.id}:${timestamp}`;
  }
  
  /**
   * Decodes a token and returns its payload without validation
   * 
   * @param token - Authentication token
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  async decodeToken(token: string): Promise<JwtPayload | null> {
    this.methodCalls.decodeToken++;
    
    // For testing purposes, we can use a simple token format: 'user_id:timestamp'
    const parts = token.split(':');
    if (parts.length !== 2) {
      return null;
    }
    
    const userId = parts[0];
    const timestamp = parseInt(parts[1], 10);
    
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }
    
    return {
      sub: userId,
      iat: Math.floor(timestamp / 1000),
      exp: Math.floor(timestamp / 1000) + 3600, // 1 hour expiration
      roles: user.roles || [],
      email: user.email,
    };
  }
  
  /**
   * Extracts the token from the request
   * 
   * @param request - HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: any): string | null {
    this.methodCalls.extractTokenFromRequest++;
    
    // Check Authorization header
    const authHeader = request?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check cookies
    const token = request?.cookies?.token;
    if (token) {
      return token;
    }
    
    return null;
  }
  
  /**
   * Revokes a token, making it invalid for future authentication
   * 
   * @param token - Authentication token to revoke
   * @returns Promise resolving to true if revocation was successful, false otherwise
   */
  async revokeToken(token: string): Promise<boolean> {
    this.methodCalls.revokeToken++;
    
    // For testing purposes, we can simulate successful revocation
    return true;
  }
  
  /**
   * Refreshes an existing token and returns a new one
   * 
   * @param refreshToken - Refresh token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    this.methodCalls.refreshToken++;
    
    // For testing purposes, we can use a simple token format: 'user_id:timestamp'
    const parts = refreshToken.split(':');
    if (parts.length !== 2) {
      return null;
    }
    
    const userId = parts[0];
    const user = this.users.get(userId);
    
    if (!user) {
      return null;
    }
    
    // Generate a new token
    return this.generateToken(user);
  }
}
/**
 * Mock implementations for testing authentication strategies
 * Provides reusable mock services and dependencies for isolated testing
 */

import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Import interfaces from the auth package
import { IAuthService } from '@austa/auth/interfaces';
import { ITokenPayload, IToken, ITokenResponse } from '@austa/auth/interfaces';
import { IUser, IUserWithRoles, IUserResponse } from '@austa/auth/interfaces';

/**
 * Mock user data for testing
 */
export const mockUsers = {
  validUser: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', // hashed password
    roles: ['user'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  adminUser: {
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', // hashed password
    roles: ['admin', 'user'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  invalidUser: {
    id: '3',
    name: 'Invalid User',
    email: 'invalid@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', // hashed password
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

/**
 * Mock tokens for testing
 */
export const mockTokens = {
  validAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGVzIjpbInVzZXIiXSwiaWF0IjoxNjE2MTIzNDU2LCJleHAiOjE2MTYxMjcwNTZ9.mock-signature',
  validRefreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGVzIjpbInVzZXIiXSwiaWF0IjoxNjE2MTIzNDU2LCJleHAiOjE2MTYyMDk4NTZ9.mock-refresh-signature',
  expiredAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGVzIjpbInVzZXIiXSwiaWF0IjoxNjE2MDAwMDAwLCJleHAiOjE2MTYwMDAwMDB9.mock-expired-signature',
  invalidSignatureToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGVzIjpbInVzZXIiXSwiaWF0IjoxNjE2MTIzNDU2LCJleHAiOjE2MTYxMjcwNTZ9.invalid-signature',
  malformedToken: 'not-a-valid-jwt-token',
};

/**
 * Mock token payloads for testing
 */
export const mockTokenPayloads = {
  validUser: {
    sub: '1',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user'],
    iat: 1616123456,
    exp: 1616127056,
  },
  adminUser: {
    sub: '2',
    email: 'admin@example.com',
    name: 'Admin User',
    roles: ['admin', 'user'],
    iat: 1616123456,
    exp: 1616127056,
  },
  expiredToken: {
    sub: '1',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user'],
    iat: 1616000000,
    exp: 1616000000, // expired
  },
};

/**
 * Mock OAuth profiles for testing
 */
export const mockOAuthProfiles = {
  google: {
    id: 'google-123456789',
    displayName: 'Google User',
    emails: [{ value: 'google-user@example.com' }],
    photos: [{ value: 'https://example.com/photo.jpg' }],
    provider: 'google',
  },
  facebook: {
    id: 'facebook-123456789',
    displayName: 'Facebook User',
    emails: [{ value: 'facebook-user@example.com' }],
    photos: [{ value: 'https://example.com/photo.jpg' }],
    provider: 'facebook',
  },
  apple: {
    id: 'apple-123456789',
    displayName: 'Apple User',
    emails: [{ value: 'apple-user@example.com' }],
    photos: [],
    provider: 'apple',
  },
};

/**
 * Mock AuthService implementation for testing
 */
export class MockAuthService implements Partial<IAuthService> {
  /**
   * Mock implementation of validateCredentials
   * Returns a user for valid credentials, throws for invalid ones
   */
  async validateCredentials(email: string, password: string): Promise<IUser> {
    if (email === 'test@example.com' && password === 'password') {
      return mockUsers.validUser;
    }
    if (email === 'admin@example.com' && password === 'admin') {
      return mockUsers.adminUser;
    }
    throw new Error('Invalid credentials');
  }

  /**
   * Mock implementation of generateAccessToken
   * Returns a predefined token for known users
   */
  async generateAccessToken(user: IUser): Promise<string> {
    if (user.id === '1') {
      return mockTokens.validAccessToken;
    }
    if (user.id === '2') {
      return 'admin-access-token';
    }
    return 'generic-access-token';
  }

  /**
   * Mock implementation of generateRefreshToken
   * Returns a predefined refresh token for known users
   */
  async generateRefreshToken(user: IUser): Promise<string> {
    if (user.id === '1') {
      return mockTokens.validRefreshToken;
    }
    if (user.id === '2') {
      return 'admin-refresh-token';
    }
    return 'generic-refresh-token';
  }

  /**
   * Mock implementation of refreshAccessToken
   * Returns a new access token for valid refresh tokens
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    if (refreshToken === mockTokens.validRefreshToken) {
      return mockTokens.validAccessToken;
    }
    if (refreshToken === 'admin-refresh-token') {
      return 'admin-access-token';
    }
    throw new Error('Invalid refresh token');
  }

  /**
   * Mock implementation of logout
   * Always returns true for successful logout
   */
  async logout(userId: string): Promise<boolean> {
    return true;
  }

  /**
   * Additional method for testing OAuth validation
   */
  async validateOAuthUser(profile: any): Promise<IUser> {
    if (profile.provider === 'google') {
      return {
        ...mockUsers.validUser,
        email: 'google-user@example.com',
      };
    }
    if (profile.provider === 'facebook') {
      return {
        ...mockUsers.validUser,
        email: 'facebook-user@example.com',
      };
    }
    if (profile.provider === 'apple') {
      return {
        ...mockUsers.validUser,
        email: 'apple-user@example.com',
      };
    }
    throw new Error('Invalid OAuth provider');
  }
}

/**
 * Mock ConfigService implementation for testing
 */
export class MockConfigService implements Partial<ConfigService> {
  private readonly configValues: Record<string, any> = {
    // JWT configuration
    'jwt.secret': 'test-jwt-secret',
    'jwt.expiresIn': '1h',
    'jwt.refreshExpiresIn': '7d',
    'jwt.issuer': 'austa-superapp',
    'jwt.audience': 'austa-users',
    
    // OAuth configuration
    'oauth.google.clientId': 'google-client-id',
    'oauth.google.clientSecret': 'google-client-secret',
    'oauth.google.callbackUrl': 'http://localhost:3000/auth/google/callback',
    
    'oauth.facebook.appId': 'facebook-app-id',
    'oauth.facebook.appSecret': 'facebook-app-secret',
    'oauth.facebook.callbackUrl': 'http://localhost:3000/auth/facebook/callback',
    
    'oauth.apple.clientId': 'apple-client-id',
    'oauth.apple.teamId': 'apple-team-id',
    'oauth.apple.keyId': 'apple-key-id',
    'oauth.apple.privateKey': 'apple-private-key',
    'oauth.apple.callbackUrl': 'http://localhost:3000/auth/apple/callback',
    
    // Database configuration
    'database.host': 'localhost',
    'database.port': 5432,
    'database.username': 'test-user',
    'database.password': 'test-password',
    'database.name': 'test-db',
    
    // Redis configuration
    'redis.host': 'localhost',
    'redis.port': 6379,
    'redis.password': '',
    'redis.db': 0,
    
    // App configuration
    'app.name': 'AUSTA SuperApp',
    'app.env': 'test',
    'app.port': 3000,
    'app.apiPrefix': 'api',
  };

  /**
   * Mock implementation of get method
   * Returns predefined configuration values
   */
  get<T>(key: string): T {
    return this.configValues[key] as T;
  }

  /**
   * Mock implementation of getOrThrow method
   * Returns predefined configuration values or throws if not found
   */
  getOrThrow<T>(key: string): T {
    const value = this.configValues[key];
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" not found`);
    }
    return value as T;
  }

  /**
   * Set a custom configuration value for testing
   */
  set(key: string, value: any): void {
    this.configValues[key] = value;
  }
}

/**
 * Mock LoggerService implementation for testing
 */
export class MockLoggerService extends Logger {
  // Store log entries for verification
  logs: { level: string; message: string; context?: string; trace?: string }[] = [];

  /**
   * Clear all captured logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Override log method to capture entries
   */
  log(message: any, context?: string): void {
    this.logs.push({ level: 'log', message, context });
  }

  /**
   * Override error method to capture entries
   */
  error(message: any, trace?: string, context?: string): void {
    this.logs.push({ level: 'error', message, trace, context });
  }

  /**
   * Override warn method to capture entries
   */
  warn(message: any, context?: string): void {
    this.logs.push({ level: 'warn', message, context });
  }

  /**
   * Override debug method to capture entries
   */
  debug(message: any, context?: string): void {
    this.logs.push({ level: 'debug', message, context });
  }

  /**
   * Override verbose method to capture entries
   */
  verbose(message: any, context?: string): void {
    this.logs.push({ level: 'verbose', message, context });
  }

  /**
   * Get logs of a specific level
   */
  getLogsByLevel(level: string): { message: string; context?: string; trace?: string }[] {
    return this.logs
      .filter((log) => log.level === level)
      .map(({ message, context, trace }) => ({ message, context, trace }));
  }

  /**
   * Check if a specific message was logged
   */
  hasLoggedMessage(message: string, level?: string): boolean {
    return this.logs.some(
      (log) => log.message.includes(message) && (!level || log.level === level)
    );
  }
}

/**
 * Mock JwtService implementation for testing
 */
export class MockJwtService implements Partial<JwtService> {
  /**
   * Mock implementation of sign method
   * Returns a predefined token
   */
  sign(payload: Record<string, any>, options?: any): string {
    if (payload.sub === '1') {
      return mockTokens.validAccessToken;
    }
    if (payload.sub === '2') {
      return 'admin-access-token';
    }
    return 'generic-access-token';
  }

  /**
   * Mock implementation of verify method
   * Returns a decoded payload for valid tokens, throws for invalid ones
   */
  verify<T extends object = any>(token: string, options?: any): T {
    if (token === mockTokens.validAccessToken) {
      return mockTokenPayloads.validUser as unknown as T;
    }
    if (token === 'admin-access-token') {
      return mockTokenPayloads.adminUser as unknown as T;
    }
    if (token === mockTokens.expiredAccessToken) {
      throw new Error('jwt expired');
    }
    if (token === mockTokens.invalidSignatureToken) {
      throw new Error('invalid signature');
    }
    if (token === mockTokens.malformedToken) {
      throw new Error('jwt malformed');
    }
    throw new Error('Invalid token');
  }

  /**
   * Mock implementation of decode method
   * Returns a decoded payload without verification
   */
  decode(token: string, options?: any): Record<string, any> | null {
    if (token === mockTokens.validAccessToken) {
      return mockTokenPayloads.validUser;
    }
    if (token === 'admin-access-token') {
      return mockTokenPayloads.adminUser;
    }
    if (token === mockTokens.expiredAccessToken) {
      return mockTokenPayloads.expiredToken;
    }
    if (token === mockTokens.invalidSignatureToken) {
      return mockTokenPayloads.validUser;
    }
    return null;
  }
}

/**
 * Mock Redis client for testing token blacklisting
 */
export class MockRedisClient {
  private readonly storage: Record<string, string> = {};

  /**
   * Mock implementation of set method
   */
  async set(key: string, value: string, options?: any): Promise<'OK'> {
    this.storage[key] = value;
    return 'OK';
  }

  /**
   * Mock implementation of get method
   */
  async get(key: string): Promise<string | null> {
    return this.storage[key] || null;
  }

  /**
   * Mock implementation of del method
   */
  async del(key: string): Promise<number> {
    if (this.storage[key]) {
      delete this.storage[key];
      return 1;
    }
    return 0;
  }

  /**
   * Mock implementation of exists method
   */
  async exists(key: string): Promise<number> {
    return this.storage[key] ? 1 : 0;
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    Object.keys(this.storage).forEach((key) => {
      delete this.storage[key];
    });
  }
}

/**
 * Create a test module configuration with mock providers
 * for testing authentication strategies
 */
export const createTestModuleConfig = () => ({
  providers: [
    {
      provide: 'AuthService',
      useClass: MockAuthService,
    },
    {
      provide: ConfigService,
      useClass: MockConfigService,
    },
    {
      provide: Logger,
      useClass: MockLoggerService,
    },
    {
      provide: JwtService,
      useClass: MockJwtService,
    },
    {
      provide: 'REDIS_CLIENT',
      useClass: MockRedisClient,
    },
  ],
});
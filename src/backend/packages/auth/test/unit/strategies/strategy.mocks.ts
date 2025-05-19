/**
 * @file strategy.mocks.ts
 * @description Provides mock implementations of services and dependencies required for testing
 * authentication strategies. These mocks enable isolated testing of strategies without real
 * service dependencies.
 */

import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

// Import from the auth package using standardized path aliases
import { AuthService } from '../../../src/auth.service';
import { TokenService } from '../../../src/token.service';
import { IAuthResult } from '../../../src/interfaces/auth.interface';
import { ITokenPayload, ITokenResponse } from '../../../src/interfaces/token.interface';
import { IUser } from '../../../src/interfaces/user.interface';
import { OAuthProfile } from '../../../src/providers/oauth/interfaces';

// Import test fixtures
import {
  validTokenPayload,
  expiredTokenPayload,
  validTokenResponse,
  validUserCredentials,
  googleOAuthProfile,
  facebookOAuthProfile,
  appleOAuthProfile,
  authErrorResponses
} from './strategy.fixtures';

/**
 * Mock implementation of AuthService for testing authentication strategies
 * Provides predefined responses for various authentication scenarios
 */
export class MockAuthService {
  // Track method calls for verification in tests
  validateUserCalls: { email: string; password: string }[] = [];
  validateTokenCalls: { token: string }[] = [];
  findUserByEmailCalls: { email: string }[] = [];
  createUserFromOAuthCalls: { profile: OAuthProfile }[] = [];
  loginCalls: { email: string; password: string }[] = [];

  // Mock user data
  private readonly mockUsers: Record<string, IUser> = {
    'user@example.com': {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      name: 'Test User',
      roles: [1, 2], // User, Health Journey User
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'admin@example.com': {
      id: '223e4567-e89b-12d3-a456-426614174001',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: [1, 2, 5], // User, Health Journey User, Admin
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'google-user@gmail.com': {
      id: '323e4567-e89b-12d3-a456-426614174002',
      email: 'google-user@gmail.com',
      name: 'Google Test User',
      roles: [1, 2], // User, Health Journey User
      createdAt: new Date(),
      updatedAt: new Date(),
      oauthProviderId: 'google',
    },
    'facebook-user@example.com': {
      id: '423e4567-e89b-12d3-a456-426614174003',
      email: 'facebook-user@example.com',
      name: 'Facebook Test User',
      roles: [1, 2], // User, Health Journey User
      createdAt: new Date(),
      updatedAt: new Date(),
      oauthProviderId: 'facebook',
    },
    'apple-user@privaterelay.appleid.com': {
      id: '523e4567-e89b-12d3-a456-426614174004',
      email: 'apple-user@privaterelay.appleid.com',
      name: 'Apple Test User',
      roles: [1, 2], // User, Health Journey User
      createdAt: new Date(),
      updatedAt: new Date(),
      oauthProviderId: 'apple',
    },
    'mfa-user@example.com': {
      id: '623e4567-e89b-12d3-a456-426614174005',
      email: 'mfa-user@example.com',
      name: 'MFA Test User',
      roles: [1, 2], // User, Health Journey User
      createdAt: new Date(),
      updatedAt: new Date(),
      mfaEnabled: true,
    },
  };

  /**
   * Validates user credentials and returns user if valid
   * @param email User email
   * @param password User password
   * @returns User object if credentials are valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<IUser | null> {
    this.validateUserCalls.push({ email, password });
    
    // For testing purposes, we'll consider valid credentials based on our test fixtures
    if (email === validUserCredentials.email && password === validUserCredentials.password) {
      return this.mockUsers[email];
    }
    
    // Special case for MFA testing
    if (email === 'mfa-user@example.com' && password === validUserCredentials.password) {
      return this.mockUsers[email];
    }
    
    return null;
  }

  /**
   * Validates a JWT token and returns the user if valid
   * @param token JWT token
   * @returns User object if token is valid
   * @throws Error if token is invalid or expired
   */
  async validateToken(token: string): Promise<IUser> {
    this.validateTokenCalls.push({ token });
    
    // For testing, we'll simulate token validation based on token content
    if (token.includes('expired')) {
      throw new Error('JWT token has expired');
    }
    
    if (token.includes('invalid')) {
      throw new Error('Invalid JWT token');
    }
    
    // Default to returning our test user
    return this.mockUsers['user@example.com'];
  }

  /**
   * Finds a user by email
   * @param email User email
   * @returns User object if found, null otherwise
   */
  async findUserByEmail(email: string): Promise<IUser | null> {
    this.findUserByEmailCalls.push({ email });
    return this.mockUsers[email] || null;
  }

  /**
   * Creates a new user from OAuth profile
   * @param profile OAuth profile
   * @returns Created user
   */
  async createUserFromOAuth(profile: OAuthProfile): Promise<IUser> {
    this.createUserFromOAuthCalls.push({ profile });
    
    // For Google profile
    if (profile.provider === 'google') {
      return this.mockUsers['google-user@gmail.com'];
    }
    
    // For Facebook profile
    if (profile.provider === 'facebook') {
      return this.mockUsers['facebook-user@example.com'];
    }
    
    // For Apple profile
    if (profile.provider === 'apple') {
      return this.mockUsers['apple-user@privaterelay.appleid.com'];
    }
    
    // Default fallback
    return this.mockUsers['user@example.com'];
  }

  /**
   * Authenticates a user with email and password
   * @param email User email
   * @param password User password
   * @returns Authentication result with tokens if successful
   * @throws Error if credentials are invalid
   */
  async login(email: string, password: string): Promise<IAuthResult> {
    this.loginCalls.push({ email, password });
    
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // For MFA testing
    if (user.mfaEnabled) {
      return {
        user,
        requiresMfa: true,
        mfaToken: 'mock-mfa-token',
      };
    }
    
    return {
      user,
      tokens: validTokenResponse,
      requiresMfa: false,
    };
  }

  /**
   * Resets all tracked method calls
   * Useful between tests to ensure clean state
   */
  resetCalls(): void {
    this.validateUserCalls = [];
    this.validateTokenCalls = [];
    this.findUserByEmailCalls = [];
    this.createUserFromOAuthCalls = [];
    this.loginCalls = [];
  }
}

/**
 * Mock implementation of TokenService for testing authentication strategies
 * Provides predefined responses for token operations
 */
export class MockTokenService {
  // Track method calls for verification in tests
  generateTokenCalls: { payload: ITokenPayload }[] = [];
  verifyTokenCalls: { token: string }[] = [];
  decodeTokenCalls: { token: string }[] = [];
  refreshTokenCalls: { refreshToken: string }[] = [];

  /**
   * Generates a JWT token for a user
   * @param payload Token payload
   * @returns Token response with access and refresh tokens
   */
  async generateToken(payload: ITokenPayload): Promise<ITokenResponse> {
    this.generateTokenCalls.push({ payload });
    return validTokenResponse;
  }

  /**
   * Verifies a JWT token
   * @param token JWT token
   * @returns Decoded token payload if valid
   * @throws Error if token is invalid or expired
   */
  async verifyToken(token: string): Promise<ITokenPayload> {
    this.verifyTokenCalls.push({ token });
    
    if (token.includes('expired')) {
      throw new Error('JWT token has expired');
    }
    
    if (token.includes('invalid')) {
      throw new Error('Invalid JWT token');
    }
    
    return validTokenPayload;
  }

  /**
   * Decodes a JWT token without verification
   * @param token JWT token
   * @returns Decoded token payload
   */
  decodeToken(token: string): ITokenPayload {
    this.decodeTokenCalls.push({ token });
    
    if (token.includes('expired')) {
      return expiredTokenPayload;
    }
    
    return validTokenPayload;
  }

  /**
   * Refreshes an access token using a refresh token
   * @param refreshToken Refresh token
   * @returns New token response with fresh access and refresh tokens
   * @throws Error if refresh token is invalid or expired
   */
  async refreshToken(refreshToken: string): Promise<ITokenResponse> {
    this.refreshTokenCalls.push({ refreshToken });
    
    if (refreshToken.includes('expired') || refreshToken.includes('invalid')) {
      throw new Error('Invalid or expired refresh token');
    }
    
    return {
      ...validTokenResponse,
      accessToken: `${validTokenResponse.accessToken}-refreshed`,
      refreshToken: `${validTokenResponse.refreshToken}-refreshed`,
      expiresAt: Date.now() + 3600000, // 1 hour from now
    };
  }

  /**
   * Resets all tracked method calls
   * Useful between tests to ensure clean state
   */
  resetCalls(): void {
    this.generateTokenCalls = [];
    this.verifyTokenCalls = [];
    this.decodeTokenCalls = [];
    this.refreshTokenCalls = [];
  }
}

/**
 * Mock implementation of ConfigService for testing authentication strategies
 * Returns controlled configuration values for JWT secrets and OAuth settings
 */
export class MockConfigService {
  // Default configuration values
  private config: Record<string, any> = {
    'authService.jwt.secret': 'test-jwt-secret',
    'authService.jwt.expiresIn': '1h',
    'authService.jwt.refreshExpiresIn': '7d',
    'authService.jwt.issuer': 'austa-auth-service',
    'authService.jwt.audience': 'austa-superapp',
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
    'redis.host': 'localhost',
    'redis.port': 6379,
    'redis.password': '',
    'redis.db': 0,
    'redis.keyPrefix': 'auth:',
    'auth.tokenBlacklist.enabled': true,
    'auth.mfa.enabled': true,
    'auth.mfa.issuer': 'AUSTA SuperApp',
  };

  /**
   * Gets a configuration value by key
   * @param key Configuration key
   * @param defaultValue Default value if key is not found
   * @returns Configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    return (this.config[key] !== undefined ? this.config[key] : defaultValue) as T;
  }

  /**
   * Sets a configuration value
   * @param key Configuration key
   * @param value Configuration value
   */
  set(key: string, value: any): void {
    this.config[key] = value;
  }

  /**
   * Resets configuration to default values
   * @param config Optional custom configuration to set
   */
  reset(config?: Record<string, any>): void {
    this.config = {
      'authService.jwt.secret': 'test-jwt-secret',
      'authService.jwt.expiresIn': '1h',
      'authService.jwt.refreshExpiresIn': '7d',
      'authService.jwt.issuer': 'austa-auth-service',
      'authService.jwt.audience': 'austa-superapp',
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
      'redis.host': 'localhost',
      'redis.port': 6379,
      'redis.password': '',
      'redis.db': 0,
      'redis.keyPrefix': 'auth:',
      'auth.tokenBlacklist.enabled': true,
      'auth.mfa.enabled': true,
      'auth.mfa.issuer': 'AUSTA SuperApp',
      ...(config || {}),
    };
  }
}

/**
 * Mock implementation of JwtService for testing authentication strategies
 * Provides controlled JWT signing and verification
 */
export class MockJwtService {
  // Track method calls for verification in tests
  signCalls: { payload: Record<string, any>; options?: Record<string, any> }[] = [];
  verifyCalls: { token: string; options?: Record<string, any> }[] = [];
  decodeCalls: { token: string; options?: Record<string, any> }[] = [];

  /**
   * Signs a JWT token
   * @param payload Token payload
   * @param options Signing options
   * @returns Signed JWT token
   */
  sign(payload: Record<string, any>, options?: Record<string, any>): string {
    this.signCalls.push({ payload, options });
    
    // For testing, we'll create a token string that includes payload info
    const tokenPrefix = payload.sub ? `token-${payload.sub}` : 'token-default';
    return `${tokenPrefix}-${Date.now()}`;
  }

  /**
   * Verifies a JWT token
   * @param token JWT token
   * @param options Verification options
   * @returns Decoded token payload if valid
   * @throws Error if token is invalid or expired
   */
  verify<T extends object = any>(token: string, options?: Record<string, any>): T {
    this.verifyCalls.push({ token, options });
    
    if (token.includes('expired')) {
      throw new Error('JWT token has expired');
    }
    
    if (token.includes('invalid')) {
      throw new Error('Invalid JWT token');
    }
    
    return validTokenPayload as unknown as T;
  }

  /**
   * Decodes a JWT token without verification
   * @param token JWT token
   * @param options Decoding options
   * @returns Decoded token payload
   */
  decode<T extends object = any>(token: string, options?: Record<string, any>): T | null {
    this.decodeCalls.push({ token, options });
    
    if (token.includes('malformed')) {
      return null;
    }
    
    if (token.includes('expired')) {
      return expiredTokenPayload as unknown as T;
    }
    
    return validTokenPayload as unknown as T;
  }

  /**
   * Resets all tracked method calls
   * Useful between tests to ensure clean state
   */
  resetCalls(): void {
    this.signCalls = [];
    this.verifyCalls = [];
    this.decodeCalls = [];
  }
}

/**
 * Mock implementation of LoggerService for testing authentication strategies
 * Captures log entries for verification
 */
export class MockLoggerService {
  // Store log entries for verification
  logs: { level: string; message: string; context?: string; meta?: Record<string, any> }[] = [];

  /**
   * Logs a debug message
   * @param message Log message
   * @param context Optional context
   * @param meta Optional metadata
   */
  debug(message: string, context?: string, meta?: Record<string, any>): void {
    this.logs.push({ level: 'debug', message, context, meta });
  }

  /**
   * Logs an info message
   * @param message Log message
   * @param context Optional context
   * @param meta Optional metadata
   */
  log(message: string, context?: string, meta?: Record<string, any>): void {
    this.logs.push({ level: 'info', message, context, meta });
  }

  /**
   * Logs a warning message
   * @param message Log message
   * @param context Optional context
   * @param meta Optional metadata
   */
  warn(message: string, context?: string, meta?: Record<string, any>): void {
    this.logs.push({ level: 'warn', message, context, meta });
  }

  /**
   * Logs an error message
   * @param message Log message
   * @param trace Optional stack trace
   * @param context Optional context
   * @param meta Optional metadata
   */
  error(message: string, trace?: string, context?: string, meta?: Record<string, any>): void {
    this.logs.push({ level: 'error', message, context, meta: { ...meta, trace } });
  }

  /**
   * Logs a verbose message
   * @param message Log message
   * @param context Optional context
   * @param meta Optional metadata
   */
  verbose(message: string, context?: string, meta?: Record<string, any>): void {
    this.logs.push({ level: 'verbose', message, context, meta });
  }

  /**
   * Gets all logs of a specific level
   * @param level Log level
   * @returns Array of log entries
   */
  getLogsByLevel(level: string): { message: string; context?: string; meta?: Record<string, any> }[] {
    return this.logs
      .filter(log => log.level === level)
      .map(({ message, context, meta }) => ({ message, context, meta }));
  }

  /**
   * Gets all logs containing a specific message substring
   * @param substring Message substring to search for
   * @returns Array of matching log entries
   */
  getLogsByMessage(substring: string): { level: string; message: string; context?: string; meta?: Record<string, any> }[] {
    return this.logs.filter(log => log.message.includes(substring));
  }

  /**
   * Gets all logs for a specific context
   * @param context Context to filter by
   * @returns Array of matching log entries
   */
  getLogsByContext(context: string): { level: string; message: string; meta?: Record<string, any> }[] {
    return this.logs
      .filter(log => log.context === context)
      .map(({ level, message, meta }) => ({ level, message, meta }));
  }

  /**
   * Clears all logs
   * Useful between tests to ensure clean state
   */
  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Creates a testing module with mock services for authentication strategy testing
 * @param overrides Optional service overrides
 * @returns NestJS test module with mock services
 */
export async function createAuthTestingModule(overrides: {
  authService?: Partial<MockAuthService>;
  tokenService?: Partial<MockTokenService>;
  configService?: Partial<MockConfigService>;
  jwtService?: Partial<MockJwtService>;
  loggerService?: Partial<MockLoggerService>;
} = {}) {
  const mockAuthService = new MockAuthService();
  const mockTokenService = new MockTokenService();
  const mockConfigService = new MockConfigService();
  const mockJwtService = new MockJwtService();
  const mockLoggerService = new MockLoggerService();

  // Apply any overrides
  Object.assign(mockAuthService, overrides.authService || {});
  Object.assign(mockTokenService, overrides.tokenService || {});
  Object.assign(mockConfigService, overrides.configService || {});
  Object.assign(mockJwtService, overrides.jwtService || {});
  Object.assign(mockLoggerService, overrides.loggerService || {});

  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: AuthService,
        useValue: mockAuthService,
      },
      {
        provide: TokenService,
        useValue: mockTokenService,
      },
      {
        provide: ConfigService,
        useValue: mockConfigService,
      },
      {
        provide: JwtService,
        useValue: mockJwtService,
      },
      {
        provide: 'LoggerService',
        useValue: mockLoggerService,
      },
    ],
  }).compile();

  return {
    moduleRef,
    mockAuthService,
    mockTokenService,
    mockConfigService,
    mockJwtService,
    mockLoggerService,
  };
}
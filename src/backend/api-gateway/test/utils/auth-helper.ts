/**
 * Authentication Helper Utilities for API Gateway Testing
 * 
 * This module provides utilities for testing authentication-related functionality
 * in the API Gateway, including token generation, mock user creation, and
 * authentication failure simulation.
 * 
 * It implements enhanced error handling with retry policies and integrates with
 * the @austa/interfaces package for type-safe request/response models.
 */

import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

// Import interfaces from @austa/interfaces package
import { JwtPayload, UserResponseDto, AuthSession, TokenValidationResponseDto } from '@austa/interfaces/auth';
import { Role, Permission } from '@austa/interfaces/auth';

/**
 * Default test JWT secret used when no configuration is provided
 */
const DEFAULT_TEST_JWT_SECRET = 'test-jwt-secret-for-api-gateway-testing';

/**
 * Default token expiration time (1 hour)
 */
const DEFAULT_TOKEN_EXPIRATION = '1h';

/**
 * Default retry options for authentication operations
 */
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  retryDelay: 100,
  exponentialBackoff: true,
  timeout: 5000
};

/**
 * Logger instance for auth helper
 */
const logger = new Logger('AuthHelper');

/**
 * Retry options for authentication operations
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
  /** Whether to use exponential backoff for retries */
  exponentialBackoff: boolean;
  /** Timeout for the operation in milliseconds */
  timeout: number;
}

/**
 * Options for generating a JWT token
 */
export interface GenerateTokenOptions {
  /** User ID to include in the token */
  userId?: string;
  /** User email to include in the token */
  email?: string;
  /** User roles to include in the token */
  roles?: string[];
  /** Custom claims to include in the token */
  customClaims?: Record<string, any>;
  /** Token expiration time */
  expiresIn?: string | number;
  /** Whether to generate an expired token (for testing expiration handling) */
  expired?: boolean;
  /** Whether to generate an invalid token (for testing invalid signature handling) */
  invalid?: boolean;
}

/**
 * Generates a JWT token for testing purposes
 * 
 * @param options - Token generation options
 * @param jwtSecret - Secret key for signing the token (defaults to DEFAULT_TEST_JWT_SECRET)
 * @returns The generated JWT token string
 * @throws Error if token generation fails
 */
export function generateTestToken(
  options: GenerateTokenOptions = {},
  jwtSecret: string = DEFAULT_TEST_JWT_SECRET
): string {
  const {
    userId = '00000000-0000-0000-0000-000000000001',
    email = 'test@austa.health',
    roles = ['user'],
    customClaims = {},
    expiresIn = DEFAULT_TOKEN_EXPIRATION,
    expired = false,
    invalid = false
  } = options;

  // Create the token payload
  const payload: JwtPayload = {
    sub: userId,
    email,
    roles,
    ...customClaims
  };

  // For expired tokens, set expiration to a past time
  const tokenOptions = expired
    ? { expiresIn: '-10s' }
    : { expiresIn };

  // Generate the token
  const token = jwt.sign(payload, invalid ? 'invalid-secret' : jwtSecret, tokenOptions);
  
  return token;
}

/**
 * User permission levels for testing
 */
export enum UserPermissionLevel {
  ADMIN = 'admin',
  PROVIDER = 'provider',
  USER = 'user',
  GUEST = 'guest'
}

/**
 * Journey types for testing
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Creates a mock user with specified permission level
 * 
 * @param level - The permission level for the user
 * @param overrides - Optional properties to override in the user object
 * @returns A mock user object
 */
export function createMockUser(
  level: UserPermissionLevel = UserPermissionLevel.USER,
  overrides: Partial<UserResponseDto> = {}
): UserResponseDto {
  // Define base permissions for each level
  const permissionsByLevel: Record<UserPermissionLevel, Permission[]> = {
    [UserPermissionLevel.ADMIN]: [
      { id: '1', name: 'users:read', description: 'Read users' },
      { id: '2', name: 'users:write', description: 'Write users' },
      { id: '3', name: 'users:delete', description: 'Delete users' },
      { id: '4', name: 'journeys:read', description: 'Read all journeys' },
      { id: '5', name: 'journeys:write', description: 'Write all journeys' },
      { id: '6', name: 'system:admin', description: 'System administration' }
    ],
    [UserPermissionLevel.PROVIDER]: [
      { id: '1', name: 'users:read', description: 'Read users' },
      { id: '4', name: 'journeys:read', description: 'Read all journeys' },
      { id: '7', name: 'care:write', description: 'Write care journey data' },
      { id: '8', name: 'health:read', description: 'Read health journey data' }
    ],
    [UserPermissionLevel.USER]: [
      { id: '4', name: 'journeys:read', description: 'Read all journeys' },
      { id: '9', name: 'profile:read', description: 'Read own profile' },
      { id: '10', name: 'profile:write', description: 'Update own profile' }
    ],
    [UserPermissionLevel.GUEST]: [
      { id: '11', name: 'public:read', description: 'Read public data' }
    ]
  };

  // Define roles for each level
  const rolesByLevel: Record<UserPermissionLevel, Role[]> = {
    [UserPermissionLevel.ADMIN]: [
      { id: '1', name: 'admin', description: 'Administrator', permissions: permissionsByLevel[UserPermissionLevel.ADMIN] }
    ],
    [UserPermissionLevel.PROVIDER]: [
      { id: '2', name: 'provider', description: 'Healthcare Provider', permissions: permissionsByLevel[UserPermissionLevel.PROVIDER] }
    ],
    [UserPermissionLevel.USER]: [
      { id: '3', name: 'user', description: 'Regular User', permissions: permissionsByLevel[UserPermissionLevel.USER] }
    ],
    [UserPermissionLevel.GUEST]: [
      { id: '4', name: 'guest', description: 'Guest User', permissions: permissionsByLevel[UserPermissionLevel.GUEST] }
    ]
  };

  // Create the base user
  const baseUser: UserResponseDto = {
    id: `00000000-0000-0000-0000-00000000000${level === UserPermissionLevel.ADMIN ? '1' : 
                                             level === UserPermissionLevel.PROVIDER ? '2' : 
                                             level === UserPermissionLevel.USER ? '3' : '4'}`,
    email: `${level}@austa.health`,
    firstName: `Test`,
    lastName: level.charAt(0).toUpperCase() + level.slice(1),
    roles: rolesByLevel[level],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Return the user with any overrides applied
  return {
    ...baseUser,
    ...overrides
  };
}

/**
 * Creates a mock auth session for testing
 * 
 * @param user - The user to create a session for
 * @param options - Token generation options
 * @returns A mock auth session
 */
export function createMockAuthSession(
  user: UserResponseDto = createMockUser(),
  options: Partial<GenerateTokenOptions> = {}
): AuthSession {
  const accessToken = generateTestToken({
    userId: user.id,
    email: user.email,
    roles: user.roles.map(role => role.name),
    ...options
  });

  const refreshToken = generateTestToken({
    userId: user.id,
    email: user.email,
    expiresIn: '7d',
    ...options
  });

  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 3600000, // 1 hour from now
    tokenType: 'Bearer'
  };
}

/**
 * Creates a mock auth session for testing with retry logic
 * 
 * @param jwtUtil - JwtTestUtil instance for token generation
 * @param user - The user to create a session for
 * @param options - Token generation options
 * @param retryOptions - Options for retry behavior
 * @returns A mock auth session
 */
export async function createMockAuthSessionWithRetry(
  jwtUtil: JwtTestUtil,
  user: UserResponseDto = createMockUser(),
  options: Partial<GenerateTokenOptions> = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<AuthSession> {
  try {
    // Generate access token with retry
    const accessToken = await jwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      roles: user.roles.map(role => role.name),
      ...options
    }, retryOptions);
    
    // Generate refresh token with retry
    const refreshToken = await jwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      expiresIn: '7d',
      ...options
    }, retryOptions);
    
    return {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + 3600000, // 1 hour from now
      tokenType: 'Bearer'
    };
  } catch (error) {
    logger.error(`Failed to create mock auth session with retry: ${error instanceof Error ? error.message : String(error)}`);
    throw new AuthTestError(
      AuthTestErrorType.SESSION_CREATION_FAILED,
      `Failed to create mock auth session: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Adds authentication headers to a request
 * 
 * @param request - The request to add headers to
 * @param token - The token to add (if not provided, a default token will be generated)
 * @returns The request with authentication headers
 */
export function addAuthHeaders<T extends Request>(request: T, token?: string): T {
  const authToken = token || generateTestToken();
  request.headers.authorization = `Bearer ${authToken}`;
  
  // Add journey context header for journey-specific testing
  if (!request.headers['x-journey-context']) {
    request.headers['x-journey-context'] = 'health';
  }
  
  return request;
}

/**
 * Adds authentication headers to a request with retry logic
 * 
 * @param request - The request to add headers to
 * @param jwtUtil - JwtTestUtil instance for token generation
 * @param options - Token generation options
 * @param retryOptions - Options for retry behavior
 * @returns The request with authentication headers
 */
export async function addAuthHeadersWithRetry<T extends Request>(
  request: T,
  jwtUtil: JwtTestUtil,
  options: Partial<GenerateTokenOptions> = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  try {
    const token = await jwtUtil.generateToken(options, retryOptions);
    request.headers.authorization = `Bearer ${token}`;
    
    // Add journey context header for journey-specific testing
    if (!request.headers['x-journey-context']) {
      request.headers['x-journey-context'] = 'health';
    }
    
    return request;
  } catch (error) {
    logger.error(`Failed to add auth headers with retry: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Creates a request with authentication headers for a specific user permission level
 * 
 * @param request - The request to add headers to
 * @param level - The permission level for the user
 * @param options - Token generation options
 * @returns The request with authentication headers
 */
export function authenticateAs<T extends Request>(
  request: T,
  level: UserPermissionLevel = UserPermissionLevel.USER,
  options: Partial<GenerateTokenOptions> = {}
): T {
  const user = createMockUser(level);
  const token = generateTestToken({
    userId: user.id,
    email: user.email,
    roles: user.roles.map(role => role.name),
    ...options
  });
  
  return addAuthHeaders(request, token);
}

/**
 * Creates a request with authentication headers for a specific user permission level with retry logic
 * 
 * @param request - The request to add headers to
 * @param jwtUtil - JwtTestUtil instance for token generation
 * @param level - The permission level for the user
 * @param options - Token generation options
 * @param retryOptions - Options for retry behavior
 * @returns The request with authentication headers
 */
export async function authenticateAsWithRetry<T extends Request>(
  request: T,
  jwtUtil: JwtTestUtil,
  level: UserPermissionLevel = UserPermissionLevel.USER,
  options: Partial<GenerateTokenOptions> = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  try {
    const { user, token } = await jwtUtil.createUserWithToken(level, options, retryOptions);
    request.headers.authorization = `Bearer ${token}`;
    
    // Add journey context header for journey-specific testing
    if (!request.headers['x-journey-context']) {
      request.headers['x-journey-context'] = 'health';
    }
    
    // Add user ID header for easier debugging
    request.headers['x-test-user-id'] = user.id;
    
    return request;
  } catch (error) {
    logger.error(`Failed to authenticate as ${level} with retry: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Creates a request with an expired token
 * 
 * @param request - The request to add headers to
 * @returns The request with an expired token in the headers
 */
export function addExpiredAuthHeaders<T extends Request>(request: T): T {
  const expiredToken = generateTestToken({ expired: true });
  return addAuthHeaders(request, expiredToken);
}

/**
 * Creates a request with an expired token using retry logic
 * 
 * @param request - The request to add headers to
 * @param jwtUtil - JwtTestUtil instance for token generation
 * @param retryOptions - Options for retry behavior
 * @returns The request with an expired token in the headers
 */
export async function addExpiredAuthHeadersWithRetry<T extends Request>(
  request: T,
  jwtUtil: JwtTestUtil,
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  try {
    const token = await jwtUtil.generateToken({ expired: true }, retryOptions);
    request.headers.authorization = `Bearer ${token}`;
    return request;
  } catch (error) {
    logger.error(`Failed to add expired auth headers with retry: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Creates a request with an invalid token
 * 
 * @param request - The request to add headers to
 * @returns The request with an invalid token in the headers
 */
export function addInvalidAuthHeaders<T extends Request>(request: T): T {
  const invalidToken = generateTestToken({ invalid: true });
  return addAuthHeaders(request, invalidToken);
}

/**
 * Creates a request with an invalid token using retry logic
 * 
 * @param request - The request to add headers to
 * @param jwtUtil - JwtTestUtil instance for token generation
 * @param retryOptions - Options for retry behavior
 * @returns The request with an invalid token in the headers
 */
export async function addInvalidAuthHeadersWithRetry<T extends Request>(
  request: T,
  jwtUtil: JwtTestUtil,
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  try {
    const token = await jwtUtil.generateToken({ invalid: true }, retryOptions);
    request.headers.authorization = `Bearer ${token}`;
    return request;
  } catch (error) {
    logger.error(`Failed to add invalid auth headers with retry: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Creates a request with a blacklisted token
 * 
 * @param request - The request to add headers to
 * @param blacklist - Token blacklist instance
 * @param jwtUtil - JwtTestUtil instance for token generation
 * @param retryOptions - Options for retry behavior
 * @returns The request with a blacklisted token in the headers
 */
export async function addBlacklistedAuthHeaders<T extends Request>(
  request: T,
  blacklist: TokenBlacklistOperations,
  jwtUtil: JwtTestUtil,
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  try {
    // Generate a valid token
    const token = await jwtUtil.generateToken({}, retryOptions);
    
    // Blacklist the token
    await blacklist.blacklistToken(token, 'test-blacklisting', retryOptions);
    
    // Add the blacklisted token to the request
    request.headers.authorization = `Bearer ${token}`;
    return request;
  } catch (error) {
    logger.error(`Failed to add blacklisted auth headers: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Creates a request with journey-specific context
 * 
 * @param request - The request to add headers to
 * @param journey - The journey type
 * @returns The request with journey context headers
 */
export function addJourneyContext<T extends Request>(
  request: T,
  journey: JourneyType
): T {
  request.headers['x-journey-context'] = journey;
  return request;
}

/**
 * Creates a request with authentication headers for a specific journey
 * 
 * @param request - The request to add headers to
 * @param journey - The journey type
 * @param level - The permission level for the user
 * @param jwtUtil - JwtTestUtil instance for token generation
 * @param options - Token generation options
 * @param retryOptions - Options for retry behavior
 * @returns The request with authentication headers and journey context
 */
export async function authenticateForJourney<T extends Request>(
  request: T,
  journey: JourneyType,
  level: UserPermissionLevel = UserPermissionLevel.USER,
  jwtUtil: JwtTestUtil,
  options: Partial<GenerateTokenOptions> = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  try {
    // Add journey-specific claims to the token
    const journeyOptions: Partial<GenerateTokenOptions> = {
      ...options,
      customClaims: {
        ...options.customClaims,
        journey
      }
    };
    
    // Authenticate with the journey-specific token
    const authenticatedRequest = await authenticateAsWithRetry(
      request,
      jwtUtil,
      level,
      journeyOptions,
      retryOptions
    );
    
    // Add journey context header
    return addJourneyContext(authenticatedRequest, journey);
  } catch (error) {
    logger.error(`Failed to authenticate for journey ${journey}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Error types for authentication testing
 */
export enum AuthTestErrorType {
  TOKEN_GENERATION_FAILED = 'TOKEN_GENERATION_FAILED',
  TOKEN_VERIFICATION_FAILED = 'TOKEN_VERIFICATION_FAILED',
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  SESSION_CREATION_FAILED = 'SESSION_CREATION_FAILED',
  BLACKLIST_OPERATION_FAILED = 'BLACKLIST_OPERATION_FAILED',
  RETRY_ATTEMPTS_EXCEEDED = 'RETRY_ATTEMPTS_EXCEEDED',
  TIMEOUT_EXCEEDED = 'TIMEOUT_EXCEEDED'
}

/**
 * Custom error class for authentication testing errors
 */
export class AuthTestError extends Error {
  constructor(
    public readonly type: AuthTestErrorType,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AuthTestError';
  }
}

/**
 * Executes a function with retry logic
 * 
 * @param operation - The function to execute
 * @param options - Retry options
 * @returns The result of the operation
 * @throws AuthTestError if all retry attempts fail or timeout is exceeded
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_OPTIONS.maxRetries,
    retryDelay = DEFAULT_RETRY_OPTIONS.retryDelay,
    exponentialBackoff = DEFAULT_RETRY_OPTIONS.exponentialBackoff,
    timeout = DEFAULT_RETRY_OPTIONS.timeout
  } = options;

  let lastError: Error | undefined;
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check if timeout has been exceeded
      if (Date.now() - startTime > timeout) {
        throw new AuthTestError(
          AuthTestErrorType.TIMEOUT_EXCEEDED,
          `Operation timed out after ${timeout}ms`,
          lastError
        );
      }

      // Execute the operation
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.debug(
        `Retry attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}`
      );

      // If this is the last attempt, don't wait
      if (attempt === maxRetries - 1) {
        break;
      }

      // Calculate delay for next attempt
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retry attempts failed
  throw new AuthTestError(
    AuthTestErrorType.RETRY_ATTEMPTS_EXCEEDED,
    `Operation failed after ${maxRetries} retry attempts`,
    lastError
  );
}

/**
 * Utility for working with JWT tokens in tests
 */
export class JwtTestUtil {
  private configService?: ConfigService;
  private jwtSecret: string;
  private readonly logger = new Logger('JwtTestUtil');

  /**
   * Creates a new JwtTestUtil instance
   * 
   * @param configService - Optional ConfigService to retrieve JWT configuration
   */
  constructor(configService?: ConfigService) {
    this.configService = configService;
    this.jwtSecret = this.getJwtSecret();
    this.logger.log(`JwtTestUtil initialized with secret: ${this.jwtSecret.substring(0, 3)}...`);
  }

  /**
   * Gets the JWT secret from configuration or uses the default
   */
  private getJwtSecret(): string {
    if (this.configService) {
      return this.configService.get<string>('authService.jwt.secret') || DEFAULT_TEST_JWT_SECRET;
    }
    return DEFAULT_TEST_JWT_SECRET;
  }

  /**
   * Generates a token with the configured secret
   * 
   * @param options - Token generation options
   * @param retryOptions - Options for retry behavior
   * @returns The generated token
   * @throws AuthTestError if token generation fails after retries
   */
  async generateToken(
    options: GenerateTokenOptions = {},
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<string> {
    try {
      return await withRetry(
        async () => {
          try {
            return generateTestToken(options, this.jwtSecret);
          } catch (error) {
            throw new AuthTestError(
              AuthTestErrorType.TOKEN_GENERATION_FAILED,
              `Failed to generate token: ${error instanceof Error ? error.message : String(error)}`,
              error instanceof Error ? error : undefined
            );
          }
        },
        retryOptions
      );
    } catch (error) {
      logger.error(`Token generation failed after retries: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Verifies and decodes a token
   * 
   * @param token - The token to verify
   * @param retryOptions - Options for retry behavior
   * @returns The decoded token payload or null if invalid
   */
  async verifyToken(
    token: string,
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<TokenValidationResponseDto> {
    try {
      return await withRetry(
        async () => {
          try {
            const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
            return {
              valid: true,
              payload,
              error: null
            };
          } catch (error) {
            // For verification errors, we don't want to retry
            // but we want to return a structured response
            return {
              valid: false,
              payload: null,
              error: {
                code: 'TOKEN_INVALID',
                message: error instanceof Error ? error.message : String(error)
              }
            };
          }
        },
        retryOptions
      );
    } catch (error) {
      logger.error(`Token verification failed after retries: ${error instanceof Error ? error.message : String(error)}`);
      return {
        valid: false,
        payload: null,
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Token verification failed after multiple attempts'
        }
      };
    }
  }

  /**
   * Creates a mock user and generates a token for them
   * 
   * @param level - The permission level for the user
   * @param options - Token generation options
   * @param retryOptions - Options for retry behavior
   * @returns An object containing the user and their token
   * @throws AuthTestError if token generation fails after retries
   */
  async createUserWithToken(
    level: UserPermissionLevel = UserPermissionLevel.USER,
    options: Partial<GenerateTokenOptions> = {},
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<{ user: UserResponseDto; token: string }> {
    try {
      return await withRetry(async () => {
        try {
          const user = createMockUser(level);
          const token = await this.generateToken({
            userId: user.id,
            email: user.email,
            roles: user.roles.map(role => role.name),
            ...options
          }, retryOptions);

          return { user, token };
        } catch (error) {
          throw new AuthTestError(
            AuthTestErrorType.USER_CREATION_FAILED,
            `Failed to create user with token: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined
          );
        }
      }, retryOptions);
    } catch (error) {
      logger.error(`User creation with token failed after retries: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Creates a complete auth session for a user
   * 
   * @param level - The permission level for the user
   * @param options - Token generation options
   * @param retryOptions - Options for retry behavior
   * @returns An object containing the user and their session
   * @throws AuthTestError if session creation fails after retries
   */
  async createUserWithSession(
    level: UserPermissionLevel = UserPermissionLevel.USER,
    options: Partial<GenerateTokenOptions> = {},
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<{ user: UserResponseDto; session: AuthSession }> {
    try {
      return await withRetry(async () => {
        try {
          const user = createMockUser(level);
          
          // Generate access token with retry
          const accessToken = await this.generateToken({
            userId: user.id,
            email: user.email,
            roles: user.roles.map(role => role.name),
            ...options
          }, retryOptions);
          
          // Generate refresh token with retry
          const refreshToken = await this.generateToken({
            userId: user.id,
            email: user.email,
            expiresIn: '7d',
            ...options
          }, retryOptions);
          
          const session: AuthSession = {
            accessToken,
            refreshToken,
            expiresAt: Date.now() + 3600000, // 1 hour from now
            tokenType: 'Bearer'
          };

          return { user, session };
        } catch (error) {
          throw new AuthTestError(
            AuthTestErrorType.SESSION_CREATION_FAILED,
            `Failed to create user session: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined
          );
        }
      }, retryOptions);
    } catch (error) {
      logger.error(`User session creation failed after retries: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

/**
 * Interface for token blacklist operations
 */
export interface TokenBlacklistOperations {
  blacklistToken(token: string, reason?: string): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
  removeFromBlacklist(token: string): Promise<void>;
  clearBlacklist(): Promise<void>;
  getBlacklistedTokens(): Promise<string[]>;
}

/**
 * Creates a mock Redis token blacklist for testing
 * 
 * This simulates the Redis-backed token blacklist functionality
 * without requiring an actual Redis connection
 */
export class MockTokenBlacklist implements TokenBlacklistOperations {
  private readonly logger = new Logger('MockTokenBlacklist');
  private readonly tokenExpirations: Map<string, number> = new Map();
  private readonly tokenReasons: Map<string, string> = new Map();
  private blacklistedTokens: Set<string> = new Set();

  /**
   * Adds a token to the blacklist
   * 
   * @param token - The token to blacklist
   * @param reason - Optional reason for blacklisting
   * @param retryOptions - Options for retry behavior
   * @param expiresIn - Optional expiration time in milliseconds
   * @throws AuthTestError if blacklisting fails after retries
   */
  async blacklistToken(
    token: string, 
    reason: string = 'testing',
    retryOptions: Partial<RetryOptions> = {},
    expiresIn: number = 3600000 // 1 hour by default
  ): Promise<void> {
    try {
      await withRetry(async () => {
        try {
          this.blacklistedTokens.add(token);
          
          // Store expiration time for the token
          const expirationTime = Date.now() + expiresIn;
          this.tokenExpirations.set(token, expirationTime);
          
          // Store reason for blacklisting
          this.tokenReasons.set(token, reason);
          
          this.logger.debug(`Token blacklisted successfully: ${token.substring(0, 10)}... (Reason: ${reason}, Expires: ${new Date(expirationTime).toISOString()})`);
        } catch (error) {
          throw new AuthTestError(
            AuthTestErrorType.BLACKLIST_OPERATION_FAILED,
            `Failed to blacklist token: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined
          );
        }
      }, retryOptions);
    } catch (error) {
      logger.error(`Token blacklisting failed after retries: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Checks if a token is blacklisted
   * 
   * @param token - The token to check
   * @param retryOptions - Options for retry behavior
   * @returns True if the token is blacklisted, false otherwise
   * @throws AuthTestError if the check fails after retries
   */
  async isBlacklisted(
    token: string,
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<boolean> {
    try {
      return await withRetry(async () => {
        try {
          // Check if token is in the blacklist
          if (!this.blacklistedTokens.has(token)) {
            return false;
          }
          
          // Check if token has expired in the blacklist
          const expirationTime = this.tokenExpirations.get(token);
          if (expirationTime && Date.now() > expirationTime) {
            // Token has expired, remove it from the blacklist
            this.blacklistedTokens.delete(token);
            this.tokenExpirations.delete(token);
            this.logger.debug(`Expired token removed from blacklist: ${token.substring(0, 10)}...`);
            return false;
          }
          
          return true;
        } catch (error) {
          throw new AuthTestError(
            AuthTestErrorType.BLACKLIST_OPERATION_FAILED,
            `Failed to check if token is blacklisted: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined
          );
        }
      }, retryOptions);
    } catch (error) {
      logger.error(`Token blacklist check failed after retries: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Removes a token from the blacklist
   * 
   * @param token - The token to remove
   * @param retryOptions - Options for retry behavior
   * @throws AuthTestError if removal fails after retries
   */
  async removeFromBlacklist(
    token: string,
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<void> {
    try {
      await withRetry(async () => {
        try {
          const wasBlacklisted = this.blacklistedTokens.has(token);
          this.blacklistedTokens.delete(token);
          this.tokenExpirations.delete(token);
          this.tokenReasons.delete(token);
          
          if (wasBlacklisted) {
            this.logger.debug(`Token removed from blacklist: ${token.substring(0, 10)}...`);
          } else {
            this.logger.debug(`Token was not in blacklist: ${token.substring(0, 10)}...`);
          }
        } catch (error) {
          throw new AuthTestError(
            AuthTestErrorType.BLACKLIST_OPERATION_FAILED,
            `Failed to remove token from blacklist: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined
          );
        }
      }, retryOptions);
    } catch (error) {
      logger.error(`Token removal from blacklist failed after retries: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Clears all blacklisted tokens
   * 
   * @param retryOptions - Options for retry behavior
   * @throws AuthTestError if clearing fails after retries
   */
  async clearBlacklist(
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<void> {
    try {
      await withRetry(async () => {
        try {
          const count = this.blacklistedTokens.size;
          this.blacklistedTokens.clear();
          this.tokenExpirations.clear();
          this.tokenReasons.clear();
          this.logger.debug(`Cleared ${count} tokens from blacklist`);
        } catch (error) {
          throw new AuthTestError(
            AuthTestErrorType.BLACKLIST_OPERATION_FAILED,
            `Failed to clear blacklist: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined
          );
        }
      }, retryOptions);
    } catch (error) {
      logger.error(`Blacklist clearing failed after retries: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Gets all blacklisted tokens
   * 
   * @returns Array of blacklisted tokens
   */
  async getBlacklistedTokens(): Promise<string[]> {
    // Clean up expired tokens first
    await this.cleanupExpiredTokens();
    return Array.from(this.blacklistedTokens);
  }
  
  /**
   * Gets detailed information about blacklisted tokens
   * 
   * @returns Array of objects with token, reason, and expiration
   */
  async getBlacklistDetails(): Promise<Array<{ token: string; reason: string; expiresAt: number }>> {
    // Clean up expired tokens first
    await this.cleanupExpiredTokens();
    
    return Array.from(this.blacklistedTokens).map(token => ({
      token,
      reason: this.tokenReasons.get(token) || 'unknown',
      expiresAt: this.tokenExpirations.get(token) || 0
    }));
  }
  
  /**
   * Cleans up expired tokens from the blacklist
   */
  async cleanupExpiredTokens(): Promise<void> {
    const now = Date.now();
    const expiredTokens: string[] = [];
    
    // Find expired tokens
    this.tokenExpirations.forEach((expirationTime, token) => {
      if (now > expirationTime) {
        expiredTokens.push(token);
      }
    });
    
    // Remove expired tokens
    for (const token of expiredTokens) {
      this.blacklistedTokens.delete(token);
      this.tokenExpirations.delete(token);
      this.tokenReasons.delete(token);
    }
    
    if (expiredTokens.length > 0) {
      this.logger.debug(`Cleaned up ${expiredTokens.length} expired tokens from blacklist`);
    }
  }
}

/**
 * Default instances for convenience
 */
export const defaultJwtUtil = new JwtTestUtil();
export const defaultTokenBlacklist = new MockTokenBlacklist();
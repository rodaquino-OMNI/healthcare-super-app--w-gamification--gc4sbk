import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { LocalAuthGuard } from '../../src/guards/local-auth.guard';
import { JwtProvider } from '../../src/providers/jwt/jwt.provider';
import { JwtRedisProvider } from '../../src/providers/jwt/jwt-redis.provider';

/**
 * Interface for configuring mock JWT service behavior
 */
export interface MockJwtServiceOptions {
  /** Predefined token to return from sign method */
  signedToken?: string;
  /** Whether verify method should throw an error */
  verifyThrowsError?: boolean;
  /** Custom error to throw from verify method */
  verifyError?: Error;
  /** Predefined payload to return from verify method */
  verifyPayload?: Record<string, any>;
  /** Predefined payload to return from decode method */
  decodePayload?: Record<string, any>;
}

/**
 * Interface for configuring mock Auth service behavior
 */
export interface MockAuthServiceOptions {
  /** Whether validateUser method should throw an error */
  validateUserThrowsError?: boolean;
  /** Custom error to throw from validateUser method */
  validateUserError?: Error;
  /** Predefined user to return from validateUser method */
  validatedUser?: Record<string, any> | null;
  /** Whether login method should throw an error */
  loginThrowsError?: boolean;
  /** Custom error to throw from login method */
  loginError?: Error;
  /** Predefined response to return from login method */
  loginResponse?: { access_token: string; refresh_token?: string; user?: Record<string, any> };
}

/**
 * Interface for configuring mock Token service behavior
 */
export interface MockTokenServiceOptions {
  /** Predefined token to return from generateToken method */
  generatedToken?: string;
  /** Whether validateToken method should throw an error */
  validateTokenThrowsError?: boolean;
  /** Custom error to throw from validateToken method */
  validateTokenError?: Error;
  /** Predefined payload to return from validateToken method */
  validatedTokenPayload?: Record<string, any>;
  /** Whether refreshToken method should throw an error */
  refreshTokenThrowsError?: boolean;
  /** Predefined tokens to return from refreshToken method */
  refreshedTokens?: { access_token: string; refresh_token: string };
}

/**
 * Interface for configuring mock JWT provider behavior
 */
export interface MockJwtProviderOptions {
  /** Predefined token to return from sign method */
  signedToken?: string;
  /** Whether verify method should throw an error */
  verifyThrowsError?: boolean;
  /** Custom error to throw from verify method */
  verifyError?: Error;
  /** Predefined payload to return from verify method */
  verifyPayload?: Record<string, any>;
  /** Whether token is blacklisted */
  isBlacklisted?: boolean;
}

/**
 * Interface for configuring mock guard behavior
 */
export interface MockGuardOptions {
  /** Whether canActivate method should return true or false */
  canActivate?: boolean;
  /** Whether canActivate method should throw an error */
  throwsError?: boolean;
  /** Custom error to throw from canActivate method */
  error?: Error;
}

/**
 * Creates a mock JwtService with configurable behavior
 * @param options Configuration options for the mock service
 * @returns A mock JwtService instance
 */
export function createMockJwtService(options: MockJwtServiceOptions = {}): JwtService {
  const {
    signedToken = 'mock.jwt.token',
    verifyThrowsError = false,
    verifyError = new Error('Token verification failed'),
    verifyPayload = { sub: 'user-123', username: 'testuser', roles: ['user'] },
    decodePayload = { sub: 'user-123', username: 'testuser', roles: ['user'] },
  } = options;

  return {
    sign: jest.fn().mockReturnValue(signedToken),
    signAsync: jest.fn().mockResolvedValue(signedToken),
    verify: jest.fn().mockImplementation(() => {
      if (verifyThrowsError) throw verifyError;
      return verifyPayload;
    }),
    verifyAsync: jest.fn().mockImplementation(async () => {
      if (verifyThrowsError) throw verifyError;
      return verifyPayload;
    }),
    decode: jest.fn().mockReturnValue(decodePayload),
  } as unknown as JwtService;
}

/**
 * Creates a mock AuthService with configurable behavior
 * @param options Configuration options for the mock service
 * @returns A mock AuthService instance
 */
export function createMockAuthService(options: MockAuthServiceOptions = {}): AuthService {
  const {
    validateUserThrowsError = false,
    validateUserError = new Error('User validation failed'),
    validatedUser = { id: 'user-123', username: 'testuser', roles: ['user'] },
    loginThrowsError = false,
    loginError = new Error('Login failed'),
    loginResponse = { access_token: 'mock.jwt.token', refresh_token: 'mock.refresh.token', user: validatedUser },
  } = options;

  return {
    validateUser: jest.fn().mockImplementation(async () => {
      if (validateUserThrowsError) throw validateUserError;
      return validatedUser;
    }),
    login: jest.fn().mockImplementation(async () => {
      if (loginThrowsError) throw loginError;
      return loginResponse;
    }),
    register: jest.fn().mockImplementation(async (userData) => ({
      id: 'new-user-123',
      ...userData,
      roles: ['user'],
    })),
    validateToken: jest.fn().mockImplementation(async (token) => {
      if (!token || token === 'invalid-token') {
        throw new Error('Invalid token');
      }
      return { sub: 'user-123', username: 'testuser', roles: ['user'] };
    }),
    refreshToken: jest.fn().mockImplementation(async (refreshToken) => {
      if (!refreshToken || refreshToken === 'invalid-refresh-token') {
        throw new Error('Invalid refresh token');
      }
      return {
        access_token: 'new.mock.jwt.token',
        refresh_token: 'new.mock.refresh.token',
      };
    }),
  } as unknown as AuthService;
}

/**
 * Creates a mock TokenService with configurable behavior
 * @param options Configuration options for the mock service
 * @returns A mock TokenService instance
 */
export function createMockTokenService(options: MockTokenServiceOptions = {}): TokenService {
  const {
    generatedToken = 'mock.jwt.token',
    validateTokenThrowsError = false,
    validateTokenError = new Error('Token validation failed'),
    validatedTokenPayload = { sub: 'user-123', username: 'testuser', roles: ['user'] },
    refreshTokenThrowsError = false,
    refreshedTokens = { access_token: 'new.mock.jwt.token', refresh_token: 'new.mock.refresh.token' },
  } = options;

  return {
    generateToken: jest.fn().mockReturnValue(generatedToken),
    generateTokenAsync: jest.fn().mockResolvedValue(generatedToken),
    validateToken: jest.fn().mockImplementation(() => {
      if (validateTokenThrowsError) throw validateTokenError;
      return validatedTokenPayload;
    }),
    validateTokenAsync: jest.fn().mockImplementation(async () => {
      if (validateTokenThrowsError) throw validateTokenError;
      return validatedTokenPayload;
    }),
    refreshToken: jest.fn().mockImplementation(async () => {
      if (refreshTokenThrowsError) throw new Error('Refresh token failed');
      return refreshedTokens;
    }),
    decodeToken: jest.fn().mockReturnValue(validatedTokenPayload),
  } as unknown as TokenService;
}

/**
 * Creates a mock JwtProvider with configurable behavior
 * @param options Configuration options for the mock provider
 * @returns A mock JwtProvider instance
 */
export function createMockJwtProvider(options: MockJwtProviderOptions = {}): JwtProvider {
  const {
    signedToken = 'mock.jwt.token',
    verifyThrowsError = false,
    verifyError = new Error('Token verification failed'),
    verifyPayload = { sub: 'user-123', username: 'testuser', roles: ['user'] },
    isBlacklisted = false,
  } = options;

  return {
    sign: jest.fn().mockReturnValue(signedToken),
    signAsync: jest.fn().mockResolvedValue(signedToken),
    verify: jest.fn().mockImplementation(() => {
      if (verifyThrowsError) throw verifyError;
      return verifyPayload;
    }),
    verifyAsync: jest.fn().mockImplementation(async () => {
      if (verifyThrowsError) throw verifyError;
      return verifyPayload;
    }),
    decode: jest.fn().mockReturnValue(verifyPayload),
    isTokenBlacklisted: jest.fn().mockResolvedValue(isBlacklisted),
  } as unknown as JwtProvider;
}

/**
 * Creates a mock JwtRedisProvider with configurable behavior
 * @param options Configuration options for the mock provider
 * @returns A mock JwtRedisProvider instance
 */
export function createMockJwtRedisProvider(options: MockJwtProviderOptions = {}): JwtRedisProvider {
  const {
    signedToken = 'mock.jwt.token',
    verifyThrowsError = false,
    verifyError = new Error('Token verification failed'),
    verifyPayload = { sub: 'user-123', username: 'testuser', roles: ['user'] },
    isBlacklisted = false,
  } = options;

  return {
    sign: jest.fn().mockReturnValue(signedToken),
    signAsync: jest.fn().mockResolvedValue(signedToken),
    verify: jest.fn().mockImplementation(() => {
      if (verifyThrowsError) throw verifyError;
      return verifyPayload;
    }),
    verifyAsync: jest.fn().mockImplementation(async () => {
      if (verifyThrowsError) throw verifyError;
      return verifyPayload;
    }),
    decode: jest.fn().mockReturnValue(verifyPayload),
    isTokenBlacklisted: jest.fn().mockResolvedValue(isBlacklisted),
    blacklistToken: jest.fn().mockResolvedValue(undefined),
    removeFromBlacklist: jest.fn().mockResolvedValue(undefined),
  } as unknown as JwtRedisProvider;
}

/**
 * Creates a mock JwtAuthGuard with configurable behavior
 * @param options Configuration options for the mock guard
 * @returns A mock JwtAuthGuard instance
 */
export function createMockJwtAuthGuard(options: MockGuardOptions = {}): JwtAuthGuard {
  const {
    canActivate: canActivateResult = true,
    throwsError = false,
    error = new Error('Unauthorized'),
  } = options;

  class MockJwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
      if (throwsError) throw error;
      return canActivateResult;
    }
  }

  return new MockJwtAuthGuard() as JwtAuthGuard;
}

/**
 * Creates a mock RolesGuard with configurable behavior
 * @param options Configuration options for the mock guard
 * @returns A mock RolesGuard instance
 */
export function createMockRolesGuard(options: MockGuardOptions = {}): RolesGuard {
  const {
    canActivate: canActivateResult = true,
    throwsError = false,
    error = new Error('Forbidden'),
  } = options;

  class MockRolesGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
      if (throwsError) throw error;
      return canActivateResult;
    }
  }

  return new MockRolesGuard() as RolesGuard;
}

/**
 * Creates a mock LocalAuthGuard with configurable behavior
 * @param options Configuration options for the mock guard
 * @returns A mock LocalAuthGuard instance
 */
export function createMockLocalAuthGuard(options: MockGuardOptions = {}): LocalAuthGuard {
  const {
    canActivate: canActivateResult = true,
    throwsError = false,
    error = new Error('Invalid credentials'),
  } = options;

  class MockLocalAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
      if (throwsError) throw error;
      return canActivateResult;
    }
  }

  return new MockLocalAuthGuard() as LocalAuthGuard;
}

/**
 * Creates a mock guard that implements CanActivate with configurable behavior
 * @param options Configuration options for the mock guard
 * @returns A mock guard instance implementing CanActivate
 */
export function createMockGuard(options: MockGuardOptions = {}): CanActivate {
  const {
    canActivate: canActivateResult = true,
    throwsError = false,
    error = new Error('Guard error'),
  } = options;

  class MockGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
      if (throwsError) throw error;
      return canActivateResult;
    }
  }

  return new MockGuard();
}

/**
 * Creates NestJS provider definitions for mock authentication services
 * @param options Configuration options for the mock services
 * @returns An array of NestJS provider definitions
 */
export function createMockAuthProviders({
  jwtServiceOptions = {},
  authServiceOptions = {},
  tokenServiceOptions = {},
  jwtProviderOptions = {},
} = {}) {
  return [
    {
      provide: JwtService,
      useValue: createMockJwtService(jwtServiceOptions),
    },
    {
      provide: AuthService,
      useValue: createMockAuthService(authServiceOptions),
    },
    {
      provide: TokenService,
      useValue: createMockTokenService(tokenServiceOptions),
    },
    {
      provide: JwtProvider,
      useValue: createMockJwtProvider(jwtProviderOptions),
    },
  ];
}

/**
 * Creates a mock execution context for testing guards and interceptors
 * @param request Custom request object to include in the context
 * @returns A mock ExecutionContext instance
 */
export function createMockExecutionContext(request: any = {}): ExecutionContext {
  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: { id: 'user-123', username: 'testuser', roles: ['user'] },
        headers: { authorization: 'Bearer mock.jwt.token' },
        ...request,
      }),
      getResponse: jest.fn().mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      }),
    }),
    switchToRpc: jest.fn().mockReturnValue({
      getData: jest.fn().mockReturnValue({}),
    }),
    switchToWs: jest.fn().mockReturnValue({
      getClient: jest.fn().mockReturnValue({}),
      getData: jest.fn().mockReturnValue({}),
    }),
    getClass: jest.fn().mockReturnValue({
      name: 'TestController',
    }),
    getHandler: jest.fn().mockReturnValue({
      name: 'testMethod',
    }),
    getType: jest.fn().mockReturnValue('http'),
    getArgs: jest.fn().mockReturnValue([]),
  };

  return mockContext as unknown as ExecutionContext;
}

/**
 * Creates a mock request object for testing controllers and middleware
 * @param customProps Custom properties to include in the request
 * @returns A mock request object
 */
export function createMockRequest(customProps: Record<string, any> = {}) {
  return {
    user: { id: 'user-123', username: 'testuser', roles: ['user'] },
    headers: { authorization: 'Bearer mock.jwt.token' },
    query: {},
    params: {},
    body: {},
    ...customProps,
  };
}

/**
 * Creates a mock response object for testing controllers and middleware
 * @returns A mock response object with chainable methods
 */
export function createMockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Creates a factory function that generates mock users with specified roles
 * @returns A function that creates mock users with configurable properties
 */
export function createUserFactory() {
  return (overrides: Record<string, any> = {}) => ({
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    roles: ['user'],
    journeyPreferences: {
      health: { notifications: true },
      care: { notifications: true },
      plan: { notifications: true },
    },
    ...overrides,
  });
}

/**
 * Creates a factory function that generates mock JWT payloads
 * @returns A function that creates mock JWT payloads with configurable properties
 */
export function createJwtPayloadFactory() {
  return (overrides: Record<string, any> = {}) => ({
    sub: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    roles: ['user'],
    journeys: ['health', 'care', 'plan'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  });
}

/**
 * Creates a factory function that generates mock tokens
 * @returns A function that creates mock token responses with configurable properties
 */
export function createTokenFactory() {
  return (overrides: Record<string, any> = {}) => ({
    access_token: 'mock.jwt.token',
    refresh_token: 'mock.refresh.token',
    expires_in: 3600,
    token_type: 'Bearer',
    ...overrides,
  });
}
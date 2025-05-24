import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';

// Import interfaces from the auth package
import {
  IAuthResult,
  ILoginRequest,
  IRegisterRequest,
  ITokenPayload,
  ITokenResponse,
  IUser,
} from '../../src/interfaces';

/**
 * Creates a mock JwtService with configurable validation behavior
 * @param options Configuration options for the mock JWT service
 * @returns A mock JwtService instance
 */
export function createMockJwtService(options: {
  verifyReturn?: ITokenPayload | null;
  signReturn?: string;
  verifyError?: Error;
  signError?: Error;
} = {}) {
  const {
    verifyReturn = { sub: 'user-123', email: 'test@example.com', roles: ['user'] },
    signReturn = 'mock.jwt.token',
    verifyError = null,
    signError = null,
  } = options;

  const mockJwtService = {
    sign: jest.fn().mockImplementation(() => {
      if (signError) throw signError;
      return signReturn;
    }),
    verify: jest.fn().mockImplementation(() => {
      if (verifyError) throw verifyError;
      return verifyReturn;
    }),
    decode: jest.fn().mockImplementation(() => verifyReturn),
  };

  return mockJwtService as unknown as JwtService;
}

/**
 * Creates a mock AuthService with predefined responses for different test scenarios
 * @param options Configuration options for the mock auth service
 * @returns A mock AuthService instance
 */
export function createMockAuthService(options: {
  validateUserReturn?: IUser | null;
  validateUserError?: Error;
  loginReturn?: IAuthResult;
  loginError?: Error;
  registerReturn?: IAuthResult;
  registerError?: Error;
  refreshTokenReturn?: ITokenResponse;
  refreshTokenError?: Error;
  validateTokenReturn?: ITokenPayload | null;
  validateTokenError?: Error;
} = {}) {
  const {
    validateUserReturn = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['user'],
    },
    validateUserError = null,
    loginReturn = {
      success: true,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
      tokens: {
        accessToken: 'mock.access.token',
        refreshToken: 'mock.refresh.token',
        expiresIn: 3600,
      },
    },
    loginError = null,
    registerReturn = {
      success: true,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
      tokens: {
        accessToken: 'mock.access.token',
        refreshToken: 'mock.refresh.token',
        expiresIn: 3600,
      },
    },
    registerError = null,
    refreshTokenReturn = {
      accessToken: 'new.mock.access.token',
      refreshToken: 'new.mock.refresh.token',
      expiresIn: 3600,
    },
    refreshTokenError = null,
    validateTokenReturn = {
      sub: 'user-123',
      email: 'test@example.com',
      roles: ['user'],
    },
    validateTokenError = null,
  } = options;

  const mockAuthService = {
    validateUser: jest.fn().mockImplementation(() => {
      if (validateUserError) throw validateUserError;
      return Promise.resolve(validateUserReturn);
    }),
    login: jest.fn().mockImplementation(() => {
      if (loginError) throw loginError;
      return Promise.resolve(loginReturn);
    }),
    register: jest.fn().mockImplementation(() => {
      if (registerError) throw registerError;
      return Promise.resolve(registerReturn);
    }),
    refreshToken: jest.fn().mockImplementation(() => {
      if (refreshTokenError) throw refreshTokenError;
      return Promise.resolve(refreshTokenReturn);
    }),
    validateToken: jest.fn().mockImplementation(() => {
      if (validateTokenError) throw validateTokenError;
      return Promise.resolve(validateTokenReturn);
    }),
    logout: jest.fn().mockResolvedValue({ success: true }),
  };

  return mockAuthService;
}

/**
 * Creates a mock JWT auth guard with configurable behavior
 * @param options Configuration options for the mock guard
 * @returns A mock JWT auth guard class
 */
export function createMockJwtAuthGuard(options: {
  canActivate?: boolean;
  canActivateError?: Error;
} = {}) {
  const { canActivate = true, canActivateError = null } = options;

  class MockJwtAuthGuard {
    canActivate(context: ExecutionContext) {
      if (canActivateError) throw canActivateError;
      
      // If canActivate is true, set the user in the request object
      if (canActivate) {
        const request = context.switchToHttp().getRequest();
        request.user = {
          id: 'user-123',
          email: 'test@example.com',
          roles: ['user'],
        };
      }
      
      return canActivate;
    }
  }

  return MockJwtAuthGuard;
}

/**
 * Creates a mock Roles guard with configurable behavior
 * @param options Configuration options for the mock guard
 * @returns A mock Roles guard class
 */
export function createMockRolesGuard(options: {
  canActivate?: boolean;
  canActivateError?: Error;
  requiredRoles?: string[];
} = {}) {
  const {
    canActivate = true,
    canActivateError = null,
    requiredRoles = ['user'],
  } = options;

  class MockRolesGuard {
    // Store the required roles for testing
    requiredRoles = requiredRoles;
    
    canActivate(context: ExecutionContext) {
      if (canActivateError) throw canActivateError;
      
      // If we're allowing activation, ensure the user has the required roles
      if (canActivate) {
        const request = context.switchToHttp().getRequest();
        
        // If no user exists in the request, create one with the required roles
        if (!request.user) {
          request.user = {
            id: 'user-123',
            email: 'test@example.com',
            roles: this.requiredRoles,
          };
        }
      }
      
      return canActivate;
    }
  }

  return MockRolesGuard;
}

/**
 * Creates a mock Local auth guard with configurable behavior
 * @param options Configuration options for the mock guard
 * @returns A mock Local auth guard class
 */
export function createMockLocalAuthGuard(options: {
  canActivate?: boolean;
  canActivateError?: Error;
} = {}) {
  const { canActivate = true, canActivateError = null } = options;

  class MockLocalAuthGuard {
    canActivate(context: ExecutionContext) {
      if (canActivateError) throw canActivateError;
      
      // If canActivate is true, set the user in the request object
      if (canActivate) {
        const request = context.switchToHttp().getRequest();
        request.user = {
          id: 'user-123',
          email: 'test@example.com',
          roles: ['user'],
        };
      }
      
      return canActivate;
    }
  }

  return MockLocalAuthGuard;
}

/**
 * Creates a mock execution context for testing guards and interceptors
 * @param options Configuration options for the mock context
 * @returns A mock execution context
 */
export function createMockExecutionContext(options: {
  user?: IUser | null;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
} = {}) {
  const {
    user = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['user'],
    },
    headers = { authorization: 'Bearer mock.jwt.token' },
    body = {},
    params = {},
    query = {},
  } = options;

  const request = {
    user,
    headers,
    body,
    params,
    query,
  };

  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
      getResponse: jest.fn().mockReturnValue(response),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  };

  return mockExecutionContext as unknown as ExecutionContext;
}

/**
 * Creates a NestJS testing module with mock auth providers
 * @param options Configuration options for the testing module
 * @returns A configured NestJS testing module
 */
export async function createAuthTestingModule(options: {
  jwtServiceOptions?: Parameters<typeof createMockJwtService>[0];
  authServiceOptions?: Parameters<typeof createMockAuthService>[0];
  controllers?: any[];
  providers?: any[];
  imports?: any[];
} = {}) {
  const {
    jwtServiceOptions = {},
    authServiceOptions = {},
    controllers = [],
    providers = [],
    imports = [],
  } = options;

  const mockJwtService = createMockJwtService(jwtServiceOptions);
  const mockAuthService = createMockAuthService(authServiceOptions);

  const moduleRef = await Test.createTestingModule({
    imports,
    controllers,
    providers: [
      {
        provide: JwtService,
        useValue: mockJwtService,
      },
      {
        provide: 'AUTH_SERVICE',
        useValue: mockAuthService,
      },
      ...providers,
    ],
  }).compile();

  return {
    moduleRef,
    mockJwtService,
    mockAuthService,
  };
}

/**
 * Creates a mock user factory for generating test users with different roles
 * @returns A factory function for creating mock users
 */
export function createMockUserFactory() {
  return {
    /**
     * Creates a regular user
     * @param overrides Properties to override in the default user
     * @returns A mock user with 'user' role
     */
    createRegularUser: (overrides = {}) => ({
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      roles: ['user'],
      ...overrides,
    }),

    /**
     * Creates an admin user
     * @param overrides Properties to override in the default admin user
     * @returns A mock user with 'admin' role
     */
    createAdminUser: (overrides = {}) => ({
      id: 'admin-123',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin', 'user'],
      ...overrides,
    }),

    /**
     * Creates a health journey user
     * @param overrides Properties to override in the default health user
     * @returns A mock user with health journey roles
     */
    createHealthUser: (overrides = {}) => ({
      id: 'health-123',
      email: 'health@example.com',
      firstName: 'Health',
      lastName: 'User',
      roles: ['user', 'health:viewer'],
      ...overrides,
    }),

    /**
     * Creates a care journey user
     * @param overrides Properties to override in the default care user
     * @returns A mock user with care journey roles
     */
    createCareUser: (overrides = {}) => ({
      id: 'care-123',
      email: 'care@example.com',
      firstName: 'Care',
      lastName: 'User',
      roles: ['user', 'care:viewer'],
      ...overrides,
    }),

    /**
     * Creates a plan journey user
     * @param overrides Properties to override in the default plan user
     * @returns A mock user with plan journey roles
     */
    createPlanUser: (overrides = {}) => ({
      id: 'plan-123',
      email: 'plan@example.com',
      firstName: 'Plan',
      lastName: 'User',
      roles: ['user', 'plan:viewer'],
      ...overrides,
    }),

    /**
     * Creates a custom user with specified roles
     * @param roles Array of roles to assign to the user
     * @param overrides Properties to override in the default user
     * @returns A mock user with custom roles
     */
    createUserWithRoles: (roles: string[], overrides = {}) => ({
      id: 'custom-123',
      email: 'custom@example.com',
      firstName: 'Custom',
      lastName: 'User',
      roles,
      ...overrides,
    }),
  };
}
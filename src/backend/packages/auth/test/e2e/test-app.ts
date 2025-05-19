import { INestApplication, ModuleMetadata, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { Request, Response } from 'express';

// Import from @austa packages using standardized path aliases
import { BaseError } from '@austa/errors';
import { User, JwtPayload, LoginRequestDto, RegisterRequestDto } from '@austa/interfaces/auth';
import { PrismaService } from '@austa/database';

// Import auth components using relative paths
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { JwtStrategy } from '../../src/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/strategies/local.strategy';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { LocalAuthGuard } from '../../src/guards/local-auth.guard';
import { ROLES_KEY } from '../../src/decorators/roles.decorator';

/**
 * Configuration options for the test application
 */
export interface TestAppOptions {
  /** Enable or disable database mocking (default: true) */
  mockDatabase?: boolean;
  /** Enable or disable JWT service mocking (default: true) */
  mockJwtService?: boolean;
  /** Custom JWT secret for testing */
  jwtSecret?: string;
  /** JWT token expiration time */
  jwtExpiresIn?: string;
  /** Predefined test users to create */
  testUsers?: TestUser[];
  /** Additional NestJS providers to include */
  providers?: any[];
  /** Additional NestJS imports to include */
  imports?: any[];
  /** Additional NestJS controllers to include */
  controllers?: any[];
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Test user data structure
 */
export interface TestUser {
  /** User ID */
  id: string;
  /** User email */
  email: string;
  /** User password (plain text for testing) */
  password: string;
  /** User roles */
  roles?: string[];
  /** Additional user data */
  [key: string]: any;
}

/**
 * Default test users for authentication flows
 */
export const DEFAULT_TEST_USERS: TestUser[] = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123',
    roles: ['admin'],
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'user123',
    roles: ['user'],
    firstName: 'Regular',
    lastName: 'User',
    isActive: true,
  },
  {
    id: '3',
    email: 'health@example.com',
    password: 'health123',
    roles: ['user', 'health:viewer'],
    firstName: 'Health',
    lastName: 'User',
    isActive: true,
  },
  {
    id: '4',
    email: 'care@example.com',
    password: 'care123',
    roles: ['user', 'care:provider'],
    firstName: 'Care',
    lastName: 'Provider',
    isActive: true,
  },
  {
    id: '5',
    email: 'plan@example.com',
    password: 'plan123',
    roles: ['user', 'plan:admin'],
    firstName: 'Plan',
    lastName: 'Admin',
    isActive: true,
  },
  {
    id: '6',
    email: 'inactive@example.com',
    password: 'inactive123',
    roles: ['user'],
    firstName: 'Inactive',
    lastName: 'User',
    isActive: false,
  },
];

/**
 * Default JWT configuration for testing
 */
const DEFAULT_JWT_CONFIG = {
  secret: 'test-jwt-secret-key-for-e2e-testing',
  expiresIn: '1h',
};

/**
 * Mock implementation of PrismaService for testing
 */
export class MockPrismaService {
  private users: Map<string, User> = new Map();

  constructor(initialUsers: TestUser[] = []) {
    // Initialize with test users
    initialUsers.forEach(user => {
      this.users.set(user.id, {
        ...user,
        // In a real app, passwords would be hashed
        passwordHash: user.password,
      } as User);
    });
  }

  // Mock user operations
  user = {
    findUnique: jest.fn(({ where }) => {
      if (where.id) {
        return Promise.resolve(this.users.get(where.id) || null);
      }
      if (where.email) {
        return Promise.resolve(Array.from(this.users.values()).find(u => u.email === where.email) || null);
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn(() => {
      return Promise.resolve(Array.from(this.users.values()));
    }),
    create: jest.fn(({ data }) => {
      const newUser = {
        ...data,
        id: data.id || String(this.users.size + 1),
        passwordHash: data.password,
      };
      this.users.set(newUser.id, newUser as User);
      return Promise.resolve(newUser);
    }),
    update: jest.fn(({ where, data }) => {
      const user = this.users.get(where.id);
      if (!user) {
        return Promise.resolve(null);
      }
      const updatedUser = { ...user, ...data };
      this.users.set(where.id, updatedUser);
      return Promise.resolve(updatedUser);
    }),
    delete: jest.fn(({ where }) => {
      const user = this.users.get(where.id);
      if (!user) {
        return Promise.resolve(null);
      }
      this.users.delete(where.id);
      return Promise.resolve(user);
    }),
  };

  // Mock transaction handling
  $transaction = jest.fn((operations) => {
    if (Array.isArray(operations)) {
      return Promise.all(operations);
    }
    return operations(this);
  });

  // Mock connection management
  $connect = jest.fn(() => Promise.resolve());
  $disconnect = jest.fn(() => Promise.resolve());
}

/**
 * Mock implementation of TokenService for testing
 */
export class MockTokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly blacklistedTokens: Set<string> = new Set();

  constructor(
    private readonly jwtService: JwtService,
    options?: { secret?: string; expiresIn?: string },
  ) {
    this.jwtSecret = options?.secret || DEFAULT_JWT_CONFIG.secret;
    this.jwtExpiresIn = options?.expiresIn || DEFAULT_JWT_CONFIG.expiresIn;
  }

  generateAccessToken = jest.fn((payload: JwtPayload) => {
    return this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });
  });

  generateRefreshToken = jest.fn((payload: JwtPayload) => {
    return this.jwtService.sign({ ...payload, isRefreshToken: true }, {
      secret: this.jwtSecret,
      expiresIn: '7d',
    });
  });

  verifyToken = jest.fn((token: string) => {
    if (this.blacklistedTokens.has(token)) {
      throw new BaseError({
        message: 'Token has been revoked',
        code: 'AUTH_TOKEN_REVOKED',
      });
    }
    return this.jwtService.verify(token, { secret: this.jwtSecret });
  });

  decodeToken = jest.fn((token: string) => {
    return this.jwtService.decode(token) as JwtPayload;
  });

  blacklistToken = jest.fn((token: string) => {
    this.blacklistedTokens.add(token);
    return Promise.resolve(true);
  });

  isTokenBlacklisted = jest.fn((token: string) => {
    return Promise.resolve(this.blacklistedTokens.has(token));
  });
}

/**
 * Creates a test controller with protected routes for testing authentication
 */
export function createTestController() {
  class TestController {
    constructor(private readonly authService: AuthService) {}

    // Public route
    public async publicRoute(req: Request, res: Response) {
      return res.json({ message: 'Public route', authenticated: false });
    }

    // Protected route requiring authentication
    public async protectedRoute(req: Request, res: Response) {
      return res.json({ message: 'Protected route', authenticated: true, user: req.user });
    }

    // Route requiring admin role
    public async adminRoute(req: Request, res: Response) {
      return res.json({ message: 'Admin route', authenticated: true, user: req.user });
    }

    // Route requiring specific journey role
    public async journeyRoute(req: Request, res: Response) {
      return res.json({ message: 'Journey route', authenticated: true, user: req.user });
    }

    // Login route
    public async login(req: Request, res: Response) {
      const { email, password } = req.body as LoginRequestDto;
      const result = await this.authService.validateUser(email, password);
      return res.json(result);
    }

    // Register route
    public async register(req: Request, res: Response) {
      const userData = req.body as RegisterRequestDto;
      const result = await this.authService.register(userData);
      return res.json(result);
    }
  }

  // Add metadata for role-based access control
  Reflect.defineMetadata(ROLES_KEY, ['admin'], TestController.prototype.adminRoute);
  Reflect.defineMetadata(ROLES_KEY, ['health:viewer', 'care:provider', 'plan:admin'], TestController.prototype.journeyRoute);

  return TestController;
}

/**
 * Creates a NestJS test application for authentication testing
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication> {
  const {
    mockDatabase = true,
    mockJwtService = true,
    jwtSecret = DEFAULT_JWT_CONFIG.secret,
    jwtExpiresIn = DEFAULT_JWT_CONFIG.expiresIn,
    testUsers = DEFAULT_TEST_USERS,
    providers = [],
    imports = [],
    controllers = [],
    debug = false,
  } = options;

  // Create test controller
  const TestController = createTestController();

  // Configure JWT module
  const jwtModuleOptions = {
    secret: jwtSecret,
    signOptions: { expiresIn: jwtExpiresIn },
  };

  // Create module metadata
  const moduleMetadata: ModuleMetadata = {
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => ({
          auth: {
            jwt: {
              secret: jwtSecret,
              accessTokenExpiration: jwtExpiresIn,
              refreshTokenExpiration: '7d',
            },
          },
        })],
      }),
      PassportModule,
      JwtModule.register(jwtModuleOptions),
      ...imports,
    ],
    controllers: [TestController, ...controllers],
    providers: [
      // Core providers
      AuthService,
      {
        provide: TokenService,
        useFactory: (jwtService: JwtService) => {
          return mockJwtService
            ? new MockTokenService(jwtService, { secret: jwtSecret, expiresIn: jwtExpiresIn })
            : new TokenService(jwtService);
        },
        inject: [JwtService],
      },
      {
        provide: PrismaService,
        useFactory: () => {
          return mockDatabase ? new MockPrismaService(testUsers) : new PrismaService();
        },
      },
      // Authentication strategies
      LocalStrategy,
      JwtStrategy,
      // Guards
      JwtAuthGuard,
      LocalAuthGuard,
      RolesGuard,
      // Additional providers
      ...providers,
    ],
  };

  // Create test module
  const moduleRef = await Test.createTestingModule(moduleMetadata).compile();
  const app = moduleRef.createNestApplication();

  // Configure app
  app.use((req: Request, _res: Response, next: Function) => {
    if (debug) {
      console.log(`[${req.method}] ${req.url}`);
      if (Object.keys(req.body || {}).length > 0) {
        console.log('Body:', req.body);
      }
    }
    next();
  });

  await app.init();
  return app;
}

/**
 * Creates a test module for unit testing authentication components
 */
export async function createTestModule(options: TestAppOptions = {}): Promise<TestingModule> {
  const {
    mockDatabase = true,
    mockJwtService = true,
    jwtSecret = DEFAULT_JWT_CONFIG.secret,
    jwtExpiresIn = DEFAULT_JWT_CONFIG.expiresIn,
    testUsers = DEFAULT_TEST_USERS,
    providers = [],
    imports = [],
  } = options;

  // Configure JWT module
  const jwtModuleOptions = {
    secret: jwtSecret,
    signOptions: { expiresIn: jwtExpiresIn },
  };

  // Create module metadata
  const moduleMetadata: ModuleMetadata = {
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => ({
          auth: {
            jwt: {
              secret: jwtSecret,
              accessTokenExpiration: jwtExpiresIn,
              refreshTokenExpiration: '7d',
            },
          },
        })],
      }),
      PassportModule,
      JwtModule.register(jwtModuleOptions),
      ...imports,
    ],
    providers: [
      // Core providers
      AuthService,
      {
        provide: TokenService,
        useFactory: (jwtService: JwtService) => {
          return mockJwtService
            ? new MockTokenService(jwtService, { secret: jwtSecret, expiresIn: jwtExpiresIn })
            : new TokenService(jwtService);
        },
        inject: [JwtService],
      },
      {
        provide: PrismaService,
        useFactory: () => {
          return mockDatabase ? new MockPrismaService(testUsers) : new PrismaService();
        },
      },
      // Authentication strategies
      LocalStrategy,
      JwtStrategy,
      // Guards
      JwtAuthGuard,
      LocalAuthGuard,
      RolesGuard,
      // Additional providers
      ...providers,
    ],
  };

  // Create test module
  return Test.createTestingModule(moduleMetadata).compile();
}

/**
 * Helper function to generate a valid JWT token for testing
 */
export function generateTestToken(
  jwtService: JwtService,
  payload: Partial<JwtPayload> = {},
  options: { secret?: string; expiresIn?: string } = {},
): string {
  const secret = options.secret || DEFAULT_JWT_CONFIG.secret;
  const expiresIn = options.expiresIn || DEFAULT_JWT_CONFIG.expiresIn;

  const defaultPayload: JwtPayload = {
    sub: '1',
    email: 'test@example.com',
    roles: ['user'],
  };

  return jwtService.sign(
    { ...defaultPayload, ...payload },
    { secret, expiresIn },
  );
}

/**
 * Helper function to create an authenticated request for testing
 */
export function createAuthenticatedRequest(token: string): Partial<Request> {
  return {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
}
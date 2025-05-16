import { INestApplication, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import from the auth package
import { JwtStrategy } from '../../src/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/strategies/local.strategy';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../src/guards/local-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';

/**
 * Mock user for testing authentication
 */
export interface MockUser {
  id: string;
  email: string;
  password?: string;
  roles: string[];
  journeyRoles: string[];
}

/**
 * Configuration options for the test application
 */
export interface TestAppOptions {
  controllers?: Type<any>[];
  providers?: any[];
  imports?: any[];
  mockUsers?: MockUser[];
  enableOAuth?: boolean;
}

/**
 * Mock authentication service for testing
 */
export class MockAuthService {
  private users: MockUser[] = [
    {
      id: '1',
      email: 'test@example.com',
      password: 'password123',
      roles: ['user'],
      journeyRoles: ['health:viewer', 'care:user', 'plan:user']
    },
    {
      id: '2',
      email: 'admin@example.com',
      password: 'admin123',
      roles: ['admin', 'user'],
      journeyRoles: ['health:admin', 'care:admin', 'plan:admin']
    },
    {
      id: '3',
      email: 'oauth@example.com',
      roles: ['user'],
      journeyRoles: ['health:viewer', 'care:user', 'plan:user']
    }
  ];

  constructor(mockUsers?: MockUser[]) {
    if (mockUsers && mockUsers.length > 0) {
      this.users = mockUsers;
    }
  }

  async validateUser(username: string, password: string) {
    const user = this.users.find(u => u.email === username && u.password === password);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateOAuthUser(profile: any) {
    // For testing, we'll consider any OAuth profile with provider 'google' and providerId '12345' as valid
    if (profile.provider === 'google' && profile.providerId === '12345') {
      return this.users.find(u => u.email === 'oauth@example.com');
    }
    return null;
  }
}

/**
 * Mock token service for testing
 */
export class MockTokenService {
  private users: MockUser[] = [];
  
  constructor(mockUsers?: MockUser[]) {
    if (mockUsers && mockUsers.length > 0) {
      this.users = mockUsers;
    }
  }

  async generateToken(user: any) {
    // For testing, we'll use a predictable token format
    return `valid.jwt.token.${user.id}`;
  }

  async validateToken(token: string) {
    // Extract the user ID from the token
    const parts = token.split('.');
    if (parts.length === 4 && parts[0] === 'valid' && parts[1] === 'jwt' && parts[2] === 'token') {
      const userId = parts[3];
      const user = this.users.find(u => u.id === userId);
      if (user) {
        const { password, ...result } = user;
        return {
          sub: user.id,
          email: user.email,
          roles: user.roles,
          journeyRoles: user.journeyRoles
        };
      }
    }
    return null;
  }
}

/**
 * Mock user service for testing
 */
export class MockUserService {
  private users: MockUser[] = [];
  
  constructor(mockUsers?: MockUser[]) {
    if (mockUsers && mockUsers.length > 0) {
      this.users = mockUsers;
    }
  }

  async findById(id: string) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}

/**
 * Mock configuration service for testing
 */
export class MockConfigService {
  get(key: string) {
    const config = {
      JWT_SECRET: 'test-secret',
      JWT_AUDIENCE: 'test-audience',
      JWT_ISSUER: 'test-issuer',
      JWT_EXPIRATION: '1h',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
    };
    return config[key];
  }
}

/**
 * Creates a test application for authentication e2e tests
 * 
 * @param options Configuration options for the test application
 * @returns A promise that resolves to the test application
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication> {
  const mockUsers = options.mockUsers || [
    {
      id: '1',
      email: 'test@example.com',
      password: 'password123',
      roles: ['user'],
      journeyRoles: ['health:viewer', 'care:user', 'plan:user']
    },
    {
      id: '2',
      email: 'admin@example.com',
      password: 'admin123',
      roles: ['admin', 'user'],
      journeyRoles: ['health:admin', 'care:admin', 'plan:admin']
    },
    {
      id: '3',
      email: 'oauth@example.com',
      roles: ['user'],
      journeyRoles: ['health:viewer', 'care:user', 'plan:user']
    }
  ];

  const mockAuthService = new MockAuthService(mockUsers);
  const mockTokenService = new MockTokenService(mockUsers);
  const mockUserService = new MockUserService(mockUsers);

  const imports = [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
          audience: configService.get<string>('JWT_AUDIENCE'),
          issuer: configService.get<string>('JWT_ISSUER'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ...(options.imports || [])
  ];

  const providers = [
    { provide: AuthService, useValue: mockAuthService },
    { provide: TokenService, useValue: mockTokenService },
    { provide: ConfigService, useClass: MockConfigService },
    { provide: 'UsersService', useValue: mockUserService },
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    RolesGuard,
    ...(options.providers || [])
  ];

  const moduleRef = await Test.createTestingModule({
    imports,
    controllers: options.controllers || [],
    providers,
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return app;
}

/**
 * Generates a valid JWT token for testing
 * 
 * @param userId The user ID to include in the token
 * @returns A valid JWT token string
 */
export function generateTestToken(userId: string = '1'): string {
  return `valid.jwt.token.${userId}`;
}

/**
 * Generates an invalid JWT token for testing
 * 
 * @returns An invalid JWT token string
 */
export function generateInvalidToken(): string {
  return 'invalid.jwt.token';
}

/**
 * Generates an expired JWT token for testing
 * 
 * @param userId The user ID to include in the token
 * @returns An expired JWT token string
 */
export function generateExpiredToken(userId: string = '1'): string {
  return `expired.jwt.token.${userId}`;
}
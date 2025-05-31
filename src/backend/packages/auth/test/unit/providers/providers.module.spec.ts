import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamicModule, Provider } from '@nestjs/common';

// Import the module and interfaces to test
import { ProvidersModule, ProvidersModuleOptions } from '../../../src/providers/providers.module';
import { IJwtProvider } from '../../../src/providers/jwt/jwt.interface';
import { IDatabaseAuthProvider } from '../../../src/providers/database/database-auth-provider.interface';
import { JwtProvider } from '../../../src/providers/jwt/jwt.provider';
import { JwtRedisProvider } from '../../../src/providers/jwt/jwt-redis.provider';
import { DatabaseAuthProvider } from '../../../src/providers/database/database-auth-provider';
import { GoogleProvider } from '../../../src/providers/oauth/google.provider';
import { FacebookProvider } from '../../../src/providers/oauth/facebook.provider';
import { AppleProvider } from '../../../src/providers/oauth/apple.provider';

// Import mocks for dependencies
import { LoggerService } from '@austa/logging';
import { PrismaService } from '@austa/database';

// Mock dependencies
jest.mock('@austa/logging');
jest.mock('@austa/database');
jest.mock('../../../src/providers/jwt/jwt.provider');
jest.mock('../../../src/providers/jwt/jwt-redis.provider');
jest.mock('../../../src/providers/database/database-auth-provider');
jest.mock('../../../src/providers/oauth/google.provider');
jest.mock('../../../src/providers/oauth/facebook.provider');
jest.mock('../../../src/providers/oauth/apple.provider');

describe('ProvidersModule', () => {
  // Mock instances
  let mockConfigService: Partial<ConfigService>;
  let mockLoggerService: Partial<LoggerService>;
  let mockPrismaService: Partial<PrismaService>;

  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'auth.jwt.secret') return 'test-secret';
        if (key === 'auth.jwt.expiresIn') return '1h';
        return null;
      }),
    };

    mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };
  });

  describe('register', () => {
    it('should register the module with default options', async () => {
      // Spy on registerAsync method
      const registerAsyncSpy = jest.spyOn(ProvidersModule, 'registerAsync');

      // Call register method
      const result = ProvidersModule.register();

      // Verify registerAsync was called with default options factory
      expect(registerAsyncSpy).toHaveBeenCalledWith({
        useFactory: expect.any(Function),
      });

      // Verify the factory returns default options
      const factory = registerAsyncSpy.mock.calls[0][0].useFactory;
      const options = factory();
      expect(options).toEqual({
        useRedisForJwt: false,
        oauthProviders: [],
        useDatabaseAuth: true,
      });

      // Verify the result is a DynamicModule
      expect(result).toHaveProperty('module', ProvidersModule);
    });
  });

  describe('forRoot', () => {
    it('should register the module with custom options', async () => {
      // Spy on registerAsync method
      const registerAsyncSpy = jest.spyOn(ProvidersModule, 'registerAsync');

      // Custom options
      const customOptions: ProvidersModuleOptions = {
        useRedisForJwt: true,
        oauthProviders: ['google', 'facebook'],
        useDatabaseAuth: false,
      };

      // Call forRoot method with custom options
      const result = ProvidersModule.forRoot(customOptions);

      // Verify registerAsync was called with custom options factory
      expect(registerAsyncSpy).toHaveBeenCalledWith({
        useFactory: expect.any(Function),
      });

      // Verify the factory returns custom options
      const factory = registerAsyncSpy.mock.calls[0][0].useFactory;
      const options = factory();
      expect(options).toEqual(customOptions);

      // Verify the result is a DynamicModule
      expect(result).toHaveProperty('module', ProvidersModule);
    });

    it('should use default options when none are provided', async () => {
      // Spy on registerAsync method
      const registerAsyncSpy = jest.spyOn(ProvidersModule, 'registerAsync');

      // Call forRoot method without options
      const result = ProvidersModule.forRoot();

      // Verify the factory returns default options
      const factory = registerAsyncSpy.mock.calls[0][0].useFactory;
      const options = factory();
      expect(options).toEqual({
        useRedisForJwt: false,
        oauthProviders: [],
        useDatabaseAuth: true,
      });
    });
  });

  describe('registerAsync', () => {
    it('should register the module with async options', async () => {
      // Custom options
      const customOptions: ProvidersModuleOptions = {
        useRedisForJwt: true,
        oauthProviders: ['google'],
        useDatabaseAuth: true,
      };

      // Create a module with async options
      const moduleRef = await Test.createTestingModule({
        imports: [
          ProvidersModule.registerAsync({
            imports: [ConfigModule],
            useFactory: () => customOptions,
            inject: [ConfigService],
          }),
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      // Get the module
      const module = moduleRef.get(ProvidersModule);

      // Verify the module was created
      expect(module).toBeDefined();

      // Verify the module options provider was registered
      const optionsProvider = moduleRef.get('PROVIDERS_MODULE_OPTIONS');
      expect(optionsProvider).toEqual(customOptions);
    });

    it('should include ConfigModule in imports', async () => {
      // Get the dynamic module
      const dynamicModule = ProvidersModule.registerAsync({
        useFactory: () => ({}),
      });

      // Verify ConfigModule is included in imports
      expect(dynamicModule.imports).toContain(ConfigModule);
    });

    it('should include additional imports if provided', async () => {
      // Mock additional module
      class TestModule {}

      // Get the dynamic module with additional imports
      const dynamicModule = ProvidersModule.registerAsync({
        imports: [TestModule],
        useFactory: () => ({}),
      });

      // Verify additional imports are included
      expect(dynamicModule.imports).toContain(TestModule);
      expect(dynamicModule.imports).toContain(ConfigModule);
    });
  });

  describe('Provider Creation', () => {
    it('should create JwtProvider when useRedisForJwt is false', async () => {
      // Create a module with useRedisForJwt: false
      const moduleRef = await Test.createTestingModule({
        imports: [
          ProvidersModule.forRoot({
            useRedisForJwt: false,
          }),
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      // Get the JWT provider
      const jwtProvider = moduleRef.get(IJwtProvider);

      // Verify the provider is an instance of JwtProvider
      expect(JwtProvider).toHaveBeenCalled();
      expect(jwtProvider).toBeDefined();
    });

    it('should create JwtRedisProvider when useRedisForJwt is true', async () => {
      // Create a module with useRedisForJwt: true
      const moduleRef = await Test.createTestingModule({
        imports: [
          ProvidersModule.forRoot({
            useRedisForJwt: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      // Get the JWT provider
      const jwtProvider = moduleRef.get(IJwtProvider);

      // Verify the provider is an instance of JwtRedisProvider
      expect(JwtRedisProvider).toHaveBeenCalled();
      expect(jwtProvider).toBeDefined();
    });

    it('should create DatabaseAuthProvider when useDatabaseAuth is true', async () => {
      // Create a module with useDatabaseAuth: true
      const moduleRef = await Test.createTestingModule({
        imports: [
          ProvidersModule.forRoot({
            useDatabaseAuth: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      // Get the database auth provider
      const databaseAuthProvider = moduleRef.get(IDatabaseAuthProvider);

      // Verify the provider is an instance of DatabaseAuthProvider
      expect(DatabaseAuthProvider).toHaveBeenCalled();
      expect(databaseAuthProvider).toBeDefined();
    });

    it('should not create DatabaseAuthProvider when useDatabaseAuth is false', async () => {
      // Create a module with useDatabaseAuth: false
      const moduleRef = await Test.createTestingModule({
        imports: [
          ProvidersModule.forRoot({
            useDatabaseAuth: false,
          }),
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      // Verify DatabaseAuthProvider was not called
      expect(DatabaseAuthProvider).not.toHaveBeenCalled();

      // Verify the provider is null
      const databaseAuthProvider = moduleRef.get(IDatabaseAuthProvider);
      expect(databaseAuthProvider).toBeNull();
    });

    it('should create OAuth providers based on oauthProviders option', async () => {
      // Create a module with all OAuth providers
      const moduleRef = await Test.createTestingModule({
        imports: [
          ProvidersModule.forRoot({
            oauthProviders: ['google', 'facebook', 'apple'],
          }),
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      // Get the OAuth providers
      const googleProvider = moduleRef.get(GoogleProvider);
      const facebookProvider = moduleRef.get(FacebookProvider);
      const appleProvider = moduleRef.get(AppleProvider);

      // Verify the providers were created
      expect(GoogleProvider).toHaveBeenCalled();
      expect(FacebookProvider).toHaveBeenCalled();
      expect(AppleProvider).toHaveBeenCalled();
      expect(googleProvider).toBeDefined();
      expect(facebookProvider).toBeDefined();
      expect(appleProvider).toBeDefined();
    });

    it('should not create OAuth providers when not included in oauthProviders option', async () => {
      // Create a module with only Google OAuth provider
      const moduleRef = await Test.createTestingModule({
        imports: [
          ProvidersModule.forRoot({
            oauthProviders: ['google'],
          }),
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      // Verify only GoogleProvider was called
      expect(GoogleProvider).toHaveBeenCalled();
      expect(FacebookProvider).not.toHaveBeenCalled();
      expect(AppleProvider).not.toHaveBeenCalled();

      // Verify only Google provider is defined
      const googleProvider = moduleRef.get(GoogleProvider);
      expect(googleProvider).toBeDefined();

      // Verify other providers are null
      const facebookProvider = moduleRef.get(FacebookProvider);
      const appleProvider = moduleRef.get(AppleProvider);
      expect(facebookProvider).toBeNull();
      expect(appleProvider).toBeNull();
    });
  });

  describe('Module Exports', () => {
    it('should export all providers', async () => {
      // Get the dynamic module
      const dynamicModule = ProvidersModule.registerAsync({
        useFactory: () => ({}),
      });

      // Verify exports include all providers
      expect(dynamicModule.exports).toContain(IJwtProvider);
      expect(dynamicModule.exports).toContain(IDatabaseAuthProvider);
      expect(dynamicModule.exports).toContain(GoogleProvider);
      expect(dynamicModule.exports).toContain(FacebookProvider);
      expect(dynamicModule.exports).toContain(AppleProvider);
    });

    it('should allow consumers to inject providers', async () => {
      // Create a consumer module that injects providers
      class ConsumerService {
        constructor(
          private readonly jwtProvider: IJwtProvider,
          private readonly databaseAuthProvider: IDatabaseAuthProvider,
          private readonly googleProvider: GoogleProvider,
        ) {}
      }

      // Create a module with the consumer service
      const moduleRef = await Test.createTestingModule({
        imports: [
          ProvidersModule.forRoot({
            useRedisForJwt: false,
            oauthProviders: ['google'],
            useDatabaseAuth: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: PrismaService, useValue: mockPrismaService },
          ConsumerService,
        ],
      }).compile();

      // Get the consumer service
      const consumerService = moduleRef.get(ConsumerService);

      // Verify the service was created with injected providers
      expect(consumerService).toBeDefined();
    });
  });
});
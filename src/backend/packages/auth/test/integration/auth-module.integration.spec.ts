import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { INestApplication, Module } from '@nestjs/common';

// Import the module and components to test
import { AuthModule } from '../../src/auth.module';
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { JwtStrategy } from '../../src/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/strategies/local.strategy';
import { OAuthStrategy } from '../../src/strategies/oauth.strategy';
import { JwtProvider } from '../../src/providers/jwt/jwt.provider';
import { JwtRedisProvider } from '../../src/providers/jwt/jwt-redis.provider';

// Mock modules that would be imported by AuthModule
@Module({})
class MockErrorsModule {}

@Module({})
class MockLoggingModule {}

@Module({})
class MockDatabaseModule {}

// Create a test consumer module to verify exports
@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: 'CONSUMER_SERVICE',
      useFactory: (authService: AuthService, tokenService: TokenService) => {
        // This factory will fail if AuthService or TokenService are not properly exported
        return { authService, tokenService };
      },
      inject: [AuthService, TokenService],
    },
  ],
})
class TestConsumerModule {}

describe('AuthModule Integration', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    // Clear environment variables before each test
    process.env.AUTH_JWT_SECRET = undefined;
    process.env.AUTH_JWT_ACCESS_TOKEN_EXPIRATION = undefined;
    process.env.JWT_SECRET = undefined;
    process.env.JWT_ISSUER = undefined;
    process.env.JWT_AUDIENCE = undefined;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Module Initialization', () => {
    it('should initialize with default configuration', async () => {
      // Arrange & Act
      moduleRef = await Test.createTestingModule({
        imports: [
          // Import AuthModule with mocked dependencies
          {
            module: AuthModule,
            imports: [
              ConfigModule.forRoot({ isGlobal: true }),
              MockErrorsModule,
              MockLoggingModule,
              MockDatabaseModule,
            ],
          },
        ],
      })
        .overrideProvider('USER_SERVICE')
        .useValue({ findById: jest.fn() })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();

      // Assert
      const authService = moduleRef.get<AuthService>(AuthService);
      const tokenService = moduleRef.get<TokenService>(TokenService);
      const jwtService = moduleRef.get<JwtService>(JwtService);

      expect(authService).toBeDefined();
      expect(tokenService).toBeDefined();
      expect(jwtService).toBeDefined();
    });

    it('should initialize with custom environment variables', async () => {
      // Arrange
      process.env.AUTH_JWT_SECRET = 'test-secret';
      process.env.AUTH_JWT_ACCESS_TOKEN_EXPIRATION = '30m';
      process.env.JWT_ISSUER = 'test-issuer';
      process.env.JWT_AUDIENCE = 'test-audience';

      // Act
      moduleRef = await Test.createTestingModule({
        imports: [
          {
            module: AuthModule,
            imports: [
              ConfigModule.forRoot({ isGlobal: true }),
              MockErrorsModule,
              MockLoggingModule,
              MockDatabaseModule,
            ],
          },
        ],
      })
        .overrideProvider('USER_SERVICE')
        .useValue({ findById: jest.fn() })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();

      // Assert
      const configService = moduleRef.get<ConfigService>(ConfigService);
      expect(configService.get('AUTH_JWT_SECRET')).toBe('test-secret');
      expect(configService.get('AUTH_JWT_ACCESS_TOKEN_EXPIRATION')).toBe('30m');
      expect(configService.get('JWT_ISSUER')).toBe('test-issuer');
      expect(configService.get('JWT_AUDIENCE')).toBe('test-audience');
    });
  });

  describe('Provider Registration', () => {
    beforeEach(async () => {
      // Set up test environment variables
      process.env.AUTH_JWT_SECRET = 'test-secret';
      process.env.JWT_ISSUER = 'test-issuer';
      process.env.JWT_AUDIENCE = 'test-audience';

      moduleRef = await Test.createTestingModule({
        imports: [
          {
            module: AuthModule,
            imports: [
              ConfigModule.forRoot({ isGlobal: true }),
              MockErrorsModule,
              MockLoggingModule,
              MockDatabaseModule,
            ],
          },
        ],
      })
        .overrideProvider('USER_SERVICE')
        .useValue({ findById: jest.fn() })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    it('should register all required providers', () => {
      // Assert core services are registered
      expect(moduleRef.get(AuthService)).toBeDefined();
      expect(moduleRef.get(TokenService)).toBeDefined();
      
      // Assert strategies are registered
      expect(moduleRef.get(JwtStrategy)).toBeDefined();
      expect(moduleRef.get(LocalStrategy)).toBeDefined();
      expect(moduleRef.get(OAuthStrategy)).toBeDefined();
      
      // Assert guards are registered
      expect(moduleRef.get(JwtAuthGuard)).toBeDefined();
      expect(moduleRef.get(RolesGuard)).toBeDefined();
      
      // Assert JWT providers are registered
      expect(moduleRef.get(JwtProvider)).toBeDefined();
      expect(moduleRef.get(JwtRedisProvider)).toBeDefined();
    });

    it('should properly inject dependencies into providers', () => {
      // Get providers to test dependency injection
      const authService = moduleRef.get<AuthService>(AuthService);
      const tokenService = moduleRef.get<TokenService>(TokenService);
      const jwtStrategy = moduleRef.get<JwtStrategy>(JwtStrategy);
      
      // Verify providers have their dependencies injected
      expect(authService).toHaveProperty('tokenService');
      expect(tokenService).toHaveProperty('jwtProvider');
      expect(jwtStrategy).toHaveProperty('configService');
      expect(jwtStrategy).toHaveProperty('jwtRedisProvider');
    });
  });

  describe('Module Exports', () => {
    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          {
            module: AuthModule,
            imports: [
              MockErrorsModule,
              MockLoggingModule,
              MockDatabaseModule,
            ],
          },
          TestConsumerModule,
        ],
      })
        .overrideProvider('USER_SERVICE')
        .useValue({ findById: jest.fn() })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    it('should properly export services for consuming modules', () => {
      // Get the consumer service that depends on exported components
      const consumerService = moduleRef.get('CONSUMER_SERVICE');
      
      // Verify the consumer service has access to exported components
      expect(consumerService).toBeDefined();
      expect(consumerService.authService).toBeInstanceOf(AuthService);
      expect(consumerService.tokenService).toBeInstanceOf(TokenService);
    });

    it('should export guards for route protection', () => {
      // Verify guards are exported and available
      const jwtAuthGuard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
      const rolesGuard = moduleRef.get<RolesGuard>(RolesGuard);
      
      expect(jwtAuthGuard).toBeDefined();
      expect(rolesGuard).toBeDefined();
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration from environment variables', async () => {
      // Arrange
      process.env.AUTH_JWT_SECRET = 'env-secret';
      process.env.AUTH_JWT_ACCESS_TOKEN_EXPIRATION = '15m';
      process.env.JWT_ISSUER = 'env-issuer';
      process.env.JWT_AUDIENCE = 'env-audience';

      // Act
      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          {
            module: AuthModule,
            imports: [
              MockErrorsModule,
              MockLoggingModule,
              MockDatabaseModule,
            ],
          },
        ],
      })
        .overrideProvider('USER_SERVICE')
        .useValue({ findById: jest.fn() })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();

      // Assert
      const configService = moduleRef.get<ConfigService>(ConfigService);
      const jwtService = moduleRef.get<JwtService>(JwtService);
      
      // Verify configuration is loaded correctly
      expect(configService.get('AUTH_JWT_SECRET')).toBe('env-secret');
      expect(configService.get('AUTH_JWT_ACCESS_TOKEN_EXPIRATION')).toBe('15m');
      expect(configService.get('JWT_ISSUER')).toBe('env-issuer');
      expect(configService.get('JWT_AUDIENCE')).toBe('env-audience');
      
      // Verify JWT module is configured with the correct options
      expect(jwtService).toBeDefined();
      // Note: We can't directly access JwtModule options, but we can verify
      // the service is properly initialized with our configuration
    });

    it('should use default values when environment variables are not set', async () => {
      // Arrange - ensure environment variables are cleared
      process.env.AUTH_JWT_SECRET = undefined;
      process.env.AUTH_JWT_ACCESS_TOKEN_EXPIRATION = undefined;
      process.env.JWT_ISSUER = undefined;
      process.env.JWT_AUDIENCE = undefined;

      // Act
      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          {
            module: AuthModule,
            imports: [
              MockErrorsModule,
              MockLoggingModule,
              MockDatabaseModule,
            ],
          },
        ],
      })
        .overrideProvider('USER_SERVICE')
        .useValue({ findById: jest.fn() })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();

      // Assert
      const configService = moduleRef.get<ConfigService>(ConfigService);
      
      // Verify default values are used
      expect(configService.get('AUTH_JWT_ACCESS_TOKEN_EXPIRATION', '1h')).toBe('1h');
    });
  });

  describe('Global Module Availability', () => {
    // Define a test module that doesn't explicitly import AuthModule
    @Module({
      imports: [ConfigModule.forRoot()],
      providers: [
        {
          provide: 'TEST_SERVICE',
          useFactory: (authService: AuthService, jwtAuthGuard: JwtAuthGuard) => {
            return { authService, jwtAuthGuard };
          },
          inject: [AuthService, JwtAuthGuard],
        },
      ],
    })
    class StandaloneTestModule {}

    it('should make auth components available globally when AuthModule is imported as global', async () => {
      // Act
      moduleRef = await Test.createTestingModule({
        imports: [
          // Import AuthModule first (it's marked as @Global())
          {
            module: AuthModule,
            imports: [
              ConfigModule.forRoot({ isGlobal: true }),
              MockErrorsModule,
              MockLoggingModule,
              MockDatabaseModule,
            ],
          },
          // Then import a module that doesn't explicitly import AuthModule
          StandaloneTestModule,
        ],
      })
        .overrideProvider('USER_SERVICE')
        .useValue({ findById: jest.fn() })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();

      // Assert
      // If AuthModule is properly registered as global, the TEST_SERVICE should be able to inject its exports
      const testService = moduleRef.get('TEST_SERVICE');
      expect(testService).toBeDefined();
      expect(testService.authService).toBeInstanceOf(AuthService);
      expect(testService.jwtAuthGuard).toBeInstanceOf(JwtAuthGuard);
    });
  });

  describe('Journey-Specific Configuration', () => {
    it('should support journey-specific JWT configuration', async () => {
      // Arrange - set up journey-specific environment variables
      process.env.JWT_HEALTH_ISSUER = 'health-journey';
      process.env.JWT_CARE_ISSUER = 'care-journey';
      process.env.JWT_PLAN_ISSUER = 'plan-journey';
      
      // Act
      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          {
            module: AuthModule,
            imports: [
              MockErrorsModule,
              MockLoggingModule,
              MockDatabaseModule,
            ],
          },
        ],
      })
        .overrideProvider('USER_SERVICE')
        .useValue({ findById: jest.fn() })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();

      // Assert
      const configService = moduleRef.get<ConfigService>(ConfigService);
      
      // Verify journey-specific configuration is loaded
      expect(configService.get('JWT_HEALTH_ISSUER')).toBe('health-journey');
      expect(configService.get('JWT_CARE_ISSUER')).toBe('care-journey');
      expect(configService.get('JWT_PLAN_ISSUER')).toBe('plan-journey');
    });
  });
});
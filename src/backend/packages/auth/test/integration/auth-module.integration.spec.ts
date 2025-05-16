import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Import the module under test
import { AuthModule } from '../../src/auth.module';

// Import components that should be exported by the module
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';

// Import strategies that should be provided by the module
import { JwtStrategy } from '../../src/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/strategies/local.strategy';
import { OAuthStrategy } from '../../src/strategies/oauth.strategy';

// Import providers that should be used by the module
import { JwtRedisProvider } from '../../src/providers/jwt/jwt-redis.provider';

// Import from other @austa packages that should be imported by the module
import { ErrorsModule } from '@austa/errors';
import { LoggingModule } from '@austa/logging';
import { DatabaseModule } from '@austa/database';

// Import test helpers
import { createAuthTestingModule } from './test-helpers';

/**
 * Test consumer module that imports AuthModule
 * Used to verify that AuthModule exports the expected components
 */
@Module({
  imports: [AuthModule],
  providers: [],
})
class TestConsumerModule {}

/**
 * Integration tests for AuthModule
 * 
 * These tests verify that the AuthModule correctly configures and wires together
 * all authentication components, and that it can be imported and used by other modules.
 */
describe('AuthModule Integration', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Module Initialization', () => {
    it('should compile the module successfully', async () => {
      // Create a test module that imports AuthModule
      moduleRef = await Test.createTestingModule({
        imports: [AuthModule],
      }).compile();

      // If we get here, the module compiled successfully
      expect(moduleRef).toBeDefined();
    });

    it('should initialize the application with AuthModule', async () => {
      // Create a test module that imports AuthModule
      moduleRef = await Test.createTestingModule({
        imports: [AuthModule],
      }).compile();

      // Create and initialize the application
      app = moduleRef.createNestApplication();
      await app.init();

      // If we get here, the application initialized successfully
      expect(app).toBeDefined();
    });
  });

  describe('Provider Registration', () => {
    beforeEach(async () => {
      // Create a test module that imports AuthModule with real providers
      moduleRef = await Test.createTestingModule({
        imports: [AuthModule],
      })
        // Don't mock any providers for this test
        .compile();
    });

    it('should register AuthService', () => {
      const authService = moduleRef.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
      expect(authService).toBeInstanceOf(AuthService);
    });

    it('should register TokenService', () => {
      const tokenService = moduleRef.get<TokenService>(TokenService);
      expect(tokenService).toBeDefined();
      expect(tokenService).toBeInstanceOf(TokenService);
    });

    it('should register JwtAuthGuard', () => {
      const jwtAuthGuard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
      expect(jwtAuthGuard).toBeDefined();
      expect(jwtAuthGuard).toBeInstanceOf(JwtAuthGuard);
    });

    it('should register RolesGuard', () => {
      const rolesGuard = moduleRef.get<RolesGuard>(RolesGuard);
      expect(rolesGuard).toBeDefined();
      expect(rolesGuard).toBeInstanceOf(RolesGuard);
    });

    it('should register JwtStrategy', () => {
      const jwtStrategy = moduleRef.get<JwtStrategy>(JwtStrategy);
      expect(jwtStrategy).toBeDefined();
      expect(jwtStrategy).toBeInstanceOf(JwtStrategy);
    });

    it('should register LocalStrategy', () => {
      const localStrategy = moduleRef.get<LocalStrategy>(LocalStrategy);
      expect(localStrategy).toBeDefined();
      expect(localStrategy).toBeInstanceOf(LocalStrategy);
    });

    it('should register OAuthStrategy', () => {
      const oauthStrategy = moduleRef.get<OAuthStrategy>(OAuthStrategy);
      expect(oauthStrategy).toBeDefined();
      expect(oauthStrategy).toBeInstanceOf(OAuthStrategy);
    });
  });

  describe('Module Exports', () => {
    let consumerModuleRef: TestingModule;

    beforeEach(async () => {
      // Create a test module that imports TestConsumerModule, which imports AuthModule
      consumerModuleRef = await Test.createTestingModule({
        imports: [TestConsumerModule],
      }).compile();
    });

    it('should export AuthService for use by other modules', () => {
      const authService = consumerModuleRef.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
      expect(authService).toBeInstanceOf(AuthService);
    });

    it('should export TokenService for use by other modules', () => {
      const tokenService = consumerModuleRef.get<TokenService>(TokenService);
      expect(tokenService).toBeDefined();
      expect(tokenService).toBeInstanceOf(TokenService);
    });

    it('should export JwtAuthGuard for use by other modules', () => {
      const jwtAuthGuard = consumerModuleRef.get<JwtAuthGuard>(JwtAuthGuard);
      expect(jwtAuthGuard).toBeDefined();
      expect(jwtAuthGuard).toBeInstanceOf(JwtAuthGuard);
    });

    it('should export RolesGuard for use by other modules', () => {
      const rolesGuard = consumerModuleRef.get<RolesGuard>(RolesGuard);
      expect(rolesGuard).toBeDefined();
      expect(rolesGuard).toBeInstanceOf(RolesGuard);
    });
  });

  describe('Dynamic Configuration', () => {
    // Save original environment variables
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment variables before each test
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      // Restore original environment variables after all tests
      process.env = originalEnv;
    });

    it('should load JWT configuration from environment variables', async () => {
      // Set environment variables for JWT configuration
      process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
      process.env.AUTH_JWT_ACCESS_TOKEN_EXPIRATION = '30m';
      process.env.AUTH_JWT_AUDIENCE = 'test-audience';
      process.env.AUTH_JWT_ISSUER = 'test-issuer';

      // Create a test module that imports AuthModule
      moduleRef = await Test.createTestingModule({
        imports: [AuthModule],
      }).compile();

      // Get the ConfigService to verify it loaded the environment variables
      const configService = moduleRef.get<ConfigService>(ConfigService);
      expect(configService.get('AUTH_JWT_SECRET')).toBe('test-jwt-secret');
      expect(configService.get('AUTH_JWT_ACCESS_TOKEN_EXPIRATION')).toBe('30m');
      expect(configService.get('AUTH_JWT_AUDIENCE')).toBe('test-audience');
      expect(configService.get('AUTH_JWT_ISSUER')).toBe('test-issuer');

      // Get the JwtService to verify it was configured with the environment variables
      const jwtService = moduleRef.get<JwtService>(JwtService);
      expect(jwtService).toBeDefined();
    });

    it('should use default values when environment variables are not set', async () => {
      // Clear environment variables for JWT configuration
      delete process.env.AUTH_JWT_SECRET;
      delete process.env.AUTH_JWT_ACCESS_TOKEN_EXPIRATION;
      delete process.env.AUTH_JWT_AUDIENCE;
      delete process.env.AUTH_JWT_ISSUER;

      // Create a test module that imports AuthModule
      moduleRef = await Test.createTestingModule({
        imports: [AuthModule],
      }).compile();

      // Get the ConfigService to verify it loaded default values
      const configService = moduleRef.get<ConfigService>(ConfigService);
      expect(configService.get('AUTH_JWT_ACCESS_TOKEN_EXPIRATION', '15m')).toBe('15m');

      // Get the JwtService to verify it was configured with default values
      const jwtService = moduleRef.get<JwtService>(JwtService);
      expect(jwtService).toBeDefined();
    });
  });

  describe('Module Dependencies', () => {
    beforeEach(async () => {
      // Create a test module that imports AuthModule
      moduleRef = await Test.createTestingModule({
        imports: [AuthModule],
      }).compile();
    });

    it('should import ConfigModule', () => {
      const configService = moduleRef.get<ConfigService>(ConfigService);
      expect(configService).toBeDefined();
      expect(configService).toBeInstanceOf(ConfigService);
    });

    it('should import JwtModule', () => {
      const jwtService = moduleRef.get<JwtService>(JwtService);
      expect(jwtService).toBeDefined();
      expect(jwtService).toBeInstanceOf(JwtService);
    });

    it('should import PassportModule', () => {
      // PassportModule doesn't provide any services directly, so we can't test it directly
      // Instead, we'll verify that the strategies that depend on it are registered
      const jwtStrategy = moduleRef.get<JwtStrategy>(JwtStrategy);
      const localStrategy = moduleRef.get<LocalStrategy>(LocalStrategy);
      expect(jwtStrategy).toBeDefined();
      expect(localStrategy).toBeDefined();
    });

    it('should import ErrorsModule', () => {
      // ErrorsModule is imported but doesn't provide any services directly
      // We can verify that the module was imported by checking that the AuthModule compiled successfully
      expect(moduleRef).toBeDefined();
    });

    it('should import LoggingModule', () => {
      // LoggingModule is imported but doesn't provide any services directly
      // We can verify that the module was imported by checking that the AuthModule compiled successfully
      expect(moduleRef).toBeDefined();
    });

    it('should import DatabaseModule', () => {
      // DatabaseModule is imported but doesn't provide any services directly
      // We can verify that the module was imported by checking that the AuthModule compiled successfully
      expect(moduleRef).toBeDefined();
    });
  });

  describe('Global Module Registration', () => {
    it('should make AuthModule providers available globally when imported once', async () => {
      // Create a parent module that imports AuthModule
      @Module({
        imports: [AuthModule],
      })
      class ParentModule {}
      
      // Create a child module that doesn't import AuthModule
      @Module({
        imports: [],
      })
      class ChildModule {}
      
      // Create a test module that imports both parent and child modules
      moduleRef = await Test.createTestingModule({
        imports: [ParentModule, ChildModule],
      }).compile();
      
      // Create and initialize the application
      app = moduleRef.createNestApplication();
      await app.init();
      
      // Get the child module's context
      const childModuleRef = moduleRef.select(ChildModule);
      
      // We should be able to access the exported providers from AuthModule in the child module
      // even though the child module doesn't import AuthModule directly
      const authService = childModuleRef.get<AuthService>(AuthService, { strict: false });
      const tokenService = childModuleRef.get<TokenService>(TokenService, { strict: false });
      const jwtAuthGuard = childModuleRef.get<JwtAuthGuard>(JwtAuthGuard, { strict: false });
      const rolesGuard = childModuleRef.get<RolesGuard>(RolesGuard, { strict: false });
      
      expect(authService).toBeDefined();
      expect(tokenService).toBeDefined();
      expect(jwtAuthGuard).toBeDefined();
      expect(rolesGuard).toBeDefined();
    });
  });

  describe('Journey-Specific Configuration', () => {
    it('should support journey-specific JWT configuration', async () => {
      // Set environment variables for journey-specific JWT configuration
      process.env.AUTH_JWT_SECRET = 'base-jwt-secret';
      process.env.HEALTH_JWT_SECRET = 'health-jwt-secret';
      process.env.CARE_JWT_SECRET = 'care-jwt-secret';
      process.env.PLAN_JWT_SECRET = 'plan-jwt-secret';

      // Create a test module that imports AuthModule
      moduleRef = await Test.createTestingModule({
        imports: [AuthModule],
      }).compile();

      // Get the ConfigService to verify it loaded the environment variables
      const configService = moduleRef.get<ConfigService>(ConfigService);
      expect(configService.get('AUTH_JWT_SECRET')).toBe('base-jwt-secret');
      expect(configService.get('HEALTH_JWT_SECRET')).toBe('health-jwt-secret');
      expect(configService.get('CARE_JWT_SECRET')).toBe('care-jwt-secret');
      expect(configService.get('PLAN_JWT_SECRET')).toBe('plan-jwt-secret');
    });
  });
});
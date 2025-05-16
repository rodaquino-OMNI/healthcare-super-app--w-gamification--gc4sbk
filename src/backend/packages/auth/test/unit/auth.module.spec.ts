import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ModuleRef } from '@nestjs/core';

// Import the module to test
import { AuthModule } from '../../src/auth.module';

// Import the providers that should be exported by the module
import { AuthService } from '../../src/auth.service';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { JwtStrategy } from '../../src/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/strategies/local.strategy';
import { OAuthStrategy } from '../../src/strategies/oauth.strategy';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';

/**
 * Unit tests for the AuthModule.
 * 
 * These tests verify that the AuthModule is properly configured and exports
 * the expected providers. They also test the dynamic configuration of the
 * JWT module with different environment settings.
 * 
 * @group unit
 * @group auth
 */

// Mock dependencies
class MockConfigService {
  get(key: string) {
    const config = {
      'authService.jwt.secret': 'test-secret',
      'authService.jwt.accessTokenExpiration': '1h',
    };
    return config[key];
  }
}

// Mock configuration for testing different environments
const mockConfigurations = {
  development: {
    'authService.jwt.secret': 'dev-secret',
    'authService.jwt.accessTokenExpiration': '8h',
  },
  production: {
    'authService.jwt.secret': 'prod-secret',
    'authService.jwt.accessTokenExpiration': '1h',
  },
  testing: {
    'authService.jwt.secret': 'test-secret',
    'authService.jwt.accessTokenExpiration': '24h',
  },
};

// Mock the strategies and services that we don't need to test in detail
jest.mock('../../src/strategies/jwt.strategy', () => ({
  JwtStrategy: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockResolvedValue({ userId: 'test-user-id', username: 'testuser' }),
  })),
}));

jest.mock('../../src/strategies/local.strategy', () => ({
  LocalStrategy: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockResolvedValue({ userId: 'test-user-id', username: 'testuser' }),
  })),
}));

jest.mock('../../src/strategies/oauth.strategy', () => ({
  OAuthStrategy: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockResolvedValue({ userId: 'test-user-id', username: 'testuser' }),
  })),
}));

jest.mock('@austa/database', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'test-user-id', username: 'testuser' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'test-user-id', username: 'testuser' }]),
    },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@austa/logging', () => ({
  LoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  })),
}));

describe('AuthModule', () => {
  // Disable console errors during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
  });
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(ConfigService)
      .useClass(MockConfigService)
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  describe('module initialization and provider registration', () => {
    it('should initialize successfully', () => {
      const authModule = module.get(AuthModule);
      expect(authModule).toBeDefined();
    });

    it('should provide AuthService', () => {
      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('should provide JwtAuthGuard', () => {
      const jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
      expect(jwtAuthGuard).toBeDefined();
    });

    it('should provide RolesGuard', () => {
      const rolesGuard = module.get<RolesGuard>(RolesGuard);
      expect(rolesGuard).toBeDefined();
    });

    it('should provide JwtStrategy', () => {
      const jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
      expect(jwtStrategy).toBeDefined();
    });

    it('should provide LocalStrategy', () => {
      const localStrategy = module.get<LocalStrategy>(LocalStrategy);
      expect(localStrategy).toBeDefined();
    });

    it('should provide OAuthStrategy', () => {
      const oauthStrategy = module.get<OAuthStrategy>(OAuthStrategy);
      expect(oauthStrategy).toBeDefined();
    });

    it('should provide PrismaService', () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
    });

    it('should provide LoggerService', () => {
      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
    });
  });

  describe('module exports and dependency injection', () => {
    let testModule: TestingModule;
    
    beforeEach(async () => {
      // Create a test module that imports the AuthModule
      testModule = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();
    });
    
    it('should export AuthService', async () => {
      // Try to get the AuthService from the test module
      const authService = testModule.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('should export JwtAuthGuard', async () => {
      // Try to get the JwtAuthGuard from the test module
      const jwtAuthGuard = testModule.get<JwtAuthGuard>(JwtAuthGuard);
      expect(jwtAuthGuard).toBeDefined();
    });

    it('should export RolesGuard', async () => {
      // Try to get the RolesGuard from the test module
      const rolesGuard = testModule.get<RolesGuard>(RolesGuard);
      expect(rolesGuard).toBeDefined();
    });
    
    it('should not export internal providers', async () => {
      // Create a module that imports AuthModule
      const consumerModule = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();
      
      // These providers should not be accessible from outside the module
      const providers = [
        { token: JwtStrategy, name: 'JwtStrategy' },
        { token: LocalStrategy, name: 'LocalStrategy' },
        { token: OAuthStrategy, name: 'OAuthStrategy' },
        { token: PrismaService, name: 'PrismaService' },
        { token: LoggerService, name: 'LoggerService' },
      ];
      
      // Test each provider
      for (const { token, name } of providers) {
        try {
          consumerModule.get(token, { strict: true });
          fail(`${name} should not be exported from AuthModule`);
        } catch (error) {
          expect(error.message).toContain(`Nest can't resolve`);
        }
      }
    });
  });
  
  describe('JWT configuration', () => {
    it('should configure JwtModule with the correct options', async () => {
      // Get the JwtService from the module
      const jwtService = module.get<JwtService>(JwtService);
      expect(jwtService).toBeDefined();
      
      // Verify that the JwtService is configured with the correct secret
      // We can't directly access the configuration, but we can test that it works
      const payload = { sub: 'test-user-id', username: 'testuser' };
      const token = jwtService.sign(payload);
      expect(token).toBeDefined();
      
      // Verify that we can decode the token
      const decoded = jwtService.decode(token);
      expect(decoded).toHaveProperty('sub', 'test-user-id');
      expect(decoded).toHaveProperty('username', 'testuser');
      
      // Verify that we can verify the token with the correct secret
      const verified = jwtService.verify(token);
      expect(verified).toHaveProperty('sub', 'test-user-id');
      expect(verified).toHaveProperty('username', 'testuser');
    });
    
    it('should use the configured JWT expiration time', async () => {
      // Get the JwtService from the module
      const jwtService = module.get<JwtService>(JwtService);
      
      // Create a token and check its expiration
      const payload = { sub: 'test-user-id', username: 'testuser' };
      const token = jwtService.sign(payload);
      const decoded = jwtService.decode(token) as { exp: number, iat: number };
      
      // Calculate the difference between expiration and issued at times
      // For a 1h token, this should be close to 3600 seconds
      const expirationTime = decoded.exp - decoded.iat;
      
      // Allow for a small margin of error in the calculation
      expect(expirationTime).toBeGreaterThanOrEqual(3590); // Just under 1 hour
      expect(expirationTime).toBeLessThanOrEqual(3610); // Just over 1 hour
    });
  });
  
  describe('dynamic module configuration', () => {
    it('should configure the module with different JWT settings', async () => {
      // Create a custom config service with different settings
      class CustomConfigService extends MockConfigService {
        get(key: string) {
          const config = {
            'authService.jwt.secret': 'custom-secret',
            'authService.jwt.accessTokenExpiration': '2h',
          };
          return config[key];
        }
      }
      
      // Create a new module with the custom config
      const customModule = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(ConfigService)
        .useClass(CustomConfigService)
        .compile();
      
      // Get the JwtService from the custom module
      const jwtService = customModule.get<JwtService>(JwtService);
      expect(jwtService).toBeDefined();
      
      // Create a token and verify it works with the custom secret
      const payload = { sub: 'custom-user-id', username: 'customuser' };
      const token = jwtService.sign(payload);
      expect(token).toBeDefined();
      
      // Verify that we can decode the token
      const decoded = jwtService.decode(token);
      expect(decoded).toHaveProperty('sub', 'custom-user-id');
      expect(decoded).toHaveProperty('username', 'customuser');
      
      // Verify that we can verify the token with the custom secret
      const verified = jwtService.verify(token);
      expect(verified).toHaveProperty('sub', 'custom-user-id');
      expect(verified).toHaveProperty('username', 'customuser');
      
      // This should fail with the original module's JwtService
      const originalJwtService = module.get<JwtService>(JwtService);
      expect(() => {
        originalJwtService.verify(token);
      }).toThrow();
    });
    
    it('should support different environment configurations', async () => {
      // Test each environment configuration
      for (const [env, config] of Object.entries(mockConfigurations)) {
        // Create an environment-specific config service
        class EnvConfigService extends MockConfigService {
          get(key: string) {
            return config[key];
          }
        }
        
        // Create a module with the environment config
        const envModule = await Test.createTestingModule({
          imports: [AuthModule],
        })
          .overrideProvider(ConfigService)
          .useClass(EnvConfigService)
          .compile();
        
        // Get the JwtService
        const jwtService = envModule.get<JwtService>(JwtService);
        
        // Create a token and verify it works with the environment-specific secret
        const payload = { sub: `${env}-user-id`, username: `${env}user` };
        const token = jwtService.sign(payload);
        
        // Verify the token
        const verified = jwtService.verify(token);
        expect(verified).toHaveProperty('sub', `${env}-user-id`);
        
        // Check the expiration time based on the environment config
        const decoded = jwtService.decode(token) as { exp: number, iat: number };
        const expirationTime = decoded.exp - decoded.iat;
        
        // Convert the expiration string to seconds
        const expectedExpiration = parseInt(config['authService.jwt.accessTokenExpiration']) * 3600;
        
        // Allow for a small margin of error
        expect(expirationTime).toBeGreaterThanOrEqual(expectedExpiration - 10);
        expect(expirationTime).toBeLessThanOrEqual(expectedExpiration + 10);
      }
    });
  });
});
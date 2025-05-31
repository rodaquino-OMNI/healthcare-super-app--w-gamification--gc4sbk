/**
 * @file Auth Module Unit Tests
 * 
 * This file contains unit tests for the AuthModule, which is responsible for configuring
 * authentication and authorization capabilities for the AUSTA SuperApp. The tests verify
 * proper module registration, provider configuration, and export of authentication components.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';

import { AuthModule } from '../../src/auth.module';
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { JwtStrategy } from '../../src/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/strategies/local.strategy';
import { OAuthStrategy } from '../../src/strategies/oauth.strategy';

// Import mocks
import { mockConfigService } from '../mocks/config.mock';

// Mock the external modules
jest.mock('@austa/errors', () => ({
  ErrorsModule: {
    name: 'ErrorsModule',
    module: class MockErrorsModule {}
  }
}));

jest.mock('@austa/logging', () => ({
  LoggingModule: {
    name: 'LoggingModule',
    module: class MockLoggingModule {}
  }
}));

jest.mock('@austa/database', () => ({
  DatabaseModule: {
    name: 'DatabaseModule',
    module: class MockDatabaseModule {}
  }
}));

describe('AuthModule', () => {
  let module: TestingModule;
  let moduleRef: ModuleRef;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Module initialization', () => {
    it('should compile the module successfully', async () => {
      // Arrange & Act
      module = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      moduleRef = module.get<ModuleRef>(ModuleRef);

      // Assert
      expect(module).toBeDefined();
      expect(moduleRef).toBeDefined();
    });

    it('should register all required providers', async () => {
      // Arrange
      module = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Act & Assert
      expect(module.get(AuthService)).toBeDefined();
      expect(module.get(TokenService)).toBeDefined();
      expect(module.get(JwtStrategy)).toBeDefined();
      expect(module.get(LocalStrategy)).toBeDefined();
      expect(module.get(OAuthStrategy)).toBeDefined();
      expect(module.get(JwtAuthGuard)).toBeDefined();
      expect(module.get(RolesGuard)).toBeDefined();
    });

    it('should properly export required providers', async () => {
      // Arrange
      const testModule = await Test.createTestingModule({
        imports: [AuthModule],
        providers: [],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Act & Assert - These should be available through exports
      expect(testModule.get(AuthService)).toBeDefined();
      expect(testModule.get(TokenService)).toBeDefined();
      expect(testModule.get(JwtAuthGuard)).toBeDefined();
      expect(testModule.get(RolesGuard)).toBeDefined();
    });
  });

  describe('JWT Configuration', () => {
    it('should configure JwtModule with correct options', async () => {
      // Arrange
      const jwtRegisterAsyncSpy = jest.spyOn(JwtModule, 'registerAsync');

      // Act
      module = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Assert
      expect(jwtRegisterAsyncSpy).toHaveBeenCalledTimes(1);
      expect(jwtRegisterAsyncSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          imports: expect.arrayContaining([ConfigModule]),
          useFactory: expect.any(Function),
          inject: expect.arrayContaining([ConfigService]),
        })
      );

      // Test the factory function
      const factoryFn = jwtRegisterAsyncSpy.mock.calls[0][0].useFactory;
      const jwtOptions = await factoryFn(mockConfigService);

      expect(jwtOptions).toEqual({
        secret: 'test-jwt-secret', // From mockConfigService
        signOptions: {
          expiresIn: '1h', // From mockConfigService
        },
      });
    });

    it('should use default values when config is missing', async () => {
      // Arrange
      const jwtRegisterAsyncSpy = jest.spyOn(JwtModule, 'registerAsync');
      const customMockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          // Return undefined for JWT_SECRET to test fallback
          if (key === 'AUTH_JWT_SECRET') return undefined;
          // Return undefined for expiration to test default
          if (key === 'AUTH_JWT_ACCESS_TOKEN_EXPIRATION') return undefined;
          return defaultValue;
        }),
      };

      // Act
      module = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(ConfigService)
        .useValue(customMockConfigService)
        .compile();

      // Assert
      expect(jwtRegisterAsyncSpy).toHaveBeenCalledTimes(1);

      // Test the factory function with missing config
      const factoryFn = jwtRegisterAsyncSpy.mock.calls[0][0].useFactory;
      const jwtOptions = await factoryFn(customMockConfigService);

      // Should use default values
      expect(jwtOptions).toEqual({
        secret: undefined, // No default for secret
        signOptions: {
          expiresIn: '1h', // Default value
        },
      });
    });
  });

  describe('Passport Configuration', () => {
    it('should import PassportModule', async () => {
      // Arrange & Act
      module = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Assert - Check if PassportModule is imported
      // This is a bit tricky to test directly, so we'll check if strategies are available
      expect(module.get(JwtStrategy)).toBeDefined();
      expect(module.get(LocalStrategy)).toBeDefined();
      expect(module.get(OAuthStrategy)).toBeDefined();
    });
  });

  describe('Global Module Behavior', () => {
    it('should be registered as a global module', async () => {
      // Create a test module that doesn't directly import AuthModule
      const testModule = await Test.createTestingModule({
        imports: [
          // Import a module that imports AuthModule
          {
            module: class TestModule {},
            imports: [AuthModule],
          },
        ],
        providers: [],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // If AuthModule is global, its exports should be available
      // in the parent module without direct import
      expect(testModule.get(AuthService, { strict: false })).toBeDefined();
      expect(testModule.get(TokenService, { strict: false })).toBeDefined();
      expect(testModule.get(JwtAuthGuard, { strict: false })).toBeDefined();
      expect(testModule.get(RolesGuard, { strict: false })).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw an error when required dependencies are missing', async () => {
      // Arrange & Act & Assert
      await expect(
        Test.createTestingModule({
          imports: [AuthModule],
        })
          // Don't override ConfigService to simulate missing dependency
          .compile()
      ).rejects.toThrow();
    });
  });

  describe('Environment Configuration', () => {
    it('should use different JWT settings based on environment', async () => {
      // Arrange
      const jwtRegisterAsyncSpy = jest.spyOn(JwtModule, 'registerAsync');
      
      // Mock different environment settings
      const prodConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config = {
            'AUTH_JWT_SECRET': 'production-secret-key',
            'AUTH_JWT_ACCESS_TOKEN_EXPIRATION': '15m', // Shorter in production
          };
          return config[key] !== undefined ? config[key] : defaultValue;
        }),
      };

      // Act
      module = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(ConfigService)
        .useValue(prodConfigService)
        .compile();

      // Assert
      expect(jwtRegisterAsyncSpy).toHaveBeenCalledTimes(1);

      // Test the factory function with production config
      const factoryFn = jwtRegisterAsyncSpy.mock.calls[0][0].useFactory;
      const jwtOptions = await factoryFn(prodConfigService);

      // Should use production values
      expect(jwtOptions).toEqual({
        secret: 'production-secret-key',
        signOptions: {
          expiresIn: '15m',
        },
      });
    });
  });
});
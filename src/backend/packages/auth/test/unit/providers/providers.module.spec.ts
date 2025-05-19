/**
 * @file providers.module.spec.ts
 * @description Tests for the AuthProvidersModule to verify proper registration and configuration
 * of all authentication providers. Validates that the module correctly sets up factory providers,
 * handles configuration injection, and exports the providers for use by consuming applications.
 */

import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ModuleRef } from '@nestjs/core';

import { AuthProvidersModule } from '../../../src/providers/providers.module';
import { DatabaseAuthProvider } from '../../../src/providers/database/database-auth-provider';
import { JwtProvider } from '../../../src/providers/jwt/jwt.provider';
import { JwtRedisProvider } from '../../../src/providers/jwt/jwt-redis.provider';
import { GoogleOAuthProvider } from '../../../src/providers/oauth/google.provider';
import { FacebookOAuthProvider } from '../../../src/providers/oauth/facebook.provider';
import { AppleOAuthProvider } from '../../../src/providers/oauth/apple.provider';

import { LoggerService } from '@austa/logging';
import { PrismaService } from '@austa/database';
import { RedisService } from '@austa/database/redis';

import { ConfigServiceMock, LoggerMock, prismaMock } from '../../mocks';

// Mock Redis service
class RedisServiceMock {
  get = jest.fn().mockResolvedValue(null);
  set = jest.fn().mockResolvedValue('OK');
  del = jest.fn().mockResolvedValue(1);
  exists = jest.fn().mockResolvedValue(0);
  expire = jest.fn().mockResolvedValue(1);
}

// Mock JWT service
class JwtServiceMock {
  sign = jest.fn().mockReturnValue('mock.jwt.token');
  verify = jest.fn().mockReturnValue({ sub: '1', email: 'test@example.com' });
  decode = jest.fn().mockReturnValue({ sub: '1', email: 'test@example.com' });
}

describe('AuthProvidersModule', () => {
  describe('register', () => {
    it('should register the module with default options', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.register(),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: PrismaService, useValue: prismaMock },
          { provide: 'JwtService', useClass: JwtServiceMock },
        ],
      }).compile();

      // Act & Assert
      // Verify that the module was created successfully
      expect(moduleRef).toBeDefined();

      // Verify that the JWT provider was registered with default options
      const jwtProvider = moduleRef.get('JWT_PROVIDER');
      expect(jwtProvider).toBeInstanceOf(JwtProvider);

      // Verify that the database auth provider was registered with default options
      const dbAuthProvider = moduleRef.get('DATABASE_AUTH_PROVIDER');
      expect(dbAuthProvider).toBeInstanceOf(DatabaseAuthProvider);

      // Verify that no OAuth providers were registered by default
      expect(() => moduleRef.get('GOOGLE_OAUTH_PROVIDER')).toThrow();
      expect(() => moduleRef.get('FACEBOOK_OAUTH_PROVIDER')).toThrow();
      expect(() => moduleRef.get('APPLE_OAUTH_PROVIDER')).toThrow();
    });

    it('should register the module with custom options', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.register({
            useRedis: true,
            oauthProviders: ['google', 'facebook'],
            useDatabaseAuth: true,
            useJwtAuth: true,
          }),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: PrismaService, useValue: prismaMock },
          { provide: RedisService, useClass: RedisServiceMock },
          { provide: 'JwtService', useClass: JwtServiceMock },
        ],
      }).compile();

      // Act & Assert
      // Verify that the module was created successfully
      expect(moduleRef).toBeDefined();

      // Verify that the JWT provider was registered with Redis
      const jwtProvider = moduleRef.get('JWT_PROVIDER');
      expect(jwtProvider).toBeInstanceOf(JwtRedisProvider);

      // Verify that the database auth provider was registered
      const dbAuthProvider = moduleRef.get('DATABASE_AUTH_PROVIDER');
      expect(dbAuthProvider).toBeInstanceOf(DatabaseAuthProvider);

      // Verify that the specified OAuth providers were registered
      const googleProvider = moduleRef.get('GOOGLE_OAUTH_PROVIDER');
      expect(googleProvider).toBeInstanceOf(GoogleOAuthProvider);

      const facebookProvider = moduleRef.get('FACEBOOK_OAUTH_PROVIDER');
      expect(facebookProvider).toBeInstanceOf(FacebookOAuthProvider);

      // Verify that the Apple provider was not registered
      expect(() => moduleRef.get('APPLE_OAUTH_PROVIDER')).toThrow();
    });

    it('should register the module without JWT auth when specified', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.register({
            useJwtAuth: false,
            useDatabaseAuth: true,
          }),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: PrismaService, useValue: prismaMock },
        ],
      }).compile();

      // Act & Assert
      // Verify that the module was created successfully
      expect(moduleRef).toBeDefined();

      // Verify that the JWT provider was not registered
      expect(() => moduleRef.get('JWT_PROVIDER')).toThrow();

      // Verify that the database auth provider was registered
      const dbAuthProvider = moduleRef.get('DATABASE_AUTH_PROVIDER');
      expect(dbAuthProvider).toBeInstanceOf(DatabaseAuthProvider);
    });

    it('should register the module without database auth when specified', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.register({
            useJwtAuth: true,
            useDatabaseAuth: false,
          }),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: 'JwtService', useClass: JwtServiceMock },
        ],
      }).compile();

      // Act & Assert
      // Verify that the module was created successfully
      expect(moduleRef).toBeDefined();

      // Verify that the JWT provider was registered
      const jwtProvider = moduleRef.get('JWT_PROVIDER');
      expect(jwtProvider).toBeInstanceOf(JwtProvider);

      // Verify that the database auth provider was not registered
      expect(() => moduleRef.get('DATABASE_AUTH_PROVIDER')).toThrow();
    });

    it('should register all OAuth providers when specified', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.register({
            useJwtAuth: false,
            useDatabaseAuth: false,
            oauthProviders: ['google', 'facebook', 'apple'],
          }),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
        ],
      }).compile();

      // Act & Assert
      // Verify that the module was created successfully
      expect(moduleRef).toBeDefined();

      // Verify that all OAuth providers were registered
      const googleProvider = moduleRef.get('GOOGLE_OAUTH_PROVIDER');
      expect(googleProvider).toBeInstanceOf(GoogleOAuthProvider);

      const facebookProvider = moduleRef.get('FACEBOOK_OAUTH_PROVIDER');
      expect(facebookProvider).toBeInstanceOf(FacebookOAuthProvider);

      const appleProvider = moduleRef.get('APPLE_OAUTH_PROVIDER');
      expect(appleProvider).toBeInstanceOf(AppleOAuthProvider);

      // Verify that JWT and database auth providers were not registered
      expect(() => moduleRef.get('JWT_PROVIDER')).toThrow();
      expect(() => moduleRef.get('DATABASE_AUTH_PROVIDER')).toThrow();
    });
  });

  describe('registerAll', () => {
    it('should register all providers', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.registerAll(),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: PrismaService, useValue: prismaMock },
          { provide: RedisService, useClass: RedisServiceMock },
          { provide: 'JwtService', useClass: JwtServiceMock },
        ],
      }).compile();

      // Act & Assert
      // Verify that the module was created successfully
      expect(moduleRef).toBeDefined();

      // Verify that the JWT provider was registered with Redis
      const jwtProvider = moduleRef.get('JWT_PROVIDER');
      expect(jwtProvider).toBeInstanceOf(JwtRedisProvider);

      // Verify that the database auth provider was registered
      const dbAuthProvider = moduleRef.get('DATABASE_AUTH_PROVIDER');
      expect(dbAuthProvider).toBeInstanceOf(DatabaseAuthProvider);

      // Verify that all OAuth providers were registered
      const googleProvider = moduleRef.get('GOOGLE_OAUTH_PROVIDER');
      expect(googleProvider).toBeInstanceOf(GoogleOAuthProvider);

      const facebookProvider = moduleRef.get('FACEBOOK_OAUTH_PROVIDER');
      expect(facebookProvider).toBeInstanceOf(FacebookOAuthProvider);

      const appleProvider = moduleRef.get('APPLE_OAUTH_PROVIDER');
      expect(appleProvider).toBeInstanceOf(AppleOAuthProvider);
    });
  });

  describe('Provider Factory Functions', () => {
    it('should create JWT provider with correct dependencies', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.register(),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: 'JwtService', useClass: JwtServiceMock },
        ],
      }).compile();

      // Act
      const jwtProvider = moduleRef.get('JWT_PROVIDER');

      // Assert
      expect(jwtProvider).toBeInstanceOf(JwtProvider);
      
      // Verify that the provider has the correct dependencies
      // This is an indirect test since we can't easily inspect the constructor parameters
      expect(jwtProvider.decodeToken).toBeDefined();
      expect(jwtProvider.validateToken).toBeDefined();
      expect(jwtProvider.generateToken).toBeDefined();
    });

    it('should create JWT Redis provider with correct dependencies', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.register({
            useRedis: true,
          }),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: RedisService, useClass: RedisServiceMock },
          { provide: 'JwtService', useClass: JwtServiceMock },
        ],
      }).compile();

      // Act
      const jwtProvider = moduleRef.get('JWT_PROVIDER');

      // Assert
      expect(jwtProvider).toBeInstanceOf(JwtRedisProvider);
      
      // Verify that the provider has the correct dependencies
      expect(jwtProvider.decodeToken).toBeDefined();
      expect(jwtProvider.validateToken).toBeDefined();
      expect(jwtProvider.generateToken).toBeDefined();
      expect(jwtProvider.revokeToken).toBeDefined();
    });

    it('should create database auth provider with correct dependencies', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.register(),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: PrismaService, useValue: prismaMock },
        ],
      }).compile();

      // Act
      const dbAuthProvider = moduleRef.get('DATABASE_AUTH_PROVIDER');

      // Assert
      expect(dbAuthProvider).toBeInstanceOf(DatabaseAuthProvider);
      
      // Verify that the provider has the correct dependencies
      expect(dbAuthProvider.validateCredentials).toBeDefined();
      expect(dbAuthProvider.getUserById).toBeDefined();
    });

    it('should create OAuth providers with correct dependencies', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          AuthProvidersModule.register({
            oauthProviders: ['google', 'facebook', 'apple'],
          }),
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
        ],
      }).compile();

      // Act & Assert
      const googleProvider = moduleRef.get('GOOGLE_OAUTH_PROVIDER');
      expect(googleProvider).toBeInstanceOf(GoogleOAuthProvider);
      expect(googleProvider.validateToken).toBeDefined();
      expect(googleProvider.getUserProfile).toBeDefined();

      const facebookProvider = moduleRef.get('FACEBOOK_OAUTH_PROVIDER');
      expect(facebookProvider).toBeInstanceOf(FacebookOAuthProvider);
      expect(facebookProvider.validateToken).toBeDefined();
      expect(facebookProvider.getUserProfile).toBeDefined();

      const appleProvider = moduleRef.get('APPLE_OAUTH_PROVIDER');
      expect(appleProvider).toBeInstanceOf(AppleOAuthProvider);
      expect(appleProvider.validateToken).toBeDefined();
      expect(appleProvider.getUserProfile).toBeDefined();
    });
  });

  describe('Module Exports', () => {
    it('should export the JWT provider when enabled', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: 'JwtService', useClass: JwtServiceMock },
        ],
      }).compile();

      const dynamicModule = AuthProvidersModule.register({
        useJwtAuth: true,
        useDatabaseAuth: false,
      });

      // Act & Assert
      expect(dynamicModule.exports).toContain('JWT_PROVIDER');
      expect(dynamicModule.exports).not.toContain('DATABASE_AUTH_PROVIDER');
    });

    it('should export the database auth provider when enabled', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: PrismaService, useValue: prismaMock },
        ],
      }).compile();

      const dynamicModule = AuthProvidersModule.register({
        useJwtAuth: false,
        useDatabaseAuth: true,
      });

      // Act & Assert
      expect(dynamicModule.exports).toContain('DATABASE_AUTH_PROVIDER');
      expect(dynamicModule.exports).not.toContain('JWT_PROVIDER');
    });

    it('should export the OAuth providers when enabled', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
        ],
      }).compile();

      const dynamicModule = AuthProvidersModule.register({
        useJwtAuth: false,
        useDatabaseAuth: false,
        oauthProviders: ['google', 'facebook'],
      });

      // Act & Assert
      expect(dynamicModule.exports).toContain('GOOGLE_OAUTH_PROVIDER');
      expect(dynamicModule.exports).toContain('FACEBOOK_OAUTH_PROVIDER');
      expect(dynamicModule.exports).not.toContain('APPLE_OAUTH_PROVIDER');
    });

    it('should export all providers when using registerAll', async () => {
      // Arrange
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: LoggerService, useClass: LoggerMock },
          { provide: PrismaService, useValue: prismaMock },
          { provide: RedisService, useClass: RedisServiceMock },
          { provide: 'JwtService', useClass: JwtServiceMock },
        ],
      }).compile();

      const dynamicModule = AuthProvidersModule.registerAll();

      // Act & Assert
      expect(dynamicModule.exports).toContain('JWT_PROVIDER');
      expect(dynamicModule.exports).toContain('DATABASE_AUTH_PROVIDER');
      expect(dynamicModule.exports).toContain('GOOGLE_OAUTH_PROVIDER');
      expect(dynamicModule.exports).toContain('FACEBOOK_OAUTH_PROVIDER');
      expect(dynamicModule.exports).toContain('APPLE_OAUTH_PROVIDER');
    });
  });
});
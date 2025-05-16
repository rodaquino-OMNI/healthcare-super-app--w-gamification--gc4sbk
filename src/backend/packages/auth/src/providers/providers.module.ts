/**
 * @file Authentication Providers Module
 * 
 * This module registers and configures all authentication providers for dependency injection.
 * It serves as a unified entry point for all authentication mechanisms in the AUSTA SuperApp,
 * including database, JWT, and OAuth providers.
 *
 * @module @austa/auth/providers
 */

import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Import provider interfaces and implementations
import { DatabaseAuthProvider } from './database/database-auth-provider';
import { JwtProvider } from './jwt/jwt.provider';
import { JwtRedisProvider } from './jwt/jwt-redis.provider';
import { GoogleOAuthProvider } from './oauth/google.provider';
import { FacebookOAuthProvider } from './oauth/facebook.provider';
import { AppleOAuthProvider } from './oauth/apple.provider';

// Import configuration and types
import { JwtConfig } from './jwt/jwt.config';
import { LoggerService } from '@austa/logging';
import { PrismaService } from '@austa/database';
import { RedisService } from '@austa/database/redis';

/**
 * Configuration options for the AuthProvidersModule
 */
export interface AuthProvidersModuleOptions {
  /**
   * Whether to use Redis for token blacklisting and session management
   * @default false
   */
  useRedis?: boolean;
  
  /**
   * OAuth providers to register
   * @default []
   */
  oauthProviders?: ('google' | 'facebook' | 'apple')[];
  
  /**
   * Whether to register the database authentication provider
   * @default true
   */
  useDatabaseAuth?: boolean;
  
  /**
   * Whether to register the JWT authentication provider
   * @default true
   */
  useJwtAuth?: boolean;
  
  /**
   * Whether to use global guards for authentication
   * @default false
   */
  useGlobalGuards?: boolean;
}

/**
 * Default options for the AuthProvidersModule
 */
const defaultOptions: AuthProvidersModuleOptions = {
  useRedis: false,
  oauthProviders: [],
  useDatabaseAuth: true,
  useJwtAuth: true,
  useGlobalGuards: false,
};

/**
 * Module that registers and configures all authentication providers for dependency injection.
 * 
 * This module provides a unified way to register and configure authentication providers
 * across the AUSTA SuperApp, ensuring consistent authentication behavior across all services.
 */
@Module({
  imports: [
    ConfigModule,
  ],
})
export class AuthProvidersModule {
  /**
   * Registers the module with the provided options
   * 
   * @param options Configuration options for the module
   * @returns A dynamically configured module with the requested providers
   */
  static register(options?: AuthProvidersModuleOptions): DynamicModule {
    const moduleOptions = { ...defaultOptions, ...options };
    const providers: Provider[] = [];
    const exports: any[] = [];
    
    // Register JWT module if JWT authentication is enabled
    const imports = [
      ConfigModule,
    ];
    
    if (moduleOptions.useJwtAuth) {
      imports.push(
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwt.secret'),
            signOptions: {
              expiresIn: configService.get<string>('auth.jwt.accessTokenExpiration', '15m'),
              issuer: configService.get<string>('auth.jwt.issuer', 'austa-superapp'),
              audience: configService.get<string>('auth.jwt.audience', 'austa-users'),
            },
          }),
        }),
      );
      
      // Register the appropriate JWT provider based on Redis usage
      if (moduleOptions.useRedis) {
        providers.push({
          provide: 'JWT_PROVIDER',
          useFactory: (jwtService, configService, redisService, loggerService) => {
            return new JwtRedisProvider(
              jwtService,
              configService,
              redisService,
              loggerService,
            );
          },
          inject: ['JwtService', ConfigService, RedisService, LoggerService],
        });
      } else {
        providers.push({
          provide: 'JWT_PROVIDER',
          useFactory: (jwtService, configService, loggerService) => {
            return new JwtProvider(jwtService, configService, loggerService);
          },
          inject: ['JwtService', ConfigService, LoggerService],
        });
      }
      
      exports.push('JWT_PROVIDER');
    }
    
    // Register database authentication provider if enabled
    if (moduleOptions.useDatabaseAuth) {
      providers.push({
        provide: 'DATABASE_AUTH_PROVIDER',
        useFactory: (prismaService, loggerService, configService) => {
          return new DatabaseAuthProvider(prismaService, loggerService, configService);
        },
        inject: [PrismaService, LoggerService, ConfigService],
      });
      
      exports.push('DATABASE_AUTH_PROVIDER');
    }
    
    // Register OAuth providers if specified
    if (moduleOptions.oauthProviders && moduleOptions.oauthProviders.length > 0) {
      // Register Google OAuth provider if requested
      if (moduleOptions.oauthProviders.includes('google')) {
        providers.push({
          provide: 'GOOGLE_OAUTH_PROVIDER',
          useFactory: (configService, loggerService) => {
            return new GoogleOAuthProvider(configService, loggerService);
          },
          inject: [ConfigService, LoggerService],
        });
        
        exports.push('GOOGLE_OAUTH_PROVIDER');
      }
      
      // Register Facebook OAuth provider if requested
      if (moduleOptions.oauthProviders.includes('facebook')) {
        providers.push({
          provide: 'FACEBOOK_OAUTH_PROVIDER',
          useFactory: (configService, loggerService) => {
            return new FacebookOAuthProvider(configService, loggerService);
          },
          inject: [ConfigService, LoggerService],
        });
        
        exports.push('FACEBOOK_OAUTH_PROVIDER');
      }
      
      // Register Apple OAuth provider if requested
      if (moduleOptions.oauthProviders.includes('apple')) {
        providers.push({
          provide: 'APPLE_OAUTH_PROVIDER',
          useFactory: (configService, loggerService) => {
            return new AppleOAuthProvider(configService, loggerService);
          },
          inject: [ConfigService, LoggerService],
        });
        
        exports.push('APPLE_OAUTH_PROVIDER');
      }
    }
    
    // Add required services if not already provided by the application
    providers.push(LoggerService);
    
    return {
      module: AuthProvidersModule,
      imports,
      providers,
      exports,
    };
  }
  
  /**
   * Registers the module with all available providers
   * 
   * @returns A dynamically configured module with all authentication providers
   */
  static registerAll(): DynamicModule {
    return this.register({
      useRedis: true,
      oauthProviders: ['google', 'facebook', 'apple'],
      useDatabaseAuth: true,
      useJwtAuth: true,
    });
  }
}
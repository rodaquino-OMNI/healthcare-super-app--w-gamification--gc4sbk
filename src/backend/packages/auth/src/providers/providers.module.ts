import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import provider interfaces and implementations
import { JwtProvider } from './jwt/jwt.provider';
import { JwtRedisProvider } from './jwt/jwt-redis.provider';
import { DatabaseAuthProvider } from './database/database-auth-provider';

// Import OAuth providers
import { GoogleProvider } from './oauth/google.provider';
import { FacebookProvider } from './oauth/facebook.provider';
import { AppleProvider } from './oauth/apple.provider';

// Import provider interfaces
import { IJwtProvider } from './jwt/jwt.interface';
import { IDatabaseAuthProvider } from './database/database-auth-provider.interface';

// Import from @austa packages using path aliases
import { LoggerService } from '@austa/logging';
import { PrismaService } from '@austa/database';

/**
 * Configuration options for the ProvidersModule
 */
export interface ProvidersModuleOptions {
  /**
   * Whether to use Redis for JWT token blacklisting
   * @default false
   */
  useRedisForJwt?: boolean;
  
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
}

/**
 * Default provider module options
 */
const defaultOptions: ProvidersModuleOptions = {
  useRedisForJwt: false,
  oauthProviders: [],
  useDatabaseAuth: true,
};

/**
 * Module that registers and configures all authentication providers for dependency injection.
 * Provides factories for dynamically creating provider instances based on configuration.
 */
@Module({})
export class ProvidersModule {
  /**
   * Registers the module with default configuration
   */
  static register(): DynamicModule {
    return this.registerAsync({
      useFactory: () => defaultOptions,
    });
  }

  /**
   * Registers the module with custom configuration
   * @param options Configuration options for the providers module
   */
  static forRoot(options: ProvidersModuleOptions = defaultOptions): DynamicModule {
    return this.registerAsync({
      useFactory: () => options,
    });
  }

  /**
   * Registers the module with asynchronous configuration
   * @param options Async configuration options
   */
  static registerAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => ProvidersModuleOptions | Promise<ProvidersModuleOptions>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: ProvidersModule,
      imports: [
        ConfigModule,
        ...(options.imports || []),
      ],
      providers: [
        {
          provide: 'PROVIDERS_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        ...this.createProviders(),
      ],
      exports: [
        IJwtProvider,
        IDatabaseAuthProvider,
        GoogleProvider,
        FacebookProvider,
        AppleProvider,
      ],
    };
  }

  /**
   * Creates provider definitions based on module options
   */
  private static createProviders(): Provider[] {
    return [
      // JWT Provider - conditionally use Redis or standard implementation
      {
        provide: IJwtProvider,
        useFactory: (configService: ConfigService, options: ProvidersModuleOptions, loggerService: LoggerService) => {
          if (options.useRedisForJwt) {
            return new JwtRedisProvider(configService, loggerService);
          }
          return new JwtProvider(configService, loggerService);
        },
        inject: [ConfigService, 'PROVIDERS_MODULE_OPTIONS', LoggerService],
      },
      
      // Database Auth Provider
      {
        provide: IDatabaseAuthProvider,
        useFactory: (prismaService: PrismaService, loggerService: LoggerService, options: ProvidersModuleOptions) => {
          if (!options.useDatabaseAuth) {
            return null;
          }
          return new DatabaseAuthProvider(prismaService, loggerService);
        },
        inject: [PrismaService, LoggerService, 'PROVIDERS_MODULE_OPTIONS'],
      },
      
      // OAuth Providers - conditionally registered based on options
      {
        provide: GoogleProvider,
        useFactory: (configService: ConfigService, loggerService: LoggerService, options: ProvidersModuleOptions) => {
          if (!options.oauthProviders?.includes('google')) {
            return null;
          }
          return new GoogleProvider(configService, loggerService);
        },
        inject: [ConfigService, LoggerService, 'PROVIDERS_MODULE_OPTIONS'],
      },
      {
        provide: FacebookProvider,
        useFactory: (configService: ConfigService, loggerService: LoggerService, options: ProvidersModuleOptions) => {
          if (!options.oauthProviders?.includes('facebook')) {
            return null;
          }
          return new FacebookProvider(configService, loggerService);
        },
        inject: [ConfigService, LoggerService, 'PROVIDERS_MODULE_OPTIONS'],
      },
      {
        provide: AppleProvider,
        useFactory: (configService: ConfigService, loggerService: LoggerService, options: ProvidersModuleOptions) => {
          if (!options.oauthProviders?.includes('apple')) {
            return null;
          }
          return new AppleProvider(configService, loggerService);
        },
        inject: [ConfigService, LoggerService, 'PROVIDERS_MODULE_OPTIONS'],
      },
    ];
  }
}
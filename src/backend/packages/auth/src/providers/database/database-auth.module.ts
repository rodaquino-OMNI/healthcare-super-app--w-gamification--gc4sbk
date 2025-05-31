import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';

import { DatabaseAuthProvider } from './database-auth-provider';
import { IDatabaseAuthProvider } from './database-auth-provider.interface';

/**
 * Configuration options for the DatabaseAuthModule
 */
export interface DatabaseAuthModuleOptions {
  /**
   * Whether to make the module global (available to all modules without importing)
   */
  isGlobal?: boolean;
  
  /**
   * Custom provider to use instead of the default DatabaseAuthProvider
   */
  customProvider?: Type<IDatabaseAuthProvider>;
  
  /**
   * Configuration for the database auth provider
   */
  providerConfig?: {
    /**
     * The field to use for user lookup (default: 'email')
     */
    userLookupField?: string;
    
    /**
     * The field containing the password hash (default: 'password')
     */
    passwordField?: string;
    
    /**
     * Custom error messages
     */
    errorMessages?: {
      userNotFound?: string;
      invalidCredentials?: string;
      accountLocked?: string;
    };
  };
}

/**
 * NestJS module that registers the database authentication providers for dependency injection.
 * It provides factory functions to create and configure database authentication providers with different options.
 * The module handles integration with database services and other dependencies like logging.
 * It exports the database authentication provider for use by consuming applications.
 */
@Module({})
export class DatabaseAuthModule {
  /**
   * Register the DatabaseAuthModule with default configuration
   */
  static register(): DynamicModule {
    return {
      module: DatabaseAuthModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: DatabaseAuthProvider,
          useFactory: (prisma: PrismaService, logger: LoggerService, config: ConfigService) => {
            return new DatabaseAuthProvider(prisma, logger, {
              userLookupField: 'email',
              passwordField: 'password',
              errorMessages: {
                userNotFound: 'User not found',
                invalidCredentials: 'Invalid credentials',
                accountLocked: 'Account is locked',
              },
            });
          },
          inject: [PrismaService, LoggerService, ConfigService],
        },
      ],
      exports: [DatabaseAuthProvider],
    };
  }

  /**
   * Register the DatabaseAuthModule with custom options
   * @param options Configuration options for the module
   */
  static registerWithOptions(options: DatabaseAuthModuleOptions): DynamicModule {
    const providers: Provider[] = [];
    
    // Determine which provider class to use
    const providerClass = options.customProvider || DatabaseAuthProvider;
    
    // Create the provider
    providers.push({
      provide: DatabaseAuthProvider,
      useFactory: (prisma: PrismaService, logger: LoggerService, config: ConfigService) => {
        return new providerClass(prisma, logger, {
          userLookupField: options.providerConfig?.userLookupField || 'email',
          passwordField: options.providerConfig?.passwordField || 'password',
          errorMessages: {
            userNotFound: options.providerConfig?.errorMessages?.userNotFound || 'User not found',
            invalidCredentials: options.providerConfig?.errorMessages?.invalidCredentials || 'Invalid credentials',
            accountLocked: options.providerConfig?.errorMessages?.accountLocked || 'Account is locked',
          },
        });
      },
      inject: [PrismaService, LoggerService, ConfigService],
    });
    
    // If using a custom provider, add it as a provider and export it
    if (options.customProvider) {
      providers.push({
        provide: options.customProvider,
        useExisting: DatabaseAuthProvider,
      });
    }
    
    return {
      module: DatabaseAuthModule,
      global: options.isGlobal || false,
      imports: [ConfigModule],
      providers,
      exports: [DatabaseAuthProvider, ...(options.customProvider ? [options.customProvider] : [])],
    };
  }

  /**
   * Register the DatabaseAuthModule asynchronously with factory
   * @param options Async options for configuring the module
   */
  static registerAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<DatabaseAuthModuleOptions> | DatabaseAuthModuleOptions;
    inject?: any[];
    isGlobal?: boolean;
  }): DynamicModule {
    return {
      module: DatabaseAuthModule,
      global: options.isGlobal || false,
      imports: [...(options.imports || []), ConfigModule],
      providers: [
        {
          provide: 'DATABASE_AUTH_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: DatabaseAuthProvider,
          useFactory: async (
            prisma: PrismaService,
            logger: LoggerService,
            config: ConfigService,
            moduleOptions: DatabaseAuthModuleOptions,
          ) => {
            const providerClass = moduleOptions.customProvider || DatabaseAuthProvider;
            
            return new providerClass(prisma, logger, {
              userLookupField: moduleOptions.providerConfig?.userLookupField || 'email',
              passwordField: moduleOptions.providerConfig?.passwordField || 'password',
              errorMessages: {
                userNotFound: moduleOptions.providerConfig?.errorMessages?.userNotFound || 'User not found',
                invalidCredentials: moduleOptions.providerConfig?.errorMessages?.invalidCredentials || 'Invalid credentials',
                accountLocked: moduleOptions.providerConfig?.errorMessages?.accountLocked || 'Account is locked',
              },
            });
          },
          inject: [PrismaService, LoggerService, ConfigService, 'DATABASE_AUTH_MODULE_OPTIONS'],
        },
      ],
      exports: [DatabaseAuthProvider],
    };
  }
}
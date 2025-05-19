/**
 * @file Database Authentication Module
 * 
 * This module registers the database authentication providers for dependency injection.
 * It provides factory functions to create and configure database authentication providers
 * with different options, handling integration with database services and other dependencies.
 *
 * @module @austa/auth/providers/database
 */

import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import from other @austa packages
import { DatabaseModule } from '@austa/database';
import { PrismaService } from '@austa/database';
import { LoggingModule } from '@austa/logging';
import { LoggerService } from '@austa/logging';

// Import local components
import { DatabaseAuthProvider } from './database-auth-provider';

/**
 * Configuration options for the DatabaseAuthModule
 */
export interface DatabaseAuthModuleOptions {
  /**
   * The database table/collection to use for user authentication
   * @default 'users'
   */
  userTable?: string;
  
  /**
   * The field to use as the username for authentication
   * @default 'email'
   */
  usernameField?: string;
  
  /**
   * The field to use as the password for authentication
   * @default 'password'
   */
  passwordField?: string;
  
  /**
   * Whether to enable case-insensitive username matching
   * @default true
   */
  caseInsensitiveMatch?: boolean;
  
  /**
   * Custom provider token name
   * @default 'DATABASE_AUTH_PROVIDER'
   */
  providerToken?: string;
}

/**
 * Default options for the DatabaseAuthModule
 */
const defaultOptions: DatabaseAuthModuleOptions = {
  userTable: 'users',
  usernameField: 'email',
  passwordField: 'password',
  caseInsensitiveMatch: true,
  providerToken: 'DATABASE_AUTH_PROVIDER',
};

/**
 * Module that registers the database authentication providers for dependency injection.
 * 
 * This module provides factory functions to create and configure database authentication
 * providers with different options, handling integration with database services and other
 * dependencies like logging.
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggingModule,
  ],
})
export class DatabaseAuthModule {
  /**
   * Registers the module with the provided options
   * 
   * @param options Configuration options for the database authentication provider
   * @returns A dynamically configured module with the database authentication provider
   */
  static register(options?: DatabaseAuthModuleOptions): DynamicModule {
    const moduleOptions = { ...defaultOptions, ...options };
    const providers: Provider[] = [
      {
        provide: moduleOptions.providerToken,
        useFactory: (prismaService: PrismaService, loggerService: LoggerService, configService: ConfigService) => {
          return new DatabaseAuthProvider(
            prismaService,
            loggerService,
            {
              userTable: moduleOptions.userTable,
              usernameField: moduleOptions.usernameField,
              passwordField: moduleOptions.passwordField,
              caseInsensitiveMatch: moduleOptions.caseInsensitiveMatch,
            },
            configService,
          );
        },
        inject: [PrismaService, LoggerService, ConfigService],
      },
    ];

    return {
      module: DatabaseAuthModule,
      imports: [
        ConfigModule,
        DatabaseModule,
        LoggingModule,
      ],
      providers,
      exports: [moduleOptions.providerToken],
    };
  }

  /**
   * Registers the module with default options
   * 
   * @returns A dynamically configured module with the database authentication provider using default options
   */
  static registerDefault(): DynamicModule {
    return this.register();
  }

  /**
   * Registers the module with custom configuration from environment variables
   * 
   * @returns A dynamically configured module with the database authentication provider using environment variables
   */
  static registerAsync(): DynamicModule {
    return {
      module: DatabaseAuthModule,
      imports: [
        ConfigModule,
        DatabaseModule,
        LoggingModule,
      ],
      providers: [
        {
          provide: 'DATABASE_AUTH_PROVIDER',
          useFactory: (prismaService: PrismaService, loggerService: LoggerService, configService: ConfigService) => {
            return new DatabaseAuthProvider(
              prismaService,
              loggerService,
              {
                userTable: configService.get<string>('AUTH_USER_TABLE', 'users'),
                usernameField: configService.get<string>('AUTH_USERNAME_FIELD', 'email'),
                passwordField: configService.get<string>('AUTH_PASSWORD_FIELD', 'password'),
                caseInsensitiveMatch: configService.get<boolean>('AUTH_CASE_INSENSITIVE_MATCH', true),
              },
              configService,
            );
          },
          inject: [PrismaService, LoggerService, ConfigService],
        },
      ],
      exports: ['DATABASE_AUTH_PROVIDER'],
    };
  }
}
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '@austa/database';
import { LoggerModule } from '@austa/logging';
import { AuthService } from './auth.service';
import { JWT_EXPIRATION_DEFAULT } from './constants';

/**
 * Options for configuring the AuthModule
 */
export interface AuthModuleOptions {
  /** Whether to register the module globally */
  isGlobal?: boolean;
  /** Custom JWT configuration */
  jwt?: {
    /** Secret key for signing JWTs */
    secret?: string;
    /** Access token expiration time */
    accessTokenExpiration?: string;
    /** JWT issuer claim */
    issuer?: string;
    /** JWT audience claim */
    audience?: string | string[];
  };
}

/**
 * Authentication module for the AUSTA SuperApp
 * 
 * This module provides authentication and authorization functionality,
 * including user registration, login, JWT token management, and role-based access control.
 */
@Module({})
export class AuthModule {
  /**
   * Register the AuthModule with custom options
   * 
   * @param options Module configuration options
   * @returns Configured DynamicModule
   */
  static register(options: AuthModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [AuthService];

    // Apply global scope if requested
    const global = options.isGlobal ?? false;

    return {
      module: AuthModule,
      global,
      imports: [
        // Import required modules
        ConfigModule,
        DatabaseModule,
        LoggerModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: options.jwt?.secret || 
              configService.get<string>('authService.jwt.secret'),
            signOptions: {
              expiresIn: options.jwt?.accessTokenExpiration || 
                configService.get<string>('authService.jwt.accessTokenExpiration') || 
                JWT_EXPIRATION_DEFAULT,
              issuer: options.jwt?.issuer || 
                configService.get<string>('authService.jwt.issuer'),
              audience: options.jwt?.audience || 
                configService.get<string | string[]>('authService.jwt.audience'),
            },
          }),
        }),
      ],
      providers,
      exports: [AuthService, JwtModule],
    };
  }

  /**
   * Register the AuthModule globally
   * 
   * @param options Module configuration options
   * @returns Configured global DynamicModule
   */
  static registerGlobal(options: Omit<AuthModuleOptions, 'isGlobal'> = {}): DynamicModule {
    return this.register({ ...options, isGlobal: true });
  }
}
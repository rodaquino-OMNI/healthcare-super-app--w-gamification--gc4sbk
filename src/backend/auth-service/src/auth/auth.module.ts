import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Import from standardized path aliases
import { PermissionsModule } from '@app/auth/permissions/permissions.module';
import { RolesModule } from '@app/auth/roles/roles.module';

// Import auth components
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// Import strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { AppleStrategy } from './strategies/apple.strategy';

// Import Redis module for token blacklisting
import { RedisModule } from './redis/redis.module';
import { TokenStorageService } from './redis/token-storage.service';

/**
 * Authentication Module for the AUSTA SuperApp
 * 
 * This module configures and registers all authentication-related components including
 * AuthController, AuthService, token strategies, guards, and Redis token storage service.
 * 
 * Key features:
 * - JWT validation with Redis-backed token blacklisting
 * - Secure refresh token rotation
 * - Integration with role-based access control
 * - OAuth authentication with multiple providers (Google, Facebook, Apple)
 * - Standardized TypeScript path aliases for consistent imports
 */
@Module({
  imports: [
    // Import and configure PassportModule
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),
    
    // Import and configure JwtModule with settings from ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('authService.jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('authService.jwt.expiresIn', '15m'),
          issuer: configService.get<string>('authService.jwt.issuer', 'austa-superapp'),
          audience: configService.get<string>('authService.jwt.audience', 'austa-users'),
        },
      }),
    }),
    
    // Import Redis module for token blacklisting
    RedisModule,
    
    // Import permissions and roles modules
    PermissionsModule,
    RolesModule,
  ],
  controllers: [AuthController],
  providers: [
    // Core auth service
    AuthService,
    
    // Passport strategies
    LocalStrategy,
    JwtStrategy,
    
    // OAuth strategies
    GoogleStrategy,
    FacebookStrategy,
    AppleStrategy,
    
    // Token storage service for Redis-backed token blacklisting
    TokenStorageService,
  ],
  exports: [
    // Export services for use by other modules
    AuthService,
    TokenStorageService,
    JwtModule,
  ],
})
export class AuthModule {}
import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { OAuthStrategy } from './strategies/oauth.strategy';

// Import guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

// Import services
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

// Import from other @austa packages
import { ErrorsModule } from '@austa/errors';
import { LoggingModule } from '@austa/logging';
import { DatabaseModule } from '@austa/database';

/**
 * Global authentication module for the AUSTA SuperApp.
 * 
 * Provides authentication and authorization capabilities to all services
 * through JWT token validation, role-based access control, and OAuth integration.
 * 
 * This module is configured as global to ensure authentication components
 * are available throughout the application without needing to import it in each module.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('AUTH_JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('AUTH_JWT_ACCESS_TOKEN_EXPIRATION', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    ErrorsModule,
    LoggingModule,
    DatabaseModule,
  ],
  providers: [
    AuthService,
    TokenService,
    LocalStrategy,
    JwtStrategy,
    OAuthStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
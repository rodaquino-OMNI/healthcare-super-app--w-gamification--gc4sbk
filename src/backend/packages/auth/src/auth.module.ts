import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import from local paths using relative imports
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { OAuthStrategy } from './strategies/oauth.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

// Import from other packages using path aliases
import { ErrorsModule } from '@austa/errors';
import { LoggingModule } from '@austa/logging';
import { DatabaseModule } from '@austa/database';

/**
 * Global authentication module for the AUSTA SuperApp.
 * 
 * Provides authentication and authorization capabilities to all services
 * through JWT tokens, Passport strategies, and role-based access control.
 * 
 * This module is marked as @Global() to make its providers available
 * throughout the application without needing to import it in each module.
 */
@Global()
@Module({
  imports: [
    // Import configuration with standardized environment variables
    ConfigModule,
    
    // Configure Passport for authentication strategies
    PassportModule,
    
    // Configure JWT with async factory for environment-specific settings
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('AUTH_JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('AUTH_JWT_ACCESS_TOKEN_EXPIRATION', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
    
    // Import standardized error handling from @austa/errors package
    ErrorsModule,
    
    // Import standardized logging from @austa/logging package
    LoggingModule,
    
    // Import database module for user storage and token operations
    DatabaseModule,
  ],
  providers: [
    // Core authentication services
    AuthService,
    TokenService,
    
    // Authentication strategies
    LocalStrategy,
    JwtStrategy,
    OAuthStrategy,
    
    // Guards for route protection
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    // Export services and guards for use in other modules
    AuthService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
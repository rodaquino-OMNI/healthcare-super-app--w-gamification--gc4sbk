/**
 * @austa/auth
 * 
 * Authentication and authorization package for the AUSTA SuperApp.
 * Provides standardized authentication components, guards, decorators, and strategies
 * for use across all services in the platform.
 * 
 * This package is part of the AUSTA SuperApp refactoring to address critical build failures
 * and architectural issues while preserving the journey-centered approach.
 * 
 * @packageDocumentation
 */

// Core exports
export { AuthModule } from './src/auth.module';
export { AuthService } from './src/auth.service';
export { TokenService } from './src/token.service';
export * from './src/constants';
export * from './src/types';

// Guards
export { JwtAuthGuard } from './src/guards/jwt-auth.guard';
export { LocalAuthGuard } from './src/guards/local-auth.guard';
export { RolesGuard } from './src/guards/roles.guard';

// Decorators
export { CurrentUser } from './src/decorators/current-user.decorator';
export { Roles, ROLES_KEY } from './src/decorators/roles.decorator';

// Strategies
export { JwtStrategy } from './src/strategies/jwt.strategy';
export { LocalStrategy } from './src/strategies/local.strategy';
export { OAuthStrategy } from './src/strategies/oauth.strategy';

// Providers
// JWT Providers
export {
  JwtProvider,
  JwtRedisProvider,
  JwtConfig,
  JwtProviderInterface,
  JwtPayload,
  JwtTokenResponse
} from './src/providers/jwt';

// OAuth Providers
export {
  BaseOAuthProvider,
  GoogleOAuthProvider,
  FacebookOAuthProvider,
  AppleOAuthProvider,
  OAuthProfile,
  OAuthToken,
  OAuthConfig
} from './src/providers/oauth';

// Database Providers
export {
  DatabaseAuthProvider,
  DatabaseAuthProviderInterface,
  DatabaseAuthModule,
  passwordHash,
  passwordVerify,
  validatePasswordStrength
} from './src/providers/database';

// Re-export provider interfaces
export { AuthProviderInterface } from './src/providers/auth-provider.interface';
export { ProvidersModule } from './src/providers/providers.module';
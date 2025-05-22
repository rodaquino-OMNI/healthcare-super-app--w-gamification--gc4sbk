/**
 * @austa/auth
 * 
 * This package provides a comprehensive authentication and authorization system for the AUSTA SuperApp.
 * It includes guards, decorators, strategies, and services for handling user authentication,
 * token management, and role-based access control across all journeys.
 *
 * @packageDocumentation
 */

// Re-export core modules and services
export { AuthModule } from './src/auth.module';
export { AuthService } from './src/auth.service';
export { TokenService } from './src/token.service';

// Re-export constants and types
export * from './src/constants';
export * from './src/types';

// Re-export guards
export { JwtAuthGuard } from './src/guards/jwt-auth.guard';
export { LocalAuthGuard } from './src/guards/local-auth.guard';
export { RolesGuard } from './src/guards/roles.guard';

// Re-export decorators
export { CurrentUser } from './src/decorators/current-user.decorator';
export { Roles, ROLES_KEY } from './src/decorators/roles.decorator';

// Re-export strategies
export { JwtStrategy } from './src/strategies/jwt.strategy';
export { LocalStrategy } from './src/strategies/local.strategy';
export { OAuthStrategy } from './src/strategies/oauth.strategy';

// Re-export providers

/**
 * Database authentication providers for username/password authentication
 * 
 * These providers handle credential validation against database records
 * and integrate with the PrismaService for user lookup and verification.
 */
export * from './src/providers/database';

/**
 * JWT authentication providers for token-based authentication
 * 
 * These providers handle JWT token generation, validation, and blacklisting
 * for secure authentication across all services.
 */
export * from './src/providers/jwt';

/**
 * OAuth authentication providers for third-party authentication
 * 
 * These providers handle authentication with external identity providers
 * like Google, Facebook, and Apple, normalizing profiles and handling
 * token validation.
 */
export * from './src/providers/oauth';
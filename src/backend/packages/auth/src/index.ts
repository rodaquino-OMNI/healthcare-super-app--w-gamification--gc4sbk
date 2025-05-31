/**
 * @austa/auth
 * 
 * This package provides a comprehensive authentication and authorization system for the AUSTA SuperApp.
 * It includes JWT-based authentication, role-based access control, and integration with OAuth providers.
 * 
 * The package is designed to be used across all services in the AUSTA SuperApp, providing a consistent
 * authentication experience for users across all journeys.
 */

// Core module and services
export { AuthModule } from './auth.module';
export { AuthService } from './auth.service';
export { TokenService } from './token.service';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { LocalAuthGuard } from './guards/local-auth.guard';
export { RolesGuard } from './guards/roles.guard';

// Decorators
export { CurrentUser } from './decorators/current-user.decorator';
export { Roles, ROLES_KEY } from './decorators/roles.decorator';

// Strategies
export { JwtStrategy } from './strategies/jwt.strategy';
export { LocalStrategy } from './strategies/local.strategy';
export { OAuthStrategy } from './strategies/oauth.strategy';

// DTOs
export { LoginDto } from './dto/login.dto';
export { MfaVerificationDto } from './dto/mfa-verification.dto';
export { RefreshTokenDto } from './dto/refresh-token.dto';
export { SocialLoginDto } from './dto/social-login.dto';
export { TokenResponseDto } from './dto/token-response.dto';

// Interfaces - re-export all interfaces from the interfaces barrel
export * from './interfaces';

// Providers - re-export all providers from the providers barrel
export * from './providers';

// Utils
export * as ValidationUtils from './utils/validation.util';
export * as CryptoUtils from './utils/crypto.util';
export * as TokenUtils from './utils/token.util';
export * as PasswordUtils from './utils/password.util';

// Constants and Types
export * from './constants';
export * from './types';
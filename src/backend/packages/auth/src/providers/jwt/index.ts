/**
 * JWT Provider Barrel File
 * 
 * This file exports all JWT-related components including interfaces, providers,
 * and configurations to ensure standardized imports across the monorepo.
 * It creates a clean public API for the JWT authentication functionality that
 * can be consistently imported by other services.
 */

// Export interfaces
export {
  IJwtProvider,
  IJwtBlacklistProvider,
  IJwtBlacklistOptions,
  ITokenValidationResult,
  ITokenGenerationResult,
  JwtProviderFactory,
  JwtBlacklistProviderFactory,
} from './jwt.interface';

// Export configuration
export {
  JwtConfigOptions,
  jwtConfig,
  getJwtSignOptions,
  getJwtModuleOptions,
  getJourneyJwtConfig,
  getRefreshTokenConfig,
} from './jwt.config';

// Export providers
export { JwtProvider } from './jwt.provider';
export { JwtRedisProvider, JwtRedisOptions } from './jwt-redis.provider';
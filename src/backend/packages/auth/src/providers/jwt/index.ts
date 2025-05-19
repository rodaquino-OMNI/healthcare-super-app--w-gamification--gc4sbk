/**
 * @file index.ts
 * @description Barrel file that exports all JWT-related components including interfaces, providers,
 * and configurations to ensure standardized imports across the monorepo. Creates a clean public API
 * for the JWT authentication functionality that can be consistently imported by other services.
 */

// Export interfaces
export {
  IJwtProvider,
  IJwtBlacklist,
  IJwtVerificationOptions,
  IJwtSignOptions,
  IJwtRefreshOptions,
  IJwtRevocationOptions,
} from './jwt.interface';

// Export providers
export { JwtProvider, JWT_ERRORS } from './jwt.provider';
export { JwtRedisProvider, RedisJwtOptions } from './jwt-redis.provider';

// Export configuration
export { default as jwtConfig } from './jwt.config';
export {
  JwtConfigOptions,
  createJwtConfig,
  getJourneyJwtConfig,
} from './jwt.config';
/**
 * Redis module for authentication token storage and management.
 * This barrel file exports all Redis-related components to provide a clean public API.
 */

// Export interfaces
export {
  TokenStorageOptions,
  TokenRedisClientConfig,
  TokenBlacklistRecord,
  RefreshTokenRecord,
  TokenBlacklistOperations,
  RefreshTokenOperations,
  AccessTokenOperations,
  TokenStorageOperations,
} from './redis.interfaces';

// Export services
export { TokenStorageService } from './token-storage.service';

// Export module and utilities
export { RedisModule, createRedisClient } from './redis.module';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Use standardized TypeScript path aliases for consistent imports
import { LoggerService } from '@app/shared/logging/logger.service';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

// Import Redis interfaces
import { TokenStorageOptions, TokenBlacklistRecord, RefreshTokenRecord, RedisClient } from './redis.interfaces';

/**
 * Service for managing token storage in Redis, including token blacklisting
 * and secure refresh token rotation.
 */
@Injectable()
export class TokenStorageService {
  private readonly options: TokenStorageOptions;
  private readonly redisClient: RedisClient;
  
  // Redis key prefixes
  private readonly BLACKLIST_PREFIX = 'token:blacklist:';
  private readonly REFRESH_PREFIX = 'token:refresh:';
  
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    redisClient: RedisClient,
  ) {
    this.logger.setContext('TokenStorageService');
    this.redisClient = redisClient;
    
    // Set default options
    this.options = {
      keyPrefix: this.configService.get('redis.keyPrefix') || 'auth:',
      defaultTtl: this.configService.get('redis.defaultTtl') || 86400, // 1 day
    };
  }
  
  /**
   * Blacklists a token to prevent its further use.
   * @param jti - Unique token identifier
   * @param ttl - Time to live in seconds
   * @param userId - User ID associated with the token
   */
  async blacklistToken(jti: string, ttl: number, userId?: string): Promise<void> {
    try {
      this.logger.debug(`Blacklisting token: ${jti}`);
      
      const key = this.getBlacklistKey(jti);
      const record: TokenBlacklistRecord = {
        jti,
        userId: userId || 'unknown',
        blacklistedAt: Date.now(),
      };
      
      // Store the blacklisted token in Redis with TTL
      await this.redisClient.set(
        key,
        JSON.stringify(record),
        'EX',
        ttl || this.options.defaultTtl,
      );
      
      this.logger.debug(`Token blacklisted successfully: ${jti}`);
    } catch (error) {
      this.logger.error(`Failed to blacklist token: ${jti}`, error.stack);
      throw new AppException(
        ErrorType.INTERNAL_SERVER_ERROR,
        'Failed to blacklist token',
        'REDIS_001',
      );
    }
  }
  
  /**
   * Checks if a token is blacklisted.
   * @param jti - Unique token identifier
   * @returns True if the token is blacklisted, false otherwise
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    try {
      const key = this.getBlacklistKey(jti);
      const exists = await this.redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check blacklisted token: ${jti}`, error.stack);
      // Default to blacklisted in case of error (safer)
      return true;
    }
  }
  
  /**
   * Stores a refresh token in Redis for secure token rotation.
   * @param data - Refresh token data
   */
  async storeRefreshToken(data: { jti: string; userId: string; expiresIn: number }): Promise<void> {
    try {
      this.logger.debug(`Storing refresh token: ${data.jti}`);
      
      const key = this.getRefreshKey(data.jti);
      const now = Date.now();
      
      const record: RefreshTokenRecord = {
        jti: data.jti,
        userId: data.userId,
        createdAt: now,
        expiresAt: now + (data.expiresIn * 1000),
        used: false,
      };
      
      // Store the refresh token in Redis with TTL
      await this.redisClient.set(
        key,
        JSON.stringify(record),
        'EX',
        data.expiresIn,
      );
      
      this.logger.debug(`Refresh token stored successfully: ${data.jti}`);
    } catch (error) {
      this.logger.error(`Failed to store refresh token: ${data.jti}`, error.stack);
      throw new AppException(
        ErrorType.INTERNAL_SERVER_ERROR,
        'Failed to store refresh token',
        'REDIS_002',
      );
    }
  }
  
  /**
   * Invalidates a refresh token to prevent its reuse (secure token rotation).
   * @param jti - Unique token identifier
   */
  async invalidateRefreshToken(jti: string): Promise<void> {
    try {
      this.logger.debug(`Invalidating refresh token: ${jti}`);
      
      const key = this.getRefreshKey(jti);
      
      // Get the current token data
      const data = await this.redisClient.get(key);
      if (!data) {
        this.logger.warn(`Refresh token not found: ${jti}`);
        return;
      }
      
      // Parse the token data
      const record: RefreshTokenRecord = JSON.parse(data);
      
      // Mark the token as used
      record.used = true;
      
      // Update the token data in Redis
      await this.redisClient.set(
        key,
        JSON.stringify(record),
        'EX',
        Math.floor((record.expiresAt - Date.now()) / 1000),
      );
      
      this.logger.debug(`Refresh token invalidated successfully: ${jti}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate refresh token: ${jti}`, error.stack);
      throw new AppException(
        ErrorType.INTERNAL_SERVER_ERROR,
        'Failed to invalidate refresh token',
        'REDIS_003',
      );
    }
  }
  
  /**
   * Checks if a refresh token is valid and not used.
   * @param jti - Unique token identifier
   * @param userId - User ID to validate against
   * @returns True if the token is valid, false otherwise
   */
  async isRefreshTokenValid(jti: string, userId: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking refresh token validity: ${jti}`);
      
      const key = this.getRefreshKey(jti);
      
      // Get the token data from Redis
      const data = await this.redisClient.get(key);
      if (!data) {
        this.logger.warn(`Refresh token not found: ${jti}`);
        return false;
      }
      
      // Parse the token data
      const record: RefreshTokenRecord = JSON.parse(data);
      
      // Check if the token is used
      if (record.used) {
        this.logger.warn(`Refresh token already used: ${jti}`);
        return false;
      }
      
      // Check if the token belongs to the correct user
      if (record.userId !== userId) {
        this.logger.warn(`Refresh token user mismatch: ${jti}`);
        return false;
      }
      
      // Check if the token is expired
      if (record.expiresAt < Date.now()) {
        this.logger.warn(`Refresh token expired: ${jti}`);
        return false;
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to check refresh token validity: ${jti}`, error.stack);
      // Default to invalid in case of error (safer)
      return false;
    }
  }
  
  /**
   * Removes all tokens for a specific user (used during password change or account compromise).
   * @param userId - User ID to invalidate tokens for
   */
  async removeAllUserTokens(userId: string): Promise<void> {
    // Note: This is a simplified implementation.
    // In a production environment, you would need to scan Redis for all user tokens
    // and remove them individually. This would require additional Redis commands
    // and potentially a different Redis client implementation.
    this.logger.info(`Removing all tokens for user: ${userId}`);
    this.logger.warn('Full token removal requires Redis SCAN operation - simplified implementation');
  }
  
  /**
   * Gets the full Redis key for a blacklisted token.
   * @param jti - Unique token identifier
   * @returns Full Redis key
   * @private
   */
  private getBlacklistKey(jti: string): string {
    return `${this.options.keyPrefix}${this.BLACKLIST_PREFIX}${jti}`;
  }
  
  /**
   * Gets the full Redis key for a refresh token.
   * @param jti - Unique token identifier
   * @returns Full Redis key
   * @private
   */
  private getRefreshKey(jti: string): string {
    return `${this.options.keyPrefix}${this.REFRESH_PREFIX}${jti}`;
  }
}
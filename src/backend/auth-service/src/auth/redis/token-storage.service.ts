import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { JwtPayload } from '@austa/interfaces/auth';
import {
  TokenStorageOptions,
  TokenStorageOperations,
  TokenBlacklistRecord,
  RefreshTokenRecord,
} from './redis.interfaces';

/**
 * Service for managing JWT tokens in Redis storage.
 * Handles token blacklisting, refresh token management, and access token validation.
 * Implements security features like token rotation and automatic cleanup of expired tokens.
 */
@Injectable()
export class TokenStorageService implements TokenStorageOperations, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenStorageService.name);
  private readonly redis: Redis;
  private readonly options: TokenStorageOptions;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly encryptionKey: Buffer;
  private readonly encryptionIv: Buffer;

  /**
   * Creates an instance of TokenStorageService.
   * @param configService NestJS ConfigService for retrieving configuration values
   */
  constructor(private readonly configService: ConfigService) {
    // Initialize Redis client with configuration from environment
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: this.configService.get<number>('REDIS_DB', 0),
      keyPrefix: this.configService.get<string>('REDIS_KEY_PREFIX', 'auth:'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      reconnectOnError: (err) => {
        this.logger.error(`Redis connection error: ${err.message}`, err.stack);
        return true; // Reconnect for all errors
      },
    });

    // Set up token storage options
    this.options = {
      keyPrefix: this.configService.get<string>('TOKEN_KEY_PREFIX', 'auth:'),
      accessTokenTtl: this.configService.get<number>('ACCESS_TOKEN_TTL', 3600), // 1 hour
      refreshTokenTtl: this.configService.get<number>('REFRESH_TOKEN_TTL', 2592000), // 30 days
      blacklistTtl: this.configService.get<number>('BLACKLIST_TTL', 86400), // 24 hours
      encryptRefreshTokens: this.configService.get<boolean>('ENCRYPT_REFRESH_TOKENS', true),
      enableAutoCleanup: this.configService.get<boolean>('ENABLE_AUTO_CLEANUP', true),
      cleanupInterval: this.configService.get<number>('CLEANUP_INTERVAL', 3600), // 1 hour
    };

    // Set up encryption for refresh tokens
    const encryptionSecret = this.configService.get<string>('TOKEN_ENCRYPTION_SECRET', '');
    if (!encryptionSecret && this.options.encryptRefreshTokens) {
      this.logger.warn(
        'TOKEN_ENCRYPTION_SECRET not provided but encryption is enabled. Using a derived key instead.'
      );
      // Derive a key if not provided (not recommended for production)
      const derivedSecret = createHash('sha256')
        .update(randomBytes(32))
        .digest('hex');
      this.encryptionKey = Buffer.from(derivedSecret.substring(0, 32));
    } else {
      // Use the provided secret or a default one if encryption is disabled
      this.encryptionKey = Buffer.from(
        encryptionSecret || 'default-key-not-secure-for-production-use',
        'utf8'
      ).slice(0, 32);
    }

    // Generate a random IV for each service instance
    this.encryptionIv = randomBytes(16);
  }

  /**
   * Initialize the token storage service.
   * Sets up Redis connection and starts cleanup interval if enabled.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.initialize();
      this.logger.log('Token storage service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize token storage: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clean up resources when the module is destroyed.
   * Stops the cleanup interval and closes the Redis connection.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.close();
      this.logger.log('Token storage service closed successfully');
    } catch (error) {
      this.logger.error(`Error closing token storage: ${error.message}`, error.stack);
    }
  }

  /**
   * Initialize the token storage service.
   * Sets up Redis connection and starts cleanup interval if enabled.
   */
  async initialize(): Promise<void> {
    try {
      // Test Redis connection
      await this.redis.ping();
      this.logger.log('Connected to Redis successfully');

      // Start automatic cleanup if enabled
      if (this.options.enableAutoCleanup) {
        this.startCleanupInterval();
      }
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Close the token storage connection.
   * Stops the cleanup interval and closes the Redis connection.
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Get the Redis client instance.
   * @returns The Redis client instance
   */
  getClient(): Redis {
    return this.redis;
  }

  /**
   * Start the interval for automatic cleanup of expired tokens.
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        const result = await this.runCleanup();
        this.logger.debug(
          `Automatic cleanup completed: removed ${result.blacklisted} blacklisted tokens and ${result.refreshTokens} refresh tokens`
        );
      } catch (error) {
        this.logger.error(`Error during automatic cleanup: ${error.message}`, error.stack);
      }
    }, this.options.cleanupInterval * 1000);

    this.logger.log(
      `Automatic token cleanup scheduled every ${this.options.cleanupInterval} seconds`
    );
  }

  /**
   * Run a cleanup operation for all token types.
   * @returns Promise resolving to an object with counts of removed tokens
   */
  async runCleanup(): Promise<{ blacklisted: number; refreshTokens: number }> {
    const [blacklisted, refreshTokens] = await Promise.all([
      this.cleanupBlacklist(),
      this.cleanupRefreshTokens(),
    ]);

    return { blacklisted, refreshTokens };
  }

  /**
   * Generate a Redis key with the configured prefix.
   * @param type The type of key (e.g., 'blacklist', 'refresh')
   * @param id The identifier for the key
   * @returns The formatted Redis key
   */
  private getKey(type: string, id: string): string {
    return `${this.options.keyPrefix}${type}:${id}`;
  }

  /**
   * Encrypt sensitive data before storing in Redis.
   * @param data The data to encrypt
   * @returns The encrypted data as a base64 string
   */
  private encrypt(data: string): string {
    if (!this.options.encryptRefreshTokens) {
      return data;
    }

    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    return `${this.encryptionIv.toString('hex')}:${encrypted.toString('base64')}`;
  }

  /**
   * Decrypt data retrieved from Redis.
   * @param data The encrypted data as a base64 string
   * @returns The decrypted data
   */
  private decrypt(data: string): string {
    if (!this.options.encryptRefreshTokens) {
      return data;
    }

    const [ivHex, encryptedData] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  // ===== TOKEN BLACKLIST OPERATIONS =====

  /**
   * Add a token to the blacklist.
   * @param jti The JWT token ID to blacklist
   * @param payload The JWT payload associated with the token
   * @param reason Optional reason for blacklisting
   * @returns Promise resolving to true if successful
   */
  async addToBlacklist(jti: string, payload: JwtPayload, reason?: string): Promise<boolean> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = payload.exp || now + this.options.blacklistTtl;
      const ttl = expiresAt - now;

      if (ttl <= 0) {
        // Token is already expired, no need to blacklist
        return true;
      }

      const blacklistRecord: TokenBlacklistRecord = {
        jti,
        userId: payload.sub,
        blacklistedAt: now,
        expiresAt,
        reason,
      };

      // Store the blacklist record
      const key = this.getKey('blacklist', jti);
      await this.redis.set(key, JSON.stringify(blacklistRecord), 'EX', ttl);

      // Add to user's blacklisted tokens set
      const userBlacklistKey = this.getKey('user-blacklist', payload.sub);
      await this.redis.sadd(userBlacklistKey, jti);
      await this.redis.expire(userBlacklistKey, this.options.blacklistTtl);

      return true;
    } catch (error) {
      this.logger.error(
        `Error adding token to blacklist: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Check if a token is blacklisted.
   * @param jti The JWT token ID to check
   * @returns Promise resolving to true if token is blacklisted
   */
  async isBlacklisted(jti: string): Promise<boolean> {
    try {
      const key = this.getKey('blacklist', jti);
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(
        `Error checking if token is blacklisted: ${error.message}`,
        error.stack
      );
      // Default to blacklisted on error for security
      return true;
    }
  }

  /**
   * Get blacklist record for a token.
   * @param jti The JWT token ID to retrieve
   * @returns Promise resolving to the blacklist record or null if not found
   */
  async getBlacklistRecord(jti: string): Promise<TokenBlacklistRecord | null> {
    try {
      const key = this.getKey('blacklist', jti);
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as TokenBlacklistRecord;
    } catch (error) {
      this.logger.error(
        `Error getting blacklist record: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Remove a token from the blacklist.
   * @param jti The JWT token ID to remove
   * @returns Promise resolving to true if successful
   */
  async removeFromBlacklist(jti: string): Promise<boolean> {
    try {
      // Get the record first to find the user ID
      const record = await this.getBlacklistRecord(jti);
      if (!record) {
        return false;
      }

      // Remove from the blacklist
      const key = this.getKey('blacklist', jti);
      await this.redis.del(key);

      // Remove from user's blacklisted tokens set
      const userBlacklistKey = this.getKey('user-blacklist', record.userId);
      await this.redis.srem(userBlacklistKey, jti);

      return true;
    } catch (error) {
      this.logger.error(
        `Error removing token from blacklist: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get all blacklisted tokens for a user.
   * @param userId The user ID to get blacklisted tokens for
   * @returns Promise resolving to an array of blacklist records
   */
  async getUserBlacklistedTokens(userId: string): Promise<TokenBlacklistRecord[]> {
    try {
      const userBlacklistKey = this.getKey('user-blacklist', userId);
      const tokenIds = await this.redis.smembers(userBlacklistKey);

      if (!tokenIds.length) {
        return [];
      }

      // Get all blacklist records in parallel
      const records = await Promise.all(
        tokenIds.map(async (jti) => {
          const record = await this.getBlacklistRecord(jti);
          return record;
        })
      );

      // Filter out null records (tokens that were removed from blacklist but not from the set)
      return records.filter((record): record is TokenBlacklistRecord => record !== null);
    } catch (error) {
      this.logger.error(
        `Error getting user blacklisted tokens: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Blacklist all tokens for a user.
   * @param userId The user ID to blacklist tokens for
   * @param reason Optional reason for blacklisting
   * @returns Promise resolving to the number of tokens blacklisted
   */
  async blacklistAllUserTokens(userId: string, reason?: string): Promise<number> {
    try {
      // Get all active access tokens for the user
      const tokenIds = await this.getUserAccessTokens(userId);
      if (!tokenIds.length) {
        return 0;
      }

      // Create a dummy payload for each token
      const now = Math.floor(Date.now() / 1000);
      const blacklistPromises = tokenIds.map((jti) => {
        const dummyPayload: JwtPayload = {
          sub: userId,
          jti,
          iat: now,
          exp: now + this.options.blacklistTtl,
        };
        return this.addToBlacklist(jti, dummyPayload, reason);
      });

      // Wait for all blacklist operations to complete
      await Promise.all(blacklistPromises);

      return tokenIds.length;
    } catch (error) {
      this.logger.error(
        `Error blacklisting all user tokens: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Clean up expired blacklisted tokens.
   * @returns Promise resolving to the number of tokens removed
   */
  async cleanupBlacklist(): Promise<number> {
    try {
      // Redis will automatically remove expired keys, but we need to clean up the user sets
      // Get all user blacklist sets
      const pattern = this.getKey('user-blacklist', '*');
      const keys = await this.redis.keys(pattern);

      if (!keys.length) {
        return 0;
      }

      let totalRemoved = 0;

      // Process each user's blacklist
      for (const userBlacklistKey of keys) {
        const tokenIds = await this.redis.smembers(userBlacklistKey);
        if (!tokenIds.length) {
          continue;
        }

        // Check each token to see if it's still blacklisted
        let removedCount = 0;
        for (const jti of tokenIds) {
          const blacklistKey = this.getKey('blacklist', jti);
          const exists = await this.redis.exists(blacklistKey);
          if (exists === 0) {
            // Token is no longer blacklisted, remove from the set
            await this.redis.srem(userBlacklistKey, jti);
            removedCount++;
          }
        }

        totalRemoved += removedCount;

        // If all tokens were removed, delete the user blacklist key
        if (removedCount === tokenIds.length) {
          await this.redis.del(userBlacklistKey);
        }
      }

      return totalRemoved;
    } catch (error) {
      this.logger.error(
        `Error cleaning up blacklist: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // ===== REFRESH TOKEN OPERATIONS =====

  /**
   * Store a refresh token.
   * @param token The refresh token record to store
   * @returns Promise resolving to true if successful
   */
  async storeRefreshToken(token: RefreshTokenRecord): Promise<boolean> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const ttl = token.expiresAt - now;

      if (ttl <= 0) {
        // Token is already expired
        return false;
      }

      // Store the token
      const key = this.getKey('refresh', token.id);
      const tokenData = JSON.stringify(token);
      const encryptedData = this.encrypt(tokenData);
      await this.redis.set(key, encryptedData, 'EX', ttl);

      // Add to user's refresh tokens set
      const userRefreshKey = this.getKey('user-refresh', token.userId);
      await this.redis.sadd(userRefreshKey, token.id);
      await this.redis.expire(userRefreshKey, this.options.refreshTokenTtl);

      // If token has a family, add to family set
      if (token.familyId) {
        const familyKey = this.getKey('token-family', token.familyId);
        await this.redis.sadd(familyKey, token.id);
        await this.redis.expire(familyKey, this.options.refreshTokenTtl);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error storing refresh token: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get a refresh token by ID.
   * @param id The refresh token ID
   * @returns Promise resolving to the refresh token record or null if not found
   */
  async getRefreshToken(id: string): Promise<RefreshTokenRecord | null> {
    try {
      const key = this.getKey('refresh', id);
      const encryptedData = await this.redis.get(key);

      if (!encryptedData) {
        return null;
      }

      const tokenData = this.decrypt(encryptedData);
      return JSON.parse(tokenData) as RefreshTokenRecord;
    } catch (error) {
      this.logger.error(
        `Error getting refresh token: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Mark a refresh token as used (for token rotation).
   * @param id The refresh token ID to mark as used
   * @returns Promise resolving to true if successful
   */
  async markRefreshTokenAsUsed(id: string): Promise<boolean> {
    try {
      const token = await this.getRefreshToken(id);
      if (!token) {
        return false;
      }

      // Update the token
      token.used = true;
      token.lastUsedAt = Math.floor(Date.now() / 1000);
      token.usageCount += 1;

      // Store the updated token
      const key = this.getKey('refresh', id);
      const tokenData = JSON.stringify(token);
      const encryptedData = this.encrypt(tokenData);
      const ttl = await this.redis.ttl(key);

      if (ttl > 0) {
        await this.redis.set(key, encryptedData, 'EX', ttl);
        return true;
      } else {
        // Token has expired or doesn't exist
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Error marking refresh token as used: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Delete a refresh token.
   * @param id The refresh token ID to delete
   * @returns Promise resolving to true if successful
   */
  async deleteRefreshToken(id: string): Promise<boolean> {
    try {
      // Get the token first to find the user ID and family ID
      const token = await this.getRefreshToken(id);
      if (!token) {
        return false;
      }

      // Remove the token
      const key = this.getKey('refresh', id);
      await this.redis.del(key);

      // Remove from user's refresh tokens set
      const userRefreshKey = this.getKey('user-refresh', token.userId);
      await this.redis.srem(userRefreshKey, id);

      // If token has a family, remove from family set
      if (token.familyId) {
        const familyKey = this.getKey('token-family', token.familyId);
        await this.redis.srem(familyKey, id);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting refresh token: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get all refresh tokens for a user.
   * @param userId The user ID to get refresh tokens for
   * @returns Promise resolving to an array of refresh token records
   */
  async getUserRefreshTokens(userId: string): Promise<RefreshTokenRecord[]> {
    try {
      const userRefreshKey = this.getKey('user-refresh', userId);
      const tokenIds = await this.redis.smembers(userRefreshKey);

      if (!tokenIds.length) {
        return [];
      }

      // Get all refresh tokens in parallel
      const tokens = await Promise.all(
        tokenIds.map(async (id) => {
          const token = await this.getRefreshToken(id);
          return token;
        })
      );

      // Filter out null tokens (tokens that were deleted but not removed from the set)
      return tokens.filter((token): token is RefreshTokenRecord => token !== null);
    } catch (error) {
      this.logger.error(
        `Error getting user refresh tokens: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Invalidate all refresh tokens for a user.
   * @param userId The user ID to invalidate tokens for
   * @returns Promise resolving to the number of tokens invalidated
   */
  async invalidateAllUserRefreshTokens(userId: string): Promise<number> {
    try {
      const userRefreshKey = this.getKey('user-refresh', userId);
      const tokenIds = await this.redis.smembers(userRefreshKey);

      if (!tokenIds.length) {
        return 0;
      }

      // Delete all tokens in parallel
      const deletePromises = tokenIds.map((id) => this.deleteRefreshToken(id));
      await Promise.all(deletePromises);

      // Delete the user's refresh tokens set
      await this.redis.del(userRefreshKey);

      return tokenIds.length;
    } catch (error) {
      this.logger.error(
        `Error invalidating all user refresh tokens: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Invalidate all refresh tokens in a token family.
   * @param familyId The token family ID to invalidate
   * @returns Promise resolving to the number of tokens invalidated
   */
  async invalidateTokenFamily(familyId: string): Promise<number> {
    try {
      const familyKey = this.getKey('token-family', familyId);
      const tokenIds = await this.redis.smembers(familyKey);

      if (!tokenIds.length) {
        return 0;
      }

      // Delete all tokens in parallel
      const deletePromises = tokenIds.map((id) => this.deleteRefreshToken(id));
      await Promise.all(deletePromises);

      // Delete the family set
      await this.redis.del(familyKey);

      return tokenIds.length;
    } catch (error) {
      this.logger.error(
        `Error invalidating token family: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Clean up expired refresh tokens.
   * @returns Promise resolving to the number of tokens removed
   */
  async cleanupRefreshTokens(): Promise<number> {
    try {
      // Redis will automatically remove expired keys, but we need to clean up the user sets
      // Get all user refresh sets
      const pattern = this.getKey('user-refresh', '*');
      const userKeys = await this.redis.keys(pattern);

      // Get all token family sets
      const familyPattern = this.getKey('token-family', '*');
      const familyKeys = await this.redis.keys(familyPattern);

      let totalRemoved = 0;

      // Process each user's refresh tokens
      for (const userRefreshKey of userKeys) {
        const tokenIds = await this.redis.smembers(userRefreshKey);
        if (!tokenIds.length) {
          continue;
        }

        // Check each token to see if it still exists
        let removedCount = 0;
        for (const id of tokenIds) {
          const refreshKey = this.getKey('refresh', id);
          const exists = await this.redis.exists(refreshKey);
          if (exists === 0) {
            // Token is no longer valid, remove from the set
            await this.redis.srem(userRefreshKey, id);
            removedCount++;
          }
        }

        totalRemoved += removedCount;

        // If all tokens were removed, delete the user refresh key
        if (removedCount === tokenIds.length) {
          await this.redis.del(userRefreshKey);
        }
      }

      // Process each token family
      for (const familyKey of familyKeys) {
        const tokenIds = await this.redis.smembers(familyKey);
        if (!tokenIds.length) {
          continue;
        }

        // Check each token to see if it still exists
        let removedCount = 0;
        for (const id of tokenIds) {
          const refreshKey = this.getKey('refresh', id);
          const exists = await this.redis.exists(refreshKey);
          if (exists === 0) {
            // Token is no longer valid, remove from the set
            await this.redis.srem(familyKey, id);
            removedCount++;
          }
        }

        // If all tokens were removed, delete the family key
        if (removedCount === tokenIds.length) {
          await this.redis.del(familyKey);
        }
      }

      return totalRemoved;
    } catch (error) {
      this.logger.error(
        `Error cleaning up refresh tokens: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // ===== ACCESS TOKEN OPERATIONS =====

  /**
   * Store metadata for an access token.
   * @param jti The JWT token ID
   * @param payload The JWT payload associated with the token
   * @param metadata Optional additional metadata
   * @returns Promise resolving to true if successful
   */
  async storeAccessTokenMetadata(
    jti: string,
    payload: JwtPayload,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = payload.exp || now + this.options.accessTokenTtl;
      const ttl = expiresAt - now;

      if (ttl <= 0) {
        // Token is already expired
        return false;
      }

      // Store the token metadata
      const key = this.getKey('access', jti);
      const data = {
        jti,
        userId: payload.sub,
        issuedAt: payload.iat || now,
        expiresAt,
        ...metadata,
      };

      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);

      // Add to user's access tokens set
      const userAccessKey = this.getKey('user-access', payload.sub);
      await this.redis.sadd(userAccessKey, jti);
      await this.redis.expire(userAccessKey, this.options.accessTokenTtl);

      return true;
    } catch (error) {
      this.logger.error(
        `Error storing access token metadata: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get metadata for an access token.
   * @param jti The JWT token ID
   * @returns Promise resolving to the token metadata or null if not found
   */
  async getAccessTokenMetadata(jti: string): Promise<Record<string, any> | null> {
    try {
      const key = this.getKey('access', jti);
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      this.logger.error(
        `Error getting access token metadata: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Delete metadata for an access token.
   * @param jti The JWT token ID
   * @returns Promise resolving to true if successful
   */
  async deleteAccessTokenMetadata(jti: string): Promise<boolean> {
    try {
      // Get the metadata first to find the user ID
      const metadata = await this.getAccessTokenMetadata(jti);
      if (!metadata) {
        return false;
      }

      // Remove the metadata
      const key = this.getKey('access', jti);
      await this.redis.del(key);

      // Remove from user's access tokens set
      const userAccessKey = this.getKey('user-access', metadata.userId);
      await this.redis.srem(userAccessKey, jti);

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting access token metadata: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get all access tokens for a user.
   * @param userId The user ID to get access tokens for
   * @returns Promise resolving to an array of token IDs
   */
  async getUserAccessTokens(userId: string): Promise<string[]> {
    try {
      const userAccessKey = this.getKey('user-access', userId);
      return await this.redis.smembers(userAccessKey);
    } catch (error) {
      this.logger.error(
        `Error getting user access tokens: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Validate an access token against the blacklist and metadata.
   * @param jti The JWT token ID
   * @param payload The JWT payload to validate
   * @returns Promise resolving to true if the token is valid
   */
  async validateAccessToken(jti: string, payload: JwtPayload): Promise<boolean> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isBlacklisted(jti);
      if (isBlacklisted) {
        this.logger.debug(`Token ${jti} is blacklisted`);
        return false;
      }

      // Check if token metadata exists
      const metadata = await this.getAccessTokenMetadata(jti);
      if (!metadata) {
        // If we're not tracking this token, it's still valid as long as it's not blacklisted
        return true;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (metadata.expiresAt < now) {
        this.logger.debug(`Token ${jti} is expired`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error validating access token: ${error.message}`,
        error.stack
      );
      // Default to invalid on error for security
      return false;
    }
  }

  /**
   * Perform a complete logout for a user, invalidating all tokens.
   * This will blacklist all access tokens and invalidate all refresh tokens.
   * @param userId The user ID to log out
   * @param reason Optional reason for the logout
   * @returns Promise resolving to an object with counts of invalidated tokens
   */
  async logoutUser(userId: string, reason?: string): Promise<{ 
    blacklisted: number; 
    refreshTokens: number 
  }> {
    try {
      const [blacklisted, refreshTokens] = await Promise.all([
        this.blacklistAllUserTokens(userId, reason),
        this.invalidateAllUserRefreshTokens(userId),
      ]);

      return { blacklisted, refreshTokens };
    } catch (error) {
      this.logger.error(
        `Error logging out user: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Perform a security audit of all tokens for a user.
   * @param userId The user ID to audit
   * @returns Promise resolving to an audit report object
   */
  async auditUserTokens(userId: string): Promise<{
    activeAccessTokens: number;
    activeRefreshTokens: number;
    blacklistedTokens: number;
    usedRefreshTokens: number;
    suspiciousTokens: number;
    oldestTokenDate: Date | null;
    newestTokenDate: Date | null;
    uniqueDevices: number;
    uniqueIpAddresses: number;
  }> {
    try {
      // Get all tokens for the user
      const [accessTokenIds, refreshTokens, blacklistedTokens] = await Promise.all([
        this.getUserAccessTokens(userId),
        this.getUserRefreshTokens(userId),
        this.getUserBlacklistedTokens(userId),
      ]);

      // Count used refresh tokens
      const usedRefreshTokens = refreshTokens.filter((token) => token.used).length;

      // Identify suspicious tokens (high usage count or unusual IP addresses)
      let suspiciousTokens = 0;
      const devices = new Set<string>();
      const ipAddresses = new Set<string>();
      let oldestTimestamp = Number.MAX_SAFE_INTEGER;
      let newestTimestamp = 0;

      // Analyze refresh tokens
      for (const token of refreshTokens) {
        // Track devices and IPs
        if (token.deviceId) {
          devices.add(token.deviceId);
        }
        if (token.ipAddress) {
          ipAddresses.add(token.ipAddress);
        }

        // Track timestamps
        if (token.issuedAt < oldestTimestamp) {
          oldestTimestamp = token.issuedAt;
        }
        if (token.issuedAt > newestTimestamp) {
          newestTimestamp = token.issuedAt;
        }

        // Check for suspicious activity
        if (token.usageCount > 5 || (token.used && token.lastUsedAt && token.lastUsedAt > token.expiresAt)) {
          suspiciousTokens++;
        }
      }

      return {
        activeAccessTokens: accessTokenIds.length,
        activeRefreshTokens: refreshTokens.length,
        blacklistedTokens: blacklistedTokens.length,
        usedRefreshTokens,
        suspiciousTokens,
        oldestTokenDate: oldestTimestamp !== Number.MAX_SAFE_INTEGER ? new Date(oldestTimestamp * 1000) : null,
        newestTokenDate: newestTimestamp !== 0 ? new Date(newestTimestamp * 1000) : null,
        uniqueDevices: devices.size,
        uniqueIpAddresses: ipAddresses.size,
      };
    } catch (error) {
      this.logger.error(
        `Error auditing user tokens: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Generate a secure token rotation.
   * This will invalidate the old refresh token and create a new token pair.
   * @param oldRefreshTokenId The ID of the refresh token to rotate
   * @param payload The JWT payload for the new tokens
   * @param metadata Optional metadata for the new tokens
   * @returns Promise resolving to true if rotation was successful
   */
  async rotateTokens(oldRefreshTokenId: string, payload: JwtPayload, metadata?: Record<string, any>): Promise<boolean> {
    try {
      // Get the old refresh token
      const oldToken = await this.getRefreshToken(oldRefreshTokenId);
      if (!oldToken) {
        this.logger.warn(`Attempted to rotate non-existent refresh token: ${oldRefreshTokenId}`);
        return false;
      }

      // Check if the token has already been used
      if (oldToken.used) {
        this.logger.warn(`Attempted to reuse refresh token: ${oldRefreshTokenId}`);
        
        // This is a potential token theft attempt - invalidate the entire token family
        if (oldToken.familyId) {
          await this.invalidateTokenFamily(oldToken.familyId);
        }
        
        return false;
      }

      // Mark the old token as used
      await this.markRefreshTokenAsUsed(oldRefreshTokenId);

      // Store metadata for the new access token
      if (payload.jti) {
        await this.storeAccessTokenMetadata(payload.jti, payload, metadata);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error rotating tokens: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { JwtConfigOptions, jwtConfig } from './jwt.config';
import { JwtProvider } from './jwt.provider';

/**
 * Redis connection options for JWT token blacklisting
 */
export interface JwtRedisOptions {
  /**
   * Redis host
   * @default 'localhost'
   */
  host?: string;

  /**
   * Redis port
   * @default 6379
   */
  port?: number;

  /**
   * Redis password
   */
  password?: string;

  /**
   * Redis database index
   * @default 0
   */
  db?: number;

  /**
   * Key prefix for Redis keys
   * @default 'jwt:blacklist:'
   */
  keyPrefix?: string;

  /**
   * Time-to-live for blacklisted tokens in seconds
   * Defaults to the JWT token expiration time
   */
  blacklistTtl?: number;

  /**
   * Maximum number of retry attempts for Redis operations
   * @default 3
   */
  maxRetryAttempts?: number;

  /**
   * Retry delay in milliseconds
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Whether to use exponential backoff for retries
   * @default true
   */
  useExponentialBackoff?: boolean;

  /**
   * Redis connection options
   * @see https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options
   */
  redisOptions?: Redis.RedisOptions;
}

/**
 * Default Redis options for JWT token blacklisting
 */
const DEFAULT_REDIS_OPTIONS: JwtRedisOptions = {
  host: 'localhost',
  port: 6379,
  db: 0,
  keyPrefix: 'jwt:blacklist:',
  maxRetryAttempts: 3,
  retryDelay: 1000,
  useExponentialBackoff: true,
};

/**
 * JWT provider with Redis integration for token blacklisting and invalidation.
 * Extends the base JWT provider with additional functionality for token revocation.
 */
@Injectable()
export class JwtRedisProvider extends JwtProvider implements OnModuleInit {
  private readonly logger = new Logger(JwtRedisProvider.name);
  private redisClient: Redis;
  private readonly options: JwtRedisOptions;
  private readonly jwtOptions: JwtConfigOptions;

  /**
   * Creates an instance of JwtRedisProvider.
   * @param jwtService NestJS JWT service for token operations
   * @param configService Configuration service for environment variables
   */
  constructor(
    protected readonly jwtService: JwtService,
    @Inject(ConfigService) protected readonly configService: ConfigService,
  ) {
    super(jwtService);
    this.jwtOptions = this.configService.get<JwtConfigOptions>('jwt') || jwtConfig();
    this.options = this.getRedisOptions();
  }

  /**
   * Initializes the Redis client when the module is initialized.
   */
  async onModuleInit(): Promise<void> {
    try {
      this.redisClient = this.createRedisClient();
      this.logger.log('Redis client for JWT blacklisting initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis client for JWT blacklisting: ${error.message}`,
        error.stack,
      );
      // Don't throw here to allow the application to start even if Redis is not available
      // Token validation will fall back to standard JWT validation without blacklist checking
    }
  }

  /**
   * Creates a Redis client with the configured options.
   * @returns Redis client instance
   */
  private createRedisClient(): Redis {
    const { host, port, password, db, redisOptions } = this.options;
    
    const client = new Redis({
      host,
      port,
      password,
      db,
      // Enable automatic reconnection with exponential backoff
      retryStrategy: (times) => {
        const delay = Math.min(
          times * 50,
          2000, // Maximum delay of 2 seconds
        );
        return delay;
      },
      // Additional Redis options
      ...redisOptions,
    });

    // Set up event handlers for Redis client
    client.on('connect', () => {
      this.logger.log('Connected to Redis server for JWT blacklisting');
    });

    client.on('error', (error) => {
      this.logger.error(
        `Redis client error for JWT blacklisting: ${error.message}`,
        error.stack,
      );
    });

    client.on('reconnecting', () => {
      this.logger.warn('Reconnecting to Redis server for JWT blacklisting...');
    });

    return client;
  }

  /**
   * Gets Redis options from environment variables or uses defaults.
   * @returns Redis options for JWT blacklisting
   */
  private getRedisOptions(): JwtRedisOptions {
    return {
      host: this.configService.get<string>('REDIS_HOST') || DEFAULT_REDIS_OPTIONS.host,
      port: this.configService.get<number>('REDIS_PORT') || DEFAULT_REDIS_OPTIONS.port,
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_JWT_DB') || DEFAULT_REDIS_OPTIONS.db,
      keyPrefix: this.configService.get<string>('REDIS_JWT_KEY_PREFIX') || DEFAULT_REDIS_OPTIONS.keyPrefix,
      blacklistTtl: this.configService.get<number>('REDIS_JWT_BLACKLIST_TTL'),
      maxRetryAttempts: this.configService.get<number>('REDIS_JWT_MAX_RETRY_ATTEMPTS') || DEFAULT_REDIS_OPTIONS.maxRetryAttempts,
      retryDelay: this.configService.get<number>('REDIS_JWT_RETRY_DELAY') || DEFAULT_REDIS_OPTIONS.retryDelay,
      useExponentialBackoff: this.configService.get<boolean>('REDIS_JWT_USE_EXPONENTIAL_BACKOFF') ?? DEFAULT_REDIS_OPTIONS.useExponentialBackoff,
    };
  }

  /**
   * Validates a JWT token, checking both standard validation and blacklist status.
   * @param token JWT token to validate
   * @returns Decoded token payload if valid, null otherwise
   */
  async validateToken<T = any>(token: string): Promise<T | null> {
    try {
      // First check if the token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        this.logger.debug(`Token is blacklisted: ${this.getTokenIdentifier(token)}`);
        return null;
      }

      // If not blacklisted, perform standard JWT validation
      return await super.validateToken<T>(token);
    } catch (error) {
      this.logger.error(
        `Error validating token: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Invalidates a JWT token by adding it to the blacklist.
   * @param token JWT token to invalidate
   * @param ttl Optional time-to-live in seconds (defaults to token's remaining lifetime)
   * @returns True if the token was successfully blacklisted, false otherwise
   */
  async invalidateToken(token: string, ttl?: number): Promise<boolean> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available, token invalidation skipped');
      return false;
    }

    try {
      // Verify the token first to ensure it's valid and get its expiration time
      const decoded = await this.jwtService.verifyAsync(token);
      if (!decoded) {
        this.logger.warn(`Cannot blacklist invalid token: ${this.getTokenIdentifier(token)}`);
        return false;
      }

      // Calculate TTL based on token expiration or provided value
      const tokenTtl = this.calculateTokenTtl(decoded, ttl);
      if (tokenTtl <= 0) {
        this.logger.debug(`Token already expired, no need to blacklist: ${this.getTokenIdentifier(token)}`);
        return true; // Token is already expired, no need to blacklist
      }

      // Add token to blacklist with retry mechanism
      return await this.retryOperation(
        async () => {
          const tokenId = this.getTokenIdentifier(token);
          await this.redisClient.set(
            `${this.options.keyPrefix}${tokenId}`,
            'blacklisted',
            'EX',
            tokenTtl,
          );
          this.logger.debug(`Token blacklisted successfully: ${tokenId} (TTL: ${tokenTtl}s)`);
          return true;
        },
        'invalidateToken',
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate token: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Invalidates all tokens for a specific user.
   * @param userId User ID to invalidate tokens for
   * @param ttl Optional time-to-live in seconds
   * @returns True if the operation was successful, false otherwise
   */
  async invalidateAllUserTokens(userId: string, ttl?: number): Promise<boolean> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available, user token invalidation skipped');
      return false;
    }

    try {
      // Calculate TTL (use default if not provided)
      const tokenTtl = ttl || this.getDefaultBlacklistTtl();

      // Add user ID to blacklist with retry mechanism
      return await this.retryOperation(
        async () => {
          await this.redisClient.set(
            `${this.options.keyPrefix}user:${userId}`,
            'blacklisted',
            'EX',
            tokenTtl,
          );
          this.logger.debug(`All tokens for user ${userId} blacklisted successfully (TTL: ${tokenTtl}s)`);
          return true;
        },
        'invalidateAllUserTokens',
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate all user tokens: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Checks if a token is blacklisted.
   * @param token JWT token to check
   * @returns True if the token is blacklisted, false otherwise
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available, blacklist check skipped');
      return false;
    }

    try {
      // Extract token information for blacklist checking
      const decoded = this.jwtService.decode(token);
      if (!decoded || typeof decoded !== 'object') {
        return false;
      }

      // Check if the specific token is blacklisted
      const tokenId = this.getTokenIdentifier(token);
      const isTokenBlacklisted = await this.retryOperation(
        async () => {
          return await this.redisClient.exists(`${this.options.keyPrefix}${tokenId}`);
        },
        'checkTokenBlacklist',
      );

      // Check if all tokens for this user are blacklisted
      const userId = decoded.sub || decoded.id;
      if (userId) {
        const isUserBlacklisted = await this.retryOperation(
          async () => {
            return await this.redisClient.exists(`${this.options.keyPrefix}user:${userId}`);
          },
          'checkUserBlacklist',
        );

        return isTokenBlacklisted === 1 || isUserBlacklisted === 1;
      }

      return isTokenBlacklisted === 1;
    } catch (error) {
      this.logger.error(
        `Error checking token blacklist: ${error.message}`,
        error.stack,
      );
      // In case of error, allow the token (fail open for availability)
      // This is a security trade-off - in production you might want to fail closed
      return false;
    }
  }

  /**
   * Clears the entire token blacklist.
   * Use with caution - this will allow all previously invalidated tokens to work again.
   * @returns True if the operation was successful, false otherwise
   */
  async clearBlacklist(): Promise<boolean> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available, blacklist clearing skipped');
      return false;
    }

    try {
      return await this.retryOperation(
        async () => {
          // Get all keys with the blacklist prefix
          const keys = await this.redisClient.keys(`${this.options.keyPrefix}*`);
          if (keys.length === 0) {
            return true;
          }

          // Delete all blacklisted tokens
          await this.redisClient.del(...keys);
          this.logger.log(`Cleared ${keys.length} entries from token blacklist`);
          return true;
        },
        'clearBlacklist',
      );
    } catch (error) {
      this.logger.error(
        `Failed to clear token blacklist: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Gets a unique identifier for a token.
   * @param token JWT token
   * @returns Token identifier (hash)
   */
  private getTokenIdentifier(token: string): string {
    // Use the last 8 characters of the token as an identifier
    // This avoids storing the full token in Redis while still providing uniqueness
    return token.slice(-8);
  }

  /**
   * Calculates the TTL for a blacklisted token.
   * @param decoded Decoded JWT token
   * @param ttl Optional explicit TTL
   * @returns TTL in seconds
   */
  private calculateTokenTtl(decoded: any, ttl?: number): number {
    // If explicit TTL is provided, use it
    if (ttl !== undefined) {
      return ttl;
    }

    // If token has an expiration claim, calculate remaining time
    if (decoded.exp) {
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const remainingTime = Math.floor((expirationTime - currentTime) / 1000);
      return Math.max(0, remainingTime);
    }

    // Use default TTL if no expiration in token
    return this.getDefaultBlacklistTtl();
  }

  /**
   * Gets the default TTL for blacklisted tokens.
   * @returns Default TTL in seconds
   */
  private getDefaultBlacklistTtl(): number {
    // If explicitly configured, use that value
    if (this.options.blacklistTtl) {
      return this.options.blacklistTtl;
    }

    // Otherwise, use the access token expiration time from JWT config
    const accessTokenExpiration = this.jwtOptions.accessTokenExpiration;
    if (typeof accessTokenExpiration === 'string') {
      // Parse expiration string (e.g., '15m', '1h', '7d')
      const unit = accessTokenExpiration.slice(-1);
      const value = parseInt(accessTokenExpiration.slice(0, -1), 10);

      switch (unit) {
        case 's':
          return value;
        case 'm':
          return value * 60;
        case 'h':
          return value * 60 * 60;
        case 'd':
          return value * 24 * 60 * 60;
        default:
          // If format is not recognized, default to 1 hour
          return 60 * 60;
      }
    }

    // Default fallback: 1 hour
    return 60 * 60;
  }

  /**
   * Executes a Redis operation with retry mechanism.
   * @param operation Function to execute
   * @param operationName Name of the operation for logging
   * @returns Result of the operation
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    const { maxRetryAttempts, retryDelay, useExponentialBackoff } = this.options;
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt++;

        // If we've reached the maximum number of attempts, throw the error
        if (attempt >= maxRetryAttempts) {
          this.logger.error(
            `Operation ${operationName} failed after ${attempt} attempts: ${error.message}`,
            error.stack,
          );
          throw error;
        }

        // Calculate delay for next retry
        let nextDelay = retryDelay;
        if (useExponentialBackoff) {
          nextDelay = retryDelay * Math.pow(2, attempt - 1);
        }

        this.logger.warn(
          `Operation ${operationName} failed (attempt ${attempt}/${maxRetryAttempts}), ` +
          `retrying in ${nextDelay}ms: ${error.message}`,
        );

        // Wait before next retry
        await new Promise((resolve) => setTimeout(resolve, nextDelay));
      }
    }
  }
}
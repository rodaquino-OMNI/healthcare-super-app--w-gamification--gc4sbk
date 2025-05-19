import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis, RedisOptions } from 'ioredis';
import { JwtConfigOptions } from './jwt.config';
import { IAuthProvider } from '../auth-provider.interface';
import { JwtPayload } from '@austa/interfaces/auth';

/**
 * Configuration options for the Redis connection used by JwtRedisProvider.
 */
export interface RedisJwtOptions {
  /**
   * Redis connection options.
   */
  redisOptions: RedisOptions;

  /**
   * Prefix for Redis keys used for blacklisted tokens.
   * Default: 'blacklist:token:'
   */
  blacklistPrefix?: string;

  /**
   * Maximum number of retry attempts for Redis operations.
   * Default: 3
   */
  maxRetries?: number;

  /**
   * Delay between retry attempts in milliseconds.
   * Default: 1000 (1 second)
   */
  retryDelay?: number;

  /**
   * Whether to use exponential backoff for retries.
   * Default: true
   */
  useExponentialBackoff?: boolean;
}

/**
 * JWT provider with Redis integration for token blacklisting and invalidation.
 * Extends the base JWT provider with the ability to invalidate tokens before their
 * expiration time by storing them in a Redis blacklist.
 */
@Injectable()
export class JwtRedisProvider<TUser extends Record<string, any>> implements IAuthProvider<TUser, any>, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JwtRedisProvider.name);
  private redisClient: Redis;
  private readonly blacklistPrefix: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly useExponentialBackoff: boolean;

  /**
   * Creates a new instance of JwtRedisProvider.
   * 
   * @param jwtService NestJS JWT service for token operations
   * @param configService NestJS config service for accessing JWT configuration
   * @param options Redis configuration options
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly options: RedisJwtOptions,
  ) {
    this.blacklistPrefix = options.blacklistPrefix || 'blacklist:token:';
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.useExponentialBackoff = options.useExponentialBackoff !== false;
  }

  /**
   * Initializes the Redis connection when the module is initialized.
   */
  async onModuleInit(): Promise<void> {
    try {
      this.redisClient = new Redis(this.options.redisOptions);
      this.logger.log('Redis connection established for JWT blacklisting');

      // Set up error handling for Redis connection
      this.redisClient.on('error', (error) => {
        this.logger.error(`Redis connection error: ${error.message}`, error.stack);
      });

      this.redisClient.on('reconnecting', () => {
        this.logger.log('Reconnecting to Redis...');
      });

      await this.redisClient.ping();
    } catch (error) {
      this.logger.error(`Failed to initialize Redis connection: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Closes the Redis connection when the module is destroyed.
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.log('Redis connection closed');
      } catch (error) {
        this.logger.error(`Error closing Redis connection: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Validates user credentials and returns the authenticated user.
   * This method should be implemented by the concrete authentication provider.
   * 
   * @param credentials User credentials
   * @returns Promise resolving to the authenticated user or null if authentication fails
   */
  async validateCredentials(credentials: any): Promise<TUser | null> {
    // This method should be implemented by the concrete authentication provider
    throw new Error('Method not implemented. Use a concrete authentication provider.');
  }

  /**
   * Validates a token and returns the associated user.
   * Checks if the token is blacklisted before validating it.
   * 
   * @param token JWT token to validate
   * @returns Promise resolving to the user or null if validation fails
   */
  async validateToken(token: string): Promise<TUser | null> {
    try {
      // First check if the token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        this.logger.debug(`Token is blacklisted: ${this.maskToken(token)}`);
        return null;
      }

      // Verify the token
      const payload = this.jwtService.verify(token);
      return await this.getUserById(payload.sub);
    } catch (error) {
      this.logger.debug(`Token validation failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Retrieves a user by their unique identifier.
   * This method should be implemented by the concrete authentication provider.
   * 
   * @param id User identifier
   * @returns Promise resolving to the user or null if not found
   */
  async getUserById(id: string): Promise<TUser | null> {
    // This method should be implemented by the concrete authentication provider
    throw new Error('Method not implemented. Use a concrete authentication provider.');
  }

  /**
   * Generates a JWT token for the authenticated user.
   * 
   * @param user Authenticated user
   * @param expiresIn Token expiration time in seconds (optional)
   * @returns Promise resolving to the generated token
   */
  async generateToken(user: TUser, expiresIn?: number): Promise<string> {
    const jwtConfig = this.configService.get<JwtConfigOptions>('jwt');
    
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username || user.email,
      roles: user.roles || [],
      jti: this.generateTokenId(), // Add a unique token ID for blacklisting
    };

    const options = {
      expiresIn: expiresIn ? `${expiresIn}s` : jwtConfig.accessTokenExpiration,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    };

    return this.jwtService.sign(payload, options);
  }

  /**
   * Decodes a token and returns its payload without validation.
   * 
   * @param token JWT token to decode
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  async decodeToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error) {
      this.logger.debug(`Token decoding failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extracts the token from the request.
   * 
   * @param request HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: any): string | null {
    if (!request || !request.headers) {
      return null;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Revokes a token, making it invalid for future authentication by adding it to the blacklist.
   * 
   * @param token JWT token to revoke
   * @returns Promise resolving to true if revocation was successful, false otherwise
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      // Decode the token to get its expiration time
      const decoded = await this.decodeToken(token);
      if (!decoded) {
        this.logger.debug(`Cannot revoke invalid token: ${this.maskToken(token)}`);
        return false;
      }

      // Add the token to the blacklist
      return await this.addToBlacklist(token, decoded);
    } catch (error) {
      this.logger.error(`Error revoking token: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Refreshes an existing token and returns a new one.
   * This method should be implemented by the concrete authentication provider.
   * 
   * @param refreshToken Refresh token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    // This method should be implemented by the concrete authentication provider
    throw new Error('Method not implemented. Use a concrete authentication provider.');
  }

  /**
   * Checks if a token is blacklisted in Redis.
   * 
   * @param token JWT token to check
   * @returns Promise resolving to true if the token is blacklisted, false otherwise
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // Decode the token to get its ID (jti)
      const decoded = await this.decodeToken(token);
      if (!decoded || !decoded.jti) {
        // If the token doesn't have a jti claim, it can't be in the blacklist
        return false;
      }

      // Check if the token ID is in the blacklist
      return await this.executeWithRetry(async () => {
        const exists = await this.redisClient.exists(`${this.blacklistPrefix}${decoded.jti}`);
        return exists === 1;
      });
    } catch (error) {
      this.logger.error(`Error checking blacklisted token: ${error.message}`, error.stack);
      // In case of error, we assume the token is not blacklisted to prevent blocking legitimate requests
      return false;
    }
  }

  /**
   * Adds a token to the blacklist with an appropriate TTL.
   * 
   * @param token JWT token to blacklist
   * @param decoded Decoded token payload
   * @returns Promise resolving to true if the token was added to the blacklist, false otherwise
   */
  private async addToBlacklist(token: string, decoded: JwtPayload): Promise<boolean> {
    if (!decoded.jti) {
      this.logger.warn('Cannot blacklist token without jti claim');
      return false;
    }

    try {
      // Calculate TTL in seconds based on token expiration
      const now = Math.floor(Date.now() / 1000);
      const exp = decoded.exp || 0;
      const ttl = Math.max(0, exp - now);

      if (ttl <= 0) {
        // Token is already expired, no need to blacklist
        this.logger.debug(`Token is already expired, not blacklisting: ${this.maskToken(token)}`);
        return true;
      }

      // Add the token to the blacklist with TTL
      return await this.executeWithRetry(async () => {
        await this.redisClient.setex(
          `${this.blacklistPrefix}${decoded.jti}`,
          ttl,
          token
        );
        this.logger.debug(`Token blacklisted with TTL ${ttl}s: ${this.maskToken(token)}`);
        return true;
      });
    } catch (error) {
      this.logger.error(`Error adding token to blacklist: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Executes a Redis operation with retry logic.
   * 
   * @param operation Function that performs the Redis operation
   * @returns Promise resolving to the result of the operation
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let retries = 0;
    let lastError: Error;

    while (retries <= this.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        retries++;

        if (retries > this.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff if enabled
        const delay = this.useExponentialBackoff
          ? this.retryDelay * Math.pow(2, retries - 1)
          : this.retryDelay;

        this.logger.warn(
          `Redis operation failed (attempt ${retries}/${this.maxRetries}), retrying in ${delay}ms: ${error.message}`
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Generates a unique token ID for the jti claim.
   * 
   * @returns Unique token ID
   */
  private generateTokenId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Masks a token for logging purposes to prevent sensitive information exposure.
   * 
   * @param token JWT token to mask
   * @returns Masked token
   */
  private maskToken(token: string): string {
    if (!token) return 'null';
    if (token.length <= 10) return '***';
    return `${token.substring(0, 5)}...${token.substring(token.length - 5)}`;
  }
}
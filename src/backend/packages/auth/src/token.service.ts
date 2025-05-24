/**
 * @file Token Service
 * 
 * Specialized service responsible for JWT token operations, including generation,
 * validation, decoding, and refresh logic. It encapsulates all token-related
 * functionality to separate concerns from the main AuthService, improving
 * maintainability and testability.
 */

import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { ERROR_CODES, JWT_CLAIMS, TOKEN_TYPES } from './constants';
import {
  TokenPayload,
  TokenResponse,
  TokenType,
  TokenUserInfo,
  RefreshTokenRequest,
  JwtConfig,
  TokenOperation,
} from './types';

/**
 * Service responsible for JWT token operations
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly jwtConfig: JwtConfig;
  private readonly useRedisBlacklist: boolean;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Initialize JWT configuration from environment variables
    this.jwtConfig = {
      secret: this.configService.get<string>('JWT_SECRET'),
      accessTokenExpiration: this.configService.get<number>('JWT_ACCESS_EXPIRATION', 3600), // 1 hour default
      refreshTokenExpiration: this.configService.get<number>('JWT_REFRESH_EXPIRATION', 604800), // 7 days default
      issuer: this.configService.get<string>('JWT_ISSUER', 'austa-superapp'),
      audience: this.configService.get<string>('JWT_AUDIENCE', 'austa-users'),
      useRedisBlacklist: this.configService.get<boolean>('JWT_USE_REDIS_BLACKLIST', false),
    };

    this.useRedisBlacklist = this.jwtConfig.useRedisBlacklist;
    
    this.logger.log('TokenService initialized with configuration');
  }

  /**
   * Generate a new JWT access token
   * 
   * @param userInfo User information to include in the token
   * @returns JWT access token
   */
  async generateAccessToken(userInfo: TokenUserInfo): Promise<string> {
    try {
      const payload: TokenPayload = {
        sub: userInfo.id,
        email: userInfo.email,
        roles: userInfo.roles,
        permissions: userInfo.permissions,
        type: TokenType.ACCESS,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.jwtConfig.accessTokenExpiration,
        iss: this.jwtConfig.issuer,
        aud: this.jwtConfig.audience,
      };

      return this.jwtService.sign(payload, {
        secret: this.jwtConfig.secret,
        expiresIn: this.jwtConfig.accessTokenExpiration,
      });
    } catch (error) {
      this.logger.error(`Error generating access token: ${error.message}`, error.stack);
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  }

  /**
   * Generate a new JWT refresh token
   * 
   * @param userInfo User information to include in the token
   * @returns JWT refresh token
   */
  async generateRefreshToken(userInfo: TokenUserInfo): Promise<string> {
    try {
      const payload: TokenPayload = {
        sub: userInfo.id,
        email: userInfo.email,
        type: TokenType.REFRESH,
        roles: userInfo.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.jwtConfig.refreshTokenExpiration,
        iss: this.jwtConfig.issuer,
        aud: this.jwtConfig.audience,
        // Generate a unique token ID for refresh tokens to enable revocation
        jti: this.generateTokenId(),
      };

      return this.jwtService.sign(payload, {
        secret: this.jwtConfig.secret,
        expiresIn: this.jwtConfig.refreshTokenExpiration,
      });
    } catch (error) {
      this.logger.error(`Error generating refresh token: ${error.message}`, error.stack);
      throw new Error(`Failed to generate refresh token: ${error.message}`);
    }
  }

  /**
   * Generate both access and refresh tokens
   * 
   * @param userInfo User information to include in the tokens
   * @returns Token response with access and refresh tokens
   */
  async generateTokens(userInfo: TokenUserInfo): Promise<TokenResponse> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(userInfo),
        this.generateRefreshToken(userInfo),
      ]);

      return {
        accessToken,
        refreshToken,
        expiresIn: this.jwtConfig.accessTokenExpiration,
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logger.error(`Error generating tokens: ${error.message}`, error.stack);
      throw new Error(`Failed to generate tokens: ${error.message}`);
    }
  }

  /**
   * Validate a JWT token
   * 
   * @param token JWT token to validate
   * @param tokenType Expected token type
   * @returns Decoded token payload if valid
   * @throws Error if token is invalid or expired
   */
  async validateToken(token: string, tokenType: TokenType): Promise<TokenPayload> {
    try {
      // Verify token signature and expiration
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.jwtConfig.secret,
      });

      // Verify token type
      if (payload.type !== tokenType) {
        this.logger.warn(`Invalid token type: expected ${tokenType}, got ${payload.type}`);
        throw new Error(ERROR_CODES.INVALID_TOKEN);
      }

      // Check if token is blacklisted (if using Redis blacklist)
      if (this.useRedisBlacklist && tokenType === TokenType.ACCESS) {
        const isBlacklisted = await this.isTokenBlacklisted(token);
        if (isBlacklisted) {
          this.logger.warn(`Token is blacklisted: ${payload.sub}`);
          throw new Error(ERROR_CODES.TOKEN_REVOKED);
        }
      }

      return payload;
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        this.logger.warn(`Token expired: ${error.message}`);
        throw new Error(ERROR_CODES.TOKEN_EXPIRED);
      } else if (error.name === 'JsonWebTokenError') {
        this.logger.warn(`Invalid token: ${error.message}`);
        throw new Error(ERROR_CODES.INVALID_TOKEN);
      } else if (error.message === ERROR_CODES.TOKEN_REVOKED) {
        throw new Error(ERROR_CODES.TOKEN_REVOKED);
      } else if (error.message === ERROR_CODES.INVALID_TOKEN) {
        throw new Error(ERROR_CODES.INVALID_TOKEN);
      }

      this.logger.error(`Error validating token: ${error.message}`, error.stack);
      throw new Error(`Failed to validate token: ${error.message}`);
    }
  }

  /**
   * Decode a JWT token without validation
   * 
   * @param token JWT token to decode
   * @returns Decoded token payload
   */
  decodeToken(token: string): TokenPayload {
    try {
      return this.jwtService.decode(token) as TokenPayload;
    } catch (error) {
      this.logger.error(`Error decoding token: ${error.message}`, error.stack);
      throw new Error(`Failed to decode token: ${error.message}`);
    }
  }

  /**
   * Refresh an access token using a refresh token
   * 
   * @param refreshTokenRequest Refresh token request
   * @returns New token response with fresh access and refresh tokens
   * @throws Error if refresh token is invalid or expired
   */
  async refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<TokenResponse> {
    try {
      const { refreshToken } = refreshTokenRequest;

      // Validate refresh token
      const payload = await this.validateToken(refreshToken, TokenType.REFRESH);

      // Extract user info from payload
      const userInfo: TokenUserInfo = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
      };

      // Blacklist the old refresh token to prevent reuse
      if (this.useRedisBlacklist && payload.jti) {
        await this.blacklistToken(refreshToken, payload.jti, payload.exp - Math.floor(Date.now() / 1000));
      }

      // Generate new tokens
      return this.generateTokens(userInfo);
    } catch (error) {
      if (error.message === ERROR_CODES.TOKEN_EXPIRED) {
        this.logger.warn('Refresh token expired');
        throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
      } else if (error.message === ERROR_CODES.INVALID_TOKEN) {
        this.logger.warn('Invalid refresh token');
        throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
      } else if (error.message === ERROR_CODES.TOKEN_REVOKED) {
        this.logger.warn('Refresh token revoked');
        throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
      }

      this.logger.error(`Error refreshing token: ${error.message}`, error.stack);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Revoke a token by adding it to the blacklist
   * 
   * @param token JWT token to revoke
   * @returns True if token was successfully revoked
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      if (!this.useRedisBlacklist) {
        this.logger.warn('Token blacklisting is not enabled');
        return false;
      }

      // Decode token to get expiration and jti
      const payload = this.decodeToken(token);
      
      if (!payload || !payload.exp) {
        this.logger.warn('Invalid token for revocation');
        return false;
      }

      // Calculate TTL for Redis (in seconds)
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      
      // If token is already expired, no need to blacklist
      if (ttl <= 0) {
        this.logger.debug('Token already expired, no need to blacklist');
        return true;
      }

      // Use jti if available, otherwise use the token itself
      const tokenId = payload.jti || token;
      
      // Add token to blacklist
      await this.blacklistToken(token, tokenId, ttl);
      
      return true;
    } catch (error) {
      this.logger.error(`Error revoking token: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Generate a special-purpose token (e.g., password reset, email verification)
   * 
   * @param userId User ID
   * @param tokenType Token type
   * @param expiresIn Token expiration time in seconds
   * @param additionalData Additional data to include in the token
   * @returns Special-purpose JWT token
   */
  async generateSpecialToken(
    userId: string,
    tokenType: TokenType,
    expiresIn: number,
    additionalData?: Record<string, any>,
  ): Promise<string> {
    try {
      const payload: Partial<TokenPayload> = {
        sub: userId,
        type: tokenType,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
        iss: this.jwtConfig.issuer,
        jti: this.generateTokenId(),
        ...additionalData,
      };

      return this.jwtService.sign(payload, {
        secret: this.jwtConfig.secret,
        expiresIn,
      });
    } catch (error) {
      this.logger.error(`Error generating special token: ${error.message}`, error.stack);
      throw new Error(`Failed to generate special token: ${error.message}`);
    }
  }

  /**
   * Perform a token operation (create, verify, refresh, revoke)
   * 
   * @param operation Token operation details
   * @returns Operation result
   */
  async performTokenOperation(operation: TokenOperation): Promise<any> {
    switch (operation.operation) {
      case 'create':
        if (!operation.payload) {
          throw new Error('Payload is required for token creation');
        }
        
        const userInfo: TokenUserInfo = {
          id: operation.payload.sub,
          email: operation.payload.email,
          roles: operation.payload.roles || [],
          permissions: operation.payload.permissions,
        };
        
        return operation.tokenType === TokenType.ACCESS
          ? this.generateAccessToken(userInfo)
          : this.generateRefreshToken(userInfo);
        
      case 'verify':
        if (!operation.token) {
          throw new Error('Token is required for verification');
        }
        return this.validateToken(operation.token, operation.tokenType);
        
      case 'refresh':
        if (!operation.token) {
          throw new Error('Refresh token is required');
        }
        return this.refreshToken({ refreshToken: operation.token });
        
      case 'revoke':
        if (!operation.token) {
          throw new Error('Token is required for revocation');
        }
        return this.revokeToken(operation.token);
        
      default:
        throw new Error(`Unsupported token operation: ${operation.operation}`);
    }
  }

  /**
   * Generate a unique token ID
   * 
   * @returns Unique token ID
   */
  private generateTokenId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Check if a token is blacklisted
   * 
   * @param token JWT token
   * @returns True if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    // This is a placeholder for Redis integration
    // In a real implementation, this would check Redis for the token
    if (!this.useRedisBlacklist) {
      return false;
    }

    // Decode token to get jti if available
    const payload = this.decodeToken(token);
    const tokenId = payload.jti || token;

    // TODO: Implement Redis check
    // Example: return await this.redisService.exists(`blacklist:${tokenId}`);
    
    // For now, return false (not blacklisted)
    return false;
  }

  /**
   * Add a token to the blacklist
   * 
   * @param token JWT token
   * @param tokenId Token ID (jti or the token itself)
   * @param ttl Time to live in seconds
   */
  private async blacklistToken(token: string, tokenId: string, ttl: number): Promise<void> {
    // This is a placeholder for Redis integration
    // In a real implementation, this would add the token to Redis
    if (!this.useRedisBlacklist) {
      return;
    }

    // TODO: Implement Redis blacklisting
    // Example: await this.redisService.set(`blacklist:${tokenId}`, token, 'EX', ttl);
    
    this.logger.debug(`Token blacklisted: ${tokenId} (TTL: ${ttl}s)`);
  }
}
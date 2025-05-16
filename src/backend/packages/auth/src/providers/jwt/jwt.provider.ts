import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { IJwtProvider } from './jwt.interface';
import jwtConfig, { JwtConfigOptions } from './jwt.config';
import { ITokenPayload, ITokenValidationOptions } from '../../interfaces/token.interface';
import { JourneyType } from '../../interfaces/role.interface';

/**
 * Error messages for JWT validation failures
 */
export const JWT_ERRORS = {
  INVALID_TOKEN: 'Invalid token provided',
  EXPIRED_TOKEN: 'Token has expired',
  MALFORMED_TOKEN: 'Malformed token structure',
  MISSING_REQUIRED_CLAIM: 'Token missing required claim',
  INVALID_SIGNATURE: 'Invalid token signature',
  INVALID_AUDIENCE: 'Token has invalid audience',
  INVALID_ISSUER: 'Token has invalid issuer',
  EXTRACTION_FAILED: 'Failed to extract token from request',
};

/**
 * Core implementation of the JWT provider interface.
 * Handles token generation, validation, and verification using @nestjs/jwt.
 * Adds additional validation logic and error handling for consistent behavior across all services.
 * 
 * @template TUser The user entity type
 */
@Injectable()
export class JwtProvider<TUser extends Record<string, any>> implements IJwtProvider<TUser> {
  private readonly logger = new Logger(JwtProvider.name);

  /**
   * Creates a new instance of the JWT provider.
   * 
   * @param jwtService NestJS JWT service for token operations
   * @param configOptions JWT configuration options
   */
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly configOptions: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Validates a JWT token and returns the associated user.
   * Performs comprehensive validation including signature, expiration, and claims.
   * 
   * @param token JWT token to validate
   * @param options Additional validation options
   * @returns Promise resolving to the user or null if validation fails
   * @throws UnauthorizedException if token validation fails
   */
  async validateToken(token: string, options?: ITokenValidationOptions): Promise<any> {
    try {
      if (!token) {
        throw new UnauthorizedException(JWT_ERRORS.INVALID_TOKEN);
      }

      // Set default validation options
      const validationOptions = {
        ignoreExpiration: options?.ignoreExpiration ?? this.configOptions.ignoreExpiration ?? false,
        audience: options?.audience ?? this.configOptions.audience,
        issuer: options?.issuer ?? this.configOptions.issuer,
        algorithms: this.configOptions.algorithms,
        clockTolerance: this.configOptions.clockTolerance,
      };

      // Verify the token
      const payload = await this.jwtService.verifyAsync<ITokenPayload>(token, {
        secret: this.configOptions.secret,
        ...validationOptions,
      });

      // Check for required claims if specified
      if (options?.requiredClaims?.length) {
        for (const claim of options.requiredClaims) {
          if (!(claim in payload)) {
            throw new UnauthorizedException(`${JWT_ERRORS.MISSING_REQUIRED_CLAIM}: ${claim}`);
          }
        }
      }

      // Check token age if maxAge is specified
      if (options?.maxAge && payload.iat) {
        const now = Math.floor(Date.now() / 1000);
        const tokenAge = now - payload.iat;
        if (tokenAge > options.maxAge) {
          throw new UnauthorizedException(JWT_ERRORS.EXPIRED_TOKEN);
        }
      }

      return payload;
    } catch (error) {
      this.handleJwtError(error);
    }
  }

  /**
   * Generates a JWT token for the authenticated user.
   * 
   * @param user Authenticated user
   * @param expiresIn Token expiration time in seconds (optional)
   * @param journeyType Optional journey context to include in the token
   * @returns Promise resolving to the generated token
   */
  async generateToken(
    user: TUser, 
    expiresIn?: number | string,
    journeyType?: JourneyType
  ): Promise<string> {
    try {
      // Extract user information for the token payload
      const sub = user.id || user._id || user.userId;
      if (!sub) {
        throw new Error('User ID is required for token generation');
      }

      // Create the token payload
      const payload: Partial<ITokenPayload> = {
        sub: sub.toString(),
        email: user.email,
        name: user.name || user.fullName || user.displayName,
        roles: user.roles || [],
        permissions: user.permissions || [],
      };

      // Add journey context if provided
      if (journeyType) {
        payload.journeyContext = journeyType;
      }

      // Generate the token
      const token = await this.jwtService.signAsync(payload, {
        secret: this.configOptions.secret,
        expiresIn: expiresIn || this.configOptions.accessTokenExpiration,
        issuer: this.configOptions.issuer,
        audience: this.configOptions.audience,
        jwtid: this.configOptions.includeJwtId ? this.generateJwtId() : undefined,
      });

      return token;
    } catch (error) {
      this.logger.error(`Failed to generate token: ${error.message}`, error.stack);
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Decodes a JWT token and returns its payload without validation.
   * This method does not verify the token signature or expiration.
   * 
   * @param token JWT token to decode
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  async decodeToken(token: string): Promise<ITokenPayload | null> {
    try {
      if (!token) {
        return null;
      }

      // Decode the token without verification
      const payload = this.jwtService.decode(token) as ITokenPayload;
      return payload || null;
    } catch (error) {
      this.logger.debug(`Failed to decode token: ${error.message}`);
      return null;
    }
  }

  /**
   * Extracts the JWT token from the request.
   * Supports multiple extraction methods: Authorization header, query parameter, and cookies.
   * 
   * @param request HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: Request): string | null {
    try {
      // Try to extract from Authorization header
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }

      // Try to extract from query parameter
      if (request.query && request.query.access_token) {
        return request.query.access_token as string;
      }

      // Try to extract from cookies
      if (request.cookies && request.cookies.access_token) {
        return request.cookies.access_token;
      }

      return null;
    } catch (error) {
      this.logger.debug(`${JWT_ERRORS.EXTRACTION_FAILED}: ${error.message}`);
      return null;
    }
  }

  /**
   * Revokes a JWT token, making it invalid for future authentication.
   * Base implementation returns false as token revocation requires a storage mechanism.
   * Override this method in derived classes (e.g., JwtRedisProvider) to implement token revocation.
   * 
   * @param token JWT token to revoke
   * @returns Promise resolving to true if revocation was successful, false otherwise
   */
  async revokeToken(token: string): Promise<boolean> {
    // Base implementation doesn't support token revocation
    // This should be implemented in a derived class (e.g., JwtRedisProvider)
    this.logger.warn('Token revocation not implemented in base JwtProvider');
    return false;
  }

  /**
   * Refreshes an existing token and returns a new one.
   * Base implementation returns null as token refresh requires additional logic.
   * Override this method in derived classes to implement token refresh.
   * 
   * @param refreshToken Refresh token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    // Base implementation doesn't support token refresh
    // This should be implemented in a derived class
    this.logger.warn('Token refresh not implemented in base JwtProvider');
    return null;
  }

  /**
   * Handles JWT errors and throws appropriate exceptions.
   * Standardizes error handling for token validation failures.
   * 
   * @param error Error thrown during JWT operations
   * @throws UnauthorizedException with appropriate error message
   */
  private handleJwtError(error: any): never {
    let message = JWT_ERRORS.INVALID_TOKEN;

    if (error.name === 'TokenExpiredError') {
      message = JWT_ERRORS.EXPIRED_TOKEN;
    } else if (error.name === 'JsonWebTokenError') {
      message = error.message.includes('signature') 
        ? JWT_ERRORS.INVALID_SIGNATURE 
        : JWT_ERRORS.MALFORMED_TOKEN;
    } else if (error.name === 'NotBeforeError') {
      message = 'Token not yet valid';
    } else if (error.message.includes('audience')) {
      message = JWT_ERRORS.INVALID_AUDIENCE;
    } else if (error.message.includes('issuer')) {
      message = JWT_ERRORS.INVALID_ISSUER;
    }

    this.logger.debug(`JWT validation failed: ${message}`, error.stack);
    throw new UnauthorizedException(message);
  }

  /**
   * Generates a unique JWT ID for token identification.
   * Used when includeJwtId is enabled in the configuration.
   * 
   * @returns Unique JWT ID
   */
  private generateJwtId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
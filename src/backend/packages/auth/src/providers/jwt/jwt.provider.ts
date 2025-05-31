import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { JwtConfigOptions, jwtConfig } from './jwt.config';
import { IJwtProvider } from './jwt.interface';
import { ITokenPayload, ITokenVerificationOptions } from '../../interfaces/token.interface';
import { AppException } from '@austa/errors';

/**
 * Implementation of the JWT provider interface that handles token generation,
 * validation, and verification. Uses @nestjs/jwt for token signing and verification
 * while adding additional validation logic and error handling for consistent behavior
 * across all services.
 */
@Injectable()
export class JwtProvider implements IJwtProvider {
  private readonly logger = new Logger(JwtProvider.name);

  /**
   * Creates a new instance of the JWT provider
   * 
   * @param jwtService NestJS JWT service for token operations
   * @param config JWT configuration options
   */
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Generates a JWT token with the provided payload
   * 
   * @param payload Data to include in the token
   * @returns Generated JWT token
   * @throws AppException if token generation fails
   */
  async generateToken<T = any>(payload: T): Promise<string> {
    try {
      // Add standard claims if not already present in the payload
      const tokenPayload = {
        ...payload,
        // Add issued at time if configured and not already present
        ...(this.config.includeIssueTime && !('iat' in (payload as object)) && {
          iat: Math.floor(Date.now() / 1000),
        }),
      };

      // Generate the token using the JWT service
      return this.jwtService.sign(tokenPayload as object);
    } catch (error) {
      this.logger.error(`Failed to generate JWT token: ${error.message}`, error.stack);
      throw new AppException(
        'AUTH.TOKEN_GENERATION_FAILED',
        'Failed to generate authentication token',
        { originalError: error },
      );
    }
  }

  /**
   * Validates a JWT token
   * 
   * @param token JWT token to validate
   * @param options Optional verification options
   * @returns Decoded token payload if valid, null otherwise
   * @throws AppException if token validation fails
   */
  async validateToken<T = any>(token: string, options?: ITokenVerificationOptions): Promise<T | null> {
    try {
      // Verify the token using the JWT service
      const payload = await this.jwtService.verifyAsync<T>(token, {
        ignoreExpiration: options?.ignoreExpiration || false,
        issuer: options?.issuer || this.config.issuer,
        audience: options?.audience || this.config.audience,
        algorithms: options?.algorithms || [this.config.algorithm],
        clockTolerance: options?.clockTolerance || 0,
      });

      // Perform additional validation on the payload
      this.validatePayload(payload as unknown as ITokenPayload);

      return payload;
    } catch (error) {
      // Handle different types of validation errors
      if (error.name === 'TokenExpiredError') {
        this.logger.debug(`Token expired: ${error.message}`);
        throw new AppException(
          'AUTH.TOKEN_EXPIRED',
          'Authentication token has expired',
          { originalError: error },
        );
      }

      if (error.name === 'JsonWebTokenError') {
        this.logger.debug(`Invalid token: ${error.message}`);
        throw new AppException(
          'AUTH.INVALID_TOKEN',
          'Invalid authentication token',
          { originalError: error },
        );
      }

      if (error.name === 'NotBeforeError') {
        this.logger.debug(`Token not yet valid: ${error.message}`);
        throw new AppException(
          'AUTH.TOKEN_NOT_ACTIVE',
          'Authentication token not yet active',
          { originalError: error },
        );
      }

      // Handle custom validation errors
      if (error instanceof AppException) {
        throw error;
      }

      // Handle unexpected errors
      this.logger.error(`Failed to validate JWT token: ${error.message}`, error.stack);
      throw new AppException(
        'AUTH.TOKEN_VALIDATION_FAILED',
        'Failed to validate authentication token',
        { originalError: error },
      );
    }
  }

  /**
   * Decodes a JWT token without validation
   * 
   * @param token JWT token to decode
   * @returns Decoded token payload or null if decoding fails
   */
  decodeToken<T = any>(token: string): T | null {
    try {
      return this.jwtService.decode(token) as T;
    } catch (error) {
      this.logger.debug(`Failed to decode JWT token: ${error.message}`);
      return null;
    }
  }

  /**
   * Validates the token payload structure
   * 
   * @param payload Token payload to validate
   * @throws AppException if payload validation fails
   */
  private validatePayload(payload: ITokenPayload): void {
    // Validate required fields
    if (!payload) {
      throw new AppException(
        'AUTH.INVALID_TOKEN_PAYLOAD',
        'Token payload is empty',
      );
    }

    // Validate subject (usually user ID)
    if (!payload.sub) {
      throw new AppException(
        'AUTH.INVALID_TOKEN_PAYLOAD',
        'Token missing required subject claim',
      );
    }

    // Validate expiration
    if (!payload.exp) {
      throw new AppException(
        'AUTH.INVALID_TOKEN_PAYLOAD',
        'Token missing required expiration claim',
      );
    }

    // Validate issued at time if required
    if (this.config.includeIssueTime && !payload.iat) {
      throw new AppException(
        'AUTH.INVALID_TOKEN_PAYLOAD',
        'Token missing required issued at claim',
      );
    }

    // Validate issuer if configured
    if (this.config.issuer && payload.iss !== this.config.issuer) {
      throw new AppException(
        'AUTH.INVALID_TOKEN_ISSUER',
        'Token issuer does not match expected value',
      );
    }

    // Validate audience if configured
    if (this.config.audience) {
      const audience = Array.isArray(this.config.audience) ? this.config.audience : [this.config.audience];
      const tokenAudience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      
      // Check if there's any overlap between the expected and actual audiences
      const hasValidAudience = audience.some(aud => tokenAudience.includes(aud));
      
      if (!hasValidAudience) {
        throw new AppException(
          'AUTH.INVALID_TOKEN_AUDIENCE',
          'Token audience does not match expected value',
        );
      }
    }
  }
}
/**
 * @file jwt.strategy.ts
 * @description Passport strategy for authenticating users based on JWT tokens.
 * Validates tokens and extracts user information from the payload.
 * Implements Redis-backed token blacklisting for improved security.
 */

import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

// Use standardized import paths with TypeScript path aliases
import { ITokenPayload, ITokenValidationOptions } from '@austa/interfaces/auth';
import { IUser } from '@austa/interfaces/auth';

// Import the JWT provider for token blacklisting
import { JwtRedisProvider } from '../providers/jwt/jwt-redis.provider';

/**
 * Passport strategy for authenticating users based on JWT tokens.
 * Validates tokens and extracts user information from the payload.
 * Implements Redis-backed token blacklisting for improved security.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Initializes the JWT strategy with configuration options.
   * 
   * @param configService Service to access JWT configuration values
   * @param jwtRedisProvider Provider for JWT token validation and blacklist checking
   */
  constructor(
    private configService: ConfigService,
    private jwtRedisProvider: JwtRedisProvider,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Enforce token expiration
      secretOrKey: configService.get<string>('JWT_SECRET'),
      audience: configService.get<string>('JWT_AUDIENCE'),
      issuer: configService.get<string>('JWT_ISSUER'),
      passReqToCallback: true, // Pass request to callback for additional validation
    });
  }

  /**
   * Validates the JWT payload and returns the user object.
   * This method is called by Passport.js after the token is decoded.
   * 
   * Performs additional validation:
   * 1. Checks if the token is blacklisted in Redis
   * 2. Validates required claims in the token
   * 3. Verifies token integrity and signature
   * 
   * @param request The HTTP request object
   * @param payload The decoded JWT payload
   * @returns The user object if the token is valid
   * @throws UnauthorizedException if the token is invalid or blacklisted
   */
  async validate(request: any, payload: ITokenPayload): Promise<Partial<IUser>> {
    try {
      // Extract the token from the Authorization header
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
      
      // Check if the token is blacklisted in Redis
      const isBlacklisted = await this.jwtRedisProvider.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Validate token with additional options
      const validationOptions: ITokenValidationOptions = {
        requiredClaims: ['sub', 'email', 'iat', 'exp'],
        audience: this.configService.get<string>('JWT_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_ISSUER'),
      };

      // Perform additional validation beyond the basic JWT verification
      await this.jwtRedisProvider.validateToken(token, validationOptions);

      // Return a user object with properties from the payload
      // This will be attached to the request as req.user
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        // Do not include password or other sensitive fields
      };
    } catch (error) {
      // Use standardized error classification
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Convert other errors to UnauthorizedException with appropriate message
      throw new UnauthorizedException('Invalid token');
    }
  }
}
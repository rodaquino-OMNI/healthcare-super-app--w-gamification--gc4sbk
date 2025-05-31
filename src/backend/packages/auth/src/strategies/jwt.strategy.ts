import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

// Import from @austa/interfaces package for shared interfaces
import { JwtPayload, UserResponseDto } from '@austa/interfaces/auth';

// Import from providers for JWT and Redis integration
import { JwtRedisProvider } from '../providers/jwt/jwt-redis.provider';

// Import from @austa/errors for standardized error handling
import { AuthenticationError } from '@austa/errors/categories';

/**
 * Passport strategy for authenticating users based on JWT tokens.
 * This enhanced version includes Redis-backed token blacklisting and
 * improved session management with standardized error handling.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Initializes the JWT strategy with configuration options.
   * 
   * @param configService Service to access JWT configuration values
   * @param userService Service to retrieve user information
   * @param jwtRedisProvider Provider for JWT operations with Redis integration
   */
  constructor(
    private configService: ConfigService,
    @Inject('USER_SERVICE') private userService: any,
    private jwtRedisProvider: JwtRedisProvider,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Enforce token expiration
      secretOrKey: configService.get<string>('JWT_SECRET'),
      audience: configService.get<string>('JWT_AUDIENCE'),
      issuer: configService.get<string>('JWT_ISSUER'),
    });
  }

  /**
   * Validates the JWT payload and returns the user object.
   * This method is called by Passport.js after the token is decoded.
   * 
   * Enhanced with Redis token blacklist checking and improved error handling.
   * 
   * @param payload The decoded JWT payload
   * @returns The user object if the token is valid
   * @throws AuthenticationError if token is invalid or blacklisted
   */
  async validate(payload: JwtPayload): Promise<UserResponseDto> {
    try {
      // Check if token is blacklisted in Redis
      const isBlacklisted = await this.jwtRedisProvider.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        throw new AuthenticationError(
          'Token has been revoked',
          'REVOKED_TOKEN',
          { tokenId: payload.jti }
        );
      }

      // Extract the user ID from the payload
      const userId = payload.sub;
      
      // Call the UserService to find the user by ID
      const user = await this.userService.findById(userId);
      
      // If the user doesn't exist, throw an authentication error
      if (!user) {
        throw new AuthenticationError(
          'User not found',
          'INVALID_USER',
          { userId }
        );
      }
      
      // Verify token session if session tracking is enabled
      if (payload.sid) {
        const isValidSession = await this.jwtRedisProvider.validateSession(payload.sid, userId);
        if (!isValidSession) {
          throw new AuthenticationError(
            'Invalid session',
            'INVALID_SESSION',
            { sessionId: payload.sid }
          );
        }
      }
      
      // Return the user object
      return user;
    } catch (error) {
      // If it's already an AuthenticationError, rethrow it
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      // Otherwise, wrap in a standardized AuthenticationError
      throw new AuthenticationError(
        'Failed to authenticate token',
        'TOKEN_VALIDATION_FAILED',
        { originalError: error.message }
      );
    }
  }
}
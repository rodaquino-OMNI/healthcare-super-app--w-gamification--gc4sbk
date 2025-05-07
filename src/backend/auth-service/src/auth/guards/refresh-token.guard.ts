import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '@austa/interfaces/auth';
import { TokenStorageService } from '@app/auth/redis';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Error codes specific to refresh token operations.
 */
export enum RefreshTokenErrorCode {
  /**
   * The refresh token is invalid or malformed.
   */
  INVALID_TOKEN = 'AUTH_101',

  /**
   * The refresh token has expired.
   */
  TOKEN_EXPIRED = 'AUTH_102',

  /**
   * The refresh token has already been used (potential token reuse attack).
   */
  TOKEN_REUSED = 'AUTH_103',

  /**
   * The refresh token has been revoked or blacklisted.
   */
  TOKEN_REVOKED = 'AUTH_104',

  /**
   * The refresh token family has been invalidated due to suspicious activity.
   */
  FAMILY_INVALIDATED = 'AUTH_105',

  /**
   * The refresh token's security fingerprint doesn't match the request.
   */
  FINGERPRINT_MISMATCH = 'AUTH_106',

  /**
   * General refresh token validation failure.
   */
  VALIDATION_FAILED = 'AUTH_107',
}

/**
 * Guard for validating refresh tokens during the token refresh flow.
 * 
 * This guard extends the Passport AuthGuard and adds additional security checks
 * to prevent refresh token reuse and other security vulnerabilities. It works with
 * the TokenStorageService to validate tokens against the Redis store and implements
 * secure token rotation to prevent refresh token attacks.
 * 
 * @example
 * // Use in a controller to protect a refresh token endpoint
 * @UseGuards(RefreshTokenGuard)
 * @Post('refresh')
 * refreshToken(@Request() req, @Body() body) {
 *   return this.authService.refreshToken(req.user, body.refreshToken);
 * }
 */
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(RefreshTokenGuard.name);

  /**
   * Creates an instance of RefreshTokenGuard.
   * @param tokenStorageService Service for token storage and validation
   */
  constructor(private readonly tokenStorageService: TokenStorageService) {
    super();
  }

  /**
   * Determines if the current request is allowed to proceed based on refresh token validation.
   * Performs additional security checks beyond standard JWT validation.
   * 
   * @param context - The execution context of the current request
   * @returns A boolean indicating if the request is authenticated
   * @throws AppException if token validation fails
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // First, perform standard JWT validation
      const isJwtValid = await super.canActivate(context);
      if (!isJwtValid) {
        return false;
      }

      // Get the request and extract the refresh token
      const request = context.switchToHttp().getRequest();
      const refreshToken = this.extractRefreshToken(request);
      
      if (!refreshToken) {
        throw new AppException(
          'Refresh token is missing',
          ErrorType.VALIDATION,
          RefreshTokenErrorCode.INVALID_TOKEN
        );
      }

      // Get the JWT payload from the request (set by the JWT strategy)
      const user = request.user as JwtPayload;
      
      // Validate the refresh token against the token storage
      const isValid = await this.validateRefreshToken(refreshToken, user);
      
      if (!isValid) {
        return false;
      }

      // Store the refresh token ID in the request for later use
      request.refreshTokenId = refreshToken;
      
      return true;
    } catch (error) {
      // Transform AppException errors to HTTP exceptions with proper formatting
      if (error instanceof AppException) {
        throw error.toHttpException();
      }
      // For other errors, maintain the original exception
      throw error;
    }
  }

  /**
   * Extracts the refresh token from the request.
   * Checks multiple locations: body, query, and headers.
   * 
   * @param request - The HTTP request
   * @returns The refresh token string or null if not found
   */
  private extractRefreshToken(request: any): string | null {
    // Check request body
    if (request.body && request.body.refreshToken) {
      return request.body.refreshToken;
    }
    
    // Check query parameters
    if (request.query && request.query.refreshToken) {
      return request.query.refreshToken;
    }
    
    // Check authorization header (less common for refresh tokens)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check custom header
    if (request.headers['x-refresh-token']) {
      return request.headers['x-refresh-token'];
    }
    
    return null;
  }

  /**
   * Validates a refresh token against the token storage.
   * Performs security checks to prevent token reuse and other attacks.
   * 
   * @param tokenId - The refresh token ID to validate
   * @param user - The JWT payload from the request
   * @returns A boolean indicating if the token is valid
   * @throws AppException if token validation fails
   */
  private async validateRefreshToken(tokenId: string, user: JwtPayload): Promise<boolean> {
    try {
      // Get the refresh token from storage
      const token = await this.tokenStorageService.getRefreshToken(tokenId);
      
      // Check if token exists
      if (!token) {
        this.logger.warn(`Refresh token not found: ${tokenId}`);
        throw new AppException(
          'Invalid refresh token',
          ErrorType.VALIDATION,
          RefreshTokenErrorCode.INVALID_TOKEN
        );
      }
      
      // Check if token belongs to the user
      if (token.userId !== user.userId) {
        this.logger.warn(`Refresh token user mismatch: ${tokenId}`);
        throw new AppException(
          'Invalid refresh token',
          ErrorType.VALIDATION,
          RefreshTokenErrorCode.INVALID_TOKEN
        );
      }
      
      // Check if token has expired
      const now = Math.floor(Date.now() / 1000);
      if (token.expiresAt < now) {
        this.logger.warn(`Refresh token expired: ${tokenId}`);
        throw new AppException(
          'Refresh token has expired',
          ErrorType.VALIDATION,
          RefreshTokenErrorCode.TOKEN_EXPIRED
        );
      }
      
      // Check if token has been used (potential token reuse attack)
      if (token.used) {
        this.logger.warn(`Attempted reuse of refresh token: ${tokenId}`);
        
        // This is a potential token theft - invalidate the entire token family
        if (token.familyId) {
          await this.tokenStorageService.invalidateTokenFamily(token.familyId);
          
          throw new AppException(
            'Token family has been invalidated due to suspected token reuse',
            ErrorType.VALIDATION,
            RefreshTokenErrorCode.FAMILY_INVALIDATED,
            { familyId: token.familyId }
          );
        }
        
        throw new AppException(
          'Refresh token has already been used',
          ErrorType.VALIDATION,
          RefreshTokenErrorCode.TOKEN_REUSED
        );
      }
      
      // Check security fingerprint if available
      if (token.securityFingerprint) {
        const requestFingerprint = this.getSecurityFingerprint(user);
        if (token.securityFingerprint !== requestFingerprint) {
          this.logger.warn(`Security fingerprint mismatch for token: ${tokenId}`);
          throw new AppException(
            'Security validation failed',
            ErrorType.VALIDATION,
            RefreshTokenErrorCode.FINGERPRINT_MISMATCH
          );
        }
      }
      
      return true;
    } catch (error) {
      // Rethrow AppException errors
      if (error instanceof AppException) {
        throw error;
      }
      
      // Log and wrap other errors
      this.logger.error(`Error validating refresh token: ${error.message}`, error.stack);
      throw new AppException(
        'Refresh token validation failed',
        ErrorType.TECHNICAL,
        RefreshTokenErrorCode.VALIDATION_FAILED,
        { message: error.message }
      );
    }
  }

  /**
   * Generates a security fingerprint from the user payload.
   * This can be used to bind a refresh token to specific user attributes.
   * 
   * @param user - The JWT payload
   * @returns A string fingerprint
   */
  private getSecurityFingerprint(user: JwtPayload): string {
    // This is a simple implementation - in production, you might want to use
    // more sophisticated fingerprinting based on device info, IP, etc.
    return `${user.userId}:${user.email}`;
  }

  /**
   * Handles the result of the authentication process.
   * This method is called after Passport has validated the JWT token.
   * 
   * @param err - Any error that occurred during authentication
   * @param user - The authenticated user if successful
   * @param info - Additional info about the authentication process
   * @returns The authenticated user if successful
   * @throws UnauthorizedException if authentication fails
   */
  handleRequest(err: Error, user: any, info: any): any {
    // If authentication failed or no user was found, throw an UnauthorizedException
    if (err || !user) {
      throw new UnauthorizedException('Invalid token or user not found');
    }
    
    // Return the authenticated user
    return user;
  }
}
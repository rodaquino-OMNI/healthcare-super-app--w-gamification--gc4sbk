import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

// Use standardized TypeScript path aliases for consistent imports
import { TokenStorageService } from '@app/auth/redis/token-storage.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

// Integration with @austa/interfaces for shared token schemas
import { JwtPayload } from '@austa/interfaces/auth';

/**
 * Guard that enforces JWT authentication by validating tokens against Redis blacklist
 * and checking expiration. Used to protect routes requiring authentication.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly tokenStorage: TokenStorageService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {
    super();
    this.logger.setContext('JwtAuthGuard');
  }

  /**
   * Handles the authentication request by validating the JWT token.
   * Overrides the default handleRequest method to add custom validation logic.
   * 
   * @param err - Error from the passport strategy, if any
   * @param user - User object from the passport strategy
   * @param info - Additional info from the passport strategy
   * @param context - Execution context
   * @returns The authenticated user or throws an exception
   */
  async handleRequest(err: any, user: any, info: any, context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // Log authentication attempt
    this.logger.debug(`JWT authentication attempt: ${request.url}`);

    // If there's already an error from the passport strategy, handle it
    if (err || !user) {
      const errorMessage = err?.message || info?.message || 'Unauthorized';
      this.logger.warn(`JWT authentication failed: ${errorMessage}`);
      
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Invalid or expired authentication token',
        'AUTH_003',
        { message: errorMessage }
      );
    }

    try {
      // Verify the token is not blacklisted
      if (token) {
        // Decode the token to get the payload
        const decodedToken = this.jwtService.decode(token) as JwtPayload;
        
        if (!decodedToken || !decodedToken.jti) {
          this.logger.warn('Invalid token format: missing jti claim');
          throw new AppException(
            ErrorType.UNAUTHORIZED,
            'Invalid token format',
            'AUTH_004'
          );
        }

        // Check if the token is blacklisted
        const isBlacklisted = await this.tokenStorage.isBlacklisted(decodedToken.jti);
        if (isBlacklisted) {
          this.logger.warn(`Token blacklisted: ${decodedToken.jti}`);
          throw new AppException(
            ErrorType.UNAUTHORIZED,
            'Token has been revoked',
            'AUTH_005'
          );
        }

        // Validate token claims
        this.validateTokenClaims(decodedToken);

        // Log successful authentication
        this.logger.debug(`JWT authentication successful: ${user.id}`);
      }

      // Set the user on the request object
      request.user = user;
      return user;
    } catch (error) {
      // Handle any errors that occur during token validation
      this.logger.error(`JWT authentication error: ${error.message}`, error.stack);
      
      // If it's already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }
      
      // Otherwise, wrap it in an AppException
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Authentication failed',
        'AUTH_006',
        { message: error.message }
      );
    }
  }

  /**
   * Extracts the JWT token from the Authorization header.
   * 
   * @param request - The HTTP request object
   * @returns The JWT token or undefined if not found
   * @private
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Validates the claims in the JWT token.
   * 
   * @param payload - The decoded JWT payload
   * @throws AppException if any claims are invalid
   * @private
   */
  private validateTokenClaims(payload: JwtPayload): void {
    const now = Math.floor(Date.now() / 1000);

    // Check if the token is expired
    if (payload.exp && payload.exp < now) {
      this.logger.warn(`Token expired: ${payload.jti}`);
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Token has expired',
        'AUTH_007'
      );
    }

    // Check if the token is used before it's valid (nbf - not before)
    if (payload.nbf && payload.nbf > now) {
      this.logger.warn(`Token not yet valid: ${payload.jti}`);
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Token not yet valid',
        'AUTH_008'
      );
    }

    // Check if the token has required claims
    if (!payload.sub) {
      this.logger.warn(`Token missing subject claim: ${payload.jti}`);
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Invalid token format: missing subject',
        'AUTH_009'
      );
    }

    // Validate issuer if present
    if (payload.iss && !this.isValidIssuer(payload.iss)) {
      this.logger.warn(`Token has invalid issuer: ${payload.iss}`);
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Invalid token issuer',
        'AUTH_010'
      );
    }

    // Validate audience if present
    if (payload.aud && !this.isValidAudience(payload.aud)) {
      this.logger.warn(`Token has invalid audience: ${payload.aud}`);
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Invalid token audience',
        'AUTH_011'
      );
    }
  }

  /**
   * Checks if the token issuer is valid.
   * 
   * @param issuer - The issuer claim from the token
   * @returns True if the issuer is valid, false otherwise
   * @private
   */
  private isValidIssuer(issuer: string): boolean {
    // Get valid issuers from configuration
    const validIssuers = ['austa-auth-service']; // This should come from config
    return validIssuers.includes(issuer);
  }

  /**
   * Checks if the token audience is valid.
   * 
   * @param audience - The audience claim from the token
   * @returns True if the audience is valid, false otherwise
   * @private
   */
  private isValidAudience(audience: string | string[]): boolean {
    // Get valid audiences from configuration
    const validAudiences = ['austa-api']; // This should come from config
    
    if (Array.isArray(audience)) {
      return audience.some(aud => validAudiences.includes(aud));
    }
    
    return validAudiences.includes(audience);
  }
}
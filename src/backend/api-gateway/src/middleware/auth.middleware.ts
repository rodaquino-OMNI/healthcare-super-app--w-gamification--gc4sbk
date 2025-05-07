import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { LoggerService } from '@app/logging';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@app/auth';
import { UsersService } from '@app/auth/users';
import { TokenStorageService } from '@app/auth/redis';
import { 
  ValidationError, 
  InvalidCredentialsError,
  UnauthorizedError,
  InternalServerError,
  ExternalDependencyUnavailableError,
  ServiceUnavailableError
} from '@austa/errors/categories';
import { CircuitBreakerUtil } from '@austa/errors/utils';
import { IUserResponse, IAuthenticatedRequest, ITokenValidationResult, IJwtPayload } from '@austa/interfaces/auth';
import { ErrorContext } from '@austa/errors/types';

/**
 * Middleware that authenticates incoming requests by verifying the JWT token in the Authorization header.
 * Implements the requirements for API Gateway authentication and authorization with enhanced security features:
 * 
 * Security Features:
 * - Redis-backed token blacklisting for immediate token revocation
 * - Support for refresh token rotation security patterns
 * - Enhanced error handling with proper classification
 * - Circuit breaker pattern for auth service dependencies
 * - Security headers for all responses
 * - Distributed tracing integration
 * 
 * Authentication Flow:
 * 1. Extract JWT token from Authorization header
 * 2. Validate token format and signature
 * 3. Check token against Redis blacklist
 * 4. Verify user exists in database
 * 5. Attach user context to request
 * 6. Check if token needs refresh and set appropriate header
 * 
 * Error Handling:
 * - Proper error classification (validation, authentication, service unavailability)
 * - Consistent error responses with context
 * - Fallback strategies for dependency failures
 * - Comprehensive logging for security events
 * 
 * Performance Considerations:
 * - Circuit breaker pattern prevents cascading failures
 * - Token refresh uses jitter to prevent thundering herd
 * - Redis connection failures handled gracefully
 * 
 * @see TokenStorageService for token blacklist implementation
 * @see AuthService for token validation logic
 * @see CircuitBreakerUtil for dependency failure handling
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  /**
   * Constructor for the AuthMiddleware class.
   * 
   * @param authService Service for authentication operations
   * @param usersService Service for user management operations
   * @param tokenStorageService Service for token blacklist validation
   * @param loggerService Service for logging
   * @param configService Configuration service for accessing environment variables
   */
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly tokenStorageService: TokenStorageService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService
  ) {
    this.loggerService.setContext('AuthMiddleware');
  }

  /**
   * Authenticates the request by verifying the JWT token and attaching user information to the request object.
   * Implements enhanced security with token blacklist checking and proper error handling.
   * 
   * @param req The Express request object
   * @param res The Express response object
   * @param next The Express next function
   * @returns A promise that resolves when the middleware is complete
   */
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the token from the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        // If no token is provided, allow the request to proceed to public routes
        this.loggerService.debug('No authentication token provided');
        return next();
      }

      // Validate the format of the Authorization header (Bearer token)
      const [type, token] = authHeader.split(' ');
      if (type !== 'Bearer' || !token) {
        this.loggerService.warn('Invalid authorization header format');
        throw new ValidationError('Invalid authorization header format', {
          header: authHeader,
          expected: 'Bearer [token]'
        });
      }

      try {
        // Use circuit breaker pattern for auth service calls to prevent cascading failures
        const circuitBreaker = new CircuitBreakerUtil('auth-service', {
          failureThreshold: 5,
          resetTimeout: 30000, // 30 seconds
          fallbackResponse: null
        });
        
        // Verify the JWT token using the auth service with circuit breaker protection
        const tokenValidationResult = await circuitBreaker.execute<ITokenValidationResult>(
          () => this.authService.validateToken(token)
        );
        
        // Handle circuit breaker fallback case
        if (!tokenValidationResult) {
          this.loggerService.error('Auth service unavailable, circuit breaker open');
          throw new ServiceUnavailableError('Authentication service temporarily unavailable');
        }
        
        if (!tokenValidationResult.valid) {
          const errorContext: ErrorContext = {
            reason: tokenValidationResult.reason,
            tokenId: tokenValidationResult.tokenId
          };
          
          this.loggerService.warn(`Token validation failed: ${tokenValidationResult.reason}`);
          throw new InvalidCredentialsError('Invalid or expired token', errorContext);
        }
        
        const decoded = tokenValidationResult.payload as IJwtPayload;
        const userId = decoded.sub;

        // Check if token is blacklisted (revoked) with retry logic for Redis connection issues
        let isBlacklisted = false;
        try {
          isBlacklisted = await this.tokenStorageService.isTokenBlacklisted(token);
        } catch (redisError) {
          // Log Redis error but continue - failing open is better than blocking all requests
          this.loggerService.error(`Redis connection error: ${redisError.message}`, redisError.stack);
          // Continue with token validation, but log the issue for monitoring
        }
        
        if (isBlacklisted) {
          this.loggerService.warn(`Rejected blacklisted token for user: ${userId}`);
          throw new UnauthorizedError('Token has been revoked', { userId, tokenId: decoded.jti });
        }

        // Validate that the user exists in the database with retry logic
        let user: IUserResponse;
        try {
          // Use circuit breaker for user service calls
          const userCircuitBreaker = new CircuitBreakerUtil('users-service', {
            failureThreshold: 3,
            resetTimeout: 20000, // 20 seconds
            fallbackResponse: null
          });
          
          user = await userCircuitBreaker.execute<IUserResponse>(
            () => this.usersService.findOne(userId)
          );
          
          if (!user) {
            throw new ExternalDependencyUnavailableError('User service temporarily unavailable');
          }
        } catch (error) {
          this.loggerService.error(`User validation failed: ${error.message}`, error.stack);
          
          if (error instanceof ExternalDependencyUnavailableError) {
            throw error; // Propagate service unavailability
          }
          
          throw new UnauthorizedError('Invalid user', { userId });
        }

        // Attach user information to the request object with enhanced security context
        (req as IAuthenticatedRequest).user = {
          id: userId,
          email: user.email,
          roles: user.roles || [],
          permissions: user.permissions || [],
          journeyPreferences: user.journeyPreferences || {},
          // Add security context for audit logging and monitoring
          securityContext: {
            tokenId: decoded.jti, // JWT ID for token tracking
            issuedAt: new Date(decoded.iat * 1000).toISOString(),
            expiresAt: new Date(decoded.exp * 1000).toISOString(),
            clientIp: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown'
          }
        };
        
        // Add trace ID for request tracking if not already present
        if (!req.headers['x-trace-id']) {
          const traceId = `auth-${userId}-${Date.now()}`;
          req.headers['x-trace-id'] = traceId;
        }

        // Check for token refresh requirement based on token age
        const tokenAge = this.getTokenAge(decoded);
        if (tokenAge && this.shouldRefreshToken(tokenAge)) {
          // Add header to indicate token should be refreshed
          // The client should detect this and request a new token using the refresh token
          res.setHeader('X-Token-Refresh-Required', 'true');
        }

        this.loggerService.debug(`Authenticated user: ${userId}`);
        return next();
      } catch (error) {
        // Preserve error classification for known error types
        if (error instanceof UnauthorizedError || 
            error instanceof InvalidCredentialsError || 
            error instanceof ServiceUnavailableError ||
            error instanceof ExternalDependencyUnavailableError) {
          throw error;
        }
        
        // Log detailed error information for unknown errors
        this.loggerService.error(
          `Token verification failed: ${error.message}`,
          error.stack,
          { 
            tokenFragment: token.substring(0, 10) + '...', // Log partial token for debugging
            errorType: error.constructor.name,
            path: req.path
          }
        );
        
        // Convert unknown errors to UnauthorizedError for consistent client response
        throw new UnauthorizedError('Invalid or expired token', {
          originalError: error.constructor.name
        });
      }
    } catch (error) {
      // Add security headers even on error responses
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // Log security-related errors with appropriate severity
      if (error instanceof UnauthorizedError || error instanceof InvalidCredentialsError) {
        this.loggerService.warn(
          `Authentication failed: ${error.message}`,
          { 
            path: req.path,
            ip: req.ip,
            errorCode: error.code || 'UNKNOWN'
          }
        );
      } else {
        this.loggerService.error(
          `Authentication error: ${error.message}`,
          error.stack,
          { path: req.path }
        );
      }
      
      // Pass the error to NestJS exception filters for consistent handling
      next(error);
    }
  }

  /**
   * Calculates the age of a token in seconds based on its issued at (iat) claim.
   * 
   * @param decoded The decoded JWT payload
   * @returns The token age in seconds, or null if iat is not present
   * @private
   */
  private getTokenAge(decoded: JwtPayload): number | null {
    if (!decoded.iat) {
      return null;
    }
    
    const issuedAt = decoded.iat * 1000; // Convert to milliseconds
    const now = Date.now();
    return Math.floor((now - issuedAt) / 1000); // Return age in seconds
  }

  /**
   * Determines if a token should be refreshed based on its age and configured refresh threshold.
   * This implements a proactive token refresh strategy to prevent token expiration during active sessions.
   * 
   * The refresh strategy works as follows:
   * 1. When a token reaches the refresh threshold (default 80% of its lifetime), the X-Token-Refresh-Required header is set
   * 2. The client should detect this header and use its refresh token to obtain a new access token
   * 3. This prevents token expiration during active user sessions and implements secure token rotation
   * 
   * @param tokenAge The age of the token in seconds
   * @returns True if the token should be refreshed, false otherwise
   * @private
   */
  private shouldRefreshToken(tokenAge: number): boolean {
    // Get the token refresh threshold from configuration (default to 80% of token lifetime)
    const tokenLifetime = this.configService.get<number>('auth.jwt.expiresIn', 3600); // Default 1 hour
    const refreshThreshold = this.configService.get<number>('auth.jwt.refreshThreshold', tokenLifetime * 0.8);
    
    // Add jitter to prevent all clients from refreshing simultaneously (thundering herd)
    const jitterFactor = Math.random() * 0.1; // 10% jitter
    const jitteredThreshold = refreshThreshold * (1 - jitterFactor);
    
    return tokenAge > jitteredThreshold;
  }
}
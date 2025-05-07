import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '@austa/logging';
import { InvalidCredentialsError, MalformedRequestError } from '@austa/errors/categories';
import { RateLimiterService } from '@app/auth/rate-limiter/rate-limiter.service';
import { Request } from 'express';

/**
 * Guard that handles username/password authentication for the login flow.
 * Extends Passport's AuthGuard for the 'local' strategy.
 * 
 * Features:
 * - Enhanced error handling with specific error codes
 * - Detailed logging of authentication attempts
 * - Rate limiting protection against brute force attacks
 * - Improved validation error messaging
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(
    private readonly logger: LoggerService,
    private readonly rateLimiterService: RateLimiterService,
  ) {
    super();
  }

  /**
   * Handles the authentication process and provides enhanced error handling.
   * @param context The execution context
   * @returns The authenticated user or throws an appropriate error
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { ip, body } = request;
    const email = body?.email;

    // Log authentication attempt with context
    this.logger.debug(
      `Authentication attempt for user: ${email}`,
      {
        context: 'LocalAuthGuard',
        ip,
        email,
      }
    );

    // Validate request body
    if (!email || !body?.password) {
      this.logger.warn(
        `Authentication attempt with missing credentials`,
        {
          context: 'LocalAuthGuard',
          ip,
          email: email || 'not provided',
        }
      );
      throw new MalformedRequestError(
        'Email and password are required',
        {
          missingFields: !email ? ['email'] : [] + !body?.password ? ['password'] : [],
        }
      );
    }

    // Check rate limiting before proceeding
    try {
      await this.rateLimiterService.checkRateLimit(ip, email);
    } catch (error) {
      this.logger.warn(
        `Rate limit exceeded for authentication attempt`,
        {
          context: 'LocalAuthGuard',
          ip,
          email,
          error: error.message,
        }
      );
      throw error; // RateLimiterService throws appropriate error
    }

    try {
      // Attempt authentication via passport strategy
      const result = await super.canActivate(context);
      
      if (result) {
        // Log successful authentication
        this.logger.info(
          `Authentication successful for user: ${email}`,
          {
            context: 'LocalAuthGuard',
            ip,
            email,
          }
        );
        
        // Reset rate limit counter on successful authentication
        await this.rateLimiterService.resetRateLimit(ip, email);
      }
      
      return result;
    } catch (error) {
      // Log failed authentication attempt
      this.logger.warn(
        `Authentication failed for user: ${email}`,
        {
          context: 'LocalAuthGuard',
          ip,
          email,
          error: error.message,
        }
      );

      // Record failed attempt for rate limiting
      await this.rateLimiterService.recordFailedAttempt(ip, email);

      // Transform error to standardized format
      if (error.message === 'Unauthorized') {
        throw new InvalidCredentialsError('Invalid email or password');
      }
      
      throw error;
    }
  }
}
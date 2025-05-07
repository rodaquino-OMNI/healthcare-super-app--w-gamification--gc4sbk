import { Injectable } from '@nestjs/common';
import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/shared/redis/redis.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { ApiGatewayConfig } from '@app/api-gateway/config/configuration';
import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';

// Import from @austa/interfaces for type-safe configuration
import { RateLimitConfig, JourneyType } from '@austa/interfaces/common';

// Import from @austa/errors for enhanced error handling
import { RateLimitExceededError } from '@austa/errors/categories/validation.errors';
import { ExternalDependencyUnavailableError } from '@austa/errors/categories/external.errors';
import { ErrorContext } from '@austa/errors/types';

/**
 * Middleware that applies rate limiting to API requests.
 * Uses Redis to track request counts and applies journey-specific limits
 * to ensure fair usage and protect against abuse.
 *
 * Features:
 * - Journey-specific rate limiting based on request context
 * - Higher limits for authenticated users
 * - Proper Redis connection pooling for performance
 * - Standardized error responses with retry guidance
 * - Configurable rate limit windows and thresholds
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Applies rate limiting logic to incoming requests.
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the user's IP address from the request
      const ip = 
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
        req.ip || 
        req.connection.remoteAddress || 
        'unknown';
      
      // Check if user is authenticated
      const isAuthenticated = !!(req.user);
      const userId = isAuthenticated ? (req.user as any).id : null;
      
      // Determine which journey this request is for
      const journey = this.getRequestJourney(req);
      
      // Construct a unique key for rate limiting
      // For authenticated users, use their ID; for anonymous users, use IP
      const identifier = isAuthenticated ? `user:${userId}` : `ip:${ip}`;
      const rateLimitKey = `rateLimit:${identifier}:${journey || 'global'}`;
      
      // Retrieve the rate limiting configuration from the ConfigService
      const rateLimitConfig = this.configService.get<RateLimitConfig>('apiGateway.rateLimit');
      if (!rateLimitConfig) {
        return next();
      }
      
      // Determine the maximum number of requests allowed
      let maxRequests = rateLimitConfig.max;
      if (journey && rateLimitConfig.journeyLimits && rateLimitConfig.journeyLimits[journey]) {
        maxRequests = rateLimitConfig.journeyLimits[journey];
      }
      
      // Authenticated users get higher limits
      if (isAuthenticated) {
        maxRequests *= 3; // Triple the limit for authenticated users
      }
      
      // Check if the rate limit key exists
      const exists = await this.redisService.exists(rateLimitKey);
      
      // Get the window duration in seconds
      const windowSeconds = Math.floor(rateLimitConfig.windowMs / 1000);
      
      // Journey-specific TTL based on data volatility
      const ttl = journey ? this.redisService.getJourneyTTL(journey) : windowSeconds;
      
      if (exists) {
        // Key exists, get current count
        const requestCount = await this.redisService.get(rateLimitKey);
        const currentCount = parseInt(requestCount || '0', 10);
        
        if (currentCount >= maxRequests) {
          // Get remaining time until reset
          const remainingTtl = await this.redisService.ttl(rateLimitKey);
          
          // Set rate limit headers
          if (rateLimitConfig.standardHeaders) {
            res.setHeader('RateLimit-Limit', maxRequests.toString());
            res.setHeader('RateLimit-Remaining', '0');
            res.setHeader('RateLimit-Reset', Math.ceil(Date.now() / 1000 + remainingTtl).toString());
            res.setHeader('Retry-After', remainingTtl.toString());
          }
          
          // Create error context with journey information
          const errorContext: ErrorContext = {
            journey: journey as JourneyType,
            resourceId: identifier,
            metadata: {
              limit: maxRequests,
              windowMs: rateLimitConfig.windowMs,
              retryAfterSeconds: remainingTtl,
              resetTimestamp: Math.ceil(Date.now() / 1000 + remainingTtl),
              isAuthenticated
            }
          };
          
          // Throw a specialized rate limit error with retry guidance
          throw new RateLimitExceededError(
            rateLimitConfig.message || 'Too many requests, please try again later.',
            'API_RATE_LIMIT_EXCEEDED',
            errorContext
          );
        }
        
        // Increment the request count
        await this.redisService.set(rateLimitKey, (currentCount + 1).toString(), ttl);
        
        // Set rate limit headers
        if (rateLimitConfig.standardHeaders) {
          const remaining = Math.max(0, maxRequests - (currentCount + 1));
          const resetTime = Math.ceil(Date.now() / 1000 + await this.redisService.ttl(rateLimitKey));
          
          res.setHeader('RateLimit-Limit', maxRequests.toString());
          res.setHeader('RateLimit-Remaining', remaining.toString());
          res.setHeader('RateLimit-Reset', resetTime.toString());
        }
      } else {
        // Key doesn't exist, create it with initial count of 1
        await this.redisService.set(rateLimitKey, '1', ttl);
        
        // Set rate limit headers
        if (rateLimitConfig.standardHeaders) {
          res.setHeader('RateLimit-Limit', maxRequests.toString());
          res.setHeader('RateLimit-Remaining', (maxRequests - 1).toString());
          res.setHeader('RateLimit-Reset', Math.ceil(Date.now() / 1000 + ttl).toString());
        }
      }
      
      // Call the next middleware in the chain
      next();
    } catch (error) {
      // If it's already a RateLimitExceededError, just rethrow it
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      
      // For Redis connection issues, throw a specific error
      if (error.name === 'RedisError' || error.name === 'ReplyError') {
        this.logger.error(
          'Redis connection error in rate limit middleware', 
          error.stack, 
          'RateLimitMiddleware'
        );
        
        throw new ExternalDependencyUnavailableError(
          'Rate limiting service is temporarily unavailable',
          'REDIS_CONNECTION_ERROR',
          { originalError: error.message }
        );
      }
      
      // For unexpected errors, log and continue
      this.logger.error('Rate limit middleware error:', error.stack, 'RateLimitMiddleware');
      next();
    }
  }

  /**
   * Determine which journey the request belongs to based on the path or GraphQL operation.
   * @param req The Express request object
   * @returns The journey identifier or null if not determined
   */
  private getRequestJourney(req: Request): string | null {
    // First check path segments
    const path = req.path.toLowerCase();
    
    if (path.includes('/health')) {
      return JOURNEY_IDS.HEALTH;
    } else if (path.includes('/care')) {
      return JOURNEY_IDS.CARE;
    } else if (path.includes('/plan')) {
      return JOURNEY_IDS.PLAN;
    } else if (path.includes('/gamification') || path.includes('/game')) {
      return JOURNEY_IDS.GAME;
    }
    
    // If path doesn't indicate journey, try GraphQL operation (if available)
    if (req.body?.operationName && typeof req.body.operationName === 'string') {
      const operation = req.body.operationName.toLowerCase();
      
      if (operation.includes('health')) return JOURNEY_IDS.HEALTH;
      if (operation.includes('care')) return JOURNEY_IDS.CARE;
      if (operation.includes('plan')) return JOURNEY_IDS.PLAN;
      if (operation.includes('game') || operation.includes('achievement')) return JOURNEY_IDS.GAME;
    }
    
    // If GraphQL query is available, try to determine journey from it
    if (req.body?.query && typeof req.body.query === 'string') {
      const query = req.body.query.toLowerCase();
      
      if (query.includes('health')) return JOURNEY_IDS.HEALTH;
      if (query.includes('care')) return JOURNEY_IDS.CARE;
      if (query.includes('plan')) return JOURNEY_IDS.PLAN;
      if (query.includes('game') || query.includes('achievement')) return JOURNEY_IDS.GAME;
    }
    
    return null;
  }
}
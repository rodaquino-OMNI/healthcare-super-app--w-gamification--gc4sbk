import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService, LogLevel } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { v4 as uuidv4 } from '@app/shared/utils';

/**
 * Standard span attribute keys for HTTP tracing.
 * These are used to annotate spans with consistent metadata.
 */
enum SpanAttributes {
  HTTP_METHOD = 'http.method',
  HTTP_URL = 'http.url',
  HTTP_STATUS_CODE = 'http.status_code',
  HTTP_REQUEST_ID = 'http.request_id',
  HTTP_RESPONSE_DURATION = 'http.duration_ms',
  USER_ID = 'user.id',
  JOURNEY_TYPE = 'journey.type'
}

/**
 * Defines the available journey types in the AUSTA SuperApp.
 * These correspond to the three main user journeys plus gamification.
 */
export type IJourneyType = 'health' | 'care' | 'plan' | 'game';

/**
 * Journey context interface for tracing spans across services.
 * Provides journey-specific context for distributed tracing.
 */
interface JourneyContext {
  journeyType: IJourneyType;
  userId?: string;
  // Additional journey-specific context can be added here
}

/**
 * Middleware that logs incoming requests and outgoing responses with enhanced context.
 * Provides valuable information for monitoring, debugging, and auditing purposes.
 * Integrates with the tracing service for distributed tracing and correlation.
 * Implements standardized JSON format for structured logging with context enrichment.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  /**
   * Constructor for the LoggingMiddleware class.
   * @param loggerService Service used for logging with context enrichment.
   * @param tracingService Service used for distributed tracing and correlation.
   */
  constructor(
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Logs the incoming request and outgoing response with enhanced context.
   * Extracts or generates request ID, user ID, and journey information.
   * Creates trace spans with proper context and attributes.
   * @param req The incoming request object.
   * @param res The outgoing response object.
   * @param next The next function in the middleware chain.
   */
  use(req: Request, res: Response, next: NextFunction): void {
    // Extract basic request information
    const { method, originalUrl, headers } = req;
    
    // Extract or generate request ID for correlation
    const requestId = headers['x-request-id'] as string || uuidv4();
    if (!headers['x-request-id']) {
      req.headers['x-request-id'] = requestId;
    }
    
    // Extract user information if available
    const userId = this.extractUserId(req);
    
    // Extract journey information from URL
    const journey = this.extractJourney(originalUrl);
    const journeyContext = this.createJourneyContext(journey, userId);
    
    // Create log metadata with all context information
    const logMetadata = {
      requestId,
      userId: userId || 'anonymous',
      journey: journey || 'general',
      method,
      path: originalUrl,
      userAgent: headers['user-agent'],
      clientIp: this.extractClientIp(req),
    };
    
    // Create span attributes for tracing
    const spanAttributes: Record<string, string> = {
      [SpanAttributes.HTTP_METHOD]: method,
      [SpanAttributes.HTTP_URL]: originalUrl,
      [SpanAttributes.HTTP_REQUEST_ID]: requestId,
    };
    
    if (userId) {
      spanAttributes[SpanAttributes.USER_ID] = userId;
    }
    
    if (journey) {
      spanAttributes[SpanAttributes.JOURNEY_TYPE] = journey;
    }

    try {
      // Track start time for duration calculation
      const startTime = Date.now();
      
      // Create a span for request tracing with all context information
      this.tracingService.createSpan(
        `API-Gateway ${method} ${originalUrl}`,
        {
          attributes: spanAttributes,
          journeyContext
        },
        async (span) => {
          // Log the request with all context information
          this.loggerService.log(
            `Request: ${method} ${originalUrl}`,
            {
              context: 'API-Gateway',
              journey,
              metadata: logMetadata
            }
          );
        }
      ).catch(error => {
        // Catch and log any errors from tracing
        this.loggerService.error(
          `Tracing error: ${error.message}`,
          {
            context: 'API-Gateway',
            journey,
            error,
            metadata: logMetadata
          }
        );
      });
      
      // Store references for the response callback closure
      const logger = this.loggerService;
      const tracer = this.tracingService;
      
      // Capture original end method
      const originalEnd = res.end;
      
      // Override end method to log response
      res.end = function(...args: any[]): any {
        const statusCode = this.statusCode;
        const duration = Date.now() - startTime;
        
        // Add response information to metadata
        const responseMetadata = {
          ...logMetadata,
          statusCode,
          duration,
          success: statusCode < 400,
        };
        
        // Add response attributes to the current span
        tracer.addAttributesToCurrentSpan({
          [SpanAttributes.HTTP_STATUS_CODE]: statusCode.toString(),
          [SpanAttributes.HTTP_RESPONSE_DURATION]: duration.toString(),
        });
        
        // Determine log level based on status code
        const logLevel = statusCode >= 500 ? LogLevel.ERROR :
                         statusCode >= 400 ? LogLevel.WARN :
                         LogLevel.INFO;
        
        // Log response with appropriate level and all context information
        if (logLevel === LogLevel.ERROR) {
          logger.error(
            `Response: ${statusCode} ${method} ${originalUrl} - ${duration}ms`,
            {
              context: 'API-Gateway',
              journey,
              metadata: responseMetadata
            }
          );
        } else if (logLevel === LogLevel.WARN) {
          logger.warn(
            `Response: ${statusCode} ${method} ${originalUrl} - ${duration}ms`,
            {
              context: 'API-Gateway',
              journey,
              metadata: responseMetadata
            }
          );
        } else {
          logger.log(
            `Response: ${statusCode} ${method} ${originalUrl} - ${duration}ms`,
            {
              context: 'API-Gateway',
              journey,
              metadata: responseMetadata
            }
          );
        }
        
        // Call original end method
        return originalEnd.apply(this, args);
      };
      
      // Add request ID to response headers for client-side correlation
      res.setHeader('x-request-id', requestId);
      
      // Continue middleware chain
      next();
    } catch (error) {
      // Log any errors in the middleware itself
      this.loggerService.error(
        `Logging middleware error: ${error.message}`,
        {
          context: 'API-Gateway',
          journey,
          error,
          metadata: logMetadata
        }
      );
      
      // Continue middleware chain even if logging fails
      next();
    }
  }

  /**
   * Extracts the journey identifier from the request URL.
   * @param url The request URL.
   * @returns The journey identifier or null if not found.
   */
  private extractJourney(url: string): IJourneyType | null {
    // Extract journey from URL using standardized patterns
    const journeyPatterns = {
      health: /\/health/i,
      care: /\/care/i,
      plan: /\/plan/i,
      game: /\/gamification/i,
    };

    for (const [journey, pattern] of Object.entries(journeyPatterns)) {
      if (pattern.test(url)) {
        return journey as IJourneyType;
      }
    }

    return null;
  }

  /**
   * Extracts the user ID from the request if available.
   * @param req The request object.
   * @returns The user ID or null if not available.
   */
  private extractUserId(req: Request): string | null {
    // Extract from JWT token if available
    if (req.user && 'id' in req.user) {
      return req.user.id as string;
    }
    
    // Extract from custom header if available
    if (req.headers['x-user-id']) {
      return req.headers['x-user-id'] as string;
    }
    
    return null;
  }

  /**
   * Extracts the client IP address from the request.
   * @param req The request object.
   * @returns The client IP address.
   */
  private extractClientIp(req: Request): string {
    // Check for forwarded IP (when behind proxy/load balancer)
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      // Get the first IP in the list (client's original IP)
      return forwardedFor.split(',')[0].trim();
    }
    
    // Fallback to direct connection IP
    return req.ip || 'unknown';
  }

  /**
   * Creates a journey context object for tracing.
   * @param journey The journey identifier.
   * @param userId The user ID.
   * @returns A journey context object for tracing.
   */
  private createJourneyContext(journey: IJourneyType | null, userId: string | null): JourneyContext | null {
    if (!journey) {
      return null;
    }
    
    const baseContext = {
      journeyType: journey,
      userId: userId || undefined,
    };
    
    // Create journey-specific context
    switch (journey) {
      case 'health':
        return {
          ...baseContext,
          journeyType: 'health',
        };
      case 'care':
        return {
          ...baseContext,
          journeyType: 'care',
        };
      case 'plan':
        return {
          ...baseContext,
          journeyType: 'plan',
        };
      case 'game':
        return {
          ...baseContext,
          journeyType: 'game',
        };
      default:
        return baseContext as JourneyContext;
    }
  }
}
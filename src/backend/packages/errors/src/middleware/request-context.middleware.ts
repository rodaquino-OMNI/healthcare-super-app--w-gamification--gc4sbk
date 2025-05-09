import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JourneyContext } from '../base';

/**
 * Interface extending Express Request to include context information
 */
export interface RequestWithContext extends Request {
  /**
   * Context object containing metadata about the request
   */
  context?: RequestContext;
}

/**
 * Interface defining the structure of request context information
 */
export interface RequestContext {
  /**
   * Unique identifier for the request, used for tracing and correlation
   */
  requestId: string;
  
  /**
   * User ID if the request is authenticated
   */
  userId?: string;
  
  /**
   * User's email if available from authentication
   */
  userEmail?: string;
  
  /**
   * Journey context (health, care, plan, etc.)
   */
  journey?: JourneyContext;
  
  /**
   * Timestamp when the request was received
   */
  timestamp: Date;
  
  /**
   * Original IP address of the client
   */
  clientIp?: string;
  
  /**
   * User agent string from the request
   */
  userAgent?: string;
  
  /**
   * Trace ID for distributed tracing systems (e.g., OpenTelemetry)
   */
  traceId?: string;
  
  /**
   * Span ID for distributed tracing systems
   */
  spanId?: string;
  
  /**
   * Additional metadata that might be useful for debugging or analytics
   */
  [key: string]: any;
}

/**
 * Constants for header names used by the middleware
 */
export const REQUEST_HEADERS = {
  REQUEST_ID: 'x-request-id',
  TRACE_ID: 'x-trace-id',
  SPAN_ID: 'x-span-id',
  JOURNEY: 'x-journey-id',
  FORWARDED_FOR: 'x-forwarded-for',
  REAL_IP: 'x-real-ip',
  USER_AGENT: 'user-agent',
  AUTHORIZATION: 'authorization'
};

/**
 * Middleware that attaches essential contextual information to each request,
 * enabling richer error tracking and debugging capabilities.
 * 
 * This middleware:
 * 1. Generates and assigns a unique request ID if not already present
 * 2. Extracts user information from authentication tokens
 * 3. Identifies the current journey context
 * 4. Stores all this metadata on the request object
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  /**
   * Implements the middleware function
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  use(req: RequestWithContext, res: Response, next: NextFunction): void {
    try {
      // Create context object on the request
      req.context = this.createRequestContext(req);
      
      // Add request ID to response headers for client-side correlation
      res.setHeader(REQUEST_HEADERS.REQUEST_ID, req.context.requestId);
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      // If context creation fails, create a minimal context and continue
      req.context = {
        requestId: uuidv4(),
        timestamp: new Date()
      };
      
      // Add request ID to response headers
      res.setHeader(REQUEST_HEADERS.REQUEST_ID, req.context.requestId);
      
      // Continue to the next middleware or route handler
      next();
    }
  }

  /**
   * Creates a request context object from the request
   * 
   * @param req - Express request object
   * @returns Request context object
   */
  private createRequestContext(req: Request): RequestContext {
    // Get or generate request ID
    const requestId = this.getRequestId(req);
    
    // Get trace and span IDs for distributed tracing
    const traceId = this.getHeader(req, REQUEST_HEADERS.TRACE_ID);
    const spanId = this.getHeader(req, REQUEST_HEADERS.SPAN_ID);
    
    // Get journey context
    const journey = this.getJourneyContext(req);
    
    // Get client IP address
    const clientIp = this.getClientIp(req);
    
    // Get user agent
    const userAgent = this.getHeader(req, REQUEST_HEADERS.USER_AGENT);
    
    // Extract user information from authentication token
    const { userId, userEmail } = this.extractUserInfo(req);
    
    // Create and return the context object
    return {
      requestId,
      userId,
      userEmail,
      journey,
      timestamp: new Date(),
      clientIp,
      userAgent,
      traceId,
      spanId,
      path: req.path,
      method: req.method
    };
  }

  /**
   * Gets or generates a request ID
   * 
   * @param req - Express request object
   * @returns Request ID
   */
  private getRequestId(req: Request): string {
    // Check if request ID is already in headers
    const existingRequestId = this.getHeader(req, REQUEST_HEADERS.REQUEST_ID);
    
    // Return existing request ID or generate a new one
    return existingRequestId || uuidv4();
  }

  /**
   * Gets the journey context from the request
   * 
   * @param req - Express request object
   * @returns Journey context or undefined
   */
  private getJourneyContext(req: Request): JourneyContext | undefined {
    const journeyHeader = this.getHeader(req, REQUEST_HEADERS.JOURNEY);
    
    // If no journey header, try to infer from path
    if (!journeyHeader) {
      return this.inferJourneyFromPath(req.path);
    }
    
    // Validate and return journey context
    switch (journeyHeader.toLowerCase()) {
      case 'health':
        return JourneyContext.HEALTH;
      case 'care':
        return JourneyContext.CARE;
      case 'plan':
        return JourneyContext.PLAN;
      case 'gamification':
        return JourneyContext.GAMIFICATION;
      case 'auth':
        return JourneyContext.AUTH;
      case 'notification':
        return JourneyContext.NOTIFICATION;
      default:
        return JourneyContext.SYSTEM;
    }
  }

  /**
   * Attempts to infer journey context from the request path
   * 
   * @param path - Request path
   * @returns Journey context or undefined
   */
  private inferJourneyFromPath(path: string): JourneyContext | undefined {
    const pathLower = path.toLowerCase();
    
    if (pathLower.includes('/health')) {
      return JourneyContext.HEALTH;
    } else if (pathLower.includes('/care')) {
      return JourneyContext.CARE;
    } else if (pathLower.includes('/plan')) {
      return JourneyContext.PLAN;
    } else if (pathLower.includes('/gamification')) {
      return JourneyContext.GAMIFICATION;
    } else if (pathLower.includes('/auth')) {
      return JourneyContext.AUTH;
    } else if (pathLower.includes('/notification')) {
      return JourneyContext.NOTIFICATION;
    }
    
    return JourneyContext.SYSTEM;
  }

  /**
   * Gets the client IP address from various headers
   * 
   * @param req - Express request object
   * @returns Client IP address or undefined
   */
  private getClientIp(req: Request): string | undefined {
    // Check X-Forwarded-For header (common when behind a proxy)
    const forwardedFor = this.getHeader(req, REQUEST_HEADERS.FORWARDED_FOR);
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      const ips = forwardedFor.split(',');
      return ips[0].trim();
    }
    
    // Check X-Real-IP header (used by some proxies)
    const realIp = this.getHeader(req, REQUEST_HEADERS.REAL_IP);
    if (realIp) {
      return realIp;
    }
    
    // Fall back to connection remote address
    return req.socket?.remoteAddress;
  }

  /**
   * Extracts user information from the authentication token
   * 
   * @param req - Express request object
   * @returns Object containing userId and userEmail if available
   */
  private extractUserInfo(req: Request): { userId?: string; userEmail?: string } {
    // Check if user is already set on request (e.g., by auth middleware)
    if (req.user) {
      return {
        userId: (req.user as any).id || (req.user as any).userId,
        userEmail: (req.user as any).email
      };
    }
    
    // Get authorization header
    const authHeader = this.getHeader(req, REQUEST_HEADERS.AUTHORIZATION);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {};
    }
    
    try {
      // Extract token
      const token = authHeader.substring(7);
      
      // Decode JWT token (without verification, just to extract user info)
      // This is safe because we're not using this for authentication, just for context
      const payload = this.decodeJwt(token);
      
      return {
        userId: payload.sub || payload.id || payload.userId,
        userEmail: payload.email
      };
    } catch (error) {
      // If token parsing fails, return empty object
      return {};
    }
  }

  /**
   * Decodes a JWT token without verification
   * 
   * @param token - JWT token
   * @returns Decoded token payload
   */
  private decodeJwt(token: string): any {
    try {
      // Split the token into parts
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {};
      }
      
      // Decode the payload (second part)
      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64').toString('utf8');
      
      return JSON.parse(decoded);
    } catch (error) {
      // If decoding fails, return empty object
      return {};
    }
  }

  /**
   * Gets a header value from the request, case-insensitive
   * 
   * @param req - Express request object
   * @param headerName - Header name
   * @returns Header value or undefined
   */
  private getHeader(req: Request, headerName: string): string | undefined {
    // Headers in Express are case-insensitive
    return req.headers[headerName.toLowerCase()] as string | undefined;
  }
}

/**
 * Factory function to create an Express middleware function
 * This allows the middleware to be used in Express applications without NestJS
 * 
 * @returns Express middleware function
 */
export function createRequestContextMiddleware() {
  const middleware = new RequestContextMiddleware();
  
  return (req: RequestWithContext, res: Response, next: NextFunction) => {
    middleware.use(req, res, next);
  };
}
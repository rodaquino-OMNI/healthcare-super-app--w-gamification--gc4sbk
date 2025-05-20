/**
 * @file context-manager.ts
 * @description Implements the ContextManager class that manages the creation, merging,
 * and manipulation of logging contexts throughout the application. This class provides
 * methods for creating different context types, merging multiple contexts, and integrating
 * with the tracing service for correlation IDs.
 */

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// Import interfaces from their respective files
import { LoggingContext } from './context.interface';
import { RequestContext } from './request-context.interface';
import { UserContext } from './user-context.interface';
import { JourneyContext } from './journey-context.interface';

/**
 * Interface for the tracing service
 */
  /**
   * Correlation ID for connecting logs, traces, and metrics
   */
  correlationId?: string;

  /**
   * Trace ID for distributed tracing
   */
  traceId?: string;

  /**
   * Span ID for the current operation
   */
  spanId?: string;

  /**
   * Service name that generated the log
   */
  service?: string;

  /**
   * Application name
   */
  application?: string;

  /**
   * Environment (development, staging, production)
   */
  environment?: string;

  /**
   * Timestamp when the context was created
   */
  timestamp?: Date;

  /**
   * Additional context properties
   */
  [key: string]: any;
}

/**
 * Interface for HTTP request-specific context
 */
export interface RequestContext extends LoggingContext {
  /**
   * Unique identifier for the request
   */
  requestId: string;

  /**
   * IP address of the client
   */
  ip?: string;

  /**
   * HTTP method (GET, POST, etc.)
   */
  method?: string;

  /**
   * Request URL
   */
  url?: string;

  /**
   * Request path
   */
  path?: string;

  /**
   * User agent string
   */
  userAgent?: string;

  /**
   * Sanitized request parameters
   */
  params?: Record<string, any>;

  /**
   * Sanitized request headers
   */
  headers?: Record<string, string>;
}

/**
 * Interface for user-specific context
 */
export interface UserContext extends LoggingContext {
  /**
   * User ID
   */
  userId: string;

  /**
   * Authentication status
   */
  isAuthenticated: boolean;

  /**
   * User roles
   */
  roles?: string[];

  /**
   * User permissions
   */
  permissions?: string[];

  /**
   * User preferences affecting system behavior
   */
  preferences?: Record<string, any>;
}

/**
 * Interface for journey-specific context
 */
export interface JourneyContext extends LoggingContext {
  /**
   * Journey type (Health, Care, Plan)
   */
  journeyType: 'health' | 'care' | 'plan';

  /**
   * Journey-specific state
   */
  journeyState?: Record<string, any>;

  /**
   * Journey metadata
   */
  journeyMetadata?: Record<string, any>;

  /**
   * Cross-journey context when needed
   */
  crossJourneyContext?: Record<string, any>;
}

/**
 * Interface for the tracing service
 */
export interface TracingService {
  /**
   * Gets the current trace context
   */
  getCurrentTraceContext(): { traceId?: string; spanId?: string };

  /**
   * Creates a new span
   */
  createSpan(name: string, options?: any): any;

  /**
   * Ends a span
   */
  endSpan(span: any): void;
}

/**
 * Manages the creation, merging, and manipulation of logging contexts
 * throughout the application.
 */
@Injectable()
export class ContextManager {
  private defaultContext: LoggingContext;
  private tracingService?: TracingService;

  /**
   * Creates a new ContextManager instance
   * @param options Configuration options
   */
  constructor(options?: {
    defaultContext?: Partial<LoggingContext>;
    tracingService?: TracingService;
  }) {
    this.defaultContext = {
      application: 'austa-superapp',
      environment: process.env.NODE_ENV || 'development',
      service: process.env.SERVICE_NAME,
      timestamp: new Date(),
      correlationId: uuidv4(),
      ...(options?.defaultContext || {}),
    };

    this.tracingService = options?.tracingService;
  }

  /**
   * Creates a new base logging context
   * @param context Optional context properties to include
   * @returns A new logging context
   */
  createContext(context?: Partial<LoggingContext>): LoggingContext {
    const baseContext = { ...this.defaultContext };
    
    // Add trace context if tracing service is available
    if (this.tracingService) {
      const traceContext = this.tracingService.getCurrentTraceContext();
      if (traceContext.traceId) {
        baseContext.traceId = traceContext.traceId;
      }
      if (traceContext.spanId) {
        baseContext.spanId = traceContext.spanId;
      }
    }

    // Update timestamp to current time
    baseContext.timestamp = new Date();

    // Merge with provided context
    return { ...baseContext, ...(context || {}) };
  }

  /**
   * Creates a new request context
   * @param requestInfo Request information
   * @returns A new request context
   */
  createRequestContext(requestInfo: Partial<RequestContext>): RequestContext {
    const baseContext = this.createContext();
    
    // Ensure requestId is present
    const requestId = requestInfo.requestId || uuidv4();
    
    return {
      ...baseContext,
      ...requestInfo,
      requestId,
    } as RequestContext;
  }

  /**
   * Creates a new user context
   * @param userInfo User information
   * @returns A new user context
   */
  createUserContext(userInfo: Partial<UserContext>): UserContext {
    const baseContext = this.createContext();
    
    // Ensure required fields are present
    if (!userInfo.userId) {
      throw new Error('User ID is required for user context');
    }
    
    return {
      ...baseContext,
      ...userInfo,
      isAuthenticated: userInfo.isAuthenticated ?? false,
    } as UserContext;
  }

  /**
   * Creates a new journey context
   * @param journeyInfo Journey information
   * @returns A new journey context
   */
  createJourneyContext(journeyInfo: Partial<JourneyContext>): JourneyContext {
    const baseContext = this.createContext();
    
    // Ensure required fields are present
    if (!journeyInfo.journeyType) {
      throw new Error('Journey type is required for journey context');
    }
    
    return {
      ...baseContext,
      ...journeyInfo,
    } as JourneyContext;
  }

  /**
   * Merges multiple contexts into a single context
   * @param contexts Contexts to merge
   * @returns Merged context
   */
  mergeContexts(...contexts: Partial<LoggingContext>[]): LoggingContext {
    if (contexts.length === 0) {
      return this.createContext();
    }

    // Start with a base context
    const baseContext = this.createContext();
    
    // Merge all contexts, with later contexts taking precedence
    return contexts.reduce(
      (merged, context) => ({ ...merged, ...(context || {}) }),
      baseContext
    );
  }

  /**
   * Creates a complete context with request, user, and journey information
   * @param requestInfo Request information
   * @param userInfo User information
   * @param journeyInfo Journey information
   * @returns Complete context with all information
   */
  createCompleteContext(
    requestInfo?: Partial<RequestContext>,
    userInfo?: Partial<UserContext>,
    journeyInfo?: Partial<JourneyContext>
  ): LoggingContext {
    const contexts: Partial<LoggingContext>[] = [this.createContext()];

    // Add request context if provided
    if (requestInfo) {
      try {
        contexts.push(this.createRequestContext(requestInfo));
      } catch (error) {
        // Log error but continue with other contexts
        console.error('Error creating request context:', error);
      }
    }

    // Add user context if provided
    if (userInfo && userInfo.userId) {
      try {
        contexts.push(this.createUserContext(userInfo));
      } catch (error) {
        // Log error but continue with other contexts
        console.error('Error creating user context:', error);
      }
    }

    // Add journey context if provided
    if (journeyInfo && journeyInfo.journeyType) {
      try {
        contexts.push(this.createJourneyContext(journeyInfo));
      } catch (error) {
        // Log error but continue with other contexts
        console.error('Error creating journey context:', error);
      }
    }

    // Merge all contexts
    return this.mergeContexts(...contexts);
  }

  /**
   * Extracts context information for propagation across service boundaries
   * @param context Context to extract from
   * @returns Object with serialized context for propagation
   */
  extractContextForPropagation(context: LoggingContext): Record<string, string> {
    const propagationContext: Record<string, string> = {};

    // Include correlation ID for connecting logs
    if (context.correlationId) {
      propagationContext['x-correlation-id'] = context.correlationId;
    }

    // Include trace context for distributed tracing
    if (context.traceId) {
      propagationContext['traceparent'] = this.formatTraceParent(context);
    }

    // Include journey information if available
    const journeyContext = context as JourneyContext;
    if (journeyContext.journeyType) {
      propagationContext['x-journey-type'] = journeyContext.journeyType;
    }

    // Include user ID if available
    const userContext = context as UserContext;
    if (userContext.userId) {
      propagationContext['x-user-id'] = userContext.userId;
    }

    return propagationContext;
  }

  /**
   * Creates a context from propagated headers
   * @param headers Headers containing propagated context
   * @returns Context created from propagated information
   */
  createContextFromPropagation(headers: Record<string, string>): LoggingContext {
    const context = this.createContext();

    // Extract correlation ID
    if (headers['x-correlation-id']) {
      context.correlationId = headers['x-correlation-id'];
    }

    // Extract trace context
    if (headers['traceparent']) {
      const traceContext = this.parseTraceParent(headers['traceparent']);
      if (traceContext) {
        context.traceId = traceContext.traceId;
        context.spanId = traceContext.spanId;
      }
    }

    // Extract journey information
    if (headers['x-journey-type']) {
      (context as JourneyContext).journeyType = headers['x-journey-type'] as any;
    }

    // Extract user ID
    if (headers['x-user-id']) {
      (context as UserContext).userId = headers['x-user-id'];
      (context as UserContext).isAuthenticated = true;
    }

    return context;
  }

  /**
   * Formats trace context according to W3C Trace Context specification
   * @param context Context containing trace information
   * @returns Formatted traceparent header value
   */
  private formatTraceParent(context: LoggingContext): string {
    // Default values if not provided
    const traceId = context.traceId || '00000000000000000000000000000000';
    const spanId = context.spanId || '0000000000000000';
    const flags = '01'; // Sampled

    // Format: version-traceId-spanId-flags
    return `00-${traceId}-${spanId}-${flags}`;
  }

  /**
   * Parses a traceparent header value according to W3C Trace Context specification
   * @param traceparent Traceparent header value
   * @returns Parsed trace context or undefined if invalid
   */
  private parseTraceParent(traceparent: string): { traceId: string; spanId: string } | undefined {
    try {
      // Expected format: 00-traceId-spanId-flags
      const parts = traceparent.split('-');
      if (parts.length !== 4) {
        return undefined;
      }

      const [version, traceId, spanId, flags] = parts;
      
      // Basic validation
      if (version !== '00' || traceId.length !== 32 || spanId.length !== 16) {
        return undefined;
      }

      return { traceId, spanId };
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Sets the tracing service for this context manager
   * @param tracingService Tracing service to use
   */
  setTracingService(tracingService: TracingService): void {
    this.tracingService = tracingService;
  }

  /**
   * Gets the current tracing service
   * @returns Current tracing service or undefined if not set
   */
  getTracingService(): TracingService | undefined {
    return this.tracingService;
  }
}
import { Injectable } from '@nestjs/common';
import { JourneyType } from '../interfaces/log-entry.interface';

/**
 * Interface for the base logging context that all other context types extend.
 * Provides common properties for correlation, service identification, and timestamps.
 */
export interface LoggingContext {
  /**
   * Unique identifier for the trace (for distributed tracing)
   */
  traceId?: string;

  /**
   * Unique identifier for the span within a trace
   */
  spanId?: string;

  /**
   * Identifier of the parent span
   */
  parentSpanId?: string;

  /**
   * The name of the service generating the log
   */
  serviceName?: string;

  /**
   * Timestamp when the context was created
   */
  timestamp?: Date;

  /**
   * Additional metadata as key-value pairs
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for journey-specific context information
 */
export interface JourneyContext extends LoggingContext {
  /**
   * The type of journey (health, care, plan)
   */
  journeyType: JourneyType;

  /**
   * Journey-specific identifier (e.g., appointment ID, claim ID, health record ID)
   */
  resourceId?: string;

  /**
   * The specific action being performed within the journey
   */
  action?: string;

  /**
   * Additional journey-specific data
   */
  journeyData?: Record<string, any>;
}

/**
 * Interface for user-specific context information
 */
export interface UserContext extends LoggingContext {
  /**
   * Unique identifier for the user
   */
  userId: string;

  /**
   * Unique identifier for the user session
   */
  sessionId?: string;

  /**
   * User roles or permissions
   */
  roles?: string[];

  /**
   * Whether the user is authenticated
   */
  isAuthenticated?: boolean;

  /**
   * Additional user-specific data
   */
  userData?: Record<string, any>;
}

/**
 * Interface for HTTP request-specific context information
 */
export interface RequestContext extends LoggingContext {
  /**
   * Unique identifier for the request
   */
  requestId: string;

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
   * IP address of the client
   */
  clientIp?: string;

  /**
   * User agent of the client
   */
  userAgent?: string;

  /**
   * Sanitized request parameters
   */
  params?: Record<string, any>;

  /**
   * Sanitized request headers
   */
  headers?: Record<string, any>;
}

/**
 * Optional interface for the tracing service that can be injected into the ContextManager.
 * This allows for integration with the tracing system for correlation IDs.
 */
export interface TracingService {
  /**
   * Gets the current trace ID
   */
  getCurrentTraceId(): string | undefined;

  /**
   * Gets the current span ID
   */
  getCurrentSpanId(): string | undefined;

  /**
   * Gets the parent span ID
   */
  getParentSpanId(): string | undefined;

  /**
   * Creates a new span with the given name and options
   */
  createSpan?(name: string, options?: any): any;

  /**
   * Ends the current span
   */
  endSpan?(): void;
}

/**
 * Options for creating a new logging context
 */
export interface ContextOptions {
  /**
   * Whether to include trace information from the tracing service
   */
  includeTraceInfo?: boolean;

  /**
   * The service name to include in the context
   */
  serviceName?: string;

  /**
   * Additional metadata to include in the context
   */
  metadata?: Record<string, any>;
}

/**
 * ContextManager class that manages the creation, merging, and manipulation of logging contexts.
 * This class provides methods for creating different context types, merging multiple contexts,
 * and integrating with the tracing service for correlation IDs.
 */
@Injectable()
export class ContextManager {
  private readonly serviceName: string;
  private readonly tracingService?: TracingService;

  /**
   * Creates a new ContextManager instance
   * @param options Configuration options for the ContextManager
   */
  constructor(options?: {
    serviceName?: string;
    tracingService?: TracingService;
  }) {
    this.serviceName = options?.serviceName || 'unknown-service';
    this.tracingService = options?.tracingService;
  }

  /**
   * Creates a base logging context with common properties
   * @param options Options for creating the context
   * @returns A new LoggingContext instance
   */
  createContext(options?: ContextOptions): LoggingContext {
    const context: LoggingContext = {
      timestamp: new Date(),
      serviceName: options?.serviceName || this.serviceName,
      metadata: options?.metadata || {},
    };

    // Add trace information if available and requested
    if (options?.includeTraceInfo !== false && this.tracingService) {
      try {
        context.traceId = this.tracingService.getCurrentTraceId();
        context.spanId = this.tracingService.getCurrentSpanId();
        context.parentSpanId = this.tracingService.getParentSpanId();
      } catch (error) {
        // Silently handle errors from tracing service
        context.metadata = {
          ...context.metadata,
          tracingError: error instanceof Error ? error.message : 'Unknown tracing error',
        };
      }
    }

    return context;
  }

  /**
   * Creates a journey-specific context
   * @param journeyType The type of journey (health, care, plan)
   * @param options Additional options for the context
   * @returns A new JourneyContext instance
   */
  createJourneyContext(
    journeyType: JourneyType,
    options?: ContextOptions & {
      resourceId?: string;
      action?: string;
      journeyData?: Record<string, any>;
    },
  ): JourneyContext {
    const baseContext = this.createContext(options);
    
    return {
      ...baseContext,
      journeyType,
      resourceId: options?.resourceId,
      action: options?.action,
      journeyData: options?.journeyData || {},
    };
  }

  /**
   * Creates a user-specific context
   * @param userId The unique identifier for the user
   * @param options Additional options for the context
   * @returns A new UserContext instance
   */
  createUserContext(
    userId: string,
    options?: ContextOptions & {
      sessionId?: string;
      roles?: string[];
      isAuthenticated?: boolean;
      userData?: Record<string, any>;
    },
  ): UserContext {
    const baseContext = this.createContext(options);
    
    return {
      ...baseContext,
      userId,
      sessionId: options?.sessionId,
      roles: options?.roles || [],
      isAuthenticated: options?.isAuthenticated !== undefined ? options.isAuthenticated : true,
      userData: options?.userData || {},
    };
  }

  /**
   * Creates a request-specific context
   * @param requestId The unique identifier for the request
   * @param options Additional options for the context
   * @returns A new RequestContext instance
   */
  createRequestContext(
    requestId: string,
    options?: ContextOptions & {
      method?: string;
      url?: string;
      path?: string;
      clientIp?: string;
      userAgent?: string;
      params?: Record<string, any>;
      headers?: Record<string, any>;
    },
  ): RequestContext {
    const baseContext = this.createContext(options);
    
    return {
      ...baseContext,
      requestId,
      method: options?.method,
      url: options?.url,
      path: options?.path,
      clientIp: options?.clientIp,
      userAgent: options?.userAgent,
      params: this.sanitizeObject(options?.params || {}),
      headers: this.sanitizeObject(options?.headers || {}),
    };
  }

  /**
   * Merges multiple contexts into a single context
   * @param contexts The contexts to merge
   * @returns A merged context with properties from all input contexts
   */
  mergeContexts<T extends LoggingContext>(...contexts: LoggingContext[]): T {
    if (contexts.length === 0) {
      return this.createContext() as T;
    }

    if (contexts.length === 1) {
      return contexts[0] as T;
    }

    const mergedContext: Record<string, any> = {};
    let mergedMetadata: Record<string, any> = {};

    // Merge all contexts, with later contexts overriding earlier ones
    for (const context of contexts) {
      if (!context) continue;

      // Merge metadata separately to avoid overriding the entire object
      if (context.metadata) {
        mergedMetadata = { ...mergedMetadata, ...context.metadata };
      }

      // Merge all other properties
      Object.entries(context).forEach(([key, value]) => {
        if (key !== 'metadata' && value !== undefined) {
          mergedContext[key] = value;
        }
      });
    }

    // Add the merged metadata
    mergedContext.metadata = mergedMetadata;

    return mergedContext as T;
  }

  /**
   * Creates a complete context by merging journey, user, and request contexts
   * @param options Options for creating the complete context
   * @returns A merged context with properties from all context types
   */
  createCompleteContext(options: {
    journeyType?: JourneyType;
    resourceId?: string;
    action?: string;
    journeyData?: Record<string, any>;
    userId?: string;
    sessionId?: string;
    roles?: string[];
    userData?: Record<string, any>;
    requestId?: string;
    method?: string;
    url?: string;
    path?: string;
    clientIp?: string;
    userAgent?: string;
    params?: Record<string, any>;
    headers?: Record<string, any>;
    includeTraceInfo?: boolean;
    serviceName?: string;
    metadata?: Record<string, any>;
  }): LoggingContext {
    const contexts: LoggingContext[] = [this.createContext(options)];

    // Add journey context if journey type is provided
    if (options.journeyType) {
      contexts.push(
        this.createJourneyContext(options.journeyType, {
          resourceId: options.resourceId,
          action: options.action,
          journeyData: options.journeyData,
          includeTraceInfo: false, // Already included in base context
        }),
      );
    }

    // Add user context if user ID is provided
    if (options.userId) {
      contexts.push(
        this.createUserContext(options.userId, {
          sessionId: options.sessionId,
          roles: options.roles,
          userData: options.userData,
          includeTraceInfo: false, // Already included in base context
        }),
      );
    }

    // Add request context if request ID is provided
    if (options.requestId) {
      contexts.push(
        this.createRequestContext(options.requestId, {
          method: options.method,
          url: options.url,
          path: options.path,
          clientIp: options.clientIp,
          userAgent: options.userAgent,
          params: options.params,
          headers: options.headers,
          includeTraceInfo: false, // Already included in base context
        }),
      );
    }

    return this.mergeContexts(...contexts);
  }

  /**
   * Extracts context information from a request object
   * @param request The HTTP request object (Express or NestJS)
   * @returns A RequestContext with information extracted from the request
   */
  extractContextFromRequest(request: any): RequestContext {
    try {
      // Generate a request ID if not present
      const requestId = request.id || request.headers?.['x-request-id'] || this.generateRequestId();

      return this.createRequestContext(requestId, {
        method: request.method,
        url: request.url || request.originalUrl,
        path: request.path || request.route?.path,
        clientIp: this.extractClientIp(request),
        userAgent: request.headers?.['user-agent'],
        params: {
          ...request.params,
          ...request.query,
          // Exclude body for security reasons, can be added explicitly if needed
        },
        headers: this.sanitizeHeaders(request.headers || {}),
      });
    } catch (error) {
      // Fallback to a minimal context in case of errors
      return this.createRequestContext(this.generateRequestId(), {
        metadata: {
          extractError: error instanceof Error ? error.message : 'Unknown error extracting request context',
        },
      });
    }
  }

  /**
   * Serializes a context to a string for transmission across service boundaries
   * @param context The context to serialize
   * @returns A string representation of the context
   */
  serializeContext(context: LoggingContext): string {
    try {
      return JSON.stringify(context);
    } catch (error) {
      // Handle circular references or other serialization errors
      const safeContext = this.createContext({
        metadata: {
          serializationError: error instanceof Error ? error.message : 'Unknown serialization error',
          originalContextType: context ? typeof context : 'undefined',
        },
      });
      return JSON.stringify(safeContext);
    }
  }

  /**
   * Deserializes a context string back into a context object
   * @param contextString The serialized context string
   * @returns The deserialized context object, or a new context if deserialization fails
   */
  deserializeContext(contextString: string): LoggingContext {
    try {
      const context = JSON.parse(contextString) as LoggingContext;
      
      // Restore Date objects
      if (context.timestamp && typeof context.timestamp === 'string') {
        context.timestamp = new Date(context.timestamp);
      }
      
      return context;
    } catch (error) {
      // Return a new context with error information if deserialization fails
      return this.createContext({
        metadata: {
          deserializationError: error instanceof Error ? error.message : 'Unknown deserialization error',
          originalString: contextString.substring(0, 100) + (contextString.length > 100 ? '...' : ''),
        },
      });
    }
  }

  /**
   * Enriches a context with trace information from the tracing service
   * @param context The context to enrich
   * @returns The enriched context with trace information
   */
  enrichWithTraceInfo<T extends LoggingContext>(context: T): T {
    if (!this.tracingService) {
      return context;
    }

    try {
      const traceId = this.tracingService.getCurrentTraceId();
      const spanId = this.tracingService.getCurrentSpanId();
      const parentSpanId = this.tracingService.getParentSpanId();

      return {
        ...context,
        traceId: traceId || context.traceId,
        spanId: spanId || context.spanId,
        parentSpanId: parentSpanId || context.parentSpanId,
      };
    } catch (error) {
      // Return the original context if enrichment fails
      return {
        ...context,
        metadata: {
          ...context.metadata,
          traceEnrichmentError: error instanceof Error ? error.message : 'Unknown tracing error',
        },
      };
    }
  }

  /**
   * Generates a unique request ID
   * @returns A unique request ID string
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Extracts the client IP address from a request object
   * @param request The HTTP request object
   * @returns The client IP address
   */
  private extractClientIp(request: any): string {
    // Try various headers that might contain the client IP
    return (
      request.headers?.['x-forwarded-for']?.split(',')[0].trim() ||
      request.headers?.['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Sanitizes headers to remove sensitive information
   * @param headers The headers object to sanitize
   * @returns Sanitized headers object
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-auth-token',
      'x-csrf-token',
    ];

    const sanitized: Record<string, any> = {};

    Object.entries(headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  /**
   * Sanitizes an object to remove potential sensitive information
   * @param obj The object to sanitize
   * @returns Sanitized object
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
      'credit_card',
      'creditcard',
      'ssn',
      'social_security',
      'socialsecurity',
      'cpf',
      'cnpj',
    ];

    const sanitized: Record<string, any> = {};

    Object.entries(obj).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }
}
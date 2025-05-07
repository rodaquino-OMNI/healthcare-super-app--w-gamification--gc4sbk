import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { JourneyType } from '@austa/interfaces/common';
import {
  LoggingContext,
  JourneyContext,
  RequestContext,
  UserContext,
  ContextManager,
} from '@austa/logging/context';
import { formatErrorForResponse, ErrorResponse } from './error-handling.util';

/**
 * API Gateway-specific logging utility that builds upon the shared LoggerService.
 * Provides specialized logging functions with automatic context enrichment for the API Gateway.
 */
@Injectable()
export class ApiGatewayLogger {
  private readonly logger: LoggerService;
  private readonly contextManager: ContextManager;
  private static instance: ApiGatewayLogger;

  /**
   * Creates a new instance of ApiGatewayLogger.
   * @param loggerService The shared logger service
   * @param tracingService The tracing service for correlation IDs
   */
  constructor(
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.logger = loggerService;
    this.contextManager = new ContextManager(tracingService);
    ApiGatewayLogger.instance = this;
  }

  /**
   * Gets the singleton instance of ApiGatewayLogger.
   * This is useful for contexts where dependency injection is not available.
   * @returns The ApiGatewayLogger instance
   */
  public static getInstance(): ApiGatewayLogger {
    if (!ApiGatewayLogger.instance) {
      // Fallback to standard Logger if the instance is not available
      const fallbackLogger = new Logger('ApiGateway');
      console.warn('ApiGatewayLogger instance not available, using fallback logger');
      
      // Create a minimal implementation that delegates to the fallback logger
      return {
        logger: null as any,
        contextManager: null as any,
        loggerService: null as any,
        tracingService: null as any,
        log: (message: string, context?: string) => fallbackLogger.log(message, context),
        error: (message: string, trace?: string, context?: string) => fallbackLogger.error(message, trace, context),
        warn: (message: string, context?: string) => fallbackLogger.warn(message, context),
        debug: (message: string, context?: string) => fallbackLogger.debug(message, context),
        verbose: (message: string, context?: string) => fallbackLogger.verbose(message, context),
        logWithContext: () => fallbackLogger,
        createRequestContext: () => ({}),
        createJourneyContext: () => ({}),
        createUserContext: () => ({}),
        logRequest: () => {},
        logResponse: () => {},
        logError: () => {},
        getInstance: () => ApiGatewayLogger.instance,
      } as any;
    }
    return ApiGatewayLogger.instance;
  }

  /**
   * Logs a message with the specified log level and optional context.
   * @param message The message to log
   * @param context Optional context string
   */
  public log(message: string, context?: string): void {
    this.logger.log(message, context || 'ApiGateway');
  }

  /**
   * Logs an error message with optional stack trace and context.
   * @param message The error message
   * @param trace Optional stack trace
   * @param context Optional context string
   */
  public error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context || 'ApiGateway');
  }

  /**
   * Logs a warning message with optional context.
   * @param message The warning message
   * @param context Optional context string
   */
  public warn(message: string, context?: string): void {
    this.logger.warn(message, context || 'ApiGateway');
  }

  /**
   * Logs a debug message with optional context.
   * @param message The debug message
   * @param context Optional context string
   */
  public debug(message: string, context?: string): void {
    this.logger.debug(message, context || 'ApiGateway');
  }

  /**
   * Logs a verbose message with optional context.
   * @param message The verbose message
   * @param context Optional context string
   */
  public verbose(message: string, context?: string): void {
    this.logger.verbose(message, context || 'ApiGateway');
  }

  /**
   * Creates a logger with the provided context.
   * @param context The logging context to use
   * @returns The logger service with context
   */
  public logWithContext(context: LoggingContext): LoggerService {
    return this.logger.setContext(context);
  }

  /**
   * Creates a request context from an Express request.
   * @param req The Express request object
   * @returns The request context
   */
  public createRequestContext(req: Request): RequestContext {
    const correlationId = this.tracingService.getCorrelationId() || 
                          req.headers['x-correlation-id'] as string || 
                          req.headers['x-request-id'] as string;

    return this.contextManager.createRequestContext({
      requestId: correlationId,
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      // Sanitize headers to remove sensitive information
      headers: this.sanitizeHeaders(req.headers),
      // Sanitize query parameters to remove sensitive information
      query: this.sanitizeObject(req.query),
      correlationId,
    });
  }

  /**
   * Creates a journey context based on the journey type.
   * @param journeyType The journey type
   * @param additionalContext Additional context properties
   * @returns The journey context
   */
  public createJourneyContext(
    journeyType: JourneyType | string | null,
    additionalContext: Record<string, any> = {},
  ): JourneyContext {
    // Map string journey types to enum values
    let journey: JourneyType | undefined;
    
    if (journeyType) {
      if (typeof journeyType === 'string') {
        const journeyMap: Record<string, JourneyType> = {
          'health': JourneyType.HEALTH,
          'care': JourneyType.CARE,
          'plan': JourneyType.PLAN,
        };
        journey = journeyMap[journeyType.toLowerCase()];
      } else {
        journey = journeyType as JourneyType;
      }
    }

    return this.contextManager.createJourneyContext({
      journey,
      ...additionalContext,
    });
  }

  /**
   * Creates a user context from user information.
   * @param user The user object
   * @returns The user context
   */
  public createUserContext(user: any): UserContext {
    if (!user) {
      return this.contextManager.createUserContext({
        isAuthenticated: false,
      });
    }

    return this.contextManager.createUserContext({
      userId: user.id,
      email: user.email,
      roles: user.roles || [],
      isAuthenticated: true,
    });
  }

  /**
   * Logs an incoming request with enriched context.
   * @param req The Express request object
   * @param journeyType Optional journey type
   */
  public logRequest(req: Request, journeyType?: JourneyType | string): void {
    const requestContext = this.createRequestContext(req);
    const journeyContext = this.createJourneyContext(journeyType || this.extractJourneyFromUrl(req.originalUrl));
    const userContext = this.createUserContext(req.user);

    // Merge all contexts
    const context = this.contextManager.mergeContexts([
      requestContext,
      journeyContext,
      userContext,
    ]);

    // Create a logger with the merged context
    const contextualLogger = this.logWithContext(context);

    // Log the request
    contextualLogger.log(
      `Request: ${req.method} ${req.originalUrl}`,
      'ApiGateway:Request',
    );

    // Attach the context to the request for later use
    (req as any).__loggingContext = context;
  }

  /**
   * Logs an outgoing response with enriched context.
   * @param req The Express request object
   * @param res The Express response object
   * @param responseTime The response time in milliseconds
   */
  public logResponse(req: Request, res: Response, responseTime: number): void {
    // Retrieve the context from the request or create a new one
    const existingContext = (req as any).__loggingContext || {};
    
    // Create a logger with the context
    const contextualLogger = this.logWithContext(existingContext);

    // Log the response
    contextualLogger.log(
      `Response: ${res.statusCode} ${req.method} ${req.originalUrl} - ${responseTime}ms`,
      'ApiGateway:Response',
    );
  }

  /**
   * Logs an error with enriched context and proper formatting.
   * @param error The error to log
   * @param req The Express request object
   * @returns The formatted error response
   */
  public logError(error: any, req?: Request): ErrorResponse {
    // Create contexts if request is available
    let context: LoggingContext = {};
    
    if (req) {
      const requestContext = this.createRequestContext(req);
      const journeyContext = this.createJourneyContext(
        this.extractJourneyFromUrl(req.originalUrl),
      );
      const userContext = this.createUserContext(req.user);

      // Merge all contexts
      context = this.contextManager.mergeContexts([
        requestContext,
        journeyContext,
        userContext,
      ]);
    }

    // Create a logger with the context
    const contextualLogger = this.logWithContext(context);

    // Format the error for response
    const errorResponse = formatErrorForResponse(error, req);

    // Log the error with appropriate level based on status code
    const statusCode = errorResponse.statusCode;
    const errorMessage = `Error ${statusCode}: ${errorResponse.message}`;
    
    if (statusCode >= 500) {
      contextualLogger.error(
        errorMessage,
        error.stack,
        'ApiGateway:Error',
      );
    } else if (statusCode >= 400) {
      contextualLogger.warn(
        errorMessage,
        'ApiGateway:Error',
      );
    } else {
      contextualLogger.debug(
        errorMessage,
        'ApiGateway:Error',
      );
    }

    return errorResponse;
  }

  /**
   * Extracts the journey type from a URL.
   * @param url The URL to extract from
   * @returns The journey type or null if not found
   */
  private extractJourneyFromUrl(url: string): string | null {
    const journeyPatterns = {
      health: /\/health/i,
      care: /\/care/i,
      plan: /\/plan/i,
      game: /\/game/i,
    };

    for (const [journey, pattern] of Object.entries(journeyPatterns)) {
      if (pattern.test(url)) {
        return journey;
      }
    }

    return null;
  }

  /**
   * Sanitizes headers to remove sensitive information.
   * @param headers The headers to sanitize
   * @returns The sanitized headers
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    const sanitized = { ...headers };
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes an object to remove sensitive information.
   * @param obj The object to sanitize
   * @returns The sanitized object
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'authorization',
      'auth',
      'credentials',
    ];

    const sanitized = { ...obj };
    
    for (const key of Object.keys(sanitized)) {
      // Check if the key is sensitive
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Recursively sanitize nested objects
      if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  }
}

/**
 * Creates a singleton instance of ApiGatewayLogger.
 * This function should be called during application bootstrap.
 * @param loggerService The shared logger service
 * @param tracingService The tracing service
 * @returns The ApiGatewayLogger instance
 */
export function createApiGatewayLogger(
  loggerService: LoggerService,
  tracingService: TracingService,
): ApiGatewayLogger {
  return new ApiGatewayLogger(loggerService, tracingService);
}

/**
 * Gets the singleton instance of ApiGatewayLogger.
 * @returns The ApiGatewayLogger instance
 */
export function getApiGatewayLogger(): ApiGatewayLogger {
  return ApiGatewayLogger.getInstance();
}

/**
 * Utility function to measure execution time of an operation.
 * @param operation The operation to measure
 * @returns A promise that resolves to the result of the operation and the execution time
 */
export async function measureExecutionTime<T>(
  operation: () => Promise<T>,
): Promise<[T, number]> {
  const startTime = Date.now();
  const result = await operation();
  const executionTime = Date.now() - startTime;
  return [result, executionTime];
}

/**
 * Utility function to create a correlation ID if one doesn't exist.
 * @param req The Express request object
 * @returns The correlation ID
 */
export function ensureCorrelationId(req: Request): string {
  // Check existing headers for correlation ID
  const existingId = req.headers['x-correlation-id'] || 
                     req.headers['x-request-id'] || 
                     req.headers['x-trace-id'];
  
  if (existingId) {
    return existingId as string;
  }
  
  // Generate a new correlation ID
  const correlationId = generateCorrelationId();
  
  // Set it on the request headers
  req.headers['x-correlation-id'] = correlationId;
  
  return correlationId;
}

/**
 * Generates a new correlation ID.
 * @returns A new correlation ID
 */
export function generateCorrelationId(): string {
  return `api-gateway-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Utility function to create a structured log object.
 * @param message The log message
 * @param data Additional data to include
 * @param context The logging context
 * @returns A structured log object
 */
export function createStructuredLog(
  message: string,
  data?: Record<string, any>,
  context?: LoggingContext,
): Record<string, any> {
  return {
    message,
    timestamp: new Date().toISOString(),
    ...context,
    ...(data && { data: sanitizeLogData(data) }),
  };
}

/**
 * Sanitizes log data to remove sensitive information.
 * @param data The data to sanitize
 * @returns The sanitized data
 */
export function sanitizeLogData(data: Record<string, any>): Record<string, any> {
  const apiGatewayLogger = getApiGatewayLogger();
  
  // Use the sanitizeObject method from the logger instance if available
  if (apiGatewayLogger && typeof (apiGatewayLogger as any).sanitizeObject === 'function') {
    return (apiGatewayLogger as any).sanitizeObject(data);
  }
  
  // Fallback implementation
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'credentials',
  ];

  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    // Check if the key is sensitive
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively sanitize nested objects
    if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
}
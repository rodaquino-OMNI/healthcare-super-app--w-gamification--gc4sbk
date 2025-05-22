import { Injectable, Inject, Optional, LoggerService as NestLoggerService } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseMiddleware, MiddlewareContext } from './middleware.interface';
import { JourneyType } from '../types/journey.types';

/**
 * Configuration options for the LoggingMiddleware
 */
export interface LoggingMiddlewareOptions {
  /**
   * Whether to enable logging for all queries
   * @default true
   */
  enabled?: boolean;

  /**
   * Log level to use for query logs
   * @default 'debug'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Whether to log query parameters
   * @default true
   */
  logParameters?: boolean;

  /**
   * Whether to log query results
   * @default false
   */
  logResults?: boolean;

  /**
   * Maximum result size to log (in characters)
   * @default 1000
   */
  maxResultSize?: number;

  /**
   * Fields to redact from logs for privacy
   * @default ['password', 'token', 'secret', 'key', 'credential']
   */
  sensitiveFields?: string[];

  /**
   * Whether to include execution time in logs
   * @default true
   */
  logExecutionTime?: boolean;

  /**
   * Threshold in milliseconds for slow query warnings
   * @default 1000
   */
  slowQueryThreshold?: number;

  /**
   * Journey-specific logging configurations
   */
  journeyConfigs?: Record<JourneyType, Partial<LoggingMiddlewareOptions>>;

  /**
   * Whether to integrate with distributed tracing
   * @default true
   */
  enableTracing?: boolean;
}

/**
 * Default configuration for the LoggingMiddleware
 */
const DEFAULT_OPTIONS: LoggingMiddlewareOptions = {
  enabled: true,
  logLevel: 'debug',
  logParameters: true,
  logResults: false,
  maxResultSize: 1000,
  sensitiveFields: ['password', 'token', 'secret', 'key', 'credential', 'accessToken', 'refreshToken'],
  logExecutionTime: true,
  slowQueryThreshold: 1000,
  enableTracing: true,
};

/**
 * Middleware that logs database operations with configurable detail levels.
 * Integrates with the application's structured logging system to provide
 * consistent query logging across all journey services.
 */
@Injectable()
export class LoggingMiddleware implements DatabaseMiddleware {
  private readonly options: LoggingMiddlewareOptions;
  private readonly logger: NestLoggerService;
  private readonly tracingService?: any; // Using any to avoid direct dependency

  /**
   * Creates a new instance of LoggingMiddleware
   * 
   * @param logger Logger service for outputting logs
   * @param options Configuration options for the middleware
   * @param tracingService Optional tracing service for span creation
   */
  constructor(
    @Inject('LOGGER_SERVICE') private readonly loggerService: NestLoggerService,
    @Optional() @Inject('LOGGING_MIDDLEWARE_OPTIONS') options?: LoggingMiddlewareOptions,
    @Optional() @Inject('TRACING_SERVICE') tracingService?: any,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.logger = loggerService;
    this.tracingService = tracingService;
  }

  /**
   * Executes before the database operation to log the query
   * 
   * @param params Parameters for the middleware
   * @returns Unmodified parameters
   */
  async beforeExecute(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
    context: MiddlewareContext;
  }): Promise<any> {
    const { args, context } = params;
    const { model, operation, journeyType } = context;

    // Store start time for execution time calculation
    context.startTime = Date.now();

    // Skip logging if disabled globally or for this journey
    if (!this.isLoggingEnabled(journeyType)) {
      return params;
    }

    // Create a span for tracing if enabled
    if (this.options.enableTracing && this.tracingService) {
      context.span = this.createTraceSpan(model, operation, args, context);
    }

    // Log the query
    this.logQuery(model, operation, args, context);

    return params;
  }

  /**
   * Executes after the database operation to log the result
   * 
   * @param params Parameters for the middleware including the operation result
   * @returns Unmodified result
   */
  async afterExecute(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
    context: MiddlewareContext;
    result: any;
  }): Promise<any> {
    const { context, result } = params;
    const { model, operation, journeyType, startTime, span } = context;

    // Skip logging if disabled globally or for this journey
    if (!this.isLoggingEnabled(journeyType)) {
      // Still end the span if it exists
      if (span && this.tracingService) {
        this.tracingService.endSpan(span);
      }
      return params;
    }

    // Calculate execution time
    const executionTime = startTime ? Date.now() - startTime : undefined;

    // Log slow queries as warnings
    const options = this.getJourneyOptions(journeyType);
    const isSlowQuery = executionTime && options.logExecutionTime && 
      executionTime > options.slowQueryThreshold!;

    // Log the result
    this.logResult(model, operation, result, executionTime, isSlowQuery, context);

    // End the span if tracing is enabled
    if (span && this.tracingService) {
      if (executionTime) {
        this.tracingService.setSpanAttribute(span, 'db.execution_time_ms', executionTime);
      }
      
      if (result) {
        const resultMetadata = this.getResultMetadata(result);
        Object.entries(resultMetadata).forEach(([key, value]) => {
          this.tracingService.setSpanAttribute(span, `db.result.${key}`, value);
        });
      }
      
      this.tracingService.endSpan(span);
    }

    return params;
  }

  /**
   * Checks if logging is enabled for the given journey type
   * 
   * @param journeyType Type of journey
   * @returns Whether logging is enabled
   */
  private isLoggingEnabled(journeyType?: JourneyType): boolean {
    const options = this.getJourneyOptions(journeyType);
    return options.enabled !== false;
  }

  /**
   * Gets the options for the specified journey type, falling back to default options
   * 
   * @param journeyType Type of journey
   * @returns Options for the journey
   */
  private getJourneyOptions(journeyType?: JourneyType): LoggingMiddlewareOptions {
    if (!journeyType || !this.options.journeyConfigs?.[journeyType]) {
      return this.options;
    }

    return {
      ...this.options,
      ...this.options.journeyConfigs[journeyType],
    };
  }

  /**
   * Logs a database query
   * 
   * @param model Model being queried
   * @param operation Operation being performed
   * @param args Query arguments
   * @param context Operation context
   */
  private logQuery(model: string, operation: Prisma.PrismaAction, args: any, context: MiddlewareContext): void {
    const options = this.getJourneyOptions(context.journeyType);
    const logLevel = options.logLevel || 'debug';
    
    const message = `Database ${operation} on ${model}`;
    const logContext = this.buildLogContext(model, operation, args, context, options);

    switch (logLevel) {
      case 'info':
        this.logger.log(message, logContext);
        break;
      case 'warn':
        this.logger.warn(message, logContext);
        break;
      case 'error':
        this.logger.error(message, logContext);
        break;
      case 'debug':
      default:
        if (typeof this.logger.debug === 'function') {
          this.logger.debug(message, logContext);
        } else {
          this.logger.log(`[DEBUG] ${message}`, logContext);
        }
        break;
    }
  }

  /**
   * Logs the result of a database operation
   * 
   * @param model Model that was queried
   * @param operation Operation that was performed
   * @param result Operation result
   * @param executionTime Time taken to execute the query in milliseconds
   * @param isSlowQuery Whether the query exceeded the slow query threshold
   * @param context Operation context
   */
  private logResult(
    model: string,
    operation: Prisma.PrismaAction,
    result: any,
    executionTime?: number,
    isSlowQuery?: boolean,
    context?: MiddlewareContext,
  ): void {
    const options = this.getJourneyOptions(context?.journeyType);
    
    // Build the log message
    let message = `Database ${operation} on ${model} completed`;
    if (executionTime && options.logExecutionTime) {
      message += ` in ${executionTime}ms`;
    }

    // Build the log context
    const logContext: Record<string, any> = {
      model,
      operation,
      ...this.buildContextMetadata(context),
    };

    // Add execution time to context
    if (executionTime && options.logExecutionTime) {
      logContext.executionTime = executionTime;
    }

    // Add result metadata
    if (result) {
      logContext.resultMetadata = this.getResultMetadata(result);

      // Add the actual result if configured
      if (options.logResults) {
        logContext.result = this.truncateAndSanitizeResult(result, options.maxResultSize || 1000);
      }
    }

    // Log at appropriate level
    if (isSlowQuery) {
      this.logger.warn(`SLOW QUERY: ${message}`, logContext);
    } else {
      const logLevel = options.logLevel || 'debug';
      
      switch (logLevel) {
        case 'info':
          this.logger.log(message, logContext);
          break;
        case 'warn':
          this.logger.warn(message, logContext);
          break;
        case 'error':
          this.logger.error(message, logContext);
          break;
        case 'debug':
        default:
          if (typeof this.logger.debug === 'function') {
            this.logger.debug(message, logContext);
          } else {
            this.logger.log(`[DEBUG] ${message}`, logContext);
          }
          break;
      }
    }
  }

  /**
   * Builds a log context object with metadata about the operation
   * 
   * @param model Model being queried
   * @param operation Operation being performed
   * @param args Query arguments
   * @param context Operation context
   * @param options Logging options
   * @returns Log context object
   */
  private buildLogContext(
    model: string,
    operation: Prisma.PrismaAction,
    args: any,
    context: MiddlewareContext,
    options: LoggingMiddlewareOptions,
  ): Record<string, any> {
    const logContext: Record<string, any> = {
      model,
      operation,
      ...this.buildContextMetadata(context),
    };

    // Add query parameters if configured
    if (options.logParameters && args) {
      logContext.parameters = this.sanitizeParameters(args, options.sensitiveFields || []);
    }

    return logContext;
  }

  /**
   * Extracts metadata from the operation context
   * 
   * @param context Operation context
   * @returns Context metadata
   */
  private buildContextMetadata(context?: MiddlewareContext): Record<string, any> {
    if (!context) {
      return {};
    }

    const metadata: Record<string, any> = {};

    // Add operation ID if available
    if (context.operationId) {
      metadata.operationId = context.operationId;
    }

    // Add journey type if available
    if (context.journeyType) {
      metadata.journeyType = context.journeyType;
    }

    // Add user ID if available
    if (context.userId) {
      metadata.userId = context.userId;
    }

    // Add tenant ID if available
    if (context.tenantId) {
      metadata.tenantId = context.tenantId;
    }

    return metadata;
  }

  /**
   * Sanitizes query parameters by redacting sensitive fields
   * 
   * @param parameters Query parameters
   * @param sensitiveFields Fields to redact
   * @returns Sanitized parameters
   */
  private sanitizeParameters(parameters: any, sensitiveFields: string[]): any {
    if (!parameters || typeof parameters !== 'object') {
      return parameters;
    }

    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(parameters));

    // Helper function to recursively redact sensitive fields
    const redactSensitiveFields = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => redactSensitiveFields(item));
      }

      // Handle objects
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Check if this is a sensitive field
        const isSensitive = sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase()));

        if (isSensitive && value !== undefined && value !== null) {
          // Redact the value
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          // Recursively process nested objects
          result[key] = redactSensitiveFields(value);
        } else {
          // Keep non-sensitive values as is
          result[key] = value;
        }
      }

      return result;
    };

    return redactSensitiveFields(sanitized);
  }

  /**
   * Extracts metadata about the query result
   * 
   * @param result Query result
   * @returns Result metadata
   */
  private getResultMetadata(result: any): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (!result) {
      return metadata;
    }

    // Handle array results
    if (Array.isArray(result)) {
      metadata.count = result.length;
      return metadata;
    }

    // Handle object results
    if (typeof result === 'object') {
      // Check for count property
      if ('count' in result) {
        metadata.count = result.count;
      }

      // Check for pagination properties
      if ('page' in result) {
        metadata.page = result.page;
      }

      if ('pageSize' in result) {
        metadata.pageSize = result.pageSize;
      }

      if ('totalPages' in result) {
        metadata.totalPages = result.totalPages;
      }

      if ('totalCount' in result) {
        metadata.totalCount = result.totalCount;
      }

      // Check for affected rows
      if ('affectedRows' in result) {
        metadata.affectedRows = result.affectedRows;
      }
    }

    return metadata;
  }

  /**
   * Truncates and sanitizes a result for logging
   * 
   * @param result Query result
   * @param maxSize Maximum size in characters
   * @returns Truncated and sanitized result
   */
  private truncateAndSanitizeResult(result: any, maxSize: number): any {
    if (!result) {
      return result;
    }

    // Convert to string for size check
    const resultStr = JSON.stringify(result);
    
    // Check if truncation is needed
    if (resultStr.length <= maxSize) {
      return result;
    }

    // Truncate the result
    if (Array.isArray(result)) {
      // For arrays, include a subset of items
      const itemsToInclude = Math.max(1, Math.floor(maxSize / 100));
      return {
        truncated: true,
        totalItems: result.length,
        items: result.slice(0, itemsToInclude),
        message: `Result truncated to ${itemsToInclude} of ${result.length} items`,
      };
    } else if (typeof result === 'object') {
      // For objects, include a subset of properties
      return {
        truncated: true,
        message: `Result truncated due to size (${resultStr.length} > ${maxSize} characters)`,
        preview: JSON.parse(resultStr.substring(0, maxSize) + '...}'),
      };
    } else {
      // For primitives, truncate the string
      return resultStr.substring(0, maxSize) + '...';
    }
  }

  /**
   * Creates a trace span for the database operation
   * 
   * @param model Model being queried
   * @param operation Operation being performed
   * @param args Query arguments
   * @param context Operation context
   * @returns Created span
   */
  private createTraceSpan(model: string, operation: Prisma.PrismaAction, args: any, context: MiddlewareContext): any {
    if (!this.tracingService) {
      return null;
    }

    // Create a span name based on the operation and model
    const spanName = `db.${operation}.${model}`;
    
    // Create the span
    const span = this.tracingService.startSpan(spanName);
    
    // Add attributes to the span
    this.tracingService.setSpanAttribute(span, 'db.system', 'postgresql');
    this.tracingService.setSpanAttribute(span, 'db.operation', operation);
    this.tracingService.setSpanAttribute(span, 'db.model', model);
    
    // Add journey-specific attributes
    if (context.journeyType) {
      this.tracingService.setSpanAttribute(span, 'journey.type', context.journeyType);
    }
    
    // Add user context if available
    if (context.userId) {
      this.tracingService.setSpanAttribute(span, 'user.id', context.userId);
    }
    
    // Add tenant context if available
    if (context.tenantId) {
      this.tracingService.setSpanAttribute(span, 'tenant.id', context.tenantId);
    }
    
    // Add operation ID if available
    if (context.operationId) {
      this.tracingService.setSpanAttribute(span, 'db.operation_id', context.operationId);
    }
    
    return span;
  }
}
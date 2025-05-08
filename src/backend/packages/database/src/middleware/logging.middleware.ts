import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { MiddlewareContext, LoggingMiddleware } from './middleware.interface';
import { DatabaseException } from '../errors/database-error.exception';

/**
 * Configuration options for LoggingMiddleware
 */
export interface LoggingMiddlewareOptions {
  /**
   * Log level for database operations
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
   * @default false in production, true otherwise
   */
  logResults?: boolean;

  /**
   * Maximum size of logged parameters and results (in characters)
   * @default 1000
   */
  maxLogSize?: number;

  /**
   * Fields to redact from logs for privacy
   * @default ['password', 'token', 'secret', 'key', 'credential', 'ssn', 'creditCard']
   */
  sensitiveFields?: string[];

  /**
   * Whether to include stack traces in error logs
   * @default true in development, false in production
   */
  includeStackTrace?: boolean;

  /**
   * Journey-specific log levels
   * @example { health: 'debug', care: 'info', plan: 'warn' }
   */
  journeyLogLevels?: Record<string, 'debug' | 'info' | 'warn' | 'error'>;

  /**
   * Whether to integrate with distributed tracing
   * @default true
   */
  enableTracing?: boolean;

  /**
   * Whether to log slow queries with a warning level
   * @default true
   */
  highlightSlowQueries?: boolean;

  /**
   * Threshold in milliseconds for slow queries
   * @default 1000 (1 second)
   */
  slowQueryThreshold?: number;
}

/**
 * Implements query logging middleware that captures and logs database operations
 * with configurable detail levels. It integrates with the application's structured
 * logging system to provide consistent query logging across all journey services.
 *
 * This middleware captures query parameters, execution time, and result metadata
 * while respecting data privacy by automatically redacting sensitive information.
 *
 * Features:
 * - Configurable log levels with journey-specific overrides
 * - Sensitive data redaction for privacy compliance
 * - Integration with distributed tracing for improved observability
 * - Performance tracking with slow query highlighting
 * - Structured logging with consistent format across services
 *
 * @example
 * // Register the middleware in a NestJS module
 * @Module({
 *   providers: [
 *     {
 *       provide: 'DATABASE_MIDDLEWARE',
 *       useFactory: (loggerService: LoggerService, tracingService: TracingService) => {
 *         const loggingMiddleware = new LoggingMiddleware(loggerService, tracingService, {
 *           logLevel: 'debug',
 *           journeyLogLevels: { health: 'info' },
 *           sensitiveFields: ['password', 'ssn', 'creditCard'],
 *         });
 *         return [loggingMiddleware];
 *       },
 *       inject: [LoggerService, TracingService],
 *     },
 *   ],
 * })
 * export class DatabaseModule {}
 */
@Injectable()
export class LoggingMiddleware implements LoggingMiddleware {
  private logLevel: 'debug' | 'info' | 'warn' | 'error';
  private logParameters: boolean;
  private logResults: boolean;
  private maxLogSize: number;
  private sensitiveFields: string[];
  private includeStackTrace: boolean;
  private journeyLogLevels: Record<string, 'debug' | 'info' | 'warn' | 'error'>;
  private enableTracing: boolean;
  private highlightSlowQueries: boolean;
  private slowQueryThreshold: number;

  /**
   * Default sensitive fields to redact from logs
   */
  private static readonly DEFAULT_SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'key',
    'credential',
    'ssn',
    'creditCard',
    'accessToken',
    'refreshToken',
    'authToken',
    'apiKey',
    'pin',
    'securityCode',
    'cvv',
    'socialSecurityNumber',
    'taxId',
    'dob',
    'dateOfBirth',
    'birthDate',
  ];

  /**
   * Creates a new instance of LoggingMiddleware
   * 
   * @param loggerService The logger service for structured logging
   * @param tracingService The tracing service for distributed tracing
   * @param options Configuration options
   */
  constructor(
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
    options: LoggingMiddlewareOptions = {},
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    this.logLevel = options.logLevel ?? 'debug';
    this.logParameters = options.logParameters ?? true;
    this.logResults = options.logResults ?? !isProduction;
    this.maxLogSize = options.maxLogSize ?? 1000;
    this.sensitiveFields = options.sensitiveFields ?? LoggingMiddleware.DEFAULT_SENSITIVE_FIELDS;
    this.includeStackTrace = options.includeStackTrace ?? !isProduction;
    this.journeyLogLevels = options.journeyLogLevels ?? {};
    this.enableTracing = options.enableTracing ?? true;
    this.highlightSlowQueries = options.highlightSlowQueries ?? true;
    this.slowQueryThreshold = options.slowQueryThreshold ?? 1000;

    this.loggerService.log(
      'Database logging middleware initialized',
      {
        logLevel: this.logLevel,
        journeyLogLevels: this.journeyLogLevels,
        sensitiveFieldsCount: this.sensitiveFields.length,
        enableTracing: this.enableTracing,
      },
      'LoggingMiddleware'
    );
  }

  /**
   * Hook executed before a database operation
   * Logs the operation parameters and starts timing
   * 
   * @param params Operation parameters
   * @param context Operation context
   * @returns Original parameters unchanged
   */
  beforeExecute<T>(params: T, context: MiddlewareContext): T {
    // Add start time to context for tracking execution time
    context.metadata = context.metadata || {};
    context.metadata.loggingTracking = {
      startTime: Date.now(),
    };

    // Get appropriate log level for this operation
    const logLevel = this.getLogLevelForContext(context);

    // Create span for tracing if enabled
    if (this.enableTracing) {
      const span = this.tracingService.startSpan('database.query', {
        attributes: {
          'db.operation': context.operationType,
          'db.entity': context.entityName || 'unknown',
          'journey.context': context.journeyContext || 'unknown',
        },
      });

      // Store span in context for later use
      context.metadata.loggingTracking.span = span;
    }

    // Log operation start if appropriate level
    if (this.shouldLog(logLevel)) {
      const logData: Record<string, any> = {
        operation: context.operationType,
        entity: context.entityName,
        journeyContext: context.journeyContext,
      };

      // Add request ID and user ID if available
      if (context.requestId) {
        logData.requestId = context.requestId;
      }

      if (context.userId) {
        logData.userId = context.userId;
      }

      // Add parameters if enabled
      if (this.logParameters && params) {
        logData.params = this.redactSensitiveData(
          this.truncateForLogging(params)
        );
      }

      // Add trace ID if available
      if (this.enableTracing && context.metadata.loggingTracking.span) {
        logData.traceId = context.metadata.loggingTracking.span.context().traceId;
      }

      this.loggerService[logLevel](
        `Database operation started: ${context.operationType} on ${context.entityName || 'unknown'}`,
        logData,
        'LoggingMiddleware'
      );
    }

    return params;
  }

  /**
   * Hook executed after a database operation
   * Logs the operation result and execution time
   * 
   * @param result Operation result
   * @param context Operation context
   * @returns Original result unchanged
   */
  afterExecute<T>(result: T, context: MiddlewareContext): T {
    if (!context.metadata?.loggingTracking?.startTime) {
      return result;
    }

    const startTime = context.metadata.loggingTracking.startTime;
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Determine if this is a slow query
    const isSlowQuery = this.highlightSlowQueries && executionTime > this.slowQueryThreshold;
    
    // Get appropriate log level for this operation
    let logLevel = this.getLogLevelForContext(context);
    
    // Override log level for slow queries
    if (isSlowQuery && logLevel === 'debug') {
      logLevel = 'warn';
    }

    // End tracing span if it exists
    if (this.enableTracing && context.metadata.loggingTracking.span) {
      const span = context.metadata.loggingTracking.span;
      span.setAttribute('db.execution_time_ms', executionTime);
      
      if (isSlowQuery) {
        span.setAttribute('db.slow_query', true);
      }
      
      // Add result count if available
      if (Array.isArray(result)) {
        span.setAttribute('db.result_count', result.length);
      }
      
      span.end();
    }

    // Log operation completion if appropriate level
    if (this.shouldLog(logLevel)) {
      const logData: Record<string, any> = {
        operation: context.operationType,
        entity: context.entityName,
        journeyContext: context.journeyContext,
        executionTime,
        isSlowQuery,
      };

      // Add request ID and user ID if available
      if (context.requestId) {
        logData.requestId = context.requestId;
      }

      if (context.userId) {
        logData.userId = context.userId;
      }

      // Add result info if enabled
      if (this.logResults && result !== undefined) {
        if (Array.isArray(result)) {
          logData.resultCount = result.length;
          
          // Log a sample of the results if array is not empty
          if (result.length > 0 && !this.isProduction()) {
            logData.resultSample = this.redactSensitiveData(
              this.truncateForLogging(result[0])
            );
          }
        } else {
          logData.result = this.redactSensitiveData(
            this.truncateForLogging(result)
          );
        }
      }

      // Add trace ID if available
      if (this.enableTracing && context.metadata.loggingTracking.span) {
        logData.traceId = context.metadata.loggingTracking.span.context().traceId;
      }

      const logMessage = isSlowQuery
        ? `Slow database operation completed (${executionTime}ms): ${context.operationType} on ${context.entityName || 'unknown'}`
        : `Database operation completed (${executionTime}ms): ${context.operationType} on ${context.entityName || 'unknown'}`;

      this.loggerService[logLevel](logMessage, logData, 'LoggingMiddleware');
    }

    return result;
  }

  /**
   * Hook executed when a database operation fails
   * Logs the error with detailed context
   * 
   * @param error Error that occurred
   * @param context Operation context
   * @returns Original error or enhanced error with logging context
   */
  onError(error: Error, context: MiddlewareContext): Error {
    const startTime = context.metadata?.loggingTracking?.startTime;
    const executionTime = startTime ? Date.now() - startTime : undefined;

    // End tracing span with error if it exists
    if (this.enableTracing && context.metadata?.loggingTracking?.span) {
      const span = context.metadata.loggingTracking.span;
      
      if (executionTime) {
        span.setAttribute('db.execution_time_ms', executionTime);
      }
      
      span.setStatus({
        code: 2, // ERROR
        message: error.message,
      });
      
      span.end();
    }

    // Log the error
    const logData: Record<string, any> = {
      operation: context.operationType,
      entity: context.entityName,
      journeyContext: context.journeyContext,
      errorMessage: error.message,
      errorName: error.name,
    };

    // Add execution time if available
    if (executionTime) {
      logData.executionTime = executionTime;
    }

    // Add request ID and user ID if available
    if (context.requestId) {
      logData.requestId = context.requestId;
    }

    if (context.userId) {
      logData.userId = context.userId;
    }

    // Add stack trace if enabled
    if (this.includeStackTrace) {
      logData.stack = error.stack;
    }

    // Add parameters if enabled
    if (this.logParameters && context.params) {
      logData.params = this.redactSensitiveData(
        this.truncateForLogging(context.params)
      );
    }

    // Add trace ID if available
    if (this.enableTracing && context.metadata?.loggingTracking?.span) {
      logData.traceId = context.metadata.loggingTracking.span.context().traceId;
    }

    this.loggerService.error(
      `Database operation failed: ${context.operationType} on ${context.entityName || 'unknown'}`,
      logData,
      'LoggingMiddleware',
      error
    );

    // If error is a DatabaseException, add logging context to it
    if (error instanceof DatabaseException) {
      error.metadata = error.metadata || {};
      
      if (executionTime) {
        error.metadata.executionTime = executionTime;
      }
      
      if (this.enableTracing && context.metadata?.loggingTracking?.span) {
        error.metadata.traceId = context.metadata.loggingTracking.span.context().traceId;
      }
    }

    return error;
  }

  /**
   * Configure logging level
   * @param level New log level
   */
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
    this.loggerService.log(
      `Database logging level updated to ${level}`,
      {},
      'LoggingMiddleware'
    );
  }

  /**
   * Configure sensitive fields to be redacted
   * @param fields Array of field names to redact
   */
  setSensitiveFields(fields: string[]): void {
    this.sensitiveFields = fields;
    this.loggerService.log(
      `Database logging sensitive fields updated (${fields.length} fields)`,
      {},
      'LoggingMiddleware'
    );
  }

  /**
   * Configure journey-specific log levels
   * @param journeyLogLevels Record of journey contexts and their log levels
   */
  setJourneyLogLevels(journeyLogLevels: Record<string, 'debug' | 'info' | 'warn' | 'error'>): void {
    this.journeyLogLevels = journeyLogLevels;
    this.loggerService.log(
      'Database logging journey-specific levels updated',
      { journeyLogLevels },
      'LoggingMiddleware'
    );
  }

  /**
   * Configure slow query threshold
   * @param thresholdMs Threshold in milliseconds
   */
  setSlowQueryThreshold(thresholdMs: number): void {
    this.slowQueryThreshold = thresholdMs;
    this.loggerService.log(
      `Database logging slow query threshold updated to ${thresholdMs}ms`,
      {},
      'LoggingMiddleware'
    );
  }

  /**
   * Enable or disable result logging
   * @param enabled Whether to log query results
   */
  setLogResults(enabled: boolean): void {
    this.logResults = enabled;
    this.loggerService.log(
      `Database result logging ${enabled ? 'enabled' : 'disabled'}`,
      {},
      'LoggingMiddleware'
    );
  }

  /**
   * Gets the appropriate log level for a given context
   * @param context Operation context
   * @returns Log level to use
   */
  private getLogLevelForContext(context: MiddlewareContext): 'debug' | 'info' | 'warn' | 'error' {
    // Check for journey-specific log level
    if (context.journeyContext && this.journeyLogLevels[context.journeyContext]) {
      return this.journeyLogLevels[context.journeyContext];
    }
    
    // Fall back to default log level
    return this.logLevel;
  }

  /**
   * Determines if a message should be logged at the given level
   * @param level Log level to check
   * @returns True if the message should be logged
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configuredLevel = levels[this.logLevel];
    const messageLevel = levels[level];
    
    return messageLevel >= configuredLevel;
  }

  /**
   * Truncates data for logging to prevent excessive log sizes
   * @param data Data to truncate
   * @returns Truncated data
   */
  private truncateForLogging(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    // Convert to string and check length
    const stringified = JSON.stringify(data);
    if (stringified.length <= this.maxLogSize) {
      return data;
    }

    // Truncate based on data type
    if (Array.isArray(data)) {
      const truncated = data.slice(0, 3);
      return [...truncated, `... (${data.length - 3} more items)`];
    }

    // For objects, include only the first few keys
    const truncated: Record<string, any> = {};
    const keys = Object.keys(data);
    const keysToInclude = keys.slice(0, 5);
    
    keysToInclude.forEach(key => {
      truncated[key] = data[key];
    });
    
    if (keys.length > 5) {
      truncated['...'] = `(${keys.length - 5} more fields)`;
    }
    
    return truncated;
  }

  /**
   * Redacts sensitive data from logs
   * @param data Data to redact
   * @returns Redacted data
   */
  private redactSensitiveData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    // Handle objects
    const redacted = { ...data };
    
    for (const key of Object.keys(redacted)) {
      // Check if this key should be redacted
      const shouldRedact = this.sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      if (shouldRedact) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        // Recursively redact nested objects
        redacted[key] = this.redactSensitiveData(redacted[key]);
      }
    }
    
    return redacted;
  }

  /**
   * Checks if the current environment is production
   * @returns True if in production environment
   */
  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}
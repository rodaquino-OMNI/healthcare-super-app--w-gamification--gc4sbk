import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { TracingService } from '@austa/tracing';
import { LogLevel } from './interfaces/log-level.enum';
import { Transport } from './interfaces/transport.interface';
import { TransportFactory } from './transports/transport-factory';
import { LoggerConfig } from './interfaces/log-config.interface';
import { ContextManager } from './context/context-manager';
import { LoggingContext } from './context/context.interface';
import { JourneyContext } from './context/journey-context.interface';
import { UserContext } from './context/user-context.interface';
import { RequestContext } from './context/request-context.interface';

/**
 * Enhanced logger service for the AUSTA SuperApp.
 * Provides a centralized and consistent way to handle structured logging across all backend services.
 * Features context-enrichment, distributed tracing correlation, and configurable transports.
 */
@Injectable({ scope: Scope.DEFAULT })
export class LoggerService implements NestLoggerService {
  private readonly transports: Transport[] = [];
  private readonly contextManager: ContextManager;
  private readonly defaultContext: LoggingContext;
  private readonly logLevel: LogLevel;

  /**
   * Initializes the LoggerService with the provided configuration and dependencies.
   * 
   * @param config - Configuration options for the logger
   * @param tracingService - Service for distributed tracing integration
   */
  constructor(
    private readonly config: LoggerConfig,
    private readonly tracingService?: TracingService,
  ) {
    this.logLevel = config.logLevel || LogLevel.INFO;
    this.contextManager = new ContextManager(tracingService);
    this.defaultContext = this.createDefaultContext();
    this.initializeTransports();
  }

  /**
   * Creates the default context for all log entries.
   * This includes service name, environment, and application version.
   */
  private createDefaultContext(): LoggingContext {
    return {
      serviceName: this.config.serviceName || 'unknown-service',
      environment: this.config.environment || 'development',
      appVersion: this.config.appVersion || '0.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Initializes the configured log transports.
   * Uses the TransportFactory to create transport instances based on configuration.
   */
  private initializeTransports(): void {
    if (!this.config.transports || this.config.transports.length === 0) {
      // Default to console transport if none specified
      this.transports.push(TransportFactory.createConsoleTransport());
      return;
    }

    for (const transportConfig of this.config.transports) {
      try {
        const transport = TransportFactory.createTransport(transportConfig);
        this.transports.push(transport);
      } catch (error) {
        // Log transport initialization error to console as fallback
        console.error(`Failed to initialize transport: ${error.message}`);
      }
    }

    // Ensure at least one transport is available
    if (this.transports.length === 0) {
      this.transports.push(TransportFactory.createConsoleTransport());
    }
  }

  /**
   * Writes a log entry to all configured transports.
   * 
   * @param level - The log level
   * @param message - The log message
   * @param context - Optional context object or string
   * @param error - Optional error object
   * @param additionalContext - Optional additional context to merge
   */
  private writeLog(
    level: LogLevel,
    message: string,
    context?: string | object,
    error?: Error,
    additionalContext?: LoggingContext,
  ): void {
    // Skip if log level is below configured level
    if (level < this.logLevel) {
      return;
    }

    // Process context
    let contextStr = typeof context === 'string' ? context : undefined;
    let contextObj = typeof context === 'object' ? context : {};

    // Create log entry context by merging contexts
    const logContext = this.contextManager.mergeContexts(
      this.defaultContext,
      additionalContext || {},
      { context: contextObj },
    );

    // Add trace correlation if available
    if (this.tracingService) {
      const traceContext = this.tracingService.getCurrentTraceContext();
      Object.assign(logContext, { traceId: traceContext.traceId, spanId: traceContext.spanId });
    }

    // Create the log entry
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: contextStr,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      ...logContext,
    };

    // Write to all transports
    for (const transport of this.transports) {
      try {
        transport.write(logEntry);
      } catch (transportError) {
        // Fallback to console if transport fails
        console.error(`Transport error: ${transportError.message}`);
        console.error('Original log entry:', logEntry);
      }
    }
  }

  /**
   * Creates a new logger instance with the provided context.
   * Useful for creating loggers for specific components or requests.
   * 
   * @param context - The context to attach to all logs from this logger
   */
  createContextLogger(context: LoggingContext): LoggerService {
    const childConfig = { ...this.config };
    const childLogger = new LoggerService(childConfig, this.tracingService);
    childLogger['defaultContext'] = this.contextManager.mergeContexts(
      this.defaultContext,
      context
    );
    return childLogger;
  }

  /**
   * Creates a new logger instance with journey-specific context.
   * 
   * @param journeyContext - The journey context to attach to all logs
   */
  createJourneyLogger(journeyContext: JourneyContext): LoggerService {
    return this.createContextLogger(journeyContext);
  }

  /**
   * Creates a new logger instance with user-specific context.
   * 
   * @param userContext - The user context to attach to all logs
   */
  createUserLogger(userContext: UserContext): LoggerService {
    return this.createContextLogger(userContext);
  }

  /**
   * Creates a new logger instance with request-specific context.
   * 
   * @param requestContext - The request context to attach to all logs
   */
  createRequestLogger(requestContext: RequestContext): LoggerService {
    return this.createContextLogger(requestContext);
  }

  /**
   * Logs a message with the INFO level.
   * 
   * @param message - The message to log
   * @param context - Optional context for the log
   */
  log(message: any, context?: string | object): void {
    const formattedMessage = this.formatMessage(message);
    this.writeLog(LogLevel.INFO, formattedMessage, context);
  }

  /**
   * Logs a message with the ERROR level.
   * 
   * @param message - The message to log
   * @param trace - Optional stack trace or error object
   * @param context - Optional context for the log
   */
  error(message: any, trace?: string | Error, context?: string | object): void {
    const formattedMessage = this.formatMessage(message);
    const error = trace instanceof Error ? trace : new Error(trace as string);
    this.writeLog(LogLevel.ERROR, formattedMessage, context, error);
  }

  /**
   * Logs a message with the WARN level.
   * 
   * @param message - The message to log
   * @param context - Optional context for the log
   */
  warn(message: any, context?: string | object): void {
    const formattedMessage = this.formatMessage(message);
    this.writeLog(LogLevel.WARN, formattedMessage, context);
  }

  /**
   * Logs a message with the DEBUG level.
   * 
   * @param message - The message to log
   * @param context - Optional context for the log
   */
  debug(message: any, context?: string | object): void {
    const formattedMessage = this.formatMessage(message);
    this.writeLog(LogLevel.DEBUG, formattedMessage, context);
  }

  /**
   * Logs a message with the VERBOSE level (maps to DEBUG).
   * 
   * @param message - The message to log
   * @param context - Optional context for the log
   */
  verbose(message: any, context?: string | object): void {
    const formattedMessage = this.formatMessage(message);
    this.writeLog(LogLevel.DEBUG, formattedMessage, context);
  }

  /**
   * Logs a message with the FATAL level.
   * 
   * @param message - The message to log
   * @param error - Optional error object
   * @param context - Optional context for the log
   */
  fatal(message: any, error?: Error, context?: string | object): void {
    const formattedMessage = this.formatMessage(message);
    this.writeLog(LogLevel.FATAL, formattedMessage, context, error);
  }

  /**
   * Formats a message for logging, handling various input types.
   * 
   * @param message - The message to format
   */
  private formatMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message instanceof Error) {
      return message.message;
    }
    if (typeof message === 'object') {
      try {
        return JSON.stringify(message);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(message);
  }

  /**
   * Logs a message with journey-specific context.
   * 
   * @param level - The log level
   * @param message - The message to log
   * @param journeyContext - The journey context
   * @param error - Optional error object
   */
  logWithJourneyContext(
    level: LogLevel,
    message: string,
    journeyContext: JourneyContext,
    error?: Error,
  ): void {
    this.writeLog(level, message, undefined, error, journeyContext);
  }

  /**
   * Logs a message with user-specific context.
   * 
   * @param level - The log level
   * @param message - The message to log
   * @param userContext - The user context
   * @param error - Optional error object
   */
  logWithUserContext(
    level: LogLevel,
    message: string,
    userContext: UserContext,
    error?: Error,
  ): void {
    this.writeLog(level, message, undefined, error, userContext);
  }

  /**
   * Logs a message with request-specific context.
   * 
   * @param level - The log level
   * @param message - The message to log
   * @param requestContext - The request context
   * @param error - Optional error object
   */
  logWithRequestContext(
    level: LogLevel,
    message: string,
    requestContext: RequestContext,
    error?: Error,
  ): void {
    this.writeLog(level, message, undefined, error, requestContext);
  }

  /**
   * Logs a message with combined contexts.
   * 
   * @param level - The log level
   * @param message - The message to log
   * @param contexts - Array of contexts to combine
   * @param error - Optional error object
   */
  logWithCombinedContext(
    level: LogLevel,
    message: string,
    contexts: LoggingContext[],
    error?: Error,
  ): void {
    const combinedContext = this.contextManager.mergeContexts(...contexts);
    this.writeLog(level, message, undefined, error, combinedContext);
  }
}
import { Injectable, LoggerService as NestLoggerService, Inject, Optional } from '@nestjs/common';
import { LogLevel } from './interfaces/log-level.enum';
import { LoggerConfig } from './interfaces/log-config.interface';
import { TransportFactory } from './transports/transport-factory';
import { Transport } from './interfaces/transport.interface';
import { LogEntry } from './interfaces/log-entry.interface';
import { ContextManager } from './context/context-manager';
import { LoggingContext } from './context/context.interface';
import { RequestContext } from './context/request-context.interface';
import { UserContext } from './context/user-context.interface';
import { JourneyContext } from './context/journey-context.interface';
import { JourneyType } from './context/context.constants';

/**
 * Enhanced logger service for the AUSTA SuperApp.
 * 
 * Provides a centralized and consistent way to handle logging across all backend services
 * with support for structured logging, context enrichment, and distributed tracing correlation.
 * 
 * Features:
 * - Context-enriched logs (request ID, user ID, journey)
 * - Integration with distributed tracing
 * - Standardized JSON log format
 * - Configurable transport system (console, file, CloudWatch)
 * - Journey-specific logging contexts
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly transports: Transport[] = [];
  private readonly contextManager: ContextManager;
  private readonly defaultContext: LoggingContext;
  private readonly defaultLevel: LogLevel;
  private readonly journeyLevels: Record<string, LogLevel>;

  /**
   * Initializes the LoggerService with the provided configuration and transport factory.
   * 
   * @param config The logger configuration
   * @param transportFactory Factory for creating log transports
   */
  constructor(
    @Inject('LOGGER_CONFIG') private readonly config: LoggerConfig,
    private readonly transportFactory: TransportFactory,
    @Optional() @Inject('TRACING_SERVICE') private readonly tracingService?: any
  ) {
    this.contextManager = new ContextManager(tracingService);
    this.defaultContext = this.createDefaultContext();
    this.defaultLevel = this.parseLogLevel(config.level);
    this.journeyLevels = this.parseJourneyLevels(config.journeyLevels);
    this.transports = this.transportFactory.createTransports();
  }

  /**
   * Logs a message with the INFO level.
   * 
   * @param message The message to log
   * @param context Optional context for the log (string or object)
   */
  log(message: any, context?: string | object): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  /**
   * Logs a message with the ERROR level.
   * 
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log (string or object)
   */
  error(message: any, trace?: string | Error, context?: string | object): void {
    const error = trace instanceof Error ? trace : undefined;
    const stack = typeof trace === 'string' ? trace : error?.stack;
    
    this.writeLog(LogLevel.ERROR, message, context, { error, stack });
  }

  /**
   * Logs a message with the WARN level.
   * 
   * @param message The message to log
   * @param context Optional context for the log (string or object)
   */
  warn(message: any, context?: string | object): void {
    this.writeLog(LogLevel.WARN, message, context);
  }

  /**
   * Logs a message with the DEBUG level.
   * 
   * @param message The message to log
   * @param context Optional context for the log (string or object)
   */
  debug(message: any, context?: string | object): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs a message with the VERBOSE level.
   * 
   * @param message The message to log
   * @param context Optional context for the log (string or object)
   */
  verbose(message: any, context?: string | object): void {
    this.writeLog(LogLevel.DEBUG, message, context); // Map VERBOSE to DEBUG
  }

  /**
   * Logs a message with the FATAL level.
   * 
   * @param message The message to log
   * @param error Optional error object
   * @param context Optional context for the log (string or object)
   */
  fatal(message: any, error?: Error, context?: string | object): void {
    this.writeLog(LogLevel.FATAL, message, context, { error, stack: error?.stack });
  }

  /**
   * Creates a new logger instance with the provided context.
   * 
   * @param context The context to attach to all logs from this logger
   * @returns A new LoggerService instance with the attached context
   */
  withContext(context: Partial<LoggingContext>): LoggerService {
    const childLogger = new LoggerService(this.config, this.transportFactory, this.tracingService);
    childLogger['defaultContext'] = this.contextManager.mergeContexts(
      this.defaultContext,
      context as LoggingContext
    );
    return childLogger;
  }

  /**
   * Creates a new logger instance with request context.
   * 
   * @param context The request context to attach to all logs from this logger
   * @returns A new LoggerService instance with the attached request context
   */
  withRequestContext(context: Partial<RequestContext>): LoggerService {
    const requestContext = this.contextManager.createRequestContext(context);
    return this.withContext(requestContext);
  }

  /**
   * Creates a new logger instance with user context.
   * 
   * @param context The user context to attach to all logs from this logger
   * @returns A new LoggerService instance with the attached user context
   */
  withUserContext(context: Partial<UserContext>): LoggerService {
    const userContext = this.contextManager.createUserContext(context);
    return this.withContext(userContext);
  }

  /**
   * Creates a new logger instance with journey context.
   * 
   * @param context The journey context to attach to all logs from this logger
   * @returns A new LoggerService instance with the attached journey context
   */
  withJourneyContext(context: Partial<JourneyContext>): LoggerService {
    const journeyContext = this.contextManager.createJourneyContext(context);
    return this.withContext(journeyContext);
  }

  /**
   * Creates a new logger instance for the Health journey.
   * 
   * @param additionalContext Additional context to attach to all logs from this logger
   * @returns A new LoggerService instance with Health journey context
   */
  forHealthJourney(additionalContext?: Partial<JourneyContext>): LoggerService {
    const journeyContext = this.contextManager.createJourneyContext({
      journeyType: JourneyType.HEALTH,
      ...additionalContext,
    });
    return this.withContext(journeyContext);
  }

  /**
   * Creates a new logger instance for the Care journey.
   * 
   * @param additionalContext Additional context to attach to all logs from this logger
   * @returns A new LoggerService instance with Care journey context
   */
  forCareJourney(additionalContext?: Partial<JourneyContext>): LoggerService {
    const journeyContext = this.contextManager.createJourneyContext({
      journeyType: JourneyType.CARE,
      ...additionalContext,
    });
    return this.withContext(journeyContext);
  }

  /**
   * Creates a new logger instance for the Plan journey.
   * 
   * @param additionalContext Additional context to attach to all logs from this logger
   * @returns A new LoggerService instance with Plan journey context
   */
  forPlanJourney(additionalContext?: Partial<JourneyContext>): LoggerService {
    const journeyContext = this.contextManager.createJourneyContext({
      journeyType: JourneyType.PLAN,
      ...additionalContext,
    });
    return this.withContext(journeyContext);
  }

  /**
   * Writes a log entry to all configured transports if the log level is enabled.
   * 
   * @param level The log level
   * @param message The message to log
   * @param context Optional context for the log (string or object)
   * @param additionalProps Additional properties to include in the log entry
   * @private
   */
  private writeLog(
    level: LogLevel,
    message: any,
    context?: string | object,
    additionalProps: Record<string, any> = {}
  ): void {
    // Skip if log level is not enabled
    if (!this.isLevelEnabled(level, context)) {
      return;
    }

    // Create log entry
    const timestamp = new Date();
    const contextObj = this.resolveContext(context);
    const mergedContext = this.contextManager.mergeContexts(this.defaultContext, contextObj);
    
    // Add trace correlation if available
    const traceContext = this.getTraceContext(mergedContext);
    
    const logEntry: LogEntry = {
      timestamp,
      level,
      message: this.formatMessage(message),
      context: mergedContext,
      ...traceContext,
      ...additionalProps,
    };

    // Write to all transports
    for (const transport of this.transports) {
      transport.write(logEntry);
    }
  }

  /**
   * Checks if the given log level is enabled for the current context.
   * 
   * @param level The log level to check
   * @param context The context to check against (for journey-specific levels)
   * @returns True if the log level is enabled, false otherwise
   * @private
   */
  private isLevelEnabled(level: LogLevel, context?: string | object): boolean {
    // Get the appropriate log level based on context
    const journeyType = this.getJourneyTypeFromContext(context);
    const effectiveLevel = journeyType && this.journeyLevels[journeyType]
      ? this.journeyLevels[journeyType]
      : this.defaultLevel;

    // Check if the log level is enabled
    return level >= effectiveLevel;
  }

  /**
   * Extracts the journey type from the context if available.
   * 
   * @param context The context to extract from
   * @returns The journey type or undefined if not found
   * @private
   */
  private getJourneyTypeFromContext(context?: string | object): string | undefined {
    if (!context || typeof context === 'string') {
      return undefined;
    }

    if ('journeyType' in context) {
      return (context as JourneyContext).journeyType;
    }

    return undefined;
  }

  /**
   * Resolves the context from various input types.
   * 
   * @param context The context input (string or object)
   * @returns A LoggingContext object
   * @private
   */
  private resolveContext(context?: string | object): LoggingContext {
    if (!context) {
      return {} as LoggingContext;
    }

    if (typeof context === 'string') {
      return { contextName: context } as LoggingContext;
    }

    return context as LoggingContext;
  }

  /**
   * Formats the message for logging, handling various input types.
   * 
   * @param message The message to format
   * @returns A string representation of the message
   * @private
   */
  private formatMessage(message: any): string {
    if (message === null || message === undefined) {
      return '';
    }

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
   * Creates the default context for all logs.
   * 
   * @returns The default logging context
   * @private
   */
  private createDefaultContext(): LoggingContext {
    return {
      application: this.config.defaultContext.application,
      service: this.config.defaultContext.service,
      environment: this.config.defaultContext.environment,
    } as LoggingContext;
  }

  /**
   * Gets trace context from the tracing service if available.
   * 
   * @param context The current logging context
   * @returns Trace context properties or an empty object
   * @private
   */
  private getTraceContext(context: LoggingContext): Record<string, any> {
    if (!this.tracingService || !this.config.tracing.enabled) {
      return {};
    }

    try {
      // Extract trace context from the tracing service
      const traceId = this.tracingService.getCurrentTraceId();
      const spanId = this.tracingService.getCurrentSpanId();
      
      if (traceId) {
        return { traceId, spanId };
      }
    } catch (error) {
      // Silently fail if tracing service throws an error
      // This prevents logging issues from breaking application functionality
    }

    return {};
  }

  /**
   * Parses the log level from string or enum value.
   * 
   * @param level The log level to parse
   * @returns The parsed LogLevel enum value
   * @private
   */
  private parseLogLevel(level: LogLevel | string): LogLevel {
    if (typeof level === 'string') {
      const upperLevel = level.toUpperCase();
      return LogLevel[upperLevel as keyof typeof LogLevel] || LogLevel.INFO;
    }
    return level || LogLevel.INFO;
  }

  /**
   * Parses journey-specific log levels.
   * 
   * @param journeyLevels The journey log levels to parse
   * @returns A record of journey types to log levels
   * @private
   */
  private parseJourneyLevels(journeyLevels: Record<string, LogLevel | string> = {}): Record<string, LogLevel> {
    const result: Record<string, LogLevel> = {};
    
    for (const [journey, level] of Object.entries(journeyLevels)) {
      result[journey] = this.parseLogLevel(level);
    }
    
    return result;
  }
}
import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { TracingService } from '@austa/tracing';
import { LogLevel } from './interfaces/log-level.enum';
import { LogEntry } from './interfaces/log-entry.interface';
import { Logger } from './interfaces/logger.interface';
import { LoggerConfig } from './interfaces/log-config.interface';
import { Transport } from './interfaces/transport.interface';
import { TransportFactory } from './transports/transport-factory';
import { Formatter } from './formatters/formatter.interface';
import { JsonFormatter } from './formatters/json.formatter';
import { TextFormatter } from './formatters/text.formatter';
import { CloudWatchFormatter } from './formatters/cloudwatch.formatter';
import { LoggingContext } from './context/context.interface';
import { JourneyContext } from './context/journey-context.interface';
import { UserContext } from './context/user-context.interface';
import { RequestContext } from './context/request-context.interface';
import { ContextManager } from './context/context-manager';
import { JourneyType } from './context/context.constants';
import * as formatUtils from './utils/format.utils';
import * as levelUtils from './utils/level.utils';
import * as contextUtils from './utils/context.utils';
import * as traceUtils from './utils/trace-correlation.utils';
import * as sanitizationUtils from './utils/sanitization.utils';

/**
 * Enhanced logger service for the AUSTA SuperApp.
 * 
 * Provides a centralized and consistent way to handle logging across all backend services.
 * Features include:
 * - Context-enriched logs (request ID, user ID, journey)
 * - Integration with distributed tracing for correlation IDs
 * - Standardized JSON log format
 * - Configurable log transports (Console, File, CloudWatch)
 * - Journey-specific logging contexts
 * - Log level filtering
 * - Structured error logging
 */
@Injectable({ scope: Scope.DEFAULT })
export class LoggerService implements NestLoggerService, Logger {
  private readonly contextManager: ContextManager;
  private readonly transports: Transport[] = [];
  private readonly formatter: Formatter;
  private readonly defaultContext: LoggingContext;
  private readonly logLevel: LogLevel;
  private readonly serviceName: string;

  /**
   * Initializes the LoggerService with the provided configuration.
   * 
   * @param config - Configuration options for the logger
   * @param tracingService - Optional TracingService for distributed tracing correlation
   */
  constructor(
    private readonly config: LoggerConfig = {},
    private readonly tracingService?: TracingService,
  ) {
    this.serviceName = config.serviceName || 'austa-service';
    this.logLevel = levelUtils.parseLogLevel(config.logLevel || 'INFO');
    this.contextManager = new ContextManager(tracingService);
    this.defaultContext = this.createDefaultContext();
    this.formatter = this.createFormatter(config.formatter || 'json');
    this.transports = this.createTransports(config.transports || ['console']);
  }

  /**
   * Creates the default logging context with service information.
   */
  private createDefaultContext(): LoggingContext {
    return {
      serviceName: this.serviceName,
      environment: process.env.NODE_ENV || 'development',
      correlationId: this.tracingService?.getCurrentTraceId() || '',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates the appropriate formatter based on the configuration.
   */
  private createFormatter(formatterType: string): Formatter {
    switch (formatterType.toLowerCase()) {
      case 'json':
        return new JsonFormatter();
      case 'text':
        return new TextFormatter();
      case 'cloudwatch':
        return new CloudWatchFormatter();
      default:
        return new JsonFormatter();
    }
  }

  /**
   * Creates the configured transports for log delivery.
   */
  private createTransports(transportTypes: string[]): Transport[] {
    const factory = new TransportFactory();
    return transportTypes.map(type => factory.createTransport(type, this.config));
  }

  /**
   * Logs a message with the DEBUG level.
   * 
   * @param message - The message to log
   * @param context - Optional context for the log (string or object)
   */
  debug(message: string, context?: string | object): void {
    this.logWithLevel(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs a message with the VERBOSE level.
   * 
   * @param message - The message to log
   * @param context - Optional context for the log (string or object)
   */
  verbose(message: string, context?: string | object): void {
    this.logWithLevel(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs a message with the INFO level.
   * 
   * @param message - The message to log
   * @param context - Optional context for the log (string or object)
   */
  log(message: string, context?: string | object): void {
    this.logWithLevel(LogLevel.INFO, message, context);
  }

  /**
   * Logs a message with the WARN level.
   * 
   * @param message - The message to log
   * @param context - Optional context for the log (string or object)
   */
  warn(message: string, context?: string | object): void {
    this.logWithLevel(LogLevel.WARN, message, context);
  }

  /**
   * Logs a message with the ERROR level.
   * 
   * @param message - The message to log
   * @param trace - Optional stack trace or error object
   * @param context - Optional context for the log (string or object)
   */
  error(message: string, trace?: string | Error, context?: string | object): void {
    const errorContext = trace instanceof Error 
      ? { error: formatUtils.formatError(trace) } 
      : trace 
        ? { stack: trace } 
        : {};
    
    this.logWithLevel(
      LogLevel.ERROR, 
      message, 
      context, 
      errorContext
    );
  }

  /**
   * Logs a message with the FATAL level.
   * 
   * @param message - The message to log
   * @param trace - Optional stack trace or error object
   * @param context - Optional context for the log (string or object)
   */
  fatal(message: string, trace?: string | Error, context?: string | object): void {
    const errorContext = trace instanceof Error 
      ? { error: formatUtils.formatError(trace) } 
      : trace 
        ? { stack: trace } 
        : {};
    
    this.logWithLevel(
      LogLevel.FATAL, 
      message, 
      context, 
      errorContext
    );
  }

  /**
   * Logs a message with the specified level and context.
   * 
   * @param level - The log level
   * @param message - The message to log
   * @param contextInput - Optional context for the log (string or object)
   * @param additionalContext - Additional context to merge
   */
  private logWithLevel(
    level: LogLevel, 
    message: string, 
    contextInput?: string | object,
    additionalContext: Record<string, any> = {}
  ): void {
    // Skip if log level is not enabled
    if (!levelUtils.shouldLog(level, this.logLevel)) {
      return;
    }

    // Process context
    const context = typeof contextInput === 'string' 
      ? { context: contextInput } 
      : contextInput || {};

    // Create log entry
    const logEntry: LogEntry = {
      level,
      message: sanitizationUtils.sanitizeMessage(message),
      timestamp: new Date().toISOString(),
      context: this.contextManager.mergeContexts(
        this.defaultContext,
        context as Record<string, any>,
        additionalContext
      ),
    };

    // Add trace correlation if available
    if (this.tracingService) {
      logEntry.traceId = this.tracingService.getCurrentTraceId();
      logEntry.spanId = this.tracingService.getCurrentSpanId();
    }

    // Format and write to all transports
    const formattedLog = this.formatter.format(logEntry);
    this.transports.forEach(transport => {
      transport.write(formattedLog, level);
    });
  }

  /**
   * Creates a new logger instance with the specified request context.
   * 
   * @param requestContext - The request context to attach to logs
   * @returns A new logger instance with the request context
   */
  withRequestContext(requestContext: RequestContext): Logger {
    const childLogger = new LoggerService(this.config, this.tracingService);
    childLogger['defaultContext'] = this.contextManager.mergeContexts(
      this.defaultContext,
      requestContext
    );
    return childLogger;
  }

  /**
   * Creates a new logger instance with the specified user context.
   * 
   * @param userContext - The user context to attach to logs
   * @returns A new logger instance with the user context
   */
  withUserContext(userContext: UserContext): Logger {
    const childLogger = new LoggerService(this.config, this.tracingService);
    childLogger['defaultContext'] = this.contextManager.mergeContexts(
      this.defaultContext,
      userContext
    );
    return childLogger;
  }

  /**
   * Creates a new logger instance with the specified journey context.
   * 
   * @param journeyContext - The journey context to attach to logs
   * @returns A new logger instance with the journey context
   */
  withJourneyContext(journeyContext: JourneyContext): Logger {
    const childLogger = new LoggerService(this.config, this.tracingService);
    childLogger['defaultContext'] = this.contextManager.mergeContexts(
      this.defaultContext,
      journeyContext
    );
    return childLogger;
  }

  /**
   * Creates a new logger instance for the Health journey.
   * 
   * @param additionalContext - Additional context to include
   * @returns A new logger instance with Health journey context
   */
  forHealthJourney(additionalContext: Record<string, any> = {}): Logger {
    return this.withJourneyContext({
      journeyType: JourneyType.HEALTH,
      ...additionalContext
    });
  }

  /**
   * Creates a new logger instance for the Care journey.
   * 
   * @param additionalContext - Additional context to include
   * @returns A new logger instance with Care journey context
   */
  forCareJourney(additionalContext: Record<string, any> = {}): Logger {
    return this.withJourneyContext({
      journeyType: JourneyType.CARE,
      ...additionalContext
    });
  }

  /**
   * Creates a new logger instance for the Plan journey.
   * 
   * @param additionalContext - Additional context to include
   * @returns A new logger instance with Plan journey context
   */
  forPlanJourney(additionalContext: Record<string, any> = {}): Logger {
    return this.withJourneyContext({
      journeyType: JourneyType.PLAN,
      ...additionalContext
    });
  }

  /**
   * Creates a new logger instance with a combined context.
   * 
   * @param context - The context to attach to logs
   * @returns A new logger instance with the combined context
   */
  withContext(context: Record<string, any>): Logger {
    const childLogger = new LoggerService(this.config, this.tracingService);
    childLogger['defaultContext'] = this.contextManager.mergeContexts(
      this.defaultContext,
      context
    );
    return childLogger;
  }

  /**
   * Creates a child logger with a specific name.
   * 
   * @param name - The name for the child logger
   * @returns A new logger instance with the specified name
   */
  child(name: string): Logger {
    return this.withContext({ childName: name });
  }

  /**
   * Attaches the current trace context to the logger.
   * 
   * @returns A new logger instance with the current trace context
   */
  withCurrentTraceContext(): Logger {
    if (!this.tracingService) {
      return this;
    }

    const traceContext = traceUtils.createTraceContext(this.tracingService);
    return this.withContext(traceContext);
  }
}
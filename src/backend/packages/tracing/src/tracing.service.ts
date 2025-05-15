import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tracer, Context, trace, SpanStatusCode, Span, SpanKind, SpanOptions } from '@opentelemetry/api';
import { JourneyContext } from './interfaces/journey-context.interface';
import { SpanAttributes } from './interfaces/span-attributes.interface';
import { CustomSpanOptions } from './interfaces/span-options.interface';
import * as correlationUtils from './utils/correlation';
import * as spanAttributeUtils from './utils/span-attributes';
import * as contextPropagationUtils from './utils/context-propagation';
import { CONFIG_KEYS, DEFAULT_VALUES, ERROR_CODES } from './constants';

/**
 * TracingService provides OpenTelemetry distributed tracing capabilities for the AUSTA SuperApp.
 * It integrates with the application's logging system and provides methods for creating spans,
 * annotating them with business-relevant information, and propagating context across service boundaries.
 */
@Injectable()
export class TracingService {
  private tracer: Tracer;

  /**
   * Initializes the TracingService and obtains a tracer instance.
   * @param configService ConfigService for accessing configuration variables
   * @param logger LoggerService for logging messages
   */
  constructor(
    private configService: ConfigService,
    private logger: LoggerService
  ) {
    // Obtain a tracer from OpenTelemetry using the service name from configuration
    const serviceName = this.configService.get<string>(
      CONFIG_KEYS.SERVICE_NAME,
      DEFAULT_VALUES.SERVICE_NAME
    );
    
    this.tracer = trace.getTracer(serviceName, this.configService.get<string>(
      CONFIG_KEYS.SERVICE_VERSION,
      DEFAULT_VALUES.SERVICE_VERSION
    ));
    
    this.logger.log(
      `Initialized tracer for ${serviceName}`,
      DEFAULT_VALUES.LOGGER_CONTEXT
    );
  }

  /**
   * Creates and starts a new span for tracing a specific operation.
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @param options Optional configuration for the span including custom attributes
   * @returns The result of the function execution
   */
  async createSpan<T>(
    name: string,
    fn: () => Promise<T>,
    options?: CustomSpanOptions
  ): Promise<T> {
    const spanOptions: SpanOptions = {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes || {}
    };

    // Start a new span with the given name and options
    const span = this.tracer.startSpan(name, spanOptions);
    
    // Add correlation ID for connecting logs, traces, and metrics
    const correlationId = correlationUtils.getOrCreateCorrelationId();
    span.setAttribute('correlation.id', correlationId);
    
    // Add journey-specific context if provided
    if (options?.journeyContext) {
      this.addJourneyContext(span, options.journeyContext);
    }
    
    try {
      // Execute the provided function within the context of the span
      const result = await trace.with(trace.setSpan(trace.context(), span), fn);
      
      // If the function completes successfully, set the span status to OK
      if (span.isRecording()) {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      
      return result;
    } catch (error) {
      // If the function throws an error, set the span status to ERROR and record the exception
      if (span.isRecording()) {
        // Add error details to the span
        spanAttributeUtils.addErrorAttributes(span, error);
        
        // Add journey-specific error context if available
        if (options?.journeyContext) {
          spanAttributeUtils.addJourneyErrorContext(span, error, options.journeyContext);
        }
        
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });
      }
      
      // Enrich log with trace information
      const traceInfo = correlationUtils.getTraceInfoForLogs(span);
      this.logger.error(
        `Error in span ${name}: ${error.message}`,
        error.stack,
        DEFAULT_VALUES.LOGGER_CONTEXT,
        traceInfo
      );
      
      throw error;
    } finally {
      // Always end the span regardless of success or failure
      span.end();
    }
  }

  /**
   * Creates a span for a specific journey operation with appropriate context.
   * @param journeyName The name of the journey (health, care, plan)
   * @param operationName The specific operation within the journey
   * @param fn The function to execute within the span context
   * @param journeyContext Additional journey-specific context
   * @returns The result of the function execution
   */
  async createJourneySpan<T>(
    journeyName: 'health' | 'care' | 'plan',
    operationName: string,
    fn: () => Promise<T>,
    journeyContext?: JourneyContext
  ): Promise<T> {
    const spanName = `${journeyName}.${operationName}`;
    const attributes = spanAttributeUtils.createJourneyAttributes(journeyName, operationName);
    
    return this.createSpan(spanName, fn, {
      attributes,
      journeyContext,
      kind: SpanKind.INTERNAL
    });
  }

  /**
   * Creates a span for an HTTP request with appropriate context.
   * @param method The HTTP method (GET, POST, etc.)
   * @param url The URL being requested
   * @param fn The function to execute within the span context
   * @param options Additional options for the span
   * @returns The result of the function execution
   */
  async createHttpSpan<T>(
    method: string,
    url: string,
    fn: () => Promise<T>,
    options?: CustomSpanOptions
  ): Promise<T> {
    const spanName = `HTTP ${method}`;
    const attributes = {
      'http.method': method,
      'http.url': url,
      ...options?.attributes
    };
    
    return this.createSpan(spanName, fn, {
      ...options,
      attributes,
      kind: SpanKind.CLIENT
    });
  }

  /**
   * Creates a span for a database operation with appropriate context.
   * @param operation The database operation (query, insert, update, delete)
   * @param entity The entity being operated on
   * @param fn The function to execute within the span context
   * @param options Additional options for the span
   * @returns The result of the function execution
   */
  async createDatabaseSpan<T>(
    operation: string,
    entity: string,
    fn: () => Promise<T>,
    options?: CustomSpanOptions
  ): Promise<T> {
    const spanName = `DB ${operation} ${entity}`;
    const attributes = {
      'db.operation': operation,
      'db.entity': entity,
      ...options?.attributes
    };
    
    return this.createSpan(spanName, fn, {
      ...options,
      attributes,
      kind: SpanKind.CLIENT
    });
  }

  /**
   * Extracts the current trace context for propagation to other services.
   * @returns The serialized trace context for use in headers or messages
   */
  getTraceContextForPropagation(): Record<string, string> {
    return contextPropagationUtils.extractContextForPropagation();
  }

  /**
   * Injects the current trace context into HTTP headers for propagation.
   * @param headers The HTTP headers object to inject context into
   * @returns The headers object with injected trace context
   */
  injectTraceContextIntoHeaders(headers: Record<string, string>): Record<string, string> {
    return contextPropagationUtils.injectContextIntoHeaders(headers);
  }

  /**
   * Extracts trace context from HTTP headers and sets it as the current context.
   * @param headers The HTTP headers containing trace context
   * @returns The extracted context
   */
  extractTraceContextFromHeaders(headers: Record<string, string>): Context {
    return contextPropagationUtils.extractContextFromHeaders(headers);
  }

  /**
   * Gets the current trace and span IDs for correlation with logs and metrics.
   * @returns Object containing trace and span IDs
   */
  getCurrentTraceInfo(): { traceId: string; spanId: string } {
    return correlationUtils.getCurrentTraceInfo();
  }

  /**
   * Adds journey-specific context to a span.
   * @param span The span to add context to
   * @param journeyContext The journey context to add
   */
  private addJourneyContext(span: Span, journeyContext: JourneyContext): void {
    if (!span.isRecording()) return;
    
    spanAttributeUtils.addJourneyAttributes(span, journeyContext);
    
    // Add user context if available
    if (journeyContext.userId) {
      span.setAttribute('user.id', journeyContext.userId);
    }
    
    // Add request context if available
    if (journeyContext.requestId) {
      span.setAttribute('request.id', journeyContext.requestId);
    }
  }
}
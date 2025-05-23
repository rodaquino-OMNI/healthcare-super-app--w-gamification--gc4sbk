import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  Tracer, 
  Context, 
  trace, 
  SpanStatusCode, 
  Span,
  SpanKind,
  SpanOptions as OtelSpanOptions,
  propagation,
  context,
  ROOT_CONTEXT,
  SpanContext,
  TraceFlags
} from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { v4 as uuidv4 } from 'uuid';

import { 
  TRACING_SERVICE_NAME_KEY,
  DEFAULT_SERVICE_NAME,
  DEFAULT_LOGGER_CONTEXT
} from './constants/defaults';
import { 
  TRACER_INIT_ERROR,
  SPAN_CREATION_ERROR,
  CONTEXT_PROPAGATION_ERROR
} from './constants/error-codes';
import { 
  SpanOptions,
  JourneyContext,
  TraceContextCarrier
} from './interfaces';
import { 
  addCommonAttributes,
  addJourneyAttributes,
  addErrorAttributes,
  extractTraceContext,
  injectTraceContext,
  getCorrelationInfo
} from './utils';

/**
 * Service for distributed tracing using OpenTelemetry.
 * Provides methods for creating and managing spans, propagating context,
 * and correlating traces with logs and metrics.
 */
@Injectable()
export class TracingService {
  private tracer: Tracer;
  private readonly serviceName: string;

  /**
   * Initializes the TracingService and obtains a tracer instance.
   * @param configService ConfigService for accessing configuration variables
   * @param logger LoggerService for logging messages
   */
  constructor(
    private configService: ConfigService,
    private logger: LoggerService
  ) {
    try {
      // Obtain a tracer from OpenTelemetry using the service name from configuration
      this.serviceName = this.configService.get<string>(
        TRACING_SERVICE_NAME_KEY, 
        DEFAULT_SERVICE_NAME
      );
      this.tracer = trace.getTracer(this.serviceName);
      this.logger.log(
        `Initialized tracer for ${this.serviceName}`, 
        DEFAULT_LOGGER_CONTEXT
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize tracer: ${error.message}`,
        error.stack,
        DEFAULT_LOGGER_CONTEXT
      );
      throw new Error(`${TRACER_INIT_ERROR}: ${error.message}`);
    }
  }

  /**
   * Creates and starts a new span for tracing a specific operation.
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @param options Optional configuration for the span
   * @returns The result of the function execution
   */
  async createSpan<T>(
    name: string, 
    fn: () => Promise<T>, 
    options?: SpanOptions
  ): Promise<T> {
    const spanOptions: OtelSpanOptions = {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes || {}
    };

    // Start a new span with the given name and options
    const span = this.tracer.startSpan(name, spanOptions);
    
    try {
      // Add common attributes to the span
      addCommonAttributes(span, {
        serviceName: this.serviceName,
        spanName: name,
        ...options?.commonAttributes
      });

      // Add journey-specific attributes if provided
      if (options?.journeyContext) {
        addJourneyAttributes(span, options.journeyContext);
      }

      // Execute the provided function within the context of the span
      const result = await this.withSpan(span, fn);
      
      // If the function completes successfully, set the span status to OK
      if (span.isRecording()) {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      
      return result;
    } catch (error) {
      // If the function throws an error, set the span status to ERROR and record the exception
      if (span.isRecording()) {
        addErrorAttributes(span, error);
        span.recordException(error);
        span.setStatus({ 
          code: SpanStatusCode.ERROR,
          message: error.message 
        });
      }
      
      const correlationInfo = getCorrelationInfo();
      this.logger.error(
        `Error in span ${name}: ${error.message}`,
        error.stack,
        DEFAULT_LOGGER_CONTEXT,
        correlationInfo
      );
      throw error;
    } finally {
      // Always end the span regardless of success or failure
      span.end();
    }
  }

  /**
   * Executes a function within the context of a given span.
   * @param span The span to use as context
   * @param fn The function to execute
   * @returns The result of the function execution
   */
  private async withSpan<T>(span: Span, fn: () => Promise<T>): Promise<T> {
    return trace.with(trace.setSpan(context.active(), span), fn);
  }

  /**
   * Gets the current active span from the context.
   * @returns The current span or undefined if no span is active
   */
  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  /**
   * Creates a new span as a child of the current span.
   * @param name The name of the span to create
   * @param options Optional configuration for the span
   * @returns The newly created span
   */
  startSpan(name: string, options?: SpanOptions): Span {
    try {
      const spanOptions: OtelSpanOptions = {
        kind: options?.kind || SpanKind.INTERNAL,
        attributes: options?.attributes || {}
      };

      const span = this.tracer.startSpan(name, spanOptions, context.active());

      // Add common attributes to the span
      addCommonAttributes(span, {
        serviceName: this.serviceName,
        spanName: name,
        ...options?.commonAttributes
      });

      // Add journey-specific attributes if provided
      if (options?.journeyContext) {
        addJourneyAttributes(span, options.journeyContext);
      }

      return span;
    } catch (error) {
      this.logger.error(
        `Failed to create span ${name}: ${error.message}`,
        error.stack,
        DEFAULT_LOGGER_CONTEXT
      );
      throw new Error(`${SPAN_CREATION_ERROR}: ${error.message}`);
    }
  }

  /**
   * Extracts trace context from carrier object (e.g., HTTP headers).
   * @param carrier The carrier object containing the trace context
   * @returns The extracted context or ROOT_CONTEXT if extraction fails
   */
  extractContext(carrier: TraceContextCarrier): Context {
    try {
      return propagation.extract(ROOT_CONTEXT, carrier);
    } catch (error) {
      this.logger.error(
        `Failed to extract trace context: ${error.message}`,
        error.stack,
        DEFAULT_LOGGER_CONTEXT
      );
      return ROOT_CONTEXT;
    }
  }

  /**
   * Injects the current trace context into a carrier object (e.g., HTTP headers).
   * @param carrier The carrier object to inject the trace context into
   */
  injectContext(carrier: TraceContextCarrier): void {
    try {
      propagation.inject(context.active(), carrier);
    } catch (error) {
      this.logger.error(
        `Failed to inject trace context: ${error.message}`,
        error.stack,
        DEFAULT_LOGGER_CONTEXT
      );
      throw new Error(`${CONTEXT_PROPAGATION_ERROR}: ${error.message}`);
    }
  }

  /**
   * Creates a correlation ID for linking traces, logs, and metrics.
   * If a trace is active, uses the trace ID, otherwise generates a new UUID.
   * @returns A correlation ID string
   */
  getCorrelationId(): string {
    const span = this.getCurrentSpan();
    if (span) {
      const spanContext = span.spanContext();
      return spanContext.traceId;
    }
    return uuidv4();
  }

  /**
   * Gets correlation information from the current trace context.
   * @returns An object containing trace ID, span ID, and trace flags
   */
  getCorrelationInfo(): Record<string, string> {
    return getCorrelationInfo();
  }

  /**
   * Annotates the current span with journey-specific context.
   * @param journeyContext The journey context to add to the span
   */
  setJourneyContext(journeyContext: JourneyContext): void {
    const span = this.getCurrentSpan();
    if (span && span.isRecording()) {
      addJourneyAttributes(span, journeyContext);
    }
  }

  /**
   * Annotates the current span with an event.
   * @param name The name of the event
   * @param attributes Optional attributes for the event
   */
  addEvent(name: string, attributes?: Record<string, unknown>): void {
    const span = this.getCurrentSpan();
    if (span && span.isRecording()) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Annotates the current span with custom attributes.
   * @param attributes The attributes to add to the span
   */
  setAttributes(attributes: Record<string, unknown>): void {
    const span = this.getCurrentSpan();
    if (span && span.isRecording()) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Creates a new trace context with the given trace ID and span ID.
   * Useful for testing and manual context creation.
   * @param traceId The trace ID to use
   * @param spanId The span ID to use
   * @returns A new span context
   */
  createSpanContext(traceId: string, spanId: string): SpanContext {
    return {
      traceId,
      spanId,
      traceFlags: TraceFlags.SAMPLED,
      isRemote: false,
    };
  }
}
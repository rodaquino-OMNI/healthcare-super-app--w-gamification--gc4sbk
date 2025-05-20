import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tracer, Context, trace, SpanStatusCode, SpanKind, Span, SpanOptions } from '@opentelemetry/api';
import { TraceContext } from './interfaces/trace-context.interface';
import { TracerProvider } from './interfaces/tracer-provider.interface';
import { CONFIG_KEYS } from './constants/config-keys';
import { DEFAULT_SERVICE_NAME, DEFAULT_LOGGER_CONTEXT } from './constants/defaults';
import { ERROR_CODES } from './constants/error-codes';
import { enrichLogContextWithTraceInfo } from './utils/correlation';
import { addCommonAttributes, addJourneyAttributes, addErrorAttributes } from './utils/span-attributes';
import { extractContextFromHeaders, injectContextIntoHeaders } from './utils/context-propagation';

/**
 * Service that provides distributed tracing capabilities across the AUSTA SuperApp.
 * 
 * This service integrates OpenTelemetry to enable end-to-end request tracing through all journey services,
 * supporting observability requirements for the application. The tracing functionality allows:
 * - Tracking requests as they flow through different microservices
 * - Measuring performance at different stages of request processing
 * - Identifying bottlenecks and errors in the request pipeline
 * - Correlating logs and traces for better debugging
 * - Adding journey-specific context to spans for business operation tracking
 */
@Injectable()
export class TracingService implements TracerProvider {
  private tracer: Tracer;
  private readonly loggerContext: string = DEFAULT_LOGGER_CONTEXT;

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
      DEFAULT_SERVICE_NAME
    );
    
    try {
      this.tracer = trace.getTracer(serviceName);
      this.logger.log(
        `Initialized tracer for ${serviceName}`,
        this.loggerContext
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize tracer for ${serviceName}: ${error.message}`,
        error.stack,
        this.loggerContext
      );
      // Fallback to a no-op tracer to prevent application crashes
      this.tracer = trace.getTracer('');
    }
  }

  /**
   * Gets the underlying OpenTelemetry tracer instance.
   * @returns The OpenTelemetry tracer instance
   */
  getTracer(): Tracer {
    return this.tracer;
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
    options?: {
      kind?: SpanKind;
      attributes?: Record<string, any>;
      journeyType?: 'health' | 'care' | 'plan';
      userId?: string;
      requestId?: string;
    }
  ): Promise<T> {
    // Configure span options
    const spanOptions: SpanOptions = {
      kind: options?.kind || SpanKind.INTERNAL
    };
    
    // Start a new span with the given name and options
    const span = this.tracer.startSpan(name, spanOptions);
    
    try {
      // Add common attributes to the span
      if (options) {
        // Add common attributes like user ID and request ID
        if (options.userId || options.requestId) {
          addCommonAttributes(span, {
            userId: options.userId,
            requestId: options.requestId
          });
        }
        
        // Add custom attributes if provided
        if (options.attributes) {
          Object.entries(options.attributes).forEach(([key, value]) => {
            span.setAttribute(key, value);
          });
        }
        
        // Add journey-specific attributes if a journey type is provided
        if (options.journeyType) {
          addJourneyAttributes(span, options.journeyType);
        }
      }
      
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
        // Add detailed error attributes to the span
        addErrorAttributes(span, error);
        span.recordException(error);
        span.setStatus({ 
          code: SpanStatusCode.ERROR,
          message: error.message
        });
      }
      
      // Log the error with trace context information
      const enrichedContext = enrichLogContextWithTraceInfo(span);
      this.logger.error(
        `Error in span ${name}: ${error.message}`,
        error.stack,
        enrichedContext
      );
      
      throw error;
    } finally {
      // Always end the span regardless of success or failure
      span.end();
    }
  }

  /**
   * Creates a span for a specific journey operation with journey-specific context.
   * @param journeyType The type of journey (health, care, plan)
   * @param operationName The name of the operation within the journey
   * @param fn The function to execute within the span context
   * @param options Additional options for the span
   * @returns The result of the function execution
   */
  async createJourneySpan<T>(
    journeyType: 'health' | 'care' | 'plan',
    operationName: string,
    fn: () => Promise<T>,
    options?: {
      attributes?: Record<string, any>;
      userId?: string;
      requestId?: string;
    }
  ): Promise<T> {
    const spanName = `${journeyType}.${operationName}`;
    return this.createSpan(spanName, fn, {
      ...options,
      journeyType
    });
  }

  /**
   * Extracts trace context from HTTP headers for cross-service tracing.
   * @param headers HTTP headers containing trace context
   * @returns The extracted trace context
   */
  extractContextFromHeaders(headers: Record<string, string | string[]>): TraceContext {
    try {
      return extractContextFromHeaders(headers);
    } catch (error) {
      this.logger.warn(
        `Failed to extract trace context from headers: ${error.message}`,
        this.loggerContext
      );
      return null;
    }
  }

  /**
   * Injects the current trace context into HTTP headers for cross-service tracing.
   * @param headers HTTP headers object to inject context into
   * @returns The headers with injected trace context
   */
  injectContextIntoHeaders(headers: Record<string, string | string[]>): Record<string, string | string[]> {
    try {
      return injectContextIntoHeaders(headers);
    } catch (error) {
      this.logger.warn(
        `Failed to inject trace context into headers: ${error.message}`,
        this.loggerContext
      );
      return headers;
    }
  }

  /**
   * Gets the current active span from the trace context.
   * @returns The current active span or undefined if no span is active
   */
  getCurrentSpan(): Span | undefined {
    return trace.getSpan(trace.context());
  }

  /**
   * Adds an attribute to the current active span.
   * @param key The attribute key
   * @param value The attribute value
   * @returns True if the attribute was added, false otherwise
   */
  addAttributeToCurrentSpan(key: string, value: any): boolean {
    const currentSpan = this.getCurrentSpan();
    if (currentSpan && currentSpan.isRecording()) {
      currentSpan.setAttribute(key, value);
      return true;
    }
    return false;
  }

  /**
   * Adds multiple attributes to the current active span.
   * @param attributes The attributes to add
   * @returns True if the attributes were added, false otherwise
   */
  addAttributesToCurrentSpan(attributes: Record<string, any>): boolean {
    const currentSpan = this.getCurrentSpan();
    if (currentSpan && currentSpan.isRecording()) {
      Object.entries(attributes).forEach(([key, value]) => {
        currentSpan.setAttribute(key, value);
      });
      return true;
    }
    return false;
  }

  /**
   * Records an exception in the current active span.
   * @param error The error to record
   * @param message Optional message to include with the error
   * @returns True if the exception was recorded, false otherwise
   */
  recordExceptionInCurrentSpan(error: Error, message?: string): boolean {
    const currentSpan = this.getCurrentSpan();
    if (currentSpan && currentSpan.isRecording()) {
      addErrorAttributes(currentSpan, error, message);
      currentSpan.recordException(error);
      currentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: message || error.message
      });
      return true;
    }
    return false;
  }
}
import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpanStatusCode } from '@opentelemetry/api';

/**
 * Mock trace context for simulating distributed tracing
 */
export interface MockTraceContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  isRemote?: boolean;
}

/**
 * Mock span interface that mimics OpenTelemetry Span for testing
 */
export interface MockSpan {
  name: string;
  status: {
    code: SpanStatusCode;
  };
  events: Array<{
    name: string;
    attributes?: Record<string, any>;
  }>;
  exceptions: Array<Error>;
  attributes: Record<string, any>;
  startTime: number;
  endTime?: number;
  traceContext: MockTraceContext;
  parentSpanId?: string;
  isRecording(): boolean;
  recordException(error: Error): void;
  setStatus(status: { code: SpanStatusCode }): void;
  setAttribute(key: string, value: string | number | boolean): void;
  addEvent(name: string, attributes?: Record<string, any>): void;
  end(): void;
}

/**
 * Generates a random ID for trace and span IDs
 * @returns A random hexadecimal ID
 */
function generateRandomId(): string {
  return Math.random().toString(16).substring(2, 18).padEnd(16, '0');
}

/**
 * Mock implementation of the TracingService for testing error handling with distributed tracing.
 * This mock simulates span creation, context propagation, and error recording without requiring
 * actual tracing infrastructure.
 */
@Injectable()
export class MockTracingService {
  /**
   * Mock logger for capturing log messages
   */
  private logger: LoggerService;
  
  /**
   * Mock config service for simulating configuration
   */
  private configService: ConfigService;
  
  /**
   * Initializes the MockTracingService with optional dependencies
   * @param configService Optional ConfigService mock
   * @param logger Optional LoggerService mock
   */
  constructor(
    configService?: ConfigService,
    logger?: LoggerService
  ) {
    this.configService = configService || {
      get: (key: string, defaultValue?: any) => defaultValue || 'mock-service'
    } as any;
    
    this.logger = logger || {
      log: (message: string) => {},
      error: (message: string, trace?: string) => {},
      warn: (message: string) => {},
      debug: (message: string) => {},
      verbose: (message: string) => {}
    };
  }
  /**
   * In-memory storage of all created spans for test inspection
   */
  public readonly spans: MockSpan[] = [];
  
  /**
   * In-memory storage of all recorded errors for test inspection
   */
  public readonly errors: Error[] = [];
  
  /**
   * Current active span for context propagation simulation
   */
  private currentSpan: MockSpan | null = null;
  
  /**
   * Current trace context for distributed tracing simulation
   */
  private currentTraceContext: MockTraceContext = {
    traceId: generateRandomId(),
    spanId: generateRandomId(),
    traceFlags: 1 // 1 = sampled
  };

  /**
   * Creates a mock span with the given name
   * @param name The name of the span to create
   * @param parentSpanId Optional parent span ID for nested spans
   * @returns A mock span object
   */
  private createMockSpan(name: string, parentSpanId?: string): MockSpan {
    // Create a new span ID for this span
    const spanId = generateRandomId();
    
    // Create a trace context for this span
    const traceContext: MockTraceContext = {
      traceId: this.currentTraceContext.traceId, // Keep the same trace ID for the trace
      spanId,
      traceFlags: this.currentTraceContext.traceFlags
    };
    
    const span: MockSpan = {
      name,
      status: { code: SpanStatusCode.UNSET },
      events: [],
      exceptions: [],
      attributes: {},
      startTime: Date.now(),
      traceContext,
      parentSpanId,
      isRecording: () => true,
      recordException: (error: Error) => {
        span.exceptions.push(error);
        this.errors.push(error);
        
        // Add error details to the span attributes
        span.attributes['error'] = true;
        span.attributes['error.type'] = error.constructor.name;
        span.attributes['error.message'] = error.message;
      },
      setStatus: (status: { code: SpanStatusCode }) => {
        span.status = status;
      },
      setAttribute: (key: string, value: string | number | boolean) => {
        span.attributes[key] = value;
      },
      addEvent: (name: string, attributes?: Record<string, any>) => {
        span.events.push({ name, attributes });
      },
      end: () => {
        span.endTime = Date.now();
      }
    };
    
    this.spans.push(span);
    return span;
  }

  /**
   * Creates and starts a new span for tracing a specific operation.
   * This method mimics the behavior of the real TracingService but stores spans in memory.
   * 
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @returns The result of the function execution
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    // Create a new span, using the current span's ID as the parent if available
    const span = this.createMockSpan(name, this.currentSpan?.traceContext.spanId);
    const previousSpan = this.currentSpan;
    const previousTraceContext = this.currentTraceContext;
    
    // Update the current span and trace context
    this.currentSpan = span;
    this.currentTraceContext = span.traceContext;
    
    try {
      // Add standard attributes to the span
      span.setAttribute('span.kind', 'internal');
      
      // Execute the provided function
      const result = await fn();
      
      // If the function completes successfully, set the span status to OK
      if (span.isRecording()) {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      
      return result;
    } catch (error) {
      // If the function throws an error, set the span status to ERROR and record the exception
      if (span.isRecording()) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        
        // Add an event for the error
        span.addEvent('exception', {
          'exception.type': error.constructor.name,
          'exception.message': error.message,
          'exception.stacktrace': error.stack
        });
      }
      
      throw error;
    } finally {
      // Always end the span regardless of success or failure
      span.end();
      
      // Restore the previous span and trace context
      this.currentSpan = previousSpan;
      this.currentTraceContext = previousTraceContext;
    }
  }

  /**
   * Retrieves all spans with the given name
   * @param name The name of spans to retrieve
   * @returns Array of spans matching the name
   */
  getSpansByName(name: string): MockSpan[] {
    return this.spans.filter(span => span.name === name);
  }

  /**
   * Retrieves all spans with error status
   * @returns Array of spans with error status
   */
  getErrorSpans(): MockSpan[] {
    return this.spans.filter(span => span.status.code === SpanStatusCode.ERROR);
  }

  /**
   * Retrieves all spans with successful status
   * @returns Array of spans with OK status
   */
  getSuccessSpans(): MockSpan[] {
    return this.spans.filter(span => span.status.code === SpanStatusCode.OK);
  }

  /**
   * Retrieves spans associated with a specific journey
   * @param journey The journey identifier (health, care, plan)
   * @returns Array of spans with the specified journey attribute
   */
  getJourneySpans(journey: 'health' | 'care' | 'plan'): MockSpan[] {
    return this.spans.filter(span => span.attributes['journey'] === journey);
  }

  /**
   * Retrieves spans that contain a specific error type
   * @param errorType The error constructor name to filter by
   * @returns Array of spans with the specified error type
   */
  getSpansByErrorType(errorType: string): MockSpan[] {
    return this.spans.filter(span => 
      span.attributes['error.type'] === errorType);
  }

  /**
   * Retrieves spans that are part of the same trace
   * @param traceId The trace ID to filter by
   * @returns Array of spans with the specified trace ID
   */
  getSpansByTraceId(traceId: string): MockSpan[] {
    return this.spans.filter(span => span.traceContext.traceId === traceId);
  }

  /**
   * Retrieves child spans of a specific parent span
   * @param parentSpanId The parent span ID to filter by
   * @returns Array of spans with the specified parent span ID
   */
  getChildSpans(parentSpanId: string): MockSpan[] {
    return this.spans.filter(span => span.parentSpanId === parentSpanId);
  }

  /**
   * Clears all recorded spans and errors
   * Useful for resetting the mock between tests
   */
  reset(): void {
    this.spans.length = 0;
    this.errors.length = 0;
    this.currentSpan = null;
    this.currentTraceContext = {
      traceId: generateRandomId(),
      spanId: generateRandomId(),
      traceFlags: 1
    };
  }

  /**
   * Adds a journey-specific attribute to the current span
   * @param journey The journey identifier (health, care, plan)
   * @param attributes Additional journey-specific attributes
   */
  addJourneyContext(journey: 'health' | 'care' | 'plan', attributes: Record<string, any> = {}): void {
    if (this.currentSpan) {
      this.currentSpan.setAttribute('journey', journey);
      this.currentSpan.setAttribute('journey.type', journey);
      
      Object.entries(attributes).forEach(([key, value]) => {
        this.currentSpan!.setAttribute(`journey.${journey}.${key}`, value.toString());
      });
    }
  }

  /**
   * Simulates creating a child span for a nested operation
   * @param name The name of the child span
   * @param fn The function to execute within the child span
   * @returns The result of the function execution
   */
  async createChildSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    // Simply delegate to createSpan as the parent-child relationship is handled internally
    return this.createSpan(`${this.currentSpan?.name || 'unknown'}.${name}`, fn);
  }
  
  /**
   * Simulates extracting trace context from an incoming request
   * @param headers Mock headers containing trace information
   * @returns The current MockTracingService instance for chaining
   */
  extractContextFromHeaders(headers: Record<string, string>): MockTracingService {
    if (headers['traceparent']) {
      // Parse the traceparent header (format: 00-traceId-spanId-flags)
      const parts = headers['traceparent'].split('-');
      if (parts.length === 4) {
        this.currentTraceContext = {
          traceId: parts[1],
          spanId: generateRandomId(), // Generate a new span ID for this service
          traceFlags: parseInt(parts[3], 16),
          isRemote: true
        };
      }
    }
    return this;
  }
  
  /**
   * Simulates injecting trace context into outgoing request headers
   * @returns Headers with trace context information
   */
  injectContextToHeaders(): Record<string, string> {
    const { traceId, spanId, traceFlags } = this.currentTraceContext;
    return {
      'traceparent': `00-${traceId}-${spanId}-0${traceFlags.toString(16)}`,
      'tracestate': 'austa=1'
    };
  }
  
  /**
   * Simulates an error scenario with proper span recording
   * @param name The name of the error span
   * @param errorType The error constructor to use
   * @param message The error message
   * @param journeyContext Optional journey context to add to the error span
   * @throws The created error
   */
  simulateError(
    name: string, 
    errorType: new (message: string) => Error, 
    message: string,
    journeyContext?: { journey: 'health' | 'care' | 'plan', attributes?: Record<string, any> }
  ): never {
    const span = this.createMockSpan(name, this.currentSpan?.traceContext.spanId);
    span.setAttribute('error', 'true');
    span.setAttribute('error.type', errorType.name);
    span.setAttribute('error.message', message);
    
    // Add journey context if provided
    if (journeyContext) {
      span.setAttribute('journey', journeyContext.journey);
      span.setAttribute('journey.type', journeyContext.journey);
      
      if (journeyContext.attributes) {
        Object.entries(journeyContext.attributes).forEach(([key, value]) => {
          span.setAttribute(`journey.${journeyContext.journey}.${key}`, value.toString());
        });
      }
    }
    
    const error = new errorType(message);
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();
    
    // Log the error using the logger
    this.logger.error(`Error in span ${name}: ${message}`, error.stack);
    
    throw error;
  }
  
  /**
   * Simulates a journey-specific error scenario
   * @param journey The journey where the error occurred
   * @param operation The operation name
   * @param errorType The error constructor to use
   * @param message The error message
   * @param attributes Additional journey-specific attributes
   * @throws The created error
   */
  simulateJourneyError(
    journey: 'health' | 'care' | 'plan',
    operation: string,
    errorType: new (message: string) => Error,
    message: string,
    attributes: Record<string, any> = {}
  ): never {
    return this.simulateError(
      `${journey}.${operation}`,
      errorType,
      message,
      { journey, attributes }
    );
  }
}
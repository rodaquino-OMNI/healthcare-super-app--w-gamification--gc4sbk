import { Context, Span, SpanContext, SpanKind, SpanOptions, SpanStatus, SpanStatusCode, Tracer, TracerOptions } from '@opentelemetry/api';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { KafkaMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { JourneyContextInfo, TraceContext } from '../../src/interfaces/trace-context.interface';
import { TracerProvider } from '../../src/interfaces/tracer-provider.interface';

/**
 * Interface for a mock span that extends the OpenTelemetry Span interface
 * with additional methods for testing and verification.
 */
export interface MockSpan extends Span {
  /**
   * Gets all attributes set on the span
   */
  getAttributes(): Record<string, any>;

  /**
   * Gets all events recorded on the span
   */
  getEvents(): Array<{ name: string; attributes?: Record<string, any>; timestamp?: number }>;

  /**
   * Gets the status set on the span
   */
  getStatus(): SpanStatus | undefined;

  /**
   * Gets the parent span ID if available
   */
  getParentSpanId(): string | undefined;

  /**
   * Checks if the span has ended
   */
  hasEnded(): boolean;

  /**
   * Gets the duration of the span in milliseconds (if ended)
   */
  getDurationMs(): number | undefined;
}

/**
 * Creates a mock span context with optional trace ID and span ID
 * 
 * @param traceId Optional trace ID (generated if not provided)
 * @param spanId Optional span ID (generated if not provided)
 * @param traceFlags Optional trace flags (defaults to 1 - sampled)
 * @returns A mock span context
 */
export function createMockSpanContext(
  traceId?: string,
  spanId?: string,
  traceFlags: number = 1
): SpanContext {
  return {
    traceId: traceId || generateTraceId(),
    spanId: spanId || generateSpanId(),
    traceFlags,
    isRemote: false,
  };
}

/**
 * Generates a random 32-character hex trace ID
 */
export function generateTraceId(): string {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').substring(0, 16);
}

/**
 * Generates a random 16-character hex span ID
 */
export function generateSpanId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 16);
}

/**
 * Creates a mock span for testing
 * 
 * @param name Span name
 * @param context Optional span context
 * @param kind Optional span kind
 * @param parentSpanId Optional parent span ID
 * @returns A mock span implementation
 */
export function createMockSpan(
  name: string,
  context?: SpanContext,
  kind: SpanKind = SpanKind.INTERNAL,
  parentSpanId?: string
): MockSpan {
  const spanContext = context || createMockSpanContext();
  const attributes: Record<string, any> = {};
  const events: Array<{ name: string; attributes?: Record<string, any>; timestamp?: number }> = [];
  let status: SpanStatus | undefined;
  let endTime: number | undefined;
  const startTime = Date.now();
  let isRecording = true;

  return {
    // Standard Span interface implementation
    setAttribute(key: string, value: any): MockSpan {
      if (isRecording) {
        attributes[key] = value;
      }
      return this;
    },

    setAttributes(attrs: Record<string, any>): MockSpan {
      if (isRecording) {
        Object.entries(attrs).forEach(([key, value]) => {
          attributes[key] = value;
        });
      }
      return this;
    },

    addEvent(name: string, attributesOrStartTime?: Record<string, any> | number, startTime?: number): MockSpan {
      if (isRecording) {
        if (typeof attributesOrStartTime === 'number') {
          events.push({ name, timestamp: attributesOrStartTime });
        } else {
          events.push({
            name,
            attributes: attributesOrStartTime,
            timestamp: startTime || Date.now(),
          });
        }
      }
      return this;
    },

    setStatus(status: SpanStatus): MockSpan {
      if (isRecording) {
        this.status = status;
      }
      return this;
    },

    updateName(name: string): MockSpan {
      // In a mock, we don't need to actually update the name
      return this;
    },

    end(endTime?: number): void {
      if (isRecording) {
        this.endTime = endTime || Date.now();
        isRecording = false;
      }
    },

    isRecording(): boolean {
      return isRecording;
    },

    recordException(exception: Error, time?: number): void {
      if (isRecording) {
        this.addEvent('exception', {
          'exception.type': exception.name,
          'exception.message': exception.message,
          'exception.stacktrace': exception.stack,
        }, time);
      }
    },

    spanContext(): SpanContext {
      return spanContext;
    },

    // Additional methods for testing
    getAttributes(): Record<string, any> {
      return { ...attributes };
    },

    getEvents(): Array<{ name: string; attributes?: Record<string, any>; timestamp?: number }> {
      return [...events];
    },

    getStatus(): SpanStatus | undefined {
      return status;
    },

    getParentSpanId(): string | undefined {
      return parentSpanId;
    },

    hasEnded(): boolean {
      return !isRecording;
    },

    getDurationMs(): number | undefined {
      if (endTime && startTime) {
        return endTime - startTime;
      }
      return undefined;
    },

    // Private properties for the mock implementation
    status,
    endTime,
  };
}

/**
 * Mock implementation of the TraceContext interface for testing
 */
export class MockTraceContext implements TraceContext {
  private context: Context;
  private spanContext?: SpanContext;
  private journeyContext?: JourneyContextInfo;
  private attributes: Record<string, any> = {};

  /**
   * Creates a new MockTraceContext instance
   * 
   * @param context Optional OpenTelemetry context
   * @param spanContext Optional span context
   * @param journeyContext Optional journey context information
   * @param attributes Optional attributes to add to the context
   */
  constructor(
    context?: Context,
    spanContext?: SpanContext,
    journeyContext?: JourneyContextInfo,
    attributes: Record<string, any> = {}
  ) {
    this.context = context || {} as Context;
    this.spanContext = spanContext;
    this.journeyContext = journeyContext;
    this.attributes = attributes;
  }

  getContext(): Context {
    return this.context;
  }

  getSpanContext(): SpanContext | undefined {
    return this.spanContext;
  }

  getTraceId(): string | undefined {
    return this.spanContext?.traceId;
  }

  getSpanId(): string | undefined {
    return this.spanContext?.spanId;
  }

  getTraceFlags(): number | undefined {
    return this.spanContext?.traceFlags;
  }

  isSampled(): boolean {
    return this.spanContext?.traceFlags ? (this.spanContext.traceFlags & 1) === 1 : false;
  }

  extractFromHttpHeaders(headers: IncomingHttpHeaders): TraceContext {
    // In a real implementation, this would extract trace context from headers
    // For the mock, we'll create a new context with a generated span context
    const traceId = headers['x-trace-id'] as string || generateTraceId();
    const spanId = headers['x-span-id'] as string || generateSpanId();
    const traceFlags = headers['x-trace-flags'] ? parseInt(headers['x-trace-flags'] as string, 10) : 1;
    
    const spanContext = createMockSpanContext(traceId, spanId, traceFlags);
    
    // Extract journey context if present
    let journeyContext: JourneyContextInfo | undefined;
    if (headers['x-journey-type'] && headers['x-journey-id']) {
      journeyContext = {
        journeyType: headers['x-journey-type'] as 'health' | 'care' | 'plan',
        journeyId: headers['x-journey-id'] as string,
        userId: headers['x-user-id'] as string,
        sessionId: headers['x-session-id'] as string,
        requestId: headers['x-request-id'] as string,
      };
    }
    
    return new MockTraceContext(this.context, spanContext, journeyContext);
  }

  injectIntoHttpHeaders(headers: OutgoingHttpHeaders): OutgoingHttpHeaders {
    if (!this.spanContext) {
      return headers;
    }
    
    const result = { ...headers };
    result['x-trace-id'] = this.spanContext.traceId;
    result['x-span-id'] = this.spanContext.spanId;
    result['x-trace-flags'] = this.spanContext.traceFlags.toString();
    
    // Add journey context if present
    if (this.journeyContext) {
      result['x-journey-type'] = this.journeyContext.journeyType;
      result['x-journey-id'] = this.journeyContext.journeyId;
      if (this.journeyContext.userId) {
        result['x-user-id'] = this.journeyContext.userId;
      }
      if (this.journeyContext.sessionId) {
        result['x-session-id'] = this.journeyContext.sessionId;
      }
      if (this.journeyContext.requestId) {
        result['x-request-id'] = this.journeyContext.requestId;
      }
    }
    
    return result;
  }

  extractFromKafkaMessage(message: KafkaMessage): TraceContext {
    // In a real implementation, this would extract trace context from Kafka headers
    // For the mock, we'll create a new context with a generated span context
    const headers = message.headers || {};
    
    const traceId = headers['x-trace-id']?.toString() || generateTraceId();
    const spanId = headers['x-span-id']?.toString() || generateSpanId();
    const traceFlags = headers['x-trace-flags'] ? parseInt(headers['x-trace-flags'].toString(), 10) : 1;
    
    const spanContext = createMockSpanContext(traceId, spanId, traceFlags);
    
    // Extract journey context if present
    let journeyContext: JourneyContextInfo | undefined;
    if (headers['x-journey-type'] && headers['x-journey-id']) {
      journeyContext = {
        journeyType: headers['x-journey-type'].toString() as 'health' | 'care' | 'plan',
        journeyId: headers['x-journey-id'].toString(),
        userId: headers['x-user-id']?.toString(),
        sessionId: headers['x-session-id']?.toString(),
        requestId: headers['x-request-id']?.toString(),
      };
    }
    
    return new MockTraceContext(this.context, spanContext, journeyContext);
  }

  injectIntoKafkaMessage(message: KafkaMessage): KafkaMessage {
    if (!this.spanContext) {
      return message;
    }
    
    const result = { ...message };
    const headers = result.headers || {};
    
    headers['x-trace-id'] = Buffer.from(this.spanContext.traceId);
    headers['x-span-id'] = Buffer.from(this.spanContext.spanId);
    headers['x-trace-flags'] = Buffer.from(this.spanContext.traceFlags.toString());
    
    // Add journey context if present
    if (this.journeyContext) {
      headers['x-journey-type'] = Buffer.from(this.journeyContext.journeyType);
      headers['x-journey-id'] = Buffer.from(this.journeyContext.journeyId);
      if (this.journeyContext.userId) {
        headers['x-user-id'] = Buffer.from(this.journeyContext.userId);
      }
      if (this.journeyContext.sessionId) {
        headers['x-session-id'] = Buffer.from(this.journeyContext.sessionId);
      }
      if (this.journeyContext.requestId) {
        headers['x-request-id'] = Buffer.from(this.journeyContext.requestId);
      }
    }
    
    result.headers = headers;
    return result;
  }

  serialize(): string {
    const data = {
      spanContext: this.spanContext,
      journeyContext: this.journeyContext,
      attributes: this.attributes,
    };
    return JSON.stringify(data);
  }

  deserialize(serialized: string): TraceContext {
    try {
      const data = JSON.parse(serialized);
      return new MockTraceContext(
        this.context,
        data.spanContext,
        data.journeyContext,
        data.attributes
      );
    } catch (error) {
      // Return a new context with generated values on error
      return new MockTraceContext(
        this.context,
        createMockSpanContext(),
        undefined,
        {}
      );
    }
  }

  withJourneyContext(journeyContext: JourneyContextInfo): TraceContext {
    return new MockTraceContext(
      this.context,
      this.spanContext,
      journeyContext,
      this.attributes
    );
  }

  getJourneyContext(): JourneyContextInfo | undefined {
    return this.journeyContext;
  }

  withHealthJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext {
    return this.withJourneyContext({
      journeyType: 'health',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  withCareJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext {
    return this.withJourneyContext({
      journeyType: 'care',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  withPlanJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext {
    return this.withJourneyContext({
      journeyType: 'plan',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  getCorrelationInfo() {
    return {
      traceId: this.getTraceId(),
      spanId: this.getSpanId(),
      traceFlags: this.getTraceFlags(),
      isSampled: this.isSampled(),
      journeyType: this.journeyContext?.journeyType,
      journeyId: this.journeyContext?.journeyId,
      userId: this.journeyContext?.userId,
      sessionId: this.journeyContext?.sessionId,
      requestId: this.journeyContext?.requestId,
    };
  }

  createLogContext(additionalContext?: Record<string, any>): Record<string, any> {
    const logContext: Record<string, any> = {
      trace_id: this.getTraceId(),
      span_id: this.getSpanId(),
      trace_flags: this.getTraceFlags(),
      sampled: this.isSampled(),
    };
    
    if (this.journeyContext) {
      logContext.journey_type = this.journeyContext.journeyType;
      logContext.journey_id = this.journeyContext.journeyId;
      if (this.journeyContext.userId) {
        logContext.user_id = this.journeyContext.userId;
      }
      if (this.journeyContext.sessionId) {
        logContext.session_id = this.journeyContext.sessionId;
      }
      if (this.journeyContext.requestId) {
        logContext.request_id = this.journeyContext.requestId;
      }
    }
    
    if (additionalContext) {
      Object.entries(additionalContext).forEach(([key, value]) => {
        logContext[key] = value;
      });
    }
    
    return logContext;
  }

  withAttributes(attributes: Record<string, any>): TraceContext {
    const mergedAttributes = { ...this.attributes, ...attributes };
    return new MockTraceContext(
      this.context,
      this.spanContext,
      this.journeyContext,
      mergedAttributes
    );
  }

  hasAttribute(key: string): boolean {
    return key in this.attributes;
  }

  getAttribute(key: string): any {
    return this.attributes[key];
  }
}

/**
 * Mock implementation of the Tracer interface for testing
 */
export class MockTracer implements Tracer {
  private spans: MockSpan[] = [];
  private name: string;
  private activeSpans: Map<string, MockSpan> = new Map();

  /**
   * Creates a new MockTracer instance
   * 
   * @param name The name of the tracer (typically service name)
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Starts a new span with the given name and options
   */
  startSpan(name: string, options?: SpanOptions): MockSpan {
    const parentSpanId = options?.parent ? 
      (typeof options.parent === 'object' && 'spanId' in options.parent ? 
        options.parent.spanId : undefined) : 
      undefined;
    
    const span = createMockSpan(
      name,
      options?.parent ? 
        (typeof options.parent === 'object' && 'traceId' in options.parent ? 
          options.parent : undefined) : 
        undefined,
      options?.kind || SpanKind.INTERNAL,
      parentSpanId
    );
    
    // Add attributes from options if provided
    if (options?.attributes) {
      span.setAttributes(options.attributes);
    }
    
    // Add default attributes
    span.setAttribute('service.name', this.name);
    span.setAttribute('span.name', name);
    
    // Store the span for later retrieval
    this.spans.push(span);
    this.activeSpans.set(span.spanContext().spanId, span);
    
    return span;
  }

  /**
   * Gets all spans created by this tracer
   */
  getSpans(): MockSpan[] {
    return [...this.spans];
  }

  /**
   * Gets all active (not ended) spans
   */
  getActiveSpans(): MockSpan[] {
    return Array.from(this.activeSpans.values());
  }

  /**
   * Gets a span by its ID
   */
  getSpanById(spanId: string): MockSpan | undefined {
    return this.spans.find(span => span.spanContext().spanId === spanId);
  }

  /**
   * Clears all spans from this tracer
   */
  clearSpans(): void {
    this.spans = [];
    this.activeSpans.clear();
  }

  /**
   * Gets the name of this tracer
   */
  getName(): string {
    return this.name;
  }
}

/**
 * Mock implementation of the TracerProvider interface for testing
 */
export class MockTracerProvider implements TracerProvider {
  private tracers: Map<string, MockTracer> = new Map();
  private currentContext: Context = {} as Context;
  private currentSpan?: MockSpan;

  /**
   * Gets a tracer with the specified name
   */
  getTracer(name: string, _options?: TracerOptions): Tracer {
    if (!this.tracers.has(name)) {
      this.tracers.set(name, new MockTracer(name));
    }
    return this.tracers.get(name)!;
  }

  /**
   * Starts a span with the given tracer, name, and options
   */
  startSpan(tracer: Tracer, name: string, options?: SpanOptions): Span {
    if (!(tracer instanceof MockTracer)) {
      throw new Error('Tracer must be a MockTracer instance');
    }
    return tracer.startSpan(name, options);
  }

  /**
   * Executes a function within the context of a span
   */
  async withSpan<T>(span: Span, fn: () => Promise<T>): Promise<T> {
    const previousSpan = this.currentSpan;
    this.currentSpan = span as MockSpan;
    
    try {
      const result = await fn();
      if (span.isRecording()) {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      return result;
    } catch (error) {
      if (span.isRecording()) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      throw error;
    } finally {
      this.currentSpan = previousSpan;
    }
  }

  /**
   * Gets the current active span
   */
  getCurrentSpan(): Span | undefined {
    return this.currentSpan;
  }

  /**
   * Sets the current span in the context
   */
  setSpan(span: Span): Context {
    this.currentSpan = span as MockSpan;
    return this.currentContext;
  }

  /**
   * Gets the current context
   */
  getContext(): Context {
    return this.currentContext;
  }

  /**
   * Executes a function within the given context
   */
  async withContext<T>(context: Context, fn: () => Promise<T>): Promise<T> {
    const previousContext = this.currentContext;
    this.currentContext = context;
    
    try {
      return await fn();
    } finally {
      this.currentContext = previousContext;
    }
  }

  /**
   * Gets all tracers created by this provider
   */
  getTracers(): Map<string, MockTracer> {
    return new Map(this.tracers);
  }

  /**
   * Gets a tracer by name
   */
  getTracerByName(name: string): MockTracer | undefined {
    return this.tracers.get(name);
  }

  /**
   * Gets all spans across all tracers
   */
  getAllSpans(): MockSpan[] {
    const spans: MockSpan[] = [];
    this.tracers.forEach(tracer => {
      spans.push(...tracer.getSpans());
    });
    return spans;
  }

  /**
   * Gets all active spans across all tracers
   */
  getAllActiveSpans(): MockSpan[] {
    const spans: MockSpan[] = [];
    this.tracers.forEach(tracer => {
      spans.push(...tracer.getActiveSpans());
    });
    return spans;
  }

  /**
   * Clears all spans from all tracers
   */
  clearAllSpans(): void {
    this.tracers.forEach(tracer => {
      tracer.clearSpans();
    });
  }

  /**
   * Creates a new trace context with the given span context
   */
  createTraceContext(spanContext?: SpanContext, journeyContext?: JourneyContextInfo): MockTraceContext {
    return new MockTraceContext(
      this.currentContext,
      spanContext || (this.currentSpan ? this.currentSpan.spanContext() : undefined),
      journeyContext
    );
  }
}

/**
 * Creates a mock tracing service for testing
 * 
 * @param serviceName Optional service name (defaults to 'test-service')
 * @returns A mock tracing service and provider for testing
 */
export function createMockTracingService(serviceName: string = 'test-service') {
  const provider = new MockTracerProvider();
  const tracer = provider.getTracer(serviceName) as MockTracer;
  
  return {
    /**
     * Creates and starts a new span for tracing a specific operation
     * 
     * @param name The name of the span to create
     * @param fn The function to execute within the span context
     * @returns The result of the function execution
     */
    async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const span = tracer.startSpan(name);
      return provider.withSpan(span, fn);
    },
    
    /**
     * Gets the mock tracer provider for testing and verification
     */
    getMockProvider(): MockTracerProvider {
      return provider;
    },
    
    /**
     * Gets the mock tracer for testing and verification
     */
    getMockTracer(): MockTracer {
      return tracer;
    },
    
    /**
     * Creates a trace context for the current span
     */
    createTraceContext(journeyContext?: JourneyContextInfo): MockTraceContext {
      const currentSpan = provider.getCurrentSpan() as MockSpan;
      return provider.createTraceContext(
        currentSpan ? currentSpan.spanContext() : undefined,
        journeyContext
      );
    },
    
    /**
     * Creates a trace context for a health journey
     */
    createHealthJourneyContext(journeyId: string, userId?: string, sessionId?: string, requestId?: string): MockTraceContext {
      const context = this.createTraceContext();
      return context.withHealthJourney(journeyId, userId, sessionId, requestId) as MockTraceContext;
    },
    
    /**
     * Creates a trace context for a care journey
     */
    createCareJourneyContext(journeyId: string, userId?: string, sessionId?: string, requestId?: string): MockTraceContext {
      const context = this.createTraceContext();
      return context.withCareJourney(journeyId, userId, sessionId, requestId) as MockTraceContext;
    },
    
    /**
     * Creates a trace context for a plan journey
     */
    createPlanJourneyContext(journeyId: string, userId?: string, sessionId?: string, requestId?: string): MockTraceContext {
      const context = this.createTraceContext();
      return context.withPlanJourney(journeyId, userId, sessionId, requestId) as MockTraceContext;
    },
    
    /**
     * Gets all spans created during testing
     */
    getAllSpans(): MockSpan[] {
      return provider.getAllSpans();
    },
    
    /**
     * Gets all active spans
     */
    getActiveSpans(): MockSpan[] {
      return provider.getAllActiveSpans();
    },
    
    /**
     * Clears all spans (useful between tests)
     */
    clearSpans(): void {
      provider.clearAllSpans();
    },
    
    /**
     * Finds spans by name
     */
    findSpansByName(name: string): MockSpan[] {
      return provider.getAllSpans().filter(span => 
        span.getAttributes()['span.name'] === name
      );
    },
    
    /**
     * Finds spans by attribute
     */
    findSpansByAttribute(key: string, value: any): MockSpan[] {
      return provider.getAllSpans().filter(span => 
        span.getAttributes()[key] === value
      );
    },
    
    /**
     * Finds spans by journey type
     */
    findSpansByJourneyType(journeyType: 'health' | 'care' | 'plan'): MockSpan[] {
      return provider.getAllSpans().filter(span => 
        span.getAttributes()['journey.type'] === journeyType
      );
    },
    
    /**
     * Finds spans by journey ID
     */
    findSpansByJourneyId(journeyId: string): MockSpan[] {
      return provider.getAllSpans().filter(span => 
        span.getAttributes()['journey.id'] === journeyId
      );
    },
    
    /**
     * Finds spans by user ID
     */
    findSpansByUserId(userId: string): MockSpan[] {
      return provider.getAllSpans().filter(span => 
        span.getAttributes()['user.id'] === userId
      );
    },
    
    /**
     * Finds spans with errors
     */
    findErrorSpans(): MockSpan[] {
      return provider.getAllSpans().filter(span => 
        span.getStatus()?.code === SpanStatusCode.ERROR
      );
    },
    
    /**
     * Gets the correlation info for the current span
     */
    getCorrelationInfo() {
      const context = this.createTraceContext();
      return context.getCorrelationInfo();
    },
  };
}

/**
 * Helper function to create a mock trace context for testing
 * 
 * @param options Configuration options for the mock trace context
 * @returns A mock trace context
 */
export function createMockTraceContext(options?: {
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
  journeyType?: 'health' | 'care' | 'plan';
  journeyId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  attributes?: Record<string, any>;
}): MockTraceContext {
  const spanContext = createMockSpanContext(
    options?.traceId,
    options?.spanId,
    options?.traceFlags
  );
  
  let journeyContext: JourneyContextInfo | undefined;
  if (options?.journeyType && options?.journeyId) {
    journeyContext = {
      journeyType: options.journeyType,
      journeyId: options.journeyId,
      userId: options.userId,
      sessionId: options.sessionId,
      requestId: options.requestId,
    };
  }
  
  return new MockTraceContext(
    {} as Context,
    spanContext,
    journeyContext,
    options?.attributes || {}
  );
}

/**
 * Creates HTTP headers with trace context for testing
 * 
 * @param options Configuration options for the trace context in headers
 * @returns HTTP headers with trace context
 */
export function createMockTraceHeaders(options?: {
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
  journeyType?: 'health' | 'care' | 'plan';
  journeyId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}): IncomingHttpHeaders {
  const headers: IncomingHttpHeaders = {};
  
  headers['x-trace-id'] = options?.traceId || generateTraceId();
  headers['x-span-id'] = options?.spanId || generateSpanId();
  headers['x-trace-flags'] = options?.traceFlags?.toString() || '1';
  
  if (options?.journeyType && options?.journeyId) {
    headers['x-journey-type'] = options.journeyType;
    headers['x-journey-id'] = options.journeyId;
    
    if (options.userId) {
      headers['x-user-id'] = options.userId;
    }
    
    if (options.sessionId) {
      headers['x-session-id'] = options.sessionId;
    }
    
    if (options.requestId) {
      headers['x-request-id'] = options.requestId;
    }
  }
  
  return headers;
}

/**
 * Creates a Kafka message with trace context for testing
 * 
 * @param options Configuration options for the trace context in the message
 * @param value Optional message value
 * @returns Kafka message with trace context
 */
export function createMockKafkaMessage(options?: {
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
  journeyType?: 'health' | 'care' | 'plan';
  journeyId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}, value?: Buffer | string | null): KafkaMessage {
  const headers: Record<string, Buffer> = {};
  
  headers['x-trace-id'] = Buffer.from(options?.traceId || generateTraceId());
  headers['x-span-id'] = Buffer.from(options?.spanId || generateSpanId());
  headers['x-trace-flags'] = Buffer.from(options?.traceFlags?.toString() || '1');
  
  if (options?.journeyType && options?.journeyId) {
    headers['x-journey-type'] = Buffer.from(options.journeyType);
    headers['x-journey-id'] = Buffer.from(options.journeyId);
    
    if (options.userId) {
      headers['x-user-id'] = Buffer.from(options.userId);
    }
    
    if (options.sessionId) {
      headers['x-session-id'] = Buffer.from(options.sessionId);
    }
    
    if (options.requestId) {
      headers['x-request-id'] = Buffer.from(options.requestId);
    }
  }
  
  return {
    key: null,
    value: typeof value === 'string' ? Buffer.from(value) : value,
    timestamp: new Date().getTime().toString(),
    size: 0,
    attributes: 0,
    offset: '0',
    headers,
  };
}
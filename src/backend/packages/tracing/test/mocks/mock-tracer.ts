import { 
  Context, 
  Span, 
  SpanContext, 
  SpanKind, 
  SpanOptions, 
  SpanStatus, 
  SpanStatusCode, 
  Tracer, 
  trace 
} from '@opentelemetry/api';
import { DEFAULT_SPAN_NAME } from '../../src/constants/defaults';

/**
 * Mock implementation of an OpenTelemetry Span for testing purposes.
 * This class simulates the behavior of a real span without requiring actual telemetry infrastructure.
 */
export class MockSpan implements Span {
  private _name: string;
  private _context: SpanContext;
  private _startTime: number;
  private _endTime?: number;
  private _attributes: Record<string, any> = {};
  private _events: Array<{ name: string; attributes?: Record<string, any>; timestamp: number }> = [];
  private _status: SpanStatus = { code: SpanStatusCode.UNSET };
  private _recording: boolean = true;
  private _parent?: SpanContext;
  private _kind: SpanKind;

  /**
   * Creates a new MockSpan instance.
   * 
   * @param name The name of the span
   * @param options Optional configuration for the span
   */
  constructor(name: string, options?: SpanOptions) {
    this._name = name || DEFAULT_SPAN_NAME;
    this._startTime = Date.now();
    this._kind = options?.kind || SpanKind.INTERNAL;
    this._parent = options?.parent ? this._extractSpanContext(options.parent) : undefined;
    
    // Generate a random trace ID and span ID for testing
    const traceId = this._generateRandomHexString(32);
    const spanId = this._generateRandomHexString(16);
    
    this._context = {
      traceId,
      spanId,
      traceFlags: 1, // Sampled
      isRemote: false,
    };

    // Add attributes from options
    if (options?.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        this.setAttribute(key, value);
      });
    }
  }

  /**
   * Extracts a SpanContext from a Context or SpanContext object.
   * 
   * @param contextOrSpan The Context or SpanContext to extract from
   * @returns The extracted SpanContext or undefined
   */
  private _extractSpanContext(contextOrSpan: Context | SpanContext): SpanContext | undefined {
    if ('traceId' in contextOrSpan && 'spanId' in contextOrSpan) {
      return contextOrSpan as SpanContext;
    }
    
    const spanContext = trace.getSpanContext(contextOrSpan as Context);
    return spanContext;
  }

  /**
   * Generates a random hexadecimal string of the specified length.
   * 
   * @param length The length of the string to generate
   * @returns A random hexadecimal string
   */
  private _generateRandomHexString(length: number): string {
    let result = '';
    const characters = '0123456789abcdef';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }

  /**
   * Gets the span context associated with this span.
   * 
   * @returns The span context
   */
  spanContext(): SpanContext {
    return this._context;
  }

  /**
   * Sets an attribute on the span.
   * 
   * @param key The attribute key
   * @param value The attribute value
   * @returns This span for chaining
   */
  setAttribute(key: string, value: any): this {
    if (this._recording) {
      this._attributes[key] = value;
    }
    return this;
  }

  /**
   * Sets multiple attributes on the span.
   * 
   * @param attributes The attributes to set
   * @returns This span for chaining
   */
  setAttributes(attributes: Record<string, any>): this {
    if (this._recording) {
      Object.entries(attributes).forEach(([key, value]) => {
        this.setAttribute(key, value);
      });
    }
    return this;
  }

  /**
   * Adds an event to the span.
   * 
   * @param name The name of the event
   * @param attributesOrStartTime Optional attributes or start time for the event
   * @param startTime Optional start time for the event
   * @returns This span for chaining
   */
  addEvent(name: string, attributesOrStartTime?: Record<string, any> | number, startTime?: number): this {
    if (!this._recording) {
      return this;
    }

    let attributes: Record<string, any> | undefined;
    let timestamp: number;

    if (typeof attributesOrStartTime === 'number') {
      timestamp = attributesOrStartTime;
    } else {
      attributes = attributesOrStartTime;
      timestamp = startTime || Date.now();
    }

    this._events.push({
      name,
      attributes,
      timestamp,
    });

    return this;
  }

  /**
   * Sets the status of the span.
   * 
   * @param status The status to set
   * @returns This span for chaining
   */
  setStatus(status: SpanStatus): this {
    if (this._recording) {
      this._status = status;
    }
    return this;
  }

  /**
   * Updates the span name.
   * 
   * @param name The new name for the span
   * @returns This span for chaining
   */
  updateName(name: string): this {
    if (this._recording) {
      this._name = name;
    }
    return this;
  }

  /**
   * Ends the span.
   * 
   * @param endTime Optional end time for the span
   */
  end(endTime?: number): void {
    if (this._recording) {
      this._endTime = endTime || Date.now();
      this._recording = false;
    }
  }

  /**
   * Checks if the span is recording.
   * 
   * @returns True if the span is recording, false otherwise
   */
  isRecording(): boolean {
    return this._recording;
  }

  /**
   * Records an exception as an event on the span.
   * 
   * @param exception The exception to record
   * @param time Optional time for the event
   * @returns This span for chaining
   */
  recordException(exception: Error, time?: number): this {
    if (!this._recording) {
      return this;
    }

    const attributes: Record<string, any> = {
      'exception.type': exception.name,
      'exception.message': exception.message,
    };

    if (exception.stack) {
      attributes['exception.stacktrace'] = exception.stack;
    }

    return this.addEvent('exception', attributes, time);
  }

  /**
   * Gets the name of the span.
   * 
   * @returns The span name
   */
  getName(): string {
    return this._name;
  }

  /**
   * Gets the attributes of the span.
   * 
   * @returns The span attributes
   */
  getAttributes(): Record<string, any> {
    return { ...this._attributes };
  }

  /**
   * Gets the events recorded on the span.
   * 
   * @returns The span events
   */
  getEvents(): Array<{ name: string; attributes?: Record<string, any>; timestamp: number }> {
    return [...this._events];
  }

  /**
   * Gets the status of the span.
   * 
   * @returns The span status
   */
  getStatus(): SpanStatus {
    return { ...this._status };
  }

  /**
   * Gets the parent span context.
   * 
   * @returns The parent span context or undefined
   */
  getParent(): SpanContext | undefined {
    return this._parent;
  }

  /**
   * Gets the kind of the span.
   * 
   * @returns The span kind
   */
  getKind(): SpanKind {
    return this._kind;
  }

  /**
   * Gets the start time of the span.
   * 
   * @returns The start time in milliseconds
   */
  getStartTime(): number {
    return this._startTime;
  }

  /**
   * Gets the end time of the span.
   * 
   * @returns The end time in milliseconds or undefined if the span is still active
   */
  getEndTime(): number | undefined {
    return this._endTime;
  }

  /**
   * Gets the duration of the span.
   * 
   * @returns The duration in milliseconds or undefined if the span is still active
   */
  getDuration(): number | undefined {
    if (!this._endTime) {
      return undefined;
    }
    return this._endTime - this._startTime;
  }
}

/**
 * Mock implementation of an OpenTelemetry Tracer for testing purposes.
 * This class simulates the behavior of a real tracer without requiring actual telemetry infrastructure.
 */
export class MockTracer implements Tracer {
  private _spans: MockSpan[] = [];
  private _currentSpan?: MockSpan;
  private _name: string;

  /**
   * Creates a new MockTracer instance.
   * 
   * @param name The name of the tracer
   */
  constructor(name: string = 'mock-tracer') {
    this._name = name;
  }

  /**
   * Starts a new span.
   * 
   * @param name The name of the span
   * @param options Optional configuration for the span
   * @returns The created span
   */
  startSpan(name: string, options?: SpanOptions): MockSpan {
    const span = new MockSpan(name, options);
    this._spans.push(span);
    this._currentSpan = span;
    return span;
  }

  /**
   * Gets the current active span.
   * 
   * @returns The current span or undefined if no span is active
   */
  getCurrentSpan(): MockSpan | undefined {
    return this._currentSpan;
  }

  /**
   * Gets all spans created by this tracer.
   * 
   * @returns Array of all spans
   */
  getSpans(): MockSpan[] {
    return [...this._spans];
  }

  /**
   * Gets spans by name.
   * 
   * @param name The name of the spans to get
   * @returns Array of spans with the specified name
   */
  getSpansByName(name: string): MockSpan[] {
    return this._spans.filter(span => span.getName() === name);
  }

  /**
   * Gets spans by attribute.
   * 
   * @param key The attribute key to filter by
   * @param value Optional attribute value to filter by
   * @returns Array of spans with the specified attribute
   */
  getSpansByAttribute(key: string, value?: any): MockSpan[] {
    return this._spans.filter(span => {
      const attributes = span.getAttributes();
      if (value === undefined) {
        return key in attributes;
      }
      return attributes[key] === value;
    });
  }

  /**
   * Gets spans by status.
   * 
   * @param statusCode The status code to filter by
   * @returns Array of spans with the specified status
   */
  getSpansByStatus(statusCode: SpanStatusCode): MockSpan[] {
    return this._spans.filter(span => span.getStatus().code === statusCode);
  }

  /**
   * Gets active spans (spans that are still recording).
   * 
   * @returns Array of active spans
   */
  getActiveSpans(): MockSpan[] {
    return this._spans.filter(span => span.isRecording());
  }

  /**
   * Gets completed spans (spans that are no longer recording).
   * 
   * @returns Array of completed spans
   */
  getCompletedSpans(): MockSpan[] {
    return this._spans.filter(span => !span.isRecording());
  }

  /**
   * Clears all spans from the tracer.
   */
  clearSpans(): void {
    this._spans = [];
    this._currentSpan = undefined;
  }

  /**
   * Gets the name of the tracer.
   * 
   * @returns The tracer name
   */
  getName(): string {
    return this._name;
  }
}

/**
 * Creates a new MockTracer instance.
 * 
 * @param name Optional name for the tracer
 * @returns A new MockTracer instance
 */
export function createMockTracer(name?: string): MockTracer {
  return new MockTracer(name);
}
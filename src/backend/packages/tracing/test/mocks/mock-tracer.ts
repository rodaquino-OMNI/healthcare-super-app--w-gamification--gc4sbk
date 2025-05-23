import { Context, Span, SpanContext, SpanKind, SpanOptions, Tracer, trace } from '@opentelemetry/api';

/**
 * MockSpan represents a span created by the MockTracer for testing purposes.
 * It implements the basic functionality of an OpenTelemetry Span.
 */
export class MockSpan implements Span {
  private _name: string;
  private _context: SpanContext;
  private _startTime: number;
  private _endTime: number | undefined;
  private _attributes: Record<string, unknown> = {};
  private _events: Array<{ name: string, attributes?: Record<string, unknown>, timestamp?: number }> = [];
  private _status: { code: number, message?: string } = { code: 0 };
  private _recording: boolean = true;

  constructor(name: string, spanContext?: SpanContext, kind?: SpanKind, parentSpanId?: string) {
    this._name = name;
    this._startTime = Date.now();
    
    // Create a mock span context if none is provided
    this._context = spanContext || {
      traceId: generateMockId(32),
      spanId: generateMockId(16),
      traceFlags: 1, // Sampled
      isRemote: false,
    };
  }

  // Required Span interface methods
  spanContext(): SpanContext {
    return this._context;
  }

  setAttribute(key: string, value: unknown): this {
    this._attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Record<string, unknown>): this {
    Object.assign(this._attributes, attributes);
    return this;
  }

  addEvent(name: string, attributesOrStartTime?: Record<string, unknown> | number, startTime?: number): this {
    if (typeof attributesOrStartTime === 'number') {
      this._events.push({ name, timestamp: attributesOrStartTime });
    } else {
      this._events.push({ 
        name, 
        attributes: attributesOrStartTime,
        timestamp: startTime || Date.now() 
      });
    }
    return this;
  }

  setStatus(code: number, message?: string): this {
    this._status = { code, message };
    return this;
  }

  updateName(name: string): this {
    this._name = name;
    return this;
  }

  end(endTime?: number): void {
    this._endTime = endTime || Date.now();
    this._recording = false;
  }

  isRecording(): boolean {
    return this._recording;
  }

  recordException(exception: Error, time?: number): void {
    this.addEvent('exception', {
      'exception.type': exception.name,
      'exception.message': exception.message,
      'exception.stacktrace': exception.stack,
    }, time);
  }

  // Additional methods for testing
  get name(): string {
    return this._name;
  }

  get attributes(): Record<string, unknown> {
    return { ...this._attributes };
  }

  get events(): Array<{ name: string, attributes?: Record<string, unknown>, timestamp?: number }> {
    return [...this._events];
  }

  get status(): { code: number, message?: string } {
    return { ...this._status };
  }

  get duration(): number | undefined {
    if (!this._endTime) return undefined;
    return this._endTime - this._startTime;
  }
}

/**
 * MockTracer implements the OpenTelemetry Tracer interface for testing purposes.
 * It provides functionality to create spans and track them for verification in tests.
 */
export class MockTracer implements Tracer {
  private _spans: MockSpan[] = [];
  private _currentSpan: MockSpan | undefined;
  private _instrumentationName: string;
  private _instrumentationVersion?: string;

  constructor(instrumentationName: string, instrumentationVersion?: string) {
    this._instrumentationName = instrumentationName;
    this._instrumentationVersion = instrumentationVersion;
  }

  /**
   * Creates and starts a new Span.
   * @param name The name of the span
   * @param options Options for creating the span
   * @param context The context to use for the span
   * @returns A new MockSpan instance
   */
  startSpan(name: string, options?: SpanOptions, context?: Context): MockSpan {
    const span = new MockSpan(name);
    this._spans.push(span);
    this._currentSpan = span;
    return span;
  }

  /**
   * Gets the currently active span from the context.
   * @param context The context to get the current span from
   * @returns The current span or undefined if none exists
   */
  getCurrentSpan(context?: Context): MockSpan | undefined {
    return this._currentSpan;
  }

  /**
   * Executes the given function within the context of a new span.
   * @param name The name of the span
   * @param fn The function to execute within the span
   * @param context The parent context
   * @returns The result of the function execution
   */
  startActiveSpan<T>(name: string, fn: (span: MockSpan) => T): T;
  startActiveSpan<T>(name: string, options: SpanOptions, fn: (span: MockSpan) => T): T;
  startActiveSpan<T>(name: string, optionsOrFn: SpanOptions | ((span: MockSpan) => T), fnOrUndefined?: (span: MockSpan) => T): T {
    const fn = typeof optionsOrFn === 'function' ? optionsOrFn : fnOrUndefined as (span: MockSpan) => T;
    const options = typeof optionsOrFn === 'function' ? {} : optionsOrFn;
    
    const span = this.startSpan(name, options);
    try {
      return fn(span);
    } finally {
      span.end();
    }
  }

  /**
   * Returns all spans created by this tracer.
   * Useful for assertions in tests.
   */
  getSpans(): MockSpan[] {
    return [...this._spans];
  }

  /**
   * Clears all spans tracked by this tracer.
   * Useful for resetting state between tests.
   */
  clearSpans(): void {
    this._spans = [];
    this._currentSpan = undefined;
  }

  /**
   * Returns the instrumentation name for this tracer.
   */
  get instrumentationName(): string {
    return this._instrumentationName;
  }

  /**
   * Returns the instrumentation version for this tracer.
   */
  get instrumentationVersion(): string | undefined {
    return this._instrumentationVersion;
  }
}

/**
 * Helper function to generate mock IDs for trace and span IDs.
 * @param length The length of the ID to generate
 * @returns A hexadecimal string of the specified length
 */
function generateMockId(length: number): string {
  let result = '';
  const characters = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Creates a mock tracer for testing purposes.
 * @param name The instrumentation name for the tracer
 * @param version Optional instrumentation version
 * @returns A new MockTracer instance
 */
export function createMockTracer(name: string = 'mock-tracer', version?: string): MockTracer {
  return new MockTracer(name, version);
}
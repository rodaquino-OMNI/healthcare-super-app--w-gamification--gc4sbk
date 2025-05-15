import {
  Tracer,
  Span,
  SpanOptions,
  SpanKind,
  SpanStatus,
  SpanStatusCode,
  Context,
  trace,
  ROOT_CONTEXT,
  SpanContext,
  TimeInput,
  AttributeValue,
  TraceFlags,
} from '@opentelemetry/api';

/**
 * MockSpan implements the OpenTelemetry Span interface for testing purposes.
 * It simulates the behavior of a real span without requiring actual telemetry infrastructure.
 */
export class MockSpan implements Span {
  private _name: string;
  private _startTime: number;
  private _endTime: number | undefined;
  private _attributes: Record<string, AttributeValue> = {};
  private _events: Array<{ name: string; attributes?: Record<string, AttributeValue>; timestamp: number }> = [];
  private _status: SpanStatus = { code: SpanStatusCode.UNSET };
  private _isRecording: boolean = true;
  private _kind: SpanKind;
  private _parentSpanId?: string;
  private _spanContext: SpanContext;

  /**
   * Creates a new MockSpan instance.
   * 
   * @param name The name of the span
   * @param options Optional span creation options
   * @param parentContext Optional parent context
   */
  constructor(name: string, options?: SpanOptions, parentContext?: Context) {
    this._name = name;
    this._startTime = Date.now();
    this._kind = options?.kind || SpanKind.INTERNAL;
    
    // Generate a random span ID and trace ID for testing purposes
    const spanId = Math.random().toString(16).substring(2, 18).padStart(16, '0');
    const traceId = Math.random().toString(16).substring(2, 34).padStart(32, '0');
    
    // If parent context exists, extract parent span ID and use the same trace ID
    if (parentContext) {
      const parentSpan = trace.getSpan(parentContext);
      if (parentSpan) {
        const parentSpanContext = parentSpan.spanContext();
        this._parentSpanId = parentSpanContext.spanId;
        this._spanContext = {
          traceId: parentSpanContext.traceId,
          spanId,
          traceFlags: parentSpanContext.traceFlags,
          isRemote: false,
          traceState: parentSpanContext.traceState,
        };
        return;
      }
    }
    
    // No parent context, create a new root span context
    this._spanContext = {
      traceId,
      spanId,
      traceFlags: TraceFlags.SAMPLED, // Sampled
      isRemote: false,
      traceState: undefined,
    };
  }

  // Span interface implementation
  spanContext(): SpanContext {
    return this._spanContext;
  }

  setAttribute(key: string, value: AttributeValue): this {
    if (this._isRecording) {
      this._attributes[key] = value;
    }
    return this;
  }

  setAttributes(attributes: Record<string, AttributeValue>): this {
    if (this._isRecording) {
      Object.entries(attributes).forEach(([key, value]) => {
        this._attributes[key] = value;
      });
    }
    return this;
  }

  addEvent(name: string, attributesOrStartTime?: Record<string, AttributeValue> | TimeInput, startTime?: TimeInput): this {
    if (this._isRecording) {
      if (typeof attributesOrStartTime === 'number' || attributesOrStartTime instanceof Date) {
        this._events.push({
          name,
          timestamp: typeof attributesOrStartTime === 'number' 
            ? attributesOrStartTime 
            : attributesOrStartTime.getTime(),
        });
      } else {
        this._events.push({
          name,
          attributes: attributesOrStartTime,
          timestamp: typeof startTime === 'number' 
            ? startTime 
            : startTime instanceof Date 
              ? startTime.getTime() 
              : Date.now(),
        });
      }
    }
    return this;
  }

  setStatus(status: SpanStatus): this {
    if (this._isRecording) {
      this._status = status;
    }
    return this;
  }

  updateName(name: string): this {
    if (this._isRecording) {
      this._name = name;
    }
    return this;
  }

  end(endTime?: TimeInput): void {
    if (this._isRecording) {
      this._endTime = typeof endTime === 'number' 
        ? endTime 
        : endTime instanceof Date 
          ? endTime.getTime() 
          : Date.now();
      this._isRecording = false;
    }
  }

  isRecording(): boolean {
    return this._isRecording;
  }

  recordException(exception: Error, time?: TimeInput): void {
    if (this._isRecording) {
      this.addEvent('exception', {
        'exception.type': exception.name,
        'exception.message': exception.message,
        'exception.stacktrace': exception.stack || '',
      }, time);
    }
  }

  // Additional methods for testing
  /**
   * Gets the name of the span.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets all attributes set on the span.
   */
  get attributes(): Record<string, AttributeValue> {
    return { ...this._attributes };
  }

  /**
   * Gets all events added to the span.
   */
  get events(): Array<{ name: string; attributes?: Record<string, AttributeValue>; timestamp: number }> {
    return [...this._events];
  }

  /**
   * Gets the current status of the span.
   */
  get status(): SpanStatus {
    return { ...this._status };
  }

  /**
   * Gets the start time of the span in milliseconds.
   */
  get startTime(): number {
    return this._startTime;
  }

  /**
   * Gets the end time of the span in milliseconds, if the span has ended.
   */
  get endTime(): number | undefined {
    return this._endTime;
  }

  /**
   * Gets the duration of the span in milliseconds, if the span has ended.
   */
  get duration(): number | undefined {
    if (this._endTime === undefined) {
      return undefined;
    }
    return this._endTime - this._startTime;
  }

  /**
   * Gets the kind of the span (e.g., SERVER, CLIENT, INTERNAL).
   */
  get kind(): SpanKind {
    return this._kind;
  }

  /**
   * Gets the ID of the parent span, if this span has a parent.
   */
  get parentSpanId(): string | undefined {
    return this._parentSpanId;
  }
}

/**
 * MockTracer implements the OpenTelemetry Tracer interface for testing purposes.
 * It simulates the behavior of a real tracer without requiring actual telemetry infrastructure.
 * 
 * Example usage:
 * ```typescript
 * // Create a mock tracer
 * const mockTracer = new MockTracer('test-tracer', '1.0.0');
 * 
 * // Create a span
 * const span = mockTracer.startSpan('test-span');
 * span.setAttribute('attribute.key', 'value');
 * span.end();
 * 
 * // Verify span creation in tests
 * expect(mockTracer.finishedSpans.length).toBe(1);
 * expect(mockTracer.finishedSpans[0].name).toBe('test-span');
 * expect(mockTracer.finishedSpans[0].attributes['attribute.key']).toBe('value');
 * ```
 */
export class MockTracer implements Tracer {
  private _spans: MockSpan[] = [];
  private _currentSpan: MockSpan | undefined;
  private _name: string;
  private _version?: string;

  /**
   * Creates a new MockTracer instance.
   * 
   * @param name The name of the tracer
   * @param version Optional version of the tracer
   */
  constructor(name: string, version?: string) {
    this._name = name;
    this._version = version;
  }

  // Tracer interface implementation
  startSpan(name: string, options?: SpanOptions, context: Context = ROOT_CONTEXT): MockSpan {
    const span = new MockSpan(name, options, context);
    this._spans.push(span);
    this._currentSpan = span;
    return span;
  }

  startActiveSpan<T>(name: string, fn: (span: MockSpan) => T): T;
  startActiveSpan<T>(name: string, options: SpanOptions, fn: (span: MockSpan) => T): T;
  startActiveSpan<T>(name: string, options: SpanOptions, context: Context, fn: (span: MockSpan) => T): T;
  startActiveSpan<T>(
    name: string,
    optionsOrFn: SpanOptions | ((span: MockSpan) => T),
    contextOrFn?: Context | ((span: MockSpan) => T),
    fn?: (span: MockSpan) => T
  ): T {
    // Handle the different overloads
    let options: SpanOptions | undefined;
    let context: Context = ROOT_CONTEXT;
    let callback: (span: MockSpan) => T;

    if (typeof optionsOrFn === 'function') {
      callback = optionsOrFn;
    } else {
      options = optionsOrFn;
      if (typeof contextOrFn === 'function') {
        callback = contextOrFn;
      } else if (contextOrFn) {
        context = contextOrFn;
        callback = fn!;
      } else {
        throw new Error('Invalid arguments for startActiveSpan');
      }
    }

    const span = this.startSpan(name, options, context);
    try {
      return callback(span);
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      throw error;
    } finally {
      span.end();
    }
  }

  // Additional methods for testing
  /**
   * Gets the name of the tracer.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the version of the tracer, if specified.
   */
  get version(): string | undefined {
    return this._version;
  }

  /**
   * Returns all spans created by this tracer, including active and finished spans.
   * Useful for verifying span creation in tests.
   */
  get spans(): MockSpan[] {
    return [...this._spans];
  }

  /**
   * Returns all finished spans created by this tracer.
   * Useful for verifying completed spans in tests.
   */
  get finishedSpans(): MockSpan[] {
    return this._spans.filter(span => !span.isRecording());
  }

  /**
   * Returns the current active span, if any.
   * Useful for verifying the current span in tests.
   */
  getCurrentSpan(): MockSpan | undefined {
    return this._currentSpan;
  }

  /**
   * Clears all spans created by this tracer.
   * Useful for resetting the tracer state between tests.
   */
  reset(): void {
    this._spans = [];
    this._currentSpan = undefined;
  }
  
  /**
   * Finds spans by name.
   * Useful for finding specific spans in tests.
   * 
   * @param name The name of the spans to find
   * @returns An array of spans with the specified name
   */
  findSpansByName(name: string): MockSpan[] {
    return this._spans.filter(span => span.name === name);
  }
  
  /**
   * Finds spans by attribute key and value.
   * Useful for finding spans with specific attributes in tests.
   * 
   * @param key The attribute key to search for
   * @param value The attribute value to match
   * @returns An array of spans with the specified attribute key and value
   */
  findSpansByAttribute(key: string, value: AttributeValue): MockSpan[] {
    return this._spans.filter(span => span.attributes[key] === value);
  }
}
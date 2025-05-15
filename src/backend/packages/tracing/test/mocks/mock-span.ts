import { Span, SpanContext, SpanKind, SpanStatus, TimeInput, Attributes, Link } from '@opentelemetry/api';

/**
 * MockSpan implements the OpenTelemetry Span interface for testing purposes.
 * It tracks all operations performed on the span for verification in tests.
 */
export class MockSpan implements Span {
  private _name: string;
  private _attributes: Record<string, unknown> = {};
  private _events: Array<{ name: string; attributes?: Attributes; timestamp?: TimeInput }> = [];
  private _links: Link[] = [];
  private _status: SpanStatus | undefined;
  private _endTime: number | undefined;
  private _isRecording: boolean = true;
  private _exceptions: Error[] = [];
  private readonly _startTime: number;
  private readonly _context: SpanContext;
  private readonly _kind: SpanKind;

  // Track operations for test verification
  readonly operations: Array<{
    name: string;
    args: unknown[];
    timestamp: number;
  }> = [];

  /**
   * Creates a new MockSpan instance.
   * 
   * @param name The name of the span
   * @param context The span context
   * @param kind The span kind
   */
  constructor(name: string, context: SpanContext, kind: SpanKind = SpanKind.INTERNAL) {
    this._name = name;
    this._context = context;
    this._kind = kind;
    this._startTime = Date.now();
  }

  /**
   * Records an operation performed on the span for test verification.
   * 
   * @param name The name of the operation
   * @param args The arguments passed to the operation
   */
  private recordOperation(name: string, args: unknown[]): void {
    this.operations.push({
      name,
      args,
      timestamp: Date.now(),
    });
  }

  /**
   * Sets a single attribute on the span.
   * 
   * @param key The attribute key
   * @param value The attribute value
   * @returns The span instance for chaining
   */
  setAttribute(key: string, value: unknown): this {
    this.recordOperation('setAttribute', [key, value]);
    if (this._isRecording) {
      this._attributes[key] = value;
    }
    return this;
  }

  /**
   * Sets multiple attributes on the span.
   * 
   * @param attributes The attributes to set
   * @returns The span instance for chaining
   */
  setAttributes(attributes: Attributes): this {
    this.recordOperation('setAttributes', [attributes]);
    if (this._isRecording) {
      Object.entries(attributes).forEach(([key, value]) => {
        this._attributes[key] = value;
      });
    }
    return this;
  }

  /**
   * Adds an event to the span.
   * 
   * @param name The name of the event
   * @param attributesOrStartTime Optional attributes or start time
   * @param startTime Optional start time
   * @returns The span instance for chaining
   */
  addEvent(name: string, attributesOrStartTime?: Attributes | TimeInput, startTime?: TimeInput): this {
    this.recordOperation('addEvent', [name, attributesOrStartTime, startTime]);
    if (this._isRecording) {
      let attributes: Attributes | undefined;
      let timestamp: TimeInput | undefined = startTime;

      if (typeof attributesOrStartTime === 'object' && attributesOrStartTime !== null && !Number.isNaN(Number(attributesOrStartTime))) {
        attributes = attributesOrStartTime as Attributes;
      } else if (attributesOrStartTime !== undefined) {
        timestamp = attributesOrStartTime as TimeInput;
      }

      this._events.push({
        name,
        attributes,
        timestamp: timestamp || Date.now(),
      });
    }
    return this;
  }

  /**
   * Sets the status of the span.
   * 
   * @param status The status to set
   * @returns The span instance for chaining
   */
  setStatus(status: SpanStatus): this {
    this.recordOperation('setStatus', [status]);
    if (this._isRecording) {
      this._status = status;
    }
    return this;
  }

  /**
   * Updates the name of the span.
   * 
   * @param name The new name
   * @returns The span instance for chaining
   */
  updateName(name: string): this {
    this.recordOperation('updateName', [name]);
    if (this._isRecording) {
      this._name = name;
    }
    return this;
  }

  /**
   * Ends the span.
   * 
   * @param endTime Optional end time
   */
  end(endTime?: TimeInput): void {
    this.recordOperation('end', [endTime]);
    if (this._isRecording) {
      this._endTime = endTime as number || Date.now();
      this._isRecording = false;
    }
  }

  /**
   * Returns whether the span is recording.
   * 
   * @returns True if the span is recording, false otherwise
   */
  isRecording(): boolean {
    this.recordOperation('isRecording', []);
    return this._isRecording;
  }

  /**
   * Records an exception as a span event.
   * 
   * @param exception The exception to record
   * @param time Optional time
   * @returns The span instance for chaining
   */
  recordException(exception: Error, time?: TimeInput): this {
    this.recordOperation('recordException', [exception, time]);
    if (this._isRecording) {
      this._exceptions.push(exception);
      this.addEvent(
        'exception',
        {
          'exception.type': exception.name,
          'exception.message': exception.message,
          'exception.stacktrace': exception.stack || '',
        },
        time
      );
    }
    return this;
  }

  /**
   * Returns the span context associated with this span.
   * 
   * @returns The span context
   */
  spanContext(): SpanContext {
    this.recordOperation('spanContext', []);
    return this._context;
  }

  /**
   * Adds a link to another span.
   * 
   * @param link The link to add
   * @returns The span instance for chaining
   */
  addLink(link: Link): this {
    this.recordOperation('addLink', [link]);
    if (this._isRecording) {
      this._links.push(link);
    }
    return this;
  }

  /**
   * Adds multiple links to other spans.
   * 
   * @param links The links to add
   * @returns The span instance for chaining
   */
  addLinks(links: Link[]): this {
    this.recordOperation('addLinks', [links]);
    if (this._isRecording) {
      this._links.push(...links);
    }
    return this;
  }

  /**
   * Gets the current attributes of the span.
   * Helper method for testing.
   * 
   * @returns The current attributes
   */
  getAttributes(): Record<string, unknown> {
    return { ...this._attributes };
  }

  /**
   * Gets the current events of the span.
   * Helper method for testing.
   * 
   * @returns The current events
   */
  getEvents(): Array<{ name: string; attributes?: Attributes; timestamp?: TimeInput }> {
    return [...this._events];
  }

  /**
   * Gets the current status of the span.
   * Helper method for testing.
   * 
   * @returns The current status
   */
  getStatus(): SpanStatus | undefined {
    return this._status;
  }

  /**
   * Gets the current name of the span.
   * Helper method for testing.
   * 
   * @returns The current name
   */
  getName(): string {
    return this._name;
  }

  /**
   * Gets the recorded exceptions.
   * Helper method for testing.
   * 
   * @returns The recorded exceptions
   */
  getExceptions(): Error[] {
    return [...this._exceptions];
  }

  /**
   * Gets the links added to the span.
   * Helper method for testing.
   * 
   * @returns The links
   */
  getLinks(): Link[] {
    return [...this._links];
  }

  /**
   * Gets the end time of the span.
   * Helper method for testing.
   * 
   * @returns The end time or undefined if the span is still active
   */
  getEndTime(): number | undefined {
    return this._endTime;
  }

  /**
   * Gets the start time of the span.
   * Helper method for testing.
   * 
   * @returns The start time
   */
  getStartTime(): number {
    return this._startTime;
  }

  /**
   * Gets the kind of the span.
   * Helper method for testing.
   * 
   * @returns The span kind
   */
  getKind(): SpanKind {
    return this._kind;
  }
}
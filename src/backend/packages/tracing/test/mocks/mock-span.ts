import {
  Span,
  SpanContext,
  SpanKind,
  SpanStatus,
  TimeInput,
  Link,
  SpanAttributes,
  SpanStatusCode,
  Context,
} from '@opentelemetry/api';

/**
 * MockSpan provides a test implementation of the OpenTelemetry Span interface.
 * It tracks all operations performed on the span for verification in tests.
 */
export class MockSpan implements Span {
  private _name: string;
  private _context: SpanContext;
  private _ended: boolean = false;
  private _recording: boolean = true;
  private _startTime: TimeInput;
  private _endTime: TimeInput | undefined;
  private _kind: SpanKind;
  private _status: SpanStatus = { code: SpanStatusCode.UNSET };
  
  // Operation tracking for test verification
  readonly events: Array<{ name: string; attributes?: SpanAttributes; timestamp?: TimeInput }> = [];
  readonly attributes: Record<string, unknown> = {};
  readonly links: Link[] = [];
  readonly exceptions: unknown[] = [];
  readonly statusUpdates: SpanStatus[] = [];
  readonly nameUpdates: string[] = [];

  constructor(name: string, options?: {
    spanContext?: SpanContext;
    kind?: SpanKind;
    startTime?: TimeInput;
    isRecording?: boolean;
  }) {
    this._name = name;
    this._kind = options?.kind ?? SpanKind.INTERNAL;
    this._startTime = options?.startTime ?? Date.now();
    this._recording = options?.isRecording ?? true;
    
    // Create a default span context if none provided
    this._context = options?.spanContext ?? {
      traceId: '1234567890abcdef1234567890abcdef',
      spanId: '1234567890abcdef',
      traceFlags: 1, // Sampled
      isRemote: false,
    };
  }

  // Required Span interface methods

  spanContext(): SpanContext {
    return this._context;
  }

  setAttribute(key: string, value: unknown): this {
    if (this.isRecording()) {
      this.attributes[key] = value;
    }
    return this;
  }

  setAttributes(attributes: SpanAttributes): this {
    if (this.isRecording()) {
      Object.entries(attributes).forEach(([key, value]) => {
        this.attributes[key] = value;
      });
    }
    return this;
  }

  addEvent(name: string, attributesOrTime?: SpanAttributes | TimeInput, timestamp?: TimeInput): this {
    if (this.isRecording()) {
      const attributes = typeof attributesOrTime === 'object' && !Number.isFinite(attributesOrTime as number)
        ? attributesOrTime as SpanAttributes
        : undefined;
      
      const eventTimestamp = typeof attributesOrTime === 'number' || typeof attributesOrTime === 'bigint'
        ? attributesOrTime
        : timestamp;

      this.events.push({
        name,
        attributes,
        timestamp: eventTimestamp,
      });
    }
    return this;
  }

  setStatus(status: SpanStatus): this {
    if (this.isRecording()) {
      this._status = status;
      this.statusUpdates.push(status);
    }
    return this;
  }

  updateName(name: string): this {
    if (this.isRecording()) {
      this._name = name;
      this.nameUpdates.push(name);
    }
    return this;
  }

  end(endTime?: TimeInput): void {
    if (!this._ended && this.isRecording()) {
      this._ended = true;
      this._endTime = endTime ?? Date.now();
    }
  }

  isRecording(): boolean {
    return this._recording && !this._ended;
  }

  recordException(exception: unknown, time?: TimeInput): void {
    if (this.isRecording()) {
      this.exceptions.push(exception);
      this.addEvent('exception', {
        'exception.type': exception instanceof Error ? exception.name : typeof exception,
        'exception.message': exception instanceof Error ? exception.message : String(exception),
        'exception.stacktrace': exception instanceof Error ? exception.stack || '' : '',
      }, time);
    }
  }

  addLink(link: Link): this {
    if (this.isRecording()) {
      this.links.push(link);
    }
    return this;
  }

  // Additional helper methods for testing

  /**
   * Gets the current name of the span
   */
  getName(): string {
    return this._name;
  }

  /**
   * Gets the current status of the span
   */
  getStatus(): SpanStatus {
    return this._status;
  }

  /**
   * Checks if the span has ended
   */
  hasEnded(): boolean {
    return this._ended;
  }

  /**
   * Gets the duration of the span in milliseconds
   * Returns undefined if the span hasn't ended
   */
  getDuration(): number | undefined {
    if (!this._endTime || !this._startTime) {
      return undefined;
    }
    
    const startTime = typeof this._startTime === 'number' ? this._startTime : Number(this._startTime);
    const endTime = typeof this._endTime === 'number' ? this._endTime : Number(this._endTime);
    
    return endTime - startTime;
  }

  /**
   * Sets whether the span is recording or not
   * This is useful for testing different scenarios
   */
  setRecording(recording: boolean): void {
    this._recording = recording;
  }

  /**
   * Checks if an attribute with the given key and value exists on the span
   */
  hasAttribute(key: string, value?: unknown): boolean {
    if (!(key in this.attributes)) {
      return false;
    }
    
    return value === undefined || this.attributes[key] === value;
  }

  /**
   * Checks if an event with the given name exists on the span
   */
  hasEvent(name: string): boolean {
    return this.events.some(event => event.name === name);
  }

  /**
   * Checks if an exception has been recorded on the span
   */
  hasRecordedException(): boolean {
    return this.exceptions.length > 0;
  }

  /**
   * Resets the span to its initial state
   * This is useful for reusing the same mock in multiple tests
   */
  reset(): void {
    this._ended = false;
    this._recording = true;
    this._status = { code: SpanStatusCode.UNSET };
    this._endTime = undefined;
    
    // Clear all tracking arrays
    this.events.length = 0;
    this.links.length = 0;
    this.exceptions.length = 0;
    this.statusUpdates.length = 0;
    this.nameUpdates.length = 0;
    
    // Clear attributes
    Object.keys(this.attributes).forEach(key => {
      delete this.attributes[key];
    });
  }
}
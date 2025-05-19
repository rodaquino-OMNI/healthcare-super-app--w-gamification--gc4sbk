import { TracingService } from '@austa/tracing';

/**
 * Mock implementation of TracingService for testing purposes.
 * Captures spans and trace context in memory for later inspection in tests.
 */
export class MockTracingService implements Partial<TracingService> {
  private spans: any[] = [];
  private traces: Map<string, any> = new Map();
  private currentSpanId = 0;

  constructor() {
    this.reset();
  }

  /**
   * Reset all captured spans and traces
   */
  reset(): void {
    this.spans = [];
    this.traces = new Map();
    this.currentSpanId = 0;
  }

  /**
   * Get all captured spans
   */
  getSpans(): any[] {
    return this.spans;
  }

  /**
   * Get a specific trace by ID
   */
  getTrace(traceId: string): any {
    return this.traces.get(traceId);
  }

  /**
   * Create a new span and track it
   */
  async createSpan<T>(name: string, fn: (span: any) => Promise<T>, options?: any): Promise<T> {
    const spanId = `span-${++this.currentSpanId}`;
    const traceId = options?.traceId || `trace-${Math.random().toString(36).substring(2, 15)}`;
    
    const span = {
      name,
      spanId,
      traceId,
      startTime: Date.now(),
      endTime: null,
      attributes: options?.attributes || {},
      events: [],
      status: 'OK',
      error: null
    };

    this.spans.push(span);
    this.traces.set(traceId, { id: traceId, spans: [span] });

    try {
      const result = await fn(span);
      span.endTime = Date.now();
      return result;
    } catch (error) {
      span.status = 'ERROR';
      span.error = error;
      span.attributes['error'] = true;
      span.attributes['error.type'] = error.type || 'unknown';
      span.attributes['error.code'] = error.code || 'UNKNOWN_ERROR';
      span.endTime = Date.now();
      throw error;
    }
  }

  /**
   * Record an error in the current span
   */
  recordError(error: Error, attributes?: Record<string, any>): void {
    const currentSpan = this.spans[this.spans.length - 1];
    if (currentSpan) {
      currentSpan.status = 'ERROR';
      currentSpan.error = error;
      currentSpan.attributes['error'] = true;
      currentSpan.attributes['error.type'] = error['type'] || 'unknown';
      currentSpan.attributes['error.code'] = error['code'] || 'UNKNOWN_ERROR';
      
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          currentSpan.attributes[key] = value;
        });
      }
    }
  }

  /**
   * Get the current trace context
   */
  getCurrentContext(): any {
    const currentSpan = this.spans[this.spans.length - 1];
    if (currentSpan) {
      return {
        traceId: currentSpan.traceId,
        spanId: currentSpan.spanId
      };
    }
    return null;
  }

  /**
   * Add attributes to the current span
   */
  addAttributes(attributes: Record<string, any>): void {
    const currentSpan = this.spans[this.spans.length - 1];
    if (currentSpan && attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        currentSpan.attributes[key] = value;
      });
    }
  }
}
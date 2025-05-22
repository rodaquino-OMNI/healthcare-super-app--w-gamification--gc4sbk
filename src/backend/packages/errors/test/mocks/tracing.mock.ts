/**
 * Mock implementation of the TracingService for testing error handling with distributed tracing.
 * This mock simulates span creation, context propagation, and error recording without requiring
 * actual tracing infrastructure.
 */
export class MockTracingService {
  // In-memory storage for recorded spans and errors
  private spans: MockSpan[] = [];
  private errors: MockTracingError[] = [];
  private currentTraceId: string = 'mock-trace-id';

  /**
   * Creates and starts a new mock span for tracing a specific operation.
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @returns The result of the function execution
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    // Create a new mock span with the given name
    const span = this.startSpan(name);
    
    try {
      // Execute the provided function (simulating context propagation)
      const result = await fn();
      
      // If the function completes successfully, set the span status to OK
      span.status = 'OK';
      span.endTime = Date.now();
      
      return result;
    } catch (error) {
      // If the function throws an error, record the exception and set status to ERROR
      span.status = 'ERROR';
      span.endTime = Date.now();
      
      // Record the error with the span for later inspection
      this.recordError(span.id, error);
      
      // Re-throw the error to maintain the same behavior as the real service
      throw error;
    }
  }

  /**
   * Starts a new mock span with the given name.
   * @param name The name of the span
   * @returns The created mock span
   */
  private startSpan(name: string): MockSpan {
    const span: MockSpan = {
      id: `span-${this.spans.length + 1}`,
      name,
      traceId: this.currentTraceId,
      startTime: Date.now(),
      endTime: null,
      status: 'UNSET',
      attributes: {},
    };
    
    this.spans.push(span);
    return span;
  }

  /**
   * Records an error associated with a specific span.
   * @param spanId The ID of the span where the error occurred
   * @param error The error that was thrown
   */
  private recordError(spanId: string, error: Error): void {
    const tracingError: MockTracingError = {
      spanId,
      traceId: this.currentTraceId,
      error,
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
    };
    
    this.errors.push(tracingError);
  }

  /**
   * Sets the current trace ID for simulating distributed tracing context.
   * @param traceId The trace ID to set
   */
  setTraceId(traceId: string): void {
    this.currentTraceId = traceId;
  }

  /**
   * Gets the current trace ID.
   * @returns The current trace ID
   */
  getTraceId(): string {
    return this.currentTraceId;
  }

  /**
   * Gets all recorded spans.
   * @returns Array of recorded spans
   */
  getRecordedSpans(): MockSpan[] {
    return [...this.spans];
  }

  /**
   * Gets all recorded errors.
   * @returns Array of recorded errors
   */
  getRecordedErrors(): MockTracingError[] {
    return [...this.errors];
  }

  /**
   * Gets spans by name.
   * @param name The name of the spans to retrieve
   * @returns Array of spans with the specified name
   */
  getSpansByName(name: string): MockSpan[] {
    return this.spans.filter(span => span.name === name);
  }

  /**
   * Gets errors by span name.
   * @param spanName The name of the span to retrieve errors for
   * @returns Array of errors that occurred in spans with the specified name
   */
  getErrorsBySpanName(spanName: string): MockTracingError[] {
    const spanIds = this.getSpansByName(spanName).map(span => span.id);
    return this.errors.filter(error => spanIds.includes(error.spanId));
  }

  /**
   * Clears all recorded spans and errors.
   */
  reset(): void {
    this.spans = [];
    this.errors = [];
    this.currentTraceId = 'mock-trace-id';
  }

  /**
   * Adds an attribute to the most recently created span.
   * @param key The attribute key
   * @param value The attribute value
   */
  addAttributeToCurrentSpan(key: string, value: string | number | boolean): void {
    if (this.spans.length > 0) {
      const currentSpan = this.spans[this.spans.length - 1];
      currentSpan.attributes[key] = value;
    }
  }

  /**
   * Simulates a journey-specific context for error tracing.
   * @param journeyType The type of journey (health, care, plan)
   * @param journeyId The ID of the specific journey instance
   */
  setJourneyContext(journeyType: 'health' | 'care' | 'plan', journeyId: string): void {
    this.addAttributeToCurrentSpan('journey.type', journeyType);
    this.addAttributeToCurrentSpan('journey.id', journeyId);
  }
}

/**
 * Interface representing a mock span for tracing.
 */
export interface MockSpan {
  id: string;
  name: string;
  traceId: string;
  startTime: number;
  endTime: number | null;
  status: 'UNSET' | 'OK' | 'ERROR';
  attributes: Record<string, string | number | boolean>;
}

/**
 * Interface representing a mock error recorded during tracing.
 */
export interface MockTracingError {
  spanId: string;
  traceId: string;
  error: Error;
  timestamp: number;
  message: string;
  stack?: string;
}
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
  InMemorySpanExporter,
  ReadableSpan,
} from '@opentelemetry/sdk-trace-base';
import { Span, SpanStatusCode, Context, trace, SpanKind } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

/**
 * TracingCollector provides an in-memory trace collector for e2e testing of OpenTelemetry instrumentation.
 * It intercepts spans and exposes methods to query and validate trace data.
 */
export class TracingCollector {
  private readonly exporter: InMemorySpanExporter;
  private readonly provider: BasicTracerProvider;
  private initialized = false;

  /**
   * Creates a new TracingCollector instance.
   * @param serviceName The name of the service being tested
   */
  constructor(private readonly serviceName: string = 'test-service') {
    this.exporter = new InMemorySpanExporter();
    this.provider = new BasicTracerProvider();
  }

  /**
   * Initializes the tracing collector and sets it as the global tracer provider.
   * This should be called before any test that needs to capture traces.
   */
  public init(): void {
    if (this.initialized) {
      return;
    }

    // Configure the provider with a SimpleSpanProcessor that uses the in-memory exporter
    this.provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter));
    
    // Register the W3C trace context propagator for distributed tracing
    trace.setGlobalPropagator(new W3CTraceContextPropagator());
    
    // Set the provider as the global tracer provider
    this.provider.register();
    
    this.initialized = true;
  }

  /**
   * Resets the collector by clearing all collected spans.
   * This should be called between tests to ensure a clean state.
   */
  public reset(): void {
    this.exporter.reset();
  }

  /**
   * Shuts down the collector and cleans up resources.
   * This should be called after all tests are complete.
   */
  public async shutdown(): Promise<void> {
    await this.provider.shutdown();
    this.initialized = false;
  }

  /**
   * Gets all spans that have been collected.
   * @returns An array of all collected spans
   */
  public getSpans(): ReadableSpan[] {
    return this.exporter.getFinishedSpans();
  }

  /**
   * Gets spans that match the specified name.
   * @param name The name of the spans to retrieve
   * @returns An array of spans with the specified name
   */
  public getSpansByName(name: string): ReadableSpan[] {
    return this.exporter.getFinishedSpans().filter(span => span.name === name);
  }

  /**
   * Gets spans that match the specified kind.
   * @param kind The kind of spans to retrieve
   * @returns An array of spans with the specified kind
   */
  public getSpansByKind(kind: SpanKind): ReadableSpan[] {
    return this.exporter.getFinishedSpans().filter(span => span.kind === kind);
  }

  /**
   * Gets spans that belong to the specified trace.
   * @param traceId The ID of the trace to retrieve spans for
   * @returns An array of spans that belong to the specified trace
   */
  public getSpansByTraceId(traceId: string): ReadableSpan[] {
    return this.exporter.getFinishedSpans().filter(span => span.spanContext().traceId === traceId);
  }

  /**
   * Gets the root spans (spans without a parent) from the collected spans.
   * @returns An array of root spans
   */
  public getRootSpans(): ReadableSpan[] {
    return this.exporter.getFinishedSpans().filter(span => !span.parentSpanId);
  }

  /**
   * Gets the child spans of the specified parent span.
   * @param parentSpanId The ID of the parent span
   * @returns An array of child spans
   */
  public getChildSpans(parentSpanId: string): ReadableSpan[] {
    return this.exporter.getFinishedSpans().filter(span => span.parentSpanId === parentSpanId);
  }

  /**
   * Gets spans that have the specified attribute.
   * @param key The attribute key to filter by
   * @param value The attribute value to filter by (optional)
   * @returns An array of spans with the specified attribute
   */
  public getSpansByAttribute(key: string, value?: unknown): ReadableSpan[] {
    return this.exporter.getFinishedSpans().filter(span => {
      const attrValue = span.attributes[key];
      return value !== undefined ? attrValue === value : attrValue !== undefined;
    });
  }

  /**
   * Gets spans that have an error status.
   * @returns An array of spans with an error status
   */
  public getErrorSpans(): ReadableSpan[] {
    return this.exporter.getFinishedSpans().filter(span => 
      span.status.code === SpanStatusCode.ERROR
    );
  }

  /**
   * Verifies that a trace contains the expected number of spans.
   * @param traceId The ID of the trace to verify
   * @param expectedCount The expected number of spans in the trace
   * @returns true if the trace contains the expected number of spans, false otherwise
   */
  public verifyTraceSpanCount(traceId: string, expectedCount: number): boolean {
    const spans = this.getSpansByTraceId(traceId);
    return spans.length === expectedCount;
  }

  /**
   * Verifies that a span has the expected attributes.
   * @param span The span to verify
   * @param expectedAttributes The expected attributes as key-value pairs
   * @returns true if the span has all the expected attributes, false otherwise
   */
  public verifySpanAttributes(span: ReadableSpan, expectedAttributes: Record<string, unknown>): boolean {
    for (const [key, value] of Object.entries(expectedAttributes)) {
      if (span.attributes[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Verifies that a span has the expected events.
   * @param span The span to verify
   * @param expectedEventNames The expected event names
   * @returns true if the span has all the expected events, false otherwise
   */
  public verifySpanEvents(span: ReadableSpan, expectedEventNames: string[]): boolean {
    const eventNames = span.events.map(event => event.name);
    return expectedEventNames.every(name => eventNames.includes(name));
  }

  /**
   * Verifies the parent-child relationship between spans.
   * @param parentSpan The expected parent span
   * @param childSpan The expected child span
   * @returns true if the child span is a child of the parent span, false otherwise
   */
  public verifyParentChildRelationship(parentSpan: ReadableSpan, childSpan: ReadableSpan): boolean {
    return childSpan.parentSpanId === parentSpan.spanContext().spanId;
  }

  /**
   * Finds a span by its name and attributes.
   * @param name The name of the span to find
   * @param attributes The attributes the span should have (optional)
   * @returns The first matching span, or undefined if no match is found
   */
  public findSpan(name: string, attributes?: Record<string, unknown>): ReadableSpan | undefined {
    const spans = this.getSpansByName(name);
    if (!attributes) {
      return spans[0];
    }
    
    return spans.find(span => this.verifySpanAttributes(span, attributes));
  }

  /**
   * Analyzes a trace to find the critical path (longest sequence of spans).
   * @param traceId The ID of the trace to analyze
   * @returns An array of spans representing the critical path
   */
  public analyzeCriticalPath(traceId: string): ReadableSpan[] {
    const spans = this.getSpansByTraceId(traceId);
    if (spans.length === 0) {
      return [];
    }

    // Sort spans by start time
    spans.sort((a, b) => a.startTime[0] - b.startTime[0] || a.startTime[1] - b.startTime[1]);

    // Find the root span
    const rootSpan = spans.find(span => !span.parentSpanId) || spans[0];
    
    // Build a map of parent-child relationships
    const childrenMap = new Map<string, ReadableSpan[]>();
    for (const span of spans) {
      if (span.parentSpanId) {
        const children = childrenMap.get(span.parentSpanId) || [];
        children.push(span);
        childrenMap.set(span.parentSpanId, children);
      }
    }

    // Find the longest path using DFS
    const findLongestPath = (span: ReadableSpan): ReadableSpan[] => {
      const children = childrenMap.get(span.spanContext().spanId) || [];
      if (children.length === 0) {
        return [span];
      }

      let longestPath: ReadableSpan[] = [span];
      for (const child of children) {
        const childPath = findLongestPath(child);
        if (childPath.length + 1 > longestPath.length) {
          longestPath = [span, ...childPath];
        }
      }

      return longestPath;
    };

    return findLongestPath(rootSpan);
  }

  /**
   * Calculates the total duration of a trace.
   * @param traceId The ID of the trace to calculate the duration for
   * @returns The duration of the trace in milliseconds, or 0 if the trace is not found
   */
  public calculateTraceDuration(traceId: string): number {
    const spans = this.getSpansByTraceId(traceId);
    if (spans.length === 0) {
      return 0;
    }

    let minStartTime = Number.MAX_SAFE_INTEGER;
    let maxEndTime = 0;

    for (const span of spans) {
      const startTimeNanos = span.startTime[0] * 1e9 + span.startTime[1];
      const endTimeNanos = span.endTime[0] * 1e9 + span.endTime[1];

      minStartTime = Math.min(minStartTime, startTimeNanos);
      maxEndTime = Math.max(maxEndTime, endTimeNanos);
    }

    return (maxEndTime - minStartTime) / 1e6; // Convert nanoseconds to milliseconds
  }

  /**
   * Creates a tracer for the specified name.
   * @param name The name of the tracer (defaults to the service name)
   * @returns A tracer instance
   */
  public getTracer(name: string = this.serviceName): any {
    return trace.getTracer(name);
  }

  /**
   * Extracts the current active span from the context.
   * @returns The current active span, or undefined if no span is active
   */
  public getCurrentSpan(): Span | undefined {
    return trace.getSpan(trace.getActiveSpan());
  }

  /**
   * Extracts the current active span context.
   * @returns The current active span context
   */
  public getCurrentContext(): Context {
    return trace.context();
  }
}

/**
 * Creates and initializes a new TracingCollector instance.
 * @param serviceName The name of the service being tested
 * @returns An initialized TracingCollector instance
 */
export function createTracingCollector(serviceName: string = 'test-service'): TracingCollector {
  const collector = new TracingCollector(serviceName);
  collector.init();
  return collector;
}
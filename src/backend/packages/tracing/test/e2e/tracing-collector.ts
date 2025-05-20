import { Context, SpanStatusCode, trace } from '@opentelemetry/api';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

/**
 * TracingCollector is a utility for capturing and analyzing OpenTelemetry traces during e2e tests.
 * It provides an in-memory trace collector that intercepts spans and exposes methods to query
 * and validate trace data. This component is crucial for verifying trace relationships,
 * span attributes, and context propagation in a multi-service environment.
 */
export class TracingCollector {
  private exporter: InMemorySpanExporter;
  private provider: NodeTracerProvider;
  private processor: SimpleSpanProcessor | BatchSpanProcessor;
  private isInitialized = false;

  /**
   * Creates a new TracingCollector instance.
   * @param useBatchProcessor Whether to use BatchSpanProcessor (true) or SimpleSpanProcessor (false)
   * @param serviceName The name of the service being tested
   */
  constructor(useBatchProcessor = false, private serviceName = 'test-service') {
    this.exporter = new InMemorySpanExporter();
    this.provider = new NodeTracerProvider();
    
    if (useBatchProcessor) {
      this.processor = new BatchSpanProcessor(this.exporter);
    } else {
      this.processor = new SimpleSpanProcessor(this.exporter);
    }
  }

  /**
   * Initializes the tracing collector and registers it as the global tracer provider.
   * This method must be called before any spans are created.
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.provider.addSpanProcessor(this.processor);
    this.provider.register();
    this.isInitialized = true;
  }

  /**
   * Shuts down the tracing collector and cleans up resources.
   * This should be called after tests are complete.
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    await this.provider.shutdown();
    this.isInitialized = false;
  }

  /**
   * Clears all collected spans from memory.
   */
  reset(): void {
    this.exporter.reset();
  }

  /**
   * Gets all spans that have been collected.
   * @returns Array of collected spans
   */
  getSpans(): ReadableSpan[] {
    return this.exporter.getFinishedSpans();
  }

  /**
   * Gets spans that match the specified trace ID.
   * @param traceId The trace ID to filter by
   * @returns Array of spans with the specified trace ID
   */
  getSpansByTraceId(traceId: string): ReadableSpan[] {
    return this.getSpans().filter(span => span.spanContext().traceId === traceId);
  }

  /**
   * Gets a span by its span ID.
   * @param spanId The span ID to find
   * @returns The span with the specified ID, or undefined if not found
   */
  getSpanById(spanId: string): ReadableSpan | undefined {
    return this.getSpans().find(span => span.spanContext().spanId === spanId);
  }

  /**
   * Gets spans that match the specified name.
   * @param name The span name to filter by
   * @returns Array of spans with the specified name
   */
  getSpansByName(name: string): ReadableSpan[] {
    return this.getSpans().filter(span => span.name === name);
  }

  /**
   * Gets spans that have a specific attribute with a specific value.
   * @param key The attribute key to filter by
   * @param value The attribute value to filter by
   * @returns Array of spans with the specified attribute value
   */
  getSpansByAttribute(key: string, value: any): ReadableSpan[] {
    return this.getSpans().filter(span => {
      const attrValue = span.attributes[key];
      return attrValue !== undefined && attrValue === value;
    });
  }

  /**
   * Gets the root spans (spans without a parent) for each trace.
   * @returns Array of root spans
   */
  getRootSpans(): ReadableSpan[] {
    return this.getSpans().filter(span => !span.parentSpanId);
  }

  /**
   * Gets all child spans of a specific parent span.
   * @param parentSpanId The ID of the parent span
   * @returns Array of child spans
   */
  getChildSpans(parentSpanId: string): ReadableSpan[] {
    return this.getSpans().filter(span => span.parentSpanId === parentSpanId);
  }

  /**
   * Verifies that a span has the expected attributes.
   * @param span The span to check
   * @param expectedAttributes Map of expected attribute key-value pairs
   * @returns True if the span has all expected attributes with matching values
   */
  verifySpanAttributes(span: ReadableSpan, expectedAttributes: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(expectedAttributes)) {
      if (span.attributes[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Verifies that a span has the expected status.
   * @param span The span to check
   * @param expectedStatus The expected status code
   * @param expectedMessage The expected status message (optional)
   * @returns True if the span has the expected status
   */
  verifySpanStatus(
    span: ReadableSpan, 
    expectedStatus: SpanStatusCode, 
    expectedMessage?: string
  ): boolean {
    const status = span.status;
    if (status.code !== expectedStatus) {
      return false;
    }
    if (expectedMessage !== undefined && status.message !== expectedMessage) {
      return false;
    }
    return true;
  }

  /**
   * Verifies that a trace has the expected structure of parent-child relationships.
   * @param traceId The trace ID to check
   * @param expectedHierarchy An object describing the expected hierarchy
   * @returns True if the trace matches the expected hierarchy
   */
  verifyTraceHierarchy(traceId: string, expectedHierarchy: TraceHierarchy): boolean {
    const spans = this.getSpansByTraceId(traceId);
    if (spans.length === 0) {
      return false;
    }

    // Find the root span
    const rootSpan = spans.find(span => !span.parentSpanId);
    if (!rootSpan) {
      return false;
    }

    return this.verifyHierarchyNode(rootSpan, expectedHierarchy, spans);
  }

  /**
   * Helper method to recursively verify a node in the trace hierarchy.
   * @param span The current span to check
   * @param expectedNode The expected node configuration
   * @param allSpans All spans in the trace
   * @returns True if the hierarchy matches the expected structure
   */
  private verifyHierarchyNode(
    span: ReadableSpan, 
    expectedNode: TraceHierarchy, 
    allSpans: ReadableSpan[]
  ): boolean {
    // Verify the span name matches
    if (expectedNode.name && span.name !== expectedNode.name) {
      return false;
    }

    // Verify attributes if specified
    if (expectedNode.attributes && 
        !this.verifySpanAttributes(span, expectedNode.attributes)) {
      return false;
    }

    // Verify status if specified
    if (expectedNode.status && 
        !this.verifySpanStatus(span, expectedNode.status.code, expectedNode.status.message)) {
      return false;
    }

    // If no children are expected, we're done
    if (!expectedNode.children || expectedNode.children.length === 0) {
      return true;
    }

    // Find all child spans of the current span
    const childSpans = allSpans.filter(s => s.parentSpanId === span.spanContext().spanId);
    
    // If the number of children doesn't match, fail
    if (childSpans.length !== expectedNode.children.length) {
      return false;
    }

    // Verify each child recursively
    for (const expectedChild of expectedNode.children) {
      // Find a matching child span
      const matchingChild = childSpans.find(childSpan => 
        !expectedChild.name || childSpan.name === expectedChild.name
      );

      if (!matchingChild) {
        return false;
      }

      // Verify the child hierarchy
      if (!this.verifyHierarchyNode(matchingChild, expectedChild, allSpans)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verifies that context propagation is working correctly between spans.
   * @param parentSpanId The ID of the parent span
   * @param childSpanId The ID of the child span
   * @returns True if context was properly propagated
   */
  verifyContextPropagation(parentSpanId: string, childSpanId: string): boolean {
    const parentSpan = this.getSpanById(parentSpanId);
    const childSpan = this.getSpanById(childSpanId);

    if (!parentSpan || !childSpan) {
      return false;
    }

    // Verify trace ID is the same
    if (parentSpan.spanContext().traceId !== childSpan.spanContext().traceId) {
      return false;
    }

    // Verify parent-child relationship
    if (childSpan.parentSpanId !== parentSpan.spanContext().spanId) {
      return false;
    }

    return true;
  }

  /**
   * Creates a test span for use in tests.
   * @param name The name of the span
   * @param attributes Optional attributes to add to the span
   * @param parentContext Optional parent context
   * @returns The created span's context
   */
  createTestSpan(
    name: string, 
    attributes?: Record<string, any>, 
    parentContext?: Context
  ): Context {
    const tracer = trace.getTracer(this.serviceName);
    const ctx = parentContext || trace.context();
    const span = tracer.startSpan(name, {}, ctx);

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, value);
      }
    }

    span.end();
    return trace.setSpan(ctx, span);
  }

  /**
   * Waits for spans to be exported and available for querying.
   * This is useful when using BatchSpanProcessor which may delay exporting.
   * @param timeoutMs Maximum time to wait in milliseconds
   * @param expectedCount Optional number of spans to wait for
   * @returns Promise that resolves when spans are available or timeout is reached
   */
  async waitForSpans(timeoutMs = 1000, expectedCount?: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (expectedCount !== undefined) {
        if (this.getSpans().length >= expectedCount) {
          return;
        }
      } else if (this.getSpans().length > 0) {
        return;
      }
      
      // Wait a short time before checking again
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

/**
 * Interface describing the expected hierarchy of a trace.
 */
export interface TraceHierarchy {
  /** Expected span name (optional) */
  name?: string;
  /** Expected span attributes (optional) */
  attributes?: Record<string, any>;
  /** Expected span status (optional) */
  status?: {
    code: SpanStatusCode;
    message?: string;
  };
  /** Expected child spans (optional) */
  children?: TraceHierarchy[];
}
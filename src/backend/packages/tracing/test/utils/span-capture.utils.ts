import {
  Span,
  SpanKind,
  SpanStatusCode,
  context,
  trace,
  SpanContext,
  SpanStatus,
  Attributes,
} from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  ReadableSpan,
  BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * SpanCaptureManager provides utilities for capturing and analyzing spans during tests.
 * It sets up an in-memory span exporter and processor to capture spans without requiring
 * an actual OpenTelemetry backend.
 */
export class SpanCaptureManager {
  private exporter: InMemorySpanExporter;
  private provider: NodeTracerProvider;
  private processor: SimpleSpanProcessor;
  private originalProvider: NodeTracerProvider | undefined;
  private serviceName: string;

  /**
   * Creates a new SpanCaptureManager instance.
   * @param serviceName The name of the service to use for the tracer provider
   */
  constructor(serviceName: string = 'test-service') {
    this.serviceName = serviceName;
    this.exporter = new InMemorySpanExporter();
    this.provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
      }),
    });
    this.processor = new SimpleSpanProcessor(this.exporter);
    this.provider.addSpanProcessor(this.processor);
  }

  /**
   * Initializes the span capture manager by registering the tracer provider.
   * This should be called before any spans are created that need to be captured.
   */
  init(): void {
    // Store the original global provider if it exists
    try {
      this.originalProvider = trace.getTracerProvider() as NodeTracerProvider;
    } catch (e) {
      this.originalProvider = undefined;
    }
    
    // Register our provider as the global provider
    this.provider.register();
  }

  /**
   * Resets the span capture manager by clearing all captured spans.
   */
  reset(): void {
    this.exporter.reset();
  }

  /**
   * Restores the original tracer provider and cleans up resources.
   * This should be called after tests are complete.
   */
  cleanup(): void {
    // Restore the original provider if it exists
    if (this.originalProvider) {
      this.originalProvider.register();
    }
    
    // Shutdown our provider and processor
    this.provider.shutdown();
  }

  /**
   * Gets all captured spans.
   * @returns An array of all captured spans
   */
  getSpans(): ReadableSpan[] {
    return this.exporter.getFinishedSpans();
  }

  /**
   * Finds spans by name.
   * @param name The name of the spans to find
   * @returns An array of spans with the specified name
   */
  findSpansByName(name: string): ReadableSpan[] {
    return this.getSpans().filter((span) => span.name === name);
  }

  /**
   * Finds spans by kind.
   * @param kind The kind of spans to find
   * @returns An array of spans with the specified kind
   */
  findSpansByKind(kind: SpanKind): ReadableSpan[] {
    return this.getSpans().filter((span) => span.kind === kind);
  }

  /**
   * Finds spans by attribute key and optional value.
   * @param key The attribute key to search for
   * @param value Optional attribute value to match
   * @returns An array of spans with the specified attribute
   */
  findSpansByAttribute(key: string, value?: unknown): ReadableSpan[] {
    return this.getSpans().filter((span) => {
      const attrValue = span.attributes[key];
      return value !== undefined ? attrValue === value : attrValue !== undefined;
    });
  }

  /**
   * Finds spans by status code.
   * @param statusCode The status code to search for
   * @returns An array of spans with the specified status code
   */
  findSpansByStatus(statusCode: SpanStatusCode): ReadableSpan[] {
    return this.getSpans().filter((span) => span.status.code === statusCode);
  }

  /**
   * Gets the root spans (spans without a parent).
   * @returns An array of root spans
   */
  getRootSpans(): ReadableSpan[] {
    return this.getSpans().filter((span) => {
      return !span.parentSpanId;
    });
  }

  /**
   * Gets the child spans of a specific parent span.
   * @param parentSpan The parent span
   * @returns An array of child spans
   */
  getChildSpans(parentSpan: ReadableSpan): ReadableSpan[] {
    return this.getSpans().filter((span) => {
      return span.parentSpanId === parentSpan.spanContext().spanId;
    });
  }

  /**
   * Builds a span tree from the captured spans.
   * @returns A tree structure representing the span hierarchy
   */
  buildSpanTree(): SpanTree {
    const rootSpans = this.getRootSpans();
    const tree: SpanTree = {
      roots: [],
    };

    for (const rootSpan of rootSpans) {
      tree.roots.push(this.buildSpanNode(rootSpan));
    }

    return tree;
  }

  /**
   * Recursively builds a span node for the span tree.
   * @param span The span to build a node for
   * @returns A span node with its children
   * @private
   */
  private buildSpanNode(span: ReadableSpan): SpanNode {
    const children = this.getChildSpans(span);
    const node: SpanNode = {
      span,
      children: [],
    };

    for (const child of children) {
      node.children.push(this.buildSpanNode(child));
    }

    return node;
  }

  /**
   * Analyzes the timing of spans to identify performance issues.
   * @returns Timing analysis results
   */
  analyzeSpanTiming(): TimingAnalysisResult {
    const spans = this.getSpans();
    const result: TimingAnalysisResult = {
      totalDuration: 0,
      spanCount: spans.length,
      averageDuration: 0,
      maxDuration: 0,
      minDuration: Number.MAX_SAFE_INTEGER,
      spansByDuration: [],
    };

    if (spans.length === 0) {
      result.minDuration = 0;
      return result;
    }

    for (const span of spans) {
      const duration = calculateSpanDuration(span);
      result.totalDuration += duration;
      result.maxDuration = Math.max(result.maxDuration, duration);
      result.minDuration = Math.min(result.minDuration, duration);
      result.spansByDuration.push({ span, duration });
    }

    result.averageDuration = result.totalDuration / spans.length;
    result.spansByDuration.sort((a, b) => b.duration - a.duration);

    return result;
  }

  /**
   * Verifies that a span with the given name exists and has the expected attributes.
   * @param name The name of the span to verify
   * @param expectedAttributes The expected attributes of the span
   * @returns The verified span or undefined if not found
   */
  verifySpan(name: string, expectedAttributes?: Record<string, unknown>): ReadableSpan | undefined {
    const spans = this.findSpansByName(name);
    if (spans.length === 0) {
      return undefined;
    }

    if (!expectedAttributes) {
      return spans[0];
    }

    for (const span of spans) {
      let match = true;
      for (const [key, value] of Object.entries(expectedAttributes)) {
        if (span.attributes[key] !== value) {
          match = false;
          break;
        }
      }
      if (match) {
        return span;
      }
    }

    return undefined;
  }

  /**
   * Creates a tracer with the specified name.
   * @param name The name of the tracer
   * @returns A tracer instance
   */
  getTracer(name: string = 'test-tracer') {
    return this.provider.getTracer(name);
  }

  /**
   * Verifies the journey-specific spans for health journey.
   * @param journeyId The ID of the health journey
   * @returns An object containing verification results
   */
  verifyHealthJourneySpans(journeyId: string): JourneySpanVerificationResult {
    return this.verifyJourneySpans('health', journeyId);
  }

  /**
   * Verifies the journey-specific spans for care journey.
   * @param journeyId The ID of the care journey
   * @returns An object containing verification results
   */
  verifyCareJourneySpans(journeyId: string): JourneySpanVerificationResult {
    return this.verifyJourneySpans('care', journeyId);
  }

  /**
   * Verifies the journey-specific spans for plan journey.
   * @param journeyId The ID of the plan journey
   * @returns An object containing verification results
   */
  verifyPlanJourneySpans(journeyId: string): JourneySpanVerificationResult {
    return this.verifyJourneySpans('plan', journeyId);
  }

  /**
   * Verifies spans for a specific journey type.
   * @param journeyType The type of journey ('health', 'care', or 'plan')
   * @param journeyId The ID of the journey
   * @returns An object containing verification results
   * @private
   */
  private verifyJourneySpans(journeyType: 'health' | 'care' | 'plan', journeyId: string): JourneySpanVerificationResult {
    const journeySpans = this.findSpansByAttribute('journey.type', journeyType);
    const journeyIdSpans = journeySpans.filter(span => span.attributes['journey.id'] === journeyId);
    
    const result: JourneySpanVerificationResult = {
      journeyType,
      journeyId,
      valid: journeyIdSpans.length > 0,
      spanCount: journeyIdSpans.length,
      spans: journeyIdSpans,
      errors: [],
    };

    // Check for required attributes on journey spans
    for (const span of journeyIdSpans) {
      const missingAttributes = [];
      const requiredAttributes = ['journey.type', 'journey.id', 'journey.operation'];
      
      for (const attr of requiredAttributes) {
        if (span.attributes[attr] === undefined) {
          missingAttributes.push(attr);
        }
      }
      
      if (missingAttributes.length > 0) {
        result.errors.push({
          span,
          message: `Missing required journey attributes: ${missingAttributes.join(', ')}`,
        });
        result.valid = false;
      }
    }

    return result;
  }
}

/**
 * Calculates the duration of a span in milliseconds.
 * @param span The span to calculate the duration for
 * @returns The duration in milliseconds
 */
export function calculateSpanDuration(span: ReadableSpan): number {
  const startTime = span.startTime;
  const endTime = span.endTime;
  const durationNanos = endTime[0] * 1e9 + endTime[1] - (startTime[0] * 1e9 + startTime[1]);
  return durationNanos / 1e6; // Convert to milliseconds
}

/**
 * Interface representing a span tree structure.
 */
export interface SpanTree {
  roots: SpanNode[];
}

/**
 * Interface representing a node in the span tree.
 */
export interface SpanNode {
  span: ReadableSpan;
  children: SpanNode[];
}

/**
 * Interface representing the result of timing analysis.
 */
export interface TimingAnalysisResult {
  totalDuration: number;
  spanCount: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  spansByDuration: { span: ReadableSpan; duration: number }[];
}

/**
 * Interface representing the result of journey span verification.
 */
export interface JourneySpanVerificationResult {
  journeyType: 'health' | 'care' | 'plan';
  journeyId: string;
  valid: boolean;
  spanCount: number;
  spans: ReadableSpan[];
  errors: { span: ReadableSpan; message: string }[];
}

/**
 * Creates a span capture manager for testing.
 * @param serviceName The name of the service to use for the tracer provider
 * @returns A configured SpanCaptureManager instance
 */
export function createSpanCaptureManager(serviceName: string = 'test-service'): SpanCaptureManager {
  const manager = new SpanCaptureManager(serviceName);
  manager.init();
  return manager;
}

/**
 * Helper function to create a test span with the specified attributes.
 * @param tracer The tracer to use for creating the span
 * @param name The name of the span
 * @param attributes The attributes to set on the span
 * @param kind The kind of span to create
 * @returns The created span
 */
export function createTestSpan(
  tracer: ReturnType<NodeTracerProvider['getTracer']>,
  name: string,
  attributes: Record<string, unknown> = {},
  kind: SpanKind = SpanKind.INTERNAL
): Span {
  return tracer.startSpan(name, { attributes, kind });
}

/**
 * Helper function to create a journey-specific test span.
 * @param tracer The tracer to use for creating the span
 * @param journeyType The type of journey ('health', 'care', or 'plan')
 * @param journeyId The ID of the journey
 * @param operation The operation being performed in the journey
 * @param additionalAttributes Additional attributes to set on the span
 * @returns The created span
 */
export function createJourneyTestSpan(
  tracer: ReturnType<NodeTracerProvider['getTracer']>,
  journeyType: 'health' | 'care' | 'plan',
  journeyId: string,
  operation: string,
  additionalAttributes: Record<string, unknown> = {}
): Span {
  const attributes = {
    'journey.type': journeyType,
    'journey.id': journeyId,
    'journey.operation': operation,
    ...additionalAttributes,
  };
  
  return createTestSpan(tracer, `${journeyType}.${operation}`, attributes);
}
/**
 * Utilities for capturing and inspecting spans during tests.
 * 
 * This module provides tools for capturing spans in memory during tests,
 * analyzing their structure, attributes, and relationships, and verifying
 * timing characteristics for performance testing.
 */

import {
  BasicTracerProvider,
  BatchSpanProcessor,
  InMemorySpanExporter,
  ReadableSpan,
  SimpleSpanProcessor,
  SpanProcessor
} from '@opentelemetry/sdk-trace-base';
import {
  Context,
  Span,
  SpanKind,
  SpanOptions,
  SpanStatus,
  SpanStatusCode,
  Tracer,
  trace
} from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Options for configuring the SpanCapturer
 */
export interface SpanCapturerOptions {
  /** 
   * The service name to use for the tracer provider 
   * @default 'test-service'
   */
  serviceName?: string;
  
  /** 
   * Whether to use batch processing instead of simple processing 
   * @default false
   */
  useBatchProcessor?: boolean;
  
  /** 
   * Maximum batch size when using batch processor 
   * @default 512
   */
  maxBatchSize?: number;
  
  /** 
   * Export batch timeout in milliseconds when using batch processor 
   * @default 5000
   */
  exportTimeoutMillis?: number;
  
  /** 
   * Schedule delay in milliseconds when using batch processor 
   * @default 1000
   */
  scheduleDelayMillis?: number;
}

/**
 * Filter options for querying captured spans
 */
export interface SpanFilterOptions {
  /** Filter spans by name (exact match) */
  name?: string;
  
  /** Filter spans by name (regular expression) */
  nameRegex?: RegExp;
  
  /** Filter spans by kind */
  kind?: SpanKind;
  
  /** Filter spans by status code */
  statusCode?: SpanStatusCode;
  
  /** Filter spans by attribute key existence */
  hasAttribute?: string;
  
  /** Filter spans by attribute key-value pair */
  attributeEquals?: { key: string; value: string | number | boolean };
  
  /** Filter spans by parent span ID */
  parentSpanId?: string;
  
  /** Filter root spans (spans without parents) */
  rootSpansOnly?: boolean;
  
  /** Filter spans by minimum duration in milliseconds */
  minDurationMillis?: number;
  
  /** Filter spans by maximum duration in milliseconds */
  maxDurationMillis?: number;
  
  /** Filter spans that have errors */
  hasError?: boolean;
}

/**
 * Span relationship information for analyzing trace hierarchies
 */
export interface SpanRelationship {
  /** The span being analyzed */
  span: ReadableSpan;
  
  /** The parent span if it exists */
  parent?: ReadableSpan;
  
  /** Child spans of this span */
  children: ReadableSpan[];
  
  /** Depth in the trace tree (0 for root spans) */
  depth: number;
  
  /** Total number of descendants (children, grandchildren, etc.) */
  descendantCount: number;
  
  /** Total duration including all child operations in milliseconds */
  totalDurationMillis: number;
  
  /** Self duration excluding child operations in milliseconds */
  selfDurationMillis: number;
}

/**
 * Performance timing analysis for a group of spans
 */
export interface SpanTimingAnalysis {
  /** Total number of spans analyzed */
  spanCount: number;
  
  /** Minimum duration in milliseconds */
  minDurationMillis: number;
  
  /** Maximum duration in milliseconds */
  maxDurationMillis: number;
  
  /** Average duration in milliseconds */
  avgDurationMillis: number;
  
  /** Median duration in milliseconds */
  medianDurationMillis: number;
  
  /** 95th percentile duration in milliseconds */
  p95DurationMillis: number;
  
  /** 99th percentile duration in milliseconds */
  p99DurationMillis: number;
  
  /** Standard deviation of durations in milliseconds */
  stdDevDurationMillis: number;
  
  /** Total duration of all spans in milliseconds */
  totalDurationMillis: number;
}

/**
 * Utility class for capturing and analyzing spans during tests
 */
export class SpanCapturer {
  private exporter: InMemorySpanExporter;
  private processor: SpanProcessor;
  private provider: BasicTracerProvider;
  private tracer: Tracer;
  
  /**
   * Creates a new SpanCapturer instance
   * @param options Configuration options
   */
  constructor(options: SpanCapturerOptions = {}) {
    const {
      serviceName = 'test-service',
      useBatchProcessor = false,
      maxBatchSize = 512,
      exportTimeoutMillis = 5000,
      scheduleDelayMillis = 1000
    } = options;
    
    // Create an in-memory exporter for capturing spans
    this.exporter = new InMemorySpanExporter();
    
    // Create the appropriate span processor based on options
    if (useBatchProcessor) {
      this.processor = new BatchSpanProcessor(this.exporter, {
        maxExportBatchSize: maxBatchSize,
        exportTimeoutMillis,
        scheduledDelayMillis: scheduleDelayMillis
      });
    } else {
      this.processor = new SimpleSpanProcessor(this.exporter);
    }
    
    // Create a tracer provider with the processor
    this.provider = new BasicTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName
      })
    });
    
    this.provider.addSpanProcessor(this.processor);
    this.provider.register();
    
    // Get a tracer from the provider
    this.tracer = this.provider.getTracer('span-capturer');
  }
  
  /**
   * Gets the tracer instance for creating spans
   */
  getTracer(): Tracer {
    return this.tracer;
  }
  
  /**
   * Creates and starts a new span
   * @param name The name of the span
   * @param options Span options
   * @param context Parent context (optional)
   */
  startSpan(name: string, options?: SpanOptions, context?: Context): Span {
    return this.tracer.startSpan(name, options, context);
  }
  
  /**
   * Creates a span and automatically ends it after the callback completes
   * @param name The name of the span
   * @param callback Function to execute within the span
   * @param options Span options
   * @param context Parent context (optional)
   */
  async captureSpan<T>(
    name: string,
    callback: () => Promise<T> | T,
    options?: SpanOptions,
    context?: Context
  ): Promise<T> {
    const span = this.startSpan(name, options, context);
    const ctx = trace.setSpan(context || trace.context(), span);
    
    try {
      const result = await trace.with(ctx, callback);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error)
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Retrieves all captured spans
   */
  getSpans(): ReadableSpan[] {
    return this.exporter.getFinishedSpans();
  }
  
  /**
   * Clears all captured spans
   */
  clearSpans(): void {
    this.exporter.reset();
  }
  
  /**
   * Forces the processor to export all spans
   */
  async forceFlush(): Promise<void> {
    await this.processor.forceFlush();
  }
  
  /**
   * Shuts down the span capturer
   */
  async shutdown(): Promise<void> {
    await this.processor.shutdown();
  }
  
  /**
   * Filters spans based on the provided criteria
   * @param options Filter options
   */
  filterSpans(options: SpanFilterOptions = {}): ReadableSpan[] {
    let spans = this.getSpans();
    
    if (options.name) {
      spans = spans.filter(span => span.name === options.name);
    }
    
    if (options.nameRegex) {
      spans = spans.filter(span => options.nameRegex!.test(span.name));
    }
    
    if (options.kind !== undefined) {
      spans = spans.filter(span => span.kind === options.kind);
    }
    
    if (options.statusCode !== undefined) {
      spans = spans.filter(span => span.status.code === options.statusCode);
    }
    
    if (options.hasAttribute) {
      spans = spans.filter(span => 
        span.attributes[options.hasAttribute!] !== undefined
      );
    }
    
    if (options.attributeEquals) {
      const { key, value } = options.attributeEquals;
      spans = spans.filter(span => span.attributes[key] === value);
    }
    
    if (options.parentSpanId) {
      spans = spans.filter(span => 
        span.parentSpanId === options.parentSpanId
      );
    }
    
    if (options.rootSpansOnly) {
      spans = spans.filter(span => !span.parentSpanId);
    }
    
    if (options.minDurationMillis !== undefined) {
      spans = spans.filter(span => {
        const durationMillis = calculateDurationMillis(span);
        return durationMillis >= options.minDurationMillis!;
      });
    }
    
    if (options.maxDurationMillis !== undefined) {
      spans = spans.filter(span => {
        const durationMillis = calculateDurationMillis(span);
        return durationMillis <= options.maxDurationMillis!;
      });
    }
    
    if (options.hasError !== undefined) {
      spans = spans.filter(span => 
        (span.status.code === SpanStatusCode.ERROR) === options.hasError
      );
    }
    
    return spans;
  }
  
  /**
   * Finds a single span matching the filter criteria
   * @param options Filter options
   * @returns The matching span or undefined if not found
   */
  findSpan(options: SpanFilterOptions = {}): ReadableSpan | undefined {
    const spans = this.filterSpans(options);
    return spans.length > 0 ? spans[0] : undefined;
  }
  
  /**
   * Builds a tree of span relationships for analyzing trace hierarchies
   * @param rootSpanId Optional root span ID to start from (if not provided, all root spans are processed)
   */
  buildSpanTree(rootSpanId?: string): SpanRelationship[] {
    const spans = this.getSpans();
    const spanMap = new Map<string, ReadableSpan>();
    const relationships: SpanRelationship[] = [];
    
    // Build a map of span ID to span for quick lookup
    spans.forEach(span => {
      spanMap.set(span.spanContext().spanId, span);
    });
    
    // Helper function to build the tree recursively
    const buildTree = (span: ReadableSpan, depth: number): SpanRelationship => {
      const spanId = span.spanContext().spanId;
      const children = spans.filter(s => s.parentSpanId === spanId);
      
      // Calculate timing information
      const spanDuration = calculateDurationMillis(span);
      let childrenDuration = 0;
      let descendantCount = children.length;
      
      // Process children recursively
      const childRelationships = children.map(child => {
        const childRelationship = buildTree(child, depth + 1);
        childrenDuration += childRelationship.totalDurationMillis;
        descendantCount += childRelationship.descendantCount;
        return childRelationship;
      });
      
      // Create the relationship object
      const relationship: SpanRelationship = {
        span,
        parent: span.parentSpanId ? spanMap.get(span.parentSpanId) : undefined,
        children: children,
        depth,
        descendantCount,
        totalDurationMillis: spanDuration,
        selfDurationMillis: Math.max(0, spanDuration - childrenDuration)
      };
      
      relationships.push(relationship);
      return relationship;
    };
    
    // Start building the tree from the specified root or all root spans
    if (rootSpanId) {
      const rootSpan = spanMap.get(rootSpanId);
      if (rootSpan) {
        buildTree(rootSpan, 0);
      }
    } else {
      // Process all root spans (spans without parents)
      const rootSpans = spans.filter(span => !span.parentSpanId);
      rootSpans.forEach(rootSpan => {
        buildTree(rootSpan, 0);
      });
    }
    
    return relationships;
  }
  
  /**
   * Analyzes timing characteristics of a set of spans
   * @param spans Spans to analyze (defaults to all captured spans)
   */
  analyzeTiming(spans?: ReadableSpan[]): SpanTimingAnalysis {
    const targetSpans = spans || this.getSpans();
    
    if (targetSpans.length === 0) {
      return {
        spanCount: 0,
        minDurationMillis: 0,
        maxDurationMillis: 0,
        avgDurationMillis: 0,
        medianDurationMillis: 0,
        p95DurationMillis: 0,
        p99DurationMillis: 0,
        stdDevDurationMillis: 0,
        totalDurationMillis: 0
      };
    }
    
    // Calculate durations for all spans
    const durations = targetSpans.map(calculateDurationMillis);
    durations.sort((a, b) => a - b);
    
    // Calculate statistics
    const spanCount = durations.length;
    const minDurationMillis = durations[0];
    const maxDurationMillis = durations[spanCount - 1];
    const totalDurationMillis = durations.reduce((sum, duration) => sum + duration, 0);
    const avgDurationMillis = totalDurationMillis / spanCount;
    
    // Calculate median and percentiles
    const medianDurationMillis = calculatePercentile(durations, 50);
    const p95DurationMillis = calculatePercentile(durations, 95);
    const p99DurationMillis = calculatePercentile(durations, 99);
    
    // Calculate standard deviation
    const variance = durations.reduce(
      (sum, duration) => sum + Math.pow(duration - avgDurationMillis, 2),
      0
    ) / spanCount;
    const stdDevDurationMillis = Math.sqrt(variance);
    
    return {
      spanCount,
      minDurationMillis,
      maxDurationMillis,
      avgDurationMillis,
      medianDurationMillis,
      p95DurationMillis,
      p99DurationMillis,
      stdDevDurationMillis,
      totalDurationMillis
    };
  }
  
  /**
   * Gets all spans with errors
   */
  getErrorSpans(): ReadableSpan[] {
    return this.filterSpans({ hasError: true });
  }
  
  /**
   * Finds the slowest spans based on duration
   * @param count Number of spans to return (default: 5)
   * @param spans Spans to analyze (defaults to all captured spans)
   */
  getSlowestSpans(count: number = 5, spans?: ReadableSpan[]): ReadableSpan[] {
    const targetSpans = spans || this.getSpans();
    return [...targetSpans]
      .sort((a, b) => calculateDurationMillis(b) - calculateDurationMillis(a))
      .slice(0, count);
  }
  
  /**
   * Finds spans that match a specific journey context
   * @param journeyType The journey type ('health', 'care', or 'plan')
   * @param journeyId Optional journey ID to match
   */
  getJourneySpans(journeyType: 'health' | 'care' | 'plan', journeyId?: string): ReadableSpan[] {
    const options: SpanFilterOptions = {
      hasAttribute: `austa.journey.${journeyType}`
    };
    
    if (journeyId) {
      options.attributeEquals = {
        key: `austa.journey.${journeyType}.id`,
        value: journeyId
      };
    }
    
    return this.filterSpans(options);
  }
}

/**
 * Calculates the duration of a span in milliseconds
 * @param span The span to calculate duration for
 */
function calculateDurationMillis(span: ReadableSpan): number {
  const startTime = span.startTime;
  const endTime = span.endTime;
  
  // Convert nanoseconds to milliseconds
  const durationNanos = endTime[0] - startTime[0];
  const durationMillis = durationNanos / 1_000_000;
  
  return durationMillis;
}

/**
 * Calculates a percentile value from a sorted array of numbers
 * @param sortedValues Sorted array of values
 * @param percentile Percentile to calculate (0-100)
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) return sortedValues[lower];
  
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Creates a pre-configured SpanCapturer for testing
 * @param options Configuration options
 */
export function createTestSpanCapturer(options: SpanCapturerOptions = {}): SpanCapturer {
  return new SpanCapturer({
    serviceName: 'test-service',
    useBatchProcessor: false,
    ...options
  });
}

/**
 * Utility to verify span attributes match expected values
 * @param span The span to check
 * @param expectedAttributes Map of expected attribute key-value pairs
 * @returns Array of missing or mismatched attributes
 */
export function verifySpanAttributes(
  span: ReadableSpan,
  expectedAttributes: Record<string, string | number | boolean>
): string[] {
  const errors: string[] = [];
  
  for (const [key, expectedValue] of Object.entries(expectedAttributes)) {
    const actualValue = span.attributes[key];
    
    if (actualValue === undefined) {
      errors.push(`Missing attribute: ${key}`);
    } else if (actualValue !== expectedValue) {
      errors.push(`Attribute ${key} has value ${actualValue}, expected ${expectedValue}`);
    }
  }
  
  return errors;
}

/**
 * Utility to verify span events match expected values
 * @param span The span to check
 * @param expectedEvents Array of expected event names
 * @returns Array of missing events
 */
export function verifySpanEvents(
  span: ReadableSpan,
  expectedEvents: string[]
): string[] {
  const errors: string[] = [];
  const actualEvents = span.events.map(event => event.name);
  
  for (const expectedEvent of expectedEvents) {
    if (!actualEvents.includes(expectedEvent)) {
      errors.push(`Missing event: ${expectedEvent}`);
    }
  }
  
  return errors;
}

/**
 * Utility to verify span status
 * @param span The span to check
 * @param expectedStatus Expected status code
 * @param expectedMessage Optional expected status message
 * @returns Array of status mismatches
 */
export function verifySpanStatus(
  span: ReadableSpan,
  expectedStatus: SpanStatusCode,
  expectedMessage?: string
): string[] {
  const errors: string[] = [];
  
  if (span.status.code !== expectedStatus) {
    errors.push(`Status code is ${span.status.code}, expected ${expectedStatus}`);
  }
  
  if (expectedMessage !== undefined && span.status.message !== expectedMessage) {
    errors.push(`Status message is "${span.status.message}", expected "${expectedMessage}"`);
  }
  
  return errors;
}
/**
 * @file Tracing Collector for E2E Tests
 * 
 * This utility captures and analyzes OpenTelemetry traces emitted during e2e tests.
 * It provides an in-memory trace collector that intercepts spans and exposes methods
 * to query and validate trace data. This component is crucial for verifying trace
 * relationships, span attributes, and context propagation in a multi-service environment.
 */

import {
  Context,
  Span,
  SpanKind,
  SpanStatus,
  SpanStatusCode,
  trace,
  Tracer,
  TracerProvider,
} from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  ReadableSpan,
  SimpleSpanProcessor,
  SpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { JourneyContext, SpanAttributes } from '../../src/interfaces';

/**
 * Options for configuring the TracingCollector
 */
export interface TracingCollectorOptions {
  /** Name of the service being tested */
  serviceName?: string;
  /** Whether to automatically clear spans after each test */
  autoClearSpans?: boolean;
  /** Custom span exporter to use instead of the default InMemorySpanExporter */
  customExporter?: SpanExporter;
}

/**
 * Filter options for querying spans
 */
export interface SpanQueryOptions {
  /** Filter by trace ID */
  traceId?: string;
  /** Filter by span name */
  name?: string;
  /** Filter by span kind */
  kind?: SpanKind;
  /** Filter by parent span ID */
  parentSpanId?: string;
  /** Filter by attribute key-value pairs */
  attributes?: Record<string, any>;
  /** Filter by journey context */
  journeyContext?: Partial<JourneyContext>;
  /** Filter by status code */
  statusCode?: SpanStatusCode;
  /** Filter by service name */
  serviceName?: string;
  /** Filter by minimum duration in milliseconds */
  minDurationMs?: number;
  /** Filter by maximum duration in milliseconds */
  maxDurationMs?: number;
  /** Filter by time range (start time) */
  startTimeRange?: {
    start: number;
    end: number;
  };
  /** Filter by time range (end time) */
  endTimeRange?: {
    start: number;
    end: number;
  };
}

/**
 * Span relationship types for validation
 */
export enum SpanRelationship {
  PARENT_CHILD = 'parent-child',
  FOLLOWS_FROM = 'follows-from',
  SIBLING = 'sibling',
}

/**
 * Result of a trace validation
 */
export interface TraceValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Spans that were validated */
  spans?: ReadableSpan[];
  /** Additional context about the validation */
  context?: Record<string, any>;
}

/**
 * A utility for capturing and analyzing OpenTelemetry traces during e2e tests.
 * 
 * This class provides an in-memory trace collector that intercepts spans and
 * exposes methods to query and validate trace data. It's designed to be used
 * in end-to-end tests to verify trace relationships, span attributes, and
 * context propagation in a multi-service environment.
 */
export class TracingCollector {
  private readonly exporter: InMemorySpanExporter;
  private readonly processor: SimpleSpanProcessor;
  private readonly tracerProvider: TracerProvider;
  private readonly tracer: Tracer;
  private readonly serviceName: string;
  private readonly autoClearSpans: boolean;

  /**
   * Creates a new TracingCollector instance
   * 
   * @param options Configuration options for the collector
   */
  constructor(options: TracingCollectorOptions = {}) {
    this.serviceName = options.serviceName || 'test-service';
    this.autoClearSpans = options.autoClearSpans !== false;
    
    // Use the provided exporter or create a new InMemorySpanExporter
    this.exporter = options.customExporter as InMemorySpanExporter || new InMemorySpanExporter();
    
    // Create a simple span processor that will send spans to the exporter
    this.processor = new SimpleSpanProcessor(this.exporter);
    
    // Create a tracer provider and register the processor
    this.tracerProvider = trace.getTracerProvider() as TracerProvider;
    this.tracerProvider.addSpanProcessor(this.processor);
    
    // Get a tracer from the provider
    this.tracer = this.tracerProvider.getTracer(this.serviceName);
  }

  /**
   * Gets all spans collected by the exporter
   * 
   * @returns Array of collected spans
   */
  public getSpans(): ReadableSpan[] {
    return this.exporter.getFinishedSpans();
  }

  /**
   * Clears all collected spans
   */
  public clearSpans(): void {
    this.exporter.reset();
  }

  /**
   * Gets spans that match the specified query options
   * 
   * @param options Query options to filter spans
   * @returns Array of spans that match the query
   */
  public querySpans(options: SpanQueryOptions = {}): ReadableSpan[] {
    let spans = this.getSpans();

    // Filter by trace ID
    if (options.traceId) {
      spans = spans.filter(span => span.spanContext().traceId === options.traceId);
    }

    // Filter by span name
    if (options.name) {
      spans = spans.filter(span => span.name === options.name);
    }

    // Filter by span kind
    if (options.kind !== undefined) {
      spans = spans.filter(span => span.kind === options.kind);
    }

    // Filter by parent span ID
    if (options.parentSpanId) {
      spans = spans.filter(span => span.parentSpanId === options.parentSpanId);
    }

    // Filter by attributes
    if (options.attributes) {
      spans = spans.filter(span => {
        return Object.entries(options.attributes || {}).every(([key, value]) => {
          return span.attributes[key] !== undefined && 
                 this.compareAttributeValues(span.attributes[key], value);
        });
      });
    }

    // Filter by journey context
    if (options.journeyContext) {
      spans = spans.filter(span => {
        const journeyAttrs = this.extractJourneyContext(span.attributes);
        if (!journeyAttrs) return false;
        
        return Object.entries(options.journeyContext || {}).every(([key, value]) => {
          return journeyAttrs[key as keyof JourneyContext] === value;
        });
      });
    }

    // Filter by status code
    if (options.statusCode !== undefined) {
      spans = spans.filter(span => span.status.code === options.statusCode);
    }

    // Filter by service name
    if (options.serviceName) {
      spans = spans.filter(span => {
        return span.resource.attributes['service.name'] === options.serviceName;
      });
    }

    // Filter by duration
    if (options.minDurationMs !== undefined) {
      spans = spans.filter(span => {
        const durationMs = (span.endTime.getTime() - span.startTime.getTime());
        return durationMs >= options.minDurationMs!;
      });
    }

    if (options.maxDurationMs !== undefined) {
      spans = spans.filter(span => {
        const durationMs = (span.endTime.getTime() - span.startTime.getTime());
        return durationMs <= options.maxDurationMs!;
      });
    }

    // Filter by start time range
    if (options.startTimeRange) {
      spans = spans.filter(span => {
        const startTime = span.startTime.getTime();
        return startTime >= options.startTimeRange!.start && 
               startTime <= options.startTimeRange!.end;
      });
    }

    // Filter by end time range
    if (options.endTimeRange) {
      spans = spans.filter(span => {
        const endTime = span.endTime.getTime();
        return endTime >= options.endTimeRange!.start && 
               endTime <= options.endTimeRange!.end;
      });
    }

    return spans;
  }

  /**
   * Gets a specific span by its span ID
   * 
   * @param spanId The ID of the span to retrieve
   * @returns The span with the specified ID, or undefined if not found
   */
  public getSpanById(spanId: string): ReadableSpan | undefined {
    return this.getSpans().find(span => span.spanContext().spanId === spanId);
  }

  /**
   * Gets all spans for a specific trace
   * 
   * @param traceId The ID of the trace to retrieve spans for
   * @returns Array of spans belonging to the specified trace
   */
  public getTraceSpans(traceId: string): ReadableSpan[] {
    return this.querySpans({ traceId });
  }

  /**
   * Gets the root span for a specific trace
   * 
   * @param traceId The ID of the trace to retrieve the root span for
   * @returns The root span of the trace, or undefined if not found
   */
  public getTraceRootSpan(traceId: string): ReadableSpan | undefined {
    const traceSpans = this.getTraceSpans(traceId);
    return traceSpans.find(span => !span.parentSpanId);
  }

  /**
   * Gets all child spans for a specific span
   * 
   * @param parentSpanId The ID of the parent span
   * @returns Array of child spans
   */
  public getChildSpans(parentSpanId: string): ReadableSpan[] {
    return this.querySpans({ parentSpanId });
  }

  /**
   * Validates that a trace contains the expected spans
   * 
   * @param traceId The ID of the trace to validate
   * @param expectedSpanNames Array of expected span names in the trace
   * @returns Validation result
   */
  public validateTraceContainsSpans(traceId: string, expectedSpanNames: string[]): TraceValidationResult {
    const traceSpans = this.getTraceSpans(traceId);
    const spanNames = traceSpans.map(span => span.name);
    
    const missingSpans = expectedSpanNames.filter(name => !spanNames.includes(name));
    
    if (missingSpans.length > 0) {
      return {
        valid: false,
        error: `Trace is missing expected spans: ${missingSpans.join(', ')}`,
        spans: traceSpans,
        context: { expectedSpanNames, actualSpanNames: spanNames }
      };
    }
    
    return {
      valid: true,
      spans: traceSpans,
      context: { expectedSpanNames, actualSpanNames: spanNames }
    };
  }

  /**
   * Validates that spans have the expected relationship
   * 
   * @param spanId1 ID of the first span
   * @param spanId2 ID of the second span
   * @param relationship Expected relationship between the spans
   * @returns Validation result
   */
  public validateSpanRelationship(
    spanId1: string,
    spanId2: string,
    relationship: SpanRelationship
  ): TraceValidationResult {
    const span1 = this.getSpanById(spanId1);
    const span2 = this.getSpanById(spanId2);
    
    if (!span1 || !span2) {
      return {
        valid: false,
        error: `One or both spans not found: ${!span1 ? spanId1 : ''} ${!span2 ? spanId2 : ''}`,
        context: { spanId1, spanId2, relationship }
      };
    }
    
    // Check if spans are from the same trace
    if (span1.spanContext().traceId !== span2.spanContext().traceId) {
      return {
        valid: false,
        error: 'Spans are from different traces',
        spans: [span1, span2],
        context: { spanId1, spanId2, relationship }
      };
    }
    
    switch (relationship) {
      case SpanRelationship.PARENT_CHILD:
        if (span2.parentSpanId === span1.spanContext().spanId) {
          return { valid: true, spans: [span1, span2] };
        }
        return {
          valid: false,
          error: 'Span2 is not a child of Span1',
          spans: [span1, span2],
          context: { spanId1, spanId2, relationship }
        };
        
      case SpanRelationship.SIBLING:
        if (span1.parentSpanId && 
            span1.parentSpanId === span2.parentSpanId) {
          return { valid: true, spans: [span1, span2] };
        }
        return {
          valid: false,
          error: 'Spans are not siblings',
          spans: [span1, span2],
          context: { spanId1, spanId2, relationship }
        };
        
      case SpanRelationship.FOLLOWS_FROM:
        // This is a simplified check for follows-from relationship
        // In a real implementation, you would check for the actual follows-from links
        if (span1.endTime.getTime() <= span2.startTime.getTime()) {
          return { valid: true, spans: [span1, span2] };
        }
        return {
          valid: false,
          error: 'Span2 does not follow from Span1',
          spans: [span1, span2],
          context: { spanId1, spanId2, relationship }
        };
        
      default:
        return {
          valid: false,
          error: `Unknown relationship type: ${relationship}`,
          spans: [span1, span2],
          context: { spanId1, spanId2, relationship }
        };
    }
  }

  /**
   * Validates that a span has the expected attributes
   * 
   * @param spanId ID of the span to validate
   * @param expectedAttributes Expected attributes on the span
   * @returns Validation result
   */
  public validateSpanAttributes(
    spanId: string,
    expectedAttributes: Record<string, any>
  ): TraceValidationResult {
    const span = this.getSpanById(spanId);
    
    if (!span) {
      return {
        valid: false,
        error: `Span not found: ${spanId}`,
        context: { spanId, expectedAttributes }
      };
    }
    
    const missingAttributes: string[] = [];
    const mismatchedAttributes: Record<string, { expected: any; actual: any }> = {};
    
    Object.entries(expectedAttributes).forEach(([key, expectedValue]) => {
      if (span.attributes[key] === undefined) {
        missingAttributes.push(key);
      } else if (!this.compareAttributeValues(span.attributes[key], expectedValue)) {
        mismatchedAttributes[key] = {
          expected: expectedValue,
          actual: span.attributes[key]
        };
      }
    });
    
    if (missingAttributes.length > 0 || Object.keys(mismatchedAttributes).length > 0) {
      let error = '';
      
      if (missingAttributes.length > 0) {
        error += `Missing attributes: ${missingAttributes.join(', ')}. `;
      }
      
      if (Object.keys(mismatchedAttributes).length > 0) {
        error += 'Mismatched attribute values: ' + 
          Object.entries(mismatchedAttributes)
            .map(([key, { expected, actual }]) => 
              `${key} (expected: ${JSON.stringify(expected)}, actual: ${JSON.stringify(actual)})`
            )
            .join(', ');
      }
      
      return {
        valid: false,
        error,
        spans: [span],
        context: { spanId, expectedAttributes, missingAttributes, mismatchedAttributes }
      };
    }
    
    return {
      valid: true,
      spans: [span],
      context: { spanId, expectedAttributes }
    };
  }

  /**
   * Validates that a trace has the expected structure
   * 
   * @param traceId ID of the trace to validate
   * @param expectedStructure Expected structure of the trace
   * @returns Validation result
   */
  public validateTraceStructure(
    traceId: string,
    expectedStructure: {
      rootSpan: { name: string; attributes?: Record<string, any> };
      childSpans: Array<{ name: string; parentName: string; attributes?: Record<string, any> }>;
    }
  ): TraceValidationResult {
    const traceSpans = this.getTraceSpans(traceId);
    
    if (traceSpans.length === 0) {
      return {
        valid: false,
        error: `Trace not found: ${traceId}`,
        context: { traceId, expectedStructure }
      };
    }
    
    // Find the root span
    const rootSpan = this.getTraceRootSpan(traceId);
    
    if (!rootSpan) {
      return {
        valid: false,
        error: 'No root span found in trace',
        spans: traceSpans,
        context: { traceId, expectedStructure }
      };
    }
    
    // Validate root span name
    if (rootSpan.name !== expectedStructure.rootSpan.name) {
      return {
        valid: false,
        error: `Root span name mismatch: expected '${expectedStructure.rootSpan.name}', got '${rootSpan.name}'`,
        spans: [rootSpan],
        context: { traceId, expectedStructure }
      };
    }
    
    // Validate root span attributes if specified
    if (expectedStructure.rootSpan.attributes) {
      const rootAttrValidation = this.validateSpanAttributes(
        rootSpan.spanContext().spanId,
        expectedStructure.rootSpan.attributes
      );
      
      if (!rootAttrValidation.valid) {
        return {
          valid: false,
          error: `Root span attribute validation failed: ${rootAttrValidation.error}`,
          spans: rootAttrValidation.spans,
          context: { traceId, expectedStructure, rootAttrValidation }
        };
      }
    }
    
    // Validate child spans
    for (const expectedChild of expectedStructure.childSpans) {
      // Find the parent span by name
      const parentSpan = traceSpans.find(span => span.name === expectedChild.parentName);
      
      if (!parentSpan) {
        return {
          valid: false,
          error: `Parent span not found: ${expectedChild.parentName}`,
          spans: traceSpans,
          context: { traceId, expectedStructure, childSpan: expectedChild }
        };
      }
      
      // Find the child span by name
      const childSpan = traceSpans.find(span => 
        span.name === expectedChild.name && 
        span.parentSpanId === parentSpan.spanContext().spanId
      );
      
      if (!childSpan) {
        return {
          valid: false,
          error: `Child span not found: ${expectedChild.name} (parent: ${expectedChild.parentName})`,
          spans: traceSpans,
          context: { traceId, expectedStructure, childSpan: expectedChild }
        };
      }
      
      // Validate child span attributes if specified
      if (expectedChild.attributes) {
        const childAttrValidation = this.validateSpanAttributes(
          childSpan.spanContext().spanId,
          expectedChild.attributes
        );
        
        if (!childAttrValidation.valid) {
          return {
            valid: false,
            error: `Child span attribute validation failed for ${expectedChild.name}: ${childAttrValidation.error}`,
            spans: childAttrValidation.spans,
            context: { traceId, expectedStructure, childSpan: expectedChild, childAttrValidation }
          };
        }
      }
    }
    
    return {
      valid: true,
      spans: traceSpans,
      context: { traceId, expectedStructure }
    };
  }

  /**
   * Validates that a trace contains spans from multiple services
   * 
   * @param traceId ID of the trace to validate
   * @param expectedServices Array of expected service names in the trace
   * @returns Validation result
   */
  public validateTraceAcrossServices(
    traceId: string,
    expectedServices: string[]
  ): TraceValidationResult {
    const traceSpans = this.getTraceSpans(traceId);
    
    if (traceSpans.length === 0) {
      return {
        valid: false,
        error: `Trace not found: ${traceId}`,
        context: { traceId, expectedServices }
      };
    }
    
    // Extract service names from spans
    const services = new Set<string>();
    
    traceSpans.forEach(span => {
      const serviceName = span.resource.attributes['service.name'];
      if (typeof serviceName === 'string') {
        services.add(serviceName);
      }
    });
    
    // Check if all expected services are present
    const missingServices = expectedServices.filter(service => !services.has(service));
    
    if (missingServices.length > 0) {
      return {
        valid: false,
        error: `Trace is missing spans from services: ${missingServices.join(', ')}`,
        spans: traceSpans,
        context: { traceId, expectedServices, actualServices: Array.from(services) }
      };
    }
    
    return {
      valid: true,
      spans: traceSpans,
      context: { traceId, expectedServices, actualServices: Array.from(services) }
    };
  }

  /**
   * Validates that a trace contains the expected journey context
   * 
   * @param traceId ID of the trace to validate
   * @param expectedJourneyContext Expected journey context in the trace
   * @returns Validation result
   */
  public validateTraceJourneyContext(
    traceId: string,
    expectedJourneyContext: Partial<JourneyContext>
  ): TraceValidationResult {
    const traceSpans = this.getTraceSpans(traceId);
    
    if (traceSpans.length === 0) {
      return {
        valid: false,
        error: `Trace not found: ${traceId}`,
        context: { traceId, expectedJourneyContext }
      };
    }
    
    // Check if any span has the expected journey context
    const spansWithContext = traceSpans.filter(span => {
      const journeyContext = this.extractJourneyContext(span.attributes);
      if (!journeyContext) return false;
      
      return Object.entries(expectedJourneyContext).every(([key, value]) => {
        return journeyContext[key as keyof JourneyContext] === value;
      });
    });
    
    if (spansWithContext.length === 0) {
      return {
        valid: false,
        error: 'No spans found with the expected journey context',
        spans: traceSpans,
        context: { traceId, expectedJourneyContext }
      };
    }
    
    return {
      valid: true,
      spans: spansWithContext,
      context: { traceId, expectedJourneyContext }
    };
  }

  /**
   * Creates a test span for use in tests
   * 
   * @param name Name of the span
   * @param options Options for creating the span
   * @returns The created span
   */
  public createTestSpan(
    name: string,
    options: {
      kind?: SpanKind;
      attributes?: SpanAttributes;
      parentContext?: Context;
    } = {}
  ): Span {
    return this.tracer.startSpan(
      name,
      {
        kind: options.kind || SpanKind.INTERNAL,
        attributes: options.attributes,
      },
      options.parentContext
    );
  }

  /**
   * Extracts journey context from span attributes
   * 
   * @param attributes Span attributes
   * @returns Journey context or undefined if not found
   */
  private extractJourneyContext(attributes: SpanAttributes): JourneyContext | undefined {
    // Check if journey context attributes exist
    if (!attributes['austa.journey.name']) {
      return undefined;
    }
    
    // Extract journey context from attributes
    return {
      journeyName: attributes['austa.journey.name'] as string,
      userId: attributes['austa.journey.user_id'] as string,
      sessionId: attributes['austa.journey.session_id'] as string,
      feature: attributes['austa.journey.feature'] as string,
      step: attributes['austa.journey.step'] as string,
    };
  }

  /**
   * Compares attribute values for equality
   * 
   * @param actual Actual attribute value
   * @param expected Expected attribute value
   * @returns Whether the values are equal
   */
  private compareAttributeValues(actual: any, expected: any): boolean {
    // Handle arrays
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      return actual.every((val, idx) => this.compareAttributeValues(val, expected[idx]));
    }
    
    // Handle objects
    if (typeof actual === 'object' && actual !== null && 
        typeof expected === 'object' && expected !== null) {
      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);
      
      if (actualKeys.length !== expectedKeys.length) return false;
      
      return actualKeys.every(key => 
        expected.hasOwnProperty(key) && 
        this.compareAttributeValues(actual[key], expected[key])
      );
    }
    
    // Handle primitive values
    return actual === expected;
  }

  /**
   * Resets the collector, clearing all spans if autoClearSpans is enabled
   */
  public reset(): void {
    if (this.autoClearSpans) {
      this.clearSpans();
    }
  }

  /**
   * Shuts down the collector, flushing any pending spans
   */
  public async shutdown(): Promise<void> {
    await this.processor.shutdown();
  }
}

/**
 * Creates a new TracingCollector instance with default options
 * 
 * @param options Configuration options for the collector
 * @returns A new TracingCollector instance
 */
export function createTracingCollector(options: TracingCollectorOptions = {}): TracingCollector {
  return new TracingCollector(options);
}
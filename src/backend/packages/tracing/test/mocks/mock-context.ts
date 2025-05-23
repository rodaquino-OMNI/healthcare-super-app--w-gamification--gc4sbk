/**
 * @file mock-context.ts
 * @description Provides a mock implementation of the OpenTelemetry Context for testing purposes.
 * This mock simulates context propagation and active context management, which are essential
 * for proper trace context flow in OpenTelemetry. The mock allows tests to verify that context
 * is properly passed between components without requiring actual telemetry infrastructure.
 *
 * @module @austa/tracing/test/mocks
 */

import { Context, SpanContext } from '@opentelemetry/api';
import { JourneyContext, JourneyType } from '../../src/interfaces/journey-context.interface';
import { TRACE_CONTEXT_ATTRIBUTES } from '../../src/interfaces/trace-context.interface';

/**
 * A mock implementation of OpenTelemetry Context for testing purposes.
 * Simulates the behavior of the actual Context without requiring real telemetry infrastructure.
 */
export class MockContext implements Context {
  private static _activeContext: MockContext | undefined;
  private values: Map<symbol, unknown>;
  
  /**
   * Creates a new instance of MockContext.
   * @param initialValues Optional initial values to populate the context
   */
  constructor(initialValues?: Map<symbol, unknown>) {
    this.values = initialValues ? new Map(initialValues) : new Map();
  }

  /**
   * Gets the active context.
   * @returns The currently active context, or a new empty context if none is active
   */
  static active(): MockContext {
    return MockContext._activeContext || new MockContext();
  }

  /**
   * Sets the active context for the duration of the callback function.
   * @param context The context to set as active
   * @param fn The function to execute within the context
   * @returns The result of the function execution
   */
  static with<T>(context: Context, fn: () => T): T {
    const previousContext = MockContext._activeContext;
    try {
      MockContext._activeContext = context as MockContext;
      return fn();
    } finally {
      MockContext._activeContext = previousContext;
    }
  }

  /**
   * Creates a new context with the given key and value.
   * @param context The parent context
   * @param key The key to set
   * @param value The value to set
   * @returns A new context with the key-value pair added
   */
  static setValue(context: Context, key: symbol, value: unknown): MockContext {
    const mockContext = context as MockContext;
    const newValues = new Map(mockContext.values);
    newValues.set(key, value);
    return new MockContext(newValues);
  }

  /**
   * Gets a value from the context by key.
   * @param context The context to get the value from
   * @param key The key to get
   * @returns The value associated with the key, or undefined if not found
   */
  static getValue(context: Context, key: symbol): unknown {
    const mockContext = context as MockContext;
    return mockContext.values.get(key);
  }

  /**
   * Deletes a value from the context by key.
   * @param context The context to delete the value from
   * @param key The key to delete
   * @returns A new context with the key removed
   */
  static deleteValue(context: Context, key: symbol): MockContext {
    const mockContext = context as MockContext;
    const newValues = new Map(mockContext.values);
    newValues.delete(key);
    return new MockContext(newValues);
  }

  /**
   * Helper method to set a trace ID in the context.
   * @param context The context to set the trace ID in
   * @param traceId The trace ID to set
   * @returns A new context with the trace ID set
   */
  static setTraceId(context: Context, traceId: string): MockContext {
    const traceIdKey = Symbol.for('opentelemetry.trace_id');
    return MockContext.setValue(context, traceIdKey, traceId);
  }

  /**
   * Helper method to get the trace ID from the context.
   * @param context The context to get the trace ID from
   * @returns The trace ID, or undefined if not set
   */
  static getTraceId(context: Context): string | undefined {
    const traceIdKey = Symbol.for('opentelemetry.trace_id');
    return MockContext.getValue(context, traceIdKey) as string | undefined;
  }

  /**
   * Helper method to set a span ID in the context.
   * @param context The context to set the span ID in
   * @param spanId The span ID to set
   * @returns A new context with the span ID set
   */
  static setSpanId(context: Context, spanId: string): MockContext {
    const spanIdKey = Symbol.for('opentelemetry.span_id');
    return MockContext.setValue(context, spanIdKey, spanId);
  }

  /**
   * Helper method to get the span ID from the context.
   * @param context The context to get the span ID from
   * @returns The span ID, or undefined if not set
   */
  static getSpanId(context: Context): string | undefined {
    const spanIdKey = Symbol.for('opentelemetry.span_id');
    return MockContext.getValue(context, spanIdKey) as string | undefined;
  }

  /**
   * Helper method to set a span context in the context.
   * @param context The context to set the span context in
   * @param spanContext The span context to set
   * @returns A new context with the span context set
   */
  static setSpanContext(context: Context, spanContext: SpanContext): MockContext {
    const spanContextKey = Symbol.for('opentelemetry.span_context');
    return MockContext.setValue(context, spanContextKey, spanContext);
  }

  /**
   * Helper method to get the span context from the context.
   * @param context The context to get the span context from
   * @returns The span context, or undefined if not set
   */
  static getSpanContext(context: Context): SpanContext | undefined {
    const spanContextKey = Symbol.for('opentelemetry.span_context');
    return MockContext.getValue(context, spanContextKey) as SpanContext | undefined;
  }

  /**
   * Helper method to set a correlation ID in the context.
   * @param context The context to set the correlation ID in
   * @param correlationId The correlation ID to set
   * @returns A new context with the correlation ID set
   */
  static setCorrelationId(context: Context, correlationId: string): MockContext {
    const correlationIdKey = Symbol.for(TRACE_CONTEXT_ATTRIBUTES.CORRELATION_ID);
    return MockContext.setValue(context, correlationIdKey, correlationId);
  }

  /**
   * Helper method to get the correlation ID from the context.
   * @param context The context to get the correlation ID from
   * @returns The correlation ID, or undefined if not set
   */
  static getCorrelationId(context: Context): string | undefined {
    const correlationIdKey = Symbol.for(TRACE_CONTEXT_ATTRIBUTES.CORRELATION_ID);
    return MockContext.getValue(context, correlationIdKey) as string | undefined;
  }

  /**
   * Helper method to set journey context in the context.
   * @param context The context to set the journey context in
   * @param journeyContext The journey context to set
   * @returns A new context with the journey context set
   */
  static setJourneyContext(context: Context, journeyContext: JourneyContext): MockContext {
    const journeyContextKey = Symbol.for('austa.journey_context');
    return MockContext.setValue(context, journeyContextKey, journeyContext);
  }

  /**
   * Helper method to get the journey context from the context.
   * @param context The context to get the journey context from
   * @returns The journey context, or undefined if not set
   */
  static getJourneyContext(context: Context): JourneyContext | undefined {
    const journeyContextKey = Symbol.for('austa.journey_context');
    return MockContext.getValue(context, journeyContextKey) as JourneyContext | undefined;
  }

  /**
   * Helper method to set journey type in the context.
   * @param context The context to set the journey type in
   * @param journeyType The journey type to set
   * @returns A new context with the journey type set
   */
  static setJourneyType(context: Context, journeyType: JourneyType): MockContext {
    const journeyTypeKey = Symbol.for(TRACE_CONTEXT_ATTRIBUTES.JOURNEY_TYPE);
    return MockContext.setValue(context, journeyTypeKey, journeyType);
  }

  /**
   * Helper method to get the journey type from the context.
   * @param context The context to get the journey type from
   * @returns The journey type, or undefined if not set
   */
  static getJourneyType(context: Context): JourneyType | undefined {
    const journeyTypeKey = Symbol.for(TRACE_CONTEXT_ATTRIBUTES.JOURNEY_TYPE);
    return MockContext.getValue(context, journeyTypeKey) as JourneyType | undefined;
  }

  /**
   * Creates a new empty context.
   * @returns A new empty context
   */
  static createRoot(): MockContext {
    return new MockContext();
  }

  /**
   * Resets the active context to undefined.
   * Useful for cleaning up after tests.
   */
  static reset(): void {
    MockContext._activeContext = undefined;
  }

  /**
   * Serializes the context to a string for testing purposes.
   * @param context The context to serialize
   * @returns A JSON string representation of the context
   */
  static serialize(context: Context): string {
    const mockContext = context as MockContext;
    const serialized: Record<string, unknown> = {};
    
    mockContext.values.forEach((value, key) => {
      serialized[key.toString()] = value;
    });
    
    return JSON.stringify(serialized);
  }

  /**
   * Creates a mock context with common testing values pre-populated.
   * @returns A pre-populated mock context for testing
   */
  static createTestContext(): MockContext {
    let context = new MockContext();
    
    // Add trace and span IDs
    const traceId = '1234567890abcdef1234567890abcdef';
    const spanId = 'abcdef1234567890';
    context = MockContext.setTraceId(context, traceId);
    context = MockContext.setSpanId(context, spanId);
    
    // Add correlation ID
    context = MockContext.setCorrelationId(context, 'test-correlation-id');
    
    // Add journey context
    const journeyContext: JourneyContext = {
      journeyId: 'test-journey-id',
      journeyType: JourneyType.HEALTH,
      userId: 'test-user-id',
      sessionId: 'test-session-id',
      startedAt: new Date().toISOString(),
      currentStep: 'test-step'
    };
    context = MockContext.setJourneyContext(context, journeyContext);
    
    return context;
  }
}
import { Span, SpanStatusCode } from '@opentelemetry/api';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { strict as assert } from 'assert';

/**
 * Interface for span duration assertions
 */
export interface SpanDurationOptions {
  /** Minimum acceptable duration in milliseconds */
  min?: number;
  /** Maximum acceptable duration in milliseconds */
  max?: number;
  /** Exact duration in milliseconds (takes precedence over min/max) */
  exact?: number;
  /** Tolerance percentage for exact matching (default: 0) */
  tolerance?: number;
}

/**
 * Interface for span time assertions
 */
export interface SpanTimeOptions {
  /** Minimum acceptable time in milliseconds since epoch */
  min?: number;
  /** Maximum acceptable time in milliseconds since epoch */
  max?: number;
  /** Exact time in milliseconds since epoch (takes precedence over min/max) */
  exact?: number;
  /** Tolerance in milliseconds for exact matching (default: 0) */
  tolerance?: number;
}

/**
 * Interface for journey-specific span assertions
 */
export interface JourneySpanOptions {
  /** User ID associated with the journey */
  userId?: string;
  /** Journey correlation ID */
  correlationId?: string;
  /** Additional journey-specific attributes to verify */
  attributes?: Record<string, unknown>;
}

/**
 * Asserts that a span has all the specified attributes
 * @param span The span to check
 * @param attributes The attributes that should exist on the span
 * @param message Optional assertion message
 */
export function assertSpanHasAttributes(
  span: Span | ReadableSpan,
  attributes: Record<string, unknown>,
  message?: string
): void {
  const spanAttributes = getSpanAttributes(span);
  const missingAttributes: string[] = [];
  const mismatchedAttributes: Array<{ key: string; expected: unknown; actual: unknown }> = [];

  Object.entries(attributes).forEach(([key, value]) => {
    if (!(key in spanAttributes)) {
      missingAttributes.push(key);
    } else if (spanAttributes[key] !== value) {
      mismatchedAttributes.push({
        key,
        expected: value,
        actual: spanAttributes[key],
      });
    }
  });

  if (missingAttributes.length > 0 || mismatchedAttributes.length > 0) {
    let errorMessage = message || 'Span is missing expected attributes';
    
    if (missingAttributes.length > 0) {
      errorMessage += `\nMissing attributes: ${missingAttributes.join(', ')}`;
    }
    
    if (mismatchedAttributes.length > 0) {
      errorMessage += '\nMismatched attributes:';
      mismatchedAttributes.forEach(({ key, expected, actual }) => {
        errorMessage += `\n  ${key}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
      });
    }
    
    assert.fail(errorMessage);
  }
}

/**
 * Asserts that a span has a specific attribute with the expected value
 * @param span The span to check
 * @param key The attribute key
 * @param value The expected attribute value
 * @param message Optional assertion message
 */
export function assertSpanAttributeEquals(
  span: Span | ReadableSpan,
  key: string,
  value: unknown,
  message?: string
): void {
  const spanAttributes = getSpanAttributes(span);
  
  if (!(key in spanAttributes)) {
    assert.fail(message || `Span is missing attribute: ${key}`);
  }
  
  assert.deepStrictEqual(
    spanAttributes[key],
    value,
    message || `Span attribute ${key} has unexpected value`
  );
}

/**
 * Asserts that a span has a specific attribute
 * @param span The span to check
 * @param key The attribute key
 * @param message Optional assertion message
 */
export function assertSpanAttributeExists(
  span: Span | ReadableSpan,
  key: string,
  message?: string
): void {
  const spanAttributes = getSpanAttributes(span);
  
  if (!(key in spanAttributes)) {
    assert.fail(message || `Span is missing attribute: ${key}`);
  }
}

/**
 * Asserts that a span has a specific parent span
 * @param span The span to check
 * @param parentSpan The expected parent span
 * @param message Optional assertion message
 */
export function assertSpanHasParent(
  span: ReadableSpan,
  parentSpan: ReadableSpan,
  message?: string
): void {
  const parentSpanId = parentSpan.spanContext().spanId;
  const spanParentId = span.parentSpanId;
  
  if (!spanParentId) {
    assert.fail(message || 'Span does not have a parent');
  }
  
  assert.strictEqual(
    spanParentId,
    parentSpanId,
    message || 'Span has incorrect parent'
  );
}

/**
 * Asserts that a span is a root span (has no parent)
 * @param span The span to check
 * @param message Optional assertion message
 */
export function assertSpanIsRoot(
  span: ReadableSpan,
  message?: string
): void {
  assert.strictEqual(
    span.parentSpanId,
    undefined,
    message || 'Span is not a root span'
  );
}

/**
 * Asserts that a span's duration is within the expected range
 * @param span The span to check
 * @param options Duration constraints
 * @param message Optional assertion message
 */
export function assertSpanDuration(
  span: ReadableSpan,
  options: SpanDurationOptions,
  message?: string
): void {
  const { startTime, endTime } = span;
  const durationNanos = endTime - startTime;
  const durationMillis = durationNanos / 1000000;
  
  if (options.exact !== undefined) {
    const tolerance = options.tolerance || 0;
    const lowerBound = options.exact * (1 - tolerance / 100);
    const upperBound = options.exact * (1 + tolerance / 100);
    
    if (durationMillis < lowerBound || durationMillis > upperBound) {
      assert.fail(
        message || 
        `Span duration ${durationMillis}ms is outside the expected exact duration ${options.exact}ms ±${tolerance}%`
      );
    }
  } else {
    if (options.min !== undefined && durationMillis < options.min) {
      assert.fail(
        message || 
        `Span duration ${durationMillis}ms is less than minimum ${options.min}ms`
      );
    }
    
    if (options.max !== undefined && durationMillis > options.max) {
      assert.fail(
        message || 
        `Span duration ${durationMillis}ms is greater than maximum ${options.max}ms`
      );
    }
  }
}

/**
 * Asserts that a span started within the expected time range
 * @param span The span to check
 * @param options Time constraints
 * @param message Optional assertion message
 */
export function assertSpanStartTime(
  span: ReadableSpan,
  options: SpanTimeOptions,
  message?: string
): void {
  const startTimeMillis = span.startTime / 1000000;
  
  if (options.exact !== undefined) {
    const tolerance = options.tolerance || 0;
    const lowerBound = options.exact - tolerance;
    const upperBound = options.exact + tolerance;
    
    if (startTimeMillis < lowerBound || startTimeMillis > upperBound) {
      assert.fail(
        message || 
        `Span start time ${startTimeMillis}ms is outside the expected exact time ${options.exact}ms ±${tolerance}ms`
      );
    }
  } else {
    if (options.min !== undefined && startTimeMillis < options.min) {
      assert.fail(
        message || 
        `Span start time ${startTimeMillis}ms is earlier than minimum ${options.min}ms`
      );
    }
    
    if (options.max !== undefined && startTimeMillis > options.max) {
      assert.fail(
        message || 
        `Span start time ${startTimeMillis}ms is later than maximum ${options.max}ms`
      );
    }
  }
}

/**
 * Asserts that a span ended within the expected time range
 * @param span The span to check
 * @param options Time constraints
 * @param message Optional assertion message
 */
export function assertSpanEndTime(
  span: ReadableSpan,
  options: SpanTimeOptions,
  message?: string
): void {
  const endTimeMillis = span.endTime / 1000000;
  
  if (options.exact !== undefined) {
    const tolerance = options.tolerance || 0;
    const lowerBound = options.exact - tolerance;
    const upperBound = options.exact + tolerance;
    
    if (endTimeMillis < lowerBound || endTimeMillis > upperBound) {
      assert.fail(
        message || 
        `Span end time ${endTimeMillis}ms is outside the expected exact time ${options.exact}ms ±${tolerance}ms`
      );
    }
  } else {
    if (options.min !== undefined && endTimeMillis < options.min) {
      assert.fail(
        message || 
        `Span end time ${endTimeMillis}ms is earlier than minimum ${options.min}ms`
      );
    }
    
    if (options.max !== undefined && endTimeMillis > options.max) {
      assert.fail(
        message || 
        `Span end time ${endTimeMillis}ms is later than maximum ${options.max}ms`
      );
    }
  }
}

/**
 * Asserts that a span has an error status
 * @param span The span to check
 * @param message Optional assertion message
 */
export function assertSpanHasError(
  span: ReadableSpan,
  message?: string
): void {
  assert.strictEqual(
    span.status.code,
    SpanStatusCode.ERROR,
    message || 'Span does not have error status'
  );
}

/**
 * Asserts that a span has a specific error type recorded in an event
 * @param span The span to check
 * @param errorType The expected error type
 * @param message Optional assertion message
 */
export function assertSpanErrorType(
  span: ReadableSpan,
  errorType: string,
  message?: string
): void {
  assertSpanHasError(span, 'Span does not have error status');
  
  const exceptionEvent = findExceptionEvent(span);
  if (!exceptionEvent) {
    assert.fail(message || 'Span does not have an exception event');
  }
  
  const eventAttributes = exceptionEvent.attributes || {};
  assert.strictEqual(
    eventAttributes['exception.type'],
    errorType,
    message || `Span exception type does not match expected: ${errorType}`
  );
}

/**
 * Asserts that a span has a specific error message recorded in an event
 * @param span The span to check
 * @param errorMessage The expected error message
 * @param message Optional assertion message
 */
export function assertSpanErrorMessage(
  span: ReadableSpan,
  errorMessage: string,
  message?: string
): void {
  assertSpanHasError(span, 'Span does not have error status');
  
  const exceptionEvent = findExceptionEvent(span);
  if (!exceptionEvent) {
    assert.fail(message || 'Span does not have an exception event');
  }
  
  const eventAttributes = exceptionEvent.attributes || {};
  assert.strictEqual(
    eventAttributes['exception.message'],
    errorMessage,
    message || `Span exception message does not match expected: ${errorMessage}`
  );
}

/**
 * Asserts that a span has the expected Health journey attributes
 * @param span The span to check
 * @param options Health journey specific options
 * @param message Optional assertion message
 */
export function assertHealthJourneySpan(
  span: Span | ReadableSpan,
  options: JourneySpanOptions,
  message?: string
): void {
  const expectedAttributes: Record<string, unknown> = {
    'journey.type': 'health',
  };
  
  if (options.userId) {
    expectedAttributes['journey.user.id'] = options.userId;
  }
  
  if (options.correlationId) {
    expectedAttributes['journey.correlation_id'] = options.correlationId;
  }
  
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      expectedAttributes[`journey.health.${key}`] = value;
    });
  }
  
  assertSpanHasAttributes(span, expectedAttributes, message || 'Span is missing Health journey attributes');
}

/**
 * Asserts that a span has the expected Care journey attributes
 * @param span The span to check
 * @param options Care journey specific options
 * @param message Optional assertion message
 */
export function assertCareJourneySpan(
  span: Span | ReadableSpan,
  options: JourneySpanOptions,
  message?: string
): void {
  const expectedAttributes: Record<string, unknown> = {
    'journey.type': 'care',
  };
  
  if (options.userId) {
    expectedAttributes['journey.user.id'] = options.userId;
  }
  
  if (options.correlationId) {
    expectedAttributes['journey.correlation_id'] = options.correlationId;
  }
  
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      expectedAttributes[`journey.care.${key}`] = value;
    });
  }
  
  assertSpanHasAttributes(span, expectedAttributes, message || 'Span is missing Care journey attributes');
}

/**
 * Asserts that a span has the expected Plan journey attributes
 * @param span The span to check
 * @param options Plan journey specific options
 * @param message Optional assertion message
 */
export function assertPlanJourneySpan(
  span: Span | ReadableSpan,
  options: JourneySpanOptions,
  message?: string
): void {
  const expectedAttributes: Record<string, unknown> = {
    'journey.type': 'plan',
  };
  
  if (options.userId) {
    expectedAttributes['journey.user.id'] = options.userId;
  }
  
  if (options.correlationId) {
    expectedAttributes['journey.correlation_id'] = options.correlationId;
  }
  
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      expectedAttributes[`journey.plan.${key}`] = value;
    });
  }
  
  assertSpanHasAttributes(span, expectedAttributes, message || 'Span is missing Plan journey attributes');
}

/**
 * Helper function to get span attributes regardless of span type
 * @param span The span to extract attributes from
 * @returns The span attributes as a record
 */
function getSpanAttributes(span: Span | ReadableSpan): Record<string, unknown> {
  if ('attributes' in span) {
    // ReadableSpan from SDK
    return span.attributes;
  } else {
    // Regular Span - we can't directly access attributes
    // This is a limitation of the OpenTelemetry API
    // In real tests, you should use ReadableSpan from the SDK
    throw new Error('Cannot extract attributes from Span interface. Use ReadableSpan from SDK instead.');
  }
}

/**
 * Helper function to find an exception event in a span
 * @param span The span to search for exception events
 * @returns The exception event or undefined if not found
 */
function findExceptionEvent(span: ReadableSpan): { name: string; attributes?: Record<string, unknown> } | undefined {
  return span.events.find(event => event.name === 'exception');
}
import { Span, SpanStatusCode } from '@opentelemetry/api';
import { JourneyContextInfo } from '../../src/interfaces/trace-context.interface';
import { DEFAULT_SPAN_TIMEOUT_MS } from '../../src/constants/defaults';

/**
 * Interface representing a span with its attributes and metadata for testing purposes.
 */
export interface TestSpan extends Span {
  attributes?: Record<string, any>;
  status?: { code: SpanStatusCode };
  events?: Array<{
    name: string;
    attributes?: Record<string, any>;
    timestamp?: number;
  }>;
  links?: Array<{
    context: any;
    attributes?: Record<string, any>;
  }>;
  startTime?: number;
  endTime?: number;
  parentSpanId?: string;
  children?: TestSpan[];
}

/**
 * Options for span assertion functions.
 */
export interface SpanAssertionOptions {
  /** Whether to fail on missing attributes (default: true) */
  failOnMissingAttributes?: boolean;
  /** Whether to ignore additional attributes not specified in expected attributes (default: true) */
  ignoreAdditionalAttributes?: boolean;
  /** Custom error message prefix */
  errorMessagePrefix?: string;
}

/**
 * Options for span timing assertions.
 */
export interface SpanTimingAssertionOptions {
  /** Maximum allowed duration in milliseconds */
  maxDurationMs?: number;
  /** Minimum allowed duration in milliseconds */
  minDurationMs?: number;
  /** Custom error message prefix */
  errorMessagePrefix?: string;
}

/**
 * Default options for span assertions.
 */
const DEFAULT_ASSERTION_OPTIONS: SpanAssertionOptions = {
  failOnMissingAttributes: true,
  ignoreAdditionalAttributes: true,
  errorMessagePrefix: 'Span assertion failed:',
};

/**
 * Default options for span timing assertions.
 */
const DEFAULT_TIMING_ASSERTION_OPTIONS: SpanTimingAssertionOptions = {
  maxDurationMs: DEFAULT_SPAN_TIMEOUT_MS,
  minDurationMs: 0,
  errorMessagePrefix: 'Span timing assertion failed:',
};

/**
 * Asserts that a span has the expected attributes.
 * 
 * @param span The span to check
 * @param expectedAttributes The attributes that should be present on the span
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasAttributes(
  span: TestSpan,
  expectedAttributes: Record<string, any>,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const spanAttributes = span.attributes || {};
  
  // Check if all expected attributes are present with correct values
  for (const [key, expectedValue] of Object.entries(expectedAttributes)) {
    if (!(key in spanAttributes)) {
      if (opts.failOnMissingAttributes) {
        throw new Error(`${opts.errorMessagePrefix} Expected span to have attribute "${key}" but it was not found`);
      }
      continue;
    }
    
    const actualValue = spanAttributes[key];
    if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      throw new Error(
        `${opts.errorMessagePrefix} Expected span attribute "${key}" to be ${JSON.stringify(expectedValue)} but got ${JSON.stringify(actualValue)}`
      );
    }
  }
  
  // Optionally check if there are unexpected attributes
  if (!opts.ignoreAdditionalAttributes) {
    for (const key of Object.keys(spanAttributes)) {
      if (!(key in expectedAttributes)) {
        throw new Error(`${opts.errorMessagePrefix} Unexpected attribute "${key}" found on span`);
      }
    }
  }
}

/**
 * Asserts that a span has a specific attribute with the expected value.
 * 
 * @param span The span to check
 * @param attributeName The name of the attribute to check
 * @param expectedValue The expected value of the attribute
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasAttribute(
  span: TestSpan,
  attributeName: string,
  expectedValue: any,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const spanAttributes = span.attributes || {};
  
  if (!(attributeName in spanAttributes)) {
    throw new Error(`${opts.errorMessagePrefix} Expected span to have attribute "${attributeName}" but it was not found`);
  }
  
  const actualValue = spanAttributes[attributeName];
  if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
    throw new Error(
      `${opts.errorMessagePrefix} Expected span attribute "${attributeName}" to be ${JSON.stringify(expectedValue)} but got ${JSON.stringify(actualValue)}`
    );
  }
}

/**
 * Asserts that a span has the expected name.
 * 
 * @param span The span to check
 * @param expectedName The expected name of the span
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasName(
  span: TestSpan,
  expectedName: string,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  
  if (span.name !== expectedName) {
    throw new Error(
      `${opts.errorMessagePrefix} Expected span name to be "${expectedName}" but got "${span.name}"`
    );
  }
}

/**
 * Asserts that a span has the expected status.
 * 
 * @param span The span to check
 * @param expectedStatus The expected status of the span
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasStatus(
  span: TestSpan,
  expectedStatus: SpanStatusCode,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const spanStatus = span.status?.code;
  
  if (spanStatus !== expectedStatus) {
    throw new Error(
      `${opts.errorMessagePrefix} Expected span status to be ${SpanStatusCode[expectedStatus]} but got ${spanStatus ? SpanStatusCode[spanStatus] : 'undefined'}`
    );
  }
}

/**
 * Asserts that a span has an event with the expected name and attributes.
 * 
 * @param span The span to check
 * @param eventName The expected name of the event
 * @param expectedAttributes The expected attributes of the event (optional)
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasEvent(
  span: TestSpan,
  eventName: string,
  expectedAttributes?: Record<string, any>,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const events = span.events || [];
  
  const matchingEvents = events.filter(event => event.name === eventName);
  
  if (matchingEvents.length === 0) {
    throw new Error(`${opts.errorMessagePrefix} Expected span to have event "${eventName}" but it was not found`);
  }
  
  if (expectedAttributes) {
    // Check if any of the matching events have the expected attributes
    const eventWithMatchingAttributes = matchingEvents.find(event => {
      const eventAttributes = event.attributes || {};
      return Object.entries(expectedAttributes).every(([key, expectedValue]) => {
        return key in eventAttributes && JSON.stringify(eventAttributes[key]) === JSON.stringify(expectedValue);
      });
    });
    
    if (!eventWithMatchingAttributes) {
      throw new Error(
        `${opts.errorMessagePrefix} Expected span to have event "${eventName}" with attributes ${JSON.stringify(expectedAttributes)} but no matching event was found`
      );
    }
  }
}

/**
 * Asserts that a span has an exception event with the expected attributes.
 * 
 * @param span The span to check
 * @param expectedExceptionType The expected exception type (optional)
 * @param expectedExceptionMessage The expected exception message (optional)
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasException(
  span: TestSpan,
  expectedExceptionType?: string,
  expectedExceptionMessage?: string,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const expectedAttributes: Record<string, any> = {};
  
  if (expectedExceptionType) {
    expectedAttributes['exception.type'] = expectedExceptionType;
  }
  
  if (expectedExceptionMessage) {
    expectedAttributes['exception.message'] = expectedExceptionMessage;
  }
  
  assertSpanHasEvent(span, 'exception', expectedAttributes, opts);
  assertSpanHasStatus(span, SpanStatusCode.ERROR, opts);
}

/**
 * Asserts that a span has the expected parent span.
 * 
 * @param span The span to check
 * @param parentSpan The expected parent span
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasParent(
  span: TestSpan,
  parentSpan: TestSpan,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  
  if (!span.parentSpanId) {
    throw new Error(`${opts.errorMessagePrefix} Expected span to have a parent but it does not`);
  }
  
  const parentSpanId = parentSpan.spanContext?.().spanId;
  
  if (span.parentSpanId !== parentSpanId) {
    throw new Error(
      `${opts.errorMessagePrefix} Expected span to have parent with ID "${parentSpanId}" but got "${span.parentSpanId}"`
    );
  }
}

/**
 * Asserts that a span is a child of the expected parent span.
 * 
 * @param parentSpan The expected parent span
 * @param childSpan The child span to check
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasChild(
  parentSpan: TestSpan,
  childSpan: TestSpan,
  options: SpanAssertionOptions = {}
): void {
  assertSpanHasParent(childSpan, parentSpan, options);
}

/**
 * Asserts that a span has the expected timing characteristics.
 * 
 * @param span The span to check
 * @param options Options for the timing assertion
 * @throws Error if the assertion fails
 */
export function assertSpanTiming(
  span: TestSpan,
  options: SpanTimingAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_TIMING_ASSERTION_OPTIONS, ...options };
  
  if (!span.startTime || !span.endTime) {
    throw new Error(`${opts.errorMessagePrefix} Span does not have start or end time`);
  }
  
  const durationMs = span.endTime - span.startTime;
  
  if (opts.maxDurationMs !== undefined && durationMs > opts.maxDurationMs) {
    throw new Error(
      `${opts.errorMessagePrefix} Span duration ${durationMs}ms exceeds maximum allowed ${opts.maxDurationMs}ms`
    );
  }
  
  if (opts.minDurationMs !== undefined && durationMs < opts.minDurationMs) {
    throw new Error(
      `${opts.errorMessagePrefix} Span duration ${durationMs}ms is less than minimum required ${opts.minDurationMs}ms`
    );
  }
}

/**
 * Asserts that a span has completed (has an end time).
 * 
 * @param span The span to check
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanIsComplete(
  span: TestSpan,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  
  if (!span.endTime) {
    throw new Error(`${opts.errorMessagePrefix} Expected span to be complete but it has no end time`);
  }
}

/**
 * Asserts that a span has the expected journey context attributes.
 * 
 * @param span The span to check
 * @param expectedJourneyContext The expected journey context
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasJourneyContext(
  span: TestSpan,
  expectedJourneyContext: JourneyContextInfo,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const expectedAttributes: Record<string, any> = {
    'journey.type': expectedJourneyContext.journeyType,
    'journey.id': expectedJourneyContext.journeyId,
  };
  
  if (expectedJourneyContext.userId) {
    expectedAttributes['user.id'] = expectedJourneyContext.userId;
  }
  
  if (expectedJourneyContext.sessionId) {
    expectedAttributes['session.id'] = expectedJourneyContext.sessionId;
  }
  
  if (expectedJourneyContext.requestId) {
    expectedAttributes['request.id'] = expectedJourneyContext.requestId;
  }
  
  assertSpanHasAttributes(span, expectedAttributes, opts);
}

/**
 * Asserts that a span has health journey context attributes.
 * 
 * @param span The span to check
 * @param journeyId The expected journey ID
 * @param userId The expected user ID (optional)
 * @param sessionId The expected session ID (optional)
 * @param requestId The expected request ID (optional)
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasHealthJourneyContext(
  span: TestSpan,
  journeyId: string,
  userId?: string,
  sessionId?: string,
  requestId?: string,
  options: SpanAssertionOptions = {}
): void {
  assertSpanHasJourneyContext(
    span,
    {
      journeyType: 'health',
      journeyId,
      userId,
      sessionId,
      requestId,
    },
    options
  );
}

/**
 * Asserts that a span has care journey context attributes.
 * 
 * @param span The span to check
 * @param journeyId The expected journey ID
 * @param userId The expected user ID (optional)
 * @param sessionId The expected session ID (optional)
 * @param requestId The expected request ID (optional)
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasCareJourneyContext(
  span: TestSpan,
  journeyId: string,
  userId?: string,
  sessionId?: string,
  requestId?: string,
  options: SpanAssertionOptions = {}
): void {
  assertSpanHasJourneyContext(
    span,
    {
      journeyType: 'care',
      journeyId,
      userId,
      sessionId,
      requestId,
    },
    options
  );
}

/**
 * Asserts that a span has plan journey context attributes.
 * 
 * @param span The span to check
 * @param journeyId The expected journey ID
 * @param userId The expected user ID (optional)
 * @param sessionId The expected session ID (optional)
 * @param requestId The expected request ID (optional)
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasPlanJourneyContext(
  span: TestSpan,
  journeyId: string,
  userId?: string,
  sessionId?: string,
  requestId?: string,
  options: SpanAssertionOptions = {}
): void {
  assertSpanHasJourneyContext(
    span,
    {
      journeyType: 'plan',
      journeyId,
      userId,
      sessionId,
      requestId,
    },
    options
  );
}

/**
 * Asserts that a span has the expected trace ID.
 * 
 * @param span The span to check
 * @param expectedTraceId The expected trace ID
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasTraceId(
  span: TestSpan,
  expectedTraceId: string,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const traceId = span.spanContext?.().traceId;
  
  if (traceId !== expectedTraceId) {
    throw new Error(
      `${opts.errorMessagePrefix} Expected span to have trace ID "${expectedTraceId}" but got "${traceId}"`
    );
  }
}

/**
 * Asserts that a span has the expected span ID.
 * 
 * @param span The span to check
 * @param expectedSpanId The expected span ID
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHasSpanId(
  span: TestSpan,
  expectedSpanId: string,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const spanId = span.spanContext?.().spanId;
  
  if (spanId !== expectedSpanId) {
    throw new Error(
      `${opts.errorMessagePrefix} Expected span to have span ID "${expectedSpanId}" but got "${spanId}"`
    );
  }
}

/**
 * Asserts that a span is sampled (will be recorded).
 * 
 * @param span The span to check
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanIsSampled(
  span: TestSpan,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  
  if (!span.isRecording()) {
    throw new Error(`${opts.errorMessagePrefix} Expected span to be sampled but it is not`);
  }
}

/**
 * Asserts that a span has the expected hierarchy of child spans.
 * 
 * @param rootSpan The root span to check
 * @param expectedHierarchy The expected hierarchy of child spans (names or name patterns)
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanHierarchy(
  rootSpan: TestSpan,
  expectedHierarchy: Array<string | RegExp | Array<string | RegExp>>,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const children = rootSpan.children || [];
  
  // Check first level of hierarchy
  for (const expected of expectedHierarchy) {
    if (Array.isArray(expected)) {
      // This is a nested hierarchy, find the matching child and check its children
      const childName = expected[0];
      const matchingChild = findMatchingSpan(children, childName);
      
      if (!matchingChild) {
        throw new Error(
          `${opts.errorMessagePrefix} Expected span to have child matching "${childName}" but none was found`
        );
      }
      
      // Check the nested hierarchy for this child
      assertSpanHierarchy(matchingChild, expected.slice(1) as any, opts);
    } else {
      // This is a direct child, check if it exists
      const matchingChild = findMatchingSpan(children, expected);
      
      if (!matchingChild) {
        throw new Error(
          `${opts.errorMessagePrefix} Expected span to have child matching "${expected}" but none was found`
        );
      }
    }
  }
}

/**
 * Helper function to find a span matching a name or pattern.
 * 
 * @param spans The spans to search
 * @param nameOrPattern The name or pattern to match
 * @returns The matching span or undefined if not found
 */
function findMatchingSpan(spans: TestSpan[], nameOrPattern: string | RegExp): TestSpan | undefined {
  return spans.find(span => {
    if (typeof nameOrPattern === 'string') {
      return span.name === nameOrPattern;
    } else {
      return nameOrPattern.test(span.name);
    }
  });
}

/**
 * Asserts that a span has the expected number of child spans.
 * 
 * @param span The span to check
 * @param expectedCount The expected number of child spans
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanChildCount(
  span: TestSpan,
  expectedCount: number,
  options: SpanAssertionOptions = {}
): void {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const children = span.children || [];
  
  if (children.length !== expectedCount) {
    throw new Error(
      `${opts.errorMessagePrefix} Expected span to have ${expectedCount} children but got ${children.length}`
    );
  }
}

/**
 * Asserts that a span has a child span with the expected name.
 * 
 * @param span The span to check
 * @param expectedChildName The expected name of the child span
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 * @returns The matching child span
 */
export function assertSpanHasChildWithName(
  span: TestSpan,
  expectedChildName: string,
  options: SpanAssertionOptions = {}
): TestSpan {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const children = span.children || [];
  
  const matchingChild = children.find(child => child.name === expectedChildName);
  
  if (!matchingChild) {
    throw new Error(
      `${opts.errorMessagePrefix} Expected span to have child with name "${expectedChildName}" but none was found`
    );
  }
  
  return matchingChild;
}

/**
 * Asserts that a span has a child span matching the expected name pattern.
 * 
 * @param span The span to check
 * @param namePattern The expected name pattern of the child span
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 * @returns The matching child span
 */
export function assertSpanHasChildMatching(
  span: TestSpan,
  namePattern: RegExp,
  options: SpanAssertionOptions = {}
): TestSpan {
  const opts = { ...DEFAULT_ASSERTION_OPTIONS, ...options };
  const children = span.children || [];
  
  const matchingChild = children.find(child => namePattern.test(child.name));
  
  if (!matchingChild) {
    throw new Error(
      `${opts.errorMessagePrefix} Expected span to have child matching pattern ${namePattern} but none was found`
    );
  }
  
  return matchingChild;
}

/**
 * Asserts that all spans in a trace have the expected journey context.
 * 
 * @param rootSpan The root span of the trace
 * @param expectedJourneyContext The expected journey context
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertTraceHasJourneyContext(
  rootSpan: TestSpan,
  expectedJourneyContext: JourneyContextInfo,
  options: SpanAssertionOptions = {}
): void {
  // Check the root span
  assertSpanHasJourneyContext(rootSpan, expectedJourneyContext, options);
  
  // Check all child spans recursively
  const children = rootSpan.children || [];
  for (const child of children) {
    assertTraceHasJourneyContext(child, expectedJourneyContext, options);
  }
}

/**
 * Asserts that a span and all its children have the expected trace ID.
 * 
 * @param rootSpan The root span of the trace
 * @param expectedTraceId The expected trace ID
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertTraceHasTraceId(
  rootSpan: TestSpan,
  expectedTraceId: string,
  options: SpanAssertionOptions = {}
): void {
  // Check the root span
  assertSpanHasTraceId(rootSpan, expectedTraceId, options);
  
  // Check all child spans recursively
  const children = rootSpan.children || [];
  for (const child of children) {
    assertTraceHasTraceId(child, expectedTraceId, options);
  }
}

/**
 * Asserts that a span has the expected performance characteristics.
 * 
 * @param span The span to check
 * @param expectedMaxDurationMs The maximum allowed duration in milliseconds
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertSpanPerformance(
  span: TestSpan,
  expectedMaxDurationMs: number,
  options: SpanTimingAssertionOptions = {}
): void {
  assertSpanTiming(span, { ...options, maxDurationMs: expectedMaxDurationMs });
}

/**
 * Asserts that all spans in a trace meet the expected performance characteristics.
 * 
 * @param rootSpan The root span of the trace
 * @param spanPerformanceMap Map of span name patterns to maximum allowed durations
 * @param options Options for the assertion
 * @throws Error if the assertion fails
 */
export function assertTracePerformance(
  rootSpan: TestSpan,
  spanPerformanceMap: Record<string | RegExp, number>,
  options: SpanTimingAssertionOptions = {}
): void {
  // Check the root span if it has a matching pattern
  checkSpanAgainstPerformanceMap(rootSpan, spanPerformanceMap, options);
  
  // Check all child spans recursively
  const children = rootSpan.children || [];
  for (const child of children) {
    assertTracePerformance(child, spanPerformanceMap, options);
  }
}

/**
 * Helper function to check a span against a performance map.
 * 
 * @param span The span to check
 * @param spanPerformanceMap Map of span name patterns to maximum allowed durations
 * @param options Options for the assertion
 */
function checkSpanAgainstPerformanceMap(
  span: TestSpan,
  spanPerformanceMap: Record<string | RegExp, number>,
  options: SpanTimingAssertionOptions = {}
): void {
  for (const [patternStr, maxDurationMs] of Object.entries(spanPerformanceMap)) {
    const pattern = typeof patternStr === 'string' ? new RegExp(`^${patternStr}$`) : patternStr as RegExp;
    
    if (pattern.test(span.name)) {
      assertSpanPerformance(span, maxDurationMs, options);
      break;
    }
  }
}
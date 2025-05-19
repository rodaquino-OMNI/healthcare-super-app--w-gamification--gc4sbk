/**
 * @file event-comparison.ts
 * @description Provides utilities for comparing events in test assertions with customizable matching logic and detailed error reporting.
 * This helper simplifies testing by offering granular control over event comparison, from precise equality to partial matching
 * or specific field validation, supporting both unit and integration testing of event processing.
 */

import { diff } from 'jest-diff';
import { IBaseEvent } from '../../src/interfaces/base-event.interface';
import {
  JourneyEvent,
  HealthJourneyEvent,
  CareJourneyEvent,
  PlanJourneyEvent,
  isHealthJourneyEvent,
  isCareJourneyEvent,
  isPlanJourneyEvent,
  JourneyType,
} from '../../src/interfaces/journey-events.interface';

/**
 * Options for event comparison
 */
export interface EventComparisonOptions {
  /**
   * Fields to ignore during comparison
   * @example ['eventId', 'timestamp', 'metadata']
   */
  ignoreFields?: string[];

  /**
   * Whether to perform a partial match (only compare fields present in expected)
   * @default false
   */
  partialMatch?: boolean;

  /**
   * Tolerance in milliseconds for timestamp comparison
   * @default 0 (exact match)
   */
  timestampTolerance?: number;

  /**
   * Custom field comparators for specific fields
   * @example { 'payload.value': (expected, actual) => Math.abs(expected - actual) < 0.001 }
   */
  fieldComparators?: Record<string, (expected: any, actual: any) => boolean>;

  /**
   * Whether to include a detailed diff in the error message
   * @default true
   */
  includeDiff?: boolean;

  /**
   * Whether to perform a deep comparison of objects
   * @default true
   */
  deep?: boolean;

  /**
   * Whether to ignore extra fields in the actual object
   * @default false
   */
  ignoreExtraFields?: boolean;
}

/**
 * Result of an event comparison
 */
export interface EventComparisonResult {
  /**
   * Whether the comparison was successful
   */
  success: boolean;

  /**
   * Error message if the comparison failed
   */
  message?: string;

  /**
   * Detailed diff between expected and actual
   */
  diff?: string;

  /**
   * List of mismatched fields
   */
  mismatchedFields?: string[];

  /**
   * Expected event
   */
  expected: IBaseEvent;

  /**
   * Actual event
   */
  actual: IBaseEvent;
}

/**
 * Default comparison options
 */
const DEFAULT_COMPARISON_OPTIONS: EventComparisonOptions = {
  ignoreFields: [],
  partialMatch: false,
  timestampTolerance: 0,
  fieldComparators: {},
  includeDiff: true,
  deep: true,
  ignoreExtraFields: false,
};

/**
 * Compares two events for equality with customizable options
 * @param expected Expected event
 * @param actual Actual event
 * @param options Comparison options
 * @returns Comparison result
 */
export function compareEvents<T extends IBaseEvent = IBaseEvent>(
  expected: T,
  actual: T,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Merge options with defaults
  const opts = { ...DEFAULT_COMPARISON_OPTIONS, ...options };

  // Create copies of the events to avoid modifying the originals
  const expectedCopy = JSON.parse(JSON.stringify(expected));
  const actualCopy = JSON.parse(JSON.stringify(actual));

  // Remove ignored fields
  if (opts.ignoreFields && opts.ignoreFields.length > 0) {
    removeFields(expectedCopy, opts.ignoreFields);
    removeFields(actualCopy, opts.ignoreFields);
  }

  // Handle timestamp comparison with tolerance
  if (opts.timestampTolerance && opts.timestampTolerance > 0) {
    if (!compareTimestamps(expectedCopy.timestamp, actualCopy.timestamp, opts.timestampTolerance)) {
      return createFailureResult(
        expectedCopy,
        actualCopy,
        [`Timestamp difference exceeds tolerance of ${opts.timestampTolerance}ms`],
        opts.includeDiff
      );
    }

    // Remove timestamp from comparison since we've already checked it
    delete expectedCopy.timestamp;
    delete actualCopy.timestamp;
  }

  // Apply custom field comparators
  const mismatchedFields: string[] = [];
  if (opts.fieldComparators && Object.keys(opts.fieldComparators).length > 0) {
    for (const [fieldPath, comparator] of Object.entries(opts.fieldComparators)) {
      const expectedValue = getNestedValue(expectedCopy, fieldPath);
      const actualValue = getNestedValue(actualCopy, fieldPath);

      // Skip if the field doesn't exist in the expected object
      if (expectedValue === undefined) continue;

      // Apply the custom comparator
      if (!comparator(expectedValue, actualValue)) {
        mismatchedFields.push(fieldPath);
      }

      // Remove the field from both objects since we've already compared it
      removeNestedField(expectedCopy, fieldPath);
      removeNestedField(actualCopy, fieldPath);
    }
  }

  // Perform the comparison
  let isEqual: boolean;
  if (opts.partialMatch) {
    isEqual = comparePartial(expectedCopy, actualCopy, opts.deep);
  } else if (opts.ignoreExtraFields) {
    isEqual = compareIgnoringExtra(expectedCopy, actualCopy, opts.deep);
  } else {
    isEqual = compareDeep(expectedCopy, actualCopy);
  }

  // Return the result
  if (isEqual && mismatchedFields.length === 0) {
    return {
      success: true,
      expected,
      actual,
    };
  } else {
    return createFailureResult(
      expected,
      actual,
      mismatchedFields,
      opts.includeDiff
    );
  }
}

/**
 * Compares two journey events with journey-specific options
 * @param expected Expected journey event
 * @param actual Actual journey event
 * @param options Comparison options
 * @returns Comparison result
 */
export function compareJourneyEvents(
  expected: JourneyEvent,
  actual: JourneyEvent,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Verify that both events are of the same journey type
  if (expected.journeyType !== actual.journeyType) {
    return createFailureResult(
      expected,
      actual,
      [`Journey type mismatch: expected ${expected.journeyType}, got ${actual.journeyType}`],
      options.includeDiff ?? true
    );
  }

  // Apply journey-specific comparison based on the journey type
  if (isHealthJourneyEvent(expected) && isHealthJourneyEvent(actual)) {
    return compareHealthJourneyEvents(expected, actual, options);
  } else if (isCareJourneyEvent(expected) && isCareJourneyEvent(actual)) {
    return compareCareJourneyEvents(expected, actual, options);
  } else if (isPlanJourneyEvent(expected) && isPlanJourneyEvent(actual)) {
    return comparePlanJourneyEvents(expected, actual, options);
  } else {
    // Fall back to generic event comparison
    return compareEvents(expected, actual, options);
  }
}

/**
 * Compares two health journey events
 * @param expected Expected health journey event
 * @param actual Actual health journey event
 * @param options Comparison options
 * @returns Comparison result
 */
export function compareHealthJourneyEvents(
  expected: HealthJourneyEvent,
  actual: HealthJourneyEvent,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Default health journey comparison options
  const healthOptions: EventComparisonOptions = {
    // Ignore fields that might be different in tests
    ignoreFields: [...(options.ignoreFields || []), 'metadata.traceId'],
    // Add health-specific field comparators
    fieldComparators: {
      ...(options.fieldComparators || {}),
      // Example: Allow small differences in health metric values
      'payload.value': (expected, actual) => {
        if (typeof expected === 'number' && typeof actual === 'number') {
          return Math.abs(expected - actual) < 0.001;
        }
        return expected === actual;
      },
    },
    ...options,
  };

  return compareEvents(expected, actual, healthOptions);
}

/**
 * Compares two care journey events
 * @param expected Expected care journey event
 * @param actual Actual care journey event
 * @param options Comparison options
 * @returns Comparison result
 */
export function compareCareJourneyEvents(
  expected: CareJourneyEvent,
  actual: CareJourneyEvent,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Default care journey comparison options
  const careOptions: EventComparisonOptions = {
    // Ignore fields that might be different in tests
    ignoreFields: [...(options.ignoreFields || []), 'metadata.traceId'],
    // Add care-specific field comparators
    fieldComparators: {
      ...(options.fieldComparators || {}),
      // Example: Compare appointment dates with tolerance
      'payload.appointmentDate': (expected, actual) => {
        return compareTimestamps(expected, actual, 60000); // 1 minute tolerance
      },
    },
    ...options,
  };

  return compareEvents(expected, actual, careOptions);
}

/**
 * Compares two plan journey events
 * @param expected Expected plan journey event
 * @param actual Actual plan journey event
 * @param options Comparison options
 * @returns Comparison result
 */
export function comparePlanJourneyEvents(
  expected: PlanJourneyEvent,
  actual: PlanJourneyEvent,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Default plan journey comparison options
  const planOptions: EventComparisonOptions = {
    // Ignore fields that might be different in tests
    ignoreFields: [...(options.ignoreFields || []), 'metadata.traceId'],
    // Add plan-specific field comparators
    fieldComparators: {
      ...(options.fieldComparators || {}),
      // Example: Compare monetary values with small tolerance
      'payload.amount': (expected, actual) => {
        if (typeof expected === 'number' && typeof actual === 'number') {
          return Math.abs(expected - actual) < 0.01; // 1 cent tolerance
        }
        return expected === actual;
      },
    },
    ...options,
  };

  return compareEvents(expected, actual, planOptions);
}

/**
 * Creates a matcher for Jest that compares events
 * @param expected Expected event
 * @param options Comparison options
 * @returns Jest matcher result
 */
export function toMatchEvent<T extends IBaseEvent = IBaseEvent>(
  actual: T,
  expected: T,
  options: EventComparisonOptions = {}
): { message: () => string; pass: boolean } {
  const result = compareEvents(expected, actual, options);

  return {
    pass: result.success,
    message: () => result.message || 'Events match',
  };
}

/**
 * Creates a matcher for Jest that compares journey events
 * @param expected Expected journey event
 * @param options Comparison options
 * @returns Jest matcher result
 */
export function toMatchJourneyEvent(
  actual: JourneyEvent,
  expected: JourneyEvent,
  options: EventComparisonOptions = {}
): { message: () => string; pass: boolean } {
  const result = compareJourneyEvents(expected, actual, options);

  return {
    pass: result.success,
    message: () => result.message || 'Journey events match',
  };
}

/**
 * Creates a partial event matcher for Jest
 * @param expected Partial expected event
 * @returns Jest matcher result
 */
export function toMatchEventPartially<T extends Partial<IBaseEvent> = Partial<IBaseEvent>>(
  actual: IBaseEvent,
  expected: T,
  options: EventComparisonOptions = {}
): { message: () => string; pass: boolean } {
  const partialOptions: EventComparisonOptions = {
    ...options,
    partialMatch: true,
  };

  const result = compareEvents(expected as IBaseEvent, actual, partialOptions);

  return {
    pass: result.success,
    message: () => result.message || 'Events match partially',
  };
}

/**
 * Creates a matcher for Jest that compares event timestamps with tolerance
 * @param expected Expected event
 * @param toleranceMs Tolerance in milliseconds
 * @returns Jest matcher result
 */
export function toMatchEventTimestamp(
  actual: IBaseEvent,
  expected: IBaseEvent,
  toleranceMs: number = 1000
): { message: () => string; pass: boolean } {
  const timestampOptions: EventComparisonOptions = {
    ignoreFields: ['eventId', 'payload', 'metadata', 'source', 'type', 'version'],
    timestampTolerance: toleranceMs,
  };

  const result = compareEvents(expected, actual, timestampOptions);

  return {
    pass: result.success,
    message: () => result.message || 'Event timestamps match within tolerance',
  };
}

/**
 * Creates a matcher for Jest that compares event payloads
 * @param expected Expected event payload
 * @param options Comparison options
 * @returns Jest matcher result
 */
export function toMatchEventPayload<T = unknown>(
  actual: IBaseEvent<T>,
  expected: T,
  options: EventComparisonOptions = {}
): { message: () => string; pass: boolean } {
  const payloadOptions: EventComparisonOptions = {
    ...options,
    ignoreFields: [...(options.ignoreFields || []), 'eventId', 'timestamp', 'metadata', 'source', 'type', 'version'],
  };

  // Create a simplified event with just the payload for comparison
  const expectedEvent = { payload: expected } as IBaseEvent<T>;
  const actualEvent = { payload: actual.payload } as IBaseEvent<T>;

  const result = compareEvents(expectedEvent, actualEvent, payloadOptions);

  return {
    pass: result.success,
    message: () => result.message || 'Event payloads match',
  };
}

// ===== HELPER FUNCTIONS =====

/**
 * Removes fields from an object
 * @param obj Object to modify
 * @param fields Fields to remove
 */
function removeFields(obj: any, fields: string[]): void {
  if (!obj || typeof obj !== 'object') return;

  for (const field of fields) {
    if (field.includes('.')) {
      // Handle nested fields
      const [first, ...rest] = field.split('.');
      if (obj[first] && typeof obj[first] === 'object') {
        removeFields(obj[first], [rest.join('.')]);
      }
    } else {
      // Handle top-level fields
      delete obj[field];
    }
  }
}

/**
 * Removes a nested field from an object
 * @param obj Object to modify
 * @param fieldPath Path to the field (dot notation)
 */
function removeNestedField(obj: any, fieldPath: string): void {
  if (!obj || typeof obj !== 'object') return;

  const parts = fieldPath.split('.');
  const lastPart = parts.pop();

  if (!lastPart) return;

  let current = obj;
  for (const part of parts) {
    if (current[part] === undefined || current[part] === null) return;
    current = current[part];
  }

  delete current[lastPart];
}

/**
 * Gets a nested value from an object
 * @param obj Object to get value from
 * @param fieldPath Path to the field (dot notation)
 * @returns The value at the specified path, or undefined if not found
 */
function getNestedValue(obj: any, fieldPath: string): any {
  if (!obj || typeof obj !== 'object') return undefined;

  const parts = fieldPath.split('.');
  let current = obj;

  for (const part of parts) {
    if (current[part] === undefined) return undefined;
    current = current[part];
  }

  return current;
}

/**
 * Compares two timestamps with tolerance
 * @param expected Expected timestamp (ISO string)
 * @param actual Actual timestamp (ISO string)
 * @param toleranceMs Tolerance in milliseconds
 * @returns Whether the timestamps are within tolerance
 */
function compareTimestamps(expected: string, actual: string, toleranceMs: number): boolean {
  if (!expected || !actual) return expected === actual;

  try {
    const expectedDate = new Date(expected).getTime();
    const actualDate = new Date(actual).getTime();
    const difference = Math.abs(expectedDate - actualDate);

    return difference <= toleranceMs;
  } catch (error) {
    // If parsing fails, fall back to string comparison
    return expected === actual;
  }
}

/**
 * Performs a deep comparison of two objects
 * @param expected Expected object
 * @param actual Actual object
 * @returns Whether the objects are deeply equal
 */
function compareDeep(expected: any, actual: any): boolean {
  // Handle primitive types
  if (expected === actual) return true;
  if (expected === null || actual === null) return expected === actual;
  if (typeof expected !== 'object' || typeof actual !== 'object') return expected === actual;

  // Handle arrays
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) return false;
    return expected.every((item, index) => compareDeep(item, actual[index]));
  }

  // Handle objects
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);

  if (expectedKeys.length !== actualKeys.length) return false;

  return expectedKeys.every(key => {
    return actualKeys.includes(key) && compareDeep(expected[key], actual[key]);
  });
}

/**
 * Performs a partial comparison of two objects
 * @param expected Expected object (subset)
 * @param actual Actual object
 * @param deep Whether to perform deep comparison
 * @returns Whether the actual object contains all expected properties with matching values
 */
function comparePartial(expected: any, actual: any, deep: boolean = true): boolean {
  // Handle primitive types
  if (expected === actual) return true;
  if (expected === null || actual === null) return expected === actual;
  if (typeof expected !== 'object' || typeof actual !== 'object') return expected === actual;

  // Handle arrays
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length > actual.length) return false;
    return expected.every((item, index) => {
      return deep ? compareDeep(item, actual[index]) : item === actual[index];
    });
  }

  // Handle objects
  return Object.keys(expected).every(key => {
    if (!(key in actual)) return false;
    return deep ? compareDeep(expected[key], actual[key]) : expected[key] === actual[key];
  });
}

/**
 * Performs a comparison ignoring extra fields in the actual object
 * @param expected Expected object
 * @param actual Actual object
 * @param deep Whether to perform deep comparison
 * @returns Whether the actual object contains all expected properties with matching values
 */
function compareIgnoringExtra(expected: any, actual: any, deep: boolean = true): boolean {
  // Handle primitive types
  if (expected === actual) return true;
  if (expected === null || actual === null) return expected === actual;
  if (typeof expected !== 'object' || typeof actual !== 'object') return expected === actual;

  // Handle arrays
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) return false;
    return expected.every((item, index) => {
      return deep ? compareDeep(item, actual[index]) : item === actual[index];
    });
  }

  // Handle objects - only check keys from expected
  return Object.keys(expected).every(key => {
    if (!(key in actual)) return false;
    return deep ? compareDeep(expected[key], actual[key]) : expected[key] === actual[key];
  });
}

/**
 * Creates a failure result for event comparison
 * @param expected Expected event
 * @param actual Actual event
 * @param mismatchedFields List of mismatched fields
 * @param includeDiff Whether to include a detailed diff
 * @returns Failure result
 */
function createFailureResult(
  expected: any,
  actual: any,
  mismatchedFields: string[] = [],
  includeDiff: boolean = true
): EventComparisonResult {
  let message = 'Event comparison failed';

  if (mismatchedFields.length > 0) {
    message += `\nMismatched fields: ${mismatchedFields.join(', ')}`;
  }

  let diffOutput: string | undefined;
  if (includeDiff) {
    diffOutput = diff(expected, actual, {
      expand: false,
      contextLines: 3,
    });
    message += `\n\nDiff: ${diffOutput}`;
  }

  return {
    success: false,
    message,
    diff: diffOutput,
    mismatchedFields,
    expected,
    actual,
  };
}

/**
 * Extends Jest's expect with custom event matchers
 */
export function extendJestWithEventMatchers(): void {
  expect.extend({
    toMatchEvent,
    toMatchJourneyEvent,
    toMatchEventPartially,
    toMatchEventTimestamp,
    toMatchEventPayload,
  });
}

// Add type definitions for the custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchEvent<T extends IBaseEvent>(expected: T, options?: EventComparisonOptions): R;
      toMatchJourneyEvent(expected: JourneyEvent, options?: EventComparisonOptions): R;
      toMatchEventPartially<T extends Partial<IBaseEvent>>(expected: T, options?: EventComparisonOptions): R;
      toMatchEventTimestamp(expected: IBaseEvent, toleranceMs?: number): R;
      toMatchEventPayload<T>(expected: T, options?: EventComparisonOptions): R;
    }
  }
}
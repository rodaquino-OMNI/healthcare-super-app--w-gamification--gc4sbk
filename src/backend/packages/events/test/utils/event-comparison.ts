/**
 * @file event-comparison.ts
 * @description Provides utilities for comparing events in test assertions with customizable matching logic
 * and detailed error reporting. This helper simplifies testing by offering granular control over event
 * comparison, from precise equality to partial matching or specific field validation, supporting both
 * unit and integration testing of event processing.
 */

import { diff } from 'jest-diff';
import { BaseEvent, EventMetadata } from '../../src/interfaces/base-event.interface';
import { 
  JourneyType, 
  IHealthEvent, 
  ICareEvent, 
  IPlanEvent,
  HealthEventType,
  CareEventType,
  PlanEventType,
  isHealthEvent,
  isCareEvent,
  isPlanEvent
} from '../../src/interfaces/journey-events.interface';

/**
 * Options for event comparison
 */
export interface EventComparisonOptions {
  /**
   * Whether to ignore specific fields during comparison
   */
  ignoreFields?: string[];

  /**
   * Fields to include in the comparison (if specified, only these fields are compared)
   */
  includeFields?: string[];

  /**
   * Whether to ignore event metadata during comparison
   * @default true
   */
  ignoreMetadata?: boolean;

  /**
   * Whether to allow partial matching of objects
   * @default false
   */
  partial?: boolean;

  /**
   * Tolerance in milliseconds for timestamp comparisons
   * @default 1000 (1 second)
   */
  timestampToleranceMs?: number;

  /**
   * Fields to treat as timestamps for tolerance comparison
   * @default ['timestamp']
   */
  timestampFields?: string[];

  /**
   * Custom field comparators for specific fields
   */
  fieldComparators?: Record<string, FieldComparator>;

  /**
   * Whether to generate detailed diff output for failed comparisons
   * @default true
   */
  generateDiff?: boolean;

  /**
   * Whether to ignore event ID during comparison
   * @default true
   */
  ignoreEventId?: boolean;

  /**
   * Whether to ignore event version during comparison
   * @default false
   */
  ignoreVersion?: boolean;
}

/**
 * Default comparison options
 */
const DEFAULT_COMPARISON_OPTIONS: EventComparisonOptions = {
  ignoreMetadata: true,
  partial: false,
  timestampToleranceMs: 1000,
  timestampFields: ['timestamp'],
  generateDiff: true,
  ignoreEventId: true,
  ignoreVersion: false,
};

/**
 * Result of an event comparison
 */
export interface EventComparisonResult {
  /**
   * Whether the events match according to the comparison options
   */
  matches: boolean;

  /**
   * Detailed error message if the events don't match
   */
  errorMessage?: string;

  /**
   * Detailed diff output if generateDiff is true and the events don't match
   */
  diff?: string;

  /**
   * Fields that didn't match
   */
  mismatchedFields?: string[];

  /**
   * The expected event
   */
  expected: BaseEvent;

  /**
   * The actual event
   */
  actual: BaseEvent;
}

/**
 * Type for a custom field comparator function
 */
export type FieldComparator = (expected: any, actual: any, path: string) => FieldComparisonResult;

/**
 * Result of a field comparison
 */
export interface FieldComparisonResult {
  /**
   * Whether the fields match
   */
  matches: boolean;

  /**
   * Error message if the fields don't match
   */
  errorMessage?: string;
}

/**
 * Compares two events for equality based on the provided options
 * 
 * @param expected The expected event
 * @param actual The actual event
 * @param options Comparison options
 * @returns Comparison result with match status and error details
 */
export function compareEvents<T extends BaseEvent = BaseEvent>(
  expected: T,
  actual: T,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  const opts = { ...DEFAULT_COMPARISON_OPTIONS, ...options };
  const mismatchedFields: string[] = [];

  // Create a copy of the events to avoid modifying the originals
  const expectedCopy = { ...expected };
  const actualCopy = { ...actual };

  // Handle ignoreEventId option
  if (opts.ignoreEventId) {
    opts.ignoreFields = [...(opts.ignoreFields || []), 'eventId'];
  }

  // Handle ignoreVersion option
  if (opts.ignoreVersion) {
    opts.ignoreFields = [...(opts.ignoreFields || []), 'version'];
  }

  // Handle ignoreMetadata option
  if (opts.ignoreMetadata) {
    opts.ignoreFields = [...(opts.ignoreFields || []), 'metadata'];
  }

  // Apply field filtering based on options
  const fieldsToCompare = getFieldsToCompare(expected, actual, opts);

  // Compare each field
  for (const field of fieldsToCompare) {
    const expectedValue = getNestedValue(expectedCopy, field);
    const actualValue = getNestedValue(actualCopy, field);

    // Skip if both values are undefined
    if (expectedValue === undefined && actualValue === undefined) {
      continue;
    }

    // Check if this is a timestamp field
    const isTimestampField = opts.timestampFields?.includes(field);

    // Use custom comparator if provided for this field
    if (opts.fieldComparators && opts.fieldComparators[field]) {
      const result = opts.fieldComparators[field](expectedValue, actualValue, field);
      if (!result.matches) {
        mismatchedFields.push(field);
      }
      continue;
    }

    // Handle timestamp comparison with tolerance
    if (isTimestampField && typeof expectedValue === 'string' && typeof actualValue === 'string') {
      const timestampResult = compareTimestamps(
        expectedValue,
        actualValue,
        opts.timestampToleranceMs || DEFAULT_COMPARISON_OPTIONS.timestampToleranceMs!
      );

      if (!timestampResult.matches) {
        mismatchedFields.push(field);
      }
      continue;
    }

    // Handle regular value comparison
    const comparisonResult = compareValues(expectedValue, actualValue, field, opts.partial);
    if (!comparisonResult.matches) {
      mismatchedFields.push(field);
    }
  }

  // Generate result
  const matches = mismatchedFields.length === 0;
  const result: EventComparisonResult = {
    matches,
    expected,
    actual,
    mismatchedFields: matches ? undefined : mismatchedFields,
  };

  // Generate error message and diff if needed
  if (!matches) {
    result.errorMessage = generateErrorMessage(mismatchedFields, expected, actual);
    
    if (opts.generateDiff) {
      result.diff = diff(expected, actual, {
        expand: false,
        contextLines: 2,
      });
    }
  }

  return result;
}

/**
 * Compares two events for partial matching, where the actual event must contain
 * at least all the fields in the expected event with matching values
 * 
 * @param expected The expected event (subset of fields)
 * @param actual The actual event (may contain additional fields)
 * @param options Comparison options
 * @returns Comparison result with match status and error details
 */
export function partialCompareEvents<T extends BaseEvent = BaseEvent>(
  expected: Partial<T>,
  actual: T,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  return compareEvents(
    expected as T,
    actual,
    { ...options, partial: true }
  );
}

/**
 * Compares two health events with health-specific comparison logic
 * 
 * @param expected The expected health event
 * @param actual The actual health event
 * @param options Comparison options
 * @returns Comparison result with match status and error details
 */
export function compareHealthEvents(
  expected: IHealthEvent,
  actual: IHealthEvent,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Ensure both events are health events
  if (!isHealthEvent(expected) || !isHealthEvent(actual)) {
    return {
      matches: false,
      errorMessage: 'One or both events are not valid health events',
      expected: expected as BaseEvent,
      actual: actual as BaseEvent,
    };
  }

  // Add health-specific field comparators
  const healthComparators: Record<string, FieldComparator> = {
    // Add custom comparators for health-specific fields if needed
    ...options.fieldComparators,
  };

  // Add health-specific timestamp fields
  const healthTimestampFields = [
    ...DEFAULT_COMPARISON_OPTIONS.timestampFields!,
    'data.timestamp',
    'data.startDate',
    'data.endDate',
    'data.connectionDate',
    'data.syncDate',
    'data.recordDate',
    'data.completionDate',
    'data.generationDate',
  ];

  return compareEvents(
    expected as BaseEvent,
    actual as BaseEvent,
    {
      ...options,
      fieldComparators: healthComparators,
      timestampFields: [...new Set([...healthTimestampFields, ...(options.timestampFields || [])])],
    }
  );
}

/**
 * Compares two care events with care-specific comparison logic
 * 
 * @param expected The expected care event
 * @param actual The actual care event
 * @param options Comparison options
 * @returns Comparison result with match status and error details
 */
export function compareCareEvents(
  expected: ICareEvent,
  actual: ICareEvent,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Ensure both events are care events
  if (!isCareEvent(expected) || !isCareEvent(actual)) {
    return {
      matches: false,
      errorMessage: 'One or both events are not valid care events',
      expected: expected as BaseEvent,
      actual: actual as BaseEvent,
    };
  }

  // Add care-specific field comparators
  const careComparators: Record<string, FieldComparator> = {
    // Add custom comparators for care-specific fields if needed
    ...options.fieldComparators,
  };

  // Add care-specific timestamp fields
  const careTimestampFields = [
    ...DEFAULT_COMPARISON_OPTIONS.timestampFields!,
    'data.scheduledDate',
    'data.completionDate',
    'data.cancellationDate',
    'data.startDate',
    'data.endDate',
    'data.takenDate',
    'data.startTime',
    'data.endTime',
  ];

  return compareEvents(
    expected as BaseEvent,
    actual as BaseEvent,
    {
      ...options,
      fieldComparators: careComparators,
      timestampFields: [...new Set([...careTimestampFields, ...(options.timestampFields || [])])],
    }
  );
}

/**
 * Compares two plan events with plan-specific comparison logic
 * 
 * @param expected The expected plan event
 * @param actual The actual plan event
 * @param options Comparison options
 * @returns Comparison result with match status and error details
 */
export function comparePlanEvents(
  expected: IPlanEvent,
  actual: IPlanEvent,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Ensure both events are plan events
  if (!isPlanEvent(expected) || !isPlanEvent(actual)) {
    return {
      matches: false,
      errorMessage: 'One or both events are not valid plan events',
      expected: expected as BaseEvent,
      actual: actual as BaseEvent,
    };
  }

  // Add plan-specific field comparators
  const planComparators: Record<string, FieldComparator> = {
    // Add custom comparators for plan-specific fields if needed
    ...options.fieldComparators,
  };

  // Add plan-specific timestamp fields
  const planTimestampFields = [
    ...DEFAULT_COMPARISON_OPTIONS.timestampFields!,
    'data.submissionDate',
    'data.approvalDate',
    'data.rejectionDate',
    'data.utilizationDate',
    'data.selectionDate',
    'data.startDate',
    'data.endDate',
    'data.renewalDate',
    'data.previousEndDate',
    'data.newEndDate',
    'data.comparisonDate',
    'data.uploadDate',
    'data.verificationDate',
    'data.redemptionDate',
    'data.paymentDate',
  ];

  return compareEvents(
    expected as BaseEvent,
    actual as BaseEvent,
    {
      ...options,
      fieldComparators: planComparators,
      timestampFields: [...new Set([...planTimestampFields, ...(options.timestampFields || [])])],
    }
  );
}

/**
 * Compares two journey events with journey-specific comparison logic
 * 
 * @param expected The expected journey event
 * @param actual The actual journey event
 * @param options Comparison options
 * @returns Comparison result with match status and error details
 */
export function compareJourneyEvents(
  expected: BaseEvent,
  actual: BaseEvent,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Determine the journey type and use the appropriate comparison function
  if (isHealthEvent(expected) && isHealthEvent(actual)) {
    return compareHealthEvents(expected, actual, options);
  } else if (isCareEvent(expected) && isCareEvent(actual)) {
    return compareCareEvents(expected, actual, options);
  } else if (isPlanEvent(expected) && isPlanEvent(actual)) {
    return comparePlanEvents(expected, actual, options);
  } else {
    // If journey types don't match or aren't recognized, use the generic comparison
    return compareEvents(expected, actual, options);
  }
}

/**
 * Compares two timestamps with a tolerance for slight differences
 * 
 * @param expected The expected timestamp
 * @param actual The actual timestamp
 * @param toleranceMs Tolerance in milliseconds
 * @returns Comparison result with match status and error details
 */
export function compareTimestamps(
  expected: string,
  actual: string,
  toleranceMs: number = 1000
): FieldComparisonResult {
  try {
    const expectedDate = new Date(expected).getTime();
    const actualDate = new Date(actual).getTime();
    const difference = Math.abs(expectedDate - actualDate);

    if (difference <= toleranceMs) {
      return { matches: true };
    } else {
      return {
        matches: false,
        errorMessage: `Timestamp difference of ${difference}ms exceeds tolerance of ${toleranceMs}ms`,
      };
    }
  } catch (error) {
    return {
      matches: false,
      errorMessage: `Error comparing timestamps: ${error.message}`,
    };
  }
}

/**
 * Creates a custom field comparator for numeric values with a tolerance
 * 
 * @param tolerance The maximum allowed difference between values
 * @returns A field comparator function
 */
export function createNumericComparator(tolerance: number): FieldComparator {
  return (expected: number, actual: number, path: string): FieldComparisonResult => {
    if (typeof expected !== 'number' || typeof actual !== 'number') {
      return {
        matches: false,
        errorMessage: `Field ${path} is not a number`,
      };
    }

    const difference = Math.abs(expected - actual);
    if (difference <= tolerance) {
      return { matches: true };
    } else {
      return {
        matches: false,
        errorMessage: `Numeric difference of ${difference} exceeds tolerance of ${tolerance}`,
      };
    }
  };
}

/**
 * Creates a custom field comparator for array length validation
 * 
 * @param expectedLength The expected array length
 * @returns A field comparator function
 */
export function createArrayLengthComparator(expectedLength: number): FieldComparator {
  return (expected: any[], actual: any[], path: string): FieldComparisonResult => {
    if (!Array.isArray(actual)) {
      return {
        matches: false,
        errorMessage: `Field ${path} is not an array`,
      };
    }

    if (actual.length === expectedLength) {
      return { matches: true };
    } else {
      return {
        matches: false,
        errorMessage: `Array length ${actual.length} does not match expected length ${expectedLength}`,
      };
    }
  };
}

/**
 * Creates a custom field comparator that validates array contents without regard to order
 * 
 * @returns A field comparator function
 */
export function createUnorderedArrayComparator(): FieldComparator {
  return (expected: any[], actual: any[], path: string): FieldComparisonResult => {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      return {
        matches: false,
        errorMessage: `Field ${path} is not an array`,
      };
    }

    if (expected.length !== actual.length) {
      return {
        matches: false,
        errorMessage: `Array length ${actual.length} does not match expected length ${expected.length}`,
      };
    }

    // For primitive arrays, check if all elements exist in both arrays
    if (expected.every(item => isPrimitive(item))) {
      const missingInActual = expected.filter(item => !actual.includes(item));
      const missingInExpected = actual.filter(item => !expected.includes(item));

      if (missingInActual.length === 0 && missingInExpected.length === 0) {
        return { matches: true };
      } else {
        return {
          matches: false,
          errorMessage: `Arrays have different elements: missing in actual [${missingInActual}], missing in expected [${missingInExpected}]`,
        };
      }
    }

    // For object arrays, this is more complex and would require deep comparison
    // This is a simplified version that might not work for all cases
    return {
      matches: false,
      errorMessage: `Unordered comparison of object arrays is not fully supported`,
    };
  };
}

/**
 * Creates a custom field comparator that validates a string against a regular expression
 * 
 * @param regex The regular expression to match against
 * @returns A field comparator function
 */
export function createRegexComparator(regex: RegExp): FieldComparator {
  return (expected: any, actual: string, path: string): FieldComparisonResult => {
    if (typeof actual !== 'string') {
      return {
        matches: false,
        errorMessage: `Field ${path} is not a string`,
      };
    }

    if (regex.test(actual)) {
      return { matches: true };
    } else {
      return {
        matches: false,
        errorMessage: `String "${actual}" does not match pattern ${regex}`,
      };
    }
  };
}

/**
 * Creates a custom field comparator that validates a value is within a range
 * 
 * @param min The minimum allowed value
 * @param max The maximum allowed value
 * @returns A field comparator function
 */
export function createRangeComparator(min: number, max: number): FieldComparator {
  return (expected: any, actual: number, path: string): FieldComparisonResult => {
    if (typeof actual !== 'number') {
      return {
        matches: false,
        errorMessage: `Field ${path} is not a number`,
      };
    }

    if (actual >= min && actual <= max) {
      return { matches: true };
    } else {
      return {
        matches: false,
        errorMessage: `Value ${actual} is outside the range [${min}, ${max}]`,
      };
    }
  };
}

/**
 * Compares two values for equality
 * 
 * @param expected The expected value
 * @param actual The actual value
 * @param path The path to the field being compared
 * @param partial Whether to allow partial matching
 * @returns Comparison result with match status and error details
 */
function compareValues(
  expected: any,
  actual: any,
  path: string,
  partial: boolean = false
): FieldComparisonResult {
  // Handle null and undefined
  if (expected === null || expected === undefined) {
    return {
      matches: actual === expected,
      errorMessage: actual === expected ? undefined : `Field ${path} expected ${expected} but got ${actual}`,
    };
  }

  // Handle different types
  if (typeof expected !== typeof actual) {
    return {
      matches: false,
      errorMessage: `Field ${path} type mismatch: expected ${typeof expected} but got ${typeof actual}`,
    };
  }

  // Handle arrays
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (!partial && expected.length !== actual.length) {
      return {
        matches: false,
        errorMessage: `Field ${path} array length mismatch: expected ${expected.length} but got ${actual.length}`,
      };
    }

    // For partial matching, ensure all expected elements are in the actual array
    if (partial) {
      for (let i = 0; i < expected.length; i++) {
        const expectedItem = expected[i];
        const matchFound = actual.some(actualItem => 
          compareValues(expectedItem, actualItem, `${path}[${i}]`, partial).matches
        );

        if (!matchFound) {
          return {
            matches: false,
            errorMessage: `Field ${path}[${i}] not found in actual array`,
          };
        }
      }
      return { matches: true };
    }

    // For exact matching, compare each element
    for (let i = 0; i < expected.length; i++) {
      const result = compareValues(expected[i], actual[i], `${path}[${i}]`, partial);
      if (!result.matches) {
        return result;
      }
    }
    return { matches: true };
  }

  // Handle objects
  if (typeof expected === 'object' && typeof actual === 'object') {
    const expectedKeys = Object.keys(expected);
    
    // For partial matching, only check the keys in the expected object
    if (partial) {
      for (const key of expectedKeys) {
        if (!(key in actual)) {
          return {
            matches: false,
            errorMessage: `Field ${path}.${key} missing in actual object`,
          };
        }

        const result = compareValues(expected[key], actual[key], `${path}.${key}`, partial);
        if (!result.matches) {
          return result;
        }
      }
      return { matches: true };
    }

    // For exact matching, ensure both objects have the same keys
    const actualKeys = Object.keys(actual);
    if (expectedKeys.length !== actualKeys.length) {
      return {
        matches: false,
        errorMessage: `Field ${path} key count mismatch: expected ${expectedKeys.length} but got ${actualKeys.length}`,
      };
    }

    // Check if all expected keys are in the actual object
    for (const key of expectedKeys) {
      if (!(key in actual)) {
        return {
          matches: false,
          errorMessage: `Field ${path}.${key} missing in actual object`,
        };
      }

      const result = compareValues(expected[key], actual[key], `${path}.${key}`, partial);
      if (!result.matches) {
        return result;
      }
    }

    return { matches: true };
  }

  // Handle primitive values
  return {
    matches: expected === actual,
    errorMessage: expected === actual ? undefined : `Field ${path} value mismatch: expected ${expected} but got ${actual}`,
  };
}

/**
 * Gets the fields to compare based on the options
 * 
 * @param expected The expected event
 * @param actual The actual event
 * @param options Comparison options
 * @returns Array of field paths to compare
 */
function getFieldsToCompare(
  expected: any,
  actual: any,
  options: EventComparisonOptions
): string[] {
  const allFields = getAllFieldPaths(expected);
  
  // If includeFields is specified, only include those fields
  if (options.includeFields && options.includeFields.length > 0) {
    return options.includeFields;
  }
  
  // Otherwise, include all fields except those in ignoreFields
  return allFields.filter(field => {
    return !options.ignoreFields?.includes(field) && 
           !options.ignoreFields?.some(ignored => field.startsWith(`${ignored}.`));
  });
}

/**
 * Gets all field paths in an object, including nested fields
 * 
 * @param obj The object to get field paths from
 * @param prefix The prefix for nested fields
 * @returns Array of field paths
 */
function getAllFieldPaths(obj: any, prefix: string = ''): string[] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }

  let paths: string[] = [];

  for (const key in obj) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    
    paths.push(path);
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths = [...paths, ...getAllFieldPaths(value, path)];
    }
  }

  return paths;
}

/**
 * Gets a nested value from an object using a dot-notation path
 * 
 * @param obj The object to get the value from
 * @param path The path to the value
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array indices in the path
    if (part.includes('[') && part.includes(']')) {
      const [arrayName, indexStr] = part.split('[');
      const index = parseInt(indexStr.replace(']', ''), 10);
      
      current = current[arrayName];
      if (!Array.isArray(current) || index >= current.length) {
        return undefined;
      }
      
      current = current[index];
    } else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Generates an error message for mismatched fields
 * 
 * @param mismatchedFields Array of mismatched field paths
 * @param expected The expected event
 * @param actual The actual event
 * @returns Detailed error message
 */
function generateErrorMessage(
  mismatchedFields: string[],
  expected: any,
  actual: any
): string {
  if (mismatchedFields.length === 0) {
    return '';
  }

  let message = `Events do not match. Mismatched fields (${mismatchedFields.length}):\n`;

  for (const field of mismatchedFields) {
    const expectedValue = getNestedValue(expected, field);
    const actualValue = getNestedValue(actual, field);
    
    message += `  - ${field}: expected ${formatValue(expectedValue)} but got ${formatValue(actualValue)}\n`;
  }

  return message;
}

/**
 * Formats a value for display in error messages
 * 
 * @param value The value to format
 * @returns Formatted string representation of the value
 */
function formatValue(value: any): string {
  if (value === undefined) {
    return 'undefined';
  }
  
  if (value === null) {
    return 'null';
  }
  
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Complex Object]';
    }
  }
  
  return String(value);
}

/**
 * Checks if a value is a primitive (string, number, boolean, null, undefined)
 * 
 * @param value The value to check
 * @returns True if the value is a primitive, false otherwise
 */
function isPrimitive(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}
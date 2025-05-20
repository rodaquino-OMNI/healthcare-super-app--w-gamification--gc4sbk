/**
 * Event comparison utilities for testing event processing
 * 
 * This module provides utilities for comparing events in test assertions with
 * customizable matching logic and detailed error reporting. It supports deep equality
 * comparison, partial matching, journey-specific comparisons, and timestamp tolerance.
 */

import { diff } from 'jest-diff';
import { BaseEventDto } from '../../src/dto/base-event.dto';
import { EventTypesEnum } from '../../src/constants/event-types.enum';
import { JourneyType } from '../../src/constants/journey-type.enum';

/**
 * Options for event comparison
 */
export interface EventComparisonOptions {
  /**
   * Fields to ignore during comparison
   */
  ignoreFields?: string[];
  
  /**
   * Whether to perform a partial match (only compare fields present in expected)
   */
  partialMatch?: boolean;
  
  /**
   * Tolerance in milliseconds for timestamp comparison
   */
  timestampTolerance?: number;
  
  /**
   * Custom field comparators for specific fields
   */
  fieldComparators?: Record<string, FieldComparator>;
  
  /**
   * Whether to include a detailed diff in the error message
   */
  includeDiff?: boolean;
}

/**
 * Default comparison options
 */
export const DEFAULT_COMPARISON_OPTIONS: EventComparisonOptions = {
  ignoreFields: [],
  partialMatch: false,
  timestampTolerance: 0,
  fieldComparators: {},
  includeDiff: true,
};

/**
 * Field comparator function type
 */
export type FieldComparator = (expected: any, actual: any) => boolean;

/**
 * Result of an event comparison
 */
export interface EventComparisonResult {
  /**
   * Whether the comparison was successful
   */
  isEqual: boolean;
  
  /**
   * Error message if comparison failed
   */
  errorMessage?: string;
  
  /**
   * Detailed diff if comparison failed and includeDiff is true
   */
  diff?: string;
  
  /**
   * Fields that failed comparison
   */
  failedFields?: string[];
}

/**
 * Compare two events for equality with customizable options
 * 
 * @param expected - The expected event
 * @param actual - The actual event
 * @param options - Comparison options
 * @returns Comparison result
 */
export function compareEvents(
  expected: Partial<BaseEventDto>,
  actual: BaseEventDto,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  const opts = { ...DEFAULT_COMPARISON_OPTIONS, ...options };
  const failedFields: string[] = [];
  
  // Helper function to check if a field should be ignored
  const shouldIgnoreField = (field: string): boolean => {
    return opts.ignoreFields?.includes(field) || false;
  };
  
  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  };
  
  // Helper function to compare fields
  const compareField = (field: string, expectedValue: any, actualValue: any): boolean => {
    // If there's a custom comparator for this field, use it
    if (opts.fieldComparators && opts.fieldComparators[field]) {
      return opts.fieldComparators[field](expectedValue, actualValue);
    }
    
    // Special handling for timestamps
    if (field.toLowerCase().includes('timestamp') && opts.timestampTolerance && opts.timestampTolerance > 0) {
      const expectedDate = new Date(expectedValue).getTime();
      const actualDate = new Date(actualValue).getTime();
      return Math.abs(expectedDate - actualDate) <= opts.timestampTolerance;
    }
    
    // Deep comparison for objects
    if (expectedValue !== null && actualValue !== null && 
        typeof expectedValue === 'object' && typeof actualValue === 'object') {
      // Handle arrays
      if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
        if (expectedValue.length !== actualValue.length) {
          return false;
        }
        
        return expectedValue.every((val, idx) => {
          return compareField(`${field}[${idx}]`, val, actualValue[idx]);
        });
      }
      
      // Handle objects
      const expectedKeys = Object.keys(expectedValue);
      const actualKeys = Object.keys(actualValue);
      
      if (!opts.partialMatch && expectedKeys.length !== actualKeys.length) {
        return false;
      }
      
      return expectedKeys.every(key => {
        if (shouldIgnoreField(`${field}.${key}`)) {
          return true;
        }
        
        return compareField(`${field}.${key}`, expectedValue[key], actualValue[key]);
      });
    }
    
    // Simple value comparison
    return expectedValue === actualValue;
  };
  
  // Start comparison
  let isEqual = true;
  const expectedFields = Object.keys(expected);
  
  // For each field in the expected object
  for (const field of expectedFields) {
    if (shouldIgnoreField(field)) {
      continue;
    }
    
    const expectedValue = expected[field];
    const actualValue = actual[field];
    
    // If the field doesn't exist in the actual object and we're not doing a partial match
    if (actualValue === undefined && !opts.partialMatch) {
      isEqual = false;
      failedFields.push(field);
      continue;
    }
    
    // Compare the field values
    const fieldIsEqual = compareField(field, expectedValue, actualValue);
    if (!fieldIsEqual) {
      isEqual = false;
      failedFields.push(field);
    }
  }
  
  // Prepare result
  const result: EventComparisonResult = { isEqual };
  
  if (!isEqual) {
    result.failedFields = failedFields;
    
    // Create error message
    let errorMessage = `Event comparison failed. Failed fields: ${failedFields.join(', ')}`;
    result.errorMessage = errorMessage;
    
    // Add diff if requested
    if (opts.includeDiff) {
      result.diff = diff(expected, actual);
    }
  }
  
  return result;
}

/**
 * Compare two events for partial equality (only fields in expected are compared)
 * 
 * @param expected - The expected event (partial)
 * @param actual - The actual event
 * @param options - Additional comparison options
 * @returns Comparison result
 */
export function compareEventsPartial(
  expected: Partial<BaseEventDto>,
  actual: BaseEventDto,
  options: Omit<EventComparisonOptions, 'partialMatch'> = {}
): EventComparisonResult {
  return compareEvents(expected, actual, { ...options, partialMatch: true });
}

/**
 * Compare timestamps with tolerance
 * 
 * @param expected - Expected timestamp (Date, string, or number)
 * @param actual - Actual timestamp (Date, string, or number)
 * @param toleranceMs - Tolerance in milliseconds
 * @returns Whether timestamps are equal within tolerance
 */
export function compareTimestamps(
  expected: Date | string | number,
  actual: Date | string | number,
  toleranceMs: number = 1000
): boolean {
  const expectedMs = expected instanceof Date ? expected.getTime() : new Date(expected).getTime();
  const actualMs = actual instanceof Date ? actual.getTime() : new Date(actual).getTime();
  
  return Math.abs(expectedMs - actualMs) <= toleranceMs;
}

/**
 * Create a field comparator for timestamps with tolerance
 * 
 * @param toleranceMs - Tolerance in milliseconds
 * @returns Field comparator function
 */
export function createTimestampComparator(toleranceMs: number = 1000): FieldComparator {
  return (expected: any, actual: any) => compareTimestamps(expected, actual, toleranceMs);
}

/**
 * Journey-specific comparison options for health events
 */
export const healthEventComparisonOptions: EventComparisonOptions = {
  ignoreFields: ['metadata.correlationId', 'metadata.timestamp'],
  timestampTolerance: 1000,
  fieldComparators: {
    'timestamp': createTimestampComparator(1000),
    'payload.recordedAt': createTimestampComparator(1000),
    'payload.metricValue': (expected, actual) => {
      // For numeric health metrics, allow small differences
      if (typeof expected === 'number' && typeof actual === 'number') {
        return Math.abs(expected - actual) < 0.001;
      }
      return expected === actual;
    }
  }
};

/**
 * Journey-specific comparison options for care events
 */
export const careEventComparisonOptions: EventComparisonOptions = {
  ignoreFields: ['metadata.correlationId', 'metadata.timestamp'],
  timestampTolerance: 1000,
  fieldComparators: {
    'timestamp': createTimestampComparator(1000),
    'payload.scheduledAt': createTimestampComparator(1000),
    'payload.completedAt': createTimestampComparator(1000),
  }
};

/**
 * Journey-specific comparison options for plan events
 */
export const planEventComparisonOptions: EventComparisonOptions = {
  ignoreFields: ['metadata.correlationId', 'metadata.timestamp'],
  timestampTolerance: 1000,
  fieldComparators: {
    'timestamp': createTimestampComparator(1000),
    'payload.submittedAt': createTimestampComparator(1000),
    'payload.processedAt': createTimestampComparator(1000),
    'payload.amount': (expected, actual) => {
      // For currency amounts, allow small differences due to rounding
      if (typeof expected === 'number' && typeof actual === 'number') {
        return Math.abs(expected - actual) < 0.01;
      }
      return expected === actual;
    }
  }
};

/**
 * Compare health journey events with health-specific comparison options
 * 
 * @param expected - Expected health event
 * @param actual - Actual health event
 * @param options - Additional comparison options
 * @returns Comparison result
 */
export function compareHealthEvents(
  expected: Partial<BaseEventDto>,
  actual: BaseEventDto,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Verify this is a health event
  if (actual.journey !== JourneyType.HEALTH) {
    return {
      isEqual: false,
      errorMessage: `Expected a health event but got ${actual.journey}`,
      failedFields: ['journey']
    };
  }
  
  return compareEvents(
    expected,
    actual,
    { ...healthEventComparisonOptions, ...options }
  );
}

/**
 * Compare care journey events with care-specific comparison options
 * 
 * @param expected - Expected care event
 * @param actual - Actual care event
 * @param options - Additional comparison options
 * @returns Comparison result
 */
export function compareCareEvents(
  expected: Partial<BaseEventDto>,
  actual: BaseEventDto,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Verify this is a care event
  if (actual.journey !== JourneyType.CARE) {
    return {
      isEqual: false,
      errorMessage: `Expected a care event but got ${actual.journey}`,
      failedFields: ['journey']
    };
  }
  
  return compareEvents(
    expected,
    actual,
    { ...careEventComparisonOptions, ...options }
  );
}

/**
 * Compare plan journey events with plan-specific comparison options
 * 
 * @param expected - Expected plan event
 * @param actual - Actual plan event
 * @param options - Additional comparison options
 * @returns Comparison result
 */
export function comparePlanEvents(
  expected: Partial<BaseEventDto>,
  actual: BaseEventDto,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  // Verify this is a plan event
  if (actual.journey !== JourneyType.PLAN) {
    return {
      isEqual: false,
      errorMessage: `Expected a plan event but got ${actual.journey}`,
      failedFields: ['journey']
    };
  }
  
  return compareEvents(
    expected,
    actual,
    { ...planEventComparisonOptions, ...options }
  );
}

/**
 * Get journey-specific comparison options based on journey type
 * 
 * @param journeyType - The journey type
 * @returns Appropriate comparison options for the journey
 */
export function getJourneyComparisonOptions(journeyType: JourneyType): EventComparisonOptions {
  switch (journeyType) {
    case JourneyType.HEALTH:
      return healthEventComparisonOptions;
    case JourneyType.CARE:
      return careEventComparisonOptions;
    case JourneyType.PLAN:
      return planEventComparisonOptions;
    default:
      return DEFAULT_COMPARISON_OPTIONS;
  }
}

/**
 * Compare events automatically using journey-specific options
 * 
 * @param expected - Expected event
 * @param actual - Actual event
 * @param options - Additional comparison options
 * @returns Comparison result
 */
export function compareEventsByJourney(
  expected: Partial<BaseEventDto>,
  actual: BaseEventDto,
  options: EventComparisonOptions = {}
): EventComparisonResult {
  const journeyType = actual.journey as JourneyType;
  const journeyOptions = getJourneyComparisonOptions(journeyType);
  
  return compareEvents(
    expected,
    actual,
    { ...journeyOptions, ...options }
  );
}
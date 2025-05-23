/**
 * @file base-events.ts
 * @description Provides foundational event test fixtures that implement the base event interface.
 * This file contains factory functions to generate generic base events with configurable properties,
 * timestamps, and payloads. These fixtures serve as the building blocks for more specific event types
 * and are essential for testing core event processing functionality, validation, and serialization/deserialization logic.
 */

import { BaseEvent, EventMetadata } from '../../src/interfaces/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Options for creating a test event
 */
export interface TestEventOptions<T = any> {
  /**
   * Custom event ID (defaults to a deterministic ID based on type and timestamp)
   */
  eventId?: string;

  /**
   * Event type (defaults to 'TEST_EVENT')
   */
  type?: string;

  /**
   * ISO timestamp (defaults to current time)
   */
  timestamp?: string;

  /**
   * Event schema version (defaults to '1.0.0')
   */
  version?: string;

  /**
   * Source service or component (defaults to 'test-service')
   */
  source?: string;

  /**
   * Journey context (optional)
   */
  journey?: JourneyType;

  /**
   * User ID (optional, defaults to 'test-user-123')
   */
  userId?: string;

  /**
   * Event payload (defaults to {})
   */
  payload?: T;

  /**
   * Event metadata (optional)
   */
  metadata?: EventMetadata;

  /**
   * Whether to use deterministic IDs (defaults to false)
   * When true, generates consistent IDs based on type and timestamp
   */
  deterministic?: boolean;
}

/**
 * Creates a deterministic event ID based on type and timestamp
 * Useful for creating reproducible test fixtures
 *
 * @param type Event type
 * @param timestamp ISO timestamp
 * @returns A deterministic event ID
 */
export function createDeterministicEventId(type: string, timestamp: string): string {
  // Create a simple hash of the type and timestamp
  const combined = `${type}-${timestamp}`;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to a UUID-like format for consistency
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
  return `test-${hashStr}-${type.toLowerCase().replace(/_/g, '-')}`;
}

/**
 * Creates a test event with the specified options
 *
 * @param options Configuration options for the test event
 * @returns A BaseEvent instance for testing
 */
export function createTestEvent<T = any>(options: TestEventOptions<T> = {}): BaseEvent<T> {
  const timestamp = options.timestamp || new Date().toISOString();
  const type = options.type || 'TEST_EVENT';
  
  // Generate eventId based on deterministic flag
  let eventId: string;
  if (options.eventId) {
    eventId = options.eventId;
  } else if (options.deterministic) {
    eventId = createDeterministicEventId(type, timestamp);
  } else {
    eventId = `test-${Math.random().toString(36).substring(2, 15)}`;
  }

  return {
    eventId,
    type,
    timestamp,
    version: options.version || '1.0.0',
    source: options.source || 'test-service',
    journey: options.journey,
    userId: options.userId || 'test-user-123',
    payload: options.payload || ({} as T),
    metadata: options.metadata,
  };
}

/**
 * Creates a test event with a specific timestamp
 *
 * @param timestamp ISO timestamp to use
 * @param options Additional options for the test event
 * @returns A BaseEvent instance with the specified timestamp
 */
export function createTestEventWithTimestamp<T = any>(
  timestamp: string,
  options: Omit<TestEventOptions<T>, 'timestamp'> = {}
): BaseEvent<T> {
  return createTestEvent<T>({ ...options, timestamp });
}

/**
 * Creates a test event with a timestamp relative to the current time
 *
 * @param offsetMs Milliseconds to add/subtract from current time
 * @param options Additional options for the test event
 * @returns A BaseEvent instance with a timestamp offset from current time
 */
export function createTestEventWithTimeOffset<T = any>(
  offsetMs: number,
  options: Omit<TestEventOptions<T>, 'timestamp'> = {}
): BaseEvent<T> {
  const timestamp = new Date(Date.now() + offsetMs).toISOString();
  return createTestEvent<T>({ ...options, timestamp });
}

/**
 * Creates a minimal valid test event with only required properties
 *
 * @param type Event type
 * @param payload Event payload
 * @returns A minimal BaseEvent instance with only required properties
 */
export function createMinimalTestEvent<T = any>(type: string, payload: T): BaseEvent<T> {
  return {
    eventId: `minimal-${Math.random().toString(36).substring(2, 15)}`,
    type,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test-service',
    payload,
  };
}

/**
 * Creates a batch of test events with sequential timestamps
 *
 * @param count Number of events to create
 * @param baseOptions Base options for all events
 * @param intervalMs Milliseconds between each event (default: 1000)
 * @returns Array of BaseEvent instances with sequential timestamps
 */
export function createTestEventBatch<T = any>(
  count: number,
  baseOptions: TestEventOptions<T> = {},
  intervalMs: number = 1000
): BaseEvent<T>[] {
  const events: BaseEvent<T>[] = [];
  const baseTime = baseOptions.timestamp ? new Date(baseOptions.timestamp).getTime() : Date.now();
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(baseTime + (i * intervalMs)).toISOString();
    events.push(createTestEvent<T>({ ...baseOptions, timestamp }));
  }
  
  return events;
}

/**
 * Creates a test event with correlation tracking metadata
 *
 * @param correlationId Correlation ID for tracking
 * @param options Additional options for the test event
 * @returns A BaseEvent instance with correlation tracking metadata
 */
export function createCorrelatedTestEvent<T = any>(
  correlationId: string,
  options: TestEventOptions<T> = {}
): BaseEvent<T> {
  const metadata: EventMetadata = {
    ...(options.metadata || {}),
    correlationId,
    traceId: `trace-${correlationId}`,
    spanId: `span-${Math.random().toString(36).substring(2, 10)}`,
  };
  
  return createTestEvent<T>({ ...options, metadata });
}

/**
 * Creates a test event representing a retry of a failed event
 *
 * @param originalEvent The original event that failed
 * @param retryCount Number of retry attempts (default: 1)
 * @returns A BaseEvent instance representing a retry
 */
export function createRetryTestEvent<T = any>(
  originalEvent: BaseEvent<T>,
  retryCount: number = 1
): BaseEvent<T> {
  const metadata: EventMetadata = {
    ...(originalEvent.metadata || {}),
    isRetry: true,
    retryCount,
    originalTimestamp: originalEvent.timestamp,
  };
  
  return {
    ...originalEvent,
    eventId: `retry-${originalEvent.eventId}`,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

/**
 * Creates a test event with a specific journey context
 *
 * @param journey Journey type
 * @param options Additional options for the test event
 * @returns A BaseEvent instance with the specified journey context
 */
export function createJourneyTestEvent<T = any>(
  journey: JourneyType,
  options: Omit<TestEventOptions<T>, 'journey'> = {}
): BaseEvent<T> {
  return createTestEvent<T>({ ...options, journey });
}

/**
 * Creates a test event with a specific priority level in metadata
 *
 * @param priority Priority level ('high', 'medium', 'low')
 * @param options Additional options for the test event
 * @returns A BaseEvent instance with the specified priority
 */
export function createPriorityTestEvent<T = any>(
  priority: 'high' | 'medium' | 'low',
  options: TestEventOptions<T> = {}
): BaseEvent<T> {
  const metadata: EventMetadata = {
    ...(options.metadata || {}),
    priority,
  };
  
  return createTestEvent<T>({ ...options, metadata });
}

/**
 * Creates a test event with invalid properties for negative testing
 *
 * @param invalidProps Properties to make invalid
 * @returns A BaseEvent instance with invalid properties
 */
export function createInvalidTestEvent(
  invalidProps: {
    missingEventId?: boolean;
    missingType?: boolean;
    missingTimestamp?: boolean;
    missingVersion?: boolean;
    missingSource?: boolean;
    missingPayload?: boolean;
    invalidTimestampFormat?: boolean;
  } = {}
): Partial<BaseEvent> {
  const event = createTestEvent();
  const result: Partial<BaseEvent> = { ...event };
  
  if (invalidProps.missingEventId) delete result.eventId;
  if (invalidProps.missingType) delete result.type;
  if (invalidProps.missingTimestamp) delete result.timestamp;
  if (invalidProps.missingVersion) delete result.version;
  if (invalidProps.missingSource) delete result.source;
  if (invalidProps.missingPayload) delete result.payload;
  
  if (invalidProps.invalidTimestampFormat) {
    result.timestamp = 'not-a-valid-timestamp';
  }
  
  return result;
}
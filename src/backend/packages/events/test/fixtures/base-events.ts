/**
 * Base event test fixtures for the AUSTA SuperApp.
 * 
 * This file provides foundational event test fixtures that implement the base event interface.
 * These fixtures serve as building blocks for more specific event types and are essential for
 * testing core event processing functionality, validation, and serialization/deserialization logic.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Interface representing the base structure of all events in the system.
 */
export interface BaseEvent {
  /**
   * Unique identifier for the event.
   */
  eventId: string;

  /**
   * Timestamp when the event was created (ISO string format).
   */
  timestamp: string;

  /**
   * Event schema version in semver format (major.minor.patch).
   */
  version: string;

  /**
   * Source service or component that generated the event.
   */
  source: string;

  /**
   * Type of the event, used for routing and processing.
   */
  type: string;

  /**
   * Event payload containing the actual data.
   */
  payload: Record<string, any>;
}

/**
 * Options for creating a base event.
 */
export interface BaseEventOptions {
  /**
   * Custom event ID (defaults to a random UUID).
   */
  eventId?: string;

  /**
   * Custom timestamp (defaults to current time).
   */
  timestamp?: string | Date;

  /**
   * Event schema version (defaults to '1.0.0').
   */
  version?: string;

  /**
   * Source service or component (defaults to 'test').
   */
  source?: string;

  /**
   * Event type (defaults to 'test.event').
   */
  type?: string;

  /**
   * Event payload (defaults to an empty object).
   */
  payload?: Record<string, any>;

  /**
   * If true, generates a deterministic event ID based on other properties.
   * Useful for testing where reproducible IDs are needed.
   */
  deterministicId?: boolean;
}

/**
 * Creates a base event with the specified options.
 * 
 * @param options - Configuration options for the event
 * @returns A BaseEvent instance
 */
export function createBaseEvent(options: BaseEventOptions = {}): BaseEvent {
  const {
    eventId,
    timestamp,
    version = '1.0.0',
    source = 'test',
    type = 'test.event',
    payload = {},
    deterministicId = false,
  } = options;

  // Convert Date object to ISO string if provided
  const timestampStr = timestamp instanceof Date 
    ? timestamp.toISOString() 
    : (timestamp || new Date().toISOString());

  // Generate deterministic ID if requested, otherwise use provided ID or generate random UUID
  const id = deterministicId 
    ? generateDeterministicId(source, type, timestampStr, JSON.stringify(payload))
    : (eventId || uuidv4());

  return {
    eventId: id,
    timestamp: timestampStr,
    version,
    source,
    type,
    payload,
  };
}

/**
 * Generates a deterministic event ID based on event properties.
 * Useful for testing where reproducible IDs are needed.
 * 
 * @param source - Event source
 * @param type - Event type
 * @param timestamp - Event timestamp
 * @param payloadStr - Stringified payload
 * @returns A deterministic event ID
 */
function generateDeterministicId(source: string, type: string, timestamp: string, payloadStr: string): string {
  // Create a simple hash from the combined string
  const combinedStr = `${source}:${type}:${timestamp}:${payloadStr}`;
  let hash = 0;
  
  for (let i = 0; i < combinedStr.length; i++) {
    const char = combinedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and ensure it's positive
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  
  // Format as UUID-like string for consistency
  return `00000000-0000-4000-a000-${hexHash}000000`;
}

/**
 * Creates a minimal valid base event with only required properties.
 * 
 * @returns A minimal BaseEvent instance
 */
export function createMinimalBaseEvent(): BaseEvent {
  return createBaseEvent();
}

/**
 * Creates a base event with a specific timestamp.
 * 
 * @param timestamp - Timestamp to use (Date object or ISO string)
 * @returns A BaseEvent instance with the specified timestamp
 */
export function createBaseEventWithTimestamp(timestamp: Date | string): BaseEvent {
  return createBaseEvent({ timestamp });
}

/**
 * Creates a base event with a specific source.
 * 
 * @param source - Source service or component
 * @returns A BaseEvent instance with the specified source
 */
export function createBaseEventWithSource(source: string): BaseEvent {
  return createBaseEvent({ source });
}

/**
 * Creates a base event with a specific type.
 * 
 * @param type - Event type
 * @returns A BaseEvent instance with the specified type
 */
export function createBaseEventWithType(type: string): BaseEvent {
  return createBaseEvent({ type });
}

/**
 * Creates a base event with a specific payload.
 * 
 * @param payload - Event payload
 * @returns A BaseEvent instance with the specified payload
 */
export function createBaseEventWithPayload(payload: Record<string, any>): BaseEvent {
  return createBaseEvent({ payload });
}

/**
 * Creates a batch of base events with sequential timestamps.
 * 
 * @param count - Number of events to create
 * @param startTime - Starting timestamp (defaults to current time)
 * @param intervalMs - Milliseconds between events (defaults to 1000)
 * @returns An array of BaseEvent instances with sequential timestamps
 */
export function createSequentialBaseEvents(
  count: number, 
  startTime: Date = new Date(), 
  intervalMs: number = 1000
): BaseEvent[] {
  const events: BaseEvent[] = [];
  
  for (let i = 0; i < count; i++) {
    const eventTime = new Date(startTime.getTime() + (i * intervalMs));
    events.push(createBaseEvent({ timestamp: eventTime }));
  }
  
  return events;
}

/**
 * Creates a batch of base events with the same properties except for the eventId.
 * 
 * @param count - Number of events to create
 * @param baseOptions - Base options to use for all events
 * @returns An array of BaseEvent instances with the same properties but different IDs
 */
export function createIdenticalBaseEvents(
  count: number,
  baseOptions: BaseEventOptions = {}
): BaseEvent[] {
  return Array.from({ length: count }, () => createBaseEvent(baseOptions));
}
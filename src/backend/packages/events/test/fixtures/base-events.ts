import { v4 as uuidv4 } from 'uuid';
import { IBaseEvent, EventMetadata } from '../../src/interfaces/base-event.interface';
import { BaseEventDto } from '../../src/dto/base-event.dto';

/**
 * Options for creating a base event test fixture
 */
export interface BaseEventOptions<T = unknown> {
  /**
   * Event ID (UUID v4)
   * If not provided, a random UUID will be generated
   */
  eventId?: string;

  /**
   * ISO 8601 timestamp
   * If not provided, current timestamp will be used
   */
  timestamp?: string;

  /**
   * Event schema version
   * @default "1.0.0"
   */
  version?: string;

  /**
   * Source service that produced the event
   * @default "test-service"
   */
  source?: string;

  /**
   * Event type identifier
   * @default "test.event"
   */
  type?: string;

  /**
   * Event payload data
   * @default {}
   */
  payload?: T;

  /**
   * Optional event metadata
   */
  metadata?: EventMetadata;
}

/**
 * Options for creating a base event DTO test fixture
 */
export interface BaseEventDtoOptions<T = unknown> {
  /**
   * Event type identifier
   * @default "TEST_EVENT"
   */
  type?: string;

  /**
   * User ID associated with the event
   * If not provided, a random UUID will be generated
   */
  userId?: string;

  /**
   * Event data payload
   * @default {}
   */
  data?: T;

  /**
   * Journey identifier (health, care, plan)
   */
  journey?: string;

  /**
   * ISO 8601 timestamp
   * If not provided, current timestamp will be used
   */
  timestamp?: string;
}

/**
 * Options for deterministic ID generation
 */
export interface DeterministicIdOptions {
  /**
   * Seed value for deterministic ID generation
   * Same seed will always produce the same ID
   */
  seed: string;

  /**
   * Optional namespace for scoping IDs
   * Useful for generating different IDs with the same seed in different contexts
   */
  namespace?: string;
}

/**
 * Creates a base event test fixture with the specified options
 * 
 * @param options - Configuration options for the event
 * @returns A base event object implementing IBaseEvent
 * 
 * @example
 * // Create a basic event with default values
 * const event = createBaseEvent();
 * 
 * @example
 * // Create an event with custom values
 * const event = createBaseEvent({
 *   type: 'user.registered',
 *   source: 'auth-service',
 *   payload: { userId: '123', email: 'user@example.com' }
 * });
 */
export function createBaseEvent<T = unknown>(options: BaseEventOptions<T> = {}): IBaseEvent<T> {
  const now = new Date();
  
  return {
    eventId: options.eventId || uuidv4(),
    timestamp: options.timestamp || now.toISOString(),
    version: options.version || '1.0.0',
    source: options.source || 'test-service',
    type: options.type || 'test.event',
    payload: options.payload || ({} as T),
    metadata: options.metadata,
  };
}

/**
 * Creates a base event DTO test fixture with the specified options
 * 
 * @param options - Configuration options for the event DTO
 * @returns A base event DTO object implementing BaseEventDto
 * 
 * @example
 * // Create a basic event DTO with default values
 * const eventDto = createBaseEventDto();
 * 
 * @example
 * // Create an event DTO with custom values
 * const eventDto = createBaseEventDto({
 *   type: 'USER_REGISTERED',
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   data: { email: 'user@example.com' },
 *   journey: 'auth'
 * });
 */
export function createBaseEventDto<T = unknown>(options: BaseEventDtoOptions<T> = {}): BaseEventDto<T> {
  const now = new Date();
  
  return new BaseEventDto<T>({
    type: options.type || 'TEST_EVENT',
    userId: options.userId || uuidv4(),
    data: options.data || ({} as T),
    journey: options.journey,
    timestamp: options.timestamp || now.toISOString(),
  });
}

/**
 * Creates a deterministic event ID based on a seed value
 * 
 * @param options - Options for deterministic ID generation
 * @returns A deterministic UUID that will be consistent for the same input
 * 
 * @example
 * // Generate a deterministic ID
 * const id = createDeterministicEventId({ seed: 'user-123' });
 * 
 * @example
 * // Generate different IDs for the same seed in different contexts
 * const id1 = createDeterministicEventId({ seed: 'test', namespace: 'health' });
 * const id2 = createDeterministicEventId({ seed: 'test', namespace: 'care' });
 * // id1 !== id2
 */
export function createDeterministicEventId(options: DeterministicIdOptions): string {
  // Simple deterministic UUID generation based on seed
  // In a real implementation, you might use a more sophisticated approach
  // like a crypto hash function or UUID v5 with namespace
  const { seed, namespace = 'default' } = options;
  const combinedSeed = `${namespace}:${seed}`;
  
  // Create a deterministic UUID-like string (this is a simplified implementation)
  let hash = 0;
  for (let i = 0; i < combinedSeed.length; i++) {
    const char = combinedSeed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Format as UUID
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hashStr.slice(0, 8)}-${hashStr.slice(0, 4)}-4${hashStr.slice(1, 4)}-${
    (parseInt(hashStr.slice(0, 4), 16) & 0x3fff | 0x8000).toString(16)
  }-${hashStr.slice(0, 12).padStart(12, '0')}`;
}

/**
 * Creates a base event with a specific timestamp
 * 
 * @param timestamp - ISO string or Date object for the event timestamp
 * @param options - Additional event options
 * @returns A base event with the specified timestamp
 * 
 * @example
 * // Create an event with a specific ISO timestamp
 * const event = createEventWithTimestamp('2023-04-15T14:32:17.123Z');
 * 
 * @example
 * // Create an event with a Date object
 * const event = createEventWithTimestamp(new Date('2023-01-01'));
 */
export function createEventWithTimestamp<T = unknown>(
  timestamp: string | Date,
  options: Omit<BaseEventOptions<T>, 'timestamp'> = {}
): IBaseEvent<T> {
  const isoTimestamp = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
  return createBaseEvent<T>({ ...options, timestamp: isoTimestamp });
}

/**
 * Creates a minimal valid base event with only required properties
 * 
 * @param type - Event type identifier
 * @returns A minimal valid base event
 * 
 * @example
 * // Create a minimal health metric event
 * const event = createMinimalEvent('health.metric.recorded');
 */
export function createMinimalEvent<T = unknown>(type: string): IBaseEvent<T> {
  return {
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test',
    type,
    payload: {} as T,
  };
}

/**
 * Creates a batch of events with sequential timestamps
 * 
 * @param count - Number of events to create
 * @param baseOptions - Base options for all events
 * @param intervalMs - Milliseconds between each event timestamp
 * @returns Array of events with sequential timestamps
 * 
 * @example
 * // Create 5 events with timestamps 1 second apart
 * const events = createEventBatch(5, { type: 'test.batch' }, 1000);
 */
export function createEventBatch<T = unknown>(
  count: number,
  baseOptions: BaseEventOptions<T> = {},
  intervalMs: number = 1000
): IBaseEvent<T>[] {
  const events: IBaseEvent<T>[] = [];
  const startTime = baseOptions.timestamp ? new Date(baseOptions.timestamp).getTime() : Date.now();
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(startTime + (i * intervalMs)).toISOString();
    events.push(createBaseEvent<T>({ ...baseOptions, timestamp }));
  }
  
  return events;
}

/**
 * Creates a journey-specific event with appropriate defaults
 * 
 * @param journey - Journey identifier (health, care, plan)
 * @param eventType - Event type specific to the journey
 * @param payload - Event payload
 * @returns A journey-specific base event
 * 
 * @example
 * // Create a health journey event
 * const event = createJourneyEvent('health', 'metric.recorded', { metricType: 'HEART_RATE', value: 75 });
 */
export function createJourneyEvent<T = unknown>(
  journey: 'health' | 'care' | 'plan',
  eventType: string,
  payload: T
): IBaseEvent<T> {
  const journeyMap: Record<string, string> = {
    health: 'health-service',
    care: 'care-service',
    plan: 'plan-service',
  };
  
  return createBaseEvent<T>({
    source: journeyMap[journey],
    type: `${journey}.${eventType}`,
    payload,
    metadata: {
      journey,
      context: { journeyContext: journey },
    },
  });
}

/**
 * Creates a versioned event with compatibility information
 * 
 * @param version - Event schema version
 * @param options - Additional event options
 * @param minConsumerVersion - Minimum consumer version required
 * @param deprecated - Whether this event schema is deprecated
 * @returns A versioned event with compatibility information
 * 
 * @example
 * // Create a versioned event
 * const event = createVersionedEvent('2.0.0', { type: 'user.updated' }, '1.5.0', true);
 */
export function createVersionedEvent<T = unknown>(
  version: string,
  options: BaseEventOptions<T> = {},
  minConsumerVersion?: string,
  deprecated: boolean = false
): IBaseEvent<T> & { minConsumerVersion?: string; deprecated: boolean } {
  return {
    ...createBaseEvent<T>({ ...options, version }),
    minConsumerVersion,
    deprecated,
  };
}
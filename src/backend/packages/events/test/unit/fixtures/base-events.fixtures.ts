/**
 * @file base-events.fixtures.ts
 * @description Provides foundational event fixtures for testing the event processing pipeline.
 * These fixtures serve as the base for all event types across journeys and enable consistent
 * testing of the core event processing pipeline independent of journey-specific logic.
 */

import { BaseEvent, EventMetadata } from '../../../src/interfaces/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Standard valid event with all required fields
 */
export const validBaseEvent: BaseEvent = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  type: 'TEST_EVENT',
  timestamp: '2023-04-15T14:32:17.000Z',
  version: '1.0.0',
  source: 'test-service',
  userId: 'user_123456',
  journey: 'health',
  payload: {
    testProperty: 'test-value',
    numericProperty: 42
  }
};

/**
 * Minimal valid event with only required fields
 */
export const minimalBaseEvent: BaseEvent = {
  eventId: '550e8400-e29b-41d4-a716-446655440001',
  type: 'MINIMAL_EVENT',
  timestamp: '2023-04-15T14:32:17.000Z',
  version: '1.0.0',
  source: 'test-service',
  payload: {}
};

/**
 * Event with complete metadata for testing context handling
 */
export const eventWithFullMetadata: BaseEvent = {
  eventId: '550e8400-e29b-41d4-a716-446655440002',
  type: 'METADATA_EVENT',
  timestamp: '2023-04-15T14:32:17.000Z',
  version: '1.0.0',
  source: 'test-service',
  userId: 'user_123456',
  journey: 'care',
  payload: {
    testProperty: 'test-value'
  },
  metadata: {
    correlationId: 'corr-550e8400-e29b-41d4-a716-446655440000',
    traceId: 'trace-550e8400-e29b-41d4-a716-446655440000',
    spanId: 'span-550e8400-e29b-41d4-a716-446655440000',
    priority: 'high',
    isRetry: false,
    retryCount: 0,
    originalTimestamp: '2023-04-15T14:32:17.000Z',
    customProperty: 'custom-value'
  }
};

/**
 * Event with retry metadata for testing retry handling
 */
export const retryEvent: BaseEvent = {
  eventId: '550e8400-e29b-41d4-a716-446655440003',
  type: 'RETRY_EVENT',
  timestamp: '2023-04-15T14:35:17.000Z',
  version: '1.0.0',
  source: 'test-service',
  userId: 'user_123456',
  journey: 'plan',
  payload: {
    testProperty: 'test-value'
  },
  metadata: {
    correlationId: 'corr-550e8400-e29b-41d4-a716-446655440003',
    isRetry: true,
    retryCount: 2,
    originalTimestamp: '2023-04-15T14:32:17.000Z',
    priority: 'high'
  }
};

/**
 * Collection of events with different priorities for testing priority handling
 */
export const priorityEvents: Record<string, BaseEvent> = {
  high: {
    eventId: '550e8400-e29b-41d4-a716-446655440004',
    type: 'HIGH_PRIORITY_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' },
    metadata: { priority: 'high' }
  },
  medium: {
    eventId: '550e8400-e29b-41d4-a716-446655440005',
    type: 'MEDIUM_PRIORITY_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' },
    metadata: { priority: 'medium' }
  },
  low: {
    eventId: '550e8400-e29b-41d4-a716-446655440006',
    type: 'LOW_PRIORITY_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' },
    metadata: { priority: 'low' }
  },
  none: {
    eventId: '550e8400-e29b-41d4-a716-446655440007',
    type: 'NO_PRIORITY_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' }
  }
};

/**
 * Collection of events for different journeys for testing journey-specific processing
 */
export const journeyEvents: Record<JourneyType | string, BaseEvent> = {
  health: {
    eventId: '550e8400-e29b-41d4-a716-446655440008',
    type: 'HEALTH_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'health-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { metricType: 'HEART_RATE', value: 75, unit: 'bpm' }
  },
  care: {
    eventId: '550e8400-e29b-41d4-a716-446655440009',
    type: 'CARE_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'care-service',
    userId: 'user_123456',
    journey: 'care',
    payload: { appointmentId: 'appt_123', providerId: 'provider_456' }
  },
  plan: {
    eventId: '550e8400-e29b-41d4-a716-446655440010',
    type: 'PLAN_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'plan-service',
    userId: 'user_123456',
    journey: 'plan',
    payload: { claimId: 'claim_123', amount: 150.75 }
  },
  system: {
    eventId: '550e8400-e29b-41d4-a716-446655440011',
    type: 'SYSTEM_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'system',
    payload: { action: 'MAINTENANCE', details: 'Scheduled database maintenance' }
  }
};

/**
 * Collection of events with different versions for testing version compatibility
 */
export const versionedEvents: Record<string, BaseEvent> = {
  current: {
    eventId: '550e8400-e29b-41d4-a716-446655440012',
    type: 'VERSIONED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' }
  },
  newer: {
    eventId: '550e8400-e29b-41d4-a716-446655440013',
    type: 'VERSIONED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.1.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value', newProperty: 'new-value' }
  },
  majorUpgrade: {
    eventId: '550e8400-e29b-41d4-a716-446655440014',
    type: 'VERSIONED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '2.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { updatedProperty: 'updated-value' } // Different schema
  }
};

/**
 * Collection of malformed events for negative testing scenarios
 */
export const malformedEvents: Record<string, Partial<BaseEvent>> = {
  missingEventId: {
    // Missing eventId
    type: 'MALFORMED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' }
  },
  missingType: {
    eventId: '550e8400-e29b-41d4-a716-446655440015',
    // Missing type
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' }
  },
  missingTimestamp: {
    eventId: '550e8400-e29b-41d4-a716-446655440016',
    type: 'MALFORMED_EVENT',
    // Missing timestamp
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' }
  },
  missingVersion: {
    eventId: '550e8400-e29b-41d4-a716-446655440017',
    type: 'MALFORMED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    // Missing version
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' }
  },
  missingSource: {
    eventId: '550e8400-e29b-41d4-a716-446655440018',
    type: 'MALFORMED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    // Missing source
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' }
  },
  missingPayload: {
    eventId: '550e8400-e29b-41d4-a716-446655440019',
    type: 'MALFORMED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health'
    // Missing payload
  },
  invalidTimestampFormat: {
    eventId: '550e8400-e29b-41d4-a716-446655440020',
    type: 'MALFORMED_EVENT',
    timestamp: '2023-04-15 14:32:17', // Invalid format (not ISO)
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' }
  },
  invalidVersionFormat: {
    eventId: '550e8400-e29b-41d4-a716-446655440021',
    type: 'MALFORMED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: 'latest', // Invalid format (not semver)
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: { testProperty: 'test-value' }
  },
  invalidJourney: {
    eventId: '550e8400-e29b-41d4-a716-446655440022',
    type: 'MALFORMED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'invalid-journey', // Invalid journey
    payload: { testProperty: 'test-value' }
  },
  nonObjectPayload: {
    eventId: '550e8400-e29b-41d4-a716-446655440023',
    type: 'MALFORMED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 'user_123456',
    journey: 'health',
    payload: 'not-an-object' as any // Invalid payload type
  },
  nonStringUserId: {
    eventId: '550e8400-e29b-41d4-a716-446655440024',
    type: 'MALFORMED_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    userId: 12345 as any, // Invalid userId type
    journey: 'health',
    payload: { testProperty: 'test-value' }
  }
};

/**
 * Utility function to create a base event with customizable properties
 * @param overrides Properties to override in the base event
 * @returns A new BaseEvent instance with the specified overrides
 */
export function createBaseEvent(overrides: Partial<BaseEvent> = {}): BaseEvent {
  return {
    eventId: overrides.eventId || crypto.randomUUID(),
    type: overrides.type || 'TEST_EVENT',
    timestamp: overrides.timestamp || new Date().toISOString(),
    version: overrides.version || '1.0.0',
    source: overrides.source || 'test-service',
    userId: overrides.userId || 'user_123456',
    journey: overrides.journey || 'health',
    payload: overrides.payload || { testProperty: 'test-value' },
    metadata: overrides.metadata
  };
}

/**
 * Utility function to create event metadata with customizable properties
 * @param overrides Properties to override in the metadata
 * @returns A new EventMetadata instance with the specified overrides
 */
export function createEventMetadata(overrides: Partial<EventMetadata> = {}): EventMetadata {
  return {
    correlationId: overrides.correlationId || `corr-${crypto.randomUUID()}`,
    traceId: overrides.traceId || `trace-${crypto.randomUUID()}`,
    spanId: overrides.spanId || `span-${crypto.randomUUID()}`,
    priority: overrides.priority || 'medium',
    isRetry: overrides.isRetry !== undefined ? overrides.isRetry : false,
    retryCount: overrides.retryCount !== undefined ? overrides.retryCount : 0,
    originalTimestamp: overrides.originalTimestamp || new Date().toISOString(),
    ...overrides
  };
}

/**
 * Creates a batch of events for testing batch processing
 * @param count Number of events to create
 * @param baseOverrides Base overrides to apply to all events
 * @returns Array of BaseEvent instances
 */
export function createEventBatch(count: number, baseOverrides: Partial<BaseEvent> = {}): BaseEvent[] {
  return Array.from({ length: count }, (_, index) => {
    return createBaseEvent({
      ...baseOverrides,
      eventId: baseOverrides.eventId || `batch-event-${crypto.randomUUID()}`,
      type: baseOverrides.type || `BATCH_EVENT_${index + 1}`,
      metadata: {
        ...(baseOverrides.metadata || {}),
        batchIndex: index,
        batchSize: count
      }
    });
  });
}

/**
 * Creates a sequence of events with timestamps in chronological order
 * @param count Number of events to create
 * @param startTime Starting timestamp (defaults to now)
 * @param intervalMs Milliseconds between events
 * @param baseOverrides Base overrides to apply to all events
 * @returns Array of BaseEvent instances with sequential timestamps
 */
export function createChronologicalEvents(
  count: number,
  startTime: Date = new Date(),
  intervalMs: number = 1000,
  baseOverrides: Partial<BaseEvent> = {}
): BaseEvent[] {
  return Array.from({ length: count }, (_, index) => {
    const eventTime = new Date(startTime.getTime() + index * intervalMs);
    return createBaseEvent({
      ...baseOverrides,
      eventId: baseOverrides.eventId || `chrono-event-${crypto.randomUUID()}`,
      type: baseOverrides.type || `CHRONO_EVENT_${index + 1}`,
      timestamp: eventTime.toISOString(),
      metadata: {
        ...(baseOverrides.metadata || {}),
        sequenceNumber: index + 1
      }
    });
  });
}